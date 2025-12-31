// ============================================
// FILE: server/src/fixIndexes.js
// PURPOSE: Borrar índices antiguos que bloquean Multijugador
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/fixIndexes.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
require('dotenv').config();

const fix = async () => {
    try {
        const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
        await mongoose.connect(dbUri);
        console.log('🔌 Conectado a DB. Iniciando reparación...');

        const collection = mongoose.connection.collection('companies');
        
        // 1. Listar índices actuales
        const indexes = await collection.indexes();
        console.log('📋 Índices actuales:', indexes.map(i => i.name));

        // 2. Intentar borrar el índice problemático (user_1)
        try {
            await collection.dropIndex('user_1');
            console.log('✅ Índice bloqueante "user_1" ELIMINADO con éxito.');
        } catch (e) {
            console.log('ℹ️ El índice "user_1" no existía o ya fue borrado.');
        }

        // 3. Forzar sincronización de nuevos índices definidos en el Schema
        console.log('🔄 Sincronizando nuevos índices...');
        await Company.syncIndexes();
        
        const newIndexes = await collection.indexes();
        console.log('📋 Índices finales:', newIndexes.map(i => i.name));

        console.log('✨ REPARACIÓN COMPLETADA. Ahora puedes unirte a múltiples salas.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fix();