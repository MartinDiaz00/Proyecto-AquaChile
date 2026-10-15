import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  "Administrador académico",
  "Analista de Reclutamiento",
  "Profesional Evaluador",
  "Jefatura o contraparte simulada",
];

export default function Usuarios() {
  const { usuario, permisos } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "Analista de Reclutamiento" });
  const [confirmando, setConfirmando] = useState(null); // id del usuario a cambiar estado

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const response = await apiFetch("/auth/usuarios");
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.mensaje || "No se pudieron cargar los usuarios.");
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { if (permisos.usuarios) cargarUsuarios(); }, [permisos.usuarios, cargarUsuarios]);

  if (!permisos.usuarios) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <i className="bi bi-shield-exclamation me-2"></i>No tienes permiso para administrar usuarios.
        </div>
      </div>
    );
  }

  const crearUsuario = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setGuardando(true);
    try {
      const response = await apiFetch("/auth/usuarios", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.mensaje || "No se pudo crear el usuario.");
      setMensaje(`Usuario ${data.usuario.nombre} creado correctamente.`);
      setForm({ nombre: "", email: "", password: "", rol: "Analista de Reclutamiento" });
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id, email, activo) => {
    setError("");
    setMensaje("");
    try {
      const response = await apiFetch(`/auth/usuarios/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ activo }),
      });
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.mensaje || "No se pudo actualizar el usuario.");
      setMensaje(`Cuenta ${email} ${data.activo ? "activada" : "desactivada"}.`);
      setConfirmando(null);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
      setConfirmando(null);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <h2 className="text-white mb-4"><i className="bi bi-person-gear me-2"></i>Administración de usuarios</h2>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3">Crear cuenta</h5>
          <form onSubmit={crearUsuario}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="usuario-nombre">Nombre completo</label>
                <input id="usuario-nombre" className="form-control" value={form.nombre} required minLength={2}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="usuario-email">Correo</label>
                <input id="usuario-email" type="email" className="form-control" value={form.email} required
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="usuario-password">Contraseña inicial</label>
                <input id="usuario-password" type="password" className="form-control" value={form.password} required minLength={10} autoComplete="new-password"
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <div className="form-text">Mínimo 10 caracteres. Comunica la clave de forma segura al usuario.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="usuario-rol">Rol</label>
                <select id="usuario-rol" className="form-select" value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
                </select>
              </div>
            </div>
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            {mensaje && <div className="alert alert-success mt-3 mb-0">{mensaje}</div>}
            <button className="btn btn-primary mt-3" disabled={guardando}>
              <i className="bi bi-person-plus me-1"></i>{guardando ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Cuentas registradas</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={cargarUsuarios} disabled={cargando}>
              <i className="bi bi-arrow-clockwise me-1"></i>Actualizar
            </button>
          </div>

          {cargando ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando usuarios...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th className="text-end">Acciones</th></tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>
                        {u.nombre}
                        {Number(u.id) === Number(usuario.id) && <span className="badge text-bg-info ms-2">Tú</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.rol}</td>
                      <td><span className={`badge ${u.activo ? "text-bg-success" : "text-bg-secondary"}`}>{u.activo ? "Activo" : "Inactivo"}</span></td>
                      <td className="text-end">
                        {Number(u.id) !== Number(usuario.id) && (
                          <>
                            {confirmando === u.id ? (
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-success" onClick={() => cambiarEstado(u.id, u.email, !u.activo)}>
                                  <i className="bi bi-check me-1"></i>{u.activo ? "Activar" : "Desactivar"}
                                </button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmando(null)}>
                                  <i className="bi bi-x me-1"></i>Cancelar
                                </button>
                              </div>
                            ) : (
                              <button className={`btn btn-sm ${u.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                                onClick={() => setConfirmando(u.id)}
                                title={u.activo ? "Desactivar cuenta" : "Activar cuenta"}>
                                {u.activo ? <><i className="bi bi-pause-fill me-1"></i>Desactivar</> : <><i className="bi bi-play-fill me-1"></i>Activar</>}
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!usuarios.length && <tr><td colSpan="5" className="text-center text-muted py-4">No hay usuarios registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
