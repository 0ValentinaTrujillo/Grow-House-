// ============================================
// CARRITO.JS - VERSIÓN MEJORADA Y OPTIMIZADA
// ============================================

console.log('🛒 carrito.js cargando...');

// =============================================
// 1. CONFIGURACIÓN MEJORADA
// =============================================

const btn = document.querySelector('.add-to-cart-btn');
const CART_CONFIG = {
    storage: {
        cartKey: 'Grow-House-cart' // 
    },
    shipping: {
        freeThreshold: 100000, // $100.000 envío gratis
        standardCost: 10000 // $10.000 envío
    },
    taxes: {
        rate: 0.19 // 19% IVA
    },
    currency: {
        symbol: '$',
        locale: 'es-CO'
    },
    promoCodes: {
        'DESCUENTO10': { type: 'percentage', value: 10, minAmount: 50000 },
        'ENVIOGRATIS': { type: 'freeShipping', value: 0, minAmount: 30000 },
        'BIENVENIDO': { type: 'percentage', value: 15, minAmount: 80000 },
        'MAKEUPPRO20': { type: 'percentage', value: 20, minAmount: 100000 }, // Nuevo código
        'PRIMERACOMPRA': { type: 'percentage', value: 12, minAmount: 40000 } // Nuevo código
    },
    animations: {
        duration: 300,
        enabled: true
    }
};

// Variables globales
let cartItems = [];
let appliedPromo = null;
let isUpdating = false; // Para evitar updates múltiples

function getCartKey() {
    try {
        const token = localStorage.getItem('growhouse-auth-token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id || payload._id || payload.sub;
            return `${CART_CONFIG.storage.cartKey}-${userId}`;
        }
    } catch (e) {}
    return `${CART_CONFIG.storage.cartKey}-guest`;
}

// =============================================
// 2. FUNCIONES DE UTILIDAD MEJORADAS
// =============================================

function formatPrice(price) {
    const formatted = new Intl.NumberFormat(CART_CONFIG.currency.locale).format(price);
    return `${CART_CONFIG.currency.symbol}${formatted}`;
}

function showNotification(message, type = 'success', duration = 1000) {
    // Remover notificaciones existentes
    const existingNotifications = document.querySelectorAll('.cart-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `cart-notification fixed top-20 right-4 z-40 max-w-sm p-4 rounded-xl shadow-2xl text-white font-medium transform transition-all duration-300 ease-in-out translate-x-full ${
        type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
        type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
        type === 'info' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
        'bg-gradient-to-r from-green-500 to-green-600'
    }`;

    // Agregar icono según el tipo
    const icon = type === 'error' ? '❌' :
                type === 'warning' ? '⚠️' :
                type === 'info' ? 'ℹ️' : '✅';

    notification.innerHTML = `
        <div class="flex items-center">
            <span class="text-lg mr-2">${icon}</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Animación de entrada
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    // Auto-remove con animación
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, duration);

    return notification;
}

function animateElement(element, animation = 'fadeIn') {
    if (!CART_CONFIG.animations.enabled || !element) return;
    
    element.style.opacity = '0';
    element.style.transform = animation === 'slideIn' ? 'translateX(-20px)' : 'scale(0.9)';
    
    requestAnimationFrame(() => {
        element.style.transition = `all ${CART_CONFIG.animations.duration}ms ease-out`;
        element.style.opacity = '1';
        element.style.transform = 'translateX(0) scale(1)';
    });
}

// =============================================
// 3. GESTIÓN MEJORADA DEL CARRITO
// =============================================

function loadCart() {
    try {
        const saved = localStorage.getItem(CART_CONFIG.storage.cartKey);
        cartItems = saved ? JSON.parse(saved) : [];
        return cartItems;
    } catch (error) {
        console.error('❌ Error cargando carrito:', error);
        cartItems = [];
        showNotification('Error cargando el carrito', 'error');
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(getCartKey(), JSON.stringify(cartItems));
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { items: cartItems, total: calculateTotal() } 
        }));
    } catch (error) {
        console.error('❌ Error guardando carrito:', error);
    }
}

// FUNCIÓN GLOBAL mejorada para agregar al carrito
window.addToCart = function(product) {
    if (isUpdating) return false;
    isUpdating = true;
    
    console.log('➕ Agregando producto al carrito:', product);
    
    try {
        const existing = cartItems.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity += 1;
            showNotification(`${product.name} agregado (${existing.quantity})`, 'success');
        } else {
            const newItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
                quantity: 1,
                addedAt: new Date().toISOString()
            };
            
            cartItems.push(newItem);
            showNotification(`${product.name} agregado al carrito`, 'success');
            
            // Animar contador si es visible
            const counter = document.getElementById('cart-counter');
            if (counter && counter.style.display !== 'none') {
                counter.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    counter.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        saveCart();
        updateCartCounter();
        
        return cartItems.length;
        
    } catch (error) {
        console.error('❌ Error agregando al carrito:', error);
        showNotification('Error agregando producto', 'error');
        return false;
    } finally {
        setTimeout(() => { isUpdating = false; }, 300);
    }
};

function removeFromCart(productId) {
    if (isUpdating) return;
    isUpdating = true;
    
    const index = cartItems.findIndex(item => item.id === productId);
    if (index > -1) {
        const item = cartItems[index];
        
        // Animar salida del elemento
        const element = document.querySelector(`[data-id="${productId}"]`);
        if (element) {
            element.style.transform = 'translateX(-100%)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                cartItems.splice(index, 1);
                saveCart();
                showNotification(`${item.name} eliminado del carrito`, 'warning');
                renderCartPage();
                isUpdating = false;
            }, 300);
        } else {
            cartItems.splice(index, 1);
            saveCart();
            showNotification(`${item.name} Eliminado del carrito`, 'warning');
            renderCartPage();
            isUpdating = false;
        }
    }
}

function updateQuantity(productId, newQuantity) {
    if (isUpdating) return;
    
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            const oldQuantity = item.quantity;
            item.quantity = newQuantity;
            
            // Mostrar feedback visual
            if (newQuantity > oldQuantity) {
                showNotification(`Cantidad aumentada: ${item.name}`, 'info', 1500);
            } else {
                showNotification(`Cantidad reducida: ${item.name}`, 'info', 1500);
            }
            
            saveCart();
            renderCartPage();
        }
    }
}

function clearCart() {
    if (cartItems.length === 0) {
        showNotification('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cartItems = [];
        appliedPromo = null;
        saveCart();
        showNotification('Carrito vaciado', 'warning');
        renderCartPage();
    }
}

function loadCart() {
    try {
        const key = getCartKey();
        const saved = localStorage.getItem(key);
        cartItems = saved ? JSON.parse(saved) : [];
        return cartItems;
    } catch (error) {
        cartItems = [];
        return [];
    }
}

// =============================================
// 4. FUNCIONES DE CÁLCULO (sin cambios)
// =============================================

function calculateSubtotal() {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function calculateShipping(subtotal) {
    if (appliedPromo && appliedPromo.type === 'freeShipping') {
        return 0;
    }
    return subtotal >= CART_CONFIG.shipping.freeThreshold ? 0 : CART_CONFIG.shipping.standardCost;
}

function calculateTaxes(subtotal) {
    return Math.round(subtotal * CART_CONFIG.taxes.rate);
}

function calculateDiscount(subtotal) {
    if (!appliedPromo) return 0;

    if (appliedPromo.type === 'percentage') {
        return Math.round(subtotal * (appliedPromo.value / 100));
    }
    if (appliedPromo.type === 'fixed') {
        return Math.min(appliedPromo.fixedDiscount || appliedPromo.value, subtotal);
    }
    if (appliedPromo.type === 'freeShipping') {
        return 0;
    }
    return 0;
}

function calculateTotal() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const taxes = calculateTaxes(subtotal);
    const discount = calculateDiscount(subtotal);
    
    return Math.max(0, subtotal + shipping + taxes - discount);
}

// =============================================
// 5. ACTUALIZAR CONTADOR MEJORADO
// =============================================

function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        
        if (totalItems > 0) {
            counter.textContent = totalItems > 99 ? '99+' : totalItems;
            counter.style.display = 'flex';
            
            // Agregar clase de pulso si no la tiene
            if (!counter.classList.contains('cart-counter-pulse')) {
                counter.classList.add('cart-counter-pulse');
            }
        } else {
            counter.style.display = 'none';
            counter.classList.remove('cart-counter-pulse');
        }
    }
}

// =============================================
// 6. RENDERIZADO MEJORADO DE LA PÁGINA
// =============================================

function createCartItemHTML(item) {
    return `
        <div class="bg-white rounded-xl shadow-lg p-6 cart-item product-hover" data-id="${item.id}">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <!-- Imagen del producto mejorada -->
                <div class="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative group">
                    <img src="${item.image}" alt="${item.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                         onerror="this.src='https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600'">
                    <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
                
                <!-- Información del producto -->
                <div class="flex-grow min-w-0">
                    <h3 class="text-lg font-semibold text-gray-900 truncate mb-1">${item.name}</h3>
                    <p class="text-gray-600 text-sm">${formatPrice(item.price)} cada uno</p>
                    <p class="text-lg font-bold text-green-800 mt-1">Total: ${formatPrice(item.price * item.quantity)}</p>
                    ${item.addedAt ? `<p class="text-xs text-gray-400 mt-1">Agregado: ${new Date(item.addedAt).toLocaleDateString()}</p>` : ''}
                </div>
                
                <!-- Controles de cantidad mejorados -->
                <div class="flex items-center gap-3">
                    <!-- BOTÓN MENOS -->
                    <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" 
                            class="quantity-button w-10 h-10 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all duration-200 transform hover:scale-110" 
                            title="Disminuir cantidad">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                        </svg>
                    </button>
                    
                    <!-- CANTIDAD ACTUAL con mejor diseño -->
                    <div class="bg-gray-100 px-4 py-2 rounded-lg">
                        <span class="text-lg font-bold text-gray-800">${item.quantity}</span>
                    </div>
                    
                    <!-- BOTÓN MÁS -->
                    <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})" 
                            class="quantity-button w-10 h-10 rounded-full bg-gray-200 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-all duration-200 transform hover:scale-110" 
                            title="Aumentar cantidad">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </button>
                    
                    <!-- BOTÓN ELIMINAR mejorado -->
                    <button onclick="removeFromCart('${item.id}')" 
                            class="ml-4 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-110 hover:rotate-3"
                            title="Eliminar producto">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderCartPage() {
    const emptyCart = document.getElementById('empty-cart');
    const cartContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const continueShopping = document.getElementById('continue-shopping');
    
    if (cartItems.length === 0) {
        // Mostrar carrito vacío
        if (emptyCart) {
            emptyCart.classList.remove('hidden');
            animateElement(emptyCart);
        }
        if (cartContainer) cartContainer.classList.add('hidden');
        if (cartSummary) cartSummary.classList.add('hidden');
        if (continueShopping) continueShopping.classList.add('hidden');
    } else {
        // Mostrar carrito con productos
        if (emptyCart) emptyCart.classList.add('hidden');
        if (cartContainer) {
            cartContainer.classList.remove('hidden');
            cartContainer.innerHTML = cartItems.map(createCartItemHTML).join('');
            
            // Animar cada elemento
            cartContainer.querySelectorAll('.cart-item').forEach((item, index) => {
                setTimeout(() => animateElement(item, 'slideIn'), index * 100);
            });
        }
        if (cartSummary) {
            cartSummary.classList.remove('hidden');
            animateElement(cartSummary);
        }
        if (continueShopping) continueShopping.classList.remove('hidden');
        
        // Actualizar resumen
        updateSummary();
    }
    
    updateCartCounter();
}

function updateSummary() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const taxes = calculateTaxes(subtotal);
    const discount = calculateDiscount(subtotal);
    const total = calculateTotal();
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Actualizar elementos del DOM con animaciones
    const elements = {
        'summary-items-count': totalItems,
        'summary-subtotal': formatPrice(subtotal),
        'summary-shipping': shipping === 0 ? 'Gratis ✨' : formatPrice(shipping),
        'summary-taxes': formatPrice(taxes),
        'summary-total': formatPrice(total)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // Animar cambio de valor
            element.style.transform = 'scale(1.1)';
            element.textContent = value;
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 150);
        }
    });
    
    // Mostrar/ocultar descuento
    const discountRow = document.getElementById('discount-row');
    const discountElement = document.getElementById('summary-discount');
    
    if (appliedPromo && discount > 0) {
        if (discountRow) {
            discountRow.classList.remove('hidden');
            animateElement(discountRow);
        }
        if (discountElement) {
            discountElement.textContent = `-${formatPrice(discount)}`;
        }
    } else {
        if (discountRow) discountRow.classList.add('hidden');
    }
    
    // Mensaje de envío gratis
    updateShippingMessage(subtotal);
}

function updateShippingMessage(subtotal) {
    const shippingElement = document.getElementById('summary-shipping');
    if (!shippingElement) return;
    
    const remaining = CART_CONFIG.shipping.freeThreshold - subtotal;
    
    if (remaining > 0 && remaining < 50000) {
        // Mostrar cuánto falta para envío gratis
        const parent = shippingElement.parentElement;
        let messageElement = parent.querySelector('.shipping-message');
        
        if (!messageElement) {
            messageElement = document.createElement('p');
            messageElement.className = 'shipping-message text-xs text-green-700 mt-1';
            parent.appendChild(messageElement);
        }
        
        messageElement.textContent = `¡Agrega ${formatPrice(remaining)} más para envío gratis!`;
    }
}

// =============================================
// 7. CÓDIGOS DE DESCUENTO MEJORADOS
// =============================================

async function applyPromoCode(code) {
    const promoCode = code.toUpperCase().trim();
    const messageElement = document.getElementById('promo-message');
    const applyBtn = document.getElementById('apply-promo');

    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Validando...';
    }

    try {
        const token = localStorage.getItem('growhouse-auth-token');
        const subtotal = calculateSubtotal();

        const res = await fetch(window.GROW_HOUSE_API + '/admin/coupons/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                code: promoCode,
                userId: authAPI.getUser()?.id,
                orderValue: subtotal
            })
        });

        const data = await res.json();

        if (!data.success) {
            showMessage(messageElement, data.message, 'error');
            showNotification(data.message, 'error');
            return;
        }

        // Guardar promo aplicada
        appliedPromo = {
            type: data.data.discountType === 'percentage' ? 'percentage' : 'fixed',
            value: data.data.discountType === 'percentage'
                ? data.data.discount / subtotal * 100
                : data.data.discount,
            fixedDiscount: data.data.discount,
            code: data.data.code
        };

        showMessage(messageElement, `✨ ${promoCode} aplicado: -$${new Intl.NumberFormat('es-CO').format(data.data.discount)}`, 'success');
        showNotification(`¡Descuento ${promoCode} aplicado!`, 'success');
        updateSummary();

        const promoInput = document.getElementById('promo-code');
        if (promoInput) promoInput.value = '';

    } catch (error) {
        console.error('❌ Error validando cupón:', error);
        showNotification('Error al validar el cupón', 'error');
    } finally {
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.textContent = 'Aplicar';
        }
    }
}

function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `text-sm mt-2 ${type === 'error' ? 'text-red-600' : 'text-green-600'}`;
        element.classList.remove('hidden');
        
        // Animar mensaje
        element.style.opacity = '0';
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 300ms ease-in-out';
            element.style.opacity = '1';
        });
        
        // Auto-hide después de 5 segundos
        if (type === 'error') {
            setTimeout(() => {
                if (element && !message.includes('aplicado')) {
                    element.style.opacity = '0';
                    setTimeout(() => element.classList.add('hidden'), 300);
                }
            }, 5000);
        }
    }
}

// =============================================
// 8. EVENT LISTENERS MEJORADOS
// =============================================

function setupEventListeners() {
    console.log('🔧 Configurando event listeners mejorados...');
    
    // Botón aplicar promoción
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoCodeInput = document.getElementById('promo-code');
    
    if (applyPromoBtn && promoCodeInput) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoCodeInput.value.trim();
            if (code) {
                applyPromoCode(code);
            } else {
                showNotification('Ingresa un código de descuento', 'warning');
                promoCodeInput.focus();
            }
        });
        
        // Enter en campo de promoción
        promoCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const code = promoCodeInput.value.trim();
                if (code) {
                    applyPromoCode(code);
                }
            }
        });
        
        // Autocompletar códigos disponibles
        promoCodeInput.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            const codes = Object.keys(CART_CONFIG.promoCodes);
            const matches = codes.filter(code => code.startsWith(value));
            
            // Aquí podrías mostrar sugerencias (feature future)
        });
    }
    
    // Botón checkout mejorado
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cartItems.length === 0) {
                showNotification('Tu carrito está vacío', 'warning');
                return;
            }

            // 🔐 Verificar autenticación ANTES de proceder
            if (!authAPI.isAuthenticated()) {
                document.getElementById('modal-auth-required').classList.remove('hidden');
                return; // ← Detiene todo aquí
            }

            // Loading state
            checkoutBtn.classList.add('loading');
            checkoutBtn.innerHTML = '<span>Procesando...</span>';

            const orderData = {
                items: cartItems,
                subtotal: calculateSubtotal(),
                shipping: calculateShipping(calculateSubtotal()),
                taxes: calculateTaxes(calculateSubtotal()),
                discount: calculateDiscount(calculateSubtotal()),
                total: calculateTotal(),
                appliedPromo: appliedPromo,
                timestamp: new Date().toISOString(),
                customerData: {}
            };

            console.log('📋 Datos del pedido:', orderData);
            showNotification('Redirigiendo a checkout...', 'info');

            setTimeout(() => {
                sessionStorage.setItem('growhouse-order-data', JSON.stringify(orderData));
                window.location.href = 'checkout.html';
            }, 1000);
        });
    }
    
    // Agregar botón para vaciar carrito
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Vaciar Carrito';
    clearBtn.className = 'mt-2 text-sm text-gray-500 hover:text-red-600 transition-colors duration-200';
    clearBtn.addEventListener('click', clearCart);
    
    if (checkoutBtn && checkoutBtn.parentElement) {
        checkoutBtn.parentElement.insertBefore(clearBtn, checkoutBtn.nextSibling);
    }

    // Cerrar modal auth
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            document.getElementById('modal-auth-required').classList.add('hidden');
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('modal-auth-required')?.classList.add('hidden');
        }
    });
    
        const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            document.getElementById('modal-auth-required').classList.add('hidden');
        });
    }
    
    console.log('✅ Event listeners configurados correctamente');
}

// =============================================
// 10. INICIALIZACIÓN COMPLETA MEJORADA
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de carrito mejorado...');
    
    try {
        // Cargar datos del carrito
        loadCart();
        console.log(`📦 Carrito cargado con ${cartItems.length} productos`);
        
        // Configurar event listeners
        setupEventListeners();
        
        // Renderizar página si estamos en carrito.html
        if (window.location.pathname.includes('carrito.html')) {
            console.log('📄 Renderizando página del carrito...');
            renderCartPage();
        }
        
        // Actualizar contador en todas las páginas
        updateCartCounter();
        
        // Event listener para cambios de storage (sincronización entre pestañas)
        window.addEventListener('storage', (e) => {
            if (e.key === CART_CONFIG.storage.cartKey) {
                loadCart();
                updateCartCounter();
                if (window.location.pathname.includes('carrito.html')) {
                    renderCartPage();
                }
                showNotification('Carrito sincronizado', 'info', 2000);
            }
        });
        
        // Custom event listener para integración con otras partes de la app
        window.addEventListener('cartUpdated', (e) => {
            console.log('🔄 Carrito actualizado:', e.detail);
            updateCartCounter();
        });
        
        console.log('✅ Sistema de carrito inicializado correctamente');
        console.log(`📊 Estado: ${cartItems.length} productos, total: ${formatPrice(calculateTotal())}`);
        
        // Mensaje de ayuda para testing mejorado
        if (window.location.pathname.includes('carrito.html') && cartItems.length === 0) {
            console.log('%c💡 FUNCIONES DE TESTING DISPONIBLES:', 'color: #10B981; font-weight: bold; font-size: 16px;');
            console.log('%c   cartDebug.addTestProducts() - Agregar 3 productos premium', 'color: #6B7280; font-size: 14px;');
            console.log('%c   cartDebug.addSingleTestProduct() - Agregar 1 producto aleatorio', 'color: #6B7280; font-size: 14px;');
            console.log('%c   cartDebug.simulateUserInteraction() - Simulación completa de usuario', 'color: #6B7280; font-size: 14px;');
            console.log('%c   cartDebug.clearCart() - Vaciar carrito', 'color: #6B7280; font-size: 14px;');
            console.log('%c   cartDebug.testAnimations() - Probar animaciones', 'color: #6B7280; font-size: 14px;');
            console.log('%c   cartDebug.toggleAnimations() - Activar/desactivar animaciones', 'color: #6B7280; font-size: 14px;');
        }
        
    } catch (error) {
        console.error('❌ Error inicializando carrito:', error);
        showNotification('Error inicializando carrito', 'error');
    }
});

// Funciones globales adicionales para compatibilidad
window.updateCartDisplay = updateCartCounter;
window.getCartItemCount = () => cartItems.reduce((total, item) => total + item.quantity, 0);
window.getCartTotal = () => calculateTotal();

// Función para integración con main.js mejorada
window.refreshCart = () => {
    loadCart();
    updateCartCounter();
    if (window.location.pathname.includes('carrito.html')) {
        renderCartPage();
    }
};

console.log('🎉 carrito.js MEJORADO cargado exitosamente ✅');