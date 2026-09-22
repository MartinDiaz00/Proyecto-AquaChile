import { useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Candidatos() {
  const { candidatos, agregarCandidato, editarCandidato } = useData();
  const { permisos } = useAuth();
  const { mostrarToast } = useToast();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const formVacio = { nombre: "", correo: "", telefono: "", cargoPostulado: "", familiaCargo: "" };
  const [form, setForm] = useState(formVacio);
  const [errores, setErrores] = useState({});

  const familiasCargo = ["Profesional A", "Profesional B", "Operario Calificado", "Supervisor B", "Jefatura"];

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!form.correo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(form.correo)) {
      nuevosErrores.correo = "El correo no tiene un formato válido";
    }
    if (!form.cargoPostulado.trim()) nuevosErrores.cargoPostulado = "El cargo es obligatorio";
    if (!form.familiaCargo) nuevosErrores.familiaCargo = "Selecciona una familia de cargo";
    return nuevosErrores;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setEnviando(true);
    try {
      if (editandoId) {
        await editarCandidato(editandoId, form);
        mostrarToast("Candidato actualizado correctamente");
      } else {
        await agregarCandidato(form);
        mostrarToast("Candidato registrado correctamente");
      }
      cerrarFormulario();
    } catch (error) {
      mostrarToast("Ocurrió un error al guardar. Revisa el backend.", "error");
    } finally {
      setEnviando(false);
    }
  };

  const empezarEdicion = (candidato) => {
    setForm({
      nombre: candidato.nombre,
      correo: candidato.correo,
      telefono: candidato.telefono || "",
      cargoPostulado: candidato.cargoPostulado || "",
      familiaCargo: candidato.familiaCargo || "",
    });
    setEditandoId(candidato.id);
    setMostrarForm(true);
  };

  const cerrarFormulario = () => {
    setForm(formVacio);
    setErrores({});
    setEditandoId(null);
    setMostrarForm(false);
  };

  const candidatosFiltrados = candidatos.filter((c) => {
    const texto = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(texto) ||
      (c.correo || "").toLowerCase().includes(texto) ||
      (c.cargoPostulado || "").toLowerCase().includes(texto)
    );
  });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white">
          <i className="bi bi-people-fill me-2"></i>Candidatos
        </h2>
        {permisos.candidatos && (
          <button
            className="btn btn-primary"
            onClick={() => (mostrarForm ? cerrarFormulario() : setMostrarForm(true))}
          >
            {mostrarForm ? "Cancelar" : "+ Nuevo candidato"}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form className="card card-body mb-4 border-0 shadow-sm" onSubmit={manejarEnvio} noValidate>
          <h6 className="text-muted mb-3">{editandoId ? "Editando candidato" : "Nuevo candidato"}</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                name="nombre"
                className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                value={form.nombre}
                onChange={manejarCambio}
              />
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Correo</label>
              <input
                type="email"
                name="correo"
                className={`form-control ${errores.correo ? "is-invalid" : ""}`}
                value={form.correo}
                onChange={manejarCambio}
              />
              {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                name="telefono"
                className="form-control"
                value={form.telefono}
                onChange={manejarCambio}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Cargo al que postula</label>
              <input
                type="text"
                name="cargoPostulado"
                className={`form-control ${errores.cargoPostulado ? "is-invalid" : ""}`}
                value={form.cargoPostulado}
                onChange={manejarCambio}
              />
              {errores.cargoPostulado && <div className="invalid-feedback">{errores.cargoPostulado}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Familia de cargo</label>
              <select
                name="familiaCargo"
                className={`form-select ${errores.familiaCargo ? "is-invalid" : ""}`}
                value={form.familiaCargo}
                onChange={manejarCambio}
              >
                <option value="">Selecciona una opción</option>
                {familiasCargo.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {errores.familiaCargo && <div className="invalid-feedback">{errores.familiaCargo}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-success mt-3" disabled={enviando}>
            {enviando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar candidato"}
          </button>
        </form>
      )}

      <div className="mb-3" style={{ maxWidth: "360px" }}>
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Buscar por nombre, correo o cargo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Cargo postulado</th>
              <th>Familia de cargo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {candidatosFiltrados.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.correo}</td>
                <td>{c.telefono}</td>
                <td>{c.cargoPostulado}</td>
                <td>{c.familiaCargo}</td>
                <td>
                  {permisos.candidatos && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => empezarEdicion(c)}>
                      <i className="bi bi-pencil-fill me-1"></i>Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {candidatosFiltrados.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                  {candidatos.length === 0 ? "Aún no hay candidatos registrados." : "Ningún candidato coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Candidatos;