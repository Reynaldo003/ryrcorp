// src/pages/Tableros/config/catalogoModulos.js
import {
    Banknote,
    ArchiveX,
    Wrench,
    Car,
    HandCoins,
    TrendingUp,
    UserCheck,
    Send,
} from "lucide-react";

export const AGENCIAS = [
    "Todas las agencias",
    "VW Córdoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxpan",
    "VW Tuxtepec",
];

export const MESES = [
    { key: "01", label: "Ene", num: 1 },
    { key: "02", label: "Feb", num: 2 },
    { key: "03", label: "Mar", num: 3 },
    { key: "04", label: "Abr", num: 4 },
    { key: "05", label: "May", num: 5 },
    { key: "06", label: "Jun", num: 6 },
    { key: "07", label: "Jul", num: 7 },
    { key: "08", label: "Ago", num: 8 },
    { key: "09", label: "Sep", num: 9 },
    { key: "10", label: "Oct", num: 10 },
    { key: "11", label: "Nov", num: 11 },
    { key: "12", label: "Dic", num: 12 },
];

// Paleta armónica de azules para Recharts y visualizaciones
export const PALETA_AZULES = [
    "#001E50", // Azul marino VW
    "#0C3473", // Azul zafiro
    "#164E9B", // Azul cobalto medio
    "#1D5FD1", // Azul rey
    "#1677FF", // Azul eléctrico
    "#0284C7", // Azul océano
    "#0EA5E9", // Azul cian
    "#38BDF8", // Azul glaciar
];

export const COLOR_CONFIG = {
    blue: {
        headerBg: "#001E50",
        barBg: "#1677FF",
        accent: "#1677FF",
    },

    teal: {
        headerBg: "#0F766E",
        barBg: "#14B8A6",
        accent: "#14B8A6",
    },

    amber: {
        headerBg: "#92400E",
        barBg: "#F59E0B",
        accent: "#F59E0B",
    },

    cyan: {
        headerBg: "#155E75",
        barBg: "#06B6D4",
        accent: "#06B6D4",
    },

    indigo: {
        headerBg: "#3730A3",
        barBg: "#6366F1",
        accent: "#6366F1",
    },

    emerald: {
        headerBg: "#047857",
        barBg: "#10B981",
        accent: "#10B981",
    },

    violet: {
        headerBg: "#6D28D9",
        barBg: "#8B5CF6",
        accent: "#8B5CF6",
    },

    rose: {
        headerBg: "#BE123C",
        barBg: "#F43F5E",
        accent: "#F43F5E",
    },
};

export const CATALOGO_CRM = [
    {
        seccion: "Negocio",
        modulos: [
            {
                id: "gestion_negocio",
                nombre: "Gestión de Negocio",
                icon: Banknote,
                color: "blue",
                disponible: true,
                submodulos: [
                    { id: "inventario", nombre: "Inventario" },
                    { id: "autos_nuevos", nombre: "Autos Nuevos" },
                    { id: "prospectos_digitales", nombre: "Prospectos Digitales" },
                    { id: "citas", nombre: "Citas" },
                    { id: "ingresos_piso", nombre: "Ingresos de Piso" },
                    { id: "pruebas_manejo", nombre: "Pruebas de Manejo" },
                    { id: "solicitudes_credito", nombre: "Solicitudes de Crédito" },
                ],
            },
            {
                id: "partes",
                nombre: "Partes",
                icon: ArchiveX,
                color: "amber",
                disponible: false,
                submodulos: [
                ],
            },
            {
                id: "servicio",
                nombre: "Servicio",
                icon: Wrench,
                color: "cyan",
                disponible: false,
                submodulos: [
                ],
            },
            {
                id: "usados",
                nombre: "Autos Usados",
                icon: Car,
                color: "indigo",
                disponible: false,
                submodulos: [
                ],
            },
        ],
    },
    {
        seccion: "Comercial",
        modulos: [
            {
                id: "comercial",
                nombre: "Gestión Comercial",
                icon: HandCoins,
                color: "teal",
                disponible: true,
                submodulos: [
                    {
                        id: "comercial_prospectos",
                        nombre: "Prospectos",
                    },
                    {
                        id: "comercial_rendimiento_digital",
                        nombre: "Rendimiento Digital",
                    },
                    {
                        id: "comercial_citas",
                        nombre: "Citas",
                    },
                    {
                        id: "comercial_trafico_piso",
                        nombre: "Tráfico Piso",
                    },
                    {
                        id: "comercial_pruebas",
                        nombre: "Pruebas",
                    },
                    {
                        id: "comercial_entregas",
                        nombre: "Entregas",
                    },
                    {
                        id: "comercial_campanas_meta",
                        nombre: "Campañas Meta",
                    },
                ],
            },
        ],
    },
    {
        seccion: "Financiero",
        modulos: [
            {
                id: "financieros",
                nombre: "Servicios Financieros",
                icon: TrendingUp,
                color: "emerald",
                disponible: false,
                submodulos: [
                ],
            },
        ],
    },
    {
        seccion: "Retención",
        modulos: [
            {
                id: "retencion",
                nombre: "Retención",
                icon: UserCheck,
                color: "violet",
                disponible: false,
                submodulos: [
                ],
            },
        ],
    },
    {
        seccion: "Marketing",
        modulos: [
            {
                id: "marketing",
                nombre: "Marketing",
                icon: Send,
                color: "rose",
                disponible: false,
                submodulos: [
                ],
            },
        ],
    },
];