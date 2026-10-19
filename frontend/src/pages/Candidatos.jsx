import { useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { TextoSano } from "../components/TextoSano";

function Candidatos() {
  const { candidatos, agregarCandidato, editarCandidato, eliminarCandidato, guardando } = useData();
  const { permisos } = useAuth();
  const { mostrarToast } = useToast();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [eliminandoId, setEliminandoId] = useState(null);

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
        mostrarToast("Candidato actualizado correctamente", "success");
      } else {
        await agregarCandidato(form);
        mostrarToast("Candidato creado correctamente", "success");
      }

      cerrarFormulario();
    } catch (error) {
      console.error("Error al guardar candidato:", error);
      // Mostrar mensaje detallado para facilitar depuración
      mostrarToast(`Error al guardar: ${error.message}`, "error");
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

  const confirmarEliminar = async (id, nombre) => {
    const seguro = window.confirm(
      `¿Estás seguro de que deseas eliminar al candidato "${nombre}"?\n\nEsta acción no se puede deshacer si el candidato tiene solicitudes asociadas.`
    );
    if (!seguro) return;

    setEliminandoId(id);
    try {
      await eliminarCandidato(id);
      mostrarToast("Candidato eliminado correctamente", "success");
    } catch (error) {
      console.error("Error eliminando candidato:", error);
      mostrarToast(`Error al eliminar: ${error.message}`, "error");
    } finally {
      setEliminandoId(null);
    }
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
      {/* Header con gradiente */}
      <div className="candidatos-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2>
              <i className="bi bi-people-fill me-2"></i>Candidatos
            </h2>
            <p>Gestiona los candidatos para evaluación psicolaboral</p>
          </div>
          {permisos.candidatos && (
            <button
              className="btn-accion-candidato"
              disabled={guardando}
              onClick={() => (mostrarForm ? cerrarFormulario() : setMostrarForm(true))}
            >
              {mostrarForm ? "Cancelar" : "+ Nuevo candidato"}
            </button>
          )}
        </div>
      </div>

      {/* Formulario dentro de card */}
      {mostrarForm && (
        <div className="form-card">
          <form onSubmit={manejarEnvio} noValidate>
            <h6>
              <i className="bi bi-person-plus-fill me-2"></i>
              {editandoId ? "Editando candidato" : "Nuevo candidato"}
            </h6>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre completo</label>
                <input
                  type="text"
                  name="nombre"
                  className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
                  placeholder="Ej: Juan Pérez"
                  value={form.nombre}
                  onChange={manejarCambio}
                  autoFocus
                />
                {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  className={`form-control ${errores.correo ? "is-invalid" : ""}`}
                  placeholder="Ej: juan@empresa.cl"
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
                  placeholder="+56 9 1234 5678"
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
                  placeholder="Ej: Analista de datos"
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

            <div className="d-flex gap-2 mt-4 pt-3 border-top">
              <button
                type="submit"
                className="btn-guardar-candidato flex-fill"
                disabled={enviando || guardando}
              >
                {enviando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar candidato"}
              </button>
              <button
                type="button"
                className="btn-cancelar-form"
                onClick={cerrarFormulario}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Búsqueda */}
      <div className="busqueda-card">
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

      {/* Lista de candidatos como tarjetas */}
      {candidatosFiltrados.length === 0 ? (
        <div className="estado-vacio">
          <i className="bi bi-inbox"></i>
          <h3>{candidatos.length === 0 ? "Aún no hay candidatos registrados." : "Ningún candidato coincide con la búsqueda."}</h3>
          {candidatos.length === 0 && permisos.candidatos && (
            <p className="mt-2 text-muted">Usa el botón <strong>"+ Nuevo candidato"</strong> para agregar uno.</p>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {candidatosFiltrados.map((c) => (
            <div className="col-md-6 col-lg-4" key={c.id}>
              <div className="candidato-card">
                <div className="acciones-card">
                  {permisos.candidatos && (
                    <>
                      <button
                        className="btn-accion-sm btn-editar-sm"
                        onClick={() => empezarEdicion(c)}
                        title="Editar candidato"
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        className="btn-accion-sm btn-eliminar-sm"
                        onClick={() => confirmarEliminar(c.id, c.nombre)}
                        disabled={eliminandoId === c.id}
                        title={eliminandoId === c.id ? "Eliminando..." : "Eliminar candidato"}
                      >
                        {eliminandoId === c.id ? (
                          <i className="bi bi-arrow-repeat" style={{ animation: "spin 1s linear infinite" }}></i>
                        ) : (
                          <i className="bi bi-trash-fill"></i>
                        )}
                      </button>
                    </>
                  )}
                </div>

                <h5><TextoSano valor={c.nombre} /></h5>

                <div className="candidato-detalle">
                  <i className="bi bi-envelope-fill"></i>
                  <span>{c.correo}</span>
                </div>

                <div className="candidato-detalle">
                  <i className="bi bi-telephone-fill"></i>
                  <span>{c.telefono || "—"}</span>
                </div>

                <div className="candidato-detalle">
                  <i className="bi bi-briefcase-fill"></i>
                  <span>{c.cargoPostulado}</span>
                </div>

                <span className="familia-chip">
                  {c.familiaCargo}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Candidatos;
