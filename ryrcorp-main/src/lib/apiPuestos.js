// src/lib/apiPuestos.js
import { buildQuery, http } from "./apiClient";

const ENDPOINT_PUESTOS = "/api/rrhh/puestos/";
const ENDPOINT_EVALUACIONES = "/api/rrhh/evaluaciones-puestos/";

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function listarPuestos(params = {}) {
  const query = buildQuery({
    categoria: params.categoria,
    buscar: params.buscar,
  });

  const data = await http(`${ENDPOINT_PUESTOS}${query}`);

  return normalizarLista(data);
}

export async function listarEvaluaciones(puestoId = null) {
  const query = puestoId ? buildQuery({ puesto_id: puestoId }) : "";
  const data = await http(`${ENDPOINT_EVALUACIONES}${query}`);

  return normalizarLista(data);
}

export async function guardarEvaluacion(evaluacion) {
  return http(ENDPOINT_EVALUACIONES, {
    method: "POST",
    body: evaluacion,
  });
}

export default {
  listarPuestos,
  listarEvaluaciones,
  guardarEvaluacion,
};
