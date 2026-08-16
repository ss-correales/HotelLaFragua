import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClientes } from "../../services/clientesApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function PerfilCliente() {
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Guardar el correo del usuario cuando inicia sesión
  const getUsuarioCorreo = () => {
    return localStorage.getItem("usuarioCorreo") || "";
  };

  useEffect(() => {
    cargarDatosCliente();
  }, []);

  const cargarDatosCliente = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setError("No hay sesión activa");
      navigate("/login");
      return;
    }

    try {
      // Obtener todos los clientes y filtrar por el correo guardado
      const usuarioCorreo = getUsuarioCorreo();
      
      if (!usuarioCorreo) {
        setError("No se pudo identificar al usuario");
        navigate("/login");
        return;
      }
      
      const clientes = await getClientes();

      // Filtrar el cliente que corresponde al correo del usuario actual
      const clienteActual = clientes.find(cliente => cliente.correo === usuarioCorreo);
      
      if (clienteActual) {
        setClienteData(clienteActual);
      } else {
        setError("No se encontraron tus datos de cliente");
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError("No se pudieron cargar tus datos");
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioCorreo"); // Limpiar también el correo
    navigate("/");
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "No disponible";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="card text-center p-4">
          <i className="bi bi-exclamation-triangle display-4 text-warning"></i>
          <h4 className="mt-3">Error</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="fw-bold mb-1">Mi Perfil</h1>
                <p className="text-muted">Gestiona tu información personal</p>
              </div>
              <button className="btn btn-outline-danger" onClick={cerrarSesion}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Tarjeta de Información Personal */}
          <div className="col-lg-8 mb-4">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Información Personal
                </h4>
              </div>
              <div className="card-body">
                {clienteData ? (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted fw-semibold">Nombre Completo</label>
                      <p className="form-control-plaintext">
                        {clienteData.nombre} {clienteData.apellido}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted fw-semibold">Correo Electrónico</label>
                      <p className="form-control-plaintext">
                        {clienteData.correo || 'No disponible'}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted fw-semibold">Tipo de Documento</label>
                      <p className="form-control-plaintext">
                        {clienteData.tipo_documento}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted fw-semibold">Número de Documento</label>
                      <p className="form-control-plaintext">
                        {clienteData.numero_documento}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted fw-semibold">Teléfono</label>
                      <p className="form-control-plaintext">
                        {clienteData.telefono}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted fw-semibold">Fecha de Registro</label>
                      <p className="form-control-plaintext">
                        {formatearFecha(clienteData.fecha_registro)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-person display-4 text-muted"></i>
                    <p className="text-muted">No hay información disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta de Acciones Rápidas */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-lightning-charge me-2"></i>
                  Acciones Rápidas
                </h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary">
                    <i className="bi bi-pencil me-2"></i>
                    Editar Perfil
                  </button>
                  <button className="btn btn-outline-info">
                    <i className="bi bi-key me-2"></i>
                    Cambiar Contraseña
                  </button>
                  <button className="btn btn-outline-warning" onClick={() => navigate("/mis-reservas")}>
                    <i className="bi bi-calendar-check me-2"></i>
                    Mis Reservas
                  </button>
                </div>
              </div>
            </div>

            {/* Tarjeta de Estado */}
            <div className="card shadow-lg border-0 mt-3">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-shield-check me-2"></i>
                  Estado de Cuenta
                </h5>
              </div>
              <div className="card-body text-center">
                <span className="badge bg-success fs-6">
                  <i className="bi bi-check-circle me-1"></i>
                  Cuenta Activa
                </span>
                <p className="text-muted mt-2 mb-0">
                  Tu cuenta está verificada y activa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/habitaciones")}
                  >
                    <i className="bi bi-house-door me-2"></i>
                    Ver Habitaciones
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Actualizar Datos
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

export default PerfilCliente;
