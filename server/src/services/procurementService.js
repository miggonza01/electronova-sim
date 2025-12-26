// ============================================
// FILE: server/src/services/procurementService.js
// VERSION: v2.2.0-events
// PURPOSE: Procesar compras aplicando modificadores de eventos
// ============================================

const RawMaterial = require('../models/RawMaterial');
const GameSettings = require('../models/GameSettings');

exports.processPurchases = async (decision, company) => {
    let totalCostDeduction = 0;
    
    if (!decision.procurement || decision.procurement.length === 0) {
        return { cost: 0 }; 
    }

    console.log(`🛒 PROCUREMENT: Procesando órdenes para ${company.name}...`);

    const settings = await GameSettings.findOne({ isActive: true });
    const rawMaterials = await RawMaterial.find({});
    
    // Obtener modificador de evento (Default 1.0)
    const costModifier = settings.currentModifiers ? settings.currentModifiers.rawMaterialCost : 1.0;
    
    if (costModifier !== 1.0) {
        console.log(`   ⚠️ EVENTO ACTIVO: Costo MP ajustado por factor x${costModifier}`);
    }

    const materialMap = {};
    rawMaterials.forEach(rm => {
        materialMap[rm.name] = parseFloat(rm.baseCost.toString());
    });

    let ethicsPointsToAdd = 0;

    for (const order of decision.procurement) {
        if (order.units <= 0) continue;

        const baseCost = materialMap[order.materialType];
        if (!baseCost) continue;

        const supplierConfig = settings.supplierConfig[order.supplierType];
        
        // FÓRMULA FINAL: (Unidades * Base * MultiplicadorProveedor * MultiplicadorEvento)
        const orderCost = order.units * baseCost * supplierConfig.costMultiplier * costModifier;
        const roundsUntilArrival = supplierConfig.leadTime;

        ethicsPointsToAdd += supplierConfig.ethicsBonus;

        company.inTransit.materials.push({
            materialType: order.materialType,
            supplierType: order.supplierType,
            units: order.units,
            totalCost: orderCost,
            roundsUntilArrival: roundsUntilArrival
        });

        totalCostDeduction += orderCost;
    }

    let currentCash = parseFloat(company.cash.toString());
    company.cash = currentCash - totalCostDeduction;
    company.ethicsIndex = Math.min(100, company.ethicsIndex + ethicsPointsToAdd);

    console.log(`   💰 Compras Total: -$${totalCostDeduction.toFixed(2)}`);

    return { 
        cost: totalCostDeduction,
        ethicsBonus: ethicsPointsToAdd
    };
};