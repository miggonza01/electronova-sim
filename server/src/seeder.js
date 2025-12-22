// server/src/seeder.js
require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const GlobalConfig = require('./models/GlobalConfig');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB Conectada para Seed...'))
  .catch(err => console.log(err));

const seedData = async () => {
  try {
    // 1. Limpiar TODO
    await Company.deleteMany();
    await User.deleteMany();
    await GlobalConfig.deleteMany();
    console.log('Datos antiguos eliminados.');

    // 2. Crear Configuración Global
    await GlobalConfig.create({
      currentRound: 1,
      gameActive: true,
      loanInterestRate: 0.05
    });
    console.log('Configuración Global creada.');

    // 3. Crear ADMIN
    const admin = await User.create({
      name: 'Profesor Admin',
      email: 'admin@electronova.com',
      password: 'admin123', // Contraseña fácil para pruebas
      role: 'admin'
    });
    console.log('ADMIN creado:', admin.email);

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
      financials: { cash: 500000.00 },
      inventory: [
        { batchId: 'B-INIT', units: 1000, unitCost: 50.00, age: 0 }
      ]
    });
    console.log('Estudiante y Empresa creados.');

    process.exit();
  } catch (error) {
    console.error('Error en Seeder:', error);
    process.exit(1);
  }
};

seedData();