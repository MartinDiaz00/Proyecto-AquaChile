export const FAMILIAS_CARGO = [
  "Profesional A",
  "Profesional B",
  "Operario Calificado",
  "Supervisor B",
  "Jefatura",
];

export function validarFormularioCandidato(form) {
  const errores = {};
  if (!form.nombre.trim()) errores.nombre = "El nombre es obligatorio";
  if (!form.correo.trim()) {
    errores.correo = "El correo es obligatorio";
  } else if (!/\S+@\S+\.\S+/.test(form.correo)) {
    errores.correo = "El correo no tiene un formato válido";
  }
  if (!form.cargoPostulado.trim()) errores.cargoPostulado = "El cargo es obligatorio";
  if (!form.familiaCargo) errores.familiaCargo = "Selecciona una familia de cargo";
  return errores;
}

export function filtrarCandidatos(candidatos, busqueda) {
  const texto = busqueda.toLowerCase();
  return candidatos.filter((candidato) => (
    candidato.nombre.toLowerCase().includes(texto) ||
    (candidato.correo || "").toLowerCase().includes(texto) ||
    (candidato.cargoPostulado || "").toLowerCase().includes(texto)
  ));
}

export function validarFormularioSolicitud(form, hoy) {
  const errores = {};
  if (!form.candidatoId) errores.candidatoId = "Selecciona un candidato";
  if (!form.origenCandidato) errores.origenCandidato = "Indica si es externo o interno";
  if (!form.cargo.trim()) errores.cargo = "El cargo es obligatorio";
  if (!form.familiaCargo.trim()) errores.familiaCargo = "La familia de cargo es obligatoria";
  if (!form.fechaSolicitud) errores.fechaSolicitud = "La fecha es obligatoria";
  else if (form.fechaSolicitud < hoy) errores.fechaSolicitud = "La fecha no puede ser anterior a hoy";
  if (!form.responsable.trim()) errores.responsable = "El responsable es obligatorio";
  return errores;
}

export function filtrarSolicitudes(
  solicitudes,
  { estado, cargo, candidato, fecha },
  nombreCandidato
) {
  return solicitudes
    .filter((solicitud) => estado === "Todos" || solicitud.estado === estado)
    .filter((solicitud) => solicitud.cargo.toLowerCase().includes(cargo.toLowerCase()))
    .filter((solicitud) => nombreCandidato(solicitud.candidatoId).toLowerCase().includes(candidato.toLowerCase()))
    .filter((solicitud) => !fecha || solicitud.fechaSolicitud === fecha);
}

export function validarFormularioEvaluacion(form) {
  const errores = {};
  if (!form.fechaEvaluacion) errores.fechaEvaluacion = "La fecha es obligatoria";
  if (!form.resultado) errores.resultado = "Selecciona un resultado";
  return errores;
}
