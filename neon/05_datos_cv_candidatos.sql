-- Datos adicionales usados para generar el CV Word del candidato.
-- Ejecutar después de neon/02_tablas_principales.sql.
-- No modifica ni elimina los datos existentes.

ALTER TABLE candidatos
  ADD COLUMN IF NOT EXISTS perfil_profesional TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS educacion TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS habilidades TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_candidatos_cv_texto_utf8'
  ) THEN
    ALTER TABLE candidatos ADD CONSTRAINT ck_candidatos_cv_texto_utf8 CHECK (
      position(chr(65533) in coalesce(perfil_profesional, '')) = 0 AND
      position(chr(65533) in coalesce(educacion, '')) = 0 AND
      position(chr(65533) in coalesce(habilidades, '')) = 0
    );
  END IF;
END $$;
