// ============================================
// FILE: server/src/services/obsolescenceService.js
// VERSION: v2.4.0-random-events
// PURPOSE: Servicio de Gestión de Obsolescencia de Inventario Mejorado
// CHANGE LOG: Enhanced with batch processing and detailed reporting
// SPEC REF: "2.4 - Costo de Obsolescencia"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

/**
 * Calcula el costo de obsolescencia para una empresa.
 * Regla: Lotes con ageInRounds > 3 pagan un % de su valor.
 * 
 * @param {Object} company - Documento de la empresa
 * @param {Number} penaltyRate - Porcentaje de penalización (ej: 10 para 10%)
 * @returns {Object} Resultado detallado del cálculo
 */
exports.calculateObsolescenceCost = (company, penaltyRate) => {
    console.log(`📦 SERVICE: Calculando Obsolescencia para ${company.name}...`);
    
    let totalPenalty = 0;
    const rateDecimal = penaltyRate / 100;
    const obsolescentLots = [];
    
    try {
        if (company.inventory && company.inventory.length > 0) {
            company.inventory.forEach((lot, index) => {
                // Solo aplica si el lote es "viejo" (> 3 rondas)
                if (lot.ageInRounds > 3) {
                    const unitCost = parseFloat(lot.unitCost.toString());
                    const lotValue = lot.units * unitCost;
                    
                    const penalty = lotValue * rateDecimal;
                    totalPenalty += penalty;
                    
                    obsolescentLots.push({
                        index,
                        productLine: lot.productLine,
                        market: lot.market,
                        units: lot.units,
                        unitCost,
                        ageInRounds: lot.ageInRounds,
                        lotValue,
                        penalty
                    });
                    
                    console.log(`   ⚠️ OBSOLESCENCIA: Lote ${lot.productLine} en ${lot.market} (Edad ${lot.ageInRounds}) -> Multa: $${penalty.toFixed(2)}`);
                }
            });
        }
        
        // Aplicar penalización al cash de la empresa
        if (totalPenalty > 0) {
            const currentCash = parseFloat(company.cash.toString());
            company.cash = currentCash - totalPenalty;
            console.log(`   💸 Cash actualizado: -$${totalPenalty.toFixed(2)}`);
        }
        
        return {
            companyId: company._id,
            companyName: company.name,
            totalPenalty,
            obsolescentLots: obsolescentLots.length,
            lotsProcessed: company.inventory.length,
            details: obsolescentLots
        };
        
    } catch (error) {
        console.error('❌ ERROR calculando obsolescencia:', error);
        throw error;
    }
};

/**
 * Envejecer inventario (incrementar edad en rondas)
 * @param {Object} company - Documento de empresa
 * @returns {Object} Resultado del envejecimiento
 */
exports.ageInventory = (company) => {
    console.log(`⏰ SERVICE: Envejeciendo Inventario para ${company.name}...`);
    
    try {
        let agedLots = 0;
        const inventoryChanges = [];
        
        if (company.inventory && company.inventory.length > 0) {
            company.inventory.forEach((lot, index) => {
                const oldAge = lot.ageInRounds || 0;
                lot.ageInRounds = oldAge + 1;
                agedLots++;
                
                inventoryChanges.push({
                    index,
                    productLine: lot.productLine,
                    market: lot.market,
                    oldAge,
                    newAge: lot.ageInRounds
                });
                
                if (lot.ageInRounds > 3) {
                    console.log(`   ⚠️ Lote ahora obsoleto: ${lot.units}u (${lot.ageInRounds} rondas)`);
                }
            });
        }
        
        console.log(`   📊 ${agedLots} lotes envejecidos`);
        
        return {
            companyId: company._id,
            companyName: company.name,
            agedLots,
            totalLots: company.inventory.length,
            changes: inventoryChanges
        };
        
    } catch (error) {
        console.error('❌ ERROR envejeciendo inventario:', error);
        throw error;
    }
};

/**
 * Procesar obsolescencia para múltiples empresas (batch)
 * @param {Array} companies - Array de empresas
 * @param {Number} penaltyRate - Tasa de penalización
 * @returns {Object} Resultados del procesamiento batch
 */
exports.processBatchObsolescence = (companies, penaltyRate) => {
    console.log(`🔄 SERVICE: Procesando Obsolescencia Batch (${companies.length} empresas)...`);
    
    const results = [];
    let totalCost = 0;
    
    for (const company of companies) {
        try {
            // 1. Envejecer inventario
            const agingResult = exports.ageInventory(company);
            
            // 2. Calcular obsolescencia
            const obsolescenceResult = exports.calculateObsolescenceCost(company, penaltyRate);
            
            totalCost += obsolescenceResult.totalPenalty;
            
            results.push({
                companyId: company._id,
                companyName: company.name,
                aging: agingResult,
                obsolescence: obsolescenceResult
            });
            
        } catch (error) {
            console.error(`❌ ERROR procesando empresa ${company.name}:`, error);
            results.push({
                companyId: company._id,
                companyName: company.name,
                error: error.message
            });
        }
    }
    
    console.log(`📊 RESUMEN OBSELESCENCIA:`);
    console.log(`   - Empresas procesadas: ${results.length}`);
    console.log(`   - Costo total obsolescencia: $${totalCost.toFixed(2)}`);
    
    return {
        penaltyRate,
        totalCost,
        results
    };
};