// src/lib/apiEncuestas.js
import { http } from "./apiClient";

async function listAll(path) {
  let all = [];
  let next = `${path}?limit=1000&page_size=1000`;

  while (next) {
    const data = await http(next);

    if (Array.isArray(data)) {
      all = all.concat(data);
      break;
    }

    all = all.concat(data.results ?? []);

    if (!data.next) {
      next = null;
    } else {
      try {
        const u = new URL(data.next);
        next = `${u.pathname}${u.search}`;
      } catch {
        next = data.next;
      }
    }
  }

  return all;
}

export const apiEncuestas = {
  list: () => listAll("/api/encuestas/satisfaccion/"),
  get: (id) => http(`/api/encuestas/satisfaccion/${id}/`),

  crearSatisfaccion: (data) =>
    http("/api/public/encuestas/satisfaccion/", {
      method: "POST",
      body: data,
      auth: false,
      redirectOnUnauthorized: false,
    }),

  crearServicio: (data) =>
    http("/api/public/encuestas/servicio/", {
      method: "POST",
      body: data,
      auth: false,
      redirectOnUnauthorized: false,
    }),
};