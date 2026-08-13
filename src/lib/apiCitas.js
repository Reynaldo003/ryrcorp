// src/lib/apiCitas.js
import { buildQuery, http } from "./apiClient";

function jsonRequest(method, payload, auth = true) {
  return {
    method,
    auth,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  };
}

async function listarTodo(params = {}) {
  let next = `/citas/api/citas/${buildQuery(params)}`;
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

export const apiCitas = {
  list: (params = {}) => listarTodo(params),
  get: (id) => http(`/citas/api/citas/${id}/`, { auth: false }),
  create: (payload) =>
    http("/citas/api/citas/", jsonRequest("POST", payload, false)),
  update: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PUT", payload)),
  patch: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PATCH", payload)),
  remove: (id) => http(`/citas/api/citas/${id}/`, { method: "DELETE" }),
};
