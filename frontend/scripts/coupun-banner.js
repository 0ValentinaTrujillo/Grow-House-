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
            btn.style.background = '#15803d';
            setTimeout(() => {
                btn.textContent = original;
                btn.style.background = '#166534';
            }, 2000);
        });
    },

    createBannerHTML(coupons) {
        if (coupons.length === 0) return '';

        const cards = coupons.map(c => `
            <div style="
                flex-shrink: 0;
                width: clamp(260px, 80vw, 320px);
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                border: 1px solid #dcfce7;
                padding: 14px;
                position: relative;
                overflow: hidden;
            ">
                <div style="position:absolute; top:0; left:0; width:4px; height:100%; background: linear-gradient(to bottom, #16a34a, #166534); border-radius:4px 0 0 4px;"></div>
                
                <div style="padding-left: 12px;">
                    <span style="display:inline-block; background:#dcfce7; color:#166534; font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; margin-bottom:8px;">
                        Cupón activo
                    </span>
                    
                    <p style="font-size:24px; font-weight:800; color:#166534; margin:0 0 4px;">
                        ${this.formatDiscount(c)}
                    </p>
                    
                    <p style="font-size:12px; color:#6b7280; margin:0 0 8px; line-height:1.4;">
                        ${c.description || 'Descuento especial'}
                    </p>
                    
                    ${c.minOrderValue ? `
                    <p style="font-size:11px; color:#9ca3af; margin:0 0 8px;">
                        Mínimo: $${new Intl.NumberFormat('es-CO').format(c.minOrderValue)}
                    </p>` : ''}
                    
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:nowrap; margin-bottom:8px;">
                        <code style="
                            flex: 1;
                            min-width: 0;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            background: #f3f4f6;
                            color: #166534;
                            font-weight: 700;
                            font-size: 11px;
                            padding: 6px 8px;
                            border-radius: 8px;
                            letter-spacing: 1.5px;
                            text-align: center;
                            font-family: monospace;
                            border: 1px dashed #86efac;
                        ">${c.code}</code>
                        <button onclick="CuponesBanner.copyCode('${c.code}', this)"
                            style="
                                flex-shrink: 0;
                                background: #166534;
                                color: white;
                                font-size: 11px;
                                font-weight: 600;
                                padding: 6px 12px;
                                border-radius: 8px;
                                border: none;
                                cursor: pointer;
                                white-space: nowrap;
                                transition: background 0.2s;
                            ">
                            Copiar
                        </button>
                    </div>
                    
                    <p style="font-size:11px; color:#9ca3af; margin:0;">
                        Vence: ${this.formatExpiry(c.expiryDate)}
                    </p>
                </div>
            </div>
        `).join('');

        return `
            <div id="cupones-banner" style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 9998;
                background: white;
                border-top: 2px solid #166534;
                border-radius: 16px 16px 0 0;
                box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
                transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
            ">
                <!-- Header -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 16px;
                    background: linear-gradient(to right, #166534, #15803d);
                    border-radius: 14px 14px 0 0;
                ">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:white; font-size:13px; font-weight:600;">
                            🎟️ Cupones disponibles para ti
                        </span>
                        <span style="background:white; color:#166534; font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px;">
                            ${coupons.length}
                        </span>
                    </div>
                    <button id="cupones-banner-close" style="
                        color: white;
                        background: rgba(255,255,255,0.15);
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        cursor: pointer;
                        padding: 2px 8px;
                        line-height: 1.4;
                        transition: background 0.2s;
                    ">✕</button>
                </div>

                <!-- Carrusel -->
                <div style="
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding: 14px 16px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                ">
                    ${cards}
                </div>

                <!-- Hint scroll en móvil -->
                <p style="font-size:11px; color:#9ca3af; text-align:center; padding:0 0 10px; margin:0;">
                    ← desliza para ver más cupones →
                </p>
            </div>

            <!-- Botón flotante para reabrir -->
            <button id="cupones-banner-toggle" style="
                display: none;
                position: fixed;
                bottom: 16px;
                left: 16px;
                z-index: 9997;
                background: #166534;
                color: white;
                font-size: 12px;
                font-weight: 600;
                padding: 8px 16px;
                border-radius: 999px;
                border: none;
                cursor: pointer;
                align-items: center;
                gap: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                transition: background 0.2s;
            ">
                🎟️ Ver cupones
                <span style="background:white; color:#166534; font-size:11px; font-weight:700; padding:1px 7px; border-radius:999px;">
                    ${coupons.length}
                </span>
            </button>
        `;
    },

    setupListeners() {
        const banner = document.getElementById('cupones-banner');
        const closeBtn = document.getElementById('cupones-banner-close');
        const toggleBtn = document.getElementById('cupones-banner-toggle');

        closeBtn?.addEventListener('click', () => {
            banner.style.transform = 'translateY(100%)';
            setTimeout(() => {
                toggleBtn.style.display = 'flex';
            }, 400);
        });

        toggleBtn?.addEventListener('click', () => {
            banner.style.transform = 'translateY(0)';
            toggleBtn.style.display = 'none';
        });
    },

    async init() {
        if (typeof authAPI === 'undefined' || !authAPI.isAuthenticated()) return;

        const coupons = await this.fetchCupones();
        if (coupons.length === 0) return;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.createBannerHTML(coupons);
        document.body.appendChild(wrapper);

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