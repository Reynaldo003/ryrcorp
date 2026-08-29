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
import { FileText, Loader2, Save, X } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

/*
 * Worker de PDF.js.
 *
 * Importante colocarlo en el mismo archivo donde utilizamos
 * Document/Page para evitar problemas con Vite.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

/* ============================================================
 * TIPO DE CAMPO
 * ============================================================ */

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
 * APLICAR JSON EXISTENTE AL PDF
 *
 * Sirve cuando el expediente ya fue guardado anteriormente.
 *
 * El backend devuelve:
 *
 * solicitud_pdf_campos = {...}
 *
 * y reconstruimos visualmente el formulario antes de mostrarlo.
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
                    if (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor) !== ""
                    ) {
                        field.select(
                            String(valor),
                        );
                    } else if (
                        typeof field.clear === "function"
                    ) {
                        field.clear();
                    }
                    break;

                case "radio":
                    if (
                        valor !== null &&
                        valor !== undefined &&
                        String(valor) !== ""
                    ) {
                        field.select(
                            String(valor),
                        );
                    } else if (
                        typeof field.clear === "function"
                    ) {
                        field.clear();
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
                    } else if (
                        typeof field.clear === "function"
                    ) {
                        field.clear();
                    }

                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.warn(
                `No se pudo restaurar el campo "${nombre}":`,
                error,
            );
        }
    }

    /*
     * Regeneramos las apariencias sin hacer flatten(),
     * porque queremos conservar el formulario editable.
     */
    try {
        const font = await pdfDoc.embedFont(
            StandardFonts.Helvetica,
        );

        form.updateFieldAppearances(font);
    } catch (error) {
        console.warn(
            "No fue posible actualizar todas las apariencias:",
            error,
        );
    }

    return pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        objectsPerTick: 50,
    });
}

/* ============================================================
 * EXTRAER JSON DEL PDF YA MODIFICADO
 *
 * Esta función se ejecuta AL GUARDAR.
 *
 * PDF.js primero genera el PDF real modificado.
 * Después pdf-lib lee ese archivo final y construye el JSON.
 * ============================================================ */

async function extraerCamposPdf(
    bytesModificados,
) {
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
 * COMPONENTE
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

    /*
     * Este objeto es MUY importante.
     *
     * Es el PDFDocumentProxy de PDF.js y contiene:
     *
     * - annotationStorage
     * - saveDocument()
     * - páginas
     * - formulario modificado
     */
    const pdfProxyRef = useRef(null);

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

    /*
     * React-PDF recomienda mantener estable
     * el objeto file entre renders.
     */
    const archivoPdf = useMemo(() => {
        if (!pdfBytes) return null;

        return {
            data: pdfBytes,
        };
    }, [pdfBytes]);

    /* ========================================================
     * MEDIR CONTENEDOR
     * ======================================================== */

    useEffect(() => {
        if (!open) return;

        const elemento =
            contenedorRef.current;

        if (!elemento) return;

        const actualizar = () => {
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
            new ResizeObserver(actualizar);

        observer.observe(elemento);

        return () => {
            observer.disconnect();
        };
    }, [open]);

    /* ========================================================
     * CARGAR PLANTILLA
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

            pdfProxyRef.current = null;

            try {
                /*
                 * 1. Leemos la plantilla.
                 */
                const originales =
                    await cargarPdfComoBytes(
                        formato.url,
                    );

                /*
                 * 2. Si ya existían datos guardados,
                 *    los colocamos antes de renderizar.
                 */
                const preparados =
                    await aplicarCamposIniciales(
                        originales,
                        camposIniciales,
                    );

                if (!activo) return;

                /*
                 * Hacemos copia para evitar que el
                 * worker de PDF.js transfiera/detache
                 * el ArrayBuffer que tenemos en estado.
                 */
                setPdfBytes(
                    new Uint8Array(preparados),
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
        camposIniciales,
    ]);

    /* ========================================================
     * PDF.JS TERMINÓ DE CARGAR
     * ======================================================== */

    const documentoCargado = (pdf) => {
        pdfProxyRef.current = pdf;

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
        if (
            guardando ||
            !pdfProxyRef.current
        ) {
            return;
        }

        setGuardando(true);
        setError("");

        try {
            /*
             * Si el usuario sigue escribiendo en un input,
             * quitamos el focus antes de guardar.
             *
             * Esto garantiza que el último valor sea
             * registrado por la AnnotationLayer.
             */
            if (
                document.activeElement instanceof
                HTMLElement
            ) {
                document.activeElement.blur();
            }

            /*
             * Dejamos que React/PDF.js procese el
             * último evento change/input.
             */
            await new Promise((resolve) =>
                requestAnimationFrame(() =>
                    requestAnimationFrame(resolve),
                ),
            );

            /*
             * AQUÍ ESTÁ LA DIFERENCIA PRINCIPAL.
             *
             * saveDocument() toma los valores
             * almacenados por PDF.js en annotationStorage
             * y devuelve el PDF REAL YA MODIFICADO.
             */
            const bytesModificados =
                await pdfProxyRef.current
                    .saveDocument();

            if (!bytesModificados?.length) {
                throw new Error(
                    "PDF.js no pudo generar el documento modificado.",
                );
            }

            /*
             * Ahora leemos el PDF que acaba de generar
             * PDF.js y obtenemos sus campos.
             *
             * De esta manera el JSON y el PDF SIEMPRE
             * corresponden exactamente a los mismos datos.
             */
            const campos =
                await extraerCamposPdf(
                    bytesModificados,
                );

            const folio = String(
                expediente?.folio ||
                expediente?.id_expediente ||
                "expediente",
            ).replace(
                /[^\w.-]+/g,
                "_",
            );

            const nombreBase =
                formato.archivo.replace(
                    /\.pdf$/i,
                    "",
                );

            const archivo = new File(
                [bytesModificados],
                `${folio}-${nombreBase}.pdf`,
                {
                    type: "application/pdf",
                },
            );

            console.log(
                "PDF modificado:",
                archivo,
            );

            console.log(
                "Campos extraídos:",
                campos,
            );

            /*
             * Tu función Documentacion.guardarFormatoPdf()
             * continúa funcionando exactamente igual.
             */
            await onGuardar({
                archivo,
                campos,
                plantilla:
                    formato.value,
            });
        } catch (err) {
            console.error(
                "Error guardando formato PDF:",
                err,
            );

            setError(
                err?.message ||
                "No fue posible guardar el PDF.",
            );
        } finally {
            setGuardando(false);
        }
    };

    if (!open) return null;

    /* ========================================================
     * UI
     * ======================================================== */

    return createPortal(
        <div className="fixed inset-0 z-[400] bg-black/65 backdrop-blur-[2px]">
            <div className="flex h-full items-center justify-center p-2 sm:p-4">
                <div className="flex h-[96vh] w-full max-w-[1300px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

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

                    {/* PDF */}
                    <div
                        ref={contenedorRef}
                        className="relative min-h-0 flex-1 overflow-auto bg-[#525659] p-4"
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

                                                /*
                                                 * CLAVE:
                                                 *
                                                 * React-PDF genera la
                                                 * AnnotationLayer con inputs,
                                                 * checkbox, radios, selects...
                                                 */
                                                renderAnnotationLayer
                                                renderForms

                                                /*
                                                 * No necesitamos seleccionar
                                                 * texto para este formulario.
                                                 */
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
                            disabled={
                                guardando
                            }
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
                                !pdfProxyRef.current
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