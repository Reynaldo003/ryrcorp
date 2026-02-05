import React from "react";
import { NavLink } from "react-router-dom";
import { Building2, LayoutDashboard, ShieldCheck, KanbanSquare, Users } from "lucide-react";

const linkBase =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition";

const linkClass = ({ isActive }) =>
    isActive
        ? `${linkBase} bg-[#0f2866] text-white shadow-sm`
        : `${linkBase} text-slate-700 hover:bg-slate-100`;

export default function Sidebar() {
    return (
        <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200 bg-white md:block">
            <div className="flex h-full flex-col">
                <div className="px-5 py-5">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0f2866] text-white">
                            <img src="/ryr.png" alt="" />
                        </div>
                        <div className="leading-tight">
                            <div className="text-sm font-semibold">Grupo Automotriz</div>
                            <div className="text-xs text-slate-500">Volkswagen</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="px-4">
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Módulos
                    </div>

                    <div className="flex flex-col gap-1">
                        <NavLink to="/" end className={linkClass}>
                            <LayoutDashboard size={18} />
                            Inicio
                        </NavLink>

                        <NavLink to="/crm" className={linkClass}>
                            <Users size={18} />
                            Gestión de las Reclamaciones
                        </NavLink>

                        <NavLink to="/safety" className={linkClass}>
                            <ShieldCheck size={18} />
                            Safety Culture
                        </NavLink>

                        <NavLink to="/proyectos" className={linkClass}>
                            <KanbanSquare size={18} />
                            Clickup
                        </NavLink>
                    </div>
                </nav>
            </div>
        </aside>
    );
}
