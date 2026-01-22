# ============================================
# FILE: server/src/middleware/monitoring.js
# VERSION: v2.4.0-production
# PURPOSE: Monitoring middleware for ElectroNova production
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

const promClient = require('prom-client');
const { performanceLogger } = require('./logging');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which can be used to identify the service
register.setDefaultLabels({
  app: 'electronova-server'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const gameOperations = new promClient.Counter({
  name: 'game_operations_total',
  help: 'Total number of game operations',
  labelNames: ['operation', 'game_id']
});

const randomEvents = new promClient.Counter({
  name: 'random_events_total',
  help: 'Total number of random events triggered',
  labelNames: ['event_type', 'game_id']
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const memoryUsage = new promClient.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const cpuUsage = new promClient.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(gameOperations);
register.registerMetric(randomEvents);
register.registerMetric(databaseConnections);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);

// Metrics collection middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Record metrics when response ends
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// System metrics collection
let wsConnectionCount = 0;

const updateSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  
  // Update memory metrics
  memoryUsage.labels('rss').set(memUsage.rss);
  memoryUsage.labels('heap_total').set(memUsage.heapTotal);
  memoryUsage.labels('heap_used').set(memUsage.heapUsed);
  memoryUsage.labels('external').set(memUsage.external);
  
  // Update CPU usage (approximation)
  const cpuUsagePercent = process.cpuUsage();
  cpuUsage.set(cpuUsagePercent.user + cpuUsagePercent.system);
  
  // Log warnings if thresholds exceeded
  const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
  if (heapUsedPercent > 0.9) {
    performanceLogger.logHighMemoryUsage(heapUsedPercent);
  }
};

// Game operation tracking
const trackGameOperation = (operation, gameId) => {
  gameOperations.labels(operation, gameId).inc();
};

// Random event tracking
const trackRandomEvent = (eventType, gameId) => {
  randomEvents.labels(eventType, gameId).inc();
};

// WebSocket connection tracking
const trackWebSocketConnection = (type) => {
  if (type === 'connect') {
    wsConnectionCount++;
  } else if (type === 'disconnect') {
    wsConnectionCount = Math.max(0, wsConnectionCount - 1);
  }
  activeConnections.set(wsConnectionCount);
};

// Database connection tracking
const trackDatabaseConnection = (count) => {
  databaseConnections.set(count);
};

// Health check metrics
const healthMetrics = {
  database: 0, // 0 = unknown, 1 = healthy, -1 = unhealthy
  redis: 0,
  filesystem: 0,
  external_apis: 0
};

const updateHealthMetric = (service, status) => {
  healthMetrics[service] = status ? 1 : -1;
};

// Create health check gauges
Object.keys(healthMetrics).forEach(service => {
  const gauge = new promClient.Gauge({
    name: `health_${service}_status`,
    help: `Health status of ${service} (1 = healthy, -1 = unhealthy, 0 = unknown)`
  });
  register.registerMetric(gauge);
  
  // Update gauge periodically
  setInterval(() => {
    gauge.set(healthMetrics[service]);
  }, 5000);
});

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
};

// Performance monitoring
const performanceMonitor = {
  startOperation: (operationName) => {
    return {
      operation: operationName,
      startTime: process.hrtime.bigint(),
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - this.startTime) / 1000000; // Convert to milliseconds
        
        if (duration > 1000) { // Log operations taking more than 1 second
          performanceLogger.logSlowQuery(operationName, duration);
        }
        
        return duration;
      }
    };
  },
  
  trackDatabaseOperation: (operation, collection) => {
    const timer = new promClient.Histogram({
      name: 'database_operation_duration_seconds',
      help: 'Duration of database operations',
      labelNames: ['operation', 'collection']
    });
    
    register.registerMetric(timer);
    
    return timer.startTimer({ operation, collection });
  }
};

// Alert thresholds
const alertThresholds = {
  memoryUsage: 0.9, // 90%
  cpuUsage: 0.8,     // 80%
  responseTime: 5,   // 5 seconds
  errorRate: 0.05    // 5%
};

// Alert checking
const checkAlerts = () => {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
  
  // Memory alert
  if (heapUsedPercent > alertThresholds.memoryUsage) {
    performanceLogger.logHighMemoryUsage(heapUsedPercent);
  }
  
  // CPU alert (simplified)
  const cpuUsage = process.cpuUsage();
  const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Simplified calculation
  
  if (cpuPercent > alertThresholds.cpuUsage) {
    performanceLogger.logHighCPUUsage(cpuPercent);
  }
};

// Periodic metrics update
setInterval(() => {
  updateSystemMetrics();
  checkAlerts();
}, 30000); // Update every 30 seconds

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  trackGameOperation,
  trackRandomEvent,
  trackWebSocketConnection,
  trackDatabaseConnection,
  updateHealthMetric,
  performanceMonitor,
  alertThresholds
};