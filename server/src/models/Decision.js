// ============================================
// FILE: server/src/models/Decision.js
// VERSION: v2.0.0-beta.1
// PURPOSE: Formulario de Decisiones (Incluye Precios y Marketing)
// SPEC REF: 5.1 - Formulario de Decisiones
// ============================================

const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    round: {
        type: Number,
        required: true
    },
    
    // --- 1. PRODUCCIÓN ---
    production: [{
        productLine: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        units: { type: Number, required: true, min: 0 }
    }],

    // --- 2. COMPRAS ---
    procurement: [{
        materialType: { type: String, enum: ['Alfa', 'Beta', 'Omega'] },
        supplierType: { type: String, enum: ['local', 'imported'] },
        units: { type: Number, min: 0 }
    }],

    // --- 3. LOGÍSTICA ---
    logistics: [{
        productLine: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        destination: { type: String, enum: ['Novaterra', 'Solís', 'Veridia', 'Aurínea'] },
        method: { type: String, enum: ['terrestre', 'aereo'] },
        units: { type: Number, min: 0 }
    }],

    // --- 4. ESTRATEGIA COMERCIAL (NUEVO) ---
    commercial: [{
        market: { 
            type: String, 
            enum: ['Novaterra', 'Solís', 'Veridia', 'Aurínea'],
            required: true 
        },
        marketingBudget: { type: Number, default: 0, min: 0 }, // Inversión en publicidad
        prices: [{
            productLine: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            price: { type: Number, required: true, min: 0 }
        }]
    }],

    submittedAt: { type: Date, default: Date.now }
});

DecisionSchema.index({ companyId: 1, round: 1 }, { unique: true });

module.exports = mongoose.model('Decision', DecisionSchema);