import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "../services/config.js";

const SCRIPT_ID = "google-identity-script";

function cargarScriptGoogle(onLoad) {
  if (window.google?.accounts?.id) {
    onLoad();
    return;
  }
  const existente = document.getElementById(SCRIPT_ID);
  if (existente) {
    existente.addEventListener("load", onLoad, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.addEventListener("load", onLoad, { once: true });
  document.body.appendChild(script);
}

// Boton oficial "Continuar con Google". Si no hay VITE_GOOGLE_CLIENT_ID configurado,
// no renderiza nada (el login/registro normal con correo y contraseña sigue funcionando).
function GoogleLoginButton({ onCredential, texto = "continue_with" }) {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    cargarScriptGoogle(() => {
      if (!contenedorRef.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (respuesta) => onCredential(respuesta.credential),
      });
      window.google.accounts.id.renderButton(contenedorRef.current, {
        theme: "outline",
        size: "large",
        text: texto,
        width: 320,
        locale: "es",
      });
    });
  }, [onCredential, texto]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={contenedorRef} className="d-flex justify-content-center my-2" />;
}

export default GoogleLoginButton;
