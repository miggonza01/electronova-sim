// ============================================
// FILE: server/src/routes/decisionRoutes.js
// PURPOSE: Rutas de Decisiones (Guardar, Leer Actual, Historial)
// ============================================

const express = require('express');
const router = express.Router();
const { 
    saveDecision, 
    getCurrentDecision, 
    getDecisionHistory, // <--- CRÍTICO: Debe estar importado
    getResults 
} = require('../controllers/decisionController');
const { protect } = require('../middleware/authMiddleware');

// Validar importación (Debugging)
if (!saveDecision || !getCurrentDecision || !getDecisionHistory) {
    console.error("❌ ERROR: Funciones faltantes en decisionController");
}

router.post('/', protect, saveDecision);
router.get('/current', protect, getCurrentDecision);
router.get('/history', protect, getDecisionHistory); // <--- CRÍTICO: Esta es la ruta que da 404
router.get('/results', protect, getResults);

module.exports = router;