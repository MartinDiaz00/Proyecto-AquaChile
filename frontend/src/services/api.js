const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/$/, "");

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text, _nonJson: true };
  }
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("tokenSGP");
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // Normalizar path: si empieza con http, usarla tal cual; si no, anteponer API_URL
  const fullUrl = path.startsWith("http") ? path : `${API_URL}${path}`;

  let response;
  try {
    response = await fetch(fullUrl, { ...options, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
  }

  if (response.status === 401) {
    localStorage.removeItem("tokenSGP");
    localStorage.removeItem("usuarioSGP");
    window.dispatchEvent(new Event("sgp-session-expired"));
  }

  response.safeJson = () => safeJson(response);
  return response;
}

export { API_URL };
