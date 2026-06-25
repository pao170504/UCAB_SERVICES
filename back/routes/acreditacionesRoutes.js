const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/* GET /api/acreditaciones — catálogo público (todos los autenticados) */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id_acreditacion, tipo, descripcion FROM Acreditacion ORDER BY tipo, descripcion'
    );
    res.json({ acreditaciones: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* GET /api/acreditaciones/mis-acreditaciones */
router.get('/mis-acreditaciones', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id_acreditacion,
        a.tipo,
        a.descripcion,
        c.obtencion,
        c.fecha_vencimiento,
        c.estado
      FROM   Cumple       c
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

/* POST /api/acreditaciones/mis-acreditaciones */
router.post('/mis-acreditaciones', async (req, res) => {
  const { id_acreditacion, obtencion, fecha_vencimiento, estado } = req.body;
  if (!id_acreditacion || !obtencion)
    return res.status(400).json({ error: 'Faltan campos: id_acreditacion, obtencion' });

  try {
    await pool.query(`
      INSERT INTO Cumple (cedula, id_acreditacion, obtencion, fecha_vencimiento, estado)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.cedula, id_acreditacion, obtencion, fecha_vencimiento || null, estado || 'Vigente']);
    res.status(201).json({ message: 'Acreditación registrada' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Ya tienes esta acreditación registrada' });
    if (err.code === '23503')
      return res.status(400).json({ error: 'Acreditación no existe en el catálogo' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* PUT /api/acreditaciones/mis-acreditaciones/:idAcred — actualizar estado/vencimiento */
router.put('/mis-acreditaciones/:idAcred', async (req, res) => {
  const { estado, fecha_vencimiento } = req.body;
  try {
    await pool.query(`
      UPDATE Cumple
      SET estado           = COALESCE($1, estado),
          fecha_vencimiento = COALESCE($2::date, fecha_vencimiento)
      WHERE cedula = $3 AND id_acreditacion = $4
    `, [estado || null, fecha_vencimiento || null, req.cedula, req.params.idAcred]);
    res.json({ message: 'Acreditación actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* DELETE /api/acreditaciones/mis-acreditaciones/:idAcred */
router.delete('/mis-acreditaciones/:idAcred', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM Cumple WHERE cedula = $1 AND id_acreditacion = $2',
      [req.cedula, req.params.idAcred]
    );
    res.json({ message: 'Acreditación eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;