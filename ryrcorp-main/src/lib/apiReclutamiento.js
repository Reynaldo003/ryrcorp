// src/lib/apiReclutamiento.js
import { buildQuery, http } from "./apiClient";

const ENDPOINT = "/api/rrhh/vacantes/";

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizarFecha(valor) {
  if (!valor) return null;
  return valor;
}

function limpiarCandidato(candidato = {}) {
  return {
    id: candidato.id || candidato.id_candidato || null,
    id_candidato: candidato.id_candidato || candidato.id || null,

    nombre: candidato.nombre || "",
    sexo: candidato.sexo || "",
    telefono: candidato.telefono || "",
    correo: candidato.correo || "",
    ubicacion: candidato.ubicacion || "",

    puesto_postulado: candidato.puesto_postulado || "",
    fuente: candidato.fuente || "",
    estatus: candidato.estatus || "Nuevo",

    cv: candidato.cv || "",

    fecha_entrevista_do: normalizarFecha(candidato.fecha_entrevista_do),
    fecha_entrevista_gerente: normalizarFecha(candidato.fecha_entrevista_gerente),
    fecha_respuesta_gerente: normalizarFecha(candidato.fecha_respuesta_gerente),

    fecha_alta_khor: normalizarFecha(candidato.fecha_alta_khor),
    fecha_realizacion_khor: normalizarFecha(candidato.fecha_realizacion_khor),
    fecha_entrega_resultados_khor: normalizarFecha(candidato.fecha_entrega_resultados_khor),

    tipo_validacion_socioeconomica:
      candidato.tipo_validacion_socioeconomica || "No aplica",

    fecha_solicitud_estudio_socioeconomico: normalizarFecha(
      candidato.fecha_solicitud_estudio_socioeconomico,
    ),
    fecha_entrega_reporte_socioeconomico: normalizarFecha(
      candidato.fecha_entrega_reporte_socioeconomico,
    ),

    fecha_solicitud_referencias_laborales: normalizarFecha(
      candidato.fecha_solicitud_referencias_laborales,
    ),
    fecha_entrega_referencias_laborales: normalizarFecha(
      candidato.fecha_entrega_referencias_laborales,
    ),

    fecha_solicitud_alta: normalizarFecha(candidato.fecha_solicitud_alta),
    fecha_respuesta_alta: normalizarFecha(candidato.fecha_respuesta_alta),
    fecha_ingreso: normalizarFecha(candidato.fecha_ingreso),

    comentarios: candidato.comentarios || "",
  };
}

function limpiarPayload(payload = {}) {
  const formData = new FormData();

  formData.append("estatus", payload.estatus || "Publicada");
  formData.append("puesto", payload.puesto || "");
  formData.append("dealer", payload.dealer || "");
  formData.append(
    "fuente_reclutamiento",
    payload.fuente_reclutamiento || "Base de datos"
  );
  formData.append("solicitado_por", payload.solicitado_por || "");

  const candidatos = Array.isArray(payload.candidatos)
    ? payload.candidatos
    : [];

  formData.append(
    "candidatos",
    JSON.stringify(
      candidatos.map((c) => {
        const copia = { ...limpiarCandidato(c) };
        delete copia.cv;
        delete copia.cv_archivo;
        return copia;
      })
    )
  );

  candidatos.forEach((candidato, index) => {
    if (candidato.cv_archivo instanceof File) {
      formData.append(
        `cv_archivo_${index}`,
        candidato.cv_archivo
      );
    }
  });

  return formData;
}

export const apiReclutamiento = {
  async listarVacantes(params = {}) {
    const { q, ...rest } = params || {};
    const data = await http(
      `${ENDPOINT}${buildQuery({ ...rest, buscar: q || rest.buscar })}`,
    );

    return normalizarLista(data);
  },

  async crearVacante(payload) {
    return http(ENDPOINT, {
      method: "POST",
      body: limpiarPayload(payload),
    });
  },

  async actualizarVacante(idVacante, payload) {
    return http(`${ENDPOINT}${idVacante}/`, {
      method: "PATCH",
      body: limpiarPayload(payload),
    });
  },

  async eliminarVacante(idVacante) {
    await http(`${ENDPOINT}${idVacante}/`, {
      method: "DELETE",
    });

    return { ok: true };
  },
};

export default apiReclutamiento;
