// ================================================================
// UI-MANAGER.JS - GESTOR DE INTERFAZ (SOLO ADMIN)
// ================================================================

console.log('🎨 ui-manager.js optimizado para Admin');

const UIManager = {
    
    /**
     * 🔄 Actualizar el Header
     * Solo muestra el menú si el Admin ha iniciado sesión.
     */
    updateHeader: function() {
        if (typeof api === 'undefined') return;

        const isAuth = api.isAuthenticated();
        const user = api.getCurrentUser();
        
        // Elementos del DOM (Asegúrate de que estos IDs existan en tu Navbar)
        const userMenuContainer = document.getElementById('user-menu-container');
        const userDropdown = document.getElementById('user-dropdown');

        if (isAuth && user && user.role === 'admin') {
            // ✅ ADMIN LOGUEADO
            if (userMenuContainer) userMenuContainer.style.display = 'block';
            this.updateAdminUI(user);
        } else {
            // ❌ VISITANTE NORMAL
            if (userMenuContainer) userMenuContainer.style.display = 'none';
            if (userDropdown) userDropdown.classList.add('hidden');
        }
    },
    
    /**
     * 👤 Datos visuales del Admin
     */
    updateAdminUI: function(user) {
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserEmail = document.getElementById('dropdown-user-email');
        
        if (dropdownUserName) dropdownUserName.textContent = "Administrador";
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
    },
    
    /**
     * 🎯 Eventos (Click en avatar y Logout)
     */
    setupUserMenuEvents: function() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutButton = document.getElementById('logout-button');
        
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }
        
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                api.logout(); // Esto ya redirige a index según nuestro api.js
            });
        }
    },
    
    init: function() {
        this.updateHeader();
        this.setupUserMenuEvents();
        
        // Escuchar si el estado cambia (por si haces login en otra pestaña)
        window.addEventListener('storage', (e) => {
            if (e.key === 'growhouse_token') this.updateHeader();
        });
    }
};

// Inicialización
document.readyState === 'loading' 
    ? document.addEventListener('DOMContentLoaded', () => UIManager.init()) 
    : UIManager.init();

window.UIManager = UIManager;