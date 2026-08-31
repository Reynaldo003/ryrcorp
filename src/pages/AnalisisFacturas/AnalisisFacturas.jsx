import { useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    FileCheck2,
    FileText,
    Loader2,
    MoreHorizontal,
    Plus,
    ReceiptText,
    Search,
    Sparkles,
    Trash2,
    UploadCloud,
    UserRound,
    X,
} from "lucide-react";
import vwDark from "../../assets/vw_dark.png";

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

const CARGOS = [
    "",
    "Publicidad digital",
    "Eventos",
    "Material POP",
    "Producción audiovisual",
    "Impresos",
    "Patrocinios",
    "Herramientas / Software",
    "Honorarios",
    "Otros",
];

const facturaDemo = {
    id: "factura-demo-1",
    archivo: "factura_meta_agosto_2026.pdf",
    archivoSize: 248392,
    estado: "procesada",
    fechaCarga: new Date().toISOString(),
    emisor: {
        razonSocial: "META PLATFORMS IRELAND LIMITED",
        rfc: "XEXX010101000",
        regimenFiscal: "Residente en el extranjero",
        domicilio: "Merrion Road, Dublin 4, Irlanda",
    },
    receptor: {
        razonSocial: "GRUPO AUTOMOTRIZ R&R",
        rfc: "GAR000000XXX",
        usoCfdi: "G03 - Gastos en general",
    },
    comprobante: {
        uuid: "A18F4B1D-82A7-4CD3-A98D-12B7B00E2031",
        folio: "FB-2026-0834",
        fecha: "2026-08-26",
        moneda: "MXN",
        metodoPago: "PUE",
        formaPago: "03 - Transferencia electrónica",
    },
    totales: {
        subtotal: 42680,
        impuestos: 6828.8,
        total: 49508.8,
    },
    conceptos: [
        {
            id: "concepto-1",
            clave: "82101603",
            descripcion: "Campaña digital Meta Ads - generación de prospectos",
            cantidad: 1,
            unidad: "Servicio",
            precioUnitario: 24500,
            importe: 24500,
            cargo: "Publicidad digital",
            motivo: "Campaña de generación de leads para vehículos nuevos.",
        },
        {
            id: "concepto-2",
            clave: "82101603",
            descripcion: "Optimización y pauta de campaña de remarketing",
            cantidad: 1,
            unidad: "Servicio",
            precioUnitario: 18180,
            importe: 18180,
            cargo: "",
            motivo: "",
        },
    ],
};

function money(value, currency = "MXN") {
    const numero = Number(value || 0);
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(numero);
}

function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
}

function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(`${value}T12:00:00`));
}

function Badge({ children, variant = "default", dot = false }) {
    const variants = {
        default: "bg-gray-100 text-gray-600 border border-gray-200",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        info: "bg-blue-50 text-blue-700 border border-blue-200",
        navy: "bg-[#131E5C]/8 text-[#131E5C] border border-[#131E5C]/10",
    };

    const dots = {
        default: "bg-gray-400",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        info: "bg-blue-500",
        navy: "bg-[#131E5C]",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${variants[variant]}`}
        >
            {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`} />}
            {children}
        </span>
    );
}

function StatCard({ label, value, sub, icon: Icon, variant = "navy" }) {
    const variants = {
        navy: "bg-[#131E5C]/8 text-[#131E5C]",
        success: "bg-emerald-50 text-emerald-600",
        warning: "bg-amber-50 text-amber-600",
        info: "bg-blue-50 text-blue-600",
    };

    return (
        <div className="rounded-2xl border border-[#E4E7F0] bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8891AD]">
                        {label}
                    </p>
                    <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-[#1A1F3C]">
                        {value}
                    </p>
                    {sub && <p className="mt-1 text-xs text-[#8891AD]">{sub}</p>}
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

function InfoRow({ label, value, mono = false }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">
                {label}
            </p>
            <p
                className={`mt-1 break-words text-sm font-semibold text-[#1A1F3C] ${mono ? "font-mono text-xs" : ""
                    }`}
            >
                {value || "—"}
            </p>
        </div>
    );
}

function UploadZone({ procesando, onFiles }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    function procesarArchivos(files) {
        const lista = Array.from(files || []);
        if (lista.length) onFiles(lista);
    }

    return (
        <div
            onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
                e.preventDefault();
                setDragging(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                procesarArchivos(e.dataTransfer.files);
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
                className="hidden"
                onChange={(e) => {
                    procesarArchivos(e.target.files);
                    e.target.value = "";
                }}
            />

            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131E5C]/8">
                        {procesando ? (
                            <Loader2 className="h-7 w-7 animate-spin text-[#131E5C]" />
                        ) : (
                            <UploadCloud className="h-7 w-7 text-[#131E5C]" />
                        )}
                    </div>
                    {!procesando && (
                        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-[#131E5C] text-white">
                            <Plus className="h-3.5 w-3.5" />
                        </div>
                    )}
                </div>

                <h2 className="mt-5 text-lg font-bold text-[#1A1F3C]">
                    {procesando ? "Analizando factura…" : "Sube una factura en PDF"}
                </h2>

                <button
                    type="button"
                    disabled={procesando}
                    onClick={() => inputRef.current?.click()}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#131E5C]/15 transition hover:bg-[#0A1340] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {procesando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="h-4 w-4" />
                    )}
                    {procesando ? "Procesando" : "Seleccionar PDF"}
                </button>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="navy">Solo PDF</Badge>
                    <Badge variant="default">Lectura automática</Badge>
                    <Badge variant="default">Conceptos editables</Badge>
                </div>
            </div>
        </div>
    );
}

function ConceptoCard({ concepto, index, currency, onChange }) {
    const [open, setOpen] = useState(false);
    const completo = Boolean(concepto.cargo && concepto.motivo?.trim());

    return (
        <div className="overflow-hidden rounded-xl border border-[#E4E7F0] bg-white">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#F7F8FC]"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#131E5C]/7 text-sm font-extrabold text-[#131E5C]">
                    {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-[#1A1F3C]">
                            {concepto.descripcion}
                        </p>
                        {completo ? (
                            <Badge variant="success" dot>
                                Clasificado
                            </Badge>
                        ) : (
                            <Badge variant="warning">Pendiente</Badge>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8891AD]">
                        <span>Clave {concepto.clave || "—"}</span>
                        <span>
                            {concepto.cantidad} {concepto.unidad || "unidad"}
                        </span>
                        <span className="font-bold text-[#515778]">
                            {money(concepto.importe, currency)}
                        </span>
                    </div>
                </div>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#8891AD] transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div className="border-t border-[#E4E7F0] bg-[#FAFBFD] px-4 py-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                        <div className="rounded-xl border border-[#E4E7F0] bg-white p-4">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">
                                Datos extraídos
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoRow label="Clave" value={concepto.clave} />
                                <InfoRow label="Unidad" value={concepto.unidad} />
                                <InfoRow label="Cantidad" value={concepto.cantidad} />
                                <InfoRow
                                    label="Precio unitario"
                                    value={money(concepto.precioUnitario, currency)}
                                />
                                <div className="col-span-2">
                                    <InfoRow
                                        label="Importe"
                                        value={money(concepto.importe, currency)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#131E5C]/10 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8891AD]">
                                        Clasificación de Marketing
                                    </p>
                                    <p className="mt-1 text-xs text-[#8891AD]">
                                        Esta sección será capturada manualmente.
                                    </p>
                                </div>
                                <Badge variant="navy">Preparado</Badge>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold text-[#515778]">
                                        Cargo / categoría
                                    </label>
                                    <select
                                        value={concepto.cargo || ""}
                                        onChange={(e) => onChange("cargo", e.target.value)}
                                        className="w-full rounded-xl border border-[#E4E7F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1A1F3C] outline-none transition focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                    >
                                        {CARGOS.map((cargo) => (
                                            <option key={cargo || "empty"} value={cargo}>
                                                {cargo || "Seleccionar cargo"}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[11px] font-semibold text-[#515778]">
                                        Motivo / justificación
                                    </label>
                                    <textarea
                                        value={concepto.motivo || ""}
                                        onChange={(e) => onChange("motivo", e.target.value)}
                                        rows={3}
                                        placeholder="Ej. Campaña de leads para lanzamiento de modelo…"
                                        className="w-full resize-y rounded-xl border border-[#E4E7F0] bg-white px-3.5 py-2.5 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FacturaCard({ factura, onDelete, onConceptoChange }) {
    const [open, setOpen] = useState(true);
    const completos = factura.conceptos.filter(
        (concepto) => concepto.cargo && concepto.motivo?.trim()
    ).length;
    const currency = factura.comprobante.moneda || "MXN";

    return (
        <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
            <div className="border-b border-[#E4E7F0] px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                            <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-bold text-[#1A1F3C]">
                                    {factura.archivo}
                                </h3>
                                <Badge variant="success" dot>
                                    Lectura completa
                                </Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#8891AD]">
                                {formatBytes(factura.archivoSize)} · {factura.conceptos.length} conceptos
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-auto">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] transition hover:bg-[#F7F8FC]"
                        >
                            {open ? "Contraer" : "Ver detalle"}
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                            />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            title="Eliminar factura"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div>
                    <div className="grid gap-4 border-b border-[#E4E7F0] bg-[#FAFBFD] p-5 xl:grid-cols-[1fr_1fr_320px]">
                        <div className="rounded-xl border border-[#E4E7F0] bg-white p-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8">
                                    <Building2 className="h-4 w-4 text-[#131E5C]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#1A1F3C]">Emisor</p>
                                    <p className="text-xs text-[#8891AD]">Datos fiscales detectados</p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InfoRow label="Razón social" value={factura.emisor.razonSocial} />
                                </div>
                                <InfoRow label="RFC" value={factura.emisor.rfc} mono />
                                <InfoRow label="Régimen" value={factura.emisor.regimenFiscal} />
                                <div className="sm:col-span-2">
                                    <InfoRow label="Domicilio" value={factura.emisor.domicilio} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#E4E7F0] bg-white p-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C]/8">
                                    <UserRound className="h-4 w-4 text-[#131E5C]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#1A1F3C]">Receptor</p>
                                    <p className="text-xs text-[#8891AD]">Empresa que registra el gasto</p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InfoRow label="Razón social" value={factura.receptor.razonSocial} />
                                </div>
                                <InfoRow label="RFC" value={factura.receptor.rfc} mono />
                                <InfoRow label="Uso CFDI" value={factura.receptor.usoCfdi} />
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#131E5C]/10 bg-[#131E5C] p-4 text-white">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                                Total factura
                            </p>
                            <p className="mt-2 text-3xl font-extrabold tracking-tight">
                                {money(factura.totales.total, currency)}
                            </p>
                            <div className="mt-5 space-y-2 border-t border-white/15 pt-4">
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-white/60">Subtotal</span>
                                    <span className="font-semibold">
                                        {money(factura.totales.subtotal, currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-white/60">Impuestos</span>
                                    <span className="font-semibold">
                                        {money(factura.totales.impuestos, currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-white/60">Moneda</span>
                                    <span className="font-semibold">{currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-[#E4E7F0] px-5 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <InfoRow label="UUID" value={factura.comprobante.uuid} mono />
                            <InfoRow label="Folio" value={factura.comprobante.folio} />
                            <InfoRow label="Fecha" value={formatDate(factura.comprobante.fecha)} />
                            <InfoRow label="Método de pago" value={factura.comprobante.metodoPago} />
                            <InfoRow label="Forma de pago" value={factura.comprobante.formaPago} />
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-[#1A1F3C]">
                                    Conceptos de la factura
                                </h4>
                                <p className="mt-0.5 text-xs text-[#8891AD]">
                                    Revisa cada concepto y asigna manualmente su cargo y justificación.
                                </p>
                            </div>
                            <Badge variant={completos === factura.conceptos.length ? "success" : "warning"}>
                                {completos}/{factura.conceptos.length} clasificados
                            </Badge>
                        </div>

                        <div className="space-y-2.5">
                            {factura.conceptos.map((concepto, index) => (
                                <ConceptoCard
                                    key={concepto.id}
                                    concepto={concepto}
                                    index={index}
                                    currency={currency}
                                    onChange={(campo, valor) =>
                                        onConceptoChange(concepto.id, campo, valor)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AnalisisFacturas() {
    const [facturas, setFacturas] = useState([facturaDemo]);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");

    const facturasFiltradas = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return facturas;

        return facturas.filter((factura) =>
            [
                factura.archivo,
                factura.emisor.razonSocial,
                factura.emisor.rfc,
                factura.receptor.razonSocial,
                factura.comprobante.folio,
                factura.comprobante.uuid,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [facturas, q]);

    const totalFacturado = useMemo(
        () => facturas.reduce((acc, factura) => acc + Number(factura.totales.total || 0), 0),
        [facturas]
    );

    const totalConceptos = useMemo(
        () => facturas.reduce((acc, factura) => acc + factura.conceptos.length, 0),
        [facturas]
    );

    const conceptosClasificados = useMemo(
        () =>
            facturas.reduce(
                (acc, factura) =>
                    acc +
                    factura.conceptos.filter(
                        (concepto) => concepto.cargo && concepto.motivo?.trim()
                    ).length,
                0
            ),
        [facturas]
    );

    function crearFacturaMock(file) {
        const timestamp = Date.now();

        return {
            ...facturaDemo,
            id: `factura-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
            archivo: file.name,
            archivoSize: file.size,
            fechaCarga: new Date().toISOString(),
            comprobante: {
                ...facturaDemo.comprobante,
                uuid: `DEMO-${timestamp}`,
                folio: `FR-${String(timestamp).slice(-6)}`,
                fecha: new Date().toISOString().slice(0, 10),
            },
            conceptos: facturaDemo.conceptos.map((concepto, index) => ({
                ...concepto,
                id: `concepto-${timestamp}-${index}`,
                cargo: "",
                motivo: "",
            })),
        };
    }

    function handleFiles(files) {
        setError("");

        const invalidos = files.filter(
            (file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")
        );

        if (invalidos.length > 0) {
            setError("Solo se permiten archivos PDF para el lector de facturas.");
            return;
        }

        setProcesando(true);

        // FRONTEND DEMO:
        // Aquí se sustituirá esta simulación por la llamada al backend que enviará
        // el PDF al servicio de extracción/IA y devolverá los datos estructurados.
        window.setTimeout(() => {
            setFacturas((prev) => [...files.map(crearFacturaMock), ...prev]);
            setProcesando(false);
        }, 1100);
    }

    function eliminarFactura(facturaId) {
        setFacturas((prev) => prev.filter((factura) => factura.id !== facturaId));
    }

    function actualizarConcepto(facturaId, conceptoId, campo, valor) {
        setFacturas((prev) =>
            prev.map((factura) => {
                if (factura.id !== facturaId) return factura;

                return {
                    ...factura,
                    conceptos: factura.conceptos.map((concepto) =>
                        concepto.id === conceptoId
                            ? { ...concepto, [campo]: valor }
                            : concepto
                    ),
                };
            })
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.surface }}>
            <header
                className="sticky top-0 z-40 w-full border-b bg-white"
                style={{ borderColor: "#131E5C22" }}
            >
                <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                    <div className="flex shrink-0 items-center gap-3 md:gap-4">
                        <img
                            src={vwDark}
                            alt="Volkswagen"
                            className="h-16 w-16 object-contain md:h-20 md:w-20"
                            loading="lazy"
                        />
                        <div>
                            <div
                                className="text-[23px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                                style={{ color: C.navy }}
                            >
                                Lector de Facturas
                            </div>
                        </div>
                    </div>

                    <div
                        className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                        style={{ background: C.navy }}
                    />
                </div>
            </header>

            <main className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">
                <section className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <StatCard
                        label="Facturas cargadas"
                        value={facturas.length}
                        sub="Documentos disponibles"
                        icon={ReceiptText}
                    />
                    <StatCard
                        label="Conceptos detectados"
                        value={totalConceptos}
                        sub="Partidas listas para revisar"
                        icon={FileCheck2}
                        variant="info"
                    />
                    <StatCard
                        label="Clasificación"
                        value={`${conceptosClasificados}/${totalConceptos || 0}`}
                        sub="Cargo y motivo capturados"
                        icon={CheckCircle2}
                        variant="success"
                    />
                    <StatCard
                        label="Total leído"
                        value={money(totalFacturado)}
                        sub="Vista previa de gastos"
                        icon={CircleDollarSign}
                        variant="warning"
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-[390px_1fr]">
                    <aside className="space-y-4 xl:sticky xl:top-[102px] xl:self-start">
                        <UploadZone procesando={procesando} onFiles={handleFiles} />

                        {error && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-700">Archivo no válido</p>
                                    <p className="mt-0.5 text-xs text-red-600">{error}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setError("")}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}


                    </aside>

                    <div className="min-w-0 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#1A1F3C]">Facturas analizadas</h2>
                                <p className="mt-0.5 text-xs text-[#8891AD]">
                                    Información detectada del PDF y preparación de la clasificación del gasto.
                                </p>
                            </div>

                            <div className="relative w-full sm:w-72">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar RFC, emisor, folio…"
                                    className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-white pl-9 pr-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                />
                            </div>
                        </div>

                        {facturasFiltradas.length === 0 ? (
                            <div className="rounded-2xl border border-[#E4E7F0] bg-white px-6 py-16 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F8FC]">
                                    <ReceiptText className="h-6 w-6 text-[#8891AD]" />
                                </div>
                                <p className="mt-4 text-sm font-bold text-[#1A1F3C]">
                                    {q ? "No hay coincidencias" : "Aún no hay facturas"}
                                </p>
                                <p className="mt-1 text-xs text-[#8891AD]">
                                    {q
                                        ? "Prueba con otro emisor, RFC, folio o UUID."
                                        : "Sube un PDF para iniciar el análisis."}
                                </p>
                            </div>
                        ) : (
                            facturasFiltradas.map((factura) => (
                                <FacturaCard
                                    key={factura.id}
                                    factura={factura}
                                    onDelete={() => eliminarFactura(factura.id)}
                                    onConceptoChange={(conceptoId, campo, valor) =>
                                        actualizarConcepto(factura.id, conceptoId, campo, valor)
                                    }
                                />
                            ))
                        )}

                        <div className="rounded-2xl border border-[#131E5C]/10 bg-[#131E5C]/[0.035] px-5 py-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#131E5C] shadow-sm">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#1A1F3C]">Siguiente etapa preparada</p>
                                    <p className="mt-1 text-xs leading-relaxed text-[#515778]">
                                        Cada concepto ya mantiene en el estado del frontend los campos
                                        <b> cargo</b> y <b>motivo</b>. Cuando se conecte el backend, esos valores
                                        podrán guardarse junto con la factura y utilizarse después para reportes,
                                        presupuestos, centros de costo o validaciones de Gerencia.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
