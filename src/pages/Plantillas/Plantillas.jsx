//src/pages/Plantillas/Plantillas.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    Braces,
    CheckCircle2,
    Clock3,
    Edit3,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";
import { useAuth } from "../../auth/AuthContext";

const inputCls = "w-full rounded-xl border border-[#E4E7F0] bg-white px-3.5 py-2.5 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10";
const textareaCls = `${inputCls} resize-y`;

const HEADER_MEDIA_RULES = {
    IMAGE: {
        accept: "image/jpeg,image/png",
        mime: ["image/jpeg", "image/png"],
        maxBytes: 5 * 1024 * 1024,
        maxLabel: "5 MB",
        label: "imagen",
    },
    VIDEO: {
        accept: "video/mp4",
        mime: ["video/mp4"],
        maxBytes: 16 * 1024 * 1024,
        maxLabel: "16 MB",
        label: "video",
    },
    DOCUMENT: {
        accept: "application/pdf",
        mime: ["application/pdf"],
        maxBytes: 100 * 1024 * 1024,
        maxLabel: "100 MB",
        label: "documento PDF",
    },
};
const STATUS_CFG = {
    APPROVED: { label: "Aprobada", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    PENDING: { label: "En revisión", cls: "border-amber-200 bg-amber-50 text-amber-700" },
    REJECTED: { label: "Rechazada", cls: "border-red-200 bg-red-50 text-red-700" },
    PAUSED: { label: "Pausada", cls: "border-orange-200 bg-orange-50 text-orange-700" },
    DISABLED: { label: "Deshabilitada", cls: "border-gray-200 bg-gray-100 text-gray-600" },
    IN_APPEAL: { label: "En apelación", cls: "border-blue-200 bg-blue-50 text-blue-700" },
    PENDING_DELETION: { label: "Pendiente de eliminación", cls: "border-slate-200 bg-slate-50 text-slate-700" },
    FLAGGED: { label: "Con observaciones", cls: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" },
    DELETED: { label: "Eliminada", cls: "border-slate-200 bg-slate-100 text-slate-600" },
};

const DEFAULT_RULES = [
    "Debe responder a una solicitud, cita o proceso que el cliente ya inició.",
    "Debe informar, confirmar o actualizar un proceso existente.",
    "Evita promociones, descuentos, precios especiales y llamados de compra.",
    "No mezcles una actualización operativa con recomendaciones comerciales.",
    "Usa variables para datos concretos: nombre, fecha, hora, folio o modelo solicitado.",
];

const MARKETING_SIGNALS = [
    ["promoción", 28], ["promocion", 28], ["oferta", 28], ["descuento", 30],
    ["bono", 24], ["cashback", 30], ["gratis", 25], ["sin costo", 22],
    ["precio especial", 30], ["meses sin intereses", 30], ["enganche desde", 28],
    ["mensualidad desde", 28], ["aprovecha", 24], ["por tiempo limitado", 28],
    ["últimos días", 25], ["ultimos dias", 25], ["estrena", 24], ["compra", 18],
    ["cotiza", 18], ["descubre", 16], ["nuevo lanzamiento", 25],
    ["agenda una prueba", 18], ["visítanos", 16], ["visitanos", 16],
];

const UTILITY_ANCHORS = [
    "confirmamos tu cita", "recordatorio de tu cita", "tu solicitud",
    "solicitud registrada", "seguimiento de tu solicitud", "folio", "pedido",
    "factura", "pago recibido", "servicio programado", "mantenimiento programado",
    "documento pendiente", "cambio solicitado", "prueba de manejo programada",
];

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");

    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;

    return digits;
}

function getUserPhones(user) {
    const raw =
        user?.telefono ||
        user?.numero_asesor ||
        user?.whatsapp_number ||
        user?.phone ||
        "";

    const valores = Array.isArray(raw)
        ? raw
        : String(raw || "").split(/[|,;\n]+/);

    return [
        ...new Set(
            valores
                .map((numero) => normalizePhone(numero))
                .filter((numero) => /^52\d{10}$/.test(numero))
        ),
    ];
}

function isAdministrator(user) {
    const permissions = Array.isArray(user?.permisos) ? user.permisos : [];
    const role = normalizeText(
        typeof user?.rol === "object"
            ? user?.rol?.nombre || user?.rol?.name || ""
            : user?.rol,
    );

    return (
        role === "administrador" ||
        permissions.includes("ALL") ||
        permissions.includes("USUARIOS_ADMIN")
    );
}

function isDigitalCoordinator(user) {
    const role = normalizeText(
        typeof user?.rol === "object"
            ? user?.rol?.nombre ||
            user?.rol?.name ||
            ""
            : user?.rol
    );

    const permissions = (
        Array.isArray(user?.permisos)
            ? user.permisos
            : []
    )
        .map((permission) =>
            normalizeText(
                typeof permission === "object"
                    ? permission?.codigo ||
                    permission?.nombre ||
                    permission?.name ||
                    ""
                    : permission
            )
        )
        .filter(Boolean);

    return (
        role === "coordinador digital" ||
        role === "coordinador_digital" ||
        permissions.includes(
            "crm_coordinador_digital"
        )
    );
}

function emptyDraft() {
    return {
        id: "",
        name: "",
        language: "es_MX",
        category: "UTILITY",

        headerType: "NONE",
        headerText: "",
        headerExamples: {},
        headerFile: null,
        headerFileName: "",
        headerPreview: "",
        headerHandle: "",
        headerUploading: false,

        preservedHeader: null,

        body: "",
        bodyExamples: {},
        footer: "",

        buttons: [],

        aceptarRiesgo: false,
        allowCategoryChange: true,
    };
}

function normalizeName(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_");
}

function variableIndexes(text) {
    const found = [...String(text || "").matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
    return [...new Set(found)].sort((a, b) => a - b);
}

function normalizeVariablesAndExamples(text, examples = {}) {
    const mapping = new Map();
    let nextIndex = 1;

    const normalizedText = String(text || "").replace(/\{\{(\d+)\}\}/g, (_, rawIndex) => {
        const oldIndex = Number(rawIndex);

        if (!mapping.has(oldIndex)) {
            mapping.set(oldIndex, nextIndex);
            nextIndex += 1;
        }

        return `{{${mapping.get(oldIndex)}}}`;
    });

    const normalizedExamples = {};

    mapping.forEach((newIndex, oldIndex) => {
        normalizedExamples[newIndex] = String(examples?.[oldIndex] || "");
    });

    return {
        text: normalizedText,
        examples: normalizedExamples,
    };
}

function insertTokenAtSelection(text, token, element) {
    const value = String(text || "");
    const start = Number.isInteger(element?.selectionStart) ? element.selectionStart : value.length;
    const end = Number.isInteger(element?.selectionEnd) ? element.selectionEnd : start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s/.test(after) ? " " : "";
    const nextText = `${before}${prefix}${token}${suffix}${after}`;

    return {
        text: nextText,
        caret: before.length + prefix.length + token.length + suffix.length,
    };
}

function extractExamples(component, type) {
    if (!component) return {};
    const values = type === "header"
        ? component?.example?.header_text || []
        : component?.example?.body_text?.[0] || [];

    return Object.fromEntries(values.map((value, index) => [index + 1, String(value ?? "")]));
}

function draftFromTemplate(template) {
    const components = Array.isArray(template?.components_meta) ? template.components_meta : [];
    const header = components.find((item) => String(item?.type || "").toUpperCase() === "HEADER");
    const body = components.find((item) => String(item?.type || "").toUpperCase() === "BODY");
    const footer = components.find((item) => String(item?.type || "").toUpperCase() === "FOOTER");
    const buttons = components.find((item) => String(item?.type || "").toUpperCase() === "BUTTONS");
    const headerFormat = header ? String(header?.format || "TEXT").toUpperCase() : "NONE";

    return {
        ...emptyDraft(),
        id: String(template?.id || ""),
        name: String(template?.name || template?.key || ""),
        language: String(template?.language || template?.idioma || "es_MX"),
        category: String(template?.category || "UTILITY").toUpperCase(),

        headerType: headerFormat,
        headerText: headerFormat === "TEXT" ? String(header?.text || "") : "",
        headerExamples: extractExamples(header, "header"),

        preservedHeader: header && ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat) ? header : null,

        body: String(body?.text || ""),
        bodyExamples: extractExamples(body, "body"),
        footer: String(footer?.text || ""),

        buttons: Array.isArray(buttons?.buttons)
            ? buttons.buttons.map((button) => ({
                type: String(button?.type || "QUICK_REPLY").toUpperCase(),
                text: String(button?.text || ""),
                url: String(button?.url || ""),
                phone_number: String(button?.phone_number || ""),
                example: Array.isArray(button?.example) ? String(button.example[0] || "") : "",
            }))
            : [],
    };
}

function buildComponents(draft) {
    const components = [];

    const preservedFormat = String(draft.preservedHeader?.format || "").toUpperCase();

    if (draft.headerType === "TEXT" && draft.headerText.trim()) {
        const vars = variableIndexes(draft.headerText);

        const header = {
            type: "HEADER",
            format: "TEXT",
            text: draft.headerText.trim(),
        };

        if (vars.length) {
            header.example = {
                header_text: vars.map((index) => String(draft.headerExamples[index] || "")),
            };
        }

        components.push(header);
    } else if (
        ["IMAGE", "VIDEO", "DOCUMENT"].includes(draft.headerType) &&
        draft.headerHandle
    ) {
        components.push({
            type: "HEADER",
            format: draft.headerType,
            example: {
                header_handle: [draft.headerHandle],
            },
        });
    } else if (
        draft.preservedHeader &&
        draft.headerType === preservedFormat
    ) {
        components.push(draft.preservedHeader);
    }

    const bodyVars = variableIndexes(draft.body);

    const body = {
        type: "BODY",
        text: draft.body.trim(),
    };

    if (bodyVars.length) {
        body.example = {
            body_text: [
                bodyVars.map((index) => String(draft.bodyExamples[index] || "")),
            ],
        };
    }

    components.push(body);

    if (draft.footer.trim()) {
        components.push({
            type: "FOOTER",
            text: draft.footer.trim(),
        });
    }

    const buttons = draft.buttons
        .filter((button) => button.text.trim())
        .map((button) => {
            const base = {
                type: button.type,
                text: button.text.trim(),
            };

            if (button.type === "URL") {
                base.url = button.url.trim();

                if (variableIndexes(button.url).length && button.example.trim()) {
                    base.example = [button.example.trim()];
                }
            }

            if (button.type === "PHONE_NUMBER") {
                base.phone_number = button.phone_number.trim();
            }

            return base;
        });

    if (buttons.length) {
        components.push({
            type: "BUTTONS",
            buttons,
        });
    }

    return components;
}
function analyzeRisk(draft) {
    const text = [draft.headerText, draft.body, draft.footer, ...draft.buttons.flatMap((b) => [b.text, b.url])]
        .join(" ")
        .toLowerCase();
    let score = 0;
    const findings = [];

    MARKETING_SIGNALS.forEach(([signal, weight]) => {
        if (text.includes(signal)) {
            score += weight;
            findings.push(signal);
        }
    });

    const anchors = UTILITY_ANCHORS.filter((anchor) => text.includes(anchor));
    if (anchors.length) score = Math.max(0, score - Math.min(20, anchors.length * 7));
    score = Math.min(100, score);

    return {
        score,
        level: score >= 45 ? "alto" : score >= 18 ? "medio" : "bajo",
        findings,
        anchors,
        requiresConfirmation: draft.category === "UTILITY" && score >= 18,
    };
}

function getReturnedCategory(response) {
    const candidates = [
        response?.category,
        response?.meta?.category,
        response?.meta?.data?.category,
        response?.payload?.category,
    ];

    return String(candidates.find(Boolean) || "").toUpperCase().trim();
}

function StatusBadge({ status }) {
    const key = String(status || "").toUpperCase();
    const cfg = STATUS_CFG[key] || { label: key || "Sin estado", cls: "border-gray-200 bg-gray-50 text-gray-600" };
    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
}

function Modal({ open, title, onClose, children, footer }) {
    useEffect(() => {
        if (!open) return undefined;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[120] bg-[#F4F6FA]">
            <div className="flex h-full flex-col">
                <header className="shrink-0 border-b border-[#E4E7F0] bg-white">
                    <div className="flex items-center justify-center gap-2 border-t border-[#F0F1F5] px-5 py-3 text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 text-[16px] text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Configurar plantilla
                        </span>

                        <span className="h-px w-8 bg-[#D0D5DD]" />

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 text-[16px] py-1.5 text-blue-700">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white">
                                2
                            </span>
                            Editar plantilla
                        </span>

                        <span className="h-px w-8 bg-[#D0D5DD]" />

                        <span className="inline-flex items-center gap-1.5 text-[16px] text-[#98A2B3]">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#98A2B3] text-[9px]">
                                3
                            </span>
                            Enviar a revisión
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-8">
                        {children}
                    </div>
                </main>

                <footer className="shrink-0 border-t border-[#E4E7F0] bg-white px-5 py-3 lg:px-8">
                    <div className="mx-auto w-full max-w-[1500px]">
                        {footer}
                    </div>
                </footer>
            </div>
        </div>
    );
}
function RiskDialog({ data, saving, onClose, onConfirm }) {
    useEffect(() => {
        if (!data) return undefined;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [data]);

    if (!data) return null;

    const alreadyChanged = data.type === "reclassified";
    const findings = data.analysis?.riesgo_marketing?.hallazgos || data.analysis?.hallazgos || [];
    const score = data.analysis?.riesgo_marketing?.score ?? data.analysis?.score ?? 0;

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} aria-label="Cerrar advertencia" />

            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="border-b border-amber-200 bg-amber-50 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-amber-950">
                                {alreadyChanged ? "Meta cambió la categoría" : "La plantilla puede ser Marketing"}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-amber-900">
                                {alreadyChanged
                                    ? `La categoría solicitada era ${data.requestedCategory || "UTILITY"}, pero Meta respondió con ${data.detectedCategory || "MARKETING"}.`
                                    : "El análisis del CRM detectó contenido comercial. Meta puede aprobarla como Marketing aunque hayas seleccionado Utility."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 px-6 py-5">
                    {!alreadyChanged && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Riesgo detectado</span>
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">{score}/100</span>
                            </div>

                            {findings.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {findings.slice(0, 6).map((finding, index) => (
                                        <p key={`${finding?.texto || finding}-${index}`} className="text-xs leading-relaxed text-amber-900">
                                            • {finding?.texto || finding}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-sm leading-relaxed text-[#515778]">
                        {alreadyChanged
                            ? "La plantilla ya fue enviada. Revisa su categoría y estado en la lista después de sincronizar."
                            : "Puedes regresar a editar el texto o enviarlo aceptando que Meta ajuste la categoría automáticamente."}
                    </p>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC] px-6 py-4 sm:flex-row sm:justify-end">
                    {!alreadyChanged && (
                        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-[#E4E7F0] bg-white px-5 py-2.5 text-sm font-bold text-[#515778] disabled:opacity-50">
                            Volver a editar
                        </button>
                    )}

                    <button type="button" onClick={alreadyChanged ? onClose : onConfirm} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {alreadyChanged ? "Entendido" : "Enviar y permitir reclasificación"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toast({ data, onClose }) {
    useEffect(() => {
        if (!data) return undefined;
        const timer = window.setTimeout(onClose, 3800);
        return () => window.clearTimeout(timer);
    }, [data, onClose]);

    if (!data) return null;

    const isError = data.type === "error";

    return (
        <div className={`fixed bottom-6 right-6 z-[180] flex max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-2xl ${isError ? "bg-red-600" : "bg-emerald-600"}`}>
            {isError ? <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            <span className="flex-1">{data.message}</span>
            <button type="button" onClick={onClose} className="opacity-75 transition hover:opacity-100" aria-label="Cerrar aviso">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function VariableExamples({ title, text, values, onChange, onRemove }) {
    const indexes = variableIndexes(text);
    if (!indexes.length) return null;

    return (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="mb-3">
                <p className="text-[13px] font-bold uppercase tracking-wider text-blue-800">Datos variables de {title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-blue-700">
                    Estos campos son obligatorios porque Meta necesita ejemplos reales para revisar la plantilla.
                </p>
            </div>

            <div className="space-y-2">
                {indexes.map((index) => {
                    const empty = !String(values[index] || "").trim();

                    return (
                        <div key={index} className={`rounded-xl border bg-white p-3 ${empty ? "border-red-200" : "border-blue-100"}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-800">
                                    {index}
                                </div>

                                <label className="min-w-0 flex-1 text-sm font-semibold text-blue-900">
                                    Dato variable {index} <span className="text-red-600">*</span>
                                    <input
                                        required
                                        value={values[index] || ""}
                                        onChange={(event) => onChange(index, event.target.value)}
                                        className={`${inputCls} mt-1 bg-white ${empty ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                                        placeholder={index === 1 ? "Ejemplo: Reynaldo" : "Escribe un ejemplo real"}
                                    />
                                    <span className={`mt-1 block text-[12px] font-normal ${empty ? "text-red-600" : "text-blue-700"}`}>
                                        {empty ? "Este ejemplo es obligatorio." : "Este valor solo se usa como ejemplo durante la revisión."}
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                                    title={`Quitar dato variable ${index}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TemplatePreview({ draft }) {
    const replace = (text, examples) =>
        String(text || "").replace(
            /\{\{(\d+)\}\}/g,
            (_, index) => examples[Number(index)] || `{{${index}}}`
        );

    const visibleButtons = draft.buttons.filter((button) => button.text.trim());
    const preservedFormat = String(draft.preservedHeader?.format || "").toUpperCase();
    const hasPreservedMedia = draft.preservedHeader && draft.headerType === preservedFormat && !draft.headerPreview;

    return (
        <div className="rounded-2xl border border-[#D9E0DA] bg-[#EFEAE2] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-black uppercase tracking-widest text-[#667781]">
                    Vista previa de la plantilla
                </p>

                <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#667781]">
                    WhatsApp
                </span>
            </div>

            <div className="mx-auto max-w-[380px]">
                <div className="rounded-xl rounded-tr-sm bg-white shadow-sm">
                    {draft.headerType === "IMAGE" && draft.headerPreview && (
                        <img
                            src={draft.headerPreview}
                            alt="Vista previa"
                            className="max-h-56 w-full rounded-t-xl object-cover"
                        />
                    )}

                    {draft.headerType === "VIDEO" && draft.headerPreview && (
                        <video
                            src={draft.headerPreview}
                            controls
                            className="max-h-56 w-full rounded-t-xl bg-black object-contain"
                        />
                    )}

                    {draft.headerType === "DOCUMENT" && (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-t-xl bg-[#F0F2F5] text-[#667781]">
                            <FileText className="h-10 w-10" />
                            <span className="max-w-[260px] truncate text-xs font-bold">
                                {draft.headerFileName || "Documento PDF"}
                            </span>
                        </div>
                    )}

                    {hasPreservedMedia && (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-t-xl bg-[#F0F2F5] text-[#667781]">
                            <FileText className="h-9 w-9" />
                            <span className="text-xs font-bold">
                                Encabezado {preservedFormat.toLowerCase()} existente
                            </span>
                        </div>
                    )}

                    <div className="px-3 py-2.5">
                        {draft.headerType === "TEXT" && draft.headerText.trim() && (
                            <p className="mb-1.5 text-sm font-black text-[#111B21]">
                                {replace(draft.headerText, draft.headerExamples)}
                            </p>
                        )}

                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111B21]">
                            {replace(draft.body, draft.bodyExamples) || "Escribe el cuerpo de la plantilla..."}
                        </p>

                        {draft.footer && (
                            <p className="mt-2 text-[11px] text-[#667781]">
                                {draft.footer}
                            </p>
                        )}

                        <div className="mt-1 text-right text-[10px] text-[#8696A0]">
                            10:30 a.m.
                        </div>
                    </div>

                    {visibleButtons.length > 0 && (
                        <div className="border-t border-[#E9EDEF]">
                            {visibleButtons.slice(0, 3).map((button, index) => (
                                <div
                                    key={`${button.type}-${index}`}
                                    className="border-b border-[#E9EDEF] px-3 py-2.5 text-center text-xs font-bold text-[#00A5F4] last:border-b-0"
                                >
                                    {button.text}
                                </div>
                            ))}

                            {visibleButtons.length > 3 && (
                                <div className="px-3 py-2.5 text-center text-xs font-bold text-[#00A5F4]">
                                    Ver todas las opciones ({visibleButtons.length})
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Plantillas() {
    const { user, ready } = useAuth();
    const headerInputRef = useRef(null);
    const bodyInputRef = useRef(null);

    const admin = useMemo(
        () => isAdministrator(user),
        [user]
    );

    const coordinadorDigital = useMemo(
        () => isDigitalCoordinator(user),
        [user]
    );

    const puedeVerTodasLasLineas =
        admin || coordinadorDigital;

    const userPhones = useMemo(
        () => getUserPhones(user),
        [user]
    );

    const [lineasIA, setLineasIA] = useState([]);
    const [numeroSeleccionado, setNumeroSeleccionado] = useState("");
    const [loadingLines, setLoadingLines] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState(emptyDraft());
    const [toast, setToast] = useState(null);
    const [serverAnalysis, setServerAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [riskDialog, setRiskDialog] = useState(null);

    const showToast = useCallback((message, type = "success") => {
        setToast({
            id: Date.now(),
            message: String(message || "Operación completada."),
            type,
        });
    }, []);

    const lineaActual = useMemo(
        () => lineasIA.find((line) => normalizePhone(line?.numero) === normalizePhone(numeroSeleccionado)) || null,
        [lineasIA, numeroSeleccionado],
    );

    const risk = useMemo(() => analyzeRisk(draft), [draft]);
    const isEditing = Boolean(draft.id);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return templates.filter((item) => {
            if (statusFilter !== "ALL" && String(item.status || "").toUpperCase() !== statusFilter) return false;
            if (categoryFilter !== "ALL" && String(item.category || "").toUpperCase() !== categoryFilter) return false;
            if (!q) return true;
            return [item.name, item.title, item.help, item.language, item.category, item.status].join(" ").toLowerCase().includes(q);
        });
    }, [templates, query, statusFilter, categoryFilter]);

    const counts = useMemo(() => {
        const count = (...statuses) => templates.filter(
            (item) => statuses.includes(String(item.status || "").toUpperCase()),
        ).length;

        return {
            approved: count("APPROVED"),
            pending: count("PENDING", "IN_APPEAL"),
            rejected: count("REJECTED"),
            paused: count("PAUSED"),
            disabled: count("DISABLED", "PENDING_DELETION", "DELETED"),
        };
    }, [templates]);

    const statusOptions = useMemo(() => {
        const statuses = new Set(
            templates
                .map((item) => String(item.status || "").toUpperCase().trim())
                .filter(Boolean),
        );

        return [...statuses].sort((a, b) => {
            const labelA = STATUS_CFG[a]?.label || a;
            const labelB = STATUS_CFG[b]?.label || b;
            return labelA.localeCompare(labelB, "es");
        });
    }, [templates]);

    const loadLines = useCallback(async () => {
        if (ready === false) return;

        setLoadingLines(true);

        try {
            const response =
                await api.iaLineas();

            const allLines =
                Array.isArray(response?.items)
                    ? response.items
                    : [];

            /*
             * Administrador y coordinador digital
             * pueden visualizar todas las líneas.
             *
             * Los demás usuarios solo visualizan
             * los números que tienen asignados.
             */
            const allowedLines =
                puedeVerTodasLasLineas
                    ? allLines
                    : allLines.filter(
                        (line) =>
                            userPhones.includes(
                                normalizePhone(
                                    line?.numero
                                )
                            )
                    );

            setLineasIA(allowedLines);

            setNumeroSeleccionado(
                (current) => {
                    const currentNormalized =
                        normalizePhone(current);

                    const currentExists =
                        allowedLines.some(
                            (line) =>
                                normalizePhone(
                                    line?.numero
                                ) ===
                                currentNormalized
                        );

                    if (currentExists) {
                        return currentNormalized;
                    }

                    return normalizePhone(
                        allowedLines[0]
                            ?.numero || ""
                    );
                }
            );

            if (
                !puedeVerTodasLasLineas &&
                userPhones.length === 0
            ) {
                showToast(
                    "Tu usuario no tiene números de WhatsApp asignados.",
                    "error"
                );
            } else if (
                !puedeVerTodasLasLineas &&
                userPhones.length > 0 &&
                allowedLines.length === 0
            ) {
                showToast(
                    "Ninguno de los números asignados a tu usuario coincide con una línea de WhatsApp configurada.",
                    "error"
                );
            }
        } catch (error) {
            setLineasIA([]);
            setNumeroSeleccionado("");

            showToast(
                error?.message ||
                "No se pudieron cargar las líneas de WhatsApp.",
                "error"
            );
        } finally {
            setLoadingLines(false);
        }
    }, [
        ready,
        puedeVerTodasLasLineas,
        userPhones,
        showToast,
    ]);

    const loadTemplates = useCallback(async () => {
        if (!numeroSeleccionado) {
            setTemplates([]);
            setRules(DEFAULT_RULES);
            return;
        }

        setLoading(true);

        try {
            const response = await api.digitalesPlantillasAdmin(numeroSeleccionado);
            setTemplates(Array.isArray(response?.items) ? response.items : []);
            setRules(
                Array.isArray(response?.reglas_utility) &&
                    response.reglas_utility.length
                    ? response.reglas_utility
                    : DEFAULT_RULES,
            );
        } catch (error) {
            setTemplates([]);
            showToast(
                error?.message || "No se pudieron cargar las plantillas.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    }, [numeroSeleccionado, showToast]);

    useEffect(() => {
        loadLines();
    }, [loadLines]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    useEffect(() => {
        setServerAnalysis(null);
    }, [draft]);

    useEffect(() => {
        const preview = draft.headerPreview;

        return () => {
            if (preview?.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [draft.headerPreview]);

    function openCreate() {
        setServerAnalysis(null);
        setDraft(emptyDraft());
        setModalOpen(true);
    }

    function openEdit(template) {
        const status = String(template?.status || "").toUpperCase();
        if (!["APPROVED", "REJECTED", "PAUSED"].includes(status)) {
            showToast("Meta solo permite editar plantillas aprobadas, rechazadas o pausadas.", "error");
            return;
        }
        setServerAnalysis(null);
        setDraft(draftFromTemplate(template));
        setModalOpen(true);
    }

    function patchDraft(field, value) {
        setDraft((current) => ({ ...current, [field]: value, ...(field === "category" ? { aceptarRiesgo: false } : {}) }));
    }
    function handleHeaderTypeChange(type) {
        const nextType = String(type || "NONE").toUpperCase();

        setDraft((current) => ({
            ...current,
            headerType: nextType,
            headerFile: null,
            headerFileName: "",
            headerPreview: "",
            headerHandle: "",
            headerUploading: false,
            ...(nextType !== "TEXT" ? { headerText: "", headerExamples: {} } : {}),
        }));
    }

    async function handleHeaderFile(file) {
        if (!file) return;

        const type = String(draft.headerType || "").toUpperCase();
        const rule = HEADER_MEDIA_RULES[type];

        if (!rule) {
            showToast("Selecciona primero Imagen, Video o Documento.", "error");
            return;
        }

        if (!rule.mime.includes(String(file.type || "").toLowerCase())) {
            showToast(`El archivo no es válido para ${rule.label}.`, "error");
            return;
        }

        if (file.size > rule.maxBytes) {
            showToast(`El archivo supera el límite de ${rule.maxLabel}.`, "error");
            return;
        }

        let preview = "";

        if (type === "IMAGE" || type === "VIDEO") {
            preview = URL.createObjectURL(file);
        }

        setDraft((current) => ({
            ...current,
            headerFile: file,
            headerFileName: file.name,
            headerPreview: preview,
            headerHandle: "",
            headerUploading: true,
        }));

        try {
            const response = await api.digitalesPlantillaUploadMedia(
                numeroSeleccionado,
                file,
                type
            );

            const handle = String(response?.header_handle || "").trim();

            if (!handle) {
                throw new Error("Meta no devolvió el header_handle.");
            }

            setDraft((current) => ({
                ...current,
                headerHandle: handle,
                headerUploading: false,
            }));

            showToast("Archivo cargado correctamente en Meta.");
        } catch (error) {
            setDraft((current) => ({
                ...current,
                headerHandle: "",
                headerUploading: false,
            }));

            showToast(
                error?.message || "No se pudo cargar la muestra multimedia.",
                "error"
            );
        }
    }

    function handleHeaderDrop(event) {
        event.preventDefault();

        if (draft.headerUploading) return;

        const file = event.dataTransfer?.files?.[0];

        if (file) {
            handleHeaderFile(file);
        }
    }

    function patchExample(field, index, value) {
        setDraft((current) => ({ ...current, [field]: { ...current[field], [index]: value } }));
    }

    function patchVariableText(textField, examplesField, value) {
        setDraft((current) => {
            const normalized = normalizeVariablesAndExamples(value, current[examplesField]);

            return {
                ...current,
                [textField]: normalized.text,
                [examplesField]: normalized.examples,
            };
        });
    }

    function addVariable(textField, examplesField, inputRef) {
        const currentText = String(draft[textField] || "");
        const indexes = variableIndexes(currentText);
        const nextIndex = indexes.length ? Math.max(...indexes) + 1 : 1;
        const token = `{{${nextIndex}}}`;
        const inserted = insertTokenAtSelection(currentText, token, inputRef.current);
        const maxLength = textField === "headerText" ? 60 : 1024;

        if (inserted.text.length > maxLength) {
            showToast(`No hay espacio suficiente para agregar otro dato variable en ${textField === "headerText" ? "el encabezado" : "el cuerpo"}.`, "error");
            return;
        }

        setDraft((current) => ({
            ...current,
            [textField]: inserted.text,
            [examplesField]: {
                ...current[examplesField],
                [nextIndex]: "",
            },
        }));

        requestAnimationFrame(() => {
            inputRef.current?.focus?.();
            inputRef.current?.setSelectionRange?.(inserted.caret, inserted.caret);
        });
    }

    function removeVariable(textField, examplesField, index) {
        setDraft((current) => {
            const withoutToken = String(current[textField] || "")
                .replace(new RegExp(`\\{\\{${index}\\}\\}`, "g"), "")
                .replace(/[ \t]{2,}/g, " ")
                .replace(/ +\n/g, "\n");

            const normalized = normalizeVariablesAndExamples(withoutToken, current[examplesField]);

            return {
                ...current,
                [textField]: normalized.text,
                [examplesField]: normalized.examples,
            };
        });
    }

    const MAX_BUTTONS = 10;

    function addButton(type = "QUICK_REPLY") {
        if (draft.buttons.length >= MAX_BUTTONS) {
            showToast("La plantilla permite como máximo 10 botones.", "error");
            return;
        }

        setDraft((current) => ({
            ...current,
            buttons: [
                ...current.buttons,
                {
                    type,
                    text: "",
                    url: "",
                    phone_number: "",
                    example: "",
                },
            ],
        }));
    }
    function patchButton(index, field, value) {
        setDraft((current) => ({
            ...current,
            buttons: current.buttons.map((button, buttonIndex) => {
                if (buttonIndex !== index) return button;

                if (field === "type") {
                    return {
                        ...button,
                        type: value,
                        url: "",
                        phone_number: "",
                        example: "",
                    };
                }

                return {
                    ...button,
                    [field]: value,
                };
            }),
        }));
    }

    function removeButton(index) {
        setDraft((current) => ({ ...current, buttons: current.buttons.filter((_, buttonIndex) => buttonIndex !== index) }));
    }

    function validateDraft() {
        if (!numeroSeleccionado) {
            return "Selecciona una línea de WhatsApp.";
        }

        if (!isEditing && !draft.name.trim()) {
            return "Escribe el nombre de la plantilla.";
        }

        if (
            !isEditing &&
            !/^[a-z0-9_]{1,512}$/.test(
                draft.name.trim()
            )
        ) {
            return "El nombre solo puede contener minúsculas, números y guion bajo.";
        }

        if (!draft.language.trim()) {
            return "Selecciona el idioma de la plantilla.";
        }

        if (
            !["UTILITY", "MARKETING"].includes(
                String(
                    draft.category || ""
                ).toUpperCase()
            )
        ) {
            return "Selecciona una categoría válida.";
        }

        if (!draft.body.trim()) {
            return "El cuerpo de la plantilla es obligatorio.";
        }

        if (draft.headerType === "TEXT" && !draft.headerText.trim()) {
            return "Escribe el texto del encabezado o selecciona Ninguno.";
        }

        if (
            variableIndexes(
                draft.headerText
            ).some(
                (index) =>
                    !String(
                        draft.headerExamples[index] || ""
                    ).trim()
            )
        ) {
            return "Completa todos los datos variables del encabezado.";
        }

        if (
            variableIndexes(
                draft.body
            ).some(
                (index) =>
                    !String(
                        draft.bodyExamples[index] || ""
                    ).trim()
            )
        ) {
            return "Completa todos los datos variables del cuerpo.";
        }

        if (draft.headerUploading) {
            return "Espera a que termine la carga del archivo multimedia.";
        }

        if (
            ["IMAGE", "VIDEO", "DOCUMENT"].includes(
                draft.headerType
            )
        ) {
            const preservedFormat =
                String(
                    draft.preservedHeader?.format || ""
                ).toUpperCase();

            const conservaAnterior =
                draft.preservedHeader &&
                preservedFormat === draft.headerType;

            if (
                !draft.headerHandle &&
                !conservaAnterior
            ) {
                return "Sube una muestra multimedia antes de enviar la plantilla.";
            }
        }

        if (draft.buttons.length > MAX_BUTTONS) {
            return "La plantilla permite como máximo 10 botones.";
        }

        for (
            let index = 0;
            index < draft.buttons.length;
            index += 1
        ) {
            const button =
                draft.buttons[index];

            if (!button.text.trim()) {
                return `Escribe el texto del botón ${index + 1}.`;
            }

            if (
                button.type === "URL" &&
                !button.url.trim()
            ) {
                return `Escribe la URL del botón ${index + 1}.`;
            }

            if (
                button.type === "URL" &&
                !/^https?:\/\//i.test(
                    button.url.trim()
                )
            ) {
                return `La URL del botón ${index + 1} debe comenzar con http:// o https://.`;
            }

            if (
                button.type === "URL" &&
                variableIndexes(
                    button.url
                ).length > 0 &&
                !String(
                    button.example || ""
                ).trim()
            ) {
                return `Completa el ejemplo de URL dinámica del botón ${index + 1}.`;
            }

            if (
                button.type === "PHONE_NUMBER" &&
                !button.phone_number.trim()
            ) {
                return `Escribe el teléfono del botón ${index + 1}.`;
            }
        }

        return "";
    }

    async function analyzeTemplate({ showSuccess = true } = {}) {
        if (!numeroSeleccionado) {
            showToast("Selecciona una línea de WhatsApp antes de analizar.", "error");
            return null;
        }

        setAnalyzing(true);

        try {
            const response = await api.digitalesPlantillaAnalizar(
                numeroSeleccionado,
                {
                    category: draft.category,
                    components: buildComponents(draft),
                },
            );

            const analysis = response?.analysis || null;
            setServerAnalysis(analysis);

            if (showSuccess && analysis) {
                showToast(
                    analysis.valida
                        ? "Análisis completado. La estructura es válida."
                        : "El análisis encontró errores que debes corregir.",
                    analysis.valida ? "success" : "error",
                );
            }

            return analysis;
        } catch (error) {
            const analysis = error?.data?.analysis || null;
            if (analysis) setServerAnalysis(analysis);

            showToast(
                error?.message || "No se pudo analizar la estructura de la plantilla.",
                "error",
            );

            return null;
        } finally {
            setAnalyzing(false);
        }
    }

    async function submitTemplate({ acceptRisk = false } = {}) {
        setSaving(true);

        const payload = {
            name: normalizeName(draft.name),
            language: draft.language,
            category: draft.category,
            components: buildComponents(draft),
            aceptar_riesgo_marketing: Boolean(acceptRisk || draft.aceptarRiesgo),
            allow_category_change: draft.allowCategoryChange,
        };

        try {
            const response = isEditing
                ? await api.digitalesPlantillaEditar(numeroSeleccionado, draft.id, payload)
                : await api.digitalesPlantillaCrear(numeroSeleccionado, payload);

            const returnedCategory = getReturnedCategory(response);
            const requestedCategory = String(draft.category || "").toUpperCase();
            const reclassified = returnedCategory && requestedCategory && returnedCategory !== requestedCategory;

            setModalOpen(false);
            setRiskDialog(null);
            await loadTemplates();

            if (reclassified) {
                setRiskDialog({
                    type: "reclassified",
                    requestedCategory,
                    detectedCategory: returnedCategory,
                });
                return;
            }

            showToast(isEditing ? "Cambios enviados a revisión de Meta." : "Plantilla enviada a revisión de Meta.");
        } catch (requestError) {
            const analysis = requestError?.data?.analysis || null;
            const requiresConfirmation = Boolean(
                requestError?.data?.requires_confirmation ||
                analysis?.requiere_confirmacion ||
                analysis?.requiere_confirmacion_marketing,
            );

            if (analysis) setServerAnalysis(analysis);

            if (requiresConfirmation && !acceptRisk) {
                setRiskDialog({
                    type: "confirm",
                    analysis,
                });
                return;
            }

            showToast(requestError?.message || "No se pudo guardar la plantilla.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function saveTemplate() {
        const error = validateDraft();
        if (error) {
            showToast(error, "error");
            return;
        }

        const analysis = await analyzeTemplate({ showSuccess: false });

        if (!analysis) return;

        if (!analysis.valida) {
            showToast("Corrige los errores de estructura antes de enviar la plantilla.", "error");
            return;
        }

        if ((analysis.requiere_confirmacion_marketing || risk.requiresConfirmation) && !draft.aceptarRiesgo) {
            setRiskDialog({
                type: "confirm",
                analysis,
            });
            return;
        }

        await submitTemplate();
    }

    async function confirmRiskAndSubmit() {
        await submitTemplate({ acceptRisk: true });
    }

    async function deleteTemplate(template) {
        if (!confirm(`¿Eliminar la plantilla ${template.name}? Esta acción también la eliminará en Meta.`)) return;
        try {
            await api.digitalesPlantillaEliminar(numeroSeleccionado, template.id, template.name);
            showToast("Plantilla eliminada correctamente.");
            await loadTemplates();
        } catch (error) {
            showToast(error?.message || "No se pudo eliminar la plantilla.", "error");
        }
    }

    if (ready === false) {
        return (
            <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm font-semibold text-[#8891AD]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando sesión...
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {[
                    ["Total", templates.length, FileText, "text-[#131E5C]", "bg-[#131E5C]/8"],
                    ["Aprobadas", counts.approved, CheckCircle2, "text-emerald-600", "bg-emerald-50"],
                    ["En revisión", counts.pending, Clock3, "text-amber-600", "bg-amber-50"],
                    ["Rechazadas", counts.rejected, AlertCircle, "text-red-600", "bg-red-50"],
                    ["Pausadas", counts.paused, ShieldAlert, "text-orange-600", "bg-orange-50"],
                    ["Deshabilitadas", counts.disabled, X, "text-gray-600", "bg-gray-100"],
                ].map(([label, value, Icon, iconCls, bgCls]) => (
                    <div key={label} className="rounded-2xl border border-[#E4E7F0] bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div><p className="text-[11px] font-bold uppercase tracking-widest text-[#8891AD]">{label}</p><p className="mt-2 text-2xl font-bold text-[#1A1F3C]">{loading ? "—" : value}</p></div>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgCls}`}><Icon className={`h-5 w-5 ${iconCls}`} /></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-[#8891AD]">
                                Línea de WhatsApp
                            </label>
                            <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${puedeVerTodasLasLineas
                                    ? "bg-[#131E5C]/10 text-[#131E5C]"
                                    : "bg-blue-50 text-blue-700"
                                    }`}
                            >
                                {admin
                                    ? "Administrador · todas las líneas"
                                    : coordinadorDigital
                                        ? "Coordinador digital · todas las líneas"
                                        : userPhones.length > 1
                                            ? `${userPhones.length} líneas asignadas`
                                            : "Línea asignada a tu usuario"}
                            </span>
                        </div>

                        <select
                            value={numeroSeleccionado}
                            onChange={(event) => setNumeroSeleccionado(normalizePhone(event.target.value))}
                            disabled={
                                loadingLines ||
                                !puedeVerTodasLasLineas ||
                                lineasIA.length === 0
                            } className={`${inputCls} max-w-xl disabled:cursor-not-allowed disabled:bg-[#F7F8FC] disabled:text-[#8891AD]`}
                        >
                            {loadingLines ? (
                                <option value="">Cargando líneas...</option>
                            ) : lineasIA.length === 0 ? (
                                <option value="">Sin línea disponible</option>
                            ) : (
                                lineasIA.map((line) => (
                                    <option key={line.numero} value={normalizePhone(line.numero)}>
                                        {line.label || line.asesor_digital || "Línea WhatsApp"} · {line.numero}
                                    </option>
                                ))
                            )}
                        </select>

                        <p className="mt-1.5 text-xs text-[#8891AD]">
                            Cuenta: {lineaActual?.agencia || "—"} · {lineaActual?.business || "—"}
                            {lineaActual?.phone_number_id ? ` · ID ${lineaActual.phone_number_id}` : ""}
                        </p>

                        {!admin && (
                            <p className="mt-1 text-[11px] font-medium text-blue-700">
                                No puedes cambiar esta línea porque se obtiene del número configurado en tu sesión.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={loadTemplates}
                            disabled={loading || loadingLines || !numeroSeleccionado}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7F0] px-4 py-2.5 text-sm font-bold text-[#515778] hover:bg-[#F7F8FC] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Sincronizar
                        </button>

                        <button
                            onClick={openCreate}
                            disabled={!numeroSeleccionado || loadingLines}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva plantilla
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Reglas para conservar la categoría Utility</h3>
                        <div className="mt-2 grid gap-1.5 md:grid-cols-2">
                            {rules.map((rule) => <p key={rule} className="text-base leading-relaxed text-amber-900">• {rule}</p>)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#E4E7F0] p-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" /><input value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputCls} pl-9`} placeholder="Buscar por nombre, texto o estado..." /></div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} lg:w-52`}>
                        <option value="ALL">Todos los estados</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_CFG[status]?.label || status}
                            </option>
                        ))}
                    </select>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputCls} lg:w-44`}><option value="ALL">Todas las categorías</option><option value="UTILITY">Utility</option><option value="MARKETING">Marketing</option><option value="AUTHENTICATION">Authentication</option></select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-20 text-sm font-semibold text-[#8891AD]"><Loader2 className="h-5 w-5 animate-spin" /> Consultando Meta...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center"><FileText className="mx-auto h-10 w-10 text-[#C8CEDF]" /><p className="mt-3 text-sm font-bold text-[#1A1F3C]">No hay plantillas</p><p className="mt-1 text-xs text-[#8891AD]">Crea una nueva o cambia los filtros.</p></div>
                ) : (
                    <div className="divide-y divide-[#E4E7F0]">
                        {filtered.map((template) => (
                            <div key={`${template.id}-${template.language}`} className="p-5 hover:bg-[#F7F8FC]/70">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-[#1A1F3C]">{template.title || template.name}</h3><StatusBadge status={template.status} /><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${String(template.category).toUpperCase() === "UTILITY" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{template.category || "—"}</span></div>
                                        <p className="mt-1 font-mono text-[11px] text-[#8891AD]">{template.name} · {template.language}</p>
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#515778]">{template.help || "Sin texto visible."}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(template)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E4E7F0] px-3 text-xs font-bold text-[#515778] hover:bg-white"><Edit3 className="h-3.5 w-3.5" /> Editar</button>
                                        <button onClick={() => deleteTemplate(template)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal open={modalOpen} title={isEditing ? `Editar ${draft.name}` : "Nueva plantilla de WhatsApp"} onClose={() => !saving && setModalOpen(false)} footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-[#8891AD]">
                        {!isEditing && (
                            <>
                                Nombre:{" "}
                                <span className="font-bold text-[#515778]">
                                    {draft.name || "Sin definir"}
                                </span>

                                {" · "}

                                Idioma:{" "}
                                <span className="font-bold text-[#515778]">
                                    {draft.language || "—"}
                                </span>

                                {" · "}

                                Categoría:{" "}
                                <span className="font-bold text-[#515778]">
                                    {draft.category || "—"}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() =>
                                setModalOpen(false)
                            }
                            disabled={saving}
                            className="rounded-xl border border-[#E4E7F0] bg-white px-5 py-2.5 text-sm font-bold text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={saveTemplate}
                            disabled={
                                saving ||
                                analyzing ||
                                draft.headerUploading
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving || analyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}

                            {isEditing
                                ? "Revisar cambios"
                                : "Revisar plantilla"}
                        </button>
                    </div>
                </div>
            }>
                <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                    <div className="space-y-5">

                        {/* CONFIGURACIÓN GENERAL */}
                        <div className="space-y-4 rounded-2xl border border-[#E4E7F0] bg-white p-5">
                            <div>
                                <h3 className="text-[18px] font-black text-[#1A1F3C]">
                                    Nombre e idioma de la plantilla
                                </h3>

                                <p className="mt-1 text-[16px] leading-relaxed text-[#8891AD]">
                                    Define los datos principales antes de configurar el contenido que será enviado a Meta.
                                </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                                <label className="text-[14px] font-bold text-[#515778]">
                                    Nombre de la plantilla
                                    {!isEditing && (
                                        <span className="ml-1 text-red-500">*</span>
                                    )}

                                    <div className="relative mt-1.5">
                                        <input
                                            value={draft.name}
                                            disabled={isEditing}
                                            maxLength={512}
                                            onChange={(event) =>
                                                patchDraft(
                                                    "name",
                                                    normalizeName(event.target.value)
                                                )
                                            }
                                            className={`${inputCls} pr-16 disabled:cursor-not-allowed disabled:bg-[#F7F8FC] disabled:text-[#8891AD]`}
                                            placeholder="confirmacion_cita_servicio"
                                        />

                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#98A2B3]">
                                            {draft.name.length}/512
                                        </span>
                                    </div>

                                    <span className="mt-1.5 block text-[14px] font-normal leading-relaxed text-[#8891AD]">
                                        Solo minúsculas, números y guion bajo. Ejemplo: confirmacion_cita_servicio
                                    </span>
                                </label>

                                <label className="text-[14px] font-bold text-[#515778]">
                                    Idioma
                                    <span className="ml-1 text-red-500">*</span>

                                    <select
                                        value={draft.language}
                                        disabled={isEditing}
                                        onChange={(event) =>
                                            patchDraft(
                                                "language",
                                                event.target.value
                                            )
                                        }
                                        className={`${inputCls} mt-1.5 disabled:cursor-not-allowed disabled:bg-[#F7F8FC] disabled:text-[#8891AD]`}
                                    >
                                        <option value="es_MX">
                                            Español (México)
                                        </option>
                                    </select>

                                    {isEditing && (
                                        <span className="mt-1.5 block text-[11px] font-normal text-[#8891AD]">
                                            Meta no permite cambiar el idioma después de crear la plantilla.
                                        </span>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* CATEGORÍA */}
                        <div className="space-y-4 rounded-2xl border border-[#E4E7F0] bg-white p-5">
                            <div>
                                <h3 className="text-[18px] font-black text-[#1A1F3C]">
                                    Categoría
                                </h3>

                                <p className="mt-1 text-[16px] leading-relaxed text-[#8891AD]">
                                    Selecciona el propósito principal del mensaje. Meta puede reclasificar la plantilla durante la revisión.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        patchDraft(
                                            "category",
                                            "UTILITY"
                                        )
                                    }
                                    className={`rounded-xl border p-4 text-left transition ${draft.category === "UTILITY"
                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                                        : "border-[#E4E7F0] bg-white hover:bg-[#F8F9FC]"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${draft.category === "UTILITY"
                                                ? "border-blue-600"
                                                : "border-[#98A2B3]"
                                                }`}
                                        >
                                            {draft.category === "UTILITY" && (
                                                <span className="h-2 w-2 rounded-full bg-blue-600" />
                                            )}
                                        </span>

                                        <div>
                                            <p className="text-[16px] font-black text-[#1A1F3C]">
                                                Utilidad
                                            </p>
                                            <p className="mt-1 text-[14px] leading-relaxed text-[#667085]">
                                                Confirmaciones, citas, actualizaciones, documentos, pagos o procesos solicitados por el cliente.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        patchDraft(
                                            "category",
                                            "MARKETING"
                                        )
                                    }
                                    className={`rounded-xl border p-4 text-left transition ${draft.category === "MARKETING"
                                        ? "border-purple-500 bg-purple-50 ring-2 ring-purple-500/10"
                                        : "border-[#E4E7F0] bg-white hover:bg-[#F8F9FC]"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${draft.category === "MARKETING"
                                                ? "border-purple-600"
                                                : "border-[#98A2B3]"
                                                }`}
                                        >
                                            {draft.category === "MARKETING" && (
                                                <span className="h-2 w-2 rounded-full bg-purple-600" />
                                            )}
                                        </span>

                                        <div>
                                            <p className="text-[16px] font-black text-[#1A1F3C]">
                                                Marketing
                                            </p>

                                            <p className="mt-1 text-[14px] leading-relaxed text-[#667085]">
                                                Promociones, ofertas, campañas, recomendaciones y contenido comercial.
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E4E7F0] bg-[#F8F9FC] p-3.5">
                                <input
                                    type="checkbox"
                                    checked={draft.allowCategoryChange}
                                    onChange={(event) =>
                                        patchDraft(
                                            "allowCategoryChange",
                                            event.target.checked
                                        )
                                    }
                                    className="mt-0.5 h-4 w-4"
                                />

                                <div>
                                    <p className="text-[14px] font-bold text-[#344054]">
                                        Permitir que Meta ajuste automáticamente la categoría
                                    </p>

                                    <p className="mt-1 text-[14px] leading-relaxed text-[#8891AD]">
                                        Recomendado para evitar rechazos cuando Meta determina que el contenido pertenece a otra categoría.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* ENCABEZADO */}
                        <div className="space-y-4 rounded-2xl border border-[#E4E7F0] bg-white p-5">            <div>
                            <h3 className="text-sm font-black text-[#1A1F3C]">
                                Encabezado
                                <span className="ml-1 font-normal text-[#8891AD]">· Opcional</span>
                            </h3>
                        </div>

                            <label className="block text-xs font-bold text-[#515778]">
                                Tipo de encabezado

                                <select
                                    value={draft.headerType}
                                    onChange={(event) => handleHeaderTypeChange(event.target.value)}
                                    disabled={draft.headerUploading}
                                    className={`${inputCls} mt-1.5 max-w-xs`}
                                >
                                    <option value="NONE">Ninguno</option>
                                    <option value="TEXT">Texto</option>
                                    <option value="IMAGE">Imagen</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="DOCUMENT">Documento PDF</option>
                                </select>
                            </label>

                            {draft.headerType === "TEXT" && (
                                <>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="relative flex-1">
                                            <input
                                                ref={headerInputRef}
                                                value={draft.headerText}
                                                maxLength={60}
                                                onChange={(event) =>
                                                    patchVariableText(
                                                        "headerText",
                                                        "headerExamples",
                                                        event.target.value
                                                    )
                                                }
                                                className={inputCls}
                                                placeholder="Confirmación de cita"
                                            />

                                            <span className="absolute bottom-2.5 right-3 text-[10px] text-[#8891AD]">
                                                {draft.headerText.length}/60
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                addVariable(
                                                    "headerText",
                                                    "headerExamples",
                                                    headerInputRef
                                                )
                                            }
                                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-2.5 text-xs font-bold text-[#131E5C] hover:bg-[#131E5C]/10"
                                        >
                                            <Braces className="h-4 w-4" />
                                            Agregar variable
                                        </button>
                                    </div>

                                    <VariableExamples
                                        title="encabezado"
                                        text={draft.headerText}
                                        values={draft.headerExamples}
                                        onChange={(index, value) =>
                                            patchExample(
                                                "headerExamples",
                                                index,
                                                value
                                            )
                                        }
                                        onRemove={(index) =>
                                            removeVariable(
                                                "headerText",
                                                "headerExamples",
                                                index
                                            )
                                        }
                                    />
                                </>
                            )}

                            {["IMAGE", "VIDEO", "DOCUMENT"].includes(draft.headerType) && (
                                <>
                                    <label
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={handleHeaderDrop}
                                        className={`flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition ${draft.headerUploading
                                            ? "cursor-wait border-blue-300 bg-blue-50"
                                            : "border-[#D9DDE8] bg-[#FAFBFC] hover:border-[#131E5C]/30 hover:bg-[#131E5C]/[0.02]"
                                            }`}
                                    >
                                        {draft.headerUploading ? (
                                            <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#131E5C]" />
                                        ) : (
                                            <UploadCloud className="mb-3 h-7 w-7 text-[#667085]" />
                                        )}

                                        <span className="text-sm font-black text-[#344054]">
                                            {draft.headerUploading
                                                ? "Subiendo muestra a Meta..."
                                                : draft.headerFileName || "Arrastra y suelta para subir el archivo"}
                                        </span>

                                        <span className="mt-1 text-xs text-[#8891AD]">
                                            {draft.headerUploading
                                                ? "No cierres el editor hasta finalizar."
                                                : `O elige un archivo de tu dispositivo · Máximo ${HEADER_MEDIA_RULES[draft.headerType]?.maxLabel}`}
                                        </span>

                                        <input
                                            type="file"
                                            hidden
                                            disabled={draft.headerUploading}
                                            accept={HEADER_MEDIA_RULES[draft.headerType]?.accept || ""}
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) handleHeaderFile(file);
                                                event.target.value = "";
                                            }}
                                        />
                                    </label>

                                    {draft.headerHandle && (
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Muestra multimedia cargada correctamente en Meta.
                                        </div>
                                    )}

                                    {!draft.headerHandle && draft.preservedHeader && (
                                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-800">
                                            Se conservará el encabezado multimedia existente mientras no cargues uno nuevo.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="space-y-3 rounded-2xl border border-[#E4E7F0] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="text-sm font-bold text-[#1A1F3C]">Cuerpo del mensaje *</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#8891AD]">{draft.body.length}/1024</span>
                                    <button
                                        type="button"
                                        onClick={() => addVariable("body", "bodyExamples", bodyInputRef)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-2 text-xs font-bold text-[#131E5C] transition hover:bg-[#131E5C]/10"
                                    >
                                        <Braces className="h-4 w-4" />
                                        Agregar variable
                                    </button>
                                </div>
                            </div>

                            <textarea
                                ref={bodyInputRef}
                                value={draft.body}
                                maxLength={1024}
                                rows={7}
                                onChange={(event) => patchVariableText("body", "bodyExamples", event.target.value)}
                                className={textareaCls}
                                placeholder="Hola, confirmamos que tu cita quedó programada."
                            />

                            <p className="text-[13px] leading-relaxed text-[#8891AD]">
                                Ejemplo: escribe “Hola ”, coloca el cursor después del espacio y agrega un dato variable para el nombre del cliente.
                            </p>

                            <VariableExamples
                                title="cuerpo"
                                text={draft.body}
                                values={draft.bodyExamples}
                                onChange={(index, value) => patchExample("bodyExamples", index, value)}
                                onRemove={(index) => removeVariable("body", "bodyExamples", index)}
                            />
                        </div>

                        <div className="space-y-2 rounded-2xl border border-[#E4E7F0] p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold text-[#1A1F3C]">Pie opcional</label><span className="text-[11px] text-[#8891AD]">{draft.footer.length}/60</span></div><input value={draft.footer} maxLength={60} onChange={(e) => patchDraft("footer", e.target.value)} className={inputCls} placeholder="Grupo Automotriz R&R" /></div>

                        <div className="space-y-3 rounded-2xl border border-[#E4E7F0] p-4">
                            <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-[#1A1F3C]">Botones</h3><p>{draft.buttons.length}/10 botones</p></div><button onClick={addButton} disabled={draft.buttons.length >= MAX_BUTTONS} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7F0] px-3 py-2 text-xs font-bold text-[#131E5C] disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Agregar</button></div>
                            {draft.buttons.map((button, index) => (
                                <div key={index} className="grid gap-2 rounded-xl bg-[#F7F8FC] p-3 sm:grid-cols-[150px_1fr_auto]">
                                    <select value={button.type} onChange={(e) => patchButton(index, "type", e.target.value)} className={inputCls}>
                                        <option value="QUICK_REPLY"> Respuesta rápida</option>
                                        <option value="URL">Ir al sitio web</option>
                                        <option value="PHONE_NUMBER">Llamar por teléfono</option>
                                    </select>
                                    <div className="space-y-2"><input value={button.text} maxLength={25} onChange={(e) => patchButton(index, "text", e.target.value)} className={inputCls} placeholder="Texto del botón" />{button.type === "URL" && <><input value={button.url} onChange={(e) => patchButton(index, "url", e.target.value)} className={inputCls} placeholder="https://ejemplo.com/cita/{{1}}" />{variableIndexes(button.url).length > 0 && <input value={button.example} onChange={(e) => patchButton(index, "example", e.target.value)} className={inputCls} placeholder="Ejemplo para la variable de URL" />}</>}{button.type === "PHONE_NUMBER" && (<input value={button.phone_number} onChange={(e) => patchButton(index, "phone_number", e.target.value)} className={inputCls} placeholder="+522711234567" />)}</div>
                                    <button onClick={() => removeButton(index)} className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                        <TemplatePreview draft={draft} />
                        <div className={`rounded-2xl border p-4 ${risk.level === "alto" ? "border-red-200 bg-red-50" : risk.level === "medio" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className={`mt-0.5 h-5 w-5 ${risk.level === "alto" ? "text-red-700" : risk.level === "medio" ? "text-amber-700" : "text-emerald-700"}`} />
                                    <div>
                                        <h3 className="text-base font-bold text-[#1A1F3C]">Riesgo comercial preliminar: {risk.level}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-[#515778]">Puntuación local: {risk.score}/100. Usa el análisis completo para validar variables, ejemplos, botones y estructura.</p>
                                        {risk.findings.length > 0 && <p className="mt-2 text-xs font-semibold text-[#515778]">Señales detectadas: {risk.findings.join(", ")}.</p>}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => analyzeTemplate()}
                                    disabled={analyzing || saving}
                                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-[#131E5C]/20 bg-white px-3 py-2 text-sm font-bold text-[#131E5C] disabled:opacity-50"
                                >
                                    {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    Analizar estructura
                                </button>
                            </div>

                            {serverAnalysis && (
                                <div className="mt-4 space-y-3 rounded-xl border border-white/80 bg-white/75 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${serverAnalysis.valida ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                            {serverAnalysis.valida ? "Estructura válida" : "Estructura inválida"}
                                        </span>
                                        <span className="text-xs font-semibold text-[#515778]">
                                            Calidad estructural: {serverAnalysis.score_estructura ?? 0}/100
                                        </span>
                                        <span className="text-xs text-[#8891AD]">
                                            {serverAnalysis.resumen?.total_componentes ?? 0} componentes · {serverAnalysis.resumen?.variables?.body?.cantidad ?? 0} variables en cuerpo · {serverAnalysis.resumen?.botones?.cantidad ?? 0} botones
                                        </span>
                                    </div>

                                    {serverAnalysis.errores?.length > 0 && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                            <p className="text-xs font-bold text-red-800">Errores que bloquean el envío</p>
                                            {serverAnalysis.errores.map((item) => <p key={item} className="mt-1 text-xs leading-relaxed text-red-700">• {item}</p>)}
                                        </div>
                                    )}

                                    {serverAnalysis.advertencias?.length > 0 && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-xs font-bold text-amber-900">Advertencias</p>
                                            {serverAnalysis.advertencias.map((item) => <p key={item} className="mt-1 text-xs leading-relaxed text-amber-800">• {item}</p>)}
                                        </div>
                                    )}

                                    {serverAnalysis.recomendaciones?.length > 0 && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <p className="text-xs font-bold text-blue-900">Recomendaciones</p>
                                            {serverAnalysis.recomendaciones.map((item) => <p key={item} className="mt-1 text-xs leading-relaxed text-blue-800">• {item}</p>)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(risk.requiresConfirmation || serverAnalysis?.requiere_confirmacion_marketing) && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-white/70 p-3 text-xs font-semibold text-amber-900">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    Al intentar enviarla, el CRM te pedirá confirmar la posible reclasificación a Marketing.
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl border border-[#E4E7F0] bg-[#F7F8FC] p-4"><h3 className="text-lg font-bold text-[#1A1F3C]">Checklist Utility</h3><div className="mt-2 space-y-2">{rules.map((rule) => <p key={rule} className="flex gap-2 text-base leading-relaxed text-[#515778]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#131E5C]" />{rule}</p>)}</div></div>
                    </div>
                </div>
            </Modal>

            <RiskDialog
                data={riskDialog}
                saving={saving}
                onClose={() => setRiskDialog(null)}
                onConfirm={confirmRiskAndSubmit}
            />

            <Toast
                data={toast}
                onClose={() => setToast(null)}
            />
        </div>
    );
}