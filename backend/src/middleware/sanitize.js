const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        // 1. Prevenir prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            console.log(`⚠️  Propiedad peligrosa removida: ${key}`);
            continue;
        }

        // 2. Remover operadores MongoDB
        if (key.startsWith('$')) {
            console.log(`⚠️  Operador MongoDB removido: ${key}`);
            continue;
        }

        // 3. Sanitizar valor recursivamente
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else if (typeof value === 'string') {
            // Remover null bytes
            sanitized[key] = value.replace(/\0/g, '');
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Middleware para sanitizar body, query y params
 */
const sanitizeInput = (req, res, next) => {
    // Sanitizar body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitizar query params
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    // Sanitizar URL params
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
};

const preventSQLInjection = (req, res, next) => {
    const checkForSQL = (obj) => {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/gi,
            /(--|\;|\/\*|\*\/)/g,
            /(\bOR\b.*=.*)/gi,
            /(\bAND\b.*=.*)/gi
        ];

        const jsonStr = JSON.stringify(obj);
        
        for (const pattern of sqlPatterns) {
            if (pattern.test(jsonStr)) {
                return true;
            }
        }
        return false;
    };

    if (req.body && checkForSQL(req.body)) {
        console.log('🚨 Intento de SQL Injection detectado');
        return res.status(400).json({
            success: false,
            error: 'Petición sospechosa',
            message: 'Se detectaron patrones de inyección SQL'
        });
    }

    next();
};

module.exports = {
    sanitizeInput,
    preventSQLInjection
};

