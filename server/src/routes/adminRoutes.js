// ============================================
// FILE: server/src/routes/adminRoutes.js
// PURPOSE: Rutas de Administración de Salas
// ============================================

const express = require('express');
const router = express.Router();
const { 
    createGame, 
    getMyGames, 
    getGameDetails, 
    startGame, 
    processRound 
} = require('../controllers/adminController');

const { protect } = require('../middlewares/authMiddleware');

// Middleware de protección: Solo usuarios logueados pueden acceder
// TODO: Agregar middleware 'admin' para verificar rol si se desea estricto
router.use(protect); 

// Gestión de Salas
router.post('/games', createGame);
router.get('/games', getMyGames);
router.get('/games/:id', getGameDetails);

// Control de Flujo
router.post('/games/:id/start', startGame);
router.post('/games/:id/process', processRound);

module.exports = router;