-- Compatibilidad con tablas candidatos preexistentes que usan email en vez de correo
-- y que aún no tienen los campos de cargo usados por la aplicación.
-- Ejecutar después de neon/02_tablas_principales.sql y neon/05_datos_cv_candidatos.sql.
-- Conserva los valores existentes y no elimina columnas ni registros.

ALTER TABLE candidatos
  ADD COLUMN IF NOT EXISTS correo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cargo_postulado VARCHAR(150) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS familia_cargo VARCHAR(100) NOT NULL DEFAULT '';

UPDATE candidatos
SET correo = COALESCE(NULLIF(BTRIM(correo), ''), NULLIF(BTRIM(email), '')),
    email = COALESCE(NULLIF(BTRIM(email), ''), NULLIF(BTRIM(correo), ''))
WHERE NULLIF(BTRIM(correo), '') IS NULL
   OR NULLIF(BTRIM(email), '') IS NULL;
