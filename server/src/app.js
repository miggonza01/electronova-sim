require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Middleware imports
const { helmet, compression, rateLimiters, sanitizeInput, validateRequest, sessionSecurity } = require('./middleware/security');
const { requestLogger, errorLogger, healthLogger } = require('./middleware/logging');
const { metricsMiddleware } = require('./middleware/monitoring');

// Route imports
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const adminRoutes = require('./routes/adminRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const financialRoutes = require('./routes/financialRoutes');
const productRoutes = require('./routes/productRoutes');
const toolsRoutes = require('./routes/toolsRoutes');
const monitoringRoutes = require('./routes/monitoring');

// Service imports
const randomEventService = require('./services/randomEventService');
const productionConfig = require('./config/production');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? productionConfig.cors.origin : "*",
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.set('io', io);

// Global variables for monitoring
let activeConnections = 0;
const trackConnections = require('./middleware/monitoring');

// Security middleware
app.use(helmet);
app.use(compression);
app.use(cors(process.env.NODE_ENV === 'production' ? productionConfig.cors : { origin: "*" }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply security middleware
app.use(sanitizeInput);
app.use(validateRequest);
app.use(sessionSecurity);

// Rate limiting
app.use('/api/', rateLimiters.general);
app.use('/api/auth/', rateLimiters.auth);
app.use('/api/game/', rateLimiters.game);

// Monitoring middleware
app.use(metricsMiddleware);
app.use(requestLogger);

// Health check endpoint (before other routes for fast access)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.4.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api', monitoringRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/dist'));
  
  // Catch-all handler for frontend routing
  app.get('*', (req, res) => {
    res.sendFile(require('path').join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Don't expose stack trace in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Database connection
const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI || productionConfig.database.uri;
mongoose.connect(dbUri, productionConfig.database.options)
  .then(async () => {
    healthLogger.logDatabaseConnection(true, {
      uri: dbUri,
      options: productionConfig.database.options
    });
    
    console.log(`✅ MONGODB CONECTADO: ${dbUri.split('/').pop().split('?')[0]}`);
    
    // Initialize random event service
    try {
      await randomEventService.initializeEvents();
      console.log('🎲 Eventos aleatorios inicializados');
    } catch (error) {
      console.error('❌ Error inicializando eventos aleatorios:', error);
    }
    
    // Start server
    const PORT = process.env.PORT || productionConfig.port;
    server.listen(PORT, () => {
      healthLogger.logServerStart(PORT, process.env.NODE_ENV);
      console.log(`🚀 ElectroNova Server v2.4.0 running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
    });
  })
  .catch((error) => {
    healthLogger.logDatabaseConnection(false, { error: error.message });
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Database connection event handlers
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  healthLogger.logDatabaseConnection(false, { error: error.message });
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
  healthLogger.logDatabaseConnection(false, { event: 'disconnected' });
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  healthLogger.logDatabaseConnection(true, { event: 'reconnected' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  activeConnections++;
  trackConnections.trackWebSocketConnection('connect');
  
  console.log(`🔗 Client connected: ${socket.id}. Total connections: ${activeConnections}`);
  
  socket.on('disconnect', () => {
    activeConnections--;
    trackConnections.trackWebSocketConnection('disconnect');
    console.log(`🔌 Client disconnected: ${socket.id}. Total connections: ${activeConnections}`);
  });
  
  // Join game room
  socket.on('join-game', (gameCode) => {
    socket.join(gameCode);
    console.log(`📱 Client ${socket.id} joined game: ${gameCode}`);
  });
  
  // Leave game room
  socket.on('leave-game', (gameCode) => {
    socket.leave(gameCode);
    console.log(`📱 Client ${socket.id} left game: ${gameCode}`);
  });
});

// Broadcast function for game events
global.broadcastToGame = (gameCode, event, data) => {
  io.to(gameCode).emit(event, data);
  trackConnections.trackGameOperation(event, gameCode);
};

// Graceful shutdown
process.on('SIGTERM', () => {
  healthLogger.logGracefulShutdown('SIGTERM received');
  
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('🔌 HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('🗄️ Database connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('⏰ Force shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', () => {
  healthLogger.logGracefulShutdown('SIGINT received');
  
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('🔌 HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('🗄️ Database connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('⏰ Force shutdown after timeout');
    process.exit(1);
  }, 30000);
});

// Unhandled exception handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  healthLogger.logGracefulShutdown('uncaughtException');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  healthLogger.logGracefulShutdown('unhandledRejection');
  process.exit(1);
});

// Export app and io for testing
module.exports = { app, server, io };