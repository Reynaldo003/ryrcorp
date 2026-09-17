import { http, buildQuery } from "./apiClient";

export function getCompraRefTipificada(params = {}) {
    return http(`/ventas-vn/api/compra-ref-tipificada/${buildQuery(params)}`);
}