import { useEffect, useMemo, useState } from "react";
import {
  Boxes, Database, LoaderCircle, Package,
  RefreshCw, Search, SlidersHorizontal, Store, TrendingUp, X,
} from "lucide-react";
import { http, buildQuery } from "../../lib/apiClient";
import InteractiveTable from "../VentasVN/InteractiveTable";

const C = {
  navy: "#131E5C", navyDark: "#0A1340", navyMid: "#2445A2", navyLight: "#6681D4",
  surface: "#F7F8FC", border: "#E4E7F0", borderMd: "#C8CEDF", muted: "#8891AD",
  text: "#1A1F3C", textSub: "#515778",
};

const COLUMNAS = [
  { key: "agencia", label: "Agencia" },
  { key: "CodProduto", label: "Código Producto" },
  { key: "QtdeEstoque", label: "Existencia", tipo: "numero" },
  { key: "VrEstoque", label: "Valor Estoque", tipo: "moneda" },
  { key: "VrUnitarioMedio", label: "Valor Unitario Medio", tipo: "moneda" },
  { key: "QtReservada", label: "Reservada", tipo: "numero" },
  { key: "QtPedida", label: "Pedida", tipo: "numero" },
  { key: "QtReserEstrateg", label: "Reserva Estratégica", tipo: "numero" },
  { key: "QtTransito", label: "Tránsito", tipo: "numero" },
  { key: "DtUltimaVenda", label: "Última Venta", tipo: "fecha" },
  { key: "DtUltimaCompra", label: "Última Compra", tipo: "fecha" },
  { key: "DtUltimoPedido", label: "Último Pedido", tipo: "fecha" },
  { key: "DtAtualizacao", label: "Actualización", tipo: "fecha" },
];

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }
function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function ProductosEstoque() {
  const [datos, setDatos] = useState([]);
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
      const response = await http(`/ventas-vn/api/productos/${buildQuery({
        agencia: agencia || undefined,
        page: pagina,
        page_size: pageSize,
        q: qDebounce || undefined,
      })}`);
      setDatos(Array.isArray(response?.results) ? response.results : []);
      setTotal(Number(response?.count || 0));
      const opts = response?.opciones?.agencias;
      if (Array.isArray(opts)) setAgencias(opts);
    } catch (err) {
      console.error("Error cargando Productos:", err);
      setDatos([]);
      setTotal(0);
      setError(err?.message || "No fue posible cargar los productos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarDatos(); }, [pagina, pageSize, agencia, qDebounce]);

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  function cambiarAgencia(value) {
    setPagina(1);
    setAgencia(value === "Todos" ? "" : value);
  }

  const totalValorEstoque = useMemo(() => datos.reduce((acc, item) => acc + numero(item.VrEstoque), 0), [datos]);
  const totalExistencia = useMemo(() => datos.reduce((acc, item) => acc + numero(item.QtdeEstoque), 0), [datos]);
  const totalReservada = useMemo(() => datos.reduce((acc, item) => acc + numero(item.QtReservada), 0), [datos]);
  const totalTransito = useMemo(() => datos.reduce((acc, item) => acc + numero(item.QtTransito), 0), [datos]);
  const totalPedida = useMemo(() => datos.reduce((acc, item) => acc + numero(item.QtPedida), 0), [datos]);

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">Productos</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={cargarDatos} disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KPICard icon={Store} label="Agencias" value={loading ? "—" : agencias.length ? formatoNumero(agencias.length) : "—"} sub={agencia || "Todas las agencias"} accent="#059669" />
          <KPICard icon={Boxes} label="Valor Estoque" value={loading ? "—" : money(totalValorEstoque)} sub="Valor acumulado" accent="#0EA5E9" />
          <KPICard icon={Package} label="Existencia" value={loading ? "—" : formatoNumero(totalExistencia)} sub={`${formatoNumero(total)} productos`} accent="#F59E0B" />
          <KPICard icon={TrendingUp} label="Reservada" value={loading ? "—" : formatoNumero(totalReservada)} sub="Unidades reservadas" accent="#8B5CF6" />
          <KPICard icon={Database} label="Tránsito" value={loading ? "—" : formatoNumero(totalTransito)} sub={`Pedida: ${formatoNumero(totalPedida)}`} accent="#EC4899" />
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
                  placeholder="Código, agencia..."
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
            rows={datos}
            columns={COLUMNAS}
            storageKey="productos"
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


