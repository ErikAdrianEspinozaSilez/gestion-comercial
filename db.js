const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.PG_USER,
    host: 'localhost',
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: 5432,
});
module.exports = pool;