// src/lib/apiJDPowerServicio.js
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

  if (!esFiltroVacio(filtros.anio))               params.set("anio", filtros.anio);
  if (!esFiltroVacio(filtros.mes))                params.set("mes", filtros.mes);
  if (!esFiltroVacio(filtros.tipo))               params.set("tipo", filtros.tipo);
  if (!esFiltroVacio(filtros.tipo_servicio))      params.set("tipo_servicio", filtros.tipo_servicio);
  if (!esFiltroVacio(filtros.canal_envio))        params.set("canal_envio", filtros.canal_envio);
  if (!esFiltroVacio(filtros.estatus))            params.set("estatus", filtros.estatus);
  if (!esFiltroVacio(filtros.concesionaria))      params.set("concesionaria", filtros.concesionaria);
  if (!esFiltroVacio(filtros.codigo_concesionaria)) params.set("codigo_concesionaria", filtros.codigo_concesionaria);
  if (!esFiltroVacio(filtros.asesor))             params.set("asesor", filtros.asesor);
  if (!esFiltroVacio(filtros.modelo))             params.set("modelo", filtros.modelo);
  if (!esFiltroVacio(filtros.anio_vehiculo))      params.set("anio_vehiculo", filtros.anio_vehiculo);
  if (!esFiltroVacio(filtros.region))             params.set("region", filtros.region);
  if (!esFiltroVacio(filtros.zona))               params.set("zona", filtros.zona);
  if (!esFiltroVacio(filtros.estado))             params.set("estado", filtros.estado);
  if (!esFiltroVacio(filtros.search))             params.set("search", filtros.search);

  params.set("ordering", filtros.ordering || "-periodo");
  params.set("limit", String(filtros.limit || 10000));

  return params.toString();
}

export function obtenerOpcionesJDPowerServicio(options = {}) {
  return http("/jdpower/api/encuestas-servicio/opciones/", options);
}

export function obtenerEncuestasJDPowerServicio(filtros = {}, options = {}) {
  const query = construirQuery(filtros);
  return http(
    `/jdpower/api/encuestas-servicio/ligero/${query ? `?${query}` : ""}`,
    options
  );
}

export function obtenerResumenIAJDPowerServicio(filtros = {}, options = {}) {
  const query = construirQuery(filtros);
  return http(
    `/jdpower/api/encuestas-servicio/resumen-ia/${query ? `?${query}` : ""}`,
    { method: "POST", ...options },
  );
}

export const apiJDPowerServicio = {
  list: (filtros = {}, options = {}) => {
    const query = construirQuery(filtros);
    return http(`/jdpower/api/encuestas-servicio/${query ? `?${query}` : ""}`, options);
  },
  ligero: (filtros = {}, options = {}) => {
    return obtenerEncuestasJDPowerServicio(filtros, options);
  },
  opciones: (options = {}) => {
    return obtenerOpcionesJDPowerServicio(options);
  },
  get: (id) => {
    return http(`/jdpower/api/encuestas-servicio/${encodeURIComponent(id)}/`);
  },
};