import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function PantallaCarga() {
  return (
    <div className="pantalla-carga">
      <i className="bi bi-water fs-1" style={{ color: "var(--turquesa)" }}></i>
      <div className="spinner-border" style={{ color: "var(--azul-medio)" }} role="status"></div>
      <p className="text-muted mb-0">Cargando SGP Psicolaboral...</p>
    </div>
  );
}

function AppShell() {
  const { cargando, error } = useData();

  if (cargando) return <PantallaCarga />;

  return (
    <BrowserRouter>
      <Navbar />
      {error && (
        <div className="alert alert-danger rounded-0 mb-0 text-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/candidatos" element={<Candidatos />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/nueva-solicitud" element={<NuevaSolicitud />} />
        <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppContent() {
  const { usuario } = useAuth();
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