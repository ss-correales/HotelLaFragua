import { createApi } from "./api.js";
import { FACTURACION_SERVICE_URL } from "./config.js";

const facturasApi = createApi(FACTURACION_SERVICE_URL);

export const getFacturas = async () => {
  const response = await facturasApi.get("/facturas/");
  return response.data;
};

export const getFacturaById = async (idFactura) => {
  const response = await facturasApi.get(`/facturas/${idFactura}`);
  return response.data;
};

export const getFacturasPorReserva = async (idReserva) => {
  const response = await facturasApi.get(`/facturas/reserva/${idReserva}`);
  return response.data;
};

export const registrarPago = async (idFactura, metodoPago, monto) => {
  const response = await facturasApi.post(`/facturas/${idFactura}/pagos`, {
    metodo_pago: metodoPago,
    monto,
  });
  return response.data;
};
