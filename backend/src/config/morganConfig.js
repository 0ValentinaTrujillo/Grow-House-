const morgan = require('morgan');
const logger = require('./logger');

// =====================================================
// STREAM PARA WINSTON
// =====================================================

// Enviar logs de Morgan a Winston
const stream = {
    write: (message) => {
        // Remover el \n final que Morgan agrega
        logger.http(message.trim());
    }
};

// =====================================================
// FORMATO PERSONALIZADO
// =====================================================

// Crear formato personalizado con más información
morgan.token('body', (req) => {
    // Solo loguear body en desarrollo
    if (process.env.NODE_ENV === 'development') {
        // No loguear contraseñas
        if (req.body && req.body.password) {
            return JSON.stringify({ ...req.body, password: '***' });
        }
        return JSON.stringify(req.body);
    }
    return '';
});

morgan.token('user', (req) => {
    return req.user ? req.user.email : 'anonymous';
});

// Formato en desarrollo (más verboso)
const devFormat = ':method :url :status :response-time ms - :res[content-length] - :user :body';

// Formato en producción (más conciso)
const prodFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

// =====================================================
// CONFIGURACIÓN DE MORGAN
// =====================================================

const morganMiddleware = morgan(
    process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    {
        stream,
        skip: (req, res) => {
            // No loguear health checks (son muy frecuentes)
            return req.url === '/api/health' && res.statusCode < 400;
        }
    }
);

module.exports = morganMiddleware;

console.log('✅ Morgan configurado');
console.log(`   📊 Formato: ${process.env.NODE_ENV === 'production' ? 'producción' : 'desarrollo'}`);