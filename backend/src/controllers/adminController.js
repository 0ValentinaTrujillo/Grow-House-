// =============================================
// CONTROLADOR ADMINISTRADOR - GROW HOUSE
// =============================================

const Product = require('../models/product');

// ─── Obtener todos los productos ──────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            status,
            featured,
            search,
            sort = '-createdAt'
        } = req.query;

        const query = {};

        if (category) query.category = category;
        if (status)   query.status   = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (search) {
            query.$or = [
                { name:        { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { keywords:    { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit),
            Product.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page:  parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener productos', error: error.message });
    }
};

// ─── Obtener un producto por ID ───────────────────────────────────────────────
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        res.json({ success: true, data: product });

    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);
        res.status(500).json({ success: false, message: 'Error al obtener producto', error: error.message });
    }
};

// ─── Crear producto ───────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

        console.log(`✅ Producto creado: ${product.name}`);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: product
        });

    } catch (error) {
        console.error('❌ Error creando producto:', error);

        // Errores de validación de Mongoose → 400 con mensajes claros
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: messages
            });
        }

        res.status(400).json({ success: false, message: 'Error al crear producto', error: error.message });
    }
};

// ─── Marcar / producto como destacado ───────────────────────────────
exports.toggleProductFeatured = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        product.featured = !product.featured;
        await product.save();

        console.log(`⭐ Producto "${product.name}" ${product.featured ? 'marcado' : 'desmarcado'} como destacado`);

        res.json({
            success: true,
            message: `Producto ${product.featured ? 'marcado' : 'desmarcado'} como destacado`,
            data: { id: product._id, name: product.name, featured: product.featured }
        });

    } catch (error) {
        console.error('❌ Error actualizando destacado:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar producto', error: error.message });
    }
};

// ─── Actualizar producto ──────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true, context: 'query' }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        console.log(`✅ Producto actualizado: ${product.name}`);

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: product
        });

    } catch (error) {
        console.error('❌ Error actualizando producto:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: messages
            });
        }

        res.status(400).json({ success: false, message: 'Error al actualizar producto', error: error.message });
    }
};

// ─── Eliminar producto ────────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        console.log(`🗑️ Producto eliminado: ${product.name}`);

        res.json({ success: true, message: 'Producto eliminado exitosamente' });

    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto', error: error.message });
    }
};