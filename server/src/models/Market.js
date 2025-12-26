// ============================================
// FILE: server/src/models/Market.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Definición de las Plazas Comerciales
// SPEC REF: 2.1 - Entidades (Plaza/Mercado)
// ============================================

const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['Novaterra', 'Solís', 'Veridia', 'Aurínea'],
        required: true,
        unique: true
    },
    // Demanda Base Total (D_total antes de eventos)
    demandPotential: { type: Number, required: true },
    
    // Sensibilidad al Precio (Elasticidad)
    // Valor alto (>1) = Muy sensible (Si subes precio, venta cae mucho)
    priceSensitivity: { type: Number, required: true },
    
    // Precio Máximo Aceptable (Hard Cap)
    // Si te pasas de esto, la demanda cae drásticamente (fórmula pág 5)
    priceHardCap: { type: Number, required: true },
    
    // Preferencias del Mercado (Pesos para el Score Competitivo)
    // Suma idealmente cercana a 1.0 o normalizada en el motor
    params: {
        w_price: { type: Number, default: 0.4 },    // Peso Precio
        w_quality: { type: Number, default: 0.3 },  // Peso Calidad
        w_marketing: { type: Number, default: 0.2 },// Peso Marketing
        w_ethics: { type: Number, default: 0.1 }    // Peso Ética
    },

    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Market', MarketSchema);