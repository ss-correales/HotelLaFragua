import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHabitaciones } from "../../services/habitacionesApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

function HabitacionesView() {
  const navigate = useNavigate();
  const [habitaciones, setHabitaciones] = useState([]);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(null);

  // Ir a reservar: exige iniciar sesión y preselecciona el tipo de habitación
  const handleReservar = (hab) => {
    const tipo = hab?.tipo_habitacion;
    const token = localStorage.getItem("token");
    if (!token) {
      // No ha iniciado sesión -> lo mandamos a login y luego continúa a reservas
      navigate("/login", {
        state: { redirectTo: "/reservas", tipo_habitacion: tipo },
      });
      return;
    }
    // Ya autenticado -> va a reservas con el tipo ya elegido
    navigate("/reservas", { state: { tipo_habitacion: tipo } });
  };
  const [filtro, setFiltro] = useState({
    tipo: "",
    personas: "",
    precioMin: "",
    precioMax: ""
  });

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  const cargarHabitaciones = async () => {
    try {
      const data = await getHabitaciones();
      setHabitaciones(data);
    } catch (error) {
      console.error("Error cargando habitaciones:", error);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltro({ ...filtro, [name]: value });
  };

  const handleBuscar = () => {
    // La búsqueda se aplica automáticamente con los filtros actuales
    console.log("Aplicando filtros:", filtro);
  };

  const handleLimpiarFiltros = () => {
    setFiltro({
      tipo: "",
      personas: "",
      precioMin: "",
      precioMax: ""
    });
    console.log("Filtros limpiados");
  };

  const habitacionesFiltradas = habitaciones.filter(habitacion => {
    return (
      (!filtro.tipo || habitacion.tipo_habitacion === filtro.tipo) &&
      (!filtro.personas || habitacion.ocupacion === parseInt(filtro.personas)) &&
      (!filtro.precioMin || habitacion.precio_base >= parseFloat(filtro.precioMin)) &&
      (!filtro.precioMax || habitacion.precio_base <= parseFloat(filtro.precioMax))
    );
  });

  // Agrupar habitaciones por tipo y obtener una representación de cada tipo
  const getTiposHabitaciones = () => {
    const tipos = ["Individual", "Doble", "Familiar", "Suite"];
    return tipos.map(tipo => {
      const habitacionesTipo = habitacionesFiltradas.filter(h => h.tipo_habitacion === tipo);
      // Buscar una habitación disponible de este tipo, si no hay, tomar la primera
      const habitacionRepresentativa = habitacionesTipo.find(h => h.estado === "Libre") || habitacionesTipo[0];
      
      return {
        tipo,
        habitacion: habitacionRepresentativa,
        disponible: habitacionesTipo.some(h => h.estado === "Libre"),
        totalDisponibles: habitacionesTipo.filter(h => h.estado === "Libre").length
      };
    }).filter(item => item.habitacion); // Solo mostrar tipos que existen
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      "Individual": "🛏️",
      "Doble": "🛏️🛏️",
      "Familiar": "👨‍👩‍👧‍👦",
      "Suite": "👑"
    };
    return iconos[tipo] || "🏠";
  };

  const getComodidadIcon = (comodidadId) => {
    const comodidades = {
      cama_king: "🛏️",
      escritorio: "🪑",
      aire_acondicionado: "❄️",
      tv_lcd: "📺",
      amenities: "🧴",
      cocina: "🍳",
      wifi: "📶",
      jacuzzi: "🛁",
      balcon: "🌅",
      minibar: "🍷",
      caja_fuerte: "🔐",
      servicio_habitacion: "🛎️"
    };
    return comodidades[comodidadId] || "📦";
  };

  const getComodidadLabel = (comodidadId) => {
    const labels = {
      cama_king: "Cama King",
      escritorio: "Escritorio",
      aire_acondicionado: "Aire Acondicionado",
      tv_lcd: "TV LCD",
      amenities: "Amenities",
      cocina: "Cocina",
      wifi: "WiFi",
      jacuzzi: "Jacuzzi",
      balcon: "Balcón",
      minibar: "Minibar",
      caja_fuerte: "Caja Fuerte",
      servicio_habitacion: "Servicio Habitación"
    };
    return labels[comodidadId] || comodidadId;
  };

  return (
    <div className="habitaciones-view-cliente">
      {/* Hero Section - Sin clase CSS, solo estilos inline */}
      <div 
        className="text-center text-white" 
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"), linear-gradient(135deg, #8B6344 0%, #A67C52 100%)',
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center center, center center',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundColor: '#8B6344',
          height: '350px',
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
            padding: '4rem 2rem 2rem'
          }}
        >
          <h1 
            className="display-4 fw-bold mb-2 text-white" 
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            Nuestras Habitaciones
          </h1>
          <p 
            className="lead mb-0 text-white" 
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
          >
            Descubre el confort y elegancia que te mereces
          </p>
        </div>
      </div>

      <div className="container py-5">
        {/* Filtros */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h5 className="card-title mb-4">Buscar Habitaciones</h5>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Tipo de Habitación</label>
                    <select 
                      className="form-select"
                      name="tipo"
                      value={filtro.tipo}
                      onChange={handleFiltroChange}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="Individual">Individual</option>
                      <option value="Doble">Doble</option>
                      <option value="Familiar">Familiar</option>
                      <option value="Suite">Suite</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Número de Personas</label>
                    <select 
                      className="form-select"
                      name="personas"
                      value={filtro.personas}
                      onChange={handleFiltroChange}
                    >
                      <option value="">Cantidad de personas</option>
                      <option value="1">1 persona</option>
                      <option value="2">2 personas</option>
                      <option value="3">3 personas</option>
                      <option value="4">3 o mas personas</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Precio Mínimo</label>
                    <input 
                      type="number" 
                      className="form-control"
                      name="precioMin"
                      value={filtro.precioMin}
                      onChange={handleFiltroChange}
                      placeholder="Desde..."
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Precio Máximo</label>
                    <input 
                      type="number" 
                      className="form-control"
                      name="precioMax"
                      value={filtro.precioMax}
                      onChange={handleFiltroChange}
                      placeholder="Hasta..."
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12 text-center">
                    <button 
                      className="btn btn-primary btn-lg px-5 me-2"
                      onClick={handleBuscar}
                    >
                      <i className="bi bi-search me-2"></i>
                      Buscar Habitaciones
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-lg px-4"
                      onClick={handleLimpiarFiltros}
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
                      <i className="bi bi-x-circle me-2"></i>
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Tipos de Habitaciones - Diseño Intercalado */}
        {getTiposHabitaciones().map((item, index) => (
          <div key={item.tipo} className="row g-4 mb-5 align-items-center">
            {/* Alternar posición: par = imagen izquierda, impar = imagen derecha */}
            {index % 2 === 0 ? (
              <>
                {/* Imagen a la izquierda */}
                <div className="col-lg-7">
                  <div className="position-relative">
                    {item.habitacion.foto ? (
                      <img 
                        src={item.habitacion.foto} 
                        alt={`Habitación ${item.tipo}`}
                        className="img-fluid rounded shadow-lg"
                        style={{ height: '450px', objectFit: 'cover', width: '100%' }}
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '450px' }}>
                        <i className="bi bi-image display-1 text-muted"></i>
                      </div>
                    )}

                                      </div>
                </div>

                {/* Texto a la derecha */}
                <div className="col-lg-5">
                  <div className="ps-lg-4">
                    <h3 className="fw-bold mb-3">
                      Habitación {item.tipo}
                    </h3>
                    
                    <p className="text-muted mb-4">
                      {item.habitacion.descripcion || `Habitación ${item.tipo.toLowerCase()} elegante y confortable diseñada para tu máxima comodidad.`}
                    </p>

                    <div className="mb-4">
                      <h5 className="fw-semibold mb-3">Características</h5>
                      <div className="row g-2">
                        <div className="col-6">
                          <p className="mb-2"><i className="bi bi-people me-2 text-primary"></i>{item.habitacion.ocupacion} {item.habitacion.ocupacion === 1 ? 'persona' : 'personas'}</p>
                        </div>
                        <div className="col-6">
                          <p className="mb-2"><i className="bi bi-door-closed me-2 text-primary"></i>{item.habitacion.numero_camas} cama{item.habitacion.numero_camas > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="d-grid gap-2 d-md-flex">
                      <button
                        className="btn btn-primary btn-lg flex-fill"
                        onClick={() => handleReservar(item.habitacion)}
                        disabled={!item.disponible}
                      >
                        <i className="bi bi-calendar-check me-2"></i>
                        {item.disponible ? "Reservar Ahora" : "No Disponible"}
                      </button>
                      <button 
                        className="btn btn-outline-secondary flex-fill"
                        onClick={() => setHabitacionSeleccionada(item.habitacion)}
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
                        <i className="bi bi-eye me-2"></i>
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Texto a la izquierda */}
                <div className="col-lg-5 order-lg-1 order-2">
                  <div className="pe-lg-4">
                    <h3 className="fw-bold mb-3">
                      Habitación {item.tipo}
                    </h3>
                    
                    <p className="text-muted mb-4">
                      {item.habitacion.descripcion || `Habitación ${item.tipo.toLowerCase()} elegante y confortable diseñada para tu máxima comodidad.`}
                    </p>

                    <div className="mb-4">
                      <h5 className="fw-semibold mb-3">Características</h5>
                      <div className="row g-2">
                        <div className="col-6">
                          <p className="mb-2"><i className="bi bi-people me-2 text-primary"></i>{item.habitacion.ocupacion} {item.habitacion.ocupacion === 1 ? 'persona' : 'personas'}</p>
                        </div>
                        <div className="col-6">
                          <p className="mb-2"><i className="bi bi-door-closed me-2 text-primary"></i>{item.habitacion.numero_camas} cama{item.habitacion.numero_camas > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="d-grid gap-2 d-md-flex">
                      <button
                        className="btn btn-primary btn-lg flex-fill"
                        onClick={() => handleReservar(item.habitacion)}
                        disabled={!item.disponible}
                      >
                        <i className="bi bi-calendar-check me-2"></i>
                        {item.disponible ? "Reservar Ahora" : "No Disponible"}
                      </button>
                      <button 
                        className="btn btn-outline-secondary flex-fill"
                        onClick={() => setHabitacionSeleccionada(item.habitacion)}
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
                        <i className="bi bi-eye me-2"></i>
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>

                {/* Imagen a la derecha */}
                <div className="col-lg-7 order-lg-2 order-1">
                  <div className="position-relative">
                    {item.habitacion.foto ? (
                      <img 
                        src={item.habitacion.foto} 
                        alt={`Habitación ${item.tipo}`}
                        className="img-fluid rounded shadow-lg"
                        style={{ height: '450px', objectFit: 'cover', width: '100%' }}
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '450px' }}>
                        <i className="bi bi-image display-1 text-muted"></i>
                      </div>
                    )}

                                      </div>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Mensaje si no hay habitaciones */}
        {getTiposHabitaciones().length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-house-door display-1 text-muted"></i>
            <h4 className="mt-3">No hay habitaciones disponibles</h4>
            <p className="text-muted">Por favor, intenta más tarde</p>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {habitacionSeleccionada && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0">
                <h5 className="modal-title">Detalles de la Habitación {habitacionSeleccionada.tipo_habitacion}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setHabitacionSeleccionada(null)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Imagen grande centrada */}
                <div className="text-center mb-4">
                  {habitacionSeleccionada.foto ? (
                    <img 
                      src={habitacionSeleccionada.foto} 
                      alt={`Habitación ${habitacionSeleccionada.numero_habitacion}`}
                      className="img-fluid rounded shadow-lg"
                      style={{ maxHeight: '300px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="text-center py-5 bg-light rounded">
                      <i className="bi bi-image display-1 text-muted"></i>
                      <p className="text-muted mt-2">Sin imagen disponible</p>
                    </div>
                  )}
                </div>

                {/* Fila inferior: comodidades izquierda, descripción derecha */}
                <div className="row">
                  {/* Comodidades a la izquierda */}
                  <div className="col-md-5">
                    <h5 className="fw-semibold mb-3">Comodidades</h5>
                    <div className="d-flex flex-wrap gap-2">
                      {(() => {
                        let comodidades = habitacionSeleccionada.comodidades || [];
                        
                        // Debug: mostrar qué datos vienen
                        console.log("Comodidades originales:", comodidades);
                        console.log("Tipo de comodidades:", typeof comodidades);
                        console.log("Es array:", Array.isArray(comodidades));
                        
                        // Si es un string, intentar convertirlo a array
                        if (typeof comodidades === 'string') {
                          console.log("Intentando parsear string:", comodidades);
                          try {
                            comodidades = JSON.parse(comodidades);
                            console.log("Parse exitoso:", comodidades);
                          } catch (e) {
                            console.log("Error parseando JSON:", e);
                            // Si no es JSON válido, mostrar array vacío
                            comodidades = [];
                          }
                        }
                        
                        // Asegurar que sea un array
                        if (!Array.isArray(comodidades)) {
                          console.log("No es array, convirtiendo a array vacío");
                          comodidades = [];
                        }
                        
                        console.log("Comodidades finales:", comodidades);
                        
                        return comodidades.length > 0 ? (
                          comodidades
                            .filter(comodidadId => comodidadId && comodidadId !== 'string' && typeof comodidadId === 'string')
                            .map((comodidadId, index) => {
                              console.log("Procesando comodidad válida:", comodidadId, typeof comodidadId);
                              return (
                                <span key={index} className="badge bg-light text-dark p-2">
                                  {getComodidadIcon(comodidadId)} {getComodidadLabel(comodidadId)}
                                </span>
                              );
                            })
                        ) : (
                          <span className="text-muted">No hay comodidades registradas</span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Descripción a la derecha */}
                  <div className="col-md-7">
                    <h5 className="fw-semibold mb-3">Descripción</h5>
                    <p className="text-muted">
                      {habitacionSeleccionada.descripcion || "Habitación elegante y confortable diseñada para tu máxima comodidad."}
                    </p>
                  </div>
                </div>

                {/* Características al final */}
                <div className="row mt-4 pt-3 border-top">
                  <div className="col-md-4">
                    <p className="mb-1"><strong>Capacidad:</strong></p>
                    <p className="text-muted">{habitacionSeleccionada.ocupacion} {habitacionSeleccionada.ocupacion === 1 ? 'persona' : 'personas'}</p>
                  </div>
                  <div className="col-md-4">
                    <p className="mb-1"><strong>Camas:</strong></p>
                    <p className="text-muted">{habitacionSeleccionada.numero_camas} cama{habitacionSeleccionada.numero_camas > 1 ? 's' : ''}</p>
                  </div>
                  <div className="col-md-4">
                    <p className="mb-1"><strong>Precio:</strong></p>
                    <h4 className="fw-bold mb-0" style={{ color: '#A67C52' }}>
                      ${parseFloat(habitacionSeleccionada.precio_base).toLocaleString()}
                    </h4>
                    <p className="text-muted small">por noche</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setHabitacionSeleccionada(null)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => handleReservar(habitacionSeleccionada)}
                  disabled={habitacionSeleccionada.estado !== "Libre"}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  {habitacionSeleccionada.estado === "Libre" ? "Reservar Ahora" : "No Disponible"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HabitacionesView;
