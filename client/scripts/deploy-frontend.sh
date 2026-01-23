# ============================================
# FILE: client/scripts/deploy-frontend.sh
# VERSION: v2.4.0-production
# PURPOSE: Production deployment script for ElectroNova v2.4.0 frontend
# RIGHTS: © Maribel Pinheiro & Miguel González | Enero-2026
# ============================================

#!/bin/bash

set -e  # Exit on any error

# Configuration
PROJECT_NAME="electronova-sim"
PROJECT_DIR="/opt/$PROJECT_NAME"
LOG_FILE="/var/log/$PROJECT_NAME-deploy.log"
FRONTEND_DIR="$PROJECT_DIR/client"
BUILD_DIR="$FRONTEND_DIR/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
NC'

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S')" -e "$1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
    
    # Check if directory exists
    if [[ ! -d "$PROJECT_DIR" ]]; then
        error "Project directory does not exist: $PROJECT_DIR"
    fi
    
    # Check if in correct directory
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        error "Frontend directory does not exist: $FRONTEND_DIR"
    fi
    
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI not installed. Run: npm install -g vercel"
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed or not in PATH"
    fi
    
    # Check for git
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    success "All prerequisites satisfied"
}

# Build frontend
build_frontend() {
    log "Building frontend for production..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    if npm ci --production; then
        success "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
    fi
    
    # Build production version
    log "Building production version..."
    if npm run build:prod; then
        success "Frontend built successfully"
    else
        error "Frontend build failed"
        exit 1
    fi
    
    log "Build artifacts created in: $BUILD_DIR"
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel..."
    
    # Check if logged in to Vercel
    if ! vercel whoami > /dev/null 2>&1; then
        error "Not logged in to Vercel. Please run: vercel login"
    fi
    
    # Deploy to production
    log "Starting Vercel deployment..."
    if npm run deploy; then
        success "Frontend deployed successfully"
    else
        error "Vercel deployment failed"
        exit 1
    fi
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel deploy --prod 2>&1 | grep -o 'Preview:' | head -n1 | cut -d' ' ' | cut -d '2')
    if [ -n "$DEPLOYMENT_URL" ]; then
        DEPLOYMENT_URL=$(echo "$DEPLOY_URL" | awk '{print $1}')
        success "Deployment completed: $DEPLOYMENT_URL"
    else
        success "Deployment initiated - check Vercel dashboard"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for deployment to propagate
    sleep 10
    
    # Test frontend
    if curl -s "$DEPLOYMENT_URL" > /dev/null 2>&1; then
        success "Frontend is accessible"
    else
        warning "Frontend not accessible: $DEPLOYMENT_URL"
    fi
    
    # Test API connection through frontend
    if curl -s "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
        success "Frontend can connect to backend"
    else
        warning "Frontend cannot connect to backend"
    fi
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove build directory (optional, as Vercel handles this)
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
    fi
    
    # Remove log file if empty
    if [[ -f "$LOG_FILE" ]] && [[ ! -s "$LOG_FILE" ]]; then
        rm "$LOG_FILE"
    fi
}

# Rollback
rollback() {
    log "Rolling back to previous deployment..."
    
    cd "$FRONTEND_DIR"
    
    # Checkout previous commit
    git checkout HEAD~1
    
    # Rollback Vercel deployment
    log "Rolling back Vercel deployment..."
    if npm run deploy --prod --force; then
        success "Rollback completed successfully"
    else
        error "Rollback failed"
        exit 1
    fi
    
    log "Rollback completed: Previous version restored"
}

# Show deployment status
show_status() {
    echo ""
    echo "📊 ELECTRONOVA V2.4.0 - FRONTEND DEPLOYMENT STATUS"
    echo ""
    echo "=========================================="
    
    echo "✅ Status: Deployed"
    echo "🌍 URL: $DEPLOYMENT_URL"
    echo "📊 Environment: Production"
    echo "🔧 Backend: https://electronova-backend-mvp.onrender.com/api"
    echo "⚙️ API: https://electronova-backend-mvp.onrender.com/api/health"
    echo "📈 Metrics: https://electronova-backend-mvp.onrender.com/api/metrics"
    echo ""
    echo "📋 Features v2.4.0:"
    echo "   • Motor ECPCIM completo"
    echo "   • Eventos aleatorios activos"
    echo "   • Panel administrativo operando"
    echo "   • Real-time multiplayer"
    echo "   • Seguridad enterprise-level"
    echo "   • Monitoreo integral"
    echo ""
    echo "=========================================="
}

# Main execution
main() {
    log "Starting ElectroNova v2.4.0 frontend deployment..."
    
    case "${1:-}" in
        check_prerequisites
        build_frontend
        deploy_to_vercel
        health_check
        cleanup
        show_status
        ;;
    
    "${2:-test" in
        health_check
        ;;
    
    "${3:-rollback" in
        rollback
        ;;
    
    "${4:-help}" in
        echo ""
        echo "🔧 ElectroNova v2.4.0 - Frontend Deployment Helper"
        echo ""
        echo "Usage: $0 {build|deploy|test|rollback|help}"
        echo ""
        echo "Commands:"
        echo "  build       - Build frontend for production"
        echo "  deploy     - Deploy to Vercel production"
        echo "  test       - Health check"
        echo "  rollback   - Rollback previous deployment"
        echo "  help       - Show this help"
        echo ""
        echo "Environment: $0"
        echo ""
        echo "URL: https://electronova-backend-mvp.onrender.com"
        echo ""
        echo "Vercel Dashboard: https://vercel.com/dashboard"
        ;;
    
    *)
        echo "Unknown command: $0"
        echo "Use './deploy-frontend.sh help' for available commands"
        exit 1
        ;;
    esac
    
    success "Deployment process completed"
}

# Execute main function
main "$@"