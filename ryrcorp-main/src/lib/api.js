// src/lib/api.js
import { http } from "./apiPruebas";

export const api = {
  listCasos: () => http("/conformidad/api/casos/"),

  getCaso: (idExp) => http(`/conformidad/api/casos/${idExp}/`),

  createCaso: (payload) =>
    http("/conformidad/api/casos/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  updateCaso: (id_exp, payload) =>
    http(`/conformidad/api/casos/${id_exp}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  deleteCaso: (id_exp) =>
    http(`/conformidad/api/casos/${id_exp}/`, { method: "DELETE" }),

  uploadDocs: async (id_exp, files) => {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    return http(`/conformidad/api/casos/${id_exp}/docs/`, {
      method: "POST",
      body: fd,
    });
  },

  deleteDoc: (idDoc) =>
    http(`/conformidad/api/docs/${idDoc}/`, { method: "DELETE" }),
};