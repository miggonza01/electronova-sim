# ============================================
# FILE: server/src/config/production.js
# VERSION: v2.4.0-production
# PURPOSE: Production configuration for ElectroNova
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

const path = require('path');

const productionConfig = {
  // Environment
  env: 'production',
  debug: false,
  
  // Server
  port: process.env.PORT || 5000,
  host: '0.0.0.0',
  
  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/electronova-production',
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
      serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 30000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'production-jwt-secret',
    expiresIn: '24h',
    issuer: 'electronova',
    audience: 'electronova-users'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://electronova.yourdomain.com',
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'production-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE_PATH || './logs/app.log',
    maxSize: '10m',
    maxFiles: '14d'
  },
  
  // File Upload Configuration
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    path: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv']
  },
  
  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  
  // Game Configuration
  game: {
    randomEvents: {
      enabled: process.env.RANDOM_EVENTS_ENABLED === 'true',
      maxPerRound: parseInt(process.env.MAX_RANDOM_EVENTS_PER_ROUND) || 1,
      defaultProbability: parseFloat(process.env.DEFAULT_RANDOM_EVENT_PROBABILITY) || 0.3
    },
    capacity: {
      default: parseInt(process.env.DEFAULT_CAPACITY_LIMIT) || 50000,
      min: parseInt(process.env.MIN_CAPACITY_LIMIT) || 1000,
      max: parseInt(process.env.MAX_COMPANIES_PER_GAME) || 10
    }
  },
  
  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090
  },
  
  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          connectSrc: ["'self'", "wss://electronova.yourdomain.com", "https://electronova.yourdomain.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      }
    },
    compression: {
      level: 6,
      threshold: 1024
    }
  },
  
  // Cache Configuration
  cache: {
    ttl: 300, // 5 minutes
    maxKeys: 1000
  },
  
  // Production-specific settings
  production: {
    staticFilesPath: path.join(__dirname, '../../client/dist'),
    serveStatic: true,
    trustProxy: true
  }
};

module.exports = productionConfig;