// src/lib/apiServicio.js
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

export const apiServicio = {
  list: () => listAll("/api/encuestas/servicio/"),
  get: (id) => http(`/api/encuestas/servicio/${id}/`),
};