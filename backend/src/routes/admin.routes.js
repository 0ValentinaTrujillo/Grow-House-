// =============================================
// RUTAS PANEL ADMINISTRADOR - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();

// Middleware de autenticación y autorización
const { protect, authorize } = require('../middleware/auth');

// Controladores
const adminController = require('../controllers/adminController');
const couponController = require('../controllers/couponController');


// =============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN DE ADMIN
// =============================================

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);
// Campañas para clientes logueados
router.get('/marketing/campaigns/public', adminController.getPublicCampaigns);
// Cupones para clientes logueados
router.get('/coupons/public', couponController.getPublicCoupons);

router.use(authorize('admin'));

// =============================================
// DASHBOARD Y ESTADÍSTICAS
// =============================================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtener estadísticas generales del dashboard
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/analytics/sales
 * @desc    Obtener análisis de ventas (gráficos, métricas)
 * @access  Admin
 */
router.get('/analytics/sales', adminController.getSalesAnalytics);

/**
 * @route   GET /api/admin/analytics/customers
 * @desc    Obtener análisis de clientes
 * @access  Admin
 */
router.get('/analytics/customers', adminController.getCustomerAnalytics);

/**
 * @route   GET /api/admin/analytics/products
 * @desc    Obtener análisis de productos (más vendidos, etc.)
 * @access  Admin
 */
router.get('/analytics/products', adminController.getProductAnalytics);

// =============================================
// GESTIÓN DE PRODUCTOS
// =============================================

/**
 * @route   GET /api/admin/products
 * @desc    Obtener todos los productos (con filtros)
 * @access  Admin
 */
router.get('/products', adminController.getAllProducts);

/**
 * @route   POST /api/admin/products
 * @desc    Crear nuevo producto
 * @access  Admin
 */
router.post('/products', adminController.createProduct);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Actualizar producto
 * @access  Admin
 */
router.put('/products/:id', adminController.updateProduct);
router.get('/products/:id', adminController.getProductById);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Eliminar producto
 * @access  Admin
 */
router.delete('/products/:id', adminController.deleteProduct);

/**
 * @route   POST /api/admin/products/:id/featured
 * @desc    Marcar/desmarcar producto como destacado
 * @access  Admin
 */
router.post('/products/:id/featured', adminController.toggleProductFeatured);

// =============================================
// GESTIÓN DE PEDIDOS
// =============================================

/**
 * @route   GET /api/admin/orders
 * @desc    Obtener todos los pedidos (con filtros)
 * @access  Admin
 */
router.get('/orders', adminController.getAllOrders);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Obtener detalles de un pedido
 * @access  Admin
 */
router.get('/orders/:id', adminController.getOrderDetails);

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Actualizar estado del pedido
 * @access  Admin
 */
router.put('/orders/:id/status', adminController.updateOrderStatus);

/**
 * @route   POST /api/admin/orders/physical
 * @desc    Registrar venta física en tienda
 * @access  Admin
 */
router.post('/orders/physical', adminController.createPhysicalOrder);

/**
 * @route   POST /api/admin/orders/:id/tracking
 * @desc    Agregar número de seguimiento
 * @access  Admin
 */
router.post('/orders/:id/tracking', adminController.addTrackingNumber);

/**
 * @route   GET /api/admin/orders/pending/old
 * @desc    Obtener pedidos pendientes antiguos
 * @access  Admin
 */
router.get('/orders/pending/old', adminController.getOldPendingOrders);

// =============================================
// GESTIÓN DE CLIENTES
// =============================================

/**
 * @route   GET /api/admin/customers
 * @desc    Obtener lista de clientes
 * @access  Admin
 */
router.get('/customers', adminController.getAllCustomers);

/**
 * @route   GET /api/admin/customers/:id
 * @desc    Obtener detalles de un cliente
 * @access  Admin
 */
router.get('/customers/:id', adminController.getCustomerDetails);

/**
 * @route   GET /api/admin/customers/:id/orders
 * @desc    Obtener historial de pedidos de un cliente
 * @access  Admin
 */
router.get('/customers/:id/orders', adminController.getCustomerOrders);

/**
 * @route   PUT /api/admin/customers/:id/status
 * @desc    Activar/desactivar cuenta de cliente
 * @access  Admin
 */
router.put('/customers/:id/status', adminController.updateCustomerStatus);

// =============================================
// GESTIÓN DE CUPONES
// =============================================

/**
 * @route   GET /api/admin/coupons
 * @desc    Obtener todos los cupones
 * @access  Admin
 */
router.get('/coupons', couponController.getAllCoupons);

/**
 * @route   POST /api/admin/coupons
 * @desc    Crear nuevo cupón
 * @access  Admin
 */
router.post('/coupons', couponController.createCoupon);

/**
 * @route   GET /api/admin/coupons/:id
 * @desc    Obtener detalles de un cupón
 * @access  Admin
 */
router.get('/coupons/:id', couponController.getCouponDetails);

/**
 * @route   PUT /api/admin/coupons/:id
 * @desc    Actualizar cupón
 * @access  Admin
 */
router.put('/coupons/:id', couponController.updateCoupon);

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Eliminar cupón
 * @access  Admin
 */
router.delete('/coupons/:id', couponController.deleteCoupon);

/**
 * @route   POST /api/admin/coupons/:id/toggle
 * @desc    Activar/desactivar cupón
 * @access  Admin
 */
router.post('/coupons/:id/toggle', couponController.toggleCouponStatus);

/**
 * @route   GET /api/admin/coupons/stats/usage
 * @desc    Obtener estadísticas de uso de cupones
 * @access  Admin
 */
router.get('/coupons/stats/usage', couponController.getCouponStats);

/**
 * @route   POST /api/admin/products/:id/seasonal
 * @desc    Marcar producto como estacional
 * @access  Admin
 */
router.post('/products/:id/seasonal', adminController.markAsSeasonalProduct);

// =============================================
// MARKETING Y PROMOCIONES
// =============================================

/**
 * @route   POST /api/admin/marketing/email
 * @desc    Enviar campaña de email marketing
 * @access  Admin
 */
router.post('/marketing/email', adminController.sendEmailCampaign);

/**
 * @route   GET /api/admin/marketing/campaigns
 * @desc    Obtener historial de campañas
 * @access  Admin
 */
router.get('/marketing/campaigns', adminController.getCampaigns);

/**
 * @route   DELETE /api/admin/marketing/campaigns/:id
 * @desc    Eliminar una campaña del historial
 * @access  Admin
 */
router.delete('/marketing/campaigns/:id', adminController.deleteCampaign);

// =============================================
// REPORTES
// =============================================

/**
 * @route   GET /api/admin/reports/sales
 * @desc    Generar reporte de ventas
 * @access  Admin
 * @query   startDate, endDate, format (json, csv, pdf)
 */
router.get('/reports/sales', adminController.generateSalesReport);

/**
 * @route   GET /api/admin/reports/customers
 * @desc    Generar reporte de clientes
 * @access  Admin
 */
router.get('/reports/customers', adminController.generateCustomerReport);

module.exports = router;