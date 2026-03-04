// ================================================================
// UI-MANAGER.JS - GESTOR DE INTERFAZ DE USUARIO
// ================================================================
// Maneja la actualización del header según el estado de autenticación
// ================================================================

console.log('🎨 ui-manager.js cargando...');

const UIManager = {
    
    /**
     * 🔄 Actualizar la interfaz del header según el estado de autenticación
     */
    updateHeader: function() {
        console.log('🔄 Actualizando interfaz del header...');
        
        // Verificar si el usuario está autenticado
        const isAuth = authAPI.isAuthenticated();
        const user = authAPI.getUser();
        if (typeof authAPI === 'undefined') {
            console.warn('authAPI no disponible');
            return;
        }
        
        console.log('Usuario autenticado:', isAuth);
        console.log('Datos del usuario:', user);
        
        // Obtener elementos del DOM
        const authButtons = document.getElementById('auth-buttons');
        const userMenuContainer = document.getElementById('user-menu-container');
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (isAuth && user) {
            // ✅ USUARIO LOGUEADO
            console.log('✅ Mostrando menú de usuario');
            
            // Ocultar botones de login/register
            if (authButtons) {
                authButtons.style.display = 'none';
            }
            
            // Mostrar menú de usuario
            if (userMenuContainer) {
                userMenuContainer.style.display = 'block';
            }
            
            // Actualizar datos del usuario en el menú
            this.updateUserMenu(user);
            
        } else {
            // ❌ USUARIO NO LOGUEADO
            console.log('❌ Mostrando botones de autenticación');
            
            // Mostrar botones de login/register
            if (authButtons) {
                authButtons.style.display = 'flex';
            }
            
            // Ocultar menú de usuario
            if (userMenuContainer) {
                userMenuContainer.style.display = 'none';
            }
            
            // Cerrar dropdown si estaba abierto
            if (userDropdown) {
                userDropdown.classList.add('hidden');
            }
        }
    },
    
    /**
     * 👤 Actualizar información del usuario en el menú
     */
    updateUserMenu: function(user) {
        console.log('👤 Actualizando datos del menú de usuario');
        
        // Elementos del menú
        const userInitials = document.getElementById('user-initials');
        const userName = document.getElementById('user-name');
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserEmail = document.getElementById('dropdown-user-email');
        const dropdownUserRole = document.getElementById('dropdown-user-role');
        const adminOptions = document.getElementById('admin-options');
        const clientOptions = document.getElementById('client-options');
        
        // Actualizar iniciales (primera letra del nombre)
        if (userInitials && user.firstName) {
            userInitials.textContent = user.firstName.charAt(0).toUpperCase();
        }
        
        // Actualizar nombre completo
        if (userName && user.firstName) {
            userName.textContent = user.firstName;
        }
        
        // Actualizar nombre en dropdown
        if (dropdownUserName && user.firstName && user.lastName) {
            dropdownUserName.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        // Actualizar email en dropdown
        if (dropdownUserEmail && user.email) {
            dropdownUserEmail.textContent = user.email;
        }
        
        // Actualizar rol en dropdown
        if (dropdownUserRole && user.role) {
            const roleText = user.role === 'admin' ? 'Administrador' : 'Cliente';
            dropdownUserRole.textContent = roleText;
            
            // Cambiar color según el rol
            if (user.role === 'admin') {
                dropdownUserRole.classList.remove('bg-green-100', 'text-green-800');
                dropdownUserRole.classList.add('bg-yellow-100', 'text-yellow-800');
            }
        }
        
        // Mostrar opciones según rol
        if (user.role === 'admin') {
            if (adminOptions) adminOptions.style.display = 'block';
            if (clientOptions) clientOptions.style.display = 'none';
        } else {
            if (adminOptions) adminOptions.style.display = 'none';
            if (clientOptions) clientOptions.style.display = 'block';
        }
        
        console.log('✅ Menú de usuario actualizado');
    },
    
    /**
     * 🎯 Configurar eventos del menú de usuario
     */
    setupUserMenuEvents: function() {
        console.log('🎯 Configurando eventos del menú de usuario');
        
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutButton = document.getElementById('logout-button');
        
        // Toggle dropdown al hacer clic en el botón
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
                console.log('Toggle dropdown');
            });
            
            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }
        
        // Evento de logout
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                console.log('🚪 Cerrando sesión...');
                
                // Cerrar sesión
                authAPI.logout();
                
                // Mostrar notificación
                if (window.showAuthNotification) {
                    showAuthNotification('Sesión cerrada exitosamente', 'success');
                }
                
                // Actualizar UI
                this.updateHeader();
                
                // Redirigir después de un momento
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            });
        }
        
        console.log('✅ Eventos del menú configurados');
    },
    
    /**
     * 🚀 Inicializar UIManager
     */
    init: function() {
        console.log('🚀 Inicializando UIManager...');
        
        // Actualizar header al cargar
        this.updateHeader();
        
        // Configurar eventos
        this.setupUserMenuEvents();
        
        // Escuchar eventos de login/logout
        window.addEventListener('userLoggedIn', () => {
            console.log('📢 Evento userLoggedIn detectado');
            this.updateHeader();
        });
        
        window.addEventListener('userLoggedOut', () => {
            console.log('📢 Evento userLoggedOut detectado');
            this.updateHeader();
        });
        
        console.log('✅ UIManager inicializado');
    }
};

// ================================================================
// EJECUTAR AL CARGAR EL DOM
// ================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        UIManager.init();
    });
} else {
    UIManager.init();
}

console.log('✅ ui-manager.js cargado correctamente');


// Exponer UIManager globalmente para debugging
window.UIManager = UIManager;