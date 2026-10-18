
 // src/lib/apiEtapasV3.js
 // Consulta de etapas V3 y registro manual de cotización con JWT.
 import { api } from "./apiPruebas";

 export const apiEtapasV3 = {
   disponibilidad() {
     return api.get("/digitales/api/etapas-v3/disponibilidad/");
   },

   agendarCitaChat({ expedienteId, fechaHoraCita, agencia, asesorPiso, comentarios, claveIdempotencia }) {
     return api.post("/digitales/api/etapas-v3/citas-chat/", {
       expediente_id: Number(expedienteId),
       fecha_hora_cita: fechaHoraCita,
       agencia, asesor_piso: asesorPiso,
       comentarios: comentarios || "",
       clave_idempotencia: claveIdempotencia,
     });
   },

   clasificarHistorico({ expedienteId, etapaDestino, datos, motivo, claveIdempotencia }) {
     return api.post("/digitales/api/etapas-v3/clasificar-historico/", {
       expediente_id: Number(expedienteId), etapa_destino: etapaDestino, datos,
       motivo: motivo.trim(), confirmado: true, clave_idempotencia: claveIdempotencia,
     });
   },

   registrarContactoExterno({ expedienteId, medio, fechaContacto, observacion, claveIdempotencia }) {
     return api.post("/digitales/api/etapas-v3/actividades/", {
       expediente_id: Number(expedienteId), evento: "contacto_externo_confirmado",
       clave_idempotencia: claveIdempotencia,
       datos: { confirmado: true, medio, fecha_contacto: fechaContacto, observacion },
     });
   },

   corregirActividad({ expedienteId, actividadId, cambios, motivo, claveIdempotencia }) {
     return api.post("/digitales/api/etapas-v3/correcciones/", {
       expediente_id: Number(expedienteId),
       actividad_id: Number(actividadId),
       cambios,
       motivo,
       clave_idempotencia: claveIdempotencia,
     });
   },

   consultar(expedienteId) {
     const id = Number(expedienteId);

     if (!Number.isSafeInteger(id) || id <= 0) {
       return Promise.reject(
         new Error("No hay un expediente válido seleccionado.")
       );
     }

     return api.get(`/digitales/api/etapas-v3/expedientes/${id}/`);
   },

   registrarFacturacionVin({ expedienteId, vin }) {
     const id = Number(expedienteId);
     if (!Number.isSafeInteger(id) || id <= 0) {
       return Promise.reject(new Error("No hay expediente seleccionado."));
     }
     return api.post(`/digitales/api/prospectos/${id}/facturacion-v3/`, {
       vin_facturado: vin.trim().toUpperCase(), confirmado: true,
     });
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