const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const express = require("express");
const crearRouterGoogleForm = require("./googleForm").crearRouterGoogleForm;

const TOKEN = "token-de-prueba";
let server;
let baseUrl;
let consultas;
let idSiguiente;

before(async () => {
  const app = express();
  consultas = [];
  idSiguiente = 1;
  const pool = {
    async query(sql, parametros) {
      consultas.push({ sql, parametros });
      if (sql.startsWith("SELECT id FROM candidatos")) {
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO candidatos")) {
        return {
          rows: [{
            id: idSiguiente++,
            nombre: parametros[0],
            correo: parametros[1],
            telefono: parametros[2],
            cargo_postulado: parametros[3],
            familia_cargo: parametros[4],
          }],
        };
      }
      throw new Error("Consulta inesperada en la prueba.");
    },
  };

  app.use("/api/google-form", crearRouterGoogleForm({
    pool,
    obtenerToken: () => TOKEN,
  }));
  server = await new Promise((resolve) => {
    const httpServer = app.listen(0, "127.0.0.1", () => resolve(httpServer));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/google-form/candidatos`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function enviar({ token, candidato } = {}) {
  const headers = { "content-type": "application/json" };
  if (token !== undefined) headers["x-webhook-token"] = token;
  return fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(candidato || {
      nombre: "Candidato de prueba",
      correo: "prueba@example.com",
      telefono: "",
      cargo_postulado: "Analista",
      familia_cargo: "Profesional A",
    }),
  });
}

test("responde 401 cuando falta el token", async () => {
  consultas = [];
  const response = await enviar();
  assert.equal(response.status, 401);
  assert.equal(consultas.length, 0);
});

test("responde 401 cuando el token es incorrecto", async () => {
  consultas = [];
  const response = await enviar({ token: "incorrecto" });
  assert.equal(response.status, 401);
  assert.equal(consultas.length, 0);
});

test("responde 400 cuando el correo no es válido", async () => {
  consultas = [];
  const response = await enviar({
    token: TOKEN,
    candidato: {
      nombre: "Candidato de prueba",
      correo: "no-es-correo",
      cargo_postulado: "Analista",
      familia_cargo: "Profesional A",
    },
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /correo/i);
  assert.equal(consultas.length, 0);
});

test("responde 200 cuando el correo ya existe", async () => {
  consultas = [];
  const pool = {
    async query(sql, parametros) {
      consultas.push({ sql, parametros });
      return { rows: [{ id: 23 }] };
    },
  };
  const app = express();
  app.use("/api/google-form", crearRouterGoogleForm({
    pool,
    obtenerToken: () => TOKEN,
  }));
  const duplicateServer = await new Promise((resolve) => {
    const httpServer = app.listen(0, "127.0.0.1", () => resolve(httpServer));
  });
  try {
    const response = await fetch(
      `http://127.0.0.1:${duplicateServer.address().port}/api/google-form/candidatos`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-webhook-token": TOKEN,
        },
        body: JSON.stringify({
          nombre: "Candidato existente",
          correo: "prueba@example.com",
          cargo_postulado: "Analista",
          familia_cargo: "Profesional A",
        }),
      }
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).estado, "duplicado");
    assert.equal(consultas.length, 1);
  } finally {
    await new Promise((resolve, reject) => {
      duplicateServer.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("responde 201 y usa parámetros para insertar un candidato válido", async () => {
  consultas = [];
  const response = await enviar({ token: TOKEN });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.estado, "creado");
  assert.equal(body.candidato.familia_cargo, "Profesional A");
  const insercion = consultas.find(({ sql }) => sql.includes("INSERT INTO candidatos"));
  assert.ok(insercion);
  assert.match(insercion.sql, /\$1[\s\S]*\$5/);
  assert.deepEqual(insercion.parametros, [
    "Candidato de prueba",
    "prueba@example.com",
    null,
    "Analista",
    "Profesional A",
  ]);
});
