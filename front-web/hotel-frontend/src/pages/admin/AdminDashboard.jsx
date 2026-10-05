import { useEffect, useMemo, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getReservas } from "../../services/reservasApi";
import { getHabitaciones } from "../../services/habitacionesApi";
import { getFacturas } from "../../services/facturasApi";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TINTA = "#2d2420";
const MUTED = "#8a7d72";
const GRID = "#ece4db";
const MARRON = "#6b3f2b";
const ORO = "#b8863f";
const SALVIA = "#6f8c5f";
const TERRACOTA = "#b5543a";

ChartJS.defaults.font.family = "'Lexend', system-ui, sans-serif";
ChartJS.defaults.color = MUTED;

const TIPOS_HABITACION = ["Individual", "Doble", "Familiar", "Suite"];
const ESTADO_COLOR = { Pendiente: ORO, Confirmada: SALVIA, Cancelada: TERRACOTA, Finalizada: MUTED };
const CANAL_COLOR = { Online: MARRON, Presencial: ORO };

const formatoMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor || 0);

const formatoCompacto = (valor) =>
  new Intl.NumberFormat("es-CO", { notation: "compact", style: "currency", currency: "COP" }).format(valor || 0);

const nombreMes = (fechaISO) => {
  const [anio, mes] = fechaISO.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  const etiqueta = fecha.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
};

const opcionesEjeLimpio = {
  grid: { display: false },
  ticks: { color: MUTED, font: { size: 12 } },
};

function TarjetaKpi({ icono, titulo, valor, detalle, acento }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${acento}` }}>
        <div className="card-body d-flex align-items-start gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 40, height: 40, background: `${acento}1a`, color: acento }}
          >
            <i className={`bi ${icono} fs-5`}></i>
          </div>
          <div className="overflow-hidden">
            <p className="text-uppercase small fw-semibold mb-1" style={{ color: MUTED, letterSpacing: "0.04em", fontSize: "0.7rem" }}>
              {titulo}
            </p>
            <p className="fs-4 fw-bold mb-0 text-truncate" style={{ color: TINTA }}>{valor}</p>
            {detalle && <p className="small mb-0" style={{ color: MUTED }}>{detalle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TarjetaGrafica({ icono, titulo, subtitulo, children, vacio }) {
  return (
    <div className="col-lg-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className={`bi ${icono}`} style={{ color: MARRON }}></i>
            <h6 className="fw-semibold mb-0" style={{ color: TINTA }}>{titulo}</h6>
          </div>
          {subtitulo && <p className="small mb-3" style={{ color: MUTED }}>{subtitulo}</p>}
          {vacio ? (
            <p className="small text-center py-5" style={{ color: MUTED }}>{vacio}</p>
          ) : (
            <div style={{ height: 240 }}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [reservas, setReservas] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [reservasData, habitacionesData, facturasData] = await Promise.all([
          getReservas(),
          getHabitaciones(),
          getFacturas(),
        ]);
        setReservas(reservasData || []);
        setHabitaciones(habitacionesData || []);
        setFacturas(facturasData || []);
      } catch (err) {
        console.error("Error cargando datos del dashboard:", err);
        setError("No se pudieron cargar los datos del panel. Verifica tu sesión e inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const metricas = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);

    const reservasActivas = reservas.filter((r) => ["Pendiente", "Confirmada"].includes(r.estado));
    const alojadosHoy = reservas.filter(
      (r) => r.estado === "Confirmada" && r.fecha_inicio <= hoy && r.fecha_fin >= hoy
    ).length;

    const totalesPorTipo = TIPOS_HABITACION.map((tipo) => habitaciones.filter((h) => h.tipo_habitacion === tipo).length);
    const ocupadasPorTipo = TIPOS_HABITACION.map(
      (tipo) => reservasActivas.filter((r) => r.tipo_habitacion === tipo).length
    );

    const porCanal = { Online: 0, Presencial: 0 };
    reservas.forEach((r) => {
      if (r.canal && porCanal[r.canal] !== undefined) porCanal[r.canal] += 1;
    });

    const porEstado = { Pendiente: 0, Confirmada: 0, Cancelada: 0, Finalizada: 0 };
    reservas.forEach((r) => {
      if (porEstado[r.estado] !== undefined) porEstado[r.estado] += 1;
    });
    const estadosOrdenados = Object.entries(porEstado).sort((a, b) => b[1] - a[1]);

    const facturasPagadas = facturas.filter((f) => f.estado === "pagada");
    const ingresosTotales = facturasPagadas.reduce((acc, f) => acc + Number(f.total || 0), 0);

    const ingresosPorMes = {};
    facturasPagadas.forEach((f) => {
      if (!f.fecha_emision) return;
      const clave = f.fecha_emision.slice(0, 7);
      ingresosPorMes[clave] = (ingresosPorMes[clave] || 0) + Number(f.total || 0);
    });
    const mesesOrdenados = Object.keys(ingresosPorMes).sort();

    return {
      totalHabitaciones: habitaciones.length,
      totalesPorTipo,
      ocupadasPorTipo,
      alojadosHoy,
      porCanal,
      estadosOrdenados,
      ingresosTotales,
      ingresosPendientes: facturas
        .filter((f) => f.estado === "pendiente")
        .reduce((acc, f) => acc + Number(f.total || 0), 0),
      mesesOrdenados,
      ingresosPorMes,
      totalReservas: reservas.length,
    };
  }, [reservas, habitaciones, facturas]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <div className="spinner-border" style={{ color: MARRON }} role="status" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  const ocupacionPct = metricas.totalHabitaciones
    ? Math.round((metricas.alojadosHoy / metricas.totalHabitaciones) * 100)
    : 0;

  return (
    <div className="container-fluid p-4" style={{ background: "#faf8f5", minHeight: "100%" }}>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ color: TINTA, fontFamily: "'Lexend', sans-serif" }}>
          Panel de administrador
        </h1>
        <p className="mb-0" style={{ color: MUTED }}>Resumen general de Hotel La Fragua</p>
      </div>

      <div className="row g-3 mb-4">
        <TarjetaKpi icono="bi-journal-check" titulo="Reservas totales" valor={metricas.totalReservas} acento={MARRON} />
        <TarjetaKpi
          icono="bi-building"
          titulo="Ocupación hoy"
          valor={`${ocupacionPct}%`}
          detalle={`${metricas.alojadosHoy} de ${metricas.totalHabitaciones} habitaciones`}
          acento={ORO}
        />
        <TarjetaKpi icono="bi-cash-stack" titulo="Ingresos confirmados" valor={formatoMoneda(metricas.ingresosTotales)} acento={SALVIA} />
        <TarjetaKpi icono="bi-hourglass-split" titulo="Por cobrar" valor={formatoMoneda(metricas.ingresosPendientes)} acento={TERRACOTA} />
      </div>

      <div className="row g-3">
        <TarjetaGrafica
          icono="bi-bar-chart-line"
          titulo="Ocupación por tipo de habitación"
          subtitulo="Reservas activas frente al inventario total"
          vacio={metricas.totalHabitaciones === 0 ? "Sin habitaciones registradas." : null}
        >
          <Bar
            data={{
              labels: TIPOS_HABITACION,
              datasets: [
                { label: "Reservadas", data: metricas.ocupadasPorTipo, backgroundColor: MARRON, borderRadius: 6, maxBarThickness: 28 },
                { label: "Disponibles", data: metricas.totalesPorTipo.map((t, i) => Math.max(t - metricas.ocupadasPorTipo[i], 0)), backgroundColor: GRID, borderRadius: 6, maxBarThickness: 28 },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: true, ...opcionesEjeLimpio },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0, color: MUTED }, grid: { color: GRID } },
              },
              plugins: { legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, color: MUTED } } },
            }}
          />
        </TarjetaGrafica>

        <TarjetaGrafica
          icono="bi-graph-up-arrow"
          titulo="Ingresos por mes"
          subtitulo="Solo facturas pagadas"
          vacio={metricas.mesesOrdenados.length === 0 ? "Todavía no hay facturas pagadas." : null}
        >
          <Bar
            data={{
              labels: metricas.mesesOrdenados.map(nombreMes),
              datasets: [
                {
                  label: "Ingresos",
                  data: metricas.mesesOrdenados.map((m) => metricas.ingresosPorMes[m]),
                  backgroundColor: MARRON,
                  borderRadius: 6,
                  maxBarThickness: 36,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => formatoMoneda(ctx.parsed.y) } },
              },
              scales: {
                x: opcionesEjeLimpio,
                y: { beginAtZero: true, ticks: { color: MUTED, callback: (v) => formatoCompacto(v) }, grid: { color: GRID } },
              },
            }}
          />
        </TarjetaGrafica>

        <TarjetaGrafica
          icono="bi-signpost-split"
          titulo="Reservas por canal"
          subtitulo="De dónde llegan las reservas"
          vacio={metricas.totalReservas === 0 ? "Todavía no hay reservas." : null}
        >
          <Bar
            data={{
              labels: Object.keys(metricas.porCanal),
              datasets: [
                {
                  data: Object.values(metricas.porCanal),
                  backgroundColor: Object.keys(metricas.porCanal).map((c) => CANAL_COLOR[c]),
                  borderRadius: 6,
                  maxBarThickness: 32,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { beginAtZero: true, ticks: { precision: 0, color: MUTED }, grid: { color: GRID } },
                y: { grid: { display: false }, ticks: { color: TINTA, font: { weight: 600 } } },
              },
            }}
          />
        </TarjetaGrafica>

        <TarjetaGrafica
          icono="bi-list-check"
          titulo="Reservas por estado"
          subtitulo="Distribución actual"
          vacio={metricas.totalReservas === 0 ? "Todavía no hay reservas." : null}
        >
          <Bar
            data={{
              labels: metricas.estadosOrdenados.map(([estado]) => estado),
              datasets: [
                {
                  data: metricas.estadosOrdenados.map(([, cantidad]) => cantidad),
                  backgroundColor: metricas.estadosOrdenados.map(([estado]) => ESTADO_COLOR[estado]),
                  borderRadius: 6,
                  maxBarThickness: 28,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { beginAtZero: true, ticks: { precision: 0, color: MUTED }, grid: { color: GRID } },
                y: { grid: { display: false }, ticks: { color: TINTA, font: { weight: 600 } } },
              },
            }}
          />
        </TarjetaGrafica>
      </div>
    </div>
  );
}

export default AdminDashboard;
