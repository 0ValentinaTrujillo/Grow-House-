// =============================================
// CLIENTE CHATBOT - Grow House
// Manejo de comunicación con el backend chatbot
// =============================================

console.log('🤖 Inicializando cliente Chatbot');

// =============================================
// CONFIGURACIÓN
// =============================================

const CHATBOT_CONFIG = {
    // Usar la URL base detectada o localhost
    baseURL: getAPIBaseURL() + '/chatbot',
    timeout: 30000,
};

/**
 * Obtener URL base de la API según el ambiente
 */
function getAPIBaseURL() {
    return window.GROW_HOUSE_API;
}

// =============================================
// CLASE DE ERROR PERSONALIZADA
// =============================================

class ChatbotError extends Error {
    constructor(message, status = null, originalError = null) {
        super(message);
        this.name = 'ChatbotError';
        this.status = status;
        this.originalError = originalError;
    }
}

// =============================================
// CLASE PRINCIPAL CHATBOT CLIENT
// =============================================

class ChatbotClient {
    constructor(config = CHATBOT_CONFIG) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.conversationHistory = [];
        console.log('✅ ChatbotClient inicializado:', this.baseURL);
    }

    /**
     * Enviar mensaje al chatbot
     * @param {string} message - Mensaje del usuario
     * @returns {Promise<string>} - Respuesta de la IA
     */
    async sendMessage(message) {
        try {
            // Validar entrada
            if (!message || typeof message !== 'string') {
                throw new ChatbotError('El mensaje debe ser un texto válido');
            }

            const trimmedMessage = message.trim();
            if (trimmedMessage.length === 0) {
                throw new ChatbotError('El mensaje no puede estar vacío');
            }

            console.log('📨 Enviando mensaje:', trimmedMessage.substring(0, 50) + '...');

            // Realizar la solicitud
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            try {
                const response = await fetch(`${this.baseURL}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Enviar token si existe
                        ...(localStorage.getItem('growhouse-auth-token') && {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        })
                    },
                    body: JSON.stringify({
                        message: trimmedMessage
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Manejar respuesta
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new ChatbotError(
                        errorData.error || `Error HTTP ${response.status}`,
                        response.status
                    );
                }

                const data = await response.json();

                if (!data.success) {
                    throw new ChatbotError(data.error || 'Error en la respuesta del servidor');
                }

                const reply = data.reply;
                if (!reply) {
                    throw new ChatbotError('Respuesta vacía del servidor');
                }

                // Guardar en historial
                this.conversationHistory.push({
                    role: 'user',
                    content: trimmedMessage,
                    timestamp: new Date()
                });
                this.conversationHistory.push({
                    role: 'assistant',
                    content: reply,
                    timestamp: new Date()
                });

                console.log('✅ Respuesta recibida');
                return reply;

            } catch (error) {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    throw new ChatbotError('Tiempo de espera agotado. La solicitud tardó demasiado.');
                }
                
                if (error instanceof ChatbotError) {
                    throw error;
                }
                
                throw new ChatbotError(
                    error.message || 'Error de conexión',
                    null,
                    error
                );
            }

        } catch (error) {
            console.error('❌ Error en sendMessage:', error);
            throw error;
        }
    }

    /**
     * Obtener el historial de conversación
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * Limpiar el historial de conversación
     */
    clearHistory() {
        this.conversationHistory = [];
        console.log('🗑️  Historial de conversación limpiado');
    }

    /**
     * Verificar que el servidor está activo
     */
    async healthCheck() {
        try {
            const response = await fetch(this.baseURL + '/health', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.error('❌ Health check fallido:', error);
            return false;
        }
    }
}

// =============================================
// INSTANCIA GLOBAL
// =============================================

const chatbotClient = new ChatbotClient();

console.log('🤖 Cliente chatbot disponible como: chatbotClient');
