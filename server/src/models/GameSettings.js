// ============================================
// FILE: server/src/models/GameSettings.js
// VERSION: v2.2.0-alpha.1
// PURPOSE: Configuración global + Modificadores de Eventos
// SPEC REF: 4.1 - GameSettings Schema & Fase 3
// ============================================

const mongoose = require('mongoose');

const GameSettingsSchema = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    
    // Parámetros Base
    totalProductionCapacity: { type: Number, default: 6000 },
    initialCompanyCash: { type: mongoose.Schema.Types.Decimal128, default: 500000.00 },
    obsolescencePenaltyRate: { type: Number, default: 10 },
    
    maxRounds: { type: Number, default: 12 },
    currentRound: { type: Number, default: 1 },
    
    // Configuración Base de Proveedores
    supplierConfig: {
        local: {
            costMultiplier: { type: Number, default: 1.2 },
            ethicsBonus: { type: Number, default: 5 },
            leadTime: { type: Number, default: 1 }
        },
        imported: {
            costMultiplier: { type: Number, default: 1.0 },
            ethicsBonus: { type: Number, default: 0 },
            leadTime: { type: Number, default: 2 }
        }
    },

    // --- NUEVO: MODIFICADORES TEMPORALES POR EVENTOS ---
    // Estos valores se reinician a 1.0 al inicio de cada ronda
    // y se modifican si ocurre un evento.
    currentModifiers: {
        logisticsCost: { type: Number, default: 1.0 }, // Ej: 2.0 = Doble costo
        rawMaterialCost: { type: Number, default: 1.0 },
        demand: { type: Number, default: 1.0 } // Ej: 0.8 = Crisis (80% demanda)
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