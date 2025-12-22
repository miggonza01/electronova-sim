// server/src/controllers/companyController.js
const Company = require('../models/Company');

// @desc    Obtener datos financieros e inventario de mi empresa
// @route   GET /api/company/my-company
exports.getMyCompany = async (req, res) => {
  try {
    // Buscamos la empresa asociada al usuario logueado (req.user.id)
    const company = await Company.findOne({ user: req.user.id });

    if (!company) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};