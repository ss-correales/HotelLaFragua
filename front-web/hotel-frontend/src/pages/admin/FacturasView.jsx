import React, { useEffect, useState } from "react";
import { getFacturas, registrarPago } from "../../services/facturasApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/hotel-styles.css";

function FacturasView() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [facturaParaPago, setFacturaParaPago] = useState(null);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [pagoLoading, setPagoLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await getFacturas();
      setFacturas(data);
    } catch (error) {
      console.error("Error cargando facturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPago = (factura) => {
    setFacturaParaPago(factura);
    setMetodoPago("Efectivo");
  };

  const cerrarModalPago = () => {
    setFacturaParaPago(null);
  };

  const confirmarPago = async () => {
    if (!facturaParaPago) return;
    setPagoLoading(true);
    try {
      await registrarPago(facturaParaPago.id_factura, metodoPago, facturaParaPago.total);
      alert("Pago registrado. La factura quedó marcada como pagada.");
      await cargarDatos();
      cerrarModalPago();
    } catch (error) {
      alert("Error al registrar el pago: " + (error.response?.data?.detail || "Intenta nuevamente"));
    } finally {
      setPagoLoading(false);
    }
  };

  const facturasFiltradas = facturas.filter((factura) => {
    const coincideBusqueda =
      search === "" ||
      String(factura.id_factura).includes(search) ||
      String(factura.id_reserva).includes(search);
    const coincideEstado = filtroEstado === "todas" || factura.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const totalPendiente = facturas
    .filter((f) => f.estado === "pendiente")
    .reduce((acc, f) => acc + f.total, 0);

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
    <div className="container-fluid px-4 py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0 fw-bold text-dark">
                <i className="bi bi-receipt me-3"></i>
                Gestión de Facturas
              </h2>
              <p className="text-muted mb-0 mt-2">
                Facturas generadas por reservas y por daños en check-out. Mientras no exista pasarela de pago, márcalas como pagadas manualmente aquí.
              </p>
            </div>
            <div>
              <span className="badge" style={{ background: "#f56565", color: "white", fontSize: "0.9rem" }}>
                Pendiente por cobrar: ${totalPendiente.toLocaleString("es-CO")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
      <div className="col-12">
        <div className="card shadow-lg">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por # de factura o # de reserva..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todas">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="pagada">Pagadas</option>
                </select>
              </div>
              <div className="col-md-3 text-end">
                <small className="text-muted">
                  {facturasFiltradas.length} de {facturas.length} facturas
                </small>
              </div>
            </div>

            <div className="table-responsive mt-3">
              <table className="table table-sm">
                <thead className="table-light">
                  <tr>
                    <th>Factura</th>
                    <th>Reserva</th>
                    <th>Total</th>
                    <th>Fecha Emisión</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasFiltradas.map((factura) => (
                    <tr key={factura.id_factura}>
                      <td>#{factura.id_factura}</td>
                      <td>#{factura.id_reserva}</td>
                      <td>${factura.total.toLocaleString("es-CO")}</td>
                      <td>{factura.fecha_emision}</td>
                      <td>
                        <span
                          className="badge d-flex align-items-center"
                          style={{
                            background: factura.estado === "pagada" ? "#48bb78" : "#ed8936",
                            color: "white",
                            width: "fit-content",
                          }}
                        >
                          <i
                            className={`bi ${factura.estado === "pagada" ? "bi-check-circle" : "bi-clock-history"} me-1`}
                          ></i>
                          {factura.estado === "pagada" ? "Pagada" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        {factura.estado === "pendiente" ? (
                          <button
                            className="btn btn-sm btn-outline-success d-flex align-items-center"
                            onClick={() => abrirModalPago(factura)}
                          >
                            <i className="bi bi-cash-coin me-1"></i>
                            Registrar pago
                          </button>
                        ) : (
                          <small className="text-muted">
                            {factura.pagos && factura.pagos.length > 0
                              ? `Pagada vía ${factura.pagos[factura.pagos.length - 1].metodo_pago}`
                              : "Pagada"}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {facturas.length === 0 && (
                <div className="text-center py-4">
                  <i className="bi bi-receipt display-4 text-muted"></i>
                  <p className="text-muted mt-2">No hay facturas registradas todavía</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {facturaParaPago && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Registrar pago — Factura #{facturaParaPago.id_factura}</h5>
                <button type="button" className="btn-close" onClick={cerrarModalPago}></button>
              </div>
              <div className="modal-body">
                <p>
                  Reserva #{facturaParaPago.id_reserva} — Total a pagar:{" "}
                  <strong>${facturaParaPago.total.toLocaleString("es-CO")}</strong>
                </p>
                <label htmlFor="metodoPago" className="form-label">
                  Método de pago
                </label>
                <select
                  id="metodoPago"
                  className="form-select"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModalPago}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={confirmarPago}
                  disabled={pagoLoading}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  {pagoLoading ? "Registrando..." : "Confirmar pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacturasView;
