// src/pages/Clickup/ClickupTableView.jsx
import { useMemo, useState } from "react";
import {
    Bug, CalendarDays, CheckCheck, ChevronDown, ChevronUp,
    ChevronsUpDown, MoveRight, Paperclip, Pencil, Trash2, Users,
} from "lucide-react";
import {
    AvatarStack, BRAND_BLUE, PriorityBadge, cls,
    formatDateShort, taskIsOverdue,
} from "./ClickupUI";

function statusTone(name) {
    const v = String(name || "").toLowerCase();
    if (v.includes("hecho")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (v.includes("proceso")) return "border-amber-200 bg-amber-50 text-amber-700";
    if (v.includes("hacer")) return "border-slate-200 bg-slate-100 text-slate-600";
    return "border-black/10 bg-slate-50 text-black/60";
}

function SortBtn({ col, sortCol, sortDir, onSort }) {
    const active = sortCol === col;
    return (
        <button
            type="button"
            onClick={() => onSort(col)}
            className="inline-flex items-center gap-1 group"
        >
            <span className="group-hover:text-[#131E5C]">{col}</span>
            <span className="opacity-40 group-hover:opacity-80">
                {active
                    ? sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                    : <ChevronsUpDown className="h-3 w-3" />}
            </span>
        </button>
    );
}

export default function ClickupTableView({
    tasks, lists, onMove, onEditTask, onDeleteTask, onManageEvidence, localOnly,
}) {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeLists = Array.isArray(lists) ? lists : [];
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const [hoverRow, setHoverRow] = useState(null);

    const listNameById = useMemo(
        () => new Map(safeLists.map((l) => [Number(l.id), l.name])),
        [safeLists]
    );

    function handleSort(col) {
        if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortCol(col); setSortDir("asc"); }
    }

    const sorted = useMemo(() => {
        if (!sortCol) return safeTasks;
        return [...safeTasks].sort((a, b) => {
            let va = a[sortCol] || "";
            let vb = b[sortCol] || "";
            const cmp = String(va).localeCompare(String(vb));
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [safeTasks, sortCol, sortDir]);

    const thCls = "px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-black/40";

    return (
        <section className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.07] bg-gradient-to-r from-slate-50 to-white px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-[#131E5C]" />
                    <h2 className="text-sm font-black text-[#131E5C]">Vista de tabla</h2>
                </div>
                <span className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-xs font-bold text-black/50 shadow-sm">
                    {safeTasks.length} {safeTasks.length === 1 ? "tarea" : "tareas"}
                </span>
            </div>

            {/* Table */}
            <div className="cu-scroll overflow-x-auto">
                <table className="min-w-[1100px] w-full text-sm">
                    <thead>
                        <tr className="border-b border-black/[0.06] bg-slate-50/60">
                            <th className={cls(thCls, "w-[32%]")}>
                                <SortBtn col="title" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                            </th>
                            <th className={thCls}>Estado</th>
                            <th className={thCls}>
                                <SortBtn col="priority" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                            </th>
                            <th className={thCls}>
                                <SortBtn col="due_date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                            </th>
                            <th className={thCls}>Responsables</th>
                            <th className={thCls}>Mover a</th>
                            <th className={cls(thCls, "text-right")}>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-bold text-black/40">Sin tareas con los filtros actuales</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sorted.map((task, idx) => {
                                const listName = listNameById.get(Number(task.list)) || task.list_name || "—";
                                const overdue = taskIsOverdue({ ...task, list_name: listName });
                                const isDone = String(listName).toLowerCase().includes("hecho");

                                return (
                                    <tr
                                        key={task.id}
                                        className={cls(
                                            "cu-table-row border-b border-black/[0.04] align-top cu-row-enter",
                                            overdue ? "bg-rose-50/30" : ""
                                        )}
                                        style={{ animationDelay: `${Math.min(idx * 25, 300)}ms` }}
                                        onMouseEnter={() => setHoverRow(task.id)}
                                        onMouseLeave={() => setHoverRow(null)}
                                    >
                                        {/* Activity */}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-3">
                                                <span
                                                    className={cls(
                                                        "mt-1 h-10 w-1 shrink-0 rounded-full",
                                                        overdue ? "bg-rose-400" : isDone ? "bg-emerald-400" : "bg-[#131E5C]"
                                                    )}
                                                />
                                                <div className="min-w-0">
                                                    <div className={cls(
                                                        "line-clamp-2 text-[13px] font-black leading-snug",
                                                        isDone ? "text-black/40 line-through" : "text-[#131E5C]"
                                                    )}>
                                                        {task.title || "Sin título"}
                                                    </div>
                                                    {task.description && (
                                                        <p className="mt-0.5 line-clamp-2 text-xs text-black/45 leading-relaxed">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {task.report && (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-700">
                                                                <Bug className="h-3 w-3" />
                                                                {task.report.type === "BUG" ? "Bug" : "Ticket"}
                                                            </span>
                                                        )}
                                                        {overdue && (
                                                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">
                                                                Vencida
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span className={cls(
                                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                                                statusTone(listName)
                                            )}>
                                                {listName}
                                            </span>
                                        </td>

                                        {/* Priority */}
                                        <td className="px-4 py-3">
                                            <PriorityBadge value={task.priority} />
                                        </td>

                                        {/* Dates */}
                                        <td className="px-4 py-3">
                                            <div className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-slate-50 px-2.5 py-1.5 text-[11px] text-black/55 shadow-sm">
                                                <CalendarDays className="h-3.5 w-3.5 text-black/30 flex-shrink-0" />
                                                <span className="font-semibold">
                                                    {formatDateShort(task.start_date || task.created_at)} → {formatDateShort(task.due_date)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Assigned */}
                                        <td className="px-4 py-3">
                                            {task.assigned?.length ? (
                                                <div className="flex items-center gap-2">
                                                    <AvatarStack users={task.assigned} limit={3} />
                                                    <span className="max-w-[140px] truncate text-[11px] font-semibold text-black/55">
                                                        {task.assigned.map((u) => u.name).join(", ")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] text-black/35">
                                                    <Users className="h-3.5 w-3.5" /> Sin asignar
                                                </span>
                                            )}
                                        </td>

                                        {/* Move */}
                                        <td className="px-4 py-3">
                                            <select
                                                value={Number(task.list) || ""}
                                                onChange={(e) => onMove?.(task.id, Number(e.target.value))}
                                                className="cu-input w-[140px] rounded-xl border border-black/[0.09] bg-white px-2.5 py-1.5 text-[11px] font-bold text-black/70"
                                            >
                                                {safeLists.map((l) => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div
                                                className={cls(
                                                    "flex justify-end gap-1.5 transition-opacity duration-150",
                                                    hoverRow === task.id ? "opacity-100" : "opacity-40"
                                                )}
                                            >
                                                {task.report && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => onManageEvidence?.(task, "BUG")}
                                                            className="cu-btn inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"
                                                            title="Evidencia del bug"
                                                        >
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => onManageEvidence?.(task, "RESOLUTION")}
                                                            className="cu-btn inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                                                            title="Evidencia de solución"
                                                        >
                                                            <CheckCheck className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onEditTask?.(task)}
                                                    className="cu-btn inline-flex items-center justify-center rounded-xl border border-black/[0.09] bg-white p-2 text-black/55 hover:bg-slate-50"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteTask?.(task)}
                                                    className="cu-btn inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}