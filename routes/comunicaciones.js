// backend/routes/comunicaciones.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const { enviarCorreoProveedor } = require('../controllers/comunicacionController');

// Configuración del Pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
  max: 20,
  options: '-c search_path=gestion_comercial,public',
});

pool.connect()
  .then(() => console.log('✅ Conexión con comunicaciones OK - esquema gestion_comercial'))
  .catch(err => console.error('❌ Error de conexión en comunicaciones.js:', err.message));

/**
 * 1️⃣ POST: Enviar correo al proveedor
 * Ruta: /api/comunicaciones/enviar-correo
 */
router.post('/enviar-correo', enviarCorreoProveedor);

/**
 * 2️⃣ GET: Historial de comunicaciones
 * Ruta: /api/comunicaciones/historial
 */
router.get('/historial', async (req, res) => {
  try {
    const query = `
      SELECT c.*, p.razon_social 
      FROM gestion_comercial.comunicacion_proveedor c
      JOIN gestion_comercial.dim_proveedor p ON c.proveedor_id = p.proveedor_id
      ORDER BY c.fecha_envio DESC NULLS LAST
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error en historial:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3️⃣ GET: Confirmación del proveedor desde el correo
 * Ruta: /api/comunicaciones/confirmar/:id
 */
router.get('/confirmar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updateQuery = `
      UPDATE gestion_comercial.comunicacion_proveedor 
      SET estado_envio = 'respondido', fecha_respuesta = CURRENT_TIMESTAMP 
      WHERE comunicacion_proveedor_id = $1
    `;
    await pool.query(updateQuery, [id]);
    res.send(`
      <div style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: green;">✅ Pedido Confirmado</h1>
        <p>Gracias por confirmar. El sistema del Super Valle Market ha sido actualizado automáticamente.</p>
      </div>
    `);
  } catch (error) {
    console.error("Error al confirmar:", error.message);
    res.status(500).send("Error al confirmar");
  }
});

module.exports = router;