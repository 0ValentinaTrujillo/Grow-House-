// =============================================
// CONTROLADOR DE VENTAS FÍSICAS - GROW HOUSE
// =============================================

const Sale    = require('../models/Sale');
const Product = require('../models/product');

// ─── Crear venta ─────────────────────────────────────────────────────────────
const createSale = async (req, res) => {
    const session = await Product.startSession();
    session.startTransaction();

    try {
        const { items, client, paymentMethod, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La venta debe tener al menos un producto'
            });
        }

        // ── 1. Verificar stock y construir ítems ────────────────────────────
        const saleItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Producto no encontrado: ${item.productId}`
                });
            }

            if (product.quantity < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para "${product.name}". Disponible: ${product.quantity}, solicitado: ${item.quantity}`
                });
            }

            // Descontar del inventario
            product.quantity -= item.quantity;
            product.salesCount += item.quantity;
            await product.save({ session });

            saleItems.push({
                product:   product._id,
                name:      product.name,
                quantity:  item.quantity,
                unitPrice: product.price,
                subtotal:  item.quantity * product.price
            });
        }

        // ── 2. Crear la venta ───────────────────────────────────────────────
        const sale = new Sale({
            items:         saleItems,
            client:        client || {},
            paymentMethod,
            notes:         notes || null,
            registeredBy:  req.admin._id
        });

        await sale.save({ session });
        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: '¡Venta registrada exitosamente!',
            data: sale
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Error al crear venta:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// ─── Obtener todas las ventas ─────────────────────────────────────────────────
const getAllSales = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            paymentMethod,
            page  = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // Filtro por fecha
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate)   filter.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }

        // Filtro por método de pago
        if (paymentMethod) filter.paymentMethod = paymentMethod;

        const skip  = (page - 1) * limit;
        const total = await Sale.countDocuments(filter);

        const sales = await Sale.find(filter)
            .populate('items.product', 'name mainImage category')
            .populate('registeredBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        return res.status(200).json({
            success: true,
            data: {
                sales,
                pagination: {
                    total,
                    page:       Number(page),
                    limit:      Number(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener ventas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ─── Obtener venta por ID ─────────────────────────────────────────────────────
const getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('items.product', 'name mainImage category price')
            .populate('registeredBy', 'name');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        return res.status(200).json({ success: true, data: sale });

    } catch (error) {
        console.error('❌ Error al obtener venta:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ─── Estadísticas para el dashboard ──────────────────────────────────────────
const getSalesStats = async (req, res) => {
    try {
        const now   = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo  = new Date(today); weekAgo.setDate(today.getDate() - 7);
        const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);

        // ── Totales por período ─────────────────────────────────────────────
        const [todayStats, weekStats, monthStats] = await Promise.all([
            Sale.aggregate([
                { $match: { createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ]),
            Sale.aggregate([
                { $match: { createdAt: { $gte: weekAgo } } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ]),
            Sale.aggregate([
                { $match: { createdAt: { $gte: monthAgo } } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
            ])
        ]);

        // ── Ventas por día (últimos 30 días) para gráfica ──────────────────
        const salesByDay = await Sale.aggregate([
            { $match: { createdAt: { $gte: monthAgo } } },
            {
                $group: {
                    _id: {
                        year:  { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day:   { $dayOfMonth: '$createdAt' }
                    },
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // ── Productos más vendidos ──────────────────────────────────────────
        const topProducts = await Sale.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id:      '$items.product',
                    name:     { $first: '$items.name' },
                    quantity: { $sum: '$items.quantity' },
                    revenue:  { $sum: '$items.subtotal' }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 5 }
        ]);

        // ── Ventas por método de pago ───────────────────────────────────────
        const byPaymentMethod = await Sale.aggregate([
            { $match: { createdAt: { $gte: monthAgo } } },
            {
                $group: {
                    _id:   '$paymentMethod',
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    today: {
                        total: todayStats[0]?.total || 0,
                        count: todayStats[0]?.count || 0
                    },
                    week: {
                        total: weekStats[0]?.total || 0,
                        count: weekStats[0]?.count || 0
                    },
                    month: {
                        total: monthStats[0]?.total || 0,
                        count: monthStats[0]?.count || 0
                    }
                },
                salesByDay,
                topProducts,
                byPaymentMethod
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ─── Eliminar venta (y restaurar inventario) ──────────────────────────────────
const deleteSale = async (req, res) => {
    const session = await Sale.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id).session(session);

        if (!sale) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'Venta no encontrada'
            });
        }

        // Restaurar inventario
        for (const item of sale.items) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        quantity:   item.quantity,
                        salesCount: -item.quantity
                    }
                },
                { session }
            );
        }

        await Sale.findByIdAndDelete(req.params.id, { session });
        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: 'Venta eliminada y stock restaurado correctamente'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Error al eliminar venta:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
    createSale,
    getAllSales,
    getSaleById,
    getSalesStats,
    deleteSale
};