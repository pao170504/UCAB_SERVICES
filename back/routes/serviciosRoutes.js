const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/* ── helper: check active admin role ─────────────────────────────────────── */
const { ADMIN_CEDULAS } = require('../config/admins');
async function esAdmin(cedula) {
  if (!ADMIN_CEDULAS.includes(String(cedula))) return false;   // candado: solo admin del sistema
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

/* ── GET /api/servicios/admin/solicitudes ─────────────────────────────────── */
// GET /api/servicios/requisitos/:idServicio
// Requisitos del servicio (acreditaciones exigidas + requisitos de acceso) junto con
// si el USUARIO ACTUAL ya cumple cada acreditación. Sirve para mostrarlos al reservar.
router.get('/requisitos/:idServicio', async (req, res) => {
  const { idServicio } = req.params;
  try {
    const [acred, reqAcc] = await Promise.all([
      pool.query(`
        SELECT a.id_acreditacion, a.tipo, a.descripcion, c.estado AS cumple_estado
        FROM   Requiere r
        JOIN   Acreditacion a ON a.id_acreditacion = r.id_acreditacion
        LEFT   JOIN Cumple c ON c.id_acreditacion = r.id_acreditacion AND c.cedula = $2
        WHERE  r.id_servicio = $1
        ORDER  BY a.id_acreditacion`, [idServicio, req.cedula]),
      pool.query(`SELECT requisito FROM Requisitos_Acceso WHERE id_servicio = $1 ORDER BY requisito`, [idServicio])
    ]);
    res.json({
      acreditaciones:    acred.rows,
      requisitos_acceso: reqAcc.rows.map(r => r.requisito)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/admin/solicitudes', async (req, res) => {
  const { rows: adminRows } = await pool.query(`
    SELECT pa.cedula, pa.cargo, pa.unidad_adscripcion
    FROM   Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv
           ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
  `, [req.cedula]);

  if (!adminRows.length)
    return res.status(403).json({ error: 'Acceso solo para personal administrativo' });

  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id_solicitud,
        ss.estado,
        ss.fecha_apertura,
        ss.resolucion,
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
      WHERE  ss.estado NOT IN ('Cancelada', 'Completada')
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

/* -- POST /api/servicios/solicitudes -- */
router.post('/solicitudes', async (req, res) => {
  const { id_servicio, acompanantes = [] } = req.body;

  if (!id_servicio)
    return res.status(400).json({ error: 'El servicio es requerido' });
  if (acompanantes.length > 5)
    return res.status(400).json({ error: 'Maximo 5 acompanantes por solicitud' });

  try {
    const { rows: svcRows } = await pool.query(
      `SELECT id_servicio, descripcion, nombre_entidad, id_categoria FROM Servicio WHERE id_servicio = $1`,
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

    /* Tarifa segun el perfil del solicitante (igual que el catalogo):
       miembro activo = costo_min, egresado = x1.20, externo = x1.60.
       Se usa el costo_min de Regula para la categoria/sede del miembro. */
    const { rows: sedeRows } = await pool.query(
      `SELECT id_sede FROM Miembro_Comunidad WHERE cedula = $1`, [req.cedula]
    );
    const idSede = sedeRows[0]?.id_sede || 1;

    const { rows: regRows } = await pool.query(
      `SELECT costo_min FROM Regula WHERE id_sede = $1 AND id_categoria = $2`,
      [idSede, svcRows[0].id_categoria]
    );
    const costoMin = regRows.length ? parseFloat(regRows[0].costo_min) : 0;

    const { rows: perfilRows } = await pool.query(`
      SELECT
        EXISTS (SELECT 1 FROM Periodo_Vinculacion pv
                LEFT JOIN Egresado e ON e.cedula=pv.cedula AND e.fecha_inicio=pv.fecha_inicio
                WHERE pv.cedula=$1 AND pv.fecha_fin IS NULL AND e.cedula IS NULL) AS es_miembro,
        EXISTS (SELECT 1 FROM Egresado WHERE cedula=$1) AS es_egresado
    `, [req.cedula]);
    let factor = 1.60;                                   // externo por defecto
    if (perfilRows[0]?.es_miembro)       factor = 1.00;  // miembro activo
    else if (perfilRows[0]?.es_egresado) factor = 1.20;  // egresado
    const precioBase = parseFloat((costoMin * factor).toFixed(2));
    const IVA = 0.16;

    const idSolicitud = `SOL-${Date.now()}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO Solicitud_Servicio (id_solicitud, resolucion, estado, fecha_apertura, cedula, id_servicio)
        VALUES ($1, NULL, 'Pendiente', CURRENT_DATE, $2, $3)
      `, [idSolicitud, req.cedula, id_servicio]);

      const PASOS_POR_SERVICIO = {
        'SVC-TITULO': [
          { responsable: 'Unidad de Caja',       desc: 'Verificacion de solvencia y pago de aranceles' },
          { responsable: 'Secretaria Academica', desc: 'Validacion de creditos y requisitos de graduacion' },
          { responsable: 'Rectorado',            desc: 'Emision y firma del documento oficial' }
        ],
        'SVC-CONSTANCIA-EST': [
          { responsable: 'Secretaria Academica', desc: 'Emision de constancia de estudios' }
        ],
        'SVC-RECORD-NOTAS': [
          { responsable: 'Unidad de Caja',       desc: 'Verificacion de solvencia' },
          { responsable: 'Secretaria Academica', desc: 'Generacion y certificacion del record' }
        ],
        'SVC-INSCRIPCION': [
          { responsable: 'Unidad de Caja',      desc: 'Pago de arancel de inscripcion' },
          { responsable: 'Control de Estudios', desc: 'Procesamiento de inscripcion semestral' }
        ],
        'SVC-RETIRO-MATERIA': [
          { responsable: 'Control de Estudios', desc: 'Procesamiento del retiro de materia' }
        ],
        'SVC-RETIRO-SEMESTRE': [
          { responsable: 'Control de Estudios',  desc: 'Aprobacion del retiro de semestre' },
          { responsable: 'Secretaria Academica', desc: 'Registro oficial del retiro' }
        ]
      };

      const pasos = PASOS_POR_SERVICIO[id_servicio] || [
        { responsable: 'Oficina Responsable', desc: 'Procesamiento de solicitud' }
      ];

      for (let i = 0; i < pasos.length; i++) {
        const idPaso = `PASO-${idSolicitud}-${i + 1}`;
        await client.query(`
          INSERT INTO Paso_Actividad
            (id_paso, fecha_inicio, responsable, fecha_completada, estado_paso, id_solicitud)
          VALUES ($1, CURRENT_TIMESTAMP, $2, NULL, 'Pendiente', $3)
        `, [idPaso, pasos[i].responsable, idSolicitud]);
      }

      const SERVICIOS_CON_ACOMPANANTES = ['SVC-CUL-001', 'SVC-CUL-002', 'SVC-DEP-001', 'SVC-DEP-002'];
      if (SERVICIOS_CON_ACOMPANANTES.includes(id_servicio) &&
          Array.isArray(acompanantes) && acompanantes.length > 0) {
        const limite = acompanantes.slice(0, 5);
        for (const ac of limite) {
          if (!ac.nombre || !ac.documento) continue;
          await client.query(`
            INSERT INTO Acompanante (id_solicitud, documento, nombre)
            VALUES ($1, $2, $3)
            ON CONFLICT (id_solicitud, documento) DO UPDATE SET nombre = EXCLUDED.nombre
          `, [idSolicitud, ac.documento.trim(), ac.nombre.trim()]);
        }
      }

      /* Siempre se crea Folio + Item + Factura para que el estudiante
         pueda ver el registro en Pagos. Los servicios gratuitos
         (costo_min=0) generan una factura con monto=0 que se muestra
         con estado "Gratuito" y no requiere pago. */
      const impuesto  = precioBase > 0 ? IVA : 0;
      const idFolio   = `FOL-${idSolicitud}`;
      await client.query(`
        INSERT INTO Folio_Consumo (id_folio, estado, id_solicitud)
        VALUES ($1, 'Abierto', $2)
      `, [idFolio, idSolicitud]);

      await client.query(`
        INSERT INTO Item_Consumo (id_folio, numero, impuesto, cantidad, concepto, precio)
        VALUES ($1, 1, $2, 1, $3, $4)
      `, [idFolio, impuesto, svcRows[0].descripcion, precioBase]);

      const monto     = parseFloat((precioBase * (1 + impuesto)).toFixed(2));
      const idFactura = `FAC-${Date.now()}`;
      await client.query(`
        INSERT INTO Factura (id_factura, emisión, monto, id_folio, rif)
        VALUES ($1, CURRENT_DATE, $2, $3, NULL)
      `, [idFactura, monto, idFolio]);   // trg_cerrar_folio cierra el folio
      const facturaInfo = { id_factura: idFactura, monto };

      await client.query('COMMIT');
      res.json({
        message: 'Solicitud creada exitosamente',
        id_solicitud: idSolicitud,
        factura: facturaInfo
      });
    } catch (errTx) {
      await client.query('ROLLBACK').catch(() => {});
      throw errTx;
    } finally {
      client.release();
    }
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

/* ── PATCH /api/servicios/solicitudes/:idSolicitud/paso/:idPaso ─────────────── */
router.patch('/solicitudes/:idSolicitud/paso/:idPaso', async (req, res) => {
  const { idSolicitud, idPaso } = req.params;

  const { rows: adminRows } = await pool.query(`
    SELECT pa.cedula FROM Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv
           ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
  `, [req.cedula]);

  if (!adminRows.length)
    return res.status(403).json({ error: 'Solo el personal administrativo puede aprobar pasos' });

  try {
    const { rows: pasoRows } = await pool.query(`
      SELECT id_paso, estado_paso, responsable
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

/* ── GET /api/servicios/solicitudes/:idSolicitud/pasos ──────────────────────── */
router.get('/solicitudes/:idSolicitud/pasos', async (req, res) => {
  const { idSolicitud } = req.params;

  try {
    const { rows: own } = await pool.query(
      `SELECT cedula FROM Solicitud_Servicio WHERE id_solicitud = $1`,
      [idSolicitud]
    );
    if (!own.length)
      return res.status(404).json({ error: 'Solicitud no encontrada' });

    const { rows: adminCheck } = await pool.query(`
      SELECT 1 FROM Personal_Administrativo pa
      JOIN   Periodo_Vinculacion pv ON pv.cedula = pa.cedula
                                  AND pv.fecha_inicio = pa.fecha_inicio
      WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
    `, [req.cedula]);

    if (own[0].cedula !== req.cedula && !adminCheck.length)
      return res.status(403).json({ error: 'Sin acceso a esta solicitud' });

    const { rows: pasos } = await pool.query(`
      SELECT id_paso, responsable, fecha_inicio,
             fecha_completada, estado_paso
      FROM   Paso_Actividad
      WHERE  id_solicitud = $1
      ORDER  BY fecha_inicio ASC
    `, [idSolicitud]);

    const { rows: acomp } = await pool.query(`
      SELECT documento, nombre FROM Acompanante
      WHERE  id_solicitud = $1
    `, [idSolicitud]);

    res.json({ pasos, acompanantes: acomp });
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
    // Get user's sede
    const { rows: sedeRows } = await pool.query(
      `SELECT id_sede FROM Miembro_Comunidad WHERE cedula = $1`,
      [req.cedula]
    );
    const idSede = sedeRows[0]?.id_sede || 1;

    // Get all services with their category, price limits and entidad
    let query = `
      SELECT
        sv.id_servicio,
        sv.descripcion,
        sv.nombre_entidad,
        cs.id_categoria,
        cs.categoria,
        cs.nombre                           AS nombre_categoria,
        r.costo_min,
        r.costo_max,
        -- Three differentiated tariffs
        r.costo_min                         AS tarifa_miembro,
        ROUND((r.costo_min * 1.20)::NUMERIC, 2) AS tarifa_egresado,
        ROUND((r.costo_min * 1.60)::NUMERIC, 2) AS tarifa_externo,
        -- Check if it's internal or external entity
        CASE WHEN ei.nombre_entidad IS NOT NULL THEN 'interna'
             ELSE 'externa' END             AS tipo_entidad,
        -- Access requirements list
        ARRAY_AGG(DISTINCT ra.requisito)
          FILTER (WHERE ra.requisito IS NOT NULL) AS requisitos,
        -- Required acreditaciones IDs
        ARRAY_AGG(DISTINCT req.id_acreditacion)
          FILTER (WHERE req.id_acreditacion IS NOT NULL) AS acreditaciones_requeridas
      FROM   Servicio           sv
      JOIN   Categoria_Servicio cs ON cs.id_categoria  = sv.id_categoria
      JOIN   Regula             r  ON r.id_categoria   = cs.id_categoria
                                  AND r.id_sede        = $1
      LEFT   JOIN Entidad_Interna  ei  ON ei.nombre_entidad  = sv.nombre_entidad
      LEFT   JOIN Requisitos_Acceso ra ON ra.id_servicio     = sv.id_servicio
      LEFT   JOIN Requiere          req ON req.id_servicio   = sv.id_servicio
    `;

    const params = [idSede];

    // Always exclude infraestructura and estacionamiento services
    query += `
      WHERE sv.nombre_entidad NOT IN ('UCAB - Infraestructura', 'UCAB - Estacionamiento')
        AND sv.id_servicio NOT LIKE 'SERV-ESTAC%'
        AND sv.id_servicio NOT LIKE 'SERV-AUDIT%'
        AND sv.id_servicio NOT LIKE 'SERV-SALON%'
        AND sv.id_servicio NOT LIKE 'SERV-LAB%'
        AND sv.id_servicio NOT LIKE 'SERV-CANCHA%'
    `;

    if (categoria) {
      params.push(categoria);
      query += ` AND cs.id_categoria = $${params.length}`;
    }

    if (buscar) {
      params.push(`%${buscar.toLowerCase()}%`);
      query += ` AND (LOWER(sv.descripcion) LIKE $${params.length}
                    OR LOWER(sv.nombre_entidad) LIKE $${params.length})`;
    }

    query += `
      GROUP BY sv.id_servicio, sv.descripcion, sv.nombre_entidad,
               cs.id_categoria, cs.categoria, cs.nombre,
               r.costo_min, r.costo_max, ei.nombre_entidad
      ORDER BY cs.categoria, sv.descripcion
    `;

    const { rows: servicios } = await pool.query(query, params);

    // For each service check which acreditaciones the user has
    const { rows: cumpleRows } = await pool.query(`
      SELECT id_acreditacion, estado,
             fecha_vencimiento > CURRENT_DATE AS vigente
      FROM   Cumple WHERE cedula = $1
    `, [req.cedula]);

    const cumpleMap = {};
    const estadoMap = {};
    for (const c of cumpleRows) {
      const valida = c.vigente && c.estado === 'Vigente';
      cumpleMap[c.id_acreditacion] = valida;
      estadoMap[c.id_acreditacion] = valida ? 'Vigente' : (c.estado || 'Vencida');
    }

    // Names (tipo) of every acreditacion, to label them on the catalog cards
    const { rows: acredCat } = await pool.query(`SELECT id_acreditacion, tipo FROM Acreditacion`);
    const tipoMap = {};
    for (const a of acredCat) tipoMap[a.id_acreditacion] = a.tipo;

    // Attach cumple status to each service
    const result = servicios.map(s => {
      const reqs = s.acreditaciones_requeridas || [];
      const cumpleTodas = reqs.every(id => cumpleMap[id] === true);
      return {
        ...s,
        puede_solicitar: cumpleTodas,
        acreditaciones_faltantes: reqs.filter(id => !cumpleMap[id]),
        // Full objects (name + user status) so the catalog card can list them
        acreditaciones: reqs.map(id => ({
          id_acreditacion: id,
          tipo: tipoMap[id] || id,
          cumple_estado: estadoMap[id] || null
        }))
      };
    });

    res.json({ servicios: result });
  } catch (err) {
    console.error('Error al cargar servicios:', err);
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
