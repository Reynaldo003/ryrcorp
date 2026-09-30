import { buildQuery, http } from "./apiClient";

const BASE_URL = "/gota/api";

export function getGotaOrdenes(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

export function getGotaDashboard(params = {}) {
  return http(`${BASE_URL}/dashboard/${buildQuery(params)}`);
}

export function getGotaOpciones() {
  return http(`${BASE_URL}/opciones/`);
}
