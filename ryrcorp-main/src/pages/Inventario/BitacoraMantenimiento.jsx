import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiBitacora } from "../../lib/apiBitacora";
import vwDark from "../../assets/vw_dark.png";

const NAVY = "#001E50";
const BRAND_BLUE = "#131E5C";

const ESTADO_META = {
    si: { label: "Sí", bg: "#dcfce7", color: "#16a34a" },
    no: { label: "No", bg: "#fee2e2", color: "#dc2626" },
    na: { label: "N/A", bg: "#f1f5f9", color: "#64748b" },
    null: { label: "—", bg: "#f1f5f9", color: "#94a3b8" },
};

function estadoMeta(valor) {
    return ESTADO_META[valor] ?? ESTADO_META.null;
}

function ResumenReactivos({ reactivos = [] }) {
    const conteo = useMemo(() => {
        const si = reactivos.filter((r) => r.estado === "si").length;
        const no = reactivos.filter((r) => r.estado === "no").length;
        const na = reactivos.filter((r) => r.estado === "na").length;
        return { si, no, na };
    }, [reactivos]);

    return (
        <div className="flex gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "#dcfce7", color: "#16a34a" }}>
                {conteo.si} Sí
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "#fee2e2", color: "#dc2626" }}>
                {conteo.no} No
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "#f1f5f9", color: "#64748b" }}>
                {conteo.na} N/A
            </span>
        </div>
    );
}

function ModalDetalle({ bitacora, onClose }) {
    if (!bitacora) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl mx-4"
                style={{ background: "#fff" }}>

                {/* Header modal */}
                <div className="sticky top-0 flex items-center justify-between px-5 py-4 rounded-t-2xl"
                    style={{ background: BRAND_BLUE }}>
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                            Bitácora de Mantenimiento
                        </div>
                        <div className="text-[17px] font-semibold text-white mt-0.5">
                            {bitacora.folio}
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20">
                        ✕
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Datos del vehículo */}
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 p-4 bg-slate-50">
                        {[
                            ["Folio", bitacora.folio],
                            ["Chasis / VIN", bitacora.chasis_vin],
                            ["Año / Modelo", bitacora.anio_modelo_color],
                            ["Responsable", bitacora.responsable],
                            ["Fecha ingreso", bitacora.fecha_ingreso ?? "—"],
                            ["Capturado en", new Date(bitacora.fecha_captura).toLocaleString("es-MX")],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                                <div className="text-[13px] font-medium text-slate-800 mt-0.5">{value || "—"}</div>
                            </div>
                        ))}
                    </div>

                    {/* Reactivos */}
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                            Puntos de inspección
                        </div>
                        <div className="flex flex-col gap-2">
                            {(bitacora.reactivos ?? []).map((r) => {
                                const meta = estadoMeta(r.estado);
                                return (
                                    <div key={r.id}
                                        className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                                            style={{ background: BRAND_BLUE + "12", color: BRAND_BLUE }}>
                                            {String(r.reactivo_id).padStart(2, "0")}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-semibold text-slate-800 leading-snug">{r.titulo}</div>
                                            {r.observaciones && (
                                                <div className="text-[11px] text-slate-500 mt-0.5">{r.observaciones}</div>
                                            )}
                                            {r.evidencias && r.evidencias.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {r.evidencias.map(function (ev) {
                                                        return (
                                                            <a key={ev.id} href={ev.archivo} target="_blank" rel="noopener noreferrer">
                                                                <img src={ev.archivo} alt="Evidencia" className="h-16 w-16 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition" />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                            style={{ background: meta.bg, color: meta.color }}>
                                            {meta.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BitacoraMantenimiento() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [detalle, setDetalle] = useState(null);

    useEffect(() => {
        apiBitacora.listar()
            .then(setRows)
            .catch(() => setError("No se pudieron cargar las bitácoras."))
            .finally(() => setLoading(false));
    }, []);

    const filtradas = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((b) =>
            [b.folio, b.chasis_vin, b.anio_modelo_color, b.responsable]
                .some((v) => (v ?? "").toLowerCase().includes(q))
        );
    }, [rows, query]);

    return (
        <div className="p-6 space-y-4 min-h-screen" style={{ background: "#F4F4F4" }}>

            {/* Header igual al de InventarioIndex */}
            <header className="sticky top-0 z-40 w-full border-b bg-white -mx-6 -mt-6 px-6"
                style={{ borderColor: `${BRAND_BLUE}22` }}>
                <div className="flex min-h-[76px] items-center gap-4">
                    <img src={vwDark} alt="Volkswagen"
                        className="h-16 w-16 object-contain md:h-20 md:w-20 shrink-0" loading="lazy" />

                    <div className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px] shrink-0"
                        style={{ color: BRAND_BLUE }}>
                        Bitácoras de Mantenimiento
                    </div>

                    <div className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                        style={{ background: BRAND_BLUE }} />

                    <div className="ml-auto flex items-center gap-2 py-2">
                        <button
                            onClick={() => navigate("/inventario")}
                            className="text-sm rounded-lg px-4 py-2 font-semibold border transition hover:brightness-110"
                            style={{ borderColor: `${BRAND_BLUE}44`, color: BRAND_BLUE, background: "#fff" }}
                        >
                            ← Inventario
                        </button>
                    </div>
                </div>
            </header>

            {/* Buscador */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
                <div className="relative max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por folio, VIN, modelo, responsable..."
                        className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-xl
                       text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:bg-white"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {error && (
                    <div className="px-5 py-4 text-sm text-red-500 bg-red-50 border-b border-red-100">{error}</div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ background: BRAND_BLUE }}>
                                {["Folio", "Chasis / VIN", "Año / Modelo / Color", "Responsable", "Fecha ingreso", "Capturado", "Resumen", ""].map((h) => (
                                    <th key={h}
                                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-white/90 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-3 w-24 rounded animate-pulse bg-slate-100" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtradas.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                                        {query ? "Sin resultados para la búsqueda." : "No hay bitácoras registradas."}
                                    </td>
                                </tr>
                            ) : (
                                filtradas.map((b, i) => (
                                    <tr key={b.id}
                                        onClick={() => setDetalle(b)}
                                        className="border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50"
                                        style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                        <td className="px-4 py-3 font-mono text-[12px] font-semibold whitespace-nowrap"
                                            style={{ color: NAVY }}>
                                            {b.folio}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-[12px] text-slate-600 whitespace-nowrap">
                                            {b.chasis_vin || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">
                                            {b.anio_modelo_color || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap">
                                            {b.responsable || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                                            {b.fecha_ingreso ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                                            {new Date(b.fecha_captura).toLocaleString("es-MX")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ResumenReactivos reactivos={b.reactivos ?? []} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
                                                style={{ background: BRAND_BLUE + "12", color: BRAND_BLUE }}>
                                                Ver detalle
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filtradas.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                        {filtradas.length} bitácora{filtradas.length !== 1 ? "s" : ""} encontrada{filtradas.length !== 1 ? "s" : ""}
                    </div>
                )}
            </div>

            {detalle && <ModalDetalle bitacora={detalle} onClose={() => setDetalle(null)} />}
        </div>
    );
}