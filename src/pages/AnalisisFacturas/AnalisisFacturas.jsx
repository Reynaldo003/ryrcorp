// src/pages/gestion_inversion/AnalisisFacturas.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle, BarChart3, Building2, CheckCircle2, ChevronDown, CircleDollarSign, ExternalLink,
    FileCheck2, FileText, Filter, LayoutList, Loader2, Plus, ReceiptText, RefreshCw, Search,
    Table2, Trash2, UploadCloud, UserRound, X,
} from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import vwDark from "../../assets/vw_dark.png";
import { apiAnalisisFacturas } from "../../lib/apiGestionInversion";

const C = {
    navy: "#131E5C",
    navyDk: "#0A1340",
    surface: "#F7F8FC",
    border: "#E4E7F0",
    borderMd: "#C8CEDF",
    muted: "#8891AD",
    text: "#1A1F3C",
    textSub: "#515778",
};

const CLASIFICACIONES = ["Social Media", "Posicionamiento", "Consumo Interno", "Eventos y Prospección"];
const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Tuxpan", "VW Poza Rica", "VW Tuxtepec"];
const DEPARTAMENTOS = ["Nuevos", "Usados", "Comerciales", "Servicio", "HyP"];

const OPCIONES_POR_CLASIFICACION = {
    "Social Media": ["Google ADS", "MetaADS", "MercadoLibre", "TikTok", "YouTube", "ChatGPT"],
    "Posicionamiento": ["Costo de Producción Multimedios", "Publicitarios Físicos", "Folletos", "Cartas"],
    "Consumo Interno": ["Consumo de alimentos", "Instalación", "Amenidades"],
    "Eventos y Prospección": ["Eventos"],
};

function normalizarListaFacturas(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data)) return response.data;
    return [];
}

function money(value, currency = "MXN") {
    const numero = Number(value || 0);
    try {
        return new Intl.NumberFormat("es-MX", { style: "currency", currency: currency || "MXN", maximumFractionDigits: 2 }).format(numero);
    } catch {
        return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(numero);
    }
}

function moneyCompact(value) {
    return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    const kb = Number(bytes) / 1024;
    return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

function fechaComoDate(value) {
    if (!value) return null;
    const texto = String(value);
    const fecha = new Date(/^\d{4}-\d{2}-\d{2}$/.test(texto) ? `${texto}T12:00:00` : texto);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatDate(value) {
    const fecha = fechaComoDate(value);
    if (!fecha) return "—";
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(fecha);
}

function conceptoCompleto(concepto) {
    return Boolean(concepto?.clasificacion && concepto?.sitio && concepto?.motivo?.trim());
}

function agruparFacturasPor(facturas, obtenerClave) {
    const datos = {};

    facturas.forEach((factura) => {
        const clave = obtenerClave(factura) || "Sin asignar";
        datos[clave] = (datos[clave] || 0) + Number(factura?.totales?.total || 0);
    });

    return Object.entries(datos)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);
}

function agruparConceptosPor(facturas, obtenerClave) {
    const datos = {};

    facturas.forEach((factura) => {
        (factura.conceptos || []).forEach((concepto) => {
            const clave = obtenerClave(concepto) || "Sin clasificar";
            datos[clave] = (datos[clave] || 0) + Number(concepto?.importe || 0);
        });
    });

    return Object.entries(datos)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);
}

function agruparFacturasPorMes(facturas) {
    const datos = {};

    facturas.forEach((factura) => {
        const fecha = fechaComoDate(factura?.comprobante?.fecha || factura?.fechaCarga);
        if (!fecha) return;

        const orden = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
        const mes = new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" }).format(fecha);
        if (!datos[orden]) datos[orden] = { orden, mes, total: 0 };
        datos[orden].total += Number(factura?.totales?.total || 0);
    });

    return Object.values(datos).sort((a, b) => a.orden.localeCompare(b.orden));
}

function Badge({ children, variant = "default", dot = false }) {
    const variants = {
        default: "bg-gray-100 text-gray-600 border border-gray-200",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        danger: "bg-red-50 text-red-700 border border-red-200",
        info: "bg-blue-50 text-blue-700 border border-blue-200",
        navy: "bg-[#131E5C]/8 text-[#131E5C] border border-[#131E5C]/10",
    };

    const dots = {
        default: "bg-gray-400",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-red-500",
        info: "bg-blue-500",
        navy: "bg-[#131E5C]",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${variants[variant]}`}>
            {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`} />}
            {children}
        </span>
    );
}

function StatCard({ label, value, sub, icon: Icon, variant = "navy" }) {
    const variants = {
        navy: "bg-[#131E5C]/8 text-[#131E5C]",
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        info: "bg-blue-50 text-blue-600",
    };

    return (
        <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</p>
                    <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-[#1A1F3C]">{value}</p>
                    {sub && <p className="mt-1 text-xs text-[#8891AD]">{sub}</p>}
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${variants[variant]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, mono = false }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">{label}</p>
            <p className={`mt-1 break-words text-sm font-semibold text-[#1A1F3C] ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</p>
        </div>
    );
}

function EstadoFacturaBadge({ estado }) {
    if (estado === "procesada") return <Badge variant="success" dot>Lectura completa</Badge>;
    if (estado === "procesando") return <Badge variant="info" dot>Procesando</Badge>;
    if (estado === "error") return <Badge variant="danger" dot>Error de lectura</Badge>;
    return <Badge variant="warning" dot>Pendiente</Badge>;
}

function SelectorVista({ vista, onChange }) {
    const opciones = [
        { id: "detalle", label: "Facturas", icon: LayoutList },
        { id: "graficos", label: "Gráficos", icon: BarChart3 },
        { id: "tabla", label: "Tabla", icon: Table2 },
    ];

    return (
        <div className="inline-flex rounded-xl border border-[#E4E7F0] bg-white p-1 shadow-sm">
            {opciones.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition ${vista === id ? "bg-[#131E5C] text-white shadow-sm" : "text-[#515778] hover:bg-[#F7F8FC]"}`}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </button>
            ))}
        </div>
    );
}

function UploadZone({ procesando, dealer, departamento, onDealerChange, onDepartamentoChange, onFiles }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    function procesarArchivos(files) {
        const lista = Array.from(files || []);
        if (lista.length) onFiles(lista);
    }

    function handleDrop(event) {
        event.preventDefault();
        setDragging(false);

        if (procesando) return;

        procesarArchivos(event.dataTransfer.files);
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white">
            <div className="grid gap-4 border-b border-[#E4E7F0] bg-[#FAFBFD] p-5 md:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Dealer <span className="normal-case text-[#C8CEDF]">(opcional)</span></label>

                    <select
                        value={dealer}
                        disabled={procesando}
                        onChange={(event) => onDealerChange(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        <option value="">Sin dealer</option>
                        {DEALERS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Departamento <span className="normal-case text-[#C8CEDF]">(opcional)</span></label>

                    <select
                        value={departamento}
                        disabled={procesando}
                        onChange={(event) => onDepartamentoChange(event.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        <option value="">Sin departamento</option>
                        {DEPARTAMENTOS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
            </div>

            <div
                onDragEnter={(event) => {
                    event.preventDefault();
                    if (!procesando) setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                    event.preventDefault();
                    setDragging(false);
                }}
                onDrop={handleDrop}
                className={`relative m-5 rounded-2xl border-2 border-dashed transition-all ${dragging ? "border-[#131E5C] bg-[#131E5C]/[0.025]" : "border-[#C8CEDF] hover:border-[#131E5C]/50"}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    disabled={procesando}
                    className="hidden"
                    onChange={(event) => {
                        procesarArchivos(event.target.files);
                        event.target.value = "";
                    }}
                />

                <div className="flex min-h-[230px] flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="relative">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131E5C]/8">
                            {procesando ? <Loader2 className="h-7 w-7 animate-spin text-[#131E5C]" /> : <UploadCloud className="h-7 w-7 text-[#131E5C]" />}
                        </div>

                        {!procesando && (
                            <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-[#131E5C] text-white">
                                <Plus className="h-3.5 w-3.5" />
                            </div>
                        )}
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-[#1A1F3C]">{procesando ? "Analizando factura…" : "Sube una factura en PDF"}</h2>

                    <p className="mt-2 max-w-[400px] text-xs leading-relaxed text-[#8891AD]">
                        Dealer y departamento son opcionales y pueden dejarse sin asignar.
                    </p>

                    <button
                        type="button"
                        disabled={procesando}
                        onClick={() => inputRef.current?.click()}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#131E5C]/15 transition hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        {procesando ? "Procesando" : "Seleccionar PDF"}
                    </button>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="navy">Solo PDF</Badge>
                        <Badge>Lectura con IA</Badge>
                        {dealer && <Badge variant="info">{dealer}</Badge>}
                        {departamento && <Badge variant="success">{departamento}</Badge>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SelectClasificacion({ value, onChange, disabled = false }) {
    return (
        <select value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-[180px] w-full rounded-lg border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10">
            <option value="">Seleccionar</option>
            {CLASIFICACIONES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
    );
}

function SelectSitio({ clasificacion, value, onChange, disabled = false }) {
    const opciones = OPCIONES_POR_CLASIFICACION[clasificacion] || [];

    return (
        <select value={value || ""} disabled={!clasificacion || disabled} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-[190px] w-full rounded-lg border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10">
            <option value="">{clasificacion ? "Seleccionar" : "Primero clasificación"}</option>
            {opciones.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
    );
}

function ConceptosTable({ factura, onConceptoLocalChange, onGuardarCampo, guardandoConceptos }) {
    const currency = factura?.comprobante?.moneda || "MXN";

    return (
        <div className="overflow-hidden rounded-xl border border-[#E4E7F0]">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1380px] border-collapse">
                    <thead>
                        <tr className="bg-[#131E5C] text-white">
                            <th className="w-12 px-3 py-3 text-center text-[10px] font-bold uppercase">#</th>
                            <th className="min-w-[280px] px-3 py-3 text-left text-[10px] font-bold uppercase">Concepto / especificación</th>
                            <th className="w-24 px-3 py-3 text-center text-[10px] font-bold uppercase">Cantidad</th>
                            <th className="w-32 px-3 py-3 text-right text-[10px] font-bold uppercase">P. unitario</th>
                            <th className="w-32 px-3 py-3 text-right text-[10px] font-bold uppercase">Importe</th>
                            <th className="min-w-[190px] px-3 py-3 text-left text-[10px] font-bold uppercase">Clasificación</th>
                            <th className="min-w-[210px] px-3 py-3 text-left text-[10px] font-bold uppercase">Sitio / rubro</th>
                            <th className="min-w-[300px] px-3 py-3 text-left text-[10px] font-bold uppercase">Motivo</th>
                            <th className="w-28 px-3 py-3 text-center text-[10px] font-bold uppercase">Estado</th>
                        </tr>
                    </thead>

                    <tbody>
                        {(factura.conceptos || []).map((concepto, index) => {
                            const completo = conceptoCompleto(concepto);
                            const guardando = Boolean(guardandoConceptos[concepto.id]);

                            return (
                                <tr key={concepto.id} className={`border-b border-[#E4E7F0] align-top hover:bg-[#F7F8FC] ${index % 2 ? "bg-[#FCFCFE]" : "bg-white"}`}>
                                    <td className="px-3 py-4 text-center">
                                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#131E5C]/8 text-xs font-extrabold text-[#131E5C]">{index + 1}</div>
                                    </td>

                                    <td className="px-3 py-4">
                                        <p className="text-sm font-bold leading-snug text-[#1A1F3C]">{concepto.descripcion || "Sin descripción"}</p>
                                        <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-[#8891AD]">
                                            <span>Clave: <b className="font-semibold text-[#515778]">{concepto.clave || "—"}</b></span>
                                            <span>Unidad: <b className="font-semibold text-[#515778]">{concepto.unidad || "—"}</b></span>
                                        </div>
                                    </td>

                                    <td className="px-3 py-4 text-center text-sm font-semibold text-[#515778]">{concepto.cantidad}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-semibold text-[#515778]">{money(concepto.precioUnitario, currency)}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-extrabold text-[#1A1F3C]">{money(concepto.importe, currency)}</td>

                                    <td className="px-3 py-3">
                                        <SelectClasificacion
                                            value={concepto.clasificacion}
                                            disabled={guardando}
                                            onChange={async (valor) => {
                                                const cambios = { clasificacion: valor, sitio: "" };
                                                onConceptoLocalChange(factura.id, concepto.id, cambios);
                                                await onGuardarCampo(factura.id, concepto.id, cambios);
                                            }}
                                        />
                                    </td>

                                    <td className="px-3 py-3">
                                        <SelectSitio
                                            clasificacion={concepto.clasificacion}
                                            value={concepto.sitio}
                                            disabled={guardando}
                                            onChange={async (valor) => {
                                                const cambios = { sitio: valor };
                                                onConceptoLocalChange(factura.id, concepto.id, cambios);
                                                await onGuardarCampo(factura.id, concepto.id, cambios);
                                            }}
                                        />
                                    </td>

                                    <td className="px-3 py-3">
                                        <textarea
                                            value={concepto.motivo || ""}
                                            disabled={guardando}
                                            onChange={(event) => onConceptoLocalChange(factura.id, concepto.id, { motivo: event.target.value })}
                                            onBlur={(event) => onGuardarCampo(factura.id, concepto.id, { motivo: event.target.value })}
                                            rows={2}
                                            placeholder="Motivo / justificación del gasto…"
                                            className="min-h-[58px] w-full resize-y rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-xs text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                        />
                                    </td>

                                    <td className="px-3 py-4 text-center">
                                        {guardando ? <Badge variant="info"><Loader2 className="h-3 w-3 animate-spin" />Guardando</Badge> : completo ? <Badge variant="success" dot>Clasificado</Badge> : <Badge variant="warning">Pendiente</Badge>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AsignacionFactura({ factura, onGuardar, guardando }) {
    const [dealer, setDealer] = useState(factura.dealer || "");
    const [departamento, setDepartamento] = useState(factura.departamento || "");

    useEffect(() => {
        setDealer(factura.dealer || "");
        setDepartamento(factura.departamento || "");
    }, [factura.dealer, factura.departamento]);

    const hayCambios = dealer !== (factura.dealer || "") || departamento !== (factura.departamento || "");

    async function guardar() {
        if (!hayCambios || guardando) return;
        await onGuardar(factura.id, { dealer, departamento });
    }

    return (
        <div className="border-b border-[#E4E7F0] bg-white px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Dealer</label>
                    <select
                        value={dealer}
                        disabled={guardando}
                        onChange={(event) => setDealer(event.target.value)}
                        className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        <option value="">Sin dealer asignado</option>
                        {DEALERS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <div className="flex-1">
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Departamento</label>
                    <select
                        value={departamento}
                        disabled={guardando}
                        onChange={(event) => setDepartamento(event.target.value)}
                        className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#1A1F3C] outline-none disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        <option value="">Sin departamento asignado</option>
                        {DEPARTAMENTOS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <button
                    type="button"
                    disabled={!hayCambios || guardando}
                    onClick={guardar}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 text-xs font-bold text-white transition hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                    {guardando ? "Guardando" : "Guardar asignación"}
                </button>
            </div>
        </div>
    );
}

function FacturaCard({ factura, onDelete, onReanalizar, onActualizarAsignacion, onConceptoLocalChange, onGuardarCampo, guardandoConceptos, guardandoAsignacion, reanalizando }) {
    const [open, setOpen] = useState(true);
    const conceptos = Array.isArray(factura.conceptos) ? factura.conceptos : [];
    const completos = conceptos.filter(conceptoCompleto).length;
    const currency = factura?.comprobante?.moneda || "MXN";
    const emisor = factura.emisor || {};
    const receptor = factura.receptor || {};
    const comprobante = factura.comprobante || {};
    const totales = factura.totales || {};

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
            <div className="border-b border-[#E4E7F0] px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50"><FileText className="h-5 w-5 text-red-600" /></div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-bold text-[#1A1F3C]">{factura.archivo}</h3>
                                <EstadoFacturaBadge estado={factura.estado} />
                            </div>

                            <p className="mt-1 text-xs text-[#8891AD]">{formatBytes(factura.archivoSize)} · {conceptos.length} conceptos · {completos} clasificados</p>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {factura.dealer && <Badge variant="navy">{factura.dealer}</Badge>}
                                {factura.departamento && <Badge variant="info">{factura.departamento}</Badge>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto">
                        <button type="button" disabled={reanalizando} onClick={onReanalizar} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-50">
                            {reanalizando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            Reanalizar
                        </button>

                        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] hover:bg-[#F7F8FC]">
                            {open ? "Contraer" : "Ver detalle"}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>

                        <button type="button" onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700" title="Eliminar factura">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div>
                    {factura.estado === "error" && (
                        <div className="border-b border-red-200 bg-red-50 px-5 py-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <div>
                                    <p className="text-sm font-bold text-red-700">No fue posible analizar esta factura</p>
                                    <p className="mt-1 text-xs text-red-600">{factura.errorAnalisis || "OpenAI no pudo procesar correctamente el documento."}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 border-b border-[#E4E7F0] bg-[#FAFBFD] p-5 xl:grid-cols-[1fr_1fr_320px]">
                        <div className="rounded-xl border border-[#E4E7F0] bg-white p-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8"><Building2 className="h-4 w-4 text-[#131E5C]" /></div>
                                <div><p className="text-sm font-bold text-[#1A1F3C]">Emisor</p><p className="text-xs text-[#8891AD]">Datos fiscales detectados</p></div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2"><InfoRow label="Razón social" value={emisor.razonSocial} /></div>
                                <InfoRow label="RFC" value={emisor.rfc} mono />
                                <InfoRow label="Régimen" value={emisor.regimenFiscal} />
                                <div className="sm:col-span-2"><InfoRow label="Domicilio" value={emisor.domicilio} /></div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#E4E7F0] bg-white p-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8"><UserRound className="h-4 w-4 text-[#131E5C]" /></div>
                                <div><p className="text-sm font-bold text-[#1A1F3C]">Receptor</p><p className="text-xs text-[#8891AD]">Empresa que registra el gasto</p></div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2"><InfoRow label="Razón social" value={receptor.razonSocial} /></div>
                                <InfoRow label="RFC" value={receptor.rfc} mono />
                                <InfoRow label="Uso CFDI" value={receptor.usoCfdi} />
                            </div>
                        </div>
                        <AsignacionFactura
                            factura={factura}
                            guardando={guardandoAsignacion}
                            onGuardar={onActualizarAsignacion}
                        />
                        <div className="rounded-xl border border-[#131E5C]/10 bg-[#131E5C] p-4 text-white">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Total factura</p>
                            <p className="mt-2 text-3xl font-extrabold tracking-tight">{money(totales.total, currency)}</p>

                            <div className="mt-5 space-y-2 border-t border-white/15 pt-4">
                                <div className="flex justify-between text-xs"><span className="text-white/60">Subtotal</span><span className="font-semibold">{money(totales.subtotal, currency)}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-white/60">Impuestos</span><span className="font-semibold">{money(totales.impuestos, currency)}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-white/60">Moneda</span><span className="font-semibold">{currency}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-[#E4E7F0] px-5 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <InfoRow label="UUID" value={comprobante.uuid} mono />
                            <InfoRow label="Folio" value={comprobante.folio} />
                            <InfoRow label="Fecha" value={formatDate(comprobante.fecha)} />
                            <InfoRow label="Método de pago" value={comprobante.metodoPago} />
                            <InfoRow label="Forma de pago" value={comprobante.formaPago} />
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-[#1A1F3C]">Conceptos de la factura</h4>
                                <p className="mt-0.5 text-xs text-[#8891AD]">Los datos fiscales son extraídos por IA. Clasificación, rubro y motivo son capturados manualmente.</p>
                            </div>
                            <Badge variant={conceptos.length > 0 && completos === conceptos.length ? "success" : "warning"}>{completos}/{conceptos.length} clasificados</Badge>
                        </div>

                        {conceptos.length > 0 ? (
                            <ConceptosTable factura={factura} onConceptoLocalChange={onConceptoLocalChange} onGuardarCampo={onGuardarCampo} guardandoConceptos={guardandoConceptos} />
                        ) : (
                            <div className="rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] px-6 py-10 text-center">
                                <FileCheck2 className="mx-auto h-6 w-6 text-[#8891AD]" />
                                <p className="mt-2 text-sm font-bold text-[#515778]">Sin conceptos detectados</p>
                                <p className="mt-1 text-xs text-[#8891AD]">Puedes intentar analizar nuevamente el PDF.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ChartCard({ titulo, descripcion, children }) {
    return (
        <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5 shadow-sm">
            <div className="mb-5">
                <h3 className="text-sm font-bold text-[#1A1F3C]">{titulo}</h3>
                <p className="mt-1 text-xs text-[#8891AD]">{descripcion}</p>
            </div>
            <div className="h-[320px] w-full">{children}</div>
        </div>
    );
}

function TooltipDinero({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-xl border border-[#E4E7F0] bg-white px-3 py-2 shadow-lg">
            <p className="mb-1 text-xs font-bold text-[#1A1F3C]">{label}</p>
            <p className="text-xs font-semibold text-[#131E5C]">{money(payload[0]?.value)}</p>
        </div>
    );
}

function VistaGraficos({ facturas }) {
    const porDealer = useMemo(() => agruparFacturasPor(facturas, (factura) => factura.dealer), [facturas]);
    const porDepartamento = useMemo(() => agruparFacturasPor(facturas, (factura) => factura.departamento), [facturas]);
    const porClasificacion = useMemo(() => agruparConceptosPor(facturas, (concepto) => concepto.clasificacion), [facturas]);
    const porMes = useMemo(() => agruparFacturasPorMes(facturas), [facturas]);

    if (!facturas.length) {
        return (
            <div className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-16 text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-[#8891AD]" />
                <p className="mt-3 text-sm font-bold text-[#1A1F3C]">Sin datos para graficar</p>
                <p className="mt-1 text-xs text-[#8891AD]">Modifica los filtros o carga facturas para visualizar información.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard titulo="Inversión por dealer" descripcion="Total facturado acumulado para cada agencia.">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porDealer} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7F0" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                        <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 11 }} width={70} />
                        <Tooltip content={<TooltipDinero />} />
                        <Bar dataKey="total" fill="#131E5C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard titulo="Inversión por departamento" descripcion="Distribución del gasto entre áreas comerciales y operativas.">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porDepartamento} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7F0" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                        <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 11 }} width={70} />
                        <Tooltip content={<TooltipDinero />} />
                        <Bar dataKey="total" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard titulo="Inversión por clasificación" descripcion="Suma de los importes de conceptos clasificados manualmente.">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porClasificacion} margin={{ top: 10, right: 10, left: 10, bottom: 45 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7F0" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 11 }} width={70} />
                        <Tooltip content={<TooltipDinero />} />
                        <Bar dataKey="total" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard titulo="Evolución mensual de inversión" descripcion="Total de facturas registrado por mes según la fecha del comprobante.">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={porMes} margin={{ top: 10, right: 15, left: 10, bottom: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7F0" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={moneyCompact} tick={{ fontSize: 11 }} width={70} />
                        <Tooltip content={<TooltipDinero />} />
                        <Line type="monotone" dataKey="total" stroke="#131E5C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

function VistaTabular({ facturas }) {
    const filas = useMemo(() => {
        return facturas.flatMap((factura) => {
            const conceptos = factura.conceptos?.length ? factura.conceptos : [{}];

            return conceptos.map((concepto, index) => ({
                id: `${factura.id}-${concepto.id || index}`,
                factura,
                concepto,
            }));
        });
    }, [facturas]);

    if (!filas.length) {
        return (
            <div className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-16 text-center">
                <Table2 className="mx-auto h-8 w-8 text-[#8891AD]" />
                <p className="mt-3 text-sm font-bold text-[#1A1F3C]">Sin registros para mostrar</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] px-5 py-4">
                <div>
                    <h3 className="text-sm font-bold text-[#1A1F3C]">Detalle tabular</h3>
                    <p className="mt-0.5 text-xs text-[#8891AD]">{filas.length} partidas visibles</p>
                </div>
                <Badge variant="navy">{facturas.length} facturas</Badge>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-[1750px] w-full border-collapse">
                    <thead>
                        <tr className="bg-[#131E5C] text-white">
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">Fecha</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">Dealer</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">Departamento</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">Folio</th>
                            <th className="min-w-[220px] px-3 py-3 text-left text-[10px] font-bold uppercase">Emisor</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">RFC</th>
                            <th className="min-w-[300px] px-3 py-3 text-left text-[10px] font-bold uppercase">Concepto</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">Clasificación</th>
                            <th className="px-3 py-3 text-left text-[10px] font-bold uppercase">Sitio / rubro</th>
                            <th className="min-w-[260px] px-3 py-3 text-left text-[10px] font-bold uppercase">Motivo</th>
                            <th className="px-3 py-3 text-right text-[10px] font-bold uppercase">Importe</th>
                            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase">Estado</th>
                            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase">PDF</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filas.map(({ id, factura, concepto }, index) => (
                            <tr key={id} className={`border-b border-[#E4E7F0] hover:bg-[#F7F8FC] ${index % 2 ? "bg-[#FCFCFE]" : "bg-white"}`}>
                                <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-[#515778]">{formatDate(factura?.comprobante?.fecha || factura?.fechaCarga)}</td>
                                <td className="whitespace-nowrap px-3 py-3"><Badge variant="navy">{factura.dealer || "Sin dealer"}</Badge></td>
                                <td className="whitespace-nowrap px-3 py-3"><Badge variant="info">{factura.departamento || "Sin departamento"}</Badge></td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-[#515778]">{factura?.comprobante?.folio || "—"}</td>
                                <td className="px-3 py-3 text-xs font-bold text-[#1A1F3C]">{factura?.emisor?.razonSocial || "—"}</td>
                                <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-[#515778]">{factura?.emisor?.rfc || "—"}</td>
                                <td className="px-3 py-3 text-xs font-semibold text-[#1A1F3C]">{concepto.descripcion || "Sin conceptos"}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs text-[#515778]">{concepto.clasificacion || "Sin clasificar"}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-xs text-[#515778]">{concepto.sitio || "—"}</td>
                                <td className="px-3 py-3 text-xs text-[#515778]">{concepto.motivo || "—"}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-extrabold text-[#1A1F3C]">{money(concepto.importe || 0, factura?.comprobante?.moneda)}</td>
                                <td className="px-3 py-3 text-center"><EstadoFacturaBadge estado={factura.estado} /></td>
                                <td className="px-3 py-3 text-center">
                                    {factura.archivoUrl ? (
                                        <a href={factura.archivoUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#131E5C] hover:bg-[#F7F8FC]" title="Abrir PDF">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    ) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AnalisisFacturas() {
    const [facturas, setFacturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [vista, setVista] = useState("detalle");
    const [q, setQ] = useState("");
    const [guardandoAsignaciones, setGuardandoAsignaciones] = useState({});
    const [dealerCarga, setDealerCarga] = useState("");
    const [departamentoCarga, setDepartamentoCarga] = useState("");
    const [filtroClasificacion, setFiltroClasificacion] = useState("");
    const [filtroSitio, setFiltroSitio] = useState("");
    const [filtroDealer, setFiltroDealer] = useState("");
    const [filtroDepartamento, setFiltroDepartamento] = useState("");
    const [guardandoConceptos, setGuardandoConceptos] = useState({});
    const [reanalizandoFacturas, setReanalizandoFacturas] = useState({});

    const cargarFacturas = useCallback(async () => {
        setCargando(true);
        setError("");

        try {
            const response = await apiAnalisisFacturas.list();
            setFacturas(normalizarListaFacturas(response));
        } catch (e) {
            setFacturas([]);
            setError(e?.message || "No fue posible cargar las facturas.");
        } finally {
            setCargando(false);
        }
    }, []);

    async function actualizarAsignacionFactura(facturaId, cambios) {
        setError("");
        setMensaje("");
        setGuardandoAsignaciones((prev) => ({ ...prev, [facturaId]: true }));

        try {
            const facturaActualizada = await apiAnalisisFacturas.updateAsignacion(facturaId, cambios);

            setFacturas((prev) =>
                prev.map((factura) =>
                    factura.id === facturaId ? facturaActualizada : factura
                )
            );

            setMensaje("Dealer y departamento actualizados correctamente.");
        } catch (e) {
            setError(e?.message || "No fue posible actualizar la asignación de la factura.");
        } finally {
            setGuardandoAsignaciones((prev) => ({ ...prev, [facturaId]: false }));
        }
    }

    useEffect(() => {
        cargarFacturas();
    }, [cargarFacturas]);

    const sitiosFiltro = useMemo(() => {
        if (filtroClasificacion) return OPCIONES_POR_CLASIFICACION[filtroClasificacion] || [];
        return [...new Set(Object.values(OPCIONES_POR_CLASIFICACION).flat())];
    }, [filtroClasificacion]);

    const facturasFiltradas = useMemo(() => {
        const query = q.trim().toLowerCase();

        return facturas.filter((factura) => {
            const conceptos = Array.isArray(factura.conceptos) ? factura.conceptos : [];

            const textoBusqueda = [
                factura.archivo, factura.dealer, factura.departamento, factura.emisor?.razonSocial, factura.emisor?.rfc,
                factura.receptor?.razonSocial, factura.receptor?.rfc, factura.comprobante?.folio, factura.comprobante?.uuid,
                ...conceptos.map((concepto) => concepto.descripcion), ...conceptos.map((concepto) => concepto.clasificacion),
                ...conceptos.map((concepto) => concepto.sitio), ...conceptos.map((concepto) => concepto.motivo),
            ].filter(Boolean).join(" ").toLowerCase();

            const coincideTexto = !query || textoBusqueda.includes(query);
            const coincideClasificacion = !filtroClasificacion || conceptos.some((concepto) => concepto.clasificacion === filtroClasificacion);
            const coincideSitio = !filtroSitio || conceptos.some((concepto) => concepto.sitio === filtroSitio);
            const coincideDealer = !filtroDealer || factura.dealer === filtroDealer;
            const coincideDepartamento = !filtroDepartamento || factura.departamento === filtroDepartamento;

            return coincideTexto && coincideClasificacion && coincideSitio && coincideDealer && coincideDepartamento;
        });
    }, [facturas, q, filtroClasificacion, filtroSitio, filtroDealer, filtroDepartamento]);

    const totalFacturado = useMemo(() => facturasFiltradas.reduce((total, factura) => total + Number(factura?.totales?.total || 0), 0), [facturasFiltradas]);
    const totalConceptos = useMemo(() => facturasFiltradas.reduce((total, factura) => total + (factura.conceptos?.length || 0), 0), [facturasFiltradas]);
    const conceptosClasificados = useMemo(() => facturasFiltradas.reduce((total, factura) => total + (factura.conceptos || []).filter(conceptoCompleto).length, 0), [facturasFiltradas]);

    async function handleFiles(files) {
        setError("");
        setMensaje("");

        const lista = Array.from(files || []);
        if (!lista.length) return;

        const invalidos = lista.filter((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
        if (invalidos.length) return setError("Solo se permiten archivos PDF para el lector de facturas.");

        setProcesando(true);
        let correctas = 0;
        const errores = [];

        try {
            for (const archivo of lista) {
                try {
                    await apiAnalisisFacturas.analizar(archivo, dealerCarga, departamentoCarga);
                    correctas += 1;
                } catch (e) {
                    errores.push(`${archivo.name}: ${e?.message || "No fue posible analizar."}`);
                }
            }

            await cargarFacturas();
            if (correctas) setMensaje(correctas === 1 ? "Factura analizada correctamente." : `${correctas} facturas analizadas correctamente.`);
            if (errores.length) setError(errores.join(" | "));
        } finally {
            setProcesando(false);
        }
    }

    async function eliminarFactura(facturaId) {
        const factura = facturas.find((item) => item.id === facturaId);
        if (!window.confirm(`¿Eliminar ${factura?.archivo || "esta factura"}? También se eliminará el PDF almacenado.`)) return;

        setError("");
        setMensaje("");

        try {
            await apiAnalisisFacturas.remove(facturaId);
            setFacturas((prev) => prev.filter((item) => item.id !== facturaId));
            setMensaje("Factura eliminada correctamente.");
        } catch (e) {
            setError(e?.message || "No fue posible eliminar la factura.");
        }
    }

    async function reanalizarFactura(facturaId) {
        setError("");
        setMensaje("");
        setReanalizandoFacturas((prev) => ({ ...prev, [facturaId]: true }));

        try {
            const facturaActualizada = await apiAnalisisFacturas.reanalizar(facturaId);
            setFacturas((prev) => prev.map((factura) => factura.id === facturaId ? facturaActualizada : factura));
            setMensaje("Factura analizada nuevamente.");
        } catch (e) {
            setError(e?.message || "No fue posible volver a analizar la factura.");
            await cargarFacturas();
        } finally {
            setReanalizandoFacturas((prev) => ({ ...prev, [facturaId]: false }));
        }
    }

    function actualizarConceptoLocal(facturaId, conceptoId, cambios) {
        setFacturas((prev) => prev.map((factura) => {
            if (factura.id !== facturaId) return factura;
            return { ...factura, conceptos: (factura.conceptos || []).map((concepto) => concepto.id === conceptoId ? { ...concepto, ...cambios } : concepto) };
        }));
    }

    async function guardarCampoConcepto(facturaId, conceptoId, cambios) {
        setError("");
        setGuardandoConceptos((prev) => ({ ...prev, [conceptoId]: true }));

        try {
            const conceptoActualizado = await apiAnalisisFacturas.updateConcepto(conceptoId, cambios);
            actualizarConceptoLocal(facturaId, conceptoId, conceptoActualizado);
        } catch (e) {
            setError(e?.message || "No fue posible guardar la clasificación del concepto.");
            await cargarFacturas();
        } finally {
            setGuardandoConceptos((prev) => ({ ...prev, [conceptoId]: false }));
        }
    }

    function cambiarFiltroClasificacion(valor) {
        setFiltroClasificacion(valor);
        setFiltroSitio("");
    }

    function limpiarFiltros() {
        setQ("");
        setFiltroClasificacion("");
        setFiltroSitio("");
        setFiltroDealer("");
        setFiltroDepartamento("");
    }

    const hayFiltros = Boolean(q || filtroClasificacion || filtroSitio || filtroDealer || filtroDepartamento);

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.surface }}>
            <header className="sticky top-0 z-40 w-full border-b bg-white" style={{ borderColor: "#131E5C22" }}>
                <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                    <div className="flex shrink-0 items-center gap-3 md:gap-4">
                        <img src={vwDark} alt="Volkswagen" className="h-16 w-16 object-contain md:h-20 md:w-20" loading="lazy" />
                        <div className="text-[23px] font-extrabold tracking-[-0.04em] md:text-[30px]" style={{ color: C.navy }}>Gestión de la inversión</div>
                    </div>

                    <div className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block" style={{ background: C.navy }} />

                    <button type="button" disabled={cargando} onClick={cargarFacturas} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-4 text-xs font-bold text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-50">
                        {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">
                {mensaje && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="flex-1 text-sm font-semibold text-emerald-700">{mensaje}</p>
                        <button type="button" onClick={() => setMensaje("")} className="text-emerald-600"><X className="h-4 w-4" /></button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <div className="flex-1"><p className="text-sm font-bold text-red-700">Ocurrió un problema</p><p className="mt-0.5 text-xs text-red-600">{error}</p></div>
                        <button type="button" onClick={() => setError("")} className="text-red-500"><X className="h-4 w-4" /></button>
                    </div>
                )}

                <section className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard label="Facturas visibles" value={facturasFiltradas.length} sub={`${facturas.length} facturas totales`} icon={ReceiptText} />
                    <StatCard label="Conceptos detectados" value={totalConceptos} sub="Partidas según filtros" icon={FileCheck2} variant="info" />
                    <StatCard label="Clasificación" value={`${conceptosClasificados}/${totalConceptos}`} sub="Clasificación, rubro y motivo" icon={CheckCircle2} variant="success" />
                    <StatCard label="Total visible" value={money(totalFacturado)} sub="Inversión según filtros" icon={CircleDollarSign} variant="warning" />
                </section>

                <section className="grid gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <SelectorVista vista={vista} onChange={setVista} />
                        <p className="text-xs text-[#8891AD]">
                            {vista === "detalle" && "Carga, revisa y clasifica las facturas."}
                            {vista === "graficos" && "Analiza la distribución de la inversión."}
                            {vista === "tabla" && "Consulta los conceptos en formato tabular."}
                        </p>
                    </div>

                    {vista === "detalle" && (
                        <UploadZone procesando={procesando} dealer={dealerCarga} departamento={departamentoCarga} onDealerChange={setDealerCarga} onDepartamentoChange={setDepartamentoCarga} onFiles={handleFiles} />
                    )}

                    <div className="rounded-2xl border border-[#E4E7F0] bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#131E5C]/8"><Filter className="h-4 w-4 text-[#131E5C]" /></div>
                            <div><p className="text-sm font-bold text-[#1A1F3C]">Filtros</p><p className="text-[11px] text-[#8891AD]">Los filtros se aplican a las tres vistas</p></div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Buscar</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                                    <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="RFC, emisor, folio, concepto…" className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Clasificación</label>
                                <select value={filtroClasificacion} onChange={(event) => cambiarFiltroClasificacion(event.target.value)} className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold outline-none">
                                    <option value="">Todas las clasificaciones</option>
                                    {CLASIFICACIONES.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Sitio / rubro</label>
                                <select value={filtroSitio} onChange={(event) => setFiltroSitio(event.target.value)} className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold outline-none">
                                    <option value="">Todos los sitios / rubros</option>
                                    {sitiosFiltro.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Dealer</label>
                                <select value={filtroDealer} onChange={(event) => setFiltroDealer(event.target.value)} className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold outline-none">
                                    <option value="">Todos los dealers</option>
                                    {DEALERS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">Departamento</label>
                                <select value={filtroDepartamento} onChange={(event) => setFiltroDepartamento(event.target.value)} className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold outline-none">
                                    <option value="">Todos los departamentos</option>
                                    {DEPARTAMENTOS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>
                        </div>

                        {hayFiltros && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-2">
                                    {q && <Badge>Texto: {q}</Badge>}
                                    {filtroClasificacion && <Badge variant="navy">{filtroClasificacion}</Badge>}
                                    {filtroSitio && <Badge variant="info">{filtroSitio}</Badge>}
                                    {filtroDealer && <Badge variant="navy">{filtroDealer}</Badge>}
                                    {filtroDepartamento && <Badge variant="success">{filtroDepartamento}</Badge>}
                                </div>

                                <button type="button" onClick={limpiarFiltros} className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] px-4 py-2 text-xs font-bold text-[#515778]">
                                    <X className="h-3.5 w-3.5" />Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>

                    {cargando ? (
                        <div className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-20 text-center">
                            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#131E5C]" />
                            <p className="mt-3 text-sm font-bold text-[#1A1F3C]">Cargando facturas…</p>
                        </div>
                    ) : vista === "graficos" ? (
                        <VistaGraficos facturas={facturasFiltradas} />
                    ) : vista === "tabla" ? (
                        <VistaTabular facturas={facturasFiltradas} />
                    ) : facturasFiltradas.length === 0 ? (
                        <div className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-16 text-center">
                            <ReceiptText className="mx-auto h-7 w-7 text-[#8891AD]" />
                            <p className="mt-4 text-sm font-bold text-[#1A1F3C]">{hayFiltros ? "No hay coincidencias" : "Aún no hay facturas"}</p>
                            <p className="mt-1 text-xs text-[#8891AD]">{hayFiltros ? "Prueba modificando los filtros." : "Selecciona dealer y departamento y sube un PDF."}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {facturasFiltradas.map((factura) => (
                                <FacturaCard
                                    key={factura.id}
                                    factura={factura}
                                    onDelete={() => eliminarFactura(factura.id)}
                                    onReanalizar={() => reanalizarFactura(factura.id)}
                                    onActualizarAsignacion={actualizarAsignacionFactura}
                                    reanalizando={Boolean(reanalizandoFacturas[factura.id])}
                                    guardandoAsignacion={Boolean(guardandoAsignaciones[factura.id])}
                                    onConceptoLocalChange={actualizarConceptoLocal}
                                    onGuardarCampo={guardarCampoConcepto}
                                    guardandoConceptos={guardandoConceptos}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}