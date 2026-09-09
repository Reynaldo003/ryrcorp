import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, Clock, ListTodo, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    pointerWithin,
    rectIntersection,
    KeyboardCode,
} from "@dnd-kit/core";
import MiniCalendar from "./MiniCalendar";
import { ProgressCard, StatCard } from "./SummaryCard";
import QuickTaskForm from "./QuickTaskForm";
import UnscheduledTasks from "./UnscheduledTasks";
import WeeklySchedule from "./WeeklySchedule";
import TaskCard from "./TaskCard";
import AgendaTaskModal from "./AgendaTaskModal";
import { CATEGORIES } from "./taskConfig";
import {
    toDateStr,
    HOUR_SIZE,
    FIRST_HOUR,
    LAST_HOUR,
    DEFAULT_DURATION,
    taskDurationMinutes,
    resolveDrop,
    minutesToTimeLabel,
    parseSlotId,
} from "./scheduleUtils";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function getWeekRange(offset) {
    const now = new Date();
    const monday = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(now.getDate() + diff + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
}

function getMondayOfMonth(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
}

function buildApiPatch(base, patch, lists) {
    const api = {};
    if (patch.title !== undefined && patch.title !== base.title) api.titulo = patch.title;
    if (patch.scheduled_date) {
        const st = patch.scheduled_start || "00:00";
        api.inicio = `${patch.scheduled_date}T${st}:00`;
        if (patch.scheduled_end) api.vence = `${patch.scheduled_date}T${patch.scheduled_end}:00`;
    }
    if (patch.priority && patch.priority !== base.priority) api.prioridad = patch.priority;
    const currentList = String(base.list_id ?? base.list ?? "");
    if (patch.list_id && String(patch.list_id) !== currentList) api.lista = Number(patch.list_id);
    if (lists.length && patch.list_name && !patch.list_id) {
        const id = lists.find((l) => l.name === patch.list_name)?.id;
        if (id && String(id) !== currentList) api.lista = Number(id);
    }
    return api;
}

function RowPreview({ task }) {
    const cat = CATEGORIES[task.category] || CATEGORIES.work;
    return (
        <div className="flex max-w-[260px] items-center gap-2 rounded-[10px] border border-[#131E5C]/30 bg-white px-2.5 py-2 shadow-md rotate-1">
            <span className={cls("h-2 w-2 shrink-0 rounded-full", cat.dot)} />
            <p className="truncate text-[11px] font-bold text-[#1A1F3C]">{task.title}</p>
        </div>
    );
}

function LocalConfirm({ title, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                <div className="flex items-center gap-3 px-5 pt-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#1A1F3C]">Eliminar tarea</h3>
                        <p className="mt-0.5 text-xs text-[#8891AD]">¿Seguro que deseas eliminar "{title}"?</p>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC]/80 px-5 py-3.5">
                    <button onClick={onCancel} className="rounded-[10px] border border-[#E4E7F0] bg-white px-4 py-2 text-[12px] font-extrabold text-[#515778] hover:bg-[#F7F8FC] transition">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="inline-flex items-center gap-2 rounded-[10px] bg-rose-500 px-4 py-2 text-[12px] font-extrabold text-white hover:bg-rose-600 transition">
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function WeeklyPlanner({ tasks, lists, onAddTask, onDelete, onMoveTask, onWeekRange, onRetry, loading = false, error = null }) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [localTasks, setLocalTasks] = useState([]);
    const [overrides, setOverrides] = useState({});
    const [editing, setEditing] = useState(null);
    const [confirmLocal, setConfirmLocal] = useState(null);
    const [notice, setNotice] = useState(null);
    const [activeDrag, setActiveDrag] = useState(null);
    const suppressClickRef = useRef(0);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 3200);
        return () => clearTimeout(t);
    }, [notice]);

    const showNotice = useCallback((text, kind) => setNotice({ text, kind }), []);

    const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
    const weekStartStr = toDateStr(weekRange.start);
    const weekEndStr = toDateStr(weekRange.end);
    const calendarMonth = weekRange.start.getMonth();
    const calendarYear = weekRange.start.getFullYear();

    useEffect(() => {
        if (onWeekRange) onWeekRange(weekStartStr, weekEndStr);
    }, [weekStartStr, weekEndStr, onWeekRange]);

    const prevWeekRange = useMemo(() => getWeekRange(weekOffset - 1), [weekOffset]);
    const prevWeekStartStr = toDateStr(prevWeekRange.start);
    const prevWeekEndStr = toDateStr(prevWeekRange.end);

    const mergedTasks = useMemo(() => {
        const byId = new Map();
        for (const t of tasks) byId.set(String(t.id), t);
        const out = [];
        for (const [id, base] of byId) {
            const ov = overrides[id] || {};
            out.push({ ...base, ...ov });
        }
        for (const lt of localTasks) {
            if (!byId.has(String(lt.id))) out.push(lt);
        }
        return out;
    }, [tasks, localTasks, overrides]);

    const weekTasks = useMemo(() => {
        return mergedTasks.filter((t) => {
            const due = t.due_date ? String(t.due_date).slice(0, 10) : null;
            const scheduled = t.scheduled_date || null;
            if (due && due >= weekStartStr && due <= weekEndStr) return true;
            if (scheduled && scheduled >= weekStartStr && scheduled <= weekEndStr) return true;
            return false;
        });
    }, [mergedTasks, weekStartStr, weekEndStr]);

    const prevWeekTasks = useMemo(() => {
        return mergedTasks.filter((t) => {
            const due = t.due_date ? String(t.due_date).slice(0, 10) : null;
            const scheduled = t.scheduled_date || null;
            if (due && due >= prevWeekStartStr && due <= prevWeekEndStr) return true;
            if (scheduled && scheduled >= prevWeekStartStr && scheduled <= prevWeekEndStr) return true;
            return false;
        });
    }, [mergedTasks, prevWeekStartStr, prevWeekEndStr]);

    const stats = useMemo(() => {
        const completed = weekTasks.filter((t) => t.list_name === "Hecho").length;
        const inProgress = weekTasks.filter((t) => t.list_name === "En proceso").length;
        const pending = weekTasks.filter((t) => t.list_name === "Por hacer").length;
        return { completed, inProgress, pending };
    }, [weekTasks]);

    const prevStats = useMemo(() => {
        return {
            completed: prevWeekTasks.filter((t) => t.list_name === "Hecho").length,
            inProgress: prevWeekTasks.filter((t) => t.list_name === "En proceso").length,
            pending: prevWeekTasks.filter((t) => t.list_name === "Por hacer").length,
        };
    }, [prevWeekTasks]);

    const trayTasks = useMemo(() => {
        return mergedTasks.filter((t) => t.list_name !== "Hecho" && !t.due_date && !t.scheduled_date);
    }, [mergedTasks]);

    const tasksOnDate = useCallback((dateStr) => {
        return mergedTasks.filter((t) => {
            const due = t.due_date ? String(t.due_date).slice(0, 10) : null;
            const scheduled = t.scheduled_date || null;
            return due === dateStr || scheduled === dateStr;
        }).length;
    }, [mergedTasks]);

    const commitTask = useCallback((id, patch) => {
        const key = String(id);
        const isLocal = key.startsWith("local-");
        if (isLocal) {
            setLocalTasks((prev) => prev.map((t) => (String(t.id) === key ? { ...t, ...patch } : t)));
            return;
        }
        setOverrides((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
        const base = tasks.find((t) => String(t.id) === key);
        if (base) onMoveTask?.(base, buildApiPatch(base, { ...(overrides[key] || {}), ...patch }, lists));
    }, [tasks, overrides, lists, onMoveTask]);

    const handleDragStart = useCallback((event) => {
        const current = event.active.data.current;
        if (current?.task) {
            setActiveDrag({ source: current.source, task: current.task });
        }
    }, []);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveDrag(null);
        suppressClickRef.current = Date.now() + 250;
        if (!over) return;
        const current = active.data.current;
        const task = current?.task;
        if (!task) return;
        const slot = parseSlotId(String(over.id));
        if (!slot.date || !Number.isFinite(slot.hour)) return;
        const duration = current.source === "unscheduled" ? DEFAULT_DURATION : taskDurationMinutes(task);
        const res = resolveDrop({ date: slot.date, slotHour: slot.hour, duration });
        if (!res.ok) {
            showNotice(res.reason, "error");
            return;
        }
        commitTask(task.id, res.patch);
        if (current.source === "unscheduled") {
            showNotice(`Agendada el ${String(res.patch.scheduled_date).slice(5)} a las ${res.patch.scheduled_start}`, "info");
        }
    }, [showNotice, commitTask]);

    const handleDragCancel = useCallback(() => {
        setActiveDrag(null);
    }, []);

    const scheduleCollisionDetection = useCallback((args) => {
        const ptr = pointerWithin(args);
        if (ptr.length > 0) return ptr;
        return rectIntersection(args);
    }, []);

    const scheduleCoordinates = useCallback((_event, { currentCoordinates, context }) => {
        const firstKey = context.droppableRects.keys().next().value;
        const colWidth = firstKey ? (context.droppableRects.get(firstKey)?.width || 190) : 190;
        const { x, y } = currentCoordinates;
        switch (_event.code) {
            case KeyboardCode.Down:
                return { x, y: y + HOUR_SIZE };
            case KeyboardCode.Up:
                return { x, y: Math.max(0, y - HOUR_SIZE) };
            case KeyboardCode.Right:
                return { x: x + colWidth, y };
            case KeyboardCode.Left:
                return { x: Math.max(0, x - colWidth), y };
            default:
                return { x, y };
        }
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: scheduleCoordinates, collisionDetection: scheduleCollisionDetection })
    );

    function handleWeekChange(direction) {
        setWeekOffset(direction === 0 ? 0 : (prev) => prev + direction);
    }

    function handleCalendarMonthChange(newMonth, newYear) {
        const targetMonday = getMondayOfMonth(new Date(newYear, newMonth, 1));
        const diffMs = targetMonday.getTime() - weekRange.start.getTime();
        const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
        setWeekOffset((prev) => prev + diffWeeks);
    }

    function handleQuickAdd(payload = {}) {
        onAddTask?.(payload);
    }

    function handleCreateSlot(date) {
        onAddTask?.({ scheduled_date: date });
    }

    function openEdit(task) {
        const key = String(task.id);
        const found = mergedTasks.find((t) => String(t.id) === key);
        setEditing(found || task);
    }

    function handleSaveModal(patch) {
        if (!editing) return;
        commitTask(editing.id, patch);
        setEditing(null);
        showNotice("Cambios guardados", "info");
    }

    function handleDelete(task) {
        if (String(task.id).startsWith("local-")) {
            setEditing(null);
            setConfirmLocal(task);
        } else {
            setEditing(null);
            onDelete?.(task);
        }
    }

    function confirmLocalDelete() {
        if (!confirmLocal) return;
        setLocalTasks((prev) => prev.filter((t) => String(t.id) !== String(confirmLocal.id)));
        setConfirmLocal(null);
    }

    function handleQuickAgendar(task) {
        const now = new Date();
        let h = now.getHours() + 1;
        h = Math.min(Math.max(h, FIRST_HOUR), LAST_HOUR - 1);
        const res = resolveDrop({ date: toDateStr(now), slotHour: h, duration: DEFAULT_DURATION });
        if (!res.ok) {
            showNotice(res.reason, "error");
            return;
        }
        commitTask(task.id, res.patch);
        setSelectedDate(toDateStr(now));
        showNotice("Agendada para hoy", "info");
    }

    function handleResize(taskId, startMin, endMin) {
        commitTask(taskId, {
            scheduled_start: minutesToTimeLabel(startMin),
            scheduled_end: minutesToTimeLabel(endMin),
            durationMinutes: endMin - startMin,
        });
    }

    return (
        <div className="relative w-full space-y-4">
            {(loading || error) && (
                <div
                    className={cls(
                        "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-xs font-bold",
                        error
                            ? "border-rose-200 bg-rose-50 text-rose-600"
                            : "border-[#131E5C]/10 bg-[#F7F8FC] text-[#515778]"
                    )}
                >
                    {loading && !error ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Cargando semana…
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="flex-1">{error}</span>
                            <button
                                onClick={onRetry}
                                className="rounded-lg border border-[#E4E7F0] bg-white px-3 py-1 text-[11px] font-extrabold text-[#131E5C] hover:bg-slate-50 transition"
                            >
                                Reintentar
                            </button>
                        </>
                    )}
                </div>
            )}
            <DndContext
                sensors={sensors}
                collisionDetection={scheduleCollisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="planner-overview grid w-full max-w-full min-w-0 items-stretch gap-3 min-[900px]:grid-cols-[minmax(270px,26%)_minmax(0,74%)]">
                    <aside className="mini-calendar-panel min-w-0">
                        <MiniCalendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            tasksOnDate={tasksOnDate}
                            month={calendarMonth}
                            year={calendarYear}
                            onMonthChange={handleCalendarMonthChange}
                        />
                    </aside>

                    <section className="planner-dashboard grid min-w-0 gap-3 grid-rows-[minmax(130px,auto)_minmax(130px,auto)]">
                        <div className="summary-row grid min-w-0 gap-3 grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-[minmax(300px,1.7fr)_repeat(3,minmax(145px,0.75fr))]">
                            <ProgressCard
                                className="h-full min-w-0 min-[600px]:col-span-2 min-[900px]:col-span-3 min-[1200px]:col-span-1"
                                value={stats.completed}
                                total={stats.completed + stats.inProgress + stats.pending}
                                previousValue={prevStats.completed}
                                previousTotal={prevStats.completed + prevStats.inProgress + prevStats.pending}
                            />
                            <StatCard
                                className="h-full min-w-0"
                                label="Completadas"
                                value={stats.completed}
                                icon={CheckCircle2}
                                color="text-emerald-600"
                                bgColor="bg-emerald-50"
                                previousValue={prevStats.completed}
                            />
                            <StatCard
                                className="h-full min-w-0"
                                label="En progreso"
                                value={stats.inProgress}
                                icon={Clock}
                                color="text-amber-600"
                                bgColor="bg-amber-50"
                                previousValue={prevStats.inProgress}
                            />
                            <StatCard
                                className="h-full min-w-0"
                                label="Pendientes"
                                value={stats.pending}
                                icon={ListTodo}
                                color="text-[#7C6DAF]"
                                bgColor="bg-violet-50"
                                previousValue={prevStats.pending}
                            />
                        </div>

                        <div className="task-row grid min-w-0 gap-3 grid-cols-1 min-[600px]:grid-cols-2 min-[1200px]:grid-cols-[minmax(320px,0.9fr)_minmax(400px,1.1fr)]">
                            <QuickTaskForm onSubmit={handleQuickAdd} />
                            <UnscheduledTasks
                                tasks={trayTasks}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onSchedule={handleQuickAgendar}
                            />
                        </div>
                    </section>
                </div>

                <div className="min-w-0">
                    <WeeklySchedule
                        tasks={weekTasks}
                        weekOffset={weekOffset}
                        onWeekChange={handleWeekChange}
                        onAddTask={handleCreateSlot}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onCreateSlot={handleCreateSlot}
                        onResize={handleResize}
                        selectedDate={selectedDate}
                        suppressClickRef={suppressClickRef}
                    />
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeDrag && (
                        activeDrag.source === "unscheduled"
                            ? <RowPreview task={activeDrag.task} />
                            : <TaskCard task={activeDrag.task} />
                    )}
                </DragOverlay>
            </DndContext>

            {editing && (
                <AgendaTaskModal
                    key={String(editing.id)}
                    task={editing}
                    lists={lists}
                    onClose={() => setEditing(null)}
                    onSave={handleSaveModal}
                    onDelete={handleDelete}
                />
            )}

            {confirmLocal && (
                <LocalConfirm
                    title={confirmLocal.title}
                    onCancel={() => setConfirmLocal(null)}
                    onConfirm={confirmLocalDelete}
                />
            )}

            {notice && (
                <div
                    className={cls(
                        "pointer-events-none fixed left-1/2 top-4 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold shadow-lg",
                        notice.kind === "error" ? "border-rose-200 bg-white text-rose-600" : "border-emerald-200 bg-white text-emerald-600"
                    )}
                >
                    {notice.kind === "error"
                        ? <AlertTriangle className="h-3.5 w-3.5" />
                        : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {notice.text}
                </div>
            )}
        </div>
    );
}