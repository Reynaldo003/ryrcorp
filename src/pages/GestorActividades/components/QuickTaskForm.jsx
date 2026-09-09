import React, { useState } from "react";
import { Plus, CalendarPlus } from "lucide-react";
import { CATEGORIES, CATEGORY_KEYS } from "./taskConfig";

export default function QuickTaskForm({ onSubmit }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("work");

    function handleSubmit(e) {
        e.preventDefault();
        const t = title.trim();
        onSubmit?.({ title: t || undefined, category: t ? category : undefined });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[16px] border border-[#E4E7F0] bg-white shadow-[0_1px_3px_rgba(19,30,92,0.04)] p-3.5 flex flex-col gap-2 min-w-0"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#131E5C]/[0.06]">
                        <CalendarPlus className="h-3.5 w-3.5 text-[#131E5C]" />
                    </div>
                    <h3 className="text-[11px] font-extrabold text-[#1A1F3C] uppercase tracking-wider truncate">Añadir tarea</h3>
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="shrink-0 max-w-[110px] rounded-[8px] border border-[#E4E7F0] bg-[#F7F8FC] px-2 py-1.5 text-[10px] font-extrabold text-[#515778] outline-none focus:border-[#131E5C] transition"
                >
                    {CATEGORY_KEYS.map((k) => (
                        <option key={k} value={k}>{CATEGORIES[k].label}</option>
                    ))}
                </select>
            </div>

            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe el nombre de la tarea"
                className="w-full min-w-0 rounded-[10px] border border-[#E4E7F0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1A1F3C] outline-none focus:border-[#131E5C] transition placeholder:text-[#C8CEDF]"
            />

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#131E5C] px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-[#0f1748] shadow-[0_1px_3px_rgba(19,30,92,0.2)]"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir
                </button>
                <button
                    type="button"
                    onClick={() => onSubmit?.({})}
                    className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#E4E7F0] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#515778] hover:bg-[#F7F8FC] transition"
                    title="Nueva tarea con todos los detalles"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva tarea
                </button>
            </div>
        </form>
    );
}