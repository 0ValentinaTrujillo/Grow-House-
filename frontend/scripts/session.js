// ================================================================
// SESSION.JS - EL GUARDIÁN DE GROW HOUSE (CORREGIDO)
// ================================================================

const SessionManager = {
    appName: 'Grow House',
    debug: true, 
    
    routes: {
        // ✅ CUALQUIERA PUEDE VER ESTO (CLIENTES Y TÚ)
        public: [
            'index.html',
            'productos.html',         // Catálogo completo
            'producto-detalle.html',  // Detalle de un producto
            'plantas.html',
            'materas.html',
            'decoraciones.html',
            'implementos.html'  
        ],
        
        // 🔒 SOLO TÚ PUEDES ENTRAR (TU PANEL PRIVADO)
        // Cámbialos por el nombre real de tu archivo de gestión
        protected: [
            'dashboard.html'
        ],
        
        // 🔑 ENTRADA PRIVADA
        auth: [
            'login.html'
        ],
        
        redirects: {
            afterLogin: 'dashboard.html', // A donde te manda al loguearte
            afterLogout: '../index.html',
            needsAuth: 'login.html'
        }
    }
};

SessionManager.getCurrentPage = function() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    return page || 'index.html';
};

SessionManager.checkAuth = function() {
    if (typeof api === 'undefined') return false;
    return api.isAuthenticated();
};

SessionManager.protectRoutes = function() {
    const currentPage = this.getCurrentPage();
    const isAuth = this.checkAuth();
    const { protected, auth, redirects } = this.routes;

    // Si la página es PROTEGIDA y NO eres admin -> A LOGIN
    if (protected.includes(currentPage) && !isAuth) {
        window.location.href = redirects.needsAuth;
        return;
    }

    // Si estás en LOGIN y YA estás logueado -> AL PANEL
    if (auth.includes(currentPage) && isAuth) {
        window.location.href = redirects.afterLogin;
        return;
    }
};

SessionManager.init = function() {
    this.protectRoutes();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SessionManager.init());
} else {
    SessionManager.init();
}

window.SessionManager = SessionManager;