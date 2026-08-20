// src/pages/Home.jsx
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Building2, CalendarDays, CarFront, CheckCircle2, ClipboardCheck, Gauge, Handshake, RefreshCw, Route, Sparkles, Target, TriangleAlert, Trophy, UserRound, Users } from "lucide-react";

import vwDark from "../assets/vw_dark.png";
import { api as apiDigitales } from "../lib/apiPruebas";
import { api as apiConformidad } from "../lib/api";
import { apiCitas } from "../lib/apiCitas";
import { apiTraficoPiso } from "../lib/apiTraficoPiso";
import { apiPruebaManejo } from "../lib/apiPruebaManejo";
import { apiEntregas } from "../lib/apiEntregas";
import { apiEncuestas } from "../lib/apiEncuestas";
import { getAccessToken, http } from "../lib/apiClient";

const ECharts = lazy(() => import("echarts-for-react"));

const C = {
    navy: "#131E5C", navy2: "#1D318D", blue: "#3566D6", cyan: "#30A7C5", green: "#1A8F68", amber: "#C98B18",
    orange: "#D56835", red: "#C04444", purple: "#7357B8", ink: "#172033", muted: "#6B7280", border: "#E1E6EF", soft: "#F5F7FB", white: "#FFFFFF",
};

const PALETA = [C.navy, C.blue, C.green, C.amber, C.purple, C.cyan, C.orange, C.red];
const CACHE_TTL = 5 * 60 * 1000;

const DATOS_VACIOS = {
    prospectos: [], citas: [], traficoPiso: [], pruebas: [], entregas: [], encuestas: [], casos: [],
};

const FILTROS_INICIALES = {
    fechaInicio: "", fechaFin: "", agencia: "todas", asesorDigital: "todos", asesorPiso: "todos",
};

const CAMPOS = {
    prospectos: { fecha: ["creado", "primer_contacto_at", "ultimo_contacto_at", "actualizado"], agencia: ["agencia", "sucursal", "dealer"] },
    citas: { fecha: ["fecha_hora_cita", "creado_en", "fecha"], agencia: ["agencia", "sucursal", "dealer"] },
    traficoPiso: { fecha: ["fecha_hora_cita", "creado_en", "fecha"], agencia: ["agencia", "sucursal", "dealer"] },
    pruebas: { fecha: ["fecha_hora_cita", "creado_en", "fecha"], agencia: ["agencia", "sucursal", "dealer"] },
    entregas: { fecha: ["fecha_hora_entrega", "creado_en", "fecha"], agencia: ["agencia", "sucursal", "dealer"] },
    encuestas: { fecha: ["creado", "created_at", "creado_en", "fecha"], agencia: ["agencia", "sucursal", "dealer"] },
    casos: { fecha: ["fecha_reclamacion", "fecha_atencion", "creado_en", "creado", "fecha"], agencia: ["agencia", "sucursal", "dealer", "distribuidor"] },
};

function cls(...valores) { return valores.filter(Boolean).join(" "); }

function texto(valor, fallback = "") {
    const value = String(valor ?? "").trim();
    return value || fallback;
}

function num(valor) {
    const value = Number(valor ?? 0);
    return Number.isFinite(value) ? value : 0;
}

function limitar(valor, min = 0, max = 100) { return Math.min(max, Math.max(min, num(valor))); }
function porcentaje(parte, total) { return total ? (num(parte) / num(total)) * 100 : 0; }
function fmt(valor) { return new Intl.NumberFormat("es-MX").format(num(valor)); }
function fmtPct(valor) { return `${num(valor).toFixed(1)}%`; }
function fmtDecimal(valor, decimales = 1) { return num(valor).toFixed(decimales); }

function campo(item, campos = [], fallback = "") {
    for (const key of campos) {
        const value = item?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return fallback;
}

function fechaSegura(valor) {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function fechaItem(item, modulo) { return fechaSegura(campo(item, CAMPOS[modulo]?.fecha)); }
function agenciaItem(item, modulo) { return texto(campo(item, CAMPOS[modulo]?.agencia), "Sin agencia"); }

function fechaInput(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function rangoDias(dias) {
    if (!dias) return { fechaInicio: "", fechaFin: "" };
    const fin = new Date(), inicio = new Date();
    inicio.setDate(inicio.getDate() - dias + 1);
    return { fechaInicio: fechaInput(inicio), fechaFin: fechaInput(fin) };
}

function enRango(fecha, inicio, fin) {
    if (!inicio && !fin) return true;
    if (!fecha) return false;
    const desde = inicio ? new Date(`${inicio}T00:00:00`) : null;
    const hasta = fin ? new Date(`${fin}T23:59:59.999`) : null;
    return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
}

function esSi(valor) {
    if (valor === true || valor === 1) return true;
    return ["1", "true", "si", "sí", "yes", "asistio", "asistió", "entregada", "reportada"].includes(texto(valor).toLowerCase());
}

function entregaRealizada(item) { return esSi(item?.entrega_reportada ?? item?.entregada ?? item?.realizada); }
function asesorDigital(item) { return texto(item?.asesor_digital, "Sin asignar"); }
function asesorPiso(item) { return texto(item?.asesor_piso ?? item?.asesor_ventas ?? item?.asesor_asignado, "Sin asignar"); }
function asesorEntrega(item) { return texto(item?.asesor_ventas ?? item?.asesor_piso, "Sin asignar"); }

function normalizarSiguiente(url) {
    if (!url) return "";
    try {
        const parsed = new URL(String(url), window.location.origin);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return String(url).replace(/^https?:\/\/[^/]+/i, "");
    }
}

function listaPayload(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

async function cargarCompleto(loader) {
    const primero = await loader();
    if (Array.isArray(primero)) return primero;

    const resultados = [...listaPayload(primero)];
    let next = normalizarSiguiente(primero?.next);
    const visitados = new Set();

    while (next && !visitados.has(next)) {
        visitados.add(next);
        const pagina = await http(next);
        resultados.push(...listaPayload(pagina));
        next = normalizarSiguiente(pagina?.next);
    }

    return resultados;
}

function cacheKey() {
    const token = getAccessToken?.() || "";
    return `crm-home-analitica-v8-${token ? token.slice(-16) : "anon"}`;
}

function leerCache() {
    try {
        const raw = sessionStorage.getItem(cacheKey());
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL) return null;
        return parsed.data || null;
    } catch {
        return null;
    }
}

function guardarCache(data) {
    try {
        sessionStorage.setItem(cacheKey(), JSON.stringify({ ts: Date.now(), data }));
    } catch {
        // El dashboard sigue funcionando aunque sessionStorage esté lleno.
    }
}

function filtrarBase(data, filtros) {
    const salida = {};

    Object.keys(DATOS_VACIOS).forEach(modulo => {
        salida[modulo] = (data[modulo] || []).filter(item => {
            const fecha = fechaItem(item, modulo);
            if (!enRango(fecha, filtros.fechaInicio, filtros.fechaFin)) return false;
            if (filtros.agencia !== "todas" && agenciaItem(item, modulo) !== filtros.agencia) return false;
            return true;
        });
    });

    return salida;
}

function agrupar(lista, obtenerValor) {
    const map = new Map();

    lista.forEach(item => {
        const key = texto(obtenerValor(item), "Sin dato");
        map.set(key, (map.get(key) || 0) + 1);
    });

    return [...map.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

function puntuacionEncuesta(encuesta) {
    const campos = ["atencion_asesor", "seguimiento_asesor", "tiempo_entrega_unidad", "experiencia_recepcion"];
    const valores = campos.map(key => Number(encuesta?.[key])).filter(Number.isFinite);
    if (!valores.length) return null;
    return valores.reduce((total, value) => total + value, 0) / valores.length;
}

function inicioBucket(fecha, modo) {
    const nueva = new Date(fecha);
    nueva.setHours(0, 0, 0, 0);

    if (modo === "semana") {
        const dia = (nueva.getDay() + 6) % 7;
        nueva.setDate(nueva.getDate() - dia);
    }

    if (modo === "mes") nueva.setDate(1);
    return nueva;
}

function avanzarBucket(fecha, modo) {
    const nueva = new Date(fecha);

    if (modo === "dia") nueva.setDate(nueva.getDate() + 1);
    else if (modo === "semana") nueva.setDate(nueva.getDate() + 7);
    else nueva.setMonth(nueva.getMonth() + 1);

    return nueva;
}

function keyBucket(fecha, modo) {
    if (modo === "mes") return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    return fechaInput(fecha);
}

function labelBucket(fecha, modo) {
    if (modo === "mes") {
        return new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" }).format(fecha).replace(".", "");
    }

    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(fecha).replace(".", "");
}

function construirTimeline(base, filtros) {
    const fechas = Object.entries(base).flatMap(([modulo, lista]) => lista.map(item => fechaItem(item, modulo)).filter(Boolean));

    let inicio = filtros.fechaInicio ? new Date(`${filtros.fechaInicio}T00:00:00`) : null;
    let fin = filtros.fechaFin ? new Date(`${filtros.fechaFin}T23:59:59.999`) : null;

    if (!inicio && fechas.length) inicio = new Date(Math.min(...fechas.map(fecha => fecha.getTime())));
    if (!fin && fechas.length) fin = new Date(Math.max(...fechas.map(fecha => fecha.getTime())));

    if (!inicio || !fin) {
        fin = new Date();
        inicio = new Date();
        inicio.setDate(inicio.getDate() - 179);
    }

    const dias = Math.max(1, Math.ceil((fin - inicio) / 86400000));

    // Se mantiene detalle diario hasta 2 años.
    // Con esto ya no salta cada 7 días en los rangos normales del dashboard.
    const modo = dias <= 730 ? "dia" : "mes";

    let cursor = inicioBucket(inicio, modo);
    const final = inicioBucket(fin, modo), buckets = [];

    while (cursor <= final && buckets.length < 900) {
        buckets.push({
            key: keyBucket(cursor, modo),
            label: labelBucket(cursor, modo),
            prospectos: 0,
            citas: 0,
            traficoPiso: 0,
            pruebas: 0,
            entregas: 0,
        });
        cursor = avanzarBucket(cursor, modo);
    }

    const map = new Map(buckets.map(bucket => [bucket.key, bucket]));

    const agregar = (lista, modulo, key, filtro = () => true) => {
        lista.forEach(item => {
            if (!filtro(item)) return;

            const fecha = fechaItem(item, modulo);
            if (!fecha) return;

            const bucket = map.get(keyBucket(inicioBucket(fecha, modo), modo));
            if (bucket) bucket[key]++;
        });
    };

    agregar(base.prospectos, "prospectos", "prospectos");
    agregar(base.citas, "citas", "citas");
    agregar(base.traficoPiso, "traficoPiso", "traficoPiso");
    agregar(base.pruebas, "pruebas", "pruebas");
    agregar(base.entregas, "entregas", "entregas", entregaRealizada);

    return { modo, buckets };
}

function rankingDigital(base, seleccionado = "todos") {
    const map = new Map();

    const obtener = nombre => {
        const key = texto(nombre, "Sin asignar");

        if (!map.has(key)) {
            map.set(key, {
                asesor: key,
                prospectos: 0,
                citas: 0,
                asistencias: 0,
                handoff: 0,
                score: 0,
            });
        }

        return map.get(key);
    };

    base.prospectos.forEach(item => obtener(asesorDigital(item)).prospectos++);

    base.citas.forEach(item => {
        const asesor = obtener(asesorDigital(item));
        asesor.citas++;

        if (esSi(item?.asistencia)) asesor.asistencias++;
        if (texto(item?.asesor_piso ?? item?.asesor_asignado)) asesor.handoff++;
    });

    const rows = [...map.values()].filter(item => item.asesor !== "Sin asignar");
    const maxVol = Math.max(1, ...rows.map(item => item.prospectos));

    rows.forEach(item => {
        item.conversionCita = porcentaje(item.citas, item.prospectos);
        item.asistencia = porcentaje(item.asistencias, item.citas);
        item.tasaHandoff = porcentaje(item.handoff, item.citas);

        /*
         * Score digital:
         * 40% conversión prospecto -> cita
         * 30% asistencia
         * 20% handoff a asesor de piso
         * 10% volumen relativo
         */
        item.score = limitar(
            item.conversionCita * 0.40 +
            item.asistencia * 0.30 +
            item.tasaHandoff * 0.20 +
            porcentaje(item.prospectos, maxVol) * 0.10
        );
    });

    const filtradas = seleccionado === "todos" ? rows : rows.filter(item => item.asesor === seleccionado);
    return filtradas.sort((a, b) => b.score - a.score);
}

function rankingPiso(base, seleccionado = "todos") {
    const map = new Map();

    const obtener = nombre => {
        const key = texto(nombre, "Sin asignar");

        if (!map.has(key)) {
            map.set(key, {
                asesor: key,
                citas: 0,
                citasAsistidas: 0,
                trafico: 0,
                pruebas: 0,
                pruebasAsistidas: 0,
                entregas: 0,
                score: 0,
            });
        }

        return map.get(key);
    };

    base.citas.forEach(item => {
        const asesor = obtener(asesorPiso(item));
        asesor.citas++;
        if (esSi(item?.asistencia)) asesor.citasAsistidas++;
    });

    base.traficoPiso.forEach(item => obtener(asesorPiso(item)).trafico++);

    base.pruebas.forEach(item => {
        const asesor = obtener(asesorPiso(item));
        asesor.pruebas++;
        if (esSi(item?.asistencia)) asesor.pruebasAsistidas++;
    });

    base.entregas.filter(entregaRealizada).forEach(item => obtener(asesorEntrega(item)).entregas++);

    const rows = [...map.values()].filter(item => item.asesor !== "Sin asignar");
    const maxTrafico = Math.max(1, ...rows.map(item => item.trafico));
    const maxPruebas = Math.max(1, ...rows.map(item => item.pruebasAsistidas));
    const maxEntregas = Math.max(1, ...rows.map(item => item.entregas));

    rows.forEach(item => {
        item.tasaAsistencia = porcentaje(item.citasAsistidas, item.citas);
        item.pruebaPorTrafico = porcentaje(item.pruebasAsistidas, item.trafico);
        item.entregaPorTrafico = porcentaje(item.entregas, item.trafico);

        item.score = limitar(
            porcentaje(item.entregas, maxEntregas) * 0.30 +
            porcentaje(item.pruebasAsistidas, maxPruebas) * 0.25 +
            item.tasaAsistencia * 0.20 +
            porcentaje(item.trafico, maxTrafico) * 0.15 +
            limitar(item.entregaPorTrafico) * 0.10
        );
    });

    const filtradas = seleccionado === "todos" ? rows : rows.filter(item => item.asesor === seleccionado);
    return filtradas.sort((a, b) => b.score - a.score);
}

function construirHeatmapTrafico(lista) {
    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const horas = Array.from({ length: 13 }, (_, index) => index + 8);
    const map = new Map();

    lista.forEach(item => {
        const fecha = fechaItem(item, "traficoPiso");
        if (!fecha) return;

        const dia = (fecha.getDay() + 6) % 7;
        const hora = fecha.getHours();

        if (hora < 8 || hora > 20) return;

        const key = `${dia}-${hora}`;
        map.set(key, (map.get(key) || 0) + 1);
    });

    const data = [];

    dias.forEach((_, diaIndex) => {
        horas.forEach((hora, horaIndex) => {
            data.push([horaIndex, diaIndex, map.get(`${diaIndex}-${hora}`) || 0]);
        });
    });

    return {
        dias,
        horas: horas.map(hora => `${String(hora).padStart(2, "0")}:00`),
        data,
        max: Math.max(1, ...data.map(item => item[2])),
    };
}

function Grafica({ option, height = 320, onEvents }) {
    return (
        <Suspense fallback={<div className="animate-pulse rounded-2xl bg-slate-100" style={{ height }} />}>
            <ECharts
                option={option}
                style={{ width: "100%", height }}
                notMerge
                lazyUpdate
                onEvents={onEvents}
                opts={{ renderer: "canvas" }}
            />
        </Suspense>
    );
}

function ChartCard({ title, subtitle, action, children, className = "" }) {
    return (
        <section className={cls("min-w-0 overflow-hidden rounded-lg border border-[#131E5C]/10 bg-white shadow-[0_12px_35px_-30px_rgba(19,30,92,.5)]", className)}>
            <div className="flex flex-col gap-2 border-b border-[#131E5C]/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-[#131E5C]">{title}</h3>
                    {subtitle ? <p className="mt-1 text-[11px] leading-4 text-slate-500">{subtitle}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="p-3 sm:p-4">{children}</div>
        </section>
    );
}

function Kpi({ icon: Icon, title, value, detail, tone = C.navy, onClick, active = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cls(
                "group min-w-0 p-4 text-left shadow-[0_8px_25px_-22px_rgba(19,30,92,.55)] transition",
                onClick && "hover:-translate-y-0.5 hover:border-[#131E5C]/25 hover:shadow-md",
                active && "ring-2 ring-[#131E5C]/20"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${tone}12`, color: tone }}>
                    <Icon size={17} />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{title}</p>
                    <p className="mt-0.5 truncate text-2xl font-black tracking-tight text-[#131E5C]">{value}</p>
                </div>
            </div>

            <p className="mt-3 truncate border-t border-slate-100 pt-2 text-[11px] font-medium text-slate-500">{detail}</p>
        </button>
    );
}

function Badge({ children, tone = C.navy }) {
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: tone, backgroundColor: `${tone}12` }}>
            {children}
        </span>
    );
}

function Empty({ text }) {
    return (
        <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center text-sm text-slate-500">
            {text}
        </div>
    );
}

function Loading() {
    return (
        <div className="min-h-screen space-y-5">
            <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-3xl bg-slate-100" />
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-96 animate-pulse rounded-3xl bg-slate-100" />
                ))}
            </div>
        </div>
    );
}

function Select({ label, value, onChange, options, icon: Icon }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">
                {Icon ? <Icon size={12} /> : null}{label}
            </span>

            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#131E5C] outline-none transition focus:border-[#131E5C]"
            >
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
    );
}

function PanelFiltros({ filtros, setFiltros, agencias, digitales, piso }) {
    const rapido = dias => setFiltros(prev => ({ ...prev, ...rangoDias(dias) }));
    const limpiarSeleccion = () => setFiltros(prev => ({ ...prev, agencia: "todas", asesorDigital: "todos", asesorPiso: "todos" }));

    const BotonRango = ({ dias, children }) => {
        const rango = rangoDias(dias);
        const activo = filtros.fechaInicio === rango.fechaInicio && filtros.fechaFin === rango.fechaFin;

        return (
            <button
                type="button"
                onClick={() => rapido(dias)}
                className={cls(
                    "h-9 rounded-lg border px-2 text-[11px] font-black transition",
                    activo
                        ? "border-[#131E5C] bg-[#131E5C] text-white"
                        : "border-[#131E5C]/15 bg-white text-[#131E5C] hover:bg-[#131E5C]/5"
                )}
            >
                {children}
            </button>
        );
    };

    return (
        <aside className="rounded-2xl border border-[#131E5C]/10 bg-white shadow-[0_12px_35px_-28px_rgba(19,30,92,.55)]">
            <div className="border-b border-[#131E5C]/10 px-4 py-4">
                <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#131E5C]/10 text-[#131E5C]">
                        <Gauge size={16} />
                    </div>

                    <div>
                        <p className="text-sm font-black text-[#131E5C]">Filtros de análisis</p>
                        <p className="text-[10px] text-slate-400">Aplicación instantánea</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4">
                <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Periodo rápido</p>

                    <div className="grid grid-cols-4 gap-1.5">
                        <BotonRango dias={30}>30d</BotonRango>
                        <BotonRango dias={90}>90d</BotonRango>
                        <BotonRango dias={180}>180d</BotonRango>
                        <BotonRango dias={0}>Todo</BotonRango>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <label>
                        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Desde</span>
                        <input
                            type="date"
                            value={filtros.fechaInicio}
                            onChange={e => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-[#131E5C]"
                        />
                    </label>

                    <label>
                        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Hasta</span>
                        <input
                            type="date"
                            value={filtros.fechaFin}
                            onChange={e => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-[#131E5C]"
                        />
                    </label>
                </div>

                <Select
                    label="Agencia"
                    icon={Building2}
                    value={filtros.agencia}
                    onChange={value => setFiltros(prev => ({ ...prev, agencia: value }))}
                    options={[{ value: "todas", label: "Todas las agencias" }, ...agencias.map(value => ({ value, label: value }))]}
                />

                <Select
                    label="Asesor digital"
                    icon={UserRound}
                    value={filtros.asesorDigital}
                    onChange={value => setFiltros(prev => ({ ...prev, asesorDigital: value }))}
                    options={[{ value: "todos", label: "Todos los digitales" }, ...digitales.map(value => ({ value, label: value }))]}
                />

                <Select
                    label="Asesor de piso"
                    icon={Users}
                    value={filtros.asesorPiso}
                    onChange={value => setFiltros(prev => ({ ...prev, asesorPiso: value }))}
                    options={[{ value: "todos", label: "Todos los asesores" }, ...piso.map(value => ({ value, label: value }))]}
                />

                {(filtros.agencia !== "todas" || filtros.asesorDigital !== "todos" || filtros.asesorPiso !== "todos") ? (
                    <button
                        type="button"
                        onClick={limpiarSeleccion}
                        className="h-10 w-full rounded-lg border border-red-200 bg-red-50 text-xs font-black text-red-600 transition hover:bg-red-100"
                    >
                        Limpiar selección
                    </button>
                ) : null}
            </div>
        </aside>
    );
}

function TablaRanking({ data, tipo, onSelect }) {
    if (!data.length) return <Empty text="No hay suficientes registros atribuibles a asesores en este periodo." />;

    const digital = tipo === "digital";

    return (
        <div className="overflow-x-auto rounded-xl border border-[#131E5C]/10">
            <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-[#131E5C]/[.035]">
                    <tr className="border-b border-[#131E5C]/10 text-[10px] font-black uppercase tracking-wider text-[#131E5C]/65">
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Asesor</th>
                        <th className="px-3 py-3 text-right">{digital ? "Prospectos" : "Tráfico"}</th>
                        <th className="px-3 py-3 text-right">{digital ? "Citas" : "Pruebas"}</th>
                        <th className="px-3 py-3 text-right">{digital ? "Asistencia" : "Entregas"}</th>
                        <th className="px-3 py-3 text-right">{digital ? "Handoff" : "Conv. entrega"}</th>
                        <th className="px-3 py-3 text-right">Índice</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((row, index) => (
                        <tr
                            key={row.asesor}
                            onClick={() => onSelect?.(row.asesor)}
                            className="cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-[#131E5C]/[.025]"
                        >
                            <td className="px-3 py-3 font-black text-slate-400">{index + 1}</td>
                            <td className="max-w-[260px] truncate px-3 py-3 font-bold text-[#131E5C]">{row.asesor}</td>
                            <td className="px-3 py-3 text-right font-semibold">{fmt(digital ? row.prospectos : row.trafico)}</td>
                            <td className="px-3 py-3 text-right font-semibold">{fmt(digital ? row.citas : row.pruebasAsistidas)}</td>
                            <td className="px-3 py-3 text-right font-semibold">{digital ? fmtPct(row.asistencia) : fmt(row.entregas)}</td>
                            <td className="px-3 py-3 text-right font-semibold">{digital ? fmtPct(row.tasaHandoff) : fmtPct(row.entregaPorTrafico)}</td>

                            <td className="px-3 py-3 text-right">
                                <Badge tone={row.score >= 70 ? C.green : row.score >= 45 ? C.amber : C.red}>
                                    {fmtDecimal(row.score, 0)}/100
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EncabezadoVW({ totalCargado, refrescando, onActualizar }) {
    return (
        <header className="px-5 py-4 shadow-[0_10px_35px_-30px_rgba(19,30,92,.65)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <img src={vwDark} alt="Volkswagen" className="h-14 w-14 shrink-0 object-contain" />

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-black tracking-[-.03em] text-[#131E5C] sm:text-2xl">
                                Centro de rendimiento comercial
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="text-lg font-black leading-none text-[#131E5C]">{fmt(totalCargado)}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">registros cargados</p>
                    </div>

                    <button
                        type="button"
                        onClick={onActualizar}
                        disabled={refrescando}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#131E5C] bg-[#131E5C] px-4 text-xs font-black text-white transition hover:bg-[#0D174D] disabled:opacity-60"
                    >
                        <RefreshCw size={15} className={refrescando ? "animate-spin" : ""} />
                        Actualizar
                    </button>
                </div>
            </div>
        </header>
    );
}

export default function Home() {
    const [data, setData] = useState(DATOS_VACIOS);
    const [loading, setLoading] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [errores, setErrores] = useState([]);
    const [tab, setTab] = useState("resumen");
    const [filtros, setFiltros] = useState(() => ({ ...FILTROS_INICIALES, ...rangoDias(180) }));

    const cargar = useCallback(async ({ forzar = false } = {}) => {
        if (forzar) setRefrescando(true);
        else setLoading(true);

        try {
            if (!forzar) {
                const cache = leerCache();

                if (cache) {
                    setData(cache);
                    setLoading(false);
                    return;
                }
            }

            const tareas = {
                prospectos: () => cargarCompleto(() => apiDigitales.digitalesListProspectos({ todos: 1, ligero: 1, page_size: 500 })),
                citas: () => cargarCompleto(() => apiCitas.list({ page_size: 500 })),
                traficoPiso: () => cargarCompleto(() => apiTraficoPiso.list({ page_size: 500 })),
                pruebas: () => cargarCompleto(() => apiPruebaManejo.list({ page_size: 500 })),
                entregas: () => cargarCompleto(() => apiEntregas.list({ page_size: 500 })),
                encuestas: () => cargarCompleto(() => apiEncuestas.list()),
                casos: () => cargarCompleto(() => apiConformidad.listCasos()),
            };

            const entries = Object.entries(tareas);
            const resultados = await Promise.allSettled(entries.map(([, fn]) => fn()));
            const siguiente = { ...DATOS_VACIOS };
            const fallos = [];

            resultados.forEach((resultado, index) => {
                const key = entries[index][0];

                if (resultado.status === "fulfilled") {
                    siguiente[key] = Array.isArray(resultado.value) ? resultado.value : [];
                } else {
                    fallos.push(key);
                    console.error(`Error cargando ${key}:`, resultado.reason);
                }
            });

            setData(siguiente);
            setErrores(fallos);
            guardarCache(siguiente);
        } finally {
            setLoading(false);
            setRefrescando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    /*
     * Comportamiento toggle:
     * - primer clic aplica filtro
     * - segundo clic sobre el mismo elemento lo elimina
     */
    const alternarFiltro = useCallback((campo, valor, valorInicial) => {
        setFiltros(prev => ({ ...prev, [campo]: prev[campo] === valor ? valorInicial : valor }));
    }, []);

    /*
     * El filtro global considera fecha y agencia.
     * Los filtros por asesor solamente afectan sus respectivos rankings/gráficas.
     */
    const base = useMemo(() => filtrarBase(data, filtros), [
        data,
        filtros.fechaInicio,
        filtros.fechaFin,
        filtros.agencia,
    ]);

    const agencias = useMemo(() => {
        const set = new Set();

        Object.keys(DATOS_VACIOS).forEach(modulo => {
            (data[modulo] || []).forEach(item => {
                const agencia = agenciaItem(item, modulo);
                if (agencia !== "Sin agencia") set.add(agencia);
            });
        });

        return [...set].sort((a, b) => a.localeCompare(b, "es"));
    }, [data]);

    const digitales = useMemo(() => [
        ...new Set([
            ...data.prospectos.map(asesorDigital),
            ...data.citas.map(asesorDigital),
        ].filter(value => value !== "Sin asignar")),
    ].sort((a, b) => a.localeCompare(b, "es")), [data]);

    const piso = useMemo(() => [
        ...new Set([
            ...data.citas.map(asesorPiso),
            ...data.traficoPiso.map(asesorPiso),
            ...data.pruebas.map(asesorPiso),
            ...data.entregas.map(asesorEntrega),
        ].filter(value => value !== "Sin asignar")),
    ].sort((a, b) => a.localeCompare(b, "es")), [data]);

    const analitica = useMemo(() => {
        const entregasRealizadas = base.entregas.filter(entregaRealizada);
        const pruebasRealizadas = base.pruebas.filter(item => esSi(item?.asistencia));
        const citasAsistidas = base.citas.filter(item => esSi(item?.asistencia));
        const encuestasConScore = base.encuestas.map(puntuacionEncuesta).filter(value => value !== null);

        const satisfaccion = encuestasConScore.length
            ? encuestasConScore.reduce((total, value) => total + value, 0) / encuestasConScore.length
            : 0;

        const estadosCerrados = new Set([
            "cerrado", "cerrada", "resuelto", "resuelta", "solucionado",
            "solucionada", "finalizado", "finalizada", "concluido", "concluida",
        ]);

        const casosAbiertos = base.casos.filter(item => !estadosCerrados.has(texto(item?.estado).toLowerCase())).length;
        const digital = rankingDigital(base, filtros.asesorDigital);
        const floor = rankingPiso(base, filtros.asesorPiso);
        const timeline = construirTimeline(base, filtros);
        const porAgencia = new Map();

        const obtenerAgencia = agencia => {
            const key = texto(agencia, "Sin agencia");

            if (!porAgencia.has(key)) {
                porAgencia.set(key, {
                    agencia: key,
                    prospectos: 0,
                    citas: 0,
                    trafico: 0,
                    pruebas: 0,
                    entregas: 0,
                });
            }

            return porAgencia.get(key);
        };

        base.prospectos.forEach(item => obtenerAgencia(agenciaItem(item, "prospectos")).prospectos++);
        base.citas.forEach(item => obtenerAgencia(agenciaItem(item, "citas")).citas++);
        base.traficoPiso.forEach(item => obtenerAgencia(agenciaItem(item, "traficoPiso")).trafico++);
        pruebasRealizadas.forEach(item => obtenerAgencia(agenciaItem(item, "pruebas")).pruebas++);
        entregasRealizadas.forEach(item => obtenerAgencia(agenciaItem(item, "entregas")).entregas++);

        const agenciasPerf = [...porAgencia.values()]
            .filter(item => item.agencia !== "Sin agencia")
            .sort((a, b) => b.entregas - a.entregas || b.trafico - a.trafico);

        return {
            entregasRealizadas,
            pruebasRealizadas,
            citasAsistidas,
            satisfaccion,
            casosAbiertos,
            digital,
            floor,
            timeline,
            agenciasPerf,

            estados: agrupar(base.prospectos, item => item?.estado).slice(0, 8),

            vehiculos: agrupar(
                [...base.prospectos, ...base.citas, ...base.traficoPiso],
                item => item?.auto_interes ?? item?.modelo_version
            ).slice(0, 10),

            heatmap: construirHeatmapTrafico(base.traficoPiso),

            resumen: {
                prospectos: base.prospectos.length,
                citas: base.citas.length,
                trafico: base.traficoPiso.length,
                pruebas: pruebasRealizadas.length,
                entregas: entregasRealizadas.length,

                asistenciaCitas: porcentaje(citasAsistidas.length, base.citas.length),
                citaPorProspecto: porcentaje(base.citas.length, base.prospectos.length),
                pruebaPorTrafico: porcentaje(pruebasRealizadas.length, base.traficoPiso.length),
                entregaPorTrafico: porcentaje(entregasRealizadas.length, base.traficoPiso.length),

                satisfaccion,
                encuestas: base.encuestas.length,
                casosAbiertos,
            },
        };
    }, [base, filtros.asesorDigital, filtros.asesorPiso]);

    const opciones = useMemo(() => {
        const grid = {
            left: 45,
            right: 20,
            top: 35,
            bottom: 45,
            containLabel: true,
        };

        const toolbox = {
            right: 4,
            top: 0,
            feature: {
                saveAsImage: { title: "Guardar imagen", pixelRatio: 2 },
                restore: { title: "Restaurar" },
            },
            iconStyle: { borderColor: "#9AA2B5" },
        };

        /*
         * Tendencia:
         * triggerOn mousemove actualiza el tooltip al recorrer la línea.
         * El timeline ya viene agrupado por día en periodos <= 2 años.
         */
        const timeline = {
            color: PALETA,
            animationDuration: 300,
            animationDurationUpdate: 120,

            tooltip: {
                trigger: "axis",
                triggerOn: "mousemove|click",
                transitionDuration: 0,
                confine: true,
                backgroundColor: "rgba(255,255,255,.97)",
                borderColor: "#DDE2EC",
                borderWidth: 1,
                textStyle: { color: C.ink, fontSize: 11 },
                axisPointer: {
                    type: "line",
                    snap: true,
                    lineStyle: { color: C.navy, width: 1, type: "dashed" },
                },
            },

            legend: {
                bottom: 0,
                textStyle: { color: C.muted, fontSize: 10 },
            },

            toolbox,
            grid: { ...grid, bottom: 62 },

            xAxis: {
                type: "category",
                boundaryGap: false,
                data: analitica.timeline.buckets.map(item => item.label),

                axisLabel: {
                    color: C.muted,
                    fontSize: 9,
                    hideOverlap: true,
                },

                axisLine: { lineStyle: { color: C.border } },
                axisTick: { show: false },
                axisPointer: { show: true, snap: true },
            },

            yAxis: {
                type: "value",
                axisLabel: { color: C.muted, fontSize: 10 },
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            dataZoom: [
                {
                    type: "inside",
                    zoomOnMouseWheel: true,
                    moveOnMouseMove: true,
                },
                {
                    type: "slider",
                    height: 14,
                    bottom: 28,
                    borderColor: "transparent",
                    fillerColor: "#CCD6F2",
                    backgroundColor: "#F0F2F7",
                    handleStyle: { color: C.navy },
                    moveHandleStyle: { color: C.navy },
                },
            ],

            series: [
                ["Prospectos", "prospectos", C.navy],
                ["Citas", "citas", C.blue],
                ["Tráfico de piso", "traficoPiso", C.amber],
                ["Pruebas", "pruebas", C.green],
                ["Entregas", "entregas", C.purple],
            ].map(([name, key, color]) => ({
                name,
                type: "line",
                smooth: 0.25,
                showSymbol: false,
                symbol: "circle",
                symbolSize: 7,

                emphasis: {
                    focus: "series",
                    scale: true,
                },

                lineStyle: {
                    width: 2.3,
                    color,
                },

                itemStyle: { color },

                areaStyle: key === "prospectos"
                    ? { color: `${color}0D` }
                    : undefined,

                data: analitica.timeline.buckets.map(item => item[key]),
            })),
        };

        /*
         * Embudo visual normalizado.
         *
         * El width visual no utiliza el volumen real porque estos módulos
         * no representan obligatoriamente una misma cohorte.
         * realValue conserva y muestra el dato verdadero.
         */
        const etapasEmbudo = [
            { name: "Prospectos", value: 100, realValue: analitica.resumen.prospectos, color: C.navy },
            { name: "Citas", value: 82, realValue: analitica.resumen.citas, color: C.blue },
            { name: "Tráfico de piso", value: 64, realValue: analitica.resumen.trafico, color: C.amber },
            { name: "Pruebas realizadas", value: 46, realValue: analitica.resumen.pruebas, color: C.green },
            { name: "Entregas realizadas", value: 30, realValue: analitica.resumen.entregas, color: C.purple },
        ];

        const embudo = {
            tooltip: {
                trigger: "item",
                confine: true,
                formatter: params => `<b>${params.name}</b><br/>${fmt(params.data.realValue)} registros`,
            },

            toolbox,

            series: [{
                type: "funnel",
                top: 26,
                bottom: 16,
                left: "12%",
                width: "76%",
                minSize: "30%",
                maxSize: "100%",
                sort: "none",
                gap: 5,
                funnelAlign: "center",

                label: {
                    show: true,
                    position: "inside",
                    formatter: params => `${params.name}\n${fmt(params.data.realValue)}`,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 11,
                    lineHeight: 14,
                },

                labelLine: { show: false },

                itemStyle: {
                    borderColor: "#fff",
                    borderWidth: 3,
                    borderRadius: 4,
                },

                emphasis: {
                    label: { fontSize: 12 },
                    itemStyle: {
                        shadowBlur: 12,
                        shadowColor: "rgba(19,30,92,.18)",
                    },
                },

                data: etapasEmbudo.map(item => ({
                    name: item.name,
                    value: item.value,
                    realValue: item.realValue,
                    itemStyle: { color: item.color },
                })),
            }],
        };

        const agenciasChart = {
            color: [C.navy, C.blue, C.amber, C.green, C.purple],

            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
            },

            legend: {
                bottom: 0,
                textStyle: { fontSize: 10 },
            },

            toolbox,
            grid: { ...grid, bottom: 55 },

            xAxis: {
                type: "category",
                data: analitica.agenciasPerf.map(item => item.agencia),

                axisLabel: {
                    interval: 0,
                    rotate: analitica.agenciasPerf.length > 5 ? 28 : 0,
                    fontSize: 9,
                    color: C.muted,
                },
            },

            yAxis: {
                type: "value",
                splitLine: { lineStyle: { color: "#EEF0F5" } },
                axisLabel: { color: C.muted, fontSize: 10 },
            },

            series: [
                ["Prospectos", "prospectos"],
                ["Citas", "citas"],
                ["Tráfico", "trafico"],
                ["Pruebas", "pruebas"],
                ["Entregas", "entregas"],
            ].map(([name, key]) => ({
                name,
                type: "bar",
                barMaxWidth: 24,
                emphasis: { focus: "series" },
                data: analitica.agenciasPerf.map(item => item[key]),
            })),
        };

        const estados = {
            color: PALETA,

            tooltip: {
                trigger: "item",
                formatter: "{b}<br/>{c} · {d}%",
            },

            toolbox,

            legend: {
                type: "scroll",
                bottom: 0,
                textStyle: {
                    fontSize: 10,
                    color: C.muted,
                },
            },

            series: [{
                type: "pie",
                radius: ["48%", "72%"],
                center: ["50%", "45%"],
                minAngle: 4,

                itemStyle: {
                    borderColor: "#fff",
                    borderWidth: 3,
                    borderRadius: 7,
                },

                label: { show: false },

                emphasis: {
                    label: {
                        show: true,
                        formatter: "{b}\n{d}%",
                        fontWeight: 700,
                    },
                },

                data: analitica.estados,
            }],
        };

        const vehiculos = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
            },

            toolbox,
            grid,

            xAxis: {
                type: "value",
                splitLine: { lineStyle: { color: "#EEF0F5" } },
                axisLabel: { color: C.muted, fontSize: 10 },
            },

            yAxis: {
                type: "category",
                inverse: true,
                data: analitica.vehiculos.map(item => item.name),

                axisLabel: {
                    width: 110,
                    overflow: "truncate",
                    color: C.muted,
                    fontSize: 10,
                },
            },

            series: [{
                type: "bar",

                data: analitica.vehiculos.map((item, index) => ({
                    value: item.value,
                    itemStyle: {
                        color: PALETA[index % PALETA.length],
                        borderRadius: [0, 8, 8, 0],
                    },
                })),

                barMaxWidth: 18,

                label: {
                    show: true,
                    position: "right",
                    color: C.ink,
                    fontWeight: 700,
                    fontSize: 10,
                },
            }],
        };

        const digitalBars = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
            },

            toolbox,

            legend: {
                bottom: 0,
                textStyle: { fontSize: 10 },
            },

            grid: {
                ...grid,
                left: 130,
                bottom: 50,
            },

            xAxis: {
                type: "value",
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            yAxis: {
                type: "category",
                inverse: true,
                data: analitica.digital.slice(0, 10).map(item => item.asesor),

                axisLabel: {
                    width: 110,
                    overflow: "truncate",
                    fontSize: 10,
                    color: C.muted,
                },
            },

            series: [
                {
                    name: "Prospectos",
                    type: "bar",
                    data: analitica.digital.slice(0, 10).map(item => item.prospectos),
                    itemStyle: { color: C.navy, borderRadius: [0, 6, 6, 0] },
                },
                {
                    name: "Citas",
                    type: "bar",
                    data: analitica.digital.slice(0, 10).map(item => item.citas),
                    itemStyle: { color: C.blue, borderRadius: [0, 6, 6, 0] },
                },
                {
                    name: "Asistencias",
                    type: "bar",
                    data: analitica.digital.slice(0, 10).map(item => item.asistencias),
                    itemStyle: { color: C.green, borderRadius: [0, 6, 6, 0] },
                },
            ],
        };

        const digitalScatter = {
            tooltip: {
                formatter: params =>
                    `${params.data.name}<br/>` +
                    `Prospectos: ${params.data.value[0]}<br/>` +
                    `Conversión a cita: ${fmtPct(params.data.value[1])}<br/>` +
                    `Asistencias: ${params.data.value[2]}<br/>` +
                    `Índice: ${fmtDecimal(params.data.score, 0)}/100`,
            },

            toolbox,
            grid,

            xAxis: {
                name: "Prospectos",
                nameLocation: "middle",
                nameGap: 28,
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            yAxis: {
                name: "Conversión a cita %",
                nameLocation: "middle",
                nameGap: 42,
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            series: [{
                type: "scatter",

                data: analitica.digital.map(item => ({
                    name: item.asesor,
                    score: item.score,
                    value: [item.prospectos, item.conversionCita, item.asistencias],
                    symbolSize: 12 + Math.min(32, item.asistencias * 2),

                    itemStyle: {
                        color: item.score >= 70 ? C.green : item.score >= 45 ? C.amber : C.red,
                        opacity: 0.8,
                    },
                })),

                emphasis: {
                    focus: "series",
                    scale: 1.25,
                },
            }],
        };

        const pisoBars = {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
            },

            toolbox,

            legend: {
                bottom: 0,
                textStyle: { fontSize: 10 },
            },

            grid: {
                ...grid,
                left: 130,
                bottom: 50,
            },

            xAxis: {
                type: "value",
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            yAxis: {
                type: "category",
                inverse: true,
                data: analitica.floor.slice(0, 10).map(item => item.asesor),

                axisLabel: {
                    width: 110,
                    overflow: "truncate",
                    fontSize: 10,
                    color: C.muted,
                },
            },

            series: [
                {
                    name: "Tráfico de piso",
                    type: "bar",
                    data: analitica.floor.slice(0, 10).map(item => item.trafico),
                    itemStyle: { color: C.amber, borderRadius: [0, 6, 6, 0] },
                },
                {
                    name: "Pruebas realizadas",
                    type: "bar",
                    data: analitica.floor.slice(0, 10).map(item => item.pruebasAsistidas),
                    itemStyle: { color: C.green, borderRadius: [0, 6, 6, 0] },
                },
                {
                    name: "Entregas",
                    type: "bar",
                    data: analitica.floor.slice(0, 10).map(item => item.entregas),
                    itemStyle: { color: C.purple, borderRadius: [0, 6, 6, 0] },
                },
            ],
        };

        const pisoScatter = {
            tooltip: {
                formatter: params =>
                    `${params.data.name}<br/>` +
                    `Tráfico: ${params.data.value[0]}<br/>` +
                    `Entregas: ${params.data.value[1]}<br/>` +
                    `Pruebas: ${params.data.value[2]}<br/>` +
                    `Índice: ${fmtDecimal(params.data.score, 0)}/100`,
            },

            toolbox,
            grid,

            xAxis: {
                name: "Tráfico de piso",
                nameLocation: "middle",
                nameGap: 28,
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            yAxis: {
                name: "Entregas realizadas",
                nameLocation: "middle",
                nameGap: 35,
                splitLine: { lineStyle: { color: "#EEF0F5" } },
            },

            series: [{
                type: "scatter",

                data: analitica.floor.map(item => ({
                    name: item.asesor,
                    score: item.score,
                    value: [item.trafico, item.entregas, item.pruebasAsistidas],
                    symbolSize: 12 + Math.min(34, item.pruebasAsistidas * 2.5),

                    itemStyle: {
                        color: item.score >= 70 ? C.green : item.score >= 45 ? C.amber : C.red,
                        opacity: 0.82,
                    },
                })),

                emphasis: { scale: 1.25 },
            }],
        };

        const heat = {
            tooltip: {
                formatter: params =>
                    `${analitica.heatmap.dias[params.value[1]]} ${analitica.heatmap.horas[params.value[0]]}<br/>${params.value[2]} registros de tráfico`,
            },

            toolbox,

            grid: {
                left: 45,
                right: 25,
                top: 20,
                bottom: 55,
            },

            xAxis: {
                type: "category",
                data: analitica.heatmap.horas,
                splitArea: { show: true },

                axisLabel: {
                    fontSize: 9,
                    rotate: 35,
                    color: C.muted,
                },
            },

            yAxis: {
                type: "category",
                data: analitica.heatmap.dias,
                splitArea: { show: true },

                axisLabel: {
                    fontSize: 10,
                    color: C.muted,
                },
            },

            visualMap: {
                min: 0,
                max: analitica.heatmap.max,
                calculable: true,
                orient: "horizontal",
                left: "center",
                bottom: 0,

                inRange: {
                    color: ["#F2F5FC", "#9EB7EE", C.navy],
                },

                textStyle: {
                    fontSize: 9,
                    color: C.muted,
                },
            },

            series: [{
                type: "heatmap",
                data: analitica.heatmap.data,

                label: {
                    show: analitica.heatmap.max < 25,
                    fontSize: 9,
                },

                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: "rgba(0,0,0,.18)",
                    },
                },
            }],
        };

        return {
            timeline,
            embudo,
            agenciasChart,
            estados,
            vehiculos,
            digitalBars,
            digitalScatter,
            pisoBars,
            pisoScatter,
            heat,
        };
    }, [analitica]);

    if (loading) return <Loading />;

    const totalCargado = Object.values(data).reduce((total, lista) => total + lista.length, 0);
    const topDigital = analitica.digital[0];
    const topPiso = analitica.floor[0];

    const totDigital = analitica.digital.reduce((total, item) => ({
        prospectos: total.prospectos + item.prospectos,
        citas: total.citas + item.citas,
        asistencias: total.asistencias + item.asistencias,
        handoff: total.handoff + item.handoff,
    }), {
        prospectos: 0,
        citas: 0,
        asistencias: 0,
        handoff: 0,
    });

    const totPiso = analitica.floor.reduce((total, item) => ({
        trafico: total.trafico + item.trafico,
        pruebas: total.pruebas + item.pruebasAsistidas,
        entregas: total.entregas + item.entregas,
        citas: total.citas + item.citas,
        citasAsistidas: total.citasAsistidas + item.citasAsistidas,
    }), {
        trafico: 0,
        pruebas: 0,
        entregas: 0,
        citas: 0,
        citasAsistidas: 0,
    });

    const tabs = [
        { id: "resumen", label: "Resumen ejecutivo", icon: Gauge },
        { id: "digital", label: "Asesores digitales", icon: UserRound },
        { id: "piso", label: "Asesores de piso", icon: Users },
    ];

    return (
        <div className="min-h-screen space-y-5 pb-10 xl:pr-[340px]">
            <EncabezadoVW
                totalCargado={totalCargado}
                refrescando={refrescando}
                onActualizar={() => cargar({ forzar: true })}
            />

            {/* Filtros permanentes a la derecha en escritorio */}
            <div className="fixed right-4 top-24 z-30 hidden w-[320px] max-h-[calc(100vh-7rem)] overflow-y-auto xl:block">
                <PanelFiltros
                    filtros={filtros}
                    setFiltros={setFiltros}
                    agencias={agencias}
                    digitales={digitales}
                    piso={piso}
                />
            </div>

            {errores.length ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <TriangleAlert size={18} className="mt-0.5 shrink-0" />

                    <div>
                        <p className="text-sm font-bold">El dashboard cargó parcialmente</p>
                        <p className="mt-1 text-xs">
                            No se pudieron consultar: {errores.join(", ")}. Los demás módulos siguen disponibles.
                        </p>
                    </div>
                </div>
            ) : null}

            {/* En resoluciones menores no se ocultan los filtros; pasan arriba del contenido */}
            <div className="xl:hidden">
                <PanelFiltros
                    filtros={filtros}
                    setFiltros={setFiltros}
                    agencias={agencias}
                    digitales={digitales}
                    piso={piso}
                />
            </div>

            <div
                className="flex gap-2 overflow-x-auto rounded-xl border border-[#131E5C]/10 bg-white p-1.5"
                style={{ borderColor: C.border }}
            >
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cls(
                            "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition",
                            tab === id ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                        )}
                        style={tab === id ? { backgroundColor: C.navy } : undefined}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {tab === "resumen" ? (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Kpi
                            icon={UserRound}
                            title="Prospectos"
                            value={fmt(analitica.resumen.prospectos)}
                            detail={`${fmtPct(analitica.resumen.citaPorProspecto)} generan cita`}
                            tone={C.navy}
                            onClick={() => setTab("digital")}
                        />

                        <Kpi
                            icon={CalendarDays}
                            title="Citas"
                            value={fmt(analitica.resumen.citas)}
                            detail={`${fmtPct(analitica.resumen.asistenciaCitas)} asistencia`}
                            tone={C.blue}
                            onClick={() => setTab("digital")}
                        />

                        <Kpi
                            icon={Route}
                            title="Tráfico de piso"
                            value={fmt(analitica.resumen.trafico)}
                            detail="Atención presencial registrada"
                            tone={C.amber}
                            onClick={() => setTab("piso")}
                        />

                        <Kpi
                            icon={CarFront}
                            title="Pruebas realizadas"
                            value={fmt(analitica.resumen.pruebas)}
                            detail={`${fmtPct(analitica.resumen.pruebaPorTrafico)} vs. tráfico`}
                            tone={C.green}
                            onClick={() => setTab("piso")}
                        />

                        <Kpi
                            icon={CheckCircle2}
                            title="Entregas realizadas"
                            value={fmt(analitica.resumen.entregas)}
                            detail={`${fmtPct(analitica.resumen.entregaPorTrafico)} vs. tráfico`}
                            tone={C.purple}
                            onClick={() => setTab("piso")}
                        />

                        <Kpi
                            icon={ClipboardCheck}
                            title="Satisfacción"
                            value={analitica.resumen.encuestas ? `${fmtDecimal(analitica.resumen.satisfaccion)}/5` : "—"}
                            detail={`${fmt(analitica.resumen.encuestas)} encuestas · ${fmt(analitica.resumen.casosAbiertos)} casos abiertos`}
                            tone={C.cyan}
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
                        <ChartCard title="Tendencia comercial consolidada">
                            <Grafica option={opciones.timeline} height={360} />
                        </ChartCard>

                        <ChartCard title="Embudo operativo">
                            <Grafica option={opciones.embudo} height={360} />
                        </ChartCard>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <ChartCard title="Rendimiento por agencia">
                            {analitica.agenciasPerf.length ? (
                                <Grafica
                                    option={opciones.agenciasChart}
                                    height={350}
                                    onEvents={{
                                        click: params => {
                                            if (params?.name) alternarFiltro("agencia", params.name, "todas");
                                        },
                                    }}
                                />
                            ) : (
                                <Empty text="No hay agencias suficientes para comparar." />
                            )}
                        </ChartCard>

                        <ChartCard title="Estado de prospectos">
                            {analitica.estados.length ? (
                                <Grafica option={opciones.estados} height={350} />
                            ) : (
                                <Empty text="No hay prospectos en el periodo seleccionado." />
                            )}
                        </ChartCard>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <ChartCard title="Demanda por vehículo">
                            {analitica.vehiculos.length ? (
                                <Grafica option={opciones.vehiculos} height={350} />
                            ) : (
                                <Empty text="No hay modelos o vehículos suficientes para analizar demanda." />
                            )}
                        </ChartCard>

                        <ChartCard title="Mapa horario de tráfico de piso">
                            {base.traficoPiso.length ? (
                                <Grafica option={opciones.heat} height={350} />
                            ) : (
                                <Empty text="No existen registros de tráfico de piso en este periodo." />
                            )}
                        </ChartCard>
                    </div>
                </>
            ) : null}

            {tab === "digital" ? (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Kpi
                            icon={Users}
                            title="Prospectos gestionados"
                            value={fmt(totDigital.prospectos)}
                            detail="Atribuidos a asesor digital"
                            tone={C.navy}
                        />

                        <Kpi
                            icon={CalendarDays}
                            title="Citas generadas"
                            value={fmt(totDigital.citas)}
                            detail={`${fmtPct(porcentaje(totDigital.citas, totDigital.prospectos))} conversión`}
                            tone={C.blue}
                        />

                        <Kpi
                            icon={CheckCircle2}
                            title="Citas asistidas"
                            value={fmt(totDigital.asistencias)}
                            detail={`${fmtPct(porcentaje(totDigital.asistencias, totDigital.citas))} asistencia`}
                            tone={C.green}
                        />

                        <Kpi
                            icon={Handshake}
                            title="Handoff a piso"
                            value={fmt(totDigital.handoff)}
                            detail={`${fmtPct(porcentaje(totDigital.handoff, totDigital.citas))} de citas`}
                            tone={C.cyan}
                        />

                        <Kpi
                            icon={Target}
                            title="Conversión a cita"
                            value={fmtPct(porcentaje(totDigital.citas, totDigital.prospectos))}
                            detail="Citas / prospectos"
                            tone={C.amber}
                        />

                        <Kpi
                            icon={Trophy}
                            title="Mejor índice"
                            value={topDigital ? fmtDecimal(topDigital.score, 0) : "—"}
                            detail={topDigital?.asesor || "Sin datos"}
                            tone={C.purple}
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <ChartCard title="Producción por asesor digital">
                            {analitica.digital.length ? (
                                <Grafica
                                    option={opciones.digitalBars}
                                    height={390}
                                    onEvents={{
                                        click: params => {
                                            if (params?.name) alternarFiltro("asesorDigital", params.name, "todos");
                                        },
                                    }}
                                />
                            ) : (
                                <Empty text="No hay datos atribuibles a asesores digitales." />
                            )}
                        </ChartCard>

                        <ChartCard title="Matriz volumen vs. conversión">
                            {analitica.digital.length ? (
                                <Grafica
                                    option={opciones.digitalScatter}
                                    height={390}
                                    onEvents={{
                                        click: params => {
                                            if (params?.data?.name) alternarFiltro("asesorDigital", params.data.name, "todos");
                                        },
                                    }}
                                />
                            ) : (
                                <Empty text="No hay datos para construir la matriz." />
                            )}
                        </ChartCard>
                    </div>

                    <ChartCard title="Ranking de asesores digitales"
                        action={
                            filtros.asesorDigital !== "todos" ? (
                                <button
                                    type="button"
                                    onClick={() => setFiltros(prev => ({ ...prev, asesorDigital: "todos" }))}
                                    className="text-xs font-bold text-[#131E5C]"
                                >
                                    Ver todos
                                </button>
                            ) : null
                        }
                    >
                        <TablaRanking
                            data={analitica.digital}
                            tipo="digital"
                            onSelect={asesor => alternarFiltro("asesorDigital", asesor, "todos")}
                        />
                    </ChartCard>
                </>
            ) : null}

            {tab === "piso" ? (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Kpi
                            icon={Route}
                            title="Tráfico atendido"
                            value={fmt(totPiso.trafico)}
                            detail="Registros atribuidos a piso"
                            tone={C.amber}
                        />

                        <Kpi
                            icon={CarFront}
                            title="Pruebas realizadas"
                            value={fmt(totPiso.pruebas)}
                            detail={`${fmtPct(porcentaje(totPiso.pruebas, totPiso.trafico))} vs. tráfico`}
                            tone={C.green}
                        />

                        <Kpi
                            icon={CheckCircle2}
                            title="Entregas"
                            value={fmt(totPiso.entregas)}
                            detail={`${fmtPct(porcentaje(totPiso.entregas, totPiso.trafico))} vs. tráfico`}
                            tone={C.purple}
                        />

                        <Kpi
                            icon={CalendarDays}
                            title="Citas asignadas"
                            value={fmt(totPiso.citas)}
                            detail={`${fmtPct(porcentaje(totPiso.citasAsistidas, totPiso.citas))} asistencia`}
                            tone={C.blue}
                        />

                        <Kpi
                            icon={Target}
                            title="Conv. tráfico → entrega"
                            value={fmtPct(porcentaje(totPiso.entregas, totPiso.trafico))}
                            detail="Indicador operativo"
                            tone={C.cyan}
                        />

                        <Kpi
                            icon={Trophy}
                            title="Mejor índice"
                            value={topPiso ? fmtDecimal(topPiso.score, 0) : "—"}
                            detail={topPiso?.asesor || "Sin datos"}
                            tone={C.navy}
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <ChartCard title="Rendimiento de asesores de piso">
                            {analitica.floor.length ? (
                                <Grafica
                                    option={opciones.pisoBars}
                                    height={390}
                                    onEvents={{
                                        click: params => {
                                            if (params?.name) alternarFiltro("asesorPiso", params.name, "todos");
                                        },
                                    }}
                                />
                            ) : (
                                <Empty text="No hay datos atribuibles a asesores de piso." />
                            )}
                        </ChartCard>

                        <ChartCard title="Matriz tráfico vs. entregas">
                            {analitica.floor.length ? (
                                <Grafica
                                    option={opciones.pisoScatter}
                                    height={390}
                                    onEvents={{
                                        click: params => {
                                            if (params?.data?.name) alternarFiltro("asesorPiso", params.data.name, "todos");
                                        },
                                    }}
                                />
                            ) : (
                                <Empty text="No hay datos para construir la matriz." />
                            )}
                        </ChartCard>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
                        <ChartCard title="Demanda horaria de tráfico de piso">
                            {base.traficoPiso.length ? (
                                <Grafica option={opciones.heat} height={360} />
                            ) : (
                                <Empty text="No hay tráfico de piso en este periodo." />
                            )}
                        </ChartCard>

                        <ChartCard
                            title="Ranking de asesores de piso"
                            action={
                                filtros.asesorPiso !== "todos" ? (
                                    <button
                                        type="button"
                                        onClick={() => setFiltros(prev => ({ ...prev, asesorPiso: "todos" }))}
                                        className="text-xs font-bold text-[#131E5C]"
                                    >
                                        Ver todos
                                    </button>
                                ) : null
                            }
                        >
                            <TablaRanking
                                data={analitica.floor}
                                tipo="piso"
                                onSelect={asesor => alternarFiltro("asesorPiso", asesor, "todos")}
                            />
                        </ChartCard>
                    </div>
                </>
            ) : null}
        </div>
    );
}