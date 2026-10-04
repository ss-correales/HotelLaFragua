import axios from "axios";
import { AUTH_SERVICE_URL } from "./config.js";

// API genérica con autenticación automática
const api = axios.create({
  baseURL: AUTH_SERVICE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Función para crear APIs específicas
export const createApi = (baseURL) => {
  const specificApi = axios.create({
    baseURL: baseURL,
  });

  specificApi.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return specificApi;
};

export default api;
