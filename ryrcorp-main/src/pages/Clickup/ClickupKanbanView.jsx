// src/pages/Clickup/ClickupKanbanView.jsx
import { useEffect, useMemo, useState } from "react";
import {
    Calendar,
    CheckCheck,
    Clock3,
    GripVertical,
    MoveRight,
    Paperclip,
    Pencil,
    Plus,
    Trash2,
    Users,
    Bug,
} from "lucide-react";
import {
    AvatarStack,
    BRAND_BLUE,
    EmptyState,
    PriorityBadge,
    cls,
    formatDateShort,
    taskIsOverdue,
} from "./ClickupUI";

function getListTone(listName) {
    const name = String(listName || "").trim().toLowerCase();

    if (name.includes("hacer")) {
        return {
            column: "border-slate-200 bg-slate-50",
            header: "text-slate-800",
            accent: "bg-slate-400",
            dot: "bg-slate-400",
        };
    }

    if (name.includes("proceso")) {
        return {
            column: "border-amber-200 bg-amber-50/70",
            header: "text-amber-900",
            accent: "bg-amber-500",
            dot: "bg-amber-500",
        };
    }

    if (name.includes("hecho") || name.includes("finalizado")) {
        return {
            column: "border-emerald-200 bg-emerald-50/70",
            header: "text-emerald-900",
            accent: "bg-emerald-500",
            dot: "bg-emerald-500",
        };
    }

    return {
        column: "border-black/10 bg-slate-50",
        header: "text-[#131E5C]",
        accent: "bg-[#131E5C]",
        dot: "bg-[#131E5C]",
    };
}

function safeDateRange(task) {
    const start = formatDateShort(task.start_date || task.created_at);
    const due = formatDateShort(task.due_date);

    if (start === "—" && due === "—") return "Sin fecha";
    if (due === "—") return `Inicio ${start}`;
    if (start === "—") return `Vence ${due}`;

    return `${start} → ${due}`;
}

function TaskCard({ task, lists, listName, onMove, onDragStart, onEditTask, onDeleteTask, onManageEvidence }) {
    const [toListId, setToListId] = useState(Number(task.list));
    const overdue = taskIsOverdue({ ...task, list_name: listName });

    useEffect(() => {
        setToListId(Number(task.list));
    }, [task.list]);

    const tone = getListTone(listName);
    const hasEvidence = Boolean(task.report);

    return (
        <article
            draggable
            onDragStart={(event) => onDragStart?.(event, task)}
            className={cls(
                "group cursor-grab rounded-2xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
                overdue ? "border-rose-200 ring-2 ring-rose-100" : "border-black/10"
            )}
            title="Arrastra esta tarea a otra columna"
        >
            <div className="flex items-start gap-3">
                <span className={cls("mt-1 h-12 w-1.5 shrink-0 rounded-full", tone.accent)} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="line-clamp-2 text-sm font-black leading-5 text-[#131E5C]">
                                {task.title || "Sin título"}
                            </h3>

                            {task.description ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/55">
                                    {task.description}
                                </p>
                            ) : null}
                        </div>

                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-black/25 opacity-0 transition group-hover:opacity-100" />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <PriorityBadge value={task.priority} />

                        {overdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">
                                <Clock3 className="h-3.5 w-3.5" />
                                Vencida
                            </span>
                        ) : null}

                        {task.report ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-extrabold text-purple-700">
                                <Bug className="h-3.5 w-3.5" />
                                {task.report.type === "BUG" ? "Bug" : "Ticket"} · {task.report.status || "Abierto"}
                            </span>
                        ) : null}
                    </div>

                    <div className="mt-3 grid gap-2 rounded-xl border border-black/[0.06] bg-slate-50 px-3 py-2 text-[11px] text-black/60">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-black/40" />
                            <span className="font-bold">{safeDateRange(task)}</span>
                        </div>

                        {task.assigned?.length ? (
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex min-w-0 items-center gap-2">
                                    <Users className="h-3.5 w-3.5 shrink-0 text-black/40" />
                                    <span className="truncate font-bold">
                                        {task.assigned.map((item) => item.name).join(", ")}
                                    </span>
                                </span>
                                <AvatarStack users={task.assigned} limit={2} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-black/30" />
                                <span>Sin asignar</span>
                            </div>
                        )}
                    </div>

                    {hasEvidence ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                            <button
                                type="button"
                                onClick={() => onManageEvidence?.(task, "BUG")}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 font-extrabold text-amber-700 hover:bg-amber-100"
                                title="Ver o subir evidencia del bug"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                                Bug {task.bug_evidencias_count || 0}
                            </button>

                            <button
                                type="button"
                                onClick={() => onManageEvidence?.(task, "RESOLUTION")}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 font-extrabold text-emerald-700 hover:bg-emerald-100"
                                title="Ver o subir evidencia de solución"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Sol. {task.resolution_evidencias_count || 0}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mt-3 border-t border-black/[0.06] pt-3">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <select
                        value={toListId || ""}
                        onChange={(event) => setToListId(Number(event.target.value))}
                        className="min-w-0 rounded-xl border border-black/10 bg-white px-2 py-2 text-xs font-bold text-black/70 outline-none focus:border-[#131E5C]"
                    >
                        {lists.map((list) => (
                            <option key={list.id} value={list.id}>
                                {list.name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => onMove?.(task.id, toListId)}
                        disabled={!toListId || Number(toListId) === Number(task.list)}
                        className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-extrabold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ backgroundColor: BRAND_BLUE }}
                        title="Mover tarea"
                    >
                        <MoveRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                    <button
                        type="button"
                        onClick={() => onEditTask?.(task)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black/70 hover:bg-slate-50"
                    >
                        <Pencil className="h-4 w-4" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={() => onDeleteTask?.(task)}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function ClickupKanbanView({
    lists,
    tasksByList,
    filteredTasksByList,
    q,
    priority,
    onMove,
    onCreateTask,
    onDragStart,
    onDragOverColumn,
    onDropToColumn,
    onEditTask,
    onDeleteTask,
    onManageEvidence,
}) {
    const safeLists = Array.isArray(lists) ? lists : [];

    const totals = useMemo(() => {
        return safeLists.reduce(
            (acc, list) => {
                const listTasks = filteredTasksByList?.[list.id] || [];
                acc.visible += listTasks.length;
                acc.real += (tasksByList?.[list.id] || []).length;
                return acc;
            },
            { visible: 0, real: 0 }
        );
    }, [filteredTasksByList, safeLists, tasksByList]);

    if (!safeLists.length) {
        return (
            <EmptyState
                title="Este proyecto no tiene columnas"
                description="Crea columnas base para empezar a trabajar con el tablero."
            />
        );
    }

    return (
        <section className="rounded-3xl border border-black/10 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-black text-[#131E5C]">Tablero Kanban</h2>
                </div>
            </div>

            <div className="grid auto-cols-[minmax(320px,360px)] grid-flow-col gap-3 overflow-x-auto pb-2">
                {safeLists.map((list) => {
                    const tasks = filteredTasksByList?.[list.id] || [];
                    const rawCount = (tasksByList?.[list.id] || []).length;
                    const tone = getListTone(list.name);

                    return (
                        <section
                            key={list.id}
                            className={cls("flex max-h-[calc(100vh-260px)] flex-col rounded-2xl border", tone.column)}
                            onDragOver={onDragOverColumn}
                            onDrop={(event) => onDropToColumn?.(event, list.id)}
                        >
                            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-black/10 bg-white/90 p-3 backdrop-blur">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cls("h-2.5 w-2.5 rounded-full", tone.dot)} />
                                            <h3 className={cls("truncate text-sm font-black", tone.header)}>
                                                {list.name}
                                            </h3>
                                        </div>

                                        <div className="mt-1 text-[11px] font-semibold text-black/45">
                                            {q || priority !== "Todas"
                                                ? `${tasks.length} de ${rawCount}`
                                                : `${rawCount} tareas`}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onCreateTask?.(list.id)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold text-white hover:opacity-95"
                                        style={{ backgroundColor: BRAND_BLUE }}
                                        title="Crear tarea en esta columna"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tarea
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-[180px] flex-1 overflow-y-auto p-3 pr-2">
                                {tasks.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-4 text-center text-xs text-black/55">
                                        {q || priority !== "Todas" ? "Sin tareas con estos filtros" : "Suelta tareas aquí o crea una nueva."}
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {tasks.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                lists={safeLists}
                                                listName={list.name}
                                                onMove={onMove}
                                                onDragStart={onDragStart}
                                                onEditTask={onEditTask}
                                                onDeleteTask={onDeleteTask}
                                                onManageEvidence={onManageEvidence}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </section>
    );
}
