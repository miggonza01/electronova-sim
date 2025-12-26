// ============================================
// FILE: server/src/models/GameSettings.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Configuración global de parámetros de juego (Admin)
// SPEC REF: 4.1 - GameSettings Schema
// ============================================

const mongoose = require('mongoose');

const GameSettingsSchema = new mongoose.Schema({
    // Identificador único para configuración activa (usualmente solo habrá 1 doc)
    isActive: { type: Boolean, default: true },
    
    // Parámetros de Producción
    totalProductionCapacity: { 
        type: Number, 
        default: 6000, 
        min: 1000 
    },
    
    // Parámetros Financieros
    initialCompanyCash: { 
        type: mongoose.Schema.Types.Decimal128, 
        default: 500000.00 
    },
    obsolescencePenaltyRate: { 
        type: Number, 
        default: 10, 
        min: 0, 
        max: 100,
        description: "Porcentaje de valor perdido por inventario antiguo (>3 rondas)"
    },
    
    // Parámetros de Tiempo
    maxRounds: { type: Number, default: 10 },
    currentRound: { type: Number, default: 1 },
    
    // Configuración de Proveedores (Multiplicadores)
    supplierConfig: {
        local: {
            costMultiplier: { type: Number, default: 1.2 }, // +20% costo
            ethicsBonus: { type: Number, default: 5 },      // +5 puntos ética
            leadTime: { type: Number, default: 1 }          // 1 ronda
        },
        imported: {
            costMultiplier: { type: Number, default: 1.0 }, // Costo base
            ethicsBonus: { type: Number, default: 0 },
            leadTime: { type: Number, default: 2 }          // 2 rondas
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            if (ret.initialCompanyCash) {
                ret.initialCompanyCash = parseFloat(ret.initialCompanyCash.toString());
            }
            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('GameSettings', GameSettingsSchema);