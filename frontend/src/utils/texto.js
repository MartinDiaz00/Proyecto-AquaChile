/**
 * Utilidades de texto para el frontend.
 * El backend ya limpia y valida lo que se guarda; esto sirve para detectar
 * cualquier registro antiguo que venga con el carácter de reemplazo U+FFFD ("�")
 * producto de una codificación rota.
 */

export const CARACTER_REEMPLAZO = "\uFFFD";

/** true si el texto contiene el carácter de reemplazo U+FFFD. */
export function tieneCaracteresInvalidos(texto) {
  return Boolean(texto) && String(texto).includes(CARACTER_REEMPLAZO);
}
