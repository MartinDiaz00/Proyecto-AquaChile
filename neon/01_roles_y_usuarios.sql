-- Script de inicialización para Neon (PostgreSQL)
-- Ejecutar en el SQL Editor de Neon
-- Crea las tablas roles_sistema y usuarios_sistema si no existen.
-- No elimina ni modifica candidatos, solicitudes o evaluaciones.

-- Tabla de roles del sistema
CREATE TABLE IF NOT EXISTS roles_sistema (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES roles_sistema(id),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar consultas de autenticación
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_email ON usuarios_sistema(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_rol ON usuarios_sistema(rol_id);

-- Insertar roles base si no existen
INSERT INTO roles_sistema (nombre) VALUES
  ('Administrador académico'),
  ('Analista de Reclutamiento'),
  ('Profesional Evaluador'),
  ('Jefatura o contraparte simulada')
ON CONFLICT (nombre) DO NOTHING;
