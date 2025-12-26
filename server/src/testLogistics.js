// ============================================
// FILE: server/src/testLogistics.js
// PURPOSE: Verificar envíos y costos logísticos
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testLogistics.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const Product = require('./models/Product');
const logisticsService = require('./services/logisticsService');
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
        const productAlta = await Product.findOne({ name: 'Alta' });

        // 1. VERIFICAR PRECONDICIÓN (Del paso anterior)
        const factoryItem = company.factoryStock.find(fs => fs.productLine.toString() === productAlta._id.toString());
        
        if (!factoryItem || factoryItem.units < 100) {
            console.log('⚠️ Re-inyectando stock para prueba (por si reiniciaste la BD)...');
            // Si no existe (ej. corriste seed de nuevo), lo creamos manual
            if (!factoryItem) {
                company.factoryStock.push({ productLine: productAlta._id, units: 100, unitCost: 155.00 });
            } else {
                factoryItem.units = 100;
                factoryItem.unitCost = 155.00;
            }
            await company.save();
        }

        const initialCash = parseFloat(company.cash.toString());

        // 2. DEFINIR DECISIÓN: Enviar 50 a Novaterra (Tierra) y 50 a Solís (Aire)
        // Costos:
        // Novaterra: 50 * $5 = $250. Llega en 2 rondas.
        // Solís: 50 * $15 = $750. Llega en 1 ronda.
        // Total Cash: -$1000.
        const mockDecision = {
            logistics: [
                { 
                    productLine: productAlta._id, 
                    destination: 'Novaterra', 
                    method: 'terrestre', 
                    units: 50 
                },
                { 
                    productLine: productAlta._id, 
                    destination: 'Solís', 
                    method: 'aereo', 
                    units: 50 
                }
            ]
        };

        // 3. EJECUTAR SERVICIO
        await logisticsService.processLogistics(mockDecision, company);
        await company.save();

        // 4. VERIFICACIÓN
        const updatedCompany = await Company.findById(company._id);
        const finalCash = parseFloat(updatedCompany.cash.toString());
        const transitList = updatedCompany.inTransit.products;

        console.log('\n📊 RESULTADOS:');
        console.log(`   Cash Final: $${finalCash} (Esperado: $${initialCash - 1000})`);
        console.log(`   Envíos en Tránsito: ${transitList.length}`);

        // Verificar Lotes
        const loteTierra = transitList.find(t => t.destination === 'Novaterra');
        const loteAire = transitList.find(t => t.destination === 'Solís');

        if (loteTierra) console.log(`   📦 Lote Tierra: ${loteTierra.units}u -> Llega en ${loteTierra.roundsUntilArrival} (Esp: 2). Costo Unit: $${parseFloat(loteTierra.unitCost)} (Esp: 160)`);
        if (loteAire) console.log(`   ✈️ Lote Aire: ${loteAire.units}u -> Llega en ${loteAire.roundsUntilArrival} (Esp: 1). Costo Unit: $${parseFloat(loteAire.unitCost)} (Esp: 170)`);

        // Verificar Fábrica Vacía
        const stockRestante = updatedCompany.factoryStock.find(fs => fs.productLine.toString() === productAlta._id.toString());
        console.log(`   Stock Fábrica Restante: ${stockRestante ? stockRestante.units : 0} (Esperado: 0)`);

        if (transitList.length >= 2 && stockRestante.units === 0) {
            console.log('\n✅ PRUEBA EXITOSA: Logística correcta.');
        } else {
            console.error('\n❌ ERROR: Fallo en logística.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();