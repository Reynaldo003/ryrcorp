import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BarChart3, Boxes, ChevronRight, CircleDollarSign, Database, GripVertical, ImageDown, Layers, LoaderCircle, Network, Package, PackageSearch, RefreshCw,
  Search, SlidersHorizontal, Store, Table2, Timer, TrendingUp, Wrench, X,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPiezasJerarquia, getPiezasObsolescencia, getPiezasTipificadas } from "../../lib/apiPiezas";
import InteractiveTable from "../VentasVN/InteractiveTable";

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }
function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// Convierte el nombre de columna SQL a una etiqueta amigable.
function titular(key) {
  return String(key || "")
    .replace(/[_]/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

// Infiere el tipo de una columna muestreando los valores de la página actual.
function inferirTipo(key, datos) {
  const muestras = datos.map((row) => row[key]).filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  if (muestras.length === 0) return null;

  const esFecha = muestras.every((v) => /^\d{4}-\d{2}-\d{2}/.test(String(v)));
  if (esFecha) return "fecha";

  const esNumero = muestras.every((v) => !isNaN(Number(String(v).replace(/[,$\s]/g, ""))));
  if (esNumero) return "numero";

  return null;
}

// Catálogo de gráficas del dashboard. El orden lo fija el usuario y se guarda en localStorage.
const GRAFICAS_CONFIG = [
  { id: "g1", title: "Obsolescencia de inventario", subtitle: "Capas según última venta (o compra) · SKU únicos", icon: PackageSearch },
  { id: "g2", title: "Movimiento de inventario", subtitle: "Categoría según días desde la última venta", icon: Timer },
  { id: "g3", title: "Días desde la última venta", subtitle: "Distribución de SKU por antigüedad de la última venta", icon: BarChart3 },
];
const ORDEN_GRAFICAS_KEY = "piezas-graficas-orden";

const CAPAS_OBSOLESCENCIA = {
  A: { nombre: "Capa A", detalle: "< 180 días desde la última venta", color: "#10B981" },
  B: { nombre: "Capa B", detalle: "180 a 365 días desde la última venta", color: "#F59E0B" },
  O: { nombre: "Capa O · Obsoleto", detalle: "Más de 365 días", color: "#EF4444" },
};

const MOVIMIENTO_INFO = {
  rapido: { nombre: "Rápido movimiento", detalle: "≤ 180 días", color: "#10B981" },
  lento: { nombre: "Lento movimiento", detalle: "181 a 365 días", color: "#F59E0B" },
  obsoleto: { nombre: "Obsoleto", detalle: "> 365 días", color: "#EF4444" },
};

const RANGOS_DIAS_INFO = {
  "0_30": { nombre: "0–30 días", corto: "0–30", detalle: "Ventas muy recientes", color: "#22C55E" },
  "31_90": { nombre: "31–90 días", corto: "31–90", detalle: "Entre 1 y 3 meses", color: "#84CC16" },
  "91_180": { nombre: "91–180 días", corto: "91–180", detalle: "Entre 3 y 6 meses", color: "#EAB308" },
  "181_365": { nombre: "181–365 días", corto: "181–365", detalle: "Entre 6 y 12 meses", color: "#F97316" },
  mas_365: { nombre: "Más de 365 días", corto: "+365", detalle: "Más de 12 meses", color: "#EF4444" },
  sin_referencia: { nombre: "Sin referencia", corto: "Sin ref", detalle: "Sin venta ni compra registrada", color: "#94A3B8" },
};

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #E4E7F0",
  boxShadow: "0 8px 24px rgba(19,30,92,.10)",
  fontSize: 12,
};

export default function Piezas() {
  const [datos, setDatos] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [agencia, setAgencia] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qBuscado, setQBuscado] = useState("");
  const [qDebounce, setQDebounce] = useState("");
  const [vistaActiva, setVistaActiva] = useState("detalle");
  const [ordenGraficas, setOrdenGraficas] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(ORDEN_GRAFICAS_KEY) || "[]");
      return Array.isArray(guardado) && guardado.length > 0 ? guardado : GRAFICAS_CONFIG.map((g) => g.id);
    } catch {
      return GRAFICAS_CONFIG.map((g) => g.id);
    }
  });
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [obsolescencia, setObsolescencia] = useState([]);
  const [movimiento, setMovimiento] = useState([]);
  const [distDias, setDistDias] = useState([]);
  const [obsTotales, setObsTotales] = useState({ cantidad: 0, valor: 0, unidades: 0 });
  const [inventarioObsoleto, setInventarioObsoleto] = useState(null);
  const [cargandoObs, setCargandoObs] = useState(false);
  const [errorObs, setErrorObs] = useState("");
  const chartRefs = useRef({});
  const [exportandoKey, setExportandoKey] = useState(null);

  const NOMBRE_GRAFICA = { g1: "obsolescencia_inventario", g2: "movimiento_inventario", g3: "distribucion_dias" };

  useEffect(() => {
    const t = setTimeout(() => setQDebounce(qBuscado), 400);
    return () => clearTimeout(t);
  }, [qBuscado]);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const response = await getPiezasTipificadas({
        agencia: agencia || undefined,
        page: pagina,
        page_size: pageSize,
      });
      setDatos(Array.isArray(response?.results) ? response.results : []);
      setColumnas(Array.isArray(response?.columns) ? response.columns : []);
      setTotal(Number(response?.count || 0));
      const opts = response?.opciones?.agencias;
      if (Array.isArray(opts)) setAgencias(opts);
    } catch (err) {
      console.error("Error cargando Piezas:", err);
      setDatos([]);
      setColumnas([]);
      setTotal(0);
      setError(err?.message || "No fue posible cargar el inventario de refacciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarDatos(); }, [pagina, pageSize, agencia, qDebounce]);

  async function cargarObsolescencia() {
    setCargandoObs(true);
    setErrorObs("");
    try {
      const response = await getPiezasObsolescencia();
      setObsolescencia(Array.isArray(response?.capas) ? response.capas : []);
      setMovimiento(Array.isArray(response?.movimiento) ? response.movimiento : []);
      setDistDias(Array.isArray(response?.distribucion_dias) ? response.distribucion_dias : []);
      setObsTotales(response?.totales || { cantidad: 0, valor: 0, unidades: 0 });
      setInventarioObsoleto(response?.inventario_obsoleto || null);
    } catch (err) {
      console.error("Error cargando obsolescencia:", err);
      setObsolescencia([]);
      setMovimiento([]);
      setDistDias([]);
      setObsTotales({ cantidad: 0, valor: 0, unidades: 0 });
      setInventarioObsoleto(null);
      setErrorObs(err?.message || "No fue posible calcular la obsolescencia.");
    } finally {
      setCargandoObs(false);
    }
  }

  useEffect(() => { cargarObsolescencia(); }, []);

  async function exportarGrafica(key, nombre) {
    const nodo = chartRefs.current[key];
    if (!nodo) return;
    setExportandoKey(key);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
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

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Métricas por capa de obsolescencia para la fila de KPIs del dashboard.
  const capasObs = useMemo(() => {
    const porCapa = (capa) => obsolescencia.find((c) => c.capa === capa) || { cantidad: 0 };
    const totalSku = Number(obsTotales.cantidad || 0);
    const pct = (n) => (totalSku ? Math.round((n / totalSku) * 100) : 0);
    const a = porCapa("A").cantidad || 0;
    const b = porCapa("B").cantidad || 0;
    const o = porCapa("O").cantidad || 0;
    return { a, b, o, pctA: pct(a), pctB: pct(b), pctO: pct(o) };
  }, [obsolescencia, obsTotales]);

  // Gráficas ordenadas según la preferencia guardada del usuario.
  const graficasOrdenadas = useMemo(() => {
    const porId = new Map(GRAFICAS_CONFIG.map((g) => [g.id, g]));
    const ids = ordenGraficas.filter((id) => porId.has(id));
    GRAFICAS_CONFIG.forEach((g) => { if (!ids.includes(g.id)) ids.push(g.id); });
    return ids.map((id) => porId.get(id));
  }, [ordenGraficas]);

  function reordenarGraficas(de, a) {
    setOrdenGraficas((prev) => {
      const next = [...prev];
      const [movida] = next.splice(de, 1);
      next.splice(a, 0, movida);
      try { localStorage.setItem(ORDEN_GRAFICAS_KEY, JSON.stringify(next)); } catch { /* localStorage no disponible */ }
      return next;
    });
    setDragIndex(null);
    setOverIndex(null);
  }

  // Búsqueda global: filtra la página actual por cualquier columna.
  const datosFiltrados = useMemo(() => {
    const q = qDebounce.trim().toLowerCase();
    if (!q) return datos;
    return datos.filter((row) =>
      columnas.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
    );
  }, [datos, columnas, qDebounce]);

  function cambiarAgencia(value) {
    setPagina(1);
    setAgencia(value === "Todos" ? "" : value);
  }

  // Columnas configurables para la tabla interactiva.
  const columnasConfig = useMemo(() => {
    return columnas
      .filter((key) => key !== "rowid__")
      .map((key) => {
        const tipo = key === "agencia" ? null : inferirTipo(key, datos);
        return { key, label: titular(key), tipo };
      });
  }, [columnas, datos]);

  // Sumas por columna numérica para los KPI (usa las primeras coincidencias relevantes).
  const totalExistencia = useMemo(() => ["QtdeEstoque", "QtExistencia", "Existencia", "Qtde"].reduce((s, key) => s + datos.reduce((acc, row) => acc + numero(row[key]), 0), 0), [datos]);
  const totalValor = useMemo(() => ["VrEstoque", "VrTotal", "Valor", "VrCusto"].reduce((s, key) => s + datos.reduce((acc, row) => acc + numero(row[key]), 0), 0), [datos]);
  const totalReservada = useMemo(() => ["QtReservada", "QtReservado", "Reservada"].reduce((s, key) => s + datos.reduce((acc, row) => acc + numero(row[key]), 0), 0), [datos]);
  const totalPedida = useMemo(() => ["QtPedida", "QtPedido", "Pedida"].reduce((s, key) => s + datos.reduce((acc, row) => acc + numero(row[key]), 0), 0), [datos]);

  const totalProductos = useMemo(() => datos.length, [datos]);

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">Piezas</h1>
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
            <button type="button" onClick={() => { cargarDatos(); cargarObsolescencia(); }} disabled={loading || cargandoObs}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
              {loading || cargandoObs ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar
            </button>
          </div>
        </div>

        {vistaActiva === "detalle" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KPICard icon={Wrench} label="Piezas" value={loading ? "—" : formatoNumero(totalProductos)} sub={`${formatoNumero(total)} registros`} accent="#059669" />
            <KPICard icon={Boxes} label="Existencia" value={loading ? "—" : formatoNumero(totalExistencia)} sub="Unidades en inventario" accent="#0EA5E9" />
            <KPICard icon={Package} label="Valor" value={loading ? "—" : money(totalValor)} sub="Valor acumulado" accent="#F59E0B" />
            <KPICard icon={TrendingUp} label="Reservada" value={loading ? "—" : formatoNumero(totalReservada)} sub="Unidades reservadas" accent="#8B5CF6" />
            <KPICard icon={Database} label="Pedida" value={loading ? "—" : formatoNumero(totalPedida)} sub={`${formatoNumero(agencias.length)} agencias`} accent="#EC4899" />
          </div>
        )}

        <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-md">
          <FilterButtonGroup label="Dealer" value={agencia || "Todos"} options={["Todos", ...agencias]} onChange={cambiarAgencia} />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E4E7F0", boxShadow: "0 8px 24px rgba(19,30,92,.06)" }}>
          <div className="flex items-center justify-between gap-3 border-b border-[#E4E7F0] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]">
                <SlidersHorizontal className="h-[18px] w-[18px] text-[#131E5C]" />
              </span>
              <div>
                <h2 className="text-sm font-black tracking-wide text-[#1A1F3C]">Filtros</h2>
                <p className="text-[11px] font-medium text-[#8891AD]">Se aplican al instante al elegir una opción</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="relative min-w-0 flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Buscar</label>
                <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />
                <input type="text" value={qBuscado} onChange={(e) => { setQBuscado(e.target.value); setPagina(1); }}
                  placeholder="Código, descripción..."
                  className="h-11 w-full rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
                {qBuscado ? <button type="button" onClick={() => { setQBuscado(""); setPagina(1); }} className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button> : null}
              </div>
            </div>
            {agencia && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[#E4E7F0] pt-3 text-[11px] font-semibold text-slate-500">
                <span className="font-black uppercase tracking-wide text-[#131E5C]/60">Aplicados:</span>
                <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Store className="mr-1 inline h-3 w-3" />{agencia}</span>
              </div>
            )}
          </div>
        </div>

        {vistaActiva === "dashboard" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KPICard icon={Boxes} label="SKU totales" value={cargandoObs ? "—" : formatoNumero(obsTotales.cantidad)} sub="Piezas únicas con existencia" accent="#131E5C" />
              <KPICard icon={Package} label="Valor en inventario" value={cargandoObs ? "—" : money(obsTotales.valor)} sub="Valor acumulado" accent="#0EA5E9" />
              <KPICard icon={Database} label="Unidades" value={cargandoObs ? "—" : formatoNumero(obsTotales.unidades)} sub="Unidades en existencia" accent="#8B5CF6" />
              <KPICard icon={TrendingUp} label="Capa A · Sano" value={cargandoObs ? "—" : formatoNumero(capasObs.a)} sub={`${capasObs.pctA}% del inventario · < 180 días`} accent="#10B981" />
              <KPICard icon={Timer} label="Capa B" value={cargandoObs ? "—" : formatoNumero(capasObs.b)} sub={`${capasObs.pctB}% · 180 a 365 días`} accent="#F59E0B" />
              <KPICard icon={CircleDollarSign} label="Inventario obsoleto" value={cargandoObs ? "—" : money(inventarioObsoleto?.valor_obsoleto)} sub={`${inventarioObsoleto?.pct_obsoleto ?? 0}% del valor · ${formatoNumero(capasObs.o)} SKU`} accent="#EF4444" />
            </div>

            <InventarioObsoletoPanel obs={inventarioObsoleto} cargando={cargandoObs} error={errorObs} />

            <div className="grid gap-5 xl:grid-cols-2">
              {graficasOrdenadas.map((g, indice) => {
                const arrastrando = dragIndex === indice;
                const sobre = overIndex === indice && dragIndex !== indice && dragIndex !== null;
                return (
                  <div key={g.id} draggable
                    onDragStart={() => setDragIndex(indice)}
                    onDragOver={(e) => { e.preventDefault(); if (overIndex !== indice) setOverIndex(indice); }}
                    onDragLeave={() => { if (overIndex === indice) setOverIndex(null); }}
                    onDrop={() => { if (dragIndex !== null && dragIndex !== indice) reordenarGraficas(dragIndex, indice); }}
                    onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                    className={`cursor-grab transition active:cursor-grabbing ${arrastrando ? "scale-[0.98] opacity-40" : ""} ${sobre ? "rounded-2xl ring-2 ring-[#131E5C]/25 ring-offset-2 ring-offset-white" : ""}`}>
                    <ChartCard title={g.title} subtitle={g.subtitle} icon={g.icon}
                      action={
                        <div className="flex items-center gap-1.5">
                          <GraficoExportar onClick={() => exportarGrafica(g.id, NOMBRE_GRAFICA[g.id] || g.id)} busy={exportandoKey === g.id} />
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#C4CADD]"><GripVertical className="h-4 w-4" /></span>
                        </div>
                      }>
                      <div ref={(n) => { chartRefs.current[g.id] = n; }}>
                        {g.id === "g1" ? <GraficaObsolescencia capas={obsolescencia} totales={obsTotales} cargando={cargandoObs} error={errorObs} /> : g.id === "g2" ? (
                          <GraficaMovimiento mov={movimiento} totales={obsTotales} cargando={cargandoObs} error={errorObs} />
                        ) : (
                          <GraficaDistribucion dias={distDias} totales={obsTotales} cargando={cargandoObs} error={errorObs} />
                        )}
                      </div>
                    </ChartCard>
                  </div>
                );
              })}
            </div>

            <AnalisisJerarquico />
          </>
        )}

        {vistaActiva === "detalle" && (
          <>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
            <div className="space-y-3">
              <InteractiveTable
                rows={datosFiltrados}
                columns={columnasConfig}
                storageKey="piezas"
                resetColumnsOnMount
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
          </>
        )}
      </main>
    </div>
  );
}

function KPICard({ icon, label, value, sub, accent }) {
  const Icon = icon;

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
          {sub && <div className="mt-2 truncate text-[11px] font-semibold" style={{ color: accent }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Inventario obsoleto (por valor monetario) ────────────────────────────────

function InventarioObsoletoPanel({ obs, cargando, error }) {
  if (cargando) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
        <div className="flex h-[180px] items-center justify-center text-[#8891AD]">
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="h-6 w-6 animate-spin" />
            <span className="text-xs font-semibold">Calculando inventario obsoleto…</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
        <div className="m-4 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-6 text-center text-xs font-semibold text-red-600">{error}</div>
      </section>
    );
  }

  if (!obs || !Array.isArray(obs.top_skus) || obs.top_skus.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
        <div className="flex h-[180px] items-center justify-center rounded-xl text-xs font-medium text-[#8891AD]">Sin datos para mostrar.</div>
      </section>
    );
  }

  const maxTop = Math.max(...obs.top_skus.map((s) => Number(s.valor || 0)), 1);

  const miniKpi = [
    { label: "Valor obsoleto", value: money(obs.valor_obsoleto), accent: "#DC2626" },
    { label: "% del inventario", value: `${obs.pct_obsoleto ?? 0}%`, accent: "#F97316" },
    { label: "SKU obsoletos", value: formatoNumero(obs.cantidad_sku), accent: "#0EA5E9" },
    { label: "Unidades obsoletas", value: formatoNumero(obs.unidades), accent: "#8B5CF6" },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E4E7F0] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/10">
            <CircleDollarSign className="h-[18px] w-[18px] text-[#DC2626]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1F3C]">Inventario obsoleto</h3>
            <p className="mt-0.5 text-xs text-[#8891AD]">Piezas sin venta en más de {obs.dias_limite || 365} días · valor monetario en lugar de solo conteo de SKU</p>
          </div>
        </div>
        <span className="rounded-full bg-[#EF4444]/10 px-3 py-1 text-[11px] font-black text-[#DC2626]">
          {obs.pct_obsoleto ?? 0}% del valor del inventario
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {miniKpi.map((k) => (
            <div key={k.label} className="rounded-xl bg-[#F7F8FC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">{k.label}</p>
              <p className="mt-1 text-xl font-black leading-none text-[#131E5C]" style={{ color: k.accent }}>{k.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#8891AD]">Top piezas obsoletas por valor</span>
            <span className="text-[10px] font-semibold text-[#8891AD]">Mayor valor inmovilizado</span>
          </div>
          <div className="space-y-2.5">
            {obs.top_skus.slice(0, 8).map((sku, i) => {
              const valor = Number(sku.valor || 0);
              const pctTop = maxTop ? Math.round((valor / maxTop) * 100) : 0;
              return (
                <div key={`${sku.codigo}-${i}`} className="grid grid-cols-[24px_1fr_auto] items-center gap-3">
                  <span className="text-xs font-black text-[#C4CADD]">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-[11px] font-bold text-[#1A1F3C]">{sku.producto || sku.codigo}</p>
                      {sku.codigo && sku.producto ? <span className="shrink-0 font-mono text-[9px] font-semibold text-[#C4CADD]">{sku.codigo}</span> : null}
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-[#EF4444]/10">
                      <div className="h-1 rounded-full" style={{ width: `${pctTop}%`, backgroundColor: "#EF4444" }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-[#1A1F3C]">{money(valor)}</p>
                    <p className="text-[10px] font-bold text-[#8891AD]">
                      {sku.dias_sin_venta != null ? `${Math.round(sku.dias_sin_venta)} días` : "sin venta registrada"} · {formatoNumero(sku.unidades)} uds
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Análisis jerárquico ──────────────────────────────────────────────────────

const NIVEL_LABEL = {
  dealer: "Dealer",
  grupo_principal: "Grupo principal",
  subgrupo: "Subgrupo",
  producto: "Producto",
};

const NIVEL_SIGUIENTE = {
  dealer: "grupo_principal",
  grupo_principal: "subgrupo",
  subgrupo: "producto",
  producto: null,
};

function AnalisisJerarquico() {
  const [nivel, setNivel] = useState("dealer");
  const [agencia, setAgencia] = useState("");
  const [grupo, setGrupo] = useState("");
  const [subgrupo, setSubgrupo] = useState("");
  const [filas, setFilas] = useState([]);
  const [totales, setTotales] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    getPiezasJerarquia({ nivel, agencia, grupo_principal: grupo, subgrupo })
      .then((res) => {
        if (!activo) return;
        setFilas(Array.isArray(res?.results) ? res.results : []);
        setTotales(res?.totales || null);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando jerarquía:", err);
        setFilas([]);
        setTotales(null);
        setError(err?.message || "No fue posible cargar el análisis jerárquico.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [nivel, agencia, grupo, subgrupo]);

  const puedeProfundizar = NIVEL_SIGUIENTE[nivel] != null;

  const profundizar = (fila) => {
    if (nivel === "dealer") {
      setAgencia(fila.clave);
      setGrupo("");
      setSubgrupo("");
      setNivel("grupo_principal");
    } else if (nivel === "grupo_principal") {
      setGrupo(fila.clave);
      setSubgrupo("");
      setNivel("subgrupo");
    } else if (nivel === "subgrupo") {
      setSubgrupo(fila.clave);
      setNivel("producto");
    }
  };

  const migas = [];
  migas.push({
    titulo: "Dealer",
    accion: () => { setNivel("dealer"); setAgencia(""); setGrupo(""); setSubgrupo(""); },
    activa: nivel === "dealer" && !agencia,
  });
  if (agencia) {
    migas.push({
      titulo: agencia,
      accion: () => { setAgencia(""); setGrupo(""); setSubgrupo(""); setNivel("dealer"); },
      activa: nivel === "dealer",
    });
  }
  if (grupo) {
    migas.push({
      titulo: grupo,
      accion: () => { setGrupo(""); setSubgrupo(""); setNivel("grupo_principal"); },
      activa: nivel === "grupo_principal",
    });
  }
  if (subgrupo) {
    migas.push({
      titulo: subgrupo,
      accion: () => { setSubgrupo(""); setNivel("subgrupo"); },
      activa: nivel === "subgrupo",
    });
  }

  const nombreFila = (fila) => fila.nombre || fila.clave;
  const diasFila = (fila) => (fila.dias_sin_venta != null ? `${Math.round(fila.dias_sin_venta)} d` : "—");

  const celdas = [
    { key: "nombre", etiqueta: nivel === "dealer" ? "Dealer" : NIVEL_LABEL[nivel], alineacion: "left", formatear: nombreFila },
    { key: "cantidad_sku", etiqueta: "SKUs", alineacion: "right", formatear: (f) => formatoNumero(f.cantidad_sku) },
    { key: "unidades", etiqueta: "Unidades", alineacion: "right", formatear: (f) => formatoNumero(f.unidades) },
    { key: "valor_inventario", etiqueta: "Valor de inventario", alineacion: "right", formatear: (f) => money(f.valor_inventario) },
    { key: "valor_obsoleto", etiqueta: "Valor obsoleto", alineacion: "right", formatear: (f) => money(f.valor_obsoleto) },
    { key: "dias_sin_venta", etiqueta: "Días sin venta", alineacion: "right", formatear: diasFila },
    { key: "ultima_venta", etiqueta: "Última venta", alineacion: "right", formatear: (f) => f.ultima_venta || "—" },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white" style={{ boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E4E7F0] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/[0.08]">
            <Network className="h-[18px] w-[18px] text-[#131E5C]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1F3C]">Análisis jerárquico</h3>
            <p className="mt-0.5 text-xs text-[#8891AD]">Dealer → Grupo principal → Subgrupo → Producto · Valores calculados: Valor de inventario y Días sin venta</p>
          </div>
        </div>
        <span className="rounded-full bg-[#131E5C]/[0.07] px-3 py-1 text-[11px] font-black text-[#131E5C]">
          {NIVEL_LABEL[nivel]}
          {agencia ? ` · ${agencia}` : ""}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Pan rallado */}
        <div className="flex flex-wrap items-center gap-1.5">
          {migas.map((miga, i) => (
            <div key={`${miga.titulo}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-[#C4CADD]" />}
              <button type="button" onClick={miga.accion}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition ${miga.activa ? "bg-[#131E5C] text-white" : "border border-[#E4E7F0] bg-white text-[#515778] hover:bg-[#131E5C]/5"}`}>
                {i === 0 && <Layers className="h-3 w-3" />}
                {miga.titulo}
              </button>
            </div>
          ))}
        </div>

        {totales && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-[#F7F8FC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Valor de inventario</p>
              <p className="mt-1 text-xl font-black leading-none text-[#131E5C]">{money(totales.valor_inventario)}</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Valor obsoleto</p>
              <p className="mt-1 text-xl font-black leading-none text-[#DC2626]">{money(totales.valor_obsoleto)} ({totales.pct_obsoleto ?? 0}%)</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">SKUs con existencia</p>
              <p className="mt-1 text-xl font-black leading-none text-[#0EA5E9]">{formatoNumero(totales.cantidad_sku)}</p>
            </div>
            <div className="rounded-xl bg-[#F7F8FC] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Unidades</p>
              <p className="mt-1 text-xl font-black leading-none text-[#8B5CF6]">{formatoNumero(totales.unidades)}</p>
            </div>
          </div>
        )}

        {cargando && (
          <div className="flex items-center justify-center gap-2 py-8 text-[#8891AD]">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span className="text-xs font-semibold">Cargando {NIVEL_LABEL[nivel].toLowerCase()}…</span>
          </div>
        )}

        {!cargando && error && (
          <div className="rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 py-6 text-center text-xs font-semibold text-red-600">{error}</div>
        )}

        {!cargando && !error && filas.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] px-4 py-8 text-center text-xs font-medium text-[#8891AD]">Sin datos para mostrar.</div>
        )}

        {!cargando && !error && filas.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[#E4E7F0]">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-[#E4E7F0] bg-[#F7F8FC] text-left">
                  {celdas.map((celda) => (
                    <th key={celda.key} className={`px-3 py-2.5 font-black uppercase tracking-wide text-[#8891AD] whitespace-nowrap ${celda.alineacion === "right" ? "text-right" : ""}`}>
                      {celda.etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={`${fila.clave}-${i}`}
                    onClick={() => puedeProfundizar && profundizar(fila)}
                    className={`border-b border-[#E4E7F0] transition ${puedeProfundizar ? "cursor-pointer hover:bg-[#131E5C]/[0.03]" : ""} ${i % 2 === 0 ? "bg-white" : "bg-[#FBFBFE]"}`}>
                    {celdas.map((celda) => (
                      <td key={celda.key} className={`px-3 py-2.5 whitespace-nowrap ${celda.alineacion === "right" ? "text-right" : ""}`}>
                        {celda.key === "nombre" ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-[#1A1F3C]">
                            {fila.nombre ? nombreFila(fila) : <span className="font-mono text-[10px]">{fila.clave}</span>}
                            {puedeProfundizar && <ArrowRight className="h-3 w-3 text-[#C4CADD]" />}
                          </span>
                        ) : (
                          <span className={celda.key === "valor_obsoleto" ? "font-bold text-[#DC2626]" : "text-[#515778] font-semibold"}>
                            {celda.formatear(fila)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E4E7F0] bg-[#F7F8FC] font-black text-[#1A1F3C]">
                  {celdas.map((celda) => (
                    <td key={`t-${celda.key}`} className={`px-3 py-2.5 whitespace-nowrap ${celda.alineacion === "right" ? "text-right" : ""}`}>
                      {celda.key === "nombre" ? `Total (${formatoNumero(filas.length)})` : celda.key === "valor_inventario" ? money(totales?.valor_inventario) : celda.key === "valor_obsoleto" ? money(totales?.valor_obsoleto) : celda.key === "cantidad_sku" ? formatoNumero(totales?.cantidad_sku) : celda.key === "unidades" ? formatoNumero(totales?.unidades) : "—"}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!cargando && !error && puedeProfundizar && filas.length > 0 && (
          <p className="text-[10px] font-semibold text-[#8891AD]">Haz clic en una fila para profundizar al siguiente nivel.</p>
        )}
      </div>
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

function FilterButtonGroup({ label, value, options, onChange }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
      <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">{label}</span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value === option;
          const todos = option === "Todos";
          return (
            <button key={option} type="button" onClick={() => onChange(option)}
              className={`inline-flex h-9 min-w-[90px] flex-1 items-center justify-center rounded-full px-3 text-xs font-bold transition active:scale-[0.97] ${todos ? (active ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600") : (active ? "bg-[#131E5C] text-white shadow-md shadow-[#131E5C]/20" : "bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10")}`}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, action, children }) {
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
        {action && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">{action}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function GraficaDistribucion({ dias, totales, cargando, error }) {
  const total = Number(totales.cantidad || 0);

  const datos = dias.map((item) => ({
    ...item,
    info: RANGOS_DIAS_INFO[item.rango] || { nombre: item.rango, corto: item.rango, detalle: "", color: "#94A3B8" },
  }));

  if (cargando) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[#8891AD]">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span className="text-xs font-semibold">Calculando distribución…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 text-center text-xs font-semibold text-red-600">{error}</div>
    );
  }

  if (datos.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] px-4 text-center text-xs font-medium text-[#8891AD]">Sin datos para mostrar.</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 16, right: 8, left: 8, bottom: 4 }} barCategoryGap="24%">
            <XAxis dataKey="info.corto" interval={0} tickLine={false} axisLine={{ stroke: "#E4E7F0" }} height={40}
              tick={{ fontSize: 10, fontWeight: 700, fill: "#515778", angle: -24, textAnchor: "end", dy: 4 }} />
            <YAxis hide />
            <Tooltip cursor={{ fill: "rgba(19,30,92,0.05)" }} contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} SKU`, "Cantidad"]} labelFormatter={(l) => l} />
            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} maxBarSize={46}>
              {datos.map((item) => (
                <Cell key={item.rango} fill={item.info.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {datos.map((item) => {
          const pct = total ? Math.round((Number(item.cantidad) / total) * 100) : 0;
          return (
            <div key={item.rango} className="grid grid-cols-[12px_1fr_auto] items-center gap-2 rounded-xl bg-[#F7F8FC] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.info.color }} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#1A1F3C]" title={item.info.nombre}>{item.info.nombre}</p>
                <p className="truncate text-[10px] font-medium text-[#8891AD]">{item.info.detalle} · {money(item.valor)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1A1F3C]">{formatoNumero(item.cantidad)}</p>
                <p className="text-[10px] font-bold" style={{ color: item.info.color }}>{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraficaMovimiento({ mov, totales, cargando, error }) {
  const total = Number(totales.cantidad || 0);

  const datos = mov.map((item) => ({
    ...item,
    info: MOVIMIENTO_INFO[item.categoria] || { nombre: item.categoria, detalle: "", color: "#94A3B8" },
  }));

  const mostrar = datos.slice().sort((a, b) => Number(a.cantidad) - Number(b.cantidad));

  if (cargando) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[#8891AD]">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span className="text-xs font-semibold">Calculando movimiento…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 text-center text-xs font-semibold text-red-600">{error}</div>
    );
  }

  if (datos.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] px-4 text-center text-xs font-medium text-[#8891AD]">Sin datos para mostrar.</div>
    );
  }

  const maxCantidad = Math.max(...mostrar.map((d) => Number(d.cantidad)));

  return (
    <div className="space-y-3">
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mostrar} layout="vertical" margin={{ top: 6, right: 44, left: 6, bottom: 0 }} barCategoryGap={14}>
            <XAxis type="number" hide domain={[0, maxCantidad]} />
            <YAxis type="category" dataKey="info.nombre" width={92} tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#515778" }} />
            <Tooltip cursor={{ fill: "rgba(19,30,92,0.05)" }} contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${formatoNumero(value)} SKU`, name]} labelFormatter={(l) => l} />
            <Bar dataKey="cantidad" radius={[0, 8, 8, 0]} barSize={26}>
              {mostrar.map((item) => (
                <Cell key={item.categoria} fill={item.info.color} />
              ))}
              <LabelList dataKey="cantidad" position="right" formatter={(value) => formatoNumero(value)} style={{ fontSize: 11, fontWeight: 800, fill: "#1A1F3C" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {datos.map((item) => {
          const pct = total ? Math.round((Number(item.cantidad) / total) * 100) : 0;
          return (
            <div key={item.categoria} className="grid grid-cols-[12px_1fr_auto] items-center gap-2 rounded-xl bg-[#F7F8FC] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.info.color }} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#1A1F3C]" title={item.info.nombre}>{item.info.nombre}</p>
                <p className="truncate text-[10px] font-medium text-[#8891AD]">{item.info.detalle} · {money(item.valor)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1A1F3C]">{formatoNumero(item.cantidad)}</p>
                <p className="text-[10px] font-bold" style={{ color: item.info.color }}>{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraficaObsolescencia({ capas, totales, cargando, error }) {
  const [sliceActiva, setSliceActiva] = useState(null);
  const [metrica, setMetrica] = useState("cantidad");
  const porValor = metrica === "valor";
  const total = porValor ? Number(totales.valor || 0) : Number(totales.cantidad || 0);

  const etiquetaMagna = (v) => (porValor ? money(v) : formatoNumero(v));
  const formateador = (v, name) => [
    porValor ? money(v) : `${formatoNumero(v)} SKU`,
    CAPAS_OBSOLESCENCIA[name]?.nombre || name,
  ];

  if (cargando) {
    return (
      <div className="flex h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[#8891AD]">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span className="text-xs font-semibold">Calculando obsolescencia…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/60 px-4 text-center text-xs font-semibold text-red-600">{error}</div>
    );
  }

  if (capas.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] px-4 text-center text-xs font-medium text-[#8891AD]">Sin datos para mostrar.</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#8891AD]">Distribución</span>
        <div className="flex items-center rounded-lg border border-[#E4E7F0] bg-[#F7F8FC] p-0.5">
          {[
            { id: "cantidad", etiqueta: "SKU" },
            { id: "valor", etiqueta: "Valor" },
          ].map((opcion) => (
            <button key={opcion.id} type="button" onClick={() => setMetrica(opcion.id)}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition ${metrica === opcion.id ? "bg-[#131E5C] text-white shadow" : "text-[#8891AD] hover:text-[#131E5C]"}`}>
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie data={capas} dataKey={metrica} nameKey="capa" cx="50%" cy="50%" innerRadius={64} outerRadius={94} paddingAngle={3} stroke="#FFFFFF" strokeWidth={3}
              onMouseEnter={(_, index) => setSliceActiva(index)}
              onMouseLeave={() => setSliceActiva(null)}>
              {capas.map((item, index) => (
                <Cell key={item.capa} fill={CAPAS_OBSOLESCENCIA[item.capa]?.color || "#94A3B8"} opacity={sliceActiva === null || sliceActiva === index ? 1 : 0.35} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(19,30,92,0.05)" }} formatter={formateador} />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-3xl font-black tracking-tight text-[#131E5C]">{etiquetaMagna(total)}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">{porValor ? "Del inventario" : "SKU con existencia"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {capas.map((item, index) => {
          const info = CAPAS_OBSOLESCENCIA[item.capa] || { nombre: item.capa, detalle: "", color: "#94A3B8" };
          const valorFila = porValor ? Number(item.valor || 0) : Number(item.cantidad || 0);
          const pct = total ? Math.round((valorFila / total) * 100) : 0;
          return (
            <div key={item.capa} onMouseEnter={() => setSliceActiva(index)} onMouseLeave={() => setSliceActiva(null)}
              className={`grid grid-cols-[12px_1fr_auto] items-center gap-2 rounded-xl px-3 py-2 transition ${sliceActiva === index ? "bg-[#131E5C]/[0.06]" : "bg-[#F7F8FC]"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#1A1F3C]" title={info.nombre}>{info.nombre}</p>
                <p className="truncate text-[10px] font-medium text-[#8891AD]" title={info.detalle}>{info.detalle} · {money(item.valor)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1A1F3C]">{etiquetaMagna(valorFila)}</p>
                <p className="text-[10px] font-bold" style={{ color: info.color }}>{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
