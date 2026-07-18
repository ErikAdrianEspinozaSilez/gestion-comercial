const express = require('express');
const router = express.Router();
const pool = require('../db');

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

const validarCorreo = (correo) => {
  const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return expresionCorreo.test(correo);
};

const normalizarTexto = (valor) => {
  return typeof valor === 'string'
    ? valor.trim()
    : '';
};

const normalizarProductos = (productosIds) => {
  if (!Array.isArray(productosIds)) {
    return [];
  }

  return [
    ...new Set(
      productosIds
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  ];
};

/**
 * Valida los datos recibidos para registrar o actualizar.
 */
const validarProveedor = (body) => {
  const errores = {};

  const razonSocial = normalizarTexto(
    body.razon_social
  );

  const nit = normalizarTexto(body.nit);

  const correoPrincipal = normalizarTexto(
    body.correo_principal
  ).toLowerCase();

  const telefonoPrincipal = normalizarTexto(
    body.telefono_principal
  );

  const tipoProveedorId = Number(
    body.tipo_proveedor_id
  );

  if (!razonSocial) {
    errores.razon_social =
      'La razón social es obligatoria.';
  } else if (razonSocial.length < 3) {
    errores.razon_social =
      'La razón social debe tener al menos 3 caracteres.';
  } else if (razonSocial.length > 150) {
    errores.razon_social =
      'La razón social no puede superar los 150 caracteres.';
  }

  if (!nit) {
    errores.nit =
      'El NIT es obligatorio.';
  } else if (!/^\d+$/.test(nit)) {
    errores.nit =
      'El NIT solamente puede contener números.';
  } else if (nit.length < 5) {
    errores.nit =
      'El NIT debe tener al menos 5 números.';
  } else if (nit.length > 20) {
    errores.nit =
      'El NIT no puede superar los 20 números.';
  }

  if (!correoPrincipal) {
    errores.correo_principal =
      'El correo principal es obligatorio.';
  } else if (!validarCorreo(correoPrincipal)) {
    errores.correo_principal =
      'El correo principal no tiene un formato válido.';
  } else if (correoPrincipal.length > 150) {
    errores.correo_principal =
      'El correo no puede superar los 150 caracteres.';
  }

  if (!telefonoPrincipal) {
    errores.telefono_principal =
      'El teléfono principal es obligatorio.';
  } else if (!/^\d+$/.test(telefonoPrincipal)) {
    errores.telefono_principal =
      'El teléfono solamente puede contener números.';
  } else if (telefonoPrincipal.length < 7) {
    errores.telefono_principal =
      'El teléfono debe tener al menos 7 números.';
  } else if (telefonoPrincipal.length > 15) {
    errores.telefono_principal =
      'El teléfono no puede superar los 15 números.';
  }

  if (
    !Number.isInteger(tipoProveedorId) ||
    tipoProveedorId <= 0
  ) {
    errores.tipo_proveedor_id =
      'Debes seleccionar un tipo de proveedor válido.';
  }

  if (
    body.productos_ids !== undefined &&
    !Array.isArray(body.productos_ids)
  ) {
    errores.productos_ids =
      'Los productos seleccionados deben enviarse como una lista.';
  }

  return {
    errores,
    datos: {
      razon_social: razonSocial,
      nit,
      correo_principal: correoPrincipal,
      telefono_principal: telefonoPrincipal,
      tipo_proveedor_id: tipoProveedorId,
      productos_ids: normalizarProductos(
        body.productos_ids
      )
    }
  };
};

/**
 * Envía mensajes claros según el error de PostgreSQL.
 */
const responderErrorBaseDatos = (
  error,
  res,
  operacion
) => {
  console.error(
    `--- ERROR EN ${operacion} ---`,
    {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    }
  );

  /*
    23505: unique_violation
  */
  if (error.code === '23505') {
    const detalle =
      String(error.detail || '').toLowerCase();

    if (detalle.includes('nit')) {
      return res.status(409).json({
        error:
          'Ya existe un proveedor registrado con ese NIT.',
        campo: 'nit'
      });
    }

    if (
      detalle.includes('correo') ||
      detalle.includes('email')
    ) {
      return res.status(409).json({
        error:
          'Ya existe un proveedor registrado con ese correo.',
        campo: 'correo_principal'
      });
    }

    return res.status(409).json({
      error:
        'Ya existe un registro con esos datos.'
    });
  }

  /*
    23503: foreign_key_violation
  */
  if (error.code === '23503') {
    const detalle = String(
      error.detail || error.message || ''
    ).toLowerCase();

    if (
      detalle.includes('tipo_proveedor') ||
      String(error.constraint || '')
        .toLowerCase()
        .includes('tipo_proveedor')
    ) {
      return res.status(400).json({
        error:
          'El tipo de proveedor seleccionado no existe en la base de datos.',
        campo: 'tipo_proveedor_id'
      });
    }

    if (
      detalle.includes('producto') ||
      String(error.constraint || '')
        .toLowerCase()
        .includes('producto')
    ) {
      return res.status(400).json({
        error:
          'Uno de los productos seleccionados no existe.',
        campo: 'productos_ids'
      });
    }

    return res.status(400).json({
      error:
        'Uno de los datos relacionados no existe en la base de datos.'
    });
  }

  /*
    23502: not_null_violation
  */
  if (error.code === '23502') {
    return res.status(400).json({
      error: `El campo ${
        error.column || 'solicitado'
      } es obligatorio.`,
      campo: error.column || null
    });
  }

  /*
    22P02: invalid_text_representation
  */
  if (error.code === '22P02') {
    return res.status(400).json({
      error:
        'Uno de los valores enviados tiene un formato incorrecto.'
    });
  }

  return res.status(500).json({
    error:
      'Ocurrió un error interno al procesar el proveedor.',
    detalle:
      process.env.NODE_ENV === 'development'
        ? error.message
        : undefined
  });
};

/* =========================================================
   GET: OBTENER PROVEEDORES Y PRODUCTOS RELACIONADOS
========================================================= */

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT
        p.*,

        COALESCE(
          json_agg(
            DISTINCT pr.nombre_producto
          ) FILTER (
            WHERE pr.producto_id IS NOT NULL
          ),
          '[]'::json
        ) AS productos,

        COALESCE(
          json_agg(
            DISTINCT pr.producto_id
          ) FILTER (
            WHERE pr.producto_id IS NOT NULL
          ),
          '[]'::json
        ) AS productos_ids

      FROM gestion_comercial.dim_proveedor p

      LEFT JOIN gestion_comercial.producto_proveedor pp
        ON p.proveedor_id = pp.proveedor_id

      LEFT JOIN gestion_comercial.dim_producto pr
        ON pp.producto_id = pr.producto_id

      GROUP BY p.proveedor_id

      ORDER BY p.proveedor_id DESC
    `;

    const result = await pool.query(query);

    return res.status(200).json(result.rows);
  } catch (error) {
    return responderErrorBaseDatos(
      error,
      res,
      'GET PROVEEDORES'
    );
  }
});

/* =========================================================
   POST: REGISTRAR PROVEEDOR
========================================================= */

router.post('/', async (req, res) => {
  const {
    errores,
    datos
  } = validarProveedor(req.body);

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      error:
        'Existen campos incorrectos o incompletos.',
      campos: errores
    });
  }

  let client;

  try {
    client = await pool.connect();

    await client.query('BEGIN');

    const provQuery = `
      INSERT INTO gestion_comercial.dim_proveedor (
        razon_social,
        nit,
        correo_principal,
        telefono_principal,
        tipo_proveedor_id,
        activo
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        true
      )
      RETURNING
        proveedor_id,
        razon_social,
        nit,
        correo_principal,
        telefono_principal,
        tipo_proveedor_id,
        activo
    `;

    const provRes = await client.query(
      provQuery,
      [
        datos.razon_social,
        datos.nit,
        datos.correo_principal,
        datos.telefono_principal,
        datos.tipo_proveedor_id
      ]
    );

    const nuevoProveedor =
      provRes.rows[0];

    for (
      const productoId of datos.productos_ids
    ) {
      await client.query(
        `
          INSERT INTO gestion_comercial.producto_proveedor (
            producto_id,
            proveedor_id,
            proveedor_principal
          )
          VALUES ($1, $2, true)
        `,
        [
          productoId,
          nuevoProveedor.proveedor_id
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message:
        'Proveedor registrado correctamente.',
      proveedor: {
        ...nuevoProveedor,
        productos_ids:
          datos.productos_ids
      }
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Error al revertir la transacción:',
          rollbackError.message
        );
      }
    }

    return responderErrorBaseDatos(
      error,
      res,
      'POST PROVEEDORES'
    );
  } finally {
    if (client) {
      client.release();
    }
  }
});

/* =========================================================
   PUT: ACTUALIZAR PROVEEDOR
========================================================= */

router.put('/:id', async (req, res) => {
  const proveedorId = Number(
    req.params.id
  );

  if (
    !Number.isInteger(proveedorId) ||
    proveedorId <= 0
  ) {
    return res.status(400).json({
      error:
        'El identificador del proveedor no es válido.'
    });
  }

  const {
    errores,
    datos
  } = validarProveedor(req.body);

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      error:
        'Existen campos incorrectos o incompletos.',
      campos: errores
    });
  }

  let client;

  try {
    client = await pool.connect();

    await client.query('BEGIN');

    const updateProvQuery = `
      UPDATE gestion_comercial.dim_proveedor

      SET
        razon_social = $1,
        nit = $2,
        correo_principal = $3,
        telefono_principal = $4,
        tipo_proveedor_id = $5

      WHERE proveedor_id = $6

      RETURNING
        proveedor_id,
        razon_social,
        nit,
        correo_principal,
        telefono_principal,
        tipo_proveedor_id,
        activo
    `;

    const updateResult =
      await client.query(
        updateProvQuery,
        [
          datos.razon_social,
          datos.nit,
          datos.correo_principal,
          datos.telefono_principal,
          datos.tipo_proveedor_id,
          proveedorId
        ]
      );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        error:
          'No se encontró el proveedor que deseas actualizar.'
      });
    }

    await client.query(
      `
        DELETE FROM gestion_comercial.producto_proveedor
        WHERE proveedor_id = $1
      `,
      [proveedorId]
    );

    for (
      const productoId of datos.productos_ids
    ) {
      await client.query(
        `
          INSERT INTO gestion_comercial.producto_proveedor (
            producto_id,
            proveedor_id,
            proveedor_principal
          )
          VALUES ($1, $2, true)
        `,
        [
          productoId,
          proveedorId
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message:
        'Proveedor actualizado correctamente.',
      proveedor: {
        ...updateResult.rows[0],
        productos_ids:
          datos.productos_ids
      }
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Error al revertir la transacción:',
          rollbackError.message
        );
      }
    }

    return responderErrorBaseDatos(
      error,
      res,
      'PUT PROVEEDORES'
    );
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;