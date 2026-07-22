// src/pages/JDPower/ResumenIAModal.jsx
import { AlertTriangle, Sparkles, ThumbsUp, TrendingDown, TrendingUp, X } from "lucide-react";

const NAVY = "#0B1F5E";
const GREEN = "#00A651";
const RED = "#D85A30";
const ORANGE = "#F0A500";

function Chip({ label, value, tono = "neutral" }) {
    const colores = {
        neutral: "bg-gray-100 text-gray-700",
        bueno: "bg-emerald-50 text-emerald-700",
        malo: "bg-red-50 text-red-600",
    };
    return (
        <div className={`rounded-lg px-3 py-2 ${colores[tono]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-lg font-black">{value}</p>
        </div>
    );
}

function FrecuenciaBadge({ frecuencia }) {
    const map = {
        alta: { color: RED, label: "Frecuencia alta" },
        media: { color: ORANGE, label: "Frecuencia media" },
        baja: { color: "#9CA3AF", label: "Frecuencia baja" },
    };
    const item = map[String(frecuencia || "").toLowerCase()] || map.baja;
    return (
        <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: item.color }}
        >
            {item.label}
        </span>
    );
}

export default function ResumenIAModal({ open, onClose, loading, error, data, titulo }) {
    if (!open) return null;

    const comparacion = data?.comparacion;
    const variacionNps = comparacion?.variacion_nps;
    const variacionSat = comparacion?.variacion_satisfaccion;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: NAVY }}
                >
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles size={18} />
                        <div>
                            <p className="text-sm font-black leading-tight">Resumen IA — {titulo}</p>
                            {data?.periodo_label ? (
                                <p className="text-xs font-medium text-white/70">{data.periodo_label}</p>
                            ) : null}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-gray-400">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
                            Analizando encuestas y comentarios con IA…
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">
                            <p className="font-bold">No se pudo generar el resumen</p>
                            <p className="mt-1 text-xs text-red-500">{error}</p>
                        </div>
                    ) : !data ? null : (
                        <div className="space-y-6">
                            {/* Métricas rápidas */}
                            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                <Chip label="Encuestas" value={data.metricas?.total_encuestas ?? "—"} />
                                <Chip label="Completadas" value={data.metricas?.completadas ?? "—"} />
                                <Chip label="Satisfacción" value={data.metricas?.satisfaccion_promedio?.toFixed?.(2) ?? "—"} />
                                <Chip label="NPS" value={data.metricas?.nps ?? "—"} />
                                <Chip label="Promotores" value={data.metricas?.promotores ?? "—"} tono="bueno" />
                                <Chip label="Detractores" value={data.metricas?.detractores ?? "—"} tono="malo" />
                            </div>

                            {/* Resumen ejecutivo */}
                            {data.resumen_ejecutivo ? (
                                <div>
                                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                                        Resumen ejecutivo
                                    </p>
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                                        {data.resumen_ejecutivo}
                                    </p>
                                </div>
                            ) : null}

                            {/* Tendencia + comparación vs mes anterior */}
                            {(data.tendencia || comparacion?.satisfaccion_anterior != null) ? (
                                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                                        Tendencia y comparación vs {comparacion?.periodo_anterior || "periodo anterior"}
                                    </p>

                                    {data.tendencia ? (
                                        <p className="mb-3 text-sm text-gray-700">{data.tendencia}</p>
                                    ) : null}

                                    {comparacion?.satisfaccion_anterior != null ? (
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                {variacionSat >= 0 ? (
                                                    <TrendingUp size={16} className="text-emerald-600" />
                                                ) : (
                                                    <TrendingDown size={16} className="text-red-500" />
                                                )}
                                                <span className="font-semibold text-gray-700">
                                                    Satisfacción: {comparacion.satisfaccion_actual?.toFixed?.(2)} vs{" "}
                                                    {comparacion.satisfaccion_anterior?.toFixed?.(2)}
                                                </span>
                                                <span
                                                    className={`font-bold ${variacionSat >= 0 ? "text-emerald-600" : "text-red-500"}`}
                                                >
                                                    ({variacionSat >= 0 ? "+" : ""}{variacionSat})
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {variacionNps >= 0 ? (
                                                    <TrendingUp size={16} className="text-emerald-600" />
                                                ) : (
                                                    <TrendingDown size={16} className="text-red-500" />
                                                )}
                                                <span className="font-semibold text-gray-700">
                                                    NPS: {comparacion.nps_actual} vs {comparacion.nps_anterior}
                                                </span>
                                                <span
                                                    className={`font-bold ${variacionNps >= 0 ? "text-emerald-600" : "text-red-500"}`}
                                                >
                                                    ({variacionNps >= 0 ? "+" : ""}{variacionNps})
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400">
                                            No hay datos suficientes del periodo anterior para comparar.
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            {/* Alertas de concesionarias */}
                            {data.alertas_concesionarias?.length > 0 ? (
                                <div>
                                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-500">
                                        <AlertTriangle size={14} />
                                        Alertas de concesionarias — caída de NPS / satisfacción
                                    </p>
                                    <div className="space-y-2">
                                        {data.alertas_concesionarias.map((a, i) => (
                                            <div
                                                key={`${a.concesionaria}-${i}`}
                                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm"
                                            >
                                                <span className="font-bold text-gray-800">{a.concesionaria}</span>
                                                <span className="text-red-600">
                                                    NPS {a.nps_actual} vs {a.nps_anterior} ({a.variacion_nps >= 0 ? "+" : ""}{a.variacion_nps})
                                                </span>
                                                <span className="text-red-600">
                                                    Satisfacción {a.satisfaccion_actual?.toFixed?.(2)} vs {a.satisfaccion_anterior?.toFixed?.(2)}
                                                </span>
                                                <span className="text-xs text-gray-500">{a.encuestas_actual} encuestas</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Top quejas recurrentes */}
                            {data.top_quejas?.length > 0 ? (
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                                        Top quejas recurrentes en comentarios
                                    </p>
                                    <div className="space-y-2">
                                        {data.top_quejas.map((q, i) => (
                                            <div key={i} className="rounded-lg border border-gray-200 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-bold text-gray-800">{q.tema}</p>
                                                    <FrecuenciaBadge frecuencia={q.frecuencia} />
                                                </div>
                                                {q.detalle ? (
                                                    <p className="mt-1 text-xs text-gray-500">{q.detalle}</p>
                                                ) : null}
                                                {q.ejemplo ? (
                                                    <p className="mt-2 text-xs italic text-gray-400">"{q.ejemplo}"</p>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Fortalezas */}
                            {data.fortalezas?.length > 0 ? (
                                <div>
                                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">
                                        <ThumbsUp size={14} />
                                        Fortalezas detectadas
                                    </p>
                                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                                        {data.fortalezas.map((f, i) => (
                                            <li key={i}>{f}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {/* Recomendaciones */}
                            {data.recomendaciones?.length > 0 ? (
                                <div className="rounded-xl p-4" style={{ backgroundColor: "#EFF6FF" }}>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: NAVY }}>
                                        Recomendaciones
                                    </p>
                                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                                        {data.recomendaciones.map((r, i) => (
                                            <li key={i}>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}