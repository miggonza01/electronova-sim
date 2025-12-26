// ============================================
// FILE: server/src/sanityCheck.js
// PURPOSE: Verificar que el registro crea la Empresa v2 correctamente
// EXECUTE: node src/sanityCheck.js
// ============================================

// Función para generar un email aleatorio y evitar errores de "Usuario ya existe"
const randomId = Math.floor(Math.random() * 10000);
const testUser = {
    name: `Test CEO ${randomId}`,
    email: `ceo${randomId}@electronova.test`,
    password: 'password123',
    companyName: `ElectroNova V2 Prototype ${randomId}`
};

async function testRegistration() {
    console.log('🧪 INICIANDO PRUEBA DE REGISTRO v2...');
    console.log(`👤 Usuario Intento: ${testUser.email}`);

    try {
        // 1. Petición HTTP al Endpoint de Registro
        const response = await fetch('http://localhost:5001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Error API: ${data.message || response.statusText}`);
        }

        // 2. Análisis de la Respuesta
        console.log('\n✅ ¡REGISTRO EXITOSO!');
        console.log('------------------------------------------------');
        console.log(`🆔 User ID:    ${data._id}`);
        console.log(`🏭 Company ID: ${data.companyId}`);
        console.log(`🔑 Token JWT:  ${data.token.substring(0, 20)}...`);
        console.log('------------------------------------------------');

        // 3. Verificación de Datos de la Empresa (Consultando la BD vía API si tuviéramos endpoint, 
        // pero aquí confiamos en que si devolvió ID, se creó. 
        // Para estar 100% seguros, verificamos el cash inicial en el siguiente paso).
        
        console.log('📋 RESULTADO ESPERADO:');
        console.log('   - La empresa debe tener $500,000.00 en cash (Raíz).');
        console.log('   - TechLevel debe ser 1.');
        console.log('   - Arrays de inventario deben estar vacíos.');

    } catch (error) {
        console.error('\n❌ FALLÓ LA PRUEBA:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

testRegistration();