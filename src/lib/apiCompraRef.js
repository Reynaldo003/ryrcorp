import { buildQuery, http } from "./apiClient";

const BASE_URL = "/compra-refacciones/api";

export function getCompraRefTipificada(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

export function getCompraRefOpciones() {
  return http(`${BASE_URL}/opciones/`);
}

export function getCompraRefPiezas(params = {}) {
  return http(`${BASE_URL}/piezas/${buildQuery(params)}`);
}

export function getCompraRefGraficos(params = {}) {
  return http(
    `/ventas-vn/api/compra-ref-tipificada/graficos/${buildQuery(params)}`,
  );
}

export function getCostoVenta(params = {}) {
  return http(`/ventas-vn/api/costo-venta/${buildQuery(params)}`);
}
