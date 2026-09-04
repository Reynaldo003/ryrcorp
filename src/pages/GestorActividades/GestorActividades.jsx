import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    Plus,
    X,
    Trash2,
    Pencil,
    Search,
    Calendar,
    LayoutList,
    LayoutGrid,
    UsersRound,
    Loader2,
    Save,
    CheckCircle2,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    CalendarCheck,
    Filter,
} from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";

const BRAND_BLUE = "#131E5C";

const PRIORITIES = [
    { value: "LOW",    label: "Baja",    color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { value: "MEDIUM", label: "Media",   color: "bg-sky-100 text-sky-700 border-sky-300" },
    { value: "HIGH",   label: "Alta",    color: "bg-amber-100 text-amber-700 border-amber-300" },
    { value: "URGENT", label: "Urgente", color: "bg-rose-100 text-rose-700 border-rose-300" },
];

const LIST_COLORS = {
    "Por hacer":  { dot: "bg-blue-500", text: "text-blue-600", hex: "#3B82F6" },
    "En proceso": { dot: "bg-amber-500", text: "text-amber-700", hex: "#F59E0B" },
    "Hecho":      { dot: "bg-emerald-500", text: "text-emerald-600", hex: "#10B981" },
};

const emptyColors = { dot: "bg-slate-400", text: "text-slate-600", hex: "#94A3B8" };

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function toInputDate(val) {
    if (!val) return "";
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const n = Number(s);
    if (!isNaN(n) && n > 0) return new Date(n).toISOString().slice(0, 10);
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return "";
}

function PriorityBadge({ value }) {
    const p = PRIORITIES.find((x) => x.value === value) || PRIORITIES[1];
    return (
        <span className={cls("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", p.color)}>
            {p.label}
        </span>
    );
}

function UserAvatar({ user, size = "sm" }) {
    const initial = user?.name?.[0] || user?.nombre_completo?.[0] || user?.email?.[0] || "?";
    const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
    return (
        <div className={cls("rounded-full bg-[#131E5C]/10 flex items-center justify-center font-bold text-[#131E5C]", sizeClass)}>
            {initial.toUpperCase()}
        </div>
    );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                            <Trash2 className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-black">{title}</div>
                            <div className="text-xs text-black/50 mt-0.5">{message}</div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50">Cancelar</button>
                        <button type="button" onClick={onConfirm} disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700 disabled:opacity-50">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActividadModal({ open, onClose, actividad, lists, teamId, onSaved }) {
    const [title, setTitle] = useState("");
    const [listId, setListId] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [due, setDue] = useState("");
    const [start, setStart] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [estrategia, setEstrategia] = useState("");
    const [subtasks, setSubtasks] = useState([]);
    const [newSub, setNewSub] = useState("");
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [assigneeResults, setAssigneeResults] = useState([]);
    const [searchingAssignees, setSearchingAssignees] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setTitle(actividad?.title || "");
        setListId(actividad?.list ? String(actividad.list) : (lists[0]?.id ? String(lists[0].id) : ""));
        setPriority(actividad?.priority || "MEDIUM");
        setStart(actividad?.start_date ? toInputDate(actividad.start_date) : "");
        setDue(actividad?.due_date ? toInputDate(actividad.due_date) : "");
        setDescripcion(actividad?.description || actividad?.descripcion || "");
        setEstrategia(actividad?.desarrollo_estrategia || actividad?.estrategia || "");
        setSubtasks(Array.isArray(actividad?.subtareas) ? actividad.subtareas.map((s) => ({
            id: s.id || Math.random(),
            title: s.title || s.titulo || "",
            done: !!s.done,
        })) : []);
        setAssignedUsers(Array.isArray(actividad?.assigned) ? actividad.assigned.map((a) => ({
            id: a.user_id || a.id,
            name: a.name,
            email: a.email,
        })) : []);
    }, [open, actividad, lists]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!assigneeSearch.trim() || assigneeSearch.length < 2) { setAssigneeResults([]); return; }
            setSearchingAssignees(true);
            try {
                const r = await apiClickup.searchUsers(assigneeSearch);
                setAssigneeResults(Array.isArray(r) ? r : []);
            } catch { setAssigneeResults([]); }
            finally { setSearchingAssignees(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [assigneeSearch]);

    function addSubtask() {
        const t = newSub.trim();
        if (!t) return;
        setSubtasks((prev) => [...prev, { id: Math.random(), title: t, done: false }]);
        setNewSub("");
    }

    async function handleSave() {
        if (!title.trim() || !listId || !teamId) return;
        setSaving(true);
        try {
            const payload = {
                lista: Number(listId),
                titulo: title.trim(),
                descripcion: descripcion.trim(),
                desarrollo_estrategia: estrategia.trim(),
                prioridad: priority,
                inicio: start ? `${start}T00:00:00Z` : null,
                vence: due ? `${due}T00:00:00Z` : null,
                subtareas: subtasks.map((s) => ({ titulo: s.title, done: !!s.done })),
                asignados_ids: assignedUsers.map((u) => u.id),
            };
            if (actividad?.id) {
                await apiClickup.updateTask(Number(teamId), Number(actividad.id), payload);
            } else {
                await apiClickup.createTask(Number(teamId), payload);
            }
            onSaved?.();
            onClose();
        } catch (e) {
            console.error(e);
            alert(e.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;
    const inputBase = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]";
    const doneCount = subtasks.filter((s) => s.done).length;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: `linear-gradient(135deg,${BRAND_BLUE} 0%,#1e3282 100%)` }}>
                    <div className="flex items-center gap-2.5">
                        <CalendarCheck className="h-5 w-5 text-white/80" />
                        <h3 className="text-[15px] font-black tracking-tight text-white">{actividad?.id ? "Editar Actividad" : "Nueva Actividad"}</h3>
                    </div>
                    <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10"><X className="h-4 w-4" /></button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    <div>
                        <label className="text-xs font-extrabold text-black/60">Título *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className={cls(inputBase, "mt-1")} placeholder="Nombre de la actividad" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-extrabold text-black/60">Estado</label>
                            <select value={listId} onChange={(e) => setListId(e.target.value)} className={cls(inputBase, "mt-1 font-bold")}>
                                {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-extrabold text-black/60">Prioridad</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={cls(inputBase, "mt-1 font-bold")}>
                                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-extrabold text-black/60">Fecha de inicio</label>
                            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={cls(inputBase, "mt-1")} />
                        </div>
                        <div>
                            <label className="text-xs font-extrabold text-black/60">Fecha de fin</label>
                            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cls(inputBase, "mt-1")} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-extrabold text-black/60">Descripción</label>
                        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} className={cls(inputBase, "mt-1 min-h-[80px]")} placeholder="Detalle de la actividad..." />
                    </div>
                    <div className="rounded-xl border border-black/10 bg-blue-50 p-4">
                        <label className="text-xs font-extrabold text-[#131E5C]">Método y estrategia</label>
                        <textarea value={estrategia} onChange={(e) => setEstrategia(e.target.value)} rows={3} className={cls(inputBase, "mt-1 min-h-[80px]")} placeholder="¿Qué método o estrategia se va a implementar?" />
                    </div>

                    <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-xs font-extrabold text-[#131E5C]">
                                Subtareas
                                {subtasks.length > 0 && <span className="ml-1.5 rounded-full bg-[#131E5C]/10 px-2 py-0.5 text-[10px]">{doneCount}/{subtasks.length}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubtask()} className={cls(inputBase, "flex-1")} placeholder="Nueva subtarea..." />
                            <button onClick={addSubtask} className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: BRAND_BLUE }}><Plus className="h-4 w-4" /></button>
                        </div>
                        {subtasks.length === 0
                            ? <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">Sin subtareas</div>
                            : <div className="grid gap-2">
                                {subtasks.map((s) => (
                                    <div key={s.id} className="flex items-center gap-2 rounded-lg border border-black/5 bg-white px-3 py-2">
                                        <button type="button" onClick={() => setSubtasks((prev) => prev.map((x) => x.id === s.id ? { ...x, done: !x.done } : x))}
                                            className={cls("shrink-0 rounded-full border-2 h-5 w-5 flex items-center justify-center transition", s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400")}>
                                            {s.done ? <CheckCircle2 className="h-3 w-3" /> : null}
                                        </button>
                                        <span className={cls("flex-1 min-w-0 truncate text-sm", s.done && "line-through text-black/40")}>{s.title}</span>
                                        <button type="button" onClick={() => setSubtasks((prev) => prev.filter((x) => x.id !== s.id))} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>}
                    </div>

                    <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                        <div className="mb-3 text-xs font-extrabold text-[#131E5C] flex items-center gap-2"><UsersRound className="h-3.5 w-3.5" />Asignado a</div>
                        {assignedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {assignedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center gap-2 rounded-full bg-[#131E5C]/10 px-3 py-1.5">
                                        <UserAvatar user={user} size="sm" />
                                        <span className="text-sm font-semibold text-[#131E5C]">{user.name}</span>
                                        <button onClick={() => setAssignedUsers((prev) => prev.filter((u) => u.id !== user.id))} className="text-black/40 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="relative">
                            <input value={assigneeSearch} onChange={(e) => setAssigneeSearch(e.target.value)} className={cls(inputBase, "pr-8")} placeholder="Buscar usuario para asignar..." />
                            {searchingAssignees && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-black/40" />}
                        </div>
                        {assigneeResults.length > 0 && (
                            <div className="mt-1 border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {assigneeResults.map((user) => {
                                    const already = assignedUsers.some((u) => u.id === user.id);
                                    return (
                                        <button key={user.id} onClick={() => { if (!already) setAssignedUsers((prev) => [...prev, user]); setAssigneeSearch(""); setAssigneeResults([]); }} disabled={already}
                                            className={cls("w-full text-left px-3 py-2 hover:bg-slate-100 border-b last:border-b-0", already && "opacity-50 bg-slate-50")}>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={user} size="sm" />
                                                <div><div className="text-sm font-semibold text-[#131E5C]">{user.name}</div><div className="text-xs text-black/50">{user.email}</div></div>
                                                {already && <span className="text-xs text-emerald-600 ml-auto">Ya asignado</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-black/[0.07] bg-slate-50/80 px-5 py-3.5 shrink-0">
                    <button onClick={onClose} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !title.trim() || !listId} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50" style={{ backgroundColor: BRAND_BLUE }}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Guardando..." : actividad?.id ? "Guardar cambios" : "Crear actividad"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActividadCard({ actividad, onEdit, onDelete }) {
    const subtasks = Array.isArray(actividad.subtareas) ? actividad.subtareas : [];
    const done = subtasks.filter((s) => s.done).length;
    const pct = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;
    const vence = actividad.due_date ? new Date(String(actividad.due_date)) : null;
    const vencida = vence && !isNaN(vence) && vence < new Date() && actividad.list_name !== "Hecho";
    const tabHex = (LIST_COLORS[actividad.list_name] || emptyColors).hex;
    const inicio = actividad.start_date ? String(actividad.start_date).slice(0, 10) : "";
    const fin = actividad.due_date ? String(actividad.due_date).slice(0, 10) : "";

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="absolute inset-y-0 left-0 w-1.5 rounded-r-sm" style={{ backgroundColor: tabHex }} />
            <div className="p-4 pl-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-[#131E5C] leading-snug">{actividad.title || "Sin título"}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <PriorityBadge value={actividad.priority} />
                            {(inicio || fin) && (
                                <span className={cls("inline-flex items-center gap-1 rounded-full border border-black/10 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold", vencida ? "text-rose-600" : "text-black/50")}>
                                    <Calendar className="h-3 w-3" />
                                    {inicio ? inicio : "—"} → {fin ? fin : "—"}
                                    {vencida && <span className="text-[9px] font-extrabold text-rose-500 bg-rose-100 border border-rose-200 rounded px-1">VENCIDA</span>}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => onEdit(actividad)} className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black/60 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => onDelete(actividad)} className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
                {actividad.descripcion && <p className="mt-2 line-clamp-2 text-xs text-black/55">{actividad.descripcion}</p>}
                {actividad.desarrollo_estrategia && (
                    <div className="mt-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] text-black/70">
                        <span className="font-bold text-blue-700">Método y estrategia:</span>{" "}
                        {actividad.desarrollo_estrategia.length > 140 ? actividad.desarrollo_estrategia.slice(0, 140) + "..." : actividad.desarrollo_estrategia}
                    </div>
                )}
                {subtasks.length > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-extrabold text-[#131E5C] mb-1">
                            <span>Subtareas</span><span className="text-black/40">{done}/{subtasks.length}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                )}
                {actividad.assigned && actividad.assigned.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {actividad.assigned.slice(0, 3).map((a, i) => <UserAvatar key={i} user={a} size="sm" />)}
                        {actividad.assigned.length > 3 && <span className="text-[10px] text-black/40">+{actividad.assigned.length - 3}</span>}
                    </div>
                )}
            </div>
        </article>
    );
}

function KanbanView({ actividades, lists, onEdit, onDelete, loading }) {
    if (loading) return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(lists.length, 1)}, minmax(0, 1fr))` }}>
            {lists.map((l) => (
                <div key={l.id} className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="mb-3 h-5 w-24 animate-pulse rounded bg-black/5" />
                    {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5 mb-3" />)}
                </div>
            ))}
        </div>
    );
    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(lists.length, 1)}, minmax(0, 1fr))` }}>
            {lists.map((lista) => {
                const colActivities = actividades.filter((t) => t.list_id === lista.id || t.list_name === lista.name);
                const c = LIST_COLORS[lista.name] || emptyColors;
                return (
                    <div key={lista.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${c.hex}2E` }}>
                        <span className="block h-1.5 w-full shrink-0" style={{ backgroundColor: c.hex }} />
                        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b" style={{ background: `${c.hex}0D`, borderColor: `${c.hex}1F` }}>
                            <div className="flex min-w-0 items-center gap-2">
                                <span className={cls("h-2.5 w-2.5 shrink-0 rounded-full", c.dot)} />
                                <span className={cls("truncate text-sm font-black", c.text)}>{lista.name}</span>
                                <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ backgroundColor: `${c.hex}1A`, color: c.hex }}>{colActivities.length}</span>
                            </div>
                            <button
                                onClick={() => onEdit({ list: lista.id, id: null })}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-white transition hover:opacity-90"
                                style={{ backgroundColor: c.hex, borderColor: `${c.hex}55` }}
                                title={`Nueva actividad en ${lista.name}`}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[60vh]" style={{ background: `linear-gradient(${c.hex}06, ${c.hex}00 40%)` }}>
                            {colActivities.length === 0
                                ? <div className="rounded-xl border border-dashed p-6 text-center text-xs font-semibold" style={{ borderColor: `${c.hex}40`, color: `${c.hex}70` }}>Sin actividades</div>
                                : colActivities.map((t) => <ActividadCard key={t.id} actividad={t} onEdit={onEdit} onDelete={onDelete} />)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TablaView({ actividades, lists, onEdit, onDelete, onChangeStatus, loading }) {
    const [sort, setSort] = useState({ key: "due_date", dir: "asc" });
    function toggleSort(key) {
        setSort((prev) => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" });
    }
    const sorted = useMemo(() => {
        const data = [...actividades];
        const mult = sort.dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const va = String(a?.[sort.key] || "").toLowerCase();
            const vb = String(b?.[sort.key] || "").toLowerCase();
            return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
        });
    }, [actividades, sort]);

    const SortIcon = ({ k }) => (
        <span className="opacity-60 ml-1">
            {sort.key === k ? (sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5 inline" /> : <ChevronDown className="h-3.5 w-3.5 inline" />) : <ArrowUpDown className="h-3.5 w-3.5 inline" />}
        </span>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-black/10 bg-[#131E5C] text-xs text-white">
                        <tr>
                            {[["title", "Título"], ["list_name", "Estado"], ["priority", "Prioridad"], ["start_date", "Fecha inicio"], ["due_date", "Fecha límite"]].map(([k, l]) => (
                                <th key={k} className="px-4 py-3"><button onClick={() => toggleSort(k)} className="inline-flex items-center font-bold text-xs">{l}<SortIcon k={k} /></button></th>
                            ))}
                            <th className="px-4 py-3 text-xs font-bold">Asignado a</th>
                            <th className="px-4 py-3 text-xs font-bold">Subtareas</th>
                            <th className="px-4 py-3 text-xs font-bold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 w-24 rounded bg-slate-100" /></td>)}</tr>
                        )) : sorted.length === 0
                            ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-black/40">Sin actividades con estos filtros.</td></tr>
                            : sorted.map((t) => {
                                const subs = Array.isArray(t.subtareas) ? t.subtareas : [];
                                const done = subs.filter((s) => s.done).length;
                                const vence = t.due_date ? new Date(String(t.due_date)) : null;
                                const vencida = vence && !isNaN(vence) && vence < new Date() && t.list_name !== "Hecho";
                                return (
                                    <tr key={t.id} className="hover:bg-slate-50/60 cursor-pointer" onDoubleClick={() => onEdit(t)}>
                                        <td className="px-4 py-3 font-bold text-[#131E5C] max-w-[220px]"><span className="line-clamp-2">{t.title || "—"}</span></td>
                                        <td className="px-4 py-3">
                                            <select value={t.list_id || ""} onChange={(e) => onChangeStatus(t, Number(e.target.value))}
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded-lg border border-black/10 bg-slate-50 px-2 py-1 text-[11px] font-bold outline-none focus:border-[#131E5C]">
                                                {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3"><PriorityBadge value={t.priority} /></td>
                                        <td className="px-4 py-3 text-xs text-black/50">{t.start_date ? String(t.start_date).slice(0, 10) : "—"}</td>
                                        <td className={cls("px-4 py-3 text-xs", vencida ? "text-rose-500 font-bold" : "text-black/50")}>
                                            {t.due_date ? String(t.due_date).slice(0, 10) : "—"}
                                            {vencida && <span className="ml-1.5 text-[9px] font-extrabold text-rose-500 bg-rose-50 border border-rose-200 rounded px-1">VENCIDA</span>}
                                        </td>
                                        <td className="px-4 py-3"><div className="flex items-center gap-1">{t.assigned && t.assigned.slice(0, 2).map((a, i) => <UserAvatar key={i} user={a} size="sm" />)}{t.assigned && t.assigned.length > 2 && <span className="text-[10px] text-black/40">+{t.assigned.length - 2}</span>}</div></td>
                                        <td className="px-4 py-3">{subs.length > 0
                                            ? <div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-black/5 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(done / subs.length) * 100}%` }} /></div><span className="text-xs text-black/40">{done}/{subs.length}</span></div>
                                            : <span className="text-xs text-black/30">—</span>}</td>
                                        <td className="px-4 py-3"><div className="flex items-center gap-1.5">
                                            <button onClick={() => onEdit(t)} className="rounded-lg border border-black/10 p-1.5 text-black/60 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => onDelete(t)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div></td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function GestorActividades() {
    const [teamId, setTeamId] = useState(() => { const v = localStorage.getItem("gestor_actividades_team_id"); return v ? Number(v) : null; });
    const [projectId, setProjectId] = useState(() => { const v = localStorage.getItem("gestor_actividades_project_id"); return v ? Number(v) : null; });
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("tabla");
    const [q, setQ] = useState("");
    const [filterList, setFilterList] = useState("Todos");
    const [filterPriority, setFilterPriority] = useState("Todos");
    const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
    const [deletingTask, setDeletingTask] = useState(false);

    useEffect(() => {
        try {
            const auth = localStorage.getItem("auth");
            if (auth) {
                const p = JSON.parse(auth);
                const u = p?.user || p?.usuario;
                if (u) setCurrentUser({ id: u.id_usuario || u.id, name: u.nombre_completo || u.nombre, email: u.correo || u.email });
            }
        } catch (e) { console.error(e); }
    }, []);

    const fetchTeams = useCallback(async () => {
        try {
            const data = await apiClickup.listTeams();
            const arr = Array.isArray(data) ? data : [];
            setTeams(arr);
            if (!teamId && arr[0]) {
                setTeamId(Number(arr[0].id));
                localStorage.setItem("gestor_actividades_team_id", String(arr[0].id));
            }
        } catch (e) { console.error(e); }
    }, [teamId]);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);

    useEffect(() => {
        if (!teamId) return;
        apiClickup.listProjects(teamId).then((data) => {
            const arr = Array.isArray(data) ? data : [];
            setProjects(arr);
            if (!projectId && arr[0]) {
                setProjectId(Number(arr[0].id));
                localStorage.setItem("gestor_actividades_project_id", String(arr[0].id));
            }
        }).catch(console.error);
    }, [teamId]);

    const loadBoard = useCallback(async () => {
        if (!teamId || !projectId) return;
        setLoading(true);
        try {
            const res = await apiClickup.getBoard(Number(teamId), Number(projectId));
            const rawLists = res?.lists || [];
            const tasksByList = res?.tasks_by_list || {};
            setLists(rawLists);
            setTasks(rawLists.flatMap((l) => (tasksByList[l.id] || []).map((t) => ({ ...t, list_name: l.name, list_id: l.id }))));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [teamId, projectId]);

    useEffect(() => { loadBoard(); }, [loadBoard]);

    const filtered = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return tasks.filter((t) => {
            const matchQ = !qn || (t.title || "").toLowerCase().includes(qn) || (t.descripcion || "").toLowerCase().includes(qn);
            const matchL = filterList === "Todos" || t.list_name === filterList;
            const matchP = filterPriority === "Todos" || t.priority === filterPriority;
            const matchMy = !showMyTasksOnly || !currentUser || (t.assigned && t.assigned.some((a) => Number(a.user_id) === Number(currentUser.id) || Number(a.id) === Number(currentUser.id)));
            return matchQ && matchL && matchP && matchMy;
        });
    }, [tasks, q, filterList, filterPriority, showMyTasksOnly, currentUser]);

    const totals = useMemo(() => {
        const doneList = lists.find((l) => l.name === "Hecho");
        const overdue = tasks.filter((t) => t.due_date && new Date(String(t.due_date)) < new Date() && t.list_name !== "Hecho").length;
        return {
            total: tasks.length,
            overdue,
            done: doneList ? tasks.filter((t) => t.list_id === doneList.id).length : 0,
        };
    }, [tasks, lists]);

    function openCreate(listIdDefault = null) {
        setEditingTask(listIdDefault ? { list: listIdDefault, id: null } : null);
        setModalOpen(true);
    }
    function openEdit(task) {
        setEditingTask(task);
        setModalOpen(true);
    }
    function handleDeleteTask(task) {
        setConfirmDeleteTask(task);
    }

    async function confirmTaskDelete() {
        if (!confirmDeleteTask) return;
        setDeletingTask(true);
        try {
            await apiClickup.deleteTask(Number(teamId), Number(confirmDeleteTask.id));
            setConfirmDeleteTask(null);
            await loadBoard();
        } catch (e) { alert(e.message); }
        finally { setDeletingTask(false); }
    }

    async function handleChangeStatus(tarea, newListId) {
        if (!teamId) return;
        try {
            await apiClickup.moveTask(Number(teamId), { task_id: Number(tarea.id), to_list_id: Number(newListId), to_order: 0 });
            await loadBoard();
        } catch (e) {
            console.error(e);
            alert(e.message || "Error al cambiar el estado");
        }
    }

    const viewTabs = [
        { id: "tabla", label: "Tabla", Icon: LayoutList },
        { id: "kanban", label: "Kanban", Icon: LayoutGrid },
    ];

    const currentProject = projects.find((p) => Number(p.id) === Number(projectId));

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-[#131E5C]" />
                        <h2 className="text-lg font-extrabold text-[#131E5C]">Gestor de Actividades</h2>
                    </div>
                    <p className="mt-0.5 text-xs text-black/50">Crear, asignar y dar seguimiento a las actividades {currentProject ? `· ${currentProject.name}` : ""}</p>
                </div>
                <button onClick={() => openCreate()} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm" style={{ backgroundColor: BRAND_BLUE }}>
                    <Plus className="h-4 w-4" />Nueva actividad
                </button>
            </div>

            <div className="flex flex-wrap gap-3 rounded-xl border border-black/10 bg-white p-3">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-extrabold text-black/50 shrink-0">Equipo</label>
                    <select value={teamId || ""} onChange={(e) => {
                        const newTeamId = Number(e.target.value);
                        setTeamId(newTeamId);
                        setProjectId(null);
                        localStorage.setItem("gestor_actividades_team_id", String(newTeamId));
                        localStorage.removeItem("gestor_actividades_project_id");
                        apiClickup.listProjects(newTeamId).then((data) => {
                            const arr = Array.isArray(data) ? data : [];
                            setProjects(arr);
                            if (arr[0]) {
                                setProjectId(Number(arr[0].id));
                                localStorage.setItem("gestor_actividades_project_id", String(arr[0].id));
                            }
                        }).catch(console.error);
                    }} className="rounded-xl border border-black/10 bg-slate-50 px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]">
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-extrabold text-black/50 shrink-0">Proyecto</label>
                    <select value={projectId || ""} onChange={(e) => { setProjectId(Number(e.target.value)); localStorage.setItem("gestor_actividades_project_id", e.target.value); }}
                        className="rounded-xl border border-black/10 bg-slate-50 px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]">
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="text-2xl font-black text-[#131E5C]">{totals.total}</div>
                    <div className="text-xs font-semibold text-black/50 mt-0.5">Total de actividades</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="text-2xl font-black text-rose-500">{totals.overdue}</div>
                    <div className="text-xs font-semibold text-black/50 mt-0.5">Vencidas</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="text-2xl font-black text-emerald-600">{totals.done}</div>
                    <div className="text-xs font-semibold text-black/50 mt-0.5">Completadas</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="text-2xl font-black text-sky-600">{filtered.length}</div>
                    <div className="text-xs font-semibold text-black/50 mt-0.5">Con filtros</div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#131E5C]" placeholder="Buscar actividades..." />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-[11px] font-extrabold text-black/40"><Filter className="h-3.5 w-3.5" />Filtros</div>
                <select value={filterList} onChange={(e) => setFilterList(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]">
                    <option value="Todos">Todos los estados</option>
                    {lists.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]">
                    <option value="Todos">Todas las prioridades</option>
                    {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button onClick={() => setShowMyTasksOnly(!showMyTasksOnly)} className={cls("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold transition", showMyTasksOnly ? "bg-[#131E5C] text-white" : "border border-[#131E5C] text-[#131E5C] hover:bg-slate-50")}>
                    <UsersRound className="h-3.5 w-3.5" />Mis actividades
                </button>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#131E5C]/20 bg-white">
                    {viewTabs.map(({ id, label, Icon }) => (
                        <button key={id} onClick={() => setView(id)} className={cls("inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold transition", view === id ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-slate-50")}>
                            <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {view === "kanban"
                ? <KanbanView actividades={filtered} lists={lists} onEdit={openEdit} onDelete={handleDeleteTask} loading={loading} />
                : <TablaView actividades={filtered} lists={lists} onEdit={openEdit} onDelete={handleDeleteTask} onChangeStatus={handleChangeStatus} loading={loading} />}

            <ActividadModal open={modalOpen} onClose={() => setModalOpen(false)} actividad={editingTask} lists={lists} teamId={teamId} onSaved={loadBoard} />
            <ConfirmDialog open={!!confirmDeleteTask} title="Eliminar actividad" message={`¿Seguro que deseas eliminar "${confirmDeleteTask?.title}"?`} onConfirm={confirmTaskDelete} onCancel={() => setConfirmDeleteTask(null)} loading={deletingTask} />
        </div>
    );
}