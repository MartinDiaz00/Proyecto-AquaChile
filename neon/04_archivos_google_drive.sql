-- Metadatos de CV guardados en Google Drive. Ejecutar después de 02_tablas_principales.sql.
CREATE TABLE IF NOT EXISTS archivos_candidato (
  id SERIAL PRIMARY KEY,
  candidato_id INTEGER NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  drive_item_id VARCHAR(255) NOT NULL UNIQUE,
  storage_provider VARCHAR(30) NOT NULL DEFAULT 'google_drive'
    CHECK (storage_provider IN ('google_drive', 'onedrive')),
  nombre_archivo VARCHAR(255) NOT NULL,
  web_url TEXT NOT NULL,
  tipo_contenido VARCHAR(150) NOT NULL,
  tamano_bytes BIGINT NOT NULL CHECK (tamano_bytes > 0),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Las filas existentes pertenecen a OneDrive. Se conservan para que sus enlaces
-- sigan disponibles y no se intenten borrar usando el identificador de Google Drive.
ALTER TABLE archivos_candidato
  ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(30) NOT NULL DEFAULT 'onedrive'
  CHECK (storage_provider IN ('google_drive', 'onedrive'));

CREATE INDEX IF NOT EXISTS idx_archivos_candidato_candidato
  ON archivos_candidato(candidato_id);
