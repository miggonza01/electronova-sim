// server/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { triggerRoundProcessing, getGameConfig } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware'); // Necesitamos el protector

// --- RUTAS DE CONFIGURACIÓN ---
router.get('/config', protect, getGameConfig); // Ver configuración
// router.put('/config', protect, updateGameConfig); // Creamos esta pronto para MODIFICAR

// --- RUTA DE PROCESAMIENTO DE RONDA ---
// Protegida y debería ser solo para ADMINS
router.post('/process-round', protect, async (req, res, next) => {
  // Verificamos si el usuario logueado es ADMIN
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado. Solo administradores.' });
  }
  next(); // Si es admin, deja pasar al controlador
}, triggerRoundProcessing);

module.exports = router;