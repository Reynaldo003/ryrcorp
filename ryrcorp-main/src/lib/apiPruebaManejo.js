// src/lib/apiPruebaManejo.js
import { http } from "./apiClient";

export const apiPruebaManejo = {
  list: () => http("/citas/api/pruebas-manejo/"),
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
