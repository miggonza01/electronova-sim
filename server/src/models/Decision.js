// server/src/models/Decision.js
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
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    validate: { validator: (v) => v > 0, message: 'Precio positivo requerido' }
  },
  marketing: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.00
  },
  procurement: {
    units: { type: Number, default: 0 }
  },
  production: {
    units: { type: Number, default: 0 },
  },
  // [ACTUALIZADO] Estructura real de logística
  logistics: [
    {
      destination: { type: String, default: 'Plaza Central' },
      units: { type: Number, required: true },
      method: { type: String, enum: ['Aereo', 'Terrestre'], required: true }
    }
  ],
  submittedAt: { type: Date, default: Date.now }
});

DecisionSchema.index({ companyId: 1, round: 1 }, { unique: true });
DecisionSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.price) ret.price = parseFloat(ret.price.toString());
    if (ret.marketing) ret.marketing = parseFloat(ret.marketing.toString());
    return ret;
  }
});

module.exports = mongoose.model('Decision', DecisionSchema);