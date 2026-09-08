import { http, buildQuery } from "./apiClient";

export function getProspectosDigitales(params = {}) {
    return http(`/digitales/api/prospectos/${buildQuery(params)}`);
}

export function getProspectosStats(params = {}) {
    return http(`/digitales/analitica/prospectos-stats/${buildQuery(params)}`);
}

export function getProductividadAsesores(params = {}) {
    return http(`/digitales/analitica/productividad-asesores/${buildQuery(params)}`);
}

export function getLineasNegocio(params = {}) {
    return http(`/digitales/analitica/lineas-negocio/${buildQuery(params)}`);
}

export function getPautasOrigen(params = {}) {
    return http(`/digitales/analitica/pautas-origen/${buildQuery(params)}`);
}

export function getMotivosDescarte(params = {}) {
    return http(`/digitales/analitica/motivos-descarte/${buildQuery(params)}`);
}

export function getCitasStats(params = {}) {
    return http(`/digitales/analitica/citas-stats/${buildQuery(params)}`);
}

export function getCotizacionesStats(params = {}) {
    return http(`/digitales/analitica/cotizaciones-stats/${buildQuery(params)}`);
}

export function getSolicitudesFinanciamiento(params = {}) {
    return http(`/digitales/analitica/solicitudes-financiamiento/${buildQuery(params)}`);
}

export function getFacturadosStats(params = {}) {
    return http(`/digitales/analitica/facturados-stats/${buildQuery(params)}`);
}