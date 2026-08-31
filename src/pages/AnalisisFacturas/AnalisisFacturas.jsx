import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    FileCheck2,
    FileText,
    Filter,
    Loader2,
    Plus,
    ReceiptText,
    RefreshCw,
    Search,
    Trash2,
    UploadCloud,
    UserRound,
    X,
} from "lucide-react";

import vwDark from "../../assets/vw_dark.png";

import {
    apiAnalisisFacturas,
} from "../../lib/apiGestionInversion";


const C = {
    navy: "#131E5C",
    navyDk: "#0A1340",
    surface: "#F7F8FC",
    border: "#E4E7F0",
    borderMd: "#C8CEDF",
    muted: "#8891AD",
    text: "#1A1F3C",
    textSub: "#515778",
};


const CLASIFICACIONES = [
    "Social Media",
    "Posicionamiento",
    "Consumo Interno",
    "Eventos y Prospección",
];


const OPCIONES_POR_CLASIFICACION = {
    "Social Media": [
        "Google ADS",
        "MetaADS",
        "MercadoLibre",
        "TikTok",
        "YouTube",
        "ChatGPT",
    ],

    Posicionamiento: [
        "Costo de Producción Multimedios",
        "Publicitarios Físicos",
        "Folletos",
        "Cartas",
    ],

    "Consumo Interno": [
        "Consumo de alimentos",
        "Instalación",
        "Amenidades",
    ],

    "Eventos y Prospección": [
        "Eventos",
    ],
};


function normalizarListaFacturas(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.results)) {
        return response.results;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    return [];
}


function money(
    value,
    currency = "MXN",
) {
    const numero = Number(
        value || 0,
    );

    try {
        return new Intl.NumberFormat(
            "es-MX",
            {
                style: "currency",
                currency: currency || "MXN",
                maximumFractionDigits: 2,
            },
        ).format(numero);
    } catch {
        return new Intl.NumberFormat(
            "es-MX",
            {
                style: "currency",
                currency: "MXN",
                maximumFractionDigits: 2,
            },
        ).format(numero);
    }
}


function formatBytes(bytes) {
    if (!bytes) {
        return "0 KB";
    }

    const kb = Number(bytes) / 1024;

    if (kb < 1024) {
        return `${kb.toFixed(0)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "es-MX",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            },
        ).format(
            new Date(
                `${value}T12:00:00`,
            ),
        );
    } catch {
        return value;
    }
}


function conceptoCompleto(concepto) {
    return Boolean(
        concepto?.clasificacion &&
        concepto?.sitio &&
        concepto?.motivo?.trim(),
    );
}


function Badge({
    children,
    variant = "default",
    dot = false,
}) {
    const variants = {
        default:
            "bg-gray-100 text-gray-600 border border-gray-200",

        success:
            "bg-emerald-50 text-emerald-700 border border-emerald-200",

        warning:
            "bg-amber-50 text-amber-700 border border-amber-200",

        danger:
            "bg-red-50 text-red-700 border border-red-200",

        info:
            "bg-blue-50 text-blue-700 border border-blue-200",

        navy:
            "bg-[#131E5C]/8 text-[#131E5C] border border-[#131E5C]/10",
    };

    const dots = {
        default: "bg-gray-400",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-red-500",
        info: "bg-blue-500",
        navy: "bg-[#131E5C]",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${variants[variant]}`}
        >
            {dot && (
                <span
                    className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`}
                />
            )}

            {children}
        </span>
    );
}


function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    variant = "navy",
}) {
    const variants = {
        navy:
            "bg-[#131E5C]/8 text-[#131E5C]",

        success:
            "bg-emerald-50 text-emerald-600",

        warning:
            "bg-amber-50 text-amber-600",

        info:
            "bg-blue-50 text-blue-600",
    };

    return (
        <div
            className="rounded-2xl border border-[#E4E7F0] bg-white p-5 transition-shadow hover:shadow-md"
        >
            <div
                className="flex items-start justify-between gap-4"
            >
                <div className="min-w-0">
                    <p
                        className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]"
                    >
                        {label}
                    </p>

                    <p
                        className="mt-1.5 truncate text-2xl font-bold tracking-tight text-[#1A1F3C]"
                    >
                        {value}
                    </p>

                    {sub && (
                        <p
                            className="mt-1 text-xs text-[#8891AD]"
                        >
                            {sub}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${variants[variant]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}


function InfoRow({
    label,
    value,
    mono = false,
}) {
    return (
        <div className="min-w-0">
            <p
                className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]"
            >
                {label}
            </p>

            <p
                className={`mt-1 break-words text-sm font-semibold text-[#1A1F3C] ${mono
                    ? "font-mono text-xs"
                    : ""
                    }`}
            >
                {value || "—"}
            </p>
        </div>
    );
}


function EstadoFacturaBadge({
    estado,
}) {
    if (estado === "procesada") {
        return (
            <Badge
                variant="success"
                dot
            >
                Lectura completa
            </Badge>
        );
    }

    if (estado === "procesando") {
        return (
            <Badge
                variant="info"
                dot
            >
                Procesando
            </Badge>
        );
    }

    if (estado === "error") {
        return (
            <Badge
                variant="danger"
                dot
            >
                Error de lectura
            </Badge>
        );
    }

    return (
        <Badge
            variant="warning"
            dot
        >
            Pendiente
        </Badge>
    );
}


function UploadZone({
    procesando,
    onFiles,
}) {
    const inputRef = useRef(null);

    const [
        dragging,
        setDragging,
    ] = useState(false);

    function procesarArchivos(files) {
        const lista = Array.from(
            files || [],
        );

        if (lista.length) {
            onFiles(lista);
        }
    }

    return (
        <div
            onDragEnter={(event) => {
                event.preventDefault();

                setDragging(true);
            }}
            onDragOver={(event) => {
                event.preventDefault();
            }}
            onDragLeave={(event) => {
                event.preventDefault();

                setDragging(false);
            }}
            onDrop={(event) => {
                event.preventDefault();

                setDragging(false);

                procesarArchivos(
                    event.dataTransfer.files,
                );
            }}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-white transition-all ${dragging
                ? "border-[#131E5C] bg-[#131E5C]/[0.025] shadow-lg shadow-[#131E5C]/5"
                : "border-[#C8CEDF] hover:border-[#131E5C]/50"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                disabled={procesando}
                className="hidden"
                onChange={(event) => {
                    procesarArchivos(
                        event.target.files,
                    );

                    event.target.value = "";
                }}
            />

            <div
                className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center"
            >
                <div className="relative">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131E5C]/8"
                    >
                        {procesando ? (
                            <Loader2
                                className="h-7 w-7 animate-spin text-[#131E5C]"
                            />
                        ) : (
                            <UploadCloud
                                className="h-7 w-7 text-[#131E5C]"
                            />
                        )}
                    </div>

                    {!procesando && (
                        <div
                            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-[#131E5C] text-white"
                        >
                            <Plus
                                className="h-3.5 w-3.5"
                            />
                        </div>
                    )}
                </div>

                <h2
                    className="mt-5 text-lg font-bold text-[#1A1F3C]"
                >
                    {procesando
                        ? "Analizando factura…"
                        : "Sube una factura en PDF"}
                </h2>

                <p
                    className="mt-2 max-w-[300px] text-xs leading-relaxed text-[#8891AD]"
                >
                    Arrastra uno o varios archivos aquí o selecciónalos desde tu equipo.
                </p>

                <button
                    type="button"
                    disabled={procesando}
                    onClick={() => (
                        inputRef.current?.click()
                    )}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#131E5C]/15 transition hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {procesando ? (
                        <Loader2
                            className="h-4 w-4 animate-spin"
                        />
                    ) : (
                        <FileText
                            className="h-4 w-4"
                        />
                    )}

                    {procesando
                        ? "Procesando"
                        : "Seleccionar PDF"}
                </button>

                <div
                    className="mt-5 flex flex-wrap items-center justify-center gap-2"
                >
                    <Badge variant="navy">
                        Solo PDF
                    </Badge>

                    <Badge variant="default">
                        Lectura con IA
                    </Badge>

                    <Badge variant="default">
                        Clasificación manual
                    </Badge>
                </div>
            </div>
        </div>
    );
}


function SelectClasificacion({
    value,
    onChange,
    disabled = false,
}) {
    return (
        <select
            value={value || ""}
            disabled={disabled}
            onChange={(event) => (
                onChange(
                    event.target.value,
                )
            )}
            className="h-9 min-w-[180px] w-full rounded-lg border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#1A1F3C] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F7F8FC] disabled:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
        >
            <option value="">
                Seleccionar
            </option>

            {CLASIFICACIONES.map(
                (item) => (
                    <option
                        key={item}
                        value={item}
                    >
                        {item}
                    </option>
                ),
            )}
        </select>
    );
}


function SelectSitio({
    clasificacion,
    value,
    onChange,
    disabled = false,
}) {
    const opciones = (
        OPCIONES_POR_CLASIFICACION[
        clasificacion
        ] || []
    );

    return (
        <select
            value={value || ""}
            disabled={
                !clasificacion ||
                disabled
            }
            onChange={(event) => (
                onChange(
                    event.target.value,
                )
            )}
            className="h-9 min-w-[190px] w-full rounded-lg border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#1A1F3C] outline-none transition disabled:cursor-not-allowed disabled:bg-[#F7F8FC] disabled:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
        >
            <option value="">
                {clasificacion
                    ? "Seleccionar"
                    : "Primero clasificación"}
            </option>

            {opciones.map(
                (item) => (
                    <option
                        key={item}
                        value={item}
                    >
                        {item}
                    </option>
                ),
            )}
        </select>
    );
}


function ConceptosTable({
    factura,
    onConceptoLocalChange,
    onGuardarCampo,
    guardandoConceptos,
}) {
    const currency = (
        factura?.comprobante?.moneda ||
        "MXN"
    );

    function estaGuardando(conceptoId) {
        return Boolean(
            guardandoConceptos[
            conceptoId
            ],
        );
    }

    return (
        <div
            className="overflow-hidden rounded-xl border border-[#E4E7F0]"
        >
            <div className="overflow-x-auto">
                <table
                    className="min-w-[1380px] w-full border-collapse"
                >
                    <thead>
                        <tr
                            className="bg-[#131E5C] text-white"
                        >
                            <th
                                className="w-12 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider"
                            >
                                #
                            </th>

                            <th
                                className="min-w-[280px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                            >
                                Concepto / especificación
                            </th>

                            <th
                                className="w-24 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider"
                            >
                                Cantidad
                            </th>

                            <th
                                className="w-32 px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider"
                            >
                                P. unitario
                            </th>

                            <th
                                className="w-32 px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider"
                            >
                                Importe
                            </th>

                            <th
                                className="min-w-[190px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                            >
                                Clasificación
                            </th>

                            <th
                                className="min-w-[210px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                            >
                                Sitio / rubro
                            </th>

                            <th
                                className="min-w-[300px] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                            >
                                Motivo
                            </th>

                            <th
                                className="w-28 px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider"
                            >
                                Estado
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {(factura.conceptos || []).map(
                            (
                                concepto,
                                index,
                            ) => {
                                const completo = (
                                    conceptoCompleto(
                                        concepto,
                                    )
                                );

                                const guardando = (
                                    estaGuardando(
                                        concepto.id,
                                    )
                                );

                                return (
                                    <tr
                                        key={
                                            concepto.id
                                        }
                                        className={`border-b border-[#E4E7F0] align-top transition-colors hover:bg-[#F7F8FC] ${index % 2
                                            ? "bg-[#FCFCFE]"
                                            : "bg-white"
                                            }`}
                                    >
                                        <td
                                            className="px-3 py-4 text-center"
                                        >
                                            <div
                                                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#131E5C]/8 text-xs font-extrabold text-[#131E5C]"
                                            >
                                                {index + 1}
                                            </div>
                                        </td>

                                        <td
                                            className="px-3 py-4"
                                        >
                                            <p
                                                className="text-sm font-bold leading-snug text-[#1A1F3C]"
                                            >
                                                {concepto.descripcion ||
                                                    "Sin descripción"}
                                            </p>

                                            <div
                                                className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#8891AD]"
                                            >
                                                <span>
                                                    Clave:{" "}
                                                    <b
                                                        className="font-semibold text-[#515778]"
                                                    >
                                                        {concepto.clave ||
                                                            "—"}
                                                    </b>
                                                </span>

                                                <span>
                                                    Unidad:{" "}
                                                    <b
                                                        className="font-semibold text-[#515778]"
                                                    >
                                                        {concepto.unidad ||
                                                            "—"}
                                                    </b>
                                                </span>
                                            </div>
                                        </td>

                                        <td
                                            className="px-3 py-4 text-center text-sm font-semibold text-[#515778]"
                                        >
                                            {concepto.cantidad}
                                        </td>

                                        <td
                                            className="whitespace-nowrap px-3 py-4 text-right text-sm font-semibold text-[#515778]"
                                        >
                                            {money(
                                                concepto.precioUnitario,
                                                currency,
                                            )}
                                        </td>

                                        <td
                                            className="whitespace-nowrap px-3 py-4 text-right text-sm font-extrabold text-[#1A1F3C]"
                                        >
                                            {money(
                                                concepto.importe,
                                                currency,
                                            )}
                                        </td>

                                        <td
                                            className="px-3 py-3"
                                        >
                                            <SelectClasificacion
                                                value={
                                                    concepto.clasificacion
                                                }
                                                disabled={
                                                    guardando
                                                }
                                                onChange={async (
                                                    valor,
                                                ) => {
                                                    onConceptoLocalChange(
                                                        factura.id,
                                                        concepto.id,
                                                        {
                                                            clasificacion:
                                                                valor,
                                                            sitio: "",
                                                        },
                                                    );

                                                    await onGuardarCampo(
                                                        factura.id,
                                                        concepto.id,
                                                        {
                                                            clasificacion:
                                                                valor,
                                                            sitio: "",
                                                        },
                                                    );
                                                }}
                                            />
                                        </td>

                                        <td
                                            className="px-3 py-3"
                                        >
                                            <SelectSitio
                                                clasificacion={
                                                    concepto.clasificacion
                                                }
                                                value={
                                                    concepto.sitio
                                                }
                                                disabled={
                                                    guardando
                                                }
                                                onChange={async (
                                                    valor,
                                                ) => {
                                                    onConceptoLocalChange(
                                                        factura.id,
                                                        concepto.id,
                                                        {
                                                            sitio:
                                                                valor,
                                                        },
                                                    );

                                                    await onGuardarCampo(
                                                        factura.id,
                                                        concepto.id,
                                                        {
                                                            sitio:
                                                                valor,
                                                        },
                                                    );
                                                }}
                                            />
                                        </td>

                                        <td
                                            className="px-3 py-3"
                                        >
                                            <textarea
                                                value={
                                                    concepto.motivo ||
                                                    ""
                                                }
                                                disabled={
                                                    guardando
                                                }
                                                onChange={(
                                                    event,
                                                ) => {
                                                    onConceptoLocalChange(
                                                        factura.id,
                                                        concepto.id,
                                                        {
                                                            motivo:
                                                                event
                                                                    .target
                                                                    .value,
                                                        },
                                                    );
                                                }}
                                                onBlur={async (
                                                    event,
                                                ) => {
                                                    await onGuardarCampo(
                                                        factura.id,
                                                        concepto.id,
                                                        {
                                                            motivo:
                                                                event
                                                                    .target
                                                                    .value,
                                                        },
                                                    );
                                                }}
                                                rows={2}
                                                placeholder="Motivo / justificación del gasto…"
                                                className="min-h-[58px] w-full resize-y rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-xs text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] disabled:bg-[#F7F8FC] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                            />
                                        </td>

                                        <td
                                            className="px-3 py-4 text-center"
                                        >
                                            {guardando ? (
                                                <Badge
                                                    variant="info"
                                                >
                                                    <Loader2
                                                        className="h-3 w-3 animate-spin"
                                                    />
                                                    Guardando
                                                </Badge>
                                            ) : completo ? (
                                                <Badge
                                                    variant="success"
                                                    dot
                                                >
                                                    Clasificado
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="warning"
                                                >
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            },
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function FacturaCard({
    factura,
    onDelete,
    onReanalizar,
    onConceptoLocalChange,
    onGuardarCampo,
    guardandoConceptos,
    reanalizando,
}) {
    const [
        open,
        setOpen,
    ] = useState(true);

    const conceptos = (
        Array.isArray(
            factura.conceptos,
        )
            ? factura.conceptos
            : []
    );

    const completos = (
        conceptos.filter(
            conceptoCompleto,
        ).length
    );

    const currency = (
        factura?.comprobante?.moneda ||
        "MXN"
    );

    const emisor = (
        factura.emisor || {}
    );

    const receptor = (
        factura.receptor || {}
    );

    const comprobante = (
        factura.comprobante || {}
    );

    const totales = (
        factura.totales || {}
    );

    return (
        <div
            className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm"
        >
            <div
                className="border-b border-[#E4E7F0] px-5 py-4"
            >
                <div
                    className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div
                        className="flex min-w-0 items-start gap-3"
                    >
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50"
                        >
                            <FileText
                                className="h-5 w-5 text-red-600"
                            />
                        </div>

                        <div className="min-w-0">
                            <div
                                className="flex flex-wrap items-center gap-2"
                            >
                                <h3
                                    className="truncate text-base font-bold text-[#1A1F3C]"
                                >
                                    {factura.archivo}
                                </h3>

                                <EstadoFacturaBadge
                                    estado={
                                        factura.estado
                                    }
                                />
                            </div>

                            <p
                                className="mt-1 text-xs text-[#8891AD]"
                            >
                                {formatBytes(
                                    factura.archivoSize,
                                )}
                                {" · "}
                                {conceptos.length} conceptos
                                {" · "}
                                {completos} clasificados
                            </p>
                        </div>
                    </div>

                    <div
                        className="flex items-center gap-2 self-end lg:self-auto"
                    >
                        <button
                            type="button"
                            disabled={
                                reanalizando
                            }
                            onClick={
                                onReanalizar
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] transition hover:bg-[#F7F8FC] disabled:opacity-50"
                        >
                            {reanalizando ? (
                                <Loader2
                                    className="h-3.5 w-3.5 animate-spin"
                                />
                            ) : (
                                <RefreshCw
                                    className="h-3.5 w-3.5"
                                />
                            )}

                            Reanalizar
                        </button>

                        <button
                            type="button"
                            onClick={() => (
                                setOpen(
                                    (value) =>
                                        !value,
                                )
                            )}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] transition hover:bg-[#F7F8FC]"
                        >
                            {open
                                ? "Contraer"
                                : "Ver detalle"}

                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${open
                                    ? "rotate-180"
                                    : ""
                                    }`}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={
                                onDelete
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            title="Eliminar factura"
                        >
                            <Trash2
                                className="h-4 w-4"
                            />
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div>
                    {factura.estado ===
                        "error" && (
                            <div
                                className="border-b border-red-200 bg-red-50 px-5 py-4"
                            >
                                <div
                                    className="flex items-start gap-3"
                                >
                                    <AlertCircle
                                        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                                    />

                                    <div>
                                        <p
                                            className="text-sm font-bold text-red-700"
                                        >
                                            No fue posible analizar esta factura
                                        </p>

                                        <p
                                            className="mt-1 text-xs text-red-600"
                                        >
                                            {factura.errorAnalisis ||
                                                "Gemini no pudo procesar correctamente el documento."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    <div
                        className="grid gap-4 border-b border-[#E4E7F0] bg-[#FAFBFD] p-5 xl:grid-cols-[1fr_1fr_320px]"
                    >
                        <div
                            className="rounded-xl border border-[#E4E7F0] bg-white p-4"
                        >
                            <div
                                className="mb-4 flex items-center gap-3"
                            >
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8"
                                >
                                    <Building2
                                        className="h-4 w-4 text-[#131E5C]"
                                    />
                                </div>

                                <div>
                                    <p
                                        className="text-sm font-bold text-[#1A1F3C]"
                                    >
                                        Emisor
                                    </p>

                                    <p
                                        className="text-xs text-[#8891AD]"
                                    >
                                        Datos fiscales detectados
                                    </p>
                                </div>
                            </div>

                            <div
                                className="grid gap-4 sm:grid-cols-2"
                            >
                                <div
                                    className="sm:col-span-2"
                                >
                                    <InfoRow
                                        label="Razón social"
                                        value={
                                            emisor.razonSocial
                                        }
                                    />
                                </div>

                                <InfoRow
                                    label="RFC"
                                    value={
                                        emisor.rfc
                                    }
                                    mono
                                />

                                <InfoRow
                                    label="Régimen"
                                    value={
                                        emisor.regimenFiscal
                                    }
                                />

                                <div
                                    className="sm:col-span-2"
                                >
                                    <InfoRow
                                        label="Domicilio"
                                        value={
                                            emisor.domicilio
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            className="rounded-xl border border-[#E4E7F0] bg-white p-4"
                        >
                            <div
                                className="mb-4 flex items-center gap-3"
                            >
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8"
                                >
                                    <UserRound
                                        className="h-4 w-4 text-[#131E5C]"
                                    />
                                </div>

                                <div>
                                    <p
                                        className="text-sm font-bold text-[#1A1F3C]"
                                    >
                                        Receptor
                                    </p>

                                    <p
                                        className="text-xs text-[#8891AD]"
                                    >
                                        Empresa que registra el gasto
                                    </p>
                                </div>
                            </div>

                            <div
                                className="grid gap-4 sm:grid-cols-2"
                            >
                                <div
                                    className="sm:col-span-2"
                                >
                                    <InfoRow
                                        label="Razón social"
                                        value={
                                            receptor.razonSocial
                                        }
                                    />
                                </div>

                                <InfoRow
                                    label="RFC"
                                    value={
                                        receptor.rfc
                                    }
                                    mono
                                />

                                <InfoRow
                                    label="Uso CFDI"
                                    value={
                                        receptor.usoCfdi
                                    }
                                />
                            </div>
                        </div>

                        <div
                            className="rounded-xl border border-[#131E5C]/10 bg-[#131E5C] p-4 text-white"
                        >
                            <p
                                className="text-[10px] font-semibold uppercase tracking-widest text-white/60"
                            >
                                Total factura
                            </p>

                            <p
                                className="mt-2 text-3xl font-extrabold tracking-tight"
                            >
                                {money(
                                    totales.total,
                                    currency,
                                )}
                            </p>

                            <div
                                className="mt-5 space-y-2 border-t border-white/15 pt-4"
                            >
                                <div
                                    className="flex justify-between gap-4 text-xs"
                                >
                                    <span
                                        className="text-white/60"
                                    >
                                        Subtotal
                                    </span>

                                    <span
                                        className="font-semibold"
                                    >
                                        {money(
                                            totales.subtotal,
                                            currency,
                                        )}
                                    </span>
                                </div>

                                <div
                                    className="flex justify-between gap-4 text-xs"
                                >
                                    <span
                                        className="text-white/60"
                                    >
                                        Impuestos
                                    </span>

                                    <span
                                        className="font-semibold"
                                    >
                                        {money(
                                            totales.impuestos,
                                            currency,
                                        )}
                                    </span>
                                </div>

                                <div
                                    className="flex justify-between gap-4 text-xs"
                                >
                                    <span
                                        className="text-white/60"
                                    >
                                        Moneda
                                    </span>

                                    <span
                                        className="font-semibold"
                                    >
                                        {currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="border-b border-[#E4E7F0] px-5 py-4"
                    >
                        <div
                            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
                        >
                            <InfoRow
                                label="UUID"
                                value={
                                    comprobante.uuid
                                }
                                mono
                            />

                            <InfoRow
                                label="Folio"
                                value={
                                    comprobante.folio
                                }
                            />

                            <InfoRow
                                label="Fecha"
                                value={formatDate(
                                    comprobante.fecha,
                                )}
                            />

                            <InfoRow
                                label="Método de pago"
                                value={
                                    comprobante.metodoPago
                                }
                            />

                            <InfoRow
                                label="Forma de pago"
                                value={
                                    comprobante.formaPago
                                }
                            />
                        </div>
                    </div>

                    <div className="p-5">
                        <div
                            className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <h4
                                    className="text-sm font-bold text-[#1A1F3C]"
                                >
                                    Conceptos de la factura
                                </h4>

                                <p
                                    className="mt-0.5 text-xs text-[#8891AD]"
                                >
                                    Los datos fiscales son extraídos por IA. Clasificación, rubro y motivo son capturados manualmente.
                                </p>
                            </div>

                            <Badge
                                variant={
                                    conceptos.length >
                                        0 &&
                                        completos ===
                                        conceptos.length
                                        ? "success"
                                        : "warning"
                                }
                            >
                                {completos}/
                                {conceptos.length}{" "}
                                clasificados
                            </Badge>
                        </div>

                        {conceptos.length >
                            0 ? (
                            <ConceptosTable
                                factura={
                                    factura
                                }
                                onConceptoLocalChange={
                                    onConceptoLocalChange
                                }
                                onGuardarCampo={
                                    onGuardarCampo
                                }
                                guardandoConceptos={
                                    guardandoConceptos
                                }
                            />
                        ) : (
                            <div
                                className="rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] px-6 py-10 text-center"
                            >
                                <FileCheck2
                                    className="mx-auto h-6 w-6 text-[#8891AD]"
                                />

                                <p
                                    className="mt-2 text-sm font-bold text-[#515778]"
                                >
                                    Sin conceptos detectados
                                </p>

                                <p
                                    className="mt-1 text-xs text-[#8891AD]"
                                >
                                    Puedes intentar analizar nuevamente el PDF.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function AnalisisFacturas() {
    const [
        facturas,
        setFacturas,
    ] = useState([]);

    const [
        cargando,
        setCargando,
    ] = useState(true);

    const [
        procesando,
        setProcesando,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        mensaje,
        setMensaje,
    ] = useState("");

    const [
        q,
        setQ,
    ] = useState("");

    const [
        filtroClasificacion,
        setFiltroClasificacion,
    ] = useState("");

    const [
        filtroSitio,
        setFiltroSitio,
    ] = useState("");

    const [
        guardandoConceptos,
        setGuardandoConceptos,
    ] = useState({});

    const [
        reanalizandoFacturas,
        setReanalizandoFacturas,
    ] = useState({});


    const cargarFacturas = useCallback(
        async () => {
            setCargando(true);
            setError("");

            try {
                const response = (
                    await apiAnalisisFacturas.list()
                );

                setFacturas(
                    normalizarListaFacturas(
                        response,
                    ),
                );
            } catch (e) {
                setFacturas([]);

                setError(
                    e?.message ||
                    "No fue posible cargar las facturas.",
                );
            } finally {
                setCargando(false);
            }
        },
        [],
    );


    useEffect(() => {
        cargarFacturas();
    }, [
        cargarFacturas,
    ]);


    const sitiosFiltro = useMemo(
        () => {
            if (
                filtroClasificacion
            ) {
                return (
                    OPCIONES_POR_CLASIFICACION[
                    filtroClasificacion
                    ] || []
                );
            }

            return [
                ...new Set(
                    Object.values(
                        OPCIONES_POR_CLASIFICACION,
                    ).flat(),
                ),
            ];
        },
        [
            filtroClasificacion,
        ],
    );


    const facturasFiltradas =
        useMemo(
            () => {
                const query = (
                    q
                        .trim()
                        .toLowerCase()
                );

                return facturas.filter(
                    (factura) => {
                        const conceptos = (
                            Array.isArray(
                                factura.conceptos,
                            )
                                ? factura.conceptos
                                : []
                        );

                        const textoBusqueda = [
                            factura.archivo,
                            factura.emisor
                                ?.razonSocial,
                            factura.emisor?.rfc,
                            factura.receptor
                                ?.razonSocial,
                            factura.receptor
                                ?.rfc,
                            factura.comprobante
                                ?.folio,
                            factura.comprobante
                                ?.uuid,

                            ...conceptos.map(
                                (concepto) =>
                                    concepto.descripcion,
                            ),

                            ...conceptos.map(
                                (concepto) =>
                                    concepto.clasificacion,
                            ),

                            ...conceptos.map(
                                (concepto) =>
                                    concepto.sitio,
                            ),
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                        const coincideTexto = (
                            !query ||
                            textoBusqueda.includes(
                                query,
                            )
                        );

                        const coincideClasificacion = (
                            !filtroClasificacion ||
                            conceptos.some(
                                (
                                    concepto,
                                ) =>
                                    concepto.clasificacion ===
                                    filtroClasificacion,
                            )
                        );

                        const coincideSitio = (
                            !filtroSitio ||
                            conceptos.some(
                                (
                                    concepto,
                                ) =>
                                    concepto.sitio ===
                                    filtroSitio,
                            )
                        );

                        return (
                            coincideTexto &&
                            coincideClasificacion &&
                            coincideSitio
                        );
                    },
                );
            },
            [
                facturas,
                q,
                filtroClasificacion,
                filtroSitio,
            ],
        );


    const totalFacturado =
        useMemo(
            () =>
                facturas.reduce(
                    (
                        acumulado,
                        factura,
                    ) =>
                        acumulado +
                        Number(
                            factura
                                ?.totales
                                ?.total ||
                            0,
                        ),
                    0,
                ),
            [
                facturas,
            ],
        );


    const totalConceptos =
        useMemo(
            () =>
                facturas.reduce(
                    (
                        acumulado,
                        factura,
                    ) =>
                        acumulado +
                        (
                            factura
                                .conceptos
                                ?.length ||
                            0
                        ),
                    0,
                ),
            [
                facturas,
            ],
        );


    const conceptosClasificados =
        useMemo(
            () =>
                facturas.reduce(
                    (
                        acumulado,
                        factura,
                    ) =>
                        acumulado +
                        (
                            factura.conceptos ||
                            []
                        ).filter(
                            conceptoCompleto,
                        ).length,
                    0,
                ),
            [
                facturas,
            ],
        );


    async function handleFiles(
        files,
    ) {
        setError("");
        setMensaje("");

        const lista = Array.from(
            files || [],
        );

        if (!lista.length) {
            return;
        }

        const invalidos = (
            lista.filter(
                (file) =>
                    file.type !==
                    "application/pdf" &&
                    !file.name
                        .toLowerCase()
                        .endsWith(".pdf"),
            )
        );

        if (
            invalidos.length >
            0
        ) {
            setError(
                "Solo se permiten archivos PDF para el lector de facturas.",
            );

            return;
        }

        setProcesando(true);

        let correctas = 0;

        const errores = [];

        try {
            /*
             * Se procesan secuencialmente.
             *
             * No usamos Promise.all() deliberadamente para evitar mandar
             * 10 facturas simultáneas a Gemini y saturar el backend/proveedor.
             */
            for (
                const archivo of lista
            ) {
                try {
                    await apiAnalisisFacturas.analizar(
                        archivo,
                    );

                    correctas += 1;
                } catch (e) {
                    errores.push(
                        `${archivo.name}: ${e?.message ||
                        "No fue posible analizar."
                        }`,
                    );
                }
            }

            await cargarFacturas();

            if (
                correctas > 0
            ) {
                setMensaje(
                    correctas === 1
                        ? "Factura analizada correctamente."
                        : `${correctas} facturas analizadas correctamente.`,
                );
            }

            if (
                errores.length > 0
            ) {
                setError(
                    errores.join(
                        " | ",
                    ),
                );
            }
        } finally {
            setProcesando(false);
        }
    }


    async function eliminarFactura(
        facturaId,
    ) {
        const factura = (
            facturas.find(
                (item) =>
                    item.id ===
                    facturaId,
            )
        );

        const confirmar =
            window.confirm(
                `¿Eliminar ${factura?.archivo ||
                "esta factura"
                }? También se eliminará el PDF almacenado.`,
            );

        if (!confirmar) {
            return;
        }

        setError("");
        setMensaje("");

        try {
            await apiAnalisisFacturas.remove(
                facturaId,
            );

            setFacturas(
                (prev) =>
                    prev.filter(
                        (item) =>
                            item.id !==
                            facturaId,
                    ),
            );

            setMensaje(
                "Factura eliminada correctamente.",
            );
        } catch (e) {
            setError(
                e?.message ||
                "No fue posible eliminar la factura.",
            );
        }
    }


    async function reanalizarFactura(
        facturaId,
    ) {
        setError("");
        setMensaje("");

        setReanalizandoFacturas(
            (prev) => ({
                ...prev,
                [facturaId]: true,
            }),
        );

        try {
            const facturaActualizada =
                await apiAnalisisFacturas.reanalizar(
                    facturaId,
                );

            setFacturas(
                (prev) =>
                    prev.map(
                        (factura) =>
                            factura.id ===
                                facturaId
                                ? facturaActualizada
                                : factura,
                    ),
            );

            setMensaje(
                "Factura analizada nuevamente.",
            );
        } catch (e) {
            setError(
                e?.message ||
                "No fue posible volver a analizar la factura.",
            );

            await cargarFacturas();
        } finally {
            setReanalizandoFacturas(
                (prev) => ({
                    ...prev,
                    [facturaId]:
                        false,
                }),
            );
        }
    }


    function actualizarConceptoLocal(
        facturaId,
        conceptoId,
        cambios,
    ) {
        setFacturas(
            (prev) =>
                prev.map(
                    (factura) => {
                        if (
                            factura.id !==
                            facturaId
                        ) {
                            return factura;
                        }

                        return {
                            ...factura,

                            conceptos: (
                                factura.conceptos ||
                                []
                            ).map(
                                (
                                    concepto,
                                ) =>
                                    concepto.id ===
                                        conceptoId
                                        ? {
                                            ...concepto,
                                            ...cambios,
                                        }
                                        : concepto,
                            ),
                        };
                    },
                ),
        );
    }


    async function guardarCampoConcepto(
        facturaId,
        conceptoId,
        cambios,
    ) {
        setError("");

        setGuardandoConceptos(
            (prev) => ({
                ...prev,
                [conceptoId]:
                    true,
            }),
        );

        try {
            const conceptoActualizado =
                await apiAnalisisFacturas.updateConcepto(
                    conceptoId,
                    cambios,
                );

            actualizarConceptoLocal(
                facturaId,
                conceptoId,
                conceptoActualizado,
            );
        } catch (e) {
            setError(
                e?.message ||
                "No fue posible guardar la clasificación del concepto.",
            );

            /*
             * Volvemos a consultar porque hicimos actualización optimista.
             * Si el backend rechazó el cambio, recuperamos el valor real.
             */
            await cargarFacturas();
        } finally {
            setGuardandoConceptos(
                (prev) => ({
                    ...prev,
                    [conceptoId]:
                        false,
                }),
            );
        }
    }


    function cambiarFiltroClasificacion(
        valor,
    ) {
        setFiltroClasificacion(
            valor,
        );

        setFiltroSitio("");
    }


    function limpiarFiltros() {
        setQ("");

        setFiltroClasificacion(
            "",
        );

        setFiltroSitio("");
    }


    const hayFiltros = Boolean(
        q ||
        filtroClasificacion ||
        filtroSitio,
    );


    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor:
                    C.surface,
            }}
        >
            <header
                className="sticky top-0 z-40 w-full border-b bg-white"
                style={{
                    borderColor:
                        "#131E5C22",
                }}
            >
                <div
                    className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8"
                >
                    <div
                        className="flex shrink-0 items-center gap-3 md:gap-4"
                    >
                        <img
                            src={vwDark}
                            alt="Volkswagen"
                            className="h-16 w-16 object-contain md:h-20 md:w-20"
                            loading="lazy"
                        />

                        <div
                            className="text-[23px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                            style={{
                                color:
                                    C.navy,
                            }}
                        >
                            Gestión de la inversión
                        </div>
                    </div>

                    <div
                        className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                        style={{
                            background:
                                C.navy,
                        }}
                    />

                    <button
                        type="button"
                        disabled={
                            cargando
                        }
                        onClick={
                            cargarFacturas
                        }
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-4 text-xs font-bold text-[#515778] transition hover:bg-[#F7F8FC] disabled:opacity-50"
                    >
                        {cargando ? (
                            <Loader2
                                className="h-4 w-4 animate-spin"
                            />
                        ) : (
                            <RefreshCw
                                className="h-4 w-4"
                            />
                        )}

                        <span
                            className="hidden sm:inline"
                        >
                            Actualizar
                        </span>
                    </button>
                </div>
            </header>

            <main
                className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8"
            >
                {mensaje && (
                    <div
                        className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                    >
                        <CheckCircle2
                            className="h-4 w-4 shrink-0 text-emerald-600"
                        />

                        <p
                            className="flex-1 text-sm font-semibold text-emerald-700"
                        >
                            {mensaje}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setMensaje(
                                    "",
                                )
                            }
                            className="text-emerald-600 hover:text-emerald-800"
                        >
                            <X
                                className="h-4 w-4"
                            />
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                        <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                        />

                        <div
                            className="flex-1"
                        >
                            <p
                                className="text-sm font-bold text-red-700"
                            >
                                Ocurrió un problema
                            </p>

                            <p
                                className="mt-0.5 text-xs text-red-600"
                            >
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError(
                                    "",
                                )
                            }
                            className="text-red-500 hover:text-red-700"
                        >
                            <X
                                className="h-4 w-4"
                            />
                        </button>
                    </div>
                )}

                <section
                    className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4"
                >
                    <StatCard
                        label="Facturas cargadas"
                        value={
                            facturas.length
                        }
                        sub="Documentos disponibles"
                        icon={
                            ReceiptText
                        }
                    />

                    <StatCard
                        label="Conceptos detectados"
                        value={
                            totalConceptos
                        }
                        sub="Partidas listas para revisar"
                        icon={
                            FileCheck2
                        }
                        variant="info"
                    />

                    <StatCard
                        label="Clasificación"
                        value={`${conceptosClasificados}/${totalConceptos}`}
                        sub="Clasificación, rubro y motivo"
                        icon={
                            CheckCircle2
                        }
                        variant="success"
                    />

                    <StatCard
                        label="Total leído"
                        value={money(
                            totalFacturado,
                        )}
                        sub="Total de gastos registrados"
                        icon={
                            CircleDollarSign
                        }
                        variant="warning"
                    />
                </section>

                <section
                    className="grid gap-5 xl:grid-cols-[390px_1fr]"
                >
                    <aside
                        className="space-y-4 xl:sticky xl:top-[102px] xl:self-start"
                    >
                        <UploadZone
                            procesando={
                                procesando
                            }
                            onFiles={
                                handleFiles
                            }
                        />

                        <div
                            className="rounded-2xl border border-[#E4E7F0] bg-white p-4"
                        >
                            <div
                                className="mb-3 flex items-center gap-2"
                            >
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#131E5C]/8"
                                >
                                    <Filter
                                        className="h-4 w-4 text-[#131E5C]"
                                    />
                                </div>

                                <div>
                                    <p
                                        className="text-sm font-bold text-[#1A1F3C]"
                                    >
                                        Filtros
                                    </p>

                                    <p
                                        className="text-[11px] text-[#8891AD]"
                                    >
                                        Filtra facturas por sus conceptos
                                    </p>
                                </div>
                            </div>

                            <div
                                className="space-y-3"
                            >
                                <div>
                                    <label
                                        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]"
                                    >
                                        Clasificación
                                    </label>

                                    <select
                                        value={
                                            filtroClasificacion
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            cambiarFiltroClasificacion(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#1A1F3C] outline-none transition focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                    >
                                        <option value="">
                                            Todas las clasificaciones
                                        </option>

                                        {CLASIFICACIONES.map(
                                            (
                                                item,
                                            ) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    {
                                                        item
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]"
                                    >
                                        Sitio / rubro
                                    </label>

                                    <select
                                        value={
                                            filtroSitio
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setFiltroSitio(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#1A1F3C] outline-none transition focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                    >
                                        <option value="">
                                            Todos los sitios / rubros
                                        </option>

                                        {sitiosFiltro.map(
                                            (
                                                item,
                                            ) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    {
                                                        item
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                {hayFiltros && (
                                    <button
                                        type="button"
                                        onClick={
                                            limpiarFiltros
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] px-4 py-2.5 text-xs font-bold text-[#515778] transition hover:border-[#C8CEDF] hover:bg-white"
                                    >
                                        <X
                                            className="h-3.5 w-3.5"
                                        />

                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>

                    <div
                        className="min-w-0 space-y-4"
                    >
                        <div
                            className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
                        >
                            <div>
                                <h2
                                    className="text-lg font-bold text-[#1A1F3C]"
                                >
                                    Facturas analizadas
                                </h2>

                                <p
                                    className="mt-0.5 text-xs text-[#8891AD]"
                                >
                                    {
                                        facturasFiltradas.length
                                    }{" "}
                                    de{" "}
                                    {
                                        facturas.length
                                    }{" "}
                                    facturas visibles
                                </p>
                            </div>

                            <div
                                className="relative w-full lg:w-80"
                            >
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]"
                                />

                                <input
                                    value={q}
                                    onChange={(
                                        event,
                                    ) =>
                                        setQ(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Buscar RFC, emisor, folio, concepto…"
                                    className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white pl-9 pr-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                />
                            </div>
                        </div>

                        {(filtroClasificacion ||
                            filtroSitio) && (
                                <div
                                    className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-4 py-3"
                                >
                                    <span
                                        className="text-[11px] font-semibold text-[#8891AD]"
                                    >
                                        Filtros activos:
                                    </span>

                                    {filtroClasificacion && (
                                        <Badge variant="navy">
                                            {
                                                filtroClasificacion
                                            }
                                        </Badge>
                                    )}

                                    {filtroSitio && (
                                        <Badge variant="info">
                                            {
                                                filtroSitio
                                            }
                                        </Badge>
                                    )}
                                </div>
                            )}

                        {cargando ? (
                            <div
                                className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-20 text-center"
                            >
                                <Loader2
                                    className="mx-auto h-7 w-7 animate-spin text-[#131E5C]"
                                />

                                <p
                                    className="mt-3 text-sm font-bold text-[#1A1F3C]"
                                >
                                    Cargando facturas…
                                </p>
                            </div>
                        ) : facturasFiltradas.length ===
                            0 ? (
                            <div
                                className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-16 text-center"
                            >
                                <div
                                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F8FC]"
                                >
                                    <ReceiptText
                                        className="h-6 w-6 text-[#8891AD]"
                                    />
                                </div>

                                <p
                                    className="mt-4 text-sm font-bold text-[#1A1F3C]"
                                >
                                    {hayFiltros
                                        ? "No hay coincidencias"
                                        : "Aún no hay facturas"}
                                </p>

                                <p
                                    className="mt-1 text-xs text-[#8891AD]"
                                >
                                    {hayFiltros
                                        ? "Prueba modificando la búsqueda o los filtros."
                                        : "Sube un PDF para iniciar el análisis con Gemini."}
                                </p>
                            </div>
                        ) : (
                            facturasFiltradas.map(
                                (
                                    factura,
                                ) => (
                                    <FacturaCard
                                        key={
                                            factura.id
                                        }
                                        factura={
                                            factura
                                        }
                                        onDelete={() =>
                                            eliminarFactura(
                                                factura.id,
                                            )
                                        }
                                        onReanalizar={() =>
                                            reanalizarFactura(
                                                factura.id,
                                            )
                                        }
                                        reanalizando={Boolean(
                                            reanalizandoFacturas[
                                            factura
                                                .id
                                            ],
                                        )}
                                        onConceptoLocalChange={
                                            actualizarConceptoLocal
                                        }
                                        onGuardarCampo={
                                            guardarCampoConcepto
                                        }
                                        guardandoConceptos={
                                            guardandoConceptos
                                        }
                                    />
                                ),
                            )
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}