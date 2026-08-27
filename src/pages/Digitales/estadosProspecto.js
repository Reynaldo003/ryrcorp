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

// ─── Derivación automática de bandeja/estado ────────────────────────────────

const ESTADOS_NO_SOBRESCRIBIR_POR_PLAZO = new Set([
    "descalificado",
    "cita programada",
    "asistencia a la cita",
    "no show",
    "no asistio",
    "financiamiento",
    "recopilacion de documentos",
    "recopilación de documentos",
    "documentos enviados",
    "solicitud de credito",
    "solicitud de crédito",
    "no asistio",
    "no asistió",
    "no show",
    "no_show",
    "noshow",
    "autorizado no formalizado",
    "facturado",
    "entregado",
]);

const ESTADOS_NO_SOBRESCRIBIR_FOLIO = new Set([
    "descalificado",
    "financiamiento",
    "recopilacion de documentos",
    "recopilación de documentos",
    "documentos enviados",
    "solicitud de credito",
    "solicitud de crédito",
    "no asistio",
    "no asistió",
    "no show",
    "no_show",
    "noshow",
    "autorizado no formalizado",
    "facturado",
    "entregado",
]);

const ESTADOS_NO_SOBRESCRIBIR_RECOPILACION = new Set([
    "descalificado",
    "financiamiento",
    "recopilacion de documentos",
    "recopilación de documentos",
    "documentos enviados",
    "solicitud de credito",
    "solicitud de crédito",
    "no asistio",
    "no asistió",
    "no show",
    "no_show",
    "noshow",
    "autorizado no formalizado",
    "facturado",
    "entregado",
]);

// Verifica que exista al menos un PDF cargado (por nombre o tipo MIME).
export function tienePdfEnEvidencias(evidencias) {
    const lista = Array.isArray(evidencias) ? evidencias : [];
    return lista.some((ev) => {
        const nombre = String(
            ev?.name || ev?.nombre || ev?.filename || ev?.file?.name || ""
        ).toLowerCase();
        const tipo = String(
            ev?.type || ev?.mime_type || ev?.content_type || ev?.file?.type || ""
        ).toLowerCase();
        return nombre.endsWith(".pdf") || tipo.includes("pdf");
    });
}

// "Ya fue contactado" = cualquier estado distinto de vacío o "Sin Contactar".
export function yaFueContactado(estado) {
    const e = normalizaEstado(estado || "");
    return e !== "" && e !== "sin contactar" && e !== "sin_contactar";
}

export function estadoBandejaSegunPlazo(plazo, estadoActual) {
    const plazoNorm = normalizaEstado(plazo || "");
    const esPlazoSeguimiento =
        plazoNorm === "3 a 6 meses" ||
        plazoNorm === "mas de 6 meses" ||
        plazoNorm === "más de 6 meses";
    if (!esPlazoSeguimiento) return estadoActual;
    if (ESTADOS_NO_SOBRESCRIBIR_POR_PLAZO.has(normalizaEstado(estadoActual || ""))) {
        return estadoActual;
    }
    return "Seguimiento";
}

export function estadoBandejaVinEntregado(vinFacturado, vinEstatus, estadoActual) {
    if (
        String(vinFacturado || "").trim() &&
        normalizaEstado(vinEstatus || "") === "entregado"
    ) {
        return "Entregado";
    }
    return estadoActual;
}

export function estadoBandejaVinFacturado(vinFacturado, vinEstatus, estadoActual) {
    if (normalizaEstado(estadoActual || "") === "descalificado") return estadoActual;
    if (
        String(vinFacturado || "").trim() &&
        normalizaEstado(vinEstatus || "") !== "entregado"
    ) {
        return "Facturado";
    }
    return estadoActual;
}

export function estadoBandejaFolioCredito(folio, estadoActual) {
    if (
        String(folio || "").trim() &&
        !ESTADOS_NO_SOBRESCRIBIR_FOLIO.has(normalizaEstado(estadoActual || ""))
    ) {
        return "Solicitud de Crédito";
    }
    return estadoActual;
}

export function estadoBandejaRecopilacionDocumentos({
    tienePdf,
    yaContactado,
    folioSolicitudCredito,
    estadoActual,
}) {
    if (!tienePdf || !yaContactado) return estadoActual;
    if (String(folioSolicitudCredito || "").trim()) return estadoActual; // el folio va a Solicitud de Crédito
    if (
        ESTADOS_NO_SOBRESCRIBIR_RECOPILACION.has(normalizaEstado(estadoActual || ""))
    ) {
        return estadoActual;
    }
    return "Recopilación de Documentos";
}

// Orden de prioridad:
//   1) VIN facturado + entregado              -> Entregado
//   2) VIN facturado (sin entregar)           -> Facturado
//   3) Folio de solicitud de crédito          -> Solicitud de Crédito
//   4) Contactado + PDF cargado + sin folio    -> Recopilación de Documentos
//   5) Plazo 3 a 6 meses o más                 -> Seguimiento
export function tieneCalificacionRapida({
    enganche_monto,
    presupuesto_mensual,
    buro_estado,
    plazo_compra,
} = {}) {
    return Boolean(
        String(enganche_monto || "").trim() ||
        String(presupuesto_mensual || "").trim() ||
        String(buro_estado || "").trim() ||
        String(plazo_compra || "").trim()
    );
}

const ESTADOS_NO_SOBRESCRIBIR_NOSHOW = new Set([
    "descalificado",
    "no asistio",
    "no asistió",
    "no show",
    "no_show",
    "noshow",
    "facturado",
    "entregado",
]);

export function estadoBandejaNoShow({
    yaContactado,
    calificacionRapidaLlena,
    citaNoAsistio,
    estadoActual,
}) {
    if (!citaNoAsistio || !yaContactado || !calificacionRapidaLlena) return estadoActual;
    if (ESTADOS_NO_SOBRESCRIBIR_NOSHOW.has(normalizaEstado(estadoActual || ""))) return estadoActual;
    return "No asistió";
}

export function citaEsNoAsistio(cita) {
    if (!cita) return false;
    if (cita.asistencia === true) return false;
    if (cita.asistencia === false) return true;
    const e = normalizaEstado(cita.estado_cita || "");
    return e === "no asistio" || e === "no_show" || e === "noshow" || e === "no asistió" || e === "no show";
}

export function estadoAutomaticoBandeja({
    plazo,
    vinFacturado,
    vinEstatus,
    folioSolicitudCredito,
    evidencias,
    calificacionRapidaLlena = false,
    citaNoAsistio = false,
    estadoBase = "",
}) {
    const porPlazo = estadoBandejaSegunPlazo(plazo, estadoBase);
    const porVinEntregado = estadoBandejaVinEntregado(vinFacturado, vinEstatus, porPlazo);
    const porVinFacturado = estadoBandejaVinFacturado(vinFacturado, vinEstatus, porVinEntregado);
    const yaContactado = yaFueContactado(estadoBase);
    const porNoShow = estadoBandejaNoShow({
        yaContactado,
        calificacionRapidaLlena,
        citaNoAsistio,
        estadoActual: porVinFacturado,
    });
    const porFolio = estadoBandejaFolioCredito(folioSolicitudCredito, porNoShow);
    const porRecopilacion = estadoBandejaRecopilacionDocumentos({
        tienePdf: tienePdfEnEvidencias(evidencias),
        yaContactado,
        folioSolicitudCredito,
        estadoActual: porFolio,
    });
    return porRecopilacion;
}
