import { useEffect, useRef, useState } from "react";
import { enviarMensaje } from "../services/chatbotApi";
import "./ChatWidget.css";

const MENSAJE_BIENVENIDA = {
  rol: "asistente",
  texto:
    "¡Hola! Soy el asistente virtual de Hotel La Fragua. Puedo contarte sobre tipos de habitación, " +
    "servicios adicionales, cómo reservar, o revisar disponibilidad si me das el tipo de habitación " +
    "y las fechas (ej. \"suite del 10/12/2026 al 15/12/2026\").",
};

function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listaRef = useRef(null);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, abierto]);

  const handleEnviar = async (evento) => {
    evento.preventDefault();
    const texto = entrada.trim();
    if (!texto || enviando) return;

    const historialPrevio = mensajes;
    const nuevosMensajes = [...mensajes, { rol: "usuario", texto }];
    setMensajes(nuevosMensajes);
    setEntrada("");
    setEnviando(true);

    try {
      const { respuesta } = await enviarMensaje(texto, historialPrevio);
      setMensajes((actuales) => [...actuales, { rol: "asistente", texto: respuesta }]);
    } catch {
      setMensajes((actuales) => [
        ...actuales,
        { rol: "asistente", texto: "Tuve un problema para responder. Intenta de nuevo en unos segundos." },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="chat-widget">
      {abierto && (
        <div className="chat-widget__ventana">
          <div className="chat-widget__cabecera">
            <span>Asistente La Fragua</span>
            <button
              type="button"
              className="chat-widget__cerrar"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </div>

          <div className="chat-widget__mensajes" ref={listaRef}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`chat-widget__burbuja chat-widget__burbuja--${m.rol}`}
              >
                {m.texto}
              </div>
            ))}
            {enviando && (
              <div className="chat-widget__burbuja chat-widget__burbuja--asistente chat-widget__burbuja--cargando">
                Escribiendo…
              </div>
            )}
          </div>

          <form className="chat-widget__form" onSubmit={handleEnviar}>
            <input
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu pregunta..."
              maxLength={500}
            />
            <button type="submit" disabled={enviando || !entrada.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-widget__burbuja-flotante"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
      >
        {abierto ? "×" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;
