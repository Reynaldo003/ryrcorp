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
    LayoutTemplate, Zap, ChevronLeft, ChevronDown, Smile, Paperclip, Mic, Square, Pencil, MessageCircle,
    UserRound, Activity, CalendarClock, CheckCircle2, XCircle, Tag, Ban, CreditCard,
} from "lucide-react";import EmojiPicker from "emoji-picker-react";
import { api } from "../../lib/apiPruebas";
import { apiCitas } from "../../lib/apiCitas";
import { ESTADOS_OPCIONES_BANDEJA, resolverEstado } from "./estadosProspecto";
import { encontrarCategoriaDeMotivo, MOTIVOS_DESCALIFICACION_POR_CATEGORIA } from "./motivosDescalificacion";
import MotivoDescalificacionPicker from "./MotivoDescalificacionPicker";

const BRAND_BLUE = "#131E5C";
const DRAWER_POLL_MS = 2000;
const MAX_RECORDING_SECONDS = 300;

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

const CANALES = ["VW-Concesionario", "WhatsApp", "Facebook", "Llamada Entrante"];

const ESTADOS_BANDEJA = ESTADOS_OPCIONES_BANDEJA;


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
    // Resuelve cualquier variante/estado histórico y lo acomoda en una
    // bandeja visible; los estados retirados (p. ej. "Cierre de la Venta",
    // "Requiere Asesor") caen a la primera bandeja en vez de desaparecer.
    const resuelto = resolverEstado(estado);
    return ESTADOS_BANDEJA.find((b) => b.key === resuelto.key) || ESTADOS_BANDEJA[0];
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
/* jaja */
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
        </div>
    );
}


function PipelineSidebar({
    conteoPorEstado,
    total,
    nuevosHoy,
    tasaAtencion,
    tasaConversion,
    tasaLectura,
    filtroActivo,
    onFiltroChange,
}) {
    const maxEstado = Math.max(
        1,
        ...ESTADOS_BANDEJA.map((estado) => conteoPorEstado.get(estado.key) || 0)
    );

    return (
        <aside className="flex h-full min-h-0 min-w-0 max-w-full flex-col gap-3 overflow-hidden">
            {/* MÉTRICAS */}
            <section className="shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-extrabold text-[#131E5C]">
                            Resumen comercial
                        </h2>
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                            Rendimiento de la línea
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-[#131E5C]/5 px-2 py-1 text-[10px] font-extrabold text-[#131E5C]">
                        {total}
                    </span>
                </div>

                <div className="grid min-w-0 grid-cols-3 gap-1">
                    <PulseRing value={tasaAtencion} label="Atención" color="#3B82F6" size={54} stroke={5} />
                    <PulseRing value={tasaConversion} label="Conversión" color="#F97316" size={54} stroke={5} />
                    <PulseRing value={tasaLectura} label="Lectura" color="#8B5CF6" size={54} stroke={5} />
                </div>
            </section>

            {/* PIPELINE */}
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="shrink-0 border-b border-black/5 px-3 py-2.5">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-extrabold text-[#131E5C]">
                                Estado de prospectos
                            </h2>
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                                Etapas del proceso comercial
                            </p>
                        </div>

                        {filtroActivo !== "todos" ? (
                            <button
                                type="button"
                                onClick={() => onFiltroChange?.("todos")}
                                className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold text-[#131E5C] transition hover:bg-[#131E5C]/5"
                            >
                                Limpiar
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-2.5">
                    <button
                        type="button"
                        onClick={() => onFiltroChange?.("nuevos")}
                        className={cls(
                            "mb-2.5 w-full min-w-0 max-w-full overflow-hidden rounded-xl border px-2.5 py-2 text-left transition",
                            filtroActivo === "nuevos"
                                ? "border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-100"
                                : "border-sky-100 bg-sky-50/60 hover:border-sky-200 hover:bg-sky-50"
                        )}
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                            <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-[#131E5C]">
                                Nuevos prospectos
                            </span>
                            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-sky-600 shadow-sm ring-1 ring-sky-100">
                                {nuevosHoy}
                            </span>
                        </div>

                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sky-100">
                            <div
                                className="h-full max-w-full rounded-full bg-sky-500 transition-all duration-500"
                                style={{ width: `${total ? Math.min(100, (nuevosHoy / total) * 100) : 0}%` }}
                            />
                        </div>
                    </button>

                    <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2 px-1">
                        <span className="truncate text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">
                            Pipeline comercial
                        </span>
                        <span className="shrink-0 text-[9px] font-bold text-slate-300">
                            Filtrar
                        </span>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-1">
                        {ESTADOS_BANDEJA.map((estado) => {
                            const cantidad = conteoPorEstado.get(estado.key) || 0;
                            const porcentaje = Math.min(100, (cantidad / maxEstado) * 100);
                            const activo = filtroActivo === estado.key;

                            return (
                                <button
                                    key={estado.key}
                                    type="button"
                                    onClick={() => onFiltroChange?.(estado.key)}
                                    className={cls(
                                        "w-full min-w-0 max-w-full overflow-hidden rounded-xl border px-2.5 py-2 text-left transition",
                                        activo
                                            ? "border-[#131E5C]/20 bg-[#131E5C]/[0.04] shadow-sm ring-1 ring-[#131E5C]/10"
                                            : "border-transparent hover:border-black/5 hover:bg-neutral-50"
                                    )}
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: estado.color }}
                                        />

                                        <span className={cls(
                                            "min-w-0 flex-1 truncate text-[10px] font-bold",
                                            activo ? "text-[#131E5C]" : "text-slate-600"
                                        )} title={estado.label}>
                                            {estado.label}
                                        </span>

                                        <span className={cls(
                                            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold",
                                            activo
                                                ? "bg-white text-[#131E5C] shadow-sm"
                                                : "bg-slate-50 text-slate-500"
                                        )}>
                                            {cantidad}
                                        </span>
                                    </div>

                                    <div className="ml-[18px] mt-1.5 h-1 max-w-[calc(100%-18px)] overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full max-w-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${porcentaje}%`,
                                                backgroundColor: mutedColor(estado.color, 0.15),
                                            }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
        </aside>
    );
}

function ChatCard({ chat, onOpen, onChangeEtapa, selected = false }) {
    const estado = getEstadoBandeja(chat.estado);
    const ultimoMensaje = String(chat?.last?.text || "").trim() || "Sin mensajes recientes";
    const hora = formatHoraCorta(chat?.last?.timestamp) || chat?.last?.time || "—";
    const quiereSeminuevos = normalizeText(chat?.autoInteres).includes("seminuevos");
    const esDescalificado = safeLower(estado?.key) === "descalificado";
    const motivoDesc = String(chat?.motivoDescalificacion || "").trim();
    const categoriaMotivo = esDescalificado && motivoDesc ? encontrarCategoriaDeMotivo(motivoDesc) : null;
    const labelCategoria = categoriaMotivo
        ? (MOTIVOS_DESCALIFICACION_POR_CATEGORIA.find((c) => c.key === categoriaMotivo)?.label || "")
        : "";
    const [savingEtapa, setSavingEtapa] = useState(false);
    const [descModalOpen, setDescModalOpen] = useState(false);
    const [descMotivo, setDescMotivo] = useState("");

    async function handleEtapaChange(label) {
        if (savingEtapa) return;
        if (normalizeText(label) === "descalificado") {
            setDescMotivo("");
            setDescModalOpen(true);
            return;
        }
        setSavingEtapa(true);
        try {
            await onChangeEtapa?.(chat, label);
        } finally {
            setSavingEtapa(false);
        }
    }

    async function confirmDescalificacion() {
        if (!descMotivo.trim()) return;
        setDescModalOpen(false);
        setSavingEtapa(true);
        try {
            await onChangeEtapa?.(chat, "Descalificado", descMotivo.trim());
        } finally {
            setSavingEtapa(false);
        }
    }

    return (<>
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(chat)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen?.(chat);
                }
            }}
            className={cls(
                "group w-full min-w-0 cursor-pointer select-none rounded-xl border border-black/10 bg-white px-3 py-2.5 shadow-sm transition hover:border-[#131E5C]/30 hover:shadow-md",
                selected ? "border-[#7AA7FF] bg-[#F5F8FF] ring-1 ring-[#7AA7FF]" : ""
            )}
            title="Haz clic para abrir la conversación"
        >
            <div className="flex items-center gap-2.5">
                <Avatar name={chat.nombre} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-[13px] font-extrabold text-[#131E5C]">
                                {chat.nombre}
                            </span>
                            {quiereSeminuevos ? (
                                <span
                                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F97316]/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#F97316] ring-1 ring-[#F97316]/30"
                                    title="Interés en Seminuevos (configurado desde Contacto)"
                                >
                                    Seminuevo
                                </span>
                            ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {chat.unread > 0 ? (
                                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-extrabold text-white">
                                    {chat.unread}
                                </span>
                            ) : null}
                            <span className="whitespace-nowrap text-[9px] font-bold text-slate-400">
                                {hora}
                            </span>
                        </div>
                    </div>

                    <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                        {formateaTelUi(chat.telefono)}
                    </div>

                    {chat.agencia ? (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <Building2 className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{chat.agencia}</span>
                        </div>
                    ) : null}

                    {esDescalificado && motivoDesc ? (
                        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1">
                            <Ban className="h-3 w-3 shrink-0 text-red-500" />
                            <span className="truncate text-[10px] font-extrabold text-red-600" title={motivoDesc}>
                                {motivoDesc}
                            </span>
                            {labelCategoria ? (
                                <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-red-500 ring-1 ring-red-200/50">
                                    {labelCategoria}
                                </span>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="mt-2 flex min-w-0 items-center gap-2">
                        
                        <div className="shrink-0 max-w-[60%]" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <EtapaSelect
                                estado={estado}
                                saving={savingEtapa}
                                onChange={handleEtapaChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {descModalOpen ? (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={() => setDescModalOpen(false)}
            >
                <div
                    className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">Motivo de descalificación</h3>
                        <button type="button" onClick={() => setDescModalOpen(false)} className="rounded-lg p-1 hover:bg-slate-100">
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>

                    <MotivoDescalificacionPicker
                        value={descMotivo}
                        onChange={setDescMotivo}
                        invalid={!descMotivo.trim()}
                    />

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setDescModalOpen(false)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={!descMotivo.trim()}
                            onClick={confirmDescalificacion}
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
                        >
                            Descalificar
                        </button>
                    </div>
                </div>
            </div>
        ) : null}
    </>);
}

function EtapaSelect({ estado, onChange, saving = false }) {
    return (
        <div className="relative inline-flex max-w-full items-center">
            <select
                value={estado.key}
                disabled={saving}
                onChange={(event) => {
                    const opcion = ESTADOS_BANDEJA.find((b) => b.key === event.target.value);
                    if (opcion) onChange?.(opcion.label);
                }}
                title={`Etapa: ${estado.label}`}
                className="max-w-full cursor-pointer appearance-none rounded-full border border-transparent py-1 pl-2 pr-6 text-xs font-extrabold outline-none transition hover:border-black/10 focus:border-black/25 disabled:cursor-wait disabled:opacity-60"
                style={{ color: estado.color, backgroundColor: mutedColor(estado.color, 0.90) }}
            >
                {ESTADOS_BANDEJA.map((b) => (
                    <option key={b.key} value={b.key} className="bg-white text-slate-700">
                        {b.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current opacity-70" />
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



export function ChatDrawer({ open, telefono, numeroAsesor, onClose, clienteRetencion = null, onTelefonoChange, }) {
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
    const [quickBubbles, setQuickBubbles] = useState([]);
    const [quickBubblesLoading, setQuickBubblesLoading] = useState(false);
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

    const telefonosRetencion = useMemo(() => {
    if (!clienteRetencion) return [];

    return [
        clienteRetencion?.telefono_cliente,
        clienteRetencion?.telefono_cliente2,
        clienteRetencion?.telefono_cliente3,
    ]
        .map((telefono) => normalizaTelefonoMx(telefono))
        .filter(Boolean)
        .filter((telefono, index, lista) => lista.indexOf(telefono) === index);
}, [clienteRetencion]);

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

        const onNuevoMensaje = (event) => {
            const data = event.detail || {};
            const telEvento = normalizaTelefonoMx(
                data.telefono ||
                data.wa_id ||
                data.from ||
                data.numero_cliente ||
                ""
            );
            if (telEvento && telEvento !== tel) return;
            cargar({ markRead: false });
        };

        window.addEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        pollRef.current = window.setInterval(() => { cargar({ markRead: false }); }, DRAWER_POLL_MS);
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            window.removeEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        };

    }, [open, tel]);

    useEffect(() => {
        if (!stickBottomRef.current || !scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [mensajes.length]);

    useEffect(() => {
        if (!open || loading || !scrollRef.current) return;

        const frame = requestAnimationFrame(() => {
            if (!scrollRef.current) return;

            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            stickBottomRef.current = true;
        });

            return () => cancelAnimationFrame(frame);
        }, [open, loading, tel]);

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
                        if (isRecording) {
                            setRecordingError("Detén la grabación antes de enviar el mensaje.");
                            return;
                        }

                        const text = draft.trim();
                        const hasAttachments = attachments.length > 0;

                        if ((!text && !hasAttachments) || !tel || sending) return;

                        const optimisticId = crypto.randomUUID();
                        const currentAttachments = attachments;

                        const optimisticAttachments = currentAttachments.map((a) => ({
                            id: a.id,
                            kind: a.kind,
                            previewUrl: a.previewUrl,
                            url: a.previewUrl,
                            name: a.name,
                            size: a.size,
                            mime: a.mime,
                        }));

                        setSending(true);
                        setDraft("");
                        setAttachments([]);
                        stickBottomRef.current = true;

                        setMensajes((prev) => [
                            ...prev,
                            {
                                id: optimisticId,
                                mine: true,
                                text: text || "Adjunto",
                                attachments: optimisticAttachments,
                                local_created_at: new Date().toISOString(),
                                status: "sent",
                                local_pending: true,
                            },
                        ]);

                        try {
                            if (hasAttachments) {
                                await api.digitalesEnviarMedia({
                                    to: tel,
                                    text,
                                    files: currentAttachments
                                        .map((a) => a.file)
                                        .filter(Boolean),
                                    numero_asesor: numeroAsesor,
                                });
                            } else {
                                await api.digitalesEnviarMensaje({
                                    to: tel,
                                    text,
                                    numero_asesor: numeroAsesor,
                                });
                            }

                            // Ya fue aceptado el envío: permitimos escribir otro inmediatamente
                            setSending(false);

                            // Quitamos el mensaje temporal
                            setMensajes((prev) =>
                                prev.filter((mensaje) => mensaje.id !== optimisticId)
                            );

                            // Traemos el mensaje real sin bloquear el compositor
                            cargar({ markRead: false }).catch((error) => {
                                console.error("No se pudo refrescar el chat:", error);
                            });

                        } catch (error) {
                            setMensajes((prev) =>
                                prev.filter((mensaje) => mensaje.id !== optimisticId)
                            );

                            setSending(false);

                            alert(`Falló el envío: ${error.message}`);

                            cargar({ markRead: false }).catch(() => {});
                        } finally {
                            cleanupPreviews(optimisticAttachments);
                        }
                    }

    function onKeyDownComposer(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    }


    async function cargarQuickBubbles() {
        setQuickBubblesLoading(true);
        try {
            const data = await api.digitalesRespuestasRapidasList();
            const items = Array.isArray(data?.items) ? data.items : [];
            setQuickBubbles(items.map((r) => ({ id: r.id, title: r.titulo || String(r.texto || "").slice(0, 25), text: r.texto })));
        } catch (error) {
            console.error("No se pudieron cargar los mensajes rápidos:", error);
        } finally {
            setQuickBubblesLoading(false);
        }
    }

    function toggleQuickBubbles() {
        if (!showQuickBubblesDropdown) cargarQuickBubbles();
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

    async function saveEditQuickBubble() {
        const text = editBubbleText.trim();
        if (!text || !editingBubbleId) return;
        try {
            await api.digitalesRespuestasRapidasUpdate(editingBubbleId, { titulo: editBubbleTitle.trim(), texto: text });
            setQuickBubbles((prev) => prev.map((b) =>
                b.id === editingBubbleId ? { ...b, title: editBubbleTitle.trim() || text.slice(0, 25), text } : b
            ));
        } catch (error) {
            console.error("No se pudo actualizar el mensaje rápido:", error);
            alert(`No se pudo actualizar el mensaje rápido: ${error.message}`);
            return;
        }
        cancelEditQuickBubble();
    }

    async function deleteQuickBubble(id) {
        try {
            await api.digitalesRespuestasRapidasDelete(id);
            setQuickBubbles((prev) => prev.filter((b) => b.id !== id));
        } catch (error) {
            console.error("No se pudo eliminar el mensaje rápido:", error);
            alert(`No se pudo eliminar el mensaje rápido: ${error.message}`);
            return;
        }
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
                const incompleteField = fields.find(
                    (field) => !String(tplDraft?.[field.key] || "").trim()
                );

                if (incompleteField) {
                    setTemplatesError(
                        `Completa el campo obligatorio: ${
                            incompleteField.friendlyLabel ||
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

                const textoPreview =
                    buildTemplatePreviewText(tplSelected, tplDraft);

                const components =
                    buildDynamicTemplateComponents(tplSelected, tplDraft);

                const optimisticId = crypto.randomUUID();

                setTemplatesError("");
                setSendingTemplate(true);
                stickBottomRef.current = true;

                // Mensaje temporal mientras Meta confirma el envío
                setMensajes((prev) => [
                    ...prev,
                    {
                        id: optimisticId,
                        local_pending: true,
                        local_created_at: new Date().toISOString(),
                        mine: true,
                        text: textoPreview || `Plantilla: ${templateName}`,
                        status: "sent",
                        attachments: [],
                    },
                ]);

                try {
                    await api.digitalesEnviarPlantilla({
                        to: tel,
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
                        numero_asesor: numeroAsesor,
                    });

                    // Cerramos el selector de plantillas
                    setShowTemplatesDropdown(false);
                    setTplSelected(null);
                    setTplDraft({});
                    setTemplatesError("");

                    // El envío ya fue aceptado
                    setSendingTemplate(false);

                    // Quitamos el mensaje temporal ANTES de traer el real
                    setMensajes((prev) =>
                        prev.filter(
                            (mensaje) => mensaje.id !== optimisticId
                        )
                    );

                    // Traemos el mensaje real desde backend
                    cargar({ markRead: false }).catch((error) => {
                        console.error(
                            "No se pudo refrescar el chat después de enviar la plantilla:",
                            error
                        );
                    });

                } catch (error) {
                    console.error(
                        "Error enviando plantilla desde drawer:",
                        error
                    );

                    setTemplatesError(
                        error?.message ||
                        "No se pudo enviar la plantilla."
                    );

                    // Si falló, quitamos igualmente el mensaje temporal
                    setMensajes((prev) =>
                        prev.filter(
                            (mensaje) => mensaje.id !== optimisticId
                        )
                    );

                    setSendingTemplate(false);

                    cargar({ markRead: false }).catch(() => {});

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
                       
                        {telefonosRetencion.length > 1 ? (
                            <select
                                value={tel}
                                onChange={(e) => onTelefonoChange?.(e.target.value)}
                                className="mt-0.5 max-w-[220px] cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 outline-none transition hover:border-slate-300 focus:border-[#131E5C]/40"
                            >
                                {telefonosRetencion.map((numero) => (
                                    <option key={numero} value={numero}>
                                        {formateaTelUi(numero)}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-xs font-semibold text-slate-400">
                                {formateaTelUi(tel)}
                            </div>
                        )}
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
                                                {quickBubblesLoading ? "Cargando mensajes rápidos..." : <>Sin mensajes rápidos aún.<br />Agrégalos desde la vista de Chats.</>}
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



const EVENTOS_ACTIVIDAD = {
    whatsapp: { icon: MessageCircle, color: "#16A34A", bg: "bg-emerald-50" },
    asignacion: { icon: UserRound, color: "#8B5CF6", bg: "bg-violet-50" },
    etapa: { icon: Tag, color: "#F97316", bg: "bg-orange-50" },
    cita: { icon: CalendarClock, color: "#0891B2", bg: "bg-cyan-50" },
    venta: { icon: CheckCircle2, color: "#16A34A", bg: "bg-emerald-50" },
    descalificado: { icon: XCircle, color: "#DC2626", bg: "bg-red-50" },
    creado: { icon: Clock, color: BRAND_BLUE, bg: "bg-[#131E5C]/5" },
};

function buildActividad(prospecto = {}) {
    const items = [];
    const estado = getEstadoBandeja(prospecto?.estado);

    if (prospecto?.creado || prospecto?.primer_contacto_at) {
        items.push({
            id: "creado",
            tipo: "creado",
            titulo: "Prospecto registrado",
            descripcion: "Expediente creado en el CRM",
            fecha: prospecto?.creado || prospecto?.primer_contacto_at,
        });
    }
    if (prospecto?.last?.text) {
        items.push({
            id: "ultimo-mensaje",
            tipo: "whatsapp",
            titulo: "Mensaje de WhatsApp",
            descripcion: prospecto.last.text,
            fecha: prospecto?.last?.timestamp || "",
        });
    }
    if (estado?.label) {
        items.push({
            id: "etapa",
            tipo: "etapa",
            titulo: "Etapa actualizada",
            descripcion: `Etapa actual: ${estado.label}`,
            fecha: "",
        });
    }
    if (prospecto?.asignadoA) {
        items.push({
            id: "asignacion",
            tipo: "asignacion",
            titulo: "Asignación de asesor",
            descripcion: `Asignado a ${prospecto.asignadoA}`,
            fecha: "",
        });
    }
    return items;
}

function formatFechaCita(iso) {
    if (!iso) return "—";
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return "—";
    return fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });
}

function formatHoraCita(iso) {
    if (!iso) return "—";
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return "—";
    return fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });
}

function estadoCitaDe(cita) {
    if (!cita?.fecha_hora_cita) return null;
    const fecha = new Date(cita.fecha_hora_cita);
    const yaPaso = !Number.isNaN(fecha.getTime()) && fecha.getTime() < Date.now();
    if (cita.asistencia) return { key: "asistio", label: "Asistió", color: "#16A34A", border: "#16A34A40" };
    if (yaPaso) return { key: "no_asistio", label: "No asistió", color: "#DC2626", border: "#DC262640" };
    return { key: "pendiente", label: "Pendiente", color: "#0891B2", border: "#0891B240" };
}

function tiempoCitaMs(cita) {
    const fecha = new Date(cita?.fecha_hora_cita || "");
    return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
}

function seleccionarCitaRelevante(existente, candidata) {
    if (!existente) return candidata;
    const tExistente = tiempoCitaMs(existente);
    const tCandidata = tiempoCitaMs(candidata);
    if (tExistente === null) return candidata;
    if (tCandidata === null) return existente;
    const ahora = Date.now();
    const existenteFutura = tExistente >= ahora;
    const candidataFutura = tCandidata >= ahora;
    if (candidataFutura && !existenteFutura) return candidata;
    if (existenteFutura && !candidataFutura) return existente;
    if (candidataFutura) return tCandidata < tExistente ? candidata : existente;
    return tCandidata > tExistente ? candidata : existente;
}

function InfoRow({ label, value, className }) {
    return (
        <div className={cls("min-w-0", className)}>
            <div className="text-[10px] font-bold text-slate-400">{label}</div>
            <div className="mt-0.5 truncate text-xs font-extrabold text-[#131E5C]" title={value}>{value || "—"}</div>
        </div>
    );
}

function ProspectoDrawer({ open, prospecto = null, onClose, onOpenChat }) {
    const telefono = String(prospecto?.telefono || "");
    const cita = prospecto?.cita || null;
    const estadoCita = estadoCitaDe(cita);

    const nombre = String(prospecto?.nombre || "").trim() || "Prospecto";
    const agencia = String(prospecto?.agencia || "").trim();
    const origen = firstNonEmpty(prospecto?.canal_contacto, prospecto?.origen, prospecto?.fuente) || "No registrado";
    const interes = firstNonEmpty(prospecto?.auto_interes, prospecto?.interes, prospecto?.vehiculo, prospecto?.modelo) || "Por confirmar";
    const asignadoA = String(prospecto?.asignadoA || "").trim() || "Sin asignar";
    const estado = getEstadoBandeja(prospecto?.estado);
    const esDescalificado = safeLower(estado?.key) === "descalificado";
    const motivoDesc = String(prospecto?.motivo_descalificacion || "").trim();
    const categoriaMotivo = esDescalificado && motivoDesc ? encontrarCategoriaDeMotivo(motivoDesc) : null;
    const labelCategoria = categoriaMotivo
        ? (MOTIVOS_DESCALIFICACION_POR_CATEGORIA.find((c) => c.key === categoriaMotivo)?.label || "")
        : "";
    const actividad = useMemo(() => buildActividad(prospecto || {}), [prospecto]);

    if (!open || !prospecto) return null;

    const telLink = `tel:+${telefono.replace(/\D/g, "")}`;

    return (
        <div className="fixed inset-0 z-[95] flex justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />

            <aside className="relative flex h-full w-full max-w-[410px] flex-col bg-[#F6F8FC] shadow-2xl sm:max-w-[430px] md:max-w-[45vw] lg:max-w-[410px]">

                <div className="shrink-0 border-b border-black/10 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Avatar name={nombre} />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-extrabold text-[#131E5C]">{nombre}</div>
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-400">
                                <span className="truncate">{formateaTelUi(telefono)}</span>
                                {agencia ? (
                                    <>
                                        <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-slate-300" />
                                        <span className="truncate">{agencia}</span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                        <button type="button" onClick={onClose}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-neutral-100 hover:text-slate-600"
                            title="Cerrar">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-black/10 bg-white px-4 py-3">
                    <button type="button" onClick={() => onOpenChat?.(telefono)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 transition hover:bg-emerald-100"
                        title="Abrir conversación de WhatsApp">
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px] font-extrabold text-emerald-700">WhatsApp</span>
                    </button>
                    <a href={telLink}
                        className="flex flex-col items-center gap-1.5 rounded-xl border border-black/10 bg-white py-2.5 transition hover:bg-neutral-50"
                        title="Llamar al cliente">
                        <Phone className="h-4 w-4 text-[#131E5C]" />
                        <span className="text-[10px] font-extrabold text-[#131E5C]">Llamar</span>
                    </a>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">

                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                            <Building2 className="h-4 w-4" />
                            Información del prospecto
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                            <InfoRow label="Origen" value={origen} />
                            <InfoRow label="Interés" value={interes} />
                            <div className="col-span-2 min-w-0">
                                <div className="text-[10px] font-bold text-slate-400">Etapa actual</div>
                                <div className="mt-1">
                                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold"
                                        style={{ color: estado.color, backgroundColor: `${estado.color}14`, borderColor: `${estado.color}40` }}>
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: estado.color }} />
                                        <span className="truncate">{estado.label}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 min-w-0">
                                <div className="text-[10px] font-bold text-slate-400">Asignado a</div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-extrabold text-[#131E5C]">
                                    <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                    <span className="truncate">{asignadoA}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {esDescalificado && motivoDesc ? (
                        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-red-700">
                                <Ban className="h-4 w-4" />
                                Motivo de descalificación
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-extrabold text-red-700">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                    <span className="truncate">{motivoDesc}</span>
                                </span>
                                {labelCategoria ? (
                                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-500 ring-1 ring-red-200/50">
                                        {labelCategoria}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {(() => {
                        const esSolicitud = safeLower(estado?.key) === "solicitud_credito";
                        const folio = String(prospecto?.folio_solicitud_credito || "").trim();
                        const estatusCredito = String(prospecto?.solicitud_credito_estado || "").trim().toLowerCase();
                        if (!esSolicitud || !folio) return null;

                        const estatusColor = estatusCredito === "autorizado"
                            ? { color: "#16A34A", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" }
                            : estatusCredito === "rechazado"
                                ? { color: "#DC2626", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" }
                                : estatusCredito === "condicionado"
                                    ? { color: "#CA8A04", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" }
                                    : { color: "#64748B", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600" };

                        return (
                            <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50/80 p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-purple-700">
                                    <CreditCard className="h-4 w-4" />
                                    Solicitud de Crédito
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                                    <InfoRow label="Folio" value={folio} />
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold text-slate-400">Estatus</div>
                                        <div className="mt-1">
                                            <span className={cls("inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold", estatusColor.border, estatusColor.bg, estatusColor.text)}>
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: estatusColor.color }} />
                                                <span className="truncate">{estatusCredito ? estatusCredito.charAt(0).toUpperCase() + estatusCredito.slice(1) : "Sin estatus"}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {cita ? (
                        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                                    <CalendarClock className="h-4 w-4" />
                                    Cita
                                </div>
                                {estadoCita ? (
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold"
                                        style={{ color: estadoCita.color, backgroundColor: `${estadoCita.color}14`, borderColor: estadoCita.border }}>
                                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: estadoCita.color }} />
                                        {estadoCita.label}
                                    </span>
                                ) : null}
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                                <InfoRow label="Fecha" value={formatFechaCita(cita?.fecha_hora_cita)} />
                                <InfoRow label="Hora" value={formatHoraCita(cita?.fecha_hora_cita)} />
                                <InfoRow label="Asesor asignado" value={firstNonEmpty(cita?.asesor_asignado, cita?.asesor_piso, cita?.asesor_digital) || "Sin asignar"} className="col-span-2" />
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                            <Activity className="h-4 w-4" />
                            Actividad reciente
                        </div>
                        {actividad.length ? (
                            <div>
                                {actividad.map((item, index) => {
                                    const cfg = EVENTOS_ACTIVIDAD[item.tipo] || EVENTOS_ACTIVIDAD.creado;
                                    const Icon = cfg.icon;
                                    const esUltimo = index === actividad.length - 1;
                                    return (
                                        <div key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                                            {!esUltimo ? <span className="absolute left-[15px] top-8 bottom-0 w-px bg-black/10" /> : null}
                                            <div className={cls("z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
                                                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                                            </div>
                                            <div className="min-w-0 pt-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="truncate text-xs font-extrabold text-[#131E5C]">{item.titulo}</div>
                                                    {item.fecha ? <div className="shrink-0 text-[10px] font-semibold text-slate-400">{formatWhatsAppDate(item.fecha)}</div> : null}
                                                </div>
                                                <div className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-400">{item.descripcion}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-black/10 bg-neutral-50 px-4 py-6 text-center text-[11px] font-semibold text-slate-400">
                                Sin actividad registrada por ahora.
                            </div>
                        )}
                    </div>
                </div>
            </aside>
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
    const [citasIndex, setCitasIndex] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [drawerTel, setDrawerTel] = useState("");
    const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
    const [filtroActivo, setFiltroActivo] = useState("todos");
    const [orden, setOrden] = useState("reciente");

    const requestRef = useRef(0);
    const kanbanScrollRef = useRef(null);
    const kanbanColumnRefs = useRef(new Map());

    useEffect(() => {
        if (["todos", "no_leidos", "nuevos", "mios"].includes(filtroActivo)) {
            return;
        }
        const column = kanbanColumnRefs.current.get(filtroActivo);
        const container = kanbanScrollRef.current;
        if (column && container) {
            const containerRect = container.getBoundingClientRect();
            const colRect = column.getBoundingClientRect();
            const relativeLeft = colRect.left - containerRect.left + container.scrollLeft;
            const target = relativeLeft - container.clientWidth / 2 + column.clientWidth / 2;
            container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
        }
    }, [filtroActivo]);

    useEffect(() => {
        if (!ready) return;
        if (!numerosDisponibles.length) {
            setNumeroAsesorActivo("");
            return;
        }

        const guardado = normalizaTelefonoMx(
            localStorage.getItem("digitales_numero_asesor_activo") || ""
        );

        setNumeroAsesorActivo((actual) => {
            if (actual && numerosDisponibles.includes(actual)) return actual;
            return guardado && numerosDisponibles.includes(guardado)
                ? guardado
                : numerosDisponibles[0];
        });
    }, [ready, numerosDisponibles]);

    async function cargarTodo() {
        const numeroLinea = normalizaTelefonoMx(numeroAsesorActivo);
        if (!numeroLinea) return;

        const requestId = requestRef.current + 1;
        requestRef.current = requestId;
        setLoading(true);

        try {
            const [chatsResp, prospectosResp, citasResp] = await Promise.all([
                api.digitalesChats({ numero_asesor: numeroLinea }),
                api.digitalesListProspectos({ numero_asesor: numeroLinea }).catch(() => []),
                apiCitas.list().catch(() => []),
            ]);

            if (requestId !== requestRef.current) return;

            const items = Array.isArray(chatsResp)
                ? chatsResp
                : Array.isArray(chatsResp?.results)
                    ? chatsResp.results
                    : [];

            const normalized = items
                .map((chat) => ({
                    id: chat?.id || `${numeroLinea}-${chat?.telefono}`,
                    telefono: normalizaTelefonoMx(chat?.telefono || ""),
                    nombre: chat?.nombre || "Prospecto",
                    agencia: chat?.agencia || "",
                    estado: chat?.estado || "",
                    unread: Number(chat?.unread || 0),
                    asignadoA: firstNonEmpty(
                        chat?.asesor_digital,
                        chat?.asesor_ventas,
                        chat?.responsable,
                        chat?.asignado_a,
                        chat?.asesor,
                        chat?.assigned_to
                    ),
                    esMio: Boolean(chat?.es_mio || chat?.is_mine || chat?.mine),
                    last: {
                        text: chat?.last_text || "",
                        time: chat?.last_time || "",
                        timestamp: chat?.last_message_at || "",
                    },
                }))
                .filter((chat) => chat.telefono);

            setChats(normalized);
            setProspectosIndex(Array.isArray(prospectosResp) ? prospectosResp : []);
            setCitasIndex(Array.isArray(citasResp) ? citasResp : []);
        } catch (error) {
            console.error("Error cargando bandeja de chats:", error);
        } finally {
            if (requestId === requestRef.current) setLoading(false);
        }
    }

    useEffect(() => {
        cargarTodo();
    }, [numeroAsesorActivo]);

    useEffect(() => {
        function handleVisibility() {
            if (document.visibilityState === "visible" && numeroAsesorActivo) {
                cargarTodo();
            }
        }
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [numeroAsesorActivo]);

    const prospectoPorTel = useMemo(() => {
        const map = new Map();

        for (const prospecto of prospectosIndex) {
            const tel = normalizaTelefonoMx(prospecto?.telefono || "");
            if (tel) map.set(tel, prospecto);
        }

        return map;
    }, [prospectosIndex]);

    const citaPorTel = useMemo(() => {
        const map = new Map();

        for (const cita of citasIndex) {
            const tel = normalizaTelefonoMx(cita?.cliente?.telefono || cita?.telefono || "");
            if (tel && cita?.fecha_hora_cita) {
                map.set(tel, seleccionarCitaRelevante(map.get(tel), cita));
            }
        }

        return map;
    }, [citasIndex]);

    const userAliases = useMemo(() => {
        return [
            user?.nombre,
            user?.name,
            user?.nombre_completo,
            user?.username,
            user?.email,
        ]
            .map((value) => normalizeText(value))
            .filter(Boolean);
    }, [user]);

    const chatsEnriquecidos = useMemo(() => {
        return chats.map((chat) => {
            const prospecto = prospectoPorTel.get(chat.telefono) || {};
            const asignadoA = firstNonEmpty(
                chat?.asignadoA,
                prospecto?.asesor_digital,
                prospecto?.asesor_ventas,
                prospecto?.responsable,
                prospecto?.asignado_a,
                prospecto?.asesor,
                prospecto?.assigned_to
            );

            const asignadoNormalizado = normalizeText(asignadoA);
            const coincideUsuario = Boolean(
                asignadoNormalizado &&
                userAliases.some(
                    (alias) =>
                        asignadoNormalizado === alias ||
                        asignadoNormalizado.includes(alias) ||
                        alias.includes(asignadoNormalizado)
                )
            );

            return {
                ...chat,
                estado: prospecto?.estado || chat.estado,
                asignadoA,
                esMio: Boolean(chat.esMio || coincideUsuario),
                prospectoId: prospecto?.id || "",
                autoInteres: firstNonEmpty(
                    prospecto?.auto_interes,
                    prospecto?.interes,
                    prospecto?.vehiculo,
                    prospecto?.modelo,
                    chat?.auto_interes,
                    chat?.interes
                ) || "",
                motivoDescalificacion: prospecto?.motivo_descalificacion || "",
                folioSolicitudCredito: prospecto?.folio_solicitud_credito || "",
                solicitudCreditoEstado: prospecto?.solicitud_credito_estado || "",
            };
        });
    }, [chats, prospectoPorTel, userAliases]);

    const filteredChats = useMemo(() => {
        const query = normalizeText(q);

        if (!query) return chatsEnriquecidos;

        return chatsEnriquecidos.filter((chat) =>
            normalizeText(chat.nombre).includes(query) ||
            normalizaTelefonoMx(chat.telefono).includes(normalizaTelefonoMx(q) || query) ||
            normalizeText(chat.agencia).includes(query) ||
            normalizeText(chat.estado).includes(query) ||
            normalizeText(chat.last?.text).includes(query) ||
            normalizeText(chat.asignadoA).includes(query)
        );
    }, [chatsEnriquecidos, q]);


    const chatsNuevosHoy = useMemo(() => {
        return chatsEnriquecidos
            .filter((chat) => {
                const prospecto = prospectoPorTel.get(chat.telefono);

                // Preferimos la fecha real de alta/primer contacto.
                // Solo usamos el último mensaje como fallback si el expediente no trae fecha.
                const fechaReferencia =
                    prospecto?.creado ||
                    prospecto?.primer_contacto_at ||
                    chat.last?.timestamp;

                return esFechaDeHoy(fechaReferencia);
            })
            .sort((a, b) => {
                const ta = new Date(a.last?.timestamp || 0).getTime();
                const tb = new Date(b.last?.timestamp || 0).getTime();
                return tb - ta;
            });
    }, [chatsEnriquecidos, prospectoPorTel]);

    const statsGenerales = useMemo(() => {
        const total = chatsEnriquecidos.length;
        const conteoPorEstado = new Map(
            ESTADOS_BANDEJA.map((estado) => [estado.key, 0])
        );

        let totalUnread = 0;

        for (const chat of chatsEnriquecidos) {
            const estado = getEstadoBandeja(chat.estado);
            conteoPorEstado.set(
                estado.key,
                (conteoPorEstado.get(estado.key) || 0) + 1
            );
            totalUnread += Number(chat.unread || 0);
        }

        const cierres = chatsEnriquecidos.filter(
            (chat) => resolverEstado(chat.estado).key === "cierre_venta"
        ).length;
        const sinAtender = conteoPorEstado.get(ESTADOS_BANDEJA[0].key) || 0;
        const chatsConUnread = chatsEnriquecidos.filter(
            (chat) => Number(chat.unread || 0) > 0
        ).length;

        return {
            total,
            conteoPorEstado,
            totalUnread,
            tasaConversion: total
                ? Math.round((cierres / total) * 100)
                : 0,
            tasaAtencion: total
                ? Math.round(((total - sinAtender) / total) * 100)
                : 0,
            tasaLectura: total
                ? Math.round(((total - chatsConUnread) / total) * 100)
                : 100,
        };
    }, [chatsEnriquecidos]);

    const nuevosHoySet = useMemo(
        () => new Set(chatsNuevosHoy.map((chat) => chat.telefono)),
        [chatsNuevosHoy]
    );

    const chatsVisibles = useMemo(() => {
        let items = [...filteredChats];

        if (filtroActivo === "nuevos") {
            items = items.filter((chat) => nuevosHoySet.has(chat.telefono));
        } else if (filtroActivo === "no_leidos") {
            items = items.filter((chat) => Number(chat.unread || 0) > 0);
        } else if (filtroActivo === "mios") {
            items = items.filter((chat) => Boolean(chat.esMio));
        }

        return items.sort((a, b) => {
            if (orden === "nombre") {
                return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", {
                    sensitivity: "base",
                });
            }

            const ta = new Date(a.last?.timestamp || 0).getTime();
            const tb = new Date(b.last?.timestamp || 0).getTime();

            if (orden === "antiguo") return ta - tb;
            return tb - ta;
        });
    }, [filteredChats, filtroActivo, nuevosHoySet, orden]);

    const chatsPorColumna = useMemo(() => {
        const map = new Map(ESTADOS_BANDEJA.map((estado) => [estado.key, []]));
        for (const chat of chatsVisibles) {
            const estado = getEstadoBandeja(chat.estado);
            map.get(estado.key)?.push(chat);
        }
        return map;
    }, [chatsVisibles]);

    const noLeidosCount = useMemo(
        () => chatsEnriquecidos.filter((chat) => Number(chat.unread || 0) > 0).length,
        [chatsEnriquecidos]
    );

    const misChatsCount = useMemo(
        () => chatsEnriquecidos.filter((chat) => Boolean(chat.esMio)).length,
        [chatsEnriquecidos]
    );


    const filtroSeleccionado = useMemo(() => {
        if (filtroActivo === "todos") {
            return {
                label: "Todos los chats",
                color: BRAND_BLUE,
                description: "Todas las conversaciones de la línea",
            };
        }

        if (filtroActivo === "nuevos") {
            return {
                label: "Nuevos prospectos",
                color: "#0EA5E9",
                description: "Prospectos que ingresaron hoy",
            };
        }

        if (filtroActivo === "no_leidos") {
            return {
                label: "No leídos",
                color: "#10B981",
                description: "Conversaciones que requieren revisión",
            };
        }

        const estado = ESTADOS_BANDEJA.find(
            (item) => item.key === filtroActivo
        );

        return {
            label: estado?.label || "Prospectos",
            color: estado?.color || BRAND_BLUE,
            description: "Prospectos en esta etapa comercial",
        };
    }, [filtroActivo]);

    function cambiarLinea(numero) {
        const normalized = normalizaTelefonoMx(numero);
        setNumeroAsesorActivo(normalized);
        setFiltroActivo("todos");

        try {
            localStorage.setItem(
                "digitales_numero_asesor_activo",
                normalized
            );
        } catch {
        }
    }

    function abrirProspecto(chat) {
        const prospecto = prospectoPorTel.get(chat.telefono);
        const cita = citaPorTel.get(chat.telefono);
        setProspectoSeleccionado({ ...chat, ...prospecto, cita, estado: prospecto?.estado || chat.estado });
    }

    async function guardarEtapa(chat, label, motivoDescalificacion) {
        const id = chat?.prospectoId;
        if (!id) return;

        const anterior = chat.estado;

        setChats((prev) =>
            prev.map((c) =>
                c.telefono === chat.telefono ? { ...c, estado: label, motivoDescalificacion: motivoDescalificacion || "" } : c
            )
        );
        setProspectoSeleccionado((prev) =>
            prev && prev.telefono === chat.telefono ? { ...prev, estado: label, motivoDescalificacion: motivoDescalificacion || "" } : prev
        );

        try {
            const patch = { estado: label };
            if (motivoDescalificacion) patch.motivo_descalificacion = motivoDescalificacion;
            await api.digitalesPatchProspecto(id, patch);
        } catch (error) {
            console.error("No se pudo actualizar la etapa:", error);
            setChats((prev) =>
                prev.map((c) =>
                    c.telefono === chat.telefono ? { ...c, estado: anterior } : c
                )
            );
            setProspectoSeleccionado((prev) =>
                prev && prev.telefono === chat.telefono ? { ...prev, estado: anterior } : prev
            );
            alert(`No se pudo actualizar la etapa: ${error.message}`);
        }
    }

    return (
        <div className="w-full min-w-0 overflow-x-hidden">
            <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
                <button
                    onClick={() => navigate("/comercial/prospectos")}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-extrabold text-[#131E5C] transition hover:bg-neutral-100"
                    type="button"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </button>

                <div className="hidden h-6 w-px bg-black/10 sm:block" />

                <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-[#131E5C]">
                        Bandeja de chats
                    </div>
                    <div className="truncate text-[10px] font-semibold text-slate-400">
                        Conversaciones y seguimiento de prospectos
                    </div>
                </div>

                {numerosDisponibles.length > 0 ? (
                    <select
                        value={numeroAsesorActivo}
                        onChange={(event) => cambiarLinea(event.target.value)}
                        className="h-9 max-w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        {numerosDisponibles.map((numero) => (
                            <option key={numero} value={numero}>
                                {obtenerEtiquetaLinea(numero)} · {formateaTelUi(numero)}
                            </option>
                        ))}
                    </select>
                ) : null}

                <div className="flex min-w-[220px] flex-1 items-center gap-2 overflow-hidden rounded-2xl bg-neutral-100 px-3 py-2">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        placeholder="Buscar prospecto, teléfono, agencia o mensaje…"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                    />
                    {q ? (
                        <button
                            type="button"
                            onClick={() => setQ("")}
                            className="shrink-0 text-slate-400 hover:text-slate-600"
                            title="Limpiar búsqueda"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>

                {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#131E5C]/50" /> : null}
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="min-w-0 max-w-full overflow-hidden xl:h-[calc(100dvh-150px)] xl:min-h-[620px]">
                    <PipelineSidebar
                        conteoPorEstado={statsGenerales.conteoPorEstado}
                        total={statsGenerales.total}
                        nuevosHoy={chatsNuevosHoy.length}
                        tasaAtencion={statsGenerales.tasaAtencion}
                        tasaConversion={statsGenerales.tasaConversion}
                        tasaLectura={statsGenerales.tasaLectura}
                        filtroActivo={filtroActivo}
                        onFiltroChange={setFiltroActivo}
                    />
                </div>

                {/* BANDEJA*/}
                <section className="flex min-h-[620px] min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm xl:h-[calc(100dvh-150px)]">
                    <div className="shrink-0 border-b border-black/10 bg-white px-3 py-2.5 sm:px-4">
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFiltroActivo("todos")}
                                    className={cls(
                                        "relative rounded-lg px-3 py-2 text-[11px] font-extrabold transition",
                                        filtroActivo === "todos"
                                            ? "bg-[#EEF4FF] text-[#2563EB]"
                                            : "text-slate-500 hover:bg-neutral-50 hover:text-[#131E5C]"
                                    )}
                                >
                                    Todos
                                    <span className="ml-1.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-[#6B8FD9]">
                                        {statsGenerales.total}
                                    </span>
                                    {filtroActivo === "todos" ? (
                                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#3B82F6]" />
                                    ) : null}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFiltroActivo("no_leidos")}
                                    className={cls(
                                        "relative rounded-lg px-3 py-2 text-[11px] font-extrabold transition",
                                        filtroActivo === "no_leidos"
                                            ? "bg-[#EEF4FF] text-[#2563EB]"
                                            : "text-slate-500 hover:bg-neutral-50 hover:text-[#131E5C]"
                                    )}
                                >
                                    No leídos
                                    <span className="ml-1.5 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-[#6B8FD9]">
                                        {noLeidosCount}
                                    </span>
                                    {filtroActivo === "no_leidos" ? (
                                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#3B82F6]" />
                                    ) : null}
                                </button>

                            </div>

                            <select
                                value={orden}
                                onChange={(event) => setOrden(event.target.value)}
                                className="h-8 max-w-full rounded-xl border border-black/10 bg-white px-3 text-[10px] font-bold text-slate-500 outline-none transition hover:border-[#131E5C]/20 focus:border-[#131E5C]/30"
                            >
                                <option value="reciente">Ordenar: Más reciente</option>
                                <option value="antiguo">Ordenar: Más antiguo</option>
                                <option value="nombre">Ordenar: Nombre A-Z</option>
                            </select>
                        </div>
                        
                        {!["todos", "no_leidos", "mios"].includes(filtroActivo) ? (
                            <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5">
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: filtroSeleccionado.color }}
                                />
                                <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-500">
                                    Filtrando por: <span className="text-[#131E5C]">{filtroSeleccionado.label}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFiltroActivo("todos")}
                                    className="shrink-0 rounded-md px-2 py-1 text-[9px] font-extrabold text-[#131E5C] hover:bg-white"
                                >
                                    Quitar
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="min-h-0 min-w-0 flex-1 bg-[#F9FAFB]">
                        {loading && chatsEnriquecidos.length === 0 ? (
                            <div className="flex h-full min-h-[220px] items-center justify-center">
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-xs font-semibold">Cargando conversaciones…</span>
                                </div>
                            </div>
                        ) : (
                            <div ref={kanbanScrollRef} className="flex h-full min-w-0 items-stretch gap-3 overflow-x-auto overflow-y-hidden px-3 py-3">
                                {ESTADOS_BANDEJA.map((estado) => {
                                    const items = chatsPorColumna.get(estado.key) || [];
                                    const activo = filtroActivo === estado.key;
                                    return (
                                        <div
                                            key={estado.key}
                                            ref={(node) => {
                                                if (node) kanbanColumnRefs.current.set(estado.key, node);
                                                else kanbanColumnRefs.current.delete(estado.key);
                                            }}
                                            className={cls(
                                                "flex h-full w-[260px] min-w-0 shrink-0 flex-col overflow-hidden rounded-[12px] border bg-white shadow-sm transition",
                                                activo ? "border-[#131E5C]/25 ring-1 ring-[#131E5C]/10" : "border-[#E5E7EB]"
                                            )}
                                        >
                                            {/* Encabezado de columna */}
                                            <div className="shrink-0 border-b border-[#E5E7EB]/60 px-3 pt-3 pb-2.5">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                        style={{ backgroundColor: estado.color }}
                                                    />
                                                    <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-[#131E5C]">
                                                        {estado.label}
                                                    </span>
                                                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500 ring-1 ring-black/5">
                                                        {items.length}
                                                    </span>
                                                </div>
                                                <div
                                                    className="mt-2 h-[3px] w-full rounded-full"
                                                    style={{ backgroundColor: estado.color }}
                                                />
                                            </div>

                                            {/* Prospectos de la columna */}
                                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-2.5">
                                                {items.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-[#E5E7EB] py-5 text-center text-[10px] font-semibold text-slate-300">
                                                        Sin prospectos
                                                    </div>
                                                ) : (
                                                    items.map((chat) => (
                                                        <ChatCard
                                                            key={chat.id}
                                                            chat={chat}
                                                            onOpen={abrirProspecto}
                                                            onChangeEtapa={guardarEtapa}
                                                            selected={prospectoSeleccionado?.telefono === chat.telefono}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-black/10 bg-white px-4 py-2.5">
                        <div className="text-[10px] font-semibold text-slate-400">
                            Mostrando <span className="font-extrabold text-[#131E5C]">{chatsVisibles.length}</span> de {statsGenerales.total} conversaciones
                        </div>
                        {filtroActivo !== "todos" ? (
                            <button
                                type="button"
                                onClick={() => setFiltroActivo("todos")}
                                className="rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-[#131E5C] transition hover:bg-[#131E5C]/5"
                            >
                                Quitar filtro
                            </button>
                        ) : null}
                    </div>
                </section>
            </div>

            <ProspectoDrawer
                key={prospectoSeleccionado?.telefono || "ninguno"}
                open={Boolean(prospectoSeleccionado)}
                prospecto={prospectoSeleccionado}
                onClose={() => setProspectoSeleccionado(null)}
                onOpenChat={(telefono) => setDrawerTel(telefono)}
            />

            <ChatDrawer
                open={Boolean(drawerTel)}
                telefono={drawerTel}
                numeroAsesor={numeroAsesorActivo}
                onClose={() => setDrawerTel("")}
            />
        </div>
    );
}
