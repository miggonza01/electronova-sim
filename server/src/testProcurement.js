// ============================================
// FILE: server/src/testProcurement.js
// PURPOSE: Verificar lógica de proveedores (Local vs Importado)
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testProcurement.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const Decision = require('./models/Decision'); // Usamos el modelo solo para estructura simulada
const procurementService = require('./services/procurementService');
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada.');
};

const runTest = async () => {
    try {
        await connectDB();

        // 1. Obtener mi empresa
        const company = await Company.findOne();
        const initialCash = parseFloat(company.cash.toString());
        const initialEthics = company.ethicsIndex;
        
        console.log(`\n🏢 EMPRESA INICIAL: Cash $${initialCash} | Ética ${initialEthics}`);

        // 2. Simular Decisión de Compra
        // Escenario: 
        // - 100 Alfa Local (Caro, Rápido, Ético)
        // - 100 Alfa Importado (Barato, Lento, No Ético)
        const mockDecision = {
            procurement: [
                { materialType: 'Alfa', supplierType: 'local', units: 100 },
                { materialType: 'Alfa', supplierType: 'imported', units: 100 }
            ]
        };

        // 3. Ejecutar Servicio
        await procurementService.processPurchases(mockDecision, company);

        // 4. Guardar cambios (Simulamos lo que haría el controlador)
        await company.save();

        // 5. Verificación
        const updatedCompany = await Company.findById(company._id);
        const finalCash = parseFloat(updatedCompany.cash.toString());
        
        // Cálculos esperados (Asumiendo Alfa Base = $15)
        // Local: 100 * 15 * 1.2 = 1800
        // Importado: 100 * 15 * 1.0 = 1500
        // Total Gasto: 3300
        const expectedCash = initialCash - 3300;
        
        console.log('\n📊 RESULTADOS:');
        console.log(`   Cash Final: $${finalCash} (Esperado: $${expectedCash})`);
        console.log(`   Ética Final: ${updatedCompany.ethicsIndex} (Esperado: ${initialEthics + 5})`); // +5 por el lote local
        console.log(`   Lotes en Tránsito: ${updatedCompany.inTransit.materials.length}`);

        // Ver detalle de lotes
        updatedCompany.inTransit.materials.forEach((lote, i) => {
            console.log(`   📦 Lote ${i+1}: ${lote.supplierType} -> Llega en ${lote.roundsUntilArrival} rondas`);
        });

        if (finalCash === expectedCash && updatedCompany.inTransit.materials.length >= 2) {
            console.log('\n✅ PRUEBA EXITOSA: Cálculos y tiempos correctos.');
        } else {
            console.error('\n❌ ERROR: Los números no cuadran.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();