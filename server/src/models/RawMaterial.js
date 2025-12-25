// ============================================
// FILE: server/src/models/RawMaterial.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Definición de Insumos (Alfa, Beta, Omega)
// SPEC REF: 2.1 - Materia Prima
// ============================================

const mongoose = require('mongoose');

const RawMaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['Alfa', 'Beta', 'Omega'],
        required: true,
        unique: true
    },
    baseCost: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    // Descripción opcional para tooltips en el frontend
    description: String
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            if (ret.baseCost) ret.baseCost = parseFloat(ret.baseCost.toString());
            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('RawMaterial', RawMaterialSchema);