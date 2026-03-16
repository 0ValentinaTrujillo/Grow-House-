// =============================================
// CONTROLADOR ADMINISTRADOR - GROW HOUSE
// =============================================

const Product = require('../models/product');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Campaign = require('../models/Campaign');
const nodemailer = require('nodemailer');


const createTransporter = async () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

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

        // ─── BLOQUE 1: Métodos de pago inmediato ──────────────────────────
        // Tarjeta y PayPal = dinero recibido al instante.
        // Transferencia bancaria NO se incluye porque requiere confirmación manual.
        const PAID_METHODS = ['credit_card', 'paypal', 'cash_on_delivery', 'debit_card', 'nequi', 'bank_transfer', 'pse'];

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

            // ─── BLOQUE 2: Ingresos totales históricos ────────────────────
            // CAMBIO: filtra por paymentMethod en lugar de status.
            // Así cuenta el dinero real recibido (pagos digitales confirmados),
            // sin importar si el pedido fue entregado o no.
            Order.aggregate([
                { $match: { paymentMethod: { $in: PAID_METHODS } } },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),

            // Pedidos creados hoy (todos los estados) — sin cambios
            Order.countDocuments({ createdAt: { $gte: startOfDay } }),

            // ─── BLOQUE 3: Ventas del día ─────────────────────────────────
            // CAMBIO: antes filtraba por status delivered/shipped + orderDate.
            // Ahora filtra por paymentMethod (pagos digitales) + orderDate.
            // Lógica: si el cliente pagó con tarjeta/PayPal hoy, es venta de hoy.
            // La entrega es logística, no determina cuándo entró el dinero.
            Order.aggregate([
                {
                    $match: {
                        paymentMethod: { $in: PAID_METHODS },
                        orderDate: { $gte: startOfDay }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),

            // ─── BLOQUE 4: Ventas del mes ─────────────────────────────────
            // CAMBIO: mismo criterio que ventas del día.
            // Filtra por paymentMethod + orderDate del mes actual.
            Order.aggregate([
                {
                    $match: {
                        paymentMethod: { $in: PAID_METHODS },
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

            // ─── BLOQUE 5: Ventas del año ─────────────────────────────────
            // CAMBIO: mismo criterio. Filtra por paymentMethod + orderDate del año.
            Order.aggregate([
                {
                    $match: {
                        paymentMethod: { $in: PAID_METHODS },
                        orderDate: { $gte: startOfYear }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),

            // ─── BLOQUE 6: Últimas 5 ventas recientes ────────────────────
            // CAMBIO: filtra por paymentMethod en lugar de status.
            // Muestra las últimas compras pagadas digitalmente.
            Order.find({ paymentMethod: { $in: PAID_METHODS } })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('user totals.total createdAt shippingAddress')
                .populate('user', 'firstName lastName'),

            // Productos con stock bajo — sin cambios
            Product.find({
                status: 'active',
                $expr: { $lte: ['$quantity', '$lowStockAlert'] }
            }).select('name quantity').limit(10),

            // Top 5 productos más vendidos — sin cambios
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
            customerName: o.shippingAddress?.firstName
                ? `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`
                : o.user
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

            // Secciones extra
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
            default:
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
        
        const topCustomers = await User.find({ role: 'customer' })
            .sort({ totalSpent: -1 })
            .limit(10)
            .select('firstName lastName email totalSpent totalOrders customerLevel');
        
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
        
        const lowStockProducts = await Product.find({
            status: 'active',
            $expr: { $lte: ['$quantity', '$lowStockAlert'] }
        }).limit(20);
        
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

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

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

exports.getAllCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 20, level, search, sort = '-createdAt' } = req.query;

        const query = { role: 'customer' };

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
                { email:     { $regex: search, $options: 'i' } }
            ];
        }

        // ✅ NUEVO: filtrar por nivel directamente en MongoDB
        if (level) {
            const spentRanges = {
                bronze:   { $gte: 0,       $lt: 500000   },
                silver:   { $gte: 500000,  $lt: 2000000  },
                gold:     { $gte: 2000000, $lt: 5000000  },
                platinum: { $gte: 5000000              }
            };
            if (spentRanges[level]) {
                query.totalSpent = spentRanges[level];
            }
        }

        const [customers, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit),
            User.countDocuments(query)
        ]);

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
        res.status(500).json({ success: false, message: 'Error al obtener clientes', error: error.message });
    }
};

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

exports.sendEmailCampaign = async (req, res) => {
    try {
        const { subject, message, targetAudience, type } = req.body;

        let query = { role: 'customer', isActive: true };

        if (targetAudience === 'vip') {
            query.totalSpent = { $gte: 2000000 };
        } else if (targetAudience === 'inactive') {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            query.lastLogin = { $lt: threeMonthsAgo };
        }

        const recipients = await User.find(query).select('email firstName');

        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay destinatarios para esta audiencia'
            });
        }

        console.log(`📧 Enviando a ${recipients.length} destinatarios...`);

        const transporter = await createTransporter();

        const htmlTemplate = (firstName, body) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
            .container {
              max-width: 600px; margin: 30px auto; background: #fff;
              border-radius: 12px; overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #03651f, #057a2b);
              padding: 30px 40px; text-align: center;
              border-radius: 12px 12px 0 0;
            }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .header p  { color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 14px; }
            .body { padding: 36px 40px; color: #333; }
            .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
            .message  { font-size: 14px; line-height: 1.7; white-space: pre-wrap; color: #555; }
            .divider  { border: none; border-top: 1px solid #eee; margin: 28px 0; }
            .btn-wrap { text-align: center; margin-top: 8px; }
            .btn {
              display: inline-block;
              background-color: #1a6b2a !important;
              color: #ffffff !important;
              padding: 12px 28px;
              border-radius: 8px;
              text-decoration: none !important;
              font-weight: 600;
              font-size: 14px;
              border: none;
              -webkit-text-fill-color: #ffffff !important;
              mso-padding-alt: 0;
            }
            .footer {
              background: #f9f9f9;
              padding: 20px 40px;
              text-align: center;
              font-size: 12px;
              color: #aaa;
              border-radius: 0 0 12px 12px;
            }
            .footer a { color: #1a6b2a; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Grow House</h1>
              <p>Tu tienda de plantas y jardinería</p>
            </div>
            <div class="body">
              <div class="greeting">Hola, ${firstName} 👋</div>
              <div class="message">${body}</div>
              <hr class="divider">
              <div class="btn-wrap">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="http://localhost:3000"
                  style="height:40px;v-text-anchor:middle;width:160px;" arcsize="20%"
                  fillcolor="#1a6b2a" strokecolor="#1a6b2a">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:Arial;font-size:14px;font-weight:bold;">
                    Visitar la tienda
                  </center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="http://localhost:3000" class="btn"
                   style="background-color:#1a6b2a !important; color:#ffffff !important; text-decoration:none !important; display:inline-block; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px;">
                  Visitar la tienda
                </a>
                <!--<![endif]-->
              </div>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Grow House · Todos los derechos reservados
            </div>
          </div>
        </body>
        </html>`;

        const results = await Promise.all(
            recipients.map(r =>
                transporter.sendMail({
                    from: `"Grow House" <${process.env.GMAIL_FROM}>`,
                    to: r.email,
                    subject,
                    html: htmlTemplate(r.firstName || 'Cliente', message)
                }).catch(err => {
                    console.error(`❌ Fallo enviando a ${r.email}:`, err.message);
                    return null;
                })
            )
        );

        const sent   = results.filter(r => r !== null).length;
        const failed = results.filter(r => r === null).length;

        console.log(`✅ Enviados: ${sent} | ❌ Fallidos: ${failed}`);

        const campaign = await Campaign.create({
            subject,
            message,
            type: type || 'general',
            targetAudience: targetAudience || 'all',
            recipientCount: sent,
            sentBy: req.user._id
        });

        res.json({
            success: true,
            message: `Campaña enviada a ${sent} destinatario${sent !== 1 ? 's' : ''}${failed > 0 ? ` (${failed} fallidos)` : ''}`,
            data: { campaign, recipientCount: sent, failedCount: failed }
        });

    } catch (error) {
        console.error('❌ Error enviando campaña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar campaña',
            error: error.message
        });
    }
};

exports.getCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('sentBy', 'firstName lastName');

        res.json({
            success: true,
            data: campaigns
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
exports.getPublicCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('subject message type createdAt');

        res.json({ success: true, data: campaigns });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    await Campaign.findByIdAndDelete(id);
    res.json({ success: true, message: 'Campaña eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsSeasonalProduct = async (req, res) => {
    try {
        const { isSeasonal, season } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        product.tags = isSeasonal
            ? [...new Set([...(product.tags || []), 'estacional', season])]
            : (product.tags || []).filter(t => !['estacional', season].includes(t));

        await product.save();
        
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

// =============================================
// CREAR ORDEN DE VENTA FÍSICA
// =============================================
exports.createPhysicalOrder = async (req, res) => {
    try {
        const { customer, products, totals, paymentMethod, orderDate, notes } = req.body;

        // Buscar si el cliente ya existe por email
        let user = null;
        if (customer.email) {
            user = await User.findOne({ email: customer.email, role: 'customer' });
        }

        // Si no existe, usar el admin que está haciendo la venta
        if (!user) {
            user = { _id: req.user._id };
        }

        console.log('Productos recibidos:', JSON.stringify(products, null, 2));

        // Crear la orden
        const order = await Order.create({
            isPhysicalSale: true, 
            user:          user._id,
            products:      products.map(p => ({
                product:  p.product,
                name:     p.name,
                quantity: p.quantity,
                price:    p.price,
                image:    p.image 
            })),
            totals,
            paymentMethod,
            paymentStatus:  'paid',
            shippingMethod: 'pickup',
            status:         'delivered',
            orderDate:      orderDate || new Date(),
            shippingAddress: {
                firstName: customer.firstName,
                lastName:  customer.lastName,
                street:    customer.address || 'Tienda física',
                city:      'Pital',
                state:     'Huila',
                country:   'Colombia',
                phone:     customer.phone  || '0000000000',
                email:     customer.email  || 'ventafisica@growhouse.com'
            },
            notes: {
                internalNotes: `Venta física - ${customer.firstName} ${customer.lastName}${notes?.internalNotes ? ' | ' + notes.internalNotes : ''}`
            }
        });

        console.log(`✅ Venta física registrada: ${order.orderNumber}`);

        res.status(201).json({
            success: true,
            message: 'Venta física registrada exitosamente',
            data:    order
        });

    } catch (error) {
        console.error('❌ Error registrando venta física:', error);
        res.status(400).json({
            success: false,
            message: 'Error al registrar la venta física',
            error:   error.message
        });
    }
};

