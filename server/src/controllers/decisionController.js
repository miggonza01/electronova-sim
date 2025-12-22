// server/src/controllers/decisionController.js
const Decision = require('../models/Decision');
const Company = require('../models/Company');

// @desc    Enviar decisiones para la ronda actual
// @route   POST /api/decisions
exports.submitDecision = async (req, res) => {
  try {
    // 1. Identificar al usuario y su empresa
    // (El usuario viene del Token JWT que configuramos antes)
    const userId = req.user.id;
    const company = await Company.findOne({ user: userId });

    if (!company) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    const { price, marketing, production, logistics } = req.body;
    const currentRound = company.currentRound;

    // 2. Validaciones Básicas
    if (price <= 0) {
      return res.status(400).json({ success: false, error: 'El precio debe ser mayor a 0' });
    }
    if (marketing < 0) {
      return res.status(400).json({ success: false, error: 'El marketing no puede ser negativo' });
    }

    // 3. Guardar o Actualizar la Decisión
    // Usamos findOneAndUpdate con "upsert: true" (Si existe actualiza, si no crea)
    const decision = await Decision.findOneAndUpdate(
      { companyId: company._id, round: currentRound },
      {
        price,
        marketing,
        production,
        logistics,
        submittedAt: Date.now()
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Decisiones guardadas para la Ronda ${currentRound}`,
      data: decision
    });

  } catch (error) {
    console.error(error);
    // Manejo de error de duplicados (aunque upsert lo evita, es buena práctica)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Ya existe una decisión para esta ronda' });
    }
    res.status(500).json({ success: false, error: 'Error al procesar la decisión' });
  }
};

// @desc    Ver decisiones de la ronda actual
// @route   GET /api/decisions/current
exports.getCurrentDecision = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

    const decision = await Decision.findOne({ 
      companyId: company._id, 
      round: company.currentRound 
    });

    res.status(200).json({
      success: true,
      data: decision || null // Devuelve null si aún no ha decidido nada
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
};