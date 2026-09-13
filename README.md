# SGP Psicolaboral — MVP AquaChile

MVP Full Stack para digitalizar el proceso de evaluación psicolaboral de candidatos, desarrollado para la asignatura DSY1104 Full Stack II (Duoc UC).

> ⚠️ Proyecto académico. Utiliza exclusivamente datos ficticios. No representa un sistema oficial ni productivo de AquaChile.

## Stack tecnológico
- **Frontend:** React + Vite, Bootstrap 5, React Router
- **Backend:** Node.js + Express (arquitectura monolítica)
- **Base de datos:** PostgreSQL (Neon)

## Funcionalidades
- Login simulado con 4 roles (Administrador, Analista, Evaluador, Jefatura), cada uno con permisos distintos
- Registro, edición y consulta de candidatos
- Creación de solicitudes de evaluación, con filtros por estado, cargo, candidato y fecha
- Flujo de estados: Pendiente → En proceso → Finalizada
- Registro de evaluación psicolaboral (resultado y observaciones) por solicitud
- Dashboard con indicadores generales

## Cómo correr el proyecto en local

### Backend
```bash
cd backend
npm install
# Crea un archivo .env (ver .env.example) con tu propia DATABASE_URL de Neon
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Límites conocidos del MVP
- Los roles y permisos son simulados (sin contraseña real); el control de acceso se aplica en el frontend, no en el backend.
- El plan gratuito de despliegue puede tardar en "despertar" tras inactividad.
- Los datos de candidatos son 100% ficticios.

## Equipo
- Martin Andres Diaz Gonzalez