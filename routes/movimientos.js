// /routes/movimientos.js
const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// 1. Cargar dotenv para las credenciales
require('dotenv').config(); 

const client = new Client({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

// 2. Conectar y configurar el esquema
client.connect()
  .then(() => {
    return client.query('SET search_path TO gestion_comercial, public');
  })
  .then(() => {
    console.log('✅ Rutas de Movimientos conectadas correctamente');
  })
  .catch(err => console.error('❌ Error de conexión en movimientos.js:', err.message));

// 3. Registrar un movimiento de inventario (POST)
router.post('/', async (req, res) => {
  const { 
    tiempo_id, 
    producto_id, 
    ubicacion_id, 
    proveedor_id, 
    usuario_id, 
    tipo_movimiento_id, 
    cantidad, 
    costo_unitario, 
    referencia_documento, 
    observacion 
  } = req.body;

  try {
    const result = await client.query(
      `INSERT INTO fact_movimiento_inventario(
        tiempo_id, producto_id, ubicacion_id, proveedor_id, 
        usuario_id, tipo_movimiento_id, cantidad, costo_unitario, 
        referencia_documento, observacion
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tiempo_id, producto_id, ubicacion_id, proveedor_id, usuario_id, tipo_movimiento_id, cantidad, costo_unitario, referencia_documento, observacion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('--- ERROR EN POST MOVIMIENTOS ---');
    console.error(err);
    res.status(500).json({ 
      error: 'Error al registrar movimiento de inventario',
      detail: err.message 
    });
  }
});

// 4. Extra: Obtener historial de movimientos (GET)
// Te añado esta ruta por si necesitas consultar lo que vas registrando
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM fact_movimiento_inventario ORDER BY movimiento_id DESC LIMIT 50');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('--- ERROR EN GET MOVIMIENTOS ---');
    console.error(err);
    res.status(500).json({ error: 'Error al obtener movimientos', detail: err.message });
  }
});

module.exports = router;