// =============================================
// FAVORITOS.JS - VERSIÓN CON AUTENTICACIÓN
// Grow House - Requiere login para usar favoritos
// =============================================

console.log('❤️ Inicializando sistema de favoritos con autenticación...');

// =============================================
// CONFIGURACIÓN
// =============================================

const FAVORITES_CONFIG = {
    storage: {
        key: 'growhouse-favorites'
    },
    animations: {
        duration: 300,
        enabled: true
    }
};

// =============================================
// ESTADO GLOBAL
// =============================================

let userFavorites = [];

// =============================================
// VERIFICACIÓN DE AUTENTICACIÓN
// =============================================

/**
 * Verificar si el usuario está autenticado
 */
function isUserAuthenticated() {
    // Usar authAPI si está disponible (preferible)
    if (typeof authAPI !== 'undefined') {
        return authAPI.isAuthenticated();
    }
    // Fallback a localStorage si authAPI no está disponible
    const token = localStorage.getItem('growhouse_token');
    return !!token;
}

/**
 * Obtener información del usuario actual
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('growhouse_user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Mostrar modal de autenticación requerida
 */
function showAuthRequiredModal() {
    // Verificar si el modal ya existe
    let modal = document.getElementById('auth-required-modal');
    
    if (!modal) {
        // Crear el modal
        modal = document.createElement('div');
        modal.id = 'auth-required-modal';
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-scale-in">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-green-700 to-green-800 p-6 rounded-t-2xl">
                        <div class="flex items-center justify-center mb-2">
                            <div class="bg-white rounded-full p-3">
                                <svg class="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-white text-center">¡Favoritos Exclusivos!</h3>
                        <p class="text-green-100 text-center mt-2">Inicia sesión para guardar tus productos favoritos</p>
                    </div>

                    <!-- Body -->
                    <div class="p-6">
                        <div class="space-y-4 mb-6">
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Guarda tus favoritos</h4>
                                    <p class="text-sm text-gray-600">Accede a tus productos favoritos desde cualquier dispositivo</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Compra más rápido</h4>
                                    <p class="text-sm text-gray-600">Encuentra fácilmente los productos que te interesan</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg class="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900">Recibe notificaciones</h4>
                                    <p class="text-sm text-gray-600">Te avisamos de ofertas en tus productos favoritos</p>
                                </div>
                            </div>
                        </div>

                        <!-- Botones -->
                        <div class="space-y-3">
                            <button 
                                onclick="redirectToLogin()"
                                class="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                                </svg>
                                <span>Iniciar Sesión</span>
                            </button>

                            <button 
                                onclick="redirectToRegister()"
                                class="w-full bg-white hover:bg-gray-50 text-green-800 font-semibold py-3 px-6 rounded-xl border-2 border-green-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                </svg>
                                <span>Registrarse</span>
                            </button>

                            <button 
                                onclick="closeAuthModal()"
                                class="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors duration-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Mostrar el modal con animación
    modal.style.display = 'block';
    setTimeout(() => {
        modal.querySelector('.animate-fade-in').style.opacity = '1';
    }, 10);
}

/**
 * Cerrar modal de autenticación
 */
window.closeAuthModal = function() {
    const modal = document.getElementById('auth-required-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

/**
 * Redirigir a login
 */
window.redirectToLogin = function() {
    const currentPage = window.location.pathname;
    window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
};

/**
 * Redirigir a registro
 */
window.redirectToRegister = function() {
    const currentPage = window.location.pathname;
    window.location.href = `register.html?redirect=${encodeURIComponent(currentPage)}`;
};

// =============================================
// FUNCIONES DE PERSISTENCIA
// =============================================

/**
 * Cargar favoritos desde localStorage
 */
function loadFavorites() {
    try {
        console.log('📦 Cargando favoritos desde localStorage...');
        
        // Solo cargar si está autenticado
        if (!isUserAuthenticated()) {
            console.log('⚠️ Usuario no autenticado, no se cargan favoritos');
            userFavorites = [];
            return [];
        }
        
        // IMPORTANTE: Usar clave simple y consistente
        const simpleKey = FAVORITES_CONFIG.storage.key;
        console.log('🔑 Clave de almacenamiento (simple):', simpleKey);
        
        const stored = localStorage.getItem(simpleKey);
        console.log('📊 Datos en localStorage:', stored ? `${stored.length} caracteres` : 'null');
        
        if (stored) {
            try {
                userFavorites = JSON.parse(stored);
                console.log(`✅ ${userFavorites.length} favoritos cargados correctamente`);
                console.log('📋 Favoritos:', userFavorites.map(f => f.name));
            } catch (e) {
                console.error('❌ Error parseando JSON:', e);
                userFavorites = [];
            }
        } else {
            userFavorites = [];
            console.log('📝 No hay favoritos guardados, iniciando lista vacía');
        }
        
        // Disparar evento personalizado cuando se carguen los favoritos
        window.dispatchEvent(new CustomEvent('favoritesLoaded', { 
            detail: { favorites: userFavorites } 
        }));
        
        return userFavorites;
        
    } catch (error) {
        console.error('❌ Error cargando favoritos:', error);
        userFavorites = [];
        return [];
    }
}

/**
 * Guardar favoritos en localStorage
 */
function saveFavorites() {
    try {
        if (!isUserAuthenticated()) {
            console.warn('⚠️ No se pueden guardar favoritos sin autenticación');
            return false;
        }
        
        // IMPORTANTE: Usar clave simple y consistente
        const simpleKey = FAVORITES_CONFIG.storage.key;
        console.log('🔑 Clave de almacenamiento (simple):', simpleKey);
        console.log('💾 Datos a guardar:', userFavorites.length, 'favoritos');
        console.log('📋 Productos:', userFavorites.map(f => f.name));
        
        localStorage.setItem(simpleKey, JSON.stringify(userFavorites));
        console.log('✅ Favoritos guardados exitosamente');
        
        window.dispatchEvent(new CustomEvent('favoritesUpdated', {
            detail: { count: userFavorites.length }
        }));
        
        return true;
    } catch (error) {
        console.error('❌ Error guardando favoritos:', error);
        return false;
    }
}

// =============================================
// FUNCIONES PRINCIPALES (CON AUTENTICACIÓN)
// =============================================

/**
 * Agregar producto a favoritos
 */
window.addToFavorites = function(product) {
    console.log('❤️ addToFavorites - Intentando agregar:', product.id, product.name);
    
    // VERIFICAR AUTENTICACIÓN PRIMERO
    if (!isUserAuthenticated()) {
        console.log('⚠️ Usuario no autenticado - mostrando modal');
        showAuthRequiredModal();
        return false;
    }
    
    try {
        const exists = userFavorites.find(fav => fav.id === product.id);
        console.log('🔍 ¿Producto ya existe en favoritos?', !!exists);
        
        if (exists) {
            console.log('⚠️ Producto ya está en favoritos');
            showNotification('Este producto ya está en tus favoritos', 'info');
            return false;
        }
        
        const favorite = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.mainImage || 'https://via.placeholder.com/400',
            addedAt: new Date().toISOString(),
            category: product.category || 'General',
            description: product.description || ''
        };
        
        console.log('📌 Agregando favorito:', favorite);
        userFavorites.push(favorite);
        console.log('📊 Total favoritos después de agregar:', userFavorites.length);
        
        saveFavorites();
        console.log('💾 Favoritos guardados en localStorage');
        
        showNotification(`❤️ ${product.name} agregado a favoritos`, 'success');
        updateFavoriteButton(product.id, true);
        updateFavoritesCounter();
        
        console.log('✅ Favorito agregado exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error agregando a favoritos:', error);
        showNotification('Error al agregar a favoritos', 'error');
        return false;
    }
};

/**
 * Eliminar producto de favoritos
 */
window.removeFromFavorites = function(productId) {
    console.log('💔 Eliminando de favoritos:', productId);
    
    if (!isUserAuthenticated()) {
        showAuthRequiredModal();
        return false;
    }
    
    try {
        const index = userFavorites.findIndex(fav => fav.id === productId);
        
        if (index === -1) {
            showNotification('Producto no está en favoritos', 'warning');
            return false;
        }
        
        const favorite = userFavorites[index];
        userFavorites.splice(index, 1);
        saveFavorites();
        
        showNotification(`💔 ${favorite.name} eliminado de favoritos`, 'warning');
        updateFavoriteButton(productId, false);
        updateFavoritesCounter();
        
        if (window.location.pathname.includes('favoritos.html')) {
            renderFavoritesPage();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error eliminando de favoritos:', error);
        showNotification('Error al eliminar de favoritos', 'error');
        return false;
    }
};

/**
 * Toggle favorito (agregar o eliminar)
 */
window.toggleFavorite = function(product) {
    console.log('🔄 toggleFavorite llamado con:', product);
    
    if (!isUserAuthenticated()) {
        console.warn('⚠️ Usuario no autenticado en toggleFavorite');
        showAuthRequiredModal();
        return false;
    }
    
    const isFavorite = userFavorites.some(fav => fav.id === product.id);
    console.log('🔍 ¿Ya es favorito?', isFavorite);
    
    if (isFavorite) {
        console.log('❌ Removiendo de favoritos');
        return window.removeFromFavorites(product.id);
    } else {
        console.log('✅ Agregando a favoritos');
        return window.addToFavorites(product);
    }
};

/**
 * Verificar si un producto está en favoritos
 */
window.isFavorite = function(productId) {
    if (!isUserAuthenticated()) return false;
    return userFavorites.some(fav => fav.id === productId);
};

/**
 * Obtener todos los favoritos
 */
window.getFavorites = function() {
    if (!isUserAuthenticated()) return [];
    return [...userFavorites];
};

/**
 * Limpiar todos los favoritos
 */
window.clearAllFavorites = function() {
    if (!isUserAuthenticated()) {
        showAuthRequiredModal();
        return false;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar todos tus favoritos?')) {
        return false;
    }
    
    try {
        userFavorites = [];
        saveFavorites();
        
        showNotification('Todos los favoritos han sido eliminados', 'warning');
        
        if (window.location.pathname.includes('favoritos.html')) {
            renderFavoritesPage();
        }
        
        updateFavoritesCounter();
        return true;
        
    } catch (error) {
        console.error('❌ Error limpiando favoritos:', error);
        showNotification('Error al limpiar favoritos', 'error');
        return false;
    }
};

// =============================================
// ACTUALIZAR UI
// =============================================

function updateFavoriteButton(productId, isFavorite) {
    const buttons = document.querySelectorAll(`[data-product-id="${productId}"] .fav-button, .fav[data-product-id="${productId}"], .fav`);
    
    buttons.forEach(button => {
        if (isFavorite) {
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>`;
            button.classList.add('active', 'text-red-500', 'font-semibold');
        } else {
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>`;
            button.classList.remove('active', 'text-red-500', 'font-semibold');
        }
    });
}

function updateFavoritesCounter() {
    const counter = document.getElementById('favorites-counter');
    if (counter) {
        const count = isUserAuthenticated() ? userFavorites.length : 0;
        counter.textContent = count;
        counter.style.display = count > 0 ? 'flex' : 'none';
    }
}

// =============================================
// RENDERIZAR PÁGINA DE FAVORITOS
// =============================================

function renderFavoritesPage() {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    
    if (!container) return;
    
    // Verificar autenticación
    if (!isUserAuthenticated()) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="max-w-md mx-auto">
                    <div class="bg-white rounded-2xl p-8 shadow-lg">
                        <svg class="w-20 h-20 mx-auto text-green-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">Inicia sesión para ver tus favoritos</h3>
                        <p class="text-gray-600 mb-6">Guarda tus productos favoritos y accede a ellos desde cualquier dispositivo</p>
                        <div class="space-y-3">
                            <a href="login.html" class="block w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
                                Iniciar Sesión
                            </a>
                            <a href="register.html" class="block w-full bg-white hover:bg-gray-50 text-green-800 font-semibold py-3 px-6 rounded-xl border-2 border-green-700 transition-colors">
                                Crear Cuenta
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if (emptyState) emptyState.classList.add('hidden');
        return;
    }
    
    if (userFavorites.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
        }
        container.innerHTML = '';
    } else {
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
        
        container.innerHTML = userFavorites.map(createFavoriteCard).join('');
        
        container.querySelectorAll('.favorite-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    updateFavoritesCounter();
}

function createFavoriteCard(favorite) {
    const addedDate = new Date(favorite.addedAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <div class="favorite-card bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl" 
             style="opacity: 0; transform: translateY(20px);"
             data-favorite-id="${favorite.id}">
            
            <div class="relative h-64 overflow-hidden bg-gray-100">
                <img 
                    src="${favorite.image}" 
                    alt="${favorite.name}"
                    class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    onerror="this.src='https://via.placeholder.com/400?text=Producto'"
                >
                <button 
                    onclick="removeFromFavorites('${favorite.id}')"
                    class="absolute top-4 right-4 bg-white/90 hover:bg-red-50 text-red-600 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    title="Eliminar de favoritos"
                >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-green-600 uppercase tracking-wide">
                        ${favorite.category}
                    </span>
                    <span class="text-xs text-gray-400">
                        ❤️ ${addedDate}
                    </span>
                </div>
                
                <h3 class="text-lg font-bold text-gray-900 mb-2">
                    ${favorite.name}
                </h3>
                
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                    ${favorite.description || 'Sin descripción'}
                </p>
                
                <div class="text-2xl font-bold text-green-800 mb-4">
                    ${formatPrice(favorite.price)}
                </div>
                
                <div class="flex gap-2">
                    <button 
                        onclick="viewProductDetail('${favorite.id}')"
                        class="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300"
                    >
                        Ver Detalles
                    </button>
                    <button 
                        onclick="addToCartFromFavorite('${favorite.id}')"
                        class="flex-1 bg-green-800 hover:bg-green-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
                    >
                        Al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.addToCartFromFavorite = function(favoriteId) {
    const favorite = userFavorites.find(fav => fav.id === favoriteId);
    
    if (!favorite) {
        showNotification('Favorito no encontrado', 'error');
        return;
    }
    
    const cartItem = {
        id: favorite.id,
        name: favorite.name,
        price: favorite.price,
        image: favorite.image,
        quantity: 1
    };
    
    if (typeof addToCart === 'function') {
        addToCart(cartItem);
        showNotification(`✅ ${favorite.name} agregado al carrito`, 'success');
    } else {
        console.error('❌ Función addToCart no encontrada');
        showNotification('Error al agregar al carrito', 'error');
    }
};

// =============================================
// UTILIDADES
// =============================================

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
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
    
    setTimeout(() => toast.remove(), 3000);
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de favoritos con autenticación...');
    
    try {
        loadFavorites();
        
        if (window.location.pathname.includes('favoritos.html')) {
            renderFavoritesPage();
        }
        
        updateFavoritesCounter();
        
        console.log('✅ Sistema de favoritos inicializado correctamente');
        console.log(`❤️ ${userFavorites.length} favoritos cargados`);
        
    } catch (error) {
        console.error('❌ Error inicializando favoritos:', error);
    }
});

window.addEventListener('favoritesUpdated', () => {
    console.log('🔄 favoritesUpdated event disparado');
    updateFavoritesCounter();
    
    // Si estamos en la página de favoritos, volver a renderizar
    if (window.location.pathname.includes('favoritos.html')) {
        console.log('🔄 Re-renderizando página de favoritos...');
        loadFavorites();
        renderFavoritesPage();
    }
});

// Event listener para cambios de autenticación
window.addEventListener('storage', (e) => {
    if (e.key === 'growhouse_token') {
        loadFavorites();
        updateFavoritesCounter();
        
        if (window.location.pathname.includes('favoritos.html')) {
            renderFavoritesPage();
        }
    }
});

console.log('✅ favoritos.js cargado correctamente con protección de autenticación');