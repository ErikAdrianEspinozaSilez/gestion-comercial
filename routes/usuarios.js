// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();

const pool = require('../db');

// 1. Obtener todos los usuarios, activos e inactivos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        usuario_id, 
        nombre_completo, 
        usuario_login, 
        correo, 
        rol_id,
        activo
      FROM gestion_comercial.dim_usuario
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
  const { nombre_completo, usuario_login, correo, password, rol_id } = req.body;

  try {
    if (!nombre_completo || !usuario_login || !password || !rol_id) {
      return res.status(400).json({
        error: 'Nombre, usuario, contraseña y rol son obligatorios'
      });
    }

    const usuarioLimpio = usuario_login.trim();

    const existeUsuario = await pool.query(
      `SELECT usuario_id 
       FROM gestion_comercial.dim_usuario
       WHERE LOWER(usuario_login) = LOWER($1)`,
      [usuarioLimpio]
    );

    if (existeUsuario.rows.length > 0) {
      return res.status(409).json({
        error: 'El nombre de usuario ya existe. Usa otro usuario.'
      });
    }

    const query = `
      INSERT INTO gestion_comercial.dim_usuario 
      (nombre_completo, usuario_login, correo, password, rol_id, activo) 
      VALUES ($1, $2, $3, $4, $5, true) 
      RETURNING usuario_id, nombre_completo, usuario_login, correo, rol_id, activo
    `;

    const result = await pool.query(query, [
      nombre_completo.trim(),
      usuarioLimpio,
      correo && correo.trim() !== '' ? correo.trim() : null,
      password,
      rol_id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en POST /usuarios:", err.message);

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'El nombre de usuario ya existe. Usa otro usuario.'
      });
    }

    res.status(500).json({ error: err.message });
  }
});
// 3. Dar de baja usuario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE gestion_comercial.dim_usuario
      SET activo = false
      WHERE usuario_id = $1
      RETURNING usuario_id, nombre_completo, usuario_login, correo, rol_id, activo
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario dado de baja exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    console.error("Error en DELETE /usuarios:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Activar usuario nuevamente
router.put('/:id/activar', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE gestion_comercial.dim_usuario
      SET activo = true
      WHERE usuario_id = $1
      RETURNING usuario_id, nombre_completo, usuario_login, correo, rol_id, activo
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario activado exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    console.error("Error en PUT /usuarios/:id/activar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;