// =============================================
// CONTROLADOR ADMINISTRADOR - GROW HOUSE
// =============================================

const Product = require('../models/product');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

console.log('🎮 Inicializando controlador de administrador');

/**
 * @desc  Estadísticas generales del dashboard
 * @route GET /api/admin/dashboard
 * @access Admin
 */

/**
 * Obtener estadísticas del dashboard
 */
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas del dashboard...');

        // ─── Fechas de referencia ──────────────────────────────────────────
        const startOfDay   = new Date(new Date().setHours(0, 0, 0, 0));
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const startOfYear  = new Date(new Date().getFullYear(), 0, 1);

        // ─── Consultas en paralelo ─────────────────────────────────────────
        const [
            totalProducts,
            lowStockCount,
            totalOrders,
            pendingOrders,
            totalCustomers,
            activeCustomers,
            totalRevenueAgg,
            ordersToday,
            salesTodayAgg,
            salesMonthAgg,
            salesYearAgg,
            recentSalesRaw,
            lowStockProductsList,
            topProductsAgg
        ] = await Promise.all([

            // Productos
            Product.countDocuments({ status: 'active' }),
            Product.countDocuments({
                status: 'active',
                $expr: { $lte: ['$quantity', '$lowStockAlert'] }
            }),

            // Pedidos
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),

            // Clientes
            User.countDocuments({ role: 'customer' }),
            User.countDocuments({ role: 'customer', isActive: true }),

            // Ingresos totales históricos
            Order.aggregate([
                { $match: { status: { $in: ['delivered', 'shipped'] } } },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),

            // Pedidos creados hoy (todos los estados)
            Order.countDocuments({ createdAt: { $gte: startOfDay } }),

            // Ventas (monto) del día
            Order.aggregate([
                {
                    $match: {
                        status: { $in: ['delivered', 'shipped'] },
                        orderDate: { $gte: startOfDay }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),

            // Ventas del mes
            Order.aggregate([
                {
                    $match: {
                        status: { $in: ['delivered', 'shipped'] },
                        orderDate: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$totals.total' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Ventas del año
            Order.aggregate([
                {
                    $match: {
                        status: { $in: ['delivered', 'shipped'] },
                        orderDate: { $gte: startOfYear }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),

            // Últimas 5 ventas — FIX: populate firstName + lastName
            Order.find({ status: { $in: ['delivered', 'shipped'] } })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'firstName lastName') // ← corregido (no existe campo "name")
                .select('user totals.total createdAt'),

            // Productos con stock bajo
            Product.find({
                status: 'active',
                $expr: { $lte: ['$quantity', '$lowStockAlert'] }
            }).select('name quantity').limit(10),

            // Top 5 productos más vendidos — FIX: se añade la consulta que faltaba
            Order.aggregate([
                { $match: { status: { $in: ['delivered', 'shipped'] } } },
                { $unwind: '$products' },
                {
                    $group: {
                        _id: '$products.product',
                        totalSold: { $sum: '$products.quantity' },
                        revenue:   { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
                        name:      { $first: '$products.name' },
                        image:     { $first: '$products.image' }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 }
            ])
        ]);

        // ─── Mapear ventas recientes ───────────────────────────────────────
        const recentSales = recentSalesRaw.map(o => ({
            // FIX: construir nombre completo desde firstName + lastName
            customerName: o.user
                ? `${o.user.firstName} ${o.user.lastName}`
                : 'Cliente eliminado',
            total:     o.totals.total,
            createdAt: o.createdAt
        }));

        // ─── Mapear top productos ──────────────────────────────────────────
        const topProducts = topProductsAgg.map(p => ({
            id:        p._id,
            name:      p.name,
            totalSold: p.totalSold,
            revenue:   p.revenue,
            image:     p.image || null
        }));

        // ─── Construir respuesta ───────────────────────────────────────────
        const stats = {
            // Tarjetas principales del HTML
            salesToday:     salesTodayAgg[0]?.total  || 0,
            salesMonth:     salesMonthAgg[0]?.total  || 0,
            salesYear:      salesYearAgg[0]?.total   || 0,
            lowStockCount,
            totalCustomers,
            totalProducts,
            pendingOrders,

            // Tablas del HTML
            recentSales,
            lowStockProducts: lowStockProductsList.map(p => ({
                name:     p.name,
                quantity: p.quantity
            })),

            // Secciones extra (por si las usas en otras páginas)
            products: {
                total:    totalProducts,
                lowStock: lowStockCount
            },
            orders: {
                total:     totalOrders,
                pending:   pendingOrders,
                today:     ordersToday,
                thisMonth: salesMonthAgg[0]?.count || 0
            },
            customers: {
                total:  totalCustomers,
                active: activeCustomers
            },
            revenue: {
                total:     totalRevenueAgg[0]?.total || 0,
                thisMonth: salesMonthAgg[0]?.total   || 0,
                formatted: new Intl.NumberFormat('es-CO', {
                    style: 'currency', currency: 'COP', minimumFractionDigits: 0
                }).format(totalRevenueAgg[0]?.total || 0)
            },
            topProducts
        };

        console.log('✅ Estadísticas obtenidas exitosamente');

        res.json({ success: true, data: stats });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del dashboard',
            error: error.message
        });
    }
};


/**
 * Obtener análisis de ventas
 */
exports.getSalesAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, period = 'month' } = req.query;
        
        console.log('📈 Obteniendo análisis de ventas...');
        
        const matchStage = {
            status: { $in: ['delivered', 'shipped'] }
        };
        
        if (startDate || endDate) {
            matchStage.orderDate = {};
            if (startDate) matchStage.orderDate.$gte = new Date(startDate);
            if (endDate) matchStage.orderDate.$lte = new Date(endDate);
        }
        
        // Ventas por período
        let groupBy;
        switch (period) {
            case 'day':
                groupBy = {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' },
                    day: { $dayOfMonth: '$orderDate' }
                };
                break;
            case 'week':
                groupBy = {
                    year: { $year: '$orderDate' },
                    week: { $week: '$orderDate' }
                };
                break;
            case 'year':
                groupBy = { year: { $year: '$orderDate' } };
                break;
            default: // month
                groupBy = {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' }
                };
        }
        
        const salesByPeriod = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: groupBy,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totals.total' },
                    averageOrderValue: { $avg: '$totals.total' },
                    totalItems: { $sum: '$totalItems' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        // Ventas por categoría
        const salesByCategory = await Order.aggregate([
            { $match: matchStage },
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id: '$productInfo.category',
                    totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
                    totalQuantity: { $sum: '$products.quantity' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        
        // Métodos de pago más usados
        const paymentMethods = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totals.total' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                salesByPeriod,
                salesByCategory,
                paymentMethods
            }
        });
        
    } catch (error) {
        console.error('❌ Error en análisis de ventas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de ventas',
            error: error.message
        });
    }
};

/**
 * Obtener análisis de clientes
 */
exports.getCustomerAnalytics = async (req, res) => {
    try {
        console.log('👥 Obteniendo análisis de clientes...');
        
        // Distribución de clientes por nivel
        const customersByLevel = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $bucket: {
                    groupBy: '$totalSpent',
                    boundaries: [0, 500000, 2000000, 5000000, Infinity],
                    default: 'Sin compras',
                    output: {
                        count: { $sum: 1 },
                        customers: { $push: { email: '$email', totalSpent: '$totalSpent' } }
                    }
                }
            }
        ]);
        
        // Top clientes
        const topCustomers = await User.find({ role: 'customer' })
            .sort({ totalSpent: -1 })
            .limit(10)
            .select('firstName lastName email totalSpent totalOrders customerLevel');
        
        // Nuevos clientes por mes
        const newCustomersByMonth = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);
        
        res.json({
            success: true,
            data: {
                customersByLevel,
                topCustomers,
                newCustomersByMonth
            }
        });
        
    } catch (error) {
        console.error('❌ Error en análisis de clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de clientes',
            error: error.message
        });
    }
};

/**
 * Obtener análisis de productos
 */
exports.getProductAnalytics = async (req, res) => {
    try {
        console.log('📱 Obteniendo análisis de productos...');
        
        // Productos más vendidos
        const bestSellers = await Order.aggregate([
            { $match: { status: { $in: ['delivered', 'shipped'] } } },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.product',
                    totalQuantity: { $sum: '$products.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' }
        ]);
        
        // Productos con bajo stock
        const lowStockProducts = await Product.find({
            status: 'active',
            $expr: { $lte: ['$quantity', '$lowStockAlert'] }
        }).limit(20);
        
        // Productos sin ventas
        const productsWithoutSales = await Product.find({
            status: 'active',
            salesCount: 0
        }).limit(20);
        
        res.json({
            success: true,
            data: {
                bestSellers: bestSellers.map(p => ({
                    id: p._id,
                    name: p.productInfo.name,
                    category: p.productInfo.category,
                    totalSold: p.totalQuantity,
                    revenue: p.totalRevenue,
                    orders: p.orderCount,
                    image: p.productInfo.mainImage
                })),
                lowStockProducts,
                productsWithoutSales
            }
        });
        
    } catch (error) {
        console.error('❌ Error en análisis de productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de productos',
            error: error.message
        });
    }
};

// =============================================
// GESTIÓN DE PRODUCTOS
// =============================================

/**
 * Obtener todos los productos con filtros
 */
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            status, 
            search,
            sort = '-createdAt'
        } = req.query;
        
        const query = {};
        
        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        
        const products = await Product.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        const total = await Product.countDocuments(query);
        
        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

/**
 * Crear nuevo producto
 */
exports.createProduct = async (req, res) => {
    try {
        console.log('📱 Creando nuevo producto...');
        
        const product = await Product.create(req.body);
        
        console.log(`✅ Producto creado: ${product.name}`);
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product
        });
        
    } catch (error) {
        console.error('❌ Error creando producto:', error);
        res.status(400).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

/**
 * Actualizar producto
 */
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        console.log(`✅ Producto actualizado: ${product.name}`);
        
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: product
        });
        
    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        res.status(400).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

/**
 * Eliminar producto
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        console.log(`🗑️ Producto eliminado: ${product.name}`);
        
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
};

/**
 * Marcar producto como destacado
 */
exports.toggleProductFeatured = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        product.featured = !product.featured;
        await product.save();
        
        res.json({
            success: true,
            message: `Producto ${product.featured ? 'marcado' : 'desmarcado'} como destacado`,
            data: { featured: product.featured }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando producto destacado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

// =============================================
// GESTIÓN DE PEDIDOS
// =============================================

/**
 * Obtener todos los pedidos con filtros
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            search,
            startDate,
            endDate,
            sort = '-createdAt'
        } = req.query;
        
        const query = {};
        
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'shippingAddress.email': { $regex: search, $options: 'i' } }
            ];
        }
        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) query.orderDate.$lte = new Date(endDate);
        }
        
        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email')
            .populate('products.product', 'name mainImage')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos',
            error: error.message
        });
    }
};

/**
 * Obtener detalles de un pedido
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'firstName lastName email phone')
            .populate('products.product', 'name price brand mainImage category');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo detalles del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles del pedido',
            error: error.message
        });
    }
};

/**
 * Actualizar estado del pedido
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        
        await order.changeStatus(status, note, req.user._id);
        
        console.log(`✅ Estado del pedido ${order.orderNumber} actualizado a: ${status}`);
        
        res.json({
            success: true,
            message: 'Estado del pedido actualizado exitosamente',
            data: order
        });
        
    } catch (error) {
        console.error('❌ Error actualizando estado:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al actualizar estado del pedido'
        });
    }
};

/**
 * Agregar número de seguimiento
 */
exports.addTrackingNumber = async (req, res) => {
    try {
        const { trackingNumber, carrier } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                trackingNumber,
                shippingCarrier: carrier
            },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        
        console.log(`📦 Número de seguimiento agregado: ${trackingNumber}`);
        
        res.json({
            success: true,
            message: 'Número de seguimiento agregado exitosamente',
            data: order
        });
        
    } catch (error) {
        console.error('❌ Error agregando número de seguimiento:', error);
        res.status(400).json({
            success: false,
            message: 'Error al agregar número de seguimiento',
            error: error.message
        });
    }
};

/**
 * Obtener pedidos pendientes antiguos
 */
exports.getOldPendingOrders = async (req, res) => {
    try {
        const { days = 2 } = req.query;
        
        const orders = await Order.getPendingOrders(parseInt(days));
        
        res.json({
            success: true,
            data: orders,
            count: orders.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo pedidos pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos pendientes',
            error: error.message
        });
    }
};

// =============================================
// GESTIÓN DE CLIENTES
// =============================================

/**
 * Obtener todos los clientes
 */
exports.getAllCustomers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            level,
            search,
            sort = '-createdAt'
        } = req.query;
        
        const query = { role: 'customer' };
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        let customers = await User.find(query)
            .select('-password')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        
        // Filtrar por nivel si se especifica
        if (level) {
            customers = customers.filter(c => c.customerLevel === level);
        }
        
        const total = await User.countDocuments(query);
        
        res.json({
            success: true,
            data: customers,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes',
            error: error.message
        });
    }
};

/**
 * Obtener detalles de un cliente
 */
exports.getCustomerDetails = async (req, res) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');
        
        if (!customer || customer.role !== 'customer') {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: customer
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cliente',
            error: error.message
        });
    }
};

/**
 * Obtener historial de pedidos de un cliente
 */
exports.getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.findByUser(req.params.id, { populate: true });
        
        res.json({
            success: true,
            data: orders,
            count: orders.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de pedidos',
            error: error.message
        });
    }
};

/**
 * Actualizar estado de cuenta del cliente
 */
exports.updateCustomerStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const customer = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        console.log(`✅ Estado del cliente ${customer.email}: ${isActive ? 'Activo' : 'Inactivo'}`);
        
        res.json({
            success: true,
            message: `Cliente ${isActive ? 'activado' : 'desactivado'} exitosamente`,
            data: customer
        });
        
    } catch (error) {
        console.error('❌ Error actualizando estado del cliente:', error);
        res.status(400).json({
            success: false,
            message: 'Error al actualizar estado del cliente',
            error: error.message
        });
    }
};

// =============================================
// MARKETING Y PROMOCIONES
// =============================================

/**
 * Enviar campaña de email marketing
 */
exports.sendEmailCampaign = async (req, res) => {
    try {
        const { subject, message, targetAudience } = req.body;
        
        // Obtener lista de destinatarios según el público objetivo
        let query = { role: 'customer', isActive: true };
        
        if (targetAudience === 'vip') {
            query.totalSpent = { $gte: 2000000 };
        } else if (targetAudience === 'inactive') {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            query.lastLogin = { $lt: threeMonthsAgo };
        }
        
        const recipients = await User.find(query).select('email firstName');
        
        // TODO: Integrar con servicio de email (Nodemailer, SendGrid, etc.)
        console.log(`📧 Enviando campaña a ${recipients.length} destinatarios...`);
        
        res.json({
            success: true,
            message: `Campaña programada para ${recipients.length} destinatarios`,
            data: {
                subject,
                recipientCount: recipients.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error enviando campaña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar campaña de email',
            error: error.message
        });
    }
};

/**
 * Obtener historial de campañas
 */
exports.getCampaigns = async (req, res) => {
    try {
        // TODO: Implementar modelo de Campañas
        res.json({
            success: true,
            data: [],
            message: 'Funcionalidad en desarrollo'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo campañas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener campañas',
            error: error.message
        });
    }
};

/**
 * Marcar producto como estacional
 */
exports.markAsSeasonalProduct = async (req, res) => {
    try {
        const { isSeasonal, season } = req.body;
        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { 
                tags: isSeasonal 
                    ? [...new Set([...(product.tags || []), 'estacional', season])]
                    : (product.tags || []).filter(t => !['estacional', season].includes(t))
            },
            { new: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: `Producto ${isSeasonal ? 'marcado' : 'desmarcado'} como estacional`,
            data: product
        });
        
    } catch (error) {
        console.error('❌ Error marcando producto estacional:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar producto como estacional',
            error: error.message
        });
    }
};

// =============================================
// REPORTES
// =============================================

/**
 * Generar reporte de ventas
 */
exports.generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        
        const stats = await Order.getSalesStats(startDate, endDate);
        const topProducts = await Order.getTopProducts(10);
        
        const report = {
            period: { startDate, endDate },
            summary: stats[0] || {},
            topProducts
        };
        
        if (format === 'json') {
            res.json({
                success: true,
                data: report
            });
        } else {
            // TODO: Implementar exportación a CSV/PDF
            res.json({
                success: true,
                message: 'Exportación en desarrollo',
                data: report
            });
        }
        
    } catch (error) {
        console.error('❌ Error generando reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ventas',
            error: error.message
        });
    }
};

/**
 * Generar reporte de clientes
 */
exports.generateCustomerReport = async (req, res) => {
    try {
        const stats = await User.getUserStats();
        const topCustomers = await User.getUsersByLevel('gold');
        
        res.json({
            success: true,
            data: {
                summary: stats[0] || {},
                topCustomers: topCustomers.slice(0, 20)
            }
        });
        
    } catch (error) {
        console.error('❌ Error generando reporte de clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de clientes',
            error: error.message
        });
    }
};

// =============================================
// CUPONES Y DESCUENTOS
// ============================================= 

/**
 * Eliminar cupón
 */
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Cupón no encontrado' });
        }
        res.json({ success: true, message: 'Cupón eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar cupón' });
    }
};

console.log('✅ Controlador de administrador configurado');
console.log('🎮 Funciones disponibles:');
console.log('   📊 Dashboard y estadísticas');
console.log('   📱 CRUD de productos');
console.log('   🛒 Gestión de pedidos');
console.log('   👥 Gestión de clientes');
console.log('   📧 Marketing');
console.log('   📈 Reportes');