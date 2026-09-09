import React from "react";
import { TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

export default function WeeklyProgress({ completed, inProgress, pending, overdue }) {
    const total = completed + inProgress + pending;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const stats = [
        { label: "Completadas", value: completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" },
        { label: "En progreso", value: inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500" },
        { label: "Pendientes", value: pending, icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50", bar: "bg-sky-500" },
    ];

    return (
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-[#131E5C]">Progreso semanal</h3>
                <span className="text-lg font-black text-[#131E5C]">{pct}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden mb-4">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            <div className="space-y-2.5">
                {stats.map(({ label, value, icon: Icon, color, bg, bar }) => (
                    <div key={label} className="flex items-center gap-2.5">
                        <div className={cls("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", bg)}>
                            <Icon className={cls("h-3.5 w-3.5", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-bold text-black/60">{label}</span>
                                <span className={cls("text-xs font-black", color)}>{value}</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-black/5 overflow-hidden">
                                <div className={cls("h-full rounded-full transition-all duration-500", bar)} style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {overdue > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="text-[11px] font-bold text-rose-600">{overdue} tarea{overdue !== 1 ? "s" : ""} vencida{overdue !== 1 ? "s" : ""}</span>
                </div>
            )}
        </div>
    );
}
