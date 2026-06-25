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

router.get('/tramites', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id_solicitud,
        sv.descripcion AS tramite,
        ss.estado,
        ss.fecha_apertura
      FROM   Solicitud_Servicio ss
      JOIN   Servicio           sv ON sv.id_servicio = ss.id_servicio
      WHERE  ss.cedula = $1
      ORDER  BY ss.fecha_apertura DESC
      LIMIT  5
    `, [req.cedula]);
    res.json({ tramites: rows });
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

// GET /api/perfil/me — devuelve el usuario con sus roles FRESCOS desde la BD.
// Sirve para refrescar el sessionStorage sin necesidad de re-login, de modo que
// los cambios que haga el admin (índice, roles, etc.) se reflejen al abrir el panel.
router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT mc.cedula, mc.correo_institucional,
             p.primer_nombre, p.primer_apellido, p.segundo_apellido,
             s.nombre AS nombre_sede
      FROM   Miembro_Comunidad mc
      JOIN   Persona p ON p.cedula  = mc.cedula
      JOIN   Sede    s ON s.id_sede = mc.id_sede
      WHERE  mc.cedula = $1
    `, [req.cedula]);

    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = rows[0];

    const { rows: periodos } = await pool.query(`
      SELECT pv.fecha_inicio,
        e.cedula  IS NOT NULL AS es_estudiante,
        pr.cedula IS NOT NULL AS es_profesor,
        pa.cedula IS NOT NULL AS es_administrativo,
        e.escuela, e.uc_aprobadas, e.promedio, e.facultad, e.semestre,
        b.tipo_beca, b.estatus AS estatus_beca, b.indice AS indice_beca,
        prep.asignatura, prep.horas AS horas_preparador,
        pr.escalafon, pr.carga_horaria, pr.codigo_investigador,
        pa.cargo, pa.horas_semanales, pa.unidad_adscripcion
      FROM Periodo_Vinculacion pv
      LEFT JOIN Estudiante              e    ON e.cedula    = pv.cedula AND e.fecha_inicio    = pv.fecha_inicio
      LEFT JOIN Becario                 b    ON b.cedula    = e.cedula  AND b.fecha_inicio    = e.fecha_inicio
      LEFT JOIN Preparador             prep  ON prep.cedula = e.cedula  AND prep.fecha_inicio = e.fecha_inicio
      LEFT JOIN Profesor               pr    ON pr.cedula   = pv.cedula AND pr.fecha_inicio   = pv.fecha_inicio
      LEFT JOIN Personal_Administrativo pa   ON pa.cedula   = pv.cedula AND pa.fecha_inicio   = pv.fecha_inicio
      WHERE pv.cedula = $1 AND pv.fecha_fin IS NULL
    `, [req.cedula]);

    const { rows: egRows } = await pool.query(`
      SELECT titulo, indice_academico, ano_graduacion
      FROM   Egresado WHERE cedula = $1
      ORDER  BY fecha_inicio DESC LIMIT 1
    `, [req.cedula]);

    const roles = [];
    for (const p of periodos) {
      if (p.es_estudiante) roles.push({
        rol: 'estudiante', escuela: p.escuela, facultad: p.facultad,
        semestre: p.semestre, promedio: parseFloat(p.promedio),
        ucAprobadas: p.uc_aprobadas,
        beca: p.tipo_beca ? {
          tipo: p.tipo_beca, estatus: p.estatus_beca, indice: parseFloat(p.indice_beca)
        } : null,
        preparador: p.asignatura ? {
          asignatura: p.asignatura, horas: p.horas_preparador
        } : null
      });
      if (p.es_profesor) roles.push({
        rol: 'profesor', escalafon: p.escalafon,
        cargaHoraria: p.carga_horaria,
        codigoInvestigador: p.codigo_investigador || null
      });
      if (p.es_administrativo) roles.push({
        rol: 'administrativo', cargo: p.cargo,
        horasSemanales: p.horas_semanales,
        unidadAdscripcion: p.unidad_adscripcion
      });
    }
    if (egRows.length) roles.push({
      rol: 'egresado',
      titulo:           egRows[0].titulo,
      indice_academico: parseFloat(egRows[0].indice_academico),
      ano_graduacion:   egRows[0].ano_graduacion
    });

    res.json({
      usuario: {
        cedula: user.cedula,
        nombre: [user.primer_nombre, user.primer_apellido, user.segundo_apellido].filter(Boolean).join(' '),
        correo: user.correo_institucional,
        sede:   user.nombre_sede,
        roles
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
