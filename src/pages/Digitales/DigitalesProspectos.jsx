//volkswagen
//src/pages/Digitales/DigitalesProspectos.jsx
import { useMemo, useState, useRef, useEffect, useDeferredValue, useCallback } from "react";
import { Plus, Search, X, Save, User, Van, CarFront, CalendarDays, ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MessageSquareShare, Building2, FileText, FileDown, Car, Trash2, Loader2, CalendarPlus, CalendarCheck, Phone, LayoutList, UserStar, ClipboardCheck, BrainCircuit, CalendarRange, Table2, BarChart3, Clock3, AlertCircle, TrendingUp, Activity, Target, Paperclip, UploadCloud, Users, Bot, UserCheck, HandCoins, Gauge, LayoutTemplate } from "lucide-react";
import CONCESIONARIO from "/concesionario.png";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import PHONE from "/phone.svg";
import { api } from "../../lib/apiPruebas";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { apiCitas } from "../../lib/apiCitas";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";
import MotivoDescalificacionPicker from "./MotivoDescalificacionPicker";
import NuevoProspectoModal from "./NuevoProspectoModal";
import ResultadosIA from "./ResultadosIA";
import DashboardEjecutivoBDC from "./DashboardEjecutivoBDC";
import { ETIQUETAS_ESTADO } from "./estadosProspecto";

import {
    canonicalAsesorDigital,
} from "../../config/asesoresGestionComercial";

import {
    useAsesoresGestionComercial,
} from "../../hooks/useAsesoresGestionComercial";

import {
    LINEAS_WHATSAPP,
    obtenerContextoLinea,
    obtenerNombreAsesorSesion,
} from "../../config/lineasWhatsApp";

const PAGE_SIZE = 200;
const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;
const lineaMeta = {
    Nuevos: { Icon: Car, label: "Nuevos" },
    Usados: { Icon: CarFront, label: "Usados" },
    Comerciales: { Icon: Van, label: "Comerciales" },
};
const origenMeta = {
    "VW-Concesionarios": { Icon: ImgIcon(CONCESIONARIO, "VW-Concesionarios"), label: "VW-Concesionarios" },
    WhatsApp: { Icon: ImgIcon(WAP, "WhatsApp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" },
    "Llamada Entrante": { Icon: ImgIcon(PHONE, "Llamada Entrante"), label: "Llamada Entrante" },
};
const ESTADOS_PROSPECTO = [
    "Contactado",
    "Calificado",
    "Pendiente de Cotización",
    "Requiere Asesor",
    "Financiamiento",
    "Sin Respuesta",
    "Descalificado",
];
const VEHICULOS = ["Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter"];
const ANIOS_VEHICULO = Array.from({ length: 2030 - 2018 + 1 }, (_, i) => 2030 - i);
const BURO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "bueno", label: "Bueno" },
    { value: "regular", label: "Regular" },
    { value: "iniciando", label: "Iniciando" },
    { value: "desconocido", label: "Desconocido" },
];
const SOLICITUD_CREDITO = [
    { value: "", label: "— Selecciona —" },
    { value: "autorizado", label: "Autorizado" },
    { value: "rechazado", label: "Rechazado" },
    { value: "condicionado", label: "Condicionado" },
];
const FORMA_PAGO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "contado", label: "Contado" },
    { value: "credito", label: "Crédito" },
    { value: "arrendamiento", label: "Arrendamiento" },
    { value: "desconocido", label: "Desconocido" },
];
const TIPO_CLIENTE_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "persona_fisica", label: "Persona física" },
    { value: "persona_moral", label: "Persona moral" },
    { value: "desconocido", label: "Desconocido" },
];
const PLAZO_COMPRA_OPTIONS = ["", "Inmediato", "Esta semana", "Este mes", "1 a 3 meses", "3 a 6 meses", "Más de 6 meses", "Sin definir"];
const INITIAL_FILTERS = {
    q: "",
    estado: "Todos",
    agencia: "Todos",
    linea: "Todos",
    buro: "Todos",
    formaPago: "Todos",
    tipoCliente: "Todos",
    fechaRegistroDesde: "",
    fechaRegistroHasta: "",
};

const DEALERS = ["VW Cordoba", "VW Cordoba Usados", "VW Orizaba", "VW Orizaba Usados", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Automotriz R&R"];
// ─── Helpers ────────────────────────────────────────────────────────────────
function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits)
        return "";
    if (digits.startsWith("521") && digits.length === 13)
        return `52${digits.slice(3)}`;
    if (digits.length === 10)
        return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52"))
        return digits;
    return digits;
}
function formatTelefonoMx(tel) {
    const digits = normalizaTelefonoMx(tel);
    if (!/^52\d{10}$/.test(digits))
        return tel || "Sin número";
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}
function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
function normalizeDealerGrupo(value) {
    const raw = String(value || "").trim();
    const text = normalizeText(raw);
    if (!text)
        return "";
    if (text.includes("cordoba"))
        return "VW Cordoba";
    if (text.includes("orizaba"))
        return "VW Orizaba";
    if (text.includes("poza rica"))
        return "VW Poza Rica";
    if (text.includes("tuxtepec"))
        return "VW Tuxtepec";
    if (text.includes("tuxpan"))
        return "VW Tuxpan";
    return raw;
}
function dealerMatchesFilter(agencia, filtro) {
    if (!filtro || filtro === "Todos")
        return true;
    return normalizeDealerGrupo(agencia) === normalizeDealerGrupo(filtro);
}
function tryParseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
function extraerNumerosWhatsApp(value) {
    const partes = Array.isArray(value)
        ? value
        : String(value || "").split(/[|,;\n]+/);
    return [
        ...new Set(partes
            .map(normalizaTelefonoMx)
            .filter((numero) => /^52\d{10}$/.test(numero))),
    ];
}
function getNumerosUsuarioSesion(user) {
    const numerosUsuario = extraerNumerosWhatsApp(user?.telefono ||
        user?.numero_asesor ||
        user?.whatsapp_number ||
        user?.phone ||
        "");
    if (numerosUsuario.length) {
        return numerosUsuario;
    }
    for (const key of [
        "auth",
        "crm.user",
        "user",
    ]) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw)
                continue;
            const parsed = tryParseJson(raw);
            if (!parsed ||
                typeof parsed !== "object") {
                continue;
            }
            const userObj = parsed?.user &&
                typeof parsed.user === "object"
                ? parsed.user
                : parsed;
            const numeros = extraerNumerosWhatsApp(userObj?.telefono ||
                userObj?.numero_asesor ||
                userObj?.whatsapp_number ||
                userObj?.phone ||
                "");
            if (numeros.length) {
                return numeros;
            }
        }
        catch {
            // Continúa con la siguiente fuente.
        }
    }
    return [];
}
function getUsuarioCrm(user) {
    return normalizeText(user?.usuario || user?.username || user?.user || user?.nombre_usuario || "");
}

function getAsesorDigitalPorNumero(numero, user = null) {
    return obtenerNombreAsesorSesion(numero, user) || "";
}

function getEtiquetaDigitalPorNumero(numero) {
    const configuracion = obtenerContextoLinea(numero);

    return (
        configuracion?.etiqueta ||
        configuracion?.asesor_digital ||
        ""
    );
}

function getContextoDigitalPorNumero(numero, user = null) {
    const configuracion = obtenerContextoLinea(numero);

    if (!configuracion) {
        return null;
    }

    return {
        ...configuracion,
        asesor_digital:
            obtenerNombreAsesorSesion(numero, user) || "",
    };
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull)
        return "";
    const s = String(isoOrNull).trim();
    if (!s)
        return "";
    return s;
}
function toDTLocalInput(isoOrNull) {
    if (!isoOrNull)
        return "";
    const s = String(isoOrNull).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s))
        return s.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s))
        return `${s}T00:00`;
    if (s.includes("T"))
        return s.slice(0, 16);
    return "";
}
function onlyDate(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }
    const raw = String(value).trim();
    if (!raw) {
        return "";
    }
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    const mxMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (mxMatch) {
        const day = mxMatch[1].padStart(2, "0");
        const month = mxMatch[2].padStart(2, "0");
        const year = mxMatch[3];
        return `${year}-${month}-${day}`;
    }
    if (/^\d+$/.test(raw)) {
        const numericValue = Number(raw);
        const timestamp = raw.length <= 10
            ? numericValue * 1000
            : numericValue;
        const date = new Date(timestamp);
        if (!Number.isNaN(date.getTime())) {
            return formatDateYMDLocal(date);
        }
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
        console.warn("Fecha no reconocida:", value);
        return "";
    }
    return formatDateYMDLocal(date);
}
function getFirstValidDate(...values) {
    for (const value of values) {
        if (value === null ||
            value === undefined ||
            String(value).trim() === "") {
            continue;
        }
        const normalized = onlyDate(value);
        if (normalized) {
            return {
                raw: value,
                ymd: normalized,
            };
        }
    }
    return {
        raw: "",
        ymd: "",
    };
}
function splitNombre(full) {
    const parts = String(full || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (!parts.length)
        return { nombre: "", apellidos: "" };
    if (parts.length === 1)
        return { nombre: parts[0], apellidos: "" };
    return { nombre: parts.slice(0, 1).join(" "), apellidos: parts.slice(1).join(" ") };
}
function joinNombre(nombre, apellidos) {
    return `${String(nombre || "").trim()} ${String(apellidos || "").trim()}`.trim();
}
function tieneNombreReal(full) {
    const texto = normalizeText(full);
    return !!texto && texto !== "sin nombre";
}
function getNombreCompletoDraft(draft) {
    if (!draft)
        return "";
    const nombreCompleto = String(draft.nombre_cliente || "").trim();
    if (nombreCompleto)
        return nombreCompleto;
    return joinNombre(draft.cliente_nombre, draft.cliente_apellidos);
}
function normalizeDateForFilter(value) {
    return onlyDate(value);
}
function isDateInRange(value, desde, hasta) {
    if (!desde && !hasta)
        return true;
    const dateValue = normalizeDateForFilter(value);
    if (!dateValue)
        return false;
    if (desde && dateValue < desde)
        return false;
    if (hasta && dateValue > hasta)
        return false;
    return true;
}
function getSortValue(row, key) {
    if (["fecha_reclamacion", "fecha_contacto"].includes(key))
        return onlyDate(row?.[key] || "");
    if (["ultimo_contacto_at", "primer_contacto_at", "creado", "resumen_actualizado_at"].includes(key))
        return toDTLocal(row?.[key] || "");
    return String(row?.[key] ?? "").toLowerCase();
}
function normalizeProspecto(p) {
    const nombreCompleto = p.nombre ||
        p.nombre_out ||
        p.cliente?.nombre ||
        "";
    const { nombre, apellidos } = splitNombre(nombreCompleto);
    const fechaRegistro = getFirstValidDate(p.creado, p.created_at, p.fecha_creacion, p.creado_en, p.fecha_reclamacion, p.primer_mensaje_cliente, p.primer_contacto_at, p.ultimo_contacto_asesor, p.ultimo_contacto_at, p.resumen_actualizado_at);
    const fechaCreacionRaw = fechaRegistro.raw;
    const fechaCreacion = fechaRegistro.ymd;
    return {
        id_exp: p.id,
        cliente_id: p.cliente_id,
        agencia: p.agencia || "",
        cliente_nombre: nombre,
        cliente_apellidos: apellidos,
        telefono: String(p.telefono ||
            p.telefono_out ||
            p.cliente?.telefono ||
            ""),
        correo: p.correo ||
            p.correo_out ||
            p.cliente?.correo ||
            "",
        linea: p.business || "",
        origen: p.canal_contacto || "",
        pauta: p.pauta || "",
        estado: p.estado || "",
        motivo_descalificacion: p.motivo_descalificacion || "",
        comentarios: p.comentarios || "",
        resumen: p.resumen || "",
        resumen_actualizado_at: toDTLocalInput(p.resumen_actualizado_at),
        resumen_fuente: p.resumen_fuente || "",
        cliente_interes: p.auto_interes || "",
        asesor_digital: p.asesor_digital || "",
        usuario_crm_asignado: p.usuario_crm_asignado || "",
        asignado_automaticamente_at: p.asignado_automaticamente_at || null,
        asesor_solicita: p.asesor_ventas || "",
        primer_contacto_at: p.primer_contacto_at || null,
        ultimo_contacto_at: p.ultimo_contacto_asesor || p.ultimo_contacto_at || null,
        // Conserva la fecha original.
        creado: fechaCreacionRaw,
        // Fecha normalizada para los filtros.
        fecha_reclamacion: fechaCreacion,
        fecha_atencion: onlyDate(p.primer_mensaje_cliente ||
            p.primer_contacto_at) || fechaCreacion,
        fecha_contacto: onlyDate(p.ultimo_contacto_asesor ||
            p.ultimo_contacto_at),
        requiere_asesor: Boolean(p.requiere_asesor),
        motivo_requiere_asesor: p.motivo_requiere_asesor || "",
        cotizacion_pendiente: Boolean(p.cotizacion_pendiente),
        cotizacion_solicitada_at: toDTLocalInput(p.cotizacion_solicitada_at),
        enganche_monto: p.enganche_monto || "",
        presupuesto_mensual: p.presupuesto_mensual || "",
        buro_estado: p.buro_estado || "",
        forma_pago: p.forma_pago || "",
        tipo_cliente: p.tipo_cliente || "",
        uso_vehiculo: p.uso_vehiculo || "",
        plazo_compra: p.plazo_compra || "",
        comprobacion_ingresos: p.comprobacion_ingresos || "",
        ia_pausada: Boolean(p.ia_pausada),
        ia_pausada_motivo: p.ia_pausada_motivo || "",
        ultima_cita_agendada: toDTLocalInput(p.ultima_cita_agendada),
        asistencia: Boolean(p.asistencia),
        id_cotizacion: p.id_cotizacion || "",
        folio_solicitud_credito: p.folio_solicitud_credito || "",
        solicitud_credito_estado: p.solicitud_credito_estado || "",
        vin_facturado: p.vin_facturado || "",
        facturado_at: p.facturado_at || null,
        vin_estatus_entrega: p.vin_estatus_entrega || "",
    };
}
function toNumber(value) {
    if (value === null || value === undefined || value === "")
        return 0;
    const num = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) && num > 0 ? num : 0;
}
function toNullableNumber(value) {
    const num = toNumber(value);
    return num > 0 ? Math.round(num) : null;
}
function formatMoneyMXN(value) {
    const num = toNumber(value);
    if (!num)
        return "—";
    return num.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    });
}
function labelFromKey(value) {
    const raw = String(value || "").trim();
    if (!raw)
        return "";
    return raw
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
function valueOrDash(value) {
    const label = labelFromKey(value);
    return label || "—";
}
function hasPerfilComercial(row) {
    return Boolean(toNumber(row.enganche_monto) || toNumber(row.presupuesto_mensual) || row.buro_estado || row.forma_pago || row.tipo_cliente || row.uso_vehiculo || row.plazo_compra || row.comprobacion_ingresos);
}
function getMontoBucket(value, type = "enganche") {
    const amount = toNumber(value);
    if (!amount)
        return "Sin dato";
    if (type === "mensual") {
        if (amount <= 5000)
            return "$1 - $5k";
        if (amount <= 8000)
            return "$5k - $8k";
        if (amount <= 12000)
            return "$8k - $12k";
        if (amount <= 18000)
            return "$12k - $18k";
        return ">$18k";
    }
    if (amount <= 50000)
        return "$1 - $50k";
    if (amount <= 100000)
        return "$50k - $100k";
    if (amount <= 200000)
        return "$100k - $200k";
    return ">$200k";
}
function countBy(rows, getter, { limit = null, includeEmpty = false, emptyLabel = "Sin dato" } = {}) {
    const map = new Map();
    for (const row of rows) {
        const raw = typeof getter === "function" ? getter(row) : row?.[getter];
        const key = String(raw || "").trim();
        if (!key && !includeEmpty)
            continue;
        const label = key ? valueOrDash(key) : emptyLabel;
        map.set(label, (map.get(label) || 0) + 1);
    }
    const result = Array.from(map.entries()).sort(([, a], [, b]) => b - a);
    return limit ? result.slice(0, limit) : result;
}
function avgPositive(rows, field) {
    const values = rows.map((row) => toNumber(row[field])).filter(Boolean);
    if (!values.length)
        return 0;
    return Math.round(values.reduce((acc, item) => acc + item, 0) / values.length);
}
function percent(value, total) {
    if (!total)
        return 0;
    return Math.round((value / total) * 100);
}
function formatDateYMDLocal(date) {
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function addDays(date, days) {
    const c = new Date(date);
    c.setDate(c.getDate() + days);
    return c;
}
function getStartOfWeek(date) {
    const c = new Date(date), day = c.getDay(), diff = day === 0 ? -6 : 1 - day;
    c.setDate(c.getDate() + diff);
    return c;
}
function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function getEndOfWeek(date) {
    const s = getStartOfWeek(date);
    s.setDate(s.getDate() + 6);
    return s;
}
// ─── Lead Score financiero realista ─────────────────────────────────────────
const PRECIO_REFERENCIA_VW = {
    virtus: 360000,
    polo: 350000,
    jetta: 480000,
    "jetta gli": 650000,
    "golf gti": 800000,
    taos: 560000,
    nivus: 460000,
    taigun: 430000,
    tiguan: 720000,
    teramont: 1150000,
    crossport: 980000,
    saveiro: 330000,
    amarok: 780000,
    transporter: 720000,
    caddy: 590000,
    crafter: 980000,
    tera: 390000,
    seminuevos: 350000,
};
const ENGANCHE_MINIMO_PCT = 0.2;
// Aproximación conservadora para estimar mensualidad mínima.
// No es cotización oficial, solo sirve para scoring interno.
const FACTOR_MENSUALIDAD_APROX = 0.024;
function getPrecioReferenciaVehiculo(row) {
    const interes = normalizeText(row?.cliente_interes || "");
    if (!interes)
        return 0;
    const match = Object.entries(PRECIO_REFERENCIA_VW).find(([modelo]) => interes.includes(normalizeText(modelo)));
    return match ? match[1] : 450000;
}
function getEngancheMinimoEstimado(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    if (!precio)
        return 0;
    return Math.round(precio * ENGANCHE_MINIMO_PCT);
}
function getMensualidadMinimaEstimada(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    const enganche = toNumber(row.enganche_monto);
    if (!precio)
        return 0;
    const montoFinanciar = Math.max(precio - enganche, 0);
    return Math.round(montoFinanciar * FACTOR_MENSUALIDAD_APROX);
}
function getPerfilFinancieroDiagnostico(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    const enganche = toNumber(row.enganche_monto);
    const engancheMinimo = getEngancheMinimoEstimado(row);
    const mensualidad = toNumber(row.presupuesto_mensual);
    const mensualidadMinima = getMensualidadMinimaEstimada(row);
    const ratioEnganche = engancheMinimo > 0 ? enganche / engancheMinimo : 0;
    const faltanteEnganche = Math.max(engancheMinimo - enganche, 0);
    return {
        precio,
        enganche,
        engancheMinimo,
        mensualidad,
        mensualidadMinima,
        ratioEnganche,
        faltanteEnganche,
        engancheSuficiente: engancheMinimo > 0 && enganche >= engancheMinimo,
    };
}
function calcLeadScore(row) {
    let score = 8;
    const estado = normalizeText(row.estado);
    const buro = normalizeText(row.buro_estado);
    const formaPago = normalizeText(row.forma_pago);
    const plazo = normalizeText(row.plazo_compra);
    const perfil = getPerfilFinancieroDiagnostico(row);
    const esCredito = formaPago === "credito" || formaPago === "arrendamiento" || !formaPago || formaPago === "desconocido";
    // Interés real
    if (row.cliente_interes)
        score += 8;
    else
        score -= 5;
    // Estado comercial
    if (estado === "calificado")
        score += 12;
    else if (estado === "pendiente de cotizacion" || estado === "pendiente de cotización")
        score += 9;
    else if (estado === "financiamiento")
        score += 8;
    else if (estado === "contactado")
        score += 4;
    else if (estado === "sin respuesta")
        score -= 14;
    else if (estado === "recopilación de documentos" || estado === "recopilacion de documentos")
        score += 15;
    else if (estado === "solicitud de crédito" || estado === "solicitud de credito")
        score += 20;
    else if (estado === "seguimiento")
        score += 18;
    else if (estado === "facturado")
        score += 30;
    else if (estado === "entregado")
        score += 35;
    else if (estado === "descalificado")
        score -= 40;
    // Enganche contra mínimo estimado del 20%
    if (esCredito) {
        if (!perfil.enganche) {
            score -= 10;
        }
        else if (perfil.ratioEnganche >= 1) {
            score += 24;
        }
        else if (perfil.ratioEnganche >= 0.75) {
            score += 15;
        }
        else if (perfil.ratioEnganche >= 0.5) {
            score += 7;
        }
        else if (perfil.ratioEnganche >= 0.25) {
            score -= 4;
        }
        else {
            score -= 18;
        }
    }
    // Mensualidad contra estimado aproximado
    if (esCredito) {
        if (!perfil.mensualidad) {
            score -= 6;
        }
        else if (perfil.mensualidadMinima && perfil.mensualidad >= perfil.mensualidadMinima) {
            score += 14;
        }
        else if (perfil.mensualidadMinima && perfil.mensualidad >= perfil.mensualidadMinima * 0.75) {
            score += 6;
        }
        else {
            score -= 8;
        }
    }
    // Buró
    if (buro === "bueno")
        score += 14;
    else if (buro === "regular")
        score += 5;
    else if (buro === "iniciando")
        score -= 10;
    else if (buro === "desconocido" || !buro)
        score -= 6;
    // Forma de pago
    if (formaPago === "contado")
        score += 18;
    else if (formaPago === "credito")
        score += 5;
    else if (formaPago === "arrendamiento")
        score += 6;
    else
        score -= 3;
    // Perfil de compra
    if (plazo === "inmediato")
        score += 10;
    else if (plazo === "esta semana")
        score += 8;
    else if (plazo === "este mes")
        score += 5;
    else if (plazo === "1 a 3 meses")
        score += 2;
    else if (plazo === "mas de 6 meses" || plazo === "más de 6 meses")
        score -= 6;
    if (row.comprobacion_ingresos)
        score += 6;
    if (row.tipo_cliente)
        score += 2;
    if (row.asesor_solicita)
        score += 6;
    else
        score -= 4;
    // Actividad reciente, pero ya no debe inflar demasiado
    if (row.ultimo_contacto_at) {
        const h = (Date.now() - new Date(row.ultimo_contacto_at).getTime()) / 36e5;
        if (h < 2)
            score += 6;
        else if (h < 24)
            score += 4;
        else if (h < 72)
            score += 2;
        else if (h > 168)
            score -= 6;
    }
    if (row.cotizacion_pendiente)
        score += 5;
    if (row.requiere_asesor)
        score += 4;
    if (row.ia_pausada)
        score -= 5;
    // Topes de realidad financiera
    if (esCredito && perfil.engancheMinimo && perfil.enganche && perfil.enganche < perfil.engancheMinimo * 0.5) {
        score = Math.min(score, 45);
    }
    if (esCredito && (!buro || buro === "desconocido")) {
        score = Math.min(score, 60);
    }
    if (buro === "iniciando") {
        score = Math.min(score, 50);
    }
    if (!row.asesor_solicita) {
        score = Math.min(score, 70);
    }
    return Math.min(100, Math.max(0, Math.round(score)));
}
function getScoreLabel(score) {
    if (score >= 80)
        return { label: "Muy alto", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 60)
        return { label: "Alto", cls: "text-amber-700 bg-amber-50 border-amber-200" };
    if (score >= 35)
        return { label: "Medio", cls: "text-sky-700 bg-sky-50 border-sky-200" };
    return { label: "Bajo", cls: "text-slate-500 bg-slate-50 border-slate-200" };
}
function getPrioridad(row) {
    const e = String(row.estado || "").toLowerCase();
    const h = row.ultimo_contacto_at ? (Date.now() - new Date(row.ultimo_contacto_at).getTime()) / 36e5 : 999;
    if (e === "sin respuesta" && h > 24)
        return { label: "Urgente", cls: "bg-red-100 text-red-800 border-red-300" };
    if (row.cotizacion_pendiente || row.requiere_asesor)
        return { label: "Alta", cls: "bg-orange-100 text-orange-800 border-orange-300" };
    if (e === "calificado")
        return { label: "Alta", cls: "bg-orange-100 text-orange-800 border-orange-300" };
    if (h < 6)
        return { label: "Media", cls: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Normal", cls: "bg-slate-100 text-slate-600 border-slate-300" };
}
function getListItems(data) {
    if (Array.isArray(data))
        return data;
    if (Array.isArray(data?.results))
        return data.results;
    return [];
}
async function listarProspectosDigitalesCompletos(params = {}) {
    const primeraPagina = await api.digitalesListProspectos(params);
    if (Array.isArray(primeraPagina)) return primeraPagina;

    const registros = [...getListItems(primeraPagina)];
    const visitadas = new Set();
    let next = primeraPagina?.next ? String(primeraPagina.next).replace(/^https?:\/\/[^/]+/, "") : "";

    while (next && !visitadas.has(next)) {
        visitadas.add(next);
        const pagina = await api.get(next);
        registros.push(...getListItems(pagina));
        next = pagina?.next ? String(pagina.next).replace(/^https?:\/\/[^/]+/, "") : "";
    }
    return registros;
}

async function propagarCambiosACitasProspecto({ telefono, cambios }) {
    const payload = {};
    for (const [k, v] of Object.entries(cambios || {})) {
        const limpio = String(v ?? "").trim();
        if (limpio) payload[k] = limpio;
    }
    if (!Object.keys(payload).length) return;
    const telDigits = String(telefono || "").replace(/\D/g, "").slice(-10);
    if (!telDigits) return;
    try {
        const citas = await apiCitas.list();
        const pendientes = (Array.isArray(citas) ? citas : []).filter((c) => {
            if (!c || c.asistencia) return false;
            const telCita = String(c.cliente?.telefono || c.telefono || "").replace(/\D/g, "").slice(-10);
            return Boolean(telCita) && telCita === telDigits;
        });
        for (const c of pendientes) {
            await apiCitas.patch(c.id, payload);
        }
    } catch (e) {
        console.error("No se pudo propagar cambios prospecto -> cita:", e);
    }
}
// ─── UI Utilities ─────────────────────────────────────────────────────────────
function cls(...a) {
    return a.filter(Boolean).join(" ");
}
function widthClass(value) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    if (v >= 100)
        return "w-full";
    if (v >= 95)
        return "w-[95%]";
    if (v >= 90)
        return "w-[90%]";
    if (v >= 85)
        return "w-[85%]";
    if (v >= 80)
        return "w-4/5";
    if (v >= 75)
        return "w-3/4";
    if (v >= 70)
        return "w-[70%]";
    if (v >= 65)
        return "w-[65%]";
    if (v >= 60)
        return "w-3/5";
    if (v >= 55)
        return "w-[55%]";
    if (v >= 50)
        return "w-1/2";
    if (v >= 45)
        return "w-[45%]";
    if (v >= 40)
        return "w-2/5";
    if (v >= 35)
        return "w-[35%]";
    if (v >= 30)
        return "w-[30%]";
    if (v >= 25)
        return "w-1/4";
    if (v >= 20)
        return "w-1/5";
    if (v >= 15)
        return "w-[15%]";
    if (v >= 10)
        return "w-[10%]";
    if (v > 0)
        return "w-[5%]";
    return "w-0";
}
function chartColorClass(index = 0) {
    return ["bg-[#131E5C]", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-red-500", "bg-indigo-500", "bg-teal-500"][index % 8];
}
function badgeCls(value) {
    const map = {
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        calificado: "bg-violet-500/15 text-violet-800 border-violet-300/25",
        "pendiente de cotización": "bg-amber-500/20 text-amber-900 border-amber-300/40",
        "requiere asesor": "bg-orange-500/20 text-orange-900 border-orange-300/40",
        financiamiento: "bg-sky-500/15 text-sky-800 border-sky-300/30",
        "recopilación de documentos": "bg-cyan-500/15 text-cyan-800 border-cyan-300/25",
        "solicitud de crédito": "bg-purple-500/15 text-purple-800 border-purple-300/25",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
        facturado: "bg-sky-600/15 text-sky-800 border-sky-300/25",
        entregado: "bg-emerald-600/15 text-emerald-800 border-emerald-300/25",
        descalificado: "bg-slate-500/15 text-slate-700 border-slate-300/25",
        seguimiento: "bg-indigo-500/15 text-indigo-800 border-indigo-300/25",
    };
    return (map[String(value || "")
        .trim()
        .toLowerCase()] || "bg-black/10 text-[#131E5C] border-black/10");
}
function Skeleton({ className = "" }) {
    return <div className={cls("animate-pulse rounded-md bg-black/10", className)} />;
}
function SkeletonRow() {
    return (<tr className="animate-pulse">
        {[32, 40, 28, 28, 20].map((w, i) => (<td key={i} className="px-4 py-3">
            <div className={`h-4 w-${w} rounded bg-slate-200/60`} />
        </td>))}
    </tr>);
}
function ModalSkeleton() {
    return (<div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
        </div>))}
        <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-24 w-full rounded-lg" />
        </div>
    </div>);
}
function BadgeEstado({ value }) {
    const map = {
        descalificado: "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
        "recopilación de documentos": "bg-cyan-500/15 text-cyan-800 border-cyan-300/25",
        "solicitud de crédito": "bg-purple-500/15 text-purple-800 border-purple-300/25",
        facturado: "bg-sky-600/15 text-sky-800 border-sky-300/25",
        entregado: "bg-emerald-600/15 text-emerald-800 border-emerald-300/25",
        seguimiento: "bg-indigo-500/15 text-indigo-800 border-indigo-300/25",
    };
    const key = String(value || "")
        .trim()
        .toLowerCase();
    const c = map[key] || "bg-black/10 text-[#131E5C] border-black/10";
    return <span className={cls("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", c)}>{value || "Sin estado"}</span>;
}
function LeadScoreRing({ score }) {
    const { label, cls: labelCls } = getScoreLabel(score);
    const barCls = score >= 75 ? "bg-emerald-600" : score >= 50 ? "bg-amber-600" : score >= 30 ? "bg-sky-600" : "bg-slate-400";
    return (<div className="min-w-[110px]">
        <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-black text-[#131E5C]">{score}</span>
            <span className={cls("rounded-full border px-2 py-0.5 text-[10px] font-semibold", labelCls)}>{label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cls("h-full rounded-full", barCls, widthClass(score))} /></div>
    </div>);
}
// ─── Vista Gráficos ────────────────────────────────────────────────────────────
function VistaGraficos({ rows }) {
    const totalProspectos = rows.length;
    const totalSeguro = totalProspectos || 1;
    const statsPorEstado = useMemo(() => countBy(rows, "estado", { includeEmpty: true, emptyLabel: "Sin estado" }), [rows]);
    const statsPorAgencia = useMemo(() => countBy(rows, "agencia", { includeEmpty: true, emptyLabel: "Sin dealer" }), [rows]);
    const statsPorLinea = useMemo(() => countBy(rows, "linea", { includeEmpty: true, emptyLabel: "Sin business" }), [rows]);
    const statsPorAsesor = useMemo(() => countBy(rows, "asesor_digital", { includeEmpty: true, emptyLabel: "Sin asesor", limit: 10 }), [rows]);
    const statsPorBuro = useMemo(() => countBy(rows, "buro_estado", { includeEmpty: true }), [rows]);
    const statsPorFormaPago = useMemo(() => countBy(rows, "forma_pago", { includeEmpty: true }), [rows]);
    const statsPorTipoCliente = useMemo(() => countBy(rows, "tipo_cliente", { includeEmpty: true }), [rows]);
    const statsPorPlazoCompra = useMemo(() => countBy(rows, "plazo_compra", { includeEmpty: true }), [rows]);
    const statsPorComprobacion = useMemo(() => countBy(rows, "comprobacion_ingresos", { includeEmpty: true }), [rows]);
    const statsPorUsoVehiculo = useMemo(() => countBy(rows, "uso_vehiculo", { includeEmpty: true, limit: 8 }), [rows]);
    const statsRangoEnganche = useMemo(() => countBy(rows, (r) => getMontoBucket(r.enganche_monto, "enganche"), { includeEmpty: true }), [rows]);
    const statsRangoMensual = useMemo(() => countBy(rows, (r) => getMontoBucket(r.presupuesto_mensual, "mensual"), { includeEmpty: true }), [rows]);
    const statsPorDia = useMemo(() => {
        const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const map = { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0, Sábado: 0, Domingo: 0 };
        for (const r of rows) {
            const fechaStr = r.fecha_reclamacion || r.fecha_contacto;
            if (fechaStr) {
                const f = new Date(fechaStr);
                if (!isNaN(f.getTime()))
                    map[diasSemana[f.getDay()]]++;
            }
        }
        const order = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        return Object.entries(map)
            .filter(([, c]) => c > 0)
            .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
    }, [rows]);
    const statsPorHora = useMemo(() => {
        const map = {};
        for (let i = 0; i < 24; i++)
            map[`${String(i).padStart(2, "0")}:00`] = 0;
        for (const r of rows) {
            const fechaStr = r.ultimo_contacto_at || r.creado || r.fecha_reclamacion || r.fecha_contacto;
            if (fechaStr) {
                const f = new Date(fechaStr);
                if (!isNaN(f.getTime())) {
                    const hora = `${String(f.getHours()).padStart(2, "0")}:00`;
                    map[hora]++;
                }
            }
        }
        return Object.entries(map).filter(([, c]) => c > 0);
    }, [rows]);
    const perfilCaptura = useMemo(() => [
        ["Enganche", rows.filter((r) => toNumber(r.enganche_monto)).length],
        ["Presupuesto mensual", rows.filter((r) => toNumber(r.presupuesto_mensual)).length],
        ["Buró", rows.filter((r) => r.buro_estado).length],
        ["Forma de pago", rows.filter((r) => r.forma_pago).length],
        ["Tipo de cliente", rows.filter((r) => r.tipo_cliente).length],
        ["Uso del vehículo", rows.filter((r) => r.uso_vehiculo).length],
        ["Plazo de compra", rows.filter((r) => r.plazo_compra).length],
        ["Comprobación ingresos", rows.filter((r) => r.comprobacion_ingresos).length],
    ], [rows]);
    const matrizBuroPago = useMemo(() => {
        const formas = ["credito", "contado", "arrendamiento", "desconocido", "Sin dato"];
        const buros = ["bueno", "regular", "iniciando", "desconocido", "Sin dato"];
        const rowsMatriz = formas
            .map((forma) => {
                const cells = buros.map((buro) => rows.filter((row) => {
                    const formaRow = row.forma_pago || "Sin dato";
                    const buroRow = row.buro_estado || "Sin dato";
                    return normalizeText(formaRow) === normalizeText(forma) && normalizeText(buroRow) === normalizeText(buro);
                }).length);
                return { forma, cells, total: cells.reduce((a, b) => a + b, 0) };
            })
            .filter((item) => item.total > 0);
        return { formas, buros, rowsMatriz };
    }, [rows]);
    const promedioEnganche = avgPositive(rows, "enganche_monto");
    const promedioMensual = avgPositive(rows, "presupuesto_mensual");
    const perfilesConDatos = rows.filter(hasPerfilComercial).length;
    const perfilesFinanciables = rows.filter((r) => {
        const forma = normalizeText(r.forma_pago);
        const buro = normalizeText(r.buro_estado);
        return ["credito", "arrendamiento"].includes(forma) && ["bueno", "regular"].includes(buro);
    }).length;
    const cotizacionesPendientes = rows.filter((r) => r.cotizacion_pendiente).length;
    const requiereAsesor = rows.filter((r) => r.requiere_asesor).length;
    function MetricCard({ title, value, subtitle, icon: Icon, tone = "blue" }) {
        const tones = {
            blue: "bg-[#131E5C]/10 text-[#131E5C]",
            green: "bg-emerald-100 text-emerald-700",
            amber: "bg-amber-100 text-amber-700",
            red: "bg-red-100 text-red-700",
            sky: "bg-sky-100 text-sky-700",
        };
        return (<div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={cls("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone] || tones.blue)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-2xl font-black leading-tight text-[#131E5C]">{value}</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-500">{title}</div>
                    {subtitle ? <div className="mt-1 text-[11px] font-semibold text-slate-400">{subtitle}</div> : null}
                </div>
            </div>
        </div>);
    }
    function BarGroup({ title, data, icon: Icon, colorIndex = 0, total = totalSeguro, maxItems = null }) {
        const visibleData = maxItems ? data.slice(0, maxItems) : data;
        const max = Math.max(...visibleData.map(([, count]) => count), 1);
        return (<div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#131E5C] px-5 py-3">
                <Icon className="h-4 w-4 text-white/70" />
                <span className="text-sm font-extrabold text-white">{title}</span>
                <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">{data.reduce((acc, [, n]) => acc + n, 0)}</span>
            </div>
            <div className="space-y-3 p-5 max-h-[320px] overflow-y-auto">
                {visibleData.map(([label, count], i) => (<div key={`${title}-${label}`}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[#131E5C]">
                        <span className="truncate" title={label}>
                            {label}
                        </span>
                        <span className="shrink-0 text-slate-500">
                            {count} · {percent(count, total)}%
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={cls("h-2 rounded-full transition-all duration-500", widthClass(Math.round((count / max) * 100)), chartColorClass(colorIndex + i))} />
                    </div>
                </div>))}
                {visibleData.length === 0 && <p className="text-center text-sm text-slate-400">Sin datos</p>}
            </div>
        </div>);
    }
    function CaptureCard({ title, data, icon: Icon }) {
        return (<div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#131E5C] px-5 py-3">
                <Icon className="h-4 w-4 text-white/70" />
                <span className="text-sm font-extrabold text-white">{title}</span>
                <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">calidad datos</span>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
                {data.map(([label, count], i) => (<div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#131E5C]">
                        <span>{label}</span>
                        <span>{percent(count, totalSeguro)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div className={cls("h-full rounded-full", widthClass(percent(count, totalSeguro)), chartColorClass(i))} />
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                        {count} de {totalProspectos} prospectos
                    </div>
                </div>))}
            </div>
        </div>);
    }
    function MatrixCard() {
        return (<div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-[#131E5C] px-5 py-3">
                <Target className="h-4 w-4 text-white/70" />
                <span className="text-sm font-extrabold text-white">Cruce buró vs forma de pago</span>
                <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">riesgo financiero</span>
            </div>
            <div className="overflow-x-auto p-5">
                <table className="min-w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                            <th className="px-3 py-2 font-black">Forma de pago</th>
                            {matrizBuroPago.buros.map((buro) => (<th key={buro} className="px-3 py-2 text-center font-black">
                                {valueOrDash(buro)}
                            </th>))}
                            <th className="px-3 py-2 text-center font-black">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {matrizBuroPago.rowsMatriz.map(({ forma, cells, total }) => (<tr key={forma}>
                            <td className="px-3 py-3 font-bold text-[#131E5C]">{valueOrDash(forma)}</td>
                            {cells.map((count, index) => (<td key={`${forma}-${matrizBuroPago.buros[index]}`} className="px-3 py-3 text-center font-semibold text-slate-600">
                                {count}
                            </td>))}
                            <td className="px-3 py-3 text-center font-black text-[#131E5C]">{total}</td>
                        </tr>))}
                        {matrizBuroPago.rowsMatriz.length === 0 && (<tr>
                            <td colSpan={matrizBuroPago.buros.length + 2} className="px-3 py-8 text-center text-slate-400">
                                Sin datos para mostrar.
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </div>);
    }
    return (<div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard icon={User} title="Prospectos analizados" value={totalProspectos.toLocaleString("es-MX")} subtitle="Resultado de filtros actuales" />
            <MetricCard icon={TrendingUp} title="Perfil comercial capturado" value={`${percent(perfilesConDatos, totalSeguro)}%`} subtitle={`${perfilesConDatos} con datos financieros`} tone="green" />
            <MetricCard icon={FileText} title="Enganche promedio" value={formatMoneyMXN(promedioEnganche)} subtitle="Solo prospectos con enganche" tone="sky" />
            <MetricCard icon={Clock3} title="Mensualidad promedio" value={formatMoneyMXN(promedioMensual)} subtitle="Solo prospectos con presupuesto" tone="sky" />
            <MetricCard icon={Target} title="Financiables" value={perfilesFinanciables} subtitle="Crédito/arrendamiento + buró bueno/regular" tone="green" />
            <MetricCard icon={AlertCircle} title="Atención comercial" value={cotizacionesPendientes + requiereAsesor} subtitle={`${cotizacionesPendientes} cotizaciones · ${requiereAsesor} asesor`} tone="amber" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
            <BarGroup title="Pipeline por estado" data={statsPorEstado} icon={BarChart3} colorIndex={0} />
            <BarGroup title="Distribución por dealer" data={statsPorAgencia} icon={Building2} colorIndex={2} />
            <BarGroup title="Distribución por business" data={statsPorLinea} icon={Car} colorIndex={4} />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
            <BarGroup title="Buró de crédito" data={statsPorBuro} icon={ClipboardCheck} colorIndex={1} />
            <BarGroup title="Forma de pago" data={statsPorFormaPago} icon={FileText} colorIndex={3} />
            <BarGroup title="Tipo de cliente" data={statsPorTipoCliente} icon={UserStar} colorIndex={5} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
            <BarGroup title="Rangos de enganche" data={statsRangoEnganche} icon={TrendingUp} colorIndex={2} />
            <BarGroup title="Rangos de presupuesto mensual" data={statsRangoMensual} icon={Clock3} colorIndex={4} />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
            <BarGroup title="Plazo de compra" data={statsPorPlazoCompra} icon={CalendarRange} colorIndex={0} />
            <BarGroup title="Comprobación de ingresos" data={statsPorComprobacion} icon={FileText} colorIndex={2} />
            <BarGroup title="Uso del vehículo" data={statsPorUsoVehiculo} icon={CarFront} colorIndex={4} />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
            <CaptureCard title="Cobertura de captura por campo" data={perfilCaptura} icon={Activity} />
            <MatrixCard />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <BarGroup title="Top 10 asesores digitales" data={statsPorAsesor} icon={UserStar} colorIndex={1} />
            <BarGroup title="Actividad por hora" data={statsPorHora} icon={Clock3} colorIndex={5} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <BarGroup title="Registros por día de la semana" data={statsPorDia} icon={CalendarDays} colorIndex={3} />
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 bg-[#131E5C] px-5 py-3">
                    <ClipboardCheck className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">Lectura ejecutiva</span>
                </div>
                <div className="space-y-3 p-5 text-sm text-slate-600">
                    <p>
                        <span className="font-black text-[#131E5C]">{percent(perfilesConDatos, totalSeguro)}%</span> de los prospectos tiene al menos un dato comercial capturado.
                    </p>
                    <p>
                        <span className="font-black text-[#131E5C]">{perfilesFinanciables}</span> prospectos tienen perfil potencialmente financiable según forma de pago y buró.
                    </p>
                    <p>Prioriza los casos con cotización pendiente, asesor requerido, buen buró y presupuesto mensual capturado.</p>
                </div>
            </div>
        </div>
    </div>);
}

const canonicalAsesorDigitalBDC = canonicalAsesorDigital;

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
    if (!open)
        return null;
    return createPortal(<div className="fixed inset-0 z-[250]">
        <div className="absolute inset-0 bg-black/45" onClick={onClose} />
        <div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-xl">
                <div className="flex shrink-0 items-center justify-between gap-3 bg-[#131E5C] px-5 py-4">
                    <div className="min-w-0">
                        <div className="truncate text-base font-extrabold text-white">{title}</div>
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15" aria-label="Cerrar">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 [scrollbar-gutter:stable]">{children}</div>
                {footer && <div className="flex shrink-0 flex-col gap-2 border-t border-[#131E5C]/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div>}
            </div>
        </div>
    </div>, document.body);
}
function Field({ label, icon: Icon, children }) {
    return (<div className="h-full rounded-lg border border-white/10 bg-neutral-200/50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span>{label}</span>
        </div>
        <div className="space-y-3">{children}</div>
    </div>);
}
function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row)
        return null;
    const x = ctxMenu.x ?? 0;
    const y = ctxMenu.y ?? 0;
    return createPortal(<div className="fixed z-[9999]" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
        <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
            <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}><Trash2 className="h-4 w-4" /> Eliminar</button>
            <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>Cerrar</button>
        </div>
    </div>, document.body);
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function DigitalesProspectos() {
    const navigate = useNavigate();
    const { user, ready } = useAuth();
        const {
        nombresAsesoresActivos,
    } = useAsesoresGestionComercial();
    const [cases, setCases] = useState([]);
    const [viewMode, setViewMode] = useState("tabla");
    const [highlightedRow, setHighlightedRow] = useState(null);
    const [telefonosConChat, setTelefonosConChat] = useState(() => new Set());
    const VIEW_MODES = [
        { key: "tabla", label: "Tabla", Icon: Table2 },
        { key: "ejecutivo", label: "Ejecutivo BDC", Icon: TrendingUp },
        { key: "resultados", label: "Resultados", Icon: BrainCircuit },
        { key: "graficos", label: "Gráficos", Icon: BarChart3 },
    ];
    const rolUsuario = useMemo(() => normalizeText(user?.rol?.nombre || user?.rol?.name || user?.rol || ""), [user]);

    const isAdmin = useMemo(() => {
        const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
        return rolUsuario === "administrador" || rolUsuario === "admin" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [rolUsuario, user?.permisos]);

    const isCoordinador = useMemo(() => {
        const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
        return !isAdmin && (["coordinador digital", "coordinador_digital"].includes(rolUsuario) || permisos.includes("CRM_COORDINADOR_DIGITAL"));
    }, [isAdmin, rolUsuario, user?.permisos]);

    const userAgencias = useMemo(() => String(user?.agencia || "").split("|").map((a) => a.trim()).filter(Boolean), [user?.agencia]);

    const userTieneAgencia = useCallback((agenciaRegistro) => {
        const agencia = normalizeDealerGrupo(agenciaRegistro);
        return Boolean(agencia && userAgencias.some((a) => normalizeDealerGrupo(a) === agencia));
    }, [userAgencias]);

    const numerosUsuarioSesion = useMemo(() => getNumerosUsuarioSesion(user), [user]);
    const numeroUsuarioSesion = numerosUsuarioSesion[0] || "";

    const numerosPermitidosCoordinador = useMemo(() => {
        if (!isCoordinador) return [];

        const lineasConfiguradas = new Set(Object.keys(LINEAS_WHATSAPP).map(normalizaTelefonoMx));

        return [...new Set(
            numerosUsuarioSesion
                .map(normalizaTelefonoMx)
                .filter((numero) => lineasConfiguradas.has(numero))
        )];
    }, [isCoordinador, numerosUsuarioSesion]);

    const asesoresPermitidosBDC = useMemo(() => {
        if (isAdmin) return null;

        const numeros = isCoordinador ? numerosPermitidosCoordinador : numerosUsuarioSesion;

        return [...new Set(
            numeros
                .map((numero) => getAsesorDigitalPorNumero(numero, user))
                .map(canonicalAsesorDigitalBDC)
                .filter(Boolean)
        )];
    }, [isAdmin, isCoordinador, numerosPermitidosCoordinador, numerosUsuarioSesion, user]);
    const [ctxMenu, setCtxMenu] = useState({ open: false, row: null });
    const [updatingEstado, setUpdatingEstado] = useState({});
    const [generatingSummary, setGeneratingSummary] = useState({});
    const [openSummaryModal, setOpenSummaryModal] = useState(false);
    const [summaryInfo, setSummaryInfo] = useState(null);
    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [selectedNumeroAsesor, setSelectedNumeroAsesor,] = useState("");
    const numeroAsesorActivo = useMemo(() => {
        if (selectedNumeroAsesor &&
            selectedNumeroAsesor !== "Todos") {
            return normalizaTelefonoMx(selectedNumeroAsesor);
        }
        return "";
    }, [selectedNumeroAsesor]);
    const deferredQ = useDeferredValue(filters.q);
    const [page, setPage] = useState(1);
    const [prospectoModal, setProspectoModal] = useState({ open: false, mode: "create", prospectoId: null, estadoInicial: "", tieneChatInicial: false });
    const [loadingCases, setLoadingCases] = useState(false);
    const [openAgendaModal, setOpenAgendaModal] = useState(false);
    const [agendaInfo, setAgendaInfo] = useState(null);
    const [drafter, setDrafter] = useState({ agencia: "", fecha_cita: "", asesor_digital: "", asesor_solicita: "", tipo_cita: "Digital" });
    const [savingo, setSavingo] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [versionOperativaBDC, setVersionOperativaBDC] = useState(0);
    useEffect(() => {
        const cerrar = () => setCtxMenu((prev) => (prev.open ? { open: false, row: null } : prev));
        window.addEventListener("click", cerrar);
        window.addEventListener("scroll", cerrar, true);
        window.addEventListener("resize", cerrar);
        return () => {
            window.removeEventListener("click", cerrar);
            window.removeEventListener("scroll", cerrar, true);
            window.removeEventListener("resize", cerrar);
        };
    }, []);
    const onRowContextMenu = (e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, row, x: e.clientX, y: e.clientY });
    };
    const eliminarCaso = async (row) => {
        if (!row?.id_exp)
            return;
        if (!confirm(`¿Eliminar el prospecto ${row.id_exp}? Esta acción no se puede deshacer.`))
            return;
        try {
            await api.digitalesDeleteProspecto(row.id_exp, {
                numero_asesor: numeroAsesorActivo ||
                    numeroUsuarioSesion ||
                    "",
            });
            setCases((prev) => prev.filter((c) => c.id_exp !== row.id_exp));
            setCtxMenu({ open: false, row: null });
        }
        catch (e) {
            console.error(e);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
    };
    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm text-[#131E5C] font-semibold outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    const cargarTelefonosConChat = useCallback(async () => {
        const numeroLinea = numeroAsesorActivo || numeroUsuarioSesion || "";

        if (!numeroLinea) {
            setTelefonosConChat(new Set());
            return;
        }

        try {
            const response = await api.digitalesChats({ numero_asesor: numeroLinea });
            const chats = Array.isArray(response) ? response : Array.isArray(response?.results) ? response.results : [];
            const telefonos = new Set(chats.map((chat) => normalizaTelefonoMx(chat?.telefono)).filter(Boolean));

            setTelefonosConChat(telefonos);
        } catch (error) {
            console.error("No se pudieron cargar los teléfonos con chat:", error);
            setTelefonosConChat(new Set());
        }
    }, [numeroAsesorActivo, numeroUsuarioSesion]);
    const cargarProspectosPorLinea = useCallback(async () => {
        if (!ready) return;

        let numerosAConsultar = [];

        if (isAdmin) {
            if (selectedNumeroAsesor === "Todos") {
                setLoadingCases(true);

                try {
                    const data = await listarProspectosDigitalesCompletos({ todos: 1, ligero: 1 });
                    setCases(getListItems(data).map(normalizeProspecto));
                    setPage(1);
                } catch (error) {
                    console.error("Error cargando todos los prospectos:", error);
                    setCases([]);
                } finally {
                    setLoadingCases(false);
                }

                return;
            }

            const numero = normalizaTelefonoMx(selectedNumeroAsesor);
            if (!numero || !LINEAS_WHATSAPP[numero]) {
                setCases([]);
                return;
            }

            numerosAConsultar = [numero];
        } else if (isCoordinador) {
            if (!numerosPermitidosCoordinador.length) {
                setCases([]);
                return;
            }

            if (selectedNumeroAsesor === "Todos") {
                numerosAConsultar = numerosPermitidosCoordinador;
            } else {
                const numero = normalizaTelefonoMx(selectedNumeroAsesor);

                if (!numerosPermitidosCoordinador.includes(numero)) {
                    setCases([]);
                    return;
                }

                numerosAConsultar = [numero];
            }
        } else {
            const numero = numeroAsesorActivo || numeroUsuarioSesion;

            if (!numero || !numerosUsuarioSesion.includes(numero)) {
                setCases([]);
                return;
            }

            numerosAConsultar = [numero];
        }

        setLoadingCases(true);

        try {
            const consultas = numerosAConsultar.map((numero) => ({
                etiqueta: numero,
                params: { numero_asesor: numero, ligero: 1 },
            }));

            const respuestas = await Promise.allSettled(
                consultas.map(({ params }) => listarProspectosDigitalesCompletos(params))
            );

            const registrosPorId = new Map();

            respuestas.forEach((resultado, index) => {
                if (resultado.status !== "fulfilled") {
                    console.error("No se pudo cargar la línea:", consultas[index]?.etiqueta, resultado.reason);
                    return;
                }

                getListItems(resultado.value).map(normalizeProspecto).forEach((registro) => {
                    if (registro?.id_exp !== null && registro?.id_exp !== undefined) registrosPorId.set(registro.id_exp, registro);
                });
            });

            setCases(Array.from(registrosPorId.values()));
            setPage(1);
        } catch (error) {
            console.error("Error cargando prospectos por línea:", error);
            setCases([]);
        } finally {
            setLoadingCases(false);
        }
    }, [
        ready,
        isAdmin,
        isCoordinador,
        selectedNumeroAsesor,
        numeroAsesorActivo,
        numeroUsuarioSesion,
        numerosUsuarioSesion,
        numerosPermitidosCoordinador,
    ]);
    useEffect(() => {
        cargarProspectosPorLinea();
    }, [cargarProspectosPorLinea]);
    useEffect(() => {
        if (!ready) return;

        if (isAdmin) {
            setSelectedNumeroAsesor((actual) => {
                if (actual === "Todos") return actual;

                const numero = normalizaTelefonoMx(actual);
                return numero && LINEAS_WHATSAPP[numero] ? numero : "Todos";
            });

            return;
        }

        if (isCoordinador) {
            setSelectedNumeroAsesor((actual) => {
                if (actual === "Todos") return actual;

                const numero = normalizaTelefonoMx(actual);
                return numero && numerosPermitidosCoordinador.includes(numero) ? numero : "Todos";
            });

            return;
        }

        setSelectedNumeroAsesor(numerosUsuarioSesion[0] || "");
    }, [ready, isAdmin, isCoordinador, numerosUsuarioSesion, numerosPermitidosCoordinador]);
    useEffect(() => {
        if (!ready ||
            !(numeroAsesorActivo ||
                numeroUsuarioSesion)) {
            return;
        }
        cargarTelefonosConChat();
    }, [
        ready,
        numeroAsesorActivo,
        numeroUsuarioSesion,
        cargarTelefonosConChat,
    ]);
    const filtroNumeroActivo = useMemo(() => {
        if ((isAdmin || isCoordinador) && selectedNumeroAsesor === "Todos") return null;
        const numero = numeroAsesorActivo || numeroUsuarioSesion;
        return LINEAS_WHATSAPP[normalizaTelefonoMx(numero)] || null;
    }, [isAdmin, isCoordinador, selectedNumeroAsesor, numeroAsesorActivo, numeroUsuarioSesion]);
    const dealers = useMemo(() => {
        const ordenDealers = [
            "VW Cordoba",
            "VW Orizaba",
            "VW Poza Rica",
            "VW Tuxtepec",
            "VW Tuxpan",
        ];
        const agenciasPorNumero = numerosUsuarioSesion
            .map((numero) => LINEAS_WHATSAPP[normalizaTelefonoMx(numero)]?.agencia ||
                "")
            .filter(Boolean);
        const source = isAdmin
            ? DEALERS
            : [
                ...userAgencias,
                ...agenciasPorNumero,
            ];
        const grupos = new Set(source
            .map(normalizeDealerGrupo)
            .filter(Boolean));
        const ordenados = ordenDealers.filter((dealer) => grupos.has(dealer));
        const extras = Array.from(grupos)
            .filter((dealer) => !ordenDealers.includes(dealer))
            .sort((a, b) => a.localeCompare(b, "es"));
        return [
            "Todos",
            ...ordenados,
            ...extras,
        ];
    }, [
        isAdmin,
        userAgencias,
        numerosUsuarioSesion,
    ]);
    const estados = useMemo(() => {
        const s = new Set(cases.map((c) => c.estado).filter(Boolean));
        return ["Todos", ...Array.from(s)];
    }, [cases]);
    const businessOptions = useMemo(() => {
        const set = new Set(cases.map((c) => String(c.linea || "").trim()).filter(Boolean));
        const orderedKnown = Object.keys(lineaMeta).filter((item) => set.has(item));
        const extras = Array.from(set)
            .filter((item) => !orderedKnown.includes(item))
            .sort((a, b) => a.localeCompare(b, "es"));
        return ["Todos", ...orderedKnown, ...extras];
    }, [cases]);
    const buroOptions = useMemo(() => {
        const items = Array.from(new Set(cases.map((c) => String(c.buro_estado || "").trim()).filter(Boolean)));
        return ["Todos", ...items.sort((a, b) => valueOrDash(a).localeCompare(valueOrDash(b), "es"))];
    }, [cases]);
    const formaPagoOptions = useMemo(() => {
        const items = Array.from(new Set(cases.map((c) => String(c.forma_pago || "").trim()).filter(Boolean)));
        return ["Todos", ...items.sort((a, b) => valueOrDash(a).localeCompare(valueOrDash(b), "es"))];
    }, [cases]);
    const tipoClienteOptions = useMemo(() => {
        const items = Array.from(new Set(cases.map((c) => String(c.tipo_cliente || "").trim()).filter(Boolean)));
        return ["Todos", ...items.sort((a, b) => valueOrDash(a).localeCompare(valueOrDash(b), "es"))];
    }, [cases]);
    const phoneOptions = useMemo(() => {
        if (isAdmin) return ["Todos", ...Object.keys(LINEAS_WHATSAPP)];
        if (isCoordinador) return ["Todos", ...numerosPermitidosCoordinador];

        return numerosUsuarioSesion
            .map(normalizaTelefonoMx)
            .filter((numero) => Boolean(LINEAS_WHATSAPP[numero]))
            .slice(0, 1);
    }, [isAdmin, isCoordinador, numerosUsuarioSesion, numerosPermitidosCoordinador]);
    function toggleSort(key) {
        setSort((prev) => (prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" }));
    }
    const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
    const accessibleCases = useMemo(() => cases.filter((c) => {
        if (!isAdmin && !isCoordinador && userAgencias.length && !userTieneAgencia(c.agencia)) return false;

        if (filtroNumeroActivo && normalizeDealerGrupo(c.agencia) !== normalizeDealerGrupo(filtroNumeroActivo.agencia)) return false;

        if (!filtroNumeroActivo && !isAdmin && !isCoordinador) return false;

        return true;
    }), [cases, isAdmin, isCoordinador, filtroNumeroActivo, userAgencias, userTieneAgencia]);
    const baseFiltered = useMemo(() => {
        const q = deferredQ.trim().toLowerCase();
        return accessibleCases.filter((c) => {
            const nombre = `${c.cliente_nombre || ""} ${c.cliente_apellidos || ""}`.trim();
            const matchQ = !q ||
                [c.id_exp, c.cliente_id, c.agencia, nombre, c.comentarios, c.estado, c.telefono, c.correo, c.asesor_digital, c.asesor_solicita, c.linea, c.origen, c.cliente_interes, c.pauta, c.enganche_monto, c.presupuesto_mensual, c.buro_estado, c.forma_pago, c.tipo_cliente, c.uso_vehiculo, c.plazo_compra, c.comprobacion_ingresos].some((v) => String(v || "").toLowerCase().includes(q));
            return (matchQ &&
                (filters.estado === "Todos" || c.estado === filters.estado) &&
                dealerMatchesFilter(c.agencia, filters.agencia) &&
                (filters.linea === "Todos" || c.linea === filters.linea) &&
                (filters.buro === "Todos" || c.buro_estado === filters.buro) &&
                (filters.formaPago === "Todos" || c.forma_pago === filters.formaPago) &&
                (filters.tipoCliente === "Todos" || c.tipo_cliente === filters.tipoCliente) &&
                isDateInRange(c.fecha_reclamacion, filters.fechaRegistroDesde, filters.fechaRegistroHasta));
        });
    }, [accessibleCases, deferredQ, filters]);
    const sorted = useMemo(() => {
        const data = [...baseFiltered];
        if (!sort.key)
            return data;
        const dir = sort.dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const va = getSortValue(a, sort.key), vb = getSortValue(b, sort.key);
            if (va < vb)
                return -1 * dir;
            if (va > vb)
                return 1 * dir;
            return 0;
        });
    }, [baseFiltered, sort]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    useEffect(() => {
        setPage(1);
    }, [filters, sort]);
    useEffect(() => {
        setPage((prev) => Math.min(prev, totalPages));
    }, [totalPages]);
    const paginatedRows = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
    // KPIs
    const kpis = useMemo(() => {
        const total = sorted.length;
        const pendIA = sorted.filter((r) => r.cotizacion_pendiente || r.requiere_asesor).length;
        const conPerfil = sorted.filter(hasPerfilComercial).length;
        const financiamiento = sorted.filter((r) => ["credito", "arrendamiento"].includes(normalizeText(r.forma_pago))).length;
        const tiemposResp = sorted
            .filter((r) => r.primer_contacto_at && r.creado)
            .map((r) => (new Date(r.primer_contacto_at).getTime() - new Date(r.creado).getTime()) / 60000)
            .filter((v) => v > 0 && v < 1440);
        const avgResp = tiemposResp.length ? Math.round(tiemposResp.reduce((a, b) => a + b, 0) / tiemposResp.length) : null;
        return { total, pendIA, conPerfil, financiamiento, avgResp };
    }, [sorted]);
    function calcTiempoRespuesta(creado, primerContacto) {
        if (!creado || !primerContacto)
            return null;
        const diff = new Date(primerContacto).getTime() - new Date(creado).getTime();
        if (diff < 0)
            return null;
        const totalSegundos = Math.round(diff / 1000);
        // Si es menos de 60 segundos, mostrar solo segundos
        if (totalSegundos < 60) {
            return `${totalSegundos}s`;
        }
        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        const segundos = totalSegundos % 60;
        let resultado = "";
        if (horas > 0) {
            resultado += `${horas}h `;
        }
        if (minutos > 0 || horas > 0) {
            resultado += `${minutos}m `;
        }
        if (segundos > 0 || (horas === 0 && minutos === 0)) {
            resultado += `${segundos}s`;
        }
        return resultado.trim();
    }
    const dtFmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    function fmtDTIntl(value) {
        if (!value)
            return "—";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "—" : dtFmt.format(d);
    }
    function limpiarValorExcel(value) {
        if (value === null || value === undefined || value === "")
            return "—";
        const texto = String(value).trim();
        return /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
    }
    function exportarExcelProspectos() {
        if (!sorted.length) {
            alert("No hay registros para exportar con los filtros actuales.");
            return;
        }
        const ahora = new Date();
        const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
        const hora = `${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;
        const registros = sorted.map((row) => ({
            ID: limpiarValorExcel(row.id_exp),
            Dealer: limpiarValorExcel(row.agencia),
            Cliente: limpiarValorExcel(`${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim()),
            Teléfono: limpiarValorExcel(formatTelefonoMx(row.telefono)),
            Correo: limpiarValorExcel(row.correo),
            Business: limpiarValorExcel(row.linea),
            "Canal de Contacto": limpiarValorExcel(row.origen),
            "Pauta de Origen": limpiarValorExcel(row.pauta),
            Estado: limpiarValorExcel(row.estado),
            "Motivo de descalificación": limpiarValorExcel(row.motivo_descalificacion),
            "Asesor Digital": limpiarValorExcel(row.asesor_digital),
            "Asignado a": limpiarValorExcel(row.asesor_solicita),
            "VW de sus sueños": limpiarValorExcel(row.cliente_interes),
            "Fecha de Registro": limpiarValorExcel(row.fecha_reclamacion),
            "Primer Contacto": limpiarValorExcel(fmtDTIntl(row.primer_contacto_at)),
            "Último Contacto": limpiarValorExcel(fmtDTIntl(row.ultimo_contacto_at)),
            Enganche: limpiarValorExcel(formatMoneyMXN(row.enganche_monto)),
            "Presupuesto mensual": limpiarValorExcel(formatMoneyMXN(row.presupuesto_mensual)),
            Buró: limpiarValorExcel(valueOrDash(row.buro_estado)),
            "Forma de pago": limpiarValorExcel(valueOrDash(row.forma_pago)),
            "Tipo cliente": limpiarValorExcel(valueOrDash(row.tipo_cliente)),
            "Uso vehículo": limpiarValorExcel(row.uso_vehiculo),
            "Plazo compra": limpiarValorExcel(row.plazo_compra),
            "Comprobación ingresos": limpiarValorExcel(row.comprobacion_ingresos),
            "Cotización pendiente": row.cotizacion_pendiente ? "Sí" : "No",
            "Requiere asesor": row.requiere_asesor ? "Sí" : "No",
            "IA pausada": row.ia_pausada ? "Sí" : "No",
            "Última cita agendada": limpiarValorExcel(fmtDTIntl(row.ultima_cita_agendada)),
            Asistencia: row.asistencia ? "Sí" : "No",
            Comentarios: limpiarValorExcel(row.comentarios),
            "Resumen IA": limpiarValorExcel(row.resumen),
        }));
        const ws = XLSX.utils.json_to_sheet(registros);
        ws["!cols"] = Array(32).fill({ wch: 22 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Prospectos");
        XLSX.writeFile(wb, `reporte_prospectos_${fecha}_${hora}.xlsx`, { compression: true });
    }
    const closeProspectoModal = () => setProspectoModal((p) => ({ ...p, open: false }));
    const openCreate = () => setProspectoModal({ open: true, mode: "create", prospectoId: null, estadoInicial: "", tieneChatInicial: false });
    const handleProspectoGuardado = (prospectoGuardado, opciones = {}) => {
        if (opciones?.modo === "create") {
            const normalizado = normalizeProspecto(prospectoGuardado || {});
            if (normalizado?.id_exp) setCases((actuales) => { const mapa = new Map(actuales.map((item) => [item.id_exp, item])); mapa.set(normalizado.id_exp, normalizado); return Array.from(mapa.values()); });
        }
        // Propaga cambios prospecto -> citas pendientes (modelo, asesores, agencia, fuente)
        try {
            const p = prospectoGuardado || {};
            const tel = p.telefono || p.cliente_telefono || p.cliente?.telefono || "";
            const cambios = {
                ...(p.auto_interes || p.autoInteres ? { auto_interes: p.auto_interes || p.autoInteres } : {}),
                ...(p.asesor_digital ? { asesor_digital: p.asesor_digital } : {}),
                ...(p.asesor_ventas || p.asesor_piso ? { asesor_piso: p.asesor_ventas || p.asesor_piso } : {}),
                ...(p.agencia ? { agencia: p.agencia } : {}),
                ...(p.fuente_prospeccion || p.pauta || p.canal_contacto ? { fuente_prospeccion: p.fuente_prospeccion || p.pauta || p.canal_contacto } : {}),
            };
            if (tel && Object.keys(cambios).length) {
                propagarCambiosACitasProspecto({ telefono: tel, cambios }).catch(() => { });
            }
        } catch { }
        cargarProspectosPorLinea().catch((error) => console.error("No se pudo refrescar la lista despues de guardar el prospecto:", error));
    };
    const handlePlantillaProspectoEnviada = ({ telefono } = {}) => {
        const tel = normalizaTelefonoMx(telefono);
        if (tel) setTelefonosConChat((actuales) => { const siguiente = new Set(actuales); siguiente.add(tel); return siguiente; });
        cargarTelefonosConChat().catch((error) => console.error("No se pudieron refrescar los chats después de enviar la plantilla:", error));
    };
    const closeAgendaModal = () => {
        setOpenAgendaModal(false);
        setAgendaInfo(null);
    };
    const closeSummaryModal = () => {
        setOpenSummaryModal(false);
        setSummaryInfo(null);
    };
    const openSummaryViewer = (row) => {
        if (!row)
            return;
        setSummaryInfo({ id_exp: row.id_exp, nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(), resumen: row.resumen || "", resumen_actualizado_at: row.resumen_actualizado_at || "", resumen_fuente: row.resumen_fuente || "" });
        setOpenSummaryModal(true);
    };
    const abrirAgendaCita = (row) => {
        if (!row)
            return;
        const nombre = `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim();
        setAgendaInfo({ id_exp: row.id_exp, cliente_id: row.cliente_id, nombre, telefono: row.telefono || "", correo: row.correo || "", auto_interes: row.cliente_interes || "", agencia: row.agencia || "", fuente_prospeccion: row.origen || "", fecha_cita: "", asesor_digital: row.asesor_digital, asesor_solicita: row.asesor_solicita, tipo_cita: "Digital" });
        setOpenAgendaModal(true);
    };
    const openEdit = (row, estadoInicial = "") => {
        if (!row?.id_exp) return;
        const tel = normalizaTelefonoMx(row.telefono);
        setProspectoModal({ open: true, mode: "edit", prospectoId: row.id_exp, estadoInicial, tieneChatInicial: Boolean(tel && telefonosConChat.has(tel)) });
    };
    const refreshList = async () => { await cargarProspectosPorLinea(); };
    useEffect(() => {
        if (openAgendaModal && agendaInfo) {
            setDrafter({ agencia: agendaInfo.agencia || "", fecha_cita: agendaInfo.fecha_cita || "", asesor_digital: agendaInfo.asesor_digital || "", asesor_solicita: agendaInfo.asesor_solicita || "", tipo_cita: agendaInfo.tipo_cita || "Digital" });
            setErrorMsg("");
        }
    }, [openAgendaModal, agendaInfo]);
    async function handleAgendar() {
        if (!agendaInfo || savingo) return;

        try {
            setSavingo(true);
            setErrorMsg("");

            if (!drafter.fecha_cita) {
                throw new Error(
                    "Selecciona fecha y hora de la cita."
                );
            }

            const asesorDigital =
                canonicalAsesorDigitalBDC(
                    drafter.asesor_digital ||
                    agendaInfo.asesor_digital ||
                    ""
                );

            if (!asesorDigital) {
                throw new Error(
                    "La cita debe tener un asesor digital."
                );
            }

            await apiCitas.create({
                cliente_id: agendaInfo.cliente_id,
                nombre: agendaInfo.nombre || "",
                telefono: agendaInfo.telefono,
                correo: agendaInfo.correo || "",
                auto_interes: agendaInfo.auto_interes || "",
                agencia: agendaInfo.agencia || drafter.agencia || "",
                fecha_hora_cita: drafter.fecha_cita,
                asistencia: false,
                tipo_cita: "Digital",
                motivo_cita: "Digital",
                tipo_venta: "",
                fuente_prospeccion: agendaInfo.fuente_prospeccion || "",
                asesor_digital: asesorDigital,
                asesor_piso: drafter.asesor_solicita || "",
                comentarios: "",
            });
            // Sincroniza prospecto -> cita: asegura agencia/modelo actualizados en prospecto tambien
            try {
                const prospectoId = agendaInfo.id_exp;
                if (prospectoId) {
                    await api.digitalesPatchProspecto(prospectoId, {
                        ...(agendaInfo.agencia ? { agencia: agendaInfo.agencia } : {}),
                        ...(agendaInfo.auto_interes ? { auto_interes: agendaInfo.auto_interes } : {}),
                        ...(asesorDigital ? { asesor_digital: asesorDigital } : {}),
                        ...(drafter.asesor_solicita ? { asesor_ventas: drafter.asesor_solicita } : {}),
                    }).catch(() => { });
                }
            } catch { }
            // Mover prospecto a Cita Programada para reflejar en bandeja
            try {
                if (agendaInfo.id_exp) {
                    await api.digitalesPatchProspecto(agendaInfo.id_exp, { estado: "Cita Programada" }).catch(() => { });
                }
            } catch { }
            // DashboardEjecutivoBDC mantiene su propio estado; sólo notificamos
            // que debe refrescar las métricas operativas. Esto elimina el ReferenceError
            // de setCitasBDC fuera de alcance.
            setVersionOperativaBDC((version) => version + 1);
            await refreshList();

            closeAgendaModal();
        } catch (error) {
            console.error(
                "Error creando cita digital:",
                error
            );

            setErrorMsg(
                error?.message ||
                "No se pudo crear la cita."
            );
        } finally {
            setSavingo(false);
        }
    }
    const updateEstadoInline = async (row, newEstado) => {
        const id = row?.id_exp;
        if (!id)
            return;
        if (normalizeText(newEstado) === "descalificado") {
            await openEdit(row, "Descalificado");
            return;
        }
        const prevEstado = row.estado;
        const prevPrimer = row.primer_contacto_at;
        const prevUltimo = row.ultimo_contacto_at;
        const now = new Date();
        const nowLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const primerContactoNuevo = row.primer_contacto_at || nowLocal; // solo se fija la primera vez
        setCases((prev) => prev.map((caso) => caso.id_exp === id
            ? {
                ...caso,
                estado: newEstado,
                motivo_descalificacion: "",
                primer_contacto_at: primerContactoNuevo,
                ultimo_contacto_at: nowLocal,
            }
            : caso));
        setUpdatingEstado((p) => ({ ...p, [id]: true }));
        try {
            await api.digitalesPatchProspecto(id, {
                numero_asesor: numeroAsesorActivo ||
                    numeroUsuarioSesion ||
                    "",
                estado: newEstado,
                motivo_descalificacion: "",
                primer_mensaje_cliente: primerContactoNuevo,
                ultimo_contacto_asesor: nowLocal,
            });
        }
        catch (e) {
            console.error(e);
            setCases((prev) => prev.map((c) => (c.id_exp === id ? { ...c, estado: prevEstado, primer_contacto_at: prevPrimer, ultimo_contacto_at: prevUltimo } : c)));
            alert("No se pudo actualizar el estado.");
        }
        finally {
            setUpdatingEstado((p) => {
                const n = { ...p };
                delete n[id];
                return n;
            });
        }
    };
    const generarResumenInline = async (row) => {
        const id = row?.id_exp;
        if (!id) {
            alert("El prospecto no tiene un ID válido.");
            return;
        }
        setGeneratingSummary((prev) => ({
            ...prev,
            [id]: true,
        }));
        try {
            const res = await api.digitalesGenerarResumen(id, {
                numero_asesor: numeroAsesorActivo ||
                    numeroUsuarioSesion ||
                    "",
            });
            if (!res?.ok) {
                throw new Error(res?.error || "El backend no pudo generar el resumen.");
            }
            const resumenNuevo = String(res?.resumen || "").trim();
            if (!resumenNuevo) {
                throw new Error("El backend respondió, pero el resumen llegó vacío.");
            }
            const resumenActualizadoAt = toDTLocal(res?.resumen_actualizado_at);
            const resumenFuente = res?.resumen_fuente || "manual";
            setCases((prev) => prev.map((caso) => caso.id_exp === id
                ? {
                    ...caso,
                    resumen: resumenNuevo,
                    resumen_actualizado_at: resumenActualizadoAt,
                    resumen_fuente: resumenFuente,
                }
                : caso));
            setSummaryInfo({
                id_exp: id,
                nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(),
                resumen: resumenNuevo,
                resumen_actualizado_at: resumenActualizadoAt,
                resumen_fuente: resumenFuente,
            });
            setOpenSummaryModal(true);
        }
        catch (error) {
            console.error("Error generando resumen manual:", {
                prospectoId: id,
                error,
            });
            const mensaje = error instanceof Error ? error.message : String(error || "Error desconocido");
            alert(`No se pudo generar el resumen:\n\n${mensaje}`);
        }
        finally {
            setGeneratingSummary((prev) => {
                const nuevoEstado = { ...prev };
                delete nuevoEstado[id];
                return nuevoEstado;
            });
        }
    };
    const resetFilters = () => {
        setFilters(INITIAL_FILTERS);
        setSelectedNumeroAsesor(isAdmin ? "Todos" : numeroUsuarioSesion || "");
        setPage(1);
    };
    const now = new Date();
    const todayStr = formatDateYMDLocal(now);
    const yesterdayStr = formatDateYMDLocal(addDays(now, -1));
    const weekStartStr = formatDateYMDLocal(getStartOfWeek(now));
    const weekEndStr = formatDateYMDLocal(getEndOfWeek(now));
    const last7DaysStartStr = formatDateYMDLocal(addDays(now, -6));
    const last30DaysStartStr = formatDateYMDLocal(addDays(now, -30));
    const monthStartStr = formatDateYMDLocal(getStartOfMonth(now));
    const monthEndStr = formatDateYMDLocal(getEndOfMonth(now));
    const isQuickActive = (desde, hasta) => filters.fechaRegistroDesde === desde && filters.fechaRegistroHasta === hasta;
    // ── KPI Cards ────────────────────────────────────────────────────────────────
    const KPICard = ({ icon: Icon, label, value, sub, subColor = "text-slate-400", iconColor = "text-[#131E5C]" }) => (<div className="flex items-start gap-3 py-4 px-6 border-r border-slate-200 last:border-r-0">
        <Icon className={cls("h-6 w-6 flex-shrink-0 mt-1", iconColor)} />
        <div className="min-w-0">
            <div className="text-2xl font-black text-[#131E5C] leading-tight">{value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
            {sub && <div className={cls("text-[11px] font-semibold mt-1", subColor)}>{sub}</div>}
        </div>
    </div>);
    const FilterButtonGroup = ({ label, value, options, onChange }) => (<div className="flex-1 flex items-center gap-2.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40 shrink-0">{label}</span>
        <div className="flex gap-1.5 flex-1">
            {options.map((option) => {
                const active = value === option;
                const isTodos = option === "Todos";
                return (<button key={option} type="button" onClick={() => onChange(isTodos || active ? "Todos" : option)} className={cls("inline-flex h-9 flex-1 items-center justify-center rounded-full px-3 text-xs font-bold transition active:scale-[0.97]", isTodos ? (active ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600") : (active ? "bg-[#131E5C] text-white shadow-md shadow-[#131E5C]/20" : "bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10"))}>
                    {isTodos ? "Todos" : option}
                </button>);
            })}
        </div>
    </div>);
    // ── Render ───────────────────────────────────────────────────────────────────
    return (<div className="w-full">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-xl font-extrabold text-[#131E5C] flex items-center gap-2">Gestión de Prospectos</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center rounded-xl border border-[#131E5C]/20 bg-white p-1 shadow-sm">
                    {VIEW_MODES.map(({ key, label, Icon }) => (<button key={key} type="button" onClick={() => setViewMode(key)} className={cls("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition", viewMode === key ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100")}>
                        <Icon className="h-4 w-4" /> {label}
                    </button>))}
                </div>
                {!["ejecutivo", "resultados"].includes(viewMode) ? (<button type="button" onClick={exportarExcelProspectos} disabled={loadingCases || sorted.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 py-2 text-sm font-semibold text-[#131E5C] shadow-sm hover:bg-slate-100 disabled:opacity-50">
                    <FileDown className="h-4 w-4" /> Exportar Excel
                </button>) : null}
                <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80">
                    <Plus className="h-4 w-4" /> Nuevo Prospecto
                </button>
            </div>
        </div>
        {!["ejecutivo", "resultados"].includes(viewMode) ? (<>
            {/* KPIs arriba */}
            <div className="mb-5 overflow-hidden rounded-2xl bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
                    <KPICard icon={Users} label="Total prospectos hoy" value={kpis.total.toLocaleString()} sub={`${sorted.length} con filtros`} subColor="text-slate-400" />
                    <KPICard icon={Bot} label="Pendientes de respuesta IA" value={kpis.pendIA} sub={kpis.pendIA > 0 ? "Requieren atención" : "Sin pendientes"} subColor={kpis.pendIA > 0 ? "text-amber-600" : "text-emerald-600"} iconColor="text-amber-700" />
                    <KPICard icon={UserCheck} label="Perfil comercial" value={`${percent(kpis.conPerfil, kpis.total || 1)}%`} sub={`${kpis.conPerfil} con datos de compra`} subColor="text-sky-600" iconColor="text-sky-700" />
                    <KPICard icon={HandCoins} label="Crédito / arrendamiento" value={kpis.financiamiento} sub="Oportunidad financiera" subColor="text-violet-600" iconColor="text-violet-700" />
                    <KPICard icon={Gauge} label="Ventana prom. respuesta" value={kpis.avgResp !== null ? `${kpis.avgResp < 60 ? kpis.avgResp + "m" : Math.floor(kpis.avgResp / 60) + "h " + (kpis.avgResp % 60) + "m"}` : "—"} sub="Objetivo < 4h" subColor="text-sky-600" iconColor="text-sky-700" />
                </div>
            </div>
            {/* Filtros Dealer / Business */}
            <div className="mb-4">
                <div className="rounded-2xl border border-black/[0.08] bg-white shadow-md px-4 py-3 flex items-stretch gap-4">
                    <FilterButtonGroup label="Dealer" value={filters.agencia} options={dealers} onChange={(value) => {
                        updateFilter("agencia", value);
                    }} />
                    <div className="w-px bg-black/10 shrink-0" />
                    <FilterButtonGroup label="Business" value={filters.linea} options={businessOptions} onChange={(value) => {
                        updateFilter("linea", value);
                    }} />
                </div>
            </div>
            {/* Filtros compactos */}
            <div className="mb-4">
                <div className="rounded-2xl border border-black/[0.08] bg-white shadow-md p-4 space-y-3">
                    {/* Fila 1: Buscador + Dropdowns */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]/60" />
                            <input value={filters.q} onChange={(e) => updateFilter("q", e.target.value)} placeholder="Buscar cliente, teléfono, email, asesor, vehículo..." className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-slate-50 pl-10 pr-10 text-sm font-semibold text-[#131E5C] outline-none transition placeholder:text-slate-400 focus:border-[#131E5C]/40 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
                            {filters.q ? (<button type="button" onClick={() => updateFilter("q", "")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                                <X className="h-3.5 w-3.5" />
                            </button>) : null}
                        </div>
                        <div className="flex gap-2 flex-1">
                            <div className="flex-1">
                                <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Buró</label>
                                <select value={filters.buro} onChange={(e) => updateFilter("buro", e.target.value)} className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                    {buroOptions.map((s) => (<option key={s} value={s}>{s === "Todos" ? "Todos" : valueOrDash(s)}</option>))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Forma de pago</label>
                                <select value={filters.formaPago} onChange={(e) => updateFilter("formaPago", e.target.value)} className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                    {formaPagoOptions.map((s) => (<option key={s} value={s}>{s === "Todos" ? "Todos" : valueOrDash(s)}</option>))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Estado</label>
                                <select value={filters.estado} onChange={(e) => updateFilter("estado", e.target.value)} className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                    {estados.map((s) => (<option key={s} value={s}>{s === "Todos" ? "Todos" : s}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Fila 2: Filtros rápidos de fecha */}
                    <div className="flex items-end gap-1.5 flex-nowrap">
                        {[
                            { label: "Hoy", desde: todayStr, hasta: todayStr, inactive: "border-emerald-200 bg-emerald-300 text-emerald-700 hover:bg-emerald-100", active: "bg-emerald-600 text-white ring-4 ring-emerald-100" },
                            { label: "Ayer", desde: yesterdayStr, hasta: yesterdayStr, inactive: "border-amber-200 bg-amber-300 text-amber-700 hover:bg-amber-100", active: "bg-amber-500 text-white ring-4 ring-amber-100" },
                            { label: "Semana", desde: weekStartStr, hasta: weekEndStr, inactive: "border-sky-200 bg-sky-300 text-sky-700 hover:bg-sky-100", active: "bg-sky-600 text-white ring-4 ring-sky-100" },
                            { label: "7 días", desde: last7DaysStartStr, hasta: todayStr, inactive: "border-violet-200 bg-violet-300 text-violet-700 hover:bg-violet-100", active: "bg-violet-600 text-white ring-4 ring-violet-100" },
                            { label: "30 días", desde: last30DaysStartStr, hasta: todayStr, inactive: "border-indigo-200 bg-indigo-300 text-indigo-700 hover:bg-indigo-100", active: "bg-indigo-600 text-white ring-4 ring-indigo-100" },
                            { label: "Este mes", desde: monthStartStr, hasta: monthEndStr, inactive: "border-[#131E5C]/20 bg-blue-300 text-[#131E5C] hover:bg-blue-100", active: "bg-[#131E5C] text-white ring-4 ring-[#131E5C]/10" },
                        ].map(({ label, desde, hasta, inactive, active }) => {
                            const isActive = isQuickActive(desde, hasta);
                            return (<button key={label} type="button" onClick={() => setFilters((prev) => {
                                const alreadyActive = prev.fechaRegistroDesde === desde && prev.fechaRegistroHasta === hasta;
                                return { ...prev, fechaRegistroDesde: alreadyActive ? "" : desde, fechaRegistroHasta: alreadyActive ? "" : hasta };
                            })} className={cls("h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-[11px] font-bold shadow-sm transition active:scale-[0.97] mb-2", isActive ? active : inactive)}>
                                {label}
                            </button>);
                        })}
                        <div className="w-px h-9 shrink-0 bg-black/10 mx-0.5 self-center" />
                        <div className="min-w-0 flex-1">
                            <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Tipo cliente</label>
                            <select value={filters.tipoCliente} onChange={(e) => updateFilter("tipoCliente", e.target.value)} className="h-10 w-full cursor-pointer truncate rounded-xl border border-[#131E5C]/15 bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                {tipoClienteOptions.map((s) => (<option key={s} value={s}>{s === "Todos" ? "Todos" : valueOrDash(s)}</option>))}
                            </select>
                        </div>
                        {isAdmin || isCoordinador ? (<div className="min-w-0 flex-1">
                            <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Línea de WhatsApp</label>
                            <select value={selectedNumeroAsesor} onChange={(event) => {
                                setSelectedNumeroAsesor(event.target.value);
                                setPage(1);
                            }} className="h-10 w-full cursor-pointer rounded-xl border border-[#131E5C]/15 bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10 truncate">
                                {phoneOptions.map((numero) => (<option key={numero} value={numero}>{numero === "Todos" ? "Todos los asesores" : `${getAsesorDigitalPorNumero(numero, user) || getEtiquetaDigitalPorNumero(numero)} · ${formatTelefonoMx(numero)}`}</option>))}
                            </select>
                        </div>) : null}
                        <div className="min-w-0 flex-[1.2]">
                            <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Fecha de registro</label>
                            <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                                <input type="date" title="Registro desde" value={filters.fechaRegistroDesde} onChange={(e) => updateFilter("fechaRegistroDesde", e.target.value)} className="h-10 w-full min-w-0 cursor-pointer rounded-xl border border-[#131E5C]/15 bg-white px-2 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10" />
                                <span className="text-xs font-black text-slate-400">→</span>
                                <input type="date" title="Registro hasta" value={filters.fechaRegistroHasta} onChange={(e) => updateFilter("fechaRegistroHasta", e.target.value)} className="h-10 w-full min-w-0 cursor-pointer rounded-xl border border-[#131E5C]/15 bg-white px-2 text-xs font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10" />
                            </div>
                        </div>
                        <button type="button" onClick={resetFilters} title="Borrar filtros" className="h-8 shrink-0 self-end whitespace-nowrap rounded-full border border-red-200 bg-white px-3 text-[11px] font-bold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-[0.97] mb-2">Borrar filtros</button>
                    </div>
                </div>
            </div>
        </>) : null}
        {/* Vista Resultados IA */}
        {viewMode === "resultados" && <ResultadosIA numeroAsesorInicial={selectedNumeroAsesor !== "Todos" ? selectedNumeroAsesor : ""} agenciaInicial={filters.agencia !== "Todos" ? filters.agencia : ""} businessInicial={filters.linea !== "Todos" ? filters.linea : ""} />}
        {/* Vista Ejecutivo BDC */}
        {viewMode === "ejecutivo" && (<DashboardEjecutivoBDC rows={accessibleCases} versionOperativa={versionOperativaBDC} asesoresPermitidos={asesoresPermitidosBDC} accesoTotal={isAdmin} />)}
        {/* Vista Gráficos */}
        {viewMode === "graficos" && <VistaGraficos rows={sorted} />}
        {/* Vista Tabla */}
        {viewMode === "tabla" && (<div className="min-w-0">
            {/* Tabla principal */}
            <div className="flex-1 min-w-0">
                <div className="hidden rounded-2lg bg-white border border-black/[0.08] shadow-md lg:block">
                    <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 310px)" }}>
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-[#131E5C] sticky top-0 z-10">
                                <tr>
                                    {[
                                        { key: "agencia", label: "Dealer" },
                                        { key: null, label: "Cliente" },
                                        { key: "fecha_reclamacion", label: "Fecha registro" },
                                        { key: "primer_contacto_at", label: "1er contacto" },
                                        { key: "ultimo_contacto_at", label: "Último contacto" },
                                        { key: null, label: "Respuesta" },
                                        { key: null, label: "Business" },
                                        { key: null, label: "Interés" },
                                        { key: null, label: "Prioridad" },
                                        { key: "estado", label: "Estado" },
                                        { key: null, label: "Canal" },
                                        { key: null, label: "Asesor Digital" },
                                        { key: null, label: "Asesor Piso" },
                                        { key: null, label: "Score" },
                                        { key: null, label: "Perfil financiero" },
                                        { key: null, label: "Perfil compra" },
                                        { key: null, label: "Resumen" },
                                        { key: null, label: "Acciones" },
                                    ].map(({ key, label }) => (<th key={label} className="px-3 py-3 whitespace-nowrap text-left">
                                        {key ? (<button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/90 hover:text-white">
                                            {label}
                                            <span className="opacity-60">{sort.key === key ? sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}</span>
                                        </button>) : (<span className="text-[11px] font-bold uppercase tracking-wider text-white/90">{label}</span>)}
                                    </th>))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingCases
                                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                    : paginatedRows.map((row) => {
                                        const score = calcLeadScore(row);
                                        const prioridad = getPrioridad(row);
                                        const perfilFin = getPerfilFinancieroDiagnostico(row);
                                        const isUpdating = !!updatingEstado[row.id_exp];
                                        const rowTieneChat = telefonosConChat.has(normalizaTelefonoMx(row.telefono));
                                        return (<tr key={row.id_exp} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} onClick={() => setHighlightedRow(row)} className={cls("cursor-pointer hover:bg-[#131E5C]/[0.04] transition-colors", highlightedRow?.id_exp === row.id_exp ? "bg-[#131E5C]/[0.06]" : "")}>
                                            <td className="px-3 py-2.5 text-xs text-[#131E5C] font-semibold whitespace-nowrap">{row.agencia || "—"}</td>
                                            <td className="px-3 py-2.5 min-w-[140px]">
                                                <div className="text-xs font-bold text-[#131E5C] truncate max-w-[130px]">{`${row.cliente_nombre} ${row.cliente_apellidos}`.trim() || "Sin nombre"}</div>
                                                <div className="text-[11px] text-slate-400">{formatTelefonoMx(row.telefono)}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtDTIntl(row.creado) || row.fecha_reclamacion || "—"}</td>
                                            <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.primer_contacto_at ? fmtDTIntl(row.primer_contacto_at) : "—"}</td>
                                            <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.ultimo_contacto_at ? fmtDTIntl(row.ultimo_contacto_at) : "—"}</td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                {(() => {
                                                    const t = calcTiempoRespuesta(row.creado, row.primer_contacto_at);
                                                    if (!t)
                                                        return <span className="text-xs text-slate-400">—</span>;
                                                    const segundos = (new Date(row.primer_contacto_at) - new Date(row.creado)) / 1000;
                                                    const color = segundos <= 300 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : segundos <= 3600 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";
                                                    return <span className={cls("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", color)}>{t}</span>;
                                                })()}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-[#131E5C] font-semibold">{row.linea || "—"}</td>
                                            <td className="px-3 py-2.5 text-xs text-[#131E5C]">{row.cliente_interes || "—"}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={cls("inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", prioridad.cls)}>{prioridad.label}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="relative inline-flex items-center">
                                                    <select value={row.estado || "Contactado"} disabled={isUpdating} onClick={(e) => e.stopPropagation()} onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateEstadoInline(row, e.target.value);
                                                    }} className={cls("appearance-none rounded-full border bg-transparent px-2.5 py-0.5 pr-7 text-[11px] font-semibold outline-none", badgeCls(row.estado), isUpdating ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
                                                        {ETIQUETAS_ESTADO.map((s) => (<option key={s} value={s} className="bg-white text-[#131E5C]">
                                                            {s}
                                                        </option>))}
                                                    </select>
                                                    <span className="pointer-events-none absolute right-1.5">{isUpdating ? <Loader2 className="h-3 w-3 animate-spin text-[#131E5C]" /> : <ChevronDown className="h-3 w-3 text-[#131E5C]/60" />}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.origen || "—"}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <div className={cls("h-1.5 w-1.5 rounded-full flex-shrink-0", row.asesor_digital?.toLowerCase().includes("ia") ? "bg-emerald-500" : "bg-slate-300")} />
                                                    <span className="text-xs text-[#131E5C] truncate max-w-[110px]" title={row.asesor_digital || ""}>
                                                        {row.asesor_digital || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 min-w-[170px]">
                                                {row.asesor_solicita ? (<div>
                                                    <div className="text-xs font-bold text-[#131E5C] truncate max-w-[160px]" title={row.asesor_solicita}>
                                                        {row.asesor_solicita}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-slate-400">Asesor de piso/ventas</div>
                                                </div>) : (<span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">Sin asignar</span>)}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <LeadScoreRing score={score} />
                                            </td>
                                            <td className="px-3 py-2.5 min-w-[220px]">
                                                <div className="text-xs font-bold text-[#131E5C]">Eng. {formatMoneyMXN(row.enganche_monto)}</div>
                                                <div className={cls("mt-0.5 text-[11px] font-semibold", perfilFin.engancheSuficiente ? "text-emerald-600" : "text-amber-700")}>Mín. 20%: {formatMoneyMXN(perfilFin.engancheMinimo)}</div>
                                                {perfilFin.faltanteEnganche > 0 ? <div className="mt-0.5 text-[11px] font-bold text-red-500">Faltan {formatMoneyMXN(perfilFin.faltanteEnganche)}</div> : <div className="mt-0.5 text-[11px] font-bold text-emerald-600">Enganche suficiente</div>}
                                                <div className="mt-0.5 text-[11px] text-slate-500">
                                                    Mens. {formatMoneyMXN(row.presupuesto_mensual)} · Est. {formatMoneyMXN(perfilFin.mensualidadMinima)}
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-slate-400">
                                                    Buró {valueOrDash(row.buro_estado)} · {valueOrDash(row.forma_pago)}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 min-w-[190px]">
                                                <div className="text-xs font-bold text-[#131E5C]">{valueOrDash(row.tipo_cliente)}</div>
                                                <div className="mt-0.5 text-[11px] text-slate-500">Plazo: {valueOrDash(row.plazo_compra)}</div>
                                                <div className="mt-0.5 text-[11px] text-slate-400 truncate max-w-[180px]" title={row.uso_vehiculo || ""}>
                                                    Uso: {valueOrDash(row.uso_vehiculo)} · Ing: {valueOrDash(row.comprobacion_ingresos)}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 max-w-[200px]">
                                                <div className="flex items-start gap-1.5">
                                                    <button type="button" onClick={(e) => {
                                                        e.stopPropagation();
                                                        openSummaryViewer(row);
                                                    }} className="text-left min-w-0 flex-1">
                                                        <span className="line-clamp-2 text-xs text-slate-600">{row.resumen || "Sin resumen"}</span>
                                                    </button>
                                                    <button type="button" onClick={(e) => {
                                                        e.stopPropagation();
                                                        generarResumenInline(row);
                                                    }} disabled={!!generatingSummary[row.id_exp]} className="h-7 w-7 flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm disabled:opacity-60" title="Generar resumen">
                                                        {generatingSummary[row.id_exp] ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#131E5C]" /> : <ClipboardCheck className="h-3.5 w-3.5 text-[#131E5C]" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <button type="button" onClick={(e) => {
                                                        e.stopPropagation();
                                                        abrirAgendaCita(row);
                                                    }} className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm hover:bg-slate-50" title="Agendar cita">
                                                        <CalendarPlus className="h-4 w-4 text-[#131E5C]" />
                                                    </button>
                                                    {rowTieneChat ? (<button type="button" onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/comercial/prospectos/contacto?tel=${encodeURIComponent(row.telefono || "")}&direct=1`);
                                                    }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" title="Abrir chat">
                                                        <MessageSquareShare className="h-4 w-4" />
                                                    </button>) : null}
                                                </div>
                                            </td>
                                        </tr>);
                                    })}
                                {!loadingCases && paginatedRows.length === 0 && (<tr>
                                    <td colSpan={18} className="px-4 py-12 text-center text-slate-400">
                                        No hay resultados con esos filtros.
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                    {/* Paginación */}
                    {sorted.length > 0 && (<div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                        <div className="text-xs text-slate-500">
                            Mostrando <span className="font-semibold text-[#131E5C]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#131E5C]">{Math.min(page * PAGE_SIZE, sorted.length)}</span> de <span className="font-semibold text-[#131E5C]">{sorted.length}</span> registros
                        </div>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setPage(1)} disabled={page === 1} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/15 bg-white text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#131E5C] shadow-sm" title="Primera página">
                                <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/15 bg-white text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#131E5C] shadow-sm" title="Página anterior">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {(() => {
                                const pages = [];
                                const start = Math.max(1, page - 2);
                                const end = Math.min(totalPages, page + 2);
                                if (start > 1) { pages.push(<button key="e" disabled className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-transparent px-1 text-xs text-slate-400">...</button>); }
                                for (let i = start; i <= end; i++) { pages.push(<button key={i} type="button" onClick={() => setPage(i)} className={cls("inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border px-1 text-xs font-semibold transition shadow-sm", i === page ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-[#131E5C]/15 bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white")}>{i}</button>); }
                                if (end < totalPages) { pages.push(<button key="d" disabled className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-transparent px-1 text-xs text-slate-400">...</button>); }
                                return pages;
                            })()}
                            <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/15 bg-white text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#131E5C] shadow-sm" title="Página siguiente">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/15 bg-white text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#131E5C] shadow-sm" title="Última página">
                                <ChevronsRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>)}
                </div>
                {/* Vista móvil */}
                <div className="grid gap-3 lg:hidden">
                    {loadingCases
                        ? Array.from({ length: 6 }).map((_, i) => (<div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="mt-2 h-3 w-36" />
                            <Skeleton className="mt-3 h-3 w-full" />
                            <Skeleton className="mt-2 h-3 w-3/4" />
                        </div>))
                        : paginatedRows.map((row) => {
                            const score = calcLeadScore(row);
                            const prioridad = getPrioridad(row);
                            return (<button key={row.id_exp} onClick={() => openEdit(row)} className="rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-extrabold text-[#131E5C]">{`${row.cliente_nombre} ${row.cliente_apellidos}`.trim() || "Sin nombre"}</div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {row.agencia} · {row.fecha_reclamacion || "—"}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            {row.cliente_interes || "—"} · {row.origen || "—"}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            Eng. {formatMoneyMXN(row.enganche_monto)} · Mens. {formatMoneyMXN(row.presupuesto_mensual)}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                            Buró {valueOrDash(row.buro_estado)} · {valueOrDash(row.forma_pago)}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                        <BadgeEstado value={row.estado} />
                                        <span className={cls("text-[10px] font-bold px-2 py-0.5 rounded-full border", prioridad.cls)}>{prioridad.label}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <LeadScoreRing score={score} />
                                </div>
                            </button>);
                        })}
                    {!loadingCases && paginatedRows.length === 0 && <div className="rounded-2xl border border-black/10 bg-white p-10 text-center text-slate-400">No hay resultados con esos filtros.</div>}
                </div>
            </div>
        </div>)}

        <NuevoProspectoModal
            open={prospectoModal.open}
            mode={prospectoModal.mode}
            prospectoId={prospectoModal.prospectoId}
            estadoInicial={prospectoModal.estadoInicial}
            tieneChatInicial={prospectoModal.tieneChatInicial}
            onClose={closeProspectoModal}
            onGuardado={handleProspectoGuardado}
            onPlantillaEnviada={handlePlantillaProspectoEnviada}
            numeroAsesor={numeroAsesorActivo || numeroUsuarioSesion || ""}
            requestContext={isAdmin && selectedNumeroAsesor === "Todos" ? { todos: 1 } : numeroAsesorActivo ? { numero_asesor: numeroAsesorActivo } : {}}
            user={user}
            isAdmin={isAdmin}
        />
        <ContextMenu ctxMenu={ctxMenu} onDelete={eliminarCaso} onClose={() => setCtxMenu({ open: false, row: null })} />
        {/* Modal Resumen */}
        <Modal open={openSummaryModal} title={summaryInfo ? `Resumen IA · ${summaryInfo.nombre || `Prospecto ${summaryInfo.id_exp}`}` : "Resumen IA"} onClose={closeSummaryModal} footer={<button onClick={closeSummaryModal} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
            <X className="h-4 w-4" /> Cerrar
        </button>}>
            {summaryInfo && (<div className="grid gap-3">
                <Field label="Prospecto" icon={User}>
                    <input value={summaryInfo.nombre || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                </Field>
                <Field label="Resumen generado" icon={ClipboardCheck}>
                    <textarea value={summaryInfo.resumen || "Sin resumen disponible"} disabled rows={10} className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Última actualización" icon={CalendarDays}>
                        <input value={summaryInfo.resumen_actualizado_at ? fmtDTIntl(summaryInfo.resumen_actualizado_at) : "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                    </Field>
                    <Field label="Fuente" icon={BrainCircuit}>
                        <input value={summaryInfo.resumen_fuente || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                    </Field>
                </div>
            </div>)}
        </Modal>
        {/* Modal Agenda */}
        <Modal open={openAgendaModal} title="Agendar cita" onClose={closeAgendaModal} footer={<>
            <button onClick={closeAgendaModal} className="inline-flex items-center gap-2 rounded-2xl bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                <X className="h-4 w-4" /> Cerrar
            </button>
            <button onClick={handleAgendar} disabled={!agendaInfo || savingo} className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C] disabled:opacity-60">
                <CalendarCheck className="h-4 w-4" /> {savingo ? "Guardando..." : "Agendar"}
            </button>
        </>}>
            {agendaInfo && (<div className="grid gap-3 md:grid-cols-3">
                <Field label="Prospecto" icon={User}>
                    <input value={agendaInfo.nombre} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                </Field>
                <Field label="VW de sus sueños" icon={CarFront}>
                    <input value={agendaInfo.auto_interes || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                </Field>
                <Field label="Teléfono" icon={Phone}>
                    <input value={agendaInfo.telefono || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                </Field>
                <Field label="Fecha y Hora de cita" icon={CalendarDays}>
                    <input type="datetime-local" value={drafter.fecha_cita || ""} onChange={(e) => setDrafter((p) => ({ ...p, fecha_cita: e.target.value }))} className={cls(inputBase, inputOk)} />
                </Field>
                <Field label="Asesor Asignado" icon={UserStar}>
                    <select value={drafter.asesor_solicita || ""} onChange={(e) => setDrafter((p) => ({ ...p, asesor_solicita: e.target.value }))} className={cls(inputBase, inputOk)}>
                        <option value="">— Selecciona —</option>
                        {nombresAsesoresActivos.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Tipo de cita" icon={LayoutList}>
                    <input value="Digital" disabled className={cls(inputBase, inputOk, "cursor-not-allowed opacity-80")} />
                </Field>
                {errorMsg && <div className="md:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMsg}</div>}
            </div>)}
        </Modal>
    </div>);
}
