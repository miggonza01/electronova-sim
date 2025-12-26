// ============================================
// FILE: server/src/testArrivals.js
// PURPOSE: Verificar que la carga en tránsito llega al inventario
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testArrivals.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const inventoryService = require('./services/inventoryService');
require('dotenv').config();

const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('🔌 DB Conectada.');
};

const runTest = async () => {
    try {
        await connectDB();
        const company = await Company.findOne();

        // 1. ESTADO PREVIO
        console.log('\n--- ESTADO PREVIO ---');
        console.log(`MP en Tránsito: ${company.inTransit.materials.length}`);
        console.log(`PT en Tránsito: ${company.inTransit.products.length}`);
        console.log(`Inventario Solís: ${company.inventory.filter(i => i.market === 'Solís').length} lotes`);

        // 2. MANIPULACIÓN DEL TIEMPO (Simulación)
        // Forzamos que todo lo que esté en tránsito esté a punto de llegar (roundsUntilArrival = 1)
        console.log('\n⏳ SIMULANDO PASO DEL TIEMPO (Rounds = 1)...');
        
        company.inTransit.materials.forEach(m => m.roundsUntilArrival = 1);
        company.inTransit.products.forEach(p => p.roundsUntilArrival = 1);
        await company.save();

        // 3. EJECUTAR SERVICIO DE LLEGADAS
        const result = await inventoryService.processArrivals(company);
        await company.save();

        // 4. VERIFICACIÓN
        const updatedCompany = await Company.findById(company._id);

        console.log('\n--- RESULTADOS ---');
        console.log(`Items Procesados: ${result.materialsArrived} MP / ${result.productsArrived} PT`);
        
        // Verificar MP
        const alfaStock = updatedCompany.rawMaterials.find(m => m.materialType === 'Alfa');
        console.log(`Stock MP Alfa: ${alfaStock ? alfaStock.units : 0} (Debería haber aumentado)`);

        // Verificar PT en Plaza
        const stockSolis = updatedCompany.inventory.filter(i => i.market === 'Solís');
        const stockNovaterra = updatedCompany.inventory.filter(i => i.market === 'Novaterra');
        
        console.log(`Lotes en Solís: ${stockSolis.length}`);
        if(stockSolis.length > 0) console.log(`   -> Lote 1: ${stockSolis[0].units}u Edad: ${stockSolis[0].ageInRounds}`);
        
        console.log(`Lotes en Novaterra: ${stockNovaterra.length}`);

        // Verificar Limpieza de Tránsito
        if (updatedCompany.inTransit.materials.length === 0 && updatedCompany.inTransit.products.length === 0) {
            console.log('\n✅ PRUEBA EXITOSA: Todo el tránsito ha llegado al inventario.');
        } else {
            console.error('\n❌ ERROR: Aún quedan items en tránsito.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();