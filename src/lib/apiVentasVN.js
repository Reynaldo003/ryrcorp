// src/lib/apiVentasVN.js

import { http, buildQuery } from "./apiClient";

// ==========================================================
// DASHBOARD AUTOS NUEVOS
// ==========================================================
//
// Consume:
// GET /ventas-vn/api/dashboard/
//
// Parámetros disponibles:
// - fecha_desde
// - fecha_hasta
// - agencia
// - asesor
// - familia
// - condicion_pago
//
// CondUso = "N" NO se envía.
// El backend lo aplica siempre.
// ==========================================================

export function getVentasVNDashboard(params = {}) {
  return http(`/ventas-vn/api/dashboard/${buildQuery(params)}`);
}

// ==========================================================
// DETALLE VW_VN
//
// Mantiene funcionando la tabla que ya construimos.
// ==========================================================

export function getVentasVNDetalle(params = {}) {
  return http(`/ventas-vn/api/${buildQuery(params)}`);
}
