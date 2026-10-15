import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Candidatos from "./pages/Candidatos";
import Solicitudes from "./pages/Solicitudes";
import NuevaSolicitud from "./pages/NuevaSolicitud";
import DetalleSolicitud from "./pages/DetalleSolicitud";
import Usuarios from "./pages/Usuarios";

function PantallaCarga() {
  return (
    <div className="pantalla-carga">
      <i className="bi bi-water fs-1" style={{ color: "var(--turquesa)" }}></i>
      <div className="spinner-border" style={{ color: "var(--turquesa)" }} role="status"></div>
      <p className="text-white mb-0" style={{ opacity: 0.85 }}>Cargando SGP Psicolaboral...</p>
    </div>
  );
}

function SoloConPermiso({ permiso, children }) {
  const { permisos } = useAuth();
  return permisos[permiso] ? children : <Navigate to="/" replace />;
}

function AppShell() {
  const { cargando, error, limpiarError } = useData();

  if (cargando) return <PantallaCarga />;

  return (
    <BrowserRouter>
      <Navbar />
      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-0 mb-0 text-center position-fixed top-0 start-0 w-100 z-index-1050" style={{ zIndex: 9999 }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Cerrar"
            onClick={limpiarError}
          ></button>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/candidatos" element={<SoloConPermiso permiso="candidatos"><Candidatos /></SoloConPermiso>} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/nueva-solicitud" element={<SoloConPermiso permiso="crearSolicitud"><NuevaSolicitud /></SoloConPermiso>} />
        <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
        <Route path="/usuarios" element={<SoloConPermiso permiso="usuarios"><Usuarios /></SoloConPermiso>} />
        <Route path="*" element={<div className="container mt-5"><div className="alert alert-warning">Página no encontrada.</div></div>} />
      </Routes>
    </BrowserRouter>
  );
}

function AppContent() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <PantallaCarga />;
  if (!usuario) return <Login />;

  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;