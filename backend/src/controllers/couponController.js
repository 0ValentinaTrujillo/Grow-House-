// =============================================
// CONTROLADOR CUPONES - GROW HOUSE
// =============================================

const Coupon = require('../models/Coupon');


// =============================================
// CRUD DE CUPONES
// =============================================

/**
 * Obtener todos los cupones
 */
// Ejemplo de paginación en controlador

exports.getAllCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, sort = '-createdAt' } = req.query;

        const query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Coupon.countDocuments(query);

        const coupons = await Coupon.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            data: coupons,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener cupones' });
    }
};


/**
 * Obtener detalles de un cupón
 */
exports.getCouponDetails = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email')
            .populate('usedBy.user', 'firstName lastName email');
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: coupon
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo cupón:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cupón',
            error: error.message
        });
    }
};

/**
 * Crear nuevo cupón
 */
exports.createCoupon = async (req, res) => {
    try {
        console.log('🎟️ Creando nuevo cupón...');

        const start = new Date(req.body.startDate);
        const expiry = new Date(req.body.expiryDate);

        if (expiry <= start) {
            return res.status(400).json({
                success: false,
                message: "La fecha de expiración debe ser posterior a la fecha de inicio"
            });
        }

        req.body.createdBy = req.user._id;

        const coupon = await Coupon.create(req.body);

        console.log(`✅ Cupón creado: ${coupon.code}`);

        res.status(201).json({
            success: true,
            message: 'Cupón creado exitosamente',
            data: coupon
        });

    } catch (error) {
        console.error('❌ Error creando cupón:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un cupón con ese código'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Error al crear cupón',
            error: error.message
        });
    }
};

/**
 * Actualizar cupón
 */
exports.updateCoupon = async (req, res) => {
    try {

        const updateData = {};

        if (req.body.code) updateData.code = req.body.code;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.discountType) updateData.discountType = req.body.discountType;
        if (req.body.discountValue !== undefined) updateData.discountValue = req.body.discountValue;
        if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
        if (req.body.expiryDate) updateData.expiryDate = new Date(req.body.expiryDate);
        if (req.body.usageLimit !== undefined) updateData.usageLimit = req.body.usageLimit;
        if (req.body.applicableCategories !== undefined) {
            updateData.applicableCategories = req.body.applicableCategories;
        }

        // 🔥 Validación segura
        if (updateData.startDate && updateData.expiryDate) {
            if (updateData.expiryDate <= updateData.startDate) {
                return res.status(400).json({
                    success: false,
                    message: "La fecha de expiración debe ser posterior a la fecha de inicio"
                });
            }
        }

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
        }

        console.log(`✅ Cupón actualizado: ${coupon.code}`);

        res.json({
            success: true,
            message: 'Cupón actualizado exitosamente',
            data: coupon
        });

    } catch (error) {
        console.error('❌ Error actualizando cupón:', error);

        res.status(400).json({
            success: false,
            message: 'Error al actualizar cupón',
            error: error.message
        });
    }
};


// =============================================
// VALIDACIÓN Y USO DE CUPONES
// =============================================

/**
 * Validar cupón (para uso en checkout)
 */
exports.validateCoupon = async (req, res) => {
    try {
        const { code, userId, orderValue } = req.body;
        
        console.log(`🔍 Validando cupón: ${code}`);
        
        // Buscar cupón
        const coupon = await Coupon.findByCode(code);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado o inactivo'
            });
        }
        
        // Verificar si puede ser usado por el usuario
        const validation = coupon.canBeUsedBy(userId, orderValue);
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }
        
        // Calcular descuento
        const discount = coupon.calculateDiscount(orderValue);
        
        console.log(`✅ Cupón válido - Descuento: $${discount.toLocaleString('es-CO')}`);
        
        res.json({
            success: true,
            message: 'Cupón válido',
            data: {
                code: coupon.code,
                discount,
                discountType: coupon.discountType,
                description: coupon.description
            }
        });
        
    } catch (error) {
        console.error('❌ Error validando cupón:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar cupón',
            error: error.message
        });
    }
};

/**
 * Aplicar cupón a un pedido
 */
exports.applyCoupon = async (req, res) => {
    try {
        const { couponId, userId, orderValue, orderId } = req.body;
        
        const coupon = await Coupon.findById(couponId);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
        }
        
        // Validar
        const validation = coupon.canBeUsedBy(userId, orderValue);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }
        
        // Calcular y registrar uso
        const discount = coupon.calculateDiscount(orderValue);
        await coupon.recordUsage(userId, orderValue, discount);
        
        console.log(`✅ Cupón aplicado: ${coupon.code} - $${discount.toLocaleString('es-CO')}`);
        
        res.json({
            success: true,
            message: 'Cupón aplicado exitosamente',
            data: {
                code: coupon.code,
                discount,
                orderValue: orderValue - discount
            }
        });
        
    } catch (error) {
        console.error('❌ Error aplicando cupón:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al aplicar cupón'
        });
    }
};

// =============================================
// ESTADÍSTICAS Y REPORTES
// =============================================

/**
 * Obtener estadísticas de cupones
 */
exports.getCouponStats = async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas de cupones...');
        
        const stats = await Coupon.getCouponStats();
        
        // Cupones más usados
        const topCoupons = await Coupon.find()
            .sort({ usageCount: -1 })
            .limit(10)
            .select('code description usageCount totalDiscount discountType discountValue');
        
        // Cupones próximos a vencer
        const expiringCoupons = await Coupon.getExpiringCoupons(7);
        
        res.json({
            success: true,
            data: {
                summary: stats[0] || {},
                topCoupons,
                expiringCoupons
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de cupones',
            error: error.message
        });
    }
};

/**
 * Obtener historial de uso de un cupón
 */
exports.getCouponUsageHistory = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('usedBy.user', 'firstName lastName email');
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: {
                code: coupon.code,
                totalUsage: coupon.usageCount,
                totalDiscount: coupon.totalDiscount,
                history: coupon.usedBy.sort((a, b) => b.usedAt - a.usedAt)
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de uso',
            error: error.message
        });
    }
};

/**
 * Generar cupón automáticamente
 */
exports.generateCouponCode = async (req, res) => {
    try {
        // Generar código aleatorio único
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        let exists = true;
        
        while (exists) {
            code = '';
            for (let i = 0; i < 8; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            
            // Verificar si existe
            const coupon = await Coupon.findOne({ code });
            exists = !!coupon;
        }
        
        res.json({
            success: true,
            data: { code }
        });
        
    } catch (error) {
        console.error('❌ Error generando código:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar código de cupón',
            error: error.message
        });
    }
};

/**
 * Eliminar cupón
 */
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cupón eliminado correctamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando cupón:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cupón'
        });
    }
};

/**
 * Activar / Desactivar cupón
 */
exports.toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Cupón no encontrado'
            });
        }

        coupon.status = coupon.status === 'active' ? 'inactive' : 'active';

        await coupon.save();

        res.json({
            success: true,
            message: `Cupón ${coupon.status === 'active' ? 'activado' : 'desactivado'}`,
            data: coupon
        });

    } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado'
        });
    }
};

/**
 * Obtener cupones activos para mostrar a usuarios logueados
 */
exports.getPublicCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            status: 'active',
            startDate: { $lte: now },
            expiryDate: { $gt: now }
        })
        .select('code description discountType discountValue expiryDate minOrderValue')
        .sort('-createdAt')
        .limit(10);

        res.json({ success: true, data: coupons });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener cupones' });
    }
};


