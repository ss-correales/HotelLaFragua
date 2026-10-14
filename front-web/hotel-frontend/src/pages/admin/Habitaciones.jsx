// src/pages/admin/Habitaciones.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHabitaciones,
  crearHabitacion,
  actualizarHabitacion,
  eliminarHabitacion,
} from "../../services/habitacionesApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

function Habitaciones() {
  const navigate = useNavigate();
  const [habitaciones, setHabitaciones] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    numero_habitacion: "",
    tipo_habitacion: "",
    descripcion: "",
    ocupacion: "",
    numero_camas: "",
    precio_base: "",
    estado: "Libre",
    comodidades: [],
    foto: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para acceder a esta página");
      navigate("/login");
      return;
    }
    cargarHabitaciones();
  }, []);

  const cargarHabitaciones = async () => {
    try {
      const data = await getHabitaciones();
      setHabitaciones(data);
    } catch (error) {
      console.error("Error cargando habitaciones:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert price to number format (remove both dots and commas, then convert to number)
    if (name === "precio_base") {
      // Allow both dots and commas for thousands separator
      const cleanValue = value.replace(/[.,]/g, "");
      setForm({ ...form, [name]: cleanValue });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño del archivo (máximo 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 20MB.');
        e.target.value = '';
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen.');
        e.target.value = '';
        return;
      }
      
      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, foto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert all numeric fields before sending
      const formData = {
        ...form,
        precio_base: parseFloat(form.precio_base) || 0,
        ocupacion: parseInt(form.ocupacion) || 0,
        numero_camas: parseInt(form.numero_camas) || 0,
        numero_habitacion: parseInt(form.numero_habitacion) || 0,
      };
      
      if (editing) {
        await actualizarHabitacion(editing.numero_habitacion, formData);
        setEditing(null);
      } else {
        await crearHabitacion(formData);
      }
      
      resetForm();
      await cargarHabitaciones();
      setShowForm(false);
      
    } catch (error) {
      console.error("Error guardando habitación:", error);
      console.error("Detalles del error:", error.response?.data || error.message);
      
      // Mostrar error más específico
      let errorMessage = "Error al guardar la habitación. ";
      if (error.response?.status === 404) {
        errorMessage += "El endpoint del servidor no se encontró. Verifica que el backend esté corriendo en el puerto 8083.";
      } else if (error.response?.status === 400) {
        errorMessage += "Datos inválidos: " + (error.response.data?.message || "Verifica los campos del formulario.");
      } else if (error.response?.status === 500) {
        errorMessage += "Error del servidor. Verifica la consola del backend.";
      } else if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
        errorMessage += "No se puede conectar al servidor. Asegúrate que el backend esté corriendo.";
      } else {
        errorMessage += "Verifica la consola para más detalles.";
      }
      
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setForm({
      numero_habitacion: "",
      tipo_habitacion: "",
      descripcion: "",
      ocupacion: "",
      numero_camas: "",
      precio_base: "",
      estado: "Libre",
      comodidades: [],
      foto: "",
    });
  };

  const handleEditar = (habitacion) => {
    setEditing(habitacion);
    setForm({
      numero_habitacion: habitacion.numero_habitacion.toString(),
      tipo_habitacion: habitacion.tipo_habitacion,
      descripcion: habitacion.descripcion || "",
      ocupacion: habitacion.ocupacion.toString(),
      numero_camas: habitacion.numero_camas.toString(),
      precio_base: habitacion.precio_base.toString(),
      estado: habitacion.estado,
      comodidades: habitacion.comodidades || [],
      foto: habitacion.foto || "",
    });
    setShowForm(true);
  };

  const handleEliminar = async (numero_habitacion) => {
    if (window.confirm("¿Seguro que quieres eliminar esta habitación?")) {
      try {
        await eliminarHabitacion(numero_habitacion);
        cargarHabitaciones();
      } catch (error) {
        console.error("Error eliminando habitación:", error);
      }
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      Libre: "success",
      Ocupada: "danger", 
      Limpieza: "info",
      Mantenimiento: "warning",
    };
    return estados[estado] || "secondary";
  };

  const getEstadoIcon = (estado) => {
    const iconos = {
      Libre: "✅",
      Ocupada: "🔴",
      Limpieza: "🧹", 
      Mantenimiento: "🔧",
    };
    return iconos[estado] || "❓";
  };

  const getTipoIcon = (tipo) => {
    const iconos = {
      Individual: "🛏️",
      Doble: "🛏️🛏️",
      Familiar: "👨‍👩‍👧‍👦",
      Suite: "👑",
    };
    return iconos[tipo] || "🏠";
  };

  const getComodidadIcon = (comodidadId) => {
    const comodidades = {
      cama_king: "🛏️",
      escritorio: "🪑",
      aire_acondicionado: "❄️",
      tv_lcd: "📺",
      amenities: "🧴",
      cocina: "🍳",
      wifi: "📶",
      jacuzzi: "🛁",
      balcon: "🌅",
      minibar: "🍷",
      caja_fuerte: "🔐",
      servicio_habitacion: "🛎️",
    };
    return comodidades[comodidadId] || "📦";
  };

  const getComodidadLabel = (comodidadId) => {
    const labels = {
      cama_king: "Cama King",
      escritorio: "Escritorio",
      aire_acondicionado: "Aire Acondicionado",
      tv_lcd: "TV LCD",
      amenities: "Amenities",
      cocina: "Cocina",
      wifi: "WiFi",
      jacuzzi: "Jacuzzi",
      balcon: "Balcón",
      minibar: "Minibar",
      caja_fuerte: "Caja Fuerte",
      servicio_habitacion: "Servicio Habitación",
    };
    return labels[comodidadId] || comodidadId;
  };

  const handleComodidadToggle = (comodidadId) => {
    const comodidades = [...form.comodidades];
    const index = comodidades.indexOf(comodidadId);
    if (index !== -1) {
      comodidades.splice(index, 1);
    } else {
      comodidades.push(comodidadId);
    }
    setForm({ ...form, comodidades });
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-2">Gestión de Habitaciones</h2>
              <p className="text-muted mb-0">Administra las habitaciones del hotel</p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                resetForm();
                setEditing(null);
                setShowForm(true);
              }}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nueva Habitación
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-gradient-success text-white shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-1 opacity-75">Habitaciones Libres</h6>
                  <h2 className="card-text mb-0">
                    {habitaciones.filter(h => h.estado === "Libre").length}
                  </h2>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle bg-white bg-opacity-25 p-3">
                    <i className="bi bi-check-circle fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-gradient-danger text-white shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-1 opacity-75">Habitaciones Ocupadas</h6>
                  <h2 className="card-text mb-0">
                    {habitaciones.filter(h => h.estado === "Ocupada").length}
                  </h2>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle bg-white bg-opacity-25 p-3">
                    <i className="bi bi-person-fill fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-gradient-info text-white shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-1 opacity-75">En Limpieza</h6>
                  <h2 className="card-text mb-0">
                    {habitaciones.filter(h => h.estado === "Limpieza").length}
                  </h2>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle bg-white bg-opacity-25 p-3">
                    <i className="bi bi-arrow-repeat fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-gradient-warning text-white shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title mb-1 opacity-75">En Mantenimiento</h6>
                  <h2 className="card-text mb-0">
                    {habitaciones.filter(h => h.estado === "Mantenimiento").length}
                  </h2>
                </div>
                <div className="ms-3">
                  <div className="rounded-circle bg-white bg-opacity-25 p-3">
                    <i className="bi bi-tools fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? "Editar Habitación" : "Nueva Habitación"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForm(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Número de Habitación</label>
                      <input
                        type="number"
                        className="form-control"
                        name="numero_habitacion"
                        value={form.numero_habitacion}
                        onChange={handleChange}
                        required
                        disabled={editing}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tipo de Habitación</label>
                      <select
                        className="form-select"
                        name="tipo_habitacion"
                        value={form.tipo_habitacion}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Individual">Individual</option>
                        <option value="Doble">Doble</option>
                        <option value="Familiar">Familiar</option>
                        <option value="Suite">Suite</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Ocupación</label>
                      <input
                        type="number"
                        className="form-control"
                        name="ocupacion"
                        value={form.ocupacion}
                        onChange={handleChange}
                        required
                        min="1"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Número de Camas</label>
                      <input
                        type="number"
                        className="form-control"
                        name="numero_camas"
                        value={form.numero_camas}
                        onChange={handleChange}
                        required
                        min="1"
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Precio Base</label>
                      <input
                        type="text"
                        className="form-control"
                        name="precio_base"
                        value={form.precio_base}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="Ej: 80000, 80.000 o 80,000"
                      />
                      <small className="text-muted">Puedes usar puntos o comas para separar miles (ej: 80.000 = 80,000 = 80000)</small>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="estado"
                        value={form.estado}
                        onChange={handleChange}
                        required
                      >
                        <option value="Libre">Libre</option>
                        <option value="Ocupada">Ocupada</option>
                        <option value="Limpieza">Limpieza</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Descripción de la habitación..."
                    />
                  </div>
                  
                  {/* Campo de Foto */}
                  <div className="mb-4">
                    <label className="form-label">Foto de la Habitación</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-light">
                      {form.foto ? (
                        <div className="mb-3">
                          <img 
                            src={form.foto} 
                            alt="Foto de la habitación" 
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div className="mb-3">
                          <i className="bi bi-image display-4 text-muted"></i>
                          <p className="text-muted mt-2 mb-0">No hay foto seleccionada</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFotoChange}
                        id="fotoInput"
                      />
                      <small className="text-muted">Formatos aceptados: JPG, PNG, GIF. Máximo 20MB</small>
                    </div>
                  </div>
                  
                  {/* Comodidades */}
                  <div className="mb-4">
                    <label className="form-label">Comodidades</label>
                    <div className="row g-2">
                      {[
                        { id: 'cama_king', icon: '🛏️', label: 'Cama King' },
                        { id: 'escritorio', icon: '🪑', label: 'Escritorio' },
                        { id: 'aire_acondicionado', icon: '❄️', label: 'Aire Acondicionado' },
                        { id: 'tv_lcd', icon: '📺', label: 'TV LCD' },
                        { id: 'amenities', icon: '🧴', label: 'Amenities' },
                        { id: 'cocina', icon: '🍳', label: 'Cocina' },
                        { id: 'wifi', icon: '📶', label: 'WiFi' },
                        { id: 'jacuzzi', icon: '🛁', label: 'Jacuzzi' },
                        { id: 'balcon', icon: '🌅', label: 'Balcón' },
                        { id: 'minibar', icon: '🍷', label: 'Minibar' },
                        { id: 'caja_fuerte', icon: '🔐', label: 'Caja Fuerte' },
                        { id: 'servicio_habitacion', icon: '🛎️', label: 'Servicio Habitación' }
                      ].map(comodidad => (
                        <div key={comodidad.id} className="col-md-3 col-sm-4 col-6">
                          <div 
                            className={`comodidad-item ${form.comodidades.includes(comodidad.id) ? 'selected' : ''}`}
                            onClick={() => handleComodidadToggle(comodidad.id)}
                          >
                            <div className="comodidad-icon">{comodidad.icon}</div>
                            <div className="comodidad-label">{comodidad.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de habitaciones */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Lista de Habitaciones</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead className="table-light">
                <tr>
                  <th style={{width: '80px'}}>Número</th>
                  <th style={{width: '80px'}}>Foto</th>
                  <th style={{width: '100px'}}>Tipo</th>
                  <th style={{width: '90px'}}>Ocupación</th>
                  <th style={{width: '70px'}}>Camas</th>
                  <th style={{width: '100px'}}>Precio</th>
                  <th style={{width: '90px'}}>Estado</th>
                  <th style={{width: '200px'}}>Descripción</th>
                  <th style={{width: '150px'}}>Comodidades</th>
                  <th style={{width: '100px'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {habitaciones.map((habitacion) => (
                  <tr key={habitacion.numero_habitacion}>
                    <td>
                      <strong>{habitacion.numero_habitacion}</strong>
                    </td>
                    <td>
                      {habitacion.foto ? (
                        <img 
                          src={habitacion.foto} 
                          alt="Foto de la habitación" 
                          className="rounded"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded bg-light d-flex align-items-center justify-content-center"
                          style={{ width: '50px', height: '50px' }}
                        >
                          <i className="bi bi-image text-muted"></i>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-1">{getTipoIcon(habitacion.tipo_habitacion)}</span>
                        <span className="text-truncate" style={{maxWidth: '70px'}} title={habitacion.tipo_habitacion}>
                          {habitacion.tipo_habitacion}
                        </span>
                      </div>
                    </td>
                    <td>
                      <small>{habitacion.ocupacion} personas</small>
                    </td>
                    <td>
                      <small>{habitacion.numero_camas}</small>
                    </td>
                    <td>
                      <span className="fw-bold" style={{color: '#a67c52', fontSize: '0.9rem'}}>
                        ${parseFloat(habitacion.precio_base).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={`badge bg-${getEstadoBadge(habitacion.estado)} me-1`} style={{fontSize: '0.75rem'}}>
                          <span className="me-1">{getEstadoIcon(habitacion.estado)}</span>
                          {habitacion.estado}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-truncate" style={{maxWidth: '180px'}} title={habitacion.descripcion || "Sin descripción"}>
                        <small style={{color: '#2c3e50'}}>
                          {habitacion.descripcion || "Sin descripción"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1" style={{maxWidth: '130px'}}>
                        {(habitacion.comodidades || []).slice(0, 2).map(comodidadId => (
                          <span key={comodidadId} className="badge bg-light text-dark" style={{fontSize: '0.7rem'}} title={getComodidadLabel(comodidadId)}>
                            {getComodidadIcon(comodidadId)}
                          </span>
                        ))}
                        {(habitacion.comodidades || []).length > 2 && (
                          <span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>
                            +{(habitacion.comodidades || []).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center"
                          onClick={() => handleEditar(habitacion)}
                          title="Modificar habitación"
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger d-flex align-items-center ms-1"
                          onClick={() => handleEliminar(habitacion.numero_habitacion)}
                          title="Eliminar habitación"
                        >
                          <i className="bi bi-trash me-1"></i>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {habitaciones.length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-house-door display-1 text-muted"></i>
                <p className="text-muted mt-3">No hay habitaciones registradas</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    resetForm();
                    setEditing(null);
                    setShowForm(true);
                  }}
                >
                  Crear Primera Habitación
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Habitaciones;