const express = require('express');
const router = express.Router();
const registroController = require('../controllers/registroController');
const { protect } = require('../middleware/auth');

router.post('/analizar',          protect, registroController.analizarPlanta);
router.post('/analizar-y-guardar', protect, registroController.analizarYGuardar);
router.get('/',                   protect, registroController.obtenerPlantas);
router.get('/:id',                protect, registroController.obtenerPlantaPorId);
router.put('/:id',                protect, registroController.actualizarPlanta);
router.delete('/:id',             protect, registroController.eliminarPlanta);

module.exports = router;