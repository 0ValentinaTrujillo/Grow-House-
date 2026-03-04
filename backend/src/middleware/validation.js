// =============================================
// MIDDLEWARE DE VALIDACIÓN - GROW HOUSE
// =============================================

const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.error(`🚫 Errores de validación en ${req.method} ${req.originalUrl}:`);
        errors.array().forEach(error => {
            console.error(`   • ${error.param}: ${error.msg} (valor: ${error.value})`);
        });

        return res.status(400).json({
            success: false,
            error: 'Datos de entrada inválidos',
            details: errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value,
                location: error.location
            })),
            timestamp: new Date().toISOString(),
            suggestion: 'Revisa los campos marcados y corrige los errores'
        });
    }

    next();
};

const validateObjectId = (req, res, next) => {
    const { id } = req.params;

    // Validar formato de ObjectId (24 caracteres hexadecimales)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!objectIdRegex.test(id)) {
        console.error(`🚫 ID inválido en Grow House: ${id}`);
        return res.status(400).json({
            success: false,
            error: 'ID de producto/usuario inválido',
            details: {
                provided: id,
                expected: 'ObjectId de 24 caracteres hexadecimales',
                example: '64f1a2b3c4d5e6f789012345'
            },
            timestamp: new Date().toISOString(),
            suggestion: 'Verifica que el ID del producto sea correcto'
        });
    }

    next();
};

const validatePagination = (req, res, next) => {
    const { page = 1, limit = 12 } = req.query; // 12 productos por página es estándar para ecommerce

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Validar que sean números válidos
    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro de página inválido',
            details: {
                provided: page,
                expected: 'Número entero mayor a 0',
                example: '?page=1'
            },
            timestamp: new Date().toISOString()
        });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
            success: false,
            error: 'Parámetro de límite inválido',
            details: {
                provided: limit,
                expected: 'Número entero entre 1 y 50',
                example: '?limit=12',
                note: 'Grow house limita a 50 productos por página para mejor rendimiento'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Agregar valores validados al request para usar en controladores
    req.pagination = {
        page: pageNum,
        limit: limitNum,
        skip: (pageNum - 1) * limitNum
    };

    next();
};

const validateProductFilters = (req, res, next) => {
    const { category, minPrice, maxPrice, brand, sortBy } = req.query;

    // Validar categoría si se proporciona
    if (category) {
        const validCategories = [
            'plantas', 'materas', 'decoracion', 'implementos'
            
        ];

        if (!validCategories.includes(category.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'Categoría inválida',
                details: {
                    provided: category,
                    validCategories: validCategories
                },
                timestamp: new Date().toISOString()
            });
        }
    }

    // Validar precios si se proporcionan
    if (minPrice && (isNaN(parseInt(minPrice)) || parseInt(minPrice) < 0)) {
        return res.status(400).json({
            success: false,
            error: 'Precio mínimo inválido',
            details: 'Debe ser un número mayor o igual a 0',
            timestamp: new Date().toISOString()
        });
    }

    if (maxPrice && (isNaN(parseInt(maxPrice)) || parseInt(maxPrice) < 0)) {
        return res.status(400).json({
            success: false,
            error: 'Precio máximo inválido',
            details: 'Debe ser un número mayor o igual a 0',
            timestamp: new Date().toISOString()
        });
    }

    // Validar orden si se proporciona
    if (sortBy) {
        const validSortOptions = ['price_asc', 'price_desc', 'name', 'newest', 'rating'];
        if (!validSortOptions.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                error: 'Opción de ordenamiento inválida',
                details: {
                    provided: sortBy,
                    validOptions: validSortOptions
                },
                timestamp: new Date().toISOString()
            });
        }
    }

    next();
};

/**
 * Middleware para validar parámetros de búsqueda de texto
 */
const validateSearchQuery = (req, res, next) => {
    const { q, limit = 20 } = req.query;

    // Validar que la consulta tenga contenido útil
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Consulta de búsqueda inválida',
            details: {
                provided: q,
                expected: 'Texto con al menos 2 caracteres',
                examples: ['romero', 'matera de barro', 'rastrillo']
            },
            timestamp: new Date().toISOString()
        });
    }

    // Validar límite de resultados
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
            success: false,
            error: 'Límite de búsqueda inválido',
            details: 'Debe ser un número entre 1 y 50',
            timestamp: new Date().toISOString()
        });
    }

    // Limpiar y agregar query al request
    req.searchQuery = {
        text: q.trim(),
        limit: limitNum
    };

    next();
};

module.exports = {
    handleValidationErrors,
    validateObjectId,
    validatePagination,
    validateProductFilters,
    validateSearchQuery
};