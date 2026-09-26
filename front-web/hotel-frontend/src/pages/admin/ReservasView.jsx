import React, { useState, useEffect } from "react";
import {
  getReservas,
  crearReserva,
  checkinReserva,
  checkoutReserva,
  getServiciosAdicionales
} from "../../services/reservasApi";
import { getHabitaciones } from "../../services/habitacionesApi";

// "YYYY-MM-DD" se interpreta como medianoche UTC si se pasa directo a `new Date()`,
// lo que corre la fecha un día atrás en zonas horarias detrás de UTC (como Colombia).
const parseFechaLocal = (fechaStr) => {
  if (!fechaStr) return null;
  const [year, month, day] = fechaStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

function ReservasView() {
  const [reservas, setReservas] = useState([]);
  const [filteredReservas, setFilteredReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchReserva, setSearchReserva] = useState("");
  const [showModalReserva, setShowModalReserva] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  const [formDataReserva, setFormDataReserva] = useState({
    identificacion_cliente: "",
    tipo_habitacion: "Individual",
    fecha_inicio: "",
    fecha_fin: "",
    adultos: 1,
    ninos: 0,
    bebes: 0
  });

  const [habitacionesCatalogo, setHabitacionesCatalogo] = useState([]);

  // Check-in
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [reservaParaCheckin, setReservaParaCheckin] = useState(null);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [serviciosCheckin, setServiciosCheckin] = useState([]);
  const [checkinFinalizado, setCheckinFinalizado] = useState(false);

  // Check-out
  const [reservaParaCheckout, setReservaParaCheckout] = useState(null);
  const [hayDanos, setHayDanos] = useState(false);
  const [montoDanos, setMontoDanos] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    getHabitaciones().then(setHabitacionesCatalogo).catch((error) => console.error("Error cargando habitaciones:", error));
  }, []);

  const getOcupacionMaxima = (tipo) => {
    const habitacion = habitacionesCatalogo.find((h) => h.tipo_habitacion === tipo);
    return habitacion ? Number(habitacion.ocupacion) : 1;
  };

  useEffect(() => {
    getServiciosAdicionales().then(setServiciosDisponibles).catch((error) => console.error("Error cargando servicios adicionales:", error));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const reservasData = await getReservas();
      setReservas(reservasData);
      setFilteredReservas(reservasData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDataReserva(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReserva = async (e) => {
    e.preventDefault();
    try {
      await crearReserva(formDataReserva);
      alert("Reserva creada correctamente");
      await cargarDatos();
      closeModal();
    } catch (error) {
      console.error("Error guardando reserva:", error);
      alert("Error al guardar la reserva: " + (error.response?.data?.detail || "Intenta nuevamente"));
    }
  };

  const resetForm = () => {
    setFormDataReserva({
      identificacion_cliente: "",
      tipo_habitacion: "Individual",
      fecha_inicio: "",
      fecha_fin: "",
      adultos: 1,
      ninos: 0,
      bebes: 0
    });
  };

  const closeModal = () => {
    setShowModalReserva(false);
    resetForm();
  };

  // ---- Check-in ----
  const handleAbrirCheckin = async (reserva) => {
    setReservaParaCheckin(reserva);
    setHabitacionSeleccionada("");
    setServiciosCheckin([]);
    setShowCheckinModal(true);
    try {
      const todas = await getHabitaciones();
      const delTipo = todas.filter((h) => h.tipo_habitacion === reserva.tipo_habitacion);
      setHabitacionesDisponibles(delTipo);
    } catch (error) {
      console.error("Error cargando habitaciones:", error);
      setHabitacionesDisponibles([]);
    }
  };

  const closeCheckinModal = () => {
    setShowCheckinModal(false);
    setReservaParaCheckin(null);
    setHabitacionesDisponibles([]);
    setHabitacionSeleccionada("");
    setServiciosCheckin([]);
    setCheckinFinalizado(false);
  };

  const toggleServicioCheckin = (nombre) => {
    setServiciosCheckin((prev) =>
      prev.includes(nombre) ? prev.filter((s) => s !== nombre) : [...prev, nombre]
    );
  };

  const colorEstadoHabitacion = (estado) => {
    switch (estado) {
      case "Libre": return "success";
      case "Ocupada": return "danger";
      case "Limpieza": return "warning";
      case "Mantenimiento": return "info";
      default: return "secondary";
    }
  };

  const handleConfirmarCheckin = async () => {
    if (!reservaParaCheckin) return;
    setCheckinLoading(true);
    try {
      await checkinReserva(
        reservaParaCheckin.id_reserva,
        habitacionSeleccionada ? parseInt(habitacionSeleccionada, 10) : undefined,
        serviciosCheckin
      );
      await cargarDatos();
      setCheckinFinalizado(true);
    } catch (error) {
      console.error("Error en check-in:", error);
      alert("Error al hacer check-in: " + (error.response?.data?.detail || "Intenta nuevamente"));
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleAbrirCheckout = (reserva) => {
    setReservaParaCheckout(reserva);
    setHayDanos(false);
    setMontoDanos("");
  };

  const closeCheckoutModal = () => {
    setReservaParaCheckout(null);
    setHayDanos(false);
    setMontoDanos("");
  };

  const handleConfirmarCheckout = async () => {
    if (!reservaParaCheckout) return;
    const monto = hayDanos ? parseFloat(montoDanos) || 0 : 0;
    setCheckoutLoading(true);
    try {
      await checkoutReserva(reservaParaCheckout.id_reserva, monto);
      alert(
        monto > 0
          ? "Check-out realizado. Se generó una factura adicional por los daños reportados."
          : "Check-out realizado correctamente"
      );
      await cargarDatos();
      closeCheckoutModal();
    } catch (error) {
      console.error("Error en check-out:", error);
      alert("Error al hacer check-out: " + (error.response?.data?.detail || "Intenta nuevamente"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filtrar reservas
  useEffect(() => {
    const filtered = reservas.filter(reserva => {
      const searchLower = searchReserva.toLowerCase();
      return (
        reserva.id_reserva?.toString().includes(searchLower) ||
        reserva.identificacion_cliente?.toString().includes(searchLower) ||
        reserva.tipo_habitacion?.toLowerCase().includes(searchLower) ||
        reserva.numero_habitacion?.toString().includes(searchLower) ||
        reserva.estado?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredReservas(filtered);
  }, [searchReserva, reservas]);

  const getEstadoBadge = (estado) => {
    const estados = {
      Pendiente: { bg: "bg-warning", text: "Pendiente" },
      Confirmada: { bg: "bg-success", text: "Confirmada" },
      Cancelada: { bg: "bg-danger", text: "Cancelada" },
      Finalizada: { bg: "bg-info", text: "Finalizada" }
    };
    const estadoInfo = estados[estado] || { bg: "bg-secondary", text: estado };
    return <span className={`badge ${estadoInfo.bg}`}>{estadoInfo.text}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h3 className="text-primary mb-1">{estadisticas.total}</h3>
                <p className="text-muted mb-0">Total Reservas</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h3 className="text-success mb-1">{estadisticas.confirmadas}</h3>
                <p className="text-muted mb-0">Confirmadas</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h3 className="text-warning mb-1">{estadisticas.pendientes}</h3>
                <p className="text-muted mb-0">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <h3 className="text-danger mb-1">{estadisticas.canceladas}</h3>
                <p className="text-muted mb-0">Canceladas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 fw-bold text-dark">
                <i className="bi bi-calendar-check me-3"></i>
                Gestión de Reservas
              </h2>
              <p className="text-muted mb-0 mt-2">
                Administra las reservas del hotel y su estado
              </p>
            </div>
            <div>
              <button
                className="btn"
                style={{
                  background: "#a67c52",
                  borderColor: "#a67c52",
                  color: "white"
                }}
                onClick={() => {
                  resetForm();
                  setShowModalReserva(true);
                }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Nueva Reserva
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Buscar por ID, identificación, habitación, tipo o estado..."
              value={searchReserva}
              onChange={(e) => setSearchReserva(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-end">
            <span className="text-muted">
              Mostrando {filteredReservas.length} de {reservas.length} reservas
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="card shadow-lg">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0 small">
              <thead className="table-light">
                <tr>
                  <th className="border-0 text-center">ID Reserva</th>
                  <th className="border-0 text-center">Identificación Cliente</th>
                  <th className="border-0 text-center">Tipo Habitación</th>
                  <th className="border-0 text-center">Número Habitación</th>
                  <th className="border-0 text-center">Fecha Inicio</th>
                  <th className="border-0 text-center">Fecha Fin</th>
                  <th className="border-0 text-center">Estado</th>
                  <th className="border-0 text-center">Canal</th>
                  <th className="border-0 text-center">Fecha Creación</th>
                  <th className="border-0 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservas.length > 0 ? (
                  filteredReservas.map((reserva) => (
                    <tr key={reserva.id_reserva} className={reserva.estado === "Finalizada" ? "table-secondary" : ""}>
                      <td className="align-middle text-center">
                        <span className="fw-bold">#{reserva.id_reserva}</span>
                      </td>
                      <td className="align-middle text-center">
                        <span className="fw-semibold">{reserva.identificacion_cliente}</span>
                      </td>
                      <td className="align-middle text-center">
                        <span className="fw-semibold">{reserva.tipo_habitacion}</span>
                      </td>
                      <td className="align-middle text-center">
                        <span className="fw-semibold">{reserva.numero_habitacion ?? "-"}</span>
                      </td>
                      <td className="align-middle text-center">
                        <span className="small">
                          {reserva.fecha_inicio ? parseFechaLocal(reserva.fecha_inicio).toLocaleDateString() : ""}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        <span className="small">
                          {reserva.fecha_fin ? parseFechaLocal(reserva.fecha_fin).toLocaleDateString() : ""}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        {getEstadoBadge(reserva.estado)}
                      </td>
                      <td className="align-middle text-center">
                        <span className={`badge ${reserva.canal === "Presencial" ? "bg-info text-dark" : "bg-primary"}`}>
                          {reserva.canal || "No disponible"}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        <span className="small text-muted">
                          {reserva.fecha_creacion ? new Date(reserva.fecha_creacion).toLocaleString() : ""}
                        </span>
                      </td>
                      <td className="align-middle text-center">
                        <div className="btn-group">
                          {reserva.estado === 'Pendiente' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleAbrirCheckin(reserva)}
                              title="Hacer check-in"
                            >
                              <i className="bi bi-box-arrow-in-right me-1"></i>
                              Check-in
                            </button>
                          )}

                          {reserva.estado === 'Confirmada' && (
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => handleAbrirCheckout(reserva)}
                              title="Hacer check-out"
                            >
                              <i className="bi bi-box-arrow-right me-1"></i>
                              Check-out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <div className="text-muted">
                        <i className="bi bi-calendar-x fs-1 mb-3 d-block"></i>
                        <h5>No se encontraron reservas</h5>
                        <p>No hay reservas que coincidan con tu búsqueda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Reserva */}
      {showModalReserva && (
        <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva Reserva</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmitReserva}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Identificación Cliente</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="identificacion_cliente"
                        value={formDataReserva.identificacion_cliente}
                        onChange={handleInputChange}
                        required
                        placeholder="Identificación del cliente"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Tipo Habitación</label>
                      <select
                        className="form-select form-select-lg"
                        name="tipo_habitacion"
                        value={formDataReserva.tipo_habitacion}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Individual">Individual</option>
                        <option value="Doble">Doble</option>
                        <option value="Familiar">Familiar</option>
                        <option value="Suite">Suite</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-12">
                      <label className="form-label fw-bold text-primary">
                        Huéspedes
                        <span className="text-muted fw-normal"> (máx. {getOcupacionMaxima(formDataReserva.tipo_habitacion)} en total)</span>
                      </label>
                      <div className="row g-2">
                        <div className="col-4">
                          <label className="form-label small text-muted mb-1">Adultos (11+)</label>
                          <input
                            type="number"
                            className="form-control"
                            name="adultos"
                            min="1"
                            value={formDataReserva.adultos}
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
                            value={formDataReserva.ninos}
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
                            value={formDataReserva.bebes}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Fecha Inicio</label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        name="fecha_inicio"
                        value={formDataReserva.fecha_inicio}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Fecha Fin</label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        name="fecha_fin"
                        value={formDataReserva.fecha_fin}
                        onChange={handleInputChange}
                        min={formDataReserva.fecha_inicio || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-muted small mt-3 mb-0">
                    La habitación específica se asigna al hacer el check-in, no en este paso.
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn" style={{ background: "#a67c52", borderColor: "#a67c52", color: "white" }}>
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-in */}
      {showCheckinModal && reservaParaCheckin && (
        <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {checkinFinalizado ? "Check-in listo — léele esto al huésped" : `Check-in — Reserva #${reservaParaCheckin.id_reserva}`}
                </h5>
                <button type="button" className="btn-close" onClick={closeCheckinModal}></button>
              </div>
              <div className="modal-body">
                {checkinFinalizado ? (
                  <>
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      Check-in confirmado{serviciosCheckin.length > 0 ? " — se generó una factura adicional por los servicios agregados." : "."}
                    </div>
                    <p className="fw-semibold mb-2">Normas de la estadía (léeselas al huésped)</p>
                    <ul className="mb-0">
                      <li>El horario de check-out es hasta las 12:00 m.</li>
                      <li>No se permite fumar dentro de las habitaciones.</li>
                      <li>No se permiten mascotas ni visitantes no registrados.</li>
                      <li>Debe presentar su documento de identidad si el personal se lo solicita.</li>
                      <li>Cualquier daño a la habitación será cobrado según el reglamento del hotel.</li>
                    </ul>
                  </>
                ) : (
                  <>
                <p className="mb-3">
                  Tipo de habitación: <strong>{reservaParaCheckin.tipo_habitacion}</strong>
                </p>

                {habitacionesDisponibles.length === 0 ? (
                  <div className="alert alert-warning mb-0">
                    No hay habitaciones de este tipo registradas.
                  </div>
                ) : (
                  <>
                    <p className="small text-muted mb-2">Leyenda de colores (solo referencia, no son botones):</p>
                    <div className="d-flex gap-3 mb-3 small">
                      <span><span className="badge bg-success">&nbsp;</span> Libre</span>
                      <span><span className="badge bg-danger">&nbsp;</span> Ocupada</span>
                      <span><span className="badge bg-warning">&nbsp;</span> Limpieza</span>
                      <span><span className="badge bg-info">&nbsp;</span> Mantenimiento</span>
                    </div>
                    <p className="small fw-semibold mb-2">Elige una habitación libre para asignar:</p>
                    <div className="row row-cols-3 row-cols-md-4 g-2">
                      {habitacionesDisponibles.map((h) => {
                        const esLibre = h.estado === "Libre";
                        const seleccionada = habitacionSeleccionada === String(h.numero_habitacion);
                        return (
                          <div className="col" key={h.numero_habitacion}>
                            <button
                              type="button"
                              disabled={!esLibre}
                              onClick={() => setHabitacionSeleccionada(String(h.numero_habitacion))}
                              className={`btn btn-${colorEstadoHabitacion(h.estado)} w-100 py-3 ${seleccionada ? "border border-dark border-3" : ""}`}
                              style={{ opacity: esLibre ? 1 : 0.6 }}
                            >
                              <div className="fw-bold">H-{h.numero_habitacion}</div>
                              <div className="small">{h.estado}</div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {serviciosDisponibles.length > 0 && (
                      <div className="mt-4">
                        <p className="small fw-semibold mb-2">
                          ¿Ofrecer algún servicio adicional de último momento? (opcional, se factura aparte)
                        </p>
                        <div className="row g-2">
                          {serviciosDisponibles.map((servicio) => (
                            <div className="col-md-6" key={servicio.nombre}>
                              <label className="d-flex align-items-center justify-content-between border rounded p-2 small" style={{ cursor: "pointer" }}>
                                <span>
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    checked={serviciosCheckin.includes(servicio.nombre)}
                                    onChange={() => toggleServicioCheckin(servicio.nombre)}
                                  />
                                  {servicio.nombre}
                                </span>
                                <span className="text-muted">
                                  {servicio.precio.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                {checkinFinalizado ? (
                  <button type="button" className="btn btn-primary" onClick={closeCheckinModal}>
                    Listo
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={closeCheckinModal}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={!habitacionSeleccionada || checkinLoading}
                      onClick={handleConfirmarCheckin}
                    >
                      {checkinLoading ? "Procesando..." : "Confirmar check-in"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-out */}
      {reservaParaCheckout && (
        <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Check-out — Reserva #{reservaParaCheckout.id_reserva} (Habitación {reservaParaCheckout.numero_habitacion})
                </h5>
                <button type="button" className="btn-close" onClick={closeCheckoutModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Verifica el estado de la habitación antes de cerrar el check-out.</p>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="hayDanosCheck"
                    checked={hayDanos}
                    onChange={(e) => setHayDanos(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="hayDanosCheck">
                    Se encontraron daños en la habitación
                  </label>
                </div>

                {hayDanos && (
                  <div>
                    <label className="form-label fw-semibold">Monto a cobrar por los daños</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        placeholder="0"
                        value={montoDanos}
                        onChange={(e) => setMontoDanos(e.target.value)}
                      />
                    </div>
                    <p className="text-muted small mt-1 mb-0">
                      Se generará una factura adicional por este monto, separada de la factura de la reserva.
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCheckoutModal}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-info"
                  disabled={checkoutLoading || (hayDanos && (!montoDanos || parseFloat(montoDanos) <= 0))}
                  onClick={handleConfirmarCheckout}
                >
                  {checkoutLoading ? "Procesando..." : "Confirmar check-out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservasView;
