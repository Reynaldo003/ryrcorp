import { http } from "./apiClient";

const TTL_ASESORES_MS = 5 * 60 * 1000;
const cacheAsesores = new Map();
const solicitudesPendientes = new Map();
let generacionCache = 0;
const oyentesInvalidacion = new Set();

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizarFiltros({
  activo = true,
  tipoAsesor = "",
  area = "",
  agencia = "",
} = {}) {
  return {
    activo,
    tipoAsesor: String(tipoAsesor || "").trim(),
    area: String(area || "").trim(),
    agencia: String(agencia || "").trim(),
  };
}

function claveFiltros(filtros) {
  return JSON.stringify([
    filtros.activo,
    filtros.tipoAsesor,
    filtros.area,
    filtros.agencia,
  ]);
}

export function leerAsesoresCache(opciones = {}) {
  const clave = claveFiltros(normalizarFiltros(opciones));
  const entrada = cacheAsesores.get(clave);
  if (!entrada) return null;
  if (Date.now() >= entrada.vence) {
    cacheAsesores.delete(clave);
    return null;
  }
  return entrada.datos;
}

// Llamar después de guardar/editar un asesor desde el panel de administración.
export function invalidarCacheAsesores() {
  generacionCache += 1;
  cacheAsesores.clear();
  solicitudesPendientes.clear();
  oyentesInvalidacion.forEach((notificar) => notificar());
}

export function suscribirseInvalidacionAsesores(notificar) {
  oyentesInvalidacion.add(notificar);
  return () => oyentesInvalidacion.delete(notificar);
}

export function obtenerAsesores(opciones = {}) {
  const filtros = normalizarFiltros(opciones);
  const clave = claveFiltros(filtros);
  const datosCache = leerAsesoresCache(filtros);
  if (datosCache !== null) return Promise.resolve(datosCache);
  if (solicitudesPendientes.has(clave)) return solicitudesPendientes.get(clave);

  const params = new URLSearchParams();
  if (filtros.activo === true || filtros.activo === false) {
    params.set("activo", filtros.activo ? "true" : "false");
  }
  if (filtros.tipoAsesor) params.set("tipo_asesor", filtros.tipoAsesor);
  if (filtros.area) params.set("area", filtros.area);
  if (filtros.agencia) params.set("agencia", filtros.agencia);
  const query = params.toString();
  const generacionSolicitud = generacionCache;

  const solicitud = http(`/digitales/asesores/${query ? `?${query}` : ""}`)
    .then((respuesta) => {
      const datos = normalizarLista(respuesta);
      if (generacionSolicitud !== generacionCache)
        return obtenerAsesores(filtros);
      cacheAsesores.set(clave, { datos, vence: Date.now() + TTL_ASESORES_MS });
      return datos;
    })
    .finally(() => {
      if (solicitudesPendientes.get(clave) === solicitud)
        solicitudesPendientes.delete(clave);
    });

  solicitudesPendientes.set(clave, solicitud);
  return solicitud;
}

export function obtenerNombreAsesor(asesor) {
  return String(asesor?.nombre || "").trim();
}

export function nombresUnicosAsesores(asesores = []) {
  const vistos = new Set();
  const resultado = [];
  asesores.forEach((asesor) => {
    const nombre =
      typeof asesor === "string" ? asesor.trim() : obtenerNombreAsesor(asesor);
    if (!nombre) return;
    const llave = nombre.toLocaleLowerCase();
    if (vistos.has(llave)) return;
    vistos.add(llave);
    resultado.push(nombre);
  });
  return resultado;
}
