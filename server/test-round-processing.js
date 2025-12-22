// server/test-round-processing.js

// CONFIGURACIÓN DE PRUEBA
const ADMIN_EMAIL = 'admin@electronova.com'; // Credenciales del Seeder
const ADMIN_PASSWORD = 'admin123';
const API_URL = 'http://localhost:5000/api'; // Base URL

const runSimulation = async () => {
  console.log('>>> INICIANDO PRUEBA DE ADMIN CON NODE NATIVO...');

  try {
    // 1. LOGIN DE ADMIN
    console.log('1. Iniciando sesión como Admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ FALLO LOGIN:', loginData.error);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login exitoso. Token recibido.');

    // 2. OBTENER CONFIGURACIÓN
    console.log('\n2. Verificando Configuración Global...');
    const configResponse = await fetch(`${API_URL}/admin/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const configData = await configResponse.json();
    
    if(configData.success) {
        console.log(`   Ronda Actual: ${configData.data.currentRound}`);
        console.log(`   Juego Activo: ${configData.data.gameActive}`);
    } else {
        console.error('❌ Error obteniendo config:', configData.error);
        return;
    }

    // 3. DISPARAR PROCESAMIENTO DE RONDA
    console.log('\n3. Disparando Cierre de Ronda...');
    const processResponse = await fetch(`${API_URL}/admin/process-round`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const processData = await processResponse.json();

    if (processData.success) {
      console.log('✅ ÉXITO TOTAL: Ronda Procesada.');
      console.log(`   Nueva Ronda Global: ${processData.data.newRound}`);
      
      // Mostrar resultados del mercado si hubo ventas
      if (processData.data.results && processData.data.results.length > 0) {
          console.log('--- RESULTADOS ---');
          processData.data.results.forEach(r => {
              console.log(`   Empresa ${r.companyId} vendió ${r.unitsSold} unidades.`);
          });
      } else {
          console.log('   (Nadie vendió nada porque quizás nadie envió decisiones, pero la ronda avanzó).');
      }

    } else {
      console.error('❌ ERROR AL PROCESAR:', processData.error);
    }

  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error.message);
    console.log('Asegúrate de que el servidor esté corriendo en otra terminal con "npm run dev"');
  }
};

runSimulation();