// backend/controllers/comunicacionController.js
const pool = require('../db'); // Pool centralizado
const transporter = require('../utils/mailer');

const enviarCorreoProveedor = async (req, res) => {
    const { proveedor_id, solicitud_compra_id, mensaje, asunto, destino } = req.body;

    console.log("--- Procesando Envío de Correo Inteligente ---");

    try {
        // 1️⃣ Guardamos la comunicación en la base de datos para obtener un ID único
        const query = `
            INSERT INTO gestion_comercial.comunicacion_proveedor 
            (solicitud_compra_id, proveedor_id, canal, destino, asunto, mensaje, estado_envio)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            solicitud_compra_id || null,
            proveedor_id,
            'correo',
            destino,
            asunto,
            mensaje,
            'enviado' // Estado inicial
        ];

        const resultadoBD = await pool.query(query, values);

        // 2️⃣ Obtener el ID correcto de la comunicación
        const id_real = resultadoBD.rows[0].comunicacion_proveedor_id;

        // 3️⃣ Crear enlace de confirmación (APUNTANDO A LA NUBE)
        // 🔥 ¡CAMBIA LA URL DE ABAJO POR TU URL REAL DE RENDER! 🔥
        const enlaceConfirmacion = `https://gestion-comercial-j3ed.onrender.com/api/comunicaciones/confirmar/${id_real}`;

        // 4️⃣ Preparar y enviar correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: destino,
            subject: asunto || "Notificación de Reabastecimiento - Super Valle Market",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">🛒 SUPER VALLE MARKET</h2>
                    <h3 style="color: #334155;">Nuevo Requerimiento de Stock</h3>
                    <p style="color: #475569; line-height: 1.5;">${mensaje.replace(/\n/g, '<br>')}</p>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <p style="color: #64748b; font-size: 14px;">
                        Por favor, confirme la recepción y disponibilidad de este pedido haciendo clic en el siguiente botón. Esto actualizará nuestro sistema automáticamente.
                    </p>
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="${enlaceConfirmacion}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            ✅ Confirmar Pedido
                        </a>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Correo enviado con éxito. ID mensaje:", info.messageId);

        res.status(200).json({ message: "Éxito total", data: resultadoBD.rows[0] });

    } catch (error) {
        console.error("❌ Error detallado:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { enviarCorreoProveedor };