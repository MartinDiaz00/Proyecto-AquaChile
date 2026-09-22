import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { candidatos, solicitudes, nombreCandidato } = useData();
  const { permisos } = useAuth();

  const totalCandidatos = candidatos.length;
  const pendientes = solicitudes.filter((s) => s.estado === "Pendiente").length;
  const enProceso = solicitudes.filter((s) => s.estado === "En proceso").length;
  const finalizadas = solicitudes.filter((s) => s.estado === "Finalizada").length;

  const colorEstado = (estado) => {
    if (estado === "Pendiente") return "warning";
    if (estado === "En proceso") return "info";
    if (estado === "Finalizada") return "success";
    return "secondary";
  };

  return (
    <div className="container mt-4">
      <div
        className="rounded-4 p-5 mb-4 text-white"
        style={{
          background: "linear-gradient(120deg, var(--azul-profundo), var(--turquesa))",
          minHeight: "180px",
        }}
      >
        <h2 className="mb-1">
          <i className="bi bi-water me-2"></i>Panel de gestión
        </h2>
        <p className="mb-0" style={{ opacity: 0.9 }}>
          Visión general del proceso de evaluación psicolaboral
        </p>
        {permisos.solicitudes && (
          <Link to="/nueva-solicitud" className="btn btn-light mt-3">
            <i className="bi bi-clipboard2-plus me-1"></i>Solicitar evaluación
          </Link>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <Link to="/candidatos" className="text-decoration-none text-reset">
            <div className="card card-clickable text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <i className="bi bi-people-fill fs-2" style={{ color: "var(--azul-medio)" }}></i>
                <h6 className="text-muted mt-2">Total candidatos</h6>
                <h2>{totalCandidatos}</h2>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/solicitudes?estado=Pendiente" className="text-decoration-none text-reset">
            <div className="card card-clickable text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <i className="bi bi-hourglass-split fs-2 text-warning"></i>
                <h6 className="text-muted mt-2">Pendientes</h6>
                <h2 className="text-warning">{pendientes}</h2>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/solicitudes?estado=En proceso" className="text-decoration-none text-reset">
            <div className="card card-clickable text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <i className="bi bi-arrow-repeat fs-2 text-info"></i>
                <h6 className="text-muted mt-2">En proceso</h6>
                <h2 className="text-info">{enProceso}</h2>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/solicitudes?estado=Finalizada" className="text-decoration-none text-reset">
            <div className="card card-clickable text-center border-0 shadow-sm h-100">
              <div className="card-body">
                <i className="bi bi-check-circle-fill fs-2 text-success"></i>
                <h6 className="text-muted mt-2">Finalizadas</h6>
                <h2 className="text-success">{finalizadas}</h2>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">
            <i className="bi bi-clock-history me-2"></i>Solicitudes recientes
          </h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Candidato</th>
                  <th>Cargo</th>
                  <th>Fecha solicitud</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.slice(0, 8).map((s) => (
                  <tr key={s.id}>
                    <td>{nombreCandidato(s.candidatoId)}</td>
                    <td>{s.cargo}</td>
                    <td>{s.fechaSolicitud}</td>
                    <td>
                      <span className={`badge bg-${colorEstado(s.estado)}`}>{s.estado}</span>
                    </td>
                    <td>{s.responsable}</td>
                  </tr>
                ))}
                {solicitudes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">Aún no hay solicitudes registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;