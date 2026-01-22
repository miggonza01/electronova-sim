# ============================================
# FILE: MONGODB-SETUP-GUIDE.md
# VERSION: v2.0.0-alpha.1
# PURPOSE: Complete MongoDB Setup Guide for ElectroNova
# RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
# ============================================

# 🗄️ GUÍA COMPLETA DE CONFIGURACIÓN MONGODB PARA ELECTRONOVA

## 📋 ESTADO ACTUAL
- ❌ MongoDB no está instalado en el sistema
- ❌ Docker no está disponible
- ✅ Código listo para integración con MongoDB
- ✅ Archivos de configuración preparados

## 🚀 OPCIÓN RECOMENDADA: MongoDB Community (Windows)

### Paso 1: Descargar MongoDB Community
1. Ir a: https://www.mongodb.com/try/download/community
2. Seleccionar:
   - **Version**: MongoDB 7.0 (o la más reciente)
   - **Platform**: Windows
   - **Package**: MSI (recomendado para Windows)

### Paso 2: Instalar MongoDB Community
1. Ejecutar el archivo `.msi` descargado
2. En la instalación, seleccionar:
   - ✅ **"Complete"** (instalación completa)
   - ✅ **"Install MongoDB as a Windows Service"**
   - ✅ **"Install MongoDB Compass"** (GUI opcional)
   - ✅ **"Add MongoDB to system PATH"**

3. Configurar servicio:
   - **Service Name**: MongoDB
   - **Data Directory**: C:\Program Files\MongoDB\Server\7.0\data
   - **Log Directory**: C:\Program Files\MongoDB\Server\7.0\log

### Paso 3: Verificar Instalación
```bash
# Abrir CMD o PowerShell como Administrador
mongod --version
# Debería mostrar: db version v7.0.x

# Verificar servicio
net start MongoDB
# Debería mostrar: The MongoDB service was started successfully
```

### Paso 4: Configurar Variables de Entorno
1. **Buscar "Variables de Entorno"** en Windows
2. **"Editar las variables de entorno del sistema"**
3. **"Variables de entorno"** → **"Path"** → **"Editar"**
4. **"Nuevo"** → Agregar: `C:\Program Files\MongoDB\Server\7.0\bin`
5. **Aceptar** en todas las ventanas

### Paso 5: Probar Conexión
```bash
# Abrir nueva terminal (CMD/PowerShell)
mongo --eval "db.adminCommand('ismaster')"
# Debería mostrar: { "ismaster" : true, ... }
```

## 🐳 OPCIÓN ALTERNATIVA: Docker (si prefieres contenedores)

### Paso 1: Instalar Docker Desktop
1. Descargar: https://www.docker.com/products/docker-desktop
2. Instalar Docker Desktop para Windows
3. Reiniciar el sistema
4. Iniciar Docker Desktop

### Paso 2: Ejecutar MongoDB en Docker
```bash
# Crear volumen persistente
docker volume create mongodb-data

# Ejecutar MongoDB
docker run --name mongodb -p 27017:27017 -v mongodb-data:/data/db -d mongo:latest

# Verificar que esté corriendo
docker ps
# Debería mostrar el contenedor mongodb
```

## 🔧 CONFIGURACIÓN ELECTRONOVA

### Paso 1: Verificar Archivo .env
```bash
# En C:\mis-apps\electronova-sim\server\
cat .env
# Debería contener:
MONGODB_URI=mongodb://localhost:27017/electronova-v2
JWT_SECRET=electronova-dev-secret-key-2025
PORT=5000
NODE_ENV=development
```

### Paso 2: Iniciar Servidor ElectroNova
```bash
cd C:\mis-apps\electronova-sim\server
npm run dev
```

### Salida Esperada:
```
✅ MONGODB CONECTADO: electronova-v2
🎲 Eventos aleatorios inicializados
🌐 Servidor: http://localhost:5000
🔌 Socket.IO: Activo
📊 Health Check: http://localhost:5000/health
```

## 🧪 EJECUTAR PRUEBAS DE INTEGRACIÓN

### Paso 1: Pruebas sin MongoDB
```bash
cd C:\mis-apps\electronova-sim\server
node test/validation-suite.js
# Debería mostrar: 🎉 TODAS LAS VALIDACIONES PASARON (5/5)
```

### Paso 2: Pruebas con MongoDB
```bash
cd C:\mis-apps\electronova-sim\server
node test/integration-test.js
# Debería mostrar: 🎉 SISTEMA COMPLETO INTEGRADO CORRECTAMENTE
```

## 🛠️ TROUBLESHOOTING COMÚN

### Problema: "mongod no se reconoce"
**Solución:**
1. Verificar instalación: `mongod --version`
2. Agregar al PATH (ver Paso 4 arriba)
3. Reiniciar terminal

### Problema: "El servicio MongoDB no se inicia"
**Solución:**
```bash
# Como Administrador
net stop MongoDB
net start MongoDB
# O reinstalar MongoDB Community
```

### Problema: "Error de conexión ECONNREFUSED"
**Solución:**
1. Verificar que MongoDB esté corriendo: `netstat -an | findstr 27017`
2. Iniciar servicio: `net start MongoDB`
3. Verificar firewall (permitir puerto 27017)

### Problema: "Error de permisos en Windows"
**Solución:**
1. Ejecutar terminal como Administrador
2. O cambiar permisos de carpetas MongoDB
3. Usar Docker como alternativa

## 📊 VERIFICACIÓN FINAL

### Health Check del Sistema
```bash
# 1. MongoDB
mongo --eval "db.version()"

# 2. ElectroNova Server
curl http://localhost:5000/health

# 3. Pruebas
node test/validation-suite.js
node test/integration-test.js
```

### Resultados Esperados:
- ✅ MongoDB conectado y funcionando
- ✅ ElectroNova server corriendo en puerto 5000
- ✅ 5/5 validaciones pasadas
- ✅ Integración completa exitosa

## 🎯 SIGUIENTES PASOS DESPUÉS DE LA CONFIGURACIÓN

1. **Ejecutar pruebas completas de integración**
2. **Validar panel administrativo**
3. **Procesar ronda de prueba con eventos**
4. **Verificar historial de eventos**
5. **Preparar para merge a main**

## 📞 AYUDA ADICIONAL

Si tienes problemas durante la configuración:

1. **Revisa los logs de MongoDB**: `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`
2. **Usa MongoDB Compass** para conexión gráfica
3. **Prueba con Docker** si MongoDB Community falla
4. **Contacta al soporte** con el error específico

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] MongoDB Community instalado
- [ ] Servicio MongoDB corriendo
- [ ] Variables de entorno configuradas
- [ ] Archivo .env configurado
- [ ] ElectroNova server iniciado sin errores
- [ ] Pruebas de validación pasando (5/5)
- [ ] Pruebas de integración pasando
- [ ] Health check funcionando

**Una vez completado este checklist, estarás listo para la validación final del sistema ElectroNova v2.4.0.**