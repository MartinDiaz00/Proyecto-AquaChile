export const candidatos = [
  { id: 1, nombre: "Josman Radatz", correo: "josman.radatz@correo.cl", telefono: "+56912345678", cargoPostulado: "Operador de máquina", familiaCargo: "Operario Calificado" },
  { id: 2, nombre: "Camila Muñoz", correo: "camila.munoz@correo.cl", telefono: "+56923456789", cargoPostulado: "Analista de Sistemas", familiaCargo: "Profesional B" },
  { id: 3, nombre: "Marcos Fonseca", correo: "marcos.fonseca@correo.cl", telefono: "+56934567890", cargoPostulado: "Supervisor Planta", familiaCargo: "Supervisor B" },
];

export const solicitudes = [
  { id: 1, candidatoId: 1, cargo: "Operador de máquina", familiaCargo: "Operario Calificado", fechaSolicitud: "2026-09-01", estado: "Pendiente", responsable: "María Victoria", observaciones: "" },
  { id: 2, candidatoId: 2, cargo: "Analista de Sistemas", familiaCargo: "Profesional B", fechaSolicitud: "2026-08-28", estado: "En proceso", responsable: "María Victoria", observaciones: "Entrevista agendada" },
  { id: 3, candidatoId: 3, cargo: "Supervisor Planta", familiaCargo: "Supervisor B", fechaSolicitud: "2026-08-20", estado: "Finalizada", responsable: "María Victoria", observaciones: "Informe enviado" },
];

export const evaluaciones = [
  { id: 1, solicitudId: 3, fechaEvaluacion: "2026-08-25", resultado: "Recomendado", estado: "Completada" },
];