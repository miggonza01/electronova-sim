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
  // --- DECISIONES COMERCIALES ---
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    validate: {
      validator: (v) => v > 0,
      message: 'El precio debe ser positivo.'
    }
  },
  marketing: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0.00
  },
  // --- DECISIONES DE PRODUCCIÓN ---
  production: {
    units: { type: Number, default: 0 },
    // Aquí podríamos agregar compra de materia prima en el futuro
  },
  // --- DECISIONES LOGÍSTICAS ---
  // Array de envíos: ¿Cuántas unidades muevo y a dónde?
  logistics: [
    {
      destination: { type: String, enum: ['Norte', 'Sur', 'Centro'] },
      units: Number,
      method: { type: String, enum: ['Aereo', 'Terrestre'] }
    }
  ],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Evitar duplicados: Una empresa solo puede tener UNA decisión por ronda
DecisionSchema.index({ companyId: 1, round: 1 }, { unique: true });

// Conversión de Decimales para JSON
DecisionSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.price) ret.price = parseFloat(ret.price.toString());
    if (ret.marketing) ret.marketing = parseFloat(ret.marketing.toString());
    return ret;
  }
});

module.exports = mongoose.model('Decision', DecisionSchema);