// server/test-auth.js
// Este script simula un registro de usuario usando la librería 'fetch' nativa de Node 18+
const testRegistration = async () => {
  console.log('>>> Iniciando prueba de Registro...');
  
  const url = 'http://localhost:5000/api/auth/register';
  const userData = {
    name: "Estudiante Omega",
    email: `omega${Date.now()}@test.com`, // Email único cada vez
    password: "passwordSeguro123"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ ÉXITO: Usuario registrado.');
      console.log('🔑 Token recibido:', data.token.substring(0, 20) + '...');
      console.log('🏢 Empresa creada ID:', data.companyId);
    } else {
      console.log('❌ FALLO:', data.error);
    }

  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error.message);
    console.log('Asegúrate de que el servidor esté corriendo en otra terminal.');
  }
};

testRegistration();