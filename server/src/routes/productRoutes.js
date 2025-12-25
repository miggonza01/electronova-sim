// ============================================
// FILE: server/src/routes/productRoutes.js
// PURPOSE: Rutas para Productos
// ============================================

const express = require('express');
const router = express.Router();
const { getProducts } = require('../controllers/productController');

router.get('/', getProducts);

module.exports = router;