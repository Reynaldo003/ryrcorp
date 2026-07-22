import { useMemo, useState, useEffect, useCallback } from "react";
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
    Mail,
    MessageSquareText,
    Building2,
    UserSearch,
    UserStar,
    CreditCard,
    Wallet,
    BadgeDollarSign,
    Check,
} from "lucide-react";
import { apiCredito } from "../../lib/apiCredito";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

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
            <td className="px-4 py-3">
                <div className="h-4 w-36 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-28 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-4 w-28 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-40 rounded bg-slate-200/60" />
            </td>
            <td className="px-4 py-3">
                <div className="h-8 w-40 rounded bg-slate-200/60" />
            </td>
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

function InlineInput({ value, saving, onChange, onBlur, onKeyDown, placeholder = "" }) {
    return (
        <div className="flex items-center gap-2 min-w-[180px]">
            <input
                value={value}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="w-full rounded-lg border border-[#131E5C]/20 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none"
            />
            {saving ? <Loader2 className="h-4 w-4 animate-spin text-[#131E5C]" /> : <Check className="h-4 w-4 text-emerald-600" />}
        </div>
    );
}

function InlineSelect({ value, options, saving, onChange }) {
    return (
        <div className="flex items-center gap-2 min-w-[180px]">
            <select
                value={value || ""}
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
                                <Skeleton className="mt-4 h-8 w-24 rounded-full" />
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
                            const fecha = row.creado ? toDTLocal(row.creado).replace("T", " ") : "—";

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
                                                <span className="truncate">{fecha}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Building2 className="h-4 w-4" />
                                                <span className="truncate">{row.agencia || "—"}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                            {row.estado_financiamiento || "Sin estado"}
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
                                            <CreditCard className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.id_soli_cred || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <CarFront className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.auto_interes || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <UserStar className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.asesor_ventas || "—"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <BadgeDollarSign className="h-4 w-4 text-[#131E5C]" />
                                            <span className="truncate">{row.estado_compra || "—"}</span>
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

export default function RegistroCredito() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const permisos = user?.permisos || [];
    const rol = String(user?.rol || "").trim().toLowerCase();

    const isAdmin = useMemo(() => {
        return (
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [rol, permisos]);

    const canAccessCredito = useMemo(() => {
        return isAdmin || permisos.includes("CRM_FINANCIEROS") || permisos.includes("CRM_VENTAS") || permisos.includes("CRM_CALIDAD");
    }, [isAdmin, permisos]);

    const userAgencias = useMemo(() => {
        return String(user?.agencia || "")
            .split("|")
            .map((agencia) => normalizeStr(agencia))
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

    const [solicitudes, setSolicitudes] = useState([]);
    const [inlineDrafts, setInlineDrafts] = useState({});
    const [savingInline, setSavingInline] = useState({});
    const [authError, setAuthError] = useState("");

    const DEALERS = useMemo(
        () => ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Chirey", "JAECOO R&R"],
        []
    );

    const ASESORES = [
        "AURA MARLIZETH FERNANDEZ LOPEZ",
        "Bianca Isabel Chavez Alarcon",
        "ERENDIRA SANTOS COYOTZI",
        "IRENE DEL CARMEN GUIZA LOPEZ",
        "MARCOS RAUL DIAZ RAMOS",
        "MARIO ALBERTO LOPEZ RAMOS",
        "MARISOL LAGUNES GONZALEZ",
        "NALLELY HERNANDEZ GARCIA",
        "OCTAVIO BRUNO GONZALEZ",
        "ROGELIO VAZQUEZ SANCHEZ",
        "RUBEN ALBERTO TOSQUY ADRIANO",
        "Saja Azzam Mohammad Jamous",
        "SANDRA LUZ PRIETO PEREZ",
        "YAMIL MISAEL RODRIGUEZ AGUILAR",
        "LUIS ALFONSO CORIA MARROQUIN",
        "CANDY DENISSE MARQUEZ CORTES",
        "DELMAR JAVIER ILLESCAS DOMINGUEZ",
        "EDGAR JESUS GOMEZ PEREZ",
        "Valeria Zilli Durante",
        "IDALMY JIMENEZ SANCHEZ",
        "IVAN JUAREZ ORTEGA",
        "JESSICA OLIVARES CAMPOS",
        "JESUS XITLAMA GOMEZ",
        "LIZBETH CANO CLARA",
        "LUIS MANUEL PALOMARES OLAYO",
        "MARIA DEL CARMEN ZAVALA VELAZQUEZ",
        "OMAR VILLIERS MONDRAGON",
        "RUBEN ROMERO VALDES",
        "VERONICA CASTILLO FUENTES",
        "Hector Rodriguez",
        "GEOVANI NAVA DIAZ",
        "ZEILA NAVARRO CONTRERAS",
        "JOSE ALFREDO BARRANCA REYES",
        "ADRIAN GALVEZ ROLDAN",
        "MARIA DE GUADALUPE VANVOLLENHOVEN DIAZ",
        "Marelly Tenorio Salinas",
        "ELIA INES ARANO REYES",
        "JORGE LUIS ALAMILLO RODRIGUEZ",
        "Cesar Ivan Salazar Reyes",
        "Cristian Fernando Rivera Godinez",
        "DULCE ABIGAIL GARCIA OLIVARES",
        "Felix Emmanuel Solis Angeles",
        "GERMAN JARITH SALAZAR MIRANDA",
        "Iris Yazmín Gómez Velázquez",
        "Israel Garcia Juarez",
        "JORGE ANTONIO RODRIGUEZ MARTINEZ",
        "JOSE DE JESUS GARCIA ROMAN",
        "JUAN MANUEL SOBREVILLA VICENCIO",
        "Miguel Capitanachi Paredes",
        "OLIMPIA VAZQUEZ MENDEZ",
        "Roberto Ramses Luna Fajardo",
        "Carlos Arturo Garces Vengas",
        "Edgar Omar Noguera Solis",
        "Javier Perez Meraz",
        "Luis Armando Almora Perez",
        "Mara Erubey Soto Villegas",
        "Sergio Ivan Quintana Martinez",
        "Sergio Rene Delgado Sarmiento",
        "Yoseth Ruiz Castellanos",
        "JOSE ALBERTO SEDAS FLORES",
    ];

    const FUENTE = [
        "Digital",
        "Piso",
        "Tradicional",
    ];

    const VEHICULOS = [
        "Virtus",
        "Polo",
        "Jetta",
        "Jetta GLI",
        "Golf GTI",
        "Taos",
        "Nivus",
        "Taigun",
        "Tiguan",
        "Teramont",
        "Crossport",
        "Saveiro",
        "Amarok",
        "Seminuevos",
        "Tera",
        "Avaluo",
        "Transporter",
        "Caddy",
        "Crafter"
    ];

    const ESTADOS_FINANCIAMIENTO = [
        "En Proceso",
        "Condicionado",
        "Autorizado",
        "No Autorizado",
        "Ejercido",
    ];

    const ESTADOS_COMPRA = [
        "Venta Perdida",
        "En Proceso",
        "Facturada",
        "Entregada",
    ];

    const PRODUCTO_FINANCIERO = [
        "Credito Tradicional",
        "Arrendamiento",
        "Autofinanciamiento",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });

    const [sort, setSort] = useState({ key: "creado", dir: "desc" });
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
            id_soli_cred: "ID Solicitud Credito",
            producto_financiero: "Producto Financiero",
            auto_interes: "Auto Interes",
            canal_origen: "Canal de Origen",
            estado_financiamiento: "Estado Financiamiento",
            estado_compra: "Estado de la Compra",
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
        if (telDigits.length === 12 && !telDigits.startsWith("52"))
            return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
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
    const manejarErrorCredito = useCallback(
        (error, fallbackMessage = "Ocurrió un error en el módulo de crédito.") => {
            console.error(error);

            const message = String(error?.message || "");
            const isSessionExpired =
                error?.code === "SESSION_EXPIRED" ||
                error?.status === 401 ||
                (error?.status === 403 &&
                    /token expirado|token inválido|token invalido|credenciales/i.test(message));

            if (isSessionExpired) {
                setAuthError("Tu sesión expiró o ya no es válida. Inicia sesión nuevamente.");
                setOpenModal(false);
                setDraft(null);
                setCtxMenu({ open: false, x: 0, y: 0, row: null });
                setSolicitudes([]);

                navigate("/login", {
                    replace: true,
                    state: { from: location },
                });
                return;
            }

            alert(message || fallbackMessage);
        },
        [navigate, location]
    );

    const refreshList = useCallback(async () => {
        if (!canAccessCredito) {
            setSolicitudes([]);
            return;
        }

        setLoadingList(true);
        setAuthError("");

        try {
            const data = await apiCredito.list();
            const rows = Array.isArray(data) ? data : [];
            setSolicitudes(rows);

            const nextInline = {};
            rows.forEach((row) => {
                nextInline[row.id] = {
                    id_soli_cred: row.id_soli_cred || "",
                };
            });
            setInlineDrafts(nextInline);
        } catch (e) {
            manejarErrorCredito(e, "No se pudo cargar la lista de solicitudes.");
            setSolicitudes([]);
        } finally {
            setLoadingList(false);
        }
    }, [canAccessCredito, manejarErrorCredito]);

    useEffect(() => {
        refreshList();
    }, [refreshList]);

    const dealers = useMemo(() => {
        const set = new Set((solicitudes || []).map((c) => normalizeStr(c.agencia)).filter(Boolean));
        const all = ["Todos", ...Array.from(set)];
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }
        return all;
    }, [solicitudes, isAdmin, userAgencias]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();

        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        const minInt = desdeInt ?? null;
        const maxInt = hastaInt ?? null;

        return (solicitudes || []).filter((c) => {
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) return false;
            const nombreCliente = normalizeStr(c?.cliente?.nombre);
            const telCliente = normalizeStr(c?.cliente?.telefono);

            const matchQ =
                !q ||
                normalizeStr(c.agencia).toLowerCase().includes(q) ||
                nombreCliente.toLowerCase().includes(q) ||
                telCliente.toLowerCase().includes(q) ||
                normalizeStr(c.id_soli_cred).toLowerCase().includes(q) ||
                normalizeStr(c.producto_financiero).toLowerCase().includes(q) ||
                normalizeStr(c.auto_interes).toLowerCase().includes(q) ||
                normalizeStr(c.canal_origen).toLowerCase().includes(q) ||
                normalizeStr(c.asesor_ventas).toLowerCase().includes(q) ||
                normalizeStr(c.estado_financiamiento).toLowerCase().includes(q) ||
                normalizeStr(c.estado_compra).toLowerCase().includes(q) ||
                normalizeStr(c.comentarios).toLowerCase().includes(q);

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(c.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;
            if (minInt !== null || maxInt !== null) {
                const ymdCreado = c.creado ? toYMDLocal(c.creado) : "";
                const ymdInt = ymdToInt(ymdCreado);
                if (!ymdInt) return false;
                if (minInt !== null && ymdInt < minInt) matchRango = false;
                if (maxInt !== null && ymdInt > maxInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [solicitudes, filters, isAdmin, userAgencias, userTieneAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "creado" || key === "fecha_respuesta") {
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

        const agenciaDefault = isAdmin ? "" : userAgencias[0] || "";

        setDraft({
            id: null,
            cliente_id: null,

            agencia: agenciaDefault,
            cliente_nombre: "",
            cliente_telefono: "",
            cliente_correo: "",

            id_soli_cred: "",
            producto_financiero: "",
            plazo_meses: "",
            monto_financiero: "",
            auto_interes: "",
            canal_origen: "",
            asesor_ventas: "",
            estado_financiamiento: "",
            estado_compra: "",
            fecha_respuesta: "",
            comentarios: "",
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

            const c = await apiCredito.get(row.id);

            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) {
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

                id_soli_cred: c.id_soli_cred || "",
                producto_financiero: c.producto_financiero || "",
                plazo_meses: c.plazo_meses || "",
                monto_financiero: c.monto_financiero || "",
                auto_interes: c.auto_interes || "",
                canal_origen: c.canal_origen || "",
                asesor_ventas: c.asesor_ventas || "",
                estado_financiamiento: c.estado_financiamiento || "",
                estado_compra: c.estado_compra || "",
                fecha_respuesta: toDTLocal(c.fecha_respuesta),
                comentarios: c.comentarios || "",
            });
        } catch (e) {
            manejarErrorCredito(e, "No se pudo abrir la solicitud.");
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

    const eliminarSolicitud = async (row) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const ok = confirm(`¿Eliminar la solicitud de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`);
        if (!ok) return;

        try {
            await apiCredito.remove(row.id);
            setSolicitudes((prev) => prev.filter((c) => c.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            manejarErrorCredito(e, "No se pudo eliminar la solicitud.");
        }
    };

    const save = async () => {
        if (!draft || saving) return;

        setTouchedSave(true);

        if (missing.length) return;

        if (!telDigits || !telIsOk) return;

        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : normalizeStr(draft.agencia || userAgencia);

            const payload = {
                agencia: agenciaFinal,
                ...(draft.cliente_id ? { cliente_id: draft.cliente_id } : {}),
                nombre: draft.cliente_nombre || "",
                telefono: normalizeStr(draft.cliente_telefono),
                correo: draft.cliente_correo || "",

                id_soli_cred: draft.id_soli_cred || "",
                producto_financiero: draft.producto_financiero || "",
                plazo_meses: draft.plazo_meses || null,
                monto_financiero: draft.monto_financiero || null,
                auto_interes: draft.auto_interes || "",
                canal_origen: draft.canal_origen || "",
                asesor_ventas: draft.asesor_ventas || null,
                estado_financiamiento: draft.estado_financiamiento || "",
                estado_compra: draft.estado_compra || "",
                fecha_respuesta: fromDTLocalToISO(draft.fecha_respuesta),
                comentarios: draft.comentarios || null,
            };

            if (mode === "create") await apiCredito.create(payload);
            else await apiCredito.update(draft.id, payload);

            await refreshList();
            closeModal();
        } catch (e) {
            manejarErrorCredito(e, "Error guardando la solicitud.");
        } finally {
            setSaving(false);
        }
    };
    const updateInlineField = async (row, field, value) => {
        const id = row?.id;
        if (!id) return;

        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para modificar registros de otra agencia.");
            return;
        }

        const prevValue = row[field] || "";

        setSolicitudes((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
        setSavingInline((prev) => ({ ...prev, [`${id}-${field}`]: true }));

        try {
            await apiCredito.patch(id, { [field]: value });
        } catch (e) {
            setSolicitudes((prev) =>
                prev.map((item) => (item.id === id ? { ...item, [field]: prevValue } : item))
            );
            manejarErrorCredito(e, `No se pudo actualizar ${field}.`);
        } finally {
            setSavingInline((prev) => {
                const next = { ...prev };
                delete next[`${id}-${field}`];
                return next;
            });
        }
    };

    const handleInlineIdChange = (id, value) => {
        setInlineDrafts((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                id_soli_cred: value,
            },
        }));
    };

    const commitInlineId = async (row) => {
        const id = row?.id;
        if (!id) return;

        const newValue = inlineDrafts[id]?.id_soli_cred ?? "";
        const currentValue = row.id_soli_cred || "";

        if (newValue === currentValue) return;
        await updateInlineField(row, "id_soli_cred", newValue);
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });

    const setHoy = () => {
        const hoy = toYMDLocal(new Date());
        setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy }));
    };
    if (!canAccessCredito) {
        return (
            <div className="w-full">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                    Tu usuario no tiene permiso para acceder al módulo de servicios financieros.
                </div>
            </div>
        );
    }
    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Solicitudes de Credito</h2>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}<span className="text-[#131E5C]">{userAgencias.join(", ")}</span>
                        </p>
                    ) : null}
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Solicitud
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
                                    placeholder="Buscar por dealer, cliente, teléfono, solicitud, asesor…"
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
                                        onClick={() => toggleSort("creado")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha de Ingreso
                                        <span className="opacity-60">
                                            {sort.key === "creado" ? (
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

                                <th className="px-4 py-3">ID Solicitud Credito</th>
                                <th className="px-4 py-3">Asesor Ventas</th>
                                <th className="px-4 py-3">Estado Financiamiento</th>
                                <th className="px-4 py-3">Estado Compra</th>
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
                                                    {row.creado ? toDTLocal(row.creado).replace("T", " ") : "—"}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <div className="font-bold">{nombreCliente}</div>
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <InlineInput
                                                        value={inlineDrafts[row.id]?.id_soli_cred ?? row.id_soli_cred ?? ""}
                                                        saving={!!savingInline[`${row.id}-id_soli_cred`]}
                                                        placeholder="ID / folio"
                                                        onChange={(e) => handleInlineIdChange(row.id, e.target.value)}
                                                        onBlur={() => commitInlineId(row)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                commitInlineId(row);
                                                            }
                                                        }}
                                                    />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">{row.asesor_ventas || "—"}</td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <InlineSelect
                                                        value={row.estado_financiamiento || ""}
                                                        options={ESTADOS_FINANCIAMIENTO}
                                                        saving={!!savingInline[`${row.id}-estado_financiamiento`]}
                                                        onChange={(value) => updateInlineField(row, "estado_financiamiento", value)}
                                                    />
                                                </td>

                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    <InlineSelect
                                                        value={row.estado_compra || ""}
                                                        options={ESTADOS_COMPRA}
                                                        saving={!!savingInline[`${row.id}-estado_compra`]}
                                                        onChange={(value) => updateInlineField(row, "estado_compra", value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-10 text-center text-[#131E5C]">
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
                            await eliminarSolicitud(row);
                            setCtxMenu({ open: false, x: 0, y: 0, row: null });
                        }}
                        onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                    />
                </div>
            </div>

            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva Solicitud de Credito" : `Editar Solicitud • ${draft?.id}`}
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
                                    disabled={!isAdmin && userAgencias.length <= 1}
                                    className={[
                                        inputBase,
                                        inputOk,
                                        !isAdmin && userAgencias.length <= 1
                                            ? "opacity-75 cursor-not-allowed"
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

                            <Field label="ID Solicitud Credito" icon={CreditCard}>
                                <input
                                    value={draft.id_soli_cred}
                                    onChange={(e) => setDraft((p) => ({ ...p, id_soli_cred: e.target.value }))}
                                    className={[inputBase, isInvalid("id_soli_cred") ? inputBad : inputOk].join(" ")}
                                    placeholder="ID / folio / referencia"
                                />
                                {renderRequiredError("id_soli_cred")}
                            </Field>

                            <Field label="Producto Financiero" icon={UserSearch}>
                                <select
                                    value={draft.producto_financiero || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, producto_financiero: e.target.value }))}
                                    className={[inputBase, isInvalid("producto_financiero") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un Producto...</option>
                                    {PRODUCTO_FINANCIERO.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("producto_financiero")}
                            </Field>
                            <Field label="Plazo Meses" icon={CalendarDays}>
                                <input
                                    value={draft.plazo_meses}
                                    onChange={(e) => setDraft((p) => ({ ...p, plazo_meses: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                    placeholder="Ej. 12, 24, 36"
                                />
                            </Field>

                            <Field label="Monto a Financiera" icon={Wallet}>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={draft.monto_financiero}
                                    onChange={(e) => {
                                        let valor = e.target.value;

                                        // quitar comas
                                        valor = valor.replace(/,/g, "");

                                        // dejar solo números y punto
                                        valor = valor.replace(/[^0-9.]/g, "");

                                        // permitir solo un punto decimal
                                        const partes = valor.split(".");
                                        if (partes.length > 2) {
                                            valor = `${partes[0]}.${partes.slice(1).join("")}`;
                                        }

                                        setDraft((p) => ({
                                            ...p,
                                            monto_financiero: valor,
                                        }));
                                    }}
                                    className={[inputBase, inputOk].join(" ")}
                                    placeholder="Monto"
                                />
                            </Field>

                            <Field label="Auto Interes" icon={CarFront}>
                                <select
                                    value={draft.auto_interes || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))}
                                    className={[inputBase, isInvalid("auto_interes") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un modelo...</option>
                                    {VEHICULOS.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("auto_interes")}
                            </Field>
                            <Field label="Canal de Origen" icon={UserSearch}>
                                <select
                                    value={draft.canal_origen || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, canal_origen: e.target.value }))}
                                    className={[inputBase, isInvalid("canal_origen") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un Canal...</option>
                                    {FUENTE.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("canal_origen")}
                            </Field>

                            <Field label="Asesor Ventas" icon={UserStar}>
                                <select
                                    value={draft.asesor_ventas || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, asesor_ventas: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un asesor...</option>
                                    {ASESORES.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Estado Financiamiento" icon={BadgeDollarSign}>
                                <select
                                    value={draft.estado_financiamiento || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, estado_financiamiento: e.target.value }))}
                                    className={[inputBase, isInvalid("estado_financiamiento") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un estado...</option>
                                    {ESTADOS_FINANCIAMIENTO.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("estado_financiamiento")}
                            </Field>

                            <Field label="Estado de la Compra" icon={BadgeDollarSign}>
                                <select
                                    value={draft.estado_compra || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, estado_compra: e.target.value }))}
                                    className={[inputBase, isInvalid("estado_compra") ? inputBad : inputOk].join(" ")}
                                >
                                    <option value="">Selecciona un estado...</option>
                                    {ESTADOS_COMPRA.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                                {renderRequiredError("estado_compra")}
                            </Field>

                            <Field label="Fecha de Respuesta" icon={CalendarDays}>
                                <input
                                    type="datetime-local"
                                    value={draft.fecha_respuesta}
                                    onChange={(e) => setDraft((p) => ({ ...p, fecha_respuesta: e.target.value }))}
                                    className={[inputBase, inputOk].join(" ")}
                                />
                            </Field>

                            <div className="md:col-span-3">
                                <Field label="Comentarios" icon={MessageSquareText}>
                                    <textarea
                                        value={draft.comentarios}
                                        onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))}
                                        className={[inputBase, inputOk, "min-h-[110px]"].join(" ")}
                                        placeholder="Notas internas..."
                                    />
                                </Field>
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}