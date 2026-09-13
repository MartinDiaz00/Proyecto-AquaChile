import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Candidatos from "./pages/Candidatos";
import Solicitudes from "./pages/Solicitudes";
import DetalleSolicitud from "./pages/DetalleSolicitud";

function AppContent() {
  const { usuario } = useAuth();
  if (!usuario) return <Login />;

  return (
    <DataProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidatos" element={<Candidatos />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
          <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;