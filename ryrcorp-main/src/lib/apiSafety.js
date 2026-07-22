// src/lib/apiSafety.js
import { http } from "./apiClient";

export const apiSafety = {
  list: () => http("/api/safety/reportes/"),
  get: (id) => http(`/api/safety/reportes/${id}/`),
  remove: (id) => http(`/api/safety/reportes/${id}/`, { method: "DELETE" }),
};
