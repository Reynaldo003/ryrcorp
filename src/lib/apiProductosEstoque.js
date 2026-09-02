import { http, buildQuery } from "./apiClient";

export function getProductosEstoque(params = {}) {
    return http(`/ventas-vn/api/productos/${buildQuery(params)}`);
}