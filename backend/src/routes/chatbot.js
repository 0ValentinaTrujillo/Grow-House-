// =============================================
// RUTAS CHATBOT - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================

const requireAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extrae el token del header

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Debes iniciar sesión para usar el chatbot.'
        });
    }

    // ⚠️ Cuando tengas JWT activo en tu proyecto, reemplaza el next() de abajo por esto:
    // const jwt = require('jsonwebtoken');
    // try {
    //     req.user = jwt.verify(token, process.env.JWT_SECRET);
    //     next();
    // } catch {
    //     return res.status(403).json({ success: false, error: 'Sesión expirada.' });
    // }

    next(); // ← Por ahora solo verifica que el token existe
};

// =============================================
// RUTAS
// =============================================

router.post('/chat', requireAuth, chatbotController.chat);      // 🔒 Requiere login
router.get('/health', chatbotController.health);                // 🔓 Pública
router.get('/suggestions', chatbotController.quickSuggestions); // 🔓 Pública

module.exports = router;