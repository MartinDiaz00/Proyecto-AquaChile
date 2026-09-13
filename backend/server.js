const express = require("express");
const cors = require("cors");
const solicitudesRouter = require("./routes/solicitudes");
const evaluacionesRouter = require("./routes/evaluaciones");

require("dotenv").config();

const candidatosRouter = require("./routes/candidatos");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/solicitudes", solicitudesRouter);
app.use("/api/evaluaciones", evaluacionesRouter);

app.use("/api/candidatos", candidatosRouter);

app.get("/", (req, res) => {
  res.send("API SGP Psicolaboral funcionando");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));