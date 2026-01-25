#!/bin/bash

# ElectroNova v2.4.0 - Backend Health Check & Restart Script
# Copyright © Maribel Pinheiro & Miguel González | Ene-2026

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Backend URL
BACKEND_URL="https://electronova-backend-mvp.onrender.com"

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1"
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

# Check backend health
check_backend_health() {
    log "Checking backend health..."
    
    # Test health endpoint
    local health_response=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/health" -o /tmp/health_response.json 2>/dev/null)
    local http_code="${health_response: -3}"
    
    if [ "$http_code" = "200" ]; then
        success "Backend health endpoint: OK (200)"
        local health_content=$(cat /tmp/health_response.json 2>/dev/null || echo "{}")
        info "Response: $health_content"
        return 0
    else
        error "Backend health endpoint: FAILED ($http_code)"
        local error_content=$(cat /tmp/health_response.json 2>/dev/null || echo "{}")
        info "Error response: $error_content"
        return 1
    fi
}

# Check API endpoints
check_api_endpoints() {
    log "Testing key API endpoints..."
    
    local endpoints=(
        "/api/info"
        "/api/market/status"
        "/api/admin/health"
    )
    
    local failed=0
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -w "%{http_code}" "$BACKEND_URL$endpoint" -o /tmp/endpoint_response.json 2>/dev/null)
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            success "$endpoint: OK"
        else
            error "$endpoint: FAILED ($http_code)"
            local error_content=$(cat /tmp/endpoint_response.json 2>/dev/null || echo "{}")
            info "Error: $error_content"
            failed=$((failed + 1))
        fi
    done
    
    return $failed
}

# Check database connectivity
check_database_connectivity() {
    log "Checking database connectivity..."
    
    # This would normally test database connection
    # Since we can't access the database directly, we'll test an endpoint that uses it
    local db_test_response=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/info" -o /tmp/db_test.json 2>/dev/null)
    local http_code="${db_test_response: -3}"
    
    if [ "$http_code" = "200" ]; then
        success "Database connectivity: OK"
        return 0
    else
        error "Database connectivity: FAILED ($http_code)"
        local db_error=$(cat /tmp/db_test.json 2>/dev/null || echo "{}")
        info "Database error: $db_error"
        return 1
    fi
}

# Main function
main() {
    log "🔧 ElectroNova v2.4.0 - Backend Health Check"
    log "Backend URL: $BACKEND_URL"
    echo ""
    
    local overall_failed=0
    
    # Check basic health
    if ! check_backend_health; then
        overall_failed=$((overall_failed + 1))
    fi
    
    echo ""
    
    # Check API endpoints
    if ! check_api_endpoints; then
        overall_failed=$((overall_failed + 1))
    fi
    
    echo ""
    
    # Check database connectivity
    if ! check_database_connectivity; then
        overall_failed=$((overall_failed + 1))
    fi
    
    echo ""
    
    # Summary
    if [ $overall_failed -eq 0 ]; then
        success "🎉 All backend health checks passed!"
        info "Backend is fully operational"
    else
        error "❌ Backend health checks failed ($overall_failed systems affected)"
        warning "Backend may require attention or restart"
        
        echo ""
        info "🔧 Suggested actions:"
        echo "1. Check Render dashboard for backend logs"
        echo "2. Verify environment variables are correct"
        echo "3. Check MongoDB Atlas connection"
        echo "4. Consider redeploying backend service"
    fi
    
    echo ""
    info "Backend Dashboard: https://dashboard.render.com/web/services"
    info "Backend URL: $BACKEND_URL"
    
    # Cleanup
    rm -f /tmp/health_response.json /tmp/endpoint_response.json /tmp/db_test.json
    
    return $overall_failed
}

# Run main function
main "$@"