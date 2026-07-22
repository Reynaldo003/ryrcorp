// src/lib/apiFlujo.js

import { http, buildQuery } from "./apiClient";

const BASE = "/flujo/diagramas_flujo";

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function cleanId(id) {
  const value = String(id || "").trim();

  if (!value) {
    throw new Error("Falta el id del diagrama.");
  }

  return encodeURIComponent(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

/**
 * Convierte respuesta del backend español:
 * {
 *   id, nombre, descripcion, pasos, nodos, conexiones, metadatos,
 *   creado_en, actualizado_en
 * }
 *
 * A estructura que ya usa tu front:
 * {
 *   id, name, description, steps, nodes, edges, metadata,
 *   createdAt, updatedAt
 * }
 */
export function normalizarDiagramaFlujo(item = {}) {
  return {
    id: String(item.id || ""),
    name: item.name || item.nombre || "Diagrama sin nombre",
    description: item.description || item.descripcion || "",
    steps: safeArray(item.steps || item.pasos),
    nodes: safeArray(item.nodes || item.nodos),
    edges: safeArray(item.edges || item.conexiones),
    metadata: safeObject(item.metadata || item.metadatos),
    createdAt: item.createdAt || item.creado_en || null,
    updatedAt: item.updatedAt || item.actualizado_en || null,

    // Estadísticas del backend, por si luego las quieres mostrar.
    total_pasos: item.total_pasos || 0,
    total_nodos: item.total_nodos || 0,
    total_conexiones: item.total_conexiones || 0,
    total_decisiones: item.total_decisiones || 0,
  };
}

/**
 * Convierte estructura del front a estructura del backend.
 */
export function prepararDiagramaFlujoPayload(project = {}) {
  const nombre = String(project.name || project.nombre || "").trim();

  return {
    nombre,
    descripcion: String(
      project.description || project.descripcion || "",
    ).trim(),
    pasos: safeArray(project.steps || project.pasos),
    nodos: safeArray(project.nodes || project.nodos),
    conexiones: safeArray(project.edges || project.conexiones),
    metadatos: safeObject(project.metadata || project.metadatos),
  };
}

function normalizarLista(data) {
  if (Array.isArray(data)) {
    return data.map(normalizarDiagramaFlujo);
  }

  if (Array.isArray(data?.results)) {
    return data.results.map(normalizarDiagramaFlujo);
  }

  return [];
}

export const apiFlujo = {
  list: async (params = {}) => {
    const data = await http(`${BASE}/${buildQuery(params)}`);
    return normalizarLista(data);
  },

  get: async (id) => {
    const data = await http(`${BASE}/${cleanId(id)}/`);
    return normalizarDiagramaFlujo(data);
  },

  create: async (project) => {
    const payload = prepararDiagramaFlujoPayload(project);

    if (!payload.nombre) {
      throw new Error("El nombre del diagrama es obligatorio.");
    }

    const data = await http(`${BASE}/`, {
      method: "POST",
      data: payload,
    });

    return normalizarDiagramaFlujo(data);
  },

  patch: async (id, project) => {
    const payload = prepararDiagramaFlujoPayload(project);

    if (!payload.nombre) {
      throw new Error("El nombre del diagrama es obligatorio.");
    }

    const data = await http(`${BASE}/${cleanId(id)}/`, {
      method: "PATCH",
      data: payload,
    });

    return normalizarDiagramaFlujo(data);
  },

  update: async (id, project) => {
    const payload = prepararDiagramaFlujoPayload(project);

    if (!payload.nombre) {
      throw new Error("El nombre del diagrama es obligatorio.");
    }

    const data = await http(`${BASE}/${cleanId(id)}/`, {
      method: "PUT",
      data: payload,
    });

    return normalizarDiagramaFlujo(data);
  },

  remove: async (id) => {
    return http(`${BASE}/${cleanId(id)}/`, {
      method: "DELETE",
    });
  },

  duplicate: async (id) => {
    const data = await http(`${BASE}/${cleanId(id)}/duplicar/`, {
      method: "POST",
    });

    return normalizarDiagramaFlujo(data);
  },

  /**
   * Si el proyecto ya tiene UUID de backend, hace PATCH.
   * Si todavía tiene id local tipo "project-...", hace POST.
   */
  save: async (project) => {
    const id = String(project?.id || "").trim();

    if (isUuid(id)) {
      return apiFlujo.patch(id, project);
    }

    return apiFlujo.create(project);
  },

  isBackendId: isUuid,
};
