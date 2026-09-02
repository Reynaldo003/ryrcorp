import { http, buildQuery } from "./apiClient";

export function getPiezas(params = {}) {
    return http(`/ventas-vn/api/piezas/${buildQuery(params)}`);
}