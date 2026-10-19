const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const { sanearTexto, excedeLargo, mensajeExcedeLargo, esCorreoValido } = require("../utils/texto");

const router = express.Router();
const ROLES = [
  "Administrador académico",
  "Analista de Reclutamiento",
  "Profesional Evaluador",
  "Jefatura o contraparte simulada"
];

function publicUser(row) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    activo: row.activo
  };
}

function crearToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET debe estar configurado con al menos 32 caracteres.");
  }
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h"
  });
}

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ mensaje: "Ingresa correo y contraseña." });
    }

    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.activo,
              r.nombre AS rol
       FROM usuarios_sistema u
       JOIN roles_sistema r ON r.id = u.rol_id
       WHERE LOWER(u.email) = $1 LIMIT 1`,
      [email]
    );
    const user = result.rows[0];
    if (!user || !user.activo || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ mensaje: "Correo o contraseña incorrectos." });
    }

    const usuario = publicUser(user);
    return res.json({ token: crearToken(usuario), usuario });
  } catch (error) {
    console.error("Error de login:", error);
    return res.status(500).json({ mensaje: "No se pudo iniciar sesión." });
  }
});

router.get("/me", authenticateToken, (req, res) => {
  res.json({ usuario: req.user });
});

router.get("/usuarios", authenticateToken, requireRole("Administrador académico"), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.activo, u.creado_en, r.nombre AS rol
       FROM usuarios_sistema u JOIN roles_sistema r ON r.id = u.rol_id
       ORDER BY u.id`
    );
    res.json(result.rows.map(publicUser));
  } catch (error) {
    console.error("Error listando usuarios:", error);
    res.status(500).json({ mensaje: "No se pudieron consultar los usuarios." });
  }
});

router.post("/usuarios", authenticateToken, requireRole("Administrador académico"), async (req, res) => {
  try {
    const nombreSaneado = sanearTexto(req.body.nombre, { campo: "el nombre", requerido: true });
    if (nombreSaneado.error) return res.status(400).json({ mensaje: nombreSaneado.error });

    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const rol = String(req.body.rol || "").trim();

    if (nombreSaneado.valor.length < 2) {
      return res.status(400).json({ mensaje: "Ingresa un nombre y correo válidos." });
    }
    if (excedeLargo(nombreSaneado.valor, 150, "el nombre")) {
      return res.status(400).json({ mensaje: mensajeExcedeLargo("el nombre", 150) });
    }
    if (!esCorreoValido(email)) {
      return res.status(400).json({ mensaje: "Ingresa un nombre y correo válidos." });
    }
    if (password.length < 10) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 10 caracteres." });
    }
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ mensaje: "Selecciona uno de los roles permitidos." });
    }

    const roleResult = await pool.query("SELECT id FROM roles_sistema WHERE nombre = $1", [rol]);
    if (!roleResult.rows[0]) {
      return res.status(400).json({ mensaje: "El rol no está configurado en la base de datos." });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO usuarios_sistema (nombre, email, password_hash, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, activo, creado_en`,
      [nombreSaneado.valor, email, hash, roleResult.rows[0].id]
    );
    res.status(201).json({ usuario: { ...result.rows[0], rol } });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ mensaje: "Ya existe una cuenta con ese correo." });
    console.error("Error creando usuario:", error);
    res.status(500).json({ mensaje: "No se pudo crear el usuario." });
  }
});

router.patch("/usuarios/:id/estado", authenticateToken, requireRole("Administrador académico"), async (req, res) => {
  const id = Number(req.params.id);
  const activo = req.body.activo;
  if (!Number.isInteger(id) || id < 1 || typeof activo !== "boolean") {
    return res.status(400).json({ mensaje: "Datos de usuario inválidos." });
  }
  if (id === req.user.id && activo === false) {
    return res.status(400).json({ mensaje: "No puedes desactivar tu propia cuenta." });
  }
  try {
    const result = await pool.query(
      "UPDATE usuarios_sistema SET activo = $1, actualizado_en = NOW() WHERE id = $2 RETURNING id, activo",
      [activo, id]
    );
    if (!result.rows[0]) return res.status(404).json({ mensaje: "Usuario no encontrado." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error cambiando estado de usuario:", error);
    res.status(500).json({ mensaje: "No se pudo actualizar el usuario." });
  }
});

module.exports = router;
