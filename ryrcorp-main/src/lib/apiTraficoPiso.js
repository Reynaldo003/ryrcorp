// src/lib/apiTraficoPiso.js
import { buildQuery, http } from "./apiClient";

const BASE = "/trafico-piso/api/trafico-piso";

export const apiTraficoPiso = {
  list: (params = {}) => http(`${BASE}/${buildQuery(params)}`),

  get: (id) => http(`${BASE}/${id}/`),

  create: (payload) =>
    http(`${BASE}/`, {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`${BASE}/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`${BASE}/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) => http(`${BASE}/${id}/`, { method: "DELETE" }),

  asesoresVentas: (q = "") => http(`${BASE}/asesores-ventas/${buildQuery({ q })}`),

  resumen: (params = {}) => http(`${BASE}/resumen/${buildQuery(params)}`),
};
