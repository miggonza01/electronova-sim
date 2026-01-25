// ============================================
// FILE: server/src/routes/financialRoutes.js
// PURPOSE: Rutas de Reportes Financieros
// ============================================

const express = require('express');
const router = express.Router();
const { getMyFinancials, getFinancialsByRound } = require('../controllers/financialController');
const { protect } = require('../middleware/authMiddleware');

// Validar que el controlador exista (si no lo creamos en pasos anteriores, avísame)
if (!getMyFinancials) {
    console.warn("⚠️ financialController no implementado completamente.");
}

router.get('/', protect, getMyFinancials);
router.get('/:round', protect, getFinancialsByRound);

module.exports = router;