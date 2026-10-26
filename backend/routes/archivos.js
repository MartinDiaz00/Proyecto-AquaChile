const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const { GoogleDriveError, subirArchivo, eliminarArchivo } = require("../services/googleDrive");

const EDITORES = ["Administrador académico", "Analista de Reclutamiento"];
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MIME_CV = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
]);
const MAX_CV = 10 * 1024 * 1024;
const MAX_REPORTE = 15 * 1024 * 1024;

function contenidoCvValido(contenido, tipoContenido) {
  if (tipoContenido === "application/pdf") {
    return contenido.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  if (tipoContenido === "application/msword") {
    return contenido.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }
  if (tipoContenido === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return contenido.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }
  return false;
}

router.use(authenticateToken);

router.get("/cvs", requireRole(...EDITORES), async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, candidato_id, nombre_archivo, web_url, storage_provider, creado_en
       FROM archivos_candidato
       ORDER BY candidato_id, creado_en DESC`
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error consultando archivos de candidatos:", error);
    res.status(500).json({ error: "No se pudieron consultar los CV. Verifica que la migración de archivos esté aplicada." });
  }
});

router.post(
  "/candidatos/:id/cv",
  requireRole(...EDITORES),
  express.raw({ type: () => true, limit: MAX_CV }),
  async (req, res) => {
    const candidatoId = Number(req.params.id);
    if (!Number.isInteger(candidatoId) || candidatoId < 1) {
      return res.status(400).json({ error: "ID de candidato inválido." });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "Selecciona un archivo CV válido." });
    }
    if (req.body.length > MAX_CV) {
      return res.status(413).json({ error: "El CV no puede superar los 10 MB." });
    }

    const tipoContenido = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
    const extension = MIME_CV.get(tipoContenido);
    if (!extension) {
      return res.status(415).json({ error: "El CV debe ser PDF, DOC o DOCX." });
    }
    if (!contenidoCvValido(req.body, tipoContenido)) {
      return res.status(415).json({ error: "El contenido del archivo no coincide con su formato declarado." });
    }

    try {
      const candidato = await pool.query(
        "SELECT id, nombre FROM candidatos WHERE id = $1",
        [candidatoId]
      );
      if (!candidato.rows[0]) {
        return res.status(404).json({ error: "Candidato no encontrado." });
      }

      const fecha = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
      const nombre = `Candidato_${candidatoId}_CV_${fecha}.${extension}`;
      const archivo = await subirArchivo({
        carpeta: "cvs",
        nombre,
        tipoContenido,
        contenido: req.body,
        candidatoId: candidato.rows[0].id,
        candidatoNombre: candidato.rows[0].nombre,
      });

      try {
        const guardado = await pool.query(
          `INSERT INTO archivos_candidato
             (candidato_id, drive_item_id, nombre_archivo, web_url, tipo_contenido, tamano_bytes, storage_provider)
           VALUES ($1, $2, $3, $4, $5, $6, 'google_drive')
           RETURNING id, candidato_id, nombre_archivo, web_url, storage_provider, creado_en`,
          [candidatoId, archivo.id, archivo.name, archivo.webUrl, tipoContenido, req.body.length]
        );
        return res.status(201).json(guardado.rows[0]);
      } catch (error) {
        console.error("CV subido a Google Drive, pero no se pudo guardar su referencia:", error);
        try {
          await eliminarArchivo(archivo.id);
        } catch (eliminacionError) {
          console.error("No se pudo limpiar el CV sin referencia en Google Drive:", eliminacionError);
        }
        return res.status(500).json({ error: "El CV se subió, pero no se pudo registrar en la aplicación." });
      }
    } catch (error) {
      console.error("Error subiendo CV a Google Drive:", error);
      const status = error instanceof GoogleDriveError ? error.status : 500;
      const mensaje = error instanceof GoogleDriveError ? error.message : "No se pudo subir el CV.";
      return res.status(status).json({ error: mensaje });
    }
  }
);

router.delete("/cvs/:id/referencia", requireRole(...EDITORES), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID de archivo inválido." });
  }

  try {
    const resultado = await pool.query(
      "SELECT storage_provider FROM archivos_candidato WHERE id = $1",
      [id]
    );
    const archivo = resultado.rows[0];
    if (!archivo) return res.status(404).json({ error: "CV no encontrado." });
    if (archivo.storage_provider === "google_drive") {
      return res.status(409).json({ error: "Los CV de Google Drive deben eliminarse desde la aplicación." });
    }

    await pool.query("DELETE FROM archivos_candidato WHERE id = $1", [id]);
    return res.json({ mensaje: "Referencia antigua eliminada. El archivo de OneDrive no se modificó.", id });
  } catch (error) {
    console.error("Error quitando referencia antigua de CV:", error);
    return res.status(500).json({ error: "No se pudo quitar la referencia antigua del CV." });
  }
});

router.delete("/cvs/:id", requireRole(...EDITORES), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "ID de archivo inválido." });
  }

  try {
    const resultado = await pool.query(
      "SELECT id, drive_item_id, storage_provider FROM archivos_candidato WHERE id = $1",
      [id]
    );
    const archivo = resultado.rows[0];
    if (!archivo) return res.status(404).json({ error: "CV no encontrado." });
    if (archivo.storage_provider !== "google_drive") {
      return res.status(409).json({
        error: "Este CV fue guardado en OneDrive antes del cambio. Elimínalo manualmente allí.",
      });
    }

    await eliminarArchivo(archivo.drive_item_id);
    await pool.query("DELETE FROM archivos_candidato WHERE id = $1", [id]);
    return res.json({ mensaje: "CV eliminado de Google Drive.", id });
  } catch (error) {
    console.error("Error eliminando CV:", error);
    const status = error instanceof GoogleDriveError ? error.status : 500;
    const mensaje = error instanceof GoogleDriveError ? error.message : "No se pudo eliminar el CV.";
    return res.status(status).json({ error: mensaje });
  }
});

router.post(
  "/reportes/:tipo",
  requireRole(...EDITORES),
  express.raw({ type: MIME_XLSX, limit: MAX_REPORTE }),
  async (req, res) => {
    const tipo = req.params.tipo;
    if (!["candidatos", "solicitudes"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de reporte inválido." });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "El reporte Excel está vacío o no es válido." });
    }
    if (req.body.length > MAX_REPORTE) {
      return res.status(413).json({ error: "El reporte no puede superar los 15 MB." });
    }

    const nombre = String(req.headers["x-report-name"] || "");
    if (!/^[A-Za-z0-9_-]+_\d{4}-\d{2}-\d{2}\.xlsx$/.test(nombre)) {
      return res.status(400).json({ error: "El nombre del reporte no tiene un formato válido." });
    }

    try {
      const archivo = await subirArchivo({
        carpeta: "reportes",
        nombre,
        tipoContenido: MIME_XLSX,
        contenido: req.body,
      });
      return res.status(201).json({ nombre: archivo.name, webUrl: archivo.webUrl });
    } catch (error) {
      console.error("Error subiendo reporte a Google Drive:", error);
      const status = error instanceof GoogleDriveError ? error.status : 500;
      const mensaje = error instanceof GoogleDriveError ? error.message : "No se pudo subir el reporte a Google Drive.";
      return res.status(status).json({ error: mensaje });
    }
  }
);

module.exports = router;
