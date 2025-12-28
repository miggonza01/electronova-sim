// ============================================
// FILE: server/src/controllers/adminController.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Gestión de Salas y Control de Juego
// ============================================

const Game = require('../models/Game');
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const roundProcessor = require('../services/roundProcessor');

// Helper: Generar código de sala aleatorio (Ej: "FIN-9X2A")
const generateGameCode = () => {
    return 'ROOM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

// @desc    Crear nueva sala/partida
// @route   POST /api/admin/games
exports.createGame = async (req, res) => {
    try {
        const { name, maxRounds, initialCash } = req.body;

        const game = await Game.create({
            name: name || "Nueva Partida",
            code: generateGameCode(),
            adminId: req.user.id,
            status: 'WAITING', // Esperando alumnos
            currentRound: 0,   // Lobby
            config: {
                maxRounds: maxRounds || 8,
                initialCash: initialCash || 500000,
                // ... resto de defaults del Schema
            }
        });

        res.status(201).json({ success: true, data: game });
    } catch (error) {
        res.status(500).json({ message: 'Error creando partida', error: error.message });
    }
};

// @desc    Obtener todas las partidas del admin
// @route   GET /api/admin/games
exports.getMyGames = async (req, res) => {
    try {
        const games = await Game.find({ adminId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, count: games.length, data: games });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo partidas' });
    }
};

// @desc    Obtener detalle de una partida (Tablero de Control)
// @route   GET /api/admin/games/:id
exports.getGameDetails = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

        // Obtener empresas (alumnos) en esta sala
        const companies = await Company.find({ gameId: game._id });

        // Verificar quién ha enviado decisión para la ronda actual
        // (Si la ronda es 0, nadie puede enviar)
        let decisions = [];
        if (game.currentRound > 0) {
            decisions = await Decision.find({ 
                round: game.currentRound,
                companyId: { $in: companies.map(c => c._id) }
            });
        }

        // Mapear estado de alumnos
        const studentsStatus = companies.map(comp => {
            const hasSubmitted = decisions.some(d => d.companyId.toString() === comp._id.toString());
            return {
                companyId: comp._id,
                companyName: comp.name,
                cash: comp.cash,
                isBankrupt: comp.isBankrupt,
                hasSubmitted
            };
        });

        res.json({
            success: true,
            game,
            students: studentsStatus
        });

    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo detalles' });
    }
};

// @desc    Iniciar Juego (Pasar de Lobby a Ronda 1)
// @route   POST /api/admin/games/:id/start
exports.startGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (game.status !== 'WAITING') return res.status(400).json({ message: 'El juego ya inició' });

        game.status = 'ACTIVE';
        game.currentRound = 1;
        
        // Asignar cuotas iniciales a las empresas inscritas
        const companies = await Company.find({ gameId: game._id });
        const quota = Math.floor(game.config.totalProductionCapacity / (companies.length || 1));
        
        for (const comp of companies) {
            comp.productionQuota = quota;
            comp.currentRound = 1;
            await comp.save();
        }

        await game.save();
        res.json({ success: true, message: 'Juego Iniciado', game });

    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar' });
    }
};

// @desc    Procesar Ronda (Avanzar Turno)
// @route   POST /api/admin/games/:id/process
exports.processRound = async (req, res) => {
    try {
        const gameId = req.params.id;
        const game = await Game.findById(gameId);

        if (!game) return res.status(404).json({ message: 'Juego no encontrado' });
        if (game.status !== 'ACTIVE') return res.status(400).json({ message: 'El juego no está activo' });

        console.log(`👮 ADMIN: Procesando ronda ${game.currentRound} para sala ${game.code}...`);
        
        // LLAMADA AL MOTOR DE JUEGO
        const result = await roundProcessor.processGameRound(gameId);

        // Verificar Fin del Juego
        if (result.nextRound > game.config.maxRounds) {
            game.status = 'FINISHED';
            await game.save();
        }

        // Notificar sockets (opcional)
        const io = req.app.get('io');
        if (io) io.emit(`game_${gameId}_update`, { type: 'ROUND_PROCESSED', newRound: result.nextRound });

        res.status(200).json({
            success: true,
            message: 'Ronda procesada exitosamente',
            nextRound: result.nextRound
        });

    } catch (error) {
        console.error('Admin Process Error:', error);
        res.status(500).json({ message: 'Error crítico al procesar la ronda', error: error.message });
    }
};

// @desc    Obtener historial de una empresa específica (Para el Admin)
// @route   GET /api/admin/companies/:id/history
exports.getCompanyHistory = async (req, res) => {
    try {
        const companyId = req.params.id;
        
        // Validar que la empresa exista
        const company = await Company.findById(companyId);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        // Buscar decisiones
        const history = await Decision.find({ companyId }).sort({ round: 1 });

        res.json({
            success: true,
            companyName: company.name,
            data: history
        });
    } catch (error) {
        res.status(500).json({ message: 'Error recuperando historial' });
    }
};