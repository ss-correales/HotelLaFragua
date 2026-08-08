import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { crearReserva, getHabitacionesDisponibles } from "../../services/reservasApi";
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

function ReservasView() {
  const location = useLocation();
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
    fecha_fin: ""
  });
  
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);
  const [reservaSuccess, setReservaSuccess] = useState(false);

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
    console.log("Token encontrado:", !!token);
    console.log("Datos del cliente en localStorage:", clienteData);
    
    if (clienteData && token) {
      try {
        const cliente = JSON.parse(clienteData);
        console.log("Cliente parseado:", cliente);
        
        setFormData(prev => ({
          ...prev,
          nombre: cliente.nombre || "",
          apellido: cliente.apellido || "",
          tipo_documento: cliente.tipo_documento || "CC",
          numero_documento: cliente.numero_documento || "",
          correo: cliente.correo || "",
          telefono: cliente.telefono || ""
        }));
        
        console.log("FormData actualizado:", {
          nombre: cliente.nombre || "",
          apellido: cliente.apellido || "",
          tipo_documento: cliente.tipo_documento || "CC",
          numero_documento: cliente.numero_documento || "",
          correo: cliente.correo || "",
          telefono: cliente.telefono || ""
        });
      } catch (error) {
        console.error("Error parseando datos del cliente:", error);
        // Limpiar datos corruptos
        localStorage.removeItem('clienteData');
      }
    } else {
      console.log("No se encontraron datos del cliente o token");
      // Limpiar formulario si no está autenticado
      setFormData(prev => ({
        ...prev,
        nombre: "",
        apellido: "",
        tipo_documento: "CC",
        numero_documento: "",
        correo: "",
        telefono: ""
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar resultados cuando cambian las fechas
    if (name === 'fecha_inicio' || name === 'fecha_fin') {
      setShowAvailable(false);
      setHabitacionesDisponibles([]);
    }
  };

  const checkDisponibilidad = async () => {
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      alert('Por favor selecciona las fechas de check-in y check-out');
      return;
    }

    setLoading(true);
    try {
      const disponibles = await getHabitacionesDisponibles(
        formData.fecha_inicio,
        formData.fecha_fin
      );
      setHabitacionesDisponibles(disponibles);
      setShowAvailable(true);
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
      alert('Error al verificar disponibilidad. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.numero_documento) {
      alert('Por favor inicia sesión para hacer una reserva');
      return;
    }

    setLoading(true);
    try {
      // Crear reserva solo con los campos de la BD
      const reservaData = {
        identificacion_cliente: formData.numero_documento,
        tipo_habitacion: formData.tipo_habitacion,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin
      };
      
      await crearReserva(reservaData);
      setReservaSuccess(true);
      
      // Resetear formulario
      setFormData(prev => ({
        ...prev,
        tipo_habitacion: "Individual",
        fecha_inicio: "",
        fecha_fin: ""
      }));
      setShowAvailable(false);
      setHabitacionesDisponibles([]);
    } catch (error) {
      console.error("Error creando reserva:", error);
      alert('Error al crear la reserva: ' + (error.response?.data?.message || 'Intenta nuevamente'));
    } finally {
      setLoading(false);
    }
  };

  if (reservaSuccess) {
    return (
      <div className="reservas-view-cliente">
        {/* Barra de Navegación Flotante */}
        <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{
          background: 'linear-gradient(135deg, rgba(166, 124, 82, 0.95) 0%, rgba(139, 99, 68, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
        }}>
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">
              <i className="bi bi-building me-2"></i>
              Hotel La Fragua
            </a>
            
            <button 
              className="navbar-toggler" 
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            
            <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`}>
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <a className="nav-link" href="/">
                    <i className="bi bi-house-door me-1"></i> Inicio
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/habitaciones">
                    <i className="bi bi-door-closed me-1"></i> Habitaciones
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link active" href="/reservas">
                    <i className="bi bi-calendar-check me-1"></i> Reservas
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/contacto">
                    <i className="bi bi-telephone me-1"></i> Contacto
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/login">
                    <i className="bi bi-person-circle me-1"></i> Iniciar Sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Success Section */}
        <div 
          className="text-center text-white" 
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"), linear-gradient(135deg, #8B6344 0%, #A67C52 100%)',
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center center, center center',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundColor: '#8B6344',
            height: '100vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Overlay oscuro */}
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
          
          {/* Contenido */}
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
              Tu reserva ha sido creada exitosamente. Pronto recibirás un correo de confirmación con todos los detalles.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => setReservaSuccess(false)}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                Hacer otra reserva
              </button>
              <a href="/" className="btn btn-outline-light btn-lg">
                <i className="bi bi-house me-2"></i>
                Volver al inicio
              </a>
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
        {/* Overlay oscuro */}
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
        
        {/* Contenido */}
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

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Check-in</label>
                      <div className="input-group">
                        <DatePicker
                          selected={formData.fecha_inicio ? new Date(formData.fecha_inicio) : null}
                          onChange={(date) => {
                            const formattedDate = date ? date.toISOString().split('T')[0] : '';
                            setFormData(prev => ({ ...prev, fecha_inicio: formattedDate }));
                            setShowAvailable(false);
                            setHabitacionesDisponibles([]);
                          }}
                          className="form-control"
                          placeholderText="Selecciona fecha de check-in"
                          minDate={new Date()}
                          dateFormat="dd/MM/yyyy"
                          locale="es"
                          required
                          customInput={
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fecha_inicio ? new Date(formData.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                              placeholder="Selecciona fecha de check-in"
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
                      <label className="form-label fw-semibold">Check-out</label>
                      <div className="input-group">
                        <DatePicker
                          selected={formData.fecha_fin ? new Date(formData.fecha_fin) : null}
                          onChange={(date) => {
                            const formattedDate = date ? date.toISOString().split('T')[0] : '';
                            setFormData(prev => ({ ...prev, fecha_fin: formattedDate }));
                          }}
                          className="form-control"
                          placeholderText="Selecciona fecha de check-out"
                          minDate={formData.fecha_inicio ? new Date(formData.fecha_inicio) : new Date()}
                          dateFormat="dd/MM/yyyy"
                          locale="es"
                          required
                          customInput={
                            <input
                              type="text"
                              className="form-control"
                              value={formData.fecha_fin ? new Date(formData.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                              placeholder="Selecciona fecha de check-out"
                              readOnly
                            />
                          }
                        />
                        <span className="input-group-text">
                          <i className="bi bi-calendar-event"></i>
                        </span>
                      </div>
                    </div>

                    {/* Botón de Ver Disponibilidad */}
                    <div className="col-12">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-lg w-100"
                        onClick={checkDisponibilidad}
                        disabled={loading}
                        style={{
                          borderColor: '#A67C52',
                          color: '#A67C52',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#A67C52';
                          e.target.style.color = 'white';
                          e.target.style.borderColor = '#A67C52';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#A67C52';
                          e.target.style.borderColor = '#A67C52';
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Verificando disponibilidad...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-search me-2"></i>
                            Verificar Disponibilidad
                          </>
                        )}
                      </button>
                    </div>

                    {/* Resultados de Disponibilidad */}
                    {showAvailable && (
                      <div className="col-12">
                        <div className="alert alert-success" role="alert">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle me-3 fs-4"></i>
                            <div>
                              <strong>¡Habitaciones Disponibles!</strong><br />
                              Hay {habitacionesDisponibles.length} habitaciones disponibles para las fechas seleccionadas.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botón de Reservar */}
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={loading || !showAvailable || habitacionesDisponibles.length === 0}
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
