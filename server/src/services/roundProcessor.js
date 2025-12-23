// server/src/services/roundProcessor.js
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const { calculateMarketSales } = require('./marketEngine');
const { processFIFO, ageInventory } = require('./inventoryService');

const DEMANDA_TOTAL_BASE = 10000; 
const COSTO_MATERIA_PRIMA = 15.00;
const COSTO_MANUFACTURA = 35.00;

const processRound = async (config) => { 
  console.log(`>>> PROCESANDO RONDA ${config.currentRound}...`);
  const storageCost = parseFloat(config.storageCostPerUnit.toString());

  // 1. Obtener empresas
  const companies = await Company.find();
  const competitors = [];
  
  // MAPA TEMPORAL para guardar los costos calculados en la Fase 1
  // y aplicarlos en la Fase 3 sin perder datos.
  const companyCostsCache = {};

  // --- FASE 1: PRODUCCIÓN Y PREPARACIÓN ---
  for (const company of companies) {
    // IMPORTANTE: Buscamos la decisión de la ronda que la empresa CREE que es,
    // o la del admin si están desincronizados.
    // Para evitar errores, usamos config.currentRound (la ronda real del juego).
    const decision = await Decision.findOne({ 
      companyId: company._id, 
      round: config.currentRound // <--- CORRECCIÓN: Usar ronda global
    });

    // A. COMPRAS MP
    // Leemos con seguridad (si es null, es 0)
    const mpToBuy = decision?.procurement?.units || 0;
    const costOfMP = mpToBuy * COSTO_MATERIA_PRIMA;
    
    let currentMP = company.rawMaterials.units || 0;
    currentMP += mpToBuy; // Sumamos lo comprado

    // B. PRODUCCIÓN
    const desiredProduction = decision?.production?.units || 0;
    let actualProduction = 0;
    
    if (currentMP >= desiredProduction) {
      actualProduction = desiredProduction;
      currentMP -= desiredProduction;
    } else {
      actualProduction = currentMP; // Producimos lo que hay
      currentMP = 0;
    }

    const costOfProduction = actualProduction * COSTO_MANUFACTURA;

    // Agregar al inventario
    if (actualProduction > 0) {
      const totalUnitCost = COSTO_MATERIA_PRIMA + COSTO_MANUFACTURA;
      company.inventory.push({
        batchId: `R${config.currentRound}-PROD`,
        units: actualProduction,
        unitCost: totalUnitCost,
        age: 0,
        isObsolete: false
      });
    }

    // Actualizar MP en objeto (pero aun no guardamos)
    company.rawMaterials.units = currentMP;

    // Guardar costos en caché para restarlos al final
    companyCostsCache[company._id] = {
      mpCost: costOfMP,
      prodCost: costOfProduction,
      marketing: decision ? parseFloat(decision.marketing.toString()) : 0
    };

    // Calcular stock total para el mercado
    const totalStock = company.inventory.reduce((sum, batch) => sum + batch.units, 0);

    competitors.push({
      id: company._id,
      price: decision ? parseFloat(decision.price.toString()) : 9999,
      marketing: decision ? parseFloat(decision.marketing.toString()) : 0,
      stock: totalStock,
      originalCompany: company 
    });
  }

  // --- FASE 2: MERCADO ---
  const marketResults = calculateMarketSales(competitors, DEMANDA_TOTAL_BASE);

  // --- FASE 3: APLICACIÓN FINANCIERA Y CIERRE ---
  for (const result of marketResults) {
    const company = result.originalCompany;
    const costs = companyCostsCache[company._id]; // Recuperar costos calculados

    // A. Actualizar Inventario (Ventas FIFO)
    let currentInventory = company.inventory;
    currentInventory = processFIFO(currentInventory, result.unitsSold);
    const { updatedInventory, totalStorageCost } = ageInventory(currentInventory, storageCost);
    company.inventory = updatedInventory;

    // B. CÁLCULO FINAL DE CAJA
    const revenue = result.revenue;
    
    // Suma de todos los egresos: MP + Producción + Marketing + Almacenamiento
    const totalExpenses = costs.mpCost + costs.prodCost + costs.marketing + totalStorageCost;
    
    let currentCash = parseFloat(company.financials.cash.toString());
    let newCash = currentCash + revenue - totalExpenses;
    
    company.financials.cash = newCash;

    // C. KPIs
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

    // D. HISTORIAL
    company.history.push({
        round: config.currentRound,
        cash: newCash,
        wsc: wsc,
        unitsSold: result.unitsSold,
        revenue: revenue
    });

    // E. SINCRONIZACIÓN DE RONDA (CORRECCIÓN CRÍTICA)
    // Actualizamos la ronda de la empresa para que coincida con la nueva ronda global
    company.currentRound = config.currentRound + 1; 

    await company.save();
    console.log(`Empresa ${company.name}: Gastos Totales: $${totalExpenses} | Caja Final: $${newCash.toFixed(2)}`);
  }

  console.log(`>>> RONDA ${config.currentRound} FINALIZADA.`);
  return marketResults; 
};

module.exports = { processRound };