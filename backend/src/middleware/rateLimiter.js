const rateLimit = require('express-rate-limit');

// =====================================================
// 1️⃣ RATE LIMITER GENERAL (Para toda la API)
// =====================================================

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos en milisegundos
    max: 100, // Máximo 100 peticiones por ventana de tiempo
    message: {
        error: 'Demasiadas peticiones desde esta IP',
        message: 'Por favor, intenta de nuevo en 15 minutos',
        retryAfter: '15 minutos'
    },
    standardHeaders: true, // Devuelve info de rate limit en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita headers `X-RateLimit-*` antiguos
    
    // Función que se ejecuta cuando se alcanza el límite
    handler: (req, res) => {
        res.status(429).json({
            error: 'Demasiadas peticiones',
            message: 'Has excedido el límite de peticiones. Intentalo de nuevo más tarde.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 60000) + ' minutos'
        });
    }
});

// =====================================================
// 2️⃣ RATE LIMITER PARA AUTENTICACIÓN (Login/Registro)
// =====================================================

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos de login cada 15 minutos
    message: {
        error: 'Demasiados intentos de inicio de sesión',
        message: 'Por seguridad, has sido bloqueado temporalmente',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Personalizar mensaje según intentos restantes
    handler: (req, res) => {
        const resetTime = new Date(req.rateLimit.resetTime);
        res.status(429).json({
            error: 'Límite de intentos excedido',
            message: 'Demasiados intentos de inicio de sesión. Por favor, intentalo mas tarde.',
            intentosRestantes: 0,
            bloqueadoHasta: resetTime.toLocaleString('es-CO', { 
                timeZone: 'America/Bogota',
                dateStyle: 'short',
                timeStyle: 'short'
            }),
            recomendacion: 'Si olvidaste tu contraseña, usa la opción de recuperar contraseña.'
        });
    },
    
    // Función que se ejecuta en cada petición (antes de alcanzar el límite)
    skip: (req) => {
        // No aplicar rate limit si es una IP confiable (opcional)
        const trustedIPs = ['127.0.0.1', '::1']; // localhost
        return trustedIPs.includes(req.ip);
    }
});

// =====================================================
// 3️⃣ RATE LIMITER PARA CREACIÓN DE RECURSOS
// =====================================================

const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // 20 creaciones por hora
    message: {
        error: 'Límite de creación excedido',
        message: 'Has creado demasiados recursos. Intenta de nuevo más tarde.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req, res) => {
        res.status(429).json({
            error: 'Límite de creación excedido',
            message: 'Has alcanzado el límite de recursos que puedes crear por hora',
            retryAfter: '1 hora',
            tipo: 'creación de recursos'
        });
    }
});

// =====================================================
// 4️⃣ RATE LIMITER PARA ENDPOINTS PESADOS
// =====================================================

const heavyOperationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // 10 peticiones cada 5 minutos
    message: {
        error: 'Límite de operaciones pesadas excedido',
        message: 'Esta operación consume muchos recursos. Intenta de nuevo en unos minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// =====================================================
// 5️⃣ EXPORTAR TODOS LOS LIMITERS
// =====================================================

module.exports = {
    generalLimiter,      // Para toda la API
    authLimiter,         // Para login/registro
    createLimiter,       // Para crear recursos
    heavyOperationLimiter // Para operaciones pesadas
};