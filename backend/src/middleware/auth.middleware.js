// =============================================
// MIDDLEWARE DE AUTENTICACIÓN - GROW HOUSE
// =============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

;

// =============================================
// VERIFICAR TOKEN JWT
// =============================================

exports.protect = async (req, res, next) => {
    try {
        // 1. Obtener token del header
        let token = req.headers.authorization;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó token de autenticación'
            });
        }
        
        // 2. Extraer token si viene con "Bearer "
        if (token.startsWith('Bearer ')) {
            token = token.substring(7);
        }
        
        // 3. Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Buscar usuario en la base de datos
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // 5. Verificar si la cuenta está activa
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }
        
        // 6. Agregar usuario al request
        req.user = user;
        
        
        next();
        
    } catch (error) {
        console.error('❌ Error en verificación de token:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error en autenticación',
            error: error.message
        });
    }
};

// =============================================
// VERIFICAR ROL DE ADMINISTRADOR
// =============================================

exports.authorize = (req, res, next) => {
    try {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        // Verificar que sea administrador
        if (req.user.role !== 'admin') {
                
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Se requieren privilegios de administrador'
            });
        }
        
        
        next();
        
    } catch (error) {
        console.error('❌ Error en verificación de admin:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error en verificación de privilegios',
            error: error.message
        });
    }
};

// =============================================
// VERIFICAR ROL ESPECÍFICO
// =============================================

exports.verificarRol = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado: Se requiere uno de estos roles: ${roles.join(', ')}`
            });
        }
        
        next();
    };
};

// =============================================
// VERIFICAR PROPIETARIO O ADMIN
// =============================================

exports.verificarPropietarioOAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        // Admin puede acceder a todo
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Verificar que sea el propietario del recurso
        const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
        
        if (req.user._id.toString() !== resourceUserId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a este recurso'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('❌ Error en verificación de propietario:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error en verificación de permisos',
            error: error.message
        });
    }
};

