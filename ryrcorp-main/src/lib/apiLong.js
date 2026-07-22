// src/lib/apiLong.js
import { http } from "./apiClient";

const optionsProtegidas = {
  retryWithoutAuth: false,
  redirectOnUnauthorized: true,
};

export const apiLong = {
  list: () => http("/financieros/api/long-drives/", optionsProtegidas),

  get: (id) =>
    http(
      `/financieros/api/long-drives/${encodeURIComponent(id)}/`,
      optionsProtegidas,
    ),

  create: (payload) =>
    http("/financieros/api/long-drives/", {
      ...optionsProtegidas,
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/financieros/api/long-drives/${encodeURIComponent(id)}/`, {
      ...optionsProtegidas,
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/financieros/api/long-drives/${encodeURIComponent(id)}/`, {
      ...optionsProtegidas,
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/financieros/api/long-drives/${encodeURIComponent(id)}/`, {
      ...optionsProtegidas,
      method: "DELETE",
    }),
};
