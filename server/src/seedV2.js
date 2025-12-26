// ============================================
// FILE: server/src/seedV2.js
// PURPOSE: Poblar BD v2 con Productos, MP y Configuración de Juego
// EXECUTE: npm run seed:v2
// ============================================

const mongoose = require('mongoose');
const Product = require('./models/Product');
const RawMaterial = require('./models/RawMaterial');
const GameSettings = require('./models/GameSettings'); // <--- NUEVO
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

        // 1. LIMPIEZA TOTAL
        console.log('🧹 Limpiando colecciones...');
        await Product.deleteMany({});
        await RawMaterial.deleteMany({});
        await GameSettings.deleteMany({}); // <--- NUEVO

        // 2. INSERTAR CONFIGURACIÓN GLOBAL (Reglas del Juego)
        console.log('⚙️  Estableciendo Reglas del Juego (GameSettings)...');
        await GameSettings.create({
            totalProductionCapacity: 6000,
            initialCompanyCash: 500000.00,
            obsolescencePenaltyRate: 10,
            maxRounds: 12
        });

        // 3. INSERTAR MATERIAS PRIMAS
        console.log('📦 Insertando Materias Primas...');
        await RawMaterial.insertMany([
            { name: 'Alfa', baseCost: 15.00 },
            { name: 'Beta', baseCost: 25.00 },
            { name: 'Omega', baseCost: 5.00 }
        ]);

        // 4. INSERTAR PRODUCTOS
        console.log('🚀 Insertando Productos...');
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

        console.log('✨ ¡SEMILLA v2 COMPLETADA!');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR EN SEEDER:', error);
        process.exit(1);
    }
};

seedData();