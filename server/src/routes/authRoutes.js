// ============================================
// FILE: server/src/routes/authRoutes.js
// PURPOSE: Definición de endpoints de autenticación
// ============================================

const express = require('express');
const router = express.Router();
const { register, login, getMe, getMyRooms, switchRoom, joinGame } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rutas Públicas
router.post('/register', register);
router.post('/login', login);

// Rutas Privadas 
router.get('/profile', protect, getMe);

// Gestión de Salas
router.get('/rooms', protect, getMyRooms);
router.post('/switch-room', protect, switchRoom);
router.post('/join-game', protect, joinGame);

module.exports = router;