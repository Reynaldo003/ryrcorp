// src/pages/Digitaltes/DigitalesBandeja.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    LINEAS_WHATSAPP,
    obtenerNumerosWhatsAppUsuario,
    obtenerEtiquetaLinea,
} from "../../config/lineasWhatsApp";
import {
    ArrowLeft, Search, X, Building2, Loader2, Send, Phone,
    Play, Pause, FileText, Check, CheckCheck, Clock, AlertCircle,
    LayoutTemplate, Zap, ChevronLeft, Smile, Paperclip, Mic, Square, Pencil,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { api } from "../../lib/apiPruebas";

const BRAND_BLUE = "#131E5C";
const DRAWER_POLL_MS = 4000;
const QUICK_BUBBLES_KEY = "digitales_quick_bubbles_global";
const MAX_RECORDING_SECONDS = 300;

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

const CANALES = ["VW-Concesionario", "WhatsApp", "Facebook", "Llamada Entrante"];

const ESTADOS_BANDEJA = [

    { key: "generacion_leads", label: "Generación de Leads", match: ["generación de leads", "generacion de leads", "generacion_leads", ""], color: "#0EA5E9" },
    { key: "seminuevos", label: "Seminuevos", match: ["seminuevos"], color: "#F97316" },
    { key: "contactado", label: "Contactado", match: ["contactado", "sin respuesta", "sin_respuesta"], color: "#F59E0B" },
    { key: "perfilado", label: "Perfilado", match: ["perfilado"], color: "#6366F1" },
    { key: "cotizacion", label: "Cotización", match: ["cotización", "cotizacion"], color: "#8B5CF6" },
    { key: "cita_programada", label: "Cita Programada", match: ["cita programada", "cita_programada"], color: "#0891B2" },
    { key: "no_show", label: "No Show", match: ["no show", "no_show", "noshow"], color: "#DC2626" },
    { key: "asistencia_cita", label: "Asistencia a la Cita", match: ["asistencia a la cita", "asistencia_cita"], color: "#059669" },
    { key: "documentos_enviados", label: "Documentos Enviados", match: ["documentos enviados", "documentos_enviados"], color: "#0D9488" },
    { key: "solicitud_credito", label: "Solicitud de Crédito", match: ["solicitud de crédito", "solicitud de credito", "solicitud_credito"], color: "#7C3AED" },
    { key: "autorizado_no_formalizado", label: "Autorizado No Formalizado", match: ["autorizado no formalizado", "autorizado_no_formalizado"], color: "#CA8A04" },
    { key: "cierre_venta", label: "Cierre de la Venta", match: ["cierre de la venta", "cierre_venta", "cierre de venta"], color: "#16A34A" },
    { key: "descalificado", label: "Descalificado", match: ["descalificado"], color: "#94A3B8" },
];

function cls(...items) { return items.filter(Boolean).join(" "); }
function safeLower(v) { return String(v || "").toLowerCase(); }


function hexToRgb(hex) {
    const clean = String(hex || "").replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const int = parseInt(full || "000000", 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
function mutedColor(hex, amount = 0.4) {
    const { r, g, b } = hexToRgb(hex);
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function normalizeText(value) {
    return String(value || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    return digits;
}

function formateaTelUi(tel52) {
    const digits = String(tel52 || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 12 && digits.startsWith("52")) {
        const ten = digits.slice(2);
        return `+52 ${ten.slice(0, 3)} ${ten.slice(3, 6)} ${ten.slice(6)}`;
    }
    return `+${digits}`;
}

function getEstadoBandeja(estado) {
    const v = normalizeText(estado);
    return ESTADOS_BANDEJA.find((b) => b.match.some((m) => normalizeText(m) === v)) || ESTADOS_BANDEJA[0];
}

function esFechaDeHoy(iso) {
    if (!iso) return false;
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return false;
    const ahora = new Date();
    return (
        fecha.getFullYear() === ahora.getFullYear() &&
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getDate() === ahora.getDate()
    );
}

function formatHoraCorta(iso) {
    if (!iso) return "";
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return "";
    return fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });
}


function fileKind(file) {
    const mime = String(file?.type || "");
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "file";
}

function extractFilesFromDataTransfer(dt) {
    if (!dt) return [];
    const list = dt.files ? Array.from(dt.files) : [];
    if (list.length) return list.filter((f) => f && typeof f.size === "number");
    const items = dt.items ? Array.from(dt.items) : [];
    const output = [];
    for (const item of items) {
        if (item.kind === "file") { const f = item.getAsFile?.(); if (f && typeof f.size === "number") output.push(f); }
    }
    return output;
}

function getSupportedRecorderMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
    return candidates.find((mime) => MediaRecorder.isTypeSupported?.(mime)) || "";
}

function getAudioExtension(mimeType = "") {
    const mime = String(mimeType || "").toLowerCase();
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("mp4")) return "m4a";
    return "webm";
}

function humanBytes(bytes) {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const size = value / Math.pow(1024, index);
    return `${size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}

function formatAudioTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds || 0)));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
}

function Avatar({ name = "?" }) {
    const initials = String(name || "?").split(" ").filter(Boolean).slice(0, 2).map(i => i[0]?.toUpperCase()).join("");
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <span className="text-xs font-extrabold text-[#131E5C]">{initials || "?"}</span>
        </div>
    );
}


function PulseRing({ value = 0, label, color = BRAND_BLUE, size = 60, stroke = 6 }) {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EEF0F4" strokeWidth={stroke} />
                    <circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke={color} strokeWidth={stroke} strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold text-[#131E5C]">
                    {clamped}%
                </div>
            </div>
            <span className="max-w-[64px] text-center text-[9px] font-bold leading-tight text-slate-400">{label}</span>
        </div>
    );
}


function FlowStreamBar({ conteoPorEstado, total }) {
    return (
        <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#131E5C]/50">Pulso de la bandeja</span>
                <span className="text-[10px] font-bold text-slate-400">{total} chat{total === 1 ? "" : "s"}</span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 ring-1 ring-black/5">
                {ESTADOS_BANDEJA.map((b) => {
                    const count = conteoPorEstado.get(b.key) || 0;
                    const pct = total ? (count / total) * 100 : 0;
                    return (
                        <div
                            key={b.key}
                            title={`${b.label}: ${count}`}
                            className="h-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: mutedColor(b.color, 0.3) }}
                        />
                    );
                })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {ESTADOS_BANDEJA.map((b) => (
                    <div key={b.key} className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: mutedColor(b.color, 0.3) }} />
                        {b.label} · {conteoPorEstado.get(b.key) || 0}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChatCard({ chat, onOpen, draggable = true, onDragStart, onDragEnd, dragging, dateLabel }) {
    return (
        <div
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(e, chat)}
            onDragEnd={onDragEnd}
            onClick={() => onOpen?.(chat)}
            className={cls(
                "cursor-grab select-none rounded-xl border border-black/10 bg-white px-3 py-2.5 shadow-sm transition active:cursor-grabbing hover:border-[#131E5C]/30 hover:shadow-md",
                dragging ? "opacity-40" : "opacity-100"
            )}
            title="Arrastra a una bandeja o haz clic para abrir el chat"
        >
            <div className="flex items-center gap-2.5">
                <Avatar name={chat.nombre} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-[13px] font-extrabold text-[#131E5C]">{chat.nombre}</div>
                        {chat.unread > 0 ? (
                            <span className="inline-flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-extrabold text-white">
                                {chat.unread}
                            </span>
                        ) : null}
                    </div>
                    <div className="truncate text-[11px] font-semibold text-slate-400">{formateaTelUi(chat.telefono)}</div>
                    {chat.agencia ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <Building2 className="h-2.5 w-2.5" />
                            <span className="truncate">{chat.agencia}</span>
                        </div>
                    ) : null}
                    {dateLabel ? (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-extrabold text-sky-600 ring-1 ring-sky-200">
                            Nuevo · {dateLabel}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}



function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function firstNonEmpty(...values) {
    for (const value of values) {
        const clean = String(value || "").trim();
        if (clean) return clean;
    }
    return "";
}

function getPautaOrigenFromMessage(message = {}) {
    const raw = asObject(message?.raw);
    const ultimoWebhook = asObject(raw?.ultimo_webhook_payload);
    const originPreview = asObject(message?.origin_preview || message?.originPreview);

    const referral = [
        asObject(message?.referral),
        asObject(originPreview?.referral),
        asObject(raw?.referral),
        asObject(asObject(raw?.context)?.referral),
        asObject(ultimoWebhook?.referral),
        asObject(asObject(ultimoWebhook?.context)?.referral),
    ].find((item) => Object.keys(item).length > 0) || {};

    const atribucion = [
        asObject(originPreview?.atribucion),
        asObject(raw?.atribucion_meta),
        asObject(ultimoWebhook?.atribucion_meta),
    ].find((item) => Object.keys(item).length > 0) || {};

    const nombreCampana = firstNonEmpty(originPreview?.nombre_campana, atribucion?.nombre_campana, atribucion?.campaign_name);
    const nombreAnuncio = firstNonEmpty(originPreview?.nombre_anuncio, atribucion?.nombre_anuncio, referral?.headline);
    const sucursal = firstNonEmpty(originPreview?.sucursal, atribucion?.sucursal);
    const pauta = firstNonEmpty(originPreview?.pauta, atribucion?.pauta, sucursal && nombreCampana ? `${sucursal} - ${nombreCampana}` : "", nombreCampana, nombreAnuncio);
    const headline = firstNonEmpty(originPreview?.headline, referral?.headline, nombreAnuncio, nombreCampana, pauta);
    const body = firstNonEmpty(originPreview?.body, referral?.body, atribucion?.nombre_conjunto);
    const sourceUrl = firstNonEmpty(originPreview?.source_url, referral?.source_url);
    const imageUrl = firstNonEmpty(originPreview?.image_url, referral?.image_url, referral?.thumbnail_url, referral?.video_thumbnail_url);

    if (!pauta && !headline && !sourceUrl && !imageUrl) return null;

    return {
        pauta: pauta || headline,
        nombre_campana: nombreCampana,
        nombre_anuncio: nombreAnuncio,
        sucursal,
        headline: headline || pauta,
        body,
        source_url: sourceUrl,
        image_url: imageUrl,
        media_type: firstNonEmpty(originPreview?.media_type, referral?.media_type),
        source_type: firstNonEmpty(originPreview?.source_type, referral?.source_type),
        source_id: firstNonEmpty(originPreview?.source_id, referral?.source_id),
        origen: firstNonEmpty(originPreview?.origen, atribucion?.motivo, "meta_ads"),
        referral,
        atribucion,
    };
}

function getMessageKey(m) { return String(m?.wa_message_id || m?.id || ""); }

function getMessageTimeValue(m) {
    const v = m?.created_at || m?.local_created_at || "";
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
}

function mergeMessages(oldMessages, newMessages) {
    const map = new Map();
    for (const m of oldMessages || []) { const k = getMessageKey(m); if (k) map.set(k, m); }
    for (const m of newMessages || []) { const k = getMessageKey(m); if (k) map.set(k, m); }
    return Array.from(map.values()).sort((a, b) => {
        const da = getMessageTimeValue(a), db = getMessageTimeValue(b);
        if (da !== db) return da - db;
        return Number(a.id || 0) - Number(b.id || 0);
    });
}

function getReplyToId(message = {}) {
    return (
        message.context?.id || message.reply_to_message_id || message.reply_to_id ||
        message.quoted_message_id || message.quoted_id || message?.raw?.context?.id || ""
    );
}

const MESSAGE_PLACEHOLDER_LABELS = {
    "[IMAGE]": "Imagen", "[VIDEO]": "Video", "[AUDIO]": "Audio",
    "[STICKER]": "Sticker", "[DOCUMENT]": "Documento",
    "[LOCATION]": "📍 Ubicación enviada", "[CONTACTS]": "👤 Contacto enviado",
    "[ORDER]": "🛒 Pedido recibido", "[SYSTEM]": "Mensaje del sistema",
    "[UNSUPPORTED_MESSAGE]": "Mensaje recibido en un formato no compatible",
};

function cleanMediaTextForBubble(text, attachments = []) {
    let value = String(text || "").trim();
    value = value.replace(/\[FILE:[^\]]+\]/gi, "").trim();
    const upper = value.toUpperCase();
    if (attachments.length && ["[IMAGE]", "[VIDEO]", "[AUDIO]", "[STICKER]", "[DOCUMENT]", "ADJUNTO", "ARCHIVO"].includes(upper)) return "";
    if (MESSAGE_PLACEHOLDER_LABELS[upper]) return MESSAGE_PLACEHOLDER_LABELS[upper];
    if (upper.includes("UNSUPPORTED_MESSAGE")) return "Mensaje recibido en un formato no compatible";
    return value;
}

function inferAttachmentKind(a = {}) {
    const type = String(a.kind || a.type || a.media_type || "").toLowerCase();
    const mime = String(a.mime || a.mime_type || "").toLowerCase();
    if (type === "sticker") return "sticker";
    if (type === "image" || mime.startsWith("image/")) return "image";
    if (type === "video" || mime.startsWith("video/")) return "video";
    if (type === "audio" || mime.startsWith("audio/")) return "audio";
    return "file";
}

function normalizeMessageAttachments(message = {}) {
    if (Array.isArray(message.attachments) && message.attachments.length) {
        return message.attachments.map((a, i) => {
            const src = a.url || a.previewUrl || "";
            return { id: a.id || `${message.wa_message_id || message.id || "msg"}-${i}`, kind: inferAttachmentKind(a), previewUrl: src, url: src, name: a.name || a.filename || "", size: a.size || 0, mime: a.mime || a.mime_type || "" };
        }).filter(a => a.url);
    }
    const rawList = Array.isArray(message.media) ? message.media : message.media_url || message.image_url || message.sticker_url ? [message] : [];
    return rawList.map((a, i) => {
        const src = a.previewUrl || a.url || a.media_url || a.image_url || a.sticker_url || a.src || "";
        return { id: a.id || a.media_id || `${message.wa_message_id || message.id || "msg"}-${i}`, kind: inferAttachmentKind(a), previewUrl: src, url: src, name: a.name || a.filename || "", size: a.size || a.file_size || 0, mime: a.mime || a.mime_type || "" };
    }).filter(a => a.url);
}

function getMessageReactions(message = {}) {
    const raw = message.raw || {};
    const source = Array.isArray(message.reactions) ? message.reactions : Array.isArray(raw.reactions) ? raw.reactions : [];
    return source.map((item, index) => ({
        id: item.reaction_message_id || `${message.wa_message_id || message.id}-reaction-${index}`,
        emoji: String(item.emoji || "").trim(),
        telefono: item.telefono || "",
        from: item.from || "cliente",
    })).filter((item) => item.emoji);
}

function isReactionEvent(message = {}) {
    const raw = message.raw || {};
    return Boolean(raw.is_reaction_event || raw.type === "reaction" || message.type === "reaction");
}

function applyReactionEvents(messages = []) {
    const map = new Map();
    for (const msg of messages || []) {
        const key = getMessageKey(msg);
        if (!key) continue;
        map.set(key, { ...msg, reactions: getMessageReactions(msg) });
    }
    for (const msg of messages || []) {
        const raw = msg.raw || {};
        if (!isReactionEvent(msg)) continue;
        const targetId = raw.reaction_target_id || raw?.reaction?.message_id || "";
        if (!targetId || !map.has(String(targetId))) continue;
        const target = map.get(String(targetId));
        const emoji = raw.reaction_emoji || raw?.reaction?.emoji || "";
        const removed = Boolean(raw.reaction_removed || !String(emoji || "").trim());
        let reactions = Array.isArray(target.reactions) ? [...target.reactions] : [];
        const telefono = msg.telefono || raw.from || raw.telefono || "";
        reactions = reactions.filter((r) => String(r.telefono || "") !== String(telefono || ""));
        if (!removed && emoji) reactions.push({ id: msg.wa_message_id || msg.id || crypto.randomUUID(), emoji, telefono, from: "cliente" });
        map.set(String(targetId), { ...target, reactions });
    }
    return Array.from(map.values())
        .filter((msg) => !isReactionEvent(msg))
        .sort((a, b) => {
            const da = getMessageTimeValue(a), db = getMessageTimeValue(b);
            if (da !== db) return da - db;
            return Number(a.id || 0) - Number(b.id || 0);
        });
}

function normalizeMessage(message = {}) {
    const reactionEvent = isReactionEvent(message);
    return {
        ...message,
        id: message.id || message.wa_message_id || crypto.randomUUID(),
        text: reactionEvent ? "" : (message.text || message.body || message.caption || ""),
        attachments: reactionEvent ? [] : normalizeMessageAttachments(message),
        is_ai: Boolean(message.is_ai || message?.raw?.openai_model || message?.raw?.ia_model || message?.raw?.ia_provider),
        reply_to_id: message.reply_to_id || getReplyToId(message),
        reactions: getMessageReactions(message),
        is_reaction_event: reactionEvent,
        origin_preview: reactionEvent ? null : getPautaOrigenFromMessage(message),
    };
}



function getTemplateComponentType(c = {}) { return String(c.type || "").toLowerCase(); }

function replaceMetaVariables(text, componentType, draft) {
    return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, idx) => String(draft?.[`${componentType}_${idx}`] ?? "").trim());
}

function interpolateNumberedText(text, fields, draft) {
    const vals = (fields || []).map(f => String(draft?.[f.key] || "").trim());
    return String(text || "").replace(/\((\d+)\)/g, (_, idx) => vals[Number(idx) - 1] || "");
}

function buildTemplatePreviewText(template, draft) {
    if (!template) return "";
    const components = Array.isArray(template.components_meta) ? template.components_meta : [];
    const fromMeta = components.filter(c => { const t = getTemplateComponentType(c); return ["header", "body", "footer"].includes(t) && String(c.text || "").trim(); })
        .map(c => replaceMetaVariables(c.text, getTemplateComponentType(c), draft)).filter(Boolean).join("\n");
    if (fromMeta) return fromMeta;
    return interpolateNumberedText(template.help || "", template.fields || [], draft);
}

function parseTemplateMarkerText(text) {
    const v = String(text || "");
    const match = v.match(/^\[TEMPLATE:([^\]]+)\]\s*(.*)$/s);
    if (!match) return { isTemplate: false, templateName: "", params: [], plainText: v };
    const templateName = match[1] || "";
    const params = String(match[2] || "").split("|").map(i => i.trim()).filter(Boolean);
    return { isTemplate: true, templateName, params, plainText: v };
}

function buildDraftFromTemplateParams(template, params = []) {
    const draft = {};
    (Array.isArray(template?.fields) ? template.fields : []).forEach((f, i) => { draft[f.key] = params[i] || ""; });
    return draft;
}

function formatTemplateMarkerText(text, templateMap) {
    const parsed = parseTemplateMarkerText(text);
    if (!parsed.isTemplate) return parsed.plainText;
    const template = templateMap.get(parsed.templateName);
    if (template) { const d = buildDraftFromTemplateParams(template, parsed.params); const p = buildTemplatePreviewText(template, d); if (p) return p; }
    return `Plantilla: ${parsed.templateName}${parsed.params.length ? "\n" + parsed.params.join("\n") : ""}`;
}

function getTemplateFieldNumber(field) {
    const index = Number(field?.index || 0);
    if (index > 0) return index;
    const match = String(field?.key || "").match(/(\d+)$/);
    return match ? Number(match[1]) : 1;
}

function getFriendlyTemplateFieldLabel(field) {
    const component = String(field?.component || "body").toLowerCase();
    const index = getTemplateFieldNumber(field);
    if (component === "header") return `Dato del encabezado ${index}`;
    if (component === "button") return `Dato del botón ${index}`;
    return `Dato variable ${index}`;
}

function normalizeTemplateFromApi(template) {
    return {
        ...template,
        key: template?.key || template?.name || "",
        name: template?.name || template?.key || "",
        title: template?.title || String(template?.name || template?.key || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        idioma: template?.idioma || template?.language || "es_MX",
        language: template?.language || template?.idioma || "es_MX",
        status: String(template?.status || "APPROVED").toUpperCase(),
        fields: Array.isArray(template?.fields) ? template.fields.map((field) => ({ ...field, required: true, friendlyLabel: getFriendlyTemplateFieldLabel(field) })) : [],
    };
}

function getFieldOptions(field) {
    if (Array.isArray(field?.options) && field.options.length) return field.options;
    const label = safeLower(field?.label), key = safeLower(field?.key);
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) return DEALERS;
    if (label.includes("canal") || key.includes("canal")) return CANALES;
    return [];
}

function getDefaultValueForTemplateField(field, context) {
    const label = safeLower(field?.label), key = safeLower(field?.key);
    if (label.includes("asesor") || key.includes("asesor") || label.includes("quién eres")) return context.asesor || "";
    if (label.includes("nombre") || label.includes("prospecto") || label.includes("cliente") || key.includes("nombre")) return context.nombre || "";
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) return context.agencia || "";
    if (label.includes("modelo") || label.includes("auto") || label.includes("vehículo") || key.includes("modelo") || key.includes("auto")) return context.modelo || "";
    if (label.includes("canal") || key.includes("canal")) return context.canal || "";
    if (label.includes("tema") || key.includes("tema")) return context.tema || "";
    if (label.includes("dato") || label.includes("pides") || key.includes("dato")) return context.dato || "";
    return "";
}

function buildDynamicTemplateComponents(template, draft) {
    const fields = Array.isArray(template?.fields) ? template.fields : [];
    const grouped = fields.reduce((acc, f) => { const c = String(f.component || "body").toLowerCase(); if (!acc[c]) acc[c] = []; acc[c].push(f); return acc; }, {});
    return Object.entries(grouped).map(([type, items]) => ({
        type,
        parameters: items.sort((a, b) => Number(a.index || 0) - Number(b.index || 0)).map(f => ({ type: "text", text: String(draft?.[f.key] || "").trim() })),
    })).filter(c => c.parameters.length > 0);
}


function parseWhatsAppFormat(texto) {
    let r = String(texto || "");
    r = r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    r = r.replace(/```([\s\S]+?)```/g, '<code class="inline-block rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">$1</code>');
    r = r.replace(/\*([^*\n]+)\*/g, '<strong class="font-black">$1</strong>');
    r = r.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    r = r.replace(/~([^~\n]+)~/g, "<del>$1</del>");
    r = r.replace(/\n/g, "<br>");
    return r;
}

function formatMessageTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });
}

function formatWhatsAppDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeStr = date.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });
    if (msgDate.getTime() === today.getTime()) return `Hoy ${timeStr}`;
    if (msgDate.getTime() === yesterday.getTime()) return `Ayer ${timeStr}`;
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()} ${timeStr}`;
}

function groupMessagesByDate(messages) {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];
    for (const msg of messages) {
        const msgDate = msg.created_at || msg.local_created_at || "";
        const dateObj = msgDate ? new Date(msgDate) : null;
        if (!dateObj || Number.isNaN(dateObj.getTime())) { currentGroup.push(msg); continue; }
        const dateKey = dateObj.toDateString();
        if (currentDate === null) { currentDate = dateKey; currentGroup = [msg]; }
        else if (dateKey === currentDate) { currentGroup.push(msg); }
        else {
            groups.push({ date: currentGroup[0]?.created_at || currentGroup[0]?.local_created_at || "", messages: currentGroup });
            currentDate = dateKey; currentGroup = [msg];
        }
    }
    if (currentGroup.length > 0) groups.push({ date: currentGroup[0]?.created_at || currentGroup[0]?.local_created_at || "", messages: currentGroup });
    return groups;
}

function DateSeparator({ date }) {
    if (!date) return null;
    return (
        <div className="sticky top-2 z-10 flex justify-center my-4 pointer-events-none">
            <div className="pointer-events-auto rounded-full border border-black/10 bg-white/90 backdrop-blur-sm px-4 py-1.5 text-xs font-extrabold text-[#131E5C] shadow-sm">
                {formatWhatsAppDate(date)}
            </div>
        </div>
    );
}

function shortName(name = "") {
    const v = String(name || "");
    if (v.length <= 22) return v;
    return `${v.slice(0, 12)}…${v.slice(-8)}`;
}

function getHostLabel(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Meta Ads"; }
}



function WhatsAppWaveform({ progress = 0, mine = false, onSeek }) {
    const bars = [8, 14, 10, 18, 12, 22, 16, 26, 20, 16, 24, 14, 18, 10, 22, 12, 16, 8, 14, 20, 12, 18, 10, 15, 9, 13, 18, 11, 16, 10];
    return (
        <button type="button" onClick={onSeek} className="flex h-9 flex-1 items-center gap-[2px] overflow-hidden rounded-lg px-1" title="Avanzar audio">
            {bars.map((h, index) => {
                const active = index / bars.length <= progress;
                return (
                    <span key={index}
                        className={cls("w-[3px] rounded-full transition", active ? (mine ? "bg-[#075E54]" : "bg-[#128C7E]") : (mine ? "bg-[#075E54]/25" : "bg-slate-300"))}
                        style={{ height: `${h}px` }} />
                );
            })}
        </button>
    );
}

function WhatsAppAudioPlayer({ src, mine }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const progress = duration ? Math.min(1, current / duration) : 0;

    async function togglePlay() {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) { audio.pause(); setPlaying(false); return; }
        try { await audio.play(); setPlaying(true); } catch (error) { console.error("No se pudo reproducir audio:", error); }
    }

    function handleSeek(e) {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = pct * duration;
        setCurrent(audio.currentTime);
    }

    return (
        <div className={cls("flex min-w-[220px] max-w-[300px] items-center gap-3 rounded-2xl px-3 py-2", mine ? "bg-[#D9FDD3] text-[#111B21]" : "bg-white text-[#111B21]")}>
            <audio ref={audioRef} src={src} preload="metadata"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
                onEnded={() => { setPlaying(false); setCurrent(0); }}
                className="hidden" />
            <button type="button" onClick={togglePlay}
                className={cls("flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition", mine ? "bg-[#075E54] text-white hover:bg-[#064C43]" : "bg-[#128C7E] text-white hover:bg-[#0F766E]")}
                title={playing ? "Pausar" : "Reproducir"}>
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
                <WhatsAppWaveform progress={progress} mine={mine} onSeek={handleSeek} />
                <div className="mt-0.5 flex items-center justify-between text-[11px] font-semibold text-[#667781]">
                    <span>{formatAudioTime(current || duration || 0)}</span>
                    <span>audio</span>
                </div>
            </div>
        </div>
    );
}

function WhatsAppAttachment({ mine, attachment }) {
    const src = attachment.url || attachment.previewUrl;
    if (!src) return null;

    if (attachment.kind === "sticker") {
        return (
            <a href={src} target="_blank" rel="noreferrer" className="block">
                <img src={src} alt={attachment.name || "sticker"} className="max-h-40 max-w-40 object-contain" loading="lazy" />
            </a>
        );
    }
    if (attachment.kind === "image") {
        return (
            <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                <img src={src} alt={attachment.name || "imagen"} className="block max-h-[320px] w-full max-w-[280px] object-cover" loading="lazy" />
            </a>
        );
    }
    if (attachment.kind === "video") {
        return (
            <div className="overflow-hidden rounded-xl bg-black">
                <video src={src} controls playsInline preload="metadata" className="block max-h-[320px] w-full max-w-[280px] bg-black object-contain" />
            </div>
        );
    }
    if (attachment.kind === "audio") return <WhatsAppAudioPlayer src={src} mine={mine} />;

    return (
        <a href={src} target="_blank" rel="noreferrer"
            className={cls("flex min-w-[200px] max-w-[280px] items-center gap-3 rounded-xl px-3 py-3 transition hover:opacity-90", mine ? "bg-[#D9FDD3] text-[#111B21]" : "bg-white text-[#111B21]")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10 text-[#128C7E]">
                <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{attachment.name ? shortName(attachment.name) : "Documento"}</div>
                <div className="text-[11px] font-semibold text-[#667781]">{attachment.size ? humanBytes(attachment.size) : "Abrir archivo"}</div>
            </div>
        </a>
    );
}

function MessageStatusTicks({ status, pending }) {
    if (pending) return <Clock className="h-3.5 w-3.5 opacity-60" title="Enviando…" />;
    const v = String(status || "").toLowerCase();
    if (v === "failed") return <AlertCircle className="h-3.5 w-3.5 text-red-300" title="Falló el envío" />;
    if (v === "read") return <CheckCheck className="h-3.5 w-3.5" style={{ color: "#53BDEB" }} title="Leído" />;
    if (v === "delivered") return <CheckCheck className="h-3.5 w-3.5 opacity-70" title="Entregado" />;
    if (v === "sent" || v === "accepted") return <Check className="h-3.5 w-3.5 opacity-70" title="Enviado" />;
    if (v === "received") return null;
    return <Check className="h-3.5 w-3.5 opacity-50" title="Enviado" />;
}

function PautaOrigenCard({ data }) {
    const [imageFailed, setImageFailed] = useState(false);
    if (!data?.pauta && !data?.headline && !data?.image_url) return null;
    const showImage = Boolean(data?.image_url && !imageFailed);

    const content = (
        <div className="overflow-hidden rounded-xl border border-[#131E5C]/15 bg-[#F0F2F5] shadow-sm">
            <div className="flex min-w-[230px] max-w-[300px] items-stretch">
                {showImage ? (
                    <div className="h-[84px] w-[84px] shrink-0 overflow-hidden bg-neutral-200">
                        <img src={data.image_url} alt={data.headline || data.pauta || "Anuncio de origen"} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
                    </div>
                ) : (
                    <div className="flex h-[84px] w-[66px] shrink-0 items-center justify-center bg-[#131E5C] text-white">
                        <LayoutTemplate className="h-5 w-5" />
                    </div>
                )}
                <div className="min-w-0 flex-1 px-2.5 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wide text-[#667781]">Anuncio de origen</div>
                    <div className="mt-0.5 line-clamp-2 text-xs font-extrabold leading-snug text-[#111B21]">{data.headline || data.nombre_campana || data.pauta}</div>
                    {data.body ? <div className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-[#667781]">{data.body}</div> : null}
                    <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-[#667781]">
                        <span className="truncate">{data.nombre_campana || data.pauta}</span>
                        {data.source_url ? <span className="shrink-0">· {getHostLabel(data.source_url)}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!data.source_url) return <div className="mb-2">{content}</div>;
    return (
        <a href={data.source_url} target="_blank" rel="noreferrer" className="mb-2 block transition hover:brightness-[0.98]" title="Abrir anuncio de origen">
            {content}
        </a>
    );
}

function DrawerBubble({ message, renderText, replyPreview, originPreview }) {
    const mine = Boolean(message.mine);
    const rawText = renderText ? renderText(message.text) : message.text;
    const shown = cleanMediaTextForBubble(rawText, message.attachments);
    const hasText = Boolean(String(shown || "").trim());
    const attachments = message.attachments || [];
    const hasAttachments = attachments.length > 0;
    const stickerOnly = hasAttachments && attachments.length === 1 && attachments[0]?.kind === "sticker" && !hasText;
    const time = formatMessageTime(message.created_at || message.local_created_at);

    return (
        <div className={cls("flex w-full", mine ? "justify-end" : "justify-start")}>
            <div className="max-w-[85%]">
                <div className={cls(
                    "relative shadow-sm",
                    stickerOnly ? "bg-transparent p-0 shadow-none" : cls(
                        "rounded-2xl",
                        mine ? "rounded-br-md bg-[#D9FDD3] text-[#111B21]" : "rounded-bl-md bg-white text-[#111B21] ring-1 ring-black/10",
                        "px-3 py-2"
                    )
                )}>
                    {!mine && originPreview && !stickerOnly ? <PautaOrigenCard data={originPreview} /> : null}

                    {replyPreview && !stickerOnly ? (
                        <div className={cls("mb-2 flex w-full items-start gap-2 rounded-lg border-l-4 px-2.5 py-1.5", mine ? "border-[#128C7E] bg-[#128C7E]/10" : "border-[#128C7E] bg-[#128C7E]/5")}>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-extrabold text-[#128C7E]">{replyPreview.author}</div>
                                <div className="truncate text-[11px] font-medium text-[#667781]">{replyPreview.text}</div>
                            </div>
                        </div>
                    ) : null}

                    {hasAttachments ? (
                        <div className={cls("grid gap-1.5", hasText ? "mb-1.5" : "")}>
                            {attachments.map((a) => <WhatsAppAttachment key={a.id} mine={mine} attachment={a} />)}
                        </div>
                    ) : null}

                    {hasText ? (
                        <div className="whitespace-pre-wrap px-0.5 text-[13px] font-medium leading-relaxed [&_strong]:font-black [&_em]:italic [&_del]:line-through"
                            dangerouslySetInnerHTML={{ __html: parseWhatsAppFormat(shown) }} />
                    ) : null}

                    <div className={cls("mt-1 flex items-center justify-end gap-1.5 px-0.5 text-[10px] font-semibold text-[#667781]", stickerOnly ? "" : "")}>
                        {message.is_ai ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-violet-700 ring-1 ring-violet-300" title="Mensaje generado por IA">
                                ✦ IA
                            </span>
                        ) : null}
                        <span>{time}</span>
                        {mine ? <MessageStatusTicks status={message.status || "sent"} pending={Boolean(message.local_pending)} /> : null}
                    </div>
                </div>

                {Array.isArray(message.reactions) && message.reactions.length ? (
                    <div className={cls("relative z-10 -mt-2 flex px-3", mine ? "justify-end" : "justify-start")}>
                        <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-sm shadow-sm">
                            {message.reactions.slice(0, 4).map((r) => <span key={r.id || r.emoji}>{r.emoji}</span>)}
                            {message.reactions.length > 4 ? <span className="text-[10px] font-extrabold text-slate-400">+{message.reactions.length - 4}</span> : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function isNearBottomDrawer(el, threshold = 150) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}



export function ChatDrawer({ open, telefono, numeroAsesor, onClose, clienteRetencion = null, }) {
    const [loading, setLoading] = useState(false);
    const [prospecto, setProspecto] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [templatesDisponibles, setTemplatesDisponibles] = useState([]);


    const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
    const [tplSelected, setTplSelected] = useState(null);
    const [tplDraft, setTplDraft] = useState({});
    const [templatesError, setTemplatesError] = useState("");
    const [sendingTemplate, setSendingTemplate] = useState(false);
    const templatesDropdownRef = useRef(null);


    const [showQuickBubblesDropdown, setShowQuickBubblesDropdown] = useState(false);
    const [quickBubbles, setQuickBubbles] = useState(() => {
        try { const s = localStorage.getItem(QUICK_BUBBLES_KEY); if (!s) return []; const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
    });
    const quickBubblesDropdownRef = useRef(null);


    const [editingBubbleId, setEditingBubbleId] = useState(null);
    const [editBubbleTitle, setEditBubbleTitle] = useState("");
    const [editBubbleText, setEditBubbleText] = useState("");

    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);


    const [openEmoji, setOpenEmoji] = useState(false);
    const emojiRef = useRef(null);
    const inputRef = useRef(null);


    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState("");
    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const discardRecordingRef = useRef(false);

    const scrollRef = useRef(null);
    const stickBottomRef = useRef(true);
    const pollRef = useRef(null);
    const tel = normalizaTelefonoMx(telefono);

    const templateMap = useMemo(() => {
        const map = new Map();
        for (const t of templatesDisponibles || []) { if (t?.key) map.set(t.key, t); }
        return map;
    }, [templatesDisponibles]);

    function renderTextForBubble(text) { return formatTemplateMarkerText(text, templateMap); }

    const templatePreview = useMemo(
        () => tplSelected ? buildTemplatePreviewText(tplSelected, tplDraft) : "",
        [tplSelected, tplDraft]
    );

    const incompleteTemplateFields = useMemo(() => {
        const fields = Array.isArray(tplSelected?.fields) ? tplSelected.fields : [];
        return fields.filter((field) => !String(tplDraft?.[field.key] || "").trim());
    }, [tplSelected, tplDraft]);

    const messagesById = useMemo(() => {
        const map = new Map();
        for (const m of mensajes) { const key = m.wa_message_id || m.id; if (key) map.set(String(key), m); }
        return map;
    }, [mensajes]);

    function getReplyPreview(message) {
        if (!message) return "";
        const text = cleanMediaTextForBubble(String(message.text || message.body || "").trim(), message.attachments || []);
        if (text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
        return (Array.isArray(message.attachments) && message.attachments.length > 0) ? "Archivo adjunto" : "Mensaje seleccionado";
    }

    function getReplyAuthor(message) {
        if (!message) return "";
        if (message.mine) return (message.is_ai || message?.raw?.ia_provider || message?.raw?.ia_model) ? "IA" : "Asesor";
        return "Cliente";
    }

    const pautaOrigenMarker = useMemo(() => {
        const mensajesOrdenados = applyReactionEvents(mensajes);
        const primerEntranteVisible = mensajesOrdenados.find((message) => !message?.mine);
        if (!primerEntranteVisible) return null;

        for (const message of mensajesOrdenados) {
            if (message?.mine) continue;
            const pautaMensaje = getPautaOrigenFromMessage(message);
            if (pautaMensaje) return { messageKey: getMessageKey(message), ...pautaMensaje };
        }

        const previewExpediente = asObject(prospecto?.origen_preview || prospecto?.origin_preview);
        if (Object.keys(previewExpediente).length > 0) {
            return {
                messageKey: getMessageKey(primerEntranteVisible),
                ...previewExpediente,
                pauta: previewExpediente.pauta || prospecto?.pauta || "",
                headline: previewExpediente.headline || previewExpediente.nombre_campana || prospecto?.pauta || "Anuncio de origen",
            };
        }

        const pauta = String(prospecto?.pauta || "").trim();
        if (pauta) {
            return {
                messageKey: getMessageKey(primerEntranteVisible),
                pauta, nombre_campana: pauta, sucursal: prospecto?.agencia || "", headline: pauta,
                body: "Prospecto originado desde una campaña de Meta.", source_url: "", image_url: "", origen: "expediente",
            };
        }
        return null;
    }, [mensajes, prospecto]);

    async function cargar({ markRead = true } = {}) {
        if (!tel) return;
        try {
            const data = await api.digitalesContacto(tel, { limit: 40, mark_read: markRead ? 1 : 0, numero_asesor: numeroAsesor });
            const items = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            setProspecto(data.prospecto || null);
            setMensajes((prev) => mergeMessages(prev, items));
        } catch (error) {
            console.error("Error cargando chat en drawer:", error);
        }
    }

    async function cargarPlantillasDrawer() {
        try {
            const response = await api.digitalesPlantillas({ numero_asesor: numeroAsesor });
            const items = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
            const aprobadas = items
                .map(normalizeTemplateFromApi)
                .filter((template) => String(template?.status || "APPROVED").toUpperCase() === "APPROVED")
                .filter((template) => template.key);
            setTemplatesDisponibles(aprobadas);
            if (!aprobadas.length) setTemplatesError("No hay plantillas aprobadas disponibles para esta línea.");
        } catch (error) {
            console.error("Error cargando plantillas en drawer:", error);
            setTemplatesDisponibles([]);
            setTemplatesError(error?.message || "No se pudieron consultar las plantillas aprobadas en Meta.");
        }
    }

    useEffect(() => {
        if (!open || !tel) return;
        setMensajes([]);
        setProspecto(null);
        setDraft("");
        setTplSelected(null);
        setTplDraft({});
        setTemplatesError("");
        setShowTemplatesDropdown(false);
        setShowQuickBubblesDropdown(false);
        setAttachments([]);
        setOpenEmoji(false);
        setRecordingError("");
        setEditingBubbleId(null);
        stickBottomRef.current = true;
        (async () => {
            setLoading(true);
            await Promise.all([cargar({ markRead: true }), cargarPlantillasDrawer()]);
            setLoading(false);
        })();

        pollRef.current = window.setInterval(() => { cargar({ markRead: false }); }, DRAWER_POLL_MS);
        return () => { if (pollRef.current) window.clearInterval(pollRef.current); };

    }, [open, tel]);

    useEffect(() => {
        if (!stickBottomRef.current || !scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [mensajes.length]);

    useEffect(() => {
        function onKeyDown(e) { if (e.key === "Escape") onClose?.(); }
        if (open) document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);


    useEffect(() => {
        if (!showTemplatesDropdown) return;
        const onDoc = (e) => {
            if (templatesDropdownRef.current && !templatesDropdownRef.current.contains(e.target)) {
                setShowTemplatesDropdown(false);
                setTplSelected(null);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showTemplatesDropdown]);


    useEffect(() => {
        if (!showQuickBubblesDropdown) return;
        const onDoc = (e) => {
            if (quickBubblesDropdownRef.current && !quickBubblesDropdownRef.current.contains(e.target)) {
                setShowQuickBubblesDropdown(false);
                setEditingBubbleId(null);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showQuickBubblesDropdown]);


    useEffect(() => {
        const onDoc = (e) => {
            if (!openEmoji) return;
            if (emojiRef.current && !emojiRef.current.contains(e.target)) setOpenEmoji(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [openEmoji]);


    useEffect(() => {
        return () => {
            cleanupPreviews(attachments);
            discardRecordingRef.current = true;
            const recorder = mediaRecorderRef.current;
            if (recorder && recorder.state !== "inactive") { try { recorder.stop(); } catch { } }
            if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
            mediaStreamRef.current?.getTracks?.().forEach((t) => t.stop());
        };

    }, []);

    function onScroll(e) { stickBottomRef.current = isNearBottomDrawer(e.currentTarget); }

    function cleanupPreviews(list) {
        for (const a of list || []) {
            if (a?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(a.previewUrl); } catch { } }
        }
    }


    function addFilesAsAttachments(files) {
        const arr = Array.from(files || []);
        if (!arr.length) return;
        setAttachments((prev) => {
            const next = [...prev];
            const sig = (f) => `${f?.name || ""}|${f?.size || 0}|${f?.lastModified || 0}`;
            const existing = new Set(next.map((a) => sig(a.file)));
            for (const file of arr) {
                if (!file) continue;
                const key = sig(file);
                if (existing.has(key)) continue;
                const id = crypto.randomUUID();
                const localUrl = URL.createObjectURL(file);
                next.push({ id, file, kind: fileKind(file), previewUrl: localUrl, url: localUrl, name: file.name, size: file.size, mime: file.type || "" });
                existing.add(key);
            }
            return next.slice(0, 10);
        });
    }

    function removeAttachment(id) {
        setAttachments((prev) => {
            const t = prev.find((i) => i.id === id);
            if (t?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(t.previewUrl); } catch { } }
            return prev.filter((i) => i.id !== id);
        });
    }


    function onPickEmoji(emojiObj) {
        const emoji = emojiObj?.emoji || "";
        if (!emoji) return;
        const input = inputRef.current;
        if (input && typeof input.selectionStart === "number") {
            const s = input.selectionStart, e = input.selectionEnd;
            const next = `${draft.slice(0, s)}${emoji}${draft.slice(e)}`;
            setDraft(next);
            requestAnimationFrame(() => { input.focus(); input.setSelectionRange(s + emoji.length, s + emoji.length); });
            return;
        }
        setDraft((prev) => `${prev}${emoji}`);
        requestAnimationFrame(() => inputRef.current?.focus?.());
    }

    function onPasteInComposer(e) {
        if (!tel) return;
        const items = e.clipboardData?.items ? Array.from(e.clipboardData.items) : [];
        const files = [];
        for (const item of items) { if (item.kind === "file") { const f = item.getAsFile?.(); if (f) files.push(f); } }
        if (files.length) { e.preventDefault(); addFilesAsAttachments(files); }
    }


    function cleanupRecordingResources() {
        if (recordingTimerRef.current) { window.clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
        mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setRecordingSeconds(0);
    }

    function detenerGrabacionAudio() {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === "inactive") { cleanupRecordingResources(); return; }
        recorder.stop();
    }

    function cancelarGrabacionAudio() {
        discardRecordingRef.current = true;
        detenerGrabacionAudio();
    }

    async function iniciarGrabacionAudio() {
        if (!tel || isRecording) return;
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setRecordingError("Este navegador no permite grabar audio. Usa Chrome, Edge o Safari actualizado.");
            return;
        }
        try {
            setRecordingError("");
            discardRecordingRef.current = false;
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: false,
            });
            const mimeType = getSupportedRecorderMimeType();
            const options = mimeType ? { mimeType, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 };
            const recorder = new MediaRecorder(stream, options);

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => { if (event.data?.size > 0) audioChunksRef.current.push(event.data); };
            recorder.onerror = (event) => {
                console.error("Error grabando audio:", event?.error || event);
                setRecordingError("Ocurrió un error durante la grabación.");
                discardRecordingRef.current = true;
                cleanupRecordingResources();
            };
            recorder.onstop = () => {
                const chunks = [...audioChunksRef.current];
                const discard = discardRecordingRef.current;
                const finalMime = recorder.mimeType || mimeType || "audio/webm";
                audioChunksRef.current = [];
                discardRecordingRef.current = false;
                cleanupRecordingResources();
                if (discard || !chunks.length) return;
                const blob = new Blob(chunks, { type: finalMime });
                if (blob.size < 512) { setRecordingError("La grabación quedó vacía. Intenta nuevamente."); return; }
                const extension = getAudioExtension(finalMime);
                const file = new File([blob], `nota-voz-${Date.now()}.${extension}`, { type: finalMime, lastModified: Date.now() });
                addFilesAsAttachments([file]);
            };

            recorder.start(250);
            setIsRecording(true);
            setRecordingSeconds(0);

            recordingTimerRef.current = window.setInterval(() => {
                setRecordingSeconds((current) => {
                    const next = current + 1;
                    if (next >= MAX_RECORDING_SECONDS) window.setTimeout(detenerGrabacionAudio, 0);
                    return Math.min(next, MAX_RECORDING_SECONDS);
                });
            }, 1000);
        } catch (error) {
            console.error("No se pudo iniciar la grabación:", error);
            if (error?.name === "NotAllowedError") setRecordingError("Permite el acceso al micrófono para grabar notas de voz.");
            else if (error?.name === "NotFoundError") setRecordingError("No se encontró un micrófono disponible.");
            else setRecordingError(error?.message || "No se pudo iniciar la grabación.");
            cleanupRecordingResources();
        }
    }


    async function enviar() {
        if (isRecording) { setRecordingError("Detén la grabación antes de enviar el mensaje."); return; }
        const text = draft.trim();
        const hasAttachments = attachments.length > 0;
        if ((!text && !hasAttachments) || !tel || sending) return;

        const optimisticId = crypto.randomUUID();
        const currentAttachments = attachments;
        const optimisticAttachments = currentAttachments.map((a) => ({
            id: a.id, kind: a.kind, previewUrl: a.previewUrl, url: a.previewUrl, name: a.name, size: a.size, mime: a.mime,
        }));

        setSending(true);
        setDraft("");
        setAttachments([]);
        stickBottomRef.current = true;
        setMensajes((prev) => [...prev, {
            id: optimisticId, mine: true, text: text || "Adjunto",
            attachments: optimisticAttachments, local_created_at: new Date().toISOString(), status: "sent",
        }]);
        try {
            if (hasAttachments) {
                await api.digitalesEnviarMedia({
                    to: tel, text, files: currentAttachments.map((a) => a.file).filter(Boolean), numero_asesor: numeroAsesor,
                });
            } else {
                await api.digitalesEnviarMensaje({ to: tel, text, numero_asesor: numeroAsesor });
            }
            await cargar({ markRead: false });
        } catch (error) {
            alert(`Falló el envío: ${error.message}`);
        } finally {
            setSending(false);
            cleanupPreviews(optimisticAttachments);
        }
    }

    function onKeyDownComposer(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    }


    function toggleQuickBubbles() {
        if (!showQuickBubblesDropdown) {
            try {
                const s = localStorage.getItem(QUICK_BUBBLES_KEY);
                const p = s ? JSON.parse(s) : [];
                setQuickBubbles(Array.isArray(p) ? p : []);
            } catch { /* noop */ }
        }
        setShowQuickBubblesDropdown((prev) => !prev);
        setShowTemplatesDropdown(false);
        setEditingBubbleId(null);
    }

    async function sendQuickBubble(text) {
        if (!tel || !String(text || "").trim() || sending) return;
        setShowQuickBubblesDropdown(false);
        const optimisticId = crypto.randomUUID();
        stickBottomRef.current = true;
        setMensajes((prev) => [...prev, {
            id: optimisticId, local_pending: true, local_created_at: new Date().toISOString(),
            mine: true, text: text.trim(), status: "sent", attachments: [],
        }]);
        try {
            await api.digitalesEnviarMensaje({ to: tel, text: text.trim(), numero_asesor: numeroAsesor });
            await cargar({ markRead: false });
        } catch (error) {
            alert(`Falló: ${error.message}`);
            await cargar({ markRead: false }).catch(() => { });
        }
    }

    function startEditQuickBubble(bubble) {
        setEditingBubbleId(bubble.id);
        setEditBubbleTitle(bubble.title);
        setEditBubbleText(bubble.text);
    }

    function cancelEditQuickBubble() {
        setEditingBubbleId(null);
        setEditBubbleTitle("");
        setEditBubbleText("");
    }

    function saveEditQuickBubble() {
        const text = editBubbleText.trim();
        if (!text || !editingBubbleId) return;
        setQuickBubbles((prev) => {
            const next = prev.map((b) =>
                b.id === editingBubbleId ? { ...b, title: editBubbleTitle.trim() || text.slice(0, 25), text } : b
            );
            try { localStorage.setItem(QUICK_BUBBLES_KEY, JSON.stringify(next)); } catch { }
            return next;
        });
        cancelEditQuickBubble();
    }

    function deleteQuickBubble(id) {
        setQuickBubbles((prev) => {
            const next = prev.filter((b) => b.id !== id);
            try { localStorage.setItem(QUICK_BUBBLES_KEY, JSON.stringify(next)); } catch { }
            return next;
        });
        if (editingBubbleId === id) cancelEditQuickBubble();
    }


    async function abrirPlantillasDropdown() {
        if (!tel) return;
        if (showTemplatesDropdown) {
            setShowTemplatesDropdown(false);
            setTplSelected(null);
            setTplDraft({});
            setTemplatesError("");
            return;
        }
        setTplSelected(null);
        setTplDraft({});
        setTemplatesError("");
        setShowQuickBubblesDropdown(false);
        setOpenEmoji(false);
        setShowTemplatesDropdown(true);
        if (!templatesDisponibles.length) await cargarPlantillasDrawer();
    }

    function pickTemplate(template) {
        const normalizedTemplate = normalizeTemplateFromApi(template);
        setTplSelected(normalizedTemplate);
        setTemplatesError("");

        const currentAgencia = String(prospecto?.agencia || "").trim();
        const bestDealer =
            DEALERS.find((dealer) => dealer.toLowerCase() === currentAgencia.toLowerCase()) ||
            DEALERS.find((dealer) => currentAgencia.toLowerCase().includes(dealer.toLowerCase())) ||
            "";

        const canalActual = String(prospecto?.canal_contacto || "").trim();
        const bestCanal = CANALES.find((canal) => canal.toLowerCase() === canalActual.toLowerCase()) || "";

        const asesorAuto = String(prospecto?.asesor_digital || prospecto?.asesor_ventas || prospecto?.responsable || "").trim();

        const context = {
            nombre: String(prospecto?.nombre || "").trim(),
            agencia: bestDealer,
            modelo: String(prospecto?.auto_interes || "").trim(),
            canal: bestCanal,
            asesor: asesorAuto,
            tema: prospecto?.auto_interes ? "auto de interés" : "cita",
            dato: "",
        };

        const values = {};
        for (const field of normalizedTemplate.fields) {
            values[field.key] = getDefaultValueForTemplateField(field, context);
        }
        setTplDraft(values);
    }

    async function enviarPlantilla() {
        if (!tel || !tplSelected || sendingTemplate) return;

        const fields = Array.isArray(tplSelected.fields) ? tplSelected.fields : [];
        const incompleteField = fields.find((field) => !String(tplDraft?.[field.key] || "").trim());
        if (incompleteField) {
            setTemplatesError(`Completa el campo obligatorio: ${incompleteField.friendlyLabel || getFriendlyTemplateFieldLabel(incompleteField)}.`);
            return;
        }

        const idioma = tplSelected.idioma || tplSelected.language || "es_MX";
        const templateName = tplSelected.key || tplSelected.name;
        if (!templateName) { setTemplatesError("La plantilla seleccionada no tiene un nombre válido."); return; }

        const textoPreview = buildTemplatePreviewText(tplSelected, tplDraft);
        const components = buildDynamicTemplateComponents(tplSelected, tplDraft);
        const optimisticId = crypto.randomUUID();

        setTemplatesError("");
        setSendingTemplate(true);
        stickBottomRef.current = true;

        setMensajes((prev) => [...prev, {
            id: optimisticId, local_pending: true, local_created_at: new Date().toISOString(),
            mine: true, text: textoPreview || `Plantilla: ${templateName}`, status: "sent", attachments: [],
        }]);

        try {
            await api.digitalesEnviarPlantilla({
                to: tel,
                template_name: templateName,
                idioma,
                components: components.length > 0 ? components : undefined,
                params: components.length > 0 ? undefined : [],
                numero_asesor: numeroAsesor,
            });

            setShowTemplatesDropdown(false);
            setTplSelected(null);
            setTplDraft({});
            setTemplatesError("");
            await cargar({ markRead: false });
        } catch (error) {
            console.error("Error enviando plantilla desde drawer:", error);
            setTemplatesError(error?.message || "No se pudo enviar la plantilla.");
            setMensajes((prev) => prev.filter((m) => m.id !== optimisticId));
            await cargar({ markRead: false }).catch(() => { });
        } finally {
            setSendingTemplate(false);
        }
    }

    if (!open) return null;

    const groupedMessages = groupMessagesByDate(applyReactionEvents(mensajes));
    const composerDisabled = !tel;
    const enviarDisabled = sending || isRecording || (!draft.trim() && attachments.length === 0);
   
    const nombreMostrar =
        prospecto?.nombre ||
        clienteRetencion?.nombre_cliente ||
        "Cliente";

    const estadoMostrar =
        prospecto?.estado ||
        clienteRetencion?.estado_actividad ||
        "Sin estado";

    const vehiculoMostrar =
        prospecto?.auto_interes ||
        clienteRetencion?.modelo_nombre ||
        "Sin definir";

    return (
        <div className="fixed inset-0 z-[95] flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />

            <div className="relative flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl">

                <div className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 py-3">
                    <Avatar name={nombreMostrar} />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold text-[#131E5C]">{nombreMostrar} </div>
                        <div className="text-xs font-semibold text-slate-400">{formateaTelUi(tel)}</div>
                    </div>
                    <a href={`https://wa.me/${tel}`} target="_blank" rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="Llamar por WhatsApp">
                        <Phone className="h-4 w-4" />
                    </a>
                    <button type="button" onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-neutral-100 hover:text-slate-600"
                        title="Cerrar">
                        <X className="h-4 w-4" />
                    </button>
                </div>


                <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-black/10 bg-neutral-50 px-4 py-3">
                    <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#131E5C]/50">Estado actual</div>
                        <div className="mt-0.5 truncate text-sm font-extrabold text-[#131E5C]">{estadoMostrar}</div>
                    </div>
                    <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#131E5C]/50">Vehículo de interés</div>
                        <div className="mt-0.5 truncate text-sm font-extrabold text-[#131E5C]">{vehiculoMostrar}</div>
                    </div>
                </div>


                <div
                    ref={scrollRef}
                    onScroll={onScroll}
                    className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.76)), url('/crm/chat/fondo_chat.png')`,
                        backgroundRepeat: "repeat",
                        backgroundPosition: "center top",
                        backgroundSize: "420px auto",
                    }}
                >
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : mensajes.length === 0 ? (
                        <div className="py-10 text-center text-sm font-semibold text-slate-400">Aún no hay mensajes con este número.</div>
                    ) : (
                        groupedMessages.map((group, groupIndex) => (
                            <div key={`group-${groupIndex}-${group.date}`} className="relative">
                                <DateSeparator date={group.date} />
                                {group.messages.map((message) => {
                                    const messageKey = getMessageKey(message);
                                    const quoted = message.reply_to_id ? messagesById.get(String(message.reply_to_id)) : null;
                                    const mostrarPautaOrigen = Boolean(pautaOrigenMarker?.messageKey && pautaOrigenMarker.messageKey === messageKey);
                                    return (
                                        <DrawerBubble
                                            key={messageKey}
                                            message={message}
                                            renderText={renderTextForBubble}
                                            originPreview={mostrarPautaOrigen ? pautaOrigenMarker : null}
                                            replyPreview={quoted ? { author: getReplyAuthor(quoted), text: getReplyPreview(quoted) } : null}
                                        />
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>


                <div className="shrink-0 border-t border-black/10 bg-white px-3 py-3">

                    {attachments.length ? (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {attachments.map((a) => (
                                <div key={a.id} className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2">
                                    {a.kind === "image" ? (
                                        <div className="h-9 w-9 overflow-hidden rounded-lg border border-black/10 bg-white">
                                            <img src={a.previewUrl} alt={a.name} className="h-full w-full object-cover" />
                                        </div>
                                    ) : a.kind === "audio" ? (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#131E5C]/10 text-[#131E5C]">
                                            <Mic className="h-4 w-4" />
                                        </div>
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#131E5C]/10 text-[#131E5C]">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="max-w-[140px] truncate text-xs font-extrabold text-[#131E5C]">
                                            {a.name || (a.kind === "audio" ? "Nota de voz" : "Archivo")}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500">{humanBytes(a.size)}</div>
                                    </div>
                                    <button type="button" onClick={() => removeAttachment(a.id)}
                                        className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white hover:bg-neutral-100" title="Quitar">
                                        <X className="h-3.5 w-3.5 text-[#131E5C]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}


                    {recordingError ? (
                        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                            <span>{recordingError}</span>
                            <button type="button" onClick={() => setRecordingError("")}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-red-100" title="Cerrar">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null}


                    {isRecording ? (
                        <div className="mb-2 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 shadow-sm">
                            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-extrabold text-red-700">Grabando nota de voz</div>
                                <div className="text-[11px] font-semibold text-red-500">
                                    {formatAudioTime(recordingSeconds)} / {formatAudioTime(MAX_RECORDING_SECONDS)}
                                </div>
                            </div>
                            <button type="button" onClick={cancelarGrabacionAudio}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2 text-xs font-extrabold text-red-600 hover:bg-red-100"
                                title="Cancelar grabación">
                                <X className="h-3.5 w-3.5" />Cancelar
                            </button>
                            <button type="button" onClick={detenerGrabacionAudio}
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2 text-xs font-extrabold text-white hover:bg-red-700"
                                title="Detener y adjuntar">
                                <Square className="h-3.5 w-3.5 fill-current" />Detener
                            </button>
                        </div>
                    ) : null}


                    <div className="mb-2 flex flex-wrap items-center gap-1">
                        {/* Emoji */}
                        <div className="relative" ref={emojiRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpenEmoji((prev) => !prev);
                                    setShowTemplatesDropdown(false);
                                    setShowQuickBubblesDropdown(false);
                                }}
                                disabled={composerDisabled}
                                className={cls(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                    composerDisabled ? "cursor-not-allowed opacity-50" : "",
                                    openEmoji ? "bg-neutral-100 text-[#131E5C]" : ""
                                )}
                                title="Emojis"
                            >
                                <Smile className="h-4 w-4" />
                            </button>
                            {openEmoji ? (
                                <div className="absolute bottom-11 left-0 z-50 w-[300px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                    <EmojiPicker onEmojiClick={onPickEmoji} searchDisabled={false} skinTonesDisabled={false} lazyLoadEmojis height={340} width="100%" />
                                </div>
                            ) : null}
                        </div>


                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => { addFilesAsAttachments(e.target.files); e.target.value = ""; }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={composerDisabled || isRecording}
                            className={cls(
                                "inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                (composerDisabled || isRecording) ? "cursor-not-allowed opacity-50" : ""
                            )}
                            title="Adjuntar"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>


                        <button
                            type="button"
                            onClick={isRecording ? detenerGrabacionAudio : iniciarGrabacionAudio}
                            disabled={composerDisabled}
                            className={cls(
                                "inline-flex h-8 w-8 items-center justify-center rounded-xl transition",
                                isRecording ? "bg-red-100 text-red-600" : "text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C]",
                                composerDisabled ? "cursor-not-allowed opacity-50" : ""
                            )}
                            title={isRecording ? "Detener grabación" : "Grabar nota de voz"}
                        >
                            {isRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
                        </button>


                        <div className="relative" ref={templatesDropdownRef}>
                            <button
                                type="button"
                                onClick={abrirPlantillasDropdown}
                                disabled={!tel || sendingTemplate}
                                className={cls(
                                    "inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                    (!tel || sendingTemplate) ? "cursor-not-allowed opacity-50" : "",
                                    showTemplatesDropdown ? "bg-neutral-100 text-[#131E5C]" : ""
                                )}
                                title="Plantillas"
                            >
                                <LayoutTemplate className="h-4 w-4" />
                                <span>Plantillas</span>
                            </button>

                            {showTemplatesDropdown ? (
                                <div className="absolute bottom-11 left-0 z-50 max-h-96 w-[320px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            {tplSelected ? (
                                                <button type="button" onClick={() => { setTplSelected(null); setTplDraft({}); setTemplatesError(""); }}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </button>
                                            ) : null}
                                            <span className="text-xs font-extrabold text-[#131E5C]">
                                                {tplSelected ? `Plantilla: ${tplSelected.title || tplSelected.key}` : "Plantillas"}
                                            </span>
                                        </div>
                                        <button type="button" onClick={() => { setShowTemplatesDropdown(false); setTplSelected(null); setTplDraft({}); setTemplatesError(""); }}
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto">
                                        {!tplSelected ? (
                                            templatesDisponibles.length === 0 ? (
                                                templatesError ? (
                                                    <div className="m-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                        <span>{templatesError}</span>
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">No hay plantillas disponibles.</div>
                                                )
                                            ) : (
                                                templatesDisponibles.map((template) => (
                                                    <button key={`${template.key}-${template.idioma || template.language || "x"}`} type="button" onClick={() => pickTemplate(template)}
                                                        className="w-full border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-neutral-50 transition">
                                                        <div className="text-xs font-extrabold text-[#131E5C]">{template.title || template.key}</div>
                                                        <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{template.key} · {template.idioma || template.language || "es_MX"}</div>
                                                    </button>
                                                ))
                                            )
                                        ) : (
                                            <div className="space-y-3 p-4">
                                                {templatesError ? (
                                                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                        <span>{templatesError}</span>
                                                    </div>
                                                ) : null}

                                                <div className="whitespace-pre-wrap rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs font-semibold text-[#131E5C]">
                                                    {templatePreview || tplSelected.help || "Sin texto visible."}
                                                </div>

                                                {(tplSelected.fields || []).map((field) => {
                                                    const options = getFieldOptions(field);
                                                    return (
                                                        <div key={field.key}>
                                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                                <div className="text-[11px] font-extrabold text-[#131E5C]">
                                                                    {field.friendlyLabel || getFriendlyTemplateFieldLabel(field)}
                                                                    <span className="ml-1 text-red-600">*</span>
                                                                </div>
                                                                <span className="text-[10px] font-semibold text-slate-400">Obligatorio</span>
                                                            </div>
                                                            {options.length ? (
                                                                <select
                                                                    value={tplDraft[field.key] || ""}
                                                                    onChange={(event) => { setTplDraft((current) => ({ ...current, [field.key]: event.target.value })); setTemplatesError(""); }}
                                                                    className={cls(
                                                                        "w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none transition",
                                                                        !String(tplDraft[field.key] || "").trim() ? "border-red-200 focus:border-red-400" : "border-black/10 focus:border-[#131E5C]/40"
                                                                    )}
                                                                >
                                                                    <option value="" disabled>Selecciona un valor…</option>
                                                                    {options.map((option) => <option key={option} value={option}>{option}</option>)}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    value={tplDraft[field.key] || ""}
                                                                    onChange={(event) => { setTplDraft((current) => ({ ...current, [field.key]: event.target.value })); setTemplatesError(""); }}
                                                                    placeholder="Escribe el dato que se enviará"
                                                                    className={cls(
                                                                        "w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none transition",
                                                                        !String(tplDraft[field.key] || "").trim() ? "border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-black/10 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10"
                                                                    )}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {!(tplSelected.fields || []).length ? (
                                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Esta plantilla no requiere parámetros.</div>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={enviarPlantilla}
                                                    disabled={sendingTemplate || incompleteTemplateFields.length > 0}
                                                    className="w-full rounded-xl py-2.5 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                    style={{ backgroundColor: BRAND_BLUE }}
                                                >
                                                    {sendingTemplate
                                                        ? "Enviando plantilla..."
                                                        : incompleteTemplateFields.length > 0
                                                            ? `Completa ${incompleteTemplateFields.length} dato${incompleteTemplateFields.length === 1 ? "" : "s"}`
                                                            : "Enviar plantilla"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>


                        <div className="relative" ref={quickBubblesDropdownRef}>
                            <button
                                type="button"
                                onClick={toggleQuickBubbles}
                                disabled={!tel}
                                className={cls(
                                    "inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                    !tel ? "cursor-not-allowed opacity-50" : "",
                                    showQuickBubblesDropdown ? "bg-neutral-100 text-[#131E5C]" : ""
                                )}
                                title="Respuesta rápida"
                            >
                                <Zap className="h-4 w-4" />
                                <span>Rápidos</span>
                            </button>

                            {showQuickBubblesDropdown ? (
                                <div className="absolute bottom-11 left-0 z-50 max-h-80 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                        <span className="text-xs font-extrabold text-[#131E5C]">Mensajes rápidos</span>
                                        <button type="button" onClick={() => { setShowQuickBubblesDropdown(false); cancelEditQuickBubble(); }}
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {quickBubbles.length === 0 ? (
                                            <div className="px-4 py-5 text-center text-xs font-semibold text-slate-400">
                                                Sin mensajes rápidos aún.<br />Agrégalos desde la vista de Chats.
                                            </div>
                                        ) : (
                                            quickBubbles.map((bubble) => (
                                                editingBubbleId === bubble.id ? (
                                                    <div key={bubble.id} className="border-b border-black/5 bg-neutral-50 p-3 last:border-0">
                                                        <input
                                                            value={editBubbleTitle}
                                                            onChange={(e) => setEditBubbleTitle(e.target.value)}
                                                            placeholder="Título (opcional)"
                                                            className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#131E5C] outline-none"
                                                        />
                                                        <textarea
                                                            value={editBubbleText}
                                                            onChange={(e) => setEditBubbleText(e.target.value)}
                                                            rows={2}
                                                            className="mb-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#131E5C] outline-none"
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button type="button" onClick={cancelEditQuickBubble}
                                                                className="rounded-lg border border-black/10 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-neutral-100">
                                                                Cancelar
                                                            </button>
                                                            <button type="button" onClick={saveEditQuickBubble} disabled={!editBubbleText.trim()}
                                                                className="rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                                                                style={{ backgroundColor: BRAND_BLUE }}>
                                                                Guardar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={bubble.id} className="group flex items-center gap-2 border-b border-black/5 px-4 py-2.5 last:border-0 hover:bg-neutral-50">
                                                        <button type="button" onClick={() => sendQuickBubble(bubble.text)} className="min-w-0 flex-1 text-left" title={bubble.text}>
                                                            <div className="truncate text-xs font-extrabold text-[#131E5C]">{bubble.title}</div>
                                                            <div className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{bubble.text}</div>
                                                        </button>
                                                        <button type="button" onClick={() => startEditQuickBubble(bubble)}
                                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#131E5C] hover:bg-[#131E5C]/10 sm:opacity-0 sm:group-hover:opacity-100"
                                                            title="Editar">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button type="button" onClick={() => deleteQuickBubble(bubble.id)}
                                                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                                                            title="Eliminar">
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                )
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onKeyDownComposer}
                            onPaste={onPasteInComposer}
                            rows={1}
                            disabled={composerDisabled || isRecording}
                            placeholder={isRecording ? "Grabando nota de voz…" : "Escribe tu mensaje…"}
                            className="max-h-28 flex-1 resize-none rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-medium text-[#131E5C] outline-none focus:border-[#131E5C]/40 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                        <button type="button" onClick={enviar} disabled={enviarDisabled}
                            className={cls("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition", enviarDisabled ? "cursor-not-allowed bg-slate-300" : "hover:opacity-90")}
                            style={{ backgroundColor: enviarDisabled ? undefined : BRAND_BLUE }}
                            title="Enviar">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-2 text-center text-[11px] font-semibold text-slate-400">
                        Vista rápida — para adjuntar más de un archivo o revisar historial completo, abre el chat completo.
                    </div>
                </div>
            </div>
        </div>
    );
}



export default function DigitalesBandeja() {
    const navigate = useNavigate();
    const { user, ready } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = normalizeText(user?.rol);
        return rol === "administrador" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const numerosAsignados = useMemo(() => obtenerNumerosWhatsAppUsuario(user), [user]);

    const numerosDisponibles = useMemo(() => {
        if (isAdmin) return [...new Set([...Object.keys(LINEAS_WHATSAPP), ...numerosAsignados])];
        return numerosAsignados;
    }, [isAdmin, numerosAsignados]);

    const [numeroAsesorActivo, setNumeroAsesorActivo] = useState("");
    const [chats, setChats] = useState([]);
    const [prospectosIndex, setProspectosIndex] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [draggingTel, setDraggingTel] = useState("");
    const [dragOverEstado, setDragOverEstado] = useState("");
    const [savingTel, setSavingTel] = useState("");
    const [drawerTel, setDrawerTel] = useState("");

    const requestRef = useRef(0);

    useEffect(() => {
        if (!ready) return;
        if (!numerosDisponibles.length) { setNumeroAsesorActivo(""); return; }
        const guardado = normalizaTelefonoMx(localStorage.getItem("digitales_numero_asesor_activo") || "");
        setNumeroAsesorActivo((actual) => {
            if (actual && numerosDisponibles.includes(actual)) return actual;
            return guardado && numerosDisponibles.includes(guardado) ? guardado : numerosDisponibles[0];
        });
    }, [ready, numerosDisponibles]);

    async function cargarTodo() {
        const numeroLinea = normalizaTelefonoMx(numeroAsesorActivo);
        if (!numeroLinea) return;
        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setLoading(true);
        try {
            const [chatsResp, prospectosResp] = await Promise.all([
                api.digitalesChats({ numero_asesor: numeroLinea }),
                api.digitalesListProspectos({ numero_asesor: numeroLinea }).catch(() => []),
            ]);
            if (requestId !== requestRef.current) return;

            const items = Array.isArray(chatsResp) ? chatsResp : Array.isArray(chatsResp?.results) ? chatsResp.results : [];
            const normalized = items.map((chat) => ({
                id: chat?.id || `${numeroLinea}-${chat?.telefono}`,
                telefono: normalizaTelefonoMx(chat?.telefono || ""),
                nombre: chat?.nombre || "Prospecto",
                agencia: chat?.agencia || "",
                estado: chat?.estado || "",
                unread: Number(chat?.unread || 0),
                last: {
                    text: chat?.last_text || "",
                    time: chat?.last_time || "",
                    timestamp: chat?.last_message_at || "",

                },
            })).filter((c) => c.telefono);

            setChats(normalized);
            setProspectosIndex(Array.isArray(prospectosResp) ? prospectosResp : []);
        } catch (error) {
            console.error("Error cargando bandeja de chats:", error);
        } finally {
            if (requestId === requestRef.current) setLoading(false);
        }
    }

    useEffect(() => { cargarTodo(); }, [numeroAsesorActivo]);

    const prospectoIdPorTel = useMemo(() => {
        const map = new Map();
        for (const p of prospectosIndex) {
            const tel = normalizaTelefonoMx(p?.telefono || "");
            if (tel && p?.id) map.set(tel, p.id);
        }
        return map;
    }, [prospectosIndex]);


    const prospectoPorTel = useMemo(() => {
        const map = new Map();
        for (const p of prospectosIndex) {
            const tel = normalizaTelefonoMx(p?.telefono || "");
            if (tel) map.set(tel, p);
        }
        return map;
    }, [prospectosIndex]);

    const filteredChats = useMemo(() => {
        const query = normalizeText(q);
        if (!query) return chats;
        return chats.filter((c) =>
            normalizeText(c.nombre).includes(query) ||
            normalizaTelefonoMx(c.telefono).includes(normalizaTelefonoMx(q) || query) ||
            normalizeText(c.agencia).includes(query)
        );
    }, [chats, q]);

    const chatsPorBandeja = useMemo(() => {
        const map = new Map(ESTADOS_BANDEJA.map((b) => [b.key, []]));
        for (const chat of filteredChats) {
            const bandeja = getEstadoBandeja(chat.estado);
            map.get(bandeja.key)?.push(chat);
        }
        return map;
    }, [filteredChats]);


    const chatsNuevosHoy = useMemo(() => {
        return filteredChats
            .filter((chat) => {

                const prospecto = prospectoPorTel.get(chat.telefono);
                const fechaMensaje = chat.last?.timestamp;
                const fechaCreacion = prospecto?.creado || prospecto?.primer_contacto_at;
                return esFechaDeHoy(fechaMensaje) || esFechaDeHoy(fechaCreacion);
            })
            .sort((a, b) => {
                const ta = new Date(a.last?.timestamp || 0).getTime();
                const tb = new Date(b.last?.timestamp || 0).getTime();
                return tb - ta;
            });
    }, [filteredChats, prospectoPorTel]);


    const statsGenerales = useMemo(() => {
        const total = chats.length;
        const conteoPorEstado = new Map(ESTADOS_BANDEJA.map((b) => [b.key, 0]));
        let totalUnread = 0;
        for (const chat of chats) {
            const bandeja = getEstadoBandeja(chat.estado);
            conteoPorEstado.set(bandeja.key, (conteoPorEstado.get(bandeja.key) || 0) + 1);
            totalUnread += Number(chat.unread || 0);
        }
        const calificados = conteoPorEstado.get("lead_calificado") || 0;
        const sinRespuesta = conteoPorEstado.get("generacion_leads") || 0;
        const chatsConUnread = chats.filter((c) => Number(c.unread || 0) > 0).length;
        return {
            total,
            conteoPorEstado,
            totalUnread,
            tasaConversion: total ? Math.round((calificados / total) * 100) : 0,
            tasaAtencion: total ? Math.round(((total - sinRespuesta) / total) * 100) : 0,
            tasaLectura: total ? Math.round(((total - chatsConUnread) / total) * 100) : 100,
        };
    }, [chats]);

    function onDragStart(e, chat) {
        setDraggingTel(chat.telefono);
        e.dataTransfer.setData("text/plain", chat.telefono);
        e.dataTransfer.effectAllowed = "move";
    }

    function onDragEnd() {
        setDraggingTel("");
        setDragOverEstado("");
    }

    async function onDropEnBandeja(e, bandeja) {
        e.preventDefault();
        const tel = normalizaTelefonoMx(e.dataTransfer.getData("text/plain") || draggingTel);
        setDragOverEstado("");
        setDraggingTel("");
        if (!tel) return;

        const chat = chats.find((c) => c.telefono === tel);
        if (!chat) return;

        if (getEstadoBandeja(chat.estado).key === bandeja.key) return;

        const prospectoId = prospectoIdPorTel.get(tel);
        if (!prospectoId) {
            alert("Este chat todavía no tiene un expediente de prospecto asociado, ábrelo desde Chats para crear/editar sus datos primero.");
            return;
        }

        const estadoAnterior = chat.estado;
        setSavingTel(tel);

        setChats((prev) => prev.map((c) => (c.telefono === tel ? { ...c, estado: bandeja.label } : c)));

        try {
            await api.digitalesPatchProspecto(prospectoId, { estado: bandeja.label });
        } catch (error) {
            setChats((prev) => prev.map((c) => (c.telefono === tel ? { ...c, estado: estadoAnterior } : c)));
            alert(`No se pudo mover el chat: ${error.message}`);
        } finally {
            setSavingTel("");
        }
    }

    function abrirChat(chat) {
        setDrawerTel(chat.telefono);
    }

    return (
        <div className="w-full min-w-0">
            <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 border-b border-black/10 bg-white px-4 py-3">
                    <button onClick={() => navigate("/comercial/prospectos")}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-extrabold text-[#131E5C] hover:bg-neutral-100 transition"
                        type="button">
                        <ArrowLeft className="h-4 w-4" />Volver
                    </button>

                    <div className="text-sm font-extrabold text-[#131E5C]">Bandeja de chats</div>

                    {numerosDisponibles.length > 0 ? (
                        <select
                            value={numeroAsesorActivo}
                            onChange={(e) => setNumeroAsesorActivo(normalizaTelefonoMx(e.target.value))}
                            className="h-9 rounded-lg border border-[#131E5C]/20 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/15"
                        >
                            {numerosDisponibles.map((numero) => (
                                <option key={numero} value={numero}>
                                    {obtenerEtiquetaLinea(numero)} · {formateaTelUi(numero)}
                                </option>
                            ))}
                        </select>
                    ) : null}

                    <div className="flex flex-1 items-center gap-2 rounded-2xl bg-neutral-100 px-3 py-2 min-w-[180px]">
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <input value={q} onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar prospecto…"
                            className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400" />
                        {q ? (<button type="button" onClick={() => setQ("")} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>) : null}
                    </div>

                    {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#131E5C]/50" /> : null}
                </div>


                <div className="flex flex-wrap items-center gap-5 border-b border-black/10 bg-white px-4 py-3">
                    <FlowStreamBar conteoPorEstado={statsGenerales.conteoPorEstado} total={statsGenerales.total} />
                    <div className="flex items-center gap-4 border-l border-black/5 pl-5">
                        <PulseRing value={statsGenerales.tasaAtencion} label="Atención" color={mutedColor("#3B82F6", 0.1)} />
                        <PulseRing value={statsGenerales.tasaConversion} label="Conversión" color={mutedColor("#22C55E", 0.1)} />
                        <PulseRing value={statsGenerales.tasaLectura} label="Lectura" color={mutedColor(BRAND_BLUE, 0.15)} />
                    </div>
                </div>


                <div className="grid h-[calc(90dvh-120px)] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="min-h-0 overflow-y-auto border-r border-black/10 bg-neutral-50 p-3">
                        <div className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/50">
                            Todos los chats ({filteredChats.length})
                        </div>
                        <div className="space-y-2">
                            {filteredChats.map((chat) => (
                                <ChatCard
                                    key={chat.id}
                                    chat={chat}
                                    onOpen={abrirChat}
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                    dragging={draggingTel === chat.telefono}
                                />
                            ))}
                            {!loading && filteredChats.length === 0 ? (
                                <div className="p-6 text-center text-xs font-bold text-slate-400">Sin chats aún</div>
                            ) : null}
                        </div>
                    </aside>

                    <div className="min-h-0 overflow-x-auto overflow-y-hidden p-3">
                        <div className="grid h-full grid-flow-col auto-cols-[240px] gap-3">

                            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-sky-200 bg-sky-50/40">
                                <div className="flex shrink-0 flex-col gap-1.5 border-b border-sky-100 px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                                        <span className="truncate text-xs font-extrabold text-[#131E5C]">Nuevos prospectos</span>
                                        <span className="ml-auto shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-sky-600 ring-1 ring-sky-200">
                                            {chatsNuevosHoy.length}
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-semibold text-sky-600/70">Mensajes o prospectos de hoy</div>
                                </div>
                                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                                    {chatsNuevosHoy.map((chat) => (
                                        <ChatCard
                                            key={chat.id}
                                            chat={chat}
                                            onOpen={abrirChat}
                                            onDragStart={onDragStart}
                                            onDragEnd={onDragEnd}
                                            dragging={draggingTel === chat.telefono || savingTel === chat.telefono}
                                            dateLabel={formatHoraCorta(chat.last?.timestamp) || "Hoy"}
                                        />
                                    ))}
                                    {chatsNuevosHoy.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-sky-200 px-3 py-6 text-center text-[11px] font-bold text-slate-400">
                                            Sin prospectos nuevos hoy
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {ESTADOS_BANDEJA.map((bandeja) => {
                                const items = chatsPorBandeja.get(bandeja.key) || [];
                                const isOver = dragOverEstado === bandeja.key;
                                return (
                                    <div
                                        key={bandeja.key}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverEstado(bandeja.key); }}
                                        onDragLeave={() => setDragOverEstado((prev) => (prev === bandeja.key ? "" : prev))}
                                        onDrop={(e) => onDropEnBandeja(e, bandeja)}
                                        className={cls(
                                            "flex h-full min-h-0 flex-col rounded-2xl border bg-neutral-50 transition",
                                            isOver ? "border-[#131E5C]/40 bg-[#131E5C]/[0.04] ring-2 ring-[#131E5C]/15" : "border-black/10"
                                        )}
                                    >
                                        <div className="flex shrink-0 flex-col gap-1.5 border-b border-black/5 px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: bandeja.color }} />
                                                <span className="truncate text-xs font-extrabold text-[#131E5C]">{bandeja.label}</span>
                                                <span className="ml-auto shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-slate-500 ring-1 ring-black/5">
                                                    {items.length}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full overflow-hidden rounded-full bg-black/5">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${statsGenerales.total ? ((statsGenerales.conteoPorEstado.get(bandeja.key) || 0) / statsGenerales.total) * 100 : 0}%`,
                                                        backgroundColor: mutedColor(bandeja.color, 0.3),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                                            {items.map((chat) => (
                                                <ChatCard
                                                    key={chat.id}
                                                    chat={chat}
                                                    onOpen={abrirChat}
                                                    onDragStart={onDragStart}
                                                    onDragEnd={onDragEnd}
                                                    dragging={draggingTel === chat.telefono || savingTel === chat.telefono}
                                                />
                                            ))}
                                            {items.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-black/10 px-3 py-6 text-center text-[11px] font-bold text-slate-400">
                                                    Suelta aquí
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <ChatDrawer
                open={Boolean(drawerTel)}
                telefono={drawerTel}
                numeroAsesor={numeroAsesorActivo}
                onClose={() => setDrawerTel("")}
            />
        </div>
    );
}