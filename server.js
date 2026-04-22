const dotenv = require('dotenv');
// 1. Cargar variables de entorno ANTES que nada
dotenv.config();

const express = require('express');
const { Client } = require('pg');

// Importación de rutas
const productosRouter = require('./routes/productos');
const movimientosRouter = require('./routes/movimientos');
const proveedoresRouter = require('./routes/proveedores');

const app = express();
const port = process.env.PORT || 3000;

// 2. Configuración de la conexión a PostgreSQL
// Asegúrate de que tu .env NO tenga comentarios al final de las líneas
const client = new Client({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

// 3. Conexión a la base de datos
client.connect()
  .then(() => {
    console.log('✅ Conexión a la base de datos establecida');
    // Establecer el esquema
    return client.query('SET search_path TO gestion_comercial, public');
  })
  .then(() => {
    console.log('📂 Esquema establecido a: gestion_comercial');
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  });

// 4. Middleware
app.use(express.json());

// 5. Rutas
app.use('/productos', productosRouter);
app.use('/movimientos', movimientosRouter);
app.use('/proveedores', proveedoresRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend funcionando correctamente! 🚀');
});

// 6. Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});