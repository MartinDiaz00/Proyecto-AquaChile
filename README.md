# SGP Psicolaboral - AquaChile

Este proyecto nació en el marco de Vinculación con el Medio (VcM) con AquaChile, para la asignatura DSY1104 Desarrollo Full Stack II de Duoc UC (2026). La idea es simple: tener en un solo lugar los candidatos, las solicitudes de evaluación psicolaboral y el resultado de cada evaluación.

## Demo

| Servicio | URL |
| --- | --- |
| Repositorio | https://github.com/MartinDiaz00/Proyecto-AquaChile |
| Frontend | https://proyecto-aquachile-4ms8.onrender.com/ |
| API | https://aquachile-backend.onrender.com |
| Estado de la API | https://aquachile-backend.onrender.com/health |

El frontend está publicado en Render y consume la API del backend, que también está en Render. La base de datos está en Neon. Las cuentas de prueba no se guardan en el repositorio; se entregan por el canal del curso.

## Contexto y alcance

En la práctica, el pedido y seguimiento de una evaluación psicolaboral suele quedar repartido entre correos, planillas y mensajes sueltos. Así cuesta saber en qué estado está cada solicitud, quién la pidió o si un candidato ya tiene una evaluación. La aplicación junta esos datos en un solo lugar y mantiene el recorrido candidato -> solicitud -> evaluación.

Esta entrega corresponde a la Evaluación Parcial 2 de DSY1104, centrada en el frontend React y en las pruebas unitarias con Vitest. El backend y la base de datos ya están integrados y desplegados, pero la revisión de esta etapa se concentra en las pantallas, el flujo y las pruebas del frontend.

## Funcionalidades

### Inicio de sesión y roles

El acceso es con correo y contraseña. La API devuelve un token JWT que el frontend guarda en `localStorage` y envía en cada petición protegida. Si el token vence o la cuenta se desactiva, la sesión se cierra y se vuelve al login.

Hay cuatro roles y cada uno ve solo las opciones que le corresponden. Los permisos se revisan en el menú, en las rutas del frontend y también en los endpoints del backend.

### Dashboard

Muestra seis indicadores del proceso:

- Total de candidatos.
- Solicitudes pendientes.
- Solicitudes en proceso.
- Solicitudes finalizadas.
- Porcentaje de solicitudes finalizadas.
- Candidatos que todavía no tienen una solicitud.

Cada tarjeta lleva a la lista correspondiente. Abajo aparece una tabla con las últimas solicitudes y su estado.

### Candidatos

- Listado en tarjetas con nombre, correo, teléfono, cargo y familia de cargo.
- Búsqueda por nombre, correo o cargo, sin distinguir mayúsculas.
- Crear y editar candidatos con validación de campos.
- Eliminar candidatos, con bloqueo si tienen solicitudes asociadas.
- Subir CV en PDF, DOC o DOCX (máximo 10 MB) a Google Drive, si la integración está configurada.
- Generar un CV en Word con el perfil, la educación y las habilidades del candidato.
- Exportar el listado de candidatos a Excel y guardarlo en Google Drive.

### Solicitudes

- Crear una solicitud asociada a un candidato.
- Registrar origen (interno o externo), cargo, familia de cargo, unidad, centro de costos, fecha, responsable y aspectos a indagar.
- Marcar si el candidato es referido, si requiere referencias y si tiene CV o descriptor de cargo.
- Filtrar por estado, cargo, candidato y fecha.
- Avanzar el estado: Pendiente -> En proceso -> Finalizada.
- Exportar la lista filtrada a Excel.
- Guardar el reporte de solicitudes en Google Drive.

En la solicitud, las casillas de CV y descriptor son solo indicadores. El archivo del CV se sube desde la ficha del candidato.

### Detalle y evaluación

La ficha de una solicitud muestra los datos del candidato, el cargo, la fecha, el responsable y los aspectos a indagar. Desde ahí se registra o actualiza la evaluación con fecha, resultado y observaciones. Al guardar, la solicitud pasa a Finalizada.

Los roles que no pueden evaluar ven la información en modo lectura. Los resultados posibles son Recomendado, Recomendado con observaciones y No recomendado.

### Usuarios

Solo el Administrador académico puede entrar a este módulo. Desde ahí se crean cuentas, se asigna un rol y se activan o desactivan usuarios. Una persona no puede desactivar su propia cuenta.

### Google Forms

El formulario externo envía las respuestas a un webhook protegido con el encabezado `x-webhook-token`. El backend valida nombre, correo, cargo y familia de cargo, revisa si el correo ya existe y aplica un límite de envíos por IP. Si todo está correcto, crea el candidato en Neon.

Las familias de cargo aceptadas son: Profesional A, Profesional B, Operario Calificado, Supervisor B y Jefatura.

### Archivos y reportes

Google Drive es opcional. Cuando está configurado, el sistema guarda los CV y los reportes Excel en carpetas privadas. La base de datos solo conserva los metadatos del archivo: nombre, enlace, tipo, tamaño y fecha.

## Roles y permisos

| Rol | Candidatos | Solicitudes | Crear solicitud | Avanzar estado | Evaluar | Usuarios |
| --- | --- | --- | --- | --- | --- | --- |
| Administrador académico | Sí | Sí | Sí | Sí | Sí | Sí |
| Analista de Reclutamiento | Sí | Sí | Sí | No | No | No |
| Profesional Evaluador | No | Sí | No | Sí | Sí | No |
| Jefatura o contraparte simulada | No | Sí | No | No | No | No |

## Tecnologías

| Parte | Herramientas |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7, Bootstrap 5.3, Bootstrap Icons, xlsx |
| Backend | Node.js 20+, Express 5, PostgreSQL (Neon), JWT, bcryptjs, googleapis, docx |
| Pruebas | Vitest 5 en el frontend y `node:test` en el backend |
| Calidad | oxlint |
| Despliegue | Render para frontend y backend, Neon para la base de datos |
| Integraciones | Google Forms con Apps Script y Google Drive API |

## Estructura del proyecto

```text
.
├── backend/
│   ├── routes/          auth, candidatos, solicitudes, evaluaciones, archivos, googleForm
│   ├── middleware/      autenticación y control de roles
│   ├── services/        integración con Google Drive
│   ├── scripts/         crear-admin, autorizar-drive, reparar-texto
│   ├── utils/           saneado y validación de texto
│   ├── db.js            conexión a PostgreSQL
│   └── server.js        API Express
├── frontend/
│   ├── src/
│   │   ├── components/  Navbar y TextoSano
│   │   ├── context/     AuthContext, DataContext y ToastContext
│   │   ├── layouts/     AppLayout
│   │   ├── pages/       Dashboard, Candidatos, Solicitudes, NuevaSolicitud,
│   │   │                DetalleSolicitud, Usuarios y Login
│   │   ├── services/    api.js
│   │   ├── utils/       validaciones.js, texto.js y validaciones.test.js
│   │   └── App.jsx
│   └── vite.config.js
├── neon/                migraciones SQL 01 a 07
├── Imagenes de avance/  capturas del avance del proyecto
└── README.md
```

## Ejecutar en local

### Requisitos

- Node.js 20.19 o superior.
- npm.
- Una base PostgreSQL en Neon.
- Opcional: credenciales OAuth de Google Drive y un túnel para probar Google Forms.

### 1. Preparar la base de datos

En el SQL Editor de Neon, ejecuta los scripts en este orden:

1. `neon/01_roles_y_usuarios.sql`
2. `neon/02_tablas_principales.sql`
3. `neon/03_sanitizacion_texto.sql`
4. `neon/04_archivos_google_drive.sql`
5. `neon/05_datos_cv_candidatos.sql`
6. `neon/06_compatibilidad_candidatos.sql`
7. `neon/07_google_form_candidatos.sql`

El último script crea un índice de correo normalizado para el webhook. Antes de ejecutarlo, revisa la consulta de duplicados que viene dentro del archivo y resuelve los correos repetidos si existen.

### 2. Backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm run crear-admin
npm run dev
```

La API queda en `http://localhost:4000`. Para comprobar que está arriba, abre `http://localhost:4000/health`.

### 3. Frontend

En otra terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Vite muestra la dirección local, normalmente `http://localhost:5173`. El frontend usa `http://localhost:4000/api` por defecto. En producción se configura `VITE_API_URL` con la URL del backend en Render.

### Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL en Neon |
| `JWT_SECRET` | Secreto para firmar los tokens; debe tener al menos 32 caracteres |
| `JWT_EXPIRES_IN` | Duración de la sesión, por ejemplo `8h` |
| `ADMIN_NAME` | Nombre de la primera cuenta administradora |
| `ADMIN_EMAIL` | Correo de la primera cuenta administradora |
| `ADMIN_PASSWORD` | Contraseña inicial, mínimo 12 caracteres |
| `GOOGLE_FORM_TOKEN` | Token del webhook de Google Forms |
| `GOOGLE_OAUTH_CLIENT_ID` | Cliente OAuth de Google Drive |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secreto OAuth de Google Drive |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Token de actualización de Google Drive |
| `GOOGLE_DRIVE_FOLDER_AQUACHILE_ID` | Carpeta de CV en Google Drive |
| `GOOGLE_DRIVE_FOLDER_REPORTES_ID` | Carpeta de reportes en Google Drive |
| `VITE_API_URL` | URL de la API que usa el frontend |

No subas el archivo `.env` al repositorio. Los secretos van solo en el backend y en las variables de Render.

## Pruebas

### Frontend con Vitest

```powershell
cd frontend
npm ci
npm test
```

Al ejecutarlas ahora, el resultado es:

```text
Test Files  1 passed (1)
Tests       10 passed (10)
```

Los 10 casos cubren la lógica que usan los formularios y los filtros:

| N° | Caso | Qué comprueba |
| --- | --- | --- |
| 1 | Candidato con campos vacíos | Marca nombre, correo, cargo y familia como obligatorios |
| 2 | Correo inválido | Rechaza un correo sin formato válido |
| 3 | Candidato completo | Acepta datos correctos y devuelve una lista de errores vacía |
| 4 | Búsqueda de candidatos | Encuentra por nombre, correo o cargo sin distinguir mayúsculas |
| 5 | Búsqueda sin coincidencias | Devuelve todos con búsqueda vacía y ninguno cuando no hay coincidencia |
| 6 | Solicitud válida | Acepta una solicitud completa con la fecha de hoy |
| 7 | Fecha anterior | Rechaza una fecha de solicitud anterior a hoy |
| 8 | Filtros combinados | Aplica estado, cargo, candidato y fecha al mismo tiempo |
| 9 | Evaluación incompleta | Exige fecha y resultado |
| 10 | Evaluación completa | Acepta una evaluación con fecha y resultado válidos |

Estos casos se eligieron porque las validaciones y los filtros son funciones puras: si fallan, el error se repite en varias pantallas. No se configuró un reporte de cobertura; la prioridad fue cubrir los comportamientos que afectan el flujo principal.

### Backend con node:test

```powershell
cd backend
npm ci
npm test
```

Al ejecutarlas ahora, el resultado es:

```text
tests 5
pass 5
fail 0
```

Las pruebas del backend revisan el webhook de Google Forms: token ausente, token incorrecto, correo inválido, correo duplicado y creación de un candidato válido. La pauta de esta evaluación pide Vitest para el frontend; el backend usa `node:test` porque no es el foco de esta etapa.

## API

Todas las rutas protegidas necesitan el token en `Authorization: Bearer <token>`. El webhook de Google Forms usa solo `x-webhook-token`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| POST | `/api/auth/login` | Inicia sesión y devuelve el token |
| GET | `/api/auth/me` | Devuelve el usuario de la sesión |
| GET | `/api/auth/usuarios` | Lista usuarios (solo administrador) |
| POST | `/api/auth/usuarios` | Crea un usuario (solo administrador) |
| PATCH | `/api/auth/usuarios/:id/estado` | Activa o desactiva una cuenta |
| GET | `/api/candidatos` | Lista candidatos |
| GET | `/api/candidatos/:id` | Muestra un candidato |
| POST | `/api/candidatos` | Crea un candidato |
| PUT | `/api/candidatos/:id` | Actualiza un candidato |
| DELETE | `/api/candidatos/:id` | Elimina un candidato (solo administrador) |
| GET | `/api/solicitudes` | Lista solicitudes |
| POST | `/api/solicitudes` | Crea una solicitud |
| PATCH | `/api/solicitudes/:id/estado` | Cambia el estado de una solicitud |
| GET | `/api/evaluaciones/:solicitudId` | Consulta la evaluación de una solicitud |
| POST | `/api/evaluaciones` | Crea o actualiza una evaluación |
| GET | `/api/archivos/cvs` | Lista los CV registrados |
| POST | `/api/archivos/candidatos/:id/cv` | Sube un CV a Google Drive |
| POST | `/api/archivos/candidatos/:id/generar-cv` | Genera un CV Word |
| DELETE | `/api/archivos/cvs/:id` | Elimina un CV de Google Drive |
| DELETE | `/api/archivos/cvs/:id/referencia` | Quita una referencia antigua de OneDrive |
| POST | `/api/archivos/reportes/:tipo` | Sube un reporte Excel a Google Drive |
| POST | `/api/google-form/candidatos` | Recibe candidatos desde Google Forms |
| GET | `/health` | Comprueba que la API está funcionando |

## Base de datos

Las tablas principales son:

- `roles_sistema`: los cuatro roles del sistema.
- `usuarios_sistema`: cuentas, contraseña cifrada, rol y estado.
- `candidatos`: datos personales y perfil del candidato.
- `solicitudes`: pedido de evaluación asociado a un candidato.
- `evaluaciones`: resultado de la evaluación, una por solicitud.
- `archivos_candidato`: metadatos de los CV guardados en Drive.

Relaciones:

- Un candidato puede tener muchas solicitudes.
- Una solicitud tiene una evaluación como máximo.
- Un candidato puede tener varios archivos.

Los scripts de `neon/` crean las tablas, los índices y algunas restricciones de integridad. También agregan controles para evitar guardar texto con caracteres de codificación inválidos.

## Google Forms

Para conectarlo:

1. Crea el formulario con las preguntas Nombre, Correo, Teléfono (opcional), Cargo postulado y Familia de cargo.
2. Abre Apps Script desde el formulario y agrega un activador `onFormSubmit`.
3. En las propiedades del script guarda `BACKEND_URL` con la URL del webhook y `GOOGLE_FORM_TOKEN` con el mismo token de `backend/.env`.
4. Envía una respuesta de prueba y revisa que el candidato aparezca en la pantalla Candidatos.

Para probar en local, Google necesita una URL pública. Se puede usar ngrok apuntando al puerto 4000. En producción, `BACKEND_URL` debe apuntar a `https://aquachile-backend.onrender.com/api/google-form/candidatos`.

Respuestas principales del webhook:

- `201`: candidato creado.
- `200`: el correo ya existe.
- `400`: datos inválidos.
- `401`: token ausente o incorrecto.
- `429`: demasiados envíos desde la misma IP.

El webhook acepta un cuerpo de hasta 10 KB y permite 20 solicitudes cada 15 minutos por IP.

## Google Drive

La integración es opcional. Para usarla:

1. Habilita la API de Google Drive y configura OAuth en un proyecto de Google Cloud.
2. Completa `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` en `backend/.env`.
3. Crea dos carpetas privadas en Mi unidad, una para CV y otra para reportes, y copia sus IDs en `GOOGLE_DRIVE_FOLDER_AQUACHILE_ID` y `GOOGLE_DRIVE_FOLDER_REPORTES_ID`.
4. Ejecuta `npm run autorizar-drive` desde `backend` y sigue la autorización con la cuenta institucional dueña de las carpetas.
5. Aplica las migraciones `neon/04_archivos_google_drive.sql` y `neon/05_datos_cv_candidatos.sql`.

Los archivos se guardan en Drive, pero la aplicación sigue usando Neon como fuente principal de los datos. Los CV y reportes pueden contener datos personales, así que el acceso a las carpetas debe quedar restringido.

## Decisiones que tomamos

- Usamos React Context en lugar de una librería de estado más grande porque los datos compartidos son pocos: sesión, candidatos, solicitudes y evaluaciones.
- Dejamos las validaciones y los filtros en funciones separadas para poder probarlos con Vitest sin montar componentes.
- Usamos Bootstrap 5 para resolver la maquetación responsive y no invertir tiempo en un sistema de estilos propio.
- Separamos frontend y backend en dos servicios de Render. El frontend estático usa `VITE_API_URL` para apuntar a la API y así evitar que las rutas `/api` caigan en el index.html del sitio.
- Calculamos la fecha local del formulario sin usar `toISOString()`, porque en Chile después de las 21:00 ese método devuelve el día siguiente.
- Agregamos saneado de texto y restricciones en la base de datos después de detectar textos con caracteres rotos en las pruebas.
- Usamos `ON CONFLICT` al guardar una evaluación para que una solicitud tenga una sola evaluación y se pueda actualizar.
- Dejamos la carga del CV en la ficha del candidato y no en la solicitud, para no mezclar el pedido de evaluación con la gestión del archivo.

## Limitaciones y pendientes

- No hay recuperación de contraseña. Las cuentas las crea el administrador.
- No hay historial de cambios ni registro de auditoría.
- Las listas no tienen paginación; con muchos registros pueden quedar largas.
- Las pruebas cubren la lógica de validaciones y filtros, pero no los componentes visuales.
- No se envían correos ni notificaciones automáticas.
- El descriptor de cargo se marca como casilla, pero no se sube como archivo.
- Google Forms crea candidatos, no solicitudes.
- El menú móvil funciona, pero las tablas usan desplazamiento horizontal en pantallas pequeñas.
- El token se guarda en `localStorage`. Para una versión final conviene evaluar cookies `httpOnly`.
- CORS está abierto para facilitar la demo. En producción conviene limitarlo al dominio del frontend.
- Falta revisar la validación SSL de la conexión a Neon antes de una puesta en producción formal.

## Seguridad y datos

- Las contraseñas se guardan con bcrypt.
- La sesión usa JWT y se valida contra la base de datos en cada petición protegida.
- Los roles se revisan en el frontend y en el backend.
- Los textos se sanean y tienen límites de largo.
- El webhook compara el token de forma segura y aplica rate limiting.
- Los CV se validan por tipo de contenido y por los primeros bytes del archivo.
- Los secretos van en `.env`, que está excluido por `.gitignore`.
- No se deben usar datos personales reales en pruebas ni en el repositorio.

## Contexto académico

Proyecto desarrollado para la asignatura DSY1104 Desarrollo Full Stack II, Duoc UC, 2026, en el marco de Vinculación con el Medio con AquaChile. Las capturas de avance están en la carpeta `Imagenes de avance/`.

Este README y el repositorio quedan como evidencia del trabajo del equipo. El uso del código fuera del curso necesita autorización de AquaChile y del equipo.
