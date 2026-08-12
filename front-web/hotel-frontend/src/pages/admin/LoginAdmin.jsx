import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AUTH_API_BASE_URL } from "../../services/config.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function LoginAdmin() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const iniciarSesionAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${AUTH_API_BASE_URL}/login`, {
        correo,
        contraseña: password
      });

      const token = response.data.access_token;

      if (!token) {
        alert("Error en el login de administrador. Intenta nuevamente.");
        return;
      }

      // Decodificar el JWT para obtener información del usuario
      let decodedPayload;
      try {
        const payload = token.split('.')[1];
        decodedPayload = JSON.parse(atob(payload));
      } catch {
        alert("No se pudo verificar el rol del usuario. Contacta al administrador del sistema.");
        return;
      }

      const user = {
        id: decodedPayload.sub || decodedPayload.id,
        correo: decodedPayload.correo || decodedPayload.email,
        roles: decodedPayload.roles || []
      };

      const hasAdminRole = Array.isArray(user.roles) && user.roles.some((rol) => {
        if (typeof rol === "string") return rol === "Administrador";
        return rol?.nombre === "Administrador" || rol?.name === "Administrador";
      });

      if (!hasAdminRole) {
        alert("Acceso denegado. Solo los administradores pueden acceder a este panel.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Disparar evento personalizado para sincronizar AuthProvider
      window.dispatchEvent(new CustomEvent('localStorageUpdated', {
        detail: { token, user }
      }));

      alert("¡Sesión de administrador iniciada correctamente!");
      navigate("/admin");

    } catch (error) {
      alert(error.response?.data?.message || "Credenciales de administrador incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="row w-100">
        <div className="col-md-6 offset-md-3 col-lg-4 offset-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-shield-check display-4 text-primary"></i>
                </div>
                <h2 className="fw-bold mb-1">Acceso de Administrador</h2>
                <p className="text-muted">Hotel La Fragua - Panel Administrativo</p>
              </div>

              <form onSubmit={iniciarSesionAdmin}>
                {/* Correo */}
                <div className="mb-3">
                  <label htmlFor="correo" className="form-label fw-semibold">
                    Correo Electrónico <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="correo"
                      placeholder="admin@hotellafragua.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold">
                    Contraseña <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Botón */}
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                    style={{ backgroundColor: "#a67c52", borderColor: "#a67c52" }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Iniciando Sesión...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Iniciar Sesión de Administrador
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Enlaces */}
              <div className="text-center mt-4">
                <p className="text-muted mb-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Acceso exclusivo para personal administrativo
                </p>
                <div className="d-flex justify-content-between">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/")}
                  >
                    <i className="bi bi-house me-1"></i>
                    Ir al Sitio
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => navigate("/login")}
                  >
                    <i className="bi bi-person me-1"></i>
                    Login Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
