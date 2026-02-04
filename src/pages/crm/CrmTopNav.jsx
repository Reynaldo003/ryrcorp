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
    { to: "/crm", label: "Resumen", icon: LayoutDashboard, end: true },
    { to: "/crm/casos", label: "Casos", icon: ClipboardList },
    { to: "/crm/clientes", label: "Clientes Fisicos", icon: Users },
    { to: "/crm/clientesVir", label: "Clientes Digitales", icon: Users },
    { to: "/crm/acciones", label: "Acciones", icon: Wrench },
    { to: "/crm/configuracion", label: "Configuración", icon: Settings },
];

const base =
    "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition";
const cls = ({ isActive }) =>
    isActive
        ? `${base} bg-[#0f2866] text-white shadow-sm`
        : `${base} text-slate-700 hover:bg-slate-100`;

export default function CrmTopNav() {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-lg font-semibold">CRM – No Conformidades</h1>
                    <p className="text-sm text-slate-600">
                        Registro, seguimiento y cierre de casos de no conformidad.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        return (
                            <NavLink
                                key={t.to}
                                to={t.to}
                                end={t.end}
                                className={cls}
                            >
                                <Icon size={16} />
                                {t.label}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
