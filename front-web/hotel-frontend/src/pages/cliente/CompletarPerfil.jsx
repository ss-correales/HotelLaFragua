import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { crearCliente, getClientePorCorreo } from "../../services/clientesApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Se muestra justo despues de que un usuario nuevo entra por primera vez con
// "Continuar con Google": Google no entrega documento ni telefono, asi que
// faltan esos datos para poder crear su perfil de cliente.
function CompletarPerfil() {
  const location = useLocation();
  const navigate = useNavigate();
  const correo = localStorage.getItem("usuarioCorreo") || "";

  const [nombre, setNombre] = useState(location.state?.nombre || "");
  const [apellido, setApellido] = useState(location.state?.apellido || "");
  const [tipoDocumento, setTipoDocumento] = useState("CC");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !correo) {
      navigate("/login");
      return;
    }
    // Si ya tiene un perfil de cliente (ej. entro por segunda vez con Google
    // antes de que esta pagina existiera), no hay nada que completar.
    getClientePorCorreo(correo)
      .then(() => navigate("/perfil"))
      .catch(() => setVerificando(false));
  }, [correo, navigate]);

  const validar = () => {
    const nuevosErrores = {};
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre es requerido";
    if (!apellido.trim()) nuevosErrores.apellido = "El apellido es requerido";
    if (!numeroDocumento.trim()) nuevosErrores.numeroDocumento = "El número de documento es requerido";
    else if (numeroDocumento.length < 5) nuevosErrores.numeroDocumento = "Número inválido";
    if (!telefono.trim()) nuevosErrores.telefono = "El teléfono es requerido";
    else if (!/^\d{10}$/.test(telefono.replace(/\s/g, ""))) nuevosErrores.telefono = "10 dígitos requeridos";
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const formatTelefono = (value) => {
    const limpio = value.replace(/\s/g, "");
    if (limpio.length <= 3) return limpio;
    if (limpio.length <= 6) return `${limpio.slice(0, 3)} ${limpio.slice(3)}`;
    return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6, 10)}`;
  };

  const completarPerfil = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setLoading(true);
    try {
      await crearCliente({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento.trim(),
        correo,
        telefono: telefono.trim(),
      });
      navigate("/perfil");
    } catch (error) {
      alert(error.response?.data?.detail || "No se pudo completar tu perfil. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (verificando) return null;

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="row w-100">
        <div className="col-md-10 offset-md-1 col-lg-6 offset-lg-3">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="bi bi-person-check display-4 text-primary"></i>
                <h2 className="fw-bold mb-1 mt-2">¡Ya casi!</h2>
                <p className="text-muted">Completa estos datos para poder reservar en Hotel La Fragua</p>
              </div>

              <form onSubmit={completarPerfil}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nombre" className="form-label fw-semibold">Nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="given-name"
                      autoComplete="given-name"
                      className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                    {errors.nombre && <div className="invalid-feedback d-block">{errors.nombre}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="apellido" className="form-label fw-semibold">Apellido</label>
                    <input
                      type="text"
                      id="apellido"
                      name="family-name"
                      autoComplete="family-name"
                      className={`form-control ${errors.apellido ? "is-invalid" : ""}`}
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                    />
                    {errors.apellido && <div className="invalid-feedback d-block">{errors.apellido}</div>}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="tipoDocumento" className="form-label fw-semibold">Tipo de documento</label>
                    <select
                      id="tipoDocumento"
                      className="form-select"
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="numeroDocumento" className="form-label fw-semibold">Número de documento</label>
                    <input
                      type="text"
                      id="numeroDocumento"
                      name="numeroDocumento"
                      className={`form-control ${errors.numeroDocumento ? "is-invalid" : ""}`}
                      placeholder="123456789"
                      value={numeroDocumento}
                      onChange={(e) => setNumeroDocumento(e.target.value.replace(/\s/g, ""))}
                      required
                    />
                    {errors.numeroDocumento && <div className="invalid-feedback d-block">{errors.numeroDocumento}</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="telefono" className="form-label fw-semibold">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="tel"
                    autoComplete="tel"
                    className={`form-control ${errors.telefono ? "is-invalid" : ""}`}
                    placeholder="300 123 4567"
                    value={telefono}
                    onChange={(e) => setTelefono(formatTelefono(e.target.value))}
                    maxLength={12}
                    required
                  />
                  {errors.telefono && <div className="invalid-feedback d-block">{errors.telefono}</div>}
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                  {loading ? "Guardando..." : "Completar perfil"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletarPerfil;
