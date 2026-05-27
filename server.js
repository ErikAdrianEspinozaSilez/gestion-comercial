// server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');

const pool = require('./db');
const productosRouter = require('./routes/productos');
const movimientosRouter = require('./routes/movimientos');
const proveedoresRouter = require('./routes/proveedores');
const comunicacionesRouter = require('./routes/comunicaciones');
const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/usuarios', usuariosRouter);
app.use('/productos', productosRouter);
app.use('/movimientos', movimientosRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/comunicaciones', comunicacionesRouter);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('¡Backend Super Valle - 100% Optimizado! 🚀');
});

// Servidor escuchando
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});