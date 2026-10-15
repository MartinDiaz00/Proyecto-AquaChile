import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center px-3" style={{ minHeight: "100vh" }}>
      <div className="card border-0 shadow-lg p-4" style={{ maxWidth: "420px", width: "100%", backgroundColor: "rgba(255,255,255,0.98)" }}>
        <div className="text-center mb-4">
          <i className="bi bi-water fs-1" style={{ color: "var(--turquesa)" }}></i>
          <h4 className="mt-2 mb-0 fuente-marca fw-bold" style={{ color: "var(--azul-profundo)" }}>SGP Psicolaboral</h4>
          <p className="text-muted small mb-0">Inicia sesión con tu cuenta</p>
        </div>
        <form onSubmit={manejarEnvio}>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label">Correo electrónico</label>
            <input id="login-email" type="email" className="form-control" autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="mb-3">
            <label htmlFor="login-password" className="form-label">Contraseña</label>
            <input id="login-password" type="password" className="form-control" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            <i className="bi bi-box-arrow-in-right me-2"></i>{enviando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
        <p className="text-muted small text-center mt-3 mb-0">Si no tienes una cuenta, solicita acceso al administrador del sistema.</p>
      </div>
    </div>
  );
}

export default Login;
