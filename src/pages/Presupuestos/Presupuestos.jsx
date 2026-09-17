import { useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronDown,
    ClipboardList,
    FileCheck2,
    FileText,
    Wrench,
} from "lucide-react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

/* ============================================================
   CONFIGURACIÓN GENERAL
============================================================ */

const COLOR_PRINCIPAL = "#131E5C";
const COLOR_AZUL = "#1555C7";
const COLOR_AZUL_CLARO = "#2584F2";
const COLOR_VERDE = "#145B54";
const COLOR_ROJO = "#E31B23";
const COLOR_AMARILLO = "#F2C313";
const COLOR_GRIS = "#D8DEE8";

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

const CANALES = ["Clientes", "Interno", "Garantías", "Todos"];

const TOOLTIP_STYLE = {
    borderRadius: 10,
    border: "1px solid #D7DEEA",
    boxShadow: "0 8px 24px rgba(19,30,92,.15)",
    fontSize: 13,
};

/* ============================================================
   DATOS MOCK
   Posteriormente este objeto puede salir directamente del backend.
============================================================ */

const MOCK_DATA = {
    ordenesEmitidas: 327,
    conversionMonto: 22.51,

    estatus: [
        {
            name: "N",
            value: 61,
            color: "#155B91",
        },
        {
            name: "A",
            value: 70,
            color: "#1885D8",
        },
        {
            name: "E",
            value: 150,
            color: "#153A5E",
        },
    ],

    presupuestosEmitidosAsesor: [
        {
            name: "JORGE YAMIL TEPOLE",
            value: 102,
            color: "#145B54",
        },
        {
            name: "IVAN ELISEO RAMIREZ",
            value: 94,
            color: "#155A91",
        },
        {
            name: "VERONICA GONZALEZ",
            value: 79,
            color: "#2584F2",
        },
        {
            name: "OTROS",
            value: 3,
            color: "#16A67A",
        },
        {
            name: "SIN ASIGNAR",
            value: 3,
            color: "#78BFA8",
        },
    ],

    presupuestosAutorizadosAsesor: [
        {
            name: "IVAN ELISEO RAMIREZ",
            value: 27,
            color: "#155A91",
        },
        {
            name: "VERONICA GONZALEZ",
            value: 26,
            color: "#2584F2",
        },
        {
            name: "JORGE YAMIL TEPOLE",
            value: 14,
            color: "#145B54",
        },
        {
            name: "OTROS",
            value: 3,
            color: "#16A67A",
        },
    ],

    emitidos: {
        porcentaje: 85.93,
        total: 281,
        manoObra: 693962.16,
        refacciones: 1948297.67,
        montoTotal: 2703901.03,
    },

    autorizados: {
        porcentaje: 24.91,
        total: 70,
        manoObra: 249991.36,
        refacciones: 358652.18,
        montoTotal: 608643.54,
    },

    seguimiento: [
        {
            asesor: "VERONICA GONZALEZ VELASCO",
            presupuesto: 32112,
            fecha: "15/01/2026",
            sit: "N",
            vin: "WV1DLY7H0KH087421",
        },
        {
            asesor: "IVAN ELISEO RAMIREZ MEDICO",
            presupuesto: 32097,
            fecha: "14/01/2026",
            sit: "E",
            vin: "XW85G261XHG021428",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32161,
            fecha: "20/01/2026",
            sit: "N",
            vin: "MEX5A2604LT088521",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32169,
            fecha: "20/01/2026",
            sit: "N",
            vin: "3VVHP65N0MM118221",
        },
        {
            asesor: "IVAN ELISEO RAMIREZ MEDICO",
            presupuesto: 32125,
            fecha: "15/01/2026",
            sit: "A",
            vin: "1VWAH7A30DC145822",
        },
        {
            asesor: "IVAN ELISEO RAMIREZ MEDICO",
            presupuesto: 32040,
            fecha: "09/01/2026",
            sit: "N",
            vin: "WV1GRNSY9P9061425",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32055,
            fecha: "10/01/2026",
            sit: "N",
            vin: "WVG2N4CW8PT003251",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32193,
            fecha: "22/01/2026",
            sit: "N",
            vin: "3VVKP65NXLM028521",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32074,
            fecha: "13/01/2026",
            sit: "N",
            vin: "WVW1FHKSYUS906512",
        },
        {
            asesor: "IVAN ELISEO RAMIREZ MEDICO",
            presupuesto: 32208,
            fecha: "23/01/2026",
            sit: "A",
            vin: "3VVVP65N3RM095221",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32229,
            fecha: "26/01/2026",
            sit: "N",
            vin: "3VVKP65NXLM028612",
        },
        {
            asesor: "JORGE YAMIL TEPOLE MENENDEZ",
            presupuesto: 32274,
            fecha: "30/01/2026",
            sit: "N",
            vin: "3VWC7BU0KM168421",
        },
        {
            asesor: "IVAN ELISEO RAMIREZ MEDICO",
            presupuesto: 32033,
            fecha: "08/01/2026",
            sit: "E",
            vin: "3VVJA65N6RM121512",
        },
        {
            asesor: "IVAN ELISEO RAMIREZ MEDICO",
            presupuesto: 32031,
            fecha: "08/01/2026",
            sit: "N",
            vin: "MEX612605LT068821",
        },
    ],
};

/* ============================================================
   FORMATEADORES
============================================================ */

function numero(valor) {
    return Number(valor ?? 0);
}

function entero(valor) {
    return numero(valor).toLocaleString("es-MX", {
        maximumFractionDigits: 0,
    });
}

function dinero(valor) {
    return numero(valor).toLocaleString("es-ES", {
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

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function PresupuestosServicio() {
    const [anio, setAnio] = useState(2026);
    const [canal, setCanal] = useState("Clientes");
    const [mes, setMes] = useState("enero");

    const anios = useMemo(
        () => [2026, 2025, 2024, 2023, 2022],
        [],
    );

    return (
        <div className="min-h-screen bg-[#F5F6F8] text-[#1A2344]">
            <main className="mx-auto max-w-[1700px] space-y-5 px-4 py-5">
                {/* =====================================================
            CABECERA
        ====================================================== */}

                <Cabecera
                    anio={anio}
                    setAnio={setAnio}
                    canal={canal}
                    setCanal={setCanal}
                    mes={mes}
                    setMes={setMes}
                    anios={anios}
                />

                {/* =====================================================
            RESUMEN SUPERIOR
        ====================================================== */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[155px_180px_210px_1fr_1fr]">
                    <OrdenesEmitidas
                        total={MOCK_DATA.ordenesEmitidas}
                    />

                    <Tarjeta>
                        <div className="text-center text-[11px] font-black leading-tight text-[#33415F]">
                            Conversión de montos emitidos vs
                            <br />
                            autorizados
                        </div>

                        <Gauge
                            value={MOCK_DATA.conversionMonto}
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
                                datos={MOCK_DATA.estatus}
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
                                    MOCK_DATA.presupuestosEmitidosAsesor
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
                                    MOCK_DATA.presupuestosAutorizadosAsesor
                                }
                            />
                        </div>
                    </Tarjeta>
                </div>

                {/* =====================================================
            CONTENIDO PRINCIPAL
        ====================================================== */}

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.02fr_1fr]">
                    {/* ===================================================
              COLUMNA IZQUIERDA
          ==================================================== */}

                    <div className="space-y-5">
                        <BloquePresupuesto
                            titulo={
                                <>
                                    Presupuesto{" "}
                                    <strong>emitido</strong>
                                </>
                            }
                            icono={
                                <FileText className="h-5 w-5" />
                            }
                            data={MOCK_DATA.emitidos}
                        />

                        <BloquePresupuesto
                            titulo={
                                <>
                                    Presupuesto{" "}
                                    <strong>autorizado</strong>
                                </>
                            }
                            icono={
                                <FileCheck2 className="h-5 w-5" />
                            }
                            data={MOCK_DATA.autorizados}
                        />
                    </div>

                    {/* ===================================================
              TABLA SEGUIMIENTO
          ==================================================== */}

                    <Seccion
                        titulo={
                            <>
                                Seguimiento a{" "}
                                <strong>Presupuestos</strong>
                            </>
                        }
                    >
                        <TablaSeguimiento
                            datos={MOCK_DATA.seguimiento}
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
    canal,
    setCanal,
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
                            setAnio(Number(e.target.value))
                        }
                    >
                        {anios.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </FiltroSelect>

                    <FiltroSelect
                        label="Canal"
                        value={canal}
                        onChange={(e) =>
                            setCanal(e.target.value)
                        }
                        className="min-w-[150px]"
                    >
                        {CANALES.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </FiltroSelect>

                    <FiltroSelect
                        label="Mes"
                        value={mes}
                        onChange={(e) =>
                            setMes(e.target.value)
                        }
                        className="min-w-[205px]"
                    >
                        {MESES.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
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
   TARJETAS GENERALES
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

function TituloAzul({ children }) {
    return (
        <div className="bg-[#155A91] px-3 py-2 text-[15px] font-black text-white">
            {children}
        </div>
    );
}

function OrdenesEmitidas({ total }) {
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
   SECCIÓN CON TÍTULO SOBRE EL BORDE
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
}) {
    return (
        <Seccion titulo={titulo}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[135px_1fr]">
                <div className="flex flex-col items-center justify-center">
                    <div className="mb-1 flex items-center gap-2 font-black text-[#131E5C] lg:hidden">
                        {icono}
                    </div>

                    <Gauge
                        value={data.porcentaje}
                        height={155}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MetricaPresupuesto
                        titulo="Total de Presupuestos Emitidos"
                        valor={entero(data.total)}
                    />

                    <div className="grid gap-3">
                        <MetricaPresupuesto
                            titulo="Total de Presupuestos Emitidos M.O"
                            valor={dinero(data.manoObra)}
                            small
                        />

                        <MetricaPresupuesto
                            titulo="Total de Presupuestos Emitidos Ref"
                            valor={dinero(data.refacciones)}
                            small
                        />
                    </div>

                    <MetricaPresupuesto
                        titulo="Monto Total de Presupuestos Emitidos"
                        valor={dinero(data.montoTotal)}
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
        Math.max(0, numero(value)),
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
            style={{ height }}
        >
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                <PieChart>
                    <Pie
                        data={segmentos}
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                        cx="50%"
                        cy="72%"
                        innerRadius="52%"
                        outerRadius="72%"
                        stroke="none"
                        isAnimationActive={false}
                    >
                        {segmentos.map(
                            (item, index) => (
                                <Cell
                                    key={index}
                                    fill={item.color}
                                />
                            ),
                        )}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div
                className="absolute left-1/2 h-[2px] w-[34%] bg-[#697685]"
                style={{
                    bottom: compact ? "38px" : "40px",
                    transformOrigin: "left center",
                    transform: `rotate(${needleAngle}deg)`,
                }}
            />

            <div
                className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-[4px] border-[#697685] bg-white"
                style={{
                    bottom: compact ? "31px" : "33px",
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
                        {datos.map((item) => (
                            <Cell
                                key={item.name}
                                fill={item.color}
                            />
                        ))}
                    </Pie>

                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name) => [
                            entero(value),
                            name,
                        ]}
                    />

                    {showLegend && (
                        <Legend
                            verticalAlign="middle"
                            align="right"
                            layout="vertical"
                            formatter={(value) => (
                                <span className="text-[12px] font-bold text-[#4B5563]">
                                    {value}
                                </span>
                            )}
                        />
                    )}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

function DonutAsesores({ datos }) {
    const total = datos.reduce(
        (acc, item) =>
            acc + numero(item.value),
        0,
    );

    const datosCalculados = datos.map(
        (item) => ({
            ...item,
            porcentaje:
                total > 0
                    ? (item.value / total) * 100
                    : 0,
        }),
    );

    return (
        <div className="grid grid-cols-[150px_1fr] items-center gap-2">
            <div className="h-[125px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <PieChart>
                        <Pie
                            data={datosCalculados}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={34}
                            outerRadius={56}
                            stroke="#fff"
                        >
                            {datosCalculados.map(
                                (item) => (
                                    <Cell
                                        key={item.name}
                                        fill={item.color}
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
                                        item?.payload
                                            ?.porcentaje,
                                    )})`,
                                    item?.payload?.name,
                                ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="text-[11px] font-black text-[#566276]">
                    Asesor
                </div>

                {datosCalculados
                    .slice(0, 4)
                    .map((item) => (
                        <div
                            key={item.name}
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
                                className="truncate text-[11px] font-medium text-[#697386]"
                                title={item.name}
                            >
                                {item.name}
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

function TablaSeguimiento({ datos }) {
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
                        {datos.map(
                            (item, index) => (
                                <tr
                                    key={`${item.presupuesto}-${index}`}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-[#EEEEEE]"
                                    }
                                >
                                    <td className="whitespace-nowrap px-2 py-1.5 font-medium text-[#555]">
                                        {item.asesor}
                                    </td>

                                    <td className="px-2 py-1.5 text-right font-medium text-[#555]">
                                        {item.presupuesto}
                                    </td>

                                    <td className="whitespace-nowrap px-2 py-1.5 text-center font-medium text-[#555]">
                                        {item.fecha}
                                    </td>

                                    <td className="px-1 py-0 text-center">
                                        <EstatusSit
                                            value={item.sit}
                                        />
                                    </td>

                                    <td className="whitespace-nowrap px-2 py-1.5 font-medium text-[#555]">
                                        {item.vin}
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>

                    <tfoot>
                        <tr className="border-t-2 border-[#999] bg-white">
                            <td
                                colSpan={5}
                                className="px-2 py-2 font-black text-[#444]"
                            >
                                Total
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function EstatusSit({ value }) {
    const estilos = {
        N: "bg-[#F20D30] text-[#721020]",
        A: "bg-[#97E68C] text-[#24611C]",
        E: "bg-[#FFF071] text-[#6C5D00]",
    };

    return (
        <span
            className={`inline-flex h-7 min-w-7 items-center justify-center px-2 font-black ${estilos[value] ||
                "bg-[#E5E7EB] text-[#374151]"
                }`}
        >
            {value}
        </span>
    );
}