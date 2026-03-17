// ================================================================
// NOVEDADES Y NOTIFICACIONES - GESTOR DE VISIBILIDAD
// ================================================================
// Este archivo maneja la visibilidad y funcionalidad de los botones
// de Novedades y Notificaciones según el estado de autenticación
// ================================================================

console.log('📰 novedades-notificaciones.js cargando...');

const NovedadesNotificacionesManager = {
    debug: true,

    log: function(message, type = 'info') {
        if (!this.debug) return;
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
        };
        console.log(`${emoji[type] || 'ℹ️'} [NOVEDADES] ${message}`);
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
        // NUEVO: obtener rol del usuario
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
            } else {
                btnNovedades.style.display = 'none';
                popupNovedades.style.display = 'none';
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

    // Función para cerrar todos los popups
    const cerrarPopups = () => {
        if (popupNovedades) popupNovedades.style.display = 'none';
        if (popupNotificaciones) popupNotificaciones.style.display = 'none';
    };

    // Evento para abrir/cerrar popup de Novedades
    btnNovedades.addEventListener("click", (e) => {
        e.stopPropagation();
        const estabaOculto = popupNovedades.style.display === 'none' || popupNovedades.style.display === '';
        cerrarPopups();
        if (estabaOculto) {
            popupNovedades.style.display = 'block';
            this.cargarCampanas();
        }
        this.log('Popup Novedades toggled', 'info');
    });

    // Evento para abrir/cerrar popup de Notificaciones
    btnNotificaciones.addEventListener("click", (e) => {
        e.stopPropagation();
        const estabaOculto = popupNotificaciones.style.display === 'none' || popupNotificaciones.style.display === '';
        cerrarPopups();
        if (estabaOculto) {
            popupNotificaciones.style.display = 'block';
        }
        this.log('Popup Notificaciones toggled', 'info');
    });

    // Cerrar popups al hacer click afuera
    document.addEventListener("click", () => {
        cerrarPopups();
    });

    this.log('Event listeners inicializados correctamente', 'success');
},

 // Función para cargar campañas desde la API — NUEVO
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

        lista.innerHTML = data.data.map(c => {
            const style = CAMPAIGN_STYLES[c.type] || CAMPAIGN_STYLES.general;
            const fecha = new Date(c.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
            return `
                <div class="p-4 hover:bg-gray-50 transition">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-xs font-medium ${style.color}">${style.label}</span>
                        <span class="text-xs text-gray-400">${fecha}</span>
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

    /**
     * 🚀 Inicializa el gestor
     */
    init: function() {
        this.log('Inicializando NovedadesNotificacionesManager', 'info');

        // Esperar a que authAPI esté disponible
        const checkAuthAPI = setInterval(() => {
            if (typeof authAPI !== 'undefined') {
                clearInterval(checkAuthAPI);
                this.actualizarVisibilidad();
                this.inicializarEventos();
                this.log('NovedadesNotificacionesManager inicializado correctamente', 'success');
            }
        }, 100);

        // Timeout de seguridad
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
