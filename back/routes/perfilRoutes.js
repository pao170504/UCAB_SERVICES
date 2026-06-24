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


/* ─────────────────────────────────────────────
   GET /api/perfil/fecha-clave — Última fecha de cambio de contraseña
   ───────────────────────────────────────────── */
router.get('/fecha-clave', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT fecha_cambio_clave FROM Miembro_Comunidad WHERE cedula = $1`,
      [req.cedula]
    );
    res.json({ fecha_cambio_clave: rows[0]?.fecha_cambio_clave || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ─────────────────────────────────────────────
   PUT /api/perfil/password — Cambio de contraseña
   ───────────────────────────────────────────── */
router.put('/password', async (req, res) => {
  const { contrasena_actual, contrasena_nueva } = req.body;

  if (!contrasena_actual || !contrasena_nueva) {
    return res.status(400).json({ error: 'Debe proporcionar la contraseña actual y la nueva.' });
  }
  if (contrasena_nueva.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }
  if (contrasena_actual === contrasena_nueva) {
    return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual.' });
  }

  try {
    /* 1. Obtener contraseña cifrada actual */
    const { rows } = await pool.query(
      `SELECT contrasena FROM Miembro_Comunidad WHERE cedula = $1`,
      [req.cedula]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    /* 2. Verificar contraseña actual con pgcrypto */
    const checkResult = await pool.query(
      `SELECT fn_verificar_contrasena($1, $2) AS valido`,
      [contrasena_actual, rows[0].contrasena]
    );
    if (!checkResult.rows[0]?.valido) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    /* 3. Actualizar — el trigger trg_cifrar_contrasena cifra automáticamente */
    await pool.query(
      `UPDATE Miembro_Comunidad
       SET Contrasena = $1, Fecha_Cambio_Clave = CURRENT_DATE
       WHERE cedula = $2`,
      [contrasena_nueva, req.cedula]
    );

    res.json({ message: 'Contraseña actualizada correctamente.' });

  } catch (err) {
    console.error('Error en cambio de contraseña:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
