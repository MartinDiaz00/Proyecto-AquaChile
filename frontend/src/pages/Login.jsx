import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { iniciarSesion } = useAuth();
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("Analista de Reclutamiento");
  const [error, setError] = useState("");

  const roles = [
    "Administrador académico",
    "Analista de Reclutamiento",
    "Profesional Evaluador",
    "Jefatura o contraparte simulada",
  ];

  const manejarEnvio = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("Ingresa tu nombre para continuar");
      return;
    }
    iniciarSesion(nombre.trim(), rol);
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card border-0 shadow p-4" style={{ maxWidth: "420px", width: "100%" }}>
        <div className="text-center mb-4">
          <i className="bi bi-water fs-1" style={{ color: "var(--turquesa)" }}></i>
          <h4 className="mt-2 mb-0" style={{ color: "var(--azul-profundo)" }}>SGP Psicolaboral</h4>
          <p className="text-muted small mb-0">Acceso con usuario simulado (académico)</p>
        </div>

        <form onSubmit={manejarEnvio} noValidate>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className={`form-control ${error ? "is-invalid" : ""}`}
              placeholder="Ej: María Victoria"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError(""); }}
            />
            {error && <div className="invalid-feedback">{error}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label">Rol</label>
            <select className="form-select" value={rol} onChange={(e) => setRol(e.target.value)}>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            <i className="bi bi-box-arrow-in-right me-2"></i>Ingresar
          </button>
        </form>

        <p className="text-muted small text-center mt-3 mb-0">
          Usuario y roles simulados para fines académicos — sin contraseña real.
        </p>
      </div>
    </div>
  );
}

export default Login;