// server/src/services/roundProcessor.js
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const { calculateMarketSales } = require('./marketEngine');
const { processFIFO, ageInventory } = require('./inventoryService');

const DEMANDA_TOTAL_BASE = 10000; 
const COSTO_MATERIA_PRIMA = 15.00;
const COSTO_MANUFACTURA = 35.00;

// [NUEVO] Costos Logísticos
const SHIPPING_COST_AIR = 5.00;      // Rápido (1 ronda)
const SHIPPING_COST_GROUND = 1.00;   // Lento (2 rondas)

const processRound = async (config) => { 
  console.log(`>>> PROCESANDO RONDA ${config.currentRound} (LOGÍSTICA ACTIVADA)...`);
  const storageCost = parseFloat(config.storageCostPerUnit.toString());

  const companies = await Company.find();
  const competitors = [];
  const companyCostsCache = {};

  // --- FASE 1: OPERACIONES INTERNAS Y LLEGADAS ---
  for (const company of companies) {
    const decision = await Decision.findOne({ 
      companyId: company._id, 
      round: config.currentRound 
    });

    let currentCash = parseFloat(company.financials.cash.toString());
    let logisticExpenses = 0;

    // 1. PROCESAR LLEGADAS (Tránsito -> Inventario Plaza)
    // Revisamos qué envíos han llegado a su destino (roundsRemaining <= 1)
    const arrivingBatches = [];
    const remainingTransit = [];

    if (company.inTransit) {
        company.inTransit.forEach(shipment => {
            if (shipment.roundsRemaining <= 1) {
                // ¡LLEGÓ! Se convierte en inventario vendible
                arrivingBatches.push({
                    batchId: shipment.batchId,
                    units: shipment.units,
                    unitCost: shipment.unitCost,
                    age: 0, // Empieza a envejecer en plaza desde hoy
                    isObsolete: false
                });
            } else {
                // Sigue viajando, restamos 1 ronda al tiempo restante
                shipment.roundsRemaining -= 1;
                remainingTransit.push(shipment);
            }
        });
    }
    
    // Sumamos llegadas al inventario existente (Esto es lo que se venderá HOY)
    company.inventory = [...company.inventory, ...arrivingBatches];
    company.inTransit = remainingTransit;

    // 2. COMPRAS MP (Instantáneas por ahora)
    const mpToBuy = decision?.procurement?.units || 0;
    const costOfMP = mpToBuy * COSTO_MATERIA_PRIMA;
    currentCash -= costOfMP;
    company.rawMaterials.units += mpToBuy;

    // 3. PRODUCCIÓN (MP -> Stock de Fábrica)
    // OJO: Esto va a company.factoryStock, NO a la venta.
    const desiredProduction = decision?.production?.units || 0;
    let actualProduction = 0;
    
    if (company.rawMaterials.units >= desiredProduction) {
      actualProduction = desiredProduction;
      company.rawMaterials.units -= desiredProduction;
    } else {
      actualProduction = company.rawMaterials.units;
      company.rawMaterials.units = 0;
    }

    const costOfProduction = actualProduction * COSTO_MANUFACTURA;
    currentCash -= costOfProduction;

    // Actualizar Stock de Fábrica (Promedio Ponderado)
    let currentFactoryUnits = company.factoryStock.units || 0;
    let currentFactoryCost = parseFloat(company.factoryStock.unitCost.toString()) || 0;
    
    const newProductionCost = COSTO_MATERIA_PRIMA + COSTO_MANUFACTURA;
    
    let totalValue = (currentFactoryUnits * currentFactoryCost) + (actualProduction * newProductionCost);
    let newTotalUnits = currentFactoryUnits + actualProduction;
    let newAverageCost = newTotalUnits > 0 ? totalValue / newTotalUnits : 0;

    company.factoryStock = {
        units: newTotalUnits,
        unitCost: newAverageCost
    };

    // 4. ENVÍOS (Fábrica -> Tránsito)
    // El usuario decide mover X unidades de la fábrica a la plaza
    const shipments = decision?.logistics || [];
    
    shipments.forEach(shipment => {
        // Solo podemos enviar lo que tenemos en fábrica
        const unitsToShip = Math.min(shipment.units, company.factoryStock.units);
        
        if (unitsToShip > 0) {
            // Restar de fábrica
            company.factoryStock.units -= unitsToShip;
            
            // Calcular costo envío
            const isAir = shipment.method === 'Aereo';
            const costPerUnit = isAir ? SHIPPING_COST_AIR : SHIPPING_COST_GROUND;
            const shipmentCost = unitsToShip * costPerUnit;
            
            currentCash -= shipmentCost;
            logisticExpenses += shipmentCost;

            // Crear paquete en tránsito
            company.inTransit.push({
                batchId: `R${config.currentRound}-${isAir ? 'AIR' : 'GND'}`,
                units: unitsToShip,
                destination: 'Plaza Central',
                method: shipment.method,
                roundsRemaining: isAir ? 1 : 2, // La regla del PDF
                unitCost: company.factoryStock.unitCost // Mantiene el costo de producción
            });
        }
    });

    // Guardar estado temporal para cálculos finales
    company.financials.cash = currentCash;
    
    companyCostsCache[company._id] = {
      mpCost: costOfMP,
      prodCost: costOfProduction,
      logisticCost: logisticExpenses,
      marketing: decision ? parseFloat(decision.marketing.toString()) : 0
    };

    // Stock disponible para VENTAS (Solo lo que está en 'inventory' en Plaza)
    const totalStockForSale = company.inventory.reduce((sum, batch) => sum + batch.units, 0);

    competitors.push({
      id: company._id,
      price: decision ? parseFloat(decision.price.toString()) : 9999,
      marketing: decision ? parseFloat(decision.marketing.toString()) : 0,
      stock: totalStockForSale,
      originalCompany: company 
    });
  }

  // --- FASE 2: MERCADO (Ventas) ---
  const marketResults = calculateMarketSales(competitors, DEMANDA_TOTAL_BASE);

  // --- FASE 3: CIERRE CONTABLE ---
  for (const result of marketResults) {
    const company = result.originalCompany;
    const costs = companyCostsCache[company._id];

    // A. Ventas FIFO (Descontar del inventario de Plaza)
    let currentInventory = company.inventory;
    currentInventory = processFIFO(currentInventory, result.unitsSold);
    const { updatedInventory, totalStorageCost } = ageInventory(currentInventory, storageCost);
    company.inventory = updatedInventory;

    // B. Finanzas Finales
    const revenue = result.revenue;
    
    // Nota: Los costos operativos (MP, Prod, Logística) ya se restaron de 'currentCash' en Fase 1.
    // Ahora sumamos ingresos y restamos lo que falta (Marketing y Almacenaje).
    
    let currentCash = parseFloat(company.financials.cash.toString());
    let newCash = currentCash + revenue - totalStorageCost - costs.marketing; 

    company.financials.cash = newCash;

    // C. KPIs (WSC)
    let satisfactionPenalty = 0;
    if (result.potentialDemand > 0) {
        const missedRatio = result.missedSales / result.potentialDemand;
        if (missedRatio > 0.1) satisfactionPenalty = 10;
        if (missedRatio > 0.5) satisfactionPenalty = 30;
    }
    let newSatisfaction = company.kpi.satisfaction - satisfactionPenalty;
    if (satisfactionPenalty === 0) newSatisfaction += 5;
    newSatisfaction = Math.min(Math.max(newSatisfaction, 0), 100);
    company.kpi.satisfaction = newSatisfaction;

    const profitScore = Math.min((newCash / 10000), 100); 
    const wsc = (profitScore * 0.4) + (newSatisfaction * 0.3) + (company.kpi.ethics * 0.3);
    company.kpi.wsc = wsc;

    // D. Historial
    company.history.push({
        round: config.currentRound,
        cash: newCash,
        wsc: wsc,
        unitsSold: result.unitsSold,
        revenue: revenue
    });

    // Avanzar ronda de la empresa
    company.currentRound = config.currentRound + 1; 

    await company.save();
    console.log(`Empresa ${company.name}: Ventas ${result.unitsSold} | Stock Fábrica: ${company.factoryStock.units} | En Tránsito: ${company.inTransit.length}`);
  }

  console.log(`>>> RONDA ${config.currentRound} FINALIZADA.`);
  return marketResults; 
};

module.exports = { processRound };