// backend/routes/auth.js
const express = require('express');
const router = express.Router();

const pool = require('../db');
// Ruta para Iniciar Sesión (Login)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Log de diagnóstico para ver qué recibe el servidor
  console.log("INTENTO DE LOGIN - Usuario:", username, "Password:", password);

  try {
    const query = `
      SELECT usuario_id, nombre_completo, usuario_login, rol_id 
      FROM gestion_comercial.dim_usuario 
      WHERE usuario_login = $1 AND password = $2 AND activo = true
    `;

    const result = await pool.query(query, [username, password]);

    if (result.rows.length === 0) {
      console.log("Login fallido para:", username);
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const usuario = result.rows[0];
    console.log("Login exitoso para:", usuario.usuario_login);

    res.json({
      message: "Login exitoso",
      user: usuario
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;