// ============================================
// FILE: server/src/services/roundProcessor.js
// VERSION: v2.0.1-fix
// PURPOSE: Orquestador con manejo de transacciones robusto
// ============================================

const mongoose = require('mongoose');
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const Product = require('../models/Product');
const Market = require('../models/Market');
const GameSettings = require('../models/GameSettings');

const capacityService = require('./capacityService');
const inventoryService = require('./inventoryService');
const procurementService = require('./procurementService');
const productionService = require('./productionService');
const logisticsService = require('./logisticsService');
const marketEngineV2 = require('./marketEngineV2');

// Wrapper para reintentar transacciones en caso de error temporal
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
        // Si es un error de conflicto de escritura temporal, MongoDB sugiere reintentar
        // Aquí simplificamos lanzando el error para verlo
        console.error('❌ Transacción abortada:', error.message);
        throw error;
    } finally {
        session.endSession();
    }
};

exports.processGameRound = async () => {
    console.log(`\n🔄 ROUND PROCESSOR v2: Iniciando...`);

    return await withTransaction(async (session) => {
        // 0. CARGAR DATOS (Dentro de la sesión para consistencia)
        const settings = await GameSettings.findOne({ isActive: true }).session(session);
        if (!settings) throw new Error("GameSettings missing");
        
        const currentRound = settings.currentRound;
        console.log(`📅 Procesando Ronda ${currentRound}...`);

        const activeCompanies = await Company.find({ isBankrupt: false }).session(session);
        
        // =================================================================
        // PASO 1: CAPACIDAD (In-Memory)
        // =================================================================
        // Pasamos el array de empresas para que se modifique en RAM
        await capacityService.calculateAndAssignQuotas(activeCompanies);

        // =================================================================
        // PASO 2: INVENTARIO (Llegadas)
        // =================================================================
        for (const company of activeCompanies) {
            await inventoryService.processArrivals(company);
            await inventoryService.ageInventory(company);
        }

        // =================================================================
        // PASO 3: OPERACIONES (Decisiones)
        // =================================================================
        const allDecisions = await Decision.find({ round: currentRound }).session(session);
        
        for (const company of activeCompanies) {
            const decision = allDecisions.find(d => d.companyId.toString() === company._id.toString());
            if (decision) {
                try {
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
                await marketEngineV2.calculateSales(market, product, activeCompanies, allDecisions);
            }
        }

        // =================================================================
        // PASO 5: GUARDADO MASIVO (Atomic Commit)
        // =================================================================
        // Aquí ocurre la magia: Guardamos todos los cambios acumulados de una sola vez
        for (const company of activeCompanies) {
            company.currentRound += 1;
            // Mongoose sabe qué campos cambiaron y genera el $set óptimo
            await company.save({ session }); 
        }

        settings.currentRound += 1;
        await settings.save({ session });

        return { success: true, nextRound: settings.currentRound };
    });
};