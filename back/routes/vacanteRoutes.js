const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/* ── Match score calculator ───────────────────────────────────────────────── */
function calcularMatch(egresado, vacante) {
  if (!egresado) return null;

  const perfil = (vacante.perfil_buscado || '').toLowerCase();
  const titulo = (egresado.titulo || '').toLowerCase();
  const indice = parseFloat(egresado.indice_academico);

  // 1. Extract minimum GPA from perfil_buscado
  const regexGPA = /(?:promedio|índice|indice)\s+(?:mayor\s+a|superior\s+a|mínimo\s+de|minimo\s+de)\s+(\d+(?:\.\d+)?)/i;
  const matchGPA = perfil.match(regexGPA);
  const minimoRequerido = matchGPA ? parseFloat(matchGPA[1]) : null;

  // Hard block: GPA below minimum
  if (minimoRequerido !== null && indice < minimoRequerido) return 0;

  // 2. Career match (60 pts — primary filter)
  const stopWords = ['en', 'de', 'la', 'el', 'los', 'las', 'y', 'e', 'o'];
  const palabrasTitulo = titulo
    .split(/\s+/)
    .filter(p => p.length > 3 && !stopWords.includes(p));

  const carreraCoincide = palabrasTitulo.some(p => perfil.includes(p));

  // Hard block: career does not match
  if (!carreraCoincide) return 0;

  let score = 60;

  // 3. GPA score (25 pts)
  if (minimoRequerido !== null) {
    const diferencia = indice - minimoRequerido;
    if (diferencia >= 3)      score += 25;
    else if (diferencia >= 1) score += 15;
    else                      score += 8;
  } else {
    if (indice >= 17)      score += 25;
    else if (indice >= 15) score += 15;
    else if (indice >= 13) score += 8;
  }

  // 4. Recency (15 pts)
  const yearsAgo = new Date().getFullYear() - egresado.ano_graduacion;
  if (yearsAgo === 0)      score += 15;
  else if (yearsAgo === 1) score += 10;
  else if (yearsAgo === 2) score += 5;

  return Math.min(score, 100);
}

/* ── GET /api/vacantes  OR  GET /api/postulaciones ────────────────────────── */
router.get('/', async (req, res) => {
  if (req.baseUrl === '/api/postulaciones') {
    try {
      const { rows } = await pool.query(`
        SELECT
          p.id_vacante, p.fecha_postulacion,
          p.estatus AS estatus_postulacion,
          v.cargo, v.estatus AS estatus_vacante,
          v.beneficios, ee.razon_social AS empresa,
          ee.contacto_correo
        FROM  Postula p
        JOIN  Vacante_Laboral v  ON v.id_vacante = p.id_vacante
        JOIN  Entidad_Externa ee ON ee.rif = v.rif
        WHERE p.cedula = $1
        ORDER BY p.fecha_postulacion DESC
      `, [req.cedula]);
      return res.json({ postulaciones: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /* GET /api/vacantes */
  try {
    const { rows: vacantes } = await pool.query(`
      SELECT
        v.id_vacante, v.cargo, v.estatus,
        v.fecha_oferta, v.responsabilidades,
        v.perfil_buscado, v.beneficios,
        ee.razon_social AS empresa,
        ee.rif, ee.contacto_correo
      FROM  Vacante_Laboral v
      JOIN  Entidad_Externa ee ON ee.rif = v.rif
      WHERE v.estatus = 'Disponible'
        AND ee.fecha_fin_contrato > CURRENT_DATE
      ORDER BY v.fecha_oferta DESC
    `);

    const { rows: egRows } = await pool.query(`
      SELECT indice_academico, ano_graduacion, titulo
      FROM   Egresado
      WHERE  cedula = $1
      ORDER  BY fecha_inicio DESC
      LIMIT  1
    `, [req.cedula]);
    const egresado = egRows[0] || null;

    const { rows: postulas } = await pool.query(`
      SELECT id_vacante FROM Postula WHERE cedula = $1
    `, [req.cedula]);
    const yaPostulado = new Set(postulas.map(p => p.id_vacante));

    const result = vacantes.map(v => ({
      ...v,
      match_score: calcularMatch(egresado, v),
      ya_postulado: yaPostulado.has(v.id_vacante)
    }));

    res.json({ vacantes: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── POST /api/vacantes/:idVacante/postular ───────────────────────────────── */
router.post('/:idVacante/postular', async (req, res) => {
  const { idVacante } = req.params;
  try {
    const { rows: egRows } = await pool.query(`
      SELECT cedula, fecha_inicio, titulo, indice_academico, ano_graduacion
      FROM   Egresado
      WHERE  cedula = $1
      ORDER  BY fecha_inicio DESC
      LIMIT  1
    `, [req.cedula]);
    if (egRows.length === 0)
      return res.status(403).json({ error: 'Solo los egresados pueden postularse' });

    const { rows: vacRow } = await pool.query(`
      SELECT v.*, ee.razon_social AS empresa, ee.fecha_fin_contrato
      FROM   Vacante_Laboral v
      JOIN   Entidad_Externa ee ON ee.rif = v.rif
      WHERE  v.id_vacante = $1
    `, [idVacante]);
    if (vacRow.length === 0 || vacRow[0].estatus !== 'Disponible')
      return res.status(400).json({ error: 'Vacante no disponible' });
    if (new Date(vacRow[0].fecha_fin_contrato) < new Date())
      return res.status(400).json({ error: 'El contrato de esta empresa ha vencido' });

    const egresadoData = {
      titulo:           egRows[0].titulo,
      indice_academico: egRows[0].indice_academico,
      ano_graduacion:   egRows[0].ano_graduacion
    };
    const score = calcularMatch(egresadoData, vacRow[0]);
    if (score === 0)
      return res.status(403).json({ error: 'Tu perfil no cumple los requisitos de esta vacante' });

    const { rows: ya } = await pool.query(`
      SELECT 1 FROM Postula WHERE cedula = $1 AND id_vacante = $2
    `, [req.cedula, idVacante]);
    if (ya.length > 0)
      return res.status(400).json({ error: 'Ya te postulaste a esta vacante' });

    await pool.query(`
      INSERT INTO Postula (Cedula, Fecha_Inicio, ID_Vacante, Fecha_Postulacion, Estatus)
      VALUES ($1, $2, $3, CURRENT_DATE, 'En Revisión')
    `, [req.cedula, egRows[0].fecha_inicio, idVacante]);

    res.json({ message: 'Postulación enviada exitosamente', estatus: 'En Revisión' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/* ── DELETE /api/vacantes/:idVacante/postular ─────────────────────────────── */
router.delete('/:idVacante/postular', async (req, res) => {
  const { idVacante } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT estatus FROM Postula
      WHERE  cedula = $1 AND id_vacante = $2
    `, [req.cedula, idVacante]);

    if (rows.length === 0)
      return res.status(404).json({ error: 'Postulación no encontrada' });
    if (rows[0].estatus !== 'En Revisión')
      return res.status(400).json({ error: 'No puedes retirar una postulación ya procesada' });

    await pool.query(`
      DELETE FROM Postula WHERE cedula = $1 AND id_vacante = $2
    `, [req.cedula, idVacante]);

    res.json({ message: 'Postulación retirada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
