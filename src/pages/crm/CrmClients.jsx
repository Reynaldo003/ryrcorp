import React, { useMemo, useState } from "react";

const mockClients = [
    {
        id: "CL-001",
        nombre: "Cliente Ejemplo A",
        rfc: "XAXX010101000",
        contacto: "María López",
        telefono: "55 1111 2222",
        correo: "maria@clientea.com",
        ciudad: "Tuxpan",
        casosAbiertos: 3,
        conformidad: "Insatisfecho"
    },
    {
        id: "CL-002",
        nombre: "Cliente Ejemplo B",
        rfc: "BEXX010101000",
        contacto: "Jorge Pérez",
        telefono: "55 3333 4444",
        correo: "jorge@clienteb.com",
        ciudad: "Cordoba",
        casosAbiertos: 0,
        conformidad: "Satisfecho"
    },
    {
        id: "CL-003",
        nombre: "Cliente Ejemplo C",
        rfc: "CEXX010101000",
        contacto: "Ana Ruiz",
        telefono: "55 5555 6666",
        correo: "ana@clientec.com",
        ciudad: "Orizaba",
        casosAbiertos: 1,
        conformidad: "Insatisfecho"
    },
];

const mockClientHistory = {
    "CL-001": [
        { folio: "NC-00124", estado: "Nuevo", prioridad: "Alta" },
        { folio: "NC-00110", estado: "En ejecución", prioridad: "Media" },
    ],
    "CL-002": [{ folio: "NC-00105", estado: "Cerrado", prioridad: "Baja" }],
    "CL-003": [{ folio: "NC-00122", estado: "En análisis", prioridad: "Media" }],
};

function Chip({ text }) {
    return (
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
            {text}
        </span>
    );
}

export default function CrmClients() {
    const [q, setQ] = useState("");
    const [selectedId, setSelectedId] = useState(mockClients[0].id);

    const list = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return mockClients;
        return mockClients.filter((c) =>
            [c.id, c.nombre, c.rfc, c.contacto, c.ciudad].some((v) =>
                String(v).toLowerCase().includes(t)
            )
        );
    }, [q]);

    const selected = mockClients.find((c) => c.id === selectedId);
    const history = mockClientHistory[selectedId] || [];

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Clientes</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Lista de clientes y contacto principal. Visualiza el historial de cada cliente.
                        </p>
                    </div>

                    <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        + Nuevo cliente
                    </button>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 md:max-w-md"
                        placeholder="Buscar por nombre, RFC, ciudad..."
                    />
                    <div className="flex gap-2">
                        <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                            Importar
                        </button>
                        <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                            Exportar
                        </button>
                    </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Ciudad</th>
                                <th className="px-4 py-3">Contacto</th>
                                <th className="px-4 py-3">Abiertos</th>
                                <th className="px-4 py-3">Conformidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {list.map((c) => (
                                <tr
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    className={`cursor-pointer hover:bg-slate-50 ${c.id === selectedId ? "bg-slate-50" : ""
                                        }`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{c.nombre}</div>
                                        <div className="text-xs text-slate-500">{c.id} • {c.rfc}</div>
                                    </td>
                                    <td className="px-4 py-3">{c.ciudad}</td>
                                    <td className="px-4 py-3">
                                        <div>{c.contacto}</div>
                                        <div className="text-xs text-slate-500">{c.telefono}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Chip text={`${c.casosAbiertos} abiertos`} />
                                    </td>
                                    <td className="px-4 py-3">{c.conformidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detalle */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold">Ficha del cliente</h2>

                {!selected ? (
                    <p className="mt-2 text-sm text-slate-600">Selecciona un cliente.</p>
                ) : (
                    <div className="mt-4 space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold">{selected.nombre}</div>
                            <div className="mt-1 text-xs text-slate-600">
                                {selected.id} • {selected.rfc}
                            </div>
                            <div className="mt-3 grid gap-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Contacto</span>
                                    <span className="font-medium">{selected.contacto}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Teléfono</span>
                                    <span className="font-medium">{selected.telefono}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Correo</span>
                                    <span className="font-medium">{selected.correo}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Ciudad</span>
                                    <span className="font-medium">{selected.ciudad}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Historial de casos</h3>
                                <button className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                                    + Crear caso
                                </button>
                            </div>

                            <div className="mt-3 space-y-2">
                                {history.map((h) => (
                                    <div key={h.folio} className="rounded-2xl border border-slate-200 bg-white p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium">{h.folio}</div>
                                            <Chip text={h.prioridad} />
                                        </div>
                                        <div className="mt-1 text-xs text-slate-600">Estado: {h.estado}</div>
                                    </div>
                                ))}
                                {!history.length ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                        Sin historial por ahora.
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                                Editar
                            </button>
                            <button className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                                Ver detalle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
