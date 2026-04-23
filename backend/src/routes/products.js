// =============================================
// RUTAS REST PARA PRODUCTOS - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Importar middleware de autenticación
const { protect } = require('../middleware/auth');

// Importar controladores
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// =============================================
// RUTAS ESPECIALES PARA ECOMMERCE (DEBEN IR PRIMERO)
// =============================================

/**
 * @route   GET /api/products/category/:category
 * @desc    Obtener productos por categoría
 * @access  Público
 */
router.get('/category/:category', (req, res, next) => {
    req.query.category = req.params.category;
    getAllProducts(req, res, next);
});

/**
 * @route   GET /api/products/brand/:brand
 * @desc    Obtener productos por marca
 * @access  Público
 */
router.get('/brand/:brand', (req, res, next) => {
    req.query.brand = req.params.brand;
    getAllProducts(req, res, next);
});

/**
 * @route   GET /api/products/search/:query
 * @desc    Búsqueda de productos por texto
 * @access  Público
 */
router.get('/search/:query', (req, res, next) => {
    req.query.search = req.params.query;
    getAllProducts(req, res, next);
});

// =============================================
// RUTAS PÚBLICAS GENERALES
// =============================================

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos con filtros
 * @access  Público
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Público
 * @params  id (MongoDB ObjectId)
 */
router.get('/:id', getProductById);

// =============================================
// RUTAS DE ADMINISTRADOR
// =============================================

// En este proyecto el único usuario autenticable es el Admin,
// así que `protect` es suficiente para restringir escrituras.
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
