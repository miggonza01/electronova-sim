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
// Definimos los orígenes permitidos en un array para mantener la configuración centralizada
// Esto permite que la aplicación funcione tanto en desarrollo como en producción
const allowedOrigins = [
  "http://localhost:5173", // Para desarrollo local (frontend de Vite en puerto 5173)
  "http://localhost:4173", // Vite Preview
  "https://electronova-sim.vercel.app" // URL exacta del frontend desplegado en Vercel (producción)
  // NOTA: Para agregar más orígenes en el futuro, añádelos a este array
];

// Configuración de CORS para Express con función de validación dinámica
// En lugar de un string fijo, usamos una función que valida contra la lista de orígenes permitidos
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como herramientas de testing: Postman, curl, etc.)
    // O si el origen está incluido en la lista de orígenes permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      // Primero parámetro null: sin error, segundo parámetro true: origen permitido
      callback(null, true);
    } else {
      console.log("Bloqueado por CORS:", origin); // Log para depurar en Render si falla
      // Si el origen no está en la lista, rechazar la petición con error
      callback(new Error('Origen no permitido por la política CORS'));
    }
  },
  credentials: true // Permite enviar cookies y headers de autenticación si son necesarios
}));

// --- CONFIGURACIÓN DE SOCKET.IO CON CORS ESPECÍFICO ---
// Inicializar Socket.IO sobre el servidor HTTP con configuración de CORS
// IMPORTANTE: Socket.IO necesita su propia configuración de CORS separada de Express
// Usamos el mismo array 'allowedOrigins' para mantener consistencia entre HTTP y WebSockets
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Mismos orígenes permitidos que para Express - ¡DEBE COINCIDIR!
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
    console.log(`>>> CORS configurado para: ${allowedOrigins.join(', ')}`);
  });
});

// NOTAS IMPORTANTES SOBRE LA CONFIGURACIÓN ACTUALIZADA:
// 1. ORÍGENES MÚLTIPLES: Ahora soporta tanto desarrollo (localhost) como producción (Vercel)
// 2. VALIDACIÓN DINÁMICA: La función 'origin' en CORS permite validar dinámicamente cada petición
// 3. CONSISTENCIA: La misma lista 'allowedOrigins' se usa para Express y Socket.IO
// 4. SEGURIDAD MEJORADA: Solo los orígenes explícitamente listados son permitidos
// 5. FLEXIBILIDAD: Para añadir nuevos orígenes (ej: dominio personalizado), agregar al array
// 6. HERRAMIENTAS DE DESARROLLO: Se permiten peticiones sin origen (null) para testing con Postman/curl
// 7. CREDENCIALES: 'credentials: true' permite cookies de sesión/autorización si la autenticación lo requiere