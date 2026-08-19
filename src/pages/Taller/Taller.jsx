// src/pages/Taller/Taller.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Plus,
    Search,
    X,
    Save,
    User,
    CarFront,
    CalendarDays,
    ClipboardList,
    Loader2,
    Phone,
    Building2,
    UserCog,
    Clock3,
    Table2,
    Wrench,
    CheckCircle2,
    ListChecks,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    GripVertical,
    CalendarClock,
    CalendarCheck,
    CalendarX,
    Car,
    ClipboardCheck,
    Coffee,
    FileSignature,
    Filter,
    GraduationCap,
    History,
    KeyRound,
    Layers,
    MapPin,
    Megaphone,
    PackageOpen,
    ReceiptText,
    ScanSearch,
    Sparkles,
    Workflow,
} from "lucide-react";

import { apiHojaIngresos } from "../../lib/apiHojaIngresos";
import { useAuth } from "../../auth/AuthContext";
import TallerLegacy from "./TallerLegacy";

const BRAND_BLUE = "#001E50";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

const TECNICOS_POR_DEALER = {
    "VW Cordoba": [
        "CIRO AUGUSTO PEREZ",
        "DIEGO EMETERIO",
        "ANGEL SORIANO",
        "MISSAEL HERNANDEZ",
        "BLADIMIR CASTILLO",
        "VICTOR VAZQUEZ",
    ],
    "VW Orizaba": [
        "JOSE IGNACIO FIGUEROA",
        "CARLOS URIEL ORTEGA",
        "SALVADOR MARTINEZ",
        "TOMAS SANCHEZ",
    ],
    "VW Poza Rica": [],
    "VW Tuxtepec": [],
    "VW Tuxpan": [],
};

const TODOS_TECNICOS_OFICIALES = Object.values(TECNICOS_POR_DEALER).flat();

const TIPOS_SERVICIO = [
    "Mtto. 15 km",
    "Mtto. 30 km",
    "Mtto. 45 km",
    "Mtto. 60 km",
    "Mtto. 75 km",
    "Mtto. 90 km",
    "Diagnóstico",
    "Garantía",
    "Hojalatería y pintura",
    "Campaña",
    "Reclamación",
    "Otro",
];

const ETAPAS_PROCESO = [
    "Ingreso con Cita",
    "Ingreso Sin Cita",
    "En espera de Servicio",
    "En espera de trabajo",
    "Trabajo en Proceso",
    "En Control de Calidad",
    "En Lavado",
    "En Espera de Entrega",
    "Órdenes por Facturar",
];

const ETAPAS_WIP = [
    "En espera de Diagnóstico",
    "En espera de DISS",
    "En espera de autorización de presupuesto",
    "En espera de refacciones",
];

const ETAPAS_TERMINADO = ["Terminado", "Autos terminados no entregados"];
const TODAS_ETAPAS = [...ETAPAS_PROCESO, ...ETAPAS_WIP, ...ETAPAS_TERMINADO];

const ETAPAS_FLUJO_TRABAJO = [
    {
        id: "clientes-con-cita",
        numero: 1,
        nombre: "Clientes con Cita",
        icon: CalendarCheck,
        color: "#14B8A6",
        etapas: ["Ingreso con Cita"],
    },
    {
        id: "clientes-sin-cita",
        numero: 2,
        nombre: "Clientes sin Cita",
        icon: CalendarX,
        color: "#06B6D4",
        etapas: ["Ingreso Sin Cita"],
    },
    {
        id: "recepcion",
        numero: 3,
        nombre: "Recepción",
        icon: ClipboardList,
        color: "#3B82F6",
        etapas: ["En espera de trabajo"],
    },
    {
        id: "espera-servicio",
        numero: 4,
        nombre: "En espera de Servicio",
        icon: Car,
        color: "#6366F1",
        etapas: ["En espera de Servicio"],
    },
    {
        id: "espera-diagnostico",
        numero: 5,
        nombre: "En espera de Diagnóstico",
        icon: ScanSearch,
        color: "#D5232A",
        etapas: ["En espera de Diagnóstico"],
    },
    {
        id: "espera-diss",
        numero: 6,
        nombre: "En espera de DISS",
        icon: MapPin,
        color: "#D5232A",
        etapas: ["En espera de DISS"],
    },
    {
        id: "espera-autorizacion",
        numero: 7,
        nombre: "En espera de Autorización",
        icon: FileSignature,
        color: "#D5232A",
        etapas: [
            "En espera de autorización de presupuesto",
            "En espera de Autorización",
        ],
    },
    {
        id: "espera-piezas",
        numero: 8,
        nombre: "En espera de Piezas",
        icon: PackageOpen,
        color: "#D5232A",
        etapas: ["En espera de refacciones", "En espera de Piezas"],
    },
    {
        id: "reparacion",
        numero: 9,
        nombre: "En Reparación",
        icon: Wrench,
        color: "#EC4899",
        etapas: ["Trabajo en Proceso"],
    },
    {
        id: "control-calidad",
        numero: 10,
        nombre: "Control de Calidad",
        icon: ClipboardCheck,
        color: "#EC4899",
        etapas: ["En Control de Calidad", "En espera de Control de Calidad"],
    },
    {
        id: "lavado-preparacion",
        numero: 11,
        nombre: "Lavado / Preparación",
        icon: Sparkles,
        color: "#EC4899",
        etapas: ["En Lavado", "Espera de Lavado"],
    },
    {
        id: "terminados-no-entregados",
        numero: 12,
        nombre: "Autos Terminados No Entregados",
        icon: KeyRound,
        color: "#D5232A",
        etapas: [
            "Autos terminados no entregados",
            "En Espera de Entrega",
            "Terminado",
        ],
    },
    {
        id: "ordenes-facturar",
        numero: 13,
        nombre: "Órdenes por Facturar",
        icon: ReceiptText,
        color: "#D5232A",
        etapas: ["Órdenes por Facturar"],
    },
];

const ESTATUS_AGENDA = ["Programado", "Terminado"];

const TIPOS_BLOQUE = [
    { value: "trabajo", label: "Trabajo de taller", icon: Wrench },
    { value: "comida", label: "Comida", icon: Coffee },
    { value: "capacitacion", label: "Capacitación", icon: GraduationCap },
];

const HORA_INICIO_AGENDA = 8;
const MINUTO_INICIO_AGENDA = 30;
const HORA_FIN_AGENDA = 20;
const MINUTOS_INICIO_AGENDA =
    HORA_INICIO_AGENDA * 60 + MINUTO_INICIO_AGENDA;
const MINUTOS_FIN_AGENDA = HORA_FIN_AGENDA * 60;
const MINUTOS_TOTALES_AGENDA =
    MINUTOS_FIN_AGENDA - MINUTOS_INICIO_AGENDA;
const INTERVALO_MINUTOS = 15;
const TOTAL_INTERVALOS =
    MINUTOS_TOTALES_AGENDA / INTERVALO_MINUTOS;
const HORA_INICIO_TEXTO = "08:30";

const ANCHO_TECNICO = 250;
const ANCHO_MINIMO_LINEA = 1850;
const ALTURA_CARRIL = 82;

const CONTENEDORES_TALLER = {
    izquierda: [
        {
            id: "proximo-trabajo",
            titulo: "Próximo Trabajo",
            etapaDestino: "En espera de trabajo",
            etapas: ["En espera de trabajo"],
            color: "#6B6865",
            icon: Clock3,
        },
        {
            id: "trabajo-proceso",
            titulo: "Trabajo en Proceso",
            etapaDestino: "Trabajo en Proceso",
            etapas: ["Trabajo en Proceso"],
            color: "#6B6865",
            icon: Wrench,
        },
        {
            id: "clientes-cita",
            titulo: "Clientes con Cita",
            etapaDestino: "Ingreso con Cita",
            etapas: ["Ingreso con Cita"],
            color: "#6B6865",
            icon: CalendarDays,
        },
        {
            id: "clientes-sin-cita",
            titulo: "Clientes sin Cita",
            etapaDestino: "Ingreso Sin Cita",
            etapas: ["Ingreso Sin Cita"],
            color: "#171717",
            icon: User,
        },
        {
            id: "espera-servicio",
            titulo: "En espera de Servicio",
            etapaDestino: "En espera de Servicio",
            etapas: ["En espera de Servicio"],
            color: "#6B6865",
            icon: CarFront,
        },
    ],
    derecha: [
        {
            id: "control-calidad",
            titulo: "En espera de Control de Calidad",
            etapaDestino: "En Control de Calidad",
            etapas: ["En Control de Calidad", "En espera de Control de Calidad"],
            color: "#6B6865",
            icon: CheckCircle2,
        },
        {
            id: "espera-lavado",
            titulo: "Espera de Lavado",
            etapaDestino: "En Lavado",
            etapas: ["En Lavado", "Espera de Lavado"],
            color: "#6B6865",
            icon: CarFront,
        },
        {
            id: "ordenes-facturar",
            titulo: "Órdenes por Facturar",
            etapaDestino: "Órdenes por Facturar",
            etapas: ["Órdenes por Facturar"],
            color: "#6B6865",
            icon: ClipboardList,
        },
    ],
    inferior: [
        {
            id: "espera-diagnostico",
            titulo: "En espera de Diagnóstico",
            etapaDestino: "En espera de Diagnóstico",
            etapas: ["En espera de Diagnóstico"],
            color: "#D5232A",
            icon: Wrench,
        },
        {
            id: "espera-diss",
            titulo: "En espera de DISS",
            etapaDestino: "En espera de DISS",
            etapas: ["En espera de DISS"],
            color: "#D5232A",
            icon: ClipboardList,
        },
        {
            id: "espera-autorizacion",
            titulo: "En espera de Autorización",
            etapaDestino: "En espera de autorización de presupuesto",
            etapas: [
                "En espera de autorización de presupuesto",
                "En espera de Autorización",
            ],
            color: "#D5232A",
            icon: CheckCircle2,
        },
        {
            id: "espera-piezas",
            titulo: "En espera de Piezas",
            etapaDestino: "En espera de refacciones",
            etapas: ["En espera de refacciones", "En espera de Piezas"],
            color: "#D5232A",
            icon: ListChecks,
        },
        {
            id: "terminados-no-entregados",
            titulo: "Autos terminados no entregados",
            etapaDestino: "Autos terminados no entregados",
            etapas: ["Autos terminados no entregados", "En Espera de Entrega"],
            color: "#D5232A",
            icon: CarFront,
        },
    ],
};

const TODOS_CONTENEDORES = Object.values(CONTENEDORES_TALLER).flat();

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizeKey(value) {
    return normalizeStr(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function uniqueStrings(values) {
    const seen = new Set();

    return values.filter((value) => {
        const normalized = normalizeKey(value);
        if (!normalized || seen.has(normalized)) return false;

        seen.add(normalized);
        return true;
    });
}

function getOfficialTechniciansByDealer(dealer) {
    if (!dealer || dealer === "Todos") {
        return TODOS_TECNICOS_OFICIALES;
    }

    const matchingDealer = Object.keys(TECNICOS_POR_DEALER).find(
        (configuredDealer) =>
            normalizeKey(configuredDealer) === normalizeKey(dealer),
    );

    return matchingDealer
        ? TECNICOS_POR_DEALER[matchingDealer]
        : [];
}

function pad2(value) {
    return String(value).padStart(2, "0");
}

function toDTLocal(value) {
    if (!value) return "";

    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
        return text.slice(0, 16);
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function toYMD(value) {
    if (!value) return "";

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toHHMM(value) {
    if (!value) return "";

    const text = String(value).trim();
    const simpleMatch = text.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
        const hour = Number(simpleMatch[1]);
        const minute = Number(simpleMatch[2]);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return `${pad2(hour)}:${pad2(minute)}`;
        }
    }

    const local = toDTLocal(value);
    return local ? local.slice(11, 16) : "";
}

function timeToMinutes(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return hour * 60 + minute;
}

function minutesToTime(minutes) {
    const safeMinutes = Math.max(0, Math.min(23 * 60 + 59, Number(minutes) || 0));
    return `${pad2(Math.floor(safeMinutes / 60))}:${pad2(safeMinutes % 60)}`;
}

function roundToQuarter(minutes) {
    return Math.round(minutes / INTERVALO_MINUTOS) * INTERVALO_MINUTOS;
}

function clampAgendaStart(value) {
    const parsed = timeToMinutes(value);
    const fallback = MINUTOS_INICIO_AGENDA;
    const minutes = parsed === null ? fallback : roundToQuarter(parsed);
    return minutesToTime(
        Math.max(
            MINUTOS_INICIO_AGENDA,
            Math.min(MINUTOS_FIN_AGENDA - INTERVALO_MINUTOS, minutes),
        ),
    );
}

function calculateEndTime(startTime, durationHours = 1) {
    const start = timeToMinutes(startTime) ?? MINUTOS_INICIO_AGENDA;
    const duration = Math.max(
        INTERVALO_MINUTOS,
        roundToQuarter(Math.max(0.25, Number(durationHours) || 1) * 60),
    );
    return minutesToTime(Math.min(MINUTOS_FIN_AGENDA, start + duration));
}

function addDaysToYMD(ymd, days) {
    const [year, month, day] = String(ymd).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return toYMD(date);
}

function formatDate(value) {
    const local = toDTLocal(value);
    return local ? local.replace("T", " ") : "—";
}

function formatLongDate(ymd) {
    const [year, month, day] = String(ymd).split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return "Fecha no válida";

    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function getMonthName(ymd) {
    const [year, month, day] = String(ymd).split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-MX", { month: "long" })
        .format(date)
        .toUpperCase();
}

function getClienteNombre(row) {
    return (
        row?.cliente_nombre ||
        row?.cliente?.nombre ||
        row?.nombre_cliente ||
        "Sin nombre"
    );
}

function getTelefono(row) {
    return row?.telefono || row?.cliente?.telefono || "—";
}

function getCorreo(row) {
    return (
        row?.correo ||
        row?.correo_electronico ||
        row?.cliente?.correo ||
        row?.cliente?.correo_electronico ||
        ""
    );
}

function getDefaultEtapa(row) {
    if (row?.citado === true || String(row?.citado).toLowerCase() === "true") {
        return "Ingreso con Cita";
    }
    return "Ingreso Sin Cita";
}

function splitTrabajos(text) {
    const raw = normalizeStr(text);
    if (!raw) return ["Sin trabajo asignado"];

    return raw
        .split(/\s*(?:\+|,|;|\/|\by\b)\s*/i)
        .map((item) => normalizeStr(item))
        .filter(Boolean);
}

function getOrdenKey(row) {
    if (row?.__manual_id) return `manual:${row.__manual_id}`;

    const noOrden = normalizeStr(row?.no_orden);
    if (noOrden) return `orden:${normalizeKey(noOrden)}`;

    const telefono = normalizeStr(getTelefono(row));
    const vin = normalizeStr(row?.vin);
    const cliente = normalizeStr(getClienteNombre(row));
    return `cliente:${normalizeKey(cliente)}|tel:${normalizeKey(telefono)}|vin:${normalizeKey(vin)}`;
}

function canonicalTechnician(value) {
    const key = normalizeKey(value);

    return (
        TODOS_TECNICOS_OFICIALES.find(
            (technician) => normalizeKey(technician) === key,
        ) || normalizeStr(value)
    );
}

function inferBlockType(row, saved) {
    if (["trabajo", "comida", "capacitacion"].includes(saved?.tipo_bloque)) {
        return saved.tipo_bloque;
    }

    const searchable = normalizeKey(
        [row?.tipo_cita, row?.pauta, row?.comentarios, row?.comentarios_taller]
            .filter(Boolean)
            .join(" "),
    );

    if (searchable.includes("comida")) return "comida";
    if (searchable.includes("capacitacion")) return "capacitacion";
    return "trabajo";
}

function inferScheduleDate(row, saved) {
    return (
        toYMD(saved?.fecha_programada) ||
        toYMD(row?.fecha_programada) ||
        toYMD(row?.fecha_cita) ||
        toYMD(row?.fecha_ingreso) ||
        toYMD(row?.created_at) ||
        toYMD(new Date())
    );
}

function inferStartTime(row, saved) {
    const raw =
        saved?.hora_inicio ||
        row?.hora_inicio ||
        row?.horario_inicio ||
        row?.hora_cita ||
        toHHMM(row?.fecha_cita) ||
        toHHMM(row?.fecha_ingreso) ||
        HORA_INICIO_TEXTO;

    return clampAgendaStart(raw);
}

function inferEndTime(row, saved, startTime, hours) {
    const raw = saved?.hora_fin || row?.hora_fin || row?.horario_fin;
    const parsedRaw = toHHMM(raw);

    if (parsedRaw) {
        const endMinutes = timeToMinutes(parsedRaw);
        const startMinutes = timeToMinutes(startTime);
        if (
            endMinutes !== null &&
            startMinutes !== null &&
            endMinutes > startMinutes &&
            endMinutes <= MINUTOS_FIN_AGENDA
        ) {
            return minutesToTime(roundToQuarter(endMinutes));
        }
    }

    return calculateEndTime(startTime, hours || 1);
}

function getInitials(name) {
    return normalizeStr(name)
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "T";
}

function getActivityLabel(order) {
    if (order.tipo_bloque === "comida") {
        return "COMIDA";
    }

    if (order.tipo_bloque === "capacitacion") {
        return "CAPACITACIÓN";
    }

    const trabajos = (order.subtrabajos || [])
        .map((trabajo) => trabajo.nombre)
        .filter(Boolean)
        .join(", ");

    return [
        order.no_orden || order.cliente,
        order.modelo,
        trabajos,
    ]
        .filter(Boolean)
        .join(" · ");
}

const WORK_TYPE_META = {
    reparacion: {
        label: "Reparación",
        icon: Wrench,
        backgroundColor: "#FEE2E2",
        borderColor: "#DC2626",
        color: "#991B1B",
    },
    diagnostico: {
        label: "Diagnóstico",
        icon: ScanSearch,
        backgroundColor: "rgba(194, 221, 252, 0.9)",
        borderColor: "#3471eb",
        color: "#0e1e41",
    },
    campana: {
        label: "Campaña",
        icon: Megaphone,
        backgroundColor: "#d3a0e9",
        borderColor: "#3d0865",
        color: "#3b1a69",
    },
    mantenimiento: {
        label: "Mantenimiento",
        icon: ClipboardCheck,
        backgroundColor: "#DCFCE7",
        borderColor: "#16A34A",
        color: "#14532D",
    },
};

function getWorkTypeKey(order) {
    const searchable = normalizeKey(
        [
            order?.tipo_servicio,
            ...(order?.subtrabajos || []).map((work) => work?.nombre),
        ]
            .filter(Boolean)
            .join(" "),
    );

    if (searchable.includes("campana")) return "campana";
    if (searchable.includes("diagnost")) return "diagnostico";

    if (
        searchable.includes("mtto") ||
        searchable.includes("mantenimiento") ||
        searchable.includes("servicio preventivo")
    ) {
        return "mantenimiento";
    }

    return "reparacion";
}

function getWorkTypeMeta(order) {
    return WORK_TYPE_META[getWorkTypeKey(order)];
}

const LEGEND_CHIPS = {
    reparacion: { label: "Reparación", icon: Wrench, backgroundColor: "#FECACA", borderColor: "#EF4444", color: "#991B1B" },
    diagnostico: { label: "Diagnóstico", icon: ScanSearch, backgroundColor: "#DBEAFE", borderColor: "#3B82F6", color: "#1E3A8A" },
    campana: { label: "Campaña", icon: Megaphone, backgroundColor: "#EDE9FE", borderColor: "#8B5CF6", color: "#5B21B6" },
    mantenimiento: { label: "Mantenimiento", icon: ClipboardCheck, backgroundColor: "#D1FAE5", borderColor: "#10B981", color: "#065F46" },
    comida: { label: "Comida", icon: Coffee, backgroundColor: "#CFFAFE", borderColor: "#06B6D4", color: "#155E75" },
    capacitacion: { label: "Capacitación", icon: GraduationCap, backgroundColor: "#FFEDD5", borderColor: "#F97316", color: "#9A3412" },
};

function getCategoryKey(order) {
    if (order?.tipo_bloque === "comida") return "comida";
    if (order?.tipo_bloque === "capacitacion") return "capacitacion";
    return getWorkTypeKey(order);
}

function getActivityStyles(order) {
    if (order.tipo_bloque === "comida") {
        return {
            backgroundColor: "#0E7490",
            borderColor: "#155E75",
            color: "#FFFFFF",
        };
    }

    if (order.tipo_bloque === "capacitacion") {
        return {
            backgroundColor: "#EA580C",
            borderColor: "#C2410C",
            color: "#FFFFFF",
        };
    }

    const workType = getWorkTypeMeta(order);

    return {
        backgroundColor: workType.backgroundColor,
        borderColor: workType.borderColor,
        color: workType.color,
    };
}

function getActivityPosition(order) {
    const start = Math.max(
        MINUTOS_INICIO_AGENDA,
        timeToMinutes(order.hora_inicio) ?? MINUTOS_INICIO_AGENDA,
    );
    const end = Math.min(
        MINUTOS_FIN_AGENDA,
        timeToMinutes(order.hora_fin) ?? start + INTERVALO_MINUTOS,
    );

    const safeEnd = Math.max(start + INTERVALO_MINUTOS, end);
    const left = ((start - MINUTOS_INICIO_AGENDA) / MINUTOS_TOTALES_AGENDA) * 100;
    const width = ((safeEnd - start) / MINUTOS_TOTALES_AGENDA) * 100;

    return {
        left: `${left}%`,
        width: `${Math.max(width, 0.9)}%`,
    };
}

function assignLanes(orders) {
    const sorted = [...orders].sort((a, b) => {
        const startA = timeToMinutes(a.hora_inicio) ?? 0;
        const startB = timeToMinutes(b.hora_inicio) ?? 0;
        return startA - startB;
    });

    const laneEndTimes = [];
    const assigned = sorted.map((order) => {
        const start = timeToMinutes(order.hora_inicio) ?? MINUTOS_INICIO_AGENDA;
        const end = timeToMinutes(order.hora_fin) ?? start + INTERVALO_MINUTOS;

        let lane = laneEndTimes.findIndex((laneEnd) => laneEnd <= start);
        if (lane === -1) {
            lane = laneEndTimes.length;
            laneEndTimes.push(end);
        } else {
            laneEndTimes[lane] = end;
        }

        return { ...order, lane };
    });

    return {
        orders: assigned,
        laneCount: Math.max(1, laneEndTimes.length),
    };
}


function orderBelongsToContainer(order, container) {
    const currentStage = normalizeKey(order?.etapa);
    return container.etapas.some(
        (stage) => normalizeKey(stage) === currentStage,
    );
}

function orderMatchesEtapas(order, etapas) {
    const currentStage = normalizeKey(order?.etapa);
    return etapas.some((stage) => normalizeKey(stage) === currentStage);
}

function DraggableOrderCard({ order, onEdit }) {
    const workType = order.tipo_bloque === "trabajo" ? getWorkTypeMeta(order) : null;

    function handleDragStart(event) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-taller-order-id", order.id);
        event.dataTransfer.setData("text/plain", order.id);
    }

    const cliente =
        order.cliente && order.cliente !== "Sin nombre" ? order.cliente : "";
    const vehiculo = [order.modelo, order.vin].filter(Boolean).join(" · ");

    return (
        <article
            draggable
            onDragStart={handleDragStart}
            onClick={() => onEdit(order)}
            onDoubleClick={() => onEdit(order)}
            className="cursor-grab rounded-lg border px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,.05)] transition hover:shadow-md active:cursor-grabbing"
            style={
                workType
                    ? {
                        backgroundColor: workType.backgroundColor,
                        borderColor: workType.borderColor,
                    }
                    : undefined
            }
            title="Arrastra esta orden a otra etapa"
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className="truncate text-[11px] font-black tracking-wide"
                    style={{ color: workType ? workType.color : "#334155" }}
                >
                    {order.no_orden ? `OR ${order.no_orden}` : "SIN ORDEN"}
                </span>
                {workType ? (
                    <span
                        className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black text-white"
                        style={{ backgroundColor: workType.borderColor }}
                    >
                        <workType.icon className="h-3 w-3" />
                        {workType.label}
                    </span>
                ) : null}
            </div>

            <div className="mt-1.5 truncate text-[13px] font-black leading-tight text-slate-900">
                {cliente || vehiculo || "Sin datos"}
            </div>

            {vehiculo && cliente ? (
                <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                    {vehiculo}
                </div>
            ) : null}

            <div className="mt-1.5 flex items-center justify-between gap-2">
                {order.tecnico ? (
                    <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-bold text-slate-600">
                        <UserCog className="h-3 w-3 shrink-0" />
                        <span className="truncate">{order.tecnico}</span>
                    </span>
                ) : (
                    <span />
                )}
                {order.hora_inicio ? (
                    <span
                        className="inline-flex shrink-0 items-center gap-1 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-black tabular-nums"
                        style={{ color: workType ? workType.color : "#64748B" }}
                    >
                        <Clock3 className="h-3 w-3" />
                        {order.hora_inicio}
                    </span>
                ) : null}
            </div>
        </article>
    );
}
function StageContainer({
    container,
    orders,
    onClose,
    onMoveOrder,
    onEdit,
    bottom = false,
}) {
    const [dragOver, setDragOver] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");

    const filteredOrders = useMemo(() => {
        const query = normalizeKey(filterQuery);

        if (!query) return orders;

        return orders.filter((order) => {
            const cliente = normalizeKey(order.cliente);
            const tecnico = normalizeKey(order.tecnico);

            return (
                (cliente && cliente.includes(query)) ||
                (tecnico && tecnico.includes(query))
            );
        });
    }, [orders, filterQuery]);

    const sortedOrders = useMemo(() => {
        const withTime = [];
        const withoutTime = [];

        filteredOrders.forEach((order) => {
            const minutes = timeToMinutes(order.hora_inicio);

            if (minutes === null) withoutTime.push(order);
            else withTime.push({ order, minutes });
        });

        withTime.sort((a, b) => a.minutes - b.minutes);
        withoutTime.sort((a, b) =>
            normalizeStr(a.cliente).localeCompare(normalizeStr(b.cliente)),
        );

        return withTime.map((entry) => entry.order).concat(withoutTime);
    }, [filteredOrders]);

    function handleDrop(event) {
        event.preventDefault();
        const orderId =
            event.dataTransfer.getData("application/x-taller-order-id") ||
            event.dataTransfer.getData("text/plain");
        setDragOver(false);
        if (orderId) onMoveOrder(orderId, container.etapaDestino);
    }

    return (
        <section
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOver(true);
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false);
            }}
            onDrop={handleDrop}
            className={[
                "flex h-[300px] w-[270px] flex-col overflow-hidden rounded-lg border transition",
                dragOver
                    ? "border-[#0A64FF] bg-blue-50/80 ring-2 ring-[#0A64FF]/10"
                    : "border-slate-100 bg-[#F8FAFC]",
            ].join(" ")}
        >
            {container.color ? (
                <span
                    className="block h-1 w-full shrink-0"
                    style={{ backgroundColor: container.color }}
                />
            ) : null}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-2.5 py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                    {container.icon ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
                            <container.icon className="h-3.5 w-3.5" />
                        </span>
                    ) : null}
                    <span className="truncate text-[9px] font-black text-slate-700">
                        {container.titulo}
                    </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setShowFilter((value) => !value)}
                        className={[
                            "flex h-5 w-5 items-center justify-center rounded transition",
                            showFilter || filterQuery
                                ? "bg-[#0A64FF] text-white"
                                : "text-slate-400 hover:bg-slate-200 hover:text-slate-700",
                        ].join(" ")}
                        title={showFilter ? "Ocultar filtro" : "Filtrar por cliente o técnico"}
                    >
                        <Filter className="h-3 w-3" />
                    </button>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0A64FF] px-1 text-[7px] font-black text-white">
                        {sortedOrders.length}
                    </span>
                    {onClose ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            title="Cerrar bandeja"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    ) : null}
                </div>
            </div>

            {showFilter ? (
                <div className="flex items-center gap-1.5 border-b border-slate-100 bg-white px-2 py-1.5">
                    <Search className="h-3 w-3 shrink-0 text-slate-400" />
                    <input
                        autoFocus
                        value={filterQuery}
                        onChange={(event) => setFilterQuery(event.target.value)}
                        placeholder="Buscar cliente o técnico..."
                        className="w-full min-w-0 bg-transparent text-[10px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {filterQuery ? (
                        <button
                            type="button"
                            onClick={() => setFilterQuery("")}
                            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    ) : null}
                </div>
            ) : null}

            <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
                {sortedOrders.map((order) => (
                    <DraggableOrderCard key={order.id} order={order} onEdit={onEdit} />
                ))}
                {orders.length === 0 ? (
                    <div className="flex h-[56px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/70 px-2 text-center text-[9px] font-bold text-slate-300">
                        Suelta aquí
                    </div>
                ) : sortedOrders.length === 0 ? (
                    <div className="flex h-[56px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/70 px-2 text-center text-[9px] font-bold text-slate-400">
                        Sin coincidencias
                    </div>
                ) : null}
            </div>
        </section>
    );
}
function SideContainerPanel({
    side,
    title,
    open,
    containers,
    orders,
    selectedDate,
    panelState,
    onTogglePanel,
    onToggleContainer,
    onMoveOrder,
    onEdit,
}) {
    if (!open) {
        return (
            <button
                type="button"
                onClick={() => onTogglePanel(side)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-[#001E50] shadow-sm hover:bg-slate-50 xl:h-[72vh] xl:w-11 xl:flex-col"
                title={`Abrir ${title}`}
            >
                {side === "izquierda" ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
                <span className="xl:[writing-mode:vertical-rl] xl:rotate-180">
                    {title}
                </span>
            </button>
        );
    }

    const totalOrders = containers.reduce(
        (sum, container) =>
            sum +
            orders.filter((order) => {
                if (!orderBelongsToContainer(order, container)) return false;
                if (selectedDate) {
                    return order.fecha_programada === selectedDate;
                }
                return true;
            }).length,
        0,
    );

    return (
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:w-[300px]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-3">
                <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">
                        Flujo de trabajo
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-sm font-black text-[#001E50]">
                            {title}
                        </span>
                        <span className="rounded-full bg-[#EAF2FF] px-2 py-0.5 text-[9px] font-black text-[#001E50]">
                            {totalOrders}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onTogglePanel(side)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-[#001E50]/20 hover:bg-[#EAF2FF] hover:text-[#001E50]"
                    title="Contraer panel"
                >
                    {side === "izquierda" ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
            </div>

            <div className="max-h-[calc(72vh-58px)] space-y-2 overflow-y-auto bg-[#F7F9FC] p-2.5">
                {containers.map((container) => (
                    <StageContainer
                        key={container.id}
                        container={container}
                        orders={orders.filter((order) => {
                            if (!orderBelongsToContainer(order, container)) return false;
                            if (selectedDate) {
                                return order.fecha_programada === selectedDate;
                            }
                            return true;
                        })}
                        open={panelState.contenedores?.[container.id] !== false}
                        onToggle={() => onToggleContainer(container.id)}
                        onMoveOrder={onMoveOrder}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </aside>
    );
}

function BottomContainerPanel({
    open,
    containers,
    orders,
    selectedDate,
    panelState,
    onTogglePanel,
    onToggleContainer,
    onMoveOrder,
    onEdit,
}) {
    const totalOrders = containers.reduce(
        (sum, container) =>
            sum +
            orders.filter((order) => {
                if (!orderBelongsToContainer(order, container)) return false;
                if (selectedDate) {
                    return order.fecha_programada === selectedDate;
                }
                return true;
            }).length,
        0,
    );

    return (
        <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => onTogglePanel("inferior")}
                className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left"
            >
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#D5232A]">
                        <ListChecks className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">
                            Flujo fuera de proceso
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                            <span className="truncate text-sm font-black text-[#001E50]">
                                Esperas y bloqueos
                            </span>
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-black text-[#D5232A]">
                                {totalOrders}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="hidden text-[10px] font-bold text-slate-400 sm:block">
                        Diagnóstico · DISS · Autorización · Piezas · Entrega
                    </span>
                    {open ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </button>

            {open ? (
                <div className="overflow-x-auto border-t border-slate-200 bg-[#F7F9FC] p-3">
                    <div className="grid min-w-max grid-flow-col auto-cols-[300px] gap-3">
                        {containers.map((container) => (
                            <StageContainer
                                key={container.id}
                                container={container}
                                orders={orders.filter((order) => {
                                    if (!orderBelongsToContainer(order, container)) return false;
                                    if (selectedDate) {
                                        return order.fecha_programada === selectedDate;
                                    }
                                    return true;
                                })}
                                open={panelState.contenedores?.[container.id] !== false}
                                onToggle={() => onToggleContainer(container.id)}
                                onMoveOrder={onMoveOrder}
                                onEdit={onEdit}
                                bottom
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}

function FlujoTrabajoSection({
    orders = [],
    selectedDate,
    onStageSelect,
    onMoveOrder,
    onEdit,
}) {
    const [selectedStage, setSelectedStage] = useState(null);
    const [traysOpen, setTraysOpen] = useState(false);

    return (
        <section className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#001E50]">
                        <Workflow className="h-6 w-6" />
                    </span>
                    <h3 className="truncate text-sm font-bold text-[#001E50]">
                        Flujo de Trabajo
                    </h3>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        const next = !traysOpen;
                        setTraysOpen(next);
                        if (next) setSelectedStage(null);
                    }}
                    className={[
                        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition",
                        traysOpen
                            ? "border-[#001E50] bg-[#001E50] text-white"
                            : "border-slate-200 bg-white text-[#001E50] hover:border-[#001E50]/25 hover:bg-[#EAF2FF]",
                    ].join(" ")}
                >
                    <Layers className="h-3.5 w-3.5" />
                    Bandejas
                    {traysOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            <div className="mt-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max items-start gap-2">
                    {ETAPAS_FLUJO_TRABAJO.map((stage, index) => {
                        const isTray = traysOpen || selectedStage === stage.id;
                        const anyTray = traysOpen || selectedStage !== null;

                        const ordersForStage = orders.filter((order) => {
                            if (!orderMatchesEtapas(order, stage.etapas)) return false;
                            if (selectedDate) {
                                return order.fecha_programada === selectedDate;
                            }
                            return true;
                        });

                        if (isTray) {
                            return (
                                <div key={stage.id} className="flex shrink-0 items-center gap-2">
                                    {index > 0 && anyTray ? (
                                        <span className="flex h-8 w-6 shrink-0 flex-col items-center justify-center gap-[3px]">
                                            <span className="h-[2px] w-[2px] rounded-full bg-slate-300" />
                                            <GripVertical className="h-3 w-3 text-slate-300" />
                                            <span className="h-[2px] w-[2px] rounded-full bg-slate-300" />
                                        </span>
                                    ) : null}
                                    <StageContainer
                                        container={{
                                            id: stage.id,
                                            titulo: stage.nombre,
                                            icon: stage.icon,
                                            color: stage.color,
                                            etapaDestino: stage.etapas[0],
                                        }}
                                        orders={ordersForStage}
                                        onClose={
                                            traysOpen
                                                ? undefined
                                                : () => {
                                                    setSelectedStage(null);
                                                }
                                        }
                                        onMoveOrder={onMoveOrder}
                                        onEdit={onEdit}
                                    />
                                </div>
                            );
                        }

                        const count = ordersForStage.length;
                        const selected = selectedStage === stage.id;
                        const Icon = stage.icon;

                        return (
                            <div key={stage.id} className="flex shrink-0 items-center gap-2">
                                {index > 0 && anyTray ? (
                                    <span className="flex h-8 w-6 shrink-0 flex-col items-center justify-center gap-[3px]">
                                        <span className="h-[2px] w-[2px] rounded-full bg-slate-300" />
                                        <GripVertical className="h-3 w-3 text-slate-300" />
                                        <span className="h-[2px] w-[2px] rounded-full bg-slate-300" />
                                    </span>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = selected ? null : stage.id;
                                        setSelectedStage(next);
                                        if (next) setTraysOpen(false);
                                        if (typeof onStageSelect === "function") {
                                            onStageSelect(next);
                                        }
                                    }}
                                    className={[
                                        "group relative flex w-[112px] shrink-0 flex-col items-center overflow-hidden rounded-[6px] border bg-white px-2 pb-2 pt-0 text-center transition-all duration-200 hover:-translate-y-0.5",
                                        selected
                                            ? "border-[#001E50] shadow-[0_6px_16px_rgba(0,30,80,.14)] ring-1 ring-[#001E50]/10"
                                            : "border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,.04)] hover:border-slate-300 hover:shadow-[0_8px_18px_rgba(15,23,42,.10)]",
                                    ].join(" ")}
                                >
                                    <span
                                        className="block h-1 w-full shrink-0"
                                        style={{ backgroundColor: stage.color }}
                                    />

                                    <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        {String(stage.numero).padStart(2, "0")}
                                    </span>

                                    <span className="mt-1 line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-slate-700">
                                        {stage.nombre}
                                    </span>

                                    <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors duration-200 group-hover:bg-[#EAF2FF] group-hover:text-[#001E50]">
                                        <Icon className="h-5 w-5" />
                                    </span>

                                    <span className="mt-2 text-[24px] font-bold leading-none tabular-nums text-[#001E50]">
                                        {count}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function WorkshopBoardLayout({
    agendaOrders,
    containerOrders,
    technicians,
    selectedDate,
    highlightType,
    onEdit,
    onScheduleOrder,
    onUnassignOrder,
    onResizeOrder,
    onMoveOrder,
}) {
    return (
        <div className="space-y-4">
            <AgendaBoard
                orders={agendaOrders}
                technicians={technicians}
                selectedDate={selectedDate}
                highlightType={highlightType}
                onEdit={onEdit}
                onScheduleOrder={onScheduleOrder}
                onUnassignOrder={onUnassignOrder}
                onResizeOrder={onResizeOrder}
            />

            <FlujoTrabajoSection
                orders={containerOrders || []}
                selectedDate={selectedDate}
                onMoveOrder={onMoveOrder}
                onEdit={onEdit}
            />
        </div>
    );
}
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex justify-end">
                <div className="flex h-full w-full max-w-xl flex-col border-l border-[#001E50] bg-neutral-100 shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="truncate text-base font-extrabold text-white">
                            {title}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children, className = "" }) {
    return (
        <div className={`rounded-xl border border-black/10 bg-white p-4 ${className}`}>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#001E50]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#001E50]">
                {label}
            </div>
            {children}
        </div>
    );
}

function StatusBadge({ status }) {
    const finished = status === "Terminado";

    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                finished
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-blue-200 bg-blue-50 text-blue-700",
            ].join(" ")}
        >
            {status}
        </span>
    );
}

function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(
            () => setNow(new Date()),
            intervalMs,
        );
        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
}

function TimelineLines({ showCurrentTime = false, now = new Date() }) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentTimeVisible =
        showCurrentTime &&
        currentMinutes >= MINUTOS_INICIO_AGENDA &&
        currentMinutes <= MINUTOS_FIN_AGENDA;

    return (
        <div className="pointer-events-none absolute inset-0 z-0">
            {Array.from({ length: TOTAL_INTERVALOS + 1 }, (_, index) => {
                const markMinutes =
                    MINUTOS_INICIO_AGENDA + index * INTERVALO_MINUTOS;
                const isHour = markMinutes % 60 === 0;

                return (
                    <div
                        key={index}
                        className="absolute inset-y-0"
                        style={{
                            left: `${(index / TOTAL_INTERVALOS) * 100}%`,
                            borderLeft: isHour
                                ? "1px solid rgba(148,163,184,.28)"
                                : "1px solid rgba(226,232,240,.42)",
                        }}
                    />
                );
            })}

            {currentTimeVisible ? (
                <>
                    <div
                        className="absolute inset-y-0 z-20 w-px bg-[#D5232A]"
                        style={{
                            left: `${((currentMinutes - MINUTOS_INICIO_AGENDA) / MINUTOS_TOTALES_AGENDA) * 100}%`,
                        }}
                    />
                    <div
                        className="absolute top-1 z-30 -translate-x-1/2 rounded-md bg-[#D5232A] px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm"
                        style={{
                            left: `${((currentMinutes - MINUTOS_INICIO_AGENDA) / MINUTOS_TOTALES_AGENDA) * 100}%`,
                        }}
                    >
                        {pad2(now.getHours())}:{pad2(now.getMinutes())}
                    </div>
                </>
            ) : null}
        </div>
    );
}

function TimeHeader() {
    const marks = Array.from(
        { length: TOTAL_INTERVALOS + 1 },
        (_, index) => {
            const minutes =
                MINUTOS_INICIO_AGENDA + index * INTERVALO_MINUTOS;

            return {
                index,
                minutes,
                hour: Math.floor(minutes / 60),
                minute: minutes % 60,
                left: (index / TOTAL_INTERVALOS) * 100,
            };
        },
    );

    return (
        <div className="relative h-[52px] bg-[#1E3A8A]">
            {marks.map((mark) => {
                const isFirst = mark.index === 0;
                const isLast = mark.index === TOTAL_INTERVALOS;
                const showMainLabel =
                    isFirst || isLast || mark.minute === 0;

                if (!showMainLabel) return null;

                return (
                    <div
                        key={mark.minutes}
                        className="absolute top-1/2 z-10 -translate-y-1/2"
                        style={{ left: `${mark.left}%` }}
                    >
                        <div
                            className={[
                                "whitespace-nowrap text-[11px] font-extrabold text-white",
                                isFirst
                                    ? "translate-x-2"
                                    : isLast
                                        ? "-translate-x-full -ml-2"
                                        : "-translate-x-1/2",
                            ].join(" ")}
                        >
                            {pad2(mark.hour)}:{pad2(mark.minute)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ActivityBar({
    order,
    highlightType,
    onEdit,
    onUnassignOrder,
    onResizeOrder,
}) {
    const [resizePreview, setResizePreview] = useState(null);
    const resizingRef = useRef(false);
    const suppressClickRef = useRef(false);

    const visibleOrder = resizePreview
        ? {
            ...order,
            hora_inicio: resizePreview.hora_inicio,
            hora_fin: resizePreview.hora_fin,
        }
        : order;

    const position = getActivityPosition(visibleOrder);
    const workType =
        order.tipo_bloque === "trabajo" ? getWorkTypeMeta(order) : null;
    const categoryKey = getCategoryKey(order);
    const isDimmed = Boolean(highlightType) && categoryKey !== highlightType;
    const isHighlighted = Boolean(highlightType) && categoryKey === highlightType;

    function handleDragStart(event) {
        if (resizingRef.current) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
            "application/x-taller-order-id",
            String(order.id),
        );
        event.dataTransfer.setData("text/plain", String(order.id));
    }

    function handleOpen() {
        if (!suppressClickRef.current) onEdit(order);
    }

    function handleRemove(event) {
        event.preventDefault();
        event.stopPropagation();
        onUnassignOrder(order.id);
    }

    function beginResize(event, edge) {
        event.preventDefault();
        event.stopPropagation();

        const timelineRow = event.currentTarget.closest(
            '[data-timeline-row="true"]',
        );
        const rowRectangle = timelineRow?.getBoundingClientRect();

        if (!rowRectangle?.width) return;

        const originalStart =
            timeToMinutes(order.hora_inicio) ?? MINUTOS_INICIO_AGENDA;
        const originalEnd =
            timeToMinutes(order.hora_fin) ??
            originalStart + INTERVALO_MINUTOS;
        const pointerStartX = event.clientX;

        let latestStart = originalStart;
        let latestEnd = originalEnd;

        resizingRef.current = true;
        suppressClickRef.current = true;

        function handlePointerMove(pointerEvent) {
            const deltaPixels = pointerEvent.clientX - pointerStartX;
            const deltaMinutes = roundToQuarter(
                (deltaPixels / rowRectangle.width) *
                MINUTOS_TOTALES_AGENDA,
            );

            if (edge === "start") {
                latestStart = Math.max(
                    MINUTOS_INICIO_AGENDA,
                    Math.min(
                        originalEnd - INTERVALO_MINUTOS,
                        originalStart + deltaMinutes,
                    ),
                );
                latestEnd = originalEnd;
            } else {
                latestStart = originalStart;
                latestEnd = Math.max(
                    originalStart + INTERVALO_MINUTOS,
                    Math.min(
                        MINUTOS_FIN_AGENDA,
                        originalEnd + deltaMinutes,
                    ),
                );
            }

            setResizePreview({
                hora_inicio: minutesToTime(latestStart),
                hora_fin: minutesToTime(latestEnd),
            });
        }

        function finishResize() {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", finishResize);
            window.removeEventListener("pointercancel", finishResize);

            resizingRef.current = false;
            setResizePreview(null);

            if (
                latestStart !== originalStart ||
                latestEnd !== originalEnd
            ) {
                onResizeOrder(
                    order.id,
                    minutesToTime(latestStart),
                    minutesToTime(latestEnd),
                );
            }

            window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 120);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", finishResize, { once: true });
        window.addEventListener("pointercancel", finishResize, { once: true });
    }

    const isLunch = order.tipo_bloque === "comida";
    const isTraining = order.tipo_bloque === "capacitacion";

    const visualStyle = getActivityStyles(order);

    const primary =
        isLunch
            ? "COMIDA"
            : isTraining
                ? "CAPACITACIÓN"
                : order.no_orden
                    ? `OR ${order.no_orden}`
                    : order.cliente || "Actividad";

    const secondary = isLunch || isTraining
        ? `${visibleOrder.hora_inicio} - ${visibleOrder.hora_fin}`
        : [order.modelo, order.vin].filter(Boolean).join(" · ") ||
        order.cliente ||
        "Trabajo de taller";

    const detail =
        order.tipo_bloque === "trabajo"
            ? (order.subtrabajos || [])
                .map((work) => work.nombre)
                .filter(Boolean)
                .join(" + ")
            : "";

    return (
        <div
            role="button"
            tabIndex={0}
            draggable={!resizingRef.current}
            onDragStart={handleDragStart}
            onDoubleClick={handleOpen}
            onClick={handleOpen}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpen();
                }
            }}
            className={[
                "group absolute z-10 flex h-[58px] cursor-grab flex-col justify-center overflow-hidden rounded-lg border px-3 pr-8 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#001E50]/30",
                highlightType
                    ? ""
                    : "hover:z-30 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
                isDimmed ? "opacity-25 saturate-50" : "",
                isHighlighted
                    ? "z-20 ring-2 ring-[#001E50]/50 ring-offset-1"
                    : "",
            ].join(" ")}
            style={{
                ...position,
                ...visualStyle,
                top: `${order.lane * ALTURA_CARRIL + 11}px`,
            }}
            title={`${primary}\n${secondary}\n${visibleOrder.hora_inicio} - ${visibleOrder.hora_fin}`}
        >
            <button
                type="button"
                draggable={false}
                onPointerDown={(event) => beginResize(event, "start")}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                className="absolute inset-y-0 left-0 z-40 flex w-4 cursor-ew-resize items-center justify-center"
                title="Arrastrar para cambiar hora de inicio"
            >
                <span
                    className="h-7 w-[3px] rounded-full transition group-hover:brightness-75"
                    style={{ backgroundColor: `${visualStyle.borderColor}55` }}
                />
            </button>

            <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-[11px] font-black">
                    {primary}
                </span>
                {!isLunch && !isTraining && workType ? (
                    <span className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[8px] font-black">
                        {workType.label}
                    </span>
                ) : null}
            </div>

            <div className="mt-0.5 truncate text-[9px] font-bold opacity-80">
                {secondary}
            </div>

            {detail ? (
                <div className="mt-0.5 truncate text-[9px] font-semibold opacity-65">
                    {detail}
                </div>
            ) : null}

            <button
                type="button"
                onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onClick={handleRemove}
                className="absolute right-2 top-1/2 z-50 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-white/60 opacity-0 shadow-sm transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
                title="Quitar de la agenda"
            >
                <X className="h-3 w-3" />
            </button>

            <button
                type="button"
                draggable={false}
                onPointerDown={(event) => beginResize(event, "end")}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                className="absolute inset-y-0 right-0 z-40 flex w-4 cursor-ew-resize items-center justify-center"
                title="Arrastrar para cambiar hora de fin"
            >
                <span
                    className="h-7 w-[3px] rounded-full transition group-hover:brightness-75"
                    style={{ backgroundColor: `${visualStyle.borderColor}55` }}
                />
            </button>
        </div>
    );
}

function TimelineRow({
    orders,
    technician,
    selectedDate,
    now,
    zebra,
    highlightType,
    onEdit,
    onScheduleOrder,
    onUnassignOrder,
    onResizeOrder,
}) {
    const [dragOver, setDragOver] = useState(false);
    const [dropMinutes, setDropMinutes] = useState(null);

    const laneData = useMemo(() => assignLanes(orders), [orders]);
    const isToday = selectedDate === toYMD(now);

    function calculateDropMinutes(event) {
        const rectangle = event.currentTarget.getBoundingClientRect();
        const relativeX = Math.max(
            0,
            Math.min(rectangle.width, event.clientX - rectangle.left),
        );
        const percentage =
            rectangle.width > 0 ? relativeX / rectangle.width : 0;
        return Math.max(
            MINUTOS_INICIO_AGENDA,
            Math.min(
                MINUTOS_FIN_AGENDA - INTERVALO_MINUTOS,
                roundToQuarter(
                    MINUTOS_INICIO_AGENDA +
                    percentage * MINUTOS_TOTALES_AGENDA,
                ),
            ),
        );
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOver(true);
        setDropMinutes(calculateDropMinutes(event));
    }

    function handleDragLeave(event) {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setDragOver(false);
            setDropMinutes(null);
        }
    }

    function handleDrop(event) {
        event.preventDefault();

        const orderId =
            event.dataTransfer.getData("application/x-taller-order-id") ||
            event.dataTransfer.getData("text/plain");
        const minutes = calculateDropMinutes(event);

        setDragOver(false);
        setDropMinutes(null);

        if (orderId) {
            onScheduleOrder(
                orderId,
                technician,
                selectedDate,
                minutesToTime(minutes),
            );
        }
    }

    const previewPosition =
        dropMinutes === null
            ? 0
            : ((dropMinutes - MINUTOS_INICIO_AGENDA) /
                MINUTOS_TOTALES_AGENDA) *
            100;

    return (
        <div
            data-timeline-row="true"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
                "relative h-full border-b border-slate-200 transition",
                dragOver
                    ? "bg-blue-50/70 ring-2 ring-inset ring-[#001E50]/20"
                    : zebra
                        ? "bg-[#F3F9FF]"
                        : "bg-white",
            ].join(" ")}
            style={{ minHeight: `${ALTURA_CARRIL}px` }}
        >
            <TimelineLines showCurrentTime={isToday} now={now} />

            {dragOver && dropMinutes !== null ? (
                <>
                    <div
                        className="pointer-events-none absolute inset-y-0 z-40 w-[2px] bg-[#001E50]"
                        style={{ left: `${previewPosition}%` }}
                    />
                    <div
                        className="pointer-events-none absolute top-1 z-50 -translate-x-1/2 rounded-md bg-[#001E50] px-2 py-1 text-[9px] font-black text-white shadow"
                        style={{ left: `${previewPosition}%` }}
                    >
                        {minutesToTime(dropMinutes)}
                    </div>
                </>
            ) : null}

            {laneData.orders.map((order) => (
                <ActivityBar
                    key={order.id}
                    order={order}
                    highlightType={highlightType}
                    onEdit={onEdit}
                    onUnassignOrder={onUnassignOrder}
                    onResizeOrder={onResizeOrder}
                />
            ))}
        </div>
    );
}

function AgendaBoard({
    orders,
    technicians,
    selectedDate,
    highlightType,
    onEdit,
    onScheduleOrder,
    onUnassignOrder,
    onResizeOrder,
}) {
    const rowsByTechnician = useMemo(() => {
        const grouped = new Map();

        technicians.forEach((technician) => grouped.set(technician, []));

        orders.forEach((order) => {
            const technician =
                canonicalTechnician(order.tecnico) || "SIN TÉCNICO";

            if (!grouped.has(technician)) grouped.set(technician, []);
            grouped.get(technician).push(order);
        });

        return grouped;
    }, [orders, technicians]);

    const now = useNow();

    const headerScrollerRef = useRef(null);

    function handleScroll(event) {
        if (headerScrollerRef.current) {
            headerScrollerRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                    <div className="text-sm font-black tracking-tight text-[#001E50]">
                        CRONOGRAMA DE TÉCNICOS
                    </div>
                    <div className="mt-0.5 text-[10px] font-semibold capitalize text-slate-400">
                        {formatLongDate(selectedDate)}
                    </div>
                </div>

                <div className="hidden items-center gap-2 text-[10px] font-bold text-slate-400 md:flex">
                    <span className="h-2 w-2 rounded-full bg-[#D5232A]" />
                    Hora actual
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-black tabular-nums text-[#001E50]">
                        {pad2(now.getHours())}:{pad2(now.getMinutes())}
                    </span>
                    <span className="ml-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                        Arrastra para reasignar
                    </span>
                </div>
            </div>

            <div className="flex border-b border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,.04)]">
                <div
                    className="z-40 flex h-[52px] items-center border-r border-slate-200 bg-slate-50 px-4"
                    style={{
                        flex: `0 0 ${ANCHO_TECNICO}px`,
                        width: `${ANCHO_TECNICO}px`,
                    }}
                >
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">
                            Técnico
                        </div>
                        <div className="mt-0.5 text-xs font-extrabold text-[#001E50]">
                            Equipo de taller
                        </div>
                    </div>
                </div>

                <div
                    ref={headerScrollerRef}
                    className="h-[52px] flex-1 overflow-hidden"
                    style={{ minWidth: `${ANCHO_MINIMO_LINEA}px` }}
                >
                    <TimeHeader />
                </div>
            </div>

            <div className="max-h-[72vh] overflow-auto" onScroll={handleScroll}>
                <div
                    style={{
                        minWidth: `${ANCHO_TECNICO + ANCHO_MINIMO_LINEA}px`,
                    }}
                >

                    {technicians.map((technician, technicianIndex) => {
                        const technicianOrders =
                            rowsByTechnician.get(technician) || [];
                        const laneData = assignLanes(technicianOrders);
                        const rowHeight =
                            laneData.laneCount * ALTURA_CARRIL;

                        return (
                            <div
                                key={technician}
                                className="flex"
                                style={{
                                    height: `${rowHeight}px`,
                                    minHeight: `${ALTURA_CARRIL}px`,
                                }}
                            >
                                <div
                                    className={[
                                        "sticky left-0 z-30 flex h-full items-center gap-3 border-b border-r border-slate-200 px-3",
                                        technicianIndex % 2 === 1 ? "bg-[#F3F9FF]" : "bg-white",
                                    ].join(" ")}
                                    style={{
                                        flex: `0 0 ${ANCHO_TECNICO}px`,
                                        width: `${ANCHO_TECNICO}px`,
                                    }}
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[10px] font-black text-[#001E50]">
                                        {getInitials(technician)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[11px] font-black text-[#001E50]">
                                            {technician}
                                        </div>
                                        <div className="mt-0.5 text-[9px] font-semibold text-slate-400">
                                            Técnico {pad2(technicianIndex + 1)}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="min-w-0 flex-1"
                                    style={{ minWidth: `${ANCHO_MINIMO_LINEA}px` }}
                                >
                                    <TimelineRow
                                        orders={technicianOrders}
                                        technician={technician}
                                        selectedDate={selectedDate}
                                        now={now}
                                        zebra={technicianIndex % 2 === 1}
                                        highlightType={highlightType}
                                        onEdit={onEdit}
                                        onScheduleOrder={onScheduleOrder}
                                        onUnassignOrder={onUnassignOrder}
                                        onResizeOrder={onResizeOrder}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
export default function Taller() {
    const { user } = useAuth();

    const permisos = user?.permisos || [];
    const rol = normalizeKey(user?.rol);
    const isAdmin = useMemo(
        () =>
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN") ||
            permisos.includes("CRM_DIGITALES") ||
            permisos.includes("TALLER_ADMIN"),
        [rol, permisos],
    );

    const userAgencias = useMemo(
        () =>
            String(user?.agencia || "")
                .split("|")
                .map(normalizeStr)
                .filter(Boolean),
        [user?.agencia],
    );
    const userAgencia = userAgencias[0] || "";

    const [remoteRows, setRemoteRows] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [vista, setVista] = useState("agenda");
    const [highlightType, setHighlightType] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editingOrden, setEditingOrden] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        tecnico: "Todos",
        fecha: toYMD(new Date()),
    });

    const inputBase =
        "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#001E50] outline-none transition";
    const inputOk =
        "border-black/10 bg-neutral-100 focus:border-[#001E50] focus:ring-2 focus:ring-[#001E50]/10";

    const refreshList = useCallback(async () => {
        setLoadingList(true);

        try {
            const data = await apiHojaIngresos.list();

            setRemoteRows(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                        ? data.results
                        : [],
            );
        } catch (error) {
            console.error(error);
            setRemoteRows([]);

            alert(
                error?.message ||
                "No se pudo cargar la información del taller.",
            );
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        refreshList();
    }, [refreshList]);

    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            if (isAdmin) return true;
            if (userAgencias.length === 0) return true;

            const agencia = normalizeKey(agenciaRegistro);
            return userAgencias.some((assigned) => normalizeKey(assigned) === agencia);
        },
        [isAdmin, userAgencias],
    );

    const ordenes = useMemo(() => {
        return (remoteRows || [])
            .filter((row) => userTieneAgencia(row.agencia))
            .map((row) => {
                const serviciosBase =
                    row.tipo_servicio ||
                    row.tipo_cita ||
                    row.pauta ||
                    "";

                const subtrabajos =
                    Array.isArray(row.subtrabajos) && row.subtrabajos.length > 0
                        ? row.subtrabajos.map((work, index) => ({
                            id: work.id ?? `${row.id}-${index}`,
                            nombre: normalizeStr(work.nombre),
                            horas: Number(work.horas || 0),
                            orden: Number(work.orden ?? index),
                        }))
                        : splitTrabajos(serviciosBase).map((nombre, index) => ({
                            id: `${row.id}-${index}`,
                            nombre,
                            horas: 0,
                            orden: index,
                        }));

                /*
                 * fecha_programada solamente existe cuando el registro
                 * ya fue colocado explícitamente en la agenda.
                 *
                 * Los registros nuevos provenientes de Hoja de Ingresos
                 * todavía no tienen fecha_programada, por lo que para
                 * visualizarlos en las bandejas y en la tabla utilizamos
                 * fecha_ingreso como fecha operativa.
                 */
                const fechaProgramadaReal = toYMD(row.fecha_programada);
                const fechaIngreso = toYMD(
                    row.fecha_ingreso ||
                    row.fecha_cita ||
                    row.creado_en ||
                    row.created_at,
                );

                const fechaOperativa =
                    fechaProgramadaReal ||
                    fechaIngreso;

                const horaInicio = toHHMM(row.hora_inicio);
                const horaFin = toHHMM(row.hora_fin);
                const tecnico = canonicalTechnician(row.tecnico || "");

                const inicioMinutos = timeToMinutes(horaInicio);
                const finMinutos = timeToMinutes(horaFin);

                const horasCalculadas =
                    inicioMinutos !== null &&
                        finMinutos !== null &&
                        finMinutos > inicioMinutos
                        ? (finMinutos - inicioMinutos) / 60
                        : 0;

                const horasTrabajos = subtrabajos.reduce(
                    (sum, work) => sum + Number(work.horas || 0),
                    0,
                );

                /*
                 * IMPORTANTE:
                 * Para considerar que realmente está en agenda exigimos
                 * fecha_programada REAL, técnico y horario.
                 *
                 * fechaOperativa solamente sirve para que el ingreso
                 * aparezca en la fecha correcta dentro de la interfaz.
                 */
                const tieneAgenda = Boolean(
                    tecnico &&
                    fechaProgramadaReal &&
                    horaInicio &&
                    horaFin,
                );

                return {
                    ...row,

                    id: String(row.id),
                    rowIds: [],
                    rows: [],

                    isManual:
                        row.isManual === true ||
                        row.is_manual === true ||
                        row.cliente_id == null,

                    manualRowId: null,

                    agencia: row.agencia || "",
                    no_orden: row.no_orden || "",

                    cliente:
                        row.cliente_nombre ||
                        row?.cliente?.nombre ||
                        row.nombre_cliente ||
                        (typeof row.cliente === "string" ? row.cliente : "") ||
                        "Sin nombre",

                    telefono:
                        row.telefono ||
                        row.cliente_telefono ||
                        row?.cliente?.telefono ||
                        "—",

                    correo:
                        row.correo ||
                        row.correo_electronico ||
                        row.cliente_correo_electronico ||
                        row?.cliente?.correo ||
                        row?.cliente?.correo_electronico ||
                        "",

                    vin: row.vin || "",
                    modelo: row.modelo || "",

                    fecha_ingreso:
                        row.fecha_ingreso ||
                        row.fecha_cita ||
                        row.creado_en ||
                        row.created_at ||
                        null,

                    /*
                     * Esta fecha es la que utiliza actualmente la interfaz
                     * para filtrar tabla y bandejas.
                     *
                     * Si aún no existe una programación en Taller,
                     * se utiliza la fecha de ingreso.
                     */
                    fecha_programada: fechaOperativa,

                    /*
                     * Conservamos también la fecha real para distinguir
                     * entre "ingresó este día" y "ya fue programado".
                     */
                    fecha_programada_real: fechaProgramadaReal,

                    /*
                     * Si Taller ya tiene etapa, la respetamos.
                     * Si es un ingreso nuevo:
                     *
                     * citado=true  -> Ingreso con Cita
                     * citado=false -> Ingreso Sin Cita
                     */
                    etapa:
                        normalizeStr(row.etapa) ||
                        getDefaultEtapa(row),

                    tecnico,
                    comentarios_taller: row.comentarios_taller || "",
                    tipo_bloque: row.tipo_bloque || "trabajo",
                    tipo_servicio: serviciosBase,

                    estatus_agenda:
                        row.estatus_agenda ||
                        "Programado",

                    hora_inicio: horaInicio,
                    hora_fin: horaFin,

                    subtrabajos,
                    tieneAgenda,

                    horasTotales: Number(
                        row.horasTotales ??
                        row.horas_totales ??
                        horasTrabajos,
                    ),

                    horasAgenda: Number(
                        row.horasAgenda ??
                        row.horas_agenda ??
                        horasCalculadas,
                    ),
                };
            });
    }, [remoteRows, userTieneAgencia]);

    const dealers = useMemo(() => {
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }

        const set = new Set(
            (ordenes || [])
                .map((row) => normalizeStr(row.agencia))
                .filter(Boolean),
        );

        return ["Todos", ...DEALERS, ...Array.from(set)].filter(
            (value, index, array) => array.indexOf(value) === index,
        );
    }, [ordenes, isAdmin, userAgencias]);

    const techniciansFilter = useMemo(() => {
        const officialTechnicians =
            getOfficialTechniciansByDealer(filters.agencia);
        if (filters.agencia !== "Todos") {
            return [
                "Todos",
                ...uniqueStrings(officialTechnicians),
            ];
        }
        const extraTechnicians = ordenes
            .map((order) => canonicalTechnician(order.tecnico))
            .filter(Boolean);

        return [
            "Todos",
            ...uniqueStrings([
                ...TODOS_TECNICOS_OFICIALES,
                ...extraTechnicians,
            ]),
        ];
    }, [ordenes, filters.agencia]);

    const filtered = useMemo(() => {
        const query = normalizeKey(filters.q);

        return ordenes.filter((order) => {
            const matchesQuery =
                !query ||
                [
                    order.cliente,
                    order.telefono,
                    order.no_orden,
                    order.vin,
                    order.modelo,
                    order.tecnico,
                    order.etapa,
                    order.tipo_bloque,
                    ...order.subtrabajos.map((work) => work.nombre),
                ].some((value) => normalizeKey(value).includes(query));

            const matchesDealer =
                filters.agencia === "Todos" ||
                normalizeKey(order.agencia) === normalizeKey(filters.agencia);

            const matchesTechnician =
                filters.tecnico === "Todos" ||
                normalizeKey(order.tecnico) === normalizeKey(filters.tecnico);

            const matchesDate = order.fecha_programada === filters.fecha;

            return matchesQuery && matchesDealer && matchesTechnician && matchesDate;
        });
    }, [ordenes, filters]);

    const agendaOrders = useMemo(
        () =>
            filtered.filter((order) =>
                Boolean(
                    order.tecnico &&
                    order.fecha_programada &&
                    order.hora_inicio &&
                    order.hora_fin
                ),
            ),
        [filtered],
    );

    const containerOrders = useMemo(() => {
        const query = normalizeKey(filters.q);

        return ordenes.filter((order) => {
            if (order.tipo_bloque !== "trabajo") return false;

            const matchesQuery =
                !query ||
                [
                    order.cliente,
                    order.telefono,
                    order.no_orden,
                    order.vin,
                    order.modelo,
                    order.tecnico,
                    order.etapa,
                    ...order.subtrabajos.map((work) => work.nombre),
                ].some((value) => normalizeKey(value).includes(query));

            const matchesDealer =
                filters.agencia === "Todos" ||
                normalizeKey(order.agencia) === normalizeKey(filters.agencia);

            const matchesTechnician =
                filters.tecnico === "Todos" ||
                normalizeKey(order.tecnico) === normalizeKey(filters.tecnico);

            return matchesQuery && matchesDealer && matchesTechnician;
        });
    }, [ordenes, filters.q, filters.agencia, filters.tecnico]);

    const techniciansInAgenda = useMemo(() => {
        if (filters.tecnico !== "Todos") {
            return [filters.tecnico];
        }

        return techniciansFilter.filter(
            (technician) => technician !== "Todos",
        );
    }, [filters.tecnico, techniciansFilter]);

    const stats = useMemo(() => {
        const programmed = filtered.filter(
            (order) => order.estatus_agenda === "Programado",
        ).length;
        const finished = filtered.filter(
            (order) => order.estatus_agenda === "Terminado",
        ).length;
        const lunch = filtered.filter((order) => order.tipo_bloque === "comida").length;
        const training = filtered.filter(
            (order) => order.tipo_bloque === "capacitacion",
        ).length;
        const hours = filtered.reduce((sum, order) => sum + order.horasAgenda, 0);

        return {
            total: filtered.length,
            programmed,
            finished,
            lunch,
            training,
            hours,
        };
    }, [filtered]);

    const techniciansForDraft = useMemo(() => {
        const draftDealer =
            draft?.agencia ||
            (filters.agencia !== "Todos"
                ? filters.agencia
                : "");

        if (!draftDealer) {
            return uniqueStrings(TODOS_TECNICOS_OFICIALES);
        }

        return uniqueStrings(
            getOfficialTechniciansByDealer(draftDealer),
        );
    }, [
        draft?.agencia,
        filters.agencia,
    ]);

    async function unassignOrder(orderId) {
        const order = ordenes.find(
            (item) => String(item.id) === String(orderId),
        );

        if (!order) {
            alert("No se encontró la actividad.");
            return;
        }

        const confirmed = window.confirm(
            `¿Deseas quitar "${getActivityLabel(order)}" de la agenda?`,
        );

        if (!confirmed) return;

        const previousRows = remoteRows;
        const targetStage = getDefaultEtapa(order);

        const payload = {
            tecnico: "",
            fecha_programada: null,
            hora_inicio: null,
            hora_fin: null,
            estatus_agenda: "Programado",
            etapa: targetStage,
        };

        setRemoteRows((previous) =>
            previous.map((row) =>
                String(row.id) === String(orderId)
                    ? {
                        ...row,
                        ...payload,
                    }
                    : row,
            ),
        );

        try {
            const updated = await apiHojaIngresos.patch(
                orderId,
                payload,
            );

            setRemoteRows((previous) =>
                previous.map((row) =>
                    String(row.id) === String(orderId)
                        ? {
                            ...row,
                            ...(updated || {}),
                            ...payload,

                            tecnico: "",
                            fecha_programada: null,
                            hora_inicio: null,
                            hora_fin: null,
                            estatus_agenda: "Programado",
                            etapa: targetStage,
                        }
                        : row,
                ),
            );
        } catch (error) {
            console.error(error);
            setRemoteRows(previousRows);

            alert(
                error?.message ||
                "No se pudo quitar la actividad de la agenda.",
            );
        }
    }

    async function scheduleOrder(
        orderId,
        technician,
        selectedDate,
        startTime,
    ) {
        const order = ordenes.find(
            (item) => String(item.id) === String(orderId),
        );

        if (!order) {
            alert("No se encontró la actividad seleccionada.");
            return;
        }

        const currentStart =
            timeToMinutes(order.hora_inicio) ??
            MINUTOS_INICIO_AGENDA;

        const currentEnd =
            timeToMinutes(order.hora_fin) ??
            currentStart + 60;

        /*
         * Si la duración actual no es válida,
         * utiliza una hora.
         */
        const durationMinutes = Math.max(
            INTERVALO_MINUTOS,
            currentEnd - currentStart,
        );

        let newStartMinutes =
            timeToMinutes(startTime) ??
            MINUTOS_INICIO_AGENDA;

        /*
         * Evita que el trabajo termine después
         * del final de la agenda.
         */
        const lastPossibleStart =
            MINUTOS_FIN_AGENDA - durationMinutes;

        newStartMinutes = Math.max(
            MINUTOS_INICIO_AGENDA,
            Math.min(newStartMinutes, lastPossibleStart),
        );

        newStartMinutes = roundToQuarter(newStartMinutes);

        const newEndMinutes =
            newStartMinutes + durationMinutes;

        const payload = {
            tecnico: canonicalTechnician(technician),
            fecha_programada: selectedDate,
            hora_inicio: minutesToTime(newStartMinutes),
            hora_fin: minutesToTime(newEndMinutes),
            estatus_agenda: "Programado",

            /*
             * La tarjeta ya fue colocada en la agenda,
             * pero puede conservar su etapa "Ingreso con Cita".
             */
            etapa: order.etapa || "Ingreso con Cita",
        };

        const previousRows = remoteRows;

        /*
         * Movimiento visual inmediato.
         */
        setRemoteRows((previous) =>
            previous.map((row) =>
                String(row.id) === String(orderId)
                    ? {
                        ...row,
                        ...payload,
                    }
                    : row,
            ),
        );

        try {
            const updated = await apiHojaIngresos.patch(
                orderId,
                payload,
            );
            setRemoteRows((previous) =>
                previous.map((row) => {
                    if (
                        String(row.id) !==
                        String(orderId)
                    ) {
                        return row;
                    }

                    return {
                        ...row,
                        ...(updated || {}),
                        ...payload,

                        tecnico: payload.tecnico,
                        fecha_programada:
                            payload.fecha_programada,
                        hora_inicio:
                            payload.hora_inicio,
                        hora_fin:
                            payload.hora_fin,
                        estatus_agenda:
                            payload.estatus_agenda,
                        etapa: payload.etapa,
                    };
                }),
            );
        } catch (error) {
            console.error(error);

            setRemoteRows(previousRows);

            alert(
                error?.message ||
                "No se pudo cambiar el técnico o el horario.",
            );
        }
    }

    async function resizeOrder(
        orderId,
        startTime,
        endTime,
    ) {
        const order = ordenes.find(
            (item) => String(item.id) === String(orderId),
        );

        if (!order) {
            alert("No se encontró la actividad seleccionada.");
            return;
        }

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        if (
            startMinutes === null ||
            endMinutes === null ||
            startMinutes < MINUTOS_INICIO_AGENDA ||
            endMinutes > MINUTOS_FIN_AGENDA ||
            endMinutes - startMinutes < INTERVALO_MINUTOS
        ) {
            alert(
                "El horario debe permanecer entre las 08:30 y las 20:00 horas, con una duración mínima de 15 minutos.",
            );
            return;
        }

        const previousRows = remoteRows;
        const payload = {
            hora_inicio: minutesToTime(
                roundToQuarter(startMinutes),
            ),
            hora_fin: minutesToTime(
                roundToQuarter(endMinutes),
            ),
        };

        setRemoteRows((previous) =>
            previous.map((row) =>
                String(row.id) === String(orderId)
                    ? {
                        ...row,
                        ...payload,
                    }
                    : row,
            ),
        );

        try {
            const updated = await apiHojaIngresos.patch(
                orderId,
                payload,
            );

            setRemoteRows((previous) =>
                previous.map((row) =>
                    String(row.id) === String(orderId)
                        ? {
                            ...row,
                            ...(updated || {}),
                            ...payload,
                        }
                        : row,
                ),
            );
        } catch (error) {
            console.error(error);
            setRemoteRows(previousRows);

            alert(
                error?.message ||
                "No se pudo actualizar la duración de la actividad.",
            );
        }
    }

    function openEdit(order) {
        setEditingOrden(order);
        setDraft({
            agencia: order.agencia || "",
            no_orden: order.no_orden || "",
            cliente: order.cliente === "Sin nombre" ? "" : order.cliente,
            telefono: order.telefono === "—" ? "" : order.telefono,
            correo: order.correo || "",
            vin: order.vin || "",
            modelo: order.modelo || "",
            tecnico: order.tecnico || "",
            etapa: order.etapa || "Ingreso con Cita",
            comentarios_taller: order.comentarios_taller || "",
            tipo_bloque: order.tipo_bloque || "trabajo",
            fecha_programada: order.fecha_programada || filters.fecha,
            hora_inicio: order.hora_inicio || HORA_INICIO_TEXTO,
            hora_fin: order.hora_fin || "09:30",
            estatus_agenda: order.estatus_agenda || "Programado",
            subtrabajos: order.subtrabajos.map((item, index) => ({
                id: item.id || `${order.id}-${index}`,
                nombre: item.nombre || "",
                horas: item.horas ?? 0,
            })),
        });
        setOpenModal(true);
    }

    async function moveOrderToStage(orderId, etapaDestino) {
        const order = ordenes.find(
            (item) => String(item.id) === String(orderId),
        );

        if (!order) {
            alert("No se encontró la actividad seleccionada.");
            return;
        }

        if (order.etapa === etapaDestino) return;

        const previousRows = remoteRows;
        const payload = { etapa: etapaDestino };

        setRemoteRows((previous) =>
            previous.map((row) =>
                String(row.id) === String(orderId)
                    ? {
                        ...row,
                        ...payload,
                    }
                    : row,
            ),
        );

        try {
            const updated = await apiHojaIngresos.patch(
                orderId,
                payload,
            );

            setRemoteRows((previous) =>
                previous.map((row) =>
                    String(row.id) === String(orderId)
                        ? {
                            ...row,
                            ...(updated || {}),
                            ...payload,
                        }
                        : row,
                ),
            );
        } catch (error) {
            console.error(error);
            setRemoteRows(previousRows);

            alert(
                error?.message ||
                "No se pudo mover la actividad entre etapas.",
            );
        }
    }

    function openCreateManual() {
        setEditingOrden(null);
        setDraft({
            agencia:
                filters.agencia !== "Todos"
                    ? filters.agencia
                    : isAdmin
                        ? ""
                        : userAgencia,
            no_orden: "",
            cliente: "",
            telefono: "",
            correo: "",
            vin: "",
            modelo: "",
            tecnico: filters.tecnico !== "Todos" ? filters.tecnico : "",
            etapa: "Ingreso con Cita",
            comentarios_taller: "",
            tipo_bloque: "trabajo",
            fecha_programada: filters.fecha,
            hora_inicio: HORA_INICIO_TEXTO,
            hora_fin: "09:30",
            estatus_agenda: "Programado",
            subtrabajos: [
                {
                    id: `manual-${Date.now()}`,
                    nombre: "",
                    horas: 1,
                },
            ],
        });
        setOpenModal(true);
    }

    function closeModal() {
        if (saving) return;
        setOpenModal(false);
        setEditingOrden(null);
        setDraft(null);
    }

    function validateSchedule() {
        const start = timeToMinutes(draft?.hora_inicio);
        const end = timeToMinutes(draft?.hora_fin);

        if (!draft?.fecha_programada) {
            alert("Selecciona la fecha programada.");
            return false;
        }

        if (start === null || end === null) {
            alert("Indica una hora de inicio y una hora de fin válidas.");
            return false;
        }

        if (start < MINUTOS_INICIO_AGENDA || end > MINUTOS_FIN_AGENDA) {
            alert("El horario debe estar dentro de las 08:30 y las 20:00 horas.");
            return false;
        }

        if (end <= start) {
            alert("La hora de fin debe ser posterior a la hora de inicio.");
            return false;
        }

        return true;
    }

    async function saveOrder() {
        if (!draft || saving) return;

        if (!normalizeStr(draft.agencia)) {
            alert("Selecciona el dealer de la actividad.");
            return;
        }

        if (!normalizeStr(draft.tecnico)) {
            alert("Selecciona un técnico asignado.");
            return;
        }

        if (!validateSchedule()) return;

        let subtrabajos = [];

        if (draft.tipo_bloque === "trabajo") {
            subtrabajos = (draft.subtrabajos || [])
                .map((item, index) => ({
                    nombre: normalizeStr(item.nombre),
                    horas: Number(item.horas || 0),
                    orden: index,
                }))
                .filter((item) => item.nombre);

            if (subtrabajos.length === 0) {
                alert("Agrega por lo menos un trabajo de taller.");
                return;
            }

            if (!normalizeStr(draft.cliente)) {
                alert("Escribe el nombre del cliente.");
                return;
            }

            if (!editingOrden && !normalizeStr(draft.telefono)) {
                alert("Escribe el teléfono del cliente.");
                return;
            }
        }

        const stage =
            draft.estatus_agenda === "Terminado"
                ? "Terminado"
                : draft.etapa === "Terminado"
                    ? "Trabajo en Proceso"
                    : draft.etapa;

        const payload = {
            agencia: normalizeStr(draft.agencia),
            no_orden: normalizeStr(draft.no_orden),
            cliente:
                draft.tipo_bloque === "trabajo"
                    ? normalizeStr(draft.cliente)
                    : "",
            telefono: normalizeStr(draft.telefono).replace(/\D/g, ""),
            correo: normalizeStr(draft.correo || editingOrden?.correo),
            vin: normalizeStr(draft.vin),
            modelo: normalizeStr(draft.modelo),
            tecnico: canonicalTechnician(draft.tecnico),
            tipo_bloque: draft.tipo_bloque,
            tipo_servicio:
                draft.tipo_bloque === "trabajo"
                    ? subtrabajos.map((item) => item.nombre).join(" + ")
                    : draft.tipo_bloque === "comida"
                        ? "Comida"
                        : "Capacitación",
            etapa: stage,
            estatus_agenda: draft.estatus_agenda,
            fecha_programada: draft.fecha_programada,
            hora_inicio: draft.hora_inicio,
            hora_fin: draft.hora_fin,
            comentarios_taller: normalizeStr(draft.comentarios_taller),
            ...(draft.tipo_bloque === "trabajo" ? { subtrabajos } : {}),
        };

        setSaving(true);

        try {
            const saved = editingOrden?.id
                ? await apiHojaIngresos.patch(
                    editingOrden.id,
                    payload,
                )
                : await apiHojaIngresos.create(payload);

            const savedId =
                saved?.id ||
                editingOrden?.id;

            setRemoteRows((previous) => {
                const exists = previous.some(
                    (row) =>
                        String(row.id) === String(savedId),
                );

                if (!exists) {
                    return [
                        {
                            ...(saved || {}),
                            ...payload,
                            id: String(savedId),
                        },
                        ...previous,
                    ];
                }

                return previous.map((row) => {
                    if (
                        String(row.id) !==
                        String(savedId)
                    ) {
                        return row;
                    }

                    return {
                        ...row,
                        ...(saved || {}),
                        ...payload,

                        id: String(savedId),
                        tecnico: payload.tecnico,
                        etapa: payload.etapa,
                        estatus_agenda:
                            payload.estatus_agenda,
                        fecha_programada:
                            payload.fecha_programada,
                        hora_inicio:
                            payload.hora_inicio,
                        hora_fin:
                            payload.hora_fin,
                        tipo_bloque:
                            payload.tipo_bloque,
                        tipo_servicio:
                            payload.tipo_servicio,
                        comentarios_taller:
                            payload.comentarios_taller,

                        subtrabajos:
                            payload.subtrabajos ||
                            saved?.subtrabajos ||
                            row.subtrabajos ||
                            [],
                    };
                });
            });

            setFilters((previous) => ({
                ...previous,
                fecha:
                    draft.fecha_programada ||
                    saved?.fecha_programada ||
                    previous.fecha,
            }));

            setOpenModal(false);
            setEditingOrden(null);
            setDraft(null);
        } catch (error) {
            console.error(error);

            alert(
                error?.message ||
                "No se pudo guardar la actividad de taller.",
            );
        } finally {
            setSaving(false);
        }
    }

    function addSubtask() {
        setDraft((previous) => ({
            ...previous,
            subtrabajos: [
                ...(previous.subtrabajos || []),
                {
                    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    nombre: "",
                    horas: 0,
                },
            ],
        }));
    }

    function removeSubtask(index) {
        setDraft((previous) => ({
            ...previous,
            subtrabajos: previous.subtrabajos.filter((_, current) => current !== index),
        }));
    }

    function updateSubtask(index, patch) {
        setDraft((previous) => ({
            ...previous,
            subtrabajos: previous.subtrabajos.map((item, current) =>
                current === index ? { ...item, ...patch } : item,
            ),
        }));
    }

    function resetFilters() {
        setFilters({
            q: "",
            agencia: "Todos",
            tecnico: "Todos",
            fecha: toYMD(new Date()),
        });
    }

    function goToToday() {
        setFilters((previous) => ({ ...previous, fecha: toYMD(new Date()) }));
    }

    function moveDate(days) {
        setFilters((previous) => ({
            ...previous,
            fecha: addDaysToYMD(previous.fecha, days),
        }));
    }

    if (vista === "legacy") {
        return <TallerLegacy onSwitchToNuevo={() => setVista("agenda")} />;
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-extrabold text-[#001E50]">
                            Progreso y Control de Trabajos a Taller
                        </h2>
                    </div>
                    {!isAdmin && userAgencias.length > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}
                            <span className="text-[#001E50]">
                                {userAgencias.join(", ")}
                            </span>
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex overflow-hidden rounded-lg border border-[#001E50]/30">
                        <button
                            type="button"
                            onClick={() => setVista("agenda")}
                            className={[
                                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition",
                                vista === "agenda"
                                    ? "bg-[#001E50] text-white"
                                    : "bg-white text-[#001E50] hover:bg-[#001E50]/10",
                            ].join(" ")}
                        >
                            <CalendarClock className="h-3.5 w-3.5" /> Agenda
                        </button>
                        <button
                            type="button"
                            onClick={() => setVista("lista")}
                            className={[
                                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition",
                                vista === "lista"
                                    ? "bg-[#001E50] text-white"
                                    : "bg-white text-[#001E50] hover:bg-[#001E50]/10",
                            ].join(" ")}
                        >
                            <Table2 className="h-3.5 w-3.5" /> Lista
                        </button>
                        <button
                            type="button"
                            onClick={() => setVista("legacy")}
                            className={[
                                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition",
                                vista === "legacy"
                                    ? "bg-[#001E50] text-white"
                                    : "bg-white text-[#001E50] hover:bg-[#001E50]/10",
                            ].join(" ")}
                        >
                            <History className="h-3.5 w-3.5" /> Diseño 2
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateManual}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#001E50] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#001E50]/90"
                    >
                        <Plus className="h-4 w-4" /> Nueva actividad
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#001E50]/5 text-[#001E50]">
                        <ListChecks className="h-4.5 w-4.5" />
                    </span>
                    <div>
                        <div className="text-sm font-black text-[#001E50]">
                            Control y progreso
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                            Resumen del día en agenda
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="absolute inset-x-0 top-0 h-1 bg-[#001E50]" />
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">
                                    Actividades
                                </div>
                                <div className="mt-1.5 text-3xl font-black tabular-nums text-[#001E50]">
                                    {stats.total}
                                </div>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#001E50]/5 text-[#001E50]">
                                <ClipboardList className="h-4.5 w-4.5" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${stats.total ? (stats.programmed / stats.total) * 100 : 0}%` }}
                                />
                                <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${stats.total ? (stats.finished / stats.total) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[9px] font-bold text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Programadas
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Terminadas
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                        <span className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[.12em] text-blue-500">
                                    Programadas
                                </div>
                                <div className="mt-1.5 text-3xl font-black tabular-nums text-blue-700">
                                    {stats.programmed}
                                </div>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <CalendarClock className="h-4.5 w-4.5" />
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100">
                                <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${stats.total ? (stats.programmed / stats.total) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black tabular-nums text-blue-600">
                                {stats.total ? Math.round((stats.programmed / stats.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <span className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-600">
                                    Terminadas
                                </div>
                                <div className="mt-1.5 text-3xl font-black tabular-nums text-emerald-700">
                                    {stats.finished}
                                </div>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${stats.total ? (stats.finished / stats.total) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black tabular-nums text-emerald-600">
                                {stats.total ? Math.round((stats.finished / stats.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
                        <span className="absolute inset-x-0 top-0 h-1 bg-cyan-500" />
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[9px] font-black uppercase leading-snug text-cyan-700">
                                    Comida / Capacitación
                                </div>
                                <div className="mt-1.5 flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black tabular-nums text-cyan-700">
                                        {stats.lunch}
                                    </span>
                                    <span className="text-sm font-black text-slate-300">/</span>
                                    <span className="text-3xl font-black tabular-nums text-cyan-700">
                                        {stats.training}
                                    </span>
                                </div>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                                <Coffee className="h-4.5 w-4.5" />
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[9px] font-black text-cyan-700">
                                <Coffee className="h-3 w-3" /> Comida
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[9px] font-black text-cyan-700">
                                <GraduationCap className="h-3 w-3" /> Capacitación
                            </span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                        <span className="absolute inset-x-0 top-0 h-1 bg-violet-500" />
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[.12em] text-violet-600">
                                    Horas programadas
                                </div>
                                <div className="mt-1.5 flex items-baseline gap-1 text-3xl font-black tabular-nums text-violet-800">
                                    {stats.hours.toFixed(2)}
                                    <span className="text-sm font-black text-violet-400">h</span>
                                </div>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                                <Clock3 className="h-4.5 w-4.5" />
                            </span>
                        </div>
                        <div className="mt-3 text-[10px] font-bold text-slate-400">
                            Suma de duración de actividades
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-12">
                    <div className="xl:col-span-5">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#001E50] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#001E50]" />
                                <input
                                    value={filters.q}
                                    onChange={(event) =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            q: event.target.value,
                                        }))
                                    }
                                    placeholder="Cliente, teléfono, VIN, orden o trabajo..."
                                    className="w-full text-sm font-semibold text-[#001E50] outline-none placeholder:text-slate-400"
                                />
                                {filters.q ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilters((previous) => ({
                                                ...previous,
                                                q: "",
                                            }))
                                        }
                                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-3">
                        <FilterBlock label="Técnico">
                            <select
                                value={filters.tecnico}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
                                        tecnico: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#001E50] bg-white px-3 py-2 text-sm font-semibold text-[#001E50] outline-none"
                            >
                                {techniciansFilter.map((technician) => (
                                    <option key={technician} value={technician}>
                                        {technician}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-4">
                        <FilterBlock label="Fecha de la agenda">
                            <div className="flex items-center overflow-hidden rounded-lg border border-[#001E50] bg-white">
                                <button
                                    type="button"
                                    onClick={() => moveDate(-1)}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#001E50] hover:bg-[#001E50]/10"
                                    title="Día anterior"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <input
                                    type="date"
                                    value={filters.fecha}
                                    onChange={(event) =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            fecha: event.target.value,
                                        }))
                                    }
                                    className="h-10 min-w-0 flex-1 border-x border-[#001E50]/30 px-3 text-center text-sm font-bold text-[#001E50] outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => moveDate(1)}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#001E50] hover:bg-[#001E50]/10"
                                    title="Día siguiente"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-12">
                        <FilterBlock label="Dealer">
                            <div className="flex flex-wrap gap-2">
                                {dealers.map((dealer) => {
                                    const active =
                                        filters.agencia === dealer;

                                    return (
                                        <button
                                            key={dealer}
                                            type="button"
                                            onClick={() =>
                                                setFilters((previous) => ({
                                                    ...previous,
                                                    agencia: dealer,
                                                    tecnico: "Todos",
                                                }))
                                            }
                                            className={[
                                                "rounded-lg border px-4 py-2 text-xs font-extrabold transition sm:text-sm",
                                                active
                                                    ? "border-[#001E50] bg-[#001E50] text-white shadow-sm"
                                                    : "border-[#001E50] bg-white text-[#001E50] hover:bg-[#001E50]/10",
                                            ].join(" ")}
                                        >
                                            {dealer}
                                        </button>
                                    );
                                })}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-12">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-3 text-xs font-bold text-slate-600">
                            <button
                                type="button"
                                onClick={goToToday}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                            >
                                <CalendarDays className="h-4 w-4" /> Hoy
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#001E50] bg-white px-3 py-2 text-sm font-bold text-[#001E50] hover:bg-[#001E50] hover:text-white"
                            >
                                <X className="h-4 w-4" /> Limpiar
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
                                {Object.entries(LEGEND_CHIPS).map(([key, meta]) => {
                                    const Icon = meta.icon;
                                    const active = highlightType === key;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() =>
                                                setHighlightType(active ? null : key)
                                            }
                                            title={active ? "Quitar resaltado" : `Resaltar ${meta.label}`}
                                            className={[
                                                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black transition",
                                                active
                                                    ? "ring-2 ring-[#001E50] ring-offset-1"
                                                    : "hover:-translate-y-0.5 hover:shadow-sm",
                                            ].join(" ")}
                                            style={{
                                                backgroundColor: meta.backgroundColor,
                                                borderColor: active ? "#001E50" : meta.borderColor,
                                                color: meta.color,
                                            }}
                                        >
                                            <Icon className="h-3 w-3" />
                                            {meta.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="ml-auto hidden text-right lg:block">
                                <div className="text-sm font-extrabold capitalize text-[#001E50]">
                                    {formatLongDate(filters.fecha)}
                                </div>
                                <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                    El estatus se muestra dentro de cada tarjeta.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loadingList ? (
                <div className="rounded-xl border border-black/10 bg-white p-10 text-center text-[#001E50]">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Cargando taller...
                </div>
            ) : vista === "agenda" ? (
                <WorkshopBoardLayout
                    agendaOrders={agendaOrders}
                    containerOrders={containerOrders}
                    technicians={techniciansInAgenda}
                    selectedDate={filters.fecha}
                    highlightType={highlightType}
                    onToggleHighlight={setHighlightType}
                    onEdit={openEdit}
                    onScheduleOrder={scheduleOrder}
                    onUnassignOrder={unassignOrder}
                    onResizeOrder={resizeOrder}
                    onMoveOrder={moveOrderToStage}
                />
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1450px] text-left text-sm">
                            <thead className="bg-[#001E50] text-xs text-white">
                                <tr>
                                    {[
                                        "Fecha",
                                        "Horario",
                                        "Cliente / actividad",
                                        "Orden",
                                        "Dealer",
                                        "Técnico",
                                        "Estatus",
                                        "Tipo",
                                        "Trabajos",
                                        "Duración",
                                    ].map((heading) => (
                                        <th key={heading} className="px-4 py-3 font-bold">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-4 py-10 text-center text-[#001E50]"
                                        >
                                            No hay actividades para esta fecha y filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    [...filtered]
                                        .sort((a, b) =>
                                            `${a.tecnico}-${a.hora_inicio}`.localeCompare(
                                                `${b.tecnico}-${b.hora_inicio}`,
                                            ),
                                        )
                                        .map((order) => (
                                            <tr
                                                key={order.id}
                                                onDoubleClick={() => openEdit(order)}
                                                className="cursor-pointer hover:bg-blue-50/50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-[#001E50]">
                                                    {order.fecha_programada}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-bold text-[#001E50]">
                                                    {order.hora_inicio} - {order.hora_fin}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-extrabold text-[#001E50]">
                                                        {getActivityLabel(order)}
                                                    </div>
                                                    {order.tipo_bloque === "trabajo" ? (
                                                        <div className="text-xs text-slate-500">
                                                            {order.telefono}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-[#001E50]">
                                                    {order.no_orden || "—"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-[#001E50]">
                                                    {order.agencia || "—"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-[#001E50]">
                                                    {order.tecnico || "Sin técnico"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <StatusBadge status={order.estatus_agenda} />
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-bold capitalize text-[#001E50]">
                                                    {order.tipo_bloque === "trabajo"
                                                        ? getWorkTypeMeta(order).label
                                                        : order.tipo_bloque === "capacitacion"
                                                            ? "Capacitación"
                                                            : order.tipo_bloque}
                                                </td>
                                                <td className="px-4 py-3 text-[#001E50]">
                                                    {order.subtrabajos
                                                        .map((work) => work.nombre)
                                                        .join(" + ")}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-extrabold text-[#001E50]">
                                                    {order.horasAgenda.toFixed(2)} h
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                open={openModal}
                title={
                    editingOrden
                        ? `Editar actividad • ${getActivityLabel(editingOrden)}`
                        : "Nueva actividad de taller"
                }
                onClose={closeModal}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={saveOrder}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#001E50] px-4 py-2 text-sm font-bold text-white hover:bg-[#001E50]/90 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar
                        </button>
                    </>
                }
            >
                {!draft ? null : (
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Tipo de actividad" icon={ListChecks}>
                            <select
                                value={draft.tipo_bloque}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        tipo_bloque: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                {TIPOS_BLOQUE.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Técnico asignado" icon={UserCog}>
                            <select
                                value={draft.tecnico || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        tecnico: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un técnico...
                                </option>
                                {techniciansForDraft.map((technician) => (
                                    <option key={technician} value={technician}>
                                        {technician}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Estatus" icon={CheckCircle2}>
                            <select
                                value={draft.estatus_agenda}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        estatus_agenda: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                {ESTATUS_AGENDA.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Fecha programada" icon={CalendarDays}>
                            <input
                                type="date"
                                value={draft.fecha_programada || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        fecha_programada: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Hora de inicio" icon={Clock3}>
                            <input
                                type="time"
                                min="08:30"
                                max="19:45"
                                step="900"
                                value={draft.hora_inicio || HORA_INICIO_TEXTO}
                                onChange={(event) => {
                                    const start = event.target.value;
                                    const currentEnd = timeToMinutes(draft.hora_fin);
                                    const startMinutes = timeToMinutes(start);
                                    const nextEnd =
                                        currentEnd !== null &&
                                            startMinutes !== null &&
                                            currentEnd > startMinutes
                                            ? draft.hora_fin
                                            : calculateEndTime(start, 1);

                                    setDraft((previous) => ({
                                        ...previous,
                                        hora_inicio: start,
                                        hora_fin: nextEnd,
                                    }));
                                }}
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Hora de fin" icon={Clock3}>
                            <input
                                type="time"
                                min="08:45"
                                max="20:00"
                                step="900"
                                value={draft.hora_fin || "09:30"}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        hora_fin: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(event) => {
                                    const nextDealer =
                                        event.target.value;

                                    const allowedTechnicians =
                                        uniqueStrings([
                                            ...getOfficialTechniciansByDealer(
                                                nextDealer,
                                            ),
                                            ...ordenes
                                                .filter(
                                                    (order) =>
                                                        normalizeKey(
                                                            order.agencia,
                                                        ) ===
                                                        normalizeKey(
                                                            nextDealer,
                                                        ),
                                                )
                                                .map((order) =>
                                                    canonicalTechnician(
                                                        order.tecnico,
                                                    ),
                                                )
                                                .filter(Boolean),
                                        ]);

                                    setDraft((previous) => ({
                                        ...previous,
                                        agencia: nextDealer,
                                        tecnico:
                                            allowedTechnicians.some(
                                                (technician) =>
                                                    normalizeKey(
                                                        technician,
                                                    ) ===
                                                    normalizeKey(
                                                        previous.tecnico,
                                                    ),
                                            )
                                                ? previous.tecnico
                                                : "",
                                    }));
                                }}
                                disabled={
                                    Boolean(editingOrden && !editingOrden.isManual) ||
                                    (!isAdmin && userAgencias.length <= 1)
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Sin dealer</option>
                                {(isAdmin
                                    ? dealers.filter(
                                        (dealer) => dealer !== "Todos",
                                    )
                                    : userAgencias
                                ).map((dealer) => (
                                    <option key={dealer} value={dealer}>
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {draft.tipo_bloque === "trabajo" ? (
                            <>
                                {editingOrden && !editingOrden.isManual ? (
                                    <div className="rounded-xl border border-black/10 bg-white p-4 md:col-span-2">
                                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                                            <div>
                                                <b className="text-[#001E50]">Cliente:</b>{" "}
                                                {editingOrden.cliente}
                                            </div>
                                            <div>
                                                <b className="text-[#001E50]">Teléfono:</b>{" "}
                                                {editingOrden.telefono}
                                            </div>
                                            <div>
                                                <b className="text-[#001E50]">Orden:</b>{" "}
                                                {editingOrden.no_orden || "—"}
                                            </div>
                                            <div>
                                                <b className="text-[#001E50]">VIN:</b>{" "}
                                                {editingOrden.vin || "—"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Field label="No. orden / preorden" icon={ClipboardList}>
                                            <input
                                                value={draft.no_orden}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        no_orden: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="Cliente" icon={User}>
                                            <input
                                                value={draft.cliente}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        cliente: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="Teléfono" icon={Phone}>
                                            <input
                                                value={draft.telefono}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        telefono: event.target.value.replace(
                                                            /\D/g,
                                                            "",
                                                        ),
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="VIN" icon={CarFront}>
                                            <input
                                                value={draft.vin}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        vin: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="Modelo" icon={CarFront}>
                                            <input
                                                value={draft.modelo}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        modelo: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>
                                    </>
                                )}

                                <Field label="Etapa operativa" icon={ListChecks}>
                                    <select
                                        value={draft.etapa || "Ingreso con Cita"}
                                        onChange={(event) =>
                                            setDraft((previous) => ({
                                                ...previous,
                                                etapa: event.target.value,
                                            }))
                                        }
                                        className={[inputBase, inputOk].join(" ")}
                                    >
                                        <optgroup label="En proceso">
                                            {ETAPAS_PROCESO.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Fuera de proceso / WIP">
                                            {ETAPAS_WIP.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Terminado">
                                            {ETAPAS_TERMINADO.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </Field>
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2">
                                {draft.tipo_bloque === "comida" ? (
                                    <div className="flex items-center gap-2">
                                        <Coffee className="h-5 w-5 text-cyan-700" />
                                        Este bloque aparecerá en color azul dentro del horario del técnico.
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-orange-600" />
                                        Este bloque aparecerá en color naranja dentro del horario del técnico.
                                    </div>
                                )}
                            </div>
                        )}

                        <Field
                            label="Comentarios de taller"
                            icon={ClipboardList}
                            className="md:col-span-2"
                        >
                            <textarea
                                value={draft.comentarios_taller || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        comentarios_taller: event.target.value,
                                    }))
                                }
                                className={[
                                    inputBase,
                                    inputOk,
                                    "min-h-[90px] resize-y",
                                ].join(" ")}
                                placeholder="Notas internas para el equipo de taller..."
                            />
                        </Field>

                        {draft.tipo_bloque === "trabajo" ? (
                            <div className="rounded-xl border border-black/10 bg-white p-4 md:col-span-2">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#001E50]">
                                        <Wrench className="h-4 w-4" /> Trabajos asignados
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSubtask}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#001E50] px-3 py-2 text-xs font-bold text-white hover:bg-[#001E50]/90"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Agregar
                                    </button>
                                </div>

                                <div className="grid gap-2">
                                    {(draft.subtrabajos || []).map((work, index) => (
                                        <div
                                            key={work.id || index}
                                            className="grid gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-12"
                                        >
                                            <div className="md:col-span-7">
                                                <select
                                                    value={work.nombre || ""}
                                                    onChange={(event) =>
                                                        updateSubtask(index, {
                                                            nombre: event.target.value,
                                                        })
                                                    }
                                                    className={[inputBase, inputOk].join(" ")}
                                                >
                                                    <option value="">Selecciona trabajo...</option>
                                                    {TIPOS_SERVICIO.map((type) => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.25"
                                                    value={work.horas ?? 0}
                                                    onChange={(event) =>
                                                        updateSubtask(index, {
                                                            horas: event.target.value,
                                                        })
                                                    }
                                                    className={[inputBase, inputOk].join(" ")}
                                                    placeholder="Horas"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubtask(index)}
                                                    disabled={(draft.subtrabajos || []).length <= 1}
                                                    className="inline-flex h-full w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}