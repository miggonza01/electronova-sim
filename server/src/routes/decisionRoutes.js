// server/src/routes/decisionRoutes.js
const express = require('express');
const router = express.Router();
const { submitDecision, getCurrentDecision } = require('../controllers/decisionController');
const { protect } = require('../middlewares/authMiddleware');

// Todas estas rutas están protegidas (necesitan Login)
router.post('/', protect, submitDecision);
router.get('/current', protect, getCurrentDecision);

module.exports = router;