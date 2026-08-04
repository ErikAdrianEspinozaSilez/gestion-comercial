// backend/routes/analisisPredictivo.js
const express = require('express');
const router = express.Router();

const pool = require('../db');

const AGRUPACIONES_VALIDAS = new Set(['semanal', 'mensual']);
const MIN_PERIODOS = 3;
const MAX_PERIODOS = 12;

function esFechaISO(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

// 1. Productos activos disponibles para el selector del módulo
router.get('/productos', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        producto_id,
        nombre_producto,
        imagen_url,
        precio
      FROM gestion_comercial.dim_producto
      WHERE activo = TRUE
      ORDER BY nombre_producto ASC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al consultar productos del análisis:', error.message);
    res.status(500).json({ error: 'No se pudieron obtener los productos activos.' });
  }
});

// 2. Historial agrupado, todavía sin calcular la estimación
// Ejemplo:
// GET /analisis-predictivo/historial/1?agrupacion=mensual&periodos=4&hasta=2026-07-01
router.get('/historial/:productoId', async (req, res) => {
  const productoId = Number.parseInt(req.params.productoId, 10);
  const agrupacion = String(req.query.agrupacion || 'mensual').toLowerCase();
  const periodos = Number.parseInt(req.query.periodos || '3', 10);
  const hasta = req.query.hasta ? String(req.query.hasta) : null;

  if (!Number.isInteger(productoId) || productoId <= 0) {
    return res.status(400).json({ error: 'El producto seleccionado no es válido.' });
  }

  if (!AGRUPACIONES_VALIDAS.has(agrupacion)) {
    return res.status(400).json({
      error: "La agrupación debe ser 'semanal' o 'mensual'."
    });
  }

  if (!Number.isInteger(periodos) || periodos < MIN_PERIODOS || periodos > MAX_PERIODOS) {
    return res.status(400).json({
      error: `La cantidad de periodos debe estar entre ${MIN_PERIODOS} y ${MAX_PERIODOS}.`
    });
  }

  if (hasta !== null && !esFechaISO(hasta)) {
    return res.status(400).json({
      error: "El parámetro 'hasta' debe tener el formato YYYY-MM-DD."
    });
  }

  try {
    const productoResult = await pool.query(`
      SELECT producto_id, nombre_producto, imagen_url, precio
      FROM gestion_comercial.dim_producto
      WHERE producto_id = $1
        AND activo = TRUE
    `, [productoId]);

    if (productoResult.rowCount === 0) {
      return res.status(404).json({
        error: 'El producto no existe o está inactivo.'
      });
    }

    const esMensual = agrupacion === 'mensual';
    const unidadIntervalo = esMensual ? '1 month' : '1 week';
    const truncamiento = esMensual ? 'month' : 'week';
    const finPeriodo = esMensual
      ? "(s.periodo_inicio + INTERVAL '1 month - 1 day')::date"
      : "(s.periodo_inicio + INTERVAL '6 days')::date";

    const query = `
      WITH parametros AS (
        SELECT
          CASE
            WHEN $3::date IS NULL THEN
              (DATE_TRUNC('${truncamiento}', CURRENT_DATE)::date - INTERVAL '${unidadIntervalo}')::date
            ELSE DATE_TRUNC('${truncamiento}', $3::date)::date
          END AS periodo_final
      ),
      validacion AS (
        SELECT
          periodo_final,
          DATE_TRUNC('${truncamiento}', CURRENT_DATE)::date AS periodo_actual
        FROM parametros
      ),
      series AS (
        SELECT GENERATE_SERIES(
          v.periodo_final - (($2 - 1) * INTERVAL '${unidadIntervalo}'),
          v.periodo_final,
          INTERVAL '${unidadIntervalo}'
        )::date AS periodo_inicio
        FROM validacion v
        WHERE v.periodo_final < v.periodo_actual
      ),
      ventas AS (
        SELECT
          DATE_TRUNC('${truncamiento}', f.fecha_registro)::date AS periodo_inicio,
          SUM(f.cantidad)::numeric AS cantidad_vendida
        FROM gestion_comercial.fact_movimiento_inventario f
        INNER JOIN gestion_comercial.dim_tipo_movimiento tm
          ON tm.tipo_movimiento_id = f.tipo_movimiento_id
        WHERE f.producto_id = $1
          AND tm.nombre_tipo = 'salida_venta'
          AND COALESCE(f.precio, 0) > 0
        GROUP BY DATE_TRUNC('${truncamiento}', f.fecha_registro)::date
      )
      SELECT
        s.periodo_inicio,
        ${finPeriodo} AS periodo_fin,
        COALESCE(v.cantidad_vendida, 0)::numeric AS cantidad_vendida
      FROM series s
      LEFT JOIN ventas v
        ON v.periodo_inicio = s.periodo_inicio
      ORDER BY s.periodo_inicio ASC
    `;

    const result = await pool.query(query, [productoId, periodos, hasta]);

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: esMensual
          ? 'El mes seleccionado todavía no ha finalizado. Seleccione un mes completo.'
          : 'La semana seleccionada todavía no ha finalizado. Seleccione una semana completa de lunes a domingo.'
      });
    }

    const historial = result.rows.map((fila) => ({
      periodo_inicio: fila.periodo_inicio,
      periodo_fin: fila.periodo_fin,
      cantidad_vendida: Number(fila.cantidad_vendida)
    }));

    return res.status(200).json({
      producto: productoResult.rows[0],
      agrupacion,
      periodos_solicitados: periodos,
      historial
    });
  } catch (error) {
    console.error('Error al obtener historial predictivo:', error.message);
    return res.status(500).json({
      error: 'No se pudo obtener el historial de ventas del producto.'
    });
  }
});

module.exports = router;
