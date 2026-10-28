import { describe, expect, it } from "vitest";
import {
  FAMILIAS_CARGO,
  filtrarCandidatos,
  filtrarSolicitudes,
  validarFormularioCandidato,
  validarFormularioEvaluacion,
  validarFormularioSolicitud,
} from "./validaciones";

describe("validación del formulario de candidatos", () => {
  it("marca los campos requeridos cuando están vacíos", () => {
    expect(validarFormularioCandidato({
      nombre: " ",
      correo: "",
      cargoPostulado: "",
      familiaCargo: "",
    })).toEqual({
      nombre: "El nombre es obligatorio",
      correo: "El correo es obligatorio",
      cargoPostulado: "El cargo es obligatorio",
      familiaCargo: "Selecciona una familia de cargo",
    });
  });

  it("rechaza un correo con formato inválido", () => {
    const errores = validarFormularioCandidato({
      nombre: "Candidata ficticia",
      correo: "correo-invalido",
      cargoPostulado: "Analista",
      familiaCargo: FAMILIAS_CARGO[0],
    });

    expect(errores.correo).toBe("El correo no tiene un formato válido");
    expect(Object.keys(errores)).toEqual(["correo"]);
  });

  it("acepta un candidato completo con correo válido", () => {
    expect(validarFormularioCandidato({
      nombre: "Candidato ficticio",
      correo: "candidato@example.com",
      cargoPostulado: "Analista",
      familiaCargo: FAMILIAS_CARGO[0],
    })).toEqual({});
  });
});

describe("búsqueda de candidatos", () => {
  const candidatos = [
    { id: 1, nombre: "Ana Pérez", correo: "ana@example.com", cargoPostulado: "Analista" },
    { id: 2, nombre: "Luis Soto", correo: "luis@example.com", cargoPostulado: "Supervisor" },
  ];

  it("encuentra candidatos por nombre, correo o cargo sin distinguir mayúsculas", () => {
    expect(filtrarCandidatos(candidatos, "ANA").map(({ id }) => id)).toEqual([1]);
    expect(filtrarCandidatos(candidatos, "LUIS@EXAMPLE").map(({ id }) => id)).toEqual([2]);
    expect(filtrarCandidatos(candidatos, "supervisor").map(({ id }) => id)).toEqual([2]);
  });

  it("devuelve todos los candidatos con búsqueda vacía y ninguno sin coincidencia", () => {
    expect(filtrarCandidatos(candidatos, "")).toEqual(candidatos);
    expect(filtrarCandidatos(candidatos, "inexistente")).toEqual([]);
  });
});

describe("validación y filtros de solicitudes", () => {
  const solicitudValida = {
    candidatoId: "5",
    origenCandidato: "Externo",
    cargo: "Analista",
    familiaCargo: "Profesional A",
    fechaSolicitud: "2026-10-28",
    responsable: "Responsable ficticio",
  };

  it("acepta una solicitud completa con fecha de hoy", () => {
    expect(validarFormularioSolicitud(solicitudValida, "2026-10-28")).toEqual({});
  });

  it("rechaza una fecha anterior a hoy", () => {
    expect(validarFormularioSolicitud({
      ...solicitudValida,
      fechaSolicitud: "2026-10-27",
    }, "2026-10-28")).toEqual({
      fechaSolicitud: "La fecha no puede ser anterior a hoy",
    });
  });

  it("aplica simultáneamente estado, cargo, candidato y fecha", () => {
    const solicitudes = [
      { id: 1, estado: "Pendiente", cargo: "Analista", candidatoId: 5, fechaSolicitud: "2026-10-28" },
      { id: 2, estado: "Finalizada", cargo: "Analista", candidatoId: 5, fechaSolicitud: "2026-10-28" },
      { id: 3, estado: "Pendiente", cargo: "Supervisor", candidatoId: 7, fechaSolicitud: "2026-10-27" },
    ];
    const resultado = filtrarSolicitudes(
      solicitudes,
      { estado: "Pendiente", cargo: "anal", candidato: "ana", fecha: "2026-10-28" },
      (id) => id === 5 ? "Ana Pérez" : "Luis Soto"
    );

    expect(resultado.map(({ id }) => id)).toEqual([1]);
  });
});

describe("validación de evaluación", () => {
  it("requiere fecha y resultado", () => {
    expect(validarFormularioEvaluacion({ fechaEvaluacion: "", resultado: "" })).toEqual({
      fechaEvaluacion: "La fecha es obligatoria",
      resultado: "Selecciona un resultado",
    });
  });

  it("acepta una evaluación completa", () => {
    expect(validarFormularioEvaluacion({
      fechaEvaluacion: "2026-10-28",
      resultado: "Recomendado",
    })).toEqual({});
  });
});
