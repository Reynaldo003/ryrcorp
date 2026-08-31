import { buildQuery, http } from "./apiClient";

const BASE_URL = "/gestion_inversion/api";

const authOptions = {
  retryWithoutAuth: false,
};

function unwrapData(response) {
  return response?.data ?? response;
}

function requireId(id, mensaje = "Falta el ID solicitado.") {
  if (id !== undefined && id !== null && String(id).trim() !== "") {
    return;
  }

  throw new Error(mensaje);
}

export const apiAnalisisFacturas = {
  // ============================================================
  // FACTURAS
  // ============================================================

  list: async ({
    q = "",
    clasificacion = "",
    sitio = "",
    estado = "",
  } = {}) => {
    const response = await http(
      `${BASE_URL}/facturas/${buildQuery({
        q,
        clasificacion,
        sitio,
        estado,
      })}`,
      authOptions,
    );

    return unwrapData(response);
  },

  get: async (id) => {
    requireId(id, "Falta el ID de la factura.");

    const response = await http(
      `${BASE_URL}/facturas/${encodeURIComponent(id)}/`,
      authOptions,
    );

    return unwrapData(response);
  },

  analizar: async (archivo) => {
    if (!(archivo instanceof File)) {
      throw new Error("Selecciona un archivo PDF válido.");
    }

    const formData = new FormData();

    formData.set("archivo", archivo);

    const response = await http(`${BASE_URL}/facturas/analizar/`, {
      ...authOptions,
      method: "POST",
      body: formData,
    });

    return unwrapData(response);
  },

  reanalizar: async (facturaId) => {
    requireId(facturaId, "Falta el ID de la factura.");

    const response = await http(
      `${BASE_URL}/facturas/${encodeURIComponent(facturaId)}/reanalisar/`,
      {
        ...authOptions,
        method: "POST",
        data: {},
      },
    );

    return unwrapData(response);
  },

  remove: async (facturaId) => {
    requireId(facturaId, "Falta el ID de la factura.");

    return http(`${BASE_URL}/facturas/${encodeURIComponent(facturaId)}/`, {
      ...authOptions,
      method: "DELETE",
    });
  },

  // ============================================================
  // CONCEPTOS
  // ============================================================

  updateConcepto: async (conceptoId, payload = {}) => {
    requireId(conceptoId, "Falta el ID del concepto.");

    const response = await http(
      `${BASE_URL}/conceptos/${encodeURIComponent(conceptoId)}/`,
      {
        ...authOptions,
        method: "PATCH",
        data: payload,
      },
    );

    return unwrapData(response);
  },
};
