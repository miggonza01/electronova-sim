// ============================================
// FILE: server/src/controllers/financialController.js
// VERSION: v2.1.0-alpha.1
// PURPOSE: API para consultar reportes contables
// ============================================

const FinancialStatement = require('../models/FinancialStatement');
const Company = require('../models/Company');

// @desc    Obtener todos los reportes financieros de mi empresa
// @route   GET /api/financials
// @access  Private (Student)
exports.getMyFinancials = async (req, res) => {
    try {
        // 1. Identificar Empresa
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        // 2. Buscar Reportes (Ordenados por ronda)
        const reports = await FinancialStatement.find({ companyId: company._id })
            .sort({ round: 1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });

    } catch (error) {
        console.error('Error fetching financials:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Obtener reporte de una ronda específica
// @route   GET /api/financials/:round
// @access  Private
exports.getFinancialsByRound = async (req, res) => {
    try {
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const round = parseInt(req.params.round);

        const report = await FinancialStatement.findOne({ 
            companyId: company._id, 
            round: round 
        });

        if (!report) {
            return res.status(404).json({ message: `No hay reporte para la ronda ${round}` });
        }

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};