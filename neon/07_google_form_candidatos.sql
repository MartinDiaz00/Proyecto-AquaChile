-- Unicidad de correo para candidatos recibidos desde Google Forms.
-- Primero revisa y resuelve las filas duplicadas devueltas por esta consulta.
SELECT lower(btrim(correo)) AS correo_normalizado, COUNT(*) AS cantidad
FROM candidatos
WHERE correo IS NOT NULL AND btrim(correo) <> ''
GROUP BY lower(btrim(correo))
HAVING COUNT(*) > 1;

-- Ejecutar solo después de resolver cualquier duplicado encontrado.
-- Evita altas duplicadas incluso si dos envíos llegan simultáneamente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_candidatos_correo_normalizado
  ON candidatos (lower(btrim(correo)));
