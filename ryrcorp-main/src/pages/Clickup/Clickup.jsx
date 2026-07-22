//src/pages/Clickup/Clickup.jsx
import { useEffect, useMemo, useState } from "react";
import { Plus, UsersRound, CheckCircle2 } from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";

const BRAND_BLUE = "#131E5C";

function Card({ children }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            {children}
        </div>
    );
}

export default function Clickup() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [name, setName] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const activeTeamId = useMemo(() => {
        const v = localStorage.getItem("clickup_team_id");
        return v ? Number(v) : null;
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await apiClickup.listTeams();
            setTeams(data || []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function selectTeam(id) {
        localStorage.setItem("clickup_team_id", String(id));
        // refresco suave (o usa state global si luego quieres)
        window.location.reload();
    }

    async function createTeam() {
        const n = name.trim();
        if (!n) return;

        setCreating(true);
        try {
            await apiClickup.createTeam({ name: n, descripcion: descripcion.trim() || null });
            setName("");
            setDescripcion("");
            await load();
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="px-3 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-extrabold text-[#131E5C]">Tus equipos</h2>
                                <p className="mt-1 text-sm text-black/60">
                                    Selecciona un equipo para administrar tareas e invitaciones.
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm">
                                <UsersRound className="h-4 w-4 text-black/70" />
                                <span className="font-semibold">{teams.length}</span>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-24 animate-pulse rounded-xl bg-black/5" />
                                ))
                            ) : teams.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-black/15 p-6 text-sm text-black/60">
                                    Aún no tienes equipos. Crea el primero.
                                </div>
                            ) : (
                                teams.map((t) => {
                                    const isActive = activeTeamId === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => selectTeam(t.id)}
                                            className={[
                                                "text-left rounded-xl border p-4 transition shadow-sm",
                                                isActive
                                                    ? "border-[#131E5C] bg-[#131E5C]/5"
                                                    : "border-black/10 bg-white hover:bg-slate-50",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                                        {t.name}
                                                    </div>
                                                    <div className="mt-1 line-clamp-2 text-xs text-black/60">
                                                        {t.descripcion || "—"}
                                                    </div>
                                                </div>
                                                {isActive ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                ) : null}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

                <div>
                    <Card>
                        <h2 className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>
                            Crear equipo
                        </h2>
                        <p className="mt-1 text-sm text-black/60">
                            Un equipo agrupa usuarios y proyectos.
                        </p>

                        <div className="mt-4 grid gap-3">
                            <div>
                                <label className="text-xs font-bold text-black/70">Nombre</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                                    placeholder="Ej. Equipo Ventas Córdoba"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black/70">Descripción (opcional)</label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="mt-1 w-full min-h-[90px] rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                                    placeholder="Qué hace este equipo..."
                                />
                            </div>

                            <button
                                onClick={createTeam}
                                disabled={creating}
                                className={[
                                    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition",
                                    creating ? "opacity-70" : "hover:opacity-95",
                                ].join(" ")}
                                style={{ backgroundColor: BRAND_BLUE }}
                            >
                                <Plus className="h-4 w-4" />
                                {creating ? "Creando..." : "Crear"}
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}