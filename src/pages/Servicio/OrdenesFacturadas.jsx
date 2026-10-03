import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check,
    ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Filter,
    ListFilter, LoaderCircle, PackageSearch, RefreshCw, RotateCcw,
    Search, SearchX, Sheet, Store, Wrench,
} from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
    getOrdenesFacturadas,
    getOrdenFacturadaDetalle,
    getOrdenesFacturadasOpciones,
} from "../../lib/apiOrdenesFacturadas";

const C = {
    navy: "#131E5C",
    navyDark: "#0A1340",
    navyMid: "#1E2F7A",
    accent: "#1677FF",
    border: "#E4E7F0",
    surface: "#F7F8FC",
};

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const FILTROS_VACIOS = {
    q: "",
    agencia: "",
    fecha_desde: "",
    fecha_hasta: "",
    func_resp: "",
};

const CLASE_CONTROL =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15";

const COLUMNAS = [
    { key: "agencia", label: "Agencia", tipo: "texto", chip: true },
    { key: "nros", label: "OS", tipo: "entero", fuerte: true },
    { key: "nratendimento", label: "Atención", tipo: "entero" },
    { key: "tpos", label: "Tipo OS", tipo: "texto", filtro: "tp_os", opciones: "tpos", chip: true },
    { key: "subtipoos", label: "Subtipo", tipo: "texto", filtro: "subtipo_os", opciones: "subtipos" },
    { key: "situacao", label: "Situación", tipo: "texto", filtro: "situacao", opciones: "situaciones", estado: true },
    { key: "dtabertura", label: "Apertura", tipo: "fecha" },
    { key: "dtfechamento", label: "Cierre", tipo: "fecha" },
    { key: "sitgarantia", label: "Garantía", tipo: "texto", filtro: "sit_garantia", opciones: "garantias" },
    { key: "codcondpgto", label: "Cond. pago", tipo: "entero", filtro: "cod_cond_pgto", opciones: "condiciones_pago" },
    { key: "codoperfiscal", label: "Oper. fiscal", tipo: "entero", filtro: "cod_oper_fiscal", opciones: "operaciones_fiscales" },
    { key: "requisiciones", label: "Req.", tipo: "entero" },
    { key: "partidas", label: "Partidas", tipo: "entero" },
    { key: "valor_productos", label: "Refacciones", tipo: "moneda", fuerte: true },
    { key: "ttmo", label: "Mano obra", tipo: "moneda", fuerte: true },
    { key: "descuentos", label: "Descuentos", tipo: "moneda" },
];

const TOOLTIP_STYLE = {
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    boxShadow: "0 12px 30px -16px rgba(15,23,42,.4)",
    fontSize: 12,
    fontFamily: "inherit",
};

function cn(...partes) {
    return partes.filter(Boolean).join(" ");
}

function numero(valor) {
    const n = Number(valor ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function entero(valor) {
    return numero(valor).toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function dinero(valor) {
    return numero(valor).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function dineroCompacto(valor) {
    const n = numero(valor);
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return dinero(n);
}

function vacio(valor) {
    return valor === null || valor === undefined || String(valor).trim() === "";
}

function formatearFecha(valor) {
    if (!valor) return "—";
    const texto = String(valor).trim();
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : texto;
}

function formatearFechaCorta(valor) {
    if (!valor) return "";
    const texto = String(valor);
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}/${match[2]}` : texto;
}

function dosDigitos(valor) {
    return String(valor).padStart(2, "0");
}

function rangoMesISO(anio, mesIndice) {
    const mes = dosDigitos(mesIndice + 1);
    const ultimoDia = new Date(anio, mesIndice + 1, 0).getDate();
    return {
        fecha_desde: `${anio}-${mes}-01`,
        fecha_hasta: `${anio}-${mes}-${dosDigitos(ultimoDia)}`,
    };
}

function rangoAnioISO(anio) {
    return {
        fecha_desde: `${anio}-01-01`,
        fecha_hasta: `${anio}-12-31`,
    };
}

function obtenerPeriodoInicial() {
    const hoy = new Date();
    let anio = hoy.getFullYear();
    let mes = hoy.getMonth() - 1;
    if (mes < 0) {
        mes = 11;
        anio -= 1;
    }
    return { anio, mes, ...rangoMesISO(anio, mes) };
}

const PERIODO_INICIAL = obtenerPeriodoInicial();

const FILTROS_INICIALES = {
    ...FILTROS_VACIOS,
    fecha_desde: PERIODO_INICIAL.fecha_desde,
    fecha_hasta: PERIODO_INICIAL.fecha_hasta,
};

function claveOrden(orden) {
    return [orden?.agencia ?? "", orden?.nros ?? "", orden?.nratendimento ?? ""].join("|");
}

function tonoSituacion(valor) {
    const texto = String(valor || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (texto.includes("cancel") || texto.includes("anul")) return "border-rose-200 bg-rose-50 text-rose-700";
    if (texto.includes("cerr") || texto.includes("fech") || texto.includes("final")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (texto.includes("pend") || texto.includes("esper")) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatCell(fila, columna) {
    const valor = fila[columna.key];
    if (vacio(valor)) return "—";
    if (columna.tipo === "moneda") return dinero(valor);
    if (columna.tipo === "entero") return entero(valor);
    if (columna.tipo === "fecha") return formatearFecha(valor);
    return String(valor);
}

function agruparRequisiciones(detalle = []) {
    const mapa = new Map();

    detalle.forEach((fila) => {
        const clave = String(fila.nrreq ?? "sin-req");

        if (!mapa.has(clave)) {
            mapa.set(clave, {
                nrreq: fila.nrreq,
                dtemissao: fila.dtemissao,
                funcresp: fila.funcresp,
                qtdeitens: fila.qtdeitens,
                qtdeatend: fila.qtdeatend,
                piezas: [],
            });
        }

        mapa.get(clave).piezas.push(fila);
    });

    return Array.from(mapa.values());
}

function Badge({ children, className = "" }) {
    return (
        <span className={cn("inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-bold", className)}>
            <span className="truncate">{children}</span>
        </span>
    );
}

function KpiCard({ title, value, subtitle, icon: Icon, tono = "navy", loading }) {
    const tonos = {
        navy: "border-[#131E5C]/15 bg-[#131E5C]/10 text-[#131E5C]",
        sky: "border-sky-100 bg-sky-50 text-sky-600",
        emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
        amber: "border-amber-100 bg-amber-50 text-amber-600",
    };

    return (
        <div className="rounded-2xl border border-[#E4E7F0] bg-white p-4 shadow-sm transition hover:border-[#131E5C]/25 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{title}</p>

                    {loading ? (
                        <div className="mt-2 h-7 w-28 animate-pulse rounded-lg bg-slate-200" />
                    ) : (
                        <p className="mt-1.5 truncate text-[22px] font-black leading-none text-[#001E50]">{value}</p>
                    )}

                    <p className="mt-1.5 truncate text-[11px] font-medium text-slate-500">{subtitle}</p>
                </div>

                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", tonos[tono] || tonos.navy)}>
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, icon: Icon, children }) {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
                    <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#001E50]">{title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
                </div>
            </div>

            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}

function SinDatos() {
    return (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
            <SearchX className="h-7 w-7 text-slate-300" />
            <p className="text-xs font-semibold text-slate-400">Sin datos para mostrar</p>
        </div>
    );
}

function ColumnFilterMenu({ label, values, selected, onToggle, onClear, onClose, anchor }) {
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        function cerrar(event) {
            if (ref.current && !ref.current.contains(event.target)) onClose();
        }

        function tecla(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("mousedown", cerrar);
        document.addEventListener("keydown", tecla);

        return () => {
            document.removeEventListener("mousedown", cerrar);
            document.removeEventListener("keydown", tecla);
        };
    }, [onClose]);

    const filtrados = values.filter((value) =>
        String(value).toLowerCase().includes(query.toLowerCase())
    );

    if (typeof document === "undefined") return null;

    const ancho = 280;
    const left = Math.max(8, Math.min(anchor.left, window.innerWidth - ancho - 8));
    const top = anchor.bottom + 6;

    return createPortal(
        <div
            ref={ref}
            style={{
                position: "fixed",
                left,
                top,
                width: ancho,
                maxHeight: window.innerHeight - top - 16,
            }}
            className="z-[100] flex flex-col overflow-hidden rounded-xl border border-[#E4E7F0] bg-white shadow-2xl"
        >
            <div className="border-b border-[#E4E7F0] bg-[#F7F8FC] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>

                <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar valor..."
                        className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-[11px] outline-none focus:border-[#131E5C]"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
                {filtrados.length === 0 ? (
                    <p className="px-3 py-5 text-center text-[11px] text-slate-400">Sin coincidencias</p>
                ) : (
                    filtrados.map((value) => {
                        const texto = String(value);
                        const activo = selected.has(texto);

                        return (
                            <button
                                key={texto}
                                type="button"
                                onClick={() => onToggle(texto)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[#F7F8FC]"
                            >
                                <span className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                    activo ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300"
                                )}>
                                    {activo && <Check className="h-3 w-3" />}
                                </span>

                                <span className="truncate text-[11px] font-medium text-slate-700">{texto}</span>
                            </button>
                        );
                    })
                )}
            </div>

            <div className="flex gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC] p-2">
                <button
                    type="button"
                    onClick={onClear}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-[10px] font-bold text-slate-600"
                >
                    Limpiar
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg bg-[#131E5C] py-1.5 text-[10px] font-bold text-white"
                >
                    Listo
                </button>
            </div>
        </div>,
        document.body
    );
}

function FiltrosRapidos({
    filtros,
    opciones,
    anios,
    anio,
    mesActivo,
    anioCompleto,
    onBusqueda,
    onAgencia,
    onMes,
    onAnio,
    onAnioCompleto,
    onSinPeriodo,
}) {
    const hoy = new Date();
    const sinPeriodo = !filtros.fecha_desde && !filtros.fecha_hasta;

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                    type="search"
                    value={filtros.q}
                    onChange={(event) => onBusqueda(event.target.value)}
                    placeholder="Buscar OS, requisición, código, producto, responsable, agencia..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10"
                />
            </div>

            <div className="scrollbar-none flex flex-nowrap gap-1.5 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => onAgencia("")}
                    className={cn(
                        "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition",
                        !filtros.agencia
                            ? "bg-[#131E5C] text-white ring-2 ring-[#131E5C]/20"
                            : "border border-slate-200 bg-white text-[#001E50] hover:border-[#131E5C]/30"
                    )}
                >
                    Todas
                </button>

                {(opciones.agencias || []).map((agencia) => (
                    <button
                        key={agencia}
                        type="button"
                        onClick={() => onAgencia(agencia)}
                        className={cn(
                            "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition",
                            filtros.agencia === agencia
                                ? "bg-[#131E5C] text-white ring-2 ring-[#131E5C]/20"
                                : "border border-slate-200 bg-white text-[#001E50] hover:border-[#131E5C]/30"
                        )}
                    >
                        {agencia}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 lg:flex-row lg:items-center">
                <div className="flex shrink-0 items-center gap-1.5">
                    <div className="relative">
                        <select
                            value={anio}
                            onChange={(event) => onAnio(Number(event.target.value))}
                            className="appearance-none rounded-lg border border-slate-300 bg-white px-3 py-1.5 pr-8 text-xs font-bold text-[#001E50] outline-none"
                        >
                            {anios.map((valor) => (
                                <option key={valor} value={valor}>{valor}</option>
                            ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    </div>

                    <button
                        type="button"
                        onClick={onSinPeriodo}
                        className={cn(
                            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold",
                            sinPeriodo
                                ? "bg-[#131E5C] text-white"
                                : "border border-slate-200 bg-white text-slate-600"
                        )}
                    >
                        Histórico
                    </button>

                    <button
                        type="button"
                        onClick={onAnioCompleto}
                        className={cn(
                            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold",
                            anioCompleto
                                ? "bg-[#131E5C] text-white"
                                : "border border-slate-200 bg-white text-slate-600"
                        )}
                    >
                        Todo el año
                    </button>
                </div>

                <div className="scrollbar-none flex min-w-0 gap-1.5 overflow-x-auto">
                    {MESES.map((mes, index) => {
                        const futuro = anio === hoy.getFullYear() && index > hoy.getMonth();

                        return (
                            <button
                                key={mes}
                                type="button"
                                disabled={futuro}
                                onClick={() => onMes(index)}
                                className={cn(
                                    "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold",
                                    mesActivo === index
                                        ? "bg-[#131E5C] text-white"
                                        : futuro
                                            ? "cursor-not-allowed border border-slate-200 bg-white text-slate-300"
                                            : "border border-slate-200 bg-white text-slate-600 hover:border-[#131E5C]/30"
                                )}
                            >
                                {mes.toLowerCase()}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function ResumenEjecutivo({ dashboard, loading }) {
    const totales = dashboard?.totales || {};

    const totalServicio =
        numero(totales.refacciones_mano_obra) ||
        numero(totales.valor_productos) + numero(totales.mano_obra);

    return (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1340] via-[#131E5C] to-[#1E2F7A] p-5 text-white shadow-[0_18px_40px_-18px_rgba(10,19,64,.7)] md:p-6">
            <Wrench
                className="pointer-events-none absolute -bottom-12 -right-10 h-64 w-64 text-white/[.05]"
                strokeWidth={1}
            />

            <div className="relative grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 lg:border-r lg:border-white/10 lg:pr-6">
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-sky-300">
                        Resumen Servicio
                    </p>

                    {loading ? (
                        <div className="mt-2 h-12 w-56 animate-pulse rounded-xl bg-white/10" />
                    ) : (
                        <p className="mt-1 text-4xl font-black tracking-tight">
                            {dinero(totalServicio)}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-7">
                    <MiniResumen label="Órdenes" value={loading ? "—" : entero(totales.ordenes)} />
                    <MiniResumen label="Requisiciones" value={loading ? "—" : entero(totales.requisiciones)} />
                    <MiniResumen label="Partidas" value={loading ? "—" : entero(totales.partidas)} />
                    <MiniResumen label="Refacciones" value={loading ? "—" : dineroCompacto(totales.valor_productos)} />
                    <MiniResumen label="Mano de obra" value={loading ? "—" : dineroCompacto(totales.mano_obra)} />
                    <MiniResumen label="Descuentos" value={loading ? "—" : dineroCompacto(totales.descuentos)} />
                </div>
            </div>
        </section>
    );
}

function MiniResumen({ label, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-black">{value}</p>
        </div>
    );
}

function GraficosDashboard({ dashboard, loading }) {
    const graficas = dashboard?.graficas || {};
    const agencias = graficas.por_agencia || [];
    const tipos = graficas.por_tipo_os || [];
    const situaciones = graficas.por_situacion || [];
    const garantias = graficas.por_garantia || [];
    const porDia = (graficas.por_dia || []).map((item) => ({
        ...item,
        fecha_label: formatearFechaCorta(item.fecha),
    }));

    if (loading) {
        return (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {[0, 1, 2, 3, 4].map((item) => (
                    <div
                        key={item}
                        className="h-[330px] animate-pulse rounded-2xl border border-[#E4E7F0] bg-white"
                    />
                ))}
            </section>
        );
    }

    return (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
                title="Refacciones y mano de obra por agencia"
                subtitle="Importes acumulados del periodo seleccionado"
                icon={Store}
            >
                {agencias.length === 0 ? (
                    <SinDatos />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={agencias}
                            margin={{ top: 10, right: 12, left: 4, bottom: 55 }}
                        >
                            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="agencia"
                                angle={-18}
                                textAnchor="end"
                                height={70}
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis tickFormatter={dineroCompacto} tick={{ fontSize: 10 }} />
                            <Tooltip
                                formatter={(value, name) => [
                                    dinero(value),
                                    name === "valor_productos" ? "Refacciones" : "Mano de obra",
                                ]}
                                contentStyle={TOOLTIP_STYLE}
                            />
                            <Legend />
                            <Bar dataKey="valor_productos" name="Refacciones" stackId="importe" fill={C.accent} />
                            <Bar dataKey="mano_obra" name="Mano de obra" stackId="importe" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            <GraficaHorizontal
                title="Órdenes por tipo de OS"
                subtitle="Distribución de órdenes"
                icon={Wrench}
                data={tipos}
                labelKey="tipo"
                valueKey="ordenes"
            />

            <GraficaHorizontal
                title="Órdenes por situación"
                subtitle="Situación registrada en la orden"
                icon={Filter}
                data={situaciones}
                labelKey="situacion"
                valueKey="ordenes"
            />

            <ChartCard
                title="Órdenes cerradas por día"
                subtitle="Comportamiento diario del periodo"
                icon={CalendarDays}
            >
                {porDia.length === 0 ? (
                    <SinDatos />
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={porDia}
                            margin={{ top: 10, right: 15, bottom: 10, left: 0 }}
                        >
                            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="fecha_label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                            <Tooltip
                                formatter={(value) => [entero(value), "Órdenes"]}
                                contentStyle={TOOLTIP_STYLE}
                            />
                            <Line
                                type="monotone"
                                dataKey="ordenes"
                                stroke="#1677FF"
                                strokeWidth={3}
                                dot={{ r: 3, fill: "#1677FF" }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            <GraficaHorizontal
                title="Órdenes por garantía"
                subtitle="Distribución según situación de garantía"
                icon={Wrench}
                data={garantias}
                labelKey="garantia"
                valueKey="ordenes"
            />
        </section>
    );
}

function GraficaHorizontal({ title, subtitle, icon, data, labelKey, valueKey }) {
    return (
        <ChartCard title={title} subtitle={subtitle} icon={icon}>
            {!data?.length ? (
                <SinDatos />
            ) : (
                <ResponsiveContainer width="100%" height={Math.max(280, data.length * 32)}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 65, bottom: 5 }}
                    >
                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                            type="category"
                            dataKey={labelKey}
                            width={105}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                            formatter={(value) => [entero(value), "Órdenes"]}
                            contentStyle={TOOLTIP_STYLE}
                        />
                        <Bar
                            dataKey={valueKey}
                            fill="#1677FF"
                            radius={[0, 6, 6, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </ChartCard>
    );
}

function FiltrosActivos({
    filtros,
    colFilters,
    onRemoveBase,
    onRemoveColumn,
}) {
    const activos = [];

    if (filtros.agencia) {
        activos.push({
            key: "agencia",
            label: "Agencia",
            value: filtros.agencia,
        });
    }

    if (filtros.fecha_desde || filtros.fecha_hasta) {
        activos.push({
            key: "periodo",
            label: "Cierre",
            value: `${formatearFecha(filtros.fecha_desde)} → ${formatearFecha(filtros.fecha_hasta)}`,
        });
    }

    if (filtros.func_resp) {
        activos.push({
            key: "func_resp",
            label: "Responsable",
            value: filtros.func_resp,
        });
    }

    Object.entries(colFilters).forEach(([key, values]) => {
        if (!Array.isArray(values) || values.length === 0) return;

        const columna = COLUMNAS.find((item) => item.filtro === key);

        activos.push({
            key: `col-${key}`,
            columnKey: key,
            label: columna?.label || key,
            value: values.join(", "),
            column: true,
        });
    });

    if (activos.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {activos.map((item) => (
                <span
                    key={item.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-2.5 py-1 text-[10px] font-bold text-[#131E5C]"
                >
                    <span className="text-slate-400">{item.label}:</span>
                    <span className="max-w-[260px] truncate">{item.value}</span>

                    <button
                        type="button"
                        onClick={() =>
                            item.column
                                ? onRemoveColumn(item.columnKey)
                                : onRemoveBase(item.key)
                        }
                        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#131E5C]/10"
                    >
                        ×
                    </button>
                </span>
            ))}
        </div>
    );
}

function DetalleOrden({ orden, detalle, loading, error, onClose }) {
    const requisiciones = useMemo(
        () => agruparRequisiciones(detalle?.results || []),
        [detalle],
    );

    return (
        <div className="border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
            <div className="overflow-hidden rounded-xl border border-[#E4E7F0] bg-white">
                <div className="flex items-center gap-3 border-b border-[#E4E7F0] px-4 py-2.5">
                    <span className="rounded-lg bg-[#0A1340] px-2 py-1 text-[11px] font-black text-white">
                        OS {orden.nros}
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-[#001E50]">{orden.agencia}</p>
                        <p className="text-[10px] text-slate-500">Atención {orden.nratendimento}</p>
                    </div>

                    <div className="hidden flex-wrap gap-2 md:flex">
                        <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                            Refacciones {dinero(orden.valor_productos)}
                        </Badge>

                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                            Mano obra {dinero(orden.ttmo)}
                        </Badge>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1340] text-white"
                    >
                        <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-px bg-[#E4E7F0] sm:grid-cols-3 xl:grid-cols-6">
                    <InfoBox label="Tipo OS" value={orden.tpos} />
                    <InfoBox label="Subtipo" value={orden.subtipoos} />
                    <InfoBox label="Situación" value={orden.situacao} />
                    <InfoBox label="Apertura" value={formatearFecha(orden.dtabertura)} />
                    <InfoBox label="Cierre" value={formatearFecha(orden.dtfechamento)} />
                    <InfoBox label="Garantía" value={orden.sitgarantia} />
                    <InfoBox label="Total piezas OS" value={dinero(orden.vrtotalpecas)} />
                    <InfoBox label="Valor partidas" value={dinero(orden.valor_productos)} />
                    <InfoBox label="Mano de obra" value={dinero(orden.ttmo)} />
                    <InfoBox label="Adicionales" value={dinero(orden.vradicionais)} />
                    <InfoBox label="Descuento OS" value={dinero(orden.vrdescpeca)} />
                    <InfoBox label="Desc. partidas" value={dinero(orden.descuentos)} />
                    <InfoBox label="Cond. pago" value={orden.codcondpgto} />
                    <InfoBox label="Oper. fiscal" value={orden.codoperfiscal} />
                    <InfoBox label="Requisiciones" value={entero(orden.requisiciones)} />
                    <InfoBox label="Partidas" value={entero(orden.partidas)} />
                </div>

                {loading ? (
                    <div className="flex min-h-48 items-center justify-center">
                        <LoaderCircle className="h-7 w-7 animate-spin text-[#131E5C]" />
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 p-5 text-xs font-bold text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                    </div>
                ) : requisiciones.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        Sin partidas para esta orden.
                    </div>
                ) : (
                    <div className="space-y-3 p-3">
                        {requisiciones.map((req) => (
                            <RequisicionCard key={req.nrreq} req={req} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="bg-white px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 truncate text-[11px] font-bold text-slate-800">
                {vacio(value) ? "—" : value}
            </p>
        </div>
    );
}

function RequisicionCard({ req }) {
    const importe = req.piezas.reduce(
        (total, pieza) => total + numero(pieza.vrprod),
        0,
    );

    return (
        <div className="overflow-hidden rounded-xl border border-[#E4E7F0]">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F8FC] px-3 py-2">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border-[#131E5C]/15 bg-[#131E5C]/10 text-[#131E5C]">
                        Req. {req.nrreq}
                    </Badge>

                    <span className="text-[11px] text-slate-500">
                        Emisión <strong>{formatearFecha(req.dtemissao)}</strong>
                    </span>

                    <span className="text-[11px] text-slate-500">
                        Responsable <strong>{req.funcresp ?? "—"}</strong>
                    </span>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">
                    <span>Ítems {entero(req.qtdeitens)}</span>
                    <span>Atendidos {entero(req.qtdeatend)}</span>
                    <span className="text-[#131E5C]">{dinero(importe)}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-xs">
                    <thead>
                        <tr className="border-b border-[#E4E7F0] bg-white text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            <th className="px-3 py-2 text-left">Código</th>
                            <th className="px-3 py-2 text-left">Producto</th>
                            <th className="px-3 py-2 text-right">Unitario</th>
                            <th className="px-3 py-2 text-right">% desc.</th>
                            <th className="px-3 py-2 text-right">Descuento</th>
                            <th className="px-3 py-2 text-right">Importe</th>
                        </tr>
                    </thead>

                    <tbody>
                        {req.piezas.map((pieza, index) => (
                            <tr
                                key={`${pieza.codprod}-${index}`}
                                className={cn(
                                    "border-b border-slate-100 last:border-0",
                                    index % 2 === 1 && "bg-[#FAFBFF]",
                                )}
                            >
                                <td className="px-3 py-2 font-bold text-[#131E5C]">
                                    {String(pieza.codprod ?? "").trim() || "—"}
                                </td>

                                <td
                                    className="max-w-[360px] truncate px-3 py-2 text-slate-700"
                                    title={pieza.nmproduto || ""}
                                >
                                    {pieza.nmproduto || "—"}
                                </td>

                                <td className="px-3 py-2 text-right">{dinero(pieza.precounit)}</td>

                                <td className="px-3 py-2 text-right">
                                    {numero(pieza.percdesc).toLocaleString("es-MX", {
                                        maximumFractionDigits: 2,
                                    })}%
                                </td>

                                <td className="px-3 py-2 text-right text-rose-600">
                                    {dinero(pieza.vrdesc)}
                                </td>

                                <td className="px-3 py-2 text-right font-black text-[#131E5C]">
                                    {dinero(pieza.vrprod)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TablaOrdenes({
    rows,
    loading,
    total,
    page,
    pageSize,
    totalPages,
    ordering,
    opciones,
    colFilters,
    setColFilters,
    detalleAbierto,
    detallePorOrden,
    loadingDetalle,
    errorDetalle,
    onOrdenar,
    onToggle,
    onPrev,
    onNext,
    onPageSize,
}) {
    const [filtroAbierto, setFiltroAbierto] = useState(null);
    const scrollRef = useRef(null);
    const [anchoVista, setAnchoVista] = useState(0);

    useEffect(() => {
        const elemento = scrollRef.current;
        if (!elemento || typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) setAnchoVista(Math.round(entry.contentRect.width));
        });

        observer.observe(elemento);
        return () => observer.disconnect();
    }, []);

    function abrirFiltro(columna, event) {
        event.stopPropagation();

        setFiltroAbierto({
            columna,
            anchor: event.currentTarget.getBoundingClientRect(),
        });
    }

    function valoresFiltro(columna) {
        return (opciones[columna.opciones] || []).map((value) => String(value));
    }

    function seleccionados(columna) {
        return new Set(colFilters[columna.filtro] || []);
    }

    function toggleFiltro(columna, value) {
        setColFilters((prev) => {
            const actual = new Set(prev[columna.filtro] || []);

            if (actual.has(value)) actual.delete(value);
            else actual.add(value);

            const siguiente = { ...prev };

            if (actual.size === 0) delete siguiente[columna.filtro];
            else siguiente[columna.filtro] = Array.from(actual);

            return siguiente;
        });
    }

    function limpiarColumna(columna) {
        setColFilters((prev) => {
            const next = { ...prev };
            delete next[columna.filtro];
            return next;
        });
    }

    function iconoOrden(columna) {
        if (ordering === columna.key) return <ArrowUp className="h-3 w-3" />;
        if (ordering === `-${columna.key}`) return <ArrowDown className="h-3 w-3" />;
        return <ArrowUpDown className="h-3 w-3 text-white/40" />;
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
                        <Sheet className="h-4 w-4" />
                    </span>

                    <div>
                        <p className="text-sm font-bold text-[#001E50]">Órdenes facturadas</p>
                        <p className="text-[11px] text-slate-500">
                            {entero(total)} OS · paginación desde SQL Server
                        </p>
                    </div>
                </div>

                {Object.keys(colFilters).length > 0 && (
                    <button
                        type="button"
                        onClick={() => setColFilters({})}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-bold text-rose-600"
                    >
                        <ListFilter className="h-3.5 w-3.5" />
                        Limpiar filtros de tabla
                    </button>
                )}
            </div>

            <div
                ref={scrollRef}
                className="max-h-[72vh] min-h-[450px] overflow-auto"
            >
                <table className="min-w-max border-collapse">
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-[#131E5C]">
                            {COLUMNAS.map((columna) => {
                                const activo =
                                    columna.filtro &&
                                    (colFilters[columna.filtro] || []).length > 0;

                                return (
                                    <th
                                        key={columna.key}
                                        className="whitespace-nowrap border-b border-white/10 px-3 py-2 text-left"
                                    >
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onOrdenar(columna.key)}
                                                className="flex items-center gap-1 rounded px-1 py-1 text-[9px] font-bold uppercase tracking-wider text-white hover:bg-white/10"
                                            >
                                                {iconoOrden(columna)}
                                                {columna.label}
                                            </button>

                                            {columna.filtro && (
                                                <button
                                                    type="button"
                                                    onClick={(event) => abrirFiltro(columna, event)}
                                                    className={cn(
                                                        "flex h-5 w-5 items-center justify-center rounded",
                                                        activo
                                                            ? "bg-amber-300 text-[#131E5C]"
                                                            : "text-white/45 hover:bg-white/15 hover:text-white",
                                                    )}
                                                >
                                                    <Filter className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}

                            <th className="w-10 bg-[#131E5C]" />
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({ length: 10 }).map((_, index) => (
                                <tr key={index}>
                                    {COLUMNAS.map((columna) => (
                                        <td
                                            key={columna.key}
                                            className="border-b border-slate-100 px-3 py-2.5"
                                        >
                                            <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                                        </td>
                                    ))}
                                    <td />
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={COLUMNAS.length + 1}
                                    className="px-8 py-16 text-center"
                                >
                                    <SearchX className="mx-auto h-8 w-8 text-slate-300" />

                                    <p className="mt-3 text-sm font-bold text-slate-700">
                                        Sin órdenes
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        No existen registros para los filtros actuales.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            rows.map((orden, index) => {
                                const clave = claveOrden(orden);
                                const expandida = detalleAbierto === clave;

                                return (
                                    <Fragment key={clave}>
                                        <tr
                                            tabIndex={0}
                                            onClick={() => onToggle(orden)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    onToggle(orden);
                                                }
                                            }}
                                            className={cn(
                                                "group cursor-pointer border-b border-slate-100 transition hover:bg-[#EAF1FF]",
                                                index % 2 === 1 && "bg-[#FAFBFF]",
                                                expandida && "bg-[#EAF1FF]",
                                            )}
                                        >
                                            {COLUMNAS.map((columna) => {
                                                const texto = formatCell(orden, columna);

                                                return (
                                                    <td
                                                        key={columna.key}
                                                        className={cn(
                                                            "whitespace-nowrap px-3 py-2.5 text-xs",
                                                            columna.fuerte
                                                                ? "font-bold text-[#131E5C]"
                                                                : "text-slate-700",
                                                        )}
                                                    >
                                                        {columna.estado && texto !== "—" ? (
                                                            <Badge className={tonoSituacion(texto)}>
                                                                {texto}
                                                            </Badge>
                                                        ) : columna.chip && texto !== "—" ? (
                                                            <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                                                                {texto}
                                                            </Badge>
                                                        ) : (
                                                            texto
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            <td className="px-2">
                                                <span
                                                    className={cn(
                                                        "flex h-7 w-7 items-center justify-center rounded-lg border border-[#131E5C]/15 bg-white text-[#131E5C] opacity-0 transition group-hover:opacity-100",
                                                        expandida &&
                                                        "rotate-90 border-[#131E5C] bg-[#131E5C] text-white opacity-100",
                                                    )}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </span>
                                            </td>
                                        </tr>

                                        {expandida && (
                                            <tr>
                                                <td colSpan={COLUMNAS.length + 1} className="p-0">
                                                    <div
                                                        className="sticky left-0 z-10"
                                                        style={{ width: anchoVista || "100%" }}
                                                    >
                                                        <DetalleOrden
                                                            orden={orden}
                                                            detalle={detallePorOrden[clave]}
                                                            loading={loadingDetalle[clave]}
                                                            error={errorDetalle[clave]}
                                                            onClose={() => onToggle(orden)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Mostrar</span>

                    <select
                        value={pageSize}
                        onChange={(event) => onPageSize(Number(event.target.value))}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700"
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                    </select>

                    <span className="text-slate-500">
                        de <strong>{entero(total)}</strong> OS
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={onPrev}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="min-w-[120px] text-center text-xs font-semibold text-slate-600">
                        Página {page} de {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={page >= totalPages || loading}
                        onClick={onNext}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {filtroAbierto && (
                <ColumnFilterMenu
                    label={filtroAbierto.columna.label}
                    values={valoresFiltro(filtroAbierto.columna)}
                    selected={seleccionados(filtroAbierto.columna)}
                    onToggle={(value) =>
                        toggleFiltro(
                            filtroAbierto.columna,
                            value,
                        )
                    }
                    onClear={() =>
                        limpiarColumna(
                            filtroAbierto.columna,
                        )
                    }
                    onClose={() => setFiltroAbierto(null)}
                    anchor={filtroAbierto.anchor}
                />
            )}
        </div>
    );
}

export default function OrdenesFacturadas() {
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
    const [opciones, setOpciones] = useState({});
    const [colFilters, setColFilters] = useState({});
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);

    const [dashboard, setDashboard] = useState({
        totales: {},
        graficas: {},
    });

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [ordering, setOrdering] = useState("-dtfechamento");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [opcionesLoading, setOpcionesLoading] = useState(true);
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);
    const [anioPeriodo, setAnioPeriodo] = useState(PERIODO_INICIAL.anio);
    const [detalleAbierto, setDetalleAbierto] = useState(null);
    const [detallePorOrden, setDetallePorOrden] = useState({});
    const [loadingDetalle, setLoadingDetalle] = useState({});
    const [errorDetalle, setErrorDetalle] = useState({});
    const [refreshVersion, setRefreshVersion] = useState(0);

    useEffect(() => {
        let vigente = true;

        setOpcionesLoading(true);

        getOrdenesFacturadasOpciones()
            .then((data) => {
                if (!vigente) return;
                setOpciones(data || {});
                setOpcionesLoading(false);
            })
            .catch((err) => {
                if (!vigente) return;
                console.error("Error opciones órdenes:", err);
                setOpcionesLoading(false);
            });

        return () => {
            vigente = false;
        };
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setFiltrosAplicados((prev) => {
                if (prev.q === filtros.q) return prev;

                return {
                    ...prev,
                    q: filtros.q,
                };
            });

            setPage(1);
        }, 450);

        return () => window.clearTimeout(timer);
    }, [filtros.q]);

    const colFiltersQuery = useMemo(() => {
        const resultado = {};

        Object.entries(colFilters).forEach(([key, values]) => {
            if (!Array.isArray(values) || values.length === 0) return;

            if (values.length === 1) {
                resultado[key] = values[0];
            } else {
                resultado[`${key}__in`] = values.join(",");
            }
        });

        return resultado;
    }, [colFilters]);

    const paramsConsulta = useMemo(
        () => ({
            ...filtrosAplicados,
            ...colFiltersQuery,
        }),
        [
            filtrosAplicados,
            colFiltersQuery,
        ],
    );

    useEffect(() => {
        let vigente = true;

        setLoading(true);

        getOrdenesFacturadas({
            ...paramsConsulta,
            page,
            page_size: pageSize,
            ordering,
        })
            .then((data) => {
                if (!vigente) return;

                setRows(
                    Array.isArray(data?.results)
                        ? data.results
                        : [],
                );

                setTotal(
                    Number(
                        data?.count || 0,
                    ),
                );

                setDashboard({
                    totales: data?.metricas || {},
                    graficas: data?.graficas || {},
                });

                setError("");
                setLoading(false);
            })
            .catch((err) => {
                if (!vigente) return;

                console.error("Error órdenes facturadas:", err);

                setRows([]);
                setTotal(0);

                setDashboard({
                    totales: {},
                    graficas: {},
                });

                setError(
                    err?.message ||
                    "No fue posible consultar las órdenes facturadas.",
                );

                setLoading(false);
            });

        return () => {
            vigente = false;
        };
    }, [
        paramsConsulta,
        page,
        pageSize,
        ordering,
        refreshVersion,
    ]);

    const anios = useMemo(() => {
        const actual = new Date().getFullYear();

        const minima = Number(
            String(
                opciones?.fechas?.minima ||
                "",
            ).slice(0, 4),
        );

        const maxima = Number(
            String(
                opciones?.fechas?.maxima ||
                "",
            ).slice(0, 4),
        );

        if (
            Number.isFinite(minima) &&
            Number.isFinite(maxima) &&
            minima > 0 &&
            maxima >= minima
        ) {
            return Array.from(
                {
                    length:
                        maxima -
                        minima +
                        1,
                },
                (_, index) =>
                    maxima -
                    index,
            );
        }

        return [
            actual,
            actual - 1,
            actual - 2,
        ];
    }, [opciones]);

    const anioEfectivo =
        anios.includes(anioPeriodo)
            ? anioPeriodo
            : anios[0] ||
            PERIODO_INICIAL.anio;

    const mesActivo = useMemo(() => {
        if (
            !filtros.fecha_desde ||
            !filtros.fecha_hasta
        ) {
            return null;
        }

        const index = MESES.findIndex((_, mes) => {
            const rango =
                rangoMesISO(
                    anioEfectivo,
                    mes,
                );

            return (
                rango.fecha_desde ===
                filtros.fecha_desde &&
                rango.fecha_hasta ===
                filtros.fecha_hasta
            );
        });

        return index >= 0
            ? index
            : null;
    }, [
        filtros.fecha_desde,
        filtros.fecha_hasta,
        anioEfectivo,
    ]);

    const anioCompleto = useMemo(() => {
        const rango =
            rangoAnioISO(
                anioEfectivo,
            );

        return (
            filtros.fecha_desde ===
            rango.fecha_desde &&
            filtros.fecha_hasta ===
            rango.fecha_hasta
        );
    }, [
        filtros.fecha_desde,
        filtros.fecha_hasta,
        anioEfectivo,
    ]);

    function aplicarRapido(parche) {
        const siguiente = {
            ...filtros,
            ...parche,
        };

        setFiltros(siguiente);
        setFiltrosAplicados(siguiente);
        setPage(1);
        setDetalleAbierto(null);
    }

    function seleccionarAgencia(valor) {
        aplicarRapido({
            agencia:
                filtros.agencia === valor
                    ? ""
                    : valor,
        });
    }

    function seleccionarMes(index) {
        if (mesActivo === index) {
            aplicarRapido({
                fecha_desde: "",
                fecha_hasta: "",
            });

            return;
        }

        aplicarRapido(
            rangoMesISO(
                anioEfectivo,
                index,
            ),
        );
    }

    function seleccionarAnioCompleto() {
        if (anioCompleto) {
            aplicarRapido({
                fecha_desde: "",
                fecha_hasta: "",
            });

            return;
        }

        aplicarRapido(
            rangoAnioISO(
                anioEfectivo,
            ),
        );
    }

    function seleccionarHistorico() {
        aplicarRapido({
            fecha_desde: "",
            fecha_hasta: "",
        });
    }

    function cambiarAnio(nuevoAnio) {
        const mesAnterior =
            mesActivo;

        const estabaAnioCompleto =
            anioCompleto;

        setAnioPeriodo(
            nuevoAnio,
        );

        if (mesAnterior !== null) {
            aplicarRapido(
                rangoMesISO(
                    nuevoAnio,
                    mesAnterior,
                ),
            );
        } else if (estabaAnioCompleto) {
            aplicarRapido(
                rangoAnioISO(
                    nuevoAnio,
                ),
            );
        }
    }

    function aplicarFiltrosAvanzados() {
        setFiltrosAplicados(
            filtros,
        );

        setPage(1);
        setDetalleAbierto(null);
    }

    function restablecerFiltros() {
        setFiltros(
            FILTROS_INICIALES,
        );

        setFiltrosAplicados(
            FILTROS_INICIALES,
        );

        setColFilters({});
        setAnioPeriodo(
            PERIODO_INICIAL.anio,
        );

        setPage(1);
        setOrdering(
            "-dtfechamento",
        );

        setDetalleAbierto(null);
    }

    function quitarFiltroBase(key) {
        if (key === "periodo") {
            aplicarRapido({
                fecha_desde: "",
                fecha_hasta: "",
            });

            return;
        }

        aplicarRapido({
            [key]: "",
        });
    }

    function quitarFiltroColumna(key) {
        setColFilters((prev) => {
            const next = {
                ...prev,
            };

            delete next[key];

            return next;
        });

        setPage(1);
    }

    const actualizarFiltrosTabla = useCallback((updater) => {
        setColFilters((prev) =>
            typeof updater === "function"
                ? updater(prev)
                : updater
        );

        setPage(1);
        setDetalleAbierto(null);
    }, []);

    function ordenar(key) {
        setOrdering((prev) => {
            if (prev === key) {
                return `-${key}`;
            }

            if (prev === `-${key}`) {
                return key;
            }

            return `-${key}`;
        });

        setPage(1);
        setDetalleAbierto(null);
    }

    const alternarDetalle = useCallback(
        async (orden) => {
            const clave =
                claveOrden(
                    orden,
                );

            if (
                detalleAbierto ===
                clave
            ) {
                setDetalleAbierto(null);
                return;
            }

            setDetalleAbierto(clave);

            if (
                detallePorOrden[
                clave
                ]
            ) {
                return;
            }

            setLoadingDetalle((prev) => ({
                ...prev,
                [clave]: true,
            }));

            setErrorDetalle((prev) => ({
                ...prev,
                [clave]: "",
            }));

            try {
                const data =
                    await getOrdenFacturadaDetalle({
                        agencia:
                            orden.agencia,

                        nros:
                            orden.nros,

                        nratendimento:
                            orden.nratendimento,
                    });

                setDetallePorOrden((prev) => ({
                    ...prev,
                    [clave]: data,
                }));
            } catch (err) {
                console.error(
                    "Error detalle OS:",
                    err,
                );

                setErrorDetalle((prev) => ({
                    ...prev,

                    [clave]:
                        err?.message ||
                        "No fue posible consultar el detalle de la OS.",
                }));
            } finally {
                setLoadingDetalle((prev) => ({
                    ...prev,
                    [clave]: false,
                }));
            }
        },
        [
            detalleAbierto,
            detallePorOrden,
        ],
    );

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                pageSize,
            ),
        );

    const totales =
        dashboard?.totales ||
        {};

    return (
        <main className="min-h-screen pb-10">
            <div className="border-b border-[#E4E7F0] bg-white px-4 py-5 md:px-6 lg:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C] text-white">
                            <CircleDollarSign className="h-5 w-5" />
                        </span>

                        <div>
                            <h1 className="text-xl font-black tracking-tight text-[#001E50] md:text-2xl">
                                Órdenes Facturadas
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge className="border-[#131E5C]/15 bg-[#131E5C]/5 text-[#131E5C]">
                            {loading
                                ? "Consultando..."
                                : `${entero(total)} OS`}
                        </Badge>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                                setRefreshVersion(
                                    (prev) =>
                                        prev + 1,
                                )
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-[#131E5C] transition hover:border-[#131E5C] disabled:opacity-50"
                        >
                            <RefreshCw
                                className={cn(
                                    "h-3.5 w-3.5",
                                    loading &&
                                    "animate-spin",
                                )}
                            />

                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-5 px-4 py-8 md:px-6 lg:px-8">
                <section className="sticky top-0 z-30 p-4 backdrop-blur">
                    <FiltrosRapidos
                        filtros={filtros}
                        opciones={opciones}
                        anios={anios}
                        anio={anioEfectivo}
                        mesActivo={mesActivo}
                        anioCompleto={anioCompleto}
                        onBusqueda={(value) =>
                            setFiltros((prev) => ({
                                ...prev,
                                q: value,
                            }))
                        }
                        onAgencia={seleccionarAgencia}
                        onMes={seleccionarMes}
                        onAnio={cambiarAnio}
                        onAnioCompleto={seleccionarAnioCompleto}
                        onSinPeriodo={seleccionarHistorico}
                    />
                </section>

                <FiltrosActivos
                    filtros={filtrosAplicados}
                    colFilters={colFilters}
                    onRemoveBase={quitarFiltroBase}
                    onRemoveColumn={quitarFiltroColumna}
                />

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <ResumenEjecutivo
                    dashboard={dashboard}
                    loading={loading}
                />

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Órdenes"
                        value={entero(totales.ordenes)}
                        subtitle={`${entero(totales.requisiciones)} requisiciones`}
                        icon={Wrench}
                        tono="navy"
                        loading={loading}
                    />

                    <KpiCard
                        title="Refacciones"
                        value={dinero(totales.valor_productos)}
                        subtitle={`${entero(totales.partidas)} partidas`}
                        icon={PackageSearch}
                        tono="sky"
                        loading={loading}
                    />

                    <KpiCard
                        title="Mano de obra"
                        value={dinero(totales.mano_obra)}
                        subtitle="TtMo acumulado por OS"
                        icon={CircleDollarSign}
                        tono="emerald"
                        loading={loading}
                    />

                    <KpiCard
                        title="Descuentos"
                        value={dinero(totales.descuentos)}
                        subtitle={`${dineroCompacto(totales.adicionales)} adicionales`}
                        icon={Filter}
                        tono="amber"
                        loading={loading}
                    />
                </section>

                <GraficosDashboard
                    dashboard={dashboard}
                    loading={loading}
                />

                <TablaOrdenes
                    rows={rows}
                    loading={loading}
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    ordering={ordering}
                    opciones={opciones}
                    colFilters={colFilters}
                    setColFilters={actualizarFiltrosTabla}
                    detalleAbierto={detalleAbierto}
                    detallePorOrden={detallePorOrden}
                    loadingDetalle={loadingDetalle}
                    errorDetalle={errorDetalle}
                    onOrdenar={ordenar}
                    onToggle={alternarDetalle}
                    onPrev={() => {
                        setPage((prev) =>
                            Math.max(
                                1,
                                prev - 1,
                            )
                        );

                        setDetalleAbierto(null);
                    }}
                    onNext={() => {
                        setPage((prev) =>
                            Math.min(
                                totalPages,
                                prev + 1,
                            )
                        );

                        setDetalleAbierto(null);
                    }}
                    onPageSize={(value) => {
                        setPageSize(value);
                        setPage(1);
                        setDetalleAbierto(null);
                    }}
                />
            </div>
        </main>
    );
}