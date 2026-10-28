# SGP Psicolaboral — AquaChile

Aplicación web para administrar candidatos, solicitudes y evaluaciones
psicolaborales, con trazabilidad del proceso y control de acceso por roles.

## Contenido

- [Funciones principales](#funciones-principales)
- [Tecnologías](#tecnologías)
- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Configuración local](#configuración-local)
- [Google Forms](#integración-con-google-forms)
- [Google Drive](#integración-con-google-drive)
- [Pruebas](#pruebas)
- [Roles](#roles)
- [API](#api)
- [Seguridad y datos](#seguridad-y-datos)

## Funciones principales

- Registro, consulta, edición y búsqueda de candidatos.
- Creación y seguimiento de solicitudes asociadas a candidatos.
- Registro de evaluaciones y visualización de indicadores.
- Control de acceso mediante inicio de sesión, JWT y permisos por rol.
- Exportación de reportes y gestión opcional de archivos en Google Drive.
- Recepción de candidatos desde Google Forms mediante un webhook protegido.

Usa datos ficticios o anonimizados en las pruebas y demostraciones.

## Tecnologías

- **Frontend:** React, Vite, React Router y Bootstrap 5.
- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL en Neon.
- **Pruebas frontend:** Vitest.
- **Pruebas backend:** `node:test`.

## Estructura

```text
backend/      API Express, autenticación e integración con PostgreSQL
frontend/     Aplicación React
neon/         Migraciones SQL de esquema
```

## Requisitos

- Node.js 20.19 o superior (recomendado: versión LTS vigente).
- npm.
- Una base PostgreSQL en Neon para ejecutar la aplicación completa.

## Configuración local

### 1. Preparar Neon

En Neon, abre **SQL Editor** y ejecuta los scripts en este orden:

1. `neon/01_roles_y_usuarios.sql`
2. `neon/02_tablas_principales.sql`
3. `neon/03_sanitizacion_texto.sql`
4. `neon/04_archivos_google_drive.sql`
5. `neon/05_datos_cv_candidatos.sql`
6. `neon/06_compatibilidad_candidatos.sql`

El índice de correo normalizado de `neon/07_google_form_candidatos.sql` es
opcional para la integración de Google Forms. Antes de ejecutar su creación,
revisa la consulta de duplicados incluida en el archivo y resuelve las filas
repetidas, si las hay.

### 2. Instalar y configurar el backend

Desde PowerShell, en la raíz del proyecto:

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
```

Edita `backend/.env` y configura, como mínimo:

- `DATABASE_URL`: cadena de conexión de Neon.
- `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres.
- `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`: datos de la primera cuenta
  administradora. La contraseña debe tener al menos 12 caracteres.
- `GOOGLE_FORM_TOKEN`: token secreto para el webhook de Google Forms.

Genera secretos aleatorios, por ejemplo:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

No compartas ni subas `backend/.env`. Está excluido por
`backend/.gitignore`; utiliza `backend/.env.example` como plantilla.

Crea la primera cuenta administradora e inicia el backend:

```powershell
npm run crear-admin
npm run dev
```

La API estará en `http://localhost:4000`. Comprueba el servicio en
`http://localhost:4000/health`.

### 3. Instalar e iniciar el frontend

Abre otra terminal PowerShell desde la raíz:

```powershell
Set-Location frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Vite muestra la dirección local en la terminal, normalmente
`http://localhost:5173`. El frontend usa por defecto
`http://localhost:4000/api`; puedes cambiarlo con `VITE_API_URL` en
`frontend/.env`.

Inicia sesión con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Desde **Usuarios**, la
persona administradora puede crear cuentas adicionales y asignar roles.

## Integración con Google Forms

La ruta `POST /api/google-form/candidatos` recibe las respuestas de Apps Script.
Requiere el encabezado `x-webhook-token` con el valor de `GOOGLE_FORM_TOKEN`.
No usa JWT de usuario. Valida nombre, correo, cargo y familia de cargo, limita
el tamaño de la solicitud y aplica rate limiting.

Preguntas esperadas: `Nombre`, `Correo`, `Teléfono` (opcional),
`Cargo postulado` y `Familia de cargo`. Las opciones válidas de familia son:

- Profesional A
- Profesional B
- Operario Calificado
- Supervisor B
- Jefatura

Para una prueba local desde Apps Script, Google necesita acceder a una URL
pública temporal que reenvíe al puerto local del backend (por ejemplo, un
túnel de ngrok). No es necesario desplegar en Render. Consulta
[PASO_A_PASO_GOOGLE_FORM.txt](./PASO_A_PASO_GOOGLE_FORM.txt) para los pasos
de creación, configuración y prueba. La llamada de Apps Script al backend es
servidor a servidor; no requiere CORS.

Respuestas principales: `201` creado, `200` correo duplicado, `400` datos
inválidos y `401` token ausente o incorrecto.

## Integración con Google Drive

Google Drive es opcional. Se usa para guardar CV y reportes; Neon sigue siendo
la base de datos de candidatos. Para habilitar la función:

1. Habilita Google Drive API y configura OAuth en un proyecto de Google Cloud
   aprobado por la institución.
2. Completa `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` en
   `backend/.env`.
3. Crea en Mi unidad las carpetas privadas `AquaChile` y `Reportes`, y
   configura sus IDs en `GOOGLE_DRIVE_FOLDER_AQUACHILE_ID` y
   `GOOGLE_DRIVE_FOLDER_REPORTES_ID`.
4. Ejecuta `npm run autorizar-drive` desde `backend` y sigue la autorización
   con la cuenta institucional propietaria de los archivos.
5. Ejecuta en Neon las migraciones de archivos y candidatos indicadas arriba.

Los CV y reportes pueden contener datos personales. Restringe el acceso a las
carpetas y confirma que su uso está autorizado. El refresh token también es
secreto y debe permanecer en el backend.

## Pruebas

Desde `frontend`:

```powershell
npm test
npm run test:watch
npm run build
```

Vitest verifica la validación de formularios de candidatos, solicitudes y
evaluaciones, además de la búsqueda y los filtros. En la versión actual hay
10 pruebas automatizadas.

Desde `backend`:

```powershell
npm test
```

Las pruebas del webhook cubren token ausente e incorrecto, correo inválido,
duplicado y creación válida.

## Roles

- **Administrador académico:** administración de usuarios, candidatos,
  solicitudes y evaluaciones.
- **Analista de Reclutamiento:** creación y edición de candidatos, y creación
  de solicitudes.
- **Profesional Evaluador:** consulta de solicitudes, evaluación y avance de
  estado.
- **Jefatura o contraparte simulada:** consulta de dashboard y solicitudes.

Los permisos se validan en el frontend y en los endpoints protegidos del
backend.

## API

- **Autenticación:** `/api/auth`
- **Candidatos:** `/api/candidatos`
- **Solicitudes:** `/api/solicitudes`
- **Evaluaciones:** `/api/evaluaciones`
- **Archivos:** `/api/archivos`
- **Google Forms:** `POST /api/google-form/candidatos`
- **Salud del backend:** `GET /health`

Las rutas protegidas requieren el token de sesión en
`Authorization: Bearer <token>`. El webhook de Google Forms utiliza únicamente
`x-webhook-token`.

## Seguridad y datos

- Mantén `DATABASE_URL`, tokens y credenciales solo en el backend.
- No agregues secretos a archivos versionados ni a variables `VITE_*`.
- Rota de inmediato cualquier secreto expuesto y actualiza sus consumidores.
- Usa datos ficticios o anonimizados en las pruebas.
- No publiques archivos de candidatos ni carpetas de Drive.
