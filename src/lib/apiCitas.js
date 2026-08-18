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

async function fetchPage(url) {
  const data = await http(url, { auth: false });
  if (Array.isArray(data)) return { results: data, next: null };
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    next: data?.next
      ? String(data.next).replace(/^https?:\/\/[^/]+/, "")
      : null,
    count: data?.count ?? 0,
  };
}

export const apiCitas = {
  list: async (params = {}) => {
    const query = buildQuery(params);
    const first = await fetchPage(`/citas/api/citas/${query}`);
    if (!first.next) return first.results;

    let next = first.next;
    const all = [...first.results];
    const visited = new Set();

    while (next && !visited.has(next)) {
      visited.add(next);
      const page = await fetchPage(next);
      all.push(...page.results);
      next = page.next;
    }

    return all;
  },

  listPage: (params = {}) => {
    const query = buildQuery(params);
    return fetchPage(`/citas/api/citas/${query}`);
  },

  get: (id) => http(`/citas/api/citas/${id}/`, { auth: false }),
  create: (payload) =>
    http("/citas/api/citas/", jsonRequest("POST", payload, false)),
  update: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PUT", payload)),
  patch: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PATCH", payload)),
  remove: (id) => http(`/citas/api/citas/${id}/`, { method: "DELETE" }),
};
