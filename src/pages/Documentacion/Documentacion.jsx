// src/pages/Documentacion/Documentacion.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, CheckCircle2, ChevronDown, CircleAlert, Eye, FileCheck2, FileText, FolderOpen, Loader2, Pencil, Plus, Search, Trash2, UploadCloud, UserRound, X } from "lucide-react";
import EditorFormatoPdf from "./EditorFormatoPDF";
import { useAuth } from "../../auth/AuthContext";
import { apiDocumentacion } from "../../lib/apiDocumentacion";
import { ASESORES_PISO, AGENCIAS_DIGITALES } from "../Digitales/asesoresPiso";

const TIPOS_PERSONA = [
    { value: "fisica_asalariada", label: "Persona Física Asalariada" },
    { value: "fisica_profesionista", label: "Persona Física Profesionista" },
    { value: "moral", label: "Persona Moral" },
];

const FINANCIAMIENTOS = [
    { value: "credit", label: "Credit" },
    { value: "leasing", label: "Leasing" },
];

const FORMATOS_SOLICITUD = [
    {
        value: "arrendamiento_personas_fisicas",
        label: "Solicitud Arrendamiento - Personas Físicas",
        archivo: "Solicitud-Arrendamiento-Personas-Fisicas.pdf",
        url: "/crm/solicitudes_credito/Solicitud-Arrendamiento-Personas-Fisicas.pdf",
    },
    {
        value: "arrendamiento_personas_morales",
        label: "Solicitud Arrendamiento - Personas Morales",
        archivo: "Solicitud-Arrendamiento-Personas-Morales.pdf",
        url: "/crm/solicitudes_credito/Solicitud-Arrendamiento-Personas-Morales.pdf",
    },
    {
        value: "credito_personas_fisicas",
        label: "Solicitud Crédito - Personas Físicas",
        archivo: "Solicitud-Credito-Personas-Fisicas.pdf",
        url: "/crm/solicitudes_credito/Solicitud-Credito-Personas-Fisicas.pdf",
    },
    {
        value: "credito_personas_morales",
        label: "Solicitud Crédito - Personas Morales",
        archivo: "Solicitud-Credito-Personas-Morales.pdf",
        url: "/crm/solicitudes_credito/Solicitud-Credito-Personas-Morales.pdf",
    },
    {
        value: "persona_fisica_asalariada",
        label: "Solicitud Persona Física Asalariada",
        archivo: "Solicitud-Persona-Fisica-Asalariada.pdf",
        url: "/crm/solicitudes_credito/Solicitud-Persona-Fisica-Asalariada.pdf",
    },
];

const obtenerFormatoSolicitud = (value) => FORMATOS_SOLICITUD.find((item) => item.value === value) || null;

const limpiar = (value) => String(value ?? "").trim();
const normalizar = (value) => limpiar(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const nombrePersona = (value) => TIPOS_PERSONA.find((item) => item.value === value)?.label || value;
const nombreFinanciamiento = (value) => FINANCIAMIENTOS.find((item) => item.value === value)?.label || value;
const normalizarListado = (data) => Array.isArray(data) ? data : data?.results || [];

function formatBytes(bytes = 0) {
    if (!bytes) return "0 KB";
    const unidades = ["B", "KB", "MB", "GB"];
    let valor = Number(bytes), indice = 0;
    while (valor >= 1024 && indice < unidades.length - 1) { valor /= 1024; indice++; }
    return `${valor.toFixed(indice ? 1 : 0)} ${unidades[indice]}`;
}

async function validarPdf(file) {
    if (!file) return { ok: false, error: "Selecciona un archivo." };
    if (!file.size) return { ok: false, error: "El archivo está vacío." };
    if (!normalizar(file.name).endsWith(".pdf")) return { ok: false, error: "Solo se permiten archivos PDF." };
    if (file.type && normalizar(file.type) !== "application/pdf") return { ok: false, error: "El archivo seleccionado no tiene formato PDF." };

    try {
        if (await file.slice(0, 5).text() !== "%PDF-") return { ok: false, error: "El archivo seleccionado no parece ser un PDF válido." };
    } catch (error) {
        console.error("No fue posible validar la cabecera del PDF:", error);
        return { ok: false, error: "No fue posible validar el archivo PDF." };
    }

    return { ok: true };
}

function Badge({ children, type = "neutral" }) {
    const classes = {
        neutral: "border-slate-200 bg-slate-50 text-slate-600",
        blue: "border-blue-100 bg-blue-50 text-blue-700",
        green: "border-emerald-100 bg-emerald-50 text-emerald-700",
        yellow: "border-amber-100 bg-amber-50 text-amber-700",
        red: "border-red-100 bg-red-50 text-red-700",
    };

    return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${classes[type]}`}>{children}</span>;
}

function Modal({ open, title, onClose, children, maxWidth = "max-w-3xl" }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200]">
            <button type="button" aria-label="Cerrar" className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-[3px]" onClick={onClose} />

            <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className={`pointer-events-auto flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl`}>
                    <div className="flex items-center justify-between bg-[#131E5C] px-5 py-4">
                        <div className="truncate text-sm font-black text-white">{title}</div>

                        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function ProgressRing({ value = 0 }) {
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;

    return (
        <div className="relative h-[68px] w-[68px] shrink-0">
            <svg viewBox="0 0 64 64" className="-rotate-90">
                <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-slate-100" />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={value >= 100 ? "stroke-emerald-500" : "stroke-[#131E5C]"}
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: "stroke-dashoffset .4s ease" }}
                />
            </svg>

            <div className={`absolute inset-0 flex items-center justify-center text-xs font-black ${value >= 100 ? "text-emerald-600" : "text-[#131E5C]"}`}>
                {value}%
            </div>
        </div>
    );
}

function DocumentoCard({ requisito, documento, uploading, editable, onSeleccionar, onVer, onEliminar }) {
    return (
        <tr className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70">
            {/* REQUISITO */}
            <td className="min-w-[300px] px-4 py-3 align-top">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${documento ? "bg-emerald-100 text-emerald-700" : "bg-[#131E5C]/[0.07] text-[#131E5C]"}`}>
                        {documento ? <FileCheck2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0">
                        <div className="text-xs font-black text-[#131E5C]">{requisito.nombre}</div>

                        {requisito.descripcion ? (
                            <div className="mt-1 text-[10px] leading-4 text-slate-500">
                                <span className="font-black text-slate-600">Especificación: </span>
                                {requisito.descripcion}
                            </div>
                        ) : (
                            <div className="mt-1 text-[10px] text-slate-400">Sin especificaciones adicionales.</div>
                        )}
                    </div>
                </div>
            </td>

            {/* TIPO */}
            <td className="whitespace-nowrap px-4 py-3 align-middle">
                {requisito.obligatorio ? <Badge type="red">Obligatorio</Badge> : <Badge type="yellow">Opcional</Badge>}
            </td>

            {/* ESTADO */}
            <td className="whitespace-nowrap px-4 py-3 align-middle">
                {documento ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Cargado
                    </div>
                ) : (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-black ${requisito.obligatorio ? "text-amber-600" : "text-slate-400"}`}>
                        <CircleAlert className="h-4 w-4" />
                        Pendiente
                    </div>
                )}
            </td>

            {/* ARCHIVO */}
            <td className="min-w-[220px] px-4 py-3 align-middle">
                {documento ? (
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-[9px] font-black text-red-600">
                            PDF
                        </div>

                        <div className="min-w-0">
                            <div className="max-w-[240px] truncate text-xs font-bold text-[#131E5C]" title={documento.nombre_original || documento.requisito_nombre}>
                                {documento.nombre_original || documento.requisito_nombre}
                            </div>

                            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {formatBytes(documento.tamano_bytes)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className="text-xs font-semibold text-slate-400">Sin archivo</span>
                )}
            </td>

            {/* ACCIONES */}
            <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                {documento ? (
                    <div className="inline-flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onVer(documento)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-3 text-xs font-bold text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white"
                        >
                            <Eye className="h-4 w-4" />
                            Ver
                        </button>

                        {editable ? (
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => onEliminar(documento)}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Eliminar
                            </button>
                        ) : null}
                    </div>
                ) : editable ? (
                    <label className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-3 text-xs font-bold text-white transition hover:bg-[#1d2d86] ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {uploading ? "Subiendo..." : "Subir PDF"}

                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            disabled={uploading}
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) onSeleccionar(requisito, file);
                            }}
                        />
                    </label>
                ) : (
                    <span className="text-xs font-semibold text-slate-400">Solo lectura</span>
                )}
            </td>
        </tr>
    );
}

function ExpedienteCard({
    expediente,
    abierto,
    editable,
    uploading,
    formatoSeleccionado,
    onFormatoChange,
    onEditarFormato,
    onVerFormato,
    onToggle,
    onSeleccionar,
    onVer,
    onEliminar,
}) {
    const avance = expediente.avance || { porcentaje: 0, completados: 0, faltantes: 0, total: 0 };
    const completo = avance.porcentaje >= 100;
    const formatoGuardado = expediente.solicitud_pdf_plantilla || "";
    const tienePdfGuardado = !!expediente.solicitud_pdf_url;
    const cambioFormatoPendiente = !!formatoGuardado && !!formatoSeleccionado && formatoGuardado !== formatoSeleccionado;

    return (
        <>
            <tr
                onClick={onToggle}
                className={`cursor-pointer border-b border-black/10 transition hover:bg-[#131E5C]/[0.035] ${abierto ? "bg-[#131E5C]/[0.045]" : "bg-white"}`}
            >
                <td className="w-12 px-3 py-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${abierto ? "bg-[#131E5C] text-white" : "bg-slate-100 text-[#131E5C]"}`}>
                        <ChevronDown className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
                    </div>
                </td>

                <td className="min-w-[230px] px-4 py-3">
                    <div className="font-black text-[#131E5C]">{expediente.cliente || "Sin cliente"}</div>

                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{expediente.folio || "Sin folio"}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-semibold text-slate-400">{avance.completados} de {avance.total} documentos</span>
                    </div>
                </td>

                <td className="min-w-[180px] px-4 py-3">
                    <Badge type="blue">{nombrePersona(expediente.tipo_persona)}</Badge>
                </td>

                <td className="px-4 py-3">
                    <Badge>{nombreFinanciamiento(expediente.financiamiento)}</Badge>
                </td>

                <td className="min-w-[160px] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#131E5C]">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">{expediente.agencia || "Sin Dealer"}</span>
                    </div>
                </td>

                <td className="min-w-[180px] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#131E5C]">
                        <UserRound className="h-4 w-4 shrink-0" />
                        <span className="truncate">{expediente.asesor_nombre || "Sin asignar"}</span>
                    </div>
                </td>

                <td className="min-w-[150px] px-4 py-3 text-xs font-semibold text-[#131E5C]">
                    {expediente.creado_por || "—"}
                </td>

                <td className="min-w-[170px] px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="h-2 min-w-[90px] flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${completo ? "bg-emerald-500" : "bg-[#131E5C]"}`}
                                style={{ width: `${Math.min(avance.porcentaje || 0, 100)}%` }}
                            />
                        </div>

                        <span className={`w-9 text-right text-xs font-black ${completo ? "text-emerald-600" : "text-[#131E5C]"}`}>
                            {avance.porcentaje}%
                        </span>
                    </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                    {completo ? <Badge type="green">Completo</Badge> : <Badge type="yellow">En proceso</Badge>}
                </td>
            </tr>

            {abierto ? (
                <tr>
                    <td colSpan={9} className="border-b border-[#131E5C]/20 bg-slate-50/80 p-0">
                        <div className="p-4 sm:p-5">
                            {/* DOCUMENTOS */}
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="border border-black bg-[#131E5C] text-xs text-white">
                                            <tr>
                                                <th className="px-4 py-3 font-bold">Documento / Especificación</th>
                                                <th className="px-4 py-3 font-bold">Tipo</th>
                                                <th className="px-4 py-3 font-bold">Estado</th>
                                                <th className="px-4 py-3 font-bold">Archivo</th>
                                                <th className="px-4 py-3 text-right font-bold">Acciones</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {(expediente.requisitos || []).map((requisito) => {
                                                const documento = expediente.documentos?.[requisito.id];
                                                const key = `${expediente.id_expediente}-${requisito.id}`;

                                                return (
                                                    <DocumentoCard
                                                        key={requisito.id}
                                                        requisito={requisito}
                                                        documento={documento}
                                                        uploading={!!uploading[key]}
                                                        editable={editable}
                                                        onSeleccionar={(req, file) => onSeleccionar(expediente, req, file)}
                                                        onVer={onVer}
                                                        onEliminar={(doc) => onEliminar(expediente, requisito, doc)}
                                                    />
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {/* FORMATO PDF EDITABLE */}
                        <div className="mb-4 overflow-hidden">
                            <div className="grid gap-3 p-4 lg:grid-cols-[minmax(300px,1fr)_auto_auto] lg:items-end">
                                <label>
                                    <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                                        Formato asignado
                                    </div>

                                    <select
                                        value={formatoSeleccionado || ""}
                                        disabled={!editable}
                                        onChange={(event) => onFormatoChange(event.target.value)}
                                        className="h-10 w-full rounded-lg border border-[#131E5C] bg-white px-3 text-xs font-bold text-[#131E5C] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <option value="">Selecciona un formato...</option>

                                        {FORMATOS_SOLICITUD.map((formato) => (
                                            <option key={formato.value} value={formato.value}>
                                                {formato.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {editable ? (
                                    <button
                                        type="button"
                                        disabled={!formatoSeleccionado}
                                        onClick={() => onEditarFormato(formatoSeleccionado)}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 text-xs font-black text-white hover:bg-[#1d2d86] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Pencil className="h-4 w-4" />

                                        {tienePdfGuardado && formatoGuardado === formatoSeleccionado ? "Editar formato" : "Llenar formato"}
                                    </button>
                                ) : null}
                                <div className="inline-flex h-10 items-center justify-center  gap-2 rounded-lg bg-[#131E5C] px-4 text-xs font-black text-white hover:bg-[#1d2d86] disabled:cursor-not-allowed disabled:opacity-50">
                                    {tienePdfGuardado ? <div className="bg-green-500">PDF guardado</div> : <div>Sin generar</div>}
                                </div>
                                {tienePdfGuardado ? (
                                    <button
                                        type="button"
                                        onClick={onVerFormato}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-xs font-black text-[#131E5C] hover:bg-slate-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Ver PDF guardado
                                    </button>
                                ) : null}
                            </div>

                            {cambioFormatoPendiente ? (
                                <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-[10px] font-bold text-amber-700">
                                    Cambiaste de formato. El PDF guardado actualmente corresponde a otra plantilla. Al guardar el nuevo se reemplazará.
                                </div>
                            ) : null}

                            {tienePdfGuardado && formatoGuardado === formatoSeleccionado ? (
                                <div className="border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-[10px] font-semibold text-emerald-700">
                                    Última actualización: {expediente.solicitud_pdf_actualizado
                                        ? new Date(expediente.solicitud_pdf_actualizado).toLocaleString("es-MX")
                                        : "—"}
                                </div>
                            ) : null}
                        </div>
                    </td>
                </tr >
            ) : null
            }
        </>
    );
}

export default function Documentacion() {
    const { user } = useAuth();
    const timerRef = useRef(null);

    const rol = normalizar(user?.rol);
    const permisos = user?.permisos || [];

    const isAdmin = rol === "administrador" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");

    const isGerente = (
        (rol.includes("gerente") && rol.includes("servicios") && rol.includes("financieros"))
        || permisos.includes("FINANCIEROS_GERENTE")
    );

    const userAgencias = useMemo(
        () => String(user?.agencia || "").split("|").map(limpiar).filter(Boolean),
        [user?.agencia],
    );

    const inputClass = "h-11 w-full rounded-xl border border-[#131E5C] px-3 text-sm font-bold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:bg-white focus:ring-4 focus:ring-[#131E5C]/[0.07]";

    const [expedientes, setExpedientes] = useState([]);
    const [abiertoId, setAbiertoId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroDealer, setFiltroDealer] = useState("Todos");
    const [filtroAsesor, setFiltroAsesor] = useState("Todos");
    const [mensaje, setMensaje] = useState(null);
    const [uploading, setUploading] = useState({});
    const [openCrear, setOpenCrear] = useState(false);
    const [creando, setCreando] = useState(false);
    const [validandoCombinacion, setValidandoCombinacion] = useState(false);
    const [combinacionDisponible, setCombinacionDisponible] = useState(true);
    const [cantidadRequisitos, setCantidadRequisitos] = useState(0);
    const [preview, setPreview] = useState({ open: false, url: "", title: "" });
    const [formatosSeleccionados, setFormatosSeleccionados] = useState({});
    const [editorPdf, setEditorPdf] = useState({
        open: false,
        expediente: null,
        formato: null,
        camposIniciales: {},
    });

    const [nuevo, setNuevo] = useState({
        tipo_persona: "",
        financiamiento: "",
        cliente: "",
        agencia: "",
        asesor_nombre: "",
    });

    const mostrarMensaje = (type, text) => {
        setMensaje({ type, text });
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setMensaje(null), 4500);
    };

    const cargarExpedientes = async () => {
        setLoading(true);

        try {
            const data = await apiDocumentacion.list();
            const lista = normalizarListado(data);

            setExpedientes(lista);

            setFormatosSeleccionados((prev) => {
                const next = { ...prev };

                lista.forEach((expediente) => {
                    const id = expediente.id_expediente;

                    if (!next[id] && expediente.solicitud_pdf_plantilla) {
                        next[id] = expediente.solicitud_pdf_plantilla;
                    }
                });

                return next;
            });
        } catch (error) {
            console.error("Error cargando expedientes:", error);
            mostrarMensaje("error", error?.message || "No fue posible cargar los expedientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarExpedientes();

        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!nuevo.tipo_persona || !nuevo.financiamiento) {
            setCombinacionDisponible(true);
            setCantidadRequisitos(0);
            return;
        }

        let activo = true;
        setValidandoCombinacion(true);

        apiDocumentacion.requisitos(nuevo.tipo_persona, nuevo.financiamiento)
            .then((data) => {
                if (!activo) return;
                setCombinacionDisponible(!!data?.disponible);
                setCantidadRequisitos(data?.requisitos?.length || 0);
            })
            .catch((error) => {
                console.error("Error consultando requisitos:", error);
                if (!activo) return;
                setCombinacionDisponible(false);
                setCantidadRequisitos(0);
            })
            .finally(() => {
                if (activo) setValidandoCombinacion(false);
            });

        return () => { activo = false; };
    }, [nuevo.tipo_persona, nuevo.financiamiento]);

    const dealersCreacion = useMemo(() => {
        if (isAdmin) return AGENCIAS_DIGITALES;
        return userAgencias;
    }, [isAdmin, userAgencias]);

    const dealersFiltro = useMemo(
        () => [...new Set(expedientes.map((exp) => exp.agencia).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
        [expedientes],
    );

    const asesoresFiltro = useMemo(
        () => [...new Set(expedientes.map((exp) => exp.asesor_nombre).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")),
        [expedientes],
    );

    const expedientesVisibles = useMemo(() => {
        const q = normalizar(busqueda);

        return expedientes.filter((exp) => {
            if (filtroDealer !== "Todos" && normalizar(exp.agencia) !== normalizar(filtroDealer)) return false;
            if (filtroAsesor !== "Todos" && normalizar(exp.asesor_nombre) !== normalizar(filtroAsesor)) return false;
            if (!q) return true;

            return [
                exp.cliente,
                exp.folio,
                exp.agencia,
                exp.asesor_nombre,
                exp.creado_por,
                nombrePersona(exp.tipo_persona),
                nombreFinanciamiento(exp.financiamiento),
            ].some((value) => normalizar(value).includes(q));
        });
    }, [expedientes, busqueda, filtroDealer, filtroAsesor]);

    const puedeEditar = (expediente) => {
        if (isAdmin) return true;

        if (!userAgencias.length) return true;

        return userAgencias.some((agencia) => normalizar(agencia) === normalizar(expediente.agencia));
    };

    const abrirCrear = () => {
        setNuevo({
            tipo_persona: "",
            financiamiento: "",
            cliente: "",
            agencia: isAdmin ? "" : userAgencias[0] || "",
            asesor_nombre: "",
        });

        setCombinacionDisponible(true);
        setCantidadRequisitos(0);
        setOpenCrear(true);
    };

    const refrescarExpediente = async (idExpediente) => {
        const actualizado = await apiDocumentacion.get(idExpediente);

        setExpedientes((prev) =>
            prev.map((exp) =>
                String(exp.id_expediente) === String(idExpediente)
                    ? actualizado
                    : exp
            )
        );

        if (actualizado?.solicitud_pdf_plantilla) {
            setFormatosSeleccionados((prev) => ({
                ...prev,
                [idExpediente]: actualizado.solicitud_pdf_plantilla,
            }));
        }

        return actualizado;
    };

    const crearExpediente = async () => {
        if (creando) return;

        if (!nuevo.tipo_persona) return mostrarMensaje("error", "Selecciona el tipo de persona.");
        if (!nuevo.financiamiento) return mostrarMensaje("error", "Selecciona el tipo de financiamiento.");
        if (!combinacionDisponible) return mostrarMensaje("error", "Esta combinación todavía no tiene requisitos configurados.");
        if (!limpiar(nuevo.cliente)) return mostrarMensaje("error", "Captura el nombre del cliente.");
        if (!limpiar(nuevo.agencia)) return mostrarMensaje("error", "Selecciona el Dealer.");
        if (!limpiar(nuevo.asesor_nombre)) return mostrarMensaje("error", "Selecciona el asesor responsable.");

        setCreando(true);

        try {
            const creado = await apiDocumentacion.create({
                cliente: limpiar(nuevo.cliente),
                agencia: limpiar(nuevo.agencia),
                asesor_nombre: limpiar(nuevo.asesor_nombre),
                tipo_persona: nuevo.tipo_persona,
                financiamiento: nuevo.financiamiento,
            });

            setExpedientes((prev) => [creado, ...prev]);
            setAbiertoId(creado.id_expediente);
            setOpenCrear(false);

            mostrarMensaje("success", `Expediente ${creado.folio} creado correctamente.`);
        } catch (error) {
            console.error("Error creando expediente:", error);
            mostrarMensaje("error", error?.message || "No se pudo crear el expediente.");
        } finally {
            setCreando(false);
        }
    };

    const subirDocumento = async (expediente, requisito, file) => {
        if (expediente.documentos?.[requisito.id]) return mostrarMensaje("error", "Este requisito ya tiene un documento. Elimínalo antes de cargar otro.");

        const validacion = await validarPdf(file);
        if (!validacion.ok) return mostrarMensaje("error", validacion.error);

        const idExpediente = expediente.id_expediente;
        const key = `${idExpediente}-${requisito.id}`;

        setUploading((prev) => ({ ...prev, [key]: true }));

        try {
            await apiDocumentacion.upload(idExpediente, requisito.id, file);
            await refrescarExpediente(idExpediente);
            mostrarMensaje("success", `"${requisito.nombre}" cargado correctamente.`);
        } catch (error) {
            console.error("Error subiendo documento:", error);
            mostrarMensaje("error", error?.message || "No se pudo cargar el documento.");
        } finally {
            setUploading((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const eliminarDocumento = async (expediente, requisito, documento) => {
        if (!documento?.id_documento) return mostrarMensaje("error", "No se encontró el ID del documento.");

        const idExpediente = expediente.id_expediente;
        const key = `${idExpediente}-${requisito.id}`;

        setUploading((prev) => ({ ...prev, [key]: true }));

        try {
            await apiDocumentacion.removeDocumento(documento.id_documento);
            await refrescarExpediente(idExpediente);
            mostrarMensaje("success", "Documento eliminado. Ya puedes cargar uno nuevo.");
        } catch (error) {
            console.error("Error eliminando documento:", error);
            mostrarMensaje("error", error?.message || "No fue posible eliminar el documento.");
        } finally {
            setUploading((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const verDocumento = (documento) => {
        const url = documento?.url_archivo || documento?.archivo;

        if (!url) return mostrarMensaje("error", "El documento no tiene una URL disponible.");

        setPreview({
            open: true,
            url,
            title: documento.nombre_original || documento.requisito_nombre || "Documento PDF",
        });
    };

    const cambiarFormatoExpediente = (expediente, plantilla) => {
        setFormatosSeleccionados((prev) => ({
            ...prev,
            [expediente.id_expediente]: plantilla,
        }));
    };

    const abrirEditorFormato = (expediente, plantilla) => {
        const formato = obtenerFormatoSolicitud(plantilla);

        if (!formato) {
            mostrarMensaje("error", "Selecciona un formato de solicitud.");
            return;
        }

        /*
         * Solamente recuperamos los campos guardados cuando el formato
         * almacenado en backend coincide con la plantilla seleccionada.
         *
         * Si el usuario cambia de plantilla comenzamos con el PDF limpio.
         */
        const camposIniciales =
            expediente.solicitud_pdf_plantilla === plantilla
                ? expediente.solicitud_pdf_campos || {}
                : {};

        setEditorPdf({
            open: true,
            expediente,
            formato,
            camposIniciales,
        });
    };

    const cerrarEditorFormato = () => {
        setEditorPdf({
            open: false,
            expediente: null,
            formato: null,
            camposIniciales: {},
        });
    };

    const guardarFormatoPdf = async ({ archivo, campos, plantilla }) => {
        const expediente = editorPdf.expediente;

        if (!expediente?.id_expediente) {
            throw new Error("No se encontró el expediente.");
        }

        await apiDocumentacion.guardarFormatoPdf(
            expediente.id_expediente,
            {
                archivo,
                plantilla,
                campos,
            }
        );

        await refrescarExpediente(expediente.id_expediente);

        setFormatosSeleccionados((prev) => ({
            ...prev,
            [expediente.id_expediente]: plantilla,
        }));

        cerrarEditorFormato();

        mostrarMensaje(
            "success",
            "El formato PDF fue guardado correctamente en el expediente."
        );
    };

    const verFormatoGuardado = (expediente) => {
        if (!expediente?.solicitud_pdf_url) {
            mostrarMensaje("error", "Este expediente todavía no tiene un formato PDF guardado.");
            return;
        }

        const formato = obtenerFormatoSolicitud(expediente.solicitud_pdf_plantilla);

        setPreview({
            open: true,
            url: expediente.solicitud_pdf_url,
            title: formato?.label || "Formato de solicitud",
        });
    };

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
            {/* HEADER */}
            <header className="relative overflow-hidden px-5 sm:px-7">
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                            <FolderOpen className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="mt-1 text-xl text-[#131E5C] font-bold sm:text-2xl">
                                Expedientes documentales
                            </h1>
                        </div>
                    </div>

                    <button type="button" onClick={abrirCrear} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                        <Plus className="h-4 w-4" />
                        Crear Expediente
                    </button>
                </div>
            </header>

            {/* MENSAJES */}
            {mensaje ? (
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs font-bold ${mensaje.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    {mensaje.type === "error"
                        ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}

                    <span>{mensaje.text}</span>
                </div>
            ) : null}

            {/* FILTROS */}
            <section className="sticky top-2 z-30 p-3 backdrop-blur-xl">
                <div className="flex flex-col gap-2 xl:flex-row">
                    <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[#131E5C] px-3 transition focus-within:border-[#131E5C] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#131E5C]/[0.05]">
                        <Search className="h-4 w-4 shrink-0 text-[#131E5C]" />
                        <input
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                            placeholder="Buscar cliente, folio, asesor, Dealer..."
                            className="h-full min-w-0 flex-1 text-xs font-bold text-[#131E5C] outline-none"
                        />

                        {busqueda ? (
                            <button type="button" onClick={() => setBusqueda("")}>
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        ) : null}
                    </div>

                    {(isAdmin || isGerente) ? (
                        <select value={filtroDealer} onChange={(event) => setFiltroDealer(event.target.value)} className={`${inputClass} xl:w-56`}>
                            <option value="Todos">Todos los Dealers</option>
                            {dealersFiltro.map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                        </select>
                    ) : null}

                    <select value={filtroAsesor} onChange={(event) => setFiltroAsesor(event.target.value)} className={`${inputClass} xl:w-64`}>
                        <option value="Todos">Todos los asesores</option>
                        {asesoresFiltro.map((asesor) => <option key={asesor} value={asesor}>{asesor}</option>)}
                    </select>

                    <div className="flex h-11 min-w-[130px] items-center justify-center px-4 text-xs font-black text-[#131E5C]">
                        {expedientesVisibles.length} expediente{expedientesVisibles.length === 1 ? "" : "s"}
                    </div>
                </div>
            </section>

            {/* EXPEDIENTES */}
            {loading ? (
                <div className="flex min-h-[350px] items-center justify-center rounded-lg border border-slate-200 bg-white">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#131E5C]" />
                        <div className="mt-3 text-xs font-black text-[#131E5C]">
                            Cargando expedientes...
                        </div>
                    </div>
                </div>
            ) : expedientesVisibles.length ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-left text-sm">
                            <thead className="bg-[#131E5C] text-xs text-white">
                                <tr>
                                    <th className="w-12 px-3 py-3" />
                                    <th className="px-4 py-3 font-bold">Expediente / Cliente</th>
                                    <th className="px-4 py-3 font-bold">Tipo de Persona</th>
                                    <th className="px-4 py-3 font-bold">Financiamiento</th>
                                    <th className="px-4 py-3 font-bold">Dealer</th>
                                    <th className="px-4 py-3 font-bold">Asesor</th>
                                    <th className="px-4 py-3 font-bold">Creado por</th>
                                    <th className="px-4 py-3 font-bold">Avance</th>
                                    <th className="px-4 py-3 font-bold">Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {expedientesVisibles.map((expediente) => (
                                    <ExpedienteCard
                                        key={expediente.id_expediente}
                                        expediente={expediente}
                                        abierto={String(abiertoId) === String(expediente.id_expediente)}
                                        editable={puedeEditar(expediente)}
                                        uploading={uploading}
                                        formatoSeleccionado={
                                            formatosSeleccionados[expediente.id_expediente]
                                            ?? expediente.solicitud_pdf_plantilla
                                            ?? ""
                                        }
                                        onFormatoChange={(plantilla) =>
                                            cambiarFormatoExpediente(expediente, plantilla)
                                        }
                                        onEditarFormato={(plantilla) =>
                                            abrirEditorFormato(expediente, plantilla)
                                        }
                                        onVerFormato={() => verFormatoGuardado(expediente)}
                                        onToggle={() =>
                                            setAbiertoId((prev) =>
                                                String(prev) === String(expediente.id_expediente)
                                                    ? null
                                                    : expediente.id_expediente
                                            )
                                        }
                                        onSeleccionar={subirDocumento}
                                        onVer={verDocumento}
                                        onEliminar={eliminarDocumento}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-[380px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131E5C]/[0.06] text-[#131E5C]">
                            <FolderOpen className="h-7 w-7" />
                        </div>

                        <h2 className="mt-4 text-base font-black text-[#131E5C]">
                            No hay expedientes
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            {busqueda || filtroDealer !== "Todos" || filtroAsesor !== "Todos"
                                ? "No se encontraron expedientes con los filtros seleccionados."
                                : "Crea el primer expediente para comenzar la carga documental."}
                        </p>

                        {!busqueda && filtroDealer === "Todos" && filtroAsesor === "Todos" ? (
                            <button
                                type="button"
                                onClick={abrirCrear}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2.5 text-xs font-black text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Crear Expediente
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
            {/* CREAR EXPEDIENTE */}
            <Modal open={openCrear} title="Crear nuevo expediente" onClose={() => !creando && setOpenCrear(false)}>
                <div>
                    <div className="mb-5">
                        <h3 className="mt-1 text-lg font-black text-[#131E5C]">
                            Datos del expediente
                        </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* TIPO PERSONA */}
                        <label>
                            <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                                Tipo de Persona <span className="text-red-500">*</span>
                            </div>

                            <select
                                value={nuevo.tipo_persona}
                                onChange={(event) => setNuevo((prev) => ({ ...prev, tipo_persona: event.target.value, financiamiento: "" }))}
                                className={inputClass}
                            >
                                <option value="">Selecciona...</option>
                                {TIPOS_PERSONA.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                            </select>
                        </label>

                        {/* FINANCIAMIENTO */}
                        <label>
                            <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                                Financiamiento <span className="text-red-500">*</span>
                            </div>

                            <select
                                value={nuevo.financiamiento}
                                disabled={!nuevo.tipo_persona}
                                onChange={(event) => setNuevo((prev) => ({ ...prev, financiamiento: event.target.value }))}
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <option value="">Selecciona...</option>
                                {FINANCIAMIENTOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                            </select>
                        </label>

                        {/* CLIENTE */}
                        <label className="sm:col-span-2">
                            <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                                Cliente / Razón Social <span className="text-red-500">*</span>
                            </div>

                            <input
                                value={nuevo.cliente}
                                onChange={(event) => setNuevo((prev) => ({ ...prev, cliente: event.target.value }))}
                                placeholder={nuevo.tipo_persona === "moral" ? "Razón social de la empresa" : "Nombre completo del cliente"}
                                className={inputClass}
                            />
                        </label>

                        {/* DEALER */}
                        <label className="sm:col-span-2">
                            <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                                Dealer <span className="text-red-500">*</span>
                            </div>

                            <div className="relative">
                                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]" />

                                <select
                                    value={nuevo.agencia}
                                    disabled={!isAdmin && userAgencias.length <= 1}
                                    onChange={(event) => setNuevo((prev) => ({ ...prev, agencia: event.target.value }))}
                                    className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                    <option value="">Selecciona el Dealer...</option>
                                    {dealersCreacion.map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                                </select>
                            </div>
                        </label>

                        {/* ASESOR */}
                        <label className="sm:col-span-2">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <div className="text-xs font-black text-[#131E5C]">
                                    Asesor responsable <span className="text-red-500">*</span>
                                </div>

                                <span className="text-[9px] font-bold text-slate-400">
                                    {ASESORES_PISO.length} asesores disponibles
                                </span>
                            </div>

                            <div className="relative">
                                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]" />

                                <select
                                    value={nuevo.asesor_nombre}
                                    onChange={(event) => setNuevo((prev) => ({ ...prev, asesor_nombre: event.target.value }))}
                                    className={`${inputClass} pl-10`}
                                >
                                    <option value="">Selecciona un asesor...</option>

                                    {ASESORES_PISO.map((asesor) => (
                                        <option key={asesor} value={asesor}>
                                            {asesor}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </label>
                    </div>

                    {/* VALIDACIÓN CHECKLIST */}
                    {nuevo.tipo_persona && nuevo.financiamiento ? (
                        <div className={`mt-5 rounded-xl border p-4 ${validandoCombinacion
                            ? "border-blue-200 bg-blue-50"
                            : combinacionDisponible
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-amber-200 bg-amber-50"
                            }`}>
                            <div className="flex items-start gap-3">
                                {validandoCombinacion
                                    ? <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600" />
                                    : combinacionDisponible
                                        ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                        : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}

                                <div>
                                    <div className={`text-xs font-black ${validandoCombinacion
                                        ? "text-blue-800"
                                        : combinacionDisponible
                                            ? "text-emerald-800"
                                            : "text-amber-800"
                                        }`}>
                                        {validandoCombinacion
                                            ? "Validando requisitos..."
                                            : combinacionDisponible
                                                ? "Checklist disponible"
                                                : "Combinación no configurada"}
                                    </div>

                                    {!validandoCombinacion ? (
                                        <p className={`mt-1 text-xs ${combinacionDisponible
                                            ? "text-emerald-700"
                                            : "text-amber-700"
                                            }`}>
                                            {combinacionDisponible
                                                ? `Se generarán ${cantidadRequisitos} requisitos documentales para este expediente.`
                                                : "Combinación no permitida."}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* BOTONES */}
                    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={creando}
                            onClick={() => setOpenCrear(false)}
                            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            disabled={creando || validandoCombinacion || !combinacionDisponible}
                            onClick={crearExpediente}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#1d2d86] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                            {creando ? "Creando..." : "Crear Expediente"}
                        </button>
                    </div>
                </div>
            </Modal>

            <EditorFormatoPdf
                open={editorPdf.open}
                expediente={editorPdf.expediente}
                formato={editorPdf.formato}
                camposIniciales={editorPdf.camposIniciales}
                onClose={cerrarEditorFormato}
                onGuardar={guardarFormatoPdf}
            />

            {/* PREVIEW PDF */}
            <Modal
                open={preview.open}
                title={preview.title || "Documento PDF"}
                onClose={() => setPreview({ open: false, url: "", title: "" })}
                maxWidth="max-w-6xl"
            >
                {preview.url ? (
                    <iframe
                        src={preview.url}
                        title={preview.title}
                        className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white"
                    />
                ) : null}
            </Modal>
        </div>
    );
}