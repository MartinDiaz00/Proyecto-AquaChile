const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const { sanearTexto, excedeLargo, mensajeExcedeLargo, esFechaValida } = require("../utils/texto");

const CREADORES = ["Administrador académico", "Analista de Reclutamiento"];
const GESTORES = ["Administrador académico", "Profesional Evaluador"];
const ESTADOS = ["Pendiente", "En proceso", "Finalizada"];

// Largos según el esquema (neon/02_tablas_principales.sql).
const LARGOS = {
  cargo: 150,
  familia_cargo: 100,
  responsable: 150,
  origen_candidato: 50,
  unidad: 150,
  ceco: 100,
};

router.use(authenticateToken);

router.get("/", async (_req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM solicitudes ORDER BY id DESC");
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error consultando solicitudes:", error);
    res.status(500).json({ error: "No se pudieron consultar las solicitudes." });
  }
});

router.post("/", requireRole(...CREADORES), async (req, res) => {
  const {
    candidato_id, fecha_solicitud, requiere_referencias, ceco,
    cv_adjunto, descriptor_adjunto, es_referido,
  } = req.body;

  const candidatoId = Number(candidato_id);
  if (!Number.isInteger(candidatoId) || candidatoId < 1) {
    return res.status(400).json({ error: "Candidato inválido." });
  }

  // Saneo de los textos (evita guardar tildes/Ñ corruptos o mojibake).
  const campos = [
    { nombre: "cargo", etiqueta: "el cargo", requerido: true, max: LARGOS.cargo },
    { nombre: "familia_cargo", etiqueta: "la familia de cargo", requerido: true, max: LARGOS.familia_cargo },
    { nombre: "responsable", etiqueta: "el responsable", requerido: true, max: LARGOS.responsable },
    { nombre: "origen_candidato", etiqueta: "el origen del candidato", requerido: false, max: LARGOS.origen_candidato },
    { nombre: "unidad", etiqueta: "la unidad", requerido: false, max: LARGOS.unidad },
    { nombre: "ceco", etiqueta: "el centro de costos", requerido: false, max: LARGOS.ceco },
    { nombre: "aspectos_indagar", etiqueta: "los aspectos a indagar", requerido: false, max: 5000 },
  ];

  const datos = {};
  for (const campo of campos) {
    const { valor, error } = sanearTexto(req.body[campo.nombre], {
      campo: campo.etiqueta,
      requerido: campo.requerido,
    });
    if (error) return res.status(400).json({ error });
    if (valor !== null && excedeLargo(valor, campo.max, campo.etiqueta)) {
      return res.status(400).json({ error: mensajeExcedeLargo(campo.etiqueta, campo.max) });
    }
    datos[campo.nombre] = valor;
  }

  if (!esFechaValida(fecha_solicitud)) {
    return res.status(400).json({ error: "La fecha de solicitud no es válida." });
  }

  try {
    const candidato = await pool.query("SELECT id FROM candidatos WHERE id = $1", [candidatoId]);
    if (!candidato.rows[0]) {
      return res.status(400).json({ error: "El candidato seleccionado no existe." });
    }

    const resultado = await pool.query(
      `INSERT INTO solicitudes
         (candidato_id, cargo, familia_cargo, fecha_solicitud, estado, responsable, observaciones,
          origen_candidato, unidad, requiere_referencias, ceco, cv_adjunto, descriptor_adjunto, aspectos_indagar, es_referido)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5, '', $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [candidatoId, datos.cargo, datos.familia_cargo, fecha_solicitud,
       datos.responsable, datos.origen_candidato, datos.unidad,
       Boolean(requiere_referencias), datos.ceco, Boolean(cv_adjunto),
       Boolean(descriptor_adjunto), datos.aspectos_indagar, Boolean(es_referido)]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error creando solicitud:", error);
    res.status(500).json({ error: "No se pudo guardar la solicitud." });
  }
});

router.patch("/:id/estado", requireRole(...GESTORES), async (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body;
  if (!Number.isInteger(id) || id < 1 || !ESTADOS.includes(estado)) {
    return res.status(400).json({ error: "ID o estado inválido." });
  }
  try {
    const resultado = await pool.query(
      "UPDATE solicitudes SET estado = $1 WHERE id = $2 RETURNING *",
      [estado, id]
    );
    if (!resultado.rows[0]) return res.status(404).json({ error: "Solicitud no encontrada." });
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ error: "No se pudo actualizar el estado." });
  }
});

module.exports = router;
