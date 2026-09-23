// src/pages/GestionNegocio/IngresosPiso.jsx
import { useState, useMemo, useEffect } from "react";
import {
    CheckCircle2,
    Plus,
    Check,
    ChevronDown,
    FileDown,
    PieChart as PieChartIcon,
    UserCheck,
    ChevronRight,
    CalendarDays,
    CalendarCheck,
    Clock,
    Tag,
    Footprints,
    RefreshCw,
    BarChart3,
    Car,
    ShoppingBag,
    Wallet,
    Briefcase,
    LogIn,
    MessageSquare
} from "lucide-react";

import { Pie } from "@ant-design/plots";
import { apiTraficoPiso } from "../../lib/apiTraficoPiso";

// RECURSOS VISUALES E IMÁGENES
const IMAGEN_CITAS_GLOBALES = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const AGENCIAS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxpan", "VW Tuxtepec"];
const TIPOS_VENTA = ["Todos", "Nuevos", "Usados", "Comerciales"];

// PALETA DE COLORES VOLKSWAGEN
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

function formatearNombreCorto(str) {
    if (!str || str === "—") return "—";
    const partes = String(str).trim().split(/\s+/);
    if (partes.length === 0) return "—";
    if (partes.length === 1) return partes[0];
    const primerNombre = partes[0];
    const inicialApellido = partes[1].charAt(0).toUpperCase();
    return `${primerNombre} ${inicialApellido}.`;
}

function normalizarTraficoPiso(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.map((item) => {
        const agenciaOriginal = String(item?.agencia || item?.dealer || "").trim();
        const lowerAgencia = agenciaOriginal.toLowerCase();

        let agenciaFinal = agenciaOriginal;
        if (lowerAgencia.includes("cordoba") || lowerAgencia.includes("córdoba")) {
            agenciaFinal = "VW Cordoba";
        } else if (lowerAgencia.includes("orizaba")) {
            agenciaFinal = "VW Orizaba";
        }

        const fechaRaw = item?.creado_en || item?.fecha_hora || item?.fecha;
        const fuenteNombre = item?.motivo_ingreso || item?.motivo_ingreso_piso || item?.fuente_prospeccion || item?.fuente || "Visita Espontánea";
        const asesorNombre = item?.asesor_ventas || item?.asesor_piso || item?.asesor || "Sin asignar";

        return {
            ...item,
            agencia: agenciaFinal,
            fecha_hora_cita: fechaRaw,
            nombre: item?.nombre_prospecto || item?.nombre || "—",
            asesor_ventas: asesorNombre,
            fuente_prospeccion: fuenteNombre,
            tipo_venta: item?.tipo_venta || (item?.deja_auto_cuenta ? "Usados" : "Nuevos"),
            modelo_interes: item?.auto_suenos || item?.modelo_interes || item?.modelo || "No especificado",
            motivo_compra: item?.motivo_compra || item?.uso_vehiculo || "Uso Personal / Familiar",
            forma_capitalizacion: item?.forma_capitalizacion || item?.forma_pago || item?.tipo_financiamiento || "Crédito Concesionario",
            perfil_profesional: item?.perfil_profesional || item?.ocupacion || item?.giro_negocio || "Empleado / Salariado",
            comentarios: item?.comentarios || item?.observaciones || "—"
        };
    });
}

export default function IngresosPiso({ rows: initialRows }) {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();
    const años = useMemo(() => Array.from({ length: 5 }, (_, i) => añoActual - i), [añoActual]);

    // FILTROS
    const [añoSel, setAñoSel] = useState(añoActual);
    const [mesSel, setMesSel] = useState(mesActual);
    const [agenciaSel, setAgenciaSel] = useState(null);
    const [tipoVentaSel, setTipoVentaSel] = useState("Todos");

    // DESPLEGABLE ASESOR
    const [asesorExpandido, setAsesorExpandido] = useState(null);

    const [traficoData, setTraficoData] = useState(() => normalizarTraficoPiso(initialRows ?? []));
    const [loading, setLoading] = useState(!initialRows);
    const [error, setError] = useState("");

    useEffect(() => {
        setAsesorExpandido(null);
    }, [añoSel, mesSel, agenciaSel, tipoVentaSel]);

    const cargarAPI = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {
                page_size: 10000,
                desde: `${añoSel}-01-01`,
                hasta: `${añoSel}-12-31`,
            };

            const res = await apiTraficoPiso.list(params);
            const lista = Array.isArray(res) ? res : res?.results || [];
            setTraficoData(normalizarTraficoPiso(lista));
        } catch (err) {
            console.error("Error al obtener ingresos a piso:", err);
            setError("No fue posible consultar la información del servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialRows || initialRows.length === 0) {
            cargarAPI();
        }
    }, [initialRows, añoSel]);

    const traficoFiltrado = useMemo(() => {
        return (traficoData || []).filter((c) => {
            if (!c?.fecha_hora_cita) return false;
            const dt = new Date(c.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) return false;

            if (agenciaSel && String(c.agencia || "").toLowerCase() !== agenciaSel.toLowerCase()) {
                return false;
            }

            if (tipoVentaSel !== "Todos") {
                const tvItem = String(c.tipo_venta || "").toLowerCase().trim();
                const tvSel = tipoVentaSel.toLowerCase().trim();
                if (tvItem !== tvSel) return false;
            }

            if (dt.getFullYear() !== añoSel) return false;
            if (mesSel !== null && dt.getMonth() !== mesSel) return false;

            return true;
        });
    }, [traficoData, añoSel, mesSel, agenciaSel, tipoVentaSel]);

    const exportarAExcel = () => {
        if (!traficoFiltrado || traficoFiltrado.length === 0) return;

        const headers = [
            "Fecha / Hora", "Agencia", "Prospecto", "Teléfono",
            "Tipo Venta", "Motivo Ingreso", "Asesor de Ventas",
            "Auto de Sueños", "Deja Auto a Cuenta", "Presupuesto", "Comentarios"
        ];

        const filas = traficoFiltrado.map((row) => [
            row.fecha_hora_cita ? new Date(row.fecha_hora_cita).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—",
            row.agencia || "—",
            formatearNombreCorto(row?.nombre),
            row.telefono || "—",
            row.tipo_venta || "—",
            row.fuente_prospeccion || "—",
            row.asesor_ventas || "—",
            row.modelo_interes || "—",
            row.deja_auto_cuenta ? "Sí" : "No",
            row.presupuesto_estimado ? `$${Number(row.presupuesto_estimado).toLocaleString()}` : "—",
            (row.comentarios || "—").replace(/"/g, '""')
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...filas.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_IngresosPiso_${agenciaSel || "Todas"}_${tipoVentaSel}_${añoSel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // MÉTRICAS Y AGRUPACIONES
    const métricas = useMemo(() => {
        let totalVisitas = traficoFiltrado.length;
        let conAutoCuenta = 0;

        const asesoresMap = {};
        const motivosIngresoMap = {};
        const modelosInteresMap = {};
        const motivosCompraMap = {};
        const formasCapitalizacionMap = {};
        const perfilesProfesionalesMap = {};

        let itemsComportamiento = [];
        const mapFechaIndex = {};

        if (mesSel !== null) {
            const diasEnMes = new Date(añoSel, mesSel + 1, 0).getDate();
            for (let i = 1; i <= diasEnMes; i++) {
                itemsComportamiento.push({
                    idKey: `dia_${i}`,
                    etiqueta: `${i}`,
                    subetiqueta: MESES[mesSel].substring(0, 3),
                    total: 0
                });
                mapFechaIndex[`${mesSel}-${i}`] = i - 1;
            }
        } else {
            let idx = 0;
            for (let m = 0; m < 12; m++) {
                const diasEnMes = new Date(añoSel, m + 1, 0).getDate();
                for (let d = 1; d <= diasEnMes; d++) {
                    itemsComportamiento.push({
                        idKey: `dia_${m}_${d}`,
                        etiqueta: `${d}`,
                        subetiqueta: MESES[m].substring(0, 3),
                        total: 0
                    });
                    mapFechaIndex[`${m}-${d}`] = idx++;
                }
            }
        }

        traficoFiltrado.forEach((c) => {
            const dt = new Date(c.fecha_hora_cita);
            const diaNum = dt.getDate();
            const mesNum = dt.getMonth();

            if (c.deja_auto_cuenta) conAutoCuenta += 1;

            const keyBusqueda = `${mesNum}-${diaNum}`;
            const itemIdx = mapFechaIndex[keyBusqueda];
            if (itemIdx !== undefined && itemsComportamiento[itemIdx]) {
                itemsComportamiento[itemIdx].total += 1;
            }

            // Conteo exclusivo de prospectos atendidos por Asesor
            const asesorNombre = c.asesor_ventas || "Sin asignar";
            if (!asesoresMap[asesorNombre]) asesoresMap[asesorNombre] = { total: 0, autoCuenta: 0 };
            asesoresMap[asesorNombre].total += 1;
            if (c.deja_auto_cuenta) asesoresMap[asesorNombre].autoCuenta += 1;

            // 1. Motivo Ingreso
            const mIngreso = c.fuente_prospeccion || "Visita Espontánea";
            motivosIngresoMap[mIngreso] = (motivosIngresoMap[mIngreso] || 0) + 1;

            // 2. Modelo de Interés
            const modInt = c.modelo_interes || "No especificado";
            modelosInteresMap[modInt] = (modelosInteresMap[modInt] || 0) + 1;

            // 3. Motivo de Compra
            const mCompra = c.motivo_compra || "Uso Personal / Familiar";
            motivosCompraMap[mCompra] = (motivosCompraMap[mCompra] || 0) + 1;

            // 4. Forma de Capitalización
            const fCap = c.forma_capitalizacion || "Crédito Concesionario";
            formasCapitalizacionMap[fCap] = (formasCapitalizacionMap[fCap] || 0) + 1;

            // 5. Perfil Profesional
            const pProf = c.perfil_profesional || "Empleado / Salariado";
            perfilesProfesionalesMap[pProf] = (perfilesProfesionalesMap[pProf] || 0) + 1;
        });

        const diasPeriodo = itemsComportamiento.length || 1;
        const promedioDiario = (totalVisitas / diasPeriodo).toFixed(1);

        const asesoresList = Object.entries(asesoresMap)
            .map(([nombre, counts]) => ({ nombre, total: counts.total, autoCuenta: counts.autoCuenta }))
            .sort((a, b) => b.total - a.total);

        const arrayToSortedChartData = (mapObj) =>
            Object.entries(mapObj)
                .map(([type, value]) => ({ type, value }))
                .sort((a, b) => b.value - a.value);

        return {
            totalVisitas, conAutoCuenta, promedioDiario,
            asesoresList, maxVisitasAsesor: Math.max(...asesoresList.map(a => a.total), 1),
            itemsComportamiento, maxComportamientoTotal: Math.max(...itemsComportamiento.map(d => d.total), 1),
            nombreMesEvaluado: mesSel !== null ? MESES[mesSel] : "Todo el año",
            dataMotivosIngreso: arrayToSortedChartData(motivosIngresoMap),
            dataModelosInteres: arrayToSortedChartData(modelosInteresMap),
            dataMotivosCompra: arrayToSortedChartData(motivosCompraMap),
            dataFormasCapitalizacion: arrayToSortedChartData(formasCapitalizacionMap),
            dataPerfilesProfesionales: arrayToSortedChartData(perfilesProfesionalesMap)
        };
    }, [traficoFiltrado, mesSel, añoSel]);

    const prospectosDelAsesorExpandido = useMemo(() => {
        if (!asesorExpandido) return [];
        return traficoFiltrado.filter((c) => {
            const nombreAsesor = c.asesor_ventas || "Sin asignar";
            return nombreAsesor.toLowerCase() === asesorExpandido.toLowerCase();
        });
    }, [traficoFiltrado, asesorExpandido]);

    return (
        <div className="w-full bg-white text-[#1E293B] font-vw-text font-light p-3 md:p-5 space-y-5">

            {/* FILTROS DE AGENCIA */}
            <div className="w-full py-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setAgenciaSel(null)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${!agenciaSel
                            ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                            : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        <span>Todas las agencias</span>
                    </button>

                    {AGENCIAS.map((agencia) => {
                        const active = agenciaSel === agencia;
                        return (
                            <button
                                key={agencia}
                                type="button"
                                onClick={() => setAgenciaSel(active ? null : agencia)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${active
                                    ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                                    : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <span>{agencia}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* FILTRO DE TIPO DE VENTA */}
            <div className="w-full py-1 bg-slate-50 rounded-xl p-2 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center gap-2">
                <div className="flex items-center gap-1.5 text-[#001E50] text-xs font-vw-head font-bold px-2 shrink-0">
                    <Tag className="h-3.5 w-3.5 text-[#1677FF]" />
                    <span>Tipo de Venta:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {TIPOS_VENTA.map((tipo) => {
                        const active = tipoVentaSel === tipo;
                        return (
                            <button
                                key={tipo}
                                type="button"
                                onClick={() => setTipoVentaSel(tipo)}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${active
                                    ? "bg-[#1677FF] text-white shadow-sm"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                {active && <Check className="h-3 w-3 text-white" />}
                                <span>{tipo}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* FILTROS DE AÑO Y MESES */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex flex-col md:flex-row items-center gap-3">
                <div className="relative inline-block shrink-0">
                    <select
                        value={añoSel}
                        onChange={(e) => setAñoSel(Number(e.target.value))}
                        className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer"
                    >
                        {años.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin">
                    <button
                        type="button"
                        onClick={() => setMesSel(null)}
                        className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${mesSel === null
                            ? "bg-[#001E50] text-white font-vw-head font-bold"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
                            }`}
                    >
                        {mesSel === null ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />}
                        <span>Todo el año</span>
                    </button>

                    {MESES.map((mes, index) => {
                        const futuro = añoSel === añoActual && index > mesActual;
                        const active = mesSel === index;

                        return (
                            <button
                                key={mes}
                                type="button"
                                disabled={futuro}
                                onClick={() => setMesSel(active ? null : index)}
                                className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition-all ${active
                                    ? "bg-[#001E50] text-white font-vw-head font-bold"
                                    : futuro
                                        ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold"
                                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
                                    }`}
                            >
                                {active ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />}
                                <span>{mes.toLowerCase()}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={cargarAPI}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-[#001E50] transition shrink-0 ml-auto"
                    title="Recargar"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-vw-text">
                    {error}
                </div>
            )}

            {/* ========================================================================================= */}
            {/* SECCIÓN HERO: 1/3 CONSOLIDADO GENERAL (CON MARCO DE IMAGEN) + 2/3 DESGLOSE POR ASESOR     */}
            {/* ========================================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

                {/* CONSOLIDADO GENERAL CON IMAGEN HERO: 1/3 ANCHO DE PANTALLA (col-span-4) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm">
                    
                    {/* MARCO VISUAL CON IMAGEN SUPERIOR Y SOMBRECIMIENTO */}
                    <div className="relative h-28 w-full overflow-hidden bg-[#001E50] shrink-0">
                        <img
                            src={IMAGEN_CITAS_GLOBALES}
                            alt="Volkswagen Showroom"
                            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = FALLBACK_IMAGE;
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001E50] via-[#001E50]/40 to-transparent" />

                        <div className="absolute top-2 left-2 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                            Consolidado General
                        </div>

                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                            <CalendarCheck className="h-3.5 w-3.5 text-sky-400" />
                            <span className="text-xs font-vw-head font-bold tracking-wide">VW Showroom</span>
                        </div>
                    </div>

                    {/* CUERPO PRINCIPAL DEL CONSOLIDADO */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                    INGRESOS A PISO
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-vw-head font-bold px-2 py-0.5 rounded border border-emerald-200">
                                    Cliente Único
                                </span>
                            </div>
                        </div>

                        {/* NÚMERO KPI PRINCIPAL AGRANDADO */}
                        <div className="flex flex-col items-center justify-center py-1 text-center my-auto">
                            <h4 className="text-[11px] font-vw-head font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                Resumen Ejecutivo de Piso
                            </h4>
                            <div className="text-5xl font-vw-head font-extrabold text-[#001E50] leading-none tracking-tight">
                                {loading ? "..." : métricas.totalVisitas}
                            </div>
                            <div className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider mt-1.5">
                                Total Visitantes en Piso
                            </div>
                        </div>

                        {/* SUB-KPIs */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                    <span>Atendidas</span>
                                </div>
                                <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">
                                    {métricas.totalVisitas}
                                </div>
                            </div>

                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                    <Footprints className="h-2.5 w-2.5 text-amber-600" />
                                    <span>Auto a Cuenta</span>
                                </div>
                                <div className="text-sm font-vw-head font-bold text-amber-700 mt-0.5">
                                    {métricas.conAutoCuenta}
                                </div>
                            </div>

                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                    <Clock className="h-2.5 w-2.5 text-[#1677FF]" />
                                    <span>Prom. Diario</span>
                                </div>
                                <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">
                                    {métricas.promedioDiario} <span className="text-[8px] font-normal text-slate-400">v/día</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* DESGLOSE POR ASESOR COMERCIAL: 2/3 ANCHO DE PANTALLA (col-span-8) */}
                <div className="lg:col-span-8 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col justify-between shadow-sm">

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                            <UserCheck className="h-3.5 w-3.5 text-white shrink-0" />
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

                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                        {métricas.asesoresList.length === 0 ? (
                            <div className="flex h-[140px] items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                                Sin datos de asesores registrados en el periodo seleccionado
                            </div>
                        ) : (
                            métricas.asesoresList.map((item, idx) => {
                                const isTop = idx === 0;
                                const isExpanded = asesorExpandido === item.nombre;
                                const pctWidth = (item.total / métricas.maxVisitasAsesor) * 100;

                                return (
                                    <div
                                        key={item.nombre}
                                        className="bg-white rounded-xl border border-slate-200/80 overflow-hidden transition-all duration-150"
                                    >
                                        <div
                                            onClick={() => setAsesorExpandido(isExpanded ? null : item.nombre)}
                                            className="px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer text-xs"
                                        >
                                            <div className="flex items-center gap-2.5 w-52 shrink-0">
                                                <div className={`h-6 w-6 rounded-md flex items-center justify-center font-vw-head font-bold text-[10px] shrink-0 ${isTop ? "bg-[#001E50] text-white" : "bg-slate-100 text-slate-600"}`}>
                                                    VW{idx + 1}
                                                </div>

                                                <span className="font-vw-head font-bold text-[#001E50] text-xs truncate" title={item.nombre}>
                                                    {item.nombre}
                                                </span>
                                            </div>

                                            <div className="text-[11px] text-slate-700 font-vw-head font-bold shrink-0 min-w-[90px]">
                                                {item.total} prospectos
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

                                        {/* TABLA DESPLEGABLE CON COMENTARIOS */}
                                        {isExpanded && (
                                            <div className="bg-[#F8FAFC] border-t border-slate-200 p-2.5 space-y-2">
                                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">
                                                    <span>Atenciones registradas de {formatearNombreCorto(item.nombre)} ({prospectosDelAsesorExpandido.length})</span>
                                                </div>

                                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                                                    <table className="w-full text-left text-[10px]">
                                                        <thead className="bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold border-b border-slate-200">
                                                            <tr>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Fecha / Hora</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Prospecto</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Tipo Venta</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Motivo Ingreso</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Auto a Cuenta</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Presupuesto</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap min-w-[150px]">Comentarios</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 font-vw-text text-slate-700">
                                                            {prospectosDelAsesorExpandido.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={7} className="px-2.5 py-2 text-center text-slate-400 italic">
                                                                        Sin prospectos registrados
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                prospectosDelAsesorExpandido.map((row, cIdx) => (
                                                                    <tr key={row.id_trafico || cIdx} className="hover:bg-[#F8FAFC] transition-colors">
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap text-slate-800">
                                                                            {row.fecha_hora_cita ? new Date(row.fecha_hora_cita).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—"}
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap font-vw-head font-bold text-[#001E50]">
                                                                            {formatearNombreCorto(row?.nombre)}
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                                            <span className="inline-block rounded bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[8px] font-vw-head font-bold text-[#1677FF]">
                                                                                {row.tipo_venta || "—"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap text-slate-600">
                                                                            {row.fuente_prospeccion || "—"}
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.2 text-[8px] font-vw-head font-bold ${row.deja_auto_cuenta ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                                                                                {row.deja_auto_cuenta ? "Sí" : "No"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap font-bold text-[#001E50]">
                                                                            {row.presupuesto_estimado ? `$${Number(row.presupuesto_estimado).toLocaleString()}` : "—"}
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 text-slate-600 max-w-[220px] truncate" title={row.comentarios}>
                                                                            <div className="flex items-center gap-1">
                                                                                <MessageSquare className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                                                                <span className="truncate">{row.comentarios}</span>
                                                                            </div>
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

            </div>

            {/* COMPORTAMIENTO TEMPORAL DIARIO */}
            <div className="w-full bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-2.5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] text-white px-4 py-1.5 text-xs md:text-sm font-vw-head font-bold">
                        <CalendarDays className="h-4 w-4 text-white shrink-0" />
                        <span>Comportamiento Diario - {métricas.nombreMesEvaluado}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 pt-8">
                    <div
                        className="grid gap-1.5 items-end min-h-[150px] overflow-x-auto pb-1 scrollbar-thin"
                        style={{ gridTemplateColumns: `repeat(${métricas.itemsComportamiento.length}, minmax(22px, 1fr))` }}
                    >
                        {métricas.itemsComportamiento.map((item) => {
                            const tieneVisitas = item.total > 0;
                            const pctAlturaTotal = tieneVisitas ? Math.max(15, (item.total / métricas.maxComportamientoTotal) * 100) : 5;

                            return (
                                <div
                                    key={item.idKey}
                                    className="flex flex-col items-center gap-1 group relative rounded p-1 transition-all hover:bg-slate-50"
                                >
                                    <span className="text-[10px] font-vw-head font-bold text-[#001E50]">
                                        {item.total > 0 ? item.total : ""}
                                    </span>

                                    <div className="w-full flex items-end justify-center h-[120px] relative">
                                        <div
                                            className="w-full max-w-[18px] bg-[#001E50] rounded-t-md transition-all duration-500 mx-auto group-hover:bg-[#1677FF]"
                                            style={{ height: `${pctAlturaTotal}%` }}
                                        />
                                    </div>

                                    <span className="text-[10px] font-vw-head font-bold text-slate-600 leading-none mt-1">
                                        {item.etiqueta}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ========================================================================================= */}
            {/* BLOQUE DE LAS 5 GRÁFICAS EN GRID DE DOS COLUMNAS */}
            {/* ========================================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* 1. GRÁFICO DE PASTEL: MOTIVOS DE INGRESO A PISO */}
                <VWPieCard
                    title="Motivos de Ingreso a Piso"
                    icon={LogIn}
                    data={métricas.dataMotivosIngreso}
                    total={métricas.totalVisitas}
                />

                {/* 2. GRÁFICO DE BARRAS: MODELO DE INTERÉS */}
                <VWBarCard
                    title="Modelo de Interés"
                    icon={Car}
                    data={métricas.dataModelosInteres}
                    total={métricas.totalVisitas}
                />

                {/* 3. GRÁFICO DE PASTEL: MOTIVO DE COMPRA */}
                <VWPieCard
                    title="Motivo de Compra"
                    icon={ShoppingBag}
                    data={métricas.dataMotivosCompra}
                    total={métricas.totalVisitas}
                />

                {/* 4. GRÁFICO DE PASTEL: FORMA DE CAPITALIZACIÓN */}
                <VWPieCard
                    title="Forma de Capitalización"
                    icon={Wallet}
                    data={métricas.dataFormasCapitalizacion}
                    total={métricas.totalVisitas}
                />

                {/* 5. GRÁFICO DE PASTEL: PERFIL PROFESIONAL */}
                <div className="lg:col-span-2">
                    <VWPieCard
                        title="Perfil Profesional"
                        icon={Briefcase}
                        data={métricas.dataPerfilesProfesionales}
                        total={métricas.totalVisitas}
                    />
                </div>

            </div>

        </div>
    );
}

// =========================================================================================
// COMPONENTE TARJETA DE PASTEL/DONA CON ETIQUETAS A LA IZQUIERDA Y CÍRCULO EN TODO LO ALTO
// =========================================================================================
function VWPieCard({ title, icon: Icon, data = [], total = 0 }) {
    if (!data || data.length === 0 || total === 0) {
        return (
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm min-h-[260px]">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                        {Icon && <Icon className="h-3.5 w-3.5 text-white shrink-0" />}
                        <span>{title}</span>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center text-xs text-slate-400 italic">
                    Sin datos registrados en el periodo seleccionado
                </div>
            </div>
        );
    }

    const formattedData = data.map((item, index) => ({
        ...item,
        color: PALETA_VW[index % PALETA_VW.length],
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"
    }));

    const config = {
        data: formattedData,
        angleField: "value",
        colorField: "type",
        radius: 0.95,
        innerRadius: 0.55,
        scale: {
            color: {
                range: formattedData.map(d => d.color),
            },
        },
        legend: false,
        label: {
            text: (d) => {
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
                return `${pct}%`;
            },
            position: "inside",
            style: {
                fontSize: 10,
                fontWeight: "bold",
                fontFamily: "VW Text, sans-serif",
                fill: "#FFFFFF",
                textAlign: "center",
            },
            background: true,
            backgroundRadius: 3,
            backgroundFill: "#001E50",
            backgroundOpacity: 0.75,
        },
        tooltip: {
            formatter: (datum) => {
                const pct = total > 0 ? ((datum.value / total) * 100).toFixed(1) : "0.0";
                return { name: datum.type, value: `${datum.value} prospectos (${pct}%)` };
            },
        },
    };

    return (
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 flex flex-col justify-between shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3 py-1 text-xs font-vw-head font-bold">
                    {Icon && <Icon className="h-3.5 w-3.5 text-white shrink-0" />}
                    <span>{title}</span>
                </div>
                <span className="text-[10px] font-vw-head font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                    {total} Registros
                </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col md:flex-row items-center gap-4 min-h-[220px]">
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                    {formattedData.map((item) => (
                        <div key={item.type} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-2 truncate pr-2">
                                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="font-vw-head font-bold text-[#001E50] truncate" title={item.type}>
                                    {item.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-vw-head font-bold text-slate-700 text-[11px]">{item.value} u.</span>
                                <span className="bg-slate-100 text-slate-600 font-vw-head font-bold text-[9px] px-1.5 py-0.5 rounded-md min-w-[42px] text-right">
                                    {item.percentage}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="w-full md:w-1/2 h-[210px] flex items-center justify-center">
                    <Pie {...config} />
                </div>
            </div>
        </div>
    );
}

// =========================================================================================
// COMPONENTE TARJETA DE BARRAS HORIZONTALES PARA "MODELO DE INTERÉS"
// =========================================================================================
function VWBarCard({ title, icon: Icon, data = [], total = 0 }) {
    const maxVal = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 flex flex-col justify-between shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3 py-1 text-xs font-vw-head font-bold">
                    {Icon && <Icon className="h-3.5 w-3.5 text-white shrink-0" />}
                    <span>{title}</span>
                </div>
                <span className="text-[10px] font-vw-head font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                    <BarChart3 className="h-3 w-3 inline mr-1 text-[#1677FF]" />
                    {data.length} Modelos
                </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-3 space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                {data.length === 0 ? (
                    <div className="flex h-[180px] items-center justify-center text-xs text-slate-400 italic">
                        Sin datos registrados
                    </div>
                ) : (
                    data.map((item, idx) => {
                        const pctWidth = (item.value / maxVal) * 100;
                        const pctShare = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                        const barColor = PALETA_VW[idx % PALETA_VW.length];

                        return (
                            <div key={item.type} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-vw-head font-bold text-[#001E50] truncate" title={item.type}>
                                        {item.type}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-vw-head font-bold text-slate-700">{item.value} prospectos</span>
                                        <span className="text-[9px] font-vw-head font-bold bg-blue-50 text-[#1677FF] px-1.5 py-0.5 rounded border border-blue-100">
                                            {pctShare}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(4, pctWidth))}%`, backgroundColor: barColor }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}