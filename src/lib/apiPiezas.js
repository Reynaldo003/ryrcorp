import { http, buildQuery } from "./apiClient";

export function getPiezas(params = {}) {
    return http(`/ventas-vn/api/piezas/${buildQuery(params)}`);
}

export function getPiezasTipificadas(params = {}) {
    return http(`/ventas-vn/api/piezas-tipificadas/${buildQuery(params)}`);
}

export function getPiezasObsolescencia(params = {}) {
    return http(`/ventas-vn/api/piezas-tipificadas/obsolescencia/${buildQuery(params)}`);
}