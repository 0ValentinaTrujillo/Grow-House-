/**
 * admin-auth.js - Protector de Rutas Administrativas
 * Versión optimizada para Catálogo de Administrador Único
 */

class AdminAuth {
    constructor() {
        this.API_URL = window.GROW_HOUSE_API;
        
        // Sincronizado con AUTH_CONFIG en auth-api.js
        this.STORAGE_KEYS = {
            token: 'growhouse-auth-token',
            user: 'growhouse-user-data'
        };
        
        this.checkAccess();
    }

    /**
     * Verificación inmediata de acceso
     */
    async checkAccess() {
        // Solo protegemos si la URL contiene palabras clave de administración
        const isAdminPage = 
            window.location.pathname.includes('productos.html') || 
            window.location.pathname.includes('admin') ||
            window.location.pathname.includes('dashboard');

        if (!isAdminPage) return;

        console.log('🛡️ Protegiendo ruta administrativa...');

        const token = localStorage.getItem(this.STORAGE_KEYS.token);
        const userData = localStorage.getItem(this.STORAGE_KEYS.user);
        let user = null;

        try {
            user = userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error('Error al leer datos de usuario');
        }

        // 1. Verificación básica: ¿Hay token y el rol es admin?
        if (!token || !user || user.role !== 'admin') {
            console.warn('⛔ Acceso no autorizado. Redirigiendo a login...');
            this.redirectToLogin('Acceso restringido a administradores.');
            return;
        }

        // 2. Verificación de integridad con el backend (Opcional pero recomendado)
        try {
            const response = await fetch(`${this.API_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Sesión inválida en servidor');
            }
            
            console.log('✅ Verificación de Admin exitosa');
        } catch (error) {
            console.error('❌ Error de verificación:', error);
            // Si el servidor dice que el token no vale, cerramos sesión
            this.logout(false); 
        }
    }

    redirectToLogin(message) {
        if (message) localStorage.setItem('redirectMessage', message);
        window.location.href = 'login.html';
    }

    /**
     * Cerrar sesión
     * @param {boolean} confirmFirst - Si debe preguntar al usuario
     */
    logout(confirmFirst = true) {
        if (confirmFirst && !confirm('¿Estás seguro de cerrar sesión?')) return;

        localStorage.removeItem(this.STORAGE_KEYS.token);
        localStorage.removeItem(this.STORAGE_KEYS.user);
        localStorage.removeItem('growhouse-login-time');

        // Notificar a otros scripts (como el navbar)
        window.dispatchEvent(new CustomEvent('adminLogout'));
        
        window.location.href = '../index.html';
    }

    getAdmin() {
        const data = localStorage.getItem(this.STORAGE_KEYS.user);
        return data ? JSON.parse(data) : null;
    }
}

// Inicialización global
window.adminAuth = new AdminAuth();