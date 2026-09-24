// src/config/interfaces.js
// Catálogo único de interfaces (menú lateral).
// Las claves ("key") deben coincidir con PERMISOS_POR_INTERFAZ del backend
// (CrmConformidad/catalogo_interfaces.py).

import {
    BanknoteArrowUp,
    ArchiveX,
    CircleDollarSign,
    Car,
    LayoutDashboard,
    BadgeCheck,
    HandCoins,
    ClipboardCheck,
    UserCheck,
    Send,
    FileSearchCorner,
    TrendingUp,
    BrainCircuit,
    UsersRound,
    Zap,
    Workflow,
    Globe,
    CalendarCheck,
    UserSearch,
    QrCode,
    Settings2,
} from "lucide-react";

// Orden de las secciones tal como aparecen en el menú.
export const SECTION_ORDER = [
    "Negocio",
    "Comercial",
    "Retención",
    "Marketing",
    "Financiero",
    "Herramientas",
    "Administrativos",
    "Configuración",
];

export const INTERFACES = [
    {
        key: "gestion_negocio",
        section: "Negocio",
        to: "/gestion_negocio",
        label: "Gestión de Negocio",
        icon: BanknoteArrowUp,
        permisos: ["USUARIOS_ADMIN", "CRM_COORDINADOR_DIGITAL"],
    },
    {
        key: "partes",
        section: "Negocio",
        to: "/partes",
        label: "Partes",
        icon: ArchiveX,
        permisos: ["USUARIOS_ADMIN", "CRM_COORDINADOR_DIGITAL"],
    },
    {
        key: "servicio",
        section: "Negocio",
        to: "/servicio",
        label: "Servicio",
        icon: CircleDollarSign,
        permisos: ["USUARIOS_ADMIN", "CRM_COORDINADOR_DIGITAL"],
    },
    {
        key: "usados",
        section: "Negocio",
        to: "/usados",
        label: "Autos Usados",
        icon: Car,
        permisos: ["USUARIOS_ADMIN", "CRM_VENTAS", "CRM_DIGITALES", "CRM_CALIDAD", "CRM_VALUADOR"],
    },
    {
        key: "inicio",
        section: "Comercial",
        to: "/",
        label: "Inicio",
        icon: LayoutDashboard,
        permisos: [],
        alwaysOn: true,
    },
    {
        key: "calidad",
        section: "Comercial",
        to: "/calidad",
        label: "Gestión de Calidad",
        icon: BadgeCheck,
        permisos: ["CRM_RECLAMACIONES", "USUARIOS_ADMIN", "CRM_CALIDAD"],
    },
    {
        key: "comercial",
        section: "Comercial",
        to: "/comercial",
        label: "Gestión Comercial",
        icon: HandCoins,
        permisos: [
            "CRM_RECLAMACIONES",
            "CRM_DIGITALES",
            "CRM_VENTAS",
            "USUARIOS_ADMIN",
            "CRM_CALIDAD",
            "CRM_CALL_CENTER",
            "CRM_COORDINADOR_DIGITAL",
        ],
    },
    {
        key: "postventa",
        section: "Comercial",
        to: "/postventa",
        label: "Postventa",
        icon: ClipboardCheck,
        permisos: ["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD", "CRM_CALL_CENTER"],
    },
    {
        key: "retencion",
        section: "Retención",
        to: "/retencion",
        label: "Retención",
        icon: UserCheck,
        permisos: ["USUARIOS_ADMIN", "CRM_VENTAS", "CRM_CALIDAD", "CRM_CALL_CENTER"],
    },
    {
        key: "retencion_no_ventas",
        section: "Retención",
        to: "/retencion_no_ventas",
        label: "Retención No V.",
        icon: UserCheck,
        permisos: ["USUARIOS_ADMIN", "CRM_VENTAS", "CRM_CALIDAD", "CRM_CALL_CENTER"],
    },
    {
        key: "encuesta_whats",
        section: "Marketing",
        to: "/encuesta_whats",
        label: "Envío Encuestas",
        icon: Send,
        permisos: ["CRM_RECLAMACIONES", "CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"],
    },
    {
        key: "facturas",
        section: "Marketing",
        to: "/facturas",
        label: "Facturas",
        icon: FileSearchCorner,
        permisos: ["USUARIOS_ADMIN", "CRM_CALIDAD"],
    },
    {
        key: "financieros",
        section: "Financiero",
        to: "/financieros",
        label: "Servicios Financieros",
        icon: TrendingUp,
        permisos: [
            "CRM_FINANCIEROS",
            "USUARIOS_ADMIN",
            "CRM_CALIDAD",
            "CRM_VENTAS",
            "CRM_COORDINADOR_DIGITAL",
            "CRM_DIGITALES",
            "CRM_ASESOR_PISO",
        ],
    },
    {
        key: "config_ia",
        section: "Herramientas",
        to: "/configuracion_ia",
        label: "Panel de Inteligencias Artificiales",
        icon: BrainCircuit,
        permisos: ["USUARIOS_ADMIN", "CRM_DIGITALES", "CRM_COORDINADOR_DIGITAL"],
    },
    {
        key: "admin_asesores",
        section: "Herramientas",
        to: "/administracion_asesores",
        label: "Administración de Asesores",
        icon: UsersRound,
        permisos: ["USUARIOS_ADMIN"],
    },
    {
        key: "timeforaction",
        section: "Herramientas",
        to: "/timeforaction",
        label: "TimeForAction",
        icon: Zap,
        permisos: ["USUARIOS_ADMIN", "CRM_CALIDAD"],
    },
    {
        key: "flujo_procesos",
        section: "Herramientas",
        to: "/flujo_procesos",
        label: "Flows",
        icon: Workflow,
        permisos: ["USUARIOS_ADMIN", "CRM_CALIDAD"],
    },
    {
        key: "webs",
        section: "Herramientas",
        to: "/webs",
        label: "Interfacez Web",
        icon: Globe,
        permisos: ["USUARIOS_ADMIN", "CRM_CALIDAD"],
    },
    {
        key: "gestor_actividades",
        section: "Herramientas",
        to: "/gestor_actividades",
        label: "Gestor de Actividades",
        icon: CalendarCheck,
        permisos: ["USUARIOS_ADMIN", "CRM_CALIDAD"],
    },
    {
        key: "administrativos",
        section: "Administrativos",
        to: "/administrativos",
        label: "Reclutamiento y Seleccion",
        icon: UserSearch,
        permisos: ["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"],
    },
    {
        key: "qr",
        section: "Configuración",
        to: "/qr",
        label: "QR",
        icon: QrCode,
        permisos: ["USUARIOS_ADMIN"],
    },
    {
        key: "configuracion",
        section: "Configuración",
        to: "/configuracion",
        label: "Configuración",
        icon: Settings2,
        permisos: ["USUARIOS_ADMIN"],
    },
];

// true si el usuario tiene al menos uno de los permisos (o es superusuario).
export function tieneAlgunPermiso(permisos = [], permitidos = []) {
    if (permisos.includes("ALL")) return true;
    return permitidos.some((permiso) => permisos.includes(permiso));
}

// Interfaz visible: respeta el override manual del usuario (user.interfaces)
// o, si no hay override, los permisos.
export function interfazVisible(item, permisos = [], interfaces = null) {
    if (item.alwaysOn) return true;
    if (Array.isArray(interfaces)) {
        return interfaces.includes(item.key);
    }
    return tieneAlgunPermiso(permisos, item.permisos);
}

// Claves de interfaces visibles dado un set de permisos (para precargar el editor).
export function interfacesDesdePermisos(permisos = []) {
    return INTERFACES.filter((item) => interfazVisible(item, permisos, null)).map((item) => item.key);
}