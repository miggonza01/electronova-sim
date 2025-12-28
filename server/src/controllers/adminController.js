// ============================================
// FILE: server/src/controllers/adminController.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Control del juego (Admin) con soporte de Salas
// ============================================

const roundProcessor = require('../services/roundProcessor');
const Game = require('../models/Game');

// @desc    Forzar el procesamiento de la ronda (Avanzar Turno)
// @route   POST /api/admin/process-round
// @access  Private (Admin)
exports.processRound = async (req, res) => {
    try {
        // 1. Identificar qué juego procesar
        // Opción A: El ID viene en el cuerpo de la petición (Frontend Admin avanzado)
        let gameId = req.body.gameId;

        // Opción B: Si no viene, buscamos el juego ACTIVO de este administrador (Fallback)
        if (!gameId) {
            // Asumimos que req.user.id viene del middleware 'protect'
            const game = await Game.findOne({ adminId: req.user.id, status: 'ACTIVE' });
            
            if (!game) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No tienes ninguna partida activa para procesar.' 
                });
            }
            gameId = game._id;
            console.log(`👮 ADMIN: Juego detectado automáticamente: ${game.name} (${game.code})`);
        }

        console.log(`⚙️  Iniciando motor para Game ID: ${gameId}...`);
        
        // 2. Llamar al Orquestador (Pasando el ID explícito)
        const result = await roundProcessor.processGameRound(gameId);

        // 3. Notificar vía Socket.io
        const io = req.app.get('io');
        if (io) {
            // Emitimos un evento general. 
            // TODO: En el futuro, usar io.to(gameId) para emitir solo a esa sala.
            io.emit('round_processed', { 
                gameId: gameId,
                newRound: result.nextRound,
                message: 'La ronda ha finalizado. Resultados disponibles.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ronda procesada exitosamente',
            gameId: gameId,
            nextRound: result.nextRound
        });

    } catch (error) {
        console.error('Admin Process Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error crítico al procesar la ronda',
            error: error.message 
        });
    }
};

// @desc    Obtener estado del juego (Configuración actual)
// @route   GET /api/admin/status
// @access  Private (Admin)
exports.getGameStatus = async (req, res) => {
    try {
        // Buscar juegos de este admin
        const games = await Game.find({ adminId: req.user.id });

        if (!games || games.length === 0) {
            return res.status(404).json({ message: "No se encontraron partidas gestionadas por ti." });
        }

        // Por ahora, devolvemos la partida activa o la última creada
        // Esto permite que el dashboard del admin cargue datos sin selectores complejos aún
        const activeGame = games.find(g => g.status === 'ACTIVE') || games[games.length - 1];

        res.json(activeGame);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error recuperando estado del juego' });
    }
};

// @desc    Crear una nueva partida (Opcional para Fase 5.C)
// @route   POST /api/admin/games
// @access  Private (Admin)
exports.createGame = async (req, res) => {
    try {
        const { name, code, maxRounds } = req.body;

        const newGame = await Game.create({
            name: name || "Nueva Partida",
            code: code ? code.toUpperCase() : `GAME-${Math.floor(Math.random()*10000)}`,
            adminId: req.user.id,
            status: 'WAITING',
            config: {
                maxRounds: maxRounds || 8,
                initialCash: 500000
            }
        });

        res.status(201).json({
            success: true,
            data: newGame
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};