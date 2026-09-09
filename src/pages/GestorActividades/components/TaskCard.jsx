import React from "react";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { parseTimeMin, MIN_DURATION } from "./scheduleUtils";

const BRAND_BLUE = "#131E5C";

const PRIORITY_STYLES = {
    LOW: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    MEDIUM: { dot: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
    HIGH: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    URGENT: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const STATUS_COLORS = {
    "Por hacer": "#3B82F6",
    "En proceso": "#F59E0B",
    "Hecho": "#10B981",
};

function cls(...a) {
    return a.filter(Boolean).join("");
}

export default function TaskCard({
    task,
    onEdit,
    onDelete,
    compact = false,
    dragRef,
    dragAttributes,
    dragListeners,
    resizeProps,
    isDragging = false,
    style,
    onClick,
}) {
    const pStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
    const statusColor = STATUS_COLORS[task.list_name] || "#94A3B8";
    const startTime = task.scheduled_start || task.start_time;
    const endTime = task.scheduled_end || task.end_time;
    const startMin = parseTimeMin(startTime);
    const endMin = parseTimeMin(endTime);
    const durationMin = startMin !== null && endMin !== null && endMin > startMin ? endMin - startMin : MIN_DURATION;

    if (compact) {
        return (
            <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-white p-2.5 hover:shadow-sm transition">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} />
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#131E5C] leading-snug line-clamp-2">{task.title || "Sin título"}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={cls("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold", pStyle.bg, pStyle.text, pStyle.border)}>
                            <span className={cls("h-1 w-1 rounded-full", pStyle.dot)} />
                            {task.priority === "LOW" ? "Baja" : task.priority === "MEDIUM" ? "Media" : task.priority === "HIGH" ? "Alta" : "Urgente"}
                        </span>
                        {task.due_date && (
                            <span className="text-[9px] font-semibold text-black/40">
                                {String(task.due_date).slice(5, 10)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <button onClick={() => onEdit?.(task)} className="rounded p-1 text-black/30 hover:text-[#131E5C] hover:bg-slate-100">
                        <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => onDelete?.(task)} className="rounded p-1 text-black/30 hover:text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={dragRef}
            role="button"
            tabIndex={0}
            aria-label={`Actividad ${task.title || "sin título"}`}
            aria-grabbed={isDragging}
            {...(dragAttributes || {})}
            {...(dragListeners || {})}
            onClick={onClick}
            className={cls(
                "group relative h-full rounded-xl border bg-white px-2.5 py-2 shadow-sm transition hover:shadow-md",
                isDragging && "opacity-40"
            )}
            style={{
                ...(style || {}),
                borderLeftWidth: "3px",
                borderLeftColor: statusColor,
                touchAction: "none",
            }}
        >
            <div className="flex items-start justify-between gap-1.5">
                <p className="text-[11px] font-black text-[#131E5C] leading-snug line-clamp-2">{task.title || "Sin título"}</p>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                        className="rounded p-0.5 text-black/30 hover:text-[#131E5C]"
                        aria-label={`Editar ${task.title || "actividad"}`}
                    >
                        <Pencil className="h-2.5 w-2.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(task); }}
                        className="rounded p-0.5 text-black/30 hover:text-rose-500"
                        aria-label={`Eliminar ${task.title || "actividad"}`}
                    >
                        <Trash2 className="h-2.5 w-2.5" />
                    </button>
                </div>
            </div>
            {(startTime || endTime) && (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-black/40">
                    <Clock className="h-2.5 w-2.5" />
                    {startTime || ""}{endTime ? ` – ${endTime}` : ""}
                </div>
            )}
            <div className="mt-1.5 flex items-center gap-1">
                <span className={cls("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold", pStyle.bg, pStyle.text, pStyle.border)}>
                    <span className={cls("h-1 w-1 rounded-full", pStyle.dot)} />
                    {task.priority === "LOW" ? "Baja" : task.priority === "MEDIUM" ? "Media" : task.priority === "HIGH" ? "Alta" : "Urgente"}
                </span>
                {task.list_name && (
                    <span className="text-[8px] font-bold text-black/30">{task.list_name}</span>
                )}
            </div>

            {resizeProps && (
                <div
                    {...resizeProps}
                    role="slider"
                    tabIndex={0}
                    aria-label={`Ajustar duración de ${task.title || "la actividad"}`}
                    aria-valuemin={MIN_DURATION}
                    aria-valuenow={Math.max(MIN_DURATION, durationMin)}
                    className="absolute -bottom-1.5 left-1/2 z-10 flex h-3 w-10 -translate-x-1/2 cursor-ns-resize items-center justify-center gap-0.5 rounded-full border border-[#E4E7F0] bg-white opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-[#F7F8FC]"
                    style={{ touchAction: "none" }}
                >
                    {[0, 1, 2].map((i) => (
                        <span key={i} className="h-0.5 w-3 rounded-full bg-[#C8CEDF]" />
                    ))}
                </div>
            )}
        </div>
    );
}