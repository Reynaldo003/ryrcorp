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

export function getGotaComentarios({ agencia, nr_os } = {}) {
  return http(`${BASE_URL}/comentarios/${buildQuery({ agencia, nr_os })}`);
}

export function crearGotaComentario(data) {
  return http(`${BASE_URL}/comentarios/`, { method: "POST", data });
}

export function actualizarGotaComentario(id, data) {
  return http(`${BASE_URL}/comentarios/${id}/`, { method: "PATCH", data });
}

export function eliminarGotaComentario(id) {
  return http(`${BASE_URL}/comentarios/${id}/`, { method: "DELETE" });
}

export function getGotaObservaciones({ agencia, nr_os } = {}) {
  return http(`${BASE_URL}/observaciones/${buildQuery({ agencia, nr_os })}`);
}
