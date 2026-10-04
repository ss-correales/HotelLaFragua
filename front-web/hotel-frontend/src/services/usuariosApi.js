import { createApi } from "./api.js";
import { AUTH_API_BASE_URL } from "./config.js";

const usuariosApi = createApi(AUTH_API_BASE_URL);

// Interceptor para manejar errores de autenticación
usuariosApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.log("Token expirado o inválido, redirigiendo al login");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Usuarios
export const getUsuarios = async () => {
  const response = await usuariosApi.get("/users");
  return response.data;
};

export const getUsuarioById = async (id) => {
  const response = await usuariosApi.get(`/users/${id}`);
  return response.data;
};

export const crearUsuario = async (usuario) => {
  const response = await usuariosApi.post("/register", usuario);
  return response.data;
};

export const actualizarUsuario = async (id, usuario) => {
  const response = await usuariosApi.put(`/users/${id}`, usuario);
  return response.data;
};

export const eliminarUsuario = async (id) => {
  const response = await usuariosApi.delete(`/users/${id}`);
  return response.data;
};

export const getRoles = async () => {
  const response = await usuariosApi.get("/roles");
  return response.data;
};
