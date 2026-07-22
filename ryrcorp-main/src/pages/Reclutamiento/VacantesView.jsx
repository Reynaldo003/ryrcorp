import { useEffect, useMemo, useState, useDeferredValue, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import {
    ArrowUpDown,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    ClipboardList,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Plus,
    Save,
    Search,
    Trash2,
    User,
    UserPlus,
    Users,
    X,
} from "lucide-react";

import { apiReclutamiento } from "../../lib/apiReclutamiento";

const BRAND_BLUE = "#131E5C";

const ESTATUS_VACANTE = ["Publicada", "En Selección", "Cerrada"];
const ESTATUS_CANDIDATO = ["Nuevo", "En proceso", "En espera", "Contratado", "Descartado"];
const SEXOS = ["Femenino", "Masculino", "Otro", "Prefiero no decir"];
const FUENTES_RECLUTAMIENTO = ["Indeed", "Computrabajo", "Facebook", "Interno", "Base de datos"];
const TIPOS_VALIDACION = ["No aplica", "Estudio socioeconómico", "Referencias laborales"];
const DEALERS_VW = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];
const PUESTOS = [
    "Asesor de Venta de Autos Nuevos", "Asesor de Venta de Autos Usados", "Administrativo de Ventas",
    "Coordinador de Servicios Financieros", "Coordinador de AFASA", "Preparador de Autos", "Lavador de Autos",
    "Cajera", "Auxiliar Contable", "Contador General", "Gerente de Venta de Autos Nuevos", "Gerente de Servicio",
    "Gerente de Refacciones", "Gerente de Postventa", "Gerente de Carrocería y Pintura", "Asesor de Carrocería y Pintura",
    "Técnico Carrocero", "Técnico Pintor", "Técnico Mecánico", "Asesor de Servicio", "Asistente de Servicio",
    "Administrador de Garantías", "Jefe de Taller", "Master Technician", "Asesor de Refacciones de Mostrador Público",
    "Asesor de Refacciones de Mostrador Taller", "Promotor NORA", "Responsable de Almacén", "Asesor de Ventas Digitales",
    "Coordinador de Ventas Digitales", "Auditor Interno", "Contador Fiscal", "Gerente General", "Gerente de Mercadotecnia",
    "Consultor de Experiencia", "Coordinador de Mercadotecnia", "Recepcionista", "Contact Center", "Trasladista",
    "Valuador de Autos Usados", "Controlista de Calidad", "Afanador", "Vigilancia", "Oficial de Cumplimiento",
    "Encargado de Entregas", "Coordinador de Desarrollo Organizacional", "Gerente de Calidad", "Crédito y Cobranza",
    "Coordinador de Sistemas Computacionales", "Contador General de Fondos y Valores", "Coordinador de Recursos Humanos",
    "Analista de Datos y Programación", "Auxiliar de Diseño y Producción", "Gerente de Desarrollo de Negocios",
];

const INITIAL_FILTERS = { q: "", estatus: "Todos", dealer: "Todos", puesto: "Todos", fuente: "Todos" };
const REQUIRED = { estatus: "Estatus de la vacante", puesto: "Puesto", dealer: "Dealer", fuente_reclutamiento: "Fuente de reclutamiento", solicitado_por: "Solicitado por" };
const REQUIRED_CANDIDATE = { nombre: "Nombre", sexo: "Sexo", telefono: "Número telefónico", correo: "Correo", ubicacion: "Ubicación", puesto_postulado: "Puesto al que se postula", fuente: "Fuente" };

const DATE_STAGES = [
    { key: "fecha_entrevista_do", label: "Entrevista DO", group: "Entrevistas" },
    { key: "fecha_entrevista_gerente", label: "Entrevista gerente", group: "Entrevistas" },
    { key: "fecha_respuesta_gerente", label: "Respuesta gerente", group: "Entrevistas" },
    { key: "fecha_alta_khor", label: "Alta KHOR", group: "KHOR" },
    { key: "fecha_realizacion_khor", label: "Realización KHOR", group: "KHOR" },
    // { key: "fecha_entrega_resultados_khor", label: "Entrega resultados KHOR", group: "KHOR" }, ← ELIMINADA
    { key: "fecha_solicitud_estudio_socioeconomico", label: "Solicitud estudio", group: "Socioeconómico", onlyWhen: "Estudio socioeconómico" },
    { key: "fecha_entrega_reporte_socioeconomico", label: "Entrega reporte", group: "Socioeconómico", onlyWhen: "Estudio socioeconómico" },
    { key: "fecha_solicitud_referencias_laborales", label: "Solicitud referencias", group: "Referencias", onlyWhen: "Referencias laborales" },
    { key: "fecha_entrega_referencias_laborales", label: "Entrega referencias", group: "Referencias", onlyWhen: "Referencias laborales" },
    { key: "fecha_solicitud_alta", label: "Solicitud de alta", group: "Alta" },
    { key: "fecha_respuesta_alta", label: "Respuesta alta", group: "Alta" },
    { key: "fecha_ingreso", label: "Fecha ingreso", group: "Alta" },
];

function cls(...values) { return values.filter(Boolean).join(" "); }
function normalizarTexto(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase(); }
function formatDateTime(value) { if (!value) return "—"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "—"; return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date); }
function formatDate(value) { if (!value) return "—"; const baseValue = typeof value === "string" && value.includes("T") ? value : `${value}T00:00:00`; const date = new Date(baseValue); if (Number.isNaN(date.getTime())) return "—"; return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function toInputDate(value) { if (!value) return ""; if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return date.toISOString().slice(0, 10); }
function getSortValue(row, key) { if (key === "id_vacante") return Number(row.id_vacante || 0); if (key === "candidatos") return normalizarCandidatos(row).length; return normalizarTexto(row?.[key]); }
function crearIdTemporal() { if (window.crypto?.randomUUID) return window.crypto.randomUUID(); return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function crearCandidatoBase({ puesto = "", fuente = "" } = {}) {
    return {
        id_temporal: crearIdTemporal(),

        nombre: "",
        sexo: "",
        telefono: "",
        correo: "",
        ubicacion: "",

        puesto_postulado: puesto,
        fuente,

        estatus: "Nuevo",

        // CV
        cv_nombre: "",
        cv_archivo: null,

        fecha_entrevista_do: "",
        fecha_entrevista_gerente: "",
        fecha_respuesta_gerente: "",

        fecha_alta_khor: "",
        fecha_realizacion_khor: "",
        fecha_entrega_resultados_khor: "",

        tipo_validacion_socioeconomica: "No aplica",

        fecha_solicitud_estudio_socioeconomico: "",
        fecha_entrega_reporte_socioeconomico: "",

        fecha_solicitud_referencias_laborales: "",
        fecha_entrega_referencias_laborales: "",

        fecha_solicitud_alta: "",
        fecha_respuesta_alta: "",

        fecha_ingreso: "",

        comentarios: "",
    };
}function normalizarCandidatos(row) { if (Array.isArray(row?.candidatos)) return row.candidatos; if (Array.isArray(row?.candidatos_vacante)) return row.candidatos_vacante; return []; }
function normalizarVacanteDesdeApi(row) { return { ...row, candidatos: normalizarCandidatos(row).map((candidato) => ({ ...crearCandidatoBase({ puesto: row?.puesto || "", fuente: row?.fuente_reclutamiento || "" }), ...candidato, id_temporal: candidato.id_temporal || candidato.id || crearIdTemporal(), puesto_postulado: candidato.puesto_postulado || candidato.puesto || row?.puesto || "", fuente: candidato.fuente || row?.fuente_reclutamiento || "", tipo_validacion_socioeconomica: candidato.tipo_validacion_socioeconomica || "No aplica", estatus: candidato.estatus || "Nuevo" })), }; }
function stagesVisibles(candidato) { return DATE_STAGES.filter((stage) => { if (!stage.onlyWhen) return true; return candidato.tipo_validacion_socioeconomica === stage.onlyWhen; }); }
function obtenerProgresoCandidato(candidato) { const visibles = stagesVisibles(candidato); const completas = visibles.filter((stage) => Boolean(candidato[stage.key])); if (!visibles.length) return 0; return Math.round((completas.length / visibles.length) * 100); }
function obtenerEtapaActual(candidato) { const visibles = stagesVisibles(candidato); const pendiente = visibles.find((stage) => !candidato[stage.key]); if (candidato.estatus === "Contratado" || candidato.fecha_ingreso) return "Contratado / ingreso definido"; if (candidato.estatus === "Descartado") return "Descartado"; return pendiente ? `Pendiente: ${pendiente.label}` : "Proceso completo"; }

function BadgeEstatus({ value }) { const key = normalizarTexto(value); const map = { publicada: "border-blue-300/30 bg-blue-600/15 text-blue-800", "en seleccion": "border-amber-300/40 bg-amber-500/15 text-amber-800", cerrada: "border-slate-300/50 bg-slate-500/15 text-slate-700" }; return <span className={cls("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold", map[key] || "border-slate-200 bg-slate-100 text-slate-700")}>{value || "Sin estatus"}</span>; }
function BadgeCandidato({ value }) { const key = normalizarTexto(value); const map = { nuevo: "border-blue-200 bg-blue-50 text-blue-700", "en proceso": "border-amber-200 bg-amber-50 text-amber-700", "en espera": "border-purple-200 bg-purple-50 text-purple-700", contratado: "border-emerald-200 bg-emerald-50 text-emerald-700", descartado: "border-red-200 bg-red-50 text-red-700" }; return <span className={cls("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black", map[key] || "border-slate-200 bg-slate-50 text-slate-700")}>{value || "Nuevo"}</span>; }
function BadgeFuente({ value }) { return <span className="inline-flex items-center rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-2.5 py-1 text-[11px] font-black text-[#131E5C]">{value || "Sin fuente"}</span>; }
function ProgressBar({ value }) { const safeValue = Math.min(100, Math.max(0, Number(value || 0))); return <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#131E5C] transition-all" style={{ width: `${safeValue}%` }} /></div>; }
function Skeleton({ className = "" }) { return <div className={cls("animate-pulse rounded-md bg-black/10", className)} />; }
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
            <td className="px-4 py-3"><Skeleton className="h-6 w-28 rounded-full" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-64" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        </tr>
    );
}
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(<div className="fixed inset-0 z-[60]"><div className="absolute inset-0 bg-black/45" onClick={onClose} /><div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4"><div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-xl"><div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}><div className="min-w-0"><div className="truncate text-base font-extrabold text-white">{title}</div></div><button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15" aria-label="Cerrar"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>{footer ? <div className="flex shrink-0 flex-col gap-2 border-t border-[#131E5C]/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div> : null}</div></div></div>, document.body);
}

function MenuContextual({ menu, onClose, onEliminar }) {
    if (!menu) return null;
    const anchoMenu = 230;
    const altoMenu = 120;
    const left = Math.min(menu.x, window.innerWidth - anchoMenu - 12);
    const top = Math.min(menu.y, window.innerHeight - altoMenu - 12);
    return createPortal(<div className="fixed inset-0 z-[70]" onClick={onClose} onContextMenu={(event) => { event.preventDefault(); onClose(); }}><div className="fixed w-[230px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl" style={{ left: Math.max(12, left), top: Math.max(12, top) }} onClick={(event) => event.stopPropagation()}><div className="border-b border-black/10 px-4 py-3"><div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vacante</div><div className="mt-1 truncate text-sm font-black text-[#131E5C]">#{menu.row?.id_vacante} · {menu.row?.puesto || "Sin puesto"}</div></div><button type="button" onClick={() => onEliminar(menu.row)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /> Eliminar vacante</button></div></div>, document.body);
}

function Field({ label, icon: Icon, children, className = "" }) { return <div className={cls("h-full rounded-lg border border-white/10 bg-neutral-200/50 p-4", className)}><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#131E5C]">{Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}<span>{label}</span></div><div className="space-y-3">{children}</div></div>; }
function MiniStat({ label, value, icon: Icon }) { return <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div><div className="mt-1 text-2xl font-black text-[#131E5C]">{value}</div></div>{Icon ? <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#131E5C]/10 text-[#131E5C]"><Icon className="h-5 w-5" /></div> : null}</div></div>; }
function DateField({ label, value, onChange, inputClassName }) { return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span><input type="date" value={toInputDate(value)} onChange={(event) => onChange(event.target.value)} className={inputClassName} /></label>; }

export default function VacantesView() {
    const [vacantes, setVacantes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actualizando, setActualizando] = useState({});
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const deferredQ = useDeferredValue(filters.q);
    const [sort, setSort] = useState({ key: "id_vacante", dir: "desc" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [touchedSave, setTouchedSave] = useState(false);
    const [activeTab, setActiveTab] = useState("vacante");
    const [expandedCandidate, setExpandedCandidate] = useState(null);
    const [menuContextual, setMenuContextual] = useState(null);

    const { user } = useAuth();
const permisos = user?.permisos || [];
const rol = String(user?.rol || "").trim().toLowerCase();

const isAdmin = useMemo(() => {
    return (
        rol === "administrador" ||
        permisos.includes("ALL") ||
        permisos.includes("USUARIOS_ADMIN")
    );
}, [rol, permisos]);

const userAgencias = useMemo(() => {
    return String(user?.agencia || "")
        .split("|")
        .map((a) => a.trim())
        .filter(Boolean);
}, [user?.agencia]);

const userTieneAgencia = useCallback(
    (dealerRegistro) => {
        const dealer = String(dealerRegistro || "").trim();
        if (!dealer) return false;
        return userAgencias.some(
            (a) => a.toLowerCase() === dealer.toLowerCase()
        );
    },
    [userAgencias]
);

    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100 focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15";
    const inputBad = "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200";
    const filterLabelCls = "mb-1.5 block text-xs font-bold text-[#131E5C]";
    const filterControlCls = "h-9 w-full rounded-lg border border-[#131E5C] bg-white px-3 text-sm text-[#131E5C] placeholder:text-[#131E5C]/60 shadow-sm outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15";
    const modalInputCls = cls(inputBase, inputOk);

    const missing = useMemo(() => { if (!draft) return []; return Object.keys(REQUIRED).filter((key) => { const value = draft[key]; return value === null || value === undefined || String(value).trim() === ""; }); }, [draft]);
    const candidateErrors = useMemo(() => { if (!draft) return []; return normalizarCandidatos(draft).map((candidato, index) => { const faltantes = Object.keys(REQUIRED_CANDIDATE).filter((key) => { const value = candidato[key]; return value === null || value === undefined || String(value).trim() === ""; }); return { index, nombre: candidato.nombre || `Candidato ${index + 1}`, faltantes }; }).filter((item) => item.faltantes.length > 0); }, [draft]);
    const isInvalid = (key) => touchedSave && missing.includes(key);

    async function cargarVacantes() { setLoading(true); try { const data = await apiReclutamiento.listarVacantes(); const normalizadas = Array.isArray(data) ? data.map(normalizarVacanteDesdeApi) : []; setVacantes(normalizadas); } catch (error) { console.error(error); setVacantes([]); alert("No se pudieron cargar las vacantes."); } finally { setLoading(false); } }
    useEffect(() => { cargarVacantes(); }, []);
    useEffect(() => { function cerrarConEscape(event) { if (event.key === "Escape") { setMenuContextual(null); if (!saving) { setOpenModal(false); setDraft(null); } } } function cerrarMenu() { setMenuContextual(null); } window.addEventListener("keydown", cerrarConEscape); window.addEventListener("scroll", cerrarMenu, true); window.addEventListener("resize", cerrarMenu); return () => { window.removeEventListener("keydown", cerrarConEscape); window.removeEventListener("scroll", cerrarMenu, true); window.removeEventListener("resize", cerrarMenu); }; }, [saving]);

    const stats = useMemo(() => { const candidatos = vacantes.flatMap((item) => normalizarCandidatos(item)); return { total: vacantes.length, publicadas: vacantes.filter((item) => item.estatus === "Publicada").length, seleccion: vacantes.filter((item) => item.estatus === "En Selección").length, cerradas: vacantes.filter((item) => item.estatus === "Cerrada").length, candidatos: candidatos.length, contratados: candidatos.filter((item) => item.estatus === "Contratado" || item.fecha_ingreso).length }; }, [vacantes]);
    const puestosOptions = useMemo(() => ["Todos", ...PUESTOS], []);
    const fuentesOptions = useMemo(() => ["Todos", ...FUENTES_RECLUTAMIENTO], []);

    const filtered = useMemo(() => { const q = normalizarTexto(deferredQ); return vacantes.filter((item) => {
    if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(item.dealer)) return false;
    const candidatos = normalizarCandidatos(item); const textoBusqueda = normalizarTexto([item.id_vacante, item.estatus, item.puesto, item.dealer, item.fuente_reclutamiento, item.solicitado_por, item.fecha_publicacion, item.fecha_cierre, ...candidatos.flatMap((candidato) => [candidato.nombre, candidato.sexo, candidato.telefono, candidato.correo, candidato.ubicacion, candidato.puesto_postulado, candidato.fuente, candidato.estatus])].join(" ")); const matchQ = !q || textoBusqueda.includes(q); const matchEstatus = filters.estatus === "Todos" || item.estatus === filters.estatus; const matchDealer = filters.dealer === "Todos" || item.dealer === filters.dealer; const matchPuesto = filters.puesto === "Todos" || item.puesto === filters.puesto; const matchFuente = filters.fuente === "Todos" || item.fuente_reclutamiento === filters.fuente || candidatos.some((candidato) => candidato.fuente === filters.fuente); return matchQ && matchEstatus && matchDealer && matchPuesto && matchFuente; }); }, [vacantes, deferredQ, filters]);

    const sorted = useMemo(() => { const data = [...filtered]; const dir = sort.dir === "asc" ? 1 : -1; data.sort((a, b) => { const va = getSortValue(a, sort.key); const vb = getSortValue(b, sort.key); if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0; }); return data; }, [filtered, sort]);

    function toggleSort(key) { setSort((prev) => { if (prev.key !== key) return { key, dir: "asc" }; return { key, dir: prev.dir === "asc" ? "desc" : "asc" }; }); }
    function updateFilter(key, value) { setFilters((prev) => ({ ...prev, [key]: value })); }
    function resetFilters() { setFilters(INITIAL_FILTERS); }
    function updateDraftField(key, value) { setDraft((prev) => ({ ...prev, [key]: value })); }
    function openCreate() { setMode("create"); setTouchedSave(false); setActiveTab("vacante"); setExpandedCandidate(null); setMenuContextual(null); setDraft({ id_vacante: "Automático", estatus: "Publicada", puesto: "", dealer: isAdmin ? "" : (userAgencias[0] || ""), fuente_reclutamiento: "", solicitado_por: "", fecha_publicacion: "", fecha_cierre: "", candidatos: [] }); setOpenModal(true); }
    function openEdit(row) { const normalizada = normalizarVacanteDesdeApi(row); setMode("edit"); setTouchedSave(false); setActiveTab("candidatos"); setExpandedCandidate(normalizarCandidatos(normalizada)[0]?.id_temporal || null); setMenuContextual(null); setDraft(normalizada); setOpenModal(true); }
    function closeModal() { if (saving) return; setOpenModal(false); setDraft(null); }
    function abrirMenuContextual(event, row) { event.preventDefault(); event.stopPropagation(); setMenuContextual({ x: event.clientX, y: event.clientY, row }); }
    function agregarCandidato() { const nuevo = crearCandidatoBase({ puesto: draft?.puesto || "", fuente: draft?.fuente_reclutamiento || "" }); setDraft((prev) => ({ ...prev, candidatos: [...normalizarCandidatos(prev), nuevo] })); setActiveTab("candidatos"); setExpandedCandidate(nuevo.id_temporal); }
    function actualizarCandidato(index, key, value) { setDraft((prev) => { const candidatos = normalizarCandidatos(prev).map((candidato, i) => { if (i !== index) return candidato; const next = { ...candidato, [key]: value }; if (key === "tipo_validacion_socioeconomica") { if (value !== "Estudio socioeconómico") { next.fecha_solicitud_estudio_socioeconomico = ""; next.fecha_entrega_reporte_socioeconomico = ""; } if (value !== "Referencias laborales") { next.fecha_solicitud_referencias_laborales = ""; next.fecha_entrega_referencias_laborales = ""; } } if (key === "fecha_ingreso" && value) { next.estatus = "Contratado"; } return next; }); return { ...prev, candidatos }; }); }
    function eliminarCandidato(index) { const candidato = normalizarCandidatos(draft)[index]; const ok = confirm(`¿Eliminar a ${candidato?.nombre || `candidato ${index + 1}`}?`); if (!ok) return; setDraft((prev) => ({ ...prev, candidatos: normalizarCandidatos(prev).filter((_, i) => i !== index) })); if (expandedCandidate === candidato?.id_temporal) { setExpandedCandidate(null); } }
async function save() {
    if (!draft || saving) return;
    setTouchedSave(true);

    if (missing.length) {
        setActiveTab("vacante");
        alert(`No se pudo guardar. Faltan campos obligatorios de la vacante:\n\n${missing.map((key) => REQUIRED[key]).join("\n")}`);
        return;
    }

    if (candidateErrors.length) {
        setActiveTab("candidatos");
        const primerError = normalizarCandidatos(draft)[candidateErrors[0].index];
        setExpandedCandidate(primerError?.id_temporal || null);

        const mensaje = candidateErrors
            .map((item) => `${item.nombre}: ${item.faltantes.map((key) => REQUIRED_CANDIDATE[key]).join(", ")}`)
            .join("\n");

        alert(`No se pudo guardar. Hay candidatos con información incompleta:\n\n${mensaje}`);
        return;
    }

    setSaving(true);
    try {
      const payload = {...draft, candidatos: normalizarCandidatos(draft).map(({ cv_archivo, ...resto }) => resto), };
        if (mode === "create") {
            await apiReclutamiento.crearVacante(payload);
        } else {
            await apiReclutamiento.actualizarVacante(draft.id_vacante, payload);
        }
        await cargarVacantes();
        setOpenModal(false);
        setDraft(null);
    } catch (error) {
        console.error(error);
        const detalle = error?.message || "";
        alert(`No se pudo guardar la vacante.${detalle ? `\n\nDetalle: ${detalle}` : ""}`);
    } finally {
        setSaving(false);
    }
}    async function eliminarVacante(row) { if (!row?.id_vacante) return; const ok = confirm(`¿Eliminar la vacante ${row.id_vacante}?`); if (!ok) { setMenuContextual(null); return; } try { setMenuContextual(null); await apiReclutamiento.eliminarVacante(row.id_vacante); await cargarVacantes(); } catch (error) { console.error(error); alert("No se pudo eliminar la vacante."); } }
    async function updateEstatusInline(row, nuevoEstatus) { const id = row.id_vacante; const fechaCierre = nuevoEstatus === "Cerrada" ? row.fecha_cierre || new Date().toISOString() : null; setActualizando((prev) => ({ ...prev, [id]: true })); const anterior = vacantes; setVacantes((prev) => prev.map((item) => item.id_vacante === id ? { ...item, estatus: nuevoEstatus, fecha_cierre: fechaCierre } : item)); try { const actualizado = await apiReclutamiento.actualizarVacante(id, { ...row, estatus: nuevoEstatus, fecha_cierre: fechaCierre }); setVacantes((prev) => prev.map((item) => item.id_vacante === id ? normalizarVacanteDesdeApi(actualizado) : item)); } catch (error) { console.error(error); setVacantes(anterior); alert("No se pudo actualizar el estatus."); } finally { setActualizando((prev) => { const next = { ...prev }; delete next[id]; return next; }); } }
    function SortIcon({ column }) { if (sort.key !== column) return <ArrowUpDown className="h-4 w-4" />; return sort.dir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />; }

    return (
           <div className="w-full"> 
           
               <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                   <div className="min-w-0">
                       <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">
                           Reclutamiento
                       </h2>
   
                       <p className="text-sm text-slate-400">
                           Gestión de vacantes, fuentes de reclutamiento y pipeline de candidatos por etapa.
                       </p>
                   </div>
   
                   <button
                       type="button"
                       onClick={openCreate}
                       className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#131E5C]/85"
                   >
                       <Plus className="h-4 w-4" />
                       Nueva Vacante
                   </button>
               </div>
   
               <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                   <MiniStat label="Vacantes" value={stats.total} icon={ClipboardList} />
                   <MiniStat label="Publicadas" value={stats.publicadas} icon={BriefcaseBusiness} />
                   <MiniStat label="En selección" value={stats.seleccion} icon={Search} />
                   <MiniStat label="Cerradas" value={stats.cerradas} icon={CheckCircle2} />
                   <MiniStat label="Candidatos" value={stats.candidatos} icon={Users} />
                   <MiniStat label="Ingresos" value={stats.contratados} icon={ClipboardCheck} />
               </div>
   
               <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                   <div className="grid gap-4 xl:grid-cols-12">
                       <div className="xl:col-span-4">
                           <label className={filterLabelCls}>Búsqueda</label>
   
                           <div className="relative">
                               <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]/70" />
   
                               <input
                                   value={filters.q}
                                   onChange={(event) =>
                                       updateFilter("q", event.target.value)
                                   }
                                   placeholder="Buscar por vacante, candidato, correo, teléfono, fuente..."
                                   className={`${filterControlCls} pl-10 pr-10`}
                               />
   
                               {filters.q ? (
                                   <button
                                       type="button"
                                       onClick={() => updateFilter("q", "")}
                                       className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#131E5C] transition hover:bg-slate-100 hover:text-red-500"
                                       aria-label="Limpiar búsqueda"
                                   >
                                       <X className="h-4 w-4" />
                                   </button>
                               ) : null}
                           </div>
                       </div>
   
                       <div className="xl:col-span-2">
                           <label className={filterLabelCls}>Estatus</label>
   
                           <select
                               value={filters.estatus}
                               onChange={(event) =>
                                   updateFilter("estatus", event.target.value)
                               }
                               className={filterControlCls}
                           >
                               <option value="Todos">Todos</option>
   
                               {ESTATUS_VACANTE.map((estatus) => (
                                   <option key={estatus} value={estatus}>
                                       {estatus}
                                   </option>
                               ))}
                           </select>
                       </div>
   
                       <div className="xl:col-span-2">
                           <label className={filterLabelCls}>Dealer</label>
   
                           <select
                                value={filters.dealer}
                                onChange={(event) => updateFilter("dealer", event.target.value)}
                                className={filterControlCls}
                            >
                                <option value="Todos">Todos</option>
                                {(isAdmin ? DEALERS_VW : userAgencias).map((dealer) => (
                                    <option key={dealer} value={dealer}>{dealer}</option>
                                ))}
                            </select>
                       </div>
   
                       <div className="xl:col-span-2">
                           <label className={filterLabelCls}>Fuente</label>
   
                           <select
                               value={filters.fuente}
                               onChange={(event) =>
                                   updateFilter("fuente", event.target.value)
                               }
                               className={filterControlCls}
                           >
                               {fuentesOptions.map((fuente) => (
                                   <option key={fuente} value={fuente}>
                                       {fuente}
                                   </option>
                               ))}
                           </select>
                       </div>
   
                       <div className="xl:col-span-2">
                           <label className={filterLabelCls}>Puesto</label>
   
                           <select
                               value={filters.puesto}
                               onChange={(event) =>
                                   updateFilter("puesto", event.target.value)
                               }
                               className={filterControlCls}
                           >
                               {puestosOptions.map((puesto) => (
                                   <option key={puesto} value={puesto}>
                                       {puesto}
                                   </option>
                               ))}
                           </select>
                       </div>
                   </div>
   
                   <div className="mt-4 flex flex-col gap-3 border-t border-[#131E5C]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                       <div className="text-sm font-semibold text-[#131E5C]">
                           Mostrando {sorted.length} de {vacantes.length} vacantes
                       </div>
   
                       <button
                           type="button"
                           onClick={resetFilters}
                           className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#131E5C]/25 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-50"
                       >
                           <X className="h-4 w-4" />
                           Limpiar filtros
                       </button>
                   </div>
               </div>
   
               <div className="hidden overflow-hidden rounded-lg bg-white shadow-lg lg:block">
                   <div className="overflow-auto">
                       <table className="min-w-full text-left text-sm">
                           <thead className="font-vw-header border border-black bg-[#131E5C] text-xs text-white">
                               <tr>
                                   <th className="px-4 py-3">
                                       <button
                                           type="button"
                                           onClick={() => toggleSort("id_vacante")}
                                           className="inline-flex items-center gap-1 font-bold"
                                       >
                                           ID Vacante
                                           <SortIcon column="id_vacante" />
                                       </button>
                                   </th>
   
                                   <th className="px-4 py-3">Estatus</th>
   
                                   <th className="px-4 py-3">
                                       <button
                                           type="button"
                                           onClick={() => toggleSort("puesto")}
                                           className="inline-flex items-center gap-1 font-bold"
                                       >
                                           Puesto
                                           <SortIcon column="puesto" />
                                       </button>
                                   </th>
   
                                   <th className="px-4 py-3">
                                       <button
                                           type="button"
                                           onClick={() => toggleSort("dealer")}
                                           className="inline-flex items-center gap-1 font-bold"
                                       >
                                           Dealer
                                           <SortIcon column="dealer" />
                                       </button>
                                   </th>
   
                                   <th className="px-4 py-3">Fuente</th>
   
                                   <th className="px-4 py-3">
                                       <button
                                           type="button"
                                           onClick={() => toggleSort("candidatos")}
                                           className="inline-flex items-center gap-1 font-bold"
                                       >
                                           Candidatos
                                           <SortIcon column="candidatos" />
                                       </button>
                                   </th>
   
                                   <th className="px-4 py-3">Solicitado por</th>
                                   <th className="px-4 py-3">Fecha publicación</th>
                               </tr>
                           </thead>
   
                           <tbody className="divide-y divide-black/10">
                               {loading ? (
                                   <>
                                       {Array.from({ length: 8 }).map(
                                           (_, index) => (
                                               <SkeletonRow key={index} />
                                           )
                                       )}
                                   </>
                               ) : (
                                   <>
                                       {sorted.map((row) => {
                                           const isUpdating =
                                               !!actualizando[row.id_vacante];
                                           const candidatos = normalizarCandidatos(row);
                                           const contratados = candidatos.filter(
                                               (candidato) =>
                                                   candidato.estatus === "Contratado" ||
                                                   candidato.fecha_ingreso
                                           ).length;
   
                                           return (
                                               <tr
                                                   key={row.id_vacante}
                                                   onDoubleClick={() =>
                                                       openEdit(row)
                                                   }
                                                   onContextMenu={(event) =>
                                                       abrirMenuContextual(
                                                           event,
                                                           row
                                                       )
                                                   }
                                                   className="cursor-pointer transition hover:bg-slate-50"
                                                   title="Doble clic para editar. Clic derecho para eliminar."
                                               >
                                                   <td className="px-4 py-3 font-bold text-[#131E5C]">
                                                       {row.id_vacante}
                                                   </td>
   
                                                   <td className="px-4 py-3">
                                                       <div className="relative inline-flex items-center">
                                                           <select
                                                               value={
                                                                   row.estatus ||
                                                                   "Publicada"
                                                               }
                                                               disabled={
                                                                   isUpdating
                                                               }
                                                               onClick={(event) =>
                                                                   event.stopPropagation()
                                                               }
                                                               onDoubleClick={(
                                                                   event
                                                               ) =>
                                                                   event.stopPropagation()
                                                               }
                                                               onContextMenu={(
                                                                   event
                                                               ) =>
                                                                   event.stopPropagation()
                                                               }
                                                               onChange={(
                                                                   event
                                                               ) => {
                                                                   event.stopPropagation();
                                                                   updateEstatusInline(
                                                                       row,
                                                                       event.target
                                                                           .value
                                                                   );
                                                               }}
                                                               className="appearance-none rounded-full border border-[#131E5C]/20 bg-white px-3 py-1 pr-8 text-xs font-bold text-[#131E5C] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                                           >
                                                               {ESTATUS_VACANTE.map(
                                                                   (estatus) => (
                                                                       <option
                                                                           key={
                                                                               estatus
                                                                           }
                                                                           value={
                                                                               estatus
                                                                           }
                                                                       >
                                                                           {
                                                                               estatus
                                                                           }
                                                                       </option>
                                                                   )
                                                               )}
                                                           </select>
   
                                                           <span className="pointer-events-none absolute right-2 inline-flex items-center text-[#131E5C]">
                                                               {isUpdating ? (
                                                                   <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                               ) : (
                                                                   <ChevronDown className="h-3.5 w-3.5" />
                                                               )}
                                                           </span>
                                                       </div>
                                                   </td>
   
                                                   <td className="max-w-[360px] px-4 py-3 text-[#131E5C]">
                                                       <div className="line-clamp-2 font-semibold">
                                                           {row.puesto || "—"}
                                                       </div>
                                                   </td>
   
                                                   <td className="px-4 py-3 text-[#131E5C]">
                                                       {row.dealer || "—"}
                                                   </td>
   
                                                   <td className="px-4 py-3">
                                                       <BadgeFuente value={row.fuente_reclutamiento} />
                                                   </td>
   
                                                   <td className="px-4 py-3 text-[#131E5C]">
                                                       <div className="font-black">
                                                           {candidatos.length}
                                                       </div>
                                                       <div className="text-xs font-semibold text-slate-500">
                                                           {contratados} ingresos
                                                       </div>
                                                   </td>
   
                                                   <td className="px-4 py-3 text-[#131E5C]">
                                                       {row.solicitado_por || "—"}
                                                   </td>
   
                                                   <td className="px-4 py-3 text-[#131E5C]">
                                                       {formatDateTime(
                                                           row.fecha_publicacion
                                                       )}
                                                   </td>
                                               </tr>
                                           );
                                       })}
   
                                       {!sorted.length ? (
                                           <tr>
                                               <td
                                                   colSpan={8}
                                                   className="px-4 py-10 text-center text-[#131E5C]"
                                               >
                                                   No hay vacantes con esos filtros.
                                               </td>
                                           </tr>
                                       ) : null}
                                   </>
                               )}
                           </tbody>
                       </table>
                   </div>
               </div>
   
               <div className="grid gap-3 lg:hidden">
                   {loading ? (
                       <>
                           {Array.from({ length: 6 }).map((_, index) => (
                               <div
                                   key={index}
                                   className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm"
                               >
                                   <Skeleton className="h-4 w-48" />
                                   <Skeleton className="mt-2 h-3 w-36" />
                                   <Skeleton className="mt-3 h-3 w-full" />
                                   <Skeleton className="mt-2 h-3 w-3/4" />
                               </div>
                           ))}
                       </>
                   ) : (
                       <>
                           {sorted.map((row) => {
                               const candidatos = normalizarCandidatos(row);
   
                               return (
                                   <button
                                       key={row.id_vacante}
                                       type="button"
                                       onClick={() => openEdit(row)}
                                       onContextMenu={(event) =>
                                           abrirMenuContextual(event, row)
                                       }
                                       className="rounded-3xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
                                       title="Clic para editar. Clic derecho para eliminar."
                                   >
                                       <div className="flex items-start justify-between gap-3">
                                           <div className="min-w-0">
                                               <div className="text-xs font-bold text-slate-400">
                                                   Vacante #{row.id_vacante}
                                               </div>
   
                                               <div className="mt-1 line-clamp-2 text-sm font-extrabold text-[#131E5C]">
                                                   {row.puesto || "Sin puesto"}
                                               </div>
   
                                               <div className="mt-1 text-xs text-slate-600">
                                                   {row.dealer || "Sin dealer"} • Solicitó: {row.solicitado_por || "—"}
                                               </div>
   
                                               <div className="mt-2 flex flex-wrap gap-2">
                                                   <BadgeFuente value={row.fuente_reclutamiento} />
                                                   <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">
                                                       {candidatos.length} candidatos
                                                   </span>
                                               </div>
   
                                               <div className="mt-2 text-xs text-slate-600">
                                                   Publicación: {formatDateTime(row.fecha_publicacion)}
                                               </div>
                                           </div>
   
                                           <BadgeEstatus value={row.estatus} />
                                       </div>
   
                                       <div className="mt-3 text-xs font-semibold text-slate-500">
                                           Toca para editar
                                       </div>
                                   </button>
                               );
                           })}
   
                           {!sorted.length ? (
                               <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">
                                   No hay vacantes con esos filtros.
                               </div>
                           ) : null}
                       </>
                   )}
               </div>
   
               <MenuContextual
                   menu={menuContextual}
                   onClose={() => setMenuContextual(null)}
                   onEliminar={eliminarVacante}
               />
   
               <Modal
                   open={openModal}
                   title={
                       mode === "create"
                           ? "Nueva vacante"
                           : `Editar vacante • ${draft?.id_vacante}`
                   }
                   onClose={closeModal}
                   footer={
                       <>
                           <button
                               type="button"
                               onClick={closeModal}
                               disabled={saving}
                               className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
                           >
                               <X className="h-4 w-4" />
                               Cancelar
                           </button>
   
                           <button
                               type="button"
                               onClick={save}
                               disabled={saving}
                               className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white/90 transition hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                           >
                               {saving ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                   <Save className="h-4 w-4" />
                               )}
   
                               {saving ? "Guardando..." : "Guardar vacante"}
                           </button>
                       </>
                   }
               >
                   {!draft ? null : (
                       <div className="space-y-4">
                           <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                               <div className="flex flex-wrap gap-2">
                                   <button
                                       type="button"
                                       onClick={() => setActiveTab("vacante")}
                                       className={cls(
                                           "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                                           activeTab === "vacante"
                                               ? "bg-[#131E5C] text-white"
                                               : "bg-slate-100 text-[#131E5C] hover:bg-slate-200"
                                       )}
                                   >
                                       <BriefcaseBusiness className="h-4 w-4" />
                                       Vacante
                                   </button>
   
                                   <button
                                       type="button"
                                       onClick={() => setActiveTab("candidatos")}
                                       className={cls(
                                           "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                                           activeTab === "candidatos"
                                               ? "bg-[#131E5C] text-white"
                                               : "bg-slate-100 text-[#131E5C] hover:bg-slate-200"
                                       )}
                                   >
                                       <Users className="h-4 w-4" />
                                       Candidatos ({normalizarCandidatos(draft).length})
                                   </button>
                               </div>
   
                               <button
                                   type="button"
                                   onClick={agregarCandidato}
                                   className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#131E5C]/20 bg-white px-4 py-2 text-sm font-black text-[#131E5C] shadow-sm transition hover:bg-slate-50"
                               >
                                   <UserPlus className="h-4 w-4" />
                                   Agregar candidato
                               </button>
                           </div>
   
                           {touchedSave && missing.length ? (
                               <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                   <div className="font-extrabold">
                                       Faltan campos obligatorios de la vacante
                                   </div>
   
                                   <div className="mt-1 text-xs font-semibold">
                                       {missing
                                           .map((key) => REQUIRED[key])
                                           .join(" • ")}
                                   </div>
                               </div>
                           ) : null}
   
                           {touchedSave && candidateErrors.length ? (
                               <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                   <div className="font-extrabold">
                                       Hay candidatos con información incompleta
                                   </div>
   
                                   <div className="mt-1 space-y-1 text-xs font-semibold">
                                       {candidateErrors.map((item) => (
                                           <div key={item.index}>
                                               {item.nombre}: {item.faltantes.map((key) => REQUIRED_CANDIDATE[key]).join(" • ")}
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           ) : null}
   
                           {activeTab === "vacante" ? (
                               <div className="grid gap-3 md:grid-cols-3">
                                   <Field label="ID Vacante" icon={ClipboardList}>
                                       <input
                                           value={draft.id_vacante || ""}
                                           disabled
                                           className={cls(
                                               inputBase,
                                               "cursor-not-allowed border-black/10 bg-neutral-100 opacity-80"
                                           )}
                                       />
   
                                       <p className="text-xs font-semibold text-slate-500">
                                           Folio numérico automático asignado por Django al guardar.
                                       </p>
                                   </Field>
   
                                   <Field
                                       label="Estatus de la vacante"
                                       icon={BriefcaseBusiness}
                                   >
                                       <select
                                           value={draft.estatus || ""}
                                           onChange={(event) =>
                                               updateDraftField("estatus", event.target.value)
                                           }
                                           className={cls(
                                               inputBase,
                                               isInvalid("estatus") ? inputBad : inputOk
                                           )}
                                       >
                                           {ESTATUS_VACANTE.map((estatus) => (
                                               <option key={estatus} value={estatus}>
                                                   {estatus}
                                               </option>
                                           ))}
                                       </select>
   
                                       <BadgeEstatus value={draft.estatus} />
                                   </Field>
   
                                   <Field label="Dealer" icon={Building2}>
                                        <select
                                            value={draft.dealer || ""}
                                            onChange={(event) => updateDraftField("dealer", event.target.value)}
                                            disabled={!isAdmin && userAgencias.length <= 1}
                                            className={cls(
                                                inputBase,
                                                isInvalid("dealer") ? inputBad : inputOk,
                                                !isAdmin && userAgencias.length <= 1 ? "opacity-75 cursor-not-allowed" : ""
                                            )}
                                        >
                                            <option value="">Selecciona un dealer...</option>
                                            {(isAdmin ? DEALERS_VW : userAgencias).map((dealer) => (
                                                <option key={dealer} value={dealer}>{dealer}</option>
                                            ))}
                                        </select>
                                    </Field>
   
                                   <div className="md:col-span-2">
                                       <Field label="Puesto" icon={BriefcaseBusiness}>
                                           <select
                                               value={draft.puesto || ""}
                                               onChange={(event) =>
                                                   updateDraftField("puesto", event.target.value)
                                               }
                                               className={cls(
                                                   inputBase,
                                                   isInvalid("puesto") ? inputBad : inputOk
                                               )}
                                           >
                                               <option value="">
                                                   Selecciona un puesto...
                                               </option>
   
                                               {PUESTOS.map((puesto) => (
                                                   <option key={puesto} value={puesto}>
                                                       {puesto}
                                                   </option>
                                               ))}
                                           </select>
                                       </Field>
                                   </div>
   
                                   <Field label="Fuente de reclutamiento" icon={Search}>
                                       <select
                                           value={draft.fuente_reclutamiento || ""}
                                           onChange={(event) =>
                                               updateDraftField("fuente_reclutamiento", event.target.value)
                                           }
                                           className={cls(
                                               inputBase,
                                               isInvalid("fuente_reclutamiento") ? inputBad : inputOk
                                           )}
                                       >
                                           <option value="">Selecciona una fuente...</option>
   
                                           {FUENTES_RECLUTAMIENTO.map((fuente) => (
                                               <option key={fuente} value={fuente}>
                                                   {fuente}
                                               </option>
                                           ))}
                                       </select>
   
                                       <p className="text-xs font-semibold text-slate-500">
                                           Esta fuente se usa como valor sugerido al agregar candidatos.
                                       </p>
                                   </Field>
   
                                   <Field label="Solicitado por" icon={User}>
                                       <input
                                           value={draft.solicitado_por || ""}
                                           onChange={(event) =>
                                               updateDraftField("solicitado_por", event.target.value)
                                           }
                                           placeholder="Nombre de quien solicita la vacante"
                                           className={cls(
                                               inputBase,
                                               isInvalid("solicitado_por")
                                                   ? inputBad
                                                   : inputOk
                                           )}
                                       />
                                   </Field>
   
                                   <Field label="Fecha de publicación" icon={CalendarDays}>
                                       <input
                                           value={
                                               draft.fecha_publicacion
                                                   ? formatDateTime(
                                                       draft.fecha_publicacion
                                                   )
                                                   : "Se asignará al guardar"
                                           }
                                           disabled
                                           className={cls(
                                               inputBase,
                                               "cursor-not-allowed border-black/10 bg-neutral-100 opacity-80"
                                           )}
                                       />
   
                                       <p className="text-xs font-semibold text-slate-500">
                                           Se marca automáticamente al crear la vacante.
                                       </p>
                                   </Field>
   
                                   <Field label="Fecha de cierre" icon={CalendarDays}>
                                       <input
                                           value={
                                               draft.fecha_cierre
                                                   ? formatDateTime(draft.fecha_cierre)
                                                   : draft.estatus === "Cerrada"
                                                       ? "Se asignará al guardar"
                                                       : "Sin cierre"
                                           }
                                           disabled
                                           className={cls(
                                               inputBase,
                                               "cursor-not-allowed border-black/10 bg-neutral-100 opacity-80"
                                           )}
                                       />
   
                                       <p className="text-xs font-semibold text-slate-500">
                                           Se marca automáticamente cuando el estatus sea Cerrada.
                                       </p>
                                   </Field>
                               </div>
                           ) : null}
   
                           {activeTab === "candidatos" ? (
                               <div className="space-y-3">
                                   {!normalizarCandidatos(draft).length ? (
                                       <div className="rounded-3xl border border-dashed border-[#131E5C]/25 bg-white p-8 text-center shadow-sm">
                                           <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#131E5C]/10 text-[#131E5C]">
                                               <Users className="h-7 w-7" />
                                           </div>
   
                                           <h3 className="mt-4 text-base font-black text-[#131E5C]">
                                               Todavía no hay candidatos
                                           </h3>
   
                                           <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
                                               Agrega candidatos para controlar sus datos, fuente y fechas de avance en cada etapa del proceso.
                                           </p>
   
                                           <button
                                               type="button"
                                               onClick={agregarCandidato}
                                               className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#131E5C]/85"
                                           >
                                               <UserPlus className="h-4 w-4" />
                                               Agregar primer candidato
                                           </button>
                                       </div>
                                   ) : null}
   
                                   {normalizarCandidatos(draft).map((candidato, index) => {
                                       const isOpen = expandedCandidate === candidato.id_temporal;
                                       const progreso = obtenerProgresoCandidato(candidato);
                                       const errorCandidato = candidateErrors.find(
                                           (item) => item.index === index
                                       );
   
                                       return (
                                           <div
                                               key={candidato.id_temporal || index}
                                               className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
                                           >
                                               <button
                                                   type="button"
                                                   onClick={() =>
                                                       setExpandedCandidate(isOpen ? null : candidato.id_temporal)
                                                   }
                                                   className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-slate-50 xl:flex-row xl:items-center xl:justify-between"
                                               >
                                                   <div className="min-w-0 flex-1">
                                                       <div className="flex flex-wrap items-center gap-2">
                                                           <div className="text-sm font-black text-[#131E5C]">
                                                               {candidato.nombre || `Candidato ${index + 1}`}
                                                           </div>
                                                           <BadgeCandidato value={candidato.estatus} />
                                                           <BadgeFuente value={candidato.fuente} />
                                                           {errorCandidato ? (
                                                               <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">
                                                                   Incompleto
                                                               </span>
                                                           ) : null}
                                                       </div>
   
                                                       <div className="mt-2 grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                                                           <span className="inline-flex items-center gap-1">
                                                               <Phone className="h-3.5 w-3.5" />
                                                               {candidato.telefono || "Sin teléfono"}
                                                           </span>
                                                           <span className="inline-flex items-center gap-1">
                                                               <Mail className="h-3.5 w-3.5" />
                                                               {candidato.correo || "Sin correo"}
                                                           </span>
                                                           <span className="inline-flex items-center gap-1">
                                                               <MapPin className="h-3.5 w-3.5" />
                                                               {candidato.ubicacion || "Sin ubicación"}
                                                           </span>
                                                           <span className="inline-flex items-center gap-1">
                                                               <CalendarDays className="h-3.5 w-3.5" />
                                                               {obtenerEtapaActual(candidato)}
                                                           </span>
                                                       </div>
                                                   </div>
   
                                                   <div className="w-full xl:w-64">
                                                       <div className="mb-1 flex items-center justify-between text-xs font-black text-[#131E5C]">
                                                           <span>Avance</span>
                                                           <span>{progreso}%</span>
                                                       </div>
                                                       <ProgressBar value={progreso} />
                                                   </div>
                                               </button>
                                                {isOpen ? (
                                                    <div className="border-t border-black/10 bg-slate-50 p-2">
                                                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                            <div>
                                                                <h3 className="text-sm font-black text-[#131E5C]">Expediente del candidato</h3>
                                                                <p className="text-xs font-semibold text-slate-500">Captura datos generales y fechas reales de cada avance.</p>
                                                            </div>
                                                            <button onClick={() => eliminarCandidato(index)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-2 py-1 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-50">
                                                                <Trash2 className="h-3 w-3" /> Eliminar candidato
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {/* DATOS DEL CANDIDATO - HORIZONTAL */}
                                                            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                                                                <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#131E5C]">
                                                                    <User className="h-3 w-3" /> Datos del candidato
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Nombre *</span>
                                                                        <input value={candidato.nombre || ""} onChange={e => actualizarCandidato(index, "nombre", e.target.value)} placeholder="Nombre completo" className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("nombre") ? inputBad : inputOk)} />
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Sexo *</span>
                                                                        <select value={candidato.sexo || ""} onChange={e => actualizarCandidato(index, "sexo", e.target.value)} className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("sexo") ? inputBad : inputOk)}>
                                                                            <option value="">Selecciona...</option>
                                                                            {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
                                                                        </select>
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Teléfono *</span>
                                                                        <input value={candidato.telefono || ""} onChange={e => actualizarCandidato(index, "telefono", e.target.value)} placeholder="Ej. 2711234567" className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("telefono") ? inputBad : inputOk)} />
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Correo *</span>
                                                                        <input type="email" value={candidato.correo || ""} onChange={e => actualizarCandidato(index, "correo", e.target.value)} placeholder="correo@ejemplo.com" className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("correo") ? inputBad : inputOk)} />
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Ubicación *</span>
                                                                        <input value={candidato.ubicacion || ""} onChange={e => actualizarCandidato(index, "ubicacion", e.target.value)} placeholder="Ciudad / Estado" className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("ubicacion") ? inputBad : inputOk)} />
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Puesto *</span>
                                                                        <select value={candidato.puesto_postulado || ""} onChange={e => actualizarCandidato(index, "puesto_postulado", e.target.value)} className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("puesto_postulado") ? inputBad : inputOk)}>
                                                                            <option value="">Selecciona puesto...</option>
                                                                            {PUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
                                                                        </select>
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Fuente *</span>
                                                                        <select value={candidato.fuente || ""} onChange={e => actualizarCandidato(index, "fuente", e.target.value)} className={cls(inputBase, touchedSave && errorCandidato?.faltantes.includes("fuente") ? inputBad : inputOk)}>
                                                                            <option value="">Selecciona fuente...</option>
                                                                            {FUENTES_RECLUTAMIENTO.map(f => <option key={f} value={f}>{f}</option>)}
                                                                        </select>
                                                                    </label>
                                                                    <label className="block">
                                                                        <span className="mb-0.5 block text-[11px] font-black text-slate-500">Estatus</span>
                                                                        <select value={candidato.estatus || "Nuevo"} onChange={e => actualizarCandidato(index, "estatus", e.target.value)} className={modalInputCls}>
                                                                            {ESTATUS_CANDIDATO.map(e => <option key={e} value={e}>{e}</option>)}
                                                                        </select>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            {/* CV DEL CANDIDATO */}
                                                            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                                                                <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#131E5C]">
                                                                    <FileText className="h-3 w-3" />
                                                                    Currículum Vitae
                                                                </div>

                                                                <p className="mb-3 text-[11px] font-semibold text-slate-500">
                                                                    Adjunta el CV del candidato en formato PDF.
                                                                </p>

                                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf"
                                                                        onChange={(e) => {
                                                                            const archivo = e.target.files?.[0];

                                                                            if (!archivo) return;

                                                                            actualizarCandidato(
                                                                                index,
                                                                                "cv_nombre",
                                                                                archivo.name
                                                                            );

                                                                            actualizarCandidato(
                                                                                index,
                                                                                "cv_archivo",
                                                                                archivo
                                                                            );
                                                                        }}
                                                                        className="block w-full text-sm text-slate-600
                                                                        file:mr-4 file:rounded-lg file:border-0
                                                                        file:bg-[#131E5C] file:px-4 file:py-2
                                                                        file:text-sm file:font-bold
                                                                        file:text-white hover:file:bg-[#0f174a]"
                                                                    />

                                                                    {candidato.cv_nombre && (
                                                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                                                            ✓ {candidato.cv_nombre}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* FECHAS POR ETAPA */}
                                                            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                                                                <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#131E5C]">
                                                                    <CalendarDays className="h-3 w-3" /> Fechas por etapa
                                                                </div>
                                                                <p className="text-[11px] font-semibold text-slate-500 mb-2">Usa una fecha por cada avance. Los campos vacíos representan pendientes.</p>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                    <DateField label="Entrevista DO" value={candidato.fecha_entrevista_do} onChange={v => actualizarCandidato(index, "fecha_entrevista_do", v)} inputClassName={modalInputCls} />
                                                                    <DateField label="Entrevista gerente" value={candidato.fecha_entrevista_gerente} onChange={v => actualizarCandidato(index, "fecha_entrevista_gerente", v)} inputClassName={modalInputCls} />
                                                                    <DateField label="Respuesta gerente" value={candidato.fecha_respuesta_gerente} onChange={v => actualizarCandidato(index, "fecha_respuesta_gerente", v)} inputClassName={modalInputCls} />
                                                                    <DateField label="Alta KHOR" value={candidato.fecha_alta_khor} onChange={v => actualizarCandidato(index, "fecha_alta_khor", v)} inputClassName={modalInputCls} />
                                                                    <DateField label="Realización KHOR" value={candidato.fecha_realizacion_khor} onChange={v => actualizarCandidato(index, "fecha_realizacion_khor", v)} inputClassName={modalInputCls} />
                                                                    <DateField label="Entrega resultados KHOR" value={candidato.fecha_entrega_resultados_khor} onChange={v => actualizarCandidato(index, "fecha_entrega_resultados_khor", v)} inputClassName={modalInputCls} />
                                                                </div>
                                                            </div>

                                                                                                                        {/* ========== CRONOGRAMA DE ETAPAS ========== */}
                                                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                                                <div className="mb-5 flex items-center gap-2">
                                                                    <div className="h-5 w-1 bg-[#131E5C] rounded-full"></div>
                                                                    <h4 className="text-sm font-black text-[#131E5C] uppercase tracking-wide">Cronograma de etapas</h4>
                                                                </div>
                                                                
                                                                <div className="relative">
                                                                    {/* Línea horizontal en el medio */}
                                                                    <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-300"></div>
                                                                    
                                                                    <div className="relative flex justify-between">
                                                                        {/* ETAPA 1 - ARRIBA */}
                                                                        <div className="flex flex-col items-center text-center" style={{ width: '23%' }}>
                                                                            <div className={`relative z-10 w-4 h-4 rounded-full ${candidato.fecha_primera_entrevista ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-400 ring-4 ring-gray-100'}`}></div>
                                                                            <div className="mt-2">
                                                                                <div className="text-[10px] font-bold text-gray-400 uppercase">ETAPA 1</div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* ETAPA 2 - ARRIBA */}
                                                                        <div className="flex flex-col items-center text-center" style={{ width: '23%' }}>
                                                                            <div className={`relative z-10 w-4 h-4 rounded-full ${candidato.fecha_segunda_entrevista ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-400 ring-4 ring-gray-100'}`}></div>
                                                                            <div className="mt-2">
                                                                                <div className="text-[10px] font-bold text-gray-400 uppercase">ETAPA 2</div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* ETAPA 3 - ARRIBA */}
                                                                        <div className="flex flex-col items-center text-center" style={{ width: '23%' }}>
                                                                            <div className={`relative z-10 w-4 h-4 rounded-full ${candidato.fecha_prueba_khor ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-400 ring-4 ring-gray-100'}`}></div>
                                                                            <div className="mt-2">
                                                                                <div className="text-[10px] font-bold text-gray-400 uppercase">ETAPA 3</div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* RESULTADO - ARRIBA */}
                                                                        <div className="flex flex-col items-center text-center" style={{ width: '23%' }}>
                                                                            <div className={`relative z-10 w-4 h-4 rounded-full ${
                                                                                candidato.estatus_linea_tiempo === 'seleccionado' ? 'bg-emerald-500 ring-4 ring-emerald-100' :
                                                                                candidato.estatus_linea_tiempo === 'descalificado' ? 'bg-red-500 ring-4 ring-red-100' : 'bg-gray-400 ring-4 ring-gray-100'
                                                                            }`}></div>
                                                                            <div className="mt-2">
                                                                                <div className="text-[10px] font-bold text-gray-400 uppercase">RESULTADO</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Contenido debajo de la línea */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                                                    {/* Contenido ETAPA 1 */}
                                                                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                                                        <div className="text-sm font-bold text-gray-800">Primera Entrevista</div>
                                                                        <input 
                                                                            type="date" 
                                                                            value={candidato.fecha_primera_entrevista || ''} 
                                                                            onChange={e => actualizarCandidato(index, "fecha_primera_entrevista", e.target.value)}
                                                                            className="w-full text-center text-xs p-1.5 border border-gray-200 rounded-lg mt-2 bg-white focus:border-[#131E5C] focus:outline-none"
                                                                        />
                                                                        {candidato.fecha_primera_entrevista && (
                                                                            <div className="text-[10px] font-semibold text-emerald-600 mt-1">✓ Completado</div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Contenido ETAPA 2 */}
                                                                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                                                        <div className="text-sm font-bold text-gray-800">Segunda Entrevista</div>
                                                                        <input 
                                                                            type="date" 
                                                                            value={candidato.fecha_segunda_entrevista || ''} 
                                                                            onChange={e => actualizarCandidato(index, "fecha_segunda_entrevista", e.target.value)}
                                                                            className="w-full text-center text-xs p-1.5 border border-gray-200 rounded-lg mt-2 bg-white focus:border-[#131E5C] focus:outline-none"
                                                                        />
                                                                        {candidato.fecha_segunda_entrevista && (
                                                                            <div className="text-[10px] font-semibold text-emerald-600 mt-1">✓ Completado</div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Contenido ETAPA 3 */}
                                                                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                                                        <div className="text-sm font-bold text-gray-800">Prueba KHOR</div>
                                                                        <input 
                                                                            type="date" 
                                                                            value={candidato.fecha_prueba_khor || ''} 
                                                                            onChange={e => actualizarCandidato(index, "fecha_prueba_khor", e.target.value)}
                                                                            className="w-full text-center text-xs p-1.5 border border-gray-200 rounded-lg mt-2 bg-white focus:border-[#131E5C] focus:outline-none"
                                                                        />
                                                                        {candidato.fecha_prueba_khor && (
                                                                            <div className="text-[10px] font-semibold text-emerald-600 mt-1">✓ Completado</div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Contenido RESULTADO */}
                                                                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                                                                        <div className="text-sm font-bold text-gray-800">Estatus final</div>
                                                                        <select 
                                                                            value={candidato.estatus_linea_tiempo || 'en proceso'} 
                                                                            onChange={e => actualizarCandidato(index, "estatus_linea_tiempo", e.target.value)}
                                                                            className="w-full text-center text-xs p-1.5 border border-gray-200 rounded-lg mt-2 bg-white focus:border-[#131E5C] focus:outline-none"
                                                                        >
                                                                            <option value="en proceso">En proceso</option>
                                                                            <option value="seleccionado">Seleccionado</option>
                                                                            <option value="descalificado">Descalificado</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Motivo de descalificación */}
                                                                {candidato.estatus_linea_tiempo === 'descalificado' && (
                                                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                                                            <span className="text-[11px] font-black text-red-700 uppercase tracking-wide">Motivo de descalificación</span>
                                                                        </div>
                                                                        <select 
                                                                            value={candidato.motivo_descalificacion || ''} 
                                                                            onChange={e => actualizarCandidato(index, "motivo_descalificacion", e.target.value)}
                                                                            className="w-full text-sm p-2 border border-red-200 rounded-lg bg-white focus:border-red-400 focus:outline-none"
                                                                        >
                                                                            <option value="">Selecciona un motivo...</option>
                                                                            <option value="no_cumple_requerimientos">No cumple requerimientos</option>
                                                                            <option value="no_alcanza_pretensiones">No se alcanzan pretensiones económicas</option>
                                                                            <option value="mejor_perfil">Otro candidato mejor perfilado</option>
                                                                            <option value="propenso_robo">Propenso al robo</option>
                                                                            <option value="bajo_psicometria">Bajo resultado en psicometría</option>
                                                                            {/* ========== NUEVOS MOTIVOS ========== */}
                                                                            <option value="falta_interes">Falta de interés</option>
                                                                            <option value="escala_valores">No recomendable por su escala de valores</option>
                                                                            <option value="deserta_voluntariamente">Deserta voluntariamente</option>
                                                                        </select>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* COMENTARIOS */}
                                                            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-sm">
                                                                <label className="block">
                                                                    <span className="mb-0.5 flex items-center gap-1 text-[11px] font-black text-slate-500">
                                                                        <FileText className="h-3 w-3" /> Comentarios / seguimiento
                                                                    </span>
                                                                    <textarea value={candidato.comentarios || ""} onChange={e => actualizarCandidato(index, "comentarios", e.target.value)} rows={2} placeholder="Observaciones..." className={cls(inputBase, inputOk, "min-h-[60px] resize-y text-sm")} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}
                                           </div>
                                       );
                                   })}
                               </div>
                           ) : null}
                       </div>
                   )}
               </Modal>
           </div>
       );
    }