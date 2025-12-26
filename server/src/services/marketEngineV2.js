// ============================================
// FILE: server/src/services/marketEngineV2.js
// VERSION: v2.1.0-instrumented
// PURPOSE: Motor de Ventas con reporte de Revenue y COGS
// ============================================

const Market = require('../models/Market');
const Product = require('../models/Product');
const inventoryService = require('./inventoryService');

/**
 * Calcula ventas y RETORNA resultados financieros por empresa.
 * @returns {Object} Mapa de resultados { companyId: { revenue, cogs, units } }
 */
exports.calculateSales = async (market, product, activeCompanies, allDecisions) => {
    // console.log(`📊 MARKET: ${product.name} en ${market.name}...`); // Log reducido
    
    const randomFactor = 1.0; 
    const totalDemand = market.demandPotential * randomFactor;
    const competitors = [];

    // 1. Preparar Competidores
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
            cogs: 0 // Nuevo campo
        });
    }

    if (competitors.length === 0) return {}; // Nadie vendió

    // 2. Calcular Scores (Simplificado para brevedad, misma lógica previa)
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

    // 3. Asignar Ventas y Calcular Financieros
    const roundResults = {}; // { companyId: { revenue, cogs, units } }

    for (const comp of competitors) {
        let potentialDemand = totalDemand * (comp.score / totalScore);
        
        // Elasticidad y Hard Cap
        if (comp.price > market.priceHardCap) {
            potentialDemand *= Math.pow(market.priceHardCap / comp.price, 4);
        }
        const avgPrice = prices.reduce((a,b) => a+b, 0) / prices.length;
        potentialDemand *= Math.pow(avgPrice / comp.price, market.priceSensitivity);

        const realSales = Math.floor(Math.min(potentialDemand, comp.totalUnits));

        if (realSales > 0) {
            // Consumo FIFO y cálculo de COGS
            const { totalCOGS } = inventoryService.consumeStockFIFO(comp.stock, realSales);
            
            // Actualizar Inventario en Memoria
            comp.company.inventory = comp.company.inventory.filter(
                lot => !(lot.market === market.name && lot.productLine.toString() === product._id.toString())
            );
            const remainingLots = comp.stock.filter(lot => lot.units > 0);
            comp.company.inventory.push(...remainingLots);

            // Actualizar Finanzas
            comp.sales = realSales;
            comp.revenue = realSales * comp.price;
            comp.cogs = totalCOGS; // Guardamos el costo
            
            let currentCash = parseFloat(comp.company.cash.toString());
            comp.company.cash = currentCash + comp.revenue;

            console.log(`   ✅ VENTA: ${comp.company.name} | ${realSales}u @ $${comp.price} | Rev: $${comp.revenue} | COGS: $${comp.cogs.toFixed(2)}`);

            // Guardar en objeto de retorno
            roundResults[comp.company._id] = {
                revenue: comp.revenue,
                cogs: comp.cogs,
                units: realSales
            };
        }
    }

    return roundResults;
};