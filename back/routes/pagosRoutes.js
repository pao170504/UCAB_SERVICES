const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

async function esAdmin(cedula) {
  const { rows } = await pool.query(`
    SELECT 1 FROM Personal_Administrativo pa
    JOIN   Periodo_Vinculacion pv ON pv.cedula = pa.cedula AND pv.fecha_inicio = pa.fecha_inicio
    WHERE  pa.cedula = $1 AND pv.fecha_fin IS NULL LIMIT 1
  `, [cedula]);
  return rows.length > 0;
}

/* ── GET /api/pagos/tasas ─────────────────────────────────────────────────── */
router.get('/tasas', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT fecha_tasa, usd, eur FROM Tasa ORDER BY fecha_tasa DESC LIMIT 10`
    );
    res.json({ tasas: rows, ultima: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/tasas ────────────────────────────────────────────────── */
router.post('/tasas', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede registrar tasas' });

  const { fecha_tasa, usd, eur } = req.body;
  if (!fecha_tasa || !usd || !eur)
    return res.status(400).json({ error: 'Faltan campos requeridos: fecha_tasa, usd, eur' });
  if (usd <= 0 || eur <= 0)
    return res.status(400).json({ error: 'Las tasas deben ser mayores a 0' });

  try {
    await pool.query(`
      INSERT INTO Tasa (fecha_tasa, usd, eur) VALUES ($1, $2, $3)
      ON CONFLICT (fecha_tasa) DO UPDATE SET usd = EXCLUDED.usd, eur = EXCLUDED.eur
    `, [fecha_tasa, usd, eur]);
    res.status(201).json({ message: 'Tasa registrada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/pagos/terceros ──────────────────────────────────────────────── */
router.get('/terceros', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT rif, razon_social FROM Tercero_Corporativo ORDER BY razon_social`
    );
    res.json({ terceros: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/terceros ─────────────────────────────────────────────── */
router.post('/terceros', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede registrar terceros' });

  const { rif, razon_social } = req.body;
  if (!rif || !razon_social)
    return res.status(400).json({ error: 'Faltan campos: rif, razon_social' });

  try {
    await pool.query(
      `INSERT INTO Tercero_Corporativo (rif, razon_social) VALUES ($1, $2)`,
      [rif, razon_social]
    );
    res.status(201).json({ message: 'Tercero registrado exitosamente' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El RIF ya existe' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── DELETE /api/pagos/terceros/:rif ──────────────────────────────────────── */
router.delete('/terceros/:rif', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede eliminar terceros' });

  const { rif } = req.params;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Tercero_Corporativo WHERE rif = $1`, [rif]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Tercero no encontrado' });
    res.json({ message: 'Tercero eliminado exitosamente' });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'No se puede eliminar: tiene facturas vinculadas' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/pagos/folios ────────────────────────────────────────────────── */
router.get('/folios', async (req, res) => {
  const admin = await esAdmin(req.cedula);
  try {
    const whereClause = admin ? '' : 'WHERE ss.cedula = $1';
    const params      = admin ? [] : [req.cedula];

    const { rows } = await pool.query(`
      SELECT
        fc.id_folio, fc.estado AS estado_folio,
        ss.id_solicitud, ss.cedula,
        p.primer_nombre || ' ' || p.primer_apellido AS nombre_miembro,
        s.descripcion AS nombre_servicio,
        COUNT(ic.numero)                                                       AS num_items,
        COALESCE(SUM(ic.precio * ic.cantidad * (1 + ic.impuesto)), 0)          AS total_items,
        EXISTS (SELECT 1 FROM Factura f2 WHERE f2.id_folio = fc.id_folio)      AS tiene_factura
      FROM Folio_Consumo fc
      JOIN Solicitud_Servicio ss ON ss.id_solicitud = fc.id_solicitud
      JOIN Servicio s            ON s.id_servicio   = ss.id_servicio
      JOIN Persona p             ON p.cedula         = ss.cedula
      LEFT JOIN Item_Consumo ic  ON ic.id_folio      = fc.id_folio
      ${whereClause}
      GROUP BY fc.id_folio, fc.estado, ss.id_solicitud, ss.cedula,
               p.primer_nombre, p.primer_apellido, s.descripcion
      ORDER BY fc.id_folio DESC
    `, params);
    res.json({ folios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/folios ───────────────────────────────────────────────── */
router.post('/folios', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede crear folios' });

  const { id_solicitud } = req.body;
  if (!id_solicitud)
    return res.status(400).json({ error: 'La solicitud es requerida' });

  try {
    const { rows: solRows } = await pool.query(
      `SELECT id_solicitud FROM Solicitud_Servicio WHERE id_solicitud = $1`, [id_solicitud]
    );
    if (solRows.length === 0)
      return res.status(404).json({ error: 'Solicitud no encontrada' });

    const idFolio = `FOL-${Date.now()}`;
    await pool.query(
      `INSERT INTO Folio_Consumo (id_folio, estado, id_solicitud) VALUES ($1, 'Abierto', $2)`,
      [idFolio, id_solicitud]
    );
    res.status(201).json({ message: 'Folio creado exitosamente', id_folio: idFolio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/pagos/folios/:id/items ──────────────────────────────────────── */
router.get('/folios/:id/items', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        numero, concepto, cantidad, precio, impuesto,
        precio * cantidad                    AS subtotal,
        precio * cantidad * (1 + impuesto)   AS total_item
      FROM Item_Consumo
      WHERE id_folio = $1
      ORDER BY numero
    `, [id]);
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/folios/:id/items ─────────────────────────────────────── */
router.post('/folios/:id/items', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede agregar ítems' });

  const { id } = req.params;
  const { concepto, cantidad, precio, impuesto = 0 } = req.body;
  if (!concepto || !cantidad || precio === undefined || precio === null)
    return res.status(400).json({ error: 'Faltan campos: concepto, cantidad, precio' });
  if (cantidad <= 0 || precio < 0)
    return res.status(400).json({ error: 'Cantidad debe ser > 0 y precio >= 0' });

  try {
    const { rows: folioRows } = await pool.query(
      `SELECT estado FROM Folio_Consumo WHERE id_folio = $1`, [id]
    );
    if (folioRows.length === 0) return res.status(404).json({ error: 'Folio no encontrado' });
    if (folioRows[0].estado !== 'Abierto') return res.status(400).json({ error: 'El folio está cerrado' });

    const { rows: numRows } = await pool.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next_num FROM Item_Consumo WHERE id_folio = $1`, [id]
    );
    const numero = numRows[0].next_num;

    await pool.query(`
      INSERT INTO Item_Consumo (id_folio, numero, concepto, cantidad, precio, impuesto)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, numero, concepto, cantidad, precio, impuesto]);

    res.status(201).json({ message: 'Ítem agregado exitosamente', numero });
  } catch (err) {
    if (err.code === 'P0001') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── DELETE /api/pagos/folios/:id/items/:num ──────────────────────────────── */
router.delete('/folios/:id/items/:num', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede eliminar ítems' });

  const { id, num } = req.params;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM Item_Consumo WHERE id_folio = $1 AND numero = $2`, [id, parseInt(num)]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Ítem no encontrado' });
    res.json({ message: 'Ítem eliminado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/folios/:id/factura — close folio & generate invoice ──── */
router.post('/folios/:id/factura', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede generar facturas' });

  const { id } = req.params;
  const { rif } = req.body;

  try {
    const { rows: folioRows } = await pool.query(
      `SELECT estado FROM Folio_Consumo WHERE id_folio = $1`, [id]
    );
    if (folioRows.length === 0) return res.status(404).json({ error: 'Folio no encontrado' });
    if (folioRows[0].estado !== 'Abierto') return res.status(400).json({ error: 'El folio ya fue cerrado' });

    const { rows: totalRows } = await pool.query(
      `SELECT COALESCE(SUM(precio * cantidad * (1 + impuesto)), 0) AS monto FROM Item_Consumo WHERE id_folio = $1`,
      [id]
    );
    const monto = parseFloat(totalRows[0].monto);
    if (monto <= 0) return res.status(400).json({ error: 'El folio no tiene ítems con monto válido' });

    if (rif) {
      const { rows: terceroRows } = await pool.query(
        `SELECT rif FROM Tercero_Corporativo WHERE rif = $1`, [rif]
      );
      if (terceroRows.length === 0) return res.status(404).json({ error: 'Tercero corporativo no encontrado' });
    }

    const idFactura = `FAC-${Date.now()}`;
    await pool.query(`
      INSERT INTO Factura (id_factura, emisión, monto, id_folio, rif)
      VALUES ($1, CURRENT_DATE, $2, $3, $4)
    `, [idFactura, monto, id, rif || null]);
    // trg_cerrar_folio cierra el folio automáticamente tras este INSERT

    res.status(201).json({ message: 'Factura generada exitosamente', id_factura: idFactura, monto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/pagos/facturas ──────────────────────────────────────────────── */
router.get('/facturas', async (req, res) => {
  const admin = await esAdmin(req.cedula);
  const whereClause = admin ? '' : 'WHERE ss.cedula = $1';
  const params      = admin ? [] : [req.cedula];

  try {
    const { rows } = await pool.query(`
      SELECT
        f.id_factura,
        f.emisión               AS emision,
        f.monto                 AS total,
        f.monto - f.saldo       AS pagado,
        f.saldo,
        f.estado                AS estado_pago,
        fc.id_folio,
        ss.id_solicitud,
        ss.cedula,
        p_info.primer_nombre || ' ' || p_info.primer_apellido AS nombre_miembro,
        s.descripcion           AS nombre_servicio,
        tc.razon_social         AS tercero
      FROM Factura f
      JOIN Folio_Consumo           fc       ON fc.id_folio      = f.id_folio
      JOIN Solicitud_Servicio      ss       ON ss.id_solicitud  = fc.id_solicitud
      JOIN Servicio                s        ON s.id_servicio    = ss.id_servicio
      JOIN Persona                 p_info   ON p_info.cedula    = ss.cedula
      LEFT JOIN Tercero_Corporativo tc      ON tc.rif           = f.rif
      ${whereClause}
      ORDER BY f.emisión DESC
    `, params);
    res.json({ facturas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/pagos/facturas/:id ──────────────────────────────────────────── */
router.get('/facturas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: facRows } = await pool.query(`
      SELECT
        f.id_factura, f.emisión AS emision, f.monto AS total,
        f.monto - f.saldo       AS pagado,
        f.saldo,
        f.estado                AS estado_pago,
        fc.id_folio, fc.estado  AS estado_folio,
        ss.id_solicitud, ss.cedula,
        p_info.primer_nombre || ' ' || p_info.primer_apellido AS nombre_miembro,
        s.descripcion AS nombre_servicio,
        tc.razon_social AS tercero
      FROM Factura f
      JOIN Folio_Consumo           fc       ON fc.id_folio     = f.id_folio
      JOIN Solicitud_Servicio      ss       ON ss.id_solicitud = fc.id_solicitud
      JOIN Servicio                s        ON s.id_servicio   = ss.id_servicio
      JOIN Persona                 p_info   ON p_info.cedula   = ss.cedula
      LEFT JOIN Tercero_Corporativo tc      ON tc.rif          = f.rif
      WHERE f.id_factura = $1
    `, [id]);

    if (facRows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    const factura = facRows[0];
    const admin   = await esAdmin(req.cedula);
    if (!admin && factura.cedula !== req.cedula)
      return res.status(403).json({ error: 'Acceso denegado' });

    const { rows: items } = await pool.query(`
      SELECT numero, concepto, cantidad, precio, impuesto,
             precio * cantidad                  AS subtotal,
             precio * cantidad * (1 + impuesto) AS total_item
      FROM Item_Consumo WHERE id_folio = $1 ORDER BY numero
    `, [factura.id_folio]);

    const { rows: pagos } = await pool.query(`
      SELECT
        pg.id_pago, pg.monto, pg.fecha_pago,
        t.usd AS tasa_usd,
        CASE
          WHEN tai.id_pago IS NOT NULL THEN 'tai'
          WHEN ef.id_pago  IS NOT NULL THEN 'efectivo'
          WHEN pm.id_pago  IS NOT NULL THEN 'movil'
          WHEN tar.id_pago IS NOT NULL THEN 'tarjeta'
          WHEN cr.id_pago  IS NOT NULL THEN 'cripto'
          WHEN ze.id_pago  IS NOT NULL THEN 'zelle'
          ELSE 'desconocido'
        END AS metodo
      FROM Pago pg
      LEFT JOIN Tasa        t   ON t.fecha_tasa  = pg.fecha_tasa
      LEFT JOIN TAI         tai ON tai.id_pago   = pg.id_pago
      LEFT JOIN Efectivo    ef  ON ef.id_pago    = pg.id_pago
      LEFT JOIN Pago_Movil  pm  ON pm.id_pago    = pg.id_pago
      LEFT JOIN Tarjeta     tar ON tar.id_pago   = pg.id_pago
      LEFT JOIN Cripto      cr  ON cr.id_pago    = pg.id_pago
      LEFT JOIN Zelle       ze  ON ze.id_pago    = pg.id_pago
      WHERE pg.id_factura = $1
      ORDER BY pg.fecha_pago DESC
    `, [id]);

    res.json({ factura, items, pagos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/facturas/:id/pagar ───────────────────────────────────── */
router.post('/facturas/:id/pagar', async (req, res) => {
  const { id } = req.params;
  const { monto, metodo, datos = {} } = req.body;

  if (!monto || parseFloat(monto) <= 0)
    return res.status(400).json({ error: 'Monto inválido' });
  if (!metodo)
    return res.status(400).json({ error: 'Método de pago requerido' });

  try {
    const admin = await esAdmin(req.cedula);

    const { rows: facRows } = await pool.query(`
      SELECT f.id_factura, f.monto, f.saldo, ss.cedula
      FROM Factura f
      JOIN Folio_Consumo      fc ON fc.id_folio     = f.id_folio
      JOIN Solicitud_Servicio ss ON ss.id_solicitud = fc.id_solicitud
      WHERE f.id_factura = $1
    `, [id]);

    if (facRows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    const fac = facRows[0];
    if (!admin && fac.cedula !== req.cedula)
      return res.status(403).json({ error: 'Acceso denegado' });

    const saldo = parseFloat(fac.saldo);
    if (saldo <= 0.001) return res.status(400).json({ error: 'La factura ya está totalmente pagada' });

    const montoNum = parseFloat(monto);
    if (montoNum > saldo + 0.001)
      return res.status(400).json({ error: `El monto excede el saldo: $${saldo.toFixed(2)}` });

    const { rows: tasaRows } = await pool.query(
      `SELECT fecha_tasa FROM Tasa ORDER BY fecha_tasa DESC LIMIT 1`
    );
    const fechaTasa = tasaRows.length > 0 ? tasaRows[0].fecha_tasa : null;

    const idPago = `PAG-${Date.now()}`;
    await pool.query(`
      INSERT INTO Pago (id_pago, monto, fecha_pago, id_factura, fecha_tasa)
      VALUES ($1, $2, CURRENT_DATE, $3, $4)
    `, [idPago, montoNum, id, fechaTasa]);

    switch (metodo) {
      case 'tai':
        if (!datos.uuid || !datos.pos)
          return res.status(400).json({ error: 'Datos TAI incompletos: uuid, pos' });
        await pool.query(`INSERT INTO TAI (id_pago, uuid, pos) VALUES ($1, $2, $3)`,
          [idPago, datos.uuid, datos.pos]);
        break;

      case 'efectivo':
        if (!datos.moneda || !datos.monto_recibido)
          return res.status(400).json({ error: 'Datos de efectivo incompletos: moneda, monto_recibido' });
        await pool.query(`INSERT INTO Efectivo (id_pago, moneda, monto) VALUES ($1, $2, $3)`,
          [idPago, datos.moneda, datos.monto_recibido]);
        break;

      case 'movil':
        if (!datos.telefono || !datos.banco || !datos.referencia)
          return res.status(400).json({ error: 'Datos de pago móvil incompletos: telefono, banco, referencia' });
        await pool.query(`INSERT INTO Pago_Movil (id_pago, telefono, banco, referencia) VALUES ($1, $2, $3, $4)`,
          [idPago, datos.telefono, datos.banco, datos.referencia]);
        break;

      case 'tarjeta':
        if (!datos.numero || !datos.tipo_red || !datos.emisora)
          return res.status(400).json({ error: 'Datos de tarjeta incompletos: numero, tipo_red, emisora' });
        await pool.query(`INSERT INTO Tarjeta (id_pago, número, tipo_red, emisora) VALUES ($1, $2, $3, $4)`,
          [idPago, datos.numero, datos.tipo_red, datos.emisora]);
        break;

      case 'cripto':
        if (!datos.txid || !datos.billetera || !datos.red)
          return res.status(400).json({ error: 'Datos de cripto incompletos: txid, billetera, red' });
        await pool.query(`INSERT INTO Cripto (id_pago, txid, billetera, red) VALUES ($1, $2, $3, $4)`,
          [idPago, datos.txid, datos.billetera, datos.red]);
        break;

      case 'zelle':
        if (!datos.nombre_titular || !datos.correo || !datos.confirmacion)
          return res.status(400).json({ error: 'Datos de Zelle incompletos: nombre_titular, correo, confirmacion' });
        await pool.query(`INSERT INTO Zelle (id_pago, nombre_titular, correo, confirmación) VALUES ($1, $2, $3, $4)`,
          [idPago, datos.nombre_titular, datos.correo, datos.confirmacion]);
        break;

      default:
        await pool.query(`DELETE FROM Pago WHERE id_pago = $1`, [idPago]);
        return res.status(400).json({ error: 'Método de pago no reconocido: ' + metodo });
    }

    const { rows: updRows } = await pool.query(
      `SELECT saldo, estado FROM Factura WHERE id_factura = $1`, [id]
    );
    const nuevoSaldo  = parseFloat(updRows[0].saldo);
    const nuevoEstado = updRows[0].estado;

    res.json({
      message:  'Pago registrado exitosamente',
      id_pago:  idPago,
      pagado:   parseFloat(fac.monto) - nuevoSaldo,
      saldo:    nuevoSaldo,
      is_paid:  nuevoEstado === 'Pagada',
      estado:   nuevoEstado
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── GET /api/pagos/solicitudes — list open solicitudes for folio creation ── */
router.get('/solicitudes', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Acceso solo para personal administrativo' });

  try {
    const { rows } = await pool.query(`
      SELECT
        ss.id_solicitud,
        ss.estado,
        ss.fecha_apertura,
        p_info.primer_nombre || ' ' || p_info.primer_apellido AS nombre_miembro,
        s.descripcion AS nombre_servicio
      FROM Solicitud_Servicio ss
      JOIN Servicio s          ON s.id_servicio = ss.id_servicio
      JOIN Persona  p_info     ON p_info.cedula  = ss.cedula
      ORDER BY ss.fecha_apertura DESC
    `);
    res.json({ solicitudes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/pagos/admin/cierre-masivo ─────────────────────────────────────── */
router.post('/admin/cierre-masivo', async (req, res) => {
  if (!(await esAdmin(req.cedula)))
    return res.status(403).json({ error: 'Solo el personal administrativo puede ejecutar el cierre masivo' });
  try {
    const { rows: antes } = await pool.query(`
      SELECT COUNT(*)::INT AS count FROM Folio_Consumo fc
      WHERE fc.estado = 'Abierto'
        AND EXISTS     (SELECT 1 FROM Item_Consumo ic WHERE ic.id_folio = fc.id_folio)
        AND NOT EXISTS (SELECT 1 FROM Factura f      WHERE f.id_folio  = fc.id_folio)
    `);
    const foliosPendientes = antes[0].count;

    await pool.query('CALL proc_cierre_masivo_folios()');

    res.json({
      message:           'Cierre masivo ejecutado exitosamente',
      folios_procesados: foliosPendientes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
