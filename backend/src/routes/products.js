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

// Importar controladores de admin (marketing)
const {
    getCampaigns,
    sendEmailCampaign
} = require('../controllers/adminController');

;

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

/**
 * @route   GET /api/products/campaigns
 * @desc    Obtener todas las campañas de marketing
 * @access  Privado (admin)
 * IMPORTANTE: debe ir ANTES de /:id para que Express no lo confunda con un ID
 */
router.get('/campaigns', protect, authorize('admin'), getCampaigns);

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
 * @desc    Calificar un producto (1-5 estrellas) — 1 voto por usuario
 * @access  Privado (usuario autenticado)
 * @body    { rating: Number (1-5) }
 */
router.post('/:id/rating', protect, async (req, res) => {
    try {
        const { rating } = req.body;

        // Validar rating
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

        const userId = req.user._id.toString();
        const ratingNum = Number(rating);

        // ✅ Verificar si el usuario ya calificó este producto
        const alreadyRated = product.rating.userRatings.find(
            r => r.userId.toString() === userId
        );

        if (alreadyRated) {
            return res.status(400).json({
                success: false,
                message: 'Ya calificaste este producto anteriormente',
                data: {
                    average: product.rating.average,
                    count: product.rating.count,
                    userRating: alreadyRated.rating  // Devolver su calificación previa
                }
            });
        }

        // ✅ Registrar el voto del usuario
        product.rating.userRatings.push({
            userId: req.user._id,
            rating: ratingNum,
            createdAt: new Date()
        });

        // Actualizar breakdown
        const starKey = ['one', 'two', 'three', 'four', 'five'][ratingNum - 1];
        product.rating.breakdown[starKey] += 1;
        product.rating.count += 1;

        // Recalcular promedio
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
                breakdown: product.rating.breakdown,
                userRating: ratingNum
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
 * @route   GET /api/products/:id/my-rating
 * @desc    Obtener la calificación del usuario para un producto
 * @access  Privado (usuario autenticado)
 */
router.get('/:id/my-rating', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select('rating');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const userId = req.user._id.toString();
        const userRating = product.rating.userRatings.find(
            r => r.userId.toString() === userId
        );

        return res.status(200).json({
            success: true,
            data: {
                hasRated: !!userRating,
                userRating: userRating ? userRating.rating : null,
                average: product.rating.average,
                count: product.rating.count
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener rating del usuario:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
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

module.exports = router;
