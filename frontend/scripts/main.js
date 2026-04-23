// MAIN.JS - Catálogo (sin carrito/usuario)
console.log('main.js (catálogo) cargado');

document.addEventListener('DOMContentLoaded', function() {
    let isMenuOpen = false;

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    function toggleMobileMenu() {
        if (!mobileMenu) return;
        isMenuOpen = !isMenuOpen;
        mobileMenu.classList.toggle('hidden', !isMenuOpen);
    }

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }

    // Navegación suave para anchors internos
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = targetId ? document.querySelector(targetId) : null;
            if (!targetElement) return;

            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth' });

            // Cerrar menú móvil si estaba abierto
            if (isMenuOpen) toggleMobileMenu();
        });
    });
});
