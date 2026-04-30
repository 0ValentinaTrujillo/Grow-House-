// =============================================
// NAVBAR-AVATAR.JS - Gestor de Avatar (SOLO ADMIN)
// Grow House - Versión Catálogo Administrable 2026
// =============================================

console.log('👤 Navbar Avatar Manager (Modo Admin) cargando...');

const NavbarAvatarManager = {
    /**
     * Inicializar
     */
    init: function() {
        console.log('🔧 Inicializando NavbarAvatarManager para Admin...');
        
        const loadHandler = () => {
            console.log('📄 Cargando interfaz de usuario en navbar');
            this.load();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadHandler);
        } else {
            loadHandler();
        }
        
        // Escuchar solo eventos relevantes a la sesión del admin
        window.addEventListener('sessionUpdated', () => this.load());
        window.addEventListener('userAuthenticated', () => this.load());
        
        // Evento personalizado para cuando el admin cierra sesión
        window.addEventListener('adminLogout', () => this.clear());
    },

    /**
     * Cargar y mostrar avatar de administrador
     */
    load: function () {
        try {
            // Verificamos si existe la API de auth y si el usuario es ADMIN
            if (!window.authAPI || !window.authAPI.isAuthenticated()) {
                this.clear(); // Si no hay sesión, nos aseguramos de que esté limpio
                return;
            }

            const user = window.authAPI.getUser();
            
            // FILTRO CRÍTICO: Si no es admin, ocultamos cualquier rastro de avatar
            if (!user || user.role !== 'admin') {
                this.clear();
                return;
            }

            const imgElements = document.querySelectorAll('#user-avatar-menu-image');
            const initialsElements = document.querySelectorAll('#user-initials');
            const avatarDivs = document.querySelectorAll('#user-avatar-menu');

            // Mostrar imagen del admin o sus iniciales
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

            console.log('✅ Interfaz de Administrador activada en Navbar');

        } catch (error) {
            console.error('❌ Error al cargar avatar de admin:', error);
        }
    },

    /**
     * Mostrar iniciales del Administrador
     */
    showInitials: function(user) {
        const initialsElements = document.querySelectorAll('#user-initials');
        const imgElements = document.querySelectorAll('#user-avatar-menu-image');

        imgElements.forEach(img => img.classList.add('hidden'));

        initialsElements.forEach(span => {
            // Usamos el nombre del admin o 'A' por defecto
            const initial = (user.name?.charAt(0) || user.firstName?.charAt(0) || 'A').toUpperCase();
            span.textContent = initial;
            span.classList.remove('hidden');
        });
    },

    /**
     * Limpiar el navbar (para usuarios visitantes)
     */
    clear: function() {
        const avatarDivs = document.querySelectorAll('#user-avatar-menu');
        // Ocultamos el contenedor del avatar para que el público no lo vea
        avatarDivs.forEach(div => div.classList.add('hidden'));
        console.log('🌐 Modo visitante: Avatar oculto.');
    }
};

// Inicializar el manager
NavbarAvatarManager.init();