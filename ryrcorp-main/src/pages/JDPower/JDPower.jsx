// src/pages/JDPower/JDPower.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Funnel,
    FunnelChart,
    LabelList,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    AlertTriangle, BarChart2, ChevronDown, ClipboardList,
    MessageSquareWarning, RefreshCw, Search, SlidersHorizontal,
    Sparkles, Star, TableProperties, TrendingUp, Users,
} from "lucide-react";

import { obtenerEncuestasJDPower, obtenerOpcionesJDPower, obtenerResumenIAJDPower } from "../../lib/apiJDPower";
import ResumenIAModal from "./ResumenIAModal";


const NAVY = "#0B1F5E";
const NAVY_2 = "#123C69";
const TEAL = "#0E718A";
const TEAL_LIGHT = "#86B8C8";
const SKY = "#D8EEF5";
const GOLD = "#FFD84D";
const GREEN = "#00A651";
const ORANGE = "#F0A500";
const RED = "#D85A30";
const GRAY = "#6B7280";

const CHART_COLORS = [
    "#0B1F5E",
    "#0E718A",
    "#86B8C8",
    "#00A651",
    "#F0A500",
    "#D85A30",
    "#7F77DD",
    "#D4537E",
];

const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const MESES_CORTOS = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
];

const ANIO_ACTUAL = String(new Date().getFullYear());

const TooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

function parseFechaLocal(fecha) {
    if (!fecha) return null;

    const soloFecha = String(fecha).slice(0, 10);
    const partes = soloFecha.split("-").map(Number);

    if (partes.length < 3) return null;

    const [anio, mes, dia] = partes;

    if (!anio || !mes || !dia) return null;

    return new Date(anio, mes - 1, dia);
}

function numeroSeguro(valor) {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? numero : 0;
}

function porcentaje(valor, total) {
    if (!total) return 0;
    return (valor / total) * 100;
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function numero(valor) {
    return numeroSeguro(valor).toLocaleString("es-MX");
}

function redondear(valor, decimales = 2) {
    const numero = numeroSeguro(valor);
    return numero.toFixed(decimales);
}

function promedioValores(datos, campo) {
    const valores = datos
        .map((item) => numeroSeguro(item[campo]))
        .filter((valor) => valor > 0);

    if (!valores.length) return 0;

    return valores.reduce((acc, valor) => acc + valor, 0) / valores.length;
}

function normalizarEscalaCinco(valor) {
    const numero = numeroSeguro(valor);

    if (!numero) return 0;

    if (numero > 5) {
        return (numero / 10) * 5;
    }

    return numero;
}

function recortar(texto, max = 22) {
    const valor = String(texto || "Sin dato");

    if (valor.length <= max) return valor;

    return `${valor.slice(0, max)}…`;
}

function esEncuestaCompletada(item) {
    const estatus = normalizarTexto(item.estatus);

    return (
        estatus.includes("complet") ||
        estatus.includes("respond") ||
        numeroSeguro(item.q1_satisfaccion_general) > 0
    );
}

function mapearEncuesta(item) {
    const fechaBase = item.periodo || item.fecha_encuesta || item.fecha_entrega;
    const fecha = parseFechaLocal(fechaBase);

    return {
        ...item,
        id_ventas: item.id_ventas,
        id_muestra: item.id_muestra || "",
        id_encuesta: item.id_encuesta || "",
        tipo: item.tipo || "Sin tipo",
        canal_envio: item.canal_envio || "Sin canal",
        estatus: item.estatus || "Sin estatus",
        chasis: item.chasis || "",
        modelo: item.modelo || "Sin modelo",
        anio_vehiculo: numeroSeguro(item.anio_vehiculo),
        region: item.region || "Sin región",
        zona: item.zona || "Sin zona",
        estado: item.estado || "Sin estado",
        ciudad: item.ciudad || "Sin ciudad",
        codigo_concesionaria: item.codigo_concesionaria || "",
        concesionaria: item.concesionaria || "Sin concesionaria",
        id_asesor: item.id_asesor || "Sin asesor",
        vwsf: item.vwsf || "",
        q1_satisfaccion_general: numeroSeguro(item.q1_satisfaccion_general),
        qr_2_1_proceso_entrega: numeroSeguro(item.qr_2_1_proceso_entrega),
        qr_2_1_1_efectividad_explicacion: numeroSeguro(item.qr_2_1_1_efectividad_explicacion),
        qr_2_1_2_puntualidad_entrega: numeroSeguro(item.qr_2_1_2_puntualidad_entrega),
        qr_2_1_3_condiciones_vehiculo: numeroSeguro(item.qr_2_1_3_condiciones_vehiculo),
        qr_2_1_4_conexion_bluetooth: numeroSeguro(item.qr_2_1_4_conexion_bluetooth),
        qr_2_2_atencion_personal: numeroSeguro(item.qr_2_2_atencion_personal),
        qr_2_2_1_conocimiento_vehiculo: numeroSeguro(item.qr_2_2_1_conocimiento_vehiculo),
        qr_2_2_2_amabilidad: numeroSeguro(item.qr_2_2_2_amabilidad),
        qr_2_2_3_respuesta: numeroSeguro(item.qr_2_2_3_respuesta),
        qr_2_2_4_comunicacion_fuera: numeroSeguro(item.qr_2_2_4_comunicacion_fuera),
        qr_2_2_5_uso_tecnologia: numeroSeguro(item.qr_2_2_5_uso_tecnologia),
        qr_2_2_6_info_tiempo_entrega: numeroSeguro(item.qr_2_2_6_info_tiempo_entrega),
        qr_2_3_instalaciones: numeroSeguro(item.qr_2_3_instalaciones),
        qr_2_3_1_apariencia: numeroSeguro(item.qr_2_3_1_apariencia),
        qr_2_3_2_facilidad_inventario: numeroSeguro(item.qr_2_3_2_facilidad_inventario),
        qr_2_3_3_variedad_modelos: numeroSeguro(item.qr_2_3_3_variedad_modelos),
        qr_2_3_4_calidad_amenidades: numeroSeguro(item.qr_2_3_4_calidad_amenidades),
        qr_2_3_5_opciones_estacionamiento: numeroSeguro(item.qr_2_3_5_opciones_estacionamiento),
        qr_2_4_documentacion: numeroSeguro(item.qr_2_4_documentacion),
        qr_2_4_1_claridad_documentos: numeroSeguro(item.qr_2_4_1_claridad_documentos),
        qr_2_4_2_transparencia_papeleo: numeroSeguro(item.qr_2_4_2_transparencia_papeleo),
        qr_2_4_3_prontitud_papeleo: numeroSeguro(item.qr_2_4_3_prontitud_papeleo),
        qr_2_5_negociacion: numeroSeguro(item.qr_2_5_negociacion),
        qr_2_5_1_acuerdo_precio: numeroSeguro(item.qr_2_5_1_acuerdo_precio),
        qr_2_5_2_precio_justo: numeroSeguro(item.qr_2_5_2_precio_justo),
        qr_2_5_3_comodidad_negociacion: numeroSeguro(item.qr_2_5_3_comodidad_negociacion),
        p1_satisfaccion_producto: numeroSeguro(item.p1_satisfaccion_producto),
        p3_recomendacion_distribuidor: numeroSeguro(item.p3_recomendacion_distribuidor),
        q1_1_razones_calificacion: item.q1_1_razones_calificacion || "",
        q3_comentarios_adicionales: item.q3_comentarios_adicionales || "",
        p1_1_comentarios_auto: item.p1_1_comentarios_auto || "",
        q8_transferencia_datos: item.q8_transferencia_datos || "",
        q10_autoriza_publicacion: item.q10_autoriza_publicacion || "",
        fecha_registro: item.fecha_registro || "",
        fecha_entrega: item.fecha_entrega || "",
        fecha_encuesta: item.fecha_encuesta || "",
        periodo: item.periodo || "",
        anio: fecha ? fecha.getFullYear() : 0,
        mes: fecha ? fecha.getMonth() + 1 : 0,
    };
}

function agruparPor(datos, obtenerClave, limite = 10) {
    const map = new Map();

    datos.forEach((item) => {
        const clave = obtenerClave(item) || "Sin dato";

        if (!map.has(clave)) {
            map.set(clave, {
                name: clave,
                encuestas: 0,
                satisfaccion_total: 0,
                satisfaccion_count: 0,
                recomendacion_total: 0,
                recomendacion_count: 0,
            });
        }

        const actual = map.get(clave);

        actual.encuestas += 1;

        if (item.q1_satisfaccion_general > 0) {
            actual.satisfaccion_total += item.q1_satisfaccion_general;
            actual.satisfaccion_count += 1;
        }

        if (item.p3_recomendacion_distribuidor > 0) {
            actual.recomendacion_total += item.p3_recomendacion_distribuidor;
            actual.recomendacion_count += 1;
        }
    });

    return Array.from(map.values())
        .map((item) => ({
            ...item,
            satisfaccion_promedio: item.satisfaccion_count
                ? item.satisfaccion_total / item.satisfaccion_count
                : 0,
            recomendacion_promedio: item.recomendacion_count
                ? item.recomendacion_total / item.recomendacion_count
                : 0,
        }))
        .sort((a, b) => b.encuestas - a.encuestas)
        .slice(0, limite);
}

function DashboardPanel({ title, subtitle, icon: Icon, children, footer, className = "" }) {
    return (
        <div className={`overflow-hidden rounded-[6px] bg-white shadow-sm ${className}`}>
            <div className="flex min-h-[42px] items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    {Icon ? <Icon size={17} className="shrink-0 text-[#606975]" /> : null}
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-black text-[#555A61]">
                            {title}
                        </p>
                        {subtitle ? (
                            <p className="truncate text-[11px] font-medium text-gray-400">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="p-4">{children}</div>

            {footer ? (
                <div className="border-t border-gray-100 px-4 py-2 text-sm font-semibold text-cyan-600">
                    {footer}
                </div>
            ) : null}
        </div>
    );
}

function StatCard({ label, value, sub, color }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                style={{ backgroundColor: color || NAVY }}
            />

            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p className="text-2xl font-black text-gray-800">{value}</p>

            {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
        </div>
    );
}

function SelectField({ label, value, onChange, children }) {
    return (
        <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </label>

            <div className="relative">
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-[38px] min-w-[145px] appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-200"
                >
                    {children}
                </select>

                <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
            </div>
        </div>
    );
}

function StarRating({ value }) {
    const score = Math.max(0, Math.min(5, numeroSeguro(value)));
    const percent = Math.max(0, Math.min(100, (score / 5) * 100));

    return (
        <div className="relative inline-block text-[38px] leading-none tracking-[2px]">
            <div className="text-gray-200">★★★★★</div>
            <div
                className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-[#FFD84D]"
                style={{ width: `${percent}%` }}
            >
                ★★★★★
            </div>
        </div>
    );
}

function RatingDistribution({ datos }) {
    const completadas = datos.filter((item) => item.q1_satisfaccion_general > 0);
    const total = completadas.length;

    const filas = [5, 4, 3, 2, 1].map((rating) => {
        const cantidad = completadas.filter((item) => {
            const score5 = Math.round(normalizarEscalaCinco(item.q1_satisfaccion_general));
            return score5 === rating;
        }).length;

        return {
            rating,
            cantidad,
            pct: porcentaje(cantidad, total),
        };
    });

    return (
        <div className="space-y-2">
            {filas.map((fila) => (
                <div key={fila.rating} className="grid grid-cols-[18px_1fr_55px] items-center gap-2 text-xs">
                    <span className="font-bold text-gray-600">{fila.rating}</span>

                    <div className="h-4 overflow-hidden rounded-sm bg-gray-100">
                        <div
                            className="h-full rounded-sm"
                            style={{
                                width: `${fila.pct}%`,
                                backgroundColor: fila.rating >= 4 ? NAVY_2 : fila.rating === 3 ? ORANGE : RED,
                            }}
                        />
                    </div>

                    <span className="text-right font-bold text-gray-600">
                        {fila.pct.toFixed(1)}%
                    </span>
                </div>
            ))}
        </div>
    );
}

function NpsBars({ promotores, neutrales, detractores }) {
    const total = promotores + neutrales + detractores || 1;

    const barras = [
        {
            label: "Promotores",
            value: promotores,
            color: NAVY_2,
            pct: porcentaje(promotores, total),
        },
        {
            label: "Neutral",
            value: neutrales,
            color: TEAL_LIGHT,
            pct: porcentaje(neutrales, total),
        },
        {
            label: "Detractores",
            value: detractores,
            color: RED,
            pct: porcentaje(detractores, total),
        },
    ];

    return (
        <div className="space-y-5">
            {barras.map((barra) => (
                <div key={barra.label} className="grid grid-cols-[95px_1fr_52px] items-center gap-3">
                    <span className="text-right text-sm font-medium text-gray-500">
                        {barra.label}
                    </span>

                    <div className="relative h-7 bg-gray-50">
                        <div
                            className="h-full"
                            style={{
                                width: `${barra.pct}%`,
                                backgroundColor: barra.color,
                                opacity: barra.label === "Neutral" ? 0.85 : 1,
                            }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-gray-700">
                            {barra.value}
                        </span>
                    </div>

                    <span className="rounded-md bg-[#00A651] px-2 py-1 text-center text-xs font-black text-white">
                        ▲ {barra.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

function VistaTabla({ datos }) {
    const datosTabla = datos.slice(0, 1000);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {datos.length > 1000 ? (
                <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                    Mostrando 1,000 de {numero(datos.length)} registros para mantener buen rendimiento.
                </div>
            ) : null}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr style={{ backgroundColor: NAVY }} className="text-left text-white">
                            {[
                                "ID venta",
                                "Periodo",
                                "Encuesta",
                                "Estatus",
                                "Concesionaria",
                                "Asesor",
                                "Modelo",
                                "Chasis",
                                "Satisfacción",
                                "Recomendación",
                                "Producto",
                                "Comentario",
                            ].map((header) => (
                                <th
                                    key={header}
                                    className={`px-4 py-3 font-medium ${["Satisfacción", "Recomendación", "Producto"].includes(header)
                                        ? "text-right"
                                        : ""
                                        }`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {datosTabla.map((item, index) => (
                            <tr
                                key={`${item.id_ventas}-${index}`}
                                className={`border-t border-gray-100 transition hover:bg-blue-50/40 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                    }`}
                            >
                                <td className="whitespace-nowrap px-4 py-3 font-bold text-gray-800">
                                    {item.id_ventas || "—"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                    {item.periodo || "—"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                    {item.id_encuesta || "—"}
                                </td>

                                <td className="px-4 py-3">
                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                        {item.estatus}
                                    </span>
                                </td>

                                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-800">
                                    {item.codigo_concesionaria || "—"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                    {item.id_asesor}
                                </td>

                                <td className="max-w-[190px] truncate px-4 py-3 text-gray-600">
                                    {item.modelo}
                                </td>

                                <td className="max-w-[160px] truncate px-4 py-3 text-gray-600">
                                    {item.chasis || "—"}
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                    {item.q1_satisfaccion_general || "—"}
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                    {item.p3_recomendacion_distribuidor || "—"}
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                    {item.p1_satisfaccion_producto || "—"}
                                </td>

                                <td className="max-w-[280px] truncate px-4 py-3 text-gray-500">
                                    {item.q3_comentarios_adicionales ||
                                        item.q1_1_razones_calificacion ||
                                        item.p1_1_comentarios_auto ||
                                        "—"}
                                </td>
                            </tr>
                        ))}

                        {datosTabla.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-4 py-10 text-center text-gray-400">
                                    Sin resultados para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children, className = "" }) {
    return (
        <div className={`min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
            <p className="text-lg font-bold" style={{ color: NAVY }}>
                {title}
            </p>

            {subtitle ? <p className="mb-4 text-sm text-gray-400">{subtitle}</p> : null}

            {children}
        </div>
    );
}

function VistaGraficas({ datos, labelPeriodo }) {
    const totalRegistros = datos.length;
    const completadas = datos.filter(esEncuestaCompletada);
    const totalCompletadas = completadas.length;
    const tasaRespuesta = porcentaje(totalCompletadas, totalRegistros);

    const satisfaccionPromedioRaw = promedioValores(completadas, "q1_satisfaccion_general");
    const satisfaccionPromedio5 = normalizarEscalaCinco(satisfaccionPromedioRaw);

    const productoPromedio = promedioValores(completadas, "p1_satisfaccion_producto");
    const procesoPromedio = promedioValores(completadas, "qr_2_1_proceso_entrega");
    const atencionPromedio = promedioValores(completadas, "qr_2_2_atencion_personal");

    const promotores = completadas.filter(
        (item) => item.p3_recomendacion_distribuidor >= 9
    ).length;

    const neutrales = completadas.filter(
        (item) =>
            item.p3_recomendacion_distribuidor >= 7 &&
            item.p3_recomendacion_distribuidor <= 8
    ).length;

    const detractores = completadas.filter(
        (item) =>
            item.p3_recomendacion_distribuidor > 0 &&
            item.p3_recomendacion_distribuidor <= 6
    ).length;

    const totalNps = promotores + neutrales + detractores;
    const nps = totalNps ? Math.round(((promotores - detractores) / totalNps) * 100) : 0;

    const alertasAbiertas = completadas.filter(
        (item) =>
            item.q1_satisfaccion_general > 0 &&
            (normalizarEscalaCinco(item.q1_satisfaccion_general) <= 3 ||
                (item.p3_recomendacion_distribuidor > 0 &&
                    item.p3_recomendacion_distribuidor <= 6))
    ).length;

    const alertasCerradas = datos.filter((item) => {
        const texto = normalizarTexto(
            `${item.estatus} ${item.q3_comentarios_adicionales} ${item.q1_1_razones_calificacion}`
        );

        return texto.includes("cerrad") || texto.includes("atendid");
    }).length;

    const funnelData = [
        {
            name: "Total registros recibidos",
            value: totalRegistros,
            fill: "#0B4F6C",
        },
        {
            name: "Tamaño de la muestra",
            value: totalRegistros,
            fill: "#11728A",
        },
        {
            name: "Invitaciones enviadas",
            value: datos.filter((item) => item.canal_envio && item.canal_envio !== "Sin canal").length || totalRegistros,
            fill: "#86B8C8",
        },
        {
            name: "Encuestas Completadas",
            value: totalCompletadas,
            fill: "#C7E0E8",
        },
    ];

    const detalleAlertasCerradas = [
        {
            name: "Sin respuesta del cliente",
            concesionaria: 0,
            nacional: 20,
        },
        {
            name: "Cliente contactado e insatisfacción atendida",
            concesionaria: 0,
            nacional: 0,
        },
        {
            name: "Cliente contactado pero insatisfacción no atendida",
            concesionaria: 0,
            nacional: 0,
        },
        {
            name: "Cliente no contactado",
            concesionaria: 0,
            nacional: 50,
        },
        {
            name: "En espera de respuesta del cliente",
            concesionaria: 0,
            nacional: 30,
        },
    ];

    const porMes = useMemo(() => {
        const map = new Map();

        datos.forEach((item) => {
            if (!item.anio || !item.mes) return;

            const key = `${item.anio}-${String(item.mes).padStart(2, "0")}`;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: `${MESES[item.mes - 1]?.slice(0, 3) || "Mes"} ${item.anio}`,
                    encuestas: 0,
                    satisfaccion_total: 0,
                    satisfaccion_count: 0,
                });
            }

            const actual = map.get(key);

            actual.encuestas += 1;

            if (item.q1_satisfaccion_general > 0) {
                actual.satisfaccion_total += normalizarEscalaCinco(item.q1_satisfaccion_general);
                actual.satisfaccion_count += 1;
            }
        });

        return Array.from(map.values())
            .map((item) => ({
                ...item,
                satisfaccion_promedio: item.satisfaccion_count
                    ? item.satisfaccion_total / item.satisfaccion_count
                    : 0,
            }))
            .sort((a, b) => a.key.localeCompare(b.key));
    }, [datos]);

    const porConcesionaria = useMemo(
        () => agruparPor(datos, (item) => item.codigo_concesionaria || "Sin código", 10),
        [datos]
    );

    const porEstatus = useMemo(
        () => agruparPor(datos, (item) => item.estatus, 8),
        [datos]
    );

    const porModelo = useMemo(
        () => agruparPor(datos, (item) => item.modelo, 10),
        [datos]
    );

    const dimensiones = useMemo(() => {
        const campos = [
            ["Proceso entrega", "qr_2_1_proceso_entrega"],
            ["Atención personal", "qr_2_2_atencion_personal"],
            ["Instalaciones", "qr_2_3_instalaciones"],
            ["Documentación", "qr_2_4_documentacion"],
            ["Negociación", "qr_2_5_negociacion"],
            ["Producto", "p1_satisfaccion_producto"],
            ["Recomendación", "p3_recomendacion_distribuidor"],
        ];

        return campos.map(([name, campo]) => ({
            name,
            promedio: promedioValores(datos, campo),
        }));
    }, [datos]);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
                <DashboardPanel
                    title="Q1- Satisfacción General -Ventas"
                    icon={Star}
                >
                    <div className="grid min-h-[245px] grid-cols-1 gap-4 md:grid-cols-[1.05fr_1fr]">
                        <div className="flex flex-col justify-between">
                            <div>
                                <p className="text-[54px] font-black leading-none text-gray-600">
                                    {satisfaccionPromedio5.toFixed(2)}
                                    <span className="text-4xl">#</span>
                                </p>

                                <div className="mt-4">
                                    <StarRating value={satisfaccionPromedio5} />
                                </div>
                            </div>

                            <div className="mt-5">
                                <p className="text-center text-2xl font-black text-gray-600">
                                    Objetivo: 4.90
                                </p>

                                <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs font-bold text-gray-600">
                                    <div>
                                        <p>#Encuestas</p>
                                        <p className="mt-1 text-base">{numero(totalCompletadas)}</p>
                                    </div>

                                    <div>
                                        <p>Calidad de la base</p>
                                        <p className="mt-1 text-base">0.00%</p>
                                    </div>

                                    <div>
                                        <p>Periodo Previo Q1.</p>
                                        <p className="mt-1 text-base">{satisfaccionPromedio5.toFixed(2)}#</p>
                                    </div>

                                    <div>
                                        <p>Periodo Previo 1,2,3*</p>
                                        <p className="mt-1 text-base">0.0%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <RatingDistribution datos={datos} />
                        </div>
                    </div>
                </DashboardPanel>

                <DashboardPanel title="Reporte de Campo" icon={ClipboardList}>
                    <div className="grid min-h-[245px] grid-cols-1 items-center gap-4 md:grid-cols-[1.1fr_1fr]">
                        <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip contentStyle={TooltipStyle} />
                                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                                        <LabelList
                                            position="center"
                                            fill="#fff"
                                            stroke="none"
                                            dataKey="value"
                                            fontSize={14}
                                            fontWeight={700}
                                        />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-5">
                            {funnelData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-bold text-gray-600">
                                        {item.name}
                                    </span>
                                    <span className="text-sm font-black" style={{ color: NAVY }}>
                                        {numero(item.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-2 space-y-1 border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#0B4F6C]">
                                Tasa de respuesta Concesionaria:
                            </span>
                            <span className="text-sm font-black text-[#0B4F6C]">
                                {tasaRespuesta.toFixed(0)} %
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[#86B8C8]">
                                Tasa de respuesta Nacional:
                            </span>
                            <span className="text-sm font-black text-[#86B8C8]">
                                41 %
                            </span>
                        </div>
                    </div>
                </DashboardPanel>

                <DashboardPanel
                    title="Puntuación Neta del Promotor"
                    icon={TrendingUp}
                >
                    <div className="grid min-h-[245px] grid-cols-1 gap-4 md:grid-cols-[0.75fr_1.25fr]">
                        <div className="flex flex-col justify-center">
                            <p className="text-2xl font-black leading-tight text-gray-600">
                                Puntuación Neta
                                <br />
                                del promotor
                            </p>

                            <p className="mt-6 text-[54px] font-black leading-none text-gray-600">
                                {nps}
                            </p>

                            <div className="mt-6">
                                <p className="text-sm font-bold text-gray-600">
                                    Periodo Anterior:
                                </p>
                                <p className="text-lg font-black text-gray-600">
                                    {nps}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center">
                            <NpsBars
                                promotores={promotores}
                                neutrales={neutrales}
                                detractores={detractores}
                            />

                            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3" style={{ backgroundColor: NAVY_2 }} />
                                    Concesionaria
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3" style={{ backgroundColor: TEAL_LIGHT }} />
                                    Nacional
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardPanel>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartCard
                    title="Tendencia mensual de encuestas"
                    subtitle="Volumen mensual y satisfacción promedio"
                >
                    <ResponsiveContainer width="100%" height={310}>
                        <LineChart data={porMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                                domain={[0, 5]}
                            />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value, name) => {
                                    if (name === "Satisfacción promedio") {
                                        return [Number(value).toFixed(2), name];
                                    }

                                    return [numero(value), name];
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                                yAxisId="left"
                                dataKey="encuestas"
                                name="Encuestas"
                                fill={SKY}
                                radius={[5, 5, 0, 0]}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="satisfaccion_promedio"
                                name="Satisfacción promedio"
                                stroke={NAVY}
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Estatus de encuestas" subtitle="Distribución por estatus">
                    <ResponsiveContainer width="100%" height={310}>
                        <PieChart>
                            <Pie
                                data={porEstatus}
                                dataKey="encuestas"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={105}
                                innerRadius={55}
                            >
                                {porEstatus.map((_, index) => (
                                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value) => [numero(value), "Encuestas"]}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartCard
                    title="Top concesionarias"
                    subtitle="Encuestas y satisfacción promedio"
                >
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart
                            data={porConcesionaria.map((item) => ({
                                ...item,
                                name: recortar(item.name, 18),
                                satisfaccion_5: normalizarEscalaCinco(item.satisfaccion_promedio),
                            }))}
                            margin={{ top: 10, right: 10, left: -10, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-35}
                                textAnchor="end"
                                height={90}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                            />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 5]}
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value, name) => {
                                    if (name === "Satisfacción promedio") {
                                        return [Number(value).toFixed(2), name];
                                    }

                                    return [numero(value), name];
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                                yAxisId="left"
                                dataKey="encuestas"
                                name="Encuestas"
                                fill={NAVY}
                                radius={[5, 5, 0, 0]}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="satisfaccion_5"
                                name="Satisfacción promedio"
                                stroke={RED}
                                strokeWidth={3}
                                dot={{ r: 3 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top modelos" subtitle="Modelos con mayor número de encuestas">
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart
                            data={porModelo.map((item) => ({
                                ...item,
                                name: recortar(item.name, 18),
                            }))}
                            margin={{ top: 10, right: 10, left: -10, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-35}
                                textAnchor="end"
                                height={90}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value) => [numero(value), "Encuestas"]}
                            />
                            <Bar
                                dataKey="encuestas"
                                name="Encuestas"
                                fill={TEAL}
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard
                title="Promedio por dimensión"
                subtitle="Comparativa de indicadores principales JD Power"
            >
                <ResponsiveContainer width="100%" height={330}>
                    <BarChart data={dimensiones} margin={{ top: 10, right: 10, left: -10, bottom: 55 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={75}
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                        />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip
                            contentStyle={TooltipStyle}
                            formatter={(value) => [Number(value).toFixed(2), "Promedio"]}
                        />
                        <Bar
                            dataKey="promedio"
                            name="Promedio"
                            fill={GREEN}
                            radius={[5, 5, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

export default function JDPower() {
    const [vista, setVista] = useState("graficas");

    const [anio, setAnio] = useState(ANIO_ACTUAL);
    const [mes, setMes] = useState("Todos");
    const [estatus, setEstatus] = useState("Todos");
    const [codigoConcesionaria, setCodigoConcesionaria] = useState("Todas");
    const [asesor, setAsesor] = useState("Todos");
    const [modelo, setModelo] = useState("Todos");
    const [busqueda, setBusqueda] = useState("");

    const [datosRaw, setDatosRaw] = useState([]);

    const [mostrarResumenIA, setMostrarResumenIA] = useState(false);
    const [cargandoResumenIA, setCargandoResumenIA] = useState(false);
    const [errorResumenIA, setErrorResumenIA] = useState(null);
    const [resumenIA, setResumenIA] = useState(null);

    const [opciones, setOpciones] = useState({
        anios: [],
        anio_mes: [],
        meses_por_anio: {},
        tipos: [],
        canales_envio: [],
        estatuses: [],
        concesionarias: [],
        codigos_concesionaria: [],
        asesores: [],
        modelos: [],
        anios_vehiculo: [],
        regiones: [],
        zonas: [],
        estados: [],
        ciudades: [],
    });

    const [loading, setLoading] = useState(true);
    const [loadingOpciones, setLoadingOpciones] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const cacheRef = useRef(new Map());

    useEffect(() => {
        const controller = new AbortController();

        async function cargarOpciones() {
            try {
                setLoadingOpciones(true);

                const data = await obtenerOpcionesJDPower({
                    signal: controller.signal,
                });

                setOpciones({
                    anios: Array.isArray(data.anios) ? data.anios : [],
                    anio_mes: Array.isArray(data.anio_mes) ? data.anio_mes : [],
                    meses_por_anio:
                        data.meses_por_anio && typeof data.meses_por_anio === "object"
                            ? data.meses_por_anio
                            : {},
                    tipos: Array.isArray(data.tipos) ? data.tipos : [],
                    canales_envio: Array.isArray(data.canales_envio) ? data.canales_envio : [],
                    estatuses: Array.isArray(data.estatuses) ? data.estatuses : [],
                    concesionarias: Array.isArray(data.concesionarias) ? data.concesionarias : [],
                    codigos_concesionaria: Array.isArray(data.codigos_concesionaria)
                        ? data.codigos_concesionaria
                        : [],
                    asesores: Array.isArray(data.asesores) ? data.asesores : [],
                    modelos: Array.isArray(data.modelos) ? data.modelos : [],
                    anios_vehiculo: Array.isArray(data.anios_vehiculo) ? data.anios_vehiculo : [],
                    regiones: Array.isArray(data.regiones) ? data.regiones : [],
                    zonas: Array.isArray(data.zonas) ? data.zonas : [],
                    estados: Array.isArray(data.estados) ? data.estados : [],
                    ciudades: Array.isArray(data.ciudades) ? data.ciudades : [],
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoadingOpciones(false);
            }
        }

        cargarOpciones();

        return () => controller.abort();
    }, []);

    const cargarEncuestas = useCallback(async (filtros, signal) => {
        const cacheKey = JSON.stringify(filtros);

        if (cacheRef.current.has(cacheKey)) {
            return cacheRef.current.get(cacheKey);
        }

        const data = await obtenerEncuestasJDPower(filtros, { signal });
        const lista = Array.isArray(data) ? data : data.results ?? [];
        const mapeado = lista.map(mapearEncuesta);

        cacheRef.current.set(cacheKey, mapeado);

        return mapeado;
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function cargarDatos() {
            try {
                setLoading(true);
                setError(null);

                const datos = await cargarEncuestas(
                    {
                        anio,
                        mes,
                        estatus,
                        codigo_concesionaria: codigoConcesionaria,
                        asesor,
                        modelo,
                        ordering: "-periodo",
                        limit: 10000,
                    },
                    controller.signal
                );

                setDatosRaw(datos);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        cargarDatos();

        return () => controller.abort();
    }, [
        anio,
        mes,
        estatus,
        codigoConcesionaria,
        asesor,
        modelo,
        cargarEncuestas,
        refreshKey,
    ]);

    const aniosDisponibles = useMemo(() => {
        if (opciones.anios.length > 0) return opciones.anios;

        return [...new Set(datosRaw.map((item) => item.anio))]
            .filter(Boolean)
            .sort((a, b) => b - a);
    }, [opciones.anios, datosRaw]);

    const mesesDisponibles = useMemo(() => {
        if (anio === "Todos") {
            const meses = opciones.anio_mes
                .map((item) => item.mes)
                .filter(Boolean);

            return [...new Set(meses)].sort((a, b) => a - b);
        }

        const desdeOpciones = opciones.anio_mes
            .filter((item) => String(item.anio) === String(anio))
            .map((item) => item.mes)
            .filter(Boolean);

        if (desdeOpciones.length > 0) {
            return [...new Set(desdeOpciones)].sort((a, b) => a - b);
        }

        return [...new Set(datosRaw.map((item) => item.mes))]
            .filter(Boolean)
            .sort((a, b) => a - b);
    }, [anio, opciones.anio_mes, datosRaw]);

    const datosFiltrados = useMemo(() => {
        let datos = [...datosRaw];

        const texto = normalizarTexto(busqueda);

        if (texto) {
            datos = datos.filter((item) => {
                const acumulado = [
                    item.id_ventas,
                    item.id_muestra,
                    item.id_encuesta,
                    item.chasis,
                    item.modelo,
                    item.concesionaria,
                    item.codigo_concesionaria,
                    item.id_asesor,
                    item.ciudad,
                    item.estado,
                    item.q1_1_razones_calificacion,
                    item.q3_comentarios_adicionales,
                    item.p1_1_comentarios_auto,
                ]
                    .map(normalizarTexto)
                    .join(" ");

                return acumulado.includes(texto);
            });
        }

        return datos;
    }, [datosRaw, busqueda]);

    const resumen = useMemo(() => {
        const total = datosFiltrados.length;
        const completadas = datosFiltrados.filter(esEncuestaCompletada);

        const satisfaccion = normalizarEscalaCinco(
            promedioValores(completadas, "q1_satisfaccion_general")
        );

        const producto = promedioValores(completadas, "p1_satisfaccion_producto");
        const recomendacion = promedioValores(completadas, "p3_recomendacion_distribuidor");

        const comentarios = datosFiltrados.filter(
            (item) =>
                item.q1_1_razones_calificacion ||
                item.q3_comentarios_adicionales ||
                item.p1_1_comentarios_auto
        ).length;

        return {
            total,
            completadas: completadas.length,
            comentarios,
            satisfaccion,
            producto,
            recomendacion,
        };
    }, [datosFiltrados]);

    const labelPeriodo = useMemo(() => {
        if (anio !== "Todos" && mes !== "Todos") {
            return `${MESES[Number(mes) - 1] || "Mes"} '${String(anio).slice(-2)}`;
        }

        if (anio !== "Todos") {
            return `Año ${anio}`;
        }

        return "Todos los periodos";
    }, [anio, mes]);

    const loadingGeneral = loading || loadingOpciones;

    function limpiarFiltros() {
        setAnio(ANIO_ACTUAL);
        setMes("Todos");
        setEstatus("Todos");
        setCodigoConcesionaria("Todas");   // ← corregido
        setAsesor("Todos");
        setModelo("Todos");
        setBusqueda("");
    }

    function refrescarDatos() {
        cacheRef.current.clear();
        setRefreshKey((prev) => prev + 1);
    }

    async function abrirResumenIA() {
        setMostrarResumenIA(true);
        setCargandoResumenIA(true);
        setErrorResumenIA(null);

        try {
            const data = await obtenerResumenIAJDPower({
                anio,
                mes,
                estatus,
                codigo_concesionaria: codigoConcesionaria,
                asesor,
                modelo,
            });

            if (!data.ok) {
                setErrorResumenIA(data.error || "No se pudo generar el resumen.");
            }

            setResumenIA(data);
        } catch (err) {
            setErrorResumenIA(err.message);
        } finally {
            setCargandoResumenIA(false);
        }
    }

    if (loadingGeneral) {
        return (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
                    Cargando JD Power…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="max-w-md rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-bold text-red-500">
                        Error al cargar JD Power
                    </p>
                    <p className="mt-1 text-xs text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-800">JD Power</h2>
                    <p className="text-xs text-gray-500">
                        Dashboard de satisfacción, NPS, alertas y desempeño por concesionaria.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                     <button
                        onClick={abrirResumenIA}
                        className="flex items-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: NAVY }}
                    >
                        <Sparkles size={15} />
                        Resumen IA
                    </button>
                    <button
                        onClick={refrescarDatos}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>

                    {["tabla", "graficas"].map((item) => (
                        <button
                            key={item}
                            onClick={() => setVista(item)}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${vista === item
                                ? "border-transparent text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                            style={vista === item ? { backgroundColor: NAVY } : {}}
                        >
                            {item === "tabla" ? (
                                <>
                                    <TableProperties size={15} />
                                    Tabla
                                </>
                            ) : (
                                <>
                                    <BarChart2 size={15} />
                                    Gráficas
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3">
                    <SlidersHorizontal size={15} className="text-gray-400" />

                    {aniosDisponibles.map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                setAnio(anio === String(item) ? "Todos" : String(item));
                                setMes("Todos");
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${anio === String(item)
                                ? "border-transparent text-white"
                                : "border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                                }`}
                            style={anio === String(item) ? { backgroundColor: NAVY } : {}}
                        >
                            {item}
                        </button>
                    ))}

                    <button
                        onClick={() => {
                            setAnio("Todos");
                            setMes("Todos");
                        }}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${anio === "Todos"
                            ? "border-transparent text-white"
                            : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
                            }`}
                        style={anio === "Todos" ? { backgroundColor: NAVY } : {}}
                    >
                        Todos
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-4 py-3">
                    {MESES_CORTOS.map((item, index) => {
                        const mesNumero = index + 1;
                        const disponible =
                            anio === "Todos" || mesesDisponibles.includes(mesNumero);

                        return (
                            <button
                                key={item}
                                onClick={() => {
                                    if (!disponible) return;
                                    setMes(mes === String(mesNumero) ? "Todos" : String(mesNumero));
                                }}
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${mes === String(mesNumero)
                                    ? "border-transparent text-white"
                                    : disponible
                                        ? "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                                    }`}
                                style={mes === String(mesNumero) ? { backgroundColor: NAVY } : {}}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                    <SelectField label="Estatus" value={estatus} onChange={setEstatus}>
                        <option value="Todos">Todos</option>
                        {opciones.estatuses.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField
                        label="Código concesionaria"
                        value={codigoConcesionaria}
                        onChange={setCodigoConcesionaria}
                    >
                        <option value="Todas">Todas</option>
                        {opciones.codigos_concesionaria.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Asesor" value={asesor} onChange={setAsesor}>
                        <option value="Todos">Todos</option>
                        {opciones.asesores.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Modelo" value={modelo} onChange={setModelo}>
                        <option value="Todos">Todos</option>
                        {opciones.modelos.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <div className="min-w-[260px] flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Buscar
                        </label>

                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                                placeholder="ID, encuesta, chasis, modelo, comentario..."
                                className="h-[38px] w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    <button
                        onClick={limpiarFiltros}
                        className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard
                    label="Encuestas"
                    value={numero(resumen.total)}
                    sub="registros filtrados"
                    color="#378ADD"
                />

                <StatCard
                    label="Completadas"
                    value={numero(resumen.completadas)}
                    sub="encuestas respondidas"
                    color="#1D9E75"
                />

                <StatCard
                    label="Q1 Satisfacción"
                    value={resumen.satisfaccion.toFixed(2)}
                    sub="escala 5 estrellas"
                    color="#D85A30"
                />

                <StatCard
                    label="Recomendación"
                    value={resumen.recomendacion.toFixed(2)}
                    sub="NPS distribuidor"
                    color="#7F77DD"
                />

                <StatCard
                    label="Producto"
                    value={resumen.producto.toFixed(2)}
                    sub="satisfacción producto"
                    color="#F0A500"
                />

                <StatCard
                    label="Comentarios"
                    value={numero(resumen.comentarios)}
                    sub="con texto capturado"
                    color="#D4537E"
                />
            </div>

            {vista === "tabla" ? (
                <VistaTabla datos={datosFiltrados} />
            ) : (
                <VistaGraficas datos={datosFiltrados} labelPeriodo={labelPeriodo} />
            )}
            <ResumenIAModal
                open={mostrarResumenIA}
                onClose={() => setMostrarResumenIA(false)}
                loading={cargandoResumenIA}
                error={errorResumenIA}
                data={resumenIA}
                titulo="Ventas"
            />
        </div>
    );
}