const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const crypto = require('crypto');

router.post('/login', async (req, res) => {
  const { cedula, email, password, codigoMFA, lat, lon, sede } = req.body;

  try {
    const userQuery = `SELECT cedula, correo_institucional, contrasena, estado_de_cuenta, sede 
                           FROM Miembro_Comunidad WHERE cedula = $1 AND correo_institucional = $2`;
    const result = await pool.query(userQuery, [cedula, email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];

    if (user.estado_de_cuenta === 'Bloqueada') {
      return res.status(403).json({ error: "Cuenta bloqueada. Contacte a soporte." });
    }

    if (user.sede.trim() !== sede.trim()) {
      return res.status(401).json({ error: "La sede seleccionada no corresponde" });
    }

    if (user.contrasena !== password || codigoMFA !== "123456") {
      await pool.query(
        `UPDATE Sesion SET Intentos_Fallidos = Intentos_Fallidos + 1 
                 WHERE Cedula = $1 AND Fecha_Hora_Acceso = (SELECT MAX(Fecha_Hora_Acceso) FROM Sesion WHERE Cedula = $1)`,
        [cedula]
      );
      return res.status(401).json({ error: "Credenciales o código incorrectos" });
    }

    const sessionID = crypto.randomUUID();
    await pool.query(
      `INSERT INTO Sesion (cedula, uuid, fecha_hora_acceso, direccion_ip, intentos_fallidos, latitud, longitud) 
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 0, $4, $5)`,
      [cedula, sessionID, req.ip, lat, lon]
    );

    res.json({ message: "Acceso autorizado", sessionID });

  } catch (err) {
    console.error("Error crítico en login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;