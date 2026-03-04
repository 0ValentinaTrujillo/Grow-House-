// =============================================
// MODELO CUPÓN - GROW HOUSE ECOMMERCE
// =============================================

const mongoose = require('mongoose');

console.log('🎟️ Iniciando creación del modelo Coupon...');

// =============================================
// ESQUEMA DEL CUPÓN
// =============================================

const couponSchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN BÁSICA
    // =============================================
    
    code: {
        type: String,
        required: [true, 'El código del cupón es obligatorio'],
        unique: true,
        uppercase: true,
        trim: true,
        minlength: [3, 'El código debe tener al menos 3 caracteres'],
        maxlength: [20, 'El código no puede tener más de 20 caracteres'],
        index: true,
        validate: {
            validator: function(code) {
                // Solo alfanuméricos y guiones
                return /^[A-Z0-9-]+$/.test(code);
            },
            message: 'El código solo puede contener letras mayúsculas, números y guiones'
        }
    },
    
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        maxlength: [200, 'La descripción no puede tener más de 200 caracteres']
    },
    
    // =============================================
    // TIPO Y VALOR DEL DESCUENTO
    // =============================================
    
    discountType: {
        type: String,
        required: [true, 'El tipo de descuento es obligatorio'],
        enum: {
            values: ['percentage', 'fixed'],
            message: '{VALUE} no es un tipo de descuento válido'
        }
    },
    
    discountValue: {
        type: Number,
        required: [true, 'El valor del descuento es obligatorio'],
        min: [0, 'El valor del descuento no puede ser negativo'],
        validate: {
            validator: function(value) {
                // Si es porcentaje, máximo 100%
                if (this.discountType === 'percentage' && value > 100) {
                    return false;
                }
                // Si es fijo, validar que sea entero
                if (this.discountType === 'fixed' && !Number.isInteger(value)) {
                    return false;
                }
                return true;
            },
            message: 'Valor inválido: porcentaje máximo 100% o monto fijo debe ser entero'
        }
    },
    
    // =============================================
    // LÍMITES Y RESTRICCIONES
    // =============================================
    
    minimumPurchase: {
        type: Number,
        default: 0,
        min: [0, 'El monto mínimo no puede ser negativo']
    },
    
    maximumDiscount: {
        type: Number,
        min: [0, 'El descuento máximo no puede ser negativo'],
        validate: {
            validator: function(value) {
                // Solo aplicable para cupones de porcentaje
                if (this.discountType === 'fixed' && value) {
                    return false;
                }
                return true;
            },
            message: 'El descuento máximo solo aplica para cupones de porcentaje'
        }
    },
    
    usageLimit: {
        type: Number,
        min: [0, 'El límite de uso no puede ser negativo'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value);
            },
            message: 'El límite de uso debe ser un número entero'
        }
    },
    
    usageLimitPerUser: {
        type: Number,
        default: 1,
        min: [1, 'El límite por usuario debe ser al menos 1'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value);
            },
            message: 'El límite por usuario debe ser un número entero'
        }
    },
    
    // =============================================
    // FECHAS DE VALIDEZ
    // =============================================
    
    startDate: {
        type: Date,
        required: [true, 'La fecha de inicio es obligatoria'],
        index: true
    },

    expiryDate: {
        type: Date,
        required: [true, 'La fecha de expiración es obligatoria'],
        index: true
    },
    
    // =============================================
    // APLICABILIDAD
    // =============================================
    
    applicableCategories: [{
        type: String,
        enum: ['plantas', 'materas', 'decoraciones', 'implementos','todas las categorias']
    }],
    
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    
    excludedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    
    // =============================================
    // ESTADO Y ESTADÍSTICAS
    // =============================================
    
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'expired'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },
    
    usageCount: {
        type: Number,
        default: 0,
        min: [0, 'El contador de uso no puede ser negativo']
    },
    
    usedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        usedAt: {
            type: Date,
            default: Date.now
        },
        orderValue: {
            type: Number,
            min: [0, 'El valor del pedido no puede ser negativo']
        }
    }],
    
    totalDiscount: {
        type: Number,
        default: 0,
        min: [0, 'El descuento total no puede ser negativo']
    },
    
    // =============================================
    // METADATOS
    // =============================================
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
    
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// =============================================
// ÍNDICES COMPUESTOS
// =============================================

couponSchema.index({ code: 1, status: 1 });
couponSchema.index({ startDate: 1, expiryDate: 1 });

// =============================================
// CAMPOS VIRTUALES
// =============================================

couponSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.status === 'active' && 
           now >= this.startDate && 
           now <= this.expiryDate &&
           (this.usageLimit ? this.usageCount < this.usageLimit : true);
});

couponSchema.virtual('daysUntilExpiry').get(function() {
    const now = new Date();
    const diffTime = this.expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

couponSchema.virtual('formattedDiscount').get(function() {
    if (this.discountType === 'percentage') {
        return `${this.discountValue}%`;
    }
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(this.discountValue);
});

couponSchema.virtual('usagePercentage').get(function() {
    if (!this.usageLimit) return 0;
    return Math.round((this.usageCount / this.usageLimit) * 100);
});

// =============================================
// MIDDLEWARE
// =============================================

couponSchema.pre('save', function(next) {
    console.log(`💾 Procesando cupón: ${this.code}`);
    
    // Actualizar estado basado en fechas
    const now = new Date();
    if (now > this.expiryDate) {
        this.status = 'expired';
        console.log(`⏰ Cupón expirado: ${this.code}`);
    }
    
    // Verificar límite de uso
    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        this.status = 'inactive';
        console.log(`🚫 Cupón agotado: ${this.code}`);
    }
    
    next();
});

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

couponSchema.methods.canBeUsedBy = function(userId, orderValue) {
    // Verificar si el cupón está activo
    if (!this.isActive) {
        return { valid: false, message: 'Cupón inactivo o expirado' };
    }
    
    // Verificar monto mínimo
    if (orderValue < this.minimumPurchase) {
        return { 
            valid: false, 
            message: `Compra mínima de ${this.minimumPurchase.toLocaleString('es-CO')} requerida` 
        };
    }
    
    // Verificar límite por usuario
    const userUsage = this.usedBy.filter(u => u.user.toString() === userId.toString()).length;
    if (userUsage >= this.usageLimitPerUser) {
        return { 
            valid: false, 
            message: `Ya has usado este cupón ${this.usageLimitPerUser} veces` 
        };
    }
    
    return { valid: true, message: 'Cupón válido' };
};

couponSchema.methods.calculateDiscount = function(orderValue) {
    let discount = 0;
    
    if (this.discountType === 'percentage') {
        discount = (orderValue * this.discountValue) / 100;
        // Aplicar descuento máximo si existe
        if (this.maximumDiscount && discount > this.maximumDiscount) {
            discount = this.maximumDiscount;
        }
    } else {
        discount = this.discountValue;
    }
    
    // No puede ser mayor al valor del pedido
    if (discount > orderValue) {
        discount = orderValue;
    }
    
    return Math.round(discount);
};

couponSchema.methods.recordUsage = function(userId, orderValue, discountApplied) {
    this.usageCount += 1;
    this.totalDiscount += discountApplied;
    this.usedBy.push({
        user: userId,
        usedAt: new Date(),
        orderValue: orderValue
    });
    
    console.log(`✅ Uso registrado - Cupón: ${this.code}, Usuario: ${userId}`);
    return this.save();
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

couponSchema.statics.getActiveCoupons = function() {
    const now = new Date();
    return this.find({
        status: 'active',
        startDate: { $lte: now },
        expiryDate: { $gte: now }
    }).sort({ createdAt: -1 });
};

couponSchema.statics.findByCode = function(code) {
    return this.findOne({ 
        code: code.toUpperCase(),
        status: 'active'
    });
};

couponSchema.statics.getExpiringCoupons = function(days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.find({
        status: 'active',
        expiryDate: { $gte: now, $lte: futureDate }
    }).sort({ expiryDate: 1 });
};

couponSchema.statics.getCouponStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalCoupons: { $sum: 1 },
                activeCoupons: { 
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
                },
                expiredCoupons: { 
                    $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } 
                },
                totalUsage: { $sum: '$usageCount' },
                totalDiscount: { $sum: '$totalDiscount' },
                averageDiscount: { $avg: '$totalDiscount' }
            }
        }
    ]);
};

// =============================================
// CREAR Y EXPORTAR MODELO
// =============================================

const Coupon = mongoose.model('Coupon', couponSchema);

console.log('✅ Modelo Coupon creado exitosamente');
console.log('📋 Collection en MongoDB: coupons');

module.exports = Coupon;