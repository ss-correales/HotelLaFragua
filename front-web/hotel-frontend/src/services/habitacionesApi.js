import axios from "axios";
import { HABITACIONES_API_BASE_URL } from "./config.js";

// Las habitaciones se muestran sin token: pensadas como catálogo público
const habitacionesApi = axios.create({
  baseURL: HABITACIONES_API_BASE_URL,
});

export const getHabitaciones = async () => {
  const response = await habitacionesApi.get("/habitaciones");
  return response.data;
};

export const crearHabitacion = async (habitacion) => {
  const response = await habitacionesApi.post("/habitaciones", habitacion);
  return response.data;
};

export const actualizarHabitacion = async (id, habitacion) => {
  const response = await habitacionesApi.put(`/habitaciones/${id}`, habitacion);
  return response.data;
};

export const eliminarHabitacion = async (id) => {
  const response = await habitacionesApi.delete(`/habitaciones/${id}`);
  return response.data;
};
