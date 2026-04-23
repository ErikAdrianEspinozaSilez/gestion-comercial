const express = require('express');
const router = express.Router();

// OBTENER PRODUCTOS
router.get('/', async (req, res) => {
  try {
    const result = await req.dbClient.query('SELECT * FROM dim_producto ORDER BY producto_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AGREGAR PRODUCTO (La clave está aquí)
router.post('/', async (req, res) => {
  try {
    const { nombre_producto } = req.body;
    
    // Si por alguna razón nombre_producto no llega, lanzamos error antes de ir a la DB
    if (!nombre_producto) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const codigoGenerado = 'TEMP-' + Date.now();

    // Query ultra-segura especificando los campos
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
// ELIMINAR UN PRODUCTO
// Asegúrate de que diga '/:id'
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Usamos req.dbClient que viene del server.js
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
    // Si el error es por llave foránea (porque el producto ya tiene movimientos)
    if (err.code === '23503') {
        return res.status(400).json({ error: "No se puede eliminar: este producto ya tiene movimientos registrados." });
    }
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;