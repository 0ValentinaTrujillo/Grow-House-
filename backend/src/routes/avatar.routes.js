const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User');

// PUT /api/avatar - Guardar o eliminar avatar
router.put('/', protect, async (req, res) => {
    try {
        const { avatar } = req.body;

        // Validar tamaño si hay imagen (~3.5MB en base64)
        if (avatar && avatar.length > 5 * 1024 * 1024) {
            return res.status(400).json({ 
                success: false, 
                message: 'Imagen demasiado grande. Máximo 3MB.' 
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: avatar || null },
            { new: true, runValidators: false }
        );

        res.json({ 
            success: true, 
            message: avatar ? 'Avatar actualizado' : 'Avatar eliminado',
            avatar: user.avatar 
        });

    } catch (error) {
        console.error('❌ Error actualizando avatar:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// GET /api/avatar - Obtener avatar del usuario actual
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('avatar');
        res.json({ success: true, avatar: user.avatar || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener avatar' });
    }
});

module.exports = router;