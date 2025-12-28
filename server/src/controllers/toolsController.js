// ============================================
// FILE: server/src/controllers/toolsController.js
// VERSION: v2.3.0
// PURPOSE: Gestión de herramientas pagas (Estudios, Consultorías)
// ============================================

const Company = require('../models/Company');
const Game = require('../models/Game');
const Market = require('../models/Market');

// @desc    Comprar y ver Estudio de Mercado
// @route   POST /api/tools/market-research
// @access  Private (Student)
exports.buyMarketResearch = async (req, res) => {
    try {
        // 1. Identificar Empresa y Juego
        const company = await Company.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

        const game = await Game.findById(company.gameId);
        if (!game) return res.status(404).json({ message: 'Partida no encontrada' });

        // 2. Validar Reglas (Costo y Ronda)
        const COST = game.config.marketResearchCost || 15000;
        
        // Verificar si está habilitado en esta ronda
        if (game.currentRound < game.config.marketResearchRound) {
            return res.status(403).json({ message: `El estudio estará disponible en la ronda ${game.config.marketResearchRound}` });
        }

        // Verificar Fondos
        if (parseFloat(company.cash) < COST) {
            return res.status(400).json({ message: `Fondos insuficientes. Costo: $${COST}` });
        }

        // 3. Ejecutar Transacción (Cobrar)
        // Nota: En un sistema estricto, guardaríamos un registro "Transaction". 
        // Aquí descontamos directo y guardamos flag en la empresa si queremos persistencia visual,
        // pero como es info inmediata, solo cobramos y devolvemos data.
        
        company.cash = parseFloat(company.cash) - COST;
        await company.save();

        // 4. Obtener Datos "Secretos" del Mercado
        // Normalmente enviamos solo el nombre. Ahora enviamos TODO (sensibilidad, params).
        const markets = await Market.find({});

        res.json({
            success: true,
            message: `Estudio adquirido. Se descontaron $${COST} de la caja.`,
            cost: COST,
            remainingCash: company.cash,
            data: markets // Aquí van los datos sensibles (priceSensitivity, params, etc.)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al procesar la compra del estudio' });
    }
};