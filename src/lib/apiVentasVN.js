import { http, buildQuery } from "./apiClient";

export const CONDICION_USO = {
  NUEVO: "N",
  USADO: "U",
};

// ==========================================================
// DASHBOARD AUTOS
// GET /ventas-vn/api/dashboard/
// ==========================================================
// Parámetros:
// - cond_uso: N | U
// - q
// - fecha_desde
// - fecha_hasta
// - agencia
// - asesor
// - familia
// - condicion_pago
// - venta_digital
// - anio_tendencia
// ==========================================================

export function getVentasVNDashboard(params = {}) {
  return http(`/ventas-vn/api/dashboard/${buildQuery(params)}`);
}

// ==========================================================
// DETALLE AUTOS
// GET /ventas-vn/api/
// ==========================================================
// Parámetros:
// - cond_uso: N | U
// - page
// - page_size
// - q
// - fecha_desde
// - fecha_hasta
// - agencia
// - asesor
// - familia
// - condicion_pago
// - venta_digital
// ==========================================================

export function getVentasVNDetalle(params = {}) {
  return http(`/ventas-vn/api/${buildQuery(params)}`);
}
