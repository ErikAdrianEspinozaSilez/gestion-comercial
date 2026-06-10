// backend/routes/productos.js
const express = require('express');
const router = express.Router();

const pool = require('../db');
// 1. BUSCAR PRODUCTO POR ID (Para el Lector de código de barras)
router.get('/buscar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const busqueda = id.trim();

    const query = `
      SELECT producto_id, nombre_producto, precio, codigo_barra
      FROM gestion_comercial.dim_producto 
      WHERE (CAST(producto_id AS TEXT) = $1 OR codigo_barra = $1)
      AND activo = TRUE
    `;

    const result = await pool.query(query, [busqueda]);

    if (result.rows.length > 0) {
      const producto = result.rows[0];

      // Convertimos precio a número seguro
      producto.precio = Number(producto.precio) || 0;

      res.json(producto);
    } else {
      res.status(404).json({ message: "No registrado o inactivo" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ESTADÍSTICAS PARA EL DASHBOARD
router.get('/stats', async (req, res) => {
  try {
    const totalRes = await pool.query(`
      SELECT COUNT(*) 
      FROM gestion_comercial.dim_producto 
      WHERE activo = TRUE
    `);

    const bajoRes = await pool.query(`
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

    const ventasHoyRes = await pool.query(`
      SELECT SUM(precio) as total 
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

// 3. STOCK BAJO (Alertas Automáticas)
router.get('/stock-bajo', async (req, res) => {
  try {
    const query = `
      SELECT
        producto_id,
        nombre_producto,
        codigo_barra,
        imagen_url,
        stock_bodega,
        stock_estante,
        (stock_bodega + stock_estante) AS stock_total,

        CASE
          WHEN stock_bodega < 5 THEN 'PROVEEDOR'
          WHEN stock_estante < 2 THEN 'REPOSICION'
        END AS tipo_alerta

      FROM gestion_comercial.dim_producto
      WHERE activo = TRUE
      AND (
        stock_bodega < 5
        OR stock_estante < 2
      );
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 4. CONSULTA DE TODOS LOS PRODUCTOS (Para la tabla de inventario con Ubicaciones)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
        -- 1. STOCK EN BODEGA (ubicacion_id = 1)
        (COALESCE(SUM(CASE WHEN t.signo = 1 AND m.ubicacion_id = 1 THEN m.cantidad ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.signo = -1 AND m.ubicacion_id = 1 THEN m.cantidad ELSE 0 END), 0)) AS stock_bodega,
         
        -- 2. STOCK EN ESTANTE (ubicacion_id = 2)
        (COALESCE(SUM(CASE WHEN t.signo = 1 AND m.ubicacion_id = 2 THEN m.cantidad ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.signo = -1 AND m.ubicacion_id = 2 THEN m.cantidad ELSE 0 END), 0)) AS stock_estante,
         
        -- 3. STOCK TOTAL GLOBAL
        (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) AS stock_total
      FROM gestion_comercial.dim_producto p
      LEFT JOIN gestion_comercial.fact_movimiento_inventario m ON p.producto_id = m.producto_id
      LEFT JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      WHERE p.activo = TRUE
      GROUP BY p.producto_id
      ORDER BY p.producto_id DESC
    `;

    const result = await pool.query(query);

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
      VALUES ($1, $2, $3, $4, 1, 1, 1, TRUE) 
      RETURNING *
    `;

    const result = await pool.query(query, [
      codigoFinal,
      nombre_producto,
      Number(precio) || 0,
      imagen_url
    ]);

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
    const precioFinal = Number(precio) || 0;

    const query = `
      UPDATE gestion_comercial.dim_producto 
      SET nombre_producto = $1, precio = $2, codigo_barra = $3, imagen_url = $4
      WHERE producto_id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre_producto,
      precioFinal,
      codigo_barra,
      imagen_url,
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No se encontró el producto para editar" });
    }

    res.json({ message: "Producto actualizado correctamente" });
  } catch (err) {
    console.error("❌ ERROR SQL AL EDITAR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. ELIMINAR PRODUCTO (Borrado Lógico)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE gestion_comercial.dim_producto SET activo = FALSE WHERE producto_id = $1',
      [id]
    );

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
      ORDER BY m.fecha_registro DESC 
      LIMIT 10
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. FINALIZAR VENTA (Corregido y Blindado)
router.post('/finalizar-venta', async (req, res) => {
  const { productos } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener o crear el tiempo de hoy
    let tiempoId;

    const checkTiempo = await client.query(`
      SELECT tiempo_id 
      FROM gestion_comercial.dim_tiempo 
      WHERE fecha_completa = CURRENT_DATE 
      LIMIT 1
    `);

    if (checkTiempo.rows.length > 0) {
      tiempoId = checkTiempo.rows[0].tiempo_id;
    } else {
      const insertTiempo = await client.query(`
        INSERT INTO gestion_comercial.dim_tiempo 
        (fecha_completa, dia, mes_id) 
        VALUES (
          CURRENT_DATE, 
          EXTRACT(DAY FROM CURRENT_DATE), 
          EXTRACT(MONTH FROM CURRENT_DATE)
        ) 
        RETURNING tiempo_id
      `);

      tiempoId = insertTiempo.rows[0].tiempo_id;
    }

    // 2. Buscar el ID REAL de 'salida_venta' dinámicamente
    const idSalidaRes = await client.query(`
      SELECT tipo_movimiento_id 
      FROM gestion_comercial.dim_tipo_movimiento 
      WHERE nombre_tipo = 'salida_venta'
    `);

    const idSalida = idSalidaRes.rows[0].tipo_movimiento_id;

    // 3. Insertar cada producto vendido DESCONTANDO DEL ESTANTE (ubicacion_id = 2)
    for (const item of productos) {
      const insertMovimiento = `
        INSERT INTO gestion_comercial.fact_movimiento_inventario 
        (
          producto_id, 
          tipo_movimiento_id, 
          cantidad, 
          fecha_registro, 
          precio, 
          ubicacion_id, 
          tiempo_id, 
          usuario_id, 
          proveedor_id
        )
        VALUES (
          $1, 
          $2, 
          1, 
          CURRENT_TIMESTAMP, 
          $3, 
          2, 
          $4, 
          (SELECT usuario_id FROM gestion_comercial.dim_usuario LIMIT 1),
          (SELECT proveedor_id FROM gestion_comercial.dim_proveedor LIMIT 1)
        )
      `;

      const precioItem = item.precio || item.precio_unitario || 0;

      await client.query(insertMovimiento, [
        item.producto_id,
        idSalida,
        precioItem,
        tiempoId
      ]);
    }

    await client.query('COMMIT');

    res.json({ message: "¡Venta completada!" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error al finalizar venta:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 10. DASHBOARD DE VENTAS Y PRODUCTO ESTRELLA
router.get('/dashboard-ventas', async (req, res) => {
  try {
    const ventasHoyRes = await pool.query(`
      SELECT COALESCE(SUM(precio * cantidad), 0) as total 
      FROM gestion_comercial.fact_movimiento_inventario 
      WHERE tipo_movimiento_id = 2 AND DATE(fecha_registro) = CURRENT_DATE
    `);

    const ventasSemanaRes = await pool.query(`
      SELECT COALESCE(SUM(precio * cantidad), 0) as total 
      FROM gestion_comercial.fact_movimiento_inventario 
      WHERE tipo_movimiento_id = 2 
      AND date_trunc('week', fecha_registro) = date_trunc('week', CURRENT_DATE)
    `);

    const ventasMesRes = await pool.query(`
      SELECT COALESCE(SUM(precio * cantidad), 0) as total 
      FROM gestion_comercial.fact_movimiento_inventario 
      WHERE tipo_movimiento_id = 2 
      AND date_trunc('month', fecha_registro) = date_trunc('month', CURRENT_DATE)
    `);

    const productoEstrellaRes = await pool.query(`
      SELECT p.nombre_producto, p.imagen_url, SUM(m.cantidad) as total_vendido
      FROM gestion_comercial.fact_movimiento_inventario m
      JOIN gestion_comercial.dim_producto p ON m.producto_id = p.producto_id
      WHERE m.tipo_movimiento_id = 2
      GROUP BY p.producto_id, p.nombre_producto, p.imagen_url
      ORDER BY total_vendido DESC
      LIMIT 1
    `);

    res.json({
      ventas_hoy: parseFloat(ventasHoyRes.rows[0].total).toFixed(2),
      ventas_semana: parseFloat(ventasSemanaRes.rows[0].total).toFixed(2),
      ventas_mes: parseFloat(ventasMesRes.rows[0].total).toFixed(2),
      producto_estrella: productoEstrellaRes.rows.length > 0 ? productoEstrellaRes.rows[0] : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. HISTORIAL DETALLADO CON FILTROS DE TIEMPO
router.get('/historial-detallado', async (req, res) => {
  const { periodo } = req.query; // Puede ser 'hoy', 'semana', 'mes' o null

  try {
    let filtroFecha = "";

    if (periodo === 'hoy') {
      filtroFecha = "AND DATE(m.fecha_registro) = CURRENT_DATE";
    } else if (periodo === 'semana') {
      filtroFecha = "AND date_trunc('week', m.fecha_registro) = date_trunc('week', CURRENT_DATE)";
    } else if (periodo === 'mes') {
      filtroFecha = "AND date_trunc('month', m.fecha_registro) = date_trunc('month', CURRENT_DATE)";
    }

    const query = `
      SELECT m.movimiento_id, p.nombre_producto, t.nombre_tipo, m.cantidad, 
             m.precio as precio_venta,
             (m.cantidad * m.precio) as subtotal,
             TO_CHAR(m.fecha_registro, 'DD/MM/YYYY HH24:MI') as fecha_formateada
      FROM gestion_comercial.fact_movimiento_inventario m
      JOIN gestion_comercial.dim_producto p ON m.producto_id = p.producto_id
      JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      WHERE 1=1 ${filtroFecha}
      ORDER BY m.fecha_registro DESC
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;