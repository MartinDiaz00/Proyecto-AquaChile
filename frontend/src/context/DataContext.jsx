import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch, API_URL } from "../services/api";

const DataContext = createContext();
export function useData() {
  return useContext(DataContext);
}

const soloFecha = (valor) => (valor ? String(valor).slice(0, 10) : "");

const candidatoDesdeApi = (c) => ({
  id: c.id,
  nombre: c.nombre,
  correo: c.correo,
  telefono: c.telefono,
  cargoPostulado: c.cargo_postulado,
  familiaCargo: c.familia_cargo,
});

const solicitudDesdeApi = (s) => ({
  id: s.id,
  candidatoId: s.candidato_id,
  cargo: s.cargo,
  familiaCargo: s.familia_cargo,
  fechaSolicitud: soloFecha(s.fecha_solicitud),
  estado: s.estado,
  responsable: s.responsable,
  observaciones: s.observaciones,
  origenCandidato: s.origen_candidato,
  unidad: s.unidad,
  requiereReferencias: s.requiere_referencias,
  ceco: s.ceco,
  cvAdjunto: s.cv_adjunto,
  descriptorAdjunto: s.descriptor_adjunto,
  aspectosIndagar: s.aspectos_indagar,
  esReferido: s.es_referido,
});

const evaluacionDesdeApi = (e) => ({
  id: e.id,
  solicitudId: e.solicitud_id,
  fechaEvaluacion: soloFecha(e.fecha_evaluacion),
  resultado: e.resultado,
  observaciones: e.observaciones,
  estado: e.estado,
});

export function DataProvider({ children }) {
  const [candidatos, setCandidatos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const flujoEstados = ["Pendiente", "En proceso", "Finalizada"];

  // Al abrir la app, trae candidatos y solicitudes reales desde la base de datos
  // Solo si hay sesión activa (token). Si no hay sesión, no hay nada que cargar.
  useEffect(() => {
    const token = localStorage.getItem("tokenSGP");
    if (!token) {
      setCargando(false);
      return undefined;
    }

    let vigente = true;
    Promise.all([
      apiFetch("/candidatos"),
      apiFetch("/solicitudes"),
    ])
      .then(async ([candidatosRes, solicitudesRes]) => {
        if (!vigente) return;
        const candidatosApi = await candidatosRes.safeJson();
        const solicitudesApi = await solicitudesRes.safeJson();
        if (!candidatosRes.ok || !solicitudesRes.ok) {
          const esErrorRed =
            candidatosApi._nonJson ||
            solicitudesApi._nonJson ||
            candidatosApi.mensaje?.includes("conectar") ||
            solicitudesApi.mensaje?.includes("conectar");
          if (!esErrorRed) {
            setError(
              candidatosApi.mensaje ||
                solicitudesApi.mensaje ||
                "No se pudieron cargar los datos."
            );
          }
        } else {
          setCandidatos(candidatosApi.map(candidatoDesdeApi));
          setSolicitudes(solicitudesApi.map(solicitudDesdeApi));
        }
        setCargando(false);
      })
      .catch((e) => {
        if (!vigente) return;
        setCargando(false);
      });

    return () => { vigente = false; };
  }, [API_URL]);

  const agregarCandidato = async (form) => {
    const resultado = await apiFetch("/candidatos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        correo: form.correo,
        telefono: form.telefono,
        cargo_postulado: form.cargoPostulado,
        familia_cargo: form.familiaCargo,
      }),
    });
    if (!resultado.ok) {
      const errorData = await resultado.safeJson();
      const detalle =
        errorData.error ||
        errorData.mensaje ||
        (errorData._raw ? `Respuesta no JSON: ${errorData._raw.slice(0, 200)}` : "") ||
        "sin respuesta del servidor";
      throw new Error(`Error ${resultado.status}: ${detalle}`);
    }
    const nuevo = candidatoDesdeApi(await resultado.safeJson());
    setCandidatos((prev) => [...prev, nuevo]);
    return nuevo;
  };

  const editarCandidato = async (id, form) => {
    const resultado = await apiFetch(`/candidatos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        correo: form.correo,
        telefono: form.telefono,
        cargo_postulado: form.cargoPostulado,
        familia_cargo: form.familiaCargo,
      }),
    });
    if (!resultado.ok) {
      const errorData = await resultado.safeJson();
      const detalle =
        errorData.error ||
        errorData.mensaje ||
        (errorData._raw ? `Respuesta no JSON: ${errorData._raw.slice(0, 200)}` : "") ||
        "sin respuesta del servidor";
      throw new Error(`Error ${resultado.status}: ${detalle}`);
    }
    const actualizado = candidatoDesdeApi(await resultado.safeJson());
    setCandidatos((prev) => prev.map((c) => (c.id === id ? actualizado : c)));
    return actualizado;
  };

  const agregarSolicitud = async (form) => {
    const resultado = await apiFetch("/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidato_id: form.candidatoId,
        cargo: form.cargo,
        familia_cargo: form.familiaCargo,
        fecha_solicitud: form.fechaSolicitud,
        responsable: form.responsable,
        origen_candidato: form.origenCandidato,
        unidad: form.unidad,
        requiere_referencias: form.requiereReferencias,
        ceco: form.ceco,
        cv_adjunto: form.cvAdjunto,
        descriptor_adjunto: form.descriptorAdjunto,
        aspectos_indagar: form.aspectosIndagar,
        es_referido: form.esReferido,
      }),
    });
    if (!resultado.ok) {
      const errorData = await resultado.safeJson();
      const detalle =
        errorData.error ||
        errorData.mensaje ||
        (errorData._raw ? `Respuesta no JSON: ${errorData._raw.slice(0, 200)}` : "") ||
        "sin respuesta del servidor";
      throw new Error(`Error ${resultado.status}: ${detalle}`);
    }
    const nueva = solicitudDesdeApi(await resultado.safeJson());
    setSolicitudes((prev) => [...prev, nueva]);
    return nueva;
  };

  const avanzarEstado = async (id) => {
    const actual = solicitudes.find((s) => s.id === id);
    if (!actual) return;
    const indiceActual = flujoEstados.indexOf(actual.estado);
    const siguiente = flujoEstados[indiceActual + 1];
    if (!siguiente) return;

    const resultado = await apiFetch(`/solicitudes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: siguiente }),
    });
    if (!resultado.ok) {
      const errorData = await resultado.safeJson();
      const detalle =
        errorData.error ||
        errorData.mensaje ||
        (errorData._raw ? `Respuesta no JSON: ${errorData._raw.slice(0, 200)}` : "") ||
        "sin respuesta del servidor";
      throw new Error(`Error ${resultado.status}: ${detalle}`);
    }
    const actualizada = solicitudDesdeApi(await resultado.safeJson());
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)));
  };

  const obtenerSolicitud = (id) => solicitudes.find((s) => s.id === Number(id));

  const obtenerEvaluacion = (solicitudId) => evaluaciones.find((e) => e.solicitudId === Number(solicitudId));

  const cargarEvaluacion = async (solicitudId) => {
    const resultado = await apiFetch(`/evaluaciones/${solicitudId}`);
    const data = await resultado.safeJson();
    if (!data) return null;
    const evaluacion = evaluacionDesdeApi(data);
    setEvaluaciones((prev) => [...prev.filter((e) => e.solicitudId !== evaluacion.solicitudId), evaluacion]);
    return evaluacion;
  };

  const guardarEvaluacion = async (solicitudId, form) => {
    const resultado = await apiFetch("/evaluaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solicitud_id: Number(solicitudId),
        fecha_evaluacion: form.fechaEvaluacion,
        resultado: form.resultado,
        observaciones: form.observaciones,
      }),
    });
    if (!resultado.ok) {
      const errorData = await resultado.safeJson();
      const detalle =
        errorData.error ||
        errorData.mensaje ||
        (errorData._raw ? `Respuesta no JSON: ${errorData._raw.slice(0, 200)}` : "") ||
        "sin respuesta del servidor";
      throw new Error(`Error ${resultado.status}: ${detalle}`);
    }
    const evaluacion = evaluacionDesdeApi(await resultado.safeJson());
    setEvaluaciones((prev) => [...prev.filter((e) => e.solicitudId !== evaluacion.solicitudId), evaluacion]);
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === Number(solicitudId) ? { ...s, estado: "Finalizada" } : s))
    );
    return evaluacion;
  };

  const nombreCandidato = (candidatoId) => {
    const candidato = candidatos.find((c) => c.id === Number(candidatoId));
    return candidato ? candidato.nombre : "—";
  };

  const limpiarError = () => setError(null);

  return (
    <DataContext.Provider
      value={{
        candidatos,
        solicitudes,
        evaluaciones,
        cargando,
        error,
        limpiarError,
        agregarCandidato,
        editarCandidato,
        agregarSolicitud,
        avanzarEstado,
        obtenerSolicitud,
        obtenerEvaluacion,
        cargarEvaluacion,
        guardarEvaluacion,
        nombreCandidato,
        flujoEstados,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
