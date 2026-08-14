import React, { useState, useEffect } from "react";
import {
  getReservas,
  crearReserva,
  checkinReserva,
  checkoutReserva
} from "../../services/reservasApi";
import { getHabitaciones } from "../../services/habitacionesApi";

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
    fecha_fin: ""
  });

  // Check-in
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [reservaParaCheckin, setReservaParaCheckin] = useState(null);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);

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
      fecha_fin: ""
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
        habitacionSeleccionada ? parseInt(habitacionSeleccionada, 10) : undefined
      );
      alert("Check-in realizado correctamente");
      await cargarDatos();
      closeCheckinModal();
    } catch (error) {
      console.error("Error en check-in:", error);
      alert("Error al hacer check-in: " + (error.response?.data?.detail || "Intenta nuevamente"));
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCheckout = async (id) => {
    if (!window.confirm("¿Confirmar check-out de esta reserva?")) return;
    try {
      await checkoutReserva(id);
      alert("Check-out realizado correctamente");
      await cargarDatos();
    } catch (error) {
      console.error("Error en check-out:", error);
      alert("Error al hacer check-out: " + (error.response?.data?.detail || "Intenta nuevamente"));
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
    <div className="py-4">
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
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="border-0">ID Reserva</th>
                  <th className="border-0">Identificación Cliente</th>
                  <th className="border-0">Tipo Habitación</th>
                  <th className="border-0">Número Habitación</th>
                  <th className="border-0">Fecha Inicio</th>
                  <th className="border-0">Fecha Fin</th>
                  <th className="border-0">Estado</th>
                  <th className="border-0">Canal</th>
                  <th className="border-0">Fecha Creación</th>
                  <th className="border-0">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservas.length > 0 ? (
                  filteredReservas.map((reserva) => (
                    <tr key={reserva.id_reserva} className={reserva.estado === "Finalizada" ? "table-secondary" : ""}>
                      <td className="align-middle">
                        <span className="fw-bold">#{reserva.id_reserva}</span>
                      </td>
                      <td className="align-middle">
                        <span className="fw-semibold">{reserva.identificacion_cliente}</span>
                      </td>
                      <td className="align-middle">
                        <span className="fw-semibold">{reserva.tipo_habitacion}</span>
                      </td>
                      <td className="align-middle">
                        <span className="fw-semibold">{reserva.numero_habitacion ?? "-"}</span>
                      </td>
                      <td className="align-middle">
                        <span className="small">
                          {reserva.fecha_inicio ? new Date(reserva.fecha_inicio).toLocaleDateString() : ""}
                        </span>
                      </td>
                      <td className="align-middle">
                        <span className="small">
                          {reserva.fecha_fin ? new Date(reserva.fecha_fin).toLocaleDateString() : ""}
                        </span>
                      </td>
                      <td className="align-middle">
                        {getEstadoBadge(reserva.estado)}
                      </td>
                      <td className="align-middle">
                        <span className={`badge ${reserva.canal === "Presencial" ? "bg-info text-dark" : "bg-primary"}`}>
                          {reserva.canal || "No disponible"}
                        </span>
                      </td>
                      <td className="align-middle">
                        <span className="small text-muted">
                          {reserva.fecha_creacion ? new Date(reserva.fecha_creacion).toLocaleString() : ""}
                        </span>
                      </td>
                      <td className="align-middle">
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
                              onClick={() => handleCheckout(reserva.id_reserva)}
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
                  Check-in — Reserva #{reservaParaCheckin.id_reserva}
                </h5>
                <button type="button" className="btn-close" onClick={closeCheckinModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Tipo de habitación: <strong>{reservaParaCheckin.tipo_habitacion}</strong>
                </p>

                {habitacionesDisponibles.length === 0 ? (
                  <div className="alert alert-warning mb-0">
                    No hay habitaciones de este tipo registradas.
                  </div>
                ) : (
                  <>
                    <div className="d-flex gap-3 mb-3 small">
                      <span><span className="badge bg-success">&nbsp;</span> Libre</span>
                      <span><span className="badge bg-danger">&nbsp;</span> Ocupada</span>
                      <span><span className="badge bg-warning">&nbsp;</span> Limpieza</span>
                      <span><span className="badge bg-info">&nbsp;</span> Mantenimiento</span>
                    </div>
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
                  </>
                )}
              </div>
              <div className="modal-footer">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservasView;
