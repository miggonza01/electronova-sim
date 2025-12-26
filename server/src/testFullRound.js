// ============================================
// FILE: server/src/testFullRound.js
// PURPOSE: Simulación de un turno completo v2 (Con Reset de Ronda)
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testFullRound.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const Decision = require('./models/Decision');
const Product = require('./models/Product');
const GameSettings = require('./models/GameSettings');
const FinancialStatement = require('./models/FinancialStatement'); // Importar modelo
const roundProcessor = require('./services/roundProcessor');
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada.');
};

const runTest = async () => {
    try {
        await connectDB();

        // 1. LIMPIEZA Y RESET TOTAL
        console.log('🧹 Limpiando y Reiniciando Ronda...');
        await Company.deleteMany({});
        await Decision.deleteMany({});
        await FinancialStatement.deleteMany({});
        
        // ¡CRÍTICO! Reiniciar el contador de ronda a 1
        await GameSettings.updateMany({}, { $set: { currentRound: 1 } });

        // Crear Empresa Test
        const myCompany = await Company.create({
            user: new mongoose.Types.ObjectId(),
            name: "ElectroTest Corp",
            cash: 500000,
            productionQuota: 6000,
            currentRound: 1,
            rawMaterials: [
                { materialType: 'Alfa', units: 500, averageCost: 15.00 },
                { materialType: 'Beta', units: 500, averageCost: 25.00 }
            ],
            inventory: [
                { 
                    productLine: (await Product.findOne({name: 'Alta'}))._id,
                    market: 'Solís',
                    units: 50,
                    unitCost: 150.00,
                    ageInRounds: 1
                }
            ]
        });

        const productAlta = await Product.findOne({ name: 'Alta' });

        // 2. CREAR DECISIÓN INTEGRAL (Para Ronda 1)
        console.log('📝 Registrando Decisión...');
        await Decision.create({
            companyId: myCompany._id,
            round: 1,
            procurement: [{ materialType: 'Alfa', supplierType: 'local', units: 100 }],
            production: [{ productLine: productAlta._id, units: 50 }],
            logistics: [{ productLine: productAlta._id, destination: 'Solís', method: 'aereo', units: 50 }],
            commercial: [{
                market: 'Solís',
                marketingBudget: 5000,
                prices: [{ productLine: productAlta._id, price: 200 }]
            }]
        });

        // 3. EJECUTAR PROCESADOR
        console.log('\n🚀 EJECUTANDO MOTOR DE JUEGO...');
        await roundProcessor.processGameRound();

        // 4. VERIFICACIÓN
        const updatedCompany = await Company.findById(myCompany._id);
        const settings = await GameSettings.findOne();
        
        // Buscar el reporte de la Ronda 1 (que acabamos de procesar)
        const report = await FinancialStatement.findOne({ companyId: myCompany._id, round: 1 });

        console.log('\n📊 REPORTE FINAL:');
        console.log(`   Ronda Siguiente: ${settings.currentRound} (Esperado: 2)`);
        console.log(`   Cash Final: $${parseFloat(updatedCompany.cash).toFixed(2)}`);
        
        if (report) {
            const is = report.incomeStatement;
            console.log('\n📄 ESTADO DE RESULTADOS GENERADO (Ronda 1):');
            console.log(`   (+) Ventas:      $${parseFloat(is.revenue).toFixed(2)}`);
            console.log(`   (-) COGS:        $${parseFloat(is.cogs).toFixed(2)}`);
            console.log(`   (-) Marketing:   $${parseFloat(is.expenses.marketing).toFixed(2)}`);
            console.log(`   (=) Utilidad Neta: $${parseFloat(is.netIncome).toFixed(2)}`);
            
            const bs = report.balanceSheet;
            console.log('\n⚖️ BALANCE GENERAL:');
            console.log(`   Activos Totales: $${parseFloat(bs.assets.totalAssets).toFixed(2)}`);
            console.log(`   Patrimonio:      $${parseFloat(bs.equity.totalEquity).toFixed(2)}`);
        } else {
            console.error('❌ ERROR: No se generó FinancialStatement para la ronda 1.');
        }

        if (settings.currentRound === 2 && report && parseFloat(report.incomeStatement.revenue) > 0) {
            console.log('\n✅ PRUEBA EXITOSA: Ciclo Operativo + Financiero completado.');
        } else {
            console.log('\n⚠️ FALLO: Verifica los logs anteriores.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();