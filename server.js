const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

// Importación de rutas
const productosRouter = require('./routes/productos');
const movimientosRouter = require('./routes/movimientos');
const proveedoresRouter = require('./routes/proveedores');

const app = express();
const port = process.env.PORT || 3000;

// 1. Configuración de la conexión
const client = new Client({
  user: process.env.PG_USER,
  host: 'localhost',
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: 5432,
});

app.use(cors());
app.use(express.json()); 

// 2. Conexión a la base de datos
client.connect()
  .then(() => {
    console.log('✅ Conexión a la base de datos establecida');
    // Esto asegura que siempre usemos tu esquema de Super Valle
    return client.query('SET search_path TO gestion_comercial, public');
  })
  .catch(err => console.error('❌ Error de conexión:', err.message));

// 3. Middleware para pasar el cliente a las rutas (VITAL)
app.use((req, res, next) => {
  req.dbClient = client;
  next();
});

// 4. Rutas
// ELIMINAMOS el app.post que tenías aquí para que no choque con productosRouter
app.use('/productos', productosRouter); 
app.use('/movimientos', movimientosRouter);
app.use('/proveedores', proveedoresRouter);

app.get('/', (req, res) => {
  res.send('¡Backend funcionando correctamente! 🚀');
});

// 5. Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${port}`);
});