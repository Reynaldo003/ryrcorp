// src/pages/Clickup/ClickupTimeLine.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Flag, GripHorizontal, Plus, Clock } from "lucide-react";
import {
    BRAND_BLUE, EmptyState, Pill, PriorityBadge,
    addDays, clamp, cls, diffDays, formatDateShort,
    formatMonth, toKey, toLocalDateOnly,
} from "./ClickupUI";

const LEFT_COL_W = 320;
const DAY_W = 44;
const ROW_H = 88;

function normalizeTaskDates(task) {
    let start = toLocalDateOnly(task.start_date || task.created_at) || toLocalDateOnly(task.due_date);
    let end = toLocalDateOnly(task.due_date) || start;
    if (!start) start = toLocalDateOnly(new Date()) || new Date();
    if (!end) end = start;
    if (diffDays(start, end) < 0) { const tmp = start; start = end; end = tmp; }
    return { ...task, _s: start, _e: end };
}

function priorityBar(priority) {
    const k = String(priority || "MEDIUM").toUpperCase();
    if (k === "URGENT") return {
        bar: "from-rose-400/30 via-rose-300/20 to-rose-400/10 border-rose-300",
        dot: "bg-rose-500",
        handle: "bg-rose-400/50",
        text: "text-rose-900",
    };
    if (k === "HIGH") return {
        bar: "from-amber-400/30 via-amber-300/20 to-amber-400/10 border-amber-300",
        dot: "bg-amber-500",
        handle: "bg-amber-400/50",
        text: "text-amber-900",
    };
    if (k === "LOW") return {
        bar: "from-emerald-400/30 via-emerald-300/20 to-emerald-400/10 border-emerald-300",
        dot: "bg-emerald-500",
        handle: "bg-emerald-400/50",
        text: "text-emerald-900",
    };
    return {
        bar: "from-sky-400/30 via-sky-300/20 to-sky-400/10 border-sky-300",
        dot: "bg-sky-500",
        handle: "bg-sky-400/50",
        text: "text-sky-900",
    };
}

function statusChip(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("hecho")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (n.includes("proceso")) return "border-amber-200 bg-amber-50 text-amber-800";
    if (n.includes("hacer")) return "border-slate-200 bg-slate-100 text-slate-700";
    return "border-black/10 bg-slate-50 text-black/60";
}

export default function ClickupTimelineView({
    tasks, lists, onUpdateDates, onCreateTaskFromDate, localOnly,
}) {
    const scrollerRef = useRef(null);
    const dragRef = useRef(null);
    const dragPreviewRef = useRef({});
    const [dragPreview, setDragPreview] = useState({});
    const [quickListId, setQuickListId] = useState("");
    const [quickDate, setQuickDate] = useState(() => toKey(new Date()));
    const [tooltip, setTooltip] = useState(null);

    const safeLists = Array.isArray(lists) ? lists : [];
    useEffect(() => {
        if (!quickListId && safeLists[0]?.id) setQuickListId(String(safeLists[0].id));
    }, [quickListId, safeLists]);

    const safeTasks = useMemo(() =>
        (Array.isArray(tasks) ? tasks : []).map(normalizeTaskDates), [tasks]);

    const range = useMemo(() => {
        const today = toLocalDateOnly(new Date()) || new Date();
        if (!safeTasks.length) return { start: addDays(today, -7), end: addDays(today, 21) };
        let min = safeTasks[0]._s, max = safeTasks[0]._e;
        for (const t of safeTasks) {
            if (t._s < min) min = t._s;
            if (t._e > max) max = t._e;
        }
        if (today < min) min = today;
        if (today > max) max = today;
        return { start: addDays(min, -5), end: addDays(max, 8) };
    }, [safeTasks]);

    const days = useMemo(() => {
        const total = Math.max(1, diffDays(range.start, range.end));
        return Array.from({ length: total + 1 }, (_, i) => addDays(range.start, i));
    }, [range]);

    const totalDays = Math.max(1, days.length);
    const timelineWidth = totalDays * DAY_W;

    const monthSpans = useMemo(() => {
        if (!days.length) return [];
        const spans = [];
        let label = formatMonth(days[0]), si = 0;
        for (let i = 1; i < days.length; i++) {
            const l = formatMonth(days[i]);
            if (l !== label) { spans.push({ label, startIndex: si, endIndex: i - 1 }); label = l; si = i; }
        }
        spans.push({ label, startIndex: si, endIndex: days.length - 1 });
        return spans;
    }, [days]);

    const listNameById = useMemo(() =>
        new Map(safeLists.map((l) => [Number(l.id), l.name])), [safeLists]);

    const today = useMemo(() => toLocalDateOnly(new Date()) || new Date(), []);
    const todayIdx = clamp(diffDays(range.start, today), 0, totalDays - 1);
    const todayLeft = todayIdx * DAY_W;

    useEffect(() => {
        const s = scrollerRef.current;
        if (!s || !days.length) return;
        s.scrollLeft = Math.max(0, todayLeft - s.clientWidth / 2 + DAY_W / 2);
    }, [days.length, todayLeft]);

    function xToDate(clientX) {
        const s = scrollerRef.current;
        if (!s) return range.start;
        const x = clientX - s.getBoundingClientRect().left + s.scrollLeft - LEFT_COL_W;
        return addDays(range.start, clamp(Math.round(x / DAY_W), 0, totalDays - 1));
    }

    function startDrag(e, task, mode) {
        e.preventDefault(); e.stopPropagation();
        dragRef.current = { id: task.id, mode, baseS: task._s, baseE: task._e };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", endDrag, { once: true });
    }

    function onMove(e) {
        const cur = dragRef.current;
        if (!cur) return;
        const picked = xToDate(e.clientX);
        let s = cur.baseS, en = cur.baseE;
        if (cur.mode === "move") {
            const dur = Math.max(0, diffDays(cur.baseS, cur.baseE));
            s = picked; en = addDays(s, dur);
        } else if (cur.mode === "left") {
            s = picked; if (diffDays(s, en) < 0) s = en;
        } else {
            en = picked; if (diffDays(s, en) < 0) en = s;
        }
        dragPreviewRef.current = { ...dragPreviewRef.current, [cur.id]: { start: s, end: en } };
        setDragPreview({ ...dragPreviewRef.current });
    }

    function endDrag() {
        const cur = dragRef.current;
        const prev = cur ? dragPreviewRef.current[cur.id] : null;
        if (cur && prev) onUpdateDates?.(cur.id, toKey(prev.start), toKey(prev.end));
        dragRef.current = null;
        dragPreviewRef.current = {};
        setDragPreview({});
        window.removeEventListener("mousemove", onMove);
    }

    function handleQuickCreate() {
        if (quickListId && quickDate) onCreateTaskFromDate?.(Number(quickListId), quickDate);
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm">
            {/* Top controls */}
            <div className="border-b border-black/[0.07] bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-sm font-black text-[#131E5C]">Línea de tiempo</h2>
                        <p className="mt-0.5 text-xs text-black/40">
                            Arrastra las barras para ajustar fechas · {safeTasks.length} tareas
                        </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="grid gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wide text-black/40">Columna</label>
                            <select
                                value={quickListId}
                                onChange={(e) => setQuickListId(e.target.value)}
                                className="cu-input rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-xs font-bold text-black/70"
                            >
                                {safeLists.map((l) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wide text-black/40">Vencimiento</label>
                            <input
                                type="date"
                                value={quickDate}
                                onChange={(e) => setQuickDate(e.target.value)}
                                className="cu-input rounded-xl border border-black/[0.09] bg-white px-3 py-2 text-xs font-bold text-black/70"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleQuickCreate}
                            disabled={!quickListId || !quickDate}
                            className="cu-btn cu-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-white"
                        >
                            <Plus className="h-3.5 w-3.5" /> Nueva tarea
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateShort(toKey(range.start))} → {formatDateShort(toKey(range.end))}
                    </Pill>
                    <Pill tone="blue">
                        <Clock className="h-3.5 w-3.5" /> {days.length} días
                    </Pill>
                    {localOnly && <Pill tone="warn">Solo interfaz</Pill>}
                </div>
            </div>

            {/* Timeline grid */}
            <div ref={scrollerRef} className="cu-scroll overflow-x-auto overflow-y-hidden">
                <div style={{ width: LEFT_COL_W + timelineWidth }}>
                    {/* Sticky header */}
                    <div className="sticky top-0 z-20 border-b border-black/[0.07] bg-white/95 backdrop-blur">
                        {/* Month row */}
                        <div className="grid" style={{ gridTemplateColumns: `${LEFT_COL_W}px ${timelineWidth}px` }}>
                            <div className="sticky left-0 z-30 flex items-center border-r border-black/[0.07] bg-white/95 px-4 py-2.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Actividad</span>
                            </div>
                            <div className="relative h-9 border-r border-black/[0.07]">
                                {monthSpans.map((m) => (
                                    <div
                                        key={`${m.label}-${m.startIndex}`}
                                        className="absolute top-0 flex h-full items-center border-r border-black/[0.06] px-3 text-[11px] font-black capitalize text-black/50"
                                        style={{ left: m.startIndex * DAY_W, width: (m.endIndex - m.startIndex + 1) * DAY_W }}
                                    >
                                        {m.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Day row */}
                        <div className="grid border-t border-black/[0.04]" style={{ gridTemplateColumns: `${LEFT_COL_W}px ${timelineWidth}px` }}>
                            <div className="sticky left-0 z-30 border-r border-black/[0.07] bg-white/95 px-4 py-2">&nbsp;</div>
                            <div className="relative h-9 bg-slate-50/60">
                                {days.map((date, idx) => {
                                    const isWeekend = [0, 6].includes(date.getDay());
                                    const isToday = toKey(date) === toKey(today);
                                    return (
                                        <div
                                            key={toKey(date)}
                                            className={cls(
                                                "absolute top-0 flex h-full items-center justify-center border-r border-black/[0.05] text-[11px] font-bold",
                                                isWeekend ? "bg-black/[0.02] text-black/30" : "text-black/45",
                                                isToday ? "bg-[#131E5C]/[0.07] font-black text-[#131E5C]" : ""
                                            )}
                                            style={{ left: idx * DAY_W, width: DAY_W }}
                                        >
                                            {date.getDate()}
                                        </div>
                                    );
                                })}
                                {/* Today line */}
                                <div
                                    className="pointer-events-none absolute bottom-0 top-0 z-10"
                                    style={{ left: todayLeft + DAY_W / 2, width: 2, background: "linear-gradient(180deg, #ef4444 0%, #f87171 100%)", borderRadius: 2, boxShadow: "0 0 6px rgba(239,68,68,0.4)" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rows */}
                    {safeTasks.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                title="Sin tareas en la línea de tiempo"
                                description="Selecciona una columna y fecha para crear la primera tarea."
                                icon={<Calendar className="h-6 w-6" />}
                                action={
                                    <button
                                        type="button"
                                        onClick={handleQuickCreate}
                                        disabled={!quickListId || !quickDate}
                                        className="cu-btn cu-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-white"
                                    >
                                        <Plus className="h-4 w-4" /> Crear tarea
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="relative cu-stagger">
                            {safeTasks.map((task, rowIdx) => {
                                const preview = dragPreview[task.id];
                                const start = preview?.start || task._s;
                                const end = preview?.end || task._e;
                                const si = clamp(diffDays(range.start, start), 0, totalDays - 1);
                                const ei = clamp(diffDays(range.start, end), si, totalDays - 1);
                                const span = Math.max(1, ei - si + 1);
                                const left = si * DAY_W;
                                const width = span * DAY_W;
                                const tone = priorityBar(task.priority);
                                const listName = listNameById.get(Number(task.list)) || task.list_name || "—";
                                const isDrag = Boolean(preview);

                                return (
                                    <div
                                        key={task.id}
                                        className="grid border-b border-black/[0.04] hover:bg-slate-50/50 transition-colors"
                                        style={{ gridTemplateColumns: `${LEFT_COL_W}px ${timelineWidth}px`, minHeight: ROW_H }}
                                    >
                                        {/* Left column */}
                                        <div className="sticky left-0 z-10 border-r border-black/[0.07] bg-white px-4 py-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cls("h-2 w-2 flex-shrink-0 rounded-full", tone.dot)} />
                                                    <h3 className="truncate text-[13px] font-black text-[#131E5C]">
                                                        {task.title || "Sin título"}
                                                    </h3>
                                                </div>
                                                {task.description && (
                                                    <p className="mb-1.5 line-clamp-1 pl-4 text-[11px] text-black/45 leading-relaxed">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-1.5 pl-4">
                                                    <span className={cls("rounded-full border px-2 py-0.5 text-[10px] font-bold", statusChip(listName))}>
                                                        {listName}
                                                    </span>
                                                    <PriorityBadge value={task.priority} />
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-black/40">
                                                        <Flag className="h-3 w-3" />
                                                        {formatDateShort(toKey(start))} → {formatDateShort(toKey(end))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline area */}
                                        <div className="relative">
                                            {/* Day column backgrounds */}
                                            {days.map((date, idx) => {
                                                const isWeekend = [0, 6].includes(date.getDay());
                                                const isToday = toKey(date) === toKey(today);
                                                return (
                                                    <div
                                                        key={`${task.id}-${toKey(date)}`}
                                                        className={cls(
                                                            "absolute bottom-0 top-0 border-r border-black/[0.04]",
                                                            isWeekend ? "bg-black/[0.018]" : "",
                                                            isToday ? "bg-[#131E5C]/[0.025]" : ""
                                                        )}
                                                        style={{ left: idx * DAY_W, width: DAY_W }}
                                                    />
                                                );
                                            })}

                                            {/* Today line */}
                                            <div
                                                className="pointer-events-none absolute bottom-0 top-0 z-[1]"
                                                style={{ left: todayLeft + DAY_W / 2, width: 2, background: "rgba(239,68,68,0.6)", boxShadow: "0 0 4px rgba(239,68,68,0.3)" }}
                                            />

                                            {/* Task bar */}
                                            <div
                                                className={cls(
                                                    "absolute top-1/2 z-[2] -translate-y-1/2 rounded-xl border bg-gradient-to-r shadow-sm",
                                                    tone.bar,
                                                    isDrag && "opacity-90 shadow-lg ring-2 ring-white"
                                                )}
                                                style={{ left: left + 4, width: Math.max(DAY_W, width - 8), height: 48 }}
                                            >
                                                {/* Move handle */}
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => startDrag(e, task, "move")}
                                                    className="absolute inset-0 flex cursor-grab items-center gap-2 rounded-xl px-3 active:cursor-grabbing"
                                                >
                                                    <span className={cls("h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm", tone.dot)} />
                                                    <span className={cls("truncate text-[12px] font-black", tone.text)}>
                                                        {task.title}
                                                    </span>
                                                    <GripHorizontal className="ml-auto h-4 w-4 flex-shrink-0 opacity-40" />
                                                </button>

                                                {/* Left resize */}
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => startDrag(e, task, "left")}
                                                    className={cls(
                                                        "absolute left-0 top-0 h-full w-2.5 cursor-ew-resize rounded-l-xl",
                                                        tone.handle
                                                    )}
                                                />
                                                {/* Right resize */}
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => startDrag(e, task, "right")}
                                                    className={cls(
                                                        "absolute right-0 top-0 h-full w-2.5 cursor-ew-resize rounded-r-xl",
                                                        tone.handle
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}