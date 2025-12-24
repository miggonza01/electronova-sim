// server/src/seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const GlobalConfig = require('./models/GlobalConfig');
const Decision = require('./models/Decision'); // Importamos para borrar decisiones viejas

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB Conectada para Seed...'))
  .catch(err => console.log(err));

const seedData = async () => {
  try {
    // 1. Limpiar TODO
    await Company.deleteMany();
    await User.deleteMany();
    await GlobalConfig.deleteMany();
    await Decision.deleteMany(); // Limpieza profunda
    console.log('Datos antiguos eliminados.');

    // 2. Crear Configuración Global con PLAZAS
    await GlobalConfig.create({
      currentRound: 1,
      gameActive: true,
      loanInterestRate: 0.05,
      storageCostPerUnit: 0.20,
      markets: [
        {
          name: "Norte",
          baseDemand: 3000,
          priceSensitivity: 1.2, // Clientes fieles, afectan poco los cambios de precio
          maxAcceptablePrice: 450,
          referencePrice: 200 // Están acostumbrados a pagar $200
        },
        {
          name: "Centro",
          baseDemand: 5000,
          priceSensitivity: 2.0, // Normal
          maxAcceptablePrice: 300,
          referencePrice: 150 // Precio estándar de mercado
        },
        {
          name: "Sur",
          baseDemand: 4000,
          priceSensitivity: 3.5, // Muy sensibles
          maxAcceptablePrice: 200,
          referencePrice: 100 // Buscan ofertas
        }
      ]
    });
    console.log('Configuración Global y Mercados creados.');

    // 3. Crear ADMIN
    const admin = await User.create({
      name: 'Profesor Admin',
      email: 'admin@electronova.com',
      password: 'admin123',
      role: 'admin'
    });

    // 4. Crear ESTUDIANTE
    const student = await User.create({
      name: 'Estudiante Alpha',
      email: 'student@electronova.com',
      password: 'student123',
      role: 'student'
    });

    // 5. Crear Empresa del Estudiante
    await Company.create({
      user: student._id,
      name: 'Alpha Industries',
      financials: { 
        cash: 500000.00,
        assets: 500000.00,
        liabilities: 0.00
      },
      rawMaterials: {
        units: 0,
        averageCost: 0
      },
      factoryStock: { units: 0, unitCost: 0 },
      inventory: [], // Sin stock inicial
      inTransit: [],
      history: [],
      currentRound: 1
    });
    console.log('Usuarios y Empresa creados.');

    process.exit();
  } catch (error) {
    console.error('Error en Seeder:', error);
    process.exit(1);
  }
};

seedData();