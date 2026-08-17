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
    correo: "",
    contraseña: "",
    roles: [],
    estado: true,
    numero_identificacion: "",
    nombre_usuario: "",
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
          correo: formDataUsuario.correo,
          roles: formDataUsuario.roles,
          estado: formDataUsuario.estado,
          numero_identificacion: formDataUsuario.numero_identificacion
        };
        
        // Agregar nombre_usuario solo para administradores
        if (formDataUsuario.roles.includes("Administrador")) {
          usuarioData.nombre_usuario = formDataUsuario.nombre_usuario;
        }
        
        // Agregar campos específicos según el rol
        if (formDataUsuario.roles.includes("Cliente")) {
          usuarioData.nombre_cliente = formDataUsuario.nombre_cliente;
          usuarioData.apellido_cliente = formDataUsuario.apellido_cliente;
          usuarioData.telefono_cliente = formDataUsuario.telefono_cliente;
          usuarioData.tipo_documento_cliente = formDataUsuario.tipo_documento_cliente;
          usuarioData.numero_documento_cliente = formDataUsuario.numero_documento_cliente;
        }

        if (formDataUsuario.contraseña) {
          usuarioData.contraseña = formDataUsuario.contraseña;
        }

        await actualizarUsuario(editingUsuario.id_usuario, usuarioData);
      } else {
        // Generar nombre de usuario automáticamente o usar el proporcionado
        let nombreUsuarioFinal = "";
        if (formDataUsuario.roles.includes("Administrador")) {
          // Para administradores, usar el nombre de usuario proporcionado
          nombreUsuarioFinal = formDataUsuario.nombre_usuario;
        } else if (formDataUsuario.roles.includes("Cliente")) {
          // Para clientes, generar automáticamente
          nombreUsuarioFinal = `${formDataUsuario.nombre_cliente.toLowerCase().replace(/\s/g, '')}.${formDataUsuario.apellido_cliente.toLowerCase().replace(/\s/g, '')}`;
        } else {
          // Para otros roles, generar con timestamp
          nombreUsuarioFinal = `user${Date.now()}`;
        }
        
        const usuarioData = {
          nombre_usuario: nombreUsuarioFinal,
          correo: formDataUsuario.correo,
          contraseña: formDataUsuario.contraseña,
          roles: formDataUsuario.roles,
          estado: formDataUsuario.estado,
          numero_identificacion: formDataUsuario.numero_identificacion
        };
        
        // Agregar campos específicos según el rol
        if (formDataUsuario.roles.includes("Cliente")) {
          usuarioData.nombre_cliente = formDataUsuario.nombre_cliente;
          usuarioData.apellido_cliente = formDataUsuario.apellido_cliente;
          usuarioData.telefono_cliente = formDataUsuario.telefono_cliente;
          usuarioData.tipo_documento_cliente = formDataUsuario.tipo_documento_cliente;
          usuarioData.numero_documento_cliente = formDataUsuario.numero_documento_cliente;
        }

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
      correo: usuario.correo,
      contraseña: "",
      roles: usuario.roles ? usuario.roles.map(rol => rol.nombre) : [],
      estado: usuario.estado,
      numero_identificacion: usuario.numero_identificacion || "",
      nombre_usuario: usuario.nombre_usuario || "",
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
      correo: "",
      contraseña: "",
      roles: [],
      estado: true,
      numero_identificacion: "",
      nombre_usuario: "",
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
                    <th>Número de Identificación</th>
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
                    <tr key={usuario.id_usuario} className={!usuario.estado ? "table-secondary" : ""}>
                      <td>{usuario.id_usuario}</td>
                      <td>
                        <strong>{usuario.nombre_usuario}</strong>
                      </td>
                      <td>{usuario.correo}</td>
                      <td>{usuario.numero_documento || '-'}</td>
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmitUsuario}>
                <div className="modal-body">
                  {/* Selección de Rol - Primera sección */}
                  <div className="text-center mb-5">
                    <h4 className="mb-4 fw-bold" style={{ color: "#a67c52" }}>
                      <i className="bi bi-person-badge me-2"></i>
                      Selecciona el Rol del Usuario
                    </h4>
                    <div className="row g-4 justify-content-center">
                      {roles.map(rol => {
                        const rolValue = typeof rol === 'string' ? rol : rol.nombre;
                        const isSelected = formDataUsuario.roles.includes(rolValue);
                        
                        // Definir colores según el rol (solo tonos de café del hotel)
                        const roleColors = {
                          'Administrador': { bg: '#8b6f47', border: '#8b6f47', text: '#8b6f47' },
                          'Empleado': { bg: '#a67c52', border: '#a67c52', text: '#a67c52' },
                          'Cliente': { bg: '#c4a57b', border: '#c4a57b', text: '#c4a57b' }
                        };
                        const colors = roleColors[rolValue] || { bg: '#6c757d', border: '#6c757d', text: '#6c757d' };
                        
                        return (
                          <div key={rolValue} className="col-md-4 col-sm-6">
                            <div 
                              className={`card h-100 border-3 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'shadow-lg' 
                                  : 'hover:shadow'
                              }`}
                              style={{ 
                                cursor: 'pointer',
                                borderColor: isSelected ? colors.border : '#dee2e6',
                                backgroundColor: isSelected ? 'white' : 'white',
                                borderRadius: '8px'
                              }}
                              onClick={() => {
                                setFormDataUsuario(prev => ({
                                  ...prev,
                                  roles: [rolValue]
                                }));
                              }}
                            >
                              <div className="card-body text-center p-4">
                                <div className={`rounded-circle mx-auto mb-3 p-3 ${
                                  isSelected ? '' : 'bg-light'
                                }`} style={{ 
                                  backgroundColor: isSelected ? colors.bg : '#f8f9fa'
                                }}>
                                  <i className={`bi ${
                                    rolValue === 'Administrador' ? 'bi-shield-check' :
                                    rolValue === 'Empleado' ? 'bi-briefcase' :
                                    'bi-person'
                                  } fs-1 ${isSelected ? 'text-white' : ''}`} style={{ 
                                    color: isSelected ? 'white' : colors.text 
                                  }}></i>
                                </div>
                                <h5 className={`card-title mb-3 fw-bold ${
                                  isSelected ? '' : ''
                                }`} style={{ 
                                  color: isSelected ? colors.text : '#6c757d'
                                }}>
                                  {rolValue}
                                </h5>
                                <p className="mb-0" style={{ 
                                  color: isSelected ? colors.text : '#6c757d',
                                  fontSize: '0.9rem'
                                }}>
                                  {rolValue === 'Administrador' ? 'Acceso total al sistema' :
                                   rolValue === 'Empleado' ? 'Personal del hotel' :
                                   'Huéspedes del hotel'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campos específicos según el rol seleccionado */}
                  {formDataUsuario.roles.length > 0 && (
                    <div className="border-top pt-4" style={{ borderColor: "#e9ecef" }}>
                      {/* Campos para Administrador */}
                      {formDataUsuario.roles.includes("Administrador") && (
                        <div className="mb-5 p-4 rounded" style={{ backgroundColor: "#f8f9ff" }}>
                          <div className="d-flex align-items-center mb-4">
                            <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "#8b6f47" }}>
                              <i className="bi bi-shield-check text-white fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-1 fw-bold" style={{ color: "#8b6f47" }}>
                                Datos del Administrador
                              </h5>
                              <small style={{ color: "#6c757d" }}>Configura el acceso del administrador</small>
                            </div>
                          </div>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#8b6f47" }}>
                                <i className="bi bi-person me-1"></i>
                                Nombre de Usuario <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-lg border-2"
                                name="nombre_usuario"
                                value={formDataUsuario.nombre_usuario}
                                onChange={handleInputChange}
                                required
                                placeholder="Ej: admin123"
                                style={{ borderColor: "#8b6f47" }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#8b6f47" }}>
                                <i className="bi bi-envelope me-1"></i>
                                Correo Electrónico <span className="text-danger">*</span>
                              </label>
                              <input
                                type="email"
                                className="form-control form-control-lg border-2"
                                name="correo"
                                value={formDataUsuario.correo}
                                onChange={handleInputChange}
                                required
                                placeholder="admin@ejemplo.com"
                                style={{ borderColor: "#8b6f47" }}
                              />
                            </div>
                          </div>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#8b6f47" }}>
                                <i className="bi bi-lock me-1"></i>
                                Contraseña
                              </label>
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
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#8b6f47" }}>
                                <i className="bi bi-toggle-on me-1"></i>
                                Estado
                              </label>
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
                        </div>
                      )}

                      {/* Campos para Cliente */}
                      {formDataUsuario.roles.includes("Cliente") && (
                        <div className="mb-5 p-4 rounded" style={{ backgroundColor: "#faf8f6" }}>
                          <div className="d-flex align-items-center mb-4">
                            <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "#c4a57b" }}>
                              <i className="bi bi-person-badge text-white fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-1 fw-bold" style={{ color: "#c4a57b" }}>
                                Datos del Cliente
                              </h5>
                              <small style={{ color: "#6c757d" }}>Información personal del huésped</small>
                            </div>
                          </div>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-person me-1"></i>
                                Nombre <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-lg border-2"
                                name="nombre_cliente"
                                value={formDataUsuario.nombre_cliente}
                                onChange={handleInputChange}
                                required
                                placeholder="Nombre completo"
                                style={{ borderColor: "#c4a57b" }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-person me-1"></i>
                                Apellido <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-lg border-2"
                                name="apellido_cliente"
                                value={formDataUsuario.apellido_cliente}
                                onChange={handleInputChange}
                                required
                                placeholder="Apellido completo"
                                style={{ borderColor: "#c4a57b" }}
                              />
                            </div>
                          </div>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-telephone me-1"></i>
                                Teléfono <span className="text-danger">*</span>
                              </label>
                              <input
                                type="tel"
                                className="form-control form-control-lg border-2"
                                name="telefono_cliente"
                                value={formDataUsuario.telefono_cliente}
                                onChange={handleInputChange}
                                required
                                placeholder="3001234567"
                                style={{ borderColor: "#c4a57b" }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-envelope me-1"></i>
                                Correo Electrónico <span className="text-danger">*</span>
                              </label>
                              <input
                                type="email"
                                className="form-control form-control-lg border-2"
                                name="correo"
                                value={formDataUsuario.correo}
                                onChange={handleInputChange}
                                required
                                placeholder="cliente@ejemplo.com"
                                style={{ borderColor: "#c4a57b" }}
                              />
                            </div>
                          </div>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-card-text me-1"></i>
                                Número de Documento <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control form-control-lg border-2"
                                name="numero_documento_cliente"
                                value={formDataUsuario.numero_documento_cliente}
                                onChange={handleInputChange}
                                required
                                placeholder="123456789"
                                style={{ borderColor: "#c4a57b" }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-lock me-1"></i>
                                Contraseña
                              </label>
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
                          <div className="row g-4">
                            <div className="col-12">
                              <label className="form-label fw-bold" style={{ color: "#c4a57b" }}>
                                <i className="bi bi-toggle-on me-1"></i>
                                Estado
                              </label>
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
                        </div>
                      )}

                      {/* Campos para Empleado */}
                      {formDataUsuario.roles.includes("Empleado") && (
                        <div className="mb-5 p-4 rounded" style={{ backgroundColor: "#faf8f6" }}>
                          <div className="d-flex align-items-center mb-4">
                            <div className="rounded-circle p-3 me-3" style={{ backgroundColor: "#a67c52" }}>
                              <i className="bi bi-briefcase text-white fs-4"></i>
                            </div>
                            <div>
                              <h5 className="mb-1 fw-bold" style={{ color: "#a67c52" }}>
                                Acceso del Empleado
                              </h5>
                              <small style={{ color: "#6c757d" }}>
                                Solo las credenciales de acceso al sistema. Los datos de personal (nombre, cargo, documento) se gestionan en la pestaña "Empleados del Hotel".
                              </small>
                            </div>
                          </div>
                          <div className="row g-4">
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                                <i className="bi bi-envelope me-1"></i>
                                Correo Electrónico <span className="text-danger">*</span>
                              </label>
                              <input
                                type="email"
                                className="form-control form-control-lg border-2"
                                name="correo"
                                value={formDataUsuario.correo}
                                onChange={handleInputChange}
                                required
                                placeholder="empleado@ejemplo.com"
                                style={{ borderColor: "#a67c52" }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                                <i className="bi bi-lock me-1"></i>
                                Contraseña
                              </label>
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
                          <div className="row g-4">
                            <div className="col-12">
                              <label className="form-label fw-bold" style={{ color: "#a67c52" }}>
                                <i className="bi bi-toggle-on me-1"></i>
                                Estado
                              </label>
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
                        </div>
                      )}
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
