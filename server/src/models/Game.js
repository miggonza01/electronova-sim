// ============================================
// FILE: server/src/models/Game.js
// VERSION: v2.3.0-alpha.1
// PURPOSE: Definición de una Partida/Sala (Multi-tenancy)
// SPEC REF: Fase 5 - Gestión de Salas
// ============================================

const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    // Identificación
    name: { type: String, required: true, trim: true }, // Ej: "Clase Finanzas A"
    code: { type: String, required: true, unique: true, uppercase: true }, // Ej: "FIN-2025"
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Estado del Juego
    status: { 
        type: String, 
        enum: ['WAITING', 'ACTIVE', 'PAUSED', 'FINISHED'], 
        default: 'WAITING' 
    },
    currentRound: { type: Number, default: 0 }, // 0 = Lobby, 1 = Ronda 1
    
    // Configuración de la Partida (Hereda de GameSettings pero personalizable por sala)
    config: {
        maxRounds: { type: Number, default: 8 },
        roundDurationMinutes: { type: Number, default: 10 },
        initialCash: { type: Number, default: 500000 },
        totalProductionCapacity: { type: Number, default: 6000 },
        
        // Ronda en la que se habilita el estudio de mercado (0 = siempre, 99 = nunca)
        marketResearchRound: { type: Number, default: 1 }, 
        marketResearchCost: { type: Number, default: 15000 },

        // Parámetros económicos
        obsolescencePenaltyRate: { type: Number, default: 10 },
        
        // Modificadores de Eventos (Específicos de esta sala)
        modifiers: {
            logisticsCost: { type: Number, default: 1.0 },
            rawMaterialCost: { type: Number, default: 1.0 },
            demand: { type: Number, default: 1.0 }
        }
    },

    // Fechas
    createdAt: { type: Date, default: Date.now },
    lastProcessedAt: { type: Date }
});

module.exports = mongoose.model('Game', GameSchema);