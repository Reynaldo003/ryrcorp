// src/lib/apiEntregas.js
import { http } from "./apiClient";

async function listAll(url = "/citas/api/entregas/") {
  let results = [];
  let next = url;

  while (next) {
    const data = await http(next);

    if (Array.isArray(data)) return data; 

    results = results.concat(data.results || []);
    next = data.next
      ? data.next.replace(/^https?:\/\/[^/]+/, "") 
      : null;
  }

  return results;
}

export const apiEntregas = {
  list: () => listAll(),
  get: (id) => http(`/citas/api/entregas/${id}/`),

  create: (payload) =>
    http("/citas/api/entregas/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) => http(`/citas/api/entregas/${id}/`, { method: "DELETE" }),
};