// ============================================
// FILE: server/src/services/marketEngineV2.js
// VERSION: v2.2.0-events
// PURPOSE: Motor de Ventas con sensibilidad a Eventos de Demanda
// ============================================

const Market = require('../models/Market');
const Product = require('../models/Product');
const GameSettings = require('../models/GameSettings'); // Nuevo import
const inventoryService = require('./inventoryService');

exports.calculateSales = async (market, product, activeCompanies, allDecisions) => {
    // 1. Obtener Modificador de Demanda
    // Nota: Para optimización, idealmente pasaríamos 'settings' como argumento,
    // pero para mantener la firma simple en v2 lo buscamos aquí (cacheado por Mongoose usualmente).
    const settings = await GameSettings.findOne({ isActive: true });
    const demandModifier = settings.currentModifiers ? settings.currentModifiers.demand : 1.0;

    const randomFactor = 1.0; 
    
    // FÓRMULA DEMANDA: Base * Random * Evento
    const totalDemand = market.demandPotential * randomFactor * demandModifier;

    if (demandModifier !== 1.0) {
        // console.log(`   ⚠️ EVENTO MERCADO: Demanda ajustada x${demandModifier}`);
    }

    const competitors = [];

    // --- (El resto del código es idéntico al anterior, solo cambia el cálculo de totalDemand arriba) ---
    // Copia la lógica de iteración de competidores, scores y asignación del paso 2.3
    // Para no hacerte copiar y pegar gigante, aquí está el bloque resumido:

    for (const company of activeCompanies) {
        const decision = allDecisions.find(d => d.companyId.toString() === company._id.toString());
        let price = 0;
        let marketing = 0;

        if (decision && decision.commercial) {
            const commData = decision.commercial.find(c => c.market === market.name);
            if (commData) {
                marketing = commData.marketingBudget;
                const priceData = commData.prices.find(p => p.productLine.toString() === product._id.toString());
                if (priceData) price = priceData.price;
            }
        }

        const availableStock = company.inventory.filter(
            lot => lot.market === market.name && lot.productLine.toString() === product._id.toString()
        );
        const totalUnitsAvailable = availableStock.reduce((sum, lot) => sum + lot.units, 0);

        if (price <= 0 || totalUnitsAvailable <= 0) continue;

        competitors.push({
            company,
            price,
            marketing,
            stock: availableStock,
            totalUnits: totalUnitsAvailable,
            techLevel: company.techLevel,
            ethics: company.ethicsIndex,
            score: 0,
            sales: 0,
            revenue: 0,
            cogs: 0
        });
    }

    if (competitors.length === 0) return {};

    const prices = competitors.map(c => c.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    competitors.forEach(comp => {
        const scorePrice = (maxPrice - comp.price) / priceRange;
        const scoreMarketing = (1 + Math.log10(comp.marketing + 1)) * 0.15;
        const scoreQuality = comp.techLevel / 10;
        const scoreEthics = comp.ethics / 100;

        comp.score = (scorePrice * market.params.w_price) +
                     (scoreQuality * market.params.w_quality) +
                     (scoreMarketing * market.params.w_marketing) +
                     (scoreEthics * market.params.w_ethics);
    });

    const totalScore = competitors.reduce((sum, c) => sum + c.score, 0) || 1;
    const roundResults = {};

    for (const comp of competitors) {
        let potentialDemand = totalDemand * (comp.score / totalScore);
        
        if (comp.price > market.priceHardCap) {
            potentialDemand *= Math.pow(market.priceHardCap / comp.price, 4);
        }
        const avgPrice = prices.reduce((a,b) => a+b, 0) / prices.length;
        potentialDemand *= Math.pow(avgPrice / comp.price, market.priceSensitivity);

        const realSales = Math.floor(Math.min(potentialDemand, comp.totalUnits));

        if (realSales > 0) {
            const { totalCOGS } = inventoryService.consumeStockFIFO(comp.stock, realSales);
            
            comp.company.inventory = comp.company.inventory.filter(
                lot => !(lot.market === market.name && lot.productLine.toString() === product._id.toString())
            );
            const remainingLots = comp.stock.filter(lot => lot.units > 0);
            comp.company.inventory.push(...remainingLots);

            comp.sales = realSales;
            comp.revenue = realSales * comp.price;
            comp.cogs = totalCOGS;
            
            let currentCash = parseFloat(comp.company.cash.toString());
            comp.company.cash = currentCash + comp.revenue;

            console.log(`   ✅ VENTA: ${comp.company.name} | ${realSales}u @ $${comp.price} | Rev: $${comp.revenue} (Demanda Global: ${totalDemand.toFixed(0)})`);

            roundResults[comp.company._id] = {
                revenue: comp.revenue,
                cogs: comp.cogs,
                units: realSales
            };
        }
    }

    return roundResults;
};