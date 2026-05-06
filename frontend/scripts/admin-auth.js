class AdminAuth {
    constructor() {
        this.TOKEN_KEY = 'growhouse-auth-token';
        this.USER_KEY  = 'growhouse-user-data';
        this.checkAccess();
    }

    checkAccess() {
        const isAdminPage =
            window.location.pathname.includes('dashboard') ||
            window.location.pathname.includes('admin');

        if (!isAdminPage) return;

        console.log('🛡️ Protegiendo ruta administrativa...');

        const token = localStorage.getItem(this.TOKEN_KEY);
        let user = null;

        try {
            const userData = localStorage.getItem(this.USER_KEY);
            user = userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error('Error al leer datos de usuario');
        }

        if (!token || !user || user.role !== 'admin') {
            console.warn('⛔ Acceso no autorizado. Redirigiendo a login...');
            this.redirectToLogin();
            return;
        }

        console.log('✅ Acceso admin verificado:', user.email);
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    logout(confirmFirst = true) {
        if (confirmFirst && !confirm('¿Estás seguro de cerrar sesión?')) return;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem('growhouse-login-time');
        window.location.href = 'index.html';
    }

    getAdmin() {
        try {
            const data = localStorage.getItem(this.USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }
}

window.adminAuth = new AdminAuth();