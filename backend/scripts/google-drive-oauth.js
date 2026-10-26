const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { google } = require("googleapis");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const ENV_PATH = path.join(__dirname, "..", ".env");

function actualizarRefreshToken(refreshToken) {
  const contenido = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8")
    : "";
  const lineas = contenido ? contenido.split(/\r?\n/) : [];
  const variable = "GOOGLE_OAUTH_REFRESH_TOKEN";
  const indice = lineas.findIndex((linea) =>
    new RegExp(`^\\s*${variable}\\s*=`).test(linea)
  );
  const nuevaLinea = `${variable}=${refreshToken}`;

  if (indice >= 0) {
    lineas[indice] = nuevaLinea;
  } else {
    if (lineas.length > 0 && lineas[lineas.length - 1] !== "") lineas.push("");
    lineas.push(nuevaLinea);
  }

  const saltoLinea = contenido.includes("\r\n") ? "\r\n" : "\n";
  fs.writeFileSync(ENV_PATH, lineas.join(saltoLinea), {
    encoding: "utf8",
    mode: 0o600,
  });
}

async function autorizar() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Configura GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en backend/.env antes de continuar."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );
  const state = randomBytes(24).toString("hex");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });

  await new Promise((resolve, reject) => {
    let terminado = false;
    const finalizar = (error) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(limite);
      if (server.listening) server.close();
      if (error) reject(error);
      else resolve();
    };

    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== "/oauth2callback") {
        res.writeHead(404).end("No encontrado.");
        return;
      }

      if (url.searchParams.get("state") !== state) {
        res.writeHead(400).end("La solicitud de autorización no es válida.");
        finalizar(new Error("El estado OAuth recibido no coincide."));
        return;
      }

      const oauthError = url.searchParams.get("error");
      if (oauthError) {
        res.writeHead(400).end("Google no autorizó el acceso. Puedes cerrar esta ventana.");
        finalizar(new Error(`Google rechazó la autorización: ${oauthError}`));
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(400).end("Google no devolvió un código de autorización.");
        finalizar(new Error("No se recibió el código de autorización de Google."));
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.refresh_token) {
          throw new Error(
            "Google no entregó un refresh token. Revoca el acceso anterior de esta aplicación en tu cuenta Google y vuelve a ejecutar la autorización."
          );
        }
        actualizarRefreshToken(tokens.refresh_token);
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Autorización completada. Puedes cerrar esta ventana.");
        finalizar();
      } catch (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("No se pudo guardar la autorización. Revisa la terminal.");
        finalizar(error);
      }
    });

    const limite = setTimeout(
      () => finalizar(new Error("Se agotó el tiempo para autorizar Google Drive.")),
      5 * 60 * 1000
    );

    server.on("error", (error) => {
      finalizar(
        error.code === "EADDRINUSE"
          ? new Error("El puerto 3000 ya está en uso. Ciérralo e inténtalo nuevamente.")
          : error
      );
    });

    server.listen(3000, "127.0.0.1", () => {
      console.log("Abre esta URL e inicia sesión con la cuenta institucional:");
      console.log(authUrl);
      console.log("\nEsperando autorización en http://localhost:3000 ...");
    });
  });
}

autorizar().then(
  () => console.log("Refresh token guardado en backend/.env."),
  (error) => {
    console.error(`No se pudo autorizar Google Drive: ${error.message}`);
    process.exitCode = 1;
  }
);
