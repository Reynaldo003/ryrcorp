// src/pages/VentasVN/InteractiveTable.jsx
// Tabla interactiva para "Venta Autos Nuevos":
// busqueda global, ordenamiento, columnas configurables, conteo de
// resultados visibles, exportacion a Excel y detalle del auto en un
// popup al hacer clic sobre una fila.
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  ArrowDown, ArrowUp, ArrowUpDown, Car, Check, ChevronLeft, ChevronRight,
  DollarSign, Eye, FileText, Filter, Hash, Layers, ListFilter, Search, Sheet, Store, User, X,
} from "lucide-react";

const C = {
  navy: "#131E5C", navyDark: "#0A1340", border: "#E4E7F0", muted: "#8891AD",
  text: "#1A1F3C", textSub: "#515778", surface: "#F7F8FC",
};

function cn(...parts) { return parts.filter(Boolean).join(" "); }
function numero(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function texto(value) { return value === null || value === undefined ? "" : String(value); }

function formatDate(value) {
  if (!value) return "—";
  const partes = String(value).split("-");
  if (partes.length !== 3) return value;
  const [y, m, d] = partes;
  return `${d}/${m}/${y}`;
}
function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function formatCell(value, tipo) {
  if (value === null || value === undefined || value === "") return "—";
  if (tipo === "moneda") return money(value);
  if (tipo === "fecha") return formatDate(value);
  return String(value);
}
function rawValue(item, col) {
  const v = item[col.key];
  if (v === null || v === undefined || v === "") return "";
  if (col.tipo === "moneda") return numero(v) ?? v;
  return texto(v);
}

function DetallePopup({ registro, columns, onClose }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    function onEsc(e) { if (e.key === "Escape") cerrar(); }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cerrar() {
    setClosing(true);
    setTimeout(onClose, 180);
  }

  const get = (key) => {
    const col = columns.find((c) => c.key === key);
    return formatCell(registro[key], col?.tipo);
  };

  const secciones = [];

  const ident = [
    { e: "Serie", v: get("serie") }, { e: "N. Nota", v: get("nr_nota") }, { e: "N. Movimiento", v: get("nr_mov") },
    { e: "Tipo Producto", v: get("tp_producto") }, { e: "Producto / Servicio", v: get("producto_servicio") },
    { e: "Situación", v: get("situacion") },
  ].filter((i) => i.v !== "—");
  if (ident.length) secciones.push({ titulo: "Identificación", icono: Hash, items: ident });

  const precios = [
    { e: "Precio unitario", v: get("precio_unitario") }, { e: "Valor bruto", v: get("valor_bruto_item") },
    { e: "Descuento", v: get("valor_descuento_item") }, { e: "Valor factura", v: get("valor_factura") },
    { e: "Factura sin IVA", v: get("valor_factura_sin_iva") }, { e: "Valor compra", v: get("valor_compra") },
    { e: "Total productos", v: get("valor_total_productos") },
  ].filter((i) => i.v !== "—");
  if (precios.length) secciones.push({ titulo: "Precios", icono: DollarSign, items: precios });

  const impuestos = [
    { e: "ISAN", v: get("isan") }, { e: "IVA", v: get("iva") },
  ].filter((i) => i.v !== "—");
  if (impuestos.length) secciones.push({ titulo: "Impuestos", icono: Sheet, items: impuestos });

  const doc = [
    { e: "Fecha de emisión", v: get("fecha_emision") }, { e: "Última venta", v: get("fecha_ultima_venta") },
    { e: "Tipo NF", v: get("tipo_nf") }, { e: "Influye estadística", v: get("influye_estadistica") },
  ].filter((i) => i.v !== "—");
  if (doc.length) secciones.push({ titulo: "Documento", icono: FileText, items: doc });

  const comercial = [
    { e: "Asesor", v: get("asesor") }, { e: "Agencia", v: get("agencia") },
    { e: "Razón social", v: get("razon_social") }, { e: "Tipo persona", v: get("tipo_persona") },
    { e: "Código entidad", v: get("codigo_entidad") },
  ].filter((i) => i.v !== "—");
  if (comercial.length) secciones.push({ titulo: "Comercial", icono: User, items: comercial });

  const vehiculo = [
    { e: "Marca", v: get("nombre_marca") }, { e: "Familia / Modelo", v: get("nombre_familia") },
    { e: "Código de marca", v: get("codigo_marca") }, { e: "Condición de uso", v: get("condicion_uso") },
    { e: "Código cond. pago", v: get("codigo_condicion_pago") }, { e: "Condición de pago", v: get("nombre_condicion_pago") },
  ].filter((i) => i.v !== "—");
  if (vehiculo.length) secciones.push({ titulo: "Vehículo", icono: Car, items: vehiculo });

  const titulo = get("producto_servicio") !== "—" ? get("producto_servicio") : get("nombre_familia");
  const subtitulo = [get("nombre_marca"), get("nombre_familia"), get("serie")].filter((x) => x !== "—").join(" · ");

  const Fila = ({ e, v }) => (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{e}</span>
      <span className="min-w-0 text-right text-xs font-bold text-[#1A1F3C]" title={v}>{v}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#0A1340]/60 backdrop-blur-sm" onClick={cerrar} />
      <div
        className={cn("relative w-full max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-2xl transition-all duration-200", closing ? "scale-95 opacity-0" : "scale-100 opacity-100")}
        style={{ borderColor: C.border }}
      >
        {/* Header */}
        <div className="relative overflow-hidden px-6 py-6 text-white" style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDark} 100%)` }}>
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute right-16 top-8 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
                <Car className="h-4 w-4" /> Detalle de operación
              </div>
              <h2 className="mt-2 truncate text-2xl font-black tracking-tight">{titulo}</h2>
              <p className="mt-1 truncate text-sm font-medium text-white/70">{subtitulo}</p>
            </div>
            <button type="button" onClick={cerrar} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/25">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2">
            <Badge light>{get("agencia") !== "—" ? get("agencia") : "Sin agencia"}</Badge>
            {get("situacion") !== "—" && <Badge light>Estado: {get("situacion")}</Badge>}
            {get("asesor") !== "—" && <Badge light>Asesor: {get("asesor")}</Badge>}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-6 md:grid-cols-2">
            {secciones.map((sec) => (
              <div key={sec.titulo} className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: C.surface, color: C.navy }}>
                    <sec.icono className="h-4 w-4" />
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: C.navy }}>{sec.titulo}</h3>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-1" style={{ borderColor: C.border }}>
                  {sec.items.map((item) => <Fila key={item.e} e={item.e} v={item.v} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ light, children }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", light ? "bg-white/15 text-white" : "bg-[#131E5C]/[0.08] text-[#131E5C]")}>
      {children}
    </span>
  );
}

function ColumnChooser({ columns, visible, onChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  function toggle(key) {
    const next = new Set(visible);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(next);
  }

  return (
    <div ref={ref} className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border bg-white shadow-2xl" style={{ borderColor: C.border }}>
      <div className="border-b px-3 py-2.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <p className="text-xs font-bold text-[#1A1F3C]">Columnas visibles</p>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={() => onChange(new Set(columns.map((c) => c.key)))} className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white hover:bg-[#0A1340]">Todas</button>
          <button type="button" onClick={() => onChange(new Set(columns.map((c) => c.key)))} className="flex-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100">Limpiar</button>
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-1.5">
        {columns.map((col) => {
          const active = visible.has(col.key);
          return (
            <button key={col.key} type="button" onClick={() => toggle(col.key)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50">
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition", active ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white")}>
                {active && <Check className="h-3 w-3" />}
              </span>
              <span className={cn("truncate text-[11px] font-semibold", active ? "text-[#1A1F3C]" : "text-slate-400")}>{col.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColumnFilterDropdown({ label, values, selected, onToggle, onClear, onClose }) {
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  const filteredValues = query
    ? values.filter(([labelValue]) => labelValue.toLowerCase().includes(query.toLowerCase()))
    : values;

  const allSelected = values.length > 0 && values.every(([labelValue]) => selected.has(labelValue));

  function toggleAll() {
    const noSeleccionados = values.filter(([labelValue]) => !selected.has(labelValue));
    if (noSeleccionados.length === 0) {
      values.forEach(([labelValue]) => { if (selected.has(labelValue)) onToggle(labelValue); });
    } else {
      noSeleccionados.forEach(([labelValue]) => onToggle(labelValue));
    }
  }

  return (
    <div ref={ref} className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border bg-white shadow-2xl" style={{ borderColor: C.border }}>
      <div className="border-b px-2.5 py-2" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <p className="truncate text-[11px] font-bold text-[#1A1F3C]">{label}</p>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-[11px] text-slate-700 outline-none transition focus:border-[#131E5C]/40 focus:ring-1 focus:ring-[#131E5C]/20"
          />
        </div>
      </div>
      <button type="button" onClick={toggleAll} className="flex w-full items-center gap-2 border-b border-slate-100 px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#131E5C] transition hover:bg-slate-50">
        <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition", allSelected ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white")}>
          {allSelected && <Check className="h-2.5 w-2.5" />}
        </span>
        (Seleccionar todo)
      </button>
      <ul className="max-h-52 overflow-y-auto py-1">
        {filteredValues.length === 0 ? (
          <li className="px-3 py-4 text-center text-[11px] text-slate-400">Sin resultados</li>
        ) : filteredValues.map(([labelValue]) => {
          const check = selected.has(labelValue);
          return (
            <li key={labelValue}>
              <button type="button" onClick={() => onToggle(labelValue)} className="flex w-full items-center gap-2 px-2.5 py-1 text-left transition hover:bg-slate-50">
                <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition", check ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white")}>
                  {check && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700" title={labelValue}>{labelValue}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2 border-t px-2.5 py-2" style={{ borderColor: C.border }}>
        <button type="button" onClick={onClear} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50">Limpiar</button>
        <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#0A1340]">OK</button>
      </div>
    </div>
  );
}

const STORAGE_COLUMNAS = "ventasvn_columnas_visibles";
const STORAGE_FILTROS = "ventasvn_filtros_columnas";

export default function InteractiveTable({
  rows,
  columns,
  total,
  loading,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  onPrev,
  onNext,
}) {
  // Columnas visibles persistentes en localStorage (hasta que se limpie)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const guardadas = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_COLUMNAS)); }
      catch { return null; }
    })();
    if (Array.isArray(guardadas) && guardadas.length > 0) {
      const validas = guardadas.filter((k) => columns.some((c) => c.key === k));
      if (validas.length > 0) return new Set(validas);
    }
    return new Set(columns.map((c) => c.key));
  });
  const [showColumns, setShowColumns] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [colFilters, setColFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_FILTROS)) || {}; }
    catch { return {}; }
  });
  const [seleccionado, setSeleccionado] = useState(null);
  const [openFilter, setOpenFilter] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_FILTROS, JSON.stringify(colFilters)); }
    catch { /* ignore */ }
  }, [colFilters]);

  const visibleCols = useMemo(() => columns.filter((c) => visibleColumns.has(c.key)), [columns, visibleColumns]);

  function cambiarColumnas(next) {
    setVisibleColumns(next);
    try { localStorage.setItem(STORAGE_COLUMNAS, JSON.stringify(Array.from(next))); }
    catch { /* ignore */ }
  }

  const filtered = useMemo(() => {
    let result = rows;
    const activeFilters = Object.entries(colFilters).filter(([, v]) => Array.isArray(v) && v.length > 0);
    if (activeFilters.length > 0) {
      result = result.filter((row) => activeFilters.every(([key, vals]) => {
        const col = columns.find((c) => c.key === key);
        const cellVal = formatCell(row[key], col?.tipo).trim().toLowerCase();
        return vals.some((value) => cellVal === value.toLowerCase());
      }));
    }
    if (sort.key) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        result = [...result].sort((a, b) => {
          const va = rawValue(a, col);
          const vb = rawValue(b, col);
          let cmp;
          if (col.tipo === "moneda") cmp = (numero(va) ?? 0) - (numero(vb) ?? 0);
          else cmp = String(va).localeCompare(String(vb), "es", { numeric: true });
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [rows, columns, sort, colFilters]);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  }

  function headerSortIcon(col) {
    if (sort.key === col.key) return sort.dir === "asc" ? <ArrowUp className="h-3 w-3 text-white" /> : <ArrowDown className="h-3 w-3 text-white" />;
    return <ArrowUpDown className="h-3 w-3 text-white/50" />;
  }

  function uniqueValues(col) {
    const set = new Map();
    rows.forEach((row) => {
      const v = formatCell(row[col.key], col.tipo).trim();
      const label = v || "(Vacío)";
      if (!set.has(label)) set.set(label, v === "" ? "" : v);
    });
    return Array.from(set.entries()).sort((a, b) => a[0].localeCompare(b[0], "es", { numeric: true }));
  }

  const tol = ((k) => { const v = colFilters[k]; return Array.isArray(v) ? new Set(v) : new Set(); });
  const activarFilter = (k) => setOpenFilter((prev) => (prev === k ? null : k));

  function toggleFilterValue(colKey, value) {
    setColFilters((prev) => {
      const current = Array.isArray(prev[colKey]) ? new Set(prev[colKey]) : new Set();
      if (current.has(value)) current.delete(value); else current.add(value);
      return { ...prev, [colKey]: Array.from(current) };
    });
  }

  function limpiarColumna(colKey) {
    setColFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  }

  function limpiarTodosLosFiltros() {
    setColFilters({});
    setOpenFilter(null);
  }

  const hayFiltrosColumna = Object.values(colFilters).some((v) => Array.isArray(v) && v.length > 0);

  function exportExcel() {
    if (filtered.length === 0) return;
    const header = visibleCols.map((c) => c.label);
    const body = filtered.map((row) => visibleCols.map((c) => formatCell(row[c.key], c.tipo)));
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws["!cols"] = visibleCols.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Autos Nuevos");
    XLSX.writeFile(wb, `venta_autos_nuevos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: C.border, boxShadow: "0 4px 16px rgba(19,30,92,.04)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: C.border }}>
        <p className="text-xs font-semibold text-[#515778]">
          <span className="font-bold text-slate-700">{filtered.length.toLocaleString("es-MX")}</span> visibles ·{" "}
          <span className="font-bold text-slate-700">{total.toLocaleString("es-MX")}</span> totales
        </p>

        <div className="relative flex items-center gap-2">
          <button type="button" onClick={limpiarTodosLosFiltros} disabled={!hayFiltrosColumna} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
            <ListFilter className="h-3.5 w-3.5" />Limpiar filtros
          </button>
          <button type="button" onClick={exportExcel} disabled={filtered.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-[#131E5C] hover:bg-[#131E5C]/5 disabled:cursor-not-allowed disabled:opacity-40">
            <Sheet className="h-3.5 w-3.5" />Exportar Excel
          </button>
          <button type="button" onClick={() => setShowColumns((p) => !p)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold", showColumns ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-200 text-[#131E5C] hover:bg-[#131E5C]/5")}>
            <Eye className="h-3.5 w-3.5" />Columnas
          </button>
          {showColumns && <ColumnChooser columns={columns} visible={visibleColumns} onChange={cambiarColumnas} onClose={() => setShowColumns(false)} />}
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[65vh] min-h-[360px] overflow-auto">
        <table className="min-w-max border-collapse">
          <thead className="sticky top-0 z-20">
            <tr style={{ backgroundColor: C.navy }}>
              {visibleCols.map((col) => {
                const activo = tol(col.key).size > 0;
                return (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2 text-left" style={{ backgroundColor: C.navy }}>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => toggleSort(col.key)} className="flex items-center gap-1 rounded px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10" title={`Ordenar por ${col.label}`}>
                        {headerSortIcon(col)}
                        <span>{col.label}</span>
                      </button>
                      <span className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); activarFilter(col.key); }}
                          title="Filtrar por columna"
                          className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-white transition",
                            activo ? "bg-yellow-400 text-[#131E5C]" : "text-white/50 hover:bg-white/15 hover:text-white")}
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {openFilter === col.key && (
                          <ColumnFilterDropdown
                            label={col.label}
                            values={uniqueValues(col)}
                            selected={tol(col.key)}
                            onToggle={(value) => toggleFilterValue(col.key, value)}
                            onClear={() => limpiarColumna(col.key)}
                            onClose={() => setOpenFilter(null)}
                          />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>{visibleCols.map((col) => <td key={col.key} className="border-b border-r border-slate-100 px-3 py-2.5"><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="px-6 py-16 text-center">
                  <Layers className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No se encontraron registros</p>
                  <p className="mt-1 text-xs text-slate-400">Modifica la página o los filtros de la consulta para ver más resultados.</p>
                </td>
              </tr>
            ) : filtered.map((registro, index) => (
              <tr
                key={`${registro.nr_mov || ""}-${registro.nr_nota || ""}-${registro.serie || ""}-${index}`}
                onClick={() => setSeleccionado(registro)}
                className="cursor-pointer transition-colors odd:bg-white even:bg-[#EAF1FF] hover:bg-blue-50/70 active:bg-blue-100/70"
                title="Ver detalle del auto"
              >
                {visibleCols.map((col) => {
                  const value = formatCell(registro[col.key], col.tipo);
                  const monedaNegativa = col.tipo === "moneda" && numero(registro[col.key]) !== null && numero(registro[col.key]) < 0;
                  return <td key={col.key} title={value} className={cn("max-w-[300px] whitespace-nowrap border-b border-r border-slate-100 px-3 py-2.5 text-xs", monedaNegativa ? "font-semibold text-red-600" : "text-slate-700")}><div className="max-w-[280px] truncate">{value}</div></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Mostrando</span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
              <span className="text-[10px] font-semibold text-slate-400">por pág.</span>
              <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="bg-transparent text-xs font-bold text-slate-700 outline-none">
                <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={250}>250</option><option value={500}>500</option>
              </select>
            </span>
            <span className="text-slate-500">de <span className="font-bold text-slate-700">{total.toLocaleString("es-MX")}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={loading || page <= 1} onClick={onPrev} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[100px] text-center text-xs font-semibold text-slate-600">Página {page} de {totalPages}</span>
          <button type="button" disabled={loading || page >= totalPages} onClick={onNext} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {seleccionado && (
        <DetallePopup registro={seleccionado} columns={columns} onClose={() => setSeleccionado(null)} />
      )}
    </div>
  );
}
