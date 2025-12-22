// server/test-admin-config.js
const fetch = require('node-fetch'); // Asegúrate de tener node-fetch si usas Node < 18
const API_URL = 'http://localhost:5000/api/admin';

const initConfig = async () => {
  console.log('>>> INICIALIZANDO CONFIGURACIÓN GLOBAL (si no existe)...');
  try {
    // Intentamos obtenerla
    const response = await fetch(`${API_URL}/config`, {
      headers: { 'Authorization': `Bearer ${process.env.ADMIN_TOKEN}` } // Necesitamos token de Admin
    });
    const data = await response.json();

    if (!data.success && data.error === 'Configuración no encontrada. Por favor, créala primero.') {
      console.log('Creando configuración inicial...');
      // Aquí necesitamos un token de un usuario ADMIN. Si no tienes uno, créalo manualmente en DB.
      // Por ahora, simulamos que el token ya existe y es válido.
      // ¡IMPORTANTE!: Debes tener un usuario con role: 'admin' en tu DB para esta prueba.
      // Si no, la llamada fallará con 403.
      
      // Si no tienes un admin, ejecuta este seeder modificado primero:
      // node src/seederAdmin.js (tendrías que crearlo)
      
      // Aquí asumiríamos que ya existe un admin y obtenemos su token
      // Para esta prueba, vamos a crear una config directamente si no existe
      // Nota: Esto bypasses la ruta protegida, solo para setup inicial
      const resCreate = await fetch(`${API_URL}/config`, { // Simula una llamada directa (no protegida temporalmente)
          method: 'POST', // Asumiendo que creamos esta ruta POST
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ /* valores por defecto */ })
      });
      const dataCreate = await resCreate.json();
      if(dataCreate.success) console.log('Configuración creada:', dataCreate.data);
      else console.error('Fallo al crear config:', dataCreate.error);

    } else if (data.success) {
      console.log('Configuración existente encontrada:', data.data);
    } else {
      console.error('Error inesperado al verificar config:', data.error);
    }
  } catch (error) {
    console.error('Error general en initConfig:', error.message);
  }
};

// initConfig(); // Descomenta si necesitas crearla
console.log("Por favor, ejecuta el seeder para crear un admin si no existe, o confía en la DB.")
console.log("Este script asume que ya existe una configuración global.")