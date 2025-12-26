// ============================================
// FILE: server/src/testFullRound.js
// PURPOSE: Simulación de un turno completo v2
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testFullRound.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const Decision = require('./models/Decision');
const Product = require('./models/Product');
const GameSettings = require('./models/GameSettings');
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

        // 1. LIMPIEZA Y PREPARACIÓN
        // Nota: Asegúrate de haber corrido 'npm run seed:v2' antes para tener Mercados/Productos
        await Company.deleteMany({});
        await Decision.deleteMany({});

        // Crear Empresa Test
        const myCompany = await Company.create({
            user: new mongoose.Types.ObjectId(),
            name: "ElectroTest Corp",
            cash: 500000,
            productionQuota: 6000,
            currentRound: 1,
            // Inyectamos MP para producir
            rawMaterials: [
                { materialType: 'Alfa', units: 500, averageCost: 15.00 },
                { materialType: 'Beta', units: 500, averageCost: 25.00 }
            ],
            // Inyectamos PT en Plaza para vender
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

        // 2. CREAR DECISIÓN INTEGRAL
        console.log('📝 Registrando Decisión...');
        await Decision.create({
            companyId: myCompany._id,
            round: 1,
            // Compra
            procurement: [{ materialType: 'Alfa', supplierType: 'local', units: 100 }],
            // Producción
            production: [{ productLine: productAlta._id, units: 50 }],
            // Logística
            logistics: [{ productLine: productAlta._id, destination: 'Solís', method: 'aereo', units: 50 }],
            // Comercial (Venta)
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

        console.log('\n📊 REPORTE FINAL:');
        console.log(`   Ronda Actual: ${settings.currentRound} (Esperado: 2)`);
        console.log(`   Cash Final: $${parseFloat(updatedCompany.cash).toFixed(2)}`);
        
        // Ventas esperadas: 50u * $200 = +$10,000
        // Gastos aprox: Compras ($1800) + Logística ($750) = -$2,550
        // Cash esperado > $500,000

        if (settings.currentRound === 2 && parseFloat(updatedCompany.cash) > 500000) {
            console.log('\n✅ PRUEBA EXITOSA: El ciclo económico funciona.');
        } else {
            console.log('\n⚠️ RESULTADO MIXTO: Verifica los logs.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();