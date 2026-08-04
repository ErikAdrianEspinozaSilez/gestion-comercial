// backend/routes/analisisPredictivo.js
const express = require('express');
const router = express.Router();

const pool = require('../db');

const AGRUPACIONES_VALIDAS = new Set(['semanal', 'mensual']);
const MIN_PERIODOS = 3;
const MAX_PERIODOS = 12;

function esFechaISO(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime())) return false;

  return fecha.toISOString().slice(0, 10) === valor;
}

function formatearFechaUTC(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function sumarPeriodo(fechaISO, agrupacion) {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`);

  if (agrupacion === 'mensual') {
    fecha.setUTCMonth(fecha.getUTCMonth() + 1);
  } else {
    fecha.setUTCDate(fecha.getUTCDate() + 7);
  }

  return formatearFechaUTC(fecha);
}

function calcularFinPeriodo(inicioISO, agrupacion) {
  const fecha = new Date(`${inicioISO}T00:00:00.000Z`);

  if (agrupacion === 'mensual') {
    fecha.setUTCMonth(fecha.getUTCMonth() + 1);
    fecha.setUTCDate(fecha.getUTCDate() - 1);
  } else {
    fecha.setUTCDate(fecha.getUTCDate() + 6);
  }

  return formatearFechaUTC(fecha);
}

function calcularTendencia(historial) {
  const primero = historial[0].cantidad_vendida;
  const ultimo = historial[historial.length - 1].cantidad_vendida;

  if (primero === 0 && ultimo === 0) {
    return { tendencia: 'estable', variacion_porcentual: 0 };
  }

  if (primero === 0 && ultimo > 0) {
    return { tendencia: 'creciente', variacion_porcentual: null };
  }

  if (primero > 0 && ultimo === 0) {
    return { tendencia: 'decreciente', variacion_porcentual: -100 };
  }

  const variacion = ((ultimo - primero) / primero) * 100;
  const variacionRedondeada = Number(variacion.toFixed(2));

  if (variacion > 5) {
    return { tendencia: 'creciente', variacion_porcentual: variacionRedondeada };
  }

  if (variacion < -5) {
    return { tendencia: 'decreciente', variacion_porcentual: variacionRedondeada };
  }

  return { tendencia: 'estable', variacion_porcentual: variacionRedondeada };
}

function leerParametros(req, res) {
  const productoId = Number.parseInt(req.params.productoId, 10);
  const agrupacion = String(req.query.agrupacion || 'mensual').toLowerCase();
  const periodos = Number.parseInt(req.query.periodos || '3', 10);
  const hasta = req.query.hasta ? String(req.query.hasta) : null;

  if (!Number.isInteger(productoId) || productoId <= 0) {
    res.status(400).json({ error: 'El producto seleccionado no es válido.' });
    return null;
  }

  if (!AGRUPACIONES_VALIDAS.has(agrupacion)) {
    res.status(400).json({
      error: "La agrupación debe ser 'semanal' o 'mensual'."
    });
    return null;
  }

  if (!Number.isInteger(periodos) || periodos < MIN_PERIODOS || periodos > MAX_PERIODOS) {
    res.status(400).json({
      error: `La cantidad de periodos debe estar entre ${MIN_PERIODOS} y ${MAX_PERIODOS}.`
    });
    return null;
  }

  if (hasta !== null && !esFechaISO(hasta)) {
    res.status(400).json({
      error: "El parámetro 'hasta' debe tener el formato YYYY-MM-DD y representar una fecha válida."
    });
    return null;
  }

  return { productoId, agrupacion, periodos, hasta };
}

async function obtenerProductoActivo(productoId) {
  const result = await pool.query(`
    SELECT producto_id, nombre_producto, imagen_url, precio
    FROM gestion_comercial.dim_producto
    WHERE producto_id = $1
      AND activo = TRUE
  `, [productoId]);

  return result.rows[0] || null;
}

async function obtenerHistorial({ productoId, agrupacion, periodos, hasta }) {
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
      TO_CHAR(s.periodo_inicio, 'YYYY-MM-DD') AS periodo_inicio,
      TO_CHAR(${finPeriodo}, 'YYYY-MM-DD') AS periodo_fin,
      COALESCE(v.cantidad_vendida, 0)::numeric AS cantidad_vendida
    FROM series s
    LEFT JOIN ventas v
      ON v.periodo_inicio = s.periodo_inicio
    ORDER BY s.periodo_inicio ASC
  `;

  const result = await pool.query(query, [productoId, periodos, hasta]);

  return result.rows.map((fila) => ({
    periodo_inicio: fila.periodo_inicio,
    periodo_fin: fila.periodo_fin,
    cantidad_vendida: Number(fila.cantidad_vendida)
  }));
}

async function obtenerPrimerPeriodoConVenta(productoId, agrupacion) {
  const truncamiento = agrupacion === 'mensual' ? 'month' : 'week';

  const result = await pool.query(`
    SELECT TO_CHAR(
      DATE_TRUNC('${truncamiento}', MIN(f.fecha_registro))::date,
      'YYYY-MM-DD'
    ) AS primer_periodo
    FROM gestion_comercial.fact_movimiento_inventario f
    INNER JOIN gestion_comercial.dim_tipo_movimiento tm
      ON tm.tipo_movimiento_id = f.tipo_movimiento_id
    WHERE f.producto_id = $1
      AND tm.nombre_tipo = 'salida_venta'
      AND COALESCE(f.precio, 0) > 0
  `, [productoId]);

  return result.rows[0]?.primer_periodo || null;
}

function mensajePeriodoIncompleto(agrupacion) {
  return agrupacion === 'mensual'
    ? 'El mes seleccionado todavía no ha finalizado. Seleccione un mes completo.'
    : 'La semana seleccionada todavía no ha finalizado. Seleccione una semana completa de lunes a domingo.';
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

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al consultar productos del análisis:', error.message);
    return res.status(500).json({
      error: 'No se pudieron obtener los productos activos.'
    });
  }
});

// 2. Historial agrupado por semanas o meses
router.get('/historial/:productoId', async (req, res) => {
  const parametros = leerParametros(req, res);
  if (!parametros) return;

  try {
    const producto = await obtenerProductoActivo(parametros.productoId);

    if (!producto) {
      return res.status(404).json({
        error: 'El producto no existe o está inactivo.'
      });
    }

    const historial = await obtenerHistorial(parametros);

    if (historial.length === 0) {
      return res.status(400).json({
        error: mensajePeriodoIncompleto(parametros.agrupacion)
      });
    }

    return res.status(200).json({
      producto,
      agrupacion: parametros.agrupacion,
      periodos_solicitados: parametros.periodos,
      historial
    });
  } catch (error) {
    console.error('Error al obtener historial predictivo:', error.message);
    return res.status(500).json({
      error: 'No se pudo obtener el historial de ventas del producto.'
    });
  }
});

// 3. Estimación del siguiente periodo mediante promedio móvil simple
// Ejemplo:
// GET /analisis-predictivo/estimacion/1?agrupacion=mensual&periodos=4&hasta=2026-07-01
router.get('/estimacion/:productoId', async (req, res) => {
  const parametros = leerParametros(req, res);
  if (!parametros) return;

  try {
    const producto = await obtenerProductoActivo(parametros.productoId);

    if (!producto) {
      return res.status(404).json({
        error: 'El producto no existe o está inactivo.'
      });
    }

    const [historial, primerPeriodoConVenta] = await Promise.all([
      obtenerHistorial(parametros),
      obtenerPrimerPeriodoConVenta(parametros.productoId, parametros.agrupacion)
    ]);

    if (historial.length === 0) {
      return res.status(400).json({
        error: mensajePeriodoIncompleto(parametros.agrupacion)
      });
    }

    const periodosDisponibles = primerPeriodoConVenta
      ? historial.filter((fila) => fila.periodo_inicio >= primerPeriodoConVenta).length
      : 0;

    const periodoAnalizado = {
      inicio: historial[0].periodo_inicio,
      fin: historial[historial.length - 1].periodo_fin
    };

    const proximoInicio = sumarPeriodo(
      historial[historial.length - 1].periodo_inicio,
      parametros.agrupacion
    );

    const proximoPeriodo = {
      inicio: proximoInicio,
      fin: calcularFinPeriodo(proximoInicio, parametros.agrupacion)
    };

    if (periodosDisponibles < parametros.periodos) {
      return res.status(200).json({
        producto,
        agrupacion: parametros.agrupacion,
        metodo: 'promedio_movil_simple',
        periodos_solicitados: parametros.periodos,
        periodos_disponibles: periodosDisponibles,
        suficientes_datos: false,
        mensaje: `El producto dispone de ${periodosDisponibles} periodo(s) histórico(s) y se solicitaron ${parametros.periodos}. Se requieren al menos ${MIN_PERIODOS} periodos completos desde su primera venta.`,
        periodo_analizado: periodoAnalizado,
        proximo_periodo: proximoPeriodo,
        historial,
        promedio_calculado: null,
        demanda_estimada: null,
        tendencia: null,
        variacion_porcentual: null
      });
    }

    const totalVendido = historial.reduce(
      (acumulado, fila) => acumulado + fila.cantidad_vendida,
      0
    );

    const promedioCalculado = totalVendido / historial.length;
    const demandaEstimada = Math.max(0, Math.round(promedioCalculado));
    const resultadoTendencia = calcularTendencia(historial);

    return res.status(200).json({
      producto,
      agrupacion: parametros.agrupacion,
      metodo: 'promedio_movil_simple',
      periodos_solicitados: parametros.periodos,
      periodos_disponibles: periodosDisponibles,
      suficientes_datos: true,
      periodo_analizado: periodoAnalizado,
      proximo_periodo: proximoPeriodo,
      historial,
      total_vendido: Number(totalVendido.toFixed(2)),
      promedio_calculado: Number(promedioCalculado.toFixed(2)),
      demanda_estimada: demandaEstimada,
      tendencia: resultadoTendencia.tendencia,
      variacion_porcentual: resultadoTendencia.variacion_porcentual
    });
  } catch (error) {
    console.error('Error al generar la estimación:', error.message);
    return res.status(500).json({
      error: 'No se pudo generar la estimación de demanda.'
    });
  }
});

module.exports = router;
