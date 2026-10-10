//src/lib/apiVentaRef.js
import { buildQuery, http } from "./apiClient";

const BASE_URL = "/venta-refacciones/api";

export function getVentaRefFacturas(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

export function getVentaRefOpciones() {
  return http(`${BASE_URL}/opciones/`);
}

export function getVentaRefPiezas(params = {}) {
  return http(`${BASE_URL}/piezas/${buildQuery(params)}`);
}
