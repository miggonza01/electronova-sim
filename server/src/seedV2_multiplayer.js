// ============================================
// FILE: server/src/seedV2_multiplayer.js
// PURPOSE: Reiniciar BD con estructura Multijugador (Game + Players)
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/seedV2_multiplayer.js
// ============================================

const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Game = require('./models/Game');
const Product = require('./models/Product');
const RawMaterial = require('./models/RawMaterial');
const Market = require('./models/Market');
const Decision = require('./models/Decision');
const FinancialStatement = require('./models/FinancialStatement');
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada.');
};

const seedData = async () => {
    try {
        await connectDB();

        // 1. LIMPIEZA TOTAL
        console.log('🧹 Limpiando base de datos...');
        await User.deleteMany({});
        await Company.deleteMany({});
        await Game.deleteMany({});
        await Product.deleteMany({});
        await RawMaterial.deleteMany({});
        await Market.deleteMany({});
        await Decision.deleteMany({});
        await FinancialStatement.deleteMany({});

        // 2. CREAR DATOS MAESTROS (Globales)
        console.log('🌍 Creando Datos Maestros...');
        
        await RawMaterial.insertMany([
            { name: 'Alfa', baseCost: 15.00 },
            { name: 'Beta', baseCost: 25.00 },
            { name: 'Omega', baseCost: 5.00 }
        ]);

        const products = await Product.insertMany([
            {
                name: 'Alta', baseProductionCost: 50.00,
                rawMaterialRequirements: [{ materialType: 'Alfa', quantity: 2 }, { materialType: 'Beta', quantity: 3 }]
            },
            {
                name: 'Media', baseProductionCost: 30.00,
                rawMaterialRequirements: [{ materialType: 'Alfa', quantity: 2 }, { materialType: 'Omega', quantity: 1 }]
            },
            {
                name: 'Básica', baseProductionCost: 15.00,
                rawMaterialRequirements: [{ materialType: 'Omega', quantity: 3 }]
            }
        ]);

        await Market.insertMany([
            { name: 'Novaterra', demandPotential: 3000, priceSensitivity: 1.0, priceHardCap: 250, params: { w_price: 0.4, w_quality: 0.3, w_marketing: 0.2, w_ethics: 0.1 } },
            { name: 'Solís', demandPotential: 5000, priceSensitivity: 1.5, priceHardCap: 200, params: { w_price: 0.6, w_quality: 0.2, w_marketing: 0.2, w_ethics: 0.0 } },
            { name: 'Veridia', demandPotential: 2000, priceSensitivity: 0.7, priceHardCap: 400, params: { w_price: 0.2, w_quality: 0.3, w_marketing: 0.1, w_ethics: 0.4 } },
            { name: 'Aurínea', demandPotential: 2500, priceSensitivity: 0.9, priceHardCap: 350, params: { w_price: 0.3, w_quality: 0.5, w_marketing: 0.2, w_ethics: 0.0 } }
        ]);

        // 3. CREAR USUARIOS (Admin y Player)
        console.log('👤 Creando Usuarios...');
        
        const adminUser = await User.create({
            name: 'Profesor Admin',
            email: 'admin@electronova.com',
            password: 'adminpassword',
            role: 'admin'
        });

        const studentUser = await User.create({
            name: 'Estudiante Demo',
            email: 'student@electronova.com',
            password: 'password123',
            role: 'student'
        });

        // 4. CREAR PARTIDA (GAME)
        console.log('🎲 Creando Partida Demo...');
        
        const game = await Game.create({
            name: 'Clase Finanzas 101',
            code: 'DEMO-2025',
            adminId: adminUser._id,
            status: 'ACTIVE',
            currentRound: 1,
            config: {
                maxRounds: 8,
                roundDurationMinutes: 10,
                initialCash: 500000,
                totalProductionCapacity: 6000,
                marketResearchRound: 1 // Habilitado desde el inicio para pruebas
            }
        });

        // Vincular estudiante al juego
        studentUser.currentGame = game._id;
        await studentUser.save();

        // 5. CREAR EMPRESA (Vinculada al Juego)
        console.log('🏭 Creando Empresa del Estudiante...');
        
        await Company.create({
            user: studentUser._id,
            gameId: game._id, // <--- VINCULACIÓN CRÍTICA
            name: 'NovaTech Student Corp',
            cash: game.config.initialCash,
            currentRound: 1,
            techLevel: 1,
            ethicsIndex: 100,
            productionQuota: game.config.totalProductionCapacity, // Asignación inicial
            
            // Inventario inicial vacío
            rawMaterials: [],
            factoryStock: [],
            inventory: [],
            inTransit: { materials: [], products: [] }
        });

        console.log('\n✅ SEED MULTIJUGADOR COMPLETADO');
        console.log('-----------------------------------');
        console.log('🔑 Admin:   admin@electronova.com / adminpassword');
        console.log('🔑 Alumno:  student@electronova.com / password123');
        console.log('🎮 Sala:    DEMO-2025 (ID: ' + game._id + ')');
        console.log('-----------------------------------');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error en Seed:', error);
        process.exit(1);
    }
};

seedData();