// server/src/services/inventoryService.js

/**
 * Aplica ventas al inventario usando lógica FIFO (First-In, First-Out).
 * Los lotes más viejos (index 0) se venden primero.
 * 
 * @param {Array} currentInventory - Array de lotes de la empresa.
 * @param {Number} unitsToSell - Cantidad total vendida.
 * @returns {Array} - Inventario actualizado (sin los productos vendidos).
 */
const processFIFO = (currentInventory, unitsToSell) => {
  // Hacemos una copia profunda para no modificar el original por error
  let inventory = JSON.parse(JSON.stringify(currentInventory));
  let remainingToSell = unitsToSell;

  // Ordenar inventario: Los de mayor edad (age) o creados antes van primero
  // Asumimos que el array ya viene ordenado, pero por seguridad:
  inventory.sort((a, b) => b.age - a.age); // Vender los más viejos primero

  // Filtramos lotes vacíos por si acaso
  inventory = inventory.filter(batch => batch.units > 0);

  const newInventory = [];

  for (let batch of inventory) {
    if (remainingToSell <= 0) {
      // Ya vendimos todo lo necesario, este lote queda intacto
      newInventory.push(batch);
      continue;
    }

    if (batch.units <= remainingToSell) {
      // Vendemos TODO este lote
      remainingToSell -= batch.units;
      // No lo agregamos a newInventory porque se agotó (se borra)
    } else {
      // Vendemos una PARTE de este lote
      batch.units -= remainingToSell;
      remainingToSell = 0;
      newInventory.push(batch); // Guardamos el resto
    }
  }

  return newInventory;
};

/**
 * Envejece el inventario y calcula costos de almacenamiento.
 * @param {Array} inventory 
 * @param {Number} costPerUnit - Costo de almacenamiento (ej. 0.20)
 * @returns {Object} { updatedInventory, storageCost, obsoletesCost }
 */
const ageInventory = (inventory, costPerUnit = 0.20) => {
  let totalStorageCost = 0;
  let totalObsoleteLoss = 0; // Dinero perdido por vencimiento

  const updatedInventory = inventory.map(batch => {
    // 1. Calcular costo de almacenamiento de este lote
    totalStorageCost += batch.units * costPerUnit;

    // 2. Envejecer (+1 ronda)
    batch.age += 1;

    // 3. Verificar Obsolescencia (> 3 rondas)
    if (batch.age > 3 && !batch.isObsolete) {
        batch.isObsolete = true;
        // Aquí podrías aplicar la pérdida de valor contable si quisieras
        // Por ahora solo marcamos la bandera
    }

    return batch;
  });

  return { updatedInventory, totalStorageCost };
};

module.exports = { processFIFO, ageInventory };