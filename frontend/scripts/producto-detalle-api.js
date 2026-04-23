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
        // (Catálogo) se removieron comentarios y favoritos
        
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
 * Actualizar información del producto con IA y calificaciones
 * Incluye manejo de calificaciones previas del usuario
 */
function updateProductInfo(product) {
    // ── Nombre ──
    document.querySelectorAll('h2').forEach(el => {
        if (el.textContent.includes('Cargando')) {
            el.textContent = product.name;
        }
    });

    // ── Precio ──
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
                </div>`;
        } else {
            priceContainer.textContent = formatPrice(product.price);
        }
    }

    // ── Estrellas ──
    if (typeof renderStarsInteractive === 'function') {
        renderStarsInteractive(
            product._id || product.id,
            product.rating?.average || 0,
            product.rating?.count   || 0
        );
    }

// ── INFORMACIÓN GENERAL ──
    const allDetails = document.querySelectorAll('details');
    
    allDetails.forEach(detail => {
        const summary = detail.querySelector('summary span');
        if (!summary) return;
        const title = summary.textContent.trim().toLowerCase();

        // Sección "Información"
        if (title.includes('información')) {
            const infoContent = detail.querySelector('div');
            if (infoContent) {
                const aiText = product.aiInfo?.generalInfo;
                if (aiText) {
                    infoContent.innerHTML = `<p class="text-gray-700 leading-relaxed">${aiText}</p>`;
                } else if (product.description) {
                    infoContent.innerHTML = `<p class="text-gray-700 leading-relaxed">${product.description}</p>`;
                }
            }
        }

        // Sección "Guía de cuidado"
        if (title.includes('cuidado')) {
            const careContent = detail.querySelector('div');
            if (careContent) {
                const care = product.aiInfo?.careGuide;

                if (care) {
                    const noAplica = (val) => !val || val.toLowerCase().includes('no aplica');
                    const rows = [
                        { icon: '☀️', label: 'Luz',        value: care.luz },
                        { icon: '💧', label: 'Riego',       value: care.riego },
                        { icon: '🌱', label: 'Suelo',       value: care.suelo },
                        { icon: '🌡️', label: 'Temperatura', value: care.temperatura },
                        { icon: '💡', label: 'Consejos',    value: care.consejos }
                    ].filter(r => !noAplica(r.value));

                    if (rows.length > 0) {
                        careContent.innerHTML = rows.map(r => `
                            <div class="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                                <span class="text-xl flex-shrink-0">${r.icon}</span>
                                <div>
                                    <span class="font-semibold text-gray-800">${r.label}:</span>
                                    <span class="text-gray-600 ml-1">${r.value}</span>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        careContent.innerHTML = `<p class="text-gray-500 italic text-sm">Información de cuidado no disponible.</p>`;
                    }
                }
            }
        }
    });
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

console.log('✅ producto-detalle-api.js cargado correctamente');