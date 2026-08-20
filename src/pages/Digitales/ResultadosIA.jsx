import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity, AlertTriangle, BarChart3, Bot, BrainCircuit, CalendarDays, CheckCircle2,
    ChevronDown, ChevronUp, Clock3, Gauge, Lightbulb, Loader2, Megaphone, PhoneOff, RefreshCw,
    Settings2, ShieldAlert, Sparkles, Target, TrendingDown, TrendingUp, UserCheck, Users, WalletCards,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";

const AZUL = "#131E5C";
const DIAS_HORARIO = [
    { key: "lunes", label: "Lunes" }, { key: "martes", label: "Martes" },
    { key: "miercoles", label: "Miércoles" }, { key: "jueves", label: "Jueves" },
    { key: "viernes", label: "Viernes" }, { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
];
const HORARIO_DEFAULT = {
    lunes: { activo: true, inicio: "09:00", fin: "18:00" },
    martes: { activo: true, inicio: "09:00", fin: "18:00" },
    miercoles: { activo: true, inicio: "09:00", fin: "18:00" },
    jueves: { activo: true, inicio: "09:00", fin: "18:00" },
    viernes: { activo: true, inicio: "09:00", fin: "18:00" },
    sabado: { activo: true, inicio: "09:00", fin: "14:00" },
    domingo: { activo: false, inicio: "09:00", fin: "14:00" },
};
const PAUSA_COMIDA_DEFAULT = { activo: true, inicio: "14:00", fin: "15:00", dias: ["lunes", "martes", "miercoles", "jueves", "viernes"] };
const FASES_CARGA = [
    "Cargando base de datos...",
    "Aplicando filtros, exclusiones y horarios...",
    "Preparando conversaciones para Gemini...",
    "Enviando base de datos a Gemini...",
    "Procesando análisis comercial...",
    "Generando recomendaciones y resultados...",
];
const STORAGE_REGLAS = "digitales.resultadosIA.reglasTiempo.v1";

function copiarHorario(origen = HORARIO_DEFAULT) {
    const pausaOrigen = origen?.pausa_comida || PAUSA_COMIDA_DEFAULT;
    return {
        ...Object.fromEntries(DIAS_HORARIO.map(({ key }) => [key, { ...(origen?.[key] || HORARIO_DEFAULT[key]) }])),
        pausa_comida: {
            activo: pausaOrigen.activo ?? PAUSA_COMIDA_DEFAULT.activo,
            inicio: pausaOrigen.inicio || PAUSA_COMIDA_DEFAULT.inicio,
            fin: pausaOrigen.fin || PAUSA_COMIDA_DEFAULT.fin,
            dias: Array.isArray(pausaOrigen.dias) ? [...pausaOrigen.dias] : [...PAUSA_COMIDA_DEFAULT.dias],
        },
    };
}
function leerReglasGuardadas() {
    try {
        const raw = localStorage.getItem(STORAGE_REGLAS);
        const data = raw ? JSON.parse(raw) : null;
        return data && typeof data === "object" ? data : null;
    } catch { return null; }
}

const formatNumero = new Intl.NumberFormat("es-MX");
const formatDinero = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function cls(...values) { return values.filter(Boolean).join(" "); }
function pct(value) { const n = Number(value || 0); return `${Number.isFinite(n) ? n.toFixed(1) : "0.0"}%`; }
function dinero(value) { return formatDinero.format(Number(value || 0)); }
function numero(value) { return formatNumero.format(Number(value || 0)); }
function mesActual() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function fmtFecha(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
function prioridadCls(value) {
    if (value === "alta") return "bg-red-50 text-red-700 border-red-200";
    if (value === "media") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
}
function Semaforo({ value }) {
    return <span className={cls("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", prioridadCls(value))}>{value || "media"}</span>;
}
function Kpi({ icon: Icon, label, value, detail, tone = "normal" }) {
    const toneCls = tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : tone === "good" ? "text-emerald-600" : "text-[#131E5C]";
    return <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div><p className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-400">{label}</p><div className={cls("mt-2 text-3xl font-black", toneCls)}>{value}</div></div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C]/[0.07] text-[#131E5C]"><Icon className="h-5 w-5" /></span>
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </div>;
}
function Barra({ label, value, total, suffix = "" }) {
    const width = total ? Math.min(100, (Number(value || 0) / total) * 100) : 0;
    return <div>
        <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate font-bold text-slate-700">{label}</span><span className="shrink-0 font-black text-[#131E5C]">{value}{suffix}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#131E5C] transition-all" style={{ width: `${width}%` }} /></div>
    </div>;
}
function Vacio({ texto = "No hay información suficiente para este bloque." }) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">{texto}</div>;
}
function PantallaCargaAnalisis() {
    const [paso, setPaso] = useState(0);
    useEffect(() => {
        setPaso(0);
        const timer = window.setInterval(() => setPaso((actual) => Math.min(actual + 1, FASES_CARGA.length - 1)), 3500);
        return () => window.clearInterval(timer);
    }, []);
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#131E5C] text-white"><BrainCircuit className="h-7 w-7 animate-pulse" /></div>
            <p className="mt-5 text-center text-[11px] font-black uppercase tracking-[.16em] text-slate-400">Análisis con inteligencia artificial</p>
            <h4 className="mt-2 text-center text-lg font-black text-[#131E5C]">{FASES_CARGA[paso]}</h4>
            <div className="mt-6 space-y-2">
                {FASES_CARGA.map((fase, i) => <div key={fase} className={cls("flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition", i === paso ? "bg-[#131E5C]/[0.06] text-[#131E5C]" : i < paso ? "text-emerald-700" : "text-slate-300")}>
                    {i < paso ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : i === paso ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-current" />}
                    <span>{fase}</span>
                </div>)}
            </div>
            <p className="mt-5 text-center text-[11px] font-semibold leading-5 text-slate-400">La etapa mostrada es una guía visual mientras el servidor completa la solicitud; el resultado se mostrará automáticamente al finalizar.</p>
        </div>
    </div>;
}

export default function ResultadosIA({ numeroAsesorInicial = "", agenciaInicial = "", businessInicial = "" }) {
    const guardadas = useMemo(() => leerReglasGuardadas(), []);
    const [mes, setMes] = useState(mesActual());
    const [numeroAsesor, setNumeroAsesor] = useState(numeroAsesorInicial || "");
    const [agencia, setAgencia] = useState(agenciaInicial || "");
    const [business, setBusiness] = useState(businessInicial || "");
    const [horario, setHorario] = useState(() => copiarHorario(guardadas?.horario || HORARIO_DEFAULT));
    const [lineasExcluidasTiempo, setLineasExcluidasTiempo] = useState(() => Array.isArray(guardadas?.lineasExcluidasTiempo) ? guardadas.lineasExcluidasTiempo : []);
    const [configuracion, setConfiguracion] = useState(null);
    const [cargandoConfiguracion, setCargandoConfiguracion] = useState(true);
    const [mostrarReglas, setMostrarReglas] = useState(true);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [abierto, setAbierto] = useState("");
    const [cambiosPendientes, setCambiosPendientes] = useState(true);

    useEffect(() => { if (numeroAsesorInicial) setNumeroAsesor(numeroAsesorInicial); }, [numeroAsesorInicial]);
    useEffect(() => { setAgencia(agenciaInicial || ""); }, [agenciaInicial]);
    useEffect(() => { setBusiness(businessInicial || ""); }, [businessInicial]);

    useEffect(() => {
        let activo = true;
        (async () => {
            setCargandoConfiguracion(true);
            try {
                const res = await api.digitalesResultadosIA({ configuracion: 1 });
                if (!activo) return;
                setConfiguracion(res || null);
                if (!guardadas?.horario && res?.horario_predeterminado) setHorario(copiarHorario(res.horario_predeterminado));
            } catch (e) {
                if (activo) setError(e?.message || "No fue posible cargar las líneas disponibles.");
            } finally { if (activo) setCargandoConfiguracion(false); }
        })();
        return () => { activo = false; };
    }, [guardadas]);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_REGLAS, JSON.stringify({ horario, lineasExcluidasTiempo })); } catch { /* sin acción */ }
    }, [horario, lineasExcluidasTiempo]);

    const actualizarDia = (dia, cambios) => {
        setHorario((prev) => ({ ...prev, [dia]: { ...prev[dia], ...cambios } }));
        setCambiosPendientes(true);
    };
    const actualizarPausaComida = (cambios) => {
        setHorario((prev) => ({ ...prev, pausa_comida: { ...PAUSA_COMIDA_DEFAULT, ...(prev.pausa_comida || {}), ...cambios } }));
        setCambiosPendientes(true);
    };

    const toggleLineaExcluida = (numeroLinea) => {
        setLineasExcluidasTiempo((prev) => prev.includes(numeroLinea) ? prev.filter((x) => x !== numeroLinea) : [...prev, numeroLinea]);
        setCambiosPendientes(true);
    };

    const restaurarHorario = () => { setHorario(copiarHorario(configuracion?.horario_predeterminado || HORARIO_DEFAULT)); setLineasExcluidasTiempo([]); setCambiosPendientes(true); };

    const cargar = useCallback(async ({ forzar = false } = {}) => {
        setLoading(true); setError("");
        try {
            const res = await api.digitalesResultadosIA({
                mes,
                ...(numeroAsesor ? { numero_asesor: numeroAsesor } : {}),
                ...(agencia ? { agencia } : {}),
                ...(business ? { business } : {}),
                horario_respuesta: JSON.stringify(horario),
                lineas_excluir_tiempo: lineasExcluidasTiempo.join(","),
                ...(forzar ? { forzar: 1 } : {}),
            });
            setData(res || null);
            setCambiosPendientes(false);
            setMostrarReglas(false);
        } catch (e) {
            console.error("Error cargando Resultados IA:", e);
            setError(e?.message || "No fue posible cargar el análisis de resultados.");
        } finally { setLoading(false); }
    }, [mes, numeroAsesor, agencia, business, horario, lineasExcluidasTiempo]);

    const metricas = data?.metricas || {};
    const analisis = data?.analisis || {};
    const asesores = data?.asesores || [];
    const campanas = data?.campanas || [];
    const intereses = data?.intereses || [];
    const objeciones = data?.objeciones || [];
    const deficiencias = data?.deficiencias || [];
    const distribucion = data?.distribucion_interes || [];
    const maxInteres = Math.max(1, ...intereses.map((x) => Number(x.total || 0)));
    const maxObjecion = Math.max(1, ...objeciones.map((x) => Number(x.total || 0)));
    const maxDef = Math.max(1, ...deficiencias.map((x) => Number(x.total || 0)));

    const lineasDisponibles = configuracion?.lineas || data?.lineas || [];
    const agencias = useMemo(() => [...new Set(lineasDisponibles.map((x) => x.agencia).filter(Boolean))].sort(), [lineasDisponibles]);
    const businesses = useMemo(() => [...new Set(lineasDisponibles.map((x) => x.business).filter(Boolean))].sort(), [lineasDisponibles]);

    return <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[#131E5C]/15 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0"><div className="flex items-center gap-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C] text-white"><BrainCircuit className="h-5 w-5" /></span><div><h3 className="text-lg font-black text-[#131E5C]">Resultados · Inteligencia comercial</h3></div></div></div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6 xl:items-end">
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Mes<input type="month" value={mes} onChange={(e) => { setMes(e.target.value); setCambiosPendientes(true); }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none focus:border-[#131E5C]/50" /></label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Línea<select value={numeroAsesor} onChange={(e) => { setNumeroAsesor(e.target.value); setCambiosPendientes(true); }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none focus:border-[#131E5C]/50"><option value="">Todas permitidas</option>{lineasDisponibles.map((x) => <option key={x.numero} value={x.numero}>{x.asesor_digital || x.numero}</option>)}</select></label>
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Líneas excluidas</span>
                            <details className="group relative">
                                <summary className="flex h-10 w-full cursor-pointer list-none items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 [&::-webkit-details-marker]:hidden">
                                    <span className="min-w-0 truncate">{lineasExcluidasTiempo.length === 0 ? "Ninguna" : lineasExcluidasTiempo.length === 1 ? lineasDisponibles.find((x) => x.numero === lineasExcluidasTiempo[0])?.asesor_digital || "1 línea" : `${lineasExcluidasTiempo.length} líneas`}</span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                                </summary>

                                <div className="absolute left-0 z-50 mt-1 w-[340px] max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
                                        <p className="text-xs font-black text-[#131E5C]">Excluir del análisis</p>
                                        {lineasExcluidasTiempo.length > 0 ? <button type="button" onClick={(e) => { e.preventDefault(); setLineasExcluidasTiempo([]); setCambiosPendientes(true); }} className="text-[10px] font-black text-[#131E5C] hover:underline">Limpiar</button> : null}
                                    </div>

                                    <div className="max-h-72 overflow-y-auto p-2">
                                        {cargandoConfiguracion ? (
                                            <div className="flex items-center gap-2 px-3 py-4 text-xs font-semibold text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Cargando líneas...</div>
                                        ) : lineasDisponibles.length ? (
                                            lineasDisponibles.map((x) => {
                                                const seleccionada = lineasExcluidasTiempo.includes(x.numero);
                                                return (
                                                    <label key={x.numero} className={cls("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition", seleccionada ? "bg-[#131E5C]/[0.05]" : "hover:bg-slate-50")}>
                                                        <input type="checkbox" checked={seleccionada} onChange={() => toggleLineaExcluida(x.numero)} className="h-4 w-4 shrink-0 accent-[#131E5C]" />
                                                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-black normal-case tracking-normal text-slate-700">{x.asesor_digital || x.numero}</span><span className="block truncate text-[10px] font-semibold normal-case tracking-normal text-slate-400">{x.numero} · {x.agencia} · {x.business}</span></span>
                                                    </label>
                                                );
                                            })
                                        ) : <p className="px-3 py-4 text-xs font-semibold text-slate-400">No hay líneas disponibles.</p>}
                                    </div>
                                </div>
                            </details>
                        </div>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Dealer<select value={agencia} onChange={(e) => { setAgencia(e.target.value); setCambiosPendientes(true); }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none focus:border-[#131E5C]/50"><option value="">Todos</option>{agencias.map((x) => <option key={x}>{x}</option>)}</select></label>
                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Business<select value={business} onChange={(e) => { setBusiness(e.target.value); setCambiosPendientes(true); }} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none focus:border-[#131E5C]/50"><option value="">Todos</option>{businesses.map((x) => <option key={x}>{x}</option>)}</select></label>
                        <button type="button" onClick={() => cargar({ forzar: Boolean(data) })} disabled={loading || cargandoConfiguracion} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-3 text-sm font-black text-white transition hover:bg-[#131E5C]/95 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : data ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{data ? "Reanalizar IA" : "Generar análisis"}</button>
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/70">
                <button type="button" onClick={() => setMostrarReglas((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left">
                    <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-[#131E5C]" /><span><span className="block text-xs font-black uppercase tracking-[.12em] text-[#131E5C]">Reglas de tiempo de respuesta</span></span></span>
                    {mostrarReglas ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {mostrarReglas ? <div className="grid gap-4 border-t border-slate-200/70 bg-white p-5 ">
                    <div>
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black text-[#131E5C]">Horario que sí cuenta para el reloj</p></div><button type="button" onClick={restaurarHorario} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-600 hover:bg-slate-50">Restaurar</button></div>
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-xs font-black text-amber-800"><input type="checkbox" checked={Boolean(horario.pausa_comida?.activo)} onChange={(e) => actualizarPausaComida({ activo: e.target.checked })} className="h-4 w-4 accent-[#131E5C]" />Excluir horario de comida</label>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Lunes a viernes</span>
                            </div>
                            <div className="mt-2 grid max-w-sm grid-cols-2 gap-2">
                                <input type="time" value={horario.pausa_comida?.inicio || PAUSA_COMIDA_DEFAULT.inicio} disabled={!horario.pausa_comida?.activo} onChange={(e) => actualizarPausaComida({ inicio: e.target.value })} className="h-9 rounded-md border border-amber-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100" />
                                <input type="time" value={horario.pausa_comida?.fin || PAUSA_COMIDA_DEFAULT.fin} disabled={!horario.pausa_comida?.activo} onChange={(e) => actualizarPausaComida({ fin: e.target.value })} className="h-9 rounded-md border border-amber-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100" />
                            </div>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{DIAS_HORARIO.map(({ key, label }) => { const cfg = horario[key] || HORARIO_DEFAULT[key]; return <div key={key} className={cls("rounded-lg border p-3", cfg.activo ? "border-[#131E5C]/15 bg-[#131E5C]/[0.02]" : "border-slate-200 bg-slate-50 opacity-70")}><label className="flex items-center gap-2 text-xs font-black text-slate-700"><input type="checkbox" checked={Boolean(cfg.activo)} onChange={(e) => actualizarDia(key, { activo: e.target.checked })} className="h-4 w-4 accent-[#131E5C]" />{label}</label><div className="mt-2 grid grid-cols-2 gap-2"><input type="time" value={cfg.inicio} disabled={!cfg.activo} onChange={(e) => actualizarDia(key, { inicio: e.target.value })} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100" /><input type="time" value={cfg.fin} disabled={!cfg.activo} onChange={(e) => actualizarDia(key, { fin: e.target.value })} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 disabled:bg-slate-100" /></div></div>; })}</div>
                    </div>
                </div> : null}
            </div>

            {data ? <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50 px-5 py-2 text-[11px] font-semibold text-slate-500"><span>Generado: {fmtFecha(data?.generado_at)}</span><span>Modelo: {data?.modelo_ia || "—"}</span><span>Cobertura: {pct(data?.cobertura?.porcentaje)}</span><span>Tiempo evaluable: {numero(data?.metricas?.conversaciones_tiempo_evaluable)} chats</span><span>Fuera de jornada al corte: {numero(data?.metricas?.esperando_inicio_jornada)}</span>{data?.cache ? <span className="font-black text-emerald-700">Cache vigente</span> : null}{data?.ia?.errores?.length ? <span className="font-black text-amber-700">IA parcial / fallback activo</span> : <span className="font-black text-emerald-700">IA completa</span>}</div> : null}
            {data && cambiosPendientes ? <div className="border-t border-amber-200 bg-amber-50 px-5 py-2 text-[11px] font-black text-amber-700">Cambiaste filtros u horario después del último análisis. Pulsa “Reanalizar IA” para aplicar las nuevas reglas.</div> : null}
        </section>

        {loading ? <PantallaCargaAnalisis /> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div> : null}
        {!loading && !data && !error ? <div className="rounded-2xl border border-dashed border-[#131E5C]/20 bg-white px-6 py-12 text-center"><Clock3 className="mx-auto h-8 w-8 text-[#131E5C]" /><h4 className="mt-3 text-base font-black text-[#131E5C]">Configura el horario antes de medir</h4><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">El análisis no se ejecuta automáticamente. Revisa líneas excluidas y jornada laboral; después pulsa <b>Generar análisis</b>. Así los fines de semana y horas no laborables no distorsionan el desempeño.</p></div> : null}

        {data ? <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <Kpi icon={Users} label="Conversaciones" value={numero(metricas.conversaciones)} detail={`${numero(metricas.mensajes)} mensajes analizados`} />
                <Kpi icon={Target} label="Interés detectado" value={pct(metricas.clientes_interesados_pct)} detail={`${numero(metricas.clientes_interesados)} clientes con interés medio/alto`} tone="good" />
                <Kpi icon={ShieldAlert} label="Mala atención" value={pct(metricas.mal_atendidos_pct)} detail={`${numero(metricas.mal_atendidos)} conversaciones deficientes/críticas`} tone={metricas.mal_atendidos_pct >= 20 ? "danger" : "warning"} />
                <Kpi icon={Clock3} label="1ª respuesta hábil" value={metricas.primera_respuesta_promedio_label || "—"} detail={`Mediana ${metricas.primera_respuesta_mediana_label || "—"} · P90 ${metricas.primera_respuesta_p90_label || "—"}`} tone={Number(metricas.primera_respuesta_promedio_segundos || 0) > 14400 ? "danger" : "normal"} />
                <Kpi icon={TrendingDown} label="Riesgo alto" value={pct(metricas.riesgo_alto_pct)} detail={`${numero(metricas.riesgo_alto)} oportunidades requieren intervención`} tone="warning" />
                <Kpi icon={WalletCards} label="Inversión Meta" value={dinero(metricas.gasto_meta)} detail={`${numero(metricas.campanas_activas_periodo)} campañas en el periodo`} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-2xl bg-[#131E5C] p-6 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-black"><Sparkles className="h-5 w-5" /> Lectura ejecutiva de IA</div>
                    <p className="mt-4 text-lg font-bold leading-8 text-white/95">{analisis.resumen_ejecutivo || "Sin resumen ejecutivo disponible."}</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">{(analisis.hallazgos_clave || []).slice(0, 4).map((x, i) => <div key={`${x.titulo}-${i}`} className="rounded-xl border border-white/15 bg-white/10 p-4"><div className="flex items-start justify-between gap-2"><p className="font-black">{x.titulo}</p><Semaforo value={x.severidad} /></div><p className="mt-2 text-sm leading-6 text-white/75">{x.detalle}</p><p className="mt-2 text-xs font-black text-white/95">{x.metrica}</p></div>)}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">Proyección operativa</p><h4 className="mt-1 text-base font-black text-[#131E5C]">Si no se realizan mejoras</h4></div><Gauge className="h-6 w-6 text-[#131E5C]" /></div>
                    <div className="mt-4 flex items-center gap-2"><Semaforo value={analisis.prediccion?.riesgo} /><span className="text-xs font-bold text-slate-500">Escenario heurístico</span></div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{analisis.prediccion?.escenario_sin_mejoras || "Sin proyección disponible."}</p>
                    <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-800">{analisis.prediccion?.impacto_estimado || "—"}</div>
                    <p className="mt-3 text-[11px] leading-5 text-slate-400">{analisis.prediccion?.nota_metodologica || "No es un forecast financiero."}</p>
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Nivel de interés</h4></div><div className="space-y-4">{distribucion.map((x) => <Barra key={x.nivel} label={x.nivel.charAt(0).toUpperCase() + x.nivel.slice(1)} value={x.total} total={metricas.conversaciones || 1} suffix={` · ${pct(x.pct)}`} />)}</div></div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Vehículos de mayor interés</h4></div><div className="space-y-3">{intereses.length ? intereses.slice(0, 8).map((x) => <Barra key={x.nombre} label={x.nombre} value={x.total} total={maxInteres} suffix={` · ${pct(x.pct)}`} />) : <Vacio />}</div></div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Objeciones frecuentes</h4></div><div className="space-y-3">{objeciones.length ? objeciones.slice(0, 8).map((x) => <Barra key={x.nombre} label={x.nombre} value={x.total} total={maxObjecion} suffix={` · ${pct(x.pct)}`} />) : <Vacio texto="La IA no detectó objeciones repetitivas." />}</div></div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">Desempeño humano</p><h4 className="mt-1 text-base font-black text-[#131E5C]">Comparativo por asesor digital</h4></div>{data.asesor_mas_lento ? <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><Clock3 className="mr-1 inline h-4 w-4" /> Más lento: {data.asesor_mas_lento.asesor} · {data.asesor_mas_lento.tiempo_primera_respuesta_label}{data.asesor_mas_lento.brecha_vs_mediana_pct != null ? ` · +${data.asesor_mas_lento.brecha_vs_mediana_pct}% vs mediana` : ""}</div> : null}</div>
                <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Asesor</th><th className="px-4 py-3 text-center">Chats</th><th className="px-4 py-3 text-center">Interés</th><th className="px-4 py-3 text-center">Mala atención</th><th className="px-4 py-3 text-center">1ª respuesta hábil</th><th className="px-4 py-3 text-center">Score</th><th className="px-4 py-3">Recomendación</th></tr></thead><tbody>{asesores.map((a) => <tr key={a.asesor} className="border-t border-slate-100 align-top hover:bg-slate-50/70"><td className="px-4 py-3"><div className="font-black text-[#131E5C]">{a.asesor}</div><div className="mt-0.5 text-[10px] text-slate-400">{a.agencia} · {a.business}</div></td><td className="px-4 py-3 text-center font-black">{a.conversaciones}</td><td className="px-4 py-3 text-center font-black text-emerald-700">{pct(a.interes_pct)}</td><td className="px-4 py-3 text-center font-black text-red-600">{pct(a.mal_atendidos_pct)}</td><td className="px-4 py-3 text-center font-black">{a.tiempo_primera_respuesta_label}</td><td className="px-4 py-3 text-center"><span className={cls("inline-flex min-w-12 justify-center rounded-full px-2 py-1 font-black", a.puntaje_atencion >= 80 ? "bg-emerald-50 text-emerald-700" : a.puntaje_atencion >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{a.puntaje_atencion}/100</span></td><td className="max-w-[360px] px-4 py-3"><button type="button" onClick={() => setAbierto(abierto === a.asesor ? "" : a.asesor)} className="inline-flex items-center gap-1 font-black text-[#131E5C]">Ver análisis {abierto === a.asesor ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>{abierto === a.asesor ? <div className="mt-2 space-y-2 text-[11px] leading-5 text-slate-600"><Semaforo value={a.prioridad} />{a.deficiencias_ia?.length ? <p><b>Deficiencias:</b> {a.deficiencias_ia.join(" · ")}</p> : null}{a.recomendaciones?.length ? <p><b>Mejoras:</b> {a.recomendaciones.join(" · ")}</p> : <p>Priorizar rapidez, perfilamiento y cierre de siguiente acción.</p>}</div> : null}</td></tr>)}</tbody></table></div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Deficiencias más repetidas</h4></div><div className="space-y-3">{deficiencias.length ? deficiencias.slice(0, 10).map((x) => <Barra key={x.nombre} label={x.nombre} value={x.total} total={maxDef} suffix={` · ${pct(x.pct)}`} />) : <Vacio />}</div></div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Causas raíz y acciones prioritarias</h4></div><div className="grid gap-3 md:grid-cols-2">{(analisis.causas_raiz || []).map((x, i) => <div key={`${x.causa}-${i}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><p className="font-black text-slate-800">{x.causa}</p><Semaforo value={x.prioridad} /></div><p className="mt-2 text-xs leading-5 text-slate-500"><b>Evidencia:</b> {x.evidencia}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{x.impacto}</p></div>)}{!(analisis.causas_raiz || []).length ? <Vacio /> : null}</div><div className="mt-4 space-y-2">{(analisis.recomendaciones_globales || []).map((x, i) => <div key={`${x.accion}-${i}`} className="flex gap-3 rounded-xl bg-slate-50 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-[#131E5C]">{x.accion}</p><Semaforo value={x.prioridad} /></div><p className="mt-1 text-xs leading-5 text-slate-500">{x.motivo} <b>{x.impacto_esperado}</b></p></div></div>)}</div></div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5"><div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-[#131E5C]" /><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">Meta Ads + CRM</p><h4 className="text-base font-black text-[#131E5C]">Calidad comercial de campañas</h4></div></div><p className="mt-2 max-w-4xl text-xs leading-5 text-slate-500">El costo de Meta se interpreta junto con los leads que realmente llegaron al CRM y la calidad/interés detectados en sus conversaciones. Una campaña barata no necesariamente es buena si trae conversaciones sin intención.</p></div>
                {campanas.length ? <div className="grid gap-4 p-5 xl:grid-cols-2">{campanas.map((c) => <article key={c.id_campana} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#131E5C]">{c.nombre_campana || `Campaña ${c.id_campana}`}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{c.sucursal} · {c.objetivo || "Objetivo no informado"}</p></div><Semaforo value={c.analisis_ia?.prioridad || "media"} /></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Gasto</p><p className="font-black text-[#131E5C]">{dinero(c.gasto)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Costo resultado</p><p className="font-black text-[#131E5C]">{dinero(c.costo_resultado)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Leads CRM</p><p className="font-black text-[#131E5C]">{numero(c.leads_crm_atribuidos)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Interés CRM</p><p className="font-black text-emerald-700">{pct(c.interes_crm_pct)}</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-slate-100 p-3 text-xs leading-5 text-slate-600"><b>Audiencia actual:</b><br />Edad: {c.edad_audiencia || "Sin dato"}<br />Intereses: {c.intereses_audiencia || "Sin dato"}<br />Comportamiento: {c.comportamiento_audiencia || "Sin dato"}</div><div className="rounded-lg border border-[#131E5C]/10 bg-[#131E5C]/[0.03] p-3 text-xs leading-5 text-slate-700"><b className="text-[#131E5C]">Lectura IA:</b><br />{c.analisis_ia?.diagnostico || "Sin diagnóstico específico."}<br /><b>Recomendación:</b> {c.analisis_ia?.recomendacion || "Acumular más atribución CRM antes de modificar segmentación."}{c.analisis_ia?.audiencia_sugerida ? <><br /><b>Audiencia sugerida:</b> {c.analisis_ia.audiencia_sugerida}</> : null}</div></div></article>)}</div> : <div className="p-5"><Vacio texto="No se encontraron campañas Meta para el periodo y filtros seleccionados." /></div>}
            </section>

            <section className="rounded-2xl border border-[#131E5C]/15 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                <div className="flex items-start gap-3"><Bot className="mt-0.5 h-5 w-5 shrink-0 text-[#131E5C]" /><div><p className="font-black text-[#131E5C]">Cómo interpretar este panel</p><p className="mt-1">Los porcentajes de interés, calidad y riesgo provienen de clasificaciones IA sobre conversaciones del periodo; los tiempos usan <b>minutos hábiles</b> según las reglas configuradas. Una espera completamente fuera de jornada no penaliza al asesor. Cobertura IA: <b>{pct(data.cobertura?.porcentaje)}</b> ({numero(data.cobertura?.auditadas)} de {numero(data.cobertura?.conversaciones)} conversaciones). Chats con tiempo evaluable: <b>{numero(metricas.conversaciones_tiempo_evaluable)}</b>; excluidos del SLA: <b>{numero(metricas.conversaciones_tiempo_excluidas)}</b>.</p></div></div></section>
        </> : null}
    </div>;
}