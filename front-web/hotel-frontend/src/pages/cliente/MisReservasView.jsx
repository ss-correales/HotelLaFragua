import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMisReservas, checkinReserva } from "../../services/reservasApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// "YYYY-MM-DD" se interpreta como medianoche UTC si se pasa directo a `new Date()`,
// lo que corre la fecha un día atrás en zonas horarias detrás de UTC (como Colombia).
const parseFechaLocal = (fechaStr) => {
  if (!fechaStr) return null;
  const [year, month, day] = fechaStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

function MisReservasView() {
  const navigate = useNavigate();
  const [misReservas, setMisReservas] = useState([]);
  const [loadingMisReservas, setLoadingMisReservas] = useState(true);
  const [checkinEnCurso, setCheckinEnCurso] = useState(null);
  const [reservaParaCheckin, setReservaParaCheckin] = useState(null);
  const [checkinCompletado, setCheckinCompletado] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    cargarMisReservas();
  }, []);

  const cargarMisReservas = async () => {
    setLoadingMisReservas(true);
    try {
      const data = await getMisReservas();
      setMisReservas(data);
    } catch (error) {
      console.error("Error cargando mis reservas:", error);
    } finally {
      setLoadingMisReservas(false);
    }
  };

  // El check-in real se valida en el backend; esto solo habilita/deshabilita el botón en la UI
  const puedeHacerCheckin = (reserva) => {
    if (reserva.estado !== "Pendiente") return false;
    const inicio = parseFechaLocal(reserva.fecha_inicio);
    const ventana = new Date(inicio);
    ventana.setDate(ventana.getDate() - 1);
    return new Date() >= ventana;
  };

  const handleAbrirCheckin = (reserva) => {
    setCheckinCompletado(false);
    setReservaParaCheckin(reserva);
  };

  const closeCheckinModal = () => {
    setReservaParaCheckin(null);
    setCheckinCompletado(false);
  };

  const handleConfirmarCheckinPropio = async () => {
    if (!reservaParaCheckin) return;
    setCheckinEnCurso(reservaParaCheckin.id_reserva);
    try {
      await checkinReserva(reservaParaCheckin.id_reserva);
      setCheckinCompletado(true);
      await cargarMisReservas();
    } catch (error) {
      console.error("Error en check-in:", error);
      alert("No se pudo hacer el check-in: " + (error.response?.data?.detail || "Intenta nuevamente"));
    } finally {
      setCheckinEnCurso(null);
    }
  };

  return (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center mb-4">
        <div className="col-lg-9 d-flex justify-content-between align-items-center">
          <h2 className="fw-bold mb-0" style={{ color: "#A67C52" }}>
            <i className="bi bi-suitcase me-2"></i>
            Mis Reservas
          </h2>
          <button className="btn btn-gold" style={{ background: "#A67C52", borderColor: "#A67C52", color: "white" }} onClick={() => navigate("/reservas")}>
            <i className="bi bi-plus-lg me-2"></i>
            Nueva reserva
          </button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4">
              {loadingMisReservas ? (
                <div className="text-center py-3">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Cargando tus reservas...
                </div>
              ) : misReservas.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">Todavía no tienes reservas.</p>
                  <button className="btn btn-outline-primary" onClick={() => navigate("/reservas")}>
                    Hacer mi primera reserva
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Habitación</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {misReservas.map((reserva) => (
                        <tr key={reserva.id_reserva}>
                          <td>{reserva.tipo_habitacion}</td>
                          <td>{parseFechaLocal(reserva.fecha_inicio).toLocaleDateString('es-ES')}</td>
                          <td>{parseFechaLocal(reserva.fecha_fin).toLocaleDateString('es-ES')}</td>
                          <td>{reserva.numero_habitacion ?? "-"}</td>
                          <td>
                            <span className="badge bg-secondary">{reserva.estado}</span>
                          </td>
                          <td>
                            {reserva.estado === "Pendiente" && (
                              <button
                                className="btn btn-sm btn-success"
                                disabled={!puedeHacerCheckin(reserva)}
                                onClick={() => handleAbrirCheckin(reserva)}
                                title={
                                  puedeHacerCheckin(reserva)
                                    ? "Hacer check-in"
                                    : "Disponible desde 24 horas antes de tu fecha de inicio"
                                }
                              >
                                Check-in
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Check-in del cliente */}
      {reservaParaCheckin && (
        <div className="modal show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {checkinCompletado ? "¡Check-in confirmado!" : "Antes de tu check-in"}
                </h5>
                <button type="button" className="btn-close" onClick={closeCheckinModal}></button>
              </div>
              <div className="modal-body">
                {checkinCompletado ? (
                  <div className="text-center py-3">
                    <i className="bi bi-check-circle text-success" style={{ fontSize: "3rem" }}></i>
                    <p className="mt-3 mb-0">
                      Tu check-in quedó registrado y ya tienes una habitación asignada.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="fw-semibold mb-2">Normas de la estadía</p>
                    <ul className="mb-3">
                      <li>El horario de check-out es hasta las 12:00 m.</li>
                      <li>No se permite fumar dentro de las habitaciones.</li>
                      <li>No se permiten mascotas ni visitantes no registrados.</li>
                      <li>Debes presentar tu documento de identidad al personal si te lo solicitan.</li>
                      <li>Cualquier daño a la habitación será cobrado según el reglamento del hotel.</li>
                    </ul>
                    <p className="text-muted small mb-0">
                      Al confirmar, aceptas estas condiciones para tu estadía.
                    </p>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {checkinCompletado ? (
                  <button type="button" className="btn btn-primary" onClick={closeCheckinModal}>
                    Cerrar
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={closeCheckinModal}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={checkinEnCurso === reservaParaCheckin.id_reserva}
                      onClick={handleConfirmarCheckinPropio}
                    >
                      {checkinEnCurso === reservaParaCheckin.id_reserva ? "Procesando..." : "Acepto, confirmar check-in"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisReservasView;
