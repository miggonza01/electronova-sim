// ============================================
// FILE: server/src/routes/decisionRoutes.js
// PURPOSE: Rutas para gestión de decisiones (Corregido)
// ============================================

const express = require('express');
const router = express.Router();

// IMPORTACIÓN CONSOLIDADA (Una sola línea para todas las funciones)
const { 
    saveDecision, 
    getCurrentDecision, 
    getDecisionHistory 
} = require('../controllers/decisionController');

const { protect } = require('../middlewares/authMiddleware');

// Definición de rutas
router.post('/', protect, saveDecision);
router.get('/current', protect, getCurrentDecision);
router.get('/history', protect, getDecisionHistory); // Nueva ruta para el dashboard

module.exports = router;