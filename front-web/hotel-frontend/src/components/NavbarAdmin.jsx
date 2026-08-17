import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function NavbarAdmin() {
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioCorreo");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <nav className={scrolled ? "navbar scrolled" : "navbar"}>
      <div className="logo" onClick={() => navigate("/admin")}>
        <i className="bi bi-shield-check me-2"></i>
        Admin La Fragua
      </div>
      <ul className="nav-links">
        <li onClick={() => navigate("/admin")}>
          <i className="bi bi-speedometer2 me-1"></i>
          Dashboard
        </li>
        <li onClick={() => navigate("/admin/usuarios")}>
          <i className="bi bi-people me-1"></i>
          Usuarios
        </li>
        <li onClick={() => navigate("/admin/habitaciones")}>
          <i className="bi bi-door-closed me-1"></i>
          Habitaciones
        </li>
        <li onClick={() => navigate("/admin/reservas")}>
          <i className="bi bi-calendar-check me-1"></i>
          Reservas
        </li>
        <li onClick={() => navigate("/admin/facturas")}>
          <i className="bi bi-receipt me-1"></i>
          Facturas
        </li>
        <li onClick={() => navigate("/admin/reportes")}>
          <i className="bi bi-graph-up me-1"></i>
          Reportes
        </li>
      </ul>
      <div className="nav-buttons">
        {!isAuthenticated ? (
          <>
            <button 
              className="btn-admin me-2" 
              onClick={() => navigate("/admin/login")}
              style={{ backgroundColor: "#a67c52", borderColor: "#a67c52", color: "white" }}
            >
              <i className="bi bi-shield-check me-2"></i>
              Login Admin
            </button>
            <button className="btn-admin" onClick={() => navigate("/login")}>
              <i className="bi bi-person me-2"></i>
              Login Cliente
            </button>
          </>
        ) : (
          <>
            <button className="btn-admin" onClick={() => navigate("/")}>
              <i className="bi bi-house me-2"></i>
              Ir al Sitio
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Cerrar Sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavbarAdmin;