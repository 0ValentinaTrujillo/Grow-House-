// =============================================
// CONTROLADOR CHATBOT - GROW HOUSE
// =============================================

const OpenAI = require('openai');


// Inicialización lazy: el cliente se crea solo cuando se necesita
let _openai = null;
function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
    }
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

// =============================================
// CONFIGURACIÓN DEL CHATBOT
// =============================================

const SYSTEM_PROMPT = `Eres Zuri, un asistente virtual experto en plantas y jardinería para "Grow House", una tienda especializada en plantas y productos de jardinería.

Tu conocimiento incluye:
- Cuidado de plantas de interior y exterior
- Riego, luz, temperatura y humedad adecuadas
- Fertilización y abono
- Prevención y solución de plagas
- Propagación y trasplante
- Selección de plantas según el espacio y experiencia del usuario

Características de tu personalidad:
- Amigable, paciente y educativo
- Usas emojis ocasionalmente 🌱🌵🌿
- Das respuestas concisas pero completas (máximo 10 líneas)
- Haces preguntas para entender mejor las necesidades del usuario
- Recomiendas productos de Grow House cuando sea apropiado

IMPORTANTE:
- Si no sabes algo, admítelo honestamente
- Prioriza la salud de las plantas y la seguridad del usuario
- Sugiere consultar a un profesional para problemas complejos
- Mantén un tono positivo y alentador
- Solo habla de plantas y jardinería, no te desvíes a otros temas
- Respuestas cortas y concretas, no más de 10 líneas
- Siempre que puedas, relaciona tus respuestas con productos de Grow House`;

// =============================================
// CONTROLADOR: CHAT
// =============================================

exports.chat = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        // Validación
        if (!message || message.trim() === '') {
            console.log('⚠️ Mensaje vacío recibido');
            return res.status(400).json({
                success: false,
                error: 'El mensaje no puede estar vacío'
            });
        }

        // Verificar API key
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ OPENAI_API_KEY no configurada');
            return res.status(500).json({
                success: false,
                error: 'Servicio de chatbot no disponible'
            });
        }

        // Construir mensajes para OpenAI
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.slice(-10), // Últimos 10 mensajes para contexto
            { role: 'user', content: message }
        ];

        console.log(`🤖 Procesando consulta: "${message.substring(0, 50)}..."`);
        console.log(`📊 Historial: ${conversationHistory.length} mensajes`);

        // Llamada a OpenAI con modelo actualizado
        const completion = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o-mini', // Modelo más económico y accesible
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const reply = completion.choices[0].message.content;

        console.log(`✅ Respuesta generada (${completion.usage.total_tokens} tokens)`);

        // Devolver respuesta
        return res.json({
            success: true,
            reply: reply,
            usage: {
                prompt_tokens: completion.usage.prompt_tokens,
                completion_tokens: completion.usage.completion_tokens,
                total_tokens: completion.usage.total_tokens
            }
        });

    } catch (error) {
        console.error('❌ Error en chatbot:', error.message);
        console.error('Stack:', error.stack);

        // Manejo de errores específicos de OpenAI
        if (error.status === 401) {
            return res.status(500).json({
                success: false,
                error: 'Error de autenticación con OpenAI. Verifica tu API key.'
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Demasiadas solicitudes. Por favor, espera un momento.'
            });
        }

        if (error.code === 'insufficient_quota') {
            return res.status(503).json({
                success: false,
                error: 'Servicio temporalmente no disponible. Verifica tus créditos de OpenAI.'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Error al procesar tu consulta. Por favor, intenta de nuevo.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// =============================================
// CONTROLADOR: HEALTH CHECK
// =============================================

exports.health = async (req, res) => {
    try {
        const isConfigured = !!process.env.OPENAI_API_KEY;
        
        return res.json({
            success: true,
            service: 'Chatbot IA - Grow House',
            status: isConfigured ? 'Operativo ✅' : 'No configurado ⚠️',
            model: 'gpt-4o-mini (OpenAI)',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// =============================================
// CONTROLADOR: SUGERENCIAS RÁPIDAS
// =============================================

exports.quickSuggestions = (req, res) => {
    const suggestions = [
        '¿Cómo regar un pothos?',
        '¿Qué plantas son buenas para principiantes?',
        'Mi planta tiene hojas amarillas',
        '¿Cuánta luz necesita un cactus?',
        '¿Cómo eliminar plagas de forma natural?'
    ];

    return res.json({
        success: true,
        suggestions
    });
};