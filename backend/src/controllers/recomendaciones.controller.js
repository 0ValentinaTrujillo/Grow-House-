// =============================================
// controllers/recomendaciones.controller.js
// REEMPLAZA tu archivo actual con este
// =============================================

const mongoose = require('mongoose');
const Product = mongoose.models.Product || require('../models/Product');
const User    = require('../models/User');   // ajusta la ruta si es distinta
const jwt     = require('jsonwebtoken');

// ── Helper: extraer userId del JWT (sin middleware externo) ──────────
function getUserIdFromToken(req) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
      req.cookies?.token ||
      null;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id || decoded.userId || null;
  } catch {
    return null;
  }
}

// ── Helper: buscar plantas (tu lógica original, sin cambios) ─────────
async function buscarPlantas({ ubicacion, tipo, presupuesto, preferencia }) {
  let query = {
    category: 'plantas',
    status:   'active',
    inStock:  true,
    tags:     { $in: [ubicacion] },
    keywords: { $in: [tipo] },
  };

  if (presupuesto && presupuesto > 0) {
    query.price = { $lte: Number(presupuesto) };
  }

  let plantas = await Product.find(query);

  // Fallback si no hay resultados
  if (plantas.length === 0) {
    plantas = await Product.find({ category: 'plantas', status: 'active' }).limit(6);
  }

  // Sistema de puntuación (tu lógica original)
  plantas = plantas.map(planta => {
    let score = 0;
    if (planta.tags?.includes(ubicacion))    score += 30;
    if (planta.keywords?.includes(tipo))     score += 30;
    if (planta.featured)                     score += 15;
    score += (planta.salesCount || 0) * 0.2;
    score += (planta.rating?.average || 0) * 10;

    return { ...planta.toObject(), score: Math.round(score) };
  });

  // Ordenamiento según preferencia
  if (preferencia === 'populares') {
    plantas.sort((a, b) => b.salesCount - a.salesCount);
  } else if (preferencia === 'mejor_valoradas') {
    plantas.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
  } else {
    plantas.sort((a, b) => b.score - a.score);
  }

  return plantas.slice(0, 4);
}

// ============================================================
// GET /api/recomendaciones/estado
// Devuelve si el usuario ya hizo la encuesta.
// El frontend lo llama al cargar el index y la encuesta.html
// ============================================================
const obtenerEstado = async (req, res, next) => {
  try {
    const userId = getUserIdFromToken(req);

    // Usuario no autenticado
    if (!userId) {
      return res.json({ completada: false, autenticado: false });
    }

    const user = await User.findById(userId).select('encuesta').lean();
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    return res.json({
      autenticado:    true,
      completada:     user.encuesta?.completada     || false,
      preferencias:   user.encuesta?.preferencias   || null,
      fechaRespuesta: user.encuesta?.fechaRespuesta || null,
    });
  } catch (error) {
    console.error('❌ Error en estado:', error);
    next(error);
  }
};

// ============================================================
// POST /api/recomendaciones
// - Si el usuario está autenticado y YA hizo la encuesta:
//     devuelve sus plantas guardadas sin guardar nada nuevo.
// - Si es la PRIMERA VEZ:
//     guarda las preferencias en su documento User y devuelve plantas.
// - Si NO está autenticado:
//     responde normalmente sin guardar nada (modo invitado).
// ============================================================
const obtenerRecomendaciones = async (req, res, next) => {
  try {
    const { ubicacion, tipo, presupuesto, preferencia } = req.body;

    // Validación básica (igual que antes)
    if (!ubicacion || !tipo) {
      return res.status(400).json({
        success:  false,
        message: 'Ubicación y tipo son obligatorios',
      });
    }

    const userId = getUserIdFromToken(req);

    // ── Usuario autenticado ──────────────────────────────────────────
    if (userId) {
      const user = await User.findById(userId).select('encuesta');
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

      // Ya completó la encuesta → devolver sus resultados guardados
      if (user.encuesta?.completada) {
        const plantas = await buscarPlantas(user.encuesta.preferencias);
        return res.json({
          success:      true,
          yaCompletada: true,
          total:        plantas.length,
          recomendaciones: plantas,
          preferencias: user.encuesta.preferencias,
          mensaje:      'Mostrando tus recomendaciones personalizadas.',
        });
      }

      // Primera vez → guardar preferencias en su documento User
      user.encuesta = {
        completada:     true,
        fechaRespuesta: new Date(),
        preferencias:   {
          ubicacion,
          tipo,
          presupuesto: Number(presupuesto) || 0,
          preferencia,
        },
      };
      await user.save();

      const plantas = await buscarPlantas({ ubicacion, tipo, presupuesto, preferencia });
      return res.json({
        success:         true,
        yaCompletada:    false,
        total:           plantas.length,
        recomendaciones: plantas,
        preferencias:    user.encuesta.preferencias,
      });
    }

    // ── Usuario invitado (sin JWT) → funciona pero no guarda ────────
    const plantas = await buscarPlantas({ ubicacion, tipo, presupuesto, preferencia });
    return res.json({
      success:         true,
      yaCompletada:    false,
      total:           plantas.length,
      recomendaciones: plantas,
    });

  } catch (error) {
    console.error('❌ Error en recomendaciones:', error);
    next(error);
  }
};

module.exports = {
  obtenerRecomendaciones,
  obtenerEstado,
};