// ============================================
// FILE: server/src/controllers/adminController.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Control del juego (Profesor)
// ============================================

const roundProcessor = require('../services/roundProcessor');
const GameSettings = require('../models/GameSettings');

// @desc    Forzar el procesamiento de la ronda (Avanzar Turno)
// @route   POST /api/admin/process-round
// @access  Private (Admin)
exports.processRound = async (req, res) => {
    try {
        console.log('👮 ADMIN: Iniciando procesamiento manual de ronda...');
        
        // Llamamos al orquestador
        const result = await roundProcessor.processGameRound();

        // Notificar vía Socket.io (Si está configurado)
        const io = req.app.get('io');
        if (io) {
            io.emit('round_processed', { 
                newRound: result.nextRound,
                message: 'La ronda ha finalizado. Resultados disponibles.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ronda procesada exitosamente',
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

// @desc    Obtener estado del juego
// @route   GET /api/admin/status
exports.getGameStatus = async (req, res) => {
    try {
        const settings = await GameSettings.findOne({ isActive: true });
        res.json(settings || { message: "No game settings found" });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving status' });
    }
};