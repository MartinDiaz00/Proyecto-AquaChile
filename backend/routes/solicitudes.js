const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM solicitudes ORDER BY id");
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { candidato_id, cargo, familia_cargo, fecha_solicitud, responsable } = req.body;
  try {
    const resultado = await pool.query(
      `INSERT INTO solicitudes (candidato_id, cargo, familia_cargo, fecha_solicitud, estado, responsable, observaciones)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5, '') RETURNING *`,
      [candidato_id, cargo, familia_cargo, fecha_solicitud, responsable]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const resultado = await pool.query(
      "UPDATE solicitudes SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id]
    );
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;