// src/lib/apiDocumentacion.js
import { buildQuery, http } from "./apiClient";

const BASE_URL = "/documentacion/api";

const authOptions = { retryWithoutAuth: false };

function unwrapData(response) {
  return response?.data ?? response;
}

function requireId(id, mensaje = "Falta el ID solicitado.") {
  if (id !== undefined && id !== null && String(id).trim() !== "") return;
  throw new Error(mensaje);
}

export const apiDocumentacion = {
  // ============================================================
  // EXPEDIENTES
  // ============================================================

  list: () => http(`${BASE_URL}/expedientes/`, authOptions),

  get: (id) => {
    requireId(id, "Falta el ID del expediente.");
    return http(
      `${BASE_URL}/expedientes/${encodeURIComponent(id)}/`,
      authOptions,
    );
  },

  create: async (payload = {}) => {
    const response = await http(`${BASE_URL}/expedientes/`, {
      ...authOptions,
      method: "POST",
      data: payload,
    });

    return unwrapData(response);
  },

  // ============================================================
  // REQUISITOS
  // ============================================================

  requisitos: (tipoPersona, financiamiento) => {
    if (!tipoPersona)
      return Promise.reject(new Error("Falta el tipo de persona."));
    if (!financiamiento)
      return Promise.reject(new Error("Falta el tipo de financiamiento."));

    return http(
      `${BASE_URL}/requisitos/${buildQuery({
        tipo_persona: tipoPersona,
        financiamiento,
      })}`,
      authOptions,
    );
  },

  // ============================================================
  // DOCUMENTOS
  // ============================================================

  upload: async (expedienteId, requisitoId, archivo) => {
    requireId(expedienteId, "Falta el ID del expediente.");

    if (!requisitoId) throw new Error("Falta el requisito del documento.");
    if (!archivo) throw new Error("Selecciona un archivo PDF.");
    if (!(archivo instanceof File))
      throw new Error("El archivo seleccionado no es válido.");

    const formData = new FormData();
    formData.set("requisito_id", String(requisitoId));
    formData.set("archivo", archivo);

    const response = await http(
      `${BASE_URL}/expedientes/${encodeURIComponent(expedienteId)}/documentos/`,
      {
        ...authOptions,
        method: "POST",
        body: formData,
      },
    );

    return unwrapData(response);
  },

  removeDocumento: async (idDocumento) => {
    requireId(idDocumento, "Falta el ID del documento.");

    return http(`${BASE_URL}/documentos/${encodeURIComponent(idDocumento)}/`, {
      ...authOptions,
      method: "DELETE",
    });
  },

  guardarFormatoPdf: async (expedienteId, { archivo, plantilla, campos }) => {
    requireId(expedienteId, "Falta el ID del expediente.");

    if (!(archivo instanceof File)) {
      throw new Error("No se recibió un PDF válido.");
    }

    if (!plantilla) {
      throw new Error("No se recibió la plantilla.");
    }

    const formData = new FormData();

    formData.set("archivo", archivo);

    formData.set("plantilla", plantilla);

    formData.set("campos", JSON.stringify(campos || {}));

    const response = await http(
      `${BASE_URL}/expedientes/${encodeURIComponent(expedienteId)}/formato-pdf/`,
      {
        ...authOptions,
        method: "POST",
        body: formData,
      },
    );

    return unwrapData(response);
  },
};
