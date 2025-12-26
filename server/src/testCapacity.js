// ============================================
// FILE: server/src/testCapacity.js
// PURPOSE: Test unitario manual del CapacityService
// EXECUTE: node src/testCapacity.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const capacityService = require('./services/capacityService');
require('dotenv').config();

// Configuración de conexión manual para el test script
const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada para Test.');
};

const runTest = async () => {
    try {
        await connectDB();

        // 1. ESCENARIO INICIAL: Solo existe tu empresa registrada
        console.log('\n--- PRUEBA 1: UNA SOLA EMPRESA ---');
        await capacityService.calculateAndAssignQuotas();
        
        let myCompany = await Company.findOne();
        console.log(`Empresa A (${myCompany.name}) Cuota: ${myCompany.productionQuota} (Esperado: 6000)`);

        // 2. ESCENARIO COMPETITIVO: Creamos un competidor dummy
        console.log('\n--- PRUEBA 2: ENTRA UN COMPETIDOR ---');
        const dummyCompany = await Company.create({
            user: new mongoose.Types.ObjectId(), // ID falso
            name: "Competidor Fantasma S.A.",
            cash: 500000,
            productionQuota: 0
        });
        console.log('🤖 Competidor creado.');

        // Recalculamos
        await capacityService.calculateAndAssignQuotas();

        // Verificamos
        myCompany = await Company.findOne({ _id: myCompany._id });
        const competitor = await Company.findById(dummyCompany._id);

        console.log(`Empresa A (${myCompany.name}) Cuota: ${myCompany.productionQuota}`);
        console.log(`Empresa B (${competitor.name}) Cuota: ${competitor.productionQuota}`);
        
        if (myCompany.productionQuota === 3000 && competitor.productionQuota === 3000) {
            console.log('✅ ÉXITO: La capacidad se dividió correctamente entre 2.');
        } else {
            console.error('❌ FALLO: La división no es correcta.');
        }

        // 3. LIMPIEZA
        console.log('\n🧹 Borrando competidor fantasma...');
        await Company.findByIdAndDelete(dummyCompany._id);
        
        // Restaurar cuota original (opcional, pero limpio)
        await capacityService.calculateAndAssignQuotas();
        
        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();