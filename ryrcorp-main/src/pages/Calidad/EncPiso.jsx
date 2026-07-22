// src/pages/Calidad/EncPiso.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import {
    Search, X, CalendarDays, Loader2, ArrowUpDown,
    ChevronUp, ChevronDown, Building2, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";
const BASE_URL = "https://crm.grupoautomotrizryr.com";

const FINANCIAMIENTO_LABELS = {
    si: "Sí, fue claro",
    no_claro: "No fue clara",
    incompleto: "No indicó todos",
};
const MEDIO_CONTACTO_LABELS = { si: "Sí", parcial: "Parcialmente", no: "No" };
const PRUEBA_MANEJO_LABELS = {
    si_realice: "Sí, realicé",
    no_auto: "No estaba el auto",
    no_ofrecio: "No se ofreció",
};
const RECOMENDACION_LABELS = {
    cumplio: "Sí, completamente",
    parcial: "Parcialmente",
    no_cumplio: "No",
};
const SI_NO_LABELS = { si: "Sí", no: "No" };

function normalizeStr(v) { return String(v ?? "").trim(); }
function normBusqueda(v) { return normalizeStr(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function toYMDLocal(d) { const dt = new Date(d); if (isNaN(dt.getTime())) return ""; const p = (n) => String(n).padStart(2, "0"); return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`; }
function ymdToInt(ymd) { if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null; return Number(ymd.replaceAll("-", "")); }
function dateTime(v) { if (!v) return "—"; const d = new Date(v); if (isNaN(d.getTime())) return "—"; return d.toLocaleString("es-MX", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }

function StarDisplay({ value }) {
    const n = Math.min(Math.max(parseInt(value) || 0, 0), 5);
    const color = n >= 4 ? "#10b981" : n === 3 ? "#f59e0b" : n > 0 ? "#ef4444" : "#d1d5db";
    return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold border"
            style={{ background: `${color}18`, borderColor: `${color}55`, color }}>
            {"★".repeat(n)}{"☆".repeat(5 - n)} {n}
        </span>
    );
}

function BadgeOpcion({ valor, labels }) {
    const texto = labels[valor] ?? valor ?? "—";
    const esPositivo = valor === "si" || valor === "cumplio" || valor === "si_realice";
    const esParcial = valor === "parcial" || valor === "incompleto" || valor === "no_claro" || valor === "no_auto";
    return (
        <span className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold border",
            esPositivo ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : esParcial ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-red-100 border-red-300 text-red-700"
        ].join(" ")}>
            {texto}
        </span>
    );
}

function SortBtn({ label, sortKey, sort, onClick }) {
    const active = sort.key === sortKey;
    return (
        <button type="button" onClick={() => onClick(sortKey)}
            className="inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap">
            {label}
            <span className="opacity-70">
                {active ? (sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
            </span>
        </button>
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 15 }).map((_, i) => (
                <td key={i} className="px-3 py-3">
                    <div className="h-4 rounded bg-slate-200/70 w-full max-w-[120px]" />
                </td>
            ))}
        </tr>
    );
}

export default function EncPiso() {
    const { user } = useAuth();
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sort, setSort] = useState({ key: "creado_en", dir: "desc" });
    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });

    const getToken = useCallback(() => {
        try {
            const a = localStorage.getItem("auth.access");
            if (a && a !== "undefined") return a;
            const raw = localStorage.getItem("auth");
            if (raw) { const p = JSON.parse(raw); return p?.token || p?.access || null; }
        } catch { return null; }
        return null;
    }, []);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = getToken();
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            const [resEncuestas, resTrafico] = await Promise.all([
                fetch(`${BASE_URL}/api/encuestas/piso/`, { headers, credentials: "include" }),
                fetch(`${BASE_URL}/trafico-piso/api/trafico-piso/?limit=1000`, { headers, credentials: "include" }),
            ]);

            if (!resEncuestas.ok) throw new Error(`Error ${resEncuestas.status}`);

            const dataEncuestas = await resEncuestas.json();
            const dataTrafico = resTrafico.ok ? await resTrafico.json() : [];

            const encuestas = Array.isArray(dataEncuestas) ? dataEncuestas : (dataEncuestas.results ?? []);
            const trafico = Array.isArray(dataTrafico) ? dataTrafico : (dataTrafico.results ?? []);

            const traficoMap = {};
            for (const t of trafico) {
                traficoMap[t.id_trafico] = t;
            }

            const enriquecidas = encuestas.map((enc) => {
                const t = enc.id_trafico ? traficoMap[enc.id_trafico] : null;
                return {
                    ...enc,
                    agencia: enc.agencia || t?.agencia || "—",
                    nombre_cliente: enc.nombre_cliente || t?.nombre_prospecto || "—",
                    asesor_atendio: enc.asesor_atendio || t?.asesor_ventas || "—",
                };
            });

            setRegistros(enriquecidas);
        } catch (e) {
            setError(e.message || "No se pudo cargar");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { cargar(); }, [cargar]);

    const dealers = useMemo(() => {
        const s = new Set(registros.map((r) => normalizeStr(r.agencia)).filter(Boolean));
        return ["Todos", ...Array.from(s).sort()];
    }, [registros]);

    const filtered = useMemo(() => {
        const q = normBusqueda(filters.q);
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);
        return registros.filter((r) => {
            if (filters.agencia !== "Todos" && normalizeStr(r.agencia) !== normalizeStr(filters.agencia)) return false;
            if (q) {
                const hay = [r.nombre_cliente, r.agencia, r.asesor_atendio, r.telefono, r.comentarios]
                    .map((v) => normBusqueda(v || "")).join(" ");
                if (!hay.includes(q)) return false;
            }
            if (desdeInt !== null || hastaInt !== null) {
                const ymd = toYMDLocal(r.creado_en);
                const n = ymdToInt(ymd);
                if (!n) return false;
                if (desdeInt !== null && n < desdeInt) return false;
                if (hastaInt !== null && n > hastaInt) return false;
            }
            return true;
        });
    }, [registros, filters]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        const m = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "creado_en") {
                return (new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime()) * m;
            }
            if (["atencion_llegada", "amenidades", "atencion_asesor", "experiencia"].includes(key)) {
                return ((Number(a[key]) || 0) - (Number(b[key]) || 0)) * m;
            }
            const va = normalizeStr(a[key] || "").toLowerCase();
            const vb = normalizeStr(b[key] || "").toLowerCase();
            return va < vb ? -m : va > vb ? m : 0;
        });
    }, [filtered, sort]);

    // KPIs
    const kpis = useMemo(() => {
        const total = sorted.length;
        if (!total) return null;
        const avg = (campo) => {
            const vals = sorted.map((r) => Number(r[campo]) || 0).filter((v) => v > 0);
            return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
        };
        return {
            total,
            atencion_llegada: avg("atencion_llegada"),
            amenidades: avg("amenidades"),
            atencion_asesor: avg("atencion_asesor"),
            experiencia: avg("experiencia"),
        };
    }, [sorted]);

    function toggleSort(key) {
        setSort((p) => p.key !== key ? { key, dir: "desc" } : { key, dir: p.dir === "asc" ? "desc" : "asc" });
    }

    function setHoy() {
        const hoy = toYMDLocal(new Date());
        setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy }));
    }

    function resetFilters() {
        setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    }

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-lg font-extrabold text-[#131E5C]">Registro de Encuestas de Piso</h2>
                    <p className="text-sm text-slate-400">Respuestas recibidas vía WhatsApp Flow — Tráfico de piso.</p>
                </div>
                <button onClick={cargar} disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-4 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white transition disabled:opacity-60">
                    <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
                    Recargar
                </button>
            </div>

            {/* KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: "Total respuestas", value: kpis.total, color: "text-[#131E5C]", bg: "bg-[#131E5C]/5" },
                        { label: "⭐ Atención al llegar", value: kpis.atencion_llegada, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "🏢 Instalaciones", value: kpis.amenidades, color: "text-blue-700", bg: "bg-blue-50" },
                        { label: "👤 Atención asesor", value: kpis.atencion_asesor, color: "text-emerald-700", bg: "bg-emerald-50" },
                        { label: "🌟 Experiencia general", value: kpis.experiencia, color: "text-violet-700", bg: "bg-violet-50" },
                    ].map((k) => (
                        <div key={k.label} className={`rounded-xl border border-black/10 ${k.bg} p-4`}>
                            <div className="text-xs font-bold text-slate-500 mb-1">{k.label}</div>
                            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filtros */}
            <div className="rounded-lg border border-black/10 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                            <Search className="h-4 w-4 text-[#131E5C] shrink-0" />
                            <input value={filters.q}
                                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                                placeholder="Buscar por cliente, asesor o comentario..."
                                className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]/60" />
                            {filters.q && <button onClick={() => setFilters((p) => ({ ...p, q: "" }))}><X className="h-4 w-4 text-slate-400 hover:text-red-500" /></button>}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <select value={filters.agencia}
                            onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))}
                            className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                            {dealers.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <input type="date" value={filters.rangoDesde}
                            onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))}
                            className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <input type="date" value={filters.rangoHasta}
                            onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))}
                            className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                        <button onClick={setHoy}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                            <CalendarDays className="h-3.5 w-3.5" /> Hoy
                        </button>
                        <button onClick={resetFilters}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-xs font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white">
                            <X className="h-3.5 w-3.5" /> Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

            {/* Tabla */}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm border border-black/10">
                <div className="overflow-x-auto">
                    <table className="min-w-[1600px] w-full text-left text-sm">
                        <thead className="bg-[#131E5C] text-xs text-white">
                            <tr>
                                <th className="px-3 py-3"><SortBtn label="Fecha" sortKey="creado_en" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3"><SortBtn label="Agencia" sortKey="agencia" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3"><SortBtn label="Cliente" sortKey="nombre_cliente" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3"><SortBtn label="Asesor" sortKey="asesor_atendio" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3 text-center"><SortBtn label="At. Llegada" sortKey="atencion_llegada" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3 text-center"><SortBtn label="Instalac." sortKey="amenidades" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3 text-center"><SortBtn label="At. Asesor" sortKey="atencion_asesor" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3 text-center"><SortBtn label="Experiencia" sortKey="experiencia" sort={sort} onClick={toggleSort} /></th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">💰 Financiamiento</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">🏬 Área correcta</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">🚗 Prueba manejo</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">✅ Expectativas</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">📞 Contacto post</th>
                                <th className="px-3 py-3 text-center whitespace-nowrap">⏱️ Menos 48hrs</th>
                                <th className="px-3 py-3">Comentarios</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10">
                            {loading
                                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                                : sorted.length === 0
                                    ? <tr><td colSpan={15} className="px-4 py-12 text-center text-slate-400 text-sm">No hay encuestas con esos filtros.</td></tr>
                                    : sorted.map((r) => (
                                        <tr key={r.id_encuesta} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{dateTime(r.creado_en)}</td>
                                            <td className="px-3 py-3">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#131E5C]/10 px-2 py-0.5 text-xs font-bold text-[#131E5C]">
                                                    <Building2 className="h-3 w-3" />{r.agencia || "—"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-extrabold text-[#131E5C] truncate max-w-[160px]">{r.nombre_cliente || "—"}</div>
                                                <div className="text-xs text-slate-400">
                                                    {r.telefono ? `52 ${r.telefono}` : ""}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-xs font-semibold text-slate-600 truncate max-w-[160px]">{r.asesor_atendio || "—"}</td>
                                            <td className="px-3 py-3 text-center"><StarDisplay value={r.atencion_llegada} /></td>
                                            <td className="px-3 py-3 text-center"><StarDisplay value={r.amenidades} /></td>
                                            <td className="px-3 py-3 text-center"><StarDisplay value={r.atencion_asesor} /></td>
                                            <td className="px-3 py-3 text-center"><StarDisplay value={r.experiencia} /></td>
                                            <td className="px-3 py-3 text-center"><BadgeOpcion valor={r.financiamiento} labels={FINANCIAMIENTO_LABELS} /></td>
                                            <td className="px-3 py-3 text-center"><BadgeOpcion valor={r.medio_contacto} labels={MEDIO_CONTACTO_LABELS} /></td>
                                            <td className="px-3 py-3 text-center"><BadgeOpcion valor={r.prueba_manejo} labels={PRUEBA_MANEJO_LABELS} /></td>
                                            <td className="px-3 py-3 text-center"><BadgeOpcion valor={r.recomendacion} labels={RECOMENDACION_LABELS} /></td>
                                            <td className="px-3 py-3 text-center"><BadgeOpcion valor={r.contacto_post} labels={SI_NO_LABELS} /></td>
                                            <td className="px-3 py-3 text-center"><BadgeOpcion valor={r.tiempo_contacto} labels={SI_NO_LABELS} /></td>

                                            <td className="px-3 py-3 text-xs text-slate-500 max-w-[200px]">
                                                {r.comentarios?.trim()
                                                    ? <span className="line-clamp-2">{r.comentarios}</span>
                                                    : <span className="italic text-slate-300">Sin comentarios</span>
                                                }
                                            </td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </table>
                </div>
                {!loading && sorted.length > 0 && (
                    <div className="border-t border-black/10 px-4 py-2 text-xs text-slate-400 text-right">
                        {sorted.length} registro{sorted.length !== 1 ? "s" : ""} encontrado{sorted.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>
        </div>
    );
}