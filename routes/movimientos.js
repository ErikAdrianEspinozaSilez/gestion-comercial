const express = require('express');
const router = express.Router();

// 1. Obtener historial (GET)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.movimiento_id, 
        p.nombre_producto, 
        m.cantidad, 
        t.nombre_tipo,
        d.fecha_completa -- Aquí está tu columna real de fecha
      FROM fact_movimiento_inventario m
      JOIN dim_producto p ON m.producto_id = p.producto_id
      JOIN dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      JOIN dim_tiempo d ON m.tiempo_id = d.tiempo_id
      ORDER BY m.movimiento_id DESC LIMIT 50`;
    
    const result = await req.dbClient.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Registrar movimiento (POST) - Simplificado para que NO falle
router.post('/', async (req, res) => {
  const { producto_id, tipo_movimiento, cantidad } = req.body; 

  try {
    // 1. Buscamos el ID usando los nombres reales: 'ingreso_compra' o 'salida_venta'
    const tipoRes = await req.dbClient.query(
      'SELECT tipo_movimiento_id FROM dim_tipo_movimiento WHERE nombre_tipo = $1',
      [tipo_movimiento]
    );

    if (tipoRes.rowCount === 0) {
      return res.status(400).json({ error: `El tipo '${tipo_movimiento}' no existe en la BD.` });
    }

    const tipoId = tipoRes.rows[0].tipo_movimiento_id;

    // 2. Insertamos en la tabla de hechos
    const query = `
      INSERT INTO fact_movimiento_inventario (
        tiempo_id, 
        producto_id, 
        ubicacion_id, 
        proveedor_id, 
        usuario_id, 
        tipo_movimiento_id, 
        cantidad
      ) VALUES (
        (SELECT tiempo_id FROM dim_tiempo LIMIT 1), 
        $1, 
        (SELECT ubicacion_id FROM dim_ubicacion LIMIT 1), 
        (SELECT proveedor_id FROM dim_proveedor LIMIT 1), 
        (SELECT usuario_id FROM dim_usuario LIMIT 1), 
        $2, 
        $3
      ) RETURNING *`;
    
    const result = await req.dbClient.query(query, [producto_id, tipoId, cantidad]);
    
    console.log("✅ Movimiento registrado con éxito en Super Valle");
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ ERROR EN TRIGGER:", err.message);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;