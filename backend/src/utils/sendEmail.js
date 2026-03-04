const nodemailer = require("nodemailer");

async function sendVerificationCode(email, name, code) {
    console.log(`📧 Enviando código de verificación a: ${email}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const message = {
        from: `"Grow House" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Código de verificación - Grow House",
        html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
                <h2 style="color:#207719;">¡Bienvenido a Grow House! 🌱</h2>
                <p>Hola <strong>${name}</strong>,</p>
                <p>Tu código de verificación es:</p>
                <div style="background:#f0fdf4;border:2px solid #207719;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                    <span style="font-size:36px;font-weight:bold;color:#207719;letter-spacing:8px;">${code}</span>
                </div>
                <p style="color:#666;font-size:14px;">⏱️ Este código expira en <strong>10 minutos</strong>.</p>
                <p style="color:#666;font-size:14px;">Si no solicitaste esto, ignora este correo.</p>
            </div>
        `
    };

    await transporter.sendMail(message);
    console.log(`✅ Código enviado exitosamente a: ${email}`);
}

module.exports = { sendVerificationCode };