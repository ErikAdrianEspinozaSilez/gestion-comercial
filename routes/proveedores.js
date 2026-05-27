// backend/routes/proveedores.js
const express = require('express');
const router = express.Router();

const pool = require('../db');
/**
 * GET: Obtener proveedores con sus productos
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
        COALESCE(json_agg(pr.nombre_producto) FILTER (WHERE pr.producto_id IS NOT NULL), '[]') as productos
      FROM gestion_comercial.dim_proveedor p
      LEFT JOIN gestion_comercial.producto_proveedor pp ON p.proveedor_id = pp.proveedor_id
      LEFT JOIN gestion_comercial.dim_producto pr ON pp.producto_id = pr.producto_id
      GROUP BY p.proveedor_id
      ORDER BY p.proveedor_id DESC
    `;

    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('--- ERROR EN GET PROVEEDORES CON PRODUCTOS ---', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST: Agregar un nuevo proveedor y sus productos
 */
router.post('/', async (req, res) => {
  const { razon_social, nit, correo_principal, telefono_principal, productos_ids } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const provQuery = `
      INSERT INTO gestion_comercial.dim_proveedor 
      (razon_social, nit, correo_principal, telefono_principal, activo)
      VALUES ($1, $2, $3, $4, true)
      RETURNING proveedor_id
    `;

    const provRes = await client.query(provQuery, [
      razon_social,
      nit,
      correo_principal,
      telefono_principal
    ]);

    const nuevoId = provRes.rows[0].proveedor_id;

    if (productos_ids && productos_ids.length > 0) {
      for (let prodId of productos_ids) {
        await client.query(
          `INSERT INTO gestion_comercial.producto_proveedor 
           (producto_id, proveedor_id, proveedor_principal) 
           VALUES ($1, $2, true)`,
          [prodId, nuevoId]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: "Proveedor y productos vinculados con éxito",
      proveedor_id: nuevoId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('--- ERROR EN POST PROVEEDORES CON PRODUCTOS ---', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/**
 * PUT: Actualizar proveedor y sus productos
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { razon_social, nit, correo_principal, telefono_principal, productos_ids } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const updateProvQuery = `
      UPDATE gestion_comercial.dim_proveedor 
      SET razon_social = $1, nit = $2, correo_principal = $3, telefono_principal = $4
      WHERE proveedor_id = $5
    `;

    await client.query(updateProvQuery, [
      razon_social,
      nit,
      correo_principal,
      telefono_principal,
      id
    ]);

    await client.query(
      'DELETE FROM gestion_comercial.producto_proveedor WHERE proveedor_id = $1',
      [id]
    );

    if (productos_ids && productos_ids.length > 0) {
      for (let prodId of productos_ids) {
        await client.query(
          `INSERT INTO gestion_comercial.producto_proveedor 
           (producto_id, proveedor_id, proveedor_principal) 
           VALUES ($1, $2, true)`,
          [prodId, id]
        );
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: "Proveedor actualizado con éxito"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('--- ERROR EN PUT PROVEEDORES ---', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;