import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    BarChart3,
    Bot,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Filter,
    Info,
    Loader2,
    MessageCircle,
    PauseCircle,
    Search,
    Send,
    Sparkles,
    Target,
    TrendingUp,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";

const RESULT_STYLES = {
    positivo: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-sky-200 bg-sky-50 text-sky-700",
    negativo: "border-rose-200 bg-rose-50 text-rose-700",
    sin_respuesta: "border-amber-200 bg-amber-50 text-amber-700",
    pendiente: "border-slate-200 bg-slate-50 text-slate-600",
    fallido: "border-red-200 bg-red-50 text-red-700",
    no_aplica: "border-violet-200 bg-violet-50 text-violet-700",
};

const ATENCION_STYLES = {
    buena: "border-emerald-200 bg-emerald-50 text-emerald-700",
    mejorable: "border-amber-200 bg-amber-50 text-amber-700",
    critica: "border-rose-200 bg-rose-50 text-rose-700",
    sin_datos: "border-slate-200 bg-slate-50 text-slate-600",
};

const LEGEND = [
    { key: "contactos", label: "Intentos enviados", className: "bg-[#253AA8]" },
    { key: "respuestas", label: "Con respuesta", className: "bg-sky-500" },
    { key: "positivas", label: "Interés detectado", className: "bg-emerald-500" },
    { key: "fallidos", label: "Envío fallido", className: "bg-rose-500" },
];

const IA_LABELS = {
    activa: "IA activa",
    pausada: "IA pausada",
    inactiva_chat: "IA desactivada en chat",
    inactiva_linea: "IA inactiva en línea",
    no_configurada: "IA no configurada",
};

function isoDate(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
    return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "—";

    try {
        return new Intl.DateTimeFormat("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}

function percent(numerator, denominator) {
    const first = Number(numerator || 0);
    const second = Number(denominator || 0);
    return second > 0 ? Math.round((first / second) * 1000) / 10 : 0;
}

function normalizeMetrics(item = {}) {
    const intentos = Number(item.intentos_contacto ?? item.mensajes ?? 0);
    const fallidos = Number(item.fallidos || 0);
    const contactosValidos = Number(
        item.contactos_validos ?? Math.max(intentos - fallidos, 0),
    );
    const respuestas = Number(item.respuestas || 0);
    const positivas = Number(item.positivas ?? item.respuestas_positivas ?? 0);
    const sinRespuesta = Number(item.sin_respuesta || 0);
    const pendientes = Number(
        item.pendientes
        ?? item.abiertas
        ?? Math.max(contactosValidos - respuestas - sinRespuesta, 0),
    );

    return {
        ...item,
        mensajes: intentos,
        intentos_contacto: intentos,
        contactos_validos: contactosValidos,
        respuestas,
        positivas,
        sin_respuesta: sinRespuesta,
        pendientes,
        abiertas: pendientes,
        fallidos,
        tasa_respuesta_cliente: Number(
            item.tasa_respuesta_cliente ?? percent(respuestas, contactosValidos),
        ),
        tasa_interes_respuestas: Number(
            item.tasa_interes_respuestas ?? percent(positivas, respuestas),
        ),
        tasa_interes_contactos: Number(
            item.tasa_interes_contactos ?? percent(positivas, contactosValidos),
        ),
    };
}

function rateTone(rate) {
    if (rate >= 65) return "text-emerald-600";
    if (rate >= 35) return "text-amber-600";
    return "text-rose-600";
}

function ResultBadge({ label, group = "pendiente" }) {
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${RESULT_STYLES[group] || RESULT_STYLES.pendiente}`}>
            {label || "Sin clasificación"}
        </span>
    );
}

function IAStatusBadge({ state, compact = false }) {
    const status = state?.estado || "no_configurada";
    const active = status === "activa";
    const paused = status === "pausada";
    const Icon = active ? Bot : paused ? PauseCircle : Bot;
    const styles = active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : paused
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-600";

    return (
        <span
            title={state?.motivo || IA_LABELS[status] || status}
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs"} ${styles}`}
        >
            <Icon size={compact ? 12 : 14} />
            {IA_LABELS[status] || status}
        </span>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
            <Activity size={28} className="mb-3 text-slate-400" />
            <p className="text-sm text-slate-600">{text}</p>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, detail, accent }) {
    return (
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(19,30,92,0.07)]">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </div>
                <span className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                    <Icon size={20} />
                </span>
            </div>
        </article>
    );
}

function MetricLegend({ compact = false }) {
    return (
        <div className={`flex flex-wrap ${compact ? "gap-x-3 gap-y-2" : "gap-x-5 gap-y-2"}`}>
            {LEGEND.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <i className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
                    {item.label}
                </span>
            ))}
        </div>
    );
}

function DistributionBar({ item }) {
    const data = normalizeMetrics(item);
    const neutral = Math.max(data.respuestas - data.positivas, 0);
    const parts = [
        { key: "neutral", value: neutral, className: "bg-sky-500" },
        { key: "positive", value: data.positivas, className: "bg-emerald-500" },
        { key: "unanswered", value: data.sin_respuesta, className: "bg-amber-400" },
        { key: "pending", value: data.pendientes, className: "bg-slate-300" },
        { key: "failed", value: data.fallidos, className: "bg-rose-500" },
    ].filter((part) => part.value > 0);
    const total = Math.max(1, parts.reduce((sum, part) => sum + part.value, 0));

    return (
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            {parts.map((part) => (
                <span
                    key={part.key}
                    className={part.className}
                    style={{ width: `${(part.value / total) * 100}%` }}
                />
            ))}
        </div>
    );
}

function AdvisorChart({ advisors }) {
    if (!advisors.length) {
        return <EmptyState text="No hay asesores disponibles para construir el comparativo." />;
    }

    const maxValue = Math.max(
        1,
        ...advisors.flatMap((item) => [
            item.contactos_validos,
            item.respuestas,
            item.positivas,
            item.sin_respuesta,
        ]),
    );

    const bars = [
        { key: "contactos_validos", label: "Enviados", className: "from-[#131E5C] to-[#4058D9]", text: "text-[#131E5C]" },
        { key: "respuestas", label: "Respondidos", className: "from-sky-400 to-sky-600", text: "text-sky-700" },
        { key: "positivas", label: "Interés", className: "from-emerald-400 to-emerald-600", text: "text-emerald-700" },
        { key: "sin_respuesta", label: "Sin respuesta", className: "from-amber-300 to-amber-500", text: "text-amber-700" },
    ];

    return (
        <section className="flex min-h-[540px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(19,30,92,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-slate-900">Comparativo por asesor</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        La tasa se calcula con respuestas del cliente entre intentos enviados correctamente.
                    </p>
                </div>
                <span className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                    <BarChart3 size={19} />
                </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <MetricLegend compact />
            </div>

            <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
                {advisors.map((item, index) => (
                    <article key={item.numero_asesor} className="rounded-2xl border border-slate-200 p-4">
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {index + 1}. {item.asesor_digital || item.numero_asesor}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {item.agencia || "Sin agencia"} · {item.clientes || 0} clientes
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-semibold ${rateTone(item.tasa_respuesta_cliente)}`}>
                                    {item.tasa_respuesta_cliente}%
                                </p>
                                <p className="text-[11px] text-slate-500">tasa de respuesta del cliente</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-[82px_1fr_44px] items-center gap-x-3 gap-y-2 text-xs">
                            {bars.map((bar) => (
                                <div key={bar.key} className="contents">
                                    <span className="text-slate-500">{bar.label}</span>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${bar.className}`}
                                            style={{
                                                width: `${Number(item[bar.key] || 0) > 0 ? Math.max(3, (Number(item[bar.key] || 0) / maxValue) * 100) : 0}%`,
                                            }}
                                        />
                                    </div>
                                    <strong className={`text-right ${bar.text}`}>{item[bar.key] || 0}</strong>
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function chartPoints(items, key, width, height, padding, maxValue) {
    if (!items.length) return "";
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    return items.map((item, index) => {
        const x = padding + (items.length === 1 ? usableWidth / 2 : (index / (items.length - 1)) * usableWidth);
        const y = padding + usableHeight - (Number(item[key] || 0) / maxValue) * usableHeight;
        return `${x},${y}`;
    }).join(" ");
}

function TrendChart({ rows }) {
    const items = (rows || []).slice(-30);
    if (!items.length) return <EmptyState text="No existe actividad diaria para el periodo." />;

    const width = 900;
    const height = 300;
    const padding = 34;
    const maxValue = Math.max(
        1,
        ...items.flatMap((item) => [
            Number(item.mensajes || 0),
            Number(item.respuestas || 0),
            Number(item.sin_respuesta || 0),
        ]),
    );
    const messagePoints = chartPoints(items, "mensajes", width, height, padding, maxValue);
    const responsePoints = chartPoints(items, "respuestas", width, height, padding, maxValue);
    const unansweredPoints = chartPoints(items, "sin_respuesta", width, height, padding, maxValue);
    const totals = items.reduce((acc, item) => ({
        mensajes: acc.mensajes + Number(item.mensajes || 0),
        respuestas: acc.respuestas + Number(item.respuestas || 0),
        sin_respuesta: acc.sin_respuesta + Number(item.sin_respuesta || 0),
    }), { mensajes: 0, respuestas: 0, sin_respuesta: 0 });

    return (
        <section className="flex min-h-[540px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(19,30,92,0.07)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-slate-900">Tendencia de actividad</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Serie continua de hasta 30 días; los días sin actividad se conservan en cero.
                    </p>
                </div>
                <span className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                    <TrendingUp size={19} />
                </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[#F3F5FF] p-3">
                    <p className="text-[11px] text-slate-500">Intentos</p>
                    <p className="mt-1 text-lg font-semibold text-[#131E5C]">{formatNumber(totals.mensajes)}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3">
                    <p className="text-[11px] text-slate-500">Respuestas</p>
                    <p className="mt-1 text-lg font-semibold text-sky-700">{formatNumber(totals.respuestas)}</p>
                </div>
            </div>

            <div className="mt-5 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[280px] w-full" role="img" aria-label="Tendencia diaria de actividad">
                    {[0, 1, 2, 3, 4].map((line) => {
                        const y = padding + ((height - padding * 2) / 4) * line;
                        return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#DCE3EE" strokeWidth="1" />;
                    })}
                    <polyline fill="none" stroke="#243AA8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={messagePoints} />
                    <polyline fill="none" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={responsePoints} />
                    <polyline fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 7" points={unansweredPoints} />
                    {items.map((item, index) => {
                        const show = index === 0 || index === items.length - 1 || index % Math.max(1, Math.floor(items.length / 5)) === 0;
                        if (!show) return null;
                        const x = padding + (items.length === 1 ? (width - padding * 2) / 2 : (index / (items.length - 1)) * (width - padding * 2));
                        return (
                            <text key={item.fecha} x={x} y={height - 8} textAnchor="middle" fontSize="17" fill="#64748B">
                                {String(item.fecha || "").slice(5)}
                            </text>
                        );
                    })}
                </svg>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2"><i className="h-2.5 w-5 rounded-full bg-[#243AA8]" />Intentos</span>
                <span className="inline-flex items-center gap-2"><i className="h-2.5 w-5 rounded-full bg-sky-500" />Respuestas</span>
            </div>
        </section>
    );
}

function DefinitionPanel({ definitions, hours }) {
    const rows = [
        ["Tasa de respuesta del cliente", definitions?.tasa_respuesta_cliente || "Respuestas del cliente / intentos enviados correctamente."],
        ["Interés entre respuestas", definitions?.tasa_interes_respuestas || "Respuestas con intención comercial / respuestas recibidas."],
        ["Primera atención humana", definitions?.primera_atencion_humana || "Primer mensaje entrante del periodo hasta la primera respuesta humana; se excluye la IA."],
    ];

    return (
        <section className="rounded-3xl border border-[#D8DFEC] bg-white p-5 shadow-[0_12px_30px_rgba(19,30,92,0.06)]">
            <div className="flex items-center gap-2">
                <Info size={18} className="text-[#131E5C]" />
                <h2 className="font-semibold text-slate-900">Cómo se calculan las métricas</h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {rows.map(([title, description]) => (
                    <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-800">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function ClientDrawer({ client, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        api.digitalesAnaliticaCliente(client.expediente_id, {
            numero_asesor: client.numero_asesor,
        })
            .then((response) => active && setDetail(response))
            .catch((requestError) => active && setError(requestError?.message || "No fue posible cargar la bitácora."))
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [client.expediente_id, client.numero_asesor]);

    const summary = detail?.resumen_atencion_ia;
    const metrics = normalizeMetrics(detail?.metricas || client);
    const iaState = detail?.cliente?.ia_estado || client.ia_estado;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
            <button className="absolute inset-0" onClick={onClose} aria-label="Cerrar" />
            <aside className="relative h-full w-full max-w-3xl overflow-y-auto bg-[#F6F8FC] shadow-2xl">
                <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#131E5C]">Bitácora de atención</p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">{client.nombre || "Prospecto"}</h2>
                        <p className="mt-1 text-sm text-slate-500">{client.telefono}</p>
                    </div>
                    <button onClick={onClose} className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                        <X size={20} />
                    </button>
                </header>

                <div className="space-y-4 p-5">
                    {loading ? (
                        <div className="flex min-h-52 items-center justify-center rounded-3xl bg-white text-slate-500">
                            <Loader2 className="mr-2 animate-spin" size={20} />
                            Analizando conversación y bitácora...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                    ) : (
                        <>
                            <section className="rounded-3xl border border-[#D8DFF0] bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#131E5C]">
                                            <Sparkles size={14} />
                                            Resumen de acciones con IA
                                        </span>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                            {summary?.resumen_acciones || "No se pudo generar el resumen."}
                                        </h3>
                                    </div>
                                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${ATENCION_STYLES[summary?.calidad] || ATENCION_STYLES.sin_datos}`}>
                                        Calidad {String(summary?.calidad || "sin datos").replaceAll("_", " ")}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-500">Evaluación</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-700">{summary?.evaluacion || "Sin evaluación disponible."}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#F2F5FF] p-3">
                                        <p className="text-xs font-medium text-[#475569]">Siguiente acción</p>
                                        <p className="mt-1 text-sm font-medium leading-6 text-[#131E5C]">{summary?.siguiente_accion || "Revisar la conversación."}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-[11px] text-slate-400">
                                    Fuente: {summary?.generado_por_ia ? "Gemini" : "reglas de respaldo"}. El resumen no modifica los registros originales.
                                </p>
                            </section>

                            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs text-slate-500">Estado CRM</p>
                                    <p className="mt-1 font-medium text-slate-900">{detail?.cliente?.estado || "Sin estado"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs text-slate-500">Vehículo</p>
                                    <p className="mt-1 font-medium text-slate-900">{detail?.cliente?.auto_interes || "Sin definir"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs text-slate-500">Respuesta del cliente</p>
                                    <p className={`mt-1 font-semibold ${rateTone(metrics.tasa_respuesta_cliente)}`}>{metrics.tasa_respuesta_cliente}%</p>
                                    <p className="mt-1 text-[11px] text-slate-400">{metrics.respuestas}/{metrics.contactos_validos} contactos válidos</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs text-slate-500">Estado de IA</p>
                                    <div className="mt-2"><IAStatusBadge state={iaState} /></div>
                                </div>
                            </section>

                            <section className="space-y-3">
                                {(detail?.eventos || []).map((item) => (
                                    <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.tipo_label}</span>
                                                    <ResultBadge label={item.resultado_label} group={item.resultado_grupo} />
                                                    <IAStatusBadge state={item.ia_estado} compact />
                                                </div>
                                                <h3 className="mt-2 font-medium text-slate-900">{item.accion}</h3>
                                                {item.detalle ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.detalle}</p> : null}
                                            </div>
                                            <time className="text-xs text-slate-500">{formatDate(item.creado)}</time>
                                        </div>

                                        {item.respuesta_texto ? (
                                            <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 p-3">
                                                <p className="text-xs font-medium text-sky-700">Respuesta del cliente</p>
                                                <p className="mt-1 text-sm leading-6 text-slate-700">{item.respuesta_texto}</p>
                                                <p className="mt-2 text-xs text-slate-500">Respondió después de {item.tiempo_respuesta_label || "—"}</p>
                                            </div>
                                        ) : null}

                                        {item.ia_estado?.fuente ? (
                                            <p className="mt-3 text-[11px] text-slate-400">
                                                Estado de IA: {item.ia_estado.fuente === "capturado_en_evento" ? "capturado al registrar la acción" : "estado actual usado para un registro histórico"}.
                                            </p>
                                        ) : null}
                                    </article>
                                ))}
                                {!detail?.eventos?.length ? <EmptyState text="No hay eventos registrados para este cliente." /> : null}
                            </section>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default function DigitalesRendimiento() {
    const [filters, setFilters] = useState({
        fecha_desde: isoDate(29),
        fecha_hasta: isoDate(0),
        numero_asesor: "",
        tipo: "",
        buscar: "",
        page: 1,
        page_size: 25,
    });
    const [searchDraft, setSearchDraft] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeAdvisor, setActiveAdvisor] = useState("");
    const [advisorData, setAdvisorData] = useState(null);
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        api.digitalesAnaliticaAsesores(filters)
            .then((response) => active && setData(response))
            .catch((requestError) => active && setError(requestError?.message || "No fue posible cargar la analítica."))
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [filters]);

    const advisors = useMemo(
        () => (data?.asesores || []).map(normalizeMetrics).sort((first, second) => (
            second.tasa_respuesta_cliente - first.tasa_respuesta_cliente
            || second.contactos_validos - first.contactos_validos
            || String(first.asesor_digital || "").localeCompare(String(second.asesor_digital || ""))
        )),
        [data?.asesores],
    );
    const summary = useMemo(() => normalizeMetrics(data?.resumen || {}), [data?.resumen]);

    useEffect(() => {
        if (!advisors.length) {
            setActiveAdvisor("");
            return;
        }
        if (filters.numero_asesor) {
            setActiveAdvisor(filters.numero_asesor);
            return;
        }
        if (!advisors.some((item) => item.numero_asesor === activeAdvisor)) {
            setActiveAdvisor(advisors[0].numero_asesor);
        }
    }, [advisors, activeAdvisor, filters.numero_asesor]);

    useEffect(() => {
        if (!activeAdvisor) {
            setAdvisorData(null);
            return;
        }

        let active = true;
        setAdvisorLoading(true);
        api.digitalesAnaliticaAsesores({
            fecha_desde: filters.fecha_desde,
            fecha_hasta: filters.fecha_hasta,
            numero_asesor: activeAdvisor,
            tipo: filters.tipo,
            buscar: filters.buscar,
            page: 1,
            page_size: 150,
        })
            .then((response) => active && setAdvisorData(response))
            .catch((requestError) => active && setError(requestError?.message || "No fue posible cargar la cartera del asesor."))
            .finally(() => active && setAdvisorLoading(false));

        return () => { active = false; };
    }, [activeAdvisor, filters.fecha_desde, filters.fecha_hasta, filters.tipo, filters.buscar]);

    const activeAdvisorInfo = advisors.find((item) => item.numero_asesor === activeAdvisor);
    const advisorSummary = normalizeMetrics(advisorData?.resumen || activeAdvisorInfo || {});
    const advisorClients = (advisorData?.clientes || []).map(normalizeMetrics);

    function updateFilter(name, value) {
        setFilters((current) => ({ ...current, [name]: value, page: 1 }));
    }

    function submitSearch(event) {
        event.preventDefault();
        updateFilter("buscar", searchDraft.trim());
    }

    function preset(days) {
        setFilters((current) => ({
            ...current,
            fecha_desde: isoDate(days - 1),
            fecha_hasta: isoDate(0),
            page: 1,
        }));
    }

    return (
        <div className="min-h-full p-4 md:p-6">
            <div className="mx-auto max-w-[1700px] space-y-6">
                <section className="relative overflow-hidden md:p-6">
                    <div className="relative">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Rendimiento digital medible</h1>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Filter size={16} /> Filtros de análisis</div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                <label className="text-sm text-slate-600">Desde
                                    <input type="date" value={filters.fecha_desde} onChange={(event) => updateFilter("fecha_desde", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
                                </label>
                                <label className="text-sm text-slate-600">Hasta
                                    <input type="date" value={filters.fecha_hasta} onChange={(event) => updateFilter("fecha_hasta", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
                                </label>
                                <label className="text-sm text-slate-600">Asesor / línea
                                    <select value={filters.numero_asesor} onChange={(event) => updateFilter("numero_asesor", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900">
                                        <option value="">Todas las líneas permitidas</option>
                                        {(data?.lineas || []).map((item) => <option key={item.numero} value={item.numero}>{item.asesor_digital} · {item.agencia}</option>)}
                                    </select>
                                </label>
                                <label className="text-sm text-slate-600">Tipo de acción
                                    <select value={filters.tipo} onChange={(event) => updateFilter("tipo", event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900">
                                        <option value="">Todas</option>
                                        {(data?.catalogos?.tipos || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                    </select>
                                </label>
                                <form onSubmit={submitSearch} className="text-sm text-slate-600">Buscar cliente
                                    <div className="mt-1 flex gap-2">
                                        <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Nombre o teléfono" className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
                                        <button className="rounded-2xl bg-[#131E5C] px-3 text-white" aria-label="Buscar"><Search size={18} /></button>
                                    </div>
                                </form>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[7, 30, 90].map((days) => <button key={days} type="button" onClick={() => preset(days)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Últimos {days} días</button>)}
                            </div>
                        </div>
                    </div>
                </section>

                {error ? <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={20} />{error}</div> : null}

                {loading && !data ? (
                    <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500"><Loader2 className="mr-2 animate-spin" size={22} />Calculando indicadores...</div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <MetricCard icon={Users} label="Clientes con actividad" value={formatNumber(summary.clientes)} detail={`${formatNumber(summary.acciones)} acciones registradas`} accent="from-[#131E5C] to-[#3653E7]" />
                            <MetricCard icon={Send} label="Intentos de contacto" value={formatNumber(summary.intentos_contacto)} detail={`${formatNumber(summary.contactos_validos)} enviados · ${formatNumber(summary.fallidos)} fallidos`} accent="from-blue-700 to-blue-400" />
                            <MetricCard icon={MessageCircle} label="Respuesta del cliente" value={`${summary.tasa_respuesta_cliente}%`} detail={`${summary.respuestas} respuestas / ${summary.contactos_validos} intentos válidos`} accent="from-sky-600 to-cyan-400" />
                            <MetricCard icon={Target} label="Interés entre respuestas" value={`${summary.tasa_interes_respuestas}%`} detail={`${summary.positivas} respuestas con intención comercial`} accent="from-emerald-700 to-emerald-400" />
                        </section>

                        <section className="grid items-stretch gap-5 xl:grid-cols-2">
                            <AdvisorChart advisors={advisors} />
                            <TrendChart rows={data?.actividad_diaria || []} />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
                            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(19,30,92,0.07)]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">Asesores digitales</h2>
                                    </div>
                                    <Users size={19} className="text-[#131E5C]" />
                                </div>
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"><MetricLegend compact /></div>
                                <div className="mt-4 max-h-[760px] space-y-3 overflow-y-auto pr-1">
                                    {advisors.map((item, index) => {
                                        const selected = item.numero_asesor === activeAdvisor;
                                        return (
                                            <button key={item.numero_asesor} type="button" onClick={() => setActiveAdvisor(item.numero_asesor)} className={`w-full rounded-[24px] border p-4 text-left transition ${selected ? "border-[#263DB6] bg-[#F4F6FF] shadow-[0_12px_26px_rgba(19,30,92,0.10)]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#131E5C] text-sm font-semibold text-white">{index + 1}</span>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-900">{item.asesor_digital || item.numero_asesor}</p>
                                                            <p className="mt-1 text-xs text-slate-500">{item.agencia || "Sin agencia"} · {item.clientes || 0} clientes</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-lg font-semibold ${rateTone(item.tasa_respuesta_cliente)}`}>{item.tasa_respuesta_cliente}%</p>
                                                        <p className="text-[10px] text-slate-500">respuesta cliente</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4"><DistributionBar item={item} /></div>
                                                <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px]">
                                                    <span><strong className="block text-[#131E5C]">{item.contactos_validos}</strong><small className="text-slate-500">Enviados</small></span>
                                                    <span><strong className="block text-sky-700">{item.respuestas}</strong><small className="text-slate-500">Respuestas</small></span>
                                                    <span><strong className="block text-emerald-700">{item.positivas}</strong><small className="text-slate-500">Interés</small></span>
                                                    <span><strong className="block text-amber-700">{item.sin_respuesta}</strong><small className="text-slate-500">Vencidos</small></span>
                                                    <span><strong className="block text-slate-600">{item.pendientes}</strong><small className="text-slate-500">Pendientes</small></span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>

                            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(19,30,92,0.07)]">
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">Cartera del asesor seleccionado</h2>
                                    </div>
                                    {activeAdvisorInfo ? (
                                        <div className="rounded-2xl bg-[#F2F5FF] px-4 py-3">
                                            <p className="text-sm font-semibold text-[#131E5C]">{activeAdvisorInfo.asesor_digital}</p>
                                            <p className="mt-1 text-xs text-slate-500">{advisorClients.length} clientes mostrados</p>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Respuesta del cliente</p><p className={`mt-1 text-lg font-semibold ${rateTone(advisorSummary.tasa_respuesta_cliente)}`}>{advisorSummary.tasa_respuesta_cliente}%</p></div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Interés / respuestas</p><p className="mt-1 text-lg font-semibold text-emerald-700">{advisorSummary.tasa_interes_respuestas}%</p></div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Respuesta del cliente</p><p className="mt-1 text-lg font-semibold text-slate-900">{advisorSummary.promedio_respuesta_cliente_label || "—"}</p></div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Pendientes &lt; 48 h</p><p className="mt-1 text-lg font-semibold text-slate-900">{advisorSummary.pendientes}</p></div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {advisorLoading ? (
                                        <div className="flex min-h-48 items-center justify-center text-slate-500"><Loader2 className="mr-2 animate-spin" size={20} />Cargando cartera...</div>
                                    ) : advisorClients.length ? advisorClients.map((client) => (
                                        <article key={`${client.expediente_id}-${client.numero_asesor}`} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <span className="rounded-2xl bg-white p-2.5 text-slate-500 shadow-sm"><UserRound size={20} /></span>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-semibold text-slate-900">{client.nombre || "Sin nombre"}</h3>
                                                            <IAStatusBadge state={client.ia_estado} compact />
                                                        </div>
                                                        <p className="mt-1 text-sm text-slate-500">{client.telefono} · {client.estado || "Sin estado"}</p>
                                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{client.resumen_operativo || "Sin resumen operativo."}</p>
                                                        <p className="mt-2 text-xs text-slate-500">Última actividad: {formatDate(client.ultima_actividad)}</p>
                                                    </div>
                                                </div>

                                                <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-[300px]">
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center"><p className="text-[11px] text-slate-500">Intentos</p><p className="mt-1 text-lg font-semibold text-slate-900">{client.contactos_validos}</p></div>
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center"><p className="text-[11px] text-slate-500">Respuesta</p><p className={`mt-1 text-lg font-semibold ${rateTone(client.tasa_respuesta_cliente)}`}>{client.tasa_respuesta_cliente}%</p></div>
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center"><p className="text-[11px] text-slate-500">Interés</p><p className="mt-1 text-lg font-semibold text-emerald-700">{client.tasa_interes_respuestas}%</p></div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0 flex-1"><DistributionBar item={client} /></div>
                                                <button type="button" onClick={() => setSelectedClient(client)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                                    <ChevronRight size={16} /> Ver análisis y bitácora
                                                </button>
                                            </div>
                                        </article>
                                    )) : <EmptyState text="No hay clientes para este asesor con los filtros actuales." />}
                                </div>
                            </section>
                        </section>
                    </>
                )}
            </div>

            {selectedClient ? <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} /> : null}
        </div>
    );
}