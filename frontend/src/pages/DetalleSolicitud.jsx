import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useData } from "../context/DataContext";

function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerSolicitud, obtenerEvaluacion, cargarEvaluacion, guardarEvaluacion, candidatos } = useData();
  useEffect(() => {
    cargarEvaluacion(id);
  }, [id]);

  const solicitud = obtenerSolicitud(id);
  const evaluacionExistente = obtenerEvaluacion(id);
  const candidato = solicitud ? candidatos.find((c) => c.id === solicitud.candidatoId) : null;

  const [form, setForm] = useState({
    fechaEvaluacion: evaluacionExistente?.fechaEvaluacion || "",
    resultado: evaluacionExistente?.resultado || "",
    observaciones: evaluacionExistente?.observaciones || "",
  });
  const [errores, setErrores] = useState({});
  const [guardadoOk, setGuardadoOk] = useState(false);

  // Si la ruta trae un id que no existe (ej. /solicitudes/999), avisamos en vez de romper la página
  if (!solicitud) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          No se encontró la solicitud #{id}.{" "}
          <Link to="/solicitudes">Volver a Solicitudes</Link>
        </div>
      </div>
    );
  }

  const colorEstado = (estado) => {
    if (estado === "Pendiente") return "warning";
    if (estado === "En proceso") return "info";
    if (estado === "Finalizada") return "success";
    return "secondary";
  };

  const colorResultado = (resultado) => {
    if (resultado === "Recomendado") return "success";
    if (resultado === "Recomendado con observaciones") return "warning";
    if (resultado === "No recomendado") return "danger";
    return "secondary";
  };

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setGuardadoOk(false);
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.fechaEvaluacion) nuevosErrores.fechaEvaluacion = "La fecha es obligatoria";
    if (!form.resultado) nuevosErrores.resultado = "Selecciona un resultado";
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
      await guardarEvaluacion(id, form);
      setErrores({});
      setGuardadoOk(true);
    } catch (error) {
      alert("No se pudo guardar la evaluación. Revisa que el backend esté corriendo.");
    }
  };

  return (
    <div className="container mt-4">
      {/* Breadcrumb de navegación */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/solicitudes" style={{ color: "var(--azul-medio)" }}>Solicitudes</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Solicitud #{solicitud.id}
          </li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Columna izquierda: información de la solicitud */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2" style={{ color: "var(--azul-medio)" }}></i>
                  Solicitud #{solicitud.id}
                </h5>
                <span className={`badge bg-${colorEstado(solicitud.estado)}`}>{solicitud.estado}</span>
              </div>

              <dl className="row mb-0">
                <dt className="col-5 text-muted">Candidato</dt>
                <dd className="col-7">{candidato?.nombre || "—"}</dd>

                <dt className="col-5 text-muted">Correo</dt>
                <dd className="col-7">{candidato?.correo || "—"}</dd>

                <dt className="col-5 text-muted">Cargo</dt>
                <dd className="col-7">{solicitud.cargo}</dd>

                <dt className="col-5 text-muted">Familia de cargo</dt>
                <dd className="col-7">{solicitud.familiaCargo}</dd>

                <dt className="col-5 text-muted">Fecha solicitud</dt>
                <dd className="col-7">{solicitud.fechaSolicitud}</dd>

                <dt className="col-5 text-muted">Responsable</dt>
                <dd className="col-7">{solicitud.responsable}</dd>

                <dt className="col-5 text-muted">Origen candidato</dt>
                <dd className="col-7">{solicitud.origenCandidato || "—"}</dd>

                <dt className="col-5 text-muted">Unidad</dt>
                <dd className="col-7">{solicitud.unidad || "—"}</dd>

                <dt className="col-5 text-muted">CECO</dt>
                <dd className="col-7">{solicitud.ceco || "—"}</dd>

                <dt className="col-5 text-muted">Requiere referencias</dt>
                <dd className="col-7">{solicitud.requiereReferencias ? "Sí" : "No"}</dd>

                <dt className="col-5 text-muted">CV adjunto</dt>
                <dd className="col-7">{solicitud.cvAdjunto ? "Sí" : "No"}</dd>

                <dt className="col-5 text-muted">Descriptor adjunto</dt>
                <dd className="col-7">{solicitud.descriptorAdjunto ? "Sí" : "No"}</dd>

                <dt className="col-5 text-muted">Candidato referido</dt>
                <dd className="col-7">{solicitud.esReferido ? "Sí" : "No"}</dd>

                <dt className="col-5 text-muted">Aspectos a indagar</dt>
                <dd className="col-7">{solicitud.aspectosIndagar || "—"}</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Columna derecha: formulario de evaluación */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">
                <i className="bi bi-clipboard2-pulse me-2" style={{ color: "var(--turquesa)" }}></i>
                Evaluación psicolaboral
              </h5>

              {evaluacionExistente && (
                <div className={`alert alert-${colorResultado(evaluacionExistente.resultado)} py-2`}>
                  Esta solicitud ya tiene una evaluación registrada. Puedes actualizarla abajo.
                </div>
              )}

              {guardadoOk && (
                <div className="alert alert-success py-2">
                  <i className="bi bi-check-circle-fill me-2"></i>Evaluación guardada correctamente.
                </div>
              )}

              <form onSubmit={manejarEnvio} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Fecha de evaluación</label>
                    <input
                      type="date"
                      name="fechaEvaluacion"
                      className={`form-control ${errores.fechaEvaluacion ? "is-invalid" : ""}`}
                      value={form.fechaEvaluacion}
                      onChange={manejarCambio}
                    />
                    {errores.fechaEvaluacion && <div className="invalid-feedback">{errores.fechaEvaluacion}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Resultado</label>
                    <select
                      name="resultado"
                      className={`form-select ${errores.resultado ? "is-invalid" : ""}`}
                      value={form.resultado}
                      onChange={manejarCambio}
                    >
                      <option value="">Selecciona un resultado</option>
                      <option value="Recomendado">Recomendado</option>
                      <option value="Recomendado con observaciones">Recomendado con observaciones</option>
                      <option value="No recomendado">No recomendado</option>
                    </select>
                    {errores.resultado && <div className="invalid-feedback">{errores.resultado}</div>}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Observaciones</label>
                    <textarea
                      name="observaciones"
                      className="form-control"
                      rows="4"
                      placeholder="Comentarios del evaluador sobre el desempeño, competencias observadas, etc."
                      value={form.observaciones}
                      onChange={manejarCambio}
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-success">
                    <i className="bi bi-save2-fill me-1"></i>
                    {evaluacionExistente ? "Actualizar evaluación" : "Guardar evaluación"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/solicitudes")}>
                    Volver
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleSolicitud;