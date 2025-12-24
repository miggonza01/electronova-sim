// server/src/models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    default: 'ElectroNova Startup'
  },
  financials: {
    cash: { type: mongoose.Schema.Types.Decimal128, default: 500000.00 },
    assets: { type: mongoose.Schema.Types.Decimal128, default: 500000.00 },
    liabilities: { type: mongoose.Schema.Types.Decimal128, default: 0.00 }
  },
  // Materia Prima
  rawMaterials: {
    units: { type: Number, default: 0 },
    averageCost: { type: mongoose.Schema.Types.Decimal128, default: 0.00 }
  },
  // [NUEVO] Stock en Fábrica (Recién producido, NO vendible aún)
  factoryStock: {
    units: { type: Number, default: 0 },
    unitCost: { type: mongoose.Schema.Types.Decimal128, default: 0.00 }
  },
  // [NUEVO] Logística (Mercancía viajando)
  inTransit: [
    {
      batchId: String,
      units: Number,
      destination: String, // Por ahora "Plaza Central"
      method: String,      // "Aereo" o "Terrestre"
      roundsRemaining: Number, // 1 o 2
      unitCost: mongoose.Schema.Types.Decimal128
    }
  ],
  // Inventario en Plaza (Disponible para venta inmediata)
  inventory: [
    {
      batchId: { type: String, required: true },
      units: { type: Number, required: true },
      unitCost: { type: mongoose.Schema.Types.Decimal128, required: true },
      age: { type: Number, default: 0 },
      isObsolete: { type: Boolean, default: false }
    }
  ],
  history: [
    {
      round: Number,
      cash: Number,
      wsc: Number,
      unitsSold: Number,
      revenue: Number
    }
  ],
  kpi: {
    ethics: { type: Number, default: 100, min: 0, max: 100 },
    satisfaction: { type: Number, default: 100, min: 0, max: 100 },
    wsc: { type: Number, default: 0 } 
  },
  currentRound: {
    type: Number,
    default: 1
  }
});

// Transformación para que el Frontend reciba números simples
CompanySchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.financials.cash) ret.financials.cash = parseFloat(ret.financials.cash.toString());
    if (ret.financials.assets) ret.financials.assets = parseFloat(ret.financials.assets.toString());
    if (ret.financials.liabilities) ret.financials.liabilities = parseFloat(ret.financials.liabilities.toString());
    
    // Inventario Plaza
    if (ret.inventory) {
        ret.inventory.forEach(item => {
            if(item.unitCost) item.unitCost = parseFloat(item.unitCost.toString());
        });
    }
    // [NUEVO] Fábrica
    if (ret.factoryStock && ret.factoryStock.unitCost) {
       ret.factoryStock.unitCost = parseFloat(ret.factoryStock.unitCost.toString());
    }
    // [NUEVO] Tránsito
    if (ret.inTransit) {
        ret.inTransit.forEach(item => {
            if(item.unitCost) item.unitCost = parseFloat(item.unitCost.toString());
        });
    }
    // Materia Prima
    if (ret.rawMaterials && ret.rawMaterials.averageCost) {
      ret.rawMaterials.averageCost = parseFloat(ret.rawMaterials.averageCost.toString());
    }
    return ret;
  }
});

module.exports = mongoose.model('Company', CompanySchema);