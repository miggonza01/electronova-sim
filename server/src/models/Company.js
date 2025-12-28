// ============================================
// FILE: server/src/models/Company.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Modelo Central de la Empresa (Estructura Compleja v2)
// CHANGE LOG: Migración a Arrays de Subdocumentos, Cash en raíz, Decimal128
// SPEC REF: 2.1 (Entidades), 4.1 (Esquemas), 4.2 (Lotes)
// ============================================

const mongoose = require('mongoose');

// --- SUB-ESQUEMAS (Componentes internos) ---

// 1. Inventario de Materia Prima en Planta
const RawMaterialStockSchema = new mongoose.Schema({
    materialType: { 
        type: String, 
        enum: ['Alfa', 'Beta', 'Omega'], 
        required: true 
    },
    units: { type: Number, default: 0, min: 0 },
    averageCost: { type: mongoose.Schema.Types.Decimal128, default: 0.0 } // Costo Promedio Ponderado
}, { _id: false });

// 2. Inventario de Producto Terminado en Planta (Factory Stock)
const FactoryStockSchema = new mongoose.Schema({
    productLine: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    units: { type: Number, default: 0, min: 0 },
    unitCost: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }
}, { _id: false });

// 3. Lotes de Inventario en Mercados (Ventas) - SPEC REF: Pág 9
const InventoryLotSchema = new mongoose.Schema({
    productLine: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    market: { 
        type: String, 
        enum: ['Novaterra', 'Solís', 'Veridia', 'Aurínea'], 
        required: true 
    },
    units: { type: Number, required: true, min: 0 },
    unitCost: { type: mongoose.Schema.Types.Decimal128, required: true },
    ageInRounds: { type: Number, default: 0, min: 0 } // Para cálculo de obsolescencia
});

// 4. Tránsitos (Logística y Compras) - SPEC REF: Pág 3
const InboundMaterialSchema = new mongoose.Schema({
    materialType: { type: String, required: true },
    supplierType: { type: String, enum: ['local', 'imported'], required: true },
    units: { type: Number, required: true },
    totalCost: { type: mongoose.Schema.Types.Decimal128, required: true }, // Costo total del lote
    roundsUntilArrival: { type: Number, required: true }
});

const OutboundProductSchema = new mongoose.Schema({
    productLine: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    destination: { type: String, required: true },
    units: { type: Number, required: true },
    unitCost: { type: mongoose.Schema.Types.Decimal128, required: true },
    roundsUntilArrival: { type: Number, required: true }
});

// --- ESQUEMA PRINCIPAL ---

const CompanySchema = new mongoose.Schema({
    // Vinculación a Partida
    gameId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Game', 
        required: true 
    },
    // Identidad y Auth
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: { type: String, required: true, default: 'ElectroNova Inc.' },
    
    // Estado Financiero y Estratégico (Raíz según PDF 2.1)
    cash: { 
        type: mongoose.Schema.Types.Decimal128, 
        default: 500000.00 
    },
    techLevel: { type: Number, default: 1, min: 1 },
    ethicsIndex: { type: Number, default: 100, min: 0, max: 100 },
    productionQuota: { type: Number, default: 0 }, // Se recalcula cada ronda
    assignedCDP: { type: String, default: 'Novaterra', immutable: true },

    // Gestión de Recursos (Arrays de Subdocumentos)
    rawMaterials: [RawMaterialStockSchema],
    factoryStock: [FactoryStockSchema],
    inventory: [InventoryLotSchema], // Lotes vendibles en plazas
    
    // Logística en movimiento
    inTransit: {
        materials: [InboundMaterialSchema], // Compras llegando
        products: [OutboundProductSchema]    // Envíos saliendo
    },

    // Histórico y KPI (Simplificado para v2)
    currentRound: { type: Number, default: 1 },
    isBankrupt: { type: Boolean, default: false }

}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            // Helper para convertir Decimal128 a float
            const toFloat = (val) => val ? parseFloat(val.toString()) : 0;

            ret.cash = toFloat(ret.cash);
            
            if (ret.rawMaterials) ret.rawMaterials.forEach(x => x.averageCost = toFloat(x.averageCost));
            if (ret.factoryStock) ret.factoryStock.forEach(x => x.unitCost = toFloat(x.unitCost));
            if (ret.inventory) ret.inventory.forEach(x => x.unitCost = toFloat(x.unitCost));
            
            if (ret.inTransit) {
                if (ret.inTransit.materials) ret.inTransit.materials.forEach(x => x.totalCost = toFloat(x.totalCost));
                if (ret.inTransit.products) ret.inTransit.products.forEach(x => x.unitCost = toFloat(x.unitCost));
            }

            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('Company', CompanySchema);