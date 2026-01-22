# 🎯 **CONFIGURACIÓN BACKEND RENDER - INSTRUCCIONES DETALLADAS**

## **INSTRUCCIONES PASO A PASO**

### **🔐 PASO 1: CREAR NUEVO SERVICIO EN RENDER**

1. **Entrar a Render Dashboard**:
   - URL: https://dashboard.render.com
   - Iniciar sesión con tu cuenta existente

2. **Crear Nuevo Servicio Web**:
   - Click "**New**" → "**Web Service**"
   - **Connect Repository**: Seleccionar `electronova-sim`
   - **Branch**: `main` (ya contiene v2.4.0)
   - **Root Directory**: `server`
   - **Build Command**: `npm ci --production`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (Starter)
   - **Region**: Oregon (o cercana a tus usuarios)

3. **Settings del Servicio**:
   - **Name**: `electronova-backend-mvp` (mantener nombre actual)
   - **Environment**: `Node`

### **🔑 PASO 2: CONFIGURAR VARIABLES DE ENTORNO**

Después de crear el servicio, ir a **Environment** y añadir estas variables:

#### **2.1 Variables Esenciales:**
```
NODE_ENV=production
PORT=5000
```

#### **2.2 Variables de Base de Datos (CRÍTICAS):**
```
MONGODB_URI_V2=mongodb+srv://electronova_admin:<db_password>@electronova-v24-cluster.u9zknzi.mongodb.net/electronova_v2_4_0?retryWrites=true&w=majority&appName=electronova-v24-cluster
JWT_SECRET_V2=ELECTRONOVA_V24_SECRET_2026_PRODUCTION_KEY_SECURE_GENERATED
```

#### **2.3 Variables Opcionales:**
```
CORS_ORIGIN=https://electronova-sim.vercel.app
```

**🔑 IMPORTANTE**: 
- Reemplazar `<db_password>` con tu contraseña real
- El JWT_SECRET debe ser único y seguro
- Guardar estas credenciales en lugar seguro

### **🏗️ PASO 3: VERIFICAR DEPLOYMENT**

1. **Esperar Deployment** (3-5 minutos)
2. **Verificar Logs** en Render Dashboard
3. **Probar Health Endpoint**: https://electronova-backend-mvp.onrender.com/api/health

**✅ Debería responder:**
```json
{
  "status": "healthy", 
  "version": "2.4.0",
  "environment": "production"
}
```

### **🔍 PASO 4: TROUBLESHOOTING**

Si hay errores:

#### **4.1 Errores Comunes:**
- **Build fails**: Revisar package.json y scripts
- **Connection errors**: Verificar MONGODB_URI_V2
- **CORS errors**: Revisar CORS_ORIGIN

#### **4.2 Logs Útiles:**
- **Build logs**: Build tab en Render Dashboard
- **Application logs**: Logs tab en tiempo real
- **Health checks**: `/api/health` endpoint

---

## **📋 CHECKLIST DE VERIFICACIÓN**

- [ ] Servicio creado en Render
- [ ] Variables de entorno configuradas
- [ ] MongoDB URI conectada exitosamente
- [ ] Health endpoint respondiendo
- [ ] Logs sin errores críticos
- [ ] Backend listo para conectar con frontend

---

## **⏭️ PROXIMO: VERCEL FRONTEND**

Una vez completado el backend, continuaremos con:

1. **Crear proyecto Vercel**
2. **Configurar variables de entorno Vercel**
3. **Conectar frontend con backend**
4. **Testing completo**

---

**📞 CONTÁCTAME SI TIENES ALGUNA DUDA O ERROR DURANTE ESTE PROCESO**