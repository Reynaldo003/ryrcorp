// src/lib/apiLogs.js
import { http, buildQuery } from "./apiClient";

export const apiLogs = {
  listar: (params = {}) => http(`/logs/api/logs/${buildQuery(params)}`),

  catalogo: () => http("/logs/api/logs/catalogo/"),

  resumen: () => http("/logs/api/logs/resumen/"),

  estado: () => http("/logs/api/logs/estado/"),

  restaurar: (logId) => http(`/logs/api/logs/${logId}/restaurar/`, { method: "POST" }),
};