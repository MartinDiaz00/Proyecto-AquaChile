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

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID inválido." });
  }
  try {
    const resultado = await pool.query("SELECT * FROM candidatos WHERE id = $1", [id]);
    if (!resultado.rows[0]) {
      return res.status(404).json({ error: "Candidato no encontrado." });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error consultando candidato:", error);
    res.status(500).json({ error: "No se pudo consultar el candidato." });
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
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "ID inválido." });

  const { nombre, correo, telefono, cargo_postulado, familia_cargo } = req.body;
  if (!String(nombre || "").trim() || !String(correo || "").trim() ||
      !String(cargo_postulado || "").trim() || !String(familia_cargo || "").trim()) {
    return res.status(400).json({ error: "Nombre, correo, cargo y familia de cargo son obligatorios." });
  }

  try {
    const existe = await pool.query("SELECT id FROM candidatos WHERE id = $1", [id]);
    if (!existe.rows[0]) {
      return res.status(404).json({ error: "Candidato no encontrado." });
    }

    const resultado = await pool.query(
      `UPDATE candidatos
       SET nombre = $1, correo = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5,
           actualizado_en = NOW()
       WHERE id = $6 RETURNING *`,
      [String(nombre).trim(), String(correo).trim(), telefono || null,
       String(cargo_postulado).trim(), String(familia_cargo).trim(), id]
    );
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error actualizando candidato:", error);
    res.status(500).json({ error: "No se pudo actualizar el candidato." });
  }
});

router.delete("/:id", requireRole("Administrador académico"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "ID inválido." });

  try {
    const existe = await pool.query("SELECT id FROM candidatos WHERE id = $1", [id]);
    if (!existe.rows[0]) {
      return res.status(404).json({ error: "Candidato no encontrado." });
    }

    // Verificar que no tenga solicitudes asociadas
    const solicitudes = await pool.query("SELECT id FROM solicitudes WHERE candidato_id = $1 LIMIT 1", [id]);
    if (solicitudes.rows.length > 0) {
      return res.status(400).json({ error: "No se puede eliminar: el candidato tiene solicitudes asociadas." });
    }

    await pool.query("DELETE FROM candidatos WHERE id = $1", [id]);
    res.json({ mensaje: "Candidato eliminado correctamente.", id });
  } catch (error) {
    console.error("Error eliminando candidato:", error);
    res.status(500).json({ error: "No se pudo eliminar el candidato." });
  }
});

module.exports = router;
