import { useEffect, useMemo, useRef, useState } from "react";
import {
    BarChart3, Boxes, CalendarDays, CircleDollarSign, Clock3, Database, Eraser,
    Layers3, LoaderCircle, MapPin, PackageSearch, RefreshCw, Search,
    SlidersHorizontal, Table2, Tags, X,
} from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {
    getOpcionesRefaccionesObsolescencia,
    getRefaccionesObsolescencia,
    getRefaccionesObsolescenciaDashboard,
} from "../../lib/apiRefaccionesObsolescencia";
import InteractiveTable from "./InteractiveTable";

const C = { navy: "#131E5C", navyMid: "#4D96FF", navyLight: "#4D96FF", border: "#E4E7F0", muted: "#8891AD", textSub: "#515778" };
const PIE_COLORS = ["#131E5C", "#4D96FF", "#7FB4E0", "#6681D4", "#8B9DDE", "#AEB9E8", "#42526E", "#7A869A"];
const TOOLTIP_STYLE = { border: "1px solid #E4E7F0", borderRadius: 12, boxShadow: "0 12px 30px rgba(19,30,92,.12)", fontSize: 14 };

const COLUMNAS = [
    { key: "agencia", label: "Agencia" },
    { key: "qt_inventario", label: "Qt. Inventario", tipo: "numero" },
    { key: "cod_linha_prod", label: "Línea Producto" },
    { key: "localizacao", label: "Localización" },
    { key: "cod_produto", label: "Código Producto" },
    { key: "nm_produto", label: "Producto" },
    { key: "unidade", label: "Unidad" },
    { key: "qtde_estoque", label: "Existencia", tipo: "numero" },
    { key: "vr_estoque", label: "Valor Inventario", tipo: "moneda" },
    { key: "vr_unitario_medio", label: "Valor Unitario Medio", tipo: "moneda4" },
    { key: "qt_reservada", label: "Reservada", tipo: "numero" },
    { key: "qt_pedida", label: "Pendiente", tipo: "numero" },
    { key: "grupo_principal", label: "Grupo Principal" },
    { key: "subgrupo", label: "Subgrupo" },
    { key: "nombre_estandarizado", label: "Nombre Estandarizado" },
    { key: "categoria", label: "Categoría" },
    { key: "observacion", label: "Observación" },
    { key: "fecha_ultima_venta", label: "Última Venta", tipo: "fecha" },
    { key: "fecha_ult_comp_prod", label: "Última Compra", tipo: "fecha" },
    { key: "fecha_ult_ped_prod", label: "Último Pedido", tipo: "fecha" },
    { key: "fecha_ult_actu_prod", label: "Última Act. Producto", tipo: "fecha" },
    { key: "fecha_regis_refac", label: "Registro Refacción", tipo: "fecha" },
    { key: "fecha_inventario_refac", label: "Inventario Refacción", tipo: "fecha" },
    { key: "fecha_primera_compra_refac", label: "Primera Compra", tipo: "fecha" },
    { key: "fecha_actualizacion_refac", label: "Actualización Refacción", tipo: "fecha" },
    { key: "vr_uni_ult_cpa", label: "Valor Última Compra", tipo: "moneda4" },
    { key: "fecha_referencia", label: "Fecha Referencia", tipo: "fecha" },
    { key: "dias_desde_ultimo_movimiento", label: "Días sin Movimiento", tipo: "entero" },
    { key: "capa_obsolescencia", label: "Capa Obsolescencia" },
    { key: "categoria_movimiento", label: "Categoría Movimiento" },
];

const FILTROS_INICIALES = {
    q: "", agencia: "", grupo_principal: "", categoria: "", capa_obsolescencia: "",
    categoria_movimiento: "", reservadas: "", pendientes: "",
    fecha_desde: "", fecha_hasta: "", dias_min: "", dias_max: "",
};

const OPCIONES_INICIALES = { agencias: [], grupos_principales: [], categorias: [], capas_obsolescencia: [], categorias_movimiento: [] };

const DASHBOARD_INICIAL = {
    totales: {
        registros: 0,
        productos: 0,
        qt_inventario: 0,
        existencia: 0,
        reservada: 0,
        pedida: 0,
        disponible: 0,
        valor_inventario: 0,
        valor_stock: 0,
        valor_reservado: 0,
        valor_disponible: 0,
        valor_pendiente: 0,
        valor_obsoleto: 0,
        porcentaje_obsolescencia: 0,
        relacion_reservada_pedida: 0,
        promedio_dias_movimiento: 0,
    },
    graficas: {
        por_capa: [],
        por_categoria_movimiento: [],
        por_agencia: [],
        por_grupo: [],
        por_categoria: [],
        por_antiguedad: [],
    },
};

const inputClass = "h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10 disabled:cursor-wait disabled:bg-[#F7F8FC] disabled:text-[#AAB1C7]";

function cn(...parts) { return parts.filter(Boolean).join(" "); }
function numero(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function formatoNumero(value, decimales = 0) { return numero(value).toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales }); }
function formatoCompacto(value) { return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numero(value)); }
function money(value) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numero(value)); }

function convertirGrafica(items) {
    return (items || []).map((item) => ({
        ...item,
        productos: numero(item.productos),
        existencia: numero(item.existencia),
        reservada: numero(item.reservada),
        pedida: numero(item.pedida),
        disponible: numero(item.disponible),
        valor_inventario: numero(item.valor_inventario),
        valor_stock: numero(item.valor_stock),
        valor_disponible: numero(item.valor_disponible),
        valor_reservado: numero(item.valor_reservado),
        valor_pendiente: numero(item.valor_pendiente),
    }));
}

export default function RefaccionesObsolescencia() {
    const [registros, setRegistros] = useState([]);
    const [total, setTotal] = useState(0);
    const [dashboard, setDashboard] = useState(DASHBOARD_INICIAL);
    const [opciones, setOpciones] = useState(OPCIONES_INICIALES);
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [qBuscado, setQBuscado] = useState("");
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [vistaActiva, setVistaActiva] = useState("detalle");
    const [loading, setLoading] = useState(false);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingOpciones, setLoadingOpciones] = useState(false);
    const [error, setError] = useState("");
    const [errorDashboard, setErrorDashboard] = useState("");
    const requestDatosRef = useRef(0);
    const requestDashboardRef = useRef(0);

    useEffect(() => {
        const timeout = setTimeout(() => setQBuscado(filtros.q), 400);
        return () => clearTimeout(timeout);
    }, [filtros.q]);

    function parametrosFiltros() {
        return {
            q: qBuscado,
            agencia: filtros.agencia,
            grupo_principal: filtros.grupo_principal,
            categoria: filtros.categoria,
            capa_obsolescencia: filtros.capa_obsolescencia,
            categoria_movimiento: filtros.categoria_movimiento,
            reservadas: filtros.reservadas,
            pendientes: filtros.pendientes,
            fecha_desde: filtros.fecha_desde,
            fecha_hasta: filtros.fecha_hasta,
            dias_min: filtros.dias_min,
            dias_max: filtros.dias_max,
        };
    }

    async function cargarOpciones() {
        setLoadingOpciones(true);
        try {
            const response = await getOpcionesRefaccionesObsolescencia();
            setOpciones({
                agencias: response?.agencias || [],
                grupos_principales: response?.grupos_principales || [],
                categorias: response?.categorias || [],
                capas_obsolescencia: response?.capas_obsolescencia || [],
                categorias_movimiento: response?.categorias_movimiento || [],
            });
        } catch (err) {
            console.error("Error cargando opciones:", err);
        } finally {
            setLoadingOpciones(false);
        }
    }

    async function cargarDatos() {
        const requestId = ++requestDatosRef.current;
        setLoading(true);
        setError("");

        try {
            const response = await getRefaccionesObsolescencia({ ...parametrosFiltros(), page: pagina, page_size: pageSize });
            if (requestId !== requestDatosRef.current) return;

            setRegistros(Array.isArray(response?.results) ? response.results : []);
            setTotal(Number(response?.count || 0));
        } catch (err) {
            if (requestId !== requestDatosRef.current) return;
            console.error("Error cargando refacciones:", err);
            setRegistros([]);
            setTotal(0);
            setError(err?.message || "No fue posible cargar las refacciones.");
        } finally {
            if (requestId === requestDatosRef.current) setLoading(false);
        }
    }

    async function cargarDashboard() {
        const requestId = ++requestDashboardRef.current;
        setLoadingDashboard(true);
        setErrorDashboard("");

        try {
            const response = await getRefaccionesObsolescenciaDashboard(parametrosFiltros());

            if (requestId !== requestDashboardRef.current) return;

            setDashboard({
                totales: {
                    registros: numero(response?.totales?.registros),
                    productos: numero(response?.totales?.productos),
                    qt_inventario: numero(response?.totales?.qt_inventario),
                    existencia: numero(response?.totales?.existencia),
                    reservada: numero(response?.totales?.reservada),
                    pedida: numero(response?.totales?.pedida),
                    disponible: numero(response?.totales?.disponible),

                    valor_inventario: numero(response?.totales?.valor_inventario),
                    valor_stock: numero(response?.totales?.valor_stock),
                    valor_reservado: numero(response?.totales?.valor_reservado),
                    valor_disponible: numero(response?.totales?.valor_disponible),
                    valor_pendiente: numero(response?.totales?.valor_pendiente),

                    valor_obsoleto: numero(response?.totales?.valor_obsoleto),
                    porcentaje_obsolescencia: numero(response?.totales?.porcentaje_obsolescencia),
                    relacion_reservada_pedida: numero(response?.totales?.relacion_reservada_pedida),
                    promedio_dias_movimiento: numero(response?.totales?.promedio_dias_movimiento),
                },
                graficas: {
                    por_capa: response?.graficas?.por_capa || [],
                    por_categoria_movimiento: response?.graficas?.por_categoria_movimiento || [],
                    por_agencia: response?.graficas?.por_agencia || [],
                    por_grupo: response?.graficas?.por_grupo || [],
                    por_categoria: response?.graficas?.por_categoria || [],
                    por_antiguedad: response?.graficas?.por_antiguedad || [],
                },
            });
        } catch (err) {
            if (requestId !== requestDashboardRef.current) return;

            console.error("Error cargando dashboard:", err);
            setDashboard(DASHBOARD_INICIAL);
            setErrorDashboard(err?.message || "No fue posible cargar los gráficos.");
        } finally {
            if (requestId === requestDashboardRef.current) setLoadingDashboard(false);
        }
    }

    useEffect(() => { cargarOpciones(); }, []);

    useEffect(() => {
        cargarDatos();
    }, [
        pagina, pageSize, qBuscado, filtros.agencia, filtros.grupo_principal, filtros.categoria,
        filtros.capa_obsolescencia, filtros.categoria_movimiento, filtros.reservadas,
        filtros.pendientes, filtros.fecha_desde, filtros.fecha_hasta, filtros.dias_min, filtros.dias_max,
    ]);

    useEffect(() => {
        cargarDashboard();
    }, [
        qBuscado, filtros.agencia, filtros.grupo_principal, filtros.categoria,
        filtros.capa_obsolescencia, filtros.categoria_movimiento, filtros.reservadas,
        filtros.pendientes, filtros.fecha_desde, filtros.fecha_hasta, filtros.dias_min, filtros.dias_max,
    ]);

    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const hayFiltros = useMemo(() => Object.values(filtros).some((value) => String(value ?? "").trim() !== ""), [filtros]);
    const porCapa = useMemo(() => convertirGrafica(dashboard.graficas.por_capa), [dashboard.graficas.por_capa]);
    const porMovimiento = useMemo(() => convertirGrafica(dashboard.graficas.por_categoria_movimiento), [dashboard.graficas.por_categoria_movimiento]);
    const porAgencia = useMemo(() => convertirGrafica(dashboard.graficas.por_agencia), [dashboard.graficas.por_agencia]);
    const porGrupo = useMemo(() => convertirGrafica(dashboard.graficas.por_grupo), [dashboard.graficas.por_grupo]);
    const porAntiguedad = useMemo(() => convertirGrafica(dashboard.graficas.por_antiguedad), [dashboard.graficas.por_antiguedad]);
    const totalValorCapas = useMemo(
        () => porCapa.reduce((acc, item) => acc + item.valor_inventario, 0),
        [porCapa]
    );
    const cargandoGeneral = loading || loadingDashboard || loadingOpciones;

    function cambiarFiltro(campo, value) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, [campo]: value }));
    }

    function alternarFiltro(campo, value) {
        if (!value || String(value).startsWith("Sin ")) return;
        setPagina(1);
        setFiltros((prev) => ({ ...prev, [campo]: prev[campo] === value ? "" : value }));
    }

    function limpiarFiltros() {
        setPagina(1);
        setFiltros(FILTROS_INICIALES);
    }

    function actualizarTodo() {
        cargarDatos();
        cargarDashboard();
        cargarOpciones();
    }

    function aplicarRangoAntiguedad(rango) {
        const rangos = {
            "0-90 días": { dias_min: "0", dias_max: "90" },
            "91-180 días": { dias_min: "91", dias_max: "180" },
            "181-365 días": { dias_min: "181", dias_max: "365" },
            "366-730 días": { dias_min: "366", dias_max: "730" },
            "Más de 730 días": { dias_min: "731", dias_max: "" },
        };

        const valores = rangos[rango];
        if (!valores) return;

        setPagina(1);
        setFiltros((prev) => {
            const activo = String(prev.dias_min) === valores.dias_min && String(prev.dias_max) === valores.dias_max;
            return activo ? { ...prev, dias_min: "", dias_max: "" } : { ...prev, ...valores };
        });
    }

    return (
        <div className="min-h-screen">
            <main className="space-y-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-[#131E5C]">Obsolescencia de Refacciones</h1>
                        <p className="mt-1 text-xs font-medium text-[#8891AD]">Inventario, antigüedad y movimiento de refacciones</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-xl border border-[#131E5C]/20 bg-white p-1 shadow-sm">
                            <button type="button" onClick={() => setVistaActiva("detalle")} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition", vistaActiva === "detalle" ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100")}>
                                <Table2 className="h-4 w-4" />Tabla
                            </button>

                            <button type="button" onClick={() => setVistaActiva("dashboard")} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition", vistaActiva === "dashboard" ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100")}>
                                <BarChart3 className="h-4 w-4" />Gráficos
                            </button>
                        </div>

                        <button type="button" onClick={actualizarTodo} disabled={cargandoGeneral} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60">
                            {cargandoGeneral ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {cargandoGeneral ? "Cargando..." : "Actualizar"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <KPICard
                        loading={loadingDashboard}
                        icon={CircleDollarSign}
                        label="Valor Total Inventario"
                        value={money(dashboard.totales.valor_inventario)}
                    />

                    <KPICard
                        loading={loadingDashboard}
                        icon={CircleDollarSign}
                        label="Valor Obsoleto"
                        value={money(dashboard.totales.valor_obsoleto)}
                    />

                    <KPICard
                        loading={loadingDashboard}
                        icon={Clock3}
                        label="% Obsolescencia"
                        value={`${formatoNumero(dashboard.totales.porcentaje_obsolescencia, 2)}%`}
                        sub="Valor obsoleto / inventario"
                    />
                    <KPICard
                        loading={loadingDashboard}
                        icon={Boxes}
                        label="Inventario Disponibles"
                        value={formatoNumero(dashboard.totales.disponible, 2)}
                        sub="Existencia - reservadas"
                    />

                    <KPICard
                        loading={loadingDashboard}
                        icon={Boxes}
                        label="Reservadas / Pendientes"
                        value={`${money(dashboard.totales.valor_reservado)} / ${money(dashboard.totales.valor_pendiente)}`}
                    />

                    <KPICard
                        loading={loadingDashboard}
                        icon={CircleDollarSign}
                        label="Valor Disponible"
                        value={money(dashboard.totales.valor_disponible)}
                        sub={`Reservado: ${money(dashboard.totales.valor_reservado)}`}
                    />
                </div>

                <section className="relative overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
                    {cargandoGeneral && <div className="absolute inset-x-0 top-0 z-20 h-1 overflow-hidden bg-[#131E5C]/10"><div className="h-full w-full animate-pulse bg-[#131E5C]" /></div>}

                    <div className="flex items-center justify-between gap-3 border-b border-[#E4E7F0] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]">
                                {cargandoGeneral ? <LoaderCircle className="h-[18px] w-[18px] animate-spin text-[#131E5C]" /> : <SlidersHorizontal className="h-[18px] w-[18px] text-[#131E5C]" />}
                            </span>

                            <div>
                                <h2 className="text-sm font-black tracking-wide text-[#1A1F3C]">Filtros</h2>
                                <p className="text-[11px] font-medium text-[#8891AD]">{cargandoGeneral ? "Actualizando resultados..." : "Se aplican a tabla, KPIs y gráficos"}</p>
                            </div>
                        </div>

                        <button type="button" onClick={limpiarFiltros} disabled={!hayFiltros} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E4E7F0] bg-white px-3 text-[11px] font-bold text-[#131E5C] transition hover:bg-[#131E5C]/5 disabled:cursor-not-allowed disabled:opacity-40">
                            <Eraser className="h-3.5 w-3.5" />Limpiar
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        <div className="relative">
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Buscar</label>
                            <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />
                            <input type="text" value={filtros.q} onChange={(e) => cambiarFiltro("q", e.target.value)} placeholder="Código, producto, grupo, categoría, ubicación..." className="h-11 w-full rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
                            {filtros.q && <button type="button" onClick={() => cambiarFiltro("q", "")} className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>}
                        </div>

                        <div className="grid gap-3 border-t border-[#E4E7F0] pt-4 md:grid-cols-2 xl:grid-cols-5">
                            <SelectFilter label="Agencia" icon={MapPin} value={filtros.agencia} onChange={(value) => cambiarFiltro("agencia", value)} loading={loadingOpciones}>
                                <option value="">Todas las agencias</option>
                                {opciones.agencias.map((item) => <option key={item} value={item}>{item}</option>)}
                            </SelectFilter>

                            <SelectFilter label="Grupo principal" icon={Layers3} value={filtros.grupo_principal} onChange={(value) => cambiarFiltro("grupo_principal", value)} loading={loadingOpciones}>
                                <option value="">Todos los grupos</option>
                                {opciones.grupos_principales.map((item) => <option key={item} value={item}>{item}</option>)}
                            </SelectFilter>

                            <SelectFilter label="Categoría" icon={Tags} value={filtros.categoria} onChange={(value) => cambiarFiltro("categoria", value)} loading={loadingOpciones}>
                                <option value="">Todas las categorías</option>
                                {opciones.categorias.map((item) => <option key={item} value={item}>{item}</option>)}
                            </SelectFilter>

                            <SelectFilter label="Capa obsolescencia" icon={Clock3} value={filtros.capa_obsolescencia} onChange={(value) => cambiarFiltro("capa_obsolescencia", value)} loading={loadingOpciones}>
                                <option value="">Todas las capas</option>
                                {opciones.capas_obsolescencia.map((item) => <option key={item} value={item}>{item}</option>)}
                            </SelectFilter>

                            <SelectFilter label="Movimiento" icon={Boxes} value={filtros.categoria_movimiento} onChange={(value) => cambiarFiltro("categoria_movimiento", value)} loading={loadingOpciones}>
                                <option value="">Todos los movimientos</option>
                                {opciones.categorias_movimiento.map((item) => <option key={item} value={item}>{item}</option>)}
                            </SelectFilter>
                        </div>

                        <div className="grid gap-3 border-t border-[#E4E7F0] pt-4 md:grid-cols-2 xl:grid-cols-6">
                            <SelectFilter label="Reservadas" icon={Boxes} value={filtros.reservadas} onChange={(value) => cambiarFiltro("reservadas", value)}>
                                <option value="">Todas</option>
                                <option value="con">Con reservadas</option>
                                <option value="sin">Sin reservadas</option>
                            </SelectFilter>

                            <SelectFilter label="Pendientes" icon={Boxes} value={filtros.pendientes} onChange={(value) => cambiarFiltro("pendientes", value)}>
                                <option value="">Todas</option>
                                <option value="con">Con pendientes</option>
                                <option value="sin">Sin pendientes</option>
                            </SelectFilter>

                            <FilterField label="Fecha referencia desde" icon={CalendarDays}>
                                <input type="date" value={filtros.fecha_desde} onChange={(e) => cambiarFiltro("fecha_desde", e.target.value)} className={inputClass} />
                            </FilterField>

                            <FilterField label="Fecha referencia hasta" icon={CalendarDays}>
                                <input type="date" value={filtros.fecha_hasta} onChange={(e) => cambiarFiltro("fecha_hasta", e.target.value)} className={inputClass} />
                            </FilterField>

                            <FilterField label="Días mínimo" icon={Clock3}>
                                <input type="number" min="0" value={filtros.dias_min} onChange={(e) => cambiarFiltro("dias_min", e.target.value)} placeholder="Ej. 180" className={inputClass} />
                            </FilterField>

                            <FilterField label="Días máximo" icon={Clock3}>
                                <input type="number" min="0" value={filtros.dias_max} onChange={(e) => cambiarFiltro("dias_max", e.target.value)} placeholder="Ej. 730" className={inputClass} />
                            </FilterField>
                        </div>
                    </div>
                </section>

                {errorDashboard && <ErrorBox>{errorDashboard}</ErrorBox>}
                {error && <ErrorBox>{error}</ErrorBox>}

                {vistaActiva === "dashboard" && (
                    <div className="grid gap-5 xl:grid-cols-12">
                        <div className="xl:col-span-7">
                            <ChartCard
                                title="Valor disponible y reservado"
                                subtitle="Distribución por capa de obsolescencia"
                                icon={Layers3}
                            >
                                <div className="h-[360px]">
                                    {loadingDashboard ? (
                                        <ChartLoading type="horizontal" />
                                    ) : porCapa.length === 0 ? (
                                        <ChartEmpty />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={porCapa}
                                                layout="vertical"
                                                margin={{ top: 15, right: 30, left: 10, bottom: 10 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    horizontal={false}
                                                    stroke={C.border}
                                                />

                                                <XAxis
                                                    type="number"
                                                    tickFormatter={formatoCompacto}
                                                    tick={{ fontSize: 15, fill: "#000000" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <YAxis
                                                    type="category"
                                                    dataKey="capa_obsolescencia"
                                                    width={80}
                                                    tick={{ fontSize: 15, fill: "#000000" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <Tooltip
                                                    contentStyle={TOOLTIP_STYLE}
                                                    formatter={(value, name) => [
                                                        money(value),
                                                        name === "valor_disponible"
                                                            ? "Valor disponible"
                                                            : "Valor reservado",
                                                    ]}
                                                />

                                                <Legend
                                                    formatter={(value) =>
                                                        value === "valor_disponible"
                                                            ? "Valor Disponible"
                                                            : "Valor Reservado"
                                                    }
                                                />

                                                <Bar
                                                    dataKey="valor_disponible"
                                                    stackId="valor"
                                                    fill={C.navyLight}
                                                    isAnimationActive
                                                    animationDuration={700}
                                                    onClick={(entry) =>
                                                        alternarFiltro(
                                                            "capa_obsolescencia",
                                                            entry?.capa_obsolescencia,
                                                        )
                                                    }
                                                />

                                                <Bar
                                                    dataKey="valor_reservado"
                                                    stackId="valor"
                                                    fill={C.navy}
                                                    radius={[0, 6, 6, 0]}
                                                    isAnimationActive
                                                    animationDuration={700}
                                                    onClick={(entry) =>
                                                        alternarFiltro(
                                                            "capa_obsolescencia",
                                                            entry?.capa_obsolescencia,
                                                        )
                                                    }
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-5">
                            <ChartCard title="Capas de obsolescencia" subtitle="Distribución del valor del inventario" icon={Layers3}>
                                <div className="grid min-h-[380px] items-center md:grid-cols-[1fr_190px] xl:grid-cols-1 2xl:grid-cols-[1fr_190px]">
                                    <div className="relative h-[380px]">
                                        {loadingDashboard ? <ChartLoading type="pie" /> : porCapa.length === 0 ? <ChartEmpty /> : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={porCapa}
                                                            dataKey="valor_inventario"
                                                            nameKey="capa_obsolescencia"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={95}
                                                            outerRadius={150}
                                                            paddingAngle={2}
                                                            className="cursor-pointer"
                                                            isAnimationActive
                                                            animationDuration={800}
                                                            onClick={(entry) =>
                                                                alternarFiltro(
                                                                    "capa_obsolescencia",
                                                                    entry?.capa_obsolescencia,
                                                                )
                                                            }
                                                        >
                                                            {porCapa.map((item, index) => (
                                                                <Cell
                                                                    key={`${item.capa_obsolescencia}-${index}`}
                                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={TOOLTIP_STYLE}
                                                            formatter={(value) => [money(value), "Valor inventario"]}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>

                                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                                    <p className="text-xl font-extrabold text-[#131E5C]">{money(totalValorCapas)}</p>
                                                    <p className="text-[16px] font-semibold uppercase tracking-widest text-[#8891AD]">Inventario</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {loadingDashboard ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3, 4].map((item) => <div key={item} className="h-7 animate-pulse rounded-lg bg-slate-100" />)}
                                        </div>
                                    ) : porCapa.length > 0 && (
                                        <div className="space-y-2">
                                            {porCapa.map((item, index) => (
                                                <button key={`${item.capa_obsolescencia}-${index}`} type="button" onClick={() => alternarFiltro("capa_obsolescencia", item.capa_obsolescencia)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition", filtros.capa_obsolescencia === item.capa_obsolescencia ? "bg-[#131E5C]/[0.08]" : "hover:bg-[#F7F8FC]")}>
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#515778]">{item.capa_obsolescencia}</span>
                                                    <span className="text-[14px] font-bold text-[#1A1F3C]">{formatoNumero(item.productos)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Inventario por agencia" subtitle="Valor económico por dealer" icon={MapPin}>
                                <div className="h-[390px]">
                                    {loadingDashboard ? <ChartLoading type="horizontal" /> : porAgencia.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={porAgencia} layout="vertical" margin={{ top: 4, right: 50, left: 25, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" tickFormatter={formatoCompacto} tick={{ fontSize: 14, fill: "#000000" }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="agencia" width={135} tick={{ fontSize: 14, fill: "#000000" }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                <Bar
                                                    dataKey="valor_inventario"
                                                    fill={C.navy}
                                                    radius={[0, 7, 7, 0]}
                                                    barSize={25}
                                                    className="cursor-pointer"
                                                    isAnimationActive
                                                    animationDuration={700}
                                                    onClick={(entry) =>
                                                        alternarFiltro(
                                                            "agencia",
                                                            entry?.agencia,
                                                        )
                                                    }
                                                >
                                                    <LabelList
                                                        dataKey="productos"
                                                        position="right"
                                                        fill={C.textSub}
                                                        fontSize={14}
                                                        formatter={(value) => `${formatoNumero(value)} ref.`}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Grupos con mayor inventario" subtitle="Top 12 por valor económico" icon={Tags}>
                                <div className="h-[490px]">
                                    {loadingDashboard ? <ChartLoading type="horizontal" /> : porGrupo.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={porGrupo} layout="vertical" margin={{ top: 4, right: 35, left: 35, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" tickFormatter={formatoCompacto} tick={{ fontSize: 14, fill: "#000000" }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="grupo_principal" width={160} tick={{ fontSize: 14, fill: "#000000" }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                <Bar
                                                    dataKey="valor_stock"
                                                    fill={C.navyMid}
                                                    radius={[0, 7, 7, 0]}
                                                    barSize={25}
                                                    className="cursor-pointer"
                                                    isAnimationActive
                                                    animationDuration={700}
                                                    onClick={(entry) =>
                                                        alternarFiltro(
                                                            "grupo_principal",
                                                            entry?.grupo_principal,
                                                        )
                                                    }
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-12">
                            <ChartCard
                                title="Categoría de movimiento"
                                subtitle="Distribución del valor del inventario según movimiento"
                                icon={Boxes}
                            >
                                <div className="h-[360px]">
                                    {loadingDashboard ? (
                                        <ChartLoading type="vertical" />
                                    ) : porMovimiento.length === 0 ? (
                                        <ChartEmpty />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={porMovimiento}
                                                margin={{ top: 20, right: 20, left: 15, bottom: 20 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke={C.border}
                                                />

                                                <XAxis
                                                    dataKey="categoria_movimiento"
                                                    tick={{
                                                        fontSize: 14,
                                                        fill: "#000000",
                                                    }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <YAxis
                                                    tickFormatter={formatoCompacto}
                                                    tick={{
                                                        fontSize: 14,
                                                        fill: "#000000",
                                                    }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={65}
                                                />

                                                <Tooltip
                                                    contentStyle={TOOLTIP_STYLE}
                                                    labelStyle={{
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        color: "#1A1F3C",
                                                        marginBottom: 6,
                                                    }}
                                                    itemStyle={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                    }}
                                                    formatter={(value) => [
                                                        money(value),
                                                        "Valor inventario",
                                                    ]}
                                                />

                                                <Bar
                                                    dataKey="valor_inventario"
                                                    fill={C.navyLight}
                                                    radius={[6, 6, 0, 0]}
                                                    className="cursor-pointer"
                                                    isAnimationActive
                                                    animationDuration={700}
                                                    onClick={(entry) =>
                                                        alternarFiltro(
                                                            "categoria_movimiento",
                                                            entry?.categoria_movimiento,
                                                        )
                                                    }
                                                >
                                                    <LabelList
                                                        dataKey="productos"
                                                        position="top"
                                                        fill={C.navy}
                                                        fontSize={14}
                                                        formatter={(value) =>
                                                            `${formatoNumero(value)} ref.`
                                                        }
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>
                    </div >
                )
                }

                {
                    vistaActiva === "detalle" && (
                        <InteractiveTable
                            rows={registros}
                            columns={COLUMNAS}
                            storageKey="refacciones_obsolescencia_v3"
                            total={total}
                            loading={loading}
                            pageSize={pageSize}
                            onPageSizeChange={(size) => { setPagina(1); setPageSize(size); }}
                            page={pagina}
                            totalPages={totalPaginas}
                            onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
                            onNext={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                        />
                    )
                }
            </main >
        </div >
    );
}

function KPICard({ icon: Icon, label, value, sub, loading }) {
    return (
        <div className="relative min-h-[128px] overflow-hidden rounded-2xl border border-[#E7EAF3] bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[#131E5C] opacity-[0.05]" />

            <div className="relative">
                <div className="flex items-center gap-2">
                    <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/[0.08] text-[#131E5C]", loading && "animate-pulse")}>
                        {loading ? <LoaderCircle className="h-[18px] w-[18px] animate-spin" /> : <Icon className="h-[18px] w-[18px]" />}
                    </span>

                    <span className="truncate text-xs font-bold uppercase tracking-wide text-[#8891AD]">{label}</span>
                </div>

                {loading ? (
                    <>
                        <div className="mt-3 h-7 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    </>
                ) : (
                    <>
                        <div className="mt-3 truncate text-[24px] font-black leading-none tracking-tight text-[#131E5C]" title={String(value)}>{value}</div>
                        <p className="mt-2 truncate text-[14px] text-[#8891AD]">{sub}</p>
                    </>
                )}
            </div>
        </div>
    );
}

function FilterField({ label, icon: Icon, children }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 text-[#131E5C]/60" />}
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</label>
            </div>
            {children}
        </div>
    );
}

function SelectFilter({ label, icon: Icon, value, onChange, loading = false, children }) {
    return (
        <FilterField label={label} icon={Icon}>
            <div className="relative">
                <select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading} className={cn(inputClass, loading && "animate-pulse pr-9")}>
                    {children}
                </select>

                {loading && (
                    <span className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2">
                        <LoaderCircle className="h-4 w-4 animate-spin text-[#131E5C]" />
                    </span>
                )}
            </div>
        </FilterField>
    );
}

function ChartCard({ title, subtitle, icon: Icon, children }) {
    return (
        <section className="h-full overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white transition-shadow duration-300 hover:shadow-md" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
            <div className="flex items-start gap-3 border-b border-[#E4E7F0] px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]">
                    <Icon className="h-[18px] w-[18px] text-[#131E5C]" />
                </div>

                <div>
                    <h3 className="text-base font-bold text-[#1A1F3C]">{title}</h3>
                    <p className="mt-0.5 text-base text-[#8891AD]">{subtitle}</p>
                </div>
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

function ChartLoading({ type = "vertical" }) {
    if (type === "pie") {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="relative h-48 w-48 animate-pulse rounded-full bg-slate-200">
                    <div className="absolute inset-12 rounded-full bg-white" />
                </div>
            </div>
        );
    }

    if (type === "horizontal") {
        return (
            <div className="flex h-full flex-col justify-center gap-5 px-6">
                {[75, 58, 88, 42, 68, 52].map((width, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                        <div className="h-6 animate-pulse rounded-r-lg bg-slate-200" style={{ width: `${width}%`, animationDelay: `${index * 70}ms` }} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex h-full items-end justify-around gap-4 px-6 pb-7 pt-10">
            {[48, 72, 58, 88, 65, 78].map((height, index) => (
                <div key={index} className="flex h-full flex-1 items-end">
                    <div className="w-full animate-pulse rounded-t-lg bg-slate-200" style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }} />
                </div>
            ))}
        </div>
    );
}

function ErrorBox({ children }) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{children}</div>;
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