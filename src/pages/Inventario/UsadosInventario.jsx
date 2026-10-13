// src/pages/Inventario/InventarioIndex.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart3,
    Building2,
    Car,
    Clock,
    FileSpreadsheet,
    FileText,
    LoaderCircle,
    RefreshCw,
    Table2,
    TrendingUp,
} from "lucide-react";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { apiInventario } from "../../lib/apiInventario";
import { useECharts } from "./useECharts";
import "./inventario.css";

import vwDark from "../../assets/vw_dark.png";

const BRAND_BLUE = "#131E5C";

const COLORES = [
    "#0B143F",
    "#10205A",
    "#142D76",
    "#183B91",
    "#1C49AC",
    "#2058C6",
    "#2868D5",
    "#3479E0",
    "#438BE8",
];

const PALETA_AGENCIAS = COLORES;
const PALETA_ESTATUS = COLORES;

const PALETA_CONDICION = {
    Nuevo: BRAND_BLUE,
    Usado: COLORES[7],
    default: COLORES[4],
};

const ESTATUS_EXCLUIDOS = ["V", "O", "C", "D", "P", "T"];

const MODELOS_COMERCIALES = [
    "E-CRAFTER",
    "CRAFTER",
    "AMAROK",
    "TRANSPORTER",
    "CADDY",
];

function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function esperarRenderCompleto() {
    if (document.fonts?.ready) await document.fonts.ready;

    await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    // Permite que las gráficas (ECharts) terminen de medir y pintar.
    await new Promise((resolve) => setTimeout(resolve, 350));
}

function agregarCanvasPaginadoPdf(doc, canvas) {
    const margen = 8;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const anchoUtil = anchoPagina - margen * 2;
    const altoUtil = altoPagina - margen * 2;
    const pixelesPorMm = canvas.width / anchoUtil;
    const altoCortePx = Math.max(1, Math.floor(altoUtil * pixelesPorMm));

    let posicionY = 0;
    let primeraPagina = true;

    while (posicionY < canvas.height) {
        if (!primeraPagina) doc.addPage("a4", "landscape");
        primeraPagina = false;

        const altoActualPx = Math.min(altoCortePx, canvas.height - posicionY);
        const corte = document.createElement("canvas");
        corte.width = canvas.width;
        corte.height = altoActualPx;
        const contexto = corte.getContext("2d");
        if (!contexto) throw new Error("No fue posible preparar una página del PDF.");
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, corte.width, corte.height);
        contexto.drawImage(canvas, 0, posicionY, canvas.width, altoActualPx, 0, 0, canvas.width, altoActualPx);

        const altoImagenMm = altoActualPx / pixelesPorMm;
        doc.addImage(corte.toDataURL("image/png"), "PNG", margen, margen, anchoUtil, altoImagenMm, undefined, "FAST");
        posicionY += altoActualPx;
    }
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

const KPI_ICONS = {
    "Total activo": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
    ),
    "Agencia líder": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
    ),
    "% Nuevos": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 14.25l6-6m4.5-3.493V21.75l-4.125-2.062-4.125 2.063-4.125-2.063L3 21.75V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
    ),
    "Costo inventario": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    ),
    "Fuera de gracia": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    ),
    "Costo financiero": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"
        />
    ),
    "Tasa aplicada": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7.5 7.5h.008v.008H7.5V7.5zm9 9h.008v.008H16.5V16.5zM18 6L6 18"
        />
    ),
    "Periodo de gracia": (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6.75 3v2.25M17.25 3v2.25M3.75 9h16.5M5.25 5.25h13.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z"
        />
    ),
};

function numeroSeguro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

function formatMoneda(valor, decimales = 2) {
    return `$${numeroSeguro(valor).toLocaleString("es-MX", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    })}`;
}

function obtenerReglaPenetracion(penetracion) {
    const valor = Math.max(0, Math.min(100, numeroSeguro(penetracion)));

    if (valor < 38) {
        return {
            rango: "< 38%",
            bono: 0,
            descuentoWholesale: 0,
        };
    }

    if (valor < 42) {
        return {
            rango: "38% a < 42%",
            bono: 0.5,
            descuentoWholesale: 0,
        };
    }

    if (valor < 48) {
        return {
            rango: "42% a < 48%",
            bono: 1,
            descuentoWholesale: -1.5,
        };
    }

    if (valor < 53) {
        return {
            rango: "48% a < 53%",
            bono: 2.25,
            descuentoWholesale: -2,
        };
    }

    return {
        rango: ">= 53%",
        bono: 3.5,
        descuentoWholesale: -2.5,
    };
}

function calcularFinanciamientoVehiculo(
    vehiculo,
    periodoGracia,
    tasaAnual
) {
    const antiguedad =
        vehiculo.diasEnStock === null ||
            vehiculo.diasEnStock === undefined
            ? null
            : numeroSeguro(vehiculo.diasEnStock);

    if (antiguedad === null) {
        return {
            ...vehiculo,
            diasFueraGracia: null,
            costoFinancieroDiario: null,
            costoFinancieroTotal: null,
        };
    }

    const diasFuera =
        antiguedad > periodoGracia
            ? antiguedad - periodoGracia
            : null;

    if (diasFuera === null) {
        return {
            ...vehiculo,
            diasFueraGracia: null,
            costoFinancieroDiario: null,
            costoFinancieroTotal: null,
        };
    }

    const valorCompra = Number(vehiculo.VrNF_Compra);

    if (!Number.isFinite(valorCompra)) {
        return {
            ...vehiculo,
            diasFueraGracia: diasFuera,
            costoFinancieroDiario: null,
            costoFinancieroTotal: null,
        };
    }

    const costoFinancieroDiario =
        (valorCompra * (tasaAnual / 100)) / 360;

    const costoFinancieroTotal =
        costoFinancieroDiario * diasFuera;

    return {
        ...vehiculo,
        diasFueraGracia: diasFuera,
        costoFinancieroDiario,
        costoFinancieroTotal,
    };
}

function KPICard({
    label,
    value,
    sub,
    color = BRAND_BLUE,
    destacado = false,
}) {
    return (
        <div
            className={`rounded-xl border p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)] ${destacado
                ? "border-[#131E5C] bg-[#131E5C] text-white"
                : "border-[#B9C4D7] bg-white"
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div
                    className={`font-black uppercase tracking-[0.07em] ${destacado ? "text-white" : "text-[#1A2344]"
                        }`}
                >
                    {label}
                </div>

                <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${destacado
                        ? "bg-white/15 text-white"
                        : "bg-[#EAF0FF]"
                        }`}
                    style={!destacado ? { color } : undefined}
                >
                    <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {KPI_ICONS[label]}
                    </svg>
                </span>
            </div>

            <div
                className={`mt-6 text-[32px] font-black leading-none ${destacado ? "text-white" : "text-[#07184C]"
                    }`}
            >
                {value}
            </div>

            <div
                className={`mt-4 border-t pt-3 font-semibold ${destacado
                    ? "border-white/15 text-white/80"
                    : "border-[#E6EAF1] text-[#67728B]"
                    }`}
            >
                {sub || "\u00A0"}
            </div>
        </div>
    );
}

function Panel({ titulo, subtitulo, children, alto, extra }) {
    return (
        <div className="rounded-xl border border-[#B9C4D7] bg-white p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)]">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-black uppercase tracking-[0.06em] text-[#152754]">
                        {titulo}
                    </h3>

                    {subtitulo && (
                        <p className="mt-1 text-[13px] font-medium text-[#7A859C]">
                            {subtitulo}
                        </p>
                    )}
                </div>

                {extra}
            </div>

            <div style={alto ? { height: alto } : undefined}>
                {children}
            </div>
        </div>
    );
}

function ChartDiv({ option, loading, onEvents }) {
    const ref = useECharts(option, {
        loading,
        onEvents,
    });

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    );
}

function EmptyState({
    mensaje = "Sin datos para los filtros seleccionados",
}) {
    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ color: `${BRAND_BLUE}55` }}
        >
            <svg
                width="32"
                height="32"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0M12 7a4 4 0 100-8 4 4 0 000 8z"
                />
            </svg>

            <span className="text-sm">
                {mensaje}
            </span>
        </div>
    );
}

function Badge({ label, color = BRAND_BLUE }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
                background: `${color}12`,
                color,
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: color }}
            />

            {label}
        </span>
    );
}

function Seccion({ titulo, subtitulo, children, className = "" }) {
    return (
        <section
            className={`relative rounded-xl border border-[#9EA9BD] bg-white px-2 pb-4 pt-7 shadow-sm ${className}`}
        >
            <div className="absolute -top-[14px] left-5 flex max-w-[calc(100%_-_40px)] items-center gap-3 bg-white px-2">
                <h2 className="whitespace-nowrap text-[18px] font-black text-[#07184C]">
                    {titulo}
                </h2>

                <div className="hidden h-px w-24 bg-[#748199] sm:block" />
            </div>

            {subtitulo && (
                <div className="mb-4 font-medium text-[#67728B]">
                    {subtitulo}
                </div>
            )}

            {children}
        </section>
    );
}

function Tarjeta({ children, className = "" }) {
    return (
        <div
            className={`rounded-xl border border-[#B9C4D7] bg-white p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)] ${className}`}
        >
            {children}
        </div>
    );
}

function GrupoFiltro({ titulo, children }) {
    return (
        <div>
            <div className="mb-2 text-[12px] font-black uppercase  text-[#67728B]">
                {titulo}
            </div>

            <div className="flex flex-wrap gap-2">
                {children}
            </div>
        </div>
    );
}

function BotonFiltro({ activo, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg border px-4 py-2 text-[13px] font-bold transition ${activo
                ? "border-[#131E5C] bg-[#131E5C] text-white shadow-sm"
                : "border-[#131E5C] bg-white text-[#152754] hover:border-[#131E5C] hover:bg-[#EEF2F8]"
                }`}
        >
            {children}
        </button>
    );
}

function CampoFinanciero({
    titulo,
    descripcion,
    value,
    onChange,
    min,
    max,
    step,
    suffix,
}) {
    return (
        <div>
            <label className="text-[12px] font-black uppercase tracking-[0.06em] text-[#67728B]">
                {titulo}
            </label>

            <div className="relative mt-2">
                <input
                    type="number"
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step={step}
                    className="h-10 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 pr-11 font-bold text-[#152754] outline-none transition focus:border-[#1555C7] focus:bg-white"
                />

                {suffix && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#7A859C]">
                        {suffix}
                    </span>
                )}
            </div>

            <div className="mt-1 text-[14px] font-medium text-[#8A94A8]">
                {descripcion}
            </div>
        </div>
    );
}

function MetricaFinanciera({ titulo, valor, detalle }) {
    return (
        <div className="rounded-lg border border-[#D7DEEA] bg-white px-4 py-3">
            <div className="text-[13px] font-semibold text-[#67728B]">
                {titulo}
            </div>

            <div className="mt-1 text-[19px] font-black text-[#07184C]">
                {valor}
            </div>

            {detalle && (
                <div className="mt-1 text-[12px] font-medium text-[#8A94A8]">
                    {detalle}
                </div>
            )}
        </div>
    );
}

function FiltrosInventario({
    filtrosDisponibles,
    agenciaSeleccionada,
    setAgenciaSeleccionada,
    modelosComerciales,
    setModelosComerciales,
    estatusSeleccionado,
    setEstatusSeleccionado,

    condicionInventario,
    setCondicionInventario,

    periodoGracia,
    setPeriodoGracia,
    tiie,
    setTiie,
    spreadBase,
    setSpreadBase,
    penetracionRetail,
    setPenetracionRetail,
    reglaPenetracion,
    spreadEfectivo,
    tasaAnual,
}) {
    const estatusDisponibles = filtrosDisponibles.estatus.filter(
        (estatus) => !ESTATUS_EXCLUIDOS.includes(estatus.codigo)
    );

    const seleccionarTodasAgencias = () => {
        setAgenciaSeleccionada("");
        setModelosComerciales(false);
    };

    const seleccionarVehiculosComerciales = () => {
        setAgenciaSeleccionada("");
        setModelosComerciales(true);
    };

    const seleccionarAgencia = (codigo) => {
        setModelosComerciales(false);
        setAgenciaSeleccionada(codigo);
    };

    return (
        <div className="space-y-5 pl-3 pr-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-9">

                {/* AGENCIA */}
                <div className="min-w-0 xl:col-span-4">
                    <GrupoFiltro titulo="Agencia">
                        <BotonFiltro
                            activo={!agenciaSeleccionada && !modelosComerciales}
                            onClick={seleccionarTodasAgencias}
                        >
                            Todas
                        </BotonFiltro>

                        <BotonFiltro
                            activo={modelosComerciales}
                            onClick={seleccionarVehiculosComerciales}
                        >
                            R&R Vehículos Comerciales
                        </BotonFiltro>

                        {filtrosDisponibles.agencias.map((agencia) => (
                            <BotonFiltro
                                key={agencia.codigo}
                                activo={
                                    !modelosComerciales &&
                                    agenciaSeleccionada === agencia.codigo
                                }
                                onClick={() => seleccionarAgencia(agencia.codigo)}
                            >
                                {agencia.nombre}
                            </BotonFiltro>
                        ))}
                    </GrupoFiltro>
                </div>

                {/* ESTATUS */}
                <div className="min-w-0 xl:col-span-3">
                    <GrupoFiltro titulo="Estatus">
                        <BotonFiltro
                            activo={!estatusSeleccionado}
                            onClick={() => setEstatusSeleccionado("")}
                        >
                            Todos
                        </BotonFiltro>

                        {estatusDisponibles.map((estatus) => (
                            <BotonFiltro
                                key={estatus.codigo}
                                activo={estatusSeleccionado === estatus.codigo}
                                onClick={() => setEstatusSeleccionado(estatus.codigo)}
                            >
                                {estatus.nombre}
                            </BotonFiltro>
                        ))}
                    </GrupoFiltro>
                </div>

                {/* PERIODO DE GRACIA */}
                <div className="min-w-0 xl:col-span-2">
                    <GrupoFiltro titulo="Periodo de gracia">
                        {[30, 45, 60].map((dias) => (
                            <BotonFiltro
                                key={dias}
                                activo={periodoGracia === dias}
                                onClick={() => setPeriodoGracia(dias)}
                            >
                                {dias} días
                            </BotonFiltro>
                        ))}
                    </GrupoFiltro>
                </div>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:max-w-3xl">

                <CampoFinanciero
                    titulo="TIIE 28 días"
                    descripcion="Tasa anual de referencia"
                    value={tiie}
                    onChange={(e) => setTiie(e.target.value)}
                    min="0"
                    step="0.0001"
                    suffix="%"
                />

                <CampoFinanciero
                    titulo="Spread base"
                    descripcion="Antes del descuento wholesale"
                    value={spreadBase}
                    onChange={(e) => setSpreadBase(e.target.value)}
                    step="0.01"
                    suffix="pp"
                />

                <CampoFinanciero
                    titulo="Penetración retail"
                    descripcion="Define bono y descuento"
                    value={penetracionRetail}
                    onChange={(e) => setPenetracionRetail(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    suffix="%"
                />

            </div>


            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricaFinanciera
                    titulo="Bono penetración"
                    valor={`${reglaPenetracion.bono.toFixed(2)} pp`}
                    detalle={reglaPenetracion.rango}
                />

                <MetricaFinanciera
                    titulo="Descuento wholesale"
                    valor={`${reglaPenetracion.descuentoWholesale.toFixed(2)} pp`}
                    detalle="Ajuste sobre spread"
                />

                <MetricaFinanciera
                    titulo="Spread efectivo"
                    valor={`${spreadEfectivo.toFixed(2)} pp`}
                    detalle="Spread base + descuento"
                />

                <MetricaFinanciera
                    titulo="TIIE + Spread"
                    valor={`${tasaAnual.toFixed(4)}%`}
                    detalle="Tasa anual aplicada"
                />
            </div>
        </div>
    );
}

function obtenerColorAntiguedad(
    dias,
    periodoGracia
) {
    if (dias <= periodoGracia) {
        return COLORES[7];
    }

    if (dias <= periodoGracia + 30) {
        return COLORES[5];
    }

    if (dias <= periodoGracia + 60) {
        return COLORES[3];
    }

    return COLORES[0];
}

function TablaVehiculos({
    vehiculos,
    cargando,
    error,
    familiaFiltro,
    onClearFamilia,
    periodoGracia,
}) {
    const [query, setQuery] = useState("");
    const [pagina, setPagina] = useState(1);
    const [filtAgencia, setFiltAgencia] = useState("");
    const [filtEstatus, setFiltEstatus] = useState("");
    const [filtCondicion, setFiltCondicion] =
        useState("");
    const [filtFamilia, setFiltFamilia] =
        useState("");
    const [filtDiasMin, setFiltDiasMin] =
        useState("");
    const [filtDiasMax, setFiltDiasMax] =
        useState("");

    const POR_PAGINA = 12;

    const agencias = useMemo(
        () =>
            [
                ...new Set(
                    vehiculos
                        .map((v) => v.agenciaNombre)
                        .filter(Boolean)
                ),
            ].sort(),
        [vehiculos]
    );

    const estatuses = useMemo(
        () =>
            [
                ...new Set(
                    vehiculos
                        .map((v) => v.estatusNombre)
                        .filter(Boolean)
                ),
            ].sort(),
        [vehiculos]
    );

    const familias = useMemo(
        () =>
            [
                ...new Set(
                    vehiculos
                        .map((v) => v.NmFamilia)
                        .filter(Boolean)
                ),
            ].sort(),
        [vehiculos]
    );

    const filtrados = useMemo(() => {
        const q = query.trim().toLowerCase();

        return vehiculos.filter((v) => {
            if (
                familiaFiltro &&
                (v.NmFamilia || "").toLowerCase() !==
                familiaFiltro.toLowerCase()
            ) {
                return false;
            }

            if (
                filtAgencia &&
                v.agenciaNombre !== filtAgencia
            ) {
                return false;
            }

            if (
                filtEstatus &&
                v.estatusNombre !== filtEstatus
            ) {
                return false;
            }

            if (filtCondicion) {
                const condicion =
                    {
                        N: "Nuevo",
                        U: "Usado",
                    }[(v.CondUso || "").trim()];

                if (condicion !== filtCondicion) {
                    return false;
                }
            }

            if (
                filtFamilia &&
                (v.NmFamilia || "") !== filtFamilia
            ) {
                return false;
            }

            if (
                filtDiasMin !== "" &&
                (v.diasEnStock ?? 0) <
                Number(filtDiasMin)
            ) {
                return false;
            }

            if (
                filtDiasMax !== "" &&
                (v.diasEnStock ?? 0) >
                Number(filtDiasMax)
            ) {
                return false;
            }

            if (q) {
                return [
                    v.NmFamilia,
                    v.NmMarca,
                    v.EdiModelo,
                    v.agenciaNombre,
                    v.estatusNombre,
                    v.SitVeiculo,
                    v.NrChassi,
                ].some((campo) =>
                    (campo || "")
                        .toLowerCase()
                        .includes(q)
                );
            }

            return true;
        });
    }, [
        vehiculos,
        query,
        familiaFiltro,
        filtAgencia,
        filtEstatus,
        filtCondicion,
        filtFamilia,
        filtDiasMin,
        filtDiasMax,
    ]);

    useEffect(() => {
        setPagina(1);
    }, [
        query,
        vehiculos,
        filtAgencia,
        filtEstatus,
        filtCondicion,
        filtFamilia,
        filtDiasMin,
        filtDiasMax,
    ]);

    const totalPaginas = Math.ceil(
        filtrados.length / POR_PAGINA
    );

    const paginados = filtrados.slice(
        (pagina - 1) * POR_PAGINA,
        pagina * POR_PAGINA
    );

    const condLabel = (condicion) =>
    ({
        N: "Nuevo",
        U: "Usado",
    }[(condicion || "").trim()] ??
        condicion ??
        "—");

    const totalCosto = filtrados.reduce(
        (total, vehiculo) =>
            total +
            numeroSeguro(vehiculo.VrNF_Compra),
        0
    );

    const totalCostoFinanciero =
        filtrados.reduce(
            (total, vehiculo) =>
                total +
                numeroSeguro(
                    vehiculo.costoFinancieroTotal
                ),
            0
        );

    const hayFiltros =
        filtAgencia ||
        filtEstatus ||
        filtCondicion ||
        filtFamilia ||
        filtDiasMin ||
        filtDiasMax;

    const limpiarFiltros = () => {
        setFiltAgencia("");
        setFiltEstatus("");
        setFiltCondicion("");
        setFiltFamilia("");
        setFiltDiasMin("");
        setFiltDiasMax("");
        setQuery("");
    };

    const selectCls =
        "vw-control text-xs border rounded-lg px-2 py-1.5 bg-white";

    return (
        <div>
            <div className="relative mb-3">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: `${BRAND_BLUE}88` }}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                    />
                </svg>

                <input
                    type="text"
                    value={query}
                    onChange={(e) =>
                        setQuery(e.target.value)
                    }
                    placeholder="Buscar por VIN, modelo, agencia…"
                    className="vw-control w-full pl-8 pr-8 py-1.5 text-xs border rounded-lg bg-white"
                />

                {query && (
                    <button
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{
                            color: `${BRAND_BLUE}88`,
                        }}
                    >
                        <svg
                            width="12"
                            height="12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>

            <div
                className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl"
                style={{
                    background: `${BRAND_BLUE}06`,
                    border: `1px solid ${BRAND_BLUE}10`,
                }}
            >
                <select
                    value={filtAgencia}
                    onChange={(e) =>
                        setFiltAgencia(e.target.value)
                    }
                    className={selectCls}
                >
                    <option value="">
                        Todas las agencias
                    </option>

                    {agencias.map((agencia) => (
                        <option
                            key={agencia}
                            value={agencia}
                        >
                            {agencia}
                        </option>
                    ))}
                </select>

                <select
                    value={filtEstatus}
                    onChange={(e) =>
                        setFiltEstatus(e.target.value)
                    }
                    className={selectCls}
                >
                    <option value="">
                        Todos los estatus
                    </option>

                    {estatuses.map((estatus) => (
                        <option
                            key={estatus}
                            value={estatus}
                        >
                            {estatus}
                        </option>
                    ))}
                </select>

                <select
                    value={filtCondicion}
                    onChange={(e) =>
                        setFiltCondicion(e.target.value)
                    }
                    className={selectCls}
                >
                    <option value="">
                        Nuevo y Usado
                    </option>
                    <option value="Nuevo">
                        Nuevo
                    </option>
                    <option value="Usado">
                        Usado
                    </option>
                </select>

                <select
                    value={filtFamilia}
                    onChange={(e) =>
                        setFiltFamilia(e.target.value)
                    }
                    className={selectCls}
                >
                    <option value="">
                        Todas las familias
                    </option>

                    {familias.map((familia) => (
                        <option
                            key={familia}
                            value={familia}
                        >
                            {familia}
                        </option>
                    ))}
                </select>

                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={filtDiasMin}
                        onChange={(e) =>
                            setFiltDiasMin(e.target.value)
                        }
                        placeholder="Días min"
                        min={0}
                        className={`${selectCls} w-24`}
                    />

                    <span
                        className="text-xs"
                        style={{
                            color: `${BRAND_BLUE}88`,
                        }}
                    >
                        —
                    </span>

                    <input
                        type="number"
                        value={filtDiasMax}
                        onChange={(e) =>
                            setFiltDiasMax(e.target.value)
                        }
                        placeholder="Días max"
                        min={0}
                        className={`${selectCls} w-24`}
                    />
                </div>

                {hayFiltros && (
                    <button
                        onClick={limpiarFiltros}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{
                            background: `${BRAND_BLUE}12`,
                            color: BRAND_BLUE,
                        }}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {familiaFiltro && (
                <div className="flex items-center gap-2 mb-2">
                    <span
                        className="text-xs"
                        style={{
                            color: `${BRAND_BLUE}88`,
                        }}
                    >
                        Filtrando por modelo:
                    </span>

                    <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                            background: `${COLORES[7]}15`,
                            color: COLORES[7],
                        }}
                    >
                        {familiaFiltro}

                        <button
                            onClick={onClearFamilia}
                        >
                            <svg
                                width="10"
                                height="10"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </span>
                </div>
            )}

            {!cargando && !error && (
                <p
                    className="text-xs mb-2"
                    style={{
                        color: `${BRAND_BLUE}77`,
                    }}
                >
                    {filtrados.length.toLocaleString(
                        "es-MX"
                    )}{" "}
                    vehículo
                    {filtrados.length !== 1
                        ? "s"
                        : ""}
                    {query && ` · "${query}"`}
                </p>
            )}

            {error && (
                <p
                    className="text-sm text-center py-6"
                    style={{ color: BRAND_BLUE }}
                >
                    {error}
                </p>
            )}

            {cargando && (
                <div
                    className="flex items-center justify-center py-10 gap-2 text-sm"
                    style={{
                        color: `${BRAND_BLUE}88`,
                    }}
                >
                    <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 12a8 8 0 018-8v8H4z"
                        />
                    </svg>

                    Cargando…
                </div>
            )}

            {!cargando &&
                !error &&
                filtrados.length === 0 && (
                    <p
                        className="text-center text-xs py-8"
                        style={{
                            color: `${BRAND_BLUE}77`,
                        }}
                    >
                        Sin resultados.
                    </p>
                )}

            {!cargando &&
                !error &&
                paginados.length > 0 && (
                    <>
                        <div
                            className="overflow-auto rounded-xl"
                            style={{
                                border: `1px solid ${BRAND_BLUE}10`,
                            }}
                        >
                            <table className="w-full text-xs">
                                <thead>
                                    <tr
                                        className="text-left"
                                        style={{
                                            background:
                                                `${BRAND_BLUE}08`,
                                            borderBottom: `1px solid ${BRAND_BLUE}12`,
                                        }}
                                    >
                                        {[
                                            "VIN",
                                            "Familia",
                                            "Modelo",
                                            "Agencia",
                                            "Condición",
                                            "Estatus",
                                            "F. Factura",
                                            "Antigüedad",
                                            "Fuera gracia",
                                            "Valor Compra",
                                            "Costo diario",
                                            "Costo financiero",
                                            "Situación",
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-3 py-2.5 font-semibold whitespace-nowrap"
                                                style={{
                                                    color: `${BRAND_BLUE}BB`,
                                                }}
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginados.map(
                                        (vehiculo, index) => {
                                            const colorAntiguedad =
                                                obtenerColorAntiguedad(
                                                    vehiculo.diasEnStock ??
                                                    0,
                                                    periodoGracia
                                                );

                                            return (
                                                <tr
                                                    key={`${vehiculo.NrChassi}-${index}`}
                                                    style={{
                                                        borderBottom: `1px solid ${BRAND_BLUE}08`,
                                                        background:
                                                            index % 2 === 0
                                                                ? "#FFFFFF"
                                                                : `${BRAND_BLUE}03`,
                                                    }}
                                                >
                                                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                                                        <span
                                                            className="font-semibold"
                                                            style={{
                                                                color:
                                                                    BRAND_BLUE,
                                                                fontSize:
                                                                    "11px",
                                                                letterSpacing:
                                                                    "0.03em",
                                                            }}
                                                        >
                                                            {vehiculo.NrChassi ||
                                                                "—"}
                                                        </span>
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 font-medium whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                COLORES[1],
                                                        }}
                                                    >
                                                        {vehiculo.NmFamilia ||
                                                            "—"}
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}BB`,
                                                        }}
                                                    >
                                                        {vehiculo.EdiModelo ||
                                                            "—"}
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}BB`,
                                                        }}
                                                    >
                                                        {
                                                            vehiculo.agenciaNombre
                                                        }
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}BB`,
                                                        }}
                                                    >
                                                        {condLabel(
                                                            vehiculo.CondUso
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <span
                                                            className="px-2 py-0.5 rounded-sm text-xs font-semibold"
                                                            style={{
                                                                background:
                                                                    `${BRAND_BLUE}12`,
                                                                color:
                                                                    BRAND_BLUE,
                                                            }}
                                                        >
                                                            {
                                                                vehiculo.estatusNombre
                                                            }
                                                        </span>
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}99`,
                                                        }}
                                                    >
                                                        {vehiculo.DtFaturamento ||
                                                            "—"}
                                                    </td>

                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {vehiculo.diasEnStock !=
                                                            null ? (
                                                            <span
                                                                className="font-medium px-2 py-0.5 rounded-full"
                                                                style={{
                                                                    background:
                                                                        `${colorAntiguedad}14`,
                                                                    color:
                                                                        colorAntiguedad,
                                                                }}
                                                            >
                                                                {
                                                                    vehiculo.diasEnStock
                                                                }
                                                                d
                                                            </span>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </td>

                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {vehiculo.diasFueraGracia !=
                                                            null ? (
                                                            <span
                                                                className="font-semibold px-2 py-0.5 rounded-full"
                                                                style={{
                                                                    background:
                                                                        `${COLORES[2]}14`,
                                                                    color:
                                                                        COLORES[2],
                                                                }}
                                                            >
                                                                {
                                                                    vehiculo.diasFueraGracia
                                                                }
                                                                d
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="font-medium px-2 py-0.5 rounded-full"
                                                                style={{
                                                                    background:
                                                                        `${COLORES[7]}12`,
                                                                    color:
                                                                        COLORES[7],
                                                                }}
                                                            >
                                                                En gracia
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}BB`,
                                                        }}
                                                    >
                                                        {vehiculo.VrNF_Compra !=
                                                            null
                                                            ? formatMoneda(
                                                                vehiculo.VrNF_Compra
                                                            )
                                                            : "—"}
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}BB`,
                                                        }}
                                                    >
                                                        {vehiculo.costoFinancieroDiario !=
                                                            null
                                                            ? formatMoneda(
                                                                vehiculo.costoFinancieroDiario
                                                            )
                                                            : "—"}
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 font-semibold whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                BRAND_BLUE,
                                                        }}
                                                    >
                                                        {vehiculo.costoFinancieroTotal !=
                                                            null
                                                            ? formatMoneda(
                                                                vehiculo.costoFinancieroTotal
                                                            )
                                                            : "—"}
                                                    </td>

                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        style={{
                                                            color:
                                                                `${BRAND_BLUE}77`,
                                                        }}
                                                    >
                                                        {vehiculo.SitVeiculo ||
                                                            "—"}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>

                                <tfoot>
                                    <tr
                                        style={{
                                            background:
                                                `${BRAND_BLUE}08`,
                                            borderTop: `2px solid ${BRAND_BLUE}18`,
                                        }}
                                    >
                                        <td
                                            colSpan={9}
                                            className="px-3 py-2.5 font-semibold text-xs"
                                            style={{
                                                color: BRAND_BLUE,
                                            }}
                                        >
                                            Total (
                                            {filtrados.length.toLocaleString(
                                                "es-MX"
                                            )}{" "}
                                            vehículos)
                                        </td>

                                        <td
                                            className="px-3 py-2.5 font-bold whitespace-nowrap text-xs"
                                            style={{
                                                color: BRAND_BLUE,
                                            }}
                                        >
                                            {formatMoneda(totalCosto)}
                                        </td>

                                        <td />

                                        <td
                                            className="px-3 py-2.5 font-bold whitespace-nowrap text-xs"
                                            style={{
                                                color: BRAND_BLUE,
                                            }}
                                        >
                                            {formatMoneda(
                                                totalCostoFinanciero
                                            )}
                                        </td>

                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {totalPaginas > 1 && (
                            <div
                                className="flex items-center justify-between mt-3 pt-3"
                                style={{
                                    borderTop: `1px solid ${BRAND_BLUE}10`,
                                }}
                            >
                                <span
                                    className="text-xs"
                                    style={{
                                        color: `${BRAND_BLUE}77`,
                                    }}
                                >
                                    Página {pagina} de{" "}
                                    {totalPaginas}
                                </span>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() =>
                                            setPagina((actual) =>
                                                Math.max(
                                                    1,
                                                    actual - 1
                                                )
                                            )
                                        }
                                        disabled={pagina === 1}
                                        className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40"
                                        style={{
                                            borderColor:
                                                `${BRAND_BLUE}22`,
                                            color: BRAND_BLUE,
                                        }}
                                    >
                                        ← Anterior
                                    </button>

                                    <button
                                        onClick={() =>
                                            setPagina((actual) =>
                                                Math.min(
                                                    totalPaginas,
                                                    actual + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            pagina === totalPaginas
                                        }
                                        className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40"
                                        style={{
                                            borderColor:
                                                `${BRAND_BLUE}22`,
                                            color: BRAND_BLUE,
                                        }}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
        </div>
    );
}

export default function InventarioIndex() {
    const navigate = useNavigate();

    const tablaRef = useRef(null);

    const reporteRef = useRef(null);

    const [
        filtrosDisponibles,
        setFiltrosDisponibles,
    ] = useState({
        agencias: [],
        estatus: [],
    });

    const [
        agenciaSeleccionada,
        setAgenciaSeleccionada,
    ] = useState("");

    const [
        modelosComerciales,
        setModelosComerciales,
    ] = useState(false);

    const [
        estatusSeleccionado,
        setEstatusSeleccionado,
    ] = useState("");


    const [
        condicionInventario,
        setCondicionInventario,
    ] = useState("U");

    const [familiaFiltro, setFamiliaFiltro] =
        useState("");

    const [vehiculos, setVehiculos] =
        useState([]);

    const [porAgencia, setPorAgencia] =
        useState([]);

    const [porEstatus, setPorEstatus] =
        useState([]);

    const [porMarca, setPorMarca] =
        useState([]);

    const [nuevoUsado, setNuevoUsado] =
        useState([]);

    const [
        nacionalImportado,
        setNacionalImportado,
    ] = useState([]);

    const [costoTotal, setCostoTotal] =
        useState(0);

    const [antiguedad, setAntiguedad] =
        useState([]);

    const [cargando, setCargando] =
        useState(true);

    const [cargandoTabla, setCargandoTabla] =
        useState(true);

    const [error, setError] = useState("");

    const [errorTabla, setErrorTabla] =
        useState("");

    // Parámetros financieros.
    const [periodoGracia, setPeriodoGracia] =
        useState(30);

    // Valor inicial según el dato mostrado.
    const [tiie, setTiie] =
        useState("6.7458");

    // Debe configurarse con el spread contractual.
    const [spreadBase, setSpreadBase] =
        useState("0");

    const [
        penetracionRetail,
        setPenetracionRetail,
    ] = useState("0");

    // Vista estilo "Control de Inventario": dashboard con gráficas o tabla detalle.
    const [vistaActiva, setVistaActiva] =
        useState("dashboard");

    // Incrementar para forzar la recarga de datos con el botón Actualizar.
    const [versionRecarga, setVersionRecarga] =
        useState(0);

    const tiieNumero = useMemo(
        () => numeroSeguro(tiie),
        [tiie]
    );

    const spreadBaseNumero = useMemo(
        () => numeroSeguro(spreadBase),
        [spreadBase]
    );

    const reglaPenetracion = useMemo(
        () =>
            obtenerReglaPenetracion(
                penetracionRetail
            ),
        [penetracionRetail]
    );

    const spreadEfectivo = useMemo(
        () =>
            spreadBaseNumero +
            reglaPenetracion.descuentoWholesale,
        [
            spreadBaseNumero,
            reglaPenetracion.descuentoWholesale,
        ]
    );

    const tasaAnual = useMemo(
        () => tiieNumero + spreadEfectivo,
        [tiieNumero, spreadEfectivo]
    );

    const agenciaActual = useMemo(() => {
        return filtrosDisponibles.agencias.find(
            (agencia) =>
                String(agencia.codigo) ===
                String(agenciaSeleccionada)
        );
    }, [
        filtrosDisponibles.agencias,
        agenciaSeleccionada,
    ]);

    const esAgenciaCordoba = useMemo(() => {
        const nombre = normalizarTexto(
            agenciaActual?.nombre
        );

        return nombre.includes("CORDOBA");
    }, [agenciaActual]);

    useEffect(() => {
        apiInventario
            .getFiltros()
            .then(setFiltrosDisponibles)
            .catch(() =>
                setFiltrosDisponibles({
                    agencias: [],
                    estatus: [],
                })
            );
    }, []);

    useEffect(() => {
        const params = {
            agencia:
                agenciaSeleccionada || undefined,

            estatus:
                estatusSeleccionado || undefined,

            modelos:
                modelosComerciales
                    ? MODELOS_COMERCIALES.join(",")
                    : undefined,

            condicion:
                condicionInventario,
        };

        /*
         * Este endpoint lo dejamos sin condición porque sirve
         * para comparar Nuevo vs Usado.
         */
        const paramsNuevoUsado = {
            agencia:
                agenciaSeleccionada || undefined,

            estatus:
                estatusSeleccionado || undefined,

            modelos:
                modelosComerciales
                    ? MODELOS_COMERCIALES.join(",")
                    : undefined,
        };

        setCargando(true);
        setError("");

        Promise.all([
            apiInventario.getPorAgencia(params),
            apiInventario.getPorEstatus(params),
            apiInventario.getPorMarca(params),

            apiInventario.getNuevoUsado(
                paramsNuevoUsado
            ),

            apiInventario.getNacionalImportado(
                params
            ),

            apiInventario.getCosto(params),

            apiInventario.getAntiguedad(params),
        ])
            .then(
                ([
                    agencia,
                    estatus,
                    marca,
                    nu,
                    ni,
                    costo,
                    antig,
                ]) => {
                    setPorAgencia(agencia);

                    setPorEstatus(
                        estatus.filter(
                            (item) =>
                                !ESTATUS_EXCLUIDOS.includes(
                                    item.estatus
                                )
                        )
                    );

                    setPorMarca(
                        marca.slice(0, 13)
                    );

                    setNuevoUsado(
                        nu.filter(
                            (item) =>
                                item.condicion === "Nuevo" ||
                                item.condicion === "Usado"
                        )
                    );

                    setNacionalImportado(ni);

                    setCostoTotal(costo);

                    setAntiguedad(antig);
                }
            )
            .catch(() =>
                setError(
                    "No se pudo cargar el inventario."
                )
            )
            .finally(() =>
                setCargando(false)
            );

        setCargandoTabla(true);
        setErrorTabla("");

        apiInventario
            .getInventario(params)
            .then((data) => {
                const vehiculosActivos =
                    data.filter(
                        (vehiculo) =>
                            !ESTATUS_EXCLUIDOS.includes(
                                (
                                    vehiculo.StEstoque || ""
                                ).trim()
                            )
                    );

                setVehiculos(
                    vehiculosActivos
                );
            })
            .catch(() =>
                setErrorTabla(
                    "No se pudo cargar el listado."
                )
            )
            .finally(() =>
                setCargandoTabla(false)
            );
    }, [
        agenciaSeleccionada,
        estatusSeleccionado,
        modelosComerciales,
        condicionInventario,
        versionRecarga,
    ]);

    // Pills de concesionarios para el banner oscuro.
    const agenciasPills = useMemo(() => {
        const ags = filtrosDisponibles.agencias || [];

        return [
            {
                id: "todas",
                label: "Todas las agencias",
                click: () => {
                    setAgenciaSeleccionada("");
                    setModelosComerciales(false);
                },
            },
            {
                id: "comerciales",
                label: "R&R Vehículos Comerciales",
                click: () => {
                    setAgenciaSeleccionada("");
                    setModelosComerciales(true);
                },
            },
            ...ags.map((agencia) => ({
                id: agencia.codigo,
                label: agencia.nombre,
                click: () => {
                    setModelosComerciales(false);
                    setAgenciaSeleccionada(agencia.codigo);
                },
            })),
        ];
    }, [filtrosDisponibles.agencias]);

    const unidadesNacional = useMemo(() => {
        const fila = (nacionalImportado || []).find((item) =>
            String(item.tipoNombre || "")
                .toLowerCase()
                .includes("nacional")
        );

        return fila ? numeroSeguro(fila.total) : 0;
    }, [nacionalImportado]);

    const unidadesImportado = useMemo(() => {
        const fila = (nacionalImportado || []).find(
            (item) =>
                !String(item.tipoNombre || "")
                    .toLowerCase()
                    .includes("nacional")
        );

        return fila ? numeroSeguro(fila.total) : 0;
    }, [nacionalImportado]);

    const vehiculosCalculados = useMemo(
        () =>
            vehiculos.map((vehiculo) =>
                calcularFinanciamientoVehiculo(
                    vehiculo,
                    periodoGracia,
                    tasaAnual
                )
            ),
        [vehiculos, periodoGracia, tasaAnual]
    );

    const totalGeneral =
        vehiculosCalculados.length;

    const costoFinancieroTotal = useMemo(
        () =>
            vehiculosCalculados.reduce(
                (total, vehiculo) =>
                    total +
                    numeroSeguro(
                        vehiculo.costoFinancieroTotal
                    ),
                0
            ),
        [vehiculosCalculados]
    );

    const unidadesFueraGracia = useMemo(
        () =>
            vehiculosCalculados.filter(
                (vehiculo) =>
                    numeroSeguro(
                        vehiculo.diasFueraGracia
                    ) > 0
            ).length,
        [vehiculosCalculados]
    );

    const agenciaLider = useMemo(() => {
        if (!porAgencia.length) {
            return null;
        }

        return [...porAgencia].sort(
            (a, b) => b.total - a.total
        )[0];
    }, [porAgencia]);

    const pctNuevo = useMemo(() => {
        const total = nuevoUsado.reduce(
            (acumulado, item) =>
                acumulado + item.total,
            0
        );

        const nuevos = nuevoUsado
            .filter(
                (item) =>
                    item.condicion === "Nuevo"
            )
            .reduce(
                (acumulado, item) =>
                    acumulado + item.total,
                0
            );

        return total > 0
            ? Math.round((nuevos / total) * 100)
            : 0;
    }, [nuevoUsado]);

    const costoDiarioTotal = useMemo(
        () =>
            vehiculosCalculados.reduce(
                (total, vehiculo) =>
                    total +
                    numeroSeguro(
                        vehiculo.costoFinancieroDiario
                    ),
                0
            ),
        [vehiculosCalculados]
    );

    // Detalle por agencia para las barras delgadas estilo "Costo por Concesionario".
    const costosPorAgenciaDetalle = useMemo(() => {
        const agrupado = {};

        vehiculosCalculados.forEach((vehiculo) => {
            const familia = String(vehiculo.NmFamilia || "").trim().toUpperCase();
            const esVehiculoComercial =
                MODELOS_COMERCIALES.some((modelo) =>
                    familia.includes(modelo.toUpperCase())
                );

            const agencia = esVehiculoComercial
                ? "R&R VC"
                : vehiculo.agenciaNombre || "Sin agencia";

            if (!agrupado[agencia]) {
                agrupado[agencia] = {
                    agencia,
                    totalFinanciero: 0,
                    totalDiario: 0,
                    unidades: 0,
                    vehiculosFuera: 0,
                };
            }

            agrupado[agencia].totalFinanciero += numeroSeguro(
                vehiculo.costoFinancieroTotal
            );
            agrupado[agencia].totalDiario += numeroSeguro(
                vehiculo.costoFinancieroDiario
            );
            agrupado[agencia].unidades += 1;

            if (
                numeroSeguro(
                    vehiculo.diasFueraGracia
                ) > 0
            ) {
                agrupado[agencia].vehiculosFuera += 1;
            }
        });

        const lista = Object.values(agrupado).sort(
            (a, b) => b.totalFinanciero - a.totalFinanciero
        );
        const maxFinanciero = Math.max(
            1,
            ...lista.map((item) => item.totalFinanciero)
        );

        return { lista, maxFinanciero };
    }, [vehiculosCalculados]);

    const eventosModelo = useMemo(
        () => ({
            click: (params) => {
                setFamiliaFiltro((actual) =>
                    actual.toLowerCase() ===
                        params.name.toLowerCase()
                        ? ""
                        : params.name
                );

                // La tabla vive en la vista detalle: cambiar a detalle y desplazar.
                setVistaActiva("detalle");

                setTimeout(() => {
                    tablaRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 150);
            },
        }),
        []
    );

    const costosPorAgencia = useMemo(() => {
        const agrupado = {};

        vehiculosCalculados.forEach((vehiculo) => {
            const familia = String(vehiculo.NmFamilia || "").trim().toUpperCase();
            const esVehiculoComercial =
                MODELOS_COMERCIALES.some((modelo) =>
                    familia.includes(modelo.toUpperCase())
                );

            // Los modelos comerciales se consideran una agencia virtual.
            const agencia = esVehiculoComercial
                ? "Vehiculos Comerciales"
                : vehiculo.agenciaNombre || "Sin agencia";

            if (!agrupado[agencia]) {
                agrupado[agencia] = {
                    agencia,
                    total: 0,
                    vehiculosFuera: 0,
                };
            }

            agrupado[agencia].total += numeroSeguro(
                vehiculo.costoFinancieroTotal
            );

            if (
                numeroSeguro(
                    vehiculo.diasFueraGracia
                ) > 0
            ) {
                agrupado[agencia].vehiculosFuera += 1;
            }
        });

        return Object.values(agrupado)
            .filter((item) => item.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [vehiculosCalculados]);

    const optionCostoFinancieroAgencia =
        useMemo(() => {
            if (!costosPorAgencia.length) {
                return null;
            }

            return {
                tooltip: {
                    trigger: "axis",
                    axisPointer: {
                        type: "none",
                    },
                    backgroundColor: "#FFFFFF",
                    borderColor: `${BRAND_BLUE}22`,
                    borderWidth: 1,
                    textStyle: {
                        color: BRAND_BLUE,
                        fontSize: 12,
                    },
                    formatter: (params) => {
                        const item = params[0];
                        const detalle =
                            costosPorAgencia[
                            item.dataIndex
                            ];

                        return `
              <b>${item.name}</b><br/>
              Costo financiero: <b>${formatMoneda(
                            item.value
                        )}</b><br/>
              Fuera de gracia: <b>${detalle.vehiculosFuera
                            } vehículos</b>
            `;
                    },
                },
                grid: {
                    left: 8,
                    right: 20,
                    top: 15,
                    bottom: 10,
                    containLabel: true,
                },
                xAxis: {
                    type: "category",
                    data: costosPorAgencia.map(
                        (item) => item.agencia
                    ),
                    axisLine: {
                        lineStyle: {
                            color: `${BRAND_BLUE}22`,
                        },
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        color: `${BRAND_BLUE}BB`,
                        fontSize: 11,
                    },
                },
                yAxis: {
                    type: "value",
                    splitLine: {
                        lineStyle: {
                            color: `${BRAND_BLUE}10`,
                            type: "dashed",
                        },
                    },
                    axisLabel: {
                        color: `${BRAND_BLUE}88`,
                        fontSize: 10,
                        formatter: (valor) =>
                            `$${(
                                valor / 1000
                            ).toFixed(0)}k`,
                    },
                },
                series: [
                    {
                        name: "Costo financiero",
                        type: "bar",
                        barWidth: "45%",
                        data: costosPorAgencia.map(
                            (item, index) => ({
                                value: item.total,
                                itemStyle: {
                                    color:
                                        COLORES[
                                        index %
                                        COLORES.length
                                        ],
                                    borderRadius: [
                                        6, 6, 0, 0,
                                    ],
                                },
                            })
                        ),
                        label: {
                            show: true,
                            position: "top",
                            color: BRAND_BLUE,
                            fontSize: 10,
                            fontWeight: 600,
                            formatter: (params) =>
                                `$${(
                                    params.value / 1000
                                ).toFixed(0)}k`,
                        },
                    },
                ],
            };
        }, [costosPorAgencia]);

    const optionPorAgencia = useMemo(() => {
        if (!porAgencia.length) {
            return null;
        }

        const sorted = [...porAgencia].sort(
            (a, b) => b.total - a.total
        );

        return {
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "none",
                },
                backgroundColor: "#FFFFFF",
                borderColor: `${BRAND_BLUE}22`,
                borderWidth: 1,
                textStyle: {
                    color: BRAND_BLUE,
                    fontSize: 12,
                },
                formatter: (params) => {
                    const item = params[0];

                    const porcentaje =
                        totalGeneral > 0
                            ? (
                                (item.value /
                                    totalGeneral) *
                                100
                            ).toFixed(1)
                            : 0;

                    return `
            <b>${item.name}</b><br/>
            Vehículos: <b>${item.value.toLocaleString(
                        "es-MX"
                    )}</b><br/>
            ${porcentaje}% del total
          `;
                },
            },
            grid: {
                left: 8,
                right: 16,
                top: 20,
                bottom: 8,
                containLabel: true,
            },
            xAxis: {
                type: "category",
                data: sorted.map(
                    (item) => item.agenciaNombre
                ),
                axisLine: {
                    lineStyle: {
                        color: `${BRAND_BLUE}22`,
                    },
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    color: `${BRAND_BLUE}BB`,
                    fontSize: 11,
                    fontWeight: 500,
                },
            },
            yAxis: {
                type: "value",
                splitLine: {
                    lineStyle: {
                        color: `${BRAND_BLUE}10`,
                        type: "dashed",
                    },
                },
                axisLabel: {
                    color: `${BRAND_BLUE}88`,
                    fontSize: 10,
                    formatter: (valor) =>
                        valor.toLocaleString("es-MX"),
                },
            },
            series: [
                {
                    name: "Vehículos",
                    type: "bar",
                    barWidth: "45%",
                    data: sorted.map(
                        (item, index) => ({
                            value: item.total,
                            itemStyle: {
                                color:
                                    PALETA_AGENCIAS[
                                    index %
                                    PALETA_AGENCIAS.length
                                    ],
                                borderRadius: [
                                    6, 6, 0, 0,
                                ],
                            },
                        })
                    ),
                    label: {
                        show: true,
                        position: "top",
                        color: BRAND_BLUE,
                        fontSize: 11,
                        fontWeight: 600,
                        formatter: (params) =>
                            params.value.toLocaleString(
                                "es-MX"
                            ),
                    },
                },
            ],
        };
    }, [porAgencia, totalGeneral]);

    const optionPorEstatus = useMemo(() => {
        if (!porEstatus.length) {
            return null;
        }

        return {
            tooltip: {
                trigger: "item",
                backgroundColor: "#FFFFFF",
                borderColor: `${BRAND_BLUE}22`,
                borderWidth: 1,
                textStyle: {
                    color: BRAND_BLUE,
                    fontSize: 12,
                },
                formatter: (params) =>
                    `<b>${params.name}</b><br/>${params.value.toLocaleString(
                        "es-MX"
                    )} vehículos<br/><b>${params.percent
                    }%</b>`,
            },
            legend: {
                bottom: 0,
                textStyle: {
                    color: `${BRAND_BLUE}BB`,
                    fontSize: 11,
                },
                icon: "circle",
                itemWidth: 8,
                itemHeight: 8,
                itemGap: 12,
            },
            color: PALETA_ESTATUS,
            series: [
                {
                    name: "Estatus",
                    type: "pie",
                    radius: ["50%", "75%"],
                    center: ["50%", "42%"],
                    itemStyle: {
                        borderColor: "#FFFFFF",
                        borderWidth: 3,
                    },
                    label: {
                        show: true,
                        color: BRAND_BLUE,
                        fontSize: 11,
                        formatter: "{b}\n{d}%",
                    },
                    emphasis: {
                        scaleSize: 5,
                    },
                    data: porEstatus.map(
                        (item) => ({
                            name: item.estatusNombre,
                            value: item.total,
                        })
                    ),
                },
            ],
        };
    }, [porEstatus]);

    const optionPorMarca = useMemo(() => {
        if (!porMarca.length) {
            return null;
        }

        const datos = [...porMarca].reverse();

        return {
            tooltip: {
                trigger: "axis",
                axisPointer: {
                    type: "none",
                },
                backgroundColor: "#FFFFFF",
                borderColor: `${BRAND_BLUE}22`,
                borderWidth: 1,
                textStyle: {
                    color: BRAND_BLUE,
                    fontSize: 12,
                },
                formatter: (params) =>
                    `<b>${params[0].name}</b><br/>Vehículos: <b>${params[0].value.toLocaleString(
                        "es-MX"
                    )}</b>`,
            },
            grid: {
                left: 8,
                right: 80,
                top: 12,
                bottom: 12,
                containLabel: true,
            },
            xAxis: {
                type: "value",
                splitLine: {
                    lineStyle: {
                        color: `${BRAND_BLUE}10`,
                        type: "dashed",
                    },
                },
                axisLabel: {
                    color: `${BRAND_BLUE}88`,
                    fontSize: 10,
                },
            },
            yAxis: {
                type: "category",
                data: datos.map(
                    (item) => item.familia
                ),
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    color: BRAND_BLUE,
                    fontSize: 11,
                    fontWeight: 500,
                },
            },
            series: [
                {
                    name: "Vehículos",
                    type: "bar",
                    data: datos.map(
                        (item, index) => {
                            const activo =
                                familiaFiltro &&
                                item.familia.toLowerCase() ===
                                familiaFiltro.toLowerCase();

                            const inactivo =
                                familiaFiltro && !activo;

                            return {
                                value: item.total,
                                itemStyle: {
                                    color: inactivo
                                        ? `${BRAND_BLUE}33`
                                        : COLORES[
                                        index %
                                        COLORES.length
                                        ],
                                    borderRadius: [
                                        0, 6, 6, 0,
                                    ],
                                    opacity: inactivo
                                        ? 0.4
                                        : 1,
                                },
                            };
                        }
                    ),
                    barWidth: "60%",
                    label: {
                        show: true,
                        position: "right",
                        color: BRAND_BLUE,
                        fontSize: 11,
                        fontWeight: 600,
                        formatter: (params) =>
                            params.value.toLocaleString(
                                "es-MX"
                            ),
                    },
                    cursor: "pointer",
                },
            ],
        };
    }, [porMarca, familiaFiltro]);

    const optionNuevoUsado =
        useMemo(() => {
            if (!nuevoUsado.length) {
                return null;
            }

            const agencias = [
                ...new Set(
                    nuevoUsado.map(
                        (item) => item.agenciaNombre
                    )
                ),
            ];

            const condiciones = [
                "Nuevo",
                "Usado",
            ];

            const series = condiciones.map(
                (condicion) => ({
                    name: condicion,
                    type: "bar",
                    stack: "total",
                    data: agencias.map((agencia) => {
                        const fila =
                            nuevoUsado.find(
                                (item) =>
                                    item.agenciaNombre ===
                                    agencia &&
                                    item.condicion ===
                                    condicion
                            );

                        return fila ? fila.total : 0;
                    }),
                    itemStyle: {
                        color:
                            PALETA_CONDICION[
                            condicion
                            ] ||
                            PALETA_CONDICION.default,
                        borderRadius:
                            condicion === "Usado"
                                ? [6, 6, 0, 0]
                                : [0, 0, 0, 0],
                    },
                    barWidth: "45%",
                    label: {
                        show: true,
                        color: "#FFFFFF",
                        fontSize: 10,
                        fontWeight: 600,
                        formatter: (params) =>
                            params.value > 0
                                ? params.value.toLocaleString(
                                    "es-MX"
                                )
                                : "",
                    },
                })
            );

            return {
                tooltip: {
                    trigger: "axis",
                    axisPointer: {
                        type: "none",
                    },
                    backgroundColor: "#FFFFFF",
                    borderColor:
                        `${BRAND_BLUE}22`,
                    borderWidth: 1,
                    textStyle: {
                        color: BRAND_BLUE,
                        fontSize: 12,
                    },
                },
                legend: {
                    top: 0,
                    textStyle: {
                        color: `${BRAND_BLUE}BB`,
                        fontSize: 11,
                    },
                    icon: "circle",
                    itemWidth: 8,
                    itemHeight: 8,
                },
                grid: {
                    left: 8,
                    right: 16,
                    top: 32,
                    bottom: 8,
                    containLabel: true,
                },
                xAxis: {
                    type: "category",
                    data: agencias,
                    axisLine: {
                        lineStyle: {
                            color: `${BRAND_BLUE}22`,
                        },
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        color: `${BRAND_BLUE}BB`,
                        fontSize: 11,
                    },
                },
                yAxis: {
                    type: "value",
                    splitLine: {
                        lineStyle: {
                            color: `${BRAND_BLUE}10`,
                            type: "dashed",
                        },
                    },
                    axisLabel: {
                        color: `${BRAND_BLUE}88`,
                        fontSize: 10,
                    },
                },
                series,
            };
        }, [nuevoUsado]);

    const optionNacionalImportado =
        useMemo(() => {
            if (!nacionalImportado.length) {
                return null;
            }

            return {
                tooltip: {
                    trigger: "item",
                    backgroundColor: "#FFFFFF",
                    borderColor:
                        `${BRAND_BLUE}22`,
                    borderWidth: 1,
                    textStyle: {
                        color: BRAND_BLUE,
                        fontSize: 12,
                    },
                    formatter: (params) =>
                        `<b>${params.name}</b><br/>${params.value.toLocaleString(
                            "es-MX"
                        )} vehículos<br/><b>${params.percent
                        }%</b>`,
                },
                legend: {
                    bottom: 0,
                    textStyle: {
                        color: `${BRAND_BLUE}BB`,
                        fontSize: 11,
                    },
                    icon: "circle",
                    itemWidth: 8,
                    itemHeight: 8,
                },
                color: [
                    BRAND_BLUE,
                    COLORES[7],
                ],
                series: [
                    {
                        name: "Origen",
                        type: "pie",
                        radius: ["45%", "70%"],
                        center: ["50%", "42%"],
                        itemStyle: {
                            borderColor: "#FFFFFF",
                            borderWidth: 3,
                        },
                        label: {
                            show: true,
                            color: BRAND_BLUE,
                            fontSize: 11,
                            formatter: "{b}\n{d}%",
                        },
                        emphasis: {
                            scaleSize: 5,
                        },
                        data: nacionalImportado.map(
                            (item) => ({
                                name: item.tipoNombre,
                                value: item.total,
                            })
                        ),
                    },
                ],
            };
        }, [nacionalImportado]);

    const optionAntiguedad =
        useMemo(() => {
            if (!antiguedad.length) {
                return null;
            }

            const orden = [
                "+120",
                "91-120",
                "61-90",
                "31-60",
                "0-30",
            ];

            const datos = orden.map(
                (rango) =>
                    antiguedad.find(
                        (item) =>
                            item.rango === rango
                    ) ?? {
                        rango,
                        total: 0,
                    }
            );

            return {
                tooltip: {
                    trigger: "axis",
                    axisPointer: {
                        type: "none",
                    },
                    backgroundColor: "#FFFFFF",
                    borderColor:
                        `${BRAND_BLUE}22`,
                    borderWidth: 1,
                    textStyle: {
                        color: BRAND_BLUE,
                        fontSize: 12,
                    },
                    formatter: (params) =>
                        `<b>${params[0].name} días</b><br/>Vehículos: <b>${params[0].value.toLocaleString(
                            "es-MX"
                        )}</b>`,
                },
                grid: {
                    left: 8,
                    right: 60,
                    top: 8,
                    bottom: 8,
                    containLabel: true,
                },
                xAxis: {
                    type: "value",
                    splitLine: {
                        lineStyle: {
                            color: `${BRAND_BLUE}10`,
                            type: "dashed",
                        },
                    },
                    axisLabel: {
                        color: `${BRAND_BLUE}88`,
                        fontSize: 10,
                    },
                },
                yAxis: {
                    type: "category",
                    data: datos.map(
                        (item) => item.rango
                    ),
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        color: BRAND_BLUE,
                        fontSize: 12,
                        fontWeight: 600,
                    },
                },
                series: [
                    {
                        name: "Vehículos",
                        type: "bar",
                        data: datos.map(
                            (item, index) => ({
                                value: item.total,
                                itemStyle: {
                                    color:
                                        COLORES[
                                        index %
                                        COLORES.length
                                        ],
                                    borderRadius: [
                                        0, 6, 6, 0,
                                    ],
                                },
                            })
                        ),
                        barWidth: "55%",
                        label: {
                            show: true,
                            position: "right",
                            color: BRAND_BLUE,
                            fontSize: 12,
                            fontWeight: 600,
                            formatter: (params) =>
                                params.value > 0
                                    ? params.value.toLocaleString(
                                        "es-MX"
                                    )
                                    : "",
                        },
                    },
                ],
            };
        }, [antiguedad]);

    const fileStamp = () => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
    };

    const condLabelExport = (condicion) =>
    ({
        N: "Nuevo",
        U: "Usado",
    }[(condicion || "").trim()] ??
        condicion ??
        "—");

    const nombreBaseInventario = () =>
        `Inventario_Usados_${agenciaActual?.nombre || "Todas"}_${estatusSeleccionado || "Todos"}_${condicionInventario === "N" ? "Nuevos" : condicionInventario === "U" ? "Usados" : "Todos"}_${fileStamp()}`;

    const filasVehiculosExport = () =>
        (vehiculosCalculados || []).map((vehiculo) => ({
            VIN: vehiculo.NrChassi || "—",
            Familia: vehiculo.NmFamilia || "—",
            Modelo: vehiculo.EdiModelo || "—",
            Agencia: vehiculo.agenciaNombre || "—",
            Condición: condLabelExport(vehiculo.CondUso),
            Estatus: vehiculo.estatusNombre || "—",
            "F. Factura": vehiculo.DtFaturamento || "—",
            "Antigüedad (días)": vehiculo.diasEnStock ?? "—",
            "Fuera de gracia (días)": vehiculo.diasFueraGracia ?? "—",
            "Valor Compra": vehiculo.VrNF_Compra != null ? formatMoneda(vehiculo.VrNF_Compra) : "—",
            "Costo Financiero Diario": vehiculo.costoFinancieroDiario != null ? formatMoneda(vehiculo.costoFinancieroDiario) : "—",
            "Costo Financiero Total": vehiculo.costoFinancieroTotal != null ? formatMoneda(vehiculo.costoFinancieroTotal) : "—",
            Situación: vehiculo.SitVeiculo || "—",
        }));

    const capturarReporteVisual = async () => {
        if (!reporteRef.current) throw new Error("No se encontró el contenido visual del reporte.");

        await esperarRenderCompleto();

        const canvas = await html2canvas(reporteRef.current, {
            scale: 1.5,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            logging: false,
            windowWidth: 1440,
            scrollX: 0,
            scrollY: 0,
            onclone: (documentoClonado) => {
                const clon = documentoClonado.getElementById("reporte-inventario-usados-exportacion");
                if (clon) {
                    clon.style.position = "absolute";
                    clon.style.left = "0";
                    clon.style.top = "0";
                    clon.style.zIndex = "0";
                }
            },
        });

        if (!canvas.width || !canvas.height) throw new Error("No fue posible capturar las gráficas.");
        return canvas;
    };

    const exportarExcelInventario = async () => {
        if (!vehiculosCalculados || vehiculosCalculados.length === 0) {
            alert("No hay vehículos para exportar con los filtros actuales.");
            return;
        }

        try {
            let canvas = null;
            try {
                canvas = await capturarReporteVisual();
            } catch (errCaptura) {
                console.warn("No se pudo capturar el contenido visual:", errCaptura);
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = "CRM Grupo Automotriz R&R";
            workbook.lastModifiedBy = "CRM Grupo Automotriz R&R";
            workbook.created = new Date();
            workbook.modified = new Date();
            workbook.subject = "Reporte de Inventario - Autos Usados";
            workbook.title = "Reporte de Inventario - Autos Usados";

            // ── Hoja Resumen ──
            const hojaResumen = workbook.addWorksheet("Resumen", {
                views: [{ showGridLines: false }],
                pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
            });
            hojaResumen.columns = [{ width: 26 }, { width: 34 }, { width: 4 }, { width: 26 }, { width: 34 }];

            hojaResumen.mergeCells("A1:E2");
            const cTitulo = hojaResumen.getCell("A1");
            cTitulo.value = "Reporte de Inventario - Autos Usados";
            cTitulo.font = { name: "Arial", size: 20, bold: true, color: { argb: "FFFFFFFF" } };
            cTitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
            cTitulo.alignment = { vertical: "middle", horizontal: "left" };
            hojaResumen.getRow(1).height = 24;
            hojaResumen.getRow(2).height = 16;

            hojaResumen.mergeCells("A3:E3");
            hojaResumen.getCell("A3").value = `Generado: ${new Date().toLocaleString("es-MX")}`;
            hojaResumen.getCell("A3").font = { italic: true, color: { argb: "FF6B7280" } };

            hojaResumen.getCell("A5").value = "Filtros aplicados";
            hojaResumen.getCell("A5").font = { bold: true, size: 13, color: { argb: "FF131E5C" } };

            const filtros = [
                ["Agencia", agenciaActual?.nombre || "Todas las agencias"],
                ["Estatus", estatusSeleccionado || "Todos los estatus"],
                ["Condición", condicionInventario === "N" ? "Nuevos" : condicionInventario === "U" ? "Usados" : "Todos"],
                ["Periodo de gracia", `${periodoGracia} días`],
            ];
            filtros.forEach(([etiqueta, valor], indice) => {
                const fila = 6 + indice;
                hojaResumen.getCell(`A${fila}`).value = etiqueta;
                hojaResumen.getCell(`A${fila}`).font = { bold: true, color: { argb: "FF374151" } };
                hojaResumen.getCell(`B${fila}`).value = valor;
                hojaResumen.mergeCells(`B${fila}:E${fila}`);
                hojaResumen.getCell(`B${fila}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                hojaResumen.getCell(`B${fila}`).alignment = { vertical: "middle" };
            });

            hojaResumen.getCell("A11").value = "Indicadores";
            hojaResumen.getCell("A11").font = { bold: true, size: 13, color: { argb: "FF131E5C" } };

            const kpis = [
                ["Total activo", totalGeneral.toLocaleString("es-MX")],
                ["Costo inventario", formatMoneda(costoTotal, 0)],
                ["Fuera de gracia", unidadesFueraGracia.toLocaleString("es-MX")],
                ["Costo financiero", formatMoneda(costoFinancieroTotal, 0)],
                ["Agencia líder", agenciaLider?.agenciaNombre || "—"],
                ["% Nuevos", `${pctNuevo}%`],
                ["Tasa aplicada (TIIE + Spread)", `${tasaAnual.toFixed(4)}%`],
            ];
            kpis.forEach(([etiqueta, valor], indice) => {
                const fila = 12 + indice;
                hojaResumen.getCell(`A${fila}`).value = etiqueta;
                hojaResumen.getCell(`A${fila}`).font = { bold: true, color: { argb: "FF374151" } };
                hojaResumen.getCell(`B${fila}`).value = valor;
                hojaResumen.mergeCells(`B${fila}:E${fila}`);
                hojaResumen.getCell(`B${fila}`).font = { bold: true, color: { argb: "FF131E5C" } };
                hojaResumen.getCell(`B${fila}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
            });

            // ── Hoja Detalle (todo el contenido, sin paginación) ──
            const hojaDatos = workbook.addWorksheet("Detalle", {
                views: [{ state: "frozen", ySplit: 1 }],
                pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
            });
            const registros = filasVehiculosExport();
            const claves = Object.keys(registros[0] || {});
            hojaDatos.columns = claves.map((clave) => ({ key: clave, width: Math.min(45, Math.max(14, clave.length + 6)) }));
            registros.forEach((registro) => hojaDatos.addRow(registro));
            hojaDatos.getRow(1).eachCell((celda) => {
                celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
                celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
                celda.alignment = { horizontal: "center" };
            });
            hojaDatos.headerFooter.oddHeader = "&L&16&BInventario de Autos Usados&R&D";
            hojaDatos.headerFooter.oddFooter = "&LCRM Grupo Automotriz R&R&RPágina &P de &N";

            // ── Hoja Gráficas (captura visual) ──
            if (canvas) {
                const hojaGraficas = workbook.addWorksheet("Gráficas", {
                    views: [{ showGridLines: false, zoomScale: 70 }],
                    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
                });
                const base64 = canvas.toDataURL("image/png");
                const imageId = workbook.addImage({ base64, extension: "png" });
                const ancho = 1200;
                const alto = Math.round((canvas.height / canvas.width) * ancho);
                hojaGraficas.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: ancho, height: alto } });
                for (let i = 1; i <= 18; i += 1) hojaGraficas.getColumn(i).width = 11;
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const archivo = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            descargarBlob(archivo, `${nombreBaseInventario()}.xlsx`);
        } catch (error) {
            console.error("Error exportando inventario a Excel:", error);
            alert("No se pudo generar el Excel. Revisa la consola.");
        }
    };

    const exportarPdfInventario = async () => {
        if (!vehiculosCalculados || vehiculosCalculados.length === 0) {
            alert("No hay vehículos para exportar con los filtros actuales.");
            return;
        }

        try {
            let canvas = null;
            try {
                canvas = await capturarReporteVisual();
            } catch (errCaptura) {
                console.warn("No se pudo capturar el contenido visual:", errCaptura);
            }

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
                compress: true,
            });
            doc.setProperties({
                title: "Reporte de Inventario - Autos Usados",
                subject: "Reporte de inventario con gráficas y detalle completo",
                author: "CRM Grupo Automotriz R&R",
                creator: "CRM Grupo Automotriz R&R",
            });

            if (canvas) {
                agregarCanvasPaginadoPdf(doc, canvas);
            }

            const headers = [
                "VIN", "Familia", "Modelo", "Agencia", "Condición", "Estatus",
                "F. Factura", "Antigüedad", "Fuera gracia", "Valor Compra",
                "Costo diario", "Costo financiero", "Situación"
            ];

            const body = (vehiculosCalculados || []).map((vehiculo) => [
                vehiculo.NrChassi || "—",
                vehiculo.NmFamilia || "—",
                vehiculo.EdiModelo || "—",
                vehiculo.agenciaNombre || "—",
                condLabelExport(vehiculo.CondUso),
                vehiculo.estatusNombre || "—",
                vehiculo.DtFaturamento || "—",
                vehiculo.diasEnStock ?? "—",
                vehiculo.diasFueraGracia ?? "—",
                vehiculo.VrNF_Compra != null ? formatMoneda(vehiculo.VrNF_Compra) : "—",
                vehiculo.costoFinancieroDiario != null ? formatMoneda(vehiculo.costoFinancieroDiario) : "—",
                vehiculo.costoFinancieroTotal != null ? formatMoneda(vehiculo.costoFinancieroTotal) : "—",
                vehiculo.SitVeiculo || "—",
            ]);

            doc.addPage("a4", "landscape");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(19, 30, 92);
            doc.text(
                `Detalle completo (${vehiculosCalculados.length.toLocaleString("es-MX")} vehículos) · ${agenciaActual?.nombre || "Todas las agencias"} · ${estatusSeleccionado || "Todos los estatus"}`,
                10,
                12
            );

            autoTable(doc, {
                startY: 17,
                head: [headers],
                body,
                theme: "grid",
                styles: {
                    font: "helvetica",
                    fontSize: 6,
                    cellPadding: 1.2,
                    overflow: "linebreak",
                    valign: "middle",
                    textColor: [55, 65, 81],
                    lineColor: [229, 231, 235],
                    lineWidth: 0.15,
                },
                headStyles: {
                    fillColor: [19, 30, 92],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    halign: "center",
                },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                margin: { left: 8, right: 8, bottom: 10 },
                didDrawPage: () => {
                    const ancho = doc.internal.pageSize.getWidth();
                    const alto = doc.internal.pageSize.getHeight();
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(7);
                    doc.setTextColor(107, 114, 128);
                    doc.text(`Página ${doc.getNumberOfPages()}`, ancho - 22, alto - 4);
                },
            });

            doc.save(`${nombreBaseInventario()}.pdf`);
        } catch (error) {
            console.error("Error exportando inventario a PDF:", error);
            alert("No se pudo generar el PDF. Revisa la consola.");
        }
    };

    return (
        <div className="inventario-page min-h-screen bg-[#F8FAFC] text-[14px] text-[#1A2344]">
            <main className="space-y-4 px-1 py-3 sm:px-2">
                {/* BARRA SUPERIOR: título + vista + exportar + actualizar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#001E50]">
                            Control de Inventario
                        </h1>
                        <p className="text-xs font-semibold text-slate-500">
                            Autos usados · {agenciaActual?.nombre || "Todas las agencias"}
                            {estatusSeleccionado ? ` · ${estatusSeleccionado}` : ""}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-xl border border-[#001E50]/20 bg-white p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setVistaActiva("dashboard")}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "dashboard"
                                    ? "bg-[#001E50] text-white shadow"
                                    : "text-[#001E50] hover:bg-slate-100"
                                    }`}
                            >
                                <BarChart3 className="h-3.5 w-3.5" /> Gráficos
                            </button>

                            <button
                                type="button"
                                onClick={() => setVistaActiva("detalle")}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "detalle"
                                    ? "bg-[#001E50] text-white shadow"
                                    : "text-[#001E50] hover:bg-slate-100"
                                    }`}
                            >
                                <Table2 className="h-3.5 w-3.5" /> Tabla Detalle
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={exportarExcelInventario}
                            disabled={!vehiculosCalculados.length}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Excel
                        </button>

                        <button
                            type="button"
                            onClick={exportarPdfInventario}
                            disabled={!vehiculosCalculados.length}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            PDF
                        </button>

                        <button
                            type="button"
                            onClick={() => setVersionRecarga((v) => v + 1)}
                            disabled={cargando || cargandoTabla}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#001E50]/20 bg-white px-3 text-xs font-bold text-[#001E50] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                        >
                            {cargando || cargandoTabla ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Actualizar
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
                                    VOLKSWAGEN AUTOMOTRIZ R&R · CONTROL FÍSICO Y FINANCIERO DE UNIDADES USADAS
                                </p>

                                <h2 className="mt-0.5 text-2xl font-black tracking-tight text-white">
                                    Dashboard de Inventario
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                    Tasa Aplicada:{" "}
                                    <strong className="text-sky-300">
                                        {tasaAnual.toFixed(4)}%
                                    </strong>{" "}
                                    (TIIE + Spread)
                                </span>
                            </div>
                        </div>

                        {/* FILA 1 */}
                        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
                            <div className="pt-2 lg:px-3 lg:pt-0 lg:first:pl-0 lg:last:pr-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    AGENCIA LÍDER
                                </span>

                                <span
                                    className="block truncate text-2xl font-black text-white"
                                    title={cargando ? "" : agenciaLider?.agenciaNombre || ""}
                                >
                                    {cargando ? "…" : agenciaLider?.agenciaNombre || "—"}
                                </span>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {agenciaLider
                                        ? `${agenciaLider.total.toLocaleString("es-MX")} vehículos`
                                        : "Sin datos"}
                                </p>
                            </div>

                            <div className="pt-2 lg:px-3 lg:pt-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    COSTO INVENTARIO
                                </span>

                                <span className="block text-2xl font-black text-white">
                                    {cargando ? "…" : formatMoneda(costoTotal, 0)}
                                </span>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Suma valor de compra
                                </p>
                            </div>

                            <div className="pt-2 lg:px-3 lg:pt-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    FUERA DE GRACIA
                                </span>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-amber-300">
                                        {cargandoTabla ? "…" : unidadesFueraGracia}
                                    </span>

                                    <span className="text-[10px] font-bold text-amber-200/80">
                                        uds.
                                    </span>
                                </div>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Más de {periodoGracia} días en stock
                                </p>
                            </div>

                            <div className="pt-2 lg:px-3 lg:pt-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    COSTO FINANCIERO
                                </span>

                                <span className="block text-2xl font-black text-emerald-400">
                                    {cargandoTabla ? "…" : formatMoneda(costoFinancieroTotal, 0)}
                                </span>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Costo acumulado actual
                                </p>
                            </div>
                        </div>

                        {/* FILA 2 */}
                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
                            <div className="pt-2 lg:px-3 lg:pt-0 lg:first:pl-0 lg:last:pr-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    % NUEVOS
                                </span>

                                <span className="block text-2xl font-black text-white">
                                    {cargando ? "…" : `${pctNuevo}%`}
                                </span>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Del total activo
                                </p>
                            </div>

                            <div className="pt-2 lg:px-3 lg:pt-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    TASA APLICADA
                                </span>

                                <span className="block text-2xl font-black text-sky-300">
                                    {tasaAnual.toFixed(4)}%
                                </span>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    TIIE + spread efectivo
                                </p>
                            </div>

                            <div className="pt-2 lg:px-3 lg:pt-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    PERIODO DE GRACIA
                                </span>

                                <span className="block text-2xl font-black text-white">
                                    {periodoGracia} días
                                </span>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Parámetro actual
                                </p>
                            </div>

                            <div className="pt-2 lg:px-3 lg:pt-0">
                                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300/80">
                                    TOTAL ACTIVO
                                </span>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-white">
                                        {cargandoTabla ? "…" : totalGeneral.toLocaleString("es-MX")}
                                    </span>

                                    <span className="text-[10px] font-bold text-slate-400">
                                        uds.
                                    </span>
                                </div>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Unidades en stock activo
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/30 px-5 py-2.5 backdrop-blur-md">
                        <span className="mr-2 text-[10px] font-black uppercase tracking-wider text-slate-300">
                            Concesionarios:
                        </span>

                        {agenciasPills.map((pill) => {
                            const activa =
                                pill.id === "todas"
                                    ? !agenciaSeleccionada && !modelosComerciales
                                    : pill.id === "comerciales"
                                        ? modelosComerciales
                                        : agenciaSeleccionada === pill.id && !modelosComerciales;

                            return (
                                <button
                                    key={pill.id}
                                    type="button"
                                    onClick={pill.click}
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

                {/* PARÁMETROS FINANCIEROS COMPACTOS */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 lg:grid-cols-12">
                        <div className="lg:col-span-3">
                            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Periodo de Gracia (Días)
                            </label>

                            <div className="flex gap-1.5">
                                {[30, 45, 60].map((dias) => (
                                    <button
                                        key={dias}
                                        type="button"
                                        onClick={() => setPeriodoGracia(dias)}
                                        className={`flex-1 rounded-lg border py-1 text-xs font-bold transition ${periodoGracia === dias
                                            ? "border-[#001E50] bg-[#001E50] text-white shadow-sm"
                                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        {dias}d
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Estatus
                            </label>

                            <select
                                value={estatusSeleccionado}
                                onChange={(e) => setEstatusSeleccionado(e.target.value)}
                                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-[#001E50] outline-none focus:border-[#1677FF]"
                            >
                                <option value="">Todos los estatus</option>

                                {filtrosDisponibles.estatus
                                    .filter((estatus) => !ESTATUS_EXCLUIDOS.includes(estatus.codigo))
                                    .map((estatus) => (
                                        <option key={estatus.codigo} value={estatus.codigo}>
                                            {estatus.nombre}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2 lg:col-span-6">
                            <div>
                                <label className="mb-0.5 block text-[9px] font-black uppercase text-slate-400">
                                    TIIE 28d
                                </label>

                                <input
                                    type="number"
                                    step="0.0001"
                                    value={tiie}
                                    onChange={(e) => setTiie(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-[#001E50] outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-0.5 block text-[9px] font-black uppercase text-slate-400">
                                    Spread
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    value={spreadBase}
                                    onChange={(e) => setSpreadBase(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-[#001E50] outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-0.5 block text-[9px] font-black uppercase text-slate-400">
                                    Penetración %
                                </label>

                                <input
                                    type="number"
                                    step="0.1"
                                    value={penetracionRetail}
                                    onChange={(e) => setPenetracionRetail(e.target.value)}
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-[#001E50] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="block text-[9px] font-black uppercase text-slate-400">
                                Bono penetración
                            </span>

                            <span className="text-xs font-black text-[#001E50]">
                                {reglaPenetracion.bono.toFixed(2)} pp · {reglaPenetracion.rango}
                            </span>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="block text-[9px] font-black uppercase text-slate-400">
                                Descuento wholesale
                            </span>

                            <span className="text-xs font-black text-[#001E50]">
                                {reglaPenetracion.descuentoWholesale.toFixed(2)} pp
                            </span>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="block text-[9px] font-black uppercase text-slate-400">
                                Spread efectivo
                            </span>

                            <span className="text-xs font-black text-[#001E50]">
                                {spreadEfectivo.toFixed(2)} pp
                            </span>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="block text-[9px] font-black uppercase text-slate-400">
                                TIIE + Spread
                            </span>

                            <span className="text-xs font-black text-[#001E50]">
                                {tasaAnual.toFixed(4)}%
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                            {error}
                        </div>
                    )}
                </div>
                {/* TABLA O DASHBOARD */}
                {vistaActiva === "detalle" ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-sm font-extrabold text-[#001E50]">
                            Detalle Individual de Unidades en Inventario (Usados)
                        </h3>

                        <div ref={tablaRef}>
                            <TablaVehiculos
                                vehiculos={vehiculosCalculados}
                                cargando={cargandoTabla}
                                error={errorTabla}
                                familiaFiltro={familiaFiltro}
                                onClearFamilia={() => setFamiliaFiltro("")}
                                periodoGracia={periodoGracia}
                            />
                        </div>
                    </div>
                ) : (
                    <div ref={reporteRef} id="reporte-inventario-usados-exportacion" className="space-y-4">
                        {/* FILA 1: COSTO FINANCIERO + RESUMEN */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                            {/* COSTO FINANCIERO POR CONCESIONARIO */}
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>Costo Financiero por Concesionario</span>
                                    </div>

                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Gracia: {periodoGracia} días
                                    </span>
                                </div>

                                <div className="scrollbar-thin max-h-[320px] space-y-2 overflow-y-auto pr-1">
                                    {cargandoTabla ? (
                                        <p className="py-10 text-center text-xs font-bold text-slate-400">
                                            Cargando costos…
                                        </p>
                                    ) : costosPorAgenciaDetalle.lista.length === 0 ? (
                                        <p className="py-10 text-center text-xs text-slate-400">
                                            Sin unidades fuera del periodo de gracia
                                        </p>
                                    ) : (
                                        costosPorAgenciaDetalle.lista.map((item) => {
                                            const pct = Math.min(
                                                100,
                                                Math.round(
                                                    (item.totalFinanciero / costosPorAgenciaDetalle.maxFinanciero) * 100
                                                )
                                            );

                                            return (
                                                <div
                                                    key={item.agencia}
                                                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs transition hover:bg-slate-100/80"
                                                >
                                                    <span className="flex h-6 shrink-0 items-center justify-center rounded-lg bg-[#001E50] px-2 text-[10px] font-black text-white">
                                                        {item.unidades} uds.
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex justify-between text-[11px] font-bold text-[#1A1F3C]">
                                                            <span className="truncate">{item.agencia}</span>

                                                            <span className="ml-2 shrink-0 text-slate-500">
                                                                {item.vehiculosFuera} fuera gracia
                                                            </span>
                                                        </div>

                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                            <div
                                                                className="h-full rounded-full bg-[#001E50] transition-all duration-300"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="min-w-[100px] shrink-0 text-right">
                                                        <span className="block text-xs font-black text-[#1677FF]">
                                                            {formatMoneda(item.totalFinanciero, 0)}
                                                        </span>

                                                        <span className="block text-[9px] font-bold text-slate-400">
                                                            {formatMoneda(item.totalDiario, 0)}/día
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* RESUMEN DE INVENTARIO */}
                            <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
                                <div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            <span>Resumen de Inventario</span>
                                        </div>

                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            {agenciaActual?.nombre || "Todas las agencias"}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                            <span className="mb-1 block text-[10px] font-black uppercase text-slate-400">
                                                AGENCIA LÍDER
                                            </span>

                                            <span className="block truncate text-xl font-black text-[#001E50]">
                                                {cargando ? "…" : agenciaLider?.agenciaNombre || "—"}
                                            </span>

                                            <p className="mt-1 text-[10px] font-bold text-slate-500">
                                                {agenciaLider
                                                    ? `${agenciaLider.total.toLocaleString("es-MX")} vehículos`
                                                    : "Sin datos"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                            <span className="mb-1 block text-[10px] font-black uppercase text-slate-400">
                                                % NUEVOS
                                            </span>

                                            <span className="block text-xl font-black text-[#001E50]">
                                                {cargando ? "…" : `${pctNuevo}%`}
                                            </span>

                                            <p className="mt-1 text-[10px] font-bold text-slate-500">
                                                Del total activo
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                            <span className="mb-1 block text-[10px] font-black uppercase text-slate-400">
                                                NACIONALES
                                            </span>

                                            <span className="block text-xl font-black text-emerald-600">
                                                {cargando ? "…" : `${unidadesNacional.toLocaleString("es-MX")} uds.`}
                                            </span>

                                            <p className="mt-1 text-[10px] font-bold text-slate-500">
                                                Unidades nacionalizadas
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                            <span className="mb-1 block text-[10px] font-black uppercase text-slate-400">
                                                IMPORTADOS
                                            </span>

                                            <span className="block text-xl font-black text-[#1677FF]">
                                                {cargando ? "…" : `${unidadesImportado.toLocaleString("es-MX")} uds.`}
                                            </span>

                                            <p className="mt-1 text-[10px] font-bold text-slate-500">
                                                Unidades importadas
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-[#001E50]/10 bg-[#001E50]/5 p-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-[#001E50]" />
                                        <span className="text-xs font-bold text-[#001E50]">
                                            Impacto de Permanencia Diaria:
                                        </span>
                                    </div>

                                    <span className="text-xs font-black text-[#1677FF]">
                                        {formatMoneda(costoDiarioTotal, 0)} costo financiero/día
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FILA 2: GRÁFICAS EXISTENTES DEL MÓDULO */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                        <Car className="h-3.5 w-3.5" />
                                        <span>Inventario por Modelo</span>
                                    </div>

                                    <span className="text-[10px] font-bold text-slate-400">
                                        {familiaFiltro
                                            ? `Filtrando: ${familiaFiltro} · clic de nuevo para quitar`
                                            : "Clic en una barra para filtrar la tabla"}
                                    </span>
                                </div>

                                <div style={{ height: 420 }}>
                                    {optionPorMarca ? (
                                        <ChartDiv
                                            option={optionPorMarca}
                                            loading={cargando}
                                            onEvents={eventosModelo}
                                        />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Antigüedad en Stock</span>
                                    </div>

                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Días desde factura
                                    </span>
                                </div>

                                <div style={{ height: 300 }}>
                                    {optionAntiguedad ? (
                                        <ChartDiv
                                            option={optionAntiguedad}
                                            loading={cargando}
                                        />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                    <span className="mb-2 block text-[10px] font-black uppercase text-slate-400">
                                        Origen de las unidades
                                    </span>

                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        {(nacionalImportado || []).map((origen) => (
                                            <div
                                                key={origen.tipoNombre}
                                                className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                                            >
                                                <span className="block text-[10px] font-bold text-slate-500">
                                                    {origen.tipoNombre}
                                                </span>

                                                <span className="text-lg font-black text-[#001E50]">
                                                    {origen.total} uds.
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FILA 3: AGENCIA + ESTATUS + ORIGEN */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>Inventario por Agencia</span>
                                    </div>

                                    {!cargando && porAgencia.length > 0 ? (
                                        <span className="rounded-full bg-[#1677FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#1677FF]">
                                            {porAgencia.length} agencias
                                        </span>
                                    ) : null}
                                </div>

                                <div style={{ height: 380 }}>
                                    {optionPorAgencia ? (
                                        <ChartDiv
                                            option={optionPorAgencia}
                                            loading={cargando}
                                        />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                        <span>Estatus</span>
                                    </div>
                                </div>

                                <div style={{ height: 380 }}>
                                    {optionPorEstatus ? (
                                        <ChartDiv
                                            option={optionPorEstatus}
                                            loading={cargando}
                                        />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                                        <span>Nacional vs. Importado</span>
                                    </div>
                                </div>

                                <div style={{ height: 380 }}>
                                    {optionNacionalImportado ? (
                                        <ChartDiv
                                            option={optionNacionalImportado}
                                            loading={cargando}
                                        />
                                    ) : (
                                        <EmptyState />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}