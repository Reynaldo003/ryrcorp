// src/lib/apiAmbienteLaboral.js
import { buildQuery, http } from "./apiClient";

const ENDPOINT_RESUMEN = "/api/rrhh/ambiente-laboral/evaluaciones/resumen/";
const ENDPOINT_UPSERT = "/api/rrhh/ambiente-laboral/evaluaciones/upsert/";

export async function obtenerResumen(dealer, anio) {
  const query = buildQuery({ dealer, anio });
  return http(`${ENDPOINT_RESUMEN}${query}`);
}

export async function guardarEvaluacionDominio({
  idDominio,
  dealer,
  anio,
  puntuacion,
  planAccion,
  seguimiento,
  archivoEvidencia,
}) {
  const formData = new FormData();
  formData.append("dominio", idDominio);
  formData.append("dealer", dealer);
  formData.append("anio", anio);
  formData.append("puntuacion", puntuacion ?? "");
  formData.append("plan_accion", planAccion ?? "");
  formData.append("seguimiento", seguimiento ?? "");
  if (archivoEvidencia instanceof File) {
    formData.append("evidencia", archivoEvidencia);
  }

  return http(ENDPOINT_UPSERT, {
    method: "POST",
    body: formData,
  });
}

export default {
  obtenerResumen,
  guardarEvaluacionDominio,
};