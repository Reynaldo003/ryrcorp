// src/pages/Tableros/components/ModalCatalogo.jsx
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { FolderKanban, X, Search } from "lucide-react";
import { CATALOGO_CRM, COLOR_CONFIG } from "../config/catalogoModulos";

export default function ModalCatalogo({ abierto, onClose, onSelectSubmodulo }) {
    const [seccionFiltro, setSeccionFiltro] = useState("Todas");
    const [busqueda, setBusqueda] = useState("");

    const seccionesUnicas = useMemo(() => ["Todas", ...CATALOGO_CRM.map((c) => c.seccion)], []);

    const catalogoFiltrado = useMemo(() => {
        const q = busqueda.trim().toLowerCase();

        return CATALOGO_CRM
            .filter((grupo) => seccionFiltro === "Todas" || grupo.seccion === seccionFiltro)
            .map((grupo) => {
                if (!q) return grupo;

                const modulosCoincidentes = grupo.modulos
                    .map((mod) => {
                        const coincideModulo = mod.nombre.toLowerCase().includes(q);
                        const submodulosFiltrados = mod.submodulos.filter(
                            (s) => s.nombre.toLowerCase().includes(q) || coincideModulo
                        );

                        if (coincideModulo || submodulosFiltrados.length > 0) {
                            return {
                                ...mod,
                                submodulos: submodulosFiltrados.length > 0 ? submodulosFiltrados : mod.submodulos,
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);

                return { ...grupo, modulos: modulosCoincidentes };
            })
            .filter((grupo) => grupo.modulos.length > 0);
    }, [seccionFiltro, busqueda]);

    const modulosOrdenados = useMemo(() => {
        const prioridad = {
            gestion_negocio: 0,
            comercial: 1,
        };

        return catalogoFiltrado
            .flatMap((grupo) =>
                grupo.modulos.map((mod) => ({
                    ...mod,
                    seccion: grupo.seccion,
                }))
            )
            .sort((a, b) => {
                const prioridadA =
                    prioridad[a.id] ??
                    (a.disponible === false ? 100 : 10);

                const prioridadB =
                    prioridad[b.id] ??
                    (b.disponible === false ? 100 : 10);

                return prioridadA - prioridadB;
            });
    }, [catalogoFiltrado]);

    if (!abierto) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div
                className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
                style={{ height: "82vh", maxHeight: "82vh", minHeight: "360px" }}
            >
                {/* Cabecera */}
                <div className="flex items-center justify-between bg-[#001E50] px-5 py-4 text-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <FolderKanban className="h-5 w-5 text-white/90" />
                        <div>
                            <h3 className="text-sm font-black">Catálogo de Módulos del CRM</h3>
                            <p className="text-[11px] text-white/70">Selecciona el módulo y submódulo que deseas agregar al tablero</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Filtro y pestañas */}
                <div className="border-b border-slate-200 bg-slate-50 p-3.5 shrink-0 space-y-2.5">
                    <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-[#001E50] focus-within:ring-2 focus-within:ring-[#001E50]/10">
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por módulo o submódulo (ej. prospectos digitales, piso, expedientes)..."
                            className="h-full w-full text-xs font-bold text-slate-700 outline-none placeholder:text-slate-400"
                        />
                        {busqueda && (
                            <button type="button" onClick={() => setBusqueda("")} className="text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {seccionesUnicas.map((sec) => (
                            <button
                                key={sec}
                                type="button"
                                onClick={() => setSeccionFiltro(sec)}
                                className={`rounded-lg px-3 py-1 font-bold transition whitespace-nowrap cursor-pointer ${
                                    seccionFiltro === sec
                                        ? "bg-[#001E50] text-white shadow-sm"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                {sec}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de módulos */}
                <div
                    className="overflow-y-auto p-4 sm:p-5"
                    style={{ flex: "1 1 0%", minHeight: 0 }}
                >
                    {modulosOrdenados.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {modulosOrdenados.map((mod) => {
                                const Icon = mod.icon || FolderKanban;
                                const bloqueado = mod.disponible === false;
                                const cfg = COLOR_CONFIG[mod.color] || COLOR_CONFIG.blue;

                                return (
                                    <div
                                        key={mod.id}
                                        className={`rounded-xl border p-3 transition space-y-2 shadow-sm ${
                                            bloqueado
                                                ? "border-slate-200 bg-slate-50 opacity-70"
                                                : "border-slate-200 bg-white hover:shadow-md"
                                        }`}
                                        style={{
                                            borderColor: bloqueado
                                                ? undefined
                                                : `${cfg.headerBg}40`,
                                        }}
                                    >
                                        {/* Encabezado del módulo */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                    style={{
                                                        backgroundColor: `${cfg.headerBg}15`,
                                                        color: cfg.headerBg,
                                                    }}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0">
                                                    <span className="block truncate text-xs font-black text-slate-800">
                                                        {mod.nombre}
                                                    </span>

                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                        {mod.seccion}
                                                    </span>
                                                </div>
                                            </div>

                                            {bloqueado ? (
                                                <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500">
                                                    Próximamente
                                                </span>
                                            ) : (
                                                <span
                                                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase text-white"
                                                    style={{
                                                        backgroundColor: cfg.headerBg,
                                                    }}
                                                >
                                                    Disponible
                                                </span>
                                            )}
                                        </div>

                                        {/* Submódulos */}
                                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Submódulos:
                                            </span>

                                            <div className="space-y-1">
                                                {mod.submodulos.map((sub) => (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        disabled={bloqueado}
                                                        onClick={() => {
                                                            if (!bloqueado) {
                                                                onSelectSubmodulo(
                                                                    mod.id,
                                                                    sub.id
                                                                );
                                                            }
                                                        }}
                                                        className={`w-full rounded-lg px-2.5 py-1 text-left text-xs font-semibold transition flex items-center justify-between ${
                                                            bloqueado
                                                                ? "cursor-not-allowed text-slate-400"
                                                                : "cursor-pointer text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span className="truncate pr-2">
                                                            {sub.nombre}
                                                        </span>

                                                        <span
                                                            className="shrink-0 text-[10px] font-black"
                                                            style={{
                                                                color: bloqueado
                                                                    ? "#94A3B8"
                                                                    : cfg.accent,
                                                            }}
                                                        >
                                                            {bloqueado
                                                                ? "No disponible"
                                                                : "+ Añadir al Tablero"}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                            <Search className="mb-2 h-8 w-8 text-slate-300" />

                            <p className="text-xs font-bold text-slate-600">
                                No se encontraron módulos con ese filtro
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}