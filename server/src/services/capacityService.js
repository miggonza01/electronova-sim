// ============================================
// FILE: server/src/services/capacityService.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Calcular cuotas (In-Memory, Stateless)
// ============================================

/**
 * Calcula la cuota y actualiza el objeto en memoria.
 * @param {Array} activeCompanies - Array de documentos Mongoose
 * @param {Number} totalCapacity - Capacidad total definida en la Sala (Game)
 */
exports.calculateAndAssignQuotas = async (activeCompanies, totalCapacity) => {
    console.log('🏭 SERVICE: Calculando Capacidad de Planta...');

    try {
        const count = activeCompanies.length;

        if (count === 0) return;

        // División entera
        const quotaPerCompany = Math.floor(totalCapacity / count);

        console.log(`📊 DATOS: Capacidad Total [${totalCapacity}] / Empresas [${count}] = Cuota [${quotaPerCompany}]`);

        // Actualización EN MEMORIA
        activeCompanies.forEach(company => {
            company.productionQuota = quotaPerCompany;
        });

        console.log(`✅ ASIGNACIÓN: Cuota aplicada en memoria a ${count} empresas.`);

    } catch (error) {
        console.error('❌ ERROR en CapacityService:', error);
        throw error;
    }
};