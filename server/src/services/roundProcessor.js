// server/src/services/roundProcessor.js
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const { calculateMarketSales } = require('./marketEngine');
const { processFIFO, ageInventory } = require('./inventoryService');

const COSTO_MATERIA_PRIMA = 15.00;
const COSTO_MANUFACTURA = 35.00;
const SHIPPING_COST_AIR = 5.00;
const SHIPPING_COST_GROUND = 1.00;

const processRound = async (config) => { 
  console.log(`>>> PROCESANDO RONDA ${config.currentRound} (MULTI-MERCADO)...`);
  const storageCost = parseFloat(config.storageCostPerUnit.toString());
  
  // Obtenemos la configuración de mercados de la DB
  const MARKETS = config.markets; 

  const companies = await Company.find();
  
  // Estructura para acumular resultados financieros de todas las plazas
  const financialSummary = {}; 

  // --- FASE 1: OPERACIONES Y LOGÍSTICA ---
  for (const company of companies) {
    const decision = await Decision.findOne({ 
      companyId: company._id, 
      round: config.currentRound 
    });

    let currentCash = parseFloat(company.financials.cash.toString());
    let logisticExpenses = 0;

    // 1. PROCESAR LLEGADAS (Tránsito -> Inventario Localizado)
    const arrivingBatches = [];
    const remainingTransit = [];

    if (company.inTransit) {
        company.inTransit.forEach(shipment => {
            if (shipment.roundsRemaining <= 1) {
                // ¡LLEGÓ A SU DESTINO!
                arrivingBatches.push({
                    batchId: shipment.batchId,
                    market: shipment.destination, // [CRÍTICO] Asignamos la plaza
                    units: shipment.units,
                    unitCost: shipment.unitCost,
                    age: 0,
                    isObsolete: false
                });
            } else {
                shipment.roundsRemaining -= 1;
                remainingTransit.push(shipment);
            }
        });
    }
    
    company.inventory = [...company.inventory, ...arrivingBatches];
    company.inTransit = remainingTransit;

    // 2. COMPRAS MP
    const mpToBuy = decision?.procurement?.units || 0;
    const costOfMP = mpToBuy * COSTO_MATERIA_PRIMA;
    currentCash -= costOfMP;
    company.rawMaterials.units += mpToBuy;

    // 3. PRODUCCIÓN
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

    // Actualizar Fábrica
    let currentFactoryUnits = company.factoryStock.units || 0;
    let currentFactoryCost = parseFloat(company.factoryStock.unitCost.toString()) || 0;
    const newProductionCost = COSTO_MATERIA_PRIMA + COSTO_MANUFACTURA;
    let totalValue = (currentFactoryUnits * currentFactoryCost) + (actualProduction * newProductionCost);
    let newTotalUnits = currentFactoryUnits + actualProduction;
    let newAverageCost = newTotalUnits > 0 ? totalValue / newTotalUnits : 0;

    company.factoryStock = { units: newTotalUnits, unitCost: newAverageCost };

    // 4. ENVÍOS (Multi-Destino)
    const shipments = decision?.logistics || [];
    
    shipments.forEach(shipment => {
        const unitsToShip = Math.min(shipment.units, company.factoryStock.units);
        
        if (unitsToShip > 0) {
            company.factoryStock.units -= unitsToShip;
            
            const isAir = shipment.method === 'Aereo';
            const costPerUnit = isAir ? SHIPPING_COST_AIR : SHIPPING_COST_GROUND;
            const shipmentCost = unitsToShip * costPerUnit;
            
            currentCash -= shipmentCost;
            logisticExpenses += shipmentCost;

            // Validar destino válido
            const validDestinations = MARKETS.map(m => m.name);
            const destination = validDestinations.includes(shipment.destination) ? shipment.destination : "Centro";

            company.inTransit.push({
                batchId: `R${config.currentRound}-${destination.substring(0,3).toUpperCase()}`,
                units: unitsToShip,
                destination: destination, // Guardamos a dónde va
                method: shipment.method,
                roundsRemaining: isAir ? 1 : 2,
                unitCost: company.factoryStock.unitCost
            });
        }
    });

    company.financials.cash = currentCash;
    
    // Inicializar resumen financiero
    financialSummary[company._id] = {
      companyRef: company,
      mpCost: costOfMP,
      prodCost: costOfProduction,
      logisticCost: logisticExpenses,
      marketing: decision ? parseFloat(decision.marketing.toString()) : 0,
      totalRevenue: 0,
      totalUnitsSold: 0,
      marketResults: [] // Guardar detalle por plaza
    };
  }

  // --- FASE 2: MERCADO (Iterar por cada Plaza) ---
  
  for (const marketConfig of MARKETS) {
    const marketName = marketConfig.name;
    const marketCompetitors = [];

    // Preparar competidores para ESTA plaza
    for (const company of companies) {
      const decision = await Decision.findOne({ companyId: company._id, round: config.currentRound });
      
      // Filtrar inventario disponible SOLO en esta plaza
      const stockInMarket = company.inventory
        .filter(batch => batch.market === marketName)
        .reduce((sum, batch) => sum + batch.units, 0);

      marketCompetitors.push({
        id: company._id,
        originalCompany: company,
        price: decision ? parseFloat(decision.price.toString()) : 9999,
        marketing: decision ? parseFloat(decision.marketing.toString()) : 0,
        stock: stockInMarket
      });
    }

    // Ejecutar motor para esta plaza
    const plazaResults = calculateMarketSales(marketCompetitors, marketConfig);

    // Acumular resultados
    plazaResults.forEach(res => {
        const summary = financialSummary[res.companyId];
        summary.totalRevenue += res.revenue;
        summary.totalUnitsSold += res.unitsSold;
        summary.marketResults.push({ market: marketName, ...res });
    });
  }

  // --- FASE 3: CIERRE Y ACTUALIZACIÓN ---
  const finalResults = []; // Para devolver al admin

  for (const companyId in financialSummary) {
    const summary = financialSummary[companyId];
    const company = summary.companyRef;

    // A. Actualizar Inventario (Restar ventas por plaza)
    let currentInventory = company.inventory;
    
    // Procesar FIFO por cada plaza donde se vendió
    summary.marketResults.forEach(res => {
        // Filtramos solo los lotes de esa plaza para descontar
        // Esto requiere una lógica FIFO más avanzada que filtre por mercado
        // Simplificación: Iteramos el inventario y restamos solo si coincide el mercado
        
        let remainingToSell = res.unitsSold;
        
        // Ordenar por antigüedad
        currentInventory.sort((a, b) => b.age - a.age);

        currentInventory = currentInventory.map(batch => {
            if (batch.market === res.market && remainingToSell > 0) {
                if (batch.units <= remainingToSell) {
                    remainingToSell -= batch.units;
                    batch.units = 0; // Se agotó este lote
                } else {
                    batch.units -= remainingToSell;
                    remainingToSell = 0;
                }
            }
            return batch;
        }).filter(batch => batch.units > 0); // Eliminar vacíos
    });

    // Envejecer todo
    const { updatedInventory, totalStorageCost } = ageInventory(currentInventory, storageCost);
    company.inventory = updatedInventory;

    // B. Finanzas
    let currentCash = parseFloat(company.financials.cash.toString());
    let newCash = currentCash + summary.totalRevenue - totalStorageCost - summary.marketing;
    company.financials.cash = newCash;

    // C. WSC
    const profitScore = Math.min((newCash / 10000), 100); 
    // Satisfacción promedio de todas las plazas
    // (Simplificado: mantenemos lógica global por ahora)
    let newSatisfaction = Math.min(Math.max(company.kpi.satisfaction + 2, 0), 100); 
    const wsc = (profitScore * 0.4) + (newSatisfaction * 0.3) + (company.kpi.ethics * 0.3);
    company.kpi.wsc = wsc;

    // D. Historial
    company.history.push({
        round: config.currentRound,
        cash: newCash,
        wsc: wsc,
        unitsSold: summary.totalUnitsSold,
        revenue: summary.totalRevenue
    });

    company.currentRound = config.currentRound + 1; 
    await company.save();
    
    finalResults.push({
        companyId: company._id,
        name: company.name,
        unitsSold: summary.totalUnitsSold,
        revenue: summary.totalRevenue
    });
  }

  console.log(`>>> RONDA ${config.currentRound} FINALIZADA (MULTI-MERCADO).`);
  return finalResults; 
};

module.exports = { processRound };