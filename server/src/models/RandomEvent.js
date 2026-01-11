// ============================================
// FILE: server/src/models/RandomEvent.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Definición de Eventos Aleatorios del Simulador
// CHANGE LOG: New model for random events system
// SPEC REF: "4.2 - Eventos Aleatorios"
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const mongoose = require('mongoose');

const RandomEventSchema = new mongoose.Schema({
    // Identificación
    eventId: { type: String, required: true, unique: true }, // Ej: "DEMAND_BOOM", "SUPPLY_CRISIS"
    name: { type: String, required: true }, // Ej: "Auge de Demanda", "Crisis de Suministro"
    category: { 
        type: String, 
        enum: ['DEMAND', 'SUPPLY', 'LOGISTICS', 'ECONOMIC', 'TECHNOLOGY', 'REGULATORY'],
        required: true 
    },
    
    // Descripciones (para diferentes audiencias)
    description: {
        technical: { type: String, required: true }, // Descripción técnica para admin
        user: { type: String, required: true } // Descripción amigable para jugadores
    },
    
    // Impacto del evento
    impact: {
        demand: { type: Number, default: 1.0 }, // Multiplicador de demanda (0.5 = -50%, 2.0 = +100%)
        logisticsCost: { type: Number, default: 1.0 }, // Multiplicador de costo logístico
        rawMaterialCost: { type: Number, default: 1.0 }, // Multiplicador de costo de materia prima
        productionCapacity: { type: Number, default: 1.0 }, // Multiplicador de capacidad de producción
        techLevel: { type: Number, default: 1.0 }, // Multiplicador de nivel tecnológico
        ethicsIndex: { type: Number, default: 1.0 } // Multiplicador de índice de ética
    },
    
    // Configuración de probabilidad
    probability: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 1 
    }, // Probabilidad base de ocurrencia
    
    // Restricciones
    restrictions: {
        minRound: { type: Number, default: 1 }, // Ronda mínima para ocurrir
        maxRound: { type: Number }, // Ronda máxima (opcional)
        mutuallyExclusive: [{ type: String }], // IDs de eventos que no pueden ocurrir juntos
        requiredConditions: [{ // Condiciones requeridas para ocurrir
            type: { type: String, enum: ['MARKET_SHARE', 'CASH_LEVEL', 'TECH_LEVEL'] },
            operator: { type: String, enum: ['>', '<', '>=', '<=', '=='] },
            value: { type: mongoose.Schema.Types.Mixed }
        }]
    },
    
    // Duración y efectos
    duration: { 
        type: Number, 
        default: 1 
    }, // Duración en rondas (1 = solo esa ronda)
    
    // Efectos especiales
    specialEffects: [{
        type: { type: String, enum: ['NOTIFICATION', 'MARKET_CRASH', 'INNOVATION_BOOST'] },
        parameters: { type: mongoose.Schema.Types.Mixed }
    }],
    
    // Estado
    isActive: { type: Boolean, default: true },
    
    // Metadatos
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Índices para rendimiento
RandomEventSchema.index({ eventId: 1 });
RandomEventSchema.index({ category: 1 });
RandomEventSchema.index({ isActive: 1 });

module.exports = mongoose.model('RandomEvent', RandomEventSchema);