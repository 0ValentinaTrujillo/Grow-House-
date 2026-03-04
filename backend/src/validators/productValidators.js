const { body, validationResult } = require('express-validator');

console.log('🔍 Inicializando validadores de productos');

// =====================================================
// VALIDACIÓN PARA CREAR/ACTUALIZAR PRODUCTO
// =====================================================

const productValidation = [
    // NOMBRE DEL PRODUCTO
    body('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre del producto es obligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .escape(),
    
    // DESCRIPCIÓN
    body('description')
        .trim()
        .notEmpty()
        .withMessage('La descripción es obligatoria')
        .isLength({ min: 10, max: 1000 })
        .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
        .escape(),
    
    // PRECIO
    body('price')
        .notEmpty()
        .withMessage('El precio es obligatorio')
        .isFloat({ min: 0.01 })
        .withMessage('El precio debe ser un número positivo')
        .custom((value) => {
            // Validar que no tenga más de 2 decimales
            if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
                throw new Error('El precio solo puede tener máximo 2 decimales');
            }
            return true;
        }),
    
    // STOCK
    body('stock')
        .notEmpty()
        .withMessage('El stock es obligatorio')
        .isInt({ min: 0 })
        .withMessage('El stock debe ser un número entero positivo'),
    
    // CATEGORÍA
    body('category')
        .trim()
        .notEmpty()
        .withMessage('La categoría es obligatoria')
        .isIn(['plantas', 'materas', 'decoraciones', 'implementos'])
        .withMessage('Categoría no válida'),
    
    // MARCA
    body('brand')
        .optional({ checkFalsy: true }) // 👈 hace que sea opcional y permite null o vacío
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('La marca debe tener entre 2 y 50 caracteres')
        .escape(),
    
    // IMAGEN (URL)
    body('image')
        .optional()
        .trim()
        .isURL()
        .withMessage('La imagen debe ser una URL válida'),
    
    // DESTACADO (BOOLEAN)
    body('featured')
        .optional()
        .isBoolean()
        .withMessage('Featured debe ser true o false')
];

// MIDDLEWARE DE MANEJO DE ERRORES (igual que auth)
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.log('❌ Errores de validación de producto:');
        console.log(JSON.stringify(errors.array(), null, 2));
        
        const formattedErrors = errors.array().map(error => ({
            campo: error.path,
            mensaje: error.msg,
            valorRecibido: error.value
        }));
        
        return res.status(400).json({
            success: false,
            error: 'Error de validación',
            message: 'Los datos del producto no son válidos',
            errores: formattedErrors,
            total: formattedErrors.length
        });
    }
    
    console.log('✅ Validación de producto exitosa');
    next();
};

module.exports = {
    productValidation,
    handleValidationErrors
};

console.log('✅ Validadores de productos exportados');