//volkswagen
//src/pages/Digitales/DigitalesProspectos.jsx
import { useMemo, useState, useRef, useEffect, useDeferredValue, useCallback } from "react";
import { Plus, Search, X, Save, User, Van, CarFront, CalendarDays, ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft, MessageSquareShare, Building2, FileText, FileDown, Car, Trash2, Loader2, CalendarPlus, CalendarCheck, Phone, LayoutList, UserStar, ClipboardCheck, BrainCircuit, CalendarRange, Table2, BarChart3, Clock3, AlertCircle, TrendingUp, Activity, Target, Paperclip, UploadCloud, Users, Bot, UserCheck, HandCoins, Gauge, LayoutTemplate } from "lucide-react";
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

const BRAND_BLUE = "#131E5C";
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

const ASESORES_DIGITALES = ["Lizbeth Cano Clara", "Erendira Santos Coyotzi", "Marelly Tenorio Salinas", "IA Vagen", "Edgar Omar Noguera Solis", "Dulce Abigail Garcia Olivares", "Bianca Chavez Alarcon", "Candy Denisse Marquez", "Julio Ramirez Lopez",];

const ESTADOS_PROSPECTO = ["Contactado", "Calificado", "Pendiente de Cotización", "Requiere Asesor", "Financiamiento", "Sin Respuesta", "Descalificado"];
const MOTIVOS_DESCALIFICACION = ["", "Busca trabajo", "No contesto", "Poco presupuesto", "Datos Incorrectos", "Compro en otra marca"];

const VEHICULOS = ["Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter"];

const ANIO_INICIAL = 2060;
const ANIOS_VEHICULO = Array.from({ length: 2060 - 2010 + 1 }, (_, i) => 2060 - i);


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

const NUMERO_TUXTEPEC = "522871232641";

const ASESOR_TUXTEPEC_POR_USUARIO = {
    adtuxte: "Marelly Tenorio Salinas",
    juliorl: "Julio Ramirez Lopez",
};

const ASESOR_DIGITAL_POR_NUMERO = {
    "522712638803": { asesor_digital: "IA Vagen", agencia: "VW Cordoba", etiqueta: "IA Vagen", },
    "522721111244": { asesor_digital: "Lizbeth Cano Clara", agencia: "VW Orizaba", etiqueta: "Lizbeth Cano Clara", },
    "522713133332": { asesor_digital: "Erendira Santos Coyotzi", agencia: "VW Cordoba", etiqueta: "Erendira Santos Coyotzi", },
    "522871232641": { asesor_digital: "", agencia: "VW Tuxtepec", etiqueta: "Equipo Digital Tuxtepec", },
    "527831263814": { asesor_digital: "Edgar Omar Noguera Solis", agencia: "VW Tuxpan", etiqueta: "Edgar Omar Noguera Solis", },
    "527821820706": { asesor_digital: "Dulce Abigail Garcia Olivares", agencia: "VW Poza Rica", etiqueta: "Dulce Abigail Garcia Olivares", },
    "522712837999": { asesor_digital: "Bianca Chavez Alarcon", agencia: "VW Cordoba Usados", etiqueta: "Bianca Chavez Alarcon", },
    "522721986539": { asesor_digital: "Candy Denisse Marquez", agencia: "VW Orizaba Usados", etiqueta: "Candy Denisse Marquez", },
};

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
    "Julio Ramirez Lopez",
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

const DEALERS = ["VW Cordoba", "VW Cordoba Usados", "VW Orizaba", "VW Orizaba Usados", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Automotriz R&R"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    return digits;
}

function formatTelefonoMx(tel) {
    const digits = normalizaTelefonoMx(tel);
    if (!/^52\d{10}$/.test(digits)) return tel || "Sin número";
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
    if (!text) return "";
    if (text.includes("cordoba")) return "VW Cordoba";
    if (text.includes("orizaba")) return "VW Orizaba";
    if (text.includes("poza rica")) return "VW Poza Rica";
    if (text.includes("tuxtepec")) return "VW Tuxtepec";
    if (text.includes("tuxpan")) return "VW Tuxpan";
    return raw;
}

function dealerMatchesFilter(agencia, filtro) {
    if (!filtro || filtro === "Todos") return true;
    return normalizeDealerGrupo(agencia) === normalizeDealerGrupo(filtro);
}

function tryParseJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function extraerNumerosWhatsApp(value) {
    const partes = Array.isArray(value)
        ? value
        : String(value || "").split(/[|,;\n]+/);

    return [
        ...new Set(
            partes
                .map(normalizaTelefonoMx)
                .filter((numero) =>
                    /^52\d{10}$/.test(numero)
                )
        ),
    ];
}

function getNumerosUsuarioSesion(user) {
    const numerosUsuario = extraerNumerosWhatsApp(
        user?.telefono ||
        user?.numero_asesor ||
        user?.whatsapp_number ||
        user?.phone ||
        ""
    );

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

            if (!raw) continue;

            const parsed = tryParseJson(raw);

            if (
                !parsed ||
                typeof parsed !== "object"
            ) {
                continue;
            }

            const userObj =
                parsed?.user &&
                    typeof parsed.user === "object"
                    ? parsed.user
                    : parsed;

            const numeros = extraerNumerosWhatsApp(
                userObj?.telefono ||
                userObj?.numero_asesor ||
                userObj?.whatsapp_number ||
                userObj?.phone ||
                ""
            );

            if (numeros.length) {
                return numeros;
            }
        } catch {
            // Continúa con la siguiente fuente.
        }
    }

    return [];
}

function getUsuarioCrm(user) {
    return normalizeText(user?.usuario || user?.username || user?.user || user?.nombre_usuario || "");
}

function getAsesorDigitalPorNumero(numero, user = null) {
    const numeroNormalizado = normalizaTelefonoMx(numero);

    if (numeroNormalizado === NUMERO_TUXTEPEC) {
        const usuario = getUsuarioCrm(user);

        return (ASESOR_TUXTEPEC_POR_USUARIO[usuario] || "");
    }

    return (ASESOR_DIGITAL_POR_NUMERO[numeroNormalizado]?.asesor_digital || "");
}

function getEtiquetaDigitalPorNumero(numero) {
    const numeroNormalizado = normalizaTelefonoMx(numero);

    const configuracion = ASESOR_DIGITAL_POR_NUMERO[numeroNormalizado];

    return (configuracion?.etiqueta || configuracion?.asesor_digital || "");
}

function getContextoDigitalPorNumero(numero, user = null) {
    const numeroNormalizado = normalizaTelefonoMx(numero);

    const configuracion = ASESOR_DIGITAL_POR_NUMERO[numeroNormalizado];

    if (!configuracion) {
        return null;
    }

    return {
        ...configuracion, asesor_digital: getAsesorDigitalPorNumero(numeroNormalizado, user),
    };
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull).trim();
    if (!s) return "";
    return s;
}

function toDTLocalInput(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;
    if (s.includes("T")) return s.slice(0, 16);
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

    const mxMatch = raw.match(
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/
    );

    if (mxMatch) {
        const day = mxMatch[1].padStart(2, "0");
        const month = mxMatch[2].padStart(2, "0");
        const year = mxMatch[3];

        return `${year}-${month}-${day}`;
    }

    if (/^\d+$/.test(raw)) {
        const numericValue = Number(raw);

        const timestamp =
            raw.length <= 10
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
        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {
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
    if (!parts.length) return { nombre: "", apellidos: "" };
    if (parts.length === 1) return { nombre: parts[0], apellidos: "" };
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
    if (!draft) return "";
    const nombreCompleto = String(draft.nombre_cliente || "").trim();
    if (nombreCompleto) return nombreCompleto;
    return joinNombre(draft.cliente_nombre, draft.cliente_apellidos);
}

function normalizeDateForFilter(value) {
    return onlyDate(value);
}

function isDateInRange(value, desde, hasta) {
    if (!desde && !hasta) return true;
    const dateValue = normalizeDateForFilter(value);
    if (!dateValue) return false;
    if (desde && dateValue < desde) return false;
    if (hasta && dateValue > hasta) return false;
    return true;
}

function getSortValue(row, key) {
    if (["fecha_reclamacion", "fecha_contacto"].includes(key)) return onlyDate(row?.[key] || "");
    if (["ultimo_contacto_at", "primer_contacto_at", "creado", "resumen_actualizado_at"].includes(key)) return toDTLocal(row?.[key] || "");
    return String(row?.[key] ?? "").toLowerCase();
}

function normalizeProspecto(p) {
    const nombreCompleto =
        p.nombre ||
        p.nombre_out ||

        p.cliente?.nombre ||

        "";

    const { nombre, apellidos } = splitNombre(nombreCompleto);

    const fechaRegistro = getFirstValidDate(
        p.creado,
        p.created_at,
        p.fecha_creacion,
        p.creado_en,
        p.fecha_reclamacion,
        p.primer_mensaje_cliente,
        p.primer_contacto_at,
        p.ultimo_contacto_asesor,
        p.ultimo_contacto_at,
        p.resumen_actualizado_at
    );

    const fechaCreacionRaw = fechaRegistro.raw;
    const fechaCreacion = fechaRegistro.ymd;

    return {
        id_exp: p.id,
        cliente_id: p.cliente_id,

        agencia: p.agencia || "",

        cliente_nombre: nombre,
        cliente_apellidos: apellidos,

        telefono: String(
            p.telefono ||
            p.telefono_out ||
            p.cliente?.telefono ||
            ""
        ),

        correo:
            p.correo ||
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

        resumen_actualizado_at: toDTLocalInput(
            p.resumen_actualizado_at
        ),

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

        fecha_atencion:
            onlyDate(
                p.primer_mensaje_cliente ||
                p.primer_contacto_at
            ) || fechaCreacion,

        fecha_contacto: onlyDate(
            p.ultimo_contacto_asesor ||
            p.ultimo_contacto_at
        ),

        requiere_asesor: Boolean(p.requiere_asesor),
        motivo_requiere_asesor:
            p.motivo_requiere_asesor || "",

        cotizacion_pendiente: Boolean(
            p.cotizacion_pendiente
        ),

        cotizacion_solicitada_at: toDTLocalInput(
            p.cotizacion_solicitada_at
        ),

        enganche_monto: p.enganche_monto || "",
        presupuesto_mensual: p.presupuesto_mensual || "",
        buro_estado: p.buro_estado || "",
        forma_pago: p.forma_pago || "",
        tipo_cliente: p.tipo_cliente || "",
        uso_vehiculo: p.uso_vehiculo || "",
        plazo_compra: p.plazo_compra || "",
        comprobacion_ingresos:
            p.comprobacion_ingresos || "",

        ia_pausada: Boolean(p.ia_pausada),
        ia_pausada_motivo: p.ia_pausada_motivo || "",

        ultima_cita_agendada: toDTLocalInput(
            p.ultima_cita_agendada
        ),

        asistencia: Boolean(p.asistencia),

        id_cotizacion: p.id_cotizacion || "",
        folio_solicitud_credito:
            p.folio_solicitud_credito || "",

        solicitud_credito_estado:
            p.solicitud_credito_estado || "",

        vin_facturado: p.vin_facturado || "",
        vin_estatus_entrega:
            p.vin_estatus_entrega || "",
    };
}

function toNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    const num = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) && num > 0 ? num : 0;
}

function toNullableNumber(value) {
    const num = toNumber(value);
    return num > 0 ? Math.round(num) : null;
}

function formatMoneyMXN(value) {
    const num = toNumber(value);
    if (!num) return "—";
    return num.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    });
}

function labelFromKey(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
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
    if (!amount) return "Sin dato";
    if (type === "mensual") {
        if (amount <= 5000) return "$1 - $5k";
        if (amount <= 8000) return "$5k - $8k";
        if (amount <= 12000) return "$8k - $12k";
        if (amount <= 18000) return "$12k - $18k";
        return ">$18k";
    }
    if (amount <= 50000) return "$1 - $50k";
    if (amount <= 100000) return "$50k - $100k";
    if (amount <= 200000) return "$100k - $200k";
    return ">$200k";
}

function countBy(rows, getter, { limit = null, includeEmpty = false, emptyLabel = "Sin dato" } = {}) {
    const map = new Map();
    for (const row of rows) {
        const raw = typeof getter === "function" ? getter(row) : row?.[getter];
        const key = String(raw || "").trim();
        if (!key && !includeEmpty) continue;
        const label = key ? valueOrDash(key) : emptyLabel;
        map.set(label, (map.get(label) || 0) + 1);
    }
    const result = Array.from(map.entries()).sort(([, a], [, b]) => b - a);
    return limit ? result.slice(0, limit) : result;
}

function avgPositive(rows, field) {
    const values = rows.map((row) => toNumber(row[field])).filter(Boolean);
    if (!values.length) return 0;
    return Math.round(values.reduce((acc, item) => acc + item, 0) / values.length);
}

function percent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
}

function formatDateYMDLocal(date) {
    const y = date.getFullYear(),
        m = String(date.getMonth() + 1).padStart(2, "0"),
        d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function addDays(date, days) {
    const c = new Date(date);
    c.setDate(c.getDate() + days);
    return c;
}

function getStartOfWeek(date) {
    const c = new Date(date),
        day = c.getDay(),
        diff = day === 0 ? -6 : 1 - day;
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
    if (!interes) return 0;
    const match = Object.entries(PRECIO_REFERENCIA_VW).find(([modelo]) => interes.includes(normalizeText(modelo)));
    return match ? match[1] : 450000;
}

function getEngancheMinimoEstimado(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    if (!precio) return 0;
    return Math.round(precio * ENGANCHE_MINIMO_PCT);
}

function getMensualidadMinimaEstimada(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    const enganche = toNumber(row.enganche_monto);
    if (!precio) return 0;
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
    if (row.cliente_interes) score += 8;
    else score -= 5;
    // Estado comercial
    if (estado === "calificado") score += 12;
    else if (estado === "pendiente de cotizacion" || estado === "pendiente de cotización") score += 9;
    else if (estado === "financiamiento") score += 8;
    else if (estado === "contactado") score += 4;
    else if (estado === "sin respuesta") score -= 14;
    else if (estado === "descalificado") score -= 40;
    // Enganche contra mínimo estimado del 20%
    if (esCredito) {
        if (!perfil.enganche) {
            score -= 10;
        } else if (perfil.ratioEnganche >= 1) {
            score += 24;
        } else if (perfil.ratioEnganche >= 0.75) {
            score += 15;
        } else if (perfil.ratioEnganche >= 0.5) {
            score += 7;
        } else if (perfil.ratioEnganche >= 0.25) {
            score -= 4;
        } else {
            score -= 18;
        }
    }
    // Mensualidad contra estimado aproximado
    if (esCredito) {
        if (!perfil.mensualidad) {
            score -= 6;
        } else if (perfil.mensualidadMinima && perfil.mensualidad >= perfil.mensualidadMinima) {
            score += 14;
        } else if (perfil.mensualidadMinima && perfil.mensualidad >= perfil.mensualidadMinima * 0.75) {
            score += 6;
        } else {
            score -= 8;
        }
    }
    // Buró
    if (buro === "bueno") score += 14;
    else if (buro === "regular") score += 5;
    else if (buro === "iniciando") score -= 10;
    else if (buro === "desconocido" || !buro) score -= 6;
    // Forma de pago
    if (formaPago === "contado") score += 18;
    else if (formaPago === "credito") score += 5;
    else if (formaPago === "arrendamiento") score += 6;
    else score -= 3;
    // Perfil de compra
    if (plazo === "inmediato") score += 10;
    else if (plazo === "esta semana") score += 8;
    else if (plazo === "este mes") score += 5;
    else if (plazo === "1 a 3 meses") score += 2;
    else if (plazo === "mas de 6 meses" || plazo === "más de 6 meses") score -= 6;
    if (row.comprobacion_ingresos) score += 6;
    if (row.tipo_cliente) score += 2;
    if (row.asesor_solicita) score += 6;
    else score -= 4;
    // Actividad reciente, pero ya no debe inflar demasiado
    if (row.ultimo_contacto_at) {
        const h = (Date.now() - new Date(row.ultimo_contacto_at).getTime()) / 36e5;
        if (h < 2) score += 6;
        else if (h < 24) score += 4;
        else if (h < 72) score += 2;
        else if (h > 168) score -= 6;
    }
    if (row.cotizacion_pendiente) score += 5;
    if (row.requiere_asesor) score += 4;
    if (row.ia_pausada) score -= 5;
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
    if (score >= 80) return { label: "Muy alto", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 60) return { label: "Alto", cls: "text-amber-700 bg-amber-50 border-amber-200" };
    if (score >= 35) return { label: "Medio", cls: "text-sky-700 bg-sky-50 border-sky-200" };
    return { label: "Bajo", cls: "text-slate-500 bg-slate-50 border-slate-200" };
}

function getPrioridad(row) {
    const e = String(row.estado || "").toLowerCase();
    const h = row.ultimo_contacto_at ? (Date.now() - new Date(row.ultimo_contacto_at).getTime()) / 36e5 : 999;
    if (e === "sin respuesta" && h > 24) return { label: "Urgente", cls: "bg-red-100 text-red-800 border-red-300" };
    if (row.cotizacion_pendiente || row.requiere_asesor) return { label: "Alta", cls: "bg-orange-100 text-orange-800 border-orange-300" };
    if (e === "calificado") return { label: "Alta", cls: "bg-orange-100 text-orange-800 border-orange-300" };
    if (h < 6) return { label: "Media", cls: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Normal", cls: "bg-slate-100 text-slate-600 border-slate-300" };
}

function getListItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function getTemplateComponentType(component = {}) {
    return String(component.type || "").toLowerCase();
}

function replaceMetaVariables(text, componentType, values) {
    return String(text || "").replace(/\{\{(\d+)\}\}/g, (_, index) => String(values?.[`${componentType}_${index}`] ?? "").trim());
}

function interpolateNumberedText(text, fields, values) {
    const fieldValues = (fields || []).map((field) => String(values?.[field.key] || "").trim());
    return String(text || "").replace(/\((\d+)\)/g, (_, index) => fieldValues[Number(index) - 1] || "");
}

function buildTemplatePreviewText(template, values) {
    if (!template) return "";
    const components = Array.isArray(template.components_meta) ? template.components_meta : [];
    const textFromComponents = components
        .filter((component) => {
            const type = getTemplateComponentType(component);
            return ["header", "body", "footer"].includes(type) && String(component.text || "").trim();
        })
        .map((component) => replaceMetaVariables(component.text, getTemplateComponentType(component), values))
        .filter(Boolean)
        .join("\n");
    if (textFromComponents) {
        return textFromComponents;
    }
    return interpolateNumberedText(template.help || "", template.fields || [], values);
}

function getTemplateFieldOptions(field) {
    if (Array.isArray(field?.options) && field.options.length) {
        return field.options;
    }
    const label = normalizeText(field?.label);
    const key = normalizeText(field?.key);
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) {
        return DEALERS;
    }
    if (label.includes("canal") || key.includes("canal")) {
        return Object.keys(origenMeta);
    }
    return [];
}

function getDefaultTemplateFieldValue(field, context) {
    const label = normalizeText(field?.label);
    const key = normalizeText(field?.key);
    if (label.includes("asesor") || key.includes("asesor") || label.includes("quien eres")) {
        return context.asesor || "";
    }
    if (label.includes("nombre") || label.includes("prospecto") || label.includes("cliente") || key.includes("nombre")) {
        return context.nombre || "";
    }
    if (label.includes("dealer") || label.includes("agencia") || key.includes("dealer") || key.includes("agencia")) {
        return context.agencia || "";
    }
    if (label.includes("modelo") || label.includes("auto") || label.includes("vehiculo") || key.includes("modelo") || key.includes("auto")) {
        return context.modelo || "";
    }
    if (label.includes("canal") || key.includes("canal")) {
        return context.canal || "";
    }
    if (label.includes("tema") || key.includes("tema")) {
        return context.tema || "";
    }
    if (label.includes("dato") || key.includes("dato")) {
        return context.dato || "";
    }
    return "";
}

function buildDynamicTemplateComponents(template, values) {
    const fields = Array.isArray(template?.fields) ? template.fields : [];
    const groupedFields = fields.reduce((accumulator, field) => {
        const component = String(field.component || "body").toLowerCase();
        if (!accumulator[component]) {
            accumulator[component] = [];
        }
        accumulator[component].push(field);
        return accumulator;
    }, {});
    return Object.entries(groupedFields)
        .map(([type, componentFields]) => ({
            type,
            parameters: componentFields
                .sort((a, b) => Number(a.index || 0) - Number(b.index || 0))
                .map((field) => ({
                    type: "text",
                    text: String(values?.[field.key] || "").trim(),
                })),
        }))
        .filter((component) => component.parameters.length > 0);
}

// ─── UI Utilities ─────────────────────────────────────────────────────────────

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function badgeCls(value) {
    const map = {
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        calificado: "bg-violet-500/15 text-violet-800 border-violet-300/25",
        "pendiente de cotización": "bg-amber-500/20 text-amber-900 border-amber-300/40",
        "requiere asesor": "bg-orange-500/20 text-orange-900 border-orange-300/40",
        financiamiento: "bg-sky-500/15 text-sky-800 border-sky-300/30",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
        descalificado: "bg-slate-500/15 text-slate-700 border-slate-300/25",
    };
    return (
        map[
        String(value || "")
            .trim()
            .toLowerCase()
        ] || "bg-black/10 text-[#131E5C] border-black/10"
    );
}

function Skeleton({ className = "" }) {
    return <div className={cls("animate-pulse rounded-md bg-black/10", className)} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[32, 40, 28, 28, 20].map((w, i) => (
                <td key={i} className="px-4 py-3">
                    <div className={`h-4 w-${w} rounded bg-slate-200/60`} />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
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

function BadgeEstado({ value }) {
    const map = {
        descalificado: "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
    };
    const key = String(value || "")
        .trim()
        .toLowerCase();
    const c = map[key] || "bg-black/10 text-[#131E5C] border-black/10";
    return <span className={cls("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", c)}>{value || "Sin estado"}</span>;
}

function LeadScoreRing({ score }) {
    const { label, cls: labelCls } = getScoreLabel(score);
    const radius = 18,
        circ = 2 * Math.PI * radius;
    const pct = score / 100;
    const color = score >= 75 ? "#059669" : score >= 50 ? "#d97706" : score >= 30 ? "#0284c7" : "#94a3b8";
    return (
        <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 flex-shrink-0">
                <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                    <circle cx="22" cy="22" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#131E5C]">{score}</span>
            </div>
            <span className={cls("text-xs font-semibold px-2 py-0.5 rounded-full border", labelCls)}>{label}</span>
        </div>
    );
}


// ─── Vista Gráficos ────────────────────────────────────────────────────────────
function VistaGraficos({ rows }) {
    const totalProspectos = rows.length;
    const totalSeguro = totalProspectos || 1;
    const palette = ["#131E5C", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6366f1", "#14b8a6"];
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
                if (!isNaN(f.getTime())) map[diasSemana[f.getDay()]]++;
            }
        }
        const order = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        return Object.entries(map)
            .filter(([, c]) => c > 0)
            .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
    }, [rows]);
    const statsPorHora = useMemo(() => {
        const map = {};
        for (let i = 0; i < 24; i++) map[`${String(i).padStart(2, "0")}:00`] = 0;
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
    const perfilCaptura = useMemo(
        () => [
            ["Enganche", rows.filter((r) => toNumber(r.enganche_monto)).length],
            ["Presupuesto mensual", rows.filter((r) => toNumber(r.presupuesto_mensual)).length],
            ["Buró", rows.filter((r) => r.buro_estado).length],
            ["Forma de pago", rows.filter((r) => r.forma_pago).length],
            ["Tipo de cliente", rows.filter((r) => r.tipo_cliente).length],
            ["Uso del vehículo", rows.filter((r) => r.uso_vehiculo).length],
            ["Plazo de compra", rows.filter((r) => r.plazo_compra).length],
            ["Comprobación ingresos", rows.filter((r) => r.comprobacion_ingresos).length],
        ],
        [rows],
    );
    const matrizBuroPago = useMemo(() => {
        const formas = ["credito", "contado", "arrendamiento", "desconocido", "Sin dato"];
        const buros = ["bueno", "regular", "iniciando", "desconocido", "Sin dato"];
        const rowsMatriz = formas
            .map((forma) => {
                const cells = buros.map(
                    (buro) =>
                        rows.filter((row) => {
                            const formaRow = row.forma_pago || "Sin dato";
                            const buroRow = row.buro_estado || "Sin dato";
                            return normalizeText(formaRow) === normalizeText(forma) && normalizeText(buroRow) === normalizeText(buro);
                        }).length,
                );
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
        return (
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
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
            </div>
        );
    }
    function BarGroup({ title, data, icon: Icon, colorIndex = 0, total = totalSeguro, maxItems = null }) {
        const visibleData = maxItems ? data.slice(0, maxItems) : data;
        const max = Math.max(...visibleData.map(([, count]) => count), 1);
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">{data.reduce((acc, [, n]) => acc + n, 0)}</span>
                </div>
                <div className="space-y-3 p-5 max-h-[320px] overflow-y-auto">
                    {visibleData.map(([label, count], i) => (
                        <div key={`${title}-${label}`}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[#131E5C]">
                                <span className="truncate" title={label}>
                                    {label}
                                </span>
                                <span className="shrink-0 text-slate-500">
                                    {count} · {percent(count, total)}%
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.round((count / max) * 100)}%`, background: palette[(colorIndex + i) % palette.length] }} />
                            </div>
                        </div>
                    ))}
                    {visibleData.length === 0 && <p className="text-center text-sm text-slate-400">Sin datos</p>}
                </div>
            </div>
        );
    }
    function CaptureCard({ title, data, icon: Icon }) {
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">calidad datos</span>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-2">
                    {data.map(([label, count], i) => (
                        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#131E5C]">
                                <span>{label}</span>
                                <span>{percent(count, totalSeguro)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full rounded-full" style={{ width: `${percent(count, totalSeguro)}%`, background: palette[i % palette.length] }} />
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-400">
                                {count} de {totalProspectos} prospectos
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    function MatrixCard() {
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Target className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">Cruce buró vs forma de pago</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">riesgo financiero</span>
                </div>
                <div className="overflow-x-auto p-5">
                    <table className="min-w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400">
                                <th className="px-3 py-2 font-black">Forma de pago</th>
                                {matrizBuroPago.buros.map((buro) => (
                                    <th key={buro} className="px-3 py-2 text-center font-black">
                                        {valueOrDash(buro)}
                                    </th>
                                ))}
                                <th className="px-3 py-2 text-center font-black">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matrizBuroPago.rowsMatriz.map(({ forma, cells, total }) => (
                                <tr key={forma}>
                                    <td className="px-3 py-3 font-bold text-[#131E5C]">{valueOrDash(forma)}</td>
                                    {cells.map((count, index) => (
                                        <td key={`${forma}-${matrizBuroPago.buros[index]}`} className="px-3 py-3 text-center font-semibold text-slate-600">
                                            {count}
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 text-center font-black text-[#131E5C]">{total}</td>
                                </tr>
                            ))}
                            {matrizBuroPago.rowsMatriz.length === 0 && (
                                <tr>
                                    <td colSpan={matrizBuroPago.buros.length + 2} className="px-3 py-8 text-center text-slate-400">
                                        Sin datos para mostrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    return (
        <div className="grid gap-4">
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
                    <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
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
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[250]">
            <div className="absolute inset-0 bg-black/45" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
                <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-xl">
                    <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
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
        </div>,
        document.body,
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="h-full rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{label}</span>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function LineaPicker({ value, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(lineaMeta).map(([key, meta]) => {
                const active = value === key;
                const Icon = meta.Icon;
                return (
                    <button key={key} type="button" onClick={() => onChange(key)} className={cls("flex h-14 w-full items-center justify-center gap-2 rounded-xl border px-4 transition", active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/20" : "border-black/10 bg-neutral-50 hover:bg-white")}>
                        <span className={cls("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white")}>
                            <Icon className="h-4 w-4 text-[#131E5C]" />
                        </span>
                        <span className="truncate text-sm font-semibold text-[#131E5C]">{meta.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function OrigenPicker({ value, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {Object.entries(origenMeta).map(([key, meta]) => {
                const active = value === key;
                const Icon = meta.Icon;
                return (
                    <button type="button" key={key} onClick={() => onChange(key)} className={cls("flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition", active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/20" : "border-black/10 bg-neutral-50 hover:bg-white")}>
                        <div className={cls("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white")}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[#131E5C]">{meta.label}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function EvidenceCard({ item, onRemove }) {
    const isImage = item.type?.startsWith("image/") || !!item.previewUrl;
    const isExistente = !!item.id;
    const url = item.previewUrl || item.url || null;
    const sizeKB = item.size ? Math.round(item.size / 1024) : null;
    return (
        <div className="relative flex items-start gap-3 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-slate-100 flex items-center justify-center">{isImage && url ? <img src={url} alt={item.name} className="h-full w-full object-cover" /> : <Paperclip className="h-6 w-6 text-slate-400" />}</div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[#131E5C]" title={item.name}>
                    {item.name || "Archivo"}
                </div>
                {sizeKB && <div className="mt-0.5 text-[11px] text-slate-400">{sizeKB < 1024 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`}</div>}
                {isExistente && url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline">
                        Ver archivo
                    </a>
                )}
                {!isExistente && <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Nueva</span>}
            </div>
            <button type="button" onClick={onRemove} className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100" title="Quitar">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body,
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DigitalesProspectos() {
    const navigate = useNavigate();
    const { user, ready } = useAuth();
    const [cases, setCases] = useState([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [viewMode, setViewMode] = useState("tabla");
    const [highlightedRow, setHighlightedRow] = useState(null);
    const fileInputRef = useRef(null);
    const templatesDropdownRef = useRef(null);
    const ultimoPayloadGuardadoRef = useRef("");
    const ultimoProspectoGuardadoIdRef = useRef(null);
    const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
    const [tplSelected, setTplSelected] = useState(null);
    const [tplDraft, setTplDraft] = useState({});
    const [templatesDisponibles, setTemplatesDisponibles] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templatesError, setTemplatesError] = useState("");
    const [sendingTemplate, setSendingTemplate] = useState(false);
    const [telefonosConChat, setTelefonosConChat] = useState(() => new Set());
    const VIEW_MODES = [
        { key: "tabla", label: "Tabla", Icon: Table2 },
        { key: "graficos", label: "Gráficos", Icon: BarChart3 },
    ];
    const rolUsuario = useMemo(
        () =>
            normalizeText(
                user?.rol?.nombre ||
                user?.rol?.name ||
                user?.rol ||
                ""
            ),
        [user]
    );

    const isAdmin = useMemo(() => {
        const permisos = Array.isArray(user?.permisos)
            ? user.permisos
            : [];

        return (
            rolUsuario === "administrador" ||
            rolUsuario === "admin" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [rolUsuario, user?.permisos]);

    const isCoordinador = useMemo(() => {
        const permisos = Array.isArray(user?.permisos)
            ? user.permisos
            : [];

        return (
            rolUsuario === "coordinador digital" ||
            permisos.includes("CRM_COORDINADOR_DIGITAL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [rolUsuario, user?.permisos]);
    const userAgencias = useMemo(
        () =>
            String(user?.agencia || "")
                .split("|")
                .map((a) => a.trim())
                .filter(Boolean),
        [user?.agencia],
    );
    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            const agencia = normalizeDealerGrupo(agenciaRegistro);
            if (!agencia) return false;
            return userAgencias.some((a) => normalizeDealerGrupo(a) === agencia);
        },
        [userAgencias],
    );

    const numerosUsuarioSesion = useMemo(
        () => getNumerosUsuarioSesion(user),
        [user]
    );

    const numeroUsuarioSesion =
        numerosUsuarioSesion[0] || "";
    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [pautasMeta, setPautasMeta] = useState([]);
    const [loadingPautas, setLoadingPautas] = useState(false);
    const [updatingEstado, setUpdatingEstado] = useState({});
    const [generatingSummary, setGeneratingSummary] = useState({});
    const [openSummaryModal, setOpenSummaryModal] = useState(false);
    const [summaryInfo, setSummaryInfo] = useState(null);
    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [
        selectedNumeroAsesor,
        setSelectedNumeroAsesor,
    ] = useState("");
    const numeroAsesorActivo = useMemo(() => {
        if (
            selectedNumeroAsesor &&
            selectedNumeroAsesor !== "Todos"
        ) {
            return normalizaTelefonoMx(
                selectedNumeroAsesor
            );
        }

        return "";
    }, [selectedNumeroAsesor]);

    const contextoDigitalSesion = useMemo(() => {
        const numeroContexto =
            numeroAsesorActivo ||
            numeroUsuarioSesion;

        return getContextoDigitalPorNumero(
            numeroContexto,
            user
        );
    }, [
        numeroAsesorActivo,
        numeroUsuarioSesion,
        user,
    ]);

    const deferredQ = useDeferredValue(filters.q);
    const [page, setPage] = useState(1);
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingCases, setLoadingCases] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);
    const [openAgendaModal, setOpenAgendaModal] = useState(false);
    const [agendaInfo, setAgendaInfo] = useState(null);
    const [drafter, setDrafter] = useState({ agencia: "", fecha_cita: "", asesor_digital: "", asesor_solicita: "", tipo_cita: "" });
    const [savingo, setSavingo] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const totalEvidenciasDraft = (draft?.evidencias_existentes?.length || 0) + (draft?.evidencias_nuevas?.length || 0);
    useEffect(() => {
        const cerrar = () => setCtxMenu((prev) => (prev.open ? { open: false, x: 0, y: 0, row: null } : prev));
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
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    };
    const eliminarCaso = async (row) => {
        if (!row?.id_exp) return;
        if (!confirm(`¿Eliminar el prospecto ${row.id_exp}? Esta acción no se puede deshacer.`)) return;
        try {
            await api.digitalesDeleteProspecto(
                row.id_exp,
                {
                    numero_asesor:
                        numeroAsesorActivo ||
                        numeroUsuarioSesion ||
                        "",
                }
            );
            setCases((prev) => prev.filter((c) => c.id_exp !== row.id_exp));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            console.error(e);
            alert("No se pudo eliminar (revisa consola / backend).");
        }
    };
    const REQUIRED = useMemo(() => ({ telefono: "Teléfono" }), []);
    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft, REQUIRED]);
    const isInvalid = (key) => touchedSave && missing.includes(key);
    const telDigits = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);
    const cargarTelefonosConChat = useCallback(async () => {
        const numeroLinea =
            numeroAsesorActivo ||
            numeroUsuarioSesion ||
            "";

        if (!numeroLinea) {
            setTelefonosConChat(new Set());
            return;
        }

        try {
            const response = await api.digitalesChats({
                numero_asesor: numeroLinea,
            });

            const chats = Array.isArray(response)
                ? response
                : Array.isArray(response?.results)
                    ? response.results
                    : [];

            const telefonos = new Set(
                chats
                    .map((chat) =>
                        normalizaTelefonoMx(
                            chat?.telefono
                        )
                    )
                    .filter(Boolean)
            );

            setTelefonosConChat(telefonos);
        } catch (error) {
            console.error(
                "No se pudieron cargar los teléfonos con chat:",
                error
            );
            setTelefonosConChat(new Set());
        }
    }, [
        numeroAsesorActivo,
        numeroUsuarioSesion,
    ]);
    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);
    const telInvalid = !!telError;
    const telefonoDraft = useMemo(() => normalizaTelefonoMx(draft?.telefono), [draft?.telefono]);
    const templatePreview = useMemo(() => (tplSelected ? buildTemplatePreviewText(tplSelected, tplDraft) : ""), [tplSelected, tplDraft]);
    const puedeAbrirPlantillas = Boolean(ready && numeroUsuarioSesion && draft && telIsOk && !telInvalid && !saving && !sendingTemplate);
    const draftTieneChat = Boolean(telefonoDraft && telefonosConChat.has(telefonoDraft));
    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm text-[#131E5C] font-semibold outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";
    const filterControlCls = "h-9 w-full rounded-lg border border-[#131E5C] bg-white px-3 text-sm text-[#131E5C] shadow-sm outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15";
    const filterLabelCls = "mb-1.5 block text-xs font-bold text-[#131E5C]";
    const cargarProspectosPorLinea =
        useCallback(async () => {
            if (!ready) {
                return;
            }

            if (
                !isAdmin &&
                !numeroAsesorActivo
            ) {
                setCases([]);
                return;
            }

            if (
                !isAdmin &&
                !numerosUsuarioSesion.includes(
                    numeroAsesorActivo
                )
            ) {
                setCases([]);
                return;
            }

            setLoadingCases(true);

            try {
                /*
                 * El backend trabaja por línea.
                 * Cuando el administrador selecciona "Todos",
                 * consultamos cada línea y unificamos por expediente.
                 */
                const numerosAConsultar =
                    isAdmin &&
                        selectedNumeroAsesor === "Todos"
                        ? Object.keys(
                            ASESOR_DIGITAL_POR_NUMERO
                        )
                        : [
                            numeroAsesorActivo ||
                            numeroUsuarioSesion,
                        ].filter(Boolean);

                const respuestas =
                    await Promise.allSettled(
                        numerosAConsultar.map(
                            (numero) =>
                                api.digitalesListProspectos({
                                    numero_asesor:
                                        numero,
                                })
                        )
                    );

                const registrosPorId = new Map();

                respuestas.forEach(
                    (resultado, index) => {
                        if (
                            resultado.status !==
                            "fulfilled"
                        ) {
                            console.error(
                                "No se pudo cargar la línea:",
                                numerosAConsultar[index],
                                resultado.reason
                            );
                            return;
                        }

                        getListItems(
                            resultado.value
                        )
                            .map(normalizeProspecto)
                            .forEach((registro) => {
                                if (
                                    registro?.id_exp !==
                                    null &&
                                    registro?.id_exp !==
                                    undefined
                                ) {
                                    registrosPorId.set(
                                        registro.id_exp,
                                        registro
                                    );
                                }
                            });
                    }
                );

                setCases(
                    Array.from(
                        registrosPorId.values()
                    )
                );
                setPage(1);

            } catch (error) {
                console.error(
                    "Error cargando prospectos por línea:",
                    error
                );

                setCases([]);
            } finally {
                setLoadingCases(false);
            }
        }, [
            ready,
            isAdmin,
            selectedNumeroAsesor,
            numeroAsesorActivo,
            numeroUsuarioSesion,
            numerosUsuarioSesion,
        ]);

    useEffect(() => {
        cargarProspectosPorLinea();
    }, [cargarProspectosPorLinea]);
    useEffect(() => {
        if (!openModal || pautasMeta.length) return;
        (async () => {
            setLoadingPautas(true);
            try {
                const res = await api.digitalesCampanasMeta(30);
                setPautasMeta(Array.isArray(res?.items) ? res.items : []);
            } catch (e) {
                console.error(e);
                setPautasMeta([]);
            } finally {
                setLoadingPautas(false);
            }
        })();
    }, [openModal, pautasMeta.length]);
    useEffect(() => {
        if (!ready) return;

        if (isAdmin) {
            setSelectedNumeroAsesor(
                (current) =>
                    current || "Todos"
            );

            return;
        }

        if (!numerosUsuarioSesion.length) {
            setSelectedNumeroAsesor("");
            return;
        }

        setSelectedNumeroAsesor(
            (current) => {
                const normalizado =
                    normalizaTelefonoMx(current);

                if (
                    normalizado &&
                    numerosUsuarioSesion.includes(
                        normalizado
                    )
                ) {
                    return normalizado;
                }

                return numerosUsuarioSesion[0];
            }
        );
    }, [
        ready,
        isAdmin,
        numerosUsuarioSesion,
    ]);
    useEffect(() => {
        if (
            !ready ||
            !(
                numeroAsesorActivo ||
                numeroUsuarioSesion
            )
        ) {
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
        if (
            isAdmin &&
            selectedNumeroAsesor === "Todos"
        ) {
            return null;
        }

        const numeroFiltro =
            numeroAsesorActivo ||
            numeroUsuarioSesion;

        return (
            ASESOR_DIGITAL_POR_NUMERO[
            normalizaTelefonoMx(
                numeroFiltro
            )
            ] ||
            null
        );
    }, [
        isAdmin,
        selectedNumeroAsesor,
        numeroAsesorActivo,
        numeroUsuarioSesion,
    ]);

    const dealers = useMemo(() => {
        const ordenDealers = [
            "VW Cordoba",
            "VW Orizaba",
            "VW Poza Rica",
            "VW Tuxtepec",
            "VW Tuxpan",
        ];

        const agenciasPorNumero =
            numerosUsuarioSesion
                .map(
                    (numero) =>
                        ASESOR_DIGITAL_POR_NUMERO[
                            normalizaTelefonoMx(
                                numero
                            )
                        ]?.agencia ||
                        ""
                )
                .filter(Boolean);

        const source = isAdmin
            ? DEALERS
            : [
                ...userAgencias,
                ...agenciasPorNumero,
            ];

        const grupos = new Set(
            source
                .map(normalizeDealerGrupo)
                .filter(Boolean)
        );

        const ordenados =
            ordenDealers.filter(
                (dealer) =>
                    grupos.has(dealer)
            );

        const extras = Array.from(grupos)
            .filter(
                (dealer) =>
                    !ordenDealers.includes(
                        dealer
                    )
            )
            .sort((a, b) =>
                a.localeCompare(b, "es")
            );

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
        if (isAdmin) {
            const numeros = Object.keys(
                ASESOR_DIGITAL_POR_NUMERO
            ).sort(
                (a, b) =>
                    a.localeCompare(b, "es")
            );

            return [
                "Todos",
                ...numeros,
            ];
        }

        if (isCoordinador) {
            return numerosUsuarioSesion;
        }

        return numerosUsuarioSesion.slice(0, 1);
    }, [
        isAdmin,
        isCoordinador,
        numerosUsuarioSesion,
    ]);
    function toggleSort(key) {
        setSort((prev) => (prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" }));
    }
    function resetPlantillasModal() {
        setShowTemplatesDropdown(false);
        setTplSelected(null);
        setTplDraft({});
        setTemplatesError("");
    }
    function resetCacheProspectoGuardado() {
        ultimoPayloadGuardadoRef.current = "";
        ultimoProspectoGuardadoIdRef.current = null;
    }
    const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
    const baseFiltered = useMemo(() => {
        const q = deferredQ.trim().toLowerCase();
        return cases.filter((c) => {
            const nombre = `${c.cliente_nombre || ""} ${c.cliente_apellidos || ""}`.trim();
            if (
                !isAdmin &&
                userAgencias.length > 0 &&
                !userTieneAgencia(c.agencia)
            ) {
                return false;
            }
            if (
                filtroNumeroActivo &&
                normalizeText(c.agencia) !==
                normalizeText(
                    filtroNumeroActivo.agencia
                )
            ) {
                return false;
            }

            if (
                !filtroNumeroActivo &&
                !isAdmin
            ) {
                return false;
            }
            const matchQ =
                !q ||
                [c.id_exp, c.cliente_id, c.agencia, nombre, c.comentarios, c.estado, c.telefono, c.correo, c.asesor_digital, c.asesor_solicita, c.linea, c.origen, c.cliente_interes, c.pauta, c.enganche_monto, c.presupuesto_mensual, c.buro_estado, c.forma_pago, c.tipo_cliente, c.uso_vehiculo, c.plazo_compra, c.comprobacion_ingresos].some((v) =>
                    String(v || "")
                        .toLowerCase()
                        .includes(q),
                );
            return (
                matchQ &&
                (filters.estado === "Todos" || c.estado === filters.estado) &&
                dealerMatchesFilter(c.agencia, filters.agencia) &&
                (filters.linea === "Todos" || c.linea === filters.linea) &&
                (filters.buro === "Todos" || c.buro_estado === filters.buro) &&
                (filters.formaPago === "Todos" || c.forma_pago === filters.formaPago) &&
                (filters.tipoCliente === "Todos" || c.tipo_cliente === filters.tipoCliente) &&
                isDateInRange(c.fecha_reclamacion, filters.fechaRegistroDesde, filters.fechaRegistroHasta)
            );
        });
    }, [cases, deferredQ, filters, isAdmin, filtroNumeroActivo, userAgencias, userTieneAgencia]);
    const sorted = useMemo(() => {
        const data = [...baseFiltered];
        if (!sort.key) return data;
        const dir = sort.dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const va = getSortValue(a, sort.key),
                vb = getSortValue(b, sort.key);
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
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
    const pageStart = sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const pageEnd = sorted.length === 0 ? 0 : Math.min(page * PAGE_SIZE, sorted.length);
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
    const pautasOptions = useMemo(() => {
        const items = Array.isArray(pautasMeta) ? pautasMeta : [];
        const vistos = new Set();
        const opciones = [];
        for (const item of items) {
            const value = String(item?.value || "").trim();
            const label = String(item?.label || value).trim();
            if (!value) continue;
            const key = normalizeText(value);
            if (vistos.has(key)) continue;
            vistos.add(key);
            opciones.push({ value, label });
        }
        return opciones.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
    }, [pautasMeta]);
    function handleAddFiles(fileList) {
        if (!fileList?.length) return;
        const nuevas = Array.from(fileList).map((file) => ({
            _tmpId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        }));
        setDraft((prev) => ({
            ...prev,
            evidencias_nuevas: [...(prev.evidencias_nuevas || []), ...nuevas],
        }));
    }
    function removeNuevaEvidencia(tmpId) {
        setDraft((prev) => ({
            ...prev,
            evidencias_nuevas: (prev.evidencias_nuevas || []).filter((e) => e._tmpId !== tmpId),
        }));
    }
    function removeEvidenciaExistente(id) {
        setDraft((prev) => ({
            ...prev,
            evidencias_existentes: (prev.evidencias_existentes || []).filter((e) => e.id !== id),
            delete_evidencia_ids: [...(prev.delete_evidencia_ids || []), id],
        }));
    }
    async function cargarPlantillas() {
        const numeroLinea =
            numeroAsesorActivo ||
            numeroUsuarioSesion ||
            "";

        if (!numeroLinea) {
            setTemplatesDisponibles([]);
            setTemplatesError(
                "Tu usuario no tiene un número de WhatsApp asignado."
            );
            return;
        }

        try {
            setLoadingTemplates(true);
            setTemplatesError("");

            const response =
                await api.digitalesPlantillas({
                    numero_asesor:
                        numeroLinea,
                });
            const items = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
            setTemplatesDisponibles(items);
        } catch (error) {
            console.error("Error cargando plantillas:", error);
            setTemplatesDisponibles([]);
            setTemplatesError(error?.message || "No se pudieron cargar las plantillas.");
        } finally {
            setLoadingTemplates(false);
        }
    }
    async function abrirPlantillasDropdown() {
        if (showTemplatesDropdown) {
            resetPlantillasModal();
            return;
        }
        if (!numeroUsuarioSesion) {
            alert("Tu usuario no tiene un número de WhatsApp asignado.");
            return;
        }
        if (!telIsOk || telInvalid) {
            setTouchedSave(true);
            alert("Captura un teléfono válido antes de cargar las plantillas.");
            return;
        }
        const prospectoId = await asegurarProspectoGuardado();
        if (!prospectoId) return;
        setTplSelected(null);
        setTplDraft({});
        setShowTemplatesDropdown(true);
        await cargarPlantillas();
    }
    function pickTemplate(template) {
        setTplSelected(template);
        const context = {
            nombre: getNombreCompletoDraft(draft) || "",
            agencia: draft?.agencia || contextoDigitalSesion?.agencia || "",
            modelo: draft?.cliente_interes || "",
            canal: draft?.origen || "",
            asesor: draft?.asesor_digital || contextoDigitalSesion?.asesor_digital || user?.nombre || user?.username || "",
            tema: draft?.cliente_interes ? "vehículo de interés" : "solicitud de información",
            dato: "horario",
        };
        const values = {};
        for (const field of template.fields || []) {
            values[field.key] = getDefaultTemplateFieldValue(field, context);
        }
        setTplDraft(values);
    }
    function calcTiempoRespuesta(creado, primerContacto) {
        if (!creado || !primerContacto) return null;
        const diff = new Date(primerContacto).getTime() - new Date(creado).getTime();
        if (diff < 0) return null;
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
        if (!value) return "—";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "—" : dtFmt.format(d);
    }
    function limpiarValorExcel(value) {
        if (value === null || value === undefined || value === "") return "—";
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
    const openCreate = () => {
        resetPlantillasModal();
        resetCacheProspectoGuardado();
        setTouchedSave(false);
        setMode("create");
        const now = new Date();
        const nowLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setDraft({
            id_exp: null,
            agencia: !isAdmin ? contextoDigitalSesion?.agencia || "" : "",
            anio_auto: "",
            tiene_nombre: false,
            cliente_nombre: "",
            cliente_apellidos: "",
            telefono: "",
            correo: "",
            linea: "",
            origen: "",
            pauta: "",
            estado: "Contactado",
            motivo_descalificacion: "",
            cliente_interes: "",
            comentarios: "",
            asesor_digital: !isAdmin ? contextoDigitalSesion?.asesor_digital || "" : "",
            asesor_solicita: "",
            creado: nowLocal,
            primer_contacto_at: "",
            ultimo_contacto_at: "",
            enganche_monto: "",
            presupuesto_mensual: "",
            buro_estado: "",
            forma_pago: "",
            tipo_cliente: "",
            uso_vehiculo: "",
            plazo_compra: "",
            comprobacion_ingresos: "",
            evidencias_existentes: [],
            evidencias_nuevas: [],
            delete_evidencia_ids: [],
        });
        setOpenModal(true);
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
        if (!row) return;
        setSummaryInfo({ id_exp: row.id_exp, nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(), resumen: row.resumen || "", resumen_actualizado_at: row.resumen_actualizado_at || "", resumen_fuente: row.resumen_fuente || "" });
        setOpenSummaryModal(true);
    };
    const abrirAgendaCita = (row) => {
        if (!row) return;
        const nombre = `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim();
        setAgendaInfo({ id_exp: row.id_exp, cliente_id: row.cliente_id, nombre, telefono: row.telefono || "", correo: row.correo || "", auto_interes: row.cliente_interes || "", agencia: row.agencia || "", fuente_prospeccion: row.origen || "", fecha_cita: "", asesor_digital: row.asesor_digital, asesor_solicita: row.asesor_solicita, tipo_cita: "" });
        setOpenAgendaModal(true);
    };
    const openEdit = async (
        row,
        estadoInicial = ""
    ) => {
        resetPlantillasModal();
        resetCacheProspectoGuardado();

        const numeroLinea =
            numeroAsesorActivo ||
            numeroUsuarioSesion ||
            "";

        try {
            setTouchedSave(false);
            setMode("edit");
            setLoadingDetail(true);
            setOpenModal(true);

            const contextoPeticion =
                isAdmin &&
                    selectedNumeroAsesor === "Todos"
                    ? {
                        todos: 1,
                    }
                    : numeroLinea
                        ? {
                            numero_asesor:
                                numeroLinea,
                        }
                        : {};

            const [
                p,
                evidenciasData,
            ] = await Promise.all([
                api.digitalesGetProspecto(
                    row.id_exp,
                    contextoPeticion
                ),
                api.digitalesListEvidencias(
                    row.id_exp,
                    contextoPeticion
                ).catch((error) => {
                    console.warn(
                        "No se pudieron cargar las evidencias:",
                        error
                    );
                    return [];
                }),
            ]);

            const nombreCompleto = String(
                p.nombre || ""
            ).trim();

            const tieneNombre =
                tieneNombreReal(
                    nombreCompleto
                );

            setDraft({
                id_exp: p.id,
                agencia: p.agencia || "",
                anio_auto: p.anio_auto || "",
                tiene_nombre: tieneNombre,
                nombre_cliente: tieneNombre
                    ? nombreCompleto
                    : "",
                telefono: String(
                    p.telefono || ""
                ),
                correo: p.correo || "",
                linea: p.business || "",
                origen:
                    p.canal_contacto || "",
                pauta: p.pauta || "",
                estado:
                    estadoInicial ||
                    p.estado ||
                    "",
                motivo_descalificacion:
                    normalizeText(
                        estadoInicial ||
                        p.estado
                    ) === "descalificado"
                        ? p.motivo_descalificacion ||
                        ""
                        : "",
                cliente_interes:
                    p.auto_interes || "",
                comentarios:
                    p.comentarios || "",
                resumen: p.resumen || "",
                resumen_actualizado_at:
                    toDTLocal(
                        p.resumen_actualizado_at
                    ),
                resumen_fuente:
                    p.resumen_fuente || "",
                asesor_digital:
                    p.asesor_digital || "",
                usuario_crm_asignado:
                    p.usuario_crm_asignado ||
                    "",
                asignado_automaticamente_at:
                    p.asignado_automaticamente_at ||
                    null,
                asesor_solicita:
                    p.asesor_ventas || "",
                creado:
                    toDTLocalInput(
                        p.creado
                    ),
                primer_contacto_at:
                    p.primer_mensaje_cliente ||
                    null,
                ultimo_contacto_at:
                    p.ultimo_contacto_asesor ||
                    null,
                enganche_monto:
                    p.enganche_monto || "",
                presupuesto_mensual:
                    p.presupuesto_mensual ||
                    "",
                buro_estado:
                    p.buro_estado || "",
                forma_pago:
                    p.forma_pago || "",
                tipo_cliente:
                    p.tipo_cliente || "",
                uso_vehiculo:
                    p.uso_vehiculo || "",
                plazo_compra:
                    p.plazo_compra || "",
                comprobacion_ingresos:
                    p.comprobacion_ingresos ||
                    "",
                id_cotizacion:
                    p.id_cotizacion || "",
                folio_solicitud_credito:
                    p.folio_solicitud_credito ||
                    "",
                solicitud_credito_estado:
                    p.solicitud_credito_estado ||
                    "",
                vin_facturado:
                    p.vin_facturado || "",
                vin_estatus_entrega:
                    p.vin_estatus_entrega ||
                    "",
                evidencias_existentes:
                    Array.isArray(
                        evidenciasData
                    )
                        ? evidenciasData
                        : Array.isArray(
                            evidenciasData?.results
                        )
                            ? evidenciasData.results
                            : [],
                evidencias_nuevas: [],
                delete_evidencia_ids: [],
            });
        } catch (error) {
            console.error(
                "Error abriendo prospecto:",
                {
                    prospectoId:
                        row?.id_exp,
                    numeroLinea,
                    error,
                }
            );

            alert(
                `No se pudo abrir el prospecto para editar.${error?.message
                    ? `\n\n${error.message}`
                    : ""
                }`
            );

            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };
    const closeModal = () => {
        if (saving || sendingTemplate) return;
        resetPlantillasModal();
        resetCacheProspectoGuardado();
        setOpenModal(false);
        setDraft(null);
    };
    const refreshList = async () => {
        await cargarProspectosPorLinea();
    };
    function buildProspectoPayload() {
        const agenciaFinal = !isAdmin && contextoDigitalSesion?.agencia ? contextoDigitalSesion.agencia : draft.agencia || "";
        const asesorDigitalFinal = mode === "edit" ? draft.asesor_digital || "" : !isAdmin && contextoDigitalSesion?.asesor_digital ? contextoDigitalSesion.asesor_digital : draft.asesor_digital || "";
        const nombreCapturado = getNombreCompletoDraft(draft);
        const nombreFinal = draft.tiene_nombre && nombreCapturado ? nombreCapturado : "SIN NOMBRE";
        return {
            numero_asesor: numeroAsesorActivo || numeroUsuarioSesion || "",
            nombre: nombreFinal,
            telefono: normalizaTelefonoMx(draft.telefono),
            correo: draft.correo || "",
            agencia: agenciaFinal,
            anio_auto: draft.anio_auto ? Number(draft.anio_auto) : null,
            business: draft.linea || "",
            canal_contacto: draft.origen || "",
            pauta: draft.pauta || "",
            estado: draft.estado || "",
            motivo_descalificacion:
                normalizeText(draft.estado) === "descalificado"
                    ? String(draft.motivo_descalificacion || "").trim()
                    : "",
            asesor_digital: asesorDigitalFinal,
            asesor_ventas: draft.asesor_solicita || "",
            auto_interes: draft.cliente_interes || "",
            comentarios: draft.comentarios || "",
            enganche_monto: toNullableNumber(draft.enganche_monto),
            presupuesto_mensual: toNullableNumber(draft.presupuesto_mensual),
            buro_estado: draft.buro_estado || "",
            forma_pago: draft.forma_pago || "",
            tipo_cliente: draft.tipo_cliente || "",
            uso_vehiculo: draft.uso_vehiculo || "",
            plazo_compra: draft.plazo_compra || "",
            comprobacion_ingresos: draft.comprobacion_ingresos || "",
            id_cotizacion: draft.id_cotizacion || "",
            folio_solicitud_credito: draft.folio_solicitud_credito || "",
            solicitud_credito_estado: draft.solicitud_credito_estado || "",
            vin_facturado: draft.vin_facturado || "",
            vin_estatus_entrega: draft.vin_estatus_entrega || "",
            primer_mensaje_cliente: draft.primer_contacto_at || null,
            ultimo_contacto_asesor: draft.ultimo_contacto_at || null,
        };
    }
    function getFirmaPayloadProspecto(payload) {
        return JSON.stringify(payload);
    }
    async function asegurarProspectoGuardado() {
        if (!draft || saving) return null;
        setTouchedSave(true);
        if (
            normalizeText(draft.estado) === "descalificado" &&
            !String(draft.motivo_descalificacion || "").trim()
        ) {
            alert("Selecciona un motivo de descalificación.");
            return null;
        }

        if (missing.length || telInvalid || !telIsOk) {
            return null;
        }
        if (missing.length || telInvalid || !telIsOk) return null;

        const payloadActual = buildProspectoPayload();
        const firmaActual = getFirmaPayloadProspecto(payloadActual);
        const idGuardado = draft.id_exp || ultimoProspectoGuardadoIdRef.current;

        if (idGuardado && ultimoPayloadGuardadoRef.current === firmaActual) {
            return idGuardado;
        }

        return guardarProspecto({ cerrar: false, procesarEvidencias: false });
    }
    async function guardarProspecto({ cerrar = true, procesarEvidencias = true } = {}) {
        if (!draft || saving) return null;
        setTouchedSave(true);
        if (
            normalizeText(draft.estado) === "descalificado" &&
            !String(draft.motivo_descalificacion || "").trim()
        ) {
            alert("Selecciona un motivo de descalificación.");
            return null;
        }
        if (missing.length || telInvalid || !telIsOk) {
            return null;
        }
        setSaving(true);
        try {
            const payload = buildProspectoPayload();
            let idFinal = draft.id_exp;
            if (!idFinal || mode === "create") {
                const created = await api.digitalesCreateProspecto(payload);
                idFinal = created?.id || created?.id_exp || created?.prospecto?.id || null;
                if (!idFinal) {
                    throw new Error("El backend guardó el prospecto, pero no devolvió su ID.");
                }
                setMode("edit");
            } else {
                await api.digitalesUpdateProspecto(idFinal, payload);
            }
            ultimoPayloadGuardadoRef.current = getFirmaPayloadProspecto(payload);
            ultimoProspectoGuardadoIdRef.current = idFinal;
            if (procesarEvidencias) {
                const nuevas = draft.evidencias_nuevas || [];
                if (nuevas.length > 0) {
                    const formData = new FormData();
                    nuevas.forEach((evidencia) => {
                        if (evidencia.file) {
                            formData.append("archivos", evidencia.file);
                        }
                    });
                    await api.digitalesUploadEvidencias(
                        idFinal,
                        formData,
                        numeroAsesorActivo ||
                        numeroUsuarioSesion ||
                        ""
                    );
                }
                const idsEliminar = draft.delete_evidencia_ids || [];
                if (idsEliminar.length > 0) {
                    await Promise.allSettled(
                        idsEliminar.map(
                            (idEvidencia) =>
                                api.digitalesDeleteEvidencia(
                                    idFinal,
                                    idEvidencia,
                                    {
                                        numero_asesor:
                                            numeroAsesorActivo ||
                                            numeroUsuarioSesion ||
                                            "",
                                    }
                                )
                        )
                    );
                }
            }
            await refreshList();
            if (cerrar) {
                resetPlantillasModal();
                resetCacheProspectoGuardado();
                setOpenModal(false);
                setDraft(null);
            } else {
                setDraft((currentDraft) => ({
                    ...currentDraft,
                    id_exp: idFinal,
                    telefono: payload.telefono,
                    ...(procesarEvidencias
                        ? {
                            evidencias_nuevas: [],
                            delete_evidencia_ids: [],
                        }
                        : {}),
                }));
            }
            return idFinal;
        } catch (error) {
            console.error("Error guardando el prospecto:", error);
            alert(error?.message || "Error guardando el prospecto.");
            return null;
        } finally {
            setSaving(false);
        }
    }
    async function enviarPlantilla() {
        if (!tplSelected || sendingTemplate) {
            return;
        }
        const telefono = normalizaTelefonoMx(draft?.telefono);
        if (!/^52\d{10}$/.test(telefono)) {
            alert("El teléfono del prospecto no es válido.");
            return;
        }
        // Solo guarda si la información cambió desde el último guardado.
        const prospectoId = await asegurarProspectoGuardado();
        if (!prospectoId) return;
        const fields = Array.isArray(tplSelected.fields) ? tplSelected.fields : [];
        const incompleteField = fields.find((field) => !String(tplDraft[field.key] || "").trim());
        if (incompleteField) {
            alert(`Completa el campo: ${incompleteField.label || incompleteField.key}`);
            return;
        }
        const idioma = tplSelected.idioma || tplSelected.language || "es_MX";
        const components = buildDynamicTemplateComponents(tplSelected, tplDraft);
        setSendingTemplate(true);
        try {
            await api.digitalesEnviarPlantilla({
                to: telefono,
                template_name: tplSelected.key,
                idioma,
                components: components.length > 0 ? components : undefined,
                params: components.length > 0 ? undefined : [],
            });
            /*
             * El teléfono ya tiene por lo menos
             * un mensaje saliente.
             */
            setTelefonosConChat((currentSet) => {
                const nextSet = new Set(currentSet);
                nextSet.add(telefono);
                return nextSet;
            });
            resetPlantillasModal();
            alert("Plantilla enviada correctamente.");
        } catch (error) {
            console.error("Error enviando plantilla:", error);
            alert(error?.message || "No se pudo enviar la plantilla.");
        } finally {
            setSendingTemplate(false);
        }
    }
    const save = () =>
        guardarProspecto({
            cerrar: true,
            procesarEvidencias: true,
        });
    useEffect(() => {
        if (openAgendaModal && agendaInfo) {
            setDrafter({ agencia: agendaInfo.agencia || "", fecha_cita: agendaInfo.fecha_cita || "", asesor_digital: agendaInfo.asesor_digital || "", asesor_solicita: agendaInfo.asesor_solicita || "", tipo_cita: agendaInfo.tipo_cita || "" });
            setErrorMsg("");
        }
    }, [openAgendaModal, agendaInfo]);
    async function handleAgendar() {
        if (!agendaInfo) return;
        try {
            setSavingo(true);
            setErrorMsg("");
            await apiCitas.create({ cliente_id: agendaInfo.cliente_id, nombre: agendaInfo.nombre, telefono: agendaInfo.telefono, correo: agendaInfo.correo || "", auto_interes: agendaInfo.auto_interes || "", agencia: agendaInfo.agencia || "", fecha_hora_cita: drafter.fecha_cita || null, fuente_prospeccion: agendaInfo.fuente_prospeccion || "", asesor_digital: drafter.asesor_digital || "", asesor_solicita: drafter.asesor_solicita || "", asesor_asignado: drafter.asesor_solicita || "", tipo_cita: drafter.tipo_cita || "" });
            await refreshList();
            closeAgendaModal();
        } catch (err) {
            setErrorMsg(err?.message || "No se pudo crear la cita");
        } finally {
            setSavingo(false);
        }
    }
    const updateEstadoInline = async (row, newEstado) => {
        const id = row?.id_exp;
        if (!id) return;
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
        setCases((prev) =>
            prev.map((caso) =>
                caso.id_exp === id
                    ? {
                        ...caso,
                        estado: newEstado,
                        motivo_descalificacion: "",
                        primer_contacto_at: primerContactoNuevo,
                        ultimo_contacto_at: nowLocal,
                    }
                    : caso
            )
        );
        setUpdatingEstado((p) => ({ ...p, [id]: true }));
        try {
            await api.digitalesPatchProspecto(id, {
                numero_asesor:
                    numeroAsesorActivo ||
                    numeroUsuarioSesion ||
                    "",
                estado: newEstado,
                motivo_descalificacion: "",
                primer_mensaje_cliente: primerContactoNuevo,
                ultimo_contacto_asesor: nowLocal,
            });
        } catch (e) {
            console.error(e);
            setCases((prev) => prev.map((c) => (c.id_exp === id ? { ...c, estado: prevEstado, primer_contacto_at: prevPrimer, ultimo_contacto_at: prevUltimo } : c)));
            alert("No se pudo actualizar el estado.");
        } finally {
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
            const res =
                await api.digitalesGenerarResumen(
                    id,
                    {
                        numero_asesor:
                            numeroAsesorActivo ||
                            numeroUsuarioSesion ||
                            "",
                    }
                );
            if (!res?.ok) {
                throw new Error(res?.error || "El backend no pudo generar el resumen.");
            }
            const resumenNuevo = String(res?.resumen || "").trim();
            if (!resumenNuevo) {
                throw new Error("El backend respondió, pero el resumen llegó vacío.");
            }
            const resumenActualizadoAt = toDTLocal(res?.resumen_actualizado_at);
            const resumenFuente = res?.resumen_fuente || "manual";
            setCases((prev) =>
                prev.map((caso) =>
                    caso.id_exp === id
                        ? {
                            ...caso,
                            resumen: resumenNuevo,
                            resumen_actualizado_at: resumenActualizadoAt,
                            resumen_fuente: resumenFuente,
                        }
                        : caso,
                ),
            );
            if (draft?.id_exp === id) {
                setDraft((prev) => ({
                    ...prev,
                    resumen: resumenNuevo,
                    resumen_actualizado_at: resumenActualizadoAt,
                    resumen_fuente: resumenFuente,
                }));
            }
            setSummaryInfo({
                id_exp: id,
                nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(),
                resumen: resumenNuevo,
                resumen_actualizado_at: resumenActualizadoAt,
                resumen_fuente: resumenFuente,
            });
            setOpenSummaryModal(true);
        } catch (error) {
            console.error("Error generando resumen manual:", {
                prospectoId: id,
                error,
            });
            const mensaje = error instanceof Error ? error.message : String(error || "Error desconocido");
            alert(`No se pudo generar el resumen:\n\n${mensaje}`);
        } finally {
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
    const KPICard = ({ icon: Icon, label, value, sub, subColor = "text-slate-400", iconColor = "text-[#131E5C]" }) => (
        <div className="flex items-start gap-3 py-4 px-6 border-r border-slate-200 last:border-r-0">
            <Icon className={cls("h-6 w-6 flex-shrink-0 mt-1", iconColor)} />
            <div className="min-w-0">
                <div className="text-2xl font-black text-[#131E5C] leading-tight">{value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
                {sub && <div className={cls("text-[11px] font-semibold mt-1", subColor)}>{sub}</div>}
            </div>
        </div>
    );
    const FilterButtonGroup = ({ label, value, options, onChange }) => (
        <div className="min-w-0">
            <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-[#131E5C]/70">{label}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
                {options.map((option) => {
                    const active = value === option;
                    return (
                        <button key={option} type="button" onClick={() => onChange(option)} className={cls("inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-black transition active:scale-[0.98]", active ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-[#131E5C] bg-white text-[#131E5C] hover:bg-[#131E5C]/5")}>
                            {option === "Todos" ? "Todos" : option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
    const filtrosActivos = useMemo(() => {
        const items = [];
        if (filters.q) {
            items.push({
                key: "q",
                label: `Búsqueda: ${filters.q}`,
                clear: () => updateFilter("q", ""),
            });
        }
        if (filters.agencia !== "Todos") {
            items.push({
                key: "agencia",
                label: `Dealer: ${filters.agencia}`,
                clear: () => updateFilter("agencia", "Todos"),
            });
        }
        if (filters.linea !== "Todos") {
            items.push({
                key: "linea",
                label: `Business: ${filters.linea}`,
                clear: () => updateFilter("linea", "Todos"),
            });
        }
        if (filters.estado !== "Todos") {
            items.push({
                key: "estado",
                label: `Estado: ${filters.estado}`,
                clear: () => updateFilter("estado", "Todos"),
            });
        }
        if (filters.buro !== "Todos") {
            items.push({
                key: "buro",
                label: `Buró: ${valueOrDash(filters.buro)}`,
                clear: () => updateFilter("buro", "Todos"),
            });
        }
        if (filters.formaPago !== "Todos") {
            items.push({
                key: "formaPago",
                label: `Pago: ${valueOrDash(filters.formaPago)}`,
                clear: () => updateFilter("formaPago", "Todos"),
            });
        }
        if (filters.tipoCliente !== "Todos") {
            items.push({
                key: "tipoCliente",
                label: `Cliente: ${valueOrDash(filters.tipoCliente)}`,
                clear: () => updateFilter("tipoCliente", "Todos"),
            });
        }
        if (filters.fechaRegistroDesde || filters.fechaRegistroHasta) {
            items.push({
                key: "fechaRegistro",
                label: `Registro: ${filters.fechaRegistroDesde || "Inicio"} → ${filters.fechaRegistroHasta || "Hoy"}`,
                clear: () =>
                    setFilters((prev) => ({
                        ...prev,
                        fechaRegistroDesde: "",
                        fechaRegistroHasta: "",
                    })),
            });
        }
        if (isAdmin && selectedNumeroAsesor !== "Todos") {
            items.push({
                key: "numeroAsesor",
                label: `Línea: ${formatTelefonoMx(selectedNumeroAsesor)}`,
                clear: () => setSelectedNumeroAsesor("Todos"),
            });
        }
        return items;
    }, [filters, isAdmin, selectedNumeroAsesor]);
    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-[#131E5C] flex items-center gap-2">Gestión Comercial</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Monitorea tus prospectos y su información clave para el seguimiento asistido por IA.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center rounded-xl border border-[#131E5C]/20 bg-white p-1 shadow-sm">
                        {VIEW_MODES.map(({ key, label, Icon }) => (
                            <button key={key} type="button" onClick={() => setViewMode(key)} className={cls("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition", viewMode === key ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100")}>
                                <Icon className="h-4 w-4" /> {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={exportarExcelProspectos} disabled={loadingCases || sorted.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 py-2 text-sm font-semibold text-[#131E5C] shadow-sm hover:bg-slate-100 disabled:opacity-50">
                        <FileDown className="h-4 w-4" /> Exportar Excel
                    </button>
                    <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80">
                        <Plus className="h-4 w-4" /> Nuevo Prospecto
                    </button>
                </div>
            </div>
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
            <div className="mb-5 space-y-4">
                {/* Botones de Dealer y Business */}
                <div className="bg-white p-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                        <FilterButtonGroup
                            label="Dealer"
                            value={filters.agencia}
                            options={dealers}
                            onChange={(value) => {
                                updateFilter("agencia", value);
                                setPage(1);
                            }}
                        />
                        <FilterButtonGroup
                            label="Business"
                            value={filters.linea}
                            options={businessOptions}
                            onChange={(value) => {
                                updateFilter("linea", value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>
            {/* Filtros compactos */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="p-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        {/* Buscador principal */}
                        <div className="relative min-w-0 flex-1 mt-5">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]/60" />
                            <input value={filters.q} onChange={(e) => updateFilter("q", e.target.value)} placeholder="Buscar cliente, teléfono, email, asesor, vehículo..." className="h-11 w-full rounded-xl border border-[#131E5C]/15 bg-slate-50 pl-10 pr-10 text-sm font-semibold text-[#131E5C] outline-none transition placeholder:text-slate-400 focus:border-[#131E5C]/40 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
                            {filters.q ? (
                                <button type="button" onClick={() => updateFilter("q", "")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                        {/* Filtros principales */}
                        <div className="grid min-w-0 flex-1 gap-3 xl:grid-cols-[1fr_1fr_180px] xl:items-end">
                            <div>
                                <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-[#131E5C]/70">Buró</div>
                                <select value={filters.buro} onChange={(e) => updateFilter("buro", e.target.value)} className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                    {buroOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : valueOrDash(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-[#131E5C]/70">Forma de pago</div>
                                <select value={filters.formaPago} onChange={(e) => updateFilter("formaPago", e.target.value)} className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                    {formaPagoOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : valueOrDash(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-[#131E5C]/70">Estado</div>
                                <select value={filters.estado} onChange={(e) => updateFilter("estado", e.target.value)} className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10">
                                    {estados.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Acciones rápidas */}
                        <div className="flex flex-wrap items-center gap-2 mt-5">
                            {[
                                {
                                    label: "Hoy",
                                    desde: todayStr,
                                    hasta: todayStr,
                                    inactive: "border-emerald-200 bg-emerald-300 text-emerald-700 hover:bg-emerald-100",
                                    active: "bg-emerald-600 text-white ring-4 ring-emerald-100",
                                },
                                {
                                    label: "Ayer",
                                    desde: yesterdayStr,
                                    hasta: yesterdayStr,
                                    inactive: "border-amber-200 bg-amber-300 text-amber-700 hover:bg-amber-100",
                                    active: "bg-amber-500 text-white ring-4 ring-amber-100",
                                },
                                {
                                    label: "Semana",
                                    desde: weekStartStr,
                                    hasta: weekEndStr,
                                    inactive: "border-sky-200 bg-sky-300 text-sky-700 hover:bg-sky-100",
                                    active: "bg-sky-600 text-white ring-4 ring-sky-100",
                                },
                                {
                                    label: "7 días",
                                    desde: last7DaysStartStr,
                                    hasta: todayStr,
                                    inactive: "border-violet-200 bg-violet-300 text-violet-700 hover:bg-violet-100",
                                    active: "bg-violet-600 text-white ring-4 ring-violet-100",
                                },
                                {
                                    label: "30 días",
                                    desde: last30DaysStartStr,
                                    hasta: todayStr,
                                    inactive: "border-indigo-200 bg-indigo-300 text-indigo-700 hover:bg-indigo-100",
                                    active: "bg-indigo-600 text-white ring-4 ring-indigo-100",
                                },
                                {
                                    label: "Este mes",
                                    desde: monthStartStr,
                                    hasta: monthEndStr,
                                    inactive: "border-[#131E5C]/20 bg-blue-300 text-[#131E5C] hover:bg-blue-100",
                                    active: "bg-[#131E5C] text-white ring-4 ring-[#131E5C]/10",
                                },
                            ].map(({ label, desde, hasta, inactive, active }) => {
                                const isActive = isQuickActive(desde, hasta);
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                fechaRegistroDesde: desde,
                                                fechaRegistroHasta: hasta,
                                            }))
                                        }
                                        className={cls("h-11 rounded-xl border px-3 text-sm font-black shadow-sm transition active:scale-[0.98]", isActive ? active : inactive)}>
                                        {label}
                                    </button>
                                );
                            })}
                            <button type="button" onClick={() => setShowAdvancedFilters((prev) => !prev)} className={cls("inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-black shadow-sm transition", showAdvancedFilters || filtrosActivos.length > 0 ? "bg-[#131E5C] text-white" : "border border-[#131E5C]/15 bg-white text-[#131E5C] hover:bg-[#131E5C]/5")}>
                                Más filtros
                                {filtrosActivos.length > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-[#131E5C]">{filtrosActivos.length}</span> : null}
                                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button type="button" onClick={resetFilters} title="Limpiar filtros" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
                {/* Panel avanzado colapsable */}
                {showAdvancedFilters ? (
                    <div className="border-t border-[#131E5C]/10 bg-slate-50/80 p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div className="text-xs font-bold text-slate-400">
                                {pageStart}–{pageEnd} de {sorted.length} prospectos
                            </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
                            <div className="xl:col-span-3">
                                <label className={filterLabelCls}>Tipo cliente</label>
                                <select value={filters.tipoCliente} onChange={(e) => updateFilter("tipoCliente", e.target.value)} className={filterControlCls}>
                                    {tipoClienteOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : valueOrDash(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {isAdmin || isCoordinador ? (
                                <div className="xl:col-span-3">
                                    <label className={filterLabelCls}>
                                        Línea de WhatsApp
                                    </label>

                                    <select
                                        value={selectedNumeroAsesor}
                                        onChange={(event) => {
                                            setSelectedNumeroAsesor(
                                                event.target.value
                                            );

                                            setPage(1);
                                        }}
                                        className={filterControlCls}
                                    >
                                        {phoneOptions.map(
                                            (numero) => (
                                                <option
                                                    key={numero}
                                                    value={numero}
                                                >
                                                    {numero === "Todos"
                                                        ? "Todos los números"
                                                        : `${formatTelefonoMx(
                                                            numero
                                                        )
                                                        } • ${getEtiquetaDigitalPorNumero(
                                                            numero
                                                        )
                                                        }`}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            ) : null}
                            <div className={cls(isAdmin ? "xl:col-span-6" : "xl:col-span-6")}>
                                <label className={filterLabelCls}>Fecha de registro</label>
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <input type="date" value={filters.fechaRegistroDesde} onChange={(e) => updateFilter("fechaRegistroDesde", e.target.value)} className={filterControlCls} />
                                    <span className="text-xs font-black text-slate-400">→</span>
                                    <input type="date" value={filters.fechaRegistroHasta} onChange={(e) => updateFilter("fechaRegistroHasta", e.target.value)} className={filterControlCls} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
            {/* Vista Gráficos */}
            {viewMode === "graficos" && <VistaGraficos rows={sorted} />}
            {/* Vista Tabla */}
            {viewMode === "tabla" && (
                <div className="min-w-0">
                    {/* Tabla principal */}
                    <div className="flex-1 min-w-0">
                        <div className="hidden overflow-hidden rounded-xl bg-white border border-black/10 shadow-sm lg:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-white">
                                        <tr className="text-xs">
                                            {[
                                                { key: "agencia", label: "Dealer" },
                                                { key: null, label: "Cliente" },
                                                { key: "fecha_reclamacion", label: "Fecha y hora registro" },
                                                { key: "primer_contacto_at", label: "Primer contacto asesor" },
                                                { key: "ultimo_contacto_at", label: "Último contacto asesor" },
                                                { key: null, label: "Tiempo respuesta" },
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
                                            ].map(({ key, label }) => (
                                                <th key={label} className="px-3 py-3 whitespace-nowrap text-left">
                                                    {key ? (
                                                        <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 text-xs font-bold text-[#131E5C] hover:text-[#131E5C]/70">
                                                            {label}
                                                            <span className="opacity-50">{sort.key === key ? sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-bold text-[#131E5C]">{label}</span>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/[0.06]">
                                        {loadingCases
                                            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                            : paginatedRows.map((row) => {
                                                const score = calcLeadScore(row);
                                                const prioridad = getPrioridad(row);
                                                const perfilFin = getPerfilFinancieroDiagnostico(row);
                                                const isUpdating = !!updatingEstado[row.id_exp];
                                                const rowTieneChat = telefonosConChat.has(normalizaTelefonoMx(row.telefono));
                                                return (
                                                    <tr key={row.id_exp} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} onClick={() => setHighlightedRow(row)} className={cls("cursor-pointer hover:bg-[#131E5C]/[0.03] transition-colors", highlightedRow?.id_exp === row.id_exp ? "bg-[#131E5C]/[0.05]" : "")}>
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
                                                                if (!t) return <span className="text-xs text-slate-400">—</span>;
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
                                                                <select
                                                                    value={row.estado || "Contactado"}
                                                                    disabled={isUpdating}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        updateEstadoInline(row, e.target.value);
                                                                    }}
                                                                    className={cls("appearance-none rounded-full border bg-transparent px-2.5 py-0.5 pr-7 text-[11px] font-semibold outline-none", badgeCls(row.estado), isUpdating ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
                                                                    {ESTADOS_PROSPECTO.map((s) => (
                                                                        <option key={s} value={s} className="bg-white text-[#131E5C]">
                                                                            {s}
                                                                        </option>
                                                                    ))}
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
                                                            {row.asesor_solicita ? (
                                                                <div>
                                                                    <div className="text-xs font-bold text-[#131E5C] truncate max-w-[160px]" title={row.asesor_solicita}>
                                                                        {row.asesor_solicita}
                                                                    </div>
                                                                    <div className="mt-0.5 text-[11px] text-slate-400">Asesor de piso/ventas</div>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">Sin asignar</span>
                                                            )}
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
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openSummaryViewer(row);
                                                                    }}
                                                                    className="text-left min-w-0 flex-1">
                                                                    <span className="line-clamp-2 text-xs text-slate-600">{row.resumen || "Sin resumen"}</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        generarResumenInline(row);
                                                                    }}
                                                                    disabled={!!generatingSummary[row.id_exp]}
                                                                    className="h-7 w-7 flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm disabled:opacity-60"
                                                                    title="Generar resumen">
                                                                    {generatingSummary[row.id_exp] ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#131E5C]" /> : <ClipboardCheck className="h-3.5 w-3.5 text-[#131E5C]" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        abrirAgendaCita(row);
                                                                    }}
                                                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm hover:bg-slate-50"
                                                                    title="Agendar cita">
                                                                    <CalendarPlus className="h-4 w-4 text-[#131E5C]" />
                                                                </button>
                                                                {rowTieneChat ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            navigate(`/comercial/prospectos/contacto?tel=${encodeURIComponent(row.telefono || "")}&direct=1`);
                                                                        }}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                                        title="Abrir chat">
                                                                        <MessageSquareShare className="h-4 w-4" />
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        {!loadingCases && paginatedRows.length === 0 && (
                                            <tr>
                                                <td colSpan={18} className="px-4 py-12 text-center text-slate-400">
                                                    No hay resultados con esos filtros.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Paginación */}
                            {sorted.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] bg-white">
                                    <div className="text-xs text-slate-500">
                                        Página {page} de {totalPages} · {PAGE_SIZE} registros por página
                                    </div>
                                    <div className="flex gap-1">
                                        {[
                                            { label: "«", action: () => setPage(1), disabled: page === 1 },
                                            { label: "‹", action: () => setPage((p) => Math.max(p - 1, 1)), disabled: page === 1 },
                                            { label: "›", action: () => setPage((p) => Math.min(p + 1, totalPages)), disabled: page === totalPages },
                                            { label: "»", action: () => setPage(totalPages), disabled: page === totalPages },
                                        ].map(({ label, action, disabled }) => (
                                            <button key={label} type="button" onClick={action} disabled={disabled} className="h-8 w-8 text-sm font-semibold rounded-lg border border-[#131E5C]/20 text-[#131E5C] disabled:opacity-40 hover:bg-slate-50">
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Vista móvil */}
                        <div className="grid gap-3 lg:hidden">
                            {loadingCases
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="mt-2 h-3 w-36" />
                                        <Skeleton className="mt-3 h-3 w-full" />
                                        <Skeleton className="mt-2 h-3 w-3/4" />
                                    </div>
                                ))
                                : paginatedRows.map((row) => {
                                    const score = calcLeadScore(row);
                                    const prioridad = getPrioridad(row);
                                    return (
                                        <button key={row.id_exp} onClick={() => openEdit(row)} className="rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50">
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
                                        </button>
                                    );
                                })}
                            {!loadingCases && paginatedRows.length === 0 && <div className="rounded-2xl border border-black/10 bg-white p-10 text-center text-slate-400">No hay resultados con esos filtros.</div>}
                        </div>
                    </div>
                </div>
            )}
            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminarCaso} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
            {/* Modal Editar/Crear */}
            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo prospecto" : `Editar prospecto · ${draft?.id_exp}`}
                onClose={closeModal}
                footer={
                    <>
                        {draftTieneChat ? (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`/comercial/prospectos/contacto?tel=${encodeURIComponent(telefonoDraft)}&direct=1`);
                                }}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-[#131E5C] shadow-sm hover:bg-slate-50"
                                title="Abrir chat">
                                <MessageSquareShare className="h-4 w-4" />
                                Abrir chat
                            </button>
                        ) : null}
                        {/* Plantillas — dropdown igual que mensajes rápidos */}
                        <div className="relative" ref={templatesDropdownRef}>
                            <button type="button" onClick={abrirPlantillasDropdown} disabled={!puedeAbrirPlantillas} className={cls("inline-flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold transition", puedeAbrirPlantillas ? "text-[#131E5C] hover:bg-slate-50" : "cursor-not-allowed text-slate-300 opacity-60", showTemplatesDropdown ? "bg-slate-50 ring-2 ring-[#131E5C]/15" : "")} title={!numeroUsuarioSesion ? "Tu usuario no tiene línea de WhatsApp asignada" : !telIsOk ? "Captura un teléfono válido" : "Guardar y seleccionar plantilla"}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
                                <span>{saving ? "Guardando..." : "Plantillas"}</span>
                            </button>
                            {showTemplatesDropdown ? (
                                <div className="absolute bottom-12 left-0 z-50 w-96 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            {tplSelected ? (
                                                <button type="button" onClick={() => setTplSelected(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </button>
                                            ) : null}
                                            <span className="text-xs font-extrabold text-[#131E5C]">{tplSelected ? `Plantilla: ${tplSelected.title || tplSelected.key}` : "Plantillas"}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowTemplatesDropdown(false);
                                                setTplSelected(null);
                                            }}
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-neutral-100 transition">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {!tplSelected ? (
                                            // Lista de plantillas
                                            loadingTemplates ? (
                                                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">Cargando plantillas...</div>
                                            ) : templatesError ? (
                                                <div className="px-4 py-4 text-xs font-bold text-red-600">{templatesError}</div>
                                            ) : templatesDisponibles.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">No hay plantillas disponibles.</div>
                                            ) : (
                                                templatesDisponibles.map((template) => (
                                                    <button key={`${template.key}-${template.idioma || template.language || "x"}`} type="button" onClick={() => pickTemplate(template)} className="w-full border-b border-black/5 px-4 py-3 text-left last:border-0 hover:bg-neutral-50 transition">
                                                        <div className="text-xs font-extrabold text-[#131E5C]">{template.title || template.key}</div>
                                                        <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                                            {template.key} · {template.idioma || template.language || "es_MX"} · {template.category || "Sin categoría"}
                                                        </div>
                                                        {template.help ? <div className="mt-1 truncate text-[11px] text-slate-500">{template.help}</div> : null}
                                                    </button>
                                                ))
                                            )
                                        ) : (
                                            // Detalle de plantilla seleccionada
                                            <div className="p-4 space-y-3">
                                                <div className="whitespace-pre-wrap rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs font-semibold text-[#131E5C]">{templatePreview || tplSelected.help || "Sin texto visible."}</div>
                                                {(tplSelected.fields || []).map((field) => {
                                                    const options = getTemplateFieldOptions(field);
                                                    return (
                                                        <div key={field.key}>
                                                            <div className="mb-1 text-[11px] font-extrabold text-[#131E5C]">{field.label || field.key}</div>
                                                            {options.length ? (
                                                                <select value={tplDraft[field.key] || ""} onChange={(e) => setTplDraft((p) => ({ ...p, [field.key]: e.target.value }))} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none">
                                                                    <option value="" disabled>
                                                                        Selecciona…
                                                                    </option>
                                                                    {options.map((o) => (
                                                                        <option key={o} value={o}>
                                                                            {o}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input value={tplDraft[field.key] || ""} onChange={(e) => setTplDraft((p) => ({ ...p, [field.key]: e.target.value }))} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {!(tplSelected.fields || []).length ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Esta plantilla no requiere parámetros.</div> : null}
                                                <button
                                                    type="button"
                                                    onClick={enviarPlantilla}
                                                    disabled={sendingTemplate || saving}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                    style={{
                                                        backgroundColor: BRAND_BLUE,
                                                    }}>
                                                    {sendingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareShare className="h-4 w-4" />}
                                                    {sendingTemplate ? "Enviando..." : "Enviar plantilla"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <button onClick={closeModal} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button onClick={save} disabled={saving || loadingDetail || telInvalid || (draft?.telefono ? !telIsOk : false)} className="inline-flex items-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C] disabled:opacity-60">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }>
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-4">
                        {touchedSave && missing.length > 0 && (
                            <div className="md:col-span-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <div className="font-extrabold">Faltan campos obligatorios</div>
                                <div className="mt-1 text-xs font-semibold">{missing.map((k) => REQUIRED[k]).join(" · ")}</div>
                            </div>
                        )}
                        <div className="md:col-span-4 grid gap-3 md:grid-cols-3">
                            <Field label="Dealer" icon={Building2}>
                                <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin && userAgencias.length <= 1} className={cls(inputBase, isInvalid("agencia") ? inputBad : inputOk, !isAdmin && contextoDigitalSesion ? "cursor-not-allowed opacity-70" : "")}>
                                    <option value="" disabled>
                                        Selecciona un dealer...
                                    </option>
                                    {(isAdmin ? DEALERS : userAgencias.length > 0 ? userAgencias : DEALERS).map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Asesor Digital" icon={User}>
                                <select value={draft.asesor_digital || ""}
                                    onChange={(e) =>
                                        setDraft((previous) => ({
                                            ...previous,
                                            asesor_digital:
                                                e.target.value,
                                        }))
                                    }
                                    disabled={!isAdmin}
                                    className={cls(inputBase, inputOk, !isAdmin ? "cursor-not-allowed opacity-70" : "")}
                                >
                                    <option value="">— Selecciona —</option>
                                    {ASESORES_DIGITALES.map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Asignado a" icon={User}>
                                <select value={draft.asesor_solicita || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_solicita: e.target.value }))} className={cls(inputBase, inputOk)}>
                                    <option value="">— Selecciona —</option>
                                    {ASESORES.map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <div className="md:col-span-4 grid gap-3 md:grid-cols-2">
                            <Field label="VW de sus sueños">
                                <div>
                                    <select value={draft.cliente_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, cliente_interes: e.target.value }))} className={cls(inputBase, inputOk)}>
                                        <option value="" disabled>
                                            Selecciona un modelo...
                                        </option>
                                        {VEHICULOS.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </Field>

                            <Field label="Año del vehículo" icon={CalendarDays}>
                                <select
                                    value={draft.anio_auto || ""}
                                    onChange={(e) => setDraft((p) => ({ ...p, anio_auto: e.target.value }))}
                                    className={cls(inputBase, inputOk)}
                                >
                                    <option value="">— Selecciona —</option>
                                    {ANIOS_VEHICULO.map((anio) => (
                                        <option key={anio} value={anio}>
                                            {anio}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <div className="md:col-span-4">
                            <Field label="Cliente" icon={User}>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <label className="inline-flex items-center gap-3 text-sm font-bold text-[#131E5C]">
                                            <input type="checkbox" checked={!!draft.tiene_nombre} onChange={(e) => setDraft((p) => ({ ...p, tiene_nombre: e.target.checked, nombre_cliente: e.target.checked ? p.nombre_cliente : "" }))} className="h-4 w-4" />
                                            Nombre del Prospecto
                                        </label>
                                        <input value={draft.nombre_cliente || ""} onChange={(e) => setDraft((p) => ({ ...p, nombre_cliente: e.target.value }))} disabled={!draft.tiene_nombre} className={cls(inputBase, inputOk, !draft.tiene_nombre ? "cursor-not-allowed opacity-70" : "")} placeholder={draft.tiene_nombre ? "Nombre" : "SIN NOMBRE"} />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Teléfono</div>
                                        <input maxLength={12} disabled={telIsNormalized} value={draft.telefono || ""} onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} className={cls(inputBase, telIsNormalized ? "cursor-not-allowed opacity-70" : "", isInvalid("telefono") || telInvalid ? inputBad : inputOk)} />
                                        {isInvalid("telefono") && <div className="mt-1 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                                        {!isInvalid("telefono") && telError && <div className="mt-1 text-xs font-bold text-red-600">{telError}</div>}
                                    </div>
                                    <div className="">
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Estado</div>
                                        <select value={draft.estado || ""} onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {ESTADOS_PROSPECTO.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {normalizeText(draft.estado) === "descalificado" ? (
                                        <div>
                                            <div className="mb-1 text-sm font-bold text-red-700">
                                                Motivo de descalificación *
                                            </div>

                                            <select
                                                value={draft.motivo_descalificacion || ""}
                                                onChange={(e) =>
                                                    setDraft((current) => ({
                                                        ...current,
                                                        motivo_descalificacion: e.target.value,
                                                    }))
                                                }
                                                className={cls(
                                                    inputBase,
                                                    draft.motivo_descalificacion
                                                        ? inputOk
                                                        : "border-red-400 bg-red-50"
                                                )}
                                            >
                                                <option value="">
                                                    — Selecciona el motivo —
                                                </option>

                                                {MOTIVOS_DESCALIFICACION
                                                    .filter(Boolean)
                                                    .map((motivo) => (
                                                        <option key={motivo} value={motivo}>
                                                            {motivo}
                                                        </option>
                                                    ))}
                                            </select>

                                            {!draft.motivo_descalificacion ? (
                                                <div className="mt-1 text-xs font-bold text-red-600">
                                                    Debes seleccionar un motivo.
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Pauta de Origen</div>
                                        {loadingPautas ? (
                                            <div className="mt-2">
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#131E5C]">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando campañas recientes...
                                                </div>
                                            </div>
                                        ) : (
                                            <select value={draft.pauta || ""} onChange={(e) => setDraft((p) => ({ ...p, pauta: e.target.value }))} className={cls(inputBase, inputOk)}>
                                                <option value="">— Selecciona una pauta —</option>
                                                {draft.pauta && !pautasOptions.some((item) => normalizeText(item.value) === normalizeText(draft.pauta)) && <option value={draft.pauta}>{draft.pauta} (actual)</option>}
                                                {pautasOptions.map((item) => (
                                                    <option key={item.value} value={item.value}>
                                                        {item.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Business</div>
                                        <LineaPicker value={draft.linea} onChange={(v) => setDraft((p) => ({ ...p, linea: v }))} />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-1">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Canal de Contacto</div>
                                        <OrigenPicker value={draft.origen} onChange={(v) => setDraft((p) => ({ ...p, origen: v }))} />
                                    </div>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-4">
                            <Field label="Perfil comercial y financiero" icon={Activity}>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Enganche</div>
                                        <input type="number" min="0" inputMode="numeric" value={draft.enganche_monto || ""} onChange={(e) => setDraft((p) => ({ ...p, enganche_monto: e.target.value.replace(/\D/g, "") }))} className={cls(inputBase, inputOk)} placeholder="Ej. 80000" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Presupuesto mensual</div>
                                        <input type="number" min="0" inputMode="numeric" value={draft.presupuesto_mensual || ""} onChange={(e) => setDraft((p) => ({ ...p, presupuesto_mensual: e.target.value.replace(/\D/g, "") }))} className={cls(inputBase, inputOk)} placeholder="Ej. 9000" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Buró</div>
                                        <select value={draft.buro_estado || ""} onChange={(e) => setDraft((p) => ({ ...p, buro_estado: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {BURO_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Forma de pago</div>
                                        <select value={draft.forma_pago || ""} onChange={(e) => setDraft((p) => ({ ...p, forma_pago: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {FORMA_PAGO_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Tipo cliente</div>
                                        <select value={draft.tipo_cliente || ""} onChange={(e) => setDraft((p) => ({ ...p, tipo_cliente: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {TIPO_CLIENTE_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Plazo de compra</div>
                                        <select value={draft.plazo_compra || ""} onChange={(e) => setDraft((p) => ({ ...p, plazo_compra: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {PLAZO_COMPRA_OPTIONS.map((item) => (
                                                <option key={item || "empty"} value={item}>
                                                    {item || "— Selecciona —"}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Uso del vehículo</div>
                                        <input value={draft.uso_vehiculo || ""} onChange={(e) => setDraft((p) => ({ ...p, uso_vehiculo: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Personal, familiar, trabajo..." />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Comprobación ingresos</div>
                                        <input value={draft.comprobacion_ingresos || ""} onChange={(e) => setDraft((p) => ({ ...p, comprobacion_ingresos: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Nómina, estados, negocio..." />
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">ID Cotizacion</div>
                                        <input type="number" min="0" inputMode="numeric" value={draft.id_cotizacion || ""} onChange={(e) => setDraft((p) => ({ ...p, id_cotizacion: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Ej. 80000" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Folio Solicitud Credito</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            // Folio Solicitud Crédito
                                            value={draft.folio_solicitud_credito || ""}
                                            onChange={(e) => setDraft((p) => ({ ...p, folio_solicitud_credito: e.target.value }))}
                                            className={cls(inputBase, inputOk)}
                                            placeholder="Ej. 80000"
                                        />
                                        <select value={draft.solicitud_credito_estado || ""} onChange={(e) => setDraft((p) => ({ ...p, solicitud_credito_estado: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {SOLICITUD_CREDITO.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">VIN Facturado</div>
                                        <input value={draft.vin_facturado || ""} onChange={(e) => setDraft((p) => ({ ...p, vin_facturado: e.target.value.toUpperCase() }))} className={cls(inputBase, inputOk)} placeholder="A8XAS8FSF8FG2EU" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">¿VIN Entregado?</div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    vin_estatus_entrega: p.vin_estatus_entrega === "entregado" ? "cancelado" : "entregado",
                                                }))
                                            }
                                            className={`relative flex h-9 w-28 items-center rounded-full px-1 transition-all duration-300 ${draft.vin_estatus_entrega === "entregado" ? "bg-emerald-500" : "bg-red-500"}`}>
                                            <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md transition-all duration-300 ${draft.vin_estatus_entrega === "entregado" ? "translate-x-[76px] text-emerald-600" : "translate-x-0 text-red-600"}`}>{draft.vin_estatus_entrega === "entregado" ? "✓" : "×"}</span>
                                        </button>
                                        <div className="mt-1 text-xs font-semibold text-[#515778]">
                                            Estado actual: <span className={draft.vin_estatus_entrega === "entregado" ? "text-emerald-600" : "text-red-600"}>{draft.vin_estatus_entrega === "entregado" ? "Entregado" : "Cancelado"}</span>
                                        </div>
                                    </div>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2 lg:col-span-4 sm:col-span-4">
                            <Field label="Evidencias" icon={Paperclip}>
                                <div className="space-y-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
                                        className="hidden"
                                        onChange={(e) => {
                                            handleAddFiles(e.target.files);
                                            e.target.value = "";
                                        }}
                                    />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-4 py-6 text-center text-[#131E5C] transition hover:bg-[#131E5C]/10 sm:flex-row sm:text-left">
                                        <UploadCloud className="h-6 w-6" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-extrabold">Agregar fotos, videos o archivos</div>
                                            <div className="text-xs font-semibold text-slate-500">Puedes seleccionar varios archivos al mismo tiempo. Límite sugerido: 50 MB por archivo.</div>
                                        </div>
                                    </button>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">Total: {totalEvidenciasDraft}</span>
                                        {(draft.delete_evidencia_ids || []).length > 0 ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Por eliminar: {draft.delete_evidencia_ids.length}</span> : null}
                                        {(draft.evidencias_nuevas || []).length > 0 ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">Nuevas: {draft.evidencias_nuevas.length}</span> : null}
                                    </div>
                                    {(draft.evidencias_existentes?.length || 0) > 0 ? (
                                        <div>
                                            <div className="mb-2 text-sm font-extrabold text-[#131E5C]">Evidencias guardadas</div>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                                {draft.evidencias_existentes.map((item) => (
                                                    <EvidenceCard key={`existente-${item.id}`} item={item} onRemove={() => removeEvidenciaExistente(item.id)} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {(draft.evidencias_nuevas?.length || 0) > 0 ? (
                                        <div>
                                            <div className="mb-2 text-sm font-extrabold text-[#131E5C]">Evidencias nuevas</div>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                                {draft.evidencias_nuevas.map((item) => (
                                                    <EvidenceCard key={item._tmpId} item={item} onRemove={() => removeNuevaEvidencia(item._tmpId)} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {totalEvidenciasDraft === 0 ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">Aún no has agregado evidencias a este avalúo.</div> : null}
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Comentarios Adicionales" icon={FileText}>
                                <textarea value={draft.comentarios || ""} onChange={(e) => setDraft((p) => ({ ...p, comentarios: e.target.value }))} rows={4} className={cls(inputBase, inputOk)} />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Resumen de conversación" icon={ClipboardCheck}>
                                <textarea value={draft.resumen || ""} disabled rows={5} className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />
                                {draft.resumen_actualizado_at && (
                                    <div className="mt-2 text-xs font-semibold text-slate-500">
                                        Última actualización: {fmtDTIntl(draft.resumen_actualizado_at)}
                                        {draft.resumen_fuente ? ` · ${draft.resumen_fuente}` : ""}
                                    </div>
                                )}
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Modal Resumen */}
            <Modal
                open={openSummaryModal}
                title={summaryInfo ? `Resumen IA · ${summaryInfo.nombre || `Prospecto ${summaryInfo.id_exp}`}` : "Resumen IA"}
                onClose={closeSummaryModal}
                footer={
                    <button onClick={closeSummaryModal} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                        <X className="h-4 w-4" /> Cerrar
                    </button>
                }>
                {summaryInfo && (
                    <div className="grid gap-3">
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
                    </div>
                )}
            </Modal>
            {/* Modal Agenda */}
            <Modal
                open={openAgendaModal}
                title="Agendar cita"
                onClose={closeAgendaModal}
                footer={
                    <>
                        <button onClick={closeAgendaModal} className="inline-flex items-center gap-2 rounded-2xl bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                            <X className="h-4 w-4" /> Cerrar
                        </button>
                        <button onClick={handleAgendar} disabled={!agendaInfo || savingo} className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C] disabled:opacity-60">
                            <CalendarCheck className="h-4 w-4" /> {savingo ? "Guardando..." : "Agendar"}
                        </button>
                    </>
                }>
                {agendaInfo && (
                    <div className="grid gap-3 md:grid-cols-3">
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
                                {ASESORES.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Tipo de cita" icon={LayoutList}>
                            <select value={drafter.tipo_cita || ""} onChange={(e) => setDrafter((p) => ({ ...p, tipo_cita: e.target.value }))} className={cls(inputBase, inputOk)}>
                                <option value="">— Selecciona —</option>
                                {["Prueba de Manejo", "Tradicional", "Digital"].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        {errorMsg && <div className="md:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMsg}</div>}
                    </div>
                )}
            </Modal>
        </div>
    );
}