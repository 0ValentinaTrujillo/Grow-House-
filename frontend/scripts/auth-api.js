console.log('🔐 Inicializando auth-api.js');

const AUTH_CONFIG = {
    baseURL: window.GROW_HOUSE_API + '/auth',
    timeout: 10000,
    storage: {
        tokenKey: 'growhouse-auth-token',      // Donde guardamos el JWT
        userKey: 'growhouse-user-data',        // Donde guardamos datos del usuario
        loginTimeKey: 'growhouse-login-time'   // Cuándo se logueó
    }
};

class AuthAPI {
    
    /**
     * Constructor de la clase
     * Se ejecuta automáticamente al crear una instancia
     */
    constructor() {
        console.log('🔐 AuthAPI inicializada');
        this.baseURL = AUTH_CONFIG.baseURL;
        this.timeout = AUTH_CONFIG.timeout;
    }

    // =============================================
    // MÉTODO: LOGIN DE ADMIN (ÚNICO USUARIO)
    // =============================================
    
    /**
     * Iniciar sesión en el sistema
     * 
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * 
     * @returns {Promise<Object>} Resultado de la operación
     * @returns {boolean} .success - Si el login fue exitoso
     * @returns {Object} .user - Datos del usuario
     * @returns {string} .token - Token JWT generado
     * @returns {string} .error - Mensaje de error (si falló)
     * 
     * Ejemplo de uso:
     * const result = await authAPI.login('juan@example.com', 'Password123!');
     * 
     * if (result.success) {
     *     console.log('Bienvenido:', result.user.firstName);
     * } else {
     *     alert(result.error);
     * }
     */
    async login(email, password) {
        console.log('🔑 Intentando login admin:', email);
        
        try {
            // Hacer petición POST al endpoint de login (admin)
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Obtener respuesta del servidor
            const data = await response.json();

            // Si las credenciales son inválidas o hay error
            if (!response.ok) {
                console.error('❌ Error en login:', data.error);
                throw new Error(data.error || data.message || 'Credenciales inválidas');
            }

            const admin = data.data || data.user || {};
            const token = data.token;

            const adminUser = {
                id: admin.id || admin._id,
                name: admin.name || 'Admin',
                email: admin.email,
                role: 'admin'
            };

            console.log('✅ Login admin exitoso:', adminUser.email);

            // Guardar token y datos del usuario en localStorage
            this.saveAuthData(token, adminUser);

            // Retornar resultado exitoso
            return {
                success: true,
                user: adminUser,
                token,
                message: 'Inicio de sesión exitoso'
            };

        } catch (error) {
            // Capturar cualquier error
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
    
    /**
     * Cerrar sesión del usuario
     * 
     * Este método:
     * 1. Elimina el token JWT del localStorage
     * 2. Elimina los datos del usuario del localStorage
     * 3. Emite un evento para que otras partes de la app sepan que se cerró sesión
     * 
     * @returns {Object} Resultado de la operación
     * @returns {boolean} .success - Siempre true
     * @returns {string} .message - Mensaje de confirmación
     * 
     * Ejemplo de uso:
     * authAPI.logout();
     * window.location.href = 'login.html';
     */
    logout() {
        console.log('🚪 Cerrando sesión...');
        
        // Eliminar token y datos del usuario del localStorage
        localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
        localStorage.removeItem(AUTH_CONFIG.storage.userKey);
        localStorage.removeItem(AUTH_CONFIG.storage.loginTimeKey);

        console.log('✅ Sesión cerrada exitosamente');

        // Emitir evento personalizado para que otras partes de la app
        // sepan que el usuario cerró sesión
        window.dispatchEvent(new CustomEvent('userLoggedOut'));

        return {
            success: true,
            message: 'Sesión cerrada exitosamente'
        };
    }

    // =============================================
    // MÉTODOS AUXILIARES - MANEJO DE DATOS
    // =============================================
    
    /**
     * Guardar token y datos de usuario en localStorage
     * 
     * Este método se llama automáticamente después de login o registro exitoso.
     * Guarda tres cosas:
     * 1. Token JWT
     * 2. Datos del usuario (como JSON string)
     * 3. Timestamp de cuándo se guardó
     * 
     * También emite un evento 'userLoggedIn' para que otras partes
     * de la aplicación puedan reaccionar (ej: actualizar el header)
     * 
     * @param {string} token - Token JWT del backend
     * @param {Object} user - Datos del usuario
     */
    saveAuthData(token, user) {
        console.log('💾 Guardando datos de autenticación');
        
        try {
            // Guardar en localStorage
            localStorage.setItem(AUTH_CONFIG.storage.tokenKey, token);
            localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(user));
            localStorage.setItem(AUTH_CONFIG.storage.loginTimeKey, new Date().toISOString());
            
            console.log('✅ Datos guardados en localStorage');
            console.log('   Token:', token.substring(0, 20) + '...');
            console.log('   Usuario:', user.email);

            // Emitir evento personalizado
            window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: { user } 
            }));

        } catch (error) {
            console.error('❌ Error guardando datos:', error);
        }
    }

    /**
     * Guardar solo los datos del usuario (actualizar perfil)
     * 
     * @param {Object} user - Datos actualizados del usuario
     */
    saveUser(user) {
        try {
            localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(user));
        } catch (error) {
            console.error('❌ Error guardando usuario:', error);
        }
    }

    /**
     * Obtener token JWT del localStorage
     * 
     * @returns {string|null} Token JWT o null si no existe
     */
    getToken() {
        return localStorage.getItem(AUTH_CONFIG.storage.tokenKey);
    }

    /**
     * Obtener datos del usuario del localStorage
     * 
     * @returns {Object|null} Objeto con datos del usuario o null si no existe
     */
    getUser() {
        try {
            const userStr = localStorage.getItem(AUTH_CONFIG.storage.userKey);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    }

    /**
     * Verificar si hay un usuario autenticado
     * 
     * Revisa si existen tanto el token como los datos del usuario.
     * NO verifica si el token es válido (solo si existe).
     * 
     * @returns {boolean} true si hay sesión, false si no
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        const isAuth = !!(token && user);
        
        console.log('🔍 ¿Usuario autenticado?', isAuth);
        return isAuth;
    }

    /**
     * Obtener tiempo desde el último login
     * 
     * @returns {number} Minutos desde el último login
     */
    getTimeSinceLogin() {
        const loginTime = localStorage.getItem(AUTH_CONFIG.storage.loginTimeKey);
        
        if (!loginTime) return null;
        
        const now = new Date();
        const login = new Date(loginTime);
        const diffMs = now - login;
        const diffMins = Math.floor(diffMs / 60000);
        
        return diffMins;
    }
}

// =============================================
// INSTANCIA GLOBAL
// =============================================

/**
 * Crear una instancia única de AuthAPI
 * 
 * Usamos una sola instancia (patrón Singleton) para que
 * todas las partes de la aplicación usen la misma configuración
 * y estado.
 */
const authAPI = new AuthAPI();

// Hacer la instancia disponible globalmente
// Esto permite usarla desde cualquier script: window.authAPI
window.authAPI = authAPI;

console.log('✅ auth-api.js cargado exitosamente');

// =============================================
// FUNCIONES AUXILIARES GLOBALES
// =============================================

/**
 * Mostrar notificación temporal al usuario
 * 
 * Crea un "toast" (notificación flotante) en la esquina superior derecha
 * que desaparece automáticamente después de 3 segundos.
 * 
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * 
 * Ejemplo de uso:
 * showAuthNotification('¡Bienvenido!', 'success');
 * showAuthNotification('Credenciales inválidas', 'error');
 */
function showAuthNotification(message, type = 'info') {
    console.log(`📢 Notificación [${type}]: ${message}`);

    // Crear elemento del toast
    const toast = document.createElement('div');

    // Determinar color según el tipo
    let bgColor = 'bg-blue-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';
    if (type === 'warning') bgColor = 'bg-yellow-500';

    // Aplicar estilos (usando Tailwind CSS)
    toast.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-40 transform transition-all duration-300 ${bgColor} text-white font-medium`;
    toast.textContent = message;

    // Agregar al DOM
    document.body.appendChild(toast);

    // Animar salida después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';

        // Eliminar del DOM después de la animación
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Hacer la función disponible globalmente
window.showAuthNotification = showAuthNotification;

// =============================================
// LOG FINAL
// =============================================

console.log('');
console.log('🎉 ========================================');
console.log('   AUTH-API.JS CARGADO COMPLETAMENTE');
console.log('========================================');
console.log('');
console.log('📌 Instancia disponible: window.authAPI');
console.log('');
console.log('🔧 Métodos disponibles:');
console.log('   • authAPI.login(email, password)');
console.log('   • authAPI.logout()');
console.log('   • authAPI.isAuthenticated()');
console.log('   • authAPI.getToken()');
console.log('   • authAPI.getUser()');
console.log('');
console.log('💡 Función auxiliar:');
console.log('   • showAuthNotification(message, type)');
console.log('');
console.log('========================================');
console.log('');