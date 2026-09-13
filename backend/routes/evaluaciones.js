const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/:solicitudId", async (req, res) => {
  const { solicitudId } = req.params;
  try {
    const resultado = await pool.query("SELECT * FROM evaluaciones WHERE solicitud_id = $1", [solicitudId]);
    res.json(resultado.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { solicitud_id, fecha_evaluacion, resultado, observaciones } = req.body;
  try {
    const upsert = await pool.query(
      `INSERT INTO evaluaciones (solicitud_id, fecha_evaluacion, resultado, observaciones, estado)
       VALUES ($1, $2, $3, $4, 'Completada')
       ON CONFLICT (solicitud_id)
       DO UPDATE SET fecha_evaluacion = $2, resultado = $3, observaciones = $4
       RETURNING *`,
      [solicitud_id, fecha_evaluacion, resultado, observaciones]
    );
    await pool.query("UPDATE solicitudes SET estado = 'Finalizada' WHERE id = $1", [solicitud_id]);
    res.status(201).json(upsert.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;