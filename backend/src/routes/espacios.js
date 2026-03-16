// =============================================
// RUTAS ANÁLISIS DE ESPACIOS - GROW HOUSE
// =============================================

const express = require('express');
const router = express.Router();
const espaciosController = require('../controllers/espacios.controller');

// =============================================
// RUTAS
// =============================================

// POST /api/espacios/analizar - Analizar imagen de espacio
router.post('/analizar', espaciosController.analizarEspacio);

// GET /api/espacios/health - Verificar estado del servicio
router.get('/health', espaciosController.health);

module.exports = router;