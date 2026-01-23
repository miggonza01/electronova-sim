// ============================================
// FILE: server/src/routes/gameRoutes.js
// VERSION: v2.4.0-production
// PURPOSE: Game management routes for ElectroNova
// RIGHTS: © Maribel Pinheiro & Miguel González | Dic-2025
// ============================================

const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Company = require('../models/Company');
const User = require('../models/User');
//const authMiddleware = require('../middlewares/authMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get game info
router.get('/:gameCode', async (req, res) => {
  try {
    const { gameCode } = req.params;
    const game = await Game.findOne({ code: gameCode })
      .populate('players.userId', 'name email')
      .populate('adminId', 'name email');
    
    if (!game) {
      return res.status(404).json({ 
        success: false, 
        error: 'Juego no encontrado' 
      });
    }
    
    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

// Get user's games
router.get('/my-games', authMiddleware, async (req, res) => {
  try {
    const games = await Game.find({
      $or: [
        { adminId: req.user.userId },
        { 'players.userId': req.user.userId }
      ]
    })
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      games
    });
  } catch (error) {
    console.error('Error getting user games:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

// Create new game
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, config } = req.body;
    
    const game = new Game({
      name,
      code: name.toUpperCase().replace(/\s+/g, '-'),
      adminId: req.user.userId,
      config: {
        maxRounds: config?.maxRounds || 8,
        initialCash: config?.initialCash || 500000,
        totalProductionCapacity: config?.totalProductionCapacity || 6000,
        ...config
      }
    });
    
    await game.save();
    
    res.status(201).json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

// Join game
router.post('/:gameCode/join', authMiddleware, async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { companyName } = req.body;
    
    const game = await Game.findOne({ 
      code: gameCode.toUpperCase(),
      status: 'WAITING'
    });
    
    if (!game) {
      return res.status(404).json({ 
        success: false, 
        error: 'Juego no encontrado o ya comenzó' 
      });
    }
    
    // Check if user already joined
    const alreadyJoined = game.players.some(
      player => player.userId.toString() === req.user.userId
    );
    
    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya estás en este juego' 
      });
    }
    
    // Create company for user
    const company = new Company({
      name: companyName,
      gameId: game._id,
      userId: req.user.userId,
      cash: game.config.initialCash
    });
    
    await company.save();
    
    // Add player to game
    game.players.push({
      userId: req.user.userId,
      companyId: company._id,
      joinedAt: new Date()
    });
    
    await game.save();
    
    res.json({
      success: true,
      game,
      company
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

// Start game
router.post('/:gameCode/start', authMiddleware, async (req, res) => {
  try {
    const { gameCode } = req.params;
    
    const game = await Game.findOne({ 
      code: gameCode.toUpperCase(),
      adminId: req.user.userId
    });
    
    if (!game) {
      return res.status(403).json({ 
        success: false, 
        error: 'No autorizado' 
      });
    }
    
    if (game.status !== 'WAITING') {
      return res.status(400).json({ 
        success: false, 
        error: 'El juego ya comenzó o terminó' 
      });
    }
    
    game.status = 'ACTIVE';
    game.currentRound = 1;
    game.roundEndsAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    await game.save();
    
    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error del servidor' 
    });
  }
});

module.exports = router;