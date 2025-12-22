// server/src/models/GlobalConfig.js
const mongoose = require('mongoose');

const GlobalConfigSchema = new mongoose.Schema({
  currentRound: {
    type: Number,
    default: 1
  },
  gameActive: {
    type: Boolean,
    default: true // El juego empieza activo
  },
  loanInterestRate: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.05 // 5% por ronda
  },
  storageCostPerUnit: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.20
  },
  // Aquí podríamos añadir más variables globales (costos de MP, etc.)
  // Por ahora, estos son los esenciales.
});

// Convertir Decimales para JSON
GlobalConfigSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.loanInterestRate) ret.loanInterestRate = parseFloat(ret.loanInterestRate.toString());
    if (ret.storageCostPerUnit) ret.storageCostPerUnit = parseFloat(ret.storageCostPerUnit.toString());
    return ret;
  }
});

module.exports = mongoose.model('GlobalConfig', GlobalConfigSchema);