// =============================================
// MODELO ORDER - GROW HOUSE ECOMMERCE
// =============================================

// Importar librerías necesarias
const mongoose = require('mongoose');

console.log('📦 Iniciando creación del modelo Order con relaciones avanzadas...');
// =============================================
// ESQUEMA DEL PEDIDO
// =============================================

const orderSchema = new mongoose.Schema({
    
    // =============================================
    // IDENTIFICACIÓN Y RELACIÓN CON USUARIO
    // =============================================
    
    orderNumber: {
        type: String,
        unique: true,
        index: true
        // Se generará automáticamente en el middleware
    },
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El pedido debe estar asociado a un usuario'],
        index: true
    },
    
    // =============================================
    // PRODUCTOS DEL PEDIDO
    // =============================================
    
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'El producto es obligatorio']
        },
        
        quantity: {
            type: Number,
            required: [true, 'La cantidad es obligatoria'],
            min: [1, 'La cantidad debe ser al menos 1'],
            max: [100, 'No se pueden pedir más de 100 unidades del mismo producto'],
            validate: {
                validator: function(value) {
                    return Number.isInteger(value);
                },
                message: 'La cantidad debe ser un número entero'
            }
        },
        
        price: {
            type: Number,
            required: [true, 'El precio al momento de la compra es obligatorio'],
            min: [0, 'El precio no puede ser negativo']
            // Este precio se guarda para mantener el historial
            // aunque el precio del producto cambie después
        },
        
        name: {
            type: String,
            required: [true, 'El nombre del producto al momento de la compra es obligatorio']
            // Guardamos el nombre para el historial
        },
        
        image: {
            type: String
            // Imagen principal del producto al momento de la compra
        }
    }],

// =============================================
    // CÁLCULOS FINANCIEROS
    // =============================================
    
    totals: {
        subtotal: {
            type: Number,
            min: [0, 'El subtotal no puede ser negativo'],
            default: 0
        },
        
        tax: {
            type: Number,
            min: [0, 'Los impuestos no pueden ser negativos'],
            default: 0
        },
        
        taxRate: {
            type: Number,
            min: [0, 'La tasa de impuestos no puede ser negativa'],
            max: [1, 'La tasa de impuestos no puede ser mayor a 100%'],
            default: 0.19 // 19% IVA Colombia
        },
        
        shipping: {
            type: Number,
            min: [0, 'El costo de envío no puede ser negativo'],
            default: 0
        },
        
        discount: {
            type: Number,
            min: [0, 'El descuento no puede ser negativo'],
            default: 0
        },
        
        total: {
            type: Number,
            min: [0, 'El total no puede ser negativo'],
            default: 0  // ✅ CAMBIAR: agregar default y quitar required
            // required: [true, 'El total es obligatorio'] // ❌ COMENTAR ESTA LÍNEA
}
    },
     // =============================================
    // ESTADOS Y SEGUIMIENTO
    // =============================================
    
    status: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            message: '{VALUE} no es un estado válido de pedido'
        },
        default: 'pending',
        index: true
    },
    
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'], 
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        note: {
            type: String,
            maxlength: [500, 'La nota no puede tener más de 500 caracteres']
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
            // Usuario que cambió el estado (admin/sistema)
        }
    }],
    
    // =============================================
    // FECHAS IMPORTANTES
    // =============================================
    
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    estimatedDeliveryDate: {
        type: Date,
        validate: {
            validator: function(date) {
                if (date) {
                    return date > this.orderDate;
                }
                return true;
            },
            message: 'La fecha estimada de entrega debe ser posterior a la fecha del pedido'
        }
    },
    
    deliveredDate: {
        type: Date,
        validate: {
            validator: function(date) {
                if (date) {
                    return date > this.orderDate;
                }
                return true;
            },
            message: 'La fecha de entrega debe ser posterior a la fecha del pedido'
        }
    },
    // =============================================
    // DIRECCIONES DE ENVÍO Y FACTURACIÓN
    // =============================================
    
    shippingAddress: {
        firstName: {
            type: String,
            required: [true, 'El nombre para envío es obligatorio'],
            trim: true,
            maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
        },
        
        lastName: {
            type: String,
            required: [true, 'El apellido para envío es obligatorio'],
            trim: true,
            maxlength: [50, 'El apellido no puede tener más de 50 caracteres']
        },
        
        street: {
            type: String,
            required: [true, 'La dirección es obligatoria'],
            trim: true,
            maxlength: [200, 'La dirección no puede tener más de 200 caracteres']
        },
        
        city: {
            type: String,
            required: [true, 'La ciudad es obligatoria'],
            trim: true,
            maxlength: [100, 'La ciudad no puede tener más de 100 caracteres']
        },
        
        state: {
            type: String,
            required: [true, 'El departamento es obligatorio'],
            trim: true,
            maxlength: [100, 'El departamento no puede tener más de 100 caracteres']
        },
        
        zipCode: {
            type: String,
            trim: true,
            maxlength: [10, 'El código postal no puede tener más de 10 caracteres']
        },
        
        country: {
            type: String,
            default: 'Colombia',
            maxlength: [50, 'El país no puede tener más de 50 caracteres']
        },
        
        phone: {
            type: String,
            required: [true, 'El teléfono de contacto es obligatorio'],
            validate: {
                validator: function(phone) {
                    const phoneRegex = /^(\+57)?[3][0-9]{9}$/;
                    return phoneRegex.test(phone.replace(/\s/g, ''));
                },
                message: 'Por favor ingresa un número de teléfono colombiano válido'
            }
        },

        email: {
            type: String,
            required: [true, 'El email de contacto es obligatorio'],
            validate: {
                validator: function(email) {
                    const emailRegex =/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(email.replace(/\s/g, ''));
                },
                message: 'Por favor ingresa un email válido'
            }
        }
    },
    
    // Dirección de facturación (opcional, si es diferente)
    billingAddress: {
        firstName: { type: String, trim: true, maxlength: 50 },
        lastName: { type: String, trim: true, maxlength: 50 },
        street: { type: String, trim: true, maxlength: 200 },
        city: { type: String, trim: true, maxlength: 100 },
        state: { type: String, trim: true, maxlength: 100 },
        zipCode: { type: String, trim: true, maxlength: 10 },
        country: { type: String, default: 'Colombia', maxlength: 50 },
        phone: { 
            type: String,
            validate: {
                validator: function(phone) {
                    if (!phone) return true; // Es opcional
                    const phoneRegex = /^(\+57)?[3][0-9]{9}$/;
                    return phoneRegex.test(phone.replace(/\s/g, ''));
                },
                message: 'Por favor ingresa un número de teléfono colombiano válido'
            }
        },
        email: { 
            type: String,
            validate: {
                validator: function(email) {
                    if (!email) return true; // Es opcional
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(email.replace(/\s/g, ''));
                },
                message: 'Por favor ingresa un email válido'
            }
        }
    },
    // =============================================
    // INFORMACIÓN DE PAGO
    // =============================================
    
    paymentMethod: {
        type: String,
        enum: {
            values: ['credit_card', 'debit_card', 'pse', 'cash_on_delivery', 'bank_transfer' , 'nequi'],
            message: '{VALUE} no es un método de pago válido'
        },
        required: [true, 'El método de pago es obligatorio']
    },
    
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
            message: '{VALUE} no es un estado de pago válido'
        },
        default: 'pending',
        index: true
    },
    
    paymentReference: {
        type: String,
        // ID de la transacción del procesador de pagos (Stripe, PayU, etc.)
    },
    
    // =============================================
    // INFORMACIÓN DE ENVÍO
    // =============================================
    
    shippingMethod: {
        type: String,
        enum: {
            values: ['standard', 'express', 'overnight', 'pickup'],
            message: '{VALUE} no es un método de envío válido'
        },
        default: 'standard'
    },
    
    trackingNumber: {
        type: String,
        sparse: true, // Permite valores únicos o null
        index: true
    },
    
    shippingCarrier: {
        type: String,
        enum: {
            values: ['servientrega', 'coordinadora', 'tcc', 'deprisa', 'pickup'],
            message: '{VALUE} no es una empresa de envío válida'
        }
    },
    
    // =============================================
    // NOTAS Y OBSERVACIONES
    // =============================================
    
    notes: {
        customerNotes: {
            type: String,
            maxlength: [500, 'Las notas del cliente no pueden tener más de 500 caracteres'],
            trim: true
        },
        
        internalNotes: {
            type: String,
            maxlength: [1000, 'Las notas internas no pueden tener más de 1000 caracteres'],
            trim: true
        }
    }
    
}, {
    // =============================================
    // OPCIONES DEL SCHEMA
    // =============================================
    
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    
    toObject: { 
        virtuals: true
    }
});
// =============================================
// CAMPOS VIRTUALES - PROPIEDADES CALCULADAS
// =============================================

/**
 * Campo virtual: Dirección de envío formateada
 */
orderSchema.virtual('formattedShippingAddress').get(function() {
    if (!this.shippingAddress) return '';
    
    const addr = this.shippingAddress;
    return `${addr.street}, ${addr.city}, ${addr.state}${addr.zipCode ? ', CP ' + addr.zipCode : ''}, ${addr.country}`;
});

/**
 * Campo virtual: Total de productos en el pedido
 */
orderSchema.virtual('totalItems').get(function() {
    return this.products.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Campo virtual: Cantidad de productos únicos
 */
orderSchema.virtual('uniqueProducts').get(function() {
    return this.products.length;
});

/**
 * Campo virtual: Estado en español
 */
orderSchema.virtual('statusText').get(function() {
    const statusTexts = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado',
        'processing': 'En Preparación',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado',
        'returned': 'Devuelto'
    };
    return statusTexts[this.status] || this.status;
});

/**
 * Campo virtual: Días desde el pedido
 */
orderSchema.virtual('daysSinceOrder').get(function() {
    return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

/**
 * Campo virtual: ¿Está retrasado?
 */
orderSchema.virtual('isOverdue').get(function() {
    if (!this.estimatedDeliveryDate || this.status === 'delivered') return false;
    return Date.now() > this.estimatedDeliveryDate;
});

/**
 * Campo virtual: Totales formateados
 */
orderSchema.virtual('formattedTotals').get(function() {
    const formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return {
        subtotal: formatter.format(this.totals.subtotal),
        tax: formatter.format(this.totals.tax),
        shipping: formatter.format(this.totals.shipping),
        discount: formatter.format(this.totals.discount),
        total: formatter.format(this.totals.total)
    };
});
// =============================================
// MIDDLEWARE - CÁLCULOS AUTOMÁTICOS
// =============================================

/**
 * MIDDLEWARE PRE-SAVE
 * Ejecuta cálculos automáticos antes de guardar el pedido
 */
orderSchema.pre('save', async function(next) {
    console.log(`💾 Procesando pedido antes de guardar: ${this.orderNumber || 'NUEVO'}`);
    
    try {
        // =============================================
        // 1. GENERAR NÚMERO DE PEDIDO SI ES NUEVO
        // =============================================
        
        if (this.isNew && !this.orderNumber) {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            
            // Buscar el último número de pedido del año
            const lastOrder = await this.constructor.findOne({
                orderNumber: { $regex: `^${year}-${month}` }
            }).sort({ orderNumber: -1 });
            
            let sequence = 1;
            if (lastOrder) {
                const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]) || 0;
                sequence = lastSequence + 1;
            }
            
            this.orderNumber = `${year}-${month}-${String(sequence).padStart(4, '0')}`;
            console.log(`🔢 Número de pedido generado: ${this.orderNumber}`);
        }
        
        // =============================================
        // 2. CALCULAR TOTALES AUTOMÁTICAMENTE
        // =============================================
        
        console.log(`🧮 Calculando totales para ${this.products.length} productos...`);
        
        // Calcular subtotal
        this.totals.subtotal = this.products.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Calcular impuestos
        this.totals.tax = Math.round(this.totals.subtotal * this.totals.taxRate);
        
        // Calcular envío basado en subtotal
        this.totals.shipping = this.calculateShipping();
        
        // Calcular total final
        this.totals.total = this.totals.subtotal + this.totals.tax + this.totals.shipping - this.totals.discount;
        
        console.log(`💰 Cálculos completados:`);
        console.log(`   Subtotal: $${this.totals.subtotal.toLocaleString('es-CO')}`);
        console.log(`   Impuestos (${(this.totals.taxRate * 100)}%): $${this.totals.tax.toLocaleString('es-CO')}`);
        console.log(`   Envío: $${this.totals.shipping.toLocaleString('es-CO')}`);
        console.log(`   Descuento: $${this.totals.discount.toLocaleString('es-CO')}`);
        console.log(`   TOTAL: $${this.totals.total.toLocaleString('es-CO')}`);
        
        // =============================================
        // 3. AGREGAR ENTRADA AL HISTORIAL DE ESTADO
        // =============================================
        
        if (this.isNew) {
            this.statusHistory.push({
                status: this.status,
                date: new Date(),
                note: 'Pedido creado'
            });
            console.log(`📝 Estado inicial agregado al historial: ${this.status}`);
        }
        
        next();
        
    } catch (error) {
        console.error(`❌ Error en middleware pre-save: ${error.message}`);
        next(error);
    }
});
/**
 * MIDDLEWARE POST-SAVE
 */
orderSchema.post('save', async function(doc) {
    console.log(`✅ Pedido guardado exitosamente:`);
    console.log(`   📦 Número: ${doc.orderNumber}`);
    console.log(`   👤 Usuario: ${doc.user}`);
    console.log(`   💰 Total: ${doc.formattedTotals.total}`);
    console.log(`   📊 Estado: ${doc.statusText}`);
    console.log(`   🛒 Productos: ${doc.totalItems} items`);
    console.log(`   🆔 ID: ${doc._id}`);
    
    // Aquí podrías:
    // - Actualizar stock de productosA
    // - Enviar email de confirmación
    // - Crear entrada en sistema de facturación
    // - Notificar al equipo de logística
});
/**
 * Método para calcular costo de envío
 */
orderSchema.methods.calculateShipping = function() {
    const subtotal = this.totals.subtotal;
    
    // Envío gratis para pedidos mayores a $200,000
    if (subtotal >= 200000) {
        return 0;
    }
    
    // Costo base de envío
    let shippingCost = 25000; // $25,000 costo base
    
    // Ajustes según método de envío
    switch (this.shippingMethod) {
        case 'express':
            shippingCost = 45000; // $45,000
            break;
        case 'overnight':
            shippingCost = 75000; // $75,000
            break;
        case 'pickup':
            shippingCost = 0; // Gratis si recoge en tienda
            break;
        default:
            shippingCost = 25000; // Standard
    }
    
    console.log(`🚚 Envío ${this.shippingMethod}: $${shippingCost.toLocaleString('es-CO')}`);
    return shippingCost;
};
// =============================================
// MÉTODOS DE INSTANCIA - FUNCIONES DEL PEDIDO
// =============================================

/**
 * Método para cambiar estado del pedido
 */
orderSchema.methods.changeStatus = function(newStatus, note = '', updatedBy = null) {
    console.log(`📋 Cambiando estado de ${this.status} a ${newStatus}`);
    
    // Validar transición de estado
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'returned'],
        'delivered': ['returned'],
        'cancelled': [],
        'returned': []
    };
    
    if (!validTransitions[this.status].includes(newStatus)) {
        throw new Error(`No se puede cambiar de ${this.status} a ${newStatus}`);
    }
    
    // Cambiar estado
    this.status = newStatus;
    
    // Agregar al historial
    this.statusHistory.push({
        status: newStatus,
        date: new Date(),
        note: note,
        updatedBy: updatedBy
    });
    
    // Actualizar fechas especiales
    if (newStatus === 'delivered') {
        this.deliveredDate = new Date();
    }
    
    console.log(`✅ Estado cambiado a ${newStatus}${note ? ': ' + note : ''}`);
    return this.save();
};

/**
 * Método para agregar producto al pedido
 */
orderSchema.methods.addProduct = function(productData) {
    const { product, quantity, price, name, image } = productData;
    
    // Buscar si el producto ya existe en el pedido
    const existingProductIndex = this.products.findIndex(
        item => item.product.toString() === product.toString()
    );
    
    if (existingProductIndex >= 0) {
        // Actualizar cantidad si ya existe
        this.products[existingProductIndex].quantity += quantity;
        console.log(`📦 Cantidad actualizada para producto existente: ${name}`);
    } else {
        // Agregar nuevo producto
        this.products.push({
            product,
            quantity,
            price,
            name,
            image
        });
        console.log(`📦 Nuevo producto agregado: ${name} x${quantity}`);
    }
    
    return this.save();
};

/**
 * Método para remover producto del pedido
 */
orderSchema.methods.removeProduct = function(productId) {
    const productIndex = this.products.findIndex(
        item => item.product.toString() === productId.toString()
    );
    
    if (productIndex >= 0) {
        const removedProduct = this.products[productIndex];
        this.products.splice(productIndex, 1);
        console.log(`🗑️ Producto removido: ${removedProduct.name}`);
        return this.save();
    } else {
        throw new Error('Producto no encontrado en el pedido');
    }
};

/**
 * Método para verificar si se puede cancelar
 */
orderSchema.methods.canBeCancelled = function() {
    return ['pending', 'confirmed', 'processing'].includes(this.status);
};

/**
 * Método para obtener tiempo de entrega estimado
 */
orderSchema.methods.getEstimatedDeliveryDays = function() {
    const shippingDays = {
        'standard': 5,
        'express': 3,
        'overnight': 1,
        'pickup': 0
    };
    
    return shippingDays[this.shippingMethod] || 5;
};
// =============================================
// MÉTODOS ESTÁTICOS - FUNCIONES DEL MODELO
// =============================================

/**
 * Obtener pedidos por usuario
 */
orderSchema.statics.findByUser = function(userId, options = {}) {
    console.log(`🔍 Buscando pedidos del usuario: ${userId}`);
    
    const query = this.find({ user: userId });
    
    if (options.populate) {
        query.populate('user', 'firstName lastName email')
             .populate('products.product', 'name price brand mainImage');
    }
    
    if (options.status) {
        query.where('status', options.status);
    }
    
    return query.sort({ createdAt: -1 });
};

/**
 * Obtener estadísticas de ventas
 */
orderSchema.statics.getSalesStats = function(dateFrom, dateTo) {
    console.log(`📊 Calculando estadísticas de ventas...`);
    
    const matchStage = {
        status: { $in: ['delivered', 'shipped'] }, // Solo pedidos completados/enviados
        orderDate: {}
    };
    
    if (dateFrom) matchStage.orderDate.$gte = new Date(dateFrom);
    if (dateTo) matchStage.orderDate.$lte = new Date(dateTo);
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totals.total' },
                totalItems: { $sum: '$totalItems' },
                averageOrderValue: { $avg: '$totals.total' },
                totalTax: { $sum: '$totals.tax' },
                totalShipping: { $sum: '$totals.shipping' }
            }
        },
        {
            $project: {
                _id: 0,
                totalOrders: 1,
                totalRevenue: { $round: ['$totalRevenue', 0] },
                totalItems: 1,
                averageOrderValue: { $round: ['$averageOrderValue', 0] },
                totalTax: { $round: ['$totalTax', 0] },
                totalShipping: { $round: ['$totalShipping', 0] }
            }
        }
    ]);
};

/**
 * Obtener órdenes por estado
 */
orderSchema.statics.getOrdersByStatus = function(status) {
    console.log(`📋 Obteniendo pedidos con estado: ${status}`);
    
    return this.find({ status })
               .populate('user', 'firstName lastName email')
               .populate('products.product', 'name price brand')
               .sort({ createdAt: -1 });
};

/**
 * Obtener pedidos pendientes de hace más de X días
 */
orderSchema.statics.getPendingOrders = function(daysOld = 2) {
    console.log(`⏰ Buscando pedidos pendientes de hace más de ${daysOld} días...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.find({
        status: 'pending',
        createdAt: { $lt: cutoffDate }
    }).populate('user', 'firstName lastName email');
};

/**
 * Obtener top productos más vendidos
 */
orderSchema.statics.getTopProducts = function(limit = 10) {
    console.log(`🏆 Obteniendo top ${limit} productos más vendidos...`);
    
    return this.aggregate([
        { $match: { status: { $in: ['delivered', 'shipped'] } } },
        { $unwind: '$products' },
        {
            $group: {
                _id: '$products.product',
                totalQuantity: { $sum: '$products.quantity' },
                totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
                orderCount: { $sum: 1 },
                productName: { $first: '$products.name' }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                productId: '$_id',
                productName: 1,
                totalQuantity: 1,
                totalRevenue: { $round: ['$totalRevenue', 0] },
                orderCount: 1
            }
        }
    ]);
};

/**
 * Obtener ventas por mes
 */
orderSchema.statics.getMonthlySales = function(year) {
    console.log(`📅 Obteniendo ventas mensuales para el año ${year}...`);
    
    return this.aggregate([
        {
            $match: {
                status: { $in: ['delivered', 'shipped'] },
                orderDate: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$orderDate' },
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totals.total' },
                averageOrderValue: { $avg: '$totals.total' }
            }
        },
        { $sort: { '_id': 1 } },
        {
            $project: {
                month: '$_id',
                totalOrders: 1,
                totalRevenue: { $round: ['$totalRevenue', 0] },
                averageOrderValue: { $round: ['$averageOrderValue', 0] },
                _id: 0
            }
        }
    ]);
};
// =============================================
// CREAR EL MODELO DESDE EL ESQUEMA
// =============================================

const Order = mongoose.model('Order', orderSchema);

console.log('✅ Modelo Order creado exitosamente');
console.log('📋 Collection en MongoDB: orders');
console.log('🔗 Relaciones configuradas:');
console.log('   • Order → User (belongsTo)');
console.log('   • Order → Products (belongsToMany)');
console.log('   • Historial de estados incluido');
console.log('🧮 Funcionalidades avanzadas:');
console.log('   • Cálculos automáticos de totales');
console.log('   • Generación automática de número de pedido');
console.log('   • Validaciones de transición de estados');
console.log('   • Métodos de análisis de ventas');
console.log('📦 Modelo Order exportado y listo para usar');

// =============================================
// EXPORTAR EL MODELO
// =============================================

module.exports = Order;

console.log('🔗 Modelo Order exportado con relaciones avanzadas');