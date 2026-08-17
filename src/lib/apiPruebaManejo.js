// src/lib/apiPruebaManejo.js
import { buildQuery, http } from "./apiClient";

async function listarTodo(params = {}) {
  let next = `/citas/api/pruebas-manejo/${buildQuery(params)}`;
  const resultados = [];
  const visitadas = new Set();

  while (next && !visitadas.has(next)) {
    visitadas.add(next);
    const data = await http(next);
    if (Array.isArray(data)) return resultados.concat(data);
    resultados.push(...(Array.isArray(data?.results) ? data.results : []));
    next = data?.next
      ? String(data.next).replace(/^https?:\/\/[^/]+/, "")
      : null;
  }

  return resultados;
}

export const apiPruebaManejo = {
  list: (params = {}) => listarTodo(params),
  get: (id) => http(`/citas/api/pruebas-manejo/${id}/`),

  create: (payload) =>
    http("/citas/api/pruebas-manejo/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/citas/api/pruebas-manejo/${id}/`, { method: "DELETE" }),
};

// Evidencias (multipart)
export const apiEvidenciasPruebaManejo = {
  list: () => http("/citas/api/evidencias-pruebas/"),

  remove: (id) =>
    http(`/citas/api/evidencias-pruebas/${id}/`, { method: "DELETE" }),

  create: ({ id_prueba_manejo, archivo }) => {
    const fd = new FormData();
    fd.append("prueba_manejo", String(id_prueba_manejo));
    fd.append("archivo", archivo);

    return http("/citas/api/evidencias-pruebas/", {
      method: "POST",
      body: fd,
    });
  },
};
