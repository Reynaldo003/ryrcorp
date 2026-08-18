// src/pages/SafetyCulture/Safety.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    ClipboardList,
    Eye,
    FileText,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    RefreshCcw,
    Search,
    ShieldCheck,
    Table2,
    User,
    UserRound,
    Video,
    Wrench,
    X,
} from "lucide-react";
import { apiSafety } from "../../lib/apiSafety";

const BRAND_BLUE = "#131E5C";
const API_BASE = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function cls(...values) { return values.filter(Boolean).join(" "); }
function normalizeStr(value) { return String(value ?? "").trim(); }
function porcentaje(valor, total) { return total > 0 ? (Number(valor || 0) / Number(total)) * 100 : 0; }
function porcentajeEntero(valor, total) { return Math.round(porcentaje(valor, total)); }

function getDatePartsMexico(dateLike) {
    if (!dateLike) return null;
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(date);

    const map = {};
    for (const part of parts) if (part.type !== "literal") map[part.type] = part.value;
    return map;
}

function formatFechaHora(dateLike) {
    const p = getDatePartsMexico(dateLike);
    if (!p) return "—";
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

function formatFechaSolo(dateLike) {
    const p = getDatePartsMexico(dateLike);
    if (!p) return "—";
    return `${p.year}-${p.month}-${p.day}`;
}

function toYMDMexico(dateLike) {
    const p = getDatePartsMexico(dateLike);
    if (!p) return "";
    return `${p.year}-${p.month}-${p.day}`;
}

function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}

function formatearTamano(bytes) {
    const size = Number(bytes || 0);
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function toAbsoluteUrl(url) {
    const value = normalizeStr(url);
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return `${API_BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}

function esFechaSolo(valor) { return /^\d{4}-\d{2}-\d{2}$/.test(normalizeStr(valor)); }

function formatFechaReporte(item) {
    const fechaReporte = normalizeStr(item?.fecha_reporte);
    if (esFechaSolo(fechaReporte)) return fechaReporte;
    if (fechaReporte) return formatFechaSolo(fechaReporte);
    return formatFechaSolo(item?.creado);
}

function getFechaReporteYMD(item) {
    const fechaReporte = normalizeStr(item?.fecha_reporte);
    if (esFechaSolo(fechaReporte)) return fechaReporte;
    if (fechaReporte) return toYMDMexico(fechaReporte);
    return toYMDMexico(item?.creado);
}

function getFechaReporteInt(item) { return ymdToInt(getFechaReporteYMD(item)) ?? 0; }
function getFechaBaseReporte(item) { return item?.fecha_reporte || item?.creado || ""; }
function obtenerChecklist(item) { return Array.isArray(item?.checklist) ? item.checklist : []; }
function obtenerAdjuntos(item) { return Array.isArray(item?.adjuntos) ? item.adjuntos : []; }

function obtenerResumenReporte(reporte) {
    const checklist = obtenerChecklist(reporte);
    const adjuntos = obtenerAdjuntos(reporte);
    const totalPuntos = checklist.length;
    const puntosSi = checklist.filter((item) => normalizeStr(item?.estado).toLowerCase() === "si").length;
    const puntosNo = checklist.filter((item) => normalizeStr(item?.estado).toLowerCase() === "no").length;
    const puntosNa = checklist.filter((item) => normalizeStr(item?.estado).toLowerCase() === "na").length;
    const pendientes = checklist.filter((item) => !normalizeStr(item?.estado)).length;
    const evidencias = adjuntos.length;
    const evaluables = puntosSi + puntosNo;
    const cumplimiento = evaluables > 0 ? (puntosSi / evaluables) * 100 : 0;

    return {
        totalPuntos,
        puntosSi,
        puntosNo,
        puntosNa,
        pendientes,
        evidencias,
        evaluables,
        cumplimiento,
        tieneHallazgos: puntosNo > 0,
    };
}

function obtenerCumplimientoReporte(reporte) {
    return obtenerResumenReporte(reporte).cumplimiento;
}

function nombrePeriodo(periodo) {
    if (!/^\d{4}-\d{2}$/.test(periodo)) return periodo;
    const [anio, mes] = periodo.split("-").map(Number);
    return `${MESES_CORTOS[mes - 1]} ${String(anio).slice(-2)}`;
}

function getWeeksOfMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const weeks = [];
    let currentDay = 1;
    for (let w = 0; currentDay <= totalDays; w++) {
        const weekStart = currentDay;
        const daysInWeek = [];
        for (let d = 0; d < 7 && currentDay <= totalDays; d++) {
            if (w === 0 && d < startDow) {
                daysInWeek.push(null);
            } else {
                daysInWeek.push(currentDay);
                currentDay++;
            }
        }
        weeks.push({ weekIndex: w, days: daysInWeek, startDay: weekStart, endDay: daysInWeek.filter(Boolean).length ? Math.max(...daysInWeek.filter(Boolean)) : weekStart });
    }
    return weeks;
}

function Skeleton({ className = "" }) {
    return <div className={cls("animate-pulse rounded-md bg-slate-200/70", className)} />;
}

function SkeletonCard() {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-7 w-52" />
            <Skeleton className="mt-4 h-4 w-40" />
            <Skeleton className="mt-6 h-20 w-full rounded-2xl" />
            <div className="mt-4 grid grid-cols-3 gap-2">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 13 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 w-full max-w-[150px] rounded bg-slate-200/70" />
                </td>
            ))}
        </tr>
    );
}

function EstadoBadge({ estado }) {
    const valor = normalizeStr(estado).toLowerCase();
    const estilos = {
        si: "border-emerald-200 bg-emerald-50 text-emerald-700",
        no: "border-red-200 bg-red-50 text-red-700",
        na: "border-amber-200 bg-amber-50 text-amber-700",
        default: "border-slate-200 bg-slate-50 text-slate-600",
    };
    const label = { si: "Sí", no: "No", na: "No aplica" }[valor] || "Sin estado";

    return (
        <span className={cls("inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-extrabold", estilos[valor] || estilos.default)}>
            {label}
        </span>
    );
}

function HallazgoBadge({ reporte }) {
    const resumen = obtenerResumenReporte(reporte);

    return resumen.tieneHallazgos ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Con hallazgos
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Sin hallazgos
        </span>
    );
}

function CumplimientoBadge({ valor }) {
    const pct = Math.round(Number(valor || 0));
    const clase =
        pct >= 95
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : pct >= 85
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-700";

    return <span className={cls("inline-flex rounded-full border px-3 py-1 text-xs font-black", clase)}>{pct}%</span>;
}

function StatCard({ icon: Icon, label, value, detail, tone = "normal" }) {
    const toneClass =
        tone === "alert"
            ? "border-red-200 bg-red-50"
            : tone === "success"
                ? "border-emerald-200 bg-emerald-50"
                : tone === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-white";

    return (
        <div className={cls("rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", toneClass)}>
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#131E5C] text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{label}</div>
                    <div className="mt-1 text-2xl font-black text-[#131E5C]">{value}</div>
                    {detail ? <div className="mt-1 text-xs font-semibold text-slate-500">{detail}</div> : null}
                </div>
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white sm:text-lg">{title}</div>
                        </div>
                        <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15" aria-label="Cerrar" type="button">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="overflow-auto p-4 sm:p-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            <div>{children}</div>
        </div>
    );
}

function MiniMetric({ label, value, tone = "default" }) {
    const color =
        tone === "danger"
            ? "border-red-200 bg-red-50 text-red-700"
            : tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : tone === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-700";

    return (
        <div className={cls("rounded-lg border px-3 py-3", color)}>
            <div className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
            <div className="mt-1 text-xl font-black">{value}</div>
        </div>
    );
}

function obtenerAdjuntosGenerales(reporte) {
    return obtenerAdjuntos(reporte).filter((adjunto) => !normalizeStr(adjunto?.punto_checklist_id));
}

function obtenerAdjuntosPorPunto(reporte, puntoId) {
    return obtenerAdjuntos(reporte).filter(
        (adjunto) => normalizeStr(adjunto?.punto_checklist_id) === normalizeStr(puntoId)
    );
}

function esImagen(adjunto) {
    const mime = normalizeStr(adjunto?.tipo_mime).toLowerCase();
    const url = normalizeStr(adjunto?.url_archivo || adjunto?.archivo).toLowerCase();

    return (
        normalizeStr(adjunto?.tipo_adjunto) === "foto" ||
        mime.startsWith("image/") ||
        [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => url.endsWith(ext))
    );
}

function esVideo(adjunto) {
    const mime = normalizeStr(adjunto?.tipo_mime).toLowerCase();
    const url = normalizeStr(adjunto?.url_archivo || adjunto?.archivo).toLowerCase();

    return (
        normalizeStr(adjunto?.tipo_adjunto) === "video" ||
        mime.startsWith("video/") ||
        [".mp4", ".mov", ".webm", ".m4v"].some((ext) => url.endsWith(ext))
    );
}

function AdjuntoCard({ adjunto }) {
    const url = toAbsoluteUrl(adjunto?.url_archivo || adjunto?.archivo);
    const nombre = normalizeStr(adjunto?.nombre_original) || "Archivo";
    const tipo = normalizeStr(adjunto?.tipo_adjunto) || "archivo";

    if (!url) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
                Archivo no disponible.
            </div>
        );
    }

    if (esImagen(adjunto)) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src={url} alt={nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                        <ImageIcon className="h-4 w-4" /> Imagen
                    </div>
                    <div className="mt-2 break-words text-sm font-bold text-[#131E5C]">{nombre}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{formatearTamano(adjunto?.tamano_bytes)}</div>
                </div>
            </a>
        );
    }

    if (esVideo(adjunto)) {
        return (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[4/3] bg-black">
                    <video src={url} controls className="h-full w-full" preload="metadata" />
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                        <Video className="h-4 w-4" /> Video
                    </div>
                    <div className="mt-2 break-words text-sm font-bold text-[#131E5C]">{nombre}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{formatearTamano(adjunto?.tamano_bytes)}</div>
                </div>
            </div>
        );
    }

    return (
        <a href={url} target="_blank" rel="noreferrer" className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#131E5C]/10 text-[#131E5C]">
                <Paperclip className="h-6 w-6" />
            </div>
            <div className="mt-4 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">{tipo}</div>
            <div className="mt-2 break-words text-sm font-bold text-[#131E5C]">{nombre}</div>
            <div className="mt-2 text-xs font-semibold text-slate-500">{formatearTamano(adjunto?.tamano_bytes)}</div>
            <div className="mt-4 inline-flex w-fit items-center rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-1 text-xs font-extrabold text-[#131E5C]">
                Abrir archivo
            </div>
        </a>
    );
}

function EvidenciasGrid({ adjuntos, emptyText = "No hay evidencias." }) {
    if (!adjuntos.length) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-500">
                {emptyText}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adjuntos.map((adjunto) => <AdjuntoCard key={adjunto.id_adjunto} adjunto={adjunto} />)}
        </div>
    );
}

function TarjetaReporte({ reporte, onOpen, onDelete, deleting = false }) {
    const resumen = obtenerResumenReporte(reporte);

    function handleContextMenu(e) {
        e.preventDefault();
        if (deleting) return;
        onDelete?.(reporte);
    }

    function handleDoubleClick() {
        if (deleting) return;
        onOpen?.(reporte);
    }

    return (
        <article
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            className={cls(
                "group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg select-none",
                deleting ? "pointer-events-none opacity-60" : "cursor-pointer"
            )}
            title="Doble clic para ver detalle · Clic derecho para eliminar"
        >
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#131E5C,#1d2d83)] p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">Orden de servicio</div>
                        <div className="mt-1 truncate text-2xl font-black">{reporte.orden_servicio || "—"}</div>
                    </div>
                    {resumen.tieneHallazgos ? (
                        <span className="shrink-0 rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-black text-white">
                            {resumen.puntosNo} NO
                        </span>
                    ) : (
                        <span className="shrink-0 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs font-black text-white">
                            Sin hallazgos
                        </span>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/85">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">{reporte.agencia || "Sin agencia"}</span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">Fecha: {formatFechaReporte(reporte)}</span>
                </div>
            </div>

            <div className="p-5">
                <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                        <User className="h-4 w-4" />
                        <span className="truncate">Cliente: {reporte.nombre_cliente || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <UserRound className="h-4 w-4 text-[#131E5C]" />
                        <span className="truncate">Reportante: {reporte.reportante || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <Wrench className="h-4 w-4 text-[#131E5C]" />
                        <span className="truncate">Técnico: {reporte.tecnico_reparo || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <ShieldCheck className="h-4 w-4 text-[#131E5C]" />
                        <span className="truncate">Validó: {reporte.valido_control_calidad || "—"}</span>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                    <MiniMetric label="Sí" value={resumen.puntosSi} tone="success" />
                    <MiniMetric label="No" value={resumen.puntosNo} tone="danger" />
                    <MiniMetric label="N/A" value={resumen.puntosNa} tone="warning" />
                    <MiniMetric label="Cumpl." value={`${Math.round(resumen.cumplimiento)}%`} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniMetric label="Puntos" value={resumen.totalPuntos} />
                    <MiniMetric label="Evidencias" value={resumen.evidencias} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen?.(reporte);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#131E5C] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0f1748]"
                    >
                        <Eye className="h-4 w-4" /> Ver detalle
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(reporte);
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-100"
                    >
                        Eliminar
                    </button>
                </div>

                <div className="mt-3 text-xs font-semibold text-slate-400">
                    Doble clic: ver detalle · Clic derecho: eliminar
                </div>
            </div>
        </article>
    );
}

function ChecklistCard({ punto, adjuntos }) {
    const tieneObservaciones = normalizeStr(punto?.observaciones).length > 0;
    const totalAdjuntos = Array.isArray(adjuntos) ? adjuntos.length : 0;

    return (
        <div className={cls(
            "rounded-lg border p-4 shadow-sm",
            punto?.estado === "no" ? "border-red-200 bg-red-50/60" : "border-slate-200 bg-white"
        )}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <h4 className="mt-1 text-base font-black text-[#131E5C]">{punto?.titulo || "Sin título"}</h4>
                    {normalizeStr(punto?.descripcion) ? (
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{punto.descripcion}</p>
                    ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-1 text-xs font-extrabold text-[#131E5C]">
                        Evidencias: {totalAdjuntos}
                    </span>
                    <EstadoBadge estado={punto?.estado} />
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">Observaciones</div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    {tieneObservaciones ? punto.observaciones : "Sin observaciones."}
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                    <Paperclip className="h-4 w-4" /> Evidencias del punto
                </div>
                <EvidenciasGrid adjuntos={Array.isArray(adjuntos) ? adjuntos : []} emptyText="Este punto no tiene evidencias." />
            </div>
        </div>
    );
}

// ==================== COMPONENTES ANALÍTICOS ====================

function PanelGrafico({ title, subtitle, icon: Icon, children, className = "" }) {
    return (
        <section className={cls("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
            <div className="mb-4 flex items-start gap-2">
                {Icon ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#131E5C]/10 text-[#131E5C]">
                        <Icon className="h-4 w-4" />
                    </div>
                ) : null}
                <div className="min-w-0">
                    <h3 className="text-sm font-black text-[#131E5C]">{title}</h3>
                    {subtitle ? <p className="mt-0.5 text-xs font-semibold text-slate-400">{subtitle}</p> : null}
                </div>
            </div>
            {children}
        </section>
    );
}

function BarraHorizontal({
    label,
    value,
    max,
    total,
    secondary,
    color = "bg-[#131E5C]",
    rightLabel,
}) {
    const width = max > 0 ? Math.max((Number(value || 0) / max) * 100, value > 0 ? 2 : 0) : 0;
    const totalPct = total > 0 ? Math.round((Number(value || 0) / total) * 100) : null;

    return (
        <div className="group rounded-lg px-2 py-2 transition hover:bg-slate-50">
            <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-slate-700" title={label}>{label}</div>
                    {secondary ? <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{secondary}</div> : null}
                </div>
                <div className="shrink-0 text-right">
                    <span className="text-xs font-black text-[#131E5C]">{rightLabel ?? value}</span>
                    {totalPct !== null ? <span className="ml-1 text-[10px] font-semibold text-slate-400">({totalPct}%)</span> : null}
                </div>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className={cls("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.min(width, 100)}%` }} />
            </div>
        </div>
    );
}

function BarraCumplimiento({ value }) {
    const pct = Math.max(0, Math.min(Number(value || 0), 100));
    const color = pct >= 95 ? "bg-emerald-500" : pct >= 85 ? "bg-amber-500" : "bg-red-500";

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={cls("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 text-right text-xs font-black text-[#131E5C]">{Math.round(pct)}%</span>
        </div>
    );
}

function DistribucionChecklist({ si, no, na, pendientes }) {
    const total = si + no + na + pendientes;
    const pctSi = porcentaje(si, total);
    const pctNo = porcentaje(no, total);
    const pctNa = porcentaje(na, total);
    const pctPendientes = porcentaje(pendientes, total);

    return (
        <div>
            <div className="flex h-7 overflow-hidden rounded-lg bg-slate-100">
                {si > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pctSi}%` }} title={`Sí: ${si}`} />}
                {no > 0 && <div className="h-full bg-red-500" style={{ width: `${pctNo}%` }} title={`No: ${no}`} />}
                {na > 0 && <div className="h-full bg-amber-400" style={{ width: `${pctNa}%` }} title={`N/A: ${na}`} />}
                {pendientes > 0 && <div className="h-full bg-slate-400" style={{ width: `${pctPendientes}%` }} title={`Pendientes: ${pendientes}`} />}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    ["Sí", si, "bg-emerald-500"],
                    ["No", no, "bg-red-500"],
                    ["N/A", na, "bg-amber-400"],
                    ["Pend.", pendientes, "bg-slate-400"],
                ].map(([label, value, color]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <span className={cls("h-2.5 w-2.5 rounded-full", color)} />
                            {label}
                        </div>
                        <div className="mt-1 text-xl font-black text-[#131E5C]">{value}</div>
                        <div className="text-[10px] font-semibold text-slate-400">{porcentajeEntero(value, total)}% del checklist</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GraficaPeriodos({ periodos }) {
    const maxDesviaciones = Math.max(...periodos.map((item) => item.desviaciones), 1);

    if (!periodos.length) {
        return <div className="py-10 text-center text-sm font-semibold text-slate-400">Sin datos de tendencia.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <div className="flex min-w-[620px] items-end gap-3 pt-8">
                {periodos.map((item) => {
                    const altura = item.desviaciones > 0 ? Math.max((item.desviaciones / maxDesviaciones) * 100, 5) : 0;
                    const color =
                        item.cumplimiento >= 95
                            ? "bg-emerald-500"
                            : item.cumplimiento >= 85
                                ? "bg-amber-500"
                                : "bg-red-500";

                    return (
                        <div key={item.periodo} className="group flex min-w-[62px] flex-1 flex-col items-center">
                            <div className="mb-1 text-xs font-black text-[#131E5C] opacity-0 transition group-hover:opacity-100">
                                {item.desviaciones}
                            </div>
                            <div className="flex h-32 w-full items-end rounded-t-lg bg-slate-100">
                                <div
                                    className="w-full rounded-t-lg bg-[#131E5C]/75 transition-all duration-500 group-hover:bg-[#131E5C]"
                                    style={{ height: `${altura}%` }}
                                    title={`${item.desviaciones} desviaciones`}
                                />
                            </div>
                            <div className="mt-2 text-[11px] font-extrabold text-[#131E5C]">{nombrePeriodo(item.periodo)}</div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <span className={cls("h-2 w-2 rounded-full", color)} />
                                {Math.round(item.cumplimiento)}%
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500">
                <span><b className="text-[#131E5C]">Barra:</b> desviaciones</span>
                <span><b className="text-[#131E5C]">Porcentaje:</b> cumplimiento del periodo</span>
            </div>
        </div>
    );
}

function GraficosSafety({ analitica }) {
    const maxDesviacion = analitica.principalesDesviaciones[0]?.cantidad || 1;
    const maxTecnico = analitica.tecnicos[0]?.desviaciones || 1;
    const maxAgencia = analitica.agencias[0]?.desviaciones || 1;
    const maxValidador = analitica.validadores[0]?.desviaciones || 1;

    if (!analitica.totalReportes) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-[#131E5C]/40" />
                <h3 className="mt-3 text-lg font-black text-[#131E5C]">
                    No hay información para analizar
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                    Modifica los filtros para incluir reportes.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* =========================================================
                BLOQUE SUPERIOR
                Las dos columnas crecen de forma INDEPENDIENTE.
                Esto evita los huecos enormes del CSS Grid tradicional.
            ========================================================= */}
            <div className="grid items-start gap-4 xl:grid-cols-12">
                {/* ================= COLUMNA PRINCIPAL ================= */}
                <div className="space-y-4 xl:col-span-7">
                    <PanelGrafico
                        title="Principales desviaciones"
                        subtitle="Puntos del checklist que más veces fueron marcados como NO."
                        icon={AlertTriangle}
                    >
                        {analitica.principalesDesviaciones.length ? (
                            <div className="space-y-1">
                                {analitica.principalesDesviaciones.map((item, index) => (
                                    <BarraHorizontal
                                        key={item.nombre}
                                        label={`${index + 1}. ${item.nombre}`}
                                        value={item.cantidad}
                                        max={maxDesviacion}
                                        total={analitica.totalDesviaciones}
                                        secondary={`${item.reportes} reporte${item.reportes !== 1 ? "s" : ""} · ${item.tecnicos} técnico${item.tecnicos !== 1 ? "s" : ""}`}
                                        color={
                                            index < 3
                                                ? "bg-red-500"
                                                : index < 6
                                                    ? "bg-orange-400"
                                                    : "bg-amber-400"
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg bg-emerald-50 px-4 py-8 text-center text-sm font-bold text-emerald-700">
                                No existen desviaciones dentro de los filtros actuales.
                            </div>
                        )}
                    </PanelGrafico>

                    {/* Técnicos inmediatamente debajo, sin esperar
                        la altura de la columna derecha */}
                    <PanelGrafico
                        title="Desviaciones por técnico"
                        subtitle="Reincidencia, volumen evaluado y cumplimiento individual."
                        icon={Wrench}
                    >
                        <div className="space-y-1">
                            {analitica.tecnicos.slice(0, 12).map((item, index) => (
                                <div
                                    key={item.nombre}
                                    className="rounded-lg px-2 py-2 transition hover:bg-slate-50"
                                >
                                    <BarraHorizontal
                                        label={`${index + 1}. ${item.nombre}`}
                                        value={item.desviaciones}
                                        max={maxTecnico}
                                        secondary={`${item.reportes} reportes · ${item.reportesConHallazgos} con hallazgos`}
                                        color={
                                            item.desviaciones > 0
                                                ? "bg-red-500"
                                                : "bg-emerald-500"
                                        }
                                    />

                                    <div className="px-2 pb-1">
                                        <BarraCumplimiento value={item.cumplimiento} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PanelGrafico>
                </div>

                {/* ================= COLUMNA SECUNDARIA ================= */}
                <div className="space-y-4 xl:col-span-5">
                    <PanelGrafico
                        title="Distribución del checklist"
                        subtitle="Composición total de respuestas Sí / No / N/A."
                        icon={ClipboardList}
                    >
                        <DistribucionChecklist
                            si={analitica.puntosSi}
                            no={analitica.puntosNo}
                            na={analitica.puntosNa}
                            pendientes={analitica.pendientes}
                        />

                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                        Cumplimiento global
                                    </div>
                                    <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                        Calculado sobre puntos evaluables
                                    </div>
                                </div>

                                <span className="text-3xl font-black text-[#131E5C]">
                                    {Math.round(analitica.cumplimiento)}%
                                </span>
                            </div>

                            <div className="mt-4">
                                <BarraCumplimiento value={analitica.cumplimiento} />
                            </div>
                        </div>
                    </PanelGrafico>

                    {/* Pareto ocupa inmediatamente el espacio inferior */}
                    <PanelGrafico
                        title="Concentración de desviaciones"
                        subtitle="Pareto de causas principales."
                        icon={BarChart3}
                    >
                        {analitica.pareto.length ? (
                            <div className="space-y-2">
                                {analitica.pareto.map((item, index) => (
                                    <div
                                        key={item.nombre}
                                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-[#131E5C]/20 hover:bg-[#131E5C]/[0.03]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div
                                                    className="truncate text-xs font-bold text-slate-700"
                                                    title={item.nombre}
                                                >
                                                    {index + 1}. {item.nombre}
                                                </div>

                                                <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                                    {item.cantidad} desviación
                                                    {item.cantidad !== 1 ? "es" : ""}
                                                </div>
                                            </div>

                                            <span className="shrink-0 text-xs font-black text-[#131E5C]">
                                                {Math.round(item.acumulado)}%
                                            </span>
                                        </div>

                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-[#131E5C] transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        item.acumulado,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="rounded-lg border border-[#131E5C]/10 bg-[#131E5C]/5 p-3 text-xs font-semibold leading-5 text-[#131E5C]">
                                    Las causas que concentren aproximadamente el 80%
                                    de las desviaciones deben considerarse prioritarias
                                    para acciones correctivas.
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-sm font-semibold text-slate-400">
                                Sin desviaciones.
                            </div>
                        )}
                    </PanelGrafico>

                    {/* Métricas pequeñas aprovechan el hueco de esta columna */}
                    <PanelGrafico
                        title="Indicadores de profundidad"
                        subtitle="Ratios derivados del conjunto filtrado."
                        icon={CheckCircle2}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <MiniMetric
                                label="Desv. / reporte"
                                value={analitica.promedioDesviaciones.toFixed(2)}
                                tone={
                                    analitica.promedioDesviaciones > 0
                                        ? "danger"
                                        : "success"
                                }
                            />

                            <MiniMetric
                                label="Evid. / reporte"
                                value={analitica.promedioEvidencias.toFixed(2)}
                            />

                            <MiniMetric
                                label="% con hallazgo"
                                value={`${Math.round(
                                    analitica.pctReportesHallazgos
                                )}%`}
                                tone={
                                    analitica.pctReportesHallazgos > 0
                                        ? "danger"
                                        : "success"
                                }
                            />

                            <MiniMetric
                                label="Técnicos"
                                value={analitica.tecnicos.length}
                            />
                        </div>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                        Reportes con evidencia
                                    </div>

                                    <div className="mt-1 text-3xl font-black text-[#131E5C]">
                                        {analitica.reportesConEvidencia}
                                    </div>
                                </div>

                                <div className="text-lg font-black text-[#131E5C]">
                                    {porcentajeEntero(
                                        analitica.reportesConEvidencia,
                                        analitica.totalReportes
                                    )}
                                    %
                                </div>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-[#131E5C]"
                                    style={{
                                        width: `${porcentaje(
                                            analitica.reportesConEvidencia,
                                            analitica.totalReportes
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </PanelGrafico>
                </div>
            </div>

            {/* =========================================================
                TENDENCIA
                Full width porque es una gráfica temporal.
            ========================================================= */}
            <PanelGrafico
                title="Evolución de desviaciones y cumplimiento"
                subtitle="Comportamiento histórico en los últimos periodos con información."
                icon={CalendarDays}
            >
                <GraficaPeriodos periodos={analitica.periodos} />
            </PanelGrafico>

            {/* =========================================================
                COMPARATIVOS OPERATIVOS
            ========================================================= */}
            <div className="grid items-start gap-4 xl:grid-cols-2">
                <PanelGrafico
                    title="Análisis por agencia"
                    subtitle="Desviaciones, volumen inspeccionado y nivel de cumplimiento."
                    icon={Building2}
                >
                    <div className="space-y-1">
                        {analitica.agencias.map((item, index) => (
                            <div
                                key={item.nombre}
                                className="rounded-lg px-2 py-2 transition hover:bg-slate-50"
                            >
                                <BarraHorizontal
                                    label={`${index + 1}. ${item.nombre}`}
                                    value={item.desviaciones}
                                    max={maxAgencia}
                                    secondary={`${item.reportes} reportes · ${item.reportesConHallazgos} con hallazgos`}
                                    color="bg-[#131E5C]"
                                />

                                <div className="px-2 pb-1">
                                    <BarraCumplimiento value={item.cumplimiento} />
                                </div>
                            </div>
                        ))}
                    </div>
                </PanelGrafico>

                <PanelGrafico
                    title="Control de calidad por validador"
                    subtitle="Volumen validado, desviaciones encontradas y cumplimiento."
                    icon={ShieldCheck}
                >
                    <div className="space-y-1">
                        {analitica.validadores.slice(0, 12).map((item, index) => (
                            <div
                                key={item.nombre}
                                className="rounded-lg px-2 py-2 transition hover:bg-slate-50"
                            >
                                <BarraHorizontal
                                    label={`${index + 1}. ${item.nombre}`}
                                    value={item.desviaciones}
                                    max={maxValidador}
                                    secondary={`${item.reportes} reportes validados`}
                                    color="bg-blue-500"
                                />

                                <div className="px-2 pb-1">
                                    <BarraCumplimiento value={item.cumplimiento} />
                                </div>
                            </div>
                        ))}
                    </div>
                </PanelGrafico>
            </div>
        </div>
    );
}
// ==================== COMPONENTE PRINCIPAL ====================

export default function Safety() {
    const [reportes, setReportes] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [errorList, setErrorList] = useState("");
    const [selected, setSelected] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [vista, setVista] = useState("lista");

    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todas",
        estadoGeneral: "todos",
        rangoDesde: "",
        rangoHasta: "",
        sort: "fecha_desc",
    });

    const [showFechaPopup, setShowFechaPopup] = useState(false);
    const [fechaFilterMode, setFechaFilterMode] = useState("dia");
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const fechaPopupRef = useRef(null);

    async function refreshList() {
        setLoadingList(true);
        setErrorList("");

        try {
            const data = await apiSafety.list();
            setReportes(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
            console.error(error);
            setReportes([]);
            setErrorList(error.message || "No fue posible cargar los reportes.");
        } finally {
            setLoadingList(false);
        }
    }

    async function deleteReport(row) {
        const id = row?.id_reporte;
        if (!id) return;

        const os = normalizeStr(row?.orden_servicio) || "Sin OS";
        const cliente = normalizeStr(row?.nombre_cliente) || "Sin cliente";

        const confirmado = window.confirm(
            `¿Deseas eliminar el reporte ${os} del cliente ${cliente}? Esta acción no se puede deshacer.`
        );
        if (!confirmado) return;

        try {
            setDeletingId(id);
            setErrorList("");
            await apiSafety.remove(id);
            setReportes((prev) => prev.filter((item) => item.id_reporte !== id));

            if (selected?.id_reporte === id) closeModal();
        } catch (error) {
            console.error(error);
            setErrorList(error.message || "No fue posible eliminar el reporte.");
        } finally {
            setDeletingId(null);
        }
    }

    useEffect(() => {
        refreshList();
    }, []);

    async function openDetail(row) {
        if (!row?.id_reporte) return;

        setOpenModal(true);
        setLoadingDetail(true);
        setSelected(row);

        try {
            const data = await apiSafety.get(row.id_reporte);
            setSelected(data);
        } catch (error) {
            console.error(error);
            setSelected(row);
        } finally {
            setLoadingDetail(false);
        }
    }

    function closeModal() {
        setOpenModal(false);
        setSelected(null);
    }

    const agencias = useMemo(() => {
        const values = new Set((reportes || []).map((item) => normalizeStr(item.agencia)).filter(Boolean));
        return ["Todas", ...Array.from(values).sort((a, b) => a.localeCompare(b, "es"))];
    }, [reportes]);

    const reportesFiltrados = useMemo(() => {
        const q = normalizeStr(filters.q).toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (reportes || []).filter((item) => {
            const resumen = obtenerResumenReporte(item);
            const checklist = obtenerChecklist(item);

            const matchQ =
                !q ||
                normalizeStr(item.reportante).toLowerCase().includes(q) ||
                normalizeStr(item.agencia).toLowerCase().includes(q) ||
                normalizeStr(item.nombre_cliente).toLowerCase().includes(q) ||
                normalizeStr(item.orden_servicio).toLowerCase().includes(q) ||
                normalizeStr(item.tecnico_reparo).toLowerCase().includes(q) ||
                normalizeStr(item.valido_control_calidad).toLowerCase().includes(q) ||
                normalizeStr(item.comentarios_finales).toLowerCase().includes(q) ||
                checklist.some((punto) =>
                    normalizeStr(punto?.titulo).toLowerCase().includes(q) ||
                    normalizeStr(punto?.descripcion).toLowerCase().includes(q) ||
                    normalizeStr(punto?.observaciones).toLowerCase().includes(q)
                );

            const matchAgencia =
                filters.agencia === "Todas" ||
                normalizeStr(item.agencia) === normalizeStr(filters.agencia);

            const matchEstado =
                filters.estadoGeneral === "todos" ||
                (filters.estadoGeneral === "con_hallazgos" && resumen.tieneHallazgos) ||
                (filters.estadoGeneral === "sin_hallazgos" && !resumen.tieneHallazgos);

            let matchRango = true;

            if (desdeInt !== null || hastaInt !== null) {
                const ymdInt = getFechaReporteInt(item);
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchEstado && matchRango;
        });
    }, [reportes, filters]);

    const reportesOrdenados = useMemo(() => {
        const data = [...reportesFiltrados];

        return data.sort((a, b) => {
            const resumenA = obtenerResumenReporte(a);
            const resumenB = obtenerResumenReporte(b);

            switch (filters.sort) {
                case "fecha_asc":
                    return getFechaReporteInt(a) - getFechaReporteInt(b);

                case "hallazgos_desc":
                    return resumenB.puntosNo - resumenA.puntosNo;

                case "evidencias_desc":
                    return resumenB.evidencias - resumenA.evidencias;

                case "cliente_asc":
                    return normalizeStr(a.nombre_cliente).localeCompare(normalizeStr(b.nombre_cliente), "es");

                case "tecnico_asc":
                    return normalizeStr(a.tecnico_reparo).localeCompare(normalizeStr(b.tecnico_reparo), "es");

                case "agencia_asc":
                    return normalizeStr(a.agencia).localeCompare(normalizeStr(b.agencia), "es");

                case "cumplimiento_asc":
                    return resumenA.cumplimiento - resumenB.cumplimiento;

                case "cumplimiento_desc":
                    return resumenB.cumplimiento - resumenA.cumplimiento;

                case "fecha_desc":
                default:
                    return getFechaReporteInt(b) - getFechaReporteInt(a);
            }
        });
    }, [reportesFiltrados, filters.sort]);

    const analitica = useMemo(() => {
        const base = reportesFiltrados;
        const desviacionesMap = {};
        const tecnicosMap = {};
        const agenciasMap = {};
        const validadoresMap = {};
        const periodosMap = {};

        let totalDesviaciones = 0;
        let puntosSi = 0;
        let puntosNo = 0;
        let puntosNa = 0;
        let pendientes = 0;
        let totalEvidencias = 0;
        let reportesConHallazgos = 0;
        let reportesConEvidencia = 0;

        function crearGrupo(nombre) {
            return {
                nombre,
                reportes: 0,
                reportesConHallazgos: 0,
                desviaciones: 0,
                puntosSi: 0,
                puntosNo: 0,
                evaluables: 0,
                cumplimiento: 0,
            };
        }

        for (const reporte of base) {
            const resumen = obtenerResumenReporte(reporte);
            const checklist = obtenerChecklist(reporte);

            puntosSi += resumen.puntosSi;
            puntosNo += resumen.puntosNo;
            puntosNa += resumen.puntosNa;
            pendientes += resumen.pendientes;
            totalDesviaciones += resumen.puntosNo;
            totalEvidencias += resumen.evidencias;

            if (resumen.tieneHallazgos) reportesConHallazgos++;
            if (resumen.evidencias > 0) reportesConEvidencia++;

            const tecnico = normalizeStr(reporte.tecnico_reparo) || "Sin técnico";
            const agencia = normalizeStr(reporte.agencia) || "Sin agencia";
            const validador = normalizeStr(reporte.valido_control_calidad) || "Sin validador";

            if (!tecnicosMap[tecnico]) tecnicosMap[tecnico] = crearGrupo(tecnico);
            if (!agenciasMap[agencia]) agenciasMap[agencia] = crearGrupo(agencia);
            if (!validadoresMap[validador]) validadoresMap[validador] = crearGrupo(validador);

            for (const grupo of [tecnicosMap[tecnico], agenciasMap[agencia], validadoresMap[validador]]) {
                grupo.reportes++;
                grupo.desviaciones += resumen.puntosNo;
                grupo.puntosSi += resumen.puntosSi;
                grupo.puntosNo += resumen.puntosNo;
                grupo.evaluables += resumen.evaluables;
                if (resumen.tieneHallazgos) grupo.reportesConHallazgos++;
            }

            const ymd = getFechaReporteYMD(reporte);
            const periodo = /^\d{4}-\d{2}/.test(ymd) ? ymd.slice(0, 7) : "";

            if (periodo) {
                if (!periodosMap[periodo]) {
                    periodosMap[periodo] = {
                        periodo,
                        reportes: 0,
                        desviaciones: 0,
                        puntosSi: 0,
                        puntosNo: 0,
                        evaluables: 0,
                        cumplimiento: 0,
                    };
                }

                const grupoPeriodo = periodosMap[periodo];
                grupoPeriodo.reportes++;
                grupoPeriodo.desviaciones += resumen.puntosNo;
                grupoPeriodo.puntosSi += resumen.puntosSi;
                grupoPeriodo.puntosNo += resumen.puntosNo;
                grupoPeriodo.evaluables += resumen.evaluables;
            }

            for (const punto of checklist) {
                if (normalizeStr(punto?.estado).toLowerCase() !== "no") continue;

                const nombre = normalizeStr(punto?.titulo) || "Punto sin título";

                if (!desviacionesMap[nombre]) {
                    desviacionesMap[nombre] = {
                        nombre,
                        cantidad: 0,
                        reportesSet: new Set(),
                        tecnicosSet: new Set(),
                    };
                }

                desviacionesMap[nombre].cantidad++;
                desviacionesMap[nombre].reportesSet.add(reporte.id_reporte);
                desviacionesMap[nombre].tecnicosSet.add(tecnico);
            }
        }

        function finalizarGrupos(map) {
            return Object.values(map)
                .map((item) => ({
                    ...item,
                    cumplimiento: item.evaluables > 0 ? (item.puntosSi / item.evaluables) * 100 : 0,
                }))
                .sort((a, b) =>
                    b.desviaciones - a.desviaciones ||
                    b.reportesConHallazgos - a.reportesConHallazgos ||
                    a.nombre.localeCompare(b.nombre, "es")
                );
        }

        const principalesDesviaciones = Object.values(desviacionesMap)
            .map((item) => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                reportes: item.reportesSet.size,
                tecnicos: item.tecnicosSet.size,
            }))
            .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es"))
            .slice(0, 15);

        const tecnicos = finalizarGrupos(tecnicosMap);
        const agencias = finalizarGrupos(agenciasMap);
        const validadores = finalizarGrupos(validadoresMap);

        const periodos = Object.values(periodosMap)
            .map((item) => ({
                ...item,
                cumplimiento: item.evaluables > 0 ? (item.puntosSi / item.evaluables) * 100 : 0,
            }))
            .sort((a, b) => a.periodo.localeCompare(b.periodo))
            .slice(-12);

        let acumulado = 0;
        const pareto = principalesDesviaciones.slice(0, 10).map((item) => {
            acumulado += item.cantidad;
            return {
                ...item,
                acumulado: totalDesviaciones > 0 ? (acumulado / totalDesviaciones) * 100 : 0,
            };
        });

        const evaluables = puntosSi + puntosNo;
        const cumplimiento = evaluables > 0 ? (puntosSi / evaluables) * 100 : 0;
        const totalReportes = base.length;

        return {
            totalReportes,
            totalDesviaciones,
            puntosSi,
            puntosNo,
            puntosNa,
            pendientes,
            totalEvidencias,
            reportesConHallazgos,
            reportesConEvidencia,
            cumplimiento,
            pctReportesHallazgos: porcentaje(reportesConHallazgos, totalReportes),
            promedioDesviaciones: totalReportes > 0 ? totalDesviaciones / totalReportes : 0,
            promedioEvidencias: totalReportes > 0 ? totalEvidencias / totalReportes : 0,
            principalesDesviaciones,
            tecnicos,
            agencias,
            validadores,
            periodos,
            pareto,
        };
    }, [reportesFiltrados]);

    const metricas = useMemo(() => ({
        total: analitica.totalReportes,
        conHallazgos: analitica.reportesConHallazgos,
        desviaciones: analitica.totalDesviaciones,
        evidencias: analitica.totalEvidencias,
        cumplimiento: analitica.cumplimiento,
    }), [analitica]);

    const selectedResumen = useMemo(() => obtenerResumenReporte(selected || {}), [selected]);

    function FechaPopup() {
        const hoyYMD = toYMDMexico(new Date());
        const [dragStart, setDragStart] = useState(null);
        const [dragEnd, setDragEnd] = useState(null);
        const [isDragging, setIsDragging] = useState(false);

        useEffect(() => {
            if (showFechaPopup) {
                setDragStart(null);
                setDragEnd(null);
                setIsDragging(false);
            }
        }, [showFechaPopup]);

        useEffect(() => {
            if (!showFechaPopup) return;
            function handleUp() { setIsDragging(false); }
            document.addEventListener("mouseup", handleUp);
            return () => document.removeEventListener("mouseup", handleUp);
        }, [showFechaPopup]);

        useEffect(() => {
            if (!showFechaPopup) return;
            function handleClick(e) {
                if (fechaPopupRef.current && !fechaPopupRef.current.contains(e.target)) {
                    setShowFechaPopup(false);
                }
            }
            document.addEventListener("mousedown", handleClick);
            return () => document.removeEventListener("mousedown", handleClick);
        }, [showFechaPopup]);

        if (!showFechaPopup) return null;

        const weeks = getWeeksOfMonth(calYear, calMonth);
        const mesStr = String(calMonth + 1).padStart(2, "0");

        function ymd(day) {
            return `${calYear}-${mesStr}-${String(day).padStart(2, "0")}`;
        }

        function nav(delta) {
            let m = calMonth + delta;
            let y = calYear;
            if (m < 0) { m = 11; y--; }
            if (m > 11) { m = 0; y++; }
            setCalMonth(m);
            setCalYear(y);
        }

        function applyRange(fromYMD, toYMD) {
            const [a, b] = fromYMD <= toYMD ? [fromYMD, toYMD] : [toYMD, fromYMD];
            setFilters((prev) => ({ ...prev, rangoDesde: a, rangoHasta: b }));
        }

        function selectDay(day) {
            const y = ymd(day);
            applyRange(y, y);
        }

        function selectWeek(weekIndex) {
            const week = weeks[weekIndex];
            if (!week) return;
            const validDays = week.days.filter(Boolean);
            if (!validDays.length) return;
            applyRange(ymd(validDays[0]), ymd(validDays[validDays.length - 1]));
        }

        function handleMouseDown(day) {
            const y = ymd(day);
            setDragStart(y);
            setDragEnd(y);
            setIsDragging(true);
        }

        function handleMouseEnter(day) {
            if (!isDragging) return;
            setDragEnd(ymd(day));
        }

        function handleMouseUp(day) {
            if (!isDragging) return;
            const y = ymd(day);
            applyRange(dragStart, y);
            setIsDragging(false);
        }

        function handleClickDay(day) {
            selectDay(day);
        }

        function isInDragRange(dayYMD) {
            if (!isDragging || !dragStart || !dragEnd) return false;
            const [a, b] = dragStart <= dragEnd ? [dragStart, dragEnd] : [dragEnd, dragStart];
            return dayYMD >= a && dayYMD <= b;
        }

        function isInFilterRange(dayYMD) {
            const desde = filters.rangoDesde;
            const hasta = filters.rangoHasta;
            if (!desde && !hasta) return false;
            const a = desde || hasta;
            const b = hasta || desde;
            if (a === b) return dayYMD === a;
            return dayYMD >= a && dayYMD <= b;
        }

        return (
            <div
                ref={fechaPopupRef}
                className="absolute top-full left-0 z-50 mt-2 w-[290px] rounded-xl border border-[#131E5C]/15 bg-white p-3 shadow-xl"
                onMouseUp={() => setIsDragging(false)}
            >
                <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-0.5">
                    <button
                        type="button"
                        onClick={() => { setFechaFilterMode("dia"); setDragStart(null); setDragEnd(null); setIsDragging(false); }}
                        className={cls(
                            "flex-1 rounded-md py-1.5 text-[11px] font-black transition",
                            fechaFilterMode === "dia" ? "bg-[#131E5C] text-white shadow" : "text-slate-600 hover:bg-white"
                        )}
                    >
                        Día
                    </button>
                    <button
                        type="button"
                        onClick={() => { setFechaFilterMode("semana"); setDragStart(null); setDragEnd(null); setIsDragging(false); }}
                        className={cls(
                            "flex-1 rounded-md py-1.5 text-[11px] font-black transition",
                            fechaFilterMode === "semana" ? "bg-[#131E5C] text-white shadow" : "text-slate-600 hover:bg-white"
                        )}
                    >
                        Semana
                    </button>
                </div>

                <div className="mb-2 flex items-center justify-between gap-1">
                    <button type="button" onClick={() => nav(-1)} className="rounded-md p-1 text-[#131E5C] hover:bg-slate-100">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1">
                        <span className="text-[11px] font-black text-[#131E5C]">
                            {MESES_LARGOS[calMonth]}
                        </span>
                        <select
                            value={calYear}
                            onChange={(e) => setCalYear(Number(e.target.value))}
                            className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] font-black text-[#131E5C] outline-none cursor-pointer"
                        >
                            {Array.from({ length: 7 }, (_, i) => 2020 + i).map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button type="button" onClick={() => nav(1)} className="rounded-md p-1 text-[#131E5C] hover:bg-slate-100">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-px">
                    {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                        <div key={d} className="py-0.5 text-center text-[9px] font-extrabold uppercase text-slate-400">{d}</div>
                    ))}
                </div>

                <div className="select-none">
                    {weeks.map((wk) => (
                        <div key={wk.weekIndex} className="flex gap-px">
                            {fechaFilterMode === "semana" && (
                                <button
                                    type="button"
                                    onClick={() => selectWeek(wk.weekIndex)}
                                    className="mr-0.5 flex items-center justify-center rounded bg-[#131E5C]/10 px-1.5 text-[8px] font-black text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white whitespace-nowrap"
                                    title={`Seleccionar semana ${wk.weekIndex + 1}`}
                                >
                                    Sem {wk.weekIndex + 1}
                                </button>
                            )}
                            {wk.days.map((day, di) => {
                                if (day === null) return <div key={di} className="flex-1" />;
                                const dayYMD = ymd(day);
                                const esHoy = dayYMD === hoyYMD;
                                const inDrag = isInDragRange(dayYMD);
                                const inFilter = isInFilterRange(dayYMD);

                                return (
                                    <button
                                        key={di}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleMouseDown(day);
                                        }}
                                        onMouseEnter={() => handleMouseEnter(day)}
                                        onMouseUp={() => handleMouseUp(day)}
                                        onClick={() => handleClickDay(day)}
                                        className={cls(
                                            "flex-1 rounded py-1 text-center text-[11px] font-bold transition",
                                            inDrag
                                                ? "bg-[#131E5C] text-white"
                                                : inFilter
                                                    ? "bg-[#131E5C]/20 text-[#131E5C]"
                                                    : "text-[#131E5C] hover:bg-[#131E5C]/10",
                                            esHoy && !inDrag && "ring-1 ring-[#131E5C] font-black"
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="mt-2 border-t border-slate-100 pt-2">
                    {(filters.rangoDesde || filters.rangoHasta) ? (
                        <div className="text-center text-[10px] font-bold text-[#131E5C]">
                            {filters.rangoDesde === filters.rangoHasta
                                ? filters.rangoDesde
                                : `${filters.rangoDesde} → ${filters.rangoHasta}`}
                            <button
                                type="button"
                                onClick={() => { setFilters((prev) => ({ ...prev, rangoDesde: "", rangoHasta: "" })); setDragStart(null); setDragEnd(null); }}
                                className="ml-2 text-[10px] font-bold text-red-400 hover:text-red-600"
                            >
                                Limpiar
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-[10px] font-semibold text-slate-300 italic">
                            Arrastra para seleccionar rango
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function resetFilters() {
        setFilters({
            q: "",
            agencia: "Todas",
            estadoGeneral: "todos",
            rangoDesde: "",
            rangoHasta: "",
            sort: "fecha_desc",
        });
        setShowFechaPopup(false);
    }

    function getHoyMexicoYMD() { return toYMDMexico(new Date()); }

    function setHoy() {
        const hoy = getHoyMexicoYMD();
        setFilters((prev) => ({ ...prev, rangoDesde: hoy, rangoHasta: hoy }));
    }

    function setMesActual() {
        const hoy = new Date();
        const first = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const last = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        setFilters((prev) => ({ ...prev, rangoDesde: toYMDMexico(first), rangoHasta: toYMDMexico(last) }));
    }

    function setMesPasado() {
        const hoy = new Date();
        const first = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const last = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        setFilters((prev) => ({ ...prev, rangoDesde: toYMDMexico(first), rangoHasta: toYMDMexico(last) }));
    }

    const ViewToggle = () => (
        <div className="flex overflow-hidden rounded-lg border border-[#131E5C]/30 bg-white">
            {[
                { key: "lista", label: "Lista", Icon: ClipboardList },
                { key: "tabla", label: "Tabla", Icon: Table2 },
                { key: "graficos", label: "Gráficos", Icon: BarChart3 },
            ].map(({ key, label, Icon }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => setVista(key)}
                    className={cls(
                        "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition",
                        vista === key
                            ? "bg-[#131E5C] text-white"
                            : "bg-white text-[#131E5C] hover:bg-[#131E5C]/10"
                    )}
                >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="w-full">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-[#131E5C]">
                        Registro de reportes de control de calidad
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <ViewToggle />

                    <button
                        type="button"
                        onClick={refreshList}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0f1748]"
                    >
                        {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Recargar
                    </button>
                </div>
            </div>

            {errorList ? (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {errorList}
                </div>
            ) : null}

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard icon={ClipboardList} label="Reportes filtrados" value={metricas.total} detail={`${reportes.length} registros cargados`} />
                <StatCard
                    icon={AlertTriangle}
                    label="Con hallazgos"
                    value={metricas.conHallazgos}
                    detail={`${porcentajeEntero(metricas.conHallazgos, metricas.total)}% de los reportes`}
                    tone={metricas.conHallazgos > 0 ? "alert" : "success"}
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Desviaciones"
                    value={metricas.desviaciones}
                    detail={`${analitica.promedioDesviaciones.toFixed(2)} por reporte`}
                    tone={metricas.desviaciones > 0 ? "alert" : "success"}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Cumplimiento"
                    value={`${Math.round(metricas.cumplimiento)}%`}
                    tone={metricas.cumplimiento >= 95 ? "success" : metricas.cumplimiento >= 85 ? "warning" : "alert"}
                />
                <StatCard icon={Paperclip} label="Evidencias" value={metricas.evidencias} detail={`${analitica.promedioEvidencias.toFixed(2)} por reporte`} />
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-[#131E5C]">
                    <Search className="h-4 w-4" />
                    Filtros de búsqueda
                </div>

                <div className="mb-4">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-[#131E5C]/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#131E5C]/10">
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                            value={filters.q}
                            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                            placeholder="Buscar por OS, cliente, técnico, agencia, desviación..."
                            className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                        />
                        {filters.q ? (
                            <button
                                type="button"
                                onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Agencia</label>
                        <select
                            value={filters.agencia}
                            onChange={(e) => setFilters((prev) => ({ ...prev, agencia: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C]/40 focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10"
                        >
                            {agencias.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Estado general</label>
                        <select
                            value={filters.estadoGeneral}
                            onChange={(e) => setFilters((prev) => ({ ...prev, estadoGeneral: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C]/40 focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10"
                        >
                            <option value="todos">Todos</option>
                            <option value="con_hallazgos">Con hallazgos</option>
                            <option value="sin_hallazgos">Sin hallazgos</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Ordenar por</label>
                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C]/40 focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10"
                        >
                            <option value="fecha_desc">Fecha más reciente</option>
                            <option value="fecha_asc">Fecha más antigua</option>
                            <option value="hallazgos_desc">Más hallazgos</option>
                            <option value="cumplimiento_asc">Menor cumplimiento</option>
                            <option value="cumplimiento_desc">Mayor cumplimiento</option>
                            <option value="evidencias_desc">Más evidencias</option>
                            <option value="tecnico_asc">Técnico A-Z</option>
                            <option value="agencia_asc">Agencia A-Z</option>
                            <option value="cliente_asc">Cliente A-Z</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Fechas</div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={setHoy}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-600"
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            Hoy
                        </button>

                        <button
                            type="button"
                            onClick={setMesActual}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-blue-600"
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            Mes actual
                        </button>

                        <button
                            type="button"
                            onClick={setMesPasado}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-violet-600"
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            Mes pasado
                        </button>

                        <div className="h-5 w-px bg-slate-200" />

                        <div className="relative inline-block">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!showFechaPopup) {
                                        const hoy = new Date();
                                        setCalMonth(hoy.getMonth());
                                        setCalYear(hoy.getFullYear());
                                    }
                                    setShowFechaPopup((v) => !v);
                                }}
                                className={cls(
                                    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition",
                                    showFechaPopup
                                        ? "bg-[#131E5C] text-white shadow"
                                        : "border border-[#131E5C]/20 bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10"
                                )}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Seleccionar fecha
                                {(filters.rangoDesde || filters.rangoHasta) && (
                                    <span className="ml-0.5 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px]">✓</span>
                                )}
                            </button>
                            <FechaPopup />
                        </div>

                        <div className="h-5 w-px bg-slate-200" />

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpiar
                        </button>

                        <div className="ml-auto text-[11px] font-bold text-slate-400">
                            {reportesFiltrados.length} de {reportes.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== VISTA LISTA ==================== */}
            {vista === "lista" && (
                <>
                    {loadingList ? (
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
                        </div>
                    ) : reportesOrdenados.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#131E5C]/10 text-[#131E5C]">
                                <ClipboardList className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-lg font-black text-[#131E5C]">No hay reportes con esos filtros</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-500">
                                Ajusta la búsqueda, fechas o estado general para ver resultados.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {reportesOrdenados.map((reporte) => (
                                <TarjetaReporte
                                    key={reporte.id_reporte}
                                    reporte={reporte}
                                    onOpen={openDetail}
                                    onDelete={deleteReport}
                                    deleting={deletingId === reporte.id_reporte}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ==================== VISTA TABLA ==================== */}
            {vista === "tabla" && (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-auto">
                        <table className="min-w-[1550px] w-full text-left text-sm">
                            <thead className="bg-[#131E5C] text-xs text-white">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Agencia</th>
                                    <th className="px-4 py-3">Orden servicio</th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Técnico</th>
                                    <th className="px-4 py-3">Reportante</th>
                                    <th className="px-4 py-3">Validador CC</th>
                                    <th className="px-4 py-3 text-center">Sí</th>
                                    <th className="px-4 py-3 text-center">No</th>
                                    <th className="px-4 py-3 text-center">N/A</th>
                                    <th className="px-4 py-3 text-center">Cumplimiento</th>
                                    <th className="px-4 py-3 text-center">Evidencias</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-center">Detalle</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200">
                                {loadingList ? (
                                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                ) : (
                                    <>
                                        {reportesOrdenados.map((reporte) => {
                                            const resumen = obtenerResumenReporte(reporte);

                                            return (
                                                <tr
                                                    key={reporte.id_reporte}
                                                    onDoubleClick={() => openDetail(reporte)}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        deleteReport(reporte);
                                                    }}
                                                    className={cls(
                                                        "cursor-pointer transition hover:bg-slate-50",
                                                        resumen.tieneHallazgos ? "bg-red-50/20" : ""
                                                    )}
                                                    title="Doble clic para ver detalle · Clic derecho para eliminar"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">
                                                        {formatFechaReporte(reporte)}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[170px] truncate font-extrabold text-[#131E5C]">
                                                            {reporte.agencia || "—"}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[150px] truncate font-black text-[#131E5C]">
                                                            {reporte.orden_servicio || "—"}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[220px] truncate font-bold text-[#131E5C]">
                                                            {reporte.nombre_cliente || "—"}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[220px] truncate font-semibold text-slate-700">
                                                            {reporte.tecnico_reparo || "—"}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[200px] truncate font-semibold text-slate-600">
                                                            {reporte.reportante || "—"}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[210px] truncate font-semibold text-slate-600">
                                                            {reporte.valido_control_calidad || "—"}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-black text-emerald-600">{resumen.puntosSi}</span>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <span className={cls(
                                                            "font-black",
                                                            resumen.puntosNo > 0 ? "text-red-600" : "text-slate-400"
                                                        )}>
                                                            {resumen.puntosNo}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-black text-amber-500">{resumen.puntosNa}</span>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <CumplimientoBadge valor={resumen.cumplimiento} />
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex min-w-8 justify-center rounded-full bg-[#131E5C]/10 px-2 py-1 text-xs font-black text-[#131E5C]">
                                                            {resumen.evidencias}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <HallazgoBadge reporte={reporte} />
                                                    </td>

                                                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDetail(reporte)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-2 text-xs font-extrabold text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Ver
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {!reportesOrdenados.length && (
                                            <tr>
                                                <td colSpan={14} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                                                    No hay reportes con esos filtros.
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ==================== VISTA GRÁFICOS ==================== */}
            {vista === "graficos" && (
                loadingList ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
                    </div>
                ) : (
                    <GraficosSafety analitica={analitica} />
                )
            )}

            {/* ==================== MODAL DETALLE ==================== */}
            <Modal
                open={openModal}
                onClose={closeModal}
                title={
                    selected
                        ? `Reporte #${selected.id_reporte} · ${selected.orden_servicio || "Sin OS"}`
                        : "Detalle del reporte"
                }
            >
                {loadingDetail && !selected ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : !selected ? null : (
                    <div className="space-y-6">
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <Field label="Fecha del reporte" icon={CalendarDays}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {formatFechaReporte(selected)}
                                </div>
                            </Field>

                            <Field label="Agencia" icon={Building2}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {selected.agencia || "—"}
                                </div>
                            </Field>

                            <Field label="Orden de servicio" icon={FileText}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {selected.orden_servicio || "—"}
                                </div>
                            </Field>

                            <Field label="Cliente" icon={User}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {selected.nombre_cliente || "—"}
                                </div>
                            </Field>

                            <Field label="Reportante" icon={UserRound}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {selected.reportante || "—"}
                                </div>
                            </Field>

                            <Field label="Técnico que reparó" icon={Wrench}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {selected.tecnico_reparo || "—"}
                                </div>
                            </Field>

                            <Field label="Validó control de calidad" icon={ShieldCheck}>
                                <div className="text-sm font-bold text-[#131E5C]">
                                    {selected.valido_control_calidad || "—"}
                                </div>
                            </Field>

                            <Field label="Cumplimiento" icon={CheckCircle2}>
                                <div className="flex items-center gap-3">
                                    <CumplimientoBadge valor={selectedResumen.cumplimiento} />
                                    <div className="flex-1">
                                        <BarraCumplimiento value={selectedResumen.cumplimiento} />
                                    </div>
                                </div>
                            </Field>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                            <MiniMetric label="Puntos" value={selectedResumen.totalPuntos} />
                            <MiniMetric label="Sí" value={selectedResumen.puntosSi} tone="success" />
                            <MiniMetric label="No" value={selectedResumen.puntosNo} tone="danger" />
                            <MiniMetric label="N/A" value={selectedResumen.puntosNa} tone="warning" />
                            <MiniMetric label="Pendientes" value={selectedResumen.pendientes} />
                            <MiniMetric label="Evidencias" value={selectedResumen.evidencias} />
                        </section>

                        {selectedResumen.tieneHallazgos ? (
                            <section className="rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                    <div>
                                        <div className="text-sm font-black text-red-700">
                                            Este reporte contiene {selectedResumen.puntosNo} desviación{selectedResumen.puntosNo !== 1 ? "es" : ""}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                    <div>
                                        <div className="text-sm font-black text-emerald-700">Reporte sin desviaciones detectadas</div>
                                        <div className="mt-1 text-xs font-semibold text-emerald-600/80">
                                            No existen puntos del checklist marcados como NO.
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        <section>
                            <div className="mb-3 text-sm font-extrabold tracking-wide text-[#131E5C]">
                                Comentarios Finales
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium leading-6 text-slate-700 shadow-sm">
                                {normalizeStr(selected.comentarios_finales)
                                    ? selected.comentarios_finales
                                    : "Sin comentarios finales."}
                            </div>
                        </section>

                        <section>
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#131E5C]">
                                <Paperclip className="h-4 w-4" />
                                Evidencias Generales
                            </div>

                            <EvidenciasGrid
                                adjuntos={obtenerAdjuntosGenerales(selected)}
                                emptyText="Este reporte no tiene evidencias generales."
                            />
                        </section>

                        <section>
                            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#131E5C]">
                                <ClipboardList className="h-4 w-4" />
                                Checklist Evaluado
                            </div>

                            <div className="space-y-4">
                                {obtenerChecklist(selected).length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
                                        No hay puntos registrados en el checklist.
                                    </div>
                                ) : (
                                    obtenerChecklist(selected).map((punto, index) => (
                                        <ChecklistCard
                                            key={`${punto?.id || "punto"}-${index}`}
                                            punto={punto}
                                            adjuntos={obtenerAdjuntosPorPunto(selected, punto?.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </Modal>
        </div>
    );
}