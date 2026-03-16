// =============================================
// MIDDLEWARE DE AUTENTICACIÓN - GROW HOUSE
// =============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

;

// =============================================
// MIDDLEWARE: PROTECT - VERIFICAR TOKEN JWT
// =============================================

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.authorization) {
        token = req.headers.authorization;
    }

    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    // =============================================
    // PASO 2: VERIFICAR QUE EXISTE EL TOKEN
    // =============================================
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No autorizado',
            message: 'No se proporcionó token de autenticación',
            hint: 'Incluye el token en el header: Authorization: Bearer <token>'
        });
    }
    
    try {
        // =============================================
        // PASO 3: VERIFICAR Y DECODIFICAR TOKEN
        // =============================================
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'El usuario del token no existe'
            });
        }
        
        // =============================================
        // PASO 5: VERIFICAR ESTADO DEL USUARIO
        // =============================================
         
        // Verificar si la cuenta está activa
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta soporte.'
            });
        }
        
        // Verificar si la cuenta está bloqueada (demasiados intentos fallidos)
        if (user.isLocked) {
            return res.status(401).json({
                success: false,
                error: 'Cuenta bloqueada',
                message: 'Cuenta bloqueada por seguridad. Intenta más tarde.'
            });
        }
        
        req.user = user;
        next();
        
    } catch (error) {
        // =============================================
        // MANEJO DE ERRORES ESPECÍFICOS DE JWT
        // =============================================
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido',
                message: 'El token proporcionado no es válido',
                hint: 'Obtén un nuevo token haciendo login'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado',
                message: 'Tu sesión ha expirado',
                hint: 'Por favor inicia sesión nuevamente',
                expiredAt: error.expiredAt
            });
        }
        
        if (error.name === 'NotBeforeError') {
            return res.status(401).json({
                success: false,
                error: 'Token no válido',
                message: 'Token no es válido todavía'
            });
        }
        
        console.error('❌ Error inesperado en middleware protect:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Error de autenticación',
            message: 'Ocurrió un error al verificar el token'
        });
    }
};

// =============================================
// MIDDLEWARE: AUTHORIZE - VERIFICAR ROLES
// =============================================

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
                message: 'Debes iniciar sesión para realizar esta acción'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: `Esta acción requiere rol de ${roles.join(' o ')}`,
                userRole: req.user.role,
                requiredRoles: roles
            });
        }
        
        next();
    };
};

// =============================================
// EXPORTAR MIDDLEWARE (AL FINAL)
// =============================================

module.exports = {
    protect,
    authorize
};
