import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Eye,
    FileText,
    Filter,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    RefreshCcw,
    Search,
    ShieldCheck,
    User,
    UserRound,
    Video,
    Wrench,
    X,
} from "lucide-react";
import { apiSafety } from "../../lib/apiSafety";

const BRAND_BLUE = "#131E5C";
const API_BASE =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

function cls(...values) {
    return values.filter(Boolean).join(" ");
}

function normalizeStr(value) {
    return String(value ?? "").trim();
}

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
    for (const part of parts) {
        if (part.type !== "literal") {
            map[part.type] = part.value;
        }
    }

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

function esFechaSolo(valor) {
    return /^\d{4}-\d{2}-\d{2}$/.test(normalizeStr(valor));
}

function formatFechaReporte(item) {
    const fechaReporte = normalizeStr(item?.fecha_reporte);

    // Si ya viene como 2026-04-07, la devolvemos tal cual
    if (esFechaSolo(fechaReporte)) {
        return fechaReporte;
    }

    // Si por alguna razón viene fecha_reporte con hora, se formatea
    if (fechaReporte) {
        return formatFechaSolo(fechaReporte);
    }

    // Fallback al campo creado
    return formatFechaSolo(item?.creado);
}
function getFechaReporteYMD(item) {
    const fechaReporte = normalizeStr(item?.fecha_reporte);

    // fecha pura: no convertir con Date
    if (esFechaSolo(fechaReporte)) {
        return fechaReporte;
    }

    // fecha con hora
    if (fechaReporte) {
        return toYMDMexico(fechaReporte);
    }

    // fallback
    return toYMDMexico(item?.creado);
}

function getFechaReporteInt(item) {
    return ymdToInt(getFechaReporteYMD(item)) ?? 0;
}

function getFechaBaseReporte(item) {
    return item?.fecha_reporte || item?.creado || "";
}

function obtenerChecklist(item) {
    return Array.isArray(item?.checklist) ? item.checklist : [];
}

function obtenerAdjuntos(item) {
    return Array.isArray(item?.adjuntos) ? item.adjuntos : [];
}

function obtenerResumenReporte(reporte) {
    const checklist = obtenerChecklist(reporte);
    const adjuntos = obtenerAdjuntos(reporte);

    const totalPuntos = checklist.length;
    const puntosSi = checklist.filter((item) => item?.estado === "si").length;
    const puntosNo = checklist.filter((item) => item?.estado === "no").length;
    const puntosNa = checklist.filter((item) => item?.estado === "na").length;
    const pendientes = checklist.filter((item) => !normalizeStr(item?.estado)).length;
    const evidencias = adjuntos.length;

    return {
        totalPuntos,
        puntosSi,
        puntosNo,
        puntosNa,
        pendientes,
        evidencias,
        tieneHallazgos: puntosNo > 0,
    };
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

function EstadoBadge({ estado }) {
    const valor = normalizeStr(estado).toLowerCase();

    const estilos = {
        si: "border-emerald-200 bg-emerald-50 text-emerald-700",
        no: "border-red-200 bg-red-50 text-red-700",
        na: "border-amber-200 bg-amber-50 text-amber-700",
        default: "border-slate-200 bg-slate-50 text-slate-600",
    };

    const label = {
        si: "Sí",
        no: "No",
        na: "No aplica",
    }[valor] || "Sin estado";

    return (
        <span
            className={cls(
                "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-extrabold",
                estilos[valor] || estilos.default
            )}
        >
            {label}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, tone = "normal" }) {
    const toneClass =
        tone === "alert"
            ? "border-red-200 bg-red-50"
            : tone === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white";

    return (
        <div className={cls("rounded-3xl border p-4 shadow-sm", toneClass)}>
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#131E5C] text-white">
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                        {label}
                    </div>
                    <div className="mt-1 text-2xl font-black text-[#131E5C]">{value}</div>
                </div>
            </div>
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                {label}
            </div>
            {children}
        </div>
    );
}

function Modal({ open, title, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white sm:text-lg">
                                {title}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                            type="button"
                        >
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
    return obtenerAdjuntos(reporte).filter(
        (adjunto) => !normalizeStr(adjunto?.punto_checklist_id)
    );
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
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                        src={url}
                        alt={nombre}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                        <ImageIcon className="h-4 w-4" />
                        Imagen
                    </div>
                    <div className="mt-2 break-words text-sm font-bold text-[#131E5C]">
                        {nombre}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                        {formatearTamano(adjunto?.tamano_bytes)}
                    </div>
                </div>
            </a>
        );
    }

    if (esVideo(adjunto)) {
        return (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[4/3] bg-black">
                    <video
                        src={url}
                        controls
                        className="h-full w-full"
                        preload="metadata"
                    />
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                        <Video className="h-4 w-4" />
                        Video
                    </div>
                    <div className="mt-2 break-words text-sm font-bold text-[#131E5C]">
                        {nombre}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                        {formatearTamano(adjunto?.tamano_bytes)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#131E5C]/10 text-[#131E5C]">
                <Paperclip className="h-6 w-6" />
            </div>

            <div className="mt-4 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                {tipo}
            </div>

            <div className="mt-2 break-words text-sm font-bold text-[#131E5C]">
                {nombre}
            </div>

            <div className="mt-2 text-xs font-semibold text-slate-500">
                {formatearTamano(adjunto?.tamano_bytes)}
            </div>

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
            {adjuntos.map((adjunto) => (
                <AdjuntoCard key={adjunto.id_adjunto} adjunto={adjunto} />
            ))}
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
                deleting ? "opacity-60 pointer-events-none" : "cursor-pointer"
            )}
            title="Doble clic para ver detalle · Clic derecho para eliminar"
        >
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#131E5C,#1d2d83)] p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">
                            Orden de servicio
                        </div>
                        <div className="mt-1 truncate text-2xl font-black">
                            {reporte.orden_servicio || "—"}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-white/85">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        {reporte.agencia || "Sin agencia"}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                        Fecha: {formatFechaReporte(reporte)}
                    </span>
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
                        <span className="truncate">
                            Validó: {reporte.valido_control_calidad || "—"}
                        </span>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                    <MiniMetric label="Sí" value={resumen.puntosSi} tone="success" />
                    <MiniMetric label="No" value={resumen.puntosNo} tone="danger" />
                    <MiniMetric label="N/A" value={resumen.puntosNa} tone="warning" />
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
                        <Eye className="h-4 w-4" />
                        Ver detalle
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
        <div
            className={cls(
                "rounded-lg border p-4 shadow-sm",
                punto?.estado === "no"
                    ? "border-red-200 bg-red-50/60"
                    : "border-slate-200 bg-white",
            )}
        >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <h4 className="mt-1 text-base font-black text-[#131E5C]">
                        {punto?.titulo || "Sin título"}
                    </h4>

                    {normalizeStr(punto?.descripcion) ? (
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                            {punto.descripcion}
                        </p>
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
                <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                    Observaciones
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    {tieneObservaciones ? punto.observaciones : "Sin observaciones."}
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
                    <Paperclip className="h-4 w-4" />
                    Evidencias del punto
                </div>

                <EvidenciasGrid
                    adjuntos={Array.isArray(adjuntos) ? adjuntos : []}
                    emptyText="Este punto no tiene evidencias."
                />
            </div>
        </div>
    );
}

export default function Safety() {
    const [reportes, setReportes] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [errorList, setErrorList] = useState("");

    const [selected, setSelected] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todas",
        estadoGeneral: "todos",
        rangoDesde: "",
        rangoHasta: "",
        sort: "fecha_desc",
    });

    async function refreshList() {
        setLoadingList(true);
        setErrorList("");

        try {
            const data = await apiSafety.list();
            setReportes(Array.isArray(data) ? data : []);
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

            if (selected?.id_reporte === id) {
                closeModal();
            }
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
        const values = new Set(
            (reportes || [])
                .map((item) => normalizeStr(item.agencia))
                .filter(Boolean)
        );

        return ["Todas", ...Array.from(values)];
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
                checklist.some(
                    (punto) =>
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

                case "fecha_desc":
                default:
                    return getFechaReporteInt(b) - getFechaReporteInt(a);

                case "hallazgos_desc":
                    return resumenB.puntosNo - resumenA.puntosNo;

                case "evidencias_desc":
                    return resumenB.evidencias - resumenA.evidencias;

                case "cliente_asc":
                    return normalizeStr(a.nombre_cliente).localeCompare(
                        normalizeStr(b.nombre_cliente),
                        "es"
                    );
            }
        });
    }, [reportesFiltrados, filters.sort]);

    const metricas = useMemo(() => {
        const hoy = toYMDMexico(new Date());

        const total = reportes.length;
        const conHallazgos = reportes.filter((item) => obtenerResumenReporte(item).tieneHallazgos).length;
        const evidencias = reportes.reduce(
            (acc, item) => acc + obtenerResumenReporte(item).evidencias,
            0
        );
        const hoyCount = reportes.filter(
            (item) => getFechaReporteYMD(item) === hoy
        ).length;

        return {
            total,
            conHallazgos,
            evidencias,
            hoy: hoyCount,
        };
    }, [reportes]);

    const selectedResumen = useMemo(
        () => obtenerResumenReporte(selected || {}),
        [selected]
    );

    function resetFilters() {
        setFilters({
            q: "",
            agencia: "Todas",
            estadoGeneral: "todos",
            rangoDesde: "",
            rangoHasta: "",
            sort: "fecha_desc",
        });
    }

    function getHoyMexicoYMD() {
        return toYMDMexico(new Date());
    }

    function setHoy() {
        const hoy = getHoyMexicoYMD();
        setFilters((prev) => ({
            ...prev,
            rangoDesde: hoy,
            rangoHasta: hoy,
        }));
    }

    return (
        <div className="w-full">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-[#131E5C]">
                        Registro de reportes de control de calidad
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Visualiza reportes con evidencias registradas.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={refreshList}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#131E5C] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0f1748]"
                >
                    {loadingList ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCcw className="h-4 w-4" />
                    )}
                    Recargar
                </button>
            </div>

            <div className="mb-6 p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                    <div className="xl:col-span-4">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, q: e.target.value }))
                                    }
                                    placeholder="Buscar por OS, cliente, reportante, técnico..."
                                    className="w-full text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                />
                                {filters.q ? (
                                    <button
                                        type="button"
                                        onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                                        className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-2">
                        <FilterBlock label="Agencia">
                            <select
                                value={filters.agencia}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, agencia: e.target.value }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#131E5C] outline-none"
                            >
                                {agencias.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-2">
                        <FilterBlock label="Estado general">
                            <select
                                value={filters.estadoGeneral}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        estadoGeneral: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#131E5C] outline-none"
                            >
                                <option value="todos">Todos</option>
                                <option value="con_hallazgos">Con hallazgos</option>
                                <option value="sin_hallazgos">Sin hallazgos</option>
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-2">
                        <FilterBlock label="Ordenar por">
                            <select
                                value={filters.sort}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, sort: e.target.value }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#131E5C] outline-none"
                            >
                                <option value="fecha_desc">Fecha más reciente</option>
                                <option value="fecha_asc">Fecha más antigua</option>
                                <option value="hallazgos_desc">Más hallazgos</option>
                                <option value="evidencias_desc">Más evidencias</option>
                                <option value="cliente_asc">Cliente A-Z</option>
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-1">
                        <FilterBlock label="Desde">
                            <input
                                type="date"
                                value={filters.rangoDesde}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoDesde: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-1">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoHasta: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={setHoy}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700"
                    >
                        <CalendarDays className="h-4 w-4" />
                        Hoy
                    </button>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 py-3 text-sm font-extrabold text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white"
                    >
                        <X className="h-4 w-4" />
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {errorList ? (
                <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {errorList}
                </div>
            ) : null}

            {loadingList ? (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>
            ) : reportesOrdenados.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#131E5C]/10 text-[#131E5C]">
                        <ClipboardList className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-[#131E5C]">
                        No hay reportes con esos filtros
                    </h3>
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
                            <div
                                key={index}
                                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
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
                                    {selected.fecha_reporte || "—"}
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
                        </section>

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <MiniMetric label="Puntos" value={selectedResumen.totalPuntos} />
                            <MiniMetric label="Sí" value={selectedResumen.puntosSi} tone="success" />
                            <MiniMetric label="No" value={selectedResumen.puntosNo} tone="danger" />
                            <MiniMetric label="N/A" value={selectedResumen.puntosNa} tone="warning" />
                            <MiniMetric label="Evidencias" value={selectedResumen.evidencias} />
                        </section>

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