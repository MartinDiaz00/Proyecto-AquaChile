import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";

const AuthContext = createContext(null);

const PERMISOS_POR_ROL = {
  "Administrador académico": { candidatos: true, solicitudes: true, crearSolicitud: true, avanzar: true, evaluar: true, usuarios: true },
  "Analista de Reclutamiento": { candidatos: true, solicitudes: true, crearSolicitud: true, avanzar: false, evaluar: false, usuarios: false },
  "Profesional Evaluador": { candidatos: false, solicitudes: true, crearSolicitud: false, avanzar: true, evaluar: true, usuarios: false },
  "Jefatura o contraparte simulada": { candidatos: false, solicitudes: true, crearSolicitud: false, avanzar: false, evaluar: false, usuarios: false },
};

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    if (!localStorage.getItem("tokenSGP")) return null;
    try { return JSON.parse(localStorage.getItem("usuarioSGP") || "null"); }
    catch { return null; }
  });
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem("tokenSGP")));

  const cerrarSesion = () => {
    localStorage.removeItem("tokenSGP");
    localStorage.removeItem("usuarioSGP");
    setUsuario(null);
  };

  useEffect(() => {
    let vigente = true;
    const token = localStorage.getItem("tokenSGP");
    if (!token) {
      setCargando(false);
      return undefined;
    }

    apiFetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!vigente) return;
        const data = await res.safeJson();
        if (!res.ok) throw new Error(data.mensaje || "Sesión no válida.");
        return data.usuario;
      })
      .then((user) => {
        if (vigente) {
          setUsuario(user);
          localStorage.setItem("usuarioSGP", JSON.stringify(user));
        }
      })
      .catch(() => {
        if (!vigente) return;
        localStorage.removeItem("tokenSGP");
        localStorage.removeItem("usuarioSGP");
        setUsuario(null);
      })
      .finally(() => { if (vigente) setCargando(false); });

    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    const expirada = () => cerrarSesion();
    window.addEventListener("sgp-session-expired", expirada);
    return () => window.removeEventListener("sgp-session-expired", expirada);
  }, []);

  const iniciarSesion = async (email, password) => {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(email || "").trim(), password: String(password || "") }),
    });
    const data = await response.safeJson();
    if (!response.ok) throw new Error(data.mensaje || "No se pudo iniciar sesión.");
    localStorage.setItem("tokenSGP", data.token);
    localStorage.setItem("usuarioSGP", JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  };

  const permisos = useMemo(() => usuario ? (PERMISOS_POR_ROL[usuario.rol] || {}) : {}, [usuario]);

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, permisos }}>
      {children}
    </AuthContext.Provider>
  );
}
