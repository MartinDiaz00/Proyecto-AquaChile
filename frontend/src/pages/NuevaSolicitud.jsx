import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";

function NuevaSolicitud() {
  const { candidatos, agregarSolicitud } = useData();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  const formVacio = {
    candidatoId: "",
    origenCandidato: "",
    cargo: "",
    familiaCargo: "",
    unidad: "",
    ceco: "",
    fechaSolicitud: "",
    responsable: "",
    requiereReferencias: false,
    cvAdjunto: false,
    descriptorAdjunto: false,
    esReferido: false,
    aspectosIndagar: "",
  };
  const [form, setForm] = useState(formVacio);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const manejarCambio = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.candidatoId) nuevosErrores.candidatoId = "Selecciona un candidato";
    if (!form.origenCandidato) nuevosErrores.origenCandidato = "Indica si es externo o interno";
    if (!form.cargo.trim()) nuevosErrores.cargo = "El cargo es obligatorio";
    if (!form.familiaCargo.trim()) nuevosErrores.familiaCargo = "La familia de cargo es obligatoria";
    if (!form.fechaSolicitud) nuevosErrores.fechaSolicitud = "La fecha es obligatoria";
    if (!form.responsable.trim()) nuevosErrores.responsable = "El responsable es obligatorio";
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
      await agregarSolicitud({ ...form, candidatoId: Number(form.candidatoId) });
      mostrarToast("Solicitud creada correctamente");
      navigate("/solicitudes");
    } catch (error) {
      mostrarToast("No se pudo enviar la solicitud. Revisa el backend.", "error");
      setEnviando(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "760px" }}>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb breadcrumb-oscuro">
          <li className="breadcrumb-item">
            <Link to="/solicitudes" style={{ color: "var(--turquesa-suave)" }}>Solicitudes</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">Nueva solicitud</li>
        </ol>
      </nav>

      <div className="card border-0 shadow-sm">
        <div
          className="card-header border-0 text-white rounded-top"
          style={{ background: "linear-gradient(120deg, var(--azul-profundo), var(--turquesa))" }}
        >
          <div className="py-3">
            <h4 className="mb-1"><i className="bi bi-clipboard2-plus me-2"></i>Solicitud de Evaluación Psicolaboral</h4>
            <p className="mb-0 small" style={{ opacity: 0.9 }}>
              Completa este formulario para solicitar la evaluación de un candidato.
            </p>
          </div>
        </div>

        <div className="card-body p-4">
          <form onSubmit={manejarEnvio} noValidate>
            {/* Sección 1: Candidato */}
            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: "var(--turquesa)" }}>
              1. Datos del candidato
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <label className="form-label">Nombre del candidato</label>
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
                <div className="form-text">
                  ¿No está en la lista? <Link to="/candidatos">Regístralo primero aquí</Link>.
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label">Origen</label>
                <select
                  name="origenCandidato"
                  className={`form-select ${errores.origenCandidato ? "is-invalid" : ""}`}
                  value={form.origenCandidato}
                  onChange={manejarCambio}
                >
                  <option value="">Selecciona</option>
                  <option value="Externo">Externo</option>
                  <option value="Interno">Interno</option>
                </select>
                {errores.origenCandidato && <div className="invalid-feedback">{errores.origenCandidato}</div>}
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="esReferido"
                    className="form-check-input"
                    id="chkReferido"
                    checked={form.esReferido}
                    onChange={manejarCambio}
                  />
                  <label className="form-check-label" htmlFor="chkReferido">Es un candidato referido</label>
                </div>
              </div>
            </div>

            {/* Sección 2: Cargo */}
            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: "var(--turquesa)" }}>
              2. Datos del cargo
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label">Nombre del cargo</label>
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

              <div className="col-md-6">
                <label className="form-label">Unidad / Ubicación</label>
                <input
                  type="text"
                  name="unidad"
                  className="form-control"
                  placeholder="Ej: Planta Magallanes"
                  value={form.unidad}
                  onChange={manejarCambio}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Centro de costos (CECO)</label>
                <input
                  type="text"
                  name="ceco"
                  className="form-control"
                  value={form.ceco}
                  onChange={manejarCambio}
                />
              </div>
            </div>

            {/* Sección 3: Detalles de la solicitud */}
            <h6 className="text-uppercase small fw-bold mb-3" style={{ color: "var(--turquesa)" }}>
              3. Detalles de la solicitud
            </h6>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
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
                <label className="form-label">Solicitado por (responsable)</label>
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
                <label className="form-label">Aspectos a indagar en la evaluación</label>
                <textarea
                  name="aspectosIndagar"
                  className="form-control"
                  rows="3"
                  placeholder="Ej: funciones del cargo, liderazgo, manejo de confidencialidad..."
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
                  <label className="form-check-label" htmlFor="chkCv">Currículum adjunto</label>
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
              </div>
            </div>

            <div className="d-flex gap-2 mt-4 pt-2 border-top">
              <button type="submit" className="btn btn-success" disabled={enviando}>
                <i className="bi bi-send-fill me-1"></i>
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/solicitudes")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NuevaSolicitud;