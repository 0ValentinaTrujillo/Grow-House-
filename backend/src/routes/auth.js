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
// LOGIN CON GOOGLE
// =============================================

router.post("/google-login", async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const user = await User.findOne({ email: payload.email });

        if (!user) {
            return res.status(403).json({
                success: false,
                message: "Usuario no registrado. Debe registrarse primero."
            });
        }

        const confirmationCode = Math.floor(100000 + Math.random() * 900000);
        user.loginConfirmationCode = confirmationCode;
        user.codeExpiresAt = Date.now() + 5 * 60 * 1000;
        await user.save();

        await sendVerificationCode(user.email, user.firstName, confirmationCode);

        res.json({
            success: true,
            message: "Se envió un código de confirmación a tu correo.",
            email: user.email
        });

    } catch (error) {
        console.error("Error Google Login:", error);
        res.status(401).json({ success: false, message: "Token inválido" });
    }
});

router.post("/confirm-login", async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        if (user.loginConfirmationCode != code) return res.status(400).json({ success: false, message: "Código inválido" });
        if (user.codeExpiresAt < Date.now()) return res.status(400).json({ success: false, message: "Código expirado" });

        const myToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        user.loginConfirmationCode = null;
        user.codeExpiresAt = null;
        await user.save();

        res.json({ success: true, token: myToken, user: user.getPublicProfile() });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno" });
    }
});

// =============================================
// RUTAS PRIVADAS
// =============================================

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, handleValidationErrors, updateProfile);

module.exports = router;