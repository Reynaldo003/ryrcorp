import { http, buildQuery } from "./apiClient";

export function getProspectosDigitales(params = {}) {
    return http(`/digitales/api/prospectos/${buildQuery(params)}`);
}

export function getProspectosStats(params = {}) {
    return http(`/digitales/analitica/prospectos-stats/${buildQuery(params)}`);
}