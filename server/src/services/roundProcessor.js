// ============================================
// FILE: server/src/services/roundProcessor.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Orquestador Final (Soporte Multi-Sala)
// ============================================

const mongoose = require('mongoose');
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const Product = require('../models/Product');
const Market = require('../models/Market');
const Game = require('../models/Game');

// Servicios
const capacityService = require('./capacityService');
const inventoryService = require('./inventoryService');
const procurementService = require('./procurementService');
const productionService = require('./productionService');
const logisticsService = require('./logisticsService');
const marketEngineV2 = require('./marketEngineV2');
const obsolescenceService = require('./obsolescenceService');
const accountingService = require('./accountingService');
const eventEngine = require('./eventEngine');

const withTransaction = async (work) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await work(session);
        await session.commitTransaction();
        console.log('💾 Transacción commiteada exitosamente.');
        return result;
    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Transacción abortada:', error.message);
        throw error;
    } finally {
        session.endSession();
    }
};

exports.processGameRound = async (gameId) => {
    console.log(`\n🔄 ROUND PROCESSOR MULTIPLAYER: Iniciando para Game ID ${gameId}...`);

    return await withTransaction(async (session) => {
        // 0. CARGAR JUEGO
        const game = await Game.findById(gameId).session(session);
        if (!game) throw new Error("Game not found");
        
        const currentRound = game.currentRound;
        const activeCompanies = await Company.find({ gameId: game._id, isBankrupt: false }).session(session);
        
        console.log(`📅 Procesando Ronda ${currentRound} para sala ${game.code} (${activeCompanies.length} empresas)...`);

        // Extraer configuración para pasarla a los servicios
        const gameConfig = game.config;

        // Inicializar acumulador financiero
        const financialOps = {};
        activeCompanies.forEach(c => {
            financialOps[c._id] = { revenue: 0, cogs: 0, marketing: 0, logistics: 0, obsolescence: 0 };
        });

        // =================================================================
        // PASO 1 & 2: CAPACIDAD E INVENTARIO
        // =================================================================
        await capacityService.calculateAndAssignQuotas(activeCompanies, gameConfig.totalProductionCapacity);
        
        for (const company of activeCompanies) {
            await inventoryService.processArrivals(company);
            await inventoryService.ageInventory(company);
        }

        // =================================================================
        // PASO 3: OPERACIONES
        // =================================================================
        const allDecisions = await Decision.find({ 
            companyId: { $in: activeCompanies.map(c => c._id) }, 
            round: currentRound 
        }).session(session);
        
        for (const company of activeCompanies) {
            const decision = allDecisions.find(d => d.companyId.toString() === company._id.toString());
            if (decision) {
                try {
                    if (decision.commercial) {
                        const totalMarketing = decision.commercial.reduce((sum, c) => sum + (c.marketingBudget || 0), 0);
                        financialOps[company._id].marketing += totalMarketing;
                        let currentCash = parseFloat(company.cash.toString());
                        company.cash = currentCash - totalMarketing;
                    }

                    // Pasamos gameConfig a los servicios que lo necesitan
                    await procurementService.processPurchases(decision, company, gameConfig);
                    await productionService.processProduction(decision, company);
                    await logisticsService.processLogistics(decision, company, gameConfig);
                    
                } catch (e) {
                    console.error(`Error Ops ${company.name}: ${e.message}`);
                }
            }
        }

        // =================================================================
        // PASO 4: MERCADO
        // =================================================================
        const markets = await Market.find({}).session(session);
        const products = await Product.find({}).session(session);

        for (const market of markets) {
            for (const product of products) {
                const marketResults = await marketEngineV2.calculateSales(market, product, activeCompanies, allDecisions, gameConfig);
                for (const [compId, res] of Object.entries(marketResults)) {
                    if (financialOps[compId]) {
                        financialOps[compId].revenue += res.revenue;
                        financialOps[compId].cogs += res.cogs;
                    }
                }
            }
        }

        // =================================================================
        // PASO 5: CIERRE
        // =================================================================
        for (const company of activeCompanies) {
            const obsCost = obsolescenceService.calculateObsolescenceCost(company, gameConfig.obsolescencePenaltyRate);
            if (obsCost > 0) {
                financialOps[company._id].obsolescence = obsCost;
                let currentCash = parseFloat(company.cash.toString());
                company.cash = currentCash - obsCost;
            }

            await accountingService.closeAccountingRound(
                company, 
                currentRound, 
                financialOps[company._id], 
                session
            );

            company.currentRound += 1;
            await company.save({ session }); 
        }

        // EVENTOS Y AVANCE
        // Pasamos el objeto 'game' completo para que eventEngine modifique game.config.modifiers
        await eventEngine.triggerEventForNextRound(game, session);

        game.currentRound += 1;
        await game.save({ session });

        return { success: true, nextRound: game.currentRound };
    });
};