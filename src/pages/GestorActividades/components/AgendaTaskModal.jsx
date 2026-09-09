import React, { useState } from "react";
import { CalendarClock, X, Save, Trash2, AlertTriangle } from "lucide-react";
import { CATEGORIES, CATEGORY_KEYS, PRIORITIES, PRIORITY_KEYS } from "./taskConfig";
import {
    parseTimeMin,
    minutesToTimeLabel,
    taskStartMin,
    taskEndMin,
    FIRST_HOUR,
    LAST_HOUR,
} from "./scheduleUtils";

const BRAND_BLUE = "#131E5C";
const FALLBACK_LISTS = ["Por hacer", "En proceso", "Hecho"];

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240];

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

export default function AgendaTaskModal({ task, lists, onClose, onSave, onDelete }) {
    const listNames = (Array.isArray(lists) && lists.length ? lists.map((l) => l.name) : FALLBACK_LISTS);
    const currentDate = String(task?.scheduled_date || task?.due_date || "").slice(0, 10);
    const currentStart = minutesToTimeLabel(taskStartMin(task));
    const currentEnd = taskEndMin(task) - taskStartMin(task);

    const [title, setTitle] = useState(task?.title || "");
    const [date, setDate] = useState(currentDate);
    const [startTime, setStartTime] = useState(currentStart);
    const [duration, setDuration] = useState(currentEnd > 0 ? currentEnd : 60);
    const [category, setCategory] = useState(task?.category || "work");
    const [priority, setPriority] = useState(task?.priority || "MEDIUM");
    const [estado, setEstado] = useState(task?.list_name || listNames[0] || "Por hacer");
    const [error, setError] = useState("");

    function computePatch() {
        const startMin = parseTimeMin(startTime) ?? null;
        if (startMin === null) {
            setError("La hora de inicio no es válida");
            return null;
        }
        const clippedStart = Math.max(Math.min(startMin, (LAST_HOUR - 1) * 60), FIRST_HOUR * 60);
        let endMin = clippedStart + Number(duration);
        const maxEnd = LAST_HOUR * 60;
        if (endMin > maxEnd) endMin = maxEnd;
        if (endMin - clippedStart < 30) {
            setError("La duración debe terminar dentro del horario visible (8:00–19:00)");
            return null;
        }
        const list = (Array.isArray(lists) ? lists : []).find((l) => l.name === estado);
        return {
            title: title.trim(),
            scheduled_date: date,
            scheduled_start: minutesToTimeLabel(clippedStart),
            scheduled_end: minutesToTimeLabel(endMin),
            durationMinutes: endMin - clippedStart,
            category,
            priority,
            list_name: estado,
            list_id: list?.id,
        };
    }

    function handleSave() {
        if (!title.trim()) { setError("El nombre es obligatorio"); return; }
        if (!date) { setError("Selecciona el día de la tarea"); return; }
        const patch = computePatch();
        if (!patch) return;
        onSave?.(patch);
    }

    const inputBase = "w-full rounded-[10px] border border-[#E4E7F0] bg-white px-3 py-2 text-[12px] font-semibold text-[#1A1F3C] outline-none focus:border-[#131E5C] transition";

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: `linear-gradient(135deg,${BRAND_BLUE} 0%,#1e3282 100%)` }}>
                    <div className="flex items-center gap-2.5">
                        <CalendarClock className="h-5 w-5 text-white/80" />
                        <h3 className="text-[15px] font-black tracking-tight text-white">Editar tarea</h3>
                    </div>
                    <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-3.5">
                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Nombre *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className={cls(inputBase, "mt-1")} placeholder="Nombre de la tarea" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={cls("text-[10px] font-extrabold uppercase tracking-wide", date ? "text-[#8891AD]" : "text-rose-500")}>Día *</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cls(inputBase, "mt-1")} />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Hora inicio</label>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={cls(inputBase, "mt-1")} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Duración</label>
                            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={cls(inputBase, "mt-1 font-bold")}>
                                {DURATION_OPTIONS.map((m) => (
                                    <option key={m} value={m}>{m} min</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Hora fin (auto)</label>
                            <input value={(() => {
                                const s = parseTimeMin(startTime) ?? FIRST_HOUR * 60;
                                const e = Math.min(s + Number(duration), LAST_HOUR * 60);
                                return Number.isFinite(e) ? minutesToTimeLabel(e) : "--:--";
                            })()} readOnly className={cls(inputBase, "mt-1 bg-[#F7F8FC] text-[#8891AD]")} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Categoría</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className={cls(inputBase, "mt-1 font-bold")}>
                                {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Prioridad</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={cls(inputBase, "mt-1 font-bold")}>
                                {PRIORITY_KEYS.map((k) => <option key={k} value={k}>{PRIORITIES[k].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-wide text-[#8891AD]">Estado</label>
                            <select value={estado} onChange={(e) => setEstado(e.target.value)} className={cls(inputBase, "mt-1 font-bold")}>
                                {listNames.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-[10px] border border-[#E4E7F0] bg-[#F7F8FC] px-3 py-2 text-[10px] font-semibold text-[#8891AD]">
                        La tarea se ubicará entre las horas visibles de la agenda (8:00–19:00).
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-600">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC]/80 px-5 py-3.5 shrink-0">
                    <button
                        onClick={() => { onClose(); onDelete?.(task); }}
                        className="inline-flex items-center gap-1.5 rounded-[10px] border border-rose-200 px-3 py-2 text-[11px] font-extrabold text-rose-500 hover:bg-rose-50 transition"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="rounded-[10px] border border-[#E4E7F0] bg-white px-4 py-2 text-[12px] font-extrabold text-[#515778] hover:bg-[#F7F8FC] transition">Cancelar</button>
                        <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12px] font-extrabold text-white transition hover:opacity-90" style={{ backgroundColor: BRAND_BLUE }}>
                            <Save className="h-3.5 w-3.5" /> Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}