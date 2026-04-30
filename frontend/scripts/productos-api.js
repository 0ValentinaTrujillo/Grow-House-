// =============================================
// PRODUCTOS API - CARGAR DESDE MONGODB
// Grow House - Conexión Frontend con Backend
// =============================================

console.log('🛍️ Inicializando productos-api.js');

// =============================================
// ESTADO GLOBAL
// =============================================

let allProductsFromAPI = [];
let currentFilters = {
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sortBy: 'newest',
    page: 1,
    limit: 12
};

// =============================================
// FUNCIÓN PRINCIPAL: CARGAR PRODUCTOS
// =============================================

async function loadProductsFromAPI() {
    console.log('📡 Cargando productos desde MongoDB...');
    
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) return;
    
    // Mostrar loading
    showLoadingState(productsGrid);
    
    try {
        // Llamar a la API con filtros actuales
        const response = await api.getProducts(currentFilters);
        
        console.log('✅ Productos cargados:', response);
        
        // Guardar productos
        allProductsFromAPI = response.data || [];
        
        // Renderizar productos
        if (allProductsFromAPI.length === 0) {
            showEmptyState(productsGrid);
        } else {
            renderProducts(allProductsFromAPI, productsGrid);
            updatePaginationInfo(response.pagination);
        }
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showErrorState(productsGrid, error.message);
    }
}

// =============================================
// RENDERIZAR PRODUCTOS
// =============================================

function renderProducts(products, container) {
    container.innerHTML = '';
    
    products.forEach(producto => {
        const productCard = createProductCard(producto);
        container.appendChild(productCard);
    });
    
    console.log(`✅ ${products.length} productos renderizados`);
}

// =============================================
// CREAR TARJETA DE PRODUCTO - VERSIÓN CORREGIDA
// =============================================

function createProductCard(producto) {
    const card = document.createElement('div');
    card.className = 'product-card hover-lift rounded-2xl overflow-hidden shadow-lg group flex flex-col h-full';
    card.setAttribute('data-product-id', producto.id || producto._id);

    const hasDiscount = producto.originalPrice && producto.originalPrice > producto.price;
    const discountPercent = hasDiscount
        ? Math.round(((producto.originalPrice - producto.price) / producto.originalPrice) * 100)
        : 0;

    const shortDescription = producto.description && producto.description.length > 80
        ? producto.description.substring(0, 80) + '...'
        : producto.description || 'Sin descripción';

    const imagen = producto.mainImage || producto.images?.[0] || 'https://via.placeholder.com/400';

    card.innerHTML = `
        <div class="relative flex-shrink-0">
            <div class="bg-white relative overflow-hidden" style="height: 280px;">
                <img src="${imagen}" alt="${producto.name}"
                     class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105">
                ${hasDiscount ? `
                    <div class="absolute top-3 right-3">
                        <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow">
                            -${discountPercent}%
                        </span>
                    </div>
                ` : ''}
                ${producto.featured ? `
                    <div class="absolute top-3 left-3">
                        <span class="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full font-semibold shadow">
                            ⭐ Popular
                        </span>
                    </div>
                ` : ''}
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
            </div>
        </div>

        <div class="p-5 flex flex-col flex-1">
            <div class="flex items-center mb-2">
                ${renderStarsReadOnly(producto.rating?.average, producto.rating?.count)}
            </div>

            <h3 class="text-base font-bold mb-2 text-gray-800 group-hover:text-green-800 transition-colors duration-300 leading-snug"
                style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6rem;">
                ${producto.name}
            </h3>

            <p class="text-gray-500 text-sm leading-relaxed mb-3"
               style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.5rem;">
                ${shortDescription}
            </p>

            <div class="flex items-center justify-between mb-4 mt-auto">
                <div class="price-highlight text-xl font-bold">
                    ${producto.formattedPrice || formatPrice(producto.price)}
                </div>
                ${hasDiscount ? `
                    <div class="text-sm text-gray-400 line-through">
                        ${formatPrice(producto.originalPrice)}
                    </div>
                ` : ''}
            </div>

            <div class="flex gap-2">
                <button onclick="viewProductDetail('${producto.id || producto._id}')"
                    class="ver-detalles-btn border border-green-700 text-green-700 bg-transparent px-3 py-2 rounded-lg hover:bg-green-50 transition duration-300 text-sm text-center flex-1 font-medium">
                    Ver Detalles
                </button>
            </div>
        </div>
    `;

    return card;
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// =============================================
// ESTADOS DE UI
// =============================================

function showLoadingState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-green-800 mb-4"></div>
            <p class="text-gray-600 text-lg">Cargando productos desde MongoDB...</p>
        </div>
    `;
}

function showEmptyState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <svg class="w-24 h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No se encontraron productos</h3>
            <p class="text-gray-600 mb-4">Intenta con otros filtros o crea productos en Postman</p>
            <button onclick="resetFilters()" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
                Limpiar filtros
            </button>
        </div>
    `;
}

function showErrorState(container, errorMessage) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <svg class="w-24 h-24 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Error al cargar productos</h3>
            <p class="text-gray-600 mb-4">${errorMessage}</p>
            <p class="text-sm text-gray-500 mb-4">Verifica que el backend esté corriendo en http://localhost:5000</p>
            <button onclick="loadProductsFromAPI()" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
                Reintentar
            </button>
        </div>
    `;
}

function updatePaginationInfo(pagination) {
    console.log('📄 Paginación:', pagination);
    // Aquí puedes actualizar la UI de paginación si existe
}

// =============================================
// VER DETALLE DE PRODUCTO - ACTUALIZADO ✨
// =============================================

async function viewProductDetail(productId) {
    console.log('👁️ Navegando a detalle del producto:', productId);
    
    // Verificar que el ID existe
    if (!productId || productId === 'undefined') {
        console.error('❌ ID de producto inválido:', productId);
        showNotification('❌ Error: ID de producto inválido', 'error');
        return;
    }
    
    // Redirigir a la página de detalle con el ID
    window.location.href = `producto-detalle.html?id=${productId}`;
    
    console.log('✅ Redirigiendo a producto-detalle.html?id=' + productId);
}

// =============================================
// NOTIFICACIÓN TOAST
// =============================================

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Crear notificación toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-700'
    } text-white`;
    toast.textContent = message;
    toast.style.animation = 'slideInRight 0.3s ease-out';
    
    document.body.appendChild(toast);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =============================================
// RESETEAR FILTROS
// =============================================

function resetFilters() {
    currentFilters = {
        category: '',
        brand: '',
        minPrice: '',
        maxPrice: '',
        search: '',
        sortBy: 'newest',
        page: 1,
        limit: 12
    };
    
    loadProductsFromAPI();
}

// =============================================
// INICIALIZACIÓN
// =============================================

// Cargar productos cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductsFromAPI);
} else {
    loadProductsFromAPI();
}

console.log('✅ productos-api.js cargado y listo');