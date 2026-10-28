// src/pages/VentasVN/VentasUsados.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDown, ArrowUp, BarChart3, CalendarDays, Car, CreditCard, Eraser,
    CircleDollarSign, Database, Download, ImageDown, LoaderCircle, RefreshCw, RotateCcw,
    Search, SlidersHorizontal, Tags, User, Users, CheckCircle2, Globe,
    Table2, TrendingUp, WalletCards, X, Check, Plus, ChevronDown,
} from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell, Sector,
    XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from "recharts";
import html2canvas from "html2canvas-pro";
import { http, buildQuery } from "../../lib/apiClient";
import { CONDICION_USO, getVentasVNDashboard, } from "../../lib/apiVentasVN";
import ExportReportModal from "../../components/ExportReportModal";
import InteractiveTable from "../VentasVN/InteractiveTable";

const C = {
    navy: "#131E5C", navyDark: "#0A1340", navyMid: "#2445A2", navyLight: "#6681D4",
    surface: "#F7F8FC", border: "#E4E7F0", borderMd: "#C8CEDF", muted: "#8891AD",
    text: "#1A1F3C", textSub: "#515778", success: "#059669", successBg: "#ECFDF5",
};

function cn(...parts) { return parts.filter(Boolean).join(" "); }

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
    { key: "tipo_venta", label: "Tipo de Venta" },
];

const COLUMNAS_REPORTE_USADOS = COLUMNAS;

// Selección inicial equilibrada: identificación, operación y finanzas.
const COLUMNAS_REPORTE_USADOS_DEFAULT = [
    "serie", "nr_nota", "producto_servicio", "fecha_emision", "situacion",
    "nombre_marca", "nombre_familia", "asesor", "agencia", "condicion_uso",
    "nombre_condicion_pago", "valor_factura", "valor_compra", "tipo_venta",
];

const CAMPOS_MONEDA_REPORTE_USADOS = new Set([
    "precio_unitario", "valor_bruto_item", "valor_descuento_item", "valor_factura",
    "valor_factura_sin_iva", "valor_compra", "isan", "iva", "valor_total_productos",
]);
const CAMPOS_FECHA_REPORTE_USADOS = new Set(["fecha_emision", "fecha_ultima_venta"]);

const SECCIONES_REPORTE_USADOS = [
    { key: "summary", label: "Resumen ejecutivo", description: "KPIs, totales y filtros aplicados al reporte.", defaultSelected: true },
    { key: "charts", label: "Análisis gráfico", description: "Visualizaciones de ventas, margen y distribución.", defaultSelected: true },
    { key: "table", label: "Detalle de operaciones", description: "Tabla configurable con las columnas elegidas.", defaultSelected: true },
];

const GRAFICAS_REPORTE_USADOS = [
    { key: "mes", label: "Tendencia por mes", description: "Unidades vendidas e ingresos por mes dentro del periodo.", type: "line", category: "Tendencia", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "asesor", label: "Rendimiento por asesor", description: "Top de asesores por unidades vendidas.", type: "bar", category: "Operación", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "familia", label: "Modelos con mayor movimiento", description: "Top de familias y modelos por unidades vendidas.", type: "bar", category: "Producto", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "agencia", label: "Ventas por agencia", description: "Distribución de unidades vendidas entre agencias.", type: "bar", category: "Distribución", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "condicion_pago", label: "Condición de pago", description: "Composición de las ventas por condición de pago.", type: "donut", category: "Comercial", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "tipo_venta", label: "Canal de venta", description: "Comparativo entre venta digital y venta tradicional.", type: "donut", category: "Canal", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "marca", label: "Distribución por marca", description: "Participación de unidades vendidas por marca.", type: "donut", category: "Producto", metric: "Unidades", defaultSelected: false, recommended: false },
];

const COLORES_REPORTE_USADOS = ["#131E5C", "#2445A2", "#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#D4537E", "#F0A500"];
const TOOLTIP_REPORTE_USADOS = { fontSize: 11, borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,.08)" };

const FILTROS_INICIALES = {
    q: "",
    agencia: "",
    asesor: "",
    familia: "",
    condicion_pago: "",
    serie: "",
    nr_nota: "",
    producto_servicio: "",
    fecha_desde: "",
    fecha_hasta: "",
    venta_digital: "",
};
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
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
const CONCESIONARIOS_VENTAS = [
    { id: "todas", label: "Todas las agencias" },
    { id: "cordoba", label: "VW Córdoba", claves: ["cordoba"] },
    { id: "orizaba", label: "VW Orizaba", claves: ["orizaba"] },
    { id: "poza-rica", label: "VW Poza Rica", claves: ["poza rica", "poza"] },
    { id: "tuxpan", label: "VW Tuxpan", claves: ["tuxpan"] },
    { id: "tuxtepec", label: "VW Tuxtepec", claves: ["tuxtepec"] },
    { id: "vc", label: "R&R VC", claves: ["r&r vc", "vehiculos comerciales", "comerciales"] },
];
function normalizarNombreAgencia(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

// Normaliza el VIN para permitir búsquedas pegadas con espacios o guiones.
function normalizarBusquedaVIN(valor) {
    return String(valor || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

function esVINCompleto(valor) {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizarBusquedaVIN(valor));
}
const TOOLTIP_STYLE = { border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(19,30,92,.12)", fontSize: 12 };
const inputClass = "h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10";

function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }
function formatoCompacto(value) { return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numero(value)); }
function money(value) {
    if (value === null || value === undefined || value === "") return "—";
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
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
function obtenerRangoMes(mes, anio) {
    const anioN = Number(anio) || 2000;
    const mesN = Number(mes);
    if (mesN < 1 || mesN > 12) return {};
    const desde = new Date(anioN, mesN - 1, 1);
    const hasta = new Date(anioN, mesN, 0);
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

function agruparReporteUsados(rows, getter, limit = null) {
    const map = new Map();
    rows.forEach((row) => {
        const raw = typeof getter === "function" ? getter(row) : row?.[getter];
        const key = String(raw ?? "").trim() || "Sin dato";
        map.set(key, (map.get(key) || 0) + 1);
    });
    const data = Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    return limit ? data.slice(0, limit) : data;
}

function valorReporteUsados(row, key) {
    if (!row) return "";
    if (CAMPOS_MONEDA_REPORTE_USADOS.has(key)) return money(row[key]);
    if (CAMPOS_FECHA_REPORTE_USADOS.has(key)) {
        const raw = row[key];
        if (!raw) return "—";
        const [y, m, d] = String(raw).split("-");
        return y && m && d ? `${d}/${m}/${y}` : String(raw);
    }
    if (key === "tipo_venta") return row.tipo_venta || (row.es_venta_digital ? "Venta digital" : "Tradicional");
    return row[key] ?? "";
}

function nombreReporteUsados(config, extension) {
    const ahora = new Date();
    const sello = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}_${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;
    const base = String(config?.fileName || "").trim().replace(/\.(xlsx|pdf)$/i, "").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "_").replace(/^_+|_+$/g, "");
    return `${base || `reporte_autos_usados_${sello}`}.${extension}`;
}

function descargarBlobReporteUsados(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function agregarCanvasPdfUsados(doc, canvas) {
    const margen = 8;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const anchoUtil = anchoPagina - margen * 2;
    const altoUtil = altoPagina - margen * 2;
    const pixelesPorMm = canvas.width / anchoUtil;
    const altoCortePx = Math.max(1, Math.floor(altoUtil * pixelesPorMm));
    let y = 0;
    let primera = true;

    while (y < canvas.height) {
        if (!primera) doc.addPage();
        primera = false;
        const altoActual = Math.min(altoCortePx, canvas.height - y);
        const corte = document.createElement("canvas");
        corte.width = canvas.width;
        corte.height = altoActual;
        const ctx = corte.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, corte.width, corte.height);
        ctx.drawImage(canvas, 0, y, canvas.width, altoActual, 0, 0, canvas.width, altoActual);
        doc.addImage(corte.toDataURL("image/png"), "PNG", margen, margen, anchoUtil, altoActual / pixelesPorMm, undefined, "FAST");
        y += altoActual;
    }
}

async function esperarRenderReporteUsados() {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 240));
}

function esperarPintadoProgreso() {
    // Deja que el navegador pinte el mensaje antes de un bloque de trabajo pesado.
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function ReporteCardUsados({ title, subtitle, children, wide = false }) {
    return (
        <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", wide && "xl:col-span-2")}>
            <h4 className="text-base font-black text-[#131E5C]">{title}</h4>
            <p className="mb-4 mt-1 text-xs text-slate-400">{subtitle}</p>
            {children}
        </div>
    );
}

function ReporteBarrasUsados({ data, color = "#131E5C", horizontal = false }) {
    if (!data.length) return <div className="flex h-[270px] items-center justify-center text-xs font-semibold text-slate-400">Sin datos en el periodo</div>;

    if (horizontal) {
        return (
            <ResponsiveContainer width="100%" height={270}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 38, left: 18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip contentStyle={TOOLTIP_REPORTE_USADOS} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                    <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" tick={{ fontSize: 9, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip contentStyle={TOOLTIP_REPORTE_USADOS} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} isAnimationActive={false} />
            </BarChart>
        </ResponsiveContainer>
    );
}

function ReporteDonaUsados({ data }) {
    if (!data.length) return <div className="flex h-[250px] items-center justify-center text-xs font-semibold text-slate-400">Sin datos en el periodo</div>;
    return (
        <div className="grid items-center gap-3 md:grid-cols-[1fr_180px]">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} isAnimationActive={false}>
                        {data.map((item, index) => <Cell key={item.name} fill={COLORES_REPORTE_USADOS[index % COLORES_REPORTE_USADOS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_REPORTE_USADOS} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
                {data.slice(0, 8).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-slate-500">
                            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORES_REPORTE_USADOS[index % COLORES_REPORTE_USADOS.length] }} />
                            <span className="truncate">{item.name}</span>
                        </span>
                        <strong className="text-slate-700">{formatoNumero(item.value)}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReporteGraficasUsados({ rows = [], charts = [] }) {
    const activos = useMemo(() => new Set(charts), [charts]);
    const vendidas = useMemo(
        () => rows.filter((row) => String(row.situacion || "").toUpperCase() === "E"),
        [rows],
    );
    const base = vendidas.length ? vendidas : rows;

    const porMes = useMemo(() => {
        const map = new Map();
        base.forEach((row) => {
            const periodo = String(row.fecha_emision || "").slice(0, 7);
            if (!/^\d{4}-\d{2}$/.test(periodo)) return;
            const actual = map.get(periodo) || {
                name: etiquetaMes({ mes: Number(periodo.slice(5, 7)), anio: periodo.slice(0, 4) }),
                value: 0,
                ingresos: 0,
            };
            actual.value += 1;
            actual.ingresos += numero(row.valor_factura_sin_iva) - numero(row.isan);
            map.set(periodo, actual);
        });
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item);
    }, [base]);
    const porAgencia = useMemo(() => agruparReporteUsados(base, "agencia", 10), [base]);
    const porAsesor = useMemo(() => agruparReporteUsados(base, (row) => row.asesor || "Sin asesor", 10), [base]);
    const porFamilia = useMemo(() => agruparReporteUsados(base, (row) => row.nombre_familia || "Sin familia", 10), [base]);
    const porMarca = useMemo(() => agruparReporteUsados(base, (row) => row.nombre_marca || "Sin marca", 8), [base]);
    const porCondicionPago = useMemo(() => agruparReporteUsados(base, (row) => row.nombre_condicion_pago || "Sin condición", 8), [base]);
    const porTipoVenta = useMemo(
        () => agruparReporteUsados(base, (row) => (row.tipo_venta || (row.es_venta_digital ? "Venta digital" : "Tradicional"))),
        [base],
    );

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {activos.has("mes") && (
                <ReporteCardUsados title="Tendencia por mes" subtitle="Unidades vendidas e ingresos del periodo" wide>
                    {porMes.length === 0 ? <div className="flex h-[280px] items-center justify-center text-xs font-semibold text-slate-400">Sin datos en el periodo</div> : (
                        <>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={porMes} margin={{ top: 10, right: 18, left: -8, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis yAxisId="unidades" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis yAxisId="ingresos" orientation="right" tickFormatter={formatoCompacto} tick={{ fontSize: 10, fill: "#64748b" }} width={60} />
                                    <Tooltip contentStyle={TOOLTIP_REPORTE_USADOS} formatter={(value, name) => [name === "Ingresos" ? money(value) : `${formatoNumero(value)} unidades`, name]} />
                                    <Bar yAxisId="unidades" dataKey="value" name="Unidades" fill="#131E5C" radius={[5, 5, 0, 0]} barSize={26} isAnimationActive={false} />
                                    <Line yAxisId="ingresos" type="monotone" dataKey="ingresos" name="Ingresos" stroke="#1D9E75" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-4 text-[11px] font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#131E5C]" /> Unidades</span>
                                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#1D9E75]" /> Ingresos</span>
                            </div>
                        </>
                    )}
                </ReporteCardUsados>
            )}
            {activos.has("asesor") && <ReporteCardUsados title="Rendimiento por asesor" subtitle="Top asesores por unidades vendidas"><ReporteBarrasUsados data={porAsesor} horizontal /></ReporteCardUsados>}
            {activos.has("familia") && <ReporteCardUsados title="Modelos con mayor movimiento" subtitle="Top familias por unidades vendidas"><ReporteBarrasUsados data={porFamilia} color="#2445A2" horizontal /></ReporteCardUsados>}
            {activos.has("agencia") && <ReporteCardUsados title="Ventas por agencia" subtitle="Unidades vendidas por agencia"><ReporteBarrasUsados data={porAgencia} color="#378ADD" /></ReporteCardUsados>}
            {activos.has("condicion_pago") && <ReporteCardUsados title="Condición de pago" subtitle="Composición de unidades vendidas"><ReporteDonaUsados data={porCondicionPago} /></ReporteCardUsados>}
            {activos.has("tipo_venta") && <ReporteCardUsados title="Canal de venta" subtitle="Venta digital vs. venta tradicional"><ReporteDonaUsados data={porTipoVenta} /></ReporteCardUsados>}
            {activos.has("marca") && <ReporteCardUsados title="Distribución por marca" subtitle="Unidades vendidas por marca"><ReporteDonaUsados data={porMarca} /></ReporteCardUsados>}
        </div>
    );
}

export default function VentasUsados() {
    const [dashboard, setDashboard] = useState({
        totales: {
            productos: 0,
            unidades_vendidas: 0,
            ingresos: 0,
            costo: 0,
            ventas_digitales: 0,
        },
        graficas: { por_mes: [], por_asesor: [], por_familia: [], por_condicion_pago: [] },
        opciones: { agencias: [], asesores: [], familias: [], condiciones_pago: [] },
    });
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();

    const anios = useMemo(
        () => Array.from({ length: 5 }, (_, i) => anioActual - i),
        [anioActual]
    );

    const [anioSel, setAnioSel] = useState("todos");
    const [mesSel, setMesSel] = useState("sin_filtro");

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [errorDashboard, setErrorDashboard] = useState("");
    const [registros, setRegistros] = useState([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [vistaActiva, setVistaActiva] = useState("detalle");
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [reporteUsadosExportacion, setReporteUsadosExportacion] = useState(null);
    const [filtros, setFiltros] = useState(() => ({
        ...FILTROS_INICIALES,
    }));
    const filtrosRef = useRef(filtros);
    filtrosRef.current = filtros;
    const [filtrosColumnas, setFiltrosColumnas] = useState({});
    const [qBuscado, setQBuscado] = useState("");

    useEffect(() => {
        const t = setTimeout(() => {
            setPagina(1);
            setQBuscado(filtros.q);
        }, 400);
        return () => clearTimeout(t);
    }, [filtros.q]);

    async function cargarDashboard() {
        setLoadingDashboard(true);
        setErrorDashboard("");

        try {
            const response = await getVentasVNDashboard({
                cond_uso: CONDICION_USO.USADO,
                fecha_desde: filtros.fecha_desde,
                fecha_hasta: filtros.fecha_hasta,
                agencia: filtros.agencia,
                asesor: filtros.asesor,
                familia: filtros.familia,
                condicion_pago: filtros.condicion_pago,
                serie: filtros.serie,
                nr_nota: filtros.nr_nota,
                producto_servicio: filtros.producto_servicio,
                venta_digital: filtros.venta_digital,
            });

            setDashboard({
                totales: {
                    productos: Number(response?.totales?.productos || 0),
                    unidades_vendidas: Number(
                        response?.totales?.unidades_vendidas || 0
                    ),
                    ingresos: Number(response?.totales?.ingresos || 0),
                    costo: Number(response?.totales?.costo || 0),
                    ventas_digitales: Number(
                        response?.totales?.ventas_digitales || 0
                    ),
                },
                graficas: {
                    por_mes: response?.graficas?.por_mes || [],
                    por_asesor: response?.graficas?.por_asesor || [],
                    por_familia: response?.graficas?.por_familia || [],
                    por_condicion_pago:
                        response?.graficas?.por_condicion_pago || [],
                },
                opciones: {
                    agencias: response?.opciones?.agencias || [],
                    asesores: response?.opciones?.asesores || [],
                    familias: response?.opciones?.familias || [],
                    condiciones_pago:
                        response?.opciones?.condiciones_pago || [],
                },
            });
        } catch (err) {
            console.error("Error cargando dashboard VW_VN usados:", err);

            setErrorDashboard(
                err?.message ||
                "No se pudo cargar el dashboard de Autos Usados."
            );
        } finally {
            setLoadingDashboard(false);
        }
    }

    async function cargarDatos() {
        setLoading(true);
        setError("");

        try {
            const textoBusqueda = String(qBuscado || "").trim();
            const buscarVIN = esVINCompleto(textoBusqueda);
            const busqueda = buscarVIN
                ? normalizarBusquedaVIN(textoBusqueda)
                : textoBusqueda;

            const query = buildQuery({
                cond_uso: CONDICION_USO.USADO,
                page: pagina,
                page_size: pageSize,
                q: busqueda,
                agencia: filtros.agencia,
                asesor: filtros.asesor,
                familia: filtros.familia,
                condicion_pago: filtros.condicion_pago,
                serie: filtros.serie,
                nr_nota: filtros.nr_nota,
                producto_servicio: filtros.producto_servicio,
                // Solo un VIN completo ignora el rango de fechas.
                // Las búsquedas de texto y las consultas normales respetan el periodo.
                fecha_desde: buscarVIN ? "" : filtros.fecha_desde,
                fecha_hasta: buscarVIN ? "" : filtros.fecha_hasta,
                venta_digital: filtros.venta_digital,
            });

            const response = await http(`/ventas-vn/api/${query}`);

            setRegistros(
                Array.isArray(response?.results)
                    ? response.results
                    : []
            );

            setTotal(Number(response?.count || 0));
        } catch (err) {
            console.error("Error cargando VW_VN usados:", err);

            setRegistros([]);
            setTotal(0);

            setError(
                err?.message ||
                "No fue posible cargar la información de Autos Usados."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarDatos();
    }, [
        pagina,
        pageSize,
        qBuscado,
        filtros.agencia,
        filtros.asesor,
        filtros.familia,
        filtros.condicion_pago,
        filtros.serie,
        filtros.nr_nota,
        filtros.producto_servicio,
        filtros.fecha_desde,
        filtros.fecha_hasta,
        filtros.venta_digital,
    ]);
    useEffect(() => {
        cargarDashboard();
    }, [
        filtros.agencia,
        filtros.asesor,
        filtros.familia,
        filtros.condicion_pago,
        filtros.serie,
        filtros.nr_nota,
        filtros.producto_servicio,
        filtros.fecha_desde,
        filtros.fecha_hasta,
        filtros.venta_digital,
    ]);
    const totalPaginas = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
    const hayFiltros = Object.values(filtros).some((value) => String(value || "").trim());
    const rangoActual = useMemo(() => formatoRango(filtros.fecha_desde, filtros.fecha_hasta), [filtros.fecha_desde, filtros.fecha_hasta]);
    const pillsConcesionarios = useMemo(() => {
        const opciones = dashboard.opciones.agencias || [];
        return CONCESIONARIOS_VENTAS.map((pill) => {
            if (!pill.claves) return { ...pill, valor: "" };
            const encontrada = opciones.find((opcion) =>
                pill.claves.some((clave) => normalizarNombreAgencia(opcion).includes(normalizarNombreAgencia(clave)))
            );
            return { ...pill, valor: encontrada || pill.label };
        });
    }, [dashboard.opciones.agencias]);
    const filtrosConfiguradorReporte = useMemo(() => {
        const opciones = (lista, etiquetaVacio) => [
            { value: "", label: etiquetaVacio },
            ...(lista || []).map((item) => ({ value: item, label: item })),
        ];

        return [
            { key: "q", label: "Búsqueda", type: "text", placeholder: "Serie, cliente o asesor..." },
            { key: "agencia", label: "Agencia", type: "select", options: opciones(dashboard.opciones.agencias, "Todas las agencias") },
            { key: "asesor", label: "Asesor", type: "select", options: opciones(dashboard.opciones.asesores, "Todos los asesores") },
            { key: "familia", label: "Familia / Modelo", type: "select", options: opciones(dashboard.opciones.familias, "Todos los modelos") },
            { key: "condicion_pago", label: "Condición de pago", type: "select", options: opciones(dashboard.opciones.condiciones_pago, "Todas las condiciones") },
            {
                key: "venta_digital",
                label: "Canal de venta",
                type: "select",
                options: [
                    { value: "", label: "Todas las ventas" },
                    { value: "1", label: "Solo ventas digitales" },
                ],
            },
            { key: "serie", label: "Serie / VIN", type: "text", placeholder: "Buscar por serie o VIN" },
            { key: "nr_nota", label: "Número de nota", type: "text", placeholder: "Nota o movimiento" },
            { key: "fecha_desde", label: "Fecha desde", type: "date" },
            { key: "fecha_hasta", label: "Fecha hasta", type: "date" },
        ];
    }, [
        dashboard.opciones.agencias,
        dashboard.opciones.asesores,
        dashboard.opciones.familias,
        dashboard.opciones.condiciones_pago,
    ]);

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

    const idxCondicionActivo = useMemo(() => condicionesPago.findIndex((item) => filtros.condicion_pago && item.condicion_pago === filtros.condicion_pago), [condicionesPago, filtros.condicion_pago]);

    function cambiarFiltro(campo, value) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, [campo]: value }));
    }

    const aplicarFiltroColumna = useCallback((filtrosActivos) => {
        setPagina(1);
        setFiltrosColumnas(filtrosActivos);

        const next = { ...filtrosRef.current };
        // Mapear columnas de la tabla a parámetros del backend.
        const mapeo = {
            serie: "serie",
            nr_nota: "nr_nota",
            producto_servicio: "producto_servicio",
            agencia: "agencia",
            asesor: "asesor",
            familia: "familia",
            condicion_pago: "condicion_pago",
        };
        Object.entries(mapeo).forEach(([colKey, paramKey]) => {
            const vals = filtrosActivos[colKey];
            if (Array.isArray(vals) && vals.length > 0) {
                next[paramKey] = vals[0];
            } else {
                next[paramKey] = "";
            }
        });
        setFiltros(next);
    }, []);
    function limpiarFiltros() {
        setPagina(1);

        setAnioSel("todos");
        setMesSel("sin_filtro");
        setFiltrosColumnas({});

        setFiltros({
            ...FILTROS_INICIALES,
            agencia: "",
            q: "",
            familia: "",
            condicion_pago: "",
            asesor: "",
            venta_digital: "",
            fecha_desde: "",
            fecha_hasta: "",
        });
    }
    function aplicarAgencia(agencia) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, agencia }));
    }
    function aplicarRangoRapido(id) {
        const rango = obtenerRangoPreset(id);
        setPagina(1);
        setFiltros((prev) => ({ ...prev, ...rango }));
    }
    function aplicarMes(mesIndex) {
        setPagina(1);

        let anioParaAplicar = anioSel;

        if (anioSel === "todos") {
            anioParaAplicar = anioActual;
            setAnioSel(anioActual);
        }

        const anioBase = anioParaAplicar === "todos" ? anioActual : Number(anioParaAplicar);

        // Si vuelve a presionar el mismo mes, quitar el filtro de fecha
        if (mesSel === mesIndex && anioSel !== "todos") {
            setMesSel("sin_filtro");

            setFiltros((prev) => ({
                ...prev,
                fecha_desde: "",
                fecha_hasta: "",
            }));

            return;
        }

        setMesSel(mesIndex);

        // "Todo el año"
        if (mesIndex === null) {
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: `${anioBase}-01-01`,
                fecha_hasta: `${anioBase}-12-31`,
            }));

            return;
        }

        const rango = obtenerRangoMes(mesIndex + 1, anioBase);

        setFiltros((prev) => ({
            ...prev,
            ...rango,
        }));
    }

    function aplicarAnio(anio) {
        setPagina(1);

        if (anio === "todos") {
            setAnioSel("todos");
            setMesSel("sin_filtro");
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: "",
                fecha_hasta: "",
            }));
            return;
        }

        const nuevoAnio = Number(anio);

        setAnioSel(nuevoAnio);

        if (mesSel === "sin_filtro") {
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: "",
                fecha_hasta: "",
            }));
            return;
        }

        if (mesSel === null) {
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: `${nuevoAnio}-01-01`,
                fecha_hasta: `${nuevoAnio}-12-31`,
            }));
            return;
        }

        const rango = obtenerRangoMes(mesSel + 1, nuevoAnio);

        setFiltros((prev) => ({
            ...prev,
            ...rango,
        }));
    }
    function actualizarTodo() { cargarDatos(); cargarDashboard(); }

    function exportarReporte() { setExportModalOpen(true); }

    const chartRefs = useRef({});
    const reporteUsadosRef = useRef(null);
    const [exportandoKey, setExportandoKey] = useState(null);

    function alternarFiltro(campo, valor) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, [campo]: prev[campo] === valor ? FILTROS_INICIALES[campo] : valor }));
    }

    function restaurarGrafica(patch) {
        setPagina(1);
        setFiltros((prev) => ({ ...prev, ...patch }));
    }

    function esMesActivo(item) {
        const rango = obtenerRangoMes(item?.mes, item?.anio);
        return !!(rango.fecha_desde && filtros.fecha_desde === rango.fecha_desde && filtros.fecha_hasta === rango.fecha_hasta);
    }

    function clicMes(entry) {
        const rango = obtenerRangoMes(entry?.mes, entry?.anio);
        if (!rango.fecha_desde) return;
        setPagina(1);
        setFiltros((prev) => {
            const activo = prev.fecha_desde === rango.fecha_desde && prev.fecha_hasta === rango.fecha_hasta;
            return activo ? { ...prev, fecha_desde: "", fecha_hasta: "" } : { ...prev, ...rango };
        });
    }

    async function exportarGrafica(key, nombre) {
        const nodo = chartRefs.current[key];
        if (!nodo) return;
        setExportandoKey(key);
        try {
            if (document.fonts?.ready) await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            await new Promise((r) => setTimeout(r, 200));
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

    async function generarReporteUsados(config = {}, { onProgress } = {}) {
        const progreso = (mensaje) => {
            try {
                onProgress?.(mensaje);
            } catch {
                // El aviso de progreso es informativo; no debe interrumpir la exportación.
            }
        };

        progreso("Leyendo filtros y parámetros del reporte...");
        const reportFilters = { ...filtros, ...(config.filters || {}) };
        const busqueda = String(reportFilters.q || "").trim();
        const buscarVIN = esVINCompleto(busqueda);

        const paramsBase = {
            cond_uso: CONDICION_USO.USADO,
            q: buscarVIN ? normalizarBusquedaVIN(busqueda) : busqueda,
            agencia: reportFilters.agencia,
            asesor: reportFilters.asesor,
            familia: reportFilters.familia,
            condicion_pago: reportFilters.condicion_pago,
            serie: reportFilters.serie,
            nr_nota: reportFilters.nr_nota,
            producto_servicio: reportFilters.producto_servicio,
            venta_digital: reportFilters.venta_digital,
            fecha_desde: buscarVIN ? "" : reportFilters.fecha_desde,
            fecha_hasta: buscarVIN ? "" : reportFilters.fecha_hasta,
        };

        try {
            progreso("Extrayendo datos de ventas...");
            const primera = await http(`/ventas-vn/api/${buildQuery({ ...paramsBase, page: 1, page_size: 100 })}`);
            const totalRegistros = Number(primera?.count || 0);
            const filasExportar = Array.isArray(primera?.results) ? [...primera.results] : [];
            const paginasReporte = Math.ceil(totalRegistros / 100);

            for (let page = 2; page <= paginasReporte; page += 1) {
                progreso(`Leyendo registros... página ${page} de ${paginasReporte}`);
                const response = await http(`/ventas-vn/api/${buildQuery({ ...paramsBase, page, page_size: 100 })}`);
                if (Array.isArray(response?.results)) filasExportar.push(...response.results);
            }

            if (!filasExportar.length) {
                throw new Error("No hay registros para exportar con los filtros configurados.");
            }

            progreso("Organizando la información obtenida...");
            const columnasSolicitadas = Array.isArray(config.columns) && config.columns.length
                ? config.columns
                : COLUMNAS_REPORTE_USADOS_DEFAULT;
            const columnasSeleccionadas = COLUMNAS_REPORTE_USADOS.filter((columna) => columnasSolicitadas.includes(columna.key));

            const incluyeResumen = config.sections?.includes("summary") ?? true;
            const incluyeGraficas = config.sections?.includes("charts") && Array.isArray(config.charts) && config.charts.length > 0;
            const incluyeTabla = config.sections?.includes("table") ?? true;

            progreso("Calculando totales y resumen ejecutivo...");
            const filasVendidas = filasExportar.filter((row) => String(row.situacion || "").toUpperCase() === "E");
            const baseTotales = filasVendidas.length ? filasVendidas : filasExportar;
            const ingresos = filasExportar.reduce((acc, row) => acc + numero(row.valor_factura_sin_iva) - numero(row.isan), 0);
            const costo = filasExportar.reduce((acc, row) => acc + numero(row.valor_compra), 0);
            const utilidad = ingresos - costo;
            const margen = ingresos ? (utilidad / ingresos) * 100 : 0;
            const digitales = filasExportar.filter((row) => row.es_venta_digital || row.tipo_venta === "Venta digital").length;

            const resumen = {
                unidades: baseTotales.length,
                operaciones: filasExportar.length,
                ingresos,
                costo,
                utilidad,
                margen,
                digitales,
            };

            const filtrosLegibles = filtrosConfiguradorReporte
                .map((definicion) => {
                    const raw = reportFilters[definicion.key];
                    if (raw === undefined || raw === null || raw === "" || raw === "Todos" || raw === "Todas") return null;
                    let value = raw;
                    if (definicion.type === "select" && Array.isArray(definicion.options)) {
                        const encontrado = definicion.options.find((opcion) => String(opcion.value) === String(raw));
                        if (encontrado) value = encontrado.label;
                    }
                    return { label: definicion.label, value };
                })
                .filter(Boolean);

            const tituloReporte = config.title || "Reporte de Ventas de Autos Usados";
            let canvas = null;

            if (incluyeResumen || incluyeGraficas) {
                progreso("Preparando el resumen y las gráficas del reporte...");
                setReporteUsadosExportacion({
                    title: tituloReporte,
                    rows: filasExportar,
                    filters: filtrosLegibles,
                    charts: incluyeGraficas ? config.charts : [],
                    includeSummary: incluyeResumen,
                    includeCharts: incluyeGraficas,
                    summary: resumen,
                });
                await esperarRenderReporteUsados();

                if (!reporteUsadosRef.current) {
                    throw new Error("No se pudo preparar la vista visual del reporte.");
                }

                progreso("Generando imágenes de las gráficas...");
                canvas = await html2canvas(reporteUsadosRef.current, {
                    scale: 1.35,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: "#ffffff",
                    logging: false,
                    windowWidth: 1280,
                    scrollX: 0,
                    scrollY: 0,
                });
            }

            if (config.format === "pdf") {
                progreso("Creando documento PDF...");
                await esperarPintadoProgreso();
                const orientation = config.orientation === "portrait" ? "portrait" : "landscape";
                const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
                const doc = new jsPDF({ orientation, unit: "mm", format: "a4", compress: true });
                doc.setProperties({
                    title: tituloReporte,
                    subject: "Reporte configurable de ventas de autos usados",
                    author: "CRM Grupo Automotriz R&R",
                    creator: "CRM Grupo Automotriz R&R",
                });

                let tieneContenido = false;
                if (canvas) {
                    agregarCanvasPdfUsados(doc, canvas);
                    tieneContenido = true;
                }

                if (incluyeTabla) {
                    if (tieneContenido) doc.addPage();
                    const columnasPorPagina = orientation === "portrait" ? 4 : 7;
                    const grupos = [];
                    for (let i = 0; i < columnasSeleccionadas.length; i += columnasPorPagina) {
                        grupos.push(columnasSeleccionadas.slice(i, i + columnasPorPagina));
                    }

                    grupos.forEach((grupo, indice) => {
                        if (indice > 0) doc.addPage();
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(12);
                        doc.setTextColor(19, 30, 92);
                        doc.text(`${tituloReporte} · Detalle ${indice + 1}/${grupos.length}`, 8, 10);

                        autoTable(doc, {
                            startY: 14,
                            head: [grupo.map((columna) => columna.label)],
                            body: filasExportar.map((row) => grupo.map((columna) => String(valorReporteUsados(row, columna.key) ?? ""))),
                            theme: "grid",
                            styles: {
                                font: "helvetica",
                                fontSize: 6.2,
                                cellPadding: 1.4,
                                overflow: "linebreak",
                                valign: "middle",
                                textColor: [55, 65, 81],
                                lineColor: [226, 232, 240],
                                lineWidth: 0.12,
                            },
                            headStyles: {
                                fillColor: [19, 30, 92],
                                textColor: [255, 255, 255],
                                fontStyle: "bold",
                                halign: "center",
                            },
                            alternateRowStyles: { fillColor: [248, 250, 252] },
                            margin: { left: 7, right: 7, bottom: 9 },
                        });
                    });
                    tieneContenido = true;
                }

                if (!tieneContenido) {
                    throw new Error("El reporte no tiene contenido seleccionado.");
                }

                progreso("Descargando archivo...");
                await esperarPintadoProgreso();
                doc.save(nombreReporteUsados(config, "pdf"));
            } else {
                progreso("Creando archivo Excel...");
                await esperarPintadoProgreso();
                const { default: ExcelJS } = await import("exceljs");
                const workbook = new ExcelJS.Workbook();
                workbook.creator = "CRM Grupo Automotriz R&R";
                workbook.lastModifiedBy = "CRM Grupo Automotriz R&R";
                workbook.created = new Date();
                workbook.modified = new Date();
                workbook.title = tituloReporte;

                if (incluyeResumen) {
                    const hoja = workbook.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
                    hoja.columns = [{ width: 30 }, { width: 48 }];
                    hoja.mergeCells("A1:B2");
                    hoja.getCell("A1").value = tituloReporte;
                    hoja.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
                    hoja.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
                    hoja.getCell("A1").alignment = { vertical: "middle" };

                    const filasResumen = [
                        ["Generado", new Date().toLocaleString("es-MX")],
                        ["Unidades vendidas", resumen.unidades],
                        ["Operaciones", resumen.operaciones],
                        ["Ingresos", money(resumen.ingresos)],
                        ["Costo", money(resumen.costo)],
                        ["Utilidad estimada", money(resumen.utilidad)],
                        ["Margen", `${resumen.margen.toFixed(1)}%`],
                        ["Ventas digitales", resumen.digitales],
                    ];
                    filasResumen.forEach(([etiqueta, valor], index) => {
                        const fila = 4 + index;
                        hoja.getCell(`A${fila}`).value = etiqueta;
                        hoja.getCell(`A${fila}`).font = { bold: true };
                        hoja.getCell(`B${fila}`).value = valor;
                    });

                    const filaFiltros = 4 + filasResumen.length + 1;
                    hoja.getCell(`A${filaFiltros}`).value = "Filtros configurados";
                    hoja.getCell(`A${filaFiltros}`).font = { bold: true, color: { argb: "FF131E5C" } };
                    if (filtrosLegibles.length) {
                        filtrosLegibles.forEach((filtro, index) => {
                            const fila = filaFiltros + 1 + index;
                            hoja.getCell(`A${fila}`).value = filtro.label;
                            hoja.getCell(`A${fila}`).font = { bold: true };
                            hoja.getCell(`B${fila}`).value = String(filtro.value);
                        });
                    } else {
                        hoja.getCell(`B${filaFiltros}`).value = "Sin filtros (todo el historial)";
                    }
                }

                if (incluyeTabla) {
                    const hoja = workbook.addWorksheet("Detalle", {
                        views: [{ state: "frozen", ySplit: 1 }],
                    });
                    hoja.columns = columnasSeleccionadas.map((columna) => ({
                        header: columna.label,
                        key: columna.key,
                        width: ["producto_servicio", "razon_social"].includes(columna.key) ? 34 : 20,
                    }));
                    filasExportar.forEach((row) => {
                        const registro = {};
                        columnasSeleccionadas.forEach((columna) => {
                            registro[columna.key] = valorReporteUsados(row, columna.key);
                        });
                        hoja.addRow(registro);
                    });
                    hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
                    hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
                    hoja.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
                    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, columnasSeleccionadas.length) } };
                }

                if (incluyeGraficas && canvas) {
                    const hoja = workbook.addWorksheet("Gráficas", { views: [{ showGridLines: false, zoomScale: 70 }] });
                    hoja.getCell("A1").value = tituloReporte;
                    hoja.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF131E5C" } };
                    const imageId = workbook.addImage({ base64: canvas.toDataURL("image/png"), extension: "png" });
                    const ancho = 1200;
                    const alto = Math.round((canvas.height / canvas.width) * ancho);
                    hoja.addImage(imageId, { tl: { col: 0, row: 2 }, ext: { width: ancho, height: alto } });
                    for (let i = 1; i <= 18; i += 1) hoja.getColumn(i).width = 11;
                }

                if (!workbook.worksheets.length) {
                    throw new Error("El reporte no tiene contenido seleccionado.");
                }

                const buffer = await workbook.xlsx.writeBuffer();
                progreso("Descargando archivo...");
                await esperarPintadoProgreso();
                descargarBlobReporteUsados(
                    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
                    nombreReporteUsados(config, "xlsx"),
                );
            }

            setExportModalOpen(false);
        } catch (error) {
            console.error("Error generando reporte de autos usados:", error);
            throw error;
        } finally {
            setReporteUsadosExportacion(null);
        }
    }

    const maxVentasAsesor = Math.max(
        1,
        ...topAsesores.map((item) => numero(item.unidades_vendidas))
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <main className="space-y-4 px-1 py-3 sm:px-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#001E50]">Control de Ventas</h1>
                        <p className="text-xs font-semibold text-slate-500">
                            Autos usados · {filtros.agencia || "Todas las agencias"} · {rangoActual}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-xl border border-[#001E50]/20 bg-white p-1 shadow-sm">
                            <button type="button" onClick={() => setVistaActiva("dashboard")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "dashboard" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"}`}>
                                <BarChart3 className="h-3.5 w-3.5" />Gráficos
                            </button>
                            <button type="button" onClick={() => setVistaActiva("detalle")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "detalle" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"}`}>
                                <Table2 className="h-3.5 w-3.5" />Tabla Detalle
                            </button>
                        </div>
                        <button type="button" onClick={actualizarTodo} disabled={loading || loadingDashboard} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#001E50]/20 bg-white px-3 text-xs font-bold text-[#001E50] shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
                            {loading || loadingDashboard ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Actualizar
                        </button>
                    </div>
                </div>

                {/* HERO OSCURO: métricas + concesionarios */}
                <div className="relative overflow-hidden rounded-2xl border border-[#001E50] bg-gradient-to-r from-[#001E50] via-[#0A1340] to-[#050B28] text-white shadow-xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(22,119,255,0.15),transparent_70%)]" />
                    <Car className="pointer-events-none absolute -bottom-6 -right-6 h-56 w-56 -rotate-12 text-white/[0.04]" />

                    <div className="relative border-b border-white/10 p-5 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">
                                    VOLKSWAGEN AUTOMOTRIZ R&R · VENTAS DE AUTOS USADOS
                                </p>
                                <h2 className="mt-0.5 text-2xl font-black tracking-tight text-white">
                                    Dashboard de Ventas
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                    Margen: <strong className="text-emerald-300">{loadingDashboard ? "…" : `${margen.toFixed(1)}%`}</strong> · {rangoActual}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                            {/* CONSOLIDADO GENERAL: izquierda, abarca 2 filas */}
                            <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm lg:col-span-4 lg:row-span-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black text-[#001E50] shadow">
                                        Consolidado
                                    </span>
                                </div>

                                <div className="py-3 text-center">
                                    <h4 className="mb-0.5 text-[11px] font-black uppercase tracking-widest text-slate-300/80">
                                        Resumen Ejecutivo de Ventas
                                    </h4>
                                    <div className="text-5xl font-black leading-none tracking-tight text-white">
                                        {loadingDashboard
                                            ? "..."
                                            : formatoNumero(dashboard.totales.unidades_vendidas)}
                                    </div>
                                    <div className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-sky-300">
                                        Total Unidades Vendidas
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-white/10 pt-3">
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300/80">
                                            <Database className="h-3 w-3 text-emerald-300" /> Operaciones
                                        </span>
                                        <span className="text-sm font-black text-white">
                                            {loadingDashboard ? "..." : formatoNumero(dashboard.totales.productos)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300/80">
                                            <Globe className="h-3 w-3 text-sky-300" /> Digitales
                                        </span>
                                        <span className="text-sm font-black text-white">
                                            {loadingDashboard ? "..." : formatoNumero(dashboard.totales.ventas_digitales)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300/80">
                                            <TrendingUp className="h-3 w-3 text-emerald-300" /> Margen
                                        </span>
                                        <span className="text-sm font-black text-emerald-300">
                                            {loadingDashboard ? "..." : `${margen.toFixed(1)}%`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* FILA 1 derecha */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
                                <div className="pt-2 lg:px-3 lg:pt-0 lg:first:pl-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        INGRESOS
                                    </span>
                                    <span className="block truncate text-2xl font-black text-white" title={money(dashboard.totales.ingresos)}>
                                        {loadingDashboard ? "…" : money(dashboard.totales.ingresos)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Valor total facturado</p>
                                </div>

                                <div className="pt-2 lg:px-3 lg:pt-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        COSTO
                                    </span>
                                    <span className="block truncate text-2xl font-black text-white" title={money(dashboard.totales.costo)}>
                                        {loadingDashboard ? "…" : money(dashboard.totales.costo)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Costo total</p>
                                </div>
                            </div>

                            {/* FILA 2 derecha */}
                            <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-3 lg:col-span-8">
                                <div className="pt-2 lg:px-3 lg:pt-0 lg:first:pl-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        UTILIDAD ESTIMADA
                                    </span>
                                    <span className="block truncate text-2xl font-black text-emerald-400" title={money(utilidad)}>
                                        {loadingDashboard ? "…" : money(utilidad)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Ingresos − Costo</p>
                                </div>

                                <div className="pt-2 lg:px-3 lg:pt-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        MARGEN
                                    </span>
                                    <span className="block text-2xl font-black text-amber-300">
                                        {loadingDashboard ? "…" : `${margen.toFixed(1)}%`}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Utilidad / Ingresos</p>
                                </div>

                                <div className="pt-2 lg:px-3 lg:pt-0">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                        VENTAS DIGITALES
                                    </span>
                                    <span className="block text-2xl font-black text-sky-300">
                                        {loadingDashboard ? "…" : formatoNumero(dashboard.totales.ventas_digitales)}
                                    </span>
                                    <p className="mt-1 text-[10px] text-slate-400">Venta digital</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/30 px-5 py-2.5 backdrop-blur-md">
                        <span className="mr-2 text-[10px] font-black uppercase tracking-wider text-slate-300">
                            CONCESIONARIOS:
                        </span>
                        {pillsConcesionarios.map((pill) => {
                            const activa = pill.id === "todas"
                                ? !filtros.agencia
                                : filtros.agencia === pill.valor;

                            return (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={() => aplicarAgencia(pill.valor)}
                                    className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${activa
                                        ? "scale-105 bg-white text-[#001E50] shadow-md"
                                        : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                                        }`}
                                >
                                    {pill.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* DESGLOSE POR ASESOR */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <section className="lg:col-span-12 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                                <Users className="h-3.5 w-3.5 text-white shrink-0" />
                                <span>Desglose por Asesor Comercial</span>
                            </div>

                            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-vw-head font-bold text-[#001E50] shadow-sm">
                                Top {topAsesores.length} asesores
                            </div>
                        </div>

                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {loadingDashboard ? (
                                <div className="flex h-[180px] items-center justify-center">
                                    <LoaderCircle className="h-5 w-5 animate-spin text-[#001E50]" />
                                </div>
                            ) : topAsesores.length === 0 ? (
                                <div className="flex h-[180px] items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                                    Sin datos de asesores en el periodo seleccionado
                                </div>
                            ) : (
                                topAsesores.map((item, idx) => {
                                    const pctWidth =
                                        (numero(item.unidades_vendidas) / maxVentasAsesor) * 100;

                                    const activo = filtros.asesor === item.asesor;

                                    return (
                                        <button
                                            key={`${item.asesor}-${idx}`}
                                            type="button"
                                            onClick={() => alternarFiltro("asesor", item.asesor)}
                                            className={`w-full rounded-xl border overflow-hidden transition-all duration-150 text-left ${activo
                                                ? "border-[#1677FF] bg-blue-50"
                                                : "border-slate-200/80 bg-white hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-2.5 w-52 min-w-0 shrink-0">
                                                    <div
                                                        className={`h-6 w-6 rounded-md flex items-center justify-center font-vw-head font-bold text-[10px] shrink-0 ${idx === 0
                                                            ? "bg-[#001E50] text-white"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        VW{idx + 1}
                                                    </div>

                                                    <span
                                                        className="font-vw-head font-bold text-[#001E50] text-xs truncate"
                                                        title={item.asesor || "Sin asesor"}
                                                    >
                                                        {item.asesor || "Sin asesor"}
                                                    </span>
                                                </div>

                                                <div className="text-[11px] text-slate-700 font-vw-head font-bold shrink-0 min-w-[90px]">
                                                    {formatoNumero(item.unidades_vendidas)} unidades
                                                </div>

                                                <div className="flex-1 mx-2">
                                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-[#001E50] h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(
                                                                    100,
                                                                    Math.max(4, pctWidth)
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="text-[10px] font-vw-head font-bold text-[#1677FF] shrink-0">
                                                    {money(item.ingresos)}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                    Ingresos
                                </div>
                                <div
                                    className="mt-0.5 truncate text-xs font-vw-head font-bold text-[#001E50]"
                                    title={money(dashboard.totales.ingresos)}
                                >
                                    {loadingDashboard ? "..." : money(dashboard.totales.ingresos)}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                    Costo
                                </div>
                                <div
                                    className="mt-0.5 truncate text-xs font-vw-head font-bold text-[#001E50]"
                                    title={money(dashboard.totales.costo)}
                                >
                                    {loadingDashboard ? "..." : money(dashboard.totales.costo)}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                <div className="text-[9px] uppercase tracking-wide text-slate-400">
                                    Utilidad estimada
                                </div>
                                <div
                                    className={`mt-0.5 truncate text-xs font-vw-head font-bold ${utilidad >= 0 ? "text-emerald-700" : "text-red-600"
                                        }`}
                                    title={money(utilidad)}
                                >
                                    {loadingDashboard ? "..." : money(utilidad)}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {errorDashboard && <ErrorBox>{errorDashboard}</ErrorBox>}
                {error && <ErrorBox>{error}</ErrorBox>}

                {vistaActiva === "dashboard" && (
                    <div className="grid gap-4 xl:grid-cols-12">
                        <div className="xl:col-span-7">
                            <ChartCard title="Tendencia comercial" subtitle="Ingresos, costo y unidades vendidas por mes" icon={TrendingUp} badge={rangoActual}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.fecha_desde && <GraficoRestaurar onClick={() => restaurarGrafica({ fecha_desde: "", fecha_hasta: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("tendencia", "tendencia_comercial")} busy={exportandoKey === "tendencia"} />
                                    </div>
                                }>
                                <div className="h-[360px]" ref={(n) => { chartRefs.current["tendencia"] = n; }}>
                                    {loadingDashboard ? <ChartLoading /> : datosMes.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={datosMes} margin={{ top: 12, right: 12, bottom: 6, left: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                                                <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis yAxisId="money" tickFormatter={formatoCompacto} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={65} />
                                                <YAxis yAxisId="units" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={35} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: C.text, fontWeight: 700 }} formatter={(value, name) => [name === "Unidades" ? `${formatoNumero(value)} unidades` : money(value), name]} />
                                                <Bar yAxisId="units" dataKey="unidades_vendidas" name="Unidades" radius={[6, 6, 0, 0]} barSize={22} className="cursor-pointer" onClick={(entry) => clicMes(entry)}>
                                                    {datosMes.map((item, i) => {
                                                        const activo = esMesActivo(item);
                                                        return <Cell key={i} fill={activo ? C.navy : "#DDE4F6"} />;
                                                    })}
                                                </Bar>
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
                            <ChartCard title="Condición de pago" subtitle="Distribución de unidades vendidas" icon={WalletCards}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.condicion_pago && <GraficoRestaurar onClick={() => restaurarGrafica({ condicion_pago: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("condicion", "condicion_pago")} busy={exportandoKey === "condicion"} />
                                    </div>
                                }>
                                <div className="grid min-h-[390px] items-center gap-3 md:grid-cols-[1fr_220px] xl:grid-cols-1 2xl:grid-cols-[1fr_220px]" ref={(n) => { chartRefs.current["condicion"] = n; }}>
                                    <div className="relative h-[280px]">
                                        {loadingDashboard ? <ChartLoading /> : condicionesPago.length === 0 ? <ChartEmpty /> : (
                                            <>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={condicionesPago} dataKey="unidades_vendidas" nameKey="condicion_pago" cx="50%" cy="50%" innerRadius={72} outerRadius={105} paddingAngle={2} className="cursor-pointer" activeIndex={idxCondicionActivo >= 0 ? idxCondicionActivo : undefined} activeShape={<SectorResaltado />} onClick={(data) => alternarFiltro("condicion_pago", data ? data?.condicion_pago : "")}>
                                                            {condicionesPago.map((item, index) => {
                                                                return <Cell key={`${item.condicion_pago}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />;
                                                            })}
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
                                                <button key={`${item.condicion_pago}-${index}`} type="button" onClick={() => alternarFiltro("condicion_pago", item.condicion_pago)}
                                                    className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition", filtros.condicion_pago === item.condicion_pago ? "bg-[#131E5C]/[0.08]" : "hover:bg-[#F7F8FC]")}>
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#515778]" title={item.condicion_pago}>{item.condicion_pago || "Sin condición"}</span>
                                                    <span className="text-[11px] font-bold text-[#1A1F3C]">{porcentaje(item.unidades_vendidas, totalCondicionesPago)}%</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Rendimiento por asesor" subtitle="Top 10 por unidades vendidas" icon={BarChart3}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.asesor && <GraficoRestaurar onClick={() => restaurarGrafica({ asesor: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("asesores", "rendimiento_asesores")} busy={exportandoKey === "asesores"} />
                                    </div>
                                }>
                                <div className="h-[390px]" ref={(n) => { chartRefs.current["asesores"] = n; }}>
                                    {loadingDashboard ? <ChartLoading /> : topAsesores.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topAsesores} layout="vertical" margin={{ top: 4, right: 38, left: 18, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="asesor" width={145} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                                                <Bar dataKey="unidades_vendidas" name="Unidades vendidas" fill={C.navy} radius={[0, 7, 7, 0]} barSize={20} className="cursor-pointer" onClick={(entry) => alternarFiltro("asesor", entry ? entry?.asesor : "")}>
                                                    {topAsesores.map((item, i) => {
                                                        return <Cell key={i} fill={C.navy} />;
                                                    })}
                                                    <LabelList dataKey="unidades_vendidas" position="right" fill={C.textSub} fontSize={10} fontWeight={700} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        <div className="xl:col-span-6">
                            <ChartCard title="Modelos con mayor movimiento" subtitle="Top 10 familias por unidades vendidas" icon={Car}
                                action={
                                    <div className="flex items-center gap-2">
                                        {filtros.familia && <GraficoRestaurar onClick={() => restaurarGrafica({ familia: "" })} />}
                                        <GraficoExportar onClick={() => exportarGrafica("familias", "modelos_mayor_movimiento")} busy={exportandoKey === "familias"} />
                                    </div>
                                }>
                                <div className="h-[390px]" ref={(n) => { chartRefs.current["familias"] = n; }}>
                                    {loadingDashboard ? <ChartLoading /> : topFamilias.length === 0 ? <ChartEmpty /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topFamilias} layout="vertical" margin={{ top: 4, right: 38, left: 22, bottom: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={C.border} />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="familia" width={150} tick={{ fontSize: 10, fill: C.textSub }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${formatoNumero(value)} unidades`, "Ventas"]} />
                                                <Bar dataKey="unidades_vendidas" name="Unidades vendidas" fill={C.navyMid} radius={[0, 7, 7, 0]} barSize={20} className="cursor-pointer" onClick={(entry) => alternarFiltro("familia", entry ? entry?.familia : "")}>
                                                    {topFamilias.map((item, i) => {
                                                        return <Cell key={i} fill={C.navyMid} />;
                                                    })}
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-extrabold text-[#001E50]">Detalle Individual de Ventas (Autos Usados)</h3>

                        {/* BUSCAR (arriba de la tabla) */}
                        <div className="mb-3 relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={filtros.q}
                                onChange={(e) => cambiarFiltro("q", e.target.value)}
                                placeholder="Buscar VIN, serie, nota, cliente, modelo..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-vw-text text-[#001E50] outline-none transition placeholder:text-slate-300 focus:border-[#1677FF]"
                            />
                            {filtros.q ? (
                                <button
                                    type="button"
                                    onClick={() => cambiarFiltro("q", "")}
                                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            ) : null}
                        </div>

                        {/* FILTROS DE AUTOS USADOS */}
                        <div className="space-y-4">
                            {/* FILTROS COMPLEMENTARIOS */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-vw-head font-bold text-white">
                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                        <span>Filtros de Autos Usados</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={exportarReporte}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-[#131E5C] hover:bg-[#131E5C]/5 transition"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Reporte
                                        </button>
                                        <button
                                            type="button"
                                            onClick={limpiarFiltros}
                                            disabled={!hayFiltros}
                                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-vw-head font-bold text-[#001E50] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Eraser className="h-3 w-3" />
                                            Limpiar filtros
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">
                                    {/* FAMILIA / MODELO */}
                                    <div>
                                        <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                            Familia / Modelo
                                        </label>
                                        <select
                                            value={filtros.familia}
                                            onChange={(e) => cambiarFiltro("familia", e.target.value)}
                                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                        >
                                            <option value="">Todas las familias</option>
                                            {dashboard.opciones.familias.map((familia) => (
                                                <option key={familia} value={familia}>{familia}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* CONDICIÓN DE PAGO */}
                                    <div>
                                        <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                            Condición de Pago
                                        </label>
                                        <select
                                            value={filtros.condicion_pago}
                                            onChange={(e) => cambiarFiltro("condicion_pago", e.target.value)}
                                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                        >
                                            <option value="">Todas las condiciones</option>
                                            {dashboard.opciones.condiciones_pago.map((condicion) => (
                                                <option key={condicion} value={condicion}>{condicion}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* ASESOR */}
                                    <div>
                                        <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                            Asesor
                                        </label>
                                        <select
                                            value={filtros.asesor}
                                            onChange={(e) => cambiarFiltro("asesor", e.target.value)}
                                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                        >
                                            <option value="">Todos los asesores</option>
                                            {dashboard.opciones.asesores.map((asesor) => (
                                                <option key={asesor} value={asesor}>{asesor}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* TIPO DE VENTA */}
                                    <div>
                                        <label className="mb-1.5 block text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">
                                            Tipo de Venta
                                        </label>
                                        <select
                                            value={filtros.venta_digital}
                                            onChange={(e) => cambiarFiltro("venta_digital", e.target.value)}
                                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-vw-text text-[#001E50] outline-none focus:border-[#1677FF]"
                                        >
                                            <option value="">Todas las ventas</option>
                                            <option value="1">Venta digital</option>
                                        </select>
                                    </div>
                                </div>
                                {(filtros.asesor || filtros.familia || filtros.condicion_pago || filtros.venta_digital) && (
                                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-2">
                                        <span className="mr-1 text-[9px] font-vw-head font-bold uppercase tracking-wider text-slate-400">Aplicados:</span>
                                        {filtros.asesor && (
                                            <span className="rounded-full bg-[#001E50]/[0.07] px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#001E50]">{filtros.asesor}</span>
                                        )}
                                        {filtros.familia && (
                                            <span className="rounded-full bg-[#001E50]/[0.07] px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#001E50]">{filtros.familia}</span>
                                        )}
                                        {filtros.condicion_pago && (
                                            <span className="rounded-full bg-[#001E50]/[0.07] px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#001E50]">{filtros.condicion_pago}</span>
                                        )}
                                        {filtros.venta_digital === "1" && (
                                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-vw-head font-bold text-[#1677FF]">Venta digital</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* AÑO + MESES */}
                            <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex items-center gap-3">
                                <div className="relative inline-block shrink-0">
                                    <select
                                        value={anioSel}
                                        onChange={(e) => aplicarAnio(e.target.value)}
                                        className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer"
                                    >
                                        <option value="todos">Todos los años</option>
                                        {anios.map((anio) => (
                                            <option key={anio} value={anio}>{anio}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto w-full pb-1 scrollbar-thin">
                                    {/* TODO EL AÑO */}
                                    <button
                                        type="button"
                                        onClick={() => aplicarMes(null)}
                                        className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${mesSel === null && anioSel !== "todos" ? "bg-[#001E50] text-white font-vw-head font-bold" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"}`}
                                    >
                                        {mesSel === null && anioSel !== "todos" ? (
                                            <Check className="h-3 w-3 text-white" />
                                        ) : (
                                            <Plus className="h-3 w-3 text-slate-400" />
                                        )}
                                        <span>Todo el año</span>
                                    </button>
                                    {/* MESES */}
                                    {MESES.map((mes, index) => {
                                        const futuro = anioSel !== "todos" && Number(anioSel) === anioActual && index > mesActual;
                                        const activo = mesSel === index && anioSel !== "todos";
                                        const deshabilitado = futuro;
                                        return (
                                            <button
                                                key={mes}
                                                type="button"
                                                disabled={deshabilitado}
                                                onClick={() => aplicarMes(index)}
                                                className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition-all ${activo ? "bg-[#001E50] text-white font-vw-head font-bold" : deshabilitado ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"}`}
                                            >
                                                {activo ? (
                                                    <Check className="h-3 w-3 text-white" />
                                                ) : (
                                                    <Plus className="h-3 w-3 text-slate-400" />
                                                )}
                                                <span>{mes.toLowerCase()}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    onClick={actualizarTodo}
                                    disabled={loading || loadingDashboard}
                                    title="Recargar"
                                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-[#001E50] transition shrink-0"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading || loadingDashboard ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>
                        {/* EXPORTAR REPORTE MODAL */}
                        {exportModalOpen && (
                            <ExportReportModal
                                isOpen={exportModalOpen}
                                onClose={() => setExportModalOpen(false)}
                                moduleName="Ventas de Autos Usados"
                                storageKey="ventas-usados"
                                currentFilters={{ ...filtros }}
                                filterDefinitions={filtrosConfiguradorReporte}
                                currentColumns={COLUMNAS_REPORTE_USADOS_DEFAULT}
                                availableColumns={COLUMNAS_REPORTE_USADOS}
                                totalRecords={total}
                                formats={["excel", "pdf"]}
                                sectionOptions={SECCIONES_REPORTE_USADOS}
                                chartOptions={GRAFICAS_REPORTE_USADOS}
                                onGenerate={generarReporteUsados}
                            />
                        )}

                        {reporteUsadosExportacion && (
                            <div
                                ref={reporteUsadosRef}
                                aria-hidden="true"
                                style={{
                                    position: "fixed",
                                    left: "-20000px",
                                    top: 0,
                                    width: "1200px",
                                    padding: "32px",
                                    backgroundColor: "#ffffff",
                                    zIndex: -1,
                                    pointerEvents: "none",
                                }}
                            >
                                <div className="mb-6 border-b border-slate-200 pb-5">
                                    <h1 className="text-3xl font-black text-[#131E5C]">{reporteUsadosExportacion.title}</h1>
                                    <p className="mt-1 text-sm text-slate-500">Reporte configurable de Ventas de Autos Usados</p>
                                    <p className="mt-1 text-xs text-slate-400">Generado: {new Date().toLocaleString("es-MX")}</p>
                                </div>

                                {reporteUsadosExportacion.includeSummary && (
                                    <>
                                        <div className="mb-4 grid grid-cols-4 gap-3">
                                            <div className="rounded-xl bg-[#131E5C] p-4 text-white">
                                                <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Unidades vendidas</p>
                                                <p className="mt-2 text-4xl font-black">{formatoNumero(reporteUsadosExportacion.summary.unidades)}</p>
                                                <p className="mt-1 text-[11px] font-bold text-emerald-300">Margen {reporteUsadosExportacion.summary.margen.toFixed(1)}%</p>
                                            </div>
                                            <div className="col-span-3 grid grid-cols-3 gap-3">
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Operaciones</p>
                                                    <p className="mt-1 text-lg font-black text-slate-700">{formatoNumero(reporteUsadosExportacion.summary.operaciones)}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ingresos</p>
                                                    <p className="mt-1 text-lg font-black text-slate-700">{money(reporteUsadosExportacion.summary.ingresos)}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Costo</p>
                                                    <p className="mt-1 text-lg font-black text-slate-700">{money(reporteUsadosExportacion.summary.costo)}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Utilidad estimada</p>
                                                    <p className={cn("mt-1 text-lg font-black", reporteUsadosExportacion.summary.utilidad >= 0 ? "text-emerald-700" : "text-red-600")}>{money(reporteUsadosExportacion.summary.utilidad)}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ventas digitales</p>
                                                    <p className="mt-1 text-lg font-black text-slate-700">{formatoNumero(reporteUsadosExportacion.summary.digitales)}</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Registros</p>
                                                    <p className="mt-1 text-lg font-black text-slate-700">{formatoNumero(reporteUsadosExportacion.rows.length)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Filtros aplicados:</span>
                                            {reporteUsadosExportacion.filters.length ? reporteUsadosExportacion.filters.map((filtro) => (
                                                <span key={filtro.label} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                                    {filtro.label}: <strong className="text-[#131E5C]">{String(filtro.value)}</strong>
                                                </span>
                                            )) : (
                                                <span className="text-[11px] font-semibold text-slate-500">Sin filtros (todo el historial)</span>
                                            )}
                                        </div>
                                    </>
                                )}

                                {reporteUsadosExportacion.includeCharts && (
                                    <ReporteGraficasUsados
                                        rows={reporteUsadosExportacion.rows}
                                        charts={reporteUsadosExportacion.charts}
                                    />
                                )}
                            </div>
                        )}
                        <InteractiveTable
                            rows={registros}
                            columns={COLUMNAS}
                            storageKey="autos_usados"
                            total={total}
                            loading={loading}
                            pageSize={pageSize}
                            onPageSizeChange={(size) => { setPagina(1); setPageSize(size); }}
                            page={pagina}
                            totalPages={totalPaginas}
                            onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
                            onNext={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                            onColumnFilterChange={aplicarFiltroColumna}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

function KPICard({ icon, label, value, sub, accent, spark = [] }) {
    const Icon = icon;
    const sparkData = spark.map((v, i) => ({ i, v: numero(v) }));
    const pct = sparkData.length > 1
        ? (sparkData[sparkData.length - 1].v - sparkData[0].v) / Math.max(Math.abs(sparkData[0].v), 1)
        : 0;
    const tendencia = sparkData.length > 1 ? (pct >= 0 ? "up" : "down") : null;

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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {sub && <span className="truncate text-[11px] font-semibold" style={{ color: accent }}>{sub}</span>}
                        {tendencia && (
                            <span className={cn(`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tendencia === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`)}>
                                {tendencia === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {Math.abs(pct * 100).toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative mt-3 border-t border-black/[0.06] pt-2">
                {sparkData.length === 0 ? (
                    <div className="flex h-12 items-center text-[11px] font-semibold text-slate-300">Sin datos</div>
                ) : (
                    <div className="h-12">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sparkData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                                <Bar dataKey="v" fill={accent} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
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

function FilterField({ label, hint, icon: Icon = null, children }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 text-[#131E5C]/60" />}
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</label>
                {hint && <span className="rounded bg-[#F7F8FC] px-1.5 py-0.5 text-[9px] font-semibold text-[#8891AD]">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function ChartCard({ title, subtitle, icon: Icon, badge, action, children }) {
    return (
        <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span>{title}</span>
                    </div>
                    {subtitle && <p className="mt-1.5 text-[11px] font-medium text-slate-500">{subtitle}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {badge && <Badge>{badge}</Badge>}
                    {action}
                </div>
            </div>
            <div className="p-4">{children}</div>
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

function GraficoRestaurar({ onClick }) {
    return (
        <button type="button" onClick={onClick} title="Restaurar / quitar el filtro de esta gráfica"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-[11px] font-bold text-[#131E5C] transition hover:bg-[#131E5C]/5">
            <RotateCcw className="h-3.5 w-3.5" />Restaurar
        </button>
    );
}

function SectorResaltado(props) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 7}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={4}
            stroke="#FFFFFF"
            strokeWidth={2}
        />
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
