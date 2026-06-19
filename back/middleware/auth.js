const pool = require('../config/db');

async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesión requerida' });
  }

  const sessionID = header.split(' ')[1];

  try {
    const { rows } = await pool.query(`
      SELECT s.cedula, mc.estado_de_cuenta,
             p.primer_nombre, p.primer_apellido
      FROM   Sesion s
      JOIN   Miembro_Comunidad mc ON mc.cedula = s.cedula
      JOIN   Persona p ON p.cedula = s.cedula
      WHERE  s.uuid = $1
      ORDER  BY s.fecha_hora_acceso DESC
      LIMIT  1
    `, [sessionID]);

    if (rows.length === 0)
      return res.status(401).json({ error: 'Sesión inválida o expirada' });

    if (rows[0].estado_de_cuenta === 'Bloqueada')
      return res.status(403).json({ error: 'Cuenta bloqueada' });

    req.cedula = rows[0].cedula;
    next();
  } catch (err) {
    console.error('Error en auth middleware:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = authMiddleware;
