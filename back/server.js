require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

/* API routes */
const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');
const vacanteRoutes = require('./routes/vacanteRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const estacionamientoRoutes = require('./routes/estacionamientoRoutes');
const serviciosRoutes       = require('./routes/serviciosRoutes');
const pagosRoutes           = require('./routes/pagosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/vacantes', auth, vacanteRoutes);
app.use('/api/postulaciones', auth, vacanteRoutes);
app.use('/api/perfil', auth, perfilRoutes);
app.use('/api/estacionamiento', auth, estacionamientoRoutes);
app.use('/api/servicios', auth, serviciosRoutes);
app.use('/api/pagos', auth, pagosRoutes);

app.get('/api/status', (req, res) => {
  res.json({ message: 'Servidor UCAB Services funcionando correctamente' });
});

/* Serve frontend static files */
app.use(express.static(path.join(__dirname, '../front')));

/* Redirect root to login */
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}/pages/login.html`);
});