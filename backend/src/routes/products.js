// =============================================
// RUTAS REST PARA PRODUCTOS - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Importar middleware de autenticación
const { protect, authorize } = require('../middleware/auth');

// Importar controladores
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

console.log('🛣️ Inicializando rutas de productos Grow House');

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
 * @route   POST /api/products/:id/rating
 * @desc    Calificar un producto (1-5 estrellas)
 * @access  Privado (usuario autenticado)
 * @body    { rating: Number (1-5) }
 */
router.post('/:id/rating', async (req, res) => {
    try {
        const { rating } = req.body;

        // Validar que el rating sea un número entre 1 y 5
        if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe ser un número entero entre 1 y 5'
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const ratingNum = Number(rating);
        const starKey = ['one', 'two', 'three', 'four', 'five'][ratingNum - 1];

        // Incrementar el contador de esa estrella
        product.rating.breakdown[starKey] += 1;
        product.rating.count += 1;

        // Recalcular el promedio
        const { breakdown, count } = product.rating;
        const total =
            breakdown.one * 1 +
            breakdown.two * 2 +
            breakdown.three * 3 +
            breakdown.four * 4 +
            breakdown.five * 5;

        product.rating.average = Math.round((total / count) * 10) / 10;

        await product.save();

        return res.status(200).json({
            success: true,
            message: '¡Calificación registrada exitosamente!',
            data: {
                average: product.rating.average,
                count: product.rating.count,
                breakdown: product.rating.breakdown
            }
        });

    } catch (error) {
        console.error('❌ Error al calificar producto:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Público
 * @params  id (MongoDB ObjectId)
 */
router.get('/:id', getProductById);

// =============================================
// RUTAS DE ADMINISTRACIÓN (REQUIEREN AUTH)
// =============================================

router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// =============================================
// LOGS
// =============================================

console.log('✅ Rutas de productos configuradas correctamente');
console.log('   📱 GET /api/products');
console.log('   🔍 GET /api/products/:id');
console.log('   🏷️ GET /api/products/category/:category');
console.log('   🏢 GET /api/products/brand/:brand');
console.log('   🔎 GET /api/products/search/:query');

module.exports = router;
