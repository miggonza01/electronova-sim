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
    processRound,
    getCompanyHistory,
    updateGame,
    deleteGame,
    getGameResults,
    getGameRanking,
    removePlayer
} = require('../controllers/adminController');

const { protect } = require('../middlewares/authMiddleware');

// Middleware de protección: Solo usuarios logueados pueden acceder
// TODO: Agregar middleware 'admin' para verificar rol si se desea estricto
router.use(protect); 

// Gestión de Salas
router.post('/games', createGame);
router.get('/games', getMyGames);
router.get('/games/:id', getGameDetails);
router.put('/games/:id', updateGame);    // Editar
router.delete('/games/:id', deleteGame); // Eliminar
router.get('/games/:id/results', getGameResults);
router.get('/games/:id/ranking', getGameRanking);

// Control de Flujo
router.post('/games/:id/start', startGame);
router.post('/games/:id/process', processRound);

// Inspección
router.get('/companies/:id/history', getCompanyHistory); 

router.delete('/games/:gameId/players/:companyId', removePlayer);

module.exports = router;