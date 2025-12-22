// server/src/services/roundProcessor.js
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const { calculateMarketSales } = require('./marketEngine');
const { processFIFO, ageInventory } = require('./inventoryService');

const DEMANDA_TOTAL_BASE = 10000; 

const processRound = async (config) => { 
  console.log(`>>> INICIANDO PROCESAMIENTO DE RONDA ${config.currentRound}...`);

  const storageCost = parseFloat(config.storageCostPerUnit.toString());

  // 1. Obtener empresas
  const companies = await Company.find();
  const competitors = [];
  
  for (const company of companies) {
    const decision = await Decision.findOne({ 
      companyId: company._id, 
      round: company.currentRound 
    });

    const totalStock = company.inventory.reduce((sum, batch) => sum + batch.units, 0);

    competitors.push({
      id: company._id,
      price: decision ? parseFloat(decision.price.toString()) : 9999,
      marketing: decision ? parseFloat(decision.marketing.toString()) : 0,
      stock: totalStock,
      originalCompany: company 
    });
  }

  // 2. Ejecutar Mercado
  const marketResults = calculateMarketSales(competitors, DEMANDA_TOTAL_BASE);

  // 3. Aplicar Resultados y Calcular KPIs
  for (const result of marketResults) {
    const company = result.originalCompany;
    
    // A. Inventarios y Finanzas (Código previo)
    let currentInventory = company.inventory;
    currentInventory = processFIFO(currentInventory, result.unitsSold);
    const { updatedInventory, totalStorageCost } = ageInventory(currentInventory, storageCost);
    company.inventory = updatedInventory;

    const revenue = result.revenue;
    const marketingCost = result.marketing;
    const totalExpenses = marketingCost + totalStorageCost; 
    let currentCash = parseFloat(company.financials.cash.toString());
    let newCash = currentCash + revenue - totalExpenses;
    company.financials.cash = newCash;

    // --- B. CÁLCULO DE KPIs (NUEVO) ---
    
    // 1. Satisfacción: Si hubo ventas perdidas, bajamos satisfacción
    // Penalización: 5 puntos por cada 10% de demanda no atendida (simplificado)
    let satisfactionPenalty = 0;
    if (result.potentialDemand > 0) {
        const missedRatio = result.missedSales / result.potentialDemand;
        if (missedRatio > 0.1) satisfactionPenalty = 10;
        if (missedRatio > 0.5) satisfactionPenalty = 30;
    }
    // Recuperación natural: +5 puntos por ronda si cumpliste, hasta 100
    let newSatisfaction = company.kpi.satisfaction - satisfactionPenalty;
    if (satisfactionPenalty === 0) newSatisfaction += 5;
    // Clamping (Mantener entre 0 y 100)
    newSatisfaction = Math.min(Math.max(newSatisfaction, 0), 100);
    company.kpi.satisfaction = newSatisfaction;

    // 2. Winner Scorecard (WSC) Simplificado
    // Fórmula: (RentabilidadRelativa * 0.4) + (Satisfacción * 0.3) + (Ética * 0.3)
    // Para simplificar "RentabilidadRelativa", usaremos Cash / 5000 (Factor de escala)
    // En el futuro haremos la normalización contra el líder.
    const profitScore = Math.min((newCash / 10000), 100); // Tope de 100 puntos si tienes $1M
    
    const wsc = (profitScore * 0.4) + (newSatisfaction * 0.3) + (company.kpi.ethics * 0.3);
    company.kpi.wsc = wsc;

    // --- C. GUARDAR HISTORIAL (NUEVO) ---
    company.history.push({
        round: config.currentRound,
        cash: newCash,
        wsc: wsc,
        unitsSold: result.unitsSold,
        revenue: revenue
    });

    await company.save();
    console.log(`Empresa ${company.name}: WSC Calculado: ${wsc.toFixed(1)}`);
  }

  console.log(`>>> RONDA ${config.currentRound} PROCESADA.`);
  return marketResults; 
};

module.exports = { processRound };