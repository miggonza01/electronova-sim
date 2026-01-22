# ============================================
# FILE: server/src/routes/monitoring.js
# VERSION: v2.4.0-production
# PURPOSE: Monitoring and health check routes for ElectroNova
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

const express = require('express');
const router = express.Router();
const { metricsEndpoint, updateHealthMetric, register } = require('../middleware/monitoring');
const { healthLogger } = require('../middleware/logging');
const Game = require('../models/Game');
const mongoose = require('mongoose');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.4.0',
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    // Database health check
    try {
      const dbState = mongoose.connection.readyState;
      health.services.database = {
        status: dbState === 1 ? 'healthy' : 'unhealthy',
        state: mongoose.connection.states[dbState],
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
      updateHealthMetric('database', dbState === 1);
    } catch (error) {
      health.services.database = {
        status: 'unhealthy',
        error: error.message
      };
      updateHealthMetric('database', false);
      health.status = 'degraded';
    }

    // Memory health check
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
    health.services.memory = {
      status: heapUsedPercent > 0.9 ? 'critical' : heapUsedPercent > 0.8 ? 'warning' : 'healthy',
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heap_total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    };

    // Game statistics
    try {
      const activeGames = await Game.countDocuments({ isActive: true });
      const totalGames = await Game.countDocuments();
      
      health.services.game = {
        status: 'healthy',
        active_games: activeGames,
        total_games: totalGames
      };
    } catch (error) {
      health.services.game = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Filesystem health check
    try {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      if (fs.existsSync(uploadsDir)) {
        const stats = fs.statSync(uploadsDir);
        health.services.filesystem = {
          status: 'healthy',
          uploads_accessible: true
        };
      } else {
        health.services.filesystem = {
          status: 'warning',
          uploads_accessible: false
        };
      }
      updateHealthMetric('filesystem', true);
    } catch (error) {
      health.services.filesystem = {
        status: 'unhealthy',
        error: error.message
      };
      updateHealthMetric('filesystem', false);
    }

    // Determine overall health
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.includes('unhealthy') || serviceStatuses.includes('critical')) {
      health.status = 'unhealthy';
      return res.status(503).json(health);
    } else if (serviceStatuses.includes('warning')) {
      health.status = 'warning';
      return res.status(200).json(health);
    }

    return res.status(200).json(health);

  } catch (error) {
    healthLogger.logDatabaseConnection('health_check', false, { error: error.message });
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint for Prometheus
router.get('/metrics', metricsEndpoint);

// Detailed system information
router.get('/system', async (req, res) => {
  try {
    const system = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        arch: process.arch
      },
      database: {
        ready_state: mongoose.connection.readyState,
        ready_state_name: mongoose.connection.states[mongoose.connection.readyState],
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      environment: {
        node_env: process.env.NODE_ENV,
        port: process.env.PORT,
        log_level: process.env.LOG_LEVEL
      }
    };

    // Add database metrics if available
    try {
      const dbStats = await mongoose.connection.db.stats();
      system.database.stats = {
        collections: dbStats.collections,
        objects: dbStats.objects,
        data_size: `${Math.round(dbStats.dataSize / 1024 / 1024)}MB`,
        index_size: `${Math.round(dbStats.indexSize / 1024 / 1024)}MB`,
        storage_size: `${Math.round(dbStats.storageSize / 1024 / 1024)}MB`
      };
    } catch (error) {
      system.database.stats = { error: error.message };
    }

    // Add game statistics
    try {
      const gameStats = await Game.aggregate([
        {
          $group: {
            _id: null,
            total_games: { $sum: 1 },
            active_games: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            completed_games: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            total_players: { $sum: { $size: '$players' } }
          }
        }
      ]);

      if (gameStats.length > 0) {
        system.game_stats = gameStats[0];
      }
    } catch (error) {
      system.game_stats = { error: error.message };
    }

    return res.json(system);

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON();
    
    const performance = {
      timestamp: new Date().toISOString(),
      metrics: {
        http_requests_total: metrics.find(m => m.name === 'http_requests_total'),
        http_request_duration_seconds: metrics.find(m => m.name === 'http_request_duration_seconds'),
        memory_usage_bytes: metrics.find(m => m.name === 'memory_usage_bytes'),
        cpu_usage_percent: metrics.find(m => m.name === 'cpu_usage_percent'),
        game_operations_total: metrics.find(m => m.name === 'game_operations_total'),
        random_events_total: metrics.find(m => m.name === 'random_events_total'),
        websocket_connections_active: metrics.find(m => m.name === 'websocket_connections_active'),
        database_connections_active: metrics.find(m => m.name === 'database_connections_active')
      }
    };

    return res.json(performance);

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Alert status
router.get('/alerts', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
    
    const alerts = [];

    // Memory alerts
    if (heapUsedPercent > 0.9) {
      alerts.push({
        type: 'critical',
        service: 'memory',
        message: `Memory usage critical: ${Math.round(heapUsedPercent * 100)}%`,
        threshold: '90%',
        current: `${Math.round(heapUsedPercent * 100)}%`
      });
    } else if (heapUsedPercent > 0.8) {
      alerts.push({
        type: 'warning',
        service: 'memory',
        message: `Memory usage high: ${Math.round(heapUsedPercent * 100)}%`,
        threshold: '80%',
        current: `${Math.round(heapUsedPercent * 100)}%`
      });
    }

    // Database alerts
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      alerts.push({
        type: 'critical',
        service: 'database',
        message: `Database connection issue: ${mongoose.connection.states[dbState]}`,
        threshold: 'Connected',
        current: mongoose.connection.states[dbState]
      });
    }

    // Uptime alerts
    if (process.uptime() < 60) {
      alerts.push({
        type: 'info',
        service: 'system',
        message: `System recently restarted: ${Math.round(process.uptime())} seconds ago`,
        threshold: 'Stable',
        current: `${Math.round(process.uptime())}s`
      });
    }

    return res.json({
      timestamp: new Date().toISOString(),
      status: alerts.length === 0 ? 'healthy' : alerts.some(a => a.type === 'critical') ? 'critical' : 'warning',
      alerts: alerts
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;