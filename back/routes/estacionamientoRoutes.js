const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

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
router.post('/entrada', async (req, res) => {
  const { idZona, numeroPuesto, placa } = req.body;

  if (!idZona || !numeroPuesto || !placa)
    return res.status(400).json({ error: 'Faltan datos requeridos' });

  try {
    const { rows } = await pool.query(
      `SELECT estado FROM Puesto WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Puesto no encontrado' });
    if (rows[0].estado !== 'Reservado')
      return res.status(400).json({
        error: 'Solo se puede registrar entrada en puestos Reservados'
      });

    const idAcceso = `ACC-${Date.now()}`;

    await pool.query(`
      INSERT INTO Registro_Acceso
        (id_acceso, id_zona, numero_puesto, placa, fecha_entrada, fecha_salida, estatus)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'America/Caracas', NULL, 'Activo')
    `, [idAcceso, idZona, numeroPuesto, placa.toUpperCase()]);

    await pool.query(
      `UPDATE Puesto SET estado = 'Ocupado'
       WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );

    res.json({ message: 'Entrada registrada — puesto ahora Ocupado', idAcceso });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/estacionamiento/salida
router.post('/salida', async (req, res) => {
  const { idZona, numeroPuesto } = req.body;

  try {
    const { rows: puestoRows } = await pool.query(
      `SELECT estado FROM Puesto WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );
    if (puestoRows.length === 0)
      return res.status(404).json({ error: 'Puesto no encontrado' });
    if (puestoRows[0].estado !== 'Ocupado')
      return res.status(400).json({
        error: 'Solo se puede registrar salida en puestos Ocupados'
      });

    await pool.query(`
      UPDATE Registro_Acceso
      SET    fecha_salida = CURRENT_TIMESTAMP, estatus = 'Finalizado'
      WHERE  id_zona = $1 AND numero_puesto = $2 AND estatus = 'Activo'
    `, [idZona, numeroPuesto]);

    await pool.query(
      `UPDATE Puesto SET estado = 'Libre'
       WHERE id_zona = $1 AND numero_puesto = $2`,
      [idZona, numeroPuesto]
    );

    res.json({ message: 'Salida registrada — puesto ahora Libre' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
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
