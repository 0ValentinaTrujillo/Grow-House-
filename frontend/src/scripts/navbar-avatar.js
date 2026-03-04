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
    load: function() {
        try {
            // Verificar si el usuario está autenticado
            if (!window.authAPI || !window.authAPI.isAuthenticated()) {
                console.log('ℹ️ Usuario no autenticado');
                return;
            }

            const user = window.authAPI.getUser();
            if (!user || !user.id) {
                console.log('ℹ️ No hay datos del usuario');
                return;
            }

            console.log('👤 Actualizando avatar del navbar para usuario:', user.firstName);

            // Obtener imagen guardada - PRIMERO intenta con ProfileImageManager
            let savedImage = null;
            
            if (window.ProfileImageManager) {
                // Si ProfileImageManager está disponible, usarlo
                const image = window.ProfileImageManager.getUserImage(user.id);
                if (image) {
                    savedImage = JSON.stringify({ base64: image });
                    console.log('🖼️ Imagen obtenida desde ProfileImageManager');
                }
            }
            
            // Si no, intentar directamente desde localStorage
            if (!savedImage) {
                const storageKey = `growhouse-user-avatar:${user.id}`;
                savedImage = localStorage.getItem(storageKey);
                console.log('🖼️ Imagen obtenida desde localStorage');
            }

            // Si no hay imagen guardada, intentar usar el avatar del usuario (de Google)
            let avatarUrl = null;
            if (!savedImage && user.avatar) {
                avatarUrl = user.avatar;
                console.log('🖼️ Avatar URL obtenida desde user.avatar (Google):', avatarUrl);
            }

            // Actualizar TODOS los avatares en la página
            const avatarDivs = document.querySelectorAll('#user-avatar-menu');
            const imgElements = document.querySelectorAll('#user-avatar-menu-image');
            const initialsElements = document.querySelectorAll('#user-initials');

            console.log(`📍 Encontrados ${avatarDivs.length} avatares en el navbar`);

            if (savedImage) {
                try {
                    const imageData = JSON.parse(savedImage);
                    
                    // Actualizar todas las instancias
                    imgElements.forEach((img, idx) => {
                        img.src = imageData.base64;
                        img.classList.remove('hidden');
                        console.log(`✅ Imagen cargada en avatar ${idx + 1}`);
                    });
                    
                    initialsElements.forEach((span, idx) => {
                        span.classList.add('hidden');
                        console.log(`✅ Iniciales ocultadas en avatar ${idx + 1}`);
                    });
                    
                    avatarDivs.forEach(div => {
                        div.style.backgroundColor = 'transparent';
                    });
                    
                    console.log('🖼️ Imagen de perfil cargada en todos los navbars');
                } catch (e) {
                    console.warn('⚠️ Error al parsear imagen:', e);
                    this.showInitials(user);
                }
            } else if (avatarUrl) {
                // Usar avatar URL de Google
                imgElements.forEach((img, idx) => {
                    img.src = avatarUrl;
                    img.classList.remove('hidden');
                    console.log(`✅ Avatar URL cargada en avatar ${idx + 1}: ${avatarUrl}`);
                });
                
                initialsElements.forEach((span, idx) => {
                    span.classList.add('hidden');
                    console.log(`✅ Iniciales ocultadas en avatar ${idx + 1}`);
                });
                
                avatarDivs.forEach(div => {
                    div.style.backgroundColor = 'transparent';
                });
                
                console.log('🖼️ Avatar URL de Google cargada en todos los navbars');
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
