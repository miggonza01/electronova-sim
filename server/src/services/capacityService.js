// ============================================
// FILE: server/src/services/capacityService.js
// VERSION: v2.4.0-random-events
// PURPOSE: Calcular cuotas con eventos aleatorios integrados
// CHANGE LOG: Added random events integration and capacity modifiers
// SPEC REF: "2.3 - Capacidad de Producción Compartida" y "4.2 - Eventos Aleatorios"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

/**
 * Calcula la cuota y actualiza el objeto en memoria con modificadores de eventos.
 * @param {Array} activeCompanies - Array de documentos Mongoose
 * @param {Number} totalCapacity - Capacidad total definida en la Sala (Game)
 * @param {Object} game - Objeto Game completo (para eventos aleatorios)
 */
exports.calculateAndAssignQuotas = async (activeCompanies, totalCapacity, game = null) => {
    console.log('🏭 SERVICE: Calculando Capacidad de Planta...');

    try {
        const count = activeCompanies.length;

        if (count === 0) return;

        // 1. Verificar eventos aleatorios que afecten la capacidad
        let capacityModifier = 1.0;
        let currentEvent = null;
        
        if (game && game.eventHistory && game.eventHistory.length > 0) {
            // Buscar eventos activos para la ronda actual
            const currentRound = game.currentRound;
            const activeEvents = game.eventHistory.filter(event => {
                return event.round === currentRound || 
                       (event.round + 1 >= currentRound && currentRound - event.round <= 2);
            });
            
            if (activeEvents.length > 0) {
                currentEvent = activeEvents[activeEvents.length - 1];
                if (currentEvent.modifiers && currentEvent.modifiers.productionCapacity) {
                    capacityModifier = currentEvent.modifiers.productionCapacity;
                }
            }
        }

        // 2. Calcular capacidad total con modificadores
        const modifiedCapacity = Math.floor(totalCapacity * capacityModifier);
        
        // 3. Calcular cuota por empresa
        const quotaPerCompany = Math.floor(modifiedCapacity / count);

        // 4. Logging de modificadores
        if (capacityModifier !== 1.0) {
            console.log(`⚠️ MODIFICADOR CAPACIDAD:`);
            console.log(`   - Evento: x${capacityModifier} (${currentEvent ? currentEvent.eventName : 'Desconocido'})`);
            console.log(`   - Capacidad: ${totalCapacity} → ${modifiedCapacity}`);
        }

        console.log(`📊 DATOS: Capacidad [${modifiedCapacity}] / Empresas [${count}] = Cuota [${quotaPerCompany}]`);

        // 5. Actualización EN MEMORIA
        activeCompanies.forEach(company => {
            company.productionQuota = quotaPerCompany;
        });

        console.log(`✅ ASIGNACIÓN: Cuota aplicada en memoria a ${count} empresas.`);

    } catch (error) {
        console.error('❌ ERROR en CapacityService:', error);
        throw error;
    }
};

/**
 * Validar que la producción planificada no exceda la cuota asignada.
 * @param {Object} company - Empresa con cuota asignada
 * @param {Array} productionPlan - Plan de producción (productos y unidades)
 * @returns {Object} Resultado de validación
 */
exports.validateProductionQuota = (company, productionPlan) => {
    try {
        const totalPlanned = productionPlan.reduce((sum, item) => sum + item.units, 0);
        const quota = company.productionQuota || 0;
        
        const isWithinQuota = totalPlanned <= quota;
        const overQuota = Math.max(0, totalPlanned - quota);
        
        return {
            isValid: isWithinQuota,
            plannedUnits: totalPlanned,
            quotaLimit: quota,
            overQuotaUnits: overQuota,
            utilizationRate: quota > 0 ? (totalPlanned / quota) * 100 : 0
        };
        
    } catch (error) {
        console.error('❌ ERROR validando cuota de producción:', error);
        throw error;
    }
};