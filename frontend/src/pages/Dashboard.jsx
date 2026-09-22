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

  const idsConSolicitud = new Set(solicitudes.map((s) => s.candidatoId));
  const sinSolicitud = candidatos.filter((c) => !idsConSolicitud.has(c.id)).length;
  const porcentajeFinalizadas = solicitudes.length > 0 ? Math.round((finalizadas / solicitudes.length) * 100) : 0;

  const colorEstado = (estado) => {
    if (estado === "Pendiente") return "warning";
    if (estado === "En proceso") return "info";
    if (estado === "Finalizada") return "success";
    return "secondary";
  };

  const tarjetas = [
    { label: "Total candidatos", valor: totalCandidatos, icono: "bi-people-fill", color: "var(--azul-medio)", link: "/candidatos" },
    { label: "Pendientes", valor: pendientes, icono: "bi-hourglass-split", color: "#f0ad4e", link: "/solicitudes?estado=Pendiente" },
    { label: "En proceso", valor: enProceso, icono: "bi-arrow-repeat", color: "#17a2b8", link: "/solicitudes?estado=En proceso" },
    { label: "Finalizadas", valor: finalizadas, icono: "bi-check-circle-fill", color: "#28a745", link: "/solicitudes?estado=Finalizada" },
    { label: "% Finalizadas", valor: `${porcentajeFinalizadas}%`, icono: "bi-graph-up-arrow", color: "var(--turquesa)", link: "/solicitudes" },
    { label: "Sin solicitud aún", valor: sinSolicitud, icono: "bi-person-exclamation", color: "var(--salmon-acento)", link: "/candidatos" },
  ];

  return (
    <div className="container mt-4">
      <div
        className="rounded-4 p-5 mb-4 text-white"
        style={{
          background: "linear-gradient(90deg, var(--turquesa) 0%, var(--azul-noche) 65%, var(--azul-profundo) 100%)",
          minHeight: "180px",
        }}
      >
        <h2 className="mb-1 fuente-marca fw-bold">
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

      <div className="row g-2 mb-4">
        {tarjetas.map((t) => (
          <div className="col-6 col-md-4 col-lg-2" key={t.label}>
            <Link to={t.link} className="text-decoration-none text-reset">
              <div className="card card-clickable border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-2 py-3 px-3">
                  <i className={`bi ${t.icono} fs-4`} style={{ color: t.color }}></i>
                  <div>
                    <div className="fw-bold fs-5 lh-1">{t.valor}</div>
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>{t.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
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