const express = require('express');
const router = express.Router();
const { processRound, getGameStatus } = require('../controllers/adminController');
// const { protect, admin } = require('../middlewares/authMiddleware');

// Rutas protegidas (Simplificado para dev v2)
router.post('/process-round', processRound); // Agregar middlewares protect/admin después
router.get('/status', getGameStatus);

module.exports = router;