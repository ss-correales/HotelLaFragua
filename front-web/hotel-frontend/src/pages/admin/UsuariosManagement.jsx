import React, { useEffect, useState } from "react";
import { 
  getUsuarios, 
  getRoles, 
  crearUsuario, 
  actualizarUsuario
} from "../../services/usuariosApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

function UsuariosManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [searchUsuario, setSearchUsuario] = useState("");
  const [formDataUsuario, setFormDataUsuario] = useState({
    nombre_usuario: "",
    correo: "",
    numero_documento: "",
    contraseña: "",
    roles: [],
    estado: true,
    // Campos adicionales para clientes
    nombre_cliente: "",
    apellido_cliente: "",
    telefono_cliente: "",
    tipo_documento_cliente: "CC",
    numero_documento_cliente: ""
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [usuariosData, rolesData] = await Promise.all([
        getUsuarios(),
        getRoles(),
      ]);
      setUsuarios(usuariosData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "radio" && name === "rol") {
      setFormDataUsuario(prev => ({
        ...prev,
        roles: checked ? [value] : []
      }));
    } else if (type === "checkbox") {
      setFormDataUsuario(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormDataUsuario(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    try {
      if (editingUsuario) {
        const usuarioData = {
          nombre_usuario: formDataUsuario.nombre_usuario,
          correo: formDataUsuario.correo,
          numero_documento: Number(formDataUsuario.numero_documento),
          roles: formDataUsuario.roles,
          estado: formDataUsuario.estado
        };
        
        if (formDataUsuario.contraseña) {
          usuarioData.contraseña = formDataUsuario.contraseña;
        }
        
        await actualizarUsuario(editingUsuario.id_usuario, usuarioData);
      } else {
        const usuarioData = {
          nombre_usuario: formDataUsuario.nombre_usuario,
          correo: formDataUsuario.correo,
          numero_documento: Number(formDataUsuario.numero_documento),
          contraseña: formDataUsuario.contraseña,
          roles: formDataUsuario.roles,
          estado: formDataUsuario.estado
        };
        
        await crearUsuario(usuarioData);
      }
      
      await cargarDatos();
      resetForm();
      setShowModalUsuario(false);
      alert(editingUsuario ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente");
    } catch (error) {
      console.error("Error guardando usuario:", error);
      alert("Error al guardar el usuario: " + (error.response?.data?.message || "Intenta nuevamente"));
    }
  };

  const handleEditUsuario = (usuario) => {
    console.log("Editando usuario:", usuario);
    setEditingUsuario(usuario);
    setFormDataUsuario({
      nombre_usuario: usuario.nombre_usuario,
      correo: usuario.correo,
      numero_documento: usuario.numero_documento || "",
      contraseña: "",
      roles: usuario.roles ? usuario.roles.map(rol => rol.nombre) : [],
      estado: usuario.estado,
      // Campos adicionales para clientes (si existen)
      nombre_cliente: usuario.nombre_cliente || "",
      apellido_cliente: usuario.apellido_cliente || "",
      telefono_cliente: usuario.telefono_cliente || "",
      tipo_documento_cliente: usuario.tipo_documento_cliente || "CC",
      numero_documento_cliente: usuario.numero_documento_cliente || ""
    });
    setShowModalUsuario(true);
  };

  const handleDeleteUsuario = async (id) => {
    console.log("Desactivando usuario ID:", id);
    if (window.confirm("¿Estás seguro de que deseas desactivar este usuario?")) {
      try {
        console.log("Enviando petición para desactivar usuario:", id);
        await actualizarUsuario(id, { estado: false });
        await cargarDatos();
        alert("Usuario desactivado correctamente");
      } catch (error) {
        console.error("Error desactivando usuario:", error);
        alert("Error al desactivar el usuario: " + (error.response?.data?.message || "Intenta nuevamente"));
      }
    }
  };

  const handleReactivarUsuario = async (id) => {
    console.log("Reactivando usuario ID:", id);
    if (window.confirm("¿Estás seguro de que deseas reactivar este usuario?")) {
      try {
        console.log("Enviando petición para reactivar usuario:", id);
        await actualizarUsuario(id, { estado: true });
        await cargarDatos();
        alert("Usuario reactivado correctamente");
      } catch (error) {
        console.error("Error reactivando usuario:", error);
        alert("Error al reactivar el usuario: " + (error.response?.data?.message || "Intenta nuevamente"));
      }
    }
  };

  const resetForm = () => {
    setFormDataUsuario({
      nombre_usuario: "",
      correo: "",
      numero_documento: "",
      contraseña: "",
      roles: [],
      estado: true,
      // Campos adicionales para clientes
      nombre_cliente: "",
      apellido_cliente: "",
      telefono_cliente: "",
      tipo_documento_cliente: "CC",
      numero_documento_cliente: ""
    });
    setEditingUsuario(null);
  };

  const closeModal = () => {
    setShowModalUsuario(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="card shadow-lg">
          <div className="card-header">
            <h5 className="card-title mb-0">Gestión de Usuarios del Sistema</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h6 className="text-muted mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Aquí puedes gestionar los usuarios del sistema con diferentes roles y permisos.
                </h6>
              </div>
              <div className="col-md-4 text-end">
                <button 
                  className="btn"
                  style={{ 
                    background: "#a67c52", 
                    borderColor: "#a67c52", 
                    color: "white" 
                  }}
                  onClick={() => {
                    setEditingUsuario(null);
                    resetForm();
                    setShowModalUsuario(true);
                  }}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Nuevo Usuario
                </button>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre, correo o rol..."
                    value={searchUsuario}
                    onChange={(e) => setSearchUsuario(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <small className="text-muted">
                  {usuarios.filter(usuario => 
                    searchUsuario === "" || 
                    usuario.nombre_usuario.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                    usuario.correo.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                    usuario.roles.some(rol => rol.nombre.toLowerCase().includes(searchUsuario.toLowerCase()))
                  ).length} de {usuarios.length} usuarios
                </small>
              </div>
            </div>

            <div className="table-responsive mt-3">
              <table className="table table-sm">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre de Usuario</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Roles</th>
                    <th>Fecha de Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.filter(usuario => 
                    searchUsuario === "" || 
                    usuario.nombre_usuario.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                    usuario.correo.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                    usuario.roles.some(rol => rol.nombre.toLowerCase().includes(searchUsuario.toLowerCase()))
                  ).map((usuario) => (
                    <tr key={usuario.id_usuario}>
                      <td>{usuario.id_usuario}</td>
                      <td>
                        <strong>{usuario.nombre_usuario}</strong>
                      </td>
                      <td>{usuario.correo}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className={`badge me-2 d-flex align-items-center`} style={{
                            background: usuario.estado ? "#48bb78" : "#f56565",
                            color: "white"
                          }}>
                            <i className={`bi ${usuario.estado ? "bi-check-circle" : "bi-x-circle"} me-1`}></i>
                            {usuario.estado ? "Activo" : "Inactivo"}
                          </span>
                          {!usuario.estado && (
                            <small className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              No puede acceder al sistema
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        {usuario.roles.map((rol, index) => (
                          <span key={index} className="badge bg-secondary me-1">
                            {rol.nombre}
                          </span>
                        ))}
                      </td>
                      <td>
                        {new Date(usuario.fecha_creacion).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            onClick={() => {
                              console.log("¡Botón Editar clickeado!");
                              handleEditUsuario(usuario);
                            }}
                            title="Modificar usuario"
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Editar
                          </button>
                          {usuario.estado ? (
                            <button
                              className="btn btn-sm btn-outline-warning d-flex align-items-center ms-1"
                              onClick={() => {
                                console.log("¡Botón Desactivar clickeado!");
                                handleDeleteUsuario(usuario.id_usuario);
                              }}
                              title="Desactivar usuario"
                            >
                              <i className="bi bi-pause-circle me-1"></i>
                              Desactivar
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-success d-flex align-items-center ms-1"
                              onClick={() => handleReactivarUsuario(usuario.id_usuario)}
                              title="Reactivar usuario"
                            >
                              <i className="bi bi-play-circle me-1"></i>
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {usuarios.length === 0 && (
                <div className="text-center py-4">
                  <i className="bi bi-people display-4 text-muted"></i>
                  <p className="text-muted mt-2">No hay usuarios registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModalUsuario && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmitUsuario}>
                <div className="modal-body">
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Nombre de Usuario</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="nombre_usuario"
                        value={formDataUsuario.nombre_usuario}
                        onChange={handleInputChange}
                        required
                        disabled={editingUsuario}
                        placeholder="Ej: admin123"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Correo Electrónico</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        name="correo"
                        value={formDataUsuario.correo}
                        onChange={handleInputChange}
                        required
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Número de Documento</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        name="numero_documento"
                        value={formDataUsuario.numero_documento}
                        onChange={handleInputChange}
                        required
                        min="1"
                        placeholder="123456789"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Contraseña</label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        name="contraseña"
                        value={formDataUsuario.contraseña}
                        onChange={handleInputChange}
                        required={!editingUsuario}
                        placeholder={editingUsuario ? "Dejar en blanco para mantener" : "Mínimo 6 caracteres"}
                      />
                    </div>
                  </div>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-primary">Estado</label>
                      <select
                        className="form-select form-select-lg"
                        name="estado"
                        value={formDataUsuario.estado}
                        onChange={handleInputChange}
                      >
                        <option value={true}>Activo</option>
                        <option value={false}>Inactivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="form-label fw-bold text-primary">Rol del Usuario</label>
                    <div className="d-flex gap-4 p-4 bg-light rounded">
                      {roles.map(rol => {
                        const rolValue = typeof rol === 'string' ? rol : rol.nombre;
                        return (
                          <div key={rolValue} className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="rol"
                              id={`rol-${rolValue}`}
                              value={rolValue}
                              checked={formDataUsuario.roles.includes(rolValue)}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label fw-semibold" htmlFor={`rol-${rolValue}`}>
                              {rolValue}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campos adicionales para clientes */}
                  {formDataUsuario.roles.includes("Cliente") && (
                    <div className="border border-2 rounded p-5 mb-4" style={{ borderColor: "#a67c52", backgroundColor: "#faf8f6" }}>
                      <div className="d-flex align-items-center mb-5">
                        <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "#a67c52" }}>
                          <i className="bi bi-person-badge text-white fs-5"></i>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-bold" style={{ color: "#a67c52" }}>
                            Información del Cliente
                          </h6>
                          <small className="text-muted">* Campos obligatorios</small>
                        </div>
                      </div>
                      <div className="row g-4 mb-4">
                        <div className="col-md-6">
                          <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                            Nombre <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            name="nombre_cliente"
                            value={formDataUsuario.nombre_cliente}
                            onChange={handleInputChange}
                            placeholder="Nombre completo"
                            required={formDataUsuario.roles.includes("Cliente")}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                            Apellido <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            name="apellido_cliente"
                            value={formDataUsuario.apellido_cliente}
                            onChange={handleInputChange}
                            placeholder="Apellido completo"
                            required={formDataUsuario.roles.includes("Cliente")}
                          />
                        </div>
                      </div>
                      <div className="row g-4 mb-4">
                        <div className="col-md-6">
                          <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                            Teléfono <span className="text-danger">*</span>
                          </label>
                          <input
                            type="tel"
                            className="form-control form-control-lg"
                            name="telefono_cliente"
                            value={formDataUsuario.telefono_cliente}
                            onChange={handleInputChange}
                            placeholder="3001234567"
                            required={formDataUsuario.roles.includes("Cliente")}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                            Tipo de Documento <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select form-select-lg"
                            name="tipo_documento_cliente"
                            value={formDataUsuario.tipo_documento_cliente}
                            onChange={handleInputChange}
                            required={formDataUsuario.roles.includes("Cliente")}
                          >
                            <option value="CC">Cédula de Ciudadanía</option>
                            <option value="CE">Cédula de Extranjería</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                        </div>
                      </div>
                      <div className="row g-4">
                        <div className="col-12">
                          <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                            Número de Documento <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            name="numero_documento_cliente"
                            value={formDataUsuario.numero_documento_cliente}
                            onChange={handleInputChange}
                            placeholder="123456789"
                            required={formDataUsuario.roles.includes("Cliente")}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn" style={{background: "#a67c52", borderColor: "#a67c52", color: "white"}}>
                    {editingUsuario ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosManagement;
