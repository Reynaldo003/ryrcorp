import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Activity,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FilterX,
    History,
    Loader2,
    Radio,
    RefreshCw,
    Search,
    UserRound,
    WifiOff,
} from "lucide-react";
import { apiLogs } from "../../lib/apiLogs";

const ESTILO_TIPO = {
    CREAR: "bg-emerald-100 text-emerald-800",
    EDITAR: "bg-amber-100 text-amber-800",
    ELIMINAR: "bg-red-100 text-red-800",
    LOGIN: "bg-blue-100 text-blue-800",
    LOGIN_FALLIDO: "bg-rose-100 text-rose-800",
};

const ETIQUETA_TIPO = {
    CREAR: "Creación",
    EDITAR: "Edición",
    ELIMINAR: "Eliminación",
    LOGIN: "Inicio de sesión",
    LOGIN_FALLIDO: "Intento fallido",
};

function formatearFecha(valor) {
    if (!valor) return "—";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor);
    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(fecha);
}

function formatearHora(valor) {
    if (!valor) return "";
    return new Intl.DateTimeFormat("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(valor);
}

function Card({ titulo, valor, sub }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</div>
            <div className="mt-1 text-2xl font-extrabold text-[#131E5C]">{valor}</div>
            {sub ? <div className="mt-0.5 text-xs text-slate-500">{sub}</div> : null}
        </div>
    );
}

export default function LogsUsuario() {
    const [logs, setLogs] = useState([]);
    const [catalogo, setCatalogo] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const [filtrosUsuario, setFiltrosUsuario] = useState("");
    const [filtroModulo, setFiltroModulo] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroDesde, setFiltroDesde] = useState("");
    const [filtroHasta, setFiltroHasta] = useState("");
    const [filtroBuscar, setFiltroBuscar] = useState("");

    const [pagina, setPagina] = useState(1);
    const [paginacion, setPaginacion] = useState(null);

    const [vivo, setVivo] = useState(true);
    const [ultimaSincronizacion, setUltimaSincronizacion] = useState(null);
    const [filaExpandida, setFilaExpandida] = useState(null);
    const ultimoIdRef = useRef(0);
    const colaRef = useRef(-1);

    const cargarLogs = useCallback(
        async (paginaTarget = 1, opciones = {}) => {
            const { silencioso = false } = opciones;
            if (!silencioso) {
                setCargando(true);
                setError("");
            }
            try {
                const params = {
                    page: paginaTarget,
                    page_size: 25,
                    usuario_id: filtrosUsuario || "",
                    modulo: filtroModulo || "",
                    tipo: filtroTipo || "",
                    desde: filtroDesde || "",
                    hasta: filtroHasta || "",
                    buscar: filtroBuscar || "",
                };
                const data = await apiLogs.listar(params);
                setLogs(data.results || []);
                setPaginacion({
                    count: data.count ?? 0,
                    next: Boolean(data.next),
                    previous: Boolean(data.previous),
                });
                setPagina(paginaTarget);
            } catch (e) {
                if (!silencioso) setError(e.message || "No se pudieron cargar los logs.");
            } finally {
                if (!silencioso) setCargando(false);
            }
        },
        [filtrosUsuario, filtroModulo, filtroTipo, filtroDesde, filtroHasta, filtroBuscar],
    );

    const sincronizarRefs = useCallback(async () => {
        try {
            const estado = await apiLogs.estado();
            ultimoIdRef.current = estado.ultimo_id || 0;
            colaRef.current = estado.cola ?? -1;
            setUltimaSincronizacion(new Date());
            return estado;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const inicial = async () => {
            try {
                const cat = await apiLogs.catalogo();
                setCatalogo(cat);
            } catch (e) {
                setError(e.message || "No se pudo cargar el catálogo.");
            }
            try {
                setResumen(await apiLogs.resumen());
            } catch (e) {
                console.warn("No se pudo cargar el resumen:", e.message);
            }
            await sincronizarRefs();
            cargarLogs(1);
        };
        inicial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const aplicarFiltros = () => {
        cargarLogs(1);
        recargarResumen();
    };

    const limpiarFiltros = () => {
        setFiltrosUsuario("");
        setFiltroModulo("");
        setFiltroTipo("");
        setFiltroDesde("");
        setFiltroHasta("");
        setFiltroBuscar("");
        cargarLogs(1);
    };

    const recargarResumen = useCallback(async () => {
        try {
            setResumen(await apiLogs.resumen());
        } catch {
            console.warn("No se pudo cargar el resumen.");
        }
    }, []);

    useEffect(() => {
        if (!vivo) return undefined;

        const timer = setInterval(async () => {
            try {
                const estado = await apiLogs.estado();
                const huboNuevos = estado.ultimo_id !== ultimoIdRef.current;
                const cambioCola = estado.cola !== colaRef.current;

                if (huboNuevos) {
                    ultimoIdRef.current = estado.ultimo_id;
                    cargarLogs(pagina, { silencioso: true });
                }
                if (huboNuevos || cambioCola) {
                    colaRef.current = estado.cola;
                    recargarResumen();
                    setUltimaSincronizacion(new Date());
                }
            } catch {
                // Silencioso: la actualización manual sigue disponible.
            }
        }, 5000);

        return () => clearInterval(timer);
    }, [vivo, cargarLogs, pagina, recargarResumen]);

    const metadata = useMemo(() => {
        if (!catalogo || !resumen) return { totalDia: "—" };
        const hoy = new Date().toISOString().slice(0, 10);
        const totalDia = (resumen.por_dia || []).find((d) => d.fecha === hoy)?.total ?? 0;
        return {
            total7d: resumen.total ?? 0,
            totalDia,
            topUsuario: (resumen.por_usuario || [])[0]?.nombre || "—",
            moduloTop: (resumen.por_modulo || [])[0]?.label || "—",
        };
    }, [catalogo, resumen]);

    const inputClase =
        "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/20";

    const nroInicio = paginacion && paginacion.count > 0 ? (pagina - 1) * 25 + 1 : 0;
    const nroFin = paginacion ? Math.min(pagina * 25, paginacion.count) : 0;

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#131E5C]">
                        <History className="h-6 w-6" /> Logs por Usuario
                    </h1>
                    <p className="text-sm text-slate-500">
                        Actividad, modificaciones y accesos registrados por cada usuario.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                            vivo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-black/15 bg-white text-slate-500"
                        }`}
                        title={vivo ? "La lista se actualiza sola cada 5 s" : "Actualización automática detenida"}
                    >
                        <span className={`h-2.5 w-2.5 rounded-full ${vivo ? "animate-pulse bg-emerald-500" : "bg-slate-300"}`} />
                        {vivo ? "En vivo" : "En pausa"}
                        {ultimaSincronizacion ? (
                            <span className="text-xs text-slate-400">· {formatearHora(ultimaSincronizacion)}</span>
                        ) : null}
                    </div>
                    <button
                        onClick={() => {
                            const nuevo = !vivo;
                            setVivo(nuevo);
                            if (nuevo) {
                                sincronizarRefs();
                                recargarResumen();
                                cargarLogs(pagina);
                            }
                        }}
                        className="flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-[#131E5C] transition hover:bg-slate-100"
                    >
                        {vivo ? <WifiOff className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
                        {vivo ? "Pausar en vivo" : "Reactivar en vivo"}
                    </button>
                    <button
                        onClick={async () => {
                            await sincronizarRefs();
                            recargarResumen();
                            cargarLogs(pagina);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b2a75]"
                    >
                        <RefreshCw className="h-4 w-4" /> Refrescar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card titulo="Eventos (7 días)" valor={metadata.total7d} />
                <Card titulo="Hoy" valor={metadata.totalDia} />
                <Card titulo="Usuario más activo" valor={metadata.topUsuario} />
                <Card titulo="Módulo más usado" valor={metadata.moduloTop} />
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                    <Activity className="h-4 w-4" /> Filtros
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
                    <label className="col-span-2 lg:col-span-1">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Usuario</span>
                        <select className={inputClase} value={filtrosUsuario} onChange={(e) => setFiltrosUsuario(e.target.value)}>
                            <option value="">Todos</option>
                            {(catalogo?.usuarios || []).map((u) => (
                                <option key={u.id_usuario} value={u.id_usuario}>
                                    {u.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="col-span-2 lg:col-span-1">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Módulo</span>
                        <select className={inputClase} value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value)}>
                            <option value="">Todos</option>
                            {(catalogo?.modulos || []).map((m) => (
                                <option key={m.key} value={m.key}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="col-span-2 lg:col-span-1">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Tipo</span>
                        <select className={inputClase} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                            <option value="">Todos</option>
                            {(catalogo?.tipos || []).map((t) => (
                                <option key={t.key} value={t.key}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="col-span-1">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Desde</span>
                        <input type="date" className={inputClase} value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
                    </label>
                    <label className="col-span-1">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Hasta</span>
                        <input type="date" className={inputClase} value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
                    </label>
                    <label className="col-span-2 lg:col-span-1">
                        <span className="mb-1 block text-xs font-semibold text-slate-500">Buscar</span>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className={inputClase + " pl-8"}
                                placeholder="Entidad, cambio..."
                                value={filtroBuscar}
                                onChange={(e) => setFiltroBuscar(e.target.value)}
                            />
                        </div>
                    </label>
                    <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
                        <button
                            onClick={aplicarFiltros}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1b2a75]"
                        >
                            <Search className="h-4 w-4" /> Aplicar
                        </button>
                        <button
                            onClick={limpiarFiltros}
                            title="Limpiar filtros"
                            className="flex items-center justify-center rounded-lg border border-black/15 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                        >
                            <FilterX className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
                        <div className="text-sm font-bold text-[#131E5C]">
                            {paginacion ? `${nroInicio}–${nroFin} de ${paginacion.count}` : "Registros"}
                        </div>
                        <div className="text-sm text-slate-500">
                            {cargando ? "Consultando..." : `${logs.length} registros en esta página`}
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-black/10 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                {["Fecha / Hora", "Usuario", "Tipo", "Módulo", "Entidad", "Acción"].map((titulo) => (
                                    <th key={titulo} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                        {titulo}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {logs.map((log) => (
                                <Fragment key={log.id}>
                                    <tr
                                        className={`cursor-pointer transition ${filaExpandida === log.id ? "bg-slate-100/80" : "hover:bg-slate-50"}`}
                                        onClick={() => setFilaExpandida(filaExpandida === log.id ? null : log.id)}
                                    >
                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-700">
                                            {formatearFecha(log.fecha)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-800">
                                            <span className="flex items-center gap-1.5">
                                                <UserRound className="h-3.5 w-3.5 text-slate-400" />
                                                {log.usuario_nombre}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2.5">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_TIPO[log.tipo] || "bg-slate-100 text-slate-700"}`}>
                                                {ETIQUETA_TIPO[log.tipo] || log.tipo}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{log.modulo_etiqueta}</td>
                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-700">{log.entidad || "—"}</td>
                                        <td className="max-w-[340px] px-4 py-2.5 text-slate-600">
                                            <span className="flex items-start gap-1">
                                                <span className="line-clamp-1">{log.cambio}</span>
                                                <ChevronDown
                                                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                                                        filaExpandida === log.id ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </span>
                                        </td>
                                    </tr>
                                    {filaExpandida === log.id ? (
                                        <tr className="bg-slate-50/80">
                                            <td colSpan={6} className="border-t border-black/5 px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Acción completa
                                                </div>
                                                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{log.cambio}</p>
                                            </td>
                                        </tr>
                                    ) : null}
                                </Fragment>
                            ))}
                            {!cargando && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        No hay registros que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : null}
                            {cargando && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#131E5C]" />
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-black/10 px-4 py-3">
                    <button
                        onClick={() => paginacion?.previous && cargarLogs(pagina - 1)}
                        disabled={!paginacion?.previous}
                        className="flex items-center gap-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-slate-700 transition enabled:hover:bg-slate-100 disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </button>
                    <span className="text-sm text-slate-500">Página {pagina}</span>
                    <button
                        onClick={() => paginacion?.next && cargarLogs(pagina + 1)}
                        disabled={!paginacion?.next}
                        className="flex items-center gap-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-slate-700 transition enabled:hover:bg-slate-100 disabled:opacity-40"
                    >
                        Siguiente <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}