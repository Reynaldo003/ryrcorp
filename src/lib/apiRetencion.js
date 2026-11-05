
import { http } from "./apiPruebas";

// =====================================================
// MIGRACIÓN DE RETENCIÓN A POSTGRESQL
// false = API original de SQL Server
// true  = API nueva de PostgreSQL
// =====================================================
const USAR_POSTGRES_RETENCION = true;

const API_VEHICULOS_RETENCION = USAR_POSTGRES_RETENCION
  ? "/retencion/api/ordenes-ventas-postgres-prueba"
  : "/retencion/api/ordenes-ventas";

// =====================================================
// FILTROS Y PARÁMETROS
// =====================================================
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

  if (!esFiltroVacio(filtros.anio))
    params.set("anio", filtros.anio);

  if (!esFiltroVacio(filtros.mes))
    params.set("mes", filtros.mes);

  if (!esFiltroVacio(filtros.semana))
    params.set("semana", filtros.semana);

  if (!esFiltroVacio(filtros.estado))
    params.set("estado", filtros.estado);

  if (!esFiltroVacio(filtros.segmento))
    params.set("segmento", filtros.segmento);

  if (!esFiltroVacio(filtros.marca))
    params.set("marca", filtros.marca);

  if (!esFiltroVacio(filtros.modelo))
    params.set("modelo", filtros.modelo);

  if (!esFiltroVacio(filtros.agencia))
    params.set("agencia", filtros.agencia);

  if (!esFiltroVacio(filtros.agencia_venta))
    params.set("agencia_venta", filtros.agencia_venta);

  if (!esFiltroVacio(filtros.agencias_venta))
    params.set("agencias_venta", filtros.agencias_venta);

  if (!esFiltroVacio(filtros.condicion))
    params.set("condicion", filtros.condicion);

  if (!esFiltroVacio(filtros.search))
    params.set("search", filtros.search);

  if (
    filtros.sin_venta === true ||
    filtros.sin_venta === 1 ||
    filtros.sin_venta === "1"
  ) {
    params.set("sin_venta", "1");
  }

  params.set(
    "ordering",
    filtros.ordering || "-fecha_ultima_os"
  );

  const pageSize = filtros.page_size || filtros.limit || 100;

  params.set("page_size", String(pageSize));
  params.set("limit", String(pageSize));

  if (filtros.page) {
    params.set("page", String(filtros.page));
  }

  return params.toString();
}

// =====================================================
// OPCIONES DE FILTROS
// =====================================================
export function obtenerOpcionesRetencion(options = {}) {
  return http(
    `${API_VEHICULOS_RETENCION}/opciones/`,
    options
  );
}

export function obtenerOpcionesRetencionNoVentas(options = {}) {
  return http(
    `${API_VEHICULOS_RETENCION}/opciones/?sin_venta=1`,
    options
  );
}

// =====================================================
// LISTADO LIGERO DE VEHÍCULOS
// =====================================================
export function obtenerOrdenesRetencion(
  filtros = {},
  options = {}
) {
  const query = construirQuery(filtros);

  return http(
    `${API_VEHICULOS_RETENCION}/ligero/${query ? `?${query}` : ""}`,
    options
  );
}

// =====================================================
// HISTORIAL POR VIN
// =====================================================
export function obtenerHistorialRetencion(vin, options = {}) {
  return http(
    `${API_VEHICULOS_RETENCION}/${encodeURIComponent(vin)}/historial/`,
    options
  );
}

// =====================================================
// API PRINCIPAL DE RETENCIÓN
// =====================================================
export const apiRetencion = {
  // Listado completo de vehículos
  list: (filtros = {}, options = {}) => {
    const query = construirQuery(filtros);

    return http(
      `${API_VEHICULOS_RETENCION}/${query ? `?${query}` : ""}`,
      options
    );
  },

  // Indicadores de Retención
  resumen: (filtros = {}, options = {}) => {
    const query = construirQuery(filtros);

    return http(
      `${API_VEHICULOS_RETENCION}/resumen/${query ? `?${query}` : ""}`,
      options
    );
  },

  // Listado optimizado
  ligero: (filtros = {}, options = {}) =>
    obtenerOrdenesRetencion(filtros, options),

  // Opciones para filtros
  opciones: (options = {}) =>
    obtenerOpcionesRetencion(options),

  // Detalle de un vehículo
  get: (vin, options = {}) =>
    http(
      `${API_VEHICULOS_RETENCION}/${encodeURIComponent(vin)}/`,
      options
    ),

  // Historial de servicios del vehículo
  historial: (vin, options = {}) =>
    obtenerHistorialRetencion(vin, options),

  // =====================================================
  // TAREAS DE RETENCIÓN
  // Se conservan las rutas originales.
  // NO se migran en esta etapa.
  // =====================================================

  tareas: (telefono, options = {}) => {
    const params = new URLSearchParams();

    if (telefono) {
      params.set("telefono", telefono);
    }

    const query = params.toString();

    return http(
      `/retencion/api/tareas/${query ? `?${query}` : ""}`,
      options
    );
  },

  crearTarea: (payload, options = {}) =>
    http("/retencion/api/tareas/", {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify(payload),
    }),

  actualizarTarea: (id, cambios, options = {}) =>
    http(`/retencion/api/tareas/${id}/`, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify(cambios),
    }),

  eliminarTarea: (id, options = {}) =>
    http(`/retencion/api/tareas/${id}/`, {
      ...options,
      method: "DELETE",
    }),
};
