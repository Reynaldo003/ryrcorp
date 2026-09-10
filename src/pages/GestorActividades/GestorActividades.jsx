import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowUpDown, CalendarCheck, CalendarClock, CheckCircle2, ChevronDown, ChevronUp,
    Filter, LayoutList, Loader2, Pencil, Plus, Save, Search, Trash2, UsersRound, X
} from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";
import WeeklyPlanner from "./components/WeeklyPlanner";

const BRAND_BLUE = "#131E5C";

const PRIORITIES = [
    { value: "LOW", label: "Baja", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { value: "MEDIUM", label: "Media", color: "bg-sky-100 text-sky-700 border-sky-300" },
    { value: "HIGH", label: "Alta", color: "bg-amber-100 text-amber-700 border-amber-300" },
    { value: "URGENT", label: "Urgente", color: "bg-rose-100 text-rose-700 border-rose-300" },
];

function cls(...values) {
    return values.filter(Boolean).join(" ");
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function tieneValor(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
}

function toInputDateTime(value) {
    if (!value) return "";

    const text = String(value);

    const match = text.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/
    );

    if (match) {
        const [, year, month, day, hour = "09", minute = "00"] = match;
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    const numeric = Number(value);
    const date = !Number.isNaN(numeric) && numeric > 0
        ? new Date(numeric)
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toBackendDateTime(value) {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
}

function formatDateTime(value) {
    if (!value) return "—";

    const input = toInputDateTime(value);
    if (!input) return "—";

    const [date, time] = input.split("T");
    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year} ${time}`;
}

function tareaTieneProgramacion(task) {
    if (!task) return false;

    /*
     * Campos específicos de la agenda anterior.
     */
    if (tieneValor(task.scheduled_date)) return true;
    if (tieneValor(task.scheduled_start)) return true;

    /*
     * Campos que actualmente guarda el modal.
     */
    if (tieneValor(task.inicio)) return true;

    /*
     * start_date solo cuenta como programación si incluye hora.
     * Una fecha administrativa YYYY-MM-DD por sí sola no debería
     * sacar la tarea de la bandeja de pendientes.
     */
    if (tieneValor(task.start_date)) {
        const value = String(task.start_date);
        if (/T\d{2}:\d{2}/.test(value) || /\s\d{2}:\d{2}/.test(value)) {
            return true;
        }
    }

    return false;
}

function getTaskListId(task) {
    const value = task?.list_id ?? task?.list ?? task?.lista;
    if (!tieneValor(value)) return null;

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
}

function normalizarTaskAgenda(task, source, listas = []) {
    const listId = getTaskListId(task);

    const lista = listas.find(
        (item) => Number(item.id) === Number(listId)
    );

    return {
        ...task,
        list_id: listId,
        list_name: task?.list_name || lista?.name || "",
        __agenda_source: source,
    };
}

function deduplicarTasks(tasks = []) {
    const map = new Map();

    tasks.forEach((task, index) => {
        const key = tieneValor(task?.id)
            ? String(task.id)
            : `${task?.title || task?.titulo || "task"}-${index}`;

        map.set(key, task);
    });

    return Array.from(map.values());
}

function getAssigned(task) {
    if (Array.isArray(task?.assigned)) return task.assigned;
    if (Array.isArray(task?.asignados)) return task.asignados;
    return [];
}

function taskBelongsToUser(task, currentUser) {
    if (!currentUser?.id) return true;

    return getAssigned(task).some((user) => {
        const id = user?.user_id ?? user?.id_usuario ?? user?.id;
        return Number(id) === Number(currentUser.id);
    });
}

function PriorityBadge({ value }) {
    const priority = PRIORITIES.find((item) => item.value === value) || PRIORITIES[1];

    return (
        <span className={cls(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold",
            priority.color
        )}>
            {priority.label}
        </span>
    );
}

function UserAvatar({ user, size = "sm" }) {
    const initial = user?.name?.[0]
        || user?.nombre_completo?.[0]
        || user?.email?.[0]
        || "?";

    const sizeClass = size === "sm"
        ? "h-7 w-7 text-xs"
        : "h-9 w-9 text-sm";

    return (
        <div className={cls(
            "flex items-center justify-center rounded-full bg-[#131E5C]/10 font-black text-[#131E5C]",
            sizeClass
        )}>
            {initial.toUpperCase()}
        </div>
    );
}

function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    loading,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                <div className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50">
                            <Trash2 className="h-5 w-5 text-rose-600" />
                        </div>

                        <div>
                            <div className="text-base font-black text-slate-900">
                                {title}
                            </div>

                            <div className="mt-0.5 text-sm text-slate-500">
                                {message}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                            {loading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />
                            }
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActividadModal({
    open,
    onClose,
    actividad,
    lists,
    teamId,
    onSaved,
}) {
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

        const esPendiente = actividad?.__agenda_source === "pending";

        setTitle(
            actividad?.title
            || actividad?.titulo
            || ""
        );

        setListId(
            actividad?.list
                ? String(actividad.list)
                : actividad?.list_id
                    ? String(actividad.list_id)
                    : lists[0]?.id
                        ? String(lists[0].id)
                        : ""
        );

        setPriority(
            actividad?.priority
            || actividad?.prioridad
            || "MEDIUM"
        );

        /*
         * Si viene de la bandeja, NO usamos start_date/due_date
         * administrativos como horario de agenda.
         */
        if (esPendiente) {
            setStart("");
            setDue("");
        } else {
            setStart(toInputDateTime(
                actividad?.inicio
                || actividad?.scheduled_start_datetime
                || actividad?.start_date
            ));

            setDue(toInputDateTime(
                actividad?.vence
                || actividad?.scheduled_end_datetime
                || actividad?.due_date
            ));
        }

        setDescripcion(
            actividad?.description
            || actividad?.descripcion
            || ""
        );

        setEstrategia(
            actividad?.desarrollo_estrategia
            || actividad?.estrategia
            || ""
        );

        setSubtasks(
            Array.isArray(actividad?.subtareas)
                ? actividad.subtareas.map((subtask) => ({
                    id: subtask.id || Math.random(),
                    title: subtask.title || subtask.titulo || "",
                    done: !!subtask.done,
                }))
                : []
        );

        setAssignedUsers(
            getAssigned(actividad).map((assigned) => ({
                id: assigned.user_id || assigned.id_usuario || assigned.id,
                name: assigned.name || assigned.nombre_completo || assigned.nombre,
                email: assigned.email || assigned.correo,
            }))
        );

        setNewSub("");
        setAssigneeSearch("");
        setAssigneeResults([]);
    }, [open, actividad, lists]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!assigneeSearch.trim() || assigneeSearch.length < 2) {
                setAssigneeResults([]);
                return;
            }

            setSearchingAssignees(true);

            try {
                const response = await apiClickup.searchUsers(
                    assigneeSearch
                );

                setAssigneeResults(
                    Array.isArray(response)
                        ? response
                        : []
                );
            } catch {
                setAssigneeResults([]);
            } finally {
                setSearchingAssignees(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [assigneeSearch]);

    function addSubtask() {
        const text = newSub.trim();
        if (!text) return;

        setSubtasks((prev) => [
            ...prev,
            {
                id: Math.random(),
                title: text,
                done: false,
            },
        ]);

        setNewSub("");
    }

    async function handleSave() {
        if (!title.trim() || !listId || !teamId) return;

        if (start && due && new Date(due) <= new Date(start)) {
            alert(
                "La fecha y hora de finalización debe ser posterior al inicio."
            );
            return;
        }

        if ((start && !due) || (!start && due)) {
            alert(
                "Captura tanto la fecha de inicio como la fecha de fin, o deja ambas vacías para mantener la tarea pendiente."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                lista: Number(listId),
                titulo: title.trim(),
                descripcion: descripcion.trim(),
                desarrollo_estrategia: estrategia.trim(),
                prioridad: priority,
                inicio: toBackendDateTime(start),
                vence: toBackendDateTime(due),
                subtareas: subtasks.map((subtask) => ({
                    titulo: subtask.title,
                    done: !!subtask.done,
                })),
                asignados_ids: assignedUsers.map((user) => user.id),
            };

            if (actividad?.id) {
                await apiClickup.updateTask(
                    Number(teamId),
                    Number(actividad.id),
                    payload
                );
            } else {
                await apiClickup.createTask(
                    Number(teamId),
                    payload
                );
            }

            await onSaved?.();
            onClose();
        } catch (error) {
            console.error(
                "Error guardando actividad:",
                error
            );

            alert(
                error.message
                || "Error al guardar la actividad."
            );
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    const inputBase = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[15px] font-medium outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10";
    const doneCount = subtasks.filter((subtask) => subtask.done).length;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl">
                <div className="flex shrink-0 items-center justify-between bg-[#131E5C] px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <CalendarCheck className="h-5 w-5 text-white/80" />

                        <h3 className="text-lg font-black tracking-tight text-white">
                            {actividad?.id
                                ? "Editar actividad"
                                : "Nueva actividad"
                            }
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 text-white/80 hover:bg-white/10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <div>
                        <label className="text-sm font-extrabold text-slate-600">
                            Título *
                        </label>

                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className={cls(inputBase, "mt-1")}
                            placeholder="Nombre de la actividad"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-extrabold text-slate-600">
                                Estado
                            </label>

                            <select
                                value={listId}
                                onChange={(event) => setListId(event.target.value)}
                                className={cls(inputBase, "mt-1 font-bold")}
                            >
                                {lists.map((list) => (
                                    <option key={list.id} value={list.id}>
                                        {list.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-extrabold text-slate-600">
                                Prioridad
                            </label>

                            <select
                                value={priority}
                                onChange={(event) => setPriority(event.target.value)}
                                className={cls(inputBase, "mt-1 font-bold")}
                            >
                                {PRIORITIES.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                        <div className="mb-3">
                            <div className="text-sm font-black text-[#131E5C]">
                                Programación
                            </div>

                            <div className="text-xs font-medium text-slate-500">
                                Déjalas vacías para mantener la actividad en la bandeja de pendientes.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-extrabold text-slate-600">
                                    Inicio
                                </label>

                                <input
                                    type="datetime-local"
                                    value={start}
                                    onChange={(event) => setStart(event.target.value)}
                                    className={cls(inputBase, "mt-1")}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-extrabold text-slate-600">
                                    Fin
                                </label>

                                <input
                                    type="datetime-local"
                                    value={due}
                                    onChange={(event) => setDue(event.target.value)}
                                    className={cls(inputBase, "mt-1")}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-extrabold text-slate-600">
                            Descripción
                        </label>

                        <textarea
                            value={descripcion}
                            onChange={(event) => setDescripcion(event.target.value)}
                            rows={3}
                            className={cls(inputBase, "mt-1 min-h-[90px]")}
                            placeholder="Detalle de la actividad..."
                        />
                    </div>

                    <div>
                        <label className="text-sm font-extrabold text-slate-600">
                            Método y estrategia
                        </label>

                        <textarea
                            value={estrategia}
                            onChange={(event) => setEstrategia(event.target.value)}
                            rows={3}
                            className={cls(inputBase, "mt-1 min-h-[90px]")}
                            placeholder="¿Cómo se va a resolver?"
                        />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-black text-[#131E5C]">
                                Subtareas

                                {subtasks.length > 0 && (
                                    <span className="ml-2 rounded-full bg-[#131E5C]/10 px-2 py-1 text-xs">
                                        {doneCount}/{subtasks.length}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mb-3 flex gap-2">
                            <input
                                value={newSub}
                                onChange={(event) => setNewSub(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addSubtask();
                                    }
                                }}
                                className={cls(inputBase, "flex-1")}
                                placeholder="Nueva subtarea..."
                            />

                            <button
                                type="button"
                                onClick={addSubtask}
                                className="flex items-center justify-center rounded-xl bg-[#131E5C] px-4 text-white"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {subtasks.map((subtask) => (
                                <div
                                    key={subtask.id}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubtasks((prev) => (
                                                prev.map((item) => (
                                                    item.id === subtask.id
                                                        ? { ...item, done: !item.done }
                                                        : item
                                                ))
                                            ));
                                        }}
                                        className={cls(
                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                            subtask.done
                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                : "border-slate-300"
                                        )}
                                    >
                                        {subtask.done && (
                                            <CheckCircle2 className="h-3 w-3" />
                                        )}
                                    </button>

                                    <span className={cls(
                                        "min-w-0 flex-1 truncate text-sm font-medium",
                                        subtask.done && "text-slate-400 line-through"
                                    )}>
                                        {subtask.title}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubtasks((prev) => (
                                                prev.filter((item) => item.id !== subtask.id)
                                            ));
                                        }}
                                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#131E5C]">
                            <UsersRound className="h-4 w-4" />
                            Asignado a
                        </div>

                        {assignedUsers.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                {assignedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-2 rounded-full bg-[#131E5C]/10 px-3 py-1.5"
                                    >
                                        <UserAvatar user={user} />

                                        <span className="text-sm font-bold text-[#131E5C]">
                                            {user.name}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAssignedUsers((prev) => (
                                                    prev.filter((item) => item.id !== user.id)
                                                ));
                                            }}
                                            className="text-slate-400 hover:text-rose-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            <input
                                value={assigneeSearch}
                                onChange={(event) => setAssigneeSearch(event.target.value)}
                                className={cls(inputBase, "pr-9")}
                                placeholder="Buscar usuario..."
                            />

                            {searchingAssignees && (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                            )}
                        </div>

                        {assigneeResults.length > 0 && (
                            <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                                {assigneeResults.map((user) => {
                                    const userId = user.id || user.user_id || user.id_usuario;

                                    const alreadyAssigned = assignedUsers.some(
                                        (assigned) => Number(assigned.id) === Number(userId)
                                    );

                                    return (
                                        <button
                                            key={userId}
                                            type="button"
                                            disabled={alreadyAssigned}
                                            onClick={() => {
                                                if (!alreadyAssigned) {
                                                    setAssignedUsers((prev) => [
                                                        ...prev,
                                                        {
                                                            id: userId,
                                                            name: user.name || user.nombre_completo || user.nombre,
                                                            email: user.email || user.correo,
                                                        },
                                                    ]);
                                                }

                                                setAssigneeSearch("");
                                                setAssigneeResults([]);
                                            }}
                                            className={cls(
                                                "w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50",
                                                alreadyAssigned && "opacity-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={user} />

                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-bold text-[#131E5C]">
                                                        {user.name || user.nombre_completo || user.nombre}
                                                    </div>

                                                    <div className="truncate text-xs text-slate-400">
                                                        {user.email || user.correo}
                                                    </div>
                                                </div>

                                                {alreadyAssigned && (
                                                    <span className="ml-auto text-xs font-bold text-emerald-600">
                                                        Asignado
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim() || !listId}
                        className="flex items-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                    >
                        {saving
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Save className="h-4 w-4" />
                        }

                        {saving
                            ? "Guardando..."
                            : actividad?.id
                                ? "Guardar cambios"
                                : "Crear actividad"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

function TablaView({
    actividades,
    lists,
    onEdit,
    onDelete,
    onChangeStatus,
    loading,
}) {
    const [sort, setSort] = useState({
        key: "due_date",
        dir: "asc",
    });

    function toggleSort(key) {
        setSort((prev) => (
            prev.key !== key
                ? { key, dir: "asc" }
                : {
                    key,
                    dir: prev.dir === "asc"
                        ? "desc"
                        : "asc",
                }
        ));
    }

    const sorted = useMemo(() => {
        const data = [...actividades];
        const multiplier = sort.dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            const aValue = String(a?.[sort.key] || "").toLowerCase();
            const bValue = String(b?.[sort.key] || "").toLowerCase();

            if (aValue < bValue) return -1 * multiplier;
            if (aValue > bValue) return multiplier;

            return 0;
        });
    }, [actividades, sort]);

    function SortIcon({ column }) {
        if (sort.key !== column) {
            return (
                <ArrowUpDown className="ml-1 inline h-4 w-4 opacity-50" />
            );
        }

        return sort.dir === "asc"
            ? <ChevronUp className="ml-1 inline h-4 w-4" />
            : <ChevronDown className="ml-1 inline h-4 w-4" />;
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[15px]">
                    <thead className="border-b border-black/10 bg-[#131E5C] text-white">
                        <tr>
                            {[
                                ["title", "Actividad"],
                                ["list_name", "Estado"],
                                ["priority", "Prioridad"],
                                ["start_date", "Inicio"],
                                ["due_date", "Fin"],
                            ].map(([key, label]) => (
                                <th
                                    key={key}
                                    className="px-4 py-3.5"
                                >
                                    <button
                                        onClick={() => toggleSort(key)}
                                        className="inline-flex items-center text-sm font-extrabold"
                                    >
                                        {label}
                                        <SortIcon column={key} />
                                    </button>
                                </th>
                            ))}

                            <th className="px-4 py-3.5 text-sm font-extrabold">
                                Asignado
                            </th>

                            <th className="px-4 py-3.5 text-sm font-extrabold">
                                Subtareas
                            </th>

                            <th className="px-4 py-3.5 text-sm font-extrabold">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {loading
                            ? Array.from({ length: 6 }).map((_, row) => (
                                <tr key={row} className="animate-pulse">
                                    {Array.from({ length: 8 }).map((__, column) => (
                                        <td
                                            key={column}
                                            className="px-4 py-4"
                                        >
                                            <div className="h-4 w-24 rounded bg-slate-100" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : sorted.length === 0
                                ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-12 text-center text-base font-medium text-slate-400"
                                        >
                                            Sin actividades con estos filtros.
                                        </td>
                                    </tr>
                                )
                                : sorted.map((task) => {
                                    const subtasks = Array.isArray(task.subtareas)
                                        ? task.subtareas
                                        : [];

                                    const done = subtasks.filter(
                                        (subtask) => subtask.done
                                    ).length;

                                    return (
                                        <tr
                                            key={task.id}
                                            className="cursor-pointer hover:bg-slate-50"
                                            onDoubleClick={() => onEdit(task)}
                                        >
                                            <td className="max-w-[300px] px-4 py-3.5 font-extrabold text-[#131E5C]">
                                                <span className="line-clamp-2">
                                                    {task.title || task.titulo || "—"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={task.list_id || ""}
                                                    onChange={(event) => {
                                                        onChangeStatus(
                                                            task,
                                                            Number(event.target.value)
                                                        );
                                                    }}
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]"
                                                >
                                                    {lists.map((list) => (
                                                        <option
                                                            key={list.id}
                                                            value={list.id}
                                                        >
                                                            {list.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <PriorityBadge
                                                    value={task.priority || task.prioridad}
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-500">
                                                {formatDateTime(
                                                    task.inicio
                                                    || task.start_date
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-500">
                                                {formatDateTime(
                                                    task.vence
                                                    || task.due_date
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    {getAssigned(task)
                                                        .slice(0, 3)
                                                        .map((assigned, index) => (
                                                            <UserAvatar
                                                                key={index}
                                                                user={assigned}
                                                            />
                                                        ))}

                                                    {getAssigned(task).length > 3 && (
                                                        <span className="text-xs font-bold text-slate-400">
                                                            +{getAssigned(task).length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {subtasks.length > 0
                                                    ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-emerald-500"
                                                                    style={{
                                                                        width: `${(done / subtasks.length) * 100}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <span className="text-sm font-bold text-slate-400">
                                                                {done}/{subtasks.length}
                                                            </span>
                                                        </div>
                                                    )
                                                    : (
                                                        <span className="text-slate-300">
                                                            —
                                                        </span>
                                                    )
                                                }
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => onEdit(task)}
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => onDelete(task)}
                                                        className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function GestorActividades() {
    const [teamId, setTeamId] = useState(() => {
        const value = localStorage.getItem(
            "gestor_actividades_team_id"
        );

        return value
            ? Number(value)
            : null;
    });

    const [projectId, setProjectId] = useState(() => {
        const value = localStorage.getItem(
            "gestor_actividades_project_id"
        );

        return value
            ? Number(value)
            : null;
    });

    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("agenda");

    /*
     * IMPORTANTE:
     * ahora programadas y pendientes son estados separados.
     */
    const [agendaTasks, setAgendaTasks] = useState([]);
    const [agendaPendingTasks, setAgendaPendingTasks] = useState([]);
    const [agendaLists, setAgendaLists] = useState([]);
    const [agendaLoading, setAgendaLoading] = useState(false);
    const [agendaError, setAgendaError] = useState(null);
    const [agendaRange, setAgendaRange] = useState(null);

    const agendaFetchRef = useRef(0);

    const [q, setQ] = useState("");
    const [filterList, setFilterList] = useState("Todos");
    const [filterPriority, setFilterPriority] = useState("Todos");

    /*
     * Lo dejamos apagado por defecto.
     * Antes podía ocultar todas las pendientes si no estaban asignadas.
     */
    const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
    const [deletingTask, setDeletingTask] = useState(false);

    useEffect(() => {
        try {
            const auth = localStorage.getItem("auth");
            if (!auth) return;

            const parsed = JSON.parse(auth);
            const user = parsed?.user || parsed?.usuario;

            if (!user) return;

            setCurrentUser({
                id: user.id_usuario || user.id,
                name: user.nombre_completo || user.nombre,
                email: user.correo || user.email,
            });
        } catch (error) {
            console.error(
                "No se pudo obtener el usuario actual:",
                error
            );
        }
    }, []);

    useEffect(() => {
        async function cargarTeams() {
            try {
                const data = await apiClickup.listTeams();
                const array = Array.isArray(data) ? data : [];

                setTeams(array);

                if (!array.length) return;

                const existeActual = array.some(
                    (team) => Number(team.id) === Number(teamId)
                );

                if (!teamId || !existeActual) {
                    const firstId = Number(array[0].id);

                    setTeamId(firstId);

                    localStorage.setItem(
                        "gestor_actividades_team_id",
                        String(firstId)
                    );
                }
            } catch (error) {
                console.error(
                    "Error cargando equipos:",
                    error
                );
            }
        }

        cargarTeams();
    }, []);

    useEffect(() => {
        if (!teamId) return;

        let active = true;

        async function cargarProjects() {
            try {
                const data = await apiClickup.listProjects(
                    Number(teamId)
                );

                if (!active) return;

                const array = Array.isArray(data)
                    ? data
                    : [];

                setProjects(array);

                if (!array.length) {
                    setProjectId(null);
                    return;
                }

                const existeActual = array.some(
                    (project) => Number(project.id) === Number(projectId)
                );

                if (!projectId || !existeActual) {
                    const firstId = Number(array[0].id);

                    setProjectId(firstId);

                    localStorage.setItem(
                        "gestor_actividades_project_id",
                        String(firstId)
                    );
                }
            } catch (error) {
                console.error(
                    "Error cargando proyectos:",
                    error
                );
            }
        }

        cargarProjects();

        return () => {
            active = false;
        };
    }, [teamId]);

    const loadBoard = useCallback(async () => {
        if (!teamId || !projectId) return;

        setLoading(true);

        try {
            const response = await apiClickup.getBoard(
                Number(teamId),
                Number(projectId)
            );

            const rawLists = Array.isArray(response?.lists)
                ? response.lists
                : [];

            const tasksByList = response?.tasks_by_list || {};

            const normalizedTasks = rawLists.flatMap((list) => (
                (Array.isArray(tasksByList[list.id])
                    ? tasksByList[list.id]
                    : []
                ).map((task) => ({
                    ...task,
                    list_name: task?.list_name || list.name,
                    list_id: task?.list_id || list.id,
                }))
            ));

            setLists(rawLists);
            setTasks(normalizedTasks);
        } catch (error) {
            console.error(
                "Error cargando board:",
                error
            );
        } finally {
            setLoading(false);
        }
    }, [teamId, projectId]);

    useEffect(() => {
        loadBoard();
    }, [loadBoard]);

    const loadAgenda = useCallback(async (startStr, endStr) => {
        if (!teamId || !projectId) return;

        const seq = ++agendaFetchRef.current;

        setAgendaLoading(true);
        setAgendaError(null);

        try {
            const response = await apiClickup.getAgenda(
                Number(teamId),
                Number(projectId),
                {
                    start: startStr,
                    end: endStr,
                }
            );

            if (seq !== agendaFetchRef.current) return;

            const responseLists = Array.isArray(response?.lists)
                ? response.lists
                : [];

            const effectiveLists = responseLists.length
                ? responseLists
                : lists;

            /*
             * Soportamos varios nombres por si el backend usa
             * otro contrato.
             */
            const rawAgendaTasks = Array.isArray(response?.tasks)
                ? response.tasks
                : Array.isArray(response?.actividades)
                    ? response.actividades
                    : [];

            const rawPendientes = Array.isArray(response?.pendientes)
                ? response.pendientes
                : Array.isArray(response?.pending)
                    ? response.pending
                    : Array.isArray(response?.unscheduled)
                        ? response.unscheduled
                        : Array.isArray(response?.sin_programar)
                            ? response.sin_programar
                            : [];

            /*
             * El endpoint puede mandar la misma tarea en tasks y
             * pendientes. Pendientes tiene prioridad.
             */
            const explicitPendingIds = new Set(
                rawPendientes
                    .filter((task) => tieneValor(task?.id))
                    .map((task) => String(task.id))
            );

            /*
             * También detectamos tareas dentro de response.tasks
             * que no tengan horario real.
             */
            const inferredPendingFromResponse = rawAgendaTasks.filter((task) => {
                if (
                    tieneValor(task?.id)
                    && explicitPendingIds.has(String(task.id))
                ) {
                    return false;
                }

                return !tareaTieneProgramacion(task);
            });

            /*
             * FALLBACK IMPORTANTE:
             *
             * Si /agenda no devuelve pendientes, usamos el board.
             * Así la bandeja sigue funcionando aunque el endpoint
             * de agenda solo devuelva tareas programadas.
             */
            const boardPending = tasks.filter(
                (task) => !tareaTieneProgramacion(task)
            );

            const pendingCandidates = deduplicarTasks([
                ...rawPendientes.map((task) => (
                    normalizarTaskAgenda(
                        task,
                        "pending",
                        effectiveLists
                    )
                )),
                ...inferredPendingFromResponse.map((task) => (
                    normalizarTaskAgenda(
                        task,
                        "pending",
                        effectiveLists
                    )
                )),
                ...boardPending.map((task) => (
                    normalizarTaskAgenda(
                        task,
                        "pending",
                        effectiveLists
                    )
                )),
            ]);

            const pendingIds = new Set(
                pendingCandidates
                    .filter((task) => tieneValor(task?.id))
                    .map((task) => String(task.id))
            );

            const scheduledCandidates = rawAgendaTasks
                .filter((task) => {
                    if (
                        tieneValor(task?.id)
                        && pendingIds.has(String(task.id))
                    ) {
                        return false;
                    }

                    return tareaTieneProgramacion(task);
                })
                .map((task) => (
                    normalizarTaskAgenda(
                        task,
                        "scheduled",
                        effectiveLists
                    )
                ));

            setAgendaLists(effectiveLists);
            setAgendaTasks(
                deduplicarTasks(scheduledCandidates)
            );
            setAgendaPendingTasks(
                pendingCandidates
            );

            /*
             * Útil mientras validas el endpoint.
             * Puedes quitarlo cuando confirmes que todo funciona.
             */
            console.log("[Agenda] respuesta:", {
                tasksEndpoint: rawAgendaTasks.length,
                pendientesEndpoint: rawPendientes.length,
                pendientesInferidas: inferredPendingFromResponse.length,
                pendientesBoard: boardPending.length,
                programadasFinales: scheduledCandidates.length,
                pendientesFinales: pendingCandidates.length,
            });
        } catch (error) {
            console.error(
                "Error cargando agenda:",
                error
            );

            if (seq !== agendaFetchRef.current) return;

            setAgendaError(
                error.message
                || "No se pudo cargar la agenda."
            );
        } finally {
            if (seq === agendaFetchRef.current) {
                setAgendaLoading(false);
            }
        }
    }, [
        teamId,
        projectId,
        lists,
        tasks,
    ]);

    useEffect(() => {
        if (!teamId || !projectId || !agendaRange) return;

        loadAgenda(
            agendaRange.start,
            agendaRange.end
        );
    }, [
        teamId,
        projectId,
        agendaRange,
        loadAgenda,
    ]);

    const reloadAgenda = useCallback(async () => {
        if (!agendaRange) return;

        await loadAgenda(
            agendaRange.start,
            agendaRange.end
        );
    }, [
        agendaRange,
        loadAgenda,
    ]);

    const onAgendaRangeChange = useCallback((start, end) => {
        setAgendaRange((prev) => {
            if (
                prev
                && prev.start === start
                && prev.end === end
            ) {
                return prev;
            }

            return {
                start,
                end,
            };
        });
    }, []);

    const matchCommonFilters = useCallback((task) => {
        const search = q.trim().toLowerCase();

        const title = String(
            task?.title
            || task?.titulo
            || ""
        ).toLowerCase();

        const description = String(
            task?.descripcion
            || task?.description
            || ""
        ).toLowerCase();

        const listName = task?.list_name
            || agendaLists.find(
                (list) => Number(list.id) === Number(getTaskListId(task))
            )?.name
            || "";

        const priority = task?.priority
            || task?.prioridad
            || "";

        const matchSearch = !search
            || title.includes(search)
            || description.includes(search);

        const matchList = filterList === "Todos"
            || listName === filterList;

        const matchPriority = filterPriority === "Todos"
            || priority === filterPriority;

        return (
            matchSearch
            && matchList
            && matchPriority
        );
    }, [
        q,
        filterList,
        filterPriority,
        agendaLists,
    ]);

    const filtered = useMemo(() => {
        return tasks.filter((task) => {
            if (!matchCommonFilters(task)) return false;

            if (
                showMyTasksOnly
                && currentUser
                && !taskBelongsToUser(task, currentUser)
            ) {
                return false;
            }

            return true;
        });
    }, [
        tasks,
        matchCommonFilters,
        showMyTasksOnly,
        currentUser,
    ]);

    const filteredAgenda = useMemo(() => {
        return agendaTasks.filter((task) => {
            if (!matchCommonFilters(task)) return false;

            if (
                showMyTasksOnly
                && currentUser
                && !taskBelongsToUser(task, currentUser)
            ) {
                return false;
            }

            return true;
        });
    }, [
        agendaTasks,
        matchCommonFilters,
        showMyTasksOnly,
        currentUser,
    ]);

    const filteredAgendaPending = useMemo(() => {
        return agendaPendingTasks.filter((task) => {
            if (!matchCommonFilters(task)) return false;

            if (!showMyTasksOnly || !currentUser) {
                return true;
            }

            const assigned = getAssigned(task);

            /*
             * Una pendiente sin asignar aparece incluso en
             * "Mis actividades", porque forma parte del inbox
             * disponible para tomar trabajo.
             */
            if (!assigned.length) return true;

            return taskBelongsToUser(
                task,
                currentUser
            );
        });
    }, [
        agendaPendingTasks,
        matchCommonFilters,
        showMyTasksOnly,
        currentUser,
    ]);

    function openCreate(defaultValues = null) {
        setEditingTask(
            defaultValues || null
        );

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
            await apiClickup.deleteTask(
                Number(teamId),
                Number(confirmDeleteTask.id)
            );

            setConfirmDeleteTask(null);

            await loadBoard();
            await reloadAgenda();
        } catch (error) {
            alert(
                error.message
                || "Error al eliminar la actividad."
            );
        } finally {
            setDeletingTask(false);
        }
    }

    async function handleChangeStatus(task, newListId) {
        if (!teamId || !task?.id) return;

        try {
            await apiClickup.moveTask(
                Number(teamId),
                {
                    task_id: Number(task.id),
                    to_list_id: Number(newListId),
                    to_order: 0,
                }
            );

            await loadBoard();
            await reloadAgenda();
        } catch (error) {
            console.error(
                "Error cambiando estado:",
                error
            );

            alert(
                error.message
                || "Error al cambiar el estado."
            );
        }
    }

    async function handleAgendaMove(task, changes) {
        if (!teamId || !task?.id) return;

        try {
            await apiClickup.updateTask(
                Number(teamId),
                Number(task.id),
                changes
            );

            await loadBoard();
            await reloadAgenda();
        } catch (error) {
            console.error(
                "Error moviendo actividad:",
                error
            );

            alert(
                error.message
                || "No se pudo actualizar la actividad."
            );

            throw error;
        }
    }

    function handleTeamChange(event) {
        const newTeamId = Number(
            event.target.value
        );

        setTeamId(newTeamId);
        setProjectId(null);

        setTasks([]);
        setAgendaTasks([]);
        setAgendaPendingTasks([]);
        setLists([]);
        setAgendaLists([]);

        localStorage.setItem(
            "gestor_actividades_team_id",
            String(newTeamId)
        );

        localStorage.removeItem(
            "gestor_actividades_project_id"
        );
    }

    function handleProjectChange(event) {
        const newProjectId = Number(
            event.target.value
        );

        setProjectId(newProjectId);
        setAgendaTasks([]);
        setAgendaPendingTasks([]);

        localStorage.setItem(
            "gestor_actividades_project_id",
            String(newProjectId)
        );
    }

    const currentProject = projects.find(
        (project) => Number(project.id) === Number(projectId)
    );

    const effectiveLists = agendaLists.length
        ? agendaLists
        : lists;

    const viewTabs = [
        {
            id: "agenda",
            label: "Agenda",
            Icon: CalendarClock,
        },
        {
            id: "tabla",
            label: "Tabla",
            Icon: LayoutList,
        },
    ];

    return (
        <div className="w-full space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <CalendarCheck className="h-7 w-7 text-[#131E5C]" />

                        <h1 className="text-2xl font-black tracking-tight text-[#131E5C]">
                            Gestión de actividades
                        </h1>
                    </div>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Planeación y seguimiento del trabajo del equipo
                        {currentProject
                            ? ` · ${currentProject.name}`
                            : ""
                        }
                    </p>
                </div>

                <button
                    onClick={() => openCreate()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-[15px] font-extrabold text-white shadow-sm hover:bg-[#192873]"
                >
                    <Plus className="h-5 w-5" />
                    Nueva actividad
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="shrink-0 text-sm font-extrabold text-slate-500">
                        Equipo
                    </label>

                    <select
                        value={teamId || ""}
                        onChange={handleTeamChange}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                    >
                        {teams.map((team) => (
                            <option
                                key={team.id}
                                value={team.id}
                            >
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="shrink-0 text-sm font-extrabold text-slate-500">
                        Proyecto
                    </label>

                    <select
                        value={projectId || ""}
                        onChange={handleProjectChange}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                    >
                        {projects.map((project) => (
                            <option
                                key={project.id}
                                value={project.id}
                            >
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ml-auto inline-flex overflow-hidden rounded-xl border border-[#131E5C]/20 bg-white">
                    {viewTabs.map(({
                        id,
                        label,
                        Icon,
                    }) => (
                        <button
                            key={id}
                            onClick={() => setView(id)}
                            className={cls(
                                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold transition",
                                view === id
                                    ? "bg-[#131E5C] text-white"
                                    : "text-[#131E5C] hover:bg-slate-50"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[230px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[15px] font-medium outline-none focus:border-[#131E5C]"
                        placeholder="Buscar actividades..."
                    />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-extrabold text-slate-400">
                    <Filter className="h-4 w-4" />
                    Filtros
                </div>

                <select
                    value={filterList}
                    onChange={(event) => setFilterList(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[#131E5C]"
                >
                    <option value="Todos">
                        Todos los estados
                    </option>

                    {lists.map((list) => (
                        <option
                            key={list.id}
                            value={list.name}
                        >
                            {list.name}
                        </option>
                    ))}
                </select>

                <select
                    value={filterPriority}
                    onChange={(event) => setFilterPriority(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-[#131E5C]"
                >
                    <option value="Todos">
                        Todas las prioridades
                    </option>

                    {PRIORITIES.map((priority) => (
                        <option
                            key={priority.value}
                            value={priority.value}
                        >
                            {priority.label}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => {
                        setShowMyTasksOnly((prev) => !prev);
                    }}
                    className={cls(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition",
                        showMyTasksOnly
                            ? "bg-[#131E5C] text-white"
                            : "border border-[#131E5C] bg-white text-[#131E5C]"
                    )}
                >
                    <UsersRound className="h-4 w-4" />
                    Mis actividades
                </button>
            </div>

            {view === "agenda"
                ? (
                    <WeeklyPlanner
                        tasks={filteredAgenda}
                        pendingTasks={filteredAgendaPending}
                        lists={effectiveLists}
                        loading={agendaLoading}
                        error={agendaError}
                        onWeekRange={onAgendaRangeChange}
                        onRetry={reloadAgenda}
                        onAddTask={(data) => {
                            openCreate({
                                id: null,
                                list: data?.list_id || lists[0]?.id,
                                title: "",
                                inicio: data?.inicio || null,
                                vence: data?.vence || null,
                                start_date: data?.start_date || null,
                                due_date: data?.due_date || null,
                            });
                        }}
                        onEdit={openEdit}
                        onDelete={handleDeleteTask}
                        onMoveTask={handleAgendaMove}
                        onChangeStatus={handleChangeStatus}
                    />
                )
                : (
                    <TablaView
                        actividades={filtered}
                        lists={lists}
                        onEdit={openEdit}
                        onDelete={handleDeleteTask}
                        onChangeStatus={handleChangeStatus}
                        loading={loading}
                    />
                )
            }

            <ActividadModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingTask(null);
                }}
                actividad={editingTask}
                lists={lists}
                teamId={teamId}
                onSaved={async () => {
                    await loadBoard();
                    await reloadAgenda();
                }}
            />

            <ConfirmDialog
                open={!!confirmDeleteTask}
                title="Eliminar actividad"
                message={`¿Seguro que deseas eliminar "${confirmDeleteTask?.title || confirmDeleteTask?.titulo || ""}"?`}
                onConfirm={confirmTaskDelete}
                onCancel={() => setConfirmDeleteTask(null)}
                loading={deletingTask}
            />
        </div>
    );
}