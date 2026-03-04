// =============================================
// RUTAS DE PEDIDOS - TECHSTORE PRO
// =============================================

const express = require('express');
const router = express.Router();

// Importar controlador de pedidos
const {
    getMyOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    updateOrderStatus,
    getAllOrders,
    getOrderStats
} = require('../controllers/orderController');

// Importar middleware de autenticación
const { protect, authorize } = require('../middleware/auth');

console.log('📦 Configurando rutas de pedidos...');

// =============================================
// RUTAS PÚBLICAS (ninguna - todos los pedidos requieren autenticación)
// =============================================

// =============================================
// RUTAS PROTEGIDAS PARA USUARIOS AUTENTICADOS
// =============================================

/**
 * @route   GET /api/orders/my-orders
 * @desc    Obtener todos los pedidos del usuario autenticado
 * @access  Privado (requiere login)
 */
router.get('/my-orders', protect, getMyOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    Obtener estadísticas de ventas
 * @access  Privado (solo admin)
 * @note    Esta ruta debe ir ANTES de /api/orders/:id para evitar conflictos
 */
router.get('/stats', protect, authorize('admin'), getOrderStats);

/**
 * @route   GET /api/orders/:id
 * @desc    Obtener detalles de un pedido específico
 * @access  Privado (dueño del pedido o admin)
 */
router.get('/:id', protect, getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Crear un nuevo pedido
 * @access  Privado (requiere login)
 */
router.post('/', protect, createOrder);

/**
 * @route   POST /api/orders/cancel/:id
 * @desc    Cancelar un pedido
 * @access  Privado (solo el dueño del pedido)
 */
router.post('/cancel/:id', protect, cancelOrder);

// =============================================
// RUTAS SOLO PARA ADMINISTRADORES
// =============================================

/**
 * @route   GET /api/orders
 * @desc    Obtener todos los pedidos (con paginación y filtros)
 * @access  Privado (solo admin)
 * @query   ?status=pending&page=1&limit=20
 */
router.get('/', protect, authorize('admin'), getAllOrders);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Actualizar estado de un pedido
 * @access  Privado (solo admin)
 * @body    { status: 'shipped', note: 'Enviado por Servientrega' }
 */
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

console.log('✅ Rutas de pedidos configuradas:');
console.log('   📋 GET /api/orders/my-orders - Mis pedidos');
console.log('   🔍 GET /api/orders/:id - Detalle de pedido');
console.log('   ➕ POST /api/orders - Crear pedido');
console.log('   ❌ POST /api/orders/cancel/:id - Cancelar pedido');
console.log('   📊 GET /api/orders/stats - Estadísticas (Admin)');
console.log('   📋 GET /api/orders - Todos los pedidos (Admin)');
console.log('   🔄 PUT /api/orders/:id/status - Actualizar estado (Admin)');

// =============================================
// EXPORTAR ROUTER
// =============================================

module.exports = router;