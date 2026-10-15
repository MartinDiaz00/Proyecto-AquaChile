const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

const EDITORES = ["Administrador académico", "Analista de Reclutamiento"];

router.use(authenticateToken);

router.get("/", async (_req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM candidatos ORDER BY id");
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error consultando candidatos:", error);
    res.status(500).json({ error: "No se pudieron consultar los candidatos." });
  }
});

router.post("/", requireRole(...EDITORES), async (req, res) => {
  const { nombre, correo, telefono, cargo_postulado, familia_cargo } = req.body;
  if (!String(nombre || "").trim() || !String(correo || "").trim() ||
      !String(cargo_postulado || "").trim() || !String(familia_cargo || "").trim()) {
    return res.status(400).json({ error: "Nombre, correo, cargo y familia de cargo son obligatorios." });
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO candidatos (nombre, correo, telefono, cargo_postulado, familia_cargo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [String(nombre).trim(), String(correo).trim(), telefono || null,
       String(cargo_postulado).trim(), String(familia_cargo).trim()]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error creando candidato:", error);
    res.status(500).json({ error: "No se pudo guardar el candidato." });
  }
});

router.put("/:id", requireRole(...EDITORES), async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, correo, telefono, cargo_postulado, familia_cargo } = req.body;
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "ID inválido." });
  if (!String(nombre || "").trim() || !String(correo || "").trim() ||
      !String(cargo_postulado || "").trim() || !String(familia_cargo || "").trim()) {
    return res.status(400).json({ error: "Nombre, correo, cargo y familia de cargo son obligatorios." });
  }
  try {
    const resultado = await pool.query(
      `UPDATE candidatos
       SET nombre = $1, correo = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5
       WHERE id = $6 RETURNING *`,
      [String(nombre).trim(), String(correo).trim(), telefono || null,
       String(cargo_postulado).trim(), String(familia_cargo).trim(), id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ error: "Candidato no encontrado." });
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error actualizando candidato:", error);
    res.status(500).json({ error: "No se pudo actualizar el candidato." });
  }
});

module.exports = router;
