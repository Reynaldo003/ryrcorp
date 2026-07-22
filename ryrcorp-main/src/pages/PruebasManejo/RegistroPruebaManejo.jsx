// src/pages/PruebasManejo/RegistroPruebaManejo.jsx
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays, ArrowUpDown,
    ChevronDown, ChevronUp, Trash2, Loader2, Phone, Mail, UserStar,
    FileText, Hash, Building2, MessageSquareText, Camera, Eye,
    UploadCloud, Copy, LayoutList, CalendarRange, BarChart3,
    ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiPruebaManejo, apiEvidenciasPruebaManejo } from "../../lib/apiPruebaManejo";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

const BRAND_BLUE = "#131E5C";
const API_BASE = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const CHART_COLORS = [
    "#131E5C", "#2563EB", "#0EA5E9", "#06B6D4", "#10B981",
    "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);
const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function normalizeStr(v) { return String(v ?? "").trim(); }

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                        </div>
                        <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15" aria-label="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}

function fromDTLocalToISO(dtLocalOrEmpty) {
    const v = String(dtLocalOrEmpty || "").trim();
    return v ? v : null;
}

function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function startOfWeekMonday(date) {
    const d = new Date(date);
    const jsDay = d.getDay();
    const deltaToMonday = (jsDay + 6) % 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - deltaToMonday);
    return d;
}

function formatWeekTitle(startDate, endDate) {
    const start = startDate.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
    const end = endDate.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    return `${start} — ${end}`;
}

function weekdayShortEs(dateObj) {
    return DAYS_ES[dateObj.getDay()] || "";
}

function formatCardTime(dateLike) {
    if (!dateLike) return "—";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function getHourKey(dateLike) {
    if (!dateLike) return "";
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" />Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>Cerrar</button>
            </div>
        </div>,
        document.body
    );
}

function formatBytes(bytes = 0) {
    if (!bytes) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0; let v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function resolveMediaUrl(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    if (u.startsWith("media/")) return `${API_BASE}/${u}`;
    return `${API_BASE}/media/${u}`;
}

function isImageMime(mime = "") { return String(mime || "").toLowerCase().startsWith("image/"); }
function guessIsImageFromName(name = "") {
    const n = String(name || "").toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => n.endsWith(ext));
}

function EvidenciasUploader({ evidencias = [], onSubir, onEliminar, disabled }) {
    const inputPickRef = useRef(null);
    const inputCamRef = useRef(null);
    const [preview, setPreview] = useState({ open: false, url: "", title: "", mime: "" });

    const openPreview = (ev) => {
        const url = resolveMediaUrl(ev?.archivo);
        if (!url) return;
        setPreview({ open: true, url, title: ev?.nombre_original || "Evidencia", mime: ev?.tipo_mime || "" });
    };
    const closePreview = () => setPreview({ open: false, url: "", title: "", mime: "" });

    const copyLink = async (ev) => {
        const url = resolveMediaUrl(ev?.archivo);
        if (!url) return;
        try { await navigator.clipboard.writeText(url); alert("Link copiado ✅"); }
        catch { alert("No se pudo copiar."); }
    };

    return (
        <div className="space-y-3">
            <input ref={inputPickRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; if (!f.length) return; onSubir?.(f); }} />
            <input ref={inputCamRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; if (!f.length) return; onSubir?.(f); }} />
            <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => inputCamRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white shadow-lg px-4 py-3 text-sm font-semibold text-[#131E5C] hover:bg-neutral-50 disabled:opacity-60">
                    <Camera className="h-4 w-4" /> Tomar foto
                </button>
                <button type="button" onClick={() => inputPickRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white shadow-lg px-4 py-3 text-sm font-semibold text-[#131E5C] hover:bg-neutral-50 disabled:opacity-60">
                    <UploadCloud className="h-4 w-4" /> Adjuntar archivos
                </button>
            </div>
            {(!evidencias || evidencias.length === 0) ? (
                <div className="rounded-lg border border-black/10 bg-neutral-100 p-4 text-sm text-slate-500">Sin evidencias.</div>
            ) : (
                <>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {evidencias.map((ev) => {
                            const url = resolveMediaUrl(ev?.archivo);
                            const isImg = isImageMime(ev?.tipo_mime) || guessIsImageFromName(ev?.nombre_original);
                            return (
                                <div key={ev.id} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                                    <div className="relative aspect-[16/10] bg-neutral-100">
                                        {isImg && url ? (
                                            <img src={url} alt={ev?.nombre_original || "evidencia"} className="h-full w-full object-cover" loading="lazy"
                                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-500"><FileText className="h-7 w-7" /></div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2">
                                            <div className="truncate text-xs font-extrabold text-white">{ev?.nombre_original || "archivo"}</div>
                                            <div className="text-[11px] text-white/80">{formatBytes(ev?.tamano_bytes || 0)} • {ev?.tipo_mime || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-2">
                                        <div className="flex items-center gap-2">
                                            {url ? <button type="button" onClick={() => openPreview(ev)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#131E5C] hover:bg-neutral-50"><Eye className="h-4 w-4" />Ver</button> : null}
                                            {url ? <button type="button" onClick={() => copyLink(ev)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#131E5C] hover:bg-neutral-50"><Copy className="h-4 w-4" />Link</button> : null}
                                        </div>
                                        <button type="button" disabled={disabled} onClick={() => onEliminar?.(ev)} className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-600 disabled:opacity-60">
                                            <Trash2 className="h-4 w-4" />Quitar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Modal open={preview.open} title={preview.title || "Evidencia"} onClose={closePreview}
                        footer={
                            <>
                                <button onClick={closePreview} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600"><X className="h-4 w-4" />Cerrar</button>
                                {preview.url ? <button onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white"><Eye className="h-4 w-4" />Abrir en pestaña</button> : null}
                            </>
                        }>
                        <div className="space-y-3">
                            {preview.url ? (
                                <div className="rounded-xl border border-black/10 bg-white p-3">
                                    {(preview.mime || "").toLowerCase().startsWith("image/") ? (
                                        <img src={preview.url} alt={preview.title} className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain" />
                                    ) : (
                                        <div className="text-sm text-slate-600">Este archivo no es imagen. Usa "Abrir en pestaña".</div>
                                    )}
                                </div>
                            ) : null}
                            {preview.url ? <div className="break-all text-xs text-slate-500">{preview.url}</div> : null}
                        </div>
                    </Modal>
                </>
            )}
        </div>
    );
}

// ========== COMPONENTE DE AGENDA SEMANAL ==========
function AgendaSemanalView({ rows, loading, onEdit, onNewAtSlot, onToggleAsistencia, updatingInline }) {
    const [weekRef, setWeekRef] = useState(new Date());
    const today = new Date();

    const weekDates = useMemo(() => {
        const d = new Date(weekRef);
        const jsDay = d.getDay();
        const deltaToMonday = (jsDay + 6) % 7;
        const monday = new Date(d);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(d.getDate() - deltaToMonday);
        return Array.from({ length: 7 }, (_, i) => {
            const nd = new Date(monday);
            nd.setDate(monday.getDate() + i);
            return nd;
        });
    }, [weekRef]);

    const goNext = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); };
    const goPrev = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); };
    const goToday = () => setWeekRef(new Date());

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const registrosByDayHour = useMemo(() => {
        const map = {};
        for (const row of rows) {
            if (!row.fecha_hora_cita) continue;
            const dt = new Date(row.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) continue;
            const dayKey = toYMDLocal(dt);
            const hour = dt.getHours();
            if (!map[dayKey]) map[dayKey] = {};
            if (!map[dayKey][hour]) map[dayKey][hour] = [];
            map[dayKey][hour].push(row);
        }
        return map;
    }, [rows]);

    const weekLabel = useMemo(() => {
        const start = weekDates[0];
        const end = weekDates[6];
        const smth = MONTHS_ES[start.getMonth()];
        const emth = MONTHS_ES[end.getMonth()];
        const yr = end.getFullYear();
        if (start.getMonth() === end.getMonth())
            return `${start.getDate()} – ${end.getDate()} de ${smth} de ${yr}`;
        return `${start.getDate()} de ${smth} – ${end.getDate()} de ${emth} de ${yr}`;
    }, [weekDates]);

    return (
        <div className="rounded-lg border border-black/10 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10">
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Semana</div>
                    <div className="text-sm font-extrabold text-[#131E5C]">{weekLabel}</div>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 font-semibold">Prueba de Manejo</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={goPrev} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#131E5C]/20 hover:bg-[#131E5C]/5 text-[#131E5C]">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={goToday} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#131E5C] text-[#131E5C] hover:bg-[#131E5C] hover:text-white transition">
                        Semana
                    </button>
                    <button onClick={goNext} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#131E5C]/20 hover:bg-[#131E5C]/5 text-[#131E5C]">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-auto">
                <table className="min-w-full border-collapse" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                        <col style={{ width: "64px" }} />
                        {HOURS.map((_, i) => (
                            <col key={i} style={{ width: `calc((100% - 64px) / ${HOURS.length})` }} />
                        ))}
                    </colgroup>

                    <thead>
                        <tr>
                            <th className="px-2 py-3 text-xs font-bold text-slate-400 bg-white border-b border-r border-black/10">Día</th>
                            {HOURS.map((hour, i) => (
                                <th key={i} className="px-2 py-3 text-center border-b border-r border-black/10 bg-white">
                                    <div className="text-xs font-bold text-[#131E5C]">{String(hour).padStart(2, "0")}:00</div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={HOURS.length + 1} className="px-4 py-16 text-center text-[#131E5C]">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    <span className="text-sm font-semibold">Cargando pruebas...</span>
                                </td>
                            </tr>
                        ) : (
                            weekDates
                                .filter(d => d.getDay() !== 0)
                                .map((d, di) => {
                                    const isToday = isSameDay(d, today);
                                    return (
                                        <tr key={di} className="group">
                                            <td className="px-2 py-0 text-xs font-bold text-slate-400 border-r border-b border-black/10 align-top pt-2 bg-white">
                                                <div className={`inline-flex flex-col items-center justify-center px-2 py-[2px] rounded-full ${isToday ? "bg-[#131E5C] text-white" : ""}`}>
                                                    <div className={`text-[10px] font-semibold leading-none ${isToday ? "text-white/70" : "text-slate-400"}`}>
                                                        {DAYS_ES[d.getDay()]}
                                                    </div>
                                                    <div className={`text-xs font-bold leading-none ${isToday ? "text-white" : "text-[#131E5C]"}`}>
                                                        {d.getDate()}/{String(d.getMonth() + 1).padStart(2, "0")}
                                                    </div>
                                                </div>
                                            </td>
                                            {HOURS.map((hour, hi) => {
                                                const dayKey = toYMDLocal(d);
                                                const registros = registrosByDayHour?.[dayKey]?.[hour] || [];
                                                return (
                                                    <td key={hi} className="border-r border-b border-black/10 align-top p-1 relative group/cell bg-white hover:bg-slate-50" style={{ minHeight: "72px", verticalAlign: "top" }}>
                                                        {registros.length === 0 && (
                                                            <button
                                                                onClick={() => onNewAtSlot(d, hour)}
                                                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-[#131E5C]/10 text-[#131E5C] opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#131E5C] hover:text-white"
                                                                title={`Nueva prueba ${String(hour).padStart(2, "0")}:00`}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        <div className="flex flex-col gap-2">
                                                            {registros.map((registro) => {
                                                                const dt = new Date(registro.fecha_hora_cita);
                                                                const mins = String(dt.getMinutes()).padStart(2, "0");
                                                                const isUpdating = !!updatingInline?.[registro.id];
                                                                const nombreCliente = registro?.cliente?.nombre || "—";
                                                                const telefono = registro?.cliente?.telefono || "—";
                                                                const autoInteres = registro.auto_interes || "—";
                                                                const asesorPiso = registro.asesor_piso || "—";
                                                                return (
                                                                    <div key={registro.id} onClick={() => onEdit(registro)} className={`rounded-md p-2 text-left cursor-pointer hover:opacity-90 transition-all ${registro.asistencia ? "bg-emerald-50 border-emerald-400" : "bg-orange-50 border-orange-400"} border-l-4 shadow-sm`}>
                                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                                            <span className="text-xs font-bold text-[#131E5C]">{String(hour).padStart(2, "0")}:{mins}</span>
                                                                            <button
                                                                                disabled={isUpdating}
                                                                                onClick={(e) => { e.stopPropagation(); onToggleAsistencia?.(registro); }}
                                                                                className={[
                                                                                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                                                                    registro.asistencia ? "bg-emerald-200 text-emerald-800 border-emerald-300" : "bg-red-200 text-red-800 border-red-300",
                                                                                    isUpdating ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
                                                                                ].join(" ")}
                                                                            >
                                                                                {isUpdating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                                                                                {registro.asistencia ? "✓ Asistió" : "✗ No"}
                                                                            </button>
                                                                        </div>
                                                                        <div className="text-sm font-extrabold text-[#131E5C] truncate">{nombreCliente}</div>
                                                                        <div className="text-xs font-semibold text-slate-600 truncate">🚗 {autoInteres}</div>
                                                                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {telefono}</div>
                                                                        <div className="text-[10px] text-slate-500 truncate"><span className="font-semibold">Asesor:</span> {asesorPiso}</div>
                                                                        {registro.comentarios_cliente && registro.comentarios_cliente !== "" && (
                                                                            <div className="text-[10px] text-slate-400 italic truncate mt-1">💬 {registro.comentarios_cliente.substring(0, 50)}</div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-black/10 bg-slate-50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Asistió
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Pendiente
                </div>
            </div>
        </div>
    );
}

// ========== COMPONENTE DE GRÁFICAS ==========
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-xl">
            <div className="text-xs font-extrabold text-[#131E5C] mb-1">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="text-xs text-slate-600"><span className="font-bold" style={{ color: p.color }}>{p.value}</span> prueba{p.value !== 1 ? "s" : ""}</div>
            ))}
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-xl">
            <div className="text-xs font-extrabold text-[#131E5C]">{payload[0].name}</div>
            <div className="text-xs text-slate-600"><span className="font-bold text-[#131E5C]">{payload[0].value}</span> prueba{payload[0].value !== 1 ? "s" : ""}</div>
        </div>
    );
};

function StatCard({ label, value, icon: Icon, color = BRAND_BLUE }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: `${color}15` }}>
                <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
                <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
                <div className="text-xs font-semibold text-slate-500">{label}</div>
            </div>
        </div>
    );
}

function GraficasView({ registros }) {
    const porDealer = useMemo(() => {
        const mapa = {};
        for (const r of registros) { const k = r.agencia || "Sin dealer"; mapa[k] = (mapa[k] || 0) + 1; }
        return Object.entries(mapa).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [registros]);

    const porModelo = useMemo(() => {
        const mapa = {};
        for (const r of registros) { const k = r.auto_interes || "Sin modelo"; mapa[k] = (mapa[k] || 0) + 1; }
        return Object.entries(mapa).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [registros]);

    const porAsesor = useMemo(() => {
        const mapa = {};
        for (const r of registros) { const k = r.asesor_piso || "Sin asesor"; mapa[k] = (mapa[k] || 0) + 1; }
        return Object.entries(mapa).map(([name, value]) => ({ name: name.split(" ").slice(0, 2).join(" "), fullName: name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [registros]);

    const asistenciaData = useMemo(() => {
        let asistieron = 0, noAsistieron = 0;
        for (const r of registros) { if (r.asistencia) asistieron++; else noAsistieron++; }
        return [{ name: "Asistieron", value: asistieron }, { name: "No asistieron", value: noAsistieron }];
    }, [registros]);

    const porDia = useMemo(() => {
        const dias = []; const mapa = {};
        for (const r of registros) {
            if (!r.fecha_hora_cita) continue;
            const ymd = toYMDLocal(r.fecha_hora_cita);
            if (ymd) mapa[ymd] = (mapa[ymd] || 0) + 1;
        }
        for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ymd = toYMDLocal(d);
            dias.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, value: mapa[ymd] || 0, ymd });
        }
        return dias;
    }, [registros]);

    const totalAsistieron = asistenciaData[0].value;
    const pctAsistencia = registros.length > 0 ? Math.round((totalAsistieron / registros.length) * 100) : 0;

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total pruebas" value={registros.length} icon={CarFront} color="#131E5C" />
                <StatCard label="Asistencias" value={totalAsistieron} icon={CheckCircle2} color="#10B981" />
                <StatCard label="% Asistencia" value={`${pctAsistencia}%`} icon={BarChart3} color="#2563EB" />
                <StatCard label="Dealers activos" value={new Set(registros.map(r => r.agencia).filter(Boolean)).size} icon={Building2} color="#F59E0B" />
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por día (últimos 14 días)</div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={porDia} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={BRAND_BLUE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por Dealer</div>
                    {porDealer.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={porDealer} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={100} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>{porDealer.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Tasa de Asistencia</div>
                    {registros.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={asistenciaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                                    <Cell fill="#10B981" /><Cell fill="#E5E7EB" />
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend formatter={(val) => <span className="text-xs font-semibold text-slate-600">{val}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por Modelo (Top 10)</div>
                    {porModelo.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div> : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={porModelo} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{porModelo.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por Asesor (Top 10)</div>
                    {porAsesor.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div> : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={porAsesor} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={110} />
                                <Tooltip content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const item = porAsesor.find(a => a.name === payload[0]?.payload?.name);
                                    return (
                                        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-xl max-w-[200px]">
                                            <div className="text-xs font-extrabold text-[#131E5C] mb-1 break-words">{item?.fullName || payload[0]?.payload?.name}</div>
                                            <div className="text-xs text-slate-600"><span className="font-bold text-[#131E5C]">{payload[0].value}</span> prueba{payload[0].value !== 1 ? "s" : ""}</div>
                                        </div>
                                    );
                                }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>{porAsesor.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}


export default function RegistroPruebaManejo() {
    const { user } = useAuth();

    const permisos = user?.permisos || [];
    const rol = String(user?.rol || "").trim().toLowerCase();

    const isAdmin = useMemo(() => {
        return (
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN") ||
            permisos.includes("CRM_DIGITALES")
        );
    }, [rol, permisos]);

    const userAgencias = useMemo(() => {
        return String(user?.agencia || "")
            .split("|")
            .map((a) => normalizeStr(a))
            .filter(Boolean);
    }, [user?.agencia]);

    const userAgencia = userAgencias[0] || "";

    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            const agencia = normalizeStr(agenciaRegistro);
            if (!agencia) return false;
            return userAgencias.some(
                (agenciaUsuario) =>
                    agenciaUsuario.toLowerCase() === agencia.toLowerCase()
            );
        },
        [userAgencias]
    );

    const [registros, setRegistros] = useState([]);
    const [vistaActiva, setVistaActiva] = useState("tabla");
    const [currentWeekDate, setCurrentWeekDate] = useState(new Date());

    const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];
    const ASESORES = [
        "ADRIAN GALVEZ ROLDAN",
        "AURA MARLIZETH FERNANDEZ LOPEZ",
        "Bianca Isabel Chavez Alarcon",
        "Blanca Patricia Hernández Hernández",
        "CANDY DENISSE MARQUEZ CORTES",
        "Carlos Arturo Garces Vengas",
        "Cesar Ivan Salazar Reyes",
        "Cristian Fernando Rivera Godinez",
        "David Uriel García Navarro",
        "DELMAR JAVIER ILLESCAS DOMINGUEZ",
        "DULCE ABIGAIL GARCIA OLIVARES",
        "EDGAR JESUS GOMEZ PEREZ",
        "Edgar Omar Noguera Solis",
        "ELIA INES ARANO REYES",
        "ERENDIRA SANTOS COYOTZI",
        "Estefano Marlom De Azcue Aparicio",
        "Felix Emmanuel Solis Angeles",
        "GEOVANI NAVA DIAZ",
        "GERMAN JARITH SALAZAR MIRANDA",
        "Gustavo Chontal Romero",
        "Hector Rodriguez",
        "IDALMY JIMENEZ SANCHEZ",
        "IRENE DEL CARMEN GUIZA LOPEZ",
        "Iris Yazmín Gómez Velázquez",
        "Israel Garcia Juarez",
        "IVAN JUAREZ ORTEGA",
        "Javier Perez Meraz",
        "JESSICA OLIVARES CAMPOS",
        "JESUS XITLAMA GOMEZ",
        "JORGE ANTONIO RODRIGUEZ MARTINEZ",
        "JORGE LUIS ALAMILLO RODRIGUEZ",
        "JOSE ALBERTO SEDAS FLORES",
        "JOSE ALFREDO BARRANCA REYES",
        "JOSE DE JESUS GARCIA ROMAN",
        "JUAN JESUS MARQUEZ AQUINO",
        "JUAN MANUEL SOBREVILLA VICENCIO",
        "JULIO RAMIREZ LOPEZ",
        "LIZBETH CANO CLARA",
        "Luis Alberto Ramirez Santamaria",
        "LUIS ALFONSO CORIA MARROQUIN",
        "Luis Armando Almora Perez",
        "Luis Manuel Alvarez Martinez",
        "Luis Manuel Hernández Espejo",
        "LUIS MANUEL PALOMARES OLAYO",
        "Mara Erubey Soto Villegas",
        "MARCOS RAUL DIAZ RAMOS",
        "Marelly Tenorio Salinas",
        "MARIA DE GUADALUPE VANVOLLENHOVEN DIAZ",
        "MARIA DEL CARMEN ZAVALA VELAZQUEZ",
        "Maria Monserrath Zarate Gamboa",
        "MARIO ALBERTO LOPEZ RAMOS",
        "MARISOL LAGUNES GONZALEZ",
        "Miguel Capitanachi Paredes",
        "NALLELY HERNANDEZ GARCIA",
        "OCTAVIO BRUNO GONZALEZ",
        "OLIMPIA VAZQUEZ MENDEZ",
        "OMAR VILLIERS MONDRAGON",
        "Paul Serrano Vera",
        "Roberto Ramses Luna Fajardo",
        "ROGELIO VAZQUEZ SANCHEZ",
        "RUBEN ALBERTO TOSQUY ADRIANO",
        "RUBEN ROMERO VALDES",
        "Saja Azzam Mohammad Jamous",
        "SANDRA LUZ PRIETO PEREZ",
        "Sergio Ivan Quintana Martinez",
        "Sergio Rene Delgado Sarmiento",
        "Valeria Zilli Durante",
        "VANESSA JIMENEZ MEDINA",
        "VERONICA CASTILLO FUENTES",
        "YAMIL MISAEL RODRIGUEZ AGUILAR",
        "Yoseth Ruiz Castellanos",
        "ZEILA NAVARRO CONTRERAS",
    ];

    const VEHICULOS = [
        "Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun",
        "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort] = useState({ key: "fecha_hora_cita", dir: "desc" });

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});

    const REQUIRED = useMemo(() => ({ telefono: "Teléfono", fecha_hora_cita: "Fecha y hora" }), []);
    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        const m = [];
        for (const key of Object.keys(REQUIRED)) {
            const v = draft[key];
            const isEmpty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
            if (isEmpty) m.push(key);
        }
        return m;
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIs10 = useMemo(() => /^\d{10}$/.test(telDigits), [telDigits]);
    const telIs52Plus10 = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);
    const telIsOk = telIs10 || telIs52Plus10;
    const telIsNormalized = telIs52Plus10;

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (telIs10 || telIs52Plus10) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (formato inválido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: para 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits, telIs10, telIs52Plus10]);

    const telInvalid = !!telError;
    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    useEffect(() => {
        const onGlobal = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);
        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };

    const refreshList = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = await apiPruebaManejo.list();
            setRegistros(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e); setRegistros([]);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { refreshList(); }, [refreshList]);

    useEffect(() => {
        if (vistaActiva === "tabla") return;
        const interval = setInterval(() => { refreshList(); }, 60_000);
        return () => clearInterval(interval);
    }, [vistaActiva, refreshList]);

    const dealers = useMemo(() => {
        const set = new Set((registros || []).map((r) => normalizeStr(r.agencia)).filter(Boolean));
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }
        return ["Todos", ...Array.from(set)];
    }, [registros, isAdmin, userAgencias]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (registros || []).filter((r) => {
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(r.agencia)) return false;

            const clienteNombre = normalizeStr(r?.cliente?.nombre);
            const clienteTel = normalizeStr(r?.cliente?.telefono);
            const clienteCorreo = normalizeStr(r?.cliente?.correo);
            const matchQ = !q ||
                normalizeStr(r.agencia).toLowerCase().includes(q) ||
                clienteNombre.toLowerCase().includes(q) ||
                clienteTel.toLowerCase().includes(q) ||
                clienteCorreo.toLowerCase().includes(q) ||
                normalizeStr(r.auto_interes).toLowerCase().includes(q) ||
                normalizeStr(r.asesor_piso).toLowerCase().includes(q) ||
                normalizeStr(r.num_serie).toLowerCase().includes(q) ||
                normalizeStr(r.folio_salida).toLowerCase().includes(q) ||
                normalizeStr(r.comentarios_cliente).toLowerCase().includes(q);

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(r.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymd = r.fecha_hora_cita ? toYMDLocal(r.fecha_hora_cita) : "";
                const ymdInt = ymdToInt(ymd);
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchRango;
        });
    }, [registros, filters, isAdmin, userAgencias, userTieneAgencia]);

    const agendaRows = filtered;

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "fecha_hora_cita") {
                const ta = a.fecha_hora_cita ? new Date(a.fecha_hora_cita).getTime() : 0;
                const tb = b.fecha_hora_cita ? new Date(b.fecha_hora_cita).getTime() : 0;
                return (ta - tb) * mult;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult; if (va > vb) return 1 * mult; return 0;
        });
    }, [filtered, sort]);

    const openCreate = (fechaHoraDefault = "") => {
        setTouchedSave(false); setMode("create");
        setDraft({
            id: null,
            agencia: isAdmin ? "" : userAgencias[0] || "",
            nombre: "", telefono: "", correo: "",
            auto_interes: "", fecha_hora_cita: fechaHoraDefault, asistencia: false,
            num_serie: "", asesor_piso: "", folio_salida: "", comentarios_cliente: "",
            evidencias: [],
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const c = await apiPruebaManejo.get(row.id);

            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false); return;
            }

            setDraft({
                id: c.id,
                agencia: c.agencia || (isAdmin ? "" : userAgencias[0] || ""),
                nombre: c?.cliente?.nombre || "", telefono: c?.cliente?.telefono || "", correo: c?.cliente?.correo || "",
                auto_interes: c.auto_interes || "", fecha_hora_cita: toDTLocal(c.fecha_hora_cita), asistencia: !!c.asistencia,
                num_serie: c.num_serie || "", asesor_piso: c.asesor_piso || "", folio_salida: c.folio_salida || "",
                comentarios_cliente: c.comentarios_cliente || "", evidencias: Array.isArray(c.evidencias) ? c.evidencias : [],
            });
        } catch (e) {
            console.error(e); alert("No se pudo abrir el registro."); setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => { if (saving || subiendoEvidencia) return; setOpenModal(false); setDraft(null); };

    const eliminarRegistro = async (row) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia."); return;
        }

        const clienteNombre = row?.cliente?.nombre || row?.cliente?.telefono || "esta prueba";
        if (!confirm(`¿Eliminar la prueba de manejo de ${clienteNombre}? Esta acción no se puede deshacer.`)) return;
        try {
            await apiPruebaManejo.remove(row.id);
            setRegistros((prev) => prev.filter((x) => x.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telIsOk || telInvalid) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : normalizeStr(draft.agencia || userAgencias[0] || "");
            const payload = {
                agencia: agenciaFinal, nombre: draft.nombre || "",
                telefono: normalizeStr(draft.telefono), correo: draft.correo || "",
                auto_interes: draft.auto_interes || "", fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita),
                asistencia: !!draft.asistencia, num_serie: draft.num_serie || "",
                asesor_piso: draft.asesor_piso || "", folio_salida: draft.folio_salida || "",
                comentarios_cliente: draft.comentarios_cliente || "",
            };
            let saved;
            if (mode === "create") saved = await apiPruebaManejo.create(payload);
            else saved = await apiPruebaManejo.update(draft.id, payload);
            await refreshList();
            if (mode === "create" && saved?.id) {
                const detalle = await apiPruebaManejo.get(saved.id);
                setDraft((p) => ({ ...p, id: detalle.id, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
                setMode("edit"); return;
            }
            closeModal();
        } catch (e) { console.error(e); alert("Error guardando."); } finally { setSaving(false); }
    };

    const toggleAsistenciaInline = async (row) => {
        const id = row?.id; if (!id) return;
        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) { alert("Sin permisos."); return; }
        const prev = !!row.asistencia;
        setRegistros((p) => p.map((c) => (c.id === id ? { ...c, asistencia: !prev } : c)));
        setUpdatingInline((p) => ({ ...p, [id]: true }));
        try { await apiPruebaManejo.patch(id, { asistencia: !prev }); }
        catch (e) { console.error(e); setRegistros((p) => p.map((c) => (c.id === id ? { ...c, asistencia: prev } : c))); alert("No se pudo actualizar."); }
        finally { setUpdatingInline((p) => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const subirEvidencias = async (files) => {
        if (!draft?.id) { alert("Primero guarda la prueba para adjuntar evidencias."); return; }
        setSubiendoEvidencia(true);
        try {
            for (const f of files) await apiEvidenciasPruebaManejo.create({ id_prueba_manejo: draft.id, archivo: f });
            const detalle = await apiPruebaManejo.get(draft.id);
            setDraft((p) => ({ ...p, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
        } catch (e) { console.error(e); alert("No se pudieron subir evidencias."); } finally { setSubiendoEvidencia(false); }
    };

    const eliminarEvidencia = async (ev) => {
        if (!confirm(`¿Eliminar evidencia "${ev?.nombre_original || "archivo"}"?`)) return;
        setSubiendoEvidencia(true);
        try {
            await apiEvidenciasPruebaManejo.remove(ev.id);
            const detalle = await apiPruebaManejo.get(draft.id);
            setDraft((p) => ({ ...p, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
        } catch (e) { console.error(e); alert("No se pudo eliminar evidencia."); } finally { setSubiendoEvidencia(false); }
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const setHoy = () => { const hoy = toYMDLocal(new Date()); setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy })); };

    const VISTAS = [
        { key: "tabla", label: "Tabla", icon: LayoutList },
        { key: "agenda", label: "Agenda", icon: CalendarRange },
        { key: "graficas", label: "Gráficas", icon: BarChart3 },
    ];

    if (!isAdmin && userAgencias.length === 0) {
        return (
            <div className="w-full">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                    No se ha asignado una sucursal a tu usuario. Contacta al administrador.
                </div>
            </div>
        );
    }

    const exportarExcel = () => {
        const titulo = [["REPORTE PRUEBAS DE MANEJO — GRUPO AUTOMOTRIZ R&R"]];
        const fechaGen = [[`Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`]];
        const filtrosActivos = [];
        if (filters.agencia !== "Todos") filtrosActivos.push(`Dealer: ${filters.agencia}`);
        if (filters.rangoDesde) filtrosActivos.push(`Desde: ${filters.rangoDesde}`);
        if (filters.rangoHasta) filtrosActivos.push(`Hasta: ${filters.rangoHasta}`);
        if (filters.q) filtrosActivos.push(`Búsqueda: "${filters.q}"`);
        const filtroFila = [[filtrosActivos.length ? `Filtros activos: ${filtrosActivos.join("  |  ")}` : "Sin filtros activos"]];
        const totalFila = [[`Total de registros: ${sorted.length}`]];

        const encabezados = [[
            "N°", "Fecha y Hora", "Dealer", "Cliente", "Teléfono", "Correo",
            "Auto Interés", "Asesor Piso", "No. Serie", "Folio Pase Salida",
            "¿Asistió?", "Comentarios", "Evidencias",
        ]];

        const filas = sorted.map((row, i) => ([
            i + 1,
            row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—",
            row.agencia || "—",
            row?.cliente?.nombre || "—",
            row?.cliente?.telefono || "—",
            row?.cliente?.correo || "—",
            row.auto_interes || "—",
            row.asesor_piso || "—",
            row.num_serie || "—",
            row.folio_salida || "—",
            row.asistencia ? "Sí" : "No",
            row.comentarios_cliente || "—",
            Array.isArray(row.evidencias) ? row.evidencias.length : 0,
        ]));

        const ws = XLSX.utils.aoa_to_sheet([...titulo, ...fechaGen, ...filtroFila, ...totalFila, [[]], ...encabezados, ...filas]);
        ws["!cols"] = [
            { wch: 5 }, { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 14 },
            { wch: 28 }, { wch: 16 }, { wch: 36 }, { wch: 20 }, { wch: 18 },
            { wch: 10 }, { wch: 40 }, { wch: 10 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pruebas de Manejo");
        XLSX.writeFile(wb, `pruebas_manejo_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Pruebas de Manejo</h2>
                    <p className="text-sm text-slate-400">
                        {vistaActiva === "tabla" && "Doble clic para editar la información."}
                        {vistaActiva === "agenda" && "Visualiza las pruebas en el calendario semanal."}
                        {vistaActiva === "graficas" && "Estadísticas en tiempo real · Se actualiza cada 60 s."}
                    </p>
                    {!isAdmin && userAgencias.length > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencias.join(", ")}</span>
                        </p>
                    ) : null}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg border border-[#131E5C]/20 bg-white overflow-hidden shadow-sm">
                        {VISTAS.map(({ key, label, icon: Icon }) => (
                            <button key={key} onClick={() => setVistaActiva(key)}
                                className={["inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors", vistaActiva === key ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-[#131E5C]/5"].join(" ")}>
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={exportarExcel}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-xs font-black text-[#131E5C] hover:bg-[#131E5C] hover:text-white transition"
                        title="Exportar a Excel"
                    >
                        <FileDown className="h-4 w-4" />
                        Exportar Excel
                    </button>
                    <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm">
                        <Plus className="h-4 w-4" />Nueva Prueba
                    </button>
                </div>
            </div>

            {vistaActiva === "tabla" && (
                <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                            <FilterBlock label="Búsqueda">
                                <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                    <Search className="h-4 w-4 text-[#131E5C]" />
                                    <input value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Buscar por dealer, cliente, teléfono, serie, folio, asesor…" className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]" />
                                    {filters.q ? <button onClick={() => setFilters((p) => ({ ...p, q: "" }))} className="rounded-lg p-1 bg-white text-[#131E5C] hover:bg-white/80 hover:text-red-500" aria-label="Limpiar búsqueda"><X className="h-4 w-4" /></button> : null}
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-3">
                            <FilterBlock label="Dealer">
                                <select value={filters.agencia} onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                    {dealers.map((d) => (<option key={d} value={d} className="bg-neutral-100 text-[#131E5C]">{d}</option>))}
                                </select>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-3">
                            <FilterBlock label="Acciones">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={setHoy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"><CalendarDays className="h-4 w-4" />Hoy</button>
                                    <button onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] px-3 py-2 text-sm font-semibold bg-white text-[#131E5C] hover:text-white hover:bg-[#131E5C]"><X className="h-4 w-4" />Limpiar</button>
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Desde"><input type="date" value={filters.rangoDesde} onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" /></FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Hasta"><input type="date" value={filters.rangoHasta} onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" /></FilterBlock>
                        </div>
                    </div>
                </div>
            )}

            {vistaActiva === "tabla" && (
                <>
                    <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("fecha_hora_cita")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Fecha y Hora <span className="opacity-60">{sort.key === "fecha_hora_cita" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}</span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("agencia")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Dealer <span className="opacity-60">{sort.key === "agencia" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}</span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3">Auto interés</th>
                                        <th className="px-4 py-3">Asesor piso</th>
                                        <th className="px-4 py-3">No. Serie</th>
                                        <th className="px-4 py-3">Folio Pase Salida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? (
                                        <>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</>
                                    ) : (
                                        <>
                                            {sorted.map((row) => {
                                                const clienteNombre = row?.cliente?.nombre || "—";
                                                return (
                                                    <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} className="cursor-pointer hover:bg-white/[0.04]" title="Doble clic para editar">
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</td>
                                                        <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="font-bold">{clienteNombre}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.auto_interes || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.asesor_piso || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.num_serie || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.folio_salida || "—"}</td>
                                                    </tr>
                                                );
                                            })}
                                            {sorted.length === 0 ? (
                                                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</td></tr>
                                            ) : null}
                                        </>
                                    )}
                                </tbody>
                            </table>
                            <ContextMenu ctxMenu={ctxMenu} onDelete={async (row) => { await eliminarRegistro(row); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </div>
                    </div>
                    <div className="grid gap-3 lg:hidden">
                        {loadingList ? (
                            <>{Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                                    <Skeleton className="h-4 w-48" /><Skeleton className="mt-2 h-3 w-36" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/4" />
                                </div>
                            ))}</>
                        ) : (
                            <>
                                {sorted.map((row) => {
                                    const clienteNombre = row?.cliente?.nombre || "—";
                                    const clienteTel = row?.cliente?.telefono || "—";
                                    return (
                                        <button key={row.id} onClick={() => openEdit(row)} className="text-left rounded-3xl border border-black/10 bg-white p-4 shadow-sm hover:bg-slate-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">{clienteNombre}</div>
                                                    <div className="mt-1 text-xs text-slate-600">{row.agencia || "—"} • {clienteTel}</div>
                                                    <div className="mt-1 text-xs text-slate-600">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</div>
                                                    <div className="mt-1 text-xs text-slate-600">Serie: {row.num_serie || "—"} • Folio: {row.folio_salida || "—"}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-sm text-slate-700 line-clamp-3">{row.comentarios_cliente || "—"}</div>
                                            <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                                        </button>
                                    );
                                })}
                                {sorted.length === 0 ? <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">No hay resultados.</div> : null}
                            </>
                        )}
                    </div>
                </>
            )}

            {vistaActiva === "agenda" && (
                <AgendaSemanalView
                    rows={agendaRows}
                    loading={loadingList}
                    onEdit={openEdit}
                    onNewAtSlot={(date, hour) => {
                        const d = new Date(date);
                        d.setHours(hour, 0, 0, 0);
                        const pad = (n) => String(n).padStart(2, "0");
                        const fechaDefault = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
                        openCreate(fechaDefault);
                    }}
                    onToggleAsistencia={toggleAsistenciaInline}
                    updatingInline={updatingInline}
                />
            )}

            {vistaActiva === "graficas" && (
                <div>
                    {loadingList ? (
                        <div className="flex items-center justify-center py-20 text-[#131E5C]"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <GraficasView registros={sorted} />
                    )}
                </div>
            )}

            <Modal open={openModal} title={mode === "create" ? "Nueva Prueba de Manejo" : `Editar • ${draft?.id}`} onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving || subiendoEvidencia} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600 disabled:opacity-60"><X className="h-4 w-4" />Cancelar</button>
                        <button onClick={save} disabled={saving || loadingDetail || subiendoEvidencia || telInvalid || (draft?.telefono ? !telIsOk : false)} className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : (mode === "create" ? "Guardar y continuar" : "Guardar cambios")}
                        </button>
                    </>
                }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                disabled={!isAdmin && userAgencias.length <= 1}
                                className={[inputBase, inputOk, !isAdmin && userAgencias.length <= 1 ? "opacity-75 cursor-not-allowed" : ""].join(" ")}
                            >
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias).map((d) => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </Field>
                        <Field label="Prospecto" icon={User}>
                            <input value={draft.nombre} onChange={(e) => setDraft((p) => ({ ...p, nombre: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.telefono || ""} onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} disabled={telIsNormalized} className={[inputBase, (isInvalid("telefono") || telInvalid) ? inputBad : inputOk, telIsNormalized ? "opacity-75 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("telefono") ? <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div> : null}
                            {!isInvalid("telefono") && telError ? <div className="mt-2 text-xs font-bold text-red-600">{telError}</div> : null}
                        </Field>
                        <Field label="Correo" icon={Mail}>
                            <input value={draft.correo} onChange={(e) => setDraft((p) => ({ ...p, correo: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Correo" />
                        </Field>
                        <Field label="VW de sus sueños" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map((d) => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </Field>
                        <Field label="Fecha y Hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita} onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_cita: e.target.value }))} className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_cita") ? <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora es requerido.</div> : null}
                        </Field>
                        <Field label="Asesor Piso" icon={UserStar}>
                            <select value={draft.asesor_piso || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_piso: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map((d) => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </Field>
                        <Field label="No. Serie" icon={Hash}>
                            <input value={draft.num_serie} onChange={(e) => setDraft((p) => ({ ...p, num_serie: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Ej. 3VWSA..." />
                        </Field>
                        <Field label="Folio Pase de Salida" icon={FileText}>
                            <input value={draft.folio_salida} onChange={(e) => setDraft((p) => ({ ...p, folio_salida: e.target.value }))} className={[inputBase, inputOk].join(" ")} />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios del cliente" icon={MessageSquareText}>
                                <textarea value={draft.comentarios_cliente} onChange={(e) => setDraft((p) => ({ ...p, comentarios_cliente: e.target.value }))} className={[inputBase, inputOk, "min-h-[80px]"].join(" ")} placeholder="Notas / comentarios del cliente..." />
                            </Field>
                        </div>
                        <div className="md:col-span-3">
                            <Field label="Evidencias" icon={Camera}>
                                <EvidenciasUploader evidencias={draft.evidencias || []} disabled={saving || subiendoEvidencia} onSubir={subirEvidencias} onEliminar={eliminarEvidencia} />
                                {!draft.id ? <div className="mt-2 text-xs font-semibold text-slate-600">* Guarda primero la prueba para adjuntar evidencias.</div> : null}
                            </Field>
                        </div>
                        {subiendoEvidencia ? (
                            <div className="md:col-span-3 rounded-lg border border-black/10 bg-white p-3">
                                <div className="flex items-center gap-2 text-[#131E5C] font-bold"><Loader2 className="h-5 w-5 animate-spin" />Procesando evidencias...</div>
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}