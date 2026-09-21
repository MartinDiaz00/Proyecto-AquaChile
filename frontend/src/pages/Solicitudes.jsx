import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

function Solicitudes() {
  const { solicitudes, candidatos, agregarSolicitud, avanzarEstado, nombreCandidato } = useData();
  const { permisos } = useAuth();
  const [mostrarForm, setMostrarForm] = useState(false);

  const formVacio = {
    candidatoId: "",
    cargo: "",
    familiaCargo: "",
    fechaSolicitud: "",
    responsable: "",
    origenCandidato: "",
    unidad: "",
    requiereReferencias: false,
    ceco: "",
    cvAdjunto: false,
    descriptorAdjunto: false,
    aspectosIndagar: "",
    esReferido: false,
  };
  const [form, setForm] = useState(formVacio);
  const [errores, setErrores] = useState({});

  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroCandidato, setFiltroCandidato] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const colorEstado = (estado) => {
    if (estado === "Pendiente") return "warning";
    if (estado === "En proceso") return "info";
    if (estado === "Finalizada") return "success";
    return "secondary";
  };

  const manejarCambio = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.candidatoId) nuevosErrores.candidatoId = "Selecciona un candidato";
    if (!form.cargo.trim()) nuevosErrores.cargo = "El cargo es obligatorio";
    if (!form.familiaCargo.trim()) nuevosErrores.familiaCargo = "La familia de cargo es obligatoria";
    if (!form.fechaSolicitud) nuevosErrores.fechaSolicitud = "La fecha es obligatoria";
    if (!form.responsable.trim()) nuevosErrores.responsable = "El responsable es obligatorio";
    if (!form.origenCandidato) nuevosErrores.origenCandidato = "Indica si es externo o interno";
    return nuevosErrores;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    try {
      await agregarSolicitud({ ...form, candidatoId: Number(form.candidatoId) });
      setForm(formVacio);
      setErrores({});
      setMostrarForm(false);
    } catch (error) {
      alert("No se pudo guardar la solicitud. Revisa que el backend esté corriendo.");
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado("Todos");
    setFiltroCargo("");
    setFiltroCandidato("");
    setFiltroFecha("");
  };

  const solicitudesFiltradas = solicitudes
    .filter((s) => filtroEstado === "Todos" || s.estado === filtroEstado)
    .filter((s) => s.cargo.toLowerCase().includes(filtroCargo.toLowerCase()))
    .filter((s) => nombreCandidato(s.candidatoId).toLowerCase().includes(filtroCandidato.toLowerCase()))
    .filter((s) => !filtroFecha || s.fechaSolicitud === filtroFecha);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: "var(--azul-profundo)" }}>
          <i className="bi bi-clipboard-check-fill me-2"></i>Solicitudes
        </h2>
        {permisos.solicitudes && (
          <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? "Cancelar" : "+ Nueva solicitud"}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form className="card card-body mb-4 border-0 shadow-sm" onSubmit={manejarEnvio} noValidate>
          <h6 className="text-muted mb-3">Datos de la solicitud</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Candidato</label>
              <select
                name="candidatoId"
                className={`form-select ${errores.candidatoId ? "is-invalid" : ""}`}
                value={form.candidatoId}
                onChange={manejarCambio}
              >
                <option value="">Selecciona un candidato</option>
                {candidatos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errores.candidatoId && <div className="invalid-feedback">{errores.candidatoId}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Origen del candidato</label>
              <select
                name="origenCandidato"
                className={`form-select ${errores.origenCandidato ? "is-invalid" : ""}`}
                value={form.origenCandidato}
                onChange={manejarCambio}
              >
                <option value="">Selecciona una opción</option>
                <option value="Externo">Externo</option>
                <option value="Interno">Interno</option>
              </select>
              {errores.origenCandidato && <div className="invalid-feedback">{errores.origenCandidato}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Cargo</label>
              <input
                type="text"
                name="cargo"
                className={`form-control ${errores.cargo ? "is-invalid" : ""}`}
                value={form.cargo}
                onChange={manejarCambio}
              />
              {errores.cargo && <div className="invalid-feedback">{errores.cargo}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Familia de cargo</label>
              <input
                type="text"
                name="familiaCargo"
                className={`form-control ${errores.familiaCargo ? "is-invalid" : ""}`}
                value={form.familiaCargo}
                onChange={manejarCambio}
              />
              {errores.familiaCargo && <div className="invalid-feedback">{errores.familiaCargo}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label">Unidad</label>
              <input
                type="text"
                name="unidad"
                className="form-control"
                placeholder="Ej: Planta Magallanes"
                value={form.unidad}
                onChange={manejarCambio}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Centro de costos (CECO)</label>
              <input
                type="text"
                name="ceco"
                className="form-control"
                value={form.ceco}
                onChange={manejarCambio}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Fecha de solicitud</label>
              <input
                type="date"
                name="fechaSolicitud"
                className={`form-control ${errores.fechaSolicitud ? "is-invalid" : ""}`}
                value={form.fechaSolicitud}
                onChange={manejarCambio}
              />
              {errores.fechaSolicitud && <div className="invalid-feedback">{errores.fechaSolicitud}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label">Responsable</label>
              <input
                type="text"
                name="responsable"
                className={`form-control ${errores.responsable ? "is-invalid" : ""}`}
                value={form.responsable}
                onChange={manejarCambio}
              />
              {errores.responsable && <div className="invalid-feedback">{errores.responsable}</div>}
            </div>

            <div className="col-12">
              <label className="form-label">Aspectos a indagar</label>
              <textarea
                name="aspectosIndagar"
                className="form-control"
                rows="2"
                placeholder="Ej: funciones del cargo, liderazgo, confidencialidad..."
                value={form.aspectosIndagar}
                onChange={manejarCambio}
              ></textarea>
            </div>

            <div className="col-12 d-flex flex-wrap gap-4 mt-1">
              <div className="form-check">
                <input
                  type="checkbox"
                  name="requiereReferencias"
                  className="form-check-input"
                  id="chkReferencias"
                  checked={form.requiereReferencias}
                  onChange={manejarCambio}
                />
                <label className="form-check-label" htmlFor="chkReferencias">Requiere referencias</label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  name="cvAdjunto"
                  className="form-check-input"
                  id="chkCv"
                  checked={form.cvAdjunto}
                  onChange={manejarCambio}
                />
                <label className="form-check-label" htmlFor="chkCv">CV adjunto</label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  name="descriptorAdjunto"
                  className="form-check-input"
                  id="chkDescriptor"
                  checked={form.descriptorAdjunto}
                  onChange={manejarCambio}
                />
                <label className="form-check-label" htmlFor="chkDescriptor">Descriptor de cargo adjunto</label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  name="esReferido"
                  className="form-check-input"
                  id="chkReferido"
                  checked={form.esReferido}
                  onChange={manejarCambio}
                />
                <label className="form-check-label" htmlFor="chkReferido">Candidato referido</label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-success mt-3">Crear solicitud</button>
        </form>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small text-muted">Estado</label>
              <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Cargo</label>
              <input type="text" className="form-control" placeholder="Buscar por cargo..." value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Candidato</label>
              <input type="text" className="form-control" placeholder="Buscar por nombre..." value={filtroCandidato} onChange={(e) => setFiltroCandidato(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Fecha</label>
              <input type="date" className="form-control" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
            </div>
            <div className="col-md-1">
              <button className="btn btn-outline-secondary w-100" onClick={limpiarFiltros} title="Limpiar filtros">
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Candidato</th>
              <th>Cargo</th>
              <th>Familia de cargo</th>
              <th>Fecha solicitud</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {solicitudesFiltradas.map((s) => (
              <tr key={s.id}>
                <td>{nombreCandidato(s.candidatoId)}</td>
                <td>{s.cargo}</td>
                <td>{s.familiaCargo}</td>
                <td>{s.fechaSolicitud}</td>
                <td><span className={`badge bg-${colorEstado(s.estado)}`}>{s.estado}</span></td>
                <td>{s.responsable}</td>
                <td className="d-flex gap-2">
                  <Link to={`/solicitudes/${s.id}`} className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-eye-fill me-1"></i>Ver
                  </Link>
                  {s.estado !== "Finalizada" && permisos.avanzar && (
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => avanzarEstado(s.id)}>
                      Avanzar →
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {solicitudesFiltradas.length === 0 && (
              <tr><td colSpan="7" className="text-center text-muted py-3">No hay solicitudes que coincidan con los filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Solicitudes;