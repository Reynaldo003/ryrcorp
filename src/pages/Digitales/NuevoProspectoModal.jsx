import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Activity, Building2, CalendarDays, Car, CarFront, ChevronLeft, ClipboardCheck, FileText, LayoutTemplate, Loader2, MessageSquareShare, Paperclip, Save, UploadCloud, User, Van, X } from "lucide-react";
import CONCESIONARIO from "/concesionario.png";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import PHONE from "/phone.svg";
import { api } from "../../lib/apiPruebas";
import { ASESORES_PISO } from "./asesoresPiso";
import MotivoDescalificacionPicker from "./MotivoDescalificacionPicker";
import { ETIQUETAS_ESTADO, estadoAutomaticoBandeja, tieneCalificacionRapida, citaEsNoAsistio } from "./estadosProspecto";

const DEALERS = ["VW Cordoba", "VW Cordoba Usados", "VW Orizaba", "VW Orizaba Usados", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Automotriz R&R"];
const ASESORES_DIGITALES = ["Lizbeth Cano Clara", "Erendira Santos Coyotzi", "Marelly Tenorio Salinas", "IA Vagen", "Edgar Omar Noguera Solis", "Dulce Abigail Garcia Olivares", "Bianca Isabel Chavez Alarcon", "Candy Denisse Marquez", "Julio Ramirez Lopez"];
const VEHICULOS = ["Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter"];
const ANIOS_VEHICULO = Array.from({ length: 2030 - 2018 + 1 }, (_, i) => 2030 - i);
const BURO_OPTIONS = [{ value: "", label: "— Selecciona —" }, { value: "bueno", label: "Bueno" }, { value: "regular", label: "Regular" }, { value: "iniciando", label: "Iniciando" }, { value: "desconocido", label: "Desconocido" }];
const SOLICITUD_CREDITO = [{ value: "", label: "— Selecciona —" }, { value: "autorizado", label: "Autorizado" }, { value: "rechazado", label: "Rechazado" }, { value: "condicionado", label: "Condicionado" }];
const FORMA_PAGO_OPTIONS = [{ value: "", label: "— Selecciona —" }, { value: "contado", label: "Contado" }, { value: "credito", label: "Crédito" }, { value: "arrendamiento", label: "Arrendamiento" }, { value: "desconocido", label: "Desconocido" }];
const TIPO_CLIENTE_OPTIONS = [{ value: "", label: "— Selecciona —" }, { value: "persona_fisica", label: "Persona física" }, { value: "persona_moral", label: "Persona moral" }, { value: "desconocido", label: "Desconocido" }];
const PLAZO_COMPRA_OPTIONS = ["", "Inmediato", "Esta semana", "Este mes", "1 a 3 meses", "3 a 6 meses", "Más de 6 meses", "Sin definir"];
const PAUTAS_BASE = ["Facebook Ads", "Google Ads", "Instagram Ads", "Orgánico", "Referido", "WhatsApp", "Evento", "Otro"];
const NUMERO_TUXTEPEC = "522871232641";
const ASESOR_TUXTEPEC_POR_USUARIO = { adtuxte: "Marelly Tenorio Salinas", juliorl: "Julio Ramirez Lopez" };
const CONTEXTO_POR_NUMERO = {
    "522712638803": { asesor_digital: "IA Vagen", agencia: "VW Cordoba" }, "522721111244": { asesor_digital: "Lizbeth Cano Clara", agencia: "VW Orizaba" },
    "522713133332": { asesor_digital: "Erendira Santos Coyotzi", agencia: "VW Cordoba" }, "522871232641": { asesor_digital: "", agencia: "VW Tuxtepec" },
    "527831263814": { asesor_digital: "Edgar Omar Noguera Solis", agencia: "VW Tuxpan" }, "527821820706": { asesor_digital: "Dulce Abigail Garcia Olivares", agencia: "VW Poza Rica" },
    "522712837999": { asesor_digital: "Bianca Isabel Chavez Alarcon", agencia: "VW Cordoba Usados" }, "522721986539": { asesor_digital: "Candy Denisse Marquez", agencia: "VW Orizaba Usados" },
};
const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;
const lineaMeta = { Nuevos: { Icon: Car, label: "Nuevos" }, Usados: { Icon: CarFront, label: "Usados" }, Comerciales: { Icon: Van, label: "Comerciales" } };
const origenMeta = {
    "VW-Concesionarios": { Icon: ImgIcon(CONCESIONARIO, "VW-Concesionarios"), label: "VW-Concesionarios" }, WhatsApp: { Icon: ImgIcon(WAP, "WhatsApp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" }, "Llamada Entrante": { Icon: ImgIcon(PHONE, "Llamada Entrante"), label: "Llamada Entrante" },
};

function cls(...items) { return items.filter(Boolean).join(" "); }
function normalizeText(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase(); }
function normalizaTelefonoMx(tel) { const d = String(tel || "").replace(/\D/g, ""); if (!d) return ""; if (d.startsWith("521") && d.length === 13) return `52${d.slice(3)}`; if (d.length === 10) return `52${d}`; return d; }
function toNullableNumber(value) { const n = Number(String(value ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(n) && n > 0 ? Math.round(n) : null; }
function getUsuarioCrm(user) { return normalizeText(user?.usuario || user?.username || user?.user || user?.nombre_usuario || ""); }
function getContexto(numero, user) { const n = normalizaTelefonoMx(numero), base = CONTEXTO_POR_NUMERO[n] || { asesor_digital: "", agencia: "" }; return n === NUMERO_TUXTEPEC ? { ...base, asesor_digital: ASESOR_TUXTEPEC_POR_USUARIO[getUsuarioCrm(user)] || "" } : base; }
function getAgenciasUsuario(user) { return String(user?.agencia || "").split("|").map((a) => a.trim()).filter(Boolean); }
function fmtDTIntl(value) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d); }
function tieneNombreReal(value) { const t = normalizeText(value); return Boolean(t && t !== "sin nombre"); }
function normalizarPautas(response) {
    const raw = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : Array.isArray(response?.results) ? response.results : [];
    const values = raw.map((item) => typeof item === "string" ? item : item?.value || item?.label || item?.pauta || item?.pauta_origen || item?.nombre || item?.name || item?.campana || item?.campaign_name || item?.campaign || item?.ad_name || "").map((v) => String(v || "").trim()).filter(Boolean);
    const seen = new Set(); return [...values, ...PAUTAS_BASE].filter((v) => { const k = normalizeText(v); if (!k || seen.has(k)) return false; seen.add(k); return true; });
}
function normalizarEvidencia(item = {}) {
    const url = item.previewUrl || item.url || item.archivo_url || item.file_url || item.archivo || "";
    const type = item.type || item.mime_type || item.content_type || "";
    return { ...item, name: item.name || item.nombre || item.filename || item.archivo_nombre || "Archivo", url, previewUrl: type.startsWith("image/") ? url : item.previewUrl || "", type, size: item.size || item.tamano || 0 };
}
function getTemplateComponentType(component = {}) { return String(component.type || "").toLowerCase(); }
function replaceMetaVariables(text, componentType, values) { return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, i) => String(values?.[`${componentType}_${i}`] ?? "").trim()); }
function interpolateNumberedText(text, fields, values) { const vals = (fields || []).map((f) => String(values?.[f.key] || "").trim()); return String(text || "").replace(/\((\d+)\)/g, (_, i) => vals[Number(i) - 1] || ""); }
function buildTemplatePreviewText(template, values) {
    if (!template) return ""; const components = Array.isArray(template.components_meta) ? template.components_meta : [];
    const meta = components.filter((c) => ["header", "body", "footer"].includes(getTemplateComponentType(c)) && String(c.text || "").trim()).map((c) => replaceMetaVariables(c.text, getTemplateComponentType(c), values)).filter(Boolean).join("\n");
    return meta || interpolateNumberedText(template.help || "", template.fields || [], values);
}
function getTemplateFieldOptions(field) { if (Array.isArray(field?.options) && field.options.length) return field.options; const l = normalizeText(field?.label), k = normalizeText(field?.key); if (l.includes("dealer") || l.includes("agencia") || k.includes("dealer") || k.includes("agencia")) return DEALERS; if (l.includes("canal") || k.includes("canal")) return Object.keys(origenMeta); return []; }
function getDefaultTemplateFieldValue(field, context) {
    const l = normalizeText(field?.label), k = normalizeText(field?.key);
    if (l.includes("asesor") || k.includes("asesor") || l.includes("quien eres")) return context.asesor || "";
    if (l.includes("nombre") || l.includes("prospecto") || l.includes("cliente") || k.includes("nombre")) return context.nombre || "";
    if (l.includes("dealer") || l.includes("agencia") || k.includes("dealer") || k.includes("agencia")) return context.agencia || "";
    if (l.includes("modelo") || l.includes("auto") || l.includes("vehiculo") || k.includes("modelo") || k.includes("auto")) return context.modelo || "";
    if (l.includes("canal") || k.includes("canal")) return context.canal || ""; if (l.includes("tema") || k.includes("tema")) return context.tema || ""; if (l.includes("dato") || k.includes("dato")) return context.dato || ""; return "";
}
function buildDynamicTemplateComponents(template, values) {
    const grouped = (Array.isArray(template?.fields) ? template.fields : []).reduce((acc, f) => { const c = String(f.component || "body").toLowerCase(); (acc[c] ||= []).push(f); return acc; }, {});
    return Object.entries(grouped).map(([type, items]) => ({ type, parameters: items.sort((a, b) => Number(a.index || 0) - Number(b.index || 0)).map((f) => ({ type: "text", text: String(values?.[f.key] || "").trim() })) })).filter((c) => c.parameters.length);
}
function crearDraftInicial(numeroAsesor, user, isAdmin) {
    const contexto = getContexto(numeroAsesor, user), agenciasUsuario = getAgenciasUsuario(user);
    return { id_exp: null, agencia: contexto.agencia || (!isAdmin && agenciasUsuario.length === 1 ? agenciasUsuario[0] : ""), anio_auto: "", tiene_nombre: false, nombre_cliente: "", telefono: "", correo: "", linea: "", origen: "", pauta: "", estado: "Contactado", motivo_descalificacion: "", cliente_interes: "", comentarios: "", resumen: "", resumen_actualizado_at: "", resumen_fuente: "", asesor_digital: contexto.asesor_digital || "", asesor_solicita: "", primer_contacto_at: null, ultimo_contacto_at: null, enganche_monto: "", presupuesto_mensual: "", buro_estado: "", forma_pago: "", tipo_cliente: "", uso_vehiculo: "", plazo_compra: "", comprobacion_ingresos: "", id_cotizacion: "", folio_solicitud_credito: "", solicitud_credito_estado: "", vin_facturado: "", vin_estatus_entrega: "", evidencias_existentes: [], evidencias_nuevas: [], delete_evidencia_ids: [] };
}
function draftDesdeApi(p, evidencias, estadoInicial = "") {
    const nombre = String(p?.nombre || "").trim(), tieneNombre = tieneNombreReal(nombre), estado = estadoInicial || p?.estado || "Contactado";
    return { id_exp: p?.id || p?.id_exp || null, agencia: p?.agencia || "", anio_auto: p?.anio_auto || "", tiene_nombre: tieneNombre, nombre_cliente: tieneNombre ? nombre : "", telefono: String(p?.telefono || ""), correo: p?.correo || "", linea: p?.business || "", origen: p?.canal_contacto || "", pauta: p?.pauta || "", estado, motivo_descalificacion: normalizeText(estado) === "descalificado" ? p?.motivo_descalificacion || "" : "", cliente_interes: p?.auto_interes || "", comentarios: p?.comentarios || "", resumen: p?.resumen || "", resumen_actualizado_at: p?.resumen_actualizado_at || "", resumen_fuente: p?.resumen_fuente || "", asesor_digital: p?.asesor_digital || "", asesor_solicita: p?.asesor_ventas || "", primer_contacto_at: p?.primer_mensaje_cliente || p?.primer_contacto_at || null, ultimo_contacto_at: p?.ultimo_contacto_asesor || p?.ultimo_contacto_at || null, enganche_monto: p?.enganche_monto || "", presupuesto_mensual: p?.presupuesto_mensual || "", buro_estado: p?.buro_estado || "", forma_pago: p?.forma_pago || "", tipo_cliente: p?.tipo_cliente || "", uso_vehiculo: p?.uso_vehiculo || "", plazo_compra: p?.plazo_compra || "", comprobacion_ingresos: p?.comprobacion_ingresos || "", id_cotizacion: p?.id_cotizacion || "", folio_solicitud_credito: p?.folio_solicitud_credito || "", solicitud_credito_estado: p?.solicitud_credito_estado || "", vin_facturado: p?.vin_facturado || "", vin_estatus_entrega: p?.vin_estatus_entrega || "", evidencias_existentes: (Array.isArray(evidencias) ? evidencias : Array.isArray(evidencias?.results) ? evidencias.results : []).map(normalizarEvidencia), evidencias_nuevas: [], delete_evidencia_ids: [] };
}

function ModalBase({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(<div className="fixed inset-0 z-[250]"><div className="absolute inset-0 bg-black/45" onClick={onClose} /><div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4"><div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-xl"><div className="flex shrink-0 items-center justify-between gap-3 bg-[#131E5C] px-5 py-4"><div className="truncate text-base font-extrabold text-white">{title}</div><button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 [scrollbar-gutter:stable]">{children}</div>{footer ? <div className="flex shrink-0 flex-col gap-2 border-t border-[#131E5C]/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div> : null}</div></div></div>, document.body);
}
function Field({ label, icon: Icon, children }) { return <div className="h-full rounded-lg border border-white/10 bg-neutral-200/50 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#131E5C]">{Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}<span>{label}</span></div><div className="space-y-3">{children}</div></div>; }
function LineaPicker({ value, onChange }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(lineaMeta).map(([key, meta]) => { const active = value === key, Icon = meta.Icon; return <button key={key} type="button" onClick={() => onChange(key)} className={cls("flex h-14 w-full items-center justify-center gap-2 rounded-xl border px-4 transition", active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/20" : "border-black/10 bg-neutral-50 hover:bg-white")}><span className={cls("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white")}><Icon className="h-4 w-4 text-[#131E5C]" /></span><span className="truncate text-sm font-semibold text-[#131E5C]">{meta.label}</span></button>; })}</div>; }
function OrigenPicker({ value, onChange }) { return <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">{Object.entries(origenMeta).map(([key, meta]) => { const active = value === key, Icon = meta.Icon; return <button key={key} type="button" onClick={() => onChange(key)} className={cls("flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition", active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/20" : "border-black/10 bg-neutral-50 hover:bg-white")}><div className={cls("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white")}><Icon className="h-5 w-5" /></div><div className="truncate text-sm font-semibold text-[#131E5C]">{meta.label}</div></button>; })}</div>; }
function EvidenceCard({ item, onRemove }) {
    const isImage = String(item.type || "").startsWith("image/") || Boolean(item.previewUrl), isExistente = Boolean(item.id && !item._tmpId), url = item.previewUrl || item.url || "", sizeKB = item.size ? Math.round(item.size / 1024) : 0;
    return <div className="relative flex items-start gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-slate-100">{isImage && url ? <img src={url} alt={item.name || "Evidencia"} className="h-full w-full object-cover" /> : <Paperclip className="h-6 w-6 text-slate-400" />}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-[#131E5C]">{item.name || "Archivo"}</div>{sizeKB ? <div className="mt-0.5 text-[11px] text-slate-400">{sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`}</div> : null}{isExistente && url ? <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex text-[11px] font-semibold text-sky-600 hover:underline">Ver archivo</a> : null}{!isExistente ? <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Nueva</span> : null}</div><button type="button" onClick={onRemove} className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"><X className="h-3.5 w-3.5" /></button></div>;
}
function Skeleton({ className = "" }) { return <div className={cls("animate-pulse rounded-md bg-black/10", className)} />; }
function ModalSkeleton() { return <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"><Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-10 w-full" /></div>)}</div>; }

export default function NuevoProspectoModal({ open, mode = "create", prospectoId = null, estadoInicial = "", onClose, onCreado, onActualizado, onGuardado, onPlantillaEnviada, numeroAsesor = "", user = null, isAdmin = false, requestContext = {}, tieneChatInicial = false }) {
    const navigate = useNavigate(), esEdicion = mode === "edit", fileInputRef = useRef(null), ultimaFirmaGuardadaRef = useRef(""), ultimoProspectoRef = useRef(null);
    const [draft, setDraft] = useState(() => crearDraftInicial(numeroAsesor, user, isAdmin));
    const [loadingDetail, setLoadingDetail] = useState(false), [saving, setSaving] = useState(false), [touched, setTouched] = useState(false), [error, setError] = useState("");
    const [pautas, setPautas] = useState(PAUTAS_BASE), [loadingPautas, setLoadingPautas] = useState(false), [chatDisponible, setChatDisponible] = useState(tieneChatInicial);
    const [showTemplates, setShowTemplates] = useState(false), [tplSelected, setTplSelected] = useState(null), [tplDraft, setTplDraft] = useState({}), [templates, setTemplates] = useState([]), [loadingTemplates, setLoadingTemplates] = useState(false), [templatesError, setTemplatesError] = useState(""), [sendingTemplate, setSendingTemplate] = useState(false);
    const numeroLinea = normalizaTelefonoMx(numeroAsesor), telefonoDigits = String(draft?.telefono || "").replace(/\D/g, ""), telefono = normalizaTelefonoMx(draft?.telefono), telefonoValido = /^(?:\d{10}|52\d{10})$/.test(telefonoDigits), telefonoNormalizado = /^52\d{10}$/.test(telefonoDigits);
    const contexto = useMemo(() => getContexto(numeroLinea, user), [numeroLinea, user]), agenciasUsuario = useMemo(() => getAgenciasUsuario(user), [user]);
    const agencias = useMemo(() => isAdmin ? DEALERS : agenciasUsuario.length ? agenciasUsuario : contexto.agencia ? [contexto.agencia] : DEALERS, [isAdmin, agenciasUsuario, contexto.agencia]);
    const totalEvidencias = (draft?.evidencias_existentes?.length || 0) + (draft?.evidencias_nuevas?.length || 0);
    const templatePreview = useMemo(() => tplSelected ? buildTemplatePreviewText(tplSelected, tplDraft) : "", [tplSelected, tplDraft]);
    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition", inputOk = "border-black/10 bg-neutral-100", inputBad = "border-red-500 bg-red-50";
    const telError = useMemo(() => { if (!draft?.telefono) return ""; if (telefonoValido) return ""; if (telefonoDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)"; if (telefonoDigits.length === 11) return "Número incorrecto (11 dígitos no válido)"; if (telefonoDigits.length === 12 && !telefonoDigits.startsWith("52")) return "Si tiene 12 dígitos debe iniciar con 52"; if (telefonoDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)"; return "Número inválido"; }, [draft?.telefono, telefonoDigits, telefonoValido]);

    function buildPayload(source = draft) {
        const nombre = source?.tiene_nombre && String(source?.nombre_cliente || "").trim() ? String(source.nombre_cliente).trim() : "SIN NOMBRE";
        return { numero_asesor: numeroLinea, nombre, telefono: normalizaTelefonoMx(source?.telefono), correo: String(source?.correo || "").trim(), agencia: esEdicion ? source?.agencia || "" : contexto.agencia || source?.agencia || "", anio_auto: source?.anio_auto ? Number(source.anio_auto) : null, business: source?.linea || "", canal_contacto: source?.origen || "", pauta: source?.pauta || "", estado: source?.estado || "Contactado", motivo_descalificacion: normalizeText(source?.estado) === "descalificado" ? String(source?.motivo_descalificacion || "").trim() : "", asesor_digital: esEdicion ? source?.asesor_digital || "" : contexto.asesor_digital || source?.asesor_digital || "", asesor_ventas: source?.asesor_solicita || "", auto_interes: source?.cliente_interes || "", comentarios: source?.comentarios || "", enganche_monto: toNullableNumber(source?.enganche_monto), presupuesto_mensual: toNullableNumber(source?.presupuesto_mensual), buro_estado: source?.buro_estado || "", forma_pago: source?.forma_pago || "", tipo_cliente: source?.tipo_cliente || "", uso_vehiculo: source?.uso_vehiculo || "", plazo_compra: source?.plazo_compra || "", comprobacion_ingresos: source?.comprobacion_ingresos || "", id_cotizacion: source?.id_cotizacion || "", folio_solicitud_credito: source?.folio_solicitud_credito || "", solicitud_credito_estado: source?.solicitud_credito_estado || "", vin_facturado: String(source?.vin_facturado || "").trim().toUpperCase(), vin_estatus_entrega: source?.vin_estatus_entrega || "", primer_mensaje_cliente: source?.primer_contacto_at || null, ultimo_contacto_asesor: source?.ultimo_contacto_at || null };
    }
    function resetTemplates() { setShowTemplates(false); setTplSelected(null); setTplDraft({}); setTemplates([]); setTemplatesError(""); }

    useEffect(() => {
        if (!open) return; let cancelled = false;
        setTouched(false); setError(""); setSaving(false); setChatDisponible(tieneChatInicial); resetTemplates(); ultimaFirmaGuardadaRef.current = ""; ultimoProspectoRef.current = null;
        async function init() {
            if (!esEdicion) { setDraft(crearDraftInicial(numeroAsesor, user, isAdmin)); setLoadingDetail(false); return; }
            if (!prospectoId) { setError("No se recibió el ID del prospecto a editar."); return; }
            setLoadingDetail(true);
            try {
                const [p, evidencias] = await Promise.all([api.digitalesGetProspecto(prospectoId, requestContext), api.digitalesListEvidencias(prospectoId, requestContext).catch(() => [])]);
                if (cancelled) return; const cargado = draftDesdeApi(p, evidencias, estadoInicial); setDraft(cargado); ultimoProspectoRef.current = { ...p, id: cargado.id_exp }; ultimaFirmaGuardadaRef.current = JSON.stringify(buildPayload(cargado));
            } catch (e) { if (!cancelled) setError(e?.message || "No se pudo abrir el prospecto para editar."); } finally { if (!cancelled) setLoadingDetail(false); }
        }
        init(); return () => { cancelled = true; };
        // buildPayload usa solamente contexto estable de la apertura actual.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, esEdicion, prospectoId, estadoInicial, numeroAsesor, user, isAdmin]);

    useEffect(() => {
        if (!open) return; let cancelled = false; setLoadingPautas(true);
        api.digitalesCampanasMeta(30).then((r) => { if (!cancelled) setPautas(normalizarPautas(r)); }).catch(() => { if (!cancelled) setPautas(PAUTAS_BASE); }).finally(() => { if (!cancelled) setLoadingPautas(false); });
        return () => { cancelled = true; };
    }, [open]);

    function validar() {
        setTouched(true); setError("");
        if (!esEdicion && !numeroLinea) { setError("Selecciona una línea de WhatsApp antes de crear el prospecto."); return false; }
        if (!telefonoValido) { setError("Captura un teléfono mexicano válido de 10 dígitos."); return false; }
        if (!(esEdicion ? draft.agencia : contexto.agencia || draft.agencia)) { setError("Selecciona el dealer."); return false; }
        if (normalizeText(draft.estado) === "descalificado" && !String(draft.motivo_descalificacion || "").trim()) { setError("Selecciona el motivo de descalificación."); return false; }
        return true;
    }
    function addFiles(fileList) {
        const nuevos = Array.from(fileList || []).map((file) => ({ _tmpId: `${Date.now()}_${Math.random().toString(36).slice(2)}`, file, name: file.name, size: file.size, type: file.type, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "" }));
        if (nuevos.length) setDraft((p) => ({ ...p, evidencias_nuevas: [...(p.evidencias_nuevas || []), ...nuevos] }));
    }
    function removeNuevaEvidencia(id) { setDraft((p) => ({ ...p, evidencias_nuevas: (p.evidencias_nuevas || []).filter((e) => e._tmpId !== id) })); }
    function removeEvidenciaExistente(id) { setDraft((p) => ({ ...p, evidencias_existentes: (p.evidencias_existentes || []).filter((e) => e.id !== id), delete_evidencia_ids: [...new Set([...(p.delete_evidencia_ids || []), id])] })); }
    async function procesarEvidencias(id) {
        const nuevas = (draft.evidencias_nuevas || []).filter((e) => e.file); if (nuevas.length) { const fd = new FormData(); nuevas.forEach((e) => fd.append("archivos", e.file)); await api.digitalesUploadEvidencias(id, fd, numeroLinea); }
        const eliminar = draft.delete_evidencia_ids || []; if (eliminar.length) await Promise.allSettled(eliminar.map((evidenciaId) => api.digitalesDeleteEvidencia(id, evidenciaId, { ...requestContext, numero_asesor: numeroLinea })));
    }
    async function guardar({ cerrar = true, procesarArchivos = true } = {}) {
        if (saving || !validar()) return null;
        // Estado automático según las reglas de bandeja (VIN, No Show, folio, PDF, plazo).
        const estadoAuto = estadoAutomaticoBandeja({
            plazo: draft.plazo_compra,
            vinFacturado: draft.vin_facturado,
            vinEstatus: draft.vin_estatus_entrega,
            folioSolicitudCredito: draft.folio_solicitud_credito,
            evidencias: [...(draft.evidencias_existentes || []), ...(draft.evidencias_nuevas || [])],
            calificacionRapidaLlena: tieneCalificacionRapida(draft),
            citaNoAsistio: citaEsNoAsistio(draft.cita),
            estadoBase: draft.estado,
        });
        const payload = buildPayload();
        payload.estado = estadoAuto;
        const firma = JSON.stringify(payload); setSaving(true);
        try {
            let id = draft.id_exp || prospectoId, respuesta = ultimoProspectoRef.current;
            if (!esEdicion && !id) { respuesta = await api.digitalesCreateProspecto(payload); id = respuesta?.id || respuesta?.id_exp || respuesta?.prospecto?.id || null; if (!id) throw new Error("El backend guardó el prospecto, pero no devolvió su ID."); }
            else if (!id) throw new Error("No se puede editar un prospecto sin ID.");
            else if (ultimaFirmaGuardadaRef.current !== firma) respuesta = await api.digitalesUpdateProspecto(id, payload);
            if (procesarArchivos) await procesarEvidencias(id);
            ultimaFirmaGuardadaRef.current = firma;
            const prospecto = { ...payload, ...(ultimoProspectoRef.current || {}), ...(respuesta?.prospecto || {}), ...(respuesta || {}), id, id_exp: id, telefono: payload.telefono, nombre: payload.nombre, business: payload.business, canal_contacto: payload.canal_contacto };
            ultimoProspectoRef.current = prospecto;
            setDraft((p) => ({ ...p, id_exp: id, telefono: payload.telefono, ...(procesarArchivos ? { evidencias_nuevas: [], delete_evidencia_ids: [] } : {}) }));
            const info = { modo: esEdicion ? "edit" : "create", cerrar, numero_asesor: numeroLinea };
            onGuardado?.(prospecto, info); esEdicion ? onActualizado?.(prospecto, info) : onCreado?.(prospecto, info);
            if (cerrar) onClose?.(); return prospecto;
        } catch (e) { console.error("Error guardando prospecto:", e); setError(e?.message || "No se pudo guardar el prospecto."); return null; } finally { setSaving(false); }
    }
    async function cargarPlantillas() {
        if (!numeroLinea) { setTemplatesError("Selecciona una línea de WhatsApp."); return; } setLoadingTemplates(true); setTemplatesError("");
        try { const r = await api.digitalesPlantillas({ numero_asesor: numeroLinea }); setTemplates(Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : []); }
        catch (e) { setTemplates([]); setTemplatesError(e?.message || "No se pudieron cargar las plantillas."); } finally { setLoadingTemplates(false); }
    }
    async function abrirPlantillas() {
        if (showTemplates) { resetTemplates(); return; } const guardado = await guardar({ cerrar: false, procesarArchivos: false }); if (!guardado) return; setShowTemplates(true); setTplSelected(null); setTplDraft({}); await cargarPlantillas();
    }
    function seleccionarPlantilla(template) {
        setTplSelected(template); const context = { nombre: draft.tiene_nombre ? draft.nombre_cliente : "", agencia: draft.agencia || contexto.agencia || "", modelo: draft.cliente_interes || "", canal: draft.origen || "", asesor: draft.asesor_digital || contexto.asesor_digital || user?.nombre || user?.username || "", tema: draft.cliente_interes ? "vehículo de interés" : "solicitud de información", dato: "horario" }, values = {};
        for (const field of template.fields || []) values[field.key] = getDefaultTemplateFieldValue(field, context); setTplDraft(values);
    }
    async function enviarPlantilla() {
        if (!tplSelected || sendingTemplate) return; const incomplete = (tplSelected.fields || []).find((f) => !String(tplDraft[f.key] || "").trim()); if (incomplete) { setTemplatesError(`Completa el campo: ${incomplete.label || incomplete.key}`); return; }
        const templateName = tplSelected.key || tplSelected.name; if (!templateName) { setTemplatesError("La plantilla no tiene nombre válido."); return; } setSendingTemplate(true); setTemplatesError("");
        try { const components = buildDynamicTemplateComponents(tplSelected, tplDraft); await api.digitalesEnviarPlantilla({ to: telefono, template_name: templateName, idioma: tplSelected.idioma || tplSelected.language || "es_MX", components: components.length ? components : undefined, params: components.length ? undefined : [], numero_asesor: numeroLinea }); setChatDisponible(true); resetTemplates(); onPlantillaEnviada?.({ telefono, numero_asesor: numeroLinea, prospecto: ultimoProspectoRef.current }); alert("Plantilla enviada correctamente."); }
        catch (e) { setTemplatesError(e?.message || "No se pudo enviar la plantilla."); } finally { setSendingTemplate(false); }
    }
    function cerrar() { if (!saving && !sendingTemplate) onClose?.(); }
    function abrirChat() { if (!telefono) return; cerrar(); navigate(`/comercial/prospectos/contacto?tel=${encodeURIComponent(telefono)}&direct=1`); }
    if (!open) return null;

    return <ModalBase open={open} title={esEdicion ? `Editar prospecto · ${draft?.id_exp || prospectoId || ""}` : "Nuevo prospecto"} onClose={cerrar} footer={<>
        {chatDisponible && telefonoValido ? <button type="button" onClick={abrirChat} className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-[#131E5C] shadow-sm hover:bg-slate-50"><MessageSquareShare className="h-4 w-4" />Abrir chat</button> : null}
        <div className="relative"><button type="button" onClick={abrirPlantillas} disabled={saving || sendingTemplate || loadingDetail || !telefonoValido || !numeroLinea} className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-[#131E5C] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}Plantillas</button>
            {showTemplates ? <div className="absolute bottom-12 left-0 z-50 w-[min(24rem,86vw)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">{tplSelected ? <button type="button" onClick={() => setTplSelected(null)}><ChevronLeft className="h-4 w-4 text-slate-500" /></button> : <span className="text-xs font-extrabold text-[#131E5C]">Plantillas</span>}<button type="button" onClick={resetTemplates}><X className="h-4 w-4 text-slate-400" /></button></div><div className="max-h-80 overflow-y-auto">{!tplSelected ? loadingTemplates ? <div className="p-5 text-center text-xs font-bold text-slate-400">Cargando plantillas...</div> : templatesError ? <div className="p-4 text-xs font-bold text-red-600">{templatesError}</div> : templates.length ? templates.map((t) => <button key={`${t.key || t.name}-${t.idioma || t.language || "x"}`} type="button" onClick={() => seleccionarPlantilla(t)} className="block w-full border-b border-black/5 px-4 py-3 text-left hover:bg-neutral-50"><div className="text-xs font-extrabold text-[#131E5C]">{t.title || t.key || t.name}</div><div className="mt-1 truncate text-[11px] font-semibold text-slate-400">{t.help || t.category || "Plantilla Meta"}</div></button>) : <div className="p-5 text-center text-xs font-bold text-slate-400">No hay plantillas disponibles.</div> : <div className="space-y-3 p-4"><div className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs font-semibold text-[#131E5C]">{templatePreview || tplSelected.help || "Sin texto visible."}</div>{(tplSelected.fields || []).map((field) => { const options = getTemplateFieldOptions(field); return <div key={field.key}><div className="mb-1 text-[11px] font-extrabold text-[#131E5C]">{field.label || field.key}</div>{options.length ? <select value={tplDraft[field.key] || ""} onChange={(e) => setTplDraft((p) => ({ ...p, [field.key]: e.target.value }))} className={cls(inputBase, inputOk)}><option value="">Selecciona…</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select> : <input value={tplDraft[field.key] || ""} onChange={(e) => setTplDraft((p) => ({ ...p, [field.key]: e.target.value }))} className={cls(inputBase, inputOk)} />}</div>; })}{templatesError ? <div className="text-xs font-bold text-red-600">{templatesError}</div> : null}<button type="button" onClick={enviarPlantilla} disabled={sendingTemplate} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#131E5C] py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{sendingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareShare className="h-4 w-4" />}{sendingTemplate ? "Enviando..." : "Enviar plantilla"}</button></div>}</div></div> : null}
        </div>
        <button type="button" onClick={cerrar} disabled={saving || sendingTemplate} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-400 px-4 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"><X className="h-4 w-4" />Cancelar</button>
        <button type="button" onClick={() => guardar({ cerrar: true, procesarArchivos: true })} disabled={saving || sendingTemplate || loadingDetail} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 text-sm font-bold text-white hover:bg-[#131E5C] disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar prospecto"}</button>
    </>}>
        {loadingDetail ? <ModalSkeleton /> : !draft ? null : <div className="grid gap-3 md:grid-cols-4">
            {error ? <div className="md:col-span-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}
            <div className="md:col-span-4 grid gap-3 md:grid-cols-3">
                <Field label="Dealer" icon={Building2}><select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin && (contexto.agencia || agenciasUsuario.length <= 1)} className={cls(inputBase, touched && !draft.agencia ? inputBad : inputOk, !isAdmin && (contexto.agencia || agenciasUsuario.length <= 1) ? "cursor-not-allowed opacity-70" : "")}><option value="">Selecciona un dealer...</option>{agencias.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
                <Field label="Asesor Digital" icon={User}><select value={draft.asesor_digital || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_digital: e.target.value }))} disabled={esEdicion ? !isAdmin : Boolean(contexto.asesor_digital)} className={cls(inputBase, inputOk, (esEdicion ? !isAdmin : Boolean(contexto.asesor_digital)) ? "cursor-not-allowed opacity-70" : "")}><option value="">— Selecciona —</option>{ASESORES_DIGITALES.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
                <Field label="Asignado a" icon={User}><select value={draft.asesor_solicita || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_solicita: e.target.value }))} className={cls(inputBase, inputOk)}><option value="">— Selecciona —</option>{ASESORES_PISO.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
            </div>
            <div className="md:col-span-4 grid gap-3 md:grid-cols-2"><Field label="VW de sus sueños"><select value={draft.cliente_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, cliente_interes: e.target.value }))} className={cls(inputBase, inputOk)}><option value="">Selecciona un modelo...</option>{VEHICULOS.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field><Field label="Año del vehículo" icon={CalendarDays}><select value={draft.anio_auto || ""} onChange={(e) => setDraft((p) => ({ ...p, anio_auto: e.target.value }))} className={cls(inputBase, inputOk)}><option value="">— Selecciona —</option>{ANIOS_VEHICULO.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field></div>
            <div className="md:col-span-4"><Field label="Cliente" icon={User}><div className="grid gap-3 md:grid-cols-4">
                <div><label className="inline-flex items-center gap-3 text-sm font-bold text-[#131E5C]"><input type="checkbox" checked={Boolean(draft.tiene_nombre)} onChange={(e) => setDraft((p) => ({ ...p, tiene_nombre: e.target.checked, nombre_cliente: e.target.checked ? p.nombre_cliente : "" }))} className="h-4 w-4" />Nombre del Prospecto</label><input value={draft.nombre_cliente || ""} onChange={(e) => setDraft((p) => ({ ...p, nombre_cliente: e.target.value }))} disabled={!draft.tiene_nombre} className={cls(inputBase, inputOk, !draft.tiene_nombre ? "cursor-not-allowed opacity-70" : "")} placeholder={draft.tiene_nombre ? "Nombre" : "SIN NOMBRE"} /></div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Teléfono</div><input maxLength={12} disabled={esEdicion && telefonoNormalizado} value={draft.telefono || ""} onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} className={cls(inputBase, touched && (!draft.telefono || !telefonoValido) ? inputBad : inputOk, esEdicion && telefonoNormalizado ? "cursor-not-allowed opacity-70" : "")} />{touched && telError ? <div className="mt-1 text-xs font-bold text-red-600">{telError}</div> : null}</div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Correo</div><input value={draft.correo || ""} onChange={(e) => setDraft((p) => ({ ...p, correo: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="correo@ejemplo.com" /></div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Estado</div><select value={draft.estado || ""} onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value, motivo_descalificacion: normalizeText(e.target.value) === "descalificado" ? p.motivo_descalificacion : "" }))} className={cls(inputBase, inputOk)}>{ETIQUETAS_ESTADO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>{normalizeText(draft.estado) === "descalificado" ? <div className="mt-3"><div className="mb-1 text-sm font-bold text-red-700">Motivo de descalificación *</div><MotivoDescalificacionPicker value={draft.motivo_descalificacion || ""} onChange={(motivo) => setDraft((p) => ({ ...p, motivo_descalificacion: motivo }))} invalid={touched && !draft.motivo_descalificacion} /></div> : null}
                <div className="grid gap-3 md:grid-cols-2"><div><div className="mb-1 text-sm font-bold text-[#131E5C]">Pauta de Origen</div>{loadingPautas ? <div className="flex h-10 items-center gap-2 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-[#131E5C]"><Loader2 className="h-4 w-4 animate-spin" />Cargando campañas...</div> : <select value={draft.pauta || ""} onChange={(e) => setDraft((p) => ({ ...p, pauta: e.target.value }))} className={cls(inputBase, inputOk)}><option value="">— Selecciona una pauta —</option>{draft.pauta && !pautas.some((p) => normalizeText(p) === normalizeText(draft.pauta)) ? <option value={draft.pauta}>{draft.pauta} (actual)</option> : null}{pautas.map((p) => <option key={p} value={p}>{p}</option>)}</select>}</div><div><div className="mb-1 text-sm font-bold text-[#131E5C]">Business</div><LineaPicker value={draft.linea} onChange={(linea) => setDraft((p) => ({ ...p, linea }))} /></div></div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Canal de Contacto</div><OrigenPicker value={draft.origen} onChange={(origen) => setDraft((p) => ({ ...p, origen }))} /></div></Field></div>
            <div className="md:col-span-4"><Field label="Perfil comercial y financiero" icon={Activity}><div className="grid gap-3 md:grid-cols-4">
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Enganche</div><input type="number" min="0" value={draft.enganche_monto || ""} onChange={(e) => setDraft((p) => ({ ...p, enganche_monto: e.target.value.replace(/\D/g, "") }))} className={cls(inputBase, inputOk)} placeholder="Ej. 80000" /></div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Presupuesto mensual</div><input type="number" min="0" value={draft.presupuesto_mensual || ""} onChange={(e) => setDraft((p) => ({ ...p, presupuesto_mensual: e.target.value.replace(/\D/g, "") }))} className={cls(inputBase, inputOk)} placeholder="Ej. 9000" /></div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Buró</div><select value={draft.buro_estado || ""} onChange={(e) => setDraft((p) => ({ ...p, buro_estado: e.target.value }))} className={cls(inputBase, inputOk)}>{BURO_OPTIONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Forma de pago</div><select value={draft.forma_pago || ""} onChange={(e) => setDraft((p) => ({ ...p, forma_pago: e.target.value }))} className={cls(inputBase, inputOk)}>{FORMA_PAGO_OPTIONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
            </div><div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Tipo cliente</div><select value={draft.tipo_cliente || ""} onChange={(e) => setDraft((p) => ({ ...p, tipo_cliente: e.target.value }))} className={cls(inputBase, inputOk)}>{TIPO_CLIENTE_OPTIONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Plazo de compra</div><select value={draft.plazo_compra || ""} onChange={(e) => setDraft((p) => ({ ...p, plazo_compra: e.target.value }))} className={cls(inputBase, inputOk)}>{PLAZO_COMPRA_OPTIONS.map((i) => <option key={i || "empty"} value={i}>{i || "— Selecciona —"}</option>)}</select></div>
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Uso del vehículo</div><input value={draft.uso_vehiculo || ""} onChange={(e) => setDraft((p) => ({ ...p, uso_vehiculo: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Personal, familiar, trabajo..." /></div>
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Comprobación ingresos</div><input value={draft.comprobacion_ingresos || ""} onChange={(e) => setDraft((p) => ({ ...p, comprobacion_ingresos: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Nómina, estados, negocio..." /></div>
                </div><div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">ID Cotización</div><input value={draft.id_cotizacion || ""} onChange={(e) => setDraft((p) => ({ ...p, id_cotizacion: e.target.value }))} className={cls(inputBase, inputOk)} /></div>
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">Folio Solicitud Crédito</div><input value={draft.folio_solicitud_credito || ""} onChange={(e) => setDraft((p) => ({ ...p, folio_solicitud_credito: e.target.value }))} className={cls(inputBase, inputOk)} /><select value={draft.solicitud_credito_estado || ""} onChange={(e) => setDraft((p) => ({ ...p, solicitud_credito_estado: e.target.value }))} className={cls(inputBase, inputOk, "mt-2")}>{SOLICITUD_CREDITO.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}</select></div>
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">VIN Facturado</div><input value={draft.vin_facturado || ""} onChange={(e) => setDraft((p) => ({ ...p, vin_facturado: e.target.value.toUpperCase() }))} className={cls(inputBase, inputOk)} /></div>
                    <div><div className="mb-1 text-sm font-bold text-[#131E5C]">¿VIN Entregado?</div><button type="button" onClick={() => setDraft((p) => ({ ...p, vin_estatus_entrega: p.vin_estatus_entrega === "entregado" ? "cancelado" : "entregado" }))} className={cls("relative flex h-9 w-28 items-center rounded-full px-1 transition-all", draft.vin_estatus_entrega === "entregado" ? "bg-emerald-500" : "bg-red-500")}><span className={cls("flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md transition-all", draft.vin_estatus_entrega === "entregado" ? "translate-x-[76px] text-emerald-600" : "translate-x-0 text-red-600")}>{draft.vin_estatus_entrega === "entregado" ? "✓" : "×"}</span></button><div className="mt-1 text-xs font-semibold text-[#515778]">Estado actual: <span className={draft.vin_estatus_entrega === "entregado" ? "text-emerald-600" : "text-red-600"}>{draft.vin_estatus_entrega === "entregado" ? "Entregado" : "Cancelado"}</span></div></div>
                </div></Field></div>
            <div className="md:col-span-4"><Field label="Evidencias" icon={Paperclip}><input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} /><button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-4 py-6 text-center text-[#131E5C] hover:bg-[#131E5C]/10 sm:flex-row sm:text-left"><UploadCloud className="h-6 w-6" /><div><div className="text-sm font-extrabold">Agregar fotos, videos o archivos</div><div className="text-xs font-semibold text-slate-500">Puedes seleccionar varios archivos al mismo tiempo.</div></div></button><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">Total: {totalEvidencias}</span>{draft.delete_evidencia_ids?.length ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Por eliminar: {draft.delete_evidencia_ids.length}</span> : null}{draft.evidencias_nuevas?.length ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">Nuevas: {draft.evidencias_nuevas.length}</span> : null}</div>{draft.evidencias_existentes?.length ? <div><div className="mb-2 text-sm font-extrabold text-[#131E5C]">Evidencias guardadas</div><div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{draft.evidencias_existentes.map((item) => <EvidenceCard key={`e-${item.id}`} item={item} onRemove={() => removeEvidenciaExistente(item.id)} />)}</div></div> : null}{draft.evidencias_nuevas?.length ? <div><div className="mb-2 text-sm font-extrabold text-[#131E5C]">Evidencias nuevas</div><div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{draft.evidencias_nuevas.map((item) => <EvidenceCard key={item._tmpId} item={item} onRemove={() => removeNuevaEvidencia(item._tmpId)} />)}</div></div> : null}{!totalEvidencias ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">Aún no has agregado evidencias.</div> : null}</Field></div>
            <div className={esEdicion ? "md:col-span-2" : "md:col-span-4"}><Field label="Comentarios Adicionales" icon={FileText}><textarea value={draft.comentarios || ""} onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))} rows={4} className={cls(inputBase, inputOk)} /></Field></div>
            {esEdicion ? <div className="md:col-span-2"><Field label="Resumen de conversación" icon={ClipboardCheck}><textarea value={draft.resumen || ""} disabled rows={5} className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />{draft.resumen_actualizado_at ? <div className="mt-2 text-xs font-semibold text-slate-500">Última actualización: {fmtDTIntl(draft.resumen_actualizado_at)}{draft.resumen_fuente ? ` · ${draft.resumen_fuente}` : ""}</div> : null}</Field></div> : null}
        </div>}
    </ModalBase>;
}
