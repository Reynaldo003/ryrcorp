import { useMemo, useState, useEffect } from "react";
import {
    Plus,
    Search,
    X,
    Save,
    User,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Trash2,
    Loader2,
    Phone,
    Building2,
    CalendarDays,
    Mail,
    CarFront,
    FileText,
    LayoutList,
    Check,
} from "lucide-react";
import { apiLong } from "../../lib/apiLong";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

function normalizeStr(v) {
    return String(v ?? "").trim();
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
            <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-slate-200/60" /></td>
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
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

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function InlineSelect({ value, options, disabled, onChange, saving }) {
    return (
        <div className="flex items-center gap-2">
            <select
                value={value || ""}
                disabled={disabled || saving}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-[#131E5C]/20 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none"
            >
                <option value="">Selecciona...</option>
                {options.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </select>

            {saving ? <Loader2 className="h-4 w-4 animate-spin text-[#131E5C]" /> : <Check className="h-4 w-4 text-emerald-600" />}
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
                            <div key={i} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="mt-3 h-4 w-28" />
                                <Skeleton className="mt-3 h-4 w-56" />
                                <Skeleton className="mt-3 h-4 w-40" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                            const nombreCliente = row?.cliente?.nombre || "—";
                            const telCliente = row?.cliente?.telefono || "—";
                            const fechaEntrega = row.fecha_entrega ? toDTLocal(row.fecha_entrega).replace("T", " ") : "—";

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
                                                <span className="truncate">{fechaEntrega}</span>
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
                                            <span className="truncate">{nombreCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Phone className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{telCliente}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <FileText className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.chasis || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CarFront className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.producto_long_drive || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <LayoutList className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.tipo_venta || "—"}</span>
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

export default function RegistroLong() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("CRM_VENTAS") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN") || permisos.includes("CRM_CALIDAD");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [longs, setLongs] = useState([]);

    const DEALERS = useMemo(
        () => ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan",],
        []
    );

    const PRODUCTOS_LONG_DRIVE = [
        "Long Drive",
        "Long Drive Desgaste",
        "Long Drive Plus",
    ];

    const TIPOS_VENTA = [
        "Voluntario",
        "Mandatorio",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [savingInline, setSavingInline] = useState({});

    const [sort, setSort] = useState({ key: "fecha_entrega", dir: "desc" });
    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const [filters, setFilters] = useState(() => ({
        q: "",
        agencia: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    }));

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const REQUIRED = useMemo(
        () => ({
            cliente_telefono: "Teléfono",
            chasis: "Chasis",
            producto_long_drive: "Producto Long Drive",
            tipo_venta: "Tipo Venta",
        }),
        []
    );

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

    const renderRequiredError = (key) => {
        if (!isInvalid(key)) return null;
        return (
            <div className="mt-2 text-xs font-bold text-red-600">
                {REQUIRED[key]} es requerido.
            </div>
        );
    };

    const telDigits = useMemo(
        () => String(draft?.cliente_telefono || "").replace(/\D/g, ""),
        [draft?.cliente_telefono]
    );

    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);

    const telError = useMemo(() => {
        if (!openModal) return "";
        if (!draft) return "";
        if (!telDigits) return "";

        if (/^\d{10}$/.test(telDigits)) return "";
        if (/^52\d{10}$/.test(telDigits)) return "";

        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) {
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        }
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
        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiLong.list();
            setLongs(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setLongs([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    const dealers = useMemo(() => {
        const set = new Set((longs || []).map((c) => normalizeStr(c.agencia)).filter(Boolean));
        const all = ["Todos", ...Array.from(set)];
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return all;
    }, [longs, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();

        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        const minInt = desdeInt ?? null;
        const maxInt = hastaInt ?? null;

        return (longs || []).filter((c) => {
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) return false;

            const nombreCliente = normalizeStr(c?.cliente?.nombre);
            const telCliente = normalizeStr(c?.cliente?.telefono);

            const matchQ =
                !q ||
                normalizeStr(c.agencia).toLowerCase().includes(q) ||
                nombreCliente.toLowerCase().includes(q) ||
                telCliente.toLowerCase().includes(q) ||
                normalizeStr(c.chasis).toLowerCase().includes(q) ||
                normalizeStr(c.producto_long_drive).toLowerCase().includes(q) ||
                normalizeStr(c.tipo_venta).toLowerCase().includes(q) ||
                normalizeStr(c?.cliente?.correo).toLowerCase().includes(q);

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(c.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;
            if (minInt !== null || maxInt !== null) {
                const ymdEntrega = c.fecha_entrega ? toYMDLocal(c.fecha_entrega) : "";
                const ymdInt = ymdToInt(ymdEntrega);
                if (!ymdInt) return false;
                if (minInt !== null && ymdInt < minInt) matchRango = false;
                if (maxInt !== null && ymdInt > maxInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [longs, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "creado" || key === "fecha_entrega") {
                const ta = a[key] ? new Date(a[key]).getTime() : 0;
                const tb = b[key] ? new Date(b[key]).getTime() : 0;
                return (ta - tb) * mult;
            }

            if (key === "cliente_nombre") {
                const va = normalizeStr(a?.cliente?.nombre).toLowerCase();
                const vb = normalizeStr(b?.cliente?.nombre).toLowerCase();
                if (va < vb) return -1 * mult;
                if (va > vb) return 1 * mult;
                return 0;
            }

            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        setTouchedSave(false);
        setMode("create");

        const agenciaDefault = isAdmin ? "" : userAgencia;

        setDraft({
            id: null,
            cliente_id: null,
            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",
            cliente_correo: "",
            chasis: "",
            producto_long_drive: "",
            tipo_venta: "",
            fecha_entrega: "",
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false);
            setMode("edit");
            setLoadingDetail(true);
            setOpenModal(true);

            const c = await apiLong.get(row.id);

            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDraft({
                id: c.id,
                cliente_id: c?.cliente?.id_cliente ?? null,
                agencia: c.agencia || (isAdmin ? "" : userAgencia),
                cliente_nombre: c?.cliente?.nombre || "",
                cliente_telefono: c?.cliente?.telefono || "",
                cliente_correo: c?.cliente?.correo || "",
                chasis: c.chasis || "",
                producto_long_drive: c.producto_long_drive || "",
                tipo_venta: c.tipo_venta || "",
                fecha_entrega: toDTLocal(c.fecha_entrega),
            });
        } catch (e) {
            console.error(e);
            alert("No se pudo abrir el registro Long Drive.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        if (saving) return;
        setOpenModal(false);
        setDraft(null);
    };

    const eliminarLong = async (row) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const ok = confirm(`¿Eliminar el Long Drive de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`);
        if (!ok) return;

        try {
            await apiLong.remove(row.id);
            setLongs((prev) => prev.filter((c) => c.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            console.error(e);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
    };

    const save = async () => {
        if (!draft || saving) return;

        setTouchedSave(true);

        if (missing.length) return;

        if (!telDigits || !telIsOk) return;

        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;

            const payload = {
                agencia: agenciaFinal,
                ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),
                nombre: draft.cliente_nombre || "",
                telefono: normalizeStr(draft.cliente_telefono),
                correo: draft.cliente_correo || "",
                chasis: draft.chasis || "",
                producto_long_drive: draft.producto_long_drive || "",
                tipo_venta: draft.tipo_venta || "",
                fecha_entrega: fromDTLocalToISO(draft.fecha_entrega),
            };

            if (mode === "create") await apiLong.create(payload);
            else await apiLong.update(draft.id, payload);

            await refreshList();
            closeModal();
        } catch (e) {
            console.error(e);
            alert("Error guardando el registro Long Drive.");
        } finally {
            setSaving(false);
        }
    };

    const updateInlineField = async (row, field, value) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para modificar registros de otra agencia.");
            return;
        }

        const id = row.id;
        const prev = row[field] || "";

        setLongs((prevRows) =>
            prevRows.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
        setSavingInline((prevMap) => ({ ...prevMap, [`${id}-${field}`]: true }));

        try {
            await apiLong.patch(id, { [field]: value });
        } catch (e) {
            console.error(e);
            setLongs((prevRows) =>
                prevRows.map((item) => (item.id === id ? { ...item, [field]: prev } : item))
            );
            alert(`No se pudo actualizar ${field}.`);
        } finally {
            setSavingInline((prevMap) => {
                const next = { ...prevMap };
                delete next[`${id}-${field}`];
                return next;
            });
        }
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });

    const setHoy = () => {
        const hoy = toYMDLocal(new Date());
        setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy }));
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Long Drive</h2>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencia}</span>
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Drive
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
                                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                    placeholder="Buscar por dealer, cliente, teléfono, chasis, producto..."
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]"
                                />
                                {filters.q ? (
                                    <button
                                        onClick={() => setFilters((p) => ({ ...p, q: "" }))}
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
                                onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {dealers.map((d) => (
                                    <option key={d} value={d} className="bg-neutral-100 text-[#131E5C]">
                                        {d}
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
                                onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))}
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
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

            <MobileCardList
                rows={sorted}
                loading={loadingList}
                onEdit={openEdit}
                onContext={onRowContextMenu}
            />

            <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                            <tr>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("fecha_entrega")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha de Entrega
                                        <span className="opacity-60">
                                            {sort.key === "fecha_entrega" ? (
                                                sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />
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
                                                sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />
                                            ) : (
                                                <ArrowUpDown className="h-4" />
                                            )}
                                        </span>
                                    </button>
                                </th>

                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("cliente_nombre")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Cliente
                                        <span className="opacity-60">
                                            {sort.key === "cliente_nombre" ? (
                                                sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />
                                            ) : (
                                                <ArrowUpDown className="h-4" />
                                            )}
                                        </span>
                                    </button>
                                </th>

                                <th className="px-4 py-3">Chasis</th>
                                <th className="px-4 py-3">Producto Long Drive</th>
                                <th className="px-4 py-3">Tipo Venta</th>
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
                                        const nombreCliente = row?.cliente?.nombre || "—";

                                        return (
                                            <tr
                                                key={row.id}
                                                onDoubleClick={() => openEdit(row)}
                                                onContextMenu={(e) => onRowContextMenu(e, row)}
                                                className="cursor-pointer hover:bg-white/[0.04]"
                                                title="Doble clic para editar"
                                            >
                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    {row.fecha_entrega ? toDTLocal(row.fecha_entrega).replace("T", " ") : "—"}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>
                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <div className="font-bold">{nombreCliente}</div>
                                                </td>
                                                <td className="px-4 py-3 text-[#131E5C]">{row.chasis || "—"}</td>

                                                <td className="px-4 py-3 text-[#131E5C] min-w-[220px]">
                                                    <InlineSelect
                                                        value={row.producto_long_drive}
                                                        options={PRODUCTOS_LONG_DRIVE}
                                                        saving={!!savingInline[`${row.id}-producto_long_drive`]}
                                                        onChange={(value) => updateInlineField(row, "producto_long_drive", value)}
                                                    />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C] min-w-[180px]">
                                                    <InlineSelect
                                                        value={row.tipo_venta}
                                                        options={TIPOS_VENTA}
                                                        saving={!!savingInline[`${row.id}-tipo_venta`]}
                                                        onChange={(value) => updateInlineField(row, "tipo_venta", value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-[#131E5C]">
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
                            await eliminarLong(row);
                            setCtxMenu({ open: false, x: 0, y: 0, row: null });
                        }}
                        onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                    />
                </div>
            </div>

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo Long Drive" : `Editar Long Drive • ${draft?.id}`}
                onClose={closeModal}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            onClick={save}
                            disabled={saving || loadingDetail || telInvalid || (draft?.cliente_telefono ? !telIsOk : false)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !draft ? null : (
                    <>
                        {touchedSave && missing.length > 0 ? (
                            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                Hay campos obligatorios pendientes por completar.
                            </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-3">
                            <Field label="Dealer" icon={Building2}>
                                <select
                                    value={draft.agencia || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                    disabled={!isAdmin}
                                    className={[inputBase, inputOk, !isAdmin ? "opacity-75 cursor-not-allowed" : ""].join(" ")}
                                >
                                    <option value="" disabled>
                                        Selecciona un dealer...
                                    </option>
                                    {(isAdmin ? DEALERS : userAgencia ? [userAgencia] : DEALERS).map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Nombre del cliente" icon={User}>
                                <input
                                    value={draft.cliente_nombre}
                                    onChange={(e) => setDraft((p) => ({ ...p, cliente_nombre: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                    placeholder="Nombre completo"
                                />
                            </Field>
                            <Field label="Teléfono" icon={Phone}>
                                <input
                                    maxLength={12}
                                    value={draft.cliente_telefono}
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            cliente_telefono: e.target.value.replace(/\D/g, "").slice(0, 12),
                                        }))
                                    }
                                    disabled={mode === "edit" || telIsNormalized}
                                    className={[
                                        inputBase,
                                        (isInvalid("cliente_telefono") || telInvalid) ? inputBad : inputOk,
                                        (mode === "edit" || telIsNormalized) ? "opacity-75 cursor-not-allowed" : "",
                                    ].join(" ")}
                                />
                                {renderRequiredError("cliente_telefono")}

                                {!isInvalid("cliente_telefono") && telError ? (
                                    <div className="mt-2 text-xs font-bold text-red-600">{telError}</div>
                                ) : null}
                            </Field>
                            <Field label="Correo" icon={Mail}>
                                <input
                                    type="email"
                                    value={draft.cliente_correo}
                                    onChange={(e) => setDraft((p) => ({ ...p, cliente_correo: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                    placeholder="correo@dominio.com"
                                />
                            </Field>
                            <Field label="Chasis" icon={FileText}>
                                <input
                                    value={draft.chasis}
                                    onChange={(e) => setDraft((p) => ({ ...p, chasis: e.target.value }))}
                                    className={[inputBase, isInvalid("chasis") ? inputBad : inputOk].join(" ")}
                                    placeholder="Número de chasis"
                                />
                                {renderRequiredError("chasis")}
                            </Field>
                            <Field label="Producto Long Drive" icon={CarFront}>
                                <select
                                    value={draft.producto_long_drive || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, producto_long_drive: e.target.value }))}
                                    className={[inputBase, isInvalid("producto_long_drive") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un producto...</option>
                                    {PRODUCTOS_LONG_DRIVE.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("producto_long_drive")}
                            </Field>
                            <Field label="Tipo Venta" icon={LayoutList}>
                                <select
                                    value={draft.tipo_venta || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, tipo_venta: e.target.value }))}
                                    className={[inputBase, isInvalid("tipo_venta") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un tipo...</option>
                                    {TIPOS_VENTA.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("tipo_venta")}
                            </Field>
                            <Field label="Fecha de Entrega" icon={CalendarDays}>
                                <input
                                    type="datetime-local"
                                    value={draft.fecha_entrega}
                                    onChange={(e) => setDraft((p) => ({ ...p, fecha_entrega: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                />
                            </Field>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}