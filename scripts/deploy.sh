# ============================================
# FILE: deploy.sh
# VERSION: v2.4.0-production-deployment
# PURPOSE: Production deployment script for ElectroNova
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

#!/bin/bash

set -e  # Exit on any error

# Configuration
PROJECT_NAME="electronova"
DEPLOY_DIR="/opt/$PROJECT_NAME"
BACKUP_DIR="/opt/backups/$PROJECT_NAME"
LOG_FILE="/var/log/$PROJECT_NAME-deploy.log"
REPO_URL="https://github.com/electronova/electronova-sim.git"
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

# Warning message
warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    success "All prerequisites satisfied"
}

# Create deployment directory
create_deployment_dir() {
    log "Creating deployment directory..."
    
    if [ ! -d "$DEPLOY_DIR" ]; then
        mkdir -p "$DEPLOY_DIR"
        chown -R "$USER:$USER" "$DEPLOY_DIR"
        chmod 755 "$DEPLOY_DIR"
        success "Deployment directory created at $DEPLOY_DIR"
    else
        warning "Deployment directory already exists"
    fi
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    if [ -d "$DEPLOY_DIR" ]; then
        BACKUP_NAME="$PROJECT_NAME-backup-$(date +%Y%m%d-%H%M%S)"
        BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
        
        mkdir -p "$BACKUP_DIR"
        
        # Backup application files
        if [ -d "$DEPLOY_DIR" ]; then
            cp -r "$DEPLOY_DIR" "$BACKUP_PATH/app"
        fi
        
        # Backup database
        if command -v mongodump &> /dev/null; then
            mongodump --db electronova-production --out "$BACKUP_PATH/mongodb" 2>/dev/null || warning "MongoDB backup failed"
        fi
        
        success "Backup created at $BACKUP_PATH"
    else
        warning "No existing deployment to backup"
    fi
}

# Clone repository
clone_repository() {
    log "Cloning repository from $REPO_URL..."
    
    cd /tmp
    rm -rf "$PROJECT_NAME"
    
    git clone "$REPO_URL" "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    
    # Switch to production branch
    git checkout "$BRANCH"
    
    # Pull latest changes
    git pull origin "$BRANCH"
    
    success "Repository cloned and updated"
}

# Build application
build_application() {
    log "Building application..."
    
    # Build frontend
    log "Building frontend..."
    cd "$DEPLOY_DIR/../client"
    
    if [ -f "vite.config.prod.js" ]; then
        npm ci --production
        npm run build:prod
    else
        npm ci
        npm run build
    fi
    
    success "Frontend build completed"
    
    # Build backend Docker image
    log "Building backend Docker image..."
    cd "$DEPLOY_DIR"
    
    docker build -t "$PROJECT_NAME:latest" .
    
    success "Docker image built"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    cd "$DEPLOY_DIR"
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f docker-compose.production.yml up -d
    
    success "Application deployed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 30
    
    # Check if application is responding
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        success "Health check passed"
    else
        error "Health check failed"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 10 backups
    find "$BACKUP_DIR" -maxdepth 1 -name "$PROJECT_NAME-backup-*" -type d | sort -r | tail -n +11 | xargs rm -rf
    
    success "Old backups cleaned up"
}

# Deployment rollback
rollback_deployment() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        error "Backup name is required for rollback"
    fi
    
    log "Rolling back to backup: $backup_name"
    
    BACKUP_PATH="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$BACKUP_PATH" ]; then
        error "Backup not found: $backup_name"
    fi
    
    # Stop current deployment
    cd "$DEPLOY_DIR"
    docker-compose -f docker-compose.production.yml down
    
    # Restore from backup
    if [ -d "$BACKUP_PATH/app" ]; then
        rm -rf "$DEPLOY_DIR"
        cp -r "$BACKUP_PATH/app" "$DEPLOY_DIR"
    fi
    
    # Restore database
    if [ -d "$BACKUP_PATH/mongodb" ]; then
        mongorestore --db electronova-production --drop "$BACKUP_PATH/mongodb" 2>/dev/null || warning "MongoDB restore failed"
    fi
    
    # Start application
    docker-compose -f docker-compose.production.yml up -d
    
    success "Rollback completed"
}

# Main deployment function
deploy() {
    log "Starting ElectroNova deployment process..."
    
    check_prerequisites
    create_deployment_dir
    backup_current_deployment
    clone_repository
    
    # Copy files to deployment directory
    log "Copying files to deployment directory..."
    cp -r /tmp/$PROJECT_NAME/* "$DEPLOY_DIR/"
    chown -R "$USER:$USER" "$DEPLOY_DIR"
    
    build_application
    deploy_application
    health_check
    cleanup_backups
    
    success "ElectroNova deployment completed successfully!"
}

# Update deployment (without downtime)
update_deployment() {
    log "Starting ElectroNova update process..."
    
    # Pull latest changes
    cd "$DEPLOY_DIR"
    git pull origin "$BRANCH"
    
    # Update running containers
    docker-compose -f docker-compose.production.yml up -d --build
    
    # Wait for application to restart
    sleep 20
    
    health_check
    
    success "ElectroNova update completed successfully!"
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy         Full deployment process (backup, build, deploy)"
    echo "  update         Update existing deployment (no downtime)"
    echo "  rollback NAME   Rollback to specific backup"
    echo "  health          Perform health check"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 update"
    echo "  $0 rollback electronova-backup-20231201-143000"
    echo "  $0 health"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "update")
        update_deployment
        ;;
    "rollback")
        rollback_deployment "$2"
        ;;
    "health")
        health_check
        ;;
    *)
        usage
        exit 1
        ;;
esac