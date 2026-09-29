import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    BarChart3,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
    Check,
    ChevronRight,
    Filter,
    LayoutDashboard,
    RefreshCcw,
    RotateCcw,
    Search,
    Settings2,
    Table2,
    X,
} from "lucide-react";

import { Icon, addCollection } from "@iconify/react";
import { FILE_ICONS, VSCODE_ICONS } from "./icons/reportIcons";

addCollection(FILE_ICONS);
addCollection(VSCODE_ICONS);

const DEFAULT_SECTIONS = [
    { key: "summary", label: "Resumen ejecutivo", description: "KPIs, totales y contexto del reporte.", defaultSelected: true },
    { key: "table", label: "Tabla de datos", description: "Detalle tabular con las columnas elegidas.", defaultSelected: true },
    { key: "charts", label: "Gráficas", description: "Visualizaciones configuradas por el módulo.", defaultSelected: true },
];

function cls(...values) {
    return values.filter(Boolean).join(" ");
}

function slug(value) {
    return String(value || "reporte")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeOption(option) {
    if (typeof option === "string" || typeof option === "number") {
        return { value: String(option), label: String(option) };
    }
    return {
        value: String(option?.value ?? ""),
        label: String(option?.label ?? option?.value ?? ""),
        disabled: Boolean(option?.disabled),
    };
}

function optionList(field, filters) {
    const source = typeof field?.options === "function" ? field.options(filters) : field?.options;
    return (Array.isArray(source) ? source : []).map(normalizeOption);
}

function normalizeItems(items = [], fallback = []) {
    const source = Array.isArray(items) && items.length ? items : fallback;
    return source.map((item) => {
        if (typeof item === "string") {
            return { key: item, label: item, defaultSelected: true };
        }
        return {
            ...item,
            key: item.key,
            label: item.label ?? item.key,
            defaultSelected: item.defaultSelected !== false,
        };
    });
}

function columnKeys(columns = []) {
    return columns.map((column) => String(column?.key ?? column)).filter(Boolean);
}

function safeReadStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function safeWriteStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // localStorage puede estar deshabilitado por el navegador.
    }
}

function buildDefaultConfig({
    moduleName,
    formats,
    currentFilters,
    currentColumns,
    availableColumns,
    sectionOptions,
    chartOptions,
}) {
    const sections = normalizeItems(sectionOptions, DEFAULT_SECTIONS);
    const charts = normalizeItems(chartOptions);
    const current = columnKeys(currentColumns);
    const all = columnKeys(availableColumns);

    return {
        version: 2,
        format: formats[0] || "excel",
        title: `Reporte - ${moduleName}`,
        fileName: "",
        orientation: "landscape",
        filters: { ...(currentFilters || {}) },
        columns: current.length ? current : all,
        sections: sections.filter((item) => item.defaultSelected).map((item) => item.key),
        charts: charts.filter((item) => item.defaultSelected).map((item) => item.key),
        includeGeneratedAt: true,
        includeFilterSummary: true,
    };
}

function mergeCachedConfig(defaults, cached, formats, availableColumns, sectionOptions, chartOptions) {
    if (!cached || typeof cached !== "object") return defaults;

    const validFormats = new Set(formats);
    const validColumns = new Set(columnKeys(availableColumns));
    const validSections = new Set(normalizeItems(sectionOptions, DEFAULT_SECTIONS).map((item) => item.key));
    const validCharts = new Set(normalizeItems(chartOptions).map((item) => item.key));

    const cachedColumns = Array.isArray(cached.columns)
        ? cached.columns.filter((key) => validColumns.has(key))
        : [];

    return {
        ...defaults,
        ...cached,
        format: validFormats.has(cached.format) ? cached.format : defaults.format,
        filters: { ...defaults.filters, ...(cached.filters || {}) },
        columns: cachedColumns.length ? cachedColumns : defaults.columns,
        sections: Array.isArray(cached.sections)
            ? cached.sections.filter((key) => validSections.has(key))
            : defaults.sections,
        charts: Array.isArray(cached.charts)
            ? cached.charts.filter((key) => validCharts.has(key))
            : defaults.charts,
    };
}

function ToggleCard({ checked, title, description, icon: Icon, onClick, disabled = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cls(
                "flex min-h-[86px] w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                checked
                    ? "border-[#131E5C] bg-[#131E5C]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-[#131E5C]/30 hover:bg-slate-50",
                disabled && "cursor-not-allowed opacity-40",
            )}
        >
            <span className={cls(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                checked ? "bg-[#131E5C] text-white" : "bg-slate-100 text-slate-500",
            )}>
                {Icon ? <Icon className="h-4 w-4" /> : checked ? <Check className="h-4 w-4" /> : null}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-slate-800">{title}</strong>
                    <span className={cls(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        checked ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white",
                    )}>
                        {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                </span>
                {description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span> : null}
            </span>
        </button>
    );
}

function FilterField({ field, value, filters, onChange }) {
    if (typeof field.visibleWhen === "function" && !field.visibleWhen(filters)) return null;

    const type = field.type || "select";
    const base = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10";

    return (
        <label className={cls("block", field.className)}>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{field.label}</span>

            {type === "select" ? (
                <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={base}>
                    {optionList(field, filters).map((option) => (
                        <option key={`${field.key}-${option.value}`} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value ?? ""}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder || ""}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={base}
                />
            )}

            {field.help ? <span className="mt-1 block text-[11px] text-slate-400">{field.help}</span> : null}
        </label>
    );
}

export default function ExportReportModal({
    isOpen,
    onClose,
    moduleName = "Reporte",
    storageKey,
    currentFilters = {},
    filterDefinitions = [],
    currentColumns = [],
    availableColumns = [],
    totalRecords = 0,
    formats = ["excel", "pdf"],
    sectionOptions = DEFAULT_SECTIONS,
    chartOptions = [],
    onGenerate,
}) {
    const dialogRef = useRef(null);
    const loadingRef = useRef(false);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingFormat, setGeneratingFormat] = useState("");
    const [error, setError] = useState("");
    const [columnSearch, setColumnSearch] = useState("");
    const [activeStep, setActiveStep] = useState("filters");

    const cacheKey = useMemo(
        () => `crm.report.config.v2.${slug(storageKey || moduleName)}`,
        [storageKey, moduleName],
    );

    const normalizedSections = useMemo(() => normalizeItems(sectionOptions, DEFAULT_SECTIONS), [sectionOptions]);
    const normalizedCharts = useMemo(() => normalizeItems(chartOptions), [chartOptions]);
    const validFormats = useMemo(() => (formats.length ? formats : ["excel"]), [formats]);

    const defaults = useMemo(() => buildDefaultConfig({
        moduleName,
        formats: validFormats,
        currentFilters,
        currentColumns,
        availableColumns,
        sectionOptions: normalizedSections,
        chartOptions: normalizedCharts,
    }), [moduleName, validFormats, currentFilters, currentColumns, availableColumns, normalizedSections, normalizedCharts]);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    useEffect(() => {
        if (!isOpen) return;

        const cached = safeReadStorage(cacheKey);
        setConfig(mergeCachedConfig(
            defaults,
            cached,
            validFormats,
            availableColumns,
            normalizedSections,
            normalizedCharts,
        ));
        setError("");
        setColumnSearch("");
        setActiveStep("filters");
    }, [isOpen, cacheKey]);

    useEffect(() => {
        if (!isOpen || !config) return;
        safeWriteStorage(cacheKey, config);
    }, [isOpen, cacheKey, config]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKeyDown = (event) => {
            if (event.key === "Escape" && !loadingRef.current) onClose?.();
        };

        document.addEventListener("keydown", onKeyDown);
        requestAnimationFrame(() => dialogRef.current?.focus());

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    const filteredColumns = useMemo(() => {
        const q = columnSearch.trim().toLowerCase();
        if (!q) return availableColumns;
        return availableColumns.filter((column) =>
            `${column.label ?? column.key} ${column.key}`.toLowerCase().includes(q),
        );
    }, [availableColumns, columnSearch]);

    if (!isOpen || !config) return null;

    const selectedColumns = new Set(config.columns || []);
    const selectedSections = new Set(config.sections || []);
    const selectedCharts = new Set(config.charts || []);

    function patchConfig(patch) {
        setConfig((current) => ({ ...current, ...patch }));
    }

    function patchFilter(key, value) {
        setConfig((current) => ({
            ...current,
            filters: { ...current.filters, [key]: value },
        }));
    }

    function toggleArray(key, value) {
        setConfig((current) => {
            const next = new Set(current[key] || []);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return { ...current, [key]: Array.from(next) };
        });
    }

    function useViewFilters() {
        patchConfig({ filters: { ...currentFilters } });
        setError("");
    }

    function useViewColumns() {
        const keys = columnKeys(currentColumns);
        patchConfig({ columns: keys.length ? keys : columnKeys(availableColumns) });
        setError("");
    }

    function selectAllColumns() {
        patchConfig({ columns: columnKeys(availableColumns) });
    }

    function clearColumns() {
        patchConfig({ columns: [] });
    }

    function applyPreset(type) {
        if (type === "executive") {
            patchConfig({
                sections: normalizedSections.filter((item) => ["summary", "charts"].includes(item.key)).map((item) => item.key),
                charts: normalizedCharts.map((item) => item.key),
            });
            return;
        }

        if (type === "data") {
            patchConfig({
                sections: normalizedSections.filter((item) => item.key === "table").map((item) => item.key),
                charts: [],
            });
            return;
        }

        patchConfig({
            sections: normalizedSections.map((item) => item.key),
            charts: normalizedCharts.map((item) => item.key),
            columns: columnKeys(availableColumns),
        });
    }

    function resetConfig() {
        setConfig(defaults);
        setError("");
    }

    async function handleGenerate(formatOverride = config.format) {
        setError("");

        if (!config.sections.length) {
            setError("Selecciona al menos una sección para el reporte.");
            return;
        }

        if (config.sections.includes("table") && !config.columns.length) {
            setError("La sección de tabla necesita al menos una columna.");
            setActiveStep("columns");
            return;
        }

        if (config.sections.includes("charts") && normalizedCharts.length > 0 && !config.charts.length) {
            setError("Selecciona al menos una gráfica o desactiva la sección de gráficas.");
            setActiveStep("content");
            return;
        }

        const format = validFormats.includes(formatOverride) ? formatOverride : validFormats[0];
        const configGeneracion = { ...config, format };

        try {
            setConfig(configGeneracion);
            setGeneratingFormat(format);
            setLoading(true);
            await onGenerate?.({
                ...configGeneracion,
                moduleName,
                storageKey: cacheKey,
                filters: { ...configGeneracion.filters },
                columns: [...configGeneracion.columns],
                sections: [...configGeneracion.sections],
                charts: [...configGeneracion.charts],
            });
        } catch (err) {
            console.error("Error generando reporte:", err);
            setError(err?.message || "No se pudo generar el reporte.");
        } finally {
            setLoading(false);
            setGeneratingFormat("");
        }
    }

    const steps = [
        { key: "filters", label: "Filtros", Icon: Filter },
        { key: "columns", label: "Columnas", Icon: Table2 },
        { key: "content", label: "Contenido", Icon: LayoutDashboard },
        { key: "output", label: "Salida", Icon: Settings2 },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/55 p-2 backdrop-blur-[2px] sm:p-4" onMouseDown={() => !loading && onClose?.()}>
            <div className="flex h-full items-end justify-center sm:items-center">
                <div
                    ref={dialogRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Configurar reporte - ${moduleName}`}
                    onMouseDown={(event) => event.stopPropagation()}
                    className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-50 shadow-2xl outline-none"
                >
                    <header className="shrink-0 bg-[#131E5C] px-5 py-4 text-white sm:px-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                                    <Settings2 className="h-4 w-4" /> Configurador de reportes
                                </div>
                                <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{moduleName}</h2>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
                                aria-label="Cerrar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </header>

                    <div className="grid min-h-0 flex-1 lg:grid-cols-[230px_minmax(0,1fr)]">
                        <aside className="border-b border-slate-200 bg-white p-3 lg:border-b-0 lg:border-r lg:p-4">
                            <div className="grid grid-cols-4 gap-1 lg:grid-cols-1 lg:gap-2">
                                {steps.map(({ key, label, Icon }, index) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveStep(key)}
                                        className={cls(
                                            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition lg:justify-start lg:text-sm",
                                            activeStep === key ? "bg-[#131E5C] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
                                        )}
                                    >
                                        <span className={cls(
                                            "hidden h-6 w-6 items-center justify-center rounded-md text-[10px] lg:flex",
                                            activeStep === key ? "bg-white/15" : "bg-slate-100 text-slate-500",
                                        )}>{index + 1}</span>
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{label}</span>
                                        <ChevronRight className="ml-auto hidden h-4 w-4 lg:block" />
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
                            {activeStep === "filters" && (
                                <section>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-black text-slate-800">Filtros del reporte</h3>
                                        </div>
                                        <button type="button" onClick={useViewFilters} className="inline-flex items-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-3 py-2 text-xs font-bold text-[#131E5C] hover:bg-[#131E5C]/5">
                                            <RefreshCcw className="h-4 w-4" /> Usar filtros de la vista
                                        </button>
                                    </div>

                                    {filterDefinitions.length ? (
                                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                            {filterDefinitions.map((field) => (
                                                <FilterField
                                                    key={field.key}
                                                    field={field}
                                                    value={config.filters?.[field.key]}
                                                    filters={config.filters}
                                                    onChange={(value) => patchFilter(field.key, value)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                                            Este módulo no definió filtros editables para el reporte.
                                        </div>
                                    )}
                                </section>
                            )}

                            {activeStep === "columns" && (
                                <section>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-black text-slate-800">Columnas del detalle</h3>
                                            <p className="mt-1 text-sm text-slate-500">Seleccionadas: <strong className="text-[#131E5C]">{config.columns.length}</strong> de {availableColumns.length}.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={useViewColumns} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Usar vista actual</button>
                                            <button type="button" onClick={selectAllColumns} className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#0d1647]">Todas</button>
                                            <button type="button" onClick={clearColumns} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Ninguna</button>
                                        </div>
                                    </div>

                                    <div className="relative mt-4">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input value={columnSearch} onChange={(event) => setColumnSearch(event.target.value)} placeholder="Buscar columna..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10" />
                                    </div>

                                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {filteredColumns.map((column) => {
                                            const key = String(column.key ?? column);
                                            const checked = selectedColumns.has(key);
                                            return (
                                                <button
                                                    type="button"
                                                    key={key}
                                                    onClick={() => toggleArray("columns", key)}
                                                    className={cls(
                                                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                                                        checked ? "border-[#131E5C]/30 bg-[#131E5C]/5 text-[#131E5C]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                                                    )}
                                                >
                                                    <span className={cls("flex h-5 w-5 shrink-0 items-center justify-center rounded border", checked ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300")}>{checked && <Check className="h-3.5 w-3.5" />}</span>
                                                    <span className="truncate font-semibold" title={column.label ?? key}>{column.label ?? key}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {activeStep === "content" && (
                                <section className="space-y-6">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800">Secciones del reporte</h3>
                                        <p className="mt-1 text-sm text-slate-500">El módulo decide cómo se renderiza cada sección; aquí eliges cuáles incluir.</p>
                                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                                            {normalizedSections.map((item) => {
                                                const Icon = item.key === "summary" ? LayoutDashboard : item.key === "table" ? Table2 : BarChart3;
                                                return (
                                                    <ToggleCard
                                                        key={item.key}
                                                        checked={selectedSections.has(item.key)}
                                                        title={item.label}
                                                        description={item.description}
                                                        icon={Icon}
                                                        disabled={item.key === "charts" && normalizedCharts.length === 0}
                                                        onClick={() => toggleArray("sections", item.key)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {normalizedCharts.length > 0 && (
                                        <div>
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800">Constructor de gráficas</h3>
                                                    <p className="mt-1 text-sm text-slate-500">Elige exactamente qué análisis visual incluir. La selección se guarda para este módulo.</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => patchConfig({ charts: normalizedCharts.filter((item) => item.recommended !== false && item.defaultSelected !== false).map((item) => item.key) })} className="rounded-lg border border-[#131E5C]/20 bg-white px-3 py-2 text-xs font-bold text-[#131E5C] hover:bg-[#131E5C]/5">Recomendadas</button>
                                                    <button type="button" onClick={() => patchConfig({ charts: normalizedCharts.map((item) => item.key) })} className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#0d1647]">Todas</button>
                                                    <button type="button" onClick={() => patchConfig({ charts: [] })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Ninguna</button>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                {normalizedCharts.map((item) => {
                                                    const type = String(item.type || "bar").toLowerCase();
                                                    const ChartIcon = type === "pie" || type === "donut" ? PieChartIcon : type === "line" || type === "area" ? LineChartIcon : BarChart3;
                                                    const checked = selectedCharts.has(item.key);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={item.key}
                                                            disabled={!selectedSections.has("charts")}
                                                            onClick={() => toggleArray("charts", item.key)}
                                                            className={cls(
                                                                "group min-h-[128px] rounded-xl border p-4 text-left transition",
                                                                checked ? "border-[#131E5C] bg-[#131E5C]/5 shadow-sm" : "border-slate-200 bg-white hover:border-[#131E5C]/30 hover:bg-slate-50",
                                                                !selectedSections.has("charts") && "cursor-not-allowed opacity-40",
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className={cls("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", checked ? "bg-[#131E5C] text-white" : "bg-slate-100 text-slate-500")}><ChartIcon className="h-5 w-5" /></span>
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="flex items-start justify-between gap-2">
                                                                        <strong className="text-sm text-slate-800">{item.label}</strong>
                                                                        <span className={cls("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300 bg-white")}>{checked && <Check className="h-3.5 w-3.5" />}</span>
                                                                    </span>
                                                                    <span className="mt-1.5 block text-xs leading-5 text-slate-500">{item.description}</span>
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">{type}</span>
                                                                {item.category ? <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-[#131E5C]">{item.category}</span> : null}
                                                                {item.metric ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{item.metric}</span> : null}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {activeStep === "output" && (
                                <section className="space-y-6">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800">Formato y presentación</h3>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            {validFormats.map((format) => {
                                                const excel = format === "excel";
                                                const selected = config.format === format;
                                                return (
                                                    <button
                                                        key={format}
                                                        type="button"
                                                        onClick={() => patchConfig({ format })}
                                                        className={cls("flex items-center gap-3 rounded-xl border p-4 text-left transition",
                                                            selected ? "border-[#131E5C] bg-[#131E5C]/5" : "border-slate-200 bg-white hover:border-[#131E5C]/30",)}                                                    >
                                                        <span className={cls("flex h-11 w-11 items-center justify-center rounded-xl", excel ? "bg-emerald-100" : "bg-red-100",)}>
                                                            <Icon icon={excel ? "file-icons:microsoft-excel" : "vscode-icons:file-type-pdf2"} className={cls(excel ? "h-6 w-6 text-[#217346]" : "h-7 w-7",)} />
                                                        </span>

                                                        <span>
                                                            <strong className="block text-sm text-slate-800">
                                                                {excel ? "Excel" : "PDF"}
                                                            </strong>

                                                            <span className="text-xs text-slate-500">
                                                                {excel ? ".xlsx editable" : "Documento listo para compartir"}
                                                            </span>
                                                        </span>

                                                        <span className={cls("ml-auto flex h-5 w-5 items-center justify-center rounded-full border", selected ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-300",)}>
                                                            {selected && <Check className="h-3.5 w-3.5" />}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label>
                                            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Título del reporte</span>
                                            <input value={config.title} onChange={(event) => patchConfig({ title: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10" />
                                        </label>
                                        <label>
                                            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Nombre de archivo opcional</span>
                                            <input value={config.fileName} onChange={(event) => patchConfig({ fileName: event.target.value })} placeholder="Se genera automáticamente si lo dejas vacío" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10" />
                                        </label>
                                    </div>

                                    {config.format === "pdf" && (
                                        <div>
                                            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Orientación PDF</span>
                                            <div className="flex gap-2">
                                                {[{ value: "landscape", label: "Horizontal" }, { value: "portrait", label: "Vertical" }].map((item) => (
                                                    <button key={item.value} type="button" onClick={() => patchConfig({ orientation: item.value })} className={cls("rounded-lg border px-4 py-2 text-sm font-bold", config.orientation === item.value ? "border-[#131E5C] bg-[#131E5C] text-white" : "border-slate-200 bg-white text-slate-600")}>{item.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                                            <span><strong className="text-[#131E5C]">{config.columns.length}</strong> columnas</span>
                                            <span><strong className="text-[#131E5C]">{config.sections.length}</strong> secciones</span>
                                            {normalizedCharts.length > 0 ? <span><strong className="text-[#131E5C]">{config.charts.length}</strong> gráficas</span> : null}
                                            <span><strong className="text-[#131E5C]">{Number(totalRecords || 0).toLocaleString("es-MX")}</strong> registros en la vista actual</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
                        </main>
                    </div>

                    <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <button type="button" onClick={resetConfig} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <RotateCcw className="h-4 w-4" /> Restablecer configurador
                        </button>

                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cerrar</button>

                            {validFormats.includes("excel") && (
                                <button type="button" onClick={() => handleGenerate("excel")} disabled={loading} className="inline-flex min-w-[155px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                                    {loading && generatingFormat === "excel" ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Icon icon="file-icons:microsoft-excel" className="h-5 w-5 text-[#217346]" />}
                                    {loading && generatingFormat === "excel" ? "Generando Excel..." : "Generar Excel"}
                                </button>
                            )}

                            {validFormats.includes("pdf") && (
                                <button type="button" onClick={() => handleGenerate("pdf")} disabled={loading} className="inline-flex min-w-[155px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">
                                    {loading && generatingFormat === "pdf" ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Icon icon="vscode-icons:file-type-pdf2" className="h-5 w-5" />}
                                    {loading && generatingFormat === "pdf" ? "Generando PDF..." : "Generar PDF"}
                                </button>
                            )}
                        </div>
                    </footer>
                </div>
            </div>
        </div>,
        document.body,
    );
}
