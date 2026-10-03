//src/lib/apiOrdenesFacturadas.js
import { buildQuery, http } from "./apiClient";

const BASE_URL = "/ordenes-facturadas/api";

export function getOrdenesFacturadas(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

export function getOrdenFacturadaDetalle(params = {}) {
  return http(`${BASE_URL}/detalle/${buildQuery(params)}`);
}

export function getOrdenesFacturadasOpciones() {
  return http(`${BASE_URL}/opciones/`);
}
