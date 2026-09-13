import { useData } from "../context/DataContext";

const heroSvg = `
<svg viewBox="0 0 1600 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e6f5f4"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="mar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1f9d96"/>
      <stop offset="100%" stop-color="#0b3350"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1600" height="260" fill="url(#cielo)"/>
  <circle cx="1400" cy="90" r="70" fill="#e8734f" opacity="0.15"/>
  <circle cx="1400" cy="90" r="45" fill="#e8734f" opacity="0.35"/>
  <polygon points="0,260 150,140 320,260" fill="#10598c" opacity="0.35"/>
  <polygon points="250,260 430,110 620,260" fill="#10598c" opacity="0.35"/>
  <polygon points="550,260 750,150 950,260" fill="#10598c" opacity="0.35"/>
  <polygon points="850,260 1080,120 1300,260" fill="#10598c" opacity="0.35"/>
  <polygon points="-50,260 200,170 480,260" fill="#0b3350" opacity="0.55"/>
  <polygon points="400,260 680,140 980,260" fill="#0b3350" opacity="0.55"/>
  <polygon points="900,260 1200,160 1650,260" fill="#0b3350" opacity="0.55"/>
  <rect x="0" y="260" width="1600" height="240" fill="url(#mar)"/>
  <path d="M0,300 Q100,290 200,300 T400,300 T600,300 T800,300 T1000,300 T1200,300 T1400,300 T1600,300" stroke="#ffffff" stroke-opacity="0.15" stroke-width="3" fill="none"/>
  <path d="M0,340 Q100,330 200,340 T400,340 T600,340 T800,340 T1000,340 T1200,340 T1400,340 T1600,340" stroke="#ffffff" stroke-opacity="0.1" stroke-width="3" fill="none"/>
  <g stroke="#e6f5f4" stroke-width="3" fill="none" opacity="0.8"><circle cx="300" cy="400" r="45"/><circle cx="300" cy="400" r="30"/></g>
  <g stroke="#e6f5f4" stroke-width="3" fill="none" opacity="0.8"><circle cx="420" cy="430" r="35"/><circle cx="420" cy="430" r="22"/></g>
  <g stroke="#e6f5f4" stroke-width="3" fill="none" opacity="0.7"><circle cx="900" cy="410" r="50"/><circle cx="900" cy="410" r="33"/></g>
  <g stroke="#e6f5f4" stroke-width="3" fill="none" opacity="0.7"><circle cx="1040" cy="440" r="38"/><circle cx="1040" cy="440" r="24"/></g>
  <g stroke="#e6f5f4" stroke-width="3" fill="none" opacity="0.6"><circle cx="1300" cy="405" r="42"/><circle cx="1300" cy="405" r="27"/></g>
  <line x1="300" y1="400" x2="420" y2="430" stroke="#e6f5f4" stroke-width="2" opacity="0.5"/>
  <line x1="900" y1="410" x2="1040" y2="440" stroke="#e6f5f4" stroke-width="2" opacity="0.5"/>
</svg>
`;

const heroBackground = `linear-gradient(rgba(11,51,80,0.45), rgba(11,51,80,0.55)), url("data:image/svg+xml,${encodeURIComponent(heroSvg)}")`;

function Dashboard() {
  const { candidatos, solicitudes, nombreCandidato } = useData();

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
          background: heroBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "180px",
        }}
      >
        <h2 className="mb-1">
          <i className="bi bi-water me-2"></i>Panel de gestión
        </h2>
        <p className="mb-0" style={{ opacity: 0.9 }}>
          Visión general del proceso de evaluación psicolaboral
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center border-0 shadow-sm h-100">
            <div className="card-body">
              <i className="bi bi-people-fill fs-2" style={{ color: "var(--azul-medio)" }}></i>
              <h6 className="text-muted mt-2">Total candidatos</h6>
              <h2>{totalCandidatos}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-0 shadow-sm h-100">
            <div className="card-body">
              <i className="bi bi-hourglass-split fs-2 text-warning"></i>
              <h6 className="text-muted mt-2">Pendientes</h6>
              <h2 className="text-warning">{pendientes}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-0 shadow-sm h-100">
            <div className="card-body">
              <i className="bi bi-arrow-repeat fs-2 text-info"></i>
              <h6 className="text-muted mt-2">En proceso</h6>
              <h2 className="text-info">{enProceso}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center border-0 shadow-sm h-100">
            <div className="card-body">
              <i className="bi bi-check-circle-fill fs-2 text-success"></i>
              <h6 className="text-muted mt-2">Finalizadas</h6>
              <h2 className="text-success">{finalizadas}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">
            <i className="bi bi-clock-history me-2"></i>Solicitudes recientes
          </h5>
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
              {solicitudes.map((s) => (
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;