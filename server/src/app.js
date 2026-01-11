// ============================================
// FILE: server/src/app.js
// VERSION: v2.4.0-random-events
// PURPOSE: Orquestador principal con eventos aleatorios integrados
// CHANGE LOG: Added random events service initialization
// SPEC REF: "4.2 - Eventos Aleatorios"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Importar servicios de eventos aleatorios
const randomEventService = require('./services/randomEventService');

// --- 1. IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const financialRoutes = require('./routes/financialRoutes'); // <--- FALTABA POSIBLEMENTE
const productRoutes = require('./routes/productRoutes');     // <--- FALTABA POSIBLEMENTE
// const companyRoutes = require('./routes/companyRoutes'); // (Opcional si no se usa directo)
const toolsRoutes = require('./routes/toolsRoutes');

// --- 2. CONFIGURACIÓN SERVIDOR ---
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Permitir conexiones desde Frontend v2 (puerto 5174)
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

// --- 3. MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 4. BASE DE DATOS ---
const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
if (!dbUri) {
    console.error('❌ FATAL: No MongoDB URI.');
    process.exit(1);
}

mongoose.connect(dbUri)
    .then(async () => {
        console.log(`✅ MONGODB CONECTADO: ${dbUri.split('/').pop().split('?')[0]}`);
        
        // Inicializar eventos aleatorios después de conectar
        try {
            await randomEventService.initializeEvents();
            console.log('🎲 Eventos aleatorios inicializados');
        } catch (error) {
            console.error('❌ Error inicializando eventos aleatorios:', error);
        }
    })
    .catch(err => console.error('❌ ERROR DB:', err));

// --- 5. MONTAJE DE RUTAS (ENDPOINTS) ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/decisions', decisionRoutes);   // Debe existir decisionRoutes.js
app.use('/api/financials', financialRoutes); // Debe existir financialRoutes.js
app.use('/api/products', productRoutes);     // Debe existir productRoutes.js
app.use('/api/tools', toolsRoutes);          // Debe existir toolsRoutes.js

// Ruta de salud
app.get('/', (req, res) => res.send('ElectroNova API v2.3 Online'));

// --- 6. ARRANQUE ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 SERVIDOR CORRIENDO EN PUERTO: ${PORT}`);
});

module.exports = app;