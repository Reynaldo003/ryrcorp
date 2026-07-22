// src/pages/Calidad/NoConformidad.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    AlertCircle,
    AlertTriangle,
    BarChart2,
    Building,
    Building2,
    CalendarDays,
    ChevronDown,
    Eye,
    File as FileIcon,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Flag,
    Loader2,
    Package,
    RefreshCw,
    Save,
    Search,
    SlidersHorizontal,
    Star,
    TableProperties,
    Tag,
    Trash2,
    TrendingDown,
    UploadCloud,
    Users,
    Wrench,
    Car,
    X,
    XCircle,
} from "lucide-react";

import JDPOWER from "/jdpower.svg";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import ENCUESTA from "/encuesta.svg";
import SPEAK from "/speak.svg";
import PHONE from "/phone.svg";

import {
    obtenerEncuestasJDPower,
    obtenerOpcionesJDPower,
} from "../../lib/apiJDPower";
import { apiServicio } from "../../lib/apiServicio";
import { apiEncuestas } from "../../lib/apiEncuestas";
import { api } from "../../lib/api";

// ─── Colores ────────────────────────────────────────────────────────────────
const NAVY = "#0B1F5E";
const RED = "#D85A30";
const RED_LIGHT = "#F4A68C";
const ORANGE = "#F0A500";
const AMBER = "#FCD34D";
const GRAY = "#6B7280";
const CHART_COLORS = ["#D85A30", "#F0A500", "#FCD34D", "#0E718A", "#86B8C8", "#7F77DD", "#D4537E", "#0B1F5E"];

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_CORTOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const ANIO_ACTUAL = String(new Date().getFullYear());

const TooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

// ─── Concesionarias ─────────────────────────────────────────────────────────
// IMPORTANTE: estos nombres deben coincidir EXACTO con el array DEALERS de
// src/pages/crm/CrmCases.jsx para que el select de "Dealer" del caso matchee.
const CONCESIONARIAS = {
    "1905": "VW Tuxtepec",
    "2923": "VW Cordoba",
    "2924": "VW Orizaba",
    "2927": "VW Poza Rica",
    "2929": "VW Tuxpan",
};

function nombreConcesionaria(codigo) {
    return CONCESIONARIAS[String(codigo)] || null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function parseFechaLocal(fecha) {
    if (!fecha) return null;
    const soloFecha = String(fecha).slice(0, 10);
    const partes = soloFecha.split("-").map(Number);
    if (partes.length < 3) return null;
    const [anio, mes, dia] = partes;
    if (!anio || !mes || !dia) return null;
    return new Date(anio, mes - 1, dia);
}

function numeroSeguro(valor) {
    const n = Number(valor ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function numero(valor) {
    return numeroSeguro(valor).toLocaleString("es-MX");
}

function normalizarEscalaCinco(valor) {
    const n = numeroSeguro(valor);
    if (!n) return 0;
    return n > 5 ? (n / 10) * 5 : n;
}

function recortar(texto, max = 22) {
    const v = String(texto || "Sin dato");
    return v.length <= max ? v : `${v.slice(0, max)}…`;
}

// Busca el valor de satisfacción sin importar el nombre exacto del campo
// ni si viene como string o número. Cubre todos los casos posibles.
function extraerSatisfaccion(item) {
    const candidatos = [
        "q1_satisfaccion_general",
        "satisfaccion_general",
        "calificacion_general",
        "calificacion",
        "satisfaccion",
        "rating",
        "estrellas",
        "score",
    ];

    for (const key of candidatos) {
        const raw = item[key];
        if (raw !== undefined && raw !== null && raw !== "") {
            const n = Number(raw);
            if (Number.isFinite(n) && n > 0) return n;
        }
    }

    // Último recurso: cualquier campo cuyo nombre contenga "satisfac"
    // con un valor numérico razonable (entre 1 y 10)
    for (const key of Object.keys(item)) {
        if (/satisfac/i.test(key)) {
            const n = Number(item[key]);
            if (Number.isFinite(n) && n > 0 && n <= 10) return n;
        }
    }

    return 0;
}

function mapearEncuestaComun(item, fuente) {
   
    const fechaBase =
        item.periodo ||
        item.fecha_encuesta ||
        item.fecha_entrega ||
        item.fecha_servicio ||
        item.creado ||
        "";
    const fecha = parseFechaLocal(fechaBase);
    const periodoMostrar = fechaBase ? String(fechaBase).slice(0, 10) : "";

   
    const satisfaccionRaw = extraerSatisfaccion(item);
    const satisfaccion5 = normalizarEscalaCinco(satisfaccionRaw);

   
    const esInterna = fuente === "Enc. Servicio" || fuente === "Enc. Entrega";

    const idVentas =
        item.id_ventas ||
        item.id_servicio ||
        item.nombre_OS_cliente ||
        String(item.id_encuesta || item.id || "");

    const idEncuesta = String(item.id_encuesta || item.id_muestra || "");

    const estatusFinal = item.estatus || (esInterna ? "Interna" : "Sin estatus");

    const codigoConcesionaria = item.codigo_concesionaria || "";

    const concesionariaFinal =
        item.concesionaria ||
        nombreConcesionaria(item.codigo_concesionaria) ||
        item.agencia ||
        "Sin concesionaria";

    const asesorRaw = item.id_asesor || item.asesor_atendio || item.asesor || "";
    const asesorFinal = String(asesorRaw).trim() || "Sin asesor";

    const modeloFinal = item.modelo || "—";
    const chasisFinal = item.chasis || "—";

    return {
        fuente,
        id_ventas: idVentas,
        periodo: periodoMostrar,
        id_encuesta: idEncuesta,
        estatus: estatusFinal,
        codigo_concesionaria: codigoConcesionaria,
        concesionaria: concesionariaFinal,
        id_asesor: asesorFinal,
        modelo: modeloFinal,
        chasis: chasisFinal,
        q1_satisfaccion_general: satisfaccion5,
        satisfaccion_raw: satisfaccionRaw,
        p3_recomendacion_distribuidor: numeroSeguro(item.p3_recomendacion_distribuidor || item.q3_recomendacion),
        p1_satisfaccion_producto: numeroSeguro(item.p1_satisfaccion_producto),
        comentario:
            item.comentario ||
            item.q4_comentarios_servicio ||
            item.q3_comentarios_adicionales ||
            item.q1_1_razones_calificacion ||
            item.p1_1_comentarios_auto ||
            item.comentarios ||
            item.motivo ||
            "",
        seguimiento: item.seguimiento || null,
        anio: fecha ? fecha.getFullYear() : 0,
        mes: fecha ? fecha.getMonth() + 1 : 0,
    };
}

function esNoConformidad(item) {
    const s = Math.round(item.q1_satisfaccion_general);
    return s >= 1 && s <= 3;
}


function agruparPor(datos, obtenerClave, limite = 10) {
    const map = new Map();
    datos.forEach((item) => {
        const clave = obtenerClave(item) || "Sin dato";
        if (!map.has(clave)) {
            map.set(clave, { name: clave, total: 0, rating1: 0, rating2: 0, rating3: 0 });
        }
        const actual = map.get(clave);
        actual.total += 1;
        const r = Math.round(item.q1_satisfaccion_general);
        if (r === 1) actual.rating1 += 1;
        else if (r === 2) actual.rating2 += 1;
        else if (r === 3) actual.rating3 += 1;
    });
    return Array.from(map.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limite);
}

// ─── Metadatos / helpers del módulo de Casos (duplicado de CrmCases.jsx) ────
const CASO_BLUE = "#131E5C";

const DEALERS_CASO = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Chirey", "JAECOO R&R"];

const opcionesRaizCaso = {
    "Gestion de Clientes": [
        "Respuestas lentas a las quejas", "Falta de seguimiento postventa", "Encuestas de satisfacción poco frecuentes o inexistentes",
        "Mala gestión de la experiencia del cliente en el showroom", "Falta de personal dedicado a la atención al cliente",
        "Tiempos de espera prolongados para servicios de mantenimiento", "Falta de comunicación proactiva con los clientes",
        "Carencia de programas de fidelización", "Problemas en la gestión de citas y servicios programados",
        "Deficiencias en la personalización del servicio", "Falta de transparencia en la información proporcionada a los clientes",
        "Deficiencias en la gestión de la imagen y reputación", "Falta de atención a los comentarios y reseñas",
        "Problemas en la gestión de garantías", "Falta de ofertas y promociones atractivas", "Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados", "Mal uso de CRM", "Problemas en la gestión de reclamaciones y devoluciones",
    ],
    Metodo: [
        "Procesos complejos", "Procesos poco explícitos", "Incumplimiento en la ejecución", "Procesos limitados",
        "Falta de documentación y registro", "Falta de integración entre departamentos", "Inconsistencias en la aplicación",
        "Procesos no optimizados", "Falta de estandarización en la atención al cliente", "Ausencia de procedimientos claros para la gestión de garantías",
        "Falta de protocolos para la entrega de vehículos nuevos", "Falta de automatización en procesos administrativos",
        "Retrasos en la tramitación de documentos", "Ineficiencia en la programación de citas", "Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia", "Deficiencias en el control de calidad", "Falta de auditorías internas periódicas",
        "Problemas en la implementación de sistemas ERP", "Deficiencias en la gestión de proyectos", "Falta de revisiones periódicas",
        "Procedimientos redundantes", "Falta de actualización de manuales operativos", "Uso ineficiente de recursos",
        "Falta de un sistema de gestión de calidad total",
    ],
    Materiales: [
        "Insuficiencia de materiales", "Materiales en mal estado", "Materiales descalibrados", "Difícil disponibilidad", "Costos elevados",
        "Variabilidad en la calidad", "Obsolescencia", "Falta de stock de piezas de alta demanda", "Problemas con proveedores no confiables",
        "Almacenamiento inadecuado de piezas", "Pérdidas por deterioro", "Falta de control de inventarios", "Gestión ineficaz de devoluciones",
        "Uso de materiales no homologados", "Falta de piezas específicas para ciertos modelos", "Problemas en la logística de entrega",
        "Retrasos en la recepción de materiales importados", "Problemas en la aduana", "Roturas durante el transporte", "Embalajes inadecuados",
        "Falta de previsión en pedidos", "Fallos en la trazabilidad de piezas",
    ],
    Infraestructura: [],
    "Talento Humano": [
        "Falta de capacitación", "Falta de adiestramiento", "Problemas de comunicación", "Desmotivación", "Conflictos laborales",
        "Alta rotación de personal", "Falta de reconocimiento", "Cargas de trabajo excesivas", "Ausentismo", "Falta de liderazgo efectivo",
        "Insuficiente personal de ventas durante picos de demanda", "Falta de técnicos especializados en postventa",
        "Ausencia de programas de desarrollo profesional y mentoría", "Evaluación de desempeño inadecuada", "Falta de incentivos y bonificaciones",
        "Falta de claridad en las expectativas laborales", "Escasa participación de los empleados en la toma de decisiones",
        "Deficiencias en la gestión del talento", "Falta de programas de bienestar laboral", "Problemas con la gestión del tiempo",
        "Personal de nuevo ingreso", "Problemas de retención de talento clave", "Baja moral del equipo", "Falta de diversidad e inclusión",
        "Problemas con la conciliación laboral y familiar", "Ausencia de un plan de carrera claro", "Falta de apoyo psicológico",
        "Falta de programas de salud y seguridad laboral",
    ],
};

const lineaMetaCaso = {
    Ventas: { Icon: Tag, label: "Ventas" },
    Servicio: { Icon: Wrench, label: "Servicio" },
    Usados: { Icon: Car, label: "Usados" },
    Refacciones: { Icon: Package, label: "Refacciones" },
    General: { Icon: Building2, label: "General" },
};

const ImgIconCaso = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;
const origenMetaCaso = {
    "JD Power": { Icon: ImgIconCaso(JDPOWER, "JD Power"), label: "JD Power" },
    Whatsapp: { Icon: ImgIconCaso(WAP, "Whatsapp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIconCaso(FB, "Facebook"), label: "Facebook" },
    "Encuesta Interna": { Icon: ImgIconCaso(ENCUESTA, "Encuesta"), label: "Encuesta" },
    "Reclamacion Verbal": { Icon: ImgIconCaso(SPEAK, "Verbal"), label: "Verbal" },
    "Llamada de Calidad": { Icon: ImgIconCaso(PHONE, "Llamada"), label: "Llamada" },
};

function pad2Caso(n) {
    return String(n).padStart(2, "0");
}

function localInputToBackendCaso(localStr) {
    if (!localStr) return null;
    return new Date(localStr).toISOString();
}

function todayYYYYMMDDCaso() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2Caso(d.getMonth() + 1)}-${pad2Caso(d.getDate())}`;
}

function getFileKindCaso(file) {
    const name = (file?.name || "").toLowerCase();
    const type = (file?.type || "").toLowerCase();
    if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image";
    if (type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)$/.test(name)) return "video";
    if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (type.includes("spreadsheet") || /\.(xlsx|xls|csv)$/.test(name)) return "excel";
    return "other";
}

function formatBytesCaso(bytes = 0) {
    if (!bytes) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Deduce línea/origen sugeridos a partir de la fuente de la encuesta
function deducirLineaDesdeFuente(fuente) {
    if (fuente === "JD Power Ventas" || fuente === "Enc. Entrega") return "Ventas";
    if (fuente === "JD Power Servicio" || fuente === "Enc. Servicio") return "Servicio";
    return "General";
}
function deducirOrigenDesdeFuente(fuente) {
    return String(fuente || "").includes("JD Power") ? "JD Power" : "Encuesta Interna";
}

// ─── Componentes UI generales ────────────────────────────────────────────────
function DashboardPanel({ title, icon: Icon, children, className = "" }) {
    return (
        <div className={`overflow-hidden rounded-[6px] bg-white shadow-sm ${className}`}>
            <div className="flex min-h-[42px] items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-2">
                {Icon ? <Icon size={17} className="shrink-0 text-[#D85A30]" /> : null}
                <p className="truncate text-[15px] font-black text-[#555A61]">{title}</p>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function StatCard({ label, value, sub, color }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ backgroundColor: color || RED }} />
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-2xl font-black text-gray-800">{value}</p>
            {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
        </div>
    );
}

function SelectField({ label, value, onChange, children }) {
    return (
        <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-[38px] min-w-[145px] appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-red-200"
                >
                    {children}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
        </div>
    );
}

function RatingBadge({ value }) {
    const r = Math.round(value);
    const color = r === 1 ? "#D85A30" : r === 2 ? "#F0A500" : "#FCD34D";
    const stars = "★".repeat(r) + "☆".repeat(3 - r);
    return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black text-white" style={{ backgroundColor: color }}>
            {stars} {value.toFixed(1)}
        </span>
    );
}

// ─── Subcomponentes del formulario de Caso (duplicado de CrmCases.jsx) ──────
function StarRatingCaso({ value = 0, onChange }) {
    const v = Number(value || 0);
    const setByClick = (e, i) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const half = e.clientX - rect.left < rect.width / 2 ? 0.5 : 1;
        onChange?.(Math.max(0, Math.min(5, i + half)));
    };
    return (
        <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => {
                const fill = Math.max(0, Math.min(1, v - i));
                return (
                    <button type="button" key={i} onClick={(e) => setByClick(e, i)} className="relative h-8 w-8">
                        <Star className="h-8 w-8 text-slate-300" />
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                            <Star className="h-8 w-8 text-yellow-500 fill-yellow-400" />
                        </span>
                    </button>
                );
            })}
            <span className="ml-2 text-sm font-bold" style={{ color: CASO_BLUE }}>{v.toFixed(1)}</span>
        </div>
    );
}

function BadgeEstadoCaso({ value }) {
    const map = {
        "1er contacto": "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        "2do contacto": "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        "3er contacto": "bg-red-500/15 text-red-800 border-red-300/25",
        "reclamación cerrada": "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
    };
    const cls = map[String(value || "").toLowerCase()] || "bg-white/10 text-white/85 border-white/20";
    return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{value || "Sin estado"}</span>;
}

function FieldCaso({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: CASO_BLUE }}>
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function OrigenPickerCaso({ value, onChange }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {Object.entries(origenMetaCaso).map(([key, meta]) => {
                const Active = value === key;
                const Icon = meta.Icon;
                return (
                    <button
                        type="button"
                        key={key}
                        onClick={() => onChange(key)}
                        className={`group rounded-lg border p-1 text-left shadow-md transition ${Active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/30" : "border-black/10 bg-neutral-100 hover:bg-white"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border ${Active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="text-sm" style={{ color: CASO_BLUE }}>{meta.label}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function LineaPickerCaso({ value, onChange }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {Object.entries(lineaMetaCaso).map(([key, meta]) => {
                const Active = value === key;
                const Icon = meta.Icon;
                return (
                    <button
                        type="button"
                        key={key}
                        onClick={() => onChange(key)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-1 shadow-lg transition ${Active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/30" : "border-black/10 bg-neutral-100 hover:bg-white"
                            }`}
                    >
                        <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${Active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white"
                                }`}
                        >
                            <Icon className="h-4 w-4" style={{ color: CASO_BLUE }} />
                        </span>
                        <span className="text-sm" style={{ color: CASO_BLUE }}>{meta.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function CausaRaizCaso({ causa, raiz, onChangeCausa, onChangeRaiz, invalidCausa, invalidRaiz }) {
    const raices = opcionesRaizCaso[causa] || [];
    const baseCls = "w-full rounded-2xl border shadow-lg px-3 py-2 text-sm font-semibold outline-none";
    const okCls = "border-black/10 bg-neutral-100";
    const badCls = "border-red-500 bg-red-50";
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div>
                <div className="mb-2 text-xs font-bold" style={{ color: CASO_BLUE }}>Causa</div>
                <select
                    value={causa || ""}
                    onChange={(e) => {
                        onChangeCausa(e.target.value);
                        onChangeRaiz("");
                    }}
                    className={[baseCls, invalidCausa ? badCls : okCls].join(" ")}
                    style={{ color: CASO_BLUE }}
                >
                    <option value="">Selecciona</option>
                    {Object.keys(opcionesRaizCaso).map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                {invalidCausa ? <div className="mt-1 text-xs font-semibold text-red-600">Campo obligatorio</div> : null}
            </div>
            <div>
                <div className="mb-2 text-xs font-bold" style={{ color: CASO_BLUE }}>Raíz</div>
                <select
                    value={raiz || ""}
                    onChange={(e) => onChangeRaiz(e.target.value)}
                    disabled={!causa || raices.length === 0}
                    className={[baseCls, invalidRaiz ? badCls : okCls, "disabled:opacity-50"].join(" ")}
                    style={{ color: CASO_BLUE }}
                >
                    <option value="">{!causa ? "Selecciona causa primero" : raices.length ? "Selecciona" : "Sin opciones"}</option>
                    {raices.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                {invalidRaiz ? <div className="mt-1 text-xs font-semibold text-red-600">Campo obligatorio</div> : null}
            </div>
        </div>
    );
}

function DocumentacionUploaderCaso({ files, onChange, onDeleteServerFile }) {
    const inputRef = useRef(null);
    const onPick = () => inputRef.current?.click();

    const onFilesSelected = (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length) return;
        const next = picked.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            size: f.size || 0,
            type: f.type || "",
            kind: getFileKindCaso(f),
            url: URL.createObjectURL(f),
            _raw: f,
        }));
        onChange([...(files || []), ...next]);
        e.target.value = "";
    };

    const removeFile = async (file) => {
        if (file?.url?.startsWith("blob:")) URL.revokeObjectURL(file.url);
        onChange((files || []).filter((x) => (x.id || x.id_doc) !== (file.id || file.id_doc)));
        if (file?._fromServer && file?.id_doc && onDeleteServerFile) await onDeleteServerFile(file.id_doc);
    };

    const iconByKind = (kind) =>
        kind === "image" ? FileImage : kind === "video" ? FileVideo : kind === "pdf" ? FileText : kind === "excel" ? FileSpreadsheet : FileIcon;

    return (
        <div className="space-y-3">
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.xlsx,.xls,.csv"
                className="hidden"
                onChange={onFilesSelected}
            />
            <button
                type="button"
                onClick={onPick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white shadow-lg px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                style={{ color: CASO_BLUE }}
            >
                <UploadCloud className="h-4 w-4" />
                Adjuntar archivos
            </button>
            <div className="grid gap-2">
                {(files || []).length === 0 ? (
                    <div className="rounded-lg border border-black/10 bg-neutral-100 p-4 text-sm text-slate-500">
                        Sin archivos adjuntos.
                    </div>
                ) : (
                    (files || []).map((f) => {
                        const Icon = iconByKind(f.kind);
                        return (
                            <div
                                key={f.id || f.id_doc}
                                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-neutral-100 p-3 shadow-lg"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white">
                                        <Icon className="h-5 w-5" style={{ color: CASO_BLUE }} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-extrabold" style={{ color: CASO_BLUE }}>{f.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {formatBytesCaso(f.size)} • {(f.kind || "other").toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => window.open(f.url, "_blank", "noopener,noreferrer")}
                                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold hover:bg-neutral-50"
                                        style={{ color: CASO_BLUE }}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Ver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(f)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Quitar
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Modal de Caso (crear/editar) desde una No Conformidad ──────────────────
const REQUIRED_CASO = {
    chasis: "Chasis",
    cliente_nombre: "ID Venta (auto)",
    cliente_apellidos: "N° Encuesta (auto)",
    os_exp: "OS-Expediente",
    agencia: "Dealer",
    fecha_atencion: "Fecha de atención",
    fecha_reclamacion: "Fecha de reclamación",
    linea: "Línea",
    origen: "Origen",
    estado: "Estado",
    causa: "Causa",
    raiz: "Raíz",
    problema: "Problema",
};

function ModalCasoNoConformidad({ item, onClose, onGuardado }) {
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);

    useEffect(() => {
        if (!item) return;

        async function init() {
            setTouchedSave(false);

            // Si ya existe un caso vinculado a esta no conformidad, lo editamos
            if (item.seguimiento?.id_exp) {
                setMode("edit");
                setLoadingDetail(true);
                try {
                    const detail = await api.getCaso(item.seguimiento.id_exp);
                    const docs = Array.isArray(detail.documentacion) ? detail.documentacion : [];
                    setDraft({
                        ...detail,
                        documentacion: docs.map((d) => ({
                            id: d.id_doc,
                            id_doc: d.id_doc,
                            name: d.nombre_original || "archivo",
                            size: d.size || 0,
                            type: d.mime || "",
                            kind: getFileKindCaso({ name: d.nombre_original, type: d.mime }),
                            url: d.url,
                            _fromServer: true,
                        })),
                    });
                } catch (e) {
                    console.error(e);
                    alert("No se pudo cargar el caso vinculado.");
                } finally {
                    setLoadingDetail(false);
                }
                return;
            }

            // Caso nuevo, prellenado desde la encuesta de no conformidad
            setMode("create");
            const agenciaSugerida = nombreConcesionaria(item.codigo_concesionaria);
            setDraft({
                chasis: item.chasis || "",
                os_exp: "",
                agencia: DEALERS_CASO.includes(agenciaSugerida) ? agenciaSugerida : "",
                // En vez de capturar nombre/apellido del cliente (no viene en la encuesta),
                // usamos el ID de venta y el número de encuesta como referencia automática.
                cliente_nombre: item.id_ventas || "S/D",
                cliente_apellidos: item.id_encuesta || "S/D",
                telefono: "",
                correo: "",
                linea: deducirLineaDesdeFuente(item.fuente),
                fecha_atencion: todayYYYYMMDDCaso(),
                fecha_reclamacion: item.periodo ? String(item.periodo).slice(0, 10) : todayYYYYMMDDCaso(),
                origen: deducirOrigenDesdeFuente(item.fuente),
                estado: "1er contacto",
                problema: item.comentario
                    ? `[Generado desde No Conformidad — ${item.fuente} · ID ${item.id_ventas || item.id_encuesta || "s/d"}]\n${item.comentario}`
                    : `[Generado desde No Conformidad — ${item.fuente} · ID ${item.id_ventas || item.id_encuesta || "s/d"}]`,
                calificacion: item.q1_satisfaccion_general || 0,
                recopilacion: "",
                causa: "",
                raiz: "",
                documentacion: [],
                fecha_contacto_1: "",
                fecha_contacto_2: "",
                fecha_contacto_3: "",
                fecha_contacto_cierre: "",
                obs_contacto_1: "",
                obs_contacto_2: "",
                obs_contacto_3: "",
                obs_contacto_cierre: "",
            });
        }

        init();
    }, [item]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape" && !saving) onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, saving]);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED_CASO).filter((key) => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft]);

    if (!item) return null;

    const isInvalid = (key) => touchedSave && missing.includes(key);
    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    async function handleGuardar() {
        setTouchedSave(true);
        if (missing.length) return;

        setSaving(true);
        try {
            const localFiles = (draft.documentacion || []).map((x) => x?._raw).filter(Boolean);
            const payload = {
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
                calificacion: draft.calificacion ?? null,
                recopilacion: draft.recopilacion || "",
                causa: draft.causa,
                raiz: draft.raiz,
                obs_contacto_1: draft.obs_contacto_1,
                fecha_contacto_1: localInputToBackendCaso(draft.fecha_contacto_1),
                obs_contacto_2: draft.obs_contacto_2,
                fecha_contacto_2: localInputToBackendCaso(draft.fecha_contacto_2),
                obs_contacto_3: draft.obs_contacto_3,
                fecha_contacto_3: localInputToBackendCaso(draft.fecha_contacto_3),
                obs_contacto_cierre: draft.obs_contacto_cierre,
                fecha_contacto_cierre: localInputToBackendCaso(draft.fecha_contacto_cierre),
            };

            let saved;
            if (mode === "create") saved = await api.createCaso(payload);
            else saved = await api.updateCaso(draft.id_exp, payload);

            if (localFiles.length) await api.uploadDocs(saved.id_exp, localFiles);

            onGuardado(item, saved);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error guardando el caso (revisa consola).");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border bg-neutral-100 shadow-2xl" style={{ borderColor: CASO_BLUE }}>
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: CASO_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">
                                {mode === "create" ? "Nuevo caso desde No Conformidad" : `Editar caso • ${draft?.id_exp || ""}`}
                            </div>
                            <div className="text-xs text-white/60">
                                {item.id_ventas || "Sin ID"} · {item.fuente}
                            </div>
                        </div>
                        <button
                            onClick={saving ? undefined : onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5">
                        {loadingDetail || !draft ? (
                            <div className="rounded-2xl border border-black/10 bg-white p-6">
                                <div className="flex items-center gap-2 font-bold" style={{ color: CASO_BLUE }}>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Cargando...
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {touchedSave && missing.length ? (
                                    <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <div className="font-extrabold">Faltan campos obligatorios</div>
                                        <div className="mt-1 text-xs font-semibold">
                                            {missing.map((k) => REQUIRED_CASO[k]).join(" • ")}
                                        </div>
                                    </div>
                                ) : null}

                                <FieldCaso label="Chasis" icon={Building}>
                                    <input
                                        value={draft.chasis || ""}
                                        onChange={(e) => setDraft((p) => ({ ...p, chasis: e.target.value }))}
                                        className={[inputBase, isInvalid("chasis") ? inputBad : inputOk].join(" ")}
                                        style={{ color: CASO_BLUE }}
                                    />
                                </FieldCaso>

                                <FieldCaso label="Dealer" icon={Building2}>
                                    <select
                                        value={draft.agencia || ""}
                                        onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))}
                                        className={[inputBase, isInvalid("agencia") ? inputBad : inputOk].join(" ")}
                                        style={{ color: CASO_BLUE }}
                                    >
                                        <option value="" disabled>Selecciona un dealer...</option>
                                        {DEALERS_CASO.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </FieldCaso>

                                {/* Referencia de la encuesta de origen: ID de Venta / N° de Encuesta
                                    (solo lectura — reemplaza a Nombre/Apellidos, que no existen en la encuesta) */}
                                <div className="md:col-span-2">
                                    <FieldCaso label="Referencia de la encuesta" icon={Users}>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <div className="mb-1 text-xs font-bold" style={{ color: CASO_BLUE }}>ID de Venta</div>
                                                <input
                                                    value={item.id_ventas || "Sin dato"}
                                                    readOnly
                                                    disabled
                                                    className={[inputBase, inputOk, "cursor-not-allowed opacity-80"].join(" ")}
                                                    style={{ color: CASO_BLUE }}
                                                />
                                            </div>
                                            <div>
                                                <div className="mb-1 text-xs font-bold" style={{ color: CASO_BLUE }}>Número de Encuesta</div>
                                                <input
                                                    value={item.id_encuesta || "Sin dato"}
                                                    readOnly
                                                    disabled
                                                    className={[inputBase, inputOk, "cursor-not-allowed opacity-80"].join(" ")}
                                                    style={{ color: CASO_BLUE }}
                                                />
                                            </div>
                                        </div>
                                    </FieldCaso>
                                </div>

                                <FieldCaso label="Fecha de Reclamación" icon={CalendarDays}>
                                    <input
                                        type="date"
                                        value={draft.fecha_reclamacion || ""}
                                        onChange={(e) => setDraft((p) => ({ ...p, fecha_reclamacion: e.target.value }))}
                                        className={[inputBase, isInvalid("fecha_reclamacion") ? inputBad : inputOk].join(" ")}
                                        style={{ color: CASO_BLUE }}
                                    />
                                </FieldCaso>

                                <FieldCaso label="Fecha de Atención" icon={CalendarDays}>
                                    <input
                                        type="date"
                                        value={draft.fecha_atencion || ""}
                                        onChange={(e) => setDraft((p) => ({ ...p, fecha_atencion: e.target.value }))}
                                        className={[inputBase, isInvalid("fecha_atencion") ? inputBad : inputOk].join(" ")}
                                        style={{ color: CASO_BLUE }}
                                    />
                                </FieldCaso>

                                <FieldCaso label="Estado" icon={Flag}>
                                    <select
                                        value={draft.estado || ""}
                                        onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value }))}
                                        className={[inputBase, isInvalid("estado") ? inputBad : inputOk].join(" ")}
                                        style={{ color: CASO_BLUE }}
                                    >
                                        {["1er contacto", "2do contacto", "3er contacto", "Reclamación cerrada"].map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <div className="mt-2">
                                        <BadgeEstadoCaso value={draft.estado} />
                                    </div>
                                </FieldCaso>

                                <FieldCaso label="OS-Expediente" icon={FileText}>
                                    <input
                                        value={draft.os_exp || ""}
                                        onChange={(e) => setDraft((p) => ({ ...p, os_exp: e.target.value.replace(/\D/g, "") }))}
                                        className={[inputBase, isInvalid("os_exp") ? inputBad : inputOk].join(" ")}
                                        style={{ color: CASO_BLUE }}
                                    />
                                </FieldCaso>

                                <div className="md:col-span-2">
                                    <FieldCaso label="Descripción del Problema" icon={FileText}>
                                        <textarea
                                            value={draft.problema || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, problema: e.target.value }))}
                                            rows={4}
                                            className={[inputBase, isInvalid("problema") ? inputBad : inputOk].join(" ")}
                                            style={{ color: CASO_BLUE }}
                                        />
                                    </FieldCaso>
                                </div>

                                <FieldCaso label="Origen">
                                    <OrigenPickerCaso value={draft.origen} onChange={(v) => setDraft((p) => ({ ...p, origen: v }))} />
                                </FieldCaso>

                                <FieldCaso label="Línea">
                                    <LineaPickerCaso value={draft.linea} onChange={(v) => setDraft((p) => ({ ...p, linea: v }))} />
                                </FieldCaso>

                                <div className="md:col-span-2">
                                    <FieldCaso label="Causa / Raíz" icon={FileText}>
                                        <CausaRaizCaso
                                            causa={draft.causa}
                                            raiz={draft.raiz}
                                            onChangeCausa={(v) => setDraft((p) => ({ ...p, causa: v }))}
                                            onChangeRaiz={(v) => setDraft((p) => ({ ...p, raiz: v }))}
                                            invalidCausa={isInvalid("causa")}
                                            invalidRaiz={isInvalid("raiz")}
                                        />
                                    </FieldCaso>
                                </div>

                                <div className="md:col-span-2">
                                    <FieldCaso label="Documentación">
                                        <DocumentacionUploaderCaso
                                            files={draft.documentacion || []}
                                            onChange={(next) => setDraft((p) => ({ ...p, documentacion: next }))}
                                            onDeleteServerFile={async (idDoc) => {
                                                await api.deleteDoc(idDoc);
                                            }}
                                        />
                                    </FieldCaso>
                                </div>

                                <div className="md:col-span-2">
                                    <FieldCaso label="Recopilación del cliente / Calificación" icon={Star}>
                                        <div className="mb-3">
                                            <StarRatingCaso
                                                value={draft.calificacion || 0}
                                                onChange={(val) => setDraft((p) => ({ ...p, calificacion: val }))}
                                            />
                                        </div>
                                        <textarea
                                            value={draft.recopilacion || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, recopilacion: e.target.value }))}
                                            rows={3}
                                            className={[inputBase, inputOk].join(" ")}
                                            style={{ color: CASO_BLUE }}
                                            placeholder="Escribe la opinión del cliente..."
                                        />
                                    </FieldCaso>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            onClick={saving ? undefined : onClose}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardar}
                            disabled={saving || loadingDetail}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white/90 hover:text-white disabled:opacity-60"
                            style={{ backgroundColor: `${CASO_BLUE}d9` }}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Vista Tabla ─────────────────────────────────────────────────────────────
function VistaTabla({ datos, onVerDetalle }) {
    const datosTabla = datos.slice(0, 1000);
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {datos.length > 1000 ? (
                <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                    Mostrando 1,000 de {numero(datos.length)} registros.
                </div>
            ) : null}
            <p className="px-4 py-2 text-[10px] text-gray-400 border-b border-gray-100 bg-gray-50/60">
                💡 Haz <strong>doble clic</strong> en una fila, o usa el botón de la columna "Seguimiento", para crear o editar el caso vinculado.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr style={{ backgroundColor: NAVY }} className="text-left text-white">
                            {["Fuente", "ID Venta", "Periodo", "Encuesta", "Estatus", "Concesionaria", "Asesor", "Modelo", "Chasis", "Satisfacción", "Recomendación", "Producto", "Comentario", "Seguimiento"].map((h) => (
                                <th key={h} className={`px-4 py-3 font-medium ${["Satisfacción", "Recomendación", "Producto", "Seguimiento"].includes(h) ? "text-right" : ""} ${h === "Seguimiento" ? "text-center" : ""}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {datosTabla.map((item, index) => (
                            <tr
                                key={`${item.id_ventas}-${index}`}
                                onDoubleClick={() => onVerDetalle(item)}
                                className={`cursor-pointer border-t border-gray-100 transition hover:bg-red-50/40 select-none ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                            >
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                        {item.fuente}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 font-bold text-gray-800">{item.id_ventas || "—"}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{item.periodo || "—"}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{item.id_encuesta || "—"}</td>
                                <td className="px-4 py-3">
                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{item.estatus}</span>
                                </td>
                                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-800">{item.concesionaria || "—"}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{item.id_asesor}</td>
                                <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">{item.modelo}</td>
                                <td className="max-w-[150px] truncate px-4 py-3 text-gray-600">{item.chasis || "—"}</td>
                                <td className="px-4 py-3 text-right">
                                    <RatingBadge value={item.q1_satisfaccion_general} />
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                    {item.p3_recomendacion_distribuidor || "—"}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                    {item.p1_satisfaccion_producto || "—"}
                                </td>
                                <td className="max-w-[280px] truncate px-4 py-3 text-gray-500">{item.comentario || "—"}</td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onVerDetalle(item); }}
                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${item.seguimiento?.id_exp
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                            }`}
                                    >
                                        <Flag size={13} />
                                        {item.seguimiento?.id_exp ? "Ver seguimiento" : "Dar seguimiento"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {datosTabla.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="px-4 py-10 text-center text-gray-400">
                                    Sin no conformidades para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Vista Gráficas ──────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, className = "" }) {
    return (
        <div className={`min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
            <p className="text-lg font-bold" style={{ color: NAVY }}>{title}</p>
            {subtitle ? <p className="mb-4 text-sm text-gray-400">{subtitle}</p> : null}
            {children}
        </div>
    );
}

function VistaGraficas({ datos }) {
    const total = datos.length;
    const rating1 = datos.filter((d) => Math.round(d.q1_satisfaccion_general) === 1).length;
    const rating2 = datos.filter((d) => Math.round(d.q1_satisfaccion_general) === 2).length;
    const rating3 = datos.filter((d) => Math.round(d.q1_satisfaccion_general) === 3).length;

    const porMes = useMemo(() => {
        const map = new Map();
        datos.forEach((item) => {
            if (!item.anio || !item.mes) return;
            const key = `${item.anio}-${String(item.mes).padStart(2, "0")}`;
            if (!map.has(key)) {
                map.set(key, { key, name: `${MESES[item.mes - 1]?.slice(0, 3)} ${item.anio}`, total: 0, rating1: 0, rating2: 0, rating3: 0 });
            }
            const a = map.get(key);
            a.total += 1;
            const r = Math.round(item.q1_satisfaccion_general);
            if (r === 1) a.rating1 += 1;
            else if (r === 2) a.rating2 += 1;
            else if (r === 3) a.rating3 += 1;
        });
        return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    }, [datos]);

    const porConcesionaria = useMemo(
        () => agruparPor(datos, (d) => d.codigo_concesionaria || d.concesionaria || "Sin código", 10),
        [datos]
    );

    const porAsesor = useMemo(
        () => agruparPor(datos, (d) => d.id_asesor, 10),
        [datos]
    );

    const porFuente = useMemo(
        () => agruparPor(datos, (d) => d.fuente, 10),
        [datos]
    );

    const porModelo = useMemo(
        () => agruparPor(datos, (d) => d.modelo, 10),
        [datos]
    );

    const pieData = [
        { name: "1 ★  Crítico", value: rating1, color: RED },
        { name: "2 ★  Grave", value: rating2, color: ORANGE },
        { name: "3 ★  Leve", value: rating3, color: AMBER },
    ].filter((d) => d.value > 0);

    const CustomTooltipRating = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ ...TooltipStyle, padding: "8px 12px", background: "#fff" }}>
                <p className="font-bold text-gray-800">{payload[0].payload.name}</p>
                <p className="text-sm text-gray-600">{numero(payload[0].value)} no conformidades</p>
                <p className="text-xs text-gray-400">{((payload[0].value / total) * 100).toFixed(1)}% del total</p>
            </div>
        );
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <DashboardPanel title="Distribución por nivel de criticidad" icon={AlertCircle}>
                    <div className="flex flex-col items-center gap-3">
                        <ResponsiveContainer width="100%" height={190}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltipRating />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid w-full grid-cols-3 gap-2 text-center">
                            {[
                                { label: "1 ★ Crítico", value: rating1, color: RED },
                                { label: "2 ★ Grave", value: rating2, color: ORANGE },
                                { label: "3 ★ Leve", value: rating3, color: AMBER },
                            ].map((item) => (
                                <div key={item.label} className="rounded-lg p-2" style={{ backgroundColor: `${item.color}15` }}>
                                    <p className="text-xl font-black" style={{ color: item.color }}>{numero(item.value)}</p>
                                    <p className="text-[10px] font-semibold text-gray-500">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </DashboardPanel>

                <DashboardPanel title="No conformidades por fuente" icon={AlertTriangle}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={porFuente} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip contentStyle={TooltipStyle} />
                            <Bar dataKey="rating1" name="1 ★ Crítico" stackId="a" fill={RED} />
                            <Bar dataKey="rating2" name="2 ★ Grave" stackId="a" fill={ORANGE} />
                            <Bar dataKey="rating3" name="3 ★ Leve" stackId="a" fill={AMBER} radius={[5, 5, 0, 0]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </DashboardPanel>

                <DashboardPanel title="Resumen de alertas" icon={XCircle}>
                    <div className="flex flex-col justify-between h-full gap-4 py-2">
                        {[
                            {
                                nivel: "Crítico",
                                stars: "★☆☆",
                                desc: "Satisfacción 1 de 5",
                                value: rating1,
                                pct: total ? ((rating1 / total) * 100).toFixed(1) : "0.0",
                                bg: "#FEF2F2",
                                border: "#FECACA",
                                text: RED,
                            },
                            {
                                nivel: "Grave",
                                stars: "★★☆",
                                desc: "Satisfacción 2 de 5",
                                value: rating2,
                                pct: total ? ((rating2 / total) * 100).toFixed(1) : "0.0",
                                bg: "#FFFBEB",
                                border: "#FDE68A",
                                text: ORANGE,
                            },
                            {
                                nivel: "Leve",
                                stars: "★★★",
                                desc: "Satisfacción 3 de 5",
                                value: rating3,
                                pct: total ? ((rating3 / total) * 100).toFixed(1) : "0.0",
                                bg: "#FEFCE8",
                                border: "#FEF08A",
                                text: "#A16207",
                            },
                        ].map((item) => (
                            <div
                                key={item.nivel}
                                className="flex items-center justify-between rounded-xl border px-4 py-3"
                                style={{ backgroundColor: item.bg, borderColor: item.border }}
                            >
                                <div>
                                    <p className="text-sm font-black" style={{ color: item.text }}>
                                        {item.nivel} — {item.stars}
                                    </p>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black" style={{ color: item.text }}>{numero(item.value)}</p>
                                    <p className="text-xs font-semibold text-gray-400">{item.pct}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardPanel>
            </div>

            <ChartCard title="Tendencia mensual de no conformidades" subtitle="Acumulado por nivel de satisfacción">
                <ResponsiveContainer width="100%" height={310}>
                    <BarChart data={porMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip contentStyle={TooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="rating1" name="1 ★ Crítico" stackId="a" fill={RED} />
                        <Bar dataKey="rating2" name="2 ★ Grave" stackId="a" fill={ORANGE} />
                        <Bar dataKey="rating3" name="3 ★ Leve" stackId="a" fill={AMBER} radius={[5, 5, 0, 0]} />
                        <Line type="monotone" dataKey="total" name="Total" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3 }} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartCard title="No conformidades por concesionaria" subtitle="Top 10 con mayor incidencia">
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart
                            data={porConcesionaria.map((d) => ({ ...d, name: recortar(d.name, 18) }))}
                            margin={{ top: 10, right: 10, left: -10, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={90} tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip contentStyle={TooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="rating1" name="1 ★ Crítico" stackId="a" fill={RED} />
                            <Bar dataKey="rating2" name="2 ★ Grave" stackId="a" fill={ORANGE} />
                            <Bar dataKey="rating3" name="3 ★ Leve" stackId="a" fill={AMBER} radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="No conformidades por asesor" subtitle="Top 10 asesores con mayor incidencia">
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart
                            data={porAsesor.map((d) => ({ ...d, name: recortar(d.name, 18) }))}
                            margin={{ top: 10, right: 10, left: -10, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={90} tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip contentStyle={TooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="rating1" name="1 ★ Crítico" stackId="a" fill={RED} />
                            <Bar dataKey="rating2" name="2 ★ Grave" stackId="a" fill={ORANGE} />
                            <Bar dataKey="rating3" name="3 ★ Leve" stackId="a" fill={AMBER} radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="No conformidades por modelo" subtitle="Top 10 modelos con mayor número de quejas">
                <ResponsiveContainer width="100%" height={310}>
                    <BarChart
                        data={porModelo.map((d) => ({ ...d, name: recortar(d.name, 20) }))}
                        margin={{ top: 10, right: 10, left: -10, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={80} tick={{ fontSize: 10, fill: "#6b7280" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip contentStyle={TooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="rating1" name="1 ★ Crítico" stackId="a" fill={RED} />
                        <Bar dataKey="rating2" name="2 ★ Grave" stackId="a" fill={ORANGE} />
                        <Bar dataKey="rating3" name="3 ★ Leve" stackId="a" fill={AMBER} radius={[5, 5, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

// ─── Estilos de botón activo — igual al TopNav del CRM ───────────────────────
const BTN_ACTIVO_STYLE = {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.35)",
    color: "#ffffff",
};
const BTN_INACTIVO_CLASS =
    "border-gray-300 bg-white text-gray-600 hover:border-red-300 hover:text-red-600";
const BTN_INACTIVO_MES_CLASS =
    "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50";

// ─── Componente principal ────────────────────────────────────────────────────
export default function NoConformidad() {
    const [vista, setVista] = useState("graficas");
    const [anio, setAnio] = useState(ANIO_ACTUAL);
    const [mes, setMes] = useState("Todos");
    const [fuenteActiva, setFuenteActiva] = useState("Todas");
    const [concesionariaActiva, setConcesionariaActiva] = useState("Todas");
    const [busqueda, setBusqueda] = useState("");
    const [itemDetalle, setItemDetalle] = useState(null);

    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const aniosDisponibles = useMemo(() => {
        const set = new Set(datos.map((d) => d.anio).filter(Boolean));
        return [...set].sort((a, b) => b - a);
    }, [datos]);

    // ← mesesDisponibles ya no se usa para bloquear, solo para info
    const mesesDisponibles = useMemo(() => {
        const filtrados = anio === "Todos" ? datos : datos.filter((d) => String(d.anio) === String(anio));
        const set = new Set(filtrados.map((d) => d.mes).filter(Boolean));
        return [...set].sort((a, b) => a - b);
    }, [datos, anio]);

    useEffect(() => {
        const controller = new AbortController();

        async function cargarTodo() {
            try {
                setLoading(true);
                setError(null);

                const filtrosBase = { anio, mes, limit: 10000, ordering: "-periodo" };

                const resultados = await Promise.allSettled([
                    (async () => {
                        const data = await obtenerEncuestasJDPower(filtrosBase, { signal: controller.signal });
                        const lista = Array.isArray(data) ? data : data.results ?? [];
                        return lista.map((item) => mapearEncuestaComun(item, "JD Power Ventas"));
                    })(),
                    (async () => {
                        const data = await apiServicio.list();
                        const lista = Array.isArray(data) ? data : data.results ?? [];

                        // 🔍 DEBUG: ver la forma real del primer registro crudo
                        console.log("🔬 Primer item crudo de Enc. Servicio:", lista[0]);
                        console.log("🔬 Keys disponibles:", lista[0] ? Object.keys(lista[0]) : "sin datos");

                        return lista.map((item) => mapearEncuestaComun(item, "Enc. Servicio"));
                    })(),
                    (async () => {
                        const data = await apiEncuestas.list();
                        const lista = Array.isArray(data) ? data : data.results ?? [];
                        return lista.map((item) => mapearEncuestaComun(item, "Enc. Entrega"));
                    })(),
                ]);

                // Visibilidad: si alguna fuente falla, que se note en consola en vez de
                // desaparecer en silencio.
                const NOMBRES_FUENTE = ["JD Power Ventas", "Enc. Servicio", "Enc. Entrega"];
                resultados.forEach((r, i) => {
                    if (r.status === "rejected") {
                        console.error(`❌ Falló "${NOMBRES_FUENTE[i]}":`, r.reason);
                    } else {
                        console.log(`✅ "${NOMBRES_FUENTE[i]}" trajo ${r.value.length} registros`);
                    }
                });

                const todosSinFiltrarNC = resultados
                    .filter((r) => r.status === "fulfilled")
                    .flatMap((r) => r.value);

                // 🔍 DEBUG: distribución real de estrellas por fuente, ANTES de cualquier filtro
                const distribucion = {};
                todosSinFiltrarNC.forEach((d) => {
                    const key = d.fuente;
                    if (!distribucion[key]) distribucion[key] = { total: 0, porEstrella: {} };
                    distribucion[key].total += 1;
                    const r = Math.round(d.q1_satisfaccion_general);
                    distribucion[key].porEstrella[r] = (distribucion[key].porEstrella[r] || 0) + 1;
                });
                console.log("📊 Distribución de estrellas por fuente:", JSON.stringify(distribucion, null, 2));

                let todos = todosSinFiltrarNC.filter(esNoConformidad);
                console.log(`🔎 Después de filtro esNoConformidad (≤3★): ${todos.length} de ${todosSinFiltrarNC.length}`);

                if (anio !== "Todos") {
                    const antes = todos.length;
                    todos = todos.filter((d) => String(d.anio) === String(anio));
                    console.log(`📅 Filtro por año (${anio}): ${todos.length} de ${antes}`);
                }
                if (mes !== "Todos") {
                    const antes = todos.length;
                    todos = todos.filter((d) => String(d.mes) === String(mes));
                    console.log(`📅 Filtro por mes (${mes}): ${todos.length} de ${antes}`);
                }

                console.log(`✅ TOTAL final que se muestra en pantalla: ${todos.length}`);
                setDatos(todos);

                setDatos(todos);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        cargarTodo();
        return () => controller.abort();
    }, [anio, mes, refreshKey]);

    const datosFiltrados = useMemo(() => {
        let d = [...datos];

        if (fuenteActiva !== "Todas") {
            d = d.filter((item) => item.fuente === fuenteActiva);
        }

        if (concesionariaActiva !== "Todas") {
            d = d.filter((item) => String(item.codigo_concesionaria) === String(concesionariaActiva));
        }

        const texto = normalizarTexto(busqueda);
        if (texto) {
            d = d.filter((item) => {
                // DESPUÉS
                const acumulado = [
                    item.id_ventas,
                    item.id_encuesta,
                    item.chasis,
                    item.modelo,
                    item.concesionaria,
                    item.codigo_concesionaria,
                    item.id_asesor,
                    item.comentario,
                    item.nombre_OS_cliente,
                    item.asesor_atendio,
                    item.agencia,
                ].map(normalizarTexto).join(" ");
                return acumulado.includes(texto);
            });
        }

        return d;
    }, [datos, fuenteActiva, concesionariaActiva, busqueda]);

    const resumen = useMemo(() => {
        const total = datosFiltrados.length;
        const critico = datosFiltrados.filter((d) => Math.round(d.q1_satisfaccion_general) === 1).length;
        const grave = datosFiltrados.filter((d) => Math.round(d.q1_satisfaccion_general) === 2).length;
        const leve = datosFiltrados.filter((d) => Math.round(d.q1_satisfaccion_general) === 3).length;
        const conComentario = datosFiltrados.filter((d) => d.comentario).length;
        return { total, critico, grave, leve, conComentario };
    }, [datosFiltrados]);

    function refrescarDatos() {
        setRefreshKey((k) => k + 1);
    }

    // Vincula el caso creado/editado al registro de la encuesta en memoria
    function manejarCasoGuardado(itemOrigen, casoGuardado) {
        setDatos((prev) =>
            prev.map((d) =>
                d.id_ventas === itemOrigen.id_ventas && d.fuente === itemOrigen.fuente
                    ? { ...d, seguimiento: { id_exp: casoGuardado.id_exp } }
                    : d
            )
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
                    Cargando no conformidades…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="max-w-md rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-bold text-red-500">Error al cargar no conformidades</p>
                    <p className="mt-1 text-xs text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-1">
            {/* Modal de caso (crear/editar) */}
            <ModalCasoNoConformidad item={itemDetalle} onClose={() => setItemDetalle(null)} onGuardado={manejarCasoGuardado} />

            {/* Encabezado */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-800">No Conformidad</h2>
                    <p className="text-xs text-gray-500">
                        Encuestas con calificación ≤ 3 estrellas en todas las fuentes — generadas automáticamente.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={refrescarDatos}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>
                    {["tabla", "graficas"].map((item) => (
                        <button
                            key={item}
                            onClick={() => setVista(item)}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${vista === item
                                ? "border-transparent text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                            style={vista === item ? { backgroundColor: NAVY } : {}}
                        >
                            {item === "tabla" ? (
                                <><TableProperties size={15} /> Tabla</>
                            ) : (
                                <><BarChart2 size={15} /> Gráficas</>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtros */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                {/* ── Años ── fondo NAVY como el TopNav */}
                <div
                    className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3"
                    style={{ backgroundColor: NAVY }}
                >
                    <SlidersHorizontal size={15} className="text-white/50" />
                    {aniosDisponibles.map((item) => {
                        const activo = anio === String(item);
                        return (
                            <button
                                key={item}
                                onClick={() => { setAnio(activo ? "Todos" : String(item)); setMes("Todos"); }}
                                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
                                style={
                                    activo
                                        ? BTN_ACTIVO_STYLE
                                        : { borderColor: "rgba(255,255,255,0.20)", backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }
                                }
                            >
                                {item}
                            </button>
                        );
                    })}
                    {/* Botón "Todos" */}
                    {(() => {
                        const activo = anio === "Todos";
                        return (
                            <button
                                onClick={() => { setAnio("Todos"); setMes("Todos"); }}
                                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
                                style={
                                    activo
                                        ? BTN_ACTIVO_STYLE
                                        : { borderColor: "rgba(255,255,255,0.20)", backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }
                                }
                            >
                                Todos
                            </button>
                        );
                    })()}
                </div>

                {/* ── Meses — siempre navegables, fondo NAVY más suave ── */}
                <div
                    className="flex flex-wrap items-center gap-1 border-b border-white/10 px-4 py-3"
                    style={{ backgroundColor: "#111d50" }}
                >
                    {MESES_CORTOS.map((item, index) => {
                        const mesNumero = index + 1;
                        const activo = mes === String(mesNumero);
                        // tenue si el mes no tiene datos (solo visual, no bloquea)
                        const tieneDatos = mesesDisponibles.includes(mesNumero);
                        return (
                            <button
                                key={item}
                                onClick={() => setMes(activo ? "Todos" : String(mesNumero))}
                                className="rounded-full border px-3 py-1.5 text-sm font-semibold transition"
                                style={
                                    activo
                                        ? BTN_ACTIVO_STYLE
                                        : tieneDatos
                                            ? { borderColor: "rgba(255,255,255,0.20)", backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }
                                            : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "transparent", color: "rgba(255,255,255,0.30)" }
                                }
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>

                {/* Fuente + Concesionaria + búsqueda */}
                <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                    <SelectField label="Fuente" value={fuenteActiva} onChange={setFuenteActiva}>
                        <option value="Todas">Todas</option>
                        <option value="JD Power Ventas">JD Power Ventas</option>
                        <option value="JD Power Servicio">JD Power Servicio</option>
                        <option value="Enc. Entrega">Enc. Entrega</option>
                        <option value="Enc. Servicio">Enc. Servicio</option>
                    </SelectField>

                    <SelectField label="Concesionaria" value={concesionariaActiva} onChange={setConcesionariaActiva}>
                        <option value="Todas">Todas</option>
                        {Object.entries(CONCESIONARIAS).map(([codigo, nombre]) => (
                            <option key={codigo} value={codigo}>{nombre}</option>
                        ))}
                    </SelectField>

                    <div className="min-w-[260px] flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Buscar</label>
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="ID, encuesta, chasis, modelo, comentario..."
                                className="h-[38px] w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-red-200"
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => { setAnio(ANIO_ACTUAL); setMes("Todos"); setFuenteActiva("Todas"); setConcesionariaActiva("Todas"); setBusqueda(""); }}
                        className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <StatCard label="Total NC" value={numero(resumen.total)} sub="no conformidades" color={RED} />
                <StatCard label="Crítico (1 ★)" value={numero(resumen.critico)} sub="satisfacción 1/5" color={RED} />
                <StatCard label="Grave (2 ★)" value={numero(resumen.grave)} sub="satisfacción 2/5" color={ORANGE} />
                <StatCard label="Leve (3 ★)" value={numero(resumen.leve)} sub="satisfacción 3/5" color="#A16207" />
                <StatCard label="Con comentario" value={numero(resumen.conComentario)} sub="texto capturado" color={NAVY} />
            </div>

            {/* Contenido */}
            {vista === "tabla" ? (
                <VistaTabla datos={datosFiltrados} onVerDetalle={setItemDetalle} />
            ) : (
                <VistaGraficas datos={datosFiltrados} />
            )}
        </div>
    );
}   