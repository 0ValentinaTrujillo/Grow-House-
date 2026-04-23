// =============================================
// CONTROLADOR AUTH - GROW HOUSE
// =============================================

const jwt   = require('jsonwebtoken');
const Admin = require('../models/admin');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son obligatorios'
            });
        }

        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const token = generateToken(admin._id);

        console.log(`✅ Admin autenticado: ${admin.email}`);

        res.json({
            success: true,
            token,
            data: {
                id:    admin._id,
                name:  admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};