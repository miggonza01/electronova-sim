// server/test-market-logic.js
const { calculateMarketSales } = require('./src/services/marketEngine');

console.log('>>> INICIANDO SIMULACIÓN DE MERCADO ECPCIM <<<\n');

// 1. Definir el escenario
const DEMANDA_TOTAL = 10000; // Hay 10,000 clientes queriendo comprar

const competidores = [
  { id: 'Empresa A (Barata)', price: 100, marketing: 1000, stock: 5000 },
  { id: 'Empresa B (Premium)', price: 200, marketing: 20000, stock: 5000 },
  { id: 'Empresa C (Equilibrada)', price: 150, marketing: 5000, stock: 5000 },
  { id: 'Empresa D (Sin Stock)', price: 90, marketing: 5000, stock: 0 } // Caso borde
];

// 2. Ejecutar el motor
const resultados = calculateMarketSales(competidores, DEMANDA_TOTAL);

// 3. Mostrar resultados
console.table(resultados);

// 4. Análisis rápido
console.log('\n--- ANÁLISIS ---');
resultados.forEach(r => {
  console.log(`${r.companyId}: Vendió ${r.unitsSold} unidades. Ingresos: $${r.revenue}`);
  if (r.missedSales > 0) {
    console.log(`   ⚠️ ALERTA: Perdió ${r.missedSales} ventas por falta de stock!`);
  }
});