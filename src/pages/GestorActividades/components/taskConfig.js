export const CATEGORIES = {
    work:        { label: "Trabajo",        bg: "bg-emerald-50",   text: "text-emerald-700",   border: "border-emerald-200",   dot: "bg-emerald-500" },
    development: { label: "Desarrollo",     bg: "bg-violet-50",    text: "text-violet-700",    border: "border-violet-200",    dot: "bg-violet-500" },
    design:      { label: "Diseño",         bg: "bg-amber-50",     text: "text-amber-700",     border: "border-amber-200",     dot: "bg-amber-500" },
    research:    { label: "Investigación",  bg: "bg-teal-50",      text: "text-teal-700",      border: "border-teal-200",      dot: "bg-teal-500" },
    personal:    { label: "Personal",       bg: "bg-orange-50",    text: "text-orange-700",    border: "border-orange-200",    dot: "bg-orange-500" },
    health:      { label: "Salud",          bg: "bg-slate-100",    text: "text-slate-600",     border: "border-slate-200",     dot: "bg-slate-500" },
    blocked:     { label: "Bloqueado",      bg: "bg-rose-50",      text: "text-rose-600",      border: "border-rose-200",      dot: "bg-rose-400" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const PRIORITIES = {
    LOW:    { label: "Baja",    bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", dot: "bg-emerald-500" },
    MEDIUM: { label: "Media",   bg: "bg-sky-50",     text: "text-sky-600",     border: "border-sky-200",     dot: "bg-sky-500" },
    HIGH:   { label: "Alta",    bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200",   dot: "bg-amber-500" },
    URGENT: { label: "Urgente", bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200",    dot: "bg-rose-500" },
};

export const PRIORITY_KEYS = Object.keys(PRIORITIES);
