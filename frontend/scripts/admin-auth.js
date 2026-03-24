/**
 * admin-auth.js - Sistema de autenticación para panel administrativo
 * VERSIÓN COMPATIBLE con auth-api.js
 * 
 * IMPORTANTE: Este archivo usa las mismas claves de localStorage que auth-api.js
 * - Token: 'growhouse-auth-token'
 * - Usuario: 'growhouse-user-data'
 */

class AdminAuth {
    constructor() {
        this.API_URL = window.GROW_HOUSE_API;
        
        // 🔑 USAR LAS MISMAS CLAVES QUE AUTH-API.JS
        this.STORAGE_KEYS = {
            token: 'growhouse-auth-token',
            user: 'growhouse-user-data',
            loginTime: 'growhouse-login-time'
        };
        
        this.token = localStorage.getItem(this.STORAGE_KEYS.token);
        this.user = null;
        
        try {
            const userData = localStorage.getItem(this.STORAGE_KEYS.user);
            this.user = userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Error parseando usuario:', error);
        }
        
        this.setupAxios();
    }

    setupAxios() {
        if (this.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        }

        // Interceptor para manejar errores de autenticación
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.error('❌ Token inválido o expirado');
                    this.redirectToLogin('Tu sesión ha expirado');
                } else if (error.response?.status === 403) {
                    console.error('❌ Sin permisos');
                    this.redirectToHome('No tienes permisos para esta acción');
                }
                return Promise.reject(error);
            }
        );

        console.log('🔧 Interceptores de Axios configurados');
    }

    // =============================================
    // MÉTODOS DE VERIFICACIÓN
    // =============================================

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        const hasToken = !!this.token;
        const hasUser = !!this.user;
        
        console.log('🔍 Verificando autenticación:', {
            hasToken,
            hasUser,
            email: this.user?.email
        });
        
        return hasToken && hasUser;
    }

    /**
     * Verificar si el usuario es admin (LOCAL - rápido)
     */
    isAdminLocal() {
        const isAdmin = this.user && this.user.role === 'admin';
        
        console.log('🔍 Verificando rol local:', {
            role: this.user?.role,
            isAdmin
        });
        
        return isAdmin;
    }

    /**
     * Verificar si el usuario es admin (BACKEND - seguro)
     */
    async isAdminBackend() {
        try {
            console.log('🌐 Verificando rol en backend...');
            
            // Obtener el ID del usuario
            const userId = this.user?.id;
            
            if (!userId) {
                console.error('❌ No hay ID de usuario');
                return false;
            }
            
            // Hacer petición al backend
            const response = await axios.get(`${this.API_URL}/auth/profile?userId=${userId}`);
            const userData = response.data.user || response.data.data;
            
            console.log('✅ Respuesta del backend:', userData);
            
            // Actualizar usuario en localStorage
            localStorage.setItem(this.STORAGE_KEYS.user, JSON.stringify(userData));
            this.user = userData;
            
            return userData.role === 'admin';
            
        } catch (error) {
            console.error('❌ Error verificando rol en backend:', error);
            return false;
        }
    }

    /**
     * Middleware de protección para páginas admin (MEJORADO)
     */
    async protectAdminRoute() {
        console.log('🔐 ========================================');
        console.log('   INICIANDO VERIFICACIÓN DE ACCESO ADMIN');
        console.log('========================================');

        // 1️⃣ Verificar autenticación básica (local)
        if (!this.isAuthenticated()) {
            console.warn('❌ ACCESO DENEGADO: No autenticado');
            console.log('   - No hay token o usuario en localStorage');
            this.redirectToLogin('Debes iniciar sesión para acceder al panel de administración');
            return false;
        }

        console.log('✅ PASO 1: Usuario autenticado');
        console.log('   - Email:', this.user.email);
        console.log('   - Token:', this.token.substring(0, 20) + '...');

        // 2️⃣ Verificación rápida local del rol
        if (!this.isAdminLocal()) {
            console.warn('❌ ACCESO DENEGADO: Usuario no es administrador');
            console.log('   - Rol actual:', this.user.role);
            console.log('   - Rol requerido: admin');
            this.redirectToHome('No tienes permisos de administrador');
            return false;
        }

        console.log('✅ PASO 2: Verificación local exitosa');
        console.log('   - Rol:', this.user.role);

        // 3️⃣ Verificación en backend (async, no bloqueante)
        console.log('🌐 PASO 3: Verificando en backend...');
        this.isAdminBackend().then(isValid => {
            if (!isValid) {
                console.error('❌ Verificación backend falló');
                this.redirectToLogin('Tu sesión ha expirado');
            } else {
                console.log('✅ PASO 3: Verificación backend exitosa');
            }
        }).catch(error => {
            console.error('❌ Error en verificación backend:', error);
        });

        console.log('========================================');
        console.log('   ✅ ACCESO AUTORIZADO AL PANEL ADMIN');
        console.log('========================================');
        
        return true;
    }

    // =============================================
    // MÉTODOS DE REDIRECCIÓN
    // =============================================

    /**
     * Redirigir al login
     */
    redirectToLogin(message = 'Debes iniciar sesión para acceder') {
        console.log('🔄 Redirigiendo a login:', message);
        
        localStorage.setItem('redirectMessage', message);
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 100);
    }

    /**
     * Redirigir al inicio
     */
    redirectToHome(message = '') {
        console.log('🔄 Redirigiendo a inicio:', message);
        
        if (message) {
            localStorage.setItem('errorMessage', message);
            alert(message);
        }
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }

    // =============================================
    // OTROS MÉTODOS
    // =============================================

    /**
     * Cerrar sesión (compatible con auth-api.js)
     */
    logout() {
        if (!confirm('¿Estás seguro de cerrar sesión?')) {
            return;
        }

        console.log('🚪 Cerrando sesión admin...');
        
        // Usar las mismas claves que auth-api.js
        localStorage.removeItem(this.STORAGE_KEYS.token);
        localStorage.removeItem(this.STORAGE_KEYS.user);
        localStorage.removeItem(this.STORAGE_KEYS.loginTime);
        
        delete axios.defaults.headers.common['Authorization'];
        
        // Emitir evento para que otras partes de la app sepan
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        window.location.href = 'index.html';
    }

    /**
     * Obtener información del admin actual
     */
    getAdminInfo() {
        return this.user;
    }

    /**
     * Verificar si tiene un permiso específico
     */
    hasPermission(permission) {
        return this.isAdminLocal();
    }
}

// =============================================
// INSTANCIA GLOBAL
// =============================================

const adminAuth = new AdminAuth();

// =============================================
// PROTECCIÓN AUTOMÁTICA DE PÁGINAS ADMIN
// =============================================

/**
 * Detectar si estamos en una página que requiere autenticación de admin
 */
const isAdminPage = 
    window.location.pathname.includes('admin-') || 
    window.location.pathname.includes('dashboard') ||
    window.location.pathname.includes('/admin/');

if (isAdminPage) {
    console.log('📄 ========================================');
    console.log('   PÁGINA ADMIN DETECTADA');
    console.log('========================================');
    console.log('   Ruta:', window.location.pathname);
    console.log('========================================');
    
    // Proteger ruta cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('');
        console.log('🚀 DOM CARGADO - Ejecutando protección...');
        console.log('');
        
        const isAuthorized = await adminAuth.protectAdminRoute();
        
        if (!isAuthorized) {
            console.warn('');
            console.warn('⛔ ACCESO DENEGADO - Redirigiendo...');
            console.warn('');
            return;
        }
        
        console.log('');
        console.log('✅ ========================================');
        console.log('   ACCESO AUTORIZADO');
        console.log('========================================');
        console.log('   Admin:', adminAuth.getAdminInfo().email);
        console.log('   Rol:', adminAuth.getAdminInfo().role);
        console.log('========================================');
        console.log('');
    });
} else {
    console.log('📄 Página pública:', window.location.pathname);
}

// Exportar para uso global
window.adminAuth = adminAuth;

console.log('✅ admin-auth.js cargado exitosamente');