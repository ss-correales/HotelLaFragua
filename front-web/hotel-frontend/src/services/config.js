const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const getEnvUrl = (key, fallback) => {
  const value = import.meta.env[key] || fallback;
  return normalizeBaseUrl(value);
};

export const AUTH_SERVICE_URL = getEnvUrl("VITE_AUTH_SERVICE_URL", "http://localhost:8086");
export const CLIENTES_SERVICE_URL = getEnvUrl("VITE_CLIENTES_SERVICE_URL", "http://localhost:8081");
export const HABITACIONES_SERVICE_URL = getEnvUrl("VITE_HABITACIONES_SERVICE_URL", "http://localhost:8082");
export const RESERVAS_SERVICE_URL = getEnvUrl("VITE_RESERVAS_SERVICE_URL", "http://localhost:8083");
export const FACTURACION_SERVICE_URL = getEnvUrl("VITE_FACTURACION_SERVICE_URL", "http://localhost:8084");
export const EMPLEADOS_SERVICE_URL = getEnvUrl("VITE_EMPLEADOS_SERVICE_URL", "http://localhost:8085");

export const AUTH_API_BASE_URL = `${AUTH_SERVICE_URL}/auth`;
export const HABITACIONES_API_BASE_URL = `${HABITACIONES_SERVICE_URL}/api`;
