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
        // Verificar si authAPI está disponible
        if (typeof authAPI === 'undefined') {
            this.log('authAPI no está disponible', 'warning');
            return;
        }

        const isAuthenticated = authAPI.isAuthenticated();
        this.log(`Actualizando visibilidad - Autenticado: ${isAuthenticated}`, 'info');

        // Obtener elementos del DOM
        const btnNovedades = document.getElementById("btnNovedades");
        const popupNovedades = document.getElementById("popupNovedades");
        const btnNotificaciones = document.getElementById("btnNotificaciones");
        const popupNotificaciones = document.getElementById("popupNotificaciones");

        // Actualizar visibilidad de Novedades
        if (btnNovedades && popupNovedades) {
            if (isAuthenticated) {
                btnNovedades.style.display = ''; // Mostrar
                popupNovedades.style.display = ''; // Mostrar
                this.log('Botón Novedades: VISIBLE ✅', 'success');
            } else {
                btnNovedades.style.display = 'none'; // Ocultar
                popupNovedades.style.display = 'none'; // Ocultar
                popupNovedades.classList.add('hidden'); // Asegurar que esté oculto
                this.log('Botón Novedades: OCULTO ❌', 'warning');
            }
        }

        // Actualizar visibilidad de Notificaciones
        if (btnNotificaciones && popupNotificaciones) {
            if (isAuthenticated) {
                btnNotificaciones.style.display = ''; // Mostrar
                popupNotificaciones.style.display = ''; // Mostrar
                this.log('Botón Notificaciones: VISIBLE ✅', 'success');
            } else {
                btnNotificaciones.style.display = 'none'; // Ocultar
                popupNotificaciones.style.display = 'none'; // Ocultar
                popupNotificaciones.classList.add('hidden'); // Asegurar que esté oculto
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
            if (popupNovedades) popupNovedades.classList.add("hidden");
            if (popupNotificaciones) popupNotificaciones.classList.add("hidden");
        };

        // Evento para abrir/cerrar popup de Novedades
        btnNovedades.addEventListener("click", (e) => {
            e.stopPropagation();
            cerrarPopups();
            popupNovedades.classList.toggle("hidden");
            this.log('Popup Novedades toggled', 'info');
        });

        // Evento para abrir/cerrar popup de Notificaciones
        btnNotificaciones.addEventListener("click", (e) => {
            e.stopPropagation();
            cerrarPopups();
            popupNotificaciones.classList.toggle("hidden");
            this.log('Popup Notificaciones toggled', 'info');
        });

        // Cerrar popups al hacer click afuera
        document.addEventListener("click", () => {
            cerrarPopups();
        });

        this.log('Event listeners inicializados correctamente', 'success');
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
