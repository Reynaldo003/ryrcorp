import React, { useMemo, useState } from "react";

const mockActions = [
    { id: "AC-0101", caso: "NC-00124", accion: "Revisar evidencia y confirmar causa", responsable: "Supervisor", vence: "2026-02-06", estado: "Pendiente" },
    { id: "AC-0102", caso: "NC-00123", accion: "Coordinar inspección con taller", responsable: "Calidad", vence: "2026-02-07", estado: "En curso" },
    { id: "AC-0103", caso: "NC-00122", accion: "Aplicar corrección y documentar cierre", responsable: "Operación", vence: "2026-02-08", estado: "Pendiente" },
    { id: "AC-0104", caso: "NC-00119", accion: "Validar solución con cliente", responsable: "Atención", vence: "2026-02-05", estado: "Hecho" },
];

function Chip({ text }) {
    return (
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
            {text}
        </span>
    );
}

export default function CrmActions() {
    const [q, setQ] = useState("");
    const [estado, setEstado] = useState("Todos");

    const list = useMemo(() => {
        return mockActions.filter((a) => {
            const okQ =
                !q.trim() ||
                [a.id, a.caso, a.accion, a.responsable].some((v) =>
                    String(v).toLowerCase().includes(q.trim().toLowerCase())
                );
            const okE = estado === "Todos" ? true : a.estado === estado;
            return okQ && okE;
        });
    }, [q, estado]);

    const counts = useMemo(() => {
        const c = { Pendiente: 0, "En curso": 0, Hecho: 0 };
        mockActions.forEach((a) => (c[a.estado] = (c[a.estado] || 0) + 1));
        return c;
    }, []);

    return (
        <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Acciones correctivas</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Seguimiento operativo (pendientes, en curso y finalizadas).
                        </p>
                    </div>
                    <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        + Nueva acción
                    </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 md:col-span-2"
                        placeholder="Buscar por folio, caso, responsable..."
                    />
                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    >
                        <option>Todos</option>
                        <option>Pendiente</option>
                        <option>En curso</option>
                        <option>Hecho</option>
                    </select>
                    <button
                        onClick={() => {
                            setQ("");
                            setEstado("Todos");
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Mini tablero */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold">Estado (demo)</h3>
                    <div className="mt-4 space-y-3">
                        {["Pendiente", "En curso", "Hecho"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setEstado(s)}
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100"
                            >
                                <span className="text-sm font-medium">{s}</span>
                                <Chip text={`${counts[s] || 0}`} />
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setEstado("Todos")}
                        className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Ver todas
                    </button>
                </div>

                {/* Lista */}
                <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Acción</th>
                                <th className="px-4 py-3">Caso</th>
                                <th className="px-4 py-3">Responsable</th>
                                <th className="px-4 py-3">Vence</th>
                                <th className="px-4 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {list.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{a.accion}</div>
                                        <div className="text-xs text-slate-500">{a.id}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{a.caso}</td>
                                    <td className="px-4 py-3">{a.responsable}</td>
                                    <td className="px-4 py-3">{a.vence}</td>
                                    <td className="px-4 py-3">
                                        <Chip text={a.estado} />
                                    </td>
                                </tr>
                            ))}
                            {!list.length ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-600">
                                        No hay acciones con esos filtros.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
