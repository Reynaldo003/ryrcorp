// src/pages/Tableros/Tableros.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    Columns2,
    Calendar,
    Building2,
    Plus,
    X,
    Layers,
    Trash2,
    RotateCcw,
    Loader2,
    TrendingUp,
    HandCoins,
    Car,
    MessageSquare,
    FolderKanban,
    Wrench,
    ArchiveX,
    UserCheck,
    Send,
    BarChart3,
    AlertCircle,
    Info,
    Search,
    Globe,
    FileText,
    CreditCard,
    CalendarDays,
    BanknoteArrowUp,
    CheckCircle2,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

import { http } from "../../lib/apiPruebas";
import { apiTraficoPiso } from "../../lib/apiTraficoPiso";
import { apiDocumentacion } from "../../lib/apiDocumentacion";

const AGENCIAS = [
    "Todas las agencias",
    "VW Córdoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxpan",
    "VW Tuxtepec",
];

const MESES = [
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

const COLOR_CONFIG = {
    blue: { headerBg: "#001E50", barBg: "#1677FF", accent: "#1677FF" },
    emerald: { headerBg: "#065F46", barBg: "#059669", accent: "#059669" },
    indigo: { headerBg: "#1E1B4B", barBg: "#4F46E5", accent: "#4F46E5" },
    amber: { headerBg: "#78350F", barBg: "#D97706", accent: "#D97706" },
    teal: { headerBg: "#134E4A", barBg: "#0D9488", accent: "#0D9488" },
    orange: { headerBg: "#7C2D12", barBg: "#EA580C", accent: "#EA580C" },
    rose: { headerBg: "#881337", barBg: "#E11D48", accent: "#E11D48" },
    purple: { headerBg: "#581C87", barBg: "#9333EA", accent: "#9333EA" },
};

// Catálogo del CRM organizado por Sección -> Módulo -> Submódulos
const CATALOGO_CRM = [
    {
        seccion: "Negocio",
        modulos: [
            {
                id: "gestion_negocio",
                nombre: "Gestión de Negocio",
                icon: BanknoteArrowUp,
                color: "blue",
                submodulos: [
                    { id: "prospectos_digitales", nombre: "Prospectos Digitales (Funnel Ejecutivo)" },
                    { id: "ingresos_piso", nombre: "Ingresos Piso (Tráfico de Piso)" },
                    { id: "citas", nombre: "Citas (Agendadas vs Asistidas)" },
                    { id: "autos_nuevos", nombre: "Autos Nuevos (Ventas VN)" },
                    { id: "inventario", nombre: "Inventario General" },
                ],
            },
            {
                id: "partes",
                nombre: "Partes",
                icon: ArchiveX,
                color: "orange",
                submodulos: [
                    { id: "refacciones_obsolescencia", nombre: "Refacciones y Obsolescencia" },
                    { id: "compra_refacciones", nombre: "Compra de Refacciones" },
                ],
            },
            {
                id: "servicio",
                nombre: "Servicio",
                icon: Wrench,
                color: "teal",
                submodulos: [
                    { id: "presupuestos", nombre: "Presupuestos de Taller" },
                    { id: "gota", nombre: "Monitoreo GOTA" },
                ],
            },
            {
                id: "usados",
                nombre: "Autos Usados",
                icon: Car,
                color: "amber",
                submodulos: [
                    { id: "avaluos", nombre: "Avalúos e Inspecciones" },
                    { id: "inventario_usados", nombre: "Inventario de Seminuevos" },
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
                color: "indigo",
                submodulos: [
                    { id: "comercial_prospectos", nombre: "Prospectos y Contacto" },
                    { id: "comercial_citas", nombre: "Citas y Pruebas de Manejo" },
                    { id: "comercial_trafico", nombre: "Tráfico de Piso (Control)" },
                    { id: "comercial_entregas", nombre: "Entregas de Unidades" },
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
                color: "indigo",
                submodulos: [
                    { id: "expedientes_checklist", nombre: "Expedientes y Checklist Documental" },
                    { id: "credito_leasing", nombre: "Distribución Credit vs Leasing" },
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
                color: "rose",
                submodulos: [
                    { id: "retencion_general", nombre: "Seguimiento de Retención" },
                    { id: "retencion_no_ventas", nombre: "Motivos de No Venta" },
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
                color: "purple",
                submodulos: [
                    { id: "encuesta_whats", nombre: "Envío de Encuestas WhatsApp" },
                    { id: "facturas", nombre: "Análisis de Facturas y Pautas" },
                ],
            },
        ],
    },
];

function PanelModulo({ panel, filtros, onCambiarSubmodulo, onEliminar, totalPaneles }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [datos, setDatos] = useState(null);

    const todosModulos = useMemo(() => CATALOGO_CRM.flatMap((s) => s.modulos), []);
    const infoModulo = useMemo(() => todosModulos.find((m) => m.id === panel.moduloId), [todosModulos, panel.moduloId]);

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const anio = filtros.anio || "2026";
            const mesNum = Number(filtros.meses?.[0] || 10);
            const pad = (n) => String(n).padStart(2, "0");
            const mesStart = `${anio}-${pad(mesNum)}-01`;
            const ultimoDia = new Date(Number(anio), mesNum, 0).getDate();
            const mesEnd = `${anio}-${pad(mesNum)}-${pad(ultimoDia)}`;

            const agenciaQuery = filtros.agencia === "Todas las agencias" || filtros.agencia === "Todas" ? "" : filtros.agencia;

            // 1. GESTIÓN DE NEGOCIO -> PROSPECTOS DIGITALES
            if (panel.moduloId === "gestion_negocio" && panel.submoduloId === "prospectos_digitales") {
                const queryAgencia = agenciaQuery ? `&agencia=${encodeURIComponent(agenciaQuery.replace("VW ", "").trim())}` : "";

                // Consultar directamente los endpoints analíticos de backend sin interceptor de número de asesor
                const [resNegocio, resCitas] = await Promise.all([
                    http(`/digitales/analitica/negocio-stats/?anio=${anio}&mes=${mesNum}&todos=1${queryAgencia}`).catch(() => null),
                    http(`/digitales/analitica/citas-stats/?anio=${anio}&mes=${mesNum}&todos=1${queryAgencia}`).catch(() => null),
                ]);

                // Asesores del periodo reportados por la analítica oficial
                const asesores = (resNegocio?.asesores || []).filter((a) => {
                    const n = String(a?.nombre || "").toLowerCase();
                    return n && !n.includes("sin asesor") && !n.includes("null");
                });

                // Total de prospectos digitales calculado
                const totalProspectos = asesores.reduce((sum, a) => sum + Number(a.prospectos || 0), 0) || Number(resNegocio?.embudo?.[0]?.total || 0);

                const citasConcertadas = Number(resCitas?.citas_concertadas || 0);
                const citasEfectivas = Number(resCitas?.citas_efectivas || 0);

                const cotizados = asesores.reduce((sum, a) => sum + Number(a.cotizaciones || 0), 0);
                const facturados = asesores.reduce((sum, a) => sum + Number(a.facturados || 0), 0);

                const pct = (v) => (totalProspectos > 0 ? Math.round((v / totalProspectos) * 1000) / 10 : 0);

                setDatos({
                    tipo: "embudo",
                    kpis: [
                        { label: "Prospectos", valor: totalProspectos, icon: Globe },
                        { label: "Cotizados", valor: `${cotizados} (${pct(cotizados)}%)`, icon: FileText },
                        { label: "Crédito", valor: 0, icon: CreditCard },
                        { label: "Facturados", valor: `${facturados} (${pct(facturados)}%)`, icon: Car },
                    ],
                    etapas: [
                        { etapa: "Total Prospectos Digitales", cantidad: totalProspectos, porcentaje: 100 },
                        { etapa: "Citas Agendadas a Showroom", cantidad: citasConcertadas, porcentaje: pct(citasConcertadas) },
                        { etapa: "Asistencias Efectivas", cantidad: citasEfectivas, porcentaje: pct(citasEfectivas) },
                        { etapa: "Cotizaciones Documentadas", cantidad: cotizados, porcentaje: pct(cotizados) },
                        { etapa: "Solicitudes de Crédito", cantidad: 0, porcentaje: 0 },
                        { etapa: "Facturados / Cierre de Venta", cantidad: facturados, porcentaje: pct(facturados) },
                    ],
                    totalInicial: totalProspectos,
                    cierreFinal: facturados,
                });
            }

            // 2. GESTIÓN DE NEGOCIO -> INGRESOS PISO
            else if (
                (panel.moduloId === "gestion_negocio" && panel.submoduloId === "ingresos_piso") ||
                (panel.moduloId === "comercial" && panel.submoduloId === "comercial_trafico")
            ) {
                const res = await apiTraficoPiso.list({
                    desde: mesStart,
                    hasta: mesEnd,
                    agencia: agenciaQuery,
                    page_size: 1000,
                });
                const lista = Array.isArray(res) ? res : res?.results || [];

                const total = lista.length;
                const esteMes = lista.filter((r) => r.tiempo_compra === "Este mes").length;
                const conFinanciamiento = lista.filter((r) => {
                    const f = String(r.forma_capitalizacion || "").toLowerCase();
                    return f.includes("crédito") || f.includes("credito") || f.includes("arrendamiento");
                }).length;
                const autoCuenta = lista.filter((r) => r.deja_auto_cuenta).length;
                const concretados = lista.filter((r) => r.be_back).length;

                const pct = (v) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);

                setDatos({
                    tipo: "embudo",
                    kpis: [
                        { label: "Visitas en Sala", valor: total, icon: HandCoins },
                        { label: "Compra Inmediata", valor: esteMes, icon: CalendarDays },
                        { label: "Financiamiento", valor: conFinanciamiento, icon: CreditCard },
                        { label: "Be Back (Cierre)", valor: concretados, icon: Car },
                    ],
                    etapas: [
                        { etapa: "Prospectos en Sala de Ventas", cantidad: total, porcentaje: 100 },
                        { etapa: "Interés de Compra Inmediata (Este mes)", cantidad: esteMes, porcentaje: pct(esteMes) },
                        { etapa: "Perfil con Financiamiento Solicitado", cantidad: conFinanciamiento, porcentaje: pct(conFinanciamiento) },
                        { etapa: "Clientes con Auto a Cuenta (Toma)", cantidad: autoCuenta, porcentaje: pct(autoCuenta) },
                        { etapa: "Cierres / Retornos Efectivos (Be Back)", cantidad: concretados, porcentaje: pct(concretados) },
                    ],
                    totalInicial: total,
                    cierreFinal: concretados,
                });
            }

            // 3. SERVICIOS FINANCIEROS -> EXPEDIENTES
            else if (panel.moduloId === "financieros") {
                const res = await apiDocumentacion.list();
                let lista = Array.isArray(res) ? res : res?.results || [];

                if (agenciaQuery) {
                    lista = lista.filter((e) => (e.agencia || "").toLowerCase().includes(agenciaQuery.toLowerCase()));
                }

                const total = lista.length;
                const conDocumentos = lista.filter((e) => (e.avance?.completados || 0) > 0).length;
                const conSolicitudPdf = lista.filter((e) => Boolean(e.solicitud_pdf_url)).length;
                const completos = lista.filter((e) => (e.avance?.porcentaje || 0) >= 100).length;

                const pct = (v) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);

                setDatos({
                    tipo: "embudo",
                    kpis: [
                        { label: "Expedientes", valor: total, icon: CreditCard },
                        { label: "Con Requisitos", valor: conDocumentos, icon: FileText },
                        { label: "Solicitud PDF", valor: conSolicitudPdf, icon: AlertCircle },
                        { label: "Dictaminados", valor: completos, icon: Car },
                    ],
                    etapas: [
                        { etapa: "Expedientes Financieros Creados", cantidad: total, porcentaje: 100 },
                        { etapa: "Con Requisitos Cargados en Plataforma", cantidad: conDocumentos, porcentaje: pct(conDocumentos) },
                        { etapa: "Con Solicitud Oficial PDF Firmada", cantidad: conSolicitudPdf, porcentaje: pct(conSolicitudPdf) },
                        { etapa: "Expedientes Dictaminados al 100%", cantidad: completos, porcentaje: pct(completos) },
                    ],
                    totalInicial: total,
                    cierreFinal: completos,
                });
            }

            // 4. OTROS SUBMÓDULOS
            else {
                setDatos({
                    tipo: "embudo",
                    kpis: [
                        { label: "Registros", valor: 0, icon: CalendarDays },
                        { label: "Avance", valor: "0%", icon: CheckCircle2 },
                    ],
                    etapas: [
                        { etapa: "Registros Totales del Periodo", cantidad: 0, porcentaje: 100 },
                        { etapa: "Operaciones en Seguimiento", cantidad: 0, porcentaje: 0 },
                        { etapa: "Operaciones Dictaminadas / Concluidas", cantidad: 0, porcentaje: 0 },
                    ],
                    totalInicial: 0,
                    cierreFinal: 0,
                    nota: "Submódulo listo para enlazar sus métricas finales.",
                });
            }
        } catch (err) {
            console.error("Error cargando panel:", err);
            setError(err?.message || "No se pudieron obtener los datos para este módulo.");
        } finally {
            setLoading(false);
        }
    }, [filtros, panel.moduloId, panel.submoduloId]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const cfg = COLOR_CONFIG[infoModulo?.color] || COLOR_CONFIG.blue;
    const IconModulo = infoModulo?.icon || Layers;

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            {/* Cabecera del módulo */}
            <div
                style={{ backgroundColor: cfg.headerBg }}
                className="flex flex-col gap-2 p-4 text-white sm:flex-row sm:items-center sm:justify-between shrink-0"
            >
                <div className="flex items-center gap-2">
                    <IconModulo className="h-4 w-4 opacity-90 text-white" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                        {infoModulo?.nombre || "Módulo"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={panel.submoduloId}
                        onChange={(e) => onCambiarSubmodulo(panel.id, e.target.value)}
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.18)" }}
                        className="rounded-lg border border-white/20 px-2.5 py-1 text-xs font-bold text-white outline-none backdrop-blur-sm transition hover:bg-white/25 cursor-pointer max-w-[280px] truncate"
                    >
                        {infoModulo?.submodulos?.map((sub) => (
                            <option key={sub.id} value={sub.id} className="text-slate-800 bg-white">
                                {sub.nombre}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={cargarDatos}
                        title="Recargar datos"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    {totalPaneles > 1 && (
                        <button
                            type="button"
                            onClick={() => onEliminar(panel.id)}
                            title="Quitar este módulo del tablero"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-red-500 hover:text-white"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido / Embudo */}
            <div className="flex-1 p-5 space-y-4">
                {loading ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="h-7 w-7 animate-spin text-[#001E50]" />
                        <span className="text-xs font-bold text-[#001E50]">Consultando información...</span>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-6 text-center text-red-600">
                        <AlertCircle className="h-8 w-8" />
                        <p className="text-xs font-bold">{error}</p>
                        <button
                            type="button"
                            onClick={cargarDatos}
                            className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-700 hover:bg-red-100"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : datos?.tipo === "embudo" ? (
                    <div className="space-y-4">
                        {/* Mini-KPIs */}
                        {datos.kpis && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {datos.kpis.map((kpi, i) => {
                                    const Icon = kpi.icon || Info;
                                    return (
                                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                                <span>{kpi.label}</span>
                                            </div>
                                            <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Etapas del embudo */}
                        <div className="space-y-3 pt-1">
                            {datos.etapas.map((item, index) => {
                                const esUltimo = index === datos.etapas.length - 1;
                                const ancho = item.cantidad === 0 ? 0 : Math.max(item.porcentaje, 16);

                                return (
                                    <div key={item.etapa} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className={`font-bold ${esUltimo && item.cantidad > 0 ? "text-emerald-700 font-black" : "text-slate-700"}`}>
                                                {index + 1}. {item.etapa}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-slate-800">{item.cantidad.toLocaleString()}</span>
                                                <span className="text-[11px] font-semibold text-slate-400">({item.porcentaje}%)</span>
                                            </div>
                                        </div>

                                        <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100 p-0.5">
                                            <div
                                                style={{
                                                    width: `${ancho}%`,
                                                    backgroundColor: esUltimo && item.cantidad > 0 ? "#059669" : cfg.barBg,
                                                }}
                                                className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white"
                                            >
                                                {item.porcentaje >= 18 ? `${item.porcentaje}%` : ""}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {datos.nota && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                <span>{datos.nota}</span>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Footer de conversión */}
            {datos?.tipo === "embudo" && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 px-5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Conversión de la etapa final:</span>
                        <span className="text-sm font-black text-emerald-600">
                            {datos.totalInicial > 0 ? ((datos.cierreFinal / datos.totalInicial) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Tableros() {
    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("Todas las agencias");
    const [periodoAnio, setPeriodoAnio] = useState("2026");

    // Inicia con Octubre (mes 10) seleccionado por defecto
    const [mesesSeleccionados, setMesesSeleccionados] = useState(["10"]);

    const [paneles, setPaneles] = useState([
        {
            id: 1,
            moduloId: "gestion_negocio",
            submoduloId: "prospectos_digitales",
        },
    ]);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [seccionFiltro, setSeccionFiltro] = useState("Todas");
    const [busquedaModal, setBusquedaModal] = useState("");

    // Selección de mes exclusiva (garantiza que siempre haya un mes activo)
    const seleccionarMes = (key) => {
        setMesesSeleccionados([key]);
    };

    const agregarModulo = (moduloId, submoduloId) => {
        const nuevoId = Date.now();
        setPaneles((prev) => [...prev, { id: nuevoId, moduloId, submoduloId }]);
        setModalAbierto(false);
        setBusquedaModal("");
        setSeccionFiltro("Todas");
    };

    const eliminarPanel = (id) => {
        setPaneles((prev) => prev.filter((p) => p.id !== id));
    };

    const cambiarSubmodulo = (id, nuevoSubmodulo) => {
        setPaneles((prev) =>
            prev.map((p) => (p.id === id ? { ...p, submoduloId: nuevoSubmodulo } : p))
        );
    };

    const filtrosGlobales = useMemo(() => ({
        agencia: agenciaSeleccionada,
        anio: periodoAnio,
        meses: mesesSeleccionados,
    }), [agenciaSeleccionada, periodoAnio, mesesSeleccionados]);

    const seccionesUnicas = useMemo(() => {
        return ["Todas", ...CATALOGO_CRM.map((c) => c.seccion)];
    }, []);

    const catalogoFiltrado = useMemo(() => {
        const q = busquedaModal.trim().toLowerCase();

        return CATALOGO_CRM
            .filter((grupo) => seccionFiltro === "Todas" || grupo.seccion === seccionFiltro)
            .map((grupo) => {
                if (!q) return grupo;

                const modulosCoincidentes = grupo.modulos
                    .map((mod) => {
                        const coincideModulo = mod.nombre.toLowerCase().includes(q);
                        const submodulosFiltrados = mod.submodulos.filter((s) =>
                            s.nombre.toLowerCase().includes(q) || coincideModulo
                        );

                        if (coincideModulo || submodulosFiltrados.length > 0) {
                            return {
                                ...mod,
                                submodulos: submodulosFiltrados.length > 0 ? submodulosFiltrados : mod.submodulos,
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);

                return {
                    ...grupo,
                    modulos: modulosCoincidentes,
                };
            })
            .filter((grupo) => grupo.modulos.length > 0);
    }, [seccionFiltro, busquedaModal]);

    return (
        <div className="mx-auto w-full max-w-[1700px] space-y-5 p-4 sm:p-6">
            {/* Encabezado */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-xl font-black text-[#001E50] sm:text-2xl">
                        <Columns2 className="h-6 w-6 text-[#001E50]" />
                        Tableros de Rendimiento y Conversión
                    </h1>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Vista comparativa del CRM: selecciona cualquier módulo y contrástalo en tiempo real.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#001E50] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#102a6b] cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Agregar Módulo
                </button>
            </div>

            {/* BARRA DE FILTROS SUPERIORES */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
                        <Building2 className="h-4 w-4" />
                        <span>Agencia:</span>
                    </div>

                    {AGENCIAS.map((agencia) => {
                        const activo = agenciaSeleccionada === agencia;
                        return (
                            <button
                                key={agencia}
                                type="button"
                                onClick={() => setAgenciaSeleccionada(agencia)}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                                    activo
                                        ? "bg-[#001E50] text-white shadow"
                                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#001E50] hover:text-[#001E50]"
                                }`}
                            >
                                {agencia}
                            </button>
                        );
                    })}
                </div>

                <hr className="border-slate-100" />

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#001E50]" />
                        <span className="text-xs font-black text-[#001E50]">PERIODO:</span>
                        <select
                            value={periodoAnio}
                            onChange={(e) => setPeriodoAnio(e.target.value)}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#001E50] outline-none cursor-pointer"
                        >
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                        </select>
                    </div>

                    <div className="flex flex-1 flex-wrap items-center gap-1.5">
                        {MESES.map((mes) => {
                            const activo = mesesSeleccionados.includes(mes.key);
                            return (
                                <button
                                    key={mes.key}
                                    type="button"
                                    onClick={() => seleccionarMes(mes.key)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                                        activo
                                            ? "bg-[#001E50] text-white shadow-sm"
                                            : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    }`}
                                >
                                    {activo ? `✓ ${mes.label}` : `+ ${mes.label}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* PANTALLA DIVIDIDA DINÁMICA */}
            <div className="grid gap-6 md:grid-cols-2">
                {paneles.map((panel) => (
                    <PanelModulo
                        key={panel.id}
                        panel={panel}
                        filtros={filtrosGlobales}
                        onCambiarSubmodulo={cambiarSubmodulo}
                        onEliminar={eliminarPanel}
                        totalPaneles={paneles.length}
                    />
                ))}

                {/* BOTÓN "+" PARA AGREGAR OTRO PANEL */}
                <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-[#001E50] hover:bg-blue-50/30 group cursor-pointer"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-400 group-hover:bg-[#001E50] group-hover:text-white group-hover:border-[#001E50] transition">
                        <Plus className="h-7 w-7" />
                    </div>
                    <span className="mt-4 text-sm font-black text-slate-700 group-hover:text-[#001E50] transition">
                        + Agregar Módulo al Tablero
                    </span>
                    <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                        Selecciona otro módulo o submódulo del CRM para contrastar métricas en paralelo.
                    </p>
                </button>
            </div>

            {/* MODAL RESPONSIVO CON PORTAL, BUSCADOR Y PESTAÑAS */}
            {modalAbierto && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setModalAbierto(false)}
                    />

                    <div
                        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
                        style={{ height: "82vh", maxHeight: "82vh", minHeight: "360px" }}
                    >
                        {/* Cabecera del modal */}
                        <div className="flex items-center justify-between bg-[#001E50] px-5 py-4 text-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <FolderKanban className="h-5 w-5 text-white/90" />
                                <div>
                                    <h3 className="text-sm font-black">Catálogo de Módulos del CRM</h3>
                                    <p className="text-[11px] text-white/70">Selecciona el módulo y submódulo que deseas agregar al tablero</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Barra de búsqueda y pestañas de categorías */}
                        <div className="border-b border-slate-200 bg-slate-50 p-3.5 shrink-0 space-y-2.5">
                            <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-[#001E50] focus-within:ring-2 focus-within:ring-[#001E50]/10">
                                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                                <input
                                    value={busquedaModal}
                                    onChange={(e) => setBusquedaModal(e.target.value)}
                                    placeholder="Buscar por módulo o submódulo (ej. prospectos digitales, piso, expedientes)..."
                                    className="h-full w-full text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                                />
                                {busquedaModal && (
                                    <button
                                        type="button"
                                        onClick={() => setBusquedaModal("")}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                                {seccionesUnicas.map((sec) => {
                                    const activa = seccionFiltro === sec;
                                    return (
                                        <button
                                            key={sec}
                                            type="button"
                                            onClick={() => setSeccionFiltro(sec)}
                                            className={`rounded-lg px-3 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                                                activa
                                                    ? "bg-[#001E50] text-white shadow-sm"
                                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            {sec}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cuerpo con Scroll Vertical */}
                        <div
                            className="overflow-y-auto p-4 sm:p-5 space-y-4"
                            style={{ flex: "1 1 0%", minHeight: 0 }}
                        >
                            {catalogoFiltrado.length > 0 ? (
                                catalogoFiltrado.map((grupo) => (
                                    <div key={grupo.seccion} className="space-y-2">
                                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center justify-between">
                                            <span>{grupo.seccion}</span>
                                            <span className="text-[10px] text-slate-300 font-semibold">{grupo.modulos.length} módulo(s)</span>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {grupo.modulos.map((mod) => {
                                                const Icon = mod.icon;
                                                return (
                                                    <div
                                                        key={mod.id}
                                                        className="rounded-xl border border-slate-200 p-3 hover:border-[#001E50] transition space-y-2 bg-white shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#001E50]/10 text-[#001E50]">
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-xs font-black text-slate-800">{mod.nombre}</span>
                                                        </div>

                                                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-400">Submódulos:</span>
                                                            <div className="space-y-1">
                                                                {mod.submodulos.map((sub) => (
                                                                    <button
                                                                        key={sub.id}
                                                                        type="button"
                                                                        onClick={() => agregarModulo(mod.id, sub.id)}
                                                                        className="w-full text-left rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-[#001E50] transition flex items-center justify-between group cursor-pointer"
                                                                    >
                                                                        <span className="truncate pr-2">{sub.nombre}</span>
                                                                        <span className="text-[10px] font-black text-blue-600 shrink-0 group-hover:underline">
                                                                            + Añadir al Tablero
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                                    <Search className="h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-xs font-bold text-slate-600">No se encontraron módulos con ese filtro</p>
                                </div>
                            )}
                        </div>

                        {/* Pie de modal */}
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}