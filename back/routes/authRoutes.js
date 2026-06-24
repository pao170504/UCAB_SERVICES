const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const crypto = require('crypto');

router.post('/login', async (req, res) => {
  const { cedula, email, password, codigoMFA, lat, lon, sede, deviceName } = req.body;

  try {
    /* 1. Find user */
    const userResult = await pool.query(
      `SELECT mc.cedula, mc.correo_institucional, mc.contrasena, mc.estado_de_cuenta,
              s.nombre AS nombre_sede,
              p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido
       FROM Miembro_Comunidad mc
       JOIN Persona p ON p.cedula = mc.cedula
       JOIN Sede s ON s.id_sede = mc.id_sede
       WHERE mc.cedula = $1 AND mc.correo_institucional = $2`,
      [cedula, email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = userResult.rows[0];

    /* 2. Check account status */
    if (user.estado_de_cuenta === 'Bloqueada') {
      return res.status(403).json({ error: 'Cuenta bloqueada. Contacte a soporte.' });
    }

    /* 3. Check sede */
    if (user.nombre_sede.trim().toLowerCase() !== (sede || '').trim().toLowerCase()) {
      return res.status(401).json({ error: 'La sede seleccionada no corresponde con su registro' });
    }

    /* 4. Validate password and MFA */
    const pwCheck = await pool.query(
      `SELECT fn_verificar_contrasena($1, $2) AS valido`,
      [password, user.contrasena]
    );
    const passwordValida = pwCheck.rows[0]?.valido === true;

    if (!passwordValida || codigoMFA !== '123456') {
      const { rowCount: updCount } = await pool.query(
        `UPDATE Sesion SET intentos_fallidos = intentos_fallidos + 1
         WHERE cedula = $1 AND fecha_hora_acceso = (
           SELECT MAX(fecha_hora_acceso) FROM Sesion WHERE cedula = $1
         )`,
        [cedula]
      );
      if (updCount === 0) {
        const rawIp = req.ip || '0.0.0.0';
        const ipFail = rawIp === '::1' ? '127.0.0.1' : rawIp.replace('::ffff:', '');
        await pool.query(
          `INSERT INTO Sesion (cedula, uuid, fecha_hora_acceso, direccion_ip, intentos_fallidos, latitud, longitud)
           VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 1, NULL, NULL)`,
          [cedula, crypto.randomUUID(), ipFail]
        );
      }
      return res.status(401).json({ error: 'Credenciales o código de verificación incorrectos' });
    }

    /* 5. Query active roles (single SQL) */
    const rolesResult = await pool.query(
      `SELECT
         pv.fecha_inicio,
         e.escuela, e.uc_aprobadas, e.promedio, e.facultad, e.semestre,
         b.tipo_beca, b.estatus AS beca_estatus, b.indice AS beca_indice,
         pr.asignatura AS prep_asignatura, pr.horas AS prep_horas,
         p.escalafon, p.carga_horaria, p.codigo_investigador,
         pa.cargo, pa.horas_semanales, pa.unidad_adscripcion
       FROM Periodo_Vinculacion pv
       LEFT JOIN Estudiante e   ON e.cedula   = pv.cedula AND e.fecha_inicio   = pv.fecha_inicio
       LEFT JOIN Becario b      ON b.cedula   = pv.cedula AND b.fecha_inicio   = pv.fecha_inicio
       LEFT JOIN Preparador pr  ON pr.cedula  = pv.cedula AND pr.fecha_inicio  = pv.fecha_inicio
       LEFT JOIN Profesor p     ON p.cedula   = pv.cedula AND p.fecha_inicio   = pv.fecha_inicio
       LEFT JOIN Personal_Administrativo pa
                                ON pa.cedula  = pv.cedula AND pa.fecha_inicio  = pv.fecha_inicio
       WHERE pv.cedula = $1 AND pv.fecha_fin IS NULL
       ORDER BY pv.fecha_inicio DESC`,
      [cedula]
    );

    /* 6. Query Egresado separately */
    const egresadoResult = await pool.query(
      `SELECT titulo, indice_academico, ano_graduacion
       FROM Egresado
       WHERE cedula = $1
       ORDER BY fecha_inicio DESC
       LIMIT 1`,
      [cedula]
    );

    /* 7. Build roles array */
    const roles = [];

    rolesResult.rows.forEach(row => {
      if (row.escuela) {
        roles.push({
          rol: 'estudiante',
          escuela: row.escuela,
          facultad: row.facultad,
          semestre: row.semestre,
          uc_aprobadas: row.uc_aprobadas,
          promedio: row.promedio,
          beca: row.tipo_beca ? {
            tipo: row.tipo_beca,
            estatus: row.beca_estatus,
            indice: row.beca_indice
          } : null,
          preparador: row.prep_asignatura ? {
            asignatura: row.prep_asignatura,
            horas: row.prep_horas
          } : null
        });
      }
      if (row.escalafon) {
        roles.push({
          rol: 'profesor',
          escalafon: row.escalafon,
          carga_horaria: row.carga_horaria,
          codigoInvestigador: row.codigo_investigador || null
        });
      }
      if (row.cargo) {
        roles.push({
          rol: 'administrativo',
          cargo: row.cargo,
          horas_semanales: row.horas_semanales,
          unidad_adscripcion: row.unidad_adscripcion
        });
      }
    });

    if (egresadoResult.rows.length > 0) {
      const eg = egresadoResult.rows[0];
      roles.push({
        rol: 'egresado',
        titulo: eg.titulo,
        indice_academico: eg.indice_academico,
        ano_graduacion: eg.ano_graduacion
      });
    }

    /* 8. Insert session */
    function normalizarIP(ip) {
      if (!ip) return '0.0.0.0';
      if (ip === '::1') return '127.0.0.1';
      if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
      return ip;
    }
    const ipCliente = normalizarIP(req.ip);

    const sessionID = crypto.randomUUID();
    await pool.query(
      `INSERT INTO Sesion
         (cedula, uuid, fecha_hora_acceso, direccion_ip, intentos_fallidos, latitud, longitud)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 0, $4, $5)`,
      [cedula, sessionID, ipCliente, lat || null, lon || null]
    );

    /* 9. Respond */
    const nombre = `${user.primer_nombre} ${user.primer_apellido} ${user.segundo_apellido || ''}`.trim();
    return res.json({
      sessionID,
      usuario: {
        cedula:     user.cedula,
        nombre,
        correo:     user.correo_institucional,
        sede:       user.nombre_sede,
        deviceName: deviceName || 'Dispositivo desconocido',
        roles
      }
    });

  } catch (err) {
    console.error('Error crítico en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/* ─────────────────────────────────────────────
   POST /api/auth/register — Registro de nuevo miembro
   ───────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  const {
    cedula, sexo, fecha_nacimiento,
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    correo_institucional, id_sede, contrasena,
    ciudad, estado, calle, telefono
  } = req.body;

  const required = { cedula, sexo, fecha_nacimiento, primer_nombre, primer_apellido, segundo_apellido, correo_institucional, id_sede, contrasena };
  const missing = Object.entries(required).filter(([, v]) => v === undefined || v === null || String(v).trim() === '').map(([k]) => k);
  if (missing.length) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO Persona (Cedula, Sexo, Fecha_Nacimiento, Primer_Nombre, Segundo_Nombre, Primer_Apellido, Segundo_Apellido)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        cedula.trim(), sexo,
        fecha_nacimiento,
        primer_nombre.trim(),
        segundo_nombre?.trim() || null,
        primer_apellido.trim(),
        segundo_apellido.trim()
      ]
    );

    /* El trigger trg_cifrar_contrasena cifra automáticamente la contraseña */
    await client.query(
      `INSERT INTO Miembro_Comunidad
         (Cedula, Correo_Institucional, ID_Sede, Contrasena, Estado_de_Cuenta, Fecha_Cambio_Clave, Ciudad, Estado, Calle)
       VALUES ($1, $2, $3, $4, 'Activa', CURRENT_DATE, $5, $6, $7)`,
      [
        cedula.trim(),
        correo_institucional.trim(),
        id_sede,
        contrasena,
        ciudad?.trim() || null,
        estado?.trim() || null,
        calle?.trim() || null
      ]
    );

    if (telefono?.trim()) {
      await client.query(
        `INSERT INTO Telefono (Cedula, NumeroTelefono) VALUES ($1, $2)`,
        [cedula.trim(), telefono.trim()]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'La cédula o el correo institucional ya están registrados.' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: 'El correo debe pertenecer al dominio @ucab.edu.ve' });
    }
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

module.exports = router;
