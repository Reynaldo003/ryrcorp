// src/lib/apiSalesforce.js
import { buildQuery, http } from "./apiClient";

const BASE_URL = "/salesforce/api";

function formularioArchivo(tabla, archivo, huella = "") {
  const datos = new FormData();
  datos.append("tabla", tabla);
  datos.append("archivo", archivo);
  if (huella) datos.append("huella", huella);
  return datos;
}

export const apiSalesforce = {
  tablas: () =>
    http(`${BASE_URL}/tablas/`, {
      retryWithoutAuth: false,
    }),

  historial: (params = {}) =>
    http(`${BASE_URL}/importaciones/${buildQuery(params)}`, {
      retryWithoutAuth: false,
    }),

  detalleImportacion: (id) =>
    http(`${BASE_URL}/importaciones/${id}/`, {
      retryWithoutAuth: false,
    }),

  validar: (tabla, archivo) =>
    http(`${BASE_URL}/importaciones/validar/`, {
      method: "POST",
      body: formularioArchivo(tabla, archivo),
      retryWithoutAuth: false,
    }),

  importar: (tabla, archivo, huella) =>
    http(`${BASE_URL}/importaciones/importar/`, {
      method: "POST",
      body: formularioArchivo(tabla, archivo, huella),
      retryWithoutAuth: false,
    }),

  listar: (tabla, params = {}) =>
    http(`${BASE_URL}/${tabla}/${buildQuery(params)}`, {
      retryWithoutAuth: false,
    }),

  obtener: (tabla, id) =>
    http(`${BASE_URL}/${tabla}/${encodeURIComponent(id)}/`, {
      retryWithoutAuth: false,
    }),

  crear: (tabla, datos) =>
    http(`${BASE_URL}/${tabla}/`, {
      method: "POST",
      data: datos,
      retryWithoutAuth: false,
    }),

  actualizar: (tabla, id, datos) =>
    http(`${BASE_URL}/${tabla}/${encodeURIComponent(id)}/`, {
      method: "PATCH",
      data: datos,
      retryWithoutAuth: false,
    }),

  eliminar: (tabla, id) =>
    http(`${BASE_URL}/${tabla}/${encodeURIComponent(id)}/`, {
      method: "DELETE",
      retryWithoutAuth: false,
    }),
};
