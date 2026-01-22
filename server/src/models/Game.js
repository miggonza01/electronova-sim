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

    // NUEVO: Fecha límite para la ronda actual (para el temporizador)
    roundEndsAt: { type: Date },
    
    // Configuración de la Partida (Hereda de GameSettings pero personalizable por sala)
    config: {
        maxRounds: { type: Number, default: 8 },
        initialCash: { type: Number, default: 500000 },
        totalProductionCapacity: { type: Number, default: 6000 },
        
        // NUEVO: Duración desglosada
        duration: {
            days: { type: Number, default: 0 },
            hours: { type: Number, default: 0 },
            minutes: { type: Number, default: 10 }
        },

        // Configuración de Mercado
        marketResearchRound: { type: Number, default: 1 }, 
        marketResearchCost: { type: Number, default: 15000 },

// Parámetros económicos
        obsolescencePenaltyRate: { type: Number, default: 10 },
        
        // NUEVO: Configuración de Eventos Aleatorios
        randomEvents: {
            enabled: { type: Boolean, default: true },
            startRound: { type: Number, default: 2 }, // Ronda a partir de la cual ocurren eventos
            probability: { type: Number, default: 0.15 }, // 15% probabilidad por ronda
            maxOnePerRound: { type: Boolean, default: true } // Solo un evento por ronda
        },
        
        modifiers: {
            logisticsCost: { type: Number, default: 1.0 },
            rawMaterialCost: { type: Number, default: 1.0 },
            demand: { type: Number, default: 1.0 }
        }
    },

// NUEVO: Histórico de Eventos Aleatorios por Ronda
    eventHistory: [{
        round: { type: Number, required: true },
        eventId: { type: String, required: true },
        eventName: { type: String, required: true },
        eventDescription: { type: String, required: true },
        eventImpact: { type: String, required: true }, // Descripción del impacto para usuarios
        triggeredAt: { type: Date, default: Date.now },
        modifiers: { // Modificadores aplicados por este evento
            demand: { type: Number },
            logisticsCost: { type: Number },
            rawMaterialCost: { type: Number },
            productionCapacity: { type: Number }
        }
    }],

    // Fechas
    createdAt: { type: Date, default: Date.now },
    lastProcessedAt: { type: Date }
});

module.exports = mongoose.model('Game', GameSchema);