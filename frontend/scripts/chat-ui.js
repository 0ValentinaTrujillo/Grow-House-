document.addEventListener("DOMContentLoaded", () => {
    console.log("💬 Chat UI cargado");

    const btn = document.getElementById('chat-toggle');
    const screen = document.getElementById('emergency-screen');

    if (!btn || !screen) {
        console.error("❌ Botón o pantalla del chat no encontrados");
        return;
    }

    // ===============================
    // FUNCIÓN CENTRAL: CERRAR CHAT
    // ===============================
    function cerrarChat() {
        if (screen.classList.contains('active')) {
            screen.classList.remove('active');
            btn.classList.remove('blur');
            btn.style.bottom = '';
            btn.style.right = '';
        }
    }

    // ===============================
    // VERIFICAR AUTENTICACIÓN
    // ===============================
    function estaAutenticado() {
        return !!localStorage.getItem('growhouse-auth-token'); // ✅ mismo nombre que zuri.html
    }

    // ===============================
    // MODAL DE AUTENTICACIÓN
    // ===============================
    function mostrarModalAuth() {
        if (document.getElementById('auth-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px 30px;
                max-width: 360px;
                width: 90%;
                text-align: center;
                box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            ">
                <img 
                    src="/frontendassets/images/pngtree-cute-cactus-in-pot-with-flower-crown-cartoon-illustration-png-image_19938173.png"
                    alt="Zuri"
                    style="width:100px; height:100px; object-fit:cover; border-radius:50%; display:block; margin: 0 auto 15px auto; box-shadow: 0 4px 16px rgba(0,0,0,0.15);"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                >
                <div style="display:none; font-size:3rem; margin-bottom:15px;">🪴</div>
                <h2 style="color:#207719; font-size:1.3rem; margin-bottom:10px;">
                    ¡Inicia sesión para chatear con Zuri!
                </h2>
                <p style="color:#6b7280; font-size:0.9rem; margin-bottom:25px; line-height:1.5;">
                    Para usar el asistente de plantas necesitas una cuenta en Grow House.
                </p>
                <a href="/frontend/pages/login.html" style="
                    display: block;
                    background: linear-gradient(135deg, #207719, #46d560);
                    color: white;
                    padding: 14px 20px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-bottom: 12px;
                ">Iniciar Sesión</a>
                <a href="/frontend/pages/register.html" style="
                    display: block;
                    color: #207719;
                    padding: 12px 20px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: 600;
                    border: 2px solid #207719;
                    margin-bottom: 15px;
                ">Crear una cuenta</a>
                <button onclick="document.getElementById('auth-modal').remove()" style="
                    background: none;
                    border: none;
                    color: #9ca3af;
                    font-size: 0.85rem;
                    cursor: pointer;
                    text-decoration: underline;
                ">Cerrar</button>
            </div>
        `;

        // Cerrar al hacer clic en el fondo oscuro
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    // ===============================
    // TOGGLE AL PRESIONAR EL CACTUS
    // ===============================
    btn.addEventListener('click', function(e) {
        e.stopPropagation();

        if (screen.classList.contains('active')) {
            cerrarChat();
        } else {
            if (!estaAutenticado()) {
                mostrarModalAuth();
                return;
            }
            screen.classList.add('active');
            btn.classList.add('blur');
            btn.style.bottom = '';
            btn.style.right = '';
        }
    });

    // ===============================
    // CERRAR AL HACER CLIC FUERA
    // ===============================
    document.addEventListener('click', function(e) {
        if (
            screen.classList.contains('active') &&
            !screen.contains(e.target) &&
            !btn.contains(e.target)
        ) {
            cerrarChat();
        }
    });

    // ===============================
    // CERRAR AL PRESIONAR OTRO BOTÓN O ENLACE
    // ===============================
    document.querySelectorAll('a, button').forEach(function(el) {
        if (el.id !== 'chat-toggle' && !screen.contains(el)) {
            el.addEventListener('click', function() {
                cerrarChat();
            });
        }
    });

    // ===============================
    // CERRAR CON TECLA ESCAPE
    // ===============================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarChat();
        }
    });
});