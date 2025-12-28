// ============================================
// FILE: server/src/routes/authRoutes.js
// PURPOSE: Definición de endpoints de autenticación
// ============================================

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas Públicas
router.post('/register', register);
router.post('/login', login);

// Rutas Privadas (Aquí estaba el error 404, faltaba esta línea)
router.get('/profile', protect, getMe);

module.exports = router;