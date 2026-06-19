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

module.exports = router;
