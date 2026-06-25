const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const crypto  = require('crypto');

const otpStore = new Map();

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function limpiarExpirados() {
  const ahora = Date.now();
  for (const [k, v] of otpStore.entries()) {
    if (v.expira < ahora) otpStore.delete(k);
  }
}
function normalizarIP(ip) {
  if (!ip) return '0.0.0.0';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}
function validarCedula(c) {
  return /^[VEve]-?\d{6,8}$/.test((c || '').trim());
}
function validarCorreo(e) {
  return /^[^\s@]+@[^\s@]*ucab[^\s@]*\.[^\s@]+$/.test((e || '').trim());
}
/* Strips the V-/E- prefix so it matches the numeric PK stored in the DB */
function numeroCedula(c) {
  return (c || '').trim().replace(/^[VEve]-?/, '');
}

/* ── STEP 1 — validate credentials, return OTP ──────────────────────────── */
router.post('/pre-login', async (req, res) => {
  const { cedula, email, password, sede } = req.body;

  if (!cedula || !email || !password || !sede)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (!validarCedula(cedula))
    return res.status(400).json({ error: 'Formato de cédula inválido. Ejemplo: V-30411315' });
  if (!validarCorreo(email))
    return res.status(400).json({ error: 'El correo debe ser institucional @ucab.edu.ve' });

  try {
    const { rows } = await pool.query(`
      SELECT mc.cedula, mc.correo_institucional, mc.contrasena,
             mc.estado_de_cuenta, s.nombre AS nombre_sede,
             p.primer_nombre, p.primer_apellido
      FROM   Miembro_Comunidad mc
      JOIN   Persona p ON p.cedula  = mc.cedula
      JOIN   Sede    s ON s.id_sede = mc.id_sede
      WHERE  mc.cedula = $1 AND mc.correo_institucional = $2
    `, [numeroCedula(cedula), email.trim()]);

    if (!rows.length)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = rows[0];
    if (user.estado_de_cuenta === 'Bloqueada')
      return res.status(403).json({ error: 'Cuenta bloqueada. Contacte a soporte.' });
    if (user.nombre_sede.trim() !== sede.trim())
      return res.status(401).json({ error: 'La sede no corresponde con su registro' });
    if (user.contrasena !== password)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    limpiarExpirados();
    const codigo = generarCodigo();
    otpStore.set(cedula.trim(), { codigo, expira: Date.now() + 5 * 60 * 1000 });

    res.json({
      mensaje:  `Código MFA generado para ${user.primer_nombre}`,
      codigo,
      cedula:   cedula.trim(),
      expiraEn: 300
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* ── STEP 2 — validate OTP, create session ───────────────────────────────── */
router.post('/login', async (req, res) => {
  const { cedula, codigoMFA, lat, lon, deviceName } = req.body;

  if (!cedula || !codigoMFA)
    return res.status(400).json({ error: 'Cédula y código MFA son requeridos' });

  try {
    const otpData = otpStore.get(cedula.trim());
    if (!otpData)
      return res.status(401).json({
        error: 'No hay un código activo. Inicia sesión nuevamente.'
      });
    if (Date.now() > otpData.expira) {
      otpStore.delete(cedula.trim());
      return res.status(401).json({
        error: 'El código MFA ha expirado. Inicia sesión nuevamente.'
      });
    }
    if (otpData.codigo !== codigoMFA.trim()) {
      await pool.query(`
        UPDATE Sesion SET intentos_fallidos = intentos_fallidos + 1
        WHERE cedula = $1
          AND fecha_hora_acceso = (
            SELECT MAX(fecha_hora_acceso) FROM Sesion WHERE cedula = $1
          )
      `, [numeroCedula(cedula)]);
      return res.status(401).json({ error: 'Código MFA incorrecto' });
    }
    otpStore.delete(cedula.trim());

    const { rows } = await pool.query(`
      SELECT mc.cedula, mc.correo_institucional, mc.estado_de_cuenta,
             p.primer_nombre, p.primer_apellido, p.segundo_apellido,
             s.nombre AS nombre_sede
      FROM   Miembro_Comunidad mc
      JOIN   Persona p ON p.cedula  = mc.cedula
      JOIN   Sede    s ON s.id_sede = mc.id_sede
      WHERE  mc.cedula = $1
    `, [numeroCedula(cedula)]);

    if (!rows.length)
      return res.status(401).json({ error: 'Usuario no encontrado' });

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
    `, [numeroCedula(cedula)]);

    const { rows: egRows } = await pool.query(`
      SELECT titulo, indice_academico, ano_graduacion
      FROM   Egresado WHERE cedula = $1
      ORDER  BY fecha_inicio DESC LIMIT 1
    `, [numeroCedula(cedula)]);

    const roles = [];
    for (const p of periodos) {
      if (p.es_estudiante) roles.push({
        rol: 'estudiante', escuela: p.escuela, facultad: p.facultad,
        semestre: p.semestre, promedio: parseFloat(p.promedio),
        ucAprobadas: p.uc_aprobadas,
        beca: p.tipo_beca ? {
          tipo: p.tipo_beca, estatus: p.estatus_beca,
          indice: parseFloat(p.indice_beca)
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

    const sessionID = crypto.randomUUID();
    await pool.query(`
      INSERT INTO Sesion
        (cedula, uuid, fecha_hora_acceso, direccion_ip,
         intentos_fallidos, latitud, longitud)
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 0, $4, $5)
    `, [numeroCedula(cedula), sessionID,
        normalizarIP(req.ip), lat || null, lon || null]);

    return res.json({
      sessionID,
      usuario: {
        cedula:     user.cedula,
        nombre:     [user.primer_nombre, user.primer_apellido,
                     user.segundo_apellido].filter(Boolean).join(' '),
        correo:     user.correo_institucional,
        sede:       user.nombre_sede,
        deviceName: deviceName || 'Dispositivo desconocido',
        roles
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
