import { useEffect, useMemo, useState } from "react";
import {
    Search,
    X,
    CalendarDays,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Building2,
    User,
    MessageSquareText,
    ClipboardList,
    Eye,
    Loader2,
    UserRound,
    Star,
} from "lucide-react";
import { apiEncuestas } from "../../lib/apiEncuestas";

const BRAND_BLUE = "#131E5C";

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function getDatePartsMexico(dateLike) {
    if (!dateLike) return null;

    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;

    const parts = new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(d);

    const map = {};
    for (const part of parts) {
        if (part.type !== "literal") {
            map[part.type] = part.value;
        }
    }

    return map;
}

function formatFechaTabla(dateLike) {
    const p = getDatePartsMexico(dateLike);
    if (!p) return "—";
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
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

function cls(...values) {
    return values.filter(Boolean).join(" ");
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-44 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-20 rounded-full bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-20 rounded-full bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-20 rounded-full bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-20 rounded-full bg-slate-200/60" />
            </td>
        </tr>
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

function Modal({ open, title, onClose, children }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">
                                {title}
                            </div>
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

function PuntajeBadge({ value }) {
    const n = Number(value || 0);

    const color =
        n >= 5
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : n >= 4
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : n >= 3
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-red-100 text-red-700 border-red-200";

    return (
        <span
            className={cls(
                "inline-flex min-w-[44px] items-center justify-center rounded-full border px-3 py-1 text-xs font-extrabold",
                color
            )}
        >
            {n || "—"}
        </span>
    );
}

function MobileCardList({ rows, loading, onOpenDetail }) {
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
                        No hay encuestas con esos filtros.
                    </div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => (
                            <div
                                key={row.id_encuesta}
                                className="rounded-lg border border-black/10 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                                            <CalendarDays className="h-4 w-4" />
                                            <span className="truncate">{formatFechaTabla(row.creado)}</span>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Building2 className="h-4 w-4" />
                                            <span className="truncate">{row.agencia || "—"}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onOpenDetail(row)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-1 text-xs font-bold text-[#131E5C]"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Ver
                                    </button>
                                </div>

                                <div className="mt-3 grid gap-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                                        <User className="h-4 w-4" />
                                        <span className="truncate">{row.nombre_cliente || "—"}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                        <UserRound className="h-4 w-4 text-[#131E5C]" />
                                        <span className="truncate">{row.asesor_atendio || "—"}</span>
                                    </div>

                                    <div className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                                        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" />
                                        <span className="line-clamp-2">{row.motivo_visita || "—"}</span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <PuntajeBadge value={row.atencion_asesor} />
                                        <PuntajeBadge value={row.seguimiento_asesor} />
                                        <PuntajeBadge value={row.tiempo_entrega_unidad} />
                                        <PuntajeBadge value={row.experiencia_recepcion} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RegistroEncuestasSatisfaccion() {
    const [encuestas, setEncuestas] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [selected, setSelected] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    const [sort, setSort] = useState({ key: "creado", dir: "desc" });

    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    async function refreshList() {
        setLoadingList(true);
        try {
            const data = await apiEncuestas.list();
            setEncuestas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setEncuestas([]);
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        refreshList();
    }, []);

    async function openDetail(row) {
        if (!row?.id_encuesta) return;

        setOpenModal(true);
        setLoadingDetail(true);

        try {
            const data = await apiEncuestas.get(row.id_encuesta);
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
        const set = new Set(
            (encuestas || []).map((item) => normalizeStr(item.agencia)).filter(Boolean)
        );
        return ["Todos", ...Array.from(set)];
    }, [encuestas]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (encuestas || []).filter((item) => {
            const matchQ =
                !q ||
                normalizeStr(item.agencia).toLowerCase().includes(q) ||
                normalizeStr(item.nombre_cliente).toLowerCase().includes(q) ||
                normalizeStr(item.asesor_atendio).toLowerCase().includes(q) ||
                normalizeStr(item.motivo_visita).toLowerCase().includes(q) ||
                normalizeStr(item.comentario).toLowerCase().includes(q);

            const matchAgencia =
                filters.agencia === "Todos" ||
                normalizeStr(item.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymd = toYMDMexico(item.creado);
                const ymdInt = ymdToInt(ymd);

                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [encuestas, filters]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "creado") {
                const ta = a.creado ? new Date(a.creado).getTime() : 0;
                const tb = b.creado ? new Date(b.creado).getTime() : 0;
                return (ta - tb) * mult;
            }

            if (
                key === "atencion_asesor" ||
                key === "seguimiento_asesor" ||
                key === "tiempo_entrega_unidad" ||
                key === "experiencia_recepcion"
            ) {
                const va = Number(a[key] || 0);
                const vb = Number(b[key] || 0);
                return (va - vb) * mult;
            }

            const va = normalizeStr(a[key]).toLowerCase();
            const vb = normalizeStr(b[key]).toLowerCase();

            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    function resetFilters() {
        setFilters({
            q: "",
            agencia: "Todos",
            rangoDesde: "",
            rangoHasta: "",
        });
    }

    function setHoy() {
        const hoy = toYMDMexico(new Date());
        setFilters((prev) => ({
            ...prev,
            rangoDesde: hoy,
            rangoHasta: hoy,
        }));
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-[#131E5C]">
                        Registro de Encuestas de Satisfacción
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                        Consulta general de encuestas registradas.
                    </p>
                </div>

                <button
                    onClick={refreshList}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80"
                >
                    {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Recargar
                </button>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, q: e.target.value }))
                                    }
                                    placeholder="Buscar por cliente, asesor, motivo o comentario..."
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]"
                                />
                                {filters.q ? (
                                    <button
                                        onClick={() =>
                                            setFilters((prev) => ({ ...prev, q: "" }))
                                        }
                                        className="rounded-lg bg-white p-1 text-[#131E5C] hover:bg-white/80 hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Agencia">
                            <select
                                value={filters.agencia}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, agencia: e.target.value }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {agencias.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>

                                <button
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
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
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        rangoDesde: e.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
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
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            <MobileCardList
                rows={sorted}
                loading={loadingList}
                onOpenDetail={openDetail}
            />

            <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border border-black bg-[#131E5C] text-xs text-white">
                            <tr>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("creado")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha
                                        <span className="opacity-60">
                                            {sort.key === "creado" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("agencia")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Agencia
                                        <span className="opacity-60">
                                            {sort.key === "agencia" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("nombre_cliente")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Cliente
                                        <span className="opacity-60">
                                            {sort.key === "nombre_cliente" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("asesor_atendio")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Asesor
                                        <span className="opacity-60">
                                            {sort.key === "asesor_atendio" ? (
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

                                <th className="px-4 py-3">Motivo</th>

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("atencion_asesor")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Atención
                                        <span className="opacity-60">
                                            {sort.key === "atencion_asesor" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("seguimiento_asesor")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Seguimiento
                                        <span className="opacity-60">
                                            {sort.key === "seguimiento_asesor" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("tiempo_entrega_unidad")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Entrega
                                        <span className="opacity-60">
                                            {sort.key === "tiempo_entrega_unidad" ? (
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

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("experiencia_recepcion")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Recepción
                                        <span className="opacity-60">
                                            {sort.key === "experiencia_recepcion" ? (
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
                                            key={row.id_encuesta}
                                            onDoubleClick={() => openDetail(row)}
                                            className="cursor-pointer hover:bg-white/[0.04]"
                                            title="Doble clic para ver detalle"
                                        >
                                            <td className="px-4 py-3 text-[#131E5C]">
                                                {formatFechaTabla(row.creado)}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-[#131E5C]">
                                                {row.agencia || "—"}
                                            </td>

                                            <td className="px-4 py-3 text-[#131E5C]">
                                                <div className="font-bold">{row.nombre_cliente || "—"}</div>
                                            </td>

                                            <td className="px-4 py-3 text-[#131E5C]">
                                                {row.asesor_atendio || "—"}
                                            </td>

                                            <td className="max-w-[260px] px-4 py-3 text-[#131E5C]">
                                                <div className="line-clamp-2">{row.motivo_visita || "—"}</div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <PuntajeBadge value={row.atencion_asesor} />
                                            </td>

                                            <td className="px-4 py-3">
                                                <PuntajeBadge value={row.seguimiento_asesor} />
                                            </td>

                                            <td className="px-4 py-3">
                                                <PuntajeBadge value={row.tiempo_entrega_unidad} />
                                            </td>

                                            <td className="px-4 py-3">
                                                <PuntajeBadge value={row.experiencia_recepcion} />
                                            </td>

                                        </tr>
                                    ))}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-10 text-center text-[#131E5C]">
                                                No hay encuestas con esos filtros.
                                            </td>
                                        </tr>
                                    ) : null}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={openModal}
                title={
                    selected
                        ? `Detalle de encuesta #${selected.id_encuesta}`
                        : "Detalle de encuesta"
                }
                onClose={closeModal}
            >
                {loadingDetail ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"
                            >
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : !selected ? null : (
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Fecha de registro" icon={CalendarDays}>
                            <div className="text-sm font-semibold text-[#131E5C]">
                                {formatFechaTabla(selected.creado)}
                            </div>
                        </Field>

                        <Field label="Agencia" icon={Building2}>
                            <div className="text-sm font-semibold text-[#131E5C]">
                                {selected.agencia || "—"}
                            </div>
                        </Field>

                        <Field label="Cliente" icon={User}>
                            <div className="text-sm font-semibold text-[#131E5C]">
                                {selected.nombre_cliente || "—"}
                            </div>
                        </Field>

                        <Field label="Asesor que atendió" icon={UserRound}>
                            <div className="text-sm font-semibold text-[#131E5C]">
                                {selected.asesor_atendio || "—"}
                            </div>
                        </Field>

                        <Field label="Motivo de visita" icon={ClipboardList}>
                            <div className="text-sm font-semibold text-[#131E5C]">
                                {selected.motivo_visita || "—"}
                            </div>
                        </Field>

                        <Field label="Atención del asesor" icon={Star}>
                            <PuntajeBadge value={selected.atencion_asesor} />
                        </Field>

                        <Field label="Seguimiento del asesor" icon={Star}>
                            <PuntajeBadge value={selected.seguimiento_asesor} />
                        </Field>

                        <Field label="Tiempo de entrega" icon={Star}>
                            <PuntajeBadge value={selected.tiempo_entrega_unidad} />
                        </Field>

                        <Field label="Experiencia en recepción" icon={Star}>
                            <PuntajeBadge value={selected.experiencia_recepcion} />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Comentario" icon={MessageSquareText}>
                                <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-[#131E5C]/10 bg-white px-3 py-3 text-sm font-semibold text-[#131E5C]">
                                    {selected.comentario || "Sin comentario."}
                                </div>
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}