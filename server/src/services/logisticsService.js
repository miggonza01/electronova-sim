// ============================================
// FILE: server/src/services/logisticsService.js
// VERSION: v2.1.0-instrumented
// PURPOSE: Procesar logística y reportar gasto financiero
// ============================================

const COST_AIR = 15.00;
const COST_GROUND = 5.00;
const TIME_AIR = 1;
const TIME_GROUND = 2;

exports.processLogistics = async (decision, company) => {
    let totalShippingCost = 0;

    if (!decision.logistics || decision.logistics.length === 0) {
        return { cost: 0 };
    }

    console.log(`🚚 LOGISTICS: Procesando envíos para ${company.name}...`);

    const shipmentsByProduct = {};
    for (const shipment of decision.logistics) {
        if (shipment.units <= 0) continue;
        const pId = shipment.productLine.toString();
        if (!shipmentsByProduct[pId]) shipmentsByProduct[pId] = [];
        shipmentsByProduct[pId].push(shipment);
    }

    for (const [productId, shipments] of Object.entries(shipmentsByProduct)) {
        const factoryItem = company.factoryStock.find(fs => fs.productLine.toString() === productId);
        
        if (!factoryItem) continue;

        const totalNeeded = shipments.reduce((sum, s) => sum + s.units, 0);

        if (factoryItem.units < totalNeeded) {
            console.warn(`⚠️ LOGÍSTICA: Stock insuficiente para producto ${productId}. Omitiendo.`);
            continue; 
        }

        for (const shipment of shipments) {
            const isAir = shipment.method === 'aereo';
            const shippingCostPerUnit = isAir ? COST_AIR : COST_GROUND;
            const rounds = isAir ? TIME_AIR : TIME_GROUND;
            
            const shipmentTotalCost = shipment.units * shippingCostPerUnit;
            
            factoryItem.units -= shipment.units;

            const currentUnitCost = parseFloat(factoryItem.unitCost.toString());
            // Capitalizamos el flete en el costo del producto en destino
            const landedCost = currentUnitCost + shippingCostPerUnit;

            company.inTransit.products.push({
                productLine: shipment.productLine,
                destination: shipment.destination,
                units: shipment.units,
                unitCost: landedCost,
                roundsUntilArrival: rounds
            });

            totalShippingCost += shipmentTotalCost;
        }
    }

    let currentCash = parseFloat(company.cash.toString());
    company.cash = currentCash - totalShippingCost;
    
    console.log(`   💰 Logística Total: -$${totalShippingCost}`);

    // RETORNO DEL RECIBO FINANCIERO
    return { 
        cost: totalShippingCost 
    };
};