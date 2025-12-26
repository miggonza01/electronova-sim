// ============================================
// FILE: server/src/testProduction.js
// PURPOSE: Verificar consumo de MP y creación de PT
// EXECUTE: npx dotenv -e .env.development.v2 -- node src/testProduction.js
// ============================================

const mongoose = require('mongoose');
const Company = require('./models/Company');
const Product = require('./models/Product');
const productionService = require('./services/productionService');
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

        // 1. PREPARACIÓN: Inyectar Materiales (Trampa para el test)
        console.log('🧪 Inyectando MP para prueba...');
        company.rawMaterials = [
            { materialType: 'Alfa', units: 1000, averageCost: 15.00 },
            { materialType: 'Beta', units: 1000, averageCost: 25.00 }
        ];
        company.productionQuota = 6000; // Asegurar cuota
        await company.save();

        // 2. DEFINIR DECISIÓN: Producir 100 unidades de Gama Alta
        // Receta Alta: 2 Alfa + 3 Beta. Costo Base: $50.
        // Costo Esperado MP: (2*15) + (3*25) = 30 + 75 = $105.
        // Costo Total Unitario Esperado: 105 + 50 = $155.
        const mockDecision = {
            production: [
                { productLine: productAlta._id, units: 100 }
            ]
        };

        // 3. EJECUTAR SERVICIO
        await productionService.processProduction(mockDecision, company);
        await company.save();

        // 4. VERIFICACIÓN
        const updatedCompany = await Company.findById(company._id);
        const stockAlta = updatedCompany.factoryStock.find(fs => fs.productLine.toString() === productAlta._id.toString());
        const matAlfa = updatedCompany.rawMaterials.find(m => m.materialType === 'Alfa');

        console.log('\n📊 RESULTADOS:');
        
        // Verificación de Stock PT
        if (stockAlta) {
            console.log(`   PT Alta: ${stockAlta.units}u (Esperado: 100)`);
            console.log(`   Costo Unit: $${parseFloat(stockAlta.unitCost).toFixed(2)} (Esperado: $155.00)`);
        } else {
            console.error('❌ ERROR: No se creó stock de Alta.');
        }

        // Verificación de Consumo MP
        // Consumo esperado Alfa: 100 * 2 = 200. Restante: 1000 - 200 = 800.
        console.log(`   MP Alfa Restante: ${matAlfa.units} (Esperado: 800)`);

        if (stockAlta && parseFloat(stockAlta.unitCost) === 155 && matAlfa.units === 800) {
            console.log('\n✅ PRUEBA EXITOSA: Manufactura perfecta.');
        } else {
            console.error('\n❌ ERROR: Discrepancia en cálculos.');
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();