import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
export function useAuth() {
  return useContext(AuthContext);
}

const PERMISOS = {
  "Administrador académico": { candidatos: true, solicitudes: true, avanzar: true, evaluar: true },
  "Analista de Reclutamiento": { candidatos: true, solicitudes: true, avanzar: false, evaluar: false },
  "Profesional Evaluador": { candidatos: false, solicitudes: false, avanzar: true, evaluar: true },
  "Jefatura o contraparte simulada": { candidatos: false, solicitudes: false, avanzar: false, evaluar: false },
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("usuarioSGP");
    return guardado ? JSON.parse(guardado) : null;
  });

  const iniciarSesion = (nombre, rol) => {
    const nuevoUsuario = { nombre, rol };
    localStorage.setItem("usuarioSGP", JSON.stringify(nuevoUsuario));
    setUsuario(nuevoUsuario);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSGP");
    setUsuario(null);
  };

  const permisos = usuario ? PERMISOS[usuario.rol] : {};

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion, permisos }}>
      {children}
    </AuthContext.Provider>
  );
}