const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // El servicio nativo de Gmail evita el ETIMEDOUT en la nube
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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