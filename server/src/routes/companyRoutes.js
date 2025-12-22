// server/src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const { getMyCompany } = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');

// Protegemos la ruta: Solo usuarios logueados pueden ver su empresa
router.get('/my-company', protect, getMyCompany);

module.exports = router;