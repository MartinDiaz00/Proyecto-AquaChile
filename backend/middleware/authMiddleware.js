const jwt = require("jsonwebtoken");
const pool = require("../db");

async function authenticateToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ mensaje: "Debes iniciar sesión." });
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET no está configurado.");
    return res.status(500).json({ mensaje: "Autenticación no configurada." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.activo, r.nombre AS rol
       FROM usuarios_sistema u
       JOIN roles_sistema r ON r.id = u.rol_id
       WHERE u.id = $1 LIMIT 1`,
      [payload.sub]
    );
    const user = result.rows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ mensaje: "La cuenta está inactiva o no existe." });
    }
    req.user = {
      id: Number(user.id),
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    };
    return next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
      console.error("Error verificando sesión:", error);
      return res.status(500).json({ mensaje: "No se pudo verificar la sesión." });
    }
    return res.status(401).json({ mensaje: "La sesión venció o el token no es válido." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ mensaje: "Debes iniciar sesión." });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ mensaje: "Tu rol no tiene permiso para realizar esta acción." });
    }
    return next();
  };
}

module.exports = { authenticateToken, requireRole };
