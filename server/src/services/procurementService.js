// ============================================
// FILE: server/src/services/procurementService.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Procesar compras de MP (Costos, Lead Time, Ética)
// SPEC REF: 2.2.B - Sistema de Compras
// ============================================

const RawMaterial = require('../models/RawMaterial');
const GameSettings = require('../models/GameSettings');

/**
 * Procesa las decisiones de compra de una empresa.
 * @param {Object} decision - Documento de decisión completo
 * @param {Object} company - Documento de la empresa (se modificará in-situ)
 */
exports.processPurchases = async (decision, company) => {
    // 1. Validar si hay compras
    if (!decision.procurement || decision.procurement.length === 0) return;

    console.log(`🛒 PROCUREMENT: Procesando ${decision.procurement.length} órdenes para ${company.name}...`);

    // 2. Cargar Datos Maestros (Settings y Precios Base)
    const settings = await GameSettings.findOne({ isActive: true });
    const rawMaterials = await RawMaterial.find({});
    
    // Mapa rápido para buscar precio base por nombre: { 'Alfa': 15.00, ... }
    const materialMap = {};
    rawMaterials.forEach(rm => {
        materialMap[rm.name] = parseFloat(rm.baseCost.toString());
    });

    let totalCostDeduction = 0;
    let ethicsPointsToAdd = 0;

    // 3. Iterar sobre cada orden de compra
    for (const order of decision.procurement) {
        if (order.units <= 0) continue;

        const baseCost = materialMap[order.materialType];
        if (!baseCost) throw new Error(`Material desconocido: ${order.materialType}`);

        // Obtener configuración del proveedor (Local vs Importado)
        const supplierConfig = settings.supplierConfig[order.supplierType];
        
        // CÁLCULO DE COSTO: (Unidades * CostoBase * Multiplicador)
        const orderCost = order.units * baseCost * supplierConfig.costMultiplier;
        
        // CÁLCULO DE TIEMPO: Lead Time
        const roundsUntilArrival = supplierConfig.leadTime;

        // CÁLCULO DE ÉTICA (Solo aplica por lote comprado, según PDF)
        // PDF dice: "impacto_ético = +5 puntos por lote comprado" (Local)
        ethicsPointsToAdd += supplierConfig.ethicsBonus;

        // 4. Crear el Lote en Tránsito (InboundMaterial)
        company.inTransit.materials.push({
            materialType: order.materialType,
            supplierType: order.supplierType,
            units: order.units,
            totalCost: orderCost, // Guardamos el costo total del lote para contabilidad futura
            roundsUntilArrival: roundsUntilArrival
        });

        totalCostDeduction += orderCost;
        
        console.log(`   + Orden: ${order.units}u ${order.materialType} (${order.supplierType}) -> Costo: $${orderCost} | Llega en: ${roundsUntilArrival} rondas`);
    }

    // 5. Aplicar Impactos Financieros y Éticos Inmediatos
    // Restamos el dinero ahora (Criterio conservador: Pago contra pedido)
    let currentCash = parseFloat(company.cash.toString());
    company.cash = currentCash - totalCostDeduction;

    // Sumamos ética (tope 100)
    company.ethicsIndex = Math.min(100, company.ethicsIndex + ethicsPointsToAdd);

    console.log(`   💰 Total Compras: -$${totalCostDeduction} | Ética: +${ethicsPointsToAdd}`);
};