const mongoose = require('mongoose');
const User = require('../src/models/User');
const Game = require('../src/models/Game');
const Company = require('../src/models/Company');
require('dotenv').config();

const main = async () => {
  const uri = process.env.MONGODB_URI_V2 || process.env.MONGODB_URI;
  if (!uri) { console.error('No Mongo URI provided'); process.exit(1); }
  await mongoose.connect(uri);

  try {
    // Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@electronova.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({ name: 'Profesor Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    }

    // DEMO-2025 game
    let game = await Game.findOne({ code: 'DEMO-2025' });
    if (!game) {
      game = await Game.create({
        name: 'Clase Finanzas 101',
        code: 'DEMO-2025',
        adminId: admin._id,
        status: 'ACTIVE',
        currentRound: 1,
        config: { maxRounds: 8, initialCash: 500000, totalProductionCapacity: 6000, marketResearchRound: 1 }
      });
    }

    // Admin Corp for admin in that game
    let company = await Company.findOne({ user: admin._id, gameId: game._id });
    if (!company) {
      company = await Company.create({ user: admin._id, gameId: game._id, name: 'Admin Corp', cash: game.config.initialCash, currentRound: 1, techLevel: 1, ethicsIndex: 100, productionQuota: game.config.totalProductionCapacity, rawMaterials: [], factoryStock: [], inventory: [], inTransit: { materials: [], products: [] } });
    }

    console.log('Seed production ready: DEMO-2025, admin, Admin Corp.');
    process.exit(0);
  } catch (e) {
    console.error('Seed production error:', e);
    process.exit(1);
  }
};

main();
