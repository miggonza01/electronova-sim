// ============================================
// FILE: server/src/services/capacityService.js
// VERSION: v2.0.1-fix
// PURPOSE: Calcular cuotas (Versión In-Memory para evitar WriteConflict)
// ============================================

const GameSettings = require('../models/GameSettings');

/**
 * Calcula la cuota y actualiza el objeto en memoria.
 * NO guarda en BD (eso lo hace el roundProcessor al final).
 * @param {Array} activeCompanies - Array de documentos Mongoose
 */
exports.calculateAndAssignQuotas = async (activeCompanies) => {
    console.log('🏭 SERVICE: Calculando Capacidad de Planta...');

    try {
        const settings = await GameSettings.findOne({ isActive: true });
        if (!settings) throw new Error('GameSettings no encontrados.');

        const totalCapacity = settings.totalProductionCapacity;
        const count = activeCompanies.length;

        if (count === 0) return;

        // División entera
        const quotaPerCompany = Math.floor(totalCapacity / count);

        console.log(`📊 DATOS: Capacidad Total [${totalCapacity}] / Empresas [${count}] = Cuota [${quotaPerCompany}]`);

        // Actualización EN MEMORIA (In-Memory)
        // No hacemos .save() ni .updateMany() aquí para no romper la transacción padre
        activeCompanies.forEach(company => {
            company.productionQuota = quotaPerCompany;
        });

        console.log(`✅ ASIGNACIÓN: Cuota aplicada en memoria a ${count} empresas.`);

    } catch (error) {
        console.error('❌ ERROR en CapacityService:', error);
        throw error;
    }
};