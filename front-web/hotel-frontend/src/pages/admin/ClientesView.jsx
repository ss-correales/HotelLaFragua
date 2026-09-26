import React, { useEffect, useState } from "react";
import { 
  getClientes, 
  crearCliente, 
  actualizarCliente, 
  eliminarCliente 
} from "../../services/clientesApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [formDataCliente, setFormDataCliente] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    tipo_documento: "CC",
    numero_documento: ""
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await getClientes();
      console.log("=== CLIENTES DATA ANALYSIS ===");
      console.log("Total clientes:", data.length);
      if (data.length > 0) {
        console.log("First cliente fields:", Object.keys(data[0]));
        console.log("First cliente complete:", data[0]);
        console.log("All fields with values:");
        Object.keys(data[0]).forEach(key => {
          console.log(`  ${key}:`, data[0][key]);
        });
      }
      console.log("=== END CLIENTES ANALYSIS ===");
      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChangeCliente = (e) => {
    const { name, value } = e.target;
    setFormDataCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitCliente = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await actualizarCliente(editingCliente.id_cliente, formDataCliente);
        alert("Cliente actualizado exitosamente");
      } else {
        await crearCliente(formDataCliente);
        alert("Cliente creado exitosamente");
      }
      await cargarDatos();
      resetForm();
      setShowModalCliente(false);
    } catch (error) {
      console.error("Error guardando cliente:", error);
      alert("Error al guardar el cliente: " + (error.response?.data?.message || "Intenta nuevamente"));
    }
  };

  const handleEditCliente = (cliente) => {
    setEditingCliente(cliente);
    setFormDataCliente({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      correo: cliente.correo,
      tipo_documento: cliente.tipo_documento,
      numero_documento: cliente.numero_documento
    });
    setShowModalCliente(true);
  };

  const handleDeleteCliente = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas desactivar este cliente?")) {
      try {
        await actualizarCliente(id, { estado: false });
        await cargarDatos();
        alert("Cliente desactivado correctamente");
      } catch (error) {
        console.error("Error desactivando cliente:", error);
        alert("Error al desactivar el cliente");
      }
    }
  };

  const handleReactivarCliente = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas reactivar este cliente?")) {
      try {
        await actualizarCliente(id, { estado: true });
        await cargarDatos();
        alert("Cliente reactivado correctamente");
      } catch (error) {
        console.error("Error reactivando cliente:", error);
        alert("Error al reactivar el cliente");
      }
    }
  };

  const resetForm = () => {
    setFormDataCliente({
      nombre: "",
      apellido: "",
      telefono: "",
      correo: "",
      tipo_documento: "CC",
      numero_documento: ""
    });
    setEditingCliente(null);
  };

  const closeModal = () => {
    setShowModalCliente(false);
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
            <h5 className="card-title mb-0">Gestión de Clientes del Hotel</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h6 className="text-muted mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Aquí puedes gestionar los clientes del hotel con su información personal y de contacto.
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
                    setEditingCliente(null);
                    resetForm();
                    setShowModalCliente(true);
                  }}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Nuevo Cliente
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
                    placeholder="Buscar por nombre, apellido, correo o documento..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <small className="text-muted">
                  {clientes.filter(cliente => 
                    searchCliente === "" || 
                    cliente.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
                    cliente.apellido.toLowerCase().includes(searchCliente.toLowerCase()) ||
                    cliente.correo.toLowerCase().includes(searchCliente.toLowerCase()) ||
                    cliente.numero_documento.toLowerCase().includes(searchCliente.toLowerCase())
                  ).length} de {clientes.length} clientes
                </small>
              </div>
            </div>

            <div className="table-responsive mt-3">
              <table className="table table-sm">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.filter(cliente => 
                    searchCliente === "" || 
                    cliente.nombre.toLowerCase().includes(searchCliente.toLowerCase()) ||
                    cliente.apellido.toLowerCase().includes(searchCliente.toLowerCase()) ||
                    cliente.correo.toLowerCase().includes(searchCliente.toLowerCase()) ||
                    cliente.numero_documento.toLowerCase().includes(searchCliente.toLowerCase())
                  ).map((cliente) => (
                    <tr key={cliente.id_cliente}>
                      <td>{cliente.id_cliente}</td>
                      <td>
                        <strong>{cliente.nombre} {cliente.apellido}</strong>
                      </td>
                      <td>
                        <small className="text-muted">
                          {cliente.tipo_documento} {cliente.numero_documento}
                        </small>
                      </td>
                      <td>{cliente.telefono}</td>
                      <td>{cliente.correo}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className={`badge me-2 d-flex align-items-center`} style={{
                            background: (cliente.estado !== false && cliente.estado !== 0) ? "#48bb78" : "#f56565",
                            color: "white"
                          }}>
                            <i className={`bi ${(cliente.estado !== false && cliente.estado !== 0) ? "bi-check-circle" : "bi-x-circle"} me-1`}></i>
                            {(cliente.estado !== false && cliente.estado !== 0) ? "Activo" : "Inactivo"}
                          </span>
                          {(cliente.estado === false || cliente.estado === 0) && (
                            <small className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              No puede hacer reservas
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">
                          {cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            onClick={() => handleEditCliente(cliente)}
                            title="Modificar cliente"
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Editar
                          </button>
                          {(cliente.estado !== false && cliente.estado !== 0) ? (
                            <button
                              className="btn btn-sm btn-outline-warning d-flex align-items-center ms-1"
                              onClick={() => handleDeleteCliente(cliente.id_cliente)}
                              title="Desactivar cliente"
                            >
                              <i className="bi bi-pause-circle me-1"></i>
                              Desactivar
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-success d-flex align-items-center ms-1"
                              onClick={() => handleReactivarCliente(cliente.id_cliente)}
                              title="Reactivar cliente"
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
              
              {clientes.length === 0 && (
                <div className="text-center py-4">
                  <i className="bi bi-people display-4 text-muted"></i>
                  <p className="text-muted mt-2">No hay clientes registrados</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingCliente(null);
                      resetForm();
                      setShowModalCliente(true);
                    }}
                  >
                    Crear Primer Cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar clientes */}
      {showModalCliente && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <form onSubmit={handleSubmitCliente}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nombre" className="form-label">
                        Nombre <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="nombre"
                        name="nombre"
                        placeholder="Nombre del cliente"
                        value={formDataCliente.nombre}
                        onChange={handleInputChangeCliente}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="apellido" className="form-label">
                        Apellido <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="apellido"
                        name="apellido"
                        placeholder="Apellido del cliente"
                        value={formDataCliente.apellido}
                        onChange={handleInputChangeCliente}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="telefono" className="form-label">
                        Teléfono <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="telefono"
                        name="telefono"
                        placeholder="Número de teléfono"
                        value={formDataCliente.telefono}
                        onChange={handleInputChangeCliente}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="correo" className="form-label">
                        Correo Electrónico <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="correo"
                        name="correo"
                        placeholder="correo@ejemplo.com"
                        value={formDataCliente.correo}
                        onChange={handleInputChangeCliente}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="tipo_documento" className="form-label">
                        Tipo de Documento <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="tipo_documento"
                        name="tipo_documento"
                        value={formDataCliente.tipo_documento}
                        onChange={handleInputChangeCliente}
                        required
                      >
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="numero_documento" className="form-label">
                        Número de Documento <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="numero_documento"
                        name="numero_documento"
                        placeholder="Número de documento"
                        value={formDataCliente.numero_documento}
                        onChange={handleInputChangeCliente}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{background: "#a67c52", borderColor: "#a67c52"}}>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingCliente ? "Actualizar" : "Crear"} Cliente
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

export default ClientesView;
