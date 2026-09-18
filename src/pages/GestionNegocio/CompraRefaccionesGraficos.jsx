// src/pages/GestionNegocio/CompraRefaccionesGraficos.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, Building2, CalendarDays, Factory, Layers, LoaderCircle, Percent,
  RefreshCw, Search, SlidersHorizontal, Store, TrendingDown, Undo2, Wallet, X, LayoutList,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ReferenceArea, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { getCompraRefGraficos, getCostoVenta } from "../../lib/apiCompraRef";

function numero(value) { return Number(value || 0); }

function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const MESES = [
  ["01", "Enero"], ["02", "Febrero"], ["03", "Marzo"], ["04", "Abril"],
  ["05", "Mayo"], ["06", "Junio"], ["07", "Julio"], ["08", "Agosto"],
  ["09", "Septiembre"], ["10", "Octubre"], ["11", "Noviembre"], ["12", "Diciembre"],
];

const MESES_MAP = Object.fromEntries(MESES);
const ANIOS = Array.from({ length: new Date().getFullYear() - 2004 }, (_, i) => String(2005 + i));

const COLORES_DONUT = [
  "#131E5C", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16", "#FACC15",
];

export default function CompraRefaccionesGraficos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [porMes, setPorMes] = useState([]);
  const [porLinea, setPorLinea] = useState([]);
  const [porLineaNeto, setPorLineaNeto] = useState([]);
  const [devoluciones, setDevoluciones] = useState({});
  const [kpi, setKpi] = useState({});
  const [opciones, setOpciones] = useState({ agencias: [], estados: [], series: [], proveedores: [], proveedores_nombre: [] });
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [mes, setMes] = useState("");
  const [agencia, setAgencia] = useState("");
  const [estado, setEstado] = useState("");
  const [serie, setSerie] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [qBuscado, setQBuscado] = useState("");
  const [qDebounce, setQDebounce] = useState("");
  const [costoVenta, setCostoVenta] = useState(null);
  const [costoVentaLoading, setCostoVentaLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQDebounce(qBuscado), 400);
    return () => clearTimeout(t);
  }, [qBuscado]);

  const consultar = useCallback(() => {
    getCompraRefGraficos({
      anio: anio || undefined,
      agencia: agencia || undefined,
      estado: estado || undefined,
      serie: serie || undefined,
      proveedor: proveedor || undefined,
      proveedor_nombre: proveedorNombre || undefined,
      q: qDebounce || undefined,
    })
      .then((response) => {
        setPorMes(Array.isArray(response?.por_mes) ? response.por_mes : []);
        setPorLinea(Array.isArray(response?.por_linea) ? response.por_linea : []);
        setPorLineaNeto(Array.isArray(response?.por_linea_neto) ? response.por_linea_neto : []);
        setDevoluciones(response?.devoluciones || {});
        setKpi(response?.kpi || {});
        const opts = response?.opciones || {};
        if (Array.isArray(opts.agencias)) setOpciones((prev) => ({ ...prev, agencias: opts.agencias }));
        if (Array.isArray(opts.estados)) setOpciones((prev) => ({ ...prev, estados: opts.estados }));
        if (Array.isArray(opts.series)) setOpciones((prev) => ({ ...prev, series: opts.series }));
        if (Array.isArray(opts.proveedores)) setOpciones((prev) => ({ ...prev, proveedores: opts.proveedores }));
        if (Array.isArray(opts.proveedores_nombre)) setOpciones((prev) => ({ ...prev, proveedores_nombre: opts.proveedores_nombre }));
      })
      .catch((err) => {
        console.error("Error cargando gráficos de compras:", err);
        setPorMes([]);
        setPorLinea([]);
        setPorLineaNeto([]);
        setDevoluciones({});
        setKpi({});
        setError(err?.message || "No fue posible cargar los gráficos de compras de refacciones.");
      })
      .finally(() => setLoading(false));
  }, [anio, agencia, estado, serie, proveedor, proveedorNombre, qDebounce]);

  useEffect(() => { consultar(); }, [consultar]);

  const consultarCostoVenta = useCallback(() => {
    Promise.resolve().then(() => setCostoVentaLoading(true));
    getCostoVenta({
      agencia: agencia || undefined,
      anio: anio || undefined,
    })
      .then((response) => setCostoVenta(Number(response?.costo_venta || 0)))
      .catch((err) => {
        console.error("Error cargando costo de venta:", err);
        setCostoVenta(null);
      })
      .finally(() => setCostoVentaLoading(false));
  }, [agencia, anio]);

  useEffect(() => { consultarCostoVenta(); }, [consultarCostoVenta]);

  function cambiarFiltro(setter) {
    return (value) => {
      setter(value === "Todos" ? "" : value);
      setLoading(true);
    };
  }

  function cambiarMes(value) {
    setMes(value === "Todos" ? "" : value);
  }

  function cambiarCategoriaProveedor(value) {
    setProveedor(value === "Todos" ? "" : value);
    setProveedorNombre("");
    setLoading(true);
  }

  // Filas enero-diciembre del año seleccionado (meses vacíos = 0).
  const tabla = useMemo(() => {
    const mapa = new Map();
    for (const item of porMes) {
      mapa.set(`${item.anio}-${String(item.mes).padStart(2, "0")}`, item);
    }
    return MESES.map(([claveMes, nombreMes]) => {
      const item = mapa.get(`${anio}-${claveMes}`) || {};
      const otros = numero(item.compras_otros);
      const planta = numero(item.compras_planta);
      return { claveMes, nombreMes, otros, planta, totalMes: otros + planta, tieneDatos: Boolean(item.mes ?? item.anio) };
    });
  }, [porMes, anio]);

  const totales = useMemo(() => {
    const t = { otros: 0, planta: 0, totalMes: 0, conDatos: 0 };
    for (const fila of tabla) {
      t.otros += fila.otros;
      t.planta += fila.planta;
      t.totalMes += fila.totalMes;
      if (fila.tieneDatos) t.conDatos += 1;
    }
    return t;
  }, [tabla]);

  // Índice venta/compra = costo de venta ÷ valor neto de compras.
  const indiceVentaCompra = useMemo(() => {
    const neto = numero(kpi.valor_neto);
    const costo = numero(costoVenta);
    if (!neto || !costo || costoVentaLoading) return null;
    return costo / neto;
  }, [costoVenta, costoVentaLoading, kpi.valor_neto]);

  // % Fidelidad Planta = valor neto compras a planta / valor neto total.
  const fidelidadPlanta = useMemo(() => {
    const total = numero(devoluciones?.total?.neto);
    const planta = numero(devoluciones?.planta?.neto);
    if (!total) return null;
    return (planta / total) * 100;
  }, [devoluciones]);

  // SECCIÓN 6 · COMPRA POR LÍNEA: Agrupa por GrupoPrincipal (línea de producto).
  // Se muestran únicamente las 5 líneas con mayor importe.
  const filasLinea = useMemo(() => {
    const ordenadas = [...porLinea].sort((a, b) => numero(b.total) - numero(a.total));
    return ordenadas.slice(0, 5).map((item) => ({
      linea: (item.linea ?? "").trim() || "SIN TIPIFICAR",
      otros: numero(item.otros),
      planta: numero(item.planta),
      total: numero(item.total),
    }));
  }, [porLinea]);

  const totalLineas = porLinea.length;

  const totalesLinea = useMemo(() => {
    const t = { otros: 0, planta: 0, total: 0 };
    for (const fila of filasLinea) {
      t.otros += fila.otros;
      t.planta += fila.planta;
      t.total += fila.total;
    }
    return t;
  }, [filasLinea]);

  // SECCIÓN 7 · DEVOLUCIONES Y TRASPASOS: FUENTE | COMPRAS | DEVOL/TRASP. | NETO.
  const filasDevol = useMemo(() => {
    const d = devoluciones || {};
    const row = (clave, nombre) => ({
      nombre,
      compras: numero(d[clave]?.compras),
      devol: numero(d[clave]?.devol),
      neto: numero(d[clave]?.neto),
    });
    return [row("otros", "Otro Proveedor"), row("planta", "Planta"), row("total", "Total")];
  }, [devoluciones]);

  // SECCIÓN 8 · DONUT VALOR NETO COMPRAS POR LÍNEA.
  const datosDonut = useMemo(() => {
    const ordenadas = porLineaNeto
      .filter((item) => numero(item.neto) > 0)
      .map((item) => ({
        name: (item.linea ?? "").trim() || "SIN TIPIFICAR",
        value: numero(item.neto),
      }))
      .sort((a, b) => b.value - a.value);
    const top = ordenadas.slice(0, 8);
    const resto = ordenadas.slice(8).reduce((acc, item) => acc + item.value, 0);
    if (resto > 0) top.push({ name: "Otros", value: resto });
    return top;
  }, [porLineaNeto]);

  const topDonut = datosDonut[0] || null;
  const totalDonut = datosDonut.reduce((acc, item) => acc + item.value, 0);

  // SECCIÓN 9 · EVOLUCIÓN DE COMPRAS POR MES (mismos valores de "Compras por Mes y Año").
  const datosEvolucion = useMemo(() => {
    return tabla.map((fila) => ({
      claveMes: fila.claveMes,
      nombre: fila.nombreMes,
      Planta: fila.planta,
      "Otro Proveedor": fila.otros,
      Total: fila.totalMes,
    }));
  }, [tabla]);

  const indiceMesSeleccionado = mes ? datosEvolucion.findIndex((fila) => fila.claveMes === mes) : -1;

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <SubNav />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">Compra de Refacciones · Gráficos</h1>
            <p className="text-xs font-medium text-[#8891AD]">Compras por mes y año · PLANTA vs OTRO PROVEEDOR</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setLoading(true); consultar(); }} disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard icon={TrendingDown} label="Costo de venta" value={costoVentaLoading ? "—" : money(costoVenta)} sub={`${anio || "Todos los años"}${agencia ? " · " + agencia : " · Todas las agencias"}`} accent="#EF4444" />
          <KPICard icon={Wallet} label="Valor neto compras" value={loading ? "—" : money(kpi.valor_neto)} sub="Compras − devoluciones" accent="#0D9488" />
          <KPICard icon={Percent} label="Índice venta/compra" value={loading || costoVentaLoading ? "—" : indiceVentaCompra === null ? "—" : `${indiceVentaCompra.toFixed(2)}×`} sub="Costo de venta ÷ valor neto compras" accent="#0EA5E9" />
          <KPICard icon={Factory} label="Fidelidad planta" value={loading ? "—" : fidelidadPlanta === null ? "—" : `${fidelidadPlanta.toFixed(1)}%`} sub="Planta vs otros proveedores" accent="#10B981" />
        </div>

        <div id="Filtros" className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <CalendarDays className="h-5 w-5 text-[#131E5C]" />
            <span className="font-black uppercase tracking-[0.08em] text-[#131E5C]">Periodo</span>
            <select value={anio || ""} onChange={(e) => cambiarFiltro(setAnio)(e.target.value)}
              className="h-10 rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none transition focus:border-[#1555C7]">
              {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => cambiarMes("Todos")} className={`min-w-[92px] flex-1 rounded-lg border border-[#131E5C] px-3 py-2 font-bold transition ${!mes ? "bg-[#131E5C] text-white shadow" : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"}`}>Todos</button>
            {MESES.map(([valor, nombre], index) => {
              const futuro = anio === String(new Date().getFullYear()) && index > new Date().getMonth();
              const active = mes === valor;
              return <button key={valor} type="button" disabled={futuro} onClick={() => cambiarMes(valor)} className={`min-w-[92px] flex-1 rounded-lg border border-[#131E5C] px-3 py-2 font-bold transition ${active ? "bg-[#131E5C] text-white shadow" : futuro ? "cursor-not-allowed text-[#131E5C]/40" : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"}`}>{nombre}</button>;
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => cambiarFiltro(setAgencia)("Todos")} className={`rounded-lg px-4 py-2 font-bold transition ${!agencia ? "bg-[#131E5C] text-white" : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"}`}>Todas</button>
            {opciones.agencias.map((agn) => (
              <button key={agn} type="button" onClick={() => cambiarFiltro(setAgencia)(agn)} className={`rounded-lg border border-[#131E5C] px-4 py-2 font-bold transition ${agencia === agn ? "bg-[#131E5C] text-white" : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"}`}>{agn}</button>
            ))}
          </div>

          <div className="mt-5 space-y-4 border-t border-[#E6EAF1] pt-4">
            <div className="relative min-w-0 flex-1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Buscar</label>
              <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />
              <input type="text" value={qBuscado} onChange={(e) => { setQBuscado(e.target.value); setLoading(true); }}
                placeholder="Ped. compra, código, descripción, nota..."
                className="h-11 w-full rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
              {qBuscado ? <button type="button" onClick={() => { setQBuscado(""); setLoading(true); }} className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button> : null}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {opciones.proveedores?.length > 1 && <FilterButtonGroup label="Proveedor" value={proveedor || "Todos"} options={["Todos", ...(opciones.proveedores || [])]} onChange={cambiarCategoriaProveedor} />}
              <FilterButtonGroup label="Estado" value={estado || "Todos"} options={["Todos", ...(opciones.estados || [])]} onChange={cambiarFiltro(setEstado)} />
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">Serie</span>
                <select value={serie || "Todos"} onChange={(e) => cambiarFiltro(setSerie)(e.target.value)}
                  className="h-10 w-full flex-1 cursor-pointer rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none transition focus:border-[#1555C7]">
                  <option value="Todos">Todas</option>
                  {opciones.series.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {proveedor === "OTROS" && (
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">Proveedor en OTROS</span>
                <select value={proveedorNombre || "Todos"} onChange={(e) => cambiarFiltro(setProveedorNombre)(e.target.value)}
                  className="h-10 w-full flex-1 cursor-pointer rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none transition focus:border-[#1555C7]">
                  <option value="Todos">Todos</option>
                  {opciones.proveedores_nombre.map((p) => (
                    <option key={p.proveedor} value={p.proveedor}>{p.proveedor}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F7F8FC] px-3 py-2 text-[11px] font-semibold text-slate-500">
              <span className="font-black uppercase tracking-wide text-[#131E5C]/60">Coincidencias:</span>
              <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">{new Intl.NumberFormat("es-MX").format(numero(kpi.registros))}</span>
              {agencia && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Store className="mr-1 inline h-3 w-3" />{agencia}</span>}
              {anio && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><CalendarDays className="mr-1 inline h-3 w-3" />Año {anio}</span>}
              {proveedor && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Building2 className="mr-1 inline h-3 w-3" />{proveedor}</span>}
              {estado && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><SlidersHorizontal className="mr-1 inline h-3 w-3" />{estado}</span>}
            </div>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        {/* NIVEL 2 · INFORMACIÓN PRINCIPAL */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* SECCIÓN 5 · COMPRAS POR MES Y AÑO */}
        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm xl:col-span-2 xl:flex xl:flex-col">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#131E5C]" />
            <div>
              <h2 className="text-lg font-extrabold text-[#131E5C]">Compras por Mes y Año</h2>
              <p className="text-xs font-semibold text-[#8891AD]">Enero–diciembre de {anio || "—"} · importe líquido (VrLiqTotal) por fecha de emisión (DtEmissao)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#131E5C] text-white">
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-left font-extrabold">AÑO/MES</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">OTRO PROVEEDOR</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">PLANTA</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((fila) => (
                  <tr key={fila.claveMes} className={`transition hover:bg-[#F1F4FA] ${!fila.tieneDatos ? "text-[#B6BFD2]" : ""}`}>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 font-bold text-[#152754]">
                      {fila.nombreMes} <span className="font-semibold text-[#8891AD]">{anio}</span>
                    </td>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 text-right font-semibold tabular-nums">{money(fila.otros)}</td>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 text-right font-semibold tabular-nums">{money(fila.planta)}</td>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 text-right font-bold tabular-nums text-[#131E5C]">{money(fila.totalMes)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#131E5C] text-white">
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-left font-extrabold uppercase tracking-wide">
                    Total acumulado
                    {totales.conDatos > 0 && <span className="ml-2 text-[11px] font-semibold text-white/60">({totales.conDatos} meses con datos)</span>}
                  </td>
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold tabular-nums">{money(totales.otros)}</td>
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold tabular-nums">{money(totales.planta)}</td>
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold tabular-nums">{money(totales.totalMes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* SECCIÓN 6 · COMPRA POR LÍNEA */}
        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Layers className="h-5 w-5 text-[#131E5C]" />
            <div>
              <h2 className="text-lg font-extrabold text-[#131E5C]">Compra por Línea</h2>
              <p className="text-xs font-semibold text-[#8891AD]">Top 5 líneas con mayor importe{totalLineas > 5 ? ` de ${totalLineas}` : ""} · grupo principal de producto · importe bruto (TpOper=Compra)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#131E5C] text-white">
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-left font-extrabold">LÍNEA</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">OTRO PROVEEDOR</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">PLANTA</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {filasLinea.map((fila) => (
                  <tr key={fila.linea} className="transition hover:bg-[#F1F4FA]">
                    <td className="border border-[#E6EAF1] px-4 py-2.5 font-bold text-[#152754]">{fila.linea}</td>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 text-right font-semibold tabular-nums">{money(fila.otros)}</td>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 text-right font-semibold tabular-nums">{money(fila.planta)}</td>
                    <td className="border border-[#E6EAF1] px-4 py-2.5 text-right font-bold tabular-nums text-[#131E5C]">{money(fila.total)}</td>
                  </tr>
                ))}
                {filasLinea.length === 0 && (
                  <tr><td colSpan={4} className="border border-[#E6EAF1] px-4 py-6 text-center text-sm font-semibold text-slate-400">Sin datos para los filtros seleccionados.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#131E5C] text-white">
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-left font-extrabold uppercase tracking-wide">Total</td>
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold tabular-nums">{money(totalesLinea.otros)}</td>
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold tabular-nums">{money(totalesLinea.planta)}</td>
                  <td className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold tabular-nums">{money(totalesLinea.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* SECCIÓN 7 · DEVOLUCIONES Y TRASPASOS */}
        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Undo2 className="h-5 w-5 text-[#131E5C]" />
            <div>
              <h2 className="text-lg font-extrabold text-[#131E5C]">Devoluciones y Traspasos</h2>
              <p className="text-xs font-semibold text-[#8891AD]">Compras brutas menos devoluciones/traspasos (TpOper=Devolución) · NETO = compras − devol/trasp.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#131E5C] text-white">
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-left font-extrabold">FUENTE</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">COMPRAS</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">DEVOL/TRASP.</th>
                  <th className="border border-[#131E5C]/20 px-4 py-3 text-right font-extrabold">NETO COMPRAS</th>
                </tr>
              </thead>
              <tbody>
                {filasDevol.map((fila) => {
                  const esTotal = fila.nombre === "Total";
                  return (
                    <tr key={fila.nombre} className={`${esTotal ? "bg-[#131E5C] text-white" : "transition hover:bg-[#F1F4FA]"}`}>
                      <td className={`border px-4 py-2.5 font-bold ${esTotal ? "border-[#131E5C]/20 text-left uppercase tracking-wide" : "border-[#E6EAF1] text-[#152754]"}`}>{fila.nombre}</td>
                      <td className={`border px-4 py-2.5 text-right font-semibold tabular-nums ${esTotal ? "border-[#131E5C]/20 font-extrabold" : "border-[#E6EAF1]"}`}>{money(fila.compras)}</td>
                      <td className={`border px-4 py-2.5 text-right font-semibold tabular-nums ${esTotal ? "border-[#131E5C]/20 font-extrabold" : "border-[#E6EAF1]"}`}>{money(fila.devol)}</td>
                      <td className={`border px-4 py-2.5 text-right font-bold tabular-nums ${esTotal ? "border-[#131E5C]/20 text-white" : "border-[#E6EAF1] text-[#131E5C]"}`}>{money(fila.neto)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECCIÓN 8 · DONUT VALOR NETO COMPRAS POR LÍNEA */}
        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <PieChart className="h-5 w-5 text-[#131E5C]" />
            <div>
              <h2 className="text-lg font-extrabold text-[#131E5C]">Valor Neto Compras por Línea</h2>
              <p className="text-xs font-semibold text-[#8891AD]">Participación por línea (grupo principal) sobre el valor neto de compras</p>
            </div>
          </div>

          {datosDonut.length > 0 ? (
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <div className="relative w-full max-w-md shrink-0">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={datosDonut}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={130}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {datosDonut.map((item, index) => (
                        <Cell key={item.name} fill={COLORES_DONUT[index % COLORES_DONUT.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => money(value)}
                      contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 600 }}
                      labelStyle={{ fontWeight: 800, color: "#131E5C" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  {topDonut ? (
                    <div className="px-6">
                      <div className="text-[22px] font-black leading-none text-[#131E5C]" title={topDonut.name}>{topDonut.name}</div>
                      <div className="mt-1 text-2xl font-black text-[#10B981]">
                        {totalDonut > 0 ? `${((topDonut.value / totalDonut) * 100).toFixed(1)}%` : "—"}
                      </div>
                      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#8891AD]">participación</div>
                      <div className="mt-2 text-[11px] font-semibold text-[#8891AD]">de {money(topDonut.value)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2">
                {datosDonut.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 rounded-lg bg-[#F7F8FC] px-3 py-2">
                    <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORES_DONUT[index % COLORES_DONUT.length] }} />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#152754]" title={item.name}>{item.name}</span>
                    <span className="text-xs font-bold tabular-nums text-[#131E5C]">{totalDonut > 0 ? `${((item.value / totalDonut) * 100).toFixed(1)}%` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm font-semibold text-slate-400">Sin datos para los filtros seleccionados.</p>
          )}
        </section>

        {/* SECCIÓN 9 · EVOLUCIÓN DE COMPRAS POR MES */}
        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#131E5C]" />
            <div>
              <h2 className="text-lg font-extrabold text-[#131E5C]">Evolución de Compras por Mes</h2>
              <p className="text-xs font-semibold text-[#8891AD]">{anio} · 12 meses · valores idénticos a "Compras por Mes y Año"{mes ? ` · mes resaltado: ${MESES_MAP[mes]}` : " · elige un mes en Periodo para resaltarlo"}</p>
            </div>
          </div>

          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datosEvolucion} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAF1" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fontWeight: 700, fill: "#8891AD" }} axisLine={{ stroke: "#C8D0DF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#8891AD" }} axisLine={false} tickLine={false} tickFormatter={(value) => money(value)} width={96} domain={[0, "auto"]} />
                {indiceMesSeleccionado >= 0 && (
                  <ReferenceArea x1={indiceMesSeleccionado - 0.5} x2={indiceMesSeleccionado + 0.5} fill="#F59E0B" fillOpacity={0.12} stroke="#F59E0B" strokeDasharray="3 3" />
                )}
                <Tooltip formatter={(value, name) => [money(value), name]} labelFormatter={(nombre) => `${nombre} ${anio}`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 600 }} labelStyle={{ fontWeight: 800, color: "#131E5C" }} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Bar dataKey="Otro Proveedor" stackId="a" fill="#0EA5E9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Planta" stackId="a" fill="#131E5C" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Total" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: "#F59E0B", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}

function SubNav() {
  const tabs = [
    { to: "/gestion_negocio/compra_refacciones", label: "Listado", icon: LayoutList },
    { to: "/gestion_negocio/compra_refacciones/graficos", label: "Gráficos", icon: BarChart3 },
  ];
  return (
    <nav className="flex w-fit items-center gap-1 rounded-xl border border-[#C8D0DF] bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink key={tab.to} to={tab.to}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${isActive ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-[#131E5C]/5"}`
            }>
            <Icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
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

/** La columna "AÑO/MES" sale de la columna real de fecha en la BD (DtEmissao). */