// ============================================
// FILE: server/src/controllers/decisionController.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: API para que los estudiantes guarden sus decisiones
// SPEC REF: T1.5 - Endpoints de Decisiones
// ============================================

const Decision = require('../models/Decision');
const GameSettings = require('../models/GameSettings');
const Company = require('../models/Company');

// @desc    Guardar o Actualizar decisión para la ronda actual
// @route   POST /api/decisions
// @access  Private (Student)
exports.saveDecision = async (req, res) => {
    try {
        // 1. Obtener Ronda Actual
        const settings = await GameSettings.findOne({ isActive: true });
        if (!settings) return res.status(500).json({ message: 'Error de configuración de juego' });

        const currentRound = settings.currentRound;

        // 2. Identificar Empresa del Usuario
        // Asumimos que req.user.id viene del middleware de auth
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        if (company.isBankrupt) {
            return res.status(400).json({ message: 'Tu empresa está en bancarrota. No puedes tomar decisiones.' });
        }

        // 3. Validar Estructura Básica (Opcional: usar Joi aquí para validación estricta)
        const { production, procurement, logistics, commercial } = req.body;

        // 4. Upsert (Crear o Actualizar)
        // Buscamos si ya existe decisión para esta empresa y ronda
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

// @desc    Obtener decisión de la ronda actual (para rellenar el formulario)
// @route   GET /api/decisions/current
// @access  Private
exports.getCurrentDecision = async (req, res) => {
    try {
        const settings = await GameSettings.findOne({ isActive: true });
        const company = await Company.findOne({ user: req.user.id });
        
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const decision = await Decision.findOne({ 
            companyId: company._id, 
            round: settings.currentRound 
        });

        res.status(200).json({
            success: true,
            round: settings.currentRound,
            data: decision || null // Si es null, el front debe mostrar formulario vacío
        });

    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Obtener historial de decisiones
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