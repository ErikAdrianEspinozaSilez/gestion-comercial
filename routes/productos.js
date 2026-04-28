const express = require('express');
const router = express.Router();

// BUSCAR PRODUCTO POR ID (Para el Lector)
router.get('/buscar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const busqueda = id.trim();

    // Ahora pedimos explícitamente la nueva columna precio_unitario
    const query = `
      SELECT producto_id, nombre_producto, precio_unitario, codigo_barra
      FROM gestion_comercial.dim_producto 
      WHERE CAST(producto_id AS TEXT) = $1 
      OR codigo_barra = $1`;
    
    const result = await req.dbClient.query(query, [busqueda]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "No registrado en Super Valle" });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ESTADÍSTICAS PARA EL DASHBOARD
router.get('/stats', async (req, res) => {
  try {
    // 1. Total de productos distintos
    const totalRes = await req.dbClient.query('SELECT COUNT(*) FROM gestion_comercial.dim_producto');
    
    // 2. Conteo de stock bajo
    const bajoRes = await req.dbClient.query(`
      SELECT COUNT(*) FROM (
        SELECT p.producto_id
        FROM gestion_comercial.dim_producto p
        LEFT JOIN gestion_comercial.fact_movimiento_inventario m ON p.producto_id = m.producto_id
        LEFT JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
        GROUP BY p.producto_id
        HAVING (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) < 5
      ) AS subquery
    `);

    // 3. NUEVO: Suma de ventas de hoy
    // Buscamos movimientos de tipo salida/venta (tipo_movimiento_id = 2) realizados hoy
    const ventasHoyRes = await req.dbClient.query(`
      SELECT SUM(costo_unitario) as total 
      FROM gestion_comercial.fact_movimiento_inventario 
      WHERE tipo_movimiento_id = 2 
      AND DATE(fecha_registro) = CURRENT_DATE
    `);

    const ventasTotales = ventasHoyRes.rows[0].total || 0;

    res.json({
      total_items: totalRes.rows[0].count,
      bajo_stock: bajoRes.rows[0].count,
      ventas_hoy: parseFloat(ventasTotales).toFixed(2) // Ahora devuelve la suma real
    });
  } catch (err) {
    console.error("Error en stats:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// STOCK BAJO (Ya implementado, integrado)
router.get('/stock-bajo', async (req, res) => {
  try {
    // Calculamos el stock bajo directamente para evitar errores de la vista
    const query = `
      SELECT 
        p.producto_id, 
        p.nombre_producto, 
        (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) AS stock_total
      FROM gestion_comercial.dim_producto p
      LEFT JOIN gestion_comercial.fact_movimiento_inventario m ON p.producto_id = m.producto_id
      LEFT JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      GROUP BY p.producto_id, p.nombre_producto
      HAVING (COALESCE(SUM(CASE WHEN t.signo = 1 THEN m.cantidad ELSE 0 END), 0) - 
              COALESCE(SUM(CASE WHEN t.signo = -1 THEN m.cantidad ELSE 0 END), 0)) < 5;
    `;
    
    const result = await req.dbClient.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERROR DIRECTO SQL:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// CONSULTA DE TODOS LOS PRODUCTOS
router.get('/', async (req, res) => {
  try {
    // Consultamos a la VISTA que acabamos de crear
    const query = `
      SELECT p.*, v.stock_total 
      FROM gestion_comercial.dim_producto p
      JOIN gestion_comercial.vista_stock_actual v ON p.producto_id = v.producto_id
      ORDER BY p.producto_id ASC`;
    
    const result = await req.dbClient.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AGREGAR PRODUCTO
router.post('/', async (req, res) => {
  try {
    const { nombre_producto } = req.body;
    
    // Validación del campo obligatorio
    if (!nombre_producto) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const codigoGenerado = 'TEMP-' + Date.now();

    // Query de inserción segura
    const query = `
      INSERT INTO dim_producto 
      (codigo_barra, nombre_producto, subcategoria_id, marca_id, unidad_medida_id, stock_minimo, stock_reorden, activo) 
      VALUES (
        $1, 
        $2, 
        (SELECT subcategoria_id FROM dim_subcategoria LIMIT 1), 
        (SELECT marca_id FROM dim_marca LIMIT 1), 
        (SELECT unidad_medida_id FROM dim_unidad_medida LIMIT 1), 
        0, 
        0, 
        TRUE
      ) 
      RETURNING *`;

    const result = await req.dbClient.query(query, [codigoGenerado, nombre_producto]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ FALLO EN EL INSERT:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ELIMINAR PRODUCTO
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await req.dbClient.query(
      'DELETE FROM dim_producto WHERE producto_id = $1 RETURNING *', 
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado en la base de datos" });
    }

    console.log(`✅ Producto con ID ${id} eliminado correctamente`);
    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar:', err.message);
    if (err.code === '23503') {
        return res.status(400).json({ error: "No se puede eliminar: este producto ya tiene movimientos registrados." });
    }
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// RUTA: /productos/historial
router.get('/historial', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.movimiento_id, 
        p.nombre_producto, 
        t.nombre_tipo, 
        m.cantidad, 
        TO_CHAR(m.fecha_registro, 'DD/MM/YYYY HH24:MI') as fecha_formateada
      FROM gestion_comercial.fact_movimiento_inventario m
      JOIN gestion_comercial.dim_producto p ON m.producto_id = p.producto_id
      JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      ORDER BY m.fecha_registro DESC
      LIMIT 10`; // Puedes ajustar el límite si lo necesitas
    const result = await req.dbClient.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en historial:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// FINALIZAR VENTA
router.post('/finalizar-venta', async (req, res) => {
  const { productos } = req.body;
  try {
    await req.dbClient.query('BEGIN');

    // 1. Buscamos si el día de hoy ya existe en dim_tiempo
    let tiempoId;
    const checkTiempo = await req.dbClient.query(
      "SELECT tiempo_id FROM gestion_comercial.dim_tiempo WHERE fecha_completa = CURRENT_DATE LIMIT 1"
    );

    if (checkTiempo.rows.length > 0) {
      tiempoId = checkTiempo.rows[0].tiempo_id;
    } else {
      // Si no existe, dejamos que la DB genere el ID sola (sin mandar tiempo_id manual)
      const insertTiempo = await req.dbClient.query(
        `INSERT INTO gestion_comercial.dim_tiempo (fecha_completa, dia, mes_id) 
         VALUES (CURRENT_DATE, EXTRACT(DAY FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE)) 
         RETURNING tiempo_id`
      );
      tiempoId = insertTiempo.rows[0].tiempo_id;
    }

    // 2. Registramos los movimientos de venta con el ID que obtuvimos
    for (const item of productos) {
      const insertMovimiento = `
        INSERT INTO gestion_comercial.fact_movimiento_inventario 
        (producto_id, tipo_movimiento_id, cantidad, fecha_registro, costo_unitario, ubicacion_id, tiempo_id, usuario_id)
        VALUES ($1, 2, 1, CURRENT_TIMESTAMP, $2, 1, $3, 1)`;
      
      await req.dbClient.query(insertMovimiento, [
        item.producto_id, 
        item.precio_unitario || 0,
        tiempoId
      ]);
    }

    await req.dbClient.query('COMMIT');
    res.json({ message: "¡Venta completada exitosamente!" });
  } catch (err) {
    await req.dbClient.query('ROLLBACK');
    console.error("Error en la venta:", err.message);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;