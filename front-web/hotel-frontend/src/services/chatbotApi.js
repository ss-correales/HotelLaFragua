import axios from "axios";
import { CHATBOT_SERVICE_URL } from "./config.js";

// El chatbot es público: no requiere token de sesión
const chatbotApi = axios.create({
  baseURL: CHATBOT_SERVICE_URL,
});

export const enviarMensaje = async (mensaje, historial = []) => {
  const response = await chatbotApi.post("/chatbot/mensaje", { mensaje, historial });
  return response.data;
};
