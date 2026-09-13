const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM candidatos ORDER BY id");
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { nombre, correo, telefono, cargo_postulado, familia_cargo } = req.body;
  try {
    const resultado = await pool.query(
      `INSERT INTO candidatos (nombre, correo, telefono, cargo_postulado, familia_cargo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, correo, telefono, cargo_postulado, familia_cargo]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, telefono, cargo_postulado, familia_cargo } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE candidatos
       SET nombre = $1, correo = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5
       WHERE id = $6 RETURNING *`,
      [nombre, correo, telefono, cargo_postulado, familia_cargo, id]
    );
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;