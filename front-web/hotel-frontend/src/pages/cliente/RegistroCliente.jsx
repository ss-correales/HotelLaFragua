import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AUTH_API_BASE_URL, CLIENTES_SERVICE_URL } from "../../services/config.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function RegistroCliente() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CC");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Generar nombre de usuario automáticamente
  const generarNombreUsuario = () => {
    if (nombre && apellido) {
      const nombreLower = nombre.toLowerCase().replace(/\s/g, '');
      const apellidoLower = apellido.toLowerCase().replace(/\s/g, '');
      return `${nombreLower}.${apellidoLower}`;
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validación correo
    if (!correo) newErrors.correo = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(correo)) newErrors.correo = "Correo inválido";
    
    // Validación contraseña
    if (!password) newErrors.password = "La contraseña es requerida";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    
    // Validación confirmar contraseña
    if (!confirmPassword) newErrors.confirmPassword = "Confirma tu contraseña";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    
    // Validación nombre
    if (!nombre.trim()) newErrors.nombre = "El nombre es requerido";
    else if (nombre.length < 2) newErrors.nombre = "Mínimo 2 caracteres";
    
    // Validación apellido
    if (!apellido.trim()) newErrors.apellido = "El apellido es requerido";
    else if (apellido.length < 2) newErrors.apellido = "Mínimo 2 caracteres";
    
    // Validación tipo documento
    if (!tipoDocumento) newErrors.tipoDocumento = "Selecciona un tipo de documento";
    
    // Validación número documento
    if (!numeroDocumento.trim()) newErrors.numeroDocumento = "El número de documento es requerido";
    else if (numeroDocumento.length < 5) newErrors.numeroDocumento = "Número inválido";
    
    // Validación teléfono
    if (!telefono.trim()) newErrors.telefono = "El teléfono es requerido";
    else if (!/^\d{10}$/.test(telefono.replace(/\s/g, ''))) newErrors.telefono = "10 dígitos requeridos";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // 1️⃣ Registrar usuario en auth-service
      const nombreUsuarioGenerado = generarNombreUsuario();
      console.log(" Creando usuario con:", { nombreUsuario: nombreUsuarioGenerado, correo });
      
      const authResponse = await axios.post(`${AUTH_API_BASE_URL}/register`, {
        nombre_usuario: nombreUsuarioGenerado,
        correo,
        numero_documento: Number(numeroDocumento),
        contraseña: password,
        roles: ["cliente"] // Asignar rol cliente automáticamente
      });
      
      console.log("✅ Usuario creado en auth-service:", authResponse.data);

      // 2️⃣ Login automático para obtener token
      const loginResponse = await axios.post(`${AUTH_API_BASE_URL}/login`, {
        correo: correo,
        contraseña: password
      });

      const token = loginResponse.data.access_token;
      console.log("✅ Login exitoso, token recibido");

      if (!token) {
        alert("Error en el registro. No se recibió token de autenticación.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("usuarioCorreo", correo); // Guardar el correo para usarlo en el perfil
      
      // 3️⃣ Crear datos del cliente en clientes-service
      console.log(" Creando cliente con:", { nombre, apellido, correo });
      
      try {
        const clienteResponse = await axios.post(
          `${CLIENTES_SERVICE_URL}/clientes/`,
          {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento.trim(),
            correo: correo.trim(),
            telefono: telefono.trim()
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
        
        console.log("✅ Cliente creado en clientes-service:", clienteResponse.data);
      } catch (clienteError) {
        console.warn("⚠️ Error creando cliente, pero usuario ya existe:", clienteError.response?.data);
        // No lanzamos error aquí, el usuario ya fue creado en auth-service
        // El cliente puede completar sus datos más tarde
      }

      alert("¡Cuenta creada exitosamente! ");
      navigate("/perfil");

    } catch (error) {
      console.error("❌ ERROR en registro:", error.response?.data);
      
      // Manejo específico de errores
      let errorMessage = "Error en el registro";
      
      if (error.response?.status === 400) {
        if (error.response?.data?.detail?.includes("ya existe")) {
          errorMessage = "El correo electrónico ya está registrado. Intenta con otro correo.";
        } else if (error.response?.data?.detail?.includes("parsing")) {
          errorMessage = "Error en el formato de los datos. Por favor, verifica todos los campos.";
        } else {
          errorMessage = error.response?.data?.detail || "Datos inválidos. Por favor, verifica todos los campos.";
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Error de autenticación. Por favor, intenta nuevamente.";
      } else if (error.response?.status === 500) {
        errorMessage = "Error del servidor. Por favor, intenta más tarde.";
      } else if (error.code === "ERR_CONNECTION_REFUSED") {
        errorMessage = "No se puede conectar con el servidor. Verifica que los servicios estén corriendo.";
      } else {
        errorMessage = error.response?.data?.message || error.response?.data?.detail || "Error inesperado. Por favor, intenta nuevamente.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTelefono = (value) => {
    // Formato: XXX XXX XXXX
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="row w-100">
        <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2 col-xl-6 offset-xl-3">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-person-plus display-4 text-primary"></i>
                </div>
                <h2 className="fw-bold mb-1">Crear Cuenta</h2>
                <p className="text-muted">Únete a Hotel La Fragua</p>
              </div>

              <form onSubmit={registrarUsuario}>
                {/* SECCIÓN: DATOS DE ACCESO */}
                <div className="mb-4">
                  <h5 className="fw-semibold text-primary mb-3">
                    <i className="bi bi-shield-lock me-2"></i>
                    Datos de Acceso
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label htmlFor="correo" className="form-label fw-semibold">
                        Correo electrónico <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-envelope"></i>
                        </span>
                        <input
                          type="email"
                          className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                          id="correo"
                          placeholder="tu@email.com"
                          value={correo}
                          onChange={(e) => setCorreo(e.target.value)}
                          required
                        />
                      </div>
                      {errors.correo && <div className="invalid-feedback d-block">{errors.correo}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label fw-semibold">
                        Contraseña <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          type="password"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          id="password"
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label fw-semibold">
                        Confirmar contraseña <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-lock-fill"></i>
                        </span>
                        <input
                          type="password"
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          id="confirmPassword"
                          placeholder="Repite tu contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN: DATOS PERSONALES */}
                <div className="mb-4">
                  <h5 className="fw-semibold text-primary mb-3">
                    <i className="bi bi-person-badge me-2"></i>
                    Datos Personales
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nombre" className="form-label fw-semibold">
                        Nombre <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                          id="nombre"
                          placeholder="Juan"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          required
                        />
                      </div>
                      {errors.nombre && <div className="invalid-feedback d-block">{errors.nombre}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="apellido" className="form-label fw-semibold">
                        Apellido <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${errors.apellido ? 'is-invalid' : ''}`}
                          id="apellido"
                          placeholder="Pérez"
                          value={apellido}
                          onChange={(e) => setApellido(e.target.value)}
                          required
                        />
                      </div>
                      {errors.apellido && <div className="invalid-feedback d-block">{errors.apellido}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="tipoDocumento" className="form-label fw-semibold">
                        Tipo de documento <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-card-text"></i>
                        </span>
                        <select
                          className={`form-select ${errors.tipoDocumento ? 'is-invalid' : ''}`}
                          id="tipoDocumento"
                          value={tipoDocumento}
                          onChange={(e) => setTipoDocumento(e.target.value)}
                          required
                        >
                          <option value="">Selecciona...</option>
                          <option value="CC">Cédula de Ciudadanía</option>
                          <option value="CE">Cédula de Extranjería</option>
                          <option value="PASAPORTE">Pasaporte</option>
                        </select>
                      </div>
                      {errors.tipoDocumento && <div className="invalid-feedback d-block">{errors.tipoDocumento}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="numeroDocumento" className="form-label fw-semibold">
                        Número de documento <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-hash"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${errors.numeroDocumento ? 'is-invalid' : ''}`}
                          id="numeroDocumento"
                          placeholder="123456789"
                          value={numeroDocumento}
                          onChange={(e) => setNumeroDocumento(e.target.value.replace(/\s/g, ''))}
                          required
                        />
                      </div>
                      {errors.numeroDocumento && <div className="invalid-feedback d-block">{errors.numeroDocumento}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="telefono" className="form-label fw-semibold">
                        Teléfono <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-telephone"></i>
                        </span>
                        <input
                          type="tel"
                          className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                          id="telefono"
                          placeholder="300 123 4567"
                          value={telefono}
                          onChange={(e) => setTelefono(formatTelefono(e.target.value))}
                          maxLength={12}
                          required
                        />
                      </div>
                      {errors.telefono && <div className="invalid-feedback d-block">{errors.telefono}</div>}
                      <small className="text-muted">Formato: 300 123 4567</small>
                    </div>
                  </div>
                </div>

                {/* BOTONES */}
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Crear Cuenta
                      </>
                    )}
                  </button>
                  
                  <div className="text-center">
                    <span className="text-muted">¿Ya tienes cuenta? </span>
                    <a href="/login" className="text-primary text-decoration-none fw-semibold">
                      Iniciar sesión
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistroCliente;
