// =============================================
// PRODUCTO-DETALLE-API.JS (VERSIÓN OPTIMIZADA)
// =============================================

console.log('📄 Cargando Producto Detalle...');

let currentProduct = null;

/**
 * 📡 Carga los datos desde la URL y llama a la API
 */
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showErrorPage('Producto no encontrado');
        return;
    }

    showLoadingState(true);
    
    try {
        if (typeof api === 'undefined') throw new Error('API no disponible');
        
        const response = await api.getProduct(productId);
        currentProduct = response.data;
        
        renderProductDetails(currentProduct);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showErrorPage('No pudimos cargar el producto.');
    } finally {
        showLoadingState(false);
    }
}

/**
 * 🎨 Distribuye los datos en el HTML
 */
function renderProductDetails(product) {
    // 1. Imagen Principal
    const img = document.getElementById('product-image');
    if (img) img.src = product.mainImage || 'https://via.placeholder.com/400?text=Grow+House';

    // 2. Título y Precio
    const title = document.getElementById('product-name');
    if (title) title.textContent = product.name;

    const priceContainer = document.getElementById('product-price-container');
    if (priceContainer) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        priceContainer.innerHTML = hasDiscount 
            ? `<div class="flex flex-col">
                <span class="text-4xl font-bold text-green-700">${formatPrice(product.price)}</span>
                <span class="text-sm text-gray-400 line-through">${formatPrice(product.originalPrice)}</span>
               </div>`
            : `<span class="text-4xl font-bold text-green-800">${formatPrice(product.price)}</span>`;
    }

    // 3. IA Info y Cuidados
    renderIASections(product);
}

/**
 * 🌱 Renderiza las secciones de Cuidado e Información IA
 */
function renderIASections(product) {
    const sections = document.querySelectorAll('details');
    
    sections.forEach(section => {
        const title = section.querySelector('summary')?.textContent.toLowerCase();
        const content = section.querySelector('div');
        if (!content) return;

        if (title.includes('información')) {
            content.innerHTML = `<p class="text-gray-700">${product.aiInfo?.generalInfo || product.description || 'Sin descripción disponible.'}</p>`;
        }

        if (title.includes('cuidado') && product.aiInfo?.careGuide) {
            const care = product.aiInfo.careGuide;
            const careItems = [
                { icon: '☀️', label: 'Luz', val: care.luz },
                { icon: '💧', label: 'Riego', val: care.riego },
                { icon: '🌡️', label: 'Clima', val: care.temperatura }
            ].filter(item => item.val && !item.val.toLowerCase().includes('no aplica'));

            content.innerHTML = careItems.map(item => `
                <div class="flex items-start gap-3 mb-2">
                    <span>${item.icon}</span>
                    <p><strong>${item.label}:</strong> ${item.val}</p>
                </div>
            `).join('');
        }
    });
}

// --- UTILIDADES ---

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

function showLoadingState(show) {
    const container = document.querySelector('.container-details');
    if (container) container.style.opacity = show ? '0.5' : '1';
}

function showErrorPage(msg) {
    const container = document.querySelector('.container-details');
    if (container) {
        container.innerHTML = `<div class="text-center py-20">
            <h2 class="text-2xl font-bold mb-4">${msg}</h2>
            <a href="productos.html" class="text-green-600 underline">Volver al catálogo</a>
        </div>`;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', loadProductDetails);