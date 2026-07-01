// backend/routes/auth.js
const express = require('express');
const router = express.Router();

const pool = require('../db');

// Ruta para Iniciar Sesión (Login)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log("INTENTO DE LOGIN - Usuario:", username);

  try {
    const query = `
      SELECT 
        usuario_id, 
        nombre_completo, 
        usuario_login, 
        rol_id,
        activo,
        password
      FROM gestion_comercial.dim_usuario 
      WHERE usuario_login = $1
    `;

    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      console.log("Login fallido, usuario no encontrado:", username);
      return res.status(401).json({ 
        error: "Usuario o contraseña incorrectos" 
      });
    }

    const usuario = result.rows[0];

    // Verificar si el usuario fue dado de baja
    if (usuario.activo === false) {
      console.log("Login bloqueado, usuario dado de baja:", usuario.usuario_login);
      return res.status(403).json({ 
        error: "Este usuario fue dado de baja. No puede ingresar al sistema." 
      });
    }

    // Verificar contraseña
    if (usuario.password !== password) {
      console.log("Login fallido, contraseña incorrecta para:", username);
      return res.status(401).json({ 
        error: "Usuario o contraseña incorrectos" 
      });
    }

    console.log("Login exitoso para:", usuario.usuario_login);

    res.json({
      message: "Login exitoso",
      user: {
        usuario_id: usuario.usuario_id,
        nombre_completo: usuario.nombre_completo,
        usuario_login: usuario.usuario_login,
        rol_id: usuario.rol_id,
        activo: usuario.activo
      }
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;