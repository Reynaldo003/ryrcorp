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

    if (value === undefined || value === null) {
      return;
    }

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

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

function normalizarRespuestaPaginada(data) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }

  return {
    count: Number(data?.count || 0),
    next: data?.next || null,
    previous: data?.previous || null,
    results: Array.isArray(data?.results) ? data.results : [],
  };
}

async function listarPagina(params = {}) {
  const query = buildQuery(params);

  const data = await http(`/usados/api/avaluos/${query}`);

  return normalizarRespuestaPaginada(data);
}

async function listarTodos(params = {}) {
  const pageSize = Math.min(Number(params.page_size || 100), 100);

  const baseParams = {
    ...params,
    page_size: pageSize,
  };

  delete baseParams.page;

  let page = 1;
  let resultados = [];
  let total = null;

  while (true) {
    const data = await listarPagina({
      ...baseParams,
      page,
    });

    resultados = [...resultados, ...data.results];

    if (total === null) {
      total = data.count;
    }

    if (!data.next) {
      break;
    }

    if (total !== null && resultados.length >= total) {
      break;
    }

    page += 1;
  }

  return resultados;
}

export const apiAvaluos = {
  list: (params = {}) => {
    return listarPagina(params);
  },

  listAll: (params = {}) => {
    return listarTodos(params);
  },

  get: (id) => {
    return http(`/usados/api/avaluos/${id}/`);
  },

  create: (payload) => {
    return http("/usados/api/avaluos/", {
      method: "POST",
      body: buildAvaluoFormData(payload),
    });
  },

  update: (id, payload) => {
    return http(`/usados/api/avaluos/${id}/`, {
      method: "PUT",
      body: buildAvaluoFormData(payload),
    });
  },

  patch: (id, payload) => {
    return http(`/usados/api/avaluos/${id}/`, {
      method: "PATCH",
      body: buildAvaluoFormData(payload),
    });
  },

  remove: (id) => {
    return http(`/usados/api/avaluos/${id}/`, {
      method: "DELETE",
    });
  },
};
