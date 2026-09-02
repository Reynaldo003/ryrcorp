// src/pages/VentasVN/VentasVN.jsx
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Car, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  CircleDollarSign, Database, Filter, LoaderCircle, RefreshCw, Search,
  Table2, TrendingUp, WalletCards, X,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from "recharts";
import { http, buildQuery } from "../../lib/apiClient";
import { getVentasVNDashboard } from "../../lib/apiVentasVN";

const C = {
  navy: "#131E5C", navyDark: "#0A1340", navyMid: "#2445A2", navyLight: "#6681D4",
  surface: "#F7F8FC", border: "#E4E7F0", borderMd: "#C8CEDF", muted: "#8891AD",
  text: "#1A1F3C", textSub: "#515778", success: "#059669", successBg: "#ECFDF5",
};

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
];

const FILTROS_INICIALES = { q: "", agencia: "", asesor: "", familia: "", condicion_pago: "", fecha_desde: "", fecha_hasta: "" };
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
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
const TOOLTIP_STYLE = { border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(19,30,92,.12)", fontSize: 12 };
const inputClass = "h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10";
const paginationButton = "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white text-[#515778] transition hover:bg-[#F7F8FC] disabled:cursor-not-allowed disabled:opacity-40";

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }
function formatoCompacto(value) { return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numero(value)); }
function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function formatDate(value) {
  if (!value) return "—";
  const partes = String(value).split("-");
  if (partes.length !== 3) return value;
  const [year, month, day] = partes;
  return `${day}/${month}/${year}`;
}
function formatCell(value, tipo) {
  if (value === null || value === undefined || value === "") return "—";
  if (tipo === "moneda") return money(value);
  if (tipo === "fecha") return formatDate(value);
  return String(value);
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

export default function VentasVN() {
  const [dashboard, setDashboard] = useState({
    totales: { productos: 0, unidades_vendidas: 0, ingresos: 0, costo: 0 },
    graficas: { por_mes: [], por_asesor: [], por_familia: [], por_condicion_pago: [] },
    opciones: { agencias: [], asesores: [], familias: [], condiciones_pago: [] },
  });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [errorDashboard, setErrorDashboard] = useState("");
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vistaActiva, setVistaActiva] = useState("detalle");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtrosDraft, setFiltrosDraft] = useState(FILTROS_INICIALES);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  async function cargarDashboard() {
    setLoadingDashboard(true);
    setErrorDashboard("");
    try {
      const response = await getVentasVNDashboard({
        fecha_desde: filtros.fecha_desde, fecha_hasta: filtros.fecha_hasta, agencia: filtros.agencia,
        asesor: filtros.asesor, familia: filtros.familia, condicion_pago: filtros.condicion_pago,
      });
      setDashboard({
        totales: {
          productos: Number(response?.totales?.productos || 0),
          unidades_vendidas: Number(response?.totales?.unidades_vendidas || 0),
          ingresos: Number(response?.totales?.ingresos || 0),
          costo: Number(response?.totales?.costo || 0),
        },
        graficas: {
          por_mes: response?.graficas?.por_mes || [], por_asesor: response?.graficas?.por_asesor || [],
          por_familia: response?.graficas?.por_familia || [], por_condicion_pago: response?.graficas?.por_condicion_pago || [],
        },
        opciones: {
          agencias: response?.opciones?.agencias || [], asesores: response?.opciones?.asesores || [],
          familias: response?.opciones?.familias || [], condiciones_pago: response?.opciones?.condiciones_pago || [],
        },
      });
    } catch (err) {
      console.error("Error cargando dashboard VW_VN:", err);
      setErrorDashboard(err?.message || "No se pudo cargar el dashboard de Autos Nuevos.");
    } finally { setLoadingDashboard(false); }
  }

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const query = buildQuery({
        page: pagina, page_size: pageSize, q: filtros.q, agencia: filtros.agencia, asesor: filtros.asesor,
        familia: filtros.familia, condicion_pago: filtros.condicion_pago, fecha_desde: filtros.fecha_desde, fecha_hasta: filtros.fecha_hasta,
      });
      const response = await http(`/ventas-vn/api/${query}`);
      setRegistros(Array.isArray(response?.results) ? response.results : []);
      setTotal(Number(response?.count || 0));
    } catch (err) {
      console.error("Error cargando VW_VN:", err);
      setRegistros([]);
      setTotal(0);
      setError(err?.message || "No fue posible cargar la información de VW_VN.");
    } finally { setLoading(false); }
  }

  useEffect(() => { cargarDatos(); }, [pagina, pageSize, filtros]);
  useEffect(() => { cargarDashboard(); }, [filtros]);

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const hayFiltros = Object.values(filtros).some((value) => String(value || "").trim());
  const cantidadFiltrosActivos = useMemo(() => Object.entries(filtros).filter(([, value]) => String(value || "").trim()).length, [filtros]);
  const rangoActual = useMemo(() => formatoRango(filtros.fecha_desde, filtros.fecha_hasta), [filtros.fecha_desde, filtros.fecha_hasta]);
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

  function cambiarFiltro(campo, value) { setFiltrosDraft((prev) => ({ ...prev, [campo]: value })); }
  function aplicarFiltros(event) {
    event?.preventDefault();
    setPagina(1);
    setFiltros({ ...filtrosDraft });
  }
  function limpiarFiltros() {
    setFiltrosDraft(FILTROS_INICIALES);
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
  }
  function aplicarAgencia(agencia) {
    setPagina(1);
    setFiltrosDraft((prev) => ({ ...prev, agencia }));
    setFiltros((prev) => ({ ...prev, agencia }));
  }
  function aplicarRangoRapido(id) {
    const rango = obtenerRangoPreset(id);
    setPagina(1);
    setFiltrosDraft((prev) => ({ ...prev, ...rango }));
    setFiltros((prev) => ({ ...prev, ...rango }));
  }
  function actualizarTodo() { cargarDatos(); cargarDashboard(); }

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">Venta Autos Nuevos</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#131E5C]/20 bg-white p-1 shadow-sm">
              <button type="button" onClick={() => setVistaActiva("detalle")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${vistaActiva === "detalle" ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100"}`}>
                <Table2 className="h-4 w-4" />Tabla
              </button>
              <button type="button" onClick={() => setVistaActiva("dashboard")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${vistaActiva === "dashboard" ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100"}`}>
                <BarChart3 className="h-4 w-4" />Gráficos
              </button>
            </div>
            <button type="button" onClick={actualizarTodo} disabled={loading || loadingDashboard} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
              {loading || loadingDashboard ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
            <KPICard icon={Car} label="Unidades vendidas" value={loadingDashboard ? "—" : formatoNumero(dashboard.totales.unidades_vendidas)} sub={`${formatoNumero(dashboard.totales.productos)} operaciones`} />
            <KPICard icon={CircleDollarSign} label="Ingresos" value={loadingDashboard ? "—" : money(dashboard.totales.ingresos)} sub={rangoActual} iconColor="text-emerald-700" subColor="text-emerald-600" />
            <KPICard icon={WalletCards} label="Costo" value={loadingDashboard ? "—" : money(dashboard.totales.costo)} sub="Costo acumulado" iconColor="text-amber-700" />
            <KPICard icon={TrendingUp} label="Utilidad estimada" value={loadingDashboard ? "—" : money(utilidad)} sub={`Margen ${margen.toFixed(1)}%`} iconColor={utilidad >= 0 ? "text-sky-700" : "text-red-600"} subColor={utilidad >= 0 ? "text-sky-600" : "text-red-500"} />
            <KPICard icon={Database} label="Operaciones" value={loadingDashboard ? "—" : formatoNumero(dashboard.totales.productos)} sub={filtros.agencia || "Todas las agencias"} iconColor="text-violet-700" subColor="text-violet-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-md">
          <FilterButtonGroup label="Dealer" value={filtros.agencia || "Todos"} options={["Todos", ...dashboard.opciones.agencias]} onChange={(value) => aplicarAgencia(value === "Todos" ? "" : value)} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <div className="relative min-w-0 flex-1">
                <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-[#131E5C]/50">Búsqueda</label>
                <Search className="pointer-events-none absolute left-3 top-[31px] h-4 w-4 text-[#131E5C]/60" />
                <input type="text" value={filtrosDraft.q} onChange={(e) => cambiarFiltro("q", e.target.value)} placeholder="Serie, cliente, modelo..." className="h-10 w-full rounded-xl border border-[#131E5C]/15 bg-slate-50 pl-10 pr-9 text-sm font-semibold text-[#131E5C] outline-none transition placeholder:text-slate-400 focus:border-[#131E5C]/40 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
                {filtrosDraft.q ? <button type="button" onClick={() => cambiarFiltro("q", "")} className="absolute right-2 top-[29px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button> : null}
              </div>

              <div className="flex flex-wrap items-end gap-1.5">
                {[
                  { id: "hoy", label: "Hoy", inactive: "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200", active: "bg-emerald-600 text-white ring-4 ring-emerald-100" },
                  { id: "ayer", label: "Ayer", inactive: "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200", active: "bg-amber-500 text-white ring-4 ring-amber-100" },
                  { id: "esta_semana", label: "Semana", inactive: "border-sky-200 bg-sky-100 text-sky-700 hover:bg-sky-200", active: "bg-sky-600 text-white ring-4 ring-sky-100" },
                  { id: "ultimos_7", label: "7 días", inactive: "border-violet-200 bg-violet-100 text-violet-700 hover:bg-violet-200", active: "bg-violet-600 text-white ring-4 ring-violet-100" },
                  { id: "ultimos_30", label: "30 días", inactive: "border-indigo-200 bg-indigo-100 text-indigo-700 hover:bg-indigo-200", active: "bg-indigo-600 text-white ring-4 ring-indigo-100" },
                  { id: "mes_actual", label: "Este mes", inactive: "border-[#131E5C]/20 bg-blue-100 text-[#131E5C] hover:bg-blue-200", active: "bg-[#131E5C] text-white ring-4 ring-[#131E5C]/10" },
                  { id: "mes_anterior", label: "Mes anterior", inactive: "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200", active: "bg-slate-700 text-white ring-4 ring-slate-100" },
                ].map(({ id, label, inactive, active }) => (
                  <button key={id} type="button" onClick={() => aplicarRangoRapido(id)} className={`h-10 shrink-0 whitespace-nowrap rounded-xl border px-3 text-xs font-black shadow-sm transition active:scale-[0.98] ${presetFechaActivo === id ? active : inactive}`}>{label}</button>
                ))}
                <button type="button" onClick={() => setShowAdvancedFilters((prev) => !prev)} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-black shadow-sm transition ${showAdvancedFilters || cantidadFiltrosActivos > 2 ? "bg-[#131E5C] text-white" : "border border-[#131E5C]/15 bg-white text-[#131E5C] hover:bg-[#131E5C]/5"}`}>
                  Más filtros
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <form onSubmit={aplicarFiltros} className="mt-3 border-t border-black/[0.06] pt-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <FilterField label="Familia / modelo">
                    <select value={filtrosDraft.familia} onChange={(e) => cambiarFiltro("familia", e.target.value)} className={inputClass}>
                      <option value="">Todas las familias</option>
                      {dashboard.opciones.familias.map((familia) => <option key={familia} value={familia}>{familia}</option>)}
                    </select>
                  </FilterField>
                  <FilterField label="Condición de pago">
                    <select value={filtrosDraft.condicion_pago} onChange={(e) => cambiarFiltro("condicion_pago", e.target.value)} className={inputClass}>
                      <option value="">Todas las condiciones</option>
                      {dashboard.opciones.condiciones_pago.map((condicion) => <option key={condicion} value={condicion}>{condicion}</option>)}
                    </select>
                  </FilterField>
                  <FilterField label="Asesor">
                    <select value={filtrosDraft.asesor} onChange={(e) => cambiarFiltro("asesor", e.target.value)} className={inputClass}>
                      <option value="">Todos los asesores</option>
                      {dashboard.opciones.asesores.map((asesor) => <option key={asesor} value={asesor}>{asesor}</option>)}
                    </select>
                  </FilterField>
                  <FilterField label="Desde">
                    <input type="date" value={filtrosDraft.fecha_desde} onChange={(e) => cambiarFiltro("fecha_desde", e.target.value)} className={inputClass} />
                  </FilterField>
                  <FilterField label="Hasta">
                    <input type="date" value={filtrosDraft.fecha_hasta} onChange={(e) => cambiarFiltro("fecha_hasta", e.target.value)} className={inputClass} />
                  </FilterField>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {hayFiltros && <button type="button" onClick={limpiarFiltros} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"><X className="h-3.5 w-3.5" />Limpiar</button>}
                  <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#131E5C] px-4 text-xs font-bold text-white hover:bg-[#0A1340]"><Filter className="h-3.5 w-3.5" />Aplicar filtros</button>
                </div>
              </form>
            )}

            {!showAdvancedFilters && (filtros.fecha_desde || filtros.fecha_hasta || filtros.asesor || filtros.familia || filtros.condicion_pago) ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-3 text-[11px] font-semibold text-slate-500">
                <span className="font-black uppercase tracking-wide text-[#131E5C]/50">Aplicados:</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{rangoActual}</span>
                {filtros.asesor && <span className="rounded-full bg-slate-100 px-2.5 py-1">Asesor: {filtros.asesor}</span>}
                {filtros.familia && <span className="rounded-full bg-slate-100 px-2.5 py-1">Modelo: {filtros.familia}</span>}
                {filtros.condicion_pago && <span className="rounded-full bg-slate-100 px-2.5 py-1">Pago: {filtros.condicion_pago}</span>}
              </div>
            ) : null}
          </div>
        </div>

        {errorDashboard && <ErrorBox>{errorDashboard}</ErrorBox>}
        {error && <ErrorBox>{error}</ErrorBox>}

        {vistaActiva === "dashboard" && (
          <div className="grid gap-5 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <ChartCard title="Tendencia comercial" subtitle="Ingresos, costo y unidades vendidas por mes" icon={TrendingUp} badge={rangoActual}>
                <div className="h-[360px]">
                  {loadingDashboard ? <ChartLoading /> : datosMes.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={datosMes} margin={{ top: 12, right: 12, bottom: 6, left: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                        <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="money" tickFormatter={formatoCompacto} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={65} />
                        <YAxis yAxisId="units" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: C.text, fontWeight: 700 }} formatter={(value, name) => [name === "Unidades" ? `${formatoNumero(value)} unidades` : money(value), name]} />
                        <Bar yAxisId="units" dataKey="unidades_vendidas" name="Unidades" fill="#DDE4F6" radius={[6, 6, 0, 0]} barSize={22} />
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
              <ChartCard title="Condición de pago" subtitle="Distribución de unidades vendidas" icon={WalletCards}>
                <div className="grid min-h-[390px] items-center gap-3 md:grid-cols-[1fr_220px] xl:grid-cols-1 2xl:grid-cols-[1fr_220px]">
                  <div className="relative h-[280px]">
                    {loadingDashboard ? <ChartLoading /> : condicionesPago.length === 0 ? <ChartEmpty /> : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={condicionesPago} dataKey="unidades_vendidas" nameKey="condicion_pago" cx="50%" cy="50%" innerRadius={72} outerRadius={105} paddingAngle={2}>
                              {condicionesPago.map((item, index) => <Cell key={`${item.condicion_pago}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
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
                        <div key={`${item.condicion_pago}-${index}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F7F8FC]">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#515778]" title={item.condicion_pago}>{item.condicion_pago || "Sin condición"}</span>
                          <span className="text-[11px] font-bold text-[#1A1F3C]">{porcentaje(item.unidades_vendidas, totalCondicionesPago)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="xl:col-span-6">
              <ChartCard title="Rendimiento por asesor" subtitle="Top 10 por unidades vendidas" icon={BarChart3}>
                <div className="h-[390px]">
                  {loadingDashboard ? <ChartLoading /> : topAsesores.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topAsesores} layout="vertical" margin={{ top: 4, right: 38, left: 18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="asesor" width={145} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                        <Bar dataKey="unidades_vendidas" name="Unidades vendidas" fill={C.navy} radius={[0, 7, 7, 0]} barSize={20}>
                          <LabelList dataKey="unidades_vendidas" position="right" fill={C.textSub} fontSize={10} fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="xl:col-span-6">
              <ChartCard title="Modelos con mayor movimiento" subtitle="Top 10 familias por unidades vendidas" icon={Car}>
                <div className="h-[390px]">
                  {loadingDashboard ? <ChartLoading /> : topFamilias.length === 0 ? <ChartEmpty /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFamilias} layout="vertical" margin={{ top: 4, right: 38, left: 22, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="familia" width={150} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                        <Bar dataKey="unidades_vendidas" name="Unidades vendidas" fill={C.navyMid} radius={[0, 7, 7, 0]} barSize={20}>
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
          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
            <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.border }}>
              <div>
                <h2 className="text-sm font-bold text-[#1A1F3C]">Detalle de operaciones</h2>
                <p className="mt-0.5 text-xs text-[#8891AD]">{rangoActual} · {filtros.agencia || "Todas las agencias"}</p>
              </div>
              <Badge>{total.toLocaleString("es-MX")} registros</Badge>
            </div>

            <div className="max-h-[65vh] overflow-auto">
              <table className="min-w-max border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr style={{ backgroundColor: C.surface }}>
                    {COLUMNAS.map((columna) => (
                      <th key={columna.key} className="whitespace-nowrap bg-[#131E5C] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white">{columna.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr key={index}>{COLUMNAS.map((columna) => <td key={columna.key} className="border-b border-r border-slate-100 px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></td>)}</tr>
                    ))
                  ) : registros.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNAS.length} className="px-6 py-16 text-center">
                        <Database className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-700">No se encontraron registros</p>
                        <p className="mt-1 text-xs text-slate-400">Modifica los filtros o actualiza la consulta.</p>
                      </td>
                    </tr>
                  ) : registros.map((registro, index) => (
                    <tr key={`${registro.nr_mov || ""}-${registro.nr_nota || ""}-${registro.serie || ""}-${index}`} className="transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/40">
                      {COLUMNAS.map((columna) => {
                        const value = formatCell(registro[columna.key], columna.tipo);
                        return <td key={columna.key} title={value} className="max-w-[300px] whitespace-nowrap border-b border-r border-slate-100 px-4 py-3 text-xs text-slate-700"><div className="max-w-[280px] truncate">{value}</div></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.border, backgroundColor: C.surface }}>
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">Mostrando <span className="font-bold text-slate-700">{registros.length}</span> de <span className="font-bold text-slate-700">{total.toLocaleString("es-MX")}</span> registros</p>
                <select value={pageSize} onChange={(e) => { setPagina(1); setPageSize(Number(e.target.value)); }} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none">
                  <option value={25}>25 por página</option><option value={50}>50 por página</option><option value={100}>100 por página</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={loading || pagina <= 1} onClick={() => setPagina((prev) => Math.max(1, prev - 1))} className={paginationButton}><ChevronLeft className="h-4 w-4" /></button>
                <span className="min-w-[100px] text-center text-xs font-semibold text-slate-600">Página {pagina} de {totalPaginas}</span>
                <button type="button" disabled={loading || pagina >= totalPaginas} onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))} className={paginationButton}><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, subColor = "text-slate-400", iconColor = "text-[#131E5C]" }) {
  return (
    <div className="flex items-start gap-3 border-r border-slate-200 px-6 py-4 last:border-r-0">
      <Icon className={`mt-1 h-6 w-6 shrink-0 ${iconColor}`} />
      <div className="min-w-0">
        <div className="truncate text-2xl font-black leading-tight text-[#131E5C]" title={String(value)}>{value}</div>
        <div className="mt-0.5 text-xs font-semibold text-slate-500">{label}</div>
        {sub && <div className={`mt-1 truncate text-[11px] font-semibold ${subColor}`} title={sub}>{sub}</div>}
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

function FilterField({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</label>
        {hint && <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 text-[9px] font-semibold text-[#8891AD]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, badge, children }) {
  return (
    <section className="h-full overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
      <div className="flex items-start justify-between gap-3 border-b border-[#E4E7F0] px-5 py-4">
        <div className="flex items-start gap-3">
          {Icon && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]"><Icon className="h-[18px] w-[18px] text-[#131E5C]" /></div>}
          <div>
            <h3 className="text-sm font-bold text-[#1A1F3C]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[#8891AD]">{subtitle}</p>}
          </div>
        </div>
        {badge && <Badge>{badge}</Badge>}
      </div>
      <div className="p-4">{children}</div>
    </section>
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