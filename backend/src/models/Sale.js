// =============================================
// MODELO DE VENTAS FÍSICAS - GROW HOUSE
// =============================================

const mongoose = require('mongoose');

// ─── Sub-esquema: ítem de la venta ───────────────────────────────────────────
const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'El producto es obligatorio']
    },
    name: {
        type: String,
        required: true // snapshot del nombre al momento de la venta
    },
    quantity: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [1, 'La cantidad mínima es 1']
    },
    unitPrice: {
        type: Number,
        required: [true, 'El precio unitario es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: false });

// ─── Esquema principal de venta ───────────────────────────────────────────────
const saleSchema = new mongoose.Schema({

    // ── Productos vendidos ──────────────────────────────────────────────────
    items: {
        type: [saleItemSchema],
        validate: {
            validator: items => items.length > 0,
            message: 'La venta debe tener al menos un producto'
        }
    },

    // ── Cliente ─────────────────────────────────────────────────────────────
    client: {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'El nombre no puede superar 100 caracteres'],
            default: 'Cliente general'
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [10, 'El teléfono no puede superar los 10 caracteres'],
            default: null
        }
    },

    // ── Pago ────────────────────────────────────────────────────────────────
    paymentMethod: {
        type: String,
        required: [true, 'El método de pago es obligatorio'],
        enum: {
            values: ['efectivo', 'tarjeta', 'transferencia', 'nequi'],
            message: '{VALUE} no es un método de pago válido'
        }
    },

    total: {
        type: Number,
        required: true,
        min: [0, 'El total no puede ser negativo']
    },

    // ── Notas opcionales ────────────────────────────────────────────────────
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Las notas no pueden superar 500 caracteres'],
        default: null
    },

    // ── Referencia al admin que registró la venta ───────────────────────────
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }

}, {
    timestamps: true, // createdAt = fecha de la venta
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// ─── Virtual: total formateado en COP ────────────────────────────────────────
saleSchema.virtual('formattedTotal').get(function () {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(this.total);
});

// ─── Middleware pre-save: calcular subtotales y total ─────────────────────────
saleSchema.pre('save', function (next) {
    // Calcular subtotal por ítem
    this.items.forEach(item => {
        item.subtotal = item.quantity * item.unitPrice;
    });

    // Calcular total general
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);

    next();
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;