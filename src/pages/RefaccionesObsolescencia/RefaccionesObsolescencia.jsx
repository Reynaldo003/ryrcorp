import { useEffect, useMemo, useState } from "react";
import {
    BarChart3, Boxes, CalendarDays, CircleDollarSign, Clock3, Database, Eraser,
    Layers3, LoaderCircle, MapPin, PackageSearch, RefreshCw, Search,
    SlidersHorizontal, Table2, Tags, X,
} from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {
    getOpcionesRefaccionesObsolescencia,
    getRefaccionesObsolescencia,
    getRefaccionesObsolescenciaDashboard,
} from "../../lib/apiRefaccionesObsolescencia";
import InteractiveTable from "./InteractiveTable";

const C = {
    navy: "#131E5C", navyMid: "#2445A2", navyLight: "#6681D4",
    border: "#E4E7F0", muted: "#8891AD", textSub: "#515778",
};

const PIE_COLORS = ["#131E5C", "#2445A2", "#3D63C8", "#6681D4", "#8B9DDE", "#AEB9E8", "#42526E", "#7A869A"];

const TOOLTIP_STYLE = {
    border: "1px solid #E4E7F0",
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(19,30,92,.12)",
    fontSize: 12,
};

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
    { key: "qt_pedida", label: "Pedida", tipo: "numero" },
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
    categoria_movimiento: "", fecha_desde: "", fecha_hasta: "", dias_min: "", dias_max: "",
};

const OPCIONES_INICIALES = {
    agencias: [], grupos_principales: [], categorias: [],
    capas_obsolescencia: [], categorias_movimiento: [],
};

const DASHBOARD_INICIAL = {
    totales: {
        registros: 0, productos: 0, qt_inventario: 0, existencia: 0,
        valor_estoque: 0, reservada: 0, pedida: 0, promedio_dias_movimiento: 0,
    },
    graficas: {
        por_capa: [], por_categoria_movimiento: [], por_agencia: [],
        por_grupo: [], por_categoria: [], por_antiguedad: [],
    },
};

const inputClass = "h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10";

function cn(...parts) { return parts.filter(Boolean).join(" "); }
function numero(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }

function formatoNumero(value, decimales = 0) {
    return numero(value).toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

function formatoCompacto(value) {
    return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numero(value));
}

function money(value) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(numero(value));
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
        setLoading(true);
        setError("");

        try {
            const response = await getRefaccionesObsolescencia({
                ...parametrosFiltros(),
                page: pagina,
                page_size: pageSize,
            });

            setRegistros(Array.isArray(response?.results) ? response.results : []);
            setTotal(Number(response?.count || 0));
        } catch (err) {
            console.error("Error cargando refacciones:", err);
            setRegistros([]);
            setTotal(0);
            setError(err?.message || "No fue posible cargar las refacciones.");
        } finally {
            setLoading(false);
        }
    }

    async function cargarDashboard() {
        setLoadingDashboard(true);
        setErrorDashboard("");

        try {
            const response = await getRefaccionesObsolescenciaDashboard(parametrosFiltros());

            setDashboard({
                totales: {
                    registros: numero(response?.totales?.registros),
                    productos: numero(response?.totales?.productos),
                    qt_inventario: numero(response?.totales?.qt_inventario),
                    existencia: numero(response?.totales?.existencia),
                    valor_estoque: numero(response?.totales?.valor_estoque),
                    reservada: numero(response?.totales?.reservada),
                    pedida: numero(response?.totales?.pedida),
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
            console.error("Error cargando dashboard:", err);
            setDashboard(DASHBOARD_INICIAL);
            setErrorDashboard(err?.message || "No fue posible cargar los gráficos.");
        } finally {
            setLoadingDashboard(false);
        }
    }

    useEffect(() => { cargarOpciones(); }, []);

    useEffect(() => {
        cargarDatos();
    }, [
        pagina, pageSize, qBuscado, filtros.agencia, filtros.grupo_principal,
        filtros.categoria, filtros.capa_obsolescencia, filtros.categoria_movimiento,
        filtros.fecha_desde, filtros.fecha_hasta, filtros.dias_min, filtros.dias_max,
    ]);

    useEffect(() => {
        cargarDashboard();
    }, [
        qBuscado, filtros.agencia, filtros.grupo_principal, filtros.categoria,
        filtros.capa_obsolescencia, filtros.categoria_movimiento,
        filtros.fecha_desde, filtros.fecha_hasta, filtros.dias_min, filtros.dias_max,
    ]);

    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const hayFiltros = useMemo(() => Object.values(filtros).some((value) => String(value ?? "").trim() !== ""), [filtros]);

    const convertirGrafica = (items) => (items || []).map((item) => ({
        ...item,
        productos: numero(item.productos),
        existencia: numero(item.existencia),
        valor_estoque: numero(item.valor_estoque),
    }));

    const porCapa = useMemo(() => convertirGrafica(dashboard.graficas.por_capa), [dashboard.graficas.por_capa]);
    const porMovimiento = useMemo(() => convertirGrafica(dashboard.graficas.por_categoria_movimiento), [dashboard.graficas.por_categoria_movimiento]);
    const porAgencia = useMemo(() => convertirGrafica(dashboard.graficas.por_agencia), [dashboard.graficas.por_agencia]);
    const porGrupo = useMemo(() => convertirGrafica(dashboard.graficas.por_grupo), [dashboard.graficas.por_grupo]);
    const porAntiguedad = useMemo(() => convertirGrafica(dashboard.graficas.por_antiguedad), [dashboard.graficas.por_antiguedad]);
    const totalValorCapas = useMemo(() => porCapa.reduce((acc, item) => acc + item.valor_estoque, 0), [porCapa]);

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

                        <button type="button" onClick={actualizarTodo} disabled={loading || loadingDashboard} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
                            {loading || loadingDashboard ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Actualizar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <KPICard icon={PackageSearch} label="Referencias" value={loadingDashboard ? "—" : formatoNumero(dashboard.totales.productos)} sub={`${formatoNumero(dashboard.totales.registros)} registros`} />
                    <KPICard icon={Database} label="Qt. Inventario" value={loadingDashboard ? "—" : formatoNumero(dashboard.totales.qt_inventario, 2)} sub="SUM(QtInventario)" />
                    <KPICard icon={Boxes} label="Existencia" value={loadingDashboard ? "—" : formatoNumero(dashboard.totales.existencia, 2)} sub="SUM(QtdeEstoque)" />
                    <KPICard icon={CircleDollarSign} label="Valor inventario" value={loadingDashboard ? "—" : money(dashboard.totales.valor_estoque)} sub="SUM(VrEstoque)" />
                    <KPICard icon={Boxes} label="Reservadas / Pedidas" value={loadingDashboard ? "—" : `${formatoNumero(dashboard.totales.reservada, 2)} / ${formatoNumero(dashboard.totales.pedida, 2)}`} sub="Reservadas / pendientes" />
                    <KPICard icon={Clock3} label="Promedio sin movimiento" value={loadingDashboard ? "—" : `${formatoNumero(dashboard.totales.promedio_dias_movimiento)} días`} sub="Antigüedad promedio" />
                </div>

                <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-[#E4E7F0] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]"><SlidersHorizontal className="h-[18px] w-[18px] text-[#131E5C]" /></span>
                            <div>
                                <h2 className="text-sm font-black tracking-wide text-[#1A1F3C]">Filtros</h2>
                                <p className="text-[11px] font-medium text-[#8891AD]">Se aplican a tabla, KPIs y gráficos</p>
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
                            <FilterField label="Agencia" icon={MapPin}>
                                <select value={filtros.agencia} onChange={(e) => cambiarFiltro("agencia", e.target.value)} disabled={loadingOpciones} className={inputClass}>
                                    <option value="">Todas las agencias</option>
                                    {opciones.agencias.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </FilterField>

                            <FilterField label="Grupo principal" icon={Layers3}>
                                <select value={filtros.grupo_principal} onChange={(e) => cambiarFiltro("grupo_principal", e.target.value)} disabled={loadingOpciones} className={inputClass}>
                                    <option value="">Todos los grupos</option>
                                    {opciones.grupos_principales.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </FilterField>

                            <FilterField label="Categoría" icon={Tags}>
                                <select value={filtros.categoria} onChange={(e) => cambiarFiltro("categoria", e.target.value)} disabled={loadingOpciones} className={inputClass}>
                                    <option value="">Todas las categorías</option>
                                    {opciones.categorias.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </FilterField>

                            <FilterField label="Capa obsolescencia" icon={Clock3}>
                                <select value={filtros.capa_obsolescencia} onChange={(e) => cambiarFiltro("capa_obsolescencia", e.target.value)} disabled={loadingOpciones} className={inputClass}>
                                    <option value="">Todas las capas</option>
                                    {opciones.capas_obsolescencia.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </FilterField>

                            <FilterField label="Movimiento" icon={Boxes}>
                                <select value={filtros.categoria_movimiento} onChange={(e) => cambiarFiltro("categoria_movimiento", e.target.value)} disabled={loadingOpciones} className={inputClass}>
                                    <option value="">Todos los movimientos</option>
                                    {opciones.categorias_movimiento.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </FilterField>
                        </div>

                        <div className="grid gap-3 border-t border-[#E4E7F0] pt-4 md:grid-cols-2 xl:grid-cols-4">
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
                            <ChartCard title="Antigüedad del inventario" subtitle="Valor según días desde el último movimiento" icon={Clock3}>
                                <div className="h-[360px]">
                                    {loadingDashboard ? <ChartLoading /> : porAntiguedad.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={porAntiguedad} margin={{ top: 20, right: 20, left: 15, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                                                <XAxis dataKey="rango" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis tickFormatter={formatoCompacto} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={65} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                <Bar dataKey="valor_estoque" fill={C.navy} radius={[6, 6, 0, 0]} className="cursor-pointer" onClick={(entry) => aplicarRangoAntiguedad(entry?.rango)}>
                                                    <LabelList dataKey="productos" position="top" fill={C.textSub} fontSize={10} formatter={(value) => `${formatoNumero(value)} ref.`} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-5">
                            <ChartCard title="Capas de obsolescencia" subtitle="Distribución del valor del inventario" icon={Layers3}>
                                <div className="grid min-h-[360px] items-center md:grid-cols-[1fr_190px] xl:grid-cols-1 2xl:grid-cols-[1fr_190px]">
                                    <div className="relative h-[280px]">
                                        {loadingDashboard ? <ChartLoading /> : porCapa.length === 0 ? <ChartEmpty /> : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={porCapa} dataKey="valor_estoque" nameKey="capa_obsolescencia" cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={2} className="cursor-pointer" onClick={(entry) => alternarFiltro("capa_obsolescencia", entry?.capa_obsolescencia)}>
                                                            {porCapa.map((item, index) => <Cell key={`${item.capa_obsolescencia}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                    </PieChart>
                                                </ResponsiveContainer>

                                                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                                    <p className="text-xl font-extrabold text-[#131E5C]">{money(totalValorCapas)}</p>
                                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#8891AD]">Inventario</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {!loadingDashboard && porCapa.length > 0 && (
                                        <div className="space-y-2">
                                            {porCapa.map((item, index) => (
                                                <button key={`${item.capa_obsolescencia}-${index}`} type="button" onClick={() => alternarFiltro("capa_obsolescencia", item.capa_obsolescencia)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition", filtros.capa_obsolescencia === item.capa_obsolescencia ? "bg-[#131E5C]/[0.08]" : "hover:bg-[#F7F8FC]")}>
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#515778]">{item.capa_obsolescencia}</span>
                                                    <span className="text-[10px] font-bold text-[#1A1F3C]">{formatoNumero(item.productos)}</span>
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
                                    {loadingDashboard ? <ChartLoading /> : porAgencia.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={porAgencia} layout="vertical" margin={{ top: 4, right: 50, left: 25, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" tickFormatter={formatoCompacto} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="agencia" width={135} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                <Bar dataKey="valor_estoque" fill={C.navy} radius={[0, 7, 7, 0]} barSize={22} className="cursor-pointer" onClick={(entry) => alternarFiltro("agencia", entry?.agencia)}>
                                                    <LabelList dataKey="productos" position="right" fill={C.textSub} fontSize={10} formatter={(value) => `${formatoNumero(value)} ref.`} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Grupos con mayor inventario" subtitle="Top 12 por valor económico" icon={Tags}>
                                <div className="h-[390px]">
                                    {loadingDashboard ? <ChartLoading /> : porGrupo.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={porGrupo} layout="vertical" margin={{ top: 4, right: 35, left: 35, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" tickFormatter={formatoCompacto} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="grupo_principal" width={160} tick={{ fontSize: 9, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                <Bar dataKey="valor_estoque" fill={C.navyMid} radius={[0, 7, 7, 0]} barSize={20} className="cursor-pointer" onClick={(entry) => alternarFiltro("grupo_principal", entry?.grupo_principal)} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-12">
                            <ChartCard title="Categoría de movimiento" subtitle="Distribución del valor según movimiento" icon={Boxes}>
                                <div className="h-[360px]">
                                    {loadingDashboard ? <ChartLoading /> : porMovimiento.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={porMovimiento} margin={{ top: 20, right: 20, left: 15, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                                                <XAxis dataKey="categoria_movimiento" tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <YAxis tickFormatter={formatoCompacto} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={65} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [money(value), "Valor inventario"]} />
                                                <Bar dataKey="valor_estoque" fill={C.navyLight} radius={[6, 6, 0, 0]} className="cursor-pointer" onClick={(entry) => alternarFiltro("categoria_movimiento", entry?.categoria_movimiento)}>
                                                    <LabelList dataKey="productos" position="top" fill={C.textSub} fontSize={10} formatter={(value) => `${formatoNumero(value)} ref.`} />
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
                    <InteractiveTable
                        rows={registros}
                        columns={COLUMNAS}
                        storageKey="refacciones_obsolescencia_v2"
                        total={total}
                        loading={loading}
                        pageSize={pageSize}
                        onPageSizeChange={(size) => { setPagina(1); setPageSize(size); }}
                        page={pagina}
                        totalPages={totalPaginas}
                        onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
                        onNext={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                    />
                )}
            </main>
        </div>
    );
}

function KPICard({ icon: Icon, label, value, sub }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-[#E7EAF3] bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[#131E5C] opacity-[0.05]" />
            <div className="relative">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/[0.08] text-[#131E5C]"><Icon className="h-[18px] w-[18px]" /></span>
                    <span className="truncate text-xs font-bold uppercase tracking-wide text-[#8891AD]">{label}</span>
                </div>
                <div className="mt-3 truncate text-[24px] font-black leading-none tracking-tight text-[#131E5C]" title={String(value)}>{value}</div>
                <p className="mt-2 truncate text-[11px] font-semibold text-[#8891AD]">{sub}</p>
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

function ChartCard({ title, subtitle, icon: Icon, children }) {
    return (
        <section className="h-full overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
            <div className="flex items-start gap-3 border-b border-[#E4E7F0] px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]"><Icon className="h-[18px] w-[18px] text-[#131E5C]" /></div>
                <div>
                    <h3 className="text-sm font-bold text-[#1A1F3C]">{title}</h3>
                    <p className="mt-0.5 text-xs text-[#8891AD]">{subtitle}</p>
                </div>
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
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