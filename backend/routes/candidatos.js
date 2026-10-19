const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const { sanearTexto, excedeLargo, mensajeExcedeLargo, esCorreoValido } = require("../utils/texto");

const EDITORES = ["Administrador académico", "Analista de Reclutamiento"];

// Largos según el esquema (neon/02_tablas_principales.sql).
const LARGOS = {
  nombre: 150,
  correo: 255,
  telefono: 50,
  cargo_postulado: 150,
  familia_cargo: 100,
};

/**
 * Sanea y valida los datos de un candidato.
 * @returns {{ datos: object, error: string|null }}
 */
function prepararCandidato(body) {
  const campos = [
    { nombre: "nombre", etiqueta: "el nombre", requerido: true, max: LARGOS.nombre },
    { nombre: "correo", etiqueta: "el correo", requerido: true, max: LARGOS.correo },
    { nombre: "telefono", etiqueta: "el teléfono", requerido: false, max: LARGOS.telefono },
    { nombre: "cargo_postulado", etiqueta: "el cargo", requerido: true, max: LARGOS.cargo_postulado },
    { nombre: "familia_cargo", etiqueta: "la familia de cargo", requerido: true, max: LARGOS.familia_cargo },
  ];

  const datos = {};
  for (const campo of campos) {
    const { valor, error } = sanearTexto(body[campo.nombre], {
      campo: campo.etiqueta,
      requerido: campo.requerido,
    });
    if (error) return { datos: null, error };
    if (valor !== null && excedeLargo(valor, campo.max, campo.etiqueta)) {
      return { datos: null, error: mensajeExcedeLargo(campo.etiqueta, campo.max) };
    }
    datos[campo.nombre] = valor;
  }

  if (!esCorreoValido(datos.correo)) {
    return { datos: null, error: "El correo no tiene un formato válido." };
  }

  return { datos, error: null };
}

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
  const { datos, error } = prepararCandidato(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const resultado = await pool.query(
      `INSERT INTO candidatos (nombre, correo, telefono, cargo_postulado, familia_cargo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [datos.nombre, datos.correo, datos.telefono, datos.cargo_postulado, datos.familia_cargo]
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

  const { datos, error } = prepararCandidato(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const existe = await pool.query("SELECT id FROM candidatos WHERE id = $1", [id]);
    if (!existe.rows[0]) {
      return res.status(404).json({ error: "Candidato no encontrado." });
    }

    // Intentar actualizar con actualizado_en (si la columna existe)
    try {
      const resultado = await pool.query(
        `UPDATE candidatos
         SET nombre = $1, correo = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5,
             actualizado_en = NOW()
         WHERE id = $6 RETURNING *`,
        [datos.nombre, datos.correo, datos.telefono, datos.cargo_postulado, datos.familia_cargo, id]
      );
      res.json(resultado.rows[0]);
    } catch (updateError) {
      // Si falla por columna actualizado_en inexistente, reintentar sin ella
      if (updateError.code === "42703" || updateError.message.includes("actualizado_en")) {
        const resultado = await pool.query(
          `UPDATE candidatos
           SET nombre = $1, correo = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5
           WHERE id = $6 RETURNING *`,
          [datos.nombre, datos.correo, datos.telefono, datos.cargo_postulado, datos.familia_cargo, id]
        );
        res.json(resultado.rows[0]);
      } else {
        throw updateError;
      }
    }
  } catch (error) {
    console.error("Error actualizando candidato:", error);
    res.status(500).json({ error: "No se pudo actualizar el candidato. Verifica que la tabla candidatos exista en Neon." });
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
      return res.status(400).json({
        error: "No se puede eliminar: el candidato tiene solicitudes de evaluación asociadas. Primero elimina esas solicitudes o edita al candidato en su lugar."
      });
    }

    await pool.query("DELETE FROM candidatos WHERE id = $1", [id]);
    res.json({ mensaje: "Candidato eliminado correctamente.", id });
  } catch (error) {
    console.error("Error eliminando candidato:", error);
    res.status(500).json({ error: "No se pudo eliminar el candidato." });
  }
});

module.exports = router;
