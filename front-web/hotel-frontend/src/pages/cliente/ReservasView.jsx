import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { crearReserva, getServiciosAdicionales } from "../../services/reservasApi";
import { getHabitaciones } from "../../services/habitacionesApi";
import DatePicker from "react-datepicker";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";
import "./datepicker-custom.css";

// Registrar el locale español
registerLocale('es', es);
setDefaultLocale('es');

// "YYYY-MM-DD" se interpreta como medianoche UTC si se pasa directo a `new Date()`,
// lo que corre la fecha un día atrás en zonas horarias detrás de UTC (como Colombia).
// Este helper la interpreta en hora local en su lugar.
const parseFechaLocal = (fechaStr) => {
  if (!fechaStr) return null;
  const [year, month, day] = fechaStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatFechaLocal = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function ReservasView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    tipo_documento: "CC",
    numero_documento: "",
    correo: "",
    telefono: "",
    tipo_habitacion: "Individual",
    fecha_inicio: "",
    fecha_fin: "",
    adultos: 1,
    ninos: 0,
    bebes: 0
  });

  const [loading, setLoading] = useState(false);
  const [reservaSuccess, setReservaSuccess] = useState(false);

  const [habitaciones, setHabitaciones] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

  const fechasCompletas = Boolean(formData.fecha_inicio && formData.fecha_fin);

  // Preseleccionar el tipo de habitación si venimos de un botón "Reservar Ahora"
  useEffect(() => {
    const tipo = location.state?.tipo_habitacion;
    if (tipo) {
      setFormData((prev) => ({ ...prev, tipo_habitacion: tipo }));
    }
  }, [location.state]);

  // Verificar autenticación y cargar datos del cliente
  useEffect(() => {
    const token = localStorage.getItem('token');
    const clienteData = localStorage.getItem('clienteData');

    setIsAuthenticated(!!token);

    if (clienteData && token) {
      try {
        const cliente = JSON.parse(clienteData);
        setFormData(prev => ({
          ...prev,
          nombre: cliente.nombre || "",
          apellido: cliente.apellido || "",
          tipo_documento: cliente.tipo_documento || "CC",
          numero_documento: cliente.numero_documento || "",
          correo: cliente.correo || "",
          telefono: cliente.telefono || ""
        }));
      } catch (error) {
        console.error("Error parseando datos del cliente:", error);
        localStorage.removeItem('clienteData');
      }
    }
  }, []);

  // Cargar habitaciones (para precios) y catálogo de servicios adicionales
  useEffect(() => {
    getHabitaciones().then(setHabitaciones).catch((error) => console.error("Error cargando habitaciones:", error));
    getServiciosAdicionales().then(setServiciosDisponibles).catch((error) => console.error("Error cargando servicios adicionales:", error));
  }, []);

  const getPrecioTipo = (tipo) => {
    const habitacion = habitaciones.find((h) => h.tipo_habitacion === tipo);
    return habitacion ? Number(habitacion.precio_base) : 0;
  };

  const getOcupacionMaxima = (tipo) => {
    const habitacion = habitaciones.find((h) => h.tipo_habitacion === tipo);
    return habitacion ? Number(habitacion.ocupacion) : 1;
  };

  const getNoches = () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) return 0;
    const inicio = parseFechaLocal(formData.fecha_inicio);
    const fin = parseFechaLocal(formData.fecha_fin);
    return Math.max(Math.round((fin - inicio) / (1000 * 60 * 60 * 24)), 0);
  };

  const TARIFA_NINO = 0.5; // los niños pagan la mitad de la tarifa de adulto; los bebés no pagan

  const factorHuespedes = Number(formData.adultos) + Number(formData.ninos) * TARIFA_NINO;
  const totalHabitacion = getNoches() * getPrecioTipo(formData.tipo_habitacion) * factorHuespedes;
  const personasPagantesServicios = Number(formData.adultos) + Number(formData.ninos);
  const totalServicios = serviciosSeleccionados.reduce((suma, nombre) => {
    const servicio = serviciosDisponibles.find((s) => s.nombre === nombre);
    if (!servicio) return suma;
    const multiplicador = servicio.por_persona ? personasPagantesServicios : 1;
    return suma + servicio.precio * multiplicador;
  }, 0);
  const totalGeneral = totalHabitacion + totalServicios;

  const serviciosPorCategoria = serviciosDisponibles.reduce((grupos, servicio) => {
    (grupos[servicio.categoria] ||= []).push(servicio);
    return grupos;
  }, {});

  const toggleServicio = (nombre) => {
    setServiciosSeleccionados((prev) =>
      prev.includes(nombre) ? prev.filter((s) => s !== nombre) : [...prev, nombre]
    );
  };

  const formatCOP = (valor) => valor.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numero_documento) {
      alert('Por favor inicia sesión para hacer una reserva');
      return;
    }

    setLoading(true);
    try {
      const reservaData = {
        identificacion_cliente: formData.numero_documento,
        tipo_habitacion: formData.tipo_habitacion,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        adultos: Number(formData.adultos),
        ninos: Number(formData.ninos),
        bebes: Number(formData.bebes),
        servicios_adicionales: serviciosSeleccionados
      };

      await crearReserva(reservaData);
      setReservaSuccess(true);

      // Resetear formulario
      setFormData(prev => ({
        ...prev,
        tipo_habitacion: "Individual",
        fecha_inicio: "",
        fecha_fin: "",
        adultos: 1,
        ninos: 0,
        bebes: 0
      }));
      setServiciosSeleccionados([]);
    } catch (error) {
      console.error("Error creando reserva:", error);
      alert('Error al crear la reserva: ' + (error.response?.data?.detail || 'Intenta nuevamente'));
    } finally {
      setLoading(false);
    }
  };

  if (reservaSuccess) {
    return (
      <div className="reservas-view-cliente">
        {/* Success Section */}
        <div
          className="text-center text-white"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"), linear-gradient(135deg, #8B6344 0%, #A67C52 100%)',
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center center, center center',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundColor: '#8B6344',
            minHeight: '55vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)',
              zIndex: 1
            }}
          ></div>

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: '600px',
              padding: '2rem'
            }}
          >
            <div className="display-1 mb-4">
              <i className="bi bi-check-circle"></i>
            </div>
            <h1 className="display-4 fw-bold mb-3">¡Reserva Confirmada!</h1>
            <p className="lead mb-4">
              Tu reserva ha sido creada exitosamente. Ya puedes ver todos los detalles en "Mis Reservas".
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setReservaSuccess(false)}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                Hacer otra reserva
              </button>
              <button className="btn btn-outline-light btn-lg" onClick={() => navigate("/mis-reservas")}>
                <i className="bi bi-suitcase me-2"></i>
                Ver mis reservas
              </button>
            </div>
          </div>
        </div>

        {/* Información de check-in y normas */}
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-lg border-0">
                <div className="card-body p-4 p-md-5">
                  <h4 className="fw-bold mb-3" style={{ color: '#A67C52' }}>
                    <i className="bi bi-key me-2"></i>
                    Cómo funciona tu check-in
                  </h4>
                  <ul className="mb-4">
                    <li>Puedes hacer <strong>check-in por tu cuenta</strong> desde "Mis Reservas", disponible desde <strong>24 horas antes</strong> de tu fecha de llegada.</li>
                    <li>O si prefieres, puedes hacer el check-in <strong>directamente en la recepción</strong> del hotel el día de tu llegada — no necesitas hacer nada antes.</li>
                    <li>En ambos casos, se te asigna una habitación disponible del tipo que reservaste.</li>
                  </ul>

                  <h5 className="fw-bold mb-2" style={{ color: '#A67C52' }}>Normas de la estadía</h5>
                  <ul className="mb-0">
                    <li>El horario de check-out es hasta las 12:00 m.</li>
                    <li>No se permite fumar dentro de las habitaciones.</li>
                    <li>No se permiten mascotas ni visitantes no registrados.</li>
                    <li>Debes presentar tu documento de identidad al personal si te lo solicitan.</li>
                    <li>Cualquier daño a la habitación será cobrado según el reglamento del hotel.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservas-view-cliente">
      {/* Hero Section */}
      <div
        className="text-center text-white"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"), linear-gradient(135deg, #8B6344 0%, #A67C52 100%)',
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center center, center center',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundColor: '#8B6344',
          height: '320px',
          position: 'relative',
          display: 'block',
          width: '100%',
          margin: '0',
          padding: '0',
          border: 'none',
          outline: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)',
            zIndex: 1
          }}
        ></div>

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem 2rem 1rem'
          }}
        >
          <h1
            className="display-4 fw-bold mb-2 text-white"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            Reservar tu Estancia
          </h1>
          <p
            className="lead mb-0 text-white"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
          >
            Completa el formulario para garantizar tu habitación perfecta
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Datos Personales */}
                    <div className="col-12">
                      <h4 className="fw-bold mb-4" style={{ color: '#A67C52' }}>
                        <i className="bi bi-person me-2"></i>
                        Datos Personales
                      </h4>
                      {isAuthenticated && (
                        <div className="alert alert-info mb-4" role="alert">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-info-circle me-3 fs-4"></i>
                            <div>
                              <strong>Datos autocompletados desde tu perfil</strong><br />
                              Los datos personales han sido cargados automáticamente desde tu cuenta.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Apellido</label>
                      <input
                        type="text"
                        className="form-control"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        required
                        placeholder="Tu apellido"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Tipo de Documento</label>
                      <select
                        className="form-select"
                        name="tipo_documento"
                        value={formData.tipo_documento}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Número de Documento</label>
                      <input
                        type="text"
                        className="form-control"
                        name="numero_documento"
                        value={formData.numero_documento}
                        onChange={handleInputChange}
                        required
                        placeholder="Número de documento"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Teléfono</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                        placeholder="Número de teléfono"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Correo Electrónico</label>
                      <input
                        type="email"
                        className="form-control"
                        name="correo"
                        value={formData.correo}
                        onChange={handleInputChange}
                        required
                        placeholder="tu@email.com"
                      />
                    </div>

                    {/* Datos de Reserva */}
                    <div className="col-12">
                      <h4 className="fw-bold mb-4 mt-4" style={{ color: '#A67C52' }}>
                        <i className="bi bi-calendar-check me-2"></i>
                        Datos de la Reserva
                      </h4>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tipo de Habitación</label>
                      <select
                        className="form-select"
                        name="tipo_habitacion"
                        value={formData.tipo_habitacion}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Individual">Individual</option>
                        <option value="Doble">Doble</option>
                        <option value="Familiar">Familiar</option>
                        <option value="Suite">Suite</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Huéspedes
                        {habitaciones.length > 0 && (
                          <span className="text-muted fw-normal"> (máx. {getOcupacionMaxima(formData.tipo_habitacion)} en total)</span>
                        )}
                      </label>
                      <div className="row g-2">
                        <div className="col-4">
                          <label className="form-label small text-muted mb-1">Adultos (11+)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="adultos"
                            min="1"
                            value={formData.adultos}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label small text-muted mb-1">Niños (3-10)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="ninos"
                            min="0"
                            value={formData.ninos}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label small text-muted mb-1">Bebés (0-2)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="bebes"
                            min="0"
                            value={formData.bebes}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <p className="text-muted small mt-1 mb-0">Los niños pagan mitad de tarifa, los bebés no pagan.</p>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Fecha de Inicio</label>
                      <div className="input-group">
                        <DatePicker
                          selected={parseFechaLocal(formData.fecha_inicio)}
                          onChange={(date) => {
                            setFormData(prev => ({ ...prev, fecha_inicio: formatFechaLocal(date) }));
                          }}
                          className="form-control"
                          placeholderText="Selecciona fecha de inicio"
                          minDate={new Date()}
                          dateFormat="dd/MM/yyyy"
                          locale="es"
                          required
                          customInput={
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fecha_inicio ? parseFechaLocal(formData.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                              placeholder="Selecciona fecha de inicio"
                              readOnly
                            />
                          }
                        />
                        <span className="input-group-text">
                          <i className="bi bi-calendar-event"></i>
                        </span>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Fecha de Fin</label>
                      <div className="input-group">
                        <DatePicker
                          selected={parseFechaLocal(formData.fecha_fin)}
                          onChange={(date) => {
                            setFormData(prev => ({ ...prev, fecha_fin: formatFechaLocal(date) }));
                          }}
                          className="form-control"
                          placeholderText="Selecciona fecha de fin"
                          minDate={formData.fecha_inicio ? parseFechaLocal(formData.fecha_inicio) : new Date()}
                          dateFormat="dd/MM/yyyy"
                          locale="es"
                          required
                          customInput={
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fecha_fin ? parseFechaLocal(formData.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                              placeholder="Selecciona fecha de fin"
                              readOnly
                            />
                          }
                        />
                        <span className="input-group-text">
                          <i className="bi bi-calendar-event"></i>
                        </span>
                      </div>
                    </div>

                    {/* Servicios adicionales (aparecen una vez hay fechas elegidas) */}
                    {fechasCompletas && (
                      <div className="col-12">
                        <h4 className="fw-bold mb-1" style={{ color: '#A67C52' }}>
                          <i className="bi bi-stars me-2"></i>
                          Servicios adicionales (opcional)
                        </h4>
                        <p className="text-muted small mb-3">Personaliza tu estadía — todos son opcionales y se suman al total.</p>

                        {Object.entries(serviciosPorCategoria).map(([categoria, servicios]) => (
                          <div key={categoria} className="mb-3">
                            <p className="fw-semibold mb-2 small" style={{ color: '#8B6344' }}>{categoria}</p>
                            <div className="row g-2">
                              {servicios.map((servicio) => (
                                <div className="col-md-6" key={servicio.nombre}>
                                  <label className="d-flex align-items-center justify-content-between border rounded p-3" style={{ cursor: "pointer" }}>
                                    <span>
                                      <input
                                        type="checkbox"
                                        className="form-check-input me-2"
                                        checked={serviciosSeleccionados.includes(servicio.nombre)}
                                        onChange={() => toggleServicio(servicio.nombre)}
                                      />
                                      {servicio.nombre}
                                      {servicio.nombre === "Clase de yoga" && (
                                        <span className="d-block text-muted" style={{ fontSize: "0.75rem" }}>
                                          Sujeto a disponibilidad, el horario se coordina con el hotel
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-muted small">
                                      {formatCOP(servicio.precio)}{servicio.por_persona ? " / persona" : ""}
                                    </span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="border rounded p-3 mt-3" style={{ backgroundColor: "#f8f5f0" }}>
                          <div className="d-flex justify-content-between">
                            <span>
                              Habitación ({getNoches()} {getNoches() === 1 ? "noche" : "noches"} · {formData.adultos} adulto{Number(formData.adultos) === 1 ? "" : "s"}
                              {Number(formData.ninos) > 0 ? `, ${formData.ninos} niño${Number(formData.ninos) === 1 ? "" : "s"}` : ""}
                              {Number(formData.bebes) > 0 ? `, ${formData.bebes} bebé${Number(formData.bebes) === 1 ? "" : "s"}` : ""})
                            </span>
                            <span>{formatCOP(totalHabitacion)}</span>
                          </div>
                          {serviciosSeleccionados.length > 0 && (
                            <div className="d-flex justify-content-between">
                              <span>Servicios adicionales ({personasPagantesServicios} {personasPagantesServicios === 1 ? "persona" : "personas"})</span>
                              <span>{formatCOP(totalServicios)}</span>
                            </div>
                          )}
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>Total</span>
                            <span>{formatCOP(totalGeneral)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón de Reservar */}
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={loading || !fechasCompletas}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Creando reserva...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-calendar-check me-2"></i>
                            Confirmar Reserva
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReservasView;
