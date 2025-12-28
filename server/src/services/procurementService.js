// ============================================
// FILE: server/src/services/procurementService.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Procesar compras aplicando configuración de la Sala
// ============================================

const RawMaterial = require('../models/RawMaterial');

exports.processPurchases = async (decision, company, gameConfig) => {
    let totalCostDeduction = 0;
    
    if (!decision.procurement || decision.procurement.length === 0) {
        return { cost: 0, ethicsBonus: 0 }; 
    }

    console.log(`🛒 PROCUREMENT: Procesando órdenes para ${company.name}...`);

    const rawMaterials = await RawMaterial.find({});
    
    // 1. Obtener modificador de evento de la configuración de la sala
    // Si no existe (ej: versiones viejas), usar 1.0
    const costModifier = (gameConfig.modifiers && gameConfig.modifiers.rawMaterialCost) 
        ? gameConfig.modifiers.rawMaterialCost 
        : 1.0;
    
    if (costModifier !== 1.0) {
        console.log(`   ⚠️ EVENTO ACTIVO: Costo MP ajustado por factor x${costModifier}`);
    }

    // 2. Configuración de Proveedores (Merge defaults con config de sala)
    const supplierConfig = {
        local: { costMultiplier: 1.2, ethicsBonus: 5, leadTime: 1 },
        imported: { costMultiplier: 1.0, ethicsBonus: 0, leadTime: 2 },
        ...(gameConfig.supplierConfig || {})
    };

    const materialMap = {};
    rawMaterials.forEach(rm => {
        materialMap[rm.name] = parseFloat(rm.baseCost.toString());
    });

    let ethicsPointsToAdd = 0;

    for (const order of decision.procurement) {
        if (order.units <= 0) continue;

        const baseCost = materialMap[order.materialType];
        if (!baseCost) continue;

        const sConf = supplierConfig[order.supplierType];
        
        // FÓRMULA FINAL: (Unidades * Base * MultiplicadorProveedor * MultiplicadorEvento)
        const orderCost = order.units * baseCost * sConf.costMultiplier * costModifier;
        const roundsUntilArrival = sConf.leadTime;

        ethicsPointsToAdd += sConf.ethicsBonus;

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