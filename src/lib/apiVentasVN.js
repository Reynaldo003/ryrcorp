// src/lib/apiVentasVN.js

import { http, buildQuery } from "./apiClient";

export const CONDICION_USO = {
  NUEVO: "N",
  USADO: "U",
};

// ==========================================================
// DASHBOARD AUTOS
// ==========================================================
//
// GET /ventas-vn/api/dashboard/
//
// Parámetros:
// - fecha_desde
// - fecha_hasta
// - agencia
// - asesor
// - familia
// - condicion_pago
// - venta_digital
// - cond_uso: N | U
// ==========================================================

export function getVentasVNDashboard(params = {}) {
  return http(`/ventas-vn/api/dashboard/${buildQuery(params)}`);
}

// ==========================================================
// DETALLE VW_VN
// ==========================================================

export function getVentasVNDetalle(params = {}) {
  return http(`/ventas-vn/api/${buildQuery(params)}`);
}
