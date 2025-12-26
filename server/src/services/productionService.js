// ============================================
// FILE: server/src/services/productionService.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Ejecutar órdenes de manufactura (Consumo MP -> Alta PT)
// SPEC REF: 2.2.A (Cuota) y 2.1 (Fórmulas)
// ============================================

const Product = require('../models/Product');

/**
 * Valida y ejecuta la producción planificada.
 * @param {Object} decision - Objeto de decisión
 * @param {Object} company - Documento de la empresa (se muta in-situ)
 */
exports.processProduction = async (decision, company) => {
    if (!decision.production || decision.production.length === 0) return;

    console.log(`🏭 PRODUCTION: Procesando manufactura para ${company.name}...`);

    // 1. Validar Cuota Total (Regla 2.2.A)
    const totalUnitsToProduce = decision.production.reduce((sum, item) => sum + item.units, 0);
    if (totalUnitsToProduce > company.productionQuota) {
        throw new Error(`VIOLACIÓN DE REGLA: Intentas producir ${totalUnitsToProduce}u pero tu cuota es ${company.productionQuota}u.`);
    }

    // Cargar catálogo de productos para ver fórmulas
    const products = await Product.find({});
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Mapa de inventario de MP para acceso rápido
    // Convertimos el array de subdocumentos en un Map: 'Alfa' -> { units: 100, cost: 15.00 }
    const materialStock = {};
    company.rawMaterials.forEach(rm => {
        materialStock[rm.materialType] = {
            units: rm.units,
            averageCost: parseFloat(rm.averageCost.toString())
        };
    });

    // 2. Ejecutar Producción por Línea
    for (const order of decision.production) {
        if (order.units <= 0) continue;

        const productInfo = productMap.get(order.productLine.toString());
        if (!productInfo) throw new Error(`Producto ID inválido en decisión`);

        // A. Verificar Disponibilidad de Materiales (La Receta)
        let materialsCostPerUnit = 0;

        // Simulamos consumo primero para ver si alcanza
        for (const req of productInfo.rawMaterialRequirements) {
            const neededTotal = req.quantity * order.units;
            const stock = materialStock[req.materialType];

            if (!stock || stock.units < neededTotal) {
                console.warn(`⚠️ FALLO PRODUCCIÓN: Falta ${req.materialType} para producir ${productInfo.name}. Orden omitida.`);
                // En un juego real, podríamos producir parcialmente o cancelar. Aquí cancelamos la línea.
                order.units = 0; 
                break; 
            }
        }

        if (order.units === 0) continue; // Si se canceló por falta de stock

        // B. Consumir Materiales y Calcular Costo
        for (const req of productInfo.rawMaterialRequirements) {
            const neededTotal = req.quantity * order.units;
            
            // Restar del stock virtual
            materialStock[req.materialType].units -= neededTotal;
            
            // Restar del documento real de la empresa
            const dbMaterial = company.rawMaterials.find(m => m.materialType === req.materialType);
            dbMaterial.units -= neededTotal;

            // Sumar al costo del producto (Costo MP)
            materialsCostPerUnit += (req.quantity * materialStock[req.materialType].averageCost);
        }

        // C. Calcular Costo Final Unitario
        // Costo = (Materiales) + (Base Manufactura definido en Product)
        const baseManufCost = parseFloat(productInfo.baseProductionCost.toString());
        const finalUnitCost = materialsCostPerUnit + baseManufCost;

        // D. Agregar a Factory Stock (Inventario de PT en planta)
        const existingStock = company.factoryStock.find(fs => fs.productLine.toString() === productInfo._id.toString());

        if (existingStock) {
            // Recalcular promedio ponderado del stock existente
            const currentTotalValue = existingStock.units * parseFloat(existingStock.unitCost.toString());
            const newBatchValue = order.units * finalUnitCost;
            const newTotalUnits = existingStock.units + order.units;
            
            existingStock.unitCost = (currentTotalValue + newBatchValue) / newTotalUnits;
            existingStock.units = newTotalUnits;
        } else {
            company.factoryStock.push({
                productLine: productInfo._id,
                units: order.units,
                unitCost: finalUnitCost
            });
        }

        console.log(`   ✅ Fabricado: ${order.units}u ${productInfo.name} | Costo Unit: $${finalUnitCost.toFixed(2)} ($${materialsCostPerUnit.toFixed(2)} MP + $${baseManufCost} Base)`);
    }
};