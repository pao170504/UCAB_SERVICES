const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/* ── helper: check active admin role ─────────────────────────────────────── */
async function esAdmin(cedula) {
  const { rows } = await pool.query(`
    SELECT 1 FROM Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
    LIMIT  1
  `, [cedula]);
  return rows.length > 0;
}

/* ── GET /api/servicios/categorias ─────────────────────────────────────────── */
router.get('/categorias', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_categoria, categoria, nombre FROM Categoria_Servicio ORDER BY nombre`
    );
    res.json({ categorias: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios/entidades ──────────────────────────────────────────── */
router.get('/entidades', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ep.nombre_entidad,
        CASE WHEN ei.codigo_presupuestario IS NOT NULL THEN 'interna' ELSE 'externa' END AS tipo,
        ei.director,
        ei.codigo_presupuestario,
        ee.razon_social,
        ee.rif,
        ee.fecha_fin_contrato
      FROM   Entidad_Prestadora ep
      LEFT   JOIN Entidad_Interna ei ON ei.nombre_entidad = ep.nombre_entidad
      LEFT   JOIN Entidad_Externa ee ON ee.nombre_entidad = ep.nombre_entidad
      ORDER  BY ep.nombre_entidad
    `);
    res.json({ entidades: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios/acreditaciones (user's own) ───────────────────────── */
router.get('/acreditaciones', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        a.id_acreditacion, a.tipo, a.descripcion,
        c.obtencion, c.fecha_vencimiento, c.estado
      FROM   Cumple c
      JOIN   Acreditacion a ON a.id_acreditacion = c.id_acreditacion
      WHERE  c.cedula = $1
      ORDER  BY c.obtencion DESC
    `, [req.cedula]);
    res.json({ acreditaciones: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios/solicitudes ─────────────────────────────────────────── */
router.get('/solicitudes', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id_solicitud,  ss.estado,  ss.fecha_apertura, ss.resolucion,
        s.id_servicio,    s.descripcion AS nombre_servicio,
        cs.categoria,     cs.nombre     AS nombre_categoria,
        ep.nombre_entidad,
        COUNT(pa.id_paso)                                               AS total_pasos,
        COUNT(pa.id_paso) FILTER (WHERE pa.estado_paso = 'Completado') AS pasos_completados
      FROM   Solicitud_Servicio ss
      JOIN   Servicio            s  ON s.id_servicio   = ss.id_servicio
      JOIN   Categoria_Servicio  cs ON cs.id_categoria = s.id_categoria
      JOIN   Entidad_Prestadora  ep ON ep.nombre_entidad = s.nombre_entidad
      LEFT   JOIN Paso_Actividad pa ON pa.id_solicitud  = ss.id_solicitud
      WHERE  ss.cedula = $1
      GROUP  BY ss.id_solicitud, ss.estado, ss.fecha_apertura, ss.resolucion,
                s.id_servicio, s.descripcion, cs.categoria, cs.nombre, ep.nombre_entidad
      ORDER  BY ss.fecha_apertura DESC
    `, [req.cedula]);
    res.json({ solicitudes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/servicios/solicitudes ────────────────────────────────────────── */
router.post('/solicitudes', async (req, res) => {
  const { id_servicio, acompanantes = [] } = req.body;

  if (!id_servicio)
    return res.status(400).json({ error: 'El servicio es requerido' });
  if (acompanantes.length > 5)
    return res.status(400).json({ error: 'Máximo 5 acompañantes por solicitud' });

  try {
    const { rows: svcRows } = await pool.query(
      `SELECT id_servicio, descripcion, nombre_entidad FROM Servicio WHERE id_servicio = $1`,
      [id_servicio]
    );
    if (svcRows.length === 0)
      return res.status(404).json({ error: 'Servicio no encontrado' });

    /* Verify required accreditations */
    const { rows: reqAcred } = await pool.query(`
      SELECT r.id_acreditacion, a.tipo
      FROM   Requiere r
      JOIN   Acreditacion a ON a.id_acreditacion = r.id_acreditacion
      WHERE  r.id_servicio = $1
    `, [id_servicio]);

    if (reqAcred.length > 0) {
      const ids = reqAcred.map(r => r.id_acreditacion);
      const { rows: cumpleRows } = await pool.query(`
        SELECT id_acreditacion FROM Cumple
        WHERE  cedula = $1
          AND  id_acreditacion = ANY($2)
          AND  estado = 'Vigente'
          AND  (fecha_vencimiento IS NULL OR fecha_vencimiento > CURRENT_DATE)
      `, [req.cedula, ids]);
      const cumpleSet = new Set(cumpleRows.map(r => r.id_acreditacion));
      const faltantes = reqAcred.filter(r => !cumpleSet.has(r.id_acreditacion));
      if (faltantes.length > 0)
        return res.status(403).json({
          error:     'Faltan acreditaciones requeridas',
          faltantes: faltantes.map(f => f.tipo)
        });
    }

    const idSolicitud = `SOL-${Date.now()}`;
    const idPaso      = `PASO-${Date.now() + 1}`;

    await pool.query(`
      INSERT INTO Solicitud_Servicio (id_solicitud, resolucion, estado, fecha_apertura, cedula, id_servicio)
      VALUES ($1, NULL, 'Pendiente', CURRENT_DATE, $2, $3)
    `, [idSolicitud, req.cedula, id_servicio]);

    await pool.query(`
      INSERT INTO Paso_Actividad (id_paso, fecha_inicio, responsable, fecha_completada, estado_paso, id_solicitud)
      VALUES ($1, CURRENT_TIMESTAMP, $2, NULL, 'Pendiente', $3)
    `, [idPaso, svcRows[0].nombre_entidad, idSolicitud]);

    for (const comp of acompanantes) {
      if (comp.nombre && comp.documento) {
        await pool.query(`
          INSERT INTO Acompanante (id_solicitud, documento, nombre)
          VALUES ($1, $2, $3)
          ON CONFLICT (id_solicitud, documento) DO UPDATE SET nombre = EXCLUDED.nombre
        `, [idSolicitud, comp.documento, comp.nombre]);
      }
    }

    res.json({ message: 'Solicitud creada exitosamente', id_solicitud: idSolicitud });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios/solicitudes/:id ─────────────────────────────────────── */
router.get('/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: solRows } = await pool.query(`
      SELECT
        ss.id_solicitud, ss.estado, ss.fecha_apertura, ss.resolucion,
        s.id_servicio, s.descripcion AS nombre_servicio,
        cs.categoria, cs.nombre AS nombre_categoria,
        ep.nombre_entidad
      FROM   Solicitud_Servicio ss
      JOIN   Servicio            s  ON s.id_servicio   = ss.id_servicio
      JOIN   Categoria_Servicio  cs ON cs.id_categoria = s.id_categoria
      JOIN   Entidad_Prestadora  ep ON ep.nombre_entidad = s.nombre_entidad
      WHERE  ss.id_solicitud = $1 AND ss.cedula = $2
    `, [id, req.cedula]);

    if (solRows.length === 0)
      return res.status(404).json({ error: 'Solicitud no encontrada' });

    const { rows: pasos } = await pool.query(`
      SELECT id_paso, fecha_inicio, responsable, fecha_completada, estado_paso
      FROM   Paso_Actividad
      WHERE  id_solicitud = $1
      ORDER  BY fecha_inicio
    `, [id]);

    const { rows: acompanantes } = await pool.query(`
      SELECT documento, nombre FROM Acompanante WHERE id_solicitud = $1
    `, [id]);

    res.json({ solicitud: solRows[0], pasos, acompanantes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── PATCH /api/servicios/solicitudes/:id/paso/:idPaso ──────────────────────── */
router.patch('/solicitudes/:id/paso/:idPaso', async (req, res) => {
  const { id, idPaso } = req.params;

  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede completar pasos' });

  try {
    const { rows: pasoRows } = await pool.query(
      `SELECT estado_paso FROM Paso_Actividad WHERE id_paso = $1 AND id_solicitud = $2`,
      [idPaso, id]
    );
    if (pasoRows.length === 0)
      return res.status(404).json({ error: 'Paso no encontrado' });
    if (pasoRows[0].estado_paso === 'Completado')
      return res.status(400).json({ error: 'El paso ya fue completado' });

    await pool.query(`
      UPDATE Paso_Actividad SET estado_paso = 'Completado' WHERE id_paso = $1
    `, [idPaso]);
    // trg_timestamp_paso auto-sets Fecha_Completada
    // trg_completar_solicitud auto-completes Solicitud when all pasos are done

    res.json({ message: 'Paso completado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── DELETE /api/servicios/solicitudes/:id ──────────────────────────────────── */
router.delete('/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT estado FROM Solicitud_Servicio WHERE id_solicitud = $1 AND cedula = $2`,
      [id, req.cedula]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (rows[0].estado !== 'Pendiente')
      return res.status(400).json({ error: 'Solo se pueden cancelar solicitudes pendientes' });

    await pool.query(`DELETE FROM Solicitud_Servicio WHERE id_solicitud = $1`, [id]);
    res.json({ message: 'Solicitud cancelada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios — catalog ────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  const { categoria, buscar } = req.query;
  try {
    let query = `
      WITH user_sede AS (
        SELECT id_sede FROM Miembro_Comunidad WHERE cedula = $1
      )
      SELECT
        s.id_servicio,
        s.descripcion,
        s.nombre_entidad,
        cs.id_categoria, cs.categoria, cs.nombre AS nombre_categoria,
        r.costo_min, r.costo_max, r.ubicacion,
        CASE WHEN ei.codigo_presupuestario IS NOT NULL THEN 'interna' ELSE 'externa' END AS tipo_entidad
      FROM   Servicio s
      JOIN   Categoria_Servicio cs ON cs.id_categoria = s.id_categoria
      LEFT   JOIN Entidad_Interna ei ON ei.nombre_entidad = s.nombre_entidad
      LEFT   JOIN Regula r ON r.id_categoria = s.id_categoria
                           AND r.id_sede = (SELECT id_sede FROM user_sede)
      WHERE  1 = 1
    `;
    const params = [req.cedula];

    if (categoria && categoria !== 'all') {
      params.push(categoria);
      query += ` AND LOWER(cs.categoria) = LOWER($${params.length})`;
    }
    if (buscar) {
      params.push(`%${buscar}%`);
      query += ` AND (s.id_servicio ILIKE $${params.length}
                   OR s.descripcion  ILIKE $${params.length}
                   OR s.nombre_entidad ILIKE $${params.length})`;
    }
    query += ' ORDER BY cs.nombre, s.descripcion';

    const { rows: servicios } = await pool.query(query, params);

    const ids = servicios.map(s => s.id_servicio);
    let acredMap = {};

    if (ids.length > 0) {
      const { rows: aRows } = await pool.query(`
        SELECT
          req.id_servicio,
          a.id_acreditacion, a.tipo,
          c.estado AS cumple_estado
        FROM   Requiere req
        JOIN   Acreditacion a ON a.id_acreditacion = req.id_acreditacion
        LEFT   JOIN Cumple c ON c.cedula = $1
                             AND c.id_acreditacion = a.id_acreditacion
                             AND c.estado = 'Vigente'
                             AND (c.fecha_vencimiento IS NULL OR c.fecha_vencimiento > CURRENT_DATE)
        WHERE  req.id_servicio = ANY($2)
      `, [req.cedula, ids]);

      for (const row of aRows) {
        if (!acredMap[row.id_servicio]) acredMap[row.id_servicio] = [];
        acredMap[row.id_servicio].push(row);
      }
    }

    const result = servicios.map(s => {
      const acreds = acredMap[s.id_servicio] || [];
      return {
        ...s,
        acreditaciones:   acreds,
        puede_solicitar: acreds.every(a => a.cumple_estado === 'Vigente')
      };
    });

    res.json({ servicios: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/servicios — create (admin) ──────────────────────────────────── */
router.post('/', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede crear servicios' });

  const { id_servicio, descripcion, nombre_entidad, id_categoria } = req.body;
  if (!id_servicio || !descripcion || !nombre_entidad || !id_categoria)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  try {
    await pool.query(`
      INSERT INTO Servicio (id_servicio, descripcion, nombre_entidad, id_categoria)
      VALUES ($1, $2, $3, $4)
    `, [id_servicio, descripcion, nombre_entidad, id_categoria]);
    res.status(201).json({ message: 'Servicio creado exitosamente', id_servicio });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El ID de servicio ya existe' });
    if (err.code === '23503') return res.status(400).json({ error: 'Entidad o categoría no válida' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── PUT /api/servicios/:id — update (admin) ────────────────────────────────── */
router.put('/:id', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede modificar servicios' });

  const { id } = req.params;
  const { descripcion, nombre_entidad, id_categoria } = req.body;
  if (!descripcion || !nombre_entidad || !id_categoria)
    return res.status(400).json({ error: 'Faltan campos requeridos' });

  try {
    const { rowCount } = await pool.query(`
      UPDATE Servicio
      SET    descripcion = $1, nombre_entidad = $2, id_categoria = $3
      WHERE  id_servicio = $4
    `, [descripcion, nombre_entidad, id_categoria, id]);
    if (rowCount === 0)
      return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ message: 'Servicio actualizado exitosamente' });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Entidad o categoría no válida' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── DELETE /api/servicios/:id — delete (admin) ─────────────────────────────── */
router.delete('/:id', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede eliminar servicios' });

  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Servicio WHERE id_servicio = $1`, [id]
    );
    if (rowCount === 0)
      return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ message: 'Servicio eliminado exitosamente' });
  } catch (err) {
    if (err.code === '23503')
      return res.status(400).json({ error: 'No se puede eliminar: hay solicitudes vinculadas a este servicio' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios/solicitudes/:id/tiempo ───────────────────────────────── */
router.get('/solicitudes/:id/tiempo', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: sol } = await pool.query(
      `SELECT cedula FROM Solicitud_Servicio WHERE id_solicitud = $1`, [id]
    );
    if (sol.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const admin = await esAdmin(req.cedula);
    if (!admin && sol[0].cedula !== req.cedula)
      return res.status(403).json({ error: 'Acceso denegado' });
    const { rows } = await pool.query(`SELECT * FROM fn_tiempo_resolucion($1)`, [id]);
    res.json({ tiempo: rows[0] || null });
  } catch (err) {
    if (err.code === 'P0001') return res.status(404).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/servicios/:id/costo-estimado ───────────────────────────────────── */
router.get('/:id/costo-estimado', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_costo_final_servicio($1, $2)`, [id, req.cedula]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ costo: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
