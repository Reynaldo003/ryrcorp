
 // src/lib/apiEtapasV3.js
 // Consulta de etapas V3 y registro manual de cotización con JWT.
 import { api } from "./apiPruebas";

 export const apiEtapasV3 = {
   consultar(expedienteId) {
     const id = Number(expedienteId);

     if (!Number.isSafeInteger(id) || id <= 0) {
       return Promise.reject(
         new Error("No hay un expediente válido seleccionado.")
       );
     }

     return api.get(`/digitales/api/etapas-v3/expedientes/${id}/`);
   },

   registrarCotizacion({
     expedienteId,
     fechaEnvio,
     vehiculo,
     referencia,
     claveIdempotencia,
   }) {
     const id = Number(expedienteId);

     if (!Number.isSafeInteger(id) || id <= 0) {
       return Promise.reject(
         new Error("No hay un expediente válido seleccionado.")
       );
     }

     return api.post("/digitales/api/etapas-v3/actividades/", {
       expediente_id: id,
       evento: "cotizacion_confirmada",
       clave_idempotencia: claveIdempotencia,
       datos: {
         confirmado: true,
         fecha_envio: fechaEnvio,
         vehiculo: vehiculo.trim(),
         referencia: referencia.trim(),
       },
     });
   },

    registrarCita({ expedienteId, citaId, claveIdempotencia }) {
    const expediente = Number(expedienteId);
    const cita = Number(citaId);

    if (
        !Number.isSafeInteger(expediente) ||
        expediente <= 0 ||
        !Number.isSafeInteger(cita) ||
        cita <= 0
    ) {
        return Promise.reject(
        new Error("El expediente o la cita no tienen un ID válido.")
        );
    }

    return api.post("/digitales/api/etapas-v3/actividades/", {
        expediente_id: expediente,
        evento: "cita_registrada",
        cita_id: cita,
        clave_idempotencia: claveIdempotencia,
        datos: {
        confirmado: true,
        },
    });
    },

    registrarAsistencia({
    expedienteId,
    citaId,
    fechaAsistenciaReal,
    claveIdempotencia,
    }) {
    const expediente = Number(expedienteId);
    const cita = Number(citaId);

    if (
        !Number.isSafeInteger(expediente) ||
        expediente <= 0 ||
        !Number.isSafeInteger(cita) ||
        cita <= 0
    ) {
        return Promise.reject(
        new Error("El expediente o la cita no tienen un ID válido.")
        );
    }

    return api.post("/digitales/api/etapas-v3/actividades/", {
        expediente_id: expediente,
        evento: "asistencia_confirmada",
        cita_id: cita,
        clave_idempotencia: claveIdempotencia,
        datos: {
        confirmado: true,
        fecha_asistencia_real: fechaAsistenciaReal,
        },
    });
    },

    registrarDocumentos({
    expedienteId,
    fechaRecepcion,
    documentos,
    claveIdempotencia
    }) {
    const id = Number(expedienteId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return Promise.reject(
        new Error("No hay un expediente válido seleccionado.")
        );
    }

    return api.post("/digitales/api/etapas-v3/actividades/", {
        expediente_id: id,
        evento: "documentos_recibidos_confirmados",
        clave_idempotencia: claveIdempotencia,
        datos: {
        confirmado: true,
        fecha_recepcion: fechaRecepcion,
        documentos
        }
    });
    },

  registrarAutorizacion({
    expedienteId,
    fechaAutorizacion,
    referenciaAutorizacion,
    claveIdempotencia,
  }) {
    const id = Number(expedienteId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Promise.reject(
        new Error("No hay un expediente válido seleccionado.")
      );
    }

    return api.post("/digitales/api/etapas-v3/actividades/", {
      expediente_id: id,
      evento: "seleccion_manual",
      clave_idempotencia: claveIdempotencia,
      datos: {
        etapa_destino: "autorizado_no_formalizado",
        credito_autorizado: true,
        confirmado: true,
        fecha_autorizacion: fechaAutorizacion,
        referencia_autorizacion: referenciaAutorizacion.trim(),
      },
    });
  },

  registrarCompraFutura({
    expedienteId,
    fechaPrevistaCompra,
    proximoContacto,
    observacion,
    claveIdempotencia,
  }) {
    const id = Number(expedienteId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Promise.reject(
        new Error("No hay un expediente válido seleccionado.")
      );
    }

    return api.post("/digitales/api/etapas-v3/actividades/", {
      expediente_id: id,
      evento: "seleccion_manual",
      clave_idempotencia: claveIdempotencia,
      datos: {
        etapa_destino: "compra_futura",
        confirmado: true,
        fecha_prevista_compra: fechaPrevistaCompra,
        proximo_contacto: proximoContacto,
        observacion: observacion.trim(),
      },
    });
  },

  registrarLeadPerdido({ expedienteId, motivo, detalleMotivo, claveIdempotencia }) {
    const id = Number(expedienteId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return Promise.reject(new Error("No hay un expediente válido seleccionado."));
    }
    return api.post("/digitales/api/etapas-v3/actividades/", {
      expediente_id: id,
      evento: "seleccion_manual",
      clave_idempotencia: claveIdempotencia,
      datos: {
        etapa_destino: "lead_perdido",
        confirmado: true,
        motivo,
        detalle_motivo: detalleMotivo.trim(),
      },
    });
  },

  // Mantener la firma antigua por compatibilidad con pantallas ya instaladas.
  reactivarCompraFutura(args) {
    return this.reactivarSituacion(args);
  },

  reactivarSituacion({
    expedienteId,
    motivo,
    claveIdempotencia,
  }) {
    const id = Number(expedienteId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return Promise.reject(
        new Error("No hay un expediente válido seleccionado.")
      );
    }

    return api.post("/digitales/api/etapas-v3/actividades/", {
      expediente_id: id,
      evento: "reactivacion",
      clave_idempotencia: claveIdempotencia,
      datos: {
        etapa_destino: "en_seguimiento",
        confirmado: true,
        motivo: motivo.trim(),
      },
    });
  },

 };