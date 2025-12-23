// server/src/services/marketEngine.js

/**
 * MOTOR DE MERCADO ECPCIM (Ajustado v1.1)
 * Ahora incluye "Resistencia del Mercado al Precio Alto".
 */

const MARKET_WEIGHTS = {
  price: 0.70,      // Subimos peso al precio
  marketing: 0.30,
  quality: 0.10
};

const SENSITIVITY = 3; // Más sensibilidad al precio (antes 2)
const MAX_ACCEPTABLE_PRICE = 300; // Precio máximo que el mercado tolera antes de rechazar masivamente

const calculateMarketSales = (competitors, totalDemand) => {
  
  if (!competitors || competitors.length === 0) return [];

  let minPrice = Math.min(...competitors.map(c => c.price));
  if (minPrice <= 0) minPrice = 1;

  let maxMarketing = Math.max(...competitors.map(c => c.marketing));
  if (maxMarketing <= 0) maxMarketing = 1;

  let totalScoreMarket = 0;

  // 1. CALCULAR SCORE RELATIVO (Competencia)
  const scoredCompetitors = competitors.map(company => {
    let priceVal = company.price <= 0 ? 0.01 : company.price;
    
    // Fórmula de Precio mejorada:
    let scorePrice = Math.pow((minPrice / priceVal), SENSITIVITY);

    // Penalización por Precio Excesivo (Price Gouging)
    // Si el precio supera el máximo aceptable, el score se reduce drásticamente
    if (priceVal > MAX_ACCEPTABLE_PRICE) {
        const excessRatio = priceVal / MAX_ACCEPTABLE_PRICE;
        scorePrice = scorePrice / (excessRatio * excessRatio); // Castigo cuadrático
    }

    let scoreMarketing = 0;
    if (company.marketing > 0) {
      scoreMarketing = Math.log(company.marketing + 1) / Math.log(maxMarketing + 1);
    }

    let rawScore = (scorePrice * MARKET_WEIGHTS.price) + 
                   (scoreMarketing * MARKET_WEIGHTS.marketing);

    totalScoreMarket += rawScore;

    return { ...company, rawScore };
  });

  // 2. DISTRIBUCIÓN DE VENTAS
  const results = scoredCompetitors.map(company => {
    let marketShare = 0;
    if (totalScoreMarket > 0) {
      marketShare = company.rawScore / totalScoreMarket;
    }

    // --- NUEVO: ELASTICIDAD DE LA DEMANDA ---
    // Aunque tengas el 100% de market share, si tu precio es abusivo,
    // el mercado total se contrae. La gente prefiere no comprar.
    
    let adjustedTotalDemand = totalDemand;
    if (company.price > MAX_ACCEPTABLE_PRICE) {
        // Por cada 10% que subas sobre el máximo, pierdes 20% de mercado total
        const excessFactor = company.price / MAX_ACCEPTABLE_PRICE;
        // Si precio es 1000 y max es 300, factor = 3.33
        // Demanda se divide por 3.33^3 = 37 veces menos demanda
        adjustedTotalDemand = totalDemand / Math.pow(excessFactor, 3);
    }

    let potentialDemand = Math.floor(adjustedTotalDemand * marketShare);
    
    // Límite de seguridad: Nadie compra si precio > $2000
    if (company.price > 2000) potentialDemand = 0;

    let unitsSold = Math.min(potentialDemand, company.stock);
    let missedSales = potentialDemand - unitsSold;

    return {
      companyId: company.id,
      originalCompany: company.originalCompany,
      price: company.price,
      marketing: company.marketing,
      stock: company.stock,
      marketShare: (marketShare * 100).toFixed(2) + '%',
      potentialDemand,
      unitsSold,
      missedSales,
      revenue: unitsSold * company.price
    };
  });

  return results;
};

module.exports = { calculateMarketSales };