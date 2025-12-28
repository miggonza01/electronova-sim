// ============================================
// FILE: server/src/createPlayer.js
// PURPOSE: Crear un usuario y empresa válidos para jugar en Frontend v2
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/createPlayer.js
// ============================================

const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const GameSettings = require('./models/GameSettings');
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada.');
};

const createPlayer = async () => {
    try {
        await connectDB();

        const EMAIL = 'player1@electronova.com';
        const PASSWORD = 'password123';

        // 1. Limpiar usuario previo si existe
        await User.deleteOne({ email: EMAIL });
        // Limpiar empresa huérfana si existe
        // (Nota: Esto es simplificado, en prod borraríamos por ID de usuario)
        
        // 2. Crear Usuario
        console.log('👤 Creando Usuario...');
        const user = await User.create({
            name: 'Player One',
            email: EMAIL,
            password: PASSWORD, // El modelo hará el hash automáticamente
            role: 'student'
        });

        // 3. Obtener Configuración
        const settings = await GameSettings.findOne({ isActive: true });
        const initialCash = settings ? settings.initialCompanyCash : 500000;

        // 4. Crear Empresa
        console.log('🏭 Creando Empresa...');
        await Company.create({
            user: user._id,
            name: 'NovaTech Industries',
            cash: initialCash,
            currentRound: settings.currentRound || 1,
            techLevel: 1,
            ethicsIndex: 100,
            productionQuota: settings.totalProductionCapacity || 6000
        });

        console.log('\n✅ JUGADOR CREADO EXITOSAMENTE');
        console.log('-----------------------------------');
        console.log(`📧 Email:    ${EMAIL}`);
        console.log(`🔑 Password: ${PASSWORD}`);
        console.log('-----------------------------------');
        console.log('👉 Usa estas credenciales en http://localhost:5174');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createPlayer();