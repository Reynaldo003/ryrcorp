// src/pages/CrmCases.jsx
import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, Search, X, Save, Star, User, Van, CarFront, BrainCircuit, CalendarDays, ArrowUpDown, ChevronDown, ChevronUp, MessageSquareShare, Flag, FileText, Tag, Wrench, Car, Package, Building2, Building, FileImage, FileVideo, FileSpreadsheet, File, Eye, Trash2, UploadCloud, CheckCheckIcon } from "lucide-react";
import JDPOWER from "/concesionario.png";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import ENCUESTA from "/encuesta.svg";
import SPEAK from "/speak.svg";
import PHONE from "/phone.svg";
import { api } from "../../lib/api";

const BRAND_BLUE = "#131E5C";
const API = import.meta.env.VITE_API_URL || "https://ryrback-1.onrender.com";

const ImgIcon = (src, alt) => (props) =>
    <img src={src} alt={alt} {...props} />;

function StarRating({ value = 0, onChange, step = 0.5 }) {
    const v = Number(value || 0);

    const setByClick = (e, i) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const half = x < rect.width / 2 ? 0.5 : 1;
        const next = Math.max(0, Math.min(5, i + half));
        onChange?.(next);
    };

    const stars = [0, 1, 2, 3, 4];

    return (
        <div className="flex items-center gap-1">
            {stars.map((i) => {
                const fill = Math.max(0, Math.min(1, v - i));
                return (
                    <button
                        type="button"
                        key={i}
                        onClick={(e) => setByClick(e, i)}
                        className="relative h-8 w-8"
                        title={`${(i + 1).toFixed(1)} estrellas`}
                    >
                        <Star className="h-8 w-8 text-slate-300" />

                        <span
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${fill * 100}%` }}
                        >
                            <Star className="h-8 w-8 text-yellow-500 fill-yellow-400" />
                        </span>
                    </button>
                );
            })}

            <span className="ml-2 text-sm font-bold text-[#131E5C]">
                {v.toFixed(1)}
            </span>
        </div>
    );
}

const opcionesRaiz = {
    "Gestion de Clientes": [
        "Respuestas lentas a las quejas",
        "Falta de seguimiento postventa",
        "Encuestas de satisfacción poco frecuentes o inexistentes",
        "Mala gestión de la experiencia del cliente en el showroom",
        "Falta de personal dedicado a la atención al cliente",
        "Tiempos de espera prolongados para servicios de mantenimiento",
        "Falta de comunicación proactiva con los clientes",
        "Carencia de programas de fidelización",
        "Problemas en la gestión de citas y servicios programados",
        "Deficiencias en la personalización del servicio",
        "Falta de transparencia en la información proporcionada a los clientes",
        "Deficiencias en la gestión de la imagen y reputación",
        "Falta de atención a los comentarios y reseñas",
        "Problemas en la gestión de garantías",
        "Falta de ofertas y promociones atractivas",
        "Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados",
        "Mal uso de CRM",
        "Problemas en la gestión de reclamaciones y devoluciones"
    ],
    Metodo: [
        "Procesos complejos",
        "Procesos poco explícitos",
        "Incumplimiento en la ejecución",
        "Procesos limitados",
        "Falta de documentación y registro",
        "Falta de integración entre departamentos",
        "Inconsistencias en la aplicación",
        "Procesos no optimizados",
        "Falta de estandarización en la atención al cliente",
        "Ausencia de procedimientos claros para la gestión de garantías",
        "Falta de protocolos para la entrega de vehículos nuevos",
        "Falta de automatización en procesos administrativos",
        "Retrasos en la tramitación de documentos",
        "Ineficiencia en la programación de citas",
        "Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia",
        "Deficiencias en el control de calidad",
        "Falta de auditorías internas periódicas",
        "Problemas en la implementación de sistemas ERP",
        "Deficiencias en la gestión de proyectos",
        "Falta de revisiones periódicas",
        "Procedimientos redundantes",
        "Falta de actualización de manuales operativos",
        "Uso ineficiente de recursos",
        "Falta de un sistema de gestión de calidad total"
    ],
    Materiales: [
        "Insuficiencia de materiales",
        "Materiales en mal estado",
        "Materiales descalibrados",
        "Difícil disponibilidad",
        "Costos elevados",
        "Variabilidad en la calidad",
        "Obsolescencia",
        "Falta de stock de piezas de alta demanda",
        "Problemas con proveedores no confiables",
        "Almacenamiento inadecuado de piezas",
        "Pérdidas por deterioro",
        "Falta de control de inventarios",
        "Gestión ineficaz de devoluciones",
        "Uso de materiales no homologados",
        "Falta de piezas específicas para ciertos modelos",
        "Problemas en la logística de entrega",
        "Retrasos en la recepción de materiales importados",
        "Problemas en la aduana",
        "Roturas durante el transporte",
        "Embalajes inadecuados",
        "Falta de previsión en pedidos",
        "Fallos en la trazabilidad de piezas"
    ],
    Infraestructura: [],
    "Talento Humano": [
        "Falta de capacitación",
        "Falta de adiestramiento",
        "Problemas de comunicación",
        "Desmotivación",
        "Conflictos laborales",
        "Alta rotación de personal",
        "Falta de reconocimiento",
        "Cargas de trabajo excesivas",
        "Ausentismo",
        "Falta de liderazgo efectivo",
        "Insuficiente personal de ventas durante picos de demanda",
        "Falta de técnicos especializados en postventa",
        "Ausencia de programas de desarrollo profesional y mentoría",
        "Evaluación de desempeño inadecuada",
        "Falta de incentivos y bonificaciones",
        "Falta de claridad en las expectativas laborales",
        "Escasa participación de los empleados en la toma de decisiones",
        "Deficiencias en la gestión del talento",
        "Falta de programas de bienestar laboral",
        "Problemas con la gestión del tiempo",
        "Personal de nuevo ingreso",
        "Problemas de retención de talento clave",
        "Baja moral del equipo",
        "Falta de diversidad e inclusión",
        "Problemas con la conciliación laboral y familiar",
        "Ausencia de un plan de carrera claro",
        "Falta de apoyo psicológico",
        "Falta de programas de salud y seguridad laboral"]
};
const lineaMeta = {
    General: { Icon: Car, label: "Nuevos" },
    Usados: { Icon: CarFront, label: "Usados" },
    Refacciones: { Icon: Van, label: "Comerciales" },
};

const origenMeta = {
    "JD Power": { Icon: ImgIcon(JDPOWER, "JD Power"), label: 'VW-Concesionario' },
    Whatsapp: { Icon: ImgIcon(WAP, "Whatsapp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" },
    "Llamada de Calidad": { Icon: ImgIcon(PHONE, "Llamada"), label: "Llamada Entrante" },
};

const estadoMeta = {
    "1er contacto": { label: "1er contacto", cls: "bg-blue-600 text-white" },
    "2do contacto": { label: "2do contacto", cls: "bg-yellow-500 text-black" },
    "3er contacto": { label: "3er contacto", cls: "bg-red-600 text-white" },
    "Reclamación cerrada": { label: "Reclamación cerrada", cls: "bg-emerald-600 text-white" },
};

function getFileKind(file) {
    const name = (file?.name || "").toLowerCase();
    const type = (file?.type || "").toLowerCase();

    const isImage = type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name);
    const isVideo = type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)$/.test(name);
    const isPdf = type === "application/pdf" || name.endsWith(".pdf");
    const isExcel =
        type.includes("spreadsheet") ||
        /\.(xlsx|xls|csv)$/.test(name);

    if (isImage) return "image";
    if (isVideo) return "video";
    if (isPdf) return "pdf";
    if (isExcel) return "excel";
    return "other";
}

function BadgeEstado({ value }) {
    const map = {
        "1er contacto": "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        "2do contacto": "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        "3er contacto": "bg-red-500/15 text-red-800 border-red-300/25",
        "reclamación cerrada": "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        'Autorizado': "bg-emerald-300/15 text-emerald-800 border-emerald-300/25",
        'No Autorizado': "bg-red-500/15 text-red-800 border-red-300/25",
        'Condicionado': "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        'En Proceso': "bg-neutral-400/15 text-blue-800 font-bold border-blue-300/25",
        'Ejercido': "bg-emerald-700/15 text-emerald-800 border-emerald-300/25",
        'Cotado': "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        'VWFS': "bg-neutral-400/15 text-blue-800 font-bold border-blue-300/25",
        'AFASA': "bg-purple-400/15 text-blue-800 font-bold border-blue-300/25",
        'Bancario Externo': "bg-red-500/15 text-red-800 border-red-300/25"
    };

    const cls =
        map[String(value || "").toLowerCase()] ||
        "bg-black/10 text-white/85 border-white/20";

    return (
        <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", cls].join(" ")}>
            {value || "Sin estado"}
        </span>
    );
}

function LineaPicker({ value, onChange }) {
    const items = Object.entries(lineaMeta);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {items.map(([key, meta]) => {
                const Active = value === key;
                const Icon = meta.Icon;

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        className={[
                            "rounded-lg border px-3 py-1 shadow-lg transition",
                            "flex items-center justify-center gap-2",
                            Active
                                ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/30"
                                : "border-black/10 bg-neutral-100 hover:bg-white",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-full border",
                                Active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white",
                            ].join(" ")}
                        >
                            <Icon className="h-4 w-4 text-[#131E5C]" />
                        </span>
                        <span className="text-sm text-[#131E5C]">
                            {meta.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function OrigenPicker({ value, onChange }) {
    const items = Object.entries(origenMeta);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            {items.map(([key, meta]) => {
                const Active = value === key;
                const Icon = meta.Icon;

                return (
                    <button
                        type="button"
                        key={key}
                        onClick={() => onChange(key)}
                        className={[
                            "group rounded-lg border p-1 text-left shadow-md transition",
                            Active
                                ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/30"
                                : "border-black/10 bg-neutral-100 hover:bg-white",
                        ].join(" ")}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={[
                                    "flex h-8 w-8 items-center justify-center rounded-full border",
                                    Active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white",
                                ].join(" ")}
                            >
                                <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <div className=" text-sm  text-[#131E5C]">
                                    {meta.label}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
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

export default function DigitalesProspectos() {
    const [cases, setCases] = useState([]);
    const DEALERS = [
        "VW Cordoba",
        "VW Orizaba",
        "VW Poza Rica",
        "VW Tuxtepec",
        "VW Tuxpan",
        "Chirey",
        "JAECOO R&R",
    ];
    const IA = [
        "SI",
        "NO",
    ];
    const PAUTAS = [
        'Iniciemos el año juntos',
        'Estrena Caddy',
        'Estrena Amarok',
        'Estrena Transporter'
    ];
    const RESULTADOS = [
        'Autorizado',
        'No Autorizado',
        'Condicionado',
        'En Proceso',
        'Ejercido'
    ];

    const VENTAS = [
        'Cotado',
        'VWFS',
        'AFASA',
        'Bancario Externo'
    ];
    const [ctxMenu, setCtxMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        row: null,
    });

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
        setCtxMenu({
            open: true,
            x: e.clientX,
            y: e.clientY,
            row,
        });
    };
    const eliminarCaso = async (row) => {
        if (!row?.id_exp) return;
        const ok = confirm(`¿Eliminar el caso ${row.id_exp}? Esta acción no se puede deshacer.`);
        if (!ok) return;

        try {
            await api.deleteCaso(row.id_exp);
            setCases((prev) => prev.filter((c) => c.id_exp !== row.id_exp));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            console.error(e);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
    };

    const [sort, setSort] = useState({ key: null, dir: "asc" });

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    // filtros (corrige claves)
    const [filters, setFilters] = useState({
        q: "",
        estado: "Todos",
        agencia: "Todos",
    });

    // modal unificado
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create"); // "create" | "edit"
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        api.listCasos().then(setCases).catch(console.error);
    }, []);

    const dealers = useMemo(() => {
        // antes: c.dealer (ya no existe)
        const d = new Set(cases.map((c) => c.agencia).filter(Boolean));
        return ["Todos", ...Array.from(d)];
    }, [cases]);

    const estados = useMemo(() => {
        const s = new Set(cases.map((c) => c.estado).filter(Boolean));
        return ["Todos", ...Array.from(s)];
    }, [cases]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();

        return cases.filter((c) => {
            const nombre = `${c.cliente_nombre || ""} ${c.cliente_apellidos || ""}`.trim();

            const matchQ =
                !q ||
                String(c.agencia || "").toLowerCase().includes(q) ||
                String(nombre).toLowerCase().includes(q) ||
                String(c.problema || "").toLowerCase().includes(q) ||
                String(c.estado || "").toLowerCase().includes(q);

            const matchEstado = filters.estado === "Todos" || c.estado === filters.estado;
            const matchAgencia = filters.agencia === "Todos" || c.agencia === filters.agencia;

            return matchQ && matchEstado && matchAgencia;
        });
    }, [cases, filters]);
    const sorted = useMemo(() => {
        const data = [...filtered];
        if (!sort.key) return data;

        const dir = sort.dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            // ordenar por agencia o estado (string)
            const va = (a?.[sort.key] ?? "").toString().toLowerCase();
            const vb = (b?.[sort.key] ?? "").toString().toLowerCase();

            // si quieres que "Sin estado" vaya al final, podrías manejarlo aquí
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }, [filtered, sort]);
    const openCreate = () => {
        setMode("create");
        setDraft({
            // cliente
            id_cliente: null,
            chasis: "",
            os_exp: "",
            agencia: "",
            cliente_nombre: "",
            cliente_apellidos: "",
            telefono: "",
            correo: "",

            // expediente
            linea: "Ventas",
            fecha_atencion: new Date().toISOString().slice(0, 10),
            fecha_reclamacion: new Date().toISOString().slice(0, 10),
            origen: "Facebook",
            estado: "1er contacto",
            problema: "",
            calificacion: 0,
            recopilacion: "",
            causa: "",
            raiz: "",

            // docs (mezcla: existentes + nuevos)
            documentacion: [],
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        try {
            setMode("edit");
            const detail = await api.getCaso(row.id_exp);

            const docs = Array.isArray(detail.documentacion) ? detail.documentacion : [];
            const normalizedDocs = docs.map((d) => ({
                id: d.id_doc || crypto.randomUUID(),
                id_doc: d.id_doc,
                name: d.nombre_original || "archivo",
                size: d.size || 0,
                type: d.mime || "",
                mime: d.mime,
                kind: getFileKind({ name: d.nombre_original || "archivo", type: d.mime || "" }),
                url: d.url,          // tu serializer ya manda url absoluta, úsala directo
                _raw: null,
                _fromServer: true,
            }));

            setDraft({ ...detail, documentacion: normalizedDocs });
            setOpenModal(true);
        } catch (e) {
            console.error(e);
            alert("No se pudo abrir el caso para editar (revisa consola).");
        }
    };

    const closeModal = () => {
        setOpenModal(false);
        setDraft(null);
    };

    const save = async () => {
        try {
            const localFiles = (draft.documentacion || [])
                .map((x) => x?._raw)
                .filter(Boolean);

            let payload = {
                chasis: draft.chasis,
                os_exp: Number(draft.os_exp || 0),
                agencia: draft.agencia,
                cliente_nombre: draft.cliente_nombre,
                cliente_apellidos: draft.cliente_apellidos,
                telefono: draft.telefono,
                correo: draft.correo,

                linea: draft.linea,
                fecha_atencion: draft.fecha_atencion,
                fecha_reclamacion: draft.fecha_reclamacion,
                origen: draft.origen,
                estado: draft.estado,
                problema: draft.problema,
                calificacion: draft.calificacion || null,
                recopilacion: draft.recopilacion || "",
                causa: draft.causa,
                raiz: draft.raiz,
                obs_contacto_1: draft.obs_contacto_1,
                fecha_contacto_1: draft.fecha_contacto_1 || null,

                obs_contacto_2: draft.obs_contacto_2,
                fecha_contacto_2: draft.fecha_contacto_2 || null,

                obs_contacto_3: draft.obs_contacto_3,
                fecha_contacto_3: draft.fecha_contacto_3 || null,
                obs_contacto_cierre: draft.obs_contacto_cierre,
                fecha_contacto_cierre: draft.fecha_contacto_cierre || null,

            };

            let saved;
            if (mode === "edit") {
                payload = { ...payload, id_cliente: draft.id_cliente };
            }
            if (mode === "create") {
                saved = await api.createCaso(payload);
            } else {
                saved = await api.updateCaso(draft.id_exp, payload);
            }

            // subir docs si hay
            if (localFiles.length) {
                await api.uploadDocs(saved.id_exp, localFiles);
            }

            // refrescar lista
            const updated = await api.listCasos();
            setCases(updated);

            closeModal();
        } catch (e) {
            console.error(e);
            alert("Error guardando el caso (revisa consola).");
        }
    };

    const resetFilters = () => setFilters({ q: "", estado: "Todos", agencia: "Todos" });

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">
                        Prospectos
                    </h2>
                    <p className="text-sm text-slate-400">
                        Doble clic para editar la informacion del prospecto.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Prospecto
                </button>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03]  p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#131E5C] hover:bg-[#131E5C]/90 px-3 py-2">
                            <Search className="h-4 w-4 text-white" />
                            <input
                                value={filters.q}
                                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                placeholder="Buscar por dealer, cliente, estado o descripción…"
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/70"
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
                    </div>

                    <div className="md:col-span-3">
                        <select
                            value={filters.agencia}
                            onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                            className="w-full rounded-lg border border-white/10 bg-[#131E5C]  hover:bg-[#131E5C]/80 px-3 py-2 text-sm text-white outline-none"
                        >
                            {dealers.map((d) => (
                                <option key={d} value={d} className="bg-neutral-100 text-[#131E5C]">
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <select
                            value={filters.estado}
                            onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}
                            className="w-full rounded-lg border border-white/10 bg-[#131E5C] hover:bg-[#131E5C]/80 px-3 py-2 text-sm text-white outline-none"
                        >
                            {estados.map((s) => (
                                <option key={s} value={s} className="bg-neutral-100 text-[#131E5C]">
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center gap-2 rounded-lg border w-full border-white/10 bg-[#131E5C] px-3 py-2 text-sm font-semibold text-white/85 hover:bg-[#131E5C]/85"
                        >
                            <X className="h-4 w-4" />
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                            <tr>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("agencia")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Dealer
                                        <span className="opacity-60">
                                            {sort.key === "agencia" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                        </span>
                                    </button>
                                </th>

                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("fecha_reclamacion")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Fecha de Registro
                                        <span className="opacity-60">
                                            {sort.key === "fecha_reclamacion" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                        </span>
                                    </button>
                                </th>
                                <th className="px-4 py-3">Business</th>
                                <th className="px-4 py-3">Asesor Digital</th>
                                <th className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort("estado")}
                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                    >
                                        Estado
                                        <span className="opacity-60">
                                            {sort.key === "estado" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                        </span>
                                    </button>
                                </th>

                                <th className="px-4 py-3">Descripción del Problema</th>
                                <th className="px-4 py-3">
                                    Contacto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/30">
                            {sorted.map((row) => (
                                <tr
                                    key={row.id_exp}
                                    onDoubleClick={() => openEdit(row)}
                                    onContextMenu={(e) => onRowContextMenu(e, row)}
                                    className="cursor-pointer hover:bg-white/[0.04]"
                                    title="Doble clic para editar"
                                >
                                    <td className="px-4 py-3 font-semibold text-[#131E5C]">
                                        {row.agencia}
                                    </td>
                                    <td className="px-4 py-3 text-[#131E5C]">{row.cliente_nombre + " " + row.cliente_apellidos}</td>
                                    <td className="px-4 py-3 text-[#131E5C]">
                                        {row.fecha_reclamacion}
                                    </td>
                                    <td className="px-4 py-3 text-[#131E5C]">
                                        Usados
                                    </td>
                                    <td className="px-4 py-3 text-[#131E5C]">
                                        Lizbeth Cano
                                    </td>
                                    <td className="px-4 py-3">
                                        <BadgeEstado value={row.estado} />
                                    </td>
                                    <td className="px-4 py-3 text-[#131E5C]">
                                        <span className="line-clamp-2">{row.problema}</span>
                                    </td>
                                    <td className="px-4 py-3 text-[#131E5C]">
                                        <span className="line-clamp-2">
                                            {row.telefono}
                                            <button
                                                type="button"
                                            >
                                                <MessageSquareShare />
                                            </button>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {ctxMenu.open && ctxMenu.row ? (
                                <div
                                    className="fixed z-[9999]"
                                    style={{ left: ctxMenu.x, top: ctxMenu.y }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                                        <button
                                            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                            onClick={() => eliminarCaso(ctxMenu.row)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-[#131E5C]">
                                        No hay resultados con esos filtros.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*Mobile */}
            <div className="grid gap-3 lg:hidden">
                {sorted.map((row) => (
                    <button
                        key={row.id_exp}
                        onClick={() => openEdit(row)}
                        className="text-left rounded-3xl border border-black/10 bg-white p-4 shadow-sm hover:bg-slate-50"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                    {row.cliente_nombre + " " + row.cliente_apellidos}
                                </div>
                                <div className="mt-1 text-xs text-slate-600">
                                    {row.agencia} • {row.fecha_reclamacion}
                                </div>
                            </div>
                            <BadgeEstado value={row.estado} />
                        </div>

                        <div className="mt-3 text-sm text-slate-700 line-clamp-3">
                            {row.problema}
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                            Toca para editar
                        </div>
                    </button>
                ))}

                {sorted.length === 0 ? (
                    <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">
                        No hay resultados con esos filtros.
                    </div>
                ) : null}
            </div>


            {/* ---------------- MODAL EDITAR ---------------- */}
            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo caso" : `Editar caso • ${draft?.id_exp}`}
                onClose={closeModal}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white"
                        >
                            <Save className="h-4 w-4" />
                            Guardar cambios
                        </button>
                    </>
                }
            >
                {!draft ? null : (
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(e) => setDraft(p => ({ ...p, agencia: e.target.value }))}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                            >
                                <option value="" disabled>Selecciona un dealer...</option>
                                {DEALERS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Prospecto IA" icon={BrainCircuit}>
                            <select
                                value={draft.ia || ""}
                                onChange={(e) => setDraft(p => ({ ...p, ia: e.target.value }))}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                            >
                                <option value="" disabled>¿Prospecto IA?...</option>
                                {IA.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Fecha de Registro" icon={CalendarDays}>
                            <input
                                type="date"
                                value={draft.fecha_atencion || ""}
                                onChange={(e) => setDraft(p => ({ ...p, fecha_atencion: e.target.value }))}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                            />
                        </Field>
                        <Field label="Fecha de Facturacion" icon={CalendarDays}>
                            <input
                                type="date"
                                value={draft.fecha_facturacion || ""}
                                onChange={(e) =>
                                    setDraft((p) => ({ ...p, fecha_facturacion: e.target.value }))
                                }
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                            />
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Cliente" icon={User}>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Nombre(s)</div>
                                        <input
                                            value={draft.cliente_nombre || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, cliente_nombre: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Apellidos</div>
                                        <input
                                            value={draft.cliente_apellidos || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, cliente_apellidos: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 mt-5 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Telefono</div>
                                        <input
                                            maxLength={10}
                                            value={draft.cliente_telefono || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, cliente_telefono: e.target.value.replace(/\D/g, "") }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Correo</div>
                                        <input
                                            value={draft.cliente_correo || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, cliente_correo: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 mt-5 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Auto Interes</div>
                                        <input
                                            value={draft.cliente_interes || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, cliente_interes: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Estado</div>
                                        <select
                                            value={draft.estado || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        >
                                            {["1er contacto", "2do contacto", "3er contacto", "Reclamación cerrada"].map((s) => (
                                                <option key={s} value={s} className="bg-neutral-200">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mt-2">
                                            <BadgeEstado value={draft.estado} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Business</div>
                                        <LineaPicker
                                            value={draft.linea}
                                            onChange={(v) => setDraft((p) => ({ ...p, linea: v }))}
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Canal de Contacto</div>
                                        <OrigenPicker
                                            value={draft.origen}
                                            onChange={(v) => setDraft((p) => ({ ...p, origen: v }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 mt-5 text-xs font-bold text-[#131E5C]">Pauta de Origen</div>
                                    <select
                                        value={draft.pauta || ""}
                                        onChange={(e) => setDraft(p => ({ ...p, pauta: e.target.value }))}
                                        className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                    >
                                        <option value="" disabled>Selecciona la pauta de origen...</option>
                                        {PAUTAS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Asesor Digital" icon={User}>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Nombre(s)</div>
                                        <input
                                            value={draft.asesor_nombre || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, asesor_nombre: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Apellidos</div>
                                        <input
                                            value={draft.asesor_apellidos || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, asesor_apellidos: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Asignado a" icon={User}>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Nombre(s)</div>
                                        <input
                                            value={draft.asignado_nombre || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, asignado_nombre: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Apellidos</div>
                                        <input
                                            value={draft.asignado_apellidos || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, asignado_apellidos: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        />
                                    </div>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Comentarios Adicionales" icon={FileText}>
                                <textarea
                                    value={draft.comentarios || ""}
                                    onChange={(e) => setDraft(p => ({ ...p, comentarios: e.target.value }))}
                                    rows={4}
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                />
                            </Field>
                        </div>

                        <div className="md:col-span-2">
                            <Field label="Resultado del contacto" icon={FileText}>
                                <div class="flex items-center">
                                    <input id="simple-checkbox" type="checkbox" className="w-4 h-4 ml-6 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                    <label for="simple-checkbox" className="ml-2 text-sm font-medium text-gray-900">Cita Efectiva</label>
                                    <input id="simple-checkbox" type="checkbox" className="w-4 h-4 ml-6 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                    <label for="simple-checkbox" className="ml-2 text-sm font-medium text-gray-900">Cita Virtual</label>
                                    <input id="simple-checkbox" type="checkbox" className="w-4 h-4 ml-6 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                    <label for="simple-checkbox" className="ml-2 text-sm font-medium text-gray-900">Solicitud de Credito</label>
                                    <input id="simple-checkbox" type="checkbox" className="w-4 h-4 ml-6 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                    <label for="simple-checkbox" className="ml-2 text-sm font-medium text-gray-900">Facturado</label>
                                </div>
                                <div className="grid gap-3 mt-5 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Resultado de la Solicitud</div>
                                        <select
                                            value={draft.resultado || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, resultado: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        >
                                            <option value="" disabled>Selecciona un resultado...</option>
                                            {RESULTADOS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>

                                        <div className="mt-2">
                                            <BadgeEstado value={draft.resultado} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-1 text-xs font-bold text-[#131E5C]">Tipo de Venta</div>
                                        <select
                                            value={draft.ventas || ""}
                                            onChange={(e) => setDraft(p => ({ ...p, ventas: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-neutral-100 shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none"
                                        >
                                            <option value="" disabled>Selecciona un Tipo de Venta...</option>
                                            {VENTAS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>

                                        <div className="mt-2">
                                            <BadgeEstado value={draft.ventas} />
                                        </div>
                                    </div>
                                </div>
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}
