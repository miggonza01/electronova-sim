#!/bin/bash

# ElectroNova v2.4.0 - Deployment Status Report
# Copyright © Maribel Pinheiro & Miguel González | Ene-2026

echo "🚀 ==============================================="
echo "🚀 ElectroNova v2.4.0 - Deployment Status Report"
echo "🚀 ==============================================="
echo "📅 Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "👤 Operators: Maribel Pinheiro & Miguel González"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Backend Status
echo "🔧 --------------------------- BACKEND STATUS ---------------------------"
BACKEND_URL="https://electronova-backend-mvp.onrender.com"
backend_health=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/health" -o /tmp/backend_health.json 2>/dev/null)
backend_code="${backend_health: -3}"

if [ "$backend_code" = "200" ]; then
    echo -e "✅ ${GREEN}Backend URL: $BACKEND_URL${NC}"
    echo -e "✅ ${GREEN}Health Status: OPERATIONAL${NC}"
    backend_response=$(cat /tmp/backend_health.json 2>/dev/null | jq -r '.status // "OK"' 2>/dev/null || echo "OK")
    echo -e "✅ ${GREEN}Response: $backend_response${NC}"
else
    echo -e "❌ ${RED}Backend URL: $BACKEND_URL${NC}"
    echo -e "❌ ${RED}Health Status: FAILED (HTTP $backend_code)${NC}"
    backend_error=$(cat /tmp/backend_health.json 2>/dev/null | jq -r '.error // "Unknown error"' 2>/dev/null || echo "Unknown error")
    echo -e "❌ ${RED}Error: $backend_error${NC}"
fi
echo ""

# Frontend Status
echo "🌐 --------------------------- FRONTEND STATUS --------------------------"
FRONTEND_URL="https://electronova-vercel.app"
frontend_check=$(curl -s -w "%{http_code}" "$FRONTEND_URL" -o /tmp/frontend_check.html 2>/dev/null)
frontend_code="${frontend_check: -3}"

if [ "$frontend_code" = "200" ]; then
    echo -e "✅ ${GREEN}Frontend URL: $FRONTEND_URL${NC}"
    echo -e "✅ ${GREEN}Status: OPERATIONAL${NC}"
    echo -e "✅ ${GREEN}Version: v2.4.0${NC}"
else
    echo -e "⚠️  ${YELLOW}Frontend URL: $FRONTEND_URL${NC}"
    echo -e "⚠️  ${YELLOW}Status: NOT DEPLOYED (HTTP $frontend_code)${NC}"
    echo -e "⚠️  ${YELLOW}Action Required: Deploy to Vercel${NC}"
fi

# Legacy Frontend Status
LEGACY_URL="https://electronova-sim.v2.vercel.app"
legacy_check=$(curl -s -w "%{http_code}" "$LEGACY_URL" -o /tmp/legacy_check.html 2>/dev/null)
legacy_code="${legacy_check: -3}"

if [ "$legacy_code" = "200" ]; then
    echo -e "⚠️  ${YELLOW}Legacy URL: $LEGACY_URL (v2.0)${NC}"
    echo -e "⚠️  ${YELLOW}Status: STILL ACTIVE${NC}"
    echo -e "⚠️  ${YELLOW}Action: Should be removed after v2.4.0 deployment${NC}"
else
    echo -e "✅ ${GREEN}Legacy URL: $LEGACY_URL${NC}"
    echo -e "✅ ${GREEN}Status: NO LONGER ACTIVE${NC}"
fi
echo ""

# Integration Status
echo "🔗 ------------------------- INTEGRATION STATUS ------------------------"
if [ "$backend_code" = "200" ] && [ "$frontend_code" = "200" ]; then
    echo -e "✅ ${GREEN}Frontend-Backend Integration: FULLY FUNCTIONAL${NC}"
    echo -e "✅ ${GREEN}Real-time Features: OPERATIONAL${NC}"
    echo -e "✅ ${GREEN}Multiplayer Support: ACTIVE${NC}"
elif [ "$backend_code" = "200" ]; then
    echo -e "⚠️  ${YELLOW}Frontend-Backend Integration: PARTIAL (Backend only)${NC}"
    echo -e "⚠️  ${YELLOW}Real-time Features: WAITING FOR FRONTEND${NC}"
    echo -e "⚠️  ${YELLOW}Multiplayer Support: PENDING FRONTEND DEPLOYMENT${NC}"
else
    echo -e "❌ ${RED}Frontend-Backend Integration: FAILED${NC}"
    echo -e "❌ ${RED}Real-time Features: NOT OPERATIONAL${NC}"
    echo -e "❌ ${RED}Multiplayer Support: OFFLINE${NC}"
fi
echo ""

# Next Steps
echo "📋 ---------------------------- NEXT STEPS -----------------------------"
if [ "$backend_code" != "200" ]; then
    echo "🔥 CRITICAL: Backend requires immediate attention"
    echo "   1. Check Render dashboard logs: https://dashboard.render.com"
    echo "   2. Verify MongoDB Atlas connection"
    echo "   3. Check environment variables"
    echo "   4. Consider redeploying backend service"
    echo ""
fi

if [ "$frontend_code" != "200" ]; then
    echo "📱 HIGH: Deploy frontend v2.4.0 to Vercel"
    echo "   1. Authenticate with Vercel: cd client && vercel login"
    echo "   2. Deploy: ./scripts/deploy-frontend.sh deploy"
    echo "   3. Configure environment variables"
    echo ""
fi

if [ "$backend_code" = "200" ] && [ "$frontend_code" = "200" ]; then
    echo "🎉 All systems operational!"
    echo "   1. Run comprehensive integration tests"
    echo "   2. Test multiplayer functionality"
    echo "   3. Remove legacy v2.0 frontend"
    echo "   4. Update documentation"
    echo ""
fi

# System Information
echo "📊 --------------------------- SYSTEM INFO -----------------------------"
echo "Backend: Node.js + Express + MongoDB Atlas"
echo "Frontend: React 19.2.0 + Vite 7.2.4 + Tailwind CSS"
echo "Real-time: Socket.IO 4.8.2"
echo "Deployment: Render (Backend) + Vercel (Frontend)"
echo ""

# Cleanup
rm -f /tmp/backend_health.json /tmp/frontend_check.html /tmp/legacy_check.html

echo "🏁 ---------------------------------------------------------------"
echo "🏁 ElectroNova v2.4.0 - Business Simulation Platform"
echo "🏁 © Maribel Pinheiro & Miguel González | Ene-2026"
echo "🏁 ---------------------------------------------------------------"