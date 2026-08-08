import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

/**
 * Imagen grande del inicio (la que envió el usuario).
 * Archivo: public/assets/hotel/inicio-hero.png
 * Para cambiarla, reemplaza ese archivo o edita la constante de abajo.
 */
const heroImg = "/assets/hotel/inicio-hero.png";

function ClienteHome() {
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
          <Link to="/reservas" className="btn-gold">
            Reservar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ClienteHome;
