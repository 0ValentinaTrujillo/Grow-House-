const Product = require('../models/Product');

/**
 * Generar recomendaciones inteligentes
 */
const obtenerRecomendaciones = async (req, res, next) => {
  try {
    const { ubicacion, tipo, presupuesto, preferencia } = req.body;

    // ============================
    // 1️⃣ VALIDACIÓN BÁSICA
    // ============================
    if (!ubicacion || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Ubicación y tipo son obligatorios'
      });
    }

    // ============================
    // 2️⃣ QUERY BASE
    // ============================
    let query = {
      category: 'plantas',
      status: 'active',
      inStock: true,
      tags: { $in: [ubicacion] },
      keywords: { $in: [tipo] }
    };

    if (presupuesto && presupuesto > 0) {
      query.price = { $lte: Number(presupuesto) };
    }

    let plantas = await Product.find(query);

    // ============================
    // 3️⃣ SI NO HAY RESULTADOS → FALLBACK
    // ============================
    if (plantas.length === 0) {
      plantas = await Product.find({
        category: 'plantas',
        status: 'active'
      }).limit(6);
    }

    // ============================
    // 4️⃣ SISTEMA DE PUNTUACIÓN
    // ============================
    plantas = plantas.map(planta => {

      let score = 0;

      if (planta.tags?.includes(ubicacion)) score += 30;
      if (planta.keywords?.includes(tipo)) score += 30;
      if (planta.featured) score += 15;

      score += (planta.salesCount || 0) * 0.2;
      score += (planta.rating?.average || 0) * 10;

      return {
        ...planta.toObject(),
        score: Math.round(score)
      };
    });

    // ============================
    // 5️⃣ ORDENAMIENTO SEGÚN PREFERENCIA
    // ============================
    if (preferencia === 'populares') {
      plantas.sort((a, b) => b.salesCount - a.salesCount);
    } else if (preferencia === 'mejor_valoradas') {
      plantas.sort((a, b) =>
        (b.rating?.average || 0) - (a.rating?.average || 0)
      );
    } else {
      plantas.sort((a, b) => b.score - a.score);
    }

    // ============================
    // 6️⃣ RESPUESTA FINAL
    // ============================
    res.json({
      success: true,
      total: plantas.length,
      recomendaciones: plantas.slice(0, 4)
    });

  } catch (error) {
    console.error('❌ Error en recomendaciones:', error);
    next(error);
  }
};

module.exports = {
  obtenerRecomendaciones
};