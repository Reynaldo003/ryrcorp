// src/lib/apiCredito.js
import { http } from "./apiPruebas";

function encodeId(id) {
  return encodeURIComponent(String(id));
}

export const apiCredito = {
  list: () => http("/financieros/api/solicitudes-credito/"),

  get: (id) => http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`),

  create: (payload) =>
    http("/financieros/api/solicitudes-credito/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`, {
      method: "DELETE",
    }),
};