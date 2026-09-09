import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import SemicircleProgress from "./SemicircleProgress";

const BRAND_BLUE = "#131E5C";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function VariationBadge({ current, previous }) {
    if (previous == null || current == null) return null;
    const diff = current - previous;
    const pct = previous > 0 ? Math.round(((diff) / previous) * 100) : diff > 0 ? 100 : 0;

    if (diff === 0) {
        return (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F7F8FC] px-2 py-0.5 text-[10px] font-bold text-[#8891AD]">
                <Minus className="h-2.5 w-2.5" /> Igual
            </span>
        );
    }

    const isUp = diff > 0;
    return (
        <span className={cls(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
            isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
            {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isUp ? "+" : ""}{pct}%
        </span>
    );
}

function ProgressMessage({ pct }) {
    if (pct >= 80) return "Excelente ritmo";
    if (pct >= 60) return "Muy buen ritmo";
    if (pct >= 40) return "Buen avance";
    if (pct >= 20) return "En camino";
    return "Inicio de semana";
}

export function ProgressCard({ value = 0, total = 0, previousValue, previousTotal, className }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    const prevPct = previousTotal > 0 ? Math.round((previousValue / previousTotal) * 100) : null;
    const diff = prevPct != null ? pct - prevPct : null;

    const gaugeColor = pct >= 60 ? "#10B981" : pct >= 30 ? "#131E5C" : "#F59E0B";

    return (
        <div className={cls("rounded-[16px] border border-[#E4E7F0] bg-white p-4 shadow-[0_1px_3px_rgba(19,30,92,0.04)] flex items-center gap-4", className)}>
            <div className="shrink-0">
                <SemicircleProgress
                    value={pct}
                    size={90}
                    stroke={9}
                    color={gaugeColor}
                    trackColor="#F0F1F6"
                    label={
                        <span className="text-lg font-black text-[#131E5C] leading-none">{pct}%</span>
                    }
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-[#8891AD] uppercase tracking-wider mb-0.5">Progreso semanal</div>
                <div className="text-sm font-black text-[#131E5C] mb-1.5">{ProgressMessage(pct)}</div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-[#515778]">
                        {value} de {total} tareas
                    </span>
                    {diff != null && (
                        <span className={cls(
                            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            diff > 0 ? "bg-emerald-50 text-emerald-600" : diff < 0 ? "bg-rose-50 text-rose-600" : "bg-[#F7F8FC] text-[#8891AD]"
                        )}>
                            {diff > 0 ? <TrendingUp className="h-2 w-2" /> : diff < 0 ? <TrendingDown className="h-2 w-2" /> : <Minus className="h-2 w-2" />}
                            {diff > 0 ? "+" : ""}{diff}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function StatCard({ label, value, icon: Icon, color, bgColor, previousValue, className }) {
    return (
        <div className={cls("rounded-[16px] border border-[#E4E7F0] bg-white p-4 shadow-[0_1px_3px_rgba(19,30,92,0.04)]", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className={cls("flex h-8 w-8 items-center justify-center rounded-[10px]", bgColor)}>
                    <Icon className={cls("h-4 w-4", color)} />
                </div>
                <VariationBadge current={value} previous={previousValue} />
            </div>
            <div className={cls("text-2xl font-black leading-none mb-0.5", color)}>{value}</div>
            <div className="text-[11px] font-semibold text-[#8891AD]">{label}</div>
        </div>
    );
}
