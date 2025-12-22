// server/src/controllers/authController.js
const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');

// Función auxiliar para generar el Token (Brazalete)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Registrar usuario y crear su empresa
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Verificar si ya existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, error: 'El email ya está registrado' });
    }

    // 2. Crear el Usuario
    user = await User.create({
      name,
      email,
      password,
      role: 'student' // Por defecto todos son estudiantes
    });

    // 3. Crear AUTOMÁTICAMENTE la Empresa del estudiante
    // Esto garantiza que nadie entre al juego "sin empresa"
    const company = await Company.create({
      user: user._id,
      name: `Empresa de ${user.name}`, // Nombre temporal
      financials: { cash: 500000.00 }
    });

    // 4. Enviar respuesta con Token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      companyId: company._id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error en el servidor al registrar' });
  }
};

// @desc    Iniciar Sesión
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validar que enviaron datos
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Por favor ingrese email y contraseña' });
    }

    // 2. Buscar usuario (incluyendo la contraseña para comparar)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // 3. Verificar contraseña
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // 4. Enviar Token
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error al iniciar sesión' });
  }
};