// ============================================
// FILE: server/src/seedV2.js
// PURPOSE: Poblar la BD v2 con Datos Maestros (Productos y MP)
// EXECUTE: npm run seed:v2
// ============================================

const mongoose = require('mongoose');
const Product = require('./models/Product');
const RawMaterial = require('./models/RawMaterial');
require('dotenv').config(); // Carga .env general
// Nota: dotenv-cli se encargará de sobreescribir con .env.development.v2 al ejecutar el comando

const connectDB = async () => {
    // Lógica Smart Switching idéntica a app.js
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    const dbName = dbUri.split('/').pop().split('?')[0];
    
    console.log(`🌱 SEEDER: Conectando a ${dbName}...`);
    await mongoose.connect(dbUri);
    console.log('✅ Conectado.');
};

const seedData = async () => {
    try {
        await connectDB();

        // 1. LIMPIEZA
        console.log('🧹 Limpiando colecciones antiguas...');
        await Product.deleteMany({});
        await RawMaterial.deleteMany({});

        // 2. INSERTAR MATERIAS PRIMAS (Precios Base según PDF/Estimación)
        // PDF Pág 4 Ejemplo: Alfa $15. Asumimos valores escalados para Beta y Omega.
        console.log('📦 Insertando Materias Primas...');
        const materials = await RawMaterial.insertMany([
            { name: 'Alfa', baseCost: 15.00, description: 'Insumo base estándar.' },
            { name: 'Beta', baseCost: 25.00, description: 'Componente avanzado.' },
            { name: 'Omega', baseCost: 5.00, description: 'Material auxiliar económico.' }
        ]);

        // 3. INSERTAR PRODUCTOS (Gamas)
        // Definimos costos base de manufactura (sin incluir MP) y fórmulas
        console.log('🚀 Insertando Productos...');
        await Product.insertMany([
            {
                name: 'Alta',
                baseProductionCost: 50.00, // Costo de ensamblaje (Labor + Overhead)
                rawMaterialRequirements: [
                    { materialType: 'Alfa', quantity: 2 }, // Requiere 2 unidades de Alfa
                    { materialType: 'Beta', quantity: 3 }  // Requiere 3 unidades de Beta
                ]
            },
            {
                name: 'Media',
                baseProductionCost: 30.00,
                rawMaterialRequirements: [
                    { materialType: 'Alfa', quantity: 2 },
                    { materialType: 'Omega', quantity: 1 }
                ]
            },
            {
                name: 'Básica',
                baseProductionCost: 15.00,
                rawMaterialRequirements: [
                    { materialType: 'Omega', quantity: 3 }
                ]
            }
        ]);

        console.log('✨ ¡SEMILLA COMPLETADA CON ÉXITO!');
        console.log('   - 3 Materias Primas creadas.');
        console.log('   - 3 Gamas de Producto creadas.');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR EN SEEDER:', error);
        process.exit(1);
    }
};

seedData();