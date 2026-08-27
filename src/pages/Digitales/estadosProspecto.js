// src/pages/Digitales/estadosProspecto.js

export const ESTADOS_PROSPECTO = [
    { key: "sin_contactar", label: "Sin Contactar", color: "#94A3B8", match: ["sin contactar", "sin_contactar"] },
    { key: "contactado", label: "Contactado", color: "#F59E0B", match: ["contactado"] },
    { key: "sin_respuesta", label: "Sin Respuesta", color: "#64748B", match: ["sin respuesta", "sin_respuesta"] },
    { key: "calificado", label: "Calificado", color: "#10B981", match: ["calificado"] },
    { key: "cotizacion", label: "Pendiente de Cotización", color: "#8B5CF6", match: ["pendiente de cotizacion", "pendiente de cotización", "cotización", "cotizacion"] },
    { key: "requiere_atencion", label: "Requiere Atención", color: "#f9cf16", match: ["requiere atencion", "requiere atención", "requiere_atencion"] },
    { key: "cita_programada", label: "Cita Programada", color: "#0891B2", match: ["cita programada", "cita_programada"] },
    { key: "asistencia_cita", label: "Asistencia a la Cita", color: "#059669", match: ["asistencia a la cita", "asistencia_cita"] },
    { key: "no_show", label: "No asistió", color: "#DC2626", match: ["no show", "no_show", "noshow", "no asistio", "no asistió"] },
    { key: "financiamiento", label: "Financiamiento", color: "#2563EB", match: ["financiamiento"] },
    { key: "recopilacion_documentos", label: "Recopilación de Documentos", color: "#0891B2", match: ["recopilacion de documentos", "recopilacion_documentos", "recopilación de documentos"] },
    { key: "documentos_enviados", label: "Documentos Enviados", color: "#0D9488", match: ["documentos enviados", "documentos_enviados"] },
    { key: "seguimiento", label: "Seguimiento", color: "#6366F1", match: ["seguimiento"] },
    { key: "solicitud_credito", label: "Solicitud de Crédito", color: "#7C3AED", match: ["solicitud de credito", "solicitud de crédito", "solicitud_credito"] },
    { key: "autorizado_no_formalizado", label: "Autorizado No Formalizado", color: "#CA8A04", match: ["autorizado no formalizado", "autorizado_no_formalizado"] },
    { key: "facturado", label: "Facturado", color: "#0284C7", match: ["facturado"] },
    { key: "entregado", label: "Entregado", color: "#059669", match: ["entregado"] },
    { key: "descalificado", label: "Descalificado", color: "#94A3B8", match: ["descalificado"] },
];

export function normalizaEstado(value) {
    return String(value || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

export function resolverEstado(valor) {
    const v = normalizaEstado(valor);
    return (
        ESTADOS_PROSPECTO.find((e) => e.match.some((m) => normalizaEstado(m) === v)) ||
        ESTADOS_PROSPECTO[0]
    );
}


export const ETIQUETAS_ESTADO = ESTADOS_PROSPECTO
    .filter((e) => e.key !== "cierre_venta" && e.key !== "requiere_asesor")
    .map((e) => e.label);

export const ESTADOS_OPCIONES_BANDEJA = ESTADOS_PROSPECTO.filter(
    (e) => e.key !== "cierre_venta" && e.key !== "requiere_asesor" && e.key !== "sin_contactar"
);

export const ESTADOS_LABELS = ESTADOS_OPCIONES_BANDEJA.map((e) => e.label);
