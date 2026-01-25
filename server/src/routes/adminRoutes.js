// ============================================
// FILE: server/src/routes/adminRoutes.js
// VERSION: v2.4.0-random-events
// PURPOSE: Rutas administrativas con control de eventos aleatorios
// CHANGE LOG: Added event history and random events control endpoints
// SPEC REF: "4.2 - Eventos Aleatorios" - Panel de Control Administrativo
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
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

const { protect } = require('../middleware/authMiddleware');

// Importar servicios adicionales para eventos aleatorios
const Game = require('../models/Game');
const Company = require('../models/Company');
const randomEventService = require('../services/randomEventService');
const obsolescenceService = require('../services/obsolescenceService');

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

// ============================================
// NUEVAS RUTAS - CONTROL DE EVENTOS ALEATORIOS
// ============================================

/**
 * GET /api/admin/games/:gameId/events
 * Obtener historial completo de eventos aleatorios de un juego
 */
router.get('/games/:gameId/events', async (req, res) => {
    try {
        const { gameId } = req.params;

        // Obtener historial de eventos
        const eventHistory = await randomEventService.getEventHistory(gameId);

        res.json({
            success: true,
            data: eventHistory,
            message: 'Historial de eventos obtenido exitosamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial de eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo historial de eventos',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/games/:gameId/obsolescence-report
 * Generar reporte detallado de obsolescencia para administradores
 */
router.get('/games/:gameId/obsolescence-report', async (req, res) => {
    try {
        const { gameId } = req.params;

        // Obtener empresas del juego
        const companies = await Company.find({ gameId });

        // Generar reporte de obsolescencia
        const obsolescenceReport = obsolescenceService.generateObsolescenceReport(companies);

        res.json({
            success: true,
            data: obsolescenceReport,
            message: 'Reporte de obsolescencia generado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error generando reporte de obsolescencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando reporte de obsolescencia',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/games/:gameId/random-events/config
 * Actualizar configuración de eventos aleatorios
 */
router.put('/games/:gameId/random-events/config', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { enabled, startRound, probability, maxOnePerRound } = req.body;

        // Validar datos
        if (probability !== undefined && (probability < 0 || probability > 1)) {
            return res.status(400).json({
                success: false,
                message: 'La probabilidad debe estar entre 0 y 1'
            });
        }

        if (startRound !== undefined && startRound < 1) {
            return res.status(400).json({
                success: false,
                message: 'La ronda de inicio debe ser mayor o igual a 1'
            });
        }

        // Actualizar configuración del juego
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        // Actualizar configuración de eventos aleatorios
        if (enabled !== undefined) game.config.randomEvents.enabled = enabled;
        if (startRound !== undefined) game.config.randomEvents.startRound = startRound;
        if (probability !== undefined) game.config.randomEvents.probability = probability;
        if (maxOnePerRound !== undefined) game.config.randomEvents.maxOnePerRound = maxOnePerRound;

        await game.save();

        console.log(`🎲 CONFIG ACTUALIZADA: Juego ${game.code}`);
        console.log(`   - Events: ${game.config.randomEvents.enabled}`);
        console.log(`   - Start Round: ${game.config.randomEvents.startRound}`);
        console.log(`   - Probability: ${game.config.randomEvents.probability}`);
        console.log(`   - Max One Per Round: ${game.config.randomEvents.maxOnePerRound}`);

        res.json({
            success: true,
            data: game.config.randomEvents,
            message: 'Configuración de eventos aleatorios actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando configuración de eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando configuración de eventos',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/games/:gameId/capacity
 * Actualizar capacidad total de producción (solo antes de iniciar juego)
 */
router.put('/games/:gameId/capacity', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { totalProductionCapacity } = req.body;

        // Validar capacidad
        if (!totalProductionCapacity || totalProductionCapacity < 1000 || totalProductionCapacity > 50000) {
            return res.status(400).json({
                success: false,
                message: 'La capacidad debe estar entre 1000 y 50000 unidades'
            });
        }

        // Actualizar capacidad del juego
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        // Solo permitir cambiar capacidad si el juego no está activo
        if (game.status === 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'No se puede cambiar la capacidad de un juego activo'
            });
        }

        game.config.totalProductionCapacity = totalProductionCapacity;
        await game.save();

        console.log(`🏭 CAPACIDAD ACTUALIZADA: Juego ${game.code} → ${totalProductionCapacity}`);

        res.json({
            success: true,
            data: { totalProductionCapacity },
            message: 'Capacidad de producción actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando capacidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando capacidad de producción',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/games/:gameId/dashboard
 * Panel de control completo con todos los datos administrativos
 */
router.get('/games/:gameId/dashboard', async (req, res) => {
    try {
        const { gameId } = req.params;

        // Obtener datos del juego
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Juego no encontrado'
            });
        }

        // Obtener empresas del juego
        const companies = await Company.find({ gameId });

        // Obtener historial de eventos
        const eventHistory = await randomEventService.getEventHistory(gameId);

        // Generar reporte de obsolescencia
        const obsolescenceReport = obsolescenceService.generateObsolescenceReport(companies);

        // Calcular estadísticas del juego
        const gameStats = {
            totalCompanies: companies.length,
            activeCompanies: companies.filter(c => c.productionQuota > 0).length,
            totalCash: companies.reduce((sum, c) => sum + parseFloat(c.cash.toString()), 0),
            averageTechLevel: companies.reduce((sum, c) => sum + c.techLevel, 0) / companies.length,
            averageEthics: companies.reduce((sum, c) => sum + c.ethicsIndex, 0) / companies.length,
            currentRound: game.currentRound,
            maxRounds: game.config.maxRounds
        };

        res.json({
            success: true,
            data: {
                game: {
                    id: game._id,
                    name: game.name,
                    code: game.code,
                    status: game.status,
                    currentRound: game.currentRound,
                    config: game.config
                },
                stats: gameStats,
                eventHistory,
                obsolescenceReport
            },
            message: 'Panel de control obtenido exitosamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo panel de control:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo panel de control',
            error: error.message
        });
    }
});

module.exports = router;