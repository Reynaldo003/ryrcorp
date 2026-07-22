// src/lib/apiCitas.js
import { http } from "./apiClient";

function jsonRequest(method, payload) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  };
}

export const apiCitas = {
  list: () => http("/citas/api/citas/"),

  get: (id) => http(`/citas/api/citas/${id}/`),

  create: (payload) => http("/citas/api/citas/", jsonRequest("POST", payload)),

  update: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PUT", payload)),

  patch: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PATCH", payload)),

  remove: (id) =>
    http(`/citas/api/citas/${id}/`, {
      method: "DELETE",
    }),
};
