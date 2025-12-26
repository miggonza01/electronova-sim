// ============================================
// FILE: server/src/routes/financialRoutes.js
// PURPOSE: Rutas de Contabilidad
// ============================================

const express = require('express');
const router = express.Router();
const { getMyFinancials, getFinancialsByRound } = require('../controllers/financialController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas protegidas (Requieren Token)
router.get('/', protect, getMyFinancials);
router.get('/:round', protect, getFinancialsByRound);

module.exports = router;