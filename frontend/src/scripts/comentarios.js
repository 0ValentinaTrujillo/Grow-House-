// =============================================
// COMENTARIOS.JS - Sistema de Comentarios con Persistencia en localStorage
// Grow House - Gestión de comentarios por producto
// =============================================

console.log('💬 Inicializando sistema de comentarios con persistencia...');

// =============================================
// CONFIGURACIÓN
// =============================================

const COMMENTS_CONFIG = {
    storage: {
        prefix: 'growhouse-comments:',
        productPrefix: 'growhouse-comments:'
    },
    maxCommentLength: 500
};

// =============================================
// ESTADO GLOBAL
// =============================================

let currentProductComments = [];
let currentProductId = null;

// =============================================
// FUNCIONES DE PERSISTENCIA (CON localStorage)
// =============================================

/**
 * Cargar comentarios de un producto desde localStorage
 */
function loadProductComments(productId) {
    try {
        console.log('💬 Cargando comentarios del producto:', productId);
        
        const key = `${COMMENTS_CONFIG.storage.productPrefix}${productId}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            let comments = JSON.parse(stored);
            // Limpiar URLs antiguas de avatar
            comments = cleanOldAvatarURLs(comments);
            console.log(`✅ ${comments.length} comentarios cargados correctamente`);
            return comments;
        } else {
            console.log('📝 No hay comentarios para este producto');
            return [];
        }
        
    } catch (error) {
        console.warn('⚠️ Error cargando comentarios:', error);
        return [];
    }
}

/**
 * Limpiar URLs de avatar antiguas de comentarios guardados
 * Migra datos antiguos que contengan URLs de internet
 */
function cleanOldAvatarURLs(comments) {
    return comments.map(comment => {
        // Eliminar campo userAvatar si contiene URLs de internet
        if (comment.userAvatar && (comment.userAvatar.includes('http') || comment.userAvatar.includes('pravatar'))) {
            console.log('🧹 Limpiando URL de avatar antigua:', comment.id);
            delete comment.userAvatar;
        }
        return comment;
    });
}

/**
 * Guardar comentarios de un producto en localStorage
 */
function saveProductComments(productId, comments) {
    try {
        const key = `${COMMENTS_CONFIG.storage.productPrefix}${productId}`;
        localStorage.setItem(key, JSON.stringify(comments));
        console.log('💾 Comentarios guardados exitosamente:', comments.length);
        
        // Trigger evento personalizado
        window.dispatchEvent(new CustomEvent('commentsUpdated', {
            detail: { productId, count: comments.length }
        }));
        
        return true;
    } catch (error) {
        console.error('❌ Error guardando comentarios:', error);
        return false;
    }
}

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

/**
 * Agregar un nuevo comentario
 */
window.addComment = function(productId = currentProductId) {
    console.log('📝 Intentando agregar comentario al producto:', productId);
    
    const input = document.getElementById('new-comment');
    
    if (!input) {
        console.error('❌ Input de comentario no encontrado');
        return false;
    }
    
    const text = input.value.trim();
    
    // Validaciones
    if (!text) {
        showCommentNotification('Por favor escribe un comentario', 'warning');
        input.focus();
        return false;
    }
    
    if (text.length > COMMENTS_CONFIG.maxCommentLength) {
        showCommentNotification(`El comentario no puede exceder ${COMMENTS_CONFIG.maxCommentLength} caracteres`, 'error');
        return false;
    }

    // 🔒 VALIDAR PALABRAS PROHIBIDAS
    if (typeof CommentFilter !== 'undefined') {
        const validation = CommentFilter.validateComment(text);
        if (!validation.isValid) {
            console.warn('⚠️ Validación fallida:', validation.error);
            showCommentNotification(validation.error, 'error');
            input.focus();
            return false;
        }
    }
    
    if (!productId) {
        console.error('❌ ID de producto no encontrado');
        showCommentNotification('Error: producto no identificado', 'error');
        return false;
    }
    
    try {
        // Obtener usuario actual
        const currentUser = getCurrentUser();
        console.log('👤 Usuario para comentario:', currentUser);
        
        // Crear comentario con información del usuario
        // NO guardamos avatar - se genera desde las iniciales
        const newComment = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: text,
            userName: currentUser.name || 'Usuario Anónimo',
            userFirstName: currentUser.firstName || currentUser.name || 'Usuario',
            userLastName: currentUser.lastName || '',
            userEmail: currentUser.email || '',
            userId: currentUser.id || '',
            timestamp: new Date().toISOString(),
            productId: productId
        };
        
        console.log('📌 Nuevo comentario con datos de usuario:', newComment);
        
        // Cargar comentarios existentes
        let comments = loadProductComments(productId);
        
        // Agregar nuevo comentario al inicio
        comments.unshift(newComment);
        
        // Guardar
        const saved = saveProductComments(productId, comments);
        
        if (!saved) {
            showCommentNotification('Error al guardar comentario', 'error');
            return false;
        }
        
        // Actualizar UI
        currentProductComments = comments;
        renderComments(comments);
        
        // Limpiar input
        input.value = '';
        input.focus();
        
        showCommentNotification('✅ Comentario publicado correctamente', 'success');
        console.log('✅ Comentario agregado exitosamente');
        
        // Scroll suave al comentario nuevo
        setTimeout(() => {
            const commentsList = document.getElementById('comments-list');
            if (commentsList) {
                commentsList.scrollTop = 0;
            }
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error agregando comentario:', error);
        showCommentNotification('Error al publicar comentario', 'error');
        return false;
    }
};

/**
 * Eliminar un comentario
 */
window.deleteComment = function(commentId, productId = currentProductId) {
    console.log('🗑️ Eliminando comentario:', commentId);
    
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return false;
    }
    
    try {
        // Cargar comentarios
        let comments = loadProductComments(productId);
        
        // Filtrar comentario a eliminar
        const filteredComments = comments.filter(c => c.id !== commentId);
        
        if (filteredComments.length === comments.length) {
            showCommentNotification('Comentario no encontrado', 'warning');
            return false;
        }
        
        // Guardar
        saveProductComments(productId, filteredComments);
        
        // Actualizar UI
        currentProductComments = filteredComments;
        renderComments(filteredComments);
        
        showCommentNotification('Comentario eliminado', 'success');
        console.log('✅ Comentario eliminado exitosamente');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error eliminando comentario:', error);
        showCommentNotification('Error al eliminar comentario', 'error');
        return false;
    }
};

/**
 * Editar un comentario (opcional para futuras implementaciones)
 */
window.editComment = async function(commentId, newText, productId = currentProductId) {
    try {
        let comments = await loadProductComments(productId);
        
        const comment = comments.find(c => c.id === commentId);
        
        if (!comment) {
            showCommentNotification('Comentario no encontrado', 'error');
            return false;
        }
        
        comment.text = newText;
        comment.editedAt = new Date().toISOString();
        
        await saveProductComments(productId, comments);
        
        currentProductComments = comments;
        renderComments(comments);
        
        showCommentNotification('Comentario actualizado', 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error editando comentario:', error);
        showCommentNotification('Error al editar comentario', 'error');
        return false;
    }
};

// =============================================
// RENDERIZAR COMENTARIOS
// =============================================

/**
 * Renderizar lista de comentarios
 */
function renderComments(comments) {
    console.log('🎨 Renderizando comentarios:', comments.length);
    
    const container = document.getElementById('comments-list');
    
    if (!container) {
        console.warn('⚠️ Contenedor de comentarios no encontrado');
        return;
    }
    
    if (comments.length === 0) {
        console.log('📝 No hay comentarios, mostrando estado vacío');
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <p class="text-sm">Sé el primero en comentar</p>
            </div>
        `;
        return;
    }
    
    console.log('📋 Renderizando', comments.length, 'comentarios');
    container.innerHTML = comments.map(createCommentHTML).join('');
    
    // Animar entrada de comentarios
    container.querySelectorAll('.comment-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.style.transition = 'all 0.3s ease-out';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 50);
    });
}

/**
 * Crear HTML de un comentario
 */
function createCommentHTML(comment) {
    console.log('🎨 Renderizando comentario:', comment.id, '- Usuario:', comment.userFirstName || comment.userName);
    
    const timeAgo = getTimeAgo(comment.timestamp);
    const isOwner = isCommentOwner(comment);
    
    // Usar firstName o el nombre completo
    const displayName = comment.userFirstName || comment.userName || 'Usuario';
    const lastName = comment.userLastName || '';
    
    // Generar avatar con iniciales (SIEMPRE generar, no usar URL guardada)
    const initials = getUserInitials(displayName, lastName);
    const colorClass = getColorForUser(comment.userName || 'usuario');
    
    // Obtener imagen de perfil del usuario si existe
    let userImage = null;
    if (comment.userId && typeof ProfileImageManager !== 'undefined') {
        userImage = localStorage.getItem(`${ProfileImageManager.config.storageKey}:${comment.userId}`);
        if (userImage) {
            try {
                userImage = JSON.parse(userImage).base64;
                console.log('🖼️ Imagen de perfil encontrada para usuario:', comment.userId);
            } catch (e) {
                userImage = null;
            }
        }
    }
    
    console.log('✨ Avatar generado - Iniciales:', initials, '- Color:', colorClass, '- Tiene imagen:', !!userImage);
    
    // Renderizar avatar con imagen si existe, sino con iniciales
    const avatarHTML = userImage 
        ? `<img src="${userImage}" alt="${displayName}" class="w-10 h-10 rounded-full object-cover flex-shrink-0" title="${displayName}">`
        : `<div class="w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-default" title="${displayName}">
                ${initials}
            </div>`;
    
    return `
        <div class="comment-item flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200" data-comment-id="${comment.id}">
            <!-- Avatar con imagen o iniciales -->
            ${avatarHTML}
            
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                        <p class="text-sm">
                            <span class="font-semibold text-gray-900">${displayName}</span>
                            <span class="text-gray-700 ml-2">${comment.text}</span>
                        </p>
                        <div class="flex items-center gap-3 mt-1">
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                            ${comment.editedAt ? '<span class="text-xs text-gray-400">(editado)</span>' : ''}
                        </div>
                    </div>
                    
                    ${isOwner ? `
                        <button 
                            onclick="deleteComment('${comment.id}')"
                            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Eliminar comentario"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
    console.log('👤 Obteniendo información del usuario actual...');
    
    // PRIMERO: Intentar obtener del authAPI (más confiable)
    if (typeof authAPI !== 'undefined' && authAPI.getUser) {
        const user = authAPI.getUser();
        if (user) {
            console.log('✅ Usuario obtenido de authAPI:', user);
            
            // Usar firstName si está disponible, sino el nombre completo
            const displayName = user.firstName || user.name || user.email || 'Usuario';
            const lastName = user.lastName || '';
            
            return {
                name: displayName,
                firstName: user.firstName || displayName,
                lastName: lastName,
                email: user.email || '',
                id: user.id || user._id || ''
            };
        }
    }
    
    // FALLBACK: Leer de localStorage
    try {
        const userStr = localStorage.getItem('growhouse_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log('✅ Usuario obtenido de localStorage:', user);
            
            // Usar firstName si está disponible
            const displayName = user.firstName || user.name || user.email || 'Usuario';
            const lastName = user.lastName || '';
            
            return {
                name: displayName,
                firstName: user.firstName || displayName,
                lastName: lastName,
                email: user.email || '',
                id: user.id || user._id || ''
            };
        }
    } catch (e) {
        console.warn('⚠️ Error parseando usuario de localStorage:', e);
    }
    
    // Si no hay sesión, retornar usuario anónimo
    console.log('⚠️ No se encontró usuario, usando Usuario Anónimo');
    return {
        name: 'Usuario Anónimo',
        firstName: 'Usuario',
        lastName: 'Anónimo',
        email: '',
        id: ''
    };
}

/**
 * Obtener las iniciales del nombre del usuario
 */
function getUserInitials(firstName, lastName = '') {
    if (!firstName) return 'U';
    
    const initials = firstName.charAt(0).toUpperCase() + (lastName ? lastName.charAt(0).toUpperCase() : '');
    return initials || 'U';
}

/**
 * Obtener color consistente basado en el nombre
 */
function getColorForUser(userName) {
    const colors = [
        'from-blue-500 to-blue-600',
        'from-purple-500 to-purple-600',
        'from-pink-500 to-pink-600',
        'from-green-500 to-green-600',
        'from-yellow-500 to-yellow-600',
        'from-red-500 to-red-600',
        'from-indigo-500 to-indigo-600',
        'from-teal-500 to-teal-600'
    ];
    
    // Usar el nombre para generar un índice consistente
    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
}

/**
 * Verificar si el comentario pertenece al usuario actual
 */
function isCommentOwner(comment) {
    const currentUser = getCurrentUser();
    return comment.userName === currentUser.name;
}

/**
 * Calcular tiempo transcurrido desde el comentario
 */
function getTimeAgo(timestamp) {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffMs = now - commentDate;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Hace unos segundos';
    if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    if (diffHour < 24) return `Hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
    if (diffDay < 7) return `Hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
    
    return commentDate.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Mostrar notificación para comentarios
 */
function showCommentNotification(message, type = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }
    
    console.log(`${type.toUpperCase()}: ${message}`);
    
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    } text-white font-medium`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================
// INICIALIZACIÓN
// =============================================

/**
 * Inicializar sistema de comentarios para un producto
 */
window.initComments = function(productId) {
    console.log('🔧 Inicializando comentarios para producto:', productId);
    
    currentProductId = productId;
    
    try {
        // Cargar comentarios del producto
        const comments = loadProductComments(productId);
        currentProductComments = comments;
        
        console.log(`📋 Se encontraron ${comments.length} comentarios para renderizar`);
        
        // Renderizar
        renderComments(comments);
        
        // Configurar event listener para el input
        const input = document.getElementById('new-comment');
        if (input) {
            // Enter para publicar
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    window.addComment(productId);
                }
            });
            
            // Contador de caracteres
            input.addEventListener('input', (e) => {
                const length = e.target.value.length;
                const max = COMMENTS_CONFIG.maxCommentLength;
                
                let counter = document.getElementById('comment-counter');
                if (!counter) {
                    counter = document.createElement('div');
                    counter.id = 'comment-counter';
                    counter.className = 'text-xs text-gray-500 mt-1';
                    input.parentElement.appendChild(counter);
                }
                
                counter.textContent = `${length}/${max}`;
                
                if (length > max) {
                    counter.classList.add('text-red-500');
                    counter.classList.remove('text-gray-500');
                } else {
                    counter.classList.remove('text-red-500');
                    counter.classList.add('text-gray-500');
                }
            });
        }
        
        console.log('✅ Sistema de comentarios inicializado');
        console.log(`💬 ${comments.length} comentarios cargados`);
        
        return comments;
        
    } catch (error) {
        console.error('❌ Error inicializando comentarios:', error);
        return [];
    }
};

// Auto-inicializar si detectamos parámetro de producto en URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId && document.getElementById('comments-list')) {
        console.log('🚀 Auto-inicializando comentarios...');
        window.initComments(productId);
    }
});

console.log('✅ comentarios.js cargado correctamente');