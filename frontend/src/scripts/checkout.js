// =============================================
// CHECKOUT.JS - GROW HOUSE
// Conecta el formulario de checkout con el backend
// =============================================

console.log('🛒 checkout.js cargando...');

// =============================================
// CONFIGURACIÓN
// =============================================

const CHECKOUT_CONFIG = {
    apiUrl: 'http://localhost:5000/api',
    cartKey: 'Grow-House-cart-data',
    tokenKey: 'growhouse-auth-token',
    currency: { locale: 'es-CO', symbol: '$' },
    shipping: {
        standard: { cost: 0,     label: 'Envío Estándar',   days: '5-7 días hábiles' },
        express:  { cost: 25000, label: 'Envío Express',     days: '2-3 días hábiles' },
        overnight:{ cost: 50000, label: 'Envío Inmediato',   days: '24-48 horas'      }
    },
    taxRate: 0.19
};

// =============================================
// ESTADO GLOBAL
// =============================================

let currentStep = 1;
let checkoutCartItems = [];
let checkoutData = {
    personal: {},
    shipping: {},
    payment:  {}
};

// =============================================
// UTILIDADES
// =============================================

function formatPrice(amount) {
    return '$' + new Intl.NumberFormat(CHECKOUT_CONFIG.currency.locale).format(amount);
}

function getToken() {
    return localStorage.getItem(CHECKOUT_CONFIG.tokenKey);
}

function getCart() {
    try {
        const saved = localStorage.getItem(CHECKOUT_CONFIG.cartKey);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function showNotification(message, type = 'success') {
    const existing = document.querySelectorAll('.checkout-notification');
    existing.forEach(n => n.remove());

    const colors = {
        success: 'bg-green-600',
        error:   'bg-red-600',
        warning: 'bg-yellow-500',
        info:    'bg-blue-500'
    };
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const div = document.createElement('div');
    div.className = `checkout-notification fixed top-4 right-4 z-50 ${colors[type] || colors.info} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all duration-300`;
    div.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(div);

    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 3500);
}

// =============================================
// CÁLCULOS
// =============================================

function getShippingCost() {
    const method = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    return CHECKOUT_CONFIG.shipping[method]?.cost ?? 0;
}

function calculateTotals() {
    const subtotal = checkoutCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = getShippingCost();
    const taxes    = Math.round(subtotal * CHECKOUT_CONFIG.taxRate);
    const total    = subtotal + shipping + taxes;
    return { subtotal, shipping, taxes, total };
}

// =============================================
// RENDERIZAR RESUMEN DEL PEDIDO (sidebar)
// =============================================

function renderOrderSummary() {
    const container = document.getElementById('checkout-cart-items');
    if (!container) return;

    if (checkoutCartItems.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-gray-500">
                <p>Tu carrito está vacío</p>
                <a href="index.html" class="text-green-700 font-medium mt-2 block">← Volver a la tienda</a>
            </div>`;
        return;
    }

    container.innerHTML = checkoutCartItems.map(item => `
        <div class="flex items-center space-x-3 border-b border-gray-200 pb-4">
            <div class="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img src="${item.image}" alt="${item.name}"
                     class="w-full h-full object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200'">
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">${item.name}</p>
                <p class="text-xs text-gray-500">Cant: ${item.quantity}</p>
            </div>
            <span class="font-bold text-gray-800 text-sm">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    updateTotalsDisplay();
}

function updateTotalsDisplay() {
    const { subtotal, shipping, taxes, total } = calculateTotals();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('subtotal',      formatPrice(subtotal));
    set('shipping-cost', shipping === 0 ? 'Gratis' : formatPrice(shipping));
    set('taxes',         formatPrice(taxes));
    set('total',         formatPrice(total));
}

// =============================================
// NAVEGACIÓN ENTRE PASOS
// =============================================

function goToStep(step) {
    // Ocultar paso actual
    document.getElementById(`step-${currentStep}`)?.classList.add('hidden');

    // Mostrar nuevo paso
    document.getElementById(`step-${step}`)?.classList.remove('hidden');

    // Actualizar indicadores visuales
    for (let i = 1; i <= 4; i++) {
        const indicator = document.querySelector(`.step-indicator[data-step="${i}"]`);
        if (!indicator) continue;
        if (i < step) {
            indicator.className = 'w-8 h-8 rounded-full bg-green-800 text-white flex items-center justify-center text-sm font-bold step-indicator';
            indicator.innerHTML = '✓';
        } else if (i === step) {
            indicator.className = 'w-8 h-8 rounded-full bg-green-800 text-white flex items-center justify-center text-sm font-bold step-indicator';
        } else {
            indicator.className = 'w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold step-indicator';
        }
        // Restaurar número en pasos futuros
        if (i > step && i < 4) indicator.textContent = i;
    }

    // Barras de progreso
    for (let i = 1; i <= 3; i++) {
        const bar = document.getElementById(`progress-bar-${i}`);
        if (bar) bar.style.width = i < step ? '100%' : '0%';
    }

    // Botones de navegación
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');

    if (prevBtn) prevBtn.classList.toggle('hidden', step === 1);
    if (nextBtn) {
        if (step === 4) {
            nextBtn.classList.add('hidden');
        } else if (step === 3) {
            nextBtn.textContent = 'Confirmar Pedido ✓';
            nextBtn.classList.remove('hidden');
            nextBtn.className = 'bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition duration-300';
        } else {
            nextBtn.textContent = 'Continuar →';
            nextBtn.classList.remove('hidden');
            nextBtn.className = 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300';
        }
    }

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// VALIDACIONES POR PASO
// =============================================

function validateStep1() {
    const form = document.getElementById('personal-info-form');
    const firstName = form.querySelector('[name="firstName"]').value.trim();
    const lastName  = form.querySelector('[name="lastName"]').value.trim();
    const email     = form.querySelector('[name="email"]').value.trim();
    const phone     = form.querySelector('[name="phone"]').value.trim();

    if (!firstName || !lastName) { showNotification('Ingresa tu nombre completo', 'warning'); return false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification('Ingresa un email válido', 'warning'); return false; }
    if (!phone) { showNotification('Ingresa tu número de teléfono', 'warning'); return false; }

    checkoutData.personal = { firstName, lastName, email, phone };
    return true;
}

function validateStep2() {
    const form       = document.getElementById('shipping-form');
    const address    = form.querySelector('[name="address"]').value.trim();
    const complement = form.querySelector('[name="addressComplement"]')?.value.trim() || '';
    const shipping   = form.querySelector('input[name="shipping"]:checked')?.value || 'standard';

    if (!address) { showNotification('Ingresa tu dirección', 'warning'); return false; }

    checkoutData.shipping = {
        address,
        complement,
        city:           'Pital',
        state:          'Huila',
        country:        'Colombia',
        zipCode:        '',
        shippingMethod: shipping
    };
    updateTotalsDisplay();
    return true;
}

function validateStep3() {
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!method) { showNotification('Selecciona un método de pago', 'warning'); return false; }

    checkoutData.payment = { method };
    return true;
}

// =============================================
// ENVIAR PEDIDO AL BACKEND
// =============================================

async function submitOrder() {
    const token = getToken();
    if (!token) {
        showNotification('Debes iniciar sesión para completar tu compra', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const { subtotal, shipping, taxes, total } = calculateTotals();
    const { personal, shipping: shippingData, payment } = checkoutData;

    // Mapear método de pago al enum del backend
    const paymentMethodMap = {
        card:     'credit_card',
        paypal:   'pse',
        transfer: 'bank_transfer'
    };

    const orderPayload = {
        products: checkoutCartItems.map(item => ({
            product:  item.id,
            quantity: item.quantity,
            price:    item.price,
            name:     item.name,
            image:    item.image || ''
        })),
        shippingAddress: {
            firstName: personal.firstName,
            lastName:  personal.lastName,
            email:     personal.email,
            phone:     personal.phone,
            street:    shippingData.address,
            city:      shippingData.city,       // 'Pital'
            state:     shippingData.state,      // 'Huila' 
            zipCode:   shippingData.zipCode || '',
            country:   shippingData.country     // 'Colombia'
        },
        paymentMethod:  paymentMethodMap[payment.method] || 'bank_transfer',
        shippingMethod: shippingData.shippingMethod || 'standard',
        totals: {
            subtotal,
            tax:      taxes,
            shipping,
            discount: 0,
            total
        }
    };

    // Mostrar loading en el botón
    const nextBtn = document.getElementById('next-step-btn');
    const originalText = nextBtn?.textContent;
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Procesando...';
        nextBtn.className = 'bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed';
    }

    try {
        console.log('📦 Enviando pedido al backend:', orderPayload);

        const response = await fetch(`${CHECKOUT_CONFIG.apiUrl}/orders`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderPayload)
        });

        const result = await response.json();
        console.log('✅ Respuesta del backend:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Error al crear el pedido');
        }

        // ✅ PEDIDO CREADO EXITOSAMENTE
        const order = result.data || result.order || result;

        // Limpiar carrito
        localStorage.removeItem(CHECKOUT_CONFIG.cartKey);

        // Mostrar paso de confirmación
        showConfirmation(order);
        goToStep(4);
        showNotification('¡Pedido confirmado exitosamente!', 'success');

    } catch (error) {
        console.error('❌ Error enviando pedido:', error);
        showNotification(error.message || 'Error al procesar tu pedido. Intenta de nuevo.', 'error');

        // Restaurar botón
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = originalText;
            nextBtn.className = 'bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition duration-300';
        }
    }
}

// =============================================
// MOSTRAR CONFIRMACIÓN
// =============================================

function showConfirmation(order) {
    const orderNumber = order.orderNumber || order._id || 'GH-' + Date.now();
    const orderDate   = new Date().toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const el = (id) => document.getElementById(id);
    if (el('order-number')) el('order-number').textContent = '#' + orderNumber;
    if (el('order-date'))   el('order-date').textContent   = orderDate;

    // Ocultar botones de navegación en la confirmación
    const prevBtn = document.getElementById('prev-step-btn');
    if (prevBtn) prevBtn.classList.add('hidden');
}

// =============================================
// INICIALIZAR LISTENERS DE ENVÍO
// =============================================

function setupShippingListeners() {
    const radios = document.querySelectorAll('input[name="shipping"]');
    radios.forEach(radio => {
        radio.addEventListener('change', updateTotalsDisplay);
    });
}

// =============================================
// INICIALIZACIÓN PRINCIPAL
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando checkout...');

    // 1. Cargar carrito
    checkoutCartItems = getCart();

    if (checkoutCartItems.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }

    // 2. Renderizar resumen
    renderOrderSummary();

    // 3. Listeners de envío
    setupShippingListeners();

    // 4. Botón SIGUIENTE / CONFIRMAR
    const nextBtn = document.getElementById('next-step-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            if (currentStep === 1 && validateStep1()) goToStep(2);
            else if (currentStep === 2 && validateStep2()) goToStep(3);
            else if (currentStep === 3 && validateStep3()) await submitOrder();
        });
    }

    // 5. Botón ANTERIOR
    const prevBtn = document.getElementById('prev-step-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) goToStep(currentStep - 1);
        });
    }

    // 6. Pre-rellenar email si el usuario está logueado
    try {
        const token = getToken();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const emailInput = document.querySelector('#personal-info-form [name="email"]');
            if (emailInput && payload.email) emailInput.value = payload.email;
        }
    } catch { /* token inválido, ignorar */ }

    console.log(`✅ Checkout listo con ${checkoutCartItems.length} productos`);
});