// src/pages/GestionNegocio/TestDrives.jsx
import { useState, useMemo, useEffect } from "react";
import {
    CheckCircle2,
    Plus,
    Check,
    ChevronDown,
    FileDown,
    UserCheck,
    ChevronRight,
    CalendarDays,
    Clock,
    Tag,
    Footprints,
    RefreshCw,
    BarChart3,
    Car,
    MessageSquare,
    Gauge
} from "lucide-react";

import { apiPruebaManejo } from "../../lib/apiPruebaManejo";

// RECURSOS VISUALES E IMÁGENES DEDICADAS A TEST DRIVES
const IMAGEN_TEST_DRIVES = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80";

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

// FUNCIÓN AUXILIAR ROBUSTA PARA EXTRAER EL VEHÍCULO DE INTERÉS DE LA API
function extraerNombreModelo(item) {
    if (!item) return "No especificado";

    const val = (v) => {
        if (!v) return null;
        if (typeof v === "string" && v.trim() !== "") return v.trim();
        if (typeof v === "object") {
            return v.nombre || v.modelo || v.descripcion || v.name || v.titulo || null;
        }
        return String(v);
    };

    const posibleModelo =
        val(item.auto_interes) ||
        val(item.auto_interes_nombre) ||
        val(item.modelo_interes) ||
        val(item.modelo_interes_nombre) ||
        val(item.modelo_demostrado) ||
        val(item.modelo_demostrado_nombre) ||
        val(item.auto_demostrado) ||
        val(item.auto_suenos) ||
        val(item.auto_suenos_nombre) ||
        val(item.vehiculo) ||
        val(item.vehiculo_nombre) ||
        val(item.modelo) ||
        val(item.modelo_nombre) ||
        val(item.auto) ||
        val(item.auto_nombre) ||
        val(item.unidad) ||
        val(item.carro) ||
        val(item.modelo_info) ||
        val(item.vehiculo_info) ||
        val(item.auto_info);

    return posibleModelo || "No especificado";
}

// NORMALIZACIÓN DE ATRIBUTOS DESDE apiPruebaManejo
function normalizarPruebasManejo(lista) {
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

        // FECHA PRINCIPAL DE FILTRADO: fecha_hora_cita
        const fechaRaw = item?.fecha_hora_cita || item?.creado_en || item?.fecha_hora || item?.fecha;
        const fuenteNombre = item?.motivo_ingreso || item?.motivo_solicitud || item?.fuente_prospeccion || item?.fuente || "Prueba de Manejo";
        const asesorNombre = item?.asesor_ventas || item?.asesor || item?.asesor_piso || "Sin asignar";

        return {
            ...item,
            agencia: agenciaFinal,
            fecha_hora_cita: fechaRaw,
            nombre: item?.nombre_prospecto || item?.nombre || item?.cliente || "—",
            asesor_ventas: asesorNombre,
            fuente_prospeccion: fuenteNombre,
            tipo_venta: item?.tipo_venta || (item?.deja_auto_cuenta ? "Usados" : "Nuevos"),
            modelo_interes: extraerNombreModelo(item),
            comentarios: item?.comentarios || item?.observaciones || "—"
        };
    });
}

export default function TestDrives({ rows: initialRows }) {
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

    const [pruebasData, setPruebasData] = useState(() => normalizarPruebasManejo(initialRows ?? []));
    const [loading, setLoading] = useState(!initialRows);
    const [error, setError] = useState("");

    useEffect(() => {
        setAsesorExpandido(null);
    }, [añoSel, mesSel, agenciaSel, tipoVentaSel]);

    // PETICIÓN A LA API DE PRUEBAS DE MANEJO
    const cargarAPI = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {
                desde: `${añoSel}-01-01`,
                hasta: `${añoSel}-12-31`,
            };

            const res = await apiPruebaManejo.listAll(params);
            const lista = Array.isArray(res) ? res : res?.results || [];
            setPruebasData(normalizarPruebasManejo(lista));
        } catch (err) {
            console.error("Error al obtener pruebas de manejo:", err);
            setError("No fue posible consultar la información de Pruebas de Manejo del servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialRows || initialRows.length === 0) {
            cargarAPI();
        }
    }, [initialRows, añoSel]);

    // FILTRADO DE REGISTROS CON BASE EN fecha_hora_cita
    const pruebasFiltradas = useMemo(() => {
        return (pruebasData || []).filter((c) => {
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
    }, [pruebasData, añoSel, mesSel, agenciaSel, tipoVentaSel]);

    const exportarAExcel = () => {
        if (!pruebasFiltradas || pruebasFiltradas.length === 0) return;

        const headers = [
            "Fecha / Hora Cita", "Agencia", "Prospecto", "Teléfono",
            "Tipo Venta", "Motivo Solicitud", "Asesor de Ventas",
            "Auto de Interés", "Deja Auto a Cuenta", "Presupuesto", "Comentarios"
        ];

        const filas = pruebasFiltradas.map((row) => [
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
        link.setAttribute("download", `Reporte_PruebasManejo_${agenciaSel || "Todas"}_${tipoVentaSel}_${añoSel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CÁLCULO DE MÉTRICAS Y BARRAS DIARIAS
    const métricas = useMemo(() => {
        let totalPruebas = pruebasFiltradas.length;
        let conAutoCuenta = 0;

        const asesoresMap = {};
        const modelosInteresMap = {};

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

        pruebasFiltradas.forEach((c) => {
            const dt = new Date(c.fecha_hora_cita);
            const diaNum = dt.getDate();
            const mesNum = dt.getMonth();

            if (c.deja_auto_cuenta) conAutoCuenta += 1;

            const keyBusqueda = `${mesNum}-${diaNum}`;
            const itemIdx = mapFechaIndex[keyBusqueda];
            if (itemIdx !== undefined && itemsComportamiento[itemIdx]) {
                itemsComportamiento[itemIdx].total += 1;
            }

            // Conteo exclusivo por Asesor
            const asesorNombre = c.asesor_ventas || "Sin asignar";
            if (!asesoresMap[asesorNombre]) asesoresMap[asesorNombre] = { total: 0, autoCuenta: 0 };
            asesoresMap[asesorNombre].total += 1;
            if (c.deja_auto_cuenta) asesoresMap[asesorNombre].autoCuenta += 1;

            // Modelo Demostrado / Auto de Interés
            const modInt = c.modelo_interes || "No especificado";
            modelosInteresMap[modInt] = (modelosInteresMap[modInt] || 0) + 1;
        });

        const diasPeriodo = itemsComportamiento.length || 1;
        const promedioDiario = (totalPruebas / diasPeriodo).toFixed(1);

        const asesoresList = Object.entries(asesoresMap)
            .map(([nombre, counts]) => ({ nombre, total: counts.total, autoCuenta: counts.autoCuenta }))
            .sort((a, b) => b.total - a.total);

        const arrayToSortedChartData = (mapObj) =>
            Object.entries(mapObj)
                .map(([type, value]) => ({ type, value }))
                .sort((a, b) => b.value - a.value);

        return {
            totalPruebas, conAutoCuenta, promedioDiario,
            asesoresList, maxPruebasAsesor: Math.max(...asesoresList.map(a => a.total), 1),
            itemsComportamiento, maxComportamientoTotal: Math.max(...itemsComportamiento.map(d => d.total), 1),
            nombreMesEvaluado: mesSel !== null ? MESES[mesSel] : "Todo el año",
            dataModelosInteres: arrayToSortedChartData(modelosInteresMap)
        };
    }, [pruebasFiltradas, mesSel, añoSel]);

    const pruebasDelAsesorExpandido = useMemo(() => {
        if (!asesorExpandido) return [];
        return pruebasFiltradas.filter((c) => {
            const nombreAsesor = c.asesor_ventas || "Sin asignar";
            return nombreAsesor.toLowerCase() === asesorExpandido.toLowerCase();
        });
    }, [pruebasFiltradas, asesorExpandido]);

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

            {/* HERO: 1/3 CONSOLIDADO GENERAL + 2/3 DESGLOSE POR ASESOR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

                {/* CONSOLIDADO GENERAL */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm">
                    
                    <div className="relative h-28 w-full overflow-hidden bg-[#001E50] shrink-0">
                        <img
                            src={IMAGEN_TEST_DRIVES}
                            alt="Volkswagen Test Drives"
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
                            <Gauge className="h-3.5 w-3.5 text-sky-400" />
                            <span className="text-xs font-vw-head font-bold tracking-wide">VW Test Drive Experience</span>
                        </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                    PRUEBAS DE MANEJO
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-vw-head font-bold px-2 py-0.5 rounded border border-emerald-200">
                                    Demostración
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-1 text-center my-auto">
                            <h4 className="text-[11px] font-vw-head font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                Resumen Ejecutivo de Demostraciones
                            </h4>
                            <div className="text-5xl font-vw-head font-extrabold text-[#001E50] leading-none tracking-tight">
                                {loading ? "..." : métricas.totalPruebas}
                            </div>
                            <div className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider mt-1.5">
                                Total Pruebas Realizadas
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                                <div className="text-[9px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                    <span>Realizadas</span>
                                </div>
                                <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">
                                    {métricas.totalPruebas}
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
                                    {métricas.promedioDiario} <span className="text-[8px] font-normal text-slate-400">p/día</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* DESGLOSE POR ASESOR COMERCIAL */}
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
                                const pctWidth = (item.total / métricas.maxPruebasAsesor) * 100;

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
                                                {item.total} demostraciones
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

                                        {/* TABLA DESPLEGABLE */}
                                        {isExpanded && (
                                            <div className="bg-[#F8FAFC] border-t border-slate-200 p-2.5 space-y-2">
                                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">
                                                    <span>Pruebas de manejo registradas de {formatearNombreCorto(item.nombre)} ({pruebasDelAsesorExpandido.length})</span>
                                                </div>

                                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                                                    <table className="w-full text-left text-[10px]">
                                                        <thead className="bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold border-b border-slate-200">
                                                            <tr>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Fecha / Hora Cita</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Prospecto</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Tipo Venta</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Motivo Solicitud</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Auto Interés</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap">Auto a Cuenta</th>
                                                                <th className="px-2.5 py-1.5 whitespace-nowrap min-w-[150px]">Comentarios</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 font-vw-text text-slate-700">
                                                            {pruebasDelAsesorExpandido.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={7} className="px-2.5 py-2 text-center text-slate-400 italic">
                                                                        Sin pruebas de manejo registradas
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                pruebasDelAsesorExpandido.map((row, cIdx) => (
                                                                    <tr key={row.id_prueba_manejo || cIdx} className="hover:bg-[#F8FAFC] transition-colors">
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
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap font-bold text-[#001E50]">
                                                                            {row.modelo_interes || "—"}
                                                                        </td>
                                                                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.2 text-[8px] font-vw-head font-bold ${row.deja_auto_cuenta ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                                                                                {row.deja_auto_cuenta ? "Sí" : "No"}
                                                                            </span>
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

            {/* ========================================================================================= */}
            {/* BLOQUE GRID 50% / 50%: COMPORTAMIENTO DIARIO + MODELO DEMOSTRADO                         */}
            {/* ========================================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

                {/* COMPORTAMIENTO TEMPORAL DIARIO (50% ANCHO) */}
                <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                            <CalendarDays className="h-4 w-4 text-white shrink-0" />
                            <span>Comportamiento Diario</span>
                        </div>
                        <span className="text-[10px] font-vw-head font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                            {métricas.nombreMesEvaluado}
                        </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 p-3 pt-8 flex-1 flex flex-col justify-end">
                        <div
                            className="grid gap-1.5 items-end min-h-[160px] overflow-x-auto pb-1 scrollbar-thin"
                            style={{ gridTemplateColumns: `repeat(${métricas.itemsComportamiento.length}, minmax(18px, 1fr))` }}
                        >
                            {métricas.itemsComportamiento.map((item) => {
                                const tieneVisitas = item.total > 0;
                                const pctAlturaTotal = tieneVisitas ? Math.max(15, (item.total / métricas.maxComportamientoTotal) * 100) : 5;

                                return (
                                    <div
                                        key={item.idKey}
                                        className="flex flex-col items-center gap-1 group relative rounded p-0.5 transition-all hover:bg-slate-50"
                                    >
                                        <span className="text-[9px] font-vw-head font-bold text-[#001E50]">
                                            {item.total > 0 ? item.total : ""}
                                        </span>

                                        <div className="w-full flex items-end justify-center h-[120px] relative">
                                            <div
                                                className="w-full max-w-[16px] bg-[#001E50] rounded-t-md transition-all duration-500 mx-auto group-hover:bg-[#1677FF]"
                                                style={{ height: `${pctAlturaTotal}%` }}
                                            />
                                        </div>

                                        <span className="text-[9px] font-vw-head font-bold text-slate-600 leading-none mt-1">
                                            {item.etiqueta}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* MODELO DEMOSTRADO / AUTO DE INTERÉS (50% ANCHO) */}
                <VWBarCard
                    title="Modelo Demostrado (Auto de Interés)"
                    icon={Car}
                    data={métricas.dataModelosInteres}
                    total={métricas.totalPruebas}
                />

            </div>

        </div>
    );
}

// =========================================================================================
// COMPONENTE TARJETA DE BARRAS HORIZONTALES PARA MODELO DEMOSTRADO
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
                    {data.length} Modelos Registrados
                </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-3 max-h-[240px] overflow-y-auto scrollbar-thin flex-1">
                {data.length === 0 ? (
                    <div className="flex h-[180px] items-center justify-center text-xs text-slate-400 italic">
                        Sin datos de modelos registrados
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
                                        <span className="text-[11px] font-vw-head font-bold text-slate-700">{item.value} demostraciones</span>
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