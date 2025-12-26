// ============================================
// FILE: server/src/services/logisticsService.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Gestionar envíos de PT a los mercados (Factory -> Transit)
// SPEC REF: 2.1 (Plazas) y 2.2 (Tránsito PT)
// ============================================

const COST_AIR = 15.00;   // Costo por unidad Aéreo
const COST_GROUND = 5.00; // Costo por unidad Terrestre
const TIME_AIR = 1;       // Rondas para llegar
const TIME_GROUND = 2;    // Rondas para llegar

/**
 * Procesa los envíos logísticos.
 * @param {Object} decision - Objeto de decisión
 * @param {Object} company - Documento de la empresa (se muta in-situ)
 */
exports.processLogistics = async (decision, company) => {
    if (!decision.logistics || decision.logistics.length === 0) return;

    console.log(`🚚 LOGISTICS: Procesando envíos para ${company.name}...`);

    let totalShippingCost = 0;

    // 1. Agrupar envíos por Producto para validar stock total necesario
    // (Si intentas enviar 100 a Norte y 100 a Sur, necesitas 200 en fábrica)
    const shipmentsByProduct = {};

    for (const shipment of decision.logistics) {
        if (shipment.units <= 0) continue;
        
        const pId = shipment.productLine.toString();
        if (!shipmentsByProduct[pId]) shipmentsByProduct[pId] = [];
        shipmentsByProduct[pId].push(shipment);
    }

    // 2. Procesar por Línea de Producto
    for (const [productId, shipments] of Object.entries(shipmentsByProduct)) {
        // Buscar stock en fábrica
        const factoryItem = company.factoryStock.find(fs => fs.productLine.toString() === productId);
        
        if (!factoryItem) {
            console.warn(`⚠️ LOGÍSTICA FALLIDA: No hay stock en fábrica para producto ID ${productId}`);
            continue;
        }

        const totalNeeded = shipments.reduce((sum, s) => sum + s.units, 0);

        // Validación de Stock
        if (factoryItem.units < totalNeeded) {
            console.warn(`⚠️ STOCK INSUFICIENTE: Pedido ${totalNeeded}u, Disponible ${factoryItem.units}u. Se enviará solo lo disponible (prorrateado).`);
            // Aquí podríamos implementar lógica de prorrateo complejo. 
            // Por simplicidad v2.0: Cancelamos los envíos de este producto para no romper la integridad.
            continue; 
        }

        // Ejecutar Envíos
        for (const shipment of shipments) {
            // Determinar costos y tiempos
            const isAir = shipment.method === 'aereo';
            const shippingCostPerUnit = isAir ? COST_AIR : COST_GROUND;
            const rounds = isAir ? TIME_AIR : TIME_GROUND;
            
            const shipmentTotalCost = shipment.units * shippingCostPerUnit;
            
            // A. Restar de Fábrica
            factoryItem.units -= shipment.units;

            // B. Crear Lote en Tránsito (OutboundProductSchema)
            // Nota: El 'unitCost' aquí es el costo de producción + costo de envío acumulado?
            // Generalmente en contabilidad, el flete se puede capitalizar o gastar.
            // Para simplificar el margen por producto: Capitalizamos el flete en el costo del producto en destino.
            const currentUnitCost = parseFloat(factoryItem.unitCost.toString());
            const landedCost = currentUnitCost + shippingCostPerUnit;

            company.inTransit.products.push({
                productLine: shipment.productLine,
                destination: shipment.destination,
                units: shipment.units,
                unitCost: landedCost, // Costo Producción + Envío
                roundsUntilArrival: rounds
            });

            totalShippingCost += shipmentTotalCost;
            
            console.log(`   ✈️ Enviando ${shipment.units}u a ${shipment.destination} (${shipment.method}). Costo Logístico: $${shipmentTotalCost}`);
        }
    }

    // 3. Cobrar Costos Logísticos (Cash)
    // Aunque capitalizamos el costo en el inventario, el CASH sale de la caja ahora.
    let currentCash = parseFloat(company.cash.toString());
    company.cash = currentCash - totalShippingCost;
    
    console.log(`   💰 Costo Total Logística: -$${totalShippingCost}`);
};