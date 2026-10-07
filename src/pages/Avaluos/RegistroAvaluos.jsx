import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
    Plus,
    Search,
    X,
    Save,
    User,
    CarFront,
    CalendarDays,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Trash2,
    Loader2,
    Phone,
    Building2,
    MessageSquareText,
    Hash,
    Mail,
    BadgeDollarSign,
    Trophy,
    Gauge,
    ClipboardList,
    UserStar,
    Paperclip,
    Image as ImageIcon,
    Video,
    FileText,
    UploadCloud,
    Eye,
    Palette,
    TableProperties,
    BarChart3,
    FileSpreadsheet,
    Wrench,
    Camera,
    ListChecks,
    CalendarClock,
    ClipboardCheck,
    Printer,
} from "lucide-react";
import { apiAvaluos } from "../../lib/apiAvaluos";
import { http as httpDescarga } from "../../lib/apiPruebas";
import ChecklistVerificacion from "./ChecklistVerificacion";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import ReactECharts from "echarts-for-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

const BRAND_BLUE = "#131E5C";
const MAX_ARCHIVO_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_EVIDENCIAS_BYTES = 100 * 1024 * 1024;
const PAGE_SIZE_DEFAULT = 50;
const API_BASE = (
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com"
).replace(/\/$/, "");

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function Skeleton({ className = "" }) {
    return (
        <div
            className={["animate-pulse rounded-md bg-black/10", className].join(" ")}
        />
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 18 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-200/60" />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 14 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"
                >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
            <div className="md:col-span-3 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-28 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, subtitle, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div
                className="absolute inset-0 bg-black/55"
                onClick={onClose}
            />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-7xl overflow-hidden rounded-2xl border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">
                                {title}
                            </div>
                            {subtitle ? (
                                <div className="mt-0.5 truncate text-xs font-semibold text-white/60">
                                    {subtitle}
                                </div>
                            ) : null}
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[80vh] overflow-auto overscroll-contain p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function SectionBanner({ icon: Icon, title }) {
    return (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/5 px-4 py-3">
            {Icon ? <Icon className="h-5 w-5 text-[#131E5C]" /> : null}
            <span className="text-sm font-extrabold text-[#131E5C]">{title}</span>
        </div>
    );
}

function Field({ label, icon: Icon, children, className = "" }) {
    return (
        <div
            className={[
                "rounded-lg border border-white/10 bg-neutral-200/50 p-4",
                className,
            ].join(" ")}
        >
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
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
                {label}
            </div>
            {children}
        </div>
    );
}

function obtenerMensajeError(error) {
    const data = error?.data || error?.response?.data || error?.body;

    if (typeof data === "string" && data.trim()) return data;

    if (data && typeof data === "object") {
        const mensajes = Object.entries(data).flatMap(([campo, valor]) => {
            const lista = Array.isArray(valor) ? valor : [valor];
            return lista
                .filter(Boolean)
                .map((mensaje) => `${campo}: ${String(mensaje)}`);
        });

        if (mensajes.length) return mensajes.join("\n");
    }

    return error?.message || "Error guardando el avalúo.";
}

function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const inicio = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const fin = Math.min(page * pageSize, total);

    return (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold text-slate-500">
                Mostrando {inicio}-{fin} de {total} registros
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="rounded-lg border border-[#131E5C]/30 bg-white px-2 py-2 text-xs font-semibold text-[#131E5C] outline-none"
                >
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                </select>

                <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="rounded-lg border border-[#131E5C]/20 px-3 py-2 text-xs font-bold text-[#131E5C] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Anterior
                </button>

                <span className="px-2 text-xs font-bold text-[#131E5C]">
                    Página {page} de {totalPages}
                </span>

                <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="rounded-lg border border-[#131E5C]/20 px-3 py-2 text-xs font-bold text-[#131E5C] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div
            className="fixed z-[9999]"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>

                <button
                    className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
                    onClick={onClose}
                >
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);

    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}

function fromDTLocalToISO(valor) {
    const v = String(valor || "").trim();
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

function fileStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
    )}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) return "0 KB";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function resolveEvidenceUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("blob:")
    ) {
        return value;
    }
    if (value.startsWith("/")) {
        return `${API_BASE}${value}`;
    }
    return `${API_BASE}/${value}`;
}

function inferEvidenceKind(source) {
    const tipo = String(source?.tipo || "").toLowerCase();
    if (tipo === "imagen" || tipo === "image") return "imagen";
    if (tipo === "video") return "video";

    const mime = String(source?.file?.type || source?.contentType || "").toLowerCase();
    if (mime.startsWith("image/")) return "imagen";
    if (mime.startsWith("video/")) return "video";

    const name = String(source?.nombre || source?.file?.name || "").toLowerCase();
    if (
        /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(name)
    ) {
        return "imagen";
    }
    if (
        /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(name)
    ) {
        return "video";
    }

    return "archivo";
}

function generateTempId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return `tmp-${crypto.randomUUID()}`;
    }
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildLocalEvidenceItem(file) {
    const tipo = inferEvidenceKind({ file, nombre: file?.name });
    const previewUrl =
        tipo === "imagen" || tipo === "video" ? URL.createObjectURL(file) : "";

    return {
        _tmpId: generateTempId(),
        nombre: file?.name || "archivo",
        tipo,
        size: file?.size || 0,
        file,
        url: previewUrl,
        isLocal: true,
    };
}

function revokeEvidencePreview(item) {
    const url = String(item?.url || "");
    if (url.startsWith("blob:")) {
        try {
            URL.revokeObjectURL(url);
        } catch {
            // sin acción
        }
    }
}

function cleanupDraftResources(draft) {
    const nuevos = Array.isArray(draft?.evidencias_nuevas)
        ? draft.evidencias_nuevas
        : [];
    nuevos.forEach(revokeEvidencePreview);
}

function EvidenceTag({ tipo }) {
    const value = inferEvidenceKind({ tipo });

    if (value === "imagen") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                <ImageIcon className="h-3.5 w-3.5" />
                Imagen
            </span>
        );
    }

    if (value === "video") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                <Video className="h-3.5 w-3.5" />
                Video
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700">
            <FileText className="h-3.5 w-3.5" />
            Archivo
        </span>
    );
}

function EvidenceCard({ item, onRemove }) {
    const tipo = inferEvidenceKind(item);
    const url = resolveEvidenceUrl(item?.url || item?.archivo);
    const nombre = item?.nombre || item?.file?.name || "archivo";
    const size = item?.size || item?.file?.size || 0;

    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative">
                {tipo === "imagen" && url ? (
                    <img
                        src={url}
                        alt={nombre}
                        loading="lazy"
                        decoding="async"
                        className="aspect-video max-h-52 w-full object-cover"
                    />
                ) : tipo === "video" && url ? (
                    <video
                        src={url}
                        controls
                        preload="metadata"
                        className="aspect-video max-h-52 w-full bg-black object-cover"
                    />
                ) : (
                    <div className="flex aspect-video max-h-52 w-full items-center justify-center bg-slate-100">
                        <div className="px-3 text-center">
                            <FileText className="mx-auto h-10 w-10 text-slate-500" />
                            <div className="mt-2 text-xs font-bold text-slate-600">
                                Vista previa no disponible
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white transition hover:bg-red-600"
                    title="Quitar evidencia"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-3 p-3">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div
                            className="max-w-full break-words text-sm font-bold text-[#131E5C] sm:truncate"
                            title={nombre}
                        >
                            {nombre}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                            {size ? formatFileSize(size) : "Archivo guardado"}
                        </div>
                    </div>

                    <div className="shrink-0">
                        <EvidenceTag tipo={tipo} />
                    </div>
                </div>

                {url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-2 text-xs font-bold text-[#131E5C] transition hover:bg-[#131E5C]/10 sm:w-auto"
                    >
                        <Eye className="h-4 w-4" />
                        Ver
                    </a>
                ) : null}
            </div>
        </div>
    );
}

function MobileCardList({ rows, loading, onEdit, onContext }) {
    return (
        <div className="lg:hidden">
            <div className="overflow-hidden rounded-lg bg-white/[0.03] shadow-lg">
                {loading ? (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-black/10 bg-white p-4 shadow-sm"
                            >
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="mt-3 h-4 w-28" />
                                <Skeleton className="mt-3 h-4 w-56" />
                                <Skeleton className="mt-4 h-8 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[#131E5C]">
                        No hay resultados con esos filtros.
                    </div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                            const nombreCliente = row?.cliente?.nombre || "—";
                            const telefonoCliente = row?.cliente?.telefono || "—";
                            const evidenciasCount = Array.isArray(row?.evidencias)
                                ? row.evidencias.length
                                : 0;

                            return (
                                <div
                                    key={row.id}
                                    onClick={() => onEdit(row)}
                                    onContextMenu={(e) => onContext(e, row)}
                                    className="cursor-pointer rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md"
                                    title="Toca para editar"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                                                <CalendarDays className="h-4 w-4" />
                                                <span className="truncate">
                                                    {row.fecha_avaluo
                                                        ? toDTLocal(row.fecha_avaluo).replace("T", " ")
                                                        : "Sin fecha"}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Building2 className="h-4 w-4" />
                                                <span className="truncate">{row.agencia || "—"}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-full border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                            {row.etapa_proceso || "Sin etapa"}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                                            <User className="h-4 w-4" />
                                            <span className="truncate">{nombreCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Phone className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{telefonoCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CarFront className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">
                                                {[row.marca_auto, row.modelo, row.anio_modelo]
                                                    .filter(Boolean)
                                                    .join(" ") || "—"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Palette className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.color || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <BadgeDollarSign className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">
                                                Guía: {row.precio_guia || "—"} | Est.:{" "}
                                                {row.costo_estimado || "—"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Paperclip className="h-4 w-4 text-[#131E5C]" />
                                            <span>{evidenciasCount} evidencias</span>
                                        </div>

                                        <div className="mt-1 text-xs text-slate-600">
                                            <div className="flex items-start gap-2">
                                                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" />
                                                <span className="line-clamp-2">
                                                    {row.descripcion || row.comentarios || "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function crearConceptoVacio() {
    return {
        id: null,
        descripcion: "",
        costo: "",
    };
}

function limpiarTextoMonto(valor) {
    return String(valor ?? "")
        .replace(/[^\d.,-]/g, "")
        .replace(/,/g, "");
}

function montoANumero(valor) {
    const limpio = limpiarTextoMonto(valor);
    if (!limpio || limpio === "-" || limpio === ".") return 0;
    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : 0;
}

function montoA2Decimales(valor) {
    return montoANumero(valor).toFixed(2);
}

function formatoMoneda(valor) {
    const numero = Number(valor || 0);
    return numero.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function normalizarConceptosAvaluo(item) {
    const posiblesConceptos = Array.isArray(item?.conceptos)
        ? item.conceptos
        : [];

    if (posiblesConceptos.length) {
        return posiblesConceptos.map((concepto) => ({
            id: concepto.id ?? null,
            descripcion: concepto.descripcion || "",
            costo: String(concepto.costo ?? ""),
        }));
    }
    const costoReparacion = montoANumero(item?.costo_reparacion);

    if (costoReparacion > 0) {
        return [
            {
                id: null,
                descripcion: "Costo de reparación registrado",
                costo: String(item.costo_reparacion || costoReparacion),
            },
        ];
    }

    return [crearConceptoVacio()];
}

function normalizarEvidenciasAvaluo(item) {
    if (!Array.isArray(item?.evidencias)) return [];

    return item.evidencias.map((ev) => ({
        ...ev,
        url: resolveEvidenceUrl(ev?.url || ev?.archivo),
        isLocal: false,
    }));
}

function GraficasAvaluos({ rows }) {
    const porDealer = useMemo(() => {
        const conteo = {};

        rows.forEach((row) => {
            const dealer = row.agencia || "Sin dealer";
            conteo[dealer] = (conteo[dealer] || 0) + 1;
        });

        return Object.entries(conteo)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [rows]);

    const porAsesor = useMemo(() => {
        const conteo = {};

        rows.forEach((row) => {
            const asesor = row.asesor_ventas || "Sin asesor";
            conteo[asesor] = (conteo[asesor] || 0) + 1;
        });

        return Object.entries(conteo)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [rows]);

    const porMarca = useMemo(() => {
        const conteo = {};

        rows.forEach((row) => {
            const marca = row.marca_auto || "Sin marca";
            conteo[marca] = (conteo[marca] || 0) + 1;
        });

        return Object.entries(conteo)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [rows]);

    const porEtapa = useMemo(() => {
        const conteo = {};

        rows.forEach((row) => {
            const etapa = row.etapa_proceso || "Sin etapa";
            conteo[etapa] = (conteo[etapa] || 0) + 1;
        });

        return Object.entries(conteo).map(([name, value]) => ({
            name,
            value,
        }));
    }, [rows]);

    const porTipoToma = useMemo(() => {
        const conteo = {};

        rows.forEach((row) => {
            const tipo = row.tipo_toma || "Sin tipo";
            conteo[tipo] = (conteo[tipo] || 0) + 1;
        });

        return Object.entries(conteo).map(([name, value]) => ({
            name,
            value,
        }));
    }, [rows]);

    const porFecha = useMemo(() => {
        const conteo = {};

        rows.forEach((row) => {
            if (!row.fecha_avaluo) return;

            const fecha = String(row.fecha_avaluo).slice(0, 10);
            conteo[fecha] = (conteo[fecha] || 0) + 1;
        });

        return Object.entries(conteo)
            .map(([fecha, value]) => ({ fecha, value }))
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .slice(-15);
    }, [rows]);

    const totalAvaluos = rows.length || 1;

    const porcentaje = (valor) => {
        return ((valor / totalAvaluos) * 100).toFixed(1);
    };

    const dealerPrincipal = porDealer[0] || { name: "Sin datos", value: 0 };
    const marcaPrincipal = porMarca[0] || { name: "Sin datos", value: 0 };

    const etapaPrincipal =
        [...porEtapa].sort((a, b) => b.value - a.value)[0] || {
            name: "Sin datos",
            value: 0,
        };

    const opcionDealer = {
        tooltip: { trigger: "axis" },
        grid: {
            left: 20,
            right: 50,
            top: 20,
            bottom: 20,
            containLabel: true,
        },
        xAxis: {
            type: "value",
            minInterval: 1,
        },
        yAxis: {
            type: "category",
            data: porDealer.map((item) => item.name),
        },

        series: [
            {
                type: "bar",
                data: porDealer.map((item) => item.value),
                barWidth: 20,
                itemStyle: {
                    borderRadius: [0, 6, 6, 0],
                    color: BRAND_BLUE,
                },
                label: {
                    show: true,
                    position: "right",
                    formatter: (params) =>
                        `${params.value} (${porcentaje(params.value)}%)`,
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#131E5C",
                },
            },
        ],
    };

    const opcionAsesor = {
        tooltip: { trigger: "axis" },
        grid: {
            left: 20,
            right: 55,
            top: 20,
            bottom: 20,
            containLabel: true,
        },
        xAxis: {
            type: "value",
            minInterval: 1,
        },
        yAxis: {
            type: "category",
            inverse: true,
            data: porAsesor.map((item) => item.name),
            axisLabel: {
                width: 110,
                overflow: "truncate",
            },
        },
        series: [
            {
                type: "bar",
                data: porAsesor.map((item) => item.value),
                barWidth: 18,
                itemStyle: {
                    borderRadius: [0, 6, 6, 0],
                    color: BRAND_BLUE,
                },
                label: {
                    show: true,
                    position: "right",
                    formatter: (params) =>
                        `${params.value} (${porcentaje(params.value)}%)`,
                    fontSize: 10,
                    fontWeight: "bold",
                    color: "#131E5C",
                },
            },
        ],
    };

    const opcionMarca = {
        tooltip: { trigger: "axis" },
        grid: {
            left: 20,
            right: 55,
            top: 20,
            bottom: 20,
            containLabel: true,
        },
        xAxis: {
            type: "value",
            minInterval: 1,
        },
        yAxis: {
            type: "category",
            inverse: true,
            data: porMarca.map((item) => item.name),
        },

        series: [
            {
                type: "bar",
                data: porMarca.map((item) => item.value),
                barWidth: 18,
                itemStyle: {
                    borderRadius: [0, 6, 6, 0],
                    color: BRAND_BLUE,
                },
                label: {
                    show: true,
                    position: "right",
                    formatter: (params) =>
                        `${params.value} (${porcentaje(params.value)}%)`,
                    fontSize: 10,
                    fontWeight: "bold",
                    color: "#131E5C",
                },
            },
        ],

    };

    const opcionEtapa = {
        tooltip: { trigger: "item" },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 11 },
        },

        series: [
            {
                type: "pie",
                radius: ["44%", "64%"],
                center: ["50%", "45%"],
                data: porEtapa,
                label: {
                    show: true,
                    formatter: (params) =>
                        `${params.name}\n${params.value} (${params.percent.toFixed(1)}%)`,
                    fontSize: 10,
                    fontWeight: "bold",
                    lineHeight: 12,
                },
                labelLine: {
                    show: true,
                    length: 8,
                    length2: 8,
                },
            },
        ],
    };

    const opcionTipoToma = {
        tooltip: { trigger: "item" },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 11 },
        },

        series: [
            {
                type: "pie",
                radius: ["44%", "64%"],
                center: ["50%", "45%"],
                data: porTipoToma,
                label: {
                    show: true,
                    formatter: (params) =>
                        `${params.name}\n${params.value} (${params.percent.toFixed(1)}%)`,
                    fontSize: 10,
                    fontWeight: "bold",
                    lineHeight: 12,
                },
                labelLine: {
                    show: true,
                    length: 8,
                    length2: 8,
                },
            },
        ],
    };

    const opcionFecha = {
        tooltip: { trigger: "axis" },
        grid: {
            left: 20,
            right: 20,
            top: 20,
            bottom: 40,
            containLabel: true,
        },
        xAxis: {
            type: "category",
            data: porFecha.map((item) => item.fecha),
            axisLabel: {
                rotate: 35,
                fontSize: 10,
            },
        },
        yAxis: {
            type: "value",
            minInterval: 1,
        },

        series: [
            {
                type: "line",
                smooth: true,
                data: porFecha.map((item) => item.value),
                symbolSize: 7,
                lineStyle: {
                    width: 3,
                },
                areaStyle: {},
                label: {
                    show: true,
                    position: "top",
                    formatter: "{c}",
                    fontSize: 10,
                    fontWeight: "bold",
                    color: "#131E5C",
                },
            },
        ],
    };

    return (
        <>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">
                        Total avalúos
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#131E5C]">
                        {rows.length}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">
                        Dealer principal
                    </p>
                    <p className="mt-1 truncate text-sm font-extrabold text-[#131E5C]">
                        {dealerPrincipal.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                        {dealerPrincipal.value} avalúos · {porcentaje(dealerPrincipal.value)}%
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">
                        Marca principal
                    </p>
                    <p className="mt-1 truncate text-sm font-extrabold text-[#131E5C]">
                        {marcaPrincipal.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                        {marcaPrincipal.value} avalúos · {porcentaje(marcaPrincipal.value)}%
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">
                        Etapa principal
                    </p>
                    <p className="mt-1 truncate text-sm font-extrabold text-[#131E5C]">
                        {etapaPrincipal.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                        {etapaPrincipal.value} avalúos · {porcentaje(etapaPrincipal.value)}%
                    </p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">
                            Avalúos por dealer
                        </h3>
                        <p className="text-xs text-slate-400">
                            Distribución de avalúos registrados
                        </p>
                    </div>

                    <ReactECharts option={opcionDealer} style={{ height: 260 }} notMerge />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">
                            Avalúos por asesor
                        </h3>
                        <p className="text-xs text-slate-400">
                            Top 10 asesores con más avalúos
                        </p>
                    </div>

                    <ReactECharts option={opcionAsesor} style={{ height: 260 }} notMerge />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">
                            Avalúos por marca
                        </h3>
                        <p className="text-xs text-slate-400">
                            Marcas con mayor número de avalúos
                        </p>
                    </div>

                    <ReactECharts option={opcionMarca} style={{ height: 260 }} notMerge />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">
                            Etapa del proceso
                        </h3>
                        <p className="text-xs text-slate-400">
                            Distribución actual de los avalúos
                        </p>
                    </div>

                    <ReactECharts option={opcionEtapa} style={{ height: 280 }} notMerge />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">
                            Tipo de toma
                        </h3>
                        <p className="text-xs text-slate-400">
                            Distribución por origen de toma
                        </p>
                    </div>

                    <ReactECharts option={opcionTipoToma} style={{ height: 280 }} notMerge />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2">
                        <h3 className="text-sm font-extrabold text-[#131E5C]">
                            Avalúos por fecha
                        </h3>
                        <p className="text-xs text-slate-400">
                            Evolución de avalúos registrados
                        </p>
                    </div>

                    <ReactECharts option={opcionFecha} style={{ height: 280 }} notMerge />
                </div>
            </div>
        </>
    );
}

export default function RegistroAvaluos() {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const draftRef = useRef(null);

    // ── permisos y agencias (igual que RegistroCredito) ──────────────────────
    const isAdmin = useMemo(() => {
        const rol = String(user?.rol || "")
            .trim()
            .toLowerCase();

        return rol === "administrador";
    }, [user]);

    // Array de agencias del usuario (soporta múltiples separadas por "|")
    const userAgencias = useMemo(() => {
        return String(user?.agencia || "")
            .split("|")
            .map((a) => normalizeStr(a))
            .filter(Boolean);
    }, [user?.agencia]);

    const userAgencia = userAgencias[0] || "";

    // Helper: ¿el registro pertenece a alguna agencia del usuario?
    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            const agencia = normalizeStr(agenciaRegistro);
            if (!agencia) return false;
            return userAgencias.some(
                (a) => a.toLowerCase() === agencia.toLowerCase()
            );
        },
        [userAgencias]
    );
    // ─────────────────────────────────────────────────────────────────────────

    const [avaluos, setAvaluos] = useState([]);
    const [viewMode, setViewMode] = useState("tabla");
    const [exportando, setExportando] = useState(null);
    const [ctxMenu, setCtxMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        row: null,
    });

    const [sort, setSort] = useState({ key: "fecha_avaluo", dir: "desc" });
    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [activeTab, setActiveTab] = useState("cliente");

    const TABS_AVALUO = [
        { key: "cliente", label: "Cliente", icon: User },
        { key: "vehiculo", label: "Vehículo", icon: CarFront },
        { key: "valores", label: "Valores", icon: BadgeDollarSign },
        { key: "tecnica", label: "Técnica", icon: Wrench },
        { key: "evidencias", label: "Evidencias", icon: Camera },
        { key: "lista", label: "Lista de verificación", icon: ClipboardList },
    ];

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imprimiendoChecklist, setImprimiendoChecklist] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [debouncedQ, setDebouncedQ] = useState("");
    const [graficasRows, setGraficasRows] = useState([]);
    const [loadingGraficas, setLoadingGraficas] = useState(false);

    const DEALERS = useMemo(
        () => [
            "VW Cordoba",
            "VW Orizaba",
            "VW Poza Rica",
            "VW Tuxtepec",
            "VW Tuxpan",
        ],
        []
    );

    const ASESORES = [
        "ADRIAN GALVEZ ROLDAN",
        "AURA MARLIZETH FERNANDEZ LOPEZ",
        "Bianca Isabel Chavez Alarcon",
        "Blanca Patricia Hernandez Hernandez",
        "CANDY DENISSE MARQUEZ CORTES",
        "Carlos Arturo Garces Venegas",
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
        "Julio Ramirez Lopez",
        "LIZBETH CANO CLARA",
        "Luis Alberto Ramirez Santamaria",
        "LUIS ALFONSO CORIA MARROQUIN",
        "Luis Armando Almora Perez",
        "Luis Manuel Alvarez Martinez",
        "Luis Manuel Hernandez Espejo",
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
        "Patricia Cano",
        "Planta Puebla",
        "Servicio Nuevos",
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

    const ETAPAS_PROCESO = [
        "Prospecto",
        "Pendiente de revisión",
        "En subasta",
        "Negociación",
        "Cerrado",
        "Descartado",
    ];

    const TIPO_TOMA = ["Canal", "Auto a Cuenta"];

    // Orígenes como en prospectos (NuevoProspectoModal: origenMeta + PAUTAS_BASE)
    const ORIGENES_VALUACION = [
        "Facebook",
        "Facebook Ads",
        "Instagram Ads",
        "Google Ads",
        "Campaña",
        "WhatsApp",
        "Llamada Entrante",
        "VW-Concesionarios",
        "Referido",
        "Orgánico",
        "Evento",
        "Otro",
    ];

    const MARCA = [
        "ACURA",
        "ALFA ROMEO",
        "AUDI",
        "BAIC",
        "BMW",
        "BUICK",
        "BYD",
        "CADILLAC",
        "CHANGAN",
        "CHERY",
        "CHEVROLET",
        "CHIREY",
        "CHRYSLER",
        "CITROEN",
        "CUPRA",
        "DODGE",
        "FIAT",
        "FORD",
        "FOTON",
        "GAC",
        "GEELY",
        "GENESIS",
        "GMC",
        "GREAT WALL",
        "HAVAL",
        "HONDA",
        "HYUNDAI",
        "INFINITI",
        "ISUZU",
        "JAC",
        "JAECOO",
        "JAGUAR",
        "JEEP",
        "JETOUR",
        "KIA",
        "LAND ROVER",
        "LEXUS",
        "LINCOLN",
        "MASERATI",
        "MAZDA",
        "MERCEDES-BENZ",
        "MG",
        "MINI",
        "MITSUBISHI",
        "NISSAN",
        "OMODA",
        "PEUGEOT",
        "PORSCHE",
        "RAM",
        "RENAULT",
        "SEAT",
        "SMART",
        "SUBARU",
        "SUZUKI",
        "TESLA",
        "TOYOTA",
        "VOLKSWAGEN",
        "VOLVO",
        "ZEEKR",
    ];

    const REQUIRED = useMemo(
        () => ({
            cliente_telefono: "Teléfono",
            fecha_avaluo: "Fecha de avalúo",
        }),
        []
    );

    const missing = useMemo(() => {
        if (!draft) return [];
        const faltantes = [];

        for (const key of Object.keys(REQUIRED)) {
            const valor = draft[key];
            const vacio =
                valor === null ||
                valor === undefined ||
                (typeof valor === "string" && valor.trim() === "");

            if (vacio) faltantes.push(key);
        }

        return faltantes;
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => {
        return String(draft?.cliente_telefono || "").replace(/\D/g, "");
    }, [draft?.cliente_telefono]);

    const telIsOk = useMemo(
        () => /^(?:\d{10}|52\d{10})$/.test(telDigits),
        [telDigits]
    );

    const telIsNormalized = useMemo(
        () => /^52\d{10}$/.test(telDigits),
        [telDigits]
    );

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";

        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";

        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11)
            return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) {
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        }
        if (telDigits.length > 12)
            return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;

    const inputBase =
        "w-full rounded-lg border px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none transition-colors duration-150 placeholder:text-[#131E5C]/40 placeholder:font-normal focus:ring-2 focus:ring-[#131E5C]/15";
    const inputOk = "border-black/10 bg-neutral-100 focus:border-[#131E5C]/40";
    const inputBad = "border-red-500 bg-red-50";

    useEffect(() => {
        const onGlobal = () =>
            setCtxMenu((prev) => ({ ...prev, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);

        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    useEffect(() => {
        draftRef.current = draft;
    }, [draft]);

    useEffect(() => {
        return () => {
            cleanupDraftResources(draftRef.current);
        };
    }, []);

    function toggleSort(key) {
        setPage(1);
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQ(filters.q.trim());
            setPage(1);
        }, 350);

        return () => window.clearTimeout(timer);
    }, [filters.q]);

    const refreshList = useCallback(async (pageOverride = null) => {
        const paginaSolicitada = pageOverride || page;
        setLoadingList(true);

        try {
            const data = await apiAvaluos.list({
                page: paginaSolicitada,
                pageSize,
                search: debouncedQ,
                agencia: filters.agencia,
                desde: filters.rangoDesde,
                hasta: filters.rangoHasta,
                ordering: `${sort.dir === "desc" ? "-" : ""}${sort.key}`,
            });

            setAvaluos(data.results);
            setTotalRegistros(data.count);
        } catch (error) {
            console.error("Error cargando avalúos:", error);
            setAvaluos([]);
            setTotalRegistros(0);
        } finally {
            setLoadingList(false);
        }
    }, [page, pageSize, debouncedQ, filters.agencia, filters.rangoDesde, filters.rangoHasta, sort]);

    useEffect(() => {
        refreshList();
    }, [refreshList]);

    // Dealers disponibles. La tabla ya llega filtrada y paginada desde el backend.
    const dealers = useMemo(() => {
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }

        return ["Todos", ...DEALERS];
    }, [DEALERS, isAdmin, userAgencias]);

    // Con paginación de servidor no debemos volver a filtrar solamente la página visible.
    const sorted = avaluos;

    // ── Exportar Excel ──────────────────────────────────────────────────────────
    const filaAvaluoExport = (row) => ({
        "Fecha de Avalúo": toDTLocal(row.fecha_avaluo).replace("T", " "),
        Dealer: row.agencia || "—",
        "Asesor Ventas": row.asesor_ventas || "—",
        Cliente: row?.cliente?.nombre || "—",
        Teléfono: row?.cliente?.telefono || "—",
        Correo: row?.cliente?.correo || "—",
        "Marca de Auto": row.marca_auto || "—",
        Modelo: row.modelo || "—",
        "Año Modelo": row.anio_modelo || "—",
        Serie: row.serie || "—",
        Kilometraje: row.kilometraje || "—",
        "Precio Guía": row.precio_guia || "—",
        "Costo Reparación": row.costo_reparacion || "—",
        "Costo Estimado": row.costo_estimado || "—",
        "Oferta Económica": row.oferta_economica || "—",
        Color: row.color || "—",
        "Ganador Subasta": row.ganador_subasta || "—",
        "Etapa del Proceso": row.etapa_proceso || "—",
        Evidencias: Array.isArray(row?.evidencias) ? row.evidencias.length : 0,
        Descripción: row.descripcion || "—",
        Comentarios: row.comentarios || "—",
    });

    const exportarExcelAvaluos = async () => {
        if (exportando) return;

        if (!sorted.length) {
            alert("No hay registros para exportar con los filtros actuales.");
            return;
        }

        setExportando("excel");

        try {
            const rowsExport = await apiAvaluos.listAll({
                search: debouncedQ,
                agencia: filters.agencia,
                desde: filters.rangoDesde,
                hasta: filters.rangoHasta,
                ordering: `${sort.dir === "desc" ? "-" : ""}${sort.key}`,
            });

            const registros = rowsExport.map(filaAvaluoExport);

            const ws = XLSX.utils.json_to_sheet(registros);

            ws["!cols"] = Object.keys(registros[0] || {}).map((k) => ({
                wch: Math.min(45, Math.max(12, k.length + 6)),
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Avalúos");

            XLSX.writeFile(wb, `avaluos_${fileStamp()}.xlsx`, {
                compression: true,
            });
        } catch (error) {
            console.error("Error exportando avalúos a Excel:", error);
            alert("No se pudo generar el Excel. Revisa la consola.");
        } finally {
            setExportando(null);
        }
    };

    // ── Exportar PDF ────────────────────────────────────────────────────────────
    const exportarPdfAvaluos = async () => {
        if (exportando) return;

        if (!sorted.length) {
            alert("No hay registros para exportar con los filtros actuales.");
            return;
        }

        setExportando("pdf");

        try {
            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(19, 30, 92);
            doc.text("Reporte de Avalúos - Autos Usados", 10, 12);

            const headers = [
                "Fecha de Avalúo",
                "Dealer",
                "Asesor Ventas",
                "Cliente",
                "Teléfono",
                "Correo",
                "Marca de Auto",
                "Modelo",
                "Año",
                "Serie",
                "Kilometraje",
                "Precio Guía",
                "Costo Reparación",
                "Costo Estimado",
                "Oferta Económica",
                "Color",
                "Ganador Subasta",
                "Etapa del Proceso",
                "Evidencias",
                "Descripción",
                "Comentarios",
            ];

            const rowsExport = await apiAvaluos.listAll({
                search: debouncedQ,
                agencia: filters.agencia,
                desde: filters.rangoDesde,
                hasta: filters.rangoHasta,
                ordering: `${sort.dir === "desc" ? "-" : ""}${sort.key}`,
            });

            const body = rowsExport.map((row) => [
                toDTLocal(row.fecha_avaluo).replace("T", " "),
                row.agencia || "—",
                row.asesor_ventas || "—",
                row?.cliente?.nombre || "—",
                row?.cliente?.telefono || "—",
                row?.cliente?.correo || "—",
                row.marca_auto || "—",
                row.modelo || "—",
                row?.anio_modelo ?? "—",
                row.serie || "—",
                row?.kilometraje ?? "—",
                row?.precio_guia ?? "—",
                row?.costo_reparacion ?? "—",
                row?.costo_estimado ?? "—",
                row?.oferta_economica ?? "—",
                row.color || "—",
                row.ganador_subasta || "—",
                row.etapa_proceso || "—",
                Array.isArray(row?.evidencias) ? row.evidencias.length : 0,
                String(row.descripcion || ""),
                String(row.comentarios || ""),
            ]);

            autoTable(doc, {
                startY: 17,
                head: [headers],
                body,
                theme: "grid",
                styles: {
                    font: "helvetica",
                    fontSize: 6,
                    cellPadding: 1.2,
                    overflow: "linebreak",
                    valign: "middle",
                    textColor: [55, 65, 81],
                    lineColor: [229, 231, 235],
                    lineWidth: 0.15,
                },
                headStyles: {
                    fillColor: [19, 30, 92],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    halign: "center",
                },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                margin: { left: 8, right: 8, bottom: 10 },
                didDrawPage: () => {
                    const ancho = doc.internal.pageSize.getWidth();
                    const alto = doc.internal.pageSize.getHeight();
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.setTextColor(107, 114, 128);
                    doc.text(`Página ${doc.getNumberOfPages()}`, ancho - 22, alto - 4);
                },
            });

            doc.save(`avaluos_${fileStamp()}.pdf`);
        } catch (error) {
            console.error("Error exportando avalúos a PDF:", error);
            alert("No se pudo generar el PDF. Revisa la consola.");
        } finally {
            setExportando(null);
        }
    };

    const openCreate = () => {
        cleanupDraftResources(draft);
        setTouchedSave(false);
        setMode("create");
        setActiveTab("cliente");

        // Agencia por defecto: primera del usuario si no es admin
        const agenciaDefault = isAdmin ? "" : userAgencias[0] || "";

        setDraft({
            id: null,
            cliente_id: null,
            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",
            cliente_correo: "",
            fecha_avaluo: "",
            asesor_ventas: "",
            // ── Solicitud / Seguimiento estilo Chevrolet (persistidos en BD) ──
            tipo_valuacion: "Valoración",
            vendedor: "",
            agenda_valuacion: "",
            origen_valuacion: "",
            fecha_toma_cuenta: "",
            fecha_finalizacion: "",
            observaciones: "",
            comentario_ticket: "Valuación",
            marca_auto: "",
            modelo: "",
            anio_modelo: "",
            serie: "",
            kilometraje: "",
            precio_guia: "",
            costo_reparacion: "",
            costo_estimado: "",
            oferta_economica: "",
            color: "",
            descripcion: "",
            conceptos: [crearConceptoVacio()],
            ganador_subasta: "",
            etapa_proceso: "",
            tipo_toma: "",
            comentarios: "",
            evidencias_existentes: [],
            evidencias_nuevas: [],
            delete_evidencia_ids: [],
            checklist_cpo: null,
        });

        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;

        try {
            cleanupDraftResources(draft);
            setTouchedSave(false);
            setMode("edit");
            setActiveTab("cliente");
            setLoadingDetail(true);
            setOpenModal(true);

            const item = await apiAvaluos.get(row.id);

            // Verificar que el usuario tenga acceso a la agencia del registro
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(item.agencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDraft({
                id: item.id,
                cliente_id: item?.cliente?.id_cliente ?? null,
                agencia: item.agencia || (isAdmin ? "" : userAgencias[0] || ""),
                cliente_nombre: item?.cliente?.nombre || "",
                cliente_telefono: item?.cliente?.telefono || "",
                cliente_correo: item?.cliente?.correo || "",
                fecha_avaluo: toDTLocal(item.fecha_avaluo),
                asesor_ventas: item.asesor_ventas || "",
                tipo_valuacion: item.tipo_valuacion || "Valoración",
                vendedor: item.vendedor || "",
                agenda_valuacion: toDTLocal(item.agenda_valuacion),
                origen_valuacion: item.origen_valuacion || "",
                fecha_toma_cuenta: toDTLocal(item.fecha_toma_cuenta),
                fecha_finalizacion: toDTLocal(item.fecha_finalizacion),
                observaciones: item.observaciones || "",
                comentario_ticket: item.comentario_ticket || "Valuación",
                marca_auto: item.marca_auto || "",
                modelo: item.modelo || "",
                anio_modelo: item.anio_modelo || "",
                serie: item.serie || "",
                kilometraje: item.kilometraje || "",
                precio_guia: item.precio_guia || "",
                costo_reparacion: item.costo_reparacion || "",
                costo_estimado: item.costo_estimado || "",
                oferta_economica: item.oferta_economica || "",
                color: item.color || "",
                descripcion: item.descripcion || "",
                conceptos: normalizarConceptosAvaluo(item),
                ganador_subasta: item.ganador_subasta || "",
                etapa_proceso: item.etapa_proceso || "",
                tipo_toma: item.tipo_toma || "",
                comentarios: item.comentarios || "",
                evidencias_existentes: normalizarEvidenciasAvaluo(item),
                evidencias_nuevas: [],
                delete_evidencia_ids: [],
                checklist_cpo: item.checklist_cpo || null,
            });
        } catch (error) {
            console.error(error);
            alert("No se pudo abrir el avalúo.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        if (saving) return;
        cleanupDraftResources(draft);
        setOpenModal(false);
        setDraft(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const totalConceptos = useMemo(() => {
        return (draft?.conceptos || []).reduce((acc, item) => {
            return acc + montoANumero(item?.costo);
        }, 0);
    }, [draft?.conceptos]);

    const agregarConcepto = () => {
        setDraft((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                conceptos: [...(prev.conceptos || []), crearConceptoVacio()],
            };
        });
    };

    const actualizarConcepto = (index, campo, valor) => {
        setDraft((prev) => {
            if (!prev) return prev;

            const conceptos = [...(prev.conceptos || [])];
            conceptos[index] = {
                ...conceptos[index],
                [campo]: campo === "costo" ? limpiarTextoMonto(valor) : valor,
            };

            return {
                ...prev,
                conceptos,
            };
        });
    };

    const eliminarConcepto = (index) => {
        setDraft((prev) => {
            if (!prev) return prev;

            const conceptos = (prev.conceptos || []).filter((_, i) => i !== index);

            return {
                ...prev,
                conceptos: conceptos.length ? conceptos : [crearConceptoVacio()],
            };
        });
    };

    const eliminarAvaluo = async (row) => {
        if (!row?.id) return;

        // Verificar permisos por agencia
        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const ok = confirm(
            `¿Eliminar el avalúo de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"
            }?`
        );
        if (!ok) return;

        try {
            await apiAvaluos.remove(row.id);
            setAvaluos((prev) => prev.filter((item) => item.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (error) {
            console.error(error);
            alert("No se pudo eliminar el avalúo.");
        }
    };

    const handleAddFiles = (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;

        const actuales = (draft?.evidencias_nuevas || []).reduce(
            (acc, item) => acc + Number(item?.file?.size || 0),
            0
        );

        const demasiadoGrandes = files.filter(
            (file) => file.size > MAX_ARCHIVO_BYTES
        );

        if (demasiadoGrandes.length) {
            alert(
                `Estos archivos superan 50 MB y no se agregarán: ${demasiadoGrandes.map((file) => file.name).join("")}`
            );
        }

        const permitidos = files.filter((file) => file.size <= MAX_ARCHIVO_BYTES);
        let acumulado = actuales;
        const aceptados = [];

        for (const file of permitidos) {
            if (acumulado + file.size > MAX_TOTAL_EVIDENCIAS_BYTES) {
                alert("El total de evidencias nuevas no puede superar 100 MB por guardado.");
                break;
            }

            aceptados.push(file);
            acumulado += file.size;
        }

        if (!aceptados.length) return;

        const nuevos = aceptados.map((file) => buildLocalEvidenceItem(file));

        setDraft((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                evidencias_nuevas: [...(prev.evidencias_nuevas || []), ...nuevos],
            };
        });
    };

    const removeNuevaEvidencia = (tmpId) => {
        setDraft((prev) => {
            if (!prev) return prev;

            const target = (prev.evidencias_nuevas || []).find(
                (item) => item._tmpId === tmpId
            );
            if (target) revokeEvidencePreview(target);

            return {
                ...prev,
                evidencias_nuevas: (prev.evidencias_nuevas || []).filter(
                    (item) => item._tmpId !== tmpId
                ),
            };
        });
    };

    const removeEvidenciaExistente = (id) => {
        setDraft((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                evidencias_existentes: (prev.evidencias_existentes || []).filter(
                    (item) => item.id !== id
                ),
                delete_evidencia_ids: [
                    ...(prev.delete_evidencia_ids || []),
                    id,
                ].filter((value, index, arr) => arr.indexOf(value) === index),
            };
        });
    };

    const onChecklistChange = useCallback((snapshot) => {
        setDraft((prev) => (prev ? { ...prev, checklist_cpo: snapshot } : prev));
    }, []);

    const imprimirChecklist = async () => {
        if (!draft?.id) {
            alert("Guarda el avalúo antes de imprimir la lista de verificación.");
            return;
        }

        setImprimiendoChecklist(true);

        try {
            const { blob } = await httpDescarga(
                `/usados/api/avaluos/${draft.id}/checklist-pdf/`,
                { method: "GET", responseType: "blob" }
            );

            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error("Error generando PDF del checklist:", error);
            alert("No se pudo generar el PDF de la lista de verificación.");
        } finally {
            setImprimiendoChecklist(false);
        }
    };

    const save = async () => {
        if (!draft || saving) return;

        setTouchedSave(true);

        if (missing.length || !telIsOk) {
            return;
        }

        const conceptosInvalidos = (draft.conceptos || []).some((item) => {
            const descripcion = String(item?.descripcion || "").trim();
            const costo = montoANumero(item?.costo);
            return costo > 0 && !descripcion;
        });

        if (conceptosInvalidos) {
            alert("Todo concepto con costo debe tener una descripción.");
            return;
        }

        setSaving(true);

        try {
            const agenciaFinal = isAdmin
                ? normalizeStr(draft.agencia || "")
                : normalizeStr(draft.agencia || userAgencias[0] || "");

            const payload = {
                agencia: agenciaFinal,
                ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),
                nombre: draft.cliente_nombre || "",
                telefono: normalizeStr(draft.cliente_telefono),
                correo: draft.cliente_correo || "",
                fecha_avaluo: fromDTLocalToISO(draft.fecha_avaluo),
                asesor_ventas: draft.asesor_ventas || "",
                tipo_valuacion: draft.tipo_valuacion || "",
                vendedor: draft.vendedor || "",
                agenda_valuacion: fromDTLocalToISO(draft.agenda_valuacion),
                origen_valuacion: draft.origen_valuacion || "",
                fecha_toma_cuenta: fromDTLocalToISO(draft.fecha_toma_cuenta),
                fecha_finalizacion: fromDTLocalToISO(draft.fecha_finalizacion),
                observaciones: draft.observaciones || "",
                comentario_ticket: draft.comentario_ticket || "",
                marca_auto: draft.marca_auto || "",
                modelo: draft.modelo || "",
                anio_modelo: draft.anio_modelo || "",
                serie: draft.serie || "",
                kilometraje: draft.kilometraje || "",
                precio_guia: draft.precio_guia || "",
                costo_reparacion: montoA2Decimales(totalConceptos),
                conceptos: (draft.conceptos || [])
                    .map((item) => ({
                        descripcion: String(item.descripcion || "").trim(),
                        costo: montoA2Decimales(item.costo),
                    }))
                    .filter((item) => item.descripcion || montoANumero(item.costo) > 0),
                costo_estimado: draft.costo_estimado || "",
                oferta_economica: draft.oferta_economica || "",
                color: draft.color || "",
                descripcion: draft.descripcion || "",
                ganador_subasta: draft.ganador_subasta || "",
                etapa_proceso: draft.etapa_proceso || "",
                tipo_toma: draft.tipo_toma || "",
                comentarios: draft.comentarios || "",
                checklist_cpo_json: JSON.stringify(draft.checklist_cpo || {}),
                delete_evidencia_ids: draft.delete_evidencia_ids || [],
                evidencias_nuevas: (draft.evidencias_nuevas || []).map(
                    (item) => item.file
                ),
            };

            const guardado = mode === "create"
                ? await apiAvaluos.create(payload)
                : await apiAvaluos.update(draft.id, payload);

            // El POST/PUT ya terminó correctamente. Cerramos inmediatamente el modal.
            // La recarga de la tabla queda separada del estado "Guardando...".
            cleanupDraftResources(draft);
            setOpenModal(false);
            setDraft(null);
            setTouchedSave(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            if (mode === "create") {
                setPage(1);
                setTotalRegistros((prev) => prev + 1);

                if (page === 1 && guardado?.id) {
                    setAvaluos((prev) => [guardado, ...prev].slice(0, pageSize));
                }
            } else if (guardado?.id) {
                setAvaluos((prev) =>
                    prev.map((item) => (item.id === guardado.id ? guardado : item))
                );
            }

            // Refrescamos aparte; si este GET tarda, ya no mantiene el botón en Guardando.
            window.setTimeout(() => {
                refreshList(mode === "create" ? 1 : page);
            }, 0);
        } catch (error) {
            console.error("Error guardando avalúo:", error);
            alert(obtenerMensajeError(error));
        } finally {
            setSaving(false);
        }
    };

    const resetFilters = () => {
        setPage(1);
        setFilters({
            q: "",
            agencia: "Todos",
            rangoDesde: "",
            rangoHasta: "",
        });
    };
    //----------

    const setHoy = () => {
        setPage(1);
        const hoy = toYMDLocal(new Date());
        setFilters((prev) => ({
            ...prev,
            rangoDesde: hoy,
            rangoHasta: hoy,
        }));
    };
    const setAyer = () => {
        setPage(1);
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);

        const fecha = toYMDLocal(ayer);

        setFilters((prev) => ({
            ...prev,
            rangoDesde: fecha,
            rangoHasta: fecha,
        }));
    };

    const setSemana = () => {
        setPage(1);
        const hoy = new Date();
        const inicio = new Date(hoy);

        const dia = hoy.getDay();
        const diferencia = dia === 0 ? 6 : dia - 1;

        inicio.setDate(hoy.getDate() - diferencia);

        setFilters((prev) => ({
            ...prev,
            rangoDesde: toYMDLocal(inicio),
            rangoHasta: toYMDLocal(hoy),
        }));
    };

    const setUltimos7Dias = () => {
        setPage(1);
        const hoy = new Date();
        const inicio = new Date(hoy);

        inicio.setDate(hoy.getDate() - 6);

        setFilters((prev) => ({
            ...prev,
            rangoDesde: toYMDLocal(inicio),
            rangoHasta: toYMDLocal(hoy),
        }));
    };

    const setUltimos30Dias = () => {
        setPage(1);
        const hoy = new Date();
        const inicio = new Date(hoy);

        inicio.setDate(hoy.getDate() - 29);

        setFilters((prev) => ({
            ...prev,
            rangoDesde: toYMDLocal(inicio),
            rangoHasta: toYMDLocal(hoy),
        }));
    };

    const setEsteMes = () => {
        setPage(1);
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        setFilters((prev) => ({
            ...prev,
            rangoDesde: toYMDLocal(inicio),
            rangoHasta: toYMDLocal(hoy),
        }));
    };


    useEffect(() => {
        if (viewMode !== "graficas" || openModal) return;

        let cancelado = false;

        const cargarGraficas = async () => {
            setLoadingGraficas(true);
            try {
                const rows = await apiAvaluos.listAll({
                    search: debouncedQ,
                    agencia: filters.agencia,
                    desde: filters.rangoDesde,
                    hasta: filters.rangoHasta,
                    ordering: `${sort.dir === "desc" ? "-" : ""}${sort.key}`,
                });

                if (!cancelado) setGraficasRows(rows);
            } catch (error) {
                console.error("Error cargando datos para gráficas:", error);
                if (!cancelado) setGraficasRows([]);
            } finally {
                if (!cancelado) setLoadingGraficas(false);
            }
        };

        cargarGraficas();

        return () => {
            cancelado = true;
        };
    }, [viewMode, openModal, debouncedQ, filters.agencia, filters.rangoDesde, filters.rangoHasta, sort]);

    const totalEvidenciasDraft =
        (draft?.evidencias_existentes?.length || 0) +
        (draft?.evidencias_nuevas?.length || 0);

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">
                        Avalúos
                    </h2>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}
                            <span className="text-[#131E5C]">{userAgencias.join(", ")}</span>
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                    <button
                        type="button"
                        onClick={exportarExcelAvaluos}
                        disabled={Boolean(exportando) || sorted.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {exportando === "excel" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="h-4 w-4" />
                        )}
                        Exportar Excel
                    </button>

                    <button
                        type="button"
                        onClick={exportarPdfAvaluos}
                        disabled={Boolean(exportando) || sorted.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                    >
                        {exportando === "pdf" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="h-4 w-4" />
                        )}
                        Exportar PDF
                    </button>

                    <div className="inline-flex rounded-lg border border-[#131E5C]/20 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setViewMode("tabla")}
                            className={[
                                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                                viewMode === "tabla"
                                    ? "bg-[#131E5C] text-white"
                                    : "text-[#131E5C] hover:bg-slate-100",
                            ].join(" ")}
                        >
                            <TableProperties className="h-4 w-4" />
                            Tabla
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode("graficas")}
                            className={[
                                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                                viewMode === "graficas"
                                    ? "bg-[#131E5C] text-white"
                                    : "text-[#131E5C] hover:bg-slate-100",
                            ].join(" ")}
                        >
                            <BarChart3 className="h-4 w-4" />
                            Gráficas
                        </button>
                    </div>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Avalúo
                    </button>
                </div>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, q: e.target.value }))
                                    }
                                    placeholder="Buscar por cliente, teléfono, serie, modelo, color, descripción..."
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]"
                                />
                                {filters.q ? (
                                    <button
                                        onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                                        className="rounded-lg bg-white p-1 text-[#131E5C] hover:bg-white/80 hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Dealer">
                            <select
                                value={filters.agencia}
                                onChange={(e) => {
                                    setPage(1);
                                    setFilters((prev) => ({ ...prev, agencia: e.target.value }));
                                }}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {dealers.map((dealer) => (
                                    <option
                                        key={dealer}
                                        value={dealer}
                                        className="bg-neutral-100 text-[#131E5C]"
                                    >
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Acciones">
                            <div className="flex flex-nowrap items-center gap-2">
                                <button
                                    onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>

                                <button
                                    onClick={setAyer}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                                >
                                    Ayer
                                </button>

                                <button
                                    onClick={setSemana}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                                >
                                    Semana
                                </button>

                                <button
                                    onClick={setUltimos7Dias}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-600"
                                >
                                    7 días
                                </button>

                                <button
                                    onClick={setUltimos30Dias}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
                                >
                                    30 días
                                </button>

                                <button
                                    onClick={setEsteMes}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                                >
                                    Este mes
                                </button>

                                <button
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar
                                </button>
                            </div>
                        </FilterBlock>

                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Desde">
                            <input
                                type="date"
                                value={filters.rangoDesde}
                                onChange={(e) => {
                                    setPage(1);
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoDesde: e.target.value,
                                    }));
                                }}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(e) => {
                                    setPage(1);
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoHasta: e.target.value,
                                    }));
                                }}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            {!openModal && viewMode === "graficas" ? (
                loadingGraficas ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm font-bold text-[#131E5C]">
                        Cargando datos para gráficas...
                    </div>
                ) : (
                    <GraficasAvaluos rows={graficasRows} />
                )
            ) : null}

            {!openModal && viewMode === "tabla" ? (
                <>


                    <MobileCardList
                        rows={sorted}
                        loading={loadingList}
                        onEdit={openEdit}
                        onContext={onRowContextMenu}
                    />

                    <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="font-vw-header border border-black bg-[#131E5C] text-xs text-white">
                                    <tr>
                                        <th className="whitespace-nowrap px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("fecha_avaluo")}
                                                className="inline-flex items-center gap-1 text-xs font-bold"
                                            >
                                                Fecha de Avalúo
                                                <span className="opacity-60">
                                                    {sort.key === "fecha_avaluo" ? (
                                                        sort.dir === "asc" ? (
                                                            <ChevronUp className="h-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-4" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Dealer
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Asesor Ventas
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Cliente
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Marca de Auto
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Modelo
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("anio_modelo")}
                                                className="inline-flex items-center gap-1 text-xs font-bold"
                                            >
                                                Año Modelo
                                                <span className="opacity-60">
                                                    {sort.key === "anio_modelo" ? (
                                                        sort.dir === "asc" ? (
                                                            <ChevronUp className="h-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-4" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Serie
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("kilometraje")}
                                                className="inline-flex items-center gap-1 text-xs font-bold"
                                            >
                                                Kilometraje
                                                <span className="opacity-60">
                                                    {sort.key === "kilometraje" ? (
                                                        sort.dir === "asc" ? (
                                                            <ChevronUp className="h-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="h-4" />
                                                    )}
                                                </span>
                                            </button>
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Precio Guía
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Costo Reparación
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Costo Estimado
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Oferta Económica
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Color
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Ganador Subasta
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Etapa del Proceso
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Evidencias
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Descripción
                                        </th>

                                        <th className="whitespace-nowrap px-4 py-3 text-xs font-bold">
                                            Comentarios
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? (
                                        <>
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <SkeletonRow key={i} />
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {sorted.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    onDoubleClick={() => openEdit(row)}
                                                    onContextMenu={(e) => onRowContextMenu(e, row)}
                                                    className="cursor-pointer hover:bg-white/[0.04]"
                                                    title="Doble clic para editar"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.fecha_avaluo
                                                            ? toDTLocal(row.fecha_avaluo).replace("T", " ")
                                                            : "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#131E5C]">
                                                        {row.agencia || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.asesor_ventas || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row?.cliente?.nombre || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.marca_auto || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.modelo || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.anio_modelo || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.serie || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.kilometraje || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.precio_guia || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.costo_reparacion || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.costo_estimado || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.oferta_economica || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.color || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.ganador_subasta || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {row.etapa_proceso || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                        {Array.isArray(row?.evidencias)
                                                            ? row.evidencias.length
                                                            : 0}
                                                    </td>
                                                    <td className="min-w-[240px] px-4 py-3 text-[#131E5C]">
                                                        <span className="line-clamp-2">
                                                            {row.descripcion || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="min-w-[240px] px-4 py-3 text-[#131E5C]">
                                                        <span className="line-clamp-2">
                                                            {row.comentarios || "—"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}

                                            {sorted.length === 0 ? (
                                                <tr>
                                                    <td colSpan={18} className="px-4 py-10 text-center text-[#131E5C]">
                                                        No hay resultados con esos filtros.
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </>
                                    )}
                                </tbody>
                            </table>

                            <ContextMenu
                                ctxMenu={ctxMenu}
                                onDelete={async (row) => {
                                    await eliminarAvaluo(row);
                                    setCtxMenu({ open: false, x: 0, y: 0, row: null });
                                }}
                                onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                            />
                        </div>
                    </div>

                    <PaginationControls
                        page={page}
                        pageSize={pageSize}
                        total={totalRegistros}
                        onPageChange={(newPage) => setPage(newPage)}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        }}
                    />

                </>
            ) : null}

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo avalúo" : `Editar avalúo • ${draft?.id}`}
                subtitle="Gestión de avalúo Volkswagen"
                onClose={closeModal}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            onClick={() => {
                                setTouchedSave(true);
                                if (missing.length || !telIsOk) {
                                    if (missing.includes("cliente_telefono") || telInvalid) setActiveTab("cliente");
                                    else if (missing.includes("fecha_avaluo")) setActiveTab("cliente");
                                }
                                save();
                            }}
                            disabled={
                                saving ||
                                loadingDetail ||
                                telInvalid ||
                                (draft?.cliente_telefono ? !telIsOk : false)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !draft ? null : (
                    <div>
                        {/* ── Tabs por sección ── */}
                        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                            {TABS_AVALUO.map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={[
                                            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                                            isActive
                                                ? "bg-[#131E5C] text-white shadow"
                                                : "bg-white text-slate-500 hover:bg-slate-50 hover:text-[#131E5C] border border-transparent",
                                        ].join(" ")}
                                    >
                                        <TabIcon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ═══ SECCIÓN: CLIENTE ═══ */}
                        {activeTab === "cliente" ? (
                            <div>
                                <SectionBanner icon={User} title="Datos del cliente y solicitud" />
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field label="Distribuidor" icon={Building2}>
                                        <select
                                            value={draft.agencia || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({ ...prev, agencia: e.target.value }))
                                            }
                                            disabled={!isAdmin && userAgencias.length <= 1}
                                            className={[
                                                inputBase,
                                                inputOk,
                                                !isAdmin && userAgencias.length <= 1
                                                    ? "cursor-not-allowed opacity-75"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            <option value="" disabled>
                                                Selecciona un dealer...
                                            </option>
                                            {(isAdmin ? DEALERS : userAgencias).map((dealer) => (
                                                <option key={dealer} value={dealer}>
                                                    {dealer}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Fecha de avalúo" icon={CalendarDays}>
                                        <input
                                            type="datetime-local"
                                            value={draft.fecha_avaluo}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    fecha_avaluo: e.target.value,
                                                }))
                                            }
                                            className={[
                                                inputBase,
                                                isInvalid("fecha_avaluo") ? inputBad : inputOk,
                                            ].join(" ")}
                                        />
                                        {isInvalid("fecha_avaluo") ? (
                                            <div className="mt-2 text-xs font-bold text-red-600">
                                                Fecha de avalúo es requerida.
                                            </div>
                                        ) : null}
                                    </Field>

                                    <Field label="Tipo de valuación" icon={ClipboardCheck}>
                                        <select
                                            value={draft.tipo_valuacion || "Valoración"}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    tipo_valuacion: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="Valoración">Valoración</option>
                                            <option value="Avalúo formal">Avalúo formal</option>
                                            <option value="Revaluación">Revaluación</option>
                                        </select>
                                    </Field>

                                    <Field label="Nombre del cliente" icon={User}>
                                        <input
                                            value={draft.cliente_nombre}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    cliente_nombre: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Nombre completo"
                                        />
                                    </Field>

                                    <Field label="Teléfono" icon={Phone}>
                                        <input
                                            maxLength={12}
                                            value={draft.cliente_telefono}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    cliente_telefono: e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 12),
                                                }))
                                            }
                                            disabled={mode === "edit" || telIsNormalized}
                                            className={[
                                                inputBase,
                                                isInvalid("cliente_telefono") || telInvalid
                                                    ? inputBad
                                                    : inputOk,
                                                mode === "edit" || telIsNormalized
                                                    ? "cursor-not-allowed opacity-75"
                                                    : "",
                                            ].join(" ")}
                                        />
                                        {isInvalid("cliente_telefono") ? (
                                            <div className="mt-2 text-xs font-bold text-red-600">
                                                Teléfono es requerido.
                                            </div>
                                        ) : null}
                                        {!isInvalid("cliente_telefono") && telError ? (
                                            <div className="mt-2 text-xs font-bold text-red-600">
                                                {telError}
                                            </div>
                                        ) : null}
                                    </Field>

                                    <Field label="Correo" icon={Mail}>
                                        <input
                                            type="email"
                                            value={draft.cliente_correo}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    cliente_correo: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="correo@dominio.com"
                                        />
                                    </Field>

                                    <Field label="Asesor de ventas" icon={UserStar}>
                                        <select
                                            value={draft.asesor_ventas || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    asesor_ventas: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="">Selecciona un asesor...</option>
                                            {ASESORES.map((asesor) => (
                                                <option key={asesor} value={asesor}>
                                                    {asesor}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Vendedor" icon={User}>
                                        <input
                                            value={draft.vendedor || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    vendedor: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Vendedor responsable"
                                        />
                                    </Field>

                                    <Field label="Agenda de valuación" icon={CalendarClock}>
                                        <input
                                            type="datetime-local"
                                            value={draft.agenda_valuacion || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    agenda_valuacion: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        />
                                    </Field>
                                </div>
                            </div>
                        ) : null}

                        {/* ═══ SECCIÓN: VEHÍCULO ═══ */}
                        {activeTab === "vehiculo" ? (
                            <div>
                                <SectionBanner icon={CarFront} title="Datos del vehículo" />
                                <div className="grid gap-3 md:grid-cols-3">

                                    <Field label="Marca de auto" icon={CarFront}>
                                        <select
                                            value={draft.marca_auto}
                                            onChange={(e) =>
                                                setDraft((prev) => ({ ...prev, marca_auto: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="">Selecciona una marca...</option>
                                            {MARCA.map((marca) => (
                                                <option key={marca} value={marca}>
                                                    {marca}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Modelo" icon={CarFront}>
                                        <input
                                            value={draft.modelo}
                                            onChange={(e) =>
                                                setDraft((prev) => ({ ...prev, modelo: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. Jetta"
                                        />
                                    </Field>
                                    <Field label="Año modelo" icon={CalendarDays}>
                                        <input
                                            value={draft.anio_modelo}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    anio_modelo: e.target.value
                                                        .replace(/[^\d]/g, "")
                                                        .slice(0, 4),
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. 2022"
                                        />
                                    </Field>
                                    <Field label="Kilometraje" icon={Gauge}>
                                        <input
                                            value={draft.kilometraje}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    kilometraje: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. 45000"
                                        />
                                    </Field>
                                    <Field label="Serie" icon={Hash}>
                                        <input
                                            value={draft.serie}
                                            onChange={(e) =>
                                                setDraft((prev) => ({ ...prev, serie: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Número de serie"
                                        />
                                    </Field>

                                    <Field label="Color" icon={Palette}>
                                        <input
                                            value={draft.color}
                                            onChange={(e) =>
                                                setDraft((prev) => ({ ...prev, color: e.target.value }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. Blanco perlado"
                                        />
                                    </Field>

                                    <Field label="Tipo de toma" icon={ClipboardList}>
                                        <select
                                            value={draft.tipo_toma || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    tipo_toma: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="">Selecciona un tipo...</option>
                                            {TIPO_TOMA.map((tipo) => (
                                                <option key={tipo} value={tipo}>
                                                    {tipo}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                        ) : null}

                        {/* ═══ SECCIÓN: VALORES ═══ */}
                        {activeTab === "valores" ? (
                            <div>
                                <SectionBanner icon={BadgeDollarSign} title="Valores y oferta" />
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field label="Precio Estimado Cliente" icon={BadgeDollarSign}>
                                        <input
                                            value={draft.precio_guia}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    precio_guia: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. $230,000"
                                        />
                                    </Field>

                                    <Field label="Costo reparación" icon={BadgeDollarSign}>
                                        <input
                                            value={formatoMoneda(totalConceptos)}
                                            readOnly
                                            className={[inputBase, inputOk, "bg-slate-100 cursor-not-allowed"].join(" ")}
                                            placeholder="Se calcula automáticamente"
                                        />
                                        <div className="mt-2 text-xs font-semibold text-slate-500">
                                            Este monto se calcula automáticamente con la suma de los conceptos de valuación.
                                        </div>
                                    </Field>

                                    <Field label="Costo estimado" icon={BadgeDollarSign}>
                                        <input
                                            value={draft.costo_estimado}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    costo_estimado: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. $35,000"
                                        />
                                    </Field>

                                    <Field label="Oferta económica" icon={BadgeDollarSign}>
                                        <input
                                            value={draft.oferta_economica}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    oferta_economica: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Ej. $240,000"
                                        />
                                    </Field>

                                </div>

                                <div className="mb-4 mt-6 flex items-center gap-2 rounded-xl border border-[#131E5C]/20 bg-[#131E5C]/5 px-4 py-3">
                                    <span className="text-sm font-extrabold text-[#131E5C]">Seguimiento</span>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field label="Origen de valuación" icon={ClipboardList}>
                                        <select
                                            value={draft.origen_valuacion || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    origen_valuacion: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="">Selecciona un origen...</option>
                                            {ORIGENES_VALUACION.map((origen) => (
                                                <option key={origen} value={origen}>
                                                    {origen}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mt-1 text-[11px] font-semibold text-slate-400">
                                            Como en prospectos: campaña, facebook, etc.
                                        </div>
                                    </Field>

                                    <Field label="Fecha toma cuenta" icon={CalendarClock}>
                                        <input
                                            type="datetime-local"
                                            value={draft.fecha_toma_cuenta || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    fecha_toma_cuenta: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        />
                                    </Field>

                                    <Field label="Fecha finalización" icon={CalendarDays}>
                                        <input
                                            type="datetime-local"
                                            value={draft.fecha_finalizacion || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    fecha_finalizacion: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        />
                                    </Field>

                                    <Field label="Etapa del proceso" icon={ClipboardList}>
                                        <select
                                            value={draft.etapa_proceso || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    etapa_proceso: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                        >
                                            <option value="">Selecciona una etapa...</option>
                                            {ETAPAS_PROCESO.map((etapa) => (
                                                <option key={etapa} value={etapa}>
                                                    {etapa}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Ganador de subasta" icon={Trophy}>
                                        <input
                                            value={draft.ganador_subasta}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    ganador_subasta: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk].join(" ")}
                                            placeholder="Nombre del ganador"
                                        />
                                    </Field>

                                    <Field label="Observaciones" icon={MessageSquareText} className="md:col-span-2">
                                        <textarea
                                            value={draft.observaciones || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    observaciones: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk, "min-h-[80px]"].join(" ")}
                                            placeholder="Observaciones adicionales de la valoración"
                                        />
                                    </Field>

                                    <Field label="Comentarios para ticket" icon={FileText}>
                                        <textarea
                                            value={draft.comentario_ticket || ""}
                                            onChange={(e) =>
                                                setDraft((prev) => ({
                                                    ...prev,
                                                    comentario_ticket: e.target.value,
                                                }))
                                            }
                                            className={[inputBase, inputOk, "min-h-[80px]"].join(" ")}
                                            placeholder="Valuación"
                                        />
                                        <div className="mt-1 text-[11px] font-semibold text-slate-400">
                                            Este comentario solo aparece en el ticket.
                                        </div>
                                    </Field>

                                </div>
                            </div>
                        ) : null}

                        {/* ═══ SECCIÓN: TÉCNICA (incluye Valuación + descripción VW existente pero sin input) ═══ */}
                        {activeTab === "tecnica" ? (
                            <div>
                                <SectionBanner icon={Wrench} title="Información técnica y valuación" />
                                <div className="grid gap-3">
                                    <Field label="Valuación — conceptos de reparación" icon={ClipboardList}>
                                        <div className="space-y-4">
                                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead className="bg-[#131E5C] text-white">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left font-bold">Descripción</th>
                                                                <th className="px-4 py-3 text-left font-bold">Costo</th>
                                                                <th className="px-4 py-3 text-center font-bold">Acción</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody className="divide-y divide-slate-200">
                                                            {(draft.conceptos || []).map((concepto, index) => (
                                                                <tr key={`concepto-${concepto.id || index}`}>
                                                                    <td className="px-4 py-3 align-top">
                                                                        <textarea
                                                                            value={concepto.descripcion}
                                                                            onChange={(e) =>
                                                                                actualizarConcepto(index, "descripcion", e.target.value)
                                                                            }
                                                                            rows={3}
                                                                            className={[
                                                                                inputBase,
                                                                                inputOk,
                                                                                "min-h-[84px] resize-y leading-5",
                                                                            ].join(" ")}
                                                                            placeholder="Ej. Hojalatería de fascia delantera"
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 align-top min-w-[180px]">
                                                                        <input
                                                                            value={concepto.costo}
                                                                            onChange={(e) =>
                                                                                actualizarConcepto(index, "costo", e.target.value)
                                                                            }
                                                                            className={[inputBase, inputOk].join(" ")}
                                                                            placeholder="0.00"
                                                                            inputMode="decimal"
                                                                        />
                                                                    </td>

                                                                    <td className="px-4 py-3 align-top text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => eliminarConcepto(index)}
                                                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                                            title="Eliminar concepto"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>

                                                        <tfoot className="border-t border-slate-200 bg-slate-50">
                                                            <tr>
                                                                <td className="px-4 py-3 text-right font-extrabold text-[#131E5C]">
                                                                    Total reparación
                                                                </td>
                                                                <td className="px-4 py-3 font-extrabold text-[#131E5C]">
                                                                    {formatoMoneda(totalConceptos)}
                                                                </td>
                                                                <td className="px-4 py-3" />
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={agregarConcepto}
                                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#131E5C]/90 px-4 py-3 font-bold text-white hover:bg-[#131E5C]"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar concepto
                                            </button>
                                        </div>
                                    </Field>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Field label="Descripción del avalúo" icon={FileText}>
                                            <textarea
                                                value={draft.descripcion || ""}
                                                onChange={(e) =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        descripcion: e.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk, "min-h-[90px]"].join(" ")}
                                                placeholder="Descripción general del vehículo / avalúo..."
                                            />
                                        </Field>

                                        <Field label="Comentarios" icon={MessageSquareText}>
                                            <textarea
                                                value={draft.comentarios}
                                                onChange={(e) =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        comentarios: e.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk, "min-h-[90px]"].join(" ")}
                                                placeholder="Notas internas..."
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* ═══ SECCIÓN: EVIDENCIAS ═══ */}
                        {activeTab === "evidencias" ? (
                            <div>
                                <SectionBanner icon={Camera} title="Evidencias fotográficas y archivos" />
                                <Field label="Evidencias" icon={Paperclip}>
                                    <div className="space-y-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
                                            className="hidden"
                                            onChange={(e) => {
                                                handleAddFiles(e.target.files);
                                                e.target.value = "";
                                            }}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-4 py-6 text-center text-[#131E5C] transition hover:bg-[#131E5C]/10 sm:flex-row sm:text-left"
                                        >
                                            <UploadCloud className="h-6 w-6" />
                                            <div className="min-w-0">
                                                <div className="text-sm font-extrabold">
                                                    Agregar fotos, videos o archivos
                                                </div>
                                                <div className="text-xs font-semibold text-slate-500">
                                                    Máximo 50 MB por archivo y 100 MB en total por cada guardado.
                                                </div>
                                            </div>
                                        </button>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                                Total: {totalEvidenciasDraft}
                                            </span>

                                            {(draft.delete_evidencia_ids || []).length > 0 ? (
                                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                                    Por eliminar: {draft.delete_evidencia_ids.length}
                                                </span>
                                            ) : null}

                                            {(draft.evidencias_nuevas || []).length > 0 ? (
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                                    Nuevas: {draft.evidencias_nuevas.length}
                                                </span>
                                            ) : null}
                                        </div>

                                        {(draft.evidencias_existentes?.length || 0) > 0 ? (
                                            <div>
                                                <div className="mb-2 text-sm font-extrabold text-[#131E5C]">
                                                    Evidencias guardadas
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                                    {draft.evidencias_existentes.map((item) => (
                                                        <EvidenceCard
                                                            key={`existente-${item.id}`}
                                                            item={item}
                                                            onRemove={() => removeEvidenciaExistente(item.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        {(draft.evidencias_nuevas?.length || 0) > 0 ? (
                                            <div>
                                                <div className="mb-2 text-sm font-extrabold text-[#131E5C]">
                                                    Evidencias nuevas
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                                    {draft.evidencias_nuevas.map((item) => (
                                                        <EvidenceCard
                                                            key={item._tmpId}
                                                            item={item}
                                                            onRemove={() => removeNuevaEvidencia(item._tmpId)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        {totalEvidenciasDraft === 0 ? (
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                                                Aún no has agregado evidencias a este avalúo.
                                            </div>
                                        ) : null}
                                    </div>
                                </Field>
                            </div>
                        ) : null}

                        {/* ═══ SECCIÓN: LISTA DE VERIFICACIÓN (checklist CPO 114, persistido en BD) ═══ */}
                        {activeTab === "lista" ? (
                            <div>
                                <SectionBanner icon={ListChecks} title="Lista de verificación" />
                                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#131E5C]/15 bg-[#131E5C]/5 px-4 py-3">
                                    <span className="text-xs font-bold text-[#131E5C]">
                                        Checklist CPO de 114 puntos. Se guarda al guardar el avalúo y se
                                        imprime en PDF con los datos capturados.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={imprimirChecklist}
                                        disabled={imprimiendoChecklist || saving}
                                        className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#131E5C]/90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {imprimiendoChecklist ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Printer className="h-4 w-4" />
                                        )}
                                        {imprimiendoChecklist ? "Generando PDF..." : "Imprimir PDF"}
                                    </button>
                                    {!draft?.id ? (
                                        <span className="w-full text-[11px] font-semibold text-slate-500">
                                            Guarda el avalúo para habilitar la impresión del PDF.
                                        </span>
                                    ) : null}
                                </div>
                                <ChecklistVerificacion
                                    key={draft?.id || "nuevo"}
                                    value={draft?.checklist_cpo || null}
                                    onChange={onChecklistChange}
                                    info={{
                                        folio: draft?.id ? `UC-${String(draft.id).padStart(4, "0")}` : "Nuevo",
                                        vin: draft?.serie || "",
                                        modelo: [draft?.marca_auto, draft?.modelo, draft?.anio_modelo].filter(Boolean).join(" ") || "",
                                        km: draft?.kilometraje || "",
                                        cliente: draft?.cliente_nombre || "",
                                    }}
                                />
                            </div>
                        ) : null}

                    </div>
                )}
            </Modal>
        </div>
    );
}