import React, { useState } from "react";

function Section({ title, desc, children }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function Pill({ text }) {
    return (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
            {text}
        </span>
    );
}

export default function CrmSettings() {
    const [states] = useState(["Nuevo", "En análisis", "En ejecución", "Cerrado"]);
    const [priorities] = useState(["Alta", "Media", "Baja"]);
    const [types] = useState(["Retraso", "Daño", "Calidad", "Atención", "Documentación"]);

    return (
        <div className="space-y-4">
            <Section
                title="Catálogos"
                desc="Aquí se definen opciones que usan todos los usuarios. (Demo sin guardado)."
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Estados</div>
                            <button className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                                + Agregar
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {states.map((s) => (
                                <Pill key={s} text={s} />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Prioridades</div>
                            <button className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                                + Agregar
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {priorities.map((p) => (
                                <Pill key={p} text={p} />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Tipos de caso</div>
                            <button className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                                + Agregar
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {types.map((t) => (
                                <Pill key={t} text={t} />
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            <Section
                title="Usuarios y permisos (placeholder)"
                desc="Más adelante: roles por módulo (Admin, Supervisor, Atención, Calidad)."
            >
                <div className="grid gap-3 md:grid-cols-3">
                    {["Admin", "Supervisor", "Atención", "Calidad", "Operación"].map((r) => (
                        <div key={r} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold">{r}</div>
                            <div className="mt-2 text-xs text-slate-600">
                                Permisos se configurarán cuando conectemos backend.
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}
