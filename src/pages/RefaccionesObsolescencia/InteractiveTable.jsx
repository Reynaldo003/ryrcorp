import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
    ArrowDown, ArrowUp, ArrowUpDown, Boxes, CalendarDays, Check,
    ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Eye, Filter,
    Layers, ListFilter, MapPin, PackageSearch, Search, Sheet, Tags, X,
} from "lucide-react";

const C = {
    navy: "#131E5C",
    navyDark: "#0A1340",
    border: "#E4E7F0",
    surface: "#F7F8FC",
};

function cn(...parts) { return parts.filter(Boolean).join(" "); }

function numero(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function formatDate(value) {
    if (!value) return "—";
    const partes = String(value).split("-");
    if (partes.length !== 3) return String(value);
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function money(value, decimals = 0) {
    if (value === null || value === undefined || value === "") return "—";
    const n = numero(value);
    if (n === null) return String(value);

    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(n);
}

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "—";
    const n = numero(value);
    if (n === null) return String(value);

    return n.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

function formatCell(value, tipo) {
    if (value === null || value === undefined || value === "") return "—";
    if (tipo === "fecha") return formatDate(value);
    if (tipo === "moneda") return money(value);
    if (tipo === "moneda4") return money(value, 4);
    if (tipo === "numero" || tipo === "entero") return formatNumber(value);
    return String(value);
}

function rawValue(row, col) {
    const value = row[col.key];
    if (value === null || value === undefined || value === "") return "";

    if (["moneda", "moneda4", "numero", "entero"].includes(col.tipo)) return numero(value) ?? 0;
    return String(value);
}

function DetallePopup({ registro, columns, onClose }) {
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        function onEsc(event) {
            if (event.key === "Escape") cerrar();
        }

        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, []);

    function cerrar() {
        setClosing(true);
        setTimeout(onClose, 180);
    }

    function get(key) {
        const col = columns.find((item) => item.key === key);
        return formatCell(registro[key], col?.tipo);
    }

    function sinVacios(items) {
        return items.filter((item) => item.valor !== "—");
    }

    const secciones = [
        {
            titulo: "Producto",
            icono: PackageSearch,
            items: sinVacios([
                { etiqueta: "Código producto", valor: get("cod_produto") },
                { etiqueta: "Producto", valor: get("nm_produto") },
                { etiqueta: "Nombre estandarizado", valor: get("nombre_estandarizado") },
                { etiqueta: "Línea producto", valor: get("cod_linha_prod") },
                { etiqueta: "Unidad", valor: get("unidade") },
            ]),
        },
        {
            titulo: "Ubicación",
            icono: MapPin,
            items: sinVacios([
                { etiqueta: "Agencia", valor: get("agencia") },
                { etiqueta: "Localización", valor: get("localizacao") },
            ]),
        },
        {
            titulo: "Inventario",
            icono: Boxes,
            items: sinVacios([
                { etiqueta: "Qt. Inventario", valor: get("qt_inventario") },
                { etiqueta: "Existencia", valor: get("qtde_estoque") },
                { etiqueta: "Reservada", valor: get("qt_reservada") },
                { etiqueta: "Pedida", valor: get("qt_pedida") },
            ]),
        },
        {
            titulo: "Valores",
            icono: CircleDollarSign,
            items: sinVacios([
                { etiqueta: "Valor inventario", valor: get("vr_estoque") },
                { etiqueta: "Valor unitario medio", valor: get("vr_unitario_medio") },
                { etiqueta: "Valor última compra", valor: get("vr_uni_ult_cpa") },
            ]),
        },
        {
            titulo: "Clasificación",
            icono: Tags,
            items: sinVacios([
                { etiqueta: "Grupo principal", valor: get("grupo_principal") },
                { etiqueta: "Subgrupo", valor: get("subgrupo") },
                { etiqueta: "Categoría", valor: get("categoria") },
                { etiqueta: "Capa obsolescencia", valor: get("capa_obsolescencia") },
                { etiqueta: "Categoría movimiento", valor: get("categoria_movimiento") },
            ]),
        },
        {
            titulo: "Movimientos",
            icono: Clock3,
            items: sinVacios([
                { etiqueta: "Días sin movimiento", valor: get("dias_desde_ultimo_movimiento") },
                { etiqueta: "Última venta", valor: get("fecha_ultima_venta") },
                { etiqueta: "Última compra", valor: get("fecha_ult_comp_prod") },
                { etiqueta: "Último pedido", valor: get("fecha_ult_ped_prod") },
                { etiqueta: "Última act. producto", valor: get("fecha_ult_actu_prod") },
                { etiqueta: "Fecha referencia", valor: get("fecha_referencia") },
            ]),
        },
        {
            titulo: "Historial",
            icono: CalendarDays,
            items: sinVacios([
                { etiqueta: "Registro refacción", valor: get("fecha_regis_refac") },
                { etiqueta: "Inventario refacción", valor: get("fecha_inventario_refac") },
                { etiqueta: "Primera compra", valor: get("fecha_primera_compra_refac") },
                { etiqueta: "Actualización refacción", valor: get("fecha_actualizacion_refac") },
            ]),
        },
    ].filter((seccion) => seccion.items.length > 0);

    const titulo = get("nombre_estandarizado") !== "—" ? get("nombre_estandarizado") : get("nm_produto");
    const subtitulo = [get("cod_produto"), get("agencia"), get("localizacao")].filter((item) => item !== "—").join(" · ");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-[#0A1340]/60 backdrop-blur-sm" onClick={cerrar} />

            <div className={cn("relative w-full max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-2xl transition-all duration-200", closing ? "scale-95 opacity-0" : "scale-100 opacity-100")} style={{ borderColor: C.border }}>
                <div className="relative overflow-hidden px-6 py-6 text-white" style={{ background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDark} 100%)` }}>
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
                                <PackageSearch className="h-4 w-4" />Detalle de refacción
                            </div>
                            <h2 className="mt-2 truncate text-2xl font-black tracking-tight">{titulo}</h2>
                            <p className="mt-1 truncate text-sm font-medium text-white/70">{subtitulo}</p>
                        </div>

                        <button type="button" onClick={cerrar} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/25">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="relative mt-4 flex flex-wrap gap-2">
                        {get("agencia") !== "—" && <Badge>{get("agencia")}</Badge>}
                        {get("capa_obsolescencia") !== "—" && <Badge>Capa {get("capa_obsolescencia")}</Badge>}
                        {get("categoria_movimiento") !== "—" && <Badge>{get("categoria_movimiento")}</Badge>}
                        {get("dias_desde_ultimo_movimiento") !== "—" && <Badge>{get("dias_desde_ultimo_movimiento")} días sin movimiento</Badge>}
                    </div>
                </div>

                <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {secciones.map((seccion) => {
                            const Icon = seccion.icono;

                            return (
                                <section key={seccion.titulo} className="min-w-0">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7F8FC] text-[#131E5C]"><Icon className="h-4 w-4" /></span>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-[#131E5C]">{seccion.titulo}</h3>
                                    </div>

                                    <div className="rounded-2xl border border-[#E4E7F0] bg-white px-4 py-1">
                                        {seccion.items.map((item) => (
                                            <div key={item.etiqueta} className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
                                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.etiqueta}</span>
                                                <span className="min-w-0 break-words text-right text-xs font-bold text-[#1A1F3C]">{item.valor}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>

                    {get("observacion") !== "—" && (
                        <section className="mt-5">
                            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#131E5C]">Observación</h3>
                            <div className="rounded-2xl border border-[#E4E7F0] bg-[#F7F8FC] p-4 text-sm text-slate-700">{get("observacion")}</div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function Badge({ children }) {
    return <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">{children}</span>;
}

function ColumnChooser({ columns, visible, onChange, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        function onDocument(event) {
            if (ref.current && !ref.current.contains(event.target)) onClose();
        }

        document.addEventListener("mousedown", onDocument);
        return () => document.removeEventListener("mousedown", onDocument);
    }, [onClose]);

    function toggle(key) {
        const next = new Set(visible);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        onChange(next);
    }

    return (
        <div ref={ref} className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-[#E4E7F0] bg-white shadow-2xl">
            <div className="border-b border-[#E4E7F0] bg-[#F7F8FC] px-3 py-2.5">
                <p className="text-xs font-bold text-[#1A1F3C]">Columnas visibles</p>

                <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => onChange(new Set(columns.map((col) => col.key)))} className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white">Mostrar todas</button>
                    <button type="button" onClick={() => onChange(new Set())} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold text-slate-600">Ocultar todas</button>
                </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-1.5">
                {columns.map((col) => {
                    const activo = visible.has(col.key);

                    return (
                        <button key={col.key} type="button" onClick={() => toggle(col.key)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50">
                            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", activo ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white")}>
                                {activo && <Check className="h-3 w-3" />}
                            </span>
                            <span className={cn("truncate text-[11px] font-semibold", activo ? "text-[#1A1F3C]" : "text-slate-400")}>{col.label}</span>
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
        function onDocument(event) {
            if (ref.current && !ref.current.contains(event.target)) onClose();
        }

        document.addEventListener("mousedown", onDocument);
        return () => document.removeEventListener("mousedown", onDocument);
    }, [onClose]);

    const filteredValues = useMemo(() => {
        if (!query) return values;
        return values.filter(([value]) => value.toLowerCase().includes(query.toLowerCase()));
    }, [query, values]);

    return (
        <div ref={ref} className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[#E4E7F0] bg-white shadow-2xl">
            <div className="border-b border-[#E4E7F0] bg-[#F7F8FC] px-2.5 py-2">
                <p className="truncate text-[11px] font-bold text-[#1A1F3C]">{label}</p>

                <div className="relative mt-1.5">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-[11px] text-slate-700 outline-none focus:border-[#131E5C]/40" />
                </div>
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
                {filteredValues.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[11px] text-slate-400">Sin resultados</p>
                ) : filteredValues.map(([value]) => {
                    const activo = selected.has(value);

                    return (
                        <button key={value} type="button" onClick={() => onToggle(value)} className="flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-slate-50">
                            <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded border", activo ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white")}>
                                {activo && <Check className="h-2.5 w-2.5" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">{value}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2 border-t border-[#E4E7F0] px-2.5 py-2">
                <button type="button" onClick={onClear} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold text-slate-600">Limpiar</button>
                <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white">OK</button>
            </div>
        </div>
    );
}

export default function InteractiveTable({ rows, columns, total, loading, pageSize, onPageSizeChange, page, totalPages, onPrev, onNext, storageKey = "default" }) {
    const keyColumnas = `${storageKey}_columnas_visibles`;
    const keyFiltros = `${storageKey}_filtros_columnas`;

    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const guardadas = JSON.parse(localStorage.getItem(keyColumnas));

            if (Array.isArray(guardadas)) {
                const validas = guardadas.filter((key) => columns.some((col) => col.key === key));
                if (validas.length > 0) return new Set(validas);
            }
        } catch {
            // Ignorar
        }

        return new Set(columns.map((col) => col.key));
    });

    const [showColumns, setShowColumns] = useState(false);
    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [colFilters, setColFilters] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(keyFiltros)) || {};
        } catch {
            return {};
        }
    });
    const [seleccionado, setSeleccionado] = useState(null);
    const [openFilter, setOpenFilter] = useState(null);

    useEffect(() => {
        try {
            localStorage.setItem(keyColumnas, JSON.stringify(Array.from(visibleColumns)));
        } catch {
            // Ignorar
        }
    }, [visibleColumns, keyColumnas]);

    useEffect(() => {
        try {
            localStorage.setItem(keyFiltros, JSON.stringify(colFilters));
        } catch {
            // Ignorar
        }
    }, [colFilters, keyFiltros]);

    const visibleCols = useMemo(() => columns.filter((col) => visibleColumns.has(col.key)), [columns, visibleColumns]);

    const filtered = useMemo(() => {
        let result = rows;

        const activeFilters = Object.entries(colFilters).filter(([, values]) => Array.isArray(values) && values.length > 0);

        if (activeFilters.length > 0) {
            result = result.filter((row) => activeFilters.every(([key, values]) => {
                const col = columns.find((item) => item.key === key);
                const value = formatCell(row[key], col?.tipo).trim().toLowerCase();
                return values.some((selected) => selected.toLowerCase() === value);
            }));
        }

        if (sort.key) {
            const col = columns.find((item) => item.key === sort.key);

            if (col) {
                result = [...result].sort((a, b) => {
                    const aValue = rawValue(a, col);
                    const bValue = rawValue(b, col);

                    let comparacion;

                    if (["moneda", "moneda4", "numero", "entero"].includes(col.tipo)) comparacion = Number(aValue || 0) - Number(bValue || 0);
                    else comparacion = String(aValue).localeCompare(String(bValue), "es", { numeric: true });

                    return sort.dir === "asc" ? comparacion : -comparacion;
                });
            }
        }

        return result;
    }, [rows, columns, colFilters, sort]);

    function toggleSort(key) {
        setSort((prev) => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
    }

    function sortIcon(col) {
        if (sort.key !== col.key) return <ArrowUpDown className="h-3 w-3 text-white/50" />;
        return sort.dir === "asc" ? <ArrowUp className="h-3 w-3 text-white" /> : <ArrowDown className="h-3 w-3 text-white" />;
    }

    function uniqueValues(col) {
        const values = new Map();

        rows.forEach((row) => {
            const value = formatCell(row[col.key], col.tipo).trim();
            const label = value || "(Vacío)";
            if (!values.has(label)) values.set(label, value);
        });

        return Array.from(values.entries()).sort((a, b) => a[0].localeCompare(b[0], "es", { numeric: true }));
    }

    function selectedValues(key) {
        return new Set(Array.isArray(colFilters[key]) ? colFilters[key] : []);
    }

    function toggleFilterValue(key, value) {
        setColFilters((prev) => {
            const current = new Set(Array.isArray(prev[key]) ? prev[key] : []);
            if (current.has(value)) current.delete(value);
            else current.add(value);
            return { ...prev, [key]: Array.from(current) };
        });
    }

    function limpiarColumna(key) {
        setColFilters((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    function limpiarFiltros() {
        setColFilters({});
        setOpenFilter(null);
    }

    const hayFiltros = Object.values(colFilters).some((values) => Array.isArray(values) && values.length > 0);

    function exportExcel() {
        if (filtered.length === 0) return;

        const header = visibleCols.map((col) => col.label);
        const body = filtered.map((row) => visibleCols.map((col) => row[col.key] ?? ""));

        const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);
        worksheet["!cols"] = visibleCols.map((col) => ({ wch: Math.min(Math.max(col.label.length + 5, 15), 35) }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Obsolescencia");
        XLSX.writeFile(workbook, `refacciones_obsolescencia_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#E4E7F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-[#515778]">
                    <span className="font-bold text-slate-700">{filtered.length.toLocaleString("es-MX")}</span> visibles ·{" "}
                    <span className="font-bold text-slate-700">{Number(total || 0).toLocaleString("es-MX")}</span> totales
                </p>

                <div className="relative flex flex-wrap items-center gap-2">
                    <button type="button" onClick={limpiarFiltros} disabled={!hayFiltros} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-40">
                        <ListFilter className="h-3.5 w-3.5" />Limpiar filtros
                    </button>

                    <button type="button" onClick={exportExcel} disabled={filtered.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-[#131E5C] transition hover:bg-[#131E5C]/5 disabled:opacity-40">
                        <Sheet className="h-3.5 w-3.5" />Exportar Excel
                    </button>

                    <button type="button" onClick={() => setShowColumns((prev) => !prev)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold", showColumns ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-200 text-[#131E5C] hover:bg-[#131E5C]/5")}>
                        <Eye className="h-3.5 w-3.5" />Columnas
                    </button>

                    {showColumns && <ColumnChooser columns={columns} visible={visibleColumns} onChange={setVisibleColumns} onClose={() => setShowColumns(false)} />}
                </div>
            </div>

            <div className="max-h-[65vh] min-h-[420px] overflow-auto">
                <table className="min-w-max border-collapse">
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-[#131E5C]">
                            {visibleCols.map((col) => {
                                const filtroActivo = selectedValues(col.key).size > 0;

                                return (
                                    <th key={col.key} className="whitespace-nowrap bg-[#131E5C] px-3 py-2 text-left">
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => toggleSort(col.key)} className="flex items-center gap-1 rounded px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10">
                                                {sortIcon(col)}
                                                <span>{col.label}</span>
                                            </button>

                                            <span className="relative">
                                                <button type="button" onClick={(event) => { event.stopPropagation(); setOpenFilter((prev) => prev === col.key ? null : col.key); }} className={cn("inline-flex h-5 w-5 items-center justify-center rounded transition", filtroActivo ? "bg-yellow-400 text-[#131E5C]" : "text-white/50 hover:bg-white/15 hover:text-white")}>
                                                    <Filter className="h-3 w-3" />
                                                </button>

                                                {openFilter === col.key && (
                                                    <ColumnFilterDropdown
                                                        label={col.label}
                                                        values={uniqueValues(col)}
                                                        selected={selectedValues(col.key)}
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
                            Array.from({ length: 12 }).map((_, index) => (
                                <tr key={index}>
                                    {visibleCols.map((col) => (
                                        <td key={col.key} className="border-b border-r border-slate-100 px-3 py-2.5">
                                            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={Math.max(visibleCols.length, 1)} className="px-6 py-16 text-center">
                                    <Layers className="mx-auto h-8 w-8 text-slate-300" />
                                    <p className="mt-3 text-sm font-semibold text-slate-700">No se encontraron registros</p>
                                    <p className="mt-1 text-xs text-slate-400">Modifica los filtros para consultar otros registros.</p>
                                </td>
                            </tr>
                        ) : filtered.map((registro, index) => (
                            <tr
                                key={`${registro.agencia || ""}-${registro.cod_produto || ""}-${registro.localizacao || ""}-${index}`}
                                onClick={() => setSeleccionado(registro)}
                                className="cursor-pointer transition-colors odd:bg-white even:bg-[#EAF1FF] hover:bg-blue-50/70 active:bg-blue-100/70"
                                title="Ver detalle de la refacción"
                            >
                                {visibleCols.map((col) => {
                                    const value = formatCell(registro[col.key], col.tipo);
                                    const negativo = ["moneda", "moneda4", "numero", "entero"].includes(col.tipo) && numero(registro[col.key]) !== null && numero(registro[col.key]) < 0;

                                    return (
                                        <td key={col.key} title={value} className={cn("max-w-[340px] whitespace-nowrap border-b border-r border-slate-100 px-3 py-2.5 text-xs", negativo ? "font-semibold text-red-600" : "text-slate-700")}>
                                            <div className="max-w-[320px] truncate">{value}</div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 bg-[#F7F8FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Mostrar</span>

                    <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none">
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                        <option value={500}>500</option>
                    </select>

                    <span className="text-slate-500">
                        de <span className="font-bold text-slate-700">{Number(total || 0).toLocaleString("es-MX")}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button type="button" disabled={loading || page <= 1} onClick={onPrev} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="min-w-[110px] text-center text-xs font-semibold text-slate-600">
                        Página {page} de {totalPages}
                    </span>

                    <button type="button" disabled={loading || page >= totalPages} onClick={onNext} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {seleccionado && <DetallePopup registro={seleccionado} columns={columns} onClose={() => setSeleccionado(null)} />}
        </div>
    );
}