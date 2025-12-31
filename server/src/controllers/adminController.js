// ============================================
// FILE: server/src/controllers/adminController.js
// VERSION: v2.3.1-fix
// PURPOSE: Gestión de Salas (Fix Delete Imports & Deep Clean)
// ============================================

const Game = require('../models/Game');
const Company = require('../models/Company');
const Decision = require('../models/Decision');
const User = require('../models/User'); // <--- FALTABA ESTA IMPORTACIÓN CRÍTICA
const FinancialStatement = require('../models/FinancialStatement'); // Nuevo para limpieza
const roundProcessor = require('../services/roundProcessor');
const scoreService = require('../services/scoreService');

// Helper: Generar código de sala aleatorio
const generateGameCode = () => {
    return 'ROOM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Helper: Calcular fecha límite
const calculateDeadline = (config) => {
    const now = new Date();
    const { days = 0, hours = 0, minutes = 10 } = config.duration || {};
    now.setDate(now.getDate() + parseInt(days));
    now.setHours(now.getHours() + parseInt(hours));
    now.setMinutes(now.getMinutes() + parseInt(minutes));
    return now;
};

// @desc    Crear nueva sala
// @route   POST /api/admin/games
exports.createGame = async (req, res) => {
    try {
        const { name, config } = req.body;

        const game = await Game.create({
            name: name || "Nueva Partida",
            code: generateGameCode(),
            adminId: req.user.id,
            status: 'WAITING',
            currentRound: 0,
            config: {
                maxRounds: config?.maxRounds || 8,
                initialCash: config?.initialCash || 500000,
                totalProductionCapacity: 6000,
                marketResearchRound: config?.marketResearchRound || 1,
                marketResearchCost: config?.marketResearchCost || 15000,
                duration: {
                    days: config?.duration?.days || 0,
                    hours: config?.duration?.hours || 0,
                    minutes: config?.duration?.minutes || 10
                },
                obsolescencePenaltyRate: 10,
                modifiers: { logisticsCost: 1, rawMaterialCost: 1, demand: 1 }
            }
        });

        res.status(201).json({ success: true, data: game });
    } catch (error) {
        res.status(500).json({ message: 'Error creando partida', error: error.message });
    }
};

// @desc    Obtener mis partidas
// @route   GET /api/admin/games
exports.getMyGames = async (req, res) => {
    try {
        let query = { adminId: req.user.id };
        
        // Si es superadmin, ve todo. Si no, solo lo suyo.
        if (req.user.role === 'superadmin') {
            query = {}; // Sin filtro
        }

        const games = await Game.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: games.length, data: games });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo partidas' });
    }
};

// @desc    Detalle de partida
// @route   GET /api/admin/games/:id
exports.getGameDetails = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

        const companies = await Company.find({ gameId: game._id });

        let decisions = [];
        if (game.currentRound > 0) {
            decisions = await Decision.find({ 
                round: game.currentRound,
                companyId: { $in: companies.map(c => c._id) }
            });
        }

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

        res.json({ success: true, game, students: studentsStatus });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo detalles' });
    }
};

// @desc    Iniciar Juego
// @route   POST /api/admin/games/:id/start
exports.startGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (game.status !== 'WAITING') return res.status(400).json({ message: 'El juego ya inició' });

        game.status = 'ACTIVE';
        game.currentRound = 1;
        game.roundEndsAt = calculateDeadline(game.config);
        
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

// @desc    Procesar Ronda
// @route   POST /api/admin/games/:id/process
// [MODIFICADO] Procesar Ronda (Ahora envía status por socket)
exports.processRound = async (req, res) => {
    try {
        const gameId = req.params.id;
        const game = await Game.findById(gameId);

        if (!game) return res.status(404).json({ message: 'Juego no encontrado' });
        if (game.status !== 'ACTIVE') return res.status(400).json({ message: 'El juego no está activo' });

        console.log(`👮 ADMIN: Procesando ronda ${game.currentRound} para sala ${game.code}...`);
        
        const result = await roundProcessor.processGameRound(gameId);

        if (result.nextRound > game.config.maxRounds) {
            game.status = 'FINISHED';
            game.roundEndsAt = null;
        } else {
            game.roundEndsAt = calculateDeadline(game.config);
        }
        await game.save();

        const io = req.app.get('io');
        if (io) {
            // [CAMBIO] Enviamos gameStatus para que el frontend sepa si redirigir a Game Over
            io.emit('round_change', { 
                gameId: game._id, 
                newRound: result.nextRound,
                roundEndsAt: game.roundEndsAt,
                gameStatus: game.status // <--- NUEVO CAMPO CRÍTICO
            });
        }

        res.status(200).json({ success: true, message: 'Ronda procesada', nextRound: result.nextRound });
    } catch (error) {
        console.error('Admin Process Error:', error);
        res.status(500).json({ message: 'Error crítico al procesar', error: error.message });
    }
};

// [NUEVO] Obtener Ranking en Tiempo Real
// @route GET /api/admin/games/:id/ranking
exports.getGameRanking = async (req, res) => {
    try {
        const gameId = req.params.id;
        // Reutilizamos el servicio de score que ya creamos
        const ranking = await scoreService.calculateFinalScores(gameId);
        
        res.json({
            success: true,
            ranking: ranking.map(r => ({
                id: r.company._id,
                name: r.company.name,
                wsc: r.rawScore,
                details: {
                    netIncome: r.netIncome,
                    revenue: r.revenue,
                    ethics: r.ethics,
                    tech: r.tech
                }
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error calculando ranking' });
    }
};

// @desc    Editar partida
// @route   PUT /api/admin/games/:id
exports.updateGame = async (req, res) => {
    try {
        const { config, name } = req.body;
        const game = await Game.findById(req.params.id);

        if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

        if (name) game.name = name;
        if (config) {
            game.config = { ...game.config.toObject(), ...config };
        }

        await game.save();
        res.json({ success: true, message: 'Partida actualizada', data: game });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar' });
    }
};

// @desc    Eliminar partida (Limpieza en Cascada)
// @route   DELETE /api/admin/games/:id
exports.deleteGame = async (req, res) => {
    try {
        const gameId = req.params.id;
        
        // 1. Identificar empresas a borrar para limpiar sus datos hijos
        const companies = await Company.find({ gameId });
        const companyIds = companies.map(c => c._id);

        // 2. Eliminar Datos Hijos (Decisiones y Finanzas)
        await Decision.deleteMany({ companyId: { $in: companyIds } });
        await FinancialStatement.deleteMany({ companyId: { $in: companyIds } });

        // 3. Eliminar Empresas
        await Company.deleteMany({ gameId });
        
        // 4. Desvincular Usuarios
        await User.updateMany({ currentGame: gameId }, { $set: { currentGame: null } });

        // 5. Eliminar Juego
        await Game.findByIdAndDelete(gameId);

        console.log(`🗑️ ADMIN: Sala ${gameId} eliminada con todos sus datos.`);
        res.json({ success: true, message: 'Partida y datos asociados eliminados' });
    } catch (error) {
        console.error("Error deleting game:", error);
        res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

// @desc    Historial de empresa
// @route   GET /api/admin/companies/:id/history
exports.getCompanyHistory = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const history = await Decision.find({ companyId }).sort({ round: 1 });

        res.json({ success: true, companyName: company.name, data: history });
    } catch (error) {
        res.status(500).json({ message: 'Error recuperando historial' });
    }
};

// @desc    Obtener resultados finales (Ranking)
// @route   GET /api/admin/games/:id/results
exports.getGameResults = async (req, res) => {
    try {
        const gameId = req.params.id;
        const game = await Game.findById(gameId);
        
        if (!game) return res.status(404).json({ message: 'Juego no encontrado' });

        // Calculamos scores al vuelo (o podríamos guardarlos en DB al finalizar)
        const ranking = await scoreService.calculateFinalScores(gameId);

        res.json({
            success: true,
            gameStatus: game.status,
            ranking: ranking.map(r => ({
                id: r.company._id,
                name: r.company.name,
                wsc: r.rawScore,
                details: {
                    netIncome: r.netIncome,
                    revenue: r.revenue,
                    ethics: r.ethics,
                    tech: r.tech
                }
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error calculando resultados' });
    }
};

// @desc    Expulsar alumno de una sala
// @route   DELETE /api/admin/games/:gameId/players/:companyId
exports.removePlayer = async (req, res) => {
    try {
        const { gameId, companyId } = req.params;

        // 1. Validar permisos (Si no es superadmin, debe ser dueño de la sala)
        const game = await Game.findById(gameId);
        if (!game) return res.status(404).json({ message: 'Sala no encontrada' });
        
        if (req.user.role !== 'superadmin' && game.adminId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para gestionar esta sala' });
        }

        // 2. Eliminar Datos del Alumno
        await Decision.deleteMany({ companyId });
        await FinancialStatement.deleteMany({ companyId });
        
        // 3. Desvincular Usuario (Buscar usuario dueño de la empresa)
        const company = await Company.findById(companyId);
        if (company) {
            await User.findByIdAndUpdate(company.user, { $set: { currentGame: null } });
            await Company.findByIdAndDelete(companyId);
        }

        res.json({ success: true, message: 'Jugador eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando jugador' });
    }
};