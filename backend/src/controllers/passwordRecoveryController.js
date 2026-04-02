const User = require('../models/User');
const nodemailer = require('nodemailer');

// ----------------------------------------
// Helper: crear transporte fresco
// ----------------------------------------
function crearTransporte() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,  // 10 segundos
        greetingTimeout: 10000,
        socketTimeout: 10000
    });
}

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

        // Timeout de 15s para que nunca quede pending infinito
        const envioCorreo = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Timeout enviando correo'));
            }, 15000);

            crearTransporte().sendMail({
                from: `"Grow House" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Código de recuperación - Grow House",
                html: `
                    <h2>Tu código de recuperación</h2>
                    <p>Código: <strong>${codigo}</strong></p>
                    <p>Este código vence en 10 minutos.</p>
                `
            }).then(result => {
                clearTimeout(timer);
                resolve(result);
            }).catch(err => {
                clearTimeout(timer);
                reject(err);
            });
        });

        await envioCorreo;

        return res.json({
            success: true,
            message: "Código enviado correctamente"
        });

    } catch (error) {
        console.error('Error SolicitarCodigo:', error.message);
        return res.json({
            success: false,
            message: error.message === 'Timeout enviando correo'
                ? 'No se pudo conectar al servidor de correo. Intenta de nuevo.'
                : 'Error en el servidor'
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