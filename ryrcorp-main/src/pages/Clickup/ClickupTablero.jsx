//src/pages/Clickup/ClickupTablero.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiClickup } from "../../lib/apiClickup";
import { useActiveTeam } from "./useActiveTeam";
import ClickupUserAutocomplete from "./ClickupUserAutocomplete";
import {
    RefreshCcw,
    Search,
    Filter,
    AlertTriangle,
    LayoutGrid,
    Table2,
    GanttChartSquare,
    Menu,
    CheckCircle2,
    Plus,
} from "lucide-react";

import ClickupKanbanView from "./ClickupKanbanView";
import ClickupTableView from "./ClickupTableView";
import ClickupTimelineView from "./ClickupTimeLine";
import ClickupSidebarTree from "./ClickupSideBarTree";

import {
    BRAND_BLUE,
    Card,
    Modal,
    Pill,
    ViewSwitch,
    cls,
    flattenTasks,
    normalizeText,
    useMediaQuery,
} from "./ClickupUI";

const COLOR_PRESETS = [
    "#131E5C",
    "#0f766e",
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ea580c",
    "#ef4444",
    "#7c3aed",
    "#64748b",
];

export default function ClickupTablero() {
    const { teamId: hookTeamId } = useActiveTeam();

    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

    const [sidebarCollapsed, setSidebarCollapsed] = useState(
        () => localStorage.getItem("clickup_sidebar_collapsed") === "1"
    );

    const [view, setView] = useState(() => localStorage.getItem("clickup_view") || "kanban");

    const [openEvidenceModal, setOpenEvidenceModal] = useState(false);
    const [evidenceTask, setEvidenceTask] = useState(null);
    const [evidenceType, setEvidenceType] = useState("BUG");
    const [evidenceComment, setEvidenceComment] = useState("");
    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [evidenceDetail, setEvidenceDetail] = useState(null);
    const [loadingEvidence, setLoadingEvidence] = useState(false);

    async function openEvidenceModalFor(task, defaultType = "BUG") {
        if (!teamId || !task?.id) return;

        setEvidenceTask(task);
        setEvidenceType(defaultType);
        setEvidenceComment("");
        setEvidenceFiles([]);
        setOpenEvidenceModal(true);
        setLoadingEvidence(true);

        try {
            const detail = await apiClickup.getTaskDetail(Number(teamId), Number(task.id));
            setEvidenceDetail(detail);
        } catch (e) {
            alert(e.message);
        } finally {
            setLoadingEvidence(false);
        }
    }

    async function handleUploadEvidence() {
        if (!teamId || !evidenceTask?.id || !evidenceFiles.length) return;

        setSaving(true);
        try {
            await apiClickup.uploadTaskEvidence(Number(teamId), Number(evidenceTask.id), {
                tipo: evidenceType,
                comentario: evidenceComment,
                archivos: evidenceFiles,
            });

            const detail = await apiClickup.getTaskDetail(Number(teamId), Number(evidenceTask.id));
            setEvidenceDetail(detail);

            setEvidenceComment("");
            setEvidenceFiles([]);

            await loadBoard();
            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));
            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    const [teamId, setTeamId] = useState(() => {
        const v = localStorage.getItem("clickup_team_id");
        if (v) return Number(v);
        return hookTeamId ? Number(hookTeamId) : null;
    });

    const [projectId, setProjectId] = useState(() => {
        const v = localStorage.getItem("clickup_project_id");
        return v ? Number(v) : null;
    });

    const [teams, setTeams] = useState([]);
    const [projectsByTeam, setProjectsByTeam] = useState({});
    const [peopleByTeam, setPeopleByTeam] = useState({});
    const [loadingSidebar, setLoadingSidebar] = useState(true);

    const [openCreateTeam, setOpenCreateTeam] = useState(false);
    const [openCreateProject, setOpenCreateProject] = useState(false);
    const [openInvite, setOpenInvite] = useState(false);
    const [openCreateTask, setOpenCreateTask] = useState(false);
    const [openEditTask, setOpenEditTask] = useState(false);

    const [teamName, setTeamName] = useState("");
    const [projectName, setProjectName] = useState("");
    const [projectColor, setProjectColor] = useState(COLOR_PRESETS[0]);
    const [createProjectTeamId, setCreateProjectTeamId] = useState(null);

    const [inviteSelectedUser, setInviteSelectedUser] = useState(null);
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [inviteTeamId, setInviteTeamId] = useState(null);

    const [taskListId, setTaskListId] = useState(null);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDesc, setTaskDesc] = useState("");
    const [taskPriority, setTaskPriority] = useState("MEDIUM");
    const [taskDue, setTaskDue] = useState("");
    const [taskAssignedUsers, setTaskAssignedUsers] = useState([]);

    const [editingTask, setEditingTask] = useState(null);

    const [saving, setSaving] = useState(false);

    const [expandedTeams, setExpandedTeams] = useState(() => new Set());
    const [expandedProjects, setExpandedProjects] = useState(() => new Set());
    const [expandedPeopleTeams, setExpandedPeopleTeams] = useState(() => new Set());

    const [tasksMetaByProject, setTasksMetaByProject] = useState({});
    const [data, setData] = useState(null);
    const [loadingBoard, setLoadingBoard] = useState(true);

    const [q, setQ] = useState("");
    const [priority, setPriority] = useState("Todas");

    const hasContext = !!teamId && !!projectId;

    useEffect(() => {
        localStorage.setItem("clickup_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
    }, [sidebarCollapsed]);

    useEffect(() => {
        localStorage.setItem("clickup_view", view);
    }, [view]);

    useEffect(() => {
        if (hookTeamId && !teamId) {
            setTeamId(Number(hookTeamId));
        }
    }, [hookTeamId, teamId]);

    useEffect(() => {
        if (teamId) localStorage.setItem("clickup_team_id", String(teamId));
        else localStorage.removeItem("clickup_team_id");
    }, [teamId]);

    useEffect(() => {
        if (projectId) localStorage.setItem("clickup_project_id", String(projectId));
        else localStorage.removeItem("clickup_project_id");
    }, [projectId]);

    const selectedTeamForProjectModal = useMemo(
        () => teams.find((t) => Number(t.id) === Number(createProjectTeamId)) || null,
        [teams, createProjectTeamId]
    );

    const selectedInviteTeam = useMemo(
        () => teams.find((t) => Number(t.id) === Number(inviteTeamId)) || null,
        [teams, inviteTeamId]
    );

    function toggleTeam(tid) {
        setExpandedTeams((prev) => {
            const next = new Set(prev);
            if (next.has(tid)) next.delete(tid);
            else next.add(tid);
            return next;
        });
    }

    function toggleProject(pid) {
        setExpandedProjects((prev) => {
            const next = new Set(prev);
            if (next.has(pid)) next.delete(pid);
            else next.add(pid);
            return next;
        });
    }

    function togglePeopleTeam(tid) {
        setExpandedPeopleTeams((prev) => {
            const next = new Set(prev);
            if (next.has(tid)) next.delete(tid);
            else next.add(tid);
            return next;
        });
    }

    function resetInviteForm() {
        setInviteSelectedUser(null);
        setInviteRole("MEMBER");
        setInviteTeamId(null);
    }

    function resetTaskForm() {
        setTaskListId(null);
        setTaskTitle("");
        setTaskDesc("");
        setTaskPriority("MEDIUM");
        setTaskDue("");
        setTaskAssignedUsers([]);
    }

    function closeCreateTaskModal() {
        setOpenCreateTask(false);
        resetTaskForm();
    }

    function closeEditTaskModal() {
        setOpenEditTask(false);
        setEditingTask(null);
        resetTaskForm();
    }

    const refreshTeamData = useCallback(
        async (targetTeamId, { preserveProjectSelection = true } = {}) => {
            const tid = Number(targetTeamId);
            if (!tid) return [];

            const [p, mem, inv] = await Promise.allSettled([
                apiClickup.listProjects(tid),
                apiClickup.listMembers(tid),
                apiClickup.listInvites(tid),
            ]);

            const projects = p.status === "fulfilled" && Array.isArray(p.value) ? p.value : [];
            const members = mem.status === "fulfilled" && Array.isArray(mem.value) ? mem.value : [];
            const invites = inv.status === "fulfilled" && Array.isArray(inv.value) ? inv.value : [];

            setProjectsByTeam((prev) => ({ ...prev, [tid]: projects }));
            setPeopleByTeam((prev) => ({ ...prev, [tid]: { members, invites } }));
            setExpandedTeams((prev) => new Set(prev).add(tid));

            if (Number(teamId) === tid) {
                const exists = projects.some((x) => Number(x.id) === Number(projectId));

                if (!preserveProjectSelection || !exists) {
                    const first = projects[0] ? Number(projects[0].id) : null;
                    setProjectId(first);
                }
            }

            return projects;
        },
        [projectId, teamId]
    );

    const ensureProjectTasks = useCallback(
        async (pid, forcedTeamId) => {
            const projectIdNum = Number(pid);
            const effectiveTeamId = Number(forcedTeamId || teamId);

            if (!projectIdNum || !effectiveTeamId) return;

            const current = tasksMetaByProject[projectIdNum];
            if (current?.loading || Array.isArray(current?.tasks)) return;

            setTasksMetaByProject((prev) => ({
                ...prev,
                [projectIdNum]: { loading: true, tasks: prev?.[projectIdNum]?.tasks || [] },
            }));

            try {
                const res = await apiClickup.getBoard(effectiveTeamId, projectIdNum);
                const lists = res?.lists || [];
                const tasksByList = res?.tasks_by_list || {};
                const flat = flattenTasks(lists, tasksByList);

                setTasksMetaByProject((prev) => ({
                    ...prev,
                    [projectIdNum]: { loading: false, tasks: flat },
                }));
            } catch (e) {
                setTasksMetaByProject((prev) => ({
                    ...prev,
                    [projectIdNum]: {
                        loading: false,
                        error: e?.message || "Error cargando tareas",
                        tasks: [],
                    },
                }));
            }
        },
        [teamId, tasksMetaByProject]
    );

    const loadSidebar = useCallback(async () => {
        setLoadingSidebar(true);

        try {
            const t = await apiClickup.listTeams();
            const teamArr = Array.isArray(t) ? t : [];
            setTeams(teamArr);

            const resolvedTeamId = teamId || (teamArr[0] ? Number(teamArr[0].id) : null);

            if (resolvedTeamId && !teamId) {
                setTeamId(Number(resolvedTeamId));
            }

            if (!createProjectTeamId && resolvedTeamId) {
                setCreateProjectTeamId(Number(resolvedTeamId));
            }

            if (resolvedTeamId) {
                const projects = await refreshTeamData(Number(resolvedTeamId));

                const exists = projects.some((p) => Number(p.id) === Number(projectId));
                if (!exists) {
                    const first = projects[0] ? Number(projects[0].id) : null;
                    setProjectId(first);
                }
            } else {
                setProjectId(null);
            }
        } finally {
            setLoadingSidebar(false);
        }
    }, [createProjectTeamId, projectId, refreshTeamData, teamId]);

    const loadBoard = useCallback(async () => {
        if (!teamId || !projectId) {
            setLoadingBoard(false);
            setData(null);
            return;
        }

        setLoadingBoard(true);

        try {
            const res = await apiClickup.getBoard(Number(teamId), Number(projectId));
            setData(res);
        } catch (e) {
            console.error(e);

            if (e?.status === 404) {
                const projects = await refreshTeamData(Number(teamId), {
                    preserveProjectSelection: false,
                });
                const first = projects[0] ? Number(projects[0].id) : null;
                setProjectId(first);
            }

            setData(null);
        } finally {
            setLoadingBoard(false);
        }
    }, [projectId, refreshTeamData, teamId]);

    useEffect(() => {
        loadSidebar();
    }, [loadSidebar]);

    useEffect(() => {
        if (openCreateProject) {
            setCreateProjectTeamId(
                teamId ? Number(teamId) : teams[0] ? Number(teams[0].id) : null
            );
        }
    }, [openCreateProject, teamId, teams]);

    useEffect(() => {
        (async () => {
            if (!teamId) return;
            try {
                await refreshTeamData(Number(teamId));
            } catch (e) {
                console.error(e);
            }
        })();
    }, [teamId, refreshTeamData]);

    useEffect(() => {
        loadBoard();
    }, [loadBoard]);

    useEffect(() => {
        const handler = async () => {
            await loadSidebar();
            await loadBoard();
        };

        window.addEventListener("clickup:refresh", handler);
        return () => window.removeEventListener("clickup:refresh", handler);
    }, [loadSidebar, loadBoard]);

    const lists = data?.lists || [];
    const tasksByList = data?.tasks_by_list || {};

    const filteredTasksByList = useMemo(() => {
        const out = {};
        const query = normalizeText(q);

        for (const l of lists) {
            const arr = tasksByList[l.id] || [];

            out[l.id] = arr.filter((t) => {
                const humanPriority =
                    t.priority === "HIGH"
                        ? "Alta"
                        : t.priority === "LOW"
                            ? "Baja"
                            : t.priority === "URGENT"
                                ? "Urgente"
                                : "Media";

                const okPriority = priority === "Todas" ? true : humanPriority === priority;
                if (!okPriority) return false;

                if (!query) return true;

                const hay = normalizeText(`${t.title} ${t.description || ""}`);
                return hay.includes(query);
            });
        }

        return out;
    }, [lists, tasksByList, q, priority]);

    const filteredFlatTasks = useMemo(() => {
        const all = flattenTasks(lists, tasksByList);
        const query = normalizeText(q);

        return all
            .filter((t) => {
                const humanPriority =
                    t.priority === "HIGH"
                        ? "Alta"
                        : t.priority === "LOW"
                            ? "Baja"
                            : t.priority === "URGENT"
                                ? "Urgente"
                                : "Media";

                const okPriority = priority === "Todas" ? true : humanPriority === priority;
                if (!okPriority) return false;

                if (!query) return true;

                const hay = normalizeText(`${t.title} ${t.description || ""} ${t.list_name || ""}`);
                return hay.includes(query);
            })
            .sort((a, b) =>
                String(a.due_date || a.start_date || "").localeCompare(
                    String(b.due_date || b.start_date || "")
                )
            );
    }, [lists, tasksByList, q, priority]);

    async function move(taskId, toListId) {
        if (!teamId || !data) return;

        const tasksInDest = data.tasks_by_list?.[toListId] || [];
        const toOrder = tasksInDest.length;

        try {
            await apiClickup.moveTask(Number(teamId), {
                task_id: taskId,
                to_list_id: toListId,
                to_order: toOrder,
            });

            await loadBoard();

            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));

            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        }
    }

    function onDragStart(e, task) {
        e.dataTransfer.setData("text/plain", String(task.id));
        e.dataTransfer.effectAllowed = "move";
    }

    function onDragOverColumn(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    async function onDropToColumn(e, listId) {
        e.preventDefault();
        const id = Number(e.dataTransfer.getData("text/plain"));
        if (!id) return;
        await move(id, Number(listId));
    }

    async function handleCreateTeam() {
        const name = teamName.trim();
        if (!name) return;

        setSaving(true);
        try {
            const created = await apiClickup.createTeam({ name });

            setOpenCreateTeam(false);
            setTeamName("");

            await loadSidebar();

            if (created?.id) {
                setTeamId(Number(created.id));
                setCreateProjectTeamId(Number(created.id));
                setExpandedTeams((prev) => new Set(prev).add(Number(created.id)));
            }
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateProject() {
        const name = projectName.trim();
        const targetTeamId = Number(createProjectTeamId);

        if (!name || !targetTeamId) return;

        setSaving(true);

        try {
            const created = await apiClickup.createProject(targetTeamId, {
                name,
                color: projectColor,
            });

            if (created?.id) {
                await apiClickup.bootstrapProject(targetTeamId, Number(created.id));
            }

            setOpenCreateProject(false);
            setProjectName("");
            setProjectColor(COLOR_PRESETS[0]);

            await refreshTeamData(targetTeamId, { preserveProjectSelection: false });

            if (created?.id) {
                setTeamId(targetTeamId);
                setProjectId(Number(created.id));
                setExpandedTeams((prev) => new Set(prev).add(targetTeamId));
                setExpandedProjects((prev) => new Set(prev).add(Number(created.id)));
                setTasksMetaByProject((prev) => ({
                    ...prev,
                    [Number(created.id)]: undefined,
                }));
                await ensureProjectTasks(Number(created.id), targetTeamId);
            }
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleBootstrapProject() {
        if (!teamId || !projectId) {
            alert("Selecciona un equipo y un proyecto.");
            return;
        }

        try {
            await apiClickup.bootstrapProject(Number(teamId), Number(projectId));
            await loadBoard();

            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));

            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleInvite() {
        if (!inviteSelectedUser || !inviteTeamId) return;

        setSaving(true);
        try {
            await apiClickup.invite(Number(inviteTeamId), {
                usuario_id: Number(inviteSelectedUser.id),
                rol: inviteRole,
            });

            setOpenInvite(false);
            resetInviteForm();

            await refreshTeamData(Number(inviteTeamId));
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    function openCreateTaskFor(listId, preset = {}) {
        resetTaskForm();
        setTaskListId(Number(listId));

        if (preset?.title) setTaskTitle(String(preset.title));
        if (preset?.due_date) setTaskDue(String(preset.due_date).slice(0, 10));

        setOpenCreateTask(true);
    }

    function openCreateTaskFromTimeline(listId, dueDate) {
        openCreateTaskFor(listId, { due_date: dueDate });
    }

    async function handleUpdateTaskDates(taskId, startDate, endDate) {
        if (!teamId || !taskId) return;

        setSaving(true);
        try {
            await apiClickup.updateTask(Number(teamId), Number(taskId), {
                // El back actual guarda la fecha final en el campo `vence`.
                // Si después agregas campo `inicio` en Django, puedes mandar también: inicio: `${startDate}T00:00:00`
                vence: endDate ? `${endDate}T00:00:00` : null,
            });

            await loadBoard();

            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));

            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    function addAssignedUser(user) {
        if (!user) return;

        setTaskAssignedUsers((prev) => {
            if (prev.some((x) => Number(x.id) === Number(user.id))) return prev;
            return [...prev, user];
        });
    }

    function removeAssignedUser(userId) {
        setTaskAssignedUsers((prev) =>
            prev.filter((x) => Number(x.id) !== Number(userId))
        );
    }

    function openEditTaskModal(task) {
        setEditingTask(task);
        setTaskListId(Number(task.list));
        setTaskTitle(task.title || "");
        setTaskDesc(task.description || "");
        setTaskPriority(task.priority || "MEDIUM");
        setTaskDue(task.due_date ? String(task.due_date).slice(0, 10) : "");
        setTaskAssignedUsers(
            Array.isArray(task.assigned)
                ? task.assigned.map((u) => ({
                    id: Number(u.user_id),
                    name: u.name,
                    email: u.email,
                    username: u.username,
                }))
                : []
        );
        setOpenEditTask(true);
    }

    async function handleCreateTask() {
        if (!teamId || !taskListId) return;

        const titulo = taskTitle.trim();
        if (!titulo) return;

        setSaving(true);
        try {
            await apiClickup.createTask(Number(teamId), {
                lista: Number(taskListId),
                titulo,
                descripcion: taskDesc.trim(),
                prioridad: taskPriority,
                vence: taskDue ? `${taskDue}T00:00:00` : null,
                asignados_ids: taskAssignedUsers.map((u) => Number(u.id)),
            });

            closeCreateTaskModal();
            await loadBoard();

            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));

            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleUpdateTask() {
        if (!teamId || !editingTask?.id) return;

        setSaving(true);
        try {
            await apiClickup.updateTask(Number(teamId), Number(editingTask.id), {
                titulo: taskTitle.trim(),
                descripcion: taskDesc.trim(),
                prioridad: taskPriority,
                vence: taskDue ? `${taskDue}T00:00:00` : null,
                lista: Number(taskListId),
                asignados_ids: taskAssignedUsers.map((u) => Number(u.id)),
            });

            closeEditTaskModal();
            await loadBoard();

            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));

            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteTask(task) {
        const ok = window.confirm(`¿Eliminar la tarea "${task.title}"?`);
        if (!ok || !teamId) return;

        try {
            await apiClickup.deleteTask(Number(teamId), Number(task.id));
            await loadBoard();

            setTasksMetaByProject((prev) => ({
                ...prev,
                [Number(projectId)]: undefined,
            }));

            ensureProjectTasks(Number(projectId));
        } catch (e) {
            alert(e.message);
        }
    }

    const handleSelectTeam = useCallback((tid) => {
        setTeamId(Number(tid));
        setProjectId(null);
        setExpandedTeams((prev) => new Set(prev).add(Number(tid)));
    }, []);

    const handleSelectProject = useCallback(
        (tid, pid) => {
            setTeamId(Number(tid));
            setProjectId(Number(pid));
            setExpandedTeams((prev) => new Set(prev).add(Number(tid)));
            setExpandedProjects((prev) => new Set(prev).add(Number(pid)));
            ensureProjectTasks(Number(pid), Number(tid));
        },
        [ensureProjectTasks]
    );

    const viewItems = useMemo(
        () => [
            { id: "kanban", label: "Kanban", icon: LayoutGrid },
            { id: "table", label: "Tabla", icon: Table2 },
            { id: "gantt", label: "Línea de tiempo", icon: GanttChartSquare },
        ],
        []
    );

    const safeProjectsByTeam = projectsByTeam || {};
    const boardHasLists = lists.length > 0;

    return (
        <div className="min-h-[calc(100vh-20px)] bg-slate-50">
            <div className="flex min-h-[calc(100vh-20px)]">
                <ClickupSidebarTree
                    isDesktop={isDesktop}
                    openMobile={sidebarOpenMobile}
                    onCloseMobile={() => setSidebarOpenMobile(false)}
                    collapsed={isDesktop ? sidebarCollapsed : false}
                    onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
                    teams={teams}
                    projectsByTeam={safeProjectsByTeam}
                    selectedTeamId={teamId}
                    selectedProjectId={projectId}
                    onSelectTeam={handleSelectTeam}
                    onSelectProject={handleSelectProject}
                    onOpenCreateTeam={() => setOpenCreateTeam(true)}
                    onOpenCreateProject={() => setOpenCreateProject(true)}
                    peopleByTeam={peopleByTeam}
                    onOpenInvite={(tid) => {
                        setInviteTeamId(Number(tid));
                        setInviteSelectedUser(null);
                        setInviteRole("MEMBER");
                        setOpenInvite(true);
                        setExpandedPeopleTeams((prev) => new Set(prev).add(Number(tid)));
                    }}
                    tasksMetaByProject={tasksMetaByProject}
                    onToggleProject={(pid) => ensureProjectTasks(Number(pid))}
                    expandedTeams={expandedTeams}
                    toggleTeam={toggleTeam}
                    expandedProjects={expandedProjects}
                    toggleProject={toggleProject}
                    expandedPeopleTeams={expandedPeopleTeams}
                    togglePeopleTeam={togglePeopleTeam}
                />

                <main className="flex-1 min-w-0">
                    <div className="sticky top-0 z-0 border-b border-black/10 bg-white/85 backdrop-blur">
                        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                {!isDesktop ? (
                                    <button
                                        onClick={() => setSidebarOpenMobile(true)}
                                        className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black/70 hover:bg-slate-50"
                                        title="Menú"
                                    >
                                        <Menu className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={loadBoard}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-white hover:opacity-95"
                                    style={{ backgroundColor: BRAND_BLUE }}
                                    title="Recargar tablero"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    <span className="hidden sm:inline">Tablero</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-3 py-4 sm:px-6">
                        <Card className="p-3 sm:p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                    <ViewSwitch view={view} setView={setView} items={viewItems} />

                                    <div className="relative w-full sm:w-[340px]">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                                        <input
                                            value={q}
                                            onChange={(e) => setQ(e.target.value)}
                                            className="w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#131E5C]"
                                            placeholder="Buscar tareas..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-black/50" />
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                                        >
                                            <option value="Todas">Todas</option>
                                            <option value="Alta">Alta</option>
                                            <option value="Media">Media</option>
                                            <option value="Baja">Baja</option>
                                            <option value="Urgente">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {loadingSidebar ? <Pill>cargando sidebar…</Pill> : null}

                                    {!hasContext ? (
                                        <Pill tone="warn">
                                            <AlertTriangle className="h-4 w-4" />
                                            Selecciona equipo y proyecto.
                                        </Pill>
                                    ) : (
                                        <Pill tone="ok">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Listo
                                        </Pill>
                                    )}

                                    <Pill tone="blue">
                                        <span className="font-black">Tareas</span>: {filteredFlatTasks.length}
                                    </Pill>
                                </div>
                            </div>
                        </Card>

                        <div className="mt-4">
                            {loadingBoard ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-72 animate-pulse rounded-2xl bg-black/5" />
                                    ))}
                                </div>
                            ) : !data ? (
                                <Card className="p-4">
                                    <Pill tone="warn">
                                        <AlertTriangle className="h-4 w-4" />
                                        No hay tablero cargado. Crea o selecciona un proyecto.
                                    </Pill>
                                </Card>
                            ) : !boardHasLists ? (
                                <Card className="p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-lg font-extrabold text-[#131E5C]">
                                                Este proyecto aún no tiene columnas
                                            </div>
                                            <div className="mt-1 text-sm text-black/60">
                                                Inicializa el tablero para crear las listas base del Kanban.
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBootstrapProject}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white hover:opacity-95"
                                            style={{ backgroundColor: BRAND_BLUE }}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Crear columnas base
                                        </button>
                                    </div>
                                </Card>
                            ) : view === "kanban" ? (
                                <ClickupKanbanView
                                    lists={lists}
                                    tasksByList={tasksByList}
                                    filteredTasksByList={filteredTasksByList}
                                    q={q}
                                    priority={priority}
                                    onMove={move}
                                    onCreateTask={openCreateTaskFor}
                                    onDragStart={onDragStart}
                                    onDragOverColumn={onDragOverColumn}
                                    onDropToColumn={onDropToColumn}
                                    onEditTask={openEditTaskModal}
                                    onDeleteTask={handleDeleteTask}
                                    onManageEvidence={openEvidenceModalFor}
                                />
                            ) : view === "table" ? (
                                <ClickupTableView
                                    tasks={filteredFlatTasks}
                                    lists={lists}
                                    onMove={move}
                                    onEditTask={openEditTaskModal}
                                    onDeleteTask={handleDeleteTask}
                                    onManageEvidence={openEvidenceModalFor}
                                    localOnly={false}
                                />
                            ) : (
                                <ClickupTimelineView
                                    tasks={filteredFlatTasks}
                                    lists={lists}
                                    onUpdateDates={handleUpdateTaskDates}
                                    onCreateTaskFromDate={openCreateTaskFromTimeline}
                                    localOnly={false}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <Modal
                open={openCreateTeam}
                title="Crear equipo"
                onClose={() => setOpenCreateTeam(false)}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setOpenCreateTeam(false)}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateTeam}
                            disabled={saving || !teamName.trim()}
                            className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            Crear
                        </button>
                    </div>
                }
            >
                <label className="text-sm font-extrabold text-black/70">Nombre del equipo</label>
                <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                    placeholder="Ej: Equipo CRM"
                />
            </Modal>

            <Modal
                open={openCreateProject}
                title="Crear proyecto"
                onClose={() => setOpenCreateProject(false)}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setOpenCreateProject(false)}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateProject}
                            disabled={saving || !projectName.trim() || !createProjectTeamId}
                            className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            Crear
                        </button>
                    </div>
                }
            >
                {!teams.length ? (
                    <Pill tone="warn">
                        <AlertTriangle className="h-4 w-4" />
                        Primero necesitas pertenecer a un equipo.
                    </Pill>
                ) : null}

                <label className="block text-sm font-extrabold text-black/70">Equipo</label>
                <select
                    value={createProjectTeamId || ""}
                    onChange={(e) => setCreateProjectTeamId(Number(e.target.value) || null)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                    disabled={!teams.length}
                >
                    <option value="">Selecciona un equipo</option>
                    {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.name}
                        </option>
                    ))}
                </select>

                {selectedTeamForProjectModal ? (
                    <div className="mt-2 text-xs text-black/55">
                        El proyecto se creará dentro de{" "}
                        <span className="font-extrabold text-[#131E5C]">
                            {selectedTeamForProjectModal.name}
                        </span>.
                    </div>
                ) : null}

                <label className="mt-4 block text-sm font-extrabold text-black/70">Nombre del proyecto</label>
                <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                    placeholder="Ej: CRM - Agenda"
                />

                <label className="mt-4 block text-sm font-extrabold text-black/70">Color</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setProjectColor(c)}
                            className={cls(
                                "h-9 w-9 rounded-xl border border-black/10 ring-2 ring-white transition",
                                projectColor === c ? "outline outline-2 outline-[#131E5C]" : "hover:scale-[1.03]"
                            )}
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                    ))}
                </div>
            </Modal>

            <Modal
                open={openInvite}
                title="Invitar usuario al equipo"
                onClose={() => {
                    setOpenInvite(false);
                    resetInviteForm();
                }}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                setOpenInvite(false);
                                resetInviteForm();
                            }}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleInvite}
                            disabled={saving || !inviteSelectedUser || !inviteTeamId}
                            className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            Enviar invitación
                        </button>
                    </div>
                }
            >
                <div className="text-sm text-black/70">
                    Equipo:{" "}
                    <span className="font-extrabold text-[#131E5C]">
                        {selectedInviteTeam?.name || "—"}
                    </span>
                </div>

                <label className="mt-3 block text-sm font-extrabold text-black/70">Usuario</label>
                <div className="mt-2">
                    <ClickupUserAutocomplete
                        value={inviteSelectedUser}
                        onChange={setInviteSelectedUser}
                        placeholder="Escribe nombre, usuario o correo..."
                    />
                </div>

                <label className="mt-4 block text-sm font-extrabold text-black/70">Rol</label>
                <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                >
                    <option value="MEMBER">Miembro</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="VIEWER">Lector</option>
                </select>
            </Modal>

            <Modal
                open={openCreateTask}
                title="Crear tarea"
                onClose={closeCreateTaskModal}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={closeCreateTaskModal}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateTask}
                            disabled={saving || !taskTitle.trim() || !taskListId || !teamId}
                            className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            Crear
                        </button>
                    </div>
                }
            >
                <label className="text-sm font-extrabold text-black/70">Título</label>
                <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                    placeholder="Ej: Validar endpoint crear tarea"
                />

                <label className="mt-3 block text-sm font-extrabold text-black/70">Descripción</label>
                <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="mt-2 w-full min-h-[90px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                    placeholder="Opcional…"
                />

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Prioridad</label>
                        <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                        >
                            <option value="LOW">Baja</option>
                            <option value="MEDIUM">Media</option>
                            <option value="HIGH">Alta</option>
                            <option value="URGENT">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Vence</label>
                        <input
                            type="date"
                            value={taskDue}
                            onChange={(e) => setTaskDue(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                        />
                    </div>
                </div>

                <label className="mt-4 block text-sm font-extrabold text-black/70">Asignar usuarios</label>
                <div className="mt-2">
                    <ClickupUserAutocomplete
                        value={null}
                        onChange={addAssignedUser}
                        placeholder="Buscar y agregar usuario..."
                    />
                </div>

                {taskAssignedUsers.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {taskAssignedUsers.map((user) => (
                            <div
                                key={user.id}
                                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-3 py-1 text-xs font-bold text-black/70"
                            >
                                <span>{user.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAssignedUser(user.id)}
                                    className="rounded-full p-0.5 hover:bg-slate-200"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </Modal>

            <Modal
                open={openEditTask}
                title="Editar tarea"
                onClose={closeEditTaskModal}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={closeEditTaskModal}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateTask}
                            disabled={saving || !taskTitle.trim() || !editingTask}
                            className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            Guardar cambios
                        </button>
                    </div>
                }
            >
                <label className="text-sm font-extrabold text-black/70">Título</label>
                <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                />

                <label className="mt-3 block text-sm font-extrabold text-black/70">Descripción</label>
                <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="mt-2 w-full min-h-[90px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                />

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Prioridad</label>
                        <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                        >
                            <option value="LOW">Baja</option>
                            <option value="MEDIUM">Media</option>
                            <option value="HIGH">Alta</option>
                            <option value="URGENT">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Vence</label>
                        <input
                            type="date"
                            value={taskDue}
                            onChange={(e) => setTaskDue(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                        />
                    </div>
                </div>

                <label className="mt-4 block text-sm font-extrabold text-black/70">Columna</label>
                <select
                    value={taskListId || ""}
                    onChange={(e) => setTaskListId(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                >
                    <option value="">Selecciona una columna</option>
                    {lists.map((l) => (
                        <option key={l.id} value={l.id}>
                            {l.name}
                        </option>
                    ))}
                </select>

                <label className="mt-4 block text-sm font-extrabold text-black/70">Asignados</label>
                <div className="mt-2">
                    <ClickupUserAutocomplete
                        value={null}
                        onChange={addAssignedUser}
                        placeholder="Buscar y agregar usuario..."
                    />
                </div>

                {taskAssignedUsers.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {taskAssignedUsers.map((user) => (
                            <div
                                key={user.id}
                                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-slate-50 px-3 py-1 text-xs font-bold text-black/70"
                            >
                                <span>{user.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAssignedUser(user.id)}
                                    className="rounded-full p-0.5 hover:bg-slate-200"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </Modal>
            <Modal
                open={openEvidenceModal}
                title="Gestionar evidencias"
                maxWidth="max-w-4xl"
                onClose={() => {
                    setOpenEvidenceModal(false);
                    setEvidenceTask(null);
                    setEvidenceDetail(null);
                    setEvidenceComment("");
                    setEvidenceFiles([]);
                    setEvidenceType("BUG");
                }}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setOpenEvidenceModal(false)}
                            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handleUploadEvidence}
                            disabled={saving || !evidenceFiles.length}
                            className="rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            Subir evidencia
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-black/70">
                        <div className="font-extrabold text-[#131E5C]">{evidenceTask?.title}</div>
                        {evidenceDetail?.reporte ? (
                            <div className="mt-1 text-xs">
                                Estado del ticket: <span className="font-bold">{evidenceDetail.reporte.status}</span>
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Tipo de evidencia</label>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm text-black/70">
                            <div className="font-extrabold text-[#131E5C]">{evidenceTask?.title}</div>
                            {evidenceDetail?.reporte ? (
                                <>
                                    <div className="mt-1 text-xs">
                                        Estado del ticket: <span className="font-bold">{evidenceDetail.reporte.status}</span>
                                    </div>
                                    <div className="mt-1 text-xs">
                                        Evidencias iniciales del bug: <span className="font-bold">{evidenceDetail.reporte.evidencias_bug.length}</span>
                                    </div>
                                    <div className="mt-1 text-xs">
                                        Evidencias de solución: <span className="font-bold">{evidenceDetail.reporte.evidencias_solucion.length}</span>
                                    </div>
                                </>
                            ) : null}
                        </div>
                        <select
                            value={evidenceType}
                            onChange={(e) => setEvidenceType(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]"
                        >
                            <option value="BUG">Evidencia del bug</option>
                            <option value="RESOLUTION">Evidencia de solución</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Comentario</label>
                        <textarea
                            value={evidenceComment}
                            onChange={(e) => setEvidenceComment(e.target.value)}
                            className="mt-2 w-full min-h-[90px] rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                            placeholder="Opcional..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-extrabold text-black/70">Archivos</label>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                            className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                        />
                    </div>

                    {loadingEvidence ? (
                        <div className="text-sm text-black/60">Cargando evidencias...</div>
                    ) : evidenceDetail?.reporte ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <div className="text-sm font-extrabold text-black/70">
                                    Evidencias del bug ({evidenceDetail.reporte.evidencias_bug.length})
                                </div>
                                <div className="mt-2 space-y-2">
                                    {evidenceDetail.reporte.evidencias_bug.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-xl border border-black/10 bg-slate-50 p-3 text-xs hover:bg-slate-100"
                                        >
                                            <div className="font-bold">{item.comment || "Sin comentario"}</div>
                                            <div className="mt-1 text-black/50">{item.created_at}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-extrabold text-black/70">
                                    Evidencias de solución ({evidenceDetail.reporte.evidencias_solucion.length})
                                </div>
                                <div className="mt-2 space-y-2">
                                    {evidenceDetail.reporte.evidencias_solucion.map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-xl border border-black/10 bg-slate-50 p-3 text-xs hover:bg-slate-100"
                                        >
                                            <div className="font-bold">{item.comment || "Sin comentario"}</div>
                                            <div className="mt-1 text-black/50">{item.created_at}</div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-black/60">Esta tarea no tiene reporte asociado.</div>
                    )}
                </div>
            </Modal>
        </div>
    );
}