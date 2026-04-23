// =============================================
// MIDDLEWARE DE AUTENTICACIÓN - GROW HOUSE
// =============================================

const jwt   = require('jsonwebtoken');
const Admin = require('../models/admin');

// ─── Protect: verificar token JWT ────────────────────────────────────────────
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó token de autenticación'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin   = await Admin.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Administrador no encontrado'
            });
        }

        req.admin = admin;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Tu sesión ha expirado, inicia sesión nuevamente'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

module.exports = { protect };