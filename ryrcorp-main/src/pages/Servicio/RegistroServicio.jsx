import { useMemo, useState, useEffect } from "react";
import {
    Search,
    X,
    User,
    CalendarDays,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Loader2,
    Building2,
    UserStar,
    MessageSquareText,
    ClipboardList,
    Star,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiServicio } from "../../lib/apiServicio";

const BRAND_BLUE = "#131E5C";

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function Skeleton({ className = "" }) {
    return (
        <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 9 }).map((_, i) => (
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
            {Array.from({ length: 8 }).map((_, i) => (
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
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
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
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
                {label}
            </div>
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
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
            d.getHours()
        )}:${pad(d.getMinutes())}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}`;
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

function obtenerPromedio(row) {
    const valores = [
        Number(row?.satisfaccion_atencion_asesor || 0),
        Number(row?.percepcion_calidad_precio || 0),
        Number(row?.satisfaccion_servicio_ryr || 0),
    ].filter((n) => Number.isFinite(n) && n > 0);

    if (!valores.length) return 0;

    const suma = valores.reduce((acc, n) => acc + n, 0);
    return suma / valores.length;
}

function getScoreClasses(value) {
    const numero = Number(value || 0);

    if (numero >= 5) {
        return "border-emerald-300 bg-emerald-100 text-emerald-700";
    }

    if (numero >= 4) {
        return "border-sky-300 bg-sky-100 text-sky-700";
    }

    if (numero >= 3) {
        return "border-amber-300 bg-amber-100 text-amber-700";
    }

    if (numero >= 2) {
        return "border-rose-300 bg-rose-100 text-rose-700";
    }

    if (numero >= 1) {
        return "border-red-300 bg-red-100 text-red-700";
    }

    return "border-slate-300 bg-slate-100 text-slate-500";
}

function ScorePill({ value }) {
    const numero = Number(value || 0);

    return (
        <span
            className={[
                "inline-flex min-w-[42px] items-center justify-center rounded-full border px-3 py-1 text-xs font-extrabold",
                getScoreClasses(numero),
            ].join(" ")}
        >
            {numero > 0 ? numero : "—"}
        </span>
    );
}

function MobileCardList({ rows, loading, onOpen }) {
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
                            const fecha = row.creado
                                ? toDTLocal(row.creado).replace("T", " ")
                                : "—";
                            const promedio = obtenerPromedio(row);

                            return (
                                <div
                                    key={row.id_encuesta}
                                    onClick={() => onOpen(row)}
                                    className="cursor-pointer rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md"
                                    title="Toca para ver detalle"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                                                <CalendarDays className="h-4 w-4" />
                                                <span className="truncate">{fecha}</span>
                                            </div>

                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Building2 className="h-4 w-4" />
                                                <span className="truncate">{row.agencia || "—"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                                            <User className="h-4 w-4" />
                                            <span className="truncate">{row.nombre_OS_cliente || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <UserStar className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.asesor_atendio || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <ClipboardList className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">
                                                {row.satisfaccion_agenda_cita || "—"}
                                            </span>
                                        </div>

                                        <div className="mt-1 text-xs text-slate-600">
                                            <div className="flex items-start gap-2">
                                                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" />
                                                <span className="line-clamp-2">{row.comentario || "—"}</span>
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

export default function RegistroServicio() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();

        return (
            rol === "administrador" ||
            permisos.includes("CRM_DIGITALES") ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [encuestas, setEncuestas] = useState([]);
    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });
    const [sort, setSort] = useState({ key: "creado", dir: "desc" });

    const [openModal, setOpenModal] = useState(false);
    const [detalle, setDetalle] = useState(null);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiServicio.list();
            setEncuestas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setEncuestas([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const dealers = useMemo(() => {
        const set = new Set(
            (encuestas || []).map((item) => normalizeStr(item.agencia)).filter(Boolean)
        );
        const all = ["Todos", ...Array.from(set)];

        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return all;
    }, [encuestas, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();

        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (encuestas || []).filter((item) => {
            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) {
                return false;
            }

            const matchQ =
                !q ||
                normalizeStr(item.agencia).toLowerCase().includes(q) ||
                normalizeStr(item.nombre_OS_cliente).toLowerCase().includes(q) ||
                normalizeStr(item.asesor_atendio).toLowerCase().includes(q) ||
                normalizeStr(item.satisfaccion_agenda_cita).toLowerCase().includes(q) ||
                normalizeStr(item.comentario).toLowerCase().includes(q) ||
                String(item.satisfaccion_atencion_asesor || "").includes(q) ||
                String(item.percepcion_calidad_precio || "").includes(q) ||
                String(item.satisfaccion_servicio_ryr || "").includes(q);

            const matchAgencia =
                filters.agencia === "Todos" ||
                normalizeStr(item.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;

            if (desdeInt !== null || hastaInt !== null) {
                const ymdCreado = item.creado ? toYMDLocal(item.creado) : "";
                const ymdInt = ymdToInt(ymdCreado);

                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [encuestas, filters, isAdmin, userAgencia]);

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

            if (key === "promedio") {
                return (obtenerPromedio(a) - obtenerPromedio(b)) * mult;
            }

            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();

            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const openDetail = async (row) => {
        if (!row?.id_encuesta) return;

        try {
            setLoadingDetail(true);
            setOpenModal(true);

            const item = await apiServicio.get(row.id_encuesta);

            if (!isAdmin && userAgencia && normalizeStr(item.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDetalle(item);
        } catch (error) {
            console.error(error);
            alert("No se pudo abrir el detalle de la encuesta.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        if (loadingDetail) return;
        setOpenModal(false);
        setDetalle(null);
    };

    const resetFilters = () => {
        setFilters({
            q: "",
            agencia: "Todos",
            rangoDesde: "",
            rangoHasta: "",
        });
    };

    const setHoy = () => {
        const hoy = toYMDLocal(new Date());
        setFilters((prev) => ({
            ...prev,
            rangoDesde: hoy,
            rangoHasta: hoy,
        }));
    };

    const promedioDetalle = detalle ? obtenerPromedio(detalle) : 0;

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">
                        Registro de Encuestas de Servicio
                    </h2>

                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencia}</span>
                        </p>
                    ) : null}
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
                                    placeholder="Buscar por dealer, cliente/OS, asesor, agenda o comentario..."
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]"
                                />
                                {filters.q ? (
                                    <button
                                        onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                                        className="rounded-lg p-1 bg-white text-[#131E5C] hover:bg-white/80 hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Dealer">
                            <select
                                value={filters.agencia}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, agencia: e.target.value }))
                                }
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

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                                    title="Mostrar solo registros del día de hoy"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>

                                <button
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] px-3 py-2 text-sm font-semibold bg-white text-[#131E5C] hover:text-white hover:bg-[#131E5C]"
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
                                    setFilters((prev) => ({ ...prev, rangoDesde: e.target.value }))
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
                                    setFilters((prev) => ({ ...prev, rangoHasta: e.target.value }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            <MobileCardList rows={sorted} loading={loadingList} onOpen={openDetail} />

            <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                            <tr>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("creado")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha de Encuesta
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
                                        Dealer
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
                                        onClick={() => toggleSort("nombre_OS_cliente")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Cliente u OS
                                        <span className="opacity-60">
                                            {sort.key === "nombre_OS_cliente" ? (
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

                                <th className="px-4 py-3">Asesor Atendió</th>
                                <th className="px-4 py-3">Satisfacción para Agendar Cita</th>
                                <th className="px-4 py-3">Atención de Asesor</th>
                                <th className="px-4 py-3">Percepción Calidad Precio</th>
                                <th className="px-4 py-3">Satisfacción Servicio</th>
                                <th className="px-4 py-3">Comentario</th>
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
                                    {sorted.map((row) => {
                                        const promedio = obtenerPromedio(row);

                                        return (
                                            <tr
                                                key={row.id_encuesta}
                                                onDoubleClick={() => openDetail(row)}
                                                className="cursor-pointer hover:bg-white/[0.04]"
                                                title="Doble clic para ver detalle"
                                            >
                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    {row.creado ? toDTLocal(row.creado).replace("T", " ") : "—"}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-[#131E5C]">
                                                    {row.agencia || "—"}
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C] font-bold">
                                                    {row.nombre_OS_cliente || "—"}
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    {row.asesor_atendio || "—"}
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <ScorePill value={row.satisfaccion_agenda_cita} />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <ScorePill value={row.satisfaccion_atencion_asesor} />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <ScorePill value={row.percepcion_calidad_precio} />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <ScorePill value={row.satisfaccion_servicio_ryr} />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <span className="line-clamp-2">{row.comentario || "—"}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-10 text-center text-[#131E5C]">
                                                No hay resultados con esos filtros.
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
                    detalle?.id_encuesta
                        ? `Detalle de Encuesta de Servicio • ${detalle.id_encuesta}`
                        : "Detalle de Encuesta de Servicio"
                }
                onClose={closeModal}
                footer={
                    <button
                        onClick={closeModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#131E5C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#131E5C]/90"
                    >
                        <X className="h-4 w-4" />
                        Cerrar
                    </button>
                }
            >
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !detalle ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Fecha de encuesta" icon={CalendarDays}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.creado ? toDTLocal(detalle.creado).replace("T", " ") : "—"}
                            </div>
                        </Field>

                        <Field label="Dealer" icon={Building2}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.agencia || "—"}
                            </div>
                        </Field>

                        <Field label="Nombre del cliente u OS" icon={User}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.nombre_OS_cliente || "—"}
                            </div>
                        </Field>

                        <Field label="Asesor atendió" icon={UserStar}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.asesor_atendio || "—"}
                            </div>
                        </Field>

                        <Field label="Satisfacción para Agendar Cita" icon={ClipboardList}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.satisfaccion_agenda_cita || "—"} / 5
                            </div>
                        </Field>

                        <Field label="Satisfacción Atención Asesor" icon={Star}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.satisfaccion_atencion_asesor || "—"} / 5
                            </div>
                        </Field>

                        <Field label="Percepción Calidad Precio" icon={Star}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.percepcion_calidad_precio || "—"} / 5
                            </div>
                        </Field>

                        <Field label="Satisfacción Servicio" icon={Star}>
                            <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                {detalle.satisfaccion_servicio_ryr || "—"} / 5
                            </div>
                        </Field>

                        <div className="md:col-span-1">
                            <Field label="Comentario" icon={MessageSquareText}>
                                <div className="min-h-[110px] rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">
                                    {detalle.comentario || "Sin comentario."}
                                </div>
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}