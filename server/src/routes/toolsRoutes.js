// ============================================
// FILE: server/src/routes/toolsRoutes.js
// PURPOSE: Rutas para herramientas
// ============================================

const express = require('express');
const router = express.Router();
const { buyMarketResearch } = require('../controllers/toolsController');
const { protect } = require('../middleware/authMiddleware');

router.post('/market-research', protect, buyMarketResearch);

module.exports = router;