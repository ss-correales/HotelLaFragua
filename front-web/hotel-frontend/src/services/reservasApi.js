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

export const getMisReservas = async () => {
  const response = await api.get("/reservas/mias");
  return response.data;
};

export const getServiciosAdicionales = async () => {
  const response = await api.get("/reservas/servicios-adicionales");
  return response.data;
};

export const checkinReserva = async (idReserva, numeroHabitacion, serviciosAdicionales) => {
  const body = {};
  if (numeroHabitacion) body.numero_habitacion = numeroHabitacion;
  if (serviciosAdicionales && serviciosAdicionales.length > 0) body.servicios_adicionales = serviciosAdicionales;
  const response = await api.post(`/reservas/${idReserva}/checkin`, body);
  return response.data;
};

export const checkoutReserva = async (idReserva, montoDanos) => {
  const body = montoDanos > 0 ? { monto_danos: montoDanos } : {};
  const response = await api.post(`/reservas/${idReserva}/checkout`, body);
  return response.data;
};

// Consultar cuántas habitaciones de un tipo hay disponibles para un rango de fechas
export const getDisponibilidad = async (tipoHabitacion, fechaInicio, fechaFin) => {
  const response = await api.get(`/reservas/disponibles`, {
    params: { tipo_habitacion: tipoHabitacion, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  });
  return response.data;
};
