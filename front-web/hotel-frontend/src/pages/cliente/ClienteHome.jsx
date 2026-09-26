import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Home.css";

/* ================== IMÁGENES ==================
   La foto del hero es la que enviaste: public/assets/hotel/inicio-hero.png
   Las demás son de ejemplo (Unsplash). Reemplázalas por las reales cuando quieras.
================================================= */
const heroImg = "/assets/hotel/inicio-hero.png";

const habitaciones = [
  { nombre: "Sencilla", precio: "$280.000 COP", desc: "Ideal para trabajo y escapadas cortas.", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80" },
  { nombre: "Doble", precio: "$380.000 COP", desc: "Ideal para trabajo y escapadas cortas.", img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80" },
  { nombre: "Familiar", precio: "$420.000 COP", desc: "Capacidad 4–5 · Vista ciudad.", img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80" },
];

const ofertas = [
  { titulo: "Reserva Anticipada", etiqueta: "-20%", desc: "Ahorra reservando con 30 días de anticipación.", img: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&q=80" },
  { titulo: "Escapada de Fin de Semana", etiqueta: "2x1", desc: "Incluye cóctel de bienvenida y late check-out.", img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80" },
  { titulo: "Paquete Relax", etiqueta: "Spa", desc: "Tratamiento de 60 min + acceso a zona húmeda.", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80" },
];

const paraHacer = [
  { titulo: "Paseo por el centro histórico", desc: "Arquitectura, museos y plazas icónicas.", img: "https://images.unsplash.com/photo-1568849676085-51415703900f?w=600&q=80" },
  { titulo: "Fortalezas y miradores", desc: "Atardeceres inolvidables junto a impresionantes cascadas.", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80" },
  { titulo: "Rutas gastronómicas", desc: "Sabores locales y mercados artesanales.", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" },
];

const galeria = [
  heroImg,
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80",
];

function ClienteHome() {
  const navigate = useNavigate();
  const location = useLocation();

  // Buscador del hero
  const [busqueda, setBusqueda] = useState({ llegada: "", salida: "", huespedes: 2, tipo: "" });
  // Formulario de contacto
  const [contacto, setContacto] = useState({ nombre: "", correo: "", asunto: "", mensaje: "" });
  const [contactoEnviado, setContactoEnviado] = useState(false);
  const [newsletter, setNewsletter] = useState("");

  // Si llegamos desde otra página con una sección objetivo, hacemos scroll
  useEffect(() => {
    const target = location.state?.scrollTo;
    if (target) {
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.state]);

  // Reservar (exige iniciar sesión, igual que en el resto del sitio)
  const irAReservar = (tipo) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { redirectTo: "/reservas", tipo_habitacion: tipo } });
      return;
    }
    navigate("/reservas", { state: { tipo_habitacion: tipo } });
  };

  const buscarDisponibilidad = (e) => {
    e.preventDefault();
    navigate("/reservas", {
      state: {
        tipo_habitacion: busqueda.tipo || undefined,
        fecha_inicio: busqueda.llegada || undefined,
        fecha_fin: busqueda.salida || undefined,
      },
    });
  };

  const enviarContacto = (e) => {
    e.preventDefault();
    setContactoEnviado(true);
    setContacto({ nombre: "", correo: "", asunto: "", mensaje: "" });
    setTimeout(() => setContactoEnviado(false), 5000);
  };

  const suscribir = (e) => {
    e.preventDefault();
    if (newsletter) {
      alert("¡Gracias! Te suscribiste con: " + newsletter);
      setNewsletter("");
    }
  };

  return (
    <div className="cliente-home">
      {/* ===================== HERO ===================== */}
      <section id="inicio" className="hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Descubre La Fragua</h1>
          <p>Un refugio urbano donde el encanto histórico se fusiona con el diseño contemporáneo</p>
          <div className="hero-buttons">
            <button type="button" className="btn-gold" onClick={() => irAReservar()}>Reservar ahora</button>
            <button type="button" className="btn-outline-gold" onClick={() => navigate("/habitaciones")}>Ver habitaciones</button>
          </div>
        </div>
      </section>

      {/* ===================== BUSCADOR ===================== */}
      <div className="buscador-wrap">
        <form className="buscador" onSubmit={buscarDisponibilidad}>
          <div className="buscador-campo">
            <label>Llegada</label>
            <input type="date" value={busqueda.llegada} onChange={(e) => setBusqueda({ ...busqueda, llegada: e.target.value })} />
          </div>
          <div className="buscador-campo">
            <label>Salida</label>
            <input type="date" value={busqueda.salida} onChange={(e) => setBusqueda({ ...busqueda, salida: e.target.value })} />
          </div>
          <div className="buscador-campo">
            <label>Huéspedes</label>
            <input type="number" min="1" value={busqueda.huespedes} onChange={(e) => setBusqueda({ ...busqueda, huespedes: e.target.value })} />
          </div>
          <div className="buscador-campo">
            <label>Tipo</label>
            <select value={busqueda.tipo} onChange={(e) => setBusqueda({ ...busqueda, tipo: e.target.value })}>
              <option value="">Sencilla / Doble / Familiar</option>
              <option value="Individual">Sencilla</option>
              <option value="Doble">Doble</option>
              <option value="Familiar">Familiar</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          <button type="submit" className="btn-gold buscador-btn">Buscar disponibilidad</button>
        </form>
      </div>

      {/* ===================== HABITACIONES ===================== */}
      <section id="habitaciones" className="seccion">
        <h2 className="seccion-titulo">Habitaciones</h2>
        <p className="seccion-sub">Espacios diseñados para el descanso: materiales nobles, luz cálida y detalles premium.</p>
        <div className="grid-3">
          {habitaciones.map((h) => (
            <div className="card" key={h.nombre}>
              <img src={h.img} alt={h.nombre} loading="lazy" />
              <div className="card-body">
                <div className="card-head">
                  <h3>{h.nombre}</h3>
                  <span className="precio">{h.precio}</span>
                </div>
                <p>{h.desc}</p>
                <button className="btn-gold w-100" onClick={() => navigate("/habitaciones")}>Ver detalles</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== OFERTAS ===================== */}
      <section id="ofertas" className="seccion seccion-alt">
        <h2 className="seccion-titulo">Ofertas</h2>
        <div className="grid-3">
          {ofertas.map((o) => (
            <div className="card" key={o.titulo}>
              <div className="card-img-wrap">
                <img src={o.img} alt={o.titulo} loading="lazy" />
                <span className="badge-oferta">{o.etiqueta}</span>
              </div>
              <div className="card-body">
                <h3>{o.titulo}</h3>
                <p>{o.desc}</p>
                <button className="btn-outline-gold w-100" onClick={() => irAReservar()}>Aplicar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== GASTRONOMÍA ===================== */}
      <section id="gastronomia" className="seccion">
        <h2 className="seccion-titulo">Gastronomía — Dine &amp; Drink</h2>
        <div className="split">
          <div className="split-text">
            <h3>Restaurante La Fragua</h3>
            <p>Cocina de autor con ingredientes locales y técnicas contemporáneas. Desayunos, brunch y cenas de temporada.</p>
            <ul>
              <li>Menú degustación</li>
              <li>Coctelería de firma</li>
              <li>Opciones vegetarianas y sin gluten</li>
            </ul>
          </div>
          <div className="split-img">
            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80" alt="Restaurante La Fragua" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ===================== PARA HACER ===================== */}
      <section id="para-hacer" className="seccion seccion-alt">
        <h2 className="seccion-titulo">Para Hacer</h2>
        <div className="grid-3">
          {paraHacer.map((p) => (
            <div className="card" key={p.titulo}>
              <img src={p.img} alt={p.titulo} loading="lazy" />
              <div className="card-body">
                <h3>{p.titulo}</h3>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== BIENESTAR ===================== */}
      <section id="bienestar" className="seccion">
        <h2 className="seccion-titulo">Bienestar</h2>
        <div className="split">
          <div className="split-img">
            <img src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80" alt="Piscina y Jacuzzi" loading="lazy" />
          </div>
          <div className="split-text">
            <h3>Piscina y Jacuzzi</h3>
            <p>Un oasis de calma: masajes, faciales y rituales de relajación con productos botánicos.</p>
            <ul>
              <li>Masaje relajante / descontracturante</li>
              <li>Zona húmeda y sauna</li>
              <li>Clases de yoga (bajo reserva)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== GRUPOS & EVENTOS ===================== */}
      <section id="grupos" className="seccion seccion-alt">
        <h2 className="seccion-titulo">Grupos &amp; Eventos</h2>
        <div className="split">
          <div className="split-text">
            <p>Salones versátiles para reuniones, presentaciones y celebraciones privadas. Equipos A/V y catering disponible.</p>
            <ul>
              <li>Hasta 80 personas</li>
              <li>Montajes flexibles</li>
              <li>Paquetes corporativos</li>
            </ul>
            <button className="btn-gold" onClick={() => irAReservar()}>Reservar</button>
          </div>
          <div className="split-img">
            <img src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80" alt="Grupos y Eventos" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ===================== GALERÍA ===================== */}
      <section id="galeria" className="seccion">
        <h2 className="seccion-titulo">Galería</h2>
        <div className="galeria-grid">
          {galeria.map((src, i) => (
            <div className="galeria-item" key={i}>
              <img src={src} alt={`Galería ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CONTACTO ===================== */}
      <section id="contacto" className="seccion seccion-alt">
        <h2 className="seccion-titulo">Contacto</h2>
        {contactoEnviado && (
          <div className="alerta-ok">¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.</div>
        )}
        <form className="form-contacto" onSubmit={enviarContacto}>
          <div className="form-row">
            <div className="form-campo">
              <label>Nombre</label>
              <input type="text" placeholder="Tu nombre" value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} required />
            </div>
            <div className="form-campo">
              <label>Correo</label>
              <input type="email" placeholder="tu@correo.com" value={contacto.correo} onChange={(e) => setContacto({ ...contacto, correo: e.target.value })} required />
            </div>
            <div className="form-campo">
              <label>Asunto</label>
              <input type="text" placeholder="Consulta / Reserva / Evento" value={contacto.asunto} onChange={(e) => setContacto({ ...contacto, asunto: e.target.value })} />
            </div>
          </div>
          <div className="form-campo">
            <label>Mensaje</label>
            <textarea rows="4" placeholder="Cuéntanos más…" value={contacto.mensaje} onChange={(e) => setContacto({ ...contacto, mensaje: e.target.value })} required />
          </div>
          <div className="contacto-datos">
            <span>📍 Dirección de ejemplo 123, Ciudad</span>
            <span>📞 +57 300 000 0000</span>
            <span>✉️ contacto@lafragua.com</span>
          </div>
          <button type="submit" className="btn-gold">Enviar</button>
        </form>
      </section>

      {/* ===================== SOBRE / ACCESIBILIDAD ===================== */}
      <section className="seccion">
        <h2 className="seccion-titulo">Sobre La Fragua</h2>
        <p className="seccion-sub">Somos un hotel boutique independiente. Cuidamos los detalles, el confort y la hospitalidad cercana.</p>
        <h2 className="seccion-titulo" style={{ marginTop: "40px" }}>Accesibilidad</h2>
        <p className="seccion-sub">Trabajamos para que todos los huéspedes disfruten de una experiencia cómoda y segura. Contáctanos si necesitas asistencia específica.</p>
      </section>

      {/* ===================== NEWSLETTER ===================== */}
      <section className="seccion newsletter">
        <h3>Recibe novedades y ofertas</h3>
        <form className="newsletter-form" onSubmit={suscribir}>
          <input type="email" placeholder="tu@correo.com" value={newsletter} onChange={(e) => setNewsletter(e.target.value)} required />
          <button type="submit" className="btn-gold">Suscribirse</button>
        </form>
        <div className="newsletter-social">
          <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Facebook</a>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="footer">
        <div className="footer-cols">
          <div className="footer-col">
            <h4>La Fragua</h4>
            <p>Tu lugar ideal para descansar y disfrutar experiencias únicas.</p>
          </div>
          <div className="footer-col">
            <h4>Enlaces</h4>
            <button onClick={() => document.getElementById("inicio")?.scrollIntoView({ behavior: "smooth" })}>Inicio</button>
            <button onClick={() => navigate("/habitaciones")}>Habitaciones</button>
            <button onClick={() => document.getElementById("gastronomia")?.scrollIntoView({ behavior: "smooth" })}>Gastronomía</button>
            <button onClick={() => document.getElementById("bienestar")?.scrollIntoView({ behavior: "smooth" })}>Bienestar</button>
            <button onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}>Contacto</button>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <p>Email: info@lafragua.com</p>
            <p>Tel: +57 300 000 0000</p>
            <p>Ubicación: Gambita, Santander</p>
          </div>
          <div className="footer-col">
            <h4>Síguenos</h4>
            <div className="footer-social">
              <a href="#" onClick={(e) => e.preventDefault()}>Facebook</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
            </div>
          </div>
        </div>
        <p className="footer-copy">© 2025 La Fragua. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default ClienteHome;
