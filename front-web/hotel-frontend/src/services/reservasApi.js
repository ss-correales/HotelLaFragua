import axios from "axios";
import { RESERVAS_SERVICE_URL } from "./config.js";

// Configuración base para el API
const api = axios.create({
  baseURL: RESERVAS_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Función para obtener el token
const getToken = () => {
  return localStorage.getItem("token");
};

// Configuración de headers con autenticación
const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Endpoints de Reservas
export const getReservas = async () => {
  try {
    const response = await api.get("/reservas", {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    throw error;
  }
};

export const getReservaById = async (id) => {
  try {
    const response = await api.get(`/reservas/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo reserva:", error);
    throw error;
  }
};

export const crearReserva = async (reserva) => {
  try {
    const response = await api.post("/reservas", reserva, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creando reserva:", error);
    throw error;
  }
};

export const actualizarReserva = async (id, reserva) => {
  try {
    const response = await api.put(`/reservas/${id}`, reserva, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    throw error;
  }
};

export const iniciarPagoWompi = async (idReserva) => {
  try {
    const response = await api.post(`/reservas/${idReserva}/pago/wompi/checkout`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error iniciando pago Wompi:", error);
    throw error;
  }
};

export const eliminarReserva = async (id) => {
  try {
    const response = await api.delete(`/reservas/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error eliminando reserva:", error);
    throw error;
  }
};

export const getReservasByCliente = async (idCliente) => {
  try {
    const response = await api.get(`/reservas/cliente/${idCliente}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo reservas del cliente:", error);
    throw error;
  }
};

export const getReservasByHabitacion = async (idHabitacion) => {
  try {
    const response = await api.get(`/reservas/habitacion/${idHabitacion}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo reservas de la habitación:", error);
    throw error;
  }
};

export const getReservasByEstado = async (estado) => {
  try {
    const response = await api.get(`/reservas/estado/${estado}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo reservas por estado:", error);
    throw error;
  }
};

// Obtener habitaciones disponibles para fechas específicas
export const getHabitacionesDisponibles = async (fechaInicio, fechaFin) => {
  try {
    const response = await api.get(`/reservas/disponibles`, {
      params: { fechaInicio, fechaFin },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo habitaciones disponibles:", error);
    throw error;
  }
};

// Cambiar estado de reserva
export const cambiarEstadoReserva = async (id, nuevoEstado) => {
  try {
    const response = await api.patch(`/reservas/${id}/estado`, {
      estado: nuevoEstado
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error cambiando estado de reserva:", error);
    throw error;
  }
};

