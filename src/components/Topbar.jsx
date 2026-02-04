import React from "react";
import { Search, Bell, UserCircle2 } from "lucide-react";

export default function Topbar() {
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="relative w-[280px] max-w-[60vw]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2 text-sm outline-none transition focus:border-slate-300"
                            placeholder="Buscar clientes, casos, tareas..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="rounded-2xl border border-slate-200 bg-white p-2 hover:bg-slate-50">
                        <Bell size={18} className="text-slate-700" />
                    </button>
                    <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                        <UserCircle2 size={18} className="text-slate-700" />
                        <span className="hidden text-sm text-slate-700 sm:block">Usuario</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
