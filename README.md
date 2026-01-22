# ============================================
# FILE: README.md
# VERSION: v2.4.0-production
# PURPOSE: Complete production deployment guide for ElectroNova
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

# 🚀 ElectroNova v2.4.0 - Production Deployment Guide

## 📋 Overview

ElectroNova v2.4.0 is a comprehensive business simulation platform with production-ready infrastructure, monitoring, and security features.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                ┌─────────────┐                   │
│                │  Nginx      │                   │
│                │  (SSL/HTTPS) │                   │
│                └─────┬─────┘                   │
│                      │                            │
│                ┌─────┴─────┐                   │
│                │  Frontend    │                   │
│                │  (React)     │                   │
│                └─────┬─────┘                   │
│                      │                            │
│                ┌─────┴─────┐                   │
│                │  Backend     │                   │
│                │ (Node.js)    │                   │
│                └─────┬─────┘                   │
│                      │                            │
│    ┌─────────────────┴─────────────────┐         │
│    │     Redis & MongoDB             │         │
│    │    (Cache & Database)           │         │
│    └─────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (local development)
- Git
- Domain name with SSL certificates
- 2GB+ RAM, 2+ CPU cores

### 1. Clone Repository

```bash
git clone https://github.com/electronova/electronova-sim.git
cd electronova-sim
```

### 2. Configure Environment

```bash
# Copy production environment template
cp server/.env.production.example server/.env.production

# Edit with your values
nano server/.env.production
```

### 3. Deploy Application

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
sudo ./scripts/deploy.sh
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | Yes |
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port | 5000 |

### Domain Configuration

Update these values in `.env.production`:
- `CORS_ORIGIN=https://yourdomain.com`
- `VITE_API_URL=https://yourdomain.com`

## 🐳 Docker Services

### Services Overview

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `electronova-nginx` | nginx:alpine | 80/443 | Reverse proxy |
| `electronova-server` | electronova:latest | 5000 | Application |
| `electronova-mongodb` | mongo:7.0 | 27017 | Database |
| `electronova-redis` | redis:7-alpine | 6379 | Cache |

### Health Checks

Each service includes health checks:
- **MongoDB**: Connection test every 30s
- **Redis**: Ping test every 30s  
- **Backend**: API health check every 30s
- **Frontend**: HTTP check via wget

## 📊 Monitoring

### Metrics Available

- **Application Metrics**: `/api/metrics` (Prometheus format)
- **System Health**: `/api/health` (JSON status)
- **Performance**: CPU, Memory, Response times
- **Business**: Games, Users, Events

### Alerting

Automated alerts for:
- High memory usage (>90%)
- High CPU usage (>80%)
- Database connection failures
- Service health failures
- Error rate thresholds exceeded

## 🔒 Security Features

### Implemented Security

- **SSL/TLS**: HTTPS-only communication
- **CORS**: Strict origin validation
- **Rate Limiting**: IP-based throttling
- **Input Sanitization**: XSS/SQL injection protection
- **Security Headers**: HSTS, CSP, X-Frame-Options
- **JWT**: Secure token authentication

### Best Practices

1. **Secrets Management**
   ```bash
   # Use strong, unique secrets
   JWT_SECRET=$(openssl rand -hex 32)
   ```

2. **SSL Certificates**
   ```bash
   # Use Let's Encrypt or corporate certificates
   certbot --nginx -d yourdomain.com
   ```

3. **Network Security**
   - Firewall rules limiting access
   - VPN for admin access
   - Regular security updates

## 🚀 Deployment Commands

### Full Deployment
```bash
./scripts/deploy.sh deploy
```

### Update Deployment (Zero Downtime)
```bash
./scripts/deploy.sh update
```

### Health Check
```bash
./scripts/deploy.sh health
```

### Rollback
```bash
./scripts/deploy.sh rollback backup-name
```

## 📈 Performance Tuning

### Nginx Optimization
- Gzip compression enabled
- Static asset caching (1 year)
- Connection pooling
- Keep-alive connections

### Node.js Optimization
- PM2 cluster mode
- Memory monitoring
- Graceful shutdown handling

### Database Optimization
- Connection pooling (5-10 connections)
- Index optimization
- Query performance monitoring

## 🔍 Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check logs
   docker-compose logs electronova-server
   
   # Check health
   curl http://localhost:5000/api/health
   ```

2. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   docker-compose logs electronova-mongodb
   
   # Test connection
   mongosh mongodb://admin:password@localhost:27017/electronova-production
   ```

3. **High Memory Usage**
   ```bash
   # Monitor memory
   docker stats
   
   # Check logs
   ./scripts/deploy.sh health
   ```

### Log Analysis

```bash
# Application logs
tail -f logs/app.log

# Nginx logs
tail -f logs/nginx/access.log

# Error logs
tail -f logs/nginx/error.log
```

## 🔄 Maintenance

### Daily Tasks
```bash
# Health check
./scripts/deploy.sh health

# Log cleanup
find logs/ -name "*.log" -mtime +30 -delete

# Backup verification
ls -la /opt/backups/electronova/
```

### Weekly Tasks
```bash
# Security updates
docker-compose pull
./scripts/deploy.sh update

# Performance review
curl http://localhost:9090/metrics
```

## 📱 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| Main Application | https://yourdomain.com | Main platform |
| API Documentation | https://yourdomain.com/api | API endpoints |
| Health Check | https://yourdomain.com/api/health | System status |
| Metrics Dashboard | https://yourdomain.com/api/metrics | Performance data |

## 🚨 Emergency Procedures

### Complete Outage

1. **Assess Impact**
   ```bash
   ./scripts/deploy.sh health
   ```

2. **Rollback If Needed**
   ```bash
   ./scripts/deploy.sh rollback latest-backup
   ```

3. **Communicate**
   - Update status page
   - Notify users
   - Document incident

### Data Recovery

```bash
# Database restore
mongorestore --db electronova-production --drop /path/to/backup

# File restore
cp -r /opt/backups/electronova/backup-name/app/* /opt/electronova-sim/
```

## 📞 Support

### Monitoring Dashboards
- **Grafana**: Custom metrics dashboard
- **Kibana**: Log analysis dashboard
- **Prometheus**: Metrics collection

### Contact Information

- **Technical Support**: support@electronova.com
- **Emergency Contact**: +1-555-ELECTRONOVA
- **Documentation**: https://docs.electronova.com

---

## 🎯 Success Criteria

Production deployment is successful when:
- ✅ All health checks pass
- ✅ HTTPS works correctly
- ✅ Database connections stable
- ✅ No errors in logs
- ✅ Performance within SLA
- ✅ Monitoring data flowing

---

**© 2025 Maribel Pinheiro & Miguel González - ElectroNova Business Simulation Platform**