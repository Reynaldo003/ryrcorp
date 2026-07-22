// src/pages/Clickup/ClickupUI.jsx
import { useEffect, useState } from "react";
import { X, AlertTriangle, CheckCircle2, Zap, TrendingDown, Minus } from "lucide-react";

export const BRAND_BLUE = "#131E5C";

/* ─── Global CSS injection ─────────────────────────────────────────────── */
function injectGlobalStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("cu-global-styles")) return;
    const el = document.createElement("style");
    el.id = "cu-global-styles";
    el.textContent = `
    @keyframes cu-slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes cu-scale-in {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1);    }
    }
    @keyframes cu-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes cu-shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    @keyframes cu-float {
      0%, 100% { transform: translateY(0);   }
      50%       { transform: translateY(-3px); }
    }

    .cu-slide-up  { animation: cu-slide-up  0.24s cubic-bezier(0.16,1,0.3,1) both; }
    .cu-scale-in  { animation: cu-scale-in  0.22s cubic-bezier(0.16,1,0.3,1) both; }
    .cu-fade-in   { animation: cu-fade-in   0.18s ease-out both; }

    .cu-shimmer {
      background: linear-gradient(90deg, #f1f5f9 25%, #e8eef5 50%, #f1f5f9 75%);
      background-size: 600px 100%;
      animation: cu-shimmer 1.5s ease-in-out infinite;
    }

    /* ── Inputs ── */
    .cu-input {
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .cu-input:focus {
      border-color: #131E5C !important;
      box-shadow: 0 0 0 3px rgba(19,30,92,0.09) !important;
      outline: none;
      background: #fff !important;
    }

    /* ── Buttons ── */
    .cu-btn {
      transition: all 0.15s cubic-bezier(0.16,1,0.3,1);
      position: relative;
      overflow: hidden;
    }
    .cu-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0);
      transition: background 0.12s ease;
    }
    .cu-btn:hover:not(:disabled)::after { background: rgba(255,255,255,0.08); }
    .cu-btn:active:not(:disabled)       { transform: scale(0.98); }
    .cu-btn:hover:not(:disabled)        { transform: translateY(-1px); }
    .cu-btn:disabled                    { opacity: 0.5; cursor: not-allowed; }

    .cu-btn-primary {
      background: linear-gradient(135deg, #131E5C 0%, #1e3282 100%);
      box-shadow: 0 2px 10px rgba(19,30,92,0.38), inset 0 1px 0 rgba(255,255,255,0.12);
    }
    .cu-btn-primary:hover:not(:disabled) {
      box-shadow: 0 5px 18px rgba(19,30,92,0.46), inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .cu-btn-ghost {
      transition: all 0.12s ease;
    }
    .cu-btn-ghost:hover:not(:disabled) {
      background: rgba(19,30,92,0.06);
      transform: none;
    }

    /* ── Cards ── */
    .cu-card {
      transition: box-shadow 0.18s ease, transform 0.15s ease;
    }
    .cu-card-lift:hover {
      box-shadow: 0 10px 36px rgba(15,23,42,0.11);
      transform: translateY(-2px);
    }

    /* ── Task cards ── */
    .cu-task {
      transition: transform 0.15s cubic-bezier(0.16,1,0.3,1),
                  box-shadow 0.15s ease,
                  border-color 0.15s ease;
    }
    .cu-task:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(15,23,42,0.13);
    }
    .cu-task-dragging {
      transform: rotate(1.5deg) scale(1.02);
      box-shadow: 0 16px 40px rgba(15,23,42,0.22);
      opacity: 0.9;
    }

    /* ── Kanban column ── */
    .cu-kanban-col { transition: background 0.15s ease; }
    .cu-kanban-col.drop-active {
      background: rgba(19,30,92,0.03);
      outline: 2px dashed rgba(19,30,92,0.25);
      outline-offset: -4px;
      border-radius: 16px;
    }

    /* ── Modal ── */
    .cu-modal-backdrop { animation: cu-fade-in 0.18s ease both; }
    .cu-modal-panel    { animation: cu-scale-in 0.24s cubic-bezier(0.16,1,0.3,1) both; }
    @media (max-width:640px) {
      .cu-modal-panel {
        animation: cu-slide-up 0.26s cubic-bezier(0.16,1,0.3,1) both;
      }
    }

    /* ── Scrollbars ── */
    .cu-scroll::-webkit-scrollbar        { width: 4px; height: 4px; }
    .cu-scroll::-webkit-scrollbar-track  { background: transparent; }
    .cu-scroll::-webkit-scrollbar-thumb  { background: #cbd5e1; border-radius: 99px; }
    .cu-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* ── Stagger children ── */
    .cu-stagger > * { animation: cu-slide-up 0.22s cubic-bezier(0.16,1,0.3,1) both; }
    .cu-stagger > *:nth-child(1)  { animation-delay: 0ms;  }
    .cu-stagger > *:nth-child(2)  { animation-delay: 40ms; }
    .cu-stagger > *:nth-child(3)  { animation-delay: 80ms; }
    .cu-stagger > *:nth-child(4)  { animation-delay:120ms; }
    .cu-stagger > *:nth-child(5)  { animation-delay:160ms; }
    .cu-stagger > *:nth-child(6)  { animation-delay:200ms; }
    .cu-stagger > *:nth-child(n+7){ animation-delay:240ms; }

    /* ── Progress bar ── */
    .cu-progress-fill { transition: width 0.7s cubic-bezier(0.16,1,0.3,1); }

    /* ── View switch ── */
    .cu-view-active {
      background: linear-gradient(135deg,#131E5C 0%,#1e3282 100%);
      box-shadow: 0 2px 8px rgba(19,30,92,0.32);
    }
    .cu-view-btn { transition: all 0.14s ease; }
    .cu-view-btn:hover:not(.cu-view-active) {
      background: rgba(19,30,92,0.06);
      color: #131E5C;
    }

    /* ── Table row ── */
    .cu-table-row { transition: background 0.1s ease; }
    .cu-table-row:hover { background: rgba(248,250,252,0.9); }
  `;
    document.head.appendChild(el);
}

injectGlobalStyles();

/* ─── Pure helpers ──────────────────────────────────────────────────────── */
export function cls(...parts) {
    return parts.filter(Boolean).join(" ");
}

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const media = window.matchMedia(query);
        const onChange = () => setMatches(Boolean(media.matches));
        onChange();
        media.addEventListener?.("change", onChange);
        return () => media.removeEventListener?.("change", onChange);
    }, [query]);
    return matches;
}

export function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

export function toLocalDateOnly(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const raw = String(value).trim();
    if (!raw) return null;
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function parseDate(v) { return toLocalDateOnly(v); }

export function toKey(date) {
    const safe = toLocalDateOnly(date) || new Date();
    const y = safe.getFullYear();
    const m = String(safe.getMonth() + 1).padStart(2, "0");
    const d = String(safe.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
    const safe = toLocalDateOnly(date) || new Date();
    const copy = new Date(safe);
    copy.setDate(copy.getDate() + Number(days || 0));
    return copy;
}

export function diffDays(a, b) {
    const left = toLocalDateOnly(a);
    const right = toLocalDateOnly(b);
    if (!left || !right) return 0;
    const ms = 24 * 60 * 60 * 1000;
    const ua = Date.UTC(left.getFullYear(), left.getMonth(), left.getDate());
    const ub = Date.UTC(right.getFullYear(), right.getMonth(), right.getDate());
    return Math.round((ub - ua) / ms);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function formatDateShort(value) {
    if (!value) return "—";
    const date = toLocalDateOnly(value);
    if (!date) return String(value);
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function formatDateLong(value) {
    if (!value) return "Sin fecha";
    const date = toLocalDateOnly(value);
    if (!date) return String(value);
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMonth(date) {
    const safe = toLocalDateOnly(date) || new Date();
    return safe.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function flattenTasks(lists = [], tasksByList = {}) {
    const listNameById = new Map(
        (Array.isArray(lists) ? lists : []).map((item) => [Number(item.id), item.name])
    );
    const all = [];
    for (const list of Array.isArray(lists) ? lists : []) {
        const listId = Number(list.id);
        const tasks = tasksByList[listId] || tasksByList[String(listId)] || [];
        for (const task of tasks) {
            all.push({
                ...task,
                list: Number(task.list || task.list_id || listId),
                list_id: Number(task.list || task.list_id || listId),
                list_name:
                    task.list_name ||
                    listNameById.get(Number(task.list || task.list_id || listId)) ||
                    "—",
            });
        }
    }
    return all;
}

export function priorityLabel(value) {
    const labels = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", URGENT: "Urgente" };
    return labels[String(value || "MEDIUM").toUpperCase()] || String(value || "—");
}

export function priorityClasses(value) {
    const key = String(value || "MEDIUM").toUpperCase();
    if (key === "URGENT") return "border-rose-300 bg-rose-50 text-rose-700 shadow-rose-100";
    if (key === "HIGH") return "border-amber-300 bg-amber-50 text-amber-700 shadow-amber-100";
    if (key === "LOW") return "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-emerald-100";
    return "border-sky-300 bg-sky-50 text-sky-700 shadow-sky-100";
}

export function taskIsOverdue(task) {
    const due = toLocalDateOnly(task?.due_date);
    if (!due) return false;
    const today = toLocalDateOnly(new Date());
    return diffDays(today, due) < 0 && !String(task?.list_name || "").toLowerCase().includes("hecho");
}

/* ─── UI Atoms ──────────────────────────────────────────────────────────── */

/** Card container with optional hover lift */
export function Card({ children, className = "", hover = false }) {
    return (
        <div
            className={cls(
                "rounded-2xl border border-black/[0.08] bg-white shadow-sm cu-card",
                hover && "cu-card-lift cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}

/** Status pill with icon support */
export function Pill({ children, tone = "default", className = "" }) {
    const colors = {
        blue: "bg-[#131E5C]/10 text-[#131E5C] ring-[#131E5C]/20 shadow-[0_1px_4px_rgba(19,30,92,0.1)]",
        warn: "bg-amber-50 text-amber-700 ring-amber-200 shadow-amber-100",
        danger: "bg-rose-50 text-rose-700 ring-rose-200 shadow-rose-100",
        ok: "bg-emerald-50 text-emerald-700 ring-emerald-200 shadow-emerald-100",
        default: "bg-slate-50 text-slate-600 ring-black/10",
    };
    return (
        <span
            className={cls(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 shadow-sm",
                colors[tone] || colors.default,
                className
            )}
        >
            {children}
        </span>
    );
}

/** Priority badge with dot indicator */
export function PriorityBadge({ value }) {
    const key = String(value || "MEDIUM").toUpperCase();
    const dotColors = {
        URGENT: "bg-rose-500",
        HIGH: "bg-amber-500",
        LOW: "bg-emerald-500",
        MEDIUM: "bg-sky-400",
    };
    const icons = {
        URGENT: Zap,
        HIGH: TrendingDown,
        LOW: TrendingDown,
        MEDIUM: Minus,
    };
    const Icon = icons[key] || Minus;
    return (
        <span
            className={cls(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-sm",
                priorityClasses(value)
            )}
        >
            <span className={cls("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColors[key] || "bg-sky-400")} />
            {priorityLabel(value)}
        </span>
    );
}

/** Avatar stack with overlap */
export function AvatarStack({ users = [], limit = 3 }) {
    const safe = Array.isArray(users) ? users : [];
    if (!safe.length) return null;
    const visible = safe.slice(0, limit);
    const rest = safe.length - visible.length;
    const palette = [
        "bg-violet-100 text-violet-700",
        "bg-sky-100 text-sky-700",
        "bg-emerald-100 text-emerald-700",
        "bg-rose-100 text-rose-700",
        "bg-amber-100 text-amber-700",
    ];
    return (
        <div className="flex items-center">
            {visible.map((user, i) => {
                const name = user?.name || user?.email || "U";
                const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
                return (
                    <span
                        key={`${user?.id || i}-${i}`}
                        title={name}
                        className={cls(
                            "-ml-1.5 first:ml-0 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-black ring-1 ring-black/5",
                            palette[i % palette.length]
                        )}
                    >
                        {initials || "?"}
                    </span>
                );
            })}
            {rest > 0 && (
                <span className="-ml-1.5 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full border-2 border-white bg-slate-700 px-1 text-[10px] font-black text-white ring-1 ring-black/5">
                    +{rest}
                </span>
            )}
        </div>
    );
}

/** Empty state with illustration placeholder */
export function EmptyState({ title = "Sin resultados", description = "", action = null, icon = null }) {
    return (
        <div className="cu-slide-up flex flex-col items-center rounded-2xl border border-dashed border-black/15 bg-gradient-to-br from-white to-slate-50/80 p-8 text-center">
            {icon && (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-inner">
                    {icon}
                </div>
            )}
            <div className="text-sm font-extrabold text-[#131E5C]">{title}</div>
            {description && (
                <div className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-black/50">{description}</div>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

/** Shimmer skeleton card */
export function SkeletonCard({ rows = 3, className = "" }) {
    return (
        <div className={cls("overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm", className)}>
            <div className="cu-shimmer mb-3 h-4 w-3/4 rounded-lg" />
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="cu-shimmer mb-2 rounded-md"
                    style={{ height: 10, width: `${65 + (i % 3) * 12}%`, animationDelay: `${i * 0.1}s` }}
                />
            ))}
            <div className="mt-4 flex gap-2">
                <div className="cu-shimmer h-6 w-16 rounded-full" />
                <div className="cu-shimmer h-6 w-12 rounded-full" style={{ animationDelay: "0.15s" }} />
            </div>
        </div>
    );
}

/** Progress bar */
export function ProgressBar({ value = 0, max = 100, color = "#131E5C", className = "" }) {
    const pct = Math.round(clamp((value / Math.max(max, 1)) * 100, 0, 100));
    return (
        <div className={cls("h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]", className)}>
            <div
                className="cu-progress-fill h-full rounded-full"
                style={{ width: `${pct}%`, background: color }}
            />
        </div>
    );
}

/* ─── Modal ─────────────────────────────────────────────────────────────── */
export function Modal({ open, title, onClose, children, footer, maxWidth = "max-w-lg" }) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <button
                type="button"
                aria-label="Cerrar"
                className="cu-modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className={cls(
                    "cu-modal-panel relative z-10 w-full overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl",
                    maxWidth
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/[0.07] bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="h-5 w-1 rounded-full bg-[#131E5C]" />
                        <h3 className="text-[15px] font-black tracking-tight text-[#131E5C]">{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cu-btn cu-btn-ghost inline-flex h-8 w-8 items-center justify-center rounded-xl border border-black/[0.08] text-black/50 hover:text-black/80"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="cu-scroll max-h-[70vh] overflow-y-auto p-5">{children}</div>
                {/* Footer */}
                {footer && (
                    <div className="border-t border-black/[0.07] bg-slate-50/80 px-5 py-3.5">{footer}</div>
                )}
            </div>
        </div>
    );
}

/* ─── ViewSwitch ─────────────────────────────────────────────────────────── */
export function ViewSwitch({ view, setView, items }) {
    return (
        <div className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] bg-slate-50/80 p-1 shadow-inner">
            {items.map(({ id, label, icon: Icon }) => {
                const active = view === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setView(id)}
                        className={cls(
                            "cu-view-btn inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-extrabold transition",
                            active
                                ? "cu-view-active text-white shadow-sm"
                                : "text-black/55"
                        )}
                        title={label}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}