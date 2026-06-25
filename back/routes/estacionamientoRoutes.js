const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

function validarPlaca(placa) {
  return /^[A-Za-z]{2,3}-?\d{2,3}[A-Za-z]?$/.test((placa || '').trim());
}

// GET /api/estacionamiento/zonas
router.get('/zonas', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        z.id_zona,
        z.nombre,
        z.capacidad,
        COUNT(p.numero_puesto)                                            AS total_puestos,
        COUNT(p.numero_puesto) FILTER (WHERE p.estado = 'Libre')         AS libres,
        COUNT(p.numero_puesto) FILTER (WHERE p.estado = 'Ocupado')       AS ocupados,
        COUNT(p.numero_puesto) FILTER (WHERE p.estado = 'Reservado')     AS reservados,
        COUNT(p.numero_puesto) FILTER (WHERE p.estado = 'Mantenimiento') AS en_mantenimiento
      FROM  Zona_Estacionamiento z
      LEFT  JOIN Puesto p ON p.id_zona = z.id_zona
      WHERE z.id_sede = 1
      GROUP BY z.id_zona, z.nombre, z.capacidad
      ORDER BY z.nombre
    `);
    res.json({ zonas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/estacionamiento/zonas/:idZona/puestos
router.get('/zonas/:idZona/puestos', async (req, res) => {
  const { idZona }           = req.params;
  const { vehiculo, estado } = req.query;

  try {
    let query  = `
      SELECT numero_puesto, tipo_vehiculo, estado
      FROM   Puesto
      WHERE  id_zona = $1
    `;
    const params = [idZona];

    if (vehiculo && vehiculo !== 'todos') {
      params.push(vehiculo);
      query += ` AND tipo_vehiculo = $${params.length}`;
    }
    if (estado && estado !== 'todos') {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }
    query += ' ORDER BY numero_puesto';

    const { rows } = await pool.query(query, params);
    res.json({ puestos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PATCH /api/estacionamiento/puestos/:idZona/:numero
router.patch('/puestos/:idZona/:numero', async (req, res) => {
  const { idZona, numero } = req.params;
  const { estado }         = req.body;

  const estadosValidos = ['Libre', 'Ocupado', 'Reservado', 'Mantenimiento'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: 'Estado no válido' });

  try {
    if (estado === 'Mantenimiento') {
      const { rows: rolRows } = await pool.query(`
        SELECT pa.cedula FROM Personal_Administrativo pa
        JOIN   Periodo_Vinculacion pv
          ON   pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
        WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL
      `, [req.cedula]);
      if (rolRows.length === 0)
        return res.status(403).json({
          error: 'Solo el personal administrativo puede poner un puesto en mantenimiento'
        });
    }

    if (estado === 'Reservado') {
      const { rows: puestoRows } = await pool.query(
        `SELECT tipo_vehiculo FROM Puesto
         WHERE id_zona = $1 AND numero_puesto = $2`,
        [idZona, numero]
      );
      if (puestoRows.length === 0)
        return res.status(404).json({ error: 'Puesto no encontrado' });

      if (puestoRows[0].tipo_vehiculo === 'Preferencial') {
        const { rows: cuentaRows } = await pool.query(
          `SELECT estado_de_cuenta FROM Miembro_Comunidad WHERE cedula = $1`,
          [req.cedula]
        );
        const cuenta = cuentaRows[0]?.estado_de_cuenta;
        if (cuenta === 'Suspendida' || cuenta === 'Bloqueada')
          return res.status(403).json({
            error: 'Tu cuenta no puede reservar puestos preferenciales'
          });
      }
    }

    const { rowCount } = await pool.query(
      `UPDATE Puesto SET estado = $1
       WHERE  id_zona = $2 AND numero_puesto = $3`,
      [estado, idZona, numero]
    );

    if (rowCount === 0)
      return res.status(404).json({ error: 'Puesto no encontrado' });

    res.json({ message: `Puesto actualizado a ${estado}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/estacionamiento/entrada
// Toda la secuencia (solicitud, paso, folio, item, acceso, puesto) va dentro de
// una transacción: si cualquier paso falla, se hace ROLLBACK y no quedan filas
// huérfanas (antes cada INSERT se ejecutaba suelto y un fallo dejaba basura).
router.post('/entrada', async (req, res) => {
  const { idZona, numeroPuesto, placa } = req.body;

  if (!idZona || !numeroPuesto || !placa)
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  if (!validarPlaca(placa))
    return res.status(400).json({ error: 'Formato de placa inválido. Ejemplo: ABC-123' });

  const client = await pool.connect();
  try {
    const { rows: pRows } = await client.query(
      `SELECT estado FROM Puesto WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );
    if (!pRows.length) {
      client.release();
      return res.status(404).json({ error: 'Puesto no encontrado' });
    }
    if (pRows[0].estado !== 'Reservado') {
      client.release();
      return res.status(400).json({
        error: 'Solo se puede registrar entrada en puestos Reservados'
      });
    }

    await client.query('BEGIN');

    const ts = Date.now();

    const idSolicitud = `SOL-EST-${ts}`;
    await client.query(`
      INSERT INTO Solicitud_Servicio
        (id_solicitud, resolucion, estado, fecha_apertura, cedula, id_servicio)
      VALUES ($1, NULL, 'En Proceso', CURRENT_DATE, $2, 'SERV-ESTAC')
    `, [idSolicitud, req.cedula]);

    const idPaso = `PASO-EST-${ts}`;
    await client.query(`
      INSERT INTO Paso_Actividad
        (id_paso, fecha_inicio, responsable, fecha_completada, estado_paso, id_solicitud)
      VALUES ($1, CURRENT_TIMESTAMP, 'Sistema de Estacionamiento', NULL, 'En proceso', $2)
    `, [idPaso, idSolicitud]);

    const idFolio = `FOL-EST-${ts}`;
    await client.query(`
      INSERT INTO Folio_Consumo (id_folio, estado, id_solicitud)
      VALUES ($1, 'Abierto', $2)
    `, [idFolio, idSolicitud]);

    const zona = idZona.replace('ZONA-', '');
    await client.query(`
      INSERT INTO Item_Consumo (id_folio, numero, impuesto, cantidad, concepto, precio)
      VALUES ($1, 1, 0, 1, $2, 0)
    `, [idFolio, `Estacionamiento zona ${zona} puesto ${numeroPuesto}`]);

    const idAcceso = `ACC-${ts}`;
    await client.query(`
      INSERT INTO Registro_Acceso
        (id_acceso, id_zona, numero_puesto, placa,
         fecha_entrada, fecha_salida, estatus, id_folio, numero)
      VALUES ($1, $2, $3, $4,
        CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas',
        NULL, 'Activo', $5, 1)
    `, [idAcceso, idZona, numeroPuesto, placa.toUpperCase(), idFolio]);

    await client.query(
      `UPDATE Puesto SET estado = 'Ocupado'
       WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );

    await client.query('COMMIT');
    res.json({ message: 'Entrada registrada — puesto Ocupado', idAcceso, idFolio });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error en /entrada:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  } finally {
    client.release();
  }
});

// POST /api/estacionamiento/salida
router.post('/salida', async (req, res) => {
  const { idZona, numeroPuesto } = req.body;

  const client = await pool.connect();
  try {
    const { rows: accRows } = await client.query(`
      SELECT ra.id_acceso, ra.fecha_entrada, ra.id_folio, ra.placa,
             fc.id_solicitud
      FROM   Registro_Acceso ra
      JOIN   Folio_Consumo   fc ON fc.id_folio = ra.id_folio
      WHERE  ra.id_zona = $1 AND ra.numero_puesto = $2 AND ra.estatus = 'Activo'
      LIMIT  1
    `, [idZona, numeroPuesto]);

    if (!accRows.length) {
      client.release();
      return res.status(404).json({ error: 'No hay acceso activo en este puesto' });
    }

    const acc = accRows[0];

    const diffHoras    = Math.max(1, (Date.now() - new Date(acc.fecha_entrada).getTime()) / 3600000);
    const horas        = parseFloat(diffHoras.toFixed(2));
    const precioFinal  = parseFloat((horas * 2.50).toFixed(2));
    const iva          = parseFloat((precioFinal * 0.16).toFixed(2));
    const montoTotal   = parseFloat((precioFinal + iva).toFixed(2));

    await client.query('BEGIN');

    if (acc.id_folio) {
      await client.query(`
        UPDATE Item_Consumo
        SET    precio = $1, impuesto = $2, cantidad = $3
        WHERE  id_folio = $4 AND numero = 1
      `, [precioFinal, iva, horas, acc.id_folio]);

      await client.query(
        `UPDATE Folio_Consumo SET estado = 'Cerrado' WHERE id_folio = $1`,
        [acc.id_folio]
      );

      const idFactura = `FAC-EST-${Date.now()}`;
      await client.query(`
        INSERT INTO Factura (id_factura, emisión, monto, id_folio, rif)
        VALUES ($1, CURRENT_DATE, $2, $3, NULL)
      `, [idFactura, montoTotal, acc.id_folio]);
    }

    await client.query(`
      UPDATE Registro_Acceso
      SET    fecha_salida = CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas',
             estatus = 'Finalizado'
      WHERE  id_acceso = $1
    `, [acc.id_acceso]);

    await client.query(`
      UPDATE Paso_Actividad
      SET    estado_paso = 'Completado'
      WHERE  id_solicitud = $1
    `, [acc.id_solicitud]);

    await client.query(`
      UPDATE Solicitud_Servicio
      SET    estado = 'Completada',
             resolucion = 'Servicio de estacionamiento completado'
      WHERE  id_solicitud = $1
    `, [acc.id_solicitud]);

    await client.query(
      `UPDATE Puesto SET estado = 'Libre'
       WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );

    await client.query('COMMIT');

    res.json({
      message:    'Salida registrada — puesto Libre',
      horas,
      precioFinal,
      iva,
      montoTotal,
      aviso: acc.id_folio
        ? `Factura generada por $${montoTotal.toFixed(2)}. Puedes pagarla desde Pagos.`
        : `Tiempo: ${horas} hrs`
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error en /salida:', err);
    res.status(500).json({ error: err.message || 'Error interno' });
  } finally {
    client.release();
  }
});

// GET /api/estacionamiento/registro/:idZona/:numero
router.get('/registro/:idZona/:numero', async (req, res) => {
  const { idZona, numero } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        id_acceso,
        placa,
        fecha_entrada AT TIME ZONE 'America/Caracas' AS fecha_entrada,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_entrada)) / 3600
          AS horas_transcurridas
      FROM   Registro_Acceso
      WHERE  id_zona = $1 AND numero_puesto = $2 AND estatus = 'Activo'
      LIMIT  1
    `, [idZona, numero]);

    res.json({ registro: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
