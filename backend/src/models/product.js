// =============================================
// MODELO PRODUCTO - GROW HOUSE ECOMMERCE
// =============================================

// Importar librerías necesarias
const mongoose = require('mongoose');

console.log('📱 Iniciando creación del modelo Product...');
// =============================================
// ESQUEMA DEL PRODUCTO
// =============================================

const productSchema = new mongoose.Schema({

    // =============================================
    // INFORMACIÓN BÁSICA E IDENTIFICACIÓN
    // =============================================

    name: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        minlength: [5, 'El nombre debe tener al menos 5 caracteres'],
        maxlength: [200, 'El nombre no puede tener más de 200 caracteres'],
        index: true
    },

    description: {
        type: String,
        required: [true, 'La descripción del producto es obligatoria'],
        trim: true,
        minlength: [15, 'La descripción debe tener al menos 15 caracteres'],
        maxlength: [2000, 'La descripción no puede tener más de 2000 caracteres']
    },

    // =============================================
    // INFORMACIÓN COMERCIAL Y PRECIOS
    // =============================================
    
    price: {
    type: Number,
    required: [true, 'El precio del producto es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
    max: [999999999, 'El precio no puede superar $999,999,999'],
    validate: {
        validator: function (value) {
            return Number.isInteger(value);
        },
        message: 'El precio debe ser un número entero (sin decimales)'
    }
},

    originalPrice: {
    type: Number,
    min: [0, 'El precio original no puede ser negativo'],
    validate: {
        validator: function (value) {
            if (value && this.price) {
                return value >= this.price;
            }
            return true;
        },
        message: 'El precio original debe ser mayor o igual al precio actual'
    }
},

    discount: {
    type: Number,
    min: [0, 'El descuento no puede ser negativo'],
    max: [100, 'El descuento no puede ser mayor a 100%'],
    default: 0
},

    // =============================================
    // CATEGORIZACIÓN Y ORGANIZACIÓN
    // =============================================
    
    category: {
    type: String,
    required: [true, 'La categoría del producto es obligatoria'],
    trim: true,
    lowercase: true,
    enum: {
        values: [
            'plantas',
            'materas',
            'decoraciones',
            'implementos'
        ],
        message: '{VALUE} no es una categoría válida'
    },
    index: true
},

    brand: {
    type: String,
    trim: true,
    required: false,
    minlength: [0, 'La marca debe tener al menos 0 caracter'],
    maxlength: [50, 'La marca no puede tener más de 50 caracteres'],
    default: null // ← opcional: si no hay marca, se guarda como null
},

// =============================================
// IMÁGENES Y MULTIMEDIA - VALIDACIÓN MEJORADA
// =============================================

mainImage: {
    type: String,
    required: [true, 'La imagen principal es obligatoria'],
    validate: {
        validator: function(url) {
            try {
                const urlObj = new URL(url);
                
                // Dominios confiables que NO requieren extensión
                const trustedDomains = [
                    'images.unsplash.com',
                    'unsplash.com',
                    'cdn.shopify.com',
                    'cloudinary.com',
                    'imgur.com',
                    'amazonaws.com',
                    'googleusercontent.com',
                    'pixabay.com',
                    'pinterest.com'
                ];
                
                // Validar extensión de imagen
                const hasImageExtension = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
                
                // Validar dominio confiable
                const isTrustedDomain = trustedDomains.some(domain => 
                    urlObj.hostname.includes(domain)
                );
                
                // ACEPTAR SI: es dominio confiable O tiene extensión de imagen
                const isValid = isTrustedDomain || hasImageExtension;
                
                if (isValid) {
                    if (isTrustedDomain) {
                        console.log(`✅ Imagen de dominio confiable: ${urlObj.hostname}`);
                    } else {
                        console.log(`✅ Imagen con extensión válida: ${url}`);
                    }
                    return true;
                }
                
                console.log(`❌ URL rechazada (no es dominio confiable ni tiene extensión): ${url}`);
                return false;
                
            } catch (error) {
                console.log(`❌ URL inválida: ${url}`);
                return false;
            }
        },
        message: 'La URL de la imagen no es válida o no pertenece a un dominio permitido'
    }
},
  
    lowStockAlert: {
    type: Number,
    min: [0, 'La alerta de stock bajo no puede ser negativa'],
    max: [100, 'La alerta de stock bajo no puede superar 100 unidades'],
    default: 10
},

    // =============================================
    // RATINGS Y REVIEWS
    // =============================================
    
    rating: {
    average: {
        type: Number,
        min: [0, 'La calificación no puede ser menor a 0'],
        max: [5, 'La calificación no puede ser mayor a 5'],
        default: 0
    },
    count: {
        type: Number,
        min: [0, 'El conteo de calificaciones no puede ser negativo'],
        default: 0
    },
    breakdown: {
        five: { type: Number, min: 0, default: 0 },
        four: { type: Number, min: 0, default: 0 },
        three: { type: Number, min: 0, default: 0 },
        two: { type: Number, min: 0, default: 0 },
        one: { type: Number, min: 0, default: 0 }
    }
},
    // =============================================
    // ETIQUETAS Y BÚSQUEDA
    // =============================================
    
    tags: {
    type: [String],
    validate: {
        validator: function (tags) {
            return tags.length <= 20;
        },
        message: 'No puede haber más de 20 etiquetas'
    },
    set: function (tags) {
        return [...new Set(tags.map(tag => tag.toLowerCase().trim()))];
    }
},

    keywords: {
    type: [String]
},

    // =============================================
    // INFORMACIÓN COMERCIAL Y ESTADÍSTICAS
    // =============================================

    salesCount: {
    type: Number,
    min: [0, 'El conteo de ventas no puede ser negativo'],
    default: 0
},

    viewCount: {
    type: Number,
    min: [0, 'El conteo de vistas no puede ser negativo'],
    default: 0
},

    featured: {
    type: Boolean,
    default: false,
    index: true
},

    status: {
    type: String,
    enum: {
        values: ['active', 'inactive', 'discontinued', 'coming-soon'],
        message: '{VALUE} no es un estado válido'
    },
    default: 'active',
    index: true
}
    
}, {
    // =============================================
    // OPCIONES DEL SCHEMA
    // =============================================

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

    toObject: {
        virtuals: true
    }
});

// =============================================
// CAMPOS VIRTUALES - PROPIEDADES CALCULADAS
// =============================================

// Campo virtual: porcentaje de descuento
productSchema.virtual('discountPercentage').get(function () {
    if (this.originalPrice && this.price) {
        const discount = ((this.originalPrice - this.price) / this.originalPrice) * 100;
        return Math.round(discount);
    }
    return 0;
});

// Campo virtual: estado del stock
productSchema.virtual('stockStatus').get(function () {
    if (this.quantity === 0) return 'out-of-stock';
    if (this.quantity <= this.lowStockAlert) return 'low-stock';
    return 'in-stock';
});

// Campo virtual: precio formateado
productSchema.virtual('formattedPrice').get(function () {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(this.price);
});

// Campo virtual: precio original formateado
productSchema.virtual('formattedOriginalPrice').get(function () {
    if (!this.originalPrice) return null;
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(this.originalPrice);
});

// Campo virtual: texto del estado en español
productSchema.virtual('statusText').get(function () {
    const statusTexts = {
        'active': 'Activo',
        'inactive': 'Inactivo',
        'discontinued': 'Descontinuado',
        'coming-soon': 'Próximamente'
    };
    return statusTexts[this.status] || this.status;
});
// =============================================
// MIDDLEWARE - FUNCIONES AUTOMÁTICAS
// =============================================

// MIDDLEWARE PRE-SAVE
productSchema.pre('save', function(next) {
    console.log(`💾 Procesando producto antes de guardar: ${this.name}`);
    
    // 1. SINCRONIZAR inStock CON quantity
    this.inStock = this.quantity > 0;
    
    if (this.quantity === 0) {
        console.log(`📦 Producto sin stock: ${this.name}`);
    } else {
        console.log(`📦 Stock disponible: ${this.quantity} unidades`);
    }
    
    // 2. CALCULAR DESCUENTO AUTOMÁTICAMENTE
    if (this.originalPrice && this.price) {
        const discountCalculated = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
        this.discount = discountCalculated;
        console.log(`🏷️ Descuento calculado automáticamente: ${discountCalculated}%`);
    }

    // 3. GENERAR KEYWORDS PARA BÚSQUEDA
    const keywords = [];

    if (this.name) {
    keywords.push(this.name.toLowerCase());
    }

    if (this.brand) {
    this.brand = this.brand.toLowerCase();
    keywords.push(this.brand);
    }

    if (this.category) {
    keywords.push(this.category.toLowerCase());
    }

    if (this.subcategory) {
    keywords.push(this.subcategory.toLowerCase());
    }

    if (this.name) {
    const nameWords = this.name.toLowerCase().split(' ');
    keywords.push(...nameWords);
    }

    this.keywords = [...new Set(keywords)].filter(word => word.length > 2);

    console.log(`🔍 Keywords generadas: ${this.keywords.join(', ')}`);
    
    // 4. NORMALIZAR TAGS
    if (this.tags && this.tags.length > 0) {
        this.tags = [...new Set(
            this.tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.toLowerCase().trim())
        )];

        console.log(`🏷️ Tags normalizadas: ${this.tags.join(', ')}`);
    }
    
    next();
});

// MIDDLEWARE POST-SAVE
productSchema.post('save', function(doc) {
    console.log(`✅ Producto guardado exitosamente:`);
    console.log(`   📱 Nombre: ${doc.name}`);
    console.log(`   💰 Precio: ${doc.formattedPrice}`);
    console.log(`   📦 Stock: ${doc.quantity} unidades (${doc.stockStatus})`);
    console.log(`   🆔 ID: ${doc._id}`);
});

// =============================================
// CREAR EL MODELO DESDE EL ESQUEMA
// =============================================

const Product = mongoose.model('Product', productSchema);

console.log('✅ Modelo Product creado exitosamente');
console.log('📋 Collection en MongoDB: products');
console.log('🔧 Funcionalidades disponibles:');
console.log('   • Crear productos: new Product(data)');
console.log('   • Buscar productos: Product.find()');
console.log('   • Actualizar productos: Product.findByIdAndUpdate()'); 
console.log('   • Eliminar productos: Product.findByIdAndDelete()');

// =============================================
// EXPORTAR EL MODELO PARA USAR EN OTROS ARCHIVOS
// =============================================

module.exports = Product;

console.log('📦 Modelo Product exportado y listo para usar');