// /routes/proveedores.js
const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// 1. Cargar dotenv para que reconozca las credenciales
require('dotenv').config(); 

const client = new Client({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

// 2. Conectar y establecer el esquema de trabajo
client.connect()
  .then(() => {
    return client.query('SET search_path TO gestion_comercial, public');
  })
  .then(() => {
    console.log('✅ Rutas de Proveedores conectadas al esquema gestion_comercial');
  })
  .catch(err => console.error('❌ Error de conexión en proveedores.js:', err.message));

// 3. Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    // Usamos el nombre de la tabla tal cual está en tu DB
    const result = await client.query('SELECT * FROM dim_proveedor');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('--- ERROR EN GET PROVEEDORES ---');
    console.error(err);
    res.status(500).json({ 
      error: 'Error al obtener proveedores',
      message: err.message 
    });
  }
});

// 4. Agregar un nuevo proveedor
router.post('/', async (req, res) => {
  const { 
    razon_social, 
    nit, 
    tipo_proveedor_id, 
    ciudad_proveedor_id, 
    telefono_principal, 
    correo_principal, 
    whatsapp_principal 
  } = req.body;

  try {
    const result = await client.query(
      `INSERT INTO dim_proveedor(
        razon_social, nit, tipo_proveedor_id, ciudad_proveedor_id, 
        telefono_principal, correo_principal, whatsapp_principal
      ) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [razon_social, nit, tipo_proveedor_id, ciudad_proveedor_id, telefono_principal, correo_principal, whatsapp_principal]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('--- ERROR EN POST PROVEEDORES ---');
    console.error(err);
    res.status(500).json({ 
      error: 'Error al agregar proveedor',
      message: err.message 
    });
  }
});

module.exports = router;