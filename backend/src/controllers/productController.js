// =============================================
// CONTROLADOR DE PRODUCTOS - GROW HOUSE
// =============================================

const mongoose = require('mongoose');
const Product = require('../models/product');

// =============================================
// FUNCIÓN DE IA - GENERAR INFORMACIÓN DEL PRODUCTO
// =============================================

async function generateProductAIInfo(product) {
    console.log(`🤖 Generando información para: ${product.name}`);

    const prompt = `Eres un experto en plantas, jardinería y productos para el hogar verde. 
Dado el siguiente producto de una tienda colombiana llamada "Grow House", genera información útil para el comprador.

PRODUCTO:
- Nombre: ${product.name}
- Categoría: ${product.category}
- Descripción: ${product.description}
${product.brand ? `- Marca: ${product.brand}` : ''}
${product.tags && product.tags.length > 0 ? `- Etiquetas: ${product.tags.join(', ')}` : ''}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin texto extra):
{
  "generalInfo": "Párrafo de 3-4 oraciones con información general interesante y útil sobre este producto para el comprador colombiano. Menciona sus beneficios, usos principales y por qué es una buena elección.",
  "careGuide": {
    "luz": "Requisitos de luz (solo si aplica a plantas o productos relacionados, si no aplica escribe 'No aplica para este producto')",
    "riego": "Frecuencia y forma de riego (solo si aplica, si no escribe 'No aplica para este producto')",
    "suelo": "Tipo de suelo o sustrato recomendado (solo si aplica, si no escribe 'No aplica para este producto')",
    "temperatura": "Rango de temperatura ideal (solo si aplica, si no escribe 'No aplica para este producto')",
    "consejos": "2-3 consejos prácticos de uso, mantenimiento o cuidado específicos para este producto"
  }
}`;

try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || 'gpt-3.5-turbo',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content.trim();

        console.log('🤖 Respuesta cruda de OpenAI:', text); 

        // Limpiar posibles backticks si el modelo los pone
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        console.log(`✅ Info generada correctamente para: ${product.name}`);
        return parsed;

    } catch (error) {
        console.error(`❌ Error generando info: ${error.message}`);
        return null;
    }
}

// =============================================
// FUNCIÓN 1: OBTENER TODOS LOS PRODUCTOS
// =============================================

const getAllProducts = async (req, res, next) => {
    try {
        console.log(`📱 Obteniendo productos:`, req.query);

        const filters = {};

        if (req.query.category) {
            filters.category = req.query.category.toLowerCase();
        }

        if (req.query.brand) {
            filters.brand = new RegExp(req.query.brand, 'i');
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filters.price = {};
            if (req.query.minPrice) filters.price.$gte = parseInt(req.query.minPrice);
            if (req.query.maxPrice) filters.price.$lte = parseInt(req.query.maxPrice);
        }

        if (req.query.inStock !== undefined) {
            filters.inStock = req.query.inStock === 'true';
        }

        if (req.query.featured !== undefined) {
            filters.featured = req.query.featured === 'true';
        }
        
        if (req.query.search) {
            const searchText = req.query.search.trim();
            filters.$or = [
                { name: new RegExp(searchText, 'i') },
                { description: new RegExp(searchText, 'i') },
                { brand: new RegExp(searchText, 'i') }
            ];
        }

        let sortBy = {};
        switch (req.query.sortBy) {
            case 'price_asc': sortBy = { price: 1 }; break;
            case 'price_desc': sortBy = { price: -1 }; break;
            case 'name': sortBy = { name: 1 }; break;
            case 'newest': sortBy = { createdAt: -1 }; break;
            case 'rating': sortBy = { 'rating.average': -1 }; break;
            default: sortBy = { createdAt: -1 };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const products = await Product.find(filters)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .select('-keywords');

        const total = await Product.countDocuments(filters);
        const totalPages = Math.ceil(total / limit);

        console.log(`✅ ${products.length} productos de ${total} total`);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            pagination: {
                currentPage: page,
                totalPages,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: products
        });

    } catch (error) {
        console.error(`❌ Error getAllProducts: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 2: OBTENER PRODUCTO POR ID
// Con generación automática de información si no existe
// =============================================

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando producto: ${id}`);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID inválido',
                message: 'El ID del producto no es válido'
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado',
                message: 'El producto no existe en nuestro catálogo'
            });
        }

        // Incrementar vistas
        await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

        // ✅ GENERAR INFORMACIÓN SI NO EXISTE TODAVÍA
        if (!product.aiInfo || !product.aiInfo.generatedAt) {
            console.log(`🤖 Producto sin informacón, generando...`);

            const aiData = await generateProductAIInfo(product);

            if (aiData) {
                product.aiInfo = {
                    generalInfo: aiData.generalInfo,
                    careGuide: aiData.careGuide,
                    generatedAt: new Date()
                };

                // Guardar en DB para no volver a generar
                await Product.findByIdAndUpdate(id, {
                    $set: { aiInfo: product.aiInfo }
                });

                console.log(`💾 Información guardada en MongoDB para: ${product.name}`);
            }
        } else {
            console.log(`✅ Información ya existente para: ${product.name}, usando caché`);
        }

        console.log(`✅ Producto encontrado: ${product.name}`);

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error(`❌ Error getProductById: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 3: CREAR PRODUCTO
// =============================================

const createProduct = async (req, res, next) => {
    try {
        console.log(`📱 Creando producto: ${req.body.name}`);

        if (req.body.name) {
            const existing = await Product.findOne({
                name: new RegExp(`^${req.body.name.trim()}$`, 'i')
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Producto duplicado',
                    message: `Ya existe: "${req.body.name}"`
                });
            }
        }

        if (req.body.price && (req.body.price < 1000 || req.body.price > 50000000)) {
            return res.status(400).json({
                success: false,
                error: 'Precio fuera de rango',
                message: 'Precio debe estar entre $1,000 y $50,000,000'
            });
        }

        const product = new Product(req.body);
        await product.save();

        console.log(`✅ Producto creado: ${product.name} - ID: ${product._id}`);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product.toObject()
        });

    } catch (error) {
        console.error(`❌ Error createProduct: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 4: ACTUALIZAR PRODUCTO
// =============================================

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`✏️ Actualizando producto: ${id}`);

        if (req.body.name) {
            const existing = await Product.findOne({
                name: new RegExp(`^${req.body.name.trim()}$`, 'i'),
                _id: { $ne: id }
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre duplicado',
                    message: `Ya existe otro producto: "${req.body.name}"`
                });
            }
        }

        // Si se cambia nombre, descripción o categoría → regenerar información
        const fieldsAffectingAI = ['name', 'description', 'category', 'brand', 'tags'];
        const shouldRegenerateAI = fieldsAffectingAI.some(f => req.body[f] !== undefined);

        if (shouldRegenerateAI) {
            console.log('🤖 Campos clave modificados, se regenerará información al próximo acceso');
            req.body['aiInfo.generatedAt'] = null; // Forzar regeneración
        }

        const product = await Product.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        console.log(`✅ Producto actualizado: ${product.name}`);

        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: product
        });

    } catch (error) {
        console.error(`❌ Error updateProduct: ${error.message}`);
        next(error);
    }
};

// =============================================
// FUNCIÓN 5: ELIMINAR PRODUCTO
// =============================================

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Eliminando producto: ${id}`);

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        console.log(`✅ Producto eliminado: ${product.name}`);

        res.status(200).json({
            success: true,
            message: 'Producto eliminado exitosamente',
            deleted: {
                id: product._id,
                name: product.name,
                price: product.formattedPrice
            }
        });

    } catch (error) {
        console.error(`❌ Error deleteProduct: ${error.message}`);
        next(error);
    }
};

// =============================================
// EXPORTAR FUNCIONES
// =============================================

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};

