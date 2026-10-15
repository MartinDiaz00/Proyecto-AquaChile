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

## Roles
- **Administrador académico:** administración de usuarios, candidatos, solicitudes y evaluaciones.
- **Analista de Reclutamiento:** creación/edición de candidatos y creación de solicitudes.
- **Profesional Evaluador:** consulta de solicitudes, registro de evaluaciones y avance de estado.
- **Jefatura o contraparte simulada:** consulta del dashboard y solicitudes, sin modificar registros.

Los permisos son una propuesta coherente con los permisos simulados del MVP. El backend los valida en cada endpoint protegido.

## 1. Configurar Neon
1. Abre Neon y entra a SQL Editor.
2. Copia y ejecuta el archivo `neon/01_roles_y_usuarios.sql`.
3. Este script solo crea `roles_sistema` y `usuarios_sistema`; no elimina ni modifica `candidatos`, `solicitudes` o `evaluaciones`.

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

No compartas el archivo `.env` ni lo subas a GitHub.

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

## Importante antes de desplegar
- Configura `DATABASE_URL` y `JWT_SECRET` en el entorno del backend (por ejemplo Render).
- Configura `VITE_API_URL` para apuntar al backend desplegado y vuelve a construir el frontend.
- No expongas `DATABASE_URL` ni `JWT_SECRET` en variables `VITE_*` del frontend.
- Prueba todos los roles y endpoints antes de usar datos reales.
- Este MVP no implementa restablecimiento de contraseña ni recuperación por correo.
