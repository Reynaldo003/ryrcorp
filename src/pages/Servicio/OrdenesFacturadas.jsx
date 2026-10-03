import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    Database,
    FileText,
    LoaderCircle,
    PackageSearch,
    RefreshCw,
    Search,
    Store,
    Wrench,
    X,
} from "lucide-react";

import {
    getOrdenesFacturadas,
    getOrdenesFacturadasOpciones,
} from "../../lib/apiOrdenesFacturadas";


// ============================================================
// HELPERS
// ============================================================

function numero(value) {
    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
}


function formatoNumero(value) {
    return numero(value).toLocaleString(
        "es-MX",
        {
            maximumFractionDigits: 2,
        }
    );
}


function money(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return value;
    }

    return new Intl.NumberFormat(
        "es-MX",
        {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(n);
}


function formatoFecha(value) {
    if (!value) {
        return "—";
    }

    const raw = String(value).trim();

    const match = raw.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
    }

    return raw;
}


function formatoFechaHora(value) {
    if (!value) {
        return "—";
    }

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
        return formatoFecha(value);
    }

    return fecha.toLocaleString(
        "es-MX",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}


function claveOrden(orden) {
    return `${orden.agencia || ""}|${orden.nros || ""}`;
}


// ============================================================
// AGRUPAR FILAS DEL BACKEND POR ORDEN DE SERVICIO
// ============================================================

function agruparOrdenes(rows = []) {
    const mapa = new Map();

    rows.forEach((row, index) => {
        const clave = claveOrden(row);

        if (!mapa.has(clave)) {
            mapa.set(
                clave,
                {
                    clave,

                    agencia: row.agencia,
                    nros: row.nros,

                    dtemissao: row.dtemissao,
                    funcresp: row.funcresp,

                    vradicionais: row.vradicionais,
                    vrdescpeca: row.vrdescpeca,
                    vrtotalpecas: row.vrtotalpecas,

                    tpos: row.tpos,

                    dtfechamento: row.dtfechamento,
                    dtabertura: row.dtabertura,

                    situacao: row.situacao,

                    codcondpgto: row.codcondpgto,
                    codoperfiscal: row.codoperfiscal,

                    sitgarantia: row.sitgarantia,
                    subtipoos: row.subtipoos,

                    piezas: [],
                }
            );
        }

        const orden = mapa.get(clave);

        orden.piezas.push({
            id: `${clave}|${row.nrreq || ""}|${row.codprod || ""}|${index}`,

            nrreq: row.nrreq,

            dtemissao: row.dtemissao,
            funcresp: row.funcresp,

            qtdeitens: row.qtdeitens,
            qtdeatend: row.qtdeatend,

            codprod: row.codprod,
            nmproduto: row.nmproduto,

            precounit: row.precounit,
            percdesc: row.percdesc,
            vrdesc: row.vrdesc,
            vrprod: row.vrprod,
        });
    });

    return Array
        .from(mapa.values())
        .map((orden) => {
            const requisiciones = new Set(
                orden.piezas
                    .map((pieza) => pieza.nrreq)
                    .filter(
                        (value) =>
                            value !== null &&
                            value !== undefined
                    )
            );

            const valorProductos = orden.piezas.reduce(
                (total, pieza) =>
                    total + numero(pieza.vrprod),
                0
            );

            const totalDescuentos = orden.piezas.reduce(
                (total, pieza) =>
                    total + numero(pieza.vrdesc),
                0
            );

            return {
                ...orden,

                requisiciones: requisiciones.size,
                partidas: orden.piezas.length,

                valorProductos,
                totalDescuentos,
            };
        });
}


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function OrdenesFacturadas() {
    const [datos, setDatos] = useState([]);

    const [totalRegistros, setTotalRegistros] = useState(0);

    const [metricas, setMetricas] = useState({
        registros: 0,
        valor_productos: 0,
    });

    const [opciones, setOpciones] = useState({
        agencias: [],
    });

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // ==========================================================
    // FILTROS
    // ==========================================================

    const [agencia, setAgencia] = useState("");

    const [fechaDesde, setFechaDesde] = useState("");

    const [fechaHasta, setFechaHasta] = useState("");

    const [qBuscado, setQBuscado] = useState("");

    const [qDebounce, setQDebounce] = useState("");

    // ==========================================================
    // PAGINACIÓN
    // ==========================================================

    const [pagina, setPagina] = useState(1);

    const [pageSize, setPageSize] = useState(50);

    // ==========================================================
    // ORDEN ABIERTA
    // ==========================================================

    const [ordenAbierta, setOrdenAbierta] = useState(null);


    // ==========================================================
    // DEBOUNCE BUSCADOR
    // ==========================================================

    useEffect(() => {
        const timeout = setTimeout(
            () => {
                setQDebounce(qBuscado);
            },
            400
        );

        return () => {
            clearTimeout(timeout);
        };
    }, [qBuscado]);


    // ==========================================================
    // CARGAR AGENCIAS
    // ==========================================================

    useEffect(() => {
        getOrdenesFacturadasOpciones()
            .then((response) => {
                setOpciones({
                    agencias: Array.isArray(
                        response?.agencias
                    )
                        ? response.agencias
                        : [],
                });
            })
            .catch((err) => {
                console.error(
                    "Error cargando agencias:",
                    err
                );
            });
    }, []);


    // ==========================================================
    // PARÁMETROS
    //
    // Si el filtro está vacío mandamos undefined.
    // buildQuery() ya se encarga de no enviarlo.
    // ==========================================================

    const parametros = useMemo(
        () => ({
            agencia:
                agencia ||
                undefined,

            fecha_desde:
                fechaDesde ||
                undefined,

            fecha_hasta:
                fechaHasta ||
                undefined,

            q:
                qDebounce ||
                undefined,
        }),
        [
            agencia,
            fechaDesde,
            fechaHasta,
            qDebounce,
        ]
    );


    // ==========================================================
    // CONSULTA
    // ==========================================================

    const consultar = useCallback(
        async () => {
            setLoading(true);

            setError("");

            try {
                const response =
                    await getOrdenesFacturadas({
                        ...parametros,

                        page: pagina,

                        page_size: pageSize,
                    });

                setDatos(
                    Array.isArray(
                        response?.results
                    )
                        ? response.results
                        : []
                );

                setTotalRegistros(
                    Number(
                        response?.count ||
                        0
                    )
                );

                setMetricas({
                    registros: Number(
                        response?.metricas?.registros ||
                        0
                    ),

                    valor_productos: Number(
                        response?.metricas?.valor_productos ||
                        0
                    ),
                });

                setOrdenAbierta(null);
            } catch (err) {
                console.error(
                    "Error cargando órdenes facturadas:",
                    err
                );

                setDatos([]);

                setTotalRegistros(0);

                setMetricas({
                    registros: 0,
                    valor_productos: 0,
                });

                setError(
                    err?.message ||
                    "No fue posible cargar las órdenes facturadas."
                );
            } finally {
                setLoading(false);
            }
        },
        [
            parametros,
            pagina,
            pageSize,
        ]
    );


    useEffect(() => {
        consultar();
    }, [consultar]);


    // ==========================================================
    // AGRUPAMIENTO POR OS
    // ==========================================================

    const ordenes = useMemo(
        () => agruparOrdenes(datos),
        [datos]
    );


    // ==========================================================
    // MÉTRICAS DE LA PÁGINA
    // ==========================================================

    const resumenPagina = useMemo(
        () => {
            const requisiciones =
                new Set();

            ordenes.forEach((orden) => {
                orden.piezas.forEach(
                    (pieza) => {
                        requisiciones.add(
                            `${orden.agencia}|${orden.nros}|${pieza.nrreq}`
                        );
                    }
                );
            });

            return {
                ordenes:
                    ordenes.length,

                requisiciones:
                    requisiciones.size,
            };
        },
        [ordenes]
    );


    // ==========================================================
    // PAGINACIÓN
    // ==========================================================

    const totalPaginas = useMemo(
        () =>
            Math.max(
                1,
                Math.ceil(
                    totalRegistros /
                    pageSize
                )
            ),
        [
            totalRegistros,
            pageSize,
        ]
    );


    // ==========================================================
    // FILTROS
    // ==========================================================

    function cambiarAgencia(value) {
        setAgencia(value);

        setPagina(1);
    }


    function limpiarFiltros() {
        setAgencia("");

        setFechaDesde("");

        setFechaHasta("");

        setQBuscado("");

        setPagina(1);
    }


    // ==========================================================
    // EXPANDIR ORDEN
    // ==========================================================

    function desplegarOrden(orden) {
        const clave =
            claveOrden(orden);

        setOrdenAbierta(
            (actual) =>
                actual === clave
                    ? null
                    : clave
        );
    }


    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div className="min-h-screen">
            <main className="space-y-5 py-4">

                {/* ==================================================
            ENCABEZADO
        ================================================== */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-[#131E5C]">
                            Órdenes Facturadas
                        </h1>

                        <p className="text-xs font-medium text-[#8891AD]">
                            Desglose de refacciones facturadas en órdenes de servicio
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={consultar}
                        disabled={loading}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                    >
                        {loading ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}

                        Actualizar
                    </button>
                </div>


                {/* ==================================================
            KPIS
        ================================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <KPICard
                        icon={CircleDollarSign}
                        label="Valor productos"
                        value={
                            loading
                                ? "—"
                                : money(
                                    metricas.valor_productos
                                )
                        }
                        sub="Importe filtrado"
                        accent="#0EA5E9"
                    />

                    <KPICard
                        icon={Database}
                        label="Partidas"
                        value={
                            loading
                                ? "—"
                                : formatoNumero(
                                    metricas.registros
                                )
                        }
                        sub="Partidas encontradas"
                        accent="#131E5C"
                    />

                    <KPICard
                        icon={Wrench}
                        label="Órdenes"
                        value={
                            loading
                                ? "—"
                                : formatoNumero(
                                    resumenPagina.ordenes
                                )
                        }
                        sub="OS visibles en la página"
                        accent="#10B981"
                    />

                    <KPICard
                        icon={ClipboardList}
                        label="Requisiciones"
                        value={
                            loading
                                ? "—"
                                : formatoNumero(
                                    resumenPagina.requisiciones
                                )
                        }
                        sub="Requisiciones visibles"
                        accent="#F59E0B"
                    />

                </div>


                {/* ==================================================
            FILTROS
        ================================================== */}

                <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">

                    {/* FECHAS */}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                        <div>
                            <label className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                                <CalendarDays className="h-4 w-4" />

                                Fecha cierre desde
                            </label>

                            <input
                                type="date"
                                value={fechaDesde}
                                max={
                                    fechaHasta ||
                                    undefined
                                }
                                onChange={(e) => {
                                    setFechaDesde(
                                        e.target.value
                                    );

                                    setPagina(1);
                                }}
                                className="h-11 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-semibold text-[#07184C] outline-none transition focus:border-[#1555C7]"
                            />
                        </div>


                        <div>
                            <label className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                                <CalendarDays className="h-4 w-4" />

                                Fecha cierre hasta
                            </label>

                            <input
                                type="date"
                                value={fechaHasta}
                                min={
                                    fechaDesde ||
                                    undefined
                                }
                                onChange={(e) => {
                                    setFechaHasta(
                                        e.target.value
                                    );

                                    setPagina(1);
                                }}
                                className="h-11 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-semibold text-[#07184C] outline-none transition focus:border-[#1555C7]"
                            />
                        </div>

                    </div>


                    {/* AGENCIA */}

                    <div className="mt-5 border-t border-[#E6EAF1] pt-4">

                        <div className="mb-3 flex items-center gap-2">
                            <Store className="h-4 w-4 text-[#131E5C]" />

                            <span className="text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                                Agencia
                            </span>
                        </div>


                        <div className="flex flex-wrap gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    cambiarAgencia("")
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${!agencia
                                        ? "bg-[#131E5C] text-white"
                                        : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"
                                    }`}
                            >
                                Todas
                            </button>


                            {opciones.agencias.map(
                                (item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() =>
                                            cambiarAgencia(
                                                item
                                            )
                                        }
                                        className={`rounded-lg border border-[#131E5C] px-4 py-2 text-sm font-bold transition ${agencia === item
                                                ? "bg-[#131E5C] text-white"
                                                : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                                            }`}
                                    >
                                        {item}
                                    </button>
                                )
                            )}

                        </div>
                    </div>


                    {/* BUSCADOR */}

                    <div className="mt-5 border-t border-[#E6EAF1] pt-4">

                        <div className="relative">

                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                                Buscar
                            </label>

                            <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />

                            <input
                                type="text"
                                value={qBuscado}
                                onChange={(e) => {
                                    setQBuscado(
                                        e.target.value
                                    );

                                    setPagina(1);
                                }}
                                placeholder="OS, requisición, producto, responsable, agencia..."
                                className="h-11 w-full rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10"
                            />

                            {qBuscado && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQBuscado("");

                                        setPagina(1);
                                    }}
                                    className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}

                        </div>


                        {(agencia ||
                            fechaDesde ||
                            fechaHasta ||
                            qBuscado) && (

                                <div className="mt-3 flex justify-end">

                                    <button
                                        type="button"
                                        onClick={limpiarFiltros}
                                        className="text-xs font-bold text-[#8891AD] transition hover:text-[#131E5C]"
                                    >
                                        Limpiar filtros
                                    </button>

                                </div>
                            )}

                    </div>

                </section>


                {/* ==================================================
            ERROR
        ================================================== */}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}


                {/* ==================================================
            TABLA
        ================================================== */}

                <TablaOrdenes
                    rows={ordenes}
                    loading={loading}
                    ordenAbierta={ordenAbierta}
                    onToggle={desplegarOrden}
                />


                {/* ==================================================
            PAGINACIÓN
        ================================================== */}

                <Paginacion
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    total={totalRegistros}
                    pageSize={pageSize}
                    onPageSizeChange={(value) => {
                        setPageSize(value);

                        setPagina(1);
                    }}
                    onPrev={() =>
                        setPagina(
                            (prev) =>
                                Math.max(
                                    1,
                                    prev - 1
                                )
                        )
                    }
                    onNext={() =>
                        setPagina(
                            (prev) =>
                                Math.min(
                                    totalPaginas,
                                    prev + 1
                                )
                        )
                    }
                />

            </main>
        </div>
    );
}


// ============================================================
// TABLA PRINCIPAL
// ============================================================

function TablaOrdenes({
    rows,
    loading,
    ordenAbierta,
    onToggle,
}) {
    if (loading) {
        return (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#C8D0DF] bg-white">
                <LoaderCircle className="h-7 w-7 animate-spin text-[#131E5C]" />
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="rounded-xl border border-[#C8D0DF] bg-white px-4 py-12 text-center text-sm font-semibold text-slate-400">
                No se encontraron órdenes facturadas.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-[#C8D0DF] bg-white shadow-sm">

            <div className="overflow-x-auto">

                <table className="w-full min-w-[1250px] border-collapse text-sm">

                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[#131E5C] text-white">

                            <th className="w-12 px-3 py-3" />

                            <th className="px-3 py-3 text-left">
                                Agencia
                            </th>

                            <th className="px-3 py-3 text-right">
                                OS
                            </th>

                            <th className="px-3 py-3 text-center">
                                Cierre
                            </th>

                            <th className="px-3 py-3 text-left">
                                Responsable
                            </th>

                            <th className="px-3 py-3 text-center">
                                Tipo
                            </th>

                            <th className="px-3 py-3 text-center">
                                Situación
                            </th>

                            <th className="px-3 py-3 text-right">
                                Reqs.
                            </th>

                            <th className="px-3 py-3 text-right">
                                Partidas
                            </th>

                            <th className="px-3 py-3 text-right">
                                Productos
                            </th>

                            <th className="px-3 py-3 text-right">
                                Total piezas OS
                            </th>

                        </tr>
                    </thead>


                    <tbody>

                        {rows.map(
                            (orden) => {
                                const clave =
                                    claveOrden(orden);

                                const abierta =
                                    ordenAbierta ===
                                    clave;

                                return (
                                    <Fragment key={clave}>

                                        {/* =========================================
                        FILA PRINCIPAL
                    ========================================= */}

                                        <tr
                                            className={`border-b border-[#E6EAF1] transition ${abierta
                                                    ? "bg-[#F1F4FA]"
                                                    : "hover:bg-[#F7F8FC]"
                                                }`}
                                        >

                                            <td className="px-3 py-3 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onToggle(
                                                            orden
                                                        )
                                                    }
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#131E5C] transition hover:bg-[#131E5C]/10"
                                                    title="Ver desglose"
                                                >
                                                    {abierta ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </button>

                                            </td>


                                            <td className="px-3 py-3 font-bold text-[#152754]">
                                                {orden.agencia ||
                                                    "—"}
                                            </td>


                                            <td className="px-3 py-3 text-right font-black tabular-nums text-[#131E5C]">
                                                {orden.nros ??
                                                    "—"}
                                            </td>


                                            <td className="px-3 py-3 text-center">
                                                {formatoFecha(
                                                    orden.dtfechamento
                                                )}
                                            </td>


                                            <td
                                                className="max-w-[220px] truncate px-3 py-3"
                                                title={
                                                    orden.funcresp ||
                                                    ""
                                                }
                                            >
                                                {orden.funcresp ||
                                                    "—"}
                                            </td>


                                            <td className="px-3 py-3 text-center">
                                                <TipoBadge
                                                    value={
                                                        orden.tpos
                                                    }
                                                />
                                            </td>


                                            <td className="px-3 py-3 text-center">
                                                <SituacionBadge
                                                    value={
                                                        orden.situacao
                                                    }
                                                />
                                            </td>


                                            <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                {formatoNumero(
                                                    orden.requisiciones
                                                )}
                                            </td>


                                            <td className="px-3 py-3 text-right font-semibold tabular-nums">
                                                {formatoNumero(
                                                    orden.partidas
                                                )}
                                            </td>


                                            <td className="px-3 py-3 text-right font-bold tabular-nums">
                                                {money(
                                                    orden.valorProductos
                                                )}
                                            </td>


                                            <td className="px-3 py-3 text-right font-black tabular-nums text-[#131E5C]">
                                                {money(
                                                    orden.vrtotalpecas
                                                )}
                                            </td>

                                        </tr>


                                        {/* =========================================
                        DESGLOSE
                    ========================================= */}

                                        {abierta && (

                                            <tr>

                                                <td
                                                    colSpan={11}
                                                    className="bg-[#F7F8FC] p-0"
                                                >

                                                    <DetalleOrden
                                                        orden={
                                                            orden
                                                        }
                                                    />

                                                </td>

                                            </tr>

                                        )}

                                    </Fragment>
                                );
                            }
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}


// ============================================================
// DETALLE DE OS
// ============================================================

function DetalleOrden({
    orden,
}) {
    const piezas =
        orden.piezas ||
        [];

    const totalVrProd =
        piezas.reduce(
            (total, pieza) =>
                total +
                numero(
                    pieza.vrprod
                ),
            0
        );

    const totalDescuento =
        piezas.reduce(
            (total, pieza) =>
                total +
                numero(
                    pieza.vrdesc
                ),
            0
        );

    return (
        <div className="border-b border-[#C8D0DF] px-5 py-5">

            {/* ====================================================
          ENCABEZADO DETALLE
      ==================================================== */}

            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-3">

                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C] text-white">

                        <Wrench className="h-5 w-5" />

                    </span>


                    <div>

                        <div className="text-base font-extrabold text-[#131E5C]">
                            Orden de servicio{" "}
                            {orden.nros}
                        </div>

                        <div className="text-xs font-semibold text-[#8891AD]">
                            {orden.agencia}
                        </div>

                    </div>

                </div>


                <div className="flex flex-wrap gap-2">

                    <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                        {orden.requisiciones} requisiciones
                    </span>

                    <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                        {orden.partidas} partidas
                    </span>

                </div>

            </div>


            {/* ====================================================
          INFORMACIÓN GENERAL
      ==================================================== */}

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">

                <DetalleBadge
                    label="Apertura"
                    value={
                        formatoFechaHora(
                            orden.dtabertura
                        )
                    }
                />

                <DetalleBadge
                    label="Cierre"
                    value={
                        formatoFechaHora(
                            orden.dtfechamento
                        )
                    }
                />

                <DetalleBadge
                    label="Tipo OS"
                    value={
                        orden.tpos ||
                        "—"
                    }
                />

                <DetalleBadge
                    label="Subtipo"
                    value={
                        orden.subtipoos ||
                        "—"
                    }
                />

                <DetalleBadge
                    label="Condición pago"
                    value={
                        orden.codcondpgto ||
                        "—"
                    }
                />

                <DetalleBadge
                    label="Operación fiscal"
                    value={
                        orden.codoperfiscal ||
                        "—"
                    }
                />

                <DetalleBadge
                    label="Garantía"
                    value={
                        orden.sitgarantia ||
                        "—"
                    }
                />

                <DetalleBadge
                    label="Adicionales"
                    value={
                        money(
                            orden.vradicionais
                        )
                    }
                />

                <DetalleBadge
                    label="Desc. piezas"
                    value={
                        money(
                            orden.vrdescpeca
                        )
                    }
                />

                <DetalleBadge
                    label="Total piezas OS"
                    value={
                        money(
                            orden.vrtotalpecas
                        )
                    }
                />

                <DetalleBadge
                    label="Valor partidas"
                    value={
                        money(
                            orden.valorProductos
                        )
                    }
                />

                <DetalleBadge
                    label="Descuento detalle"
                    value={
                        money(
                            orden.totalDescuentos
                        )
                    }
                />

            </div>


            {/* ====================================================
          TABLA DE PIEZAS
      ==================================================== */}

            <div className="overflow-x-auto rounded-xl border border-[#D7DDEA] bg-white">

                <div className="flex items-center gap-2 border-b border-[#D7DDEA] bg-white px-4 py-3">

                    <PackageSearch className="h-5 w-5 text-[#131E5C]" />

                    <div>
                        <div className="font-extrabold text-[#131E5C]">
                            Refacciones facturadas
                        </div>

                        <div className="text-xs font-semibold text-[#8891AD]">
                            Desglose por requisición
                        </div>
                    </div>

                </div>


                <table className="w-full min-w-[1150px] border-collapse text-sm">

                    <thead>
                        <tr className="bg-[#E9EDF5] text-[#131E5C]">

                            <th className="px-3 py-2.5 text-right">
                                Req.
                            </th>

                            <th className="px-3 py-2.5 text-left">
                                Código
                            </th>

                            <th className="px-3 py-2.5 text-left">
                                Descripción
                            </th>

                            <th className="px-3 py-2.5 text-right">
                                Ítems
                            </th>

                            <th className="px-3 py-2.5 text-right">
                                Atendidos
                            </th>

                            <th className="px-3 py-2.5 text-right">
                                Precio unit.
                            </th>

                            <th className="px-3 py-2.5 text-right">
                                % Desc.
                            </th>

                            <th className="px-3 py-2.5 text-right">
                                Descuento
                            </th>

                            <th className="px-3 py-2.5 text-right">
                                Importe
                            </th>

                        </tr>
                    </thead>


                    <tbody>

                        {piezas.map(
                            (pieza) => (

                                <tr
                                    key={pieza.id}
                                    className="border-t border-[#E6EAF1] transition hover:bg-[#F7F8FC]"
                                >

                                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-[#131E5C]">
                                        {pieza.nrreq ??
                                            "—"}
                                    </td>


                                    <td className="px-3 py-2.5 font-bold text-[#131E5C]">
                                        {pieza.codprod?.trim() ||
                                            "—"}
                                    </td>


                                    <td
                                        className="max-w-[350px] px-3 py-2.5"
                                        title={
                                            pieza.nmproduto ||
                                            ""
                                        }
                                    >
                                        {pieza.nmproduto ||
                                            "—"}
                                    </td>


                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {formatoNumero(
                                            pieza.qtdeitens
                                        )}
                                    </td>


                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {formatoNumero(
                                            pieza.qtdeatend
                                        )}
                                    </td>


                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {money(
                                            pieza.precounit
                                        )}
                                    </td>


                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {formatoNumero(
                                            pieza.percdesc
                                        )}
                                        %
                                    </td>


                                    <td className="px-3 py-2.5 text-right tabular-nums text-red-600">
                                        {money(
                                            pieza.vrdesc
                                        )}
                                    </td>


                                    <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-[#131E5C]">
                                        {money(
                                            pieza.vrprod
                                        )}
                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>


                    <tfoot>

                        <tr className="border-t-2 border-[#131E5C] bg-[#EEF2F8] text-[#131E5C]">

                            <td
                                colSpan={6}
                                className="px-3 py-3 text-right font-black uppercase"
                            >
                                Totales
                            </td>


                            <td className="px-3 py-3 text-right font-black">
                                —
                            </td>


                            <td className="px-3 py-3 text-right font-black text-red-600">
                                {money(
                                    totalDescuento
                                )}
                            </td>


                            <td className="px-3 py-3 text-right font-black">
                                {money(
                                    totalVrProd
                                )}
                            </td>

                        </tr>

                    </tfoot>

                </table>

            </div>

        </div>
    );
}


// ============================================================
// PAGINACIÓN
// ============================================================

function Paginacion({
    pagina,
    totalPaginas,
    total,
    pageSize,
    onPageSizeChange,
    onPrev,
    onNext,
}) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-[#C8D0DF] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">

            <div className="text-sm font-semibold text-[#8891AD]">

                {formatoNumero(total)} partidas · Página{" "}

                <span className="font-black text-[#131E5C]">
                    {pagina}
                </span>

                {" "}de{" "}

                <span className="font-black text-[#131E5C]">
                    {totalPaginas}
                </span>

            </div>


            <div className="flex items-center gap-2">

                <select
                    value={pageSize}
                    onChange={(e) =>
                        onPageSizeChange(
                            Number(
                                e.target.value
                            )
                        )
                    }
                    className="h-9 rounded-lg border border-[#C8D0DF] bg-white px-2 text-sm font-bold text-[#131E5C]"
                >
                    <option value={25}>
                        25
                    </option>

                    <option value={50}>
                        50
                    </option>

                    <option value={100}>
                        100
                    </option>

                    <option value={200}>
                        200
                    </option>
                </select>


                <button
                    type="button"
                    onClick={onPrev}
                    disabled={
                        pagina <= 1
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#C8D0DF] px-3 text-sm font-bold text-[#131E5C] disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />

                    Anterior
                </button>


                <button
                    type="button"
                    onClick={onNext}
                    disabled={
                        pagina >=
                        totalPaginas
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#131E5C] px-3 text-sm font-bold text-white disabled:opacity-40"
                >
                    Siguiente

                    <ChevronRight className="h-4 w-4" />
                </button>

            </div>

        </div>
    );
}


// ============================================================
// KPI
// ============================================================

function KPICard({
    icon,
    label,
    value,
    sub,
    accent,
}) {
    const Icon = icon;

    return (
        <div
            className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
            style={{
                borderColor:
                    "#E7EAF3",
            }}
        >

            <div
                className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.12]"
                style={{
                    backgroundColor:
                        accent,
                }}
            />


            <div className="relative">

                <div className="flex items-center gap-2">

                    <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor:
                                `${accent}1A`,

                            color:
                                accent,
                        }}
                    >
                        <Icon className="h-[18px] w-[18px]" />
                    </span>


                    <span className="truncate text-xs font-bold uppercase tracking-wide text-[#8891AD]">
                        {label}
                    </span>

                </div>


                <div
                    className="mt-3 truncate text-[26px] font-black leading-none text-[#131E5C]"
                    title={
                        String(value)
                    }
                >
                    {value}
                </div>


                {sub && (
                    <div
                        className="mt-2 truncate text-[11px] font-semibold"
                        style={{
                            color:
                                accent,
                        }}
                    >
                        {sub}
                    </div>
                )}

            </div>

        </div>
    );
}


// ============================================================
// BADGE DETALLE
// ============================================================

function DetalleBadge({
    label,
    value,
}) {
    return (
        <div className="rounded-lg border border-[#D7DDEA] bg-white px-3 py-2">

            <div className="text-[9px] font-black uppercase tracking-wider text-[#8891AD]">
                {label}
            </div>

            <div
                className="mt-0.5 truncate text-sm font-extrabold text-[#131E5C]"
                title={
                    String(
                        value ??
                        ""
                    )
                }
            >
                {value}
            </div>

        </div>
    );
}


// ============================================================
// BADGE SITUACIÓN
// ============================================================

function SituacionBadge({
    value,
}) {
    if (!value) {
        return (
            <span className="text-slate-400">
                —
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-2.5 py-1 text-[11px] font-bold text-[#131E5C]">
            {value}
        </span>
    );
}


// ============================================================
// BADGE TIPO OS
// ============================================================

function TipoBadge({
    value,
}) {
    if (!value) {
        return (
            <span className="text-slate-400">
                —
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-lg bg-[#EEF2F8] px-2 py-1 text-[11px] font-black text-[#131E5C]">
            {value}
        </span>
    );
}