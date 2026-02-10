import React from "react";
import { ArrowRight, ClipboardList, ShieldCheck, Globe, KanbanSquare } from "lucide-react";
import { Link } from "react-router-dom";

function Card({ icon: Icon, title, desc, to }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#131E5C] text-white">
                    <Icon size={18} />
                </div>
                <Link
                    to={to}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                    Abrir <ArrowRight size={14} />
                </Link>
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{desc}</p>
        </div>
    );
}

export default function Home() {
    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-semibold">Panel general</h1>
                    <p className="text-sm text-slate-600">
                        Acceso rápido a las diferentes herramientas.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card
                    icon={ClipboardList}
                    title="Gestión de las Reclamaciones"
                    desc="Registro y seguimiento de clientes no satisfechos, casos, responsables y evidencias."
                    to="/crm"
                />
                <Card
                    icon={Globe}
                    title="Gestión de Prospectos Digitales"
                    desc="Registro y seguimiento de prospectos digitales."
                    to="/crm_digitales"
                />
                <Card
                    icon={ShieldCheck}
                    title="Safety Culture"
                    desc="Observaciones, checklists de cumplimiento y evidencia fotográfica para reporteo."
                    to="/safety"
                />
                <Card
                    icon={KanbanSquare}
                    title="Clickup"
                    desc="Kanban y línea de tiempo para planificación y seguimiento de actividades."
                    to="/proyectos"
                />
            </div>
        </div>
    );
}
