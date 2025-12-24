// server/src/services/marketEngine.js

/**
 * MOTOR DE MERCADO REALISTA v1.4 (Blindado)
 * Incorpora Elasticidad Precio-Demanda y Aleatoriedad.
 * CORRECCIÓN 500: Valores por defecto para evitar NaN.
 */

const calculateMarketSales = (competitors, marketConfig) => {
  
  if (!competitors || competitors.length === 0) return [];

  // Desestructuración con valores por defecto de seguridad
  // Esto evita que si falta un dato en la DB, el cálculo sea NaN
  const { 
    baseDemand = 1000, 
    priceSensitivity = 1, 
    maxAcceptablePrice = 300, 
    referencePrice = 150 
  } = marketConfig || {};

  // 1. Factor de Aleatoriedad (0.90 - 1.10)
  const marketNoise = 0.90 + (Math.random() * 0.20);

  // 2. Máximo Marketing
  let maxMarketing = Math.max(...competitors.map(c => c.marketing));
  if (maxMarketing <= 0) maxMarketing = 1;

  const results = competitors.map(company => {
    
    // A. Validación de Precio (Evitar división por cero)
    let price = company.price <= 0 ? 0.01 : company.price;
    
    // B. Cálculo de Elasticidad
    let priceRatio = referencePrice / price;
    
    // Protección matemática contra números complejos o infinitos
    if (priceRatio < 0) priceRatio = 0;
    
    let demandFactor = Math.pow(priceRatio, priceSensitivity);

    // C. Penalización por Barrera de Precio
    if (price > maxAcceptablePrice) {
        const excess = price / maxAcceptablePrice;
        // Evitamos división por cero o números enormes
        const penalty = Math.pow(excess, 4);
        demandFactor = demandFactor / (penalty > 0 ? penalty : 1);
    }

    // D. Factor de Marketing
    let marketingFactor = 1;
    if (company.marketing > 0) {
        marketingFactor = 1 + (Math.log10(company.marketing + 1) * 0.15); 
    }

    // E. Cálculo Final Demanda
    let rawDemand = baseDemand * demandFactor * marketingFactor * marketNoise;
    
    // Asegurar que sea un número válido y entero
    if (isNaN(rawDemand)) rawDemand = 0;
    let potentialDemand = Math.floor(rawDemand);

    // F. Ejecución de Venta
    let unitsSold = Math.min(potentialDemand, company.stock);
    let missedSales = potentialDemand - unitsSold;

    return {
      companyId: company.id,
      originalCompany: company.originalCompany,
      price: company.price,
      marketing: company.marketing,
      stock: company.stock,
      marketShare: 'N/A',
      potentialDemand,
      unitsSold,
      missedSales,
      revenue: unitsSold * company.price
    };
  });

  return results;
};

module.exports = { calculateMarketSales };