// =============================================
// MIDDLEWARE DE AUTENTICACIÓN - GROW HOUSE
// =============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('🔐 Inicializando middleware de autenticación');

// =============================================
// MIDDLEWARE: PROTECT - VERIFICAR TOKEN JWT
// =============================================

const protect = async (req, res, next) => {
    let token;
    
    console.log('🔒 Middleware protect: Verificando autenticación...');

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Token con formato Bearer
        token = req.headers.authorization.split(' ')[1];
        console.log('   ✅ Token encontrado en header (Bearer)');
    } else if (req.headers.authorization) {
        // Token sin Bearer
        token = req.headers.authorization;
        console.log('   ✅ Token encontrado en header (directo)');
    }
    
    // Si no hay token en headers, verificar en cookies (opcional)
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log('   ✅ Token encontrado en cookies');
    }
    
    // =============================================
    // PASO 2: VERIFICAR QUE EXISTE EL TOKEN
    // =============================================
    
    if (!token) {
        console.log('   ❌ No se encontró token');
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
        
        console.log('   🔍 Verificando token con JWT_SECRET...');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('   ✅ Token válido');
        console.log(`   👤 Usuario ID: ${decoded.id}`);
        console.log(`   📧 Email: ${decoded.email}`);
        console.log(`   🎭 Rol: ${decoded.role}`);
        
        // =============================================
        // PASO 4: BUSCAR USUARIO EN BASE DE DATOS
        // =============================================
        
        console.log('   🔍 Buscando usuario en MongoDB...');

        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            console.log('   ❌ Usuario no encontrado en BD');
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
            console.log('   ❌ Cuenta desactivada');
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta soporte.'
            });
        }
        
        // Verificar si la cuenta está bloqueada (demasiados intentos fallidos)
        if (user.isLocked) {
            console.log('   🔒 Cuenta bloqueada temporalmente');
            return res.status(401).json({
                success: false,
                error: 'Cuenta bloqueada',
                message: 'Cuenta bloqueada por seguridad. Intenta más tarde.'
            });
        }
        
        console.log('   ✅ Usuario válido y activo');
        
        // =============================================
        // PASO 6: AGREGAR USUARIO A REQUEST
        // =============================================
        
        req.user = user;
        
        console.log('   🎉 Autenticación exitosa');
        console.log(`   📝 req.user establecido para: ${user.email}`);
        
        // =============================================
        // PASO 7: CONTINUAR CON SIGUIENTE MIDDLEWARE
        // =============================================
        
        next();
        
    } catch (error) {
        // =============================================
        // MANEJO DE ERRORES ESPECÍFICOS DE JWT
        // =============================================
        
        console.log(`   ❌ Error en verificación: ${error.name}`);
        
        /**
         * Diferentes tipos de errores JWT:
         */
        
        // Error 1: Token malformado o firma inválida
        if (error.name === 'JsonWebTokenError') {
            console.log('   ⚠️ Token inválido o malformado');
            return res.status(401).json({
                success: false,
                error: 'Token inválido',
                message: 'El token proporcionado no es válido',
                hint: 'Obtén un nuevo token haciendo login'
            });
        }
        
        // Error 2: Token expirado
        if (error.name === 'TokenExpiredError') {
            console.log('   ⏰ Token expirado');
            return res.status(401).json({
                success: false,
                error: 'Token expirado',
                message: 'Tu sesión ha expirado',
                hint: 'Por favor inicia sesión nuevamente',
                expiredAt: error.expiredAt
            });
        }
        
        // Error 3: Token usado antes de su fecha de inicio (raro)
        if (error.name === 'NotBeforeError') {
            console.log('   ⏰ Token no válido aún');
            return res.status(401).json({
                success: false,
                error: 'Token no válido',
                message: 'Token no es válido todavía'
            });
        }
        
        // Error genérico
        console.error('   💥 Error inesperado:', error.message);
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
        console.log('🔐 Middleware authorize: Verificando permisos...');
        
        // PASO 1: VERIFICAR QUE EXISTE req.user
        if (!req.user) {
            console.log('   ❌ No hay usuario autenticado (protect no ejecutado)');
            return res.status(401).json({
                success: false,
                error: 'No autenticado',
                message: 'Debes iniciar sesión para realizar esta acción'
            });
        }
        
        console.log(`   👤 Usuario: ${req.user.email}`);
        console.log(`   🎭 Rol actual: ${req.user.role}`);
        console.log(`   📋 Roles permitidos: ${roles.join(', ')}`);
        
        // PASO 2: VERIFICAR SI EL ROL ESTÁ PERMITIDO
        if (!roles.includes(req.user.role)) {
            console.log('   ❌ Rol insuficiente');
            console.log(`   🚫 Se requiere: ${roles.join(' o ')}`);
            console.log(`   👤 Usuario tiene: ${req.user.role}`);
            
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado',
                message: `Esta acción requiere rol de ${roles.join(' o ')}`,
                userRole: req.user.role,
                requiredRoles: roles
            });
        }
        
        // PASO 3: PERMISO CONCEDIDO
        console.log('   ✅ Permiso concedido');
        console.log(`   🎉 Usuario ${req.user.email} puede realizar esta acción`);
        
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

console.log('✅ Middleware de autenticación exportado');
console.log('🔐 Funciones disponibles:');
console.log('   • protect - Verificar token JWT y cargar usuario');
console.log('   • authorize - Verificar roles de usuario');
