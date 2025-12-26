// ============================================
// FILE: server/src/models/Event.js
// VERSION: v2.2.0-alpha.1
// PURPOSE: Registro de Eventos Aleatorios (NewsFeed)
// SPEC REF: T3.1 - EventSchema
// ============================================

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    round: { type: Number, required: true },
    
    // Tipo de evento para lógica interna
    type: { 
        type: String, 
        enum: ['LOGISTICS_STRIKE', 'MATERIAL_SHORTAGE', 'MARKET_BOOM', 'MARKET_CRASH', 'NONE'],
        required: true 
    },
    
    // Título y Mensaje para mostrar en el Dashboard
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    // Severidad (Visual: info, warning, danger, success)
    severity: { 
        type: String, 
        enum: ['info', 'warning', 'danger', 'success'],
        default: 'info'
    },
    
    // Duración en rondas (Generalmente 1 para v2 simple)
    duration: { type: Number, default: 1 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);