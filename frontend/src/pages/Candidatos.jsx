import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { TextoSano } from "../components/TextoSano";
import { apiFetch } from "../services/api";
import { FAMILIAS_CARGO, filtrarCandidatos, validarFormularioCandidato } from "../utils/validaciones";
import * as XLSX from "xlsx";

function Candidatos() {
  const { candidatos, agregarCandidato, editarCandidato, eliminarCandidato, guardando } = useData();
  const { permisos } = useAuth();
  const { mostrarToast } = useToast();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [eliminandoId, setEliminandoId] = useState(null);
  const [archivosCv, setArchivosCv] = useState([]);
  const [subiendoCvId, setSubiendoCvId] = useState(null);
  const [generandoCvId, setGenerandoCvId] = useState(null);
  const [eliminandoCvId, setEliminandoCvId] = useState(null);
  const [subiendoReporte, setSubiendoReporte] = useState(false);

  const formVacio = {
    nombre: "",
    correo: "",
    telefono: "",
    cargoPostulado: "",
    familiaCargo: "",
    perfilProfesional: "",
    educacion: "",
    habilidades: "",
  };
  const [form, setForm] = useState(formVacio);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!permisos.candidatos) return undefined;
    let vigente = true;
    apiFetch("/archivos/cvs")
      .then(async (response) => {
        const data = await response.safeJson();
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar los CV.");
        if (vigente) setArchivosCv(data);
      })
      .catch((error) => {
        if (vigente) mostrarToast(error.message, "error");
      });
    return () => { vigente = false; };
  }, [permisos.candidatos, mostrarToast]);

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    const nuevosErrores = validarFormularioCandidato(form);
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
      perfilProfesional: candidato.perfilProfesional || "",
      educacion: candidato.educacion || "",
      habilidades: candidato.habilidades || "",
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
      `¿Estás seguro de que deseas eliminar al candidato "${nombre}"?\n\nEsta acción no se puede deshacer si el candidato tiene solicitudes asociadas. También se eliminarán sus CV de Google Drive.`
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

  const subirCv = async (candidatoId, evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const extension = archivo.name.split(".").pop()?.toLowerCase();
    const tiposPorExtension = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const tipoContenido = tiposPorExtension[extension];
    if (!tipoContenido || (archivo.type && archivo.type !== tipoContenido)) {
      mostrarToast("El CV debe ser un archivo PDF, DOC o DOCX.", "error");
      evento.target.value = "";
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      mostrarToast("El CV no puede superar los 10 MB.", "error");
      evento.target.value = "";
      return;
    }

    setSubiendoCvId(candidatoId);
    try {
      const response = await apiFetch(`/archivos/candidatos/${candidatoId}/cv`, {
        method: "POST",
        headers: { "Content-Type": tipoContenido },
        body: archivo,
      });
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.error || "No se pudo subir el CV.");
      setArchivosCv((prev) => [data, ...prev]);
      mostrarToast("CV guardado en Google Drive.", "success");
    } catch (error) {
      mostrarToast(error.message, "error");
    } finally {
      setSubiendoCvId(null);
      evento.target.value = "";
    }
  };

  const generarCv = async (candidato) => {
    if (!candidato.perfilProfesional && !candidato.educacion && !candidato.habilidades) {
      mostrarToast("Completa el perfil, la educación o las habilidades al editar el candidato antes de generar el CV.", "error");
      return;
    }
    const confirmado = window.confirm(
      `Se generará un CV Word con los datos de ${candidato.nombre} y se guardará en su carpeta personal de Google Drive. Confirma que tienes autorización para almacenar estos datos personales.`
    );
    if (!confirmado) return;

    setGenerandoCvId(candidato.id);
    try {
      const response = await apiFetch(`/archivos/candidatos/${candidato.id}/generar-cv`, {
        method: "POST",
      });
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.error || "No se pudo generar el CV.");
      setArchivosCv((prev) => {
        const sinDuplicado = prev.filter((archivo) => archivo.drive_item_id !== data.drive_item_id);
        return [data, ...sinDuplicado];
      });
      mostrarToast("CV Word generado y guardado en la carpeta del candidato en Google Drive.", "success");
    } catch (error) {
      mostrarToast(error.message, "error");
    } finally {
      setGenerandoCvId(null);
    }
  };

  const eliminarCv = async (archivo) => {
    const esGoogleDrive = archivo.storage_provider === "google_drive";
    const mensajeConfirmacion = esGoogleDrive
      ? `¿Eliminar "${archivo.nombre_archivo}" de Google Drive?`
      : `Primero elimina "${archivo.nombre_archivo}" directamente en OneDrive. ¿Ya lo hiciste y quieres quitar su referencia de la aplicación?`;
    if (!window.confirm(mensajeConfirmacion)) return;
    setEliminandoCvId(archivo.id);
    try {
      const endpoint = esGoogleDrive
        ? `/archivos/cvs/${archivo.id}`
        : `/archivos/cvs/${archivo.id}/referencia`;
      const response = await apiFetch(endpoint, { method: "DELETE" });
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar el CV.");
      setArchivosCv((prev) => prev.filter((item) => item.id !== archivo.id));
      mostrarToast(
        esGoogleDrive ? "CV eliminado de Google Drive." : "Referencia antigua eliminada.",
        "success"
      );
    } catch (error) {
      mostrarToast(error.message, "error");
    } finally {
      setEliminandoCvId(null);
    }
  };

  const guardarReporteEnGoogleDrive = async () => {
    const confirmado = window.confirm(
      "El Excel contiene nombres, correos, teléfonos y cargos de candidatos. Confirma que la carpeta institucional de Google Drive tiene acceso restringido antes de subirlo."
    );
    if (!confirmado) return;

    setSubiendoReporte(true);
    try {
      const datos = candidatos.map((c) => ({
        Nombre: c.nombre,
        Correo: c.correo,
        Teléfono: c.telefono || "",
        Cargo: c.cargoPostulado,
        "Familia de cargo": c.familiaCargo,
      }));
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(datos), "Candidatos");
      const fecha = new Date().toISOString().slice(0, 10);
      const nombre = `Candidatos_AquaChile_${fecha}.xlsx`;
      const contenido = XLSX.write(libro, { bookType: "xlsx", type: "array" });
      const response = await apiFetch("/archivos/reportes/candidatos", {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "X-Report-Name": nombre,
        },
        body: contenido,
      });
      const data = await response.safeJson();
      if (!response.ok) throw new Error(data.error || "No se pudo subir el reporte.");
      mostrarToast(`Reporte ${data.nombre} guardado en Google Drive.`, "success");
    } catch (error) {
      mostrarToast(error.message, "error");
    } finally {
      setSubiendoReporte(false);
    }
  };

  const candidatosFiltrados = filtrarCandidatos(candidatos, busqueda);

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
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <button
                className="btn btn-outline-light"
                disabled={subiendoReporte || candidatos.length === 0}
                onClick={guardarReporteEnGoogleDrive}
              >
                <i className="bi bi-cloud-arrow-up me-1"></i>
                {subiendoReporte ? "Subiendo..." : "Excel a Google Drive"}
              </button>
              <button
                className="btn-accion-candidato"
                disabled={guardando}
                onClick={() => (mostrarForm ? cerrarFormulario() : setMostrarForm(true))}
              >
                {mostrarForm ? "Cancelar" : "+ Nuevo candidato"}
              </button>
            </div>
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
                  {FAMILIAS_CARGO.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                {errores.familiaCargo && <div className="invalid-feedback">{errores.familiaCargo}</div>}
              </div>

              <div className="col-12">
                <label className="form-label">Perfil profesional</label>
                <textarea
                  name="perfilProfesional"
                  className="form-control"
                  rows="3"
                  maxLength="2000"
                  placeholder="Resumen profesional proporcionado por el candidato"
                  value={form.perfilProfesional}
                  onChange={manejarCambio}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Educación y certificaciones</label>
                <textarea
                  name="educacion"
                  className="form-control"
                  rows="3"
                  maxLength="4000"
                  placeholder="Institución, título, certificaciones y años si corresponde"
                  value={form.educacion}
                  onChange={manejarCambio}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Habilidades</label>
                <textarea
                  name="habilidades"
                  className="form-control"
                  rows="3"
                  maxLength="3000"
                  placeholder="Habilidades técnicas y profesionales"
                  value={form.habilidades}
                  onChange={manejarCambio}
                />
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

                {permisos.candidatos && (
                  <div className="mt-3 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success me-2"
                      disabled={generandoCvId === c.id}
                      onClick={() => generarCv(c)}
                    >
                      <i className="bi bi-file-earmark-word me-1"></i>
                      {generandoCvId === c.id ? "Generando..." : "Generar CV Word"}
                    </button>
                    <label className={`btn btn-sm btn-outline-primary ${subiendoCvId === c.id ? "disabled" : ""}`}>
                      <i className="bi bi-file-earmark-arrow-up me-1"></i>
                      {subiendoCvId === c.id ? "Subiendo CV..." : "Subir CV"}
                      <input
                        type="file"
                        className="visually-hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        disabled={subiendoCvId === c.id}
                        onChange={(evento) => subirCv(c.id, evento)}
                      />
                    </label>
                    {archivosCv
                      .filter((archivo) => archivo.candidato_id === c.id)
                      .map((archivo) => (
                        <div key={archivo.id} className="d-flex align-items-center justify-content-between gap-2 mt-2 small">
                          <a href={archivo.web_url} target="_blank" rel="noreferrer" className="text-truncate">
                            <i className="bi bi-file-earmark-person me-1"></i>{archivo.nombre_archivo}
                          </a>
                          {archivo.storage_provider !== "google_drive" && (
                            <span className="text-muted flex-shrink-0">OneDrive (anterior)</span>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger flex-shrink-0"
                            title={archivo.storage_provider === "google_drive" ? "Eliminar CV de Google Drive" : "Quitar referencia después de eliminarlo de OneDrive"}
                            disabled={eliminandoCvId === archivo.id}
                            onClick={() => eliminarCv(archivo)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Candidatos;
