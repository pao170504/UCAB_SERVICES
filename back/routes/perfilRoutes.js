const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const { rows: telefonos } = await pool.query(
      `SELECT numerotelefono AS numero
       FROM   Telefono
       WHERE  cedula = $1`,
      [req.cedula]
    );

    const { rows: datos } = await pool.query(
      `SELECT ciudad, estado, calle
       FROM   Miembro_Comunidad
       WHERE  cedula = $1`,
      [req.cedula]
    );

    res.json({
      telefonos: telefonos.map(function (t) { return t.numero; }),
      direccion: datos[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

function tiempoRelativo(fecha) {
  const diff  = Date.now() - new Date(fecha).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  < 1)  return 'Ahora mismo';
  if (mins  < 60) return `Hace ${mins} minuto${mins > 1 ? 's' : ''}`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

router.get('/sesiones', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        uuid,
        fecha_hora_acceso,
        direccion_ip,
        intentos_fallidos,
        latitud,
        longitud
      FROM   Sesion
      WHERE  cedula = $1
      ORDER  BY fecha_hora_acceso DESC
      LIMIT  5
    `, [req.cedula]);

    const sesiones = rows.map(s => ({
      uuid:             s.uuid,
      fecha:            s.fecha_hora_acceso,
      ip:               s.direccion_ip || 'No registrada',
      intentosFallidos: s.intentos_fallidos,
      ubicacion: s.latitud && s.longitud
        ? `${parseFloat(s.latitud).toFixed(4)}, ${parseFloat(s.longitud).toFixed(4)}`
        : 'No disponible',
      tiempoAtras: tiempoRelativo(s.fecha_hora_acceso)
    }));

    res.json({ sesiones });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/recurrencia', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_indice_recurrencia($1)`, [req.cedula]
    );
    res.json({ recurrencia: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
