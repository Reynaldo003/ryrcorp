import { buildQuery, http } from "./apiClient";

const BASE_URL = "/refacciones-obsolescencia/api";

export function getRefaccionesObsolescencia(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

export function getRefaccionesObsolescenciaDashboard(params = {}) {
  return http(`${BASE_URL}/dashboard/${buildQuery(params)}`);
}

export function getOpcionesRefaccionesObsolescencia() {
  return http(`${BASE_URL}/opciones/`);
}
