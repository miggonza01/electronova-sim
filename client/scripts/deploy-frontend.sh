#!/bin/bash

# ElectroNova v2.4.0 - Frontend Deployment Script
# Copyright © Maribel Pinheiro & Miguel González | Ene-2026

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') -e "$1""
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Check if we're in the client directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Are you in the client directory?"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Build frontend
build_frontend() {
    log "Building ElectroNova v2.4.0 frontend..."
    
    # Install dependencies
    info "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    info "Running code quality checks..."
    npm run lint
    
    # Build for production
    info "Building for production..."
    npm run build
    
    # Verify build
    if [ ! -d "dist" ]; then
        error "Build failed - dist directory not found"
        exit 1
    fi
    
    success "Frontend build completed successfully"
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel..."
    
    # Check Vercel authentication
    if ! vercel whoami &> /dev/null; then
        error "Not authenticated with Vercel. Run 'vercel login' first."
        exit 1
    fi
    
    # Deploy with production configuration
    info "Initiating deployment to Vercel..."
    
    # Get deployment URL
    DEPLOYMENT_OUTPUT=$(vercel deploy --prod 2>&1)
    if echo "$DEPLOYMENT_OUTPUT" | grep -q "https://"; then
        DEPLOYMENT_URL=$(echo "$DEPLOYMENT_OUTPUT" | grep -o 'https://[^[:space:]]*' | head -n1)
        success "Deployment completed: $DEPLOYMENT_URL"
    else
        success "Deployment initiated - check Vercel dashboard"
    fi
    
    info "Vercel Dashboard: https://vercel.com/dashboard"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if the application is accessible
    FRONTEND_URL="https://electronova-vercel.app"
    
    if curl -s --head "$FRONTEND_URL" | grep "200 OK" > /dev/null; then
        success "Frontend is accessible at $FRONTEND_URL"
    else
        warning "Frontend may not be accessible yet. This is normal for new deployments."
    fi
    
    # Check API connectivity
    API_URL="https://electronova-backend-mvp.onrender.com"
    if curl -s --head "$API_URL" | grep "200 OK" > /dev/null; then
        success "Backend API is accessible at $API_URL"
    else
        error "Backend API is not accessible"
        exit 1
    fi
    
    success "Health check completed"
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    if [ -d ".next" ]; then
        rm -rf .next
    fi
    
    # Clear npm cache if needed
    # npm cache clean --force
    
    success "Cleanup completed"
}

# Show deployment status
show_status() {
    log "Current deployment status:"
    
    echo ""
    info "🌐 Frontend: https://electronova-vercel.app"
    info "🔧 Backend:  https://electronova-backend-mvp.onrender.com"
    info "📊 Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    
    success "ElectroNova v2.4.0 deployment status displayed"
}

# Rollback deployment
rollback_deployment() {
    log "Rolling back to previous deployment..."
    
    warning "This will rollback to the previous deployment"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel rollback --prod
        success "Rollback completed"
    else
        info "Rollback cancelled"
    fi
}

# Main execution
main() {
    log "Starting ElectroNova v2.4.0 frontend deployment..."
    
    case "${1:-help}" in
        check_prerequisites)
            check_prerequisites
            ;;
        build)
            check_prerequisites
            build_frontend
            ;;
        deploy)
            check_prerequisites
            build_frontend
            deploy_to_vercel
            ;;
        test)
            health_check
            ;;
        rollback)
            rollback_deployment
            ;;
        status)
            show_status
            ;;
        full)
            check_prerequisites
            build_frontend
            deploy_to_vercel
            health_check
            cleanup
            show_status
            ;;
        help)
            echo ""
            echo "🔧 ElectroNova v2.4.0 - Frontend Deployment Helper"
            echo ""
            echo "Usage: $0 {build|deploy|test|rollback|status|full|help}"
            echo ""
            echo "Commands:"
            echo "  check_prerequisites  - Verify all requirements are met"
            echo "  build                - Build the frontend for production"
            echo "  deploy               - Deploy to Vercel (includes build)"
            echo "  test                 - Perform health check"
            echo "  rollback             - Rollback to previous deployment"
            echo "  status               - Show current deployment status"
            echo "  full                 - Complete deployment pipeline"
            echo "  help                 - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 deploy            # Build and deploy"
            echo "  $0 test              # Health check only"
            echo "  $0 full              # Complete deployment with checks"
            echo ""
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use './deploy-frontend.sh help' for available commands"
            exit 1
            ;;
    esac
    
    success "Deployment process completed"
}

# Execute main function
main "$@"