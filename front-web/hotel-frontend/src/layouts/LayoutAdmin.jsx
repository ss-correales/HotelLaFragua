import { Outlet, Navigate, useLocation } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";
import { createContext, useContext, useState, useEffect } from "react";

// Crear contexto para autenticación
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem("token"),
    user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
    isAuthenticated: false
  });

  const updateAuthState = () => {
    // Sincronizar con localStorage
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    setAuthState({
      token,
      user,
      isAuthenticated: !!(token && user)
    });
  };

  useEffect(() => {
    // Sincronizar al montar
    updateAuthState();

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      updateAuthState();
    };

    window.addEventListener('storage', handleStorageChange);

    // Escuchar eventos personalizados del LoginAdmin
    const handleLoginEvent = (e) => {
      if (e.detail && e.detail.token && e.detail.user) {
        setAuthState({
          token: e.detail.token,
          user: e.detail.user,
          isAuthenticated: true
        });
      }
    };

    window.addEventListener('localStorageUpdated', handleLoginEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleLoginEvent);
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

export { AuthProvider, useAuth };

function LayoutAdmin() {
  const location = useLocation();

  // Obtener token directamente desde localStorage
  const token = localStorage.getItem("token");

  // Rutas que requieren autenticación
  const protectedRoutes = ["/admin/usuarios", "/admin/habitaciones", "/admin/reservas", "/admin/facturas", "/admin/ofertas", "/admin/reportes"];

  // Si no hay token y se intenta acceder a una ruta protegida, redirigir al login
  if (!token && protectedRoutes.includes(location.pathname)) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si hay token, verificar rol de administrador
  if (token && protectedRoutes.includes(location.pathname)) {
    try {
      // Decodificar el JWT para obtener información del usuario
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));

      // Verificar si el usuario tiene rol de administrador
      const roles = decodedPayload?.roles;
      const hasAdminRole = Array.isArray(roles) && roles.some((rol) => {
        if (typeof rol === "string") return rol === "Administrador";
        return rol?.nombre === "Administrador" || rol?.name === "Administrador";
      });

      if (!hasAdminRole) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Acceso denegado. Solo los administradores pueden acceder al panel de administración.");
        return <Navigate to="/admin/login" replace />;
      }

      return (
        <>
          <NavbarAdmin />
          <div style={{ paddingTop: "60px", paddingBottom: "40px", minHeight: "100vh" }}>
            <Outlet />
          </div>
        </>
      );

    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return <Navigate to="/admin/login" replace />;
    }
  }

  return (
    <>
      <NavbarAdmin />
      <div style={{ paddingTop: "60px", paddingBottom: "40px", minHeight: "100vh" }}>
        <Outlet />
      </div>
    </>
  );
}

export default LayoutAdmin;
