const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const { Pool } = require('pg'); 
const cors = require('cors');

const productosRouter = require('./routes/productos');
const movimientosRouter = require('./routes/movimientos');
const proveedoresRouter = require('./routes/proveedores');

const app = express();
const port = process.env.PORT || 3000;

// 1. Configuración del Pool mejorada
const pool = new Pool({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
  max: 20,
  // ESTA LÍNEA ES LA MAGIA: Configura el esquema sin hacer una consulta extra
  options: "-c search_path=gestion_comercial,public" 
});

// BORRA EL BLOQUE pool.on('connect') completo, ya no lo necesitamos.

app.use(cors());
app.use(express.json()); 

// 2. Middleware ligero
app.use((req, res, next) => {
  req.dbClient = pool;
  next();
});

// 3. Rutas
app.use('/productos', productosRouter); 
app.use('/movimientos', movimientosRouter);
app.use('/proveedores', proveedoresRouter);

app.get('/', (req, res) => {
  res.send('¡Backend Super Valle - 100% Optimizado! 🚀');
});

app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});