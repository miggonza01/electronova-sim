// server/src/models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: { type: String, required: true, default: 'ElectroNova Startup' },
  
  financials: {
    cash: { type: mongoose.Schema.Types.Decimal128, default: 500000.00 },
    assets: { type: mongoose.Schema.Types.Decimal128, default: 500000.00 },
    liabilities: { type: mongoose.Schema.Types.Decimal128, default: 0.00 }
  },
  
  rawMaterials: {
    units: { type: Number, default: 0 },
    averageCost: { type: mongoose.Schema.Types.Decimal128, default: 0.00 }
  },
  
  factoryStock: {
    units: { type: Number, default: 0 },
    unitCost: { type: mongoose.Schema.Types.Decimal128, default: 0.00 }
  },
  
  inTransit: [
    {
      batchId: String,
      units: Number,
      destination: String, // "Norte", "Sur", "Centro"
      method: String,
      roundsRemaining: Number,
      unitCost: mongoose.Schema.Types.Decimal128
    }
  ],
  
  // INVENTARIO EN PLAZA
  inventory: [
    {
      batchId: { type: String, required: true },
      market: { type: String, required: true }, // [NUEVO] ¿Dónde está este lote?
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
  
  currentRound: { type: Number, default: 1 }
});

CompanySchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.financials.cash) ret.financials.cash = parseFloat(ret.financials.cash.toString());
    if (ret.financials.assets) ret.financials.assets = parseFloat(ret.financials.assets.toString());
    if (ret.financials.liabilities) ret.financials.liabilities = parseFloat(ret.financials.liabilities.toString());
    
    if (ret.inventory) {
        ret.inventory.forEach(item => {
            if(item.unitCost) item.unitCost = parseFloat(item.unitCost.toString());
        });
    }
    if (ret.factoryStock && ret.factoryStock.unitCost) {
       ret.factoryStock.unitCost = parseFloat(ret.factoryStock.unitCost.toString());
    }
    if (ret.inTransit) {
        ret.inTransit.forEach(item => {
            if(item.unitCost) item.unitCost = parseFloat(item.unitCost.toString());
        });
    }
    if (ret.rawMaterials && ret.rawMaterials.averageCost) {
      ret.rawMaterials.averageCost = parseFloat(ret.rawMaterials.averageCost.toString());
    }
    return ret;
  }
});

module.exports = mongoose.model('Company', CompanySchema);