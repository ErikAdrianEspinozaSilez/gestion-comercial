// server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const productosRouter = require('./routes/productos');
const movimientosRouter = require('./routes/movimientos');
const proveedoresRouter = require('./routes/proveedores');
const comunicacionesRouter = require('./routes/comunicaciones');

const app = express();
const port = process.env.PORT || 3000;

// 1. Configuración del Pool centralizado
const pool = new Pool({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
  max: 20,
  options: '-c search_path=gestion_comercial,public',
});
const authRouter = require('./routes/auth'); // Asegúrate de que apunte a donde guardaste auth.js
const usuariosRouter = require('./routes/usuarios');
app.use(cors());
app.use(express.json());

// 2. Middleware para inyectar el pool en cada request
app.use((req, res, next) => {
  req.dbClient = pool;
  next();
});

// 3. Rutas
app.use('/usuarios', usuariosRouter);
app.use('/productos', productosRouter);
app.use('/movimientos', movimientosRouter);
app.use('/api/proveedores', proveedoresRouter); // <-- CORREGIDO: prefijo /api/proveedores
app.use('/api/comunicaciones', comunicacionesRouter);
app.use('/auth', authRouter); // <--- ESTO FALTA
app.get('/', (req, res) => {

  res.send('¡Backend Super Valle - 100% Optimizado! 🚀');
});

// 4. Servidor escuchando
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});