import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    PDFCheckBox,
    PDFDocument,
    PDFDropdown,
    PDFOptionList,
    PDFRadioGroup,
    PDFTextField,
    StandardFonts,
} from "pdf-lib";
import { CheckCircle2, FileText, Loader2, RefreshCw, Save, X } from "lucide-react";

function nombreLegible(nombre = "") {
    return String(nombre)
        .split(".")
        .pop()
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
}

function tipoCampoPdf(field) {
    if (field instanceof PDFTextField) return "text";
    if (field instanceof PDFCheckBox) return "checkbox";
    if (field instanceof PDFDropdown) return "dropdown";
    if (field instanceof PDFRadioGroup) return "radio";
    if (field instanceof PDFOptionList) return "optionlist";
    return "unknown";
}

function informacionCampo(field) {
    const tipo = tipoCampoPdf(field);
    const nombre = field.getName();

    const base = {
        nombre,
        tipo,
        readonly: typeof field.isReadOnly === "function" ? field.isReadOnly() : false,
        opciones: [],
        multiline: false,
        valor: "",
    };

    try {
        switch (tipo) {
            case "text":
                base.valor = field.getText() || "";
                base.multiline = typeof field.isMultiline === "function" ? field.isMultiline() : false;
                break;

            case "checkbox":
                base.valor = field.isChecked();
                break;

            case "dropdown":
                base.opciones = field.getOptions() || [];
                base.valor = field.getSelected()?.[0] || "";
                break;

            case "radio":
                base.opciones = field.getOptions() || [];
                base.valor = field.getSelected() || "";
                break;

            case "optionlist":
                base.opciones = field.getOptions() || [];
                base.valor = field.getSelected() || [];
                break;

            default:
                return null;
        }

        return base;
    } catch (error) {
        console.warn(`No se pudo leer el campo PDF "${nombre}":`, error);
        return null;
    }
}

async function cargarPlantillaPdf(url) {
    console.log("Cargando plantilla PDF:", url);

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/pdf" },
    });

    if (!response.ok) {
        throw new Error(`No fue posible cargar la plantilla PDF. HTTP ${response.status}. Ruta: ${url}`);
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const bytes = new Uint8Array(await response.arrayBuffer());

    const cabecera = new TextDecoder("latin1").decode(bytes.slice(0, 5));

    if (cabecera !== "%PDF-") {
        let contenido = "";

        try {
            contenido = new TextDecoder("utf-8")
                .decode(bytes.slice(0, 300))
                .replace(/\s+/g, " ")
                .trim();
        } catch {
            contenido = "";
        }

        if (
            contentType.includes("text/html") ||
            contenido.toLowerCase().includes("<!doctype html") ||
            contenido.toLowerCase().includes("<html")
        ) {
            throw new Error(`La ruta "${url}" devolvió HTML en lugar del PDF.`);
        }

        throw new Error(`El recurso recibido no es un PDF válido. Cabecera: "${cabecera || "vacía"}".`);
    }

    let pdfDoc;

    try {
        pdfDoc = await PDFDocument.load(bytes, {
            ignoreEncryption: false,
            updateMetadata: false,
        });
    } catch (error) {
        console.error("Error interpretando PDF:", error);
        throw new Error(`No fue posible interpretar el PDF: ${error?.message || "error desconocido"}`);
    }

    let camposOriginales;

    try {
        const form = pdfDoc.getForm();
        camposOriginales = form.getFields();
    } catch (error) {
        console.error("Error obteniendo AcroForm:", error);
        throw new Error("El PDF se cargó, pero no fue posible leer su formulario.");
    }

    const campos = [];
    const tiposNoSoportados = new Set();

    for (const field of camposOriginales) {
        const info = informacionCampo(field);

        if (info) {
            campos.push(info);
        } else {
            tiposNoSoportados.add(field.constructor?.name || "desconocido");
        }
    }

    console.log("Campos PDF encontrados:", camposOriginales.length);
    console.log("Campos PDF editables compatibles:", campos.length);

    if (tiposNoSoportados.size) {
        console.log(
            "Tipos ignorados:",
            [...tiposNoSoportados]
        );
    }

    if (!campos.length) {
        throw new Error(
            `Se detectaron ${camposOriginales.length} campos en el PDF, pero ninguno corresponde a un tipo editable compatible.`
        );
    }

    const valores = {};

    campos.forEach((campo) => {
        valores[campo.nombre] = campo.valor;
    });

    return {
        bytes,
        campos,
        valores,
    };
}

async function construirPdf(bytesOriginales, valores = {}) {
    if (!bytesOriginales?.length) {
        throw new Error("No hay una plantilla PDF cargada.");
    }

    const cabecera = new TextDecoder("latin1").decode(
        bytesOriginales.slice(0, 5)
    );

    if (cabecera !== "%PDF-") {
        throw new Error(
            "Los datos utilizados como plantilla no corresponden a un PDF."
        );
    }

    const pdfDoc = await PDFDocument.load(bytesOriginales, {
        ignoreEncryption: false,
        updateMetadata: false,
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    let modificados = 0;

    for (const field of fields) {
        const nombre = field.getName();

        if (!Object.prototype.hasOwnProperty.call(valores, nombre)) {
            continue;
        }

        const tipo = tipoCampoPdf(field);
        const valor = valores[nombre];

        try {
            switch (tipo) {
                case "text":
                    field.setText(
                        valor === null || valor === undefined
                            ? ""
                            : String(valor)
                    );

                    modificados++;
                    break;

                case "checkbox":
                    valor ? field.check() : field.uncheck();

                    modificados++;
                    break;

                case "dropdown":
                    if (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor) !== ""
                    ) {
                        field.select(String(valor));
                    } else if (typeof field.clear === "function") {
                        field.clear();
                    }

                    modificados++;
                    break;

                case "radio":
                    if (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor) !== ""
                    ) {
                        field.select(String(valor));
                    } else if (typeof field.clear === "function") {
                        field.clear();
                    }

                    modificados++;
                    break;

                case "optionlist": {
                    const seleccion = Array.isArray(valor)
                        ? valor
                        : valor
                            ? [String(valor)]
                            : [];

                    if (seleccion.length) {
                        field.select(seleccion);
                    } else if (typeof field.clear === "function") {
                        field.clear();
                    }

                    modificados++;
                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.warn(
                `No se pudo actualizar el campo "${nombre}":`,
                error
            );
        }
    }

    console.log(
        `Campos actualizados en PDF: ${modificados}/${fields.length}`
    );

    /*
     * Conservamos el formulario editable.
     *
     * NO usar:
     *
     * form.flatten();
     */
    try {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        form.updateFieldAppearances(font);
    } catch (error) {
        console.warn(
            "No se pudieron actualizar completamente las apariencias del PDF:",
            error
        );
    }

    return pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50,
    });
}

function CampoPdf({ campo, value, onChange }) {
    const inputClass = "w-full rounded-lg border border-[#131E5C]/20 bg-white px-3 py-2 text-xs font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10 disabled:bg-slate-100 disabled:text-slate-400";

    if (campo.tipo === "checkbox") {
        return (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                <input
                    type="checkbox"
                    checked={!!value}
                    disabled={campo.readonly}
                    onChange={(event) => onChange(event.target.checked)}
                    className="h-4 w-4 accent-[#131E5C]"
                />

                <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-[#131E5C]">
                        {nombreLegible(campo.nombre)}
                    </div>

                    <div className="mt-0.5 truncate text-[9px] text-slate-400">
                        {campo.nombre}
                    </div>
                </div>
            </label>
        );
    }

    if (campo.tipo === "dropdown" || campo.tipo === "radio") {
        return (
            <label className="block">
                <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                    {nombreLegible(campo.nombre)}
                </div>

                <select
                    value={value || ""}
                    disabled={campo.readonly}
                    onChange={(event) => onChange(event.target.value)}
                    className={inputClass}
                >
                    <option value="">Selecciona...</option>

                    {campo.opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>
                            {opcion}
                        </option>
                    ))}
                </select>

                <div className="mt-1 truncate text-[9px] text-slate-400">
                    {campo.nombre}
                </div>
            </label>
        );
    }

    if (campo.tipo === "optionlist") {
        const seleccion = Array.isArray(value) ? value : [];

        return (
            <label className="block">
                <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                    {nombreLegible(campo.nombre)}
                </div>

                <select
                    multiple
                    value={seleccion}
                    disabled={campo.readonly}
                    onChange={(event) =>
                        onChange(
                            Array.from(event.target.selectedOptions)
                                .map((item) => item.value)
                        )
                    }
                    className={`${inputClass} min-h-[100px]`}
                >
                    {campo.opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>
                            {opcion}
                        </option>
                    ))}
                </select>

                <div className="mt-1 truncate text-[9px] text-slate-400">
                    {campo.nombre}
                </div>
            </label>
        );
    }

    if (campo.tipo === "text") {
        return (
            <label className="block">
                <div className="mb-1.5 text-xs font-black text-[#131E5C]">
                    {nombreLegible(campo.nombre)}
                </div>

                {campo.multiline ? (
                    <textarea
                        value={value ?? ""}
                        disabled={campo.readonly}
                        onChange={(event) => onChange(event.target.value)}
                        className={`${inputClass} min-h-[80px] resize-y`}
                    />
                ) : (
                    <input
                        type="text"
                        value={value ?? ""}
                        disabled={campo.readonly}
                        onChange={(event) => onChange(event.target.value)}
                        className={inputClass}
                    />
                )}

                <div className="mt-1 truncate text-[9px] text-slate-400">
                    {campo.nombre}
                </div>
            </label>
        );
    }

    return null;
}

export default function EditorFormatoPdf({
    open,
    expediente,
    formato,
    camposIniciales = {},
    onClose,
    onGuardar,
}) {
    const pdfBaseRef = useRef(null);

    const [campos, setCampos] = useState([]);
    const [valores, setValores] = useState({});
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [actualizando, setActualizando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const establecerPreview = (bytes) => {
        if (!bytes?.length) return;

        const blob = new Blob(
            [bytes],
            {
                type: "application/pdf",
            }
        );

        const nuevaUrl = URL.createObjectURL(blob);

        setPreviewUrl((urlAnterior) => {
            if (
                urlAnterior &&
                urlAnterior.startsWith("blob:")
            ) {
                URL.revokeObjectURL(urlAnterior);
            }

            return nuevaUrl;
        });
    };

    useEffect(() => {
        return () => {
            setPreviewUrl((urlActual) => {
                if (
                    urlActual &&
                    urlActual.startsWith("blob:")
                ) {
                    URL.revokeObjectURL(urlActual);
                }

                return "";
            });
        };
    }, []);

    useEffect(() => {
        if (!open || !formato?.url) return;

        let activo = true;

        const cargar = async () => {
            setLoading(true);
            setError("");
            setCampos([]);
            setValores({});
            pdfBaseRef.current = null;

            console.log("========== EDITOR PDF ==========");
            console.log("Formato:", formato.label);
            console.log("Archivo:", formato.archivo);
            console.log("URL:", formato.url);
            console.log("================================");

            try {
                const resultado = await cargarPlantillaPdf(
                    formato.url
                );

                if (!activo) return;

                pdfBaseRef.current =
                    resultado.bytes;

                const valoresFinales = {
                    ...resultado.valores,
                    ...(camposIniciales || {}),
                };

                setCampos(
                    resultado.campos
                );

                setValores(
                    valoresFinales
                );

                console.log(
                    `${resultado.campos.length} campos editables detectados`
                );

                const bytesPreview =
                    await construirPdf(
                        resultado.bytes,
                        valoresFinales
                    );

                if (
                    activo &&
                    bytesPreview
                ) {
                    establecerPreview(
                        bytesPreview
                    );
                }
            } catch (err) {
                console.error(
                    "Error cargando editor PDF:",
                    err
                );

                if (activo) {
                    setError(
                        err?.message ||
                        "No fue posible cargar el formato."
                    );
                }
            } finally {
                if (activo) {
                    setLoading(false);
                }
            }
        };

        cargar();

        return () => {
            activo = false;
        };
    }, [
        open,
        formato?.url,
    ]);

    const cambiarValor = (nombre, valor) => {
        setValores((prev) => ({
            ...prev,
            [nombre]: valor,
        }));
    };

    const actualizarPreview = async () => {
        if (!pdfBaseRef.current || actualizando) return;

        setActualizando(true);
        setError("");

        try {
            const bytes = await construirPdf(pdfBaseRef.current, valores);
            establecerPreview(bytes);
        } catch (err) {
            console.error("Error actualizando PDF:", err);
            setError(err?.message || "No fue posible actualizar la vista previa.");
        } finally {
            setActualizando(false);
        }
    };

    const guardar = async () => {
        if (!pdfBaseRef.current || guardando) return;

        setGuardando(true);
        setError("");

        try {
            const bytes = await construirPdf(pdfBaseRef.current, valores);

            const folio = String(expediente?.folio || expediente?.id_expediente || "expediente")
                .replace(/[^\w.-]+/g, "_");

            const nombreBase = formato.archivo.replace(/\.pdf$/i, "");

            const archivo = new File(
                [bytes],
                `${folio}-${nombreBase}.pdf`,
                { type: "application/pdf" },
            );

            await onGuardar({
                archivo,
                campos: valores,
                plantilla: formato.value,
            });
        } catch (err) {
            console.error("Error guardando formato PDF:", err);
            setError(err?.message || "No fue posible guardar el formato PDF.");
        } finally {
            setGuardando(false);
        }
    };

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-[2px]">
            <div className="flex h-full items-center justify-center p-2 sm:p-4">
                <div className="flex h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                    {/* HEADER */}
                    <div className="flex shrink-0 items-center justify-between bg-[#131E5C] px-5 py-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-black text-white">
                                <FileText className="h-5 w-5" />
                                Editar formato de solicitud
                            </div>

                            <div className="mt-1 truncate text-[10px] font-semibold text-white/60">
                                {expediente?.folio} · {expediente?.cliente} · {formato?.archivo}
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={guardando}
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* CONTENIDO */}
                    <div className="grid min-h-0 flex-1 lg:grid-cols-[430px_minmax(0,1fr)]">
                        {/* CAMPOS */}
                        <aside className="min-h-0 overflow-auto border-r border-slate-200 bg-slate-50">
                            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
                                <div className="text-xs font-black text-[#131E5C]">
                                    Campos editables
                                </div>

                                <div className="mt-1 text-[10px] text-slate-400">
                                    {campos.length} campo{campos.length === 1 ? "" : "s"} detectado{campos.length === 1 ? "" : "s"} en el PDF.
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex min-h-[300px] items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#131E5C]" />
                                        <div className="mt-2 text-xs font-bold text-[#131E5C]">
                                            Leyendo campos del PDF...
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 p-4">
                                    {campos.map((campo) => (
                                        <CampoPdf
                                            key={campo.nombre}
                                            campo={campo}
                                            value={valores[campo.nombre]}
                                            onChange={(valor) => cambiarValor(campo.nombre, valor)}
                                        />
                                    ))}

                                    {!campos.length && !error ? (
                                        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-400">
                                            No se encontraron campos editables.
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </aside>

                        {/* PREVIEW */}
                        <main className="relative min-h-0 bg-slate-200 p-2">
                            {(loading || actualizando) ? (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                                    <div className="text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#131E5C]" />
                                        <div className="mt-2 text-xs font-black text-[#131E5C]">
                                            {loading ? "Cargando formato..." : "Actualizando vista previa..."}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {previewUrl ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=1&navpanes=0`}
                                    title="Vista previa del formato"
                                    className="h-full w-full rounded-lg border border-slate-300 bg-white"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-center text-slate-400">
                                        <FileText className="mx-auto h-10 w-10" />
                                        <div className="mt-2 text-xs font-bold">
                                            Sin vista previa
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>

                    {/* ERROR */}
                    {error ? (
                        <div className="shrink-0 border-t border-red-200 bg-red-50 px-5 py-3 text-xs font-bold text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {/* FOOTER */}
                    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center">
                        <div className="flex flex-1 items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            La copia guardada continuará teniendo campos PDF editables.
                        </div>

                        <button
                            type="button"
                            disabled={loading || actualizando || guardando}
                            onClick={actualizarPreview}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-xs font-black text-[#131E5C] hover:bg-slate-50 disabled:opacity-50"
                        >
                            {actualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Actualizar vista previa
                        </button>

                        <button
                            type="button"
                            disabled={guardando}
                            onClick={onClose}
                            className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-black text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            disabled={loading || guardando || !campos.length}
                            onClick={guardar}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-5 text-xs font-black text-white hover:bg-[#1d2d86] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {guardando ? "Guardando..." : "Guardar copia en expediente"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}