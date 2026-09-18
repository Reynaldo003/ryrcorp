import { http, buildQuery } from "./apiClient";

export function getCompraRefTipificada(params = {}) {
    return http(`/ventas-vn/api/compra-ref-tipificada/${buildQuery(params)}`);
}

export function getCompraRefGraficos(params = {}) {
    return http(`/ventas-vn/api/compra-ref-tipificada/graficos/${buildQuery(params)}`);
}

export function getCostoVenta(params = {}) {
    return http(`/ventas-vn/api/costo-venta/${buildQuery(params)}`);
}