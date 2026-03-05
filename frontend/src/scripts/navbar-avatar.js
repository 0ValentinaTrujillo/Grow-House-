// =============================================
// NAVBAR-AVATAR.JS - Gestor de Avatar en Navbar
// Grow House - Muestra la imagen de perfil en el navbar
// =============================================

console.log('👤 Navbar Avatar Manager cargando...');

const NavbarAvatarManager = {
    /**
     * Inicializar
     */
    init: function() {
        console.log('🔧 Inicializando NavbarAvatarManager...');
        
        // Cargar al documento listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOMContentLoaded - Cargando avatar en navbar');
                this.load();
            });
        } else {
            // Si el DOM ya está cargado, cargar inmediatamente
            console.log('📄 DOM ya cargado - Cargando avatar en navbar inmediatamente');
            this.load();
        }
        
        // Escuchar cambios de perfil
        window.addEventListener('userProfileUpdated', () => {
            console.log('🔄 Evento userProfileUpdated - Actualizando navbar');
            this.load();
        });
        
        // Escuchar cambios de avatar
        window.addEventListener('avatarChanged', () => {
            console.log('🔄 Evento avatarChanged - Actualizando navbar');
            this.load();
        });
        
        // Escuchar cuando el usuario se autentica
        window.addEventListener('userAuthenticated', () => {
            console.log('🔄 Evento userAuthenticated - Actualizando navbar');
            this.load();
        });
        
        // Escuchar cambios de sesión
        window.addEventListener('sessionUpdated', () => {
            console.log('🔄 Evento sessionUpdated - Actualizando navbar');
            this.load();
        });
        
        console.log('✅ NavbarAvatarManager inicializado');
    },

    /**
     * Cargar y mostrar avatar
     */
    load: function () {
        try {
            if (!window.authAPI || !window.authAPI.isAuthenticated()) return;

            const user = window.authAPI.getUser();
            if (!user) return;

            const imgElements = document.querySelectorAll('#user-avatar-menu-image');
            const initialsElements = document.querySelectorAll('#user-initials');
            const avatarDivs = document.querySelectorAll('#user-avatar-menu');

            // Usar avatar guardado en el objeto user (sincronizado desde backend)
            if (user.avatar) {
                imgElements.forEach(img => {
                    img.src = user.avatar;
                    img.classList.remove('hidden');
                });
                initialsElements.forEach(span => span.classList.add('hidden'));
                avatarDivs.forEach(div => div.style.backgroundColor = 'transparent');
            } else {
                this.showInitials(user);
            }

        } catch (error) {
            console.error('❌ Error al cargar avatar en navbar:', error);
        }
    },

    /**
     * Mostrar iniciales
     */
    showInitials: function(user) {
        try {
            const avatarDivs = document.querySelectorAll('#user-avatar-menu');
            const imgElements = document.querySelectorAll('#user-avatar-menu-image');
            const initialsElements = document.querySelectorAll('#user-initials');

            // Ocultar todas las imágenes
            imgElements.forEach(img => {
                img.classList.add('hidden');
            });

            // Mostrar iniciales en todos los lugares
            initialsElements.forEach(span => {
                const initial = `${user.firstName?.charAt(0) || 'U'}${user.lastName?.charAt(0) || ''}`.toUpperCase();
                span.textContent = initial;
                span.classList.remove('hidden');
            });

            // Restaurar color de fondo
            avatarDivs.forEach(div => {
                div.style.backgroundColor = null; // Usar clase CSS
            });

            console.log('📝 Mostrando iniciales en todos los navbars');
        } catch (error) {
            console.error('❌ Error al mostrar iniciales:', error);
        }
    }
};

// Inicializar el manager
NavbarAvatarManager.init();
