// ============================================
// FILE: server/src/services/accountingService.js
// VERSION: v2.1.0-beta.1
// PURPOSE: Generar reportes financieros (ER y BG)
// SPEC REF: T2.2 - Accounting Service
// ============================================

const FinancialStatement = require('../models/FinancialStatement');
const mongoose = require('mongoose');

/**
 * Calcula el valor total del inventario actual (MP + Fábrica + Tránsito + Plazas).
 * Usado para el Balance General (Activos).
 */
const calculateTotalInventoryValue = (company) => {
    let total = 0;

    // 1. Materia Prima
    if (company.rawMaterials) {
        company.rawMaterials.forEach(rm => {
            total += (rm.units * parseFloat(rm.averageCost.toString()));
        });
    }

    // 2. Stock en Fábrica
    if (company.factoryStock) {
        company.factoryStock.forEach(fs => {
            total += (fs.units * parseFloat(fs.unitCost.toString()));
        });
    }

    // 3. Inventario en Plazas
    if (company.inventory) {
        company.inventory.forEach(inv => {
            total += (inv.units * parseFloat(inv.unitCost.toString()));
        });
    }

    // 4. Tránsito (MP y PT)
    if (company.inTransit) {
        if (company.inTransit.materials) {
            company.inTransit.materials.forEach(m => {
                total += parseFloat(m.totalCost.toString());
            });
        }
        if (company.inTransit.products) {
            company.inTransit.products.forEach(p => {
                // Aquí unitCost incluye flete capitalizado
                total += (p.units * parseFloat(p.unitCost.toString()));
            });
        }
    }

    return total;
};

/**
 * Cierra la contabilidad de la ronda, genera el reporte y lo guarda.
 * 
 * @param {Object} company - Documento de la empresa (Estado Final)
 * @param {Number} round - Número de ronda
 * @param {Object} opsData - Datos acumulados de operaciones { revenue, cogs, marketing, logistics, obsolescence }
 * @param {Object} session - Sesión de Mongoose para transacción
 */
exports.closeAccountingRound = async (company, round, opsData, session) => {
    console.log(`💰 ACCOUNTING: Generando reporte para ${company.name}...`);

    // --- 1. PREPARAR DATOS DEL ESTADO DE RESULTADOS (P&L) ---
    const revenue = opsData.revenue || 0;
    const cogs = opsData.cogs || 0;
    const grossProfit = revenue - cogs;

    const expenses = {
        marketing: opsData.marketing || 0,
        logistics: opsData.logistics || 0, // Fletes pagados (si no se capitalizan, pero en v2 simplificado los restamos de cash)
        obsolescence: opsData.obsolescence || 0,
        storage: 0, // Pendiente para v2.2
        rnd: 0,     // Pendiente para v2.3
        financial: 0
    };

    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const operatingProfit = grossProfit - totalExpenses;
    
    // Impuestos (Simplificado: 0% por ahora o 30% si quisiéramos)
    const taxes = 0; 
    const netIncome = operatingProfit - taxes;

    // --- 2. PREPARAR DATOS DEL BALANCE GENERAL (BS) ---
    const cash = parseFloat(company.cash.toString());
    const inventoryValue = calculateTotalInventoryValue(company);
    const fixedAssets = 0; // Maquinaria (Valor fijo o depreciado en futuro)
    const totalAssets = cash + inventoryValue + fixedAssets;

    // Pasivos (Deuda)
    const shortTermDebt = 0; // Pendiente préstamos
    const totalLiabilities = shortTermDebt;

    // Patrimonio (Equity)
    // Capital Social Inicial (Aprox $500k) + Utilidades Retenidas
    // Ecuación Contable: Activo = Pasivo + Patrimonio
    // Patrimonio = Activo - Pasivo
    const totalEquity = totalAssets - totalLiabilities;
    
    // Estimación de Utilidades Retenidas (Equity - Capital Inicial)
    // Asumimos Capital Base $500,000 para cuadrar, o calculamos acumulado
    const capital = 500000; 
    const retainedEarnings = totalEquity - capital;

    // --- 3. CREAR DOCUMENTO ---
    const statement = new FinancialStatement({
        companyId: company._id,
        round: round,
        incomeStatement: {
            revenue,
            cogs,
            grossProfit,
            expenses,
            operatingProfit,
            netIncome
        },
        balanceSheet: {
            assets: {
                cash,
                inventoryValue,
                fixedAssets,
                totalAssets
            },
            liabilities: {
                shortTermDebt,
                totalLiabilities
            },
            equity: {
                capital,
                retainedEarnings,
                totalEquity
            }
        }
    });

    await statement.save({ session });
    
    console.log(`   📄 Reporte generado: Ventas $${revenue.toFixed(2)} | Utilidad Neta $${netIncome.toFixed(2)} | Activos $${totalAssets.toFixed(2)}`);
    
    return statement;
};