const express = require("express");
const cors = require("cors");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const solicitudesRouter = require("./routes/solicitudes");
const evaluacionesRouter = require("./routes/evaluaciones");
const authRouter = require("./routes/auth");
const candidatosRouter = require("./routes/candidatos");
const archivosRouter = require("./routes/archivos");
const googleFormRouter = require("./routes/googleForm");

const app = express();

app.use(cors());
app.use("/api/google-form", googleFormRouter);
app.use(express.json());

// Rutas de la API
app.use("/api/auth", authRouter);
app.use("/api/solicitudes", solicitudesRouter);
app.use("/api/evaluaciones", evaluacionesRouter);
app.use("/api/candidatos", candidatosRouter);
app.use("/api/archivos", archivosRouter);

// Ruta raíz y health
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => res.send("API SGP Psicolaboral funcionando"));

// --- Middleware: ruta API no encontrada (404) ---
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint de API no encontrado." });
});

// --- Middleware: manejo global de errores (500) ---
app.use((err, _req, res, _next) => {
  console.error("Error no controlado:", err);
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "La solicitud supera el tamaño máximo permitido." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la solicitud no es JSON válido." });
  }
  res.status(500).json({ error: "Error interno del servidor." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
