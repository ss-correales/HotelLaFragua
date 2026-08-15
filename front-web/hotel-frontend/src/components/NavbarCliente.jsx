import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../assets/css/hotel-styles.css";
import "./NavbarCliente.css";

function NavbarCliente() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clienteData, setClienteData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const clienteDataStr = localStorage.getItem("clienteData");

    setIsAuthenticated(!!token);

    if (clienteDataStr) {
      try {
        setClienteData(JSON.parse(clienteDataStr));
      } catch (error) {
        console.error("Error parsing cliente data:", error);
        setClienteData(null);
      }
    } else {
      setClienteData(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioCorreo");
    localStorage.removeItem("clienteData");
    setIsAuthenticated(false);
    setClienteData(null);
    navigate("/");
  };

  const getNombreCompleto = () => {
    if (!clienteData) return "";
    return `${clienteData.nombre || ""} ${clienteData.apellido || ""}`.trim();
  };

  // Scroll suave a una sección del inicio. Si estamos en otra página, primero vamos al inicio.
  const irASeccion = (id) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Enlaces de sección del inicio (scroll suave)
  const secciones = [
    { id: "ofertas", label: "Ofertas" },
    { id: "gastronomia", label: "Gastronomía" },
    { id: "para-hacer", label: "Para Hacer" },
    { id: "bienestar", label: "Bienestar" },
    { id: "grupos", label: "Eventos" },
    { id: "galeria", label: "Galería" },
    { id: "contacto", label: "Contacto" },
  ];

  return (
    <nav
      className="navbar navbar-cliente navbar-expand-lg navbar-dark fixed-top"
      style={{
        background:
          "linear-gradient(135deg, rgba(166, 124, 82, 0.97) 0%, rgba(139, 99, 68, 0.97) 100%)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
      }}
    >
      <div className="container">
        <button
          type="button"
          className="navbar-brand fw-bold btn btn-link p-0 text-white text-decoration-none"
          onClick={() => irASeccion("inicio")}
          style={{ border: "none" }}
        >
          <i className="bi bi-building me-2"></i>
          Hotel La Fragua
        </button>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarCliente"
          aria-controls="navbarCliente"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarCliente">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <button type="button" className="nav-link btn btn-link" onClick={() => irASeccion("inicio")}>
                Inicio
              </button>
            </li>
            <li className="nav-item">
              <button type="button" className="nav-link btn btn-link" onClick={() => navigate("/habitaciones")}>
                Habitaciones
              </button>
            </li>
            {secciones.map((s) => (
              <li className="nav-item" key={s.id}>
                <button type="button" className="nav-link btn btn-link" onClick={() => irASeccion(s.id)}>
                  {s.label}
                </button>
              </li>
            ))}

            {isAuthenticated && clienteData ? (
              <>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                  <button type="button" className="btn btn-outline-light btn-sm" onClick={() => navigate("/perfil")}>
                    <i className="bi bi-person-circle me-2"></i>
                    {getNombreCompleto() || "Usuario"}
                  </button>
                </li>
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Cerrar Sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                  <button type="button" className="btn btn-outline-light btn-sm" onClick={() => navigate("/login")}>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Iniciar Sesión
                  </button>
                </li>
                <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                  <button type="button" className="btn btn-light btn-sm fw-semibold" onClick={() => navigate("/registro")} style={{ color: "#8a6340" }}>
                    Regístrate
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavbarCliente;
