// server/src/app.js

// Importar dependencias y módulos necesarios
require('dotenv').config(); // Cargar variables de entorno desde el archivo .env
const express = require('express'); // Framework para construir aplicaciones web y APIs
const http = require('http'); // Módulo nativo de Node.js para crear servidores HTTP
const { Server } = require('socket.io'); // Biblioteca para WebSockets en tiempo real
const mongoose = require('mongoose'); // ODM para MongoDB
const cors = require('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const helmet = require('helmet'); // Middleware para seguridad HTTP headers

// Importar rutas de la aplicación
const companyRoutes = require('./routes/companyRoutes');
const authRoutes = require('./routes/authRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Importar gestor de sockets para manejar eventos de WebSocket
const { socketHandler } = require('./sockets/socketHandler');

// Inicializar aplicación Express
const app = express();

// --- CONFIGURACIÓN DE SOCKET.IO ---
// Crear servidor HTTP crudo pasando la app de Express
// Socket.IO requiere un servidor HTTP crudo, no la app de Express directamente
const server = http.createServer(app);

// --- CONFIGURACIÓN EXPLÍCITA DE CORS PARA PERMITIR AL FRONTEND ---
// Configuración de CORS para Express: permite solicitudes solo desde el frontend en desarrollo
// Esto es crucial para seguridad y para evitar errores de política de mismo origen
app.use(cors({
  origin: 'http://localhost:5173', // Dirección exacta del frontend (Vite en desarrollo)
  credentials: true // Permite enviar cookies y headers de autenticación si son necesarios
}));

// --- CONFIGURACIÓN DE SOCKET.IO CON CORS ESPECÍFICO ---
// Inicializar Socket.IO sobre el servidor HTTP con configuración de CORS
// IMPORTANTE: Socket.IO necesita su propia configuración de CORS separada de Express
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Mismo origen que el frontend - ¡DEBE COINCIDIR!
    methods: ["GET", "POST"] // Métodos HTTP permitidos para conexiones WebSocket
  }
});

// Inicializar la lógica de manejo de sockets (conexiones, desconexiones, eventos personalizados)
socketHandler(io);

// --- MIDDLEWARES GLOBALES DE EXPRESS ---
app.use(helmet()); // Añade headers de seguridad HTTP (protección contra vulnerabilidades comunes)
app.use(express.json()); // Parsea solicitudes con cuerpo JSON a objetos JavaScript

// NOTA: cors() ya se aplicó arriba con configuración específica
// No es necesario app.use(cors()) adicional aquí

// Middleware personalizado para inyectar el objeto 'io' en cada request
// Esto permite que los controladores de rutas (como AdminController) emitan eventos WebSocket
app.use((req, res, next) => {
  req.io = io; // Añade la instancia de Socket.IO al objeto de solicitud (req)
  next(); // Pasa al siguiente middleware o ruta
});

// --- REGISTRO DE RUTAS DE LA APLICACIÓN ---
// Todas las rutas están prefijadas con '/api' para separar API de rutas de frontend
app.use('/api/auth', authRoutes); // Rutas de autenticación (login, registro, etc.)
app.use('/api/decisions', decisionRoutes); // Rutas para decisiones de los jugadores
app.use('/api/admin', adminRoutes); // Rutas administrativas (procesar rondas, configurar juego)
app.use('/api/company', companyRoutes); // Rutas para operaciones de empresa

// Ruta raíz - Endpoint básico para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('¡Servidor ElectroNova con WebSockets Activo!');
});

// --- CONEXIÓN A BASE DE DATOS MONGODB ---
const connectDB = async () => {
  try {
    // Conectar a MongoDB Atlas usando la URI desde variables de entorno
    await mongoose.connect(process.env.MONGO_URI);
    console.log('>>> BASE DE DATOS CONECTADA: MongoDB Atlas');
  } catch (error) {
    console.error('!!! ERROR DE CONEXIÓN A BD:', error.message);
    process.exit(1); // Terminar proceso si no se puede conectar a la base de datos
  }
};

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 5000; // Usar puerto de variable de entorno o 5000 por defecto

// Conectar a la base de datos y luego iniciar el servidor
connectDB().then(() => {
  // IMPORTANTE: Usar server.listen (no app.listen) para que Socket.IO funcione correctamente
  server.listen(PORT, () => {
    console.log(`>>> SERVIDOR + SOCKETS CORRIENDO EN PUERTO: ${PORT}`);
    console.log(`>>> CORS configurado para: http://localhost:5173`);
  });
});

// NOTAS IMPORTANTES SOBRE LA CONFIGURACIÓN:
// 1. Origen específico: Al especificar 'http://localhost:5173' en lugar de '*', 
//    aumentamos la seguridad al rechazar solicitudes de otros dominios.
// 2. Coherencia: La configuración de CORS debe ser idéntica en Express y Socket.IO
//    para que ambos funcionen correctamente con el mismo frontend.
// 3. Desarrollo vs Producción: En producción, cambiar 'http://localhost:5173' 
//    por la URL real del frontend desplegado.
// 4. Credenciales: 'credentials: true' permite cookies de sesión/autorización
//    si la autenticación lo requiere.