const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Usar el servicio directo de Gmail ayuda a evitar errores de puerto [cite: 1285]
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Permite la conexión incluso si hay problemas con certificados locales [cite: 1285]
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Error en la configuración de correo:", error);
    } else {
        console.log("✅ Servidor listo para enviar correos a los proveedores");
    }
});

module.exports = transporter;