// ============================================
// FILE: server/src/app.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Orquestador principal del Backend (Soporte Híbrido v1.3/v2.0)
// CHANGE LOG: Refactorización completa para soportar entorno aislado v2
// ============================================

// --- 1. IMPORTACIONES DEL NÚCLEO ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config(); // Carga variables si no se usó dotenv-cli

// --- 2. IMPORTACIÓN DE RUTAS (Basado en tu estructura) ---
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const financialRoutes = require('./routes/financialRoutes');

// --- 3. IMPORTACIÓN DE SOCKETS ---
// Asegúrate de que tu socketHandler exporte una función que reciba (io)
const socketHandler = require('./sockets/socketHandler');

// --- 4. INICIALIZACIÓN DE SERVIDOR ---
const app = express();
const server = http.createServer(app); // Servidor HTTP nativo para soportar WebSockets

// Configuración de Socket.io
const io = new Server(server, {
    cors: {
        // En desarrollo v2 permitimos cualquier origen para facilitar pruebas
        origin: process.env.NODE_ENV === 'development' ? "*" : [
            "https://electronova-sim.vercel.app",
            "http://localhost:5173"
        ],
        methods: ["GET", "POST"]
    }
});

// Inyectar instancia de IO en la app para usarla en controladores (req.app.get('io'))
app.set('io', io);

// Inicializar lógica de Sockets
// Nota: Si socketHandler no es una función, comenta esta línea temporalmente
try {
    if (typeof socketHandler === 'function') {
        socketHandler(io);
    } else {
        console.warn('⚠️ socketHandler no exporta una función. Sockets no inicializados en app.js');
    }
} catch (error) {
    console.warn('⚠️ Error al cargar socketHandler:', error.message);
}

// --- 5. MIDDLEWARES GLOBALES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 6. CONEXIÓN A BASE DE DATOS (SMART SWITCHING) ---
// Esta lógica permite usar la BD de desarrollo si existe la variable V2
const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;

if (!dbUri) {
    console.error('❌ FATAL ERROR: No se ha definido ninguna cadena de conexión a MongoDB.');
    process.exit(1);
}

// Extracción del nombre de la BD para feedback visual
const dbName = dbUri.split('/').pop().split('?')[0];

console.log('----------------------------------------------------');
console.log(`🔌 INICIANDO SISTEMA ELECTRONOVA...`);
console.log(`🎯 MODO: ${process.env.MONGODB_URI_V2 ? '🛠️  DESARROLLO V2 (AISLADO)' : '🚀 PRODUCCIÓN V1'}`);
console.log(`🗄️  BASE DE DATOS: ${dbName}`);
console.log('----------------------------------------------------');

mongoose.connect(dbUri)
    .then(() => console.log(`✅ CONEXIÓN EXITOSA A MONGODB`))
    .catch((err) => {
        console.error('❌ ERROR CRÍTICO DE BASE DE DATOS:', err);
        process.exit(1);
    });

// --- 7. MONTAJE DE RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes); // Estandarización plural
app.use('/api/decisions', decisionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/financials', financialRoutes);

// Ruta de Salud (Health Check)
app.get('/', (req, res) => {
    res.send(`ElectroNova API Running - Mode: ${process.env.MONGODB_URI_V2 ? 'v2-DEV' : 'PROD'}`);
});

// --- 8. ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR CORRIENDO EN PUERTO: ${PORT}`);
    console.log(`📡 SOCKETS ACTIVOS`);
});

module.exports = app; // Exportar para tests si es necesario