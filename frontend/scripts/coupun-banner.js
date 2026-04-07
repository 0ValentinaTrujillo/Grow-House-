// =============================================
// CUPONES-BANNER.JS - BANNER FLOTANTE DE CUPONES
// =============================================

console.log('🎟️ cupones-banner.js cargando...');

const CuponesBanner = {

    apiURL: window.GROW_HOUSE_API + '/admin/coupons/public',

    async fetchCupones() {
        try {
            const token = localStorage.getItem('growhouse-auth-token');
            if (!token) return [];

            const res = await fetch(this.apiURL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            return data.success ? data.data : [];

        } catch (error) {
            console.error('❌ Error cargando cupones:', error);
            return [];
        }
    },

    formatDiscount(coupon) {
        if (coupon.discountType === 'percentage') return `${coupon.discountValue}% OFF`;
        return `$${new Intl.NumberFormat('es-CO').format(coupon.discountValue)} OFF`;
    },

    formatExpiry(date) {
        return new Date(date).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    },

    copyCode(code, btn) {
        navigator.clipboard.writeText(code).then(() => {
            const original = btn.textContent;
            btn.textContent = '¡Copiado!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove('bg-green-600');
            }, 2000);
        });
    },

    createBannerHTML(coupons) {
        if (coupons.length === 0) return '';

        const cards = coupons.map(c => `
            <div class="coupon-card flex-shrink-0 bg-white rounded-xl shadow-md border border-green-100 p-4 w-64 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-green-700"></div>
                <div class="pl-3">
                    <span class="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                        🎟️ Cupón activo
                    </span>
                    <p class="text-2xl font-extrabold text-green-700 mb-1">${this.formatDiscount(c)}</p>
                    <p class="text-gray-600 text-sm mb-3 leading-snug">${c.description || 'Descuento especial'}</p>
                    ${c.minOrderValue ? `<p class="text-xs text-gray-400 mb-2">Mínimo: $${new Intl.NumberFormat('es-CO').format(c.minOrderValue)}</p>` : ''}
                    <div class="flex items-center gap-2">
                        <code class="flex-1 bg-gray-100 text-green-800 font-bold text-sm px-3 py-1.5 rounded-lg tracking-widest text-center">
                            ${c.code}
                        </code>
                        <button onclick="CuponesBanner.copyCode('${c.code}', this)"
                            class="bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap">
                            Copiar
                        </button>
                    </div>
                    <p class="text-xs text-gray-400 mt-2">Vence: ${this.formatExpiry(c.expiryDate)}</p>
                </div>
            </div>
        `).join('');

        return `
            <div id="cupones-banner" class="fixed bottom-0 left-0 right-0 z-[9998] bg-white border-t-2 border-green-700 shadow-2xl"
                style="transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);">
                
                <!-- Header del banner -->
                <div class="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-green-800 to-green-600">
                    <div class="flex items-center gap-2">
                        <span class="text-white text-sm font-semibold">🎟️ Cupones disponibles para ti</span>
                        <span class="bg-white text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">${coupons.length}</span>
                    </div>
                    <button id="cupones-banner-close"
                        class="text-white hover:text-green-200 transition-colors text-lg font-bold leading-none">
                        ✕
                    </button>
                </div>

                <!-- Carrusel de cupones -->
                <div class="flex gap-4 overflow-x-auto px-4 py-4 scrollbar-hide"
                    style="scrollbar-width: none; -ms-overflow-style: none;">
                    ${cards}
                </div>
            </div>

            <!-- Botón para reabrir el banner -->
            <button id="cupones-banner-toggle"
                class="fixed bottom-4 left-4 z-[9997] hidden bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2">
                🎟️ Ver cupones <span class="bg-white text-green-800 text-xs font-bold px-1.5 rounded-full">${coupons.length}</span>
            </button>
        `;
    },

    setupListeners() {
        const banner = document.getElementById('cupones-banner');
        const closeBtn = document.getElementById('cupones-banner-close');
        const toggleBtn = document.getElementById('cupones-banner-toggle');

        // Cerrar banner
        closeBtn?.addEventListener('click', () => {
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => {
                toggleBtn.classList.remove('hidden');
                toggleBtn.classList.add('flex');
            }, 400);
        });

        // Reabrir banner
        toggleBtn?.addEventListener('click', () => {
            banner.style.transform = 'translateY(0)';
            toggleBtn.classList.add('hidden');
            toggleBtn.classList.remove('flex');
        });
    },

    async init() {
        // Solo mostrar si el usuario está logueado
        if (typeof authAPI === 'undefined' || !authAPI.isAuthenticated()) return;

        const coupons = await this.fetchCupones();
        if (coupons.length === 0) return;

        // Insertar banner en el DOM
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.createBannerHTML(coupons);
        document.body.appendChild(wrapper);

        // Animar entrada después de 1.5s
        setTimeout(() => {
            const banner = document.getElementById('cupones-banner');
            if (banner) banner.style.transform = 'translateY(0)';
        }, 1500);

        this.setupListeners();
        console.log(`✅ Banner de cupones cargado con ${coupons.length} cupones`);
    }
};

window.CuponesBanner = CuponesBanner;

document.addEventListener('DOMContentLoaded', () => CuponesBanner.init());

console.log('✅ cupones-banner.js cargado');