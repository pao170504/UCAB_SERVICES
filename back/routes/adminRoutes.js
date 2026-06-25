const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// Cédulas con poderes de administrador del sistema — fuente única en config/admins.js
const { ADMIN_CEDULAS } = require('../config/admins');

async function verificarAdmin(cedula) {
  if (!ADMIN_CEDULAS.includes(String(cedula))) return false;   // candado: solo la allowlist
  const { rows } = await pool.query(`
    SELECT pa.cedula FROM Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv
           ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
  `, [cedula]);
  return rows.length > 0;
}

// ── GET /api/admin/usuarios ──────────────────────────────────────
router.get('/usuarios', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const { rows } = await pool.query(`
      SELECT
        mc.cedula,
        p.primer_nombre || ' ' || p.primer_apellido AS nombre,
        mc.correo_institucional,
        mc.estado_de_cuenta,
        mc.fecha_cambio_clave,
        ARRAY_REMOVE(ARRAY[
          CASE WHEN e.cedula  IS NOT NULL THEN 'Estudiante'      END,
          CASE WHEN pr.cedula IS NOT NULL THEN 'Profesor'        END,
          CASE WHEN pa.cedula IS NOT NULL THEN 'Administrativo'  END,
          CASE WHEN eg.cedula IS NOT NULL THEN 'Egresado'        END
        ], NULL) AS roles_activos,
        (SELECT fecha_hora_acceso FROM Sesion s
         WHERE s.cedula = mc.cedula
         ORDER BY fecha_hora_acceso DESC LIMIT 1) AS ultima_sesion
      FROM   Miembro_Comunidad mc
      JOIN   Persona p ON p.cedula = mc.cedula
      LEFT JOIN Periodo_Vinculacion pv_a ON pv_a.cedula = mc.cedula
                                        AND pv_a.fecha_fin IS NULL
      LEFT JOIN Estudiante             e  ON e.cedula  = pv_a.cedula AND e.fecha_inicio  = pv_a.fecha_inicio
      LEFT JOIN Profesor               pr ON pr.cedula = pv_a.cedula AND pr.fecha_inicio = pv_a.fecha_inicio
      LEFT JOIN Personal_Administrativo pa ON pa.cedula = pv_a.cedula AND pa.fecha_inicio = pv_a.fecha_inicio
      LEFT JOIN Egresado               eg ON eg.cedula = mc.cedula
      GROUP BY mc.cedula, p.primer_nombre, p.primer_apellido,
               mc.correo_institucional, mc.estado_de_cuenta,
               mc.fecha_cambio_clave,
               e.cedula, pr.cedula, pa.cedula, eg.cedula
      ORDER BY p.primer_apellido, p.primer_nombre
    `);
    res.json({ usuarios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── PATCH /api/admin/usuarios/:cedula/estado ─────────────────────
router.patch('/usuarios/:cedula/estado', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { cedula } = req.params;
  const { estado  } = req.body;

  const estadosValidos = ['Activa', 'Suspendida', 'Bloqueada'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: 'Estado no válido' });

  if (cedula === req.cedula)
    return res.status(400).json({ error: 'No puedes cambiar tu propio estado' });

  try {
    await pool.query(
      `UPDATE Miembro_Comunidad SET estado_de_cuenta = $1 WHERE cedula = $2`,
      [estado, cedula]
    );
    res.json({ message: `Cuenta actualizada a ${estado}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── PATCH /api/admin/usuarios/:cedula/contrasena ─────────────────
router.patch('/usuarios/:cedula/contrasena', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { cedula }         = req.params;
  const { nuevaContrasena } = req.body;

  if (!nuevaContrasena || nuevaContrasena.length < 6)
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 6 caracteres'
    });

  try {
    await pool.query(`
      UPDATE Miembro_Comunidad
      SET    contrasena        = $1,
             fecha_cambio_clave = CURRENT_DATE
      WHERE  cedula = $2
    `, [nuevaContrasena, cedula]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── GET /api/admin/usuarios/:cedula/vinculaciones ────────────────
router.get('/usuarios/:cedula/vinculaciones', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { cedula } = req.params;

  try {
    const { rows } = await pool.query(`
      SELECT
        pv.fecha_inicio, pv.fecha_fin,
        CASE
          WHEN e.cedula  IS NOT NULL THEN 'Estudiante'
          WHEN pr.cedula IS NOT NULL THEN 'Profesor'
          WHEN pa.cedula IS NOT NULL THEN 'Administrativo'
          WHEN eg.cedula IS NOT NULL THEN 'Egresado'
          ELSE 'Sin rol'
        END AS rol,
        e.escuela, e.promedio, e.semestre, e.facultad,
        b.tipo_beca, b.estatus AS estatus_beca,
        prep.asignatura,
        pr.escalafon, pr.carga_horaria, pr.codigo_investigador,
        pa.cargo, pa.unidad_adscripcion,
        eg.titulo, eg.indice_academico, eg.ano_graduacion,
        CASE WHEN pv.fecha_fin IS NULL THEN 'Activo' ELSE 'Cerrado' END AS estado
      FROM   Periodo_Vinculacion pv
      LEFT JOIN Estudiante             e    ON e.cedula    = pv.cedula AND e.fecha_inicio    = pv.fecha_inicio
      LEFT JOIN Becario                b    ON b.cedula    = e.cedula  AND b.fecha_inicio    = e.fecha_inicio
      LEFT JOIN Preparador             prep ON prep.cedula = e.cedula  AND prep.fecha_inicio = e.fecha_inicio
      LEFT JOIN Profesor               pr   ON pr.cedula   = pv.cedula AND pr.fecha_inicio   = pv.fecha_inicio
      LEFT JOIN Personal_Administrativo pa  ON pa.cedula   = pv.cedula AND pa.fecha_inicio   = pv.fecha_inicio
      LEFT JOIN Egresado               eg   ON eg.cedula   = pv.cedula AND eg.fecha_inicio   = pv.fecha_inicio
      WHERE  pv.cedula = $1
      ORDER  BY pv.fecha_inicio DESC
    `, [cedula]);

    res.json({ vinculaciones: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── PATCH /api/admin/usuarios/:cedula/vinculaciones/cerrar ───────
router.patch('/usuarios/:cedula/vinculaciones/cerrar', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { cedula } = req.params;

  try {
    const { rowCount } = await pool.query(`
      UPDATE Periodo_Vinculacion
      SET    fecha_fin = CURRENT_DATE
      WHERE  cedula    = $1 AND fecha_fin IS NULL
    `, [cedula]);

    if (!rowCount)
      return res.status(404).json({ error: 'No hay período activo para este usuario' });

    res.json({ message: 'Período activo cerrado. El trigger verificará el estado de la cuenta.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── GET /api/admin/tarifas ───────────────────────────────────────
router.get('/tarifas', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const { rows } = await pool.query(`
      SELECT
        r.id_sede, se.nombre AS sede,
        r.id_categoria, cs.nombre AS categoria, cs.categoria AS tipo,
        r.costo_min, r.costo_max, r.ubicación,
        r.costo_min                              AS tarifa_miembro,
        ROUND((r.costo_min * 1.20)::NUMERIC, 2) AS tarifa_egresado,
        ROUND((r.costo_min * 1.60)::NUMERIC, 2) AS tarifa_externo
      FROM   Regula r
      JOIN   Sede               se ON se.id_sede      = r.id_sede
      JOIN   Categoria_Servicio cs ON cs.id_categoria = r.id_categoria
      ORDER  BY se.nombre, cs.nombre
    `);
    res.json({ tarifas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── PUT /api/admin/tarifas/:idSede/:idCategoria ──────────────────
router.put('/tarifas/:idSede/:idCategoria', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Solo el personal administrativo puede modificar tarifas' });

  const { idSede, idCategoria } = req.params;
  const { costoMin, costoMax  } = req.body;

  const min = parseFloat(costoMin);
  const max = parseFloat(costoMax);

  if (isNaN(min) || isNaN(max))
    return res.status(400).json({ error: 'Los costos deben ser números válidos' });
  if (min < 0 || max < 0)
    return res.status(400).json({ error: 'Los costos no pueden ser negativos' });
  if (min > max)
    return res.status(400).json({ error: 'El mínimo no puede superar el máximo' });

  try {
    const { rowCount } = await pool.query(`
      UPDATE Regula
      SET    costo_min = $1, costo_max = $2
      WHERE  id_sede = $3 AND id_categoria = $4
    `, [min, max, parseInt(idSede), idCategoria]);

    if (!rowCount)
      return res.status(404).json({ error: 'Categoría/sede no encontrada' });

    res.json({
      message:         'Tarifas actualizadas',
      tarifa_miembro:  parseFloat(min.toFixed(2)),
      tarifa_egresado: parseFloat((min * 1.20).toFixed(2)),
      tarifa_externo:  parseFloat((min * 1.60).toFixed(2))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── GET /api/admin/solicitudes/pendientes ────────────────────────
router.get('/solicitudes/pendientes', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id_solicitud,
        ss.estado,
        ss.fecha_apertura,
        sv.descripcion              AS servicio,
        sv.id_servicio,
        cs.nombre                   AS categoria,
        p.primer_nombre || ' ' || p.primer_apellido AS solicitante,
        mc.correo_institucional,
        mc.cedula                   AS cedula_solicitante,
        (SELECT COUNT(*) FROM Paso_Actividad pa2
         WHERE  pa2.id_solicitud = ss.id_solicitud)
                                    AS total_pasos,
        (SELECT COUNT(*) FROM Paso_Actividad pa2
         WHERE  pa2.id_solicitud = ss.id_solicitud
           AND  pa2.estado_paso  = 'Completado')
                                    AS pasos_completados,
        (SELECT pa2.id_paso FROM Paso_Actividad pa2
         WHERE  pa2.id_solicitud = ss.id_solicitud
           AND  pa2.estado_paso IN ('Pendiente','En proceso')
         ORDER  BY pa2.fecha_inicio ASC LIMIT 1)
                                    AS paso_pendiente_id,
        (SELECT pa2.responsable FROM Paso_Actividad pa2
         WHERE  pa2.id_solicitud = ss.id_solicitud
           AND  pa2.estado_paso IN ('Pendiente','En proceso')
         ORDER  BY pa2.fecha_inicio ASC LIMIT 1)
                                    AS paso_pendiente_responsable
      FROM   Solicitud_Servicio  ss
      JOIN   Servicio            sv ON sv.id_servicio  = ss.id_servicio
      JOIN   Categoria_Servicio  cs ON cs.id_categoria = sv.id_categoria
      JOIN   Miembro_Comunidad   mc ON mc.cedula       = ss.cedula
      JOIN   Persona             p  ON p.cedula        = mc.cedula
      WHERE  ss.estado NOT IN ('Cancelada','Completada')
        AND  sv.nombre_entidad NOT IN
               ('UCAB - Infraestructura','UCAB - Estacionamiento')
      ORDER  BY ss.fecha_apertura ASC
    `);
    res.json({ solicitudes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── GET /api/admin/solicitudes/:idSolicitud/requisitos ───────────
// Reúne los requisitos del trámite para que el admin verifique ANTES de aprobar:
// datos académicos del solicitante, requisitos de acceso (texto), acreditaciones
// exigidas (y si las cumple) y solvencia (saldo de facturas del trámite).
router.get('/solicitudes/:idSolicitud/requisitos', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { idSolicitud } = req.params;
  try {
    const { rows: solR } = await pool.query(`
      SELECT ss.id_solicitud, ss.cedula, sv.id_servicio,
             sv.descripcion AS servicio,
             p.primer_nombre || ' ' || p.primer_apellido AS solicitante
      FROM   Solicitud_Servicio ss
      JOIN   Servicio sv ON sv.id_servicio = ss.id_servicio
      JOIN   Persona  p  ON p.cedula = ss.cedula
      WHERE  ss.id_solicitud = $1
    `, [idSolicitud]);
    if (!solR.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const sol = solR[0];

    const [acad, egr, reqAcc, acred, fin] = await Promise.all([
      pool.query(`
        SELECT e.uc_aprobadas, e.promedio, e.semestre, e.escuela, e.facultad
        FROM   Estudiante e
        JOIN   Periodo_Vinculacion pv ON pv.cedula = e.cedula AND pv.fecha_inicio = e.fecha_inicio
        WHERE  e.cedula = $1 AND pv.fecha_fin IS NULL
        ORDER  BY pv.fecha_inicio DESC LIMIT 1`, [sol.cedula]),
      pool.query(`
        SELECT g.titulo, g.indice_academico, g.ano_graduacion
        FROM   Egresado g
        JOIN   Periodo_Vinculacion pv ON pv.cedula = g.cedula AND pv.fecha_inicio = g.fecha_inicio
        WHERE  g.cedula = $1 AND pv.fecha_fin IS NULL
        ORDER  BY pv.fecha_inicio DESC LIMIT 1`, [sol.cedula]),
      pool.query(`SELECT requisito FROM Requisitos_Acceso WHERE id_servicio = $1`, [sol.id_servicio]),
      pool.query(`
        SELECT a.id_acreditacion, a.descripcion,
               (c.cedula IS NOT NULL) AS cumple,
               c.estado, c.fecha_vencimiento
        FROM   Requiere r
        JOIN   Acreditacion a ON a.id_acreditacion = r.id_acreditacion
        LEFT   JOIN Cumple c ON c.id_acreditacion = r.id_acreditacion AND c.cedula = $2
        WHERE  r.id_servicio = $1
        ORDER  BY a.id_acreditacion`, [sol.id_servicio, sol.cedula]),
      pool.query(`
        SELECT COALESCE(SUM(f.saldo),0)::float            AS saldo_total,
               COUNT(*) FILTER (WHERE f.estado <> 'Pagada')::int AS facturas_pendientes,
               COUNT(*)::int                              AS facturas_total
        FROM   Folio_Consumo fc
        JOIN   Factura f ON f.id_folio = fc.id_folio
        WHERE  fc.id_solicitud = $1`, [idSolicitud])
    ]);

    res.json({
      solicitud:         { id: sol.id_solicitud, servicio: sol.servicio, solicitante: sol.solicitante, cedula: sol.cedula },
      academico:         acad.rows[0] || null,
      egresado:          egr.rows[0]  || null,
      requisitos_acceso: reqAcc.rows.map(r => r.requisito),
      acreditaciones:    acred.rows,
      solvencia:         fin.rows[0] || { saldo_total: 0, facturas_pendientes: 0, facturas_total: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── PATCH /api/admin/solicitudes/:idSolicitud/paso/:idPaso ───────
router.patch('/solicitudes/:idSolicitud/paso/:idPaso', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Solo el personal administrativo puede aprobar pasos' });

  const { idSolicitud, idPaso } = req.params;

  try {
    const { rows: pasoRows } = await pool.query(`
      SELECT id_paso, estado_paso
      FROM   Paso_Actividad
      WHERE  id_paso = $1 AND id_solicitud = $2
    `, [idPaso, idSolicitud]);

    if (!pasoRows.length)
      return res.status(404).json({ error: 'Paso no encontrado' });

    if (pasoRows[0].estado_paso === 'Completado')
      return res.status(400).json({ error: 'Este paso ya fue completado' });

    await pool.query(
      `UPDATE Paso_Actividad SET estado_paso = 'Completado' WHERE id_paso = $1`,
      [idPaso]
    );

    const { rows: solRows } = await pool.query(
      `SELECT estado FROM Solicitud_Servicio WHERE id_solicitud = $1`,
      [idSolicitud]
    );

    res.json({
      message:          'Paso aprobado exitosamente',
      solicitud_estado: solRows[0]?.estado,
      completada:       solRows[0]?.estado === 'Completada'
    });
  } catch (err) {
    if (err.message?.includes('paso anterior'))
      return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});


// -- POST /api/admin/usuarios/:cedula/vinculaciones  (agregar rol) --
// Adjunta un nuevo rol al periodo de vinculacion ACTIVO del miembro; si no
// tiene periodo abierto, crea uno con la fecha indicada (o la de hoy).
router.post('/usuarios/:cedula/vinculaciones', async (req, res) => {
  if (!await verificarAdmin(req.cedula))
    return res.status(403).json({ error: 'Acceso denegado' });

  const { cedula } = req.params;
  const { rol }    = req.body;

  const ROLES = ['estudiante', 'profesor', 'administrativo', 'egresado'];
  if (!ROLES.includes((rol || '').toLowerCase()))
    return res.status(400).json({ error: 'Rol no valido' });
  const tipo = rol.toLowerCase();

  // Validacion de campos requeridos por tipo de rol
  const b = req.body;
  const faltan = [];
  if (tipo === 'profesor') {
    if (!b.escalafon)             faltan.push('escalafon');
    if (b.carga_horaria == null)  faltan.push('carga_horaria');
  } else if (tipo === 'administrativo') {
    if (!b.cargo)                 faltan.push('cargo');
    if (b.horas_semanales == null) faltan.push('horas_semanales');
    if (!b.unidad_adscripcion)    faltan.push('unidad_adscripcion');
  } else if (tipo === 'egresado') {
    if (!b.titulo)                faltan.push('titulo');
    if (b.indice_academico == null) faltan.push('indice_academico');
    if (b.ano_graduacion == null) faltan.push('ano_graduacion');
  } else if (tipo === 'estudiante') {
    if (!b.escuela)               faltan.push('escuela');
    if (b.uc_aprobadas == null)   faltan.push('uc_aprobadas');
    if (b.promedio == null)       faltan.push('promedio');
    if (!b.facultad)              faltan.push('facultad');
    if (b.semestre == null)       faltan.push('semestre');
  }
  if (faltan.length)
    return res.status(400).json({ error: 'Faltan campos requeridos', faltan });

  const client = await pool.connect();
  try {
    // Confirmar que el miembro existe
    const { rows: mcRows } = await client.query(
      `SELECT 1 FROM Miembro_Comunidad WHERE cedula = $1`, [cedula]
    );
    if (!mcRows.length) { client.release(); return res.status(404).json({ error: 'Miembro no encontrado' }); }

    await client.query('BEGIN');

    // Reusar periodo abierto; si no hay, crear uno
    const { rows: perRows } = await client.query(
      `SELECT fecha_inicio FROM Periodo_Vinculacion
       WHERE cedula = $1 AND fecha_fin IS NULL
       ORDER BY fecha_inicio DESC LIMIT 1`, [cedula]
    );
    let fechaInicio;
    if (perRows.length) {
      fechaInicio = perRows[0].fecha_inicio;
    } else {
      const { rows: nuevo } = await client.query(
        `INSERT INTO Periodo_Vinculacion (cedula, fecha_inicio, fecha_fin)
         VALUES ($1, COALESCE($2::date, CURRENT_DATE), NULL)
         RETURNING fecha_inicio`,
        [cedula, b.fecha_inicio || null]
      );
      fechaInicio = nuevo[0].fecha_inicio;
    }

    // Insertar la fila del subtipo
    if (tipo === 'profesor') {
      await client.query(
        `INSERT INTO Profesor (cedula, fecha_inicio, escalafon, carga_horaria, codigo_investigador)
         VALUES ($1, $2, $3, $4, $5)`,
        [cedula, fechaInicio, b.escalafon, parseInt(b.carga_horaria), b.codigo_investigador || null]
      );
    } else if (tipo === 'administrativo') {
      await client.query(
        `INSERT INTO Personal_Administrativo (cedula, fecha_inicio, cargo, horas_semanales, unidad_adscripcion)
         VALUES ($1, $2, $3, $4, $5)`,
        [cedula, fechaInicio, b.cargo, parseInt(b.horas_semanales), b.unidad_adscripcion]
      );
    } else if (tipo === 'egresado') {
      await client.query(
        `INSERT INTO Egresado (cedula, fecha_inicio, titulo, indice_academico, ano_graduacion)
         VALUES ($1, $2, $3, $4, $5)`,
        [cedula, fechaInicio, b.titulo, parseFloat(b.indice_academico), parseInt(b.ano_graduacion)]
      );
    } else if (tipo === 'estudiante') {
      await client.query(
        `INSERT INTO Estudiante (cedula, fecha_inicio, escuela, uc_aprobadas, promedio, facultad, semestre)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cedula, fechaInicio, b.escuela, parseInt(b.uc_aprobadas), parseFloat(b.promedio),
         b.facultad, parseInt(b.semestre)]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Rol agregado correctamente', rol: tipo, fecha_inicio: fechaInicio });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505')
      return res.status(409).json({ error: 'El miembro ya tiene ese rol en el periodo activo' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

// ══════════════ ENTIDADES EXTERNAS ══════════════════════════════════

// GET /api/admin/entidades-externas
router.get('/entidades-externas', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { rows } = await pool.query(`
      SELECT rif, razon_social, fecha_fin_contrato, contacto_nombre, contacto_correo
      FROM   Entidad_Externa
      ORDER  BY razon_social
    `);
    res.json({ entidades: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/admin/entidades-externas
router.post('/entidades-externas', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { rif, razon_social, fecha_fin_contrato, contacto_nombre, contacto_correo } = req.body;
  if (!rif || !razon_social || !fecha_fin_contrato || !contacto_nombre || !contacto_correo)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO Entidad_Prestadora (nombre_entidad) VALUES ($1) ON CONFLICT DO NOTHING`,
      [razon_social]
    );
    await client.query(`
      INSERT INTO Entidad_Externa (rif, razon_social, fecha_fin_contrato, contacto_nombre, contacto_correo, nombre_entidad)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [rif, razon_social, fecha_fin_contrato, contacto_nombre, contacto_correo, razon_social]);
    await client.query('COMMIT');
    res.status(201).json({ message: 'Empresa registrada' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe una empresa con ese RIF' });
    console.error(err); res.status(500).json({ error: 'Error interno' });
  } finally { client.release(); }
});

// PUT /api/admin/entidades-externas/:rif
router.put('/entidades-externas/:rif', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { fecha_fin_contrato, contacto_nombre, contacto_correo } = req.body;
  try {
    await pool.query(`
      UPDATE Entidad_Externa
      SET fecha_fin_contrato = COALESCE($1, fecha_fin_contrato),
          contacto_nombre    = COALESCE($2, contacto_nombre),
          contacto_correo    = COALESCE($3, contacto_correo)
      WHERE rif = $4
    `, [fecha_fin_contrato || null, contacto_nombre || null, contacto_correo || null, req.params.rif]);
    res.json({ message: 'Empresa actualizada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// ══════════════ VACANTES LABORALES ═══════════════════════════════════

// GET /api/admin/vacantes
router.get('/vacantes', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { rows } = await pool.query(`
      SELECT
        v.id_vacante, v.cargo, v.estatus, v.fecha_oferta,
        v.responsabilidades, v.perfil_buscado, v.beneficios,
        v.rif, ee.razon_social AS empresa, ee.contacto_correo,
        (SELECT COUNT(*) FROM Postula p WHERE p.id_vacante = v.id_vacante) AS total_postulaciones
      FROM  Vacante_Laboral v
      JOIN  Entidad_Externa ee ON ee.rif = v.rif
      ORDER BY v.fecha_oferta DESC
    `);
    res.json({ vacantes: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/admin/vacantes
router.post('/vacantes', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { cargo, responsabilidades, perfil_buscado, beneficios, rif } = req.body;
  if (!cargo || !responsabilidades || !perfil_buscado || !rif)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });

  try {
    const { rows: emp } = await pool.query('SELECT 1 FROM Entidad_Externa WHERE rif = $1', [rif]);
    if (!emp.length) return res.status(400).json({ error: 'La empresa no existe. Regístrela primero.' });

    const idVacante = 'VAC-' + Date.now();
    await pool.query(`
      INSERT INTO Vacante_Laboral (id_vacante, fecha_oferta, cargo, estatus, responsabilidades, perfil_buscado, beneficios, rif)
      VALUES ($1, CURRENT_DATE, $2, 'Disponible', $3, $4, $5, $6)
    `, [idVacante, cargo, responsabilidades, perfil_buscado, beneficios || null, rif]);
    res.status(201).json({ message: 'Vacante creada', id_vacante: idVacante });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/admin/vacantes/:id
router.put('/vacantes/:id', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { cargo, responsabilidades, perfil_buscado, beneficios, estatus } = req.body;
  const ESTATUSES = ['Disponible', 'Finalizada'];
  if (estatus && !ESTATUSES.includes(estatus))
    return res.status(400).json({ error: 'Estatus no válido' });
  try {
    const { rowCount } = await pool.query(`
      UPDATE Vacante_Laboral
      SET cargo             = COALESCE($1, cargo),
          responsabilidades = COALESCE($2, responsabilidades),
          perfil_buscado    = COALESCE($3, perfil_buscado),
          beneficios        = COALESCE($4, beneficios),
          estatus           = COALESCE($5, estatus)
      WHERE id_vacante = $6
    `, [cargo || null, responsabilidades || null, perfil_buscado || null,
        beneficios || null, estatus || null, req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Vacante no encontrada' });
    res.json({ message: 'Vacante actualizada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/admin/vacantes/:id
router.delete('/vacantes/:id', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    await pool.query(
      `UPDATE Vacante_Laboral SET estatus = 'Finalizada' WHERE id_vacante = $1`,
      [req.params.id]
    );
    res.json({ message: 'Vacante marcada como Finalizada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/admin/postulaciones — todas las postulaciones para gestión
router.get('/postulaciones', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { rows } = await pool.query(`
      SELECT
        po.cedula, po.id_vacante, po.fecha_postulacion, po.estatus,
        p.primer_nombre || ' ' || p.primer_apellido AS nombre,
        eg.titulo, eg.indice_academico,
        v.cargo, ee.razon_social AS empresa
      FROM  Postula po
      JOIN  Persona              p  ON p.cedula    = po.cedula
      JOIN  Egresado             eg ON eg.cedula   = po.cedula AND eg.fecha_inicio = po.fecha_inicio
      JOIN  Vacante_Laboral      v  ON v.id_vacante = po.id_vacante
      JOIN  Entidad_Externa      ee ON ee.rif       = v.rif
      ORDER BY po.fecha_postulacion DESC
    `);
    res.json({ postulaciones: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PATCH /api/admin/postulaciones/:cedula/:idVacante
router.patch('/postulaciones/:cedula/:idVacante', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { estatus } = req.body;
  const ESTATUSES = ['En Revisión', 'Seleccionado', 'Rechazado'];
  if (!ESTATUSES.includes(estatus))
    return res.status(400).json({ error: 'Estatus no válido' });
  try {
    await pool.query(
      'UPDATE Postula SET estatus = $1 WHERE cedula = $2 AND id_vacante = $3',
      [estatus, req.params.cedula, req.params.idVacante]
    );
    res.json({ message: 'Postulación actualizada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// ══════════════ TASA DE CAMBIO ════════════════════════════════════════

// GET /api/admin/tasas
router.get('/tasas', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { rows } = await pool.query(
      'SELECT fecha_tasa, eur, usd FROM Tasa ORDER BY fecha_tasa DESC LIMIT 30'
    );
    res.json({ tasas: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/admin/tasas/vigente — tasa más reciente (sin requerir admin)
router.get('/tasas/vigente', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT fecha_tasa, eur, usd FROM Tasa ORDER BY fecha_tasa DESC LIMIT 1'
    );
    res.json({ tasa: rows[0] || null });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/admin/tasas
router.post('/tasas', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { fecha_tasa, eur, usd } = req.body;
  if (!fecha_tasa || !eur || !usd)
    return res.status(400).json({ error: 'Faltan campos: fecha_tasa, eur, usd' });
  const eurNum = parseFloat(eur);
  const usdNum = parseFloat(usd);
  if (isNaN(eurNum) || eurNum <= 0 || isNaN(usdNum) || usdNum <= 0)
    return res.status(400).json({ error: 'Las tasas deben ser números positivos' });
  try {
    await pool.query(`
      INSERT INTO Tasa (fecha_tasa, eur, usd)
      VALUES ($1, $2, $3)
      ON CONFLICT (fecha_tasa) DO UPDATE SET eur = EXCLUDED.eur, usd = EXCLUDED.usd
    `, [fecha_tasa, eurNum, usdNum]);
    res.status(201).json({ message: 'Tasa registrada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// ══════════════ ACREDITACIONES (CATÁLOGO) ════════════════════════════

// GET /api/admin/acreditaciones
router.get('/acreditaciones', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { rows } = await pool.query(
      'SELECT id_acreditacion, tipo, descripcion FROM Acreditacion ORDER BY tipo, descripcion'
    );
    res.json({ acreditaciones: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/admin/acreditaciones
router.post('/acreditaciones', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { tipo, descripcion } = req.body;
  if (!tipo) return res.status(400).json({ error: 'El tipo es requerido' });
  try {
    const id = 'ACRED-' + Date.now();
    await pool.query(
      'INSERT INTO Acreditacion (id_acreditacion, tipo, descripcion) VALUES ($1, $2, $3)',
      [id, tipo, descripcion || null]
    );
    res.status(201).json({ message: 'Acreditación creada', id_acreditacion: id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/admin/acreditaciones/:id
router.put('/acreditaciones/:id', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  const { tipo, descripcion } = req.body;
  try {
    const { rowCount } = await pool.query(`
      UPDATE Acreditacion SET tipo = COALESCE($1, tipo), descripcion = COALESCE($2, descripcion)
      WHERE id_acreditacion = $3
    `, [tipo || null, descripcion || null, req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Acreditación no encontrada' });
    res.json({ message: 'Acreditación actualizada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/admin/acreditaciones/:id
router.delete('/acreditaciones/:id', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    await pool.query('DELETE FROM Acreditacion WHERE id_acreditacion = $1', [req.params.id]);
    res.json({ message: 'Acreditación eliminada' });
  } catch (err) {
    if (err.code === '23503') return res.status(409).json({ error: 'Esta acreditación está en uso y no puede eliminarse' });
    console.error(err); res.status(500).json({ error: 'Error interno' });
  }
});

// ══════════════ CIERRE MASIVO DE FOLIOS ══════════════════════════════

// POST /api/admin/folios/cierre-masivo
router.post('/folios/cierre-masivo', async (req, res) => {
  if (!await verificarAdmin(req.cedula)) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    await pool.query('CALL proc_cierre_masivo_folios()');
    res.json({ message: 'Cierre masivo ejecutado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al ejecutar cierre masivo: ' + err.message });
  }
});

module.exports = router;
