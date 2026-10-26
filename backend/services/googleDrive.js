const { google } = require("googleapis");
const { Readable } = require("node:stream");

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const OAUTH_REDIRECT_URI = "http://localhost:3000/oauth2callback";
const FILE_FIELDS = "id,name,webViewLink,size";

class GoogleDriveError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "GoogleDriveError";
    this.status = status;
  }
}

function getConfiguration() {
  const required = [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "GOOGLE_DRIVE_FOLDER_AQUACHILE_ID",
    "GOOGLE_DRIVE_FOLDER_REPORTES_ID",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new GoogleDriveError(
      `Integración Google Drive no configurada. Faltan variables: ${missing.join(", ")}.`,
      503
    );
  }

  return {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    folderAquachileId: process.env.GOOGLE_DRIVE_FOLDER_AQUACHILE_ID,
    folderReportesId: process.env.GOOGLE_DRIVE_FOLDER_REPORTES_ID,
  };
}

function crearDrive(config) {
  const auth = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    OAUTH_REDIRECT_URI
  );
  auth.setCredentials({ refresh_token: config.refreshToken });
  return google.drive({ version: "v3", auth });
}

function escaparConsulta(valor) {
  return String(valor).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function obtenerMensaje(error) {
  return error.response?.data?.error?.message || error.message || "error de Google Drive";
}

async function ejecutarGoogleDrive(operacion, accion) {
  try {
    return await accion();
  } catch (error) {
    const status = Number(error.code);
    if (status === 404 && operacion === "eliminar el archivo") return;
    const mensaje = obtenerMensaje(error);
    if (!Number.isFinite(status)) {
      throw new GoogleDriveError(`No se pudo conectar con Google Drive para ${operacion}: ${mensaje}`, 503);
    }
    throw new GoogleDriveError(`No se pudo ${operacion} en Google Drive: ${mensaje}`, 502);
  }
}

async function obtenerOCrearCarpeta(drive, carpetaPadreId, nombre) {
  const existentes = await drive.files.list({
    q: `'${escaparConsulta(carpetaPadreId)}' in parents and name = '${escaparConsulta(nombre)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id,name)",
    pageSize: 2,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const existente = existentes.data.files?.[0];
  if (existente) return existente.id;

  const creada = await drive.files.create({
    requestBody: {
      name: nombre,
      mimeType: "application/vnd.google-apps.folder",
      parents: [carpetaPadreId],
    },
    fields: "id,name",
    supportsAllDrives: true,
  });
  return creada.data.id;
}

async function subirArchivo({
  carpeta,
  nombre,
  tipoContenido,
  contenido,
  candidatoId,
  candidatoNombre,
}) {
  const config = getConfiguration();
  const folderIds = {
    reportes: config.folderReportesId,
  };
  if (carpeta !== "cvs" && !folderIds[carpeta]) {
    throw new GoogleDriveError("La carpeta de destino de Google Drive no es válida.", 500);
  }
  const drive = crearDrive(config);

  return ejecutarGoogleDrive("subir el archivo", async () => {
    const folderId = carpeta === "cvs"
      ? await obtenerOCrearCarpeta(
          drive,
          config.folderAquachileId,
          `${candidatoNombre} (ID ${candidatoId})`
        )
      : folderIds[carpeta];
    const existentes = await drive.files.list({
      q: `'${escaparConsulta(folderId)}' in parents and name = '${escaparConsulta(nombre)}' and trashed = false`,
      fields: `files(${FILE_FIELDS})`,
      pageSize: 2,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const existente = existentes.data.files?.[0];
    const media = {
      mimeType: tipoContenido,
      body: Readable.from([contenido]),
    };
    const respuesta = existente
      ? await drive.files.update({
          fileId: existente.id,
          media,
          fields: FILE_FIELDS,
          supportsAllDrives: true,
        })
      : await drive.files.create({
          requestBody: { name: nombre, mimeType: tipoContenido, parents: [folderId] },
          media,
          fields: FILE_FIELDS,
          supportsAllDrives: true,
        });
    const archivo = respuesta.data;
    return {
      id: archivo.id,
      name: archivo.name,
      webUrl: archivo.webViewLink,
      size: archivo.size,
    };
  });
}

async function eliminarArchivo(fileId) {
  const config = getConfiguration();
  const drive = crearDrive(config);
  await ejecutarGoogleDrive("eliminar el archivo", () =>
    drive.files.delete({ fileId, supportsAllDrives: true })
  );
}

module.exports = { GoogleDriveError, subirArchivo, eliminarArchivo };
