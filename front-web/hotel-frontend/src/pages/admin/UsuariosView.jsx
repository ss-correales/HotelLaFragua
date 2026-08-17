import React, { useState } from "react";
import UsuariosManagement from "./UsuariosManagement";
import ClientesView from "./ClientesView";
import EmpleadosView from "./EmpleadosView";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

function UsuariosView() {
  const [activeTab, setActiveTab] = useState("usuarios");

  return (
    <div className="py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 fw-bold text-dark">
                <i className="bi bi-people-fill me-3"></i>
                Gestión de Usuarios y Clientes
              </h2>
              <p className="text-muted mb-0 mt-2">
                Administra los usuarios del sistema y los clientes del hotel
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow-lg">
            <div className="card-body p-0">
              <div className="row">
                <div className="col-12">
                  <ul className="nav nav-tabs" id="managementTabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button 
                        className={`nav-link ${activeTab === "usuarios" ? "active" : ""}`}
                        onClick={() => setActiveTab("usuarios")}
                        style={{ 
                          color: activeTab === "usuarios" ? "#a67c52" : "#6c757d",
                          borderColor: activeTab === "usuarios" ? "#a67c52" : "transparent"
                        }}
                        type="button"
                        role="tab"
                      >
                        <i className="bi bi-person-badge me-2"></i>
                        Usuarios del Sistema
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === "clientes" ? "active" : ""}`}
                        onClick={() => setActiveTab("clientes")}
                        style={{
                          color: activeTab === "clientes" ? "#a67c52" : "#6c757d",
                          borderColor: activeTab === "clientes" ? "#a67c52" : "transparent"
                        }}
                        type="button"
                        role="tab"
                      >
                        <i className="bi bi-people me-2"></i>
                        Clientes del Hotel
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className={`nav-link ${activeTab === "empleados" ? "active" : ""}`}
                        onClick={() => setActiveTab("empleados")}
                        style={{
                          color: activeTab === "empleados" ? "#a67c52" : "#6c757d",
                          borderColor: activeTab === "empleados" ? "#a67c52" : "transparent"
                        }}
                        type="button"
                        role="tab"
                      >
                        <i className="bi bi-person-workspace me-2"></i>
                        Empleados del Hotel
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="tab-content p-4">
                {activeTab === "usuarios" && (
                  <div className="tab-pane fade show active">
                    <UsuariosManagement />
                  </div>
                )}

                {activeTab === "clientes" && (
                  <div className="tab-pane fade show active">
                    <ClientesView />
                  </div>
                )}

                {activeTab === "empleados" && (
                  <div className="tab-pane fade show active">
                    <EmpleadosView />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsuariosView;
