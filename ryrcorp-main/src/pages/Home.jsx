import React, { useEffect, useMemo, useState, useRef, lazy, Suspense } from "react";
import {
    ArrowRight,
    ClipboardList,
    Filter,
    KanbanSquare,
    Users,
    CalendarDays,
    CarFront,
    SmilePlus,
    TriangleAlert,
    RefreshCw,
    BarChart3,
    X,
    SlidersHorizontal,
    Building2,
    UserRound,
    Funnel,
    ChevronRight,
    Gauge,
} from "lucide-react";

const EChartsLazy = lazy(() => import("echarts-for-react"));

// ─── Paleta principal 
const NAVY = "#0E1A5C";
const NAVY_MID = "#1A3BAE";
const BLUE2 = "#3B6AD4";
const BLUE3 = "#6B97E8";
const BLUE_PALE = "#C6D4F5";
const GOLD = "#C8860A";
const GOLD2 = "#E0A82A";
const GOLD3 = "#F5CC6A";
const SURFACE = "#F5F6FA";
const BORDER = "#E7E9F2";
const TEXT_MUTED = "#6B7299";
const SUCCESS = "#1A7F5C";
const WARNING = "#B7791F";
const DANGER = "#B42318";

const CACHE_TTL_MS = 1000 * 60 * 10;

const API_URL =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const RUTAS_API = {
    casos: "/conformidad/api/casos/",
    prospectos: "/digitales/api/prospectos/",
    citas: "/citas/api/citas/",
    registroPiso: "/citas/api/registro-piso/",
    pruebas: "/citas/api/pruebas-manejo/",
    entregas: "/citas/api/entregas/",
    encuestas: "/api/encuestas/satisfaccion/",
};

const ORDEN_CARGA = ["prospectos", "citas", "registroPiso", "pruebas", "entregas", "casos", "encuestas"];

const CAMPOS_POR_MODULO = {
    casos: { fecha: ["fecha_reclamacion", "fecha_atencion", "creado", "creado_en"], asesor: ["asesor", "asesor_digital", "asesor_piso", "asesor_ventas"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
    prospectos: { fecha: ["creado", "created_at", "ultimo_contacto_at", "actualizado"], asesor: ["asesor_digital", "asesor", "asesor_piso", "asesor_ventas"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
    citas: { fecha: ["fecha_hora_cita", "fecha", "creado_en", "created_at"], asesor: ["asesor_digital", "asesor_piso", "asesor", "asesor_ventas"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
    registroPiso: { fecha: ["fecha_hora_cita", "fecha", "creado_en", "created_at"], asesor: ["asesor_piso", "asesor_digital", "asesor", "asesor_ventas"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
    pruebas: { fecha: ["fecha_hora_cita", "fecha", "creado_en", "created_at"], asesor: ["asesor_piso", "asesor_digital", "asesor", "asesor_ventas"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
    entregas: { fecha: ["fecha_hora_entrega", "fecha", "creado_en", "created_at"], asesor: ["asesor_ventas", "asesor_piso", "asesor_digital", "asesor"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
    encuestas: { fecha: ["creado", "created_at", "fecha", "creado_en"], asesor: ["asesor_ventas", "asesor", "asesor_digital", "asesor_piso"], dealer: ["dealer", "agencia", "sucursal", "distribuidor"] },
};

const FILTROS_INICIALES = { fechaInicio: "", fechaFin: "", asesor: "todos", dealer: "todos" };
const MODULOS_CON_FILTRO_ASESOR = new Set(["prospectos", "citas", "registroPiso", "pruebas", "entregas"]);

function parsearJsonSeguro(valor, fallback = null) {
    try { return JSON.parse(valor); } catch { return fallback; }
}
function limpiarTokenSesion(valor) {
    const token = String(valor || "").replace(/^Bearer\s+/i, "").trim();
    if (!token || token === "undefined" || token === "null") return "";
    return token;
}
function pareceJwt(valor) { return limpiarTokenSesion(valor).split(".").length === 3; }
function leerPayloadJwt(token) {
    try {
        const partes = limpiarTokenSesion(token).split(".");
        if (partes.length !== 3) return null;
        const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(window.atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")));
    } catch { return null; }
}
function tokenJwtExpirado(token) {
    const payload = leerPayloadJwt(token);
    if (!payload?.exp) return false;
    return Date.now() >= (Number(payload.exp) - 30) * 1000;
}
function obtenerJwtDeObjeto(obj) {
    if (!obj || typeof obj !== "object") return "";
    const candidatos = [obj?.access, obj?.access_token, obj?.accessToken, obj?.jwt, obj?.auth?.access, obj?.auth?.access_token, obj?.auth?.accessToken, obj?.auth?.jwt, obj?.tokens?.access, obj?.tokens?.access_token, obj?.tokens?.accessToken, obj?.session?.access, obj?.session?.access_token, obj?.session?.accessToken, obj?.token, obj?.authToken, obj?.auth?.token, obj?.session?.token];
    for (const c of candidatos) { const t = limpiarTokenSesion(c); if (pareceJwt(t) && !tokenJwtExpirado(t)) return t; }
    return "";
}
function obtenerRefreshDeObjeto(obj) {
    if (!obj || typeof obj !== "object") return "";
    const candidatos = [obj?.refresh, obj?.refresh_token, obj?.refreshToken, obj?.auth?.refresh, obj?.auth?.refresh_token, obj?.auth?.refreshToken, obj?.tokens?.refresh, obj?.tokens?.refresh_token, obj?.tokens?.refreshToken, obj?.session?.refresh, obj?.session?.refresh_token, obj?.session?.refreshToken];
    for (const c of candidatos) { const t = limpiarTokenSesion(c); if (pareceJwt(t) && !tokenJwtExpirado(t)) return t; }
    return "";
}
function extraerTokenDeStorage(storage) {
    if (!storage) return "";
    for (const k of ["@token_access_jwt", "access", "accessToken", "auth.access", "access_token", "jwt", "token", "authToken", "crm_token"]) {
        const t = limpiarTokenSesion(storage.getItem(k));
        if (pareceJwt(t) && !tokenJwtExpirado(t)) return t;
    }
    for (const k of ["auth", "crm_auth", "session", "user_session"]) {
        const obj = parsearJsonSeguro(storage.getItem(k), null);
        const t = obtenerJwtDeObjeto(obj);
        if (t) return t;
    }
    return "";
}
function extraerRefreshDeStorage(storage) {
    if (!storage) return "";
    for (const k of ["@token_refresh_jwt", "refresh", "refreshToken", "auth.refresh", "refresh_token"]) {
        const t = limpiarTokenSesion(storage.getItem(k));
        if (pareceJwt(t) && !tokenJwtExpirado(t)) return t;
    }
    for (const k of ["auth", "crm_auth", "session", "user_session"]) {
        const obj = parsearJsonSeguro(storage.getItem(k), null);
        const t = obtenerRefreshDeObjeto(obj);
        if (t) return t;
    }
    return "";
}
function obtenerTokenSesion() {
    if (typeof window === "undefined") return "";
    return extraerTokenDeStorage(window.localStorage) || extraerTokenDeStorage(window.sessionStorage) || "";
}
function obtenerRefreshSesion() {
    if (typeof window === "undefined") return "";
    return extraerRefreshDeStorage(window.localStorage) || extraerRefreshDeStorage(window.sessionStorage) || "";
}
function guardarJwtSesion({ access, refresh } = {}) {
    if (typeof window === "undefined") return;
    const accessToken = limpiarTokenSesion(access);
    const refreshToken = limpiarTokenSesion(refresh);
    if (!pareceJwt(accessToken)) return;
    const prev = parsearJsonSeguro(window.localStorage.getItem("auth"), {}) || {};
    const upd = { ...prev, token: accessToken, access: accessToken, ...(pareceJwt(refreshToken) ? { refresh: refreshToken } : {}) };
    window.localStorage.setItem("auth", JSON.stringify(upd));
    window.localStorage.setItem("@token_access_jwt", accessToken);
    window.localStorage.setItem("auth.access", accessToken);
    window.localStorage.setItem("access", accessToken);
    if (pareceJwt(refreshToken)) {
        window.localStorage.setItem("@token_refresh_jwt", refreshToken);
        window.localStorage.setItem("auth.refresh", refreshToken);
        window.localStorage.setItem("refresh", refreshToken);
    }
}
function limpiarJwtSesionExpirada() {
    if (typeof window === "undefined") return;
    ["@token_access_jwt", "@token_refresh_jwt", "auth.access", "auth.refresh", "access", "accessToken", "refresh", "refreshToken"].forEach(k => { try { window.localStorage.removeItem(k); } catch { } });
    const auth = parsearJsonSeguro(window.localStorage.getItem("auth"), null);
    if (auth && typeof auth === "object") {
        ["access", "refresh", "access_token", "refresh_token", "jwt"].forEach(k => delete auth[k]);
        if (pareceJwt(auth.token)) delete auth.token;
        window.localStorage.setItem("auth", JSON.stringify(auth));
    }
}
function resolverUrl(ruta) {
    if (/^https?:\/\//i.test(ruta)) return ruta;
    const path = ruta.startsWith("/") ? ruta : `/${ruta}`;
    return API_URL ? `${API_URL.replace(/\/+$/, "")}${path}` : path;
}
let refrescoEnVuelo = null;
async function renovarAccessToken() {
    if (refrescoEnVuelo) return refrescoEnVuelo;
    refrescoEnVuelo = (async () => {
        const refresh = obtenerRefreshSesion();
        if (!refresh) throw new Error("No hay refresh token JWT disponible.");
        const respuesta = await fetch(resolverUrl("/conformidad/api/auth/token/refresh/"), {
            method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify({ refresh }),
        });
        const payload = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok || !payload?.access) { limpiarJwtSesionExpirada(); throw new Error(payload?.detail || "No se pudo renovar la sesión JWT."); }
        guardarJwtSesion({ access: payload.access, refresh });
        return payload.access;
    })();
    try { return await refrescoEnVuelo; } finally { refrescoEnVuelo = null; }
}
async function obtenerTokenSesionVigente() {
    const token = obtenerTokenSesion();
    if (token && !tokenJwtExpirado(token)) return token;
    try { return await renovarAccessToken(); } catch { return ""; }
}
async function headersBase() {
    const token = await obtenerTokenSesionVigente();
    const headers = { Accept: "application/json", "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}
function normalizarLista(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}
async function solicitarJson(url, { intentarRefresh = true } = {}) {
    const respuesta = await fetch(url, { method: "GET", headers: await headersBase(), credentials: "omit" });
    if ((respuesta.status === 401 || respuesta.status === 403) && intentarRefresh) {
        try { await renovarAccessToken(); return solicitarJson(url, { intentarRefresh: false }); } catch { }
    }
    if (!respuesta.ok) { const texto = await respuesta.text().catch(() => ""); throw new Error(`HTTP ${respuesta.status} en ${url}${texto ? ` - ${texto}` : ""}`); }
    return respuesta.json();
}
async function solicitarTodasLasPaginas(ruta) {
    const primeraUrl = resolverUrl(ruta);
    const primeraPagina = await solicitarJson(primeraUrl);
    if (Array.isArray(primeraPagina)) return primeraPagina;
    const acumulado = [...normalizarLista(primeraPagina)];
    const siguienteUrl = primeraPagina?.next ? resolverUrl(primeraPagina.next) : null;
    const total = Number(primeraPagina?.count);
    if (!siguienteUrl) return acumulado;
    let limit = null, offsetInicial = null;
    try {
        const u = new URL(siguienteUrl);
        const lp = u.searchParams.get("limit") || u.searchParams.get("page_size");
        const op = u.searchParams.get("offset");
        if (lp) limit = Number(lp);
        if (op) offsetInicial = Number(op);
    } catch { }
    const puedeParalelizar = Number.isFinite(total) && total > 0 && Number.isFinite(limit) && limit > 0 && Number.isFinite(offsetInicial);
    if (puedeParalelizar) {
        const restantes = Math.max(0, total - acumulado.length);
        const paginasRestantes = Math.ceil(restantes / limit);
        const maxConcurrencia = 6;
        const urls = [];
        for (let i = 0; i < paginasRestantes; i++) {
            const offset = offsetInicial + i * limit;
            try { const u = new URL(siguienteUrl); u.searchParams.set("offset", String(offset)); urls.push(u.toString()); } catch { urls.push(null); }
        }
        if (urls.every(Boolean)) {
            for (let i = 0; i < urls.length; i += maxConcurrencia) {
                const lote = urls.slice(i, i + maxConcurrencia);
                const resultados = await Promise.all(lote.map(u => solicitarJson(u)));
                resultados.forEach(p => acumulado.push(...normalizarLista(p)));
            }
            return acumulado;
        }
    }
    let siguiente = siguienteUrl, pagina = 0;
    while (siguiente && pagina < 40) {
        const payload = await solicitarJson(siguiente);
        acumulado.push(...normalizarLista(payload));
        siguiente = payload?.next ? resolverUrl(payload.next) : null;
        pagina++;
    }
    return acumulado;
}
function obtenerCacheKey() {
    const token = obtenerTokenSesion();
    return `home-dashboard-v5-${token ? token.slice(-12) : "anon"}`;
}
function leerCache() {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.sessionStorage.getItem(obtenerCacheKey());
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data?.timestamp || !data?.payload) return null;
        if (Date.now() - data.timestamp > CACHE_TTL_MS) return null;
        return data.payload;
    } catch { return null; }
}
function guardarCache(payload) {
    if (typeof window === "undefined") return;
    try { window.sessionStorage.setItem(obtenerCacheKey(), JSON.stringify({ timestamp: Date.now(), payload })); } catch { }
}

function formatearNumero(valor) { return new Intl.NumberFormat("es-MX").format(Number(valor || 0)); }
function formatearPorcentaje(valor) { return `${redondear(valor, 1)}%`; }
function redondear(valor, decimales = 1) { const n = Number(valor || 0); return Number.isFinite(n) ? Number(n.toFixed(decimales)) : 0; }
function numeroSeguro(valor) { const n = Number(valor); return Number.isFinite(n) ? n : 0; }
function promedio(valores) {
    const limpios = valores.filter(v => Number.isFinite(Number(v)));
    if (!limpios.length) return 0;
    return limpios.reduce((a, v) => a + Number(v), 0) / limpios.length;
}
function porcentaje(parte, total) { if (!total) return 0; return (parte / total) * 100; }
function normalizarTexto(valor, fallback = "Sin dato") { const t = String(valor ?? "").trim(); return t || fallback; }
function normalizarAgencia(valor) { return normalizarTexto(valor, "Sin agencia"); }
function crearFechaSegura(valor) { if (!valor) return null; const f = new Date(valor); return Number.isNaN(f.getTime()) ? null : f; }
function obtenerFecha(item, campos) { for (const c of campos) { const f = crearFechaSegura(item?.[c]); if (f) return f; } return null; }
function extraerCampo(item, campos = [], fallback = "") {
    for (const c of campos) { const v = item?.[c]; if (v !== undefined && v !== null && String(v).trim()) return String(v).trim(); }
    return fallback;
}
function inicioDelDia(fecha) { const c = new Date(fecha); c.setHours(0, 0, 0, 0); return c; }
function finDelDia(fecha) { const c = new Date(fecha); c.setHours(23, 59, 59, 999); return c; }
function formatearFechaInput(fecha) { return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`; }
function obtenerRangoDesdeDias(dias) {
    const hoy = new Date();
    const fin = finDelDia(hoy);
    if (!dias) return { fechaInicio: "", fechaFin: formatearFechaInput(hoy) };
    const inicio = inicioDelDia(hoy);
    inicio.setDate(inicio.getDate() - dias + 1);
    return { fechaInicio: formatearFechaInput(inicio), fechaFin: formatearFechaInput(fin) };
}
function detectarPeriodoActivo(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return null;
    const inicio = crearFechaSegura(`${fechaInicio}T00:00:00`);
    const fin = crearFechaSegura(`${fechaFin}T23:59:59`);
    if (!inicio || !fin) return null;
    const hoy = new Date();
    if (Math.abs(finDelDia(hoy).getTime() - fin.getTime()) > 36 * 60 * 60 * 1000) return null;
    const dias = Math.round((finDelDia(fin).getTime() - inicioDelDia(inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return [30, 90, 180].includes(dias) ? dias : null;
}
function estaEnRango(fecha, fechaInicio, fechaFin) {
    if (!fecha) return false;
    let inicio = fechaInicio ? crearFechaSegura(`${fechaInicio}T00:00:00`) : null;
    let fin = fechaFin ? crearFechaSegura(`${fechaFin}T23:59:59`) : null;
    if (inicio && fin && inicio > fin) { const t = inicio; inicio = fin; fin = t; }
    if (inicio && fecha < inicio) return false;
    if (fin && fecha > fin) return false;
    return true;
}
function claveMes(fecha) { return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`; }
function etiquetaMes(fecha) { return new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" }).format(fecha).replace(".", ""); }
function construirSerieMensual(data, rango) {
    const fechaFinBase = rango.fechaFin ? crearFechaSegura(`${rango.fechaFin}T23:59:59`) : finDelDia(new Date());
    const meses = rango.fechaInicio && rango.fechaFin ? 12 : 6;
    const fin = fechaFinBase || finDelDia(new Date());
    const serie = [];
    for (let i = meses - 1; i >= 0; i--) {
        const base = new Date(fin.getFullYear(), fin.getMonth() - i, 1);
        serie.push({ clave: claveMes(base), mes: etiquetaMes(base), prospectos: 0, reclamaciones: 0, encuestas: 0, entregas: 0, citas: 0, registrosPiso: 0 });
    }
    const mapa = new Map(serie.map(s => [s.clave, s]));
    const registrar = (lista, campo, getFecha) => lista.forEach(item => {
        const f = getFecha(item);
        if (!f) return;
        const c = claveMes(f);
        if (mapa.has(c)) mapa.get(c)[campo]++;
    });
    registrar(data.prospectos, "prospectos", i => obtenerFecha(i, CAMPOS_POR_MODULO.prospectos.fecha));
    registrar(data.casos, "reclamaciones", i => obtenerFecha(i, CAMPOS_POR_MODULO.casos.fecha));
    registrar(data.encuestas, "encuestas", i => obtenerFecha(i, CAMPOS_POR_MODULO.encuestas.fecha));
    registrar(data.entregas, "entregas", i => obtenerFecha(i, CAMPOS_POR_MODULO.entregas.fecha));
    registrar(data.citas, "citas", i => obtenerFecha(i, CAMPOS_POR_MODULO.citas.fecha));
    registrar(data.registroPiso, "registrosPiso", i => obtenerFecha(i, CAMPOS_POR_MODULO.registroPiso.fecha));
    return serie;
}
function agruparConteo(lista, obtenerClave) {
    const mapa = new Map();
    lista.forEach(item => { const k = obtenerClave(item); mapa.set(k, (mapa.get(k) || 0) + 1); });
    return [...mapa.entries()].map(([name, value]) => ({ name, value }));
}
function scoreEncuesta(encuesta) {
    return promedio([numeroSeguro(encuesta?.atencion_asesor), numeroSeguro(encuesta?.seguimiento_asesor), numeroSeguro(encuesta?.tiempo_entrega_unidad), numeroSeguro(encuesta?.experiencia_recepcion)]);
}
function scoreCierreAgencia(item) {
    return numeroSeguro(item.prospectos) + numeroSeguro(item.citas) * 1.5 + numeroSeguro(item.pruebas) * 2 + numeroSeguro(item.entregas) * 3 + numeroSeguro(item.registroPiso) * 1.2 + numeroSeguro(item.casos) * 1.2;
}
function obtenerDealerItem(item, modulo) { return normalizarAgencia(extraerCampo(item, CAMPOS_POR_MODULO[modulo]?.dealer, "Sin agencia")); }
function obtenerAsesorItem(item, modulo) { return normalizarTexto(extraerCampo(item, CAMPOS_POR_MODULO[modulo]?.asesor, "Sin asignar"), "Sin asignar"); }
function obtenerFechaItem(item, modulo) { return obtenerFecha(item, CAMPOS_POR_MODULO[modulo]?.fecha || []); }
function filtrarModulo(lista, modulo, filtros) {
    return lista.filter(item => {
        const fecha = obtenerFechaItem(item, modulo);
        if ((filtros.fechaInicio || filtros.fechaFin) && !estaEnRango(fecha, filtros.fechaInicio, filtros.fechaFin)) return false;
        if (filtros.dealer !== "todos" && obtenerDealerItem(item, modulo) !== filtros.dealer) return false;
        if (filtros.asesor !== "todos" && MODULOS_CON_FILTRO_ASESOR.has(modulo) && obtenerAsesorItem(item, modulo) !== filtros.asesor) return false;
        return true;
    });
}

function ChartFallback({ height = 320 }) {
    return (
        <div className="flex items-center justify-center rounded-xl border border-dashed"
            style={{ height, borderColor: BORDER, backgroundColor: "#FAFBFD" }}>
            <RefreshCw size={18} className="animate-spin" style={{ color: TEXT_MUTED }} />
        </div>
    );
}
function Grafica({ option, height = 320, onEvents }) {
    return (
        <Suspense fallback={<ChartFallback height={height} />}>
            <EChartsLazy option={option} style={{ height }} notMerge lazyUpdate onEvents={onEvents} opts={{ renderer: "canvas" }} />
        </Suspense>
    );
}

function GraficaTendenciaAreas({ timeline, periodoLabel }) {
    const option = useMemo(() => ({
        animationDuration: 800,
        animationEasing: "cubicOut",
        textStyle: { fontFamily: "inherit" },
        tooltip: {
            trigger: "axis",
            backgroundColor: "#0A1240",
            borderWidth: 0,
            textStyle: { color: "#E8D9A0", fontSize: 12 },
            padding: [10, 14],
            extraCssText: "border-radius:12px",
            axisPointer: { type: "line", lineStyle: { color: `${GOLD}55`, type: "dashed", width: 1 } },
        },
        legend: {
            bottom: 0,
            itemWidth: 10, itemHeight: 10, itemGap: 20,
            textStyle: { fontSize: 11, color: TEXT_MUTED },
            data: ["Prospectos", "Citas", "Piso", "Entregas"],
        },
        grid: { left: 4, right: 8, top: 10, bottom: 46, containLabel: true },
        xAxis: {
            type: "category",
            data: timeline.map(t => t.mes),
            boundaryGap: false,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { color: TEXT_MUTED, fontSize: 10 },
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: `${BORDER}`, type: "dashed" } },
            axisLabel: { color: TEXT_MUTED, fontSize: 10, formatter: v => new Intl.NumberFormat("es-MX", { notation: "compact" }).format(v) },
        },
        series: [
            {
                name: "Prospectos", type: "line", stack: "total", smooth: 0.5,
                data: timeline.map(t => t.prospectos),
                lineStyle: { width: 0 },
                showSymbol: false,
                areaStyle: {
                    color: {
                        type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: `${NAVY}CC` }, { offset: 1, color: `${NAVY}22` }]
                    },
                },
                emphasis: { focus: "series" },
            },
            {
                name: "Citas", type: "line", stack: "total", smooth: 0.5,
                data: timeline.map(t => t.citas),
                lineStyle: { width: 0 },
                showSymbol: false,
                areaStyle: {
                    color: {
                        type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: `${NAVY_MID}CC` }, { offset: 1, color: `${NAVY_MID}22` }]
                    },
                },
                emphasis: { focus: "series" },
            },
            {
                name: "Piso", type: "line", stack: "total", smooth: 0.5,
                data: timeline.map(t => t.registrosPiso),
                lineStyle: { width: 0 },
                showSymbol: false,
                areaStyle: {
                    color: {
                        type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: `${GOLD}BB` }, { offset: 1, color: `${GOLD}18` }]
                    },
                },
                emphasis: { focus: "series" },
            },
            {
                name: "Entregas", type: "line", stack: "total", smooth: 0.5,
                data: timeline.map(t => t.entregas),
                lineStyle: { width: 0 },
                showSymbol: false,
                areaStyle: {
                    color: {
                        type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: `${GOLD2}AA` }, { offset: 1, color: `${GOLD2}10` }]
                    },
                },
                emphasis: { focus: "series" },
            },
        ],
    }), [timeline]);

    return <Grafica option={option} height={340} />;
}

const HEAT_COLS = [
    { key: "prospectos", label: "Prospectos" },
    { key: "citas", label: "Citas" },
    { key: "registroPiso", label: "Piso" },
    { key: "pruebas", label: "Pruebas" },
    { key: "entregas", label: "Entregas" },
];

function heatBg(t) {
    // 0 → pálido azul grisáceo,  1 → navy oscuro
    const r = Math.round(180 - t * 160);
    const g = Math.round(185 - t * 145);
    const b = Math.round(220 - t * 150);
    return `rgb(${r},${g},${b})`;
}

function GraficaHeatmapDealer({ data }) {
    const colMaxes = useMemo(() =>
        HEAT_COLS.map(c => Math.max(1, ...data.map(d => d[c.key] || 0))),
        [data]);

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3 }}>
                <thead>
                    <tr>
                        <th style={{ width: 120, textAlign: "left", fontSize: 10, fontWeight: 600, color: TEXT_MUTED, paddingBottom: 6, paddingRight: 8 }}></th>
                        {HEAT_COLS.map(c => (
                            <th key={c.key} style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textAlign: "center", paddingBottom: 6, minWidth: 64 }}>
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, ri) => (
                        <tr key={row.agencia}>
                            <td style={{ fontSize: 11, color: TEXT_MUTED, textAlign: "right", paddingRight: 8, whiteSpace: "nowrap", fontWeight: 500 }}>
                                {row.agencia}
                            </td>
                            {HEAT_COLS.map((c, ci) => {
                                const v = row[c.key] || 0;
                                const t = v / colMaxes[ci];
                                const bg = v ? heatBg(t) : "#F0F2FA";
                                const textC = t > 0.5 ? "#fff" : t > 0.2 ? "#1A2560" : "#9AA5C8";
                                return (
                                    <td key={c.key} style={{
                                        background: bg, color: textC, borderRadius: 6,
                                        height: 38, textAlign: "center", verticalAlign: "middle",
                                        fontSize: 12, fontWeight: 600,
                                        transition: "transform .15s",
                                        cursor: "default",
                                    }}
                                        title={`${c.label} · ${row.agencia}: ${v}`}
                                    >
                                        {v || "–"}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Leyenda de intensidad */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, color: TEXT_MUTED }}>Menos</span>
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map(t => (
                    <div key={t} style={{ width: 18, height: 10, borderRadius: 3, background: heatBg(t) }} />
                ))}
                <span style={{ fontSize: 10, color: TEXT_MUTED }}>Más</span>
            </div>
        </div>
    );
}

const TREEMAP_COLORES = [
    { bg: NAVY, text: "#ffffff" },
    { bg: GOLD, text: "#ffffff" },
    { bg: NAVY_MID, text: "#ffffff" },
    { bg: GOLD2, text: "#ffffff" },
    { bg: BLUE2, text: "#ffffff" },
    { bg: GOLD3, text: NAVY },
];

function GraficaTreemapEstatus({ data }) {
    const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
    const total = sorted.reduce((s, d) => s + d.value, 0);

    const [grande, ...resto] = sorted;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 320 }}>
            {/* Fila 1: el más grande solo */}
            {grande && (
                <div style={{
                    flex: 1.1,
                    borderRadius: 14, padding: "24px 28px",
                    background: TREEMAP_COLORES[0].bg,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: TREEMAP_COLORES[0].text }}>{grande.name}</span>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 38, fontWeight: 700, color: TREEMAP_COLORES[0].text, lineHeight: 1 }}>{formatearNumero(grande.value)}</div>
                        <div style={{ fontSize: 13, color: `${TREEMAP_COLORES[0].text}99`, marginTop: 4 }}>{redondear(porcentaje(grande.value, total), 1)}%</div>
                    </div>
                </div>
            )}
            {/* Fila 2: los demás distribuidos en partes iguales */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${resto.length}, 1fr)`, gap: 8 }}>
                {resto.map((d, i) => {
                    const col = TREEMAP_COLORES[(i + 1) % TREEMAP_COLORES.length];
                    const pct = redondear(porcentaje(d.value, total), 1);
                    return (
                        <div key={d.name} style={{
                            borderRadius: 12, padding: "16px 14px 14px",
                            background: col.bg,
                            display: "flex", flexDirection: "column", justifyContent: "space-between",
                        }}
                            title={`${d.name}: ${d.value} (${pct}%)`}
                        >
                            <div style={{ fontSize: 13, fontWeight: 600, color: `${col.text}CC`, lineHeight: 1.3 }}>
                                {d.name}
                            </div>
                            <div>
                                <div style={{ fontSize: 28, fontWeight: 700, color: col.text, lineHeight: 1 }}>{formatearNumero(d.value)}</div>
                                <div style={{ fontSize: 12, color: `${col.text}99`, marginTop: 4 }}>{pct}%</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function GaugeRadial({ score, label, encuestas }) {
    const SIZE = 90;
    const R = 32;
    const SW = 7;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const START = Math.PI * 0.75;
    const SWEEP = Math.PI * 1.5;
    const t = Math.max(0, Math.min(1, (score - 1) / 4));

    const arc = (from, to) => {
        const x1 = CX + R * Math.cos(from), y1 = CY + R * Math.sin(from);
        const x2 = CX + R * Math.cos(to), y2 = CY + R * Math.sin(to);
        const large = (to - from) > Math.PI ? 1 : 0;
        return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
    };

    const endAngle = START + SWEEP * t;
    const color = score >= 4 ? NAVY_MID : score >= 3 ? GOLD : DANGER;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 88 }}>
            <svg width={SIZE} height={SIZE} style={{ overflow: "visible" }}>
                {/* Track */}
                <path d={arc(START, START + SWEEP)} fill="none" stroke="#E7E9F2" strokeWidth={SW} strokeLinecap="round" />
                {/* Value */}
                {t > 0 && (
                    <path d={arc(START, endAngle)} fill="none" stroke={color} strokeWidth={SW} strokeLinecap="round" />
                )}
                {/* Score text */}
                <text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 15, fontWeight: 700, fill: color, fontFamily: "inherit" }}>
                    {score.toFixed(1)}
                </text>
                <text x={CX} y={CY + 11} textAnchor="middle"
                    style={{ fontSize: 9, fill: TEXT_MUTED, fontFamily: "inherit" }}>
                    / 5
                </text>
            </svg>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#334155", textAlign: "center", lineHeight: 1.3, maxWidth: 88 }}>
                {label}
            </div>
            {encuestas !== undefined && (
                <div style={{ fontSize: 9, color: TEXT_MUTED }}>{encuestas} enc.</div>
            )}
        </div>
    );
}

function GraficaGaugesSatisfaccion({ data }) {
    const sorted = useMemo(() => [...data].sort((a, b) => b.promedio - a.promedio), [data]);

    return (
        <div>
            {/* Leyenda */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                {[{ l: "≥ 4.0 Excelente", c: NAVY_MID }, { l: "3–3.9 Aceptable", c: GOLD }, { l: "< 3 Bajo", c: DANGER }].map(item => (
                    <span key={item.l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: item.c }} />
                        {item.l}
                    </span>
                ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {sorted.map(d => (
                    <GaugeRadial key={d.agencia} score={d.promedio} label={d.agencia} encuestas={d.encuestas} />
                ))}
            </div>
        </div>
    );
}

function GraficaBarrasReclamaciones({ data }) {
    const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
    const maxVal = Math.max(1, ...sorted.map(d => d.value));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((d, i) => {
                const pct = (d.value / maxVal) * 100;
                const intensity = 1 - i / sorted.length;
                const bg = i === 0 ? NAVY : `rgba(14,26,92,${0.15 + intensity * 0.55})`;
                const textC = i === 0 ? "#fff" : intensity > 0.5 ? "#fff" : NAVY;
                return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, minWidth: 110, maxWidth: 110, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            title={d.name}>{d.name}</div>
                        <div style={{ flex: 1, position: "relative", height: 28, background: "#EEF0F8", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{
                                position: "absolute", left: 0, top: 0, bottom: 0,
                                width: `${pct}%`, background: bg, borderRadius: 6,
                                transition: "width .5s cubic-bezier(.4,0,.2,1)",
                                display: "flex", alignItems: "center", paddingLeft: 10, gap: 6,
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: textC, whiteSpace: "nowrap" }}>
                                    {formatearNumero(d.value)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const SWIM_COLS = [
    { key: "prospectos", label: "Prospectos", color: NAVY },
    { key: "citas", label: "Citas", color: NAVY_MID },
    { key: "registroPiso", label: "Piso", color: BLUE2 },
    { key: "pruebas", label: "Pruebas", color: GOLD },
    { key: "entregas", label: "Entregas", color: GOLD2 },
];

function GraficaSwimlanesAsesores({ data }) {
    const enriched = useMemo(() =>
        data.map(d => ({ ...d, total: SWIM_COLS.reduce((s, c) => s + (d[c.key] || 0), 0) }))
            .sort((a, b) => b.total - a.total),
        [data]);

    const maxTotal = Math.max(1, ...enriched.map(d => d.total));

    return (
        <div>
            {/* Leyenda */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                {SWIM_COLS.map(c => (
                    <span key={c.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: TEXT_MUTED }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                        {c.label}
                    </span>
                ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {enriched.map(d => (
                    <div key={d.asesor} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, minWidth: 140, maxWidth: 140, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            title={d.asesor}>{d.asesor}</div>
                        {/* Barra con segmentos proporcionales al total máximo */}
                        <div style={{ flex: d.total / maxTotal, maxFlex: 1, display: "flex", height: 22, borderRadius: 6, overflow: "hidden", gap: 1, minWidth: 20 }}>
                            {SWIM_COLS.map(c => {
                                const v = d[c.key] || 0;
                                if (!v) return null;
                                return (
                                    <div key={c.key} title={`${c.label}: ${v}`}
                                        style={{ flex: v, background: c.color, height: "100%", transition: "flex .4s", minWidth: 1 }} />
                                );
                            })}
                        </div>
                        {/* Relleno para mantener alineación cuando la barra es corta */}
                        <div style={{ flex: 1 - d.total / maxTotal }} />
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", minWidth: 36, textAlign: "right" }}>
                            {formatearNumero(d.total)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Toolbar({ onAbrirFiltros, onActualizar, refrescando, totalRegistros }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }}>
                {totalRegistros ? `${formatearNumero(totalRegistros)} registros filtrados` : "Sin resultados"}
            </div>
            <button type="button" onClick={onAbrirFiltros}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition xl:hidden"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                <SlidersHorizontal size={16} /> Filtros
            </button>
            <button type="button" onClick={onActualizar}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                <RefreshCw size={16} className={refrescando ? "animate-spin" : ""} /> Actualizar
            </button>
        </div>
    );
}

function BarraEmbudo({ etapas, asistenciaGeneral }) {
    const maximo = Math.max(1, ...etapas.map(e => e.cantidad));
    return (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Gauge size={16} style={{ color: NAVY }} />
                    <h2 className="text-sm font-bold text-slate-900">Embudo comercial</h2>
                </div>
                <span className="text-xs font-semibold" style={{ color: SUCCESS }}>
                    Asistencia general {formatearPorcentaje(asistenciaGeneral)}
                </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {etapas.map((etapa, idx) => {
                    const anchoRelativo = Math.max(14, (etapa.cantidad / maximo) * 100);
                    const conversion = idx === 0 ? null : redondear(porcentaje(etapa.cantidad, etapas[idx - 1].cantidad), 0);
                    return (
                        <div key={etapa.etapa} className="flex flex-col gap-2">
                            <div className="flex items-baseline justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                                    {etapa.etapa}
                                </p>
                                {conversion !== null && (
                                    <span className="text-[11px] font-bold" style={{ color: conversion < 40 ? DANGER : SUCCESS }}>
                                        {conversion}%
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold tabular-nums text-slate-900">{formatearNumero(etapa.cantidad)}</p>
                            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#EEF0F8" }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${anchoRelativo}%`, backgroundColor: NAVY }} />
                            </div>
                            {idx < etapas.length - 1 && <ArrowRight size={12} className="self-end" style={{ color: "#C8CEDF" }} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, title, value, sub, accent = NAVY }) {
    return (
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${accent}14`, color: accent }}>
                    <Icon size={16} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>{title}</p>
                    <p className="text-lg font-bold tabular-nums text-slate-900 leading-tight">{value}</p>
                </div>
            </div>
            {sub && <p className="mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>{sub}</p>}
        </div>
    );
}

function ChartCard({ title, subtitle, action, children }) {
    return (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs" style={{ color: TEXT_MUTED }}>{subtitle}</p>}
                </div>
                {action && (
                    <span className="self-start rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: SURFACE, color: TEXT_MUTED }}>
                        {action}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function EmptyChart({ text = "No hay datos suficientes para mostrar esta gráfica.", height = 280 }) {
    return (
        <div className="flex items-center justify-center rounded-xl border border-dashed text-center text-sm"
            style={{ height, borderColor: BORDER, backgroundColor: SURFACE, color: TEXT_MUTED }}>
            <div className="max-w-sm px-6">{text}</div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="rounded-2xl p-6" style={{ backgroundColor: NAVY }}>
                <div className="h-5 w-48 rounded bg-white/20" />
                <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/10" />
            </div>
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
                <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-16 rounded bg-slate-200" />
                            <div className="h-6 w-12 rounded bg-slate-200" />
                            <div className="h-1.5 w-full rounded-full bg-slate-100" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border bg-white p-4" style={{ borderColor: BORDER }}>
                        <div className="h-9 w-9 rounded-xl bg-slate-200" />
                        <div className="mt-3 h-3 w-20 rounded bg-slate-200" />
                        <div className="mt-2 h-6 w-16 rounded bg-slate-100" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PeriodButton({ active, children, onClick }) {
    return (
        <button type="button" onClick={onClick}
            className="rounded-xl px-3 py-2 text-sm font-semibold transition"
            style={active
                ? { backgroundColor: NAVY, color: "#fff" }
                : { border: `1px solid ${BORDER}`, backgroundColor: "#fff", color: "#475569" }}>
            {children}
        </button>
    );
}

function SelectFiltro({ label, value, onChange, options = [], icon: Icon }) {
    return (
        <label className="block space-y-2">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                {Icon ? <Icon size={13} /> : null}{label}
            </span>
            <select value={value} onChange={onChange}
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2"
                style={{ borderColor: BORDER }}>
                {options.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
        </label>
    );
}

function InputFecha({ label, value, onChange }) {
    return (
        <label className="block space-y-2">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                <CalendarDays size={13} />{label}
            </span>
            <input type="date" value={value} onChange={onChange}
                className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2"
                style={{ borderColor: BORDER }} />
        </label>
    );
}

function PanelFiltros({ abierto, onClose, filtros, setFiltros, dealersDisponibles, asesoresDisponibles, aplicarPeriodoRapido, periodoActivo }) {
    const limpiarFiltros = () => setFiltros(FILTROS_INICIALES);
    const contenido = (
        <div className="flex h-full flex-col rounded-2xl border bg-white p-4 xl:sticky xl:top-24 xl:h-auto xl:max-h-[calc(100vh-7rem)] xl:overflow-auto"
            style={{ borderColor: BORDER }}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${NAVY}14`, color: NAVY }}>
                    <Filter size={14} />Filtros operativos
                </div>
                <button type="button" onClick={onClose}
                    className="grid h-9 w-9 place-items-center rounded-xl border text-slate-500 transition hover:bg-slate-50 xl:hidden"
                    style={{ borderColor: BORDER }}>
                    <X size={16} />
                </button>
            </div>
            <div className="space-y-4">
                <div className="rounded-xl p-3" style={{ backgroundColor: SURFACE }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Ventanas rápidas</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <PeriodButton active={periodoActivo === 30} onClick={() => aplicarPeriodoRapido(30)}>30 días</PeriodButton>
                        <PeriodButton active={periodoActivo === 90} onClick={() => aplicarPeriodoRapido(90)}>90 días</PeriodButton>
                        <PeriodButton active={periodoActivo === 180} onClick={() => aplicarPeriodoRapido(180)}>180 días</PeriodButton>
                        <PeriodButton active={periodoActivo === 0} onClick={() => aplicarPeriodoRapido(0)}>Todo</PeriodButton>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <InputFecha label="Fecha inicio" value={filtros.fechaInicio} onChange={e => setFiltros(p => ({ ...p, fechaInicio: e.target.value }))} />
                    <InputFecha label="Fecha fin" value={filtros.fechaFin} onChange={e => setFiltros(p => ({ ...p, fechaFin: e.target.value }))} />
                </div>
                <SelectFiltro label="Dealer / agencia" icon={Building2} value={filtros.dealer}
                    onChange={e => setFiltros(p => ({ ...p, dealer: e.target.value }))}
                    options={[{ value: "todos", label: "Todos los dealers" }, ...dealersDisponibles.map(d => ({ value: d, label: d }))]} />
                <SelectFiltro label="Asesor" icon={UserRound} value={filtros.asesor}
                    onChange={e => setFiltros(p => ({ ...p, asesor: e.target.value }))}
                    options={[{ value: "todos", label: "Todos los asesores" }, ...asesoresDisponibles.map(a => ({ value: a, label: a }))]} />
            </div>
            <div className="mt-4 border-t pt-4" style={{ borderColor: BORDER }}>
                <button type="button" onClick={limpiarFiltros}
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    style={{ borderColor: BORDER }}>
                    Limpiar filtros
                </button>
            </div>
        </div>
    );
    return (
        <>
            <div className="hidden xl:block">{contenido}</div>
            {abierto ? (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md p-3">{contenido}</div>
                </div>
            ) : null}
        </>
    );
}

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [errores, setErrores] = useState([]);
    const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false);
    const [filtros, setFiltros] = useState(() => ({ ...FILTROS_INICIALES, ...obtenerRangoDesdeDias(180) }));
    const [data, setData] = useState({ casos: [], prospectos: [], citas: [], registroPiso: [], pruebas: [], entregas: [], encuestas: [] });
    const [coreListo, setCoreListo] = useState(false);
    const montado = useRef(true);

    useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);

    const cargarDatos = async ({ forzar = false } = {}) => {
        if (forzar) setRefrescando(true); else setLoading(true);
        try {
            if (!forzar) {
                const cache = leerCache();
                if (cache) { setData(cache.data); setErrores(cache.errores || []); setLoading(false); setCoreListo(true); return; }
            }
            const siguienteData = { casos: [], prospectos: [], citas: [], registroPiso: [], pruebas: [], entregas: [], encuestas: [] };
            const modulosConError = [];
            const modulosCore = new Set(["prospectos", "citas", "registroPiso", "pruebas", "entregas"]);
            let coreRestantes = modulosCore.size;

            await Promise.all(ORDEN_CARGA.map(async nombre => {
                const ruta = RUTAS_API[nombre];
                try {
                    const registros = await solicitarTodasLasPaginas(ruta);
                    if (!montado.current) return;
                    siguienteData[nombre] = Array.isArray(registros) ? registros : [];
                } catch { modulosConError.push(nombre); }
                finally {
                    if (modulosCore.has(nombre)) {
                        coreRestantes--;
                        if (coreRestantes === 0 && montado.current) { setData({ ...siguienteData }); setCoreListo(true); }
                    }
                }
            }));

            if (!montado.current) return;
            guardarCache({ data: siguienteData, errores: modulosConError });
            setData(siguienteData);
            setErrores(modulosConError);
            setCoreListo(true);
        } catch { setErrores(["dashboard"]); }
        finally { if (montado.current) { setLoading(false); setRefrescando(false); } }
    };

    useEffect(() => { cargarDatos(); }, []);  // eslint-disable-line

    const periodoActivo = useMemo(() => detectarPeriodoActivo(filtros.fechaInicio, filtros.fechaFin), [filtros.fechaInicio, filtros.fechaFin]);

    const dealersDisponibles = useMemo(() => {
        const vals = new Set();
        Object.keys(CAMPOS_POR_MODULO).forEach(modulo => (data[modulo] || []).forEach(item => {
            const d = obtenerDealerItem(item, modulo);
            if (d && d !== "Sin agencia") vals.add(d);
        }));
        return [...vals].sort((a, b) => a.localeCompare(b, "es"));
    }, [data]);

    const asesoresDisponibles = useMemo(() => {
        const vals = new Set();
        ["prospectos", "citas", "registroPiso", "pruebas", "entregas", "encuestas", "casos"].forEach(modulo =>
            (data[modulo] || []).forEach(item => {
                const a = obtenerAsesorItem(item, modulo);
                if (a && a !== "Sin asignar") vals.add(a);
            })
        );
        return [...vals].sort((a, b) => a.localeCompare(b, "es"));
    }, [data]);

    const aplicarPeriodoRapido = (dias) => {
        const rango = obtenerRangoDesdeDias(dias);
        setFiltros(prev => ({ ...prev, fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin }));
    };

    const analitica = useMemo(() => {
        const casosFiltrados = filtrarModulo(data.casos, "casos", filtros);
        const prospectosFiltrados = filtrarModulo(data.prospectos, "prospectos", filtros);
        const citasFiltradas = filtrarModulo(data.citas, "citas", filtros);
        const registroPisoFiltrado = filtrarModulo(data.registroPiso, "registroPiso", filtros);
        const pruebasFiltradas = filtrarModulo(data.pruebas, "pruebas", filtros);
        const entregasFiltradas = filtrarModulo(data.entregas, "entregas", filtros);
        const encuestasFiltradas = filtrarModulo(data.encuestas, "encuestas", filtros);

        const estadosCierre = new Set(["cerrado", "cerrada", "resuelto", "resuelta", "solucionado", "solucionada", "concluido", "concluida", "finalizado", "finalizada"]);
        const reclamacionesAbiertas = casosFiltrados.filter(i => !estadosCierre.has(String(i?.estado || "").trim().toLowerCase())).length;

        const asistenciaTotal = citasFiltradas.filter(i => Boolean(i?.asistencia)).length + registroPisoFiltrado.filter(i => Boolean(i?.asistencia)).length + pruebasFiltradas.filter(i => Boolean(i?.asistencia)).length;
        const totalEventos = citasFiltradas.length + registroPisoFiltrado.length + pruebasFiltradas.length;

        const resumen = {
            totalProspectos: prospectosFiltrados.length,
            totalCitas: citasFiltradas.length,
            totalPruebas: pruebasFiltradas.length,
            totalEntregas: entregasFiltradas.length,
            totalRegistrosPiso: registroPisoFiltrado.length,
            conversionProspectoEntrega: redondear(porcentaje(entregasFiltradas.length, prospectosFiltrados.length), 1),
            asistenciaGeneral: redondear(porcentaje(asistenciaTotal, totalEventos), 1),
            promedioEncuestas: redondear(promedio(encuestasFiltradas.map(scoreEncuesta)), 1),
            reclamacionesAbiertas,
            encuestasTotales: encuestasFiltradas.length,
            casosTotales: casosFiltrados.length,
            totalRegistrosFiltrados: casosFiltrados.length + prospectosFiltrados.length + citasFiltradas.length + registroPisoFiltrado.length + pruebasFiltradas.length + entregasFiltradas.length + encuestasFiltradas.length,
        };

        const embudo = [
            { etapa: "Prospectos", cantidad: prospectosFiltrados.length },
            { etapa: "Citas", cantidad: citasFiltradas.length },
            { etapa: "Piso", cantidad: registroPisoFiltrado.length },
            { etapa: "Pruebas", cantidad: pruebasFiltradas.length },
            { etapa: "Entregas", cantidad: entregasFiltradas.length },
        ];

        const agenciasMap = new Map();
        const asegurarAgencia = agencia => {
            const n = normalizarAgencia(agencia);
            if (!agenciasMap.has(n)) agenciasMap.set(n, { agencia: n, prospectos: 0, citas: 0, pruebas: 0, entregas: 0, registroPiso: 0, casos: 0, encuestas: 0, _sumaEncuestas: 0 });
            return agenciasMap.get(n);
        };
        prospectosFiltrados.forEach(i => { asegurarAgencia(obtenerDealerItem(i, "prospectos")).prospectos++; });
        citasFiltradas.forEach(i => { asegurarAgencia(obtenerDealerItem(i, "citas")).citas++; });
        registroPisoFiltrado.forEach(i => { asegurarAgencia(obtenerDealerItem(i, "registroPiso")).registroPiso++; });
        pruebasFiltradas.forEach(i => { asegurarAgencia(obtenerDealerItem(i, "pruebas")).pruebas++; });
        entregasFiltradas.forEach(i => { asegurarAgencia(obtenerDealerItem(i, "entregas")).entregas++; });
        casosFiltrados.forEach(i => { asegurarAgencia(obtenerDealerItem(i, "casos")).casos++; });
        encuestasFiltradas.forEach(i => { const a = asegurarAgencia(obtenerDealerItem(i, "encuestas")); a.encuestas++; a._sumaEncuestas += scoreEncuesta(i); });

        const rendimientoPorAgencia = [...agenciasMap.values()]
            .map(i => ({ ...i, promedioSatisfaccion: i.encuestas ? redondear(i._sumaEncuestas / i.encuestas, 1) : 0, actividadTotal: i.prospectos + i.citas + i.pruebas + i.entregas + i.registroPiso + i.casos }))
            .sort((a, b) => scoreCierreAgencia(b) - scoreCierreAgencia(a))
            .slice(0, 8);

        const estatusProspectos = agruparConteo(prospectosFiltrados, i => normalizarTexto(i?.estado, "Sin estado")).sort((a, b) => b.value - a.value).slice(0, 6);
        const origenReclamaciones = agruparConteo(casosFiltrados, i => normalizarTexto(i?.origen, "Sin origen")).sort((a, b) => b.value - a.value).slice(0, 6);
        const satisfaccionPorAgencia = encuestasFiltradas.length
            ? [...agenciasMap.values()].filter(i => i.encuestas > 0).map(i => ({ agencia: i.agencia, promedio: redondear(i._sumaEncuestas / i.encuestas, 1), encuestas: i.encuestas })).sort((a, b) => b.promedio - a.promedio).slice(0, 8)
            : [];

        const asesoresMap = new Map();
        const asegurarAsesor = nombre => {
            const a = normalizarTexto(nombre, "Sin asignar");
            if (!asesoresMap.has(a)) asesoresMap.set(a, { asesor: a, prospectos: 0, citas: 0, registroPiso: 0, entregas: 0, pruebas: 0 });
            return asesoresMap.get(a);
        };
        prospectosFiltrados.forEach(i => { asegurarAsesor(obtenerAsesorItem(i, "prospectos")).prospectos++; });
        citasFiltradas.forEach(i => { asegurarAsesor(obtenerAsesorItem(i, "citas")).citas++; });
        registroPisoFiltrado.forEach(i => { asegurarAsesor(obtenerAsesorItem(i, "registroPiso")).registroPiso++; });
        pruebasFiltradas.forEach(i => { asegurarAsesor(obtenerAsesorItem(i, "pruebas")).pruebas++; });
        entregasFiltradas.forEach(i => { asegurarAsesor(obtenerAsesorItem(i, "entregas")).entregas++; });

        const topAsesores = [...asesoresMap.values()]
            .sort((a, b) => (b.entregas * 3 + b.pruebas * 2 + b.registroPiso * 1.3 + b.citas * 1.5 + b.prospectos) - (a.entregas * 3 + a.pruebas * 2 + a.registroPiso * 1.3 + a.citas * 1.5 + a.prospectos))
            .slice(0, 8);

        const timeline = construirSerieMensual(
            { prospectos: prospectosFiltrados, casos: casosFiltrados, encuestas: encuestasFiltradas, entregas: entregasFiltradas, citas: citasFiltradas, registroPiso: registroPisoFiltrado },
            { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin }
        );

        return { resumen, embudo, rendimientoPorAgencia, estatusProspectos, origenReclamaciones, satisfaccionPorAgencia, topAsesores, timeline };
    }, [data, filtros]);

    if (loading) return <LoadingState />;

    const hayDatos = data.casos.length || data.prospectos.length || data.citas.length || data.registroPiso.length || data.pruebas.length || data.entregas.length || data.encuestas.length;
    const totalRegistrosFiltrados = analitica.resumen.totalRegistrosFiltrados;
    const periodoLabel = periodoActivo ? `Últimos ${periodoActivo} días` : "Rango personalizado";

    return (
        <div className="min-h-screen space-y-6" >
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl p-6" style={{ backgroundColor: NAVY }}>
                <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">Métricas del CRM</h1>
                        <p className="mt-1 text-sm text-white/75">Panel operativo · prospectos, citas, piso, pruebas y entregas.</p>
                    </div>
                    <Toolbar onAbrirFiltros={() => setMenuFiltrosAbierto(true)} onActualizar={() => cargarDatos({ forzar: true })} refrescando={refrescando} totalRegistros={totalRegistrosFiltrados} />
                </div>
            </div>

            {!hayDatos ? (
                <div className="rounded-2xl border bg-white p-10 text-center" style={{ borderColor: BORDER }}>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: SURFACE, color: TEXT_MUTED }}><BarChart3 size={20} /></div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">Aún no hay datos para construir el panel</h2>
                    <p className="mt-2 text-sm" style={{ color: TEXT_MUTED }}>En cuanto existan registros en los módulos del CRM, aquí se mostrarán automáticamente las métricas y gráficas.</p>
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        {errores.length ? (
                            <div className="rounded-2xl border p-4" style={{ borderColor: "#F2D9A8", backgroundColor: "#FDF6E8", color: "#7A5318" }}>
                                <div className="flex items-start gap-3">
                                    <TriangleAlert className="mt-0.5" size={18} />
                                    <div>
                                        <p className="font-semibold">Algunos módulos no se cargaron por completo</p>
                                        <p className="mt-1 text-sm">Revisa los endpoints de: {errores.join(", ")}. El resto del panel se calculó con la información disponible.</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!coreListo ? (
                            <ChartFallback height={140} />
                        ) : (
                            <BarraEmbudo etapas={analitica.embudo} asistenciaGeneral={analitica.resumen.asistenciaGeneral} />
                        )}

                        {!totalRegistrosFiltrados ? (
                            <div className="rounded-2xl border bg-white p-10 text-center" style={{ borderColor: BORDER }}>
                                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: SURFACE, color: TEXT_MUTED }}><Funnel size={20} /></div>
                                <h2 className="mt-4 text-lg font-semibold text-slate-900">No hay coincidencias con los filtros actuales</h2>
                                <p className="mt-2 text-sm" style={{ color: TEXT_MUTED }}>Ajusta el rango de fechas, asesor o dealer para volver a visualizar actividad operativa.</p>
                            </div>
                        ) : (
                            <>
                                {/* KPIs */}
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <MetricCard icon={SmilePlus} title="Satisfacción" value={`${analitica.resumen.promedioEncuestas}/5`} accent={SUCCESS} sub={`${formatearNumero(analitica.resumen.encuestasTotales)} encuestas`} />
                                    <MetricCard icon={ClipboardList} title="Reclamaciones abiertas" value={formatearNumero(analitica.resumen.reclamacionesAbiertas)} accent={DANGER} sub={`${formatearNumero(analitica.resumen.casosTotales)} totales en periodo`} />
                                    <MetricCard icon={CarFront} title="Conversión a entrega" value={formatearPorcentaje(analitica.resumen.conversionProspectoEntrega)} accent={NAVY} sub="Prospecto → entrega" />
                                    <MetricCard icon={Users} title="Asistencia general" value={formatearPorcentaje(analitica.resumen.asistenciaGeneral)} accent={WARNING} sub="Citas, piso y pruebas" />
                                </div>

                                {/* Gráfica 1 — Tendencia áreas apiladas */}
                                <ChartCard title="Tendencia consolidada" action={periodoLabel}>
                                    {analitica.timeline.some(t => t.prospectos || t.citas || t.registrosPiso || t.entregas) ? (
                                        <GraficaTendenciaAreas timeline={analitica.timeline} periodoLabel={periodoLabel} />
                                    ) : (
                                        <EmptyChart text="No hay suficiente actividad histórica para construir la tendencia." height={340} />
                                    )}
                                </ChartCard>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    {/* Gráfica 2 — Heatmap por dealer */}
                                    <ChartCard title="Carga operativa por dealer" subtitle="Intensidad por módulo">
                                        {analitica.rendimientoPorAgencia.length ? (
                                            <GraficaHeatmapDealer data={analitica.rendimientoPorAgencia} />
                                        ) : (
                                            <EmptyChart text="No hay actividad por dealer suficiente en el periodo seleccionado." height={280} />
                                        )}
                                    </ChartCard>

                                    {/* Gráfica 3 — Treemap de estatus */}
                                    <ChartCard title="Distribución de estatus de prospectos" action="Top 6 estatus">
                                        {analitica.estatusProspectos.length ? (
                                            <GraficaTreemapEstatus data={analitica.estatusProspectos} />
                                        ) : (
                                            <EmptyChart text="No se encontraron estatus de prospectos para mostrar." height={280} />
                                        )}
                                    </ChartCard>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    {/* Gráfica 4 — Gauges radiales satisfacción */}
                                    <ChartCard title="Satisfacción por dealer" action={`${formatearNumero(analitica.resumen.encuestasTotales)} encuestas`}>
                                        {analitica.satisfaccionPorAgencia.length ? (
                                            <GraficaGaugesSatisfaccion data={analitica.satisfaccionPorAgencia} />
                                        ) : (
                                            <EmptyChart text="Aún no hay suficientes encuestas para comparar satisfacción por dealer." height={280} />
                                        )}
                                    </ChartCard>

                                    {/* Gráfica 5 — Barras horizontales reclamaciones */}
                                    <ChartCard title="Origen de reclamaciones" action={`${formatearNumero(analitica.resumen.casosTotales)} reclamaciones`}>
                                        {analitica.origenReclamaciones.length ? (
                                            <GraficaBarrasReclamaciones data={analitica.origenReclamaciones} />
                                        ) : (
                                            <EmptyChart text="No hay reclamaciones suficientes para identificar orígenes dominantes." height={280} />
                                        )}
                                    </ChartCard>
                                </div>

                                {/* Gráfica 6 — Swimlanes asesores */}
                                <ChartCard title="Asesores más destacados" action="Top 8 asesores">
                                    {analitica.topAsesores.length ? (
                                        <GraficaSwimlanesAsesores data={analitica.topAsesores} />
                                    ) : (
                                        <EmptyChart text="No hay suficiente información de asesores para comparar rendimiento." height={320} />
                                    )}
                                </ChartCard>
                            </>
                        )}
                    </div>

                    <PanelFiltros
                        abierto={menuFiltrosAbierto}
                        onClose={() => setMenuFiltrosAbierto(false)}
                        filtros={filtros}
                        setFiltros={setFiltros}
                        dealersDisponibles={dealersDisponibles}
                        asesoresDisponibles={asesoresDisponibles}
                        aplicarPeriodoRapido={aplicarPeriodoRapido}
                        periodoActivo={periodoActivo}
                    />
                </div>
            )}

            <button type="button" onClick={() => setMenuFiltrosAbierto(true)}
                className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] xl:hidden"
                style={{ backgroundColor: NAVY }}>
                <SlidersHorizontal size={16} /> Filtros
            </button>
        </div>
    );
}