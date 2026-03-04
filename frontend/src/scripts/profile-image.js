// =============================================
// PROFILE-IMAGE.JS - Gestor de Imagen de Perfil
// Grow House - Carga y gestión de imágenes de perfil
// =============================================

console.log('🖼️ Profile Image Manager cargando...');

const ProfileImageManager = {
    // Configuración
    config: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        storageKey: 'growhouse-user-avatar'
    },

    /**
     * Inicializar el gestor de imágenes de perfil
     */
    init: function() {
        console.log('🔧 Inicializando gestor de imágenes de perfil...');
        
        // Elementos del DOM
        const uploadBtn = document.getElementById('upload-profile-btn');
        const fileInput = document.getElementById('profile-image-input');
        const avatarContainer = document.getElementById('profile-avatar-container');
        
        if (!uploadBtn || !fileInput) {
            console.warn('⚠️ Elementos de carga de imagen no encontrados');
            return;
        }
        
        // Event listeners
        uploadBtn.addEventListener('click', () => {
            console.log('👆 Click en botón de carga');
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        avatarContainer.addEventListener('click', () => {
            console.log('👆 Click en avatar');
            fileInput.click();
        });
        
        // Cargar imagen guardada si existe
        this.loadSavedImage();
    },

    /**
     * Manejar selección de archivo
     */
    handleFileSelect: function(event) {
        const file = event.target.files[0];
        
        if (!file) {
            console.log('📝 No hay archivo seleccionado');
            return;
        }
        
        console.log('📂 Archivo seleccionado:', file.name, '- Tamaño:', (file.size / 1024).toFixed(2), 'KB');
        
        // Validaciones
        if (!this.validateFile(file)) {
            return;
        }
        
        // Leer y convertir a base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            this.saveImage(base64Image, file.name, file.type);
        };
        
        reader.onerror = () => {
            console.error('❌ Error al leer el archivo');
            this.showNotification('Error al leer la imagen', 'error');
        };
        
        reader.readAsDataURL(file);
    },

    /**
     * Validar archivo
     */
    validateFile: function(file) {
        // Verificar tipo
        if (!this.config.allowedTypes.includes(file.type)) {
            console.warn('⚠️ Tipo de archivo no permitido:', file.type);
            this.showNotification('Solo se permiten imágenes (JPG, PNG, WebP, GIF)', 'warning');
            return false;
        }
        
        // Verificar tamaño
        if (file.size > this.config.maxFileSize) {
            console.warn('⚠️ Archivo muy grande:', file.size, 'bytes');
            this.showNotification('La imagen debe ser menor a 5MB', 'warning');
            return false;
        }
        
        console.log('✅ Archivo válido');
        return true;
    },

    /**
     * Guardar imagen en localStorage
     */
    saveImage: function(base64Image, fileName, fileType) {
        try {
            const imageData = {
                base64: base64Image,
                fileName: fileName,
                fileType: fileType,
                uploadedAt: new Date().toISOString()
            };
            
            // Obtener usuario actual
            const user = authAPI.getUser();
            const userId = user?.id || 'default';
            
            // Guardar en localStorage
            const storageKey = `${this.config.storageKey}:${userId}`;
            localStorage.setItem(storageKey, JSON.stringify(imageData));
            
            console.log('💾 Imagen guardada en localStorage:', storageKey);
            
            // Mostrar imagen
            this.displayImage(base64Image);
            
            // Notificar
            this.showNotification('Foto de perfil actualizada', 'success');
            
            // Disparar evento MÚLTIPLES VECES para asegurar sincronización
            window.dispatchEvent(new CustomEvent('userProfileUpdated', {
                detail: { userId, imageData }
            }));
            
            // Disparar evento adicional
            window.dispatchEvent(new CustomEvent('avatarChanged', {
                detail: { userId, hasImage: true }
            }));
            
            // Recargar navbar avatar en todos lados
            if (window.NavbarAvatarManager) {
                console.log('🔄 Recargando avatar en navbar...');
                window.NavbarAvatarManager.load();
            }
            
        } catch (error) {
            console.error('❌ Error al guardar imagen:', error);
            this.showNotification('Error al guardar imagen', 'error');
        }
    },

    /**
     * Cargar imagen guardada
     */
    loadSavedImage: function() {
        try {
            const user = authAPI.getUser();
            if (!user) {
                console.log('ℹ️ Usuario no autenticado');
                return;
            }
            
            const userId = user.id;
            const storageKey = `${this.config.storageKey}:${userId}`;
            const savedImage = localStorage.getItem(storageKey);
            
            if (savedImage) {
                try {
                    const imageData = JSON.parse(savedImage);
                    console.log('🖼️ Imagen guardada encontrada:', imageData.fileName);
                    this.displayImage(imageData.base64);
                } catch (error) {
                    console.warn('⚠️ Error al parsear imagen guardada:', error);
                }
            } else {
                console.log('📝 No hay imagen de perfil guardada');
                this.displayInitials(user);
            }
            
        } catch (error) {
            console.error('❌ Error al cargar imagen guardada:', error);
        }
    },

    /**
     * Mostrar imagen en el avatar
     */
    displayImage: function(base64Image) {
        try {
            const imgElement = document.getElementById('profile-avatar-image');
            const textElement = document.getElementById('user-avatar');
            const container = document.getElementById('profile-avatar-container');
            
            if (!imgElement || !textElement) {
                console.warn('⚠️ Elementos de imagen no encontrados');
                return;
            }
            
            imgElement.src = base64Image;
            imgElement.classList.remove('hidden');
            textElement.classList.add('hidden');
            container.style.backgroundColor = 'transparent';
            
            console.log('✅ Imagen mostrada en avatar');
            
        } catch (error) {
            console.error('❌ Error al mostrar imagen:', error);
        }
    },

    /**
     * Mostrar iniciales (fallback)
     */
    displayInitials: function(user) {
        try {
            const imgElement = document.getElementById('profile-avatar-image');
            const textElement = document.getElementById('user-avatar');
            const container = document.getElementById('profile-avatar-container');
            
            if (!textElement) {
                console.warn('⚠️ Elemento de texto no encontrado');
                return;
            }
            
            const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
            textElement.textContent = initials;
            textElement.classList.remove('hidden');
            imgElement.classList.add('hidden');
            container.style.backgroundColor = null; // Usar clase CSS
            
            console.log('✅ Mostrando iniciales:', initials);
            
        } catch (error) {
            console.error('❌ Error al mostrar iniciales:', error);
        }
    },

    /**
     * Obtener imagen del usuario
     */
    getUserImage: function(userId = null) {
        try {
            const user = authAPI.getUser();
            const id = userId || user?.id;
            
            if (!id) return null;
            
            const storageKey = `${this.config.storageKey}:${id}`;
            const savedImage = localStorage.getItem(storageKey);
            
            if (savedImage) {
                const imageData = JSON.parse(savedImage);
                return imageData.base64;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error al obtener imagen del usuario:', error);
            return null;
        }
    },

    /**
     * Eliminar imagen de perfil
     */
    deleteImage: function() {
        try {
            const user = authAPI.getUser();
            if (!user) return false;
            
            const storageKey = `${this.config.storageKey}:${user.id}`;
            localStorage.removeItem(storageKey);
            
            console.log('🗑️ Imagen de perfil eliminada');
            
            // Mostrar iniciales
            this.displayInitials(user);
            
            // Notificar
            this.showNotification('Foto de perfil eliminada', 'success');
            
            // Disparar evento MÚLTIPLES VECES para asegurar sincronización
            window.dispatchEvent(new CustomEvent('userProfileUpdated', {
                detail: { userId: user.id, imageDeleted: true }
            }));
            
            // Disparar evento adicional
            window.dispatchEvent(new CustomEvent('avatarChanged', {
                detail: { userId: user.id, imageDeleted: true }
            }));
            
            // Recargar navbar avatar en todos lados
            if (window.NavbarAvatarManager) {
                console.log('🔄 Recargando avatar en navbar...');
                window.NavbarAvatarManager.load();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al eliminar imagen:', error);
            this.showNotification('Error al eliminar imagen', 'error');
            return false;
        }
    },

    /**
     * Mostrar notificación
     */
    showNotification: function(message, type = 'info') {
        if (authAPI && authAPI.showNotification) {
            authAPI.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOMContentLoaded - Inicializando ProfileImageManager');
        ProfileImageManager.init();
    });
} else {
    // Si el DOM ya está cargado, inicializar inmediatamente
    console.log('📄 DOM ya cargado - Inicializando ProfileImageManager inmediatamente');
    ProfileImageManager.init();
}

// Escuchar cambios de usuario
window.addEventListener('userAuthenticated', function() {
    console.log('👤 Usuario autenticado - Cargando imagen de perfil');
    if (ProfileImageManager && ProfileImageManager.loadSavedImage) {
        ProfileImageManager.loadSavedImage();
    }
});

// Inicializar también cuando el usuario se autentica vía authAPI
if (window.authAPI && window.authAPI.isAuthenticated && window.authAPI.isAuthenticated()) {
    console.log('👤 Usuario ya autenticado - Cargando imagen de perfil');
    setTimeout(() => {
        if (ProfileImageManager && ProfileImageManager.loadSavedImage) {
            ProfileImageManager.loadSavedImage();
        }
    }, 100);
}
