// =============================================
// PRODUCTOS API - CARGAR DESDE MONGODB
// Grow House - Conexión Frontend con Backend
// =============================================

console.log('🛍️ Inicializando productos-api.js');

let allProductsFromAPI = [];
let searchTimeout = null;
let currentFilters = {
    category: '',
    search:   '',
    sortBy:   'newest',
    page:     1,
    limit:    12
};

// ── Alias para compatibilidad con productos.html ───────────────────────────
function cargarProducts(page = 1) {
    currentFilters.page = page;
    loadProductsFromAPI();
}

// ── Cargar productos ───────────────────────────────────────────────────────
async function loadProductsFromAPI() {
    console.log('📡 Cargando productos desde MongoDB...');

    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    showLoadingState(productsGrid);

    try {
        const response = await api.getProducts(currentFilters);
        console.log('✅ Productos cargados:', response);

        allProductsFromAPI = response.data || [];
        const pagination   = response.pagination || {};

        if (allProductsFromAPI.length === 0) {
            showEmptyState(productsGrid, currentFilters.search, currentFilters.category);
        } else {
            renderProducts(allProductsFromAPI, productsGrid);
            renderPagination(pagination);
        }

    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showErrorState(productsGrid, error.message);
    }
}

// ── Renderizar productos ───────────────────────────────────────────────────
function renderProducts(products, container) {
    container.innerHTML = '';
    products.forEach(producto => container.appendChild(createProductCard(producto)));
}

// ── Crear tarjeta ──────────────────────────────────────────────────────────
function createProductCard(producto) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer';
    card.setAttribute('data-product-id', producto.id || producto._id);
    card.onclick = () => window.location.href = `producto-detalle.html?id=${producto.id || producto._id}`;

    const hasDiscount    = producto.originalPrice && producto.originalPrice > producto.price;
    const discountPercent = hasDiscount
        ? Math.round(((producto.originalPrice - producto.price) / producto.originalPrice) * 100) : 0;

    const shortDescription = producto.description && producto.description.length > 80
        ? producto.description.substring(0, 80) + '...'
        : producto.description || 'Sin descripción';

    const imagen = producto.mainImage || '../assets/images/placeholder.png';

    card.innerHTML = `
        <div class="relative h-56 overflow-hidden">
            <img src="${imagen}" alt="${producto.name}"
                 class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
            ${hasDiscount ? `
                <div class="absolute top-3 right-3">
                    <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow">
                        -${discountPercent}%
                    </span>
                </div>` : ''}
            ${producto.featured ? `
                <div class="absolute top-3 left-3">
                    <span class="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full font-semibold shadow">
                        ⭐ Popular
                    </span>
                </div>` : ''}
        </div>
        <div class="p-5 flex flex-col flex-grow" style="font-family:'Poppins',sans-serif;">
            <h3 class="font-bold text-gray-800 text-lg mb-1">${producto.name}</h3>
            <p class="text-gray-500 text-xs mb-4 line-clamp-2">${shortDescription}</p>
            <div class="mt-auto">
                <span class="text-xl font-black text-green-800">
                    ${producto.formattedPrice || formatPrice(producto.price)}
                </span>
                ${hasDiscount ? `
                    <span class="text-sm text-gray-400 line-through ml-2">
                        ${formatPrice(producto.originalPrice)}
                    </span>` : ''}
            </div>
        </div>
    `;
    return card;
}

// ── Paginación ─────────────────────────────────────────────────────────────
function renderPagination(pagination) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    const { page = 1, pages = 1, total = 0 } = pagination;

    if (pages <= 1) { container.innerHTML = ''; return; }

    let html = `<nav class="flex items-center gap-2">`;

    html += `<button onclick="cargarProducts(${page - 1})" ${page <= 1 ? 'disabled' : ''}
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-green-800 hover:text-white
               disabled:opacity-40 disabled:cursor-not-allowed transition">
        Anterior
    </button>`;

    for (let i = 1; i <= pages; i++) {
        html += `<button onclick="cargarProducts(${i})"
            class="px-4 py-2 rounded-lg transition ${i === page
                ? 'bg-green-800 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}">
            ${i}
        </button>`;
    }

    html += `<button onclick="cargarProducts(${page + 1})" ${page >= pages ? 'disabled' : ''}
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-green-800 hover:text-white
               disabled:opacity-40 disabled:cursor-not-allowed transition">
        Siguiente
    </button></nav>`;

    container.innerHTML = html;
}

// ── Estados UI ─────────────────────────────────────────────────────────────
function showLoadingState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-green-800 mb-4"></div>
            <p class="text-gray-600 text-lg">Cargando productos...</p>
        </div>`;
}

function showEmptyState(container, search = '', category = '') {
    // Mensaje diferente según si hay búsqueda o categoría activa
    const msg = search
        ? category
            ? `No encontramos "<strong>${search}</strong>" en esta categoría.`
            : `No encontramos resultados para "<strong>${search}</strong>".`
        : 'No hay productos disponibles.';

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p class="text-gray-500 text-lg mb-4">${msg}</p>
            <button onclick="limpiarBusqueda()"
                class="bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-6 rounded-full transition">
                Ver todos los productos
            </button>
        </div>`;
}

function showErrorState(container, errorMessage) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16">
            <p class="text-gray-500 text-lg mb-4">Error al cargar productos.</p>
            <button onclick="loadProductsFromAPI()"
                class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
                Reintentar
            </button>
        </div>`;
}

// ── Limpiar búsqueda ───────────────────────────────────────────────────────
function limpiarBusqueda() {
    currentFilters.search = '';
    currentFilters.page   = 1;
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    loadProductsFromAPI();
}

// ── Utilidades ─────────────────────────────────────────────────────────────
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
}

function resetFilters() {
    currentFilters = { category: '', search: '', sortBy: 'newest', page: 1, limit: 12 };
    loadProductsFromAPI();
}

function viewProductDetail(productId) {
    if (!productId || productId === 'undefined') return;
    window.location.href = `producto-detalle.html?id=${productId}`;
}

// ── Init ───────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProductsFromAPI);
} else {
    loadProductsFromAPI();
}

console.log('✅ productos-api.js cargado y listo');