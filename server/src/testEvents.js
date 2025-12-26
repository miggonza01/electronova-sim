// ============================================
// FILE: server/src/testEvents.js
// PURPOSE: Verificar generación y persistencia de eventos
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testEvents.js
// ============================================

const mongoose = require('mongoose');
const GameSettings = require('./models/GameSettings');
const Event = require('./models/Event');
const eventEngine = require('./services/eventEngine');
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada.');
};

const runTest = async () => {
    try {
        await connectDB();

        // 1. Limpiar eventos previos
        await Event.deleteMany({});
        
        // 2. Forzar Evento para la Ronda 5 (Simulada)
        console.log('\n🧪 Forzando evento aleatorio...');
        const event = await eventEngine.triggerEventForNextRound(5, null, true); // true = force

        // 3. Verificar Base de Datos
        const settings = await GameSettings.findOne({ isActive: true });
        const savedEvent = await Event.findOne({ round: 5 });

        console.log('\n📊 RESULTADOS:');
        
        if (savedEvent) {
            console.log(`   📰 Noticia: [${savedEvent.severity.toUpperCase()}] ${savedEvent.title}`);
            console.log(`   💬 Mensaje: "${savedEvent.message}"`);
        } else {
            console.error('❌ ERROR: No se creó el documento Event.');
        }

        console.log('\n🔧 MODIFICADORES ACTIVOS:');
        console.log(JSON.stringify(settings.currentModifiers, null, 2));

        // Validación Lógica
        const mods = settings.currentModifiers;
        const isModified = mods.logisticsCost !== 1 || mods.rawMaterialCost !== 1 || mods.demand !== 1;

        if (isModified && savedEvent) {
            console.log('\n✅ PRUEBA EXITOSA: El sistema reaccionó y alteró la realidad.');
        } else {
            console.error('\n❌ FALLO: Los modificadores siguen en 1.0 o no hay evento.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();