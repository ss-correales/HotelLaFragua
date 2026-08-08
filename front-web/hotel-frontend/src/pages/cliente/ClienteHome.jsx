import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

/**
 * Imagen grande del inicio (la que envió el usuario).
 * Archivo: public/assets/hotel/inicio-hero.png
 * Para cambiarla, reemplaza ese archivo o edita la constante de abajo.
 */
const heroImg = "/assets/hotel/inicio-hero.png";

function ClienteHome() {
  const navigate = useNavigate();

  // Reservar desde el inicio: exige iniciar sesión primero
  const handleReservar = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { redirectTo: "/reservas" } });
      return;
    }
    navigate("/reservas");
  };

  return (
    <div className="cliente-home">
      {/* HERO con imagen grande + scroll infinito (parallax + zoom continuo) */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Bienvenido a La Fragua</h1>
          <p>Disfruta tu estadía con el máximo confort y estilo</p>
          <button type="button" className="btn-gold" onClick={handleReservar}>
            Reservar Ahora
          </button>
        </div>
      </section>
    </div>
  );
}

export default ClienteHome;
