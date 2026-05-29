// backend/controllers/comunicacionController.js
const pool = require('../db'); 
const { Resend } = require('resend');

// Inicializamos Resend con la clave secreta
const resend = new Resend(process.env.RESEND_API_KEY);

const enviarCorreoProveedor = async (req, res) => {
    const { proveedor_id, solicitud_compra_id, mensaje, asunto, destino } = req.body;

    console.log("--- Procesando Envío de Correo con Resend ---");

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
            proveedor_id || 1, // 🔥 EL SALVAVIDAS: Si el frontend falla y manda undefined, usamos el proveedor 1
            'correo',
            destino,
            asunto,
            mensaje,
            'enviado' 
        ];
        const resultadoBD = await pool.query(query, values);
        const id_real = resultadoBD.rows[0].comunicacion_proveedor_id;

        // 🔥 OJO: CAMBIA LA URL POR TU URL DE RENDER 🔥
        const enlaceConfirmacion = `https://gestion-comercial-j3ed.onrender.com/api/comunicaciones/confirmar/${id_real}`;

        // 4️⃣ Preparar y enviar correo usando Resend API
        const { data, error } = await resend.emails.send({
            from: 'Super Valle Market <onboarding@resend.dev>', // Correo de prueba oficial de Resend
            to: 'cb.erik.espinoza.s@upds.net.bo', // RECUERDA: En la prueba gratuita, este destino DEBE ser el correo con el que te registraste en Resend
            subject: asunto || "Notificación de Reabastecimiento - Super Valle Market",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">🛒 SUPER VALLE MARKET</h2>
                    <h3 style="color: #334155;">Nuevo Requerimiento de Stock</h3>
                    <p style="color: #475569; line-height: 1.5;">${mensaje.replace(/\n/g, '<br>')}</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #64748b; font-size: 14px;">
                        Por favor, confirme la recepción de este pedido.
                    </p>
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="${enlaceConfirmacion}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            ✅ Confirmar Pedido
                        </a>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("❌ Error de Resend:", error);
            return res.status(400).json({ error });
        }

        console.log("✅ Correo enviado con éxito. ID mensaje:", data.id);
        res.status(200).json({ message: "Éxito total", data: resultadoBD.rows[0] });

    } catch (error) {
        console.error("❌ Error detallado:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { enviarCorreoProveedor };