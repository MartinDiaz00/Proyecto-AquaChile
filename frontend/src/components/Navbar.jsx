import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function IconoAncla() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="5" r="2.2" stroke="#e6f5f4" strokeWidth="1.6" />
      <line x1="12" y1="7.2" x2="12" y2="20" stroke="#e6f5f4" strokeWidth="1.6" />
      <line x1="7" y1="10" x2="17" y2="10" stroke="#e6f5f4" strokeWidth="1.6" />
      <path d="M4 13c0 4 3.5 6.5 8 7c4.5-0.5 8-3 8-7" stroke="#e6f5f4" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const { usuario, cerrarSesion } = useAuth();

  const enlaces = [
    { to: "/", label: "Dashboard", icon: "bi-speedometer2", exacto: true },
    { to: "/candidatos", label: "Candidatos", icon: "bi-people-fill", exacto: false },
    { to: "/solicitudes", label: "Solicitudes", icon: "bi-clipboard-check-fill", exacto: false },
  ];

  return (
    <nav
      className="px-4 py-3 sticky-top shadow"
      style={{ background: "linear-gradient(90deg, var(--azul-profundo) 0%, var(--azul-noche) 60%, var(--turquesa) 140%)" }}
    >
      <div className="d-flex align-items-center justify-content-between">
        <NavLink className="d-flex align-items-center gap-2 text-white text-decoration-none" to="/" onClick={() => setAbierto(false)}>
          <IconoAncla />
          <span className="fuente-marca">
            <span className="fw-bold">SGP</span>{" "}
            <span className="fw-light" style={{ opacity: 0.85 }}>Psicolaboral</span>
          </span>
        </NavLink>

        <button
          className="btn d-lg-none border-0 p-0"
          type="button"
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setAbierto(!abierto)}
        >
          <i className={`bi ${abierto ? "bi-x-lg" : "bi-list"} text-white fs-3`}></i>
        </button>

        <div className="d-none d-lg-flex align-items-center gap-2">
          {enlaces.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exacto}
              className="nav-link px-3 py-2 rounded d-flex align-items-center gap-2 text-white"
              style={({ isActive }) => ({ backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "transparent", fontWeight: isActive ? 600 : 400 })}
            >
              <i className={`bi ${link.icon}`}></i>{link.label}
            </NavLink>
          ))}
          <div className="vr mx-2 opacity-50" style={{ height: "24px" }}></div>
          <div className="text-white text-end me-2">
            <div className="small fw-semibold">{usuario.nombre}</div>
            <div className="small" style={{ opacity: 0.75, fontSize: "0.7rem" }}>{usuario.rol}</div>
          </div>
          <button className="btn btn-sm btn-outline-light" onClick={cerrarSesion} title="Cerrar sesión">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      <div className={`menu-movil ${abierto ? "abierto" : ""} d-lg-none`}>
        <div className="d-flex flex-column gap-1 pt-3">
          {enlaces.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exacto}
              onClick={() => setAbierto(false)}
              className="nav-link px-3 py-2 rounded d-flex align-items-center gap-2 text-white"
              style={({ isActive }) => ({ backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "transparent", fontWeight: isActive ? 600 : 400 })}
            >
              <i className={`bi ${link.icon}`}></i>{link.label}
            </NavLink>
          ))}
          <div className="text-white small pt-2 border-top border-light border-opacity-25 mt-2">
            {usuario.nombre} — {usuario.rol}
          </div>
          <button className="btn btn-sm btn-outline-light mt-2" onClick={cerrarSesion}>
            <i className="bi bi-box-arrow-right me-1"></i>Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;