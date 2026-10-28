const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const { sanearTexto, excedeLargo, mensajeExcedeLargo, esCorreoValido } = require("../utils/texto");
const { eliminarArchivo, GoogleDriveError } = require("../services/googleDrive");

const EDITORES = ["Administrador académico", "Analista de Reclutamiento"];

// Largos según neon/02_tablas_principales.sql y neon/05_datos_cv_candidatos.sql.
const LARGOS = {
  nombre: 150,
  correo: 255,
  telefono: 50,
  cargo_postulado: 150,
  familia_cargo: 100,
  perfil_profesional: 2000,
  educacion: 4000,
  habilidades: 3000,
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
    { nombre: "perfil_profesional", etiqueta: "el perfil profesional", requerido: false, max: LARGOS.perfil_profesional },
    { nombre: "educacion", etiqueta: "la educación", requerido: false, max: LARGOS.educacion },
    { nombre: "habilidades", etiqueta: "las habilidades", requerido: false, max: LARGOS.habilidades },
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

  datos.perfil_profesional = datos.perfil_profesional || "";
  datos.educacion = datos.educacion || "";
  datos.habilidades = datos.habilidades || "";

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
      `INSERT INTO candidatos
         (nombre, correo, email, telefono, cargo_postulado, familia_cargo, perfil_profesional, educacion, habilidades)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        datos.nombre,
        datos.correo,
        datos.telefono,
        datos.cargo_postulado,
        datos.familia_cargo,
        datos.perfil_profesional,
        datos.educacion,
        datos.habilidades,
      ]
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
         SET nombre = $1, correo = $2, email = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5,
             perfil_profesional = $6, educacion = $7, habilidades = $8,
             actualizado_en = NOW()
         WHERE id = $9 RETURNING *`,
        [
          datos.nombre,
          datos.correo,
          datos.telefono,
          datos.cargo_postulado,
          datos.familia_cargo,
          datos.perfil_profesional,
          datos.educacion,
          datos.habilidades,
          id,
        ]
      );
      res.json(resultado.rows[0]);
    } catch (updateError) {
      // Si falla por columna actualizado_en inexistente, reintentar sin ella
      if (updateError.code === "42703" || updateError.message.includes("actualizado_en")) {
        const resultado = await pool.query(
          `UPDATE candidatos
           SET nombre = $1, correo = $2, email = $2, telefono = $3, cargo_postulado = $4, familia_cargo = $5,
               perfil_profesional = $6, educacion = $7, habilidades = $8
           WHERE id = $9 RETURNING *`,
          [
            datos.nombre,
            datos.correo,
            datos.telefono,
            datos.cargo_postulado,
            datos.familia_cargo,
            datos.perfil_profesional,
            datos.educacion,
            datos.habilidades,
            id,
          ]
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

    const archivos = await pool.query(
      "SELECT id, drive_item_id, storage_provider FROM archivos_candidato WHERE candidato_id = $1",
      [id]
    );
    const archivosLegados = archivos.rows.filter((archivo) => archivo.storage_provider !== "google_drive");
    if (archivosLegados.length > 0) {
      return res.status(409).json({
        error: "El candidato tiene CV antiguos en OneDrive. Elimínalos allí y quita sus referencias desde la aplicación antes de borrar al candidato.",
      });
    }
    for (const archivo of archivos.rows) {
      await eliminarArchivo(archivo.drive_item_id);
    }

    await pool.query("DELETE FROM candidatos WHERE id = $1", [id]);
    res.json({ mensaje: "Candidato eliminado correctamente.", id });
  } catch (error) {
    console.error("Error eliminando candidato:", error);
    if (error instanceof GoogleDriveError) {
      return res.status(error.status).json({ error: error.message });
    }
    res.status(500).json({ error: "No se pudo eliminar el candidato." });
  }
});

module.exports = router;
