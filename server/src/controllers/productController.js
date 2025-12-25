// ============================================
// FILE: server/src/controllers/productController.js
// VERSION: v2.0.0-alpha.1
// PURPOSE: Gestionar lectura de catálogo de productos
// ============================================

const Product = require('../models/Product');

// @desc    Obtener todas las gamas de productos
// @route   GET /api/products
// @access  Public (o Protected según necesidad futura)
exports.getProducts = async (req, res) => {
    try {
        // Buscamos todos los productos
        // No necesitamos popular 'rawMaterialRequirements.materialType' aún porque guardamos el string "Alfa", etc.
        const products = await Product.find({});
        
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};