// ============================================
// FILE: server/src/controllers/authController.js
// VERSION: v2.3.0-multiplayer
// PURPOSE: Auth con soporte para códigos de sala (Game Code)
// ============================================

const User = require('../models/User');
const Company = require('../models/Company');
const Game = require('../models/Game');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET_V2 || process.env.JWT_SECRET;
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc    Registrar estudiante y unirse a una sala
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password, companyName, gameCode } = req.body;

        // 1. Validaciones
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });

        // 2. Buscar la Sala (Game)
        // Si no envía código, error (en v2 estricto). Para desarrollo, podríamos tener fallback.
        if (!gameCode) return res.status(400).json({ message: 'Se requiere un Código de Sala' });

        const game = await Game.findOne({ code: gameCode.toUpperCase() });
        if (!game) return res.status(404).json({ message: 'Código de sala inválido' });

        if (game.status === 'FINISHED') return res.status(400).json({ message: 'Esta sala ya finalizó' });

        // 3. Crear Usuario
        const user = await User.create({
            name,
            email,
            password,
            role: 'student',
            currentGame: game._id
        });

        // 4. Crear Empresa en la Sala
        // Calcular cuota inicial (Simplificado: Capacidad total / (Jugadores actuales + 1))
        // Por ahora asignamos capacidad total, el roundProcessor la ajustará al iniciar ronda.
        const company = await Company.create({
            user: user._id,
            gameId: game._id,
            name: companyName || `${name}'s Corp`,
            cash: game.config.initialCash,
            currentRound: game.currentRound,
            techLevel: 1,
            ethicsIndex: 100,
            productionQuota: game.config.totalProductionCapacity 
        });

        res.status(201).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: company._id,
            gameId: game._id,
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error del servidor al registrar' });
    }
};

// @desc    Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const company = await Company.findOne({ user: user._id });

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: company ? company._id : null,
                gameId: user.currentGame,
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

// @desc    Perfil
// @route   GET /api/auth/profile
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const company = await Company.findOne({ user: req.user.id });
        // Opcional: Traer info del juego también
        const game = company ? await Game.findById(company.gameId) : null;
        
        res.json({ user, company, game });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};