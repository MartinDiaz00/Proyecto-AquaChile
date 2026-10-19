/**
 * Script de reparación de texto en la base de datos.
 *
 * Qué hace:
 *  1. Recorre todas las columnas de texto de las tablas públicas.
 *  2. Repara mojibake (texto UTF-8 leído como latin1): "conexiÃ³n" -> "conexión".
 *  3. Repara palabras con el carácter de reemplazo U+FFFD ("conexi�n" -> "conexión")
 *     usando un diccionario de palabras frecuentes.
 *  4. Aplica las restricciones CHECK que impiden guardar texto corrupto.
 *  5. Reporta lo que no pudo reparar para revisión manual.
 *
 * Uso:
 *   npm run reparar-texto           # repara y aplica restricciones
 *   npm run reparar-texto -- --dry  # solo informa, no escribe
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");
const {
  CARACTER_REEMPLAZO,
  contieneCaracteresInvalidos,
  repararMojibake,
  tieneMojibake,
} = require("../utils/texto");

const DRY_RUN = process.argv.includes("--dry") || process.argv.includes("--dry-run");

// Palabras frecuentes con tilde o Ñ que se usan para reconstruir textos
// donde el carácter original se perdió (quedó un U+FFFD).
const PALABRAS = [
  "año", "años", "conexión", "conexiones", "mañana", "tarde", "niño", "niños", "tamaño",
  "técnico", "técnica", "técnicos", "técnicas", "análisis", "evaluación", "evaluaciones",
  "evaluador", "evaluadora", "información", "organización", "diseño", "dimensión",
  "gestión", "administración", "resolución", "decisión", "decisiones", "posición",
  "atención", "prevención", "retención", "discreción", "motivación", "motivaciones",
  "orientación", "presentación", "selección", "inclusión", "acompañamiento",
  "psicolaboral", "psicológico", "psicológica", "clínica", "diagnóstico", "pronóstico",
  "psicología", "psicológico", "habilidad", "habilidades", "competencia", "competencias",
  "liderazgo", "responsabilidad", "proactividad", "resiliencia", "empatía", "motivación",
  "adaptación", "colaboración", "comunicación", "confidencialidad", "integridad",
  "desempeño", "satisfacción", "productividad", "creatividad", "innovación",
  "óptimo", "óptima", "criterio", "criterios", "personalidad", "personalidades",
  "médico", "médica", "psicólogo", "psicóloga", "óptica", "sistemática", "energía",
  "usabilidad", "accesibilidad", "vulnerabilidad", "resiliencia", "inmediatez",
  "ánimo", "ánimos", "líder", "líderes", "guía", "guías", "código", "códigos",
  "jurídico", "jurídica", "público", "pública", "básico", "básica", "práctico",
  "práctica", "técnico", "económico", "económica", "político", "política",
  "histórico", "histórica", "automático", "automática", "numérico", "numérica",
  "académico", "académica", "académicos", "psicóloga", "más", "días", "está",
  "están", "será", "estará", "después", "aquí", "allí", "así", "sí", "también",
  "está", "después", "además", "menor", "mayor", "último", "único", "única",
];

/**
 * Reconstruye palabras donde el carácter acentuado se perdió.
 * "conexi�n" -> "conexión" (el U+FFFD actúa como comodín).
 */
function repararPalabras(texto) {
  return String(texto).replace(/[\wÁÉÍÓÚÜÑáéíóúüñ\uFFFD]+/g, (palabra) => {
    if (!palabra.includes(CARACTER_REEMPLAZO)) return palabra;

    for (const candidata of PALABRAS) {
      if (candidata.length !== palabra.length) continue;

      let coincide = true;
      for (let i = 0; i < palabra.length; i += 1) {
        if (palabra[i] === CARACTER_REEMPLAZO) continue; // comodín
        if (palabra[i].toLowerCase() !== candidata[i].toLowerCase()) {
          coincide = false;
          break;
        }
      }
      if (!coincide) continue;

      // Conserva las mayúsculas del original.
      if (palabra[0] === palabra[0].toUpperCase() && palabra[0] !== palabra[0].toLowerCase()) {
        return candidata[0].toUpperCase() + candidata.slice(1);
      }
      return candidata;
    }
    return palabra;
  });
}

/** Aplica todas las reparaciones posibles a un texto. */
function repararTexto(texto) {
  if (texto === null || texto === undefined) return { valor: texto, cambiado: false };
  const original = String(texto);
  let salida = repararMojibake(original);
  salida = repararPalabras(salida);
  return { valor: salida, cambiado: salida !== original };
}

async function obtenerColumnasDeTexto() {
  const resultado = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND data_type IN ('text', 'character varying', 'character')
     ORDER BY table_name, ordinal_position`
  );
  return resultado.rows;
}

async function repararTabla({ table_name: tabla, column_name: columna }) {
  const filas = await pool.query(
    `SELECT ctid::text AS ctid, "${columna}" AS valor
     FROM "${tabla}"
     WHERE "${columna}" IS NOT NULL`
  );

  const cambios = [];
  const pendientes = [];

  for (const fila of filas.rows) {
    const { valor, cambiado } = repararTexto(fila.valor);
    if (cambiado) {
      cambios.push({ ctid: fila.ctid, antes: fila.valor, despues: valor });
    }
    if (contieneCaracteresInvalidos(valor)) {
      pendientes.push({ ctid: fila.ctid, valor });
    }
  }

  if (cambios.length && !DRY_RUN) {
    for (const cambio of cambios) {
      await pool.query(
        `UPDATE "${tabla}" SET "${columna}" = $1 WHERE ctid = $2::tid`,
        [cambio.despues, cambio.ctid]
      );
    }
  }

  return { cambios, pendientes };
}

async function aplicarRestricciones() {
  const archivo = path.join(__dirname, "..", "..", "neon", "03_sanitizacion_texto.sql");
  if (!fs.existsSync(archivo)) {
    console.log("No se encontró neon/03_sanitizacion_texto.sql, se omiten las restricciones.");
    return;
  }
  const sql = fs.readFileSync(archivo, "utf8");
  if (DRY_RUN) {
    console.log("[dry-run] Se omiten las restricciones CHECK.");
    return;
  }
  await pool.query(sql);
  console.log("Restricciones CHECK aplicadas.");
}

async function main() {
  console.log(DRY_RUN ? "=== Reparación de texto (modo simulación) ===" : "=== Reparación de texto ===");

  const columnas = await obtenerColumnasDeTexto();
  console.log(`Columnas de texto revisadas: ${columnas.length}\n`);

  let totalCambios = 0;
  let totalPendientes = 0;

  for (const columna of columnas) {
    const { cambios, pendientes } = await repararTabla(columna);
    if (cambios.length === 0 && pendientes.length === 0) continue;

    console.log(`[${columna.table_name}.${columna.column_name}]`);
    for (const cambio of cambios) {
      totalCambios += 1;
      console.log(`  - ${JSON.stringify(cambio.antes)} -> ${JSON.stringify(cambio.despues)}`);
    }
    for (const pendiente of pendientes) {
      totalPendientes += 1;
      console.log(`  ! Sin reparación automática (revisar a mano): ${JSON.stringify(pendiente.valor)}`);
    }
    console.log("");
  }

  console.log(`Correcciones aplicadas: ${totalCambios}`);
  console.log(`Textos que requieren revisión manual: ${totalPendientes}`);

  if (totalPendientes === 0) {
    await aplicarRestricciones();
  } else {
    console.log("\nNo se aplican las restricciones CHECK hasta corregir los textos pendientes.");
  }

  const mojibakeRestante = await pool.query(
    `SELECT id, aspectos_indagar FROM solicitudes WHERE aspectos_indagar ~ 'Ã|Â'`
  );
  if (mojibakeRestante.rows.length) {
    console.log("\nAún hay posibles mojibake en solicitudes.aspectos_indagar:");
    for (const fila of mojibakeRestante.rows) {
      console.log(`  - id=${fila.id}: ${JSON.stringify(fila.aspectos_indagar)}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("No se pudo reparar el texto:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
