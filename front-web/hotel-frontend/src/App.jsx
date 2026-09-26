import { Routes, Route } from "react-router-dom";

// Layouts
import LayoutCliente from "./layouts/LayoutCliente";
import LayoutAdmin from "./layouts/LayoutAdmin";
import { AuthProvider } from "./layouts/LayoutAdmin";

// Clientes
import ClienteHome from "./pages/cliente/ClienteHome.jsx";
import PerfilCliente from "./pages/cliente/PerfilCliente.jsx";
import Login from "./pages/cliente/Login.jsx";
import RegistroCliente from "./pages/cliente/RegistroCliente.jsx";
import HabitacionesView from "./pages/cliente/HabitacionesView.jsx";
import ClienteReservasView from "./pages/cliente/ReservasView.jsx";
import MisReservasView from "./pages/cliente/MisReservasView.jsx";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Habitaciones from "./pages/admin/Habitaciones.jsx";
import UsuariosView from "./pages/admin/UsuariosView.jsx";
import AdminReservasView from "./pages/admin/ReservasView.jsx";
import FacturasView from "./pages/admin/FacturasView.jsx";
import LoginAdmin from "./pages/admin/LoginAdmin.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Clientes */}
        <Route element={<LayoutCliente />}>
          <Route path="/" element={<ClienteHome />} />
          <Route path="/habitaciones" element={<HabitacionesView />} />
          <Route path="/reservas" element={<ClienteReservasView />} />
          <Route path="/mis-reservas" element={<MisReservasView />} />
          <Route path="/perfil" element={<PerfilCliente />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<RegistroCliente />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/*" element={<LayoutAdmin />}>
          <Route index element={<AdminDashboard />} />
          <Route path="habitaciones" element={<Habitaciones />} />
          <Route path="usuarios" element={<UsuariosView />} />
          <Route path="reservas" element={<AdminReservasView />} />
          <Route path="facturas" element={<FacturasView />} />
          <Route path="login" element={<LoginAdmin />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;