// ============================================
// FILE: server/test/mongo-setup.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: MongoDB Setup Guide for ElectroNova Development
// CHANGE LOG: Initial setup guide for MongoDB
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

console.log('🗄️ ELECTRONOVA MONGODB SETUP GUIDE');
console.log('=====================================');
console.log('');
console.log('📋 PASOS PARA CONFIGURAR MONGODB:');
console.log('');
console.log('1. INSTALAR MONGODB LOCALMENTE:');
console.log('   Opción A: MongoDB Community');
console.log('   - Descargar: https://www.mongodb.com/try/download/community');
console.log('   - Instalar y asegurar que MongoDB esté corriendo');
console.log('');
console.log('   Opción B: Docker');
console.log('   - docker run --name mongodb -p 27017:27017 -d mongo:latest');
console.log('   - Esto iniciará MongoDB en el puerto 27017');
console.log('');
console.log('2. VERIFICAR CONEXIÓN:');
console.log('   - MongoDB debe estar corriendo en localhost:27017');
console.log('   - El archivo .env debería contener: MONGODB_URI=mongodb://localhost:27017/electronova-v2');
console.log('');
console.log('3. BASES DE DATOS:');
console.log('   - electronova-v2: Desarrollo principal');
console.log('   - electronova-test: Para pruebas automatizadas');
console.log('   - electronova-integration-test: Para pruebas de integración');
console.log('');
console.log('4. EJECUTAR PRUEBAS:');
console.log('   - node test/validation-suite.js (sin MongoDB)');
console.log('   - node test/integration-test.js (con MongoDB)');
console.log('   - node test/marketEngineV2-test.js (con MongoDB)');
console.log('');
console.log('🚀 UNA VEZ CONFIGURADO MONGODB:');
console.log('=====================================');
console.log('Ejecutar: cd server && npm run dev');
console.log('El servidor debería iniciar sin errores de conexión');
console.log('');
console.log('📊 VERIFICAR SALIDA ESPERADA:');
console.log('- ✅ MONGODB CONECTADO: electronova-v2');
console.log('- 🎲 Eventos aleatorios inicializados');
console.log('- 🌐 Servidor: http://localhost:5000');
console.log('');
console.log('🔧 SI HAY PROBLEMAS:');
console.log('=====================================');
console.log('1. Verificar que MongoDB esté corriendo:');
console.log('   - Windows: Services.msc → MongoDB debería estar "Running"');
console.log('   - macOS/Linux: brew services list | grep mongodb');
console.log('');
console.log('2. Verificar puerto:');
console.log('   - netstat -an | grep 27017');
console.log('   - Debería mostrar LISTEN en 27017');
console.log('');
console.log('3. Verificar autenticación:');
console.log('   - Si MongoDB requiere auth, agregar a URI:');
console.log('   - mongodb://username:password@localhost:27017/electronova-v2');
console.log('');
console.log('4. Limpiar si es necesario:');
console.log('   - En mongo shell: use electronova-v2; db.dropDatabase();');
console.log('');
console.log('✅ LISTO PARA DESARROLLO');