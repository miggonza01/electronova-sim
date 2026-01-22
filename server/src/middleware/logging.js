# ============================================
# FILE: server/src/middleware/logging.js
# VERSION: v2.4.0-production
# PURPOSE: Logging middleware for ElectroNova production
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: productionFormat,
  defaultMeta: { service: 'electronova-server' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Access logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Store original res.end
  const originalEnd = res.end;
  
  // Override res.end to log response
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Security event logging
const securityLogger = {
  logAuthAttempt: (email, ip, success, reason = null) => {
    logger.info('Authentication attempt', {
      type: 'auth',
      email,
      ip,
      success,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuspiciousActivity: (ip, activity, details = {}) => {
    logger.warn('Suspicious activity detected', {
      type: 'security',
      ip,
      activity,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logRateLimitExceeded: (ip, endpoint) => {
    logger.warn('Rate limit exceeded', {
      type: 'rate_limit',
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    });
  },
  
  logDatabaseError: (operation, error) => {
    logger.error('Database operation failed', {
      type: 'database',
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  },
  
  logGameEvent: (gameId, event, details = {}) => {
    logger.info('Game event', {
      type: 'game',
      gameId,
      event,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logRandomEvent: (gameId, eventType, details = {}) => {
    logger.info('Random event triggered', {
      type: 'random_event',
      gameId,
      eventType,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logAdminAction: (userId, action, details = {}) => {
    logger.info('Admin action', {
      type: 'admin',
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
const performanceLogger = {
  logSlowQuery: (query, duration) => {
    logger.warn('Slow database query detected', {
      type: 'performance',
      category: 'slow_query',
      query: query.toString().substring(0, 200),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },
  
  logHighMemoryUsage: (usage) => {
    logger.warn('High memory usage detected', {
      type: 'performance',
      category: 'memory',
      usage: `${Math.round(usage * 100)}%`,
      timestamp: new Date().toISOString()
    });
  },
  
  logHighCPUUsage: (usage) => {
    logger.warn('High CPU usage detected', {
      type: 'performance',
      category: 'cpu',
      usage: `${Math.round(usage * 100)}%`,
      timestamp: new Date().toISOString()
    });
  }
};

// System health logging
const healthLogger = {
  logServerStart: (port, env) => {
    logger.info('Server started', {
      type: 'system',
      event: 'server_start',
      port,
      env,
      timestamp: new Date().toISOString()
    });
  },
  
  logDatabaseConnection: (success, details = {}) => {
    logger.info('Database connection attempt', {
      type: 'system',
      event: 'db_connection',
      success,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logGracefulShutdown: (reason) => {
    logger.info('Graceful shutdown initiated', {
      type: 'system',
      event: 'shutdown',
      reason,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  securityLogger,
  performanceLogger,
  healthLogger
};