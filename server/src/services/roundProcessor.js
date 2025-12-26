// ============================================
// FILE: server/src/services/roundProcessor.js
// VERSION: v2.3.0-stable
// PURPOSE: Orquestador Final (Ops + Finanzas + Eventos)
// ============================================

const mongoose = require('mongoose');
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const Product = require('../models/Product');
const Market = require('../models/Market');
const GameSettings = require('../models/GameSettings');

// Servicios
const capacityService = require('./capacityService');
const inventoryService = require('./inventoryService');
const procurementService = require('./procurementService');
const productionService = require('./productionService');
const logisticsService = require('./logisticsService');
const marketEngineV2 = require('./marketEngineV2');
const obsolescenceService = require('./obsolescenceService');
const accountingService = require('./accountingService');
const eventEngine = require('./eventEngine'); // <--- NUEVO

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

exports.processGameRound = async () => {
    console.log(`\n🔄 ROUND PROCESSOR v2.3: Iniciando...`);

    return await withTransaction(async (session) => {
        // 0. CARGAR DATOS
        const settings = await GameSettings.findOne({ isActive: true }).session(session);
        if (!settings) throw new Error("GameSettings missing");
        
        const currentRound = settings.currentRound;
        const activeCompanies = await Company.find({ isBankrupt: false }).session(session);
        
        // INICIALIZAR ACUMULADOR FINANCIERO
        const financialOps = {};
        activeCompanies.forEach(c => {
            financialOps[c._id] = { 
                revenue: 0, cogs: 0, marketing: 0, logistics: 0, obsolescence: 0 
            };
        });

        // =================================================================
        // PASO 1 & 2: CAPACIDAD E INVENTARIO
        // =================================================================
        await capacityService.calculateAndAssignQuotas(activeCompanies);
        
        for (const company of activeCompanies) {
            await inventoryService.processArrivals(company);
            await inventoryService.ageInventory(company);
        }

        // =================================================================
        // PASO 3: OPERACIONES
        // =================================================================
        const allDecisions = await Decision.find({ round: currentRound }).session(session);
        
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

                    await procurementService.processPurchases(decision, company);
                    await productionService.processProduction(decision, company);
                    await logisticsService.processLogistics(decision, company);
                    
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
                const marketResults = await marketEngineV2.calculateSales(market, product, activeCompanies, allDecisions);
                for (const [compId, res] of Object.entries(marketResults)) {
                    if (financialOps[compId]) {
                        financialOps[compId].revenue += res.revenue;
                        financialOps[compId].cogs += res.cogs;
                    }
                }
            }
        }

        // =================================================================
        // PASO 5: CIERRE, CONTABILIDAD Y EVENTOS
        // =================================================================
        for (const company of activeCompanies) {
            // Obsolescencia
            const obsCost = obsolescenceService.calculateObsolescenceCost(company, settings.obsolescencePenaltyRate);
            if (obsCost > 0) {
                financialOps[company._id].obsolescence = obsCost;
                let currentCash = parseFloat(company.cash.toString());
                company.cash = currentCash - obsCost;
            }

            // Reportes Financieros
            await accountingService.closeAccountingRound(
                company, 
                currentRound, 
                financialOps[company._id], 
                session
            );

            company.currentRound += 1;
            await company.save({ session }); 
        }

        // AVANZAR RELOJ GLOBAL
        settings.currentRound += 1;
        await settings.save({ session });

        // GENERAR EVENTOS PARA LA NUEVA RONDA (FUTURO)
        // Pasamos la sesión para que sea atómico
        await eventEngine.triggerEventForNextRound(settings.currentRound, session);

        return { success: true, nextRound: settings.currentRound };
    });
};