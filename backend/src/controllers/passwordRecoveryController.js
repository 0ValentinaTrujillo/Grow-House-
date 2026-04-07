const User = require('../models/User');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ----------------------------------------
// 1️⃣ SOLICITAR CÓDIGO
// ----------------------------------------
exports.SolicitarCodigo = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "No existe un usuario con este correo"
            });
        }

        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        user.codigoRecuperacion = codigo;
        user.codigoExpiracion = Date.now() + 10 * 60 * 1000;
        await user.save();

        const { error } = await resend.emails.send({
            from: `Grow House <no-reply@growhouse.site>`, // ← reemplaza con tu dominio verificado en Resend
            to: email,
            subject: "Código de recuperación - Grow House",
            html: `
                <h2>Tu código de recuperación</h2>
                <p>Código: <strong>${codigo}</strong></p>
                <p>Este código vence en 10 minutos.</p>
            `
        });

        if (error) {
            console.error('Error Resend:', error);
            return res.json({
                success: false,
                message: "No se pudo enviar el correo. Intenta de nuevo."
            });
        }

        return res.json({
            success: true,
            message: "Código enviado correctamente"
        });

    } catch (error) {
        console.error('Error SolicitarCodigo:', error.message);
        return res.json({
            success: false,
            message: "Error en el servidor"
        });
    }
};

// ----------------------------------------
// 2️⃣ VERIFICAR CÓDIGO
// ----------------------------------------
exports.verificarCodigo = async (req, res) => {
    try {
        const { email, codigo } = req.body;

        const user = await User.findOne({ email })
            .select("+codigoRecuperacion +codigoExpiracion");

        if (!user) {
            return res.json({ success: false, message: "Correo no encontrado" });
        }

        if (user.codigoRecuperacion !== codigo) {
            return res.json({ success: false, message: "Código incorrecto" });
        }

        if (user.codigoExpiracion < Date.now()) {
            return res.json({ success: false, message: "Código expirado" });
        }

        return res.json({
            success: true,
            message: "Código verificado correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            message: "Error en el servidor"
        });
    }
};

// ----------------------------------------
// 3️⃣ CAMBIAR CONTRASEÑA
// ----------------------------------------
exports.cambiarPassword = async (req, res) => {
    try {
        const { email, nuevaPassword, codigo } = req.body;

        const user = await User.findOne({ email })
            .select("+password +codigoRecuperacion +codigoExpiracion");

        if (!user) {
            return res.json({ success: false, message: "Correo no encontrado" });
        }

        if (user.codigoRecuperacion !== codigo) {
            return res.json({ success: false, message: "Código incorrecto" });
        }

        if (user.codigoExpiracion < Date.now()) {
            return res.json({ success: false, message: "Código expirado" });
        }

        user.password = nuevaPassword;
        user.codigoRecuperacion = undefined;
        user.codigoExpiracion = undefined;

        await user.save();

        return res.json({
            success: true,
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            message: "Error en el servidor"
        });
    }
};