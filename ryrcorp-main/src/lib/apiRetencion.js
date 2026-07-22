// src/lib/apiRetencion.js
import { http } from "./apiPruebas";

function esFiltroVacio(valor) {
  return (
    valor === undefined ||
    valor === null ||
    valor === "" ||
    valor === "Todos" ||
    valor === "Todas"
  );
}

function construirQuery(filtros = {}) {
  const params = new URLSearchParams();

  if (!esFiltroVacio(filtros.anio)) params.set("anio", filtros.anio);
  if (!esFiltroVacio(filtros.mes)) params.set("mes", filtros.mes);
  if (!esFiltroVacio(filtros.estado)) params.set("estado", filtros.estado);
  if (!esFiltroVacio(filtros.segmento))
    params.set("segmento", filtros.segmento);
  if (!esFiltroVacio(filtros.marca)) params.set("marca", filtros.marca);
  if (!esFiltroVacio(filtros.modelo)) params.set("modelo", filtros.modelo);
  if (!esFiltroVacio(filtros.agencia)) params.set("agencia", filtros.agencia);
  if (!esFiltroVacio(filtros.condicion))
    params.set("condicion", filtros.condicion);
  if (!esFiltroVacio(filtros.search)) params.set("search", filtros.search);

  params.set("ordering", filtros.ordering || "-fecha_ultima_os");
  params.set("limit", String(filtros.limit || 50000));

  return params.toString();
}

export function obtenerOpcionesRetencion(options = {}) {
  return http("/retencion/api/ordenes-ventas/opciones/", options);
}

export function obtenerOrdenesRetencion(filtros = {}, options = {}) {
  const query = construirQuery(filtros);
  return http(
    `/retencion/api/ordenes-ventas/ligero/${query ? `?${query}` : ""}`,
    options,
  );
}

export function obtenerHistorialRetencion(vin, options = {}) {
  return http(
    `/retencion/api/ordenes-ventas/${encodeURIComponent(vin)}/historial/`,
    options,
  );
}

export const apiRetencion = {
  list: (filtros = {}, options = {}) => {
    const query = construirQuery(filtros);
    return http(
      `/retencion/api/ordenes-ventas/${query ? `?${query}` : ""}`,
      options,
    );
  },

  ligero: (filtros = {}, options = {}) =>
    obtenerOrdenesRetencion(filtros, options),

  opciones: (options = {}) => obtenerOpcionesRetencion(options),

  get: (vin, options = {}) =>
    http(`/retencion/api/ordenes-ventas/${encodeURIComponent(vin)}/`, options),

  historial: (vin, options = {}) => obtenerHistorialRetencion(vin, options),

  // ---- Tareas ----
  tareas: (telefono, options = {}) => {
    const params = new URLSearchParams();
    if (telefono) params.set("telefono", telefono);
    const query = params.toString();
    return http(`/retencion/api/tareas/${query ? `?${query}` : ""}`, options);
},

  crearTarea: (payload, options = {}) =>
    http("/retencion/api/tareas/", {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(payload),
    }),

  actualizarTarea: (id, cambios, options = {}) =>
    http(`/retencion/api/tareas/${id}/`, {
      ...options,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(cambios),
    }),

  eliminarTarea: (id, options = {}) =>
    http(`/retencion/api/tareas/${id}/`, {
      ...options,
      method: "DELETE",
    }),
};