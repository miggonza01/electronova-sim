#!/bin/bash

# ElectroNova v2.4.0 - Manual de Despliegue Rápido
# Copyright © Maribel Pinheiro & Miguel González | Ene-2026

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "🚀 ==============================================="
echo "🚀 ElectroNova v2.4.0 - Manual de Despliegue"
echo "🚀 ==============================================="
echo ""
echo "📅 Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "👤 Operadores: Maribel Pinheiro & Miguel González"
echo ""

# Verificar prerequisitos
check_prerequisites() {
    echo "🔍 Verificando prerequisitos..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm no está instalado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    echo -e "${GREEN}✅ Vercel CLI instalado${NC}"
    echo ""
}

# Construir frontend
build_frontend() {
    echo "🏗️  Construyendo frontend para producción..."
    
    # Limpiar construcciones previas
    rm -rf dist node_modules/.vite
    
    # Instalar dependencias
    npm ci
    
    # Ejecutar linting
    npm run lint
    
    # Construir para producción
    npm run build
    
    # Verificar construcción
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Frontend construido exitosamente${NC}"
        echo -e "${GREEN}📦 Tamaño del build: $(du -sh dist | cut -f1)${NC}"
        echo -e "${GREEN}📁 Archivos creados: $(find dist -type f | wc -l)${NC}"
    else
        echo -e "${RED}❌ Error en la construcción${NC}"
        exit 1
    fi
    echo ""
}

# Instrucciones de despliegue manual
deploy_instructions() {
    echo "📋 Instrucciones de Despliegue Manual:"
    echo ""
    echo "🔐 PASO 1: Autenticar con Vercel"
    echo "   Ejecutar: vercel login"
    echo "   → Visitar: https://vercel.com/oauth/device"
    echo "   → Ingresar código: [proporcionado por CLI]"
    echo ""
    
    echo "🚀 PASO 2: Desplegar a Vercel"
    echo "   Opción A: Despliegue automático"
    echo "   → Ejecutar: vercel --prod"
    echo ""
    echo "   Opción B: Despliegue con configuración"
    echo "   → Usar: vercel.json (ya configurado)"
    echo "   → Ejecutar: vercel --prod"
    echo ""
    
    echo "⚙️  PASO 3: Configurar variables de entorno"
    echo "   VITE_API_URL: https://electronova-backend-mvp.onrender.com/api"
    echo "   VITE_SOCKET_URL: https://electronova-backend-mvp.onrender.com"
    echo "   NODE_ENV: production"
    echo ""
    
    echo "🌐 PASO 4: Verificar despliegue"
    echo "   URL esperada: https://electronova-vercel.app"
    echo "   Health check: curl -I https://electronova-vercel.app"
    echo ""
}

# Estado del backend
backend_status() {
    echo "🔧 Estado del Backend:"
    BACKEND_URL="https://electronova-backend-mvp.onrender.com"
    
    backend_check=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/health" -o /tmp/backend.json 2>/dev/null)
    backend_code="${backend_check: -3}"
    
    if [ "$backend_code" = "200" ]; then
        echo -e "${GREEN}✅ Backend: OPERATIVO ($backend_code)${NC}"
        echo -e "${GREEN}🔗 URL: $BACKEND_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend: PROBLEMAS ($backend_code)${NC}"
        echo -e "${YELLOW}🔗 URL: $BACKEND_URL${NC}"
        echo -e "${YELLOW}🔧 Requiere revisión en Render dashboard${NC}"
    fi
    echo ""
}

# Función principal
main() {
    case "${1:-all}" in
        prerequisites)
            check_prerequisites
            ;;
        build)
            build_frontend
            ;;
        deploy)
            deploy_instructions
            ;;
        status)
            backend_status
            ;;
        all)
            check_prerequisites
            backend_status
            build_frontend
            deploy_instructions
            ;;
        *)
            echo "Uso: $0 {prerequisites|build|deploy|status|all}"
            echo ""
            echo "  prerequisites - Verificar prerequisitos"
            echo "  build        - Construir frontend"
            echo "  deploy       - Mostrar instrucciones de despliegue"
            echo "  status       - Ver estado del backend"
            echo "  all          - Ejecutar todo el proceso"
            exit 1
            ;;
    esac
    
    # Limpiar archivos temporales
    rm -f /tmp/backend.json
    
    echo ""
    echo "🏁 ==============================================="
    echo "🏁 ElectroNova v2.4.0 - Plataforma de Simulación"
    echo "🏁 © Maribel Pinheiro & Miguel González | Ene-2026"
    echo "🏁 ==============================================="
}

# Ejecutar función principal
main "$@"