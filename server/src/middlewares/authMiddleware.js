// server/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // 1. Verificar si el header tiene "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraer el token (quitar la palabra "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Decodificar
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar al usuario en la DB y agregarlo a la request (req.user)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Dejar pasar al siguiente paso
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, error: 'Token no válido, autorización denegada' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'No hay token, autorización denegada' });
  }
};