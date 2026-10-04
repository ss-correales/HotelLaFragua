import { Outlet, useLocation } from "react-router-dom";
import NavbarCliente from "../components/NavbarCliente";

function LayoutCliente() {
  const location = useLocation();

  const overlayRoutes = new Set(["/", "/habitaciones", "/reservas"]);
  const paddingTop = overlayRoutes.has(location.pathname) ? "0px" : "80px";

  return (
    <>
      <NavbarCliente />
      <div style={{ paddingTop }}>
        <Outlet />
      </div>
    </>
  );
}

export default LayoutCliente;