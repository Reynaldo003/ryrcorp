import { createElement, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
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

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const VALID_EXTENSIONS = ["xlsx", "xls", "csv"];
const SIMULATED_STATS = { found: 1250, created: 320, updated: 900, errors: 30 };

const INITIAL_TABLES = Array.from({ length: 7 }, (_, index) => ({
    id: `table-${index + 1}`,
    name: `Tabla ${index + 1}`,
}));

const TABLE_METADATA = {
    "table-1": { records: 12458, updatedAt: "03 nov 2026, 11:24 a.m.", status: "Lista para actualización" },
    "table-2": { records: 9842, updatedAt: "02 nov 2026, 05:18 p.m.", status: "Lista para actualización" },
    "table-3": { records: 7316, updatedAt: "01 nov 2026, 09:07 a.m.", status: "Lista para actualización" },
    "table-4": { records: 15204, updatedAt: "31 oct 2026, 04:42 p.m.", status: "Lista para actualización" },
    "table-5": { records: 6290, updatedAt: "30 oct 2026, 12:16 p.m.", status: "Lista para actualización" },
    "table-6": { records: 11053, updatedAt: "29 oct 2026, 10:35 a.m.", status: "Lista para actualización" },
    "table-7": { records: 4871, updatedAt: "28 oct 2026, 03:51 p.m.", status: "Lista para actualización" },
};

const INITIAL_HISTORY = [
    { id: 1, date: "03 nov 2026, 11:24 a.m.", tableId: "table-1", file: "prospectos_oct2026.xlsx", records: 2154, status: "Actualización exitosa" },
    { id: 2, date: "02 nov 2026, 05:18 p.m.", tableId: "table-4", file: "oportunidades_oct2026.csv", records: 348, status: "Actualización exitosa" },
    { id: 3, date: "01 nov 2026, 09:07 a.m.", tableId: "table-2", file: "actividades_oct2026.xlsx", records: 1206, status: "Con advertencias" },
];

const MOCK_PREVIEW = [
    { ID: "SF-001", Cliente: "María Hernández", Estado: "Nuevo", Agencia: "PZR" },
    { ID: "SF-002", Cliente: "Carlos Ramírez", Estado: "Actualizar", Agencia: "TXT" },
    { ID: "SF-003", Cliente: "Ana López", Estado: "Actualizar", Agencia: "CBA" },
    { ID: "SF-004", Cliente: "Jorge Martínez", Estado: "Nuevo", Agencia: "OBA" },
    { ID: "SF-005", Cliente: "Laura Sánchez", Estado: "Actualizar", Agencia: "TXP" },
];

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
    const [tables, setTables] = useState(INITIAL_TABLES);
    const [selectedId, setSelectedId] = useState(INITIAL_TABLES[0].id);
    const [editingId, setEditingId] = useState(null);
    const [draftName, setDraftName] = useState("");
    const [nameError, setNameError] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [preview, setPreview] = useState([]);
    const [previewSource, setPreviewSource] = useState("mock");
    const [history, setHistory] = useState(INITIAL_HISTORY);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [progress, setProgress] = useState(0);
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState(null);
    const [historyFilter, setHistoryFilter] = useState("all");
    const fileInputRef = useRef(null);
    const intervalRef = useRef(null);
    const toastTimerRef = useRef(null);

    const selectedTable = tables.find((table) => table.id === selectedId);
    const selectedMeta = TABLE_METADATA[selectedId];
    const tableNames = useMemo(() => Object.fromEntries(tables.map((table) => [table.id, table.name])), [tables]);
    const filteredHistory = useMemo(
        () => historyFilter === "all" ? history : history.filter((item) => item.tableId === historyFilter),
        [history, historyFilter]
    );

    useEffect(() => () => {
        clearInterval(intervalRef.current);
        clearTimeout(toastTimerRef.current);
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 3500);
    };

    const resetFile = () => {
        setFile(null);
        setFileError("");
        setAnalyzed(false);
        setPreview([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const selectTable = (id) => {
        if (id === selectedId) return;
        setSelectedId(id);
        resetFile();
    };

    const beginEdit = (table, event) => {
        event.stopPropagation();
        setEditingId(table.id);
        setDraftName(table.name);
        setNameError("");
    };

    const saveName = (event) => {
        event?.stopPropagation();
        const cleanName = draftName.trim();
        if (!cleanName) {
            setNameError("El nombre no puede estar vacío.");
            return;
        }
        setTables((current) => current.map((table) => table.id === editingId ? { ...table, name: cleanName } : table));
        setEditingId(null);
        setNameError("");
        showToast("Nombre visual actualizado.");
    };

    const validateAndSetFile = (candidate) => {
        setFileError("");
        setAnalyzed(false);
        setPreview([]);
        if (!candidate) return;
        const extension = candidate.name.split(".").pop()?.toLowerCase();
        if (!VALID_EXTENSIONS.includes(extension)) {
            setFile(null);
            setFileError("Formato no válido. Selecciona un archivo .xlsx, .xls o .csv.");
            return;
        }
        if (candidate.size > MAX_FILE_SIZE) {
            setFile(null);
            setFileError("El archivo supera el tamaño máximo de 20 MB.");
            return;
        }
        if (candidate.size === 0) {
            setFile(null);
            setFileError("El archivo está vacío.");
            return;
        }
        setFile(candidate);
    };

    const analyzeFile = async () => {
        if (!file || analyzing) return;
        setAnalyzing(true);
        setFileError("");
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = firstSheet ? XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) : [];
            if (rows.length) {
                setPreview(rows.slice(0, 8));
                setPreviewSource("real");
            } else {
                setPreview(MOCK_PREVIEW);
                setPreviewSource("mock");
            }
            await new Promise((resolve) => setTimeout(resolve, 900));
            setAnalyzed(true);
        } catch {
            setAnalyzed(false);
            setFileError("No fue posible leer el archivo. Verifica que no esté dañado.");
        } finally {
            setAnalyzing(false);
        }
    };

    const startUpdate = () => {
        setConfirmOpen(false);
        setUpdating(true);
        setProgress(0);
        let current = 0;
        intervalRef.current = setInterval(() => {
            current = Math.min(100, current + Math.floor(Math.random() * 12) + 6);
            setProgress(current);
            if (current >= 100) {
                clearInterval(intervalRef.current);
                const completedFile = file?.name || "Archivo";
                setHistory((items) => [{
                    id: Date.now(),
                    date: new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
                    tableId: selectedId,
                    file: completedFile,
                    records: SIMULATED_STATS.found,
                    status: "Actualización exitosa",
                }, ...items]);
                setUpdating(false);
                resetFile();
                showToast("Actualización simulada completada correctamente.");
            }
        }, 260);
    };

    const columns = preview.length ? Object.keys(preview[0]).slice(0, 8) : [];

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
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Entorno de simulación
                </span>
            </header>

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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700"><Database size={13} />{selectedMeta.records.toLocaleString("es-MX")} registros</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600"><CalendarDays size={13} />Última actualización: {selectedMeta.updatedAt}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"><CheckCircle2 size={14} />{selectedMeta.status}</span>
                    </div>
                    <p className="mb-3 mt-1.5 pl-0 text-xs text-slate-500 sm:pl-[46px]">Selecciona un archivo Excel o CSV para simular la actualización de registros.</p>

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
                        <p className="mt-2.5 text-[11px] text-slate-500">Formatos permitidos: <strong>.xlsx, .xls, .csv</strong><span className="mx-2 text-slate-300">|</span>Tamaño máximo: <strong>20 MB</strong></p>
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
                        {analyzed && <button type="button" onClick={() => setConfirmOpen(true)} disabled={updating} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><RefreshCw size={15} /> Actualizar tabla</button>}
                    </div>

                    {analyzed && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-vw-header text-base font-bold text-[#131E5C]">Resultado de la validación</h3><p className="text-[11px] text-slate-500">Estadísticas simuladas; la vista previa se lee del archivo.</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">Simulación</span></div>
                            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                <StatCard icon={Database} label="Registros encontrados" value={SIMULATED_STATS.found} tone="blue" />
                                <StatCard icon={CheckCircle2} label="Registros nuevos" value={SIMULATED_STATS.created} tone="green" />
                                <StatCard icon={RefreshCw} label="Por actualizar" value={SIMULATED_STATS.updated} tone="amber" />
                                <StatCard icon={AlertCircle} label="Con errores" value={SIMULATED_STATS.errors} tone="red" />
                            </div>
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2"><div><h4 className="text-xs font-bold text-[#1A1F3C]">Vista previa de registros</h4><p className="text-[10px] text-slate-500">Primeras {preview.length} filas · hasta 8 columnas</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${previewSource === "real" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{previewSource === "real" ? "Datos leídos del archivo" : "Vista previa mock"}</span></div>
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
                        <div><h2 className="font-vw-header text-lg font-bold text-[#131E5C]">Historial de actualizaciones</h2><p className="text-[11px] text-slate-500">Registro de las actualizaciones realizadas (simulación).</p></div>
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
                            {filteredHistory.map((item) => {
                                const warning = item.status === "Con advertencias";
                                return <tr key={item.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-2.5 font-semibold text-slate-600">{item.date}</td><td className="whitespace-nowrap px-5 py-2.5 font-bold text-[#1A1F3C]">{tableNames[item.tableId] || "Tabla"}</td><td className="max-w-[260px] truncate px-5 py-2.5 text-slate-600">{item.file}</td><td className="px-5 py-2.5 text-right font-bold text-slate-700">{item.records.toLocaleString("es-MX")}</td><td className="px-5 py-2.5"><span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-bold ${warning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{warning ? <AlertCircle size={13} /> : <Check size={13} />}{item.status}</span></td><td className="px-5 py-2.5 text-right"><button type="button" onClick={() => setDetail(item)} className="ml-auto grid h-7 w-8 place-items-center rounded-md border border-blue-100 text-[#1474E6] hover:bg-blue-50" aria-label={`Ver detalles de ${item.file}`}><Eye size={15} /></button></td></tr>;
                            })}
                            {!filteredHistory.length && <tr><td colSpan="6" className="px-5 py-8 text-center text-xs text-slate-400">No hay actualizaciones para esta tabla.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>

            {confirmOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B123D]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setConfirmOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><RefreshCw size={23} /></span><button type="button" onClick={() => setConfirmOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={18} /></button></div><h2 id="confirm-title" className="font-vw-header text-xl font-bold text-[#131E5C]">Confirmar actualización</h2><p className="mt-2 text-sm leading-6 text-slate-500">Se simulará el procesamiento del archivo. No se modificará ninguna base de datos.</p><div className="my-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Tabla</span><strong className="text-right text-slate-800">{selectedTable?.name}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Archivo</span><strong className="max-w-[230px] truncate text-right text-slate-800">{file?.name}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Registros simulados</span><strong className="text-slate-800">1,250</strong></div></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancelar</button><button type="button" onClick={startUpdate} className="rounded-xl bg-[#1474E6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d63ca]">Confirmar simulación</button></div></div></div>}

            {updating && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B123D]/55 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"><Loader2 size={34} className="mx-auto animate-spin text-[#1474E6]" /><h2 className="mt-4 font-vw-header text-xl font-bold text-[#131E5C]">Actualizando {selectedTable?.name}</h2><p className="mt-2 text-sm text-slate-500">Procesamiento simulado en curso. No cierres esta ventana.</p><div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#1474E6] to-[#00B0F0] transition-all duration-300" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm font-bold text-[#1474E6]">{progress}%</p></div></div>}

            {detail && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B123D]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-vw-header text-xl font-bold text-[#131E5C]">Detalle de operación</h2><button type="button" onClick={() => setDetail(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-500">Fecha</span><strong className="text-right">{detail.date}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-500">Tabla</span><strong>{tableNames[detail.tableId]}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-500">Archivo</span><strong className="max-w-[230px] truncate">{detail.file}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-500">Procesados</span><strong>{detail.records.toLocaleString("es-MX")}</strong></div><div className="flex justify-between gap-3"><span className="text-slate-500">Estado</span><strong className="text-emerald-700">{detail.status}</strong></div></div><div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700"><AlertCircle size={16} className="shrink-0" />Esta operación pertenece únicamente al historial local de la simulación.</div><button type="button" onClick={() => setDetail(null)} className="mt-5 w-full rounded-xl bg-[#131E5C] py-2.5 text-sm font-bold text-white hover:bg-[#223278]">Cerrar</button></div></div>}

            {toast && <div className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border bg-white p-4 text-sm font-bold shadow-xl ${toast.type === "success" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"}`}>{toast.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}{toast.message}<button type="button" onClick={() => setToast(null)} className="ml-2 text-slate-400"><X size={15} /></button></div>}
        </div>
    );
}
