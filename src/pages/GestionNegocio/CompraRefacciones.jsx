// src/pages/GestionNegocio/CompraRefacciones.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2, CalendarDays, CircleDollarSign, ClipboardList, Database, LoaderCircle, Package, RefreshCw,
  Search, SlidersHorizontal, Store, TrendingDown, X, BarChart3, LayoutList,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { getCompraRefTipificada, getCostoVenta } from "../../lib/apiCompraRef";
import InteractiveTable from "../VentasVN/InteractiveTable";

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }

function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// Etiquetas legibles para columnas conocidas de la tabla Matriz_CompraRef_Tipificada.
const LABELS_COLUMNAS = {
  NrNota: "Nota", Serie: "Serie", Agencia: "Agencia", DtEntrada: "Entrada", HrEntrada: "Hora",
  TpCompra: "T/C", NrPedCompra: "Ped. compra", CodProducto: "Código", DescrProd: "Descripción",
  NombreEstandarizado: "Estandarizado", GrupoPrincipal: "Grupo", Subgrupo: "Subgrupo", Categoria: "Categoría",
  EstadoTipificacion: "Tipificación", Proveedor: "Proveedor", CategoriaProveedor: "Proveedor",
  Unidade: "Unidad", QtProdutos: "Cantidad", VrUnitLiq: "Costo unit.", VrLiqTotal: "Total",
  Cant_pzas_recib: "Pzas rec.", DtEmissao: "Emisión", DtRegistroNF: "Registro NF", DtVencimento: "Vence",
  SitNF: "Sit NF", TpOper: "Tp Oper", Origen_Compra: "Origen", Subtotal: "Subtotal", Total: "Total",
  VrMercadorias: "Mercancías", VrTotalNota: "Total NF", NrNF_Saida: "NF Salida", SrNF_Saida: "Serie salida",
  PercDescTotal: "% Desc", CodEmpresa: "Empresa", CodCondPgto: "Cond. pgto", QtdeItens: "Ítems",
  NrContNFe: "NFe", NrPedUnPar: "Ped. unpar", IndicaNFe: "Ind NFe", Recep_Lectora: "Recep. lectora",
  IdModoCompra: "Modo compra", TpItensNFE: "Tp NFE", TpNF: "Tp NF", Periodo: "Período", Ano: "Año",
};

function labelColumna(key) {
  if (LABELS_COLUMNAS[key]) return LABELS_COLUMNAS[key];
  return String(key || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_+/g, " ").trim() || key;
}

function tipoColumna(key) {
  if (/^Dt|^DT_|^Dt_/i.test(key)) return "fecha";
  if (/^Hr/i.test(key)) return "hora";
  if (/^(Vr|Subtotal|Total)/.test(key)) return "money";
  if (/^Qt|^Cant/i.test(key)) return "cantidad";
  return "texto";
}

function buildColumna(key) {
  const tipo = tipoColumna(key);
  return { key, label: labelColumna(key), tipo };
}

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
  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [agencias, setAgencias] = useState([]);
  const [estados, setEstados] = useState([]);
  const [series, setSeries] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresNombre, setProveedoresNombre] = useState([]);
  const [costoVenta, setCostoVenta] = useState(null);
  const [costoVentaLoading, setCostoVentaLoading] = useState(false);
  const [columnas, setColumnas] = useState(() =>
    ["NrNota", "Serie", "Agencia", "DtEntrada", "HrEntrada", "CodProducto", "DescrProd", "NombreEstandarizado", "GrupoPrincipal", "Subgrupo", "Categoria", "EstadoTipificacion", "Proveedor", "Unidade", "QtProdutos", "VrUnitLiq", "VrLiqTotal", "Cant_pzas_recib"].map(buildColumna),
  );

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
      anio: anio || undefined,
      mes: mes || undefined,
      q: qDebounce || undefined,
      page: pagina,
      page_size: pageSize,
    })
      .then((response) => {
        setDatos(Array.isArray(response?.results) ? response.results : []);
        setTotal(Number(response?.count || 0));
        if (Array.isArray(response?.columns)) setColumnas(response.columns.map(buildColumna));
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
  }, [agencia, estado, serie, proveedor, proveedorNombre, anio, mes, qDebounce, pagina, pageSize]);

  useEffect(() => { consultar(); }, [consultar]);

  const consultarCostoVenta = useCallback(() => {
    Promise.resolve().then(() => setCostoVentaLoading(true));
    getCostoVenta({
      agencia: agencia || undefined,
      anio: anio || undefined,
      mes: mes || undefined,
    })
      .then((response) => setCostoVenta(Number(response?.costo_venta || 0)))
      .catch((err) => {
        console.error("Error cargando costo de venta:", err);
        setCostoVenta(null);
      })
      .finally(() => setCostoVentaLoading(false));
  }, [agencia, anio, mes]);

  useEffect(() => { consultarCostoVenta(); }, [consultarCostoVenta]);

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

  // Columnas configurables para la tabla interactiva (estilo autos nuevos).
  const columnasConfig = useMemo(
    () =>
      columnas
        .filter((c) => c.key !== "rowid__")
        .map((c) => ({
          key: c.key,
          label: c.label,
          tipo: c.tipo === "money" ? "moneda" : c.tipo === "fecha" ? "fecha" : c.tipo === "cantidad" ? "numero" : null,
        })),
    [columnas],
  );

  function cambiarCategoriaProveedor(value) {
    setPagina(1);
    setProveedor(value === "Todos" ? "" : value);
    setProveedorNombre("");
    setLoading(true);
  }

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <SubNav />

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard icon={TrendingDown} label="Costo de venta" value={costoVentaLoading ? "—" : money(costoVenta)} sub={`${anio || "Todos los años"}${mes ? " · " + MESES_MAP[mes] : ""}${agencia ? " · " + agencia : " · Todas las agencias"}`} accent="#EF4444" />
          <KPICard icon={Database} label="Registros" value={loading ? "—" : formatoNumero(total)} sub="Filas en la matriz" accent="#131E5C" />
          <KPICard icon={Package} label="Cantidad" value={loading ? "—" : formatoNumero(totalCantidad)} sub="Unidades visibles" accent="#0EA5E9" />
          <KPICard icon={CircleDollarSign} label="Valor total" value={loading ? "—" : money(totalValor)} sub="Visibles (líquido)" accent="#10B981" />
          <KPICard icon={ClipboardList} label="Sin tipificar" value={loading ? "—" : formatoNumero(sinTipificar)} sub="Registros visibles" accent="#F59E0B" />
          <KPICard icon={Store} label="Agencias" value={loading ? "—" : formatoNumero(agencias.length)} sub="Dealers en la matriz" accent="#8B5CF6" />
        </div>

        <div id="Filtros" className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#131E5C]" />
              <span className="font-black uppercase tracking-[0.08em] text-[#131E5C]">Periodo</span>
              <select value={anio || "Todos"} onChange={(e) => cambiarFiltro(setAnio)(e.target.value)}
                className="h-10 rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none transition focus:border-[#1555C7]">
                <option value="Todos">Todos los años</option>
                {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => cambiarFiltro(setAgencia)("Todos")} className={`rounded-lg px-4 py-2 font-bold transition ${!agencia ? "bg-[#131E5C] text-white" : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"}`}>Todas</button>
              {agencias.map((agn) => (
                <button key={agn} type="button" onClick={() => cambiarFiltro(setAgencia)(agn)} className={`rounded-lg border border-[#131E5C] px-4 py-2 font-bold transition ${agencia === agn ? "bg-[#131E5C] text-white" : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white hover:px-6"}`}>{agn}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {MESES.map(([valor, nombre], index) => {
              const futuro = anio === String(new Date().getFullYear()) && index > new Date().getMonth();
              const active = mes === valor;
              return <button key={valor} type="button" disabled={futuro} onClick={() => cambiarFiltro(setMes)(valor)} className={`min-w-[92px] flex-1 rounded-lg border border-[#131E5C] px-3 py-2 font-bold transition ${active ? "bg-[#131E5C] text-white shadow" : futuro ? "cursor-not-allowed text-[#131E5C]/40" : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"}`}>{nombre}</button>;
            })}
          </div>

          <div className="mt-5 space-y-4 border-t border-[#E6EAF1] pt-4">
            <div className="relative min-w-0 flex-1">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">Buscar</label>
              <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />
              <input type="text" value={qBuscado} onChange={(e) => { setQBuscado(e.target.value); setPagina(1); setLoading(true); }}
                placeholder="Ped. compra, código, descripción, nota..."
                className="h-11 w-full rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10" />
              {qBuscado ? <button type="button" onClick={() => { setQBuscado(""); setPagina(1); setLoading(true); }} className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button> : null}
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {proveedores.length > 1 && <FilterButtonGroup label="Proveedor" value={proveedor || "Todos"} options={["Todos", ...proveedores]} onChange={cambiarCategoriaProveedor} />}
              <FilterButtonGroup label="Estado" value={estado || "Todos"} options={["Todos", ...estados]} onChange={cambiarFiltro(setEstado)} />
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">Serie</span>
                <select value={serie || "Todos"} onChange={(e) => cambiarFiltro(setSerie)(e.target.value)}
                  className="h-10 w-full flex-1 cursor-pointer rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none transition focus:border-[#1555C7]">
                  <option value="Todos">Todas</option>
                  {series.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {proveedor === "OTROS" && (
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">Proveedor en OTROS</span>
                <select value={proveedorNombre || "Todos"} onChange={(e) => cambiarFiltro(setProveedorNombre)(e.target.value)}
                  className="h-10 w-full flex-1 cursor-pointer rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none transition focus:border-[#1555C7]">
                  <option value="Todos">Todos</option>
                  {proveedoresNombre.map((p) => (
                    <option key={p.proveedor} value={p.proveedor}>{p.proveedor} ({formatoNumero(p.n)})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#F7F8FC] px-3 py-2 text-[11px] font-semibold text-slate-500">
              <span className="font-black uppercase tracking-wide text-[#131E5C]/60">Coincidencias:</span>
              <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">{formatoNumero(total)}</span>
              {agencia && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Store className="mr-1 inline h-3 w-3" />{agencia}</span>}
              {anio && anio !== "Todos" && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><CalendarDays className="mr-1 inline h-3 w-3" />Año {anio}</span>}
              {mes && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><CalendarDays className="mr-1 inline h-3 w-3" />Mes {MESES_MAP[mes]}</span>}
              {proveedor && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Building2 className="mr-1 inline h-3 w-3" />{proveedor}</span>}
              {proveedorNombre && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><Building2 className="mr-1 inline h-3 w-3" />{proveedorNombre}</span>}
              {estado && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><ClipboardList className="mr-1 inline h-3 w-3" />{estado}</span>}
              {serie && <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]"><SlidersHorizontal className="mr-1 inline h-3 w-3" />{serie}</span>}
            </div>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <InteractiveTable
          rows={datos}
          columns={columnasConfig}
          storageKey="compra-ref"
          resetColumnsOnMount
          total={total}
          loading={loading}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPagina(1); setPageSize(size); }}
          page={pagina}
          totalPages={totalPaginas}
          onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
          onNext={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
          detail={false}
          rowKey="rowid__"
          exportName="Compra Refacciones"
          exportFile={`compra_refacciones_${new Date().toISOString().slice(0, 10)}`}
        />
      </main>
    </div>
  );
}

const ANIOS = Array.from({ length: new Date().getFullYear() - 2004 }, (_, i) => String(2005 + i));

const MESES = [
  ["01", "Enero"], ["02", "Febrero"], ["03", "Marzo"], ["04", "Abril"],
  ["05", "Mayo"], ["06", "Junio"], ["07", "Julio"], ["08", "Agosto"],
  ["09", "Septiembre"], ["10", "Octubre"], ["11", "Noviembre"], ["12", "Diciembre"],
];

const MESES_MAP = Object.fromEntries(MESES);

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