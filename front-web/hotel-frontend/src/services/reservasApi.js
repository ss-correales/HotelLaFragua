import { createApi } from "./api.js";
import { RESERVAS_SERVICE_URL } from "./config.js";

const api = createApi(RESERVAS_SERVICE_URL);

// Endpoints de Reservas
export const getReservas = async () => {
  const response = await api.get("/reservas");
  return response.data;
};

export const getReservaById = async (id) => {
  const response = await api.get(`/reservas/${id}`);
  return response.data;
};

export const crearReserva = async (reserva) => {
  const response = await api.post("/reservas", reserva);
  return response.data;
};

export const actualizarReserva = async (id, reserva) => {
  const response = await api.put(`/reservas/${id}`, reserva);
  return response.data;
};

export const eliminarReserva = async (id) => {
  const response = await api.delete(`/reservas/${id}`);
  return response.data;
};

export const getReservasByCliente = async (idCliente) => {
  const response = await api.get(`/reservas/cliente/${idCliente}`);
  return response.data;
};

export const getReservasByHabitacion = async (idHabitacion) => {
  const response = await api.get(`/reservas/habitacion/${idHabitacion}`);
  return response.data;
};

export const getReservasByEstado = async (estado) => {
  const response = await api.get(`/reservas/estado/${estado}`);
  return response.data;
};

// Obtener habitaciones disponibles para fechas específicas
export const getHabitacionesDisponibles = async (fechaInicio, fechaFin) => {
  const response = await api.get(`/reservas/disponibles`, {
    params: { fechaInicio, fechaFin },
  });
  return response.data;
};

// Cambiar estado de reserva
export const cambiarEstadoReserva = async (id, nuevoEstado) => {
  const response = await api.patch(`/reservas/${id}/estado`, {
    estado: nuevoEstado
  });
  return response.data;
};

// Obtener estadísticas de reservas
export const getEstadisticasReservas = async () => {
  const response = await api.get("/reservas/estadisticas");
  return response.data;
};
