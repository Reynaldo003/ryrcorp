import { useEffect, useMemo, useState } from "react";
import {
    ArrowUpDown,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    FileText,
    Loader2,
    Plus,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { createPortal } from "react-dom";

import { useAuth } from "../../auth/AuthContext";
import { apiLong } from "../../lib/apiLong";

const BRAND_BLUE = "#131E5C";

const CONCESIONARIO_POR_AGENCIA = {
    "vw cordoba": "2923",
    "vw córdoba": "2923",
    "vw orizaba": "2924",
};

const NOMBRE_CONCESIONARIO = {
    "2923": "VW Córdoba",
    "2924": "VW Orizaba",
};

const LONG_DRIVE_FIELDS = [
    { key: "requiere_factura", label: "Requiere factura" },
    { key: "forma_pago", label: "Forma de pago" },
    { key: "numero_certificado", label: "Número de certificado" },
    { key: "compania", label: "Compañía" },
    { key: "numero_contrato", label: "Número de contrato" },
    { key: "numero_cliente", label: "Número del cliente" },
    { key: "modelo", label: "Modelo" },
    { key: "version", label: "Versión" },
    { key: "clave_comercial", label: "Clave Comercial" },
    { key: "numero_serie", label: "Número de serie" },
    { key: "concesionario", label: "Concesionario" },
    { key: "fecha_creacion", label: "Fecha de creación", type: "datetime-local" },
    { key: "fecha_saga", label: "Fecha SAGA", type: "date" },
    { key: "precio_sin_iva", label: "Precio sin IVA", type: "number", step: "0.01" },
    { key: "precio_con_iva", label: "Precio con IVA", type: "number", step: "0.01" },
    { key: "cobertura", label: "Cobertura" },
    { key: "tipo_cliente", label: "Tipo de cliente" },
    { key: "nombre_razon_social", label: "Nombre / Razón social" },
    { key: "fecha_nacimiento_constitucion", label: "Fecha de nacimiento / Fecha de constitución", type: "date" },
    { key: "nacionalidad", label: "Nacionalidad" },
    { key: "pais_nacimiento_constitucion", label: "País de nacimiento / País de constitución" },
    { key: "genero", label: "Género" },
    { key: "rfc", label: "RFC" },
    { key: "regimen_fiscal", label: "Régimen fiscal" },
    { key: "calle_numero", label: "Calle, Número Int e Núm Ext" },
    { key: "codigo_postal", label: "Código postal" },
    { key: "colonia", label: "Colonia" },
    { key: "municipio_delegacion", label: "Municipio / Delegación" },
    { key: "entidad_federativa_estado", label: "Entidad federativa / Estado" },
    { key: "estatus_certificado", label: "Estatus del certificado" },
    { key: "estatus_pago", label: "Estatus de pago" },
    { key: "terminos_condiciones", label: "Términos y condiciones" },
    { key: "aviso_privacidad", label: "Aviso de privacidad" },
    { key: "autorizacion_cargo_cuenta_bancaria", label: "Autorización cargo a cuenta bancaria" },
    { key: "estatus_link_openpay", label: "Estatus de link Openpay" },
    { key: "estatus_pago_openpay", label: "Estatus de pago Openpay" },
    { key: "fecha_pago_openpay", label: "Fecha de pago Openpay" },
    { key: "meses_sin_intereses", label: "Meses sin intereses" },
    { key: "condicion", label: "Condición" },
    { key: "marca", label: "Marca" },
    { key: "anio", label: "Año", type: "number", step: "1" },
    { key: "kilometraje", label: "Kilometraje", type: "number", step: "1" },
    { key: "tipo_uso", label: "Tipo de uso" },
    { key: "motor", label: "Motor" },
    { key: "uso_cfdi", label: "Uso de CFDI" },
    { key: "correo_electronico", label: "Correo electrónico", type: "email" },
    { key: "telefono_celular", label: "Teléfono celular" },
    { key: "primer_nombre_usuario_1", label: "Primer nombre usuario 1" },
    { key: "segundo_nombre_usuario_1", label: "Segundo nombre usuario 1" },
    { key: "apellido_paterno_usuario_1", label: "Apellido paterno usuario 1" },
    { key: "apellido_materno_usuario_1", label: "Apellido materno usuario 1" },
    { key: "correo_electronico_usuario_1", label: "Correo electrónico usuario 1", type: "email" },
    { key: "primer_nombre_usuario_2", label: "Primer nombre usuario 2" },
    { key: "segundo_nombre_usuario_2", label: "Segundo nombre usuario 2" },
    { key: "apellido_paterno_usuario_2", label: "Apellido paterno usuario 2" },
    { key: "apellido_materno_usuario_2", label: "Apellido materno usuario 2" },
    { key: "correo_electronico_usuario_2", label: "Correo electrónico usuario 2", type: "email" },
    { key: "primer_nombre_representante_legal", label: "Primer nombre representante legal" },
    { key: "segundo_nombre_representante_legal", label: "Segundo nombre representante legal" },
    { key: "apellido_paterno_representante_legal", label: "Apellido paterno representante legal" },
    { key: "apellido_materno_representante_legal", label: "Apellido materno representante legal" },
    { key: "fecha_nacimiento_representante_legal", label: "Fecha de nacimiento representante legal", type: "date" },
];

const FIELD_BY_KEY = Object.fromEntries(LONG_DRIVE_FIELDS.map((field) => [field.key, field]));

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizarAgencia(value) {
    return normalizeStr(value).toLowerCase();
}

function nombreConcesionario(value) {
    const code = normalizeStr(value);
    return NOMBRE_CONCESIONARIO[code] ? `${code} · ${NOMBRE_CONCESIONARIO[code]}` : code || "—";
}

function toDTLocal(value) {
    if (!value) return "";
    const s = String(value);

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !s.endsWith("Z")) {
        return s.slice(0, 16);
    }

    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toYMD(value) {
    if (!value) return "";
    const s = String(value);

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function ymdToInt(value) {
    const ymd = toYMD(value);
    return ymd ? Number(ymd.replaceAll("-", "")) : null;
}

function formatCell(field, value) {
    if (value === null || value === undefined || value === "") return "—";

    if (field.key === "concesionario") return nombreConcesionario(value);

    if (field.type === "datetime-local") {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("es-MX");
    }

    if (field.type === "date") {
        const ymd = toYMD(value);
        if (!ymd) return String(value);
        const [year, month, day] = ymd.split("-");
        return `${day}/${month}/${year}`;
    }

    if (field.key === "precio_sin_iva" || field.key === "precio_con_iva") {
        const number = Number(value);
        if (!Number.isFinite(number)) return String(value);
        return number.toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN",
        });
    }

    return String(value);
}

function emptyDraft(concesionario = "") {
    const draft = { id: null };

    LONG_DRIVE_FIELDS.forEach(({ key }) => {
        draft[key] = key === "concesionario" ? concesionario : "";
    });

    return draft;
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0 truncate text-base font-extrabold text-white">{title}</div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[76vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-3">
            <div className="mb-2 text-xs font-extrabold text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div
            className="fixed z-[9999]"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(event) => event.stopPropagation()}
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
        document.body,
    );
}

function MobileCardList({ rows, loading, onEdit, onContext }) {
    if (loading) {
        return (
            <div className="grid gap-3 lg:hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-40 animate-pulse rounded-lg bg-slate-200" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-3 lg:hidden">
            {rows.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center text-[#131E5C]">
                    No hay resultados con esos filtros.
                </div>
            ) : (
                rows.map((row) => (
                    <div
                        key={row.id}
                        onClick={() => onEdit(row)}
                        onContextMenu={(event) => onContext(event, row)}
                        className="cursor-pointer rounded-lg border border-black/10 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-extrabold text-[#131E5C]">
                                    {row.nombre_razon_social || "Sin nombre"}
                                </div>
                                <div className="mt-1 text-xs font-semibold text-slate-500">
                                    Certificado: {row.numero_certificado || "—"}
                                </div>
                            </div>

                            <div className="text-right text-xs font-bold text-[#131E5C]">
                                {nombreConcesionario(row.concesionario)}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs text-slate-600">
                            <div><span className="font-bold">Serie:</span> {row.numero_serie || "—"}</div>
                            <div><span className="font-bold">Vehículo:</span> {[row.modelo, row.version].filter(Boolean).join(" · ") || "—"}</div>
                            <div><span className="font-bold">Cobertura:</span> {row.cobertura || "—"}</div>
                            <div><span className="font-bold">Estatus:</span> {row.estatus_certificado || "—"}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default function RegistroLong() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = normalizeStr(user?.rol).toLowerCase();

        return (
            rol === "administrador" ||
            permisos.includes("CRM_DIGITALES") ||
            permisos.includes("CRM_VENTAS") ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN") ||
            permisos.includes("CRM_CALIDAD")
        );
    }, [user]);

    const userAgencia = normalizeStr(user?.agencia);

    const userConcesionario = useMemo(
        () => CONCESIONARIO_POR_AGENCIA[normalizarAgencia(userAgencia)] || "",
        [userAgencia],
    );

    const [longs, setLongs] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [ctxMenu, setCtxMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        row: null,
    });

    const [sort, setSort] = useState({
        key: "fecha_creacion",
        dir: "desc",
    });

    const [filters, setFilters] = useState({
        q: "",
        concesionario: "Todos",
        rangoDesde: "",
        rangoHasta: "",
    });

    const inputBase = "w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C]";

    const puedeVer = (row) => {
        if (isAdmin) return true;
        if (!userConcesionario) return false;
        return normalizeStr(row?.concesionario) === userConcesionario;
    };

    const refreshList = async () => {
        setLoadingList(true);

        try {
            const data = await apiLong.list();
            setLongs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setLongs([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        refreshList();
    }, []);

    useEffect(() => {
        const closeContext = () => {
            setCtxMenu((previous) => ({
                ...previous,
                open: false,
                row: null,
            }));
        };

        window.addEventListener("click", closeContext);
        window.addEventListener("scroll", closeContext, true);
        window.addEventListener("resize", closeContext);

        return () => {
            window.removeEventListener("click", closeContext);
            window.removeEventListener("scroll", closeContext, true);
            window.removeEventListener("resize", closeContext);
        };
    }, []);

    const dealers = useMemo(() => {
        const values = Array.from(
            new Set(
                longs
                    .map((row) => normalizeStr(row.concesionario))
                    .filter(Boolean),
            ),
        );

        if (!isAdmin) {
            return userConcesionario ? ["Todos", userConcesionario] : ["Todos"];
        }

        return ["Todos", ...values.sort()];
    }, [longs, isAdmin, userConcesionario]);

    const filtered = useMemo(() => {
        const q = normalizeStr(filters.q).toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return longs.filter((row) => {
            if (!puedeVer(row)) return false;

            const matchQ =
                !q ||
                LONG_DRIVE_FIELDS.some(({ key }) =>
                    normalizeStr(row?.[key]).toLowerCase().includes(q),
                );

            const matchConcesionario =
                filters.concesionario === "Todos" ||
                normalizeStr(row.concesionario) === normalizeStr(filters.concesionario);

            let matchRango = true;

            if (desdeInt !== null || hastaInt !== null) {
                const rowDate = ymdToInt(row.fecha_creacion);

                if (rowDate === null) return false;
                if (desdeInt !== null && rowDate < desdeInt) matchRango = false;
                if (hastaInt !== null && rowDate > hastaInt) matchRango = false;
            }

            return matchQ && matchConcesionario && matchRango;
        });
    }, [longs, filters, isAdmin, userConcesionario]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const field = FIELD_BY_KEY[sort.key];
        const multiplier = sort.dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            const av = a?.[sort.key];
            const bv = b?.[sort.key];

            if (field?.type === "number") {
                return ((Number(av) || 0) - (Number(bv) || 0)) * multiplier;
            }

            if (field?.type === "date" || field?.type === "datetime-local") {
                const at = av ? new Date(av).getTime() : 0;
                const bt = bv ? new Date(bv).getTime() : 0;
                return (at - bt) * multiplier;
            }

            return normalizeStr(av).localeCompare(
                normalizeStr(bv),
                "es",
                { sensitivity: "base" },
            ) * multiplier;
        });
    }, [filtered, sort]);

    const toggleSort = (key) => {
        setSort((previous) => {
            if (previous.key !== key) return { key, dir: "asc" };
            return {
                key,
                dir: previous.dir === "asc" ? "desc" : "asc",
            };
        });
    };

    const resetFilters = () => {
        setFilters({
            q: "",
            concesionario: "Todos",
            rangoDesde: "",
            rangoHasta: "",
        });
    };

    const setHoy = () => {
        const hoy = toYMD(new Date());
        setFilters((previous) => ({
            ...previous,
            rangoDesde: hoy,
            rangoHasta: hoy,
        }));
    };

    const openCreate = () => {
        if (!isAdmin && !userConcesionario) {
            alert("Tu agencia no tiene un concesionario Long Drive configurado.");
            return;
        }

        setMode("create");
        setDraft(emptyDraft(userConcesionario));
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;

        if (!puedeVer(row)) {
            alert("No tienes permisos para ver este registro.");
            return;
        }

        setMode("edit");
        setLoadingDetail(true);
        setOpenModal(true);

        try {
            const data = await apiLong.get(row.id);

            if (!puedeVer(data)) {
                alert("No tienes permisos para ver este registro.");
                setOpenModal(false);
                return;
            }

            const next = { id: data.id };

            LONG_DRIVE_FIELDS.forEach((field) => {
                const raw = data?.[field.key];

                if (field.type === "datetime-local") {
                    next[field.key] = toDTLocal(raw);
                } else if (field.type === "date") {
                    next[field.key] = toYMD(raw);
                } else {
                    next[field.key] = raw ?? "";
                }
            });

            setDraft(next);
        } catch (error) {
            console.error(error);
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

    const save = async () => {
        if (!draft || saving) return;

        if (!isAdmin && !userConcesionario) {
            alert("Tu agencia no tiene un concesionario Long Drive configurado.");
            return;
        }

        setSaving(true);

        try {
            const payload = {};

            LONG_DRIVE_FIELDS.forEach((field) => {
                let value = draft[field.key];

                if (field.key === "concesionario" && !isAdmin) {
                    value = userConcesionario;
                }

                if (field.type === "number") {
                    value = value === "" || value === null || value === undefined
                        ? null
                        : Number(value);
                } else if (field.type === "date" || field.type === "datetime-local") {
                    value = normalizeStr(value) || null;
                } else {
                    value = value ?? "";
                }

                payload[field.key] = value;
            });

            if (mode === "create") {
                await apiLong.create(payload);
            } else {
                await apiLong.update(draft.id, payload);
            }

            await refreshList();
            closeModal();
        } catch (error) {
            console.error(error);
            alert("Error guardando el registro Long Drive.");
        } finally {
            setSaving(false);
        }
    };

    const eliminarLong = async (row) => {
        if (!row?.id) return;

        if (!puedeVer(row)) {
            alert("No tienes permisos para eliminar este registro.");
            return;
        }

        const referencia =
            row.numero_certificado ||
            row.numero_serie ||
            row.nombre_razon_social ||
            "registro";

        if (!confirm(`¿Eliminar ${referencia}?`)) return;

        try {
            await apiLong.remove(row.id);
            setLongs((previous) => previous.filter((item) => item.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (error) {
            console.error(error);
            alert("No se pudo eliminar el registro.");
        }
    };

    const onRowContextMenu = (event, row) => {
        event.preventDefault();
        event.stopPropagation();

        setCtxMenu({
            open: true,
            x: event.clientX,
            y: event.clientY,
            row,
        });
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">
                        Long Drive
                    </h2>

                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}
                            <span className="text-[#131E5C]">{userAgencia}</span>
                            {userConcesionario ? ` · Concesionario ${userConcesionario}` : ""}
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Drive
                </button>
            </div>

            {!isAdmin && userAgencia && !userConcesionario ? (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    La agencia {userAgencia} todavía no tiene un código de concesionario Long Drive configurado.
                </div>
            ) : null}

            <div className="mb-4 rounded-lg border border-black/10 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />

                                <input
                                    value={filters.q}
                                    onChange={(event) =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            q: event.target.value,
                                        }))
                                    }
                                    placeholder="Certificado, cliente, serie, modelo, RFC, cobertura..."
                                    className="w-full text-sm text-[#131E5C] outline-none placeholder:text-slate-400"
                                />

                                {filters.q ? (
                                    <button
                                        onClick={() =>
                                            setFilters((previous) => ({
                                                ...previous,
                                                q: "",
                                            }))
                                        }
                                        className="rounded-lg p-1 text-[#131E5C] hover:text-red-500"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Concesionario">
                            <select
                                value={filters.concesionario}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
                                        concesionario: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            >
                                {dealers.map((dealer) => (
                                    <option key={dealer} value={dealer}>
                                        {dealer === "Todos" ? "Todos" : nombreConcesionario(dealer)}
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
                        <FilterBlock label="Desde · Fecha de creación">
                            <input
                                type="date"
                                value={filters.rangoDesde}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
                                        rangoDesde: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta · Fecha de creación">
                            <input
                                type="date"
                                value={filters.rangoHasta}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
                                        rangoHasta: event.target.value,
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
                onEdit={openEdit}
                onContext={onRowContextMenu}
            />

            <div className="hidden overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg lg:block">
                <div className="max-h-[68vh] overflow-auto">
                    <table className="min-w-max text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-[#131E5C] font-vw-header text-white">
                            <tr>
                                {LONG_DRIVE_FIELDS.map((field) => (
                                    <th
                                        key={field.key}
                                        className="whitespace-nowrap border-r border-white/10 px-3 py-3"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleSort(field.key)}
                                            className="inline-flex items-center gap-1 font-bold"
                                        >
                                            {field.label}

                                            <span className="opacity-70">
                                                {sort.key === field.key ? (
                                                    sort.dir === "asc" ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-4 w-4" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-black/10">
                            {loadingList ? (
                                <tr>
                                    <td
                                        colSpan={LONG_DRIVE_FIELDS.length}
                                        className="px-4 py-12 text-center text-[#131E5C]"
                                    >
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        <div className="mt-2 font-bold">Cargando Long Drive...</div>
                                    </td>
                                </tr>
                            ) : sorted.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={LONG_DRIVE_FIELDS.length}
                                        className="px-4 py-12 text-center font-semibold text-[#131E5C]"
                                    >
                                        No hay resultados con esos filtros.
                                    </td>
                                </tr>
                            ) : (
                                sorted.map((row) => (
                                    <tr
                                        key={row.id}
                                        onDoubleClick={() => openEdit(row)}
                                        onContextMenu={(event) => onRowContextMenu(event, row)}
                                        className="cursor-pointer hover:bg-slate-50"
                                        title="Doble clic para editar"
                                    >
                                        {LONG_DRIVE_FIELDS.map((field) => (
                                            <td
                                                key={field.key}
                                                className="max-w-[300px] whitespace-nowrap border-r border-black/5 px-3 py-2 text-[#131E5C]"
                                                title={normalizeStr(row?.[field.key])}
                                            >
                                                <div className="max-w-[300px] truncate">
                                                    {formatCell(field, row?.[field.key])}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <ContextMenu
                        ctxMenu={ctxMenu}
                        onDelete={eliminarLong}
                        onClose={() =>
                            setCtxMenu({
                                open: false,
                                x: 0,
                                y: 0,
                                row: null,
                            })
                        }
                    />
                </div>
            </div>

            <Modal
                open={openModal}
                title={
                    mode === "create"
                        ? "Nuevo Long Drive"
                        : `Editar Long Drive · ${draft?.numero_certificado || draft?.numero_serie || draft?.id || ""}`
                }
                onClose={closeModal}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            onClick={save}
                            disabled={saving || loadingDetail}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C]/85 disabled:opacity-60"
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
                    <div className="flex min-h-52 items-center justify-center text-[#131E5C]">
                        <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                ) : !draft ? null : (
                    <>
                        <div className="mb-4 rounded-lg border border-[#131E5C]/15 bg-[#131E5C]/5 px-4 py-3 text-xs font-semibold text-[#131E5C]">
                            Formato Long Drive de 62 campos. La tabla y este formulario siguen la estructura de los reportes nuevos.
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {LONG_DRIVE_FIELDS.map((field) => (
                                <Field key={field.key} label={field.label}>
                                    {field.key === "concesionario" ? (
                                        <select
                                            value={draft.concesionario || ""}
                                            disabled={!isAdmin}
                                            onChange={(event) =>
                                                setDraft((previous) => ({
                                                    ...previous,
                                                    concesionario: event.target.value,
                                                }))
                                            }
                                            className={[
                                                inputBase,
                                                !isAdmin ? "cursor-not-allowed opacity-70" : "",
                                            ].join(" ")}
                                        >
                                            <option value="">Selecciona un concesionario...</option>
                                            <option value="2923">2923 · VW Córdoba</option>
                                            <option value="2924">2924 · VW Orizaba</option>
                                        </select>
                                    ) : (
                                        <div className="relative">
                                            {field.key === "numero_serie" ? (
                                                <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            ) : null}

                                            <input
                                                type={field.type || "text"}
                                                step={field.step}
                                                value={draft[field.key] ?? ""}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        [field.key]: event.target.value,
                                                    }))
                                                }
                                                className={[
                                                    inputBase,
                                                    field.key === "numero_serie" ? "pl-9" : "",
                                                ].join(" ")}
                                            />
                                        </div>
                                    )}
                                </Field>
                            ))}
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
