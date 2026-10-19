-- Restricciones de integridad para texto UTF-8 (Neon / PostgreSQL)
-- Ejecutar DESPUÉS de neon/01_roles_y_usuarios.sql y neon/02_tablas_principales.sql
-- y DESPUÉS de correr `npm run reparar-texto` en el backend.
--
-- Objetivo: impedir que la base de datos guarde texto con el carácter de
-- reemplazo U+FFFD ("�"), que es lo que produce el mojibake tipo "conexi�n".
-- chr(65533) genera ese carácter sin depender de cómo se guarde este archivo.
--
-- No modifica ni elimina datos existentes: solo agrega restricciones.
-- Es idempotente: se puede ejecutar más de una vez sin error.

-- Candidatos -----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_candidatos_texto_utf8') THEN
    ALTER TABLE candidatos ADD CONSTRAINT ck_candidatos_texto_utf8 CHECK (
      position(chr(65533) in coalesce(nombre, '')) = 0 AND
      position(chr(65533) in coalesce(correo, '')) = 0 AND
      position(chr(65533) in coalesce(telefono, '')) = 0 AND
      position(chr(65533) in coalesce(cargo_postulado, '')) = 0 AND
      position(chr(65533) in coalesce(familia_cargo, '')) = 0
    );
  END IF;
END $$;

-- Solicitudes ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_solicitudes_texto_utf8') THEN
    ALTER TABLE solicitudes ADD CONSTRAINT ck_solicitudes_texto_utf8 CHECK (
      position(chr(65533) in coalesce(cargo, '')) = 0 AND
      position(chr(65533) in coalesce(familia_cargo, '')) = 0 AND
      position(chr(65533) in coalesce(responsable, '')) = 0 AND
      position(chr(65533) in coalesce(observaciones, '')) = 0 AND
      position(chr(65533) in coalesce(origen_candidato, '')) = 0 AND
      position(chr(65533) in coalesce(unidad, '')) = 0 AND
      position(chr(65533) in coalesce(ceco, '')) = 0 AND
      position(chr(65533) in coalesce(aspectos_indagar, '')) = 0
    );
  END IF;
END $$;

-- Evaluaciones ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_evaluaciones_texto_utf8') THEN
    ALTER TABLE evaluaciones ADD CONSTRAINT ck_evaluaciones_texto_utf8 CHECK (
      position(chr(65533) in coalesce(observaciones, '')) = 0 AND
      position(chr(65533) in coalesce(resultado, '')) = 0
    );
  END IF;
END $$;

-- Usuarios del sistema -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_usuarios_texto_utf8') THEN
    ALTER TABLE usuarios_sistema ADD CONSTRAINT ck_usuarios_texto_utf8 CHECK (
      position(chr(65533) in coalesce(nombre, '')) = 0 AND
      position(chr(65533) in coalesce(email, '')) = 0
    );
  END IF;
END $$;
