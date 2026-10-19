import { tieneCaracteresInvalidos } from "../utils/texto";

/**
 * Muestra un texto y lo marca cuando viene con caracteres de codificación
 * inválidos, para que el dato problemático sea visible de inmediato.
 */
export default function TextoSano({ valor, fallback = "—" }) {  const texto = valor ? String(valor) : "";
  if (!texto) return <>{fallback}</>;

  if (tieneCaracteresInvalidos(texto)) {
    return (
      <span className="text-danger" title="El texto contiene caracteres de codificación inválidos">
        <i className="bi bi-exclamation-triangle-fill me-1"></i>
        {texto}
      </span>
    );
  }

  return <>{texto}</>;
}

export { TextoSano };
