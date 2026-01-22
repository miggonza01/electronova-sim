# ============================================
# FILE: server/src/middleware/security.js
# VERSION: v2.4.0-production
# PURPOSE: Security middleware for ElectroNova production
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

// Security headers configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss://electronova.yourdomain.com", "https://electronova.yourdomain.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Rate limiters for different endpoints
const rateLimiters = {
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later.'
  ),
  
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth requests per windowMs
    'Too many authentication attempts, please try again later.'
  ),
  
  api: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    30, // limit each IP to 30 API requests per windowMs
    'Too many API requests from this IP, please try again later.'
  ),
  
  game: createRateLimiter(
    1 * 60 * 1000, // 1 minute
    20, // limit each IP to 20 game requests per windowMs
    'Too many game actions, please slow down.'
  )
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  // Sanitize against NoSQL injection
  mongoSanitize()(req, res, () => {
    // Sanitize against XSS
    xss()(req, res, () => {
      // Sanitize against HTTP parameter pollution
      hpp()(req, res, next);
    });
  });
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type. Only JSON and form data are allowed.'
      });
    }
  }
  
  // Check request size
  const contentLength = req.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({
      success: false,
      error: 'Request entity too large.'
    });
  }
  
  next();
};

// Session security middleware
const sessionSecurity = (req, res, next) => {
  // Add security headers for session
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove sensitive information from responses
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object') {
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      const sanitizedData = JSON.parse(JSON.stringify(data));
      
      const removeSensitiveFields = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;
        
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            delete obj[key];
          } else if (typeof obj[key] === 'object') {
            removeSensitiveFields(obj[key]);
          }
        });
      };
      
      removeSensitiveFields(sanitizedData);
      return originalJson.call(this, sanitizedData);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  helmet: helmet(helmetConfig),
  compression: compression(),
  rateLimiters,
  sanitizeInput,
  validateRequest,
  sessionSecurity
};