// =============================================
// RATING.JS - Sistema de calificación de estrellas
// Grow House Ecommerce
// =============================================

console.log('⭐ Inicializando rating.js');

// =============================================
// RENDERIZAR ESTRELLAS (solo lectura) - para tarjetas
// Recibe: average (ej: 4.3), count (ej: 12)
// Retorna: HTML string
// =============================================

function renderStarsReadOnly(average = 0, count = 0) {
    const rounded = Math.round(average * 2) / 2; // redondear a 0.5
    let starsHTML = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rounded)) {
            // Estrella llena
            starsHTML += `<svg class="w-4 h-4 text-yellow-400 fill-current inline-block" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>`;
        } else if (i - 0.5 === rounded) {
            // Media estrella
            starsHTML += `<svg class="w-4 h-4 inline-block" viewBox="0 0 20 20">
                <defs>
                    <linearGradient id="half-${i}">
                        <stop offset="50%" stop-color="#FBBF24"/>
                        <stop offset="50%" stop-color="#D1D5DB"/>
                    </linearGradient>
                </defs>
                <path fill="url(#half-${i})" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>`;
        } else {
            // Estrella vacía
            starsHTML += `<svg class="w-4 h-4 text-gray-300 fill-current inline-block" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>`;
        }
    }

    const countText = count > 0
        ? `<span class="text-gray-500 text-sm ml-1">(${count})</span>`
        : `<span class="text-gray-400 text-sm ml-1">Sin reseñas</span>`;

    return `<div class="flex items-center gap-0.5">${starsHTML}${countText}</div>`;
}

// =============================================
// RENDERIZAR ESTRELLAS INTERACTIVAS - para detalle
// Recibe: productId, average actual, count actual
// =============================================

function renderStarsInteractive(productId, average = 0, count = 0) {
    const container = document.getElementById('stars-container');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-4">

            <!-- Resumen actual -->
            <div class="flex items-center gap-3">
                <div id="stars-readonly-detail" class="flex items-center gap-0.5">
                    ${renderStarsReadOnly(average, count)}
                </div>
            </div>

            <!-- Selector de estrellas interactivo -->
            <div class="bg-white border border-gray-200 rounded-xl p-4">
                <p class="text-sm font-semibold text-gray-700 mb-3">¿Qué te pareció este producto?</p>

                <div class="flex items-center gap-1 mb-3" id="star-selector">
                    ${[1,2,3,4,5].map(i => `
                        <button
                            type="button"
                            class="star-btn transition-all duration-150 hover:scale-125 focus:outline-none"
                            data-value="${i}"
                            aria-label="${i} estrellas"
                            onmouseover="highlightStars(${i})"
                            onmouseout="resetStarHighlight()"
                            onclick="selectRating(${i})">
                            <svg class="w-8 h-8 star-icon text-gray-300 fill-current transition-colors duration-150" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                        </button>
                    `).join('')}
                    <span id="rating-label" class="ml-3 text-sm text-gray-400 italic min-w-[120px]"></span>
                </div>

                <button
                    id="submit-rating-btn"
                    onclick="submitRating('${productId}')"
                    disabled
                    class="px-5 py-2 bg-green-800 text-white text-sm font-semibold rounded-lg
                           hover:bg-green-900 transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed
                           hover:not(:disabled):shadow-md">
                    Enviar calificación
                </button>

                <p id="rating-feedback" class="mt-2 text-sm hidden"></p>
            </div>
        </div>
    `;
}

// =============================================
// VARIABLES DE ESTADO
// =============================================

let selectedRating = 0;

const ratingLabels = {
    1: 'Muy malo ',
    2: 'Regular 😐',
    3: 'Bueno 🙂',
    4: 'Muy bueno 😊',
    5: '¡Excelente! 🌟'
};

// =============================================
// HOVER: iluminar estrellas
// =============================================

function highlightStars(upTo) {
    document.querySelectorAll('.star-btn').forEach(btn => {
        const val = Number(btn.dataset.value);
        const icon = btn.querySelector('.star-icon');
        if (val <= upTo) {
            icon.classList.remove('text-gray-300');
            icon.classList.add('text-yellow-400');
        } else {
            icon.classList.add('text-gray-300');
            icon.classList.remove('text-yellow-400');
            // mantener seleccionadas si había selección previa
            if (selectedRating && val <= selectedRating) {
                icon.classList.remove('text-gray-300');
                icon.classList.add('text-yellow-400');
            }
        }
    });

    const label = document.getElementById('rating-label');
    if (label) label.textContent = ratingLabels[upTo] || '';
}

// =============================================
// RESET HOVER (volver a selección actual)
// =============================================

function resetStarHighlight() {
    document.querySelectorAll('.star-btn').forEach(btn => {
        const val = Number(btn.dataset.value);
        const icon = btn.querySelector('.star-icon');
        if (selectedRating && val <= selectedRating) {
            icon.classList.remove('text-gray-300');
            icon.classList.add('text-yellow-400');
        } else {
            icon.classList.add('text-gray-300');
            icon.classList.remove('text-yellow-400');
        }
    });

    const label = document.getElementById('rating-label');
    if (label) {
        label.textContent = selectedRating ? ratingLabels[selectedRating] : '';
    }
}

// =============================================
// SELECCIONAR RATING (click)
// =============================================

function selectRating(value) {
    selectedRating = value;
    resetStarHighlight();

    const btn = document.getElementById('submit-rating-btn');
    if (btn) btn.disabled = false;
}

// =============================================
// ENVIAR CALIFICACIÓN AL BACKEND
// =============================================

async function submitRating(productId) {
    if (!selectedRating) return;

    const btn = document.getElementById('submit-rating-btn');
    const feedback = document.getElementById('rating-feedback');

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${BASE_URL}/products/${productId}/rating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') && {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                })
            },
            body: JSON.stringify({ rating: selectedRating })
        });

        const data = await response.json();

        if (data.success) {
            // Actualizar el resumen de estrellas visualmente
            const readonlyEl = document.getElementById('stars-readonly-detail');
            if (readonlyEl) {
                readonlyEl.innerHTML = renderStarsReadOnly(data.data.average, data.data.count);
            }

            // Mostrar mensaje de éxito
            feedback.className = 'mt-2 text-sm text-green-700 font-medium';
            feedback.textContent = `✅ ${data.message} Nuevo promedio: ${data.data.average} ⭐`;
            feedback.classList.remove('hidden');

            // Bloquear para no votar dos veces
            document.getElementById('star-selector').innerHTML = `
                <p class="text-sm text-green-700 font-semibold">
                    ✅ ¡Gracias por tu calificación de ${selectedRating} ${selectedRating === 1 ? 'estrella' : 'estrellas'}!
                </p>`;
            btn.classList.add('hidden');

        } else {
            feedback.className = 'mt-2 text-sm text-red-600 font-medium';
            feedback.textContent = `❌ ${data.message || 'No se pudo registrar la calificación'}`;
            feedback.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Enviar calificación';
        }

    } catch (error) {
        console.error('❌ Error al enviar rating:', error);
        feedback.className = 'mt-2 text-sm text-red-600 font-medium';
        feedback.textContent = '❌ Error de conexión. Verifica que el servidor esté activo.';
        feedback.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Enviar calificación';
    }
}

console.log('✅ rating.js listo');