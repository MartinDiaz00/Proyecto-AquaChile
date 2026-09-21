import { createContext, useContext, useState, useEffect } from "react";

const DataContext = createContext();
export function useData() {
  return useContext(DataContext);
}

const API_URL = "https://proyecto-aquachile.onrender.com/api";
const soloFecha = (valor) => (valor ? String(valor).slice(0, 10) : "");

// --- Traductores entre snake_case (base de datos) y camelCase (React) ---
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
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/candidatos`).then((r) => r.json()),
      fetch(`${API_URL}/solicitudes`).then((r) => r.json()),
    ])
      .then(([candidatosApi, solicitudesApi]) => {
        setCandidatos(candidatosApi.map(candidatoDesdeApi));
        setSolicitudes(solicitudesApi.map(solicitudDesdeApi));
        setCargando(false);
      })
      .catch((e) => {
        setError("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
        setCargando(false);
      });
  }, []);

  const agregarCandidato = async (form) => {
    const resultado = await fetch(`${API_URL}/candidatos`, {
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
    if (!resultado.ok) throw new Error("No se pudo guardar el candidato");
    const nuevo = candidatoDesdeApi(await resultado.json());
    setCandidatos((prev) => [...prev, nuevo]);
    return nuevo;
  };
  
    const editarCandidato = async (id, form) => {
    const resultado = await fetch(`${API_URL}/candidatos/${id}`, {
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
    if (!resultado.ok) throw new Error("No se pudo actualizar el candidato");
    const actualizado = candidatoDesdeApi(await resultado.json());
    setCandidatos((prev) => prev.map((c) => (c.id === id ? actualizado : c)));
    return actualizado;
  };

  const agregarSolicitud = async (form) => {
    const resultado = await fetch(`${API_URL}/solicitudes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidato_id: form.candidatoId,
        cargo: form.cargo,
        familia_cargo: form.familiaCargo,
        fecha_solicitud: form.fechaSolicitud,
        responsable: form.responsable,
      }),
    });
    if (!resultado.ok) throw new Error("No se pudo guardar la solicitud");
    const nueva = solicitudDesdeApi(await resultado.json());
    setSolicitudes((prev) => [...prev, nueva]);
    return nueva;
  };

  const avanzarEstado = async (id) => {
    const actual = solicitudes.find((s) => s.id === id);
    if (!actual) return;
    const indiceActual = flujoEstados.indexOf(actual.estado);
    const siguiente = flujoEstados[indiceActual + 1];
    if (!siguiente) return;

    const resultado = await fetch(`${API_URL}/solicitudes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: siguiente }),
    });
    if (!resultado.ok) throw new Error("No se pudo actualizar el estado");
    const actualizada = solicitudDesdeApi(await resultado.json());
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)));
  };

  const obtenerSolicitud = (id) => solicitudes.find((s) => s.id === Number(id));

  // La evaluación se pide bajo demanda (cuando entras al detalle), no de una al abrir la app
  const obtenerEvaluacion = (solicitudId) => evaluaciones.find((e) => e.solicitudId === Number(solicitudId));

  const cargarEvaluacion = async (solicitudId) => {
    const resultado = await fetch(`${API_URL}/evaluaciones/${solicitudId}`);
    const data = await resultado.json();
    if (!data) return null;
    const evaluacion = evaluacionDesdeApi(data);
    setEvaluaciones((prev) => [...prev.filter((e) => e.solicitudId !== evaluacion.solicitudId), evaluacion]);
    return evaluacion;
  };

  const guardarEvaluacion = async (solicitudId, form) => {
    const resultado = await fetch(`${API_URL}/evaluaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        solicitud_id: Number(solicitudId),
        fecha_evaluacion: form.fechaEvaluacion,
        resultado: form.resultado,
        observaciones: form.observaciones,
      }),
    });
    if (!resultado.ok) throw new Error("No se pudo guardar la evaluación");
    const evaluacion = evaluacionDesdeApi(await resultado.json());
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

  return (
    <DataContext.Provider
      value={{
        candidatos,
        solicitudes,
        evaluaciones,
        cargando,
        error,
        agregarCandidato,
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