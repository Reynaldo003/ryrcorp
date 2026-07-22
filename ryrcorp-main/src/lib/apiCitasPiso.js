// src/lib/apiCitasPiso.js
import { http } from "./apiClient";

/**
 * ⚠️ IMPORTANTE:
 * - Antes: /citas/api/citas-piso/
 * - Ahora (BD nueva): /citas/api/registro-piso/
 */
export const apiCitasPiso = {
  list: () => http("/citas/api/registro-piso/"),
  get: (id) => http(`/citas/api/registro-piso/${id}/`),

  create: (payload) =>
    http("/citas/api/registro-piso/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/citas/api/registro-piso/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/citas/api/registro-piso/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) => http(`/citas/api/registro-piso/${id}/`, { method: "DELETE" }),
};
