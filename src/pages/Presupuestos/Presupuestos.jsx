// src/pages/GestionNegocio/Presupuestos.jsx
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronDown,
    Plus,
    Check,
    FileText,
    FileCheck2,
    RefreshCw,
    CheckCircle2,
    Target,
    PieChart as PieChartIcon,
    CalendarCheck,
    Wallet,
    UserCheck,
    FileDown,
    ChevronRight
} from "lucide-react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import {
    getOpcionesPresupuestos,
    getPresupuestos,
    getPresupuestosDashboard,
} from "../../lib/apiPresupuestos";

/* ============================================================
   CONFIGURACIÓN GENERAL & ESTILOS VW
============================================================ */

const PALETA_VW = [
    "#001E50", // VW Navy
    "#1677FF", // VW Electric Blue
    "#0EA5E9", // Sky Blue
    "#38BDF8", // Light Blue
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F59E0B", // Amber
    "#10B981"  // Emerald
];

const ESTATUS_AUTORIZADO = "A";
const IMAGEN_HERO = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";
const IMAGEN_SERVICIO_PRESUPUESTO = "../servicio.jpeg";

const MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const TOOLTIP_STYLE = {
    borderRadius: 10,
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    fontSize: 12,
    fontFamily: "inherit",
    fontWeight: "bold",
    color: "#001E50"
};

const DATA_VACIA = {
    ordenesEmitidas: 0,
    conversionMonto: 0,
    estatus: [],
    presupuestosEmitidosAsesor: [],
    presupuestosAutorizadosAsesor: [],
    emitidos: { porcentaje: 0, total: 0, manoObra: 0, refacciones: 0, montoTotal: 0 },
    autorizados: { porcentaje: 0, total: 0, manoObra: 0, refacciones: 0, montoTotal: 0 },
    seguimiento: [],
    totalSeguimiento: 0,
};

/* ============================================================
   HELPERS
============================================================ */

function numero(valor) {
    const resultado = Number(valor ?? 0);
    return Number.isFinite(resultado) ? resultado : 0;
}

function entero(valor) {
    return numero(valor).toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function dinero(valor) {
    return numero(valor).toLocaleString("es-MX", {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
}

function formatoCortoDinero(valor) {
    const num = numero(valor);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
    return `$${num.toFixed(0)}`;
}

function porcentaje(valor) {
    return `${numero(valor).toLocaleString("es-MX", {
        minimumFractionDigits: 1, maximumFractionDigits: 1,
    })}%`;
}

function porcentajeSeguro(valor, total) {
    const numerador = numero(valor);
    const denominador = numero(total);
    if (!denominador) return 0;
    return (numerador / denominador) * 100;
}

function pad(valor) {
    return String(valor).padStart(2, "0");
}

function obtenerRangoMes(anio, mes) {
    const indiceMes = MESES.indexOf(mes);
    if (indiceMes < 0) return { fecha_desde: "", fecha_hasta: "" };
    const numeroMes = indiceMes + 1;
    const ultimoDia = new Date(anio, numeroMes, 0).getDate();

    return {
        fecha_desde: `${anio}-${pad(numeroMes)}-01`,
        fecha_hasta: `${anio}-${pad(numeroMes)}-${pad(ultimoDia)}`,
    };
}

function formatearFecha(valor) {
    if (!valor) return "";
    const texto = String(valor).trim();
    if (/^\d{8}$/.test(texto)) {
        return `${texto.substring(6, 8)}/${texto.substring(4, 6)}/${texto.substring(0, 4)}`;
    }
    const formatoISO = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (formatoISO) {
        return `${formatoISO[3]}/${formatoISO[2]}/${formatoISO[1]}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
        return texto.substring(0, 10);
    }
    return texto;
}

function colorEstatus(estatus, index) {
    const colores = {
        N: "#E31B23", // Rojo
        A: "#10B981", // Verde Esmeralda
        E: "#F59E0B", // Ámbar
    };
    return (colores[String(estatus || "").trim()] || PALETA_VW[index % PALETA_VW.length]);
}

/* ============================================================
   NORMALIZACIÓN
============================================================ */

function normalizarAsesores(items = []) {
    if (!Array.isArray(items)) return [];
    return [...items]
        .sort((a, b) => numero(b.presupuestos) - numero(a.presupuestos))
        .map((item, index) => ({
            name: item.cod_func != null ? `Asesor ${item.cod_func}` : "Sin asignar",
            value: numero(item.presupuestos),
            color: PALETA_VW[index % PALETA_VW.length],
        }));
}

function normalizarEstatus(items = []) {
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => ({
        name: item.estatus || "Sin estatus",
        value: numero(item.presupuestos ?? item.total),
        color: colorEstatus(item.estatus, index),
    }));
}

function normalizarSeguimiento(items = []) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
        asesor: item.cod_func != null ? `Asesor ${item.cod_func}` : "Sin asignar",
        presupuesto: item.nr_orcamento,
        fecha: formatearFecha(item.dt_emissao),
        sit: item.sit || "",
        vin: item.chassi || "",
    }));
}

function construirData(dashboard, dashboardAutorizados, listado) {
    const totales = dashboard?.totales || {};
    const totalesAutorizados = dashboardAutorizados?.totales || {};
    const graficas = dashboard?.graficas || {};
    const graficasAutorizados = dashboardAutorizados?.graficas || {};

    const totalRegistros = numero(totales.registros);
    const totalPresupuestos = numero(totales.presupuestos);
    const totalAutorizados = numero(totalesAutorizados.presupuestos);
    const montoEmitidos = numero(totales.monto_total);
    const montoAutorizados = numero(totalesAutorizados.monto_total);

    const ordenesEmitidas = totalRegistros;
    const porcentajeEmitidos = porcentajeSeguro(totalPresupuestos, totalRegistros);
    const porcentajeAutorizados = porcentajeSeguro(totalAutorizados, totalPresupuestos);
    const conversionMonto = porcentajeSeguro(montoAutorizados, montoEmitidos);

    return {
        ordenesEmitidas,
        conversionMonto,
        estatus: normalizarEstatus(graficas.por_estatus),
        presupuestosEmitidosAsesor: normalizarAsesores(graficas.por_asesor),
        presupuestosAutorizadosAsesor: normalizarAsesores(graficasAutorizados.por_asesor),
        emitidos: {
            porcentaje: porcentajeEmitidos,
            total: totalPresupuestos,
            manoObra: numero(totales.monto_mano_obra),
            refacciones: numero(totales.monto_productos),
            montoTotal: montoEmitidos,
        },
        autorizados: {
            porcentaje: porcentajeAutorizados,
            total: totalAutorizados,
            manoObra: numero(totalesAutorizados.monto_mano_obra),
            refacciones: numero(totalesAutorizados.monto_productos),
            montoTotal: montoAutorizados,
        },
        seguimiento: normalizarSeguimiento(listado?.results),
        totalSeguimiento: numero(listado?.count),
    };
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function PresupuestosServicio() {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = MESES[hoy.getMonth()];

    const [anio, setAnio] = useState(anioActual);
    const [mes, setMes] = useState(mesActual);
    const [agencia, setAgencia] = useState("Todas");
    const [agencias, setAgencias] = useState([]);

    const [data, setData] = useState(DATA_VACIA);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const anios = useMemo(() => {
        return Array.from({ length: 5 }, (_, index) => anioActual - index);
    }, [anioActual]);

    // Cargar opciones
    useEffect(() => {
        let activo = true;
        getOpcionesPresupuestos()
            .then((respuesta) => {
                if (activo) setAgencias(Array.isArray(respuesta?.agencias) ? respuesta.agencias : []);
            })
            .catch((err) => console.error("Error cargando opciones:", err));
        return () => { activo = false; };
    }, []);

    // Cargar dashboard
    useEffect(() => {
        let activo = true;
        const { fecha_desde, fecha_hasta } = obtenerRangoMes(anio, mes);

        const params = {
            fecha_desde, fecha_hasta,
            agencia: agencia !== "Todas" ? agencia : undefined,
        };
        const paramsAutorizados = { ...params, sit: ESTATUS_AUTORIZADO };
        const paramsListado = { ...params, page: 1, page_size: 1000 };

        setLoading(true);
        setError("");

        Promise.all([
            getPresupuestosDashboard(params),
            getPresupuestosDashboard(paramsAutorizados),
            getPresupuestos(paramsListado),
        ])
            .then(([dashboard, dashboardAutorizados, listado]) => {
                if (activo) {
                    setData(construirData(dashboard, dashboardAutorizados, listado));
                }
            })
            .catch((err) => {
                if (activo) {
                    setError(err?.message || "No fue posible cargar los presupuestos.");
                    setData(DATA_VACIA);
                }
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => { activo = false; };
    }, [anio, mes, agencia]);

    const cargarAPI = () => {
        setAnio(anio);
    };

    const exportarAExcel = () => {
        if (!data.seguimiento || data.seguimiento.length === 0) return;

        const headers = ["Asesor", "Presupuesto", "Fecha", "Estatus (Sit)", "VIN"];
        const filas = data.seguimiento.map(row => [
            row.asesor || "—",
            row.presupuesto || "—",
            row.fecha || "—",
            row.sit || "—",
            row.vin || "—"
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...filas.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Presupuestos_${agencia}_${anio}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full min-h-screen bg-[#F1F5F9] text-[#1E293B] font-vw-text font-light p-3 md:p-5 space-y-5">

            {/* CABECERA / FILTROS */}
            <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 xl:pb-0">
                    <button
                        onClick={() => setAgencia("Todas")}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${agencia === "Todas"
                            ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                            : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        Todas las agencias
                    </button>
                    {agencias.map((item) => {
                        const active = agencia === item;
                        return (
                            <button
                                key={item}
                                onClick={() => setAgencia(item)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${active
                                    ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                                    : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <div className="flex items-center gap-2 px-2 shrink-0">
                        <CalendarDays className="h-4 w-4 text-[#1677FF]" />
                        <span className="text-[#001E50] text-xs font-vw-head font-bold uppercase tracking-wider">Periodo:</span>
                    </div>
                    <div className="relative inline-block shrink-0">
                        <select
                            value={anio}
                            onChange={(e) => {
                                const nuevoAnio = Number(e.target.value);
                                setAnio(nuevoAnio);
                                if (nuevoAnio === anioActual && MESES.indexOf(mes) > hoy.getMonth()) {
                                    setMes(MESES[hoy.getMonth()]);
                                }
                            }}
                            className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer shadow-sm"
                        >
                            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin max-w-full md:max-w-md lg:max-w-xl">
                        {MESES.map((item, index) => {
                            const futuro = anio === anioActual && index > hoy.getMonth();
                            const active = mes === item;
                            return (
                                <button
                                    key={item}
                                    disabled={futuro}
                                    onClick={() => setMes(item)}
                                    className={`inline-flex items-center justify-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs capitalize transition-all ${active
                                        ? "bg-[#001E50] text-white font-vw-head font-bold shadow-sm"
                                        : futuro
                                            ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
                                        }`}
                                >
                                    {active ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />}
                                    <span>{item.substring(0, 3)}</span>
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={cargarAPI}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-[#001E50] transition shrink-0 ml-auto md:ml-2"
                        title="Recargar"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-vw-head font-bold text-red-700">
                    {error}
                </div>
            )}

            {/* =====================================================
                RESUMEN SUPERIOR & GRÁFICOS
            ====================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">

                {/* 1. HERO CARD: Presupuestos Emitidos */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm xl:col-span-1 h-full">
                    <div className="relative h-28 w-full overflow-hidden bg-[#001E50] shrink-0">
                        <img
                            src={IMAGEN_SERVICIO_PRESUPUESTO}
                            alt="VW Dashboard"
                            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                            onError={(e) => { e.target.onerror = null; e.target.src = IMAGEN_SERVICIO_PRESUPUESTO; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001E50] via-[#001E50]/40 to-transparent" />

                        <div className="absolute top-2 left-2 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                            Consolidado General
                        </div>

                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                            <CalendarCheck className="h-3.5 w-3.5 text-[#38BDF8]" />
                            <span className="text-xs font-vw-head font-bold tracking-wide">VW Showroom</span>
                        </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                    PRESUPUESTOS EMITIDOS
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-vw-head font-bold px-2 py-0.5 rounded border border-emerald-200">
                                    Periodo Actual
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-1 text-center my-auto">
                            <h4 className="text-[11px] font-vw-head font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                Resumen de Presupuestos
                            </h4>
                            <div className="text-5xl font-vw-head font-extrabold text-[#001E50] leading-none tracking-tight">
                                {loading ? "..." : entero(data.ordenesEmitidas)}
                            </div>
                            <div className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider mt-1.5">
                                TOTAL PRESUPUESTOS EMITIDOS
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center flex flex-col justify-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1 leading-tight">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                    <span>Autorizados</span>
                                </div>
                                <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">
                                    {entero(data.autorizados.total)}
                                </div>
                            </div>

                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center flex flex-col justify-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1 leading-tight">
                                    <Target className="h-2.5 w-2.5 text-amber-600" />
                                    <span className="truncate">Tasa Aprob.</span>
                                </div>
                                <div className="text-sm font-vw-head font-bold text-amber-700 mt-0.5">
                                    {porcentaje(data.autorizados.porcentaje)}
                                </div>
                            </div>

                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center flex flex-col justify-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1 leading-tight">
                                    <Wallet className="h-2.5 w-2.5 text-[#1677FF]" />
                                    <span>Monto Prom.</span>
                                </div>
                                <div className="text-[13px] font-vw-head font-bold text-[#001E50] mt-0.5">
                                    {data.emitidos.total > 0 ? formatoCortoDinero(data.emitidos.montoTotal / data.emitidos.total) : "$0"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. GAUGE PRINCIPAL (Conversión Monto, MAX 60%) - Custom SVG Navy Style */}
                <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center h-full">
                    <VWModernGauge
                        value={data.conversionMonto}
                        target={35}
                        maxValue={60}
                        label="CONVERSIÓN DE PRESUPUESTO"
                        showTarget={true}
                    />
                </div>

                {/* 3. Estatus de Presupuestos (Donut) */}
                <div className="xl:col-span-1 h-full">
                    <VWPieCard
                        title="Estatus de Presupuestos"
                        icon={PieChartIcon}
                        data={data.estatus}
                        showLegend={true}
                    />
                </div>

                {/* 4. Emitidos por Asesor (Donut) */}
                <div className="xl:col-span-1 h-full">
                    <VWPieCard
                        title="Emitidos por Asesor"
                        icon={PieChartIcon}
                        data={data.presupuestosEmitidosAsesor}
                        showTopNames={true}
                    />
                </div>
            </div>

            {/* =====================================================
                CONTENIDO PRINCIPAL (Emitidos vs Autorizados)
            ====================================================== */}
            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
                <BloquePresupuesto
                    titulo={<>Presupuesto <strong>Emitido</strong></>}
                    icono={<FileText className="h-4 w-4" />}
                    data={data.emitidos}
                    tipo="emitido"
                />

                <BloquePresupuesto
                    titulo={<>Presupuesto <strong>Autorizado</strong></>}
                    icono={<FileCheck2 className="h-4 w-4" />}
                    data={data.autorizados}
                    tipo="autorizado"
                />
            </div>

            {/* =====================================================
                SEGUIMIENTO / DESGLOSE POR ASESOR (Barras Horizontales)
            ====================================================== */}
            <DesgloseAsesores
                asesores={data.presupuestosEmitidosAsesor}
                seguimiento={data.seguimiento}
                exportarAExcel={exportarAExcel}
            />

        </div>
    );
}

/* ============================================================
   VW MODERN GAUGE (Nativo SVG - Gradientes Azul Marino)
============================================================ */
function VWModernGauge({ value, target = 35, maxValue = 100, label, showTarget = false }) {
    const radius = 85;
    const strokeWidth = 14;
    const cx = 100;
    const cy = 105;

    // Valor asegurado entre 0 y maxValue (60 en este caso)
    const safeValue = Math.min(Math.max(Number(value) || 0, 0), maxValue);

    const arcLength = Math.PI * radius;
    const strokeDashoffset = arcLength - (arcLength * (safeValue / maxValue));

    const needleRotation = -90 + (safeValue / maxValue) * 180;

    // Prevenimos que el target se dibuje fuera del arco si excede el maximo
    const visualTarget = Math.min(target, maxValue);
    const targetRotation = -90 + (visualTarget / maxValue) * 180;

    // Generar marcas de texto cada 10 unidades hasta el maxValue
    const ticks = [];
    const step = 10;
    for (let i = 0; i <= maxValue; i += step) {
        ticks.push(i);
    }

    const textRadius = radius - 22;

    return (
        <div className="relative w-full max-w-[280px] mx-auto flex flex-col items-center">
            <svg viewBox="0 0 200 135" className="w-full overflow-visible drop-shadow-sm">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38BDF8" /> {/* Light Blue (Inicio) */}
                        <stop offset="100%" stopColor="#001E50" /> {/* VW Navy (Fin) */}
                    </linearGradient>
                </defs>

                {/* Fondo Gris del Arco */}
                <path
                    d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Progreso Activo (Gradiente Azul Marino) */}
                <path
                    d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />

                {/* Marcas Numéricas Interiores dinámicas basadas en maxValue */}
                {ticks.map((tick) => {
                    const angRad = Math.PI + (tick / maxValue) * Math.PI;
                    const tx = cx + textRadius * Math.cos(angRad);
                    const ty = cy + textRadius * Math.sin(angRad);
                    const tickOuterX = cx + (radius - (strokeWidth / 2 + 2)) * Math.cos(angRad);
                    const tickOuterY = cy + (radius - (strokeWidth / 2 + 2)) * Math.sin(angRad);
                    const tickInnerX = cx + (radius - strokeWidth + 2) * Math.cos(angRad);
                    const tickInnerY = cy + (radius - strokeWidth + 2) * Math.sin(angRad);

                    return (
                        <g key={tick}>
                            <line x1={tickOuterX} y1={tickOuterY} x2={tickInnerX} y2={tickInnerY} stroke="#334155" strokeWidth="1" opacity={0.3} />
                            <text
                                x={tx} y={ty}
                                textAnchor="middle" alignmentBaseline="middle"
                                fontSize="7" fontWeight="bold" fontFamily="inherit" fill="#64748B"
                            >
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {/* Marcador Target Exclusivo */}
                {showTarget && (
                    <g transform={`rotate(${targetRotation}, ${cx}, ${cy})`}>
                        <line x1={cx} y1={cy - radius - 12} x2={cx} y2={cy - radius - 2} stroke="#1677FF" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx={cx} cy={cy - radius - 12} r="4" fill="#001E50" stroke="#fff" strokeWidth="1.5" />
                        <circle cx={cx} cy={cy - radius - 12} r="1.5" fill="#fff" />
                    </g>
                )}

                {/* Aguja */}
                <g transform={`rotate(${needleRotation}, ${cx}, ${cy})`} className="transition-transform duration-1000 ease-out">
                    <polygon points={`${cx - 3.5},${cy} ${cx + 3.5},${cy} ${cx},${cy - radius + 18}`} fill="#1677FF" />
                    <circle cx={cx} cy={cy} r="8" fill="#fff" stroke="#1677FF" strokeWidth="3" />
                </g>
            </svg>

            <div className="mt-1 text-center w-full">
                <div className="text-[10px] font-vw-head font-bold text-[#001E50] tracking-widest">{label}</div>
                <div className="text-xl font-vw-head font-extrabold text-[#1E293B] mt-1">
                    ESTADO ACTUAL: {porcentaje(value)}
                </div>
                {showTarget && (
                    <div className="flex items-center justify-center gap-1 text-[11px] font-vw-head font-bold text-slate-500 mt-1">
                        <Target className="h-3 w-3 text-[#1677FF]" />
                        OBJETIVO DE CONVERSIÓN: {target.toFixed(1)}%
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   VW PIE CARD
============================================================ */
function VWPieCard({ title, icon: Icon, data = [], showLegend = false, showTopNames = false }) {
    const total = data.reduce((acc, item) => acc + numero(item.value), 0);
    const hasData = data.length > 0 && total > 0;

    const renderData = hasData ? data.map(item => ({
        ...item,
        porcentaje: ((numero(item.value) / total) * 100).toFixed(1)
    })) : [];

    return (
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 flex flex-col justify-between shadow-sm h-full min-h-[260px]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5 mb-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                    {Icon && <Icon className="h-3.5 w-3.5 text-white shrink-0" />}
                    <span>{title}</span>
                </div>
                <span className="text-[10px] font-vw-head font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                    {entero(total)} Totales
                </span>
            </div>

            {!hasData ? (
                <div className="flex flex-1 items-center justify-center text-xs text-slate-400 italic">
                    Sin datos en el periodo seleccionado
                </div>
            ) : (
                <div className="flex flex-col xl:flex-row items-center gap-4 flex-1">
                    <div className="h-[140px] w-full xl:w-1/2 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={renderData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={35}
                                    outerRadius={65}
                                    stroke="#fff"
                                    strokeWidth={2}
                                >
                                    {renderData.map((item, index) => (
                                        <Cell key={item.name} fill={item.color || PALETA_VW[index % PALETA_VW.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(val, name, props) => [
                                        `${entero(val)} (${props.payload.porcentaje}%)`,
                                        name
                                    ]}
                                />
                                {showLegend && (
                                    <Legend
                                        verticalAlign="middle"
                                        align="right"
                                        layout="vertical"
                                        formatter={(val) => <span className="text-[10px] font-vw-head font-bold text-slate-600 ml-1">{val}</span>}
                                    />
                                )}
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {showTopNames && (
                        <div className="w-full xl:w-1/2 flex flex-col gap-1.5 justify-center max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                            {renderData.slice(0, 5).map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-[11px] font-vw-head font-bold bg-white border border-slate-100 rounded px-2 py-1">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="truncate text-slate-700" title={item.name}>{item.name}</span>
                                    </div>
                                    <span className="text-[#001E50]">{item.porcentaje}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ============================================================
   BLOQUE PRESUPUESTO (Emitido / Autorizado)
============================================================ */
function BloquePresupuesto({ titulo, data, icono, tipo }) {
    const esAutorizado = tipo === "autorizado";

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-full space-y-4">
            <div className="flex items-center border-b border-slate-200/60 pb-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] border border-slate-200 text-[#001E50] px-3.5 py-1 text-sm font-vw-head">
                    {icono}
                    <span className="font-light">{titulo}</span>
                </div>
            </div>

            <div className={`grid min-w-0 grid-cols-1 ${esAutorizado ? "lg:grid-cols-[180px_minmax(0,1fr)]" : ""} gap-5 flex-1 items-center`}>

                {/* Se eliminó el mini Gauge para "Emitido" como se solicitó, solo se conserva en "Autorizado" */}
                {esAutorizado && (
                    <div className="flex justify-center">
                        <VWModernGauge
                            value={data.porcentaje}
                            label="TASA DE APROBACIÓN"
                            showTarget={false}
                        />
                    </div>
                )}

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${!esAutorizado ? "w-full" : ""}`}>
                    <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-center min-h-[90px]">
                        <div className="text-[10px] text-slate-500 font-vw-head font-bold uppercase tracking-wider mb-1">Total Presupuestos</div>
                        <div className="text-2xl font-vw-head font-extrabold text-[#001E50]">{entero(data.total)}</div>
                    </div>

                    <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-3 text-center flex flex-col justify-center min-h-[90px]">
                        <div className="text-[10px] text-slate-500 font-vw-head font-bold uppercase tracking-wider mb-1">Monto Total</div>
                        <div className="text-xl font-vw-head font-extrabold text-[#1677FF]">{formatoCortoDinero(data.montoTotal)}</div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-2 text-center shadow-xs">
                        <div className="text-[9px] text-slate-400 font-vw-head font-bold uppercase mb-0.5">Mano de Obra</div>
                        <div className="text-sm font-vw-head font-bold text-slate-700">${dinero(data.manoObra)}</div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-2 text-center shadow-xs">
                        <div className="text-[9px] text-slate-400 font-vw-head font-bold uppercase mb-0.5">Refacciones</div>
                        <div className="text-sm font-vw-head font-bold text-slate-700">${dinero(data.refacciones)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   NUEVO COMPONENTE: DESGLOSE POR ASESOR COMERCIAL (Reemplaza a TablaSeguimiento)
============================================================ */
function DesgloseAsesores({ asesores, seguimiento, exportarAExcel }) {
    const [asesorExpandido, setAsesorExpandido] = useState(null);
    const maxVal = Math.max(...asesores.map(a => a.value), 1);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                    <UserCheck className="h-4 w-4 text-white shrink-0" />
                    <span>Desglose por Asesor Comercial</span>
                </div>

                <button
                    type="button"
                    onClick={exportarAExcel}
                    className="inline-flex items-center gap-1 rounded-full bg-white text-[#001E50] border border-slate-200 px-3 py-1 font-vw-head font-bold text-[10px] hover:bg-[#001E50] hover:text-white transition-all cursor-pointer shadow-sm"
                >
                    <FileDown className="h-3 w-3" />
                    <span>Exportar Excel</span>
                </button>
            </div>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                {asesores.length === 0 ? (
                    <div className="flex h-[140px] items-center justify-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        Sin datos de asesores registrados en el periodo seleccionado
                    </div>
                ) : (
                    asesores.map((item, idx) => {
                        const isExpanded = asesorExpandido === item.name;
                        const pctWidth = (item.value / maxVal) * 100;
                        const sublista = isExpanded ? seguimiento.filter(s => s.asesor === item.name) : [];

                        return (
                            <div key={item.name} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden transition-all duration-150">
                                {/* BARRA DESPLEGABLE */}
                                <div
                                    onClick={() => setAsesorExpandido(isExpanded ? null : item.name)}
                                    className="px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer text-xs"
                                >
                                    <div className="flex items-center gap-2.5 w-60 shrink-0">
                                        <div className="h-6 w-6 rounded-md flex items-center justify-center font-vw-head font-bold text-[10px] shrink-0 bg-[#001E50] text-white">
                                            VW{idx + 1}
                                        </div>
                                        <span className="font-vw-head font-bold text-[#001E50] text-xs truncate" title={item.name}>
                                            {item.name}
                                        </span>
                                    </div>

                                    <div className="text-[11px] text-slate-700 font-vw-head font-bold shrink-0 min-w-[90px]">
                                        {item.value} presupuestos
                                    </div>

                                    <div className="flex-1 mx-2">
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                                            <div
                                                className="bg-[#001E50] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(4, pctWidth))}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${isExpanded ? "bg-[#001E50] text-white" : "bg-slate-100 text-slate-400"}`}>
                                            <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* TABLA INTERNA EXPANDIDA */}
                                {isExpanded && (
                                    <div className="bg-[#F8FAFC] border-t border-slate-200 p-3">
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                                            <table className="w-full text-left text-xs font-vw-text">
                                                <thead className="bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-3 py-2 whitespace-nowrap">Presupuesto</th>
                                                        <th className="px-3 py-2 whitespace-nowrap text-center">Fecha</th>
                                                        <th className="px-3 py-2 whitespace-nowrap text-center">Estatus</th>
                                                        <th className="px-3 py-2 whitespace-nowrap">VIN</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                                    {sublista.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-3 py-6 text-center text-slate-400 italic">
                                                                Cargando o sin detalle para este asesor...
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        sublista.map((row, index) => (
                                                            <tr key={`${row.presupuesto}-${index}`} className="hover:bg-[#F8FAFC] transition-colors">
                                                                <td className="px-3 py-1.5 whitespace-nowrap font-medium text-[#001E50]">
                                                                    {row.presupuesto}
                                                                </td>
                                                                <td className="px-3 py-1.5 whitespace-nowrap text-center text-slate-500">
                                                                    {row.fecha}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-center">
                                                                    <EstatusSit value={row.sit} />
                                                                </td>
                                                                <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">
                                                                    {row.vin}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function EstatusSit({ value }) {
    const estatus = String(value || "").trim().toUpperCase();

    const estilos = {
        N: "bg-red-100 text-red-800 border-red-200",
        A: "bg-emerald-100 text-emerald-800 border-emerald-200",
        E: "bg-amber-100 text-amber-800 border-amber-200",
    };

    return (
        <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[9px] font-vw-head font-bold border ${estilos[estatus] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {estatus || "-"}
        </span>
    );
}