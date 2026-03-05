console.log('🖼️ Profile Image Manager cargando...');

const ProfileImageManager = {
    config: {
        maxFileSize: 3 * 1024 * 1024, // 3MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        apiURL: 'http://localhost:5000/api/avatar'
    },

    init: function () {
        console.log('🔧 Inicializando gestor de imágenes de perfil...');

        const uploadBtn = document.getElementById('upload-profile-btn');
        const fileInput = document.getElementById('profile-image-input');
        const avatarContainer = document.getElementById('profile-avatar-container');

        if (!uploadBtn || !fileInput) {
            console.warn('⚠️ Elementos de carga no encontrados');
            return;
        }

        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (avatarContainer) {
            avatarContainer.addEventListener('click', () => fileInput.click());
        }

        // Cargar avatar desde el backend
        this.loadFromBackend();
    },

    handleFileSelect: function (event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('📂 Archivo seleccionado:', file.name);

        if (!this.validateFile(file)) return;

        const reader = new FileReader();
        reader.onload = (e) => this.saveToBackend(e.target.result);
        reader.onerror = () => this.showNotification('Error al leer la imagen', 'error');
        reader.readAsDataURL(file);
    },

    validateFile: function (file) {
        if (!this.config.allowedTypes.includes(file.type)) {
            this.showNotification('Solo se permiten imágenes (JPG, PNG, WebP, GIF)', 'warning');
            return false;
        }
        if (file.size > this.config.maxFileSize) {
            this.showNotification('La imagen debe ser menor a 3MB', 'warning');
            return false;
        }
        return true;
    },

    saveToBackend: async function (base64Image) {
        try {
            const token = authAPI.getToken();
            const response = await fetch(this.config.apiURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar: base64Image })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showNotification(data.message || 'Error al guardar imagen', 'error');
                return;
            }

            console.log('✅ Avatar guardado en backend');
            this.displayImage(base64Image);
            this.showNotification('Foto de perfil actualizada ✅', 'success');

            // Actualizar user en localStorage para sincronizar navbar
            const user = authAPI.getUser();
            if (user) {
                user.avatar = base64Image;
                authAPI.saveUser(user);
            }

            window.dispatchEvent(new CustomEvent('userProfileUpdated'));
            if (window.NavbarAvatarManager) window.NavbarAvatarManager.load();

        } catch (error) {
            console.error('❌ Error de conexión:', error);
            this.showNotification('Error de conexión con el servidor', 'error');
        }
    },

    loadFromBackend: async function () {
        try {
            const token = authAPI.getToken();
            if (!token) return;

            const response = await fetch(this.config.apiURL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success && data.avatar) {
                this.displayImage(data.avatar);

                // Sincronizar en localStorage para el navbar
                const user = authAPI.getUser();
                if (user) {
                    user.avatar = data.avatar;
                    authAPI.saveUser(user);
                }

                if (window.NavbarAvatarManager) window.NavbarAvatarManager.load();
            } else {
                const user = authAPI.getUser();
                if (user) this.displayInitials(user);
            }

        } catch (error) {
            console.warn('⚠️ No se pudo cargar avatar desde backend:', error);
        }
    },

    deleteImage: async function () {
        try {
            const token = authAPI.getToken();
            const response = await fetch(this.config.apiURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatar: null })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showNotification(data.message || 'Error al eliminar imagen', 'error');
                return;
            }

            console.log('🗑️ Avatar eliminado del backend');

            const user = authAPI.getUser();
            if (user) {
                user.avatar = null;
                authAPI.saveUser(user);
                this.displayInitials(user);
            }

            this.showNotification('Foto de perfil eliminada ✅', 'success');

            window.dispatchEvent(new CustomEvent('userProfileUpdated'));
            if (window.NavbarAvatarManager) window.NavbarAvatarManager.load();

        } catch (error) {
            console.error('❌ Error al eliminar avatar:', error);
            this.showNotification('Error de conexión con el servidor', 'error');
        }
    },

    displayImage: function (base64Image) {
        const imgElement = document.getElementById('profile-avatar-image');
        const textElement = document.getElementById('user-avatar');
        const container = document.getElementById('profile-avatar-container');

        if (imgElement) {
            imgElement.src = base64Image;
            imgElement.classList.remove('hidden');
        }
        if (textElement) textElement.classList.add('hidden');
        if (container) container.style.backgroundColor = 'transparent';
    },

    displayInitials: function (user) {
        const imgElement = document.getElementById('profile-avatar-image');
        const textElement = document.getElementById('user-avatar');
        const container = document.getElementById('profile-avatar-container');

        if (imgElement) imgElement.classList.add('hidden');
        if (textElement) {
            const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
            textElement.textContent = initials;
            textElement.classList.remove('hidden');
        }
        if (container) container.style.backgroundColor = '';
    },

    getUserImage: function () {
        const user = authAPI.getUser();
        return user?.avatar || null;
    },

    showNotification: function (message, type = 'info') {
        if (window.showAuthNotification) {
            showAuthNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
};

window.ProfileImageManager = ProfileImageManager;

document.addEventListener('DOMContentLoaded', function () {
    if (window.authAPI && authAPI.isAuthenticated()) {
        ProfileImageManager.init();
    }
});