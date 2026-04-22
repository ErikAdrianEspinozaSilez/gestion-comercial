// /routes/productos.js
const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// IMPORTANTE: Cargar dotenv aquí también si vas a crear un nuevo cliente
require('dotenv').config(); 

const client = new Client({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

// Conectar y manejar el esquema
client.connect()
  .then(() => {
    // Esto es vital si tu tabla dim_producto está en el esquema gestion_comercial
    return client.query('SET search_path TO gestion_comercial, public');
  })
  .catch(err => console.error('Error de conexión en productos.js', err));

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    // Si sigue fallando, prueba poniendo el esquema directo:
    // SELECT * FROM gestion_comercial.dim_producto
    const result = await client.query('SELECT * FROM dim_producto');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error detallado:', err); // Mira la terminal para ver el error real
    res.status(500).json({ error: 'Error al obtener productos', detail: err.message });
  }
});

// Agregar un nuevo producto
router.post('/', async (req, res) => {
  const { codigo_barra, nombre_producto, descripcion, subcategoria_id, marca_id, unidad_medida_id, stock_minimo, stock_reorden } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO dim_producto(codigo_barra, nombre_producto, descripcion, subcategoria_id, marca_id, unidad_medida_id, stock_minimo, stock_reorden) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [codigo_barra, nombre_producto, descripcion, subcategoria_id, marca_id, unidad_medida_id, stock_minimo, stock_reorden]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al agregar producto', err);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// Actualizar un producto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo_barra, nombre_producto, descripcion, subcategoria_id, marca_id, unidad_medida_id, stock_minimo, stock_reorden } = req.body;
  try {
    const result = await client.query(
      'UPDATE dim_producto SET codigo_barra=$1, nombre_producto=$2, descripcion=$3, subcategoria_id=$4, marca_id=$5, unidad_medida_id=$6, stock_minimo=$7, stock_reorden=$8 WHERE producto_id=$9 RETURNING *',
      [codigo_barra, nombre_producto, descripcion, subcategoria_id, marca_id, unidad_medida_id, stock_minimo, stock_reorden, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar un producto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await client.query('DELETE FROM dim_producto WHERE producto_id=$1', [id]);
    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;