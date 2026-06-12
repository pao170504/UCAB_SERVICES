const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'nombre_de_tu_bd',
  password: 'tu_contraseña',
  port: 5432,
});

app.use(express.json());
app.use(express.static('../front'));

app.get('/api/saludo', (req, res) => {
  res.json({ mensaje: 'Hola desde el backend' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});