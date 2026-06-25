const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

async function verificarElegible(cedula) {
  const { rows } = await pool.query(`
    SELECT 1 FROM Profesor WHERE cedula = $1
    UNION
    SELECT 1 FROM Personal_Administrativo WHERE cedula = $1
    LIMIT 1
  `, [cedula]);
  return rows.length > 0;
}

/* GET /api/beneficiarios */
router.get('/', async (req, res) => {
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible)
      return res.status(403).json({ error: 'Solo profesores y personal administrativo pueden gestionar beneficiarios' });

    const { rows } = await pool.query(`
      SELECT
        b.cedula,
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido,
        p.fecha_nacimiento,
        p.sexo,
        b.parentesco,
        cm.centro_educacion_inicial
      FROM   Beneficiario b
      JOIN   Persona     p  ON p.cedula  = b.cedula
      JOIN   Carga_Menor cm ON cm.cedula = b.cedula
      WHERE  b.cedula_miembro = $1
      ORDER  BY p.primer_apellido, p.primer_nombre
    `, [req.cedula]);

    res.json({ beneficiarios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* GET /api/beneficiarios/:cedula/vacunas */
router.get('/:cedula/vacunas', async (req, res) => {
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    const { rows: ben } = await pool.query(
      'SELECT 1 FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    if (!ben.length) return res.status(404).json({ error: 'Beneficiario no encontrado' });

    const { rows } = await pool.query(
      'SELECT vacuna FROM Vacunacion WHERE cedula = $1 ORDER BY vacuna',
      [req.params.cedula]
    );
    res.json({ vacunas: rows.map(r => r.vacuna) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* POST /api/beneficiarios — registra Persona + Beneficiario + Carga_Menor */
router.post('/', async (req, res) => {
  const {
    cedula, sexo, fecha_nacimiento,
    primer_nombre, segundo_nombre,
    primer_apellido, segundo_apellido,
    parentesco, centro_educacion_inicial
  } = req.body;

  if (!cedula || !sexo || !fecha_nacimiento ||
      !primer_nombre || !primer_apellido || !segundo_apellido || !parentesco) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible)
      return res.status(403).json({ error: 'Solo profesores y personal administrativo pueden registrar beneficiarios' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO Persona
          (cedula, sexo, fecha_nacimiento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cedula) DO NOTHING
      `, [cedula, sexo, fecha_nacimiento, primer_nombre, segundo_nombre || null, primer_apellido, segundo_apellido]);

      await client.query(`
        INSERT INTO Beneficiario (cedula, parentesco, cedula_miembro)
        VALUES ($1, $2, $3)
      `, [cedula, parentesco, req.cedula]);

      await client.query(`
        INSERT INTO Carga_Menor (cedula, centro_educacion_inicial)
        VALUES ($1, $2)
      `, [cedula, centro_educacion_inicial || null]);

      await client.query('COMMIT');
      res.status(201).json({ message: 'Carga Menor registrada exitosamente', cedula });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      if (err.code === '23505')
        return res.status(409).json({ error: 'Ya existe un beneficiario con esa cédula registrado en el sistema' });
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* POST /api/beneficiarios/:cedula/vacunas */
router.post('/:cedula/vacunas', async (req, res) => {
  const { vacuna } = req.body;
  if (!vacuna || !vacuna.trim())
    return res.status(400).json({ error: 'Nombre de vacuna requerido' });

  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    const { rows: ben } = await pool.query(
      'SELECT 1 FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    if (!ben.length) return res.status(404).json({ error: 'Beneficiario no encontrado' });

    await pool.query(
      'INSERT INTO Vacunacion (cedula, vacuna) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.cedula, vacuna.trim()]
    );
    res.json({ message: 'Vacuna registrada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* DELETE /api/beneficiarios/:cedula/vacunas/:vacuna */
router.delete('/:cedula/vacunas/:vacuna', async (req, res) => {
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    await pool.query(
      'DELETE FROM Vacunacion WHERE cedula = $1 AND vacuna = $2',
      [req.params.cedula, req.params.vacuna]
    );
    res.json({ message: 'Vacuna eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* PUT /api/beneficiarios/:cedula — actualiza centro_educacion_inicial */
router.put('/:cedula', async (req, res) => {
  const { centro_educacion_inicial } = req.body;
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    const { rows: ben } = await pool.query(
      'SELECT 1 FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    if (!ben.length) return res.status(404).json({ error: 'Beneficiario no encontrado' });

    await pool.query(
      'UPDATE Carga_Menor SET centro_educacion_inicial = $1 WHERE cedula = $2',
      [centro_educacion_inicial || null, req.params.cedula]
    );
    res.json({ message: 'Beneficiario actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* DELETE /api/beneficiarios/:cedula */
router.delete('/:cedula', async (req, res) => {
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    const { rows: ben } = await pool.query(
      'SELECT 1 FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    if (!ben.length) return res.status(404).json({ error: 'Beneficiario no encontrado' });

    /* ON DELETE CASCADE elimina Carga_Menor y Vacunacion */
    await pool.query(
      'DELETE FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    res.json({ message: 'Beneficiario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ══════════════════ CARGA MAYOR ══════════════════════════════════ */

/* GET /api/beneficiarios/carga-mayor */
router.get('/carga-mayor', async (req, res) => {
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible)
      return res.status(403).json({ error: 'Solo profesores y personal administrativo pueden gestionar beneficiarios' });

    const { rows } = await pool.query(`
      SELECT
        b.cedula,
        p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido,
        p.fecha_nacimiento, p.sexo, b.parentesco,
        cm.constancia_estudio_universitario, cm.soltero
      FROM   Beneficiario b
      JOIN   Persona     p  ON p.cedula  = b.cedula
      JOIN   Carga_Mayor cm ON cm.cedula = b.cedula
      WHERE  b.cedula_miembro = $1
      ORDER  BY p.primer_apellido, p.primer_nombre
    `, [req.cedula]);

    res.json({ beneficiarios: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* POST /api/beneficiarios/carga-mayor */
router.post('/carga-mayor', async (req, res) => {
  const {
    cedula, sexo, fecha_nacimiento,
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    parentesco, constancia_estudio_universitario, soltero
  } = req.body;

  if (!cedula || !sexo || !fecha_nacimiento || !primer_nombre ||
      !primer_apellido || !segundo_apellido || !parentesco ||
      !constancia_estudio_universitario || !soltero) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!['S', 'N'].includes(soltero))
    return res.status(400).json({ error: 'El campo soltero debe ser S o N' });

  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible)
      return res.status(403).json({ error: 'Solo profesores y personal administrativo pueden registrar beneficiarios' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO Persona
          (cedula, sexo, fecha_nacimiento, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (cedula) DO NOTHING
      `, [cedula, sexo, fecha_nacimiento, primer_nombre, segundo_nombre || null, primer_apellido, segundo_apellido]);

      await client.query(`
        INSERT INTO Beneficiario (cedula, parentesco, cedula_miembro)
        VALUES ($1, $2, $3)
      `, [cedula, parentesco, req.cedula]);

      await client.query(`
        INSERT INTO Carga_Mayor (cedula, constancia_estudio_universitario, soltero)
        VALUES ($1, $2, $3)
      `, [cedula, constancia_estudio_universitario, soltero]);

      await client.query('COMMIT');
      res.status(201).json({ message: 'Carga Mayor registrada exitosamente', cedula });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      if (err.code === '23505')
        return res.status(409).json({ error: 'Ya existe un beneficiario con esa cédula registrado en el sistema' });
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* PUT /api/beneficiarios/carga-mayor/:cedula */
router.put('/carga-mayor/:cedula', async (req, res) => {
  const { constancia_estudio_universitario, soltero } = req.body;
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    const { rows: ben } = await pool.query(
      'SELECT 1 FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    if (!ben.length) return res.status(404).json({ error: 'Beneficiario no encontrado' });

    await pool.query(`
      UPDATE Carga_Mayor
      SET constancia_estudio_universitario = COALESCE($1, constancia_estudio_universitario),
          soltero = COALESCE($2, soltero)
      WHERE cedula = $3
    `, [constancia_estudio_universitario || null, soltero || null, req.params.cedula]);

    res.json({ message: 'Carga Mayor actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* DELETE /api/beneficiarios/carga-mayor/:cedula */
router.delete('/carga-mayor/:cedula', async (req, res) => {
  try {
    const elegible = await verificarElegible(req.cedula);
    if (!elegible) return res.status(403).json({ error: 'Sin permisos' });

    const { rows: ben } = await pool.query(
      'SELECT 1 FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    if (!ben.length) return res.status(404).json({ error: 'Beneficiario no encontrado' });

    await pool.query(
      'DELETE FROM Beneficiario WHERE cedula = $1 AND cedula_miembro = $2',
      [req.params.cedula, req.cedula]
    );
    res.json({ message: 'Carga Mayor eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;