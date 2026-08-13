// src/lib/apiEntregas.js
import { buildQuery, http } from "./apiClient";

async function listarTodo(params = {}) {
  let next = `/citas/api/entregas/${buildQuery(params)}`;
  const resultados = [];
  const visitadas = new Set();

  while (next && !visitadas.has(next)) {
    visitadas.add(next);
    const data = await http(next, { auth: false });
    if (Array.isArray(data)) return resultados.concat(data);
    resultados.push(...(Array.isArray(data?.results) ? data.results : []));
    next = data?.next
      ? String(data.next).replace(/^https?:\/\/[^/]+/, "")
      : null;
  }

  return resultados;
}

export const apiEntregas = {
  list: (params = {}) => listarTodo(params),
  get: (id) => http(`/citas/api/entregas/${id}/`, { auth: false }),
  create: (payload) =>
    http("/citas/api/entregas/", {
      method: "POST",
      body: payload,
      auth: false,
    }),
  update: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, { method: "PUT", body: payload }),
  patch: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, { method: "PATCH", body: payload }),
  remove: (id) => http(`/citas/api/entregas/${id}/`, { method: "DELETE" }),
};
