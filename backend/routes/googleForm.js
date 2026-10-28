const crypto = require("node:crypto");
const express = require("express");
const poolPorDefecto = require("../db");
const {
  sanearTexto,
  excedeLargo,
  mensajeExcedeLargo,
  esCorreoValido,
} = require("../utils/texto");

const FAMILIAS_CARGO = new Set([
  "Profesional A",
  "Profesional B",
  "Operario Calificado",
  "Supervisor B",
  "Jefatura",
]);

const LARGOS = {
  nombre: 150,
  correo: 255,
  telefono: 50,
  cargo_postulado: 150,
  familia_cargo: 100,
};

function compararTokenSeguro(tokenRecibido, tokenConfigurado) {
  const recibido = crypto.createHash("sha256").update(tokenRecibido).digest();
  const configurado = crypto.createHash("sha256").update(tokenConfigurado).digest();
  return crypto.timingSafeEqual(recibido, configurado);
}

function crearLimitador({ ventanaMs = 15 * 60 * 1000, maxSolicitudes = 20 } = {}) {
  const solicitudesPorIp = new Map();

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "desconocida";
    let limite = solicitudesPorIp.get(ip);

    if (!limite || ahora - limite.inicio >= ventanaMs) {
      limite = { inicio: ahora, cantidad: 0 };
      solicitudesPorIp.set(ip, limite);
    }

    if (solicitudesPorIp.size > 10000) {
      for (const [ipRegistrada, registro] of solicitudesPorIp) {
        if (ahora - registro.inicio >= ventanaMs) solicitudesPorIp.delete(ipRegistrada);
      }
    }

    limite.cantidad += 1;
    if (limite.cantidad > maxSolicitudes) {
      const reintentarEn = Math.max(1, Math.ceil((limite.inicio + ventanaMs - ahora) / 1000));
      res.set("Retry-After", String(reintentarEn));
      return res.status(429).json({ error: "Se excedió el límite de envíos. Intenta más tarde." });
    }

    return next();
  };
}

function validarCandidato(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "El cuerpo debe ser un objeto JSON." };
  }

  const valores = {};
  for (const [campo, etiqueta, requerido] of [
    ["nombre", "el nombre", true],
    ["correo", "el correo", true],
    ["telefono", "el teléfono", false],
    ["cargo_postulado", "el cargo", true],
    ["familia_cargo", "la familia de cargo", true],
  ]) {
    const entrada = body[campo];
    if (entrada !== undefined && entrada !== null && typeof entrada !== "string") {
      return { error: `El campo ${etiqueta} debe ser texto.` };
    }

    const { valor, error } = sanearTexto(entrada, { campo: etiqueta, requerido });
    if (error) return { error };
    if (valor !== null && excedeLargo(valor, LARGOS[campo], etiqueta)) {
      return { error: mensajeExcedeLargo(etiqueta, LARGOS[campo]) };
    }
    valores[campo] = valor;
  }

  valores.correo = valores.correo.toLowerCase();
  if (!esCorreoValido(valores.correo)) {
    return { error: "El correo no tiene un formato válido." };
  }
  if (!FAMILIAS_CARGO.has(valores.familia_cargo)) {
    return { error: "La familia de cargo no es válida." };
  }

  return { datos: valores };
}

function crearRouterGoogleForm({
  pool = poolPorDefecto,
  obtenerToken = () => process.env.GOOGLE_FORM_TOKEN,
  limitador = crearLimitador(),
} = {}) {
  const router = express.Router();

  router.use(limitador);
  router.post("/candidatos", express.json({ limit: "10kb" }), async (req, res) => {
    const tokenConfigurado = obtenerToken();
    if (!tokenConfigurado) {
      console.error("GOOGLE_FORM_TOKEN no está configurado.");
      return res.status(500).json({ error: "El webhook no está configurado." });
    }

    const tokenRecibido = req.get("x-webhook-token") || "";
    if (!compararTokenSeguro(tokenRecibido, tokenConfigurado)) {
      return res.status(401).json({ error: "Token de webhook no válido." });
    }

    const { datos, error } = validarCandidato(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const existente = await pool.query(
        "SELECT id FROM candidatos WHERE lower(btrim(correo)) = $1 LIMIT 1",
        [datos.correo]
      );
      if (existente.rows[0]) {
        return res.status(200).json({
          estado: "duplicado",
          mensaje: "Ya existe un candidato con ese correo.",
          id: existente.rows[0].id,
        });
      }

      const resultado = await pool.query(
        `INSERT INTO candidatos
           (nombre, correo, telefono, cargo_postulado, familia_cargo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING
         RETURNING id, nombre, correo, telefono, cargo_postulado, familia_cargo`,
        [
          datos.nombre,
          datos.correo,
          datos.telefono,
          datos.cargo_postulado,
          datos.familia_cargo,
        ]
      );

      if (resultado.rows[0]) {
        return res.status(201).json({
          estado: "creado",
          mensaje: "Candidato creado correctamente.",
          candidato: resultado.rows[0],
        });
      }

      const duplicadoConcurrente = await pool.query(
        "SELECT id FROM candidatos WHERE lower(btrim(correo)) = $1 LIMIT 1",
        [datos.correo]
      );
      if (duplicadoConcurrente.rows[0]) {
        return res.status(200).json({
          estado: "duplicado",
          mensaje: "Ya existe un candidato con ese correo.",
          id: duplicadoConcurrente.rows[0].id,
        });
      }

      console.error("El alta del candidato no insertó filas ni encontró un correo duplicado.");
      return res.status(500).json({ error: "No se pudo guardar el candidato." });
    } catch (errorConsulta) {
      console.error("Error guardando candidato desde Google Form:", errorConsulta);
      return res.status(500).json({ error: "No se pudo guardar el candidato." });
    }
  });

  return router;
}

module.exports = crearRouterGoogleForm();
module.exports.crearRouterGoogleForm = crearRouterGoogleForm;
module.exports.validarCandidato = validarCandidato;
