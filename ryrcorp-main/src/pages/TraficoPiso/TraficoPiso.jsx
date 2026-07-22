// src/pages/TraficoPiso/TraficoPiso.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    ArrowUpDown,
    BadgeDollarSign,
    BriefcaseBusiness,
    CalendarDays,
    CarFront,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    Clock,
    HeartHandshake,
    Loader2,
    Mail,
    MessageSquareText,
    Phone,
    Plus,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    User,
    UserRoundSearch,
    Users,
    X,
    Building2,
    Table2,
    BarChart3,
    Calendar,
    UserSearch,
} from "lucide-react";
import { apiTraficoPiso } from "../../lib/apiTraficoPiso";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

const BRAND_BLUE = "#131E5C";

// ── WhatsApp API ──────────────────────────────────────────────
const ACCESS_TOKEN = "EAAMHhf6nlX8BRsem3YmFgR7wKIEGwZByRLbsZApyZC3TMvgKfr4ARDcWNqeX5BUIcL699ZBQ1ayAk4NQzRvDIa7Ec3FjFZA51rSfodI96FoCWlHR2RypxcbOeseSUovfBtvmDqTs6DiU3hk1gyJnW9XLjuaF3te6UqH0M4ZBAhkxe8wzCBwk0ZCw0FcizAgnfDyilN3ZCeHqTMBhb7XKWkZAJhKTVZCNCKg1IUjEJj";
const PHONE_NUMBER_ID = "1184628394729057";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

const VEHICULOS = [
    "Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus",
    "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok",
    "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter",
];

const MOTIVOS_INGRESO = [
    "Vi anuncios en la TV",
    "Vi anuncios en las redes sociales",
    "Vi publicitarios",
    "Siempre me ha gustado la marca",
    "Pasé y sentí curiosidad",
    "Recibí información por Whastapp",
];

const TIPOS_PERSONA = ["Física", "Moral"];
const TIEMPOS_COMPRA = ["Este mes", "De 1 a 3 meses", "De 3 a 6 meses"];

const FORMAS_CAPITALIZACION = [
    "Deseo un Crédito",
    "Quiero pagarlo de contado",
    "Me interesa un arrendamiento",
    "Me interesa un Autofinanciamiento",
];

const MENSUALIDADES = [3, 6, 12, 18, 26, 36, 48, 60, 72];

const FORMAS_COMPROBAR_INGRESOS = [
    "No cuenta",
    "Recibo de Nómina",
    "Factura por Servicios",
    "Estado de Cuenta",
    "Declaración de Impuestos",
    "Pago de Pensión",
    "Carta de Ingresos",
];

const MOTIVOS_COMPRA = [
    "Renovar auto",
    "Mi familia se hace más grande",
    "Mi trabajo me lo pide",
    "Mi estilo de vida me lo pide",
];

const PERFILES_PROFESIONALES = [
    "Comerciales",
    "Asalariado Sector Público",
    "Asalariado Sector Privado",
    "Pensionado",
    "Profesionista Independiente",
];

const ESTADOS_CIVILES = ["Soltero", "Casado", "Divorciado"];

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

const PASATIEMPOS = [
    "Ciclismo", "Natación", "Futbol", "Pesca", "Senderismo", "Tenis-frontón",
    "Golf", "Mixología", "Cocinar", "Coleccionar objetos", "Viajar dentro del país",
    "Viajar fuera del país", "Automovilismo", "Fotografía", "Pintura", "Arquitectura",
    "Conciertos", "Ajedrez", "Lectura", "Desarrollo personal", "Pilates", "Yoga",
    "Neurociencias", "Aprendizaje de idioma",
];

const HOURS_AGENDA = Array.from({ length: 12 }, (_, i) => i + 8);
const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const INITIAL_FORM = {
    agencia: "",
    nombre_prospecto: "",
    codigo_postal: "",
    telefono: "",
    email: "",
    asesor_ventas: "",
    motivo_ingreso: "",
    tipo_persona: "Física",
    tiempo_compra: "",
    auto_suenos: "",
    deja_auto_cuenta: false,
    modelo_auto_cuenta: "",
    forma_capitalizacion: "",
    presupuesto_estimado: "",
    enganche_presupuestado: "",
    mensualidades_presupuestadas: "",
    comprueba_ingresos: false,
    forma_comprobar_ingresos: "No cuenta",
    motivo_compra: "",
    perfil_profesional: "",
    edad: "",
    cantidad_hijos: "0",
    estado_civil: "",
    pasatiempos: [],
    comentarios: "",
};

// ==================== FUNCIONES UTILITARIAS ====================
function normalizeStr(value) { return String(value ?? "").trim(); }
function normalizarBusqueda(value) { return normalizeStr(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function soloNumeros(value) { return String(value || "").replace(/\D/g, ""); }
function validarTelefono(value) { const t = soloNumeros(value); if (!t) return false; if (t.length === 10) return true; if (t.length === 12 && t.startsWith("52")) return true; return false; }
function mensajeTelefono(value) { const t = soloNumeros(value); if (!t) return "Captura un teléfono numérico."; if (t.length < 10) return "Mínimo 10 dígitos."; if (t.length === 11) return "No puede tener 11 dígitos."; if (t.length === 12 && !t.startsWith("52")) return "Debe iniciar con 52."; if (t.length > 12) return "Máximo 12 dígitos."; return "Teléfono inválido."; }
function validarEmail(value) { const email = normalizeStr(value); if (!email) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email); }
function money(value) { const n = Number(value || 0); return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }); }
function dateTime(value) { if (!value) return "—"; const date = new Date(value); if (isNaN(date.getTime())) return "—"; return date.toLocaleString("es-MX", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function toYMDLocal(dateLike) { const d = new Date(dateLike); if (isNaN(d.getTime())) return ""; const pad = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function ymdToInt(ymd) { if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null; return Number(ymd.replaceAll("-", "")); }

function normalizarPayload(form) {
    return {
        ...form,
        agencia: normalizeStr(form.agencia),
        nombre_prospecto: normalizeStr(form.nombre_prospecto).toUpperCase(),
        codigo_postal: soloNumeros(form.codigo_postal),
        telefono: soloNumeros(form.telefono),
        email: normalizeStr(form.email),
        asesor_ventas: normalizeStr(form.asesor_ventas),
        auto_suenos: normalizeStr(form.auto_suenos),
        presupuesto_estimado: Number(form.presupuesto_estimado || 0),
        enganche_presupuestado: Number(form.enganche_presupuestado || 0),
        mensualidades_presupuestadas: Number(form.mensualidades_presupuestadas || 0),
        edad: form.edad === "" ? null : Number(form.edad),
        cantidad_hijos: Number(form.cantidad_hijos || 0),
        modelo_auto_cuenta: form.deja_auto_cuenta ? normalizeStr(form.modelo_auto_cuenta) : "",
        pasatiempos: Array.isArray(form.pasatiempos) ? form.pasatiempos : [],
        comentarios: normalizeStr(form.comentarios),
    };
}

function validarFormulario(form) {
    const errores = [];
    const telefono = soloNumeros(form.telefono);
    if (!normalizeStr(form.agencia)) errores.push("Selecciona el dealer.");
    if (!normalizeStr(form.nombre_prospecto)) errores.push("Captura el nombre del prospecto.");
    if (!soloNumeros(form.codigo_postal)) errores.push("Captura un código postal numérico.");
    if (!validarTelefono(telefono)) errores.push(mensajeTelefono(telefono));
    if (!validarEmail(form.email)) errores.push("Captura un correo electrónico válido.");
    if (!normalizeStr(form.asesor_ventas)) errores.push("Selecciona o captura un asesor de ventas.");
    if (!form.motivo_ingreso) errores.push("Selecciona por qué ingresó a la agencia.");
    if (!form.tiempo_compra) errores.push("Selecciona cuándo tiene programada su compra.");
    if (!form.auto_suenos) errores.push("Selecciona el auto de sus sueños.");
    if (!form.forma_capitalizacion) errores.push("Selecciona una forma de capitalización.");
    if (Number(form.presupuesto_estimado || 0) < 100000) errores.push("El presupuesto estimado debe tener al menos seis dígitos.");
    if (Number(form.enganche_presupuestado || 0) < 10000) errores.push("El enganche presupuestado debe tener al menos cinco dígitos.");
    if (!form.mensualidades_presupuestadas) errores.push("Selecciona mensualidades presupuestadas.");
    if (!form.forma_comprobar_ingresos) errores.push("Selecciona la forma de comprobar ingresos.");
    if (!form.motivo_compra) errores.push("Selecciona el motivo de compra.");
    if (!form.perfil_profesional) errores.push("Selecciona el perfil profesional.");
    if (!form.estado_civil) errores.push("Selecciona el estado civil.");
    if (form.deja_auto_cuenta && !normalizeStr(form.modelo_auto_cuenta)) errores.push("Captura el modelo que desea dejar a cuenta.");
    if (!Array.isArray(form.pasatiempos) || form.pasatiempos.length < 1) errores.push("Selecciona al menos 1 pasatiempo.");
    return errores;
}

// ==================== COMPONENTES UI BÁSICOS ====================
function Skeleton({ className = "" }) { return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />; }
function SkeletonRow() { return <tr className="animate-pulse">{Array.from({ length: 13 }).map((_, i) => <td key={i} className="px-4 py-3"><div className="h-4 w-full max-w-[160px] rounded bg-slate-200/70" /></td>)}</tr>; }
function ModalSkeleton() { return <div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"><Skeleton className="h-4 w-36" /><Skeleton className="mt-3 h-10 w-full rounded-lg" /></div>)}<div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4 md:col-span-3"><Skeleton className="h-4 w-40" /><Skeleton className="mt-3 h-24 w-full rounded-lg" /></div></div>; }

function Modal({ open, title, subtitle, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(<div className="fixed inset-0 z-[60]"><div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} /><div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center"><div className="w-full max-w-6xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl"><div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}><div className="min-w-0"><div className="truncate text-base font-extrabold text-white">{title}</div>{subtitle ? <div className="mt-1 truncate text-xs font-semibold text-white/70">{subtitle}</div> : null}</div><button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"><X className="h-5 w-5" /></button></div><div className="max-h-[74vh] overflow-auto p-5">{children}</div>{footer ? <div className="flex flex-col gap-2 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">{footer}</div> : null}</div></div></div>, document.body);
}

function Section({ title, icon: Icon, children }) { return <section className="rounded-lg border border-black/10 bg-white/60 p-4 shadow-sm"><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#131E5C]">{Icon ? <Icon className="h-4 w-4" /> : null}<span>{title}</span></div>{children}</section>; }
function Field({ label, icon: Icon, required, hint, invalid, children }) { return <div className={["rounded-lg border bg-neutral-200/50 p-4", invalid ? "border-red-400" : "border-white/10"].join(" ")}><div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-[#131E5C]"><div className="flex items-center gap-2">{Icon ? <Icon className="h-4 w-4" /> : null}<span>{label} {required ? <b className="text-red-500">*</b> : null}</span></div>{hint ? <span className="text-xs font-semibold text-slate-500">{hint}</span> : null}</div>{children}</div>; }
function FilterBlock({ label, children }) { return <div className="rounded-lg"><div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>{children}</div>; }
function Input({ invalid = false, className = "", ...props }) { return <input {...props} className={["w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] shadow-lg outline-none", invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-neutral-100", props.disabled ? "cursor-not-allowed opacity-75" : "", className].join(" ")} />; }
function Textarea({ invalid = false, className = "", ...props }) { return <textarea {...props} className={["min-h-[110px] w-full resize-none rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] shadow-lg outline-none", invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-neutral-100", className].join(" ")} />; }
function Select({ invalid = false, children, className = "", ...props }) { return <select {...props} className={["w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] shadow-lg outline-none", invalid ? "border-red-500 bg-red-50" : "border-black/10 bg-neutral-100", className].join(" ")}>{children}</select>; }
function BooleanSwitch({ value, onChange, yes = "SÍ", no = "NO" }) { return <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-black/10 bg-white p-1 shadow-lg"><button type="button" onClick={() => onChange(true)} className={["rounded-md px-3 py-2 text-sm font-extrabold transition", value ? "bg-[#131E5C] text-white shadow-sm" : "text-[#131E5C] hover:bg-slate-100"].join(" ")}>{yes}</button><button type="button" onClick={() => onChange(false)} className={["rounded-md px-3 py-2 text-sm font-extrabold transition", !value ? "bg-[#131E5C] text-white shadow-sm" : "text-[#131E5C] hover:bg-slate-100"].join(" ")}>{no}</button></div>; }

function PasatiemposPicker({ value, onChange, invalid }) {
    const seleccionados = new Set(value || []);
    function toggle(item) { if (seleccionados.has(item)) { onChange((value || []).filter((x) => x !== item)); return; } onChange([...(value || []), item]); }
    return <div className={["rounded-lg border bg-neutral-200/50 p-4", invalid ? "border-red-400" : "border-white/10"].join(" ")}><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-extrabold text-[#131E5C]"><HeartHandshake className="h-4 w-4" /><span>Pasatiempos *</span></div><span className={["rounded-full px-3 py-1 text-xs font-extrabold", value.length >= 1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"].join(" ")}>{value.length}/1 mínimo</span></div><div className="flex max-h-[220px] flex-wrap gap-2 overflow-y-auto pr-1">{PASATIEMPOS.map((item) => { const active = seleccionados.has(item); return <button key={item} type="button" onClick={() => toggle(item)} className={["rounded-full border px-3 py-2 text-xs font-extrabold transition", active ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-black/10 bg-white text-[#131E5C] hover:border-[#131E5C] hover:bg-white"].join(" ")}>{item}</button>; })}</div></div>;
}

function AsesorAutocomplete({ value, onChange, invalid }) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const opciones = useMemo(() => {
        const q = normalizarBusqueda(value);
        if (!q) return ASESORES.slice(0, 20);
        return ASESORES.filter((asesor) => normalizarBusqueda(asesor).includes(q)).slice(0, 20);
    }, [value]);

    useEffect(() => {
        const onClick = (event) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(event.target)) setOpen(false);
        };
        window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                value={value}
                invalid={invalid}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Escribe para buscar asesor..."
            />
            {open && (
                <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                    <div className="border-b border-black/10 px-3 py-2 text-xs font-bold text-[#131E5C]">
                        Selecciona un asesor
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {opciones.length === 0 && (
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="block w-full px-3 py-3 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50"
                            >
                                No encontré coincidencias. Puedes dejar el nombre escrito manualmente.
                            </button>
                        )}
                        {opciones.map((asesor) => (
                            <button
                                key={asesor}
                                type="button"
                                onClick={() => {
                                    onChange(asesor);
                                    setOpen(false);
                                }}
                                className="block w-full px-3 py-3 text-left hover:bg-slate-50"
                            >
                                <div className="text-sm font-extrabold text-[#131E5C]">{asesor}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SortButton({ label, sortKey, sort, onClick }) { const active = sort.key === sortKey; return <button type="button" onClick={() => onClick(sortKey)} className="inline-flex items-center gap-1 text-xs font-bold">{label}<span className="opacity-70">{active ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}</span></button>; }

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button type="button" className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

// ==================== COMPONENTES DE GRÁFICOS ====================
function Bar({ label, value, max, color, total }) {
    const [hovered, setHovered] = useState(false);
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const pctTotal = total > 0 ? Math.round((value / total) * 100) : 0;
    return <div className="relative flex items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-150 cursor-default" style={{ background: hovered ? "rgba(19,30,92,0.05)" : "transparent" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{hovered && <div className="absolute left-1/2 -top-9 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg bg-[#131E5C] px-3 py-1.5 text-xs font-bold text-white shadow-xl pointer-events-none">{label ? <span className="mr-1">{label}:</span> : null}{value} registros {total > 0 ? `(${pctTotal}%)` : ""}<div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#131E5C] rotate-45" /></div>}<div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%`, opacity: hovered ? 1 : 0.85 }} /></div><span className={`text-xs font-bold w-6 text-right transition-colors ${hovered ? "text-[#131E5C]" : "text-slate-500"}`}>{value}</span></div>;
}

function ColBar({ dia, cnt, pct, hovered, onEnter, onLeave }) { return <div className="flex-1 flex flex-col items-center gap-1 cursor-default" onMouseEnter={onEnter} onMouseLeave={onLeave}><span className={`text-xs font-bold transition-colors ${hovered ? "text-[#131E5C]" : "text-transparent"}`}>{cnt}</span><div className="relative w-full rounded-t-md bg-[#131E5C]/10 flex items-end" style={{ height: "72px" }}><div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${pct}%`, minHeight: cnt > 0 ? "4px" : "0", background: hovered ? "#131E5C" : "rgba(19,30,92,0.6)" }} />{hovered && cnt > 0 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#131E5C] px-2 py-1 text-xs font-bold text-white shadow-xl pointer-events-none z-50">{cnt} registro{cnt !== 1 ? "s" : ""}<div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#131E5C] rotate-45" /></div>}</div><span className={`text-xs font-semibold transition-colors ${hovered ? "text-[#131E5C] font-extrabold" : "text-slate-500"}`}>{dia}</span></div>; }

function KpiCard({ label, value, color, bg, detail }) {
    const [hovered, setHovered] = useState(false);
    return <div className={`rounded-xl border border-black/10 ${bg} p-4 transition-all duration-200 cursor-default select-none`} style={{ transform: hovered ? "translateY(-2px)" : "none", boxShadow: hovered ? "0 8px 24px rgba(19,30,92,0.12)" : "none" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}><div className="text-xs font-bold text-slate-500 mb-1">{label}</div><div className={`text-3xl font-extrabold ${color}`}>{value}</div>{hovered && detail ? <div className="mt-2 text-xs font-semibold text-slate-400 animate-pulse">{detail}</div> : null}</div>;
}

function GraficosView({ rows }) {
    const [hoveredDia, setHoveredDia] = useState(null);
    const stats = useMemo(() => {
        const total = rows.length;
        const conAutoCuenta = rows.filter((r) => r.deja_auto_cuenta).length;
        const sinAutoCuenta = total - conAutoCuenta;
        const porMotivoIngreso = {}; for (const r of rows) { const m = r.motivo_ingreso || "Sin motivo"; porMotivoIngreso[m] = (porMotivoIngreso[m] || 0) + 1; }
        const porAgencia = {}; for (const r of rows) { const a = r.agencia || "Sin agencia"; porAgencia[a] = (porAgencia[a] || 0) + 1; }
        const porAsesor = {}; for (const r of rows) { const a = r.asesor_ventas || "Sin asesor"; porAsesor[a] = (porAsesor[a] || 0) + 1; }
        const porTipoPersona = {}; for (const r of rows) { const t = r.tipo_persona || "Sin tipo"; porTipoPersona[t] = (porTipoPersona[t] || 0) + 1; }
        const porTiempoCompra = {}; for (const r of rows) { const t = r.tiempo_compra || "Sin tiempo"; porTiempoCompra[t] = (porTiempoCompra[t] || 0) + 1; }
        const porFormaCapitalizacion = {}; for (const r of rows) { const f = r.forma_capitalizacion || "Sin forma"; porFormaCapitalizacion[f] = (porFormaCapitalizacion[f] || 0) + 1; }
        const porDia = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };
        const daysKeys = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        for (const r of rows) { if (!r.creado_en) continue; const d = new Date(r.creado_en); if (isNaN(d.getTime())) continue; const diaIndex = d.getDay(); const diaKey = daysKeys[diaIndex === 0 ? 6 : diaIndex - 1]; porDia[diaKey] = (porDia[diaKey] || 0) + 1; }
        const totalPresupuesto = rows.reduce((acc, r) => acc + Number(r.presupuesto_estimado || 0), 0);
        const promedioPresupuesto = total > 0 ? totalPresupuesto / total : 0;
        return { total, conAutoCuenta, sinAutoCuenta, porMotivoIngreso, porAgencia, porAsesor, porTipoPersona, porTiempoCompra, porFormaCapitalizacion, porDia, promedioPresupuesto, totalPresupuesto };
    }, [rows]);
    const topAgencias = Object.entries(stats.porAgencia).sort((a, b) => b[1] - a[1]);
    const topAsesores = Object.entries(stats.porAsesor).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topMotivos = Object.entries(stats.porMotivoIngreso).sort((a, b) => b[1] - a[1]);
    const maxAgencia = topAgencias[0]?.[1] || 1;
    const maxAsesor = topAsesores[0]?.[1] || 1;
    const maxMotivo = topMotivos[0]?.[1] || 1;
    const maxDia = Math.max(...Object.values(stats.porDia), 1);
    const AGENCIA_COLORS = ["bg-[#131E5C]", "bg-blue-600", "bg-blue-400", "bg-blue-300", "bg-sky-300", "bg-cyan-300", "bg-teal-300"];
    const ASESOR_COLORS = ["bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-emerald-300", "bg-teal-400", "bg-teal-300", "bg-cyan-400", "bg-cyan-300"];
    const MOTIVO_COLORS = ["bg-violet-600", "bg-violet-500", "bg-violet-400", "bg-violet-300", "bg-purple-300", "bg-purple-200", "bg-indigo-300", "bg-indigo-200"];
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3"><KpiCard label="Total registros" value={stats.total} color="text-[#131E5C]" bg="bg-[#131E5C]/5" detail="Total de prospectos registrados" /><KpiCard label="Deja auto a cuenta" value={stats.conAutoCuenta} color="text-emerald-700" bg="bg-emerald-50" detail={`${stats.total > 0 ? Math.round((stats.conAutoCuenta / stats.total) * 100) : 0}% del total`} /><KpiCard label="No deja auto a cuenta" value={stats.sinAutoCuenta} color="text-red-600" bg="bg-red-50" detail={`${stats.total > 0 ? Math.round((stats.sinAutoCuenta / stats.total) * 100) : 0}% del total`} /><KpiCard label="Presupuesto promedio" value={money(stats.promedioPresupuesto)} color="text-blue-700" bg="bg-blue-50" detail={`Total: ${money(stats.totalPresupuesto)}`} /></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Por dealer</div><div className="space-y-1">{topAgencias.map(([agencia, cnt], i) => <div key={agencia}><div className="flex items-center justify-between px-2 mb-0.5"><span className="text-xs font-semibold text-slate-600 truncate max-w-[75%]">{agencia}</span></div><Bar label={agencia} value={cnt} max={maxAgencia} color={AGENCIA_COLORS[i % AGENCIA_COLORS.length]} total={stats.total} /></div>)}{topAgencias.length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}</div></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-2"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><UserSearch className="h-4 w-4" /> Por asesor de ventas (top 8)</div><div className="space-y-1">{topAsesores.map(([asesor, cnt], i) => <div key={asesor}><div className="flex items-center justify-between px-2 mb-0.5"><span className="text-xs font-semibold text-slate-600 truncate max-w-[75%]">{asesor}</span></div><Bar label={asesor} value={cnt} max={maxAsesor} color={ASESOR_COLORS[i % ASESOR_COLORS.length]} total={stats.total} /></div>)}{topAsesores.length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}</div></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><MessageSquareText className="h-4 w-4" /> Por motivo de ingreso</div><div className="space-y-1">{topMotivos.map(([motivo, cnt], i) => <div key={motivo}><div className="flex items-center justify-between px-2 mb-0.5"><span className="text-xs font-semibold text-slate-600 truncate max-w-[75%]">{motivo}</span></div><Bar label={motivo} value={cnt} max={maxMotivo} color={MOTIVO_COLORS[i % MOTIVO_COLORS.length]} total={stats.total} /></div>)}{topMotivos.length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}</div></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Por tipo de persona</div><div className="space-y-1">{Object.entries(stats.porTipoPersona).map(([tipo, cnt]) => { const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0; const color = tipo === "Física" ? "bg-emerald-500" : "bg-violet-500"; return <div key={tipo} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 cursor-default"><span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} /><span className="text-xs font-semibold text-slate-600 flex-1 truncate group-hover:text-[#131E5C] transition-colors">{tipo}</span><span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{pct}%</span><div className="w-24 h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 group-hover:opacity-100 opacity-75 ${color}`} style={{ width: `${pct}%` }} /></div><span className="text-xs font-bold text-[#131E5C] w-5 text-right">{cnt}</span></div>; })}{Object.keys(stats.porTipoPersona).length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}</div></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Por tiempo de compra</div><div className="space-y-1">{Object.entries(stats.porTiempoCompra).map(([tiempo, cnt]) => { const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0; return <div key={tiempo} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 cursor-default"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" /><span className="text-xs font-semibold text-slate-600 flex-1 truncate group-hover:text-[#131E5C] transition-colors">{tiempo}</span><span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{pct}%</span><div className="w-24 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500 group-hover:opacity-100 opacity-75 bg-amber-500" style={{ width: `${pct}%` }} /></div><span className="text-xs font-bold text-[#131E5C] w-5 text-right">{cnt}</span></div>; })}{Object.keys(stats.porTiempoCompra).length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}</div></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Por día de la semana</div><div className="flex items-end gap-2 mt-2" style={{ height: "110px" }}>{Object.entries(stats.porDia).map(([dia, cnt]) => { const pct = maxDia > 0 ? (cnt / maxDia) * 100 : 0; return <ColBar key={dia} dia={dia} cnt={cnt} pct={pct} hovered={hoveredDia === dia} onEnter={() => setHoveredDia(dia)} onLeave={() => setHoveredDia(null)} />; })}</div></div><div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-sm font-extrabold text-[#131E5C] mb-3 flex items-center gap-2"><CircleDollarSign className="h-4 w-4" /> Por forma de capitalización</div><div className="space-y-1">{Object.entries(stats.porFormaCapitalizacion).map(([forma, cnt]) => { const pct = stats.total > 0 ? Math.round((cnt / stats.total) * 100) : 0; return <div key={forma} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 cursor-default"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shrink-0" /><span className="text-xs font-semibold text-slate-600 flex-1 truncate group-hover:text-[#131E5C] transition-colors">{forma}</span><span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{pct}%</span><div className="w-24 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500 group-hover:opacity-100 opacity-75 bg-cyan-500" style={{ width: `${pct}%` }} /></div><span className="text-xs font-bold text-[#131E5C] w-5 text-right">{cnt}</span></div>; })}{Object.keys(stats.porFormaCapitalizacion).length === 0 && <div className="text-xs text-slate-400 px-2">Sin datos</div>}</div></div></div>;
}

// ==================== COMPONENTE AGENDA ====================
function AgendaTraficoPiso({ rows, loading, onEdit, onNewAtSlot }) {
    const [weekRef, setWeekRef] = useState(new Date());

    const weekDates = useMemo(() => {
        const d = new Date(weekRef);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    }, [weekRef]);

    const goNext = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); };
    const goPrev = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); };
    const goToday = () => setWeekRef(new Date());

    const traficoByDayHour = useMemo(() => {
        const map = {};
        for (const row of rows) {
            if (!row.creado_en) continue;
            const dt = new Date(row.creado_en);
            if (isNaN(dt.getTime())) continue;
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
        if (start.getMonth() === end.getMonth()) {
            return `${sm} – ${em} de ${smth} de ${yr}`;
        }
        return `${sm} de ${smth} – ${em} de ${emth} de ${yr}`;
    }, [weekDates]);

    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    return (
        <div className="rounded-lg border border-black/10 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10">
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Semana de tráfico</div>
                    <div className="text-sm font-extrabold text-[#131E5C]">{weekLabel}</div>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-[#131E5C]/10 text-[#131E5C] font-semibold">Tráfico de piso</span>
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
                        {HOURS_AGENDA.map((_, i) => (
                            <col key={i} style={{ width: `calc((100% - 64px) / ${HOURS_AGENDA.length})` }} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="px-2 py-3 text-xs font-bold text-slate-400 bg-white border-b border-r border-black/10">Día</th>
                            {HOURS_AGENDA.map((hour, i) => (
                                <th key={i} className="px-2 py-3 text-center border-b border-r border-black/10 bg-white">
                                    <div className="text-xs font-bold text-[#131E5C]">{String(hour).padStart(2, "0")}:00</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={HOURS_AGENDA.length + 1} className="px-4 py-16 text-center text-[#131E5C]">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    <span className="text-sm font-semibold">Cargando tráfico...</span>
                                </td>
                            </tr>
                        ) : (
                            weekDates.filter(d => d.getDay() !== 0).map((d, di) => {
                                const today = new Date();
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
                                        {HOURS_AGENDA.map((hour, hi) => {
                                            const dayKey = toYMDLocal(d);
                                            const registrosHora = traficoByDayHour?.[dayKey]?.[hour] || [];
                                            return (
                                                <td key={hi} className="border-r border-b border-black/10 align-top p-1 relative group/cell bg-white hover:bg-slate-50" style={{ minHeight: "72px", verticalAlign: "top" }}>
                                                    {registrosHora.length === 0 && (
                                                        <button
                                                            onClick={() => onNewAtSlot(d, hour)}
                                                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-[#131E5C]/10 text-[#131E5C] opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center hover:bg-[#131E5C] hover:text-white"
                                                            title={`Nuevo ingreso para ${String(hour).padStart(2, "0")}:00`}
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    <div className="flex flex-col gap-2">
                                                        {registrosHora.map((registro) => {
                                                            const dt = new Date(registro.creado_en);
                                                            const mins = String(dt.getMinutes()).padStart(2, "0");
                                                            return (
                                                                <div
                                                                    key={registro.id_trafico}
                                                                    onClick={() => onEdit(registro)}
                                                                    className="rounded-md p-2 text-left cursor-pointer hover:opacity-90 transition-all bg-blue-50 border-l-4 border-blue-500 shadow-sm"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                        <span className="text-xs font-bold text-[#131E5C]">{String(hour).padStart(2, "0")}:{mins}</span>
                                                                    </div>
                                                                    <div className="text-sm font-extrabold text-[#131E5C] truncate">{registro.nombre_prospecto || "—"}</div>
                                                                    <div className="text-xs font-semibold text-slate-600 truncate">🚗 {registro.auto_suenos || "—"}</div>
                                                                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-1">
                                                                        <Phone className="h-3 w-3" /> {registro.telefono || "—"}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 truncate">
                                                                        <span className="font-semibold">Asesor:</span> {registro.asesor_ventas || "—"}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 truncate">
                                                                        <span className="font-semibold">Dealer:</span> {registro.agencia || "—"}
                                                                    </div>
                                                                    {registro.comentarios && registro.comentarios !== "" && (
                                                                        <div className="text-[10px] text-slate-400 italic truncate mt-1">
                                                                            💬 {registro.comentarios.substring(0, 50)}
                                                                        </div>
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

// ==================== HOOKS ====================
function useEncuestaMap() {
    const STORAGE_KEY = "trafico_encuesta_map";

    const [encuestaMap, setEncuestaMap] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        } catch {
            return {};
        }
    });

    const setEncuesta = useCallback((idTrafico, estado) => {
        setEncuestaMap((prev) => {
            const next = { ...prev, [idTrafico]: estado };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    return { encuestaMap, setEncuesta };
}

// ── Hook para guardar respuestas de encuesta ──
function useRespuestasEncuesta() {
    const STORAGE_KEY = "respuestas_encuesta_piso";

    const [respuestasMap, setRespuestasMap] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        } catch {
            return {};
        }
    });

    const guardarRespuesta = useCallback((idTrafico, respuestas) => {
        setRespuestasMap((prev) => {
            const next = { ...prev, [idTrafico]: respuestas };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const obtenerRespuesta = useCallback((idTrafico) => {
        return respuestasMap[idTrafico] || null;
    }, [respuestasMap]);

    return { guardarRespuesta, obtenerRespuesta, respuestasMap };
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function TraficoPiso() {
    const { user, loading: authLoading } = useAuth();

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
            .map((a) => normalizeStr(a))
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

    const [registros, setRegistros] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [vista, setVista] = useState("agenda");
    const [beBackMap, setBeBackMap] = useState({});
    const [updatingBeBack, setUpdatingBeBack] = useState({});

    const { encuestaMap, setEncuesta } = useEncuestaMap();
    const { guardarRespuesta, obtenerRespuesta } = useRespuestasEncuesta();
    const [enviandoEncuesta, setEnviandoEncuesta] = useState({});

    const [filters, setFilters] = useState({ q: "", agencia: "Todos", tipoPersona: "Todos", tiempoCompra: "Todos", rangoDesde: "", rangoHasta: "" });
    const [sort, setSort] = useState({ key: "creado_en", dir: "desc" });
    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [touchedSave, setTouchedSave] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");

    const [modalResultados, setModalResultados] = useState({ open: false, item: null });
    const [resultadosEncuesta, setResultadosEncuesta] = useState([]);
    const [loadingResultados, setLoadingResultados] = useState(false);
    const [errorResultados, setErrorResultados] = useState("");

    const errores = useMemo(() => validarFormulario(draft || INITIAL_FORM), [draft]);
    const missingMap = useMemo(() => {
        const map = new Set();
        if (!draft) return map;
        if (!normalizeStr(draft.agencia)) map.add("agencia");
        if (!normalizeStr(draft.nombre_prospecto)) map.add("nombre_prospecto");
        if (!soloNumeros(draft.codigo_postal)) map.add("codigo_postal");
        if (!validarTelefono(draft.telefono)) map.add("telefono");
        if (!validarEmail(draft.email)) map.add("email");
        if (!normalizeStr(draft.asesor_ventas)) map.add("asesor_ventas");
        if (!draft.motivo_ingreso) map.add("motivo_ingreso");
        if (!draft.tiempo_compra) map.add("tiempo_compra");
        if (!draft.auto_suenos) map.add("auto_suenos");
        if (draft.deja_auto_cuenta && !normalizeStr(draft.modelo_auto_cuenta)) map.add("modelo_auto_cuenta");
        if (!draft.forma_capitalizacion) map.add("forma_capitalizacion");
        if (Number(draft.presupuesto_estimado || 0) < 10000) map.add("presupuesto_estimado");
        if (Number(draft.enganche_presupuestado || 0) < 10000) map.add("enganche_presupuestado");
        if (!draft.mensualidades_presupuestadas) map.add("mensualidades_presupuestadas");
        if (!draft.forma_comprobar_ingresos) map.add("forma_comprobar_ingresos");
        if (!draft.motivo_compra) map.add("motivo_compra");
        if (!draft.perfil_profesional) map.add("perfil_profesional");
        if (!draft.estado_civil) map.add("estado_civil");
        if (!Array.isArray(draft.pasatiempos) || draft.pasatiempos.length < 1) map.add("pasatiempos");
        return map;
    }, [draft]);

    function isInvalid(key) { return touchedSave && missingMap.has(key); }
    function updateField(name, value) { setDraft((prev) => ({ ...(prev || INITIAL_FORM), [name]: value })); }
    function toggleSort(key) { setSort((prev) => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" }); }

    const dealers = useMemo(() => {
        const set = new Set((registros || []).map((r) => normalizeStr(r.agencia)).filter(Boolean));
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }
        return ["Todos", ...Array.from(set)];
    }, [registros, isAdmin, userAgencias]);

    const getStoredToken = useCallback(() => {
        try {
            const access = localStorage.getItem("auth.access");
            if (access && access !== "undefined" && access !== "null") {
                return access;
            }
            const rawAuth = localStorage.getItem("auth");
            if (rawAuth) {
                const parsed = JSON.parse(rawAuth);
                if (parsed?.token) return parsed.token;
                if (parsed?.access) return parsed.access;
            }
            const keys = ["token", "access_token", "accessToken", "auth.token"];
            for (const key of keys) {
                const value = localStorage.getItem(key);
                if (value && value !== "undefined" && value !== "null") {
                    return value;
                }
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    // ── Función para guardar respuestas reales de encuesta ──
    const guardarRespuestasReales = useCallback((idTrafico, respuestas) => {
        guardarRespuesta(idTrafico, respuestas);
        // También actualizar el estado de encuesta a resuelta
        const estadoActual = encuestaMap[idTrafico] || {};
        if (!estadoActual.resuelta) {
            setEncuesta(idTrafico, {
                ...estadoActual,
                resuelta: true,
                fechaRespuesta: new Date().toISOString()
            });
        }
    }, [guardarRespuesta, encuestaMap, setEncuesta]);

    const BASE_URL = "https://crm.grupoautomotrizryr.com";

    const abrirResultados = useCallback(async (item) => {
        setModalResultados({ open: true, item });
        setResultadosEncuesta([]);
        setErrorResultados("");
        setLoadingResultados(true);

        try {
            // 1. Caché local primero
            const respuestasGuardadas = obtenerRespuesta(item.id_trafico);
            if (respuestasGuardadas && respuestasGuardadas.length > 0) {
                setResultadosEncuesta(respuestasGuardadas);
                setLoadingResultados(false);
                return;
            }

            // 2. Buscar en /piso/ con los 3 filtros del ViewSet
            const token = getStoredToken();
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            const telefono = soloNumeros(item.telefono || "");
            const flowToken = `trafico_${item.id_trafico}`;

            const intentos = [
                `${BASE_URL}/api/encuestas/piso/?id_trafico=${item.id_trafico}`,
                `${BASE_URL}/api/encuestas/piso/?flow_token=${encodeURIComponent(flowToken)}`,
                `${BASE_URL}/api/encuestas/piso/?telefono=${telefono}`,
            ];

            for (const url of intentos) {
                try {
                    const res = await fetch(url, { method: "GET", headers });
                    if (!res.ok) continue;
                    const data = await res.json();
                    const lista = Array.isArray(data) ? data : (data.results ?? []);
                    if (lista.length > 0) {
                        guardarRespuestasReales(item.id_trafico, lista);
                        setResultadosEncuesta(lista);
                        setLoadingResultados(false);
                        return;
                    }
                } catch (e) {
                    console.warn("Intento fallido:", url, e.message);
                }
            }

            // 3. Sin resultados
            const estadoEnc = encuestaMap[item.id_trafico];
            setErrorResultados(
                !estadoEnc?.enviada
                    ? "🔔 La encuesta aún no ha sido enviada al cliente."
                    : "⏳ El cliente aún no ha respondido la encuesta."
            );
        } catch (err) {
            setErrorResultados(`Error al cargar: ${err.message}`);
        } finally {
            setLoadingResultados(false);
        }
    }, [obtenerRespuesta, guardarRespuestasReales, encuestaMap, getStoredToken]);



    // ── Función para simular/guardar respuesta de prueba ──
    const simularRespuestaEncuesta = useCallback((item) => {
        const respuestasSimuladas = [{
            id: 1,
            nombre_cliente: item.nombre_prospecto || "Cliente",
            agencia: item.agencia || "Agencia",
            creado: new Date().toISOString(),
            atencion_asesor: 5,
            seguimiento_asesor: 4,
            tiempo_entrega_unidad: 5,
            experiencia_recepcion: 4,
            motivo_visita: "Compra de vehículo nuevo",
            comentario: "Excelente atención, el asesor fue muy profesional y resolvió todas mis dudas.",
            asesor_atendio: item.asesor_ventas || "Asesor",
            id_trafico: item.id_trafico,
            flow_token: `trafico_${item.id_trafico}`
        }];

        guardarRespuestasReales(item.id_trafico, respuestasSimuladas);

        setModalResultados({ open: true, item });
        setResultadosEncuesta(respuestasSimuladas);
        setErrorResultados("");
        setLoadingResultados(false);

        // También marcar la encuesta como resuelta
        setEncuesta(item.id_trafico, {
            enviada: true,
            resuelta: true,
            fechaRespuesta: new Date().toISOString()
        });

        setOk(`✅ Respuesta de prueba guardada para ${item.nombre_prospecto}`);
    }, [guardarRespuestasReales, setEncuesta]);

    async function cargarDatos(params = {}) {
        try {
            setLoadingList(true);
            setError("");

            const [lista, datosResumen] = await Promise.all([
                apiTraficoPiso.list(params),
                apiTraficoPiso.resumen(params).catch(() => null)
            ]);

            const listaFinal = Array.isArray(lista) ? lista : lista?.results || [];
            const listaOrdenada = [...listaFinal].sort((a, b) => {
                const agenciaA = (a.agencia || "").toLowerCase();
                const agenciaB = (b.agencia || "").toLowerCase();
                if (agenciaA < agenciaB) return -1;
                if (agenciaA > agenciaB) return 1;
                return 0;
            });

            setRegistros(listaOrdenada);
            setResumen(datosResumen || null);

            const initialBeBack = {};
            for (const item of listaOrdenada) { initialBeBack[item.id_trafico] = !!item.be_back; }
            setBeBackMap(initialBeBack);
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo cargar el tráfico de piso.");
            setRegistros([]);
        } finally { setLoadingList(false); }
    }

    useEffect(() => {
        if (!authLoading) {
            cargarDatos();
        }
    }, [userAgencia, authLoading, isAdmin]);

    useEffect(() => {
        const onGlobal = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);
        return () => { window.removeEventListener("click", onGlobal); window.removeEventListener("scroll", onGlobal, true); window.removeEventListener("resize", onGlobal); };
    }, []);

    async function toggleBeBack(item) {
        const id = item?.id_trafico;
        if (!id) return;
        const prev = !!beBackMap[id];
        setBeBackMap((p) => ({ ...p, [id]: !prev }));
        setUpdatingBeBack((p) => ({ ...p, [id]: true }));
        try {
            await apiTraficoPiso.patch(id, { be_back: !prev });
        } catch (err) {
            console.error(err);
            setBeBackMap((p) => ({ ...p, [id]: prev }));
        } finally {
            setUpdatingBeBack((p) => {
                const n = { ...p };
                delete n[id];
                return n;
            });
        }
    }

    async function enviarEncuestaPiso(item) {
        const id = item?.id_trafico;
        const telefono = soloNumeros(item?.telefono || "");
        if (!id || !telefono) return;

        const telefonoFormateado =
            telefono.length === 10
                ? `52${telefono}`
                : telefono.length === 12 && telefono.startsWith("52")
                    ? telefono
                    : null;

        if (!telefonoFormateado) {
            alert(`Teléfono inválido para ${item.nombre_prospecto}: ${item.telefono}`);
            return;
        }

        const confirmar = window.confirm(
            `¿Enviar encuesta de piso a ${item.nombre_prospecto}?\nTeléfono: ${telefonoFormateado}`
        );
        if (!confirmar) return;

        setEnviandoEncuesta((p) => ({ ...p, [id]: true }));

        try {
            const IMAGE_URL = "https://i.imgur.com/wKJqh2K.jpeg";
            let mediaId = null;

            try {
                const imgRes = await fetch(IMAGE_URL);
                const blob = await imgRes.blob();
                const form = new FormData();
                form.append("messaging_product", "whatsapp");
                form.append("type", blob.type || "image/jpeg");
                form.append("file", blob, "encuesta.jpg");

                const uploadRes = await fetch(
                    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/media`,
                    {
                        method: "POST",
                        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
                        body: form,
                    }
                );
                const uploadData = await uploadRes.json();
                if (!uploadData.id) throw new Error(uploadData.error?.message || "Error al subir imagen");
                mediaId = uploadData.id;
            } catch (imgErr) {
                console.warn("No se pudo subir imagen:", imgErr.message);
            }

            const components = [];

            if (mediaId) {
                components.push({
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: { id: mediaId },
                        },
                    ],
                });
            }

            components.push({
                type: "button",
                sub_type: "flow",
                index: "0",
                parameters: [
                    {
                        type: "action",
                        action: {
                            flow_token: `trafico_${id}`,
                        },
                    },
                ],
            });

            const payload = {
                messaging_product: "whatsapp",
                to: telefonoFormateado,
                type: "template",
                template: {
                    name: "enc_piso",
                    language: { code: "en" },
                    components,
                },
            };

            const res = await fetch(
                `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error?.message || `Error ${res.status}`);
            }

            setEncuesta(id, {
                enviada: true,
                resuelta: false,
                fechaEnvio: new Date().toISOString(),
                wamid: data.messages?.[0]?.id || null,
            });

            setOk(`Encuesta enviada a ${item.nombre_prospecto} ✓`);
        } catch (err) {
            console.error(err);
            setError(`No se pudo enviar la encuesta: ${err.message}`);
        } finally {
            setEnviandoEncuesta((p) => {
                const n = { ...p };
                delete n[id];
                return n;
            });
        }
    }

    function openCreate() {
        setError("");
        setOk("");
        setTouchedSave(false);
        setMode("create");
        setDraft({ ...INITIAL_FORM, agencia: isAdmin ? "" : userAgencias[0] || "" });
        setOpenModal(true);
    }

    async function openEdit(row) {
        if (!row?.id_trafico) return;
        try {
            setError(""); setOk(""); setTouchedSave(false); setMode("edit"); setOpenModal(true); setLoadingDetail(true);
            const item = await apiTraficoPiso.get(row.id_trafico);

            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(item.agencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDraft({
                ...INITIAL_FORM,
                ...item,
                presupuesto_estimado: item.presupuesto_estimado === null || item.presupuesto_estimado === undefined ? "" : String(parseInt(item.presupuesto_estimado || 0, 10) || ""),
                enganche_presupuestado: item.enganche_presupuestado === null || item.enganche_presupuestado === undefined ? "" : String(parseInt(item.enganche_presupuestado || 0, 10) || ""),
                mensualidades_presupuestadas: item.mensualidades_presupuestadas ? String(item.mensualidades_presupuestadas) : "",
                edad: item.edad === null || item.edad === undefined ? "" : String(item.edad),
                cantidad_hijos: item.cantidad_hijos === null || item.cantidad_hijos === undefined ? "0" : String(item.cantidad_hijos),
                pasatiempos: Array.isArray(item.pasatiempos) ? item.pasatiempos : [],
                deja_auto_cuenta: !!item.deja_auto_cuenta,
                comprueba_ingresos: !!item.comprueba_ingresos
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo abrir el registro.");
            setOpenModal(false);
        } finally { setLoadingDetail(false); }
    }

    function closeModal() { if (saving) return; setOpenModal(false); setDraft(null); setTouchedSave(false); }

    async function save() {
        if (!draft || saving) return;
        setTouchedSave(true); setError(""); setOk("");
        const actuales = validarFormulario(draft);
        if (actuales.length) { setError(actuales[0]); return; }
        try {
            setSaving(true);
            const payload = normalizarPayload(draft);
            if (mode === "edit" && draft.id_trafico) {
                await apiTraficoPiso.update(draft.id_trafico, payload);
                setOk("Registro actualizado correctamente.");
            } else {
                await apiTraficoPiso.create(payload);
                setOk("Registro guardado correctamente.");
            }
            await cargarDatos();
            closeModal();
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo guardar el registro.");
        } finally { setSaving(false); }
    }

    async function eliminar(row) {
        if (!row?.id_trafico) return;

        if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        const confirmar = window.confirm(`¿Eliminar el registro de ${row.nombre_prospecto || "este prospecto"}?`);
        if (!confirmar) return;
        try {
            setError(""); setOk("");
            await apiTraficoPiso.remove(row.id_trafico);
            await cargarDatos();
            setOk("Registro eliminado correctamente.");
        } catch (err) {
            console.error(err);
            setError(err.message || "No se pudo eliminar el registro.");
        } finally {
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        }
    }

    function onRowContextMenu(e, row) { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); }
    function resetFilters() { setFilters({ q: "", agencia: "Todos", tipoPersona: "Todos", tiempoCompra: "Todos", rangoDesde: "", rangoHasta: "" }); }
    function setHoy() { const hoy = toYMDLocal(new Date()); setFilters((prev) => ({ ...prev, rangoDesde: hoy, rangoHasta: hoy })); }
    function handleNewAtSlot(date, hour) { openCreate(); }

    const filtered = useMemo(() => {
        const q = normalizeStr(filters.q).toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return (registros || []).filter((item) => {
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(item.agencia)) return false;

            const searchable = [item.agencia, item.nombre_prospecto, item.telefono, item.email, item.asesor_ventas, item.motivo_ingreso, item.tipo_persona, item.tiempo_compra, item.auto_suenos, item.forma_capitalizacion, item.perfil_profesional, item.estado_civil, item.comentarios].map((v) => normalizeStr(v).toLowerCase()).join(" ");
            const matchQ = !q || searchable.includes(q);
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(item.agencia) === normalizeStr(filters.agencia);
            const matchTipo = filters.tipoPersona === "Todos" || item.tipo_persona === filters.tipoPersona;
            const matchTiempo = filters.tiempoCompra === "Todos" || item.tiempo_compra === filters.tiempoCompra;
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymd = toYMDLocal(item.creado_en);
                const ymdInt = ymdToInt(ymd);
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchTipo && matchTiempo && matchRango;
        });
    }, [registros, filters, isAdmin, userAgencias, userTieneAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (["creado_en"].includes(key)) {
                const ta = a[key] ? new Date(a[key]).getTime() : 0;
                const tb = b[key] ? new Date(b[key]).getTime() : 0;
                return (ta - tb) * mult;
            }
            if (["presupuesto_estimado", "enganche_presupuestado"].includes(key)) {
                return (Number(a[key] || 0) - Number(b[key] || 0)) * mult;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const ViewToggle = () => (
        <div className="flex items-center rounded-lg border border-[#131E5C]/30 overflow-hidden">
            {[
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

    if (authLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[#131E5C]" /></div>;
    }

    if (!isAdmin && !userAgencia) {
        return <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center"><p className="text-amber-800 font-semibold">⚠️ No se ha asignado una sucursal a tu usuario. Contacta al administrador.</p></div>;
    }

    const exportarExcel = () => {
        const titulo = [["REPORTE TRÁFICO DE PISO — GRUPO AUTOMOTRIZ R&R"]];
        const fechaGen = [[`Generado: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`]];
        const filtrosActivos = [];
        if (filters.agencia !== "Todos") filtrosActivos.push(`Dealer: ${filters.agencia}`);
        if (filters.tipoPersona !== "Todos") filtrosActivos.push(`Tipo persona: ${filters.tipoPersona}`);
        if (filters.tiempoCompra !== "Todos") filtrosActivos.push(`Tiempo compra: ${filters.tiempoCompra}`);
        if (filters.rangoDesde) filtrosActivos.push(`Desde: ${filters.rangoDesde}`);
        if (filters.rangoHasta) filtrosActivos.push(`Hasta: ${filters.rangoHasta}`);
        if (filters.q) filtrosActivos.push(`Búsqueda: "${filters.q}"`);
        const filtroFila = [[filtrosActivos.length ? `Filtros activos: ${filtrosActivos.join("  |  ")}` : "Sin filtros activos"]];
        const totalFila = [[`Total de registros: ${sorted.length}`]];

        const encabezados = [[
            "N°", "Fecha", "Dealer", "Prospecto", "Teléfono", "Email",
            "Asesor Ventas", "Motivo Ingreso", "Tipo Persona", "Tiempo Compra",
            "Auto Sueños", "Deja Auto Cuenta", "Modelo Auto Cuenta",
            "Forma Capitalización", "Presupuesto", "Enganche",
            "Mensualidades", "Comprueba Ingresos", "Forma Comprobar",
            "Motivo Compra", "Perfil Profesional", "Estado Civil",
            "Edad", "Hijos", "Pasatiempos", "Be Back",
            "Encuesta Enviada", "Encuesta Resuelta", "Comentarios",
        ]];

        const filas = sorted.map((row, i) => {
            const enc = encuestaMap[row.id_trafico];
            return [
                i + 1,
                dateTime(row.creado_en),
                row.agencia || "—",
                row.nombre_prospecto || "—",
                row.telefono || "—",
                row.email || "—",
                row.asesor_ventas || "—",
                row.motivo_ingreso || "—",
                row.tipo_persona || "—",
                row.tiempo_compra || "—",
                row.auto_suenos || "—",
                row.deja_auto_cuenta ? "Sí" : "No",
                row.modelo_auto_cuenta || "—",
                row.forma_capitalizacion || "—",
                Number(row.presupuesto_estimado || 0),
                Number(row.enganche_presupuestado || 0),
                row.mensualidades_presupuestadas || "—",
                row.comprueba_ingresos ? "Sí" : "No",
                row.forma_comprobar_ingresos || "—",
                row.motivo_compra || "—",
                row.perfil_profesional || "—",
                row.estado_civil || "—",
                row.edad || "—",
                row.cantidad_hijos ?? "—",
                Array.isArray(row.pasatiempos) ? row.pasatiempos.join(", ") : "—",
                beBackMap[row.id_trafico] ? "Sí" : "No",
                enc?.enviada ? "Sí" : "No",
                enc?.resuelta ? "Sí" : "Pendiente",
                row.comentarios || "—",
            ];
        });

        const ws = XLSX.utils.aoa_to_sheet([...titulo, ...fechaGen, ...filtroFila, ...totalFila, [[]], ...encabezados, ...filas]);
        ws["!cols"] = [
            { wch: 5 }, { wch: 20 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 28 },
            { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
            { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
            { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 12 }, { wch: 6 }, { wch: 6 },
            { wch: 40 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 40 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tráfico de piso");
        XLSX.writeFile(wb, `trafico_piso_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Tráfico de piso</h2>
                    <p className="text-sm text-slate-400">
                        Control de prospectos que ingresan físicamente a la agencia.
                        {!isAdmin && userAgencias.length > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#131E5C]/10 px-2 py-0.5 text-xs font-bold text-[#131E5C]">
                                <Building2 className="h-3 w-3" /> {userAgencias.join(", ")}
                            </span>
                        )}
                    </p>
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
                    <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80">
                        <Plus className="h-4 w-4" /> Nuevo ingreso
                    </button>
                </div>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
            {ok && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{ok}</div>}

            {(vista === "tabla" || vista === "graficos") && (
                <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <FilterBlock label="Búsqueda">
                                <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                    <Search className="h-4 w-4 text-[#131E5C]" />
                                    <input value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Buscar por prospecto, teléfono, asesor, ingreso…" className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]/70" />
                                    {filters.q && <button type="button" onClick={() => setFilters((p) => ({ ...p, q: "" }))} className="rounded-lg bg-white p-1 text-[#131E5C] hover:bg-white/80 hover:text-red-500"><X className="h-4 w-4" /></button>}
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-2">
                            <FilterBlock label="Dealer">
                                <select
                                    value={filters.agencia}
                                    onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                                    className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
                                >
                                    {dealers.map((d) => (
                                        <option key={d} value={d} className="bg-neutral-100 text-[#131E5C]">{d}</option>
                                    ))}
                                </select>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-2">
                            <FilterBlock label="Tipo persona">
                                <select value={filters.tipoPersona} onChange={(e) => setFilters((p) => ({ ...p, tipoPersona: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                    <option value="Todos">Todos</option>
                                    {TIPOS_PERSONA.map((x) => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-2">
                            <FilterBlock label="Tiempo compra">
                                <select value={filters.tiempoCompra} onChange={(e) => setFilters((p) => ({ ...p, tiempoCompra: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                    <option value="Todos">Todos</option>
                                    {TIEMPOS_COMPRA.map((x) => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-2">
                            <FilterBlock label="Acciones">
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={setHoy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><CalendarDays className="h-4 w-4" /> Hoy</button>
                                    <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"><X className="h-4 w-4" /> Limpiar</button>
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Desde"><input type="date" value={filters.rangoDesde} onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" /></FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Hasta"><input type="date" value={filters.rangoHasta} onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" /></FilterBlock>
                        </div>
                    </div>
                </div>
            )}

            {vista === "agenda" && <AgendaTraficoPiso rows={sorted} loading={loadingList} onEdit={openEdit} onNewAtSlot={handleNewAtSlot} />}

            {vista === "tabla" && (
                <>
                    <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-[1200px] w-full text-left text-sm">
                                <thead className="font-vw-header border border-black bg-[#131E5C] text-xs text-white">
                                    <tr>
                                        <th className="px-4 py-3"><SortButton label="Fecha" sortKey="creado_en" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3"><SortButton label="Dealer" sortKey="agencia" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3"><SortButton label="Prospecto" sortKey="nombre_prospecto" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3">Teléfono</th>
                                        <th className="px-4 py-3"><SortButton label="Asesor" sortKey="asesor_ventas" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3">Ingreso</th>
                                        <th className="px-4 py-3">Compra</th>
                                        <th className="px-4 py-3"><SortButton label="Presupuesto" sortKey="presupuesto_estimado" sort={sort} onClick={toggleSort} /></th>
                                        <th className="px-4 py-3">Auto cuenta</th>
                                        <th className="px-4 py-3 text-center">Be Back</th>
                                        <th className="px-4 py-3 text-center">Enviar Encuesta</th>
                                        <th className="px-4 py-3 text-center">Resolvió Encuesta</th>
                                        <th className="px-4 py-3 text-center">Ver Resultados</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : (
                                        <>
                                            {sorted.map((item) => {
                                                const isUpdating = !!updatingBeBack[item.id_trafico];
                                                const beBack = !!beBackMap[item.id_trafico];
                                                const estadoEnc = encuestaMap[item.id_trafico];
                                                const enviando = !!enviandoEncuesta[item.id_trafico];
                                                return (
                                                    <tr key={item.id_trafico} onDoubleClick={() => openEdit(item)} onContextMenu={(e) => onRowContextMenu(e, item)} className="cursor-pointer hover:bg-white/[0.04]" title="Doble clic para editar">
                                                        <td className="px-4 py-3 text-[#131E5C]">{dateTime(item.creado_en)}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="max-w-[160px] truncate font-extrabold">{item.agencia || "—"}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="max-w-[240px] truncate font-extrabold">{item.nombre_prospecto || "—"}</div>{item.email && <div className="mt-1 max-w-[240px] truncate text-xs text-slate-500">{item.email}</div>}</td>
                                                        <td className="px-4 py-3 font-semibold text-[#131E5C]">{item.telefono || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="max-w-[230px] truncate font-semibold">{item.asesor_ventas || "—"}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="max-w-[210px] font-semibold">{item.motivo_ingreso || "—"}</div><div className="mt-1 text-xs font-bold text-slate-500">{item.tipo_persona || "—"}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="font-semibold">{item.tiempo_compra || "—"}</div><div className="mt-1 max-w-[220px] truncate text-xs font-bold text-slate-500">Auto: {item.auto_suenos || "—"}</div><div className="mt-1 max-w-[220px] truncate text-xs font-bold text-slate-500">{item.forma_capitalizacion || "—"}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="font-extrabold">{money(item.presupuesto_estimado)}</div><div className="mt-1 text-xs font-semibold text-slate-500">Eng. {money(item.enganche_presupuestado)}</div></td>
                                                        <td className="px-4 py-3"><span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold", item.deja_auto_cuenta ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-red-300 bg-red-100 text-red-800"].join(" ")}>{item.deja_auto_cuenta ? "Sí" : "No"}</span>{item.deja_auto_cuenta && item.modelo_auto_cuenta && <div className="mt-1 max-w-[160px] truncate text-xs font-semibold text-slate-500">{item.modelo_auto_cuenta}</div>}</td>

                                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <button type="button" disabled={isUpdating} onClick={() => toggleBeBack(item)} className={["inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition", beBack ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "border-red-300 bg-red-100 text-red-800 hover:bg-red-200", isUpdating ? "cursor-not-allowed opacity-70" : ""].join(" ")}>{isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}{beBack ? "Sí" : "No"}</button>
                                                        </td>

                                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            {estadoEnc?.enviada ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                                                        ✓ Enviada
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => enviarEncuestaPiso(item)}
                                                                        disabled={enviando}
                                                                        className="text-[10px] font-semibold text-slate-400 underline hover:text-[#131E5C] transition"
                                                                    >
                                                                        Reenviar
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={enviando}
                                                                    onClick={() => enviarEncuestaPiso(item)}
                                                                    className={[
                                                                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition",
                                                                        enviando
                                                                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70"
                                                                            : "border-[#131E5C] bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white",
                                                                    ].join(" ")}
                                                                >
                                                                    {enviando
                                                                        ? <><Loader2 className="h-3 w-3 animate-spin" /> Enviando...</>
                                                                        : <><MessageSquareText className="h-3 w-3" /> Enviar</>
                                                                    }
                                                                </button>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            {!estadoEnc?.enviada ? (
                                                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">
                                                                    —
                                                                </span>
                                                            ) : estadoEnc?.resuelta ? (
                                                                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                                                    ✓ Sí
                                                                </span>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                                                        ⏳ Pendiente
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            // Marcar como resuelta manualmente
                                                                            setEncuesta(item.id_trafico, {
                                                                                ...estadoEnc,
                                                                                resuelta: true,
                                                                                fechaRespuesta: new Date().toISOString()
                                                                            });
                                                                            // Y recargar los resultados
                                                                            abrirResultados(item);
                                                                        }}
                                                                        className="text-[10px] font-semibold text-slate-400 underline hover:text-emerald-700 transition"
                                                                    >
                                                                        Marcar resuelta
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            {!estadoEnc?.enviada ? (
                                                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">
                                                                    —
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => abrirResultados(item)}
                                                                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 hover:bg-blue-200 transition"
                                                                >
                                                                    <ClipboardList className="h-3 w-3" /> Ver
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {sorted.length === 0 && <tr><td colSpan={13} className="px-4 py-10 text-center text-[#131E5C]">No hay registros de tráfico de piso con esos filtros.</td></tr>}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid gap-3 lg:hidden">
                        {loadingList ? <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 font-bold text-[#131E5C]"><Loader2 className="h-5 w-5 animate-spin" /> Cargando...</div></div> : (
                            <>
                                {sorted.map((item) => {
                                    const estadoEnc = encuestaMap[item.id_trafico];
                                    return (
                                        <button key={item.id_trafico} type="button" onClick={() => openEdit(item)} className="rounded-3xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0"><div className="truncate text-sm font-extrabold text-[#131E5C]">{item.nombre_prospecto || "—"}</div><div className="mt-1 text-xs text-slate-600">{item.agencia || "Sin dealer"} • {item.telefono || "—"} • {item.tipo_persona || "—"}</div><div className="mt-1 text-xs text-slate-600">{dateTime(item.creado_en)}</div><div className="mt-1 text-xs text-slate-600">Asesor: {item.asesor_ventas || "—"}</div></div>
                                                <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold", item.deja_auto_cuenta ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-red-300 bg-red-100 text-red-800"].join(" ")}>Auto: {item.deja_auto_cuenta ? "Sí" : "No"}</span>
                                            </div>
                                            <div className="mt-3 text-sm text-slate-700 line-clamp-3">{item.motivo_ingreso || "—"} • {item.tiempo_compra || "—"} • {item.auto_suenos || "Sin auto"} • {money(item.presupuesto_estimado)}</div>
                                            {estadoEnc?.enviada && (
                                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                    <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                        Encuesta enviada
                                                    </span>
                                                    {estadoEnc?.resuelta && (
                                                        <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                                            ✓ Resuelta
                                                        </span>
                                                    )}
                                                    {!estadoEnc?.resuelta && (
                                                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                                            ⏳ Pendiente
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); abrirResultados(item); }}
                                                        className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-200 transition"
                                                    >
                                                        <ClipboardList className="h-3 w-3" /> Ver
                                                    </button>
                                                </div>
                                            )}
                                            {!estadoEnc?.enviada && (
                                                <div className="mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); enviarEncuestaPiso(item); }}
                                                        className="inline-flex items-center gap-1 rounded-full border border-[#131E5C] bg-white px-2 py-0.5 text-[10px] font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white transition"
                                                    >
                                                        <MessageSquareText className="h-3 w-3" /> Enviar encuesta
                                                    </button>
                                                </div>
                                            )}
                                            <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                                        </button>
                                    );
                                })}
                                {sorted.length === 0 && <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">No hay registros de tráfico de piso con esos filtros.</div>}
                            </>
                        )}
                    </div>
                </>
            )}

            {vista === "graficos" && <GraficosView rows={sorted} />}

            {/* ── Modal Resultados Encuesta Piso ── */}
            {modalResultados.open && modalResultados.item && createPortal(
                <div className="fixed inset-0 z-[70]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                        onClick={() => setModalResultados({ open: false, item: null })} />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#131E5C] bg-neutral-100 shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between gap-3 px-5 py-4 shrink-0" style={{ backgroundColor: BRAND_BLUE }}>
                                <div className="min-w-0">
                                    <div className="text-base font-extrabold text-white">📋 Resultados de encuesta de piso</div>
                                    <div className="mt-1 text-xs font-semibold text-white/70 truncate">
                                        {modalResultados.item.nombre_prospecto} · {modalResultados.item.telefono} · {modalResultados.item.agencia}
                                    </div>
                                </div>
                                <button type="button"
                                    onClick={() => setModalResultados({ open: false, item: null })}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5">
                                {loadingResultados && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-[#131E5C]" />
                                        <span className="text-sm font-semibold text-slate-500">Cargando resultados...</span>
                                        <span className="text-xs text-slate-400">Esto puede tomar unos segundos</span>
                                    </div>
                                )}

                                {errorResultados && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 flex items-start gap-3">
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <div className="font-bold">Información</div>
                                            <div className="font-normal text-red-600">{errorResultados}</div>
                                            {errorResultados.includes("ejemplo") && (
                                                <button
                                                    onClick={() => simularRespuestaEncuesta(modalResultados.item)}
                                                    className="mt-2 text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                                                >
                                                    💾 Guardar respuesta de prueba
                                                </button>
                                            )}
                                            <button
                                                onClick={() => abrirResultados(modalResultados.item)}
                                                className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-900 ml-2"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!loadingResultados && !errorResultados && resultadosEncuesta.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
                                        <div className="text-6xl">📭</div>
                                        <div className="text-sm font-semibold text-center text-slate-500">
                                            No se encontraron respuestas
                                        </div>
                                        <div className="text-xs text-slate-400 text-center max-w-sm">
                                            Las respuestas aparecerán aquí una vez que el cliente complete la encuesta de WhatsApp.
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                                                ⏳ {encuestaMap[modalResultados.item.id_trafico]?.enviada ? 'Enviada' : 'Pendiente de envío'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => simularRespuestaEncuesta(modalResultados.item)}
                                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition"
                                        >
                                            💾 Guardar respuesta de prueba
                                        </button>
                                    </div>
                                )}

                                {!loadingResultados && resultadosEncuesta.map((r, idx) => {
                                    const fecha = r.creado_en
                                        ? new Date(r.creado_en).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                        : "—";

                                    // Mapeo de palabras a número de estrellas
                                    const STAR_MAP = { cinco: 5, cuatro: 4, tres: 3, dos: 2, uno: 1 };

                                    // Labels para campos de opción múltiple
                                    const FINANCIAMIENTO_LABELS = {
                                        si: "Sí, fue claro",
                                        no_claro: "Información no fue clara",
                                        incompleto: "No indicó todos los tipos",
                                    };
                                    const MEDIO_CONTACTO_LABELS = {
                                        si: "Sí",
                                        parcial: "Parcialmente",
                                        no: "No",
                                    };
                                    const PRUEBA_MANEJO_LABELS = {
                                        si_realice: "Sí, realicé prueba de manejo",
                                        no_auto: "No estaba el auto deseado",
                                        no_ofrecio: "No se me ofreció",
                                    };
                                    const RECOMENDACION_LABELS = {
                                        cumplio: "Sí, completamente",
                                        parcial: "Parcialmente",
                                        no_cumplio: "No",
                                    };
                                    const SI_NO_LABELS = { si: "Sí", no: "No" };

                                    const renderStars = (val, max = 5) => {
                                        // val ya viene como número desde la API, no necesita STAR_MAP
                                        const n = Math.min(Math.max(parseInt(val) || 0, 0), max);
                                        return (
                                            <div className="flex gap-0.5 items-center">
                                                {Array.from({ length: max }, (_, i) => (
                                                    <span key={i} style={{ color: i < n ? "#f59e0b" : "#d1d5db", fontSize: "1.2rem" }}>
                                                        {i < n ? "★" : "☆"}
                                                    </span>
                                                ))}
                                                <span className="ml-1 text-lg font-extrabold text-[#131E5C]">{n}</span>
                                            </div>
                                        );
                                    };

                                    const renderOpcion = (valor, labels) => (
                                        <span className={[
                                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border",
                                            valor === "si" || valor === "cumplio" || valor === "si_realice"
                                                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                                : valor === "parcial"
                                                    ? "bg-amber-100 border-amber-300 text-amber-700"
                                                    : "bg-red-100 border-red-300 text-red-700"
                                        ].join(" ")}>
                                            {labels[valor] ?? valor ?? "—"}
                                        </span>
                                    );

                                    // Las 4 preguntas con estrellas
                                    const preguntasEstrellas = [
                                        { label: "Atención al llegar", icon: "⭐", campo: "atencion_llegada" },
                                        { label: "Instalaciones / Amenidades", icon: "🏢", campo: "amenidades" },
                                        { label: "Atención del asesor", icon: "👤", campo: "atencion_asesor" },
                                        { label: "Experiencia general", icon: "🌟", campo: "experiencia" },
                                    ];

                                    return (
                                        <div key={idx} className="mb-5 rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
                                            {/* Header */}
                                            <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-black/10 bg-[#131E5C]/5">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-extrabold text-[#131E5C] truncate">
                                                        👤 {r.nombre_cliente || modalResultados.item.nombre_prospecto || "—"}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {r.agencia || modalResultados.item.agencia || "—"} · {fecha}
                                                    </div>
                                                    {r.id_trafico && (
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            ID: {r.id_trafico} {r.flow_token && `· ${r.flow_token}`}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 shrink-0">
                                                    Encuesta Piso
                                                </span>
                                            </div>

                                            <div className="p-4 space-y-4">

                                                {/* Bloque 1: Las 4 calificaciones con estrellas */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {preguntasEstrellas.map((p) => (
                                                        <div key={p.campo} className="rounded-xl border border-black/10 bg-white p-3 shadow-sm flex flex-col gap-2">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                                                {p.icon} {p.label}
                                                            </div>
                                                            {renderStars(r[p.campo])}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bloque 2: Preguntas de opción */}
                                                <div className="rounded-xl border border-black/10 bg-slate-50 p-4 space-y-3">
                                                    <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-1">Preguntas de opción</div>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-600">💰 Claridad sobre financiamiento</span>
                                                        {renderOpcion(r.financiamiento, FINANCIAMIENTO_LABELS)}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-600">🏬 Atendido por área correcta</span>
                                                        {renderOpcion(r.medio_contacto, MEDIO_CONTACTO_LABELS)}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-600">🚗 Prueba de manejo</span>
                                                        {renderOpcion(r.prueba_manejo, PRUEBA_MANEJO_LABELS)}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-600">✅ ¿Cumplió expectativas?</span>
                                                        {renderOpcion(r.recomendacion, RECOMENDACION_LABELS)}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-600">📞 ¿Te contactó post-visita?</span>
                                                        {renderOpcion(r.contacto_post, SI_NO_LABELS)}
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <span className="text-xs font-semibold text-slate-600">⏱️ ¿Contacto en menos de 48 horas?</span>
                                                        {renderOpcion(r.tiempo_contacto, SI_NO_LABELS)}
                                                    </div>
                                                </div>

                                                {/* Bloque 3: Comentarios */}
                                                <div className="rounded-xl border border-black/10 bg-slate-50 p-4" style={{ borderLeft: "4px solid #131E5C" }}>
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">📝 Comentarios</div>
                                                    {r.comentarios?.trim()
                                                        ? <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.comentarios}</p>
                                                        : <p className="text-xs text-slate-400 italic">Sin comentarios</p>
                                                    }
                                                </div>

                                                {/* Asesor */}
                                                {r.asesor_atendio && (
                                                    <div className="text-xs text-slate-500 bg-white/50 px-3 py-2 rounded-lg border border-black/5">
                                                        <span className="font-bold">Asesor que atendió:</span> {r.asesor_atendio}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {!loadingResultados && !errorResultados && resultadosEncuesta.length > 0 && (
                                    <div className="text-center text-xs text-slate-400 pt-2 border-t border-black/10 mt-2">
                                        {resultadosEncuesta.length} respuesta{resultadosEncuesta.length !== 1 ? 's' : ''} encontrada{resultadosEncuesta.length !== 1 ? 's' : ''}
                                        {resultadosEncuesta[0]?.id_trafico && (
                                            <span className="block text-[10px] text-slate-300 mt-1">
                                                ID: {resultadosEncuesta[0].id_trafico}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminar} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />

            <Modal open={openModal} title={mode === "create" ? "Nuevo ingreso de tráfico de piso" : `Editar tráfico de piso • #${draft?.id_trafico || ""}`} onClose={closeModal} footer={
                <>
                    <div className="min-w-0 text-xs font-bold text-slate-500">{errores.length > 0 && touchedSave ? `Pendiente: ${errores[0]}` : "Los campos marcados con * son obligatorios."}</div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button type="button" onClick={closeModal} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 hover:text-white disabled:opacity-60"><X className="h-4 w-4" /> Cancelar</button>
                        <button type="button" onClick={save} disabled={saving || loadingDetail} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Guardando..." : "Guardar cambios"}</button>
                    </div>
                </>
            }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="space-y-4">
                        <Section title="Datos generales" icon={User}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Dealer" icon={Building2} required invalid={isInvalid("agencia")}>
                                    <Select
                                        value={draft.agencia}
                                        invalid={isInvalid("agencia")}
                                        onChange={(e) => updateField("agencia", e.target.value)}
                                        disabled={!isAdmin && userAgencias.length <= 1}
                                        className={!isAdmin && userAgencias.length <= 1 ? "opacity-75 cursor-not-allowed" : ""}
                                    >
                                        <option value="">Seleccionar dealer...</option>
                                        {(isAdmin ? DEALERS : userAgencias).map((dealer) => (
                                            <option key={dealer} value={dealer}>{dealer}</option>
                                        ))}
                                    </Select>
                                </Field>
                                <Field label="Nombre del prospecto" icon={User} required hint="Mayúsculas" invalid={isInvalid("nombre_prospecto")}><Input value={draft.nombre_prospecto} invalid={isInvalid("nombre_prospecto")} onChange={(e) => updateField("nombre_prospecto", e.target.value.toUpperCase())} placeholder="NOMBRE COMPLETO" /></Field>
                                <Field label="Código postal" icon={ClipboardList} required invalid={isInvalid("codigo_postal")}><Input value={draft.codigo_postal} invalid={isInvalid("codigo_postal")} onChange={(e) => updateField("codigo_postal", soloNumeros(e.target.value).slice(0, 5))} inputMode="numeric" placeholder="68300" /></Field>
                                <Field label="Teléfono" icon={Phone} required invalid={isInvalid("telefono")}><Input value={draft.telefono} invalid={isInvalid("telefono")} onChange={(e) => updateField("telefono", soloNumeros(e.target.value).slice(0, 12))} inputMode="numeric" placeholder="10 dígitos" /></Field>
                                <Field label="E-mail" icon={Mail} invalid={isInvalid("email")}><Input type="email" value={draft.email} invalid={isInvalid("email")} onChange={(e) => updateField("email", e.target.value)} placeholder="correo@dominio.com" /></Field>
                                <Field label="Asesor de ventas" icon={UserRoundSearch} required hint="Buscar" invalid={isInvalid("asesor_ventas")}><AsesorAutocomplete value={draft.asesor_ventas} invalid={isInvalid("asesor_ventas")} onChange={(value) => updateField("asesor_ventas", value)} /></Field>
                                <Field label="Ingresó a la agencia porque" icon={MessageSquareText} required invalid={isInvalid("motivo_ingreso")}><Select value={draft.motivo_ingreso} invalid={isInvalid("motivo_ingreso")} onChange={(e) => updateField("motivo_ingreso", e.target.value)}><option value="">Seleccionar...</option>{MOTIVOS_INGRESO.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Tipo de persona" icon={Users} required><div className="grid grid-cols-2 gap-2">{TIPOS_PERSONA.map((tipo) => (<button key={tipo} type="button" onClick={() => updateField("tipo_persona", tipo)} className={["rounded-lg border px-3 py-2 text-sm font-extrabold transition", draft.tipo_persona === tipo ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-black/10 bg-white text-[#131E5C] hover:bg-slate-50"].join(" ")}>{tipo}</button>))}</div></Field>
                            </div>
                        </Section>
                        <Section title="Intención de compra" icon={CarFront}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Programación de compra" icon={Clock} required invalid={isInvalid("tiempo_compra")}><Select value={draft.tiempo_compra} invalid={isInvalid("tiempo_compra")} onChange={(e) => updateField("tiempo_compra", e.target.value)}><option value="">Seleccionar...</option>{TIEMPOS_COMPRA.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="¿Deja auto a cuenta?" icon={CarFront} required><BooleanSwitch value={!!draft.deja_auto_cuenta} onChange={(value) => updateField("deja_auto_cuenta", value)} /></Field>
                                <Field label="Auto de sus sueños" icon={CarFront} required invalid={isInvalid("auto_suenos")}><Select value={draft.auto_suenos} invalid={isInvalid("auto_suenos")} onChange={(e) => updateField("auto_suenos", e.target.value)}><option value="">Seleccionar...</option>{VEHICULOS.map((vehiculo) => <option key={vehiculo} value={vehiculo}>{vehiculo}</option>)}</Select></Field>
                                <Field label="Modelo de auto a cuenta" icon={CarFront} required={!!draft.deja_auto_cuenta} invalid={isInvalid("modelo_auto_cuenta")}><Input value={draft.modelo_auto_cuenta} invalid={isInvalid("modelo_auto_cuenta")} disabled={!draft.deja_auto_cuenta} onChange={(e) => updateField("modelo_auto_cuenta", e.target.value)} placeholder="Ej. Jetta 2020" /></Field>
                                <Field label="Forma de capitalización" icon={CircleDollarSign} required invalid={isInvalid("forma_capitalizacion")}><Select value={draft.forma_capitalizacion} invalid={isInvalid("forma_capitalizacion")} onChange={(e) => updateField("forma_capitalizacion", e.target.value)}><option value="">Seleccionar...</option>{FORMAS_CAPITALIZACION.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Presupuesto estimado" icon={BadgeDollarSign} required hint="Mín. 5 dígitos" invalid={isInvalid("presupuesto_estimado")}><Input value={draft.presupuesto_estimado} invalid={isInvalid("presupuesto_estimado")} onChange={(e) => updateField("presupuesto_estimado", soloNumeros(e.target.value))} inputMode="numeric" placeholder="300000" /></Field>
                                <Field label="Enganche presupuestado" icon={BadgeDollarSign} required hint="Mín. 5 dígitos" invalid={isInvalid("enganche_presupuestado")}><Input value={draft.enganche_presupuestado} invalid={isInvalid("enganche_presupuestado")} onChange={(e) => updateField("enganche_presupuestado", soloNumeros(e.target.value))} inputMode="numeric" placeholder="50000" /></Field>
                                <Field label="Mensualidades presupuestadas" icon={CalendarDays} required invalid={isInvalid("mensualidades_presupuestadas")}><Select value={draft.mensualidades_presupuestadas} invalid={isInvalid("mensualidades_presupuestadas")} onChange={(e) => updateField("mensualidades_presupuestadas", e.target.value)}><option value="">Seleccionar...</option>{MENSUALIDADES.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                            </div>
                        </Section>
                        <Section title="Perfil financiero" icon={ShieldCheck}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Comprobación de ingresos" icon={ShieldCheck} required><BooleanSwitch value={!!draft.comprueba_ingresos} onChange={(value) => updateField("comprueba_ingresos", value)} /></Field>
                                <Field label="Forma de comprobar ingresos" icon={ClipboardList} required invalid={isInvalid("forma_comprobar_ingresos")}><Select value={draft.forma_comprobar_ingresos} invalid={isInvalid("forma_comprobar_ingresos")} onChange={(e) => updateField("forma_comprobar_ingresos", e.target.value)}>{FORMAS_COMPROBAR_INGRESOS.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                            </div>
                        </Section>
                        <Section title="Perfil del prospecto" icon={BriefcaseBusiness}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Motivo de compra" icon={MessageSquareText} required invalid={isInvalid("motivo_compra")}><Select value={draft.motivo_compra} invalid={isInvalid("motivo_compra")} onChange={(e) => updateField("motivo_compra", e.target.value)}><option value="">Seleccionar...</option>{MOTIVOS_COMPRA.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Perfil profesional" icon={BriefcaseBusiness} required invalid={isInvalid("perfil_profesional")}><Select value={draft.perfil_profesional} invalid={isInvalid("perfil_profesional")} onChange={(e) => updateField("perfil_profesional", e.target.value)}><option value="">Seleccionar...</option>{PERFILES_PROFESIONALES.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Estado civil" icon={Users} required invalid={isInvalid("estado_civil")}><Select value={draft.estado_civil} invalid={isInvalid("estado_civil")} onChange={(e) => updateField("estado_civil", e.target.value)}><option value="">Seleccionar...</option>{ESTADOS_CIVILES.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
                                <Field label="Edad" icon={User}><Input value={draft.edad} onChange={(e) => updateField("edad", soloNumeros(e.target.value).slice(0, 3))} inputMode="numeric" placeholder="35" /></Field>
                                <Field label="Cantidad de hijos" icon={Users}><Input value={draft.cantidad_hijos} onChange={(e) => updateField("cantidad_hijos", soloNumeros(e.target.value).slice(0, 2))} inputMode="numeric" placeholder="0" /></Field>
                            </div>
                            <div className="mt-3"><PasatiemposPicker value={draft.pasatiempos || []} invalid={isInvalid("pasatiempos")} onChange={(value) => updateField("pasatiempos", value)} /></div>
                            <div className="mt-3"><Field label="Comentarios" icon={MessageSquareText}><Textarea value={draft.comentarios} onChange={(e) => updateField("comentarios", e.target.value)} placeholder="Notas adicionales del asesor..." /></Field></div>
                        </Section>
                    </div>
                )}
            </Modal>
        </div>
    );
}