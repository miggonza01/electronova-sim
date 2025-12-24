// server/src/models/GlobalConfig.js
const mongoose = require('mongoose');

const MarketConfigSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Norte", "Sur", "Centro"
  baseDemand: { type: Number, required: true }, // Ej: 5000
  priceSensitivity: { type: Number, required: true }, // Ej: 1.5 (Baja), 3.0 (Alta)
  maxAcceptablePrice: { type: Number, required: true } // Ej: 400, 200
});

const GlobalConfigSchema = new mongoose.Schema({
  currentRound: {
    type: Number,
    default: 1
  },
  gameActive: {
    type: Boolean,
    default: true 
  },
  loanInterestRate: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.05
  },
  storageCostPerUnit: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.20
  },
  // [NUEVO] Configuración de Plazas
  markets: [MarketConfigSchema]
});

GlobalConfigSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.loanInterestRate) ret.loanInterestRate = parseFloat(ret.loanInterestRate.toString());
    if (ret.storageCostPerUnit) ret.storageCostPerUnit = parseFloat(ret.storageCostPerUnit.toString());
    return ret;
  }
});

module.exports = mongoose.model('GlobalConfig', GlobalConfigSchema);