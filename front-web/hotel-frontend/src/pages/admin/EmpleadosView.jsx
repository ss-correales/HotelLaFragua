import React, { useEffect, useState } from "react";
import {
  getEmpleados,
  crearEmpleado,
  actualizarEmpleado
} from "../../services/empleadosApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

const FORM_INICIAL = {
  nombre: "",
  apellido: "",
  documento: "",
  cargo: "",
  email: "",
  telefono: "",
  estado: "activo"
};

function EmpleadosView() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(FORM_INICIAL);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (error) {
      console.error("Error cargando empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmpleado) {
        await actualizarEmpleado(editingEmpleado.id_empleado, formData);
        alert("Empleado actualizado exitosamente");
      } else {
        await crearEmpleado(formData);
        alert("Empleado creado exitosamente");
      }
      await cargarDatos();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("Error guardando empleado:", error);
      alert("Error al guardar el empleado: " + (error.response?.data?.detail || "Intenta nuevamente"));
    }
  };

  const handleEdit = (empleado) => {
    setEditingEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      documento: empleado.documento,
      cargo: empleado.cargo,
      email: empleado.email,
      telefono: empleado.telefono,
      estado: empleado.estado
    });
    setShowModal(true);
  };

  const handleDesactivar = async (empleado) => {
    if (window.confirm("¿Estás seguro de que deseas desactivar este empleado?")) {
      try {
        await actualizarEmpleado(empleado.id_empleado, { ...empleado, estado: "inactivo" });
        await cargarDatos();
        alert("Empleado desactivado correctamente");
      } catch (error) {
        console.error("Error desactivando empleado:", error);
        alert("Error al desactivar el empleado");
      }
    }
  };

  const handleReactivar = async (empleado) => {
    if (window.confirm("¿Estás seguro de que deseas reactivar este empleado?")) {
      try {
        await actualizarEmpleado(empleado.id_empleado, { ...empleado, estado: "activo" });
        await cargarDatos();
        alert("Empleado reactivado correctamente");
      } catch (error) {
        console.error("Error reactivando empleado:", error);
        alert("Error al reactivar el empleado");
      }
    }
  };

  const resetForm = () => {
    setFormData(FORM_INICIAL);
    setEditingEmpleado(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const empleadosFiltrados = empleados.filter(empleado =>
    search === "" ||
    empleado.nombre.toLowerCase().includes(search.toLowerCase()) ||
    empleado.apellido.toLowerCase().includes(search.toLowerCase()) ||
    empleado.email.toLowerCase().includes(search.toLowerCase()) ||
    empleado.documento.toLowerCase().includes(search.toLowerCase()) ||
    empleado.cargo.toLowerCase().includes(search.toLowerCase())
  );

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
            <h5 className="card-title mb-0">Gestión de Empleados del Hotel</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <h6 className="text-muted mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Aquí puedes gestionar el personal del hotel con su cargo e información de contacto.
                </h6>
              </div>
              <div className="col-md-4 text-end">
                <button
                  className="btn"
                  style={{ background: "#a67c52", borderColor: "#a67c52", color: "white" }}
                  onClick={() => {
                    setEditingEmpleado(null);
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Nuevo Empleado
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
                    placeholder="Buscar por nombre, apellido, cargo, correo o documento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-end">
                <small className="text-muted">
                  {empleadosFiltrados.length} de {empleados.length} empleados
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
                    <th>Cargo</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosFiltrados.map((empleado) => (
                    <tr key={empleado.id_empleado}>
                      <td>{empleado.id_empleado}</td>
                      <td><strong>{empleado.nombre} {empleado.apellido}</strong></td>
                      <td><small className="text-muted">{empleado.documento}</small></td>
                      <td>{empleado.cargo}</td>
                      <td>{empleado.telefono}</td>
                      <td>{empleado.email}</td>
                      <td>
                        <span className="badge d-flex align-items-center" style={{
                          background: empleado.estado === "activo" ? "#48bb78" : "#f56565",
                          color: "white",
                          width: "fit-content"
                        }}>
                          <i className={`bi ${empleado.estado === "activo" ? "bi-check-circle" : "bi-x-circle"} me-1`}></i>
                          {empleado.estado === "activo" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            onClick={() => handleEdit(empleado)}
                            title="Modificar empleado"
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Editar
                          </button>
                          {empleado.estado === "activo" ? (
                            <button
                              className="btn btn-sm btn-outline-warning d-flex align-items-center ms-1"
                              onClick={() => handleDesactivar(empleado)}
                              title="Desactivar empleado"
                            >
                              <i className="bi bi-pause-circle me-1"></i>
                              Desactivar
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-success d-flex align-items-center ms-1"
                              onClick={() => handleReactivar(empleado)}
                              title="Reactivar empleado"
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

              {empleados.length === 0 && (
                <div className="text-center py-4">
                  <i className="bi bi-people display-4 text-muted"></i>
                  <p className="text-muted mt-2">No hay empleados registrados</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingEmpleado(null);
                      resetForm();
                      setShowModal(true);
                    }}
                  >
                    Crear Primer Empleado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingEmpleado ? "Editar Empleado" : "Nuevo Empleado"}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
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
                        placeholder="Nombre del empleado"
                        value={formData.nombre}
                        onChange={handleInputChange}
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
                        placeholder="Apellido del empleado"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="documento" className="form-label">
                        Documento <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="documento"
                        name="documento"
                        placeholder="Número de documento"
                        value={formData.documento}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="cargo" className="form-label">
                        Cargo <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="cargo"
                        name="cargo"
                        placeholder="Ej: Recepcionista, Ama de llaves..."
                        value={formData.cargo}
                        onChange={handleInputChange}
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
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Correo Electrónico <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: "#a67c52", borderColor: "#a67c52" }}>
                    <i className="bi bi-check-circle me-2"></i>
                    {editingEmpleado ? "Actualizar" : "Crear"} Empleado
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

export default EmpleadosView;
