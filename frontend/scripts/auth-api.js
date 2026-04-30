// =============================================
// AUTH-API.JS - Gestor de Autenticación (Modo Catálogo Admin)
// Grow House - Gestión de sesión única para Administrador
// =============================================

console.log('🔐 Inicializando auth-api.js');

const AUTH_CONFIG = {
    baseURL: window.GROW_HOUSE_API + '/auth',
    timeout: 10000,
    storage: {
        tokenKey: 'growhouse-auth-token',
        userKey: 'growhouse-user-data',
        loginTimeKey: 'growhouse-login-time'
    }
};

class AuthAPI {
    constructor() {
        console.log('🔐 AuthAPI inicializada');
        this.baseURL = AUTH_CONFIG.baseURL;
        this.timeout = AUTH_CONFIG.timeout;
    }

    // =============================================
    // MÉTODO: LOGIN DE ADMIN (ÚNICO USUARIO)
    // =============================================
    async login(email, password) {
        console.log('🔑 Intentando login admin:', email);
        
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Error en login:', data.error);
                throw new Error(data.error || data.message || 'Credenciales inválidas');
            }

            // Mapeo flexible: tomamos los datos de 'data.data' o 'data.user'
            const admin = data.data || data.user || {};
            const token = data.token;

            // REESTRUCTURACIÓN: Forzamos el rol 'admin' y unificamos campos para el navbar
            const adminUser = {
                id: admin.id || admin._id,
                name: admin.name || admin.firstName || 'Administrador',
                email: admin.email,
                avatar: admin.avatar || admin.profileImage || null, // Sincronizado con navbar-avatar.js
                role: 'admin' // Aseguramos que el rol sea admin para los filtros
            };

            console.log('✅ Login admin exitoso:', adminUser.email);

            this.saveAuthData(token, adminUser);

            return {
                success: true,
                user: adminUser,
                token,
                message: 'Inicio de sesión exitoso'
            };

        } catch (error) {
            console.error('❌ Error en login():', error);
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    // =============================================
    // MÉTODO: LOGOUT (CERRAR SESIÓN)
    // =============================================
    logout() {
        console.log('🚪 Cerrando sesión...');
        
        localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
        localStorage.removeItem(AUTH_CONFIG.storage.userKey);
        localStorage.removeItem(AUTH_CONFIG.storage.loginTimeKey);

        console.log('✅ Sesión cerrada exitosamente');

        // Emitimos ambos eventos para asegurar compatibilidad con scripts viejos y nuevos
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        window.dispatchEvent(new CustomEvent('adminLogout')); // Nuevo evento para navbar-avatar.js

        return { success: true, message: 'Sesión cerrada exitosamente' };
    }

    // =============================================
    // MÉTODOS AUXILIARES
    // =============================================
    saveAuthData(token, user) {
        try {
            localStorage.setItem(AUTH_CONFIG.storage.tokenKey, token);
            localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(user));
            localStorage.setItem(AUTH_CONFIG.storage.loginTimeKey, new Date().toISOString());
            
            // Emitimos evento de actualización de sesión
            window.dispatchEvent(new CustomEvent('sessionUpdated'));
            window.dispatchEvent(new CustomEvent('userAuthenticated'));

        } catch (error) {
            console.error('❌ Error guardando datos:', error);
        }
    }

    getToken() { return localStorage.getItem(AUTH_CONFIG.storage.tokenKey); }

    getUser() {
        try {
            const userStr = localStorage.getItem(AUTH_CONFIG.storage.userKey);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) { return null; }
    }

    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        // Solo es auténtico si existe el token Y el usuario tiene rol 'admin'
        return !!(token && user && user.role === 'admin');
    }
}

// Instancia global
const authAPI = new AuthAPI();
window.authAPI = authAPI;

// Función de notificación (Mantenida igual para feedback visual)
function showAuthNotification(message, type = 'info') {
    const toast = document.createElement('div');
    let bgColor = 'bg-blue-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    
    toast.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${bgColor} text-white font-medium`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
window.showAuthNotification = showAuthNotification;