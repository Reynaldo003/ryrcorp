// src/lib/api.js
const API =
  import.meta.env.VITE_API_URL ||
  "https://rhi4i2-ip-187-148-222-77.tunnelmole.net";

async function http(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API}${path}`, { method, body, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

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

  // OJO: este endpoint /api/docs/<id>/ no existe en tus urls.py (abajo te digo qué falta)
  deleteDoc: (idDoc) =>
    http(`/conformidad/api/docs/${idDoc}/`, { method: "DELETE" }),
};
