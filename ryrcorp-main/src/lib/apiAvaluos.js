// src/lib/apiAvaluos.js
import { http } from "./apiClient";

function buildAvaluoFormData(payload = {}) {
  const formData = new FormData();

  const evidenciasNuevas = Array.isArray(payload.evidencias_nuevas)
    ? payload.evidencias_nuevas
    : [];

  const deleteEvidenciaIds = Array.isArray(payload.delete_evidencia_ids)
    ? payload.delete_evidencia_ids
    : [];

  const conceptos = Array.isArray(payload.conceptos) ? payload.conceptos : [];

  Object.entries(payload).forEach(([key, value]) => {
    if (
      key === "evidencias_nuevas" ||
      key === "delete_evidencia_ids" ||
      key === "conceptos"
    ) {
      return;
    }

    if (value === undefined || value === null) return;

    formData.append(key, String(value));
  });

  formData.append("conceptos_json", JSON.stringify(conceptos));

  deleteEvidenciaIds.forEach((id) => {
    if (id !== undefined && id !== null && String(id).trim() !== "") {
      formData.append("delete_evidencia_ids", String(id));
    }
  });

  evidenciasNuevas.forEach((file) => {
    if (file instanceof File || file instanceof Blob) {
      formData.append("evidencias_nuevas", file);
    }
  });

  return formData;
}

export const apiAvaluos = {
  list: () => http("/usados/api/avaluos/"),

  get: (id) => http(`/usados/api/avaluos/${id}/`),

  create: (payload) =>
    http("/usados/api/avaluos/", {
      method: "POST",
      body: buildAvaluoFormData(payload),
    }),

  update: (id, payload) =>
    http(`/usados/api/avaluos/${id}/`, {
      method: "PUT",
      body: buildAvaluoFormData(payload),
    }),

  patch: (id, payload) =>
    http(`/usados/api/avaluos/${id}/`, {
      method: "PATCH",
      body: buildAvaluoFormData(payload),
    }),

  remove: (id) =>
    http(`/usados/api/avaluos/${id}/`, {
      method: "DELETE",
    }),
};
