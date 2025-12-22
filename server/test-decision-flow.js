// server/test-decision-flow.js
const loginAndDecide = async () => {
  console.log('>>> INICIANDO PRUEBA DE FLUJO DE DECISIÓN... \n');

  // 1. LOGIN (Para obtener el Token)
  // Usaremos el usuario que creamos en el test anterior (o uno nuevo si falló)
  // Nota: Si cambiaste el email en el test anterior, asegúrate de usar uno válido aquí.
  // Para asegurar éxito, registraremos uno nuevo rápido.
  
  const email = `ceo${Date.now()}@electronova.com`;
  const password = 'password123';

  console.log('1. Registrando nuevo CEO...');
  const regResponse = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'CEO Test', email, password })
  });
  const regData = await regResponse.json();
  
  if (!regData.success) {
    console.error('❌ Fallo en registro:', regData.error);
    return;
  }
  
  const token = regData.token;
  console.log('✅ CEO Registrado. Token obtenido.');

  // 2. ENVIAR DECISIÓN (Usando el Token)
  console.log('\n2. Enviando decisiones para Ronda 1...');
  
  const decisionPayload = {
    price: 150.50,
    marketing: 5000,
    production: { units: 200 },
    logistics: [
      { destination: 'Norte', units: 100, method: 'Aereo' }
    ]
  };

  const decResponse = await fetch('http://localhost:5000/api/decisions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // <--- AQUÍ VA EL TOKEN
    },
    body: JSON.stringify(decisionPayload)
  });

  const decData = await decResponse.json();

  if (decData.success) {
    console.log('✅ ÉXITO TOTAL: Decisión guardada en Base de Datos.');
    console.log('   Precio:', decData.data.price);
    console.log('   Marketing:', decData.data.marketing);
    console.log('   Ronda:', decData.data.round);
  } else {
    console.log('❌ ERROR AL ENVIAR DECISIÓN:', decData.error);
  }
};

loginAndDecide();