# ============================================
# FILE: server/ecosystem.config.js
# VERSION: v2.4.0-production
# PURPOSE: PM2 configuration for ElectroNova production
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

module.exports = {
  apps: [{
    name: 'electronova-server',
    script: './src/app.js',
    cwd: './server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Error handling
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Health checks
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,
    
    // Environment variables file
    env_file: './.env.production'
  }]
};