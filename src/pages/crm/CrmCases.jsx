import React from "react";

export default function CrmCases() {
    const rows = [
        { folio: "NC-00124", cliente: "Cliente Ejemplo A", estado: "Nuevo", prioridad: "Alta" },
        { folio: "NC-00123", cliente: "Cliente Ejemplo B", estado: "En análisis", prioridad: "Media" },
        { folio: "NC-00122", cliente: "Cliente Ejemplo C", estado: "En ejecución", prioridad: "Baja" },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Casos</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Lista de no conformidades.
                        </p>
                    </div>

                    <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        + Nuevo caso
                    </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <input className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300" placeholder="Buscar folio o cliente..." />
                    <select className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300">
                        <option>Estado: Todos</option>
                        <option>Nuevo</option>
                        <option>En análisis</option>
                        <option>En ejecución</option>
                        <option>Cerrado</option>
                    </select>
                    <select className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300">
                        <option>Prioridad: Todas</option>
                        <option>Alta</option>
                        <option>Media</option>
                        <option>Baja</option>
                    </select>
                    <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Folio</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Prioridad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {rows.map((x) => (
                            <tr key={x.folio} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{x.folio}</td>
                                <td className="px-4 py-3">{x.cliente}</td>
                                <td className="px-4 py-3">
                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs">
                                        {x.estado}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{x.prioridad}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
