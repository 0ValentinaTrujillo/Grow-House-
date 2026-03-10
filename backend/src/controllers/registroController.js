// ======================================================
// CONTROLADOR DE PLANTAS - ZURI (OPENAI)
// ======================================================

const OpenAI = require('openai');
const Planta = require('../models/Planta');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ======================================================
// ANALIZAR PLANTA CON IA (SIN GUARDAR)
// ======================================================
exports.analizarPlanta = async (req, res) => {
  try {
    const { imagen } = req.body;

    if (!imagen) {
      return res.status(400).json({ success: false, message: 'La imagen es requerida' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'API key de OpenAI no configurada' });
    }

    const base64Data = imagen.includes(',') ? imagen.split(',')[1] : imagen;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` }
            },
            {
              type: "text",
              text: `Analiza esta planta en detalle. Responde SOLO con un objeto JSON con este formato exacto, sin texto adicional:
              {
                "nombre_comun": "nombre común de la planta en español",
                "nombre_cientifico": "nombre científico completo",
                "familia": "familia botánica",
                "nivel_dificultad": "Fácil | Intermedio | Difícil",
                "descripcion": "descripción visual detallada de la planta",
                "cuidados": {
                  "luz": "necesidades de luz",
                  "riego": "frecuencia y cantidad de riego",
                  "temperatura": "rango de temperatura ideal en °C",
                  "humedad": "nivel de humedad recomendado",
                  "fertilizacion": "frecuencia y tipo de fertilizante",
                  "poda": "cuándo y cómo podar"
                },
                "recomendaciones": [
                  "consejo práctico 1",
                  "consejo práctico 2",
                  "consejo práctico 3"
                ],
                "toxicidad": "tóxica para humanos/mascotas o no tóxica",
                "propagacion": "método de propagación más común",
                "tamano_esperado": "tamaño máximo aproximado"
              }`
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    let resultado;
    try {
      resultado = JSON.parse(completion.choices[0].message.content);
    } catch {
      throw new Error('No se pudo procesar la respuesta de IA');
    }

    res.status(200).json({ success: true, data: resultado });

  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ success: false, message: 'Demasiadas solicitudes. Espera un momento.' });
    }
    res.status(500).json({
      success: false,
      message: 'Error al analizar la planta con IA',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// ======================================================
// ANALIZAR CON IA Y GUARDAR EN BASE DE DATOS
// ======================================================
exports.analizarYGuardar = async (req, res) => {
  try {
    const { imagen, analisis: analisisExistente } = req.body;

    if (!imagen && !analisisExistente) {
      return res.status(400).json({ success: false, message: 'La imagen o el análisis es requerido' });
    }

    let analisis = analisisExistente;

    if (!analisis) {
      const base64Data = imagen.includes(',') ? imagen.split(',')[1] : imagen;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` }
              },
              {
                type: "text",
                text: `Analiza esta planta. Responde SOLO con un objeto JSON:
                {
                  "nombre_comun": "nombre común en español",
                  "nombre_cientifico": "nombre científico",
                  "familia": "familia botánica",
                  "nivel_dificultad": "Fácil | Intermedio | Difícil",
                  "descripcion": "descripción detallada",
                  "cuidados": {
                    "luz": "necesidades de luz",
                    "riego": "frecuencia de riego",
                    "temperatura": "rango ideal en °C",
                    "humedad": "nivel de humedad",
                    "fertilizacion": "frecuencia y tipo",
                    "poda": "instrucciones de poda"
                  },
                  "recomendaciones": ["consejo 1", "consejo 2", "consejo 3"],
                  "toxicidad": "tóxica o no tóxica",
                  "propagacion": "método principal",
                  "tamano_esperado": "tamaño máximo"
                }`
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      analisis = JSON.parse(completion.choices[0].message.content);
    }

    const nuevaPlanta = new Planta({
      usuario: req.user._id,
      nombre_comun: analisis.nombre_comun,
      nombre_cientifico: analisis.nombre_cientifico,
      familia: analisis.familia,
      nivel_dificultad: analisis.nivel_dificultad,
      descripcion: analisis.descripcion,
      cuidados: analisis.cuidados,
      recomendaciones: analisis.recomendaciones,
      toxicidad: analisis.toxicidad,
      propagacion: analisis.propagacion,
      tamano_esperado: analisis.tamano_esperado,
      imagen: imagen || null
    });

    await nuevaPlanta.save();

    res.status(201).json({
      success: true,
      message: 'Planta analizada y guardada exitosamente',
      data: nuevaPlanta
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al analizar y guardar la planta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// ======================================================
// OBTENER TODAS LAS PLANTAS
// ======================================================
exports.obtenerPlantas = async (req, res) => {
  try {
    const plantas = await Planta.find({ usuario: req.user._id }).sort({ fecha: -1 });
    res.status(200).json({ success: true, count: plantas.length, data: plantas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener las plantas', error: error.message });
  }
};

// ======================================================
// OBTENER PLANTA POR ID
// ======================================================
exports.obtenerPlantaPorId = async (req, res) => {
  try {
    const planta = await Planta.findOne({ _id: req.params.id, usuario: req.user._id });
    if (!planta) return res.status(404).json({ success: false, message: 'Planta no encontrada' });
    res.status(200).json({ success: true, data: planta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la planta', error: error.message });
  }
};

// ======================================================
// ACTUALIZAR PLANTA
// ======================================================
exports.actualizarPlanta = async (req, res) => {
  try {
    const planta = await Planta.findOneAndUpdate(
      { _id: req.params.id, usuario: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!planta) return res.status(404).json({ success: false, message: 'Planta no encontrada' });
    res.status(200).json({ success: true, message: 'Planta actualizada exitosamente', data: planta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar la planta', error: error.message });
  }
};

// ======================================================
// ELIMINAR PLANTA
// ======================================================
exports.eliminarPlanta = async (req, res) => {
  try {
    const planta = await Planta.findOneAndDelete({ _id: req.params.id, usuario: req.user._id });
    if (!planta) return res.status(404).json({ success: false, message: 'Planta no encontrada' });
    res.status(200).json({ success: true, message: 'Planta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar la planta', error: error.message });
  }
};