// =============================================
// routes/recomendaciones.routes.js
// REEMPLAZA tu archivo actual con este
// Solo agrega la ruta GET /estado, el POST queda igual
// =============================================

const express = require('express');
const router  = express.Router();

const {
  obtenerRecomendaciones,
  obtenerEstado,           // 👈 nuevo
} = require('../controllers/recomendaciones.controller.js');

// GET  /api/recomendaciones/estado  → ¿ya hizo la encuesta este usuario?
router.get('/estado', obtenerEstado);

// POST /api/recomendaciones         → tu ruta original (ahora con lógica JWT)
router.post('/', obtenerRecomendaciones);

module.exports = router;