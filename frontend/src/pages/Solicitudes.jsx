import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

function Solicitudes() {
  const { solicitudes, candidatos, avanzarEstado, nombreCandidato, cargando } = useData();
  const { permisos } = useAuth();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "Todos");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroCandidato, setFiltroCandidato] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const colorEstado = (estado) => {
    if (estado === "Pendiente") return "warning";
    if (estado === "En proceso") return "info";
    if (estado === "Finalizada") return "success";
    return "secondary";
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

  const exportarAExcel = () => {
    const datosExportar = solicitudesFiltradas.map((s) => ({
      "Nº Solicitud": s.id,
      Candidato: nombreCandidato(s.candidatoId),
      Cargo: s.cargo,
      "Familia de cargo": s.familiaCargo,
      "Fecha solicitud": s.fechaSolicitud,
      Estado: s.estado,
      Responsable: s.responsable,
      "Aspectos a Indagar": s.aspectosIndagar || "",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Solicitudes");

    XLSX.writeFile(
      libro,
      `Solicitudes_Psicolaborales_AquaChile_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (cargando) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando solicitudes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white">
          <i className="bi bi-clipboard-check-fill me-2"></i>Solicitudes
        </h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success" onClick={exportarAExcel} disabled={solicitudesFiltradas.length === 0}>
            <i className="bi bi-file-earmark-excel me-1"></i>Exportar a Excel
          </button>
          {permisos.crearSolicitud && (
            <button className="btn btn-primary" onClick={() => navigate("/nueva-solicitud")}>
              <i className="bi bi-plus-lg me-1"></i>Nueva solicitud
            </button>
          )}
        </div>
      </div>

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
              <th>Nº</th>
              <th>Candidato</th>
              <th>Cargo</th>
              <th>Familia de cargo</th>
              <th>Fecha solicitud</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th>Aspectos a Indagar</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesFiltradas.map((s) => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{nombreCandidato(s.candidatoId)}</td>
                <td>{s.cargo}</td>
                <td>{s.familiaCargo}</td>
                <td>{s.fechaSolicitud}</td>
                <td><span className={`badge bg-${colorEstado(s.estado)}`}>{s.estado}</span></td>
                <td>{s.responsable}</td>
                <td>{s.aspectosIndagar || "—"}</td>
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
              <tr><td colSpan="9" className="text-center text-muted py-4">
                <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                No hay solicitudes que coincidan con los filtros.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Solicitudes;
