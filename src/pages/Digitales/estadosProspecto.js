// src/pages/Digitales/estadosProspecto.js

export const ESTADOS_PROSPECTO = [
    { key: "contactado", label: "Contactado", color: "#F59E0B", match: ["contactado"] },
    { key: "sin_respuesta", label: "Sin Respuesta", color: "#64748B", match: ["sin respuesta", "sin_respuesta"] },
    { key: "calificado", label: "Calificado", color: "#10B981", match: ["calificado"] },
    { key: "cotizacion", label: "Pendiente de Cotización", color: "#8B5CF6", match: ["pendiente de cotizacion", "pendiente de cotización", "cotización", "cotizacion"] },
    { key: "requiere_atencion", label: "Requiere Atención", color: "#f9cf16", match: ["requiere atencion", "requiere atención", "requiere_atencion"] },
    { key: "requiere_asesor", label: "Requiere Asesor", color: "#B45309", match: ["requiere asesor", "requiere_asesor"] },
    { key: "cita_programada", label: "Cita Programada", color: "#0891B2", match: ["cita programada", "cita_programada"] },
    { key: "asistencia_cita", label: "Asistencia a la Cita", color: "#059669", match: ["asistencia a la cita", "asistencia_cita"] },
    { key: "no_show", label: "No asistió", color: "#DC2626", match: ["no show", "no_show", "noshow", "no asistio", "no asistió"] },
    { key: "financiamiento", label: "Financiamiento", color: "#2563EB", match: ["financiamiento"] },
    { key: "documentos_enviados", label: "Documentos Enviados", color: "#0D9488", match: ["documentos enviados", "documentos_enviados"] },
    { key: "solicitud_credito", label: "Solicitud de Crédito", color: "#7C3AED", match: ["solicitud de credito", "solicitud de crédito", "solicitud_credito"] },
    { key: "autorizado_no_formalizado", label: "Autorizado No Formalizado", color: "#CA8A04", match: ["autorizado no formalizado", "autorizado_no_formalizado"] },
    { key: "cierre_venta", label: "Cierre de la Venta", color: "#16A34A", match: ["cierre de la venta", "cierre_venta", "cierre de venta"] },
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
    .filter((e) => e.key !== "cierre_venta")
    .map((e) => e.label);

export const ESTADOS_OPCIONES_BANDEJA = ESTADOS_PROSPECTO.filter(
    (e) => e.key !== "cierre_venta" && e.key !== "requiere_asesor"
);
