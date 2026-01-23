// ============================================
// FILE: server/src/middleware/authMiddleware.js
// PURPOSE: Proteger rutas verificando Token JWT
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token del header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            // Nota: Usamos la misma lógica de secreto que en authController
            const secret = process.env.JWT_SECRET_V2 || process.env.JWT_SECRET;
            const decoded = jwt.verify(token, secret);

            // Obtener usuario del token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Usuario no encontrado con este token' });
            }

            next();
        } catch (error) {
            console.error('Error de Auth:', error.message);
            res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

module.exports = {
  protect: exports.protect,
  authMiddleware: exports.protect
};