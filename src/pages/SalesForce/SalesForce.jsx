//src/pages/SalesForce/SalesForce.jsx
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { apiSalesforce } from "../../lib/apiSalesforce";
import {
    AlertCircle,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    Database,
    Eye,
    FileSpreadsheet,
    Filter,
    Loader2,
    Pencil,
    Play,
    RefreshCw,
    Save,
    Table2,
    Trash2,
    UploadCloud,
    X,
    XCircle,
} from "lucide-react";

const MAX_FILE_SIZE = 60 * 1024 * 1024;
const VALID_EXTENSIONS = ["xlsx", "xls", "csv"];
const LABELS_KEY = "salesforce:labels";
const FALLBACK_TABLES = [
    { id: "prospectos", name: "Prospectos", records: 0 },
    { id: "procesos", name: "Procesos comerciales", records: 0 },
    { id: "procesos-detalle", name: "Detalles de procesos (Py)", records: 0 },
    { id: "actividades-prospectos", name: "Actividades de prospectos", records: 0 },
    { id: "actividades-procesos", name: "Actividades de procesos", records: 0 },
    { id: "facturas", name: "Facturadas", records: 0 },
    { id: "entregas", name: "Entregados al 100%", records: 0 },
];

function nombreVisual(tabla) {
    try {
        const etiquetas = JSON.parse(localStorage.getItem(LABELS_KEY) || "{}");
        return etiquetas[tabla.id] || tabla.name;
    } catch {
        return tabla.name;
    }
}

function fechaLegible(fecha) {
    if (!fecha) return "Sin actualizaciones";
    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium", timeStyle: "short"
    }).format(new Date(fecha));
}

function mostrarError(error) {
    if (typeof error?.message === "string") return error.message;
    return "Ocurrió un error al comunicarse con el servidor.";
}

function normalizarHistorial(item) {
    return {
        id: item.id,
        date: fechaLegible(item.iniciado_en),
        tableId: item.tabla,
        file: item.nombre_archivo,
        records: item.registros_leidos,
        created: item.registros_creados,
        updated: item.registros_actualizados,
        unchanged: item.registros_sin_cambios,
        errors: item.registros_error,
        details: item.detalle_errores || [],
        status: item.estado === "completada" ? "Actualización exitosa" : item.estado === "error" ? "Con errores" : "En proceso",
    };
}

function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ icon, label, value, tone }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
    };
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{createElement(icon, { size: 18 })}</div>
            <p className="text-2xl font-bold text-[#131E5C]">{value.toLocaleString("es-MX")}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
        </div>
    );
}

export default function SalesForce() {
    const [tables, setTables] = useState(FALLBACK_TABLES);
    const [selectedId, setSelectedId] = useState("prospectos");
    const [editingId, setEditingId] = useState(null);
    const [draftName, setDraftName] = useState("");
    const [nameError, setNameError] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [validation, setValidation] = useState(null);
    const [preview, setPreview] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState(null);
    const [historyFilter, setHistoryFilter] = useState("all");
    const fileInputRef = useRef(null);
    const toastTimerRef = useRef(null);

    const selectedTable = tables.find((table) => table.id === selectedId);
    const selectedMeta = selectedTable || { records: 0, updatedAt: null, status: "Sin datos" };
    const tableNames = useMemo(() => Object.fromEntries(tables.map((table) => [table.id, table.name])), [tables]);
    const columns = preview.length ? Object.keys(preview[0]).slice(0, 8) : [];

    useEffect(() => {
        cargarTablas();
    }, []);

    useEffect(() => {
        cargarHistorial(historyFilter);
    }, [historyFilter]);

    useEffect(() => () => clearTimeout(toastTimerRef.current), []);

    async function cargarTablas() {
        try {
            const datos = await apiSalesforce.tablas();
            setTables(datos.map((tabla) => ({ ...tabla, name: nombreVisual(tabla) })));
            setLoadError("");
        } catch (error) {
            setLoadError(mostrarError(error));
        }
    }

    async function cargarHistorial(filtro = "all") {
        setHistoryLoading(true);
        try {
            const respuesta = await apiSalesforce.historial({
                page_size: 50,
                ...(filtro !== "all" ? { tabla: filtro } : {}),
            });
            const registros = Array.isArray(respuesta) ? respuesta : respuesta.results || [];
            setHistory(registros.map(normalizarHistorial));
        } catch (error) {
            setLoadError(mostrarError(error));
        } finally {
            setHistoryLoading(false);
        }
    }

    function showToast(message, type = "success") {
        setToast({ message, type });
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 3500);
    }

    function resetFile() {
        setFile(null);
        setFileError("");
        setValidation(null);
        setPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function selectTable(id) {
        if (id === selectedId || analyzing || updating) return;
        setSelectedId(id);
        resetFile();
    }

    function beginEdit(table, event) {
        event.stopPropagation();
        setEditingId(table.id);
        setDraftName(table.name);
        setNameError("");
    }

    function saveName(event) {
        event?.stopPropagation();
        const nombre = draftName.trim();
        if (!nombre) {
            setNameError("El nombre no puede estar vacío.");
            return;
        }
        try {
            const etiquetas = JSON.parse(localStorage.getItem(LABELS_KEY) || "{}");
            localStorage.setItem(LABELS_KEY, JSON.stringify({ ...etiquetas, [editingId]: nombre }));
        } catch {
            // Si no hay almacenamiento, el cambio se mantiene durante la sesión.
        }
        setTables((actual) => actual.map((tabla) => tabla.id === editingId ? { ...tabla, name: nombre } : tabla));
        setEditingId(null);
        setNameError("");
        showToast("Nombre visual actualizado en este navegador.");
    }

    function validateAndSetFile(candidate) {
        setFileError("");
        setValidation(null);
        setPreview([]);
        if (!candidate) return;
        const extension = candidate.name.split(".").pop()?.toLowerCase();
        if (!["xlsx", "xls", "csv"].includes(extension)) {
            setFile(null);
            setFileError("Formato inválido. Selecciona .xlsx, .xls o .csv.");
            return;
        }
        if (candidate.size > MAX_FILE_SIZE) {
            setFile(null);
            setFileError("El archivo supera los 60 MB permitidos.");
            return;
        }
        if (!candidate.size) {
            setFile(null);
            setFileError("El archivo está vacío.");
            return;
        }
        setFile(candidate);
    }

    async function analyzeFile() {
        if (!file || analyzing || updating) return;
        setAnalyzing(true);
        setFileError("");
        setValidation(null);
        try {
            const resultado = await apiSalesforce.validar(selectedId, file);
            setValidation(resultado);
            setPreview(resultado.vista_previa || []);
            if (resultado.valido) showToast("Archivo validado. Ya puedes confirmar la actualización.");
            else setFileError(`Se detectaron ${resultado.errores} errores. Corrige el archivo antes de importar.`);
        } catch (error) {
            setFileError(mostrarError(error));
        } finally {
            setAnalyzing(false);
        }
    }

    async function startUpdate() {
        if (!file || !validation?.valido || !validation.huella || updating) return;
        setConfirmOpen(false);
        setUpdating(true);
        setFileError("");
        try {
            const resultado = await apiSalesforce.importar(selectedId, file, validation.huella);
            if (resultado.errores > 0) {
                throw new Error("La importación no se completó por errores de validación.");
            }
            resetFile();
            await Promise.all([cargarTablas(), cargarHistorial(historyFilter)]);
            showToast(`Importación completada: ${resultado.nuevos} nuevos y ${resultado.actualizar} actualizados.`);
        } catch (error) {
            setFileError(mostrarError(error));
            showToast(mostrarError(error), "error");
        } finally {
            setUpdating(false);
        }
    }

    return (
        <div className="mx-auto max-w-[1500px] font-vw text-slate-800">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-3">
                    <Database size={44} strokeWidth={1.8} className="shrink-0 text-[#1474E6]" />
                    <div>
                        <h1 className="font-vw-header text-3xl font-bold text-[#131E5C]">SalesForce</h1>
                        <p className="mt-1 text-sm text-slate-500">Administración y actualización de tablas mediante archivos Excel o CSV.</p>
                    </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Conectado a PostgreSQL
                </span>
            </header>

            {loadError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{loadError}</div>}
            <div className="grid items-stretch gap-4 lg:grid-cols-[27fr_73fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="mb-3 px-1">
                        <h2 className="font-vw-header text-lg font-bold text-[#131E5C]">Tablas disponibles</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">Selecciona una tabla para actualizar sus registros.</p>
                    </div>
                    <div className="space-y-1.5">
                        {tables.map((table) => {
                            const selected = table.id === selectedId;
                            const editing = table.id === editingId;
                            return (
                                <div key={table.id}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => selectTable(table.id)}
                                        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && selectTable(table.id)}
                                        className={`group flex min-h-10 w-full items-center gap-2.5 rounded-lg border py-1.5 pl-3 pr-2 text-left transition ${selected ? "border-blue-100 border-l-[3px] border-l-[#1474E6] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                                    >
                                        <Table2 size={17} className={selected ? "text-[#1474E6]" : "text-[#315289]"} />
                                        {editing ? (
                                            <div className="min-w-0 flex-1" onClick={(event) => event.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    value={draftName}
                                                    maxLength={45}
                                                    onChange={(event) => { setDraftName(event.target.value); setNameError(""); }}
                                                    onKeyDown={(event) => { if (event.key === "Enter") saveName(event); if (event.key === "Escape") setEditingId(null); }}
                                                    className="h-7 w-full rounded-md border border-blue-300 bg-white px-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                                    aria-label={`Editar nombre de ${table.name}`}
                                                />
                                                <div className="mt-1 flex gap-1">
                                                    <button type="button" onClick={saveName} className="inline-flex items-center gap-1 rounded bg-[#1474E6] px-1.5 py-0.5 text-[10px] font-bold text-white"><Save size={10} /> Guardar</button>
                                                    <button type="button" onClick={(event) => { event.stopPropagation(); setEditingId(null); setNameError(""); }} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#1A1F3C]">{table.name}</span>
                                                <span role="button" tabIndex={0} onClick={(event) => beginEdit(table, event)} onKeyDown={(event) => event.key === "Enter" && beginEdit(table, event)} className="grid h-7 w-7 place-items-center rounded-md text-[#315289] hover:bg-white hover:text-[#1474E6]" aria-label={`Editar ${table.name}`}><Pencil size={15} /></span>
                                            </>
                                        )}
                                    </div>
                                    {editing && nameError && <p className="px-2 py-0.5 text-[10px] font-semibold text-red-600">{nameError}</p>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#1474E6] text-white"><Table2 size={20} /></span>
                        <h2 className="mr-2 font-vw-header text-xl font-bold text-[#131E5C]">{selectedTable?.name}</h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700"><Database size={13} />{Number(selectedMeta.records || 0).toLocaleString("es-MX")} registros</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600"><CalendarDays size={13} />Última actualización: {fechaLegible(selectedMeta.updatedAt)}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"><CheckCircle2 size={14} />{selectedMeta.status}</span>
                    </div>
                    <p className="mb-3 mt-1.5 pl-0 text-xs text-slate-500 sm:pl-[46px]">Selecciona un archivo Excel o CSV para validar y actualizar los registros de PostgreSQL.</p>

                    <div
                        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                        onDragOver={(event) => event.preventDefault()}
                        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
                        onDrop={(event) => { event.preventDefault(); setDragging(false); validateAndSetFile(event.dataTransfer.files?.[0]); }}
                        className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${dragging ? "border-[#1474E6] bg-blue-100/70" : "border-blue-300 bg-blue-50/60 hover:border-[#1474E6]"}`}
                    >
                        <UploadCloud size={40} strokeWidth={1.8} className="mx-auto text-[#1474E6]" />
                        <h3 className="mt-1 font-vw-header text-sm font-bold text-[#1A1F3C]">Arrastra y suelta tu archivo aquí</h3>
                        <p className="text-xs font-semibold text-slate-500">o</p>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => validateAndSetFile(event.target.files?.[0])} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-[#1474E6] bg-white px-4 py-2 text-xs font-bold text-[#1474E6] shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"><FileSpreadsheet size={15} /> Seleccionar archivo</button>
                        <p className="mt-2.5 text-[11px] text-slate-500">Formatos permitidos: <strong>.xlsx, .xls, .csv</strong><span className="mx-2 text-slate-300">|</span>Tamaño máximo: <strong>60 MB</strong></p>
                    </div>

                    {fileError && <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700"><AlertCircle size={16} className="shrink-0" />{fileError}</div>}
                    {file && (
                        <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white"><FileSpreadsheet size={19} /></span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-slate-800">{file.name}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]"><span className="text-slate-500">{formatBytes(file.size)}</span><span className="text-slate-300">|</span><span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 size={13} /> Archivo listo para analizar</span></div>
                            </div>
                            <button type="button" onClick={resetFile} disabled={analyzing || updating} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-40" aria-label="Eliminar archivo"><Trash2 size={16} /></button>
                        </div>
                    )}

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button type="button" onClick={analyzeFile} disabled={!file || analyzing || updating} className="inline-flex items-center gap-2 rounded-lg bg-[#1474E6] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0d63ca] disabled:cursor-not-allowed disabled:opacity-50">{analyzing ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}{analyzing ? "Validando..." : "Validar datos"}</button>
                        {validation?.valido && <button type="button" onClick={() => setConfirmOpen(true)} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><RefreshCw size={15} /> Actualizar tabla</button>}
                    </div>

                    {validation && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-vw-header text-base font-bold text-[#131E5C]">Resultado de la validación</h3><p className="text-[11px] text-slate-500">Resultados calculados en Django, sin modificar la base de datos.</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">{validation.valido ? "Validado" : "Con errores"}</span></div>
                            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                <StatCard icon={Database} label="Registros encontrados" value={validation.encontrados} tone="blue" />
                                <StatCard icon={CheckCircle2} label="Registros nuevos" value={validation.nuevos} tone="green" />
                                <StatCard icon={RefreshCw} label="Por actualizar" value={validation.actualizar} tone="amber" />
                                <StatCard icon={AlertCircle} label="Con errores" value={validation.errores} tone="red" />
                            </div>
                            {validation.detalle_errores?.length > 0 && (
                                <div className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    {validation.detalle_errores.map((error, indice) => <p key={indice}>Fila {error.fila}: {error.error}</p>)}
                                </div>
                            )}
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2"><div><h4 className="text-xs font-bold text-[#1A1F3C]">Vista previa de registros</h4><p className="text-[10px] text-slate-500">Primeras {preview.length} filas · hasta 8 columnas</p></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">Datos reales</span></div>
                                <div className="overflow-x-auto"><table className="min-w-full text-left text-[11px]"><thead className="bg-white text-[9px] uppercase tracking-wider text-slate-400"><tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 font-bold">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{preview.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-blue-50/40">{columns.map((column) => <td key={column} className="max-w-[200px] truncate whitespace-nowrap px-3 py-2 text-slate-600" title={String(row[column] ?? "")}>{String(row[column] ?? "") || "—"}</td>)}</tr>)}</tbody></table></div>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                        <Clock3 size={21} className="mt-0.5 text-[#1474E6]" />
                        <div><h2 className="font-vw-header text-lg font-bold text-[#131E5C]">Historial de actualizaciones</h2><p className="text-[11px] text-slate-500">Registro real de los archivos importados a PostgreSQL.</p></div>
                    </div>
                    <label className="relative block w-full sm:w-52">
                        <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#315289]" />
                        <select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)} className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" aria-label="Filtrar historial por tabla">
                            <option value="all">Todas las tablas</option>
                            {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
                    </label>
                </div>
                <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full text-left text-xs">
                        <thead className="bg-[#EEF4FB] text-[10px] text-[#33466A]"><tr><th className="px-5 py-2 font-bold">Fecha y hora</th><th className="px-5 py-2 font-bold">Tabla</th><th className="px-5 py-2 font-bold">Archivo</th><th className="px-5 py-2 text-right font-bold">Registros</th><th className="px-5 py-2 font-bold">Estado</th><th className="px-5 py-2 text-right font-bold">Acciones</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.map((item) => {
                                const warning = item.status === "Con advertencias";
                                return <tr key={item.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-2.5 font-semibold text-slate-600">{item.date}</td><td className="whitespace-nowrap px-5 py-2.5 font-bold text-[#1A1F3C]">{tableNames[item.tableId] || "Tabla"}</td><td className="max-w-[260px] truncate px-5 py-2.5 text-slate-600">{item.file}</td><td className="px-5 py-2.5 text-right font-bold text-slate-700">{item.records.toLocaleString("es-MX")}</td><td className="px-5 py-2.5"><span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold ${warning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{warning ? <AlertCircle size={13} /> : <Check size={13} />}{item.status}</span></td><td className="px-5 py-2.5 text-right"><button type="button" onClick={() => setDetail(item)} className="ml-auto grid h-7 w-8 place-items-center rounded-md border border-blue-100 text-[#1474E6] hover:bg-blue-50" aria-label={`Ver detalles de ${item.file}`}><Eye size={15} /></button></td></tr>;
                            })}
                            {historyLoading && <tr><td colSpan="6" className="px-5 py-8 text-center text-xs text-slate-400">Consultando historial...</td></tr>}
                            {!historyLoading && !history.length && <tr><td colSpan="6" className="px-5 py-8 text-center text-xs text-slate-400">No hay actualizaciones para esta tabla.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B123D]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setConfirmOpen(false)}>
                    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="font-vw-header text-xl font-bold text-[#131E5C]">Confirmar actualización real</h2>
                            <button type="button" onClick={() => setConfirmOpen(false)} aria-label="Cerrar"><X size={18} /></button>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">Esta acción modificará los registros existentes en PostgreSQL. No se eliminarán registros ausentes del archivo.</p>
                        <div className="my-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between gap-3"><span>Tabla</span><strong>{selectedTable?.name}</strong></div>
                            <div className="flex justify-between gap-3"><span>Archivo</span><strong className="max-w-[210px] truncate">{file?.name}</strong></div>
                            <div className="flex justify-between gap-3"><span>Nuevos</span><strong>{validation?.nuevos.toLocaleString("es-MX")}</strong></div>
                            <div className="flex justify-between gap-3"><span>Por actualizar</span><strong>{validation?.actualizar.toLocaleString("es-MX")}</strong></div>
                            <div className="flex justify-between gap-3"><span>Sin cambios</span><strong>{validation?.sin_cambios.toLocaleString("es-MX")}</strong></div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                            <button type="button" onClick={startUpdate} className="rounded-xl bg-[#1474E6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d63ca]">Confirmar importación</button>
                        </div>
                    </div>
                </div>
            )}

            {updating && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B123D]/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
                        <Loader2 size={34} className="mx-auto animate-spin text-[#1474E6]" />
                        <h2 className="mt-4 font-vw-header text-xl font-bold text-[#131E5C]">Actualizando {selectedTable?.name}</h2>
                        <p className="mt-2 text-sm text-slate-500">Django está procesando y guardando el archivo. La operación termina cuando el servidor responde.</p>
                    </div>
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B123D]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}>
                    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h2 className="font-vw-header text-xl font-bold text-[#131E5C]">Detalle de importación</h2>
                            <button type="button" onClick={() => setDetail(null)} aria-label="Cerrar"><X size={18} /></button>
                        </div>
                        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4 text-sm">
                            {[['Fecha', detail.date], ['Tabla', tableNames[detail.tableId]], ['Archivo', detail.file],
                            ['Leídos', detail.records], ['Nuevos', detail.created], ['Actualizados', detail.updated],
                            ['Sin cambios', detail.unchanged], ['Errores', detail.errors], ['Estado', detail.status]
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between gap-3">
                                    <span className="text-slate-500">{label}</span>
                                    <strong className="max-w-[230px] truncate text-right">{value}</strong>
                                </div>
                            ))}
                        </div>
                        {detail.details.length > 0 && <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
                            {detail.details.map((error, indice) => <p key={indice}>Fila {error.fila || "—"}: {error.error}</p>)}
                        </div>}
                        <button type="button" onClick={() => setDetail(null)} className="mt-5 w-full rounded-xl bg-[#131E5C] py-2.5 text-sm font-bold text-white hover:bg-[#223278]">Cerrar</button>
                    </div>
                </div>
            )}

            {toast && <div className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border bg-white p-4 text-sm font-bold shadow-xl ${toast.type === "success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"}`}>{toast.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}{toast.message}<button type="button" onClick={() => setToast(null)} className="ml-2 text-slate-400"><X size={15} /></button></div>}
        </div>
    );
}
