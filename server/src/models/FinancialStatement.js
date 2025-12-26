// ============================================
// FILE: server/src/models/FinancialStatement.js
// VERSION: v2.1.0-alpha.1
// PURPOSE: Repositorio de Estados Financieros (ER y BG) por ronda
// SPEC REF: T2.1 - FinancialStatementSchema
// ============================================

const mongoose = require('mongoose');

const FinancialStatementSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    round: {
        type: Number,
        required: true
    },
    
    // --- ESTADO DE RESULTADOS (INCOME STATEMENT) ---
    // Mide el desempeño durante la ronda
    incomeStatement: {
        revenue: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // Ventas Totales
        cogs: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },    // Costo de Ventas (FIFO)
        grossProfit: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // Utilidad Bruta
        
        expenses: {
            marketing: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
            logistics: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
            storage: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // Costo de mantener inventario
            obsolescence: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // Castigo por inventario viejo
            rnd: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },      // Investigación y Desarrollo
            financial: { type: mongoose.Schema.Types.Decimal128, default: 0.0 } // Intereses (Futuro)
        },
        
        operatingProfit: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // EBIT
        netIncome: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }        // Utilidad Neta
    },

    // --- BALANCE GENERAL (BALANCE SHEET) ---
    // Mide la riqueza al final de la ronda (Foto)
    balanceSheet: {
        assets: {
            cash: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
            inventoryValue: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // Valor MP + PT + Tránsito
            fixedAssets: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },    // Planta y Equipo (Futuro)
            totalAssets: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }
        },
        liabilities: {
            shortTermDebt: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
            totalLiabilities: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }
        },
        equity: {
            retainedEarnings: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }, // Utilidad Acumulada
            capital: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },          // Capital Social Inicial
            totalEquity: { type: mongoose.Schema.Types.Decimal128, default: 0.0 }
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            // Helper recursivo para convertir Decimal128 a Number en todo el objeto
            const convertDecimal = (obj) => {
                for (const key in obj) {
                    if (obj[key] && typeof obj[key] === 'object') {
                        if (obj[key].toString && obj[key]._bsontype === 'Decimal128') {
                            obj[key] = parseFloat(obj[key].toString());
                        } else {
                            convertDecimal(obj[key]);
                        }
                    }
                }
            };
            convertDecimal(ret);
            delete ret.__v;
            return ret;
        }
    }
});

// Índice único: Una empresa solo tiene un estado financiero por ronda
FinancialStatementSchema.index({ companyId: 1, round: 1 }, { unique: true });

module.exports = mongoose.model('FinancialStatement', FinancialStatementSchema);