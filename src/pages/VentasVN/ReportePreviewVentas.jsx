// src/pages/VentasVN/ReportePreviewVentas.jsx
// Vista oculta del reporte que se captura como imagen para PDF/Excel.
import { useMemo } from "react";
import {
    ResponsiveContainer, BarChart, Bar, ComposedChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
    agruparReporte,
    cnReporte,
    etiquetaMesReporte,
    formatoCompactoReporte,
    formatoNumeroReporte,
    moneyReporte,
    numeroReporte,
    COLORES_REPORTE_VENTAS,
    TOOLTIP_REPORTE_VENTAS,
} from "./reporteVentas";

const C = { navy: "#131E5C", navyMid: "#2445A2", navyLight: "#378ADD", success: "#1D9E75" };

function ReporteCard({ title, subtitle, children, wide = false }) {
    return (
        <div className={cnReporte("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", wide && "xl:col-span-2")}>
            <h4 className="text-base font-black text-[#131E5C]">{title}</h4>
            <p className="mb-4 mt-1 text-xs text-slate-400">{subtitle}</p>
            {children}
        </div>
    );
}

function ReporteBarras({ data, color = C.navy, horizontal = false }) {
    if (!data.length) return <div className="flex h-[270px] items-center justify-center text-xs font-semibold text-slate-400">Sin datos en el periodo</div>;

    if (horizontal) {
        return (
            <ResponsiveContainer width="100%" height={270}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 38, left: 18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip contentStyle={TOOLTIP_REPORTE_VENTAS} formatter={(value) => [`${formatoNumeroReporte(value)} unidades`, "Ventas"]} />
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
                <Tooltip contentStyle={TOOLTIP_REPORTE_VENTAS} formatter={(value) => [`${formatoNumeroReporte(value)} unidades`, "Ventas"]} />
                <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} isAnimationActive={false} />
            </BarChart>
        </ResponsiveContainer>
    );
}

function ReporteDona({ data }) {
    if (!data.length) return <div className="flex h-[250px] items-center justify-center text-xs font-semibold text-slate-400">Sin datos en el periodo</div>;
    return (
        <div className="grid items-center gap-3 md:grid-cols-[1fr_180px]">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} isAnimationActive={false}>
                        {data.map((item, index) => <Cell key={item.name} fill={COLORES_REPORTE_VENTAS[index % COLORES_REPORTE_VENTAS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_REPORTE_VENTAS} formatter={(value) => [`${formatoNumeroReporte(value)} unidades`, "Ventas"]} />
                </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
                {data.slice(0, 8).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-slate-500">
                            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORES_REPORTE_VENTAS[index % COLORES_REPORTE_VENTAS.length] }} />
                            <span className="truncate">{item.name}</span>
                        </span>
                        <strong className="text-slate-700">{formatoNumeroReporte(item.value)}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReporteGraficas({ rows = [], charts = [] }) {
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
                name: etiquetaMesReporte({ mes: Number(periodo.slice(5, 7)), anio: periodo.slice(0, 4) }),
                value: 0,
                ingresos: 0,
            };
            actual.value += 1;
            actual.ingresos += numeroReporte(row.valor_factura_sin_iva) - numeroReporte(row.isan);
            map.set(periodo, actual);
        });
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item);
    }, [base]);
    const porAgencia = useMemo(() => agruparReporte(base, "agencia", 10), [base]);
    const porAsesor = useMemo(() => agruparReporte(base, (row) => row.asesor || "Sin asesor", 10), [base]);
    const porFamilia = useMemo(() => agruparReporte(base, (row) => row.nombre_familia || "Sin familia", 10), [base]);
    const porMarca = useMemo(() => agruparReporte(base, (row) => row.nombre_marca || "Sin marca", 8), [base]);
    const porCondicionPago = useMemo(() => agruparReporte(base, (row) => row.nombre_condicion_pago || "Sin condición", 8), [base]);
    const porTipoVenta = useMemo(
        () => agruparReporte(base, (row) => (row.tipo_venta || (row.es_venta_digital ? "Venta digital" : "Tradicional"))),
        [base],
    );

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {activos.has("mes") && (
                <ReporteCard title="Tendencia por mes" subtitle="Unidades vendidas e ingresos del periodo" wide>
                    {porMes.length === 0 ? <div className="flex h-[280px] items-center justify-center text-xs font-semibold text-slate-400">Sin datos en el periodo</div> : (
                        <>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={porMes} margin={{ top: 10, right: 18, left: -8, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis yAxisId="unidades" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis yAxisId="ingresos" orientation="right" tickFormatter={formatoCompactoReporte} tick={{ fontSize: 10, fill: "#64748b" }} width={60} />
                                    <Tooltip contentStyle={TOOLTIP_REPORTE_VENTAS} formatter={(value, name) => [name === "Ingresos" ? moneyReporte(value) : `${formatoNumeroReporte(value)} unidades`, name]} />
                                    <Bar yAxisId="unidades" dataKey="value" name="Unidades" fill={C.navy} radius={[5, 5, 0, 0]} barSize={26} isAnimationActive={false} />
                                    <Line yAxisId="ingresos" type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.success} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-4 text-[11px] font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#131E5C]" /> Unidades</span>
                                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#1D9E75]" /> Ingresos</span>
                            </div>
                        </>
                    )}
                </ReporteCard>
            )}
            {activos.has("asesor") && <ReporteCard title="Rendimiento por asesor" subtitle="Top asesores por unidades vendidas"><ReporteBarras data={porAsesor} horizontal /></ReporteCard>}
            {activos.has("familia") && <ReporteCard title="Modelos con mayor movimiento" subtitle="Top familias por unidades vendidas"><ReporteBarras data={porFamilia} color={C.navyMid} horizontal /></ReporteCard>}
            {activos.has("agencia") && <ReporteCard title="Ventas por agencia" subtitle="Unidades vendidas por agencia"><ReporteBarras data={porAgencia} color={C.navyLight} /></ReporteCard>}
            {activos.has("condicion_pago") && <ReporteCard title="Condición de pago" subtitle="Composición de unidades vendidas"><ReporteDona data={porCondicionPago} /></ReporteCard>}
            {activos.has("tipo_venta") && <ReporteCard title="Canal de venta" subtitle="Venta digital vs. venta tradicional"><ReporteDona data={porTipoVenta} /></ReporteCard>}
            {activos.has("marca") && <ReporteCard title="Distribución por marca" subtitle="Unidades vendidas por marca"><ReporteDona data={porMarca} /></ReporteCard>}
        </div>
    );
}

export default function ReportePreviewVentas({ reporte, innerRef, moduleLabel = "Ventas de Autos Nuevos" }) {
    if (!reporte) return null;

    return (
        <div
            id="reporte-ventas-preview"
            ref={innerRef}
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
                <h1 className="text-3xl font-black text-[#131E5C]">{reporte.title}</h1>
                <p className="mt-1 text-sm text-slate-500">Reporte configurable de {moduleLabel}</p>
                <p className="mt-1 text-xs text-slate-400">Generado: {new Date().toLocaleString("es-MX")}</p>
            </div>

            {reporte.includeSummary && (
                <>
                    <div className="mb-4 grid grid-cols-4 gap-3">
                        <div className="rounded-xl bg-[#131E5C] p-4 text-white">
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Unidades vendidas</p>
                            <p className="mt-2 text-4xl font-black">{formatoNumeroReporte(reporte.summary.unidades)}</p>
                            <p className="mt-1 text-[11px] font-bold text-emerald-300">Margen {reporte.summary.margen.toFixed(1)}%</p>
                        </div>
                        <div className="col-span-3 grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Operaciones</p>
                                <p className="mt-1 text-lg font-black text-slate-700">{formatoNumeroReporte(reporte.summary.operaciones)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ingresos</p>
                                <p className="mt-1 text-lg font-black text-slate-700">{moneyReporte(reporte.summary.ingresos)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Costo</p>
                                <p className="mt-1 text-lg font-black text-slate-700">{moneyReporte(reporte.summary.costo)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Utilidad estimada</p>
                                <p className={cnReporte("mt-1 text-lg font-black", reporte.summary.utilidad >= 0 ? "text-emerald-700" : "text-red-600")}>{moneyReporte(reporte.summary.utilidad)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ventas digitales</p>
                                <p className="mt-1 text-lg font-black text-slate-700">{formatoNumeroReporte(reporte.summary.digitales)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Registros</p>
                                <p className="mt-1 text-lg font-black text-slate-700">{formatoNumeroReporte(reporte.rows.length)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Filtros aplicados:</span>
                        {reporte.filters.length ? reporte.filters.map((filtro) => (
                            <span key={filtro.label} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                {filtro.label}: <strong className="text-[#131E5C]">{String(filtro.value)}</strong>
                            </span>
                        )) : (
                            <span className="text-[11px] font-semibold text-slate-500">Sin filtros (todo el historial)</span>
                        )}
                    </div>
                </>
            )}

            {reporte.includeCharts && (
                <ReporteGraficas rows={reporte.rows} charts={reporte.charts} />
            )}
        </div>
    );
}
