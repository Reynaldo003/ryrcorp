// src/components/ClickupNotificationsBell.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, X, Users, ClipboardList } from "lucide-react";
import { apiClickup } from "../lib/apiClickup";

function timeAgo(dateStr) {
    if (!dateStr) return "—";
    const now = new Date();
    const dt = new Date(dateStr);
    const diff = Math.max(0, now - dt);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins} min`;
    if (hrs < 24) return `hace ${hrs} h`;
    return `hace ${days} d`;
}

function NotificationCard({ item, onAcceptInvite, onRejectInvite, onDismiss }) {
    const isInvite = item.type === "TEAM_INVITE";
    const isTask = item.type === "TASK_ASSIGNED";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
                    {isInvite ? <Users className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-extrabold text-slate-900">
                                {item.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                {timeAgo(item.created_at)}
                            </div>
                        </div>
                    </div>

                    {item.message ? (
                        <div className="mt-2 text-sm text-slate-700">{item.message}</div>
                    ) : null}

                    {item.team_name ? (
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                            Equipo: {item.team_name}
                        </div>
                    ) : null}

                    {isInvite ? (
                        <div className="mt-3 flex items-center gap-2">
                            <button
                                onClick={() => onAcceptInvite?.(item)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                                <Check className="h-4 w-4" />
                                Aceptar
                            </button>

                            <button
                                onClick={() => onRejectInvite?.(item)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                                <X className="h-4 w-4" />
                                Rechazar
                            </button>
                        </div>
                    ) : (
                        <div className="mt-3 flex items-center gap-2">
                            {item.task_id && (
                                <button
                                    onClick={() => {
                                        if (item.team_id) localStorage.setItem("clickup_team_id", String(item.team_id));
                                        if (item.project_id) localStorage.setItem("clickup_project_id", String(item.project_id));
                                        window.dispatchEvent(new CustomEvent("clickup:navigate", {
                                            detail: { teamId: item.team_id, projectId: item.project_id, taskId: item.task_id }
                                        }));
                                        onDismiss?.(item);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
                                >
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    Ver plan
                                </button>
                            )}
                            <button
                                onClick={() => onDismiss?.(item)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Ocultar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ClickupNotificationsBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const boxRef = useRef(null);

    async function loadNotifications() {
        setLoading(true);
        try {
            const data = await apiClickup.listNotifications();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
        const timer = setInterval(loadNotifications, 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (!boxRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const pendingCount = useMemo(
        () => items.filter((x) => x.status === "PENDING").length,
        [items]
    );

    async function handleAcceptInvite(item) {
        try {
            await apiClickup.acceptInvite(null, item.invitation_id);
            await loadNotifications();
            window.dispatchEvent(new Event("clickup:refresh"));
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleRejectInvite(item) {
        try {
            await apiClickup.rejectInvite(item.invitation_id);
            await loadNotifications();
            window.dispatchEvent(new Event("clickup:refresh"));
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleDismiss(item) {
        try {
            await apiClickup.dismissNotification(item.id);
            await loadNotifications();
        } catch (e) {
            alert(e.message);
        }
    }

    return (
        <div className="relative" ref={boxRef}>
            <button
                onClick={() => {
                    setOpen((v) => !v);
                    if (!open) loadNotifications();
                }}
                title="Notificaciones"
                className="relative inline-flex h-10 items-center justify-center rounded-2xl text-white transition hover:shadow-sm"
            >
                <Bell size={18} />
                {pendingCount > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {pendingCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 z-[90] mt-3 w-[380px] max-w-[92vw] rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-extrabold text-slate-900">Bandeja de entrada</div>
                            <div className="text-xs text-slate-500">Últimos 7 días</div>
                        </div>
                        <div className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700">
                            {items.length}
                        </div>
                    </div>

                    <div className="max-h-[480px] space-y-3 overflow-auto pr-1">
                        {loading ? (
                            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                                Cargando notificaciones...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                                No tienes notificaciones recientes.
                            </div>
                        ) : (
                            items.map((item) => (
                                <NotificationCard
                                    key={item.id}
                                    item={item}
                                    onAcceptInvite={handleAcceptInvite}
                                    onRejectInvite={handleRejectInvite}
                                    onDismiss={handleDismiss}
                                />
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}