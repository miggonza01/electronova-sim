// ============================================
// FILE: server/src/controllers/decisionController.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: API de Decisiones (Contexto Game)
// ============================================

const Decision = require('../models/Decision');
const Company = require('../models/Company');
const Game = require('../models/Game'); // Reemplaza a GameSettings

// @desc    Guardar o Actualizar decisión
// @route   POST /api/decisions
// @access  Private (Student)
exports.saveDecision = async (req, res) => {
    try {
        // 1. Identificar Empresa del Usuario
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        if (company.isBankrupt) {
            return res.status(400).json({ message: 'Tu empresa está en bancarrota.' });
        }

        // 2. Obtener el Juego (Sala)
        const game = await Game.findById(company.gameId);
        if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

        if (game.status !== 'ACTIVE') {
            return res.status(400).json({ message: 'La partida no está activa.' });
        }

        // 3. Validar Ronda
        const currentRound = game.currentRound;

        // 4. Upsert Decisión
        const { production, procurement, logistics, commercial } = req.body;

        const decision = await Decision.findOneAndUpdate(
            { companyId: company._id, round: currentRound },
            {
                production,
                procurement,
                logistics,
                commercial,
                submittedAt: Date.now()
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: `Decisión guardada para la Ronda ${currentRound}`,
            data: decision
        });

    } catch (error) {
        console.error('Error saving decision:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar decisión',
            error: error.message 
        });
    }
};

// @desc    Obtener decisión actual
// @route   GET /api/decisions/current
// @access  Private
exports.getCurrentDecision = async (req, res) => {
    try {
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const game = await Game.findById(company.gameId);
        if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

        const decision = await Decision.findOne({ 
            companyId: company._id, 
            round: game.currentRound 
        });

        res.status(200).json({
            success: true,
            round: game.currentRound,
            data: decision || null
        });

    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Obtener historial
// @route   GET /api/decisions/history
// @access  Private
exports.getDecisionHistory = async (req, res) => {
    try {
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const history = await Decision.find({ companyId: company._id }).sort({ round: 1 });

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};