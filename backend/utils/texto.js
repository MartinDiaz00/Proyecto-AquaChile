/**
 * Utilidades de saneado de texto.
 *
 * Objetivo: que tildes, eñes y símbolos nunca lleguen corruptos a la base de
 * datos. En Postgres (UTF8) un texto roto no se puede guardar: o se rechaza o
 * queda el carácter de reemplazo U+FFFD ("�"), que es lo que se veía en la
 * columna aspectos_indagar.
 *
 * Tres problemas que corrige:
 *  1. Mojibake: texto UTF-8 decodificado como latin1 ("conexiÃ³n" -> "conexión").
 *  2. Caracteres de reemplazo U+FFFD: el original se perdió, no es reparable,
 *     así que se rechaza el dato para que la persona lo vuelva a escribir.
 *  3. Caracteres de control / espacios no separables: se limpian.
 */

const CARACTER_REEMPLAZO = "\uFFFD"; // "�"

// Secuencias típicas de texto UTF-8 interpretado como latin1/cp1252.
const PATRON_MOJIBAKE =
  /[ÂÃâ][\u0080-\u00BF\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020-\u2026\u2030-\u203E]|[\u0080-\u009F]/;

// Reemplazos directos para los casos donde no se puede reinterpretar la cadena
// completa (por ejemplo cuando el texto ya trae acentos correctos y letras
// acentuadas que no caben en latin1).
const MAPA_DIRECTO = {
  "Ã¡": "á",
  "Ã©": "é",
  "Ã­": "í",
  "Ã³": "ó",
  "Ãº": "ú",
  "Ã±": "ñ",
  "Ã¼": "ü",
  "Ã½": "ÿ",
  "Ã\u0081": "Á",
  "Ã\u0089": "É",
  "Ã\u008D": "Í",
  "Ã\u0093": "Ó",
  "Ã\u009A": "Ú",
  "Ã\u0091": "Ñ",
  "Ã\u009C": "Ü",
  "â€œ": "“",
  "â€\u009D": "”",
  "â€“": "–",
  "â€”": "—",
  "â€¦": "…",
  "Â°": "°",
  "Â«": "«",
  "Â»": "»",
  "Â ": " ",
};

const RE_CARACTERES_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const RE_CERO_ANCHO = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
const RE_ESPACIOS_REPETIDOS = /[ \t]{2,}/g;

/** Cantidad de secuencias con aspecto de mojibake dentro de un texto. */
function contarMojibake(texto) {
  if (!texto) return 0;
  const coincidencias = String(texto).match(new RegExp(PATRON_MOJIBAKE.source, "g"));
  return coincidencias ? coincidencias.length : 0;
}

/** true si el texto parece UTF-8 decodificado con el charset equivocado. */
function tieneMojibake(texto) {
  return contarMojibake(texto) > 0;
}

/**
 * Intenta recuperar un texto con mojibake.
 * Reinterpreta los bytes latin1 como UTF-8; solo acepta el resultado si quedan
 * menos secuencias rotas que antes y no aparece el carácter de reemplazo.
 */
function repararMojibake(texto) {
  if (!texto) return texto;
  let actual = String(texto);
  if (!tieneMojibake(actual)) return actual;

  // La reinterpretación solo es segura si todos los caracteres caben en latin1.
  const cabeEnLatin1 = [...actual].every((c) => c.codePointAt(0) <= 0xff);
  if (cabeEnLatin1) {
    const candidato = Buffer.from(actual, "latin1").toString("utf8");
    if (!candidato.includes(CARACTER_REEMPLAZO) && contarMojibake(candidato) < contarMojibake(actual)) {
      // Segunda pasada: cubre el doble decodificación (latin1 -> cp1252 -> latin1).
      return repararMojibake(candidato);
    }
  }

  // Plan B: reemplazo de las secuencias más frecuentes.
  let salida = actual;
  for (const [malo, bueno] of Object.entries(MAPA_DIRECTO)) {
    if (salida.includes(malo)) salida = salida.split(malo).join(bueno);
  }
  return salida;
}

/** true si el texto contiene el carácter de reemplazo U+FFFD (dato irrecuperable). */
function contieneCaracteresInvalidos(texto) {
  return Boolean(texto) && String(texto).includes(CARACTER_REEMPLAZO);
}

/** Quita caracteres de control, ceros invisibles y normaliza espacios. */
function limpiarCaracteres(texto) {
  if (!texto) return texto;
  return String(texto)
    .replace(RE_CARACTERES_CONTROL, "")
    .replace(RE_CERO_ANCHO, "")
    .replace(/\u00A0/g, " ")
    .replace(RE_ESPACIOS_REPETIDOS, " ")
    .trim();
}

/**
 * Sanea un texto de entrada.
 * @param {*} valor
 * @param {{ campo?: string, requerido?: boolean }} opciones
 * @returns {{ valor: string|null, error: string|null, reparado: boolean }}
 */
function sanearTexto(valor, opciones = {}) {
  const { campo = "el texto", requerido = false } = opciones;

  if (valor === undefined || valor === null || String(valor).trim() === "") {
    return { valor: requerido ? "" : null, error: requerido ? `Ingresa ${campo}.` : null, reparado: false };
  }

  const original = String(valor);
  let salida = repararMojibake(original);
  const reparado = salida !== original;
  salida = limpiarCaracteres(salida);

  if (contieneCaracteresInvalidos(salida)) {
    return {
      valor: null,
      reparado,
      error:
        `Revisa ${campo}: contiene caracteres de codificación inválidos (${CARACTER_REEMPLAZO}). ` +
        "Vuelve a escribirlo con las tildes y la Ñ correctas.",
    };
  }

  return { valor: salida, error: null, reparado };
}

/** Mensaje para texto que excede el largo de la columna. */
function mensajeExcedeLargo(campo, maximo) {
  return `Revisa ${campo}: el máximo permitido es ${maximo} caracteres.`;
}

/** Valida que un texto no exceda el largo de la columna. */
function excedeLargo(valor, maximo, campo) {
  if (valor === null || valor === undefined) return false;
  return String(valor).length > maximo;
}

/** true si el texto tiene formato de correo válido. */
function esCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || "").trim());
}

/** true si el texto tiene formato de fecha ISO (YYYY-MM-DD) y es una fecha real. */
function esFechaValida(fecha) {
  const texto = String(fecha || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split("-").map(Number);
  const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fechaObj.getUTCFullYear() === anio &&
    fechaObj.getUTCMonth() === mes - 1 &&
    fechaObj.getUTCDate() === dia
  );
}

module.exports = {
  CARACTER_REEMPLAZO,
  contarMojibake,
  tieneMojibake,
  repararMojibake,
  contieneCaracteresInvalidos,
  limpiarCaracteres,
  sanearTexto,
  excedeLargo,
  mensajeExcedeLargo,
  esCorreoValido,
  esFechaValida,
};
