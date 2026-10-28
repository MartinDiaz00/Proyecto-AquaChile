# SGP Psicolaboral — MVP AquaChile

Aplicación Full Stack para gestionar candidatos, solicitudes y evaluaciones psicolaborales.

## Tecnologías
- Frontend: React + Vite + Bootstrap.
- Backend: Node.js + Express.
- Base de datos: PostgreSQL en Neon.

## Cambios de esta versión
- Login real con correo y contraseña.
- Contraseñas almacenadas como hash con bcrypt.
- Sesiones mediante JWT.
- Roles y permisos comprobados también en el backend.
- Pantalla de administración de usuarios, disponible solo para Administrador académico.
- Conserva las funciones existentes de candidatos, solicitudes, evaluaciones y dashboard.
- Saneado de texto: tildes, Ñ y símbolos se guardan siempre en UTF-8 válido.
- Validación de datos en la API (correos, fechas, largos y referencias).

## Roles
- **Administrador académico:** administración de usuarios, candidatos, solicitudes y evaluaciones.
- **Analista de Reclutamiento:** creación/edición de candidatos y creación de solicitudes.
- **Profesional Evaluador:** consulta de solicitudes, registro de evaluaciones y avance de estado.
- **Jefatura o contraparte simulada:** consulta del dashboard y solicitudes, sin modificar registros.

Los permisos son una propuesta coherente con los permisos simulados del MVP. El backend los valida en cada endpoint protegido.

## 1. Configurar Neon
1. Abre Neon y entra a SQL Editor.
2. Copia y ejecuta el archivo `neon/01_roles_y_usuarios.sql` (crea roles y usuarios del sistema).
3. Copia y ejecuta el archivo `neon/02_tablas_principales.sql` (crea `candidatos`, `solicitudes` y `evaluaciones`).
4. Ninguno de los scripts elimina ni modifica tablas existentes; solo crean si no existen.
5. Para habilitar CV y Google Drive, ejecuta también `neon/04_archivos_google_drive.sql`. Si ya tenías instalada la versión de OneDrive, esta migración conserva sus referencias antiguas.
6. Para guardar los datos del CV generado, ejecuta `neon/05_datos_cv_candidatos.sql`.
7. Ejecuta `neon/06_compatibilidad_candidatos.sql` para asegurar que la tabla tenga las columnas que utiliza la aplicación y mantener compatibles `correo` y `email`.

## Codificación de texto (tildes, Ñ y símbolos)

La base de datos es UTF-8. Si un texto entra con la codificación rota, queda el carácter
`�` (U+FFFD) y se ve como "conexi�n" en pantalla. Para evitarlo:

- El backend sanea todo texto que entra (`backend/utils/texto.js`): repara mojibake
  ("conexiÃ³n" → "conexión"), quita caracteres de control y rechaza con un mensaje claro
  los textos donde el carácter original ya se perdió.
- La base tiene restricciones `CHECK` que impiden guardar `�` en cualquier columna de texto.
- Si necesitas revisar o reparar datos existentes:

```powershell
cd backend
npm run reparar-texto           # repara y aplica las restricciones
npm run reparar-texto -- --dry  # solo informa, no escribe
```

Este script también aplica `neon/03_sanitizacion_texto.sql`. Si prefieres ejecutarlo a mano,
copia y pega ese archivo en el SQL Editor de Neon **después** de la reparación.

## 2. Configurar backend
En PowerShell, desde la carpeta raíz del proyecto:

```powershell
cd backend
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Edita `backend/.env` y completa estas variables, conservando tu `DATABASE_URL` actual si ya estaba configurada:
- `DATABASE_URL`: cadena de conexión de Neon.
- `JWT_SECRET`: secreto aleatorio largo, mínimo 32 caracteres.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: credenciales para crear el primer administrador. La contraseña debe tener al menos 12 caracteres.
- Para activar Google Drive, completa las variables `GOOGLE_*` descritas en la sección siguiente.

No compartas el archivo `.env` ni lo subas a GitHub.

## Guardar CV y reportes en Google Drive

La aplicación sigue usando Neon como fuente principal de los candidatos. Google Drive guarda los CV y los archivos Excel cuando una persona autorizada los sube o genera desde la interfaz. El backend usa OAuth para acceder al **Mi unidad de la cuenta institucional autorizada**; los archivos consumirán el almacenamiento de esa cuenta.

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto aprobado por tu institución y habilita **Google Drive API**.
2. Configura la pantalla de consentimiento OAuth. Si está disponible, selecciona audiencia **Interna** para limitar la autorización a las cuentas de la institución. Si la política de Workspace lo exige, pide al administrador que autorice la aplicación y el acceso a Drive.
3. Crea un **ID de cliente OAuth** de tipo **Aplicación web** y agrega exactamente `http://localhost:3000/oauth2callback` como URI de redirección autorizada. Copia el ID y el secreto al `backend/.env` como `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`.
4. Inicia sesión en Google Drive con la cuenta que será propietaria de los archivos. Dentro de **Mi unidad**, crea una carpeta raíz llamada `AquaChile` y otra llamada `Reportes`. Copia sus IDs desde las URL (`/folders/...`) a `GOOGLE_DRIVE_FOLDER_AQUACHILE_ID` y `GOOGLE_DRIVE_FOLDER_REPORTES_ID` en `backend/.env`. La aplicación creará automáticamente dentro de `AquaChile` una carpeta por candidato, nombrada con su nombre e ID para evitar colisiones, y guardará allí sus CV. No hagas públicas las carpetas.
5. Desde PowerShell, dentro de `backend`, ejecuta `npm run autorizar-drive`. Abre la URL que aparece, confirma que es la cuenta institucional correcta y acepta el permiso de Google Drive. El script guarda automáticamente el refresh token en `backend/.env`; no lo compartas.
6. Ejecuta `neon/04_archivos_google_drive.sql`, `neon/05_datos_cv_candidatos.sql` y `neon/06_compatibilidad_candidatos.sql` en Neon, reinicia el backend y prueba una carga. La última migración conserva los correos existentes y adapta tablas preexistentes que usan `email` en vez de `correo`. En **Candidatos**, los roles Administrador académico y Analista de Reclutamiento pueden generar un CV Word con los datos registrados, subir/eliminar CV PDF, DOC o DOCX de hasta 10 MB y guardar un Excel. En **Solicitudes**, esos roles pueden guardar el Excel filtrado. La aplicación limita los reportes a 15 MB.

La integración solicita el permiso OAuth `drive`, que permite al backend administrar archivos de Drive de la cuenta autorizada. Usa una cuenta institucional dedicada y obtén autorización para manejar CV y reportes, que pueden contener datos personales. Si la pantalla OAuth está en modo **Prueba** para una aplicación externa, Google puede hacer expirar el refresh token después de 7 días; usa la audiencia interna institucional o consulta al administrador antes de operar con datos reales. Para un backend desplegado, configura también `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` y los IDs de carpeta en las variables secretas del servicio, nunca en el frontend.

Antes de subir cada Excel, la aplicación solicita confirmación: el listado de candidatos contiene datos de contacto y el reporte de solicitudes contiene “Aspectos a Indagar”. Confirma que su almacenamiento en Google Drive está autorizado y que la carpeta tiene acceso restringido. La exportación normal a Excel sigue disponible aunque Google Drive no esté configurado.

Los reportes se guardan en `Reportes` con fecha en el nombre. Si se vuelve a subir el mismo tipo de reporte durante ese día, se reemplaza el archivo con ese nombre en Google Drive. Los CV se guardan bajo `AquaChile/<nombre del candidato (ID)>`; el CV generado usa los datos de contacto, perfil profesional, educación, habilidades y postulación capturados en la ficha. Se puede regenerar con el botón **Generar CV Word**, que actualiza ese mismo documento en Drive. Completa y verifica esos datos antes de generarlo; no se incluyen experiencia laboral ni resultados de evaluaciones. Al eliminar un candidato desde la aplicación, también se eliminan sus CV de Google Drive.

Si migras desde una versión anterior, los CV ya almacenados en OneDrive no se copian automáticamente. Sus enlaces se conservan en la aplicación, pero debes borrar esos archivos directamente en OneDrive y luego quitar su referencia antigua desde la aplicación antes de eliminar al candidato.

Crea la primera cuenta administradora:

```powershell
npm run crear-admin
```

Después inicia el backend:

```powershell
npm run dev
```

El backend estará disponible en `http://localhost:4000`. La ruta raíz debe responder `API SGP Psicolaboral funcionando` y `/health` devuelve un estado JSON.

## 3. Configurar frontend
Abre una segunda terminal en la raíz del proyecto:

```powershell
cd frontend
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

El frontend usará `http://localhost:4000/api` por defecto. Si el backend está desplegado en Render, modifica `frontend/.env` y coloca la URL de tu servicio terminada en `/api`, por ejemplo `https://TU-SERVICIO.onrender.com/api`.

Abre la URL local que muestre Vite, normalmente `http://localhost:5173`.

## 4. Primer inicio de sesión
Usa el correo y contraseña definidos en `backend/.env` en `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

Luego entra a **Usuarios** desde el menú para crear cuentas con sus roles. No existe una contraseña universal ni se debe seleccionar el rol desde el formulario de login.

## Endpoints de autenticación
- `POST /api/auth/login` — recibe `{ "email": "...", "password": "..." }`.
- `GET /api/auth/me` — devuelve el usuario asociado al token.
- `GET /api/auth/usuarios` — lista usuarios; requiere Administrador académico.
- `POST /api/auth/usuarios` — crea usuario; requiere Administrador académico.
- `PATCH /api/auth/usuarios/:id/estado` — activa/desactiva cuenta; requiere Administrador académico.

## Endpoints de negocio
- `GET /api/candidatos`, `GET /api/candidatos/:id`, `POST /api/candidatos`, `PUT /api/candidatos/:id`, `DELETE /api/candidatos/:id`.
- `POST /api/archivos/candidatos/:id/cv`, `GET /api/archivos/cvs`, `DELETE /api/archivos/cvs/:id` — CV y enlaces de Google Drive; requiere rol Administrador académico o Analista de Reclutamiento. `DELETE /api/archivos/cvs/:id/referencia` quita metadatos antiguos de OneDrive, pero no elimina el archivo remoto.
- `POST /api/archivos/reportes/candidatos`, `POST /api/archivos/reportes/solicitudes` — recibe el Excel generado por el frontend y lo sube a Google Drive.
- `GET /api/solicitudes`, `POST /api/solicitudes`, `PATCH /api/solicitudes/:id/estado`.
- `GET /api/evaluaciones/:solicitudId`, `POST /api/evaluaciones`.

Todos devuelven `400` con un mensaje en español cuando el dato es inválido
(formato de correo, fecha, largo máximo, candidato o solicitud inexistente,
o texto con caracteres de codificación rotos).

## Importante antes de desplegar
- Configura `DATABASE_URL` y `JWT_SECRET` en el entorno del backend (por ejemplo Render).
- Configura `VITE_API_URL` para apuntar al backend desplegado y vuelve a construir el frontend.
- No expongas `DATABASE_URL` ni `JWT_SECRET` en variables `VITE_*` del frontend.
- Prueba todos los roles y endpoints antes de usar datos reales.
- Este MVP no implementa restablecimiento de contraseña ni recuperación por correo.
