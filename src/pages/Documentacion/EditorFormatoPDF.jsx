import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import {
    PDFCheckBox,
    PDFDocument,
    PDFDropdown,
    PDFOptionList,
    PDFRadioGroup,
    PDFTextField,
    StandardFonts,
} from "pdf-lib";
import { FileText, Loader2, Save, Search, X } from "lucide-react";

import "./EditorFormatoPDF.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

/* ============================================================
 * UTILIDADES
 * ============================================================ */

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

/* ============================================================
 * CARGAR PDF
 * ============================================================ */

async function cargarPdfComoBytes(url) {
    const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
            Accept: "application/pdf",
        },
    });

    if (!response.ok) {
        throw new Error(
            `No fue posible cargar el PDF. HTTP ${response.status}.`,
        );
    }

    const bytes = new Uint8Array(
        await response.arrayBuffer(),
    );

    const cabecera = new TextDecoder("latin1").decode(
        bytes.slice(0, 5),
    );

    if (cabecera !== "%PDF-") {
        throw new Error(
            "El archivo recibido no corresponde a un PDF válido.",
        );
    }

    return bytes;
}

/* ============================================================
 * CAMPOS DEL PDF
 * ============================================================ */

async function obtenerCamposPdf(bytes) {
    const pdfDoc = await PDFDocument.load(
        bytes,
        {
            ignoreEncryption: false,
            updateMetadata: false,
        },
    );

    const form = pdfDoc.getForm();

    return form.getFields().map((field) => {
        const tipo = tipoCampoPdf(field);
        const nombre = field.getName();

        const campo = {
            nombre,
            label: nombreLegible(nombre),
            tipo,
            readonly:
                typeof field.isReadOnly === "function"
                    ? field.isReadOnly()
                    : false,
            opciones: [],
            valor: "",
            multiline: false,
            maxLength: null,
        };

        try {
            switch (tipo) {
                case "text":
                    campo.valor =
                        field.getText() || "";

                    campo.multiline =
                        typeof field.isMultiline === "function"
                            ? field.isMultiline()
                            : false;

                    campo.maxLength =
                        typeof field.getMaxLength === "function"
                            ? field.getMaxLength() || null
                            : null;

                    break;

                case "checkbox":
                    campo.valor =
                        field.isChecked();
                    break;

                case "dropdown":
                    campo.opciones =
                        field.getOptions() || [];

                    campo.valor =
                        field.getSelected()?.[0] || "";

                    break;

                case "radio":
                    campo.opciones =
                        field.getOptions() || [];

                    campo.valor =
                        field.getSelected() || "";

                    break;

                case "optionlist":
                    campo.opciones =
                        field.getOptions() || [];

                    campo.valor =
                        field.getSelected() || [];

                    break;

                default:
                    campo.readonly = true;
                    break;
            }
        } catch (error) {
            console.warn(
                `No se pudo leer el campo "${nombre}":`,
                error,
            );
        }

        return campo;
    });
}

/* ============================================================
 * RESTAURAR JSON GUARDADO
 * ============================================================ */

async function aplicarCamposIniciales(
    bytesOriginales,
    valores = {},
) {
    if (
        !valores ||
        typeof valores !== "object" ||
        !Object.keys(valores).length
    ) {
        return bytesOriginales;
    }

    const pdfDoc = await PDFDocument.load(
        bytesOriginales,
        {
            ignoreEncryption: false,
            updateMetadata: false,
        },
    );

    const form = pdfDoc.getForm();

    for (const field of form.getFields()) {
        const nombre = field.getName();

        if (
            !Object.prototype.hasOwnProperty.call(
                valores,
                nombre,
            )
        ) {
            continue;
        }

        const tipo = tipoCampoPdf(field);
        const valor = valores[nombre];

        try {
            switch (tipo) {
                case "text":
                    field.setText(
                        valor === null ||
                            valor === undefined
                            ? ""
                            : String(valor),
                    );
                    break;

                case "checkbox":
                    valor
                        ? field.check()
                        : field.uncheck();
                    break;

                case "dropdown":
                    if (valor) {
                        field.select(
                            String(valor),
                        );
                    } else {
                        field.clear?.();
                    }
                    break;

                case "radio":
                    if (valor) {
                        field.select(
                            String(valor),
                        );
                    } else {
                        field.clear?.();
                    }
                    break;

                case "optionlist": {
                    const seleccion =
                        Array.isArray(valor)
                            ? valor
                            : valor
                                ? [String(valor)]
                                : [];

                    if (seleccion.length) {
                        field.select(seleccion);
                    } else {
                        field.clear?.();
                    }

                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.warn(
                `No se pudo restaurar "${nombre}":`,
                error,
            );
        }
    }

    try {
        const font =
            await pdfDoc.embedFont(
                StandardFonts.Helvetica,
            );

        form.updateFieldAppearances(font);
    } catch (error) {
        console.warn(
            "No fue posible actualizar las apariencias:",
            error,
        );
    }

    return pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50,
    });
}
async function generarPdfFinal(bytesOriginales, valores = {}) {
    if (!bytesOriginales?.length) {
        throw new Error("No existe una plantilla PDF cargada.");
    }

    const pdfDoc = await PDFDocument.load(bytesOriginales, {
        ignoreEncryption: false,
        updateMetadata: false,
    });

    const form = pdfDoc.getForm();

    for (const field of form.getFields()) {
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
                    break;

                case "checkbox":
                    if (valor) {
                        field.check();
                    } else {
                        field.uncheck();
                    }
                    break;

                case "dropdown":
                    if (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor) !== ""
                    ) {
                        field.select(String(valor));
                    } else {
                        field.clear?.();
                    }
                    break;

                case "radio":
                    if (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor) !== ""
                    ) {
                        field.select(String(valor));
                    } else {
                        field.clear?.();
                    }
                    break;

                case "optionlist": {
                    const seleccion = Array.isArray(valor)
                        ? valor
                        : valor
                            ? [String(valor)]
                            : [];

                    if (seleccion.length) {
                        field.select(seleccion);
                    } else {
                        field.clear?.();
                    }

                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.warn(
                `No se pudo aplicar el valor al campo "${nombre}":`,
                error
            );
        }
    }

    /*
     * Conservamos los campos editables.
     * NO usamos form.flatten().
     */
    try {
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        form.updateFieldAppearances(font);
    } catch (error) {
        console.warn(
            "No fue posible actualizar todas las apariencias del PDF:",
            error
        );
    }

    return pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50,
    });
}
/* ============================================================
 * EXTRAER JSON DEL PDF FINAL
 * ============================================================ */

async function extraerCamposPdf(bytesModificados) {
    const pdfDoc = await PDFDocument.load(
        bytesModificados,
        {
            ignoreEncryption: false,
            updateMetadata: false,
        },
    );

    const form = pdfDoc.getForm();
    const valores = {};

    for (const field of form.getFields()) {
        const nombre = field.getName();
        const tipo = tipoCampoPdf(field);

        try {
            switch (tipo) {
                case "text":
                    valores[nombre] =
                        field.getText() || "";
                    break;

                case "checkbox":
                    valores[nombre] =
                        field.isChecked();
                    break;

                case "dropdown":
                    valores[nombre] =
                        field.getSelected()?.[0] || "";
                    break;

                case "radio":
                    valores[nombre] =
                        field.getSelected() || "";
                    break;

                case "optionlist":
                    valores[nombre] =
                        field.getSelected() || [];
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.warn(
                `No se pudo extraer "${nombre}":`,
                error,
            );
        }
    }

    return valores;
}

/* ============================================================
 * CAMPO DEL MENÚ LATERAL
 * ============================================================ */

function CampoLateral({
    campo,
    valor,
    onChange,
    onUbicar,
}) {
    const inputClass =
        "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10 disabled:bg-slate-100 disabled:text-slate-400";

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div
                        className="cursor-pointer truncate text-xs font-black text-[#131E5C] hover:underline"
                        onClick={() => onUbicar(campo)}
                        title="Ubicar campo en el PDF"
                    >
                        {campo.label}
                    </div>

                    <div
                        className="mt-0.5 truncate text-[9px] text-slate-400"
                        title={campo.nombre}
                    >
                        {campo.nombre}
                    </div>
                </div>

                {campo.maxLength ? (
                    <span className="shrink-0 text-[9px] font-bold text-slate-400">
                        {String(valor || "").length}/{campo.maxLength}
                    </span>
                ) : null}
            </div>

            {campo.tipo === "text" ? (
                campo.multiline ? (
                    <textarea
                        value={valor ?? ""}
                        disabled={campo.readonly}
                        maxLength={campo.maxLength || undefined}
                        onChange={(event) =>
                            onChange(
                                campo,
                                event.target.value,
                            )
                        }
                        className={`${inputClass} min-h-[70px] resize-y py-2`}
                    />
                ) : (
                    <input
                        type="text"
                        value={valor ?? ""}
                        disabled={campo.readonly}
                        maxLength={campo.maxLength || undefined}
                        onChange={(event) =>
                            onChange(
                                campo,
                                event.target.value,
                            )
                        }
                        className={inputClass}
                    />
                )
            ) : null}

            {campo.tipo === "checkbox" ? (
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={!!valor}
                        disabled={campo.readonly}
                        onChange={(event) =>
                            onChange(
                                campo,
                                event.target.checked,
                            )
                        }
                        className="h-4 w-4 accent-[#131E5C]"
                    />

                    <span className="text-xs font-semibold text-slate-600">
                        {valor ? "Sí" : "No"}
                    </span>
                </label>
            ) : null}

            {(campo.tipo === "dropdown" ||
                campo.tipo === "radio") ? (
                <select
                    value={valor || ""}
                    disabled={campo.readonly}
                    onChange={(event) =>
                        onChange(
                            campo,
                            event.target.value,
                        )
                    }
                    className={inputClass}
                >
                    <option value="">
                        Selecciona...
                    </option>

                    {campo.opciones.map((opcion) => (
                        <option
                            key={opcion}
                            value={opcion}
                        >
                            {opcion}
                        </option>
                    ))}
                </select>
            ) : null}

            {campo.tipo === "optionlist" ? (
                <select
                    multiple
                    value={
                        Array.isArray(valor)
                            ? valor
                            : []
                    }
                    disabled={campo.readonly}
                    onChange={(event) =>
                        onChange(
                            campo,
                            Array.from(
                                event.target.selectedOptions,
                            ).map(
                                (item) =>
                                    item.value,
                            ),
                        )
                    }
                    className={`${inputClass} min-h-[90px] py-2`}
                >
                    {campo.opciones.map((opcion) => (
                        <option
                            key={opcion}
                            value={opcion}
                        >
                            {opcion}
                        </option>
                    ))}
                </select>
            ) : null}

            {campo.tipo === "unknown" ? (
                <div className="text-[10px] font-semibold text-slate-400">
                    Tipo de campo no compatible.
                </div>
            ) : null}
        </div>
    );
}

/* ============================================================
 * COMPONENTE PRINCIPAL
 * ============================================================ */

export default function EditorFormatoPdf({
    open,
    expediente,
    formato,
    camposIniciales = {},
    onClose,
    onGuardar,
}) {
    const contenedorRef = useRef(null);
    const pdfProxyRef = useRef(null);
    const pdfBaseRef = useRef(null);

    const [pdfBytes, setPdfBytes] =
        useState(null);

    const [numPages, setNumPages] =
        useState(0);

    const [anchoPagina, setAnchoPagina] =
        useState(900);

    const [loading, setLoading] =
        useState(false);

    const [guardando, setGuardando] =
        useState(false);

    const [error, setError] =
        useState("");

    const [campos, setCampos] =
        useState([]);

    const [valoresCampos, setValoresCampos] =
        useState({});

    const [busqueda, setBusqueda] =
        useState("");

    const archivoPdf = useMemo(() => {
        if (!pdfBytes) return null;

        return {
            data: pdfBytes,
        };
    }, [pdfBytes]);

    const camposFiltrados = useMemo(() => {
        const q = String(busqueda)
            .trim()
            .toLowerCase();

        if (!q) return campos;

        return campos.filter((campo) =>
            `${campo.label} ${campo.nombre}`
                .toLowerCase()
                .includes(q)
        );
    }, [campos, busqueda]);

    /* ========================================================
     * BUSCAR CONTROL REAL DE PDF.JS
     * ======================================================== */

    const obtenerControlesPdf = (nombre) => {
        const contenedor =
            contenedorRef.current;

        if (!contenedor) return [];

        return Array.from(
            contenedor.querySelectorAll(
                ".annotationLayer input, .annotationLayer textarea, .annotationLayer select",
            ),
        ).filter(
            (elemento) =>
                elemento.name === nombre,
        );
    };

    /* ========================================================
     * APLICAR VALOR DEL MENÚ AL PDF VISUAL
     * ======================================================== */

    const aplicarValorEnPdf = (
        campo,
        valor,
    ) => {
        const controles =
            obtenerControlesPdf(
                campo.nombre,
            );

        if (!controles.length) return;

        if (campo.tipo === "text") {
            controles.forEach((control) => {
                control.value =
                    valor ?? "";

                control.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true,
                        },
                    ),
                );

                control.dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles: true,
                        },
                    ),
                );
            });

            return;
        }

        if (campo.tipo === "checkbox") {
            controles.forEach((control) => {
                control.checked =
                    !!valor;

                control.dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles: true,
                        },
                    ),
                );
            });

            return;
        }

        if (campo.tipo === "radio") {
            const seleccionado =
                controles.find(
                    (control) =>
                        String(
                            control.value,
                        ) ===
                        String(valor),
                );

            if (seleccionado) {
                seleccionado.click();
            }

            return;
        }

        if (campo.tipo === "dropdown") {
            controles.forEach((control) => {
                control.value =
                    valor || "";

                control.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true,
                        },
                    ),
                );

                control.dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles: true,
                        },
                    ),
                );
            });

            return;
        }

        if (campo.tipo === "optionlist") {
            controles.forEach((control) => {
                if (
                    !(control instanceof
                        HTMLSelectElement)
                ) {
                    return;
                }

                const seleccion =
                    Array.isArray(valor)
                        ? valor.map(String)
                        : [];

                Array.from(
                    control.options,
                ).forEach((option) => {
                    option.selected =
                        seleccion.includes(
                            String(
                                option.value,
                            ),
                        );
                });

                control.dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles: true,
                        },
                    ),
                );
            });
        }
    };

    /* ========================================================
     * CAMBIO DESDE EL MENÚ
     * ======================================================== */

    const cambiarCampoDesdeMenu = (
        campo,
        valor,
    ) => {
        setValoresCampos(
            (prev) => ({
                ...prev,
                [campo.nombre]: valor,
            }),
        );

        aplicarValorEnPdf(
            campo,
            valor,
        );
    };

    /* ========================================================
     * UBICAR CAMPO
     * ======================================================== */

    const ubicarCampoPdf = (campo) => {
        const controles =
            obtenerControlesPdf(
                campo.nombre,
            );

        const control =
            controles[0];

        if (!control) return;

        control.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });

        window.setTimeout(() => {
            control.focus?.();

            if (
                control instanceof
                HTMLInputElement &&
                control.type === "text"
            ) {
                control.select?.();
            }
        }, 350);
    };

    /* ========================================================
     * DETECTAR CAMBIOS HECHOS DIRECTAMENTE EN PDF
     * ======================================================== */

    useEffect(() => {
        if (!open) return;

        const contenedor =
            contenedorRef.current;

        if (!contenedor) return;

        const escucharCambio = (event) => {
            const elemento =
                event.target;

            if (
                !(
                    elemento instanceof
                    HTMLInputElement ||
                    elemento instanceof
                    HTMLTextAreaElement ||
                    elemento instanceof
                    HTMLSelectElement
                )
            ) {
                return;
            }

            if (
                !elemento.closest(
                    ".annotationLayer",
                )
            ) {
                return;
            }

            const nombre =
                elemento.name;

            if (!nombre) return;

            let valor;

            if (
                elemento instanceof
                HTMLInputElement &&
                elemento.type ===
                "checkbox"
            ) {
                valor =
                    elemento.checked;
            } else if (
                elemento instanceof
                HTMLInputElement &&
                elemento.type ===
                "radio"
            ) {
                if (!elemento.checked) {
                    return;
                }

                valor =
                    elemento.value;
            } else if (
                elemento instanceof
                HTMLSelectElement &&
                elemento.multiple
            ) {
                valor =
                    Array.from(
                        elemento.selectedOptions,
                    ).map(
                        (option) =>
                            option.value,
                    );
            } else {
                valor =
                    elemento.value;
            }

            setValoresCampos(
                (prev) => ({
                    ...prev,
                    [nombre]: valor,
                }),
            );
        };

        /*
         * Event delegation.
         *
         * Aunque PDF.js genere los inputs después,
         * estos listeners seguirán funcionando.
         */
        contenedor.addEventListener(
            "input",
            escucharCambio,
            true,
        );

        contenedor.addEventListener(
            "change",
            escucharCambio,
            true,
        );

        return () => {
            contenedor.removeEventListener(
                "input",
                escucharCambio,
                true,
            );

            contenedor.removeEventListener(
                "change",
                escucharCambio,
                true,
            );
        };
    }, [open]);

    /* ========================================================
     * MEDIR PDF
     * ======================================================== */

    useEffect(() => {
        if (!open) return;

        const elemento =
            contenedorRef.current;

        if (!elemento) return;

        const actualizar = () => {
            /*
             * Ahora tenemos menú lateral,
             * por lo que usamos solamente el ancho
             * disponible del contenedor PDF.
             */
            const disponible =
                elemento.clientWidth - 32;

            setAnchoPagina(
                Math.max(
                    320,
                    Math.min(
                        disponible,
                        1150,
                    ),
                ),
            );
        };

        actualizar();

        const observer =
            new ResizeObserver(
                actualizar,
            );

        observer.observe(
            elemento,
        );

        return () =>
            observer.disconnect();
    }, [open]);

    /* ========================================================
     * CARGAR PLANTILLA Y DETECTAR CAMPOS
     * ======================================================== */

    useEffect(() => {
        if (
            !open ||
            !formato?.url
        ) {
            return;
        }

        let activo = true;

        const cargar = async () => {
            setLoading(true);
            setError("");
            setPdfBytes(null);
            setNumPages(0);
            setCampos([]);
            setValoresCampos({});
            setBusqueda("");

            pdfProxyRef.current = null;
            pdfBaseRef.current = null;

            try {
                const originales =
                    await cargarPdfComoBytes(
                        formato.url,
                    );

                const preparados =
                    await aplicarCamposIniciales(
                        originales,
                        camposIniciales,
                    );

                pdfBaseRef.current = new Uint8Array(preparados);

                const camposDetectados =
                    await obtenerCamposPdf(
                        preparados,
                    );

                if (!activo) return;

                const valores = {};

                camposDetectados.forEach(
                    (campo) => {
                        valores[campo.nombre] =
                            campo.valor;
                    },
                );

                setCampos(
                    camposDetectados,
                );

                setValoresCampos(
                    valores,
                );

                setPdfBytes(
                    new Uint8Array(
                        preparados,
                    ),
                );
            } catch (err) {
                console.error(
                    "Error cargando editor PDF:",
                    err,
                );

                if (activo) {
                    setError(
                        err?.message ||
                        "No fue posible cargar el PDF.",
                    );

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

    /* ========================================================
     * DOCUMENTO PDF.JS LISTO
     * ======================================================== */

    const documentoCargado = (pdf) => {
        pdfProxyRef.current =
            pdf;

        setNumPages(
            pdf.numPages || 0,
        );

        setLoading(false);
    };

    const errorDocumento = (err) => {
        console.error(
            "Error cargando PDF.js:",
            err,
        );

        setError(
            err?.message ||
            "No fue posible renderizar el PDF.",
        );

        setLoading(false);
    };

    /* ========================================================
     * GUARDAR
     * ======================================================== */

    const guardar = async () => {
        if (guardando || !pdfBaseRef.current) return;

        setGuardando(true);
        setError("");

        try {
            /*
             * Si el usuario está escribiendo directamente
             * sobre el PDF, quitamos el focus para asegurar
             * que el último evento input/change llegue al estado.
             */
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            /*
             * Esperamos dos frames para permitir que React procese
             * el último setValoresCampos().
             */
            await new Promise((resolve) =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(resolve)
                )
            );

            /*
             * No usamos más:
             *
             * pdfProxyRef.current.saveDocument()
             *
             * Generamos el archivo directamente desde los valores
             * sincronizados que ya tenemos en React.
             */
            const bytesModificados = await generarPdfFinal(
                pdfBaseRef.current,
                valoresCampos
            );

            if (!bytesModificados?.length) {
                throw new Error(
                    "No fue posible generar el PDF modificado."
                );
            }

            /*
             * Extraemos nuevamente los campos desde el PDF FINAL.
             * Así el JSON enviado a Django y el archivo PDF contienen
             * exactamente la misma información.
             */
            const camposFinales = await extraerCamposPdf(
                bytesModificados
            );

            const folio = String(
                expediente?.folio ||
                expediente?.id_expediente ||
                "expediente"
            ).replace(/[^\w.-]+/g, "_");

            const nombreBase = formato.archivo.replace(
                /\.pdf$/i,
                ""
            );

            const archivo = new File(
                [bytesModificados],
                `${folio}-${nombreBase}.pdf`,
                {
                    type: "application/pdf",
                }
            );

            console.log("PDF generado:", {
                nombre: archivo.name,
                bytes: archivo.size,
                mb: (archivo.size / 1024 / 1024).toFixed(2),
            });

            console.log(
                "Campos que se enviarán:",
                camposFinales
            );

            await onGuardar({
                archivo,
                campos: camposFinales,
                plantilla: formato.value,
            });
        } catch (err) {
            console.error(
                "Error guardando formato PDF:",
                err
            );

            setError(
                err?.message ||
                "No fue posible guardar el PDF."
            );
        } finally {
            setGuardando(false);
        }
    };
    if (!open) return null;

    /* ========================================================
     * INTERFAZ
     * ======================================================== */

    return createPortal(
        <div className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-[2px]">
            <div className="flex h-full items-center justify-center p-2 sm:p-4">
                <div className="flex h-[96vh] w-full max-w-[1700px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

                    {/* HEADER */}
                    <div className="flex shrink-0 items-center justify-between bg-[#131E5C] px-5 py-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-base font-black text-white">
                                <FileText className="h-5 w-5" />
                                Editar formato de solicitud
                            </div>

                            <div className="mt-1 truncate text-[12px] text-white">
                                {expediente?.folio}
                                {" · "}
                                {expediente?.cliente}
                                {" · "}
                                {formato?.archivo}
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
                    <div className="grid min-h-0 flex-1 lg:grid-cols-[350px_minmax(0,1fr)]">

                        {/* ============================
                            MENÚ LATERAL
                        ============================ */}
                        <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50">

                            <div className="shrink-0 border-b border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-black text-[#131E5C]">
                                            Campos del formato
                                        </div>

                                        <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                            {campos.length} campos detectados
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-[#131E5C]">
                                    <Search className="h-4 w-4 shrink-0 text-slate-400" />

                                    <input
                                        value={busqueda}
                                        onChange={(event) =>
                                            setBusqueda(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Buscar campo..."
                                        className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#131E5C] outline-none"
                                    />

                                    {busqueda ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setBusqueda("")
                                            }
                                            className="text-slate-400"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                                {camposFiltrados.map(
                                    (campo) => (
                                        <CampoLateral
                                            key={campo.nombre}
                                            campo={campo}
                                            valor={
                                                valoresCampos[
                                                campo.nombre
                                                ]
                                            }
                                            onChange={
                                                cambiarCampoDesdeMenu
                                            }
                                            onUbicar={
                                                ubicarCampoPdf
                                            }
                                        />
                                    ),
                                )}

                                {!camposFiltrados.length ? (
                                    <div className="py-10 text-center text-xs font-semibold text-slate-400">
                                        No se encontraron campos.
                                    </div>
                                ) : null}
                            </div>
                        </aside>

                        {/* ============================
                            PDF
                        ============================ */}
                        <div
                            ref={contenedorRef}
                            className="editor-pdf relative min-h-0 overflow-auto bg-[#525659] p-4"
                        >
                            {loading ? (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80">
                                    <div className="text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#131E5C]" />

                                        <div className="mt-2 text-xs font-black text-[#131E5C]">
                                            Cargando formato...
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {archivoPdf ? (
                                <Document
                                    file={archivoPdf}
                                    onLoadSuccess={documentoCargado}
                                    onLoadError={errorDocumento}
                                    loading={null}
                                    error={null}
                                    className="mx-auto"
                                >
                                    {Array.from(
                                        {
                                            length:
                                                numPages,
                                        },
                                        (_, index) => (
                                            <div
                                                key={
                                                    index +
                                                    1
                                                }
                                                className="mb-4 flex justify-center last:mb-0"
                                            >
                                                <Page
                                                    pageNumber={
                                                        index +
                                                        1
                                                    }
                                                    width={
                                                        anchoPagina
                                                    }
                                                    renderAnnotationLayer
                                                    renderForms
                                                    renderTextLayer={
                                                        false
                                                    }
                                                    className="overflow-hidden bg-white shadow-xl"
                                                />
                                            </div>
                                        ),
                                    )}
                                </Document>
                            ) : null}
                        </div>
                    </div>

                    {/* ERROR */}
                    {error ? (
                        <div className="shrink-0 border-t border-red-200 bg-red-50 px-5 py-3 text-xs font-bold text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {/* FOOTER */}
                    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
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
                            disabled={
                                loading ||
                                guardando ||
                                !pdfBaseRef.current
                            }
                            onClick={guardar}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-5 text-xs font-black text-white hover:bg-[#1d2d86] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {guardando ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            {guardando
                                ? "Guardando..."
                                : "Guardar copia en expediente"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}