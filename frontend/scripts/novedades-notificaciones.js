// ================================================================
// NOVEDADES Y NOTIFICACIONES - GESTOR DE VISIBILIDAD
// ================================================================
// Este archivo maneja la visibilidad y funcionalidad de los botones
// de Novedades y Notificaciones según el estado de autenticación
// ================================================================

console.log('📰 novedades-notificaciones.js cargando...');

const NovedadesNotificacionesManager = {
    debug: true,
    STORAGE_KEY: 'novedades-last-seen',
    POLL_INTERVAL: 5 * 60 * 1000, // 5 minutos
    _pollTimer: null,

    log: function(message, type = 'info') {
        if (!this.debug) return;
        const emoji = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
        console.log(`${emoji[type] || 'ℹ️'} [NOVEDADES] ${message}`);
    },

    // ── Cierra TODOS los menús del header a la vez ──
    cerrarTodosLosMenus: function() {
        const popupNovedades      = document.getElementById('popupNovedades');
        const popupNotificaciones = document.getElementById('popupNotificaciones');
        const userDropdown        = document.getElementById('user-dropdown');
        if (popupNovedades)      popupNovedades.style.display = 'none';
        if (popupNotificaciones) popupNotificaciones.style.display = 'none';
        if (userDropdown)        userDropdown.classList.add('hidden');
    },

    // ── Inyecta el badge en el botón sin tocar los 18 HTMLs ──
    inyectarBadge: function() {
        const btn = document.getElementById('btnNovedades');
        if (!btn || document.getElementById('badgeNovedades')) return;
        const badge = document.createElement('span');
        badge.id = 'badgeNovedades';
        badge.style.cssText = [
            'display:none',
            'position:absolute',
            'top:-7px',
            'right:-10px',
            'background:#ef4444',
            'color:#fff',
            'border-radius:9999px',
            'font-size:10px',
            'font-weight:700',
            'min-width:18px',
            'height:18px',
            'line-height:18px',
            'text-align:center',
            'padding:0 4px',
            'pointer-events:none',
            'z-index:10'
        ].join(';');
        btn.style.position = 'relative';
        btn.appendChild(badge);
        this.log('Badge inyectado en btnNovedades', 'success');
    },

    // ── Muestra u oculta el badge con el conteo ──
    actualizarBadge: function(count) {
        const badge = document.getElementById('badgeNovedades');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    },

    // ── Marca las novedades como vistas (guarda timestamp actual) ──
    marcarComoVistas: function() {
        localStorage.setItem(this.STORAGE_KEY, new Date().toISOString());
        this.actualizarBadge(0);
        this.log('Novedades marcadas como vistas', 'success');
    },

    // ── Consulta campañas y actualiza el badge ──
    verificarNovedades: async function() {
        const token = localStorage.getItem('growhouse-auth-token');
        if (!token) return;

        try {
            const res = await fetch(window.GROW_HOUSE_API + '/admin/marketing/campaigns/public', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success) return;

            const lastSeen = localStorage.getItem(this.STORAGE_KEY);
            const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date(0);

            const nuevas = data.data.filter(c => new Date(c.createdAt) > lastSeenDate);
            this.actualizarBadge(nuevas.length);
            this.log(`Campañas nuevas: ${nuevas.length}`, 'info');
        } catch (err) {
            this.log('Error verificando novedades: ' + err.message, 'error');
        }
    },

    // ── Inicia el polling cada 5 minutos ──
    iniciarPolling: function() {
        if (this._pollTimer) clearInterval(this._pollTimer);
        this._pollTimer = setInterval(() => this.verificarNovedades(), this.POLL_INTERVAL);
        this.log('Polling iniciado cada 5 min', 'info');
    },

    /**
     * ✅ Actualiza la visibilidad de Novedades y Notificaciones
     * Se muestra solo si el usuario está autenticado
     */
    actualizarVisibilidad: function() {
        if (typeof authAPI === 'undefined') {
            this.log('authAPI no está disponible', 'warning');
            return;
        }

        const isAuthenticated = authAPI.isAuthenticated();
        const user = JSON.parse(localStorage.getItem('growhouse-user-data') || '{}');
        const isAdmin = user?.role === 'admin';

        this.log(`Autenticado: ${isAuthenticated} | Admin: ${isAdmin}`, 'info');

        const btnNovedades = document.getElementById("btnNovedades");
        const popupNovedades = document.getElementById("popupNovedades");
        const btnNotificaciones = document.getElementById("btnNotificaciones");
        const popupNotificaciones = document.getElementById("popupNotificaciones");

        // Novedades — visible solo si está autenticado Y no es admin
        if (btnNovedades && popupNovedades) {
            if (isAuthenticated && !isAdmin) {
                btnNovedades.style.display = '';
                this.log('Botón Novedades: VISIBLE ✅', 'success');
                // Verificar badge al mostrarse
                this.verificarNovedades();
                this.iniciarPolling();
            } else {
                btnNovedades.style.display = 'none';
                popupNovedades.style.display = 'none';
                if (this._pollTimer) clearInterval(this._pollTimer);
                this.log('Botón Novedades: OCULTO ❌', 'warning');
            }
        }

        // Notificaciones
        if (btnNotificaciones && popupNotificaciones) {
            if (isAuthenticated) {
                btnNotificaciones.style.display = '';
                this.log('Botón Notificaciones: VISIBLE ✅', 'success');
            } else {
                btnNotificaciones.style.display = 'none';
                popupNotificaciones.style.display = 'none';
                this.log('Botón Notificaciones: OCULTO ❌', 'warning');
            }
        }
    },

    /**
     * 🎯 Inicializa los event listeners
     */
    inicializarEventos: function() {
        const btnNovedades = document.getElementById("btnNovedades");
        const popupNovedades = document.getElementById("popupNovedades");
        const btnNotificaciones = document.getElementById("btnNotificaciones");
        const popupNotificaciones = document.getElementById("popupNotificaciones");

        if (!btnNovedades || !btnNotificaciones) {
            this.log('Botones de novedades/notificaciones no encontrados en el DOM', 'warning');
            return;
        }

        btnNovedades.addEventListener("click", (e) => {
            e.stopPropagation();
            const estabaOculto = popupNovedades.style.display === 'none' || popupNovedades.style.display === '';
            this.cerrarTodosLosMenus();
            if (estabaOculto) {
                popupNovedades.style.display = 'block';
                this.cargarCampanas();
                this.marcarComoVistas();
            }
            this.log('Popup Novedades toggled', 'info');
        });

        btnNotificaciones.addEventListener("click", (e) => {
            e.stopPropagation();
            const estabaOculto = popupNotificaciones.style.display === 'none' || popupNotificaciones.style.display === '';
            this.cerrarTodosLosMenus();
            if (estabaOculto) {
                popupNotificaciones.style.display = 'block';
            }
            this.log('Popup Notificaciones toggled', 'info');
        });

        document.addEventListener("click", () => {
            this.cerrarTodosLosMenus();
        });

        this.log('Event listeners inicializados correctamente', 'success');
    },

    // ── Carga y renderiza las campañas en el popup ──
    cargarCampanas: async function() {
        const lista = document.getElementById('novedadesLista');
        if (!lista) return;

        const token = localStorage.getItem('growhouse-auth-token');
        if (!token) return;

        lista.innerHTML = '<p class="text-sm text-gray-500 p-4">Cargando...</p>';

        const CAMPAIGN_STYLES = {
            nuevo_producto: { label: '🌱 Nuevo producto', color: 'text-green-600' },
            descuento:      { label: '🏷️ Descuento',      color: 'text-orange-500' },
            novedad:        { label: '✨ Novedad',         color: 'text-blue-500'  },
            general:        { label: '📢 General',         color: 'text-gray-500'  }
        };

        try {
            const res  = await fetch(window.GROW_HOUSE_API + '/admin/marketing/campaigns/public', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!data.success || data.data.length === 0) {
                lista.innerHTML = '<p class="text-sm text-gray-500 p-4">No hay novedades por ahora.</p>';
                return;
            }

            const lastSeen = localStorage.getItem(this.STORAGE_KEY);
            const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date(0);

            lista.innerHTML = data.data.map(c => {
                const style = CAMPAIGN_STYLES[c.type] || CAMPAIGN_STYLES.general;
                const fecha = new Date(c.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
                const esNueva = new Date(c.createdAt) > lastSeenDate;
                return `
                    <div class="p-4 hover:bg-gray-50 transition${esNueva ? ' bg-green-50' : ''}">
                        <div class="flex justify-between items-start mb-1">
                            <span class="text-xs font-medium ${style.color}">${style.label}</span>
                            <div class="flex items-center gap-2">
                                ${esNueva ? '<span class="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">Nuevo</span>' : ''}
                                <span class="text-xs text-gray-400">${fecha}</span>
                            </div>
                        </div>
                        <p class="text-sm font-semibold text-gray-800">${c.subject}</p>
                        <p class="text-xs text-gray-500 mt-1 line-clamp-2">${c.message}</p>
                    </div>`;
            }).join('');

        } catch (err) {
            lista.innerHTML = '<p class="text-sm text-gray-500 p-4">Error al cargar novedades.</p>';
            this.log('Error cargando campañas: ' + err.message, 'error');
        }
    },

    // ── Inyecta estilos mejorados para el popup de notificaciones ──
    inyectarEstilosNotificaciones: function() {
        if (document.getElementById('notif-styles')) return;
        const style = document.createElement('style');
        style.id = 'notif-styles';
        style.textContent = `
            /* ── Posicionamiento base para páginas sin CSS propio ── */
            #popupNovedades, #popupNotificaciones {
                position: fixed !important;
                top: 76px !important;
                z-index: 99999 !important;
                width: 360px;
                max-width: calc(100vw - 2rem);
                border-radius: 1rem;
                overflow: hidden;
            }
            #popupNovedades {
                left: 50%;
                transform: translateX(-50%);
            }
            #popupNotificaciones {
                right: 1.5rem;
            }
            @media (max-width: 640px) {
                #popupNovedades, #popupNotificaciones {
                    left: 1rem !important;
                    right: 1rem !important;
                    width: auto !important;
                    transform: none !important;
                }
            }
            /* ── Diseño del popup de notificaciones ── */
            #popupNotificaciones {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 16px !important;
                box-shadow: 0 20px 48px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07) !important;
                padding: 0 !important;
                overflow: hidden !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
            #popupNotificaciones::before {
                content: '';
                position: absolute;
                top: -8px;
                right: 22px;
                width: 14px;
                height: 14px;
                background: #ffffff;
                border-left: 1px solid #e5e7eb;
                border-top: 1px solid #e5e7eb;
                transform: rotate(45deg);
                border-radius: 2px 0 0 0;
                z-index: 1;
            }
            .notif-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 18px 12px;
                border-bottom: 1px solid #f3f4f6;
                position: relative;
                z-index: 2;
                background: #fff;
            }
            .notif-header-left {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .notif-icon-wrap {
                width: 34px;
                height: 34px;
                background: linear-gradient(135deg, #16a34a, #15803d);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .notif-icon-wrap i {
                color: #fff;
                font-size: 14px;
            }
            .notif-title-wrap {
                display: flex;
                flex-direction: column;
                line-height: 1.2;
            }
            .notif-title-main {
                font-weight: 700;
                font-size: 14px;
                color: #111827;
            }
            .notif-title-sub {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 1px;
            }
            .notif-body {
                max-height: 300px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #d1fae5 transparent;
            }
            .notif-body::-webkit-scrollbar { width: 4px; }
            .notif-body::-webkit-scrollbar-track { background: transparent; }
            .notif-body::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 4px; }
            .notif-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 36px 24px;
                gap: 10px;
            }
            .notif-empty-icon-wrap {
                width: 60px;
                height: 60px;
                background: #f0fdf4;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notif-empty-icon-wrap i {
                font-size: 24px;
                color: #86efac;
            }
            .notif-empty-title {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin: 0;
            }
            .notif-empty-sub {
                font-size: 12px;
                color: #9ca3af;
                margin: 0;
                text-align: center;
                line-height: 1.5;
            }
            .notif-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 14px 18px;
                border-bottom: 1px solid #f9fafb;
                transition: background 0.15s;
                cursor: default;
            }
            .notif-item:last-child { border-bottom: none; }
            .notif-item:hover { background: #f9fafb; }
            .notif-item-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #16a34a;
                flex-shrink: 0;
                margin-top: 5px;
            }
            .notif-item-dot.leida { background: #d1d5db; }
            .notif-item-body { flex: 1; min-width: 0; }
            .notif-item-text {
                font-size: 13px;
                color: #374151;
                font-weight: 500;
                line-height: 1.4;
            }
            .notif-item-time {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 3px;
            }
            .notif-footer {
                padding: 10px 18px;
                border-top: 1px solid #f3f4f6;
                text-align: center;
                background: #fafafa;
            }
            .notif-footer span {
                font-size: 12px;
                color: #6b7280;
            }
        `;
        document.head.appendChild(style);
        this.log('Estilos de notificaciones inyectados', 'success');
    },

    // ── Reconstruye el HTML del popup con el nuevo diseño ──
    redisenarPopupNotificaciones: function() {
        const popup = document.getElementById('popupNotificaciones');
        if (!popup) return;

        popup.innerHTML = `
            <div class="notif-header">
                <div class="notif-header-left">
                    <div class="notif-icon-wrap">
                        <i class="fa-solid fa-bell"></i>
                    </div>
                    <div class="notif-title-wrap">
                        <span class="notif-title-main">Notificaciones</span>
                        <span class="notif-title-sub">Tu actividad reciente</span>
                    </div>
                </div>
            </div>
            <div class="notif-body" id="notificacionesLista">
                <div class="notif-empty">
                    <div class="notif-empty-icon-wrap">
                        <i class="fa-solid fa-bell-slash"></i>
                    </div>
                    <p class="notif-empty-title">Todo al día</p>
                    <p class="notif-empty-sub">No tienes notificaciones<br>por el momento</p>
                </div>
            </div>
            <div class="notif-footer">
                <span>Las notificaciones se actualizan automáticamente</span>
            </div>
        `;
        this.log('Popup notificaciones rediseñado', 'success');
    },

    /**
     * 🚀 Inicializa el gestor
     */
    init: function() {
        this.log('Inicializando NovedadesNotificacionesManager', 'info');

        this.inyectarBadge();
        this.inyectarEstilosNotificaciones();
        this.redisenarPopupNotificaciones();

        const checkAuthAPI = setInterval(() => {
            if (typeof authAPI !== 'undefined') {
                clearInterval(checkAuthAPI);
                this.actualizarVisibilidad();
                this.inicializarEventos();
                this.log('NovedadesNotificacionesManager inicializado correctamente', 'success');
            }
        }, 100);

        setTimeout(() => {
            clearInterval(checkAuthAPI);
            if (typeof authAPI !== 'undefined') {
                this.log('authAPI todavía no disponible después del timeout', 'warning');
            }
        }, 5000);
    }
};

// ================================================================
// EJECUTAR AL CARGAR EL DOM
// ================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        NovedadesNotificacionesManager.init();
    });
} else {
    // El DOM ya está cargado
    NovedadesNotificacionesManager.init();
}

// Exponer globalmente
window.NovedadesNotificacionesManager = NovedadesNotificacionesManager;

console.log('✅ novedades-notificaciones.js cargado correctamente');
