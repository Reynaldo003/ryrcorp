//Volkswagen
// src/pages/Digitaltes/DigitalesContacto.jsx
import { useAuth } from "../../auth/AuthContext";
import {
    LINEAS_WHATSAPP,
    obtenerNumerosWhatsAppUsuario,
    obtenerEtiquetaLinea,
} from "../../config/lineasWhatsApp";
import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Smile,
    Building2,
    Clock,
    Search,
    X,
    LayoutTemplate,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Paperclip,
    FileText,
    Play,
    Pause,
    Plus,
    Copy,
    Check,
    CheckCheck,
    AlertCircle,
    Save,
    MailOpen,
    Pencil,
    Activity,
    Zap,
    ZapOff,
    Ban,
    Phone,
    CalendarPlus,
    Mic,
    Square,
    Download,
    UserRound,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { api } from "../../lib/apiPruebas";
import { apiCitas } from "../../lib/apiCitas";

const BRAND_BLUE = "#131E5C";
const QUICK_BUBBLES_KEY = "digitales_quick_bubbles_global";
const CHAT_PAGE_SIZE = 24;
const CHAT_UPDATES_LIMIT = 80;
const CHAT_CACHE_LIMIT = 80;
const PREFETCH_CHAT_LIMIT = 12;
const MAX_RECORDING_SECONDS = 300;

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

const VEHICULOS = [
    "Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun",
    "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera",
    "Avaluo", "Transporter", "Caddy", "Crafter"
];

const CANALES = ["VW-Concesionario", "WhatsApp", "Facebook", "Llamada Entrante"];

const ESTADOS_PROSPECTO = ["Descalificado", "Contactado", "Sin Respuesta"];
const MOTIVOS_DESCALIFICACION = ["Busca trabajo", "No contesto", "Poco presupuesto", "Datos Incorrectos", "Compro en otra marca"];

const BURO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "bueno", label: "Bueno" },
    { value: "regular", label: "Regular" },
    { value: "iniciando", label: "Iniciando" },
    { value: "desconocido", label: "Desconocido" },
];

const FORMA_PAGO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "contado", label: "Contado" },
    { value: "credito", label: "Crédito" },
    { value: "arrendamiento", label: "Arrendamiento" },
    { value: "desconocido", label: "Desconocido" },
];

const TIPO_CLIENTE_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "persona_fisica", label: "Persona física" },
    { value: "persona_moral", label: "Persona moral" },
    { value: "desconocido", label: "Desconocido" },
];

const PLAZO_COMPRA_OPTIONS = [
    "", "Inmediato", "Esta semana", "Este mes", "1 a 3 meses",
    "3 a 6 meses", "Más de 6 meses", "Sin definir",
];

const PAUTAS_ORIGEN = [
    "Facebook Ads", "Google Ads", "Instagram Ads", "Orgánico",
    "Referido", "WhatsApp", "Evento", "Otro",
];

const CHAT_FILTERS = [
    { key: "todos", label: "Todos" },
    { key: "no_leidos", label: "No leídos" },
    { key: "pendiente_cotizacion", label: "Pend. cotización", estados: ["pendiente cotización", "pendiente de cotizacion", "pendiente cotizacion"] },
    { key: "seguimiento", label: "Seguimiento", estados: ["seguimiento"] },
    { key: "lead_calificado", label: "Lead calificado", estados: ["lead calificado", "lead_calificado"] },
];

const ESTADOS_HEADER = [
    "Sin Respuesta", "Contactado", "Descalificado",
    "Pendiente cotización", "Seguimiento", "Lead calificado",
];

// ─── helpers ────────────────────────────────────────────────────────────────

function normalizeCampanasMetaOptions(response) {
    const rawItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.items) ? response.items
            : Array.isArray(response?.results) ? response.results
                : Array.isArray(response?.data) ? response.data
                    : [];

    const values = rawItems
        .map((item) => {
            if (typeof item === "string") return item;
            return (item?.value || item?.label || item?.pauta || item?.pauta_origen ||
                item?.nombre || item?.name || item?.campana || item?.campaign_name ||
                item?.campaign || item?.ad_name || "");
        })
        .map((v) => String(v || "").trim())
        .filter(Boolean);

    const unique = [];
    const seen = new Set();
    for (const value of [...values, ...PAUTAS_ORIGEN]) {
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(value);
    }
    return unique;
}

function renderOptionsConValorActual(options, currentValue, placeholder = "Selecciona una opción…") {
    const value = String(currentValue || "").trim();
    const exists = (options || []).some((o) => String(o || "").trim().toLowerCase() === value.toLowerCase());
    return (
        <>
            <option value="">{placeholder}</option>
            {value && !exists ? <option value={value}>{value} (actual)</option> : null}
            {(options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </>
    );
}

function getStatusDotColor(estado) {
    const v = String(estado || "").toLowerCase();
    if (v === "descalificado") return "#3B82F6";
    if (v === "sin respuesta" || v === "sin_respuesta" || v === "") return "#EF4444";
    return "#22C55E"; 
}

const ASESORES_VISUALES = {
    "marelly tenorio salinas": {
        nombreCorto: "Marelly",
        color: "#7C3AED",
        className: "border-violet-200 bg-violet-50 text-violet-700",
    },
    "julio ramirez lopez": {
        nombreCorto: "Julio",
        color: "#0891B2",
        className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
};


function getAsesorVisual(nombre, usuario = "") {
    const nombreLimpio = String(nombre || "").trim();
    const usuarioLimpio = String(usuario || "").trim();


    if (!nombreLimpio && !usuarioLimpio) {
        return {
            nombreCorto: "Sin asignar",
            color: "#94A3B8",
            className: "border-slate-200 bg-slate-50 text-slate-600",
        };
    }


    const configuracion = ASESORES_VISUALES[normalizeText(nombreLimpio)];


    if (configuracion) {
        return configuracion;
    }


    return {
        nombreCorto:
            nombreLimpio.split(/\s+/)[0] ||
            usuarioLimpio ||
            "Asignado",
        color: "#131E5C",
        className:
            "border-[#131E5C]/20 bg-[#131E5C]/5 text-[#131E5C]",
    };
}


function obtenerRolUsuario(user) {
    const rol = user?.rol;


    if (typeof rol === "string") {
        return rol;
    }


    return (
        rol?.nombre ||
        rol?.name ||
        rol?.descripcion ||
        ""
    );
}


function obtenerPermisosUsuario(user) {
    const permisos = Array.isArray(user?.permisos)
        ? user.permisos
        : [];


    return permisos.map((permiso) =>
        normalizeText(
            typeof permiso === "string"
                ? permiso
                : permiso?.codigo ||
                  permiso?.nombre ||
                  permiso?.name ||
                  ""
        )
    );
}

function cls(...items) { return items.filter(Boolean).join(" "); }
function safeLower(v) { return String(v || "").toLowerCase(); }

function normalizeText(value) {
    return String(value || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
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

    const nombreCampana = firstNonEmpty(
        originPreview?.nombre_campana,
        atribucion?.nombre_campana,
        atribucion?.campaign_name,
    );

    const nombreAnuncio = firstNonEmpty(
        originPreview?.nombre_anuncio,
        atribucion?.nombre_anuncio,
        referral?.headline,
    );

    const sucursal = firstNonEmpty(originPreview?.sucursal, atribucion?.sucursal);

    const pauta = firstNonEmpty(
        originPreview?.pauta,
        atribucion?.pauta,
        sucursal && nombreCampana ? `${sucursal} - ${nombreCampana}` : "",
        nombreCampana,
        nombreAnuncio,
    );

    const headline = firstNonEmpty(
        originPreview?.headline,
        referral?.headline,
        nombreAnuncio,
        nombreCampana,
        pauta,
    );

    const body = firstNonEmpty(
        originPreview?.body,
        referral?.body,
        atribucion?.nombre_conjunto,
    );

    const sourceUrl = firstNonEmpty(originPreview?.source_url, referral?.source_url);
    const imageUrl = firstNonEmpty(
        originPreview?.image_url,
        referral?.image_url,
        referral?.thumbnail_url,
        referral?.video_thumbnail_url,
    );

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

function normalizeProspectoToChat(p) {
    return {
        id: `prospecto-${p.id || p.telefono}`,
        prospectoId: p.id,
        telefono: normalizaTelefonoMx(p.telefono || ""),
        nombre: p.nombre || "Prospecto",
        agencia: p.agencia || "",
        linea: p.business || "",
        estado: p.estado || "",
        asesor_digital: p.asesor_digital || "",
        usuario_crm_asignado: p.usuario_crm_asignado || "",
        unread: 0,
        last: { text: p.comentarios || "Sin historial reciente", time: "" },
        isOnlyProspecto: true,
    };
}

function mergeChatsConProspectos(chats, prospectos) {
    const map = new Map();
    for (const chat of chats || []) { if (chat.telefono) map.set(chat.telefono, chat); }
    for (const p of prospectos || []) {
        const chat = normalizeProspectoToChat(p);
        if (!chat.telefono) continue;
        if (!map.has(chat.telefono)) map.set(chat.telefono, chat);
    }
    return Array.from(map.values());
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

function prettyStatus(status) {
    const v = String(status || "").toLowerCase();
    if (v === "accepted") return "aceptado";
    if (v === "sent") return "enviado";
    if (v === "delivered") return "entregado";
    if (v === "read") return "leído";
    if (v === "failed") return "falló";
    if (v === "received") return "";
    return v || "—";
}

function labelBloqueoIa(value) {
    const map = {
        numero_asesor_invalido: "Número asesor inválido",
        configuracion_ia_no_existe: "Configuración IA no existe",
        configuracion_ia_inactiva: "Configuración IA apagada",
        fuera_de_horario: "Fuera de horario",
        expediente_no_encontrado: "Expediente no encontrado",
        expediente_ia_pausada: "Expediente IA pausada",
        conversacion_ia_inactiva: "Conversación IA inactiva",
        conversacion_ia_pausada: "Conversación IA pausada",
    };
    return map[value] || String(value || "Bloqueo desconocido");
}

function getIaEstadoVisual(estadoIa) {
    const bloqueos = Array.isArray(estadoIa?.bloqueos) ? estadoIa.bloqueos : [];
    if (!estadoIa) return { label: "IA sin diagnóstico", detail: "Abre un chat para consultar el estado operativo.", cls: "border-slate-200 bg-slate-50 text-slate-700" };
    if (estadoIa.puede_responder) return { label: "IA lista para responder", detail: "Configuración activa, conversación habilitada y dentro de horario.", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    return { label: "IA no responderá", detail: bloqueos.length ? bloqueos.map(labelBloqueoIa).join(" · ") : "Hay un bloqueo operativo sin clasificar.", cls: "border-amber-200 bg-amber-50 text-amber-900" };
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

function parseWhatsAppComposerFormat(texto) {
    let r = String(texto || "");
    r = r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    r = r.replace(/```([\s\S]+?)```/g, '<code class="inline-block rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[13px]">$1</code>');
    r = r.replace(/\*([^*\n]+)\*/g, '<strong class="font-black">$1</strong>');
    r = r.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    r = r.replace(/~([^~\n]+)~/g, "<del>$1</del>");
    r = r.replace(/\n/g, "<br>");
    return r;
}

function WhatsAppComposerInput({ value, onChange, onSend, disabled, placeholder, inputRef, onPaste }) {
    const internalRef = useRef(null);
    const mirrorRef = useRef(null);
    const setRefs = (node) => { internalRef.current = node; if (inputRef) inputRef.current = node; };

    useEffect(() => {
        const ta = internalRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
    }, [value]);

    function syncScroll() {
        if (!internalRef.current || !mirrorRef.current) return;
        mirrorRef.current.scrollTop = internalRef.current.scrollTop;
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    }

    return (
        <div className="relative min-h-[40px] flex-1">
            {!String(value || "").length ? (
                <div className="pointer-events-none absolute left-2 top-2 z-0 text-sm font-medium text-slate-400">{placeholder}</div>
            ) : null}
            <div ref={mirrorRef} aria-hidden="true"
                className={cls("pointer-events-none absolute inset-0 z-0 max-h-32 overflow-y-auto whitespace-pre-wrap break-words px-2 py-2 text-sm font-medium leading-relaxed text-[#131E5C]", "[&_strong]:font-black [&_em]:italic [&_del]:line-through", "[&_code]:rounded-md [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]")}
                dangerouslySetInnerHTML={{ __html: value ? parseWhatsAppComposerFormat(value) : "" }}
            />
            <textarea ref={setRefs} value={value} onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown} onPaste={onPaste} onScroll={syncScroll}
                disabled={disabled} rows={1} spellCheck
                className={cls("relative z-10 block max-h-32 min-h-[40px] w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm font-medium leading-relaxed outline-none", "text-transparent caret-[#131E5C] placeholder:text-slate-400", "selection:bg-[#131E5C]/20 selection:text-transparent", disabled ? "cursor-not-allowed opacity-60" : "")}
            />
        </div>
    );
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

function isNearBottom(el, threshold = 180) {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

// ─── helper: id del mensaje al que se responde (estilo WhatsApp "context") ──
function getReplyToId(message = {}) {
    return (
        message.context?.id ||
        message.reply_to_message_id ||
        message.reply_to_id ||
        message.quoted_message_id ||
        message.quoted_id ||
        message?.raw?.context?.id ||
        ""
    );
}

const AVATAR_GRADIENTS = [
    ["#131E5C", "#1746D1"],
    ["#1746D1", "#4F6EF2"],
    ["#075E54", "#128C7E"],
    ["#1E3A8A", "#3B6BF2"],
    ["#0F172A", "#1D4ED8"],
];

function Avatar({ name = "?", size = "md" }) {
    const initials = String(name || "?").split(" ").filter(Boolean).slice(0, 2).map(i => i[0]?.toUpperCase()).join("");
    const hash = [...String(name || "?")].reduce((acc, ch) => acc + (ch.codePointAt(0) || 0), 0);
    const [from, to] = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
    const box = size === "lg" ? "h-12 w-12" : "h-10 w-10";
    const txt = size === "lg" ? "text-base" : "text-sm";
    return (
        <div
            className={cls("flex shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5", box)}
            style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
        >
            <span className={cls("font-extrabold text-white", txt)}>{initials || "?"}</span>
        </div>
    );
}

function Sk({ className = "" }) { return <div className={cls("animate-pulse rounded-md bg-slate-200", className)} />; }

function ChatListSkeleton({ rows = 8 }) {
    return (
        <div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Sk className="h-12 w-12 rounded-full shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <Sk className="h-3.5 w-32 rounded" />
                            <Sk className="h-3 w-10 rounded" />
                        </div>
                        <Sk className="h-3 w-48 rounded mb-2" />
                        <div className="flex gap-1.5">
                            <Sk className="h-4 w-20 rounded-full" />
                            <Sk className="h-4 w-16 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MessagesSkeleton({ bubbles = 10 }) {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-3">
            {Array.from({ length: bubbles }).map((_, i) => {
                const mine = i % 2 === 0;
                return (
                    <div key={i} className={cls("flex w-full", mine ? "justify-end" : "justify-start")}>
                        <div className={cls("max-w-[78%] rounded-2xl border px-4 py-3 shadow-sm", mine ? "border-white/10 bg-[#131E5C]/10" : "border-black/10 bg-white")}>
                            <Sk className="h-3 w-52 rounded" />
                            <Sk className="mt-2 h-3 w-64 rounded" />
                            <div className="mt-3 flex items-center justify-end gap-2">
                                <Sk className="h-3 w-10 rounded" />
                                {mine ? <Sk className="h-3 w-16 rounded" /> : null}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function fileKind(file) {
    const mime = String(file?.type || "");
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "file";
}

function shortName(name = "") {
    const v = String(name || "");
    if (v.length <= 22) return v;
    return `${v.slice(0, 12)}…${v.slice(-8)}`;
}

function formatAudioTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds || 0)));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
}
function getSupportedRecorderMimeType() {
    if (typeof MediaRecorder === "undefined") {
        return "";
    }

    const candidates = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/webm",
    ];

    return (
        candidates.find((mime) =>
            MediaRecorder.isTypeSupported?.(mime)
        ) || ""
    );
}

function getAudioExtension(mimeType = "") {
    const mime = String(
        mimeType || ""
    ).toLowerCase();

    if (mime.includes("ogg")) {
        return "ogg";
    }

    if (mime.includes("mp4")) {
        return "m4a";
    }

    return "webm";
}

function humanBytes(bytes) {
    const value = Number(bytes || 0);

    if (!Number.isFinite(value) || value <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(
        Math.floor(Math.log(value) / Math.log(1024)),
        units.length - 1
    );

    const size = value / Math.pow(1024, index);

    return `${size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}

// ─── Descarga de archivos (usado por el botón de descarga de audio) ────────
const MIME_TO_EXT = {
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/webm": "webm",
    "audio/wav": "wav",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "application/pdf": "pdf",
};

function extensionDesdeMime(mime) {
    const clean = String(mime || "").split(";")[0].trim().toLowerCase();
    return MIME_TO_EXT[clean] || clean.split("/")[1] || "bin";
}

async function downloadFileFromUrl(url, filenameBase) {
    try {
        const res = await fetch(url); // media_proxy_view es AllowAny, no requiere auth headers
        if (!res.ok) throw new Error("No se pudo descargar el archivo");
        const blob = await res.blob();
        const ext = extensionDesdeMime(blob.type);
        const filename = `${filenameBase || "archivo"}.${ext}`;

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error("Error al descargar:", err);
        window.open(url, "_blank");
    }
}

const MESSAGE_PLACEHOLDER_LABELS = {
    "[IMAGE]": "Imagen",
    "[VIDEO]": "Video",
    "[AUDIO]": "Audio",
    "[STICKER]": "Sticker",
    "[DOCUMENT]": "Documento",
    "[LOCATION]": "📍 Ubicación enviada",
    "[CONTACTS]": "👤 Contacto enviado",
    "[ORDER]": "🛒 Pedido recibido",
    "[SYSTEM]": "Mensaje del sistema",
    "[UNSUPPORTED_MESSAGE]": "Mensaje recibido en un formato no compatible",
};

function cleanMediaTextForBubble(text, attachments = []) {
    let value = String(text || "").trim();

    // Quita marcadores internos del backend: [FILE:nombre.jpg]
    value = value.replace(/\[FILE:[^\]]+\]/gi, "").trim();

    const upper = value.toUpperCase();

    if (
        attachments.length &&
        [
            "[IMAGE]",
            "[VIDEO]",
            "[AUDIO]",
            "[STICKER]",
            "[DOCUMENT]",
            "ADJUNTO",
            "ARCHIVO",
        ].includes(upper)
    ) {
        return "";
    }

    if (MESSAGE_PLACEHOLDER_LABELS[upper]) {
        return MESSAGE_PLACEHOLDER_LABELS[upper];
    }

    // Limpia legacy: evita que se pinte literalmente "unsupported_message".
    if (upper.includes("UNSUPPORTED_MESSAGE")) {
        return "Mensaje recibido en un formato no compatible";
    }

    return value;
}

function extractFilesFromDataTransfer(dt) {
    if (!dt) return [];
    const list = dt.files ? Array.from(dt.files) : [];
    if (list.length) return list.filter(f => f && typeof f.size === "number");
    const items = dt.items ? Array.from(dt.items) : [];
    const output = [];
    for (const item of items) {
        if (item.kind === "file") { const f = item.getAsFile?.(); if (f && typeof f.size === "number") output.push(f); }
    }
    return output;
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

    const source = Array.isArray(message.reactions)
        ? message.reactions
        : Array.isArray(raw.reactions)
            ? raw.reactions
            : [];

    return source
        .map((item, index) => ({
            id: item.reaction_message_id || `${message.wa_message_id || message.id}-reaction-${index}`,
            emoji: String(item.emoji || "").trim(),
            telefono: item.telefono || "",
            from: item.from || "cliente",
        }))
        .filter((item) => item.emoji);
}

function isReactionEvent(message = {}) {
    const raw = message.raw || {};
    return Boolean(
        raw.is_reaction_event ||
        raw.type === "reaction" ||
        message.type === "reaction"
    );
}

function applyReactionEvents(messages = []) {
    const map = new Map();

    for (const msg of messages || []) {
        const key = getMessageKey(msg);
        if (!key) continue;

        map.set(key, {
            ...msg,
            reactions: getMessageReactions(msg),
        });
    }

    for (const msg of messages || []) {
        const raw = msg.raw || {};

        if (!isReactionEvent(msg)) continue;

        const targetId =
            raw.reaction_target_id ||
            raw?.reaction?.message_id ||
            "";

        if (!targetId || !map.has(String(targetId))) continue;

        const target = map.get(String(targetId));
        const emoji =
            raw.reaction_emoji ||
            raw?.reaction?.emoji ||
            "";

        const removed = Boolean(
            raw.reaction_removed ||
            !String(emoji || "").trim()
        );

        let reactions = Array.isArray(target.reactions)
            ? [...target.reactions]
            : [];

        const telefono = msg.telefono || raw.from || raw.telefono || "";

        reactions = reactions.filter((r) => String(r.telefono || "") !== String(telefono || ""));

        if (!removed && emoji) {
            reactions.push({
                id: msg.wa_message_id || msg.id || crypto.randomUUID(),
                emoji,
                telefono,
                from: "cliente",
            });
        }

        map.set(String(targetId), {
            ...target,
            reactions,
        });
    }

    return Array.from(map.values())
        .filter((msg) => !isReactionEvent(msg))
        .sort((a, b) => {
            const da = getMessageTimeValue(a);
            const db = getMessageTimeValue(b);

            if (da !== db) return da - db;

            return Number(a.id || 0) - Number(b.id || 0);
        });
}

function normalizeMessage(message = {}) {
    const raw = message.raw || {};
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

function getFieldOptions(field) {
    if (Array.isArray(field?.options) && field.options.length) return field.options;
    const label = safeLower(field?.label), key = safeLower(field?.key);
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) return DEALERS;
    if (label.includes("canal") || key.includes("canal")) return CANALES;
    return [];
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

    if (component === "header") {
        return `Dato del encabezado ${index}`;
    }

    if (component === "button") {
        return `Dato del botón ${index}`;
    }

    return `Dato variable ${index}`;
}

function normalizeTemplateFromApi(template) {
    return {
        ...template,
        key: template?.key || template?.name || "",
        name: template?.name || template?.key || "",
        title:
            template?.title ||
            String(template?.name || template?.key || "")
                .replaceAll("_", " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        idioma:
            template?.idioma ||
            template?.language ||
            "es_MX",
        language:
            template?.language ||
            template?.idioma ||
            "es_MX",
        status: String(template?.status || "APPROVED").toUpperCase(),
        fields: Array.isArray(template?.fields)
            ? template.fields.map((field) => ({
                ...field,
                required: true,
                friendlyLabel: getFriendlyTemplateFieldLabel(field),
            }))
            : [],
    };
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

function WhatsAppWaveform({ progress = 0, mine = false, onSeek }) {
    const bars = [8, 14, 10, 18, 12, 22, 16, 26, 20, 16, 24, 14, 18, 10, 22, 12, 16, 8, 14, 20, 12, 18, 10, 15, 9, 13, 18, 11, 16, 10];

    return (
        <button
            type="button"
            onClick={onSeek}
            className="flex h-9 flex-1 items-center gap-[2px] overflow-hidden rounded-lg px-1"
            title="Avanzar audio"
        >
            {bars.map((h, index) => {
                const active = index / bars.length <= progress;

                return (
                    <span
                        key={index}
                        className={cls(
                            "w-[3px] rounded-full transition",
                            active
                                ? mine
                                    ? "bg-[#075E54]"
                                    : "bg-[#128C7E]"
                                : mine
                                    ? "bg-[#075E54]/25"
                                    : "bg-slate-300"
                        )}
                        style={{ height: `${h}px` }}
                    />
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
    const [downloading, setDownloading] = useState(false); // <-- nuevo

    const progress = duration ? Math.min(1, current / duration) : 0;

    async function togglePlay() {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
            setPlaying(false);
            return;
        }
        try {
            await audio.play();
            setPlaying(true);
        } catch (error) {
            console.error("No se pudo reproducir audio:", error);
        }
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

    function handleDownload() {
        if (!src) return;

        // src apunta a /digitales/media/<media_id>/?numero_asesor=...
        // Construimos la URL hermana .../descargar/ que regresa el MP3 real
        // con Content-Disposition: attachment (el navegador lo descarga solo).
        const [base, query] = src.split("?");
        const downloadUrl = `${base.replace(/\/$/, "")}/descargar/${query ? `?${query}` : ""}`;

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    return (
        <div
            className={cls(
                "flex min-w-[260px] max-w-[360px] items-center gap-2 rounded-2xl px-3 py-2",
                mine ? "bg-[#D9FDD3] text-[#111B21]" : "bg-white text-[#111B21]"
            )}
        >
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
                onEnded={() => {
                    setPlaying(false);
                    setCurrent(0);
                }}
                className="hidden"
            />

            <button
                type="button"
                onClick={togglePlay}
                className={cls(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition",
                    mine
                        ? "bg-[#075E54] text-white hover:bg-[#064C43]"
                        : "bg-[#128C7E] text-white hover:bg-[#0F766E]"
                )}
                title={playing ? "Pausar" : "Reproducir"}
            >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>

            <div className="min-w-0 flex-1">
                <WhatsAppWaveform progress={progress} mine={mine} onSeek={handleSeek} />
                <div className="mt-0.5 flex items-center justify-between text-[11px] font-semibold text-[#667781]">
                    <span>{formatAudioTime(current || duration || 0)}</span>
                    <span>audio</span>
                </div>
            </div>
            <button
                type="button"
                onClick={handleDownload}
                className={cls(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                    mine
                        ? "text-[#075E54] hover:bg-[#075E54]/10"
                        : "text-[#128C7E] hover:bg-[#128C7E]/10"
                )}
                title="Descargar audio (MP3)"
            >
                <Download className="h-4 w-4" />
            </button>

        </div>
    );
}

function WhatsAppAttachment({ mine, attachment }) {
    const src = attachment.url || attachment.previewUrl;

    if (!src) return null;

    if (attachment.kind === "sticker") {
        return (
            <a href={src} target="_blank" rel="noreferrer" className="block">
                <img
                    src={src}
                    alt={attachment.name || "sticker"}
                    className="max-h-44 max-w-44 object-contain"
                    loading="lazy"
                />
            </a>
        );
    }

    if (attachment.kind === "image") {
        return (
            <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                <img
                    src={src}
                    alt={attachment.name || "imagen"}
                    className="block max-h-[360px] w-full max-w-[330px] object-cover"
                    loading="lazy"
                />
            </a>
        );
    }

    if (attachment.kind === "video") {
        return (
            <div className="overflow-hidden rounded-xl bg-black">
                <video
                    src={src}
                    controls
                    playsInline
                    preload="metadata"
                    className="block max-h-[360px] w-full max-w-[330px] bg-black object-contain"
                />
            </div>
        );
    }

    if (attachment.kind === "audio") {
        return <WhatsAppAudioPlayer src={src} mine={mine} />;
    }

    return (
        <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className={cls(
                "flex min-w-[240px] max-w-[330px] items-center gap-3 rounded-xl px-3 py-3 transition hover:opacity-90",
                mine ? "bg-[#D9FDD3] text-[#111B21]" : "bg-white text-[#111B21]"
            )}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10 text-[#128C7E]">
                <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">
                    {attachment.name ? shortName(attachment.name) : "Documento"}
                </div>

                <div className="text-[11px] font-semibold text-[#667781]">
                    {attachment.size ? humanBytes(attachment.size) : "Abrir archivo"}
                </div>
            </div>
        </a>
    );
}

// ─── Ticks de estado estilo WhatsApp (reloj / ✓ / ✓✓ gris / ✓✓ azul) ────────

function MessageStatusTicks({ status, pending }) {
    if (pending) {
        return <Clock className="h-3.5 w-3.5 opacity-60" title="Enviando…" />;
    }
    const v = String(status || "").toLowerCase();
    if (v === "failed") {
        return <AlertCircle className="h-3.5 w-3.5 text-red-300" title="Falló el envío" />;
    }
    if (v === "read") {
        return <CheckCheck className="h-3.5 w-3.5" style={{ color: "#53BDEB" }} title="Leído" />;
    }
    if (v === "delivered") {
        return <CheckCheck className="h-3.5 w-3.5 opacity-70" title="Entregado" />;
    }
    if (v === "sent" || v === "accepted") {
        return <Check className="h-3.5 w-3.5 opacity-70" title="Enviado" />;
    }
    if (v === "received") return null;
    return <Check className="h-3.5 w-3.5 opacity-50" title="Enviado" />;
}

// ─── Formateador de fecha estilo WhatsApp: "Hoy", "Ayer", o fecha completa ──
function formatWhatsAppDate(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Formatear hora (12h)
    const timeStr = date.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Mexico_City"
    });

    // Determinar si es Hoy, Ayer u otra fecha
    if (msgDate.getTime() === today.getTime()) {
        return `Hoy ${timeStr}`;
    } else if (msgDate.getTime() === yesterday.getTime()) {
        return `Ayer ${timeStr}`;
    } else {
        // Formato: "24 de junio de 2026 3:45 PM"
        const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()} ${timeStr}`;
    }
}

// ─── Formateador de hora corta para burbujas ──────────────────────────────
function formatMessageTime(isoString) {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Mexico_City"
    });
}

// ─── Formateador de fecha con día de la semana: "Jueves 16/07" ────────────
function formatearFechaConDia(isoOrDate) {
    const fecha = isoOrDate ? new Date(isoOrDate) : new Date();
    if (Number.isNaN(fecha.getTime())) return "—";
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fecha.getDay()];
    const dd = String(fecha.getDate()).padStart(2, "0");
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    return `${diaSemana} ${dd}/${mm}`;
}

// ─── Separador de fecha entre mensajes ─────────────────────────────────────
// DESPUÉS
function DateSeparator({ date }) {
    if (!date) return null;
    return (
        <div className="sticky top-2 z-10 flex justify-center my-4 pointer-events-none">
            <div className="pointer-events-auto rounded-full border border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-1.5 text-xs font-extrabold text-[#131E5C] shadow-sm">
                {formatWhatsAppDate(date)}
            </div>
        </div>
    );
}

// ─── Función para agrupar mensajes por fecha ──────────────────────────────
function groupMessagesByDate(messages) {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    for (const msg of messages) {
        const msgDate = msg.created_at || msg.local_created_at || "";
        if (!msgDate) {
            // Si no tiene fecha, lo agregamos al grupo actual o creamos uno nuevo
            if (currentGroup.length === 0) {
                currentGroup.push(msg);
            } else {
                currentGroup.push(msg);
            }
            continue;
        }

        const dateObj = new Date(msgDate);
        if (Number.isNaN(dateObj.getTime())) {
            if (currentGroup.length === 0) {
                currentGroup.push(msg);
            } else {
                currentGroup.push(msg);
            }
            continue;
        }

        const dateKey = dateObj.toDateString();

        if (currentDate === null) {
            currentDate = dateKey;
            currentGroup = [msg];
        } else if (dateKey === currentDate) {
            currentGroup.push(msg);
        } else {
            // Guardar grupo anterior
            groups.push({
                date: currentGroup[0]?.created_at || currentGroup[0]?.local_created_at || "",
                messages: currentGroup
            });
            // Iniciar nuevo grupo
            currentDate = dateKey;
            currentGroup = [msg];
        }
    }

    // Guardar último grupo
    if (currentGroup.length > 0) {
        groups.push({
            date: currentGroup[0]?.created_at || currentGroup[0]?.local_created_at || "",
            messages: currentGroup
        });
    }

    return groups;
}


function getHostLabel(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "Meta Ads";
    }
}

function PautaOrigenCard({ data }) {
    const [imageFailed, setImageFailed] = useState(false);

    if (!data?.pauta && !data?.headline && !data?.image_url) return null;

    const showImage = Boolean(data?.image_url && !imageFailed);

    const content = (
        <div className="overflow-hidden rounded-xl border border-[#131E5C]/15 bg-[#F0F2F5] shadow-sm">
            <div className="flex min-w-[270px] max-w-[430px] items-stretch">
                {showImage ? (
                    <div className="h-[96px] w-[96px] shrink-0 overflow-hidden bg-neutral-200">
                        <img
                            src={data.image_url}
                            alt={data.headline || data.pauta || "Anuncio de origen"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() => setImageFailed(true)}
                        />
                    </div>
                ) : (
                    <div className="flex h-[96px] w-[76px] shrink-0 items-center justify-center bg-[#131E5C] text-white">
                        <LayoutTemplate className="h-5 w-5" />
                    </div>
                )}

                <div className="min-w-0 flex-1 px-3 py-2.5">
                    <div className="text-[10px] font-black uppercase tracking-wide text-[#667781]">
                        Anuncio de origen
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-extrabold leading-snug text-[#111B21]">
                        {data.headline || data.nombre_campana || data.pauta}
                    </div>
                    {data.body ? (
                        <div className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-[#667781]">
                            {data.body}
                        </div>
                    ) : null}
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#667781]">
                        <span className="truncate">{data.nombre_campana || data.pauta}</span>
                        {data.source_url ? <span className="shrink-0">· {getHostLabel(data.source_url)}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!data.source_url) return <div className="mb-2">{content}</div>;

    return (
        <a
            href={data.source_url}
            target="_blank"
            rel="noreferrer"
            className="mb-2 block transition hover:brightness-[0.98]"
            title="Abrir anuncio de origen"
        >
            {content}
        </a>
    );
}

function MessageBubble({
    mine,
    text,
    time,
    status = "sent",
    attachments = [],
    reactions = [],
    isAi = false,
    renderText,
    onReply,
    replyPreview,
    localPending,
    domId,
    highlighted,
    originPreview,
}) {
    const rawText = renderText ? renderText(text) : text;
    const shown = cleanMediaTextForBubble(rawText, attachments);

    const hasText = Boolean(String(shown || "").trim());
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    const stickerOnly =
        hasAttachments &&
        attachments.length === 1 &&
        attachments[0]?.kind === "sticker" &&
        !hasText;

    const audioOnly =
        hasAttachments &&
        attachments.length === 1 &&
        attachments[0]?.kind === "audio" &&
        !hasText;

    const visualOnly =
        hasAttachments &&
        attachments.every((a) => ["image", "video", "sticker"].includes(a.kind)) &&
        !hasText;

    return (
        <div
            id={domId}
            className={cls(
                "flex w-full rounded-2xl transition-colors duration-700 my-1",
                mine ? "justify-end" : "justify-start",
                highlighted ? "bg-amber-100/60" : ""
            )}
        >
            <div
                className={cls(
                    "max-w-[88%] sm:max-w-[82%] lg:max-w-[76%] xl:max-w-[72%]",
                    hasAttachments ? "w-fit" : ""
                )}
            >
                <div
                    className={cls(
                        "relative shadow-sm",
                        stickerOnly
                            ? "bg-transparent p-0 shadow-none"
                            : cls(
                                "rounded-xl",
                                mine
                                    ? "rounded-br-sm bg-[#E1EBFF] text-[#111B21] ring-1 ring-[#1746D1]/15"
                                    : "rounded-bl-sm bg-white text-[#111B21] ring-1 ring-black/5",
                                visualOnly ? "p-1.5" : audioOnly ? "p-1.5" : "px-3 py-2"
                            )
                    )}
                >
                    {!mine && originPreview && !stickerOnly ? (
                        <PautaOrigenCard data={originPreview} />
                    ) : null}

                    {replyPreview && !stickerOnly ? (
                        <button
                            type="button"
                            onClick={replyPreview.onClick}
                            className={cls(
                                "mb-2 flex w-full min-w-[220px] items-start gap-2 rounded-lg border-l-4 px-2.5 py-1.5 text-left transition",
                                mine
                                    ? "border-[#1746D1] bg-[#1746D1]/10 hover:bg-[#1746D1]/15"
                                    : "border-[#1746D1] bg-[#1746D1]/5 hover:bg-[#1746D1]/10"
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-extrabold text-[#1746D1]">
                                    {replyPreview.author}
                                </div>
                                <div className="truncate text-[12px] font-medium text-[#667781]">
                                    {replyPreview.text}
                                </div>
                            </div>
                        </button>
                    ) : null}

                    {hasAttachments ? (
                        <div className={cls("grid gap-1.5", hasText ? "mb-1.5" : "")}>
                            {attachments.map((a) => (
                                <WhatsAppAttachment
                                    key={a.id}
                                    mine={mine}
                                    attachment={a}
                                />
                            ))}
                        </div>
                    ) : null}

                    {hasText ? (
                        <div
                            className="whitespace-pre-wrap px-0.5 text-[15px] font-medium leading-relaxed md:text-base [&_strong]:font-black [&_em]:italic [&_del]:line-through"
                            dangerouslySetInnerHTML={{ __html: parseWhatsAppFormat(shown) }}
                        />
                    ) : null}

                    {!stickerOnly ? (
                        <div
                            className={cls(
                                "mt-1 flex items-center justify-end gap-1.5 px-0.5 text-[11px] font-semibold",
                                "text-[#667781]"
                            )}
                        >
                            {isAi ? (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-extrabold leading-none text-violet-700 ring-1 ring-violet-300"
                                    title="Mensaje generado por IA"
                                >
                                    ✦ IA
                                </span>
                            ) : null}

                            <span>{time}</span>

                            {mine ? (
                                <MessageStatusTicks
                                    status={status}
                                    pending={localPending}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#667781]">
                            <span>{time}</span>
                            {mine ? (
                                <MessageStatusTicks
                                    status={status}
                                    pending={localPending}
                                />
                            ) : null}
                        </div>
                    )}

                    {onReply ? (
                        <div className={cls("mt-1.5 ml-1.5 mb-1.5 flex", mine ? "justify-end" : "justify-start")}>
                            <button
                                type="button"
                                onClick={onReply}
                                className={cls(
                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold transition",
                                    mine
                                        ? "bg-[#1746D1]/10 text-[#1746D1] hover:bg-[#1746D1]/15"
                                        : "bg-[#1746D1]/10 text-[#1746D1] hover:bg-[#1746D1]/15"
                                )}
                                title="Responder a este mensaje"
                            >
                                <Pencil className="h-3 w-3" />
                                Responder
                            </button>
                        </div>
                    ) : null}
                </div>

                {Array.isArray(reactions) && reactions.length ? (
                    <div className={cls("relative z-10 -mt-2 flex px-3", mine ? "justify-end" : "justify-start")}>
                        <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-0.5 text-sm shadow-sm">
                            {reactions.slice(0, 4).map((reaction) => (
                                <span key={reaction.id || reaction.emoji}>{reaction.emoji}</span>
                            ))}

                            {reactions.length > 4 ? (
                                <span className="text-[10px] font-extrabold text-slate-400">
                                    +{reactions.length - 4}
                                </span>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ─── Dropdown genérico reutilizable (plantillas + mensajes rápidos) ──────────

function ComposerDropdown({ open, onClose, dropdownRef, children, title, headerRight }) {
    if (!open) return null;
    return (
        <div ref={dropdownRef} className="absolute bottom-14 left-0 z-50 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                <span className="text-xs font-extrabold text-[#131E5C]">{title}</span>
                <div className="flex items-center gap-2">
                    {headerRight}
                    <button type="button" onClick={onClose}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 hover:text-slate-600 transition">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            {children}
        </div>
    );
}

// ─── Modal para agendar cita desde el chat ──────────────────────────────────

function AgendarCitaModal({ open, onClose, nombreCliente, telefono, onGuardar, saving }) {
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("10:00");
    const [nota, setNota] = useState("");

    useEffect(() => {
        if (open) {
            const hoy = new Date();
            const yyyy = hoy.getFullYear();
            const mm = String(hoy.getMonth() + 1).padStart(2, "0");
            const dd = String(hoy.getDate()).padStart(2, "0");
            setFecha(`${yyyy}-${mm}-${dd}`);
            setHora("10:00");
            setNota("");
        }
    }, [open]);

    if (!open) return null;

    const fechaLegible = fecha ? formatearFechaConDia(`${fecha}T00:00:00`) : "—";

    function handleSubmit(e) {
        e.preventDefault();
        if (!fecha || !hora) return;
        onGuardar({ fecha, hora, nota });
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onMouseDown={onClose}>
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4 text-[#131E5C]" />
                        <span className="text-sm font-extrabold text-[#131E5C]">Agendar cita</span>
                    </div>
                    <button type="button" onClick={onClose}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
                    <div>
                        <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Cliente</div>
                        <div className="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-bold text-[#131E5C]">
                            {nombreCliente || "Prospecto"}{telefono ? ` · ${formateaTelUi(telefono)}` : ""}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Fecha</div>
                            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required
                                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C]/40 focus:ring-1 focus:ring-[#131E5C]/20" />
                        </div>
                        <div>
                            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Hora</div>
                            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required
                                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C]/40 focus:ring-1 focus:ring-[#131E5C]/20" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#131E5C]/10 bg-[#131E5C]/[0.04] px-3 py-2 text-xs font-bold text-[#131E5C]">
                        {fechaLegible} {hora ? `· ${hora}` : ""}
                    </div>

                    <div>
                        <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Nota (opcional)</div>
                        <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
                            placeholder="Ej. Viene a probar la Tiguan R-Line"
                            className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C]/40 focus:ring-1 focus:ring-[#131E5C]/20" />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-neutral-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving || !fecha || !hora}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}>
                            <CalendarPlus className="h-3.5 w-3.5" />
                            {saving ? "Guardando..." : "Agendar cita"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function DigitalesContacto() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const { user, ready } = useAuth();

    const rolUsuario = useMemo(
        () => normalizeText(obtenerRolUsuario(user)),
        [user]
    );


    const permisosUsuario = useMemo(
        () => obtenerPermisosUsuario(user),
        [user]
    );


    const isAdmin = useMemo(() => {
        return (
            rolUsuario === "administrador" ||
            rolUsuario === "admin" ||
            permisosUsuario.includes("all") ||
            permisosUsuario.includes("usuarios_admin")
        );
    }, [rolUsuario, permisosUsuario]);


    const puedeVerAsignacion = useMemo(() => {
        const esCoordinadorDigital =
            rolUsuario.includes("coordinador") &&
            rolUsuario.includes("digital");


        return (
            isAdmin ||
            esCoordinadorDigital ||
            permisosUsuario.includes("crm_coordinador_digital")
        );
    }, [isAdmin, rolUsuario, permisosUsuario]);

    const numerosAsignados = useMemo(
        () => obtenerNumerosWhatsAppUsuario(user),
        [user]
    );

    const numerosDisponibles = useMemo(() => {
        if (isAdmin) {
            return [
                ...new Set([
                    ...Object.keys(LINEAS_WHATSAPP),
                    ...numerosAsignados,
                ]),
            ];
        }

        return numerosAsignados;
    }, [isAdmin, numerosAsignados]);

    const [numeroAsesorActivo, setNumeroAsesorActivo] = useState("");

    useEffect(() => {
        if (!ready) return;

        if (!numerosDisponibles.length) {
            setNumeroAsesorActivo("");
            return;
        }

        const numeroGuardado = normalizaTelefonoMx(
            localStorage.getItem(
                "digitales_numero_asesor_activo"
            ) || ""
        );

        const numeroInicial =
            numeroGuardado &&
                numerosDisponibles.includes(numeroGuardado)
                ? numeroGuardado
                : numerosDisponibles[0];

        setNumeroAsesorActivo((numeroActual) => {
            if (
                numeroActual &&
                numerosDisponibles.includes(numeroActual)
            ) {
                return numeroActual;
            }

            return numeroInicial;
        });
    }, [ready, numerosDisponibles]);

    const [replyToMsg, setReplyToMsg] = useState(null);
    const [blockingTel, setBlockingTel] = useState("");

    const telParam = params.get("tel") || "";
    const directParam = params.get("direct") || "";
    const tel = useMemo(() => normalizaTelefonoMx(telParam), [telParam]);
    const isDirectChatMode = useMemo(() => Boolean(tel && directParam === "1"), [tel, directParam]);

    const [q, setQ] = useState("");
    const [chatFilter, setChatFilter] = useState("todos");
    const [loadingList, setLoadingList] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chats, setChats] = useState([]);
    const [prospectosIndex, setProspectosIndex] = useState([]);
    const deferredQ = useDeferredValue(q);
    const [activeTel, setActiveTel] = useState("");
    const [prospecto, setProspecto] = useState(null);
    const [iaEstado, setIaEstado] = useState(null);
    const [loadingIaAction, setLoadingIaAction] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [draftMsg, setDraftMsg] = useState("");
    const [draftOwnerTel, setDraftOwnerTel] = useState("");
    const [mobileView, setMobileView] = useState("list");
    const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
    const [pautasOptions, setPautasOptions] = useState(PAUTAS_ORIGEN);
    const [headerEstado, setHeaderEstado] = useState("");
    const [showProspectoPanel, setShowProspectoPanel] = useState(false);

    // Edición del nombre del cliente desde el header del chat
    const [editingNombre, setEditingNombre] = useState(false);
    const [nombreDraft, setNombreDraft] = useState("");
    const [savingNombre, setSavingNombre] = useState(false);
    const nombreInputRef = useRef(null);

    // Modal de agendar cita
    const [showCitaModal, setShowCitaModal] = useState(false);
    const [savingCita, setSavingCita] = useState(false);

    // Resaltado temporal al saltar a un mensaje citado
    const [highlightedMsgId, setHighlightedMsgId] = useState("");

    // Dropdowns compositor
    const [showQuickBubblesDropdown, setShowQuickBubblesDropdown] = useState(false);
    const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
    const quickBubblesDropdownRef = useRef(null);
    const templatesDropdownRef = useRef(null);

    const [chatHasMore, setChatHasMore] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [oldestMessageId, setOldestMessageId] = useState(null);

    // Templates state (en dropdown)
    const [tplSelected, setTplSelected] = useState(null);
    const [tplDraft, setTplDraft] = useState({});
    const [templatesDisponibles, setTemplatesDisponibles] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templatesError, setTemplatesError] = useState("");
    const [sendingTemplate, setSendingTemplate] = useState(false);

    const [openEmoji, setOpenEmoji] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [dragOver, setDragOver] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [recordingError, setRecordingError] = useState("");

    const [editingMsgId, setEditingMsgId] = useState(null);

    const [quickBubbles, setQuickBubbles] = useState(() => {
        try { const s = localStorage.getItem(QUICK_BUBBLES_KEY); if (!s) return []; const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
    });
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [newBubbleText, setNewBubbleText] = useState("");
    const [newBubbleTitle, setNewBubbleTitle] = useState("");
    const [editingBubbleId, setEditingBubbleId] = useState(null);

    const [quickEditDraft, setQuickEditDraft] = useState({});
    const [savingQuickEdit, setSavingQuickEdit] = useState(false);

    const [copiedTel, setCopiedTel] = useState(false);
    const [markingUnreadTel, setMarkingUnreadTel] = useState("");
    const [chatMenu, setChatMenu] = useState(null);

    const endRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const activeTelRef = useRef("");
    const mensajesRef = useRef([]);
    const didInitSelection = useRef(false);
    const numeroAsesorActivoRef = useRef("");
    const chatsRequestRef = useRef(0);
    const emojiRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const discardRecordingRef = useRef(false);

    const dragDepthRef = useRef(0);
    const shouldStickToBottomRef = useRef(true);
    const chatRequestRef = useRef(0);
    const loadingOlderRef = useRef(false);
    const mensajesCacheRef = useRef(new Map());
    const prefetchedChatsRef = useRef(new Set());

    const templateMap = useMemo(() => {
        const map = new Map();
        for (const t of templatesDisponibles || []) { if (t?.key) map.set(t.key, t); }
        return map;
    }, [templatesDisponibles]);

    const activeChat = useMemo(() => {
        if (!activeTel) return null;
        const fromList = chats.find(c => c.telefono === activeTel);
        if (fromList) return fromList;
        return { id: activeTel, telefono: activeTel, nombre: prospecto?.nombre || "Prospecto", agencia: prospecto?.agencia || "", linea: prospecto?.business || "", estado: prospecto?.estado || "", unread: 0, last: { text: "", time: "" } };
    }, [activeTel, chats, prospecto]);

    const pautaOrigenMarker = useMemo(() => {
        const mensajesOrdenados = applyReactionEvents(mensajes);
        const primerEntranteVisible = mensajesOrdenados.find((message) => !message?.mine);

        if (!primerEntranteVisible) return null;

        for (const message of mensajesOrdenados) {
            if (message?.mine) continue;

            const pautaMensaje = getPautaOrigenFromMessage(message);

            if (pautaMensaje) {
                return {
                    messageKey: getMessageKey(message),
                    ...pautaMensaje,
                };
            }
        }

        const previewExpediente = asObject(
            prospecto?.origen_preview || prospecto?.origin_preview
        );

        if (Object.keys(previewExpediente).length > 0) {
            return {
                messageKey: getMessageKey(primerEntranteVisible),
                ...previewExpediente,
                pauta: previewExpediente.pauta || prospecto?.pauta || "",
                headline:
                    previewExpediente.headline ||
                    previewExpediente.nombre_campana ||
                    prospecto?.pauta ||
                    "Anuncio de origen",
            };
        }

        const pauta = String(prospecto?.pauta || "").trim();

        if (pauta) {
            return {
                messageKey: getMessageKey(primerEntranteVisible),
                pauta,
                nombre_campana: pauta,
                sucursal: prospecto?.agencia || "",
                headline: pauta,
                body: "Prospecto originado desde una campaña de Meta.",
                source_url: "",
                image_url: "",
                origen: "expediente",
            };
        }

        return null;
    }, [mensajes, prospecto]);


    const clienteBloqueado = useMemo(() => {
        return Boolean(prospecto?.whatsapp_bloqueado || activeChat?.whatsapp_bloqueado);
    }, [prospecto, activeChat]);

    const filteredChats = useMemo(() => {
        const query = normalizeText(deferredQ);
        const queryPhone = normalizaTelefonoMx(deferredQ);
        const base = query ? mergeChatsConProspectos(chats, prospectosIndex) : chats;
        const filterDef = CHAT_FILTERS.find(f => f.key === chatFilter);
        return base.filter(chat => {
            if (chatFilter === "no_leidos" && !(chat.unread > 0)) return false;
            if (filterDef?.estados) { const en = normalizeText(chat.estado); if (!filterDef.estados.some(e => en.includes(normalizeText(e)))) return false; }
            if (!query) return true;
            return normalizeText(chat.nombre).includes(query) ||
                normalizaTelefonoMx(chat.telefono).includes(queryPhone || query) ||
                normalizeText(chat.agencia).includes(query) ||
                normalizeText(chat.linea).includes(query) ||
                normalizeText(chat.estado).includes(query) ||
                normalizeText(chat.last?.text).includes(query);
        });
    }, [chats, prospectosIndex, deferredQ, chatFilter]);

    const composerHint = useMemo(() => {
        if (!activeTel) return "Selecciona un chat para escribir…";
        if (clienteBloqueado) return "Contacto bloqueado. Desbloquéalo para responder…";
        return "…";
    }, [activeTel, clienteBloqueado]);
    const hasComposerDraft = Boolean(
        draftMsg.trim()
        || attachments.length
        || replyToMsg
        || editingMsgId
        || isRecording
    );
    function cambiarNumeroAsesor(nuevoNumero) {
        const numero = normalizaTelefonoMx(nuevoNumero);

        if (!numero || numero === numeroAsesorActivo) {
            return;
        }

        if (hasComposerDraft) {
            const continuar = window.confirm(
                "Tienes un mensaje o archivo sin enviar. " +
                "Al cambiar de línea se descartará el borrador."
            );

            if (!continuar) {
                return;
            }
        }

        resetComposer();

        activeTelRef.current = "";
        didInitSelection.current = false;

        chatsRequestRef.current += 1;

        numeroAsesorActivoRef.current =
            numero;

        setNumeroAsesorActivo(numero);
        setActiveTel("");
        setChats([]);
        setProspecto(null);
        setMensajes([]);
        setIaEstado(null);
        setChatHasMore(false);
        setOldestMessageId(null);

        mensajesCacheRef.current.clear();
        prefetchedChatsRef.current.clear();

        localStorage.setItem(
            "digitales_numero_asesor_activo",
            numero
        );
    }
    const templatePreview = useMemo(
        () => tplSelected ? buildTemplatePreviewText(tplSelected, tplDraft) : "",
        [tplSelected, tplDraft]
    );

    const incompleteTemplateFields = useMemo(() => {
        const fields = Array.isArray(tplSelected?.fields) ? tplSelected.fields : [];
        return fields.filter((field) => !String(tplDraft?.[field.key] || "").trim());
    }, [tplSelected, tplDraft]);

    // Índice rápido id de mensaje -> mensaje (para resolver citas tipo WhatsApp)
    const messagesById = useMemo(() => {
        const map = new Map();
        for (const m of mensajes) {
            const key = m.wa_message_id || m.id;
            if (key) map.set(String(key), m);
        }
        return map;
    }, [mensajes]);

    function fmtDT(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short", hour12: true, timeZone: "America/Mexico_City" }).format(d);
    }

    function updateDraftMessage(value) {
        const next = String(value ?? "");
        setDraftMsg(next);

        if (next && activeTelRef.current) {
            setDraftOwnerTel(current => current || activeTelRef.current);
        } else if (!next && attachments.length === 0 && !replyToMsg && !editingMsgId) {
            setDraftOwnerTel("");
        }
    }

    function cleanupPreviews(list) {
        for (const a of list || []) { if (a?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(a.previewUrl); } catch { } } }
    }

    function renderTextForBubble(text) { return formatTemplateMarkerText(text, templateMap); }

    function scrollToMessage(domId) {
        const el = document.getElementById(domId);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMsgId(domId);
        setTimeout(() => setHighlightedMsgId(prev => prev === domId ? "" : prev), 1500);
    }

    function guardarChatEnCache(tel52, payload = {}) {
        const key = normalizaTelefonoMx(tel52);
        if (!key) return;
        const actuales = Array.isArray(payload.mensajes) ? payload.mensajes : mensajesRef.current;
        mensajesCacheRef.current.set(key, {
            prospecto: payload.prospecto || prospecto || null,
            ia_estado: payload.ia_estado || iaEstado || null,
            mensajes: actuales.map(normalizeMessage).slice(-CHAT_CACHE_LIMIT),
            paginacion: payload.paginacion || {},
            updatedAt: Date.now(),
        });
    }

    function pintarChatDesdeCache(tel52) {
        const key = normalizaTelefonoMx(tel52);
        const cached = mensajesCacheRef.current.get(key);
        if (!cached) return false;
        setProspecto(cached.prospecto || null);
        setIaEstado(cached.ia_estado || null);
        setMensajes(cached.mensajes || []);
        setChatHasMore(Boolean(cached.paginacion?.has_more));
        setOldestMessageId(cached.paginacion?.oldest_id || cached.mensajes?.[0]?.id || null);
        shouldStickToBottomRef.current = true;
        requestAnimationFrame(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); });
        return true;
    }

    async function prefetchChat(tel52) {
        const target = normalizaTelefonoMx(tel52);
        if (!target || target === activeTelRef.current) return;
        if (mensajesCacheRef.current.has(target)) return;
        if (prefetchedChatsRef.current.has(target)) return;
        prefetchedChatsRef.current.add(target);
        try {
            const data = await api.digitalesContacto(target, {
                limit: PREFETCH_CHAT_LIMIT,
                mark_read: 0,
                numero_asesor: numeroAsesorActivo,
            });
            guardarChatEnCache(target, data);
        } catch { prefetchedChatsRef.current.delete(target); }
    }

    async function refreshChats({
        numeroAsesor =
        numeroAsesorActivoRef.current,
        allowEmpty = false,
    } = {}) {
        const numeroLinea =
            normalizaTelefonoMx(numeroAsesor);

        /*
         * No vaciamos la lista cuando todavía
         * no se ha inicializado la línea.
         */
        if (!numeroLinea) {
            return;
        }

        const requestId =
            chatsRequestRef.current + 1;

        chatsRequestRef.current =
            requestId;

        const response =
            await api.digitalesChats({
                numero_asesor:
                    numeroLinea,
            });

        /*
         * Ignora respuestas anteriores si otra
         * petición más reciente ya fue enviada.
         */
        if (
            requestId !==
            chatsRequestRef.current
        ) {
            return;
        }

        /*
         * Ignora respuestas correspondientes a
         * otra línea que ya no está seleccionada.
         */
        if (
            numeroAsesorActivoRef.current !==
            numeroLinea
        ) {
            return;
        }

        let items;

        if (Array.isArray(response)) {
            items = response;
        } else if (
            Array.isArray(response?.results)
        ) {
            items = response.results;
        } else {
            /*
             * Una respuesta inválida no debe
             * convertirse silenciosamente en [].
             */
            throw new Error(
                "La API de chats devolvió una respuesta inválida."
            );
        }

        const normalized = items
            .map((chat) => {
                const telefono =
                    normalizaTelefonoMx(
                        chat?.telefono || ""
                    );

                return {
                    id:
                        chat?.id ||
                        `${numeroLinea}-${telefono}`,

                    numero_asesor:
                        normalizaTelefonoMx(
                            chat?.numero_asesor ||
                            chat?.numero_destino ||
                            chat?.phone_number ||
                            numeroLinea
                        ),

                    telefono,
                    nombre:
                        chat?.nombre ||
                        "Prospecto",

                    agencia:
                        chat?.agencia || "",

                    linea:
                        chat?.linea || "",

                    estado:
                        chat?.estado || "",

                    asesor_digital:
                        chat?.asesor_digital || "",

                    usuario_crm_asignado:
                        chat?.usuario_crm_asignado || "",

                    ia_estado:
                        chat?.ia_estado || null,

                    ia_pausada:
                        Boolean(
                            chat?.ia_pausada
                        ),

                    ia_bloqueos:
                        Array.isArray(
                            chat?.ia_bloqueos
                        )
                            ? chat.ia_bloqueos
                            : [],

                    unread:
                        Number(
                            chat?.unread || 0
                        ),

                    last: {
                        text:
                            chat?.last_text || "",

                        time:
                            chat?.last_time || "",

                        timestamp:
                            chat?.last_message_at ||
                            "",
                    },

                    whatsapp_bloqueado:
                        Boolean(
                            chat?.whatsapp_bloqueado
                        ),

                    whatsapp_bloqueado_motivo:
                        chat
                            ?.whatsapp_bloqueado_motivo ||
                        "",
                };
            })
            .filter(
                (chat) =>
                    Boolean(chat.telefono)
            );

        setChats((previous) => {
            if (
                !allowEmpty &&
                normalized.length === 0 &&
                previous.length > 0
            ) {
                console.warn(
                    "La actualización de chats llegó vacía; " +
                    "se conserva la lista anterior.",
                    {
                        numeroLinea,
                        requestId,
                    }
                );

                return previous;
            }

            return normalized;
        });
    }

    async function cargarChatInicial(tel52) {
        const target = normalizaTelefonoMx(tel52);
        if (!target) return;
        const requestId = chatRequestRef.current + 1;
        chatRequestRef.current = requestId;
        const hadCache = pintarChatDesdeCache(target);
        setLoadingChat(!hadCache);
        if (!hadCache) { setProspecto(null); setIaEstado(null); setMensajes([]); setChatHasMore(false); setOldestMessageId(null); }
        shouldStickToBottomRef.current = true;
        try {
            const data = await api.digitalesContacto(target, {
                limit: CHAT_PAGE_SIZE,
                mark_read: 1,
                numero_asesor: numeroAsesorActivo,
            });
            if (chatRequestRef.current !== requestId || activeTelRef.current !== target) return;
            const items = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            const paginacion = data.paginacion || {};
            guardarChatEnCache(target, data);
            setProspecto(data.prospecto || null);
            setIaEstado(data.ia_estado || null);
            setMensajes(items);
            setChatHasMore(Boolean(paginacion.has_more));
            setOldestMessageId(paginacion.oldest_id || items[0]?.id || null);
            if (!isDirectChatMode) await refreshChats().catch(() => { });
            requestAnimationFrame(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); });
        } catch (error) {
            console.error(
                "Error cargando chat:",
                error
            );

            if (
                chatRequestRef.current !== requestId ||
                activeTelRef.current !== target
            ) {
                return;
            }

            /*
             * Conservamos el contenido ya cargado.
             * Un error de renovación o conexión no debe
             * hacer desaparecer la conversación.
             */
            const cached =
                mensajesCacheRef.current.get(target);

            if (
                cached &&
                Array.isArray(cached.mensajes)
            ) {
                setProspecto(
                    cached.prospecto || null
                );

                setIaEstado(
                    cached.ia_estado || null
                );

                setMensajes(
                    cached.mensajes
                );

                setChatHasMore(
                    Boolean(
                        cached.paginacion?.has_more
                    )
                );

                setOldestMessageId(
                    cached.paginacion?.oldest_id ||
                    cached.mensajes?.[0]?.id ||
                    null
                );
            }

            /*
             * No ejecutamos setMensajes([]).
             */
        }
        finally { if (chatRequestRef.current === requestId) setLoadingChat(false); }
    }

    async function refreshActiveChat(tel52, { forceBottom = false } = {}) {
        const target = normalizaTelefonoMx(tel52 || activeTelRef.current);
        if (!target) return;

        const data = await api.digitalesContacto(target, {
            limit: CHAT_PAGE_SIZE,
            mark_read: forceBottom ? 1 : 0,
            numero_asesor: numeroAsesorActivo,
        });
        const incoming = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
        const paginacion = data.paginacion || {};

        guardarChatEnCache(target, {
            ...data,
            mensajes: incoming,
            paginacion,
        });

        // Una respuesta tardía nunca debe pintar datos sobre otro chat.
        if (activeTelRef.current !== target) {
            if (!isDirectChatMode) await refreshChats().catch(() => { });
            return;
        }

        setProspecto(data.prospecto || null);
        setIaEstado(data.ia_estado || null);
        setMensajes(prev => mergeMessages(prev.filter(m => !m.local_pending), incoming));
        setOldestMessageId(prev => prev || paginacion.oldest_id || incoming[0]?.id || null);
        setChatHasMore(prev => prev || Boolean(paginacion.has_more));
        if (forceBottom) shouldStickToBottomRef.current = true;
        if (!isDirectChatMode) await refreshChats().catch(() => { });
    }

    async function pausarIaActiva() {
        if (!activeTel || loadingIaAction) return;
        setLoadingIaAction(true);
        try {
            const res = await api.iaPausarConversacion({
                tel: activeTel,
                motivo: "manual_desde_chat",
                numero_asesor: numeroAsesorActivo,
            });
            setIaEstado(res?.estado_ia || null);
            await refreshActiveChat(activeTel).catch(() => { });
        } catch (error) { console.error(error); alert(error?.message || "No se pudo pausar la IA."); }
        finally { setLoadingIaAction(false); }
    }

    async function reactivarIaActiva() {
        if (!activeTel || loadingIaAction) return;
        setLoadingIaAction(true);
        try {
            const res = await api.iaReactivarConversacion({
                tel: activeTel,
                numero_asesor: numeroAsesorActivo,
            });
            setIaEstado(res?.estado_ia || null);
            await refreshActiveChat(activeTel).catch(() => { });
        } catch (error) { console.error(error); alert(error?.message || "No se pudo reactivar la IA."); }
        finally { setLoadingIaAction(false); }
    }

    async function cargarMensajesAnteriores() {
        const target = activeTelRef.current;
        const beforeId = oldestMessageId;
        if (!target || !chatHasMore || !beforeId || loadingOlderRef.current) return;

        const container = messagesScrollRef.current;
        const prevH = container?.scrollHeight || 0;
        const prevT = container?.scrollTop || 0;

        try {
            loadingOlderRef.current = true;
            setLoadingOlder(true);

            const data = await api.digitalesContacto(target, {
                limit: CHAT_PAGE_SIZE,
                before_id: beforeId,
                mark_read: 0,
                numero_asesor: numeroAsesorActivo,
            });

            if (activeTelRef.current !== target) return;

            const older = (Array.isArray(data.mensajes) ? data.mensajes : []).map(normalizeMessage);
            const paginacion = data.paginacion || {};

            if (older.length) {
                setMensajes(prev => mergeMessages(older, prev));
                setOldestMessageId(paginacion.oldest_id || older[0]?.id || beforeId);
            }

            setChatHasMore(Boolean(paginacion.has_more));
            requestAnimationFrame(() => {
                const cur = messagesScrollRef.current;
                if (!cur || activeTelRef.current !== target) return;
                cur.scrollTop = cur.scrollHeight - prevH + prevT;
            });
        } catch (error) {
            console.error("Error cargando mensajes anteriores:", error);
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    }

    function onMessagesScroll(e) {
        const el = e.currentTarget;
        shouldStickToBottomRef.current = isNearBottom(el);
        if (el.scrollTop <= 120) cargarMensajesAnteriores();
    }

    async function cargarPlantillas() {
        if (loadingTemplates) return;

        setLoadingTemplates(true);
        setTemplatesError("");

        try {
            const response = await api.digitalesPlantillas({
                numero_asesor: numeroAsesorActivo,
            });
            const items = Array.isArray(response?.items)
                ? response.items
                : Array.isArray(response)
                    ? response
                    : [];

            const aprobadas = items
                .map(normalizeTemplateFromApi)
                .filter((template) => {
                    const status = String(
                        template?.status || "APPROVED"
                    ).toUpperCase();

                    return status === "APPROVED";
                })
                .filter((template) => template.key);

            setTemplatesDisponibles(aprobadas);

            if (!aprobadas.length) {
                setTemplatesError(
                    "No hay plantillas aprobadas disponibles para esta línea."
                );
            }
        } catch (error) {
            console.error("Error cargando plantillas:", error);

            setTemplatesDisponibles([]);
            setTemplatesError(
                error?.message ||
                "No se pudieron consultar las plantillas aprobadas en Meta."
            );
        } finally {
            setLoadingTemplates(false);
        }
    }

    function cleanupRecordingResources() {
        if (recordingTimerRef.current) {
            window.clearInterval(
                recordingTimerRef.current
            );

            recordingTimerRef.current = null;
        }

        const stream = mediaStreamRef.current;

        if (stream) {
            stream
                .getTracks()
                .forEach((track) => track.stop());
        }

        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        setIsRecording(false);
        setRecordingSeconds(0);
    }

    function detenerGrabacionAudio() {
        const recorder = mediaRecorderRef.current;

        if (
            !recorder
            || recorder.state === "inactive"
        ) {
            cleanupRecordingResources();
            return;
        }

        recorder.stop();
    }

    function cancelarGrabacionAudio() {
        discardRecordingRef.current = true;

        detenerGrabacionAudio();
    }

    async function iniciarGrabacionAudio() {
        if (
            !activeTelRef.current
            || clienteBloqueado
            || isRecording
        ) {
            return;
        }

        if (
            !navigator.mediaDevices?.getUserMedia
            || typeof MediaRecorder === "undefined"
        ) {
            setRecordingError(
                "Este navegador no permite grabar audio. "
                + "Usa Chrome, Edge o Safari actualizado."
            );

            return;
        }

        try {
            setRecordingError("");

            discardRecordingRef.current = false;
            audioChunksRef.current = [];

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });

            const mimeType =
                getSupportedRecorderMimeType();

            const options = mimeType
                ? {
                    mimeType,
                    audioBitsPerSecond: 64000,
                }
                : {
                    audioBitsPerSecond: 64000,
                };

            const recorder = new MediaRecorder(
                stream,
                options,
            );

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data?.size > 0) {
                    audioChunksRef.current.push(
                        event.data
                    );
                }
            };

            recorder.onerror = (event) => {
                console.error(
                    "Error grabando audio:",
                    event?.error || event,
                );

                setRecordingError(
                    "Ocurrió un error durante la grabación."
                );

                discardRecordingRef.current = true;

                cleanupRecordingResources();
            };

            recorder.onstop = () => {
                const chunks = [
                    ...audioChunksRef.current,
                ];

                const discard =
                    discardRecordingRef.current;

                const finalMime =
                    recorder.mimeType
                    || mimeType
                    || "audio/webm";

                audioChunksRef.current = [];
                discardRecordingRef.current = false;

                cleanupRecordingResources();

                if (
                    discard
                    || !chunks.length
                ) {
                    return;
                }

                const blob = new Blob(
                    chunks,
                    {
                        type: finalMime,
                    },
                );

                if (blob.size < 512) {
                    setRecordingError(
                        "La grabación quedó vacía. "
                        + "Intenta nuevamente."
                    );

                    return;
                }

                const extension =
                    getAudioExtension(finalMime);

                const file = new File(
                    [blob],
                    `nota-voz-${Date.now()}.${extension}`,
                    {
                        type: finalMime,
                        lastModified: Date.now(),
                    },
                );
                addFilesAsAttachments([file]);
            };

            recorder.start(250);
            setDraftOwnerTel(
                (current) =>
                    current || activeTelRef.current
            );

            setIsRecording(true);
            setRecordingSeconds(0);

            recordingTimerRef.current =
                window.setInterval(() => {
                    setRecordingSeconds((current) => {
                        const next = current + 1;

                        if (
                            next >=
                            MAX_RECORDING_SECONDS
                        ) {
                            window.setTimeout(
                                detenerGrabacionAudio,
                                0,
                            );
                        }

                        return Math.min(
                            next,
                            MAX_RECORDING_SECONDS,
                        );
                    });
                }, 1000);

        } catch (error) {
            console.error(
                "No se pudo iniciar la grabación:",
                error,
            );

            if (error?.name === "NotAllowedError") {
                setRecordingError(
                    "Permite el acceso al micrófono "
                    + "para grabar notas de voz."
                );

            } else if (
                error?.name === "NotFoundError"
            ) {
                setRecordingError(
                    "No se encontró un micrófono disponible."
                );

            } else {
                setRecordingError(
                    error?.message
                    || "No se pudo iniciar la grabación."
                );
            }

            cleanupRecordingResources();
        }
    }

    function addFilesAsAttachments(files) {
        const arr = Array.from(files || []);

        if (!arr.length) return;
        if (activeTelRef.current) {
            setDraftOwnerTel(current => current || activeTelRef.current);
        }

        setAttachments(prev => {
            const next = [...prev];

            const sig = (f) => `${f?.name || ""}|${f?.size || 0}|${f?.lastModified || 0}`;
            const existing = new Set(next.map(a => sig(a.file)));

            for (const file of arr) {
                if (!file) continue;

                const key = sig(file);

                if (existing.has(key)) continue;

                const id = crypto.randomUUID();
                const kind = fileKind(file);
                const localUrl = URL.createObjectURL(file);

                next.push({
                    id,
                    file,
                    kind,
                    previewUrl: localUrl,
                    url: localUrl,
                    name: file.name,
                    size: file.size,
                    mime: file.type || "",
                });

                existing.add(key);
            }

            return next.slice(0, 10);
        });
    }

    function removeAttachment(id) {
        setAttachments(prev => {
            const t = prev.find(i => i.id === id);
            if (t?.previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(t.previewUrl); } catch { } }
            return prev.filter(i => i.id !== id);
        });
    }

    function resetComposer() {
        if (isRecording) {
            cancelarGrabacionAudio();
        }

        setDraftMsg("");

        if (inputRef.current) {
            inputRef.current.value = "";
        }

        setEditingMsgId(null);
        setReplyToMsg(null);
        setDraftOwnerTel("");
        setOpenEmoji(false);
        setShowQuickBubblesDropdown(false);
        setShowTemplatesDropdown(false);

        cleanupPreviews(attachments);
        setAttachments([]);
    }
    function clearTelQueryIfAny() {
        if (!telParam) return;
        navigate({ pathname: location.pathname, search: "" }, { replace: true });
    }

    async function openChatByTel(tel52) {
        const normalized = normalizaTelefonoMx(tel52);
        if (!normalized) return;

        if (
            hasComposerDraft &&
            draftOwnerTel &&
            normalized !== draftOwnerTel
        ) {
            const ok = window.confirm(
                "Tienes un mensaje sin enviar en la conversación actual. " +
                "¿Deseas descartarlo y cambiar de cliente?"
            );
            if (!ok) return;
            resetComposer();
        }

        clearTelQueryIfAny();
        activeTelRef.current = normalized;
        setActiveTel(normalized);
        setMobileView("chat");
        setShowProspectoPanel(false);
        setOpenEmoji(false);
        setShowQuickBubblesDropdown(false);
        setShowTemplatesDropdown(false);
        localStorage.setItem("last_active_chat", normalized);
        setChats(prev => prev.map(c => c.telefono === normalized ? { ...c, unread: 0 } : c));
    }

    function onPickEmoji(emojiObj) {
        const emoji = emojiObj?.emoji || "";
        if (!emoji) return;
        if (activeTelRef.current) {
            setDraftOwnerTel(current => current || activeTelRef.current);
        }
        const input = inputRef.current;
        if (input && typeof input.selectionStart === "number") {
            const s = input.selectionStart, e = input.selectionEnd;
            const next = `${draftMsg.slice(0, s)}${emoji}${draftMsg.slice(e)}`;
            updateDraftMessage(next);
            requestAnimationFrame(() => { input.focus(); input.setSelectionRange(s + emoji.length, s + emoji.length); });
            return;
        }
        updateDraftMessage(`${draftMsg}${emoji}`);
        requestAnimationFrame(() => inputRef.current?.focus?.());
    }

    function onPasteInComposer(e) {
        if (!activeTel) return;
        const items = e.clipboardData?.items ? Array.from(e.clipboardData.items) : [];
        const files = [];
        for (const item of items) { if (item.kind === "file") { const f = item.getAsFile?.(); if (f) files.push(f); } }
        if (files.length) { e.preventDefault(); addFilesAsAttachments(files); }
    }

    function onDragEnterComposer(e) { if (!activeTel) return; e.preventDefault(); e.stopPropagation(); dragDepthRef.current += 1; setDragOver(true); }
    function onDragOverComposer(e) { if (!activeTel) return; e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; setDragOver(true); }
    function onDragLeaveComposer(e) { if (!activeTel) return; e.preventDefault(); e.stopPropagation(); dragDepthRef.current = Math.max(0, dragDepthRef.current - 1); if (dragDepthRef.current === 0) setDragOver(false); }
    function onDropComposer(e) {
        if (!activeTel) return; e.preventDefault(); e.stopPropagation();
        dragDepthRef.current = 0; setDragOver(false);
        const files = extractFilesFromDataTransfer(e.dataTransfer);
        if (files.length) addFilesAsAttachments(files);
        inputRef.current?.focus?.();
    }

    async function abrirPlantillasDropdown() {
        if (!activeTel || clienteBloqueado) return;

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
        setOpenEmoji(false);
        setShowQuickBubblesDropdown(false);
        setShowTemplatesDropdown(true);

        await cargarPlantillas();
    }

    function pickTemplate(template) {
        const normalizedTemplate = normalizeTemplateFromApi(template);

        setTplSelected(normalizedTemplate);
        setTemplatesError("");

        const currentAgencia = String(
            prospecto?.agencia ||
            activeChat?.agencia ||
            ""
        ).trim();

        const bestDealer =
            DEALERS.find(
                (dealer) =>
                    dealer.toLowerCase() ===
                    currentAgencia.toLowerCase()
            ) ||
            DEALERS.find((dealer) =>
                currentAgencia
                    .toLowerCase()
                    .includes(dealer.toLowerCase())
            ) ||
            "";

        const canalActual = String(
            prospecto?.canal_contacto || ""
        ).trim();

        const bestCanal =
            CANALES.find(
                (canal) =>
                    canal.toLowerCase() ===
                    canalActual.toLowerCase()
            ) || "";

        const asesorAuto = String(
            prospecto?.asesor_digital ||
            prospecto?.asesor_ventas ||
            prospecto?.responsable ||
            ""
        ).trim();

        const context = {
            nombre: String(
                prospecto?.nombre ||
                activeChat?.nombre ||
                ""
            ).trim(),
            agencia: bestDealer,
            modelo: String(
                prospecto?.auto_interes || ""
            ).trim(),
            canal: bestCanal,
            asesor: asesorAuto,
            tema: prospecto?.auto_interes
                ? "auto de interés"
                : "cita",
            dato: "",
        };

        const values = {};

        for (const field of normalizedTemplate.fields) {
            values[field.key] =
                getDefaultValueForTemplateField(
                    field,
                    context
                );
        }

        setTplDraft(values);
    }

    function addQuickBubble() {
        const text = newBubbleText.trim();
        if (!text) return;
        setQuickBubbles(prev => [...prev, { id: crypto.randomUUID(), title: newBubbleTitle.trim() || text.slice(0, 25), text, createdAt: new Date().toISOString() }]);
        setNewBubbleText(""); setNewBubbleTitle(""); setShowAddBubble(false);
    }

    function startEditQuickBubble(bubble) {
        setEditingBubbleId(bubble.id);
        setNewBubbleTitle(bubble.title);
        setNewBubbleText(bubble.text);
        setShowAddBubble(true);
    }

    function updateQuickBubble() {
        const text = newBubbleText.trim();
        if (!text || !editingBubbleId) return;
        setQuickBubbles(prev => prev.map(b =>
            b.id === editingBubbleId
                ? { ...b, title: newBubbleTitle.trim() || text.slice(0, 25), text }
                : b
        ));
        setNewBubbleText(""); setNewBubbleTitle(""); setShowAddBubble(false); setEditingBubbleId(null);
    }

    function deleteQuickBubble(id) { setQuickBubbles(prev => prev.filter(b => b.id !== id)); }

    async function sendQuickBubble(text) {
        const targetTel = activeTelRef.current;
        if (!targetTel || !text.trim()) return;

        setShowQuickBubblesDropdown(false);
        const optimisticId = crypto.randomUUID();
        const replyMessageId = replyToMsg?.wa_message_id || replyToMsg?.id || "";
        shouldStickToBottomRef.current = true;

        setMensajes(prev => [...prev, {
            id: optimisticId,
            local_pending: true,
            local_created_at: new Date().toISOString(),
            mine: true,
            text: text.replace(/\r\n/g, "\n").trim(),
            time: "Ahora",
            status: "sent",
            reply_to_id: replyMessageId,
            attachments: [],
        }]);

        try {
            await api.digitalesEnviarMensaje({
                to: targetTel,
                text: text.trim(),
                reply_to_message_id: replyMessageId,
                numero_asesor: numeroAsesorActivo,
            });
            setReplyToMsg(null);
            await refreshActiveChat(targetTel, { forceBottom: true });
        } catch (error) {
            alert(`Falló: ${error.message}`);
            await refreshActiveChat(targetTel).catch(() => { });
        }
    }

    function getReplyPreview(message) {
        if (!message) return "";

        const text = cleanMediaTextForBubble(
            String(message.text || message.body || "").trim(),
            message.attachments || [],
        );

        if (text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;

        return (Array.isArray(message.attachments) && message.attachments.length > 0)
            ? "Archivo adjunto"
            : "Mensaje seleccionado";
    }

    function getReplyAuthor(message) {
        if (!message) return "";
        if (message.mine) return (message.is_ai || message?.raw?.ia_provider || message?.raw?.ia_model) ? "IA" : "Asesor";
        const nombre = activeChat?.nombre || prospecto?.nombre || "Cliente";
        return activeTel ? `${nombre} · ${formateaTelUi(activeTel)}` : nombre;
    }

    async function enviarMensaje() {
        if (isRecording) {
            setRecordingError(
                "Detén la grabación antes de enviar el mensaje."
            );

            return;
        }

        const visibleTel =
            activeTelRef.current;

        const targetTel = normalizaTelefonoMx(
            draftOwnerTel || visibleTel
        );

        if (!targetTel) {
            return;
        }

        if (visibleTel !== targetTel) {
            activeTelRef.current = targetTel;

            setActiveTel(targetTel);
            setMobileView("chat");

            alert(
                "El borrador pertenece a otra conversación. "
                + "Regresé al cliente correcto para evitar "
                + "un envío equivocado."
            );

            return;
        }

        if (clienteBloqueado) {
            alert(
                "Este contacto está bloqueado. "
                + "Desbloquéalo antes de enviar mensajes."
            );

            return;
        }

        const text = draftMsg
            .replace(/\r\n/g, "\n")
            .trim();

        const hasText = Boolean(text);
        const hasAttachments =
            attachments.length > 0;

        if (
            !hasText
            && !hasAttachments
        ) {
            return;
        }

        const editId = editingMsgId;

        /*
         * Conservamos una copia porque resetComposer()
         * limpia attachments antes de hacer el request.
         */
        const currentAttachments = attachments;

        const replyMessageId =
            replyToMsg?.wa_message_id
            || replyToMsg?.id
            || "";

        // ── Edición de mensaje ─────────────────────────────
        if (editId) {
            if (!hasText) {
                alert(
                    "Para editar, escribe texto."
                );

                return;
            }

            setMensajes((previous) =>
                previous.map((message) =>
                    (
                        message.wa_message_id
                        || message.id
                    ) === editId
                        ? {
                            ...message,
                            text,
                            status: "sent",
                            edited: true,
                        }
                        : message
                )
            );

            resetComposer();

            try {
                await api.digitalesEditarMensaje({
                    to: targetTel,
                    message_id: editId,
                    text,
                    numero_asesor: numeroAsesorActivo,
                });

                await refreshActiveChat(
                    targetTel,
                    {
                        forceBottom: true,
                    },
                );

            } catch (error) {
                alert(
                    `Falló edición: ${error.message}`
                );

                await refreshActiveChat(
                    targetTel
                ).catch(() => { });
            }

            return;
        }

        // ── Mensaje nuevo ──────────────────────────────────
        const optimisticId =
            crypto.randomUUID();

        const optimisticAttachments =
            currentAttachments.map((attachment) => {
                const localUrl = attachment.file
                    ? URL.createObjectURL(
                        attachment.file
                    )
                    : (
                        attachment.url
                        || attachment.previewUrl
                        || ""
                    );

                return {
                    id: attachment.id,
                    kind: attachment.kind,
                    previewUrl: localUrl,
                    url: localUrl,
                    name: attachment.name,
                    size: attachment.size,
                    mime:
                        attachment.mime
                        || attachment.file?.type
                        || "",
                };
            });

        shouldStickToBottomRef.current = true;

        setMensajes((previous) => [
            ...previous,
            {
                id: optimisticId,
                local_pending: true,
                local_created_at:
                    new Date().toISOString(),
                mine: true,
                text: hasText
                    ? text
                    : "Adjunto",
                time: "Ahora",
                status: "sent",
                reply_to_id:
                    replyMessageId || "",
                attachments:
                    optimisticAttachments,
            },
        ]);

        resetComposer();

        try {
            if (hasAttachments) {
                await api.digitalesEnviarMedia({
                    to: targetTel,
                    text: hasText ? text : "",
                    files: currentAttachments
                        .map((attachment) => attachment.file)
                        .filter(Boolean),
                    reply_to_message_id: replyMessageId,
                    numero_asesor: numeroAsesorActivo,
                });

            } else {
                await api.digitalesEnviarMensaje({
                    to: targetTel,
                    text,
                    reply_to_message_id: replyMessageId,
                    numero_asesor: numeroAsesorActivo,
                });
            }

            await refreshActiveChat(
                targetTel,
                {
                    forceBottom: true,
                },
            );

        } catch (error) {
            alert(
                `Falló: ${error.message}`
            );

            await refreshActiveChat(
                targetTel
            ).catch(() => { });

        } finally {
            cleanupPreviews(
                optimisticAttachments
            );
        }
    }

    async function enviarPlantilla() {
        const targetTel = activeTelRef.current;
        if (
            !targetTel ||
            !tplSelected ||
            sendingTemplate
        ) {
            return;
        }

        if (clienteBloqueado) {
            setTemplatesError(
                "El contacto está bloqueado. Desbloquéalo antes de enviar una plantilla."
            );

            return;
        }

        const fields = Array.isArray(tplSelected.fields)
            ? tplSelected.fields
            : [];

        const incompleteField = fields.find(
            (field) =>
                !String(
                    tplDraft?.[field.key] || ""
                ).trim()
        );

        if (incompleteField) {
            setTemplatesError(
                `Completa el campo obligatorio: ${incompleteField.friendlyLabel ||
                getFriendlyTemplateFieldLabel(incompleteField)
                }.`
            );

            return;
        }

        const idioma =
            tplSelected.idioma ||
            tplSelected.language ||
            "es_MX";

        const templateName =
            tplSelected.key ||
            tplSelected.name;

        if (!templateName) {
            setTemplatesError(
                "La plantilla seleccionada no tiene un nombre válido."
            );

            return;
        }

        const textoPreview = buildTemplatePreviewText(
            tplSelected,
            tplDraft
        );

        const components = buildDynamicTemplateComponents(
            tplSelected,
            tplDraft
        );

        const optimisticId = crypto.randomUUID();

        setTemplatesError("");
        setSendingTemplate(true);
        shouldStickToBottomRef.current = true;

        setMensajes((previous) => [
            ...previous,
            {
                id: optimisticId,
                local_pending: true,
                local_created_at: new Date().toISOString(),
                mine: true,
                text:
                    textoPreview ||
                    `Plantilla: ${templateName}`,
                time: "Ahora",
                status: "sent",
                attachments: [],
            },
        ]);

        try {
            await api.digitalesEnviarPlantilla({
                to: targetTel,
                template_name: templateName,
                idioma,
                components:
                    components.length > 0
                        ? components
                        : undefined,
                params:
                    components.length > 0
                        ? undefined
                        : [],
                numero_asesor: numeroAsesorActivo,
            });

            setShowTemplatesDropdown(false);
            setTplSelected(null);
            setTplDraft({});
            setTemplatesError("");

            await refreshActiveChat(
                targetTel,
                { forceBottom: true }
            );
        } catch (error) {
            console.error(
                "Error enviando plantilla:",
                error
            );

            setTemplatesError(
                error?.message ||
                "No se pudo enviar la plantilla."
            );

            setMensajes((previous) =>
                previous.filter(
                    (message) =>
                        message.id !== optimisticId
                )
            );

            await refreshActiveChat(targetTel)
                .catch(() => { });
        } finally {
            setSendingTemplate(false);
        }
    }

    function copyTel() {
        if (!activeTel) return;
        navigator.clipboard?.writeText(formateaTelUi(activeTel).replace(/\s/g, "").replace("+", "")).then(() => { setCopiedTel(true); setTimeout(() => setCopiedTel(false), 2000); }).catch(() => { });
    }

    async function llamarMarkUnread(tel52) {
        if (
            typeof api.digitalesMarkUnread ===
            "function"
        ) {
            return api.digitalesMarkUnread({
                tel: tel52,
                numero_asesor:
                    numeroAsesorActivo,
            });
        }

        throw new Error(
            "Falta agregar digitalesMarkUnread "
            + "en apiPruebas.js"
        );
    }

    async function marcarChatComoNoLeido(tel52 = activeTel) {
        const target = normalizaTelefonoMx(tel52);
        if (!target || markingUnreadTel) return;
        setChatMenu(null); setMarkingUnreadTel(target);
        try {
            await llamarMarkUnread(target);
            setChats(prev => prev.map(c => c.telefono === target ? { ...c, unread: Math.max(Number(c.unread || 0), 1) } : c));
            mensajesCacheRef.current.delete(target);
            if (!isDirectChatMode) await refreshChats().catch(() => { });
        } catch (error) { alert(`No se pudo marcar como no leído: ${error.message}`); }
        finally { setMarkingUnreadTel(""); }
    }

    // ── Edición del nombre del cliente ───────────────────────────────────────
    function iniciarEdicionNombre() {
        if (!activeTel) return;
        setNombreDraft(activeChat?.nombre || prospecto?.nombre || "");
        setEditingNombre(true);
        requestAnimationFrame(() => { nombreInputRef.current?.focus?.(); nombreInputRef.current?.select?.(); });
    }

    function cancelarEdicionNombre() {
        setEditingNombre(false);
        setNombreDraft("");
    }

    async function guardarNombre() {
        const nuevoNombre = nombreDraft.trim();
        if (!nuevoNombre || !activeTel) { cancelarEdicionNombre(); return; }
        if (nuevoNombre === (activeChat?.nombre || prospecto?.nombre || "")) { cancelarEdicionNombre(); return; }

        setSavingNombre(true);
        try {
            if (prospecto?.id) {
                await api.digitalesPatchProspecto(prospecto.id, { nombre: nuevoNombre });
            }
            setProspecto(prev => prev ? { ...prev, nombre: nuevoNombre } : prev);
            setChats(prev => prev.map(c => c.telefono === activeTel ? { ...c, nombre: nuevoNombre } : c));
            mensajesCacheRef.current.delete(activeTel);
            setEditingNombre(false);
        } catch (error) {
            alert(`No se pudo actualizar el nombre: ${error.message}`);
        } finally {
            setSavingNombre(false);
        }
    }

    function onNombreKeyDown(e) {
        if (e.key === "Enter") { e.preventDefault(); guardarNombre(); }
        if (e.key === "Escape") { e.preventDefault(); cancelarEdicionNombre(); }
    }

    // ── Agendar cita desde el chat ────────────────────────────────────────────
    async function llamarCrearCita(payload) {
        if (typeof apiCitas?.create === "function") return apiCitas.create(payload);
        if (typeof api.digitalesCrearCita === "function") return api.digitalesCrearCita(payload);
        if (typeof api.crearCita === "function") return api.crearCita(payload);
        if (typeof api.post === "function") return api.post("/citas/crear/", payload);
        throw new Error("Falta agregar api.digitalesCrearCita en src/lib/apiPruebas.js");
    }

    async function guardarCita({ fecha, hora, nota }) {
        if (!activeTel || savingCita) return;
        setSavingCita(true);
        try {
            const fechaHoraIso = `${fecha}T${hora}:00`;
            await llamarCrearCita({
                agencia: prospecto?.agencia || activeChat?.agencia || "",
                nombre: activeChat?.nombre || prospecto?.nombre || "Prospecto",
                telefono: activeTel,
                auto_interes: prospecto?.auto_interes || "",
                fecha_hora_cita: fechaHoraIso,
                asistencia: false,
                tipo_cita: "Digital",
                fuente_prospeccion: prospecto?.pauta || prospecto?.pauta_origen || "",
                asesor_digital: prospecto?.asesor_digital || "",
                asesor_piso: "",
                comentarios: nota || "",
            });
            setShowCitaModal(false);
            alert(`Cita agendada para ${formatearFechaConDia(`${fecha}T00:00:00`)} a las ${hora}.`);
        } catch (error) {
            alert(`No se pudo agendar la cita: ${error.message}`);
        } finally {
            setSavingCita(false);
        }
    }

    async function bloquearContactoActivo() {
        if (!activeTel || blockingTel) return;

        const ok = window.confirm(
            `¿Seguro que quieres bloquear a ${formateaTelUi(activeTel)}?\n\n` +
            "Ya no podrá escribir a esta línea de WhatsApp y tampoco podrás enviarle mensajes hasta desbloquearlo."
        );

        if (!ok) return;

        setBlockingTel(activeTel);

        try {
            await api.digitalesBloquearContacto({
                tel: activeTel,
                motivo:
                    "Cliente bloqueado manualmente desde el chat",
                numero_asesor: numeroAsesorActivo,
            });

            setProspecto(prev => prev ? {
                ...prev,
                whatsapp_bloqueado: true,
                whatsapp_bloqueado_motivo: "Cliente bloqueado manualmente desde el chat",
                estado: "Descalificado",
                ia_pausada: true,
                ia_pausada_motivo: "cliente_bloqueado",
            } : prev);

            setChats(prev => prev.map(c =>
                c.telefono === activeTel
                    ? {
                        ...c,
                        whatsapp_bloqueado: true,
                        whatsapp_bloqueado_motivo: "Cliente bloqueado manualmente desde el chat",
                        estado: "Descalificado",
                    }
                    : c
            ));

            mensajesCacheRef.current.delete(activeTel);

            await refreshActiveChat(activeTel).catch(() => { });
            await refreshChats().catch(() => { });

            alert("Contacto bloqueado correctamente.");
        } catch (error) {
            alert(`No se pudo bloquear: ${error.message}`);
        } finally {
            setBlockingTel("");
        }
    }


    async function desbloquearContactoActivo() {
        if (!activeTel || blockingTel) return;

        const ok = window.confirm(
            `¿Deseas desbloquear a ${formateaTelUi(activeTel)}?`
        );

        if (!ok) return;

        setBlockingTel(activeTel);

        try {
            await api.digitalesDesbloquearContacto({
                tel: activeTel,
                numero_asesor: numeroAsesorActivo,
            });

            setProspecto(prev => prev ? {
                ...prev,
                whatsapp_bloqueado: false,
                whatsapp_bloqueado_motivo: "",
            } : prev);

            setChats(prev => prev.map(c =>
                c.telefono === activeTel
                    ? {
                        ...c,
                        whatsapp_bloqueado: false,
                        whatsapp_bloqueado_motivo: "",
                    }
                    : c
            ));

            mensajesCacheRef.current.delete(activeTel);

            await refreshActiveChat(activeTel).catch(() => { });
            await refreshChats().catch(() => { });

            alert("Contacto desbloqueado correctamente.");
        } catch (error) {
            alert(`No se pudo desbloquear: ${error.message}`);
        } finally {
            setBlockingTel("");
        }
    }

    function abrirMenuChat(e, chat) {
        e.preventDefault(); e.stopPropagation();
        if (!chat?.telefono) return;
        setChatMenu({ x: e.clientX, y: e.clientY, tel: chat.telefono, nombre: chat.nombre || "Prospecto" });
    }

    async function saveQuickEdit() {
        if (!prospecto?.id || !activeTel) return;

        const estado = String(quickEditDraft.estado || "").trim();
        const motivoDescalificacion = String(
            quickEditDraft.motivo_descalificacion || ""
        ).trim();

        if (
            estado.toLowerCase() === "descalificado" &&
            !motivoDescalificacion
        ) {
            return;
        }

        setSavingQuickEdit(true);

        try {
            const payload = {
                nombre: quickEditDraft.nombre || "",
                auto_interes: quickEditDraft.auto_interes || "",
                estado,

                motivo_descalificacion:
                    estado.toLowerCase() === "descalificado"
                        ? motivoDescalificacion
                        : "",

                canal_contacto: quickEditDraft.canal_contacto || "",
                comentarios: quickEditDraft.comentarios || "",

                enganche_monto: quickEditDraft.enganche_monto
                    ? Number(
                        String(quickEditDraft.enganche_monto)
                            .replace(/\D/g, "")
                    ) || null
                    : null,

                presupuesto_mensual: quickEditDraft.presupuesto_mensual
                    ? Number(
                        String(quickEditDraft.presupuesto_mensual)
                            .replace(/\D/g, "")
                    ) || null
                    : null,

                buro_estado: quickEditDraft.buro_estado || "",
                forma_pago: quickEditDraft.forma_pago || "",
                tipo_cliente: quickEditDraft.tipo_cliente || "",
                uso_vehiculo: quickEditDraft.uso_vehiculo || "",
                plazo_compra: quickEditDraft.plazo_compra || "",
                comprobacion_ingresos:
                    quickEditDraft.comprobacion_ingresos || "",
            };

            const pautaLimpia = String(
                quickEditDraft.pauta || ""
            ).trim();

            if (pautaLimpia) {
                payload.pauta = pautaLimpia;
            }

            await api.digitalesPatchProspecto(
                prospecto.id,
                payload
            );

            await refreshActiveChat(activeTel);
        } catch (error) {
            alert(`No se pudo guardar: ${error.message}`);
        } finally {
            setSavingQuickEdit(false);
        }
    }

    async function saveHeaderEstado(nuevoEstado) {
        if (!prospecto?.id || !activeTel) return;

        const estado = String(nuevoEstado || "").trim();
        const esDescalificado =
            estado.toLowerCase() === "descalificado";

        setHeaderEstado(estado);

        setQuickEditDraft((current) => ({
            ...current,
            estado,
            motivo_descalificacion: esDescalificado
                ? current.motivo_descalificacion || ""
                : "",
        }));

        // Todavía no guardamos porque falta seleccionar el motivo.
        if (esDescalificado) return;

        try {
            await api.digitalesPatchProspecto(
                prospecto.id,
                {
                    estado,
                    motivo_descalificacion: "",
                }
            );

            await refreshActiveChat(activeTel).catch(() => { });
        } catch (error) {
            console.error(
                "Error guardando estado:",
                error
            );
        }
    }

    async function saveHeaderMotivo(nuevoMotivo) {
        if (!prospecto?.id || !activeTel) return;

        const motivo = String(nuevoMotivo || "").trim();

        setHeaderEstado("Descalificado");

        setQuickEditDraft((current) => ({
            ...current,
            estado: "Descalificado",
            motivo_descalificacion: motivo,
        }));

        if (!motivo) return;

        try {
            await api.digitalesPatchProspecto(
                prospecto.id,
                {
                    estado: "Descalificado",
                    motivo_descalificacion: motivo,
                }
            );

            await refreshActiveChat(activeTel).catch(() => { });
        } catch (error) {
            console.error(
                "Error guardando motivo de descalificación:",
                error
            );
        }
    }

    // ── Effects ───────────────────────────────────────────────────────────────


    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (typeof api.digitalesCampanasMeta !== "function") return;
                const response = await api.digitalesCampanasMeta(90);
                if (!mounted) return;
                setPautasOptions(normalizeCampanasMetaOptions(response));
            } catch { if (mounted) setPautasOptions(PAUTAS_ORIGEN); }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => { try { localStorage.setItem(QUICK_BUBBLES_KEY, JSON.stringify(quickBubbles)); } catch { } }, [quickBubbles]);
    useEffect(() => {
        if (!numeroAsesorActivo) return;
        cargarPlantillas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numeroAsesorActivo]);
    useEffect(() => { activeTelRef.current = activeTel; }, [activeTel]);
    useEffect(() => {
        numeroAsesorActivoRef.current =
            normalizaTelefonoMx(
                numeroAsesorActivo
            );
    }, [numeroAsesorActivo]);
    useEffect(() => {
        if (!hasComposerDraft && draftOwnerTel) {
            setDraftOwnerTel("");
        }
    }, [hasComposerDraft, draftOwnerTel]);
    useEffect(() => {
        if (!hasComposerDraft || !draftOwnerTel || !activeTel) return;
        if (activeTel === draftOwnerTel) return;

        activeTelRef.current = draftOwnerTel;
        setActiveTel(draftOwnerTel);
        setMobileView("chat");
    }, [activeTel, draftOwnerTel, hasComposerDraft]);

    useEffect(() => {
        if (!prospecto) return;

        setHeaderEstado(prospecto.estado || "");

        setQuickEditDraft({
            nombre: prospecto.nombre || "",
            auto_interes: prospecto.auto_interes || "",
            estado: prospecto.estado || "",
            motivo_descalificacion: prospecto.motivo_descalificacion || "",
            canal_contacto: prospecto.canal_contacto || "",
            comentarios: prospecto.comentarios || prospecto.comentario || "",
            enganche_monto: prospecto.enganche_monto || "",
            presupuesto_mensual: prospecto.presupuesto_mensual || "",
            buro_estado: prospecto.buro_estado || "",
            forma_pago: prospecto.forma_pago || "",
            tipo_cliente: prospecto.tipo_cliente || "",
            uso_vehiculo: prospecto.uso_vehiculo || "",
            plazo_compra: prospecto.plazo_compra || "",
            comprobacion_ingresos: prospecto.comprobacion_ingresos || "",
        });
    }, [prospecto]);

    useEffect(() => {
        mensajesRef.current = mensajes;
        if (activeTel && mensajes.length) guardarChatEnCache(activeTel, { prospecto, ia_estado: iaEstado, mensajes, paginacion: { has_more: chatHasMore, oldest_id: oldestMessageId } });
    }, [mensajes, activeTel, prospecto, iaEstado, chatHasMore, oldestMessageId]);

    useEffect(() => { if (!shouldStickToBottomRef.current) return; endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length, activeTel]);
    useEffect(() => () => cleanupPreviews(attachments), []);
    useEffect(() => {
        return () => {
            discardRecordingRef.current = true;

            const recorder =
                mediaRecorderRef.current;

            if (
                recorder
                && recorder.state !== "inactive"
            ) {
                try {
                    recorder.stop();
                } catch {
                    // Sin acción.
                }
            }

            if (recordingTimerRef.current) {
                window.clearInterval(
                    recordingTimerRef.current
                );
            }

            mediaStreamRef.current
                ?.getTracks?.()
                .forEach(
                    (track) => track.stop()
                );
        };
    }, []);
    // Cerrar emoji al click fuera
    useEffect(() => {
        const onDoc = (e) => { if (!openEmoji) return; if (emojiRef.current && !emojiRef.current.contains(e.target)) setOpenEmoji(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [openEmoji]);

    // Cerrar dropdowns al click fuera
    useEffect(() => {
        if (!showQuickBubblesDropdown) return;
        const onDoc = (e) => { if (quickBubblesDropdownRef.current && !quickBubblesDropdownRef.current.contains(e.target)) setShowQuickBubblesDropdown(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showQuickBubblesDropdown]);

    useEffect(() => {
        if (!showTemplatesDropdown) return;
        const onDoc = (e) => { if (templatesDropdownRef.current && !templatesDropdownRef.current.contains(e.target)) { setShowTemplatesDropdown(false); setTplSelected(null); } };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [showTemplatesDropdown]);

    useEffect(() => {
        if (!chatMenu) return;
        const cerrar = () => setChatMenu(null);
        document.addEventListener("mousedown", cerrar);
        window.addEventListener("scroll", cerrar, true);
        window.addEventListener("resize", cerrar);
        return () => { document.removeEventListener("mousedown", cerrar); window.removeEventListener("scroll", cerrar, true); window.removeEventListener("resize", cerrar); };
    }, [chatMenu]);

    useEffect(() => {
        const numeroLinea =
            normalizaTelefonoMx(
                numeroAsesorActivo
            );

        if (!numeroLinea) {
            return;
        }

        const onNuevoMensaje =
            async (event) => {
                const data =
                    event.detail || {};

                const telefonoMensaje =
                    normalizaTelefonoMx(
                        data.telefono || ""
                    );

                if (!telefonoMensaje) {
                    return;
                }

                /*
                 * Ignora eventos que indiquen
                 * explícitamente otra línea.
                 */
                const lineaEvento =
                    normalizaTelefonoMx(
                        data.numero_asesor ||
                        data.numero_destino ||
                        ""
                    );

                if (
                    lineaEvento &&
                    lineaEvento !== numeroLinea
                ) {
                    return;
                }

                if (
                    telefonoMensaje ===
                    activeTelRef.current
                ) {
                    const shouldFollow =
                        isNearBottom(
                            messagesScrollRef.current
                        );

                    await refreshActiveChat(
                        telefonoMensaje,
                        {
                            forceBottom:
                                shouldFollow,
                        }
                    ).catch((error) => {
                        console.error(
                            "No se pudo actualizar el chat activo:",
                            error
                        );
                    });

                    return;
                }

                if (!isDirectChatMode) {
                    await refreshChats({
                        numeroAsesor:
                            numeroLinea,
                    }).catch((error) => {
                        console.error(
                            "No se pudo actualizar la lista por nuevo mensaje:",
                            error
                        );
                    });
                }
            };

        window.addEventListener(
            "whatsapp:nuevo-mensaje",
            onNuevoMensaje
        );

        return () => {
            window.removeEventListener(
                "whatsapp:nuevo-mensaje",
                onNuevoMensaje
            );
        };
    }, [
        isDirectChatMode,
        numeroAsesorActivo,
    ]);

    useEffect(() => {
        let ignore = false;

        if (isDirectChatMode) {
            setLoadingList(false);

            return () => {
                ignore = true;
            };
        }

        if (!numeroAsesorActivo) {
            return () => {
                ignore = true;
            };
        }

        (async () => {
            try {
                setLoadingList(true);

                await refreshChats({
                    numeroAsesor:
                        numeroAsesorActivo,
                    allowEmpty: true,
                });
            } catch (error) {
                console.error(
                    "No se pudo actualizar la lista de chats:",
                    error
                );
            } finally {
                if (!ignore) {
                    setLoadingList(false);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, [
        isDirectChatMode,
        numeroAsesorActivo,
    ]);

    useEffect(() => {
        if (didInitSelection.current) return;

        if (tel) {
            didInitSelection.current = true;
            activeTelRef.current = tel;
            setActiveTel(tel);
            setMobileView("chat");
            localStorage.setItem("last_active_chat", tel);
            return;
        }

        if (!isDirectChatMode && chats.length) {
            const last = normalizaTelefonoMx(localStorage.getItem("last_active_chat") || "");
            const initialTel = last && chats.some(c => c.telefono === last)
                ? last
                : chats[0].telefono;

            didInitSelection.current = true;
            activeTelRef.current = initialTel;
            setActiveTel(initialTel);
        }
    }, [tel, chats, isDirectChatMode]);

    useEffect(() => {
        setShowProspectoPanel(false);
        setOpenEmoji(false);
        setShowQuickBubblesDropdown(false);
        setShowTemplatesDropdown(false);

        if (!activeTel) {
            setProspecto(null);
            setMensajes([]);
            setChatHasMore(false);
            setOldestMessageId(null);
            return;
        }

        cargarChatInicial(activeTel);
    }, [activeTel, isDirectChatMode]);

    useEffect(() => {
        let ignore = false;
        if (isDirectChatMode) return;
        (async () => {
            try {
                const data =
                    await api.digitalesListProspectos({
                        numero_asesor:
                            numeroAsesorActivo,
                    });
                if (ignore) return; setProspectosIndex(Array.isArray(data) ? data : []);
            }
            catch (error) {
                console.error(
                    "Error cargando índice de prospectos:",
                    error
                );
            }
        })();
        return () => { ignore = true; };
    }, [isDirectChatMode, numeroAsesorActivo,]);
    useEffect(() => {
        let alive = true, timer = null, tickCount = 0;
        const tick = async () => {
            try {
                const target = activeTelRef.current;
                if (!target) { timer = setTimeout(tick, 3500); return; }
                const prev = mensajesRef.current || [], last = prev[prev.length - 1];
                const lastId = last?.id || last?.wa_message_id || "", lastCreatedAt = last?.created_at || "";
                if (!lastId && !lastCreatedAt) { timer = setTimeout(tick, 3500); return; }
                const data = await api.digitalesContactoUpdates(
                    target,
                    lastCreatedAt,
                    {
                        limit: CHAT_UPDATES_LIMIT,
                        after_id: lastId,
                        numero_asesor: numeroAsesorActivo,
                    }
                );
                if (!alive) return;
                if (activeTelRef.current !== target) {
                    timer = setTimeout(tick, 3500);
                    return;
                }
                const incoming = (Array.isArray(data?.mensajes) ? data.mensajes : []).map(normalizeMessage);
                if (incoming.length) {
                    shouldStickToBottomRef.current = isNearBottom(messagesScrollRef.current);
                    setMensajes(old => mergeMessages(old, incoming));
                    if (!isDirectChatMode) await refreshChats().catch(() => { });
                } else {
                    tickCount += 1;
                    if (!isDirectChatMode && tickCount % 5 === 0) await refreshChats().catch(() => { });
                }
            } catch { }
            timer = setTimeout(tick, 3500);
        };
        tick();
        return () => { alive = false; if (timer) clearTimeout(timer); };
    }, [isDirectChatMode]);

    const llamarProspecto = () => {
        if (!activeTel) { alert("Selecciona un chat primero"); return; }
        window.open(`https://wa.me/${activeTel}`, "_blank");
    };

    const perfilProspectoCampos = [
        quickEditDraft.auto_interes,
        quickEditDraft.estado,
        quickEditDraft.canal_contacto,
        quickEditDraft.enganche_monto,
        quickEditDraft.presupuesto_mensual,
        quickEditDraft.buro_estado,
        quickEditDraft.forma_pago,
        quickEditDraft.tipo_cliente,
        quickEditDraft.plazo_compra,
        quickEditDraft.uso_vehiculo,
        quickEditDraft.comprobacion_ingresos,
        quickEditDraft.comentarios,
    ];

    const perfilProspectoCompletados = perfilProspectoCampos.filter(
        (value) => String(value ?? "").trim() !== ""
    ).length;

    const perfilProspectoPorcentaje = Math.round(
        (perfilProspectoCompletados / perfilProspectoCampos.length) * 100
    );

    const perfilProspectoPendientes =
        perfilProspectoCampos.length - perfilProspectoCompletados;

    const perfilComplementarioPendientes = [
        quickEditDraft.forma_pago,
        quickEditDraft.tipo_cliente,
        quickEditDraft.uso_vehiculo,
        quickEditDraft.comprobacion_ingresos,
        quickEditDraft.comentarios,
    ].filter((value) => String(value ?? "").trim() === "").length;

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="w-full min-w-0">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">

                <div className={cls(
                    "grid min-h-0 h-[calc(90dvh-64px)] overflow-hidden transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isDirectChatMode
                        ? (activeTel
                            ? (showProspectoPanel
                                ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px]"
                                : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_48px]")
                            : "grid-cols-1")
                        : chatSidebarCollapsed
                            ? (activeTel
                                ? (showProspectoPanel
                                    ? "grid-cols-1 lg:grid-cols-[58px_minmax(0,1fr)] xl:grid-cols-[58px_minmax(0,1fr)_390px]"
                                    : "grid-cols-1 lg:grid-cols-[58px_minmax(0,1fr)] xl:grid-cols-[58px_minmax(0,1fr)_48px]")
                                : "grid-cols-1 lg:grid-cols-[58px_minmax(0,1fr)]")
                            : (activeTel
                                ? (showProspectoPanel
                                    ? "grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_390px]"
                                    : "grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_48px]")
                                : "grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]")
                )}>

                    {/* ── SIDEBAR DE CHATS ──────────────────────────────────── */}
                    <aside className={cls(
                        "min-h-0 border-r border-slate-200 bg-[#F6F8FC] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isDirectChatMode ? "hidden" : mobileView === "chat" ? "hidden lg:flex lg:flex-col" : "flex flex-col lg:flex lg:flex-col",
                    )}>
                        {chatSidebarCollapsed ? (
                            <div className="hidden h-full flex-col items-center gap-3 bg-white py-3 lg:flex">
                                <button onClick={() => setChatSidebarCollapsed(false)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#131E5C] shadow-sm transition hover:scale-105 hover:border-[#1746D1]/40 hover:text-[#1746D1]"
                                    title="Expandir chats" type="button">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <div className="h-px w-8 bg-slate-200" />
                                <div className="rotate-90 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider text-[#131E5C]/60">Chats</div>
                            </div>
                        ) : (
                            <>
                                {/* Barra superior del sidebar */}
                                <div className="border-b border-slate-200 bg-white px-3 pt-3 pb-2 shrink-0">
                                    <div className="mb-2.5 flex items-center justify-between gap-2">
                                        <button onClick={() => navigate("/comercial/prospectos")}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-extrabold text-[#131E5C] shadow-sm transition hover:border-[#1746D1]/40 hover:text-[#1746D1]"
                                            title="Volver" type="button">
                                            <ArrowLeft className="h-4 w-4" />Volver
                                        </button>
                                        <button onClick={() => setChatSidebarCollapsed(true)}
                                            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#131E5C] shadow-sm transition hover:border-[#1746D1]/40 hover:text-[#1746D1] lg:inline-flex"
                                            title="Contraer" type="button">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {/* Búsqueda */}
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-[#1746D1]/50 focus-within:ring-2 focus-within:ring-[#1746D1]/10">
                                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                        <input value={q} onChange={(e) => setQ(e.target.value)}
                                            placeholder="Buscar prospecto…"
                                            className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400" />
                                        {q ? (<button type="button" onClick={() => setQ("")} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>) : null}
                                    </div>

                                    {numerosDisponibles.length > 0 ? (
                                        <div className="mb-2 p-2">
                                            <select
                                                value={numeroAsesorActivo}
                                                onChange={(event) =>
                                                    cambiarNumeroAsesor(event.target.value)
                                                }
                                                disabled={!ready || numerosDisponibles.length === 0}
                                                className="h-9 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                            >
                                                {numerosDisponibles.map((numero) => (
                                                    <option key={numero} value={numero}>
                                                        {obtenerEtiquetaLinea(numero)} · {formateaTelUi(numero)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                                            Este usuario no tiene líneas de WhatsApp asignadas.
                                        </div>
                                    )}

                                    {/* Filtros con scroll horizontal */}
                                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                                        {CHAT_FILTERS.map((f) => (
                                            <button key={f.key} onClick={() => setChatFilter(f.key)}
                                                className={cls(
                                                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-extrabold transition whitespace-nowrap",
                                                    chatFilter === f.key
                                                        ? "border-[#131E5C] bg-[#131E5C] text-white shadow-sm"
                                                        : "border-slate-200 bg-white text-slate-500 hover:border-[#1746D1]/40 hover:text-[#1746D1]"
                                                )}
                                                type="button">
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lista de chats estilo WhatsApp */}
                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                    {loadingList ? <ChatListSkeleton rows={9} /> : filteredChats.length ? (
                                        filteredChats.map((chat) => {
                                            const isActive = chat.telefono === activeTel;

                                            const asesorVisual = getAsesorVisual(
                                                chat.asesor_digital,
                                                chat.usuario_crm_asignado
                                            );

                                            return (
                                                <button key={chat.id}
                                                    onMouseEnter={() => prefetchChat(chat.telefono)}
                                                    onFocus={() => prefetchChat(chat.telefono)}
                                                    onClick={() => openChatByTel(chat.telefono)}
                                                    onContextMenu={(e) => abrirMenuChat(e, chat)}
                                                    className={cls(
                                                        "group relative w-full border-b border-black/5 px-4 py-3 text-left transition",
                                                        isActive
                                                            ? "bg-[#1746D1]/10 shadow-[inset_3px_0_0_0_#1746D1]"
                                                            : "bg-neutral-50 hover:bg-white",
                                                    )}
                                                    style={
                                                        puedeVerAsignacion
                                                            ? {
                                                                borderLeft: `3px solid ${asesorVisual.color}`,
                                                            }
                                                            : undefined
                                                    }
                                                    type="button">
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar con dot de estado */}
                                                        <div className="relative shrink-0">
                                                            <Avatar name={chat.nombre} size="lg" />
                                                            <span
                                                                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white"
                                                                style={{ backgroundColor: getStatusDotColor(chat.estado) }}
                                                                title={chat.estado || "Sin respuesta"}
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            {/* Fila 1: nombre + hora */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-1.5">
                                                                    <div className="truncate text-sm font-extrabold text-[#131E5C] leading-tight">{chat.nombre}</div>
                                                                    {puedeVerAsignacion ? (
                                                                        <span
                                                                            className={cls(
                                                                                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold leading-tight",
                                                                                asesorVisual.className
                                                                            )}
                                                                            title={
                                                                                chat.asesor_digital
                                                                                    ? `Prospecto asignado a ${chat.asesor_digital}`
                                                                                    : "Prospecto todavía sin asesor asignado"
                                                                            }
                                                                        >
                                                                            <UserRound className="h-2.5 w-2.5" />

                                                                            {asesorVisual.nombreCorto}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="shrink-0 text-[11px] font-semibold text-slate-400 leading-tight">
                                                                    {chat.last?.timestamp ? formatearFechaConDia(chat.last.timestamp) : chat.last?.time || ""}
                                                                </div>
                                                            </div>

                                                            {/* Fila 2: último mensaje + badge unread */}
                                                            <div className="mt-0.5 flex items-center justify-between gap-2">
                                                                <div className={cls("truncate text-xs font-medium", isActive ? "text-[#131E5C]/80" : "text-slate-500")}>{chat.last?.text || formateaTelUi(chat.telefono)}</div>
                                                                {chat.unread > 0 ? (
                                                                    <span className="ml-1 shrink-0 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1746D1] px-1.5 text-[11px] font-extrabold text-white shadow-sm">
                                                                        {chat.unread}
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            {/* Fila 3: badges */}
                                                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                                                <span className={cls(
                                                                    "inline-flex items-center rounded-full border bg-white px-2 py-0.5 text-[10px] font-bold leading-tight",
                                                                    chat.estado ? "border-[#131E5C]/15 text-[#131E5C]/70" : "border-slate-200 text-slate-400",
                                                                )}>
                                                                    {chat.estado || "Sin estado"}
                                                                </span>

                                                                {(chat.ia_estado || chat.ia_pausada || chat.ia_bloqueos?.length) ? (
                                                                    <span className={cls(
                                                                        "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-extrabold leading-tight",
                                                                        chat.ia_estado?.puede_responder ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800",
                                                                    )}
                                                                        title={(chat.ia_bloqueos || chat.ia_estado?.bloqueos || []).map(labelBloqueoIa).join(" · ")}>
                                                                        <Zap className="h-2.5 w-2.5" />
                                                                        {chat.ia_estado?.puede_responder ? "IA lista" : "IA bloqueada"}
                                                                    </span>
                                                                ) : null}

                                                                {chat.agencia ? (
                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-400">
                                                                        <Building2 className="h-2.5 w-2.5" />{chat.agencia}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 text-center text-sm font-extrabold text-[#131E5C]">Sin historial aún</div>
                                    )}
                                </div>
                            </>
                        )}
                    </aside>

                    {/* ── SECCIÓN PRINCIPAL DEL CHAT ────────────────────────── */}
                    <section className={cls(
                        "relative flex min-h-0 flex-col bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isDirectChatMode ? "flex" : mobileView === "list" ? "hidden lg:flex" : "flex",
                    )}>

                        {/* ── HEADER COMPACTO ─────────────────────────────────── */}
                        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(19,30,92,0.04)] sm:px-4">
                            <div
                                onClick={activeTel ? () => setShowProspectoPanel((prev) => !prev) : undefined}
                                role={activeTel ? "button" : undefined}
                                tabIndex={activeTel ? 0 : undefined}
                                onKeyDown={activeTel ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setShowProspectoPanel((prev) => !prev);
                                    }
                                } : undefined}
                                aria-expanded={activeTel ? showProspectoPanel : undefined}
                                aria-label="Perfil del prospecto"
                                className={cls(
                                    "flex flex-nowrap items-center gap-2 rounded-xl px-1 -mx-1 py-0.5 transition select-none",
                                    activeTel ? "cursor-pointer hover:bg-[#131E5C]/[0.04]" : ""
                                )}
                                title={activeTel ? (showProspectoPanel ? "Ocultar perfil del prospecto" : "Ver perfil del prospecto") : undefined}
                            >
                                {/* Botón volver mobile */}
                                {!isDirectChatMode ? (
                                    <button onClick={(e) => { e.stopPropagation(); setMobileView("list"); }}
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#131E5C] shadow-sm hover:border-[#1746D1]/40 hover:text-[#1746D1] lg:hidden"
                                        type="button" title="Ver chats">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                ) : null}

                                <Avatar name={activeChat?.nombre || "Prospecto"} size="lg" />

                                {/* Centro: nombre + teléfono + estado + pauta en una sola fila, fechas debajo */}
                                <div className="min-w-0 flex-1">
                                    {/* Fila 1: nombre + teléfono + estado (todo en línea, overflow hidden) */}
                                    <div className="flex flex-nowrap items-center gap-1">
                                        {editingNombre ? (
                                            <input
                                                ref={nombreInputRef}
                                                value={nombreDraft}
                                                onChange={(e) => setNombreDraft(e.target.value)}
                                                onKeyDown={(e) => { e.stopPropagation(); onNombreKeyDown(e); }}
                                                onBlur={guardarNombre}
                                                disabled={savingNombre}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-7 w-[140px] shrink-0 rounded-md border border-[#131E5C]/30 bg-white px-2 text-sm font-extrabold text-[#131E5C] outline-none focus:border-[#131E5C]/60 sm:w-[180px]"
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); iniciarEdicionNombre(); }}
                                                disabled={!activeTel}
                                                title="Editar nombre del cliente"
                                                className="group inline-flex min-w-0 items-center gap-1 rounded px-0.5 py-0.5 text-left hover:bg-neutral-100 disabled:cursor-default disabled:hover:bg-transparent"
                                            >
                                                <span className="truncate text-sm font-extrabold text-[#131E5C]">
                                                    {activeChat?.nombre || "Selecciona un chat"}
                                                </span>
                                                {activeTel ? (
                                                    <Pencil className="h-2.5 w-2.5 shrink-0 text-slate-300 group-hover:text-[#131E5C]/60 transition" />
                                                ) : null}
                                            </button>
                                        )}
                                        <span
                                            className={cls(
                                                "inline-flex h-7 shrink-0 select-none items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold shadow-sm",
                                                showProspectoPanel
                                                    ? "border-[#1746D1]/50 bg-[#1746D1]/10 text-[#1746D1]"
                                                    : "border-slate-200 bg-white text-[#131E5C]"
                                            )}
                                            title={showProspectoPanel ? "Perfil del prospecto abierto" : "Número de teléfono"}
                                        >
                                            <span className="truncate">{activeTel ? formateaTelUi(activeTel) : "—"}</span>
                                            {copiedTel ? (
                                                <Check className="h-3 w-3 shrink-0 text-emerald-500" title="Copiado" />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); copyTel(); }}
                                                    className="shrink-0 text-slate-400 transition group-hover:text-[#1746D1]"
                                                    title="Copiar número"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            )}
                                        </span>
                                        {/* Estado prospecto */}
                                        {activeTel &&
                                            String(headerEstado || "").toLowerCase() === "descalificado" ? (
                                            <select
                                                value={
                                                    quickEditDraft.motivo_descalificacion || ""
                                                }
                                                onChange={(e) =>
                                                    saveHeaderMotivo(e.target.value)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-6 min-w-0 max-w-[180px] rounded-md border border-red-200 bg-red-50 px-1.5 text-[11px] font-semibold text-red-700 outline-none focus:border-red-400"
                                                title="Motivo de descalificación"
                                            >
                                                {renderOptionsConValorActual(
                                                    MOTIVOS_DESCALIFICACION,
                                                    quickEditDraft.motivo_descalificacion,
                                                    "Selecciona el motivo…"
                                                )}
                                            </select>
                                        ) : null}
                                    </div>

                                    {/* Fila 2: fechas */}
                                    {activeTel && !isDirectChatMode ? (
                                        <div className="mt-px truncate text-[9px] font-semibold text-slate-400">
                                            Reg: {fmtDT(prospecto?.creado)} · 1er: {fmtDT(prospecto?.primer_contacto_at)} · Últ: {fmtDT(prospecto?.ultimo_contacto_at)}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* ── ÁREA DE MENSAJES ──────────────────────────────────── */}
                        <div
                            ref={messagesScrollRef}
                            onScroll={onMessagesScroll}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 lg:px-8"
                            style={{
                                backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.84), rgba(255,255,255,0.7)),
                                url('/crm/chat/fondo_chat.png')
                                `,
                                backgroundRepeat: "repeat",
                                backgroundPosition: "center top",
                                backgroundSize: "520px auto",
                            }}
                        >
                            <div className="mx-auto w-full max-w-5xl space-y-3">
                                {activeTel && !loadingChat ? (
                                    <div className="mb-3 flex justify-center">
                                        {loadingOlder ? (
                                            <div className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-extrabold text-slate-500 shadow-sm">Cargando mensajes anteriores...</div>
                                        ) : chatHasMore ? (
                                            <button onClick={cargarMensajesAnteriores}
                                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-[#131E5C] shadow-sm transition hover:border-[#1746D1]/40 hover:text-[#1746D1]"
                                                type="button">Cargar mensajes anteriores</button>
                                        ) : mensajes.length > 0 ? (
                                            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-400 shadow-sm">Inicio de la conversación</div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {!activeTel ? (
                                    <div className="py-10 text-center font-semibold text-slate-500">Selecciona un chat del historial para ver la conversación.</div>
                                ) : loadingChat ? (
                                    <MessagesSkeleton bubbles={10} />
                                ) : mensajes.length === 0 ? (
                                    <div className="py-10 text-center font-semibold text-slate-500">Aún no hay mensajes con este número.</div>
                                ) : (
                                    // Agrupar mensajes por fecha y mostrar separadores
                                    groupMessagesByDate(applyReactionEvents(mensajes)).map((group, groupIndex) => (
                                        <div key={`group-${groupIndex}-${group.date}`} className="relative">
                                            <DateSeparator date={group.date} />
                                            {group.messages.map((message) => {
                                                const messageId = message.wa_message_id || "";
                                                const messageKey = getMessageKey(message);
                                                const domId = `msg-${messageKey}`;
                                                const quoted = message.reply_to_id ? messagesById.get(String(message.reply_to_id)) : null;
                                                const mostrarPautaOrigen = Boolean(
                                                    pautaOrigenMarker?.messageKey &&
                                                    pautaOrigenMarker.messageKey === messageKey
                                                );
                                                // Usar formato de hora corta para la burbuja
                                                const timeDisplay = formatMessageTime(message.created_at || message.local_created_at);
                                                return (
                                                    <MessageBubble
                                                        key={getMessageKey(message)}
                                                        domId={domId}
                                                        highlighted={highlightedMsgId === domId}
                                                        mine={Boolean(message.mine)}
                                                        text={message.text}
                                                        time={timeDisplay}
                                                        status={message.status || "sent"}
                                                        localPending={Boolean(message.local_pending)}
                                                        attachments={message.attachments || []}
                                                        reactions={message.reactions || []}
                                                        isAi={Boolean(message.is_ai)}
                                                        originPreview={mostrarPautaOrigen ? pautaOrigenMarker : null}
                                                        renderText={renderTextForBubble}
                                                        replyPreview={quoted ? {
                                                            author: getReplyAuthor(quoted),
                                                            text: getReplyPreview(quoted),
                                                            onClick: () => scrollToMessage(`msg-${getMessageKey(quoted)}`)
                                                        } : null}
                                                        onReply={messageId && !message.local_pending ? () => {
                                                            setReplyToMsg(message);
                                                            setDraftOwnerTel(activeTelRef.current);
                                                            requestAnimationFrame(() => inputRef.current?.focus?.());
                                                        } : null}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                                <div ref={endRef} />
                            </div>
                        </div>

                        {/* ── REPLY PREVIEW ─────────────────────────────────────── */}
                        {replyToMsg ? (
                            <div className="shrink-0 border-t border-slate-200 bg-[#131E5C]/5 px-4 py-2">
                                <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-xl border border-[#1746D1]/20 bg-white px-3 py-2 shadow-sm">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#1746D1]">Respondiendo a {getReplyAuthor(replyToMsg)}</div>
                                        <div className="truncate text-xs font-semibold text-[#131E5C]">{getReplyPreview(replyToMsg)}</div>
                                    </div>
                                    <button type="button" onClick={() => setReplyToMsg(null)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                        title="Cancelar respuesta">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* ── COMPOSITOR ───────────────────────────────────────── */}
                        <div className={cls("shrink-0 border-t border-black/10 bg-white px-3 py-3", dragOver ? "relative" : "")}
                            onDragEnter={onDragEnterComposer} onDragOver={onDragOverComposer}
                            onDragLeave={onDragLeaveComposer} onDrop={onDropComposer}>
                            <div className="mx-auto w-full max-w-5xl">
                                {dragOver && activeTel ? (
                                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                        <div className="rounded-2xl border border-dashed border-[#131E5C]/40 bg-white px-6 py-4 shadow-lg">
                                            <div className="flex items-center gap-3"><Paperclip className="h-5 w-5 text-[#131E5C]" /><div className="text-sm font-extrabold text-[#131E5C]">Suelta para adjuntar archivos</div></div>
                                            <div className="mt-1 text-xs font-semibold text-slate-500">Se adjuntarán al mensaje, máximo 10.</div>
                                        </div>
                                    </div>
                                ) : null}

                                {recordingError ? (
                                    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                        <span>
                                            {recordingError}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setRecordingError("")
                                            }
                                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-red-100"
                                            title="Cerrar"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : null}

                                {isRecording ? (
                                    <div className="mb-2 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 shadow-sm">
                                        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />

                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-extrabold text-red-700">
                                                Grabando nota de voz
                                            </div>

                                            <div className="text-[11px] font-semibold text-red-500">
                                                {formatAudioTime(
                                                    recordingSeconds
                                                )}
                                                {" / "}
                                                {formatAudioTime(
                                                    MAX_RECORDING_SECONDS
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={cancelarGrabacionAudio}
                                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2 text-xs font-extrabold text-red-600 hover:bg-red-100"
                                            title="Cancelar grabación"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Cancelar
                                        </button>

                                        <button
                                            type="button"
                                            onClick={detenerGrabacionAudio}
                                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2 text-xs font-extrabold text-white hover:bg-red-700"
                                            title="Detener y adjuntar"
                                        >
                                            <Square className="h-3.5 w-3.5 fill-current" />
                                            Detener
                                        </button>
                                    </div>
                                ) : null}

                                {/* Previews adjuntos */}
                                {attachments.length ? (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {attachments.map((a) => (
                                            <div key={a.id} className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2">
                                                {a.kind === "image" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-black/10 bg-white">
                                                            <img
                                                                src={a.previewUrl}
                                                                alt={a.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-[#131E5C]">
                                                                {a.name
                                                                    ? shortName(a.name)
                                                                    : "Imagen"}
                                                            </div>

                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                {humanBytes(a.size)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                ) : a.kind === "audio" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#131E5C]/10 text-[#131E5C]">
                                                            <Mic className="h-4 w-4" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-[#131E5C]">
                                                                Nota de voz
                                                            </div>

                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                {humanBytes(a.size)}
                                                                {" · "}
                                                                se convertirá a OGG/Opus
                                                            </div>
                                                        </div>
                                                    </div>

                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#131E5C]/10 text-[#131E5C]">
                                                            <FileText className="h-4 w-4" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="max-w-[180px] truncate text-xs font-extrabold text-[#131E5C]">
                                                                {a.name
                                                                    ? shortName(a.name)
                                                                    : "Archivo"}
                                                            </div>

                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                {humanBytes(a.size)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <button type="button" onClick={() => removeAttachment(a.id)} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white hover:bg-neutral-100" title="Quitar"><X className="h-4 w-4 text-[#131E5C]" /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                {/* Caja compositor */}
                                <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
                                    <div className="px-2 pt-2">
                                        <WhatsAppComposerInput
                                            value={draftMsg}
                                            onChange={updateDraftMessage}
                                            onSend={enviarMensaje}
                                            disabled={
                                                !activeTel
                                                || clienteBloqueado
                                                || isRecording
                                            }
                                            placeholder={
                                                isRecording
                                                    ? "Grabando nota de voz…"
                                                    : composerHint
                                            }
                                            inputRef={inputRef}
                                            onPaste={onPasteInComposer}
                                        />
                                    </div>

                                    {/* Barra de botones */}
                                    <div className="flex flex-wrap items-center gap-0.5 px-2 pb-2 pt-1">
                                        {/* Emoji */}
                                        <div className="relative" ref={emojiRef}>
                                            <button className={cls("inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition", !activeTel ? "cursor-not-allowed opacity-50" : "")}
                                                title="Emojis" type="button" disabled={!activeTel}
                                                onClick={() => {
                                                    setOpenEmoji(prev => !prev);
                                                    setShowTemplatesDropdown(false);
                                                    setShowQuickBubblesDropdown(false);
                                                }}>
                                                <Smile className="h-4 w-4" />
                                            </button>
                                            {openEmoji ? (
                                                <div className="fixed inset-x-3 bottom-[92px] z-[80] w-auto overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-10 sm:left-0 sm:w-[320px]">
                                                    <EmojiPicker onEmojiClick={onPickEmoji} searchDisabled={false} skinTonesDisabled={false} lazyLoadEmojis height={360} width="100%" />
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Adjuntar */}
                                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { addFilesAsAttachments(e.target.files); e.target.value = ""; }} />
                                        <button
                                            className={cls(
                                                "inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                                (
                                                    !activeTel
                                                    || isRecording
                                                )
                                                    ? "cursor-not-allowed opacity-50"
                                                    : ""
                                            )}
                                            title="Adjuntar"
                                            type="button"
                                            disabled={
                                                !activeTel
                                                || isRecording
                                            }
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </button>
                                        {/* Nota de voz */}
                                        <button
                                            className={cls(
                                                "inline-flex h-8 w-8 items-center justify-center rounded-xl transition",

                                                isRecording
                                                    ? "bg-red-100 text-red-600"
                                                    : "text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C]",

                                                (
                                                    !activeTel
                                                    || clienteBloqueado
                                                )
                                                    ? "cursor-not-allowed opacity-50"
                                                    : "",
                                            )}
                                            title={
                                                isRecording
                                                    ? "Detener grabación"
                                                    : "Grabar nota de voz"
                                            }
                                            type="button"
                                            disabled={
                                                !activeTel
                                                || clienteBloqueado
                                            }
                                            onClick={
                                                isRecording
                                                    ? detenerGrabacionAudio
                                                    : iniciarGrabacionAudio
                                            }
                                        >
                                            {isRecording ? (
                                                <Square className="h-3.5 w-3.5 fill-current" />
                                            ) : (
                                                <Mic className="h-4 w-4" />
                                            )}
                                        </button>

                                        {/* Plantillas — dropdown igual que mensajes rápidos */}
                                        <div className="relative" ref={templatesDropdownRef}>
                                            <button onClick={abrirPlantillasDropdown} disabled={!activeTel || clienteBloqueado || sendingTemplate}
                                                className={cls(
                                                    "inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                                    (!activeTel || clienteBloqueado || sendingTemplate) ? "cursor-not-allowed opacity-50" : "",
                                                    showTemplatesDropdown ? "bg-neutral-100 text-[#131E5C]" : ""
                                                )}
                                                type="button" title="Plantillas">
                                                <LayoutTemplate className="h-4 w-4" />
                                                <span className="hidden sm:inline">Plantillas</span>
                                            </button>

                                            {showTemplatesDropdown ? (
                                                <div className="fixed inset-x-3 bottom-[92px] z-[80] max-h-[calc(100dvh-120px)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-12 sm:left-0 sm:w-[min(24rem,calc(100vw-2rem))]">
                                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            {tplSelected ? (
                                                                <button type="button" onClick={() => { setTplSelected(null); setTplDraft({}); setTemplatesError(""); }} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
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

                                                    <div className="max-h-[calc(100dvh-180px)] overflow-y-auto sm:max-h-80">
                                                        {!tplSelected ? (
                                                            // Lista de plantillas
                                                            loadingTemplates ? (
                                                                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">Cargando plantillas...</div>
                                                            ) : templatesError ? (
                                                                <div className="m-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{templatesError}</span></div>
                                                            ) : templatesDisponibles.length === 0 ? (
                                                                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">No hay plantillas disponibles.</div>
                                                            ) : (
                                                                templatesDisponibles.map((template) => (
                                                                    <button key={`${template.key}-${template.idioma || template.language || "x"}`} type="button" onClick={() => pickTemplate(template)}
                                                                        className="w-full border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-neutral-50 transition">
                                                                        <div className="text-xs font-extrabold text-[#131E5C]">{template.title || template.key}</div>
                                                                        <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{template.key} · {template.idioma || template.language || "es_MX"} · {template.category || "Sin categoría"}</div>
                                                                        {template.help ? <div className="mt-1 truncate text-[11px] text-slate-500">{template.help}</div> : null}
                                                                    </button>
                                                                ))
                                                            )
                                                        ) : (
                                                            // Detalle de plantilla seleccionada
                                                            <div className="p-4 space-y-3">
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
                                                                                    {field.friendlyLabel ||
                                                                                        getFriendlyTemplateFieldLabel(field)}
                                                                                    <span className="ml-1 text-red-600">*</span>
                                                                                </div>

                                                                                <span className="text-[10px] font-semibold text-slate-400">
                                                                                    Obligatorio
                                                                                </span>
                                                                            </div>
                                                                            {options.length ? (
                                                                                <select
                                                                                    value={tplDraft[field.key] || ""}
                                                                                    onChange={(event) => {
                                                                                        setTplDraft((current) => ({
                                                                                            ...current,
                                                                                            [field.key]: event.target.value,
                                                                                        }));

                                                                                        setTemplatesError("");
                                                                                    }}
                                                                                    aria-required="true"
                                                                                    className={cls(
                                                                                        "w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none transition",
                                                                                        !String(tplDraft[field.key] || "").trim()
                                                                                            ? "border-red-200 focus:border-red-400"
                                                                                            : "border-black/10 focus:border-[#131E5C]/40"
                                                                                    )}
                                                                                >
                                                                                    <option value="" disabled>
                                                                                        Selecciona un valor…
                                                                                    </option>

                                                                                    {options.map((option) => (
                                                                                        <option key={option} value={option}>
                                                                                            {option}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            ) : (
                                                                                <input
                                                                                    value={tplDraft[field.key] || ""}
                                                                                    onChange={(event) => {
                                                                                        setTplDraft((current) => ({
                                                                                            ...current,
                                                                                            [field.key]: event.target.value,
                                                                                        }));

                                                                                        setTemplatesError("");
                                                                                    }}
                                                                                    placeholder="Escribe el dato que se enviará"
                                                                                    aria-required="true"
                                                                                    className={cls(
                                                                                        "w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none transition",
                                                                                        !String(tplDraft[field.key] || "").trim()
                                                                                            ? "border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                                                                            : "border-black/10 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10"
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
                                                                    disabled={
                                                                        sendingTemplate ||
                                                                        incompleteTemplateFields.length > 0
                                                                    }
                                                                    className="w-full rounded-xl py-2.5 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    style={{ backgroundColor: BRAND_BLUE }}
                                                                >
                                                                    {sendingTemplate
                                                                        ? "Enviando plantilla..."
                                                                        : incompleteTemplateFields.length > 0
                                                                            ? `Completa ${incompleteTemplateFields.length} dato${incompleteTemplateFields.length === 1
                                                                                ? ""
                                                                                : "s"
                                                                            }`
                                                                            : "Enviar plantilla"}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Mensajes rápidos — dropdown */}
                                        <div className="relative" ref={quickBubblesDropdownRef}>
                                            <button type="button" disabled={!activeTel}
                                                onClick={() => {
                                                    setShowQuickBubblesDropdown(prev => !prev);
                                                    setShowTemplatesDropdown(false);
                                                    setOpenEmoji(false);
                                                }}
                                                className={cls(
                                                    "inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-extrabold text-slate-400 hover:bg-neutral-100 hover:text-[#131E5C] transition",
                                                    !activeTel ? "cursor-not-allowed opacity-50" : "",
                                                    showQuickBubblesDropdown ? "bg-neutral-100 text-[#131E5C]" : ""
                                                )}
                                                title="Respuesta rápida">
                                                <Zap className="h-4 w-4" />
                                                <span className="hidden sm:inline">Rápidos</span>
                                            </button>

                                            {showQuickBubblesDropdown ? (
                                                <div className="fixed inset-x-3 bottom-[92px] z-[80] max-h-[calc(100dvh-120px)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-12 sm:left-0 sm:w-72">
                                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                                        <span className="text-xs font-extrabold text-[#131E5C]">Mensajes rápidos</span>
                                                        <div className="flex items-center gap-1">
                                                            <button type="button" onClick={() => { setEditingBubbleId(null); setNewBubbleTitle(""); setNewBubbleText(""); setShowAddBubble(p => !p); }}
                                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#131E5C]/10 text-[#131E5C] hover:bg-[#131E5C] hover:text-white transition"
                                                                title="Nuevo mensaje rápido">
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button type="button" onClick={() => setShowQuickBubblesDropdown(false)}
                                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {showAddBubble ? (
                                                        <div className="border-b border-black/5 bg-neutral-50 p-3">
                                                            <input value={newBubbleTitle} onChange={(e) => setNewBubbleTitle(e.target.value)} placeholder="Título (opcional)"
                                                                className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#131E5C] outline-none placeholder:text-slate-400" />
                                                            <textarea value={newBubbleText} onChange={(e) => setNewBubbleText(e.target.value)} placeholder="Escribe el mensaje…" rows={2}
                                                                className="mb-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#131E5C] outline-none placeholder:text-slate-400" />
                                                            <div className="flex justify-end gap-2">
                                                                <button type="button" onClick={() => { setShowAddBubble(false); setNewBubbleText(""); setNewBubbleTitle(""); setEditingBubbleId(null); }}
                                                                    className="rounded-lg border border-black/10 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-neutral-100">Cancelar</button>
                                                                <button type="button" onClick={editingBubbleId ? updateQuickBubble : addQuickBubble} disabled={!newBubbleText.trim()}
                                                                    className="rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                                                                    style={{ backgroundColor: BRAND_BLUE }}>{editingBubbleId ? "Actualizar" : "Guardar"}</button>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <div className="max-h-56 overflow-y-auto">
                                                        {quickBubbles.length === 0 ? (
                                                            <div className="px-4 py-5 text-center text-xs font-semibold text-slate-400">Sin mensajes rápidos aún.<br />Agrega uno con el botón +</div>
                                                        ) : (
                                                            quickBubbles.map((bubble) => (
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
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex-1" />

                                        {/* Cancelar edición */}
                                        {activeTel && editingMsgId ? (
                                            <button type="button" onClick={() => { setEditingMsgId(null); setDraftMsg(""); }}
                                                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#131E5C] hover:bg-neutral-50">
                                                Cancelar edición
                                            </button>
                                        ) : null}

                                        {/* Enviar */}
                                        <button
                                            onClick={enviarMensaje}
                                            disabled={isRecording || !activeTel || (!draftMsg.trim() && attachments.length === 0)
                                            }
                                            className={cls(
                                                "inline-flex h-8 items-center gap-1 rounded-xl px-3 text-xs font-extrabold text-white shadow-sm transition",
                                                isRecording || !activeTel || (!draftMsg.trim() && attachments.length === 0) ? "cursor-not-allowed bg-slate-300" : "hover:opacity-90")}
                                            style={{
                                                backgroundColor: isRecording || !activeTel || (!draftMsg.trim() && attachments.length === 0) ? undefined : BRAND_BLUE
                                            }}
                                            title="Enviar" type="button">
                                            <Send className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Enviar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                        {activeTel && showProspectoPanel ? (
                            <button
                                type="button"
                                aria-label="Cerrar perfil del prospecto"
                                onClick={() => setShowProspectoPanel(false)}
                                className="fixed inset-0 z-[80] bg-black/25 backdrop-blur-[1px] xl:hidden"
                            />
                        ) : null}

                        {/* ── PERFIL DEL PROSPECTO (solo rediseño visual) ─────── */}
                        {activeTel ? (
                            <aside className={cls(
                                "min-h-0 flex-col border-l border-slate-200 bg-[#F6F8FC]",
                                showProspectoPanel
                                    ? "fixed inset-y-0 right-0 z-[85] flex w-full max-w-[420px] shadow-[-12px_0_30px_rgba(15,23,42,0.04)] xl:static xl:z-auto xl:w-auto xl:max-w-none xl:shadow-none"
                                    : "hidden xl:flex"
                            )}>
                                {showProspectoPanel ? (
                                    <>
                                <div className="flex w-full shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 text-left">
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#131E5C]/[0.08] text-[#131E5C]">
                                            <Activity className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-black text-[#131E5C]">Perfil del prospecto</span>
                                                <span className="rounded-full bg-[#131E5C]/[0.07] px-2 py-0.5 text-[10px] font-extrabold text-[#131E5C]/70">
                                                    {perfilProspectoPorcentaje}% completo
                                                </span>
                                            </div>
                                            <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                                                {[quickEditDraft.auto_interes || prospecto?.auto_interes, quickEditDraft.canal_contacto || prospecto?.canal_contacto, quickEditDraft.estado || prospecto?.estado]
                                                    .filter(Boolean)
                                                    .join(" · ") || "Completa los datos principales del cliente"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                        {perfilProspectoPendientes > 0 ? (
                                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-extrabold text-amber-700">
                                                {perfilProspectoPendientes} pendiente{perfilProspectoPendientes === 1 ? "" : "s"}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
                                                <Check className="h-3 w-3" /> Completo
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowProspectoPanel(false)}
                                            title="Ocultar perfil del prospecto"
                                            aria-label="Ocultar perfil del prospecto"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#131E5C]/[0.08] text-[#131E5C] transition hover:bg-[#131E5C]/15"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                                    <div className="space-y-4">

                                            {/* Tarjeta del cliente: movida desde la zona de conversaciones */}
                                            <div className="rounded-2xl border border-[#131E5C]/10 bg-white p-4 shadow-sm">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <Avatar name={activeChat?.nombre || prospecto?.nombre || "Prospecto"} size="lg" />
                                                    <div className="min-w-0 flex-1">
                                                        {editingNombre ? (
                                                            <input
                                                                ref={nombreInputRef}
                                                                value={nombreDraft}
                                                                onChange={(e) => setNombreDraft(e.target.value)}
                                                                onKeyDown={onNombreKeyDown}
                                                                onBlur={guardarNombre}
                                                                disabled={savingNombre}
                                                                className="h-8 w-full max-w-[220px] rounded-md border border-[#131E5C]/30 bg-white px-2 text-sm font-black text-[#131E5C] outline-none focus:border-[#131E5C]/60"
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={iniciarEdicionNombre}
                                                                title="Editar nombre del cliente"
                                                                className="group inline-flex max-w-full items-center gap-1 rounded px-0.5 py-0.5 text-left transition hover:bg-neutral-100"
                                                            >
                                                                <span className="truncate text-sm font-black text-[#131E5C]">
                                                                    {activeChat?.nombre || prospecto?.nombre || "Prospecto"}
                                                                </span>
                                                                <Pencil className="h-3 w-3 shrink-0 text-slate-300 transition group-hover:text-[#131E5C]/60" />
                                                            </button>
                                                        )}
                                                        <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                                                            Número
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={copyTel}
                                                            className="mt-0.5 inline-flex max-w-full items-center gap-1.5 rounded-lg text-left text-xs font-bold text-[#131E5C] transition hover:text-[#1746D1]"
                                                            title="Copiar número"
                                                        >
                                                            {copiedTel ? (
                                                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            )}
                                                            <span className="truncate">{formateaTelUi(activeTel)}</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="block">
                                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">
                                                            Estado
                                                        </span>
                                                        <select
                                                            value={headerEstado}
                                                            onChange={(e) => saveHeaderEstado(e.target.value)}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                        >
                                                            {renderOptionsConValorActual(ESTADOS_HEADER, headerEstado, "Sin estado")}
                                                        </select>
                                                    </label>

                                                    {String(headerEstado || "").toLowerCase() === "descalificado" ? (
                                                        <label className="block">
                                                            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-red-600">
                                                                Motivo de descalificación
                                                            </span>
                                                            <select
                                                                value={quickEditDraft.motivo_descalificacion || ""}
                                                                onChange={(e) => saveHeaderMotivo(e.target.value)}
                                                                className="h-10 w-full rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                                            >
                                                                {renderOptionsConValorActual(
                                                                    MOTIVOS_DESCALIFICACION,
                                                                    quickEditDraft.motivo_descalificacion,
                                                                    "Selecciona el motivo…"
                                                                )}
                                                            </select>
                                                        </label>
                                                    ) : null}

                                                    <label className="block">
                                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">
                                                            Campaña
                                                        </span>
                                                        <select
                                                            value={quickEditDraft.pauta || prospecto?.pauta || prospecto?.pauta_origen || ""}
                                                            onChange={(e) => setQuickEditDraft((current) => ({ ...current, pauta: e.target.value }))}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                        >
                                                            {renderOptionsConValorActual(
                                                                pautasOptions,
                                                                quickEditDraft.pauta || prospecto?.pauta || prospecto?.pauta_origen || "",
                                                                "Sin campaña"
                                                            )}
                                                        </select>
                                                    </label>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowCitaModal(true)}
                                                    disabled={!activeTel}
                                                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#0f184d] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <CalendarPlus className="h-4 w-4" />
                                                    Agendar cita
                                                </button>

                                                <div className="mt-3 grid grid-cols-4 gap-2">
                                                    {!isDirectChatMode ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => marcarChatComoNoLeido(activeTel)}
                                                            disabled={!activeTel || markingUnreadTel === activeTel}
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                                                            title="Marcar como no leído"
                                                        >
                                                            <MailOpen className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <div />
                                                    )}

                                                    {iaEstado?.puede_responder ? (
                                                        <button
                                                            type="button"
                                                            onClick={pausarIaActiva}
                                                            disabled={loadingIaAction}
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                                                            title="Pausar IA"
                                                        >
                                                            <ZapOff className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={reactivarIaActiva}
                                                            disabled={loadingIaAction}
                                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                                            title="Reactivar IA"
                                                        >
                                                            <Zap className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={clienteBloqueado ? desbloquearContactoActivo : bloquearContactoActivo}
                                                        disabled={blockingTel === activeTel}
                                                        className={cls(
                                                            "inline-flex h-9 items-center justify-center rounded-xl border transition disabled:opacity-50",
                                                            clienteBloqueado
                                                                ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                                : "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                                                        )}
                                                        title={clienteBloqueado ? "Desbloquear contacto" : "Bloquear contacto"}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={llamarProspecto}
                                                        disabled={!activeTel}
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                                                        title="Llamar por WhatsApp"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>



                                            {/* Datos principales */}
                                            <div className="rounded-2xl border border-[#131E5C]/10 bg-white p-4 shadow-sm">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="text-xs font-black uppercase tracking-[0.08em] text-[#131E5C]">Datos principales</div>
                                                        <div className="mt-0.5 text-[11px] font-semibold text-slate-400">Lo necesario para identificar y clasificar al prospecto.</div>
                                                    </div>
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700">Paso 1</span>
                                                </div>

                                                <div className="grid gap-3">
                                                    <label className="block">
                                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Vehículo</span>
                                                        <select
                                                            value={quickEditDraft.auto_interes || ""}
                                                            onChange={(e) => setQuickEditDraft(p => ({ ...p, auto_interes: e.target.value }))}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                        >
                                                            {renderOptionsConValorActual(VEHICULOS, quickEditDraft.auto_interes)}
                                                        </select>
                                                    </label>

                                                    <div>
                                                        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Estado</div>
                                                        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
                                                            {ESTADOS_PROSPECTO.map((estado) => {
                                                                const selected = String(quickEditDraft.estado || "").toLowerCase() === estado.toLowerCase();
                                                                return (
                                                                    <button
                                                                        key={estado}
                                                                        type="button"
                                                                        onClick={() => setQuickEditDraft(p => ({
                                                                            ...p,
                                                                            estado,
                                                                            motivo_descalificacion: estado.toLowerCase() === "descalificado" ? p.motivo_descalificacion : "",
                                                                        }))}
                                                                        className={cls(
                                                                            "min-h-8 rounded-lg px-2 py-1 text-[11px] font-extrabold transition",
                                                                            selected
                                                                                ? "bg-white text-[#131E5C] shadow-sm ring-1 ring-[#131E5C]/10"
                                                                                : "text-slate-400 hover:text-[#131E5C]"
                                                                        )}
                                                                    >
                                                                        {estado}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <label className="block">
                                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Canal</span>
                                                        <select
                                                            value={quickEditDraft.canal_contacto || ""}
                                                            onChange={(e) => setQuickEditDraft(p => ({ ...p, canal_contacto: e.target.value }))}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                        >
                                                            {renderOptionsConValorActual(CANALES, quickEditDraft.canal_contacto)}
                                                        </select>
                                                    </label>
                                                </div>

                                                {String(quickEditDraft.estado || "").toLowerCase() === "descalificado" ? (
                                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                                                        <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-red-700">
                                                            Motivo de descalificación *
                                                        </div>
                                                        <select
                                                            value={quickEditDraft.motivo_descalificacion || ""}
                                                            onChange={(e) => setQuickEditDraft(current => ({
                                                                ...current,
                                                                motivo_descalificacion: e.target.value,
                                                            }))}
                                                            className={cls(
                                                                "h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold outline-none transition focus:ring-2 focus:ring-red-100",
                                                                quickEditDraft.motivo_descalificacion
                                                                    ? "border-red-200 text-[#131E5C]"
                                                                    : "border-red-300 text-red-700"
                                                            )}
                                                        >
                                                            {renderOptionsConValorActual(
                                                                MOTIVOS_DESCALIFICACION,
                                                                quickEditDraft.motivo_descalificacion,
                                                                "Selecciona el motivo…"
                                                            )}
                                                        </select>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Calificación rápida */}
                                            <div className="rounded-2xl border border-[#131E5C]/10 bg-white p-4 shadow-sm">
                                                <div className="mb-4 flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1746D1]/10 text-[#1746D1]">
                                                            <Zap className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-[#131E5C]">Calificación rápida</div>
                                                            <div className="mt-0.5 text-[11px] font-semibold text-slate-400">Cuatro datos para conocer rápidamente la viabilidad del prospecto.</div>
                                                        </div>
                                                    </div>
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700">Paso 2</span>
                                                </div>

                                                <div className="grid gap-4">
                                                    {/* Enganche */}
                                                    <div>
                                                        <div className="mb-2 text-xs font-extrabold text-[#131E5C]">¿Cuánto puede dar de enganche?</div>
                                                        <div className="mb-2 flex flex-wrap gap-1.5">
                                                            {[30000, 50000, 60000, 80000].map((monto) => {
                                                                const selected = Number(quickEditDraft.enganche_monto || 0) === monto;
                                                                return (
                                                                    <button
                                                                        key={monto}
                                                                        type="button"
                                                                        onClick={() => setQuickEditDraft(p => ({ ...p, enganche_monto: String(monto) }))}
                                                                        className={cls(
                                                                            "rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition",
                                                                            selected
                                                                                ? "border-[#131E5C] bg-[#131E5C] text-white shadow-sm"
                                                                                : "border-slate-200 bg-white text-[#131E5C] hover:border-[#131E5C]/30 hover:bg-slate-50"
                                                                        )}
                                                                    >
                                                                        ${monto.toLocaleString("es-MX")}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="relative">
                                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                inputMode="numeric"
                                                                value={quickEditDraft.enganche_monto || ""}
                                                                onChange={(e) => setQuickEditDraft(p => ({ ...p, enganche_monto: e.target.value.replace(/\D/g, "") }))}
                                                                placeholder="Otro monto"
                                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Presupuesto mensual */}
                                                    <div>
                                                        <div className="mb-2 text-xs font-extrabold text-[#131E5C]">Mensualidad aproximada</div>
                                                        <div className="mb-2 flex flex-wrap gap-1.5">
                                                            {[5000, 8000, 10000, 15000].map((monto) => {
                                                                const selected = Number(quickEditDraft.presupuesto_mensual || 0) === monto;
                                                                return (
                                                                    <button
                                                                        key={monto}
                                                                        type="button"
                                                                        onClick={() => setQuickEditDraft(p => ({ ...p, presupuesto_mensual: String(monto) }))}
                                                                        className={cls(
                                                                            "rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition",
                                                                            selected
                                                                                ? "border-[#131E5C] bg-[#131E5C] text-white shadow-sm"
                                                                                : "border-slate-200 bg-white text-[#131E5C] hover:border-[#131E5C]/30 hover:bg-slate-50"
                                                                        )}
                                                                    >
                                                                        ${monto.toLocaleString("es-MX")}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="relative">
                                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                inputMode="numeric"
                                                                value={quickEditDraft.presupuesto_mensual || ""}
                                                                onChange={(e) => setQuickEditDraft(p => ({ ...p, presupuesto_mensual: e.target.value.replace(/\D/g, "") }))}
                                                                placeholder="Otro presupuesto"
                                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Buró */}
                                                    <div>
                                                        <div className="mb-2 text-xs font-extrabold text-[#131E5C]">Buró</div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {BURO_OPTIONS.filter(i => i.value).map((item) => {
                                                                const selected = quickEditDraft.buro_estado === item.value;
                                                                return (
                                                                    <button
                                                                        key={item.value}
                                                                        type="button"
                                                                        onClick={() => setQuickEditDraft(p => ({ ...p, buro_estado: item.value }))}
                                                                        className={cls(
                                                                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition",
                                                                            selected
                                                                                ? "border-[#1746D1] bg-blue-50 text-[#1746D1]"
                                                                                : "border-slate-200 bg-white text-slate-500 hover:border-[#131E5C]/25 hover:text-[#131E5C]"
                                                                        )}
                                                                    >
                                                                        {selected ? <Check className="h-3 w-3" /> : null}
                                                                        {item.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Plazo */}
                                                    <div>
                                                        <div className="mb-2 text-xs font-extrabold text-[#131E5C]">¿Cuándo quiere comprar?</div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {PLAZO_COMPRA_OPTIONS.filter(Boolean).map((plazo) => {
                                                                const selected = quickEditDraft.plazo_compra === plazo;
                                                                return (
                                                                    <button
                                                                        key={plazo}
                                                                        type="button"
                                                                        onClick={() => setQuickEditDraft(p => ({ ...p, plazo_compra: plazo }))}
                                                                        className={cls(
                                                                            "rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition",
                                                                            selected
                                                                                ? "border-[#131E5C] bg-[#131E5C] text-white"
                                                                                : "border-slate-200 bg-white text-slate-500 hover:border-[#131E5C]/25 hover:text-[#131E5C]"
                                                                        )}
                                                                    >
                                                                        {plazo}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Información complementaria: existe, pero no abruma */}
                                            <details className="group overflow-hidden rounded-2xl border border-[#131E5C]/10 bg-white shadow-sm">
                                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 [&::-webkit-details-marker]:hidden">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#131E5C]">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-[#131E5C]">Completar perfil</div>
                                                            <div className="text-[11px] font-semibold text-slate-400">Forma de pago, tipo de cliente, uso, ingresos y comentarios.</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {perfilComplementarioPendientes > 0 ? (
                                                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-700">
                                                                {perfilComplementarioPendientes} pendiente{perfilComplementarioPendientes === 1 ? "" : "s"}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                                                                <Check className="h-3 w-3" /> Completo
                                                            </span>
                                                        )}
                                                        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                                                    </div>
                                                </summary>

                                                <div className="border-t border-slate-100 px-4 py-4">
                                                    <div className="grid gap-3">
                                                        <label className="block">
                                                            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Forma de pago</span>
                                                            <select
                                                                value={quickEditDraft.forma_pago || ""}
                                                                onChange={(e) => setQuickEditDraft(p => ({ ...p, forma_pago: e.target.value }))}
                                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                            >
                                                                {FORMA_PAGO_OPTIONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                                                            </select>
                                                        </label>

                                                        <div className="block">
                                                            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Tipo de cliente</span>
                                                            <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1">
                                                                {[{ value: "persona_fisica", label: "Persona física" }, { value: "persona_moral", label: "Persona moral" }].map(opt => (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => setQuickEditDraft(p => ({ ...p, tipo_cliente: quickEditDraft.tipo_cliente === opt.value ? "" : opt.value }))}
                                                                        className={cls(
                                                                            "h-9 rounded-lg text-xs font-extrabold transition",
                                                                            quickEditDraft.tipo_cliente === opt.value
                                                                                ? "bg-[#131E5C] text-white shadow-sm"
                                                                                : "bg-transparent text-slate-500 hover:bg-[#131E5C]/[0.06] hover:text-[#131E5C]"
                                                                        )}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <label className="block">
                                                            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Uso del vehículo</span>
                                                            <input
                                                                value={quickEditDraft.uso_vehiculo || ""}
                                                                onChange={(e) => setQuickEditDraft(p => ({ ...p, uso_vehiculo: e.target.value }))}
                                                                placeholder="Personal, familiar, trabajo…"
                                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition placeholder:font-semibold placeholder:text-slate-300 focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                            />
                                                        </label>

                                                        <label className="block">
                                                            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Comprobación de ingresos</span>
                                                            <input
                                                                value={quickEditDraft.comprobacion_ingresos || ""}
                                                                onChange={(e) => setQuickEditDraft(p => ({ ...p, comprobacion_ingresos: e.target.value }))}
                                                                placeholder="Nómina, estados de cuenta…"
                                                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition placeholder:font-semibold placeholder:text-slate-300 focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                            />
                                                        </label>
                                                    </div>

                                                    <label className="mt-3 block">
                                                        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#131E5C]/60">Comentarios</span>
                                                        <textarea
                                                            value={quickEditDraft.comentarios || ""}
                                                            onChange={(e) => setQuickEditDraft(p => ({ ...p, comentarios: e.target.value }))}
                                                            rows={3}
                                                            placeholder="Notas relevantes del cliente…"
                                                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition placeholder:text-slate-300 focus:border-[#1746D1]/50 focus:ring-2 focus:ring-[#1746D1]/10"
                                                        />
                                                    </label>
                                                </div>
                                            </details>

                                            {/* Guardado: misma función original */}
                                            <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 rounded-2xl border border-[#131E5C]/10 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                                                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                    Revisa los datos antes de guardar los cambios.
                                                </div>
                                                <button
                                                    onClick={saveQuickEdit}
                                                    disabled={savingQuickEdit || !prospecto?.id}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                    style={{ backgroundColor: BRAND_BLUE }}
                                                    type="button"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {savingQuickEdit ? "Guardando..." : "Guardar cambios"}
                                                </button>
                                            </div>
                                    </div>
                                </div>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowProspectoPanel(true)}
                                    title="Desplegar perfil del prospecto"
                                    aria-label="Desplegar perfil del prospecto"
                                    className="hidden h-full w-full flex-col items-center justify-start gap-3 bg-white py-4 transition hover:bg-[#131E5C]/[0.04] xl:flex"
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#131E5C]/[0.08] text-[#131E5C]">
                                        <ChevronLeft className="h-4 w-4" />
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#131E5C]/70 [writing-mode:vertical-rl]">
                                        Perfil
                                    </span>
                                </button>
                            )}
                            </aside>
                        ) : null}

                </div>
            </div>

            {/* ── MENÚ CONTEXTUAL ───────────────────────────────────────────── */}
            {chatMenu ? (
                <div className="fixed z-[90] min-w-[210px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-2xl"
                    style={{ left: Math.min(chatMenu.x, window.innerWidth - 230), top: Math.min(chatMenu.y, window.innerHeight - 90) }}
                    onMouseDown={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => marcarChatComoNoLeido(chatMenu.tel)} disabled={markingUnreadTel === chatMenu.tel}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-extrabold text-[#131E5C] hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <MailOpen className="h-4 w-4" />
                        {markingUnreadTel === chatMenu.tel ? "Marcando..." : "Marcar como no leído"}
                    </button>
                </div>
            ) : null}

            {/* ── MODAL AGENDAR CITA ────────────────────────────────────────── */}
            <AgendarCitaModal
                open={showCitaModal}
                onClose={() => setShowCitaModal(false)}
                nombreCliente={activeChat?.nombre || prospecto?.nombre}
                telefono={activeTel}
                onGuardar={guardarCita}
                saving={savingCita}
            />
        </div>
    );
}