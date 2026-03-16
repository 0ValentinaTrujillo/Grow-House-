const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendVerificationCode } = require("../utils/sendEmail");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const {
    SolicitarCodigo,
    verificarCodigo,
    cambiarPassword
} = require('../controllers/passwordRecoveryController');

const {
    registerValidation,
    loginValidation,
    updateProfileValidation,
    handleValidationErrors
} = require('../validators/authValidators');

const {
    register,
    verifyAndCreateUser,
    login,
    getProfile,
    updateProfile
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// =============================================
// RUTAS PÚBLICAS
// =============================================

router.post('/register', authLimiter, registerValidation, handleValidationErrors, register);
router.post('/verify-registration', verifyAndCreateUser);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, login);

// =============================================
// RECUPERACIÓN DE CONTRASEÑA
// =============================================

router.post('/solicitar-codigo', SolicitarCodigo);
router.post('/verificar-codigo', verificarCodigo);
router.post('/cambiar-password', cambiarPassword);

// =============================================
// LOGIN / REGISTRO CON GOOGLE (un solo paso)
// =============================================

router.post("/google-login", async (req, res) => {
    const { token } = req.body;
    try {
        // 1. Verificar que el token es auténtico (Google ya verificó la identidad)
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // 2. Buscar usuario por googleId o por email
        let user = await User.findOne({
            $or: [{ googleId: payload.sub }, { email: payload.email }]
        });

        let isNewUser = false;

        if (!user) {
            // 3a. No existe → crear cuenta automáticamente con los datos de Google
            user = new User({
                firstName:       payload.given_name  || payload.name.split(' ')[0] || 'Usuario',
                lastName:        payload.family_name || payload.name.split(' ').slice(1).join(' ') || 'Google',
                email:           payload.email,
                googleId:        payload.sub,
                avatar:          payload.picture || null,
                isEmailVerified: true,
                role:            'customer'
            });
            await user.save();
            isNewUser = true;
        } else if (!user.googleId) {
            // 3b. Existe por email pero nunca usó Google → vincular la cuenta
            user.googleId        = payload.sub;
            user.isEmailVerified = true;
            if (!user.avatar && payload.picture) user.avatar = payload.picture;
            await user.save();
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Cuenta desactivada. Contacta soporte.' });
        }

        // 4. Generar JWT y responder directamente
        await user.resetLoginAttempts();
        const myToken = user.generateAuthToken();

        res.json({
            success:   true,
            token:     myToken,
            user:      user.getPublicProfile(),
            isNewUser
        });

    } catch (error) {
        console.error("Error Google Login:", error);
        res.status(401).json({ success: false, message: "Token de Google inválido" });
    }
});

// =============================================
// RUTAS PRIVADAS
// =============================================

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, handleValidationErrors, updateProfile);

module.exports = router;