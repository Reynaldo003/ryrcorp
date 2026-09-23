// src/lib/apiCompraRef.js
import { buildQuery, http } from "./apiClient";
const BASE_URL = "/compra-refacciones/api";
// FACTURAS
export function getCompraRefTipificada(params = {}) {
  return http(`${BASE_URL}/${buildQuery(params)}`);
}

// OPCIONES
export function getCompraRefOpciones() {
  return http(`${BASE_URL}/opciones/`);
}

// PIEZAS DE UNA FACTURA
export function getCompraRefPiezas(params = {}) {
  return http(`${BASE_URL}/piezas/${buildQuery(params)}`);
}

// GRÁFICOS EXISTENTES
export function getCompraRefGraficos(params = {}) {
  return http(
    `/ventas-vn/api/compra-ref-tipificada/graficos/${buildQuery(params)}`,
  );
}

export function getCostoVenta(params = {}) {
  return http(`/ventas-vn/api/costo-venta/${buildQuery(params)}`);
}
