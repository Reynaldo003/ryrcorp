import { useEffect, useMemo, useState } from "react";
import {
  Boxes, Database, LoaderCircle, Package, RefreshCw,
  Search, SlidersHorizontal, Store, TrendingUp, Wrench, X,
} from "lucide-react";
import { http, buildQuery } from "../../lib/apiClient";
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

  useEffect(() => {
    const t = setTimeout(() => setQDebounce(qBuscado), 400);
    return () => clearTimeout(t);
  }, [qBuscado]);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const response = await http(`/ventas-vn/api/piezas/${buildQuery({
        agencia: agencia || undefined,
        page: pagina,
        page_size: pageSize,
      })}`);
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

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

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
            <button type="button" onClick={cargarDatos} disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KPICard icon={Wrench} label="Piezas" value={loading ? "—" : formatoNumero(totalProductos)} sub={`${formatoNumero(total)} registros`} accent="#059669" />
          <KPICard icon={Boxes} label="Existencia" value={loading ? "—" : formatoNumero(totalExistencia)} sub="Unidades en inventario" accent="#0EA5E9" />
          <KPICard icon={Package} label="Valor" value={loading ? "—" : money(totalValor)} sub="Valor acumulado" accent="#F59E0B" />
          <KPICard icon={TrendingUp} label="Reservada" value={loading ? "—" : formatoNumero(totalReservada)} sub="Unidades reservadas" accent="#8B5CF6" />
          <KPICard icon={Database} label="Pedida" value={loading ? "—" : formatoNumero(totalPedida)} sub={`${formatoNumero(agencias.length)} agencias`} accent="#EC4899" />
        </div>

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

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="space-y-3">
          <InteractiveTable
            rows={datosFiltrados}
            columns={columnasConfig}
            storageKey="piezas"
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
