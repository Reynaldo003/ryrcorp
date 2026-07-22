// src/pages/Citas/RegistroCitas.jsx
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
    ChevronLeft,
    ChevronRight,
    Trash2,
    Loader2,
    Phone,
    LayoutList,
    UserCheck,
    UserSearch,
    UserMinus,
    UserStar,
    MessageSquareText,
    Building2,
    CalendarClock,
    Table2,
    BarChart3,
    Calendar,
    CalendarCheck,
    Clock,
    CheckCircle2,
    XCircle,
    PieChart,
    MoreVertical,
} from "lucide-react";
import { apiCitas } from "../../lib/apiCitas";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

const BRAND_BLUE = "#131E5C";


function normalizeStr(v) { return String(v ?? "").trim(); }

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
            <td className="px-4 py-3"><div className="h-4 w-64 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-slate-200/60" /></td>
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
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
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
        </div>
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


function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}


function MobileCardList({ rows, loading, onEdit, onContext, onToggleAsistencia, updatingInline }) {
    return (
        <div className="lg:hidden">
            <div className="overflow-hidden rounded-lg bg-white/[0.03] shadow-lg">
                {loading ? (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                                <Skeleton className="h-4 w-40" /><Skeleton className="mt-3 h-4 w-28" />
                                <Skeleton className="mt-3 h-4 w-56" /><Skeleton className="mt-4 h-8 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                            const isUpdating = !!updatingInline[row.id];
                            const nombreCliente = row?.cliente?.nombre || "—";
                            const telCliente = row?.cliente?.telefono || "—";
                            const fecha = row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—";
                            return (
                                <div key={row.id} onClick={() => onEdit(row)} onContextMenu={(e) => onContext(e, row)}
                                    className="cursor-pointer rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md"
                                    title="Toca para editar"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                                                <CalendarDays className="h-4 w-4" /><span className="truncate">{fecha}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Building2 className="h-4 w-4" /><span className="truncate">{row.agencia || "—"}</span>
                                            </div>
                                        </div>
                                        <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); onToggleAsistencia(row); }}
                                            className={["shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                                                row.asistencia ? "bg-emerald-200 text-emerald-800 border-emerald-300" : "bg-red-200 text-red-800 border-red-300",
                                                isUpdating ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"].join(" ")}
                                        >
                                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                            {row.asistencia ? "Sí" : "No"}
                                        </button>
                                    </div>
                                    <div className="mt-3 grid gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                                            <User className="h-4 w-4" /><span className="truncate">{nombreCliente}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Phone className="h-4 w-4 text-[#131E5C]" /><span className="truncate">{telCliente}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CarFront className="h-4 w-4 text-[#131E5C]" /><span className="truncate">{row.auto_interes || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <LayoutList className="h-4 w-4 text-[#131E5C]" /><span className="truncate">{row.tipo_cita || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <UserMinus className="h-4 w-4 text-[#131E5C]" /><span className="truncate">{row.asesor_digital || "—"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <UserStar className="h-4 w-4 text-[#131E5C]" /><span className="truncate">{row.asesor_piso || "—"}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600">
                                            <div className="flex items-start gap-2">
                                                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" />
                                                <span className="line-clamp-2">{row.comentarios || "—"}</span>
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


const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);
const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const FULL_DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const TIPO_COLORS = {
    "Prueba de Manejo": { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900", dot: "bg-orange-500" },
    "Tradicional": { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-900", dot: "bg-blue-500" },
    "Digital": { bg: "bg-green-100", border: "border-green-400", text: "text-green-900", dot: "bg-green-500" },
    default: { bg: "bg-slate-100", border: "border-slate-400", text: "text-slate-800", dot: "bg-slate-400" },
};

function getColor(tipo) {
    return TIPO_COLORS[tipo] || TIPO_COLORS.default;
}

function getWeekDates(referenceDate) {
    const d = new Date(referenceDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
        const nd = new Date(monday);
        nd.setDate(monday.getDate() + i);
        return nd;
    });
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function formatFullDateEs(d) {
    return `${FULL_DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// Deriva el estatus real de una cita: si aún no llega la fecha, está "Pendiente";
// si ya pasó, se basa en el campo asistencia.
function getEstatusCita(cita) {
    if (!cita.fecha_hora_cita) return "pendiente";
    const dt = new Date(cita.fecha_hora_cita);
    if (Number.isNaN(dt.getTime())) return "pendiente";
    if (dt.getTime() > Date.now()) return "pendiente";
    return cita.asistencia ? "asistio" : "no_asistio";
}

const ESTATUS_UI = {
    pendiente: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-800" },
    asistio: { label: "Asistió", bg: "bg-emerald-100", text: "text-emerald-800" },
    no_asistio: { label: "No asistió", bg: "bg-red-100", text: "text-red-700" },
};

function getMonthMatrix(year, month) {
    // month: 0-11. Devuelve arreglo de semanas (arreglos de 7), lun-dom.
    const first = new Date(year, month, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0 = lunes
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}


function MiniKpiCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500 truncate">{label}</div>
                <div className="text-2xl font-extrabold text-[#131E5C] leading-tight">{value}</div>
                {sub ? <div className="text-[10px] font-semibold text-slate-400">{sub}</div> : null}
            </div>
        </div>
    );
}

function CalendarioView({ rows, loading, onEdit, onContext, onToggleAsistencia, updatingInline }) {
    const today = useMemo(() => new Date(), []);
    const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    // Citas agrupadas por día (YMD) usando TODO lo que llega en rows (ya filtrado por tus filtros de arriba)
    const citasByDay = useMemo(() => {
        const map = {};
        for (const c of rows) {
            if (!c.fecha_hora_cita) continue;
            const dt = new Date(c.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) continue;
            const key = toYMDLocal(dt);
            if (!map[key]) map[key] = [];
            map[key].push(c);
        }
        return map;
    }, [rows]);

    const weeks = useMemo(
        () => getMonthMatrix(viewMonth.getFullYear(), viewMonth.getMonth()),
        [viewMonth]
    );

    const monthLabel = `${MONTHS_ES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

    const goPrevMonth = () => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const goNextMonth = () => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const selectedKey = toYMDLocal(selectedDate);
    const esHoySeleccionado = isSameDay(selectedDate, today);

    const citasDelDia = useMemo(() => {
        const list = citasByDay[selectedKey] || [];
        return [...list].sort((a, b) => new Date(a.fecha_hora_cita) - new Date(b.fecha_hora_cita));
    }, [citasByDay, selectedKey]);

    // KPIs calculados SOLO sobre las citas del día seleccionado en el calendario
    const kpis = useMemo(() => {
        let pendientes = 0, asistieron = 0, noAsistieron = 0;
        for (const c of citasDelDia) {
            const est = getEstatusCita(c);
            if (est === "pendiente") pendientes++;
            else if (est === "asistio") asistieron++;
            else noAsistieron++;
        }
        const totalResueltas = asistieron + noAsistieron;
        const pctAsist = totalResueltas > 0 ? Math.round((asistieron / totalResueltas) * 100) : 0;

        return { citasDia: citasDelDia.length, pendientes, asistieron, noAsistieron, pctAsist, totalResueltas };
    }, [citasDelDia]);

    useEffect(() => { setPage(1); }, [selectedKey]);

    const totalPages = Math.max(1, Math.ceil(citasDelDia.length / PAGE_SIZE));
    const pageItems = citasDelDia.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const pickDay = (d) => {
        if (!d) return;
        setSelectedDate(d);
    };

    const orderedDayLabels = useMemo(() => DAYS_ES.filter((_, i) => i !== 0).concat(DAYS_ES[0]), []);

    return (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            {/* KPIs arriba, ocupando todo el ancho — se recalculan según el día seleccionado en el calendario */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:grid-cols-5">
                <MiniKpiCard
                    icon={CalendarClock}
                    label={esHoySeleccionado ? "Citas de hoy" : "Citas del día"}
                    value={kpis.citasDia}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-700"
                />
                <MiniKpiCard icon={Clock} label="Pendientes" value={kpis.pendientes} iconBg="bg-amber-100" iconColor="text-amber-700" />
                <MiniKpiCard icon={CheckCircle2} label="Asistieron" value={kpis.asistieron} iconBg="bg-emerald-100" iconColor="text-emerald-700" />
                <MiniKpiCard icon={XCircle} label="No asistieron" value={kpis.noAsistieron} iconBg="bg-red-100" iconColor="text-red-700" />
                <MiniKpiCard
                    icon={PieChart}
                    label="Tasa de asistencia"
                    value={`${kpis.pctAsist}%`}
                    sub={`${kpis.asistieron} de ${kpis.totalResueltas}`}
                    iconBg="bg-sky-100"
                    iconColor="text-sky-700"
                />
            </div>

            {/* Calendario mensual */}
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <button onClick={goPrevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#131E5C]/20 hover:bg-[#131E5C]/5 text-[#131E5C]">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-sm font-extrabold text-[#131E5C]">{monthLabel}</div>
                    <button onClick={goNextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#131E5C]/20 hover:bg-[#131E5C]/5 text-[#131E5C]">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1">
                    {orderedDayLabels.map((d) => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {weeks.flat().map((d, i) => {
                        if (!d) return <div key={i} className="h-11" />;
                        const key = toYMDLocal(d);
                        const hasCitas = !!citasByDay[key]?.length;
                        const isSelected = key === selectedKey;
                        const isToday = isSameDay(d, today);
                        return (
                            <button
                                key={i}
                                onClick={() => pickDay(d)}
                                className={[
                                    "h-11 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition",
                                    isSelected
                                        ? "bg-[#131E5C] text-white"
                                        : isToday
                                            ? "border border-[#131E5C] text-[#131E5C]"
                                            : "text-slate-600 hover:bg-slate-100",
                                ].join(" ")}
                            >
                                <span>{d.getDate()}</span>
                                {hasCitas ? (
                                    <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} />
                                ) : (
                                    <span className="mt-0.5 h-1 w-1" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Lista de citas del día seleccionado */}
            <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                    <div className="text-sm font-extrabold text-[#131E5C] capitalize">{formatFullDateEs(selectedDate)}</div>
                    <div className="text-xs font-bold text-slate-400">
                        {citasDelDia.length} cita{citasDelDia.length !== 1 ? "s" : ""}
                    </div>
                </div>

                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-xs bg-slate-50 text-slate-500 border-b border-black/10">
                            <tr>
                                {["Hora", "Cliente", "Vehículo de interés", "Asesor", "Tipo de cita", "Estatus", ""].map((h) => (
                                    <th key={h} className="px-4 py-2 font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm font-semibold">
                                        No hay citas para este día.
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((row) => {
                                    const dt = new Date(row.fecha_hora_cita);
                                    const hora = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
                                    const nombre = row?.cliente?.nombre || "—";
                                    const tel = row?.cliente?.telefono || "—";
                                    const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";
                                    const color = getColor(row.tipo_cita);
                                    const estKey = getEstatusCita(row);
                                    const est = ESTATUS_UI[estKey];
                                    const isUpdating = !!updatingInline[row.id];

                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50 cursor-pointer" onDoubleClick={() => onEdit(row)}>
                                            <td className="px-4 py-3 font-bold text-[#131E5C]">{hora}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                                                        {iniciales}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-bold text-[#131E5C]">{nombre}</div>
                                                        <div className="truncate text-xs text-slate-400">{tel}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{row.auto_interes || "—"}</td>
                                            <td className="px-4 py-3 text-slate-600">{row.asesor_piso || row.asesor_digital || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${color.bg} ${color.text}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                                                    {row.tipo_cita || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    disabled={isUpdating || estKey === "pendiente"}
                                                    onClick={(e) => { e.stopPropagation(); onToggleAsistencia(row); }}
                                                    className={[
                                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                                                        est.bg, est.text,
                                                        estKey === "pendiente" ? "cursor-default" : "hover:opacity-80",
                                                    ].join(" ")}
                                                    title={estKey === "pendiente" ? "La cita aún no ocurre" : "Cambiar asistencia"}
                                                >
                                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                                    {est.label}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <button onClick={() => onEdit(row)} title="Editar" className="hover:text-[#131E5C]">
                                                        <CalendarDays className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={(e) => onContext(e, row)} title="Más opciones" className="hover:text-[#131E5C]">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {citasDelDia.length > 0 && (
                    <div className="flex items-center justify-between border-t border-black/10 px-4 py-2">
                        <div className="text-xs font-semibold text-slate-400">
                            Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, citasDelDia.length)} de {citasDelDia.length} citas
                        </div>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-black/10 text-[#131E5C] disabled:opacity-40">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#131E5C] text-white text-xs font-bold">{page}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-black/10 text-[#131E5C] disabled:opacity-40">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


function AgendaView({ rows, loading, onEdit, onNewAtSlot, onToggleAsistencia, updatingInline }) {
    const [weekRef, setWeekRef] = useState(new Date());
    const today = new Date();

    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekRef);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return new Date(
            monday.getFullYear(),
            monday.getMonth(),
            monday.getDate() + i
        );
    });

    const goNext = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); };
    const goPrev = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); };
    const goToday = () => setWeekRef(new Date());

    const citasByDayHour = useMemo(() => {
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
        const sm = start.getDate();
        const em = end.getDate();
        const smth = MONTHS_ES[start.getMonth()];
        const emth = MONTHS_ES[end.getMonth()];
        const yr = end.getFullYear();
        if (start.getMonth() === end.getMonth()) return `${sm} – ${em} de ${smth} de ${yr}`;
        return `${sm} de ${smth} – ${em} de ${emth} de ${yr}`;
    }, [weekDates]);

    const handleToggleAsistencia = (e, cita) => {
        e.stopPropagation();
        if (onToggleAsistencia) onToggleAsistencia(cita);
    };

    return (
        <div className="rounded-lg border border-black/10 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10">
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Semana</div>
                    <div className="text-sm font-extrabold text-[#131E5C]">{weekLabel}</div>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">Tradicional</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">Digital</span>
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
                                    <span className="text-sm font-semibold">Cargando citas...</span>
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
                                                const citas = citasByDayHour?.[dayKey]?.[hour] || [];

                                                return (
                                                    <td key={hi} className="border-r border-b border-black/10 align-top p-1 relative group/cell bg-white hover:bg-slate-50" style={{ minHeight: "72px", verticalAlign: "top" }}>
                                                        {citas.length === 0 && (
                                                            <button
                                                                onClick={() => onNewAtSlot(d, hour)}
                                                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-[#131E5C]/10 text-[#131E5C] opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#131E5C] hover:text-white"
                                                                title={`Nueva cita ${String(hour).padStart(2, "0")}:00`}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}

                                                        <div className="flex flex-col gap-2">
                                                            {citas.map((cita) => {
                                                                const dt = new Date(cita.fecha_hora_cita);
                                                                const mins = String(dt.getMinutes()).padStart(2, "0");
                                                                const color = getColor(cita.tipo_cita);
                                                                const isUpdating = updatingInline?.[cita.id] || false;
                                                                const nombreCliente = cita?.cliente?.nombre || "—";
                                                                const telefono = cita?.cliente?.telefono || "—";
                                                                const autoInteres = cita.auto_interes || "—";
                                                                const asesorPiso = cita.asesor_piso || "—";

                                                                const asesorDigital = cita.asesor_digital || "—";

                                                                return (
                                                                    <div key={cita.id} onClick={() => onEdit(cita)} className={`rounded-md p-2 text-left cursor-pointer hover:opacity-90 transition-all ${color.bg} ${color.border} border-l-4 shadow-sm`}>
                                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                                            <span className="text-xs font-bold text-[#131E5C]">{String(hour).padStart(2, "0")}:{mins}</span>
                                                                            <button
                                                                                disabled={isUpdating}
                                                                                onClick={(e) => handleToggleAsistencia(e, cita)}
                                                                                className={[
                                                                                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                                                                                    cita.asistencia ? "bg-emerald-200 text-emerald-800 border-emerald-300" : "bg-red-200 text-red-800 border-red-300",
                                                                                    isUpdating ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
                                                                                ].join(" ")}
                                                                            >
                                                                                {isUpdating ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                                                                                {cita.asistencia ? "✓ Sí" : "✗ No"}
                                                                            </button>
                                                                        </div>
                                                                        <div className="text-sm font-extrabold text-[#131E5C] truncate">{nombreCliente}</div>
                                                                        <div className="text-xs font-semibold text-slate-600 truncate">🚗 {autoInteres}</div>
                                                                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {telefono}</div>
                                                                        <div className="text-[10px] text-slate-500 truncate mt-1"><span className="font-semibold">Digital:</span> {asesorDigital}</div>
                                                                        <div className="text-[10px] text-slate-500 truncate"><span className="font-semibold">Piso:</span> {asesorPiso}</div>
                                                                        {cita.comentarios && cita.comentarios !== "" && (
                                                                            <div className="text-[10px] text-slate-400 italic truncate mt-1">💬 {cita.comentarios.substring(0, 50)}</div>
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
        </div>
    );
}


function Bar({ label, value, max, color, total }) {
    const [hovered, setHovered] = useState(false);
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const pctTotal = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div
            className="relative flex items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-150 cursor-default"
            style={{ background: hovered ? "rgba(19,30,92,0.05)" : "transparent" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {hovered && (
                <div className="absolute left-1/2 -top-9 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg bg-[#131E5C] px-3 py-1.5 text-xs font-bold text-white shadow-xl pointer-events-none">
                    {label ? <span className="mr-1">{label}:</span> : null}
                    {value} citas {total > 0 ? `(${pctTotal}%)` : ""}
                    <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#131E5C] rotate-45" />
                </div>
            )}
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%`, opacity: hovered ? 1 : 0.85 }} />
            </div>
            <span className={`text-xs font-bold w-6 text-right transition-colors ${hovered ? "text-[#131E5C]" : "text-slate-500"}`}>
                {value}
            </span>
        </div>
    );
}


function ColBar({ dia, cnt, pct, hovered, onEnter, onLeave }) {
    return (
        <div className="flex-1 flex flex-col items-center gap-1 cursor-default" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <span className={`text-xs font-bold transition-colors ${hovered ? "text-[#131E5C]" : "text-transparent"}`}>{cnt}</span>
            <div className="relative w-full rounded-t-md bg-[#131E5C]/10 flex items-end" style={{ height: "72px" }}>
                <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${pct}%`, minHeight: cnt > 0 ? "4px" : "0", background: hovered ? "#131E5C" : "rgba(19,30,92,0.6)" }} />
                {hovered && cnt > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#131E5C] px-2 py-1 text-xs font-bold text-white shadow-xl pointer-events-none z-50">
                        {cnt} cita{cnt !== 1 ? "s" : ""}
                        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#131E5C] rotate-45" />
                    </div>
                )}
            </div>
            <span className={`text-xs font-semibold transition-colors ${hovered ? "text-[#131E5C] font-extrabold" : "text-slate-500"}`}>{dia}</span>
        </div>
    );
}


function KpiCard({ label, value, color, bg, detail }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div className={`rounded-xl border border-black/10 ${bg} p-4 transition-all duration-200 cursor-default select-none`} style={{ transform: hovered ? "translateY(-2px)" : "none", boxShadow: hovered ? "0 8px 24px rgba(19,30,92,0.12)" : "none" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div className="text-xs font-bold text-slate-500 mb-1">{label}</div>
            <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
            {hovered && detail ? <div className="mt-2 text-xs font-semibold text-slate-400 animate-pulse">{detail}</div> : null}
        </div>
    );
}

function esCitaTradicional(tipo) {
    return normalizeStr(tipo).toLowerCase() === "tradicional";
}

function GraficosView({ rows }) {
    const [hoveredDia, setHoveredDia] = useState(null);

    const stats = useMemo(() => {
        const total = rows.length;
        const asistieron = rows.filter((r) => r.asistencia).length;
        const noAsistieron = total - asistieron;
        const pctAsist = total > 0 ? Math.round((asistieron / total) * 100) : 0;

        const porTipo = {};
        for (const r of rows) { const t = r.tipo_cita || "Sin tipo"; porTipo[t] = (porTipo[t] || 0) + 1; }

        const porAgencia = {};
        for (const r of rows) { const a = r.agencia || "Sin agencia"; porAgencia[a] = (porAgencia[a] || 0) + 1; }

        const porAsesor = {};
        for (const r of rows) { const a = r.asesor_digital || "Sin asesor"; porAsesor[a] = (porAsesor[a] || 0) + 1; }

        const citasTradicionales = rows.filter((r) => esCitaTradicional(r.tipo_cita));

        const porAsesorVentasTradicional = {};

        for (const r of citasTradicionales) {
            const asesor = normalizeStr(r.asesor_piso) || "Sin asesor";
            porAsesorVentasTradicional[asesor] = (porAsesorVentasTradicional[asesor] || 0) + 1;
        }

        const porFuente = {};
        for (const r of rows) { const f = r.fuente_prospeccion || "Sin fuente"; porFuente[f] = (porFuente[f] || 0) + 1; }

        const porDia = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };
        const daysMap = [6, 0, 1, 2, 3, 4, 5];
        const daysKeys = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        for (const r of rows) {
            if (!r.fecha_hora_cita) continue;
            const d = new Date(r.fecha_hora_cita);
            if (Number.isNaN(d.getTime())) continue;
            porDia[daysKeys[daysMap[d.getDay()]]] = (porDia[daysKeys[daysMap[d.getDay()]]] || 0) + 1;
        }
        return { total, asistieron, noAsistieron, pctAsist, porTipo, porAgencia, porAsesor, porFuente, porDia, citasTradicionales, porAsesorVentasTradicional, };
    }, [rows]);

    const topAgencias = Object.entries(stats.porAgencia).sort((a, b) => b[1] - a[1]);
    const topAsesores = Object.entries(stats.porAsesor).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topAsesoresVentasTradicional = Object.entries(stats.porAsesorVentasTradicional).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topFuentes = Object.entries(stats.porFuente).sort((a, b) => b[1] - a[1]);
    const maxAgencia = topAgencias[0]?.[1] || 1;
    const maxAsesor = topAsesores[0]?.[1] || 1;
    const maxAsesorVentasTradicional = topAsesoresVentasTradicional[0]?.[1] || 1;
    const maxFuente = topFuentes[0]?.[1] || 1;
    const maxDia = Math.max(...Object.values(stats.porDia), 1);

    const AGENCIA_COLORS = ["bg-[#131E5C]", "bg-blue-600", "bg-blue-400", "bg-blue-300", "bg-sky-300", "bg-cyan-300", "bg-teal-300"];
    const FUENTE_COLORS = ["bg-violet-600", "bg-violet-500", "bg-violet-400", "bg-violet-300", "bg-purple-300", "bg-purple-200", "bg-indigo-300", "bg-indigo-200", "bg-blue-300", "bg-sky-300"];
    const ASESOR_COLORS = ["bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-emerald-300", "bg-teal-400", "bg-teal-300", "bg-cyan-400", "bg-cyan-300"];
    const ASESOR_VENTAS_COLORS = ["bg-[#131E5C]", "bg-blue-700", "bg-blue-600", "bg-blue-500", "bg-sky-500", "bg-sky-400", "bg-cyan-500", "bg-cyan-400", "bg-indigo-500", "bg-indigo-400",];

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total citas" value={stats.total} color="text-[#131E5C]" bg="bg-[#131E5C]/5" detail="Total de citas registradas con los filtros activos" />
                <KpiCard label="Asistieron" value={stats.asistieron} color="text-emerald-700" bg="bg-emerald-50" detail={`${stats.pctAsist}% de tasa de asistencia`} />
                <KpiCard label="No asistieron" value={stats.noAsistieron} color="text-red-600" bg="bg-red-50" detail={`${100 - stats.pctAsist}% no se presentaron`} />
                <KpiCard label="% Asistencia" value={`${stats.pctAsist}%`} color="text-blue-700" bg="bg-blue-50" detail={`${stats.asistieron} de ${stats.total} citas`} />
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><LayoutList className="h-4 w-4" /> Por tipo de cita</div>
                <div className="space-y-1">
                    {Object.entries(stats.porTipo).sort((a, b) => b[1] - a[1]).map(([tipo, cnt]) => {
                        const color = getColor(tipo);
                        const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0;
                        return (
                            <div key={tipo} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 cursor-default">
                                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color.dot}`} />
                                <span className="text-xs font-semibold text-slate-600 flex-1 truncate group-hover:text-[#131E5C] transition-colors">{tipo}</span>
                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{pct}%</span>
                                <div className="w-24 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 group-hover:opacity-100 opacity-75 ${color.dot}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-bold text-[#131E5C] w-5 text-right">{cnt}</span>
                            </div>
                        );
                    })}
                    {Object.keys(stats.porTipo).length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}
                </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Por dealer</div>
                <div className="space-y-1">
                    {topAgencias.map(([agencia, cnt], i) => (
                        <div key={agencia}>
                            <div className="flex items-center justify-between px-2 mb-0.5"><span className="text-xs font-semibold text-slate-600 truncate max-w-[75%]">{agencia}</span></div>
                            <Bar label={agencia} value={cnt} max={maxAgencia} color={AGENCIA_COLORS[i % AGENCIA_COLORS.length]} total={stats.total} />
                        </div>
                    ))}
                    {topAgencias.length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}
                </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Por día de la semana</div>
                <div className="flex items-end gap-2 mt-2" style={{ height: "110px" }}>
                    {Object.entries(stats.porDia).map(([dia, cnt]) => {
                        const pct = maxDia > 0 ? (cnt / maxDia) * 100 : 0;
                        return <ColBar key={dia} dia={dia} cnt={cnt} pct={pct} hovered={hoveredDia === dia} onEnter={() => setHoveredDia(dia)} onLeave={() => setHoveredDia(null)} />;
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-2">
                <div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><UserMinus className="h-4 w-4" /> Por asesor digital (top 8)</div>
                <div className="space-y-1">
                    {topAsesores.map(([asesor, cnt], i) => (
                        <div key={asesor}>
                            <div className="flex items-center justify-between px-2 mb-0.5"><span className="text-xs font-semibold text-slate-600 truncate max-w-[75%]">{asesor}</span></div>
                            <Bar label={asesor} value={cnt} max={maxAsesor} color={ASESOR_COLORS[i % ASESOR_COLORS.length]} total={stats.total} />
                        </div>
                    ))}
                    {topAsesores.length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}
                </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><UserSearch className="h-4 w-4" /> Por fuente de prospección</div>
                <div className="space-y-1">
                    {topFuentes.map(([fuente, cnt], i) => (
                        <div key={fuente}>
                            <div className="flex items-center justify-between px-2 mb-0.5"><span className="text-xs font-semibold text-slate-600 truncate max-w-[75%]">{fuente}</span></div>
                            <Bar label={fuente} value={cnt} max={maxFuente} color={FUENTE_COLORS[i % FUENTE_COLORS.length]} total={stats.total} />
                        </div>
                    ))}
                    {topFuentes.length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}
                </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm md:col-span-3 xl:col-span-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-[#131E5C] flex items-center gap-2">
                        <UserStar className="h-4 w-4" />
                        Citas tradicionales por asesor de ventas
                    </div>

                    <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-black text-[#131E5C]">
                        {stats.citasTradicionales.length} tradicionales
                    </span>
                </div>

                <div className="space-y-1">
                    {topAsesoresVentasTradicional.map(([asesor, cnt], i) => (
                        <div key={asesor}>
                            <div className="mb-0.5 flex items-center justify-between px-2">
                                <span className="max-w-[75%] truncate text-xs font-semibold text-slate-600">
                                    {asesor}
                                </span>

                                <span className="text-xs font-black text-[#131E5C]">
                                    {cnt}
                                </span>
                            </div>

                            <Bar
                                label={asesor}
                                value={cnt}
                                max={maxAsesorVentasTradicional}
                                color={ASESOR_VENTAS_COLORS[i % ASESOR_VENTAS_COLORS.length]}
                                total={stats.citasTradicionales.length}
                            />
                        </div>
                    ))}

                    {topAsesoresVentasTradicional.length === 0 ? (
                        <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-400">
                            No hay citas tradicionales con asesor de ventas en los filtros actuales.
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}


export default function RegistroCitas() {
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
                (ua) => ua.toLowerCase() === agencia.toLowerCase()
            );
        },
        [userAgencias]
    );

    const [citas, setCitas] = useState([]);
    const [vista, setVista] = useState("calendario");

    const DEALERS = useMemo(() => ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"], []);
    const ASESORES_DIGITALES = ["Lizbeth Cano Clara", "Erendira Santos Coyotzi", "Marelly Tenorio Salinas", "IA Vagen", "Edgar Omar Noguera Solis", "Dulce Abigail Garcia Olivares", "Bianca Isabel Chávez Alarcón", "Candy Denisse Marquez Cortes", "JULIO RAMIREZ LOPEZ",];
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

    const FUENTE = ["Facebook", "WhatsApp", "VW-Concesionarios", "Llamada Entrante", "Prospeccion", "Cartera", "Eternizacion de credito", "Remarketing", "Base de Datos", "Ubicacion"];
    const VEHICULOS = ["Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter", "CRAFTER ELITE", "CRAFTER URBAN", "CRAFTER ELEMENTAL", "CRAFTER INSPIRE"];
    const TIPO_CITA = ["Tradicional", "Digital", "Evento", "Remarketing"];
    const MOTIVOS_CITA = [
        "Prueba de Manejo",
        "Avalúo de auto usado",
        "Cotización de financiamiento",
        "Solicitud de Crédito",
        "Anticipo /enganche",
        "Documentos para facturación",
        "Firma de contrato",
        "Lanzamiento",
        "Open Day",
        "Información Post-venta",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort] = useState({ key: "fecha_hora_cita", dir: "desc" });
    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        asesorDigital: "Todos",
        asesorPiso: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingInline, setUpdatingInline] = useState({});

    function toggleSort(key) {
        setSort((prev) => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" });
    }

    const REQUIRED = useMemo(() => ({ cliente_telefono: "Teléfono", fecha_hora_cita: "Fecha y hora", motivo_cita: "Motivo de cita", }), []);
    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g, ""), [draft?.cliente_telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;
    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    useEffect(() => {
        const onGlobal = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);
        return () => { window.removeEventListener("click", onGlobal); window.removeEventListener("scroll", onGlobal, true); window.removeEventListener("resize", onGlobal); };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };

    const refreshList = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = await apiCitas.list();
            setCitas(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); setCitas([]); }
        finally { setLoadingList(false); }
    }, []);

    useEffect(() => { refreshList(); }, [refreshList]);

    const dealers = useMemo(() => {
        const set = new Set((citas || []).map((c) => normalizeStr(c.agencia)).filter(Boolean));
        if (!isAdmin && userAgencias.length > 0) return ["Todos", ...userAgencias];
        return ["Todos", ...Array.from(set)];
    }, [citas, isAdmin, userAgencias]);

    const asesoresDigitalesFiltro = useMemo(() => {
        const set = new Set([...ASESORES_DIGITALES.map((a) => normalizeStr(a)), ...(citas || []).map((c) => normalizeStr(c.asesor_digital))].filter(Boolean));
        return ["Todos", ...Array.from(set)];
    }, [citas]);

    const asesoresPisoFiltro = useMemo(() => {
        const set = new Set([
            ...ASESORES.map((a) => normalizeStr(a)),
            ...(citas || []).map((c) => normalizeStr(c.asesor_piso)),
        ].filter(Boolean));
        return ["Todos", ...Array.from(set)];
    }, [citas]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return (citas || []).filter((c) => {
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) return false;
            const nombreCliente = normalizeStr(c?.cliente?.nombre);
            const telCliente = normalizeStr(c?.cliente?.telefono);
            const matchQ =
                !q ||
                [
                    c.agencia,
                    nombreCliente,
                    telCliente,
                    c.auto_interes,
                    c.tipo_cita,
                    c.motivo_cita,
                    c.fuente_prospeccion,
                    c.asesor_digital,
                    c.asesor_piso,
                    c.comentarios,
                ].some((value) =>
                    normalizeStr(value).toLowerCase().includes(q)
                );
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(c.agencia) === normalizeStr(filters.agencia);
            const matchAsesorDigital = filters.asesorDigital === "Todos" || normalizeStr(c.asesor_digital) === normalizeStr(filters.asesorDigital);
            const matchAsesorPiso = filters.asesorPiso === "Todos" || normalizeStr(c.asesor_piso) === normalizeStr(filters.asesorPiso);
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymdInt = ymdToInt(c.fecha_hora_cita ? toYMDLocal(c.fecha_hora_cita) : "");
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchAsesorDigital && matchAsesorPiso && matchRango;
        });
    }, [citas, filters, isAdmin, userAgencias, userTieneAgencia]);

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
            return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
        });
    }, [filtered, sort]);

    const openCreate = (dateOverride, hourOverride) => {
        setTouchedSave(false);
        setMode("create");
        const agenciaDefault = isAdmin ? "" : userAgencias[0] || "";

        let fechaDefault = "";
        if (dateOverride) {
            const d = new Date(dateOverride);
            d.setHours(hourOverride ?? 9, 0, 0, 0);
            const pad = (n) => String(n).padStart(2, "0");
            fechaDefault = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
        }

        setDraft({
            id: null,
            cliente_id: null,
            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",
            auto_interes: "",
            fecha_hora_cita: fechaDefault,
            asistencia: false,
            tipo_cita: "",
            motivo_cita: "",
            fuente_prospeccion: "",
            asesor_digital: "",
            asesor_piso: "",
            comentarios: "",
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const c = await apiCitas.get(row.id);
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) {
                alert("No tienes permisos para ver registros de otra agencia."); setOpenModal(false); return;
            }
            setDraft({
                id: c.id,
                cliente_id: c?.cliente?.id_cliente ?? null,
                agencia: c.agencia || (isAdmin ? "" : userAgencia),
                cliente_nombre: c?.cliente?.nombre || "",
                cliente_telefono: c?.cliente?.telefono || "",
                auto_interes: c.auto_interes || "",
                fecha_hora_cita: toDTLocal(c.fecha_hora_cita),
                asistencia: !!c.asistencia,
                tipo_cita: c.tipo_cita || "",
                motivo_cita: c.motivo_cita || "",
                fuente_prospeccion: c.fuente_prospeccion || "",
                asesor_digital: c.asesor_digital || "",
                asesor_piso: c.asesor_piso || "",
                comentarios: c.comentarios || "",
            });
        } catch (e) { console.error(e); alert("No se pudo abrir la cita (revisa consola)."); setOpenModal(false); }
        finally { setLoadingDetail(false); }
    };

    const closeModal = () => { if (saving) return; setOpenModal(false); setDraft(null); };

    const eliminarCita = async (row) => {
        if (!row?.id) return;
        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia."); return;
        }
        const ok = confirm(`¿Eliminar la cita de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`);
        if (!ok) return;
        try {
            await apiCitas.remove(row.id);
            setCitas((prev) => prev.filter((c) => c.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) { console.error(e); alert("No se pudo eliminar (revisa consola / backend)."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        if (!telIsOk) return;
        setTouchedSave(true);
        if (missing.length) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : normalizeStr(draft.agencia || userAgencia);
            const payload = {
                agencia: agenciaFinal,

                ...(draft.cliente_id
                    ? { cliente_id: draft.cliente_id }
                    : {}),

                nombre: draft.cliente_nombre || "",
                telefono: normalizeStr(draft.cliente_telefono),
                auto_interes: draft.auto_interes || "",
                fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita),
                asistencia: !!draft.asistencia,
                tipo_cita: draft.tipo_cita || "",
                motivo_cita: draft.motivo_cita || "",
                fuente_prospeccion: draft.fuente_prospeccion || "",
                asesor_digital: draft.asesor_digital || "",
                asesor_piso: draft.asesor_piso || "",
                comentarios: draft.comentarios || "",
            };
            if (mode === "create") {
                await apiCitas.create(payload);
            } else {
                await apiCitas.patch(draft.id, payload);
            }
            await refreshList(); closeModal();
        } catch (e) { console.error(e); alert("Error guardando la cita (revisa consola)."); }
        finally { setSaving(false); }
    };

    const toggleAsistenciaInline = async (row) => {
        const id = row?.id; if (!id) return;
        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para modificar registros de otra agencia."); return;
        }
        const prev = !!row.asistencia;
        setCitas((p) => p.map((c) => (c.id === id ? { ...c, asistencia: !prev } : c)));
        setUpdatingInline((p) => ({ ...p, [id]: true }));
        try { await apiCitas.patch(id, { asistencia: !prev }); }
        catch (e) { console.error(e); setCitas((p) => p.map((c) => (c.id === id ? { ...c, asistencia: prev } : c))); alert("No se pudo actualizar asistencia."); }
        finally { setUpdatingInline((p) => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", asesorDigital: "Todos", asesorPiso: "Todos", rangoDesde: "", rangoHasta: "" });
    const setHoy = () => { const hoy = toYMDLocal(new Date()); setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy })); };

    const ViewToggle = () => (
        <div className="flex items-center rounded-lg border border-[#131E5C]/30 overflow-hidden">
            {[
                { key: "calendario", label: "Calendario", Icon: CalendarClock },
                { key: "agenda", label: "Agenda", Icon: Calendar },
                { key: "tabla", label: "Tabla", Icon: Table2 },
                { key: "graficos", label: "Gráficos", Icon: BarChart3 },
            ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setVista(key)} className={["inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition", vista === key ? "bg-[#131E5C] text-white" : "bg-white text-[#131E5C] hover:bg-[#131E5C]/10"].join(" ")}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                </button>
            ))}
        </div>
    );
    const exportarExcel = () => {
        const titulo = [["REPORTE DE CITAS — GRUPO AUTOMOTRIZ R&R"]];
        const fechaGen = [[`Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`]];
        const filtrosActivos = [];
        if (filters.agencia !== "Todos") filtrosActivos.push(`Dealer: ${filters.agencia}`);
        if (filters.asesorDigital !== "Todos") filtrosActivos.push(`Asesor Digital: ${filters.asesorDigital}`);
        if (filters.rangoDesde) filtrosActivos.push(`Desde: ${filters.rangoDesde}`);
        if (filters.rangoHasta) filtrosActivos.push(`Hasta: ${filters.rangoHasta}`);
        if (filters.q) filtrosActivos.push(`Búsqueda: "${filters.q}"`);
        const filtroFila = [[filtrosActivos.length ? `Filtros activos: ${filtrosActivos.join("  |  ")}` : "Sin filtros activos"]];
        const totalFila = [[`Total de registros: ${sorted.length}`]];
        const espaciado = [[]];

        const encabezados = [[
            "N°",
            "Fecha y Hora",
            "Dealer",
            "Cliente",
            "Teléfono",
            "Auto Interés",
            "Tipo Cita",
            "Motivo de cita",
            "Fuente Prospección",
            "Asesor Digital",
            "Asesor Piso",
            "¿Asistió?",
            "Comentarios",
        ]];

        const filas = sorted.map((row, i) => ([
            i + 1,
            row.fecha_hora_cita
                ? toDTLocal(row.fecha_hora_cita).replace("T", " ")
                : "—",
            row.agencia || "—",
            row?.cliente?.nombre || "—",
            row?.cliente?.telefono || "—",
            row.auto_interes || "—",
            row.tipo_cita || "—",
            row.motivo_cita || "—",
            row.fuente_prospeccion || "—",
            row.asesor_digital || "—",
            row.asesor_piso || "—",
            row.asistencia ? "Sí" : "No",
            row.comentarios || "—",
        ]));

        const data = [
            ...titulo,
            ...fechaGen,
            ...filtroFila,
            ...totalFila,
            ...espaciado,
            ...encabezados,
            ...filas,
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);

        ws["!cols"] = [
            { wch: 5 },
            { wch: 20 },
            { wch: 16 },
            { wch: 28 },
            { wch: 16 },
            { wch: 16 },
            { wch: 14 },
            { wch: 28 },
            { wch: 22 },
            { wch: 30 },
            { wch: 36 },
            { wch: 10 },
            { wch: 40 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Citas");
        XLSX.writeFile(wb, `citas_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };
    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Citas</h2>
                    {!isAdmin && userAgencias.length > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencias.join(", ")}</span>
                        </p>
                    ) : null}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <ViewToggle />
                    <button
                        type="button"
                        onClick={exportarExcel}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-xs font-black text-[#131E5C] hover:bg-[#131E5C] hover:text-white transition"
                        title="Exportar a Excel"
                    >
                        <FileDown className="h-4 w-4" />
                        Exportar Excel
                    </button>
                    <button onClick={() => openCreate()} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm">
                        <Plus className="h-4 w-4" /> Nueva Cita
                    </button>
                </div>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Buscar por dealer, cliente, teléfono…" className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]" />
                                {filters.q ? <button onClick={() => setFilters((p) => ({ ...p, q: "" }))} className="rounded-lg p-1 bg-white text-[#131E5C] hover:bg-white/80 hover:text-red-500"><X className="h-4 w-4" /></button> : null}
                            </div>
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-3">
                        <FilterBlock label="Dealer">
                            <select value={filters.agencia} onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                {dealers.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-3">
                        <FilterBlock label="Asesor Digital">
                            <select value={filters.asesorDigital} onChange={(e) => setFilters((p) => ({ ...p, asesorDigital: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                {asesoresDigitalesFiltro.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={setHoy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"><CalendarDays className="h-4 w-4" /> Hoy</button>
                                <button onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] px-3 py-2 text-sm font-semibold bg-white text-[#131E5C] hover:text-white hover:bg-[#131E5C]"><X className="h-4 w-4" /> Limpiar</button>
                            </div>
                        </FilterBlock>
                    </div>
                    <div className="md:col-span-4">
                        <FilterBlock label="Asesor Piso">
                            <select
                                value={filters.asesorPiso}
                                onChange={(e) => setFilters((p) => ({ ...p, asesorPiso: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {asesoresPisoFiltro.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-4">
                        <FilterBlock label="Desde">
                            <input
                                type="date"
                                value={filters.rangoDesde}
                                onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-4">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            {vista === "calendario" && (
                <CalendarioView
                    rows={sorted}
                    loading={loadingList}
                    onEdit={openEdit}
                    onContext={onRowContextMenu}
                    onToggleAsistencia={toggleAsistenciaInline}
                    updatingInline={updatingInline}
                />
            )}

            {vista === "agenda" && (
                <AgendaView
                    rows={sorted}
                    loading={loadingList}
                    onEdit={openEdit}
                    onNewAtSlot={(date, hour) => openCreate(date, hour)}
                    onToggleAsistencia={toggleAsistenciaInline}
                    updatingInline={updatingInline}
                />
            )}

            {vista === "tabla" && (
                <>
                    <MobileCardList rows={sorted} loading={loadingList} onEdit={openEdit} onContext={onRowContextMenu} onToggleAsistencia={toggleAsistenciaInline} updatingInline={updatingInline} />
                    <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                                    <tr>
                                        {[{ key: "fecha_hora_cita", label: "Fecha y Hora Cita" }, { key: "agencia", label: "Dealer" }].map(({ key, label }) => (
                                            <th key={key} className="px-4 py-3">
                                                <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 text-xs font-bold">
                                                    {label}
                                                    <span className="opacity-60">{sort.key === key ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}</span>
                                                </button>
                                            </th>
                                        ))}
                                        {["Cliente", "Auto interés", "Asesor Digital", "Asesor Piso", "Tipo Cita", "Comentarios", "¿Asistió?"].map((h) => <th key={h} className="px-4 py-3 text-xs font-bold">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : (
                                        <>
                                            {sorted.map((row) => {
                                                const isUpdating = !!updatingInline[row.id];
                                                return (
                                                    <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} className="cursor-pointer hover:bg-white/[0.04]" title="Doble clic para editar">
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</td>
                                                        <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="font-bold">{row?.cliente?.nombre || "—"}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.auto_interes || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.asesor_digital}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.asesor_piso || "--"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.tipo_cita || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><span className="line-clamp-2">{row.comentarios || "—"}</span></td>
                                                        <td className="px-4 py-3 text-[#131E5C]">
                                                            <button disabled={isUpdating} onClick={(e) => { e.stopPropagation(); toggleAsistenciaInline(row); }} className={["inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold", row.asistencia ? "bg-emerald-200 text-emerald-800 border-emerald-300" : "bg-red-200 text-red-800 border-red-300", isUpdating ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"].join(" ")}>
                                                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                                {row.asistencia ? "Sí" : "No"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {sorted.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</td></tr>}
                                        </>
                                    )}
                                </tbody>
                            </table>
                            <ContextMenu ctxMenu={ctxMenu} onDelete={async (row) => { await eliminarCita(row); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </div>
                    </div>
                </>
            )}

            {vista === "graficos" && <GraficosView rows={sorted} />}

            <Modal open={openModal} title={mode === "create" ? "Nueva Cita" : `Editar Cita • ${draft?.id}`} onClose={closeModal} footer={
                <>
                    <button onClick={closeModal} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600 disabled:opacity-60"><X className="h-4 w-4" /> Cancelar</button>
                    <button onClick={save} disabled={saving || loadingDetail || telInvalid || (draft?.cliente_telefono ? !telIsOk : false)} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </>
            }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-3">
                            <Field label="Tipo de cita" icon={LayoutList}>
                                <select value={draft.tipo_cita || ""} onChange={(e) => setDraft((p) => ({ ...p, tipo_cita: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                    <option value="" disabled>Selecciona un tipo de cita...</option>
                                    {TIPO_CITA.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </Field>
                        </div>
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin && userAgencias.length <= 1} className={[inputBase, inputOk, !isAdmin && userAgencias.length <= 1 ? "opacity-75 cursor-not-allowed" : ""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias).map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Nombre del cliente" icon={User}>
                            <input value={draft.cliente_nombre} onChange={(e) => setDraft((p) => ({ ...p, cliente_nombre: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.cliente_telefono} onChange={(e) => setDraft((p) => ({ ...p, cliente_telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} disabled={mode === "edit" || telIsNormalized} className={[inputBase, (isInvalid("cliente_telefono") || telInvalid) ? inputBad : inputOk, (mode === "edit" || telIsNormalized) ? "opacity-75 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("cliente_telefono") && <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                            {!isInvalid("cliente_telefono") && telError && <div className="mt-2 text-xs font-bold text-red-600">{telError}</div>}
                        </Field>
                        <Field label="VW de sus sueños" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Fecha y Hora de cita" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita} onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_cita: e.target.value }))} className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_cita") && <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora es requerido.</div>}
                        </Field>
                        <Field label="Fuente de Prospección" icon={UserSearch}>
                            <select value={draft.fuente_prospeccion || ""} onChange={(e) => setDraft((p) => ({ ...p, fuente_prospeccion: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona una fuente ...</option>
                                {FUENTE.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Asistencia de cita" icon={UserCheck}>
                            <label className="flex items-center gap-3 text-sm font-semibold text-[#131E5C]">
                                <input type="checkbox" checked={!!draft.asistencia} onChange={(e) => setDraft((p) => ({ ...p, asistencia: e.target.checked }))} className="h-4 w-4" />
                                ¿Asistió?
                            </label>
                        </Field>
                        <Field label="Asesor Digital" icon={UserMinus}>
                            <select value={draft.asesor_digital || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_digital: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor ...</option>
                                {ASESORES_DIGITALES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Asesor Piso" icon={UserStar}>
                            <select value={draft.asesor_piso || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_piso: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor ...</option>
                                {ASESORES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <div className="md:col-span-1">
                            <Field label="Motivo de cita" icon={CalendarCheck}>
                                <select
                                    value={draft.motivo_cita || ""}
                                    onChange={(e) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            motivo_cita: e.target.value,
                                        }))
                                    }
                                    className={[
                                        inputBase,
                                        isInvalid("motivo_cita") ? inputBad : inputOk,
                                    ].join(" ")}
                                >
                                    <option value="" disabled>
                                        Selecciona un motivo de cita...
                                    </option>

                                    {MOTIVOS_CITA.map((motivo) => (
                                        <option key={motivo} value={motivo}>
                                            {motivo}
                                        </option>
                                    ))}
                                </select>

                                {isInvalid("motivo_cita") ? (
                                    <div className="mt-2 text-xs font-bold text-red-600">
                                        Motivo de cita es requerido.
                                    </div>
                                ) : null}
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea value={draft.comentarios} onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))} className={[inputBase, inputOk, "min-h-[110px]"].join(" ")} placeholder="Notas internas..." />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}