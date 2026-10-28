import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../services/api";
import { TextoSano } from "../components/TextoSano";
import { filtrarSolicitudes } from "../utils/validaciones";
import * as XLSX from "xlsx";

function Solicitudes() {
  const { solicitudes, avanzarEstado, nombreCandidato, cargando } = useData();
  const { permisos } = useAuth();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "Todos");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [filtroCandidato, setFiltroCandidato] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [subiendoReporte, setSubiendoReporte] = useState(false);

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

  const solicitudesFiltradas = filtrarSolicitudes(
    solicitudes,
    {
      estado: filtroEstado,
      cargo: filtroCargo,
      candidato: filtroCandidato,
      fecha: filtroFecha,
    },
    nombreCandidato
  );

  const crearLibroExcel = () => {
    const COLOR_TITULO = "081B2E";    // azul profundo marca AquaChile
    const COLOR_ENCABEZADO = "1F9D96"; // turquesa marca
    const COLOR_FILA_ALTERNA = "E6F5F4"; // turquesa muy suave
    const COLOR_BORDE = "9FB3C8";

    const estilosEstado = {
      Pendiente: { fondo: "FFF2CC", texto: "7F6000" },   // amarillo
      "En proceso": { fondo: "DDEBF7", texto: "1F4E79" }, // azul
      Finalizada: { fondo: "E2EFDA", texto: "375623" },   // verde
    };

    const crearCelda = (valor, opciones = {}) => {
      const {
        esEncabezado = false,
        esEstado = false,
        indiceFila = 0,
        esNumero = false,
        esResumen = false,
      } = opciones;

      let colorTexto = esEncabezado ? "FFFFFFFF" : esResumen ? "FFFFFFFF" : COLOR_TITULO;
      let fondo = esEncabezado
        ? COLOR_ENCABEZADO
        : esResumen
          ? COLOR_ENCABEZADO
          : indiceFila % 2 === 0
            ? COLOR_FILA_ALTERNA
            : "FFFFFF";

      // Colores por estado (fuertes y legibles)
      if (esEstado && estilosEstado[valor]) {
        fondo = estilosEstado[valor].fondo;
        colorTexto = estilosEstado[valor].texto;
      }

      return {
        t: esNumero ? "n" : "s",
        v: valor,
        s: {
          font: {
            name: "Calibri",
            sz: 11,
            bold: esEncabezado || esEstado || esResumen,
            color: { rgb: colorTexto },
          },
          alignment: {
            horizontal: esEncabezado || esNumero || esResumen ? "center" : "left",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: COLOR_BORDE } },
            bottom: { style: "thin", color: { rgb: COLOR_BORDE } },
            left: { style: "thin", color: { rgb: COLOR_BORDE } },
            right: { style: "thin", color: { rgb: COLOR_BORDE } },
          },
          fill: { patternType: "solid", fgColor: { rgb: fondo } },
        },
      };
    };

    const hoja = {};

    // Anchos de columna optimizados
    const anchos = [7, 26, 22, 20, 14, 15, 24, 45];
    hoja["!cols"] = anchos.map((w) => ({ wch: w }));

    // Congelar encabezados (fila 4 en adelante)
    hoja["!freeze"] = "A4";

    const encabezados = [
      "Nº",
      "Candidato",
      "Cargo",
      "Familia de cargo",
      "Fecha solicitud",
      "Estado",
      "Responsable",
      "Aspectos a Indagar",
    ];

    // ===== FILA 1: Título principal (mergeado A1:H1) =====
    hoja["A1"] = crearCelda("SGP Psicolaboral — AquaChile", {
      esEncabezado: true,
      esNumero: false,
    });
    Object.assign(hoja["A1"].s, {
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFFFF" } },
    });
    hoja["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: anchos.length - 1 } }];

    // ===== FILA 2: Subtítulo (mergeado A2:H2) =====
    hoja["A2"] = crearCelda("Reporte de Solicitudes de Evaluación Psicolaboral", {
      esEncabezado: false,
      esNumero: false,
    });
    Object.assign(hoja["A2"].s, {
      font: { name: "Calibri", sz: 13, bold: true, color: { rgb: COLOR_TITULO } },
      fill: { patternType: "solid", fgColor: { rgb: COLOR_FILA_ALTERNA } },
    });
    hoja["!merges"] = (hoja["!merges"] || []).concat([
      { s: { r: 1, c: 0 }, e: { r: 1, c: anchos.length - 1 } },
    ]);

    // ===== FILA 3: Fecha de exportación (mergeado A3:H3) =====
    const fechaExport = new Date().toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    hoja["A3"] = crearCelda(`Generado el ${fechaExport}`, {
      esEncabezado: false,
      esNumero: false,
    });
    Object.assign(hoja["A3"].s, {
      font: { name: "Calibri", sz: 10, italic: true, color: { rgb: "6C757D" } },
    });
    hoja["!merges"] = (hoja["!merges"] || []).concat([
      { s: { r: 2, c: 0 }, e: { r: 2, c: anchos.length - 1 } },
    ]);

    // ===== FILA 4: Encabezados de columnas =====
    encabezados.forEach((col, idx) => {
      const celdaRef = XLSX.utils.encode_cell({ r: 3, c: idx });
      hoja[celdaRef] = crearCelda(col, { esEncabezado: true });
    });

    // ===== FILAS DE DATOS (empiezan en fila 5, índice 4) =====
    const datosExportar = solicitudesFiltradas.map((s) => ({
      "Nº": s.id,
      Candidato: nombreCandidato(s.candidatoId),
      Cargo: s.cargo,
      "Familia de cargo": s.familiaCargo,
      "Fecha solicitud": s.fechaSolicitud,
      Estado: s.estado,
      Responsable: s.responsable,
      "Aspectos a Indagar": s.aspectosIndagar || "",
    }));

    datosExportar.forEach((fila, fIdx) => {
      encabezados.forEach((col, cIdx) => {
        const valor = fila[col];
        const esNumero = col === "Nº";
        const esEstado = col === "Estado";
        const celdaRef = XLSX.utils.encode_cell({ r: 4 + fIdx, c: cIdx });
        hoja[celdaRef] = crearCelda(valor, {
          esNumero,
          esEstado,
          indiceFila: fIdx,
        });
      });
    });

    // ===== FILA RESUMEN (última fila) =====
    const filaResumen = 4 + datosExportar.length;
    const totalFinalizadas = datosExportar.filter((s) => s.Estado === "Finalizada").length;
    const totalPendientes = datosExportar.filter((s) => s.Estado === "Pendiente").length;
    const totalEnProceso = datosExportar.filter((s) => s.Estado === "En proceso").length;

    hoja[`A${filaResumen}`] = crearCelda(
      `Total: ${datosExportar.length} solicitudes | Pendientes: ${totalPendientes} | En proceso: ${totalEnProceso} | Finalizadas: ${totalFinalizadas}`,
      { esResumen: true }
    );
    hoja["!merges"] = (hoja["!merges"] || []).concat([
      { s: { r: filaResumen - 1, c: 0 }, e: { r: filaResumen - 1, c: anchos.length - 1 } },
    ]);

    // ===== DEFINIR RANGO DE DATOS (¡crítico para que Excel muestre algo!) =====
    const ultimaColumna = String.fromCharCode(65 + anchos.length - 1); // A, B, C... hasta H
    hoja["!ref"] = `A1:${ultimaColumna}${filaResumen}`;

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Solicitudes");

    return libro;
  };

  const nombreReporte = () =>
    `Solicitudes_Psicolaborales_AquaChile_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const exportarAExcel = () => {
    XLSX.writeFile(crearLibroExcel(), nombreReporte());
  };

  const guardarReporteEnGoogleDrive = async () => {
    const confirmado = window.confirm(
      "El reporte contiene datos de candidatos y aspectos a indagar de sus evaluaciones. Confirma que la carpeta institucional de Google Drive tiene acceso restringido antes de subirlo."
    );
    if (!confirmado) return;

    setSubiendoReporte(true);
    try {
      const nombre = nombreReporte();
      const contenido = XLSX.write(crearLibroExcel(), { bookType: "xlsx", type: "array" });
      const response = await apiFetch("/archivos/reportes/solicitudes", {
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
          {permisos.candidatos && (
            <button
              className="btn btn-outline-light"
              onClick={guardarReporteEnGoogleDrive}
              disabled={subiendoReporte || solicitudesFiltradas.length === 0}
            >
              <i className="bi bi-cloud-arrow-up me-1"></i>
              {subiendoReporte ? "Subiendo..." : "Guardar en Google Drive"}
            </button>
          )}
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
                <td><TextoSano valor={s.aspectosIndagar} /></td>
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
