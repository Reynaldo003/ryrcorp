// src/pages/Documentacion/Documentacion.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, CheckCircle2, ChevronDown, CircleAlert, Eye, FileCheck2, FileText, FolderOpen, Loader2, Plus, Search, Trash2, UploadCloud, UserRound, X } from "lucide-react";
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
    if (!normalizar(file.name).endsWith(".pdf")) return { ok: false, error: "Solo se permiten archivos PDF." };
    if (file.type && normalizar(file.type) !== "application/pdf") return { ok: false, error: "El archivo seleccionado no tiene formato PDF." };

    try {
        if (await file.slice(0, 5).text() !== "%PDF-") return { ok: false, error: "El archivo seleccionado no parece ser un PDF válido." };
    } catch (error) {
        console.error("No fue posible validar la cabecera del PDF:", error);
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
        <div className={`relative overflow-hidden rounded-2xl border transition ${documento ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/70" : "border-slate-200 bg-white hover:border-[#131E5C]/30 hover:shadow-sm"}`}>
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${documento ? "bg-emerald-100 text-emerald-700" : "bg-[#131E5C]/[0.07] text-[#131E5C]"}`}>
                        {documento ? <FileCheck2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="text-sm font-black leading-5 text-[#131E5C]">{requisito.nombre}</div>
                            {requisito.obligatorio ? <Badge type="red">Obligatorio</Badge> : <Badge type="yellow">Opcional</Badge>}
                        </div>

                        {requisito.descripcion ? <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{requisito.descripcion}</p> : null}
                    </div>
                </div>

                {documento ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                        <div className="flex items-center gap-3 p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[10px] font-black text-red-600">PDF</div>

                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-extrabold text-[#131E5C]">{documento.nombre_original || documento.requisito_nombre}</div>
                                <div className="mt-1 text-[10px] font-semibold text-slate-400">{formatBytes(documento.tamano_bytes)} · Documento cargado</div>
                            </div>

                            <button type="button" onClick={() => onVer(documento)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#131E5C]/15 text-[#131E5C] transition hover:bg-[#131E5C] hover:text-white" title="Visualizar PDF">
                                <Eye className="h-4 w-4" />
                            </button>

                            {editable ? (
                                <button type="button" disabled={uploading} onClick={() => onEliminar(documento)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50" title="Eliminar documento">
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : editable ? (
                    <div className="mt-4">
                        <label className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#131E5C]/20 bg-[#131E5C]/[0.025] px-4 py-4 text-center transition hover:border-[#131E5C]/60 hover:bg-[#131E5C]/[0.05] ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#131E5C] shadow-sm transition group-hover:-translate-y-0.5">
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                            </div>

                            <div className="mt-2 text-xs font-black text-[#131E5C]">{uploading ? "Subiendo PDF..." : "Seleccionar PDF"}</div>
                            <div className="mt-1 text-[10px] font-semibold text-slate-400">Solo 1 archivo · Formato PDF</div>

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
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[11px] font-semibold text-slate-400">
                        Documento pendiente
                    </div>
                )}
            </div>
        </div>
    );
}

function ExpedienteCard({ expediente, abierto, editable, uploading, onToggle, onSeleccionar, onVer, onEliminar }) {
    const avance = expediente.avance || { porcentaje: 0, completados: 0, faltantes: 0, total: 0 };
    return (
        <article className={`overflow-hidden rounded-2xl border bg-white transition-all duration-900 ${abierto ? "border-[#131E5C]/40 shadow-[0_18px_50px_rgba(19,30,92,.09)]" : "border-slate-200 shadow-sm hover:border-[#131E5C]/20 hover:shadow-md"}`}>
            <button
                type="button"
                onClick={onToggle}
                className="group w-full text-left"
            >
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                    {/* PROGRESO */}
                    <div className="flex shrink-0 items-center justify-between gap-3 lg:block">
                        <ProgressRing value={avance.porcentaje} />

                        <div className="lg:hidden">
                            {avance.porcentaje >= 100
                                ? <Badge type="green">Completo</Badge>
                                : <Badge type="yellow">En proceso</Badge>}
                        </div>
                    </div>

                    {/* CLIENTE / EXPEDIENTE */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-black text-[#131E5C] sm:text-lg">
                                {expediente.cliente}
                            </h2>

                            <div className="hidden lg:block">
                                {avance.porcentaje >= 100
                                    ? <Badge type="green">Completo</Badge>
                                    : <Badge type="yellow">En proceso</Badge>}
                            </div>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">
                                {expediente.folio}
                            </span>

                            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                            <span className="text-[10px] font-semibold text-slate-400">
                                {avance.completados} de {avance.total} requisitos completos
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge type="blue">{nombrePersona(expediente.tipo_persona)}</Badge>
                            <Badge>{nombreFinanciamiento(expediente.financiamiento)}</Badge>
                        </div>
                    </div>

                    {/* INFORMACIÓN OPERATIVA */}
                    <div className="grid min-w-0 gap-2 sm:grid-cols-3 lg:w-[560px] lg:shrink-0">
                        {/* ASESOR */}
                        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition group-hover:bg-white">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#131E5C]/[0.07] text-[#131E5C]">
                                <UserRound className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <div className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
                                    Asesor
                                </div>

                                <div className="mt-0.5 truncate text-[11px] font-black text-[#131E5C]">
                                    {expediente.asesor_nombre || "Sin asignar"}
                                </div>
                            </div>
                        </div>

                        {/* DEALER */}
                        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition group-hover:bg-white">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#131E5C]/[0.07] text-[#131E5C]">
                                <Building2 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <div className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
                                    Dealer
                                </div>

                                <div className="mt-0.5 truncate text-[11px] font-black text-[#131E5C]">
                                    {expediente.agencia || "Sin Dealer"}
                                </div>
                            </div>
                        </div>

                        {/* CREADO POR */}
                        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 transition group-hover:bg-white">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#131E5C]/[0.07] text-[#131E5C]">
                                <FileCheck2 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <div className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
                                    Creado por
                                </div>

                                <div className="mt-0.5 truncate text-[11px] font-black text-[#131E5C]">
                                    {expediente.creado_por || "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESPLEGAR */}
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl transition-all duration-300 lg:self-auto ${abierto
                                ? "rotate-180 bg-[#131E5C] text-white shadow-md"
                                : "bg-slate-100 text-[#131E5C] group-hover:bg-[#131E5C] group-hover:text-white"
                            }`}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                {/* BARRA DE AVANCE */}
                <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${avance.porcentaje >= 100
                                        ? "bg-emerald-500"
                                        : "bg-[#131E5C]"
                                    }`}
                                style={{ width: `${avance.porcentaje}%` }}
                            />
                        </div>

                        <span
                            className={`min-w-[38px] text-right text-[10px] font-black ${avance.porcentaje >= 100
                                    ? "text-emerald-600"
                                    : "text-[#131E5C]"
                                }`}
                        >
                            {avance.porcentaje}%
                        </span>
                    </div>
                </div>
            </button>

            {abierto ? (
                <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-black text-[#131E5C]">Documentos del expediente</h3>

                            <p className="mt-1 text-[11px] text-slate-400">
                                {avance.faltantes
                                    ? `${avance.faltantes} requisito${avance.faltantes === 1 ? "" : "s"} obligatorio${avance.faltantes === 1 ? "" : "s"} pendiente${avance.faltantes === 1 ? "" : "s"}.`
                                    : "Todos los requisitos obligatorios están completos."}
                            </p>
                        </div>

                        {!editable ? <Badge type="blue">Modo solo lectura</Badge> : null}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
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
                    </div>
                </div>
            ) : null}
        </article>
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
            setExpedientes(normalizarListado(data));
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
            ),
        );

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
                <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#131E5C]" />
                        <div className="mt-3 text-xs font-black text-[#131E5C]">Cargando expedientes...</div>
                    </div>
                </div>
            ) : expedientesVisibles.length ? (
                <div className="space-y-3">
                    {expedientesVisibles.map((expediente) => (
                        <ExpedienteCard
                            key={expediente.id_expediente}
                            expediente={expediente}
                            abierto={String(abiertoId) === String(expediente.id_expediente)}
                            editable={puedeEditar(expediente)}
                            uploading={uploading}
                            onToggle={() => setAbiertoId((prev) => String(prev) === String(expediente.id_expediente) ? null : expediente.id_expediente)}
                            onSeleccionar={subirDocumento}
                            onVer={verDocumento}
                            onEliminar={eliminarDocumento}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131E5C]/[0.06] text-[#131E5C]">
                            <FolderOpen className="h-7 w-7" />
                        </div>

                        <h2 className="mt-4 text-base font-black text-[#131E5C]">No hay expedientes</h2>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            {busqueda || filtroDealer !== "Todos" || filtroAsesor !== "Todos"
                                ? "No se encontraron expedientes con los filtros seleccionados."
                                : "Crea el primer expediente para comenzar la carga documental."}
                        </p>

                        {!busqueda && filtroDealer === "Todos" && filtroAsesor === "Todos" ? (
                            <button type="button" onClick={abrirCrear} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-xs font-black text-white">
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