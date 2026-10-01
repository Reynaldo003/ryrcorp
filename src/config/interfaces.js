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
        roles: ["Asesor Digital", "Asesor General"],
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
// o, si no hay override, los permisos. Con permiso ALL (administradores)
// el menú siempre se muestra completo.
export function interfazVisible(item, permisos = [], interfaces = null, rol = "") {
    if (item.alwaysOn) return true;
    if (permisos.includes("ALL")) return true;
    if (Array.isArray(interfaces)) {
        if (interfaces.includes(item.key)) return true;

        // Si tiene submódulos del catálogo activos, el módulo es visible.
        return submodulosDeInterfaz(item.key).some((sub) =>
            interfaces.includes(`${item.key}:${sub.key}`)
        );
    }
    // Visible por rol (independiente de permisos); p. ej. "Asesor Digital".
    if (Array.isArray(item.roles)) {
        const rolNorm = String(rol || "").trim().toLowerCase();
        if (item.roles.some((r) => String(r).trim().toLowerCase() === rolNorm)) {
            return true;
        }
    }
    return tieneAlgunPermiso(permisos, item.permisos);
}

// Claves de interfaces visibles dado un set de permisos (para precargar el editor).
export function interfacesDesdePermisos(permisos = []) {
    return INTERFACES.filter((item) => interfazVisible(item, permisos, null)).map((item) => item.key);
}

// true si el usuario tiene la interfaz manual activada (clave del catálogo).
export function interfazActivada(user, key) {
    return Array.isArray(user?.interfaces) && user.interfaces.includes(key);
}

// Catálogo de submódulos (pestañas) por interfaz.
// La clave de un submódulo se almacena como "<interfaz>:<submodulo>".
export const SUBMODULOS_POR_INTERFAZ = {
    gestion_negocio: [
        { key: "inventario", label: "Inventario", to: "/gestion_negocio/inventario" },
        { key: "autos_nuevos", label: "Autos Nuevos", to: "/gestion_negocio/autos_nuevos" },
        { key: "prospectos_digitales", label: "Prospectos Digitales", to: "/gestion_negocio/prospectos_digitales" },
        { key: "citas", label: "Citas", to: "/gestion_negocio/citas" },
        { key: "ingresos_piso", label: "Ingresos de Piso", to: "/gestion_negocio/ingresos_piso" },
        { key: "pruebas_manejo", label: "Pruebas de Manejo", to: "/gestion_negocio/pruebas_manejo" },
        { key: "solicitudes_credito", label: "Solicitudes de Crédito", to: "/gestion_negocio/solicitudes_credito" },
    ],
    partes: [
        { key: "refacciones_obsolescencia", label: "Obsolescencia de Refacciones", to: "/partes/refacciones_obsolescencia" },
        { key: "compra_refacciones", label: "Compra de Refacciones", to: "/partes/compra_refacciones" },
    ],
    servicio: [
        { key: "presupuestos", label: "Presupuestos de Servicio", to: "/servicio/presupuestos" },
        { key: "gota", label: "GOTA - Gestor de Ordenes de Taller Activas", to: "/servicio/gota" },
    ],
    usados: [
        { key: "avaluos", label: "Avaluos", to: "/usados/avaluos" },
        { key: "valuaciones", label: "Valuaciones", to: "/usados/valuaciones" },
        { key: "inventario", label: "Inventario", to: "/usados/inventario" },
    ],
    calidad: [
        { key: "reclamaciones", label: "Reclamaciones", to: "/calidad/reclamaciones" },
        { key: "enc_satisfaccion", label: "Experiencia de Entrega", to: "/calidad/enc_satisfaccion" },
        { key: "enc_piso", label: "Experiencia de Piso", to: "/calidad/enc_piso" },
        { key: "enc_servicio", label: "Experiencia de Servicio", to: "/calidad/enc_servicio" },
        { key: "jdpower", label: "Encuestas JD Power", to: "/calidad/jdpower" },
        { key: "jdpower-servicio", label: "JD Power Servicio", to: "/calidad/jdpower-servicio" },
        { key: "no-conformidad", label: "No Conformidad", to: "/calidad/no-conformidad" },
    ],
    comercial: [
        { key: "prospectos", label: "Prospectos", to: "/comercial/prospectos" },
        { key: "plantillas", label: "Plantillas", to: "/comercial/prospectos/plantillas" },
        { key: "contacto", label: "Contacto", to: "/comercial/prospectos/contacto" },
        { key: "bandeja", label: "Bandeja", to: "/comercial/prospectos/bandeja" },
        { key: "rendimiento_digitales", label: "Rendimiento Digital", to: "/comercial/prospectos/rendimiento_digitales" },
        { key: "citas", label: "Citas", to: "/comercial/citas" },
        { key: "trafico_piso", label: "Tráfico piso", to: "/comercial/trafico_piso" },
        { key: "pruebas_manejo", label: "Pruebas", to: "/comercial/pruebas_manejo" },
        { key: "entregas", label: "Entregas", to: "/comercial/entregas" },
        { key: "campanas_meta", label: "Campañas Meta", to: "/comercial/campanas_meta" },
    ],
    postventa: [
        { key: "pedidos_piezas", label: "Pedidos de Piezas", to: "/postventa/pedidos_piezas" },
        { key: "hoja_ingresos", label: "Hoja de Ingresos", to: "/postventa/hoja_ingresos" },
        { key: "taller", label: "Panel Taller", to: "/postventa/taller" },
        { key: "safety", label: "Safety Culture", to: "/postventa/safety" },
    ],
    financieros: [
        { key: "credito", label: "Solicitudes Crédito", to: "/financieros/credito" },
        { key: "long_drive", label: "Long Drive", to: "/financieros/long_drive" },
        { key: "documentacion", label: "Documentacion", to: "/financieros/documentacion" },
    ],
    encuesta_whats: [
        { key: "envio_satisfaccion", label: "Envio de Encuestas", to: "/encuesta_whats/envio_satisfaccion" },
    ],
    administrativos: [
        { key: "reclutamiento", label: "Reclutamiento", to: "/administrativos/reclutamiento" },
        { key: "alta-personal", label: "Alta del Personal", to: "/administrativos/alta-personal" },
        { key: "puestos", label: "Puestos", to: "/administrativos/puestos" },
        { key: "ambiente-laboral", label: "Ambiente laboral", to: "/administrativos/ambiente-laboral" },
    ],
};

export function submodulosDeInterfaz(key) {
    return SUBMODULOS_POR_INTERFAZ[key] || [];
}

// Estado de un submódulo para un usuario con interfaces manuales:
//   true  => activo (módulo completo o submódulo seleccionado)
//   false => no activo
//   null  => el usuario no tiene override manual (usar permisos/rol)
export function submoduloActivo(user, interfazKey, submoduloKey) {
    if (!Array.isArray(user?.interfaces)) return null;

    if (user.interfaces.includes(interfazKey)) return true;

    return user.interfaces.includes(`${interfazKey}:${submoduloKey}`);
}

// Claves compuestas del catálogo presentes en las interfaces del usuario.
export function clavesCompuestasEnInterfaces(interfaces = []) {
    const compuestas = new Set();

    for (const [interfazKey, submodulos] of Object.entries(SUBMODULOS_POR_INTERFAZ)) {
        submodulos.forEach((sub) => {
            if (interfaces.includes(`${interfazKey}:${sub.key}`)) {
                compuestas.add(`${interfazKey}:${sub.key}`);
            }
        });
    }

    return [...compuestas];
}

// Visibilidad de un submódulo para una pestaña del TopNav.
// Si el usuario NO tiene override manual, usa el fallback (condición de
// permisos existente). Si lo tiene, decide por el override.
export function submoduloVisible(user, interfazKey, submoduloKey, fallback = true) {
    if (!Array.isArray(user?.interfaces)) return fallback;

    return submoduloActivo(user, interfazKey, submoduloKey);
}