require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

async function main() {
  const nombre = String(process.env.ADMIN_NAME || "Administrador").trim();
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Define ADMIN_EMAIL con un correo válido en backend/.env.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres.");
  }

  const role = await pool.query(
    "SELECT id FROM roles_sistema WHERE nombre = 'Administrador académico' LIMIT 1"
  );
  if (!role.rows[0]) {
    throw new Error("No se encuentran los roles. Ejecuta primero neon/01_roles_y_usuarios.sql.");
  }

  const existing = await pool.query(
    "SELECT id FROM usuarios_sistema WHERE LOWER(email) = $1 LIMIT 1",
    [email]
  );
  if (existing.rows[0]) {
    console.log(`Ya existe una cuenta para ${email}. No se modificó la contraseña.`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO usuarios_sistema (nombre, email, password_hash, rol_id)
     VALUES ($1, $2, $3, $4)`,
    [nombre || "Administrador", email, hash, role.rows[0].id]
  );
  console.log(`Administrador creado: ${email}`);
}

main()
  .catch((error) => {
    console.error("No se pudo crear el administrador:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
