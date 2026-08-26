import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    Building2, CheckCircle2, ChevronRight, CircleAlert, Eye, FileCheck2,
    FileText, FolderOpen, Loader2, Plus, Search, ShieldCheck, Trash2,
    UploadCloud, User, X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";
const STORAGE_KEY = "servicios_financieros_expedientes";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

const TIPOS_PERSONA = [
    { value: "fisica_asalariada", label: "Persona Física Asalariada" },
    { value: "fisica_profesionista", label: "Persona Física Profesionista" },
    { value: "moral", label: "Persona Moral" },
];

const TIPOS_FINANCIAMIENTO = [
    { value: "credit", label: "Credit" },
    { value: "leasing", label: "Leasing" },
];

/*
|--------------------------------------------------------------------------
| MATRIZ DE REQUISITOS
|--------------------------------------------------------------------------
|
| Un requisito = un PDF.
|
| Si un requisito necesita varias hojas/documentos, el usuario deberá
| unirlos previamente en un solo PDF.
|
| "obligatorio: false" significa "en caso de aplicar" y NO afecta
| el porcentaje de avance.
|
*/

const REQUISITOS = {
    fisica_asalariada: {
        leasing: [
            {
                id: "identificacion",
                nombre: "Identificación oficial",
                descripcion: "INE o Pasaporte con Licencia",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "comprobante_domicilio",
                nombre: "Comprobante de domicilio",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "constancia_fiscal",
                nombre: "Constancia de Situación Fiscal",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "nomina_ultimos_2_meses",
                nombre: "Comprobantes de Nómina de últimos 2 meses",
                descripcion: "Recibos y estados de cuenta. Integrar todo en un solo PDF.",
                obligatorio: true,
                grupo: "Comprobación de ingresos",
            },
            {
                id: "pagos_especiales",
                nombre: "Recibos de pagos especiales",
                descripcion: "Aguinaldo, PTU, bonos o compensaciones anuales, en caso de aplicar.",
                obligatorio: false,
                grupo: "Comprobación de ingresos",
            },
            {
                id: "solicitud_origen",
                nombre: "Solicitud de Origen",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "consulta_buro",
                nombre: "Consulta de Buró firmada",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "resumen_operacion",
                nombre: "Resumen de Operación",
                obligatorio: true,
                grupo: "Operación",
            },
        ],

        /*
         * Aún no proporcionaron los requisitos específicos
         * para Persona Física Asalariada + Credit.
         */
        credit: null,
    },

    /*
     * El documento proporcionado no diferencia Credit vs Leasing
     * para Persona Física Profesionista.
     * Por ahora se utiliza el mismo checklist para ambos.
     */
    fisica_profesionista: {
        credit: [
            {
                id: "identificacion",
                nombre: "Identificación oficial",
                descripcion: "INE o Pasaporte con Licencia",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "comprobante_domicilio",
                nombre: "Comprobante de domicilio",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "constancia_fiscal",
                nombre: "Constancia de Situación Fiscal",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "estados_cuenta_3_meses",
                nombre: "Estados de Cuenta de últimos 3 meses",
                descripcion: "Integrar los tres meses en un solo PDF.",
                obligatorio: true,
                grupo: "Comprobación de ingresos",
            },
            {
                id: "solicitud_origen",
                nombre: "Solicitud de Origen",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "consulta_buro",
                nombre: "Consulta de Buró firmada",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "resumen_operacion",
                nombre: "Resumen de Operación",
                obligatorio: true,
                grupo: "Operación",
            },
        ],

        leasing: [
            {
                id: "identificacion",
                nombre: "Identificación oficial",
                descripcion: "INE o Pasaporte con Licencia",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "comprobante_domicilio",
                nombre: "Comprobante de domicilio",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "constancia_fiscal",
                nombre: "Constancia de Situación Fiscal",
                obligatorio: true,
                grupo: "Documentación personal",
            },
            {
                id: "estados_cuenta_3_meses",
                nombre: "Estados de Cuenta de últimos 3 meses",
                descripcion: "Integrar los tres meses en un solo PDF.",
                obligatorio: true,
                grupo: "Comprobación de ingresos",
            },
            {
                id: "solicitud_origen",
                nombre: "Solicitud de Origen",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "consulta_buro",
                nombre: "Consulta de Buró firmada",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "resumen_operacion",
                nombre: "Resumen de Operación",
                obligatorio: true,
                grupo: "Operación",
            },
        ],
    },

    /*
     * Igual que profesionistas:
     * no se proporcionó una separación Credit / Leasing.
     */
    moral: {
        credit: [
            {
                id: "solicitud_origen",
                nombre: "Solicitud de Origen",
                obligatorio: true,
                grupo: "Operación",
            },

            /* APODERADO */
            {
                id: "apoderado_identificacion",
                nombre: "INE o Pasaporte del Apoderado",
                obligatorio: true,
                grupo: "Del Apoderado",
            },
            {
                id: "apoderado_comprobante_domicilio",
                nombre: "Comprobante de domicilio del Apoderado",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "Del Apoderado",
            },
            {
                id: "apoderado_constancia_fiscal",
                nombre: "Constancia de Situación Fiscal del Apoderado",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "Del Apoderado",
            },

            /* EMPRESA */
            {
                id: "empresa_constancia_fiscal",
                nombre: "Constancia de Situación Fiscal de la Empresa",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_comprobante_domicilio",
                nombre: "Comprobante de Domicilio de la Empresa",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_estados_cuenta",
                nombre: "Estados de Cuenta completos de últimos 2 meses",
                descripcion: "Integrar ambos meses en un solo PDF.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_declaracion_anual",
                nombre: "Acuse de Recibo y Declaración Anual",
                descripcion: "Del año anterior. Archivos PDF descargados del SAT.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_estados_financieros",
                nombre: "Estados Financieros Internos",
                descripcion: "Del año anterior, firmados por Apoderado y Contador.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_acta_constitutiva",
                nombre: "Acta Constitutiva",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_poder_notarial",
                nombre: "Poder Notarial",
                descripcion: "En caso de que aplique.",
                obligatorio: false,
                grupo: "De la Empresa",
            },
        ],

        leasing: [
            {
                id: "solicitud_origen",
                nombre: "Solicitud de Origen",
                obligatorio: true,
                grupo: "Operación",
            },
            {
                id: "apoderado_identificacion",
                nombre: "INE o Pasaporte del Apoderado",
                obligatorio: true,
                grupo: "Del Apoderado",
            },
            {
                id: "apoderado_comprobante_domicilio",
                nombre: "Comprobante de domicilio del Apoderado",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "Del Apoderado",
            },
            {
                id: "apoderado_constancia_fiscal",
                nombre: "Constancia de Situación Fiscal del Apoderado",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "Del Apoderado",
            },
            {
                id: "empresa_constancia_fiscal",
                nombre: "Constancia de Situación Fiscal de la Empresa",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_comprobante_domicilio",
                nombre: "Comprobante de Domicilio de la Empresa",
                descripcion: "Con fecha actualizada.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_estados_cuenta",
                nombre: "Estados de Cuenta completos de últimos 2 meses",
                descripcion: "Integrar ambos meses en un solo PDF.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_declaracion_anual",
                nombre: "Acuse de Recibo y Declaración Anual",
                descripcion: "Del año anterior. Archivos PDF descargados del SAT.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_estados_financieros",
                nombre: "Estados Financieros Internos",
                descripcion: "Del año anterior, firmados por Apoderado y Contador.",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_acta_constitutiva",
                nombre: "Acta Constitutiva",
                obligatorio: true,
                grupo: "De la Empresa",
            },
            {
                id: "empresa_poder_notarial",
                nombre: "Poder Notarial",
                descripcion: "En caso de que aplique.",
                obligatorio: false,
                grupo: "De la Empresa",
            },
        ],
    },
};

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizar(value) {
    return normalizeStr(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function crearId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatBytes(bytes = 0) {
    if (!bytes) return "0 KB";

    const unidades = ["B", "KB", "MB", "GB"];
    let valor = Number(bytes);
    let indice = 0;

    while (valor >= 1024 && indice < unidades.length - 1) {
        valor /= 1024;
        indice++;
    }

    return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}

function obtenerNombreTipoPersona(value) {
    return TIPOS_PERSONA.find((item) => item.value === value)?.label || value;
}

function obtenerNombreFinanciamiento(value) {
    return TIPOS_FINANCIAMIENTO.find((item) => item.value === value)?.label || value;
}

function obtenerRequisitos(tipoPersona, financiamiento) {
    return REQUISITOS?.[tipoPersona]?.[financiamiento] ?? null;
}

function calcularAvance(expediente) {
    const requisitos = obtenerRequisitos(
        expediente?.tipo_persona,
        expediente?.financiamiento
    );

    if (!Array.isArray(requisitos) || !requisitos.length) {
        return {
            porcentaje: 0,
            completados: 0,
            total: 0,
            faltantes: 0,
        };
    }

    const obligatorios = requisitos.filter((req) => req.obligatorio);
    const documentos = expediente?.documentos || {};

    const completados = obligatorios.filter(
        (req) => !!documentos[req.id]
    ).length;

    const total = obligatorios.length;

    return {
        completados,
        total,
        faltantes: total - completados,
        porcentaje: total ? Math.round((completados / total) * 100) : 0,
    };
}

async function validarPdf(file) {
    if (!file) {
        return {
            ok: false,
            error: "No se seleccionó ningún archivo.",
        };
    }

    const nombre = normalizar(file.name);
    const mime = normalizar(file.type);

    if (!nombre.endsWith(".pdf")) {
        return {
            ok: false,
            error: "Solo se permiten archivos con extensión .pdf.",
        };
    }

    if (mime && mime !== "application/pdf") {
        return {
            ok: false,
            error: "El archivo seleccionado no tiene formato MIME PDF.",
        };
    }

    /*
     * Validación adicional.
     * Un PDF real normalmente comienza con "%PDF-".
     *
     * Esto evita que alguien simplemente cambie:
     * foto.jpg -> foto.pdf
     */
    try {
        const cabecera = await file.slice(0, 5).text();

        if (cabecera !== "%PDF-") {
            return {
                ok: false,
                error: "El archivo no parece ser un PDF válido.",
            };
        }
    } catch (error) {
        console.error("No se pudo validar cabecera PDF:", error);
    }

    return { ok: true };
}

function Modal({ open, title, onClose, children, maxWidth = "max-w-3xl" }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div
                    className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-xl border border-[#131E5C] bg-white shadow-2xl`}
                >
                    <div className="flex items-center justify-between gap-3 bg-[#131E5C] px-5 py-4">
                        <div className="truncate text-base font-extrabold text-white">
                            {title}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto p-5">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, required = false, children }) {
    return (
        <label className="block">
            <div className="mb-1.5 text-xs font-extrabold text-[#131E5C]">
                {label}
                {required ? <span className="ml-1 text-red-500">*</span> : null}
            </div>

            {children}
        </label>
    );
}

function Badge({ children, type = "neutral" }) {
    const classes = {
        neutral: "bg-slate-100 text-slate-600",
        blue: "bg-blue-50 text-blue-700",
        green: "bg-emerald-50 text-emerald-700",
        yellow: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${classes[type]}`}
        >
            {children}
        </span>
    );
}

function BarraAvance({ porcentaje = 0, grande = false }) {
    const completo = porcentaje >= 100;

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                    className={`font-bold text-slate-500 ${grande ? "text-xs" : "text-[10px]"
                        }`}
                >
                    Avance documental
                </span>

                <span
                    className={`font-black ${completo ? "text-emerald-600" : "text-[#131E5C]"
                        } ${grande ? "text-base" : "text-xs"}`}
                >
                    {porcentaje}%
                </span>
            </div>

            <div
                className={`overflow-hidden rounded-full bg-slate-200 ${grande ? "h-3" : "h-2"
                    }`}
            >
                <div
                    className={`h-full rounded-full transition-all duration-500 ${completo ? "bg-emerald-500" : "bg-[#131E5C]"
                        }`}
                    style={{ width: `${porcentaje}%` }}
                />
            </div>
        </div>
    );
}

function DocumentoCard({
    requisito,
    documento,
    uploading,
    onSeleccionar,
    onVer,
    onEliminar,
}) {
    return (
        <div
            className={[
                "rounded-xl border p-4 transition",
                documento
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-black/10 bg-white",
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                    <div
                        className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            documento
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-[#131E5C]/10 text-[#131E5C]",
                        ].join(" ")}
                    >
                        {documento ? (
                            <FileCheck2 className="h-5 w-5" />
                        ) : (
                            <FileText className="h-5 w-5" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-extrabold text-[#131E5C]">
                                {requisito.nombre}
                            </div>

                            {requisito.obligatorio ? (
                                <Badge type="red">Obligatorio</Badge>
                            ) : (
                                <Badge type="yellow">En caso de aplicar</Badge>
                            )}
                        </div>

                        {requisito.descripcion ? (
                            <div className="mt-1 text-xs leading-5 text-slate-500">
                                {requisito.descripcion}
                            </div>
                        ) : null}
                    </div>
                </div>

                {documento ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : null}
            </div>

            {documento ? (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-[#131E5C]">
                                {documento.nombre}
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                <span>PDF</span>
                                <span>•</span>
                                <span>{formatBytes(documento.tamano)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onVer(documento)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#131E5C]/20 px-3 py-2 text-xs font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Ver
                            </button>

                            <button
                                type="button"
                                onClick={() => onEliminar(requisito, documento)}
                                disabled={uploading}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <label
                        className={[
                            "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#131E5C]/40 bg-[#131E5C]/[0.03] px-4 py-3 text-xs font-bold text-[#131E5C] transition hover:border-[#131E5C] hover:bg-[#131E5C]/[0.06]",
                            uploading ? "pointer-events-none opacity-50" : "",
                        ].join(" ")}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="h-4 w-4" />
                        )}

                        {uploading ? "Subiendo..." : "Seleccionar PDF"}

                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            disabled={uploading}
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";

                                if (file) {
                                    onSeleccionar(requisito, file);
                                }
                            }}
                        />
                    </label>

                    <div className="mt-2 text-center text-[10px] font-semibold text-slate-400">
                        Solo un archivo PDF por requisito
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Documentacion({
    expedientesIniciales = [],
    onCrearExpediente,
    onSubirDocumento,
    onEliminarDocumento,
    onNotificarAvance,
}) {
    const { user } = useAuth();

    const permisos = user?.permisos || [];
    const rol = normalizar(user?.rol);

    const isAdmin = useMemo(
        () =>
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN"),
        [rol, permisos]
    );

    const isGerenteServiciosFinancieros = useMemo(
        () =>
            rol === "gerente de servicios financieros" ||
            rol === "gerente servicios financieros" ||
            rol.includes("gerente") &&
            rol.includes("servicios") &&
            rol.includes("financieros") ||
            permisos.includes("FINANCIEROS_GERENTE"),
        [rol, permisos]
    );

    const userAgencias = useMemo(
        () =>
            String(user?.agencia || "")
                .split("|")
                .map(normalizeStr)
                .filter(Boolean),
        [user?.agencia]
    );

    /*
     * Utilizamos varios campos posibles para no acoplar el componente
     * a una sola versión de tu AuthContext.
     */
    const usuarioActualId =
        user?.id ??
        user?.user_id ??
        user?.pk ??
        user?.username ??
        user?.email ??
        "";

    const usuarioActualNombre =
        user?.nombre_completo ||
        user?.nombre ||
        user?.name ||
        user?.username ||
        user?.email ||
        "Usuario";

    const inputClass =
        "h-10 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10";

    const [expedientes, setExpedientes] = useState(() => {
        if (expedientesIniciales.length) return expedientesIniciales;

        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const [expedienteActivoId, setExpedienteActivoId] = useState(null);
    const [openCrear, setOpenCrear] = useState(false);
    const [creando, setCreando] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroDealer, setFiltroDealer] = useState("Todos");
    const [uploading, setUploading] = useState({});
    const [mensaje, setMensaje] = useState(null);

    const [preview, setPreview] = useState({
        open: false,
        url: "",
        title: "",
        temporal: false,
    });

    const [nuevo, setNuevo] = useState({
        tipo_persona: "",
        financiamiento: "",
        cliente: "",
        agencia: isAdmin ? "" : userAgencias[0] || "",
    });

    useEffect(() => {
        if (expedientesIniciales.length) {
            setExpedientes(expedientesIniciales);
        }
    }, [expedientesIniciales]);

    useEffect(() => {
        /*
         * LocalStorage es únicamente fallback para poder probar
         * esta interfaz antes de conectarla a Django.
         *
         * Los File reales NO se pueden persistir correctamente aquí.
         */
        if (!onCrearExpediente) {
            try {
                const serializable = expedientes.map((exp) => ({
                    ...exp,
                    documentos: Object.fromEntries(
                        Object.entries(exp.documentos || {}).map(
                            ([key, doc]) => [
                                key,
                                {
                                    ...doc,
                                    file: undefined,
                                    preview_url: undefined,
                                },
                            ]
                        )
                    ),
                }));

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(serializable)
                );
            } catch (error) {
                console.error(error);
            }
        }
    }, [expedientes, onCrearExpediente]);

    const puedeVerExpediente = (expediente) => {
        if (isAdmin) return true;

        if (isGerenteServiciosFinancieros) {
            return userAgencias.some(
                (dealer) =>
                    normalizar(dealer) === normalizar(expediente.agencia)
            );
        }

        return (
            String(expediente.asesor_id || "") ===
            String(usuarioActualId || "")
        );
    };

    const expedientesVisibles = useMemo(() => {
        const q = normalizar(busqueda);

        return expedientes.filter((exp) => {
            if (!puedeVerExpediente(exp)) return false;

            if (
                filtroDealer !== "Todos" &&
                normalizar(exp.agencia) !== normalizar(filtroDealer)
            ) {
                return false;
            }

            if (!q) return true;

            return [
                exp.cliente,
                exp.agencia,
                exp.asesor_nombre,
                obtenerNombreTipoPersona(exp.tipo_persona),
                obtenerNombreFinanciamiento(exp.financiamiento),
                exp.folio,
            ].some((value) => normalizar(value).includes(q));
        });
    }, [
        expedientes,
        busqueda,
        filtroDealer,
        isAdmin,
        isGerenteServiciosFinancieros,
        userAgencias,
        usuarioActualId,
    ]);

    const expedienteActivo = useMemo(
        () =>
            expedientes.find(
                (exp) => String(exp.id) === String(expedienteActivoId)
            ) || null,
        [expedientes, expedienteActivoId]
    );

    const requisitosActivos = useMemo(() => {
        if (!expedienteActivo) return [];

        return (
            obtenerRequisitos(
                expedienteActivo.tipo_persona,
                expedienteActivo.financiamiento
            ) || []
        );
    }, [expedienteActivo]);

    const requisitosPorGrupo = useMemo(() => {
        const grupos = {};

        requisitosActivos.forEach((requisito) => {
            const grupo = requisito.grupo || "Documentación";

            if (!grupos[grupo]) grupos[grupo] = [];

            grupos[grupo].push(requisito);
        });

        return grupos;
    }, [requisitosActivos]);

    const dealersDisponibles = useMemo(() => {
        if (isAdmin) return DEALERS;

        return userAgencias;
    }, [isAdmin, userAgencias]);

    const mostrarMensaje = (type, text) => {
        setMensaje({ type, text });

        window.clearTimeout(mostrarMensaje.timer);

        mostrarMensaje.timer = window.setTimeout(() => {
            setMensaje(null);
        }, 4500);
    };

    const resetNuevo = () => {
        setNuevo({
            tipo_persona: "",
            financiamiento: "",
            cliente: "",
            agencia: isAdmin ? "" : userAgencias[0] || "",
        });
    };

    const abrirCrear = () => {
        resetNuevo();
        setOpenCrear(true);
    };

    const combinacionDisponible = useMemo(() => {
        if (!nuevo.tipo_persona || !nuevo.financiamiento) return true;

        return Array.isArray(
            obtenerRequisitos(
                nuevo.tipo_persona,
                nuevo.financiamiento
            )
        );
    }, [nuevo.tipo_persona, nuevo.financiamiento]);

    const crearExpediente = async () => {
        if (creando) return;

        if (!nuevo.tipo_persona) {
            mostrarMensaje("error", "Selecciona el tipo de persona.");
            return;
        }

        if (!nuevo.financiamiento) {
            mostrarMensaje("error", "Selecciona el tipo de financiamiento.");
            return;
        }

        if (!combinacionDisponible) {
            mostrarMensaje(
                "error",
                "Los requisitos para esta combinación todavía no han sido configurados."
            );
            return;
        }

        if (!normalizeStr(nuevo.cliente)) {
            mostrarMensaje("error", "Captura el nombre del cliente.");
            return;
        }

        if (!normalizeStr(nuevo.agencia)) {
            mostrarMensaje("error", "Selecciona el Dealer.");
            return;
        }

        setCreando(true);

        try {
            const payload = {
                tipo_persona: nuevo.tipo_persona,
                financiamiento: nuevo.financiamiento,
                cliente: normalizeStr(nuevo.cliente),
                agencia: normalizeStr(nuevo.agencia),

                asesor_id: usuarioActualId,
                asesor_nombre: usuarioActualNombre,

                documentos: {},
            };

            let creado;

            if (onCrearExpediente) {
                creado = await onCrearExpediente(payload);
            } else {
                creado = {
                    ...payload,
                    id: crearId(),
                    folio: `SF-${Date.now().toString().slice(-8)}`,
                    creado_en: new Date().toISOString(),
                };
            }

            const expedienteFinal = {
                ...payload,
                ...creado,
                documentos: creado?.documentos || {},
            };

            setExpedientes((prev) => [
                expedienteFinal,
                ...prev,
            ]);

            setExpedienteActivoId(expedienteFinal.id);
            setOpenCrear(false);

            mostrarMensaje(
                "success",
                "Expediente creado correctamente."
            );

            await notificarAvance(
                "expediente_creado",
                expedienteFinal
            );
        } catch (error) {
            console.error(error);

            mostrarMensaje(
                "error",
                "No se pudo crear el expediente."
            );
        } finally {
            setCreando(false);
        }
    };

    const notificarAvance = async (tipo, expediente) => {
        if (!onNotificarAvance) return;

        const avance = calcularAvance(expediente);

        try {
            await onNotificarAvance({
                tipo,
                expediente,
                avance,
            });
        } catch (error) {
            /*
             * Un fallo de correo NO debe bloquear el guardado
             * del expediente.
             */
            console.error(
                "No se pudo enviar la notificación:",
                error
            );
        }
    };

    const actualizarDocumentoLocal = (
        expedienteId,
        requisitoId,
        documento
    ) => {
        let expedienteActualizado = null;

        setExpedientes((prev) =>
            prev.map((exp) => {
                if (
                    String(exp.id) !== String(expedienteId)
                ) {
                    return exp;
                }

                expedienteActualizado = {
                    ...exp,
                    documentos: {
                        ...(exp.documentos || {}),
                        [requisitoId]: documento,
                    },
                };

                return expedienteActualizado;
            })
        );

        return expedienteActualizado;
    };

    const subirDocumento = async (requisito, file) => {
        if (!expedienteActivo) return;

        /*
         * Restricción:
         * un archivo por requisito.
         */
        if (expedienteActivo.documentos?.[requisito.id]) {
            mostrarMensaje(
                "error",
                "Este requisito ya tiene un documento. Elimínalo antes de cargar otro."
            );
            return;
        }

        const validacion = await validarPdf(file);

        if (!validacion.ok) {
            mostrarMensaje("error", validacion.error);
            return;
        }

        const key = `${expedienteActivo.id}-${requisito.id}`;

        setUploading((prev) => ({
            ...prev,
            [key]: true,
        }));

        try {
            let documento;

            if (onSubirDocumento) {
                documento = await onSubirDocumento({
                    expediente_id: expedienteActivo.id,
                    requisito_id: requisito.id,
                    requisito: requisito.nombre,
                    archivo: file,
                });
            } else {
                documento = {
                    id: crearId(),
                    requisito_id: requisito.id,
                    nombre: file.name,
                    tamano: file.size,
                    mime: "application/pdf",
                    file,
                    preview_url: URL.createObjectURL(file),
                    creado_en: new Date().toISOString(),
                };
            }

            const documentoFinal = {
                ...documento,
                requisito_id: requisito.id,
                nombre:
                    documento?.nombre ||
                    documento?.nombre_original ||
                    file.name,
                tamano:
                    documento?.tamano ||
                    documento?.tamano_bytes ||
                    file.size,
                mime:
                    documento?.mime ||
                    documento?.tipo_mime ||
                    "application/pdf",
                file: documento?.file || file,
            };

            /*
             * Generamos el expediente actualizado manualmente
             * para poder calcular correctamente el nuevo porcentaje
             * antes de notificar.
             */
            const actualizado = {
                ...expedienteActivo,
                documentos: {
                    ...(expedienteActivo.documentos || {}),
                    [requisito.id]: documentoFinal,
                },
            };

            setExpedientes((prev) =>
                prev.map((exp) =>
                    String(exp.id) ===
                        String(expedienteActivo.id)
                        ? actualizado
                        : exp
                )
            );

            mostrarMensaje(
                "success",
                `"${requisito.nombre}" cargado correctamente.`
            );

            await notificarAvance(
                "documento_cargado",
                actualizado
            );
        } catch (error) {
            console.error(error);

            mostrarMensaje(
                "error",
                "No se pudo cargar el documento."
            );
        } finally {
            setUploading((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const eliminarDocumentoRequisito = async (
        requisito,
        documento
    ) => {
        if (!expedienteActivo) return;

        const key = `${expedienteActivo.id}-${requisito.id}`;

        setUploading((prev) => ({
            ...prev,
            [key]: true,
        }));

        try {
            if (onEliminarDocumento) {
                await onEliminarDocumento({
                    expediente_id: expedienteActivo.id,
                    requisito_id: requisito.id,
                    documento,
                });
            }

            if (documento.preview_url?.startsWith("blob:")) {
                URL.revokeObjectURL(documento.preview_url);
            }

            const nuevosDocumentos = {
                ...(expedienteActivo.documentos || {}),
            };

            delete nuevosDocumentos[requisito.id];

            const actualizado = {
                ...expedienteActivo,
                documentos: nuevosDocumentos,
            };

            setExpedientes((prev) =>
                prev.map((exp) =>
                    String(exp.id) ===
                        String(expedienteActivo.id)
                        ? actualizado
                        : exp
                )
            );

            mostrarMensaje(
                "success",
                "Documento eliminado. Ya puedes cargar uno nuevo."
            );

            await notificarAvance(
                "documento_eliminado",
                actualizado
            );
        } catch (error) {
            console.error(error);

            mostrarMensaje(
                "error",
                "No fue posible eliminar el documento."
            );
        } finally {
            setUploading((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const verDocumento = (documento) => {
        let url =
            documento.url ||
            documento.archivo ||
            documento.preview_url ||
            "";

        let temporal = false;

        if (!url && documento.file instanceof File) {
            url = URL.createObjectURL(documento.file);
            temporal = true;
        }

        if (!url) {
            mostrarMensaje(
                "error",
                "Este documento todavía no tiene una URL disponible."
            );
            return;
        }

        setPreview({
            open: true,
            url,
            title: documento.nombre || "Documento",
            temporal,
        });
    };

    const cerrarPreview = () => {
        if (preview.temporal && preview.url) {
            URL.revokeObjectURL(preview.url);
        }

        setPreview({
            open: false,
            url: "",
            title: "",
            temporal: false,
        });
    };

    return (
        <div className="w-full space-y-4">
            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#131E5C] text-white">
                        <FolderOpen className="h-5 w-5" />
                    </div>

                    <div>
                        <h1 className="font-vw-header text-lg font-extrabold text-[#131E5C]">
                            Servicios Financieros
                        </h1>

                        <p className="text-xs text-slate-400">
                            Expedientes y documentación financiera
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={abrirCrear}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/90"
                >
                    <Plus className="h-4 w-4" />
                    Crear Expediente
                </button>
            </div>

            {/* =====================================================
                MENSAJE
            ===================================================== */}

            {mensaje ? (
                <div
                    className={[
                        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold",
                        mensaje.type === "error"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : mensaje.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-blue-200 bg-blue-50 text-blue-700",
                    ].join(" ")}
                >
                    {mensaje.type === "error" ? (
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    )}

                    {mensaje.text}
                </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[370px_minmax(0,1fr)]">
                {/* =================================================
                    LISTADO DE EXPEDIENTES
                ================================================= */}

                <div className="h-fit overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                    <div className="border-b border-black/10 p-4">
                        <div className="text-sm font-extrabold text-[#131E5C]">
                            Expedientes
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                            {expedientesVisibles.length} expediente
                            {expedientesVisibles.length !== 1
                                ? "s"
                                : ""}
                        </div>

                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#131E5C]/20 px-3">
                            <Search className="h-4 w-4 shrink-0 text-[#131E5C]" />

                            <input
                                value={busqueda}
                                onChange={(event) =>
                                    setBusqueda(event.target.value)
                                }
                                placeholder="Buscar cliente, asesor..."
                                className="h-9 min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#131E5C] outline-none"
                            />

                            {busqueda ? (
                                <button
                                    type="button"
                                    onClick={() => setBusqueda("")}
                                >
                                    <X className="h-3.5 w-3.5 text-slate-400" />
                                </button>
                            ) : null}
                        </div>

                        {(isAdmin ||
                            isGerenteServiciosFinancieros) && (
                                <select
                                    value={filtroDealer}
                                    onChange={(event) =>
                                        setFiltroDealer(
                                            event.target.value
                                        )
                                    }
                                    className={`${inputClass} mt-2`}
                                >
                                    <option value="Todos">
                                        Todos los Dealers
                                    </option>

                                    {dealersDisponibles.map((dealer) => (
                                        <option
                                            key={dealer}
                                            value={dealer}
                                        >
                                            {dealer}
                                        </option>
                                    ))}
                                </select>
                            )}
                    </div>

                    <div className="max-h-[calc(100vh-300px)] overflow-auto p-2">
                        {expedientesVisibles.length ? (
                            <div className="space-y-2">
                                {expedientesVisibles.map(
                                    (expediente) => {
                                        const avance =
                                            calcularAvance(
                                                expediente
                                            );

                                        const activo =
                                            String(
                                                expedienteActivoId
                                            ) ===
                                            String(expediente.id);

                                        return (
                                            <button
                                                key={expediente.id}
                                                type="button"
                                                onClick={() =>
                                                    setExpedienteActivoId(
                                                        expediente.id
                                                    )
                                                }
                                                className={[
                                                    "w-full rounded-lg border p-3 text-left transition",
                                                    activo
                                                        ? "border-[#131E5C] bg-[#131E5C]/[0.04]"
                                                        : "border-black/10 bg-white hover:bg-slate-50",
                                                ].join(" ")}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                                            {expediente.cliente}
                                                        </div>

                                                        <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                                            {expediente.folio ||
                                                                expediente.id}
                                                        </div>
                                                    </div>

                                                    <ChevronRight
                                                        className={`h-4 w-4 shrink-0 ${activo
                                                            ? "text-[#131E5C]"
                                                            : "text-slate-300"
                                                            }`}
                                                    />
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    <Badge type="blue">
                                                        {obtenerNombreTipoPersona(
                                                            expediente.tipo_persona
                                                        )}
                                                    </Badge>

                                                    <Badge>
                                                        {obtenerNombreFinanciamiento(
                                                            expediente.financiamiento
                                                        )}
                                                    </Badge>
                                                </div>

                                                <div className="mt-3">
                                                    <BarraAvance
                                                        porcentaje={
                                                            avance.porcentaje
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-2 text-[10px] font-semibold text-slate-400">
                                                    <span>
                                                        {
                                                            expediente.agencia
                                                        }
                                                    </span>

                                                    <span className="truncate">
                                                        {
                                                            expediente.asesor_nombre
                                                        }
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <FolderOpen className="mx-auto h-8 w-8 text-slate-300" />

                                <div className="mt-3 text-sm font-bold text-[#131E5C]">
                                    Sin expedientes
                                </div>

                                <div className="mt-1 text-xs text-slate-400">
                                    No existen expedientes para
                                    mostrar.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* =================================================
                    DETALLE
                ================================================= */}

                {!expedienteActivo ? (
                    <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <div>
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131E5C]/10 text-[#131E5C]">
                                <FolderOpen className="h-8 w-8" />
                            </div>

                            <h2 className="mt-4 text-base font-extrabold text-[#131E5C]">
                                Selecciona un expediente
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                                Selecciona un expediente del listado
                                o crea uno nuevo para comenzar la
                                carga de documentación.
                            </p>

                            <button
                                type="button"
                                onClick={abrirCrear}
                                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2.5 text-sm font-bold text-white"
                            >
                                <Plus className="h-4 w-4" />
                                Crear Expediente
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="min-w-0 space-y-4">
                        {/* CABECERA EXPEDIENTE */}

                        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-black text-[#131E5C]">
                                            {expedienteActivo.cliente}
                                        </h2>

                                        {calcularAvance(
                                            expedienteActivo
                                        ).porcentaje === 100 ? (
                                            <Badge type="green">
                                                Expediente completo
                                            </Badge>
                                        ) : (
                                            <Badge type="yellow">
                                                En proceso
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mt-2 text-xs font-semibold text-slate-400">
                                        Folio:{" "}
                                        <span className="text-slate-600">
                                            {expedienteActivo.folio ||
                                                expedienteActivo.id}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Badge type="blue">
                                            {obtenerNombreTipoPersona(
                                                expedienteActivo.tipo_persona
                                            )}
                                        </Badge>

                                        <Badge>
                                            {obtenerNombreFinanciamiento(
                                                expedienteActivo.financiamiento
                                            )}
                                        </Badge>

                                        <Badge>
                                            {expedienteActivo.agencia}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="w-full max-w-sm rounded-xl bg-slate-50 p-4">
                                    <BarraAvance
                                        grande
                                        porcentaje={
                                            calcularAvance(
                                                expedienteActivo
                                            ).porcentaje
                                        }
                                    />

                                    <div className="mt-3 flex justify-between text-[10px] font-semibold text-slate-500">
                                        <span>
                                            {
                                                calcularAvance(
                                                    expedienteActivo
                                                ).completados
                                            }{" "}
                                            completados
                                        </span>

                                        <span>
                                            {
                                                calcularAvance(
                                                    expedienteActivo
                                                ).faltantes
                                            }{" "}
                                            pendientes
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Asesor responsable
                                    </div>

                                    <div className="mt-1 text-xs font-bold text-[#131E5C]">
                                        {expedienteActivo.asesor_nombre ||
                                            "—"}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Dealer
                                    </div>

                                    <div className="mt-1 text-xs font-bold text-[#131E5C]">
                                        {expedienteActivo.agencia}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* REQUISITOS */}

                        {Object.entries(requisitosPorGrupo).map(
                            ([grupo, requisitos]) => (
                                <div
                                    key={grupo}
                                    className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"
                                >
                                    <div className="border-b border-black/10 bg-slate-50 px-5 py-3">
                                        <div className="text-xs font-black uppercase tracking-wide text-[#131E5C]">
                                            {grupo}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 p-4 lg:grid-cols-2">
                                        {requisitos.map(
                                            (requisito) => {
                                                const documento =
                                                    expedienteActivo
                                                        .documentos?.[
                                                    requisito.id
                                                    ];

                                                const key = `${expedienteActivo.id}-${requisito.id}`;

                                                return (
                                                    <DocumentoCard
                                                        key={
                                                            requisito.id
                                                        }
                                                        requisito={
                                                            requisito
                                                        }
                                                        documento={
                                                            documento
                                                        }
                                                        uploading={
                                                            !!uploading[
                                                            key
                                                            ]
                                                        }
                                                        onSeleccionar={
                                                            subirDocumento
                                                        }
                                                        onVer={
                                                            verDocumento
                                                        }
                                                        onEliminar={
                                                            eliminarDocumentoRequisito
                                                        }
                                                    />
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* =====================================================
                MODAL CREAR EXPEDIENTE
            ===================================================== */}

            <Modal
                open={openCrear}
                title="Crear Expediente"
                onClose={() => {
                    if (!creando) setOpenCrear(false);
                }}
            >
                <div className="space-y-5">
                    <div>
                        <h3 className="text-base font-extrabold text-[#131E5C]">
                            Datos del expediente
                        </h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* PRIMERA VARIABLE */}

                        <Field
                            label="1. Tipo de Persona"
                            required
                        >
                            <select
                                value={nuevo.tipo_persona}
                                onChange={(event) =>
                                    setNuevo((prev) => ({
                                        ...prev,
                                        tipo_persona:
                                            event.target.value,
                                        financiamiento: "",
                                    }))
                                }
                                className={inputClass}
                            >
                                <option value="">
                                    Selecciona el tipo de persona...
                                </option>

                                {TIPOS_PERSONA.map((tipo) => (
                                    <option
                                        key={tipo.value}
                                        value={tipo.value}
                                    >
                                        {tipo.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* SEGUNDA VARIABLE */}

                        <Field
                            label="2. Tipo de Financiamiento"
                            required
                        >
                            <select
                                value={nuevo.financiamiento}
                                disabled={!nuevo.tipo_persona}
                                onChange={(event) =>
                                    setNuevo((prev) => ({
                                        ...prev,
                                        financiamiento:
                                            event.target.value,
                                    }))
                                }
                                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <option value="">
                                    Selecciona el financiamiento...
                                </option>

                                {TIPOS_FINANCIAMIENTO.map(
                                    (financiamiento) => (
                                        <option
                                            key={
                                                financiamiento.value
                                            }
                                            value={
                                                financiamiento.value
                                            }
                                        >
                                            {
                                                financiamiento.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </Field>

                        <div className="sm:col-span-2">
                            <Field
                                label="Cliente / Razón Social"
                                required
                            >
                                <input
                                    value={nuevo.cliente}
                                    onChange={(event) =>
                                        setNuevo((prev) => ({
                                            ...prev,
                                            cliente:
                                                event.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                    placeholder={
                                        nuevo.tipo_persona ===
                                            "moral"
                                            ? "Razón social"
                                            : "Nombre completo del cliente"
                                    }
                                />
                            </Field>
                        </div>

                        <div className="sm:col-span-2">
                            <Field label="Dealer" required>
                                <div className="relative">
                                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]" />

                                    <select
                                        value={nuevo.agencia}
                                        disabled={
                                            !isAdmin &&
                                            userAgencias.length <= 1
                                        }
                                        onChange={(event) =>
                                            setNuevo((prev) => ({
                                                ...prev,
                                                agencia:
                                                    event.target.value,
                                            }))
                                        }
                                        className={`${inputClass} pl-9 disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                        <option value="">
                                            Selecciona el Dealer...
                                        </option>

                                        {dealersDisponibles.map(
                                            (dealer) => (
                                                <option
                                                    key={dealer}
                                                    value={dealer}
                                                >
                                                    {dealer}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </Field>
                        </div>
                    </div>

                    {nuevo.tipo_persona &&
                        nuevo.financiamiento ? (
                        combinacionDisponible ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                    <div>
                                        <div className="text-xs font-extrabold text-emerald-800">
                                            Checklist disponible
                                        </div>

                                        <div className="mt-1 text-xs text-emerald-700">
                                            Se generarán{" "}
                                            {
                                                obtenerRequisitos(
                                                    nuevo.tipo_persona,
                                                    nuevo.financiamiento
                                                ).length
                                            }{" "}
                                            requisitos para este
                                            expediente.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                                    <div>
                                        <div className="text-xs font-extrabold text-amber-800">
                                            Requisitos pendientes de
                                            configuración
                                        </div>

                                        <div className="mt-1 text-xs leading-5 text-amber-700">
                                            Aún no se proporcionó el
                                            checklist para{" "}
                                            {obtenerNombreTipoPersona(
                                                nuevo.tipo_persona
                                            )}{" "}
                                            +{" "}
                                            {obtenerNombreFinanciamiento(
                                                nuevo.financiamiento
                                            )}
                                            .
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : null}

                    <div className="flex flex-col-reverse gap-2 border-t border-black/10 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setOpenCrear(false)}
                            disabled={creando}
                            className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={crearExpediente}
                            disabled={
                                creando ||
                                !combinacionDisponible
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#131E5C]/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FolderOpen className="h-4 w-4" />
                            )}

                            {creando
                                ? "Creando..."
                                : "Crear Expediente"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* =====================================================
                VISTA PREVIA
            ===================================================== */}

            <Modal
                open={preview.open}
                title={preview.title || "Documento PDF"}
                onClose={cerrarPreview}
                maxWidth="max-w-6xl"
            >
                {preview.url ? (
                    <iframe
                        src={preview.url}
                        title={preview.title}
                        className="h-[75vh] w-full rounded-lg border border-black/10 bg-white"
                    />
                ) : null}
            </Modal>
        </div>
    );
}