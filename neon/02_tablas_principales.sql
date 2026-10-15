-- Tablas principales del SGP Psicolaboral (Neon)
-- Ejecutar DESPUÉS de neon/01_roles_y_usuarios.sql
-- No elimina ni modifica datos existentes; solo crea si no existen.

-- Tabla de candidatos
CREATE TABLE IF NOT EXISTS candidatos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  cargo_postulado VARCHAR(150) NOT NULL,
  familia_cargo VARCHAR(100) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidatos_nombre ON candidatos(nombre);
CREATE INDEX IF NOT EXISTS idx_candidatos_correo ON candidatos(correo);

-- Tabla de solicitudes
CREATE TABLE IF NOT EXISTS solicitudes (
  id SERIAL PRIMARY KEY,
  candidato_id INTEGER NOT NULL REFERENCES candidatos(id),
  cargo VARCHAR(150) NOT NULL,
  familia_cargo VARCHAR(100) NOT NULL,
  fecha_solicitud DATE NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
  responsable VARCHAR(150) NOT NULL,
  observaciones TEXT DEFAULT '',
  origen_candidato VARCHAR(50),
  unidad VARCHAR(150),
  requiere_referencias BOOLEAN DEFAULT FALSE,
  ceco VARCHAR(100),
  cv_adjunto BOOLEAN DEFAULT FALSE,
  descriptor_adjunto BOOLEAN DEFAULT FALSE,
  aspectos_indagar TEXT,
  es_referido BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_candidato ON solicitudes(candidato_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha ON solicitudes(fecha_solicitud);

-- Tabla de evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
  id SERIAL PRIMARY KEY,
  solicitud_id INTEGER NOT NULL UNIQUE REFERENCES solicitudes(id),
  fecha_evaluacion DATE NOT NULL,
  resultado VARCHAR(50) NOT NULL CHECK (resultado IN ('Recomendado', 'Recomendado con observaciones', 'No recomendado')),
  observaciones TEXT DEFAULT '',
  estado VARCHAR(30) NOT NULL DEFAULT 'Completada',
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_solicitud ON evaluaciones(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_resultado ON evaluaciones(resultado);

-- Comentarios para documentar el esquema
COMMENT ON TABLE candidatos IS 'Catálogo de candidatos a evaluar psicolaboralmente';
COMMENT ON TABLE solicitudes IS 'Solicitudes de evaluación vinculadas a un candidato';
COMMENT ON TABLE evaluaciones IS 'Resultados de evaluación psicolaboral por solicitud';
