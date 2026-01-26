// ============================================
// FILE: server/src/controllers/authController.js
// VERSION: v2.3.1-fix
// PURPOSE: Autenticación Robusta (Registro Multi-Sala)
// ============================================

const User = require('../models/User');
const Company = require('../models/Company');
const Game = require('../models/Game'); // <--- CRÍTICO: Asegurar esta importación
const jwt = require('jsonwebtoken');

// Helper para generar el token
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET_V2 || process.env.JWT_SECRET;
    return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc    Registrar estudiante y unirse a una sala
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        console.log("📝 Intento de registro:", req.body.email);
        console.log("📝 Request body completo:", JSON.stringify(req.body));
        
        const { name, email, password, companyName, gameCode } = req.body;
        
        console.log("🔍 Variables extraídas:");
        console.log("  name:", name);
        console.log("  email:", email);
        console.log("  companyName:", companyName);
        console.log("  gameCode:", gameCode);
        console.log("  gameCode type:", typeof gameCode);
        console.log("  gameCode length:", gameCode ? gameCode.length : 'undefined');

        // 1. Validar Código de Sala
        if (!gameCode) {
            console.log("❌ gameCode es undefined o null");
            return res.status(400).json({ message: 'El Código de Sala es obligatorio.' });
        }

        console.log("🔍 Buscando juego con código:", JSON.stringify(gameCode));
        console.log("🔍 Código uppercase:", gameCode.toUpperCase());
        
        // Buscar el juego (Case insensitive)
        const game = await Game.findOne({ code: gameCode.toUpperCase() });
        
        console.log("🔍 Resultado búsqueda:", game ? 'ENCONTRADO' : 'NO ENCONTRADO');
        
        // If the room (game) does not exist, we'll allow creating it later after user creation
        // This enables registration even if DEMO-2025 does not yet exist in production
        let isNewGame = false;
        if (!game) {
            console.log("❌ Sala no encontrada en BD. Se creará una sala temporal con código:", gameCode.toUpperCase());
            isNewGame = true;
        }
        // Ensure 'game' variable is defined for downstream usage
        if (isNewGame) {
            // Create a new temporary game with the code provided
            const newGameCode = gameCode.toUpperCase();
            const newGame = await Game.create({
                name: `Sala ${newGameCode}`,
                code: newGameCode,
                adminId: null,
                status: 'WAITING',
                currentRound: 1,
                config: {
                    maxRounds: 8,
                    initialCash: 500000,
                    totalProductionCapacity: 6000,
                    marketResearchRound: 1
                }
            });
            game = newGame;
            console.log("✅ Sala creada automáticamente: ", newGameCode);
        }

        if (game && game.status === 'FINISHED') {
            return res.status(400).json({ message: 'Esta sala ya ha finalizado.' });
        }

        // 2. Gestionar Usuario (Crear o Reutilizar)
        let user = await User.findOne({ email });
        
        if (user) {
            console.log("👤 Usuario existente detectado.");
            // Si el usuario existe, verificamos contraseña
            if (!(await user.matchPassword(password))) {
                return res.status(401).json({ message: 'El usuario ya existe. Contraseña incorrecta para unirse.' });
            }
            
            // Verificar si ya está en ESTA sala
            const existingCompany = await Company.findOne({ user: user._id, gameId: game._id });
            if (existingCompany) {
                return res.status(400).json({ message: 'Ya estás inscrito en esta sala. Inicia sesión.' });
            }

            // Actualizar juego actual del usuario
            user.currentGame = game._id;
            await user.save();
        } else {
            console.log("✨ Creando nuevo usuario.");
            // Crear nuevo usuario
            user = await User.create({
                name,
                email,
                password,
                role: 'student',
                currentGame: game._id
            });
        }

        // 3. Crear Empresa en la Sala
        // Si la sala no existía, crearla ahora con el admin recién creado
        if (typeof isNewGame !== 'undefined' && isNewGame) {
            console.log("🏭 Sala nueva detectada. Creando la sala DEMO-NEW (asociada al admin)");
            const newGameCode = gameCode.toUpperCase();
            const newGame = await Game.create({
                name: `Sala ${newGameCode}`,
                code: newGameCode,
                adminId: user._id,
                status: 'WAITING',
                currentRound: 1,
                config: {
                    maxRounds: 8,
                    initialCash: 500000,
                    totalProductionCapacity: 6000,
                    marketResearchRound: 1
                }
            });
            game = newGame;
            console.log("✅ Sala creada:", game.code);
        }
        console.log("🏭 Creando empresa en sala:", game.code);
        const company = await Company.create({
            user: user._id,
            gameId: game._id,
            name: companyName || `${name}'s Corp`,
            cash: game.config.initialCash,
            currentRound: game.currentRound || 1, // Asegurar que empiece en la ronda correcta
            techLevel: 1,
            ethicsIndex: 100,
            productionQuota: game.config.totalProductionCapacity, // Se recalculará al iniciar ronda
            
            // Inicializar arrays vacíos para evitar errores en frontend
            rawMaterials: [],
            factoryStock: [],
            inventory: [],
            inTransit: { materials: [], products: [] }
        });

        // 4. Respuesta Exitosa
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
        console.error('❌ Error CRÍTICO en registro:', error);
        res.status(500).json({ message: 'Error del servidor al registrar: ' + error.message });
    }
};

// @desc    Login
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Buscar la empresa del juego actual (si tiene uno seleccionado)
            // Si no tiene currentGame, buscamos la última creada
            let company = null;
            if (user.currentGame) {
                company = await Company.findOne({ user: user._id, gameId: user.currentGame });
            }
            
            if (!company) {
                // Fallback: Buscar cualquier empresa
                company = await Company.findOne({ user: user._id }).sort({ createdAt: -1 });
            }

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
        
        // Buscar empresa basada en el juego actual del usuario
        let company = null;
        if (user.currentGame) {
            company = await Company.findOne({ user: req.user.id, gameId: user.currentGame });
        }

        // Si no se encuentra (ej: borraron la sala), buscar fallback
        if (!company) {
            company = await Company.findOne({ user: req.user.id }).sort({ createdAt: -1 });
        }

        const game = company ? await Game.findById(company.gameId) : null;
        
        res.json({ user, company, game });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Obtener salas del usuario
// @route   GET /api/auth/rooms
exports.getMyRooms = async (req, res) => {
    try {
        const companies = await Company.find({ user: req.user.id })
            .populate('gameId', 'name code currentRound status roundEndsAt');

        res.json({
            success: true,
            count: companies.length,
            rooms: companies.map(c => ({
                companyId: c._id,
                companyName: c.name,
                game: c.gameId,
                cash: c.cash,
                isCurrent: req.user.currentGame && c.gameId && c.gameId._id.toString() === req.user.currentGame.toString()
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo salas' });
    }
};

// @desc    Cambiar sala activa
// @route   POST /api/auth/switch-room
exports.switchRoom = async (req, res) => {
    try {
        const { gameId } = req.body;
        const exists = await Company.findOne({ user: req.user.id, gameId });
        if (!exists) return res.status(403).json({ message: 'No perteneces a esta sala' });

        await User.findByIdAndUpdate(req.user.id, { currentGame: gameId });
        res.json({ success: true, message: 'Sala cambiada' });
    } catch (error) {
        res.status(500).json({ message: 'Error cambiando sala' });
    }
};

// @desc    Unirse a una sala existente (Usuario ya autenticado)
// @route   POST /api/auth/join-game
exports.joinGame = async (req, res) => {
    try {
        const { gameCode } = req.body;
        const userId = req.user.id;

        // 1. Validar Código
        if (!gameCode) return res.status(400).json({ message: 'Código requerido' });
        
        const game = await Game.findOne({ code: gameCode.toUpperCase() });
        if (!game) return res.status(404).json({ message: 'Sala no encontrada' });
        if (game.status === 'FINISHED') return res.status(400).json({ message: 'Sala finalizada' });

        // 2. Verificar si ya pertenece a la sala
        const existingCompany = await Company.findOne({ user: userId, gameId: game._id });
        if (existingCompany) {
            // Si ya existe, solo cambiamos el foco a esa sala
            await User.findByIdAndUpdate(userId, { currentGame: game._id });
            return res.json({ success: true, message: 'Ya estabas en esta sala. Reingresando...' });
        }

        // 3. Crear Nueva Empresa para esta Sala
        const user = await User.findById(userId);
        const company = await Company.create({
            user: userId,
            gameId: game._id,
            name: `${user.name}'s Corp (${game.code})`, // Nombre por defecto único
            cash: game.config.initialCash,
            currentRound: game.currentRound || 1,
            techLevel: 1, 
            ethicsIndex: 100,
            productionQuota: game.config.totalProductionCapacity,
            // Inicializar arrays vacíos
            rawMaterials: [], factoryStock: [], inventory: [], inTransit: { materials: [], products: [] }
        });

        // 4. Actualizar juego actual del usuario
        user.currentGame = game._id;
        await user.save();

        res.json({ success: true, message: 'Te has unido a la sala exitosamente' });

    } catch (error) {
        console.error("❌ Error joining game:", error);
        // Devolvemos el error específico para verlo en el frontend
        res.status(500).json({ message: 'Error interno: ' + error.message });
    }
};
