import React from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Wrench,
    BarChart3,
    Settings,
} from "lucide-react";

const tabs = [
    { to: "/crm", label: "Casos", icon: ClipboardList },
    { to: "/crm/resumen", label: "Resumen", icon: LayoutDashboard, end: true }
];

const base =
    "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition";
const cls = ({ isActive }) =>
    isActive
        ? `${base} bg-neutral-100 text-[#131E5C] shadow-sm`
        : `${base} bg-neutral-300 text-[#131E5C] hover:bg-slate-100`;

export default function CrmTopNav() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#131E5C] p-6 text-white shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="md:max-w-md">
                    <h1 className="text-lg font-semibold">Gestión de las Reclamaciones</h1>
                    <p className="mt-2 max-w-2xl text-sm text-white">
                        Registro, seguimiento y cierre de casos de no conformidad.
                    </p>
                </div>

                <div className="flex gap-4 justify-center md:flex-1 md:justify-center text-left">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        return (
                            <NavLink key={t.to} to={t.to} end={t.end} className={cls}>
                                <Icon size={16} />
                                {t.label}
                            </NavLink>
                        );
                    })}
                </div>

                <div className="flex gap-3 justify-end items-end md:self-end md:ml-auto m-0 p-0">
                    <img src="/vw_white.png" className="h-12 w-auto object-contain block" />
                    <img src="/ryr.png" className="h-12 w-auto object-contain block" />
                </div>
            </div>
        </div>
    );
}
