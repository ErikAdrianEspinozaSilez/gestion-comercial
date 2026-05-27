// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();

const pool = require('../db');
// 1. Obtener todos los usuarios activos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT usuario_id, nombre_completo, usuario_login, correo, rol_id 
      FROM gestion_comercial.dim_usuario 
      WHERE activo = true 
      ORDER BY usuario_id ASC
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (err) {
    console.error("Error en GET /usuarios:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear un nuevo usuario
router.post('/', async (req, res) => {
  // AHORA INCLUIMOS EL CORREO
  const { nombre_completo, usuario_login, correo, password, rol_id } = req.body;

  try {
    const query = `
      INSERT INTO gestion_comercial.dim_usuario 
      (nombre_completo, usuario_login, correo, password, rol_id, activo) 
      VALUES ($1, $2, $3, $4, $5, true) 
      RETURNING usuario_id, nombre_completo, usuario_login, correo, rol_id
    `;

    const result = await pool.query(query, [
      nombre_completo,
      usuario_login,
      correo,
      password,
      rol_id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en POST /usuarios:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Eliminar usuario (Borrado lógico, muy profesional)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE gestion_comercial.dim_usuario SET activo = false WHERE usuario_id = $1',
      [id]
    );

    res.json({ message: 'Usuario dado de baja exitosamente' });
  } catch (err) {
    console.error("Error en DELETE /usuarios:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;