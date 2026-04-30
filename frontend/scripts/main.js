/**
 * MAIN.JS - Catálogo Grow House
 * Versión optimizada para Admin Único y Navegación Pública
 */

console.log('🚀 main.js (catálogo) cargado');

document.addEventListener('DOMContentLoaded', function() {
    let isMenuOpen = false;

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    /**
     * Sincroniza el menú móvil con el estado de Administrador
     * Si eres admin, añade el acceso al panel. Si no, lo mantiene limpio.
     */
    function updateMobileMenuUI() {
        if (!mobileMenu) return;
        
        // Verificamos si hay una sesión de admin activa
        const isAdmin = window.authAPI && window.authAPI.isAuthenticated();
        const adminLinkID = 'mobile-admin-access';
        let adminLink = document.getElementById(adminLinkID);

        if (isAdmin) {
            if (!adminLink) {
                // Creamos el acceso al panel para el menú móvil
                adminLink = document.createElement('a');
                adminLink.id = adminLinkID;
                adminLink.href = 'productos.html'; // Tu página de gestión
                adminLink.className = 'block px-3 py-4 text-green-600 font-bold border-t border-gray-100 mt-2 hover:bg-green-50 transition-colors';
                adminLink.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span><i class="fas fa-tasks mr-2"></i> Gestionar Catálogo</span>
                        <i class="fas fa-chevron-right text-xs"></i>
                    </div>
                `;
                mobileMenu.appendChild(adminLink);
                
                // Opcional: Añadir botón de cerrar sesión en móvil
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'block w-full text-left px-3 py-4 text-red-500 text-sm border-t border-gray-50';
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i> Cerrar Sesión';
                logoutBtn.onclick = () => window.authAPI.logout();
                mobileMenu.appendChild(logoutBtn);
            }
        } else {
            // Si no es admin, nos aseguramos de que no vea nada de esto
            if (adminLink) adminLink.remove();
        }
    }

    /**
     * Control del Menú Móvil (Hamburguesa)
     */
    function toggleMobileMenu() {
        if (!mobileMenu) return;
        isMenuOpen = !isMenuOpen;
        
        // Animación simple de Tailwind
        mobileMenu.classList.toggle('hidden', !isMenuOpen);
        
        if (isMenuOpen) {
            updateMobileMenuUI();
        }
    }

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    // Cerrar menú móvil al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (isMenuOpen && mobileMenu && !mobileMenu.contains(e.target) && e.target !== mobileMenuButton) {
            toggleMobileMenu();
        }
    });

    /**
     * Navegación suave (Smooth Scroll) para anchors internos
     */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            e.preventDefault();
            
            // Scroll elegante
            targetElement.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

            // Cerrar menú móvil tras click en enlace
            if (isMenuOpen) toggleMobileMenu();
        });
    });

    /**
     * Escuchador de eventos de autenticación
     * Si cierras sesión desde el avatar, el menú móvil se limpia solo.
     */
    window.addEventListener('adminLogout', () => {
        const adminAccess = document.getElementById('mobile-admin-access');
        if (adminAccess) adminAccess.remove();
        if (isMenuOpen) toggleMobileMenu();
    });
});