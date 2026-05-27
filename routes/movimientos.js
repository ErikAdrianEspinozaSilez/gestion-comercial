// backend/routes/movimientos.js
const express = require('express');
const router = express.Router();

const pool = require('../db');
// 1. Obtener historial (GET)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.movimiento_id, 
        p.nombre_producto, 
        m.cantidad, 
        t.nombre_tipo,
        d.fecha_completa
      FROM gestion_comercial.fact_movimiento_inventario m
      JOIN gestion_comercial.dim_producto p ON m.producto_id = p.producto_id
      JOIN gestion_comercial.dim_tipo_movimiento t ON m.tipo_movimiento_id = t.tipo_movimiento_id
      JOIN gestion_comercial.dim_tiempo d ON m.tiempo_id = d.tiempo_id
      ORDER BY m.movimiento_id DESC 
      LIMIT 50
    `;

    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Registrar movimiento o Traspaso (POST)
router.post('/', async (req, res) => {
  const { producto_id, tipo_movimiento, cantidad } = req.body;
  const client = await pool.connect();

  try {
    // Iniciamos una transacción segura
    await client.query('BEGIN');

    // =========================================================
    // CASO A: ES UN TRASPASO DE BODEGA A ESTANTE
    // =========================================================
    if (tipo_movimiento === 'traspaso_estante') {

      // 1. Buscamos los IDs reales para Entrada y Salida
      const idSalidaRes = await client.query(`
        SELECT tipo_movimiento_id 
        FROM gestion_comercial.dim_tipo_movimiento 
        WHERE nombre_tipo = 'salida_venta'
      `);

      const idEntradaRes = await client.query(`
        SELECT tipo_movimiento_id 
        FROM gestion_comercial.dim_tipo_movimiento 
        WHERE nombre_tipo = 'ingreso_compra'
      `);

      const idSalida = idSalidaRes.rows[0].tipo_movimiento_id;
      const idEntrada = idEntradaRes.rows[0].tipo_movimiento_id;

      const insertQuery = `
        INSERT INTO gestion_comercial.fact_movimiento_inventario (
          tiempo_id, 
          producto_id, 
          ubicacion_id, 
          proveedor_id, 
          usuario_id, 
          tipo_movimiento_id, 
          cantidad
        ) 
        VALUES (
          (SELECT tiempo_id FROM gestion_comercial.dim_tiempo LIMIT 1), 
          $1, 
          $2, 
          (SELECT proveedor_id FROM gestion_comercial.dim_proveedor LIMIT 1), 
          (SELECT usuario_id FROM gestion_comercial.dim_usuario LIMIT 1), 
          $3, 
          $4
        )
      `;

      // Asiento 1: RESTAR de la Bodega (ubicacion_id = 1)
      await client.query(insertQuery, [producto_id, 1, idSalida, cantidad]);

      // Asiento 2: SUMAR al Estante (ubicacion_id = 2)
      await client.query(insertQuery, [producto_id, 2, idEntrada, cantidad]);

    } else {
      // =========================================================
      // CASO B: ES UNA COMPRA O UN AJUSTE NORMAL
      // =========================================================

      const tipoRes = await client.query(
        `
          SELECT tipo_movimiento_id 
          FROM gestion_comercial.dim_tipo_movimiento 
          WHERE nombre_tipo = $1
        `,
        [tipo_movimiento]
      );

      if (tipoRes.rowCount === 0) {
        throw new Error(`El tipo '${tipo_movimiento}' no existe en la BD.`);
      }

      const tipoId = tipoRes.rows[0].tipo_movimiento_id;

      // Las compras nuevas entran por defecto a Bodega (1)
      const ubicacionId = 1;

      const queryNormal = `
        INSERT INTO gestion_comercial.fact_movimiento_inventario (
          tiempo_id, 
          producto_id, 
          ubicacion_id, 
          proveedor_id, 
          usuario_id, 
          tipo_movimiento_id, 
          cantidad
        ) 
        VALUES (
          (SELECT tiempo_id FROM gestion_comercial.dim_tiempo LIMIT 1), 
          $1, 
          $2, 
          (SELECT proveedor_id FROM gestion_comercial.dim_proveedor LIMIT 1), 
          (SELECT usuario_id FROM gestion_comercial.dim_usuario LIMIT 1), 
          $3, 
          $4
        )
      `;

      await client.query(queryNormal, [
        producto_id,
        ubicacionId,
        tipoId,
        cantidad
      ]);
    }

    // Si todo salió bien, guardamos los cambios
    await client.query('COMMIT');

    console.log(`✅ Operación '${tipo_movimiento}' completada con éxito`);

    res.status(201).json({
      message: "Movimiento registrado correctamente"
    });

  } catch (err) {
    // Si algo falla, deshacemos todo para no romper el inventario
    await client.query('ROLLBACK');

    console.error("❌ ERROR AL REGISTRAR MOVIMIENTO:", err.message);

    res.status(500).json({
      error: err.message
    });
  } finally {
    client.release();
  }
});

// 3. Reporte PDF
router.get('/reporte-pdf', async (req, res) => {
  // Recibimos el tipo de filtro y los valores seleccionados por el cliente
  const { filtro, mesAnio, inicio, fin } = req.query;

  let fechaInicio = '';
  let fechaFin = '';

  const hoy = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato 'YYYY-MM-DD'

  // LÓGICA DE DETECCIÓN DE RANGOS ABSOLUTOS
  if (filtro === 'dia') {
    fechaInicio = hoy;
    fechaFin = hoy;
  } else if (filtro === 'semana') {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    fechaInicio = hace7Dias.toISOString().split('T')[0];
    fechaFin = hoy;
  } else if (filtro === 'mes_especifico' && mesAnio) {
    // Si el Admin elige un mes, ejemplo: "2026-03"
    fechaInicio = `${mesAnio}-01`;

    const [anio, mes] = mesAnio.split('-');

    // El día 0 del mes siguiente nos da el último día del mes actual
    const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate();

    fechaFin = `${mesAnio}-${ultimoDia}`;
  } else if (filtro === 'rango_personalizado' && inicio && fin) {
    // Si elige días específicos o un rango manual
    fechaInicio = inicio;
    fechaFin = fin;
  } else {
    // Filtro por defecto: hoy
    fechaInicio = hoy;
    fechaFin = hoy;
  }

  try {
    const query = `
      SELECT 
        m.movimiento_id,
        p.nombre_producto,
        p.precio,
        m.cantidad,
        m.tipo_movimiento_id,
        TO_CHAR(t.fecha_completa, 'DD/MM/YYYY') as fecha_formateada
      FROM gestion_comercial.fact_movimiento_inventario m
      JOIN gestion_comercial.dim_producto p ON m.producto_id = p.producto_id
      JOIN gestion_comercial.dim_tiempo t ON m.tiempo_id = t.tiempo_id
      WHERE t.fecha_completa BETWEEN $1 AND $2
      ORDER BY m.movimiento_id DESC
    `;

    const result = await pool.query(query, [fechaInicio, fechaFin]);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al generar datos del reporte:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;