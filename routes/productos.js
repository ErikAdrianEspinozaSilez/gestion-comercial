const express = require('express');
const router = express.Router();

// 1. BUSCAR PRODUCTO POR ID (Para el Lector de código de barras)
router.get('/buscar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const busqueda = id.trim();
    const query = `
      SELECT producto_id, nombre_producto, precio, codigo_barra
      FROM gestion_comercial.dim_producto 
      WHERE (CAST(producto_id AS TEXT) = $1 OR codigo_barra = $1)
      AND activo = TRUE`;
    
    const result = await req.dbClient.query(query, [busqueda]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ message: "No registrado o inactivo" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ESTADÍSTICAS PARA EL DASHBOARD
router.get('/stats', async (req, res) => {
  try {
    const totalRes = await req.dbClient.query('SELECT COUNT(*) FROM gestion_comercial.dim_producto WHERE activo = TRUE');
    
    const bajoRes = await req.dbClient.query(`
      SELECT COUNT(*) FROM (
        SELECT p.producto_id
        FROM gestion_comercial.dim_producto p
        LEFT JOIN gestion_comercial.fact_movimiento_inventario m ON p.producto_id = m.producto_id
        LEFT JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
        WHERE p.activo = TRUE
        GROUP BY p.producto_id
        HAVING (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) < 5
      ) AS subquery
    `);

    const ventasHoyRes = await req.dbClient.query(`
      SELECT SUM(costo_unitario) as total 
      FROM gestion_comercial.fact_movimiento_inventario 
      WHERE tipo_movimiento_id = 2 AND DATE(fecha_registro) = CURRENT_DATE
    `);

    res.json({
      total_items: totalRes.rows[0].count,
      bajo_stock: bajoRes.rows[0].count,
      ventas_hoy: parseFloat(ventasHoyRes.rows[0].total || 0).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. STOCK BAJO (Alertas Automáticas del Dashboard)
router.get('/stock-bajo', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.producto_id, p.nombre_producto, p.codigo_barra, p.imagen_url,
        (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) AS stock_total
      FROM gestion_comercial.dim_producto p
      LEFT JOIN gestion_comercial.fact_movimiento_inventario m ON p.producto_id = m.producto_id
      LEFT JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      WHERE p.activo = TRUE
      GROUP BY p.producto_id, p.nombre_producto, p.codigo_barra, p.imagen_url
      HAVING (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
              COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) < 5;
    `;
    const result = await req.dbClient.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CONSULTA DE TODOS LOS PRODUCTOS (Para la tabla de inventario)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
             (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
              COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) AS stock_total
      FROM gestion_comercial.dim_producto p
      LEFT JOIN gestion_comercial.fact_movimiento_inventario m ON p.producto_id = m.producto_id
      LEFT JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      WHERE p.activo = TRUE
      GROUP BY p.producto_id
      ORDER BY p.producto_id DESC`;
    const result = await req.dbClient.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. AGREGAR PRODUCTO
router.post('/', async (req, res) => {
  try {
    const { nombre_producto, codigo_barra, precio, imagen_url } = req.body;
    const codigoFinal = codigo_barra || 'INT-' + Date.now();
    const query = `
      INSERT INTO gestion_comercial.dim_producto 
      (codigo_barra, nombre_producto, precio, imagen_url, subcategoria_id, marca_id, unidad_medida_id, activo) 
      VALUES ($1, $2, $3, $4, 1, 1, 1, TRUE) RETURNING *`;
    const result = await req.dbClient.query(query, [codigoFinal, nombre_producto, precio || 0, imagen_url]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 6. EDITAR PRODUCTO (Actualización con control de errores)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_producto, precio, codigo_barra, imagen_url } = req.body;
  
  try {
    // 1. Validamos que el precio no venga vacío desde el frontend
    const precioFinal = (precio === '' || precio === null || precio === undefined) ? 0 : precio;

    const query = `
      UPDATE gestion_comercial.dim_producto 
      SET nombre_producto = $1, precio = $2, codigo_barra = $3, imagen_url = $4
      WHERE producto_id = $5
      RETURNING *`;
      
    const result = await req.dbClient.query(query, [nombre_producto, precioFinal, codigo_barra, imagen_url, id]);
    
    // 2. Verificamos si realmente se editó algo
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No se encontró el producto para editar" });
    }

    res.json({ message: "Producto actualizado correctamente" });
  } catch (err) {
    // 3. ESTO ES LO MÁS IMPORTANTE: Imprimirá el error real en tu terminal negra
    console.error("❌ ERROR SQL AL EDITAR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. ELIMINAR PRODUCTO (Borrado Lógico)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Apagamos el producto para que no salga en la tabla, pero su historial de ventas se guarda
    await req.dbClient.query('UPDATE gestion_comercial.dim_producto SET activo = FALSE WHERE producto_id = $1', [id]);
    res.json({ message: "Producto desactivado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. RUTA DE HISTORIAL
router.get('/historial', async (req, res) => {
  try {
    const query = `
      SELECT m.movimiento_id, p.nombre_producto, t.nombre_tipo, m.cantidad, 
             TO_CHAR(m.fecha_registro, 'DD/MM/YYYY HH24:MI') as fecha_formateada
      FROM gestion_comercial.fact_movimiento_inventario m
      JOIN gestion_comercial.dim_producto p ON m.producto_id = p.producto_id
      JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      ORDER BY m.fecha_registro DESC LIMIT 10`;
    const result = await req.dbClient.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. FINALIZAR VENTA
router.post('/finalizar-venta', async (req, res) => {
  const { productos } = req.body;
  try {
    await req.dbClient.query('BEGIN');
    let tiempoId;
    const checkTiempo = await req.dbClient.query("SELECT tiempo_id FROM gestion_comercial.dim_tiempo WHERE fecha_completa = CURRENT_DATE LIMIT 1");
    if (checkTiempo.rows.length > 0) {
      tiempoId = checkTiempo.rows[0].tiempo_id;
    } else {
      const insertTiempo = await req.dbClient.query(
        `INSERT INTO gestion_comercial.dim_tiempo (fecha_completa, dia, mes_id) 
         VALUES (CURRENT_DATE, EXTRACT(DAY FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE)) RETURNING tiempo_id`
      );
      tiempoId = insertTiempo.rows[0].tiempo_id;
    }

    for (const item of productos) {
      const insertMovimiento = `
        INSERT INTO gestion_comercial.fact_movimiento_inventario 
        (producto_id, tipo_movimiento_id, cantidad, fecha_registro, costo_unitario, ubicacion_id, tiempo_id, usuario_id)
        VALUES ($1, 2, 1, CURRENT_TIMESTAMP, $2, 1, $3, 1)`;
      await req.dbClient.query(insertMovimiento, [item.producto_id, item.precio || item.precio_unitario || 0, tiempoId]);
    }
    await req.dbClient.query('COMMIT');
    res.json({ message: "¡Venta completada!" });
  } catch (err) {
    await req.dbClient.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;