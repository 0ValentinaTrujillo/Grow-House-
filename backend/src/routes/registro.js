// routes/registro.js
const express = require('express');
const router = express.Router();
const registroController = require('../controllers/registroController'); // ← Cambié a camelCase

// Middleware de autenticación (opcional - descomenta si usas autenticación)
// const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/registro/analizar
 * @desc    Analizar planta con IA sin guardar
 * @access  Public (o Private si usas protect)
 */
router.post('/analizar', registroController.analizarPlanta);

/**
 * @route   POST /api/registro/analizar-y-guardar
 * @desc    Analizar con IA y guardar automáticamente
 * @access  Public (o Private si usas protect)
 */
router.post('/analizar-y-guardar', registroController.analizarYGuardar);

/**
 * @route   GET /api/registro
 * @desc    Obtener todas las plantas del usuario
 * @access  Public (o Private si usas protect)
 */
router.get('/', registroController.obtenerPlantas);

/**
 * @route   GET /api/registro/:id
 * @desc    Obtener planta por ID
 * @access  Public (o Private si usas protect)
 */
router.get('/:id', registroController.obtenerPlantaPorId);

/**
 * @route   PUT /api/registro/:id
 * @desc    Actualizar planta
 * @access  Public (o Private si usas protect)
 */
router.put('/:id', registroController.actualizarPlanta);

/**
 * @route   DELETE /api/registro/:id
 * @desc    Eliminar planta
 * @access  Public (o Private si usas protect)
 */
router.delete('/:id', registroController.eliminarPlanta);

module.exports = router; // ← ESTA LÍNEA ES CRUCIAL