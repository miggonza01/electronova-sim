// ============================================
// FILE: server/src/controllers/authController.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Registro de usuarios y creación automática de Empresa v2
// CHANGE LOG: Adaptado para leer GameSettings y usar nuevo esquema Company
// ============================================

const User = require('../models/User');
const Company = require('../models/Company');
const GameSettings = require('../models/GameSettings');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generar JWT
const generateToken = (id) => {
    // Usa la clave secreta V2 si estamos en entorno V2
    const secret = process.env.JWT_SECRET_V2 || process.env.JWT_SECRET;
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc    Registrar nuevo usuario y su empresa
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, companyName } = req.body;

        // 1. Validar existencia de usuario
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // 2. Crear Usuario
        // Nota: En producción real, deberías hashear el password aquí si el modelo User no lo hace pre-save
        // Asumimos que tu modelo User tiene un middleware 'pre save' para bcrypt (estándar MERN)
        const user = await User.create({
            name,
            email,
            password 
        });

        // 3. Obtener Configuración Inicial del Juego
        // Buscamos la configuración activa para saber cuánto dinero dar
        let settings = await GameSettings.findOne({ isActive: true });
        
        // Fallback de seguridad si no se corrió el seeder
        if (!settings) {
            console.warn('⚠️ ALERTA: No se encontró GameSettings. Usando valores por defecto.');
            settings = { initialCompanyCash: 500000.00 };
        }

        // 4. Crear Empresa Inicial (Estructura v2)
        const company = await Company.create({
            user: user._id,
            name: companyName || `${name}'s Corp`,
            cash: settings.initialCompanyCash, // Valor desde DB Config
            techLevel: 1,
            ethicsIndex: 100,
            currentRound: 1,
            // Los arrays (inventory, rawMaterials) se inicializan vacíos por defecto en el Schema
        });

        // 5. Respuesta Exitosa
        res.status(201).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            companyId: company._id,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error del servidor al registrar usuario' });
    }
};

// @desc    Autenticar usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        // Verificar password (asumiendo método matchPassword en modelo User)
        // Si no tienes el método en el modelo, usa: await bcrypt.compare(password, user.password)
        if (user && (await user.matchPassword(password))) {
            
            // Buscar la empresa asociada para devolver su ID
            const company = await Company.findOne({ user: user._id });

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                companyId: company ? company._id : null,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/auth/profile
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const company = await Company.findOne({ user: req.user.id });
        
        res.json({
            user,
            company
        });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};