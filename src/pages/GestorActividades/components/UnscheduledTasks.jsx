import React, { useState, useMemo, useRef, useEffect } from "react";
import { Inbox, Search, GripVertical, MoreHorizontal, Pencil, Trash2, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { PRIORITIES } from "./taskConfig";

const BRAND_BLUE = "#131E5C";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function TaskRow({ task, onEdit, onDelete, onSchedule }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const pri = PRIORITIES[task.priority] || PRIORITIES.MEDIUM;
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `unscheduled-${task.id}`,
        data: { task, source: "unscheduled" },
    });

    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        }
        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    return (
        <div
            ref={setNodeRef}
            className={cls(
                "group flex items-center gap-2 rounded-[10px] border border-[#E4E7F0] bg-white px-2.5 py-2 hover:border-[#131E5C]/20 hover:shadow-[0_1px_4px_rgba(19,30,92,0.06)] transition-all",
                isDragging && "opacity-40"
            )}
        >
            <div className="shrink-0 text-[#C8CEDF]">
                <button
                    {...listeners}
                    {...attributes}
                    style={{ touchAction: "none" }}
                    className="cursor-grab rounded p-0.5 text-[#C8CEDF] hover:text-[#515778] active:cursor-grabbing"
                    aria-label={`Arrastrar ${task.title || "tarea"} para agendar`}
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </button>
            </div>

            <span className={cls("shrink-0 h-2 w-2 rounded-full", pri.dot)} />

            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1A1F3C] leading-snug truncate">{task.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cls("inline-flex items-center rounded-full border px-1.5 py-px text-[8px] font-bold", pri.bg, pri.text, pri.border)}>
                        {pri.label}
                    </span>
                </div>
            </div>

            <div className="shrink-0 relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-[8px] text-[#C8CEDF] hover:text-[#515778] hover:bg-[#F7F8FC] transition opacity-0 group-hover:opacity-100"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-[12px] border border-[#E4E7F0] bg-white shadow-[0_4px_16px_rgba(19,30,92,0.1)] py-1 overflow-hidden">
                        <button
                            onClick={() => { onSchedule?.(task); setMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-[#131E5C] hover:bg-[#F7F8FC] transition"
                        >
                            <ArrowRight className="h-3 w-3" /> Agendar
                        </button>
                        <button
                            onClick={() => { onEdit?.(task); setMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-[#515778] hover:bg-[#F7F8FC] transition"
                        >
                            <Pencil className="h-3 w-3" /> Editar
                        </button>
                        <div className="my-0.5 border-t border-[#E4E7F0]" />
                        <button
                            onClick={() => { onDelete?.(task); setMenuOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 transition"
                        >
                            <Trash2 className="h-3 w-3" /> Eliminar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UnscheduledTasks({ tasks, onEdit, onDelete, onSchedule }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return tasks;
        const q = search.toLowerCase();
        return tasks.filter((t) => {
            const priLabel = (PRIORITIES[t.priority]?.label || "").toLowerCase();
            return t.title.toLowerCase().includes(q) || priLabel.includes(q);
        });
    }, [tasks, search]);

    return (
        <div className="rounded-[16px] border border-[#E4E7F0] bg-white shadow-[0_1px_3px_rgba(19,30,92,0.04)] flex flex-col overflow-hidden min-w-0" style={{ maxHeight: "150px" }}>
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-extrabold text-[#8891AD] uppercase tracking-wider">Pendientes</h3>
                    {tasks.length > 0 && (
                        <span className="inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-[#131E5C]/10 px-1.5 text-[9px] font-extrabold text-[#131E5C]">
                            {tasks.length}
                        </span>
                    )}
                </div>
            </div>

            {tasks.length > 2 && (
                <div className="px-4 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#C8CEDF]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-[8px] border border-[#E4E7F0] bg-[#F7F8FC] pl-7 pr-7 py-1.5 text-[10px] font-semibold text-[#515778] outline-none focus:border-[#131E5C] focus:bg-white transition placeholder:text-[#C8CEDF]"
                            placeholder="Buscar tarea..."
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C8CEDF] hover:text-[#8891AD]">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F7F8FC] mb-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-[11px] font-bold text-[#8891AD]">No hay tareas pendientes de agendar</p>
                        <p className="text-[10px] text-[#C8CEDF] mt-0.5">Crea una tarea arriba para comenzar</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-[11px] font-bold text-[#C8CEDF]">Sin resultados para "{search}"</p>
                    </div>
                ) : (
                    filtered.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onSchedule={onSchedule}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
