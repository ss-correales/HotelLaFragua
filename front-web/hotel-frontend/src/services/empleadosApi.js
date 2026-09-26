import { createApi } from "./api.js";
import { EMPLEADOS_SERVICE_URL } from "./config.js";

const empleadosApi = createApi(EMPLEADOS_SERVICE_URL);

export const getEmpleados = async () => {
  const response = await empleadosApi.get("/empleados/");
  return response.data;
};

export const getEmpleadoById = async (id) => {
  const response = await empleadosApi.get(`/empleados/${id}`);
  return response.data;
};

export const crearEmpleado = async (empleado) => {
  const response = await empleadosApi.post("/empleados/", empleado);
  return response.data;
};

export const actualizarEmpleado = async (id, empleado) => {
  const response = await empleadosApi.put(`/empleados/${id}`, empleado);
  return response.data;
};

export const eliminarEmpleado = async (id) => {
  const response = await empleadosApi.delete(`/empleados/${id}`);
  return response.data;
};
