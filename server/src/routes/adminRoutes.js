// ============================================
// FILE: server/src/routes/adminRoutes.js
// PURPOSE: Rutas de Administración
// ============================================

const express = require('express');
const router = express.Router();

// Importamos el controlador. 
// IMPORTANTE: Asegúrate de que adminController.js esté guardado.
const { processRound, getGameStatus } = require('../controllers/adminController');

// Definición de rutas
// Si processRound es undefined aquí, lanzará el error "handler must be a function"
router.post('/process-round', processRound);
router.get('/status', getGameStatus);

module.exports = router;