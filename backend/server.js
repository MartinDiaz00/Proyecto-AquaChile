const express = require("express");
const cors = require("cors");
require("dotenv").config();

const solicitudesRouter = require("./routes/solicitudes");
const evaluacionesRouter = require("./routes/evaluaciones");
const authRouter = require("./routes/auth");
const candidatosRouter = require("./routes/candidatos");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas de la API
app.use("/api/auth", authRouter);
app.use("/api/solicitudes", solicitudesRouter);
app.use("/api/evaluaciones", evaluacionesRouter);
app.use("/api/candidatos", candidatosRouter);

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
  res.status(500).json({ error: "Error interno del servidor." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
