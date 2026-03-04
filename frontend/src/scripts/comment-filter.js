// =============================================
// COMMENT-FILTER.JS - Filtro de Palabras Groseras
// Grow House - Validación de lenguaje inapropiado en comentarios
// =============================================

console.log('🔒 Comment Filter cargando...');

const CommentFilter = {
    /**
     * Lista de palabras GROSERAS y OFENSIVAS a bloquear
     * Permite comentarios sobre experiencia del producto/servicio
     * Solo bloquea insultos, groserías y palabras ofensivas 
     */
    bannedWords: [
        // Insultos groseros en español
        'hijo de puta', 'hpt', 'hijueputa', 'hijuemadre', 'hjp','hp','vv',
        'hijo de la chingada', 'malparido','mlp','chingada', 'chingado', 'chingue',
        'jodida', 'jodido', 'joder', 'jodete',
        'mierda', 'mierdas', 'mierdera',
        'basura', 'basurilla',
        'puta', 'puto', 'putazo', 'puteria',
        'cabrón', 'cabrona', 'cabronazo',
        'pendejo', 'pendeja', 'pendejazo',
        'estúpido', 'estupidez',
        'idiota', 'idiotas',
        'imbécil', 'imbecilidad',
        'tarado', 'tarada', 'taradez',
        'desgraciado', 'desgraciada',
        'malnacido', 'malnacida',
        'asqueroso', 'asquerosa', 'asquerosidad',
        
        // Groserías colombianas y latinoamericanas
        'sapo', 'sapito', 'saputismo', 'sapon',
        'gonorrea', 'gonorreico',
        'verraco', 'verracada', 'verraquez',
        'cagada', 'cagadas',
        'marica', 'maricada', 'mariquera',
        'acomplejada', 'acomplejado',
        'culicagado', 'culicagada',
        'boca sucia', 'bocasucia',
        'grosero', 'grosera', 'grosería', 'groseras',
        
        // Amenazas y violencia
        'te voy a matar', 'voy a matarte', 'muere',
        'te golpeo', 'te golpeó', 'golpearte',
        'apuñalarte', 'apuñalarte', 'acuchillarte',
        'violar', 'violador', 'violadora', 'violación',
        'abuso', 'abusador', 'abusadora',
        
        // Palabras groseras en inglés
        'fuck', 'fucking', 'fucked', 'shit', 'shitty',
        'damn', 'dammit', 'crap', 'asshole', 'bastard',
        'bitch', 'bitchy', 'dick', 'dickhead', 'pussy',
        'cock', 'cunt', 'whore', 'slut', 'ho',
        
        // Insultos discriminatorios
        'negro', 'negra', 'negrito', 'negrita',
        'indio', 'india', 'indiada',
        'cholo', 'chola', 'cholada',
        'gringo', 'gringa', 'gringada',
        'mongol', 'mongolada',
        
        // Palabras ofensivas por orientación/género
        'maricón', 'maricona', 'mariconeada',
        'puto', 'puta', 'putada',
        'gay', 'gaya', 'gayada',
        'lesbiana', 'lesbianada',
        'trans', 'transexual',
        'travesti', 'travestida',
        'desviada', 'desviado',
        
        // Palabras ofensivas por apariencia
        'gordo', 'gorda', 'gordada', 'gordura',
        'flaco', 'flaca', 'flacada',
        'feo', 'fea', 'fealdad',
        'viejo', 'vieja', 'vejestorio',
        'pelado', 'pelada',
        'cojo', 'coja', 'cojedad',
        'ciego', 'ciega', 'ceguera',
        'sordo', 'sorda', 'sordera',
        'tullido', 'tullida',
        'retrasado', 'retrasada',
        'mongol', 'mongolada',
        
        // Drogas e ilegalidad
        'cocaína', 'coca', 'cocacha',
        'heroína', 'heroina',
        'crack', 'craca',
        'marihuana', 'mota', 'maña',
        'cannabis', 'canabbis',
        'ecstasy', 'éxtasis',
        'meth', 'metanfetamina',
        'lsd', 'ácido',
        'droguero', 'droga', 'drogadicto',
        'narco', 'narcotraficante', 'narcotráfico',
        'tráfico', 'traficante',
        'robo', 'robador', 'ladrón',
        'violador', 'asesino', 'criminal',
        'sicario', 'sicariado',
        
        // Palabras religiosas ofensivas
        'infierno', 'demonio', 'satánico', 'satanás',
        'bruja', 'brujo', 'brujería',
        'hechicero', 'hechicera', 'hechicería',
        'anticristo', 'anticristiano',
        'maldición', 'maldito', 'maldita',
        'blasfemia', 'blasfemo', 'blasfema'
    ],

    /**
     * Validar si un comentario contiene palabras groseras prohibidas
     */
    hasBannedWords: function(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }

        // Convertir a minúsculas para comparación
        const lowerText = text.toLowerCase();
        
        // Remover puntuación y espacios múltiples
        const cleanText = lowerText
            .replace(/[.,!?;:'""-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Buscar palabras/frases groseras
        for (let banned of this.bannedWords) {
            // Usar palabra completa para frases de múltiples palabras
            if (banned.includes(' ')) {
                // Para frases multipalabra
                if (cleanText.includes(banned)) {
                    console.warn('⚠️ Palabra grosera detectada:', banned);
                    return true;
                }
            } else {
                // Para palabras simples
                const regex = new RegExp(`\\b${banned}\\b`, 'i');
                if (regex.test(cleanText)) {
                    console.warn('⚠️ Palabra grosera detectada:', banned);
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Validar comentario completo
     */
    validateComment: function(text) {
        const result = {
            isValid: true,
            error: null
        };

        if (!text || typeof text !== 'string') {
            result.isValid = false;
            result.error = 'El comentario no puede estar vacío';
            return result;
        }

        if (this.hasBannedWords(text)) {
            result.isValid = false;
            result.error = 'Tu comentario contiene lenguaje inapropiado o groserías. Por favor, revisa tu mensaje y vuelve a intentar. Recuerda que solo aceptamos comentarios sobre la experiencia del producto/servicio sin insultos.';
            return result;
        }

        return result;
    },

    /**
     * Censurar palabras groseras (reemplazar con asteriscos)
     */
    censorText: function(text) {
        let censoredText = text;

        this.bannedWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const replacement = '*'.repeat(Math.min(word.length, 8));
            censoredText = censoredText.replace(regex, replacement);
        });

        return censoredText;
    }
};

console.log('✅ Comment Filter inicializado con', CommentFilter.bannedWords.length, 'palabras groseras bloqueadas');
