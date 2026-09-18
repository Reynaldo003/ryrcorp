import { buildQuery, http } from "./apiClient";

const BASE_URL = "/presupuestos/api";

export function getPresupuestos(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

export function getPresupuestosRefacciones(params = {}) {
  return http(`${BASE_URL}/refacciones/${buildQuery(params)}`);
}

export function getPresupuestosDashboard(params = {}) {
  return http(`${BASE_URL}/dashboard/${buildQuery(params)}`);
}

export function getOpcionesPresupuestos() {
  return http(`${BASE_URL}/opciones/`);
}
