// =============================================
// CONFIG.JS - GROW HOUSE
// URL del backend según el ambiente
// =============================================

(function () {
    const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    window.GROW_HOUSE_API = isLocal
        ? 'http://localhost:5000/api'
        : 'https://grow-house-ihww.onrender.com/api';
})();
