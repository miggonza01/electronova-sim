// ============================================
// FILE: server/src/services/obsolescenceService.js
// VERSION: v2.1.0-alpha.1
// PURPOSE: Calcular penalizaciones por inventario antiguo
// SPEC REF: 2.2.C - Costo de Obsolescencia
// ============================================

/**
 * Calcula el costo de obsolescencia para una empresa.
 * Regla: Lotes con ageInRounds > 3 pagan un % de su valor.
 * 
 * @param {Object} company - Documento de la empresa
 * @param {Number} penaltyRate - Porcentaje de penalización (ej: 10 para 10%)
 * @returns {Number} Total a deducir (Float)
 */
exports.calculateObsolescenceCost = (company, penaltyRate) => {
    let totalPenalty = 0;
    const rateDecimal = penaltyRate / 100;

    if (company.inventory && company.inventory.length > 0) {
        company.inventory.forEach(lot => {
            // Solo aplica si el lote es "viejo" (> 3 rondas)
            if (lot.ageInRounds > 3) {
                const unitCost = parseFloat(lot.unitCost.toString());
                const lotValue = lot.units * unitCost;
                
                const penalty = lotValue * rateDecimal;
                totalPenalty += penalty;

                console.log(`   ⚠️ OBSOLESCENCIA: Lote ${lot.productLine} en ${lot.market} (Edad ${lot.ageInRounds}) -> Multa: $${penalty.toFixed(2)}`);
            }
        });
    }

    return totalPenalty;
};