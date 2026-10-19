const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const { sanearTexto, excedeLargo, mensajeExcedeLargo, esFechaValida } = require("../utils/texto");

router.use(authenticateToken);

router.get("/:solicitudId", async (req, res) => {
  const solicitudId = Number(req.params.solicitudId);
  if (!Number.isInteger(solicitudId) || solicitudId < 1) {
    return res.status(400).json({ error: "ID de solicitud inválido." });
  }
  try {
    const resultado = await pool.query(
      "SELECT * FROM evaluaciones WHERE solicitud_id = $1",
      [solicitudId]
    );
    res.json(resultado.rows[0] || null);
  } catch (error) {
    console.error("Error consultando evaluación:", error);
    res.status(500).json({ error: "No se pudo consultar la evaluación." });
  }
});

router.post("/", requireRole("Administrador académico", "Profesional Evaluador"), async (req, res) => {
  const { solicitud_id, fecha_evaluacion, resultado, observaciones } = req.body;
  const resultadosPermitidos = ["Recomendado", "Recomendado con observaciones", "No recomendado"];
  const solicitudId = Number(solicitud_id);
  if (!Number.isInteger(solicitudId) || solicitudId < 1 || !fecha_evaluacion ||
      !resultadosPermitidos.includes(resultado)) {
    return res.status(400).json({ error: "Solicitud, fecha y resultado válido son obligatorios." });
  }
  if (!esFechaValida(fecha_evaluacion)) {
    return res.status(400).json({ error: "La fecha de evaluación no es válida." });
  }

  const { valor: observacionesLimpias, error } = sanearTexto(observaciones, {
    campo: "las observaciones",
  });
  if (error) return res.status(400).json({ error });
  if (excedeLargo(observacionesLimpias, 5000, "las observaciones")) {
    return res.status(400).json({ error: mensajeExcedeLargo("las observaciones", 5000) });
  }

  try {
    const solicitud = await pool.query("SELECT id FROM solicitudes WHERE id = $1", [solicitudId]);
    if (!solicitud.rows[0]) {
      return res.status(400).json({ error: "La solicitud seleccionada no existe." });
    }

    const upsert = await pool.query(
      `INSERT INTO evaluaciones (solicitud_id, fecha_evaluacion, resultado, observaciones, estado)
       VALUES ($1, $2, $3, $4, 'Completada')
       ON CONFLICT (solicitud_id)
       DO UPDATE SET fecha_evaluacion = EXCLUDED.fecha_evaluacion,
                     resultado = EXCLUDED.resultado,
                     observaciones = EXCLUDED.observaciones,
                     estado = 'Completada'
       RETURNING *`,
      [solicitudId, fecha_evaluacion, resultado, observacionesLimpias || ""]
    );
    await pool.query("UPDATE solicitudes SET estado = 'Finalizada' WHERE id = $1", [solicitudId]);
    res.status(201).json(upsert.rows[0]);
  } catch (error) {
    console.error("Error guardando evaluación:", error);
    res.status(500).json({ error: "No se pudo guardar la evaluación." });
  }
});

module.exports = router;
