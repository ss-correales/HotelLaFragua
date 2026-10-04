// Exportaciones unificadas de APIs
export { default as api, createApi } from './api.js';
export { 
  getClientes, 
  getClienteById, 
  getClientePorDocumento, 
  crearCliente, 
  actualizarCliente, 
  eliminarCliente 
} from './clientesApi.js';
export { 
  getHabitaciones, 
  crearHabitacion, 
  actualizarHabitacion, 
  eliminarHabitacion 
} from './habitacionesApi.js';
export { 
  getUsuarios, 
  getUsuarioById, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario, 
  getRoles 
} from './usuariosApi.js';

export {
  getEmpleados,
  getEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from './empleadosApi.js';
