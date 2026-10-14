// src/pages/VentasVN/VentasUsados.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDown, ArrowUp, BarChart3, CalendarDays, Car, CreditCard, Eraser,
    CircleDollarSign, Database, ImageDown, LoaderCircle, RefreshCw, RotateCcw,
    Search, SlidersHorizontal, Tags, User, Users, CheckCircle2, Globe,
    Table2, TrendingUp, WalletCards, X, Check, Plus, ChevronDown,
} from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, Sector,
    XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from "recharts";
import html2canvas from "html2canvas-pro";
import { http, buildQuery } from "../../lib/apiClient";
import { CONDICION_USO, getVentasVNDashboard, } from "../../lib/apiVentasVN";
import InteractiveTable from "../VentasVN/InteractiveTable";

const C = {
    navy: "#131E5C", navyDark: "#0A1340", navyMid: "#2445A2", navyLight: "#6681D4",
    surface: "#F7F8FC", border: "#E4E7F0", borderMd: "#C8CEDF", muted: "#8891AD",
    text: "#1A1F3C", textSub: "#515778", success: "#059669", successBg: "#ECFDF5",
};

function cn(...parts) { return parts.filter(Boolean).join(" "); }

const COLUMNAS = [
    { key: "serie", label: "Serie" },
    { key: "nr_nota", label: "Nr. Nota" },
    { key: "tp_producto", label: "Tipo Producto" },
    { key: "producto_servicio", label: "Producto / Servicio" },
    { key: "precio_unitario", label: "Precio Unitario", tipo: "moneda" },
    { key: "valor_bruto_item", label: "Valor Bruto", tipo: "moneda" },
    { key: "influye_estadistica", label: "Influye Estadística" },
    { key: "valor_descuento_item", label: "Descuento", tipo: "moneda" },
    { key: "codigo_condicion_pago", label: "Código Cond. Pago" },
    { key: "valor_factura", label: "Valor Factura", tipo: "moneda" },
    { key: "valor_factura_sin_iva", label: "Factura sin IVA", tipo: "moneda" },
    { key: "valor_compra", label: "Valor Compra", tipo: "moneda" },
    { key: "isan", label: "ISAN", tipo: "moneda" },
    { key: "iva", label: "IVA", tipo: "moneda" },
    { key: "codigo_entidad", label: "Código Entidad" },
    { key: "fecha_emision", label: "Fecha Emisión", tipo: "fecha" },
    { key: "situacion", label: "Situación" },
    { key: "tipo_nf", label: "Tipo NF" },
    { key: "nr_mov", label: "Nr. Movimiento" },
    { key: "fecha_ultima_venta", label: "Última Venta", tipo: "fecha" },
    { key: "razon_social", label: "Razón Social" },
    { key: "tipo_persona", label: "Tipo Persona" },
    { key: "valor_total_productos", label: "Total Productos", tipo: "moneda" },
    { key: "codigo_marca", label: "Código Marca" },
    { key: "nombre_marca", label: "Marca" },
    { key: "nombre_familia", label: "Familia / Modelo" },
    { key: "condicion_uso", label: "Condición Uso" },
    { key: "nombre_condicion_pago", label: "Condición Pago" },
    { key: "asesor", label: "Asesor" },
    { key: "agencia", label: "Agencia" },
    { key: "tipo_venta", label: "Tipo de Venta" },
];

const FILTROS_INICIALES = {
    q: "",
    agencia: "",
    asesor: "",
    familia: "",
    condicion_pago: "",
    fecha_desde: "",
    fecha_hasta: "",
    venta_digital: "",
};
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const PIE_COLORS = ["#131E5C", "#2445A2", "#3D63C8", "#6681D4", "#8B9DDE", "#AEB9E8", "#42526E", "#7A869A"];
const PRESETS_FECHA = [
    { id: "mes_actual", label: "Este mes" },
    { id: "mes_anterior", label: "Mes anterior" },
    { id: "ultimos_30", label: "Últimos 30 días" },
    { id: "ultimos_7", label: "Últimos 7 días" },
    { id: "esta_semana", label: "Esta semana" },
    { id: "ayer", label: "Ayer" },
    { id: "hoy", label: "Hoy" },
];
const CONCESIONARIOS_VENTAS = [
    { id: "todas", label: "Todas las agencias" },
    { id: "cordoba", label: "VW Córdoba", claves: ["cordoba"] },
    { id: "orizaba", label: "VW Orizaba", claves: ["orizaba"] },
    { id: "poza-rica", label: "VW Poza Rica", claves: ["poza rica", "poza"] },
    { id: "tuxpan", label: "VW Tuxpan", claves: ["tuxpan"] },
    { id: "tuxtepec", label: "VW Tuxtepec", claves: ["tuxtepec"] },
    { id: "vc", label: "R&R VC", claves: ["r&r vc", "vehiculos comerciales", "comerciales"] },
];
function normalizarNombreAgencia(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}
const TOOLTIP_STYLE = { border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(19,30,92,.12)", fontSize: 12 };
const inputClass = "h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10";

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }
function formatoCompacto(value) { return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numero(value)); }
function money(value) {
    if (value === null || value === undefined || value === "") return "—";
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function etiquetaMes(item) {
    const mes = Number(item?.mes || 0);
    const anio = item?.anio || "";
    if (mes < 1 || mes > 12) return item?.periodo || "";
    return `${MESES_CORTOS[mes - 1]} ${anio}`;
}
function fechaInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function fechaLocal(value) {
    if (!value) return null;
    const [y, m, d] = String(value).split("-").map(Number);
    return new Date(y, m - 1, d);
}
function moverDias(date, dias) {
    const out = new Date(date);
    out.setDate(out.getDate() + dias);
    return out;
}
function obtenerRangoPreset(id, base = new Date()) {
    const hoy = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    let desde = hoy;
    let hasta = hoy;
    if (id === "mes_actual") desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    if (id === "mes_anterior") {
        desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    }
    if (id === "ultimos_30") desde = moverDias(hoy, -29);
    if (id === "ultimos_7") desde = moverDias(hoy, -6);
    if (id === "esta_semana") {
        const desplazamiento = (hoy.getDay() + 6) % 7;
        desde = moverDias(hoy, -desplazamiento);
    }
    if (id === "ayer") desde = hasta = moverDias(hoy, -1);
    return { fecha_desde: fechaInput(desde), fecha_hasta: fechaInput(hasta) };
}
function obtenerRangoMes(mes, anio) {
    const anioN = Number(anio) || 2000;
    const mesN = Number(mes);
    if (mesN < 1 || mesN > 12) return {};
    const desde = new Date(anioN, mesN - 1, 1);
    const hasta = new Date(anioN, mesN, 0);
    return { fecha_desde: fechaInput(desde), fecha_hasta: fechaInput(hasta) };
}
function formatoRango(desde, hasta) {
    if (!desde && !hasta) return "Todo el historial";
    const fmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    const d = fechaLocal(desde);
    const h = fechaLocal(hasta);
    if (d && h && desde === hasta) return fmt.format(d);
    if (d && h) return `${fmt.format(d)} – ${fmt.format(h)}`;
    if (d) return `Desde ${fmt.format(d)}`;
    return `Hasta ${fmt.format(h)}`;
}
function porcentaje(value, total) { return total ? Math.round((numero(value) / total) * 100) : 0; }

export default function VentasUsados() {
    const [dashboard, setDashboard] = useState({
        totales: {
            productos: 0,
            unidades_vendidas: 0,
            ingresos: 0,
            costo: 0,
            ventas_digitales: 0,
        },
        graficas: { por_mes: [], por_asesor: [], por_familia: [], por_condicion_pago: [] },
        opciones: { agencias: [], asesores: [], familias: [], condiciones_pago: [] },
    });
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    const anios = useMemo(
        () => Array.from({ length: 5 }, (_, i) => anioActual - i),
        [anioActual]
    );

    const [anioSel, setAnioSel] = useState(anioActual);
    const [mesSel, setMesSel] = useState(mesActual);

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [errorDashboard, setErrorDashboard] = useState("");
    const [registros, setRegistros] = useState([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [vistaActiva, setVistaActiva] = useState("detalle");
    const [filtros, setFiltros] = useState(() => ({
        ...FILTROS_INICIALES,
        ...obtenerRangoMes(mesActual + 1, anioActual),
    }));
    const [qBuscado, setQBuscado] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setQBuscado(filtros.q), 400);
        return () => clearTimeout(t);
    }, [filtros.q]);

    async function cargarDashboard() {
        setLoadingDashboard(true);
        setErrorDashboard("");

        try {
            const response = await getVentasVNDashboard({
                cond_uso: CONDICION_USO.USADO,
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                agencia: filtros.agencia,
                asesor: filtros.asesor,
                familia: filtros.familia,
                condicion_pago: filtros.condicion_pago,
                venta_digital: filtros.venta_digital,
            });

            setDashboard({
                totales: {
                    productos: Number(response?.totales?.productos || 0),
                    unidades_vendidas: Number(
                        response?.totales?.unidades_vendidas || 0
                    ),
                    ingresos: Number(response?.totales?.ingresos || 0),
                    costo: Number(response?.totales?.costo || 0),
                    ventas_digitales: Number(
                        response?.totales?.ventas_digitales || 0
                    ),
                },
                graficas: {
                    por_mes: response?.graficas?.por_mes || [],
                    por_asesor: response?.graficas?.por_asesor || [],
                    por_familia: response?.graficas?.por_familia || [],
                    por_condicion_pago:
                        response?.graficas?.por_condicion_pago || [],
                },
                opciones: {
                    agencias: response?.opciones?.agencias || [],
                    asesores: response?.opciones?.asesores || [],
                    familias: response?.opciones?.familias || [],
                    condiciones_pago:
                        response?.opciones?.condiciones_pago || [],
                },
            });
        } catch (err) {
            console.error("Error cargando dashboard VW_VN usados:", err);

            setErrorDashboard(
                err?.message ||
                "No se pudo cargar el dashboard de Autos Usados."
            );
        } finally {
            setLoadingDashboard(false);
        }
    }

    async function cargarDatos() {
        setLoading(true);
        setError("");

        try {
            const query = buildQuery({
                cond_uso: CONDICION_USO.USADO,
                page: pagina,
                page_size: pageSize,
                q: qBuscado,
                agencia: filtros.agencia,
                asesor: filtros.asesor,
                familia: filtros.familia,
                condicion_pago: filtros.condicion_pago,
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                venta_digital: filtros.venta_digital,
            });

            const response = await http(`/ventas-vn/api/${query}`);

            setRegistros(
                Array.isArray(response?.results)
                    ? response.results
                    : []
            );

            setTotal(Number(response?.count || 0));
        } catch (err) {
            console.error("Error cargando VW_VN usados:", err);

            setRegistros([]);
            setTotal(0);

            setError(
                err?.message ||
                "No fue posible cargar la información de Autos Usados."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarDatos();
    }, [
        pagina,
        pageSize,
        qBuscado,
        filtros.agencia,
        filtros.asesor,
        filtros.familia,
        filtros.condicion_pago,
        filtros.fecha_desde,
        filtros.fecha_hasta,
        filtros.venta_digital,
    ]);
    useEffect(() => {
        cargarDashboard();
    }, [
        filtros.agencia,
        filtros.asesor,
        filtros.familia,
        filtros.condicion_pago,
        filtros.fecha_desde,
        filtros.fecha_hasta,
        filtros.venta_digital,
    ]);
    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const hayFiltros = Object.values(filtros).some((value) => String(value || "").trim());
    const rangoActual = useMemo(() => formatoRango(filtros.fecha_desde, filtros.fecha_hasta), [filtros.fecha_desde, filtros.fecha_hasta]);
    const pillsConcesionarios = useMemo(() => {
        const opciones = dashboard.opciones.agencias || [];
        return CONCESIONARIOS_VENTAS.map((pill) => {
            if (!pill.claves) return { ...pill, valor: "" };
            const encontrada = opciones.find((opcion) =>
                pill.claves.some((clave) => normalizarNombreAgencia(opcion).includes(normalizarNombreAgencia(clave)))
            );
            return { ...pill, valor: encontrada || pill.label };
        });
    }, [dashboard.opciones.agencias]);
    const presetFechaActivo = useMemo(() => {
        const match = PRESETS_FECHA.find((preset) => {
            const rango = obtenerRangoPreset(preset.id);
            return rango.fecha_desde === filtros.fecha_desde && rango.fecha_hasta === filtros.fecha_hasta;
        });
        return match?.id || "";
    }, [filtros.fecha_desde, filtros.fecha_hasta]);

    const utilidad = numero(dashboard.totales.ingresos) - numero(dashboard.totales.costo);
    const margen = dashboard.totales.ingresos ? (utilidad / dashboard.totales.ingresos) * 100 : 0;

    const datosMes = useMemo(() => (dashboard.graficas.por_mes || []).map((item) => ({
        ...item, etiqueta: etiquetaMes(item), productos: numero(item.productos), unidades_vendidas: numero(item.unidades_vendidas),
        ingresos: numero(item.ingresos), costo: numero(item.costo), utilidad: numero(item.ingresos) - numero(item.costo),
    })), [dashboard.graficas.por_mes]);

    const topAsesores = useMemo(() => [...(dashboard.graficas.por_asesor || [])]
        .map((item) => ({ ...item, unidades_vendidas: numero(item.unidades_vendidas), ingresos: numero(item.ingresos), costo: numero(item.costo) }))
        .sort((a, b) => b.unidades_vendidas - a.unidades_vendidas).slice(0, 10), [dashboard.graficas.por_asesor]);

    const topFamilias = useMemo(() => [...(dashboard.graficas.por_familia || [])]
        .map((item) => ({ ...item, unidades_vendidas: numero(item.unidades_vendidas), ingresos: numero(item.ingresos), costo: numero(item.costo) }))
        .sort((a, b) => b.unidades_vendidas - a.unidades_vendidas).slice(0, 10), [dashboard.graficas.por_familia]);

    const condicionesPago = useMemo(() => [...(dashboard.graficas.por_condicion_pago || [])]
        .map((item) => ({ ...item, unidades_vendidas: numero(item.unidades_vendidas) }))
        .sort((a, b) => b.unidades_vendidas - a.unidades_vendidas).slice(0, 8), [dashboard.graficas.por_condicion_pago]);

    const totalCondicionesPago = useMemo(() => condicionesPago.reduce((acc, item) => acc + numero(item.unidades_vendidas), 0), [condicionesPago]);

    const idxCondicionActivo = useMemo(() => condicionesPago.findIndex((item) => filtros.condicion_pago && item.condicion_pago === filtros.condicion_pago), [condicionesPago, filtros.condicion_pago]);

    function cambiarFiltro(campo, value) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, [campo]: value }));
    }
    function limpiarFiltros() {
        setPagina(1);

        setAnioSel(anioActual);
        setMesSel("sin_filtro");

        setFiltros({
            ...FILTROS_INICIALES,
            agencia: "",
            q: "",
            familia: "",
            condicion_pago: "",
            asesor: "",
            venta_digital: "",
            fecha_desde: "",
            fecha_hasta: "",
        });
    }
    function aplicarAgencia(agencia) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, agencia }));
    }
    function aplicarRangoRapido(id) {
        const rango = obtenerRangoPreset(id);
        setPagina(1);
        setFiltros((prev) => ({ ...prev, ...rango }));
    }
    function aplicarMes(mesIndex) {
        setPagina(1);

        // Si vuelve a presionar el mismo mes, quitar el filtro de fecha
        if (mesSel === mesIndex) {
            setMesSel("sin_filtro");

            setFiltros((prev) => ({
                ...prev,
                fecha_desde: "",
                fecha_hasta: "",
            }));

            return;
        }

        setMesSel(mesIndex);

        // "Todo el año"
        if (mesIndex === null) {
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: `${anioSel}-01-01`,
                fecha_hasta: `${anioSel}-12-31`,
            }));

            return;
        }

        const rango = obtenerRangoMes(mesIndex + 1, anioSel);

        setFiltros((prev) => ({
            ...prev,
            ...rango,
        }));
    }

    function aplicarAnio(anio) {
        const nuevoAnio = Number(anio);

        setAnioSel(nuevoAnio);
        setPagina(1);

        if (mesSel === "sin_filtro") {
            return;
        }

        if (mesSel === null) {
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: `${nuevoAnio}-01-01`,
                fecha_hasta: `${nuevoAnio}-12-31`,
            }));
            return;
        }

        const rango = obtenerRangoMes(mesSel + 1, nuevoAnio);

        setFiltros((prev) => ({
            ...prev,
            ...rango,
        }));
    }
    function actualizarTodo() { cargarDatos(); cargarDashboard(); }

    const chartRefs = useRef({});
    const [exportandoKey, setExportandoKey] = useState(null);

    function alternarFiltro(campo, valor) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, [campo]: prev[campo] === valor ? FILTROS_INICIALES[campo] : valor }));
    }

    function restaurarGrafica(patch) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, ...patch }));
    }

    function esMesActivo(item) {
        const rango = obtenerRangoMes(item?.mes, item?.anio);
        return !!(rango.fecha_desde && filtros.fecha_desde === rango.fecha_desde && filtros.fecha_hasta === rango.fecha_hasta);
    }

    function clicMes(entry) {
        const rango = obtenerRangoMes(entry?.mes, entry?.anio);
        if (!rango.fecha_desde) return;
        setPagina(1);
        setFiltros((prev) => {
            const activo = prev.fecha_desde === rango.fecha_desde && prev.fecha_hasta === rango.fecha_hasta;
            return activo ? { ...prev, fecha_desde: "", fecha_hasta: "" } : { ...prev, ...rango };
        });
    }

    async function exportarGrafica(key, nombre) {
        const nodo = chartRefs.current[key];
        if (!nodo) return;
        setExportandoKey(key);
        try {
            if (document.fonts?.ready) await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            await new Promise((r) => setTimeout(r, 200));
            const canvas = await html2canvas(nodo, { scale: 1.6, useCORS: true, backgroundColor: "#ffffff", logging: false });
            const enlace = document.createElement("a");
            enlace.download = `${nombre}_${new Date().toISOString().slice(0, 10)}.png`;
            enlace.href = canvas.toDataURL("image/png");
            enlace.click();
        } catch (err) {
            console.error("Error exportando gráfica:", err);
        } finally {
            setExportandoKey(null);
        }
    }

    const maxVentasAsesor = Math.max(
        1,
        ...topAsesores.map((item) => numero(item.unidades_vendidas))
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <main className="space-y-4 px-1 py-3 sm:px-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#001E50]">Control de Ventas</h1>
                        <p className="text-xs font-semibold text-slate-500">
                            Autos usados · {filtros.agencia || "Todas las agencias"} · {rangoActual}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-xl border border-[#001E50]/20 bg-white p-1 shadow-sm">
                            <button type="button" onClick={() => setVistaActiva("dashboard")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "dashboard" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"}`}>
                                <BarChart3 className="h-3.5 w-3.5" />Gráficos
                            </button>
                            <button type="button" onClick={() => setVistaActiva("detalle")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "detalle" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"}`}>
                                <Table2 className="h-3.5 w-3.5" />Tabla Detalle
                            </button>
                        </div>
                        <button type="button" onClick={actualizarTodo} disabled={loading || loadingDashboard} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#001E50]/20 bg-white px-3 text-xs font-bold text-[#001E50] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
                            {loading || loadingDashboard ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Actualizar
                        </button>
                    </div>
                </div>

                {/* HERO OSCURO: métricas + concesionarios */}
                <div className="relative overflow-hidden rounded-2xl border border-[#001E50] bg-gradient-to-r from-[#001E50] via-[#0A1340] to-[#050B28] text-white shadow-xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(22,119,255,0.15),transparent_70%)]" />
                    <Car className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 -rotate-12 text-white/[0.04]" />

                    <div className="relative border-b border-white/10 p-5 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">
                                    VOLKSWAGEN AUTOMOTRIZ R&R · VENTAS DE AUTOS USADOS
                                </p>
                                <h2 className="mt-0.5 text-2xl font-black tracking-tight text-white">
                                    Dashboard de Ventas
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                    Margen: <strong className="text-emerald-300">{loadingDashboard ? "…" : `${margen.toFixed(1)}%`}</strong> · {rangoActual}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                            {/* CONSOLIDADO GENERAL: izquierda, abarca 2 filas */}
                            <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm lg:col-span-4 lg:row-span-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black text-[#001E50] shadow">
                                        Consolidado
                                    </span>
                                </div>

                                <div className="py-3 text-center">
                                    <h4 className="mb-0.5 text-[11px] font-black uppercase tracking-widest text-slate-300/80">
                                        Resumen Ejecutivo de Ventas
                                    </h4>
                                    <div className="text-5xl font-black leading-none tracking-tight text-white">
                                        {loadingDashboard
                                            ? "..."
                                            : formatoNumero(dashboard.totales.unidades_vendidas)}
                                    </div>
                                    <div className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-sky-300">
                                        Total Unidades Vendidas
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-white/10 pt-3">
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300/80">
                                            <Database className="h-3 w-3 text-emerald-300" /> Operaciones
                                        </span>
                                        <span className="text-sm font-black text-white">
                                            {loadingDashboard ? "..." : formatoNumero(dashboard.totales.productos)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300/80">
                                            <Globe className="h-3 w-3 text-sky-300" /> Digitales
                                        </span>
                                        <span className="text-sm font-black text-white">
                                            {loadingDashboard ? "..." : formatoNumero(dashboard.totales.ventas_digitales)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300/80">
                                            <TrendingUp className="h-3 w-3 text-emerald-300" /> Margen
                                        </span>
                                        <span className="text-sm font-black text-emerald-300">
                                            {loadingDashboard ? "..." : `${margen.toFixed(1)}%`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* FILA 1 derecha */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
                                <div className="pt-2 lg:px-3 lg:pt-0 lg:first:pl-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        INGRESOS
                                    </span>
                                    <span className="block truncate text-2xl font-black text-white" title={money(dashboard.totales.ingresos)}>
                                        {loadingDashboard ? "…" : money(dashboard.totales.ingresos)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Valor total facturado</p>
                                </div>

                                <div className="pt-2 lg:px-3 lg:pt-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        COSTO
                                    </span>
                                    <span className="block truncate text-2xl font-black text-white" title={money(dashboard.totales.costo)}>
                                        {loadingDashboard ? "…" : money(dashboard.totales.costo)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Costo total</p>
                                </div>
                            </div>

                            {/* FILA 2 derecha */}
                            <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-3 lg:col-span-8">
                                <div className="pt-2 lg:px-3 lg:pt-0 lg:first:pl-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        UTILIDAD ESTIMADA
                                    </span>
                                    <span className="block truncate text-2xl font-black text-emerald-400" title={money(utilidad)}>
                                        {loadingDashboard ? "…" : money(utilidad)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Ingresos − Costo</p>
                                </div>

                                <div className="pt-2 lg:px-3 lg:pt-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        MARGEN
                                    </span>
                                    <span className="block text-2xl font-black text-amber-300">
                                        {loadingDashboard ? "…" : `${margen.toFixed(1)}%`}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Utilidad / Ingresos</p>
                                </div>

                                <div className="pt-2 lg:px-3 lg:pt-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        VENTAS DIGITALES
                                    </span>
                                    <span className="block text-2xl font-black text-sky-300">
                                        {loadingDashboard ? "…" : formatoNumero(dashboard.totales.ventas_digitales)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Venta digital</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/30 px-5 py-2.5 backdrop-blur-md">
                        <span className="mr-2 text-[10px] font-black uppercase tracking-wider text-slate-300">
                            CONCESIONARIOS:
                        </span>
                        {pillsConcesionarios.map((pill) => {
                            const activa = pill.id === "todas"
                                ? !filtros.agencia
                                : filtros.agencia === pill.valor;

                            return (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={() => aplicarAgencia(pill.valor)}
                                    className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${activa
                                        ? "scale-105 bg-white text-[#001E50] shadow-md"
                                        : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                                        }`}
                                >
                                    {pill.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* FILTROS */}
                <div className="space-y-3">
                    {/* FILTROS COMPLEMENTARIOS */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-vw-head font-bold text-white">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Filtros de Autos Usados</span>
                            </div>

                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                disabled={!hayFiltros}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-vw-head font-bold text-[#001E50] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Eraser className="h-3 w-3" />
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">

                            {/* BUSCAR */}
                            <div>
                                <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                    Buscar
                                </label>

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type="text"
                                        value={filtros.q}
                                        onChange={(e) => cambiarFiltro("q", e.target.value)}
                                        placeholder="Serie, cliente, modelo..."
                                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-vw-text text-[#001E50] outline-none transition placeholder:text-slate-300 focus:border-[#1677FF]"
                                    />

                                    {filtros.q ? (
                                        <button
                                            type="button"
                                            onClick={() => cambiarFiltro("q", "")}
                                            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* FAMILIA / MODELO */}
                            <div>
                                <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                    Familia / Modelo
                                </label>

                                <select
                                    value={filtros.familia}
                                    onChange={(e) => cambiarFiltro("familia", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                >
                                    <option value="">Todas las familias</option>
                                    {dashboard.opciones.familias.map((familia) => (
                                        <option key={familia} value={familia}>
                                            {familia}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* CONDICIÓN DE PAGO */}
                            <div>
                                <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                    Condición de Pago
                                </label>

                                <select
                                    value={filtros.condicion_pago}
                                    onChange={(e) => cambiarFiltro("condicion_pago", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                >
                                    <option value="">Todas las condiciones</option>
                                    {dashboard.opciones.condiciones_pago.map((condicion) => (
                                        <option key={condicion} value={condicion}>
                                            {condicion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ASESOR */}
                            <div>
                                <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                    Asesor
                                </label>

                                <select
                                    value={filtros.asesor}
                                    onChange={(e) => cambiarFiltro("asesor", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                >
                                    <option value="">Todos los asesores</option>
                                    {dashboard.opciones.asesores.map((asesor) => (
                                        <option key={asesor} value={asesor}>
                                            {asesor}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* TIPO DE VENTA */}
                            <div>
                                <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                    Tipo de Venta
                                </label>

                                <select
                                    value={filtros.venta_digital}
                                    onChange={(e) => cambiarFiltro("venta_digital", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                >
                                    <option value="">Todas las ventas</option>
                                    <option value="1">Venta digital</option>
                                </select>
                            </div>
                        </div>

                        {(filtros.asesor ||
                            filtros.familia ||
                            filtros.condicion_pago ||
                            filtros.venta_digital) && (
                                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-2">
                                    <span className="mr-1 text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                        Aplicados:
                                    </span>

                                    {filtros.asesor && (
                                        <span className="rounded-full bg-[#001E50]/[0.07] px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#001E50]">
                                            {filtros.asesor}
                                        </span>
                                    )}

                                    {filtros.familia && (
                                        <span className="rounded-full bg-[#001E50]/[0.07] px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#001E50]">
                                            {filtros.familia}
                                        </span>
                                    )}

                                    {filtros.condicion_pago && (
                                        <span className="rounded-full bg-[#001E50]/[0.07] px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#001E50]">
                                            {filtros.condicion_pago}
                                        </span>
                                    )}

                                    {filtros.venta_digital === "1" && (
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#1677FF]">
                                            Venta digital
                                        </span>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* AÑO + MESES */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-center gap-3">
                        <div className="relative inline-block shrink-0">
                            <select
                                value={anioSel}
                                onChange={(e) => aplicarAnio(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer"
                            >
                                {anios.map((anio) => (
                                    <option key={anio} value={anio}>
                                        {anio}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto w-full pb-1 scrollbar-thin">

                            {/* TODO EL AÑO */}
                            <button
                                type="button"
                                onClick={() => aplicarMes(null)}
                                className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${mesSel === null
                                    ? "bg-[#001E50] text-white font-vw-head font-bold"
                                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
                                    }`}
                            >
                                {mesSel === null ? (
                                    <Check className="h-3 w-3 text-white" />
                                ) : (
                                    <Plus className="h-3 w-3 text-slate-400" />
                                )}

                                <span>Todo el año</span>
                            </button>

                            {/* MESES */}
                            {MESES.map((mes, index) => {
                                const futuro =
                                    anioSel === anioActual && index > mesActual;

                                const activo = mesSel === index;

                                return (
                                    <button
                                        key={mes}
                                        type="button"
                                        disabled={futuro}
                                        onClick={() => aplicarMes(index)}
                                        className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition-all ${activo
                                            ? "bg-[#001E50] text-white font-vw-head font-bold"
                                            : futuro
                                                ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold"
                                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
                                            }`}
                                    >
                                        {activo ? (
                                            <Check className="h-3 w-3 text-white" />
                                        ) : (
                                            <Plus className="h-3 w-3 text-slate-400" />
                                        )}

                                        <span>{mes.toLowerCase()}</span>
                                    </button>
                                );
                            })}

                        </div>

                        <button
                            type="button"
                            onClick={actualizarTodo}
                            disabled={loading || loadingDashboard}
                            title="Recargar"
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-[#001E50] transition shrink-0"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading || loadingDashboard ? "animate-spin" : ""
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* DESGLOSE POR ASESOR */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <section className="lg:col-span-12 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                                <Users className="h-3.5 w-3.5 text-white shrink-0" />
                                <span>Desglose por Asesor Comercial</span>
                            </div>

                            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-vw-head font-bold text-[#001E50] shadow-sm">
                                Top {topAsesores.length} asesores
                            </div>
                        </div>

                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {loadingDashboard ? (
                                <div className="flex h-[180px] items-center justify-center">
                                    <LoaderCircle className="h-5 w-5 animate-spin text-[#001E50]" />
                                </div>
                            ) : topAsesores.length === 0 ? (
                                <div className="flex h-[180px] items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                                    Sin datos de asesores en el periodo seleccionado
                                </div>
                            ) : (
                                topAsesores.map((item, idx) => {
                                    const pctWidth =
                                        (numero(item.unidades_vendidas) / maxVentasAsesor) * 100;

                                    const activo = filtros.asesor === item.asesor;

                                    return (
                                        <button
                                            key={`${item.asesor}-${idx}`}
                                            type="button"
                                            onClick={() => alternarFiltro("asesor", item.asesor)}
                                            className={`w-full rounded-xl border overflow-hidden transition-all duration-150 text-left ${activo
                                                ? "border-[#1677FF] bg-blue-50"
                                                : "border-slate-200/80 bg-white hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-2.5 w-52 min-w-0 shrink-0">
                                                    <div
                                                        className={`h-6 w-6 rounded-md flex items-center justify-center font-vw-head font-bold text-[10px] shrink-0 ${idx === 0
                                                            ? "bg-[#001E50] text-white"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        VW{idx + 1}
                                                    </div>

                                                    <span
                                                        className="font-vw-head font-bold text-[#001E50] text-xs truncate"
                                                        title={item.asesor || "Sin asesor"}
                                                    >
                                                        {item.asesor || "Sin asesor"}
                                                    </span>
                                                </div>

                                                <div className="text-[11px] text-slate-700 font-vw-head font-bold shrink-0 min-w-[90px]">
                                                    {formatoNumero(item.unidades_vendidas)} unidades
                                                </div>

                                                <div className="flex-1 mx-2">
                                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-[#001E50] h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    Math.max(4, pctWidth)
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-[10px] font-vw-head font-bold text-[#1677FF] shrink-0">
                                                    {money(item.ingresos)}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                    Ingresos
                                </div>
                                <div
                                    className="mt-0.5 truncate text-xs font-vw-head font-bold text-[#001E50]"
                                    title={money(dashboard.totales.ingresos)}
                                >
                                    {loadingDashboard ? "..." : money(dashboard.totales.ingresos)}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                    Costo
                                </div>
                                <div
                                    className="mt-0.5 truncate text-xs font-vw-head font-bold text-[#001E50]"
                                    title={money(dashboard.totales.costo)}
                                >
                                    {loadingDashboard ? "..." : money(dashboard.totales.costo)}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                    Utilidad estimada
                                </div>
                                <div
                                    className={`mt-0.5 truncate text-xs font-vw-head font-bold ${utilidad >= 0 ? "text-emerald-700" : "text-red-600"
                                        }`}
                                    title={money(utilidad)}
                                >
                                    {loadingDashboard ? "..." : money(utilidad)}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {errorDashboard && <ErrorBox>{errorDashboard}</ErrorBox>}
                {error && <ErrorBox>{error}</ErrorBox>}

                {vistaActiva === "dashboard" && (
                    <div className="grid gap-4 xl:grid-cols-12">
                        <div className="xl:col-span-7">
                            <ChartCard title="Tendencia comercial" subtitle="Ingresos, costo y unidades vendidas por mes" icon={TrendingUp} badge={rangoActual}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.fecha_desde && <GraficoRestaurar onClick={() => restaurarGrafica({ fecha_desde: "", fecha_hasta: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("tendencia", "tendencia_comercial")} busy={exportandoKey === "tendencia"} />
                                    </div>
                                }>
                                <div className="h-[360px]" ref={(n) => { chartRefs.current["tendencia"] = n; }}>
                                    {loadingDashboard ? <ChartLoading /> : datosMes.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={datosMes} margin={{ top: 12, right: 12, bottom: 6, left: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                                                <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis yAxisId="money" tickFormatter={formatoCompacto} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={65} />
                                                <YAxis yAxisId="units" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={35} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: C.text, fontWeight: 700 }} formatter={(value, name) => [name === "Unidades" ? `${formatoNumero(value)} unidades` : money(value), name]} />
                                                <Bar yAxisId="units" dataKey="unidades_vendidas" name="Unidades" radius={[6, 6, 0, 0]} barSize={22} className="cursor-pointer" onClick={(entry) => clicMes(entry)}>
                                                    {datosMes.map((item, i) => {
                                                        const activo = esMesActivo(item);
                                                        return <Cell key={i} fill={activo ? C.navy : "#DDE4F6"} />;
                                                    })}
                                                </Bar>
                                                <Line yAxisId="money" type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.navy} strokeWidth={3} dot={{ r: 3, fill: C.navy }} activeDot={{ r: 5 }} />
                                                <Line yAxisId="money" type="monotone" dataKey="costo" name="Costo" stroke={C.navyLight} strokeWidth={2.5} dot={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                <ChartLegend items={[{ color: C.navy, label: "Ingresos" }, { color: C.navyLight, label: "Costo" }, { color: "#DDE4F6", label: "Unidades" }]} />
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-5">
                            <ChartCard title="Condición de pago" subtitle="Distribución de unidades vendidas" icon={WalletCards}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.condicion_pago && <GraficoRestaurar onClick={() => restaurarGrafica({ condicion_pago: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("condicion", "condicion_pago")} busy={exportandoKey === "condicion"} />
                                    </div>
                                }>
                                <div className="grid min-h-[390px] items-center gap-3 md:grid-cols-[1fr_220px] xl:grid-cols-1 2xl:grid-cols-[1fr_220px]" ref={(n) => { chartRefs.current["condicion"] = n; }}>
                                    <div className="relative h-[280px]">
                                        {loadingDashboard ? <ChartLoading /> : condicionesPago.length === 0 ? <ChartEmpty /> : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={condicionesPago} dataKey="unidades_vendidas" nameKey="condicion_pago" cx="50%" cy="50%" innerRadius={72} outerRadius={105} paddingAngle={2} className="cursor-pointer" activeIndex={idxCondicionActivo >= 0 ? idxCondicionActivo : undefined} activeShape={<SectorResaltado />} onClick={(data) => alternarFiltro("condicion_pago", data ? data?.condicion_pago : "")}>
                                                            {condicionesPago.map((item, index) => {
                                                                return <Cell key={`${item.condicion_pago}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />;
                                                            })}
                                                        </Pie>
                                                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${formatoNumero(value)} unidades`, name]} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                                    <p className="text-2xl font-extrabold text-[#131E5C]">{formatoNumero(totalCondicionesPago)}</p>
                                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Unidades</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {!loadingDashboard && condicionesPago.length > 0 && (
                                        <div className="space-y-2">
                                            {condicionesPago.map((item, index) => (
                                                <button key={`${item.condicion_pago}-${index}`} type="button" onClick={() => alternarFiltro("condicion_pago", item.condicion_pago)}
                                                    className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition", filtros.condicion_pago === item.condicion_pago ? "bg-[#131E5C]/[0.08]" : "hover:bg-[#F7F8FC]")}>
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#515778]" title={item.condicion_pago}>{item.condicion_pago || "Sin condición"}</span>
                                                    <span className="text-[11px] font-bold text-[#1A1F3C]">{porcentaje(item.unidades_vendidas, totalCondicionesPago)}%</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Rendimiento por asesor" subtitle="Top 10 por unidades vendidas" icon={BarChart3}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.asesor && <GraficoRestaurar onClick={() => restaurarGrafica({ asesor: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("asesores", "rendimiento_asesores")} busy={exportandoKey === "asesores"} />
                                    </div>
                                }>
                                <div className="h-[390px]" ref={(n) => { chartRefs.current["asesores"] = n; }}>
                                    {loadingDashboard ? <ChartLoading /> : topAsesores.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topAsesores} layout="vertical" margin={{ top: 4, right: 38, left: 18, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="asesor" width={145} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                                                <Bar dataKey="unidades_vendidas" name="Unidades vendidas" fill={C.navy} radius={[0, 7, 7, 0]} barSize={20} className="cursor-pointer" onClick={(entry) => alternarFiltro("asesor", entry ? entry?.asesor : "")}>
                                                    {topAsesores.map((item, i) => {
                                                        return <Cell key={i} fill={C.navy} />;
                                                    })}
                                                    <LabelList dataKey="unidades_vendidas" position="right" fill={C.textSub} fontSize={10} fontWeight={700} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Modelos con mayor movimiento" subtitle="Top 10 familias por unidades vendidas" icon={Car}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.familia && <GraficoRestaurar onClick={() => restaurarGrafica({ familia: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("familias", "modelos_mayor_movimiento")} busy={exportandoKey === "familias"} />
                                    </div>
                                }>
                                <div className="h-[390px]" ref={(n) => { chartRefs.current["familias"] = n; }}>
                                    {loadingDashboard ? <ChartLoading /> : topFamilias.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topFamilias} layout="vertical" margin={{ top: 4, right: 38, left: 22, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="familia" width={150} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                                                <Bar dataKey="unidades_vendidas" name="Unidades vendidas" fill={C.navyMid} radius={[0, 7, 7, 0]} barSize={20} className="cursor-pointer" onClick={(entry) => alternarFiltro("familia", entry ? entry?.familia : "")}>
                                                    {topFamilias.map((item, i) => {
                                                        return <Cell key={i} fill={C.navyMid} />;
                                                    })}
                                                    <LabelList dataKey="unidades_vendidas" position="right" fill={C.textSub} fontSize={10} fontWeight={700} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {vistaActiva === "detalle" && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-extrabold text-[#001E50]">Detalle Individual de Ventas (Autos Usados)</h3>
                        <InteractiveTable
                            rows={registros}
                            columns={COLUMNAS}
                            storageKey="autos_nuevos"
                            total={total}
                            loading={loading}
                            pageSize={pageSize}
                            onPageSizeChange={(size) => { setPagina(1); setPageSize(size); }}
                            page={pagina}
                            totalPages={totalPaginas}
                            onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
                            onNext={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

function KPICard({ icon, label, value, sub, accent, spark = [] }) {
    const Icon = icon;
    const sparkData = spark.map((v, i) => ({ i, v: numero(v) }));
    const pct = sparkData.length > 1
        ? (sparkData[sparkData.length - 1].v - sparkData[0].v) / Math.max(Math.abs(sparkData[0].v), 1)
        : 0;
    const tendencia = sparkData.length > 1 ? (pct >= 0 ? "up" : "down") : null;

    return (
        <div className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md" style={{ borderColor: "#E7EAF3" }}>
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.12]" style={{ backgroundColor: accent }} />
            <div className="relative flex items-start justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}1A`, color: accent }}>
                            <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="truncate text-xs font-bold uppercase tracking-wide text-[#8891AD]">{label}</span>
                    </div>
                    <div className="mt-3 truncate text-[26px] font-black leading-none tracking-tight text-[#131E5C]" title={String(value)}>{value}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {sub && <span className="truncate text-[11px] font-semibold" style={{ color: accent }}>{sub}</span>}
                        {tendencia && (
                            <span className={cn(`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tendencia === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`)}>
                                {tendencia === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(pct * 100).toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative mt-3 border-t border-black/[0.06] pt-2">
                {sparkData.length === 0 ? (
                    <div className="flex h-12 items-center text-[11px] font-semibold text-slate-300">Sin datos</div>
                ) : (
                    <div className="h-12">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sparkData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                                <Bar dataKey="v" fill={accent} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButtonGroup({ label, value, options, onChange }) {
    return (
        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
            <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">{label}</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
                {options.map((option) => {
                    const active = value === option;
                    const todos = option === "Todos";
                    return (
                        <button key={option} type="button" onClick={() => onChange(option)} className={`inline-flex h-9 min-w-[90px] flex-1 items-center justify-center rounded-full px-3 text-xs font-bold transition active:scale-[0.97] ${todos ? (active ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600") : (active ? "bg-[#131E5C] text-white shadow-md shadow-[#131E5C]/20" : "bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10")}`}>
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function FilterField({ label, hint, icon: Icon = null, children }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 text-[#131E5C]/60" />}
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</label>
                {hint && <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 text-[9px] font-semibold text-[#8891AD]">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function ChartCard({ title, subtitle, icon: Icon, badge, action, children }) {
    return (
        <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span>{title}</span>
                    </div>
                    {subtitle && <p className="mt-1.5 text-[11px] font-medium text-slate-500">{subtitle}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {badge && <Badge>{badge}</Badge>}
                    {action}
                </div>
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

function GraficoExportar({ onClick, busy }) {
    return (
        <button type="button" onClick={onClick} disabled={busy} title="Descargar gráfica como imagen"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-[11px] font-bold text-[#131E5C] transition hover:bg-[#131E5C]/5 disabled:cursor-not-allowed disabled:opacity-50">
            <ImageDown className="h-3.5 w-3.5" />{busy ? "Generando…" : "PNG"}
        </button>
    );
}

function GraficoRestaurar({ onClick }) {
    return (
        <button type="button" onClick={onClick} title="Restaurar / quitar el filtro de esta gráfica"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-[11px] font-bold text-[#131E5C] transition hover:bg-[#131E5C]/5">
            <RotateCcw className="h-3.5 w-3.5" />Restaurar
        </button>
    );
}

function SectorResaltado(props) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 7}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={4}
            stroke="#FFFFFF"
            strokeWidth={2}
        />
    );
}

function ChartLegend({ items }) {
    return (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-4">
            {items.map((item) => <div key={item.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[10px] font-semibold text-[#8891AD]">{item.label}</span></div>)}
        </div>
    );
}

function Badge({ children }) {
    return <span className="inline-flex items-center rounded-full bg-[#131E5C]/[0.08] px-2.5 py-1 text-[10px] font-bold text-[#131E5C]">{children}</span>;
}

function ErrorBox({ children }) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{children}</div>;
}

function ChartLoading() {
    return <div className="flex h-full items-center justify-center"><div className="flex items-center gap-2 text-sm font-medium text-[#8891AD]"><LoaderCircle className="h-4 w-4 animate-spin" />Cargando información...</div></div>;
}

function ChartEmpty() {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <Database className="h-7 w-7 text-[#C8CEDF]" />
            <p className="mt-2 text-sm font-semibold text-[#515778]">Sin información</p>
            <p className="mt-1 text-xs text-[#8891AD]">No existen datos para los filtros seleccionados.</p>
        </div>
    );
}
