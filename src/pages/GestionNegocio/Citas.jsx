// src/pages/Citas/GraficoMensualAnual.jsx
import { useState, useMemo, useEffect } from "react";
import {
    CheckCircle2,
    Plus,
    Check,
    ChevronDown,
    FileDown,
    PieChart as PieChartIcon,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Globe,
    Building2,
    CalendarCheck,
    MapPin,
    XCircle,
    Users,
    Percent,
    Clock,
    Layers,
    ArrowUpRight
} from "lucide-react";

// Importación de componentes de Ant Design Plots
import { Pie } from "@ant-design/plots";
import { apiCitas } from "../../lib/apiCitas";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const AGENCIAS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxpan", "VW Tuxtepec"];
const ITEMS_POR_PAGINA = 50;

// OBJETIVOS Y MÁXIMOS VISUALES CONFIGURADOS
const OBJETIVOS_DIGITAL = { concertadas: 40, asistidas: 30, maxVisual: 50 };
const OBJETIVOS_TRADICIONAL = { concertadas: 200, asistidas: 150, maxVisual: 250 };

// PALETA EXCLUSIVA DE AZULES VOLKSWAGEN
const AZUL_VW_NAVY = "#001E50";
const AZUL_VW_PRIMARY = "#1677FF";

// IMÁGENES LOCALES DESDE LA CARPETA PUBLIC DE VITE
const IMAGEN_CITAS_GLOBALES = "/fondo4.jpg";
const IMAGEN_CITAS_DIGITALES = "/fondo2.jpg";
const IMAGEN_CITAS_TRADICIONALES = "/fondo3.jpg";

// RESPALDO EN CASO DE FALLA DE RUTA LOCAL
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80";

// FUNCIÓN PARA FORMATEAR NOMBRE: "PRIMER NOMBRE + INICIAL DEL APELLIDO"
function formatearNombreCorto(str) {
    if (!str || str === "—") return "—";
    const partes = String(str).trim().split(/\s+/);
    if (partes.length === 0) return "—";
    if (partes.length === 1) return partes[0];
    const primerNombre = partes[0];
    const inicialApellido = partes[1].charAt(0).toUpperCase();
    return `${primerNombre} ${inicialApellido}.`;
}

// FUNCIÓN DE NORMALIZACIÓN DE DEALS/AGENCIAS
function normalizarCitas(lista) {
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

        return {
            ...item,
            agencia: agenciaFinal,
        };
    });
}

export default function CitasDashboard({ rows: initialRows }) {
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();
    const años = useMemo(() => Array.from({ length: 5 }, (_, i) => añoActual - i), [añoActual]);

    const [añoSel, setAñoSel] = useState(añoActual);
    const [mesSel, setMesSel] = useState(mesActual);
    const [agenciaSel, setAgenciaSel] = useState("VW Cordoba");
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);

    // ESTADOS PARA SECCIONES EXPANDIBLES
    const [asesorExpandido, setAsesorExpandido] = useState(null);
    const [fuenteExpandida, setFuenteExpandida] = useState(null);

    const [citasData, setCitasData] = useState(() => normalizarCitas(initialRows ?? []));
    const [loading, setLoading] = useState(!initialRows);
    const [error, setError] = useState("");

    useEffect(() => {
        setDiaSeleccionado(null);
        setAsesorExpandido(null);
        setFuenteExpandida(null);
    }, [añoSel, mesSel, agenciaSel]);

    useEffect(() => {
        if (initialRows && Array.isArray(initialRows) && initialRows.length > 0) {
            setCitasData(normalizarCitas(initialRows));
            setLoading(false);
            return;
        }

        let activo = true;
        setLoading(true);
        setError("");

        const params = {
            fecha_desde: `${añoSel}-01-01`,
            fecha_hasta: `${añoSel}-12-31`,
        };

        apiCitas.list(params)
            .then((res) => {
                if (!activo) return;
                setCitasData(normalizarCitas(res));
            })
            .catch((err) => {
                if (!activo) return;
                console.error("Error al cargar citas:", err);
                setError("No fue posible consultar las citas desde el servidor.");
            })
            .finally(() => {
                if (activo) setLoading(false);
            });

        return () => { activo = false; };
    }, [initialRows, añoSel]);

    const citasFiltradas = useMemo(() => {
        return (citasData || []).filter((c) => {
            if (!c?.fecha_hora_cita) return false;
            const dt = new Date(c.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) return false;

            if (agenciaSel && String(c.agencia || "").toLowerCase() !== agenciaSel.toLowerCase()) {
                return false;
            }
            if (dt.getFullYear() !== añoSel) return false;
            if (mesSel !== null && dt.getMonth() !== mesSel) return false;

            return true;
        });
    }, [citasData, añoSel, mesSel, agenciaSel]);

    const citasDeduplicadas = useMemo(() => {
        const mapClientes = new Map();

        citasFiltradas.forEach((cita) => {
            const nombreCliente = String(cita?.cliente?.nombre || cita?.nombre || "").trim();
            const key = nombreCliente ? nombreCliente.toLowerCase() : `id_${cita.id || Math.random()}`;

            if (!mapClientes.has(key)) {
                mapClientes.set(key, []);
            }
            mapClientes.get(key).push(cita);
        });

        const resultado = [];

        mapClientes.forEach((registros) => {
            if (registros.length === 1) {
                resultado.push(registros[0]);
                return;
            }

            const asistidas = registros.filter((r) => !!r.asistencia);

            if (asistidas.length > 0) {
                asistidas.sort((a, b) => new Date(b.fecha_hora_cita || b.created_at) - new Date(a.fecha_hora_cita || a.created_at));
                resultado.push(asistidas[0]);
            } else {
                registros.sort((a, b) => new Date(b.fecha_hora_cita || b.created_at) - new Date(a.fecha_hora_cita || a.created_at));
                resultado.push(registros[0]);
            }
        });

        return resultado;
    }, [citasFiltradas]);

    const exportarAExcel = () => {
        if (!citasDeduplicadas || citasDeduplicadas.length === 0) return;

        const headers = [
            "Creado en",
            "Fecha / Hora cita",
            "Agencia",
            "Asistencia",
            "Nombre",
            "Fuente",
            "PAUTA DE ORIGEN",
            "Asesor digital",
            "Asesor piso",
            "Tipo venta",
            "Tipo cita",
            "Comentarios"
        ];

        const filas = citasDeduplicadas.map((row) => [
            row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "—",
            row.fecha_hora_cita ? new Date(row.fecha_hora_cita).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—",
            row.agencia || "—",
            row.asistencia ? "Si" : "No",
            formatearNombreCorto(row?.cliente?.nombre || row.nombre),
            row.fuente_prospeccion || row.fuente || "—",
            row.pauta_origen || row.pauta || "—",
            row.asesor_digital || "—",
            row.asesor_piso || "—",
            row.tipo_venta || "Digital",
            row.tipo_cita || "—",
            (row.comentarios || "—").replace(/"/g, '""')
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...filas.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Citas_${agenciaSel || "Todas"}_${añoSel}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const métricas = useMemo(() => {
        let totalesConcertadas = citasDeduplicadas.length;
        let totalesAsistidas = 0;

        let digitalesConcertadas = 0;
        let digitalesAsistidas = 0;

        let tradicionalesConcertadas = 0;
        let tradicionalesAsistidas = 0;

        const asesoresDigitalesMap = {};
        const asesoresPisoDigitalMap = {};
        const motivosVisitaMap = {};
        const asesoresGeneradoresStackMap = {};
        const fuentesStackMap = {};

        let itemsComportamiento = [];
        const mapFechaIndex = {};

        if (mesSel !== null) {
            const diasEnMes = new Date(añoSel, mesSel + 1, 0).getDate();
            for (let i = 1; i <= diasEnMes; i++) {
                const item = {
                    idKey: `dia_${i}`,
                    etiqueta: `${i}`,
                    subetiqueta: MESES[mesSel].substring(0, 3),
                    total: 0,
                    asistio: 0,
                    noAsistio: 0
                };
                itemsComportamiento.push(item);
                mapFechaIndex[`${mesSel}-${i}`] = i - 1;
            }
        } else {
            let idx = 0;
            for (let m = 0; m < 12; m++) {
                const diasEnMes = new Date(añoSel, m + 1, 0).getDate();
                for (let d = 1; d <= diasEnMes; d++) {
                    const item = {
                        idKey: `dia_${m}_${d}`,
                        etiqueta: `${d}`,
                        subetiqueta: MESES[m].substring(0, 3),
                        total: 0,
                        asistio: 0,
                        noAsistio: 0
                    };
                    itemsComportamiento.push(item);
                    mapFechaIndex[`${m}-${d}`] = idx;
                    idx++;
                }
            }
        }

        citasDeduplicadas.forEach((c) => {
            const dt = new Date(c.fecha_hora_cita);
            const diaNum = dt.getDate();
            const mesNum = dt.getMonth();
            const asistio = !!c.asistencia;
            if (asistio) totalesAsistidas += 1;

            const keyBusqueda = `${mesNum}-${diaNum}`;
            const itemIdx = mapFechaIndex[keyBusqueda];
            if (itemIdx !== undefined && itemsComportamiento[itemIdx]) {
                itemsComportamiento[itemIdx].total += 1;
                if (asistio) itemsComportamiento[itemIdx].asistio += 1;
                else itemsComportamiento[itemIdx].noAsistio += 1;
            }

            const fuenteNombre = c.fuente_prospeccion || c.fuente || "Concesionario";
            const asesorNombre = c.asesor_digital || c.asesor_piso || "Sin asignar";

            if (!fuentesStackMap[fuenteNombre]) {
                fuentesStackMap[fuenteNombre] = { asistio: 0, noAsistio: 0, asesoresMap: {} };
            }
            if (asistio) {
                fuentesStackMap[fuenteNombre].asistio += 1;
            } else {
                fuentesStackMap[fuenteNombre].noAsistio += 1;
            }

            if (!fuentesStackMap[fuenteNombre].asesoresMap[asesorNombre]) {
                fuentesStackMap[fuenteNombre].asesoresMap[asesorNombre] = { asistio: 0, total: 0 };
            }
            fuentesStackMap[fuenteNombre].asesoresMap[asesorNombre].total += 1;
            if (asistio) {
                fuentesStackMap[fuenteNombre].asesoresMap[asesorNombre].asistio += 1;
            }

            const asesorGenerador = c.asesor_digital || c.asesor_piso || "Sin asignar";
            if (!asesoresGeneradoresStackMap[asesorGenerador]) {
                asesoresGeneradoresStackMap[asesorGenerador] = { asistio: 0, noAsistio: 0 };
            }
            if (asistio) {
                asesoresGeneradoresStackMap[asesorGenerador].asistio += 1;
            } else {
                asesoresGeneradoresStackMap[asesorGenerador].noAsistio += 1;
            }

            const tipoCitaStr = String(c.tipo_cita || "").toLowerCase().trim();
            const esDigital = tipoCitaStr === "digital";

            if (esDigital) {
                digitalesConcertadas += 1;
                const asesorDig = c.asesor_digital || "Sin asignar";
                if (!asesoresDigitalesMap[asesorDig]) {
                    asesoresDigitalesMap[asesorDig] = { concertadas: 0, asistidas: 0 };
                }
                asesoresDigitalesMap[asesorDig].concertadas += 1;

                const asesorPiso = c.asesor_piso || "Sin asignar";
                if (!asesoresPisoDigitalMap[asesorPiso]) {
                    asesoresPisoDigitalMap[asesorPiso] = { concertadas: 0, asistidas: 0 };
                }
                asesoresPisoDigitalMap[asesorPiso].concertadas += 1;

                if (asistio) {
                    digitalesAsistidas += 1;
                    asesoresDigitalesMap[asesorDig].asistidas += 1;
                    asesoresPisoDigitalMap[asesorPiso].asistidas += 1;
                }
            } else {
                tradicionalesConcertadas += 1;
                const motivo = c.motivo_cita || "Consulta general";
                if (!motivosVisitaMap[motivo]) {
                    motivosVisitaMap[motivo] = { concertadas: 0, asistidas: 0 };
                }
                motivosVisitaMap[motivo].concertadas += 1;

                if (asistio) {
                    tradicionalesAsistidas += 1;
                    motivosVisitaMap[motivo].asistidas += 1;
                }
            }
        });

        const totalesNoAsistidas = totalesConcertadas - totalesAsistidas;
        const pctTotalAsistencia = totalesConcertadas > 0
            ? ((totalesAsistidas / totalesConcertadas) * 100).toFixed(1)
            : "0.0";

        const pctNoShow = totalesConcertadas > 0
            ? ((totalesNoAsistidas / totalesConcertadas) * 100).toFixed(1)
            : "0.0";

        const diasPeriodo = itemsComportamiento.length || 1;
        const promedioDiarioCitas = (totalesConcertadas / diasPeriodo).toFixed(1);

        const pctMixDigital = totalesConcertadas > 0
            ? ((digitalesConcertadas / totalesConcertadas) * 100).toFixed(1)
            : "0.0";

        const pctMixTradicional = totalesConcertadas > 0
            ? ((tradicionalesConcertadas / totalesConcertadas) * 100).toFixed(1)
            : "0.0";

        const pctDigitalConversión = digitalesConcertadas > 0
            ? ((digitalesAsistidas / digitalesConcertadas) * 100).toFixed(1)
            : "0.0";

        const pctTradicionalConversión = tradicionalesConcertadas > 0
            ? ((tradicionalesAsistidas / tradicionalesConcertadas) * 100).toFixed(1)
            : "0.0";

        const asesoresDigitalesRelacion = Object.entries(asesoresDigitalesMap)
            .map(([nombre, data]) => ({
                nombre,
                concertadas: data.concertadas,
                asistidas: data.asistidas,
                pctAsistencia: data.concertadas > 0 ? ((data.asistidas / data.concertadas) * 100).toFixed(1) : "0.0"
            }))
            .sort((a, b) => b.concertadas - a.concertadas);

        const asesoresPisoDigitalList = Object.entries(asesoresPisoDigitalMap)
            .map(([nombre, data]) => ({
                nombre,
                concertadas: data.concertadas,
                asistidas: data.asistidas,
                pct: data.concertadas > 0 ? ((data.asistidas / data.concertadas) * 100).toFixed(1) : "0.0"
            }))
            .sort((a, b) => b.concertadas - a.concertadas);

        const motivosVisitaList = Object.entries(motivosVisitaMap)
            .map(([nombre, data]) => ({
                nombre,
                concertadas: data.concertadas,
                asistidas: data.asistidas,
                pct: data.concertadas > 0 ? ((data.asistidas / data.concertadas) * 100).toFixed(1) : "0.0"
            }))
            .sort((a, b) => b.concertadas - a.concertadas);

        const asesoresGeneradoresList = Object.entries(asesoresGeneradoresStackMap)
            .map(([nombre, counts]) => {
                const total = counts.asistio + counts.noAsistio;
                const noAsistio = counts.noAsistio;
                const pct = total > 0 ? ((counts.asistio / total) * 100).toFixed(1) : "0.0";
                return {
                    nombre,
                    asistio: counts.asistio,
                    noAsistio,
                    total,
                    pct
                };
            })
            .sort((a, b) => b.total - a.total);

        const asesorEficiente = [...asesoresGeneradoresList]
            .filter((a) => a.total > 0)
            .sort((a, b) => Number(b.pct) - Number(a.pct))[0] || null;

        const fuentesList = Object.entries(fuentesStackMap)
            .map(([nombre, data]) => {
                const total = data.asistio + data.noAsistio;
                const pct = total > 0 ? ((data.asistio / total) * 100).toFixed(1) : "0.0";

                const asesores = Object.entries(data.asesoresMap)
                    .map(([asesorNombre, aData]) => ({
                        nombre: asesorNombre,
                        total: aData.total,
                        asistio: aData.asistio,
                        pct: aData.total > 0 ? ((aData.asistio / aData.total) * 100).toFixed(1) : "0.0"
                    }))
                    .sort((a, b) => b.total - a.total);

                return {
                    nombre,
                    asistio: data.asistio,
                    noAsistio: data.noAsistio,
                    total,
                    pct,
                    asesores
                };
            })
            .sort((a, b) => b.total - a.total);

        const maxConcertadasDigital = Math.max(...asesoresDigitalesRelacion.map(a => a.concertadas), 1);
        const maxConcertadasPisoDigital = Math.max(...asesoresPisoDigitalList.map(a => a.concertadas), 1);
        const maxConcertadasMotivos = Math.max(...motivosVisitaList.map(m => m.concertadas), 1);
        const maxConcertadasGeneradores = Math.max(...asesoresGeneradoresList.map(a => a.total), 1);
        const maxConcertadasFuentes = Math.max(...fuentesList.map(f => f.total), 1);
        const maxComportamientoTotal = Math.max(...itemsComportamiento.map(d => d.total), 1);

        return {
            totalesConcertadas,
            totalesAsistidas,
            totalesNoAsistidas,
            pctTotalAsistencia,
            pctNoShow,
            promedioDiarioCitas,
            pctMixDigital,
            pctMixTradicional,
            asesorEficiente,

            digitalesConcertadas,
            digitalesAsistidas,
            pctDigitalConversión,
            asesoresDigitalesRelacion,
            maxConcertadasDigital,
            asesoresPisoDigitalList,
            maxConcertadasPisoDigital,

            tradicionalesConcertadas,
            tradicionalesAsistidas,
            pctTradicionalConversión,
            motivosVisitaList,
            maxConcertadasMotivos,

            asesoresGeneradoresList,
            maxConcertadasGeneradores,

            fuentesList,
            maxConcertadasFuentes,

            itemsComportamiento,
            maxComportamientoTotal,
            esTodoElAño: mesSel === null,
            nombreMesEvaluado: mesSel !== null ? MESES[mesSel] : "Todo el año"
        };
    }, [citasDeduplicadas, mesSel, añoSel]);

    const citasDelAsesorExpandido = useMemo(() => {
        if (!asesorExpandido) return [];
        return citasDeduplicadas.filter((c) => {
            const nombreAsesor = c.asesor_digital || c.asesor_piso || "Sin asignar";
            return nombreAsesor.toLowerCase() === asesorExpandido.toLowerCase();
        });
    }, [citasDeduplicadas, asesorExpandido]);

    return (
        <div className="w-full bg-white text-[#1E293B] font-vw-text font-light p-3 md:p-5 space-y-4">

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
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-vw-text">
                    {error}
                </div>
            )}

            {/* KPI CARDS GLOBALES */}
            <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all duration-200">
                    <div className="flex flex-col md:flex-row items-stretch">

                        <div className="relative md:w-1/4 lg:w-1/6 h-24 md:h-auto overflow-hidden bg-[#001E50] shrink-0">
                            <img
                                src={IMAGEN_CITAS_GLOBALES}
                                alt="Volkswagen Global Showroom"
                                className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_IMAGE;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#001E50]/90 via-[#001E50]/40 to-transparent" />

                            <div className="absolute top-2 left-2 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                                Consolidado General
                            </div>

                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                                <CalendarCheck className="h-3.5 w-3.5 text-sky-400" />
                                <span className="text-xs font-vw-head font-bold tracking-wide">VW Showroom</span>
                            </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                            MÉTRICA GLOBAL
                                        </span>
                                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-vw-head font-bold px-2 py-0.5 rounded border border-emerald-200">
                                            Cliente Único
                                        </span>
                                    </div>
                                    <h4 className="text-base font-vw-head font-bold text-[#001E50] leading-tight mt-0.5">
                                        Resumen Ejecutivo de Citas
                                    </h4>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-2xl font-vw-head font-bold text-[#001E50] leading-none">
                                            {métricas.totalesConcertadas}
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-vw-text uppercase tracking-wide mt-0.5">Concertadas</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center pt-0.5">
                                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 text-center">
                                    <div className="text-[10px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                        <span>Asistidas</span>
                                    </div>
                                    <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">{métricas.totalesAsistidas}</div>
                                </div>

                                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 text-center">
                                    <div className="text-[10px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                        <XCircle className="h-3 w-3 text-amber-600" />
                                        <span>No-Show</span>
                                    </div>
                                    <div className="text-sm font-vw-head font-bold text-amber-700 mt-0.5">
                                        {métricas.totalesNoAsistidas} <span className="text-[9px] font-normal text-slate-400">({métricas.pctNoShow}%)</span>
                                    </div>
                                </div>

                                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 text-center">
                                    <div className="text-[10px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                        <Clock className="h-3 w-3 text-[#1677FF]" />
                                        <span>Promedio Diario</span>
                                    </div>
                                    <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">{métricas.promedioDiarioCitas} <span className="text-[9px] font-normal text-slate-400">citas/día</span></div>
                                </div>

                                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-2 text-center">
                                    <div className="text-[10px] text-slate-400 font-vw-text flex items-center justify-center gap-1">
                                        <Globe className="h-3 w-3 text-sky-500" />
                                        <span>Mix Digital</span>
                                    </div>
                                    <div className="text-sm font-vw-head font-bold text-[#001E50] mt-0.5">{métricas.pctMixDigital}%</div>
                                </div>

                                <div className="col-span-2 md:col-span-1 space-y-1 bg-[#F8FAFC] border border-slate-100 rounded-xl p-2">
                                    <div className="flex justify-between text-[10px] font-vw-text text-slate-600">
                                        <span>Efectividad</span>
                                        <strong className="font-vw-head font-bold text-[#001E50]">{métricas.pctTotalAsistencia}%</strong>
                                    </div>
                                    <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#001E50] rounded-full transition-all duration-500" style={{ width: `${métricas.pctTotalAsistencia}%` }} />
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* CANALES DE CITAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* CANAL DIGITAL */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
                        <div className="relative h-28 w-full overflow-hidden bg-[#001E50]">
                            <img
                                src={IMAGEN_CITAS_DIGITALES}
                                alt="Ingreso Prospectos Redes Sociales"
                                className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_IMAGE;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#001E50]/80 via-[#001E50]/20 to-transparent" />

                            <div className="absolute top-2.5 left-2.5 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-3 py-0.5 rounded-full border border-white/20">
                                Obj. Concertadas: {OBJETIVOS_DIGITAL.concertadas}
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-[#1677FF] text-white text-[10px] font-vw-head font-bold px-3 py-0.5 rounded-full border border-white/20">
                                Obj. Asistidas: {OBJETIVOS_DIGITAL.asistidas}
                            </div>

                            <div className="absolute bottom-2.5 left-3 flex items-center gap-2 text-white">
                                <Globe className="h-4 w-4 text-sky-400" />
                                <span className="text-xs font-vw-head font-bold tracking-wide">Prospectos Digitales & Redes</span>
                            </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                        CANAL DIGITAL
                                    </span>
                                    <span className="text-2xl font-vw-head font-bold text-[#001E50]">
                                        {métricas.digitalesConcertadas}
                                    </span>
                                </div>

                                <div className="mt-2.5 space-y-1.5">
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between text-[10px] font-vw-text text-slate-600">
                                            <span>Concertadas</span>
                                            <span className="font-vw-head font-bold text-[#001E50]">{métricas.digitalesConcertadas} <span className="text-[9px] text-slate-400 font-normal">/ {OBJETIVOS_DIGITAL.concertadas} Obj</span></span>
                                        </div>
                                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1677FF] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (métricas.digitalesConcertadas / OBJETIVOS_DIGITAL.maxVisual) * 100)}%` }} />
                                            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${(OBJETIVOS_DIGITAL.concertadas / OBJETIVOS_DIGITAL.maxVisual) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between text-[10px] font-vw-text text-slate-600">
                                            <span>Asistidas Efectivas</span>
                                            <span className="font-vw-head font-bold text-[#001E50]">{métricas.digitalesAsistidas} <span className="text-[9px] text-slate-400 font-normal">/ {OBJETIVOS_DIGITAL.asistidas} Obj</span></span>
                                        </div>
                                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#001E50] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (métricas.digitalesAsistidas / OBJETIVOS_DIGITAL.maxVisual) * 100)}%` }} />
                                            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${(OBJETIVOS_DIGITAL.asistidas / OBJETIVOS_DIGITAL.maxVisual) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2.5 border-t border-slate-100 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-vw-head font-bold text-slate-400 uppercase tracking-wide">Asesores Digitales</div>
                                        <div className="space-y-1 max-h-[90px] overflow-y-auto scrollbar-thin pr-1">
                                            {métricas.asesoresDigitalesRelacion.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic">Sin registros</div>
                                            ) : (
                                                métricas.asesoresDigitalesRelacion.map((item) => {
                                                    const pctVolumen = (item.concertadas / métricas.maxConcertadasDigital) * 100;
                                                    const pctAsistencia = item.concertadas > 0 ? (item.asistidas / item.concertadas) * 100 : 0;
                                                    return (
                                                        <div key={item.nombre} className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="font-vw-text text-slate-700 font-medium truncate max-w-[120px]" title={item.nombre}>{item.nombre}</span>
                                                                <span className="font-vw-head font-bold text-[#001E50]">
                                                                    {item.asistidas}/{item.concertadas} <span className="text-[8px] text-slate-500 font-normal">({item.pctAsistencia}%)</span>
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                                                <div className="bg-[#CBD5E1] h-full rounded-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${Math.min(100, pctVolumen)}%` }} />
                                                                <div className="bg-[#001E50] h-full rounded-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${Math.min(100, (pctVolumen * pctAsistencia) / 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-100 pt-1.5 md:pt-0 md:pl-2">
                                        <div className="text-[9px] font-vw-head font-bold text-slate-400 uppercase tracking-wide">Asesores Piso (Leads)</div>
                                        <div className="space-y-1 max-h-[90px] overflow-y-auto scrollbar-thin pr-1">
                                            {métricas.asesoresPisoDigitalList.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic">Sin registros</div>
                                            ) : (
                                                métricas.asesoresPisoDigitalList.map((item) => {
                                                    const pctVolumen = (item.concertadas / métricas.maxConcertadasPisoDigital) * 100;
                                                    const pctAsistencia = item.concertadas > 0 ? (item.asistidas / item.concertadas) * 100 : 0;
                                                    return (
                                                        <div key={item.nombre} className="space-y-0.5">
                                                            <div className="flex justify-between items-center text-[10px]">
                                                                <span className="font-vw-text text-slate-700 font-medium truncate max-w-[110px]" title={item.nombre}>{item.nombre}</span>
                                                                <span className="font-vw-head font-bold text-[#001E50]">
                                                                    {item.asistidas}/{item.concertadas} <span className="text-[8px] text-slate-500 font-normal">({item.pct}%)</span>
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                                                <div className="bg-[#CBD5E1] h-full rounded-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${Math.min(100, pctVolumen)}%` }} />
                                                                <div className="bg-[#1677FF] h-full rounded-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${Math.min(100, (pctVolumen * pctAsistencia) / 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-vw-text text-slate-600">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1677FF]" />
                                    <span>Conversión efectivas: <strong className="font-vw-head font-bold text-[#001E50]">{métricas.pctDigitalConversión}%</strong></span>
                                </div>
                                <div className="bg-[#001E50] text-white font-vw-head font-bold text-[10px] py-1 px-3 rounded-full cursor-pointer hover:bg-[#001E50]/90 transition">
                                    Rendimiento Digital
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CANAL PISO / TRADICIONAL */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
                        <div className="relative h-28 w-full overflow-hidden bg-[#001E50]">
                            <img
                                src={IMAGEN_CITAS_TRADICIONALES}
                                alt="Exploración de CRM y Piso"
                                className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_IMAGE;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#001E50]/80 via-[#001E50]/20 to-transparent" />

                            <div className="absolute top-2.5 left-2.5 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-3 py-0.5 rounded-full border border-white/20">
                                Obj. Concertadas: {OBJETIVOS_TRADICIONAL.concertadas}
                            </div>
                            <div className="absolute top-2.5 right-2.5 bg-[#1677FF] text-white text-[10px] font-vw-head font-bold px-3 py-0.5 rounded-full border border-white/20">
                                Obj. Asistidas: {OBJETIVOS_TRADICIONAL.asistidas}
                            </div>

                            <div className="absolute bottom-2.5 left-3 flex items-center gap-2 text-white">
                                <Building2 className="h-4 w-4 text-sky-400" />
                                <span className="text-xs font-vw-head font-bold tracking-wide">Piso de Ventas & Tradicional</span>
                            </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                        CANAL PISO / TRADICIONAL
                                    </span>
                                    <span className="text-2xl font-vw-head font-bold text-[#001E50]">
                                        {métricas.tradicionalesConcertadas}
                                    </span>
                                </div>

                                <div className="mt-2.5 space-y-1.5">
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between text-[10px] font-vw-text text-slate-600">
                                            <span>Concertadas</span>
                                            <span className="font-vw-head font-bold text-[#001E50]">{métricas.tradicionalesConcertadas} <span className="text-[9px] text-slate-400 font-normal">/ {OBJETIVOS_TRADICIONAL.concertadas} Obj</span></span>
                                        </div>
                                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1677FF] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (métricas.tradicionalesConcertadas / OBJETIVOS_TRADICIONAL.maxVisual) * 100)}%` }} />
                                            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${(OBJETIVOS_TRADICIONAL.concertadas / OBJETIVOS_TRADICIONAL.maxVisual) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex justify-between text-[10px] font-vw-text text-slate-600">
                                            <span>Asistidas Efectivas</span>
                                            <span className="font-vw-head font-bold text-[#001E50]">{métricas.tradicionalesAsistidas} <span className="text-[9px] text-slate-400 font-normal">/ {OBJETIVOS_TRADICIONAL.asistidas} Obj</span></span>
                                        </div>
                                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#001E50] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (métricas.tradicionalesAsistidas / OBJETIVOS_TRADICIONAL.maxVisual) * 100)}%` }} />
                                            <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: `${(OBJETIVOS_TRADICIONAL.asistidas / OBJETIVOS_TRADICIONAL.maxVisual) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2.5 border-t border-slate-100 pt-2 space-y-1">
                                    <div className="text-[9px] font-vw-head font-bold text-slate-400 uppercase tracking-wide">Motivos de Visita (Efectividad)</div>
                                    <div className="space-y-1 max-h-[90px] overflow-y-auto scrollbar-thin pr-1">
                                        {métricas.motivosVisitaList.length === 0 ? (
                                            <div className="text-[10px] text-slate-400 italic">Sin registros</div>
                                        ) : (
                                            métricas.motivosVisitaList.map((item) => {
                                                const pctVolumen = (item.concertadas / métricas.maxConcertadasMotivos) * 100;
                                                const pctAsistencia = item.concertadas > 0 ? (item.asistidas / item.concertadas) * 100 : 0;
                                                return (
                                                    <div key={item.nombre} className="space-y-0.5">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <span className="font-vw-text text-slate-700 font-medium truncate max-w-[160px]" title={item.nombre}>{item.nombre}</span>
                                                            <span className="font-vw-head font-bold text-[#001E50]">
                                                                {item.asistidas}/{item.concertadas} <span className="text-[8px] text-slate-500 font-normal">({item.pct}%)</span>
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                                            <div className="bg-[#CBD5E1] h-full rounded-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${Math.min(100, pctVolumen)}%` }} />
                                                            <div className="bg-[#001E50] h-full rounded-full absolute left-0 top-0 transition-all duration-500" style={{ width: `${Math.min(100, (pctVolumen * pctAsistencia) / 100)}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-vw-text text-slate-600">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1677FF]" />
                                    <span>Conversión efectivas: <strong className="font-vw-head font-bold text-[#001E50]">{métricas.pctTradicionalConversión}%</strong></span>
                                </div>
                                <div className="bg-[#001E50] text-white font-vw-head font-bold text-[10px] py-1 px-3 rounded-full cursor-pointer hover:bg-[#001E50]/90 transition">
                                    Atención en Piso
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* DESGLOSE POR ASESOR: VISTA ULTRA-COMPACTA */}
            <div className="w-full bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3 md:p-3.5 space-y-2">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">

                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                        <UserCheck className="h-3.5 w-3.5 text-white shrink-0" />
                        <span>Desglose por Asesor Comercial</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        {métricas.asesorEficiente && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 font-vw-head font-bold text-[10px]">
                                <Percent className="h-3 w-3 text-emerald-600" />
                                <span>Máx. Eficiencia: {formatearNombreCorto(métricas.asesorEficiente.nombre)} ({métricas.asesorEficiente.pct}%)</span>
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={exportarAExcel}
                            className="inline-flex items-center gap-1 rounded-full bg-white text-[#001E50] border border-slate-200 px-2.5 py-0.5 font-vw-head font-bold text-[10px] hover:bg-[#001E50] hover:text-white transition-all cursor-pointer"
                        >
                            <FileDown className="h-3 w-3" />
                            <span>Excel</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    {métricas.asesoresGeneradoresList.length === 0 ? (
                        <div className="flex h-[80px] items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                            Sin datos de asesores registrados para los filtros seleccionados
                        </div>
                    ) : (
                        métricas.asesoresGeneradoresList.map((item, idx) => {
                            const isTop = idx === 0;
                            const isExpanded = asesorExpandido === item.nombre;
                            const pctConcertadasWidth = (item.total / métricas.maxConcertadasGeneradores) * 100;
                            const pctAsistidasWidth = item.total > 0 ? (item.asistio / item.total) * pctConcertadasWidth : 0;
                            const pctNum = Number(item.pct) || 0;

                            return (
                                <div
                                    key={item.nombre}
                                    className="bg-white rounded-lg border border-slate-200/80 overflow-hidden transition-all duration-150"
                                >
                                    <div
                                        onClick={() => setAsesorExpandido(isExpanded ? null : item.nombre)}
                                        className="px-2.5 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer text-xs"
                                    >
                                        <div className="flex items-center gap-2 w-48 shrink-0">
                                            <div className={`h-6 w-6 rounded flex items-center justify-center font-vw-head font-bold text-[10px] shrink-0 ${isTop ? "bg-[#001E50] text-white" : "bg-slate-100 text-slate-600"
                                                }`}>
                                                VW{idx + 1}
                                            </div>

                                            <div className="truncate">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-vw-head font-bold text-[#001E50] text-[11px] truncate" title={item.nombre}>
                                                        {item.nombre}
                                                    </span>
                                                    {isTop && (
                                                        <span className="text-[7px] font-vw-head font-bold text-amber-800 bg-amber-100 px-1 rounded border border-amber-200 shrink-0">
                                                            #1
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[10px] text-slate-600 font-vw-text shrink-0">
                                            <div title="Concertadas"><b>{item.total}</b> conc.</div>
                                            <div className="text-emerald-600" title="Asistidas"><b>{item.asistio}</b> asist.</div>
                                            <div className="text-amber-600" title="No-Show"><b>{item.noAsistio}</b> no-show</div>
                                        </div>

                                        <div className="hidden sm:block flex-1 max-w-[180px] mx-2">
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                                <div
                                                    className="bg-slate-300 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, Math.max(4, pctConcertadasWidth))}%` }}
                                                />
                                                <div
                                                    className="bg-[#001E50] h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, pctAsistidasWidth)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-[11px] font-vw-head font-bold min-w-[36px] text-right ${pctNum >= 60 ? "text-emerald-600" : pctNum >= 40 ? "text-[#1677FF]" : "text-amber-600"
                                                }`}>
                                                {item.pct}%
                                            </span>
                                            <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${isExpanded ? "bg-[#001E50] text-white" : "bg-slate-100 text-slate-400"
                                                }`}>
                                                <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-[#F8FAFC] border-t border-slate-200 p-2.5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[#001E50]" />
                                                    <h5 className="font-vw-head font-bold text-[#001E50] text-[11px]">
                                                        Citas de {item.nombre} ({citasDelAsesorExpandido.length} clientes)
                                                    </h5>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-vw-text">
                                                    Formato: Nombre + Inicial Apellido
                                                </span>
                                            </div>

                                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                                <table className="w-full text-left text-[10px]">
                                                    <thead className="bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Fecha / Hora cita</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Agencia</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Asistencia</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Nombre</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Fuente</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">PAUTA DE ORIGEN</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Asesor digital</th>
                                                            <th className="px-2 py-1.5 whitespace-nowrap">Tipo cita</th>
                                                            <th className="px-2 py-1.5">Comentarios</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 font-vw-text text-slate-700">
                                                        {citasDelAsesorExpandido.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={9} className="px-2 py-2 text-center text-slate-400 italic">
                                                                    No hay citas registradas para este asesor.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            citasDelAsesorExpandido.map((row, cIdx) => (
                                                                <tr key={row.id || cIdx} className="hover:bg-[#F8FAFC] transition-colors">
                                                                    <td className="px-2 py-1 whitespace-nowrap font-medium text-slate-800">
                                                                        {row.fecha_hora_cita ? new Date(row.fecha_hora_cita).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—"}
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap font-vw-head font-bold text-[#001E50]">
                                                                        {row.agencia || "—"}
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap">
                                                                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[8px] font-vw-head font-bold ${row.asistencia ? "bg-[#001E50] text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                                                                            }`}>
                                                                            {row.asistencia ? "Si" : "No"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap font-vw-head font-bold text-[#001E50]">
                                                                        {formatearNombreCorto(row?.cliente?.nombre || row.nombre)}
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap">
                                                                        <span className="inline-block rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[9px] font-vw-head font-bold text-[#001E50]">
                                                                            {row.fuente_prospeccion || row.fuente || "Concesionario"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap text-slate-600">
                                                                        {row.pauta_origen || row.pauta || "—"}
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap text-slate-600">
                                                                        {row.asesor_digital || "—"}
                                                                    </td>
                                                                    <td className="px-2 py-1 whitespace-nowrap text-slate-600">
                                                                        {row.tipo_cita || "—"}
                                                                    </td>
                                                                    <td className="px-2 py-1 max-w-xs truncate text-slate-500" title={row.comentarios}>
                                                                        {row.comentarios || "—"}
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

            {/* COMPORTAMIENTO DIARIO Y TIPO DE CITAS (REDISEÑADO) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* COMPORTAMIENTO TEMPORAL DIARIO */}
                <div className="lg:col-span-7 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col justify-between">

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-2.5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] text-white px-4 py-1.5 text-xs md:text-sm font-vw-head font-bold">
                            <CalendarDays className="h-4 w-4 text-white shrink-0" />
                            <span>Comportamiento Diario - {métricas.nombreMesEvaluado}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2.5 text-[10px] font-vw-head font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-[#001E50]">
                                <span className="text-slate-400 font-normal">Estatus:</span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2.5 w-2.5 rounded-sm bg-[#001E50]" /> Asistió
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2.5 w-2.5 rounded-sm bg-[#BAE7FF]" /> No asistió
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 pt-8">
                        <div
                            className="grid gap-1.5 items-end min-h-[150px] overflow-x-auto pb-1 scrollbar-thin"
                            style={{ gridTemplateColumns: `repeat(${métricas.itemsComportamiento.length}, minmax(22px, 1fr))` }}
                        >
                            {métricas.itemsComportamiento.map((item) => {
                                const esSeleccionado = diaSeleccionado === item.idKey;
                                const tieneCitas = item.total > 0;
                                const pctAlturaTotal = tieneCitas ? Math.max(15, (item.total / métricas.maxComportamientoTotal) * 100) : 5;

                                const pctAsistio = tieneCitas ? (item.asistio / item.total) * 100 : 0;
                                const pctNoAsistio = 100 - pctAsistio;

                                return (
                                    <div
                                        key={item.idKey}
                                        onClick={() => setDiaSeleccionado(esSeleccionado ? null : item.idKey)}
                                        className={`flex flex-col items-center gap-1 group relative cursor-pointer rounded p-1 transition-all ${esSeleccionado ? "bg-blue-50 ring-2 ring-[#001E50]" : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <div
                                            className={`absolute -top-12 transition-all duration-200 bg-[#001E50] text-white text-[9px] p-2 rounded-lg pointer-events-none whitespace-nowrap space-y-0.5 ${esSeleccionado
                                                    ? "opacity-100 z-30 scale-100"
                                                    : "opacity-0 group-hover:opacity-100 z-20 scale-95 group-hover:scale-100"
                                                }`}
                                        >
                                            <div className="font-vw-head font-bold border-b border-white/20 pb-0.5 mb-0.5">
                                                Día {item.etiqueta} {item.subetiqueta} - Total: {item.total} citas
                                            </div>
                                            <div className="flex justify-between gap-3">
                                                <span>Asistieron: <b>{item.asistio}</b></span>
                                                <span>No asistieron: <b>{item.noAsistio}</b></span>
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-vw-head font-bold text-[#001E50]">
                                            {item.total > 0 ? item.total : ""}
                                        </span>

                                        <div className="w-full flex items-end justify-center h-[120px] relative">
                                            <div
                                                className="w-full max-w-[18px] rounded-t-md flex flex-col justify-end transition-all duration-500 mx-auto overflow-hidden"
                                                style={{ height: `${pctAlturaTotal}%` }}
                                            >
                                                <div
                                                    className="bg-[#BAE7FF] w-full transition-all duration-500"
                                                    style={{ height: `${pctNoAsistio}%` }}
                                                />
                                                <div
                                                    className="bg-[#001E50] w-full transition-all duration-500"
                                                    style={{ height: `${pctAsistio}%` }}
                                                />
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-vw-head font-bold text-slate-600 leading-none mt-1">
                                            {item.etiqueta}
                                        </span>
                                        {métricas.esTodoElAño && (
                                            <span className="text-[8px] font-vw-text text-slate-400 leading-none">
                                                {item.subetiqueta}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ========================================================================================= */}
                {/* MÓDULO REDISEÑADO: TIPO DE CITAS (DIGITAL VS TRADICIONAL) - FORMATO MODERNO Y CREATIVO */}
                {/* ========================================================================================= */}
                <div className="lg:col-span-5 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col justify-between">

                    {/* ENCABEZADO CON PÍLDORA AZUL VW */}
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                            <PieChartIcon className="h-3.5 w-3.5 text-white shrink-0" />
                            <span>Tipo de Citas: Mix de Cartera</span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-vw-head font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                            <Layers className="h-3 w-3 text-[#1677FF]" />
                            <span>{métricas.totalesConcertadas} Totales</span>
                        </span>
                    </div>

                    {/* LIENZO DE COMPARACIÓN DIGITAL VS TRADICIONAL */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3 space-y-3 flex-1 flex flex-col justify-around">

                        {/* GAUGE DE RATIO/MIX DUAL DE VOLUMEN (BARRA DE MEZCLA) */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-vw-head font-bold">
                                <span className="text-[#1677FF] flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-[#1677FF]" />
                                    Digital ({métricas.pctMixDigital}%)
                                </span>
                                <span className="text-[#001E50] flex items-center gap-1">
                                    Tradicional ({métricas.pctMixTradicional}%)
                                    <span className="h-2 w-2 rounded-full bg-[#001E50]" />
                                </span>
                            </div>

                            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex relative border border-slate-100">
                                <div
                                    className="bg-[#1677FF] h-full transition-all duration-700 relative group cursor-pointer"
                                    style={{ width: `${métricas.pctMixDigital}%` }}
                                    title={`Digitales: ${métricas.digitalesConcertadas} citas (${métricas.pctMixDigital}%)`}
                                />
                                <div
                                    className="bg-[#001E50] h-full transition-all duration-700 relative group cursor-pointer"
                                    style={{ width: `${métricas.pctMixTradicional}%` }}
                                    title={`Tradicionales: ${métricas.tradicionalesConcertadas} citas (${métricas.pctMixTradicional}%)`}
                                />
                            </div>
                        </div>

                        {/* TARJETAS COMPARATIVAS DE CANAL */}
                        <div className="grid grid-cols-2 gap-2.5 pt-1">

                            {/* TARJETA DIGITAL */}
                            <div className="bg-[#F0F5FF] border border-[#1677FF]/20 rounded-xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-vw-head font-bold text-[#1677FF]">
                                    <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> Digital
                                    </span>
                                    <span className="bg-white/80 text-[#1677FF] px-1.5 py-0.2 rounded text-[9px]">
                                        {métricas.pctMixDigital}% Share
                                    </span>
                                </div>

                                <div className="flex items-baseline justify-between border-b border-[#1677FF]/10 pb-1">
                                    <span className="text-lg font-vw-head font-bold text-[#001E50]">
                                        {métricas.digitalesConcertadas} <span className="text-[9px] text-slate-400 font-normal">citas</span>
                                    </span>
                                    <span className="text-[10px] font-vw-head font-bold text-emerald-600">
                                        {métricas.digitalesAsistidas} asist.
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-600 font-vw-text pt-0.5">
                                    <span>Efectividad:</span>
                                    <strong className="font-vw-head font-bold text-[#001E50]">{métricas.pctDigitalConversión}%</strong>
                                </div>
                            </div>

                            {/* TARJETA TRADICIONAL */}
                            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-vw-head font-bold text-[#001E50]">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" /> Tradicional
                                    </span>
                                    <span className="bg-slate-200/70 text-[#001E50] px-1.5 py-0.2 rounded text-[9px]">
                                        {métricas.pctMixTradicional}% Share
                                    </span>
                                </div>

                                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                                    <span className="text-lg font-vw-head font-bold text-[#001E50]">
                                        {métricas.tradicionalesConcertadas} <span className="text-[9px] text-slate-400 font-normal">citas</span>
                                    </span>
                                    <span className="text-[10px] font-vw-head font-bold text-emerald-600">
                                        {métricas.tradicionalesAsistidas} asist.
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-600 font-vw-text pt-0.5">
                                    <span>Efectividad:</span>
                                    <strong className="font-vw-head font-bold text-[#001E50]">{métricas.pctTradicionalConversión}%</strong>
                                </div>
                            </div>

                        </div>

                        {/* GRÁFICA DE PASTEL/DONUT COMPACTA INTEGRADAS */}
                        <div className="h-[120px] w-full pt-1">
                            <AntPieChart
                                digitales={métricas.digitalesConcertadas}
                                tradicionales={métricas.tradicionalesConcertadas}
                                total={métricas.totalesConcertadas}
                            />
                        </div>

                    </div>
                </div>

            </div>

            {/* DESGLOSE POR FUENTE DE ORIGEN */}
            <div className="w-full bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-2.5">

                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] text-white px-4 py-1.5 text-xs md:text-sm font-vw-head font-bold">
                        <MapPin className="h-4 w-4 text-white shrink-0" />
                        <span>Desglose por Fuente de Origen</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white text-[#001E50] border border-slate-200 px-3 py-1 font-vw-head font-bold text-[11px]">
                            <Globe className="h-3.5 w-3.5 text-[#1677FF]" />
                            <span>{métricas.fuentesList.length} Canales de Entrada</span>
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    {métricas.fuentesList.length === 0 ? (
                        <div className="flex h-[90px] items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                            Sin datos de fuentes registrados para los filtros seleccionados
                        </div>
                    ) : (
                        métricas.fuentesList.map((item, idx) => {
                            const isTop = idx === 0;
                            const isFuenteExpanded = fuenteExpandida === item.nombre;
                            const pctConcertadasWidth = (item.total / métricas.maxConcertadasFuentes) * 100;
                            const pctAsistidasWidth = item.total > 0 ? (item.asistio / item.total) * pctConcertadasWidth : 0;
                            const pctNum = Number(item.pct) || 0;

                            return (
                                <div
                                    key={item.nombre}
                                    className="bg-white rounded-xl border border-slate-200/80 p-2.5 md:p-3 hover:border-slate-300 transition-all duration-200 flex flex-col gap-2"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">

                                        <div className="flex items-center gap-3 min-w-[200px]">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-vw-head font-bold text-xs shrink-0 transition-colors ${isTop
                                                    ? "bg-[#001E50] text-white"
                                                    : "bg-slate-100 text-slate-600"
                                                }`}>
                                                F{idx + 1}
                                            </div>

                                            <div className="truncate">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-vw-head font-bold text-[#001E50] text-xs md:text-sm truncate" title={item.nombre}>
                                                        {item.nombre}
                                                    </h4>
                                                    {isTop && (
                                                        <span className="text-[8px] font-vw-head font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                            #1 Fuente
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-vw-text truncate">
                                                    Punto de Prospección • Canal {idx + 1}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex-1 w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-3 items-center px-0 md:px-2">
                                            <div className="flex items-center justify-around sm:justify-start gap-4 border-r-0 sm:border-r border-slate-100 pr-2">
                                                <div className="text-center sm:text-left">
                                                    <div className="text-xs font-vw-head font-bold text-[#001E50]">{item.total} u.</div>
                                                    <div className="text-[9px] text-slate-400 font-vw-text uppercase">Concertadas</div>
                                                </div>

                                                <div className="text-center sm:text-left">
                                                    <div className="text-xs font-vw-head font-bold text-emerald-600">{item.asistio} u.</div>
                                                    <div className="text-[9px] text-slate-400 font-vw-text uppercase">Asistidas</div>
                                                </div>

                                                <div className="text-center sm:text-left">
                                                    <div className="text-xs font-vw-head font-bold text-amber-600">{item.noAsistio} u.</div>
                                                    <div className="text-[9px] text-slate-400 font-vw-text uppercase">No-Show</div>
                                                </div>
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className="flex justify-between text-[9px] font-vw-text text-slate-500">
                                                    <span>Efectividad en Fuente</span>
                                                    <span className="font-vw-head font-bold text-[#001E50]">{item.asistio} / {item.total}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden relative">
                                                    <div
                                                        className="bg-slate-300 h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                                                        style={{ width: `${Math.min(100, Math.max(4, pctConcertadasWidth))}%` }}
                                                    />
                                                    <div
                                                        className="bg-[#001E50] h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                                                        style={{ width: `${Math.min(100, pctAsistidasWidth)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                                            <div className="text-left md:text-right">
                                                <div className={`text-sm font-vw-head font-bold ${pctNum >= 60 ? "text-emerald-600" : pctNum >= 40 ? "text-[#1677FF]" : "text-amber-600"
                                                    }`}>
                                                    {item.pct}%
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-vw-text uppercase">
                                                    Conversión
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {item.asesores && item.asesores.length > 0 && (
                                        <div className="mt-1 pt-1.5 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setFuenteExpandida(isFuenteExpanded ? null : item.nombre)}
                                                className="w-full flex items-center justify-between text-[10px] font-vw-head font-bold text-slate-500 hover:text-[#001E50] transition-colors py-0.5 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3 w-3 text-[#1677FF]" />
                                                    <span>Asesores comerciales que agendaron en esta fuente ({item.asesores.length})</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                                    <span>{isFuenteExpanded ? "Ocultar" : "Mostrar"}</span>
                                                    <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isFuenteExpanded ? "rotate-90" : ""}`} />
                                                </div>
                                            </button>

                                            {isFuenteExpanded && (
                                                <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-100/70">
                                                    {item.asesores.map((asesor) => {
                                                        const aPctNum = Number(asesor.pct) || 0;
                                                        return (
                                                            <div
                                                                key={asesor.nombre}
                                                                className="bg-[#F8FAFC] border border-slate-200/90 rounded-md px-2 py-0.5 flex items-center gap-1.5 text-[10px]"
                                                            >
                                                                <span className="font-vw-head font-bold text-[#001E50]">
                                                                    {formatearNombreCorto(asesor.nombre)}
                                                                </span>
                                                                <span className="font-vw-text text-slate-500">
                                                                    {asesor.asistio}/{asesor.total} citas
                                                                </span>
                                                                <span className={`font-vw-head font-bold text-[8px] px-1 py-0.2 rounded ${aPctNum >= 60 ? "bg-emerald-50 text-emerald-700" :
                                                                        aPctNum >= 40 ? "bg-blue-50 text-[#1677FF]" : "bg-slate-100 text-slate-600"
                                                                    }`}>
                                                                    {asesor.pct}% efect.
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            );
                        })
                    )}
                </div>

            </div>

        </div>
    );
}

// COMPONENTE DE GRÁFICA DE PASTEL ESTILIZADA
function AntPieChart({ digitales = 0, tradicionales = 0, total = 0 }) {
    if (total === 0) {
        return (
            <div className="flex h-full min-h-[110px] items-center justify-center text-xs font-vw-text text-slate-400">
                Sin datos de citas para mostrar gráfica de pastel
            </div>
        );
    }

    const data = [
        { tipo: "Digitales", cantidad: digitales },
        { tipo: "Tradicionales", cantidad: tradicionales },
    ];

    const config = {
        data,
        angleField: "cantidad",
        colorField: "tipo",
        radius: 0.85,
        innerRadius: 0.65,
        scale: {
            color: {
                range: [AZUL_VW_PRIMARY, AZUL_VW_NAVY],
            },
        },
        label: {
            text: (d) => {
                const pct = total > 0 ? ((d.cantidad / total) * 100).toFixed(1) : "0.0";
                return `${d.tipo}\n${d.cantidad} (${pct}%)`;
            },
            position: "inside",
            style: {
                fontSize: 9,
                fontWeight: "300",
                fontFamily: "VW Text, sans-serif",
                fill: AZUL_VW_NAVY,
                textAlign: "center",
            },
            background: true,
            backgroundRadius: 4,
            backgroundFill: "#FFFFFF",
            backgroundOpacity: 0.88,
        },
        legend: false,
        tooltip: {
            formatter: (datum) => {
                const pct = total > 0 ? ((datum.cantidad / total) * 100).toFixed(1) : "0.0";
                return { name: datum.tipo, value: `${datum.cantidad} citas (${pct}%)` };
            },
        },
    };

    return <Pie {...config} />;
}