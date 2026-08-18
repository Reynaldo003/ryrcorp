import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity, AlertTriangle, BarChart3, Bot, BrainCircuit, CalendarDays, CheckCircle2,
    ChevronDown, ChevronUp, Clock3, Gauge, Lightbulb, Loader2, Megaphone, RefreshCw,
    ShieldAlert, Sparkles, Target, TrendingDown, TrendingUp, UserCheck, Users, WalletCards,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";

const AZUL = "#131E5C";
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

export default function ResultadosIA({ numeroAsesorInicial = "", agenciaInicial = "", businessInicial = "" }) {
    const [mes, setMes] = useState(mesActual());
    const [numeroAsesor, setNumeroAsesor] = useState(numeroAsesorInicial || "");
    const [agencia, setAgencia] = useState(agenciaInicial || "");
    const [business, setBusiness] = useState(businessInicial || "");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [abierto, setAbierto] = useState("");

    useEffect(() => { if (numeroAsesorInicial) setNumeroAsesor(numeroAsesorInicial); }, [numeroAsesorInicial]);
    useEffect(() => { setAgencia(agenciaInicial || ""); }, [agenciaInicial]);
    useEffect(() => { setBusiness(businessInicial || ""); }, [businessInicial]);

    const cargar = useCallback(async ({ forzar = false } = {}) => {
        setLoading(true); setError("");
        try {
            const res = await api.digitalesResultadosIA({
                mes,
                ...(numeroAsesor ? { numero_asesor: numeroAsesor } : {}),
                ...(agencia ? { agencia } : {}),
                ...(business ? { business } : {}),
                ...(forzar ? { forzar: 1 } : {}),
            });
            setData(res || null);
        } catch (e) {
            console.error("Error cargando Resultados IA:", e);
            setError(e?.message || "No fue posible cargar el análisis de resultados.");
        } finally { setLoading(false); }
    }, [mes, numeroAsesor, agencia, business]);

    useEffect(() => { cargar(); }, [cargar]);

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

    const agencias = useMemo(() => [...new Set((data?.lineas || []).map((x) => x.agencia).filter(Boolean))].sort(), [data?.lineas]);
    const businesses = useMemo(() => [...new Set((data?.lineas || []).map((x) => x.business).filter(Boolean))].sort(), [data?.lineas]);

    return <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[#131E5C]/15 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C] text-white"><BrainCircuit className="h-5 w-5" /></span><div><h3 className="text-lg font-black text-[#131E5C]">Resultados · Inteligencia comercial</h3><p className="text-sm text-slate-500">Auditoría mensual de conversaciones, asesores y campañas.</p></div></div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Mes<input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none focus:border-[#131E5C]/50" /></label>
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Línea<select value={numeroAsesor} onChange={(e) => setNumeroAsesor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C]"><option value="">Todas permitidas</option>{(data?.lineas || []).map((x) => <option key={x.numero} value={x.numero}>{x.asesor_digital || x.numero}</option>)}</select></label>
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Dealer<select value={agencia} onChange={(e) => setAgencia(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C]"><option value="">Todos</option>{agencias.map((x) => <option key={x}>{x}</option>)}</select></label>
                    <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Business<select value={business} onChange={(e) => setBusiness(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#131E5C]"><option value="">Todos</option>{businesses.map((x) => <option key={x}>{x}</option>)}</select></label>
                    <button type="button" onClick={() => cargar({ forzar: true })} disabled={loading} className="mt-[18px] inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-3 text-sm font-black text-white disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Reanalizar IA</button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-slate-50 px-5 py-2 text-[11px] font-semibold text-slate-500">
                <span>Generado: {fmtFecha(data?.generado_at)}</span><span>Modelo: {data?.modelo_ia || "—"}</span><span>Cobertura: {pct(data?.cobertura?.porcentaje)}</span>{data?.cache ? <span className="font-black text-emerald-700">Cache vigente</span> : null}{data?.ia?.errores?.length ? <span className="font-black text-amber-700">IA parcial / fallback activo</span> : <span className="font-black text-emerald-700">IA completa</span>}
            </div>
        </section>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div> : null}
        {loading && !data ? <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-black/10 bg-white"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#131E5C]" /><p className="mt-3 text-sm font-bold text-slate-500">Analizando resultados del mes…</p></div></div> : null}

        {data ? <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <Kpi icon={Users} label="Conversaciones" value={numero(metricas.conversaciones)} detail={`${numero(metricas.mensajes)} mensajes analizados`} />
                <Kpi icon={Target} label="Interés detectado" value={pct(metricas.clientes_interesados_pct)} detail={`${numero(metricas.clientes_interesados)} clientes con interés medio/alto`} tone="good" />
                <Kpi icon={ShieldAlert} label="Mala atención" value={pct(metricas.mal_atendidos_pct)} detail={`${numero(metricas.mal_atendidos)} conversaciones deficientes/críticas`} tone={metricas.mal_atendidos_pct >= 20 ? "danger" : "warning"} />
                <Kpi icon={Clock3} label="1ª respuesta humana" value={metricas.primera_respuesta_promedio_label || "—"} detail={`Mediana ${metricas.primera_respuesta_mediana_label || "—"} · P90 ${metricas.primera_respuesta_p90_label || "—"}`} tone={Number(metricas.primera_respuesta_promedio_segundos || 0) > 14400 ? "danger" : "normal"} />
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
                <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Asesor</th><th className="px-4 py-3 text-center">Chats</th><th className="px-4 py-3 text-center">Interés</th><th className="px-4 py-3 text-center">Mala atención</th><th className="px-4 py-3 text-center">1ª respuesta</th><th className="px-4 py-3 text-center">Score</th><th className="px-4 py-3">Recomendación</th></tr></thead><tbody>{asesores.map((a) => <tr key={a.asesor} className="border-t border-slate-100 align-top hover:bg-slate-50/70"><td className="px-4 py-3"><div className="font-black text-[#131E5C]">{a.asesor}</div><div className="mt-0.5 text-[10px] text-slate-400">{a.agencia} · {a.business}</div></td><td className="px-4 py-3 text-center font-black">{a.conversaciones}</td><td className="px-4 py-3 text-center font-black text-emerald-700">{pct(a.interes_pct)}</td><td className="px-4 py-3 text-center font-black text-red-600">{pct(a.mal_atendidos_pct)}</td><td className="px-4 py-3 text-center font-black">{a.tiempo_primera_respuesta_label}</td><td className="px-4 py-3 text-center"><span className={cls("inline-flex min-w-12 justify-center rounded-full px-2 py-1 font-black", a.puntaje_atencion >= 80 ? "bg-emerald-50 text-emerald-700" : a.puntaje_atencion >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{a.puntaje_atencion}/100</span></td><td className="max-w-[360px] px-4 py-3"><button type="button" onClick={() => setAbierto(abierto === a.asesor ? "" : a.asesor)} className="inline-flex items-center gap-1 font-black text-[#131E5C]">Ver análisis {abierto === a.asesor ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>{abierto === a.asesor ? <div className="mt-2 space-y-2 text-[11px] leading-5 text-slate-600"><Semaforo value={a.prioridad} />{a.deficiencias_ia?.length ? <p><b>Deficiencias:</b> {a.deficiencias_ia.join(" · ")}</p> : null}{a.recomendaciones?.length ? <p><b>Mejoras:</b> {a.recomendaciones.join(" · ")}</p> : <p>Priorizar rapidez, perfilamiento y cierre de siguiente acción.</p>}</div> : null}</td></tr>)}</tbody></table></div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Deficiencias más repetidas</h4></div><div className="space-y-3">{deficiencias.length ? deficiencias.slice(0, 10).map((x) => <Barra key={x.nombre} label={x.nombre} value={x.total} total={maxDef} suffix={` · ${pct(x.pct)}`} />) : <Vacio />}</div></div>
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#131E5C]" /><h4 className="font-black text-[#131E5C]">Causas raíz y acciones prioritarias</h4></div><div className="grid gap-3 md:grid-cols-2">{(analisis.causas_raiz || []).map((x, i) => <div key={`${x.causa}-${i}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><p className="font-black text-slate-800">{x.causa}</p><Semaforo value={x.prioridad} /></div><p className="mt-2 text-xs leading-5 text-slate-500"><b>Evidencia:</b> {x.evidencia}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{x.impacto}</p></div>)}{!(analisis.causas_raiz || []).length ? <Vacio /> : null}</div><div className="mt-4 space-y-2">{(analisis.recomendaciones_globales || []).map((x, i) => <div key={`${x.accion}-${i}`} className="flex gap-3 rounded-xl bg-slate-50 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-[#131E5C]">{x.accion}</p><Semaforo value={x.prioridad} /></div><p className="mt-1 text-xs leading-5 text-slate-500">{x.motivo} <b>{x.impacto_esperado}</b></p></div></div>)}</div></div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5"><div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-[#131E5C]" /><div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">Meta Ads + CRM</p><h4 className="text-base font-black text-[#131E5C]">Calidad comercial de campañas</h4></div></div><p className="mt-2 max-w-4xl text-xs leading-5 text-slate-500">El costo de Meta se interpreta junto con los leads que realmente llegaron al CRM y la calidad/interés detectados en sus conversaciones. Una campaña barata no necesariamente es buena si trae conversaciones sin intención.</p></div>
                {campanas.length ? <div className="grid gap-4 p-5 xl:grid-cols-2">{campanas.map((c) => <article key={c.id_campana} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#131E5C]">{c.nombre_campana || `Campaña ${c.id_campana}`}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{c.sucursal} · {c.objetivo || "Objetivo no informado"}</p></div><Semaforo value={c.analisis_ia?.prioridad || "media"} /></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Gasto</p><p className="font-black text-[#131E5C]">{dinero(c.gasto)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Costo resultado</p><p className="font-black text-[#131E5C]">{dinero(c.costo_resultado)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Leads CRM</p><p className="font-black text-[#131E5C]">{numero(c.leads_crm_atribuidos)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-bold text-slate-400">Interés CRM</p><p className="font-black text-emerald-700">{pct(c.interes_crm_pct)}</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-slate-100 p-3 text-xs leading-5 text-slate-600"><b>Audiencia actual:</b><br />Edad: {c.edad_audiencia || "Sin dato"}<br />Intereses: {c.intereses_audiencia || "Sin dato"}<br />Comportamiento: {c.comportamiento_audiencia || "Sin dato"}</div><div className="rounded-lg border border-[#131E5C]/10 bg-[#131E5C]/[0.03] p-3 text-xs leading-5 text-slate-700"><b className="text-[#131E5C]">Lectura IA:</b><br />{c.analisis_ia?.diagnostico || "Sin diagnóstico específico."}<br /><b>Recomendación:</b> {c.analisis_ia?.recomendacion || "Acumular más atribución CRM antes de modificar segmentación."}{c.analisis_ia?.audiencia_sugerida ? <><br /><b>Audiencia sugerida:</b> {c.analisis_ia.audiencia_sugerida}</> : null}</div></div></article>)}</div> : <div className="p-5"><Vacio texto="No se encontraron campañas Meta para el periodo y filtros seleccionados." /></div>}
            </section>

            <section className="rounded-2xl border border-[#131E5C]/15 bg-slate-50 p-4 text-xs leading-5 text-slate-500"><div className="flex items-start gap-3"><Bot className="mt-0.5 h-5 w-5 shrink-0 text-[#131E5C]" /><div><p className="font-black text-[#131E5C]">Cómo interpretar este panel</p><p className="mt-1">Los porcentajes de interés, calidad y riesgo provienen de clasificaciones IA sobre conversaciones del periodo; los tiempos, volumen, citas, facturación, gasto y resultados Meta provienen de datos del CRM/BD. Cobertura: <b>{pct(data.cobertura?.porcentaje)}</b> ({numero(data.cobertura?.auditadas)} de {numero(data.cobertura?.conversaciones)} conversaciones). Conversaciones recortadas por límite técnico: <b>{numero(data.cobertura?.conversaciones_recortadas)}</b>.</p></div></div></section>
        </> : null}
    </div>;
}
