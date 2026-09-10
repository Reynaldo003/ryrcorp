import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Check, ChevronLeft, ChevronRight, Clock3, Inbox, Loader2,
    Pencil, Plus, RotateCcw, Search, Trash2
} from "lucide-react";

const WORK_START = 9;
const WORK_END = 18;
const HOUR_HEIGHT = 82;
const SNAP_MINUTES = 15;
const DAY_MINUTES = (WORK_END - WORK_START) * 60;
const TIMELINE_HEIGHT = (WORK_END - WORK_START) * HOUR_HEIGHT;

const LIST_COLORS = {
    "Por hacer": "#3B82F6",
    "En proceso": "#F59E0B",
    "Hecho": "#10B981",
};

function cls(...values) {
    return values.filter(Boolean).join(" ");
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function startOfWeek(date) {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    const day = result.getDay();
    const diff = day === 0
        ? -6
        : 1 - day;

    result.setDate(
        result.getDate() + diff
    );

    return result;
}

function sameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
    );
}

function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatBackendDateTime(date) {
    return `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeTime(value) {
    if (!value) return null;

    const text = String(value).trim();

    const match = text.match(
        /^(\d{1,2}):(\d{2})(?::(\d{2}))?/
    );

    if (!match) return null;

    return `${pad(Number(match[1]))}:${match[2]}:${match[3] || "00"}`;
}

function parseTaskDate(value, defaultHour = 9) {
    if (!value) return null;

    const text = String(value).trim();

    const localMatch = text.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

    if (localMatch) {
        const [
            ,
            year,
            month,
            day,
            hour,
            minute,
            second,
        ] = localMatch;

        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            hour === undefined
                ? defaultHour
                : Number(hour),
            minute === undefined
                ? 0
                : Number(minute),
            second === undefined
                ? 0
                : Number(second)
        );
    }

    const numeric = Number(value);

    if (!Number.isNaN(numeric) && numeric > 0) {
        const date = new Date(numeric);

        return Number.isNaN(date.getTime())
            ? null
            : date;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function dateHasNoUsefulTime(value) {
    if (!value) return true;

    const text = String(value);

    return (
        /^\d{4}-\d{2}-\d{2}$/.test(text)
        || /T00:00(?::00)?(?:\.000)?(?:Z)?$/.test(text)
    );
}

function getStartRaw(task) {
    /*
     * Formato anterior:
     * scheduled_date = 2026-09-10
     * scheduled_start = 09:30
     */
    if (task?.scheduled_date && task?.scheduled_start) {
        const date = String(
            task.scheduled_date
        ).slice(0, 10);

        const time = normalizeTime(
            task.scheduled_start
        );

        if (date && time) {
            return `${date}T${time}`;
        }
    }

    /*
     * Formato actual del backend.
     */
    if (task?.inicio) {
        return task.inicio;
    }

    if (task?.start_date) {
        return task.start_date;
    }

    if (task?.scheduled_date) {
        return String(
            task.scheduled_date
        ).slice(0, 10);
    }

    return null;
}

function getEndRaw(task) {
    /*
     * Cuando existe scheduled_end usamos due_date como
     * día final si la tarea abarca varios días.
     */
    if (task?.scheduled_end) {
        const date = String(
            task?.due_date
            || task?.scheduled_date
            || ""
        ).slice(0, 10);

        const time = normalizeTime(
            task.scheduled_end
        );

        if (date && time) {
            return `${date}T${time}`;
        }
    }

    if (task?.vence) {
        return task.vence;
    }

    if (task?.due_date) {
        return task.due_date;
    }

    return null;
}

function getTaskRange(task, overrideEnd = null) {
    const startRaw = getStartRaw(task);

    if (!startRaw) return null;

    const startWithoutTime = dateHasNoUsefulTime(
        startRaw
    );

    let start = parseTaskDate(
        startRaw,
        WORK_START
    );

    if (!start) return null;

    if (startWithoutTime) {
        start.setHours(
            WORK_START,
            0,
            0,
            0
        );
    }

    const endRaw = overrideEnd
        || getEndRaw(task);

    let end;

    if (!endRaw) {
        end = new Date(
            start.getTime() + 60 * 60000
        );
    } else {
        const endWithoutTime = dateHasNoUsefulTime(
            endRaw
        );

        end = parseTaskDate(
            endRaw,
            WORK_END - 1
        );

        if (!end) {
            end = new Date(
                start.getTime() + 60 * 60000
            );
        }

        if (endWithoutTime) {
            if (sameDay(start, end)) {
                end = new Date(
                    start.getTime() + 60 * 60000
                );
            } else {
                end.setHours(
                    WORK_END,
                    0,
                    0,
                    0
                );
            }
        }
    }

    if (end <= start) {
        end = new Date(
            start.getTime() + 60 * 60000
        );
    }

    return {
        start,
        end,
    };
}

function getTaskTitle(task) {
    return (
        task?.title
        || task?.titulo
        || "Sin título"
    );
}

function getTaskListId(task) {
    return Number(
        task?.list_id
        || task?.list
        || task?.lista
        || 0
    );
}

function getTaskListName(task, lists) {
    if (task?.list_name) {
        return task.list_name;
    }

    const list = lists.find(
        (item) => Number(item.id) === getTaskListId(task)
    );

    return list?.name || "";
}

function getTaskColor(task, lists) {
    const name = getTaskListName(
        task,
        lists
    );

    return (
        LIST_COLORS[name]
        || "#64748B"
    );
}

function taskIsDone(task, lists) {
    return getTaskListName(
        task,
        lists
    ).trim().toLowerCase() === "hecho";
}

function dayWorkStart(date) {
    const result = new Date(date);

    result.setHours(
        WORK_START,
        0,
        0,
        0
    );

    return result;
}

function dayWorkEnd(date) {
    const result = new Date(date);

    result.setHours(
        WORK_END,
        0,
        0,
        0
    );

    return result;
}

function workingMinutesBetween(start, end) {
    if (!start || !end || end <= start) {
        return 0;
    }

    let total = 0;

    let day = new Date(start);
    day.setHours(0, 0, 0, 0);

    const finalDay = new Date(end);
    finalDay.setHours(0, 0, 0, 0);

    while (day <= finalDay) {
        const workStart = dayWorkStart(day);
        const workEnd = dayWorkEnd(day);

        const segmentStart = new Date(
            Math.max(
                start.getTime(),
                workStart.getTime()
            )
        );

        const segmentEnd = new Date(
            Math.min(
                end.getTime(),
                workEnd.getTime()
            )
        );

        if (segmentEnd > segmentStart) {
            total += (
                segmentEnd - segmentStart
            ) / 60000;
        }

        day = addDays(
            day,
            1
        );
    }

    return Math.round(total);
}

function addWorkingMinutes(date, minutes) {
    let current = new Date(date);
    let remaining = Math.abs(minutes);

    const direction = minutes >= 0
        ? 1
        : -1;

    if (direction > 0) {
        if (current < dayWorkStart(current)) {
            current = dayWorkStart(current);
        }

        if (current >= dayWorkEnd(current)) {
            current = dayWorkStart(
                addDays(current, 1)
            );
        }

        while (remaining > 0) {
            const end = dayWorkEnd(current);

            const available = Math.max(
                0,
                (end - current) / 60000
            );

            if (remaining <= available) {
                return new Date(
                    current.getTime()
                    + remaining * 60000
                );
            }

            remaining -= available;

            current = dayWorkStart(
                addDays(current, 1)
            );
        }
    } else {
        if (current > dayWorkEnd(current)) {
            current = dayWorkEnd(current);
        }

        if (current <= dayWorkStart(current)) {
            current = dayWorkEnd(
                addDays(current, -1)
            );
        }

        while (remaining > 0) {
            const start = dayWorkStart(current);

            const available = Math.max(
                0,
                (current - start) / 60000
            );

            if (remaining <= available) {
                return new Date(
                    current.getTime()
                    - remaining * 60000
                );
            }

            remaining -= available;

            current = dayWorkEnd(
                addDays(current, -1)
            );
        }
    }

    return current;
}

function minutesFromDayStart(date) {
    return (
        (date.getHours() - WORK_START) * 60
        + date.getMinutes()
    );
}

function snapMinutes(minutes) {
    return Math.round(
        minutes / SNAP_MINUTES
    ) * SNAP_MINUTES;
}

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function getScheduledSegments(
    tasks,
    day,
    previewEnds,
    lists
) {
    const workStart = dayWorkStart(day);
    const workEnd = dayWorkEnd(day);
    const segments = [];

    tasks.forEach((task) => {
        const range = getTaskRange(
            task,
            previewEnds[task.id]
        );

        if (!range) return;

        const segmentStart = new Date(
            Math.max(
                range.start.getTime(),
                workStart.getTime()
            )
        );

        const segmentEnd = new Date(
            Math.min(
                range.end.getTime(),
                workEnd.getTime()
            )
        );

        if (segmentEnd <= segmentStart) {
            return;
        }

        segments.push({
            task,
            range,
            start: segmentStart,
            end: segmentEnd,
            isFirst: sameDay(
                range.start,
                day
            ),
            isLast: sameDay(
                range.end,
                day
            ),
            color: getTaskColor(
                task,
                lists
            ),
        });
    });

    segments.sort(
        (a, b) => (
            a.start - b.start
            || a.end - b.end
        )
    );

    const laneEnds = [];

    segments.forEach((segment) => {
        let lane = laneEnds.findIndex(
            (end) => end <= segment.start
        );

        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(segment.end);
        } else {
            laneEnds[lane] = segment.end;
        }

        segment.lane = Math.min(
            lane,
            2
        );
    });

    const lanes = Math.max(
        1,
        Math.min(
            3,
            laneEnds.length
        )
    );

    return segments.map((segment) => ({
        ...segment,
        lanes,
    }));
}

function PriorityLabel({ value }) {
    const labels = {
        LOW: "Baja",
        MEDIUM: "Media",
        HIGH: "Alta",
        URGENT: "Urgente",
    };

    return (
        labels[value]
        || value
        || "Media"
    );
}

function PendingTaskCard({
    task,
    lists,
    onDragStart,
    onEdit,
    onDelete,
    onToggleDone,
}) {
    const color = getTaskColor(
        task,
        lists
    );

    const priority = task.priority
        || task.prioridad
        || "MEDIUM";

    return (
        <article
            draggable
            onDragStart={(event) => {
                onDragStart(
                    event,
                    task
                );
            }}
            className="group cursor-grab rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#131E5C]/30 hover:shadow-md active:cursor-grabbing"
        >
            <div className="flex items-start gap-3">
                <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{
                        backgroundColor: color,
                    }}
                />

                <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-extrabold leading-snug text-slate-900">
                        {getTaskTitle(task)}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                            <PriorityLabel
                                value={priority}
                            />
                        </span>

                        {Array.isArray(task.assigned)
                            && task.assigned.length > 0
                            && (
                                <span className="truncate text-xs font-semibold text-slate-500">
                                    {task.assigned[0]?.name
                                        || task.assigned[0]?.nombre_completo
                                        || "Asignada"
                                    }
                                </span>
                            )
                        }
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="text-xs font-semibold text-slate-400">
                    Arrastra a la agenda
                </span>

                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleDone(task);
                        }}
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                        title="Marcar como hecho"
                    >
                        <Check className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit?.(task);
                        }}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete?.(task);
                        }}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function WeeklyPlanner({
    tasks = [],
    pendingTasks = [],
    lists = [],
    loading = false,
    error = null,
    onWeekRange,
    onRetry,
    onAddTask,
    onEdit,
    onDelete,
    onMoveTask,
    onChangeStatus,
}) {
    const [weekStart, setWeekStart] = useState(
        () => startOfWeek(new Date())
    );

    const [pendingSearch, setPendingSearch] = useState("");
    const [draggingTask, setDraggingTask] = useState(null);
    const [previewEnds, setPreviewEnds] = useState({});
    const [resizeState, setResizeState] = useState(null);

    const scrollRef = useRef(null);

    const weekDays = useMemo(
        () => Array.from(
            { length: 7 },
            (_, index) => addDays(
                weekStart,
                index
            )
        ),
        [weekStart]
    );

    const weekEnd = weekDays[6];

    useEffect(() => {
        onWeekRange?.(
            dateKey(weekStart),
            dateKey(weekEnd)
        );
    }, [
        weekStart,
        weekEnd,
        onWeekRange,
    ]);

    useEffect(() => {
        const container = scrollRef.current;

        if (!container) return;

        container.scrollTop = 0;
    }, [weekStart]);

    /*
     * Ya no clasificamos tasks aquí.
     * El padre nos entrega cada colección por separado.
     */
    const visiblePendingTasks = useMemo(() => {
        const search = pendingSearch
            .trim()
            .toLowerCase();

        if (!search) {
            return pendingTasks;
        }

        return pendingTasks.filter((task) => (
            getTaskTitle(task)
                .toLowerCase()
                .includes(search)
        ));
    }, [
        pendingTasks,
        pendingSearch,
    ]);

    const metrics = useMemo(() => {
        const start = dayWorkStart(
            weekStart
        );

        const end = dayWorkEnd(
            weekEnd
        );

        let scheduledMinutes = 0;
        let completedMinutes = 0;
        let completedTasks = 0;

        tasks.forEach((task) => {
            const range = getTaskRange(task);

            if (
                !range
                || range.end <= start
                || range.start >= end
            ) {
                return;
            }

            const clippedStart = new Date(
                Math.max(
                    range.start.getTime(),
                    start.getTime()
                )
            );

            const clippedEnd = new Date(
                Math.min(
                    range.end.getTime(),
                    end.getTime()
                )
            );

            const minutes = workingMinutesBetween(
                clippedStart,
                clippedEnd
            );

            scheduledMinutes += minutes;

            if (taskIsDone(task, lists)) {
                completedMinutes += minutes;
                completedTasks += 1;
            }
        });

        return {
            scheduledHours: scheduledMinutes / 60,
            completedHours: completedMinutes / 60,
            completedTasks,
            pending: pendingTasks.length,
        };
    }, [
        tasks,
        pendingTasks,
        lists,
        weekStart,
        weekEnd,
    ]);

    const doneList = useMemo(
        () => lists.find(
            (list) => String(list.name)
                .trim()
                .toLowerCase() === "hecho"
        ),
        [lists]
    );

    const todoList = useMemo(
        () => lists.find(
            (list) => String(list.name)
                .trim()
                .toLowerCase() === "por hacer"
        ) || lists[0],
        [lists]
    );

    const handleToggleDone = useCallback(async (task) => {
        if (!onChangeStatus) return;

        const done = taskIsDone(
            task,
            lists
        );

        const target = done
            ? todoList
            : doneList;

        if (!target) {
            console.warn(
                "No se encontró la lista destino para cambiar el estado."
            );

            return;
        }

        await onChangeStatus(
            task,
            Number(target.id)
        );
    }, [
        lists,
        todoList,
        doneList,
        onChangeStatus,
    ]);

    function handleDragStart(event, task) {
        setDraggingTask(task);

        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
            "text/plain",
            String(task.id)
        );
    }

    function handleDragEnd() {
        setDraggingTask(null);
    }

    async function handleDrop(event, day) {
        event.preventDefault();

        if (!draggingTask || !onMoveTask) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const relativeY = clamp(
            event.clientY - rect.top,
            0,
            TIMELINE_HEIGHT
        );

        const droppedMinutes = clamp(
            snapMinutes(
                (relativeY / HOUR_HEIGHT) * 60
            ),
            0,
            DAY_MINUTES - SNAP_MINUTES
        );

        const start = dayWorkStart(day);

        start.setMinutes(
            start.getMinutes()
            + droppedMinutes
        );

        const oldRange = getTaskRange(
            draggingTask
        );

        const duration = oldRange
            ? Math.max(
                SNAP_MINUTES,
                workingMinutesBetween(
                    oldRange.start,
                    oldRange.end
                )
            )
            : 60;

        const end = addWorkingMinutes(
            start,
            duration
        );

        setDraggingTask(null);

        await onMoveTask(
            draggingTask,
            {
                inicio: formatBackendDateTime(start),
                vence: formatBackendDateTime(end),
            }
        );
    }

    function handleDoubleClick(event, day) {
        if (
            !onAddTask
            || event.target.closest("[data-task-card]")
        ) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const relativeY = clamp(
            event.clientY - rect.top,
            0,
            TIMELINE_HEIGHT
        );

        const minutes = clamp(
            snapMinutes(
                (relativeY / HOUR_HEIGHT) * 60
            ),
            0,
            DAY_MINUTES - 60
        );

        const start = dayWorkStart(day);

        start.setMinutes(
            start.getMinutes()
            + minutes
        );

        const end = addWorkingMinutes(
            start,
            60
        );

        const inicio = formatBackendDateTime(
            start
        );

        const vence = formatBackendDateTime(
            end
        );

        onAddTask({
            list_id: todoList?.id,
            inicio,
            vence,
            start_date: inicio,
            due_date: vence,
        });
    }

    function beginResize(event, task) {
        event.preventDefault();
        event.stopPropagation();

        const range = getTaskRange(task);

        if (!range) return;

        setResizeState({
            task,
            startY: event.clientY,
            originalStart: range.start,
            originalEnd: range.end,
        });
    }

    useEffect(() => {
        if (!resizeState) return;

        function handlePointerMove(event) {
            const deltaPixels = (
                event.clientY
                - resizeState.startY
            );

            const deltaMinutes = snapMinutes(
                (deltaPixels / HOUR_HEIGHT)
                * 60
            );

            let end = addWorkingMinutes(
                resizeState.originalEnd,
                deltaMinutes
            );

            const minimum = addWorkingMinutes(
                resizeState.originalStart,
                SNAP_MINUTES
            );

            if (end < minimum) {
                end = minimum;
            }

            setPreviewEnds((prev) => ({
                ...prev,
                [resizeState.task.id]: formatBackendDateTime(end),
            }));
        }

        async function handlePointerUp(event) {
            const deltaPixels = (
                event.clientY
                - resizeState.startY
            );

            const deltaMinutes = snapMinutes(
                (deltaPixels / HOUR_HEIGHT)
                * 60
            );

            let end = addWorkingMinutes(
                resizeState.originalEnd,
                deltaMinutes
            );

            const minimum = addWorkingMinutes(
                resizeState.originalStart,
                SNAP_MINUTES
            );

            if (end < minimum) {
                end = minimum;
            }

            const task = resizeState.task;
            const originalStart = resizeState.originalStart;

            setResizeState(null);

            try {
                await onMoveTask?.(
                    task,
                    {
                        inicio: formatBackendDateTime(
                            originalStart
                        ),
                        vence: formatBackendDateTime(
                            end
                        ),
                    }
                );
            } finally {
                setPreviewEnds((prev) => {
                    const next = {
                        ...prev,
                    };

                    delete next[task.id];

                    return next;
                });
            }
        }

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp
            );
        };
    }, [
        resizeState,
        onMoveTask,
    ]);

    function goToday() {
        setWeekStart(
            startOfWeek(new Date())
        );
    }

    const today = new Date();

    const currentMinutes = (
        (today.getHours() - WORK_START) * 60
        + today.getMinutes()
    );

    const currentTop = (
        currentMinutes / 60
    ) * HOUR_HEIGHT;

    const weekLabel = `${weekStart.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
    })} – ${weekEnd.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })}`;

    if (error) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 text-center">
                <div className="text-base font-extrabold text-rose-600">
                    No se pudo cargar la agenda
                </div>

                <div className="mt-1 text-sm text-slate-500">
                    {error}
                </div>

                <button
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-sm font-bold text-white"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setWeekStart((prev) => (
                                    addDays(prev, -7)
                                ));
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <button
                            onClick={goToday}
                            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-[#131E5C] hover:bg-slate-50"
                        >
                            Hoy
                        </button>

                        <button
                            onClick={() => {
                                setWeekStart((prev) => (
                                    addDays(prev, 7)
                                ));
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        <div className="ml-2">
                            <div className="text-lg font-black capitalize text-[#131E5C]">
                                {weekLabel}
                            </div>

                            <div className="text-sm font-medium text-slate-400">
                                Arrastra actividades y ajusta su duración desde el borde inferior
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
                            <div className="text-[12px] font-bold uppercase tracking-wide text-blue-500">
                                Registradas
                            </div>

                            <div className="text-xl font-black text-[#131E5C]">
                                {metrics.scheduledHours.toFixed(1)} h
                            </div>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                            <div className="text-[12px] font-bold uppercase tracking-wide text-emerald-600">
                                Completadas
                            </div>

                            <div className="text-xl font-black text-emerald-700">
                                {metrics.completedHours.toFixed(1)} h
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
                                Tareas hechas
                            </div>

                            <div className="text-xl font-black text-slate-700">
                                {metrics.completedTasks}
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                            <div className="text-[12px] font-bold uppercase tracking-wide text-amber-600">
                                Pendientes
                            </div>

                            <div className="text-xl font-black text-amber-700">
                                {metrics.pending}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#131E5C] shadow-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Actualizando agenda...
                    </div>
                </div>
            )}

            <div className="flex min-h-[700px] flex-col xl:flex-row">
                {/* BANDEJA PENDIENTES */}
                <aside className="flex max-h-[320px] w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50/70 xl:max-h-none xl:w-[320px] xl:border-b-0 xl:border-r">
                    <div className="shrink-0 border-b border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 text-base font-black text-[#131E5C]">
                                    <Inbox className="h-5 w-5" />
                                    Tareas pendientes
                                </div>

                                <div className="mt-0.5 text-xs font-semibold text-slate-400">
                                    Arrástralas al horario en el que trabajarás
                                </div>
                            </div>

                            <span className="rounded-full bg-[#131E5C] px-2.5 py-1 text-xs font-black text-white">
                                {pendingTasks.length}
                            </span>
                        </div>

                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                                value={pendingSearch}
                                onChange={(event) => {
                                    setPendingSearch(
                                        event.target.value
                                    );
                                }}
                                placeholder="Buscar pendiente..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#131E5C]"
                            />
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                        {pendingTasks.length === 0
                            ? (
                                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                                    <Check className="mx-auto h-7 w-7 text-emerald-500" />

                                    <div className="mt-2 text-sm font-extrabold text-slate-600">
                                        Sin tareas pendientes
                                    </div>

                                    <div className="mt-1 text-xs leading-5 text-slate-400">
                                        Las actividades sin horario aparecerán aquí.
                                    </div>
                                </div>
                            )
                            : visiblePendingTasks.length === 0
                                ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm font-semibold text-slate-400">
                                        No hay coincidencias para "{pendingSearch}".
                                    </div>
                                )
                                : visiblePendingTasks.map((task) => (
                                    <PendingTaskCard
                                        key={task.id}
                                        task={task}
                                        lists={lists}
                                        onDragStart={handleDragStart}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleDone={handleToggleDone}
                                    />
                                ))
                        }
                    </div>

                    <div className="shrink-0 border-t border-slate-200 p-3">
                        <button
                            onClick={() => {
                                onAddTask?.({
                                    list_id: todoList?.id,
                                });
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#192873]"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva pendiente
                        </button>
                    </div>
                </aside>

                {/* CALENDARIO */}
                <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1120px]">
                            <div
                                className="grid border-b border-slate-200 bg-white"
                                style={{
                                    gridTemplateColumns: "68px repeat(7, minmax(150px, 1fr))",
                                }}
                            >
                                <div className="border-r border-slate-100" />

                                {weekDays.map((day) => {
                                    const isToday = sameDay(
                                        day,
                                        today
                                    );

                                    return (
                                        <div
                                            key={dateKey(day)}
                                            className={cls(
                                                "border-r border-slate-100 px-3 py-3 text-center last:border-r-0",
                                                isToday && "bg-blue-50/60"
                                            )}
                                        >
                                            <div className={cls(
                                                "text-xs font-black uppercase tracking-wide",
                                                isToday
                                                    ? "text-blue-600"
                                                    : "text-slate-400"
                                            )}>
                                                {day.toLocaleDateString(
                                                    "es-MX",
                                                    {
                                                        weekday: "short",
                                                    }
                                                )}
                                            </div>

                                            <div className={cls(
                                                "mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-lg font-black",
                                                isToday
                                                    ? "bg-[#131E5C] text-white"
                                                    : "text-slate-800"
                                            )}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div
                                ref={scrollRef}
                                className="max-h-[720px] overflow-y-auto"
                            >
                                <div
                                    className="grid"
                                    style={{
                                        gridTemplateColumns: "68px repeat(7, minmax(150px, 1fr))",
                                    }}
                                >
                                    <div
                                        className="relative border-r border-slate-200 bg-slate-50"
                                        style={{
                                            height: TIMELINE_HEIGHT,
                                        }}
                                    >
                                        {Array.from(
                                            {
                                                length: WORK_END - WORK_START + 1,
                                            },
                                            (_, index) => {
                                                const hour = WORK_START + index;
                                                const top = index * HOUR_HEIGHT;

                                                return (
                                                    <div
                                                        key={hour}
                                                        className="absolute right-2 -translate-y-1/2 text-[12px] font-bold text-slate-400"
                                                        style={{
                                                            top,
                                                        }}
                                                    >
                                                        {pad(hour)}:00
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>

                                    {weekDays.map((day) => {
                                        const segments = getScheduledSegments(
                                            tasks,
                                            day,
                                            previewEnds,
                                            lists
                                        );

                                        const isToday = sameDay(
                                            day,
                                            today
                                        );

                                        return (
                                            <div
                                                key={dateKey(day)}
                                                className={cls(
                                                    "relative border-r border-slate-200 last:border-r-0 transition",
                                                    draggingTask && "bg-blue-50/40"
                                                )}
                                                style={{
                                                    height: TIMELINE_HEIGHT,
                                                }}
                                                onDragOver={(event) => {
                                                    event.preventDefault();

                                                    event.dataTransfer.dropEffect = "move";
                                                }}
                                                onDrop={(event) => {
                                                    handleDrop(
                                                        event,
                                                        day
                                                    );
                                                }}
                                                onDragEnd={handleDragEnd}
                                                onDoubleClick={(event) => {
                                                    handleDoubleClick(
                                                        event,
                                                        day
                                                    );
                                                }}
                                            >
                                                {Array.from(
                                                    {
                                                        length: WORK_END - WORK_START,
                                                    },
                                                    (_, index) => (
                                                        <div key={index}>
                                                            <div
                                                                className="absolute left-0 right-0 border-t border-slate-200"
                                                                style={{
                                                                    top: index * HOUR_HEIGHT,
                                                                }}
                                                            />

                                                            <div
                                                                className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                                                                style={{
                                                                    top: index * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                                                                }}
                                                            />
                                                        </div>
                                                    )
                                                )}

                                                {isToday
                                                    && currentMinutes >= 0
                                                    && currentMinutes <= DAY_MINUTES
                                                    && (
                                                        <div
                                                            className="pointer-events-none absolute left-0 right-0 z-40 flex items-center"
                                                            style={{
                                                                top: currentTop,
                                                            }}
                                                        >
                                                            <span className="h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-rose-500" />
                                                            <span className="h-[2px] flex-1 bg-rose-500" />
                                                        </div>
                                                    )
                                                }

                                                {segments.map((segment) => {
                                                    const top = (
                                                        minutesFromDayStart(
                                                            segment.start
                                                        ) / 60
                                                    ) * HOUR_HEIGHT;

                                                    const duration = Math.max(
                                                        SNAP_MINUTES,
                                                        (
                                                            segment.end
                                                            - segment.start
                                                        ) / 60000
                                                    );

                                                    const height = Math.max(
                                                        24,
                                                        (
                                                            duration / 60
                                                        ) * HOUR_HEIGHT
                                                    );

                                                    const laneWidth = (
                                                        100
                                                        / segment.lanes
                                                    );

                                                    const left = (
                                                        segment.lane
                                                        * laneWidth
                                                    );

                                                    const rangeDuration = workingMinutesBetween(
                                                        segment.range.start,
                                                        segment.range.end
                                                    );

                                                    const done = taskIsDone(
                                                        segment.task,
                                                        lists
                                                    );

                                                    const compact = (
                                                        height < 58
                                                    );

                                                    return (
                                                        <article
                                                            key={`${segment.task.id}-${dateKey(day)}`}
                                                            data-task-card
                                                            draggable={!resizeState}
                                                            onDragStart={(event) => {
                                                                handleDragStart(
                                                                    event,
                                                                    segment.task
                                                                );
                                                            }}
                                                            onDragEnd={handleDragEnd}
                                                            onDoubleClick={(event) => {
                                                                event.stopPropagation();

                                                                onEdit?.(
                                                                    segment.task
                                                                );
                                                            }}
                                                            className={cls(
                                                                "group absolute z-10 overflow-hidden rounded-xl border bg-white shadow-sm transition hover:z-20 hover:shadow-lg",
                                                                done && "opacity-70"
                                                            )}
                                                            style={{
                                                                top: top + 2,
                                                                height: Math.max(
                                                                    22,
                                                                    height - 4
                                                                ),
                                                                left: `calc(${left}% + 3px)`,
                                                                width: `calc(${laneWidth}% - 6px)`,
                                                                borderColor: `${segment.color}55`,
                                                                borderLeft: `4px solid ${segment.color}`,
                                                            }}
                                                        >
                                                            <div className={cls(
                                                                "flex h-full flex-col",
                                                                compact
                                                                    ? "px-2 py-1"
                                                                    : "p-2.5"
                                                            )}>
                                                                <div className="flex min-w-0 items-start gap-1.5">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className={cls(
                                                                            "truncate font-extrabold leading-tight text-slate-900",
                                                                            compact
                                                                                ? "text-xs"
                                                                                : "text-[14px]",
                                                                            done && "line-through"
                                                                        )}>
                                                                            {getTaskTitle(
                                                                                segment.task
                                                                            )}
                                                                        </div>

                                                                        {!compact && (
                                                                            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                                                                <Clock3 className="h-3 w-3" />

                                                                                {formatTime(
                                                                                    segment.start
                                                                                )}

                                                                                {" – "}

                                                                                {formatTime(
                                                                                    segment.end
                                                                                )}

                                                                                <span>
                                                                                    ·
                                                                                </span>

                                                                                <span>
                                                                                    {(rangeDuration / 60).toFixed(
                                                                                        rangeDuration % 60 === 0
                                                                                            ? 0
                                                                                            : 1
                                                                                    )} h
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {!compact && (
                                                                        <div className="flex shrink-0 gap-0.5">
                                                                            <button
                                                                                type="button"
                                                                                draggable={false}
                                                                                onPointerDown={(event) => {
                                                                                    event.stopPropagation();
                                                                                }}
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();

                                                                                    handleToggleDone(
                                                                                        segment.task
                                                                                    );
                                                                                }}
                                                                                className={cls(
                                                                                    "rounded-md p-1",
                                                                                    done
                                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                                        : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                                                                                )}
                                                                                title={
                                                                                    done
                                                                                        ? "Reabrir tarea"
                                                                                        : "Marcar como hecho"
                                                                                }
                                                                            >
                                                                                <Check className="h-3.5 w-3.5" />
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                draggable={false}
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();

                                                                                    onEdit?.(
                                                                                        segment.task
                                                                                    );
                                                                                }}
                                                                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-[#131E5C]"
                                                                                title="Editar"
                                                                            >
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {segment.isLast && (
                                                                    <div
                                                                        draggable={false}
                                                                        onPointerDown={(event) => {
                                                                            beginResize(
                                                                                event,
                                                                                segment.task
                                                                            );
                                                                        }}
                                                                        className="absolute bottom-0 left-1/2 h-2.5 w-12 -translate-x-1/2 cursor-ns-resize rounded-t-md bg-slate-300/80 opacity-0 transition group-hover:opacity-100 hover:bg-[#131E5C]"
                                                                        title="Arrastra para cambiar duración"
                                                                    />
                                                                )}
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                        <span>
                            Doble clic: crear actividad
                        </span>

                        <span>
                            Arrastrar: cambiar fecha y hora
                        </span>

                        <span>
                            Borde inferior: cambiar duración
                        </span>

                        <span className="ml-auto">
                            Intervalos de {SNAP_MINUTES} min
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}