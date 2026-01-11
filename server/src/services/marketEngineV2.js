// ============================================
// FILE: server/src/services/marketEngineV2.js
// VERSION: v2.4.0-random-events
// PURPOSE: Motor de Ventas con Eventos Aleatorios Integrados
// CHANGE LOG: Added random events integration and capacity service coupling
// SPEC REF: "3.1 - Motor de Mercado" y "4.2 - Eventos Aleatorios"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const Market = require('../models/Market');
const Product = require('../models/Product');
const inventoryService = require('./inventoryService');
const capacityService = require('./capacityService');
const randomEventService = require('./randomEventService');

/**
 * Calcula ventas y RETORNA resultados financieros por empresa.
 * @param {Object} market - Mercado objetivo
 * @param {Object} product - Producto a vender
 * @param {Array} activeCompanies - Empresas participantes
 * @param {Array} allDecisions - Decisiones de todas las empresas
 * @param {Object} gameConfig - Configuración específica de la sala
 * @param {Object} game - Objeto Game completo (para eventos aleatorios)
 */
exports.calculateSales = async (market, product, activeCompanies, allDecisions, gameConfig, game = null) => {
    
    // 1. Obtener Modificador de Demanda desde la Config del Juego
    const demandModifier = (gameConfig.modifiers && gameConfig.modifiers.demand) 
        ? gameConfig.modifiers.demand 
        : 1.0;

    // 2. Verificar eventos aleatorios activos que afecten la demanda
    let eventModifier = 1.0;
    let currentEvent = null;
    
    if (game && game.eventHistory && game.eventHistory.length > 0) {
        // Buscar eventos activos para la ronda actual
        const currentRound = game.currentRound;
        const activeEvents = game.eventHistory.filter(event => {
            // Eventos de duración múltiple podrían estar activos
            return event.round === currentRound || 
                   (event.round + 1 >= currentRound && currentRound - event.round <= 2); // Duración máxima de 2 rondas
        });
        
        if (activeEvents.length > 0) {
            currentEvent = activeEvents[activeEvents.length - 1]; // Evento más reciente
            if (currentEvent.modifiers && currentEvent.modifiers.demand) {
                eventModifier = currentEvent.modifiers.demand;
            }
        }
    }

    // 3. Calcular demanda total con todos los modificadores
    const totalDemand = market.demandPotential * demandModifier * eventModifier;

    // 4. Logging de modificadores
    if (demandModifier !== 1.0 || eventModifier !== 1.0) {
        console.log(`   ⚠️ MODIFICADORES DEMANDA:`);
        if (demandModifier !== 1.0) {
            console.log(`   - Config: x${demandModifier}`);
        }
        if (eventModifier !== 1.0) {
            console.log(`   - Evento: x${eventModifier} (${currentEvent ? currentEvent.eventName : 'Desconocido'})`);
        }
        console.log(`   - Demanda Final: ${market.demandPotential} → ${totalDemand.toFixed(0)}`);
    }

    const competitors = [];

    // 2. Preparar Competidores
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

    // 3. Calcular Scores
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

    // 4. Asignar Ventas
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

            console.log(`   ✅ VENTA: ${comp.company.name} | ${realSales}u @ $${comp.price} | Rev: $${comp.revenue.toFixed(2)}`);

            roundResults[comp.company._id] = {
                revenue: comp.revenue,
                cogs: comp.cogs,
                units: realSales
            };
        }
    }

    return roundResults;
};