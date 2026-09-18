// src/pages/GestionNegocio/CompraRefacciones.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2, CircleDollarSign, ClipboardList, Database, LoaderCircle, Package, RefreshCw,
  Search, SlidersHorizontal, Store, X,
} from "lucide-react";
import { getCompraRefTipificada } from "../../lib/apiCompraRef";

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }

function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatDate(value) {
  if (!value) return "—";
  const partes = String(value).split("-");
  if (partes.length !== 3) return value;
  const [y, m, d] = partes;
  return `${d}/${m}/${y}`;
}

function formatoTextoSegun(value, key) {
  switch (key) {
    case "DtEntrada":
      return formatDate(value);
    case "QtProdutos":
    case "Cant_pzas_recib":
      return formatoNumero(value);
    case "VrUnitLiq":
    case "VrLiqTotal":
      return money(value);
    default:
      return String(value ?? "—") || "—";
  }
}

function tipificacionEstilo(estado) {
  const valor = String(estado || "").trim().toUpperCase();
  if (valor === "TIPIFICADO") return { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "#10B981" };
  if (valor === "SIN TIPIFICAR") return { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "#F59E0B" };
  return { badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "#8891AD" };
}

function proveedorEstilo(categoria) {
  const valor = String(categoria || "").trim().toUpperCase();
  if (valor.includes("VOLKSWAGEN")) return { badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "#3B82F6" };
  if (valor.includes("R&R")) return { badge: "bg-violet-50 text-violet-700 ring-violet-200", dot: "#8B5CF6" };
  return { badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "#8891AD" };
}

// Columnas de la tabla Matriz_CompraRef_Tipificada que se muestran.
const COLUMNAS = [
  { key: "NrNota", label: "Nota", clases: "font-mono text-xs font-bold text-[#131E5C]" },
  { key: "Serie", label: "Serie", clases: "font-mono text-xs text-slate-700" },
  { key: "Agencia", label: "Agencia", clases: "text-xs font-semibold text-slate-700" },
  { key: "DtEntrada", label: "Entrada", clases: "text-xs text-slate-700" },
  { key: "HrEntrada", label: "Hora", clases: "font-mono text-xs text-slate-700" },
  { key: "TpCompra", label: "T/C", clases: "text-xs text-slate-700" },
  { key: "NrPedCompra", label: "Ped. compra", clases: "font-mono text-xs font-semibold text-[#131E5C]" },
  { key: "CodProducto", label: "Código", clases: "font-mono text-xs text-slate-700" },
  { key: "DescrProd", label: "Descripción", clases: "text-xs text-slate-700" },
  { key: "NombreEstandarizado", label: "Estandarizado", clases: "text-xs font-semibold text-slate-700" },
  { key: "GrupoPrincipal", label: "Grupo", clases: "text-xs text-slate-700" },
  { key: "Subgrupo", label: "Subgrupo", clases: "text-xs text-slate-700" },
  { key: "Categoria", label: "Categoría", clases: "text-xs text-slate-700" },
  { key: "EstadoTipificacion", label: "Tipificación", clases: "text-xs text-slate-700" },
  { key: "Proveedor", label: "Proveedor", clases: "text-xs font-semibold text-slate-700" },
  { key: "CategoriaProveedor", label: "Categoría", clases: "text-xs text-slate-700" },
  { key: "Unidade", label: "Unidad", clases: "text-xs text-slate-700" },
  { key: "QtProdutos", label: "Cantidad", clases: "text-xs font-bold text-slate-700" },
  { key: "VrUnitLiq", label: "Costo unit.", clases: "text-xs text-slate-700" },
  { key: "VrLiqTotal", label: "Total", clases: "text-xs font-black text-[#131E5C]" },
  { key: "Cant_pzas_recib", label: "Pzas rec.", clases: "text-xs font-bold text-emerald-600" },
];

export default function CompraRefacciones() {
  const [datos, setDatos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qBuscado, setQBuscado] = useState("");
  const [qDebounce, setQDebounce] = useState("");
  const [agencia, setAgencia] = useState("");
  const [estado, setEstado] = useState("");
  const [serie, setSerie] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [proveedorNombre, setProveedorNombre] = useState("");
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [agencias, setAgencias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [series, setSeries] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresNombre, setProveedoresNombre] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setQDebounce(qBuscado), 400);
    return () => clearTimeout(t);
  }, [qBuscado]);

  const consultar = useCallback(() => {
    getCompraRefTipificada({
      agencia: agencia || undefined,
      estado: estado || undefined,
      serie: serie || undefined,
      proveedor: proveedor || undefined,
      proveedor_nombre: proveedorNombre || undefined,
      q: qDebounce || undefined,
      page: pagina,
      page_size: pageSize,
    })
      .then((response) => {
        setDatos(Array.isArray(response?.results) ? response.results : []);
        setTotal(Number(response?.count || 0));
        const opts = response?.opciones || {};
        if (Array.isArray(opts.agencias)) setAgencias(opts.agencias);
        if (Array.isArray(opts.estados)) setEstados(opts.estados);
        if (Array.isArray(opts.series)) setSeries(opts.series);
        if (Array.isArray(opts.proveedores)) setProveedores(opts.proveedores);
        if (Array.isArray(opts.proveedores_nombre)) setProveedoresNombre(opts.proveedores_nombre);
      })
      .catch((err) => {
        console.error("Error cargando compras de refacciones:", err);
        setDatos([]);
        setTotal(0);
        setError(err?.message || "No fue posible cargar las compras de refacciones.");
      })
      .finally(() => setLoading(false));
  }, [agencia, estado, serie, proveedor, proveedorNombre, qDebounce, pagina, pageSize]);

  useEffect(() => { consultar(); }, [consultar]);

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const totalCantidad = useMemo(() => datos.reduce((acc, p) => acc + numero(p.QtProdutos), 0), [datos]);
  const totalValor = useMemo(() => datos.reduce((acc, p) => acc + numero(p.VrLiqTotal), 0), [datos]);
  const sinTipificar = useMemo(
    () => datos.filter((p) => String(p.EstadoTipificacion || "").trim().toUpperCase() !== "TIPIFICADO").length,
    [datos],
  );

  function cambiarFiltro(setter) {
    return (value) => {
      setPagina(1);
      setter(value === "Todos" ? "" : value);
      setLoading(true);
    };
  }

  function cambiarCategoriaProveedor(value) {
    setPagina(1);
    setProveedor(value === "Todos" ? "" : value);
    setProveedorNombre("");
    setLoading(true);
  }

  const fila = (p) => {
    const est = tipificacionEstilo(p.EstadoTipificacion);
    const prov = proveedorEstilo(p.CategoriaProveedor);
    return (
      <tr key={p.rowid__ ?? `${p.NrNota}-${p.CodProducto}-${p.NrPedCompra}`} className="transition-colors odd:bg-white even:bg-[#FBFBFE] hover:bg-[#131E5C]/[0.03]">
        {COLUMNAS.map((col) => (
          <td key={col.key} className={`whitespace-nowrap border-b border-r border-slate-100 px-3 py-2.5 ${col.clases}`}>
            {col.key === "EstadoTipificacion" ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${est.badge}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: est.dot }} />
                {String(p.EstadoTipificacion || "—") || "—"}
              </span>
            ) : col.key === "CategoriaProveedor" ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${prov.badge}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: prov.dot }} />
                {String(p.CategoriaProveedor || "—") || "—"}
              </span>
            ) : (
              formatoTextoSegun(p[col.key], col.key)
            )}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">Compra de Refacciones</h1>
            <p className="text-xs font-medium text-[#8891AD]">Matriz de compras de refacciones tipificadas</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setLoading(true); consultar(); }} disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KPICard icon={Database} label="Registros" value={loading ? "—" : formatoNumero(total)} sub="Filas en la matriz" accent="#131E5C" />
          <KPICard icon={Package} label="Cantidad" value={loading ? "—" : formatoNumero(totalCantidad)} sub="Unidades visibles" accent="#0EA5E9" />
          <KPICard icon={CircleDollarSign} label="Valor total" value={loading ? "—" : money(totalValor)} sub="Visibles (líquido)" accent="#10B981" />
          <KPICard icon={ClipboardList} label="Sin tipificar" value={loading ? "—" : formatoNumero(sinTipificar)} sub="Registros visibles" accent="#F59E0B" />
          <KPICard icon={Store} label="Agencias" value={loading ? "—" : formatoNumero(agencias.length)} sub="Dealers en la matriz" accent="#8B5CF6" />
        </div>

        <div id="Filtros" className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: "#E4E7F0", boxShadow: "0 8px 24px rgba(19,30,92,.06)" }}>
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
            <span className="rounded-full bg-[#131E5C]/[0.07] px-3 py-1 text-[11px] font-black text-[#131E5C]">
              {formatoNumero(total)} coincidencias
            </span>
          </div>
          <div className="space-y-4 p-4">
            <div className="relative min-w-0 flex-1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Buscar</label>
              <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />
              <input type="text" value={qBuscado} onChange={(e) => { setQBuscado(e.target.value); setPagina(1); setLoading(true); }}
                placeholder="Ped. compra, código, descripción, nota..."
                className="h-11 w-full rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
              {qBuscado ? <button type="button" onClick={() => { setQBuscado(""); setPagina(1); setLoading(true); }} className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button> : null}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <FilterButtonGroup label="Agencia" value={agencia || "Todos"} options={["Todos", ...agencias]} onChange={cambiarFiltro(setAgencia)} />
              {proveedores.length > 1 && <FilterButtonGroup label="Proveedor" value={proveedor || "Todos"} options={["Todos", ...proveedores]} onChange={cambiarCategoriaProveedor} />}
              <FilterButtonGroup label="Estado" value={estado || "Todos"} options={["Todos", ...estados]} onChange={cambiarFiltro(setEstado)} />
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">
                <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">Serie</span>
                <select value={serie || "Todos"} onChange={(e) => cambiarFiltro(setSerie)(e.target.value)}
                  className="h-9 w-full flex-1 cursor-pointer rounded-full border border-[#E4E7F0] bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition focus:border-[#131E5C]/50 focus:ring-4 focus:ring-[#131E5C]/10 disabled:opacity-50">
                  <option value="Todos">Todas</option>
                  {series.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {proveedor === "OTROS" && (
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">Proveedor en OTROS</span>
                <select value={proveedorNombre || "Todos"} onChange={(e) => cambiarFiltro(setProveedorNombre)(e.target.value)}
                  className="h-9 w-full flex-1 cursor-pointer rounded-full border border-[#E4E7F0] bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition focus:border-[#131E5C]/50 focus:ring-4 focus:ring-[#131E5C]/10">
                  <option value="Todos">Todos</option>
                  {proveedoresNombre.map((p) => (
                    <option key={p.proveedor} value={p.proveedor}>{p.proveedor} ({formatoNumero(p.n)})</option>
                  ))}
                </select>
              </div>
            )}

            {(agencia || estado || serie || proveedor || proveedorNombre) && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[#E4E7F0] pt-3 text-[11px] font-semibold text-slate-500">
                <span className="font-black uppercase tracking-wide text-[#131E5C]/60">Aplicados:</span>
                {agencia && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Store className="mr-1 inline h-3 w-3" />{agencia}</span>}
                {proveedor && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Building2 className="mr-1 inline h-3 w-3" />{proveedor}</span>}
                {proveedorNombre && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Building2 className="mr-1 inline h-3 w-3" />{proveedorNombre}</span>}
                {estado && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><ClipboardList className="mr-1 inline h-3 w-3" />{estado}</span>}
                {serie && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><SlidersHorizontal className="mr-1 inline h-3 w-3" />{serie}</span>}
              </div>
            )}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "#E4E7F0", boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: "#E4E7F0" }}>
            <p className="text-xs font-semibold text-[#515778]">
              <span className="font-bold text-slate-700">{formatoNumero(datos.length)}</span> visibles ·{" "}
              <span className="font-bold text-slate-700">{formatoNumero(total)}</span> totales
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                <span className="text-[10px] font-semibold text-slate-400">por pág.</span>
                <select value={pageSize} onChange={(e) => { setPagina(1); setPageSize(Number(e.target.value)); setLoading(true); }} className="bg-transparent text-xs font-bold text-slate-700 outline-none">
                  <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={250}>250</option><option value={500}>500</option>
                </select>
              </span>
            </div>
          </div>

          <div className="max-h-[65vh] min-h-[360px] overflow-auto">
            <table className="min-w-max border-collapse">
              <thead className="sticky top-0 z-20">
                <tr style={{ backgroundColor: "#131E5C" }}>
                  {COLUMNAS.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: "#131E5C" }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {COLUMNAS.map((__, j) => (
                        <td key={j} className="border-b border-r border-slate-100 px-3 py-2.5"><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></td>
                      ))}
                    </tr>
                  ))
                ) : datos.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNAS.length} className="px-6 py-16 text-center">
                      <Package className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">No se encontraron compras de refacciones</p>
                      <p className="mt-1 text-xs text-slate-400">Modifica la búsqueda o los filtros para ver más resultados.</p>
                    </td>
                  </tr>
                ) : datos.map((p) => fila(p))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "#E4E7F0", backgroundColor: "#F7F8FC" }}>
            <p className="text-xs text-slate-500">
              Mostrando <span className="font-bold text-slate-700">{formatoNumero(datos.length)}</span> de <span className="font-bold text-slate-700">{formatoNumero(total)}</span>
            </p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={loading || pagina <= 1} onClick={() => { setPagina((prev) => Math.max(1, prev - 1)); setLoading(true); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">‹</button>
              <span className="min-w-[100px] text-center text-xs font-semibold text-slate-600">Página {pagina} de {totalPaginas}</span>
              <button type="button" disabled={loading || pagina >= totalPaginas} onClick={() => { setPagina((prev) => Math.min(totalPaginas, prev + 1)); setLoading(true); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">›</button>
            </div>
          </div>
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