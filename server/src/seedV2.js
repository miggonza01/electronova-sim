// ============================================
// FILE: server/src/seedV2.js
// PURPOSE: Poblar BD v2 Completa (Settings, MP, Productos, Mercados)
// EXECUTE: npm run seed:v2
// ============================================

const mongoose = require('mongoose');
const Product = require('./models/Product');
const RawMaterial = require('./models/RawMaterial');
const GameSettings = require('./models/GameSettings');
const Market = require('./models/Market'); // <--- NUEVO
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    const dbName = dbUri.split('/').pop().split('?')[0];
    console.log(`🌱 SEEDER: Conectando a ${dbName}...`);
    await mongoose.connect(dbUri);
    console.log('✅ Conectado.');
};

const seedData = async () => {
    try {
        await connectDB();

        // 1. LIMPIEZA
        console.log('🧹 Limpiando colecciones...');
        await Product.deleteMany({});
        await RawMaterial.deleteMany({});
        await GameSettings.deleteMany({});
        await Market.deleteMany({}); // <--- NUEVO

        // 2. SETTINGS
        console.log('⚙️  Configurando Reglas...');
        await GameSettings.create({
            totalProductionCapacity: 6000,
            initialCompanyCash: 500000.00,
            obsolescencePenaltyRate: 10,
            maxRounds: 12
        });

        // 3. MATERIAS PRIMAS
        console.log('📦 Creando Materias Primas...');
        await RawMaterial.insertMany([
            { name: 'Alfa', baseCost: 15.00 },
            { name: 'Beta', baseCost: 25.00 },
            { name: 'Omega', baseCost: 5.00 }
        ]);

        // 4. PRODUCTOS
        console.log('🚀 Creando Productos...');
        await Product.insertMany([
            {
                name: 'Alta',
                baseProductionCost: 50.00,
                rawMaterialRequirements: [
                    { materialType: 'Alfa', quantity: 2 },
                    { materialType: 'Beta', quantity: 3 }
                ]
            },
            {
                name: 'Media',
                baseProductionCost: 30.00,
                rawMaterialRequirements: [
                    { materialType: 'Alfa', quantity: 2 },
                    { materialType: 'Omega', quantity: 1 }
                ]
            },
            {
                name: 'Básica',
                baseProductionCost: 15.00,
                rawMaterialRequirements: [
                    { materialType: 'Omega', quantity: 3 }
                ]
            }
        ]);

        // 5. MERCADOS (Perfiles Estratégicos)
        console.log('🌍 Creando Mercados...');
        await Market.insertMany([
            {
                name: 'Novaterra', // Mercado Local / Equilibrado
                demandPotential: 3000,
                priceSensitivity: 1.0, // Normal
                priceHardCap: 250,
                params: { w_price: 0.4, w_quality: 0.3, w_marketing: 0.2, w_ethics: 0.1 },
                description: "Sede de la planta. Mercado equilibrado."
            },
            {
                name: 'Solís', // Mercado Masivo / Sensible a Precio
                demandPotential: 5000,
                priceSensitivity: 1.5, // Alta sensibilidad
                priceHardCap: 200, // Techo bajo
                params: { w_price: 0.6, w_quality: 0.2, w_marketing: 0.2, w_ethics: 0.0 },
                description: "Clima cálido. Busca economía."
            },
            {
                name: 'Veridia', // Mercado Premium / Ético
                demandPotential: 2000,
                priceSensitivity: 0.7, // Baja sensibilidad (pagan más)
                priceHardCap: 400, // Techo alto
                params: { w_price: 0.2, w_quality: 0.3, w_marketing: 0.1, w_ethics: 0.4 }, // Alta ética
                description: "Sociedad avanzada. Valora la sostenibilidad."
            },
            {
                name: 'Aurínea', // Mercado Tecnológico
                demandPotential: 2500,
                priceSensitivity: 0.9,
                priceHardCap: 350,
                params: { w_price: 0.3, w_quality: 0.5, w_marketing: 0.2, w_ethics: 0.0 }, // Alta Calidad/Tech
                description: "Hub tecnológico. Busca innovación."
            }
        ]);

        console.log('✨ ¡SEMILLA v2 COMPLETADA!');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR EN SEEDER:', error);
        process.exit(1);
    }
};

seedData();