// =============================================
// RUTAS DE VENTAS FÍSICAS - GROW HOUSE
// =============================================

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

const {
    createSale,
    getAllSales,
    getSaleById,
    getSalesStats,
    deleteSale
} = require('../controllers/saleController');

// ─── Todas las rutas requieren auth de admin ──────────────────────────────────

/**
 * @route   GET /api/sales/stats
 * @desc    Estadísticas para el dashboard
 * @access  Privado (admin)
 */
router.get('/stats', protect, getSalesStats);

/**
 * @route   GET /api/sales
 * @desc    Listar todas las ventas (con filtros y paginación)
 * @access  Privado (admin)
 */
router.get('/', protect, getAllSales);

/**
 * @route   POST /api/sales
 * @desc    Registrar una nueva venta física
 * @access  Privado (admin)
 */
router.post('/', protect, createSale);

/**
 * @route   GET /api/sales/:id
 * @desc    Obtener venta por ID
 * @access  Privado (admin)
 */
router.get('/:id', protect, getSaleById);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Eliminar venta y restaurar inventario
 * @access  Privado (admin)
 */
router.delete('/:id', protect, deleteSale);

module.exports = router;