// server/src/services/marketEngine.js

/**
 * MOTOR DE MERCADO ECPCIM
 * Calcula la cuota de mercado basada en Precio y Marketing.
 */

const MARKET_WEIGHTS = {
  price: 0.60,
  marketing: 0.30,
  quality: 0.10
};

const SENSITIVITY = 2;

const calculateMarketSales = (competitors, totalDemand) => {
  
  if (!competitors || competitors.length === 0) return [];

  let minPrice = Math.min(...competitors.map(c => c.price));
  if (minPrice <= 0) minPrice = 1;

  let maxMarketing = Math.max(...competitors.map(c => c.marketing));
  if (maxMarketing <= 0) maxMarketing = 1;

  let totalScoreMarket = 0;

  const scoredCompetitors = competitors.map(company => {
    let priceVal = company.price <= 0 ? 0.01 : company.price;
    let scorePrice = Math.pow((minPrice / priceVal), SENSITIVITY);

    let scoreMarketing = 0;
    if (company.marketing > 0) {
      scoreMarketing = Math.log(company.marketing + 1) / Math.log(maxMarketing + 1);
    }

    let rawScore = (scorePrice * MARKET_WEIGHTS.price) + 
                   (scoreMarketing * MARKET_WEIGHTS.marketing);

    totalScoreMarket += rawScore;

    return { ...company, rawScore };
  });

  const results = scoredCompetitors.map(company => {
    let marketShare = 0;
    if (totalScoreMarket > 0) {
      marketShare = company.rawScore / totalScoreMarket;
    }

    let potentialDemand = Math.floor(totalDemand * marketShare);
    let unitsSold = Math.min(potentialDemand, company.stock);
    let missedSales = potentialDemand - unitsSold;

    return {
      companyId: company.id,
      originalCompany: company.originalCompany, // <--- ¡AQUÍ ESTABA EL ERROR! (Agregado)
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