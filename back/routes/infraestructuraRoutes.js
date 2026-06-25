const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET /api/infraestructura/edificaciones?sede=1
router.get('/edificaciones', async (req, res) => {
  const idSede = parseInt(req.query.sede) || 1;
  try {
    const { rows } = await pool.query(`
      SELECT
        e.id_sede, e.nombre_edificacion, e.direccion,
        COUNT(ef.numero_espacio) AS total_espacios,
        COUNT(ef.numero_espacio)
          FILTER (WHERE ef.disponibilidad = 'Disponible')  AS disponibles,
        COUNT(ef.numero_espacio)
          FILTER (WHERE ef.estado = 'Mantenimiento')       AS en_mantenimiento
      FROM  Edificacion e
      LEFT  JOIN Espacio_Fisico ef
            ON ef.id_sede = e.id_sede
           AND ef.nombre_edificacion = e.nombre_edificacion
      WHERE e.id_sede = $1
      GROUP BY e.id_sede, e.nombre_edificacion, e.direccion
      ORDER BY e.nombre_edificacion
    `, [idSede]);
    res.json({ edificaciones: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/infraestructura/edificaciones/:sede/:nombre/espacios
router.get('/edificaciones/:sede/:nombre/espacios', async (req, res) => {
  const { sede, nombre } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT numero_espacio, tipo_espacio, capacidad_max,
             tipo_mobiliario, disponibilidad, estado
      FROM   Espacio_Fisico
      WHERE  id_sede = $1 AND nombre_edificacion = $2
      ORDER  BY numero_espacio
    `, [parseInt(sede), decodeURIComponent(nombre)]);
    res.json({ espacios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/infraestructura/espacios/:sede/:edificio/:numero/calendario
router.get('/espacios/:sede/:edificio/:numero/calendario', async (req, res) => {
  const { sede, edificio, numero } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        r.fecha_uso, r.bloque_horario, r.id_solicitud,
        ss.estado AS estado_solicitud,
        mc.correo_institucional AS solicitante,
        sv.descripcion AS servicio
      FROM  Reserva r
      JOIN  Paso_Actividad      pa ON pa.id_paso       = r.id_paso
      JOIN  Solicitud_Servicio  ss ON ss.id_solicitud  = r.id_solicitud
      JOIN  Miembro_Comunidad   mc ON mc.cedula        = ss.cedula
      JOIN  Servicio            sv ON sv.id_servicio   = ss.id_servicio
      WHERE r.id_sede            = $1
        AND r.nombre_edificacion = $2
        AND r.numero_espacio     = $3
        AND r.fecha_uso BETWEEN CURRENT_DATE - INTERVAL '3 days'
                            AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY r.fecha_uso, r.bloque_horario
    `, [parseInt(sede), decodeURIComponent(edificio), parseInt(numero)]);
    res.json({ reservas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/infraestructura/tarifas/:idServicio — returns 3 differentiated tariffs
router.get('/tarifas/:idServicio', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.costo_min, r.costo_max, r.ubicación,
             cs.nombre AS categoria, cs.id_categoria
      FROM   Servicio s
      JOIN   Categoria_Servicio cs ON cs.id_categoria = s.id_categoria
      JOIN   Regula r ON r.id_categoria = s.id_categoria AND r.id_sede = 1
      WHERE  s.id_servicio = $1
    `, [req.params.idServicio]);

    if (!rows.length)
      return res.status(404).json({ error: 'Servicio no encontrado' });

    const t = rows[0];
    const base = parseFloat(t.costo_min);

    res.json({
      tarifas: {
        id_categoria:    t.id_categoria,
        idCategoria:     t.id_categoria,
        categoria:       t.categoria,
        costo_min:       base,
        costo_max:       parseFloat(t.costo_max),
        ubicacion:       t.ubicación,
        tarifa_miembro:  parseFloat(base.toFixed(2)),
        tarifa_egresado: parseFloat((base * 1.20).toFixed(2)),
        tarifa_externo:  parseFloat((base * 1.60).toFixed(2))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /api/infraestructura/espacios/:sede/:edificio/:numero (admin only)
router.patch('/espacios/:sede/:edificio/:numero', async (req, res) => {
  const { sede, edificio, numero } = req.params;
  const { disponibilidad, estado } = req.body;

  const { rows: adminRows } = await pool.query(`
    SELECT pa.cedula FROM Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv
           ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
  `, [req.cedula]);

  if (!adminRows.length)
    return res.status(403).json({
      error: 'Solo el personal administrativo puede modificar espacios'
    });

  try {
    const updates = [];
    const params  = [];
    if (disponibilidad) { params.push(disponibilidad); updates.push(`disponibilidad = $${params.length}`); }
    if (estado)         { params.push(estado);         updates.push(`estado = $${params.length}`); }
    if (!updates.length)
      return res.status(400).json({ error: 'Sin campos para actualizar' });

    params.push(parseInt(sede), decodeURIComponent(edificio), parseInt(numero));
    await pool.query(`
      UPDATE Espacio_Fisico SET ${updates.join(', ')}
      WHERE  id_sede = $${params.length - 2}
        AND  nombre_edificacion = $${params.length - 1}
        AND  numero_espacio = $${params.length}
    `, params);
    res.json({ message: 'Espacio actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/infraestructura/tarifas/:idCategoria (admin only)
router.put('/tarifas/:idCategoria', async (req, res) => {
  const { idCategoria }            = req.params;
  const { costoMin, costoMax, idSede } = req.body;

  const { rows: adminRows } = await pool.query(`
    SELECT pa.cedula FROM Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv
           ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
  `, [req.cedula]);

  if (!adminRows.length)
    return res.status(403).json({
      error: 'Solo el personal administrativo puede modificar tarifas'
    });

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
      UPDATE Regula SET costo_min = $1, costo_max = $2
      WHERE  id_categoria = $3 AND id_sede = $4
    `, [min, max, idCategoria, parseInt(idSede) || 1]);

    if (!rowCount)
      return res.status(404).json({ error: 'Categoría/sede no encontrada' });

    res.json({
      message:         'Tarifas actualizadas correctamente',
      tarifa_miembro:  parseFloat(min.toFixed(2)),
      tarifa_egresado: parseFloat((min * 1.20).toFixed(2)),
      tarifa_externo:  parseFloat((min * 1.60).toFixed(2))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/infraestructura/reservar — now accepts acompanantes[]
router.post('/reservar', async (req, res) => {
  const { idSede, nombreEdificacion, numeroEspacio,
          fechaUso, bloqueHorario, idServicio,
          acompanantes = [] } = req.body;

  if (!idSede || !nombreEdificacion || !numeroEspacio ||
      !fechaUso || !bloqueHorario || !idServicio)
    return res.status(400).json({ error: 'Faltan datos requeridos' });

  // Check for block conflicts (before opening transaction)
  try {
    const { rows: conflicto } = await pool.query(`
      SELECT 1 FROM Reserva
      WHERE id_sede            = $1
        AND nombre_edificacion = $2
        AND numero_espacio     = $3
        AND fecha_uso          = $4
        AND bloque_horario     = $5
    `, [idSede, nombreEdificacion, numeroEspacio, fechaUso, bloqueHorario]);

    if (conflicto.length > 0)
      return res.status(409).json({
        error: 'Ese bloque horario ya está reservado para este espacio'
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Error interno' });
  }

  // Tariff lookup (outside transaction — read-only)
  let precio = 10.00;
  try {
    const { rows: tarifaRows } = await pool.query(`
      SELECT r.costo_min
      FROM   Servicio s
      JOIN   Categoria_Servicio cs ON cs.id_categoria = s.id_categoria
      JOIN   Regula r ON r.id_categoria = s.id_categoria AND r.id_sede = $1
      WHERE  s.id_servicio = $2
    `, [idSede, idServicio]);
    if (tarifaRows.length) precio = parseFloat(tarifaRows[0].costo_min);
  } catch (_) {}

  const iva        = parseFloat((precio * 0.16).toFixed(2));
  const montoTotal = parseFloat((precio + iva).toFixed(2));
  const ts         = Date.now();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const idSolicitud = `SOL-INFRA-${ts}`;
    await client.query(`
      INSERT INTO Solicitud_Servicio
        (id_solicitud, resolucion, estado, fecha_apertura, cedula, id_servicio)
      VALUES ($1, NULL, 'En Proceso', CURRENT_DATE, $2, $3)
    `, [idSolicitud, req.cedula, idServicio]);

    const idPaso = `PASO-INFRA-${ts}`;
    await client.query(`
      INSERT INTO Paso_Actividad
        (id_paso, fecha_inicio, responsable, fecha_completada, estado_paso, id_solicitud)
      VALUES ($1, CURRENT_TIMESTAMP, 'Dir. Planta Física', NULL, 'Pendiente', $2)
    `, [idPaso, idSolicitud]);

    await client.query(`
      INSERT INTO Reserva
        (id_sede, nombre_edificacion, numero_espacio, bloque_horario,
         fecha_uso, id_paso, id_solicitud)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [idSede, nombreEdificacion, numeroEspacio,
        bloqueHorario, fechaUso, idPaso, idSolicitud]);

    if (Array.isArray(acompanantes)) {
      for (const ac of acompanantes.slice(0, 5)) {
        if (!ac.nombre || !ac.documento) continue;
        await client.query(`
          INSERT INTO Acompanante (id_solicitud, documento, nombre)
          VALUES ($1, $2, $3)
          ON CONFLICT (id_solicitud, documento) DO UPDATE SET nombre = EXCLUDED.nombre
        `, [idSolicitud, ac.documento.trim(), ac.nombre.trim()]);
      }
    }

    const idFolio = `FOL-INFRA-${ts}`;
    await client.query(`
      INSERT INTO Folio_Consumo (id_folio, estado, id_solicitud)
      VALUES ($1, 'Abierto', $2)
    `, [idFolio, idSolicitud]);

    await client.query(`
      INSERT INTO Item_Consumo (id_folio, numero, impuesto, cantidad, concepto, precio)
      VALUES ($1, 1, $2, 1, $3, $4)
    `, [idFolio, iva,
        `Reserva ${nombreEdificacion} — Espacio ${numeroEspacio} — ${bloqueHorario}`,
        precio]);

    await client.query(
      `UPDATE Folio_Consumo SET estado = 'Cerrado' WHERE id_folio = $1`, [idFolio]
    );

    const idFactura = `FAC-INFRA-${ts}`;
    await client.query(`
      INSERT INTO Factura (id_factura, emisión, monto, id_folio, rif)
      VALUES ($1, CURRENT_DATE, $2, $3, NULL)
    `, [idFactura, montoTotal, idFolio]);

    await client.query('COMMIT');
    res.json({
      message: 'Reserva creada exitosamente',
      idSolicitud, idFactura, montoTotal,
      aviso: `Factura generada por $${montoTotal.toFixed(2)}. Págala desde el módulo de Pagos.`
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error en /reservar:', err);
    const msg = err.message || '';
    if (msg.includes('ya tiene una reserva') || msg.includes('El espacio ya tiene'))
      return res.status(409).json({ error: 'Ese bloque horario ya está reservado para este espacio' });
    if (msg.includes('Cuenta') && msg.includes('no puede realizar solicitudes'))
      return res.status(403).json({ error: 'Tu cuenta está suspendida o bloqueada. Contacta a soporte.' });
    if (msg.includes('fuera del rango permitido'))
      return res.status(400).json({ error: 'El precio del servicio está fuera del rango tarifario configurado.' });
    if (msg.includes('foreign key'))
      return res.status(400).json({ error: 'El servicio seleccionado no existe en el sistema. Ejecuta el script sql/patch_servicios.sql en tu base de datos.' });
    res.status(500).json({ error: msg || 'Error interno' });
  } finally {
    client.release();
  }
});

// GET /api/infraestructura/mis-reservas
router.get('/mis-reservas', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id_solicitud,
        ss.estado,
        ss.fecha_apertura,
        sv.descripcion                          AS servicio,
        sv.id_servicio,
        r.nombre_edificacion,
        r.numero_espacio,
        r.fecha_uso,
        r.bloque_horario,
        ef.tipo_espacio,
        ef.capacidad_max,
        COUNT(pa.id_paso)                                                   AS total_pasos,
        COUNT(pa.id_paso) FILTER (WHERE pa.estado_paso = 'Completado')      AS pasos_completados,
        (SELECT COUNT(*) FROM Acompanante ac
         WHERE ac.id_solicitud = ss.id_solicitud)                           AS total_acompanantes,
        f.id_factura,
        f.monto                                                             AS monto_factura,
        COALESCE(SUM(pg.monto), 0)                                          AS total_pagado,
        CASE
          WHEN f.id_factura IS NULL                                THEN NULL
          WHEN COALESCE(SUM(pg.monto), 0) = 0                     THEN 'Pendiente'
          WHEN f.monto - COALESCE(SUM(pg.monto), 0) <= 0          THEN 'Pagada'
          ELSE 'Parcial'
        END                                                                 AS estado_factura
      FROM   Solicitud_Servicio ss
      JOIN   Servicio           sv ON sv.id_servicio  = ss.id_servicio
      JOIN   Paso_Actividad     pa ON pa.id_solicitud = ss.id_solicitud
      JOIN   Reserva            r  ON r.id_solicitud  = ss.id_solicitud
      JOIN   Espacio_Fisico     ef ON ef.id_sede           = r.id_sede
                                 AND ef.nombre_edificacion = r.nombre_edificacion
                                 AND ef.numero_espacio     = r.numero_espacio
      LEFT   JOIN Folio_Consumo fc ON fc.id_solicitud = ss.id_solicitud
      LEFT   JOIN Factura       f  ON f.id_folio      = fc.id_folio
      LEFT   JOIN Pago          pg ON pg.id_factura   = f.id_factura
      WHERE  ss.cedula = $1
        AND  ss.id_solicitud LIKE 'SOL-INFRA-%'
      GROUP  BY ss.id_solicitud, ss.estado, ss.fecha_apertura,
                sv.descripcion, sv.id_servicio,
                r.nombre_edificacion, r.numero_espacio,
                r.fecha_uso, r.bloque_horario,
                ef.tipo_espacio, ef.capacidad_max,
                f.id_factura, f.monto
      ORDER  BY ss.fecha_apertura DESC
    `, [req.cedula]);

    res.json({ reservas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/infraestructura/reservas/:idSolicitud/pasos
router.get('/reservas/:idSolicitud/pasos', async (req, res) => {
  const { idSolicitud } = req.params;
  try {
    const { rows: own } = await pool.query(
      `SELECT cedula FROM Solicitud_Servicio WHERE id_solicitud = $1`,
      [idSolicitud]
    );
    if (!own.length)
      return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (own[0].cedula !== req.cedula) {
      const { rows: adminCheck } = await pool.query(`
        SELECT pa.cedula FROM Personal_Administrativo pa
        JOIN   Periodo_Vinculacion pv ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
        WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
      `, [req.cedula]);
      if (!adminCheck.length)
        return res.status(403).json({ error: 'Sin acceso a esta solicitud' });
    }

    const { rows: pasos } = await pool.query(`
      SELECT id_paso, responsable, fecha_inicio, fecha_completada, estado_paso
      FROM   Paso_Actividad
      WHERE  id_solicitud = $1
      ORDER  BY fecha_inicio ASC
    `, [idSolicitud]);

    const { rows: acompanantes } = await pool.query(`
      SELECT documento, nombre FROM Acompanante
      WHERE  id_solicitud = $1
    `, [idSolicitud]);

    res.json({ pasos, acompanantes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/infraestructura/reservas/:idSolicitud
router.delete('/reservas/:idSolicitud', async (req, res) => {
  const { idSolicitud } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT ss.cedula, ss.estado,
             r.id_sede, r.nombre_edificacion, r.numero_espacio
      FROM   Solicitud_Servicio ss
      JOIN   Reserva r ON r.id_solicitud = ss.id_solicitud
      WHERE  ss.id_solicitud = $1
    `, [idSolicitud]);

    if (!rows.length)
      return res.status(404).json({ error: 'Reserva no encontrada' });
    if (rows[0].cedula !== req.cedula)
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta reserva' });
    if (rows[0].estado === 'Completada')
      return res.status(400).json({ error: 'No se puede cancelar una solicitud ya completada' });

    const { id_sede, nombre_edificacion, numero_espacio } = rows[0];

    await pool.query(
      `UPDATE Solicitud_Servicio SET estado = 'Cancelada' WHERE id_solicitud = $1`,
      [idSolicitud]
    );

    // Free space only if no other active reservations exist for it
    const { rows: otras } = await pool.query(`
      SELECT 1 FROM Reserva r
      JOIN   Solicitud_Servicio ss ON ss.id_solicitud = r.id_solicitud
      WHERE  r.id_sede = $1 AND r.nombre_edificacion = $2
        AND  r.numero_espacio = $3
        AND  ss.estado NOT IN ('Cancelada', 'Completada')
        AND  r.id_solicitud <> $4
    `, [id_sede, nombre_edificacion, numero_espacio, idSolicitud]);

    if (otras.length === 0) {
      await pool.query(`
        UPDATE Espacio_Fisico SET disponibilidad = 'Disponible'
        WHERE  id_sede = $1 AND nombre_edificacion = $2 AND numero_espacio = $3
      `, [id_sede, nombre_edificacion, numero_espacio]);
    }

    res.json({ message: 'Reserva cancelada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
