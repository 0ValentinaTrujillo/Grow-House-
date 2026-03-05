const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =====================================
// ANALIZAR ESPACIO CON IA
// =====================================
const analizarEspacio = async (req, res) => {
  try {
    const { image } = req.body;

    // =============================
    // VALIDACIONES
    // =============================
    if (!image) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó una imagen",
      });
    }

    if (!image.startsWith("data:image")) {
      return res.status(400).json({
        success: false,
        error: "Formato de imagen inválido (debe ser base64)",
      });
    }

    console.log("📸 Analizando imagen...");

    // =============================
    // 1️⃣ ANÁLISIS CON GPT-4o
    // =============================
    const analisisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres experto en diseño interior.

Analiza esta imagen y responde SOLO en JSON válido sin texto adicional.

{
  "descripcion_espacio": "texto",
  "descripcion_visual_detallada": "texto",
  "plantas_sugeridas": [
    {
      "nombre_cientifico_y_comun": "texto",
      "numero_y_ubicacion": "texto",
      "descripcion_planta": "texto"
    }
  ],
  "recomendaciones": "texto"
}`
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    if (!analisisResponse.choices?.length) {
      throw new Error("No se recibió respuesta del modelo");
    }

    let contenido = analisisResponse.choices[0].message.content;

    if (!contenido) {
      throw new Error("La respuesta del modelo está vacía");
    }

    // Limpiar markdown si viene
    contenido = contenido.replace(/```json|```/g, "").trim();

    let resultado;

    try {
      resultado = JSON.parse(contenido);
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", contenido);
      throw new Error("La IA devolvió un formato inválido");
    }

    // Validar estructura mínima
    if (!resultado.plantas_sugeridas || !Array.isArray(resultado.plantas_sugeridas)) {
      resultado.plantas_sugeridas = [];
    }

    console.log("✅ Análisis completado");

    // =============================
    // 2️⃣ EDICIÓN REAL DE IMAGEN
    // =============================
    let imagenGenerada = null;

    try {
      if (resultado.plantas_sugeridas.length > 0) {
        console.log("🎨 Editando imagen original...");

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        const plantasUbicaciones = resultado.plantas_sugeridas
          .map(
            (p, i) =>
              `${i + 1}. ${p.nombre_cientifico_y_comun || "Planta"} - ${p.numero_y_ubicacion || "Ubicación sugerida"}`
          )
          .join(". ");

        const editPrompt = `
Edit this EXACT image.

DO NOT change:
- Walls
- Floor
- Furniture
- Lighting
- Layout
- Colors

Keep everything identical.

Only add these plants in these positions:
${plantasUbicaciones}

Make it realistic and professional.
`;

      const imageFile = await toFile(imageBuffer, "espacio.png");

      const imageResponse = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: editPrompt,
        size: "1024x1024",
      });


        if (imageResponse?.data?.length > 0) {
          imagenGenerada = imageResponse.data[0].url;
          console.log("✅ Imagen editada correctamente");
        }
      }
    } catch (errorImagen) {
      console.error("❌ Error editando imagen:", errorImagen.message);
      // No rompemos la respuesta si falla la imagen
    }

    // =============================
    // RESPUESTA FINAL
    // =============================
    return res.json({
      success: true,
      data: {
        descripcion_espacio: resultado.descripcion_espacio || "",
        plantas_sugeridas: resultado.plantas_sugeridas,
        recomendaciones: resultado.recomendaciones || "",
        imagen_generada: imagenGenerada,
      },
    });

  } catch (error) {
    console.error("❌ Error general:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor",
    });
  }
};

// =====================================
// HEALTH CHECK
// =====================================
const health = (req, res) => {
  res.json({
    success: true,
    service: "Espacios AI",
    status: "OK",
  });
};

module.exports = {
  analizarEspacio,
  health,
};
