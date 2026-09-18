import { useEffect, useMemo, useState } from "react";
import {
    ChevronDown,
    FileCheck2,
    FileText,
} from "lucide-react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import {
    getOpcionesPresupuestos,
    getPresupuestos,
    getPresupuestosDashboard,
} from "../../lib/apiPresupuestos";

/* ============================================================
   CONFIGURACIÓN GENERAL
============================================================ */

const COLOR_AZUL_CLARO = "#2584F2";
const COLOR_ROJO = "#E31B23";
const COLOR_AMARILLO = "#F2C313";

/*
 * Por los datos actuales estamos considerando:
 *
 * A = Autorizado
 *
 * Si posteriormente confirmamos que Power BI utiliza otra regla,
 * sólo hay que cambiar esta constante o mover la regla al backend.
 */
const ESTATUS_AUTORIZADO = "A";

const MESES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
];

const COLORES_ASESORES = [
    "#145B54",
    "#155A91",
    "#2584F2",
    "#16A67A",
    "#78BFA8",
    "#153A5E",
    "#3B74D4",
    "#5F92DE",
];

const TOOLTIP_STYLE = {
    borderRadius: 10,
    border: "1px solid #D7DEEA",
    boxShadow: "0 8px 24px rgba(19,30,92,.15)",
    fontSize: 13,
};

const DATA_VACIA = {
    ordenesEmitidas: 0,
    conversionMonto: 0,

    estatus: [],

    presupuestosEmitidosAsesor: [],
    presupuestosAutorizadosAsesor: [],

    emitidos: {
        porcentaje: 0,
        total: 0,
        manoObra: 0,
        refacciones: 0,
        montoTotal: 0,
    },

    autorizados: {
        porcentaje: 0,
        total: 0,
        manoObra: 0,
        refacciones: 0,
        montoTotal: 0,
    },

    seguimiento: [],
    totalSeguimiento: 0,
};

/* ============================================================
   HELPERS
============================================================ */

function numero(valor) {
    const resultado = Number(valor ?? 0);

    return Number.isFinite(resultado)
        ? resultado
        : 0;
}

function entero(valor) {
    return numero(valor).toLocaleString("es-MX", {
        maximumFractionDigits: 0,
    });
}

function dinero(valor) {
    return numero(valor).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function porcentaje(valor) {
    return `${numero(valor).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}%`;
}

function porcentajeSeguro(valor, total) {
    const numerador = numero(valor);
    const denominador = numero(total);

    if (!denominador) {
        return 0;
    }

    return (numerador / denominador) * 100;
}

/* ============================================================
   FECHAS
============================================================ */

function pad(valor) {
    return String(valor).padStart(2, "0");
}

function obtenerRangoMes(anio, mes) {
    const indiceMes = MESES.indexOf(mes);

    if (indiceMes < 0) {
        return {
            fecha_desde: "",
            fecha_hasta: "",
        };
    }

    const numeroMes = indiceMes + 1;

    const ultimoDia = new Date(
        anio,
        numeroMes,
        0,
    ).getDate();

    return {
        fecha_desde: `${anio}-${pad(numeroMes)}-01`,
        fecha_hasta: `${anio}-${pad(numeroMes)}-${pad(ultimoDia)}`,
    };
}

function formatearFecha(valor) {
    if (!valor) {
        return "";
    }

    const texto = String(valor).trim();

    /*
     * YYYYMMDD
     */
    if (/^\d{8}$/.test(texto)) {
        const anio = texto.substring(0, 4);
        const mes = texto.substring(4, 6);
        const dia = texto.substring(6, 8);

        return `${dia}/${mes}/${anio}`;
    }

    /*
     * YYYY-MM-DD
     * YYYY-MM-DDTHH:mm:ss
     */
    const formatoISO = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/,
    );

    if (formatoISO) {
        return `${formatoISO[3]}/${formatoISO[2]}/${formatoISO[1]}`;
    }

    /*
     * Ya viene como DD/MM/YYYY.
     */
    if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
        return texto.substring(0, 10);
    }

    return texto;
}

/* ============================================================
   ESTATUS
============================================================ */

function colorEstatus(estatus, index) {
    const colores = {
        N: "#155B91",
        A: "#1885D8",
        E: "#153A5E",
    };

    return (
        colores[String(estatus || "").trim()] ||
        COLORES_ASESORES[
        index % COLORES_ASESORES.length
        ]
    );
}

/* ============================================================
   NORMALIZACIÓN BACKEND -> FRONTEND
============================================================ */

function normalizarAsesores(items = []) {
    if (!Array.isArray(items)) {
        return [];
    }

    return [...items]
        .sort(
            (a, b) =>
                numero(b.presupuestos) -
                numero(a.presupuestos),
        )
        .map((item, index) => ({
            name:
                item.cod_func !== null &&
                    item.cod_func !== undefined
                    ? `Asesor ${item.cod_func}`
                    : "Sin asignar",

            value: numero(item.presupuestos),

            color:
                COLORES_ASESORES[
                index %
                COLORES_ASESORES.length
                ],
        }));
}

function normalizarEstatus(items = []) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map((item, index) => ({
        name:
            item.estatus ||
            "Sin estatus",

        value: numero(
            item.presupuestos ??
            item.total,
        ),

        color: colorEstatus(
            item.estatus,
            index,
        ),
    }));
}

function normalizarSeguimiento(items = []) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.map((item) => ({
        asesor:
            item.cod_func !== null &&
                item.cod_func !== undefined
                ? `Asesor ${item.cod_func}`
                : "Sin asignar",

        presupuesto:
            item.nr_orcamento,

        fecha: formatearFecha(
            item.dt_emissao,
        ),

        sit:
            item.sit || "",

        vin:
            item.chassi || "",
    }));
}

function construirData(
    dashboard,
    dashboardAutorizados,
    listado,
) {
    const totales =
        dashboard?.totales || {};

    const totalesAutorizados =
        dashboardAutorizados?.totales ||
        {};

    const graficas =
        dashboard?.graficas || {};

    const graficasAutorizados =
        dashboardAutorizados?.graficas ||
        {};

    const totalRegistros = numero(
        totales.registros,
    );

    const totalPresupuestos = numero(
        totales.presupuestos,
    );

    const totalAutorizados = numero(
        totalesAutorizados.presupuestos,
    );

    const montoEmitidos = numero(
        totales.monto_total,
    );

    const montoAutorizados = numero(
        totalesAutorizados.monto_total,
    );

    /*
     * Actualmente no tenemos una tabla de Órdenes de Servicio,
     * así que este KPI usa los registros de Matriz_Presupuestos.
     */
    const ordenesEmitidas =
        totalRegistros;

    /*
     * Este porcentaje todavía no tiene el denominador real
     * del Power BI, porque necesitaríamos la tabla de órdenes.
     *
     * Usamos presupuestos únicos / registros.
     */
    const porcentajeEmitidos =
        porcentajeSeguro(
            totalPresupuestos,
            totalRegistros,
        );

    const porcentajeAutorizados =
        porcentajeSeguro(
            totalAutorizados,
            totalPresupuestos,
        );

    const conversionMonto =
        porcentajeSeguro(
            montoAutorizados,
            montoEmitidos,
        );

    return {
        ordenesEmitidas,
        conversionMonto,

        estatus: normalizarEstatus(
            graficas.por_estatus,
        ),

        presupuestosEmitidosAsesor:
            normalizarAsesores(
                graficas.por_asesor,
            ),

        presupuestosAutorizadosAsesor:
            normalizarAsesores(
                graficasAutorizados.por_asesor,
            ),

        emitidos: {
            porcentaje:
                porcentajeEmitidos,

            total:
                totalPresupuestos,

            manoObra: numero(
                totales.monto_mano_obra,
            ),

            refacciones: numero(
                totales.monto_productos,
            ),

            montoTotal:
                montoEmitidos,
        },

        autorizados: {
            porcentaje:
                porcentajeAutorizados,

            total:
                totalAutorizados,

            manoObra: numero(
                totalesAutorizados.monto_mano_obra,
            ),

            refacciones: numero(
                totalesAutorizados.monto_productos,
            ),

            montoTotal:
                montoAutorizados,
        },

        seguimiento:
            normalizarSeguimiento(
                listado?.results,
            ),

        totalSeguimiento: numero(
            listado?.count,
        ),
    };
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function PresupuestosServicio() {
    const hoy = new Date();

    const anioActual =
        hoy.getFullYear();

    const mesActual =
        MESES[hoy.getMonth()];

    const [anio, setAnio] =
        useState(anioActual);

    const [mes, setMes] =
        useState(mesActual);

    const [agencia, setAgencia] =
        useState("Todas");

    const [agencias, setAgencias] =
        useState([]);

    const [data, setData] =
        useState(DATA_VACIA);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const anios = useMemo(() => {
        return Array.from(
            { length: 5 },
            (_, index) =>
                anioActual - index,
        );
    }, [anioActual]);

    /* ========================================================
       OPCIONES
    ======================================================== */

    useEffect(() => {
        let activo = true;

        getOpcionesPresupuestos()
            .then((respuesta) => {
                if (!activo) {
                    return;
                }

                setAgencias(
                    Array.isArray(
                        respuesta?.agencias,
                    )
                        ? respuesta.agencias
                        : [],
                );
            })
            .catch((err) => {
                console.error(
                    "Error cargando opciones de presupuestos:",
                    err,
                );
            });

        return () => {
            activo = false;
        };
    }, []);

    /* ========================================================
       DASHBOARD
    ======================================================== */

    useEffect(() => {
        let activo = true;

        const {
            fecha_desde,
            fecha_hasta,
        } = obtenerRangoMes(
            anio,
            mes,
        );

        const params = {
            fecha_desde,
            fecha_hasta,

            agencia:
                agencia !== "Todas"
                    ? agencia
                    : undefined,
        };

        const paramsAutorizados = {
            ...params,
            sit: ESTATUS_AUTORIZADO,
        };

        const paramsListado = {
            ...params,
            page: 1,
            page_size: 500,
        };

        setLoading(true);
        setError("");

        Promise.all([
            getPresupuestosDashboard(
                params,
            ),

            getPresupuestosDashboard(
                paramsAutorizados,
            ),

            getPresupuestos(
                paramsListado,
            ),
        ])
            .then(
                ([
                    dashboard,
                    dashboardAutorizados,
                    listado,
                ]) => {
                    if (!activo) {
                        return;
                    }

                    const nuevaData =
                        construirData(
                            dashboard,
                            dashboardAutorizados,
                            listado,
                        );

                    setData(nuevaData);
                },
            )
            .catch((err) => {
                if (!activo) {
                    return;
                }

                console.error(
                    "Error cargando presupuestos:",
                    err,
                );

                setError(
                    err?.message ||
                    "No fue posible cargar los presupuestos.",
                );

                setData(DATA_VACIA);
            })
            .finally(() => {
                if (activo) {
                    setLoading(false);
                }
            });

        return () => {
            activo = false;
        };
    }, [
        anio,
        mes,
        agencia,
    ]);

    return (
        <div className="min-h-screen bg-[#F5F6F8] text-[#1A2344]">
            <main className="mx-auto max-w-[1700px] space-y-5 px-4 py-5">

                <Cabecera
                    anio={anio}
                    setAnio={setAnio}
                    agencia={agencia}
                    setAgencia={setAgencia}
                    agencias={agencias}
                    mes={mes}
                    setMes={setMes}
                    anios={anios}
                />

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="rounded-xl border border-[#C8D0DF] bg-white px-4 py-3 text-sm font-semibold text-[#566276] shadow-sm">
                        Cargando información de presupuestos...
                    </div>
                )}

                {/* =====================================================
                    RESUMEN SUPERIOR
                ====================================================== */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[155px_180px_210px_1fr_1fr]">

                    <OrdenesEmitidas
                        total={
                            data.ordenesEmitidas
                        }
                    />

                    <Tarjeta>
                        <div className="text-center text-[14px] font-black leading-tight text-[#33415F]">
                            Conversión de montos emitidos vs
                            <br />
                            autorizados
                        </div>

                        <Gauge
                            value={
                                data.conversionMonto
                            }
                            height={135}
                            compact
                        />
                    </Tarjeta>

                    <Tarjeta className="overflow-hidden p-0">
                        <TituloAzul>
                            Estatus de Presupuestos
                        </TituloAzul>

                        <div className="p-3">
                            <DonutSimple
                                datos={
                                    data.estatus
                                }
                                height={125}
                                showLegend
                            />
                        </div>
                    </Tarjeta>

                    <Tarjeta className="overflow-hidden p-0">
                        <TituloAzul>
                            Presupuestos emitidos por asesor
                        </TituloAzul>

                        <div className="p-3">
                            <DonutAsesores
                                datos={
                                    data.presupuestosEmitidosAsesor
                                }
                            />
                        </div>
                    </Tarjeta>

                    <Tarjeta className="overflow-hidden p-0">
                        <TituloAzul>
                            Presupuestos autorizados por asesor
                        </TituloAzul>

                        <div className="p-3">
                            <DonutAsesores
                                datos={
                                    data.presupuestosAutorizadosAsesor
                                }
                            />
                        </div>
                    </Tarjeta>
                </div>

                {/* =====================================================
                    CONTENIDO PRINCIPAL
                ====================================================== */}

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.02fr_1fr]">

                    <div className="space-y-5">

                        <BloquePresupuesto
                            titulo={
                                <>
                                    Presupuesto{" "}
                                    <strong>
                                        emitido
                                    </strong>
                                </>
                            }
                            icono={
                                <FileText className="h-5 w-5" />
                            }
                            data={
                                data.emitidos
                            }
                            tipo="emitido"
                        />

                        <BloquePresupuesto
                            titulo={
                                <>
                                    Presupuesto{" "}
                                    <strong>
                                        autorizado
                                    </strong>
                                </>
                            }
                            icono={
                                <FileCheck2 className="h-5 w-5" />
                            }
                            data={
                                data.autorizados
                            }
                            tipo="autorizado"
                        />
                    </div>

                    <Seccion
                        titulo={
                            <>
                                Seguimiento a{" "}
                                <strong>
                                    Presupuestos
                                </strong>
                            </>
                        }
                    >
                        <TablaSeguimiento
                            datos={
                                data.seguimiento
                            }
                            total={
                                data.totalSeguimiento
                            }
                        />
                    </Seccion>
                </div>
            </main>
        </div>
    );
}

/* ============================================================
   CABECERA
============================================================ */

function Cabecera({
    anio,
    setAnio,
    agencia,
    setAgencia,
    agencias,
    mes,
    setMes,
    anios,
}) {
    return (
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                <div className="flex flex-wrap items-center gap-5">

                    <div>
                        <h1 className="text-[28px] font-medium tracking-tight text-[#155A91]">
                            Presupuestos de{" "}
                            <strong className="text-[#131E5C]">
                                Servicio
                            </strong>
                        </h1>
                    </div>

                    <div className="hidden h-11 w-px bg-[#D8DEE8] md:block" />

                    <Marcas />
                </div>

                <div className="flex flex-wrap gap-3">

                    <FiltroSelect
                        label="Año"
                        value={anio}
                        onChange={(e) =>
                            setAnio(
                                Number(
                                    e.target.value,
                                ),
                            )
                        }
                    >
                        {anios.map(
                            (item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ),
                        )}
                    </FiltroSelect>

                    <FiltroSelect
                        label="Agencia"
                        value={agencia}
                        onChange={(e) =>
                            setAgencia(
                                e.target.value,
                            )
                        }
                        className="min-w-[180px]"
                    >
                        <option value="Todas">
                            Todas
                        </option>

                        {agencias.map(
                            (item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ),
                        )}
                    </FiltroSelect>

                    <FiltroSelect
                        label="Mes"
                        value={mes}
                        onChange={(e) =>
                            setMes(
                                e.target.value,
                            )
                        }
                        className="min-w-[205px]"
                    >
                        {MESES.map(
                            (item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ),
                        )}
                    </FiltroSelect>
                </div>
            </div>
        </div>
    );
}

function Marcas() {
    return (
        <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#07184C] text-[17px] font-black text-[#07184C]">
                VW
            </div>

            <div className="leading-none text-[#07184C]">

                <div className="text-[22px] font-black italic">
                    R&R
                </div>

                <div className="mt-1 text-[13px] font-bold tracking-[0.18em]">
                    CÓRDOBA
                </div>
            </div>
        </div>
    );
}

function FiltroSelect({
    label,
    value,
    onChange,
    children,
    className = "",
}) {
    return (
        <label
            className={`min-w-[125px] rounded-lg border border-[#7391AE] bg-white px-3 py-2 shadow-sm ${className}`}
        >
            <div className="mb-1 text-center text-[13px] font-black text-[#33415F]">
                {label}
            </div>

            <div className="relative">

                <select
                    value={value}
                    onChange={onChange}
                    className="h-9 w-full appearance-none rounded border-0 bg-[#2584F2] px-3 pr-8 font-semibold text-[#07184C] outline-none"
                >
                    {children}
                </select>

                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#07184C]" />
            </div>
        </label>
    );
}

/* ============================================================
   TARJETAS
============================================================ */

function Tarjeta({
    children,
    className = "",
}) {
    return (
        <div
            className={`rounded-xl border border-[#D5DAE3] bg-white p-4 shadow-[0_5px_14px_rgba(15,23,42,.16)] ${className}`}
        >
            {children}
        </div>
    );
}

function TituloAzul({
    children,
}) {
    return (
        <div className="bg-[#155A91] px-3 py-2 text-[15px] font-black text-white">
            {children}
        </div>
    );
}

function OrdenesEmitidas({
    total,
}) {
    return (
        <Tarjeta className="overflow-hidden p-0">

            <div className="bg-[#06251F] px-3 py-3 text-center text-[15px] font-black leading-tight text-white">
                Órdenes emitidas
                <br />
                en total en el
                <br />
                periodo
            </div>

            <div className="flex min-h-[80px] items-center justify-center">

                <span className="text-[27px] font-black text-[#242424]">
                    {entero(total)}
                </span>
            </div>
        </Tarjeta>
    );
}

/* ============================================================
   SECCIÓN
============================================================ */

function Seccion({
    titulo,
    children,
    className = "",
}) {
    return (
        <section
            className={`relative rounded-[20px] border-[1.5px] border-[#527189] bg-white px-4 pb-4 pt-8 ${className}`}
        >
            <div className="absolute -top-[17px] left-10 flex items-center bg-[#F5F6F8] px-3">

                <h2 className="text-[24px] font-light text-[#454545]">
                    {titulo}
                </h2>

                <div className="ml-3 h-8 w-[7px] bg-[#C4C4C4]" />
            </div>

            {children}
        </section>
    );
}

/* ============================================================
   BLOQUE PRESUPUESTO
============================================================ */

function BloquePresupuesto({
    titulo,
    data,
    icono,
    tipo,
}) {
    const esAutorizado =
        tipo === "autorizado";

    return (
        <Seccion titulo={titulo}>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[135px_1fr]">

                <div className="flex flex-col items-center justify-center">

                    <div className="mb-1 flex items-center gap-2 font-black text-[#131E5C] lg:hidden">
                        {icono}
                    </div>

                    <Gauge
                        value={
                            data.porcentaje
                        }
                        height={155}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <MetricaPresupuesto
                        titulo={
                            esAutorizado
                                ? "Total de Presupuestos Autorizados"
                                : "Total de Presupuestos Emitidos"
                        }
                        valor={
                            entero(
                                data.total,
                            )
                        }
                    />

                    <div className="grid gap-3">

                        <MetricaPresupuesto
                            titulo={
                                esAutorizado
                                    ? "Total de Presupuestos Autorizados M.O"
                                    : "Total de Presupuestos Emitidos M.O"
                            }
                            valor={
                                dinero(
                                    data.manoObra,
                                )
                            }
                            small
                        />

                        <MetricaPresupuesto
                            titulo={
                                esAutorizado
                                    ? "Total de Presupuestos Autorizados Ref"
                                    : "Total de Presupuestos Emitidos Ref"
                            }
                            valor={
                                dinero(
                                    data.refacciones,
                                )
                            }
                            small
                        />
                    </div>

                    <MetricaPresupuesto
                        titulo={
                            esAutorizado
                                ? "Monto Total de Presupuestos Autorizados"
                                : "Monto Total de Presupuestos Emitidos"
                        }
                        valor={
                            dinero(
                                data.montoTotal,
                            )
                        }
                    />
                </div>
            </div>
        </Seccion>
    );
}

function MetricaPresupuesto({
    titulo,
    valor,
    small = false,
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-lg bg-white px-3 text-center shadow-[0_3px_12px_rgba(15,23,42,.18)] ${small
                ? "min-h-[82px] py-2"
                : "min-h-[170px] py-4"
                }`}
        >
            <div className="max-w-[170px] text-[13px] font-black leading-tight text-[#333]">
                {titulo}
            </div>

            <div
                className={`mt-3 font-black text-[#2F2F2F] ${small
                    ? "text-[19px]"
                    : "text-[24px]"
                    }`}
            >
                {valor}
            </div>
        </div>
    );
}

/* ============================================================
   GAUGE
============================================================ */

function Gauge({
    value,
    height = 160,
    compact = false,
}) {
    const valor = Math.min(
        100,
        Math.max(
            0,
            numero(value),
        ),
    );

    const needleAngle =
        180 - valor * 1.8;

    const segmentos = [
        {
            value: 48,
            color: COLOR_ROJO,
        },
        {
            value: 12,
            color: COLOR_AMARILLO,
        },
        {
            value: 40,
            color: COLOR_AZUL_CLARO,
        },
    ];

    return (
        <div
            className="relative mx-auto w-full max-w-[190px]"
            style={{
                height,
            }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <PieChart>

                    <Pie
                        data={
                            segmentos
                        }
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                        cx="50%"
                        cy="72%"
                        innerRadius="52%"
                        outerRadius="72%"
                        stroke="none"
                        isAnimationActive={
                            false
                        }
                    >
                        {segmentos.map(
                            (
                                item,
                                index,
                            ) => (
                                <Cell
                                    key={
                                        index
                                    }
                                    fill={
                                        item.color
                                    }
                                />
                            ),
                        )}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div
                className="absolute left-1/2 h-[2px] w-[34%] bg-[#697685]"
                style={{
                    bottom: compact
                        ? "38px"
                        : "40px",

                    transformOrigin:
                        "left center",

                    transform: `rotate(${needleAngle}deg)`,
                }}
            />

            <div
                className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-[4px] border-[#697685] bg-white"
                style={{
                    bottom: compact
                        ? "31px"
                        : "33px",
                }}
            />

            <div
                className={`absolute bottom-0 left-0 right-0 text-center font-medium text-[#333] ${compact
                    ? "text-[18px]"
                    : "text-[21px]"
                    }`}
            >
                {porcentaje(valor)}
            </div>
        </div>
    );
}

/* ============================================================
   DONUTS
============================================================ */

function DonutSimple({
    datos,
    height = 150,
    showLegend = false,
}) {
    if (!datos.length) {
        return (
            <div
                className="flex items-center justify-center text-base font-semibold text-[#8A94A8]"
                style={{
                    height,
                }}
            >
                Sin datos
            </div>
        );
    }

    return (
        <div
            style={{
                height,
            }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <PieChart>

                    <Pie
                        data={datos}
                        dataKey="value"
                        nameKey="name"
                        cx="42%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        strokeWidth={1}
                        stroke="#fff"
                    >
                        {datos.map(
                            (item) => (
                                <Cell
                                    key={
                                        item.name
                                    }
                                    fill={
                                        item.color
                                    }
                                />
                            ),
                        )}
                    </Pie>

                    <Tooltip
                        contentStyle={
                            TOOLTIP_STYLE
                        }
                        formatter={(
                            value,
                            name,
                        ) => [
                                entero(
                                    value,
                                ),
                                name,
                            ]}
                    />

                    {showLegend && (
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            formatter={(
                                value,
                            ) => (
                                <span className="text-[14px] font-bold text-[#4B5563]">
                                    {
                                        value
                                    }
                                </span>
                            )}
                        />
                    )}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

function DonutAsesores({
    datos,
}) {
    const total = datos.reduce(
        (acumulado, item) =>
            acumulado +
            numero(item.value),
        0,
    );

    const datosCalculados =
        datos.map((item) => ({
            ...item,

            porcentaje:
                total > 0
                    ? (numero(
                        item.value,
                    ) /
                        total) *
                    100
                    : 0,
        }));

    if (
        datosCalculados.length === 0
    ) {
        return (
            <div className="flex h-[125px] items-center justify-center text-base font-semibold text-[#8A94A8]">
                Sin datos
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 items-center gap-2">

            <div className="h-[145px]">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <PieChart>

                        <Pie
                            data={
                                datosCalculados
                            }
                            dataKey="value"
                            nameKey="name"
                            innerRadius={34}
                            outerRadius={70}
                            stroke="#fff"
                        >
                            {datosCalculados.map(
                                (item) => (
                                    <Cell
                                        key={
                                            item.name
                                        }
                                        fill={
                                            item.color
                                        }
                                    />
                                ),
                            )}
                        </Pie>

                        <Tooltip
                            contentStyle={
                                TOOLTIP_STYLE
                            }
                            formatter={(
                                value,
                                _name,
                                item,
                            ) => [
                                    `${entero(
                                        value,
                                    )} (${porcentaje(
                                        item
                                            ?.payload
                                            ?.porcentaje,
                                    )})`,

                                    item
                                        ?.payload
                                        ?.name,
                                ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="min-w-0 space-y-2">

                <div className="text-[14px] font-black text-[#566276]">
                    Asesor
                </div>

                {datosCalculados
                    .slice(0, 4)
                    .map((item) => (
                        <div
                            key={
                                item.name
                            }
                            className="flex min-w-0 items-center gap-2"
                        >
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                    backgroundColor:
                                        item.color,
                                }}
                            />

                            <span
                                className="truncate text-[14px] font-medium text-[#697386]"
                                title={
                                    item.name
                                }
                            >
                                {
                                    item.name
                                }
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

/* ============================================================
   TABLA DE SEGUIMIENTO
============================================================ */

function TablaSeguimiento({
    datos,
    total = 0,
}) {
    return (
        <div className="rounded-lg border border-[#646464] bg-white p-2 shadow-sm">

            <div className="max-h-[390px] overflow-auto">

                <table className="w-full min-w-[720px] border-collapse text-[12px]">

                    <thead className="sticky top-0 z-10">

                        <tr className="bg-[#155A91] text-white">

                            <th className="px-2 py-2 text-left font-black">
                                Asesor
                            </th>

                            <th className="px-2 py-2 text-right font-black">
                                Presupuesto
                            </th>

                            <th className="px-2 py-2 text-center font-black">
                                Fecha
                            </th>

                            <th className="px-2 py-2 text-center font-black">
                                Sit
                            </th>

                            <th className="px-2 py-2 text-left font-black">
                                Vin
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        {datos.length ===
                            0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="h-40 text-center font-semibold text-[#8A94A8]"
                                >
                                    Sin presupuestos en el periodo seleccionado
                                </td>
                            </tr>
                        ) : (
                            datos.map(
                                (
                                    item,
                                    index,
                                ) => (
                                    <tr
                                        key={`${item.presupuesto}-${index}`}
                                        className={
                                            index %
                                                2 ===
                                                0
                                                ? "bg-white"
                                                : "bg-[#EEEEEE]"
                                        }
                                    >
                                        <td className="whitespace-nowrap px-2 py-1.5 font-medium text-[#555]">
                                            {
                                                item.asesor
                                            }
                                        </td>

                                        <td className="px-2 py-1.5 text-right font-medium text-[#555]">
                                            {
                                                item.presupuesto
                                            }
                                        </td>

                                        <td className="whitespace-nowrap px-2 py-1.5 text-center font-medium text-[#555]">
                                            {
                                                item.fecha
                                            }
                                        </td>

                                        <td className="px-1 py-0 text-center">
                                            <EstatusSit
                                                value={
                                                    item.sit
                                                }
                                            />
                                        </td>

                                        <td className="whitespace-nowrap px-2 py-1.5 font-medium text-[#555]">
                                            {
                                                item.vin
                                            }
                                        </td>
                                    </tr>
                                ),
                            )
                        )}
                    </tbody>

                    <tfoot>
                        <tr className="border-t-2 border-[#999] bg-white">

                            <td
                                colSpan={5}
                                className="px-2 py-2 font-black text-[#444]"
                            >
                                Total:{" "}
                                {entero(
                                    total,
                                )}{" "}
                                presupuestos
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function EstatusSit({
    value,
}) {
    const estatus =
        String(value || "")
            .trim()
            .toUpperCase();

    const estilos = {
        N: "bg-[#F20D30] text-white",
        A: "bg-[#97E68C] text-[#24611C]",
        E: "bg-[#FFF071] text-[#6C5D00]",
    };

    return (
        <span
            className={`inline-flex h-7 min-w-7 items-center justify-center px-2 font-black ${estilos[estatus] ||
                "bg-[#E5E7EB] text-[#374151]"
                }`}
        >
            {estatus || "-"}
        </span>
    );
}