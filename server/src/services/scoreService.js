// ============================================
// FILE: server/src/services/scoreService.js
// VERSION: v2.4.0
// PURPOSE: Cálculo del Winner Scorecard (WSC) al final del juego
// SPEC REF: PDF - Fórmula WSC
// ============================================

const Company = require('../models/Company');
const FinancialStatement = require('../models/FinancialStatement');

exports.calculateFinalScores = async (gameId) => {
    console.log(`🏆 SCORING: Calculando ganadores para Game ${gameId}...`);

    const companies = await Company.find({ gameId });
    if (companies.length === 0) return;

    // 1. Obtener Datos Acumulados
    const companyScores = [];

    for (const comp of companies) {
        // A. Utilidad Acumulada
        const financials = await FinancialStatement.find({ companyId: comp._id });
        const totalNetIncome = financials.reduce((sum, f) => sum + parseFloat(f.incomeStatement.netIncome), 0);
        
        // B. Participación de Mercado (Simplificado: Ventas Totales relativas)
        // En una implementación estricta, sería % de unidades vendidas vs total mercado.
        // Aquí usaremos Revenue Total como proxy.
        const totalRevenue = financials.reduce((sum, f) => sum + parseFloat(f.incomeStatement.revenue), 0);

        companyScores.push({
            company: comp,
            netIncome: totalNetIncome,
            revenue: totalRevenue,
            ethics: comp.ethicsIndex,
            tech: comp.techLevel,
            rawScore: 0
        });
    }

    // 2. Normalizar Valores (Para que el mejor tenga 100 puntos en esa categoría)
    const maxIncome = Math.max(...companyScores.map(c => c.netIncome), 1);
    const maxRevenue = Math.max(...companyScores.map(c => c.revenue), 1);
    // Ética y Tech ya tienen escalas fijas (0-100 y 1-10 aprox)

    // 3. Calcular WSC
    // Pesos: 40% Utilidad, 30% Mercado, 20% Ética, 10% Tech
    for (const item of companyScores) {
        const scoreIncome = (item.netIncome / maxIncome) * 100;
        const scoreMarket = (item.revenue / maxRevenue) * 100;
        const scoreEthics = item.ethics; // Ya es base 100
        const scoreTech = Math.min(item.tech * 10, 100); // Asumiendo nivel 10 = 100 pts

        // Fórmula Ponderada
        // Nota: Manejamos negativos en utilidad (si perdió dinero, score 0)
        const wsc = (
            (Math.max(0, scoreIncome) * 0.4) +
            (scoreMarket * 0.3) +
            (scoreEthics * 0.2) +
            (scoreTech * 0.1)
        );

        item.rawScore = wsc.toFixed(2);
        
        // Guardar en la empresa (Necesitamos agregar el campo 'finalScore' al modelo Company si queremos persistirlo,
        // o simplemente devolverlo calculado).
        // Por ahora, lo inyectamos en el objeto en memoria para devolverlo al controller.
    }

    // Ordenar por WSC descendente
    companyScores.sort((a, b) => b.rawScore - a.rawScore);

    return companyScores;
};