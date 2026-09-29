import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addCollection, Icon } from "@iconify/react";
import { FILE_ICONS, VSCODE_ICONS } from "./icons/reportIcons";
import "./ExportReportModal.css";

// Colecciones embebidas: los iconos no dependen de la API de Iconify.
addCollection(FILE_ICONS);
addCollection(VSCODE_ICONS);

const ExcelIcon = () => (
    <Icon icon="file-icons:microsoft-excel" width={38} height={38} className="erm-icon erm-icon-excel" />
);

const PdfIcon = () => (
    <Icon icon="vscode-icons:file-type-pdf2" width={38} height={38} className="erm-icon erm-icon-pdf" />
);

/**
 * Normaliza el resumen de filtros a [{ label, value }].
 * Acepta el array ya formateado o un objeto plano { clave: valor }.
 */
function normalizarResumen(filters) {
    if (!filters)
        return [];

    if (Array.isArray(filters))
        return filters.filter((f) => f && (f.label || f.value));

    return Object.entries(filters)
        .filter(([, value]) => value !== "" && value !== null && value !== undefined && value !== "Todos")
        .map(([label, value]) => ({ label, value: String(value) }));
}

export default function ExportReportModal({
    isOpen,
    onClose,

    // Nombre que aparecerá en el título
    moduleName = "Reporte",

    // Objeto de filtros aplicados en el módulo (lo que se devuelve en el payload)
    currentFilters = {},

    // Resumen legible de filtros: [{ label, value }] o { clave: valor }
    filterSummary,

    // Columnas visibles actualmente: [{ key, label }]
    currentColumns = [],

    // Todas las columnas disponibles: [{ key, label }]
    availableColumns = [],

    // Número de registros filtrados
    totalRecords = 0,

    // Acciones
    onModifyFilters,
    onModifyColumns,
    onGenerate,
}) {
    const [format, setFormat] = useState("excel");
    const [useCurrentFilters, setUseCurrentFilters] = useState(true);
    const [useCurrentColumns, setUseCurrentColumns] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [wasOpen, setWasOpen] = useState(isOpen);
    const dialogRef = useRef(null);
    const loadingRef = useRef(false);
    const filtersId = useId();
    const columnsId = useId();

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    // Reinicia el formulario cada vez que se abre (patrón de React para
    // ajustar estado ante cambios de props, en vez de un efecto).
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);

        if (isOpen) {
            setFormat("excel");
            setUseCurrentFilters(true);
            setUseCurrentColumns(true);
            setLoading(false);
            setError("");
        }
    }

    // Cierra con ESC y bloquea el scroll del body mientras está abierto.
    useEffect(() => {
        if (!isOpen)
            return;

        function onKeyDown(e) {
            if (e.key === "Escape" && !loadingRef.current)
                onClose?.();
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        dialogRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen)
        return null;

    const resumen = normalizarResumen(filterSummary ?? currentFilters);
    const columnas = Array.isArray(currentColumns) ? currentColumns : [];
    const todasLasColumnas = Array.isArray(availableColumns) ? availableColumns : [];

    async function handleGenerate() {
        setError("");

        try {
            setLoading(true);

            await onGenerate?.({
                format,
                // Si el checkbox está apagado no se manda restricción alguna:
                // el backend exporta todo el dataset del módulo.
                filters: useCurrentFilters ? currentFilters : {},
                columns: useCurrentColumns ? columnas.map((c) => c.key ?? c) : [],
                useCurrentFilters,
                useCurrentColumns,
            });
        } catch (err) {
            console.error("Error generando reporte:", err);
            setError(err?.message || "No se pudo generar el reporte. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return createPortal(<div className="erm-overlay" onMouseDown={() => { if (!loading) onClose?.(); }}>
        <div
            ref={dialogRef}
            className="erm-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Exportar reporte - ${moduleName}`}
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
        >
            {/* HEADER */}
            <div className="erm-header">
                <h2>Exportar reporte - {moduleName}</h2>

                <button
                    type="button"
                    className="erm-close"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Cerrar"
                >
                    ×
                </button>
            </div>

            <div className="erm-content">
                {/* 1. FORMATO */}
                <section className="erm-section">
                    <h3>
                        <span>1.</span> Formato del archivo
                    </h3>

                    <div className="erm-format-grid">
                        <button
                            type="button"
                            className={`erm-format-card ${format === "excel" ? "selected" : ""
                                }`}
                            aria-pressed={format === "excel"}
                            onClick={() => setFormat("excel")}
                        >
                            <span
                                className={`erm-radio ${format === "excel" ? "checked" : ""
                                    }`}
                            />

                            <ExcelIcon />

                            <div className="erm-format-text">
                                <strong>Excel</strong>
                                <small>(.xlsx)</small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`erm-format-card ${format === "pdf" ? "selected" : ""
                                }`}
                            aria-pressed={format === "pdf"}
                            onClick={() => setFormat("pdf")}
                        >
                            <span
                                className={`erm-radio ${format === "pdf" ? "checked" : ""
                                    }`}
                            />

                            <PdfIcon />

                            <div className="erm-format-text">
                                <strong>PDF</strong>
                                <small>(.pdf)</small>
                            </div>
                        </button>
                    </div>
                </section>

                {/* 2. FILTROS */}
                <section className="erm-section">
                    <h3>
                        <span>2.</span> Filtros a aplicar
                    </h3>

                    <label className="erm-checkbox-row" htmlFor={filtersId}>
                        <input
                            id={filtersId}
                            type="checkbox"
                            checked={useCurrentFilters}
                            onChange={(e) => setUseCurrentFilters(e.target.checked)}
                        />

                        <span>Usar filtros actuales de la tabla</span>
                    </label>

                    <div
                        className={`erm-summary-card ${!useCurrentFilters ? "disabled" : ""
                            }`}
                    >
                        <div className="erm-summary-data">
                            {resumen.length > 0 ? (
                                resumen.map((filter, index) => (
                                    <div className="erm-summary-line" key={`${filter.label}-${index}`}>
                                        <span>{filter.label}:</span>
                                        <strong>{filter.value}</strong>
                                    </div>
                                ))
                            ) : (
                                <div className="erm-empty">
                                    No hay filtros aplicados actualmente.
                                </div>
                            )}
                        </div>

                        {onModifyFilters && (
                            <button
                                type="button"
                                className="erm-secondary-button"
                                onClick={onModifyFilters}
                                disabled={loading}
                            >
                                <span className="erm-filter-symbol">▽</span>
                                Modificar filtros
                            </button>
                        )}
                    </div>
                </section>

                {/* 3. COLUMNAS */}
                <section className="erm-section">
                    <h3>
                        <span>3.</span> Columnas del reporte
                    </h3>

                    <label className="erm-checkbox-row" htmlFor={columnsId}>
                        <input
                            id={columnsId}
                            type="checkbox"
                            checked={useCurrentColumns}
                            onChange={(e) => setUseCurrentColumns(e.target.checked)}
                        />

                        <span>Usar columnas actuales de la tabla</span>
                    </label>

                    <div
                        className={`erm-columns-card ${!useCurrentColumns ? "disabled" : ""
                            }`}
                    >
                        <div className="erm-columns-top">
                            <strong>
                                {columnas.length} columna
                                {columnas.length !== 1 ? "s" : ""} seleccionada
                                {columnas.length !== 1 ? "s" : ""}
                                {totalColumnasAviso(todasLasColumnas.length)}
                            </strong>

                            {onModifyColumns && (
                                <button
                                    type="button"
                                    className="erm-secondary-button"
                                    onClick={onModifyColumns}
                                    disabled={loading}
                                >
                                    ⚙ Modificar columnas
                                </button>
                            )}
                        </div>

                        <div className="erm-column-chips">
                            {columnas.length > 0 ? columnas.map((column, index) => (
                                <span className="erm-chip" key={column.key ?? index}>
                                    {column.label ?? column}
                                </span>
                            )) : (
                                <div className="erm-empty">
                                    No hay columnas seleccionadas.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* RESUMEN */}
                {totalRecords > 0 && (
                    <div className="erm-records-info">
                        Se exportarán aproximadamente{" "}
                        <strong>{totalRecords.toLocaleString("es-MX")}</strong>{" "}
                        registros.
                    </div>
                )}

                {error && (
                    <div className="erm-error" role="alert">
                        {error}
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="erm-footer">
                <button
                    type="button"
                    className="erm-cancel-button"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    className="erm-generate-button"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? "Generando..." : "Generar reporte"}
                </button>
            </div>
        </div>
    </div>, document.body);
}

function totalColumnasAviso(total) {
    return total > 0 ? ` de ${total}` : "";
}
