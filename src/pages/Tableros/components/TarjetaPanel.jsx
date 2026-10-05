// src/pages/Tableros/components/TarjetaPanel.jsx
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
    Layers,
    RotateCcw,
    Trash2,
    Loader2,
    AlertCircle,
    Info,
    CalendarClock,
    CalendarDays,
    Car,
    Building2,
    BadgeDollarSign,
    Users,
    WalletCards,
    TrendingUp,
    Globe,
    GripVertical,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { CATALOGO_CRM, COLOR_CONFIG, PALETA_AZULES } from "../config/catalogoModulos";
import { obtenerDatosSubmodulo } from "../services/tablerosService";

const COLORES_EMBUDO_AZUL = [
    "#001E50",
    "#0C3473",
    "#164E9B",
    "#1D5FD1",
    "#0284C7",
    "#1677FF",
];

const KPI_CARD =
    "h-[96px] rounded-xl border border-slate-200 bg-slate-50/80 p-2 shadow-sm overflow-hidden";

const KPI_LABEL =
    "flex items-start gap-1.5 text-[9px] leading-tight font-bold text-slate-500 uppercase";

const KPI_VALUE =
    "mt-1 text-base leading-tight font-black text-[#001E50]";

const KPI_SUB =
    "mt-1 text-[9px] leading-tight font-semibold text-slate-400";

function EmbudoRenderer({ datos }) {
    if (!datos?.etapas) return null;

    return (
        <div className="space-y-4">
            {datos.kpis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {datos.kpis.map((kpi, i) => {
                        const Icon = kpi.icon || Info;
                        return (
                            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                    <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                    <span>{kpi.label}</span>
                                </div>
                                <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="space-y-3 pt-1">
                {datos.etapas.map((item, index) => {
                    const ancho = item.cantidad === 0 ? 0 : Math.max(item.porcentaje, 16);
                    const colorBarra = COLORES_EMBUDO_AZUL[index % COLORES_EMBUDO_AZUL.length];

                    return (
                        <div key={item.etapa} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700">
                                    {index + 1}. {item.etapa}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800">{item.cantidad.toLocaleString("es-MX")}</span>
                                    <span className="text-[11px] font-semibold text-slate-400">({item.porcentaje}%)</span>
                                </div>
                            </div>

                            <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100 p-0.5">
                                <div
                                    style={{
                                        width: `${ancho}%`,
                                        backgroundColor: colorBarra,
                                    }}
                                    className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white shadow-xs"
                                >
                                    {item.porcentaje >= 18 ? `${item.porcentaje}%` : ""}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {datos.nota && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                    <Info className="h-3.5 w-3.5 shrink-0 text-[#1677FF]" />
                    <span>{datos.nota}</span>
                </div>
            )}
        </div>
    );
}

function ProspectosDigitalesRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("embudo");

    return (
        <div className="space-y-4">
            {/* KPIs Superiores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;
                    return (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>
                            <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas de Vista Rápida */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button
                    type="button"
                    onClick={() => setVistaActiva("embudo")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "embudo" ? "bg-[#001E50] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Embudo Comercial
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("asesores")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "asesores" ? "bg-[#001E50] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <Users className="h-3.5 w-3.5" />
                    Rendimiento Asesores
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("origen")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "origen" ? "bg-[#001E50] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <Globe className="h-3.5 w-3.5" />
                    Canales de Origen
                </button>
            </div>

            {/* Vista 1: Embudo */}
            {vistaActiva === "embudo" && (
                <div className="space-y-3 pt-1">
                    {datos.etapas.map((item, index) => {
                        const ancho = item.cantidad === 0 ? 0 : Math.max(item.porcentaje, 16);
                        return (
                            <div key={item.etapa} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-700">{index + 1}. {item.etapa}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-slate-800">{item.cantidad.toLocaleString("es-MX")}</span>
                                        <span className="text-[11px] font-semibold text-slate-400">({item.porcentaje}%)</span>
                                    </div>
                                </div>
                                <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100 p-0.5">
                                    <div
                                        style={{ width: `${ancho}%`, backgroundColor: COLORES_EMBUDO_AZUL[index % COLORES_EMBUDO_AZUL.length] }}
                                        className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white"
                                    >
                                        {item.porcentaje >= 18 ? `${item.porcentaje}%` : ""}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Vista 2: Asesores */}
            {vistaActiva === "asesores" && (
                <div className="h-[280px] w-full pt-1">
                    {datos.dimensiones?.porAsesor?.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin asesores con actividad registrada en el periodo.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porAsesor} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 9.5, fontWeight: "bold", fill: "#475569" }} angle={-20} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                                <Tooltip formatter={(val) => [`${val} prospectos`, "Asignados"]} contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.porAsesor.map((_, index) => (
                                        <Cell key={`asesor-dg-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* Vista 3: Origen */}
            {vistaActiva === "origen" && (
                <div className="h-[280px] w-full pt-1">
                    {datos.dimensiones?.porOrigen?.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin desglose de pautas disponible para el filtro seleccionado.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porOrigen} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 9.5, fontWeight: "bold", fill: "#475569" }} angle={-20} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                                <Tooltip formatter={(val) => [`${val} prospectos`, "Volumen"]} contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.porOrigen.map((_, index) => (
                                        <Cell key={`orig-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    );
}

function TooltipCostoFinanciero({ active, payload }) {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
            <p className="font-black text-[#001E50]">{item.name}</p>
            <p className="mt-1 font-semibold text-slate-600">
                Costo financiero:{" "}
                <strong className="text-[#001E50]">
                    ${Number(item.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
            </p>
            {item.vehiculosFuera !== undefined && (
                <p className="mt-0.5 text-slate-500">
                    Fuera de gracia: <strong>{item.vehiculosFuera} vehículos</strong>
                </p>
            )}
        </div>
    );
}

function CitasRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("canales");

    const boton = (id) =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    return (
        <div className="space-y-4">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button type="button" onClick={() => setVistaActiva("canales")} className={boton("canales")}>
                    <Globe className="h-3.5 w-3.5" />
                    Digital vs Tradicional
                </button>

                <button type="button" onClick={() => setVistaActiva("asesores")} className={boton("asesores")}>
                    <Users className="h-3.5 w-3.5" />
                    Rendimiento Asesores
                </button>

                <button type="button" onClick={() => setVistaActiva("origen")} className={boton("origen")}>
                    <Building2 className="h-3.5 w-3.5" />
                    Fuentes de Origen
                </button>
            </div>

            {/* DIGITAL VS TRADICIONAL */}
            {vistaActiva === "canales" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {datos.dimensiones.mixCanal.map((item, i) => {
                            const efectividad = item.cantidad > 0 ? ((item.asistidas / item.cantidad) * 100).toFixed(1) : "0.0";

                            return (
                                <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-[#001E50]">{item.name}</span>
                                        <span className="text-lg font-black text-[#001E50]">{item.cantidad}</span>
                                    </div>

                                    <div className="mt-2 text-[10px] text-slate-500">
                                        {item.asistidas} asistidas · {efectividad}% efectividad
                                    </div>

                                    <div className="mt-2 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${item.porcentaje}%`,
                                                backgroundColor: PALETA_AZULES[i % PALETA_AZULES.length],
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.mixCanal} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: "bold", fill: "#475569" }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                                <Tooltip contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />

                                <Bar dataKey="cantidad" name="Concertadas" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.mixCanal.map((_, index) => (
                                        <Cell key={index} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ASESORES */}
            {vistaActiva === "asesores" && (
                <div className="h-[280px] w-full">
                    {datos.dimensiones.porAsesor.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin citas registradas por asesor.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porAsesor} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }}
                                    angle={-20}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />

                                <Tooltip
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />

                                <Bar dataKey="cantidad" name="Concertadas" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="asistidas" name="Asistidas" fill="#001E50" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* ORIGEN */}
            {vistaActiva === "origen" && (
                <div className="h-[280px] w-full">
                    {datos.dimensiones.porOrigen.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin fuentes de origen para el periodo seleccionado.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porOrigen} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />

                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }}
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
                                />

                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />

                                <Tooltip
                                    formatter={(value, name) => [
                                        value,
                                        name === "cantidad" ? "Concertadas" : "Asistidas",
                                    ]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />

                                <Bar dataKey="cantidad" name="Concertadas" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="asistidas" name="Asistidas" fill="#001E50" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    );
}

function IngresosPisoRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("asesores");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Prospectos") => (
        <div className="h-[280px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                        <Tooltip formatter={value => [value, label]} contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />
                        <Bar dataKey="cantidad" name={label} radius={[6, 6, 0, 0]}>
                            {data.map((_, i) => <Cell key={i} fill={PALETA_AZULES[i % PALETA_AZULES.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button type="button" onClick={() => setVistaActiva("asesores")} className={boton("asesores")}>
                    <Users className="h-3.5 w-3.5" />
                    Asesores
                </button>

                <button type="button" onClick={() => setVistaActiva("diario")} className={boton("diario")}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    Comportamiento Diario
                </button>

                <button type="button" onClick={() => setVistaActiva("motivos")} className={boton("motivos")}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    Motivos de Ingreso
                </button>

                <button type="button" onClick={() => setVistaActiva("modelos")} className={boton("modelos")}>
                    <Car className="h-3.5 w-3.5" />
                    Modelos de Interés
                </button>
            </div>

            {vistaActiva === "asesores" && grafica(datos.dimensiones.porAsesor, "Prospectos")}
            {vistaActiva === "diario" && grafica(datos.dimensiones.comportamientoDiario, "Visitas")}
            {vistaActiva === "motivos" && grafica(datos.dimensiones.motivosIngreso, "Prospectos")}
            {vistaActiva === "modelos" && grafica(datos.dimensiones.modelosInteres, "Prospectos")}
        </div>
    );
}

function PruebasManejoRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("asesores");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label) => (
        <div className="h-[280px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                        <Tooltip formatter={value => [value, label]} contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />
                        <Bar dataKey="cantidad" name={label} radius={[6, 6, 0, 0]}>
                            {data.map((_, i) => <Cell key={i} fill={PALETA_AZULES[i % PALETA_AZULES.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button type="button" onClick={() => setVistaActiva("asesores")} className={boton("asesores")}>
                    <Users className="h-3.5 w-3.5" />
                    Asesores
                </button>

                <button type="button" onClick={() => setVistaActiva("diario")} className={boton("diario")}>
                    <CalendarClock className="h-3.5 w-3.5" />
                    Comportamiento Diario
                </button>

                <button type="button" onClick={() => setVistaActiva("modelos")} className={boton("modelos")}>
                    <Car className="h-3.5 w-3.5" />
                    Modelo Demostrado
                </button>
            </div>

            {vistaActiva === "asesores" && grafica(datos.dimensiones.porAsesor, "Demostraciones")}
            {vistaActiva === "diario" && grafica(datos.dimensiones.comportamientoDiario, "Pruebas")}
            {vistaActiva === "modelos" && grafica(datos.dimensiones.modelos, "Demostraciones")}
        </div>
    );
}

function SolicitudesCreditoRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("estatus");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id ? "bg-[#001E50] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Solicitudes") => (
        <div className="h-[280px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                        <Tooltip formatter={value => [value, label]} contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />
                        <Bar dataKey="cantidad" name={label} radius={[6, 6, 0, 0]}>
                            {data.map((_, i) => <Cell key={i} fill={PALETA_AZULES[i % PALETA_AZULES.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">{kpi.valor}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button type="button" onClick={() => setVistaActiva("estatus")} className={boton("estatus")}>
                    Estado Financiamiento
                </button>

                <button type="button" onClick={() => setVistaActiva("asesores")} className={boton("asesores")}>
                    Asesores
                </button>

                <button type="button" onClick={() => setVistaActiva("financiera")} className={boton("financiera")}>
                    Producto Financiero
                </button>

                <button type="button" onClick={() => setVistaActiva("modelos")} className={boton("modelos")}>
                    Modelos
                </button>
            </div>

            {vistaActiva === "estatus" && grafica(datos.dimensiones.porEstatus)}
            {vistaActiva === "asesores" && grafica(datos.dimensiones.porAsesor)}
            {vistaActiva === "financiera" && grafica(datos.dimensiones.porFinanciera)}
            {vistaActiva === "modelos" && grafica(datos.dimensiones.porModelo)}
        </div>
    );
}

function ComercialProspectosRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("estado");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Prospectos") => (
        <div className="h-[280px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 45 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }}
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tickFormatter={v => String(v).length > 18 ? `${String(v).slice(0, 16)}…` : v}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                        <Tooltip
                            formatter={value => [Number(value).toLocaleString("es-MX"), label]}
                            contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                        />
                        <Bar dataKey="cantidad" name={label} radius={[6, 6, 0, 0]}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={PALETA_AZULES[i % PALETA_AZULES.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-[#115E59]">
                    <CalendarClock className="h-3.5 w-3.5 text-[#14B8A6]" />
                    Prospectos del día en tiempo real
                </span>

                <span className="rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    No afecta filtros
                </span>
            </div>

            {/* KPIs */}
            <div className="overflow-x-auto pb-1">
                <div className="grid min-w-full grid-flow-col auto-cols-[minmax(150px,1fr)] gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div key={i} className="min-h-[118px] rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">

                <button type="button" onClick={() => setVistaActiva("estado")} className={boton("estado")}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    Pipeline
                </button>

                <button type="button" onClick={() => setVistaActiva("asesores")} className={boton("asesores")}>
                    <Users className="h-3.5 w-3.5" />
                    Asesores
                </button>

                <button type="button" onClick={() => setVistaActiva("business")} className={boton("business")}>
                    <Building2 className="h-3.5 w-3.5" />
                    Business
                </button>

                <button type="button" onClick={() => setVistaActiva("score")} className={boton("score")}>
                    <BadgeDollarSign className="h-3.5 w-3.5" />
                    Lead Score
                </button>
            </div>

            {vistaActiva === "estado" &&
                grafica(datos.dimensiones?.porEstado, "Prospectos")}

            {vistaActiva === "asesores" &&
                grafica(datos.dimensiones?.porAsesor, "Prospectos")}

            {vistaActiva === "business" &&
                grafica(datos.dimensiones?.porBusiness, "Prospectos")}

            {vistaActiva === "score" &&
                grafica(datos.dimensiones?.porScore, "Prospectos")}
        </div>
    );
}

function ComercialRendimientoDigitalRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("asesores");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    return (
        <div className="space-y-4">

            <div className="flex justify-end">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#001E50]">
                    Últimos 30 días
                </span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs">
                <button
                    type="button"
                    onClick={() => setVistaActiva("asesores")}
                    className={boton("asesores")}
                >
                    <Users className="h-3.5 w-3.5" />
                    Rendimiento Asesores
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("tendencia")}
                    className={boton("tendencia")}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Tendencia 30 días
                </button>
            </div>

            {/* ASESORES */}
            {vistaActiva === "asesores" && (
                <div className="h-[300px] w-full">
                    {!datos.dimensiones?.porAsesor?.length ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin información de asesores.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={datos.dimensiones.porAsesor}
                                margin={{ top: 10, right: 10, left: -20, bottom: 55 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />

                                <XAxis
                                    dataKey="name"
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
                                    tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }}
                                    tickFormatter={v =>
                                        String(v).length > 16
                                            ? `${String(v).slice(0, 14)}…`
                                            : v
                                    }
                                />

                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} />

                                <Tooltip
                                    formatter={(value, name) => [Number(value).toLocaleString("es-MX"), name]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />

                                <Bar dataKey="enviados" name="Enviados" fill="#001E50" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="respuestas" name="Respondidos" fill="#1677FF" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="interes" name="Interés" fill="#0891B2" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* TENDENCIA */}
            {vistaActiva === "tendencia" && (
                <div className="h-[300px] w-full">
                    {!datos.dimensiones?.actividadDiaria?.length ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin actividad registrada.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={datos.dimensiones.actividadDiaria}
                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />

                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9, fill: "#64748B" }}
                                />

                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} />

                                <Tooltip
                                    formatter={(value, name) => [Number(value).toLocaleString("es-MX"), name]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />

                                <Bar dataKey="intentos" name="Intentos" fill="#001E50" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="respuestas" name="Respuestas" fill="#1677FF" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="sinRespuesta" name="Sin respuesta" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    );
}

function ComercialCitasRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("tipo");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Citas") => (
        <div className="h-[290px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />

                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9, fontWeight: "bold", fill: "#475569" }}
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tickFormatter={v =>
                                String(v).length > 18
                                    ? `${String(v).slice(0, 16)}…`
                                    : v
                            }
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "#64748B" }}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                Number(value).toLocaleString("es-MX"),
                                name,
                            ]}
                            contentStyle={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        />

                        <Bar dataKey="cantidad" name={label} radius={[6, 6, 0, 0]}>
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={PALETA_AZULES[i % PALETA_AZULES.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div
                            key={i}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">

                <button
                    type="button"
                    onClick={() => setVistaActiva("tipo")}
                    className={boton("tipo")}
                >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Tipo de Cita
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("dealer")}
                    className={boton("dealer")}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    Dealer
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("asesor")}
                    className={boton("asesor")}
                >
                    <Users className="h-3.5 w-3.5" />
                    Asesor Digital
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("fuente")}
                    className={boton("fuente")}
                >
                    <Globe className="h-3.5 w-3.5" />
                    Fuente
                </button>
            </div>

            {vistaActiva === "tipo" &&
                grafica(datos.dimensiones?.porTipo, "Citas")}

            {vistaActiva === "dealer" &&
                grafica(datos.dimensiones?.porDealer, "Citas")}

            {vistaActiva === "asesor" &&
                grafica(datos.dimensiones?.porAsesor, "Citas")}

            {vistaActiva === "fuente" &&
                grafica(datos.dimensiones?.porFuente, "Citas")}
        </div>
    );
}

function ComercialTraficoPisoRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("dealer");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Registros") => (
        <div className="h-[290px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 50,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E2E8F0"
                        />

                        <XAxis
                            dataKey="name"
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tick={{
                                fontSize: 9,
                                fontWeight: "bold",
                                fill: "#475569",
                            }}
                            tickFormatter={v =>
                                String(v).length > 18
                                    ? `${String(v).slice(0, 16)}…`
                                    : v
                            }
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{
                                fontSize: 10,
                                fill: "#64748B",
                            }}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                Number(value).toLocaleString("es-MX"),
                                name,
                            ]}
                            contentStyle={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        />

                        <Bar
                            dataKey="cantidad"
                            name={label}
                            radius={[6, 6, 0, 0]}
                        >
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        PALETA_AZULES[
                                            i % PALETA_AZULES.length
                                        ]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div
                            key={i}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">

                <button
                    type="button"
                    onClick={() => setVistaActiva("dealer")}
                    className={boton("dealer")}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    Dealer
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("asesor")}
                    className={boton("asesor")}
                >
                    <Users className="h-3.5 w-3.5" />
                    Asesores
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("motivo")}
                    className={boton("motivo")}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Motivo de Ingreso
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("capitalizacion")}
                    className={boton("capitalizacion")}
                >
                    <BadgeDollarSign className="h-3.5 w-3.5" />
                    Capitalización
                </button>
            </div>

            {vistaActiva === "dealer" &&
                grafica(
                    datos.dimensiones?.porDealer,
                    "Registros"
                )}

            {vistaActiva === "asesor" &&
                grafica(
                    datos.dimensiones?.porAsesor,
                    "Prospectos"
                )}

            {vistaActiva === "motivo" &&
                grafica(
                    datos.dimensiones?.porMotivo,
                    "Registros"
                )}

            {vistaActiva === "capitalizacion" &&
                grafica(
                    datos.dimensiones?.porCapitalizacion,
                    "Registros"
                )}
        </div>
    );
}

function ComercialPruebasRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("diario");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Pruebas") => (
        <div className="h-[290px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información disponible.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E2E8F0"
                        />

                        <XAxis
                            dataKey="name"
                            tick={{
                                fontSize: 9,
                                fontWeight: "bold",
                                fill: "#475569",
                            }}
                            angle={vistaActiva === "diario" ? 0 : -25}
                            textAnchor={vistaActiva === "diario" ? "middle" : "end"}
                            interval={0}
                            tickFormatter={v =>
                                String(v).length > 18
                                    ? `${String(v).slice(0, 16)}…`
                                    : v
                            }
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "#64748B" }}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                Number(value).toLocaleString("es-MX"),
                                name,
                            ]}
                            contentStyle={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        />

                        <Bar
                            dataKey="cantidad"
                            name={label}
                            radius={[6, 6, 0, 0]}
                        >
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        PALETA_AZULES[
                                            i % PALETA_AZULES.length
                                        ]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            <div className="flex justify-end">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    Tiempo real
                </span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div
                            key={i}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">

                <button
                    type="button"
                    onClick={() => setVistaActiva("diario")}
                    className={boton("diario")}
                >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Últimos 14 días
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("dealer")}
                    className={boton("dealer")}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    Dealer
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("modelo")}
                    className={boton("modelo")}
                >
                    <Car className="h-3.5 w-3.5" />
                    Modelos
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("asesor")}
                    className={boton("asesor")}
                >
                    <Users className="h-3.5 w-3.5" />
                    Asesores
                </button>
            </div>

            {vistaActiva === "diario" &&
                grafica(
                    datos.dimensiones?.porDia,
                    "Pruebas"
                )}

            {vistaActiva === "dealer" &&
                grafica(
                    datos.dimensiones?.porDealer,
                    "Pruebas"
                )}

            {vistaActiva === "modelo" &&
                grafica(
                    datos.dimensiones?.porModelo,
                    "Pruebas"
                )}

            {vistaActiva === "asesor" &&
                grafica(
                    datos.dimensiones?.porAsesor,
                    "Pruebas"
                )}
        </div>
    );
}

function ComercialEntregasRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("estado");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (data, label = "Entregas") => (
        <div className="h-[290px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información para el periodo seleccionado.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 50 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E2E8F0"
                        />

                        <XAxis
                            dataKey="name"
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tick={{
                                fontSize: 9,
                                fontWeight: "bold",
                                fill: "#475569",
                            }}
                            tickFormatter={v =>
                                String(v).length > 18
                                    ? `${String(v).slice(0, 16)}…`
                                    : v
                            }
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: "#64748B" }}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                Number(value).toLocaleString("es-MX"),
                                name,
                            ]}
                            contentStyle={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        />

                        <Bar
                            dataKey="cantidad"
                            name={label}
                            radius={[6, 6, 0, 0]}
                        >
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        PALETA_AZULES[
                                            i % PALETA_AZULES.length
                                        ]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div
                            key={i}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />
                                <span>{kpi.label}</span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">

                <button
                    type="button"
                    onClick={() => setVistaActiva("estado")}
                    className={boton("estado")}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Estado
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("tipo")}
                    className={boton("tipo")}
                >
                    <Car className="h-3.5 w-3.5" />
                    Tipo de Venta
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("modelo")}
                    className={boton("modelo")}
                >
                    <Car className="h-3.5 w-3.5" />
                    Modelos
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("asesor")}
                    className={boton("asesor")}
                >
                    <Users className="h-3.5 w-3.5" />
                    Asesores
                </button>
            </div>

            {vistaActiva === "estado" &&
                grafica(
                    datos.dimensiones?.porEstado,
                    "Entregas"
                )}

            {vistaActiva === "tipo" &&
                grafica(
                    datos.dimensiones?.porTipo,
                    "Registros"
                )}

            {vistaActiva === "modelo" &&
                grafica(
                    datos.dimensiones?.porModelo,
                    "Entregas"
                )}

            {vistaActiva === "asesor" &&
                grafica(
                    datos.dimensiones?.porAsesor,
                    "Entregadas"
                )}
        </div>
    );
}

function ComercialCampanasMetaRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] =
        useState("campanas");

    const boton = id =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap ${
            vistaActiva === id
                ? "bg-[#001E50] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    const grafica = (
        data,
        dataKey = "cantidad",
        label = "Resultados"
    ) => (
        <div className="h-[290px] w-full">
            {!data?.length ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                    Sin información disponible.
                </div>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <BarChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 50,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E2E8F0"
                        />

                        <XAxis
                            dataKey="name"
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            tick={{
                                fontSize: 9,
                                fontWeight: "bold",
                                fill: "#475569",
                            }}
                            tickFormatter={v =>
                                String(v).length > 18
                                    ? `${String(v).slice(0, 16)}…`
                                    : v
                            }
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{
                                fontSize: 10,
                                fill: "#64748B",
                            }}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                Number(value).toLocaleString("es-MX"),
                                name,
                            ]}
                            contentStyle={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        />

                        <Bar
                            dataKey={dataKey}
                            name={label}
                            radius={[6, 6, 0, 0]}
                        >
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        PALETA_AZULES[
                                            i %
                                            PALETA_AZULES.length
                                        ]
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-4">

            {!datos.disponible && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    {datos.mensaje}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;

                    return (
                        <div
                            key={i}
                            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className="h-3.5 w-3.5 text-[#1677FF]" />

                                <span>
                                    {kpi.label}
                                </span>
                            </div>

                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {kpi.sub}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">

                <button
                    type="button"
                    onClick={() =>
                        setVistaActiva("campanas")
                    }
                    className={boton("campanas")}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Campañas
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setVistaActiva("dealer")
                    }
                    className={boton("dealer")}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    Dealers
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setVistaActiva("canal")
                    }
                    className={boton("canal")}
                >
                    <Globe className="h-3.5 w-3.5" />
                    Canal
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setVistaActiva("estado")
                    }
                    className={boton("estado")}
                >
                    <Info className="h-3.5 w-3.5" />
                    Estatus
                </button>
            </div>

            {vistaActiva === "campanas" &&
                grafica(
                    datos.dimensiones?.porCampana,
                    "cantidad",
                    "Resultados"
                )}

            {vistaActiva === "dealer" &&
                grafica(
                    datos.dimensiones?.porDealer,
                    "gasto",
                    "Inversión"
                )}

            {vistaActiva === "canal" &&
                grafica(
                    datos.dimensiones?.porCanal,
                    "gasto",
                    "Inversión"
                )}

            {vistaActiva === "estado" &&
                grafica(
                    datos.dimensiones?.porEstado,
                    "cantidad",
                    "Campañas"
                )}
        </div>
    );
}

function InventarioRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("costoFinanciero");

    if (!datos?.dimensiones) return null;

    const coloresAntiguedadAzul = {
        optimo: "#1677FF",
        alerta: "#1D5FD1",
        critico: "#164E9B",
        obsoleto: "#001E50",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-xl text-xs">
                <span className="font-bold text-[#001E50] flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-[#1677FF]" />
                    Stock en patio en tiempo real
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    Corte al día
                </span>
            </div>

            <div className="overflow-x-auto pb-1">
                <div className="grid min-w-full grid-flow-col auto-cols-[minmax(150px,1fr)] gap-2">
                    {datos.kpis.map((kpi, i) => {
                        const Icon = kpi.icon || Info;
                        return (
                            <div key={i} className={`min-h-[118px] rounded-xl border p-2.5 shadow-sm ${kpi.alert ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-slate-50/80"}`}>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className={`h-3.5 w-3.5 ${kpi.alert ? "text-[#164E9B]" : "text-[#1677FF]"}`} />
                                <span>{kpi.label}</span>
                            </div>
                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{kpi.sub}</div>
                        </div>
                    );
                })}
                </div>
            </div>

            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button
                    type="button"
                    onClick={() => setVistaActiva("costoFinanciero")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "costoFinanciero"
                            ? "bg-[#001E50] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <BadgeDollarSign className="h-3.5 w-3.5" />
                    Costo Financiero
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("antiguedad")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "antiguedad"
                            ? "bg-[#001E50] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Antigüedad en Stock (Días)
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("modelos")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "modelos"
                            ? "bg-[#001E50] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <Car className="h-3.5 w-3.5" />
                    Top Modelos
                </button>
            </div>

            {vistaActiva === "costoFinanciero" && (
                <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 px-1">
                        {datos.dimensiones.tituloCostoChart}
                    </div>
                    <div className="h-[260px] w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.costoChart} margin={{ top: 10, right: 10, left: -5, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 9.5, fontWeight: "bold", fill: "#475569" }} angle={-15} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<TooltipCostoFinanciero />} />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.costoChart.map((_, index) => (
                                        <Cell key={`cost-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {vistaActiva === "antiguedad" && (
                <div className="space-y-3 pt-1">
                    {datos.dimensiones.antiguedad.map((item) => (
                        <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800">{item.cantidad.toLocaleString("es-MX")} uds</span>
                                    <span className="text-[11px] font-semibold text-slate-400">({item.porcentaje}%)</span>
                                </div>
                            </div>
                            <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100 p-0.5">
                                <div
                                    style={{ width: `${item.porcentaje}%`, backgroundColor: coloresAntiguedadAzul[item.estado] || "#1677FF" }}
                                    className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-black text-white shadow-xs"
                                >
                                    {item.porcentaje >= 12 ? `${item.porcentaje}%` : ""}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="text-[11px] text-slate-400 italic text-right pt-1">
                        * Periodo de gracia oficial: 30 días sin costo financiero.
                    </div>
                </div>
            )}

            {vistaActiva === "modelos" && (
                <div className="h-[280px] w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datos.dimensiones.modelos} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold", fill: "#475569" }} angle={-25} textAnchor="end" />
                            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                            <Tooltip formatter={(val) => [`${Number(val).toLocaleString("es-MX")} unidades`, "Disponibles"]} contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }} />
                            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                {datos.dimensiones.modelos.map((_, index) => (
                                    <Cell key={`mod-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

// Renderizador especializado para Autos Nuevos
function AutosNuevosRenderer({ datos }) {
    const [vistaActiva, setVistaActiva] = useState("asesor");

    if (!datos?.dimensiones) return null;

    return (
        <div className="space-y-4">
            {/* 4 KPIs de Ventas VN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {datos.kpis.map((kpi, i) => {
                    const Icon = kpi.icon || Info;
                    return (
                        <div key={i} className={`rounded-xl border p-2.5 shadow-sm ${kpi.alert ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50/80"}`}>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Icon className={`h-3.5 w-3.5 ${kpi.alert ? "text-red-600" : "text-[#1677FF]"}`} />
                                <span>{kpi.label}</span>
                            </div>
                            <div className="mt-1 text-base font-black text-[#001E50]">
                                {kpi.valor}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{kpi.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Pestañas de Gráficas de Autos Nuevos */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
                <button
                    type="button"
                    onClick={() => setVistaActiva("asesor")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "asesor"
                            ? "bg-[#001E50] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <Users className="h-3.5 w-3.5" />
                    Ventas por Asesor
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("familia")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "familia"
                            ? "bg-[#001E50] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <Car className="h-3.5 w-3.5" />
                    Top Modelos Vendidos
                </button>

                <button
                    type="button"
                    onClick={() => setVistaActiva("condicion")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                        vistaActiva === "condicion"
                            ? "bg-[#001E50] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <WalletCards className="h-3.5 w-3.5" />
                    Condición de Pago
                </button>
            </div>

            {/* Gráfica 1: Ventas por Asesor */}
            {vistaActiva === "asesor" && (
                <div className="h-[280px] w-full pt-1">
                    {datos.dimensiones.porAsesor.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin ventas registradas en el periodo para los filtros aplicados.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porAsesor} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 9.5, fontWeight: "bold", fill: "#475569" }} angle={-20} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                                <Tooltip
                                    formatter={(val, name, item) => [
                                        `${val} unidades (${Number(item?.payload?.monto || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })})`,
                                        "Ventas"
                                    ]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.porAsesor.map((_, index) => (
                                        <Cell key={`asesor-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* Gráfica 2: Top Modelos Vendidos */}
            {vistaActiva === "familia" && (
                <div className="h-[280px] w-full pt-1">
                    {datos.dimensiones.porFamilia.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin unidades vendidas registradas en el periodo.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porFamilia} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold", fill: "#475569" }} angle={-20} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                                <Tooltip
                                    formatter={(val, name, item) => [
                                        `${val} unidades (${Number(item?.payload?.monto || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })})`,
                                        "Entregas"
                                    ]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.porFamilia.map((_, index) => (
                                        <Cell key={`fam-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* Gráfica 3: Condición de Pago */}
            {vistaActiva === "condicion" && (
                <div className="h-[280px] w-full pt-1">
                    {datos.dimensiones.porCondicion.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">
                            Sin información de pagos en este periodo.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datos.dimensiones.porCondicion} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9.5, fontWeight: "bold", fill: "#475569" }}
                                    angle={-25}
                                    textAnchor="end"
                                    interval={0}
                                    tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 12)}…` : val)}
                                />
                                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                                <Tooltip
                                    formatter={(val, name, item) => [`${val} unidades`, item?.payload?.name || "Condición"]}
                                    contentStyle={{ borderRadius: "10px", fontSize: "12px", fontWeight: "bold" }}
                                />
                                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                                    {datos.dimensiones.porCondicion.map((_, index) => (
                                        <Cell key={`cond-${index}`} fill={PALETA_AZULES[index % PALETA_AZULES.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
        </div>
    );
}

function TarjetaPanel({panel, filtros, onCambiarModulo, onCambiarSubmodulo, onEliminar, totalPaneles}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [datos, setDatos] = useState(null);

    const todosModulos = useMemo(() => CATALOGO_CRM.flatMap((s) => s.modulos), []);
    const modulosDisponibles = useMemo(() => todosModulos.filter(mod => mod.disponible !== false), [todosModulos]);
    const infoModulo = useMemo(() => todosModulos.find((m) => m.id === panel.moduloId), [todosModulos, panel.moduloId]);

    const agenciaFiltro = filtros?.agencia;
    const anioFiltro = filtros?.anio;
    const mesesFiltro = filtros?.meses;

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await obtenerDatosSubmodulo(
                panel.moduloId,
                panel.submoduloId,
                {
                    agencia: agenciaFiltro,
                    anio: anioFiltro,
                    meses: mesesFiltro,
                }
            );

            setDatos(res);
        } catch (err) {
            console.error("Error al cargar módulo:", err);

            setError(
                err?.message ||
                "No se pudieron obtener los datos para este módulo."
            );
        } finally {
            setLoading(false);
        }
    }, [
        agenciaFiltro,
        anioFiltro,
        mesesFiltro,
        panel.moduloId,
        panel.submoduloId,
    ]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const cfg = COLOR_CONFIG[infoModulo?.color] || COLOR_CONFIG.blue;
    const IconModulo = infoModulo?.icon || Layers;

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            {/* Cabecera del Módulo */}
            <div
                style={{ backgroundColor: cfg.headerBg }}
                className="flex flex-col gap-2 p-4 text-white sm:flex-row sm:items-center sm:justify-between shrink-0"
            >
                <div className="flex items-center gap-2">
                    <GripVertical
                        className="h-4 w-4 shrink-0 cursor-grab text-white/50"
                        title="Arrastra para reordenar"
                    />

                    <IconModulo className="h-4 w-4 opacity-90 text-white shrink-0" />

                    <select
                        value={panel.moduloId}
                        onChange={(e) =>
                            onCambiarModulo(panel.id, e.target.value)
                        }
                        className="max-w-[210px] cursor-pointer bg-transparent text-xs font-black uppercase tracking-wider text-white outline-none"
                    >
                        {modulosDisponibles.map(mod => (
                            <option
                                key={mod.id}
                                value={mod.id}
                                className="bg-white text-slate-800"
                            >
                                {mod.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={panel.submoduloId}
                        onChange={(e) => onCambiarSubmodulo(panel.id, e.target.value)}
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.18)" }}
                        className="rounded-lg border border-white/20 px-2.5 py-1 text-xs font-bold text-white outline-none backdrop-blur-sm transition hover:bg-white/25 cursor-pointer max-w-[280px] truncate"
                    >
                        {infoModulo?.submodulos?.map((sub) => (
                            <option key={sub.id} value={sub.id} className="text-slate-800 bg-white">
                                {sub.nombre}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={cargarDatos}
                        title="Recargar datos"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 cursor-pointer"
                    >
                        <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    {totalPaneles > 1 && (
                        <button
                            type="button"
                            onClick={() => onEliminar(panel.id)}
                            title="Quitar este módulo del tablero"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-red-500 hover:text-white cursor-pointer"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido Dinámico */}
            <div className="flex-1 p-5 space-y-4">
                {loading ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="h-7 w-7 animate-spin text-[#001E50]" />
                        <span className="text-xs font-bold text-[#001E50]">Consultando información...</span>
                    </div>
                ) : error ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-6 text-center text-red-600">
                        <AlertCircle className="h-8 w-8" />
                        <p className="text-xs font-bold">{error}</p>
                        <button type="button" onClick={cargarDatos} className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-700 hover:bg-red-100 cursor-pointer">
                            Reintentar
                        </button>
                    </div>
                ) : datos?.tipo === "prospectos_digitales" ? (
                    <ProspectosDigitalesRenderer datos={datos} />
                ) : datos?.tipo === "citas" ? (
                    <CitasRenderer datos={datos} />
                ) : datos?.tipo === "ingresos_piso" ? (
                    <IngresosPisoRenderer datos={datos} />
                ) : datos?.tipo === "pruebas_manejo" ? (
                    <PruebasManejoRenderer datos={datos} />
                ) : datos?.tipo === "solicitudes_credito" ? (
                    <SolicitudesCreditoRenderer datos={datos} />
                ) : datos?.tipo === "comercial_prospectos" ? (
                    <ComercialProspectosRenderer datos={datos} />
                ) : datos?.tipo === "comercial_rendimiento_digital" ? (
                    <ComercialRendimientoDigitalRenderer datos={datos} />
                ) : datos?.tipo === "comercial_citas" ? (
                    <ComercialCitasRenderer datos={datos} />
                ) : datos?.tipo === "comercial_trafico_piso" ? (
                    <ComercialTraficoPisoRenderer datos={datos} />
                ) : datos?.tipo === "comercial_pruebas" ? (
                    <ComercialPruebasRenderer datos={datos} />
                ) : datos?.tipo === "comercial_entregas" ? (
                    <ComercialEntregasRenderer datos={datos} />
                ) : datos?.tipo === "comercial_campanas_meta" ? (
                    <ComercialCampanasMetaRenderer datos={datos} />
                ) : datos?.tipo === "autos_nuevos" ? (
                    <AutosNuevosRenderer datos={datos} />
                ) : datos?.tipo === "inventario" ? (
                    <InventarioRenderer datos={datos} />
                ) : datos?.tipo === "embudo" ? (
                    <EmbudoRenderer datos={datos} />
                ) : null}
            </div>

            {/* Footer de conversión en caso de embudos */}
            {datos?.tipo === "embudo" && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 px-5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Conversión de la etapa final:</span>
                        <span className="text-sm font-black text-[#1677FF]">
                            {datos.totalInicial > 0 ? ((datos.cierreFinal / datos.totalInicial) * 100).toFixed(1) : 0}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
export default memo(TarjetaPanel);