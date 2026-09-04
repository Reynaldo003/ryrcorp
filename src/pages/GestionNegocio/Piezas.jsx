import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3, Boxes, Database, GripVertical, ImageDown, LoaderCircle, Package, PackageSearch, RefreshCw,
  Search, SlidersHorizontal, Store, Table2, Timer, TrendingUp, Wrench, X,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getPiezasObsolescencia, getPiezasTipificadas } from "../../lib/apiPiezas";
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
    } catch (err) {
      console.error("Error cargando obsolescencia:", err);
      setObsolescencia([]);
      setMovimiento([]);
      setDistDias([]);
      setObsTotales({ cantidad: 0, valor: 0, unidades: 0 });
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
              <KPICard icon={Boxes} label="SKU totales" value={cargandoObs ? "—" : formatoNumero(obsTotales.cantidad)} sub="Piezas únicas de Córdoba" accent="#131E5C" />
              <KPICard icon={Package} label="Valor en inventario" value={cargandoObs ? "—" : money(obsTotales.valor)} sub="Valor acumulado" accent="#0EA5E9" />
              <KPICard icon={Database} label="Unidades" value={cargandoObs ? "—" : formatoNumero(obsTotales.unidades)} sub="Unidades en existencia" accent="#8B5CF6" />
              <KPICard icon={TrendingUp} label="Capa A · Sano" value={cargandoObs ? "—" : formatoNumero(capasObs.a)} sub={`${capasObs.pctA}% del inventario · < 180 días`} accent="#10B981" />
              <KPICard icon={Timer} label="Capa B" value={cargandoObs ? "—" : formatoNumero(capasObs.b)} sub={`${capasObs.pctB}% · 180 a 365 días`} accent="#F59E0B" />
              <KPICard icon={Wrench} label="Capa O · Obsoleto" value={cargandoObs ? "—" : formatoNumero(capasObs.o)} sub={`${capasObs.pctO}% · más de 365 días`} accent="#EF4444" />
            </div>

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
  const total = Number(totales.cantidad || 0);

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
      <div className="relative h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie data={capas} dataKey="cantidad" nameKey="capa" cx="50%" cy="50%" innerRadius={68} outerRadius={100} paddingAngle={3} stroke="#FFFFFF" strokeWidth={3}
              onMouseEnter={(_, index) => setSliceActiva(index)}
              onMouseLeave={() => setSliceActiva(null)}>
              {capas.map((item, index) => (
                <Cell key={item.capa} fill={CAPAS_OBSOLESCENCIA[item.capa]?.color || "#94A3B8"} opacity={sliceActiva === null || sliceActiva === index ? 1 : 0.35} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(19,30,92,0.05)" }} formatter={(value, name) => [`${formatoNumero(value)} SKU`, CAPAS_OBSOLESCENCIA[name]?.nombre || name]} />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-3xl font-black tracking-tight text-[#131E5C]">{formatoNumero(total)}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">SKU totales</p>
        </div>
      </div>
      <div className="space-y-2">
        {capas.map((item, index) => {
          const info = CAPAS_OBSOLESCENCIA[item.capa] || { nombre: item.capa, detalle: "", color: "#94A3B8" };
          const pct = total ? Math.round((Number(item.cantidad) / total) * 100) : 0;
          return (
            <div key={item.capa} onMouseEnter={() => setSliceActiva(index)} onMouseLeave={() => setSliceActiva(null)}
              className={`grid grid-cols-[12px_1fr_auto] items-center gap-2 rounded-xl px-3 py-2 transition ${sliceActiva === index ? "bg-[#131E5C]/[0.06]" : "bg-[#F7F8FC]"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-[#1A1F3C]" title={info.nombre}>{info.nombre}</p>
                <p className="truncate text-[10px] font-medium text-[#8891AD]" title={info.detalle}>{info.detalle} · {money(item.valor)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#1A1F3C]">{formatoNumero(item.cantidad)}</p>
                <p className="text-[10px] font-bold" style={{ color: info.color }}>{pct}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
