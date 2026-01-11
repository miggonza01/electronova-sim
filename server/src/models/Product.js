// ============================================
// FILE: server/src/models/Product.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Esquema para las Líneas de Producto (Gamas) con precisión financiera
// CHANGE LOG: Creación inicial
// SPEC REF: 2.1 - Entidades Fundamentales (Producto)
// ============================================

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
name: {
        type: String,
        enum: ['Alta', 'Media', 'Básica'], // Restricción estricta según PDF
        required: true,
        unique: true
    },
    baseProductionCost: {
        type: mongoose.Schema.Types.Decimal128, // Precisión financiera obligatoria
        required: true,
        default: 0.0
    },
    // Fórmula de Materia Prima: Qué necesita este producto para fabricarse
    // Ej: Gama Alta consume { materialType: 'Alfa', quantity: 2 }
    rawMaterialRequirements: [{
        materialType: { 
            type: String, 
            enum: ['Alfa', 'Beta', 'Omega'], // Se validará contra RawMaterial
            required: true 
        },
        quantity: { 
            type: Number, 
            required: true,
            min: 0
        }
    }],
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: {
        // Conversión automática de Decimal128 a Number al enviar al Frontend
        transform: (doc, ret) => {
            if (ret.baseProductionCost) {
                ret.baseProductionCost = parseFloat(ret.baseProductionCost.toString());
            }
            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('Product', ProductSchema);