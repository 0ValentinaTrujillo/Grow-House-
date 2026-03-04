// =============================================
// PRODUCTO DETALLE API 
// Grow House - Detalles del producto con Favoritos y Comentarios
// =============================================

console.log('📄 Inicializando producto-detalle-api.js');

// =============================================
// ESTADO GLOBAL
// =============================================

let currentProduct = null;
let productIdFromUrl = null;

// =============================================
// CARGAR DETALLES DEL PRODUCTO
// =============================================

async function loadProductDetails() {
    console.log('📡 Cargando detalles del producto...');
    
    // Obtener ID del producto desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    productIdFromUrl = urlParams.get('id');
    
    if (!productIdFromUrl) {
        console.error('❌ No se encontró ID del producto en la URL');
        showErrorPage('Producto no encontrado');
        return;
    }
    
    console.log('🔍 Cargando producto:', productIdFromUrl);
    
    // Mostrar loading
    showLoadingState();
    
    try {
        // Verificar si api está disponible
        if (typeof api === 'undefined') {
            console.error('❌ API no está disponible');
            throw new Error('API no disponible');
        }
        
        // Obtener producto desde la API
        const response = await api.getProduct(productIdFromUrl);
        currentProduct = response.data;
        
        console.log('✅ Producto cargado:', currentProduct);
        
        // Renderizar detalles
        renderProductDetails(currentProduct);
        
        // Inicializar comentarios
        if (typeof window.initComments === 'function') {
            console.log('🔧 Llamando a initComments...');
            window.initComments(productIdFromUrl);
        } else {
            console.warn('⚠️ Sistema de comentarios no disponible');
        }
        
        // Actualizar botón de favoritos
        setTimeout(() => {
            updateFavoriteButtonState();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error cargando producto:', error);
        showErrorPage('Error al cargar el producto. Por favor intenta de nuevo.');
    }
}

// =============================================
// RENDERIZAR DETALLES DEL PRODUCTO
// =============================================

function renderProductDetails(product) {
    console.log('🎨 Renderizando detalles del producto...');
    
    // Actualizar elementos del DOM
    updateProductImage(product);
    updateProductInfo(product);
    updateProductActions(product);
    
    // Ocultar loading
    hideLoadingState();
}

/**
 * Actualizar imagen del producto
 */
function updateProductImage(product) {
    const imageElement = document.getElementById('product-image');
    if (imageElement) {
        imageElement.src = product.mainImage || product.images?.[0] || 'https://via.placeholder.com/400';
        imageElement.alt = product.name;
        imageElement.onerror = () => {
            imageElement.src = 'https://via.placeholder.com/400?text=Producto';
        };
    }
}
/**
 * Actualizar información del producto
 */
function updateProductInfo(product) {
    // Nombre del producto (hay dos elementos h3 y h2)
    const h3Elements = document.querySelectorAll('#product-details h3');
    const h2Elements = document.querySelectorAll('h2');
    
    h3Elements.forEach(el => {
        el.textContent = product.name;
    });
    
    h2Elements.forEach(el => {
        if (el.textContent.includes('Cargando')) {
            el.textContent = product.name;
        }
    });
    
    // Precio
    const priceContainer = document.getElementById('product-price');
    if (priceContainer) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        
    if (hasDiscount) {
        priceContainer.parentElement.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <span class="text-4xl font-bold text-green-800">${formatPrice(product.price)}</span>
                <div class="flex flex-col items-end">
                    <span class="text-sm text-gray-400 line-through">${formatPrice(product.originalPrice)}</span>
                    <span class="text-xs text-red-600 font-semibold">
                        Ahorra ${formatPrice(product.originalPrice - product.price)}
                    </span>
                </div>
            </div>
        `;
    } else {
        priceContainer.textContent = formatPrice(product.price);
    }
    }

    // Renderizar estrellas interactivas
    if (typeof renderStarsInteractive === 'function') {
        renderStarsInteractive(
            product._id || product.id,
            product.rating?.average || 0,
            product.rating?.count   || 0
        );
    }
    
    // Descripción en el apartado "Información"
    const infoDetails = document.querySelector('details[open] .mt-4');
    if (infoDetails && product.description) {
        infoDetails.textContent = product.description;
    }
}

/**
 * Actualizar acciones del producto (botón agregar al carrito)
 */
function updateProductActions(product) {
    const addButton = document.querySelector('.add-to-cart-btn');
    
    if (addButton) {
        // Actualizar atributos del botón
        addButton.setAttribute('data-product-id', product._id || product.id);
        addButton.setAttribute('data-product', product._id || product.id);
        addButton.setAttribute('data-price', product.price);
        addButton.setAttribute('data-image', product.mainImage || product.images?.[0] || '');
        
        // Deshabilitar si no hay stock
        if (product.quantity === 0) {
            addButton.disabled = true;
            addButton.classList.add('opacity-50', 'cursor-not-allowed');
            addButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                <span>Agotado</span>
            `;
        } else {
            addButton.disabled = false;
            addButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        // Remover event listener anterior para evitar duplicados
        addButton.onclick = null;
        
        // Event listener para agregar al carrito
        addButton.onclick = () => handleAddToCart(product);
    }
}

// =============================================
// MANEJO DE ACCIONES
// =============================================

/**
 * Agregar producto al carrito
 */
function handleAddToCart(product) {
    console.log('🛒 Agregando al carrito:', product);
    
    if (product.quantity === 0) {
        showNotification('Producto agotado', 'error');
        return;
    }
    
    const cartItem = {
        id: product._id || product.id,
        name: product.name,
        price: product.price,
        image: product.mainImage || product.images?.[0] || 'https://via.placeholder.com/200',
        quantity: 1
    };
    
    if (typeof addToCart === 'function') {
        addToCart(cartItem);
        showNotification(`✅ ${product.name} agregado al carrito`, 'success');
    } else {
        console.error('❌ Función addToCart no encontrada');
        showNotification('Error al agregar al carrito', 'error');
    }
}

/**
 * Toggle favorito del producto actual
 */
window.toggleCurrentProductFavorite = function() {
    console.log('❤️ Toggle favorito clickeado');
    
    if (!currentProduct) {
        console.error('❌ Producto no cargado');
        showNotification('Error: Producto no cargado', 'error');
        return;
    }
    
    console.log('📦 Producto actual:', currentProduct);
    
    // Verificar si la función toggleFavorite existe
    if (typeof window.toggleFavorite !== 'function') {
        console.error('❌ Función toggleFavorite no encontrada');
        showNotification('Error: Sistema de favoritos no disponible', 'error');
        return;
    }
    
    const favoriteData = {
        id: currentProduct._id || currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.mainImage || currentProduct.images?.[0] || 'https://via.placeholder.com/400',
        category: currentProduct.category || 'General',
        description: currentProduct.description || ''
    };
    
    console.log('💚 Datos para favorito:', favoriteData);
    
    window.toggleFavorite(favoriteData);
    
    // Actualizar botón después de un pequeño delay
    setTimeout(updateFavoriteButtonState, 200);
};

/**
 * Actualizar estado del botón de favoritos
 */
function updateFavoriteButtonState() {
    const favButton = document.querySelector('.fav');
    
    if (!favButton) {
        console.warn('⚠️ Botón de favoritos no encontrado');
        return;
    }
    
    if (!currentProduct) {
        console.warn('⚠️ Producto no cargado aún');
        return;
    }
    
    const productId = currentProduct._id || currentProduct.id;
    
    // Verificar si isFavorite está disponible
    let isFav = false;
    if (typeof window.isFavorite === 'function') {
        isFav = window.isFavorite(productId);
    } else {
        console.warn('⚠️ Función isFavorite no disponible');
    }
    
    console.log(`💚 Producto ${productId} es favorito:`, isFav);
    
    if (isFav) {
        favButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>`;
        favButton.classList.add('text-red-500' );
    } else {
        favButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>`;
        favButton.classList.remove('text-red-500');
        favButton.classList.add('text-gray-400');
    }
        
    // ⚠️ IMPORTANTE: Remover eventos anteriores para evitar duplicados
    favButton.onclick = null;
    
    // Agregar nuevo event listener
    favButton.onclick = window.toggleCurrentProductFavorite;
    favButton.style.cursor = 'pointer';
    favButton.classList.add('transition-all', 'duration-200', 'hover:scale-105');
    
    console.log('✅ Botón de favoritos actualizado');
}

// =============================================
// ESTADOS DE UI
// =============================================

function showLoadingState() {
    const container = document.querySelector('.container-details');
    if (container) {
        container.style.opacity = '0.5';
        container.style.pointerEvents = 'none';
    }
}

function hideLoadingState() {
    const container = document.querySelector('.container-details');
    if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }
}

function showErrorPage(message) {
    const container = document.querySelector('.container-details');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20">
                <svg class="w-24 h-24 text-red-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Ups! Algo salió mal</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <div class="flex gap-4">
                    <a href="productos.html" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
                        Ver Productos
                    </a>
                    <button onclick="location.reload()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

/**
 * ✅ FUNCIÓN CORREGIDA - Sin recursión infinita
 */
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Crear notificación toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all transform translate-x-full opacity-0 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    } text-white font-medium`;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animación de entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 10);
    
    // Eliminar después de 3 segundos con animación
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// =============================================
// NAVEGACIÓN
// =============================================

/**
 * Ir a detalle de otro producto
 */
window.viewProductDetail = function(productId) {
    if (!productId || productId === 'undefined') {
        console.error('❌ ID de producto inválido:', productId);
        showNotification('Error: ID de producto inválido', 'error');
        return;
    }
    
    console.log('👁️ Navegando a producto:', productId);
    window.location.href = `producto-detalle.html?id=${productId}`;
};

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando página de detalles del producto...');
    
    try {
        // Cargar detalles del producto
        await loadProductDetails();
        
        console.log('✅ Página de detalles inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando página:', error);
        showErrorPage('Error al cargar la página. Por favor intenta de nuevo.');
    }
});

// Event listener para actualización de favoritos
window.addEventListener('favoritesUpdated', () => {
    console.log('🔄 Favoritos actualizados, refrescando estado del botón...');
    updateFavoriteButtonState();
});

// Event listener para cuando se cargan los favoritos inicialmente
window.addEventListener('favoritesLoaded', () => {
    console.log('💚 Favoritos cargados, actualizando botón...');
    updateFavoriteButtonState();
});

console.log('✅ producto-detalle-api.js cargado correctamente');