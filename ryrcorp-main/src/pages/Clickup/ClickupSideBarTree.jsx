import { useMemo } from "react";
import {
    ChevronRight,
    ChevronDown,
    Users,
    CheckSquare,
    UserPlus,
    Mail,
    Plus,
    X,
    ChevronLeft,
} from "lucide-react";

import { BRAND_BLUE, Card, Pill, cls } from "./ClickupUI";

export default function ClickupSidebarTree({
    isDesktop,
    openMobile,
    onCloseMobile,
    collapsed,
    onToggleCollapsed,
    teams,
    projectsByTeam,
    selectedTeamId,
    selectedProjectId,
    onSelectTeam,
    onSelectProject,
    onOpenCreateTeam,
    onOpenCreateProject,
    peopleByTeam,
    onOpenInvite,
    tasksMetaByProject,
    onToggleProject,
    expandedTeams,
    toggleTeam,
    expandedProjects,
    toggleProject,
    expandedPeopleTeams,
    togglePeopleTeam,
}) {
    const compact = isDesktop && collapsed;
    const widthClass = compact ? "w-[76px]" : "w-[320px]";

    const teamList = Array.isArray(teams) ? teams : [];
    const selectedTeam = useMemo(
        () => teamList.find((t) => Number(t.id) === Number(selectedTeamId)),
        [teamList, selectedTeamId]
    );

    function IconChevron({ open }) {
        return open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
    }

    function Dot({ color }) {
        const c = color || "#64748b";
        return (
            <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-white border border-black/10"
                style={{ backgroundColor: c }}
            />
        );
    }

    const content = (
        <div className={cls("h-full flex flex-col bg-white", isDesktop ? "border-r border-black/10" : "")}>
            <div className="px-3 py-3 border-b border-black/10 bg-white">
                <div className={cls("flex items-center justify-between gap-2", compact ? "justify-center" : "")}>
                    <div className={cls("min-w-0", compact ? "hidden" : "")}>
                        <div className="text-sm font-extrabold text-[#131E5C]">R&R ClickUp</div>
                        {!compact && selectedTeam ? (
                            <div className="mt-1 text-[11px] text-black/45 truncate">Equipo activo: {selectedTeam.name}</div>
                        ) : null}
                    </div>

                    {compact ? <div className="text-sm font-extrabold text-[#131E5C]">R&R</div> : null}

                    {isDesktop ? (
                        <button
                            onClick={onToggleCollapsed}
                            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black/70 hover:bg-slate-50"
                            title={collapsed ? "Expandir" : "Colapsar"}
                        >
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>
                    ) : (
                        <button
                            onClick={onCloseMobile}
                            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black/70 hover:bg-slate-50"
                            title="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto px-2 py-3 space-y-4">
                <Card className={cls("p-2", compact ? "mx-1" : "")}>
                    <div className="grid gap-2">
                        <button
                            onClick={onOpenCreateTeam}
                            className={cls(
                                "w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white hover:opacity-95",
                                compact ? "p-2" : "px-3 py-2"
                            )}
                            style={{ backgroundColor: BRAND_BLUE }}
                            title="Crear equipo"
                        >
                            <Plus className="h-4 w-4" />
                            {!compact ? "Nuevo equipo" : null}
                        </button>

                        <button
                            onClick={onOpenCreateProject}
                            className={cls(
                                "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-sm font-extrabold text-black/70 hover:bg-slate-50",
                                compact ? "p-2" : "px-3 py-2"
                            )}
                            title="Crear proyecto"
                        >
                            <Plus className="h-4 w-4" />
                            {!compact ? "Nuevo proyecto" : null}
                        </button>
                    </div>
                </Card>

                {!compact ? (
                    <div className="px-2 mb-2 text-[11px] font-black text-black/45 uppercase tracking-wider">Equipos</div>
                ) : null}

                <Card className={cls("p-2", compact ? "mx-1" : "")}>
                    {teamList.length === 0 ? (
                        <div className={cls("text-sm text-black/60", compact ? "p-2 text-center" : "px-2 py-3")}>
                            {compact ? "—" : "Sin equipos"}
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {teamList.map((t) => {
                                const tid = Number(t.id);
                                const isOpen = expandedTeams.has(tid);
                                const isActiveTeam = Number(selectedTeamId) === tid;
                                const teamProjects = projectsByTeam?.[tid] || [];
                                const people = peopleByTeam?.[tid] || { members: [], invites: [] };
                                const peopleOpen = expandedPeopleTeams.has(tid);

                                return (
                                    <div
                                        key={tid}
                                        className={cls(
                                            "w-full rounded-2xl border transition",
                                            isActiveTeam
                                                ? "border-[#131E5C]/30 bg-[#131E5C]/[0.03] shadow-sm ring-1 ring-[#131E5C]/20"
                                                : "border-black/10 bg-white hover:bg-black/[0.01]"
                                        )}
                                    >
                                        <div className={cls("flex items-center gap-1 p-1", compact ? "justify-center" : "")}>
                                            {!compact ? (
                                                <button
                                                    onClick={() => toggleTeam(tid)}
                                                    className="inline-flex items-center justify-center rounded-lg p-2 text-black/60 hover:bg-black/[0.03]"
                                                    title={isOpen ? "Contraer" : "Expandir"}
                                                >
                                                    <IconChevron open={isOpen} />
                                                </button>
                                            ) : null}

                                            <button
                                                onClick={() => {
                                                    onSelectTeam(tid);
                                                    if (!compact && !isOpen) toggleTeam(tid);
                                                }}
                                                className={cls(
                                                    "flex-1 min-w-0 rounded-xl transition font-extrabold",
                                                    compact ? "p-2 flex items-center justify-center" : "px-3 py-2 text-left",
                                                    isActiveTeam ? "text-[#131E5C]" : "text-black/75 hover:bg-black/[0.03]"
                                                )}
                                                title={t.name}
                                            >
                                                <span className={cls("inline-flex items-center gap-2 min-w-0", compact ? "justify-center" : "")}>
                                                    <Users className="h-4 w-4 shrink-0" />
                                                    {!compact ? <span className="truncate">{t.name}</span> : null}
                                                </span>
                                            </button>

                                            {!compact ? (
                                                <button
                                                    onClick={() => onOpenInvite?.(tid)}
                                                    className="mr-1 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 text-black/70 hover:bg-slate-50"
                                                    title="Agregar persona"
                                                >
                                                    <UserPlus className="h-4 w-4 shrink-0" />
                                                </button>
                                            ) : null}
                                        </div>

                                        {!compact && isOpen ? (
                                            <div className="pb-2 px-2 space-y-3">
                                                <div className="pt-1">
                                                    <div className="px-2 mb-1 text-[11px] font-black text-black/45 uppercase tracking-wider">
                                                        Proyectos
                                                    </div>

                                                    {teamProjects.length === 0 ? (
                                                        <div className="px-2 py-2 text-xs text-black/55">Sin proyectos</div>
                                                    ) : (
                                                        <div className="grid gap-1">
                                                            {teamProjects.map((p) => {
                                                                const pid = Number(p.id);
                                                                const isProjectOpen = expandedProjects.has(pid);
                                                                const isActiveProject = Number(selectedProjectId) === pid;
                                                                const meta = tasksMetaByProject?.[pid];
                                                                const tasks = meta?.tasks || [];
                                                                const loading = Boolean(meta?.loading);

                                                                return (
                                                                    <div key={pid} className="rounded-xl border border-black/5 bg-white">
                                                                        <div className="flex items-center gap-1 p-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    toggleProject(pid);
                                                                                    onToggleProject?.(pid);
                                                                                }}
                                                                                className="inline-flex items-center justify-center rounded-lg p-2 text-black/60 hover:bg-black/[0.03]"
                                                                                title={isProjectOpen ? "Contraer" : "Expandir"}
                                                                            >
                                                                                <IconChevron open={isProjectOpen} />
                                                                            </button>

                                                                            <button
                                                                                onClick={() => {
                                                                                    onSelectProject(tid, pid);
                                                                                    if (!isProjectOpen) {
                                                                                        toggleProject(pid);
                                                                                        onToggleProject?.(pid);
                                                                                    }
                                                                                }}
                                                                                className={cls(
                                                                                    "flex-1 min-w-0 rounded-lg px-3 py-2 text-sm font-extrabold text-left transition",
                                                                                    isActiveProject
                                                                                        ? "bg-[#131E5C]/10 text-[#131E5C]"
                                                                                        : "text-black/75 hover:bg-black/[0.03]"
                                                                                )}
                                                                                title={p.name}
                                                                            >
                                                                                <span className="inline-flex items-center gap-2 min-w-0">
                                                                                    <Dot color={p.color} />
                                                                                    <span className="truncate">{p.name}</span>
                                                                                </span>
                                                                            </button>
                                                                        </div>

                                                                        {isProjectOpen ? (
                                                                            <div className="px-3 pb-3">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="text-[11px] font-black text-black/45 uppercase tracking-wider">
                                                                                        Tareas
                                                                                    </div>
                                                                                    {loading ? <Pill>cargando…</Pill> : null}
                                                                                </div>

                                                                                {meta?.error ? (
                                                                                    <div className="mt-2 text-xs text-rose-700">{meta.error}</div>
                                                                                ) : tasks.length === 0 && !loading ? (
                                                                                    <div className="mt-2 text-xs text-black/55">
                                                                                        Sin tareas todavía
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="mt-2 grid gap-1">
                                                                                        {tasks.slice(0, 12).map((tk) => (
                                                                                            <div
                                                                                                key={tk.id}
                                                                                                className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-black/70 hover:bg-black/[0.03]"
                                                                                                title={tk.title}
                                                                                            >
                                                                                                <CheckSquare className="h-4 w-4 text-black/35" />
                                                                                                <span className="truncate">{tk.title}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                        {tasks.length > 12 ? (
                                                                                            <div className="text-[11px] text-black/45 mt-1">
                                                                                                +{tasks.length - 12} más…
                                                                                            </div>
                                                                                        ) : null}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="px-2 mb-1 text-[11px] font-black text-black/45 uppercase tracking-wider">
                                                        Personas
                                                    </div>

                                                    <div className="rounded-xl border border-black/5 bg-white p-1">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => togglePeopleTeam(tid)}
                                                                className="inline-flex items-center justify-center rounded-lg p-2 text-black/60 hover:bg-black/[0.03]"
                                                                title={peopleOpen ? "Contraer" : "Expandir"}
                                                            >
                                                                <IconChevron open={peopleOpen} />
                                                            </button>

                                                            <div className="flex-1 min-w-0 px-3 py-2 text-sm font-extrabold text-black/75 flex items-center gap-2">
                                                                <Users className="h-4 w-4" />
                                                                <span className="truncate">Miembros</span>
                                                            </div>

                                                            <button
                                                                onClick={() => onOpenInvite?.(tid)}
                                                                className="mr-1 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 text-black/70 hover:bg-slate-50"
                                                                title="Agregar persona"
                                                            >
                                                                <UserPlus className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {peopleOpen ? (
                                                            <div className="px-3 pb-3">
                                                                <div className="mt-1 text-[11px] font-black text-black/45 uppercase tracking-wider">
                                                                    Miembros ({people.members?.length || 0})
                                                                </div>

                                                                {!people.members?.length ? (
                                                                    <div className="mt-2 text-xs text-black/55">Sin miembros</div>
                                                                ) : (
                                                                    <div className="mt-2 grid gap-1">
                                                                        {people.members.slice(0, 8).map((m, idx) => (
                                                                            <div
                                                                                key={m.id ?? m.email ?? idx}
                                                                                className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-black/70 hover:bg-black/[0.03]"
                                                                                title={m.email || m.name}
                                                                            >
                                                                                <Users className="h-4 w-4 text-black/35" />
                                                                                <span className="truncate">
                                                                                    {m.name || m.full_name || m.email || "Miembro"}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="mt-3 text-[11px] font-black text-black/45 uppercase tracking-wider">
                                                                    Invitaciones ({people.invites?.length || 0})
                                                                </div>

                                                                {!people.invites?.length ? (
                                                                    <div className="mt-2 text-xs text-black/55">Sin invitaciones</div>
                                                                ) : (
                                                                    <div className="mt-2 grid gap-1">
                                                                        {people.invites.slice(0, 6).map((inv, idx) => (
                                                                            <div
                                                                                key={inv.id ?? inv.email ?? idx}
                                                                                className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-black/70 hover:bg-black/[0.03]"
                                                                                title={inv.email}
                                                                            >
                                                                                <Mail className="h-4 w-4 text-black/35" />
                                                                                <span className="truncate">{inv.email || "Invitación"}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );

    if (isDesktop) return <aside className={cls("shrink-0", widthClass)}>{content}</aside>;

    return (
        <div className={cls("fixed inset-0 z-50", openMobile ? "" : "pointer-events-none")}>
            <div
                className={cls("absolute inset-0 bg-black/30 transition-opacity", openMobile ? "opacity-100" : "opacity-0")}
                onClick={onCloseMobile}
            />
            <div
                className={cls(
                    "absolute left-0 top-0 h-full w-[320px] bg-white shadow-xl transition-transform",
                    openMobile ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {content}
            </div>
        </div>
    );
}
