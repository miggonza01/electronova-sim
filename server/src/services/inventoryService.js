// ============================================
// FILE: server/src/services/inventoryService.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Gestión de Inventarios (Llegadas, FIFO, Envejecimiento)
// SPEC REF: 4.2 - Flujo de Procesamiento
// ============================================

/**
 * Procesa la llegada de materiales y productos para una empresa.
 * Se ejecuta AL INICIO de la ronda.
 * @param {Object} company - Documento de la empresa
 */
exports.processArrivals = async (company) => {
    console.log(`📦 INVENTORY: Procesando llegadas para ${company.name}...`);
    let materialsArrived = 0;
    let productsArrived = 0;

    // --- A. PROCESAR LLEGADA DE MATERIAS PRIMAS ---
    const arrivingMaterials = [];
    const remainingMaterials = [];

    if (company.inTransit.materials) {
        company.inTransit.materials.forEach(batch => {
            if (batch.roundsUntilArrival <= 1) {
                arrivingMaterials.push(batch);
            } else {
                batch.roundsUntilArrival -= 1;
                remainingMaterials.push(batch);
            }
        });
    }

    // Integrar MP al Stock (Promedio Ponderado)
    for (const batch of arrivingMaterials) {
        const stockItem = company.rawMaterials.find(rm => rm.materialType === batch.materialType);
        
        const newUnits = batch.units;
        // Convertir Decimal128 a float para cálculos matemáticos
        const totalBatchCost = parseFloat(batch.totalCost.toString());

        if (stockItem) {
            const currentUnits = stockItem.units;
            const currentAvgCost = parseFloat(stockItem.averageCost.toString());
            const currentTotalValue = currentUnits * currentAvgCost;

            const newTotalUnits = currentUnits + newUnits;
            // Evitar división por cero
            const newAvgCost = newTotalUnits > 0 ? (currentTotalValue + totalBatchCost) / newTotalUnits : 0;

            stockItem.units = newTotalUnits;
            stockItem.averageCost = newAvgCost;
        } else {
            company.rawMaterials.push({
                materialType: batch.materialType,
                units: newUnits,
                averageCost: newUnits > 0 ? totalBatchCost / newUnits : 0
            });
        }
        materialsArrived++;
        console.log(`   📥 LLEGADA MP: ${newUnits}u ${batch.materialType} ingresadas.`);
    }
    company.inTransit.materials = remainingMaterials;

    // --- B. PROCESAR LLEGADA DE PRODUCTOS TERMINADOS ---
    const arrivingProducts = [];
    const remainingProducts = [];

    if (company.inTransit.products) {
        company.inTransit.products.forEach(batch => {
            if (batch.roundsUntilArrival <= 1) {
                arrivingProducts.push(batch);
            } else {
                batch.roundsUntilArrival -= 1;
                remainingProducts.push(batch);
            }
        });
    }

    // Integrar PT al Inventario de Plaza
    for (const batch of arrivingProducts) {
        company.inventory.push({
            productLine: batch.productLine,
            market: batch.destination,
            units: batch.units,
            unitCost: batch.unitCost,
            ageInRounds: 0 // Nace con edad 0
        });
        productsArrived++;
        console.log(`   📥 LLEGADA PT: ${batch.units}u a ${batch.destination}.`);
    }
    company.inTransit.products = remainingProducts;

    return { materialsArrived, productsArrived };
};

/**
 * Incrementa la edad de los lotes de inventario (Al final de la ronda).
 * @param {Object} company 
 */
exports.ageInventory = async (company) => {
    if (company.inventory) {
        company.inventory.forEach(lot => {
            lot.ageInRounds += 1;
        });
    }
};

/**
 * Helper FIFO para ventas (Utilizado por MarketEngine más adelante).
 * Retorna los lotes actualizados y el Costo de Ventas (COGS) total.
 */
exports.consumeStockFIFO = (inventoryArray, unitsToSell) => {
    // Ordenar: Más viejos primero (Mayor ageInRounds)
    // Clonamos para no mutar el array original desordenadamente durante el sort
    let sortedInventory = [...inventoryArray].sort((a, b) => b.ageInRounds - a.ageInRounds);
    
    let remaining = unitsToSell;
    let totalCOGS = 0;
    
    // Filtramos los que tienen unidades > 0
    let activeLots = sortedInventory.filter(lot => lot.units > 0);
    
    // Array resultante (los que sobreviven o quedan parciales)
    // Nota: Mongoose maneja los subdocs por _id, así que idealmente modificamos in-situ
    // pero para cálculo retornamos valores.
    
    for (const lot of activeLots) {
        if (remaining <= 0) break;

        const costPerUnit = parseFloat(lot.unitCost.toString());

        if (lot.units <= remaining) {
            // Consumir lote completo
            totalCOGS += (lot.units * costPerUnit);
            remaining -= lot.units;
            lot.units = 0; // Marcar para borrado
        } else {
            // Consumir parcial
            totalCOGS += (remaining * costPerUnit);
            lot.units -= remaining;
            remaining = 0;
        }
    }

    return { 
        remainingUnitsNeeded: remaining, // Debería ser 0 si había stock
        totalCOGS 
    };
};