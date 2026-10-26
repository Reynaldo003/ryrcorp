//src/pages/TimeForAction/TimeForAction.jsx
import { useEffect, useState, useMemo, useCallback, useRef, Fragment } from "react";
import { jsPDF } from "jspdf";
import {
    Plus, X, ChevronDown, ChevronRight, Paperclip,
    Trash2, Pencil, CheckCircle2, Clock3,
    Zap, Search, Calendar, Target,
    LayoutGrid, Table2, GitBranch,
    ArrowUpDown, ChevronUp, Loader2, Save, UsersRound,
    AlertTriangle, UserPlus, Mail, Check, EyeOff, Layers, Briefcase, PlayCircle, CheckSquare, FileText, LayoutDashboard, GripVertical, Info
} from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";
import { API_ROOT } from "../../lib/apiClient";
import { VW_HEAD_BOLD, VW_TEXT_LIGHT } from "../../assets/fonts/vwFonts.js";
import { useSyncTasks, notifyTasksChanged } from "../../hooks/useSyncTasks";

// ─────────────────────────────────────────────────────────────
// COLORES CORPORATIVOS
const BRAND_NAVY = "#001E50";
const BRAND_NAVY_DARK = "#0A1340";
const BRAND_ACCENT = "#1677FF";

const PRIORITIES = [
    { value: "LOW", label: "Baja", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { value: "MEDIUM", label: "Media", color: "bg-sky-50 text-sky-700 border-sky-200" },
    { value: "HIGH", label: "Alta", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { value: "URGENT", label: "Urgente", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const STATUS_COLS = ["Por hacer", "En proceso", "Hecho"];

const STATUS_COLORS = {
    "Por hacer": { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400", bar: "#94a3b8", icon: Clock3 },
    "En proceso": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", bar: "#3b82f6", icon: PlayCircle },
    "Hecho": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", bar: "#10b981", icon: CheckSquare },
};

const opcionesRaiz = {
    "Gestion de Clientes": [
        "Respuestas lentas a las quejas", "Falta de seguimiento postventa",
        "Encuestas de satisfacción poco frecuentes o inexistentes",
        "Mala gestión de la experiencia del cliente en el showroom",
        "Falta de personal dedicado a la atención al cliente",
        "Tiempos de espera prolongados para servicios de mantenimiento",
        "Falta de comunicación proactiva con los clientes", "Carencia de programas de fidelización",
        "Problemas en la gestión de citas y servicios programados",
        "Deficiencias en la personalización del servicio",
        "Falta de transparencia en la información proporcionada a los clientes",
        "Deficiencias en la gestión de la imagen y reputación",
        "Falta de atención a los comentarios y reseñas", "Problemas en la gestión de garantías",
        "Falta de ofertas y promociones atractivas", "Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados", "Mal uso de CRM",
        "Problemas en la gestión de reclamaciones y devoluciones",
    ],
    Metodo: [
        "Procesos complejos", "Procesos poco explícitos", "Incumplimiento en la ejecución", "Procesos limitados",
        "Falta de documentación y registro", "Falta de integración entre departamentos",
        "Inconsistencias en la aplicación", "Procesos no optimizados",
        "Falta de estandarización en la atención al cliente",
        "Ausencia de procedimientos claros para la gestión de garantías",
        "Falta de protocolos para la entrega de vehículos nuevos",
        "Falta de automatización en procesos administrativos", "Retrasos en la tramitación de documentos",
        "Ineficiencia en la programación de citas", "Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia", "Deficiencias en el control de calidad",
        "Falta de auditorías internas periódicas", "Problemas en la implementación de sistemas ERP",
        "Deficiencias en la gestión de proyectos", "Falta de revisiones periódicas",
        "Procedimientos redundantes", "Falta de actualización de manuales operativos",
        "Uso ineficiente de recursos", "Falta de un sistema de gestión de calidad total",
    ],
    Materiales: [
        "Insuficiencia de materiales", "Materiales en mal estado", "Materiales descalibrados",
        "Difícil disponibilidad", "Costos elevados", "Variabilidad en la calidad", "Obsolescencia",
        "Falta de stock de piezas de alta demanda", "Problemas con proveedores no confiables",
        "Almacenamiento inadecuado de piezas", "Pérdidas por deterioro", "Falta de control de inventarios",
        "Gestión ineficaz de devoluciones", "Uso de materiales no homologados",
        "Falta de piezas específicas para ciertos modelos", "Problemas en la logística de entrega",
        "Retrasos en la recepción de materiales importados", "Problemas en la aduana",
        "Roturas durante el transporte", "Embalajes inadecuados", "Falta de previsión en pedidos",
        "Fallos en la trazabilidad de piezas",
    ],
    Infraestructura: [
        "Problemas de orden", "Problemas de limpieza", "Instalaciones pequeñas",
        "Problemas de suministro de servicios básicos", "Equipos obsoletos",
        "Falta de áreas de descanso adecuadas", "Problemas de seguridad",
        "Deficiencias en el almacenamiento", "Falta de estacionamiento para clientes",
        "Infraestructura inadecuada para la exhibición de vehículos",
        "Problemas de accesibilidad para personas con discapacidades",
        "Insuficiente espacio para talleres de reparación",
        "Iluminación inadecuada en áreas de trabajo", "Sistemas de ventilación deficientes",
        "Señalización ineficaz dentro de las instalaciones", "Falta de mantenimiento preventivo",
        "Problemas con sistemas de climatización", "Infraestructuras tecnológicas desactualizadas",
        "Falta de salas de reuniones adecuadas", "Instalaciones sanitarias insuficientes",
        "Falta de zonas verdes", "Problemas de acústica en oficinas",
        "Instalaciones eléctricas inadecuadas", "Falta de sistemas de gestión ambiental",
    ],
    "Talento Humano": [
        "Falta de capacitación", "Falta de adiestramiento", "Problemas de comunicación", "Desmotivación",
        "Conflictos laborales", "Alta rotación de personal", "Falta de reconocimiento",
        "Cargas de trabajo excesivas", "Ausentismo", "Falta de liderazgo efectivo",
        "Insuficiente personal de ventas durante picos de demanda",
        "Falta de técnicos especializados en postventa",
        "Ausencia de programas de desarrollo profesional y mentoría",
        "Evaluación de desempeño inadecuada", "Falta de incentivos y bonificaciones",
        "Falta de claridad en las expectativas laborales",
        "Escasa participación de los empleados en la toma de decisiones",
        "Deficiencias en la gestión del talento", "Falta de programas de bienestar laboral",
        "Problemas con la gestión del tiempo", "Personal de nuevo ingreso",
        "Problemas de retención de talento clave", "Baja moral del equipo",
        "Falta de diversidad e inclusión", "Problemas con la conciliación laboral y familiar",
        "Ausencia de un plan de carrera claro", "Falta de apoyo psicológico",
        "Falta de programas de salud y seguridad laboral",
    ],
};

function cls(...a) { return a.filter(Boolean).join(" "); }

// ─────────────────────────────────────────────────────────────
// HELPERS COMPARTIDOS
// ─────────────────────────────────────────────────────────────
const dateToInput = (val) => {
    if (!val) return "";
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const n = Number(s);
    if (!isNaN(n) && n > 0) return new Date(n).toISOString().slice(0, 10);
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return "";
};

// Fecha LOCAL (evita el desfase de un día que causa new Date("2026-10-24T00:00:00Z") en México)
const parseLocalDate = (val) => {
    const s = dateToInput(val);
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const localISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const readSubDates = (sub) => ({
    rawStart: sub.start_date || sub.fecha_inicio || sub.startDate || sub.fechaInicio || sub.inicio || null,
    rawEnd: sub.due_date || sub.fecha_fin || sub.dueDate || sub.fechaFin || sub.fin || null,
});

const FIELD = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#001E50] font-medium outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 transition-all";
const LABEL = "text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block";



function PriorityBadge({ value }) {
    const p = PRIORITIES.find(x => x.value === value) || PRIORITIES[1];
    return (
        <span className={cls("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider", p.color)}>
            {p.label}
        </span>
    );
}

function StatusBadge({ name }) {
    const c = STATUS_COLORS[name] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" };
    return (
        <span className={cls("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider", c.bg, c.text, c.border)}>
            <span className={cls("h-1.5 w-1.5 rounded-full", c.dot)} />
            {name || "—"}
        </span>
    );
}

function UserAvatar({ user, size = "sm" }) {
    const initial = user?.name?.[0] || user?.nombre_completo?.[0] || user?.email?.[0] || "?";
    const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
    return (
        <div className={`rounded-full bg-[#1677FF]/10 border border-[#1677FF]/20 flex items-center justify-center font-bold text-[#1677FF] ${sizeClass}`}>
            {initial.toUpperCase()}
        </div>
    );
}

function CausaRaiz({ causa, raiz, onChangeCausa, onChangeRaiz }) {
    const raices = useMemo(() => opcionesRaiz[causa] || [], [causa]);
    const base = "w-full rounded-lg border px-3 py-2 text-sm text-[#001E50] font-medium outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 bg-white border-slate-200 transition-all";
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div>
                <div className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría Causa</div>
                <select value={causa || ""} onChange={e => { onChangeCausa(e.target.value); onChangeRaiz(""); }} className={base}>
                    <option value="">Selecciona una categoría...</option>
                    {Object.keys(opcionesRaiz).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <div className="mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Causa Raíz Específica</div>
                <select value={raiz || ""} onChange={e => onChangeRaiz(e.target.value)}
                    disabled={!causa || raices.length === 0}
                    className={cls(base, "disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed")}>
                    <option value="">{!causa ? "Selecciona categoría primero" : raices.length ? "Selecciona una raíz..." : "Sin opciones"}</option>
                    {raices.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        </div>
    );
}

function SubtaskRow({ sub, onToggle, onDelete, onChangeDate }) {
    const startVal = sub.start_date || sub.fecha_inicio || sub.startDate || sub.fechaInicio || sub.inicio || "";
    const dueVal = sub.due_date || sub.fecha_fin || sub.dueDate || sub.fechaFin || sub.fin || "";

    const toInputDate = (val) => {
        if (!val) return "";
        const s = String(val);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        const n = Number(s);
        if (!isNaN(n) && n > 0) return new Date(n).toISOString().slice(0, 10);
        const d = new Date(s);
        if (!isNaN(d)) return d.toISOString().slice(0, 10);
        return "";
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 hover:border-[#1677FF]/30 transition-colors shadow-sm">
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => onToggle(sub.id)}
                    className={cls("shrink-0 rounded-md border h-5 w-5 flex items-center justify-center transition-all",
                        sub.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-[#1677FF] bg-slate-50")}>
                    {sub.done ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
                <span className={cls("flex-1 min-w-0 truncate text-sm font-medium", sub.done ? "line-through text-slate-400" : "text-[#001E50]")}>{sub.title}</span>
                <button type="button" onClick={() => onDelete(sub.id)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-7">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Inicio</span>
                    <input type="date" value={toInputDate(startVal)}
                        onChange={e => onChangeDate(sub.id, "start_date", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-[#001E50] font-medium outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 transition-all" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fin</span>
                    <input type="date" value={toInputDate(dueVal)}
                        onChange={e => onChangeDate(sub.id, "due_date", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-[#001E50] font-medium outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 transition-all" />
                </div>
            </div>
        </div>
    );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transform transition-all">
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 border border-rose-200">
                            <AlertTriangle className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-[#001E50] tracking-tight">{title}</div>
                            <div className="text-sm text-slate-500 mt-1 leading-snug">{message}</div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button type="button" onClick={onConfirm} disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeamsModal({ open, onClose, onCreated }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [inviteSearch, setInviteSearch] = useState("");
    const [inviteResults, setInviteResults] = useState([]);
    const [inviteSearching, setInviteSearching] = useState(false);
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [invitesByTeam, setInvitesByTeam] = useState({});
    const [membersByTeam, setMembersByTeam] = useState({});
    const [loadingInvites, setLoadingInvites] = useState({});
    const [sendingInvite, setSendingInvite] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [hiddenInvites, setHiddenInvites] = useState({});
    const [acceptingInvite, setAcceptingInvite] = useState({});

    function extractArray(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.members)) return data.members;
        if (Array.isArray(data.usuarios)) return data.usuarios;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
        if (data.team && Array.isArray(data.team.members)) return data.team.members;
        const vals = Object.values(data);
        const firstArr = vals.find(v => Array.isArray(v));
        if (firstArr) return firstArr;
        return [];
    }

    function normalizeMember(m) {
        const inner = m.usuario || m.user || m;
        return {
            id: m.id || m.user_id || m.usuario_id || inner.id || inner.id_usuario,
            name: inner.nombre_completo || inner.nombre || inner.name || m.nombre_completo || m.nombre || m.name || m.email || "—",
            email: inner.correo || inner.email || m.correo || m.email || "—",
            role: m.role || m.rol || m.rol_nombre || inner.role || "MEMBER",
        };
    }

    function normalizeInvite(inv) {
        const inner = inv.invited_user || inv.usuario_invitado || {};
        return {
            id: inv.id,
            name: inner.nombre_completo || inner.nombre || inner.name || inv.nombre || inv.email || "Usuario",
            email: inv.email || inv.correo || inner.email || inner.correo || "",
            role: inv.role || inv.rol || "MEMBER",
            status: inv.status || inv.estado || "PENDING",
        };
    }

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClickup.listTeams();
            const arr = Array.isArray(data) ? data : [];
            setTeams(arr);
            if (arr.length > 0 && !selectedTeam) setSelectedTeam(arr[0]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const loadTeamData = useCallback(async (teamId) => {
        if (!teamId) return;
        setLoadingInvites(p => ({ ...p, [teamId]: true }));
        try {
            const [membersResult, invitesResult] = await Promise.allSettled([
                apiClickup.listMembers(teamId),
                apiClickup.listInvites(teamId),
            ]);
            const membersRaw = membersResult.status === "fulfilled" ? membersResult.value : [];
            const invitesRaw = invitesResult.status === "fulfilled" ? invitesResult.value : [];
            const normalizedMembers = extractArray(membersRaw).map(normalizeMember);
            const normalizedInvites = extractArray(invitesRaw).map(normalizeInvite);

            setMembersByTeam(p => ({ ...p, [teamId]: normalizedMembers }));
            setInvitesByTeam(p => ({ ...p, [teamId]: normalizedInvites }));
        } catch (e) {
            console.error("[TeamsModal] loadTeamData error:", e);
            setMembersByTeam(p => ({ ...p, [teamId]: [] }));
            setInvitesByTeam(p => ({ ...p, [teamId]: [] }));
        } finally {
            setLoadingInvites(p => ({ ...p, [teamId]: false }));
        }
    }, []);

    useEffect(() => { if (open) fetchTeams(); }, [open, fetchTeams]);
    useEffect(() => { if (selectedTeam?.id) loadTeamData(selectedTeam.id); }, [selectedTeam]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!inviteSearch.trim() || inviteSearch.length < 2) { setInviteResults([]); return; }
            setInviteSearching(true);
            try { const r = await apiClickup.searchUsers(inviteSearch); setInviteResults(Array.isArray(r) ? r : []); }
            catch (e) { setInviteResults([]); }
            finally { setInviteSearching(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [inviteSearch]);

    async function createTeam() {
        if (!name.trim()) return;
        setCreating(true);
        try {
            await apiClickup.createTeam({ name: name.trim(), description: descripcion.trim() });
            setName(""); setDescripcion("");
            await fetchTeams(); onCreated?.();
        } catch (e) { alert(e.message || "Error al crear equipo"); }
        finally { setCreating(false); }
    }

    async function deleteTeam() {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await apiClickup.deleteTeam(Number(confirmDelete.id));
            setConfirmDelete(null);
            await fetchTeams(); onCreated?.();
        } catch (e) { alert(e.message || "Error al eliminar equipo"); }
        finally { setDeleting(false); }
    }

    async function sendInvite() {
        if (!selectedTeam || !selectedUser) { alert("Selecciona un usuario primero"); return; }
        setSendingInvite(true);
        try {
            await apiClickup.invite(selectedTeam.id, { usuario_id: Number(selectedUser.id), rol: inviteRole });
            await loadTeamData(selectedTeam.id);
            setSelectedUser(null); setInviteSearch(""); setInviteResults([]); setInviteRole("MEMBER");
        } catch (e) { alert(e.message || "Error al enviar invitación"); }
        finally { setSendingInvite(false); }
    }

    async function acceptInvite(inv) {
        if (!selectedTeam) return;
        setAcceptingInvite(p => ({ ...p, [inv.id]: true }));
        try {
            await apiClickup.acceptInvite(selectedTeam.id, inv.id);
            setHiddenInvites(p => ({ ...p, [inv.id]: true }));
            await loadTeamData(selectedTeam.id);
            onCreated?.();
        } catch (e) {
            if (e.message?.includes("ACCEPTED") || e.status === 400) {
                setHiddenInvites(p => ({ ...p, [inv.id]: true }));
                await loadTeamData(selectedTeam.id);
                onCreated?.();
            } else { alert(e.message || "No se pudo aceptar la invitación"); }
        } finally { setAcceptingInvite(p => ({ ...p, [inv.id]: false })); }
    }

    function hideInvite(invId) { setHiddenInvites(p => ({ ...p, [invId]: true })); }

    if (!open) return null;
    const inputBase = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[#001E50] font-medium outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 focus:bg-white transition-all";
    const visibleInvites = (invitesByTeam[selectedTeam?.id] || []).filter(inv => !hiddenInvites[inv.id]);

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
                <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style={{ maxHeight: "85vh" }}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10" style={{ background: `linear-gradient(to right, ${BRAND_NAVY}, ${BRAND_NAVY_DARK})` }}>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg"><UsersRound className="h-5 w-5 text-white" /></div>
                            <h3 className="text-lg font-black text-white tracking-tight">Gestión de Equipos</h3>
                        </div>
                        <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-colors"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex h-full" style={{ maxHeight: "calc(85vh - 76px)" }}>
                        <div className="w-2/5 border-r border-slate-200 bg-slate-50 p-6 overflow-y-auto">
                            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Crear Equipo</div>
                            <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <input value={name} onChange={e => setName(e.target.value)} className={inputBase} placeholder="Nombre del equipo" />
                                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} className={inputBase} placeholder="Descripción (opcional)" />
                                <button disabled={creating || !name.trim()} onClick={createTeam}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: BRAND_ACCENT }}>
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{creating ? "Creando..." : "Crear equipo"}
                                </button>
                            </div>

                            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Mis equipos</div>
                            {loading
                                ? <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/50" />)}</div>
                                : teams.length === 0
                                    ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 font-medium">Sin equipos registrados</div>
                                    : <div className="space-y-2">{teams.map(t => (
                                        <div key={t.id} onClick={() => setSelectedTeam(t)}
                                            className={cls("flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all",
                                                selectedTeam?.id === t.id ? "border-[#1677FF] bg-[#1677FF]/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm")}>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-[#001E50] truncate">{t.name}</div>
                                                {t.description && <div className="text-xs text-slate-500 truncate mt-0.5">{t.description}</div>}
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); setConfirmDelete(t); }}
                                                className="ml-3 shrink-0 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}</div>
                            }
                        </div>
                        <div className="w-3/5 bg-white p-6 overflow-y-auto">
                            {!selectedTeam ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                                    <div className="bg-slate-50 p-4 rounded-full mb-4"><UsersRound className="h-10 w-10 text-slate-300" /></div>
                                    <div className="text-base font-bold text-[#001E50]">Selecciona un equipo</div>
                                    <div className="text-sm text-slate-500 mt-1">Elige un equipo del panel lateral para administrar sus miembros e invitaciones.</div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Administrando</div>
                                        <div className="text-xl font-black text-[#001E50]">{selectedTeam.name}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="text-sm font-bold text-[#001E50] mb-3 flex items-center gap-2"><UserPlus className="h-4 w-4 text-[#1677FF]" />Invitar miembro</div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} className={cls(inputBase, "pl-9 mb-3")} placeholder="Buscar usuario por nombre o correo..." />
                                        </div>
                                        {inviteSearching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
                                        {inviteResults.length > 0 && !inviteSearching && (
                                            <div className="mb-4 border border-slate-200 rounded-xl bg-white overflow-hidden max-h-48 overflow-y-auto shadow-sm">
                                                {inviteResults.map(user => (
                                                    <button key={user.id} onClick={() => { setSelectedUser(user); setInviteSearch(""); setInviteResults([]); }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors flex items-center gap-3">
                                                        <UserAvatar user={user} />
                                                        <div>
                                                            <div className="text-sm font-bold text-[#001E50]">{user.name}</div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {selectedUser && (
                                            <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={selectedUser} />
                                                    <div><div className="text-sm font-bold text-sky-900">{selectedUser.name}</div><div className="text-xs text-sky-700">{selectedUser.email}</div></div>
                                                </div>
                                                <button onClick={() => { setSelectedUser(null); setInviteSearch(""); }} className="p-1 text-sky-600 hover:bg-sky-100 rounded-lg"><X className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className={cls(inputBase, "flex-1 bg-white")}>
                                                <option value="MEMBER">Miembro</option>
                                                <option value="ADMIN">Administrador</option>
                                                <option value="VIEWER">Lector</option>
                                            </select>
                                            <button onClick={sendInvite} disabled={!selectedUser || sendingInvite}
                                                className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50"
                                                style={{ backgroundColor: BRAND_ACCENT }}>
                                                {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}Enviar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Miembros */}
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                            <UsersRound className="h-4 w-4" />
                                            Miembros Activos ({membersByTeam[selectedTeam.id]?.length || 0})
                                        </div>
                                        {loadingInvites[selectedTeam.id]
                                            ? <div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin text-slate-300 mx-auto" /></div>
                                            : !membersByTeam[selectedTeam.id] || membersByTeam[selectedTeam.id].length === 0
                                                ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 font-medium">Sin miembros asignados</div>
                                                : <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                                                    {membersByTeam[selectedTeam.id].map((m, idx) => (
                                                        <div key={m.id || idx} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 transition-colors shadow-sm">
                                                            <UserAvatar user={m} size="md" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-bold text-[#001E50] truncate">{m.name}</div>
                                                                <div className="text-xs text-slate-500 truncate">{m.email}</div>
                                                            </div>
                                                            <div className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.role}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                        }
                                    </div>

                                    {/* Invitaciones */}
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Invitaciones Pendientes ({visibleInvites.length})
                                        </div>
                                        {visibleInvites.length === 0
                                            ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 font-medium">No hay invitaciones en espera</div>
                                            : <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                                {visibleInvites.map(inv => (
                                                    <div key={inv.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-bold text-amber-900 truncate">{inv.name}</div>
                                                            {inv.email && <div className="text-xs text-amber-700/80 truncate mt-0.5">{inv.email}</div>}
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4 shrink-0">
                                                            <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-wider hidden sm:block mr-2">Rol: {inv.role}</span>
                                                            <button onClick={() => acceptInvite(inv)} disabled={!!acceptingInvite[inv.id]}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                                                {acceptingInvite[inv.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Aceptar
                                                            </button>
                                                            <button onClick={() => hideInvite(inv.id)} title="Ocultar notificación"
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors">
                                                                <EyeOff className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmDialog open={!!confirmDelete} title="Eliminar equipo" message={`¿Seguro que deseas eliminar el equipo "${confirmDelete?.name}"? Se perderán todas sus configuraciones.`} onConfirm={deleteTeam} onCancel={() => setConfirmDelete(null)} loading={deleting} />
        </>
    );
}

function PdfThumb({ url, file }) {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        let cancelled = false;
        setStatus("loading");

        async function render() {
            try {
                if (!window.pdfjsLib) {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement("script");
                        s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
                        s.onload = resolve;
                        s.onerror = reject;
                        document.head.appendChild(s);
                    });
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                }

                if (cancelled) return;

                let arrayBuffer = null;

                if (file instanceof File) {
                    arrayBuffer = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = reject;
                        reader.readAsArrayBuffer(file);
                    });
                } else if (url) {
                    try {
                        const authRaw = localStorage.getItem("auth") || "{}";
                        const authData = JSON.parse(authRaw);
                        const token = authData?.token || authData?.access_token || authData?.accessToken || "";
                        const r = await fetch(url, {
                            mode: "cors",
                            credentials: "include",
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        if (r.ok) arrayBuffer = await r.arrayBuffer();
                    } catch { /* silenciar */ }
                }

                if (cancelled) return;
                if (!arrayBuffer) { setStatus("error"); return; }

                const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                if (cancelled) return;

                const page = await pdf.getPage(1);
                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({ scale: 1 });
                const scale = 90 / viewport.height;
                const scaled = page.getViewport({ scale });

                canvas.width = scaled.width;
                canvas.height = scaled.height;

                await page.render({ canvasContext: canvas.getContext("2d"), viewport: scaled }).promise;
                if (!cancelled) setStatus("done");
            } catch (e) {
                console.warn("[PdfThumb]", e);
                if (!cancelled) setStatus("error");
            }
        }

        render();
        return () => { cancelled = true; };
    }, [url, file]);

    if (status === "error")
        return (
            <div className="flex flex-col items-center gap-1.5">
                <span className="text-3xl text-rose-400">📄</span>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Error PDF</span>
            </div>
        );

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-50 overflow-hidden border-b border-slate-200">
            {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cargando</span>
                </div>
            )}
            <canvas
                ref={canvasRef}
                style={{
                    display: status === "done" ? "block" : "none",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
            />
        </div>
    );
}

/* TASK MODAL */
function TaskModal({ open, onClose, task, lists, teamId, onSaved }) {
    const [title, setTitle] = useState("");
    const [listId, setListId] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [due, setDue] = useState("");
    const [start, setStart] = useState("");
    const [problema, setProblema] = useState("");
    const [causa, setCausa] = useState("");
    const [raiz, setRaiz] = useState("");
    const [subtasks, setSubtasks] = useState([]);
    const [newSub, setNewSub] = useState("");
    const [estrategia, setEstrategia] = useState("");
    const [resultados, setResultados] = useState("");
    const [evidencias, setEvidencias] = useState([]);
    const [saving, setSaving] = useState(false);
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [assigneeSearch, setAssigneeSearch] = useState("");
    const [assigneeResults, setAssigneeResults] = useState([]);
    const [searchingAssignees, setSearchingAssignees] = useState(false);
    const [evidenciasExistentes, setEvidenciasExistentes] = useState([]);

    const toInputDate = (val) => {
        if (!val) return "";
        const s = String(val);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        const n = Number(s);
        if (!isNaN(n) && n > 0) return new Date(n).toISOString().slice(0, 10);
        const d = new Date(s);
        if (!isNaN(d)) return d.toISOString().slice(0, 10);
        return "";
    };

    useEffect(() => {
        if (!open) return;
        setTitle(task?.title || "");
        setListId(task?.list ? String(task.list) : (lists[0]?.id ? String(lists[0].id) : ""));
        setPriority(task?.priority || "MEDIUM");
        setStart(task?.start_date ? toInputDate(task.start_date) : "");
        setDue(task?.due_date ? toInputDate(task.due_date) : "");
        setProblema(task?.descripcion_problema || "");
        setCausa(task?.causa || "");
        setRaiz(task?.raiz || "");
        setEstrategia(task?.desarrollo_estrategia || "");
        setResultados(task?.resultados || "");
        setSubtasks(Array.isArray(task?.subtareas) ? task.subtareas.map(s => ({
            id: s.id || Math.random(),
            title: s.title || s.titulo || "",
            done: !!s.done,
            start_date: toInputDate(s.start_date || s.fecha_inicio || s.startDate || s.fechaInicio || s.inicio || ""),
            due_date: toInputDate(s.due_date || s.fecha_fin || s.dueDate || s.fechaFin || s.fin || ""),
        })) : []);
        setEvidencias([]);
        setEvidenciasExistentes(Array.isArray(task?.evidencias) ? task.evidencias : []);
        setAssignedUsers(Array.isArray(task?.asignados) ? task.asignados.map(a => ({ id: a.user_id, name: a.name, email: a.email })) : []);
    }, [open, task?.id]);

    function addSubtask() {
        const t = newSub.trim();
        if (!t) return;
        setSubtasks(prev => [...prev, { id: Math.random(), title: t, done: false, start_date: "", due_date: "" }]);
        setNewSub("");
    }

    function updateSubDate(id, field, val) {
        setSubtasks(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    }

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!assigneeSearch.trim() || assigneeSearch.length < 2) { setAssigneeResults([]); return; }
            setSearchingAssignees(true);
            try { const r = await apiClickup.searchUsers(assigneeSearch); setAssigneeResults(Array.isArray(r) ? r : []); }
            catch (e) { setAssigneeResults([]); }
            finally { setSearchingAssignees(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [assigneeSearch]);

    async function handleSave() {
        if (!title.trim() || !listId || !teamId) return;
        setSaving(true);
        try {
            const payload = {
                lista: Number(listId), titulo: title.trim(), prioridad: priority,
                inicio: start ? `${start}T00:00:00Z` : null,
                vence: due ? `${due}T00:00:00Z` : null,
                descripcion_problema: problema.trim(), causa: causa.trim(), raiz: raiz.trim(),
                desarrollo_estrategia: estrategia.trim(), resultados: resultados.trim(),
                subtareas: subtasks.map(s => ({ titulo: s.title, done: s.done, start_date: s.start_date || null, due_date: s.due_date || null })),
                asignados_ids: assignedUsers.map(u => u.id),
            };
            let currentTaskId = task?.id;
            if (task?.id) {
                await apiClickup.updateTask(Number(teamId), Number(task.id), payload);
            } else {
                const nt = await apiClickup.createTask(Number(teamId), payload);
                if (nt?.id) currentTaskId = nt.id;
            }
            if (evidencias.length && currentTaskId) {
                await apiClickup.uploadTaskEvidence(Number(teamId), Number(currentTaskId), { tipo: "RESOLUTION", comentario: "Evidencias del plan de acción", archivos: evidencias });
            }
            onSaved?.(); onClose();
        } catch (e) { console.error(e); alert(e.message || "Error al guardar"); }
        finally { setSaving(false); }
    }

    if (!open) return null;
    const inputBase = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-[#001E50] font-medium outline-none focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 focus:bg-white transition-all";
    const doneCount = subtasks.filter(s => s.done).length;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl flex flex-col max-h-[90vh] transform transition-all">

                {/* Header Gradient */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0" style={{ background: `linear-gradient(to right, ${BRAND_NAVY}, ${BRAND_NAVY_DARK})` }}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg"><Layers className="h-5 w-5 text-sky-300" /></div>
                        <h3 className="text-lg font-black tracking-tight text-white">{task?.id ? "Editar Plan de Acción" : "Nuevo Plan de Acción"}</h3>
                    </div>
                    <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-colors"><X className="h-4 w-4" /></button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-8 scrollbar-thin">
                    <section>
                        <div className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Target className="h-4 w-4" /> Información General</div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Título del Plan *</label><input value={title} onChange={e => setTitle(e.target.value)} className={inputBase} placeholder="Ej. Optimización de procesos en Showroom" /></div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Fase / Estatus</label><select value={listId} onChange={e => setListId(e.target.value)} className={inputBase}>{lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Prioridad</label><select value={priority} onChange={e => setPriority(e.target.value)} className={inputBase}>{PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha de inicio</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className={inputBase} /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Fecha límite</label><input type="date" value={due} onChange={e => setDue(e.target.value)} className={inputBase} /></div>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-slate-100" />

                    <section>
                        <div className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Desarrollo del Plan</div>
                        <div className="space-y-5">
                            <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Descripción del Problema</label><textarea value={problema} onChange={e => setProblema(e.target.value)} className={cls(inputBase, "min-h-[100px] resize-y")} placeholder="Describe detalladamente el problema que se está abordando..." /></div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                                <div className="mb-4 text-sm font-black text-[#001E50]">Análisis de Causa y Raíz</div>
                                <CausaRaiz causa={causa} raiz={raiz} onChangeCausa={setCausa} onChangeRaiz={setRaiz} />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 text-sm font-black text-[#001E50]">Estrategia a Implementar</div>
                                <textarea value={estrategia} onChange={e => setEstrategia(e.target.value)} rows={4} className={cls(inputBase, "min-h-[120px] resize-y")} placeholder="Describe los pasos clave y la estrategia general de resolución..." />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                                    <div className="text-sm font-black text-[#001E50] flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-[#1677FF]" />
                                        Desglose de Subtareas
                                        {subtasks.length > 0 && <span className="ml-2 rounded-md bg-[#1677FF]/10 text-[#1677FF] px-2 py-0.5 text-xs border border-[#1677FF]/20">{doneCount}/{subtasks.length}</span>}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibles en Gantt Timeline</span>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === "Enter" && addSubtask()} className={cls(inputBase, "flex-1 bg-white")} placeholder="Escribe una nueva subtarea y presiona Enter..." />
                                    <button onClick={addSubtask} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 shadow-sm" style={{ backgroundColor: BRAND_ACCENT }}><Plus className="h-4 w-4" /></button>
                                </div>
                                {subtasks.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400 font-medium">No hay subtareas definidas. Agrega una arriba.</div>
                                ) : (
                                    <div className="grid gap-3">
                                        {subtasks.map(s => (
                                            <SubtaskRow key={s.id} sub={s}
                                                onToggle={id => setSubtasks(p => p.map(x => x.id === id ? { ...x, done: !x.done } : x))}
                                                onDelete={id => setSubtasks(p => p.filter(x => x.id !== id))}
                                                onChangeDate={updateSubDate} />
                                        ))}
                                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 text-sm font-black text-[#001E50]">Resultados Esperados</div>
                                <textarea value={resultados} onChange={e => setResultados(e.target.value)} rows={3} className={cls(inputBase, "min-h-[90px] resize-y")} placeholder="¿Cuáles son los KPIs o resultados concretos esperados al finalizar?" />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                                <div className="mb-4 text-sm font-black text-[#001E50] flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#1677FF]" />Asignación de Responsables</div>
                                {assignedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {assignedUsers.map(user => (
                                            <div key={user.id} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 shadow-sm">
                                                <UserAvatar user={user} size="sm" />
                                                <span className="text-sm font-bold text-[#001E50]">{user.name}</span>
                                                <button onClick={() => setAssignedUsers(p => p.filter(u => u.id !== user.id))} className="text-slate-400 hover:text-rose-500 ml-1 transition-colors"><X className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} className={cls(inputBase, "pl-9 bg-white")} placeholder="Buscar por nombre o correo para asignar..." />
                                    {searchingAssignees && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#1677FF]" />}
                                </div>
                                {assigneeResults.length > 0 && (
                                    <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white shadow-sm">
                                        {assigneeResults.map(user => {
                                            const already = assignedUsers.some(u => u.id === user.id);
                                            return (
                                                <button key={user.id} onClick={() => { if (!already) { setAssignedUsers(p => [...p, user]); } setAssigneeSearch(""); setAssigneeResults([]); }} disabled={already}
                                                    className={cls("w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors", already && "opacity-50 bg-slate-50 cursor-not-allowed")}>
                                                    <UserAvatar user={user} size="md" />
                                                    <div className="text-left flex-1 min-w-0"><div className="text-sm font-bold text-[#001E50] truncate">{user.name}</div><div className="text-xs text-slate-500 truncate">{user.email}</div></div>
                                                    {already && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Asignado</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-slate-100" />

                    <section>
                        <div className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Paperclip className="h-4 w-4" /> Documentación y Evidencias</div>

                        {evidenciasExistentes.length > 0 && (
                            <div className="mb-5">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Archivos en el Servidor ({evidenciasExistentes.length})</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {evidenciasExistentes.map((ev) => {
                                        const url = ev.proxy_url || ev.archivo_url || "";
                                        const name = url.split("/").pop() || "Archivo";
                                        const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
                                        const isPdf = /\.pdf$/i.test(url);
                                        const isVideo = /\.(mp4|mov|webm)$/i.test(url);
                                        const isAudio = /\.(mp3|wav|m4a)$/i.test(url);
                                        return (
                                            <div key={ev.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm group">
                                                <div className="w-full h-28 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                                                    {isImg ? (
                                                        <img src={url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : isPdf ? (
                                                        <PdfThumb url={url} />
                                                    ) : isVideo ? (
                                                        <div className="flex flex-col items-center gap-2"><span className="text-4xl text-purple-400">🎬</span><span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Video</span></div>
                                                    ) : isAudio ? (
                                                        <div className="flex flex-col items-center gap-2"><span className="text-4xl text-sky-400">🎵</span><span className="text-[10px] font-black text-sky-600 uppercase tracking-wider">Audio</span></div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2"><span className="text-4xl text-slate-300">📎</span><span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{name.split(".").pop()}</span></div>
                                                    )}
                                                </div>
                                                <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-slate-100 bg-white">
                                                    <span className="text-[11px] font-bold text-slate-600 truncate flex-1" title={name}>{name}</span>
                                                    {url && (
                                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                                            className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#1677FF] hover:bg-slate-100 transition-colors">
                                                            Abrir
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 transition-colors p-8 text-center">
                            <Paperclip className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                            <label className="cursor-pointer text-sm font-black text-[#1677FF] hover:underline">Haz clic aquí para seleccionar archivos
                                <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.mp4,.mov,.webm,.mp3,.wav,.m4a" className="hidden"
                                    onChange={e => setEvidencias(p => [...p, ...Array.from(e.target.files || [])])} />
                            </label>
                            <p className="mt-2 text-xs font-medium text-slate-500">Admite Imágenes, PDF, Video y Audio</p>
                        </div>

                        {evidencias.length > 0 && (
                            <div className="mt-5">
                                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-block">{evidencias.length} Archivo(s) listos para subir</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {evidencias.map((f, i) => {
                                        const isImg = f.type.startsWith("image/");
                                        const isPdf = f.type === "application/pdf";
                                        const isVideo = f.type.startsWith("video/");
                                        const isAudio = f.type.startsWith("audio/");
                                        const emoji = isPdf ? "📄" : isVideo ? "🎬" : isAudio ? "🎵" : "📎";
                                        const labelColor = isPdf ? "text-rose-500" : isVideo ? "text-purple-500" : isAudio ? "text-sky-500" : "text-slate-500";
                                        const labelText = isPdf ? "PDF" : isVideo ? "Video" : isAudio ? "Audio" : f.name.split(".").pop().toUpperCase();
                                        return (
                                            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm">
                                                <div className="w-full h-28 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
                                                    {isImg ? (
                                                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onLoad={e => URL.revokeObjectURL(e.target.src)} />
                                                    ) : isPdf ? (
                                                        <PdfThumb file={f} />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className="text-4xl">{emoji}</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{labelText}</span>
                                                        </div>
                                                    )}
                                                    <span className="absolute top-2 left-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm">Nuevo</span>
                                                </div>
                                                <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-slate-100 bg-white">
                                                    <span className="text-[11px] font-bold text-slate-600 truncate flex-1" title={f.name}>{f.name}</span>
                                                    <button onClick={() => setEvidencias(p => p.filter((_, j) => j !== i))}
                                                        className="shrink-0 rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !title.trim() || !listId} className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 shadow-sm disabled:opacity-50" style={{ backgroundColor: BRAND_ACCENT }}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Guardando..." : task?.id ? "Guardar Cambios" : "Crear Plan de Acción"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* KANBAN CARD */
function KanbanCard({ task, onEdit, onDelete, dragging, onDragStart, onDragEnd }) {
    const [expanded, setExpanded] = useState(false);
    const subtasks = Array.isArray(task.subtareas) ? task.subtareas : [];
    const done = subtasks.filter(s => s.done).length;
    const pct = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;
    return (
        <article draggable
            onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(task.id)); onDragStart?.(task.id); }}
            onDragEnd={() => onDragEnd?.()}
            title="Arrastra para cambiar de fase"
            className={cls("group rounded-2xl border bg-white shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing",
                dragging ? "opacity-40 scale-[0.98] border-[#1677FF] border-dashed" : "border-slate-200 hover:shadow-md hover:border-[#1677FF]/30 hover:-translate-y-0.5")}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-1.5">
                            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#1677FF] transition-colors" />
                            <h3 className="text-sm font-black text-[#001E50] leading-snug group-hover:text-[#1677FF] transition-colors">{task.title || "Sin título"}</h3>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <PriorityBadge value={task.priority} />
                            {task.due_date && <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><Calendar className="h-3 w-3" />Fin: {String(task.due_date).slice(0, 10)}</span>}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(task)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-[#1677FF] transition-colors shadow-sm"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => onDelete(task)} className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
                {task.descripcion_problema && <p className="mt-3 line-clamp-2 text-xs text-slate-500 font-medium leading-relaxed">{task.descripcion_problema}</p>}
                {(task.causa || task.raiz) && (
                    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-[11px] text-slate-600 shadow-inner">
                        {task.causa && <span className="font-black uppercase tracking-wider text-[#001E50]">{task.causa}</span>}
                        {task.causa && task.raiz && <span className="mx-1.5 text-slate-300">|</span>}
                        {task.raiz && <span className="font-medium text-slate-500">{task.raiz}</span>}
                    </div>
                )}
                {subtasks.length > 0 && (
                    <div className="mt-4">
                        <button onClick={() => setExpanded(v => !v)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1677FF] hover:underline">
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}Subtareas ({done}/{subtasks.length})
                        </button>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[#1677FF] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
                        {expanded && <div className="mt-3 grid gap-1.5">{subtasks.map((s, i) => (
                            <div key={i} className="flex items-center gap-2.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs shadow-sm">
                                {s.done ? <CheckSquare className="h-4 w-4 text-[#1677FF] shrink-0" /> : <CheckSquare className="h-4 w-4 text-slate-300 shrink-0" />}
                                <span className={cls("truncate font-medium", s.done ? "line-through text-slate-400" : "text-[#001E50]")}>{s.title || s.titulo}</span>
                                {(s.start_date || s.due_date) && <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 bg-white border border-slate-200 px-1 rounded">{s.start_date?.slice(0, 10) || ""}{s.start_date && s.due_date ? " → " : ""}{s.due_date?.slice(0, 10) || ""}</span>}
                            </div>
                        ))}</div>}
                    </div>
                )}
                {task.desarrollo_estrategia && (
                    <div className="mt-3 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-[11px] text-sky-800 shadow-sm">
                        <span className="font-black uppercase tracking-wider text-sky-900 block mb-0.5">Estrategia:</span>
                        <span className="font-medium leading-relaxed block">{task.desarrollo_estrategia.length > 80 ? task.desarrollo_estrategia.slice(0, 80) + "..." : task.desarrollo_estrategia}</span>
                    </div>
                )}
                {task.assigned && task.assigned.length > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Asignados</span>
                        <div className="flex items-center -space-x-1.5">
                            {task.assigned.slice(0, 3).map((a, i) => <div key={i} className="ring-2 ring-white rounded-full"><UserAvatar user={a} size="sm" /></div>)}
                            {task.assigned.length > 3 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white text-[9px] font-bold text-slate-600">+{task.assigned.length - 3}</span>}
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}

function KanbanView({ tasks, lists, onEdit, onDelete, onCreateInCol, onMoveTask, loading }) {
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);

    if (loading) return (
        <div className="grid gap-4 sm:grid-cols-3">
            {STATUS_COLS.map(col => (
                <div key={col} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 h-6 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="grid gap-3">{[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white border border-slate-200 shadow-sm" />)}</div>
                </div>
            ))}
        </div>
    );

    const dragged = dragId != null ? tasks.find(t => Number(t.id) === Number(dragId)) : null;
    const endDrag = () => { setDragId(null); setOverCol(null); };

    return (
        <div className="grid gap-4 sm:grid-cols-3 items-start">
            {STATUS_COLS.map(col => {
                const c = STATUS_COLORS[col];
                const Icon = c.icon;
                const colTasks = tasks.filter(t => t.list_name === col);
                const list = lists.find(l => l.name === col);
                const canDrop = !!(list && dragged && dragged.list_name !== col);
                const isOver = canDrop && overCol === col;

                return (
                    <div key={col}
                        onDragOver={e => {
                            if (!canDrop) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (overCol !== col) setOverCol(col);
                        }}
                        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(p => (p === col ? null : p)); }}
                        onDrop={e => {
                            e.preventDefault();
                            const id = dragId ?? e.dataTransfer.getData("text/plain");
                            endDrag();
                            if (list && id !== null && id !== "") onMoveTask?.(id, list.id, col);
                        }}
                        className={cls("flex flex-col rounded-2xl border shadow-sm transition-all",
                            isOver ? "border-[#1677FF] ring-2 ring-[#1677FF]/30 bg-[#1677FF]/[0.05]"
                                : canDrop ? "border-dashed border-[#1677FF]/50 bg-slate-50/50"
                                    : "border-slate-200 bg-slate-50/50")}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white rounded-t-2xl">
                            <div className="flex items-center gap-2.5">
                                <div className={cls("p-1.5 rounded-lg", c.bg)}><Icon className={cls("h-4 w-4", c.text)} /></div>
                                <span className="text-sm font-black text-[#001E50]">{col}</span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-500 border border-slate-200">{colTasks.length}</span>
                            </div>
                            {list && <button onClick={() => onCreateInCol(list.id)} title={`Crear un plan nuevo directamente en «${col}»`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-[#1677FF] hover:text-white hover:border-[#1677FF] transition-colors shadow-sm"><Plus className="h-4 w-4" /></button>}
                        </div>
                        <div className="flex-1 p-3 space-y-3" style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto", minHeight: 120 }}>
                            {colTasks.length === 0 && !isOver && (
                                <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm font-medium text-slate-400">
                                    {canDrop ? "Suelta aquí" : "Columna vacía"}
                                </div>
                            )}
                            {colTasks.map(task => (
                                <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete}
                                    dragging={Number(dragId) === Number(task.id)}
                                    onDragStart={setDragId} onDragEnd={endDrag} />
                            ))}
                            {isOver && (
                                <div className="rounded-xl border-2 border-dashed border-[#1677FF] bg-[#1677FF]/10 p-5 text-center text-xs font-black uppercase tracking-wider text-[#1677FF]">
                                    Soltar para mover a «{col}»
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD (KPIs + gráficas). Sin librerías: SVG y CSS.
   ═══════════════════════════════════════════════════════════ */
const PRIO_HEX = { LOW: "#10b981", MEDIUM: "#0ea5e9", HIGH: "#f59e0b", URGENT: "#f43f5e" };

function DonutChart({ data, size = 170, stroke = 22, centerValue, centerLabel }) {
    const total = data.reduce((a, d) => a + d.value, 0);
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    let acc = 0;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
                {total > 0 && data.map(d => {
                    if (!d.value) return null;
                    const len = (d.value / total) * c;
                    const el = (
                        <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color}
                            strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />
                    );
                    acc += len;
                    return el;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[#001E50] leading-none">{centerValue}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{centerLabel}</span>
            </div>
        </div>
    );
}

function KpiCard({ label, value, sub, color, Icon, onClick }) {
    return (
        <button type="button" onClick={onClick} disabled={!onClick}
            className={cls("text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all",
                onClick ? "hover:shadow-md hover:-translate-y-0.5 hover:border-[#1677FF]/30 cursor-pointer" : "cursor-default")}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                <span className="p-1.5 rounded-lg" style={{ background: `${color}18` }}><Icon className="h-4 w-4" style={{ color }} /></span>
            </div>
            <div className="text-3xl font-black leading-none" style={{ color }}>{value}</div>
            {sub && <div className="mt-1.5 text-[11px] font-medium text-slate-500">{sub}</div>}
        </button>
    );
}

function BarList({ items, color = BRAND_ACCENT, emptyText = "Sin datos" }) {
    const max = Math.max(1, ...items.map(i => i.value));
    if (items.length === 0) return <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-medium text-slate-400">{emptyText}</div>;
    return (
        <div className="space-y-3">
            {items.map(i => (
                <div key={i.label}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-xs font-bold text-[#001E50] break-words min-w-0">{i.label}</span>
                        <span className="text-xs font-black text-slate-500 shrink-0">{i.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(i.value / max) * 100}%`, background: i.color || color }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function DashCard({ title, Icon, children, className }) {
    return (
        <div className={cls("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                {Icon && <Icon className="h-4 w-4" />}{title}
            </div>
            {children}
        </div>
    );
}

function DashboardView({ tasks, loading, onGoToStatus, onEdit }) {
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

    const m = useMemo(() => {
        const total = tasks.length;
        const by = (name) => tasks.filter(t => t.list_name === name);
        const porHacer = by("Por hacer").length, enProceso = by("En proceso").length, hecho = by("Hecho").length;
        const open = tasks.filter(t => t.list_name !== "Hecho");

        const dueOf = (t) => parseLocalDate(t.due_date);
        const overdue = open.filter(t => { const d = dueOf(t); return d && d < today; });
        const limit = addDays(today, 7);
        const soon = open.filter(t => { const d = dueOf(t); return d && d >= today && d <= limit; });

        let subTotal = 0, subDone = 0;
        tasks.forEach(t => (Array.isArray(t.subtareas) ? t.subtareas : []).forEach(s => { subTotal++; if (s.done) subDone++; }));

        const prio = PRIORITIES.map(p => ({ label: p.label, value: tasks.filter(t => t.priority === p.value).length, color: PRIO_HEX[p.value] }));

        const count = (arr) => {
            const map = {};
            arr.forEach(k => { map[k] = (map[k] || 0) + 1; });
            return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
        };
        const causas = count(tasks.map(t => t.causa || "Sin categoría")).slice(0, 6);
        const people = count(open.flatMap(t => (Array.isArray(t.assigned) ? t.assigned : []).map(a => a.name || a.email || "—"))).slice(0, 6);

        const upcoming = open
            .filter(t => dueOf(t))
            .sort((a, b) => dueOf(a) - dueOf(b))
            .slice(0, 8);

        return {
            total, porHacer, enProceso, hecho, overdue, soon, subTotal, subDone, prio, causas, people, upcoming,
            pct: total ? Math.round((hecho / total) * 100) : 0,
            subPct: subTotal ? Math.round((subDone / subTotal) * 100) : 0
        };
    }, [tasks, today]);

    if (loading) return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white border border-slate-200" />)}
        </div>
    );

    if (m.total === 0) return (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <LayoutDashboard className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-black text-[#001E50] mb-1">Aún no hay planes para mostrar</h3>
            <p className="text-sm text-slate-500">Crea un plan de acción o ajusta los filtros para ver el dashboard.</p>
        </div>
    );

    const statusData = [
        { label: "Por hacer", value: m.porHacer, color: "#94a3b8" },
        { label: "En proceso", value: m.enProceso, color: BRAND_ACCENT },
        { label: "Hecho", value: m.hecho, color: "#10b981" },
    ];

    return (
        <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Total planes" value={m.total} sub={`${m.pct}% completado`} color={BRAND_NAVY} Icon={Layers} onClick={() => onGoToStatus("Todos")} />
                <KpiCard label="Por hacer" value={m.porHacer} sub="Pendientes de iniciar" color="#64748b" Icon={Clock3} onClick={() => onGoToStatus("Por hacer")} />
                <KpiCard label="En proceso" value={m.enProceso} sub="En ejecución" color={BRAND_ACCENT} Icon={PlayCircle} onClick={() => onGoToStatus("En proceso")} />
                <KpiCard label="Completados" value={m.hecho} sub={`${m.pct}% del total`} color="#10b981" Icon={CheckSquare} onClick={() => onGoToStatus("Hecho")} />
                <KpiCard label="Vencidos" value={m.overdue.length} sub="Sin completar y fuera de fecha" color={m.overdue.length ? "#f43f5e" : "#94a3b8"} Icon={AlertTriangle} />
                <KpiCard label="Vencen en 7 días" value={m.soon.length} sub="Próximos a su fecha límite" color={m.soon.length ? "#f59e0b" : "#94a3b8"} Icon={Calendar} />
            </div>

            {/* Estatus / Prioridad / Avance */}
            <div className="grid gap-4 lg:grid-cols-3">
                <DashCard title="Distribución por estatus" Icon={LayoutGrid}>
                    <div className="flex items-center gap-5 flex-wrap">
                        <DonutChart data={statusData} centerValue={`${m.pct}%`} centerLabel="Completado" />
                        <div className="space-y-2.5 flex-1 min-w-[120px]">
                            {statusData.map(d => (
                                <div key={d.label} className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                                    <span className="text-xs font-bold text-[#001E50] flex-1">{d.label}</span>
                                    <span className="text-xs font-black text-slate-500">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DashCard>

                <DashCard title="Por prioridad" Icon={Target}>
                    <BarList items={m.prio} />
                </DashCard>

                <DashCard title="Avance de subtareas" Icon={CheckSquare}>
                    {m.subTotal === 0
                        ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-medium text-slate-400">Sin subtareas registradas</div>
                        : (
                            <div className="flex items-center gap-5 flex-wrap">
                                <DonutChart size={150} stroke={18} centerValue={`${m.subPct}%`} centerLabel="Avance"
                                    data={[{ label: "Hechas", value: m.subDone, color: "#10b981" }, { label: "Pendientes", value: m.subTotal - m.subDone, color: "#e2e8f0" }]} />
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-[#001E50] leading-none">{m.subDone}<span className="text-slate-300">/{m.subTotal}</span></div>
                                    <div className="text-[11px] font-medium text-slate-500">subtareas completadas</div>
                                </div>
                            </div>
                        )}
                </DashCard>
            </div>

            {/* Causas / Responsables */}
            <div className="grid gap-4 lg:grid-cols-2">
                <DashCard title="Principales categorías de causa" Icon={Briefcase}>
                    <BarList items={m.causas} color={BRAND_NAVY} />
                </DashCard>
                <DashCard title="Carga por responsable (planes abiertos)" Icon={UsersRound}>
                    <BarList items={m.people} color={BRAND_ACCENT} emptyText="Sin responsables asignados" />
                </DashCard>
            </div>

            {/* Próximos vencimientos */}
            <DashCard title="Próximos vencimientos" Icon={Calendar}>
                {m.upcoming.length === 0
                    ? <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-medium text-slate-400">No hay planes abiertos con fecha límite</div>
                    : (
                        <div className="divide-y divide-slate-100">
                            {m.upcoming.map(t => {
                                const d = parseLocalDate(t.due_date);
                                const diff = Math.round((d - today) / 86400000);
                                const late = diff < 0;
                                return (
                                    <button key={t.id} type="button" onClick={() => onEdit(t)}
                                        className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 rounded-lg px-2 transition-colors">
                                        <span className={cls("shrink-0 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider border",
                                            late ? "bg-rose-50 text-rose-600 border-rose-200" : diff <= 7 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200")}>
                                            {late ? `Vencido ${Math.abs(diff)} d` : diff === 0 ? "Hoy" : `En ${diff} d`}
                                        </span>
                                        <span className="flex-1 min-w-0 text-sm font-bold text-[#001E50] break-words">{t.title || "Sin título"}</span>
                                        <span className="hidden sm:block shrink-0"><StatusBadge name={t.list_name} /></span>
                                        <span className="hidden sm:block shrink-0"><PriorityBadge value={t.priority} /></span>
                                        <span className="shrink-0 text-[11px] font-bold text-slate-400">{String(t.due_date).slice(0, 10)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
            </DashCard>
        </div>
    );
}

/* TABLA DETALLADA (desplegable + edición en línea) */
/* Sección plegable del panel de la tabla: muestra un resumen de una línea cuando está cerrada */
function PanelSection({ title, Icon, summary, count, open, onToggle, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={onToggle}
                className={cls("flex w-full items-center gap-2 px-3 py-2 text-left transition-colors", open ? "border-b border-slate-200 bg-slate-50" : "hover:bg-slate-50")}>
                <span className={cls("flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors", open ? "bg-[#1677FF] text-white" : "bg-slate-100 text-slate-400")}>
                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
                {Icon && <Icon className="h-4 w-4 shrink-0 text-[#1677FF]" />}
                <span className="shrink-0 text-xs font-black uppercase tracking-wider text-[#001E50]">{title}</span>
                {count != null && <span className="shrink-0 rounded-md border border-[#1677FF]/20 bg-[#1677FF]/10 px-1.5 py-0.5 text-[10px] font-black text-[#1677FF]">{count}</span>}
                {!open && summary && <span className="ml-1 min-w-0 flex-1 truncate text-[11px] font-medium text-slate-400">{summary}</span>}
            </button>
            {open && <div className="p-3">{children}</div>}
        </section>
    );
}

/* Textarea que crece con su contenido (se ve todo el texto sin scroll interno) */
function AutoTextarea({ value, onChange, minRows = 2, className, ...rest }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current; if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);
    return <textarea ref={ref} rows={minRows} value={value} onChange={onChange}
        className={cls(className, "resize-none overflow-hidden")} {...rest} />;
}

function buildDraft(task) {
    const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
    const asg = Array.isArray(task.asignados) ? task.asignados : (Array.isArray(task.assigned) ? task.assigned : []);
    return {
        title: task.title || "",
        listId: String(task.list_id ?? task.list ?? ""),
        priority: task.priority || "MEDIUM",
        start: dateToInput(task.start_date),
        due: dateToInput(task.due_date),
        problema: task.descripcion_problema || "",
        causa: task.causa || "",
        raiz: task.raiz || "",
        estrategia: task.desarrollo_estrategia || "",
        resultados: task.resultados || "",
        subtasks: subs.map((s, i) => {
            const { rawStart, rawEnd } = readSubDates(s);
            return {
                id: s.id ?? `s${i}`, title: s.title || s.titulo || "", done: !!s.done,
                start_date: dateToInput(rawStart), due_date: dateToInput(rawEnd)
            };
        }),
        assigned: asg.map(a => ({ id: a.user_id ?? a.id, name: a.name, email: a.email })),
    };
}

function TablaRow({ task, lists, teamId, open, onToggle, onEdit, onDelete, onSaved, colSpan, panelWidth }) {
    const baseJson = useMemo(() => JSON.stringify(buildDraft(task)), [task]);
    const [draft, setDraft] = useState(() => JSON.parse(baseJson));
    const [syncedJson, setSyncedJson] = useState(baseJson);
    const [newFiles, setNewFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [newSub, setNewSub] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [sec, setSec] = useState({ a: false, e: true, v: false });
    const toggleSec = (k) => setSec(p => ({ ...p, [k]: !p[k] }));

    const dirty = JSON.stringify(draft) !== syncedJson || newFiles.length > 0;

    // Si el servidor trae datos nuevos (sync cada 20s) y el usuario NO ha editado, se actualiza el borrador.
    // Si el usuario está editando, se respeta lo que está escribiendo.
    useEffect(() => {
        if (JSON.stringify(draft) === syncedJson) setDraft(JSON.parse(baseJson));
        setSyncedJson(baseJson);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseJson]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(async () => {
            if (userSearch.trim().length < 2) { setUserResults([]); return; }
            setSearching(true);
            try { const r = await apiClickup.searchUsers(userSearch); setUserResults(Array.isArray(r) ? r : []); }
            catch { setUserResults([]); }
            finally { setSearching(false); }
        }, 500);
        return () => clearTimeout(t);
    }, [userSearch, open]);

    const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
    const patchSub = (id, patch) => setDraft(d => ({ ...d, subtasks: d.subtasks.map(s => s.id === id ? { ...s, ...patch } : s) }));
    const delSub = (id) => setDraft(d => ({ ...d, subtasks: d.subtasks.filter(s => s.id !== id) }));
    const addSub = () => {
        const t = newSub.trim(); if (!t) return;
        setDraft(d => ({ ...d, subtasks: [...d.subtasks, { id: `n${Date.now()}`, title: t, done: false, start_date: "", due_date: "" }] }));
        setNewSub("");
    };

    async function save() {
        if (!draft.title.trim() || !draft.listId) return;
        setSaving(true);
        try {
            const payload = {
                lista: Number(draft.listId), titulo: draft.title.trim(), prioridad: draft.priority,
                inicio: draft.start ? `${draft.start}T00:00:00Z` : null,
                vence: draft.due ? `${draft.due}T00:00:00Z` : null,
                descripcion_problema: draft.problema.trim(),
                causa: draft.causa.trim(), raiz: draft.raiz.trim(),
                desarrollo_estrategia: draft.estrategia.trim(),
                resultados: draft.resultados.trim(),
                subtareas: draft.subtasks.filter(s => s.title.trim()).map(s => ({
                    titulo: s.title.trim(), done: s.done, start_date: s.start_date || null, due_date: s.due_date || null,
                })),
                asignados_ids: draft.assigned.map(u => u.id),
            };
            await apiClickup.updateTask(Number(teamId), Number(task.id), payload);
            if (newFiles.length) {
                await apiClickup.uploadTaskEvidence(Number(teamId), Number(task.id), {
                    tipo: "RESOLUTION", comentario: "Evidencias del plan de acción", archivos: newFiles,
                });
            }
            setSyncedJson(JSON.stringify(draft));
            setNewFiles([]);
            await onSaved?.();
        } catch (e) { console.error(e); alert(e.message || "Error al guardar"); }
        finally { setSaving(false); }
    }

    function discard() { setDraft(JSON.parse(syncedJson)); setNewFiles([]); setNewSub(""); }

    const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
    const doneCount = subs.filter(s => s.done).length;
    const asg = Array.isArray(task.assigned) ? task.assigned : [];
    const dDone = draft.subtasks.filter(s => s.done).length;
    const existing = Array.isArray(task.evidencias) ? task.evidencias : [];
    const sD = parseLocalDate(draft.start), eD = parseLocalDate(draft.due);
    const durDays = sD && eD ? Math.round((eD - sD) / 86400000) + 1 : null;
    const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
    const draftListName = (lists.find(l => String(l.id) === String(draft.listId)) || {}).name;
    const isLate = !!(eD && eD < todayD && draftListName !== "Hecho");

    return (
        <>
            {/* ── FILA RESUMEN ── */}
            <tr onClick={onToggle}
                className={cls("cursor-pointer group transition-colors", open ? "bg-[#1677FF]/[0.04]" : "hover:bg-slate-50/80")}>
                <td className="pl-4 pr-1 py-3 w-8">
                    <span className={cls("inline-flex h-6 w-6 items-center justify-center rounded-md border transition-all",
                        open ? "bg-[#1677FF] border-[#1677FF] text-white" : "border-slate-200 bg-white text-slate-400 group-hover:text-[#1677FF]")}>
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                </td>
                <td className="px-4 py-3 font-bold text-[#001E50] max-w-[240px]"><span className="line-clamp-2 leading-snug">{task.title || "—"}</span></td>
                <td className="px-4 py-3 whitespace-nowrap"><StatusBadge name={task.list_name} /></td>
                <td className="px-4 py-3 whitespace-nowrap"><PriorityBadge value={task.priority} /></td>
                <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">{task.start_date ? String(task.start_date).slice(0, 10) : "—"}</td>
                <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">{task.due_date ? String(task.due_date).slice(0, 10) : "—"}</td>
                <td className="px-4 py-3 font-medium text-slate-600 max-w-[180px]"><span className="line-clamp-1">{task.causa || "—"}</span></td>
                <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center -space-x-1.5">
                        {asg.slice(0, 3).map((a, i) => <div key={i} className="ring-2 ring-white rounded-full"><UserAvatar user={a} size="sm" /></div>)}
                        {asg.length > 3 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white text-[9px] font-bold text-slate-600">+{asg.length - 3}</span>}
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                    {subs.length > 0
                        ? <div className="flex items-center gap-2"><div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200"><div className="h-full rounded-full bg-[#1677FF]" style={{ width: `${(doneCount / subs.length) * 100}%` }} /></div><span className="text-[10px] font-bold text-slate-500">{doneCount}/{subs.length}</span></div>
                        : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Sin tareas</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Abrir en ventana completa" onClick={() => onEdit(task)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-[#1677FF] hover:bg-slate-50 shadow-sm transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button title="Eliminar" onClick={() => onDelete(task)} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-500 hover:bg-rose-100 shadow-sm transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                </td>
            </tr>

            {/* ── PANEL DESPLEGADO (compacto, editable) ── */}
            {open && (
                <tr>
                    <td colSpan={colSpan} className="p-0 border-t border-slate-200 bg-slate-50">
                        {/* Anclado al ancho visible: no se desplaza con el scroll horizontal de la tabla */}
                        <div style={{ position: "sticky", left: 0, width: panelWidth || "100%", maxWidth: "100%" }}>
                            <div className="p-3 sm:p-4 space-y-2.5" style={{ borderLeft: "4px solid #1677FF" }}>

                                {/* Barra superior: estado + acciones en una sola línea */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {dirty
                                            ? <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />Sin guardar</span>
                                            : <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400"><Check className="h-3 w-3" />Guardado</span>}
                                        {durDays && <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Calendar className="h-3 w-3" />{durDays} {durDays === 1 ? "día" : "días"}</span>}
                                        {isLate && <span className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"><AlertTriangle className="h-3 w-3" />Vencido</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button type="button" onClick={() => onEdit(task)} title="Abrir este plan en la ventana completa de edición"
                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 shadow-sm"><Pencil className="h-3.5 w-3.5" /><span className="hidden md:inline">Ventana completa</span></button>
                                        <button type="button" onClick={onToggle} title="Contraer este plan"
                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 shadow-sm"><ChevronUp className="h-3.5 w-3.5" /><span className="hidden md:inline">Contraer</span></button>
                                        <button type="button" onClick={discard} disabled={!dirty || saving} title="Descartar los cambios no guardados"
                                            className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 shadow-sm disabled:opacity-40">Descartar</button>
                                        <button type="button" onClick={save} disabled={!dirty || saving || !draft.title.trim() || !draft.listId} title="Guardar los cambios de este plan"
                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: BRAND_ACCENT }}>
                                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{saving ? "Guardando..." : "Guardar"}
                                        </button>
                                    </div>
                                </div>

                                {/* Encabezado: datos clave + responsables, todo junto */}
                                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
                                        <div className="sm:col-span-2 lg:col-span-4">
                                            <label className={LABEL}>Título del plan *</label>
                                            <input value={draft.title} onChange={e => set("title", e.target.value)} className={cls(FIELD, "font-bold")} />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className={LABEL}>Fase</label>
                                            <select value={draft.listId} onChange={e => set("listId", e.target.value)} className={FIELD}>
                                                {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className={LABEL}>Prioridad</label>
                                            <select value={draft.priority} onChange={e => set("priority", e.target.value)} className={FIELD}>
                                                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className={LABEL}>Inicio</label>
                                            <input type="date" value={draft.start} onChange={e => set("start", e.target.value)} className={FIELD} />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className={LABEL}>Fecha límite</label>
                                            <input type="date" value={draft.due} onChange={e => set("due", e.target.value)} className={FIELD} />
                                        </div>
                                    </div>

                                    {/* Responsables integrados en el encabezado */}
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400"><UsersRound className="h-3.5 w-3.5" />Responsables</span>
                                        {draft.assigned.length === 0 && <span className="text-xs italic text-slate-400">Sin asignar</span>}
                                        {draft.assigned.map(u => (
                                            <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-2">
                                                <UserAvatar user={u} size="sm" />
                                                <span className="text-[11px] font-bold text-[#001E50]">{u.name || u.email}</span>
                                                <button type="button" title="Quitar responsable" onClick={() => setDraft(d => ({ ...d, assigned: d.assigned.filter(x => x.id !== u.id) }))} className="text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                        <div className="relative w-full sm:ml-auto sm:w-60">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-xs font-medium text-[#001E50] outline-none focus:border-[#1677FF]" placeholder="+ Asignar por nombre o correo..." />
                                            {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[#1677FF]" />}
                                        </div>
                                    </div>
                                    {userResults.length > 0 && (
                                        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                            {userResults.map(u => {
                                                const already = draft.assigned.some(x => x.id === u.id);
                                                return (
                                                    <button key={u.id} type="button" disabled={already}
                                                        onClick={() => { setDraft(d => ({ ...d, assigned: [...d.assigned, { id: u.id, name: u.name, email: u.email }] })); setUserSearch(""); setUserResults([]); }}
                                                        className={cls("flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-1.5 text-left last:border-b-0 hover:bg-slate-50", already && "cursor-not-allowed opacity-50")}>
                                                        <UserAvatar user={u} />
                                                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#001E50]">{u.name} <span className="font-medium text-slate-400">· {u.email}</span></span>
                                                        {already && <span className="text-[9px] font-bold uppercase text-emerald-600">Asignado</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ── Sección 1: ANÁLISIS ── */}
                                <PanelSection title="Análisis" Icon={Search} open={sec.a} onToggle={() => toggleSec("a")}
                                    summary={`${draft.causa || "Sin causa"}${draft.raiz ? " › " + draft.raiz : ""}${draft.problema ? " · " + draft.problema : ""}`}>
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        <div>
                                            <label className={LABEL}>Descripción del problema</label>
                                            <AutoTextarea value={draft.problema} onChange={e => set("problema", e.target.value)} minRows={2}
                                                className={FIELD} placeholder="¿Qué problema se está abordando?" />
                                        </div>
                                        <div>
                                            <label className={LABEL}>Causa y raíz</label>
                                            <CausaRaiz causa={draft.causa} raiz={draft.raiz}
                                                onChangeCausa={v => set("causa", v)} onChangeRaiz={v => set("raiz", v)} />
                                        </div>
                                    </div>
                                </PanelSection>

                                {/* ── Sección 2: EJECUCIÓN DE LA ESTRATEGIA ── */}
                                <PanelSection title="Ejecución de la estrategia" Icon={Zap} open={sec.e} onToggle={() => toggleSec("e")}
                                    count={draft.subtasks.length > 0 ? `${dDone}/${draft.subtasks.length}` : null}
                                    summary={draft.estrategia || "Sin estrategia definida"}>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <label className={LABEL}>Estrategia a implementar</label>
                                            <AutoTextarea value={draft.estrategia} onChange={e => set("estrategia", e.target.value)} minRows={2}
                                                className={FIELD} placeholder="Pasos clave y estrategia de resolución..." />
                                        </div>
                                        <div>
                                            <label className={LABEL}>Resultados esperados</label>
                                            <AutoTextarea value={draft.resultados} onChange={e => set("resultados", e.target.value)} minRows={2}
                                                className={FIELD} placeholder="KPIs o resultados concretos al finalizar..." />
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-slate-100 pt-3">
                                        <div className="mb-1.5 flex items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500"><CheckSquare className="h-3.5 w-3.5 text-[#1677FF]" />Subtareas</span>
                                            {draft.subtasks.length > 0 && (
                                                <span className="flex items-center gap-2">
                                                    <span className="h-1.5 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100"><span className="block h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(dDone / draft.subtasks.length) * 100}%` }} /></span>
                                                    <span className="text-[10px] font-black text-slate-500">{dDone}/{draft.subtasks.length}</span>
                                                </span>
                                            )}
                                        </div>

                                        {draft.subtasks.length > 0 && (
                                            <div className="hidden sm:grid grid-cols-[1.25rem_minmax(0,1fr)_7.5rem_7.5rem_1.75rem] gap-2 px-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                <span /><span>Descripción</span><span>Inicio</span><span>Fin</span><span />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            {draft.subtasks.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs font-medium text-slate-400">Sin subtareas todavía</div>}
                                            {draft.subtasks.map(s => (
                                                <div key={s.id} className={cls("grid grid-cols-[1.25rem_minmax(0,1fr)_1.75rem] sm:grid-cols-[1.25rem_minmax(0,1fr)_7.5rem_7.5rem_1.75rem] items-start gap-2 rounded-lg px-1 py-1", s.done ? "bg-emerald-50/60" : "hover:bg-slate-50")}>
                                                    <button type="button" onClick={() => patchSub(s.id, { done: !s.done })} title={s.done ? "Marcar como pendiente" : "Marcar como completada"}
                                                        className={cls("mt-1.5 flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                                                            s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white hover:border-[#1677FF]")}>
                                                        {s.done && <Check className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <AutoTextarea value={s.title} minRows={1} onChange={e => patchSub(s.id, { title: e.target.value })}
                                                        className={cls(FIELD, "py-1.5", s.done && "text-slate-400 line-through")} />
                                                    <button type="button" onClick={() => delSub(s.id)} title="Eliminar subtarea"
                                                        className="mt-1 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 sm:col-start-5 sm:row-start-1"><Trash2 className="h-4 w-4" /></button>
                                                    <input type="date" value={s.start_date} onChange={e => patchSub(s.id, { start_date: e.target.value })} title="Inicio de la subtarea"
                                                        className="col-span-2 col-start-2 h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-[#001E50] outline-none focus:border-[#1677FF] sm:col-span-1 sm:col-start-3 sm:row-start-1" />
                                                    <input type="date" value={s.due_date} onChange={e => patchSub(s.id, { due_date: e.target.value })} title="Fin de la subtarea"
                                                        className="col-span-2 col-start-2 h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-[#001E50] outline-none focus:border-[#1677FF] sm:col-span-1 sm:col-start-4 sm:row-start-1" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-2 flex gap-2">
                                            <input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === "Enter" && addSub()} className={cls(FIELD, "h-9 flex-1")} placeholder="Agregar subtarea y presionar Enter..." />
                                            <button type="button" onClick={addSub} title="Agregar subtarea" className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-white shadow-sm hover:opacity-90" style={{ backgroundColor: BRAND_ACCENT }}><Plus className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                </PanelSection>

                                {/* ── Sección 3: EVIDENCIAS ── */}
                                <PanelSection title="Evidencias" Icon={Paperclip} open={sec.v} onToggle={() => toggleSec("v")}
                                    count={(existing.length + newFiles.length) > 0 ? existing.length + newFiles.length : null}
                                    summary={(existing.length + newFiles.length) > 0 ? "Archivos adjuntos del plan" : "Sin archivos adjuntos"}>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                        {existing.map(ev => {
                                            const url = ev.proxy_url || ev.archivo_url || "";
                                            const name = url.split("/").pop().split("?")[0] || "Archivo";
                                            const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
                                            const isPdf = /\.pdf$/i.test(url);
                                            const isVid = /\.(mp4|mov|webm)$/i.test(url);
                                            const isAud = /\.(mp3|wav|m4a)$/i.test(url);
                                            return (
                                                <div key={ev.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    <div className="flex h-16 items-center justify-center overflow-hidden bg-slate-50">
                                                        {isImg ? <img src={url} alt={name} className="h-full w-full object-cover" />
                                                            : isPdf ? <PdfThumb url={url} />
                                                                : <span className="text-2xl">{isVid ? "🎬" : isAud ? "🎵" : "📎"}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 border-t border-slate-100 px-1.5 py-1">
                                                        <span className="flex-1 truncate text-[10px] font-bold text-slate-600" title={name}>{name}</span>
                                                        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-[#1677FF] hover:underline">Abrir</a>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {newFiles.map((f, i) => (
                                            <div key={`n${i}`} className="flex flex-col overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/40">
                                                <div className="relative flex h-16 items-center justify-center overflow-hidden bg-slate-50">
                                                    {f.type.startsWith("image/") ? <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" onLoad={e => URL.revokeObjectURL(e.target.src)} />
                                                        : f.type === "application/pdf" ? <PdfThumb file={f} />
                                                            : <span className="text-2xl">{f.type.startsWith("video/") ? "🎬" : f.type.startsWith("audio/") ? "🎵" : "📎"}</span>}
                                                    <span className="absolute left-1 top-1 rounded bg-emerald-500 px-1 py-0.5 text-[8px] font-black uppercase text-white">Nuevo</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 border-t border-emerald-100 px-1.5 py-1">
                                                    <span className="flex-1 truncate text-[10px] font-bold text-slate-600" title={f.name}>{f.name}</span>
                                                    <button type="button" title="Quitar archivo" onClick={() => setNewFiles(p => p.filter((_, j) => j !== i))} className="rounded border border-rose-200 bg-rose-50 p-0.5 text-rose-600 hover:bg-rose-100"><X className="h-3 w-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        <label className="flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-2 text-center transition-colors hover:bg-slate-100/60" title="Imágenes, PDF, video o audio">
                                            <Plus className="h-5 w-5 text-[#1677FF]" />
                                            <span className="text-[10px] font-black text-[#1677FF]">Agregar archivos</span>
                                            <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.mp4,.mov,.webm,.mp3,.wav,.m4a" className="hidden"
                                                onChange={e => { setNewFiles(p => [...p, ...Array.from(e.target.files || [])]); e.target.value = ""; }} />
                                        </label>
                                    </div>
                                </PanelSection>

                                {/* Pie: repite guardar solo si hay cambios */}
                                {dirty && (
                                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-2.5">
                                        <span className="mr-auto text-[11px] font-bold uppercase tracking-wider text-amber-600">Tienes cambios sin guardar</span>
                                        <button type="button" onClick={discard} disabled={saving} className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-100 shadow-sm disabled:opacity-40">Descartar</button>
                                        <button type="button" onClick={save} disabled={saving || !draft.title.trim() || !draft.listId}
                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-4 text-[11px] font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-40" style={{ backgroundColor: BRAND_ACCENT }}>
                                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{saving ? "Guardando..." : "Guardar cambios"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function TablaView({ tasks, lists, teamId, onEdit, onDelete, onSaved, loading }) {
    const [sort, setSort] = useState({ key: "due_date", dir: "asc" });
    const [expanded, setExpanded] = useState({});
    const wrapRef = useRef(null);
    const [panelW, setPanelW] = useState(0);
    const COLS = 10;

    useEffect(() => {
        const el = wrapRef.current; if (!el) return;
        const update = () => setPanelW(el.clientWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    function toggleSort(key) { setSort(prev => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" }); }

    const sorted = useMemo(() => {
        const data = [...tasks]; const mult = sort.dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const va = String(a?.[sort.key] || "").toLowerCase();
            const vb = String(b?.[sort.key] || "").toLowerCase();
            return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
        });
    }, [tasks, sort]);

    const allOpen = sorted.length > 0 && sorted.every(t => expanded[t.id]);
    const toggleAll = () => setExpanded(allOpen ? {} : Object.fromEntries(sorted.map(t => [t.id, true])));

    const SortIcon = ({ k }) => (
        <span className="opacity-50 ml-1.5">
            {sort.key === k ? (sort.dir === "asc" ? <ChevronUp className="h-3 w-3 inline text-[#1677FF]" /> : <ChevronDown className="h-3 w-3 inline text-[#1677FF]" />) : <ArrowUpDown className="h-3 w-3 inline" />}
        </span>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-white">
                <span className="text-xs font-medium text-slate-500">Haz clic en una fila para desplegarla y editarla directamente.</span>
                <button onClick={toggleAll} disabled={sorted.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#001E50] hover:bg-slate-50 hover:text-[#1677FF] shadow-sm disabled:opacity-40">
                    {allOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{allOpen ? "Contraer todo" : "Expandir todo"}
                </button>
            </div>
            <div ref={wrapRef} className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-100 text-[#001E50]">
                        <tr>
                            <th className="w-8 pl-4 pr-1 py-3.5" />
                            {[["title", "Título del Plan"], ["list_name", "Fase / Estatus"], ["priority", "Prioridad"], ["start_date", "Fecha Inicio"], ["due_date", "Fecha Límite"], ["causa", "Causa Principal"]].map(([k, l]) => (
                                <th key={k} className="px-4 py-3.5 whitespace-nowrap"><button onClick={() => toggleSort(k)} className="inline-flex items-center font-black uppercase tracking-wider">{l}<SortIcon k={k} /></button></th>
                            ))}
                            <th className="px-4 py-3.5 font-black uppercase tracking-wider whitespace-nowrap">Asignados</th>
                            <th className="px-4 py-3.5 font-black uppercase tracking-wider whitespace-nowrap">Progreso</th>
                            <th className="px-4 py-3.5 font-black uppercase tracking-wider whitespace-nowrap text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="animate-pulse bg-white">{Array.from({ length: COLS }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 w-full rounded bg-slate-100" /></td>)}</tr>))
                            : sorted.length === 0
                                ? <tr><td colSpan={COLS} className="px-5 py-12 text-center text-sm font-medium text-slate-400 bg-slate-50/50">No se encontraron planes para los filtros aplicados.</td></tr>
                                : sorted.map(task => (
                                    <TablaRow key={task.id} task={task} lists={lists} teamId={teamId} colSpan={COLS} panelWidth={panelW}
                                        open={!!expanded[task.id]}
                                        onToggle={() => setExpanded(p => ({ ...p, [task.id]: !p[task.id] }))}
                                        onEdit={onEdit} onDelete={onDelete} onSaved={onSaved} />
                                ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}



/* GANTT (cuadrícula única, subtareas completas) */
const G_DAY_W = 40;
const G_WEEK_H = 30;
const G_DAY_H = 28;
const G_HDR_H = G_WEEK_H + G_DAY_H;
const G_TASK_H = 96;
const G_SUB_H = 46;
const G_COL_PLAN = 340;
const G_COL_DETAIL = 230;
const G_LINE = "rgba(0,30,80,0.08)";

function GanttChart({ tasks, onEdit, onDelete, onUpdateDates, onExport }) {
    const scrollRef = useRef(null);
    const dragRef = useRef(null);
    const [dragState, setDragState] = useState(null);
    const [dragOverrides, setDragOverrides] = useState({});
    const [expanded, setExpanded] = useState({});
    const [showDetail, setShowDetail] = useState(false);

    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
    const FIXED_W = G_COL_PLAN + (showDetail ? G_COL_DETAIL * 2 : 0);

    const parseTaskDates = (t) => {
        let s = parseLocalDate(t.start_date), e = parseLocalDate(t.due_date);
        if (!s && e) s = new Date(e);
        if (!e && s) e = new Date(s);
        return { startDate: s, dueDate: e };
    };

    const { minDate, totalDays, weeks } = useMemo(() => {
        let min = new Date(today), max = new Date(today);
        const expand = (v) => { const d = parseLocalDate(v); if (!d) return; if (d < min) min = new Date(d); if (d > max) max = new Date(d); };
        tasks.forEach(t => {
            expand(t.start_date); expand(t.due_date);
            (Array.isArray(t.subtareas) ? t.subtareas : []).forEach(s => { const { rawStart, rawEnd } = readSubDates(s); expand(rawStart); expand(rawEnd); });
        });
        min = addDays(min, -7); max = addDays(max, 14);
        const total = Math.round((max - min) / 86400000) + 1;
        const ws = [];
        const cur = addDays(min, -min.getDay());
        while (cur <= max) {
            const s = Math.round((cur - min) / 86400000);
            const a = Math.max(0, s), b = Math.min(total, s + 7);
            if (b > a) ws.push({ label: `Sem ${cur.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}`, left: a * G_DAY_W, width: (b - a) * G_DAY_W });
            cur.setDate(cur.getDate() + 7);
        }
        return { minDate: min, totalDays: total, weeks: ws };
    }, [tasks, today]);

    const todayOffset = Math.round((today - minDate) / 86400000);

    useEffect(() => {
        if (scrollRef.current && todayOffset > 0) scrollRef.current.scrollLeft = Math.max(0, todayOffset * G_DAY_W - 220);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Al llegar datos nuevos (guardado / sync), se descartan los ajustes visuales del arrastre
    useEffect(() => { setDragOverrides({}); }, [tasks]);

    const toOffsets = (s, e) => {
        if (e < s) { const t = s; s = e; e = t; }
        let startOff = Math.round((s - minDate) / 86400000);
        let dur = Math.round((e - s) / 86400000) + 1;
        startOff = Math.max(0, Math.min(startOff, totalDays - 1));
        dur = Math.max(1, Math.min(dur, totalDays - startOff));
        return { startOff, dur };
    };
    const getOffsets = (key, startOff, dur) => dragOverrides[key] || { startOff, dur };

    // ── Arrastre ──
    useEffect(() => {
        function onMove(e) {
            const d = dragRef.current; if (!d) return;
            const deltaDays = Math.round((e.clientX - d.startX) / G_DAY_W);
            let startOff = d.origStartOff, dur = d.origDur;
            if (d.type === "move") {
                startOff = Math.max(0, Math.min(d.origStartOff + deltaDays, totalDays - d.origDur));
            } else if (d.type === "resize-right") {
                dur = Math.max(1, d.origDur + deltaDays);
                if (startOff + dur > totalDays) dur = totalDays - startOff;
            } else if (d.type === "resize-left") {
                const shift = Math.min(deltaDays, d.origDur - 1);
                startOff = Math.max(0, d.origStartOff + shift);
                dur = d.origDur - (startOff - d.origStartOff);
            }
            setDragOverrides(p => ({ ...p, [d.key]: { startOff, dur } }));
            d._last = { startOff, dur };
        }
        function onUp() {
            const d = dragRef.current;
            if (d?._last && onUpdateDates) {
                const { startOff, dur } = d._last;
                onUpdateDates(d.taskId, d.subIdx, localISO(addDays(minDate, startOff)), localISO(addDays(minDate, startOff + dur - 1)));
            }
            dragRef.current = null; setDragState(null);
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    }, [totalDays, minDate, onUpdateDates]);

    function startDrag(e, key, type, origStartOff, origDur, taskId, subIdx = -1) {
        e.preventDefault(); e.stopPropagation();
        dragRef.current = { key, type, startX: e.clientX, origStartOff, origDur, taskId, subIdx, _last: null };
        setDragState({ key, type });
    }

    const fmt = (d) => d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const fmtShort = (d) => d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    const rangeLabel = (key, s, e) => {
        const o = dragOverrides[key];
        if (!o) return `${fmt(s)} → ${fmt(e)}`;
        return `${fmt(addDays(minDate, o.startOff))} → ${fmt(addDays(minDate, o.startOff + o.dur - 1))}`;
    };
    const barColor = (t) => t.list_name === "Hecho" ? "#10b981" : t.list_name === "En proceso" ? BRAND_ACCENT : BRAND_NAVY;

    const withSubs = tasks.filter(t => Array.isArray(t.subtareas) && t.subtareas.length > 0);
    const allOpen = withSubs.length > 0 && withSubs.every(t => expanded[t.id]);
    const toggleAll = () => setExpanded(allOpen ? {} : Object.fromEntries(withSubs.map(t => [t.id, true])));

    const leftCell = (bg, extra = {}) => ({
        position: "sticky", left: 0, zIndex: 20, width: FIXED_W, flexShrink: 0, background: bg,
        borderRight: "1px solid rgba(0,30,80,0.14)", boxShadow: "4px 0 8px -6px rgba(0,30,80,0.18)", ...extra,
    });

    return (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            {/* Barra de herramientas */}
            <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-5 flex-wrap">
                    <span className="text-sm font-black text-[#001E50] uppercase tracking-wider flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-[#1677FF]" />Diagrama de Gantt
                    </span>
                    <div className="flex gap-4 flex-wrap">
                        {[["#60a5fa", "Hoy"], ["#10b981", "Hecho"], [BRAND_ACCENT, "En proceso"], [BRAND_NAVY, "Por hacer"], ["#ef4444", "Vencida"]].map(([color, label]) => (
                            <span key={label} className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-500 hidden xl:block mr-2">Arrastra las barras para ajustar fechas</span>
                    <button onClick={toggleAll} disabled={withSubs.length === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#001E50] hover:bg-slate-50 hover:text-[#1677FF] shadow-sm disabled:opacity-40">
                        {allOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{allOpen ? "Contraer subtareas" : "Expandir subtareas"}
                    </button>
                    <button onClick={() => setShowDetail(v => !v)}
                        className={cls("inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm transition-colors",
                            showDetail ? "bg-[#001E50] text-white border-[#001E50]" : "bg-white text-[#001E50] border-slate-200 hover:bg-slate-50 hover:text-[#1677FF]")}>
                        <Layers className="h-3.5 w-3.5" />{showDetail ? "Ocultar detalle" : "Mostrar problema y estrategia"}
                    </button>
                    <button onClick={() => onExport?.()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#001E50] hover:bg-slate-50 hover:text-[#1677FF] shadow-sm">
                        <FileText className="h-3.5 w-3.5" />Exportar a PDF
                    </button>
                </div>
            </div>

            {/* Cuadrícula única con scroll en ambos ejes */}
            <div ref={scrollRef} style={{ overflow: "auto", maxHeight: "calc(100vh - 300px)", position: "relative", isolation: "isolate", background: "white" }}>
                <div style={{ width: FIXED_W + totalDays * G_DAY_W }}>

                    {/* Encabezado (sticky arriba) */}
                    <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 40, height: G_HDR_H, background: "#f1f5f9", borderBottom: "1px solid rgba(0,30,80,0.14)" }}>
                        <div style={{ ...leftCell("#f1f5f9", { zIndex: 50 }), display: "flex" }}>
                            {[[G_COL_PLAN, "Plan de acción", true], [G_COL_DETAIL, "Descripción del problema", showDetail], [G_COL_DETAIL, "Estrategia", showDetail]]
                                .filter(c => c[2]).map(([w, label]) => (
                                    <div key={label} style={{ width: w, padding: "0 16px", display: "flex", alignItems: "center", borderRight: `1px solid ${G_LINE}` }}>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-[#001E50]">{label}</span>
                                    </div>
                                ))}
                        </div>
                        <div style={{ position: "relative", width: totalDays * G_DAY_W, flexShrink: 0 }}>
                            {weeks.map((w, i) => (
                                <div key={i} className="flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-[#001E50]"
                                    style={{ position: "absolute", top: 0, left: w.left, width: w.width, height: G_WEEK_H, borderRight: "1px solid rgba(0,30,80,0.14)", overflow: "hidden", whiteSpace: "nowrap" }}>
                                    {w.width >= G_DAY_W * 3 ? w.label : ""}
                                </div>
                            ))}
                            <div style={{ position: "absolute", top: G_WEEK_H, left: 0, display: "flex", height: G_DAY_H, background: "white", borderTop: `1px solid ${G_LINE}` }}>
                                {Array.from({ length: totalDays }).map((_, idx) => {
                                    const d = addDays(minDate, idx);
                                    const isToday = idx === todayOffset, isWe = d.getDay() === 0 || d.getDay() === 6;
                                    return (
                                        <div key={idx} className="flex items-center justify-center text-[11px] font-bold shrink-0"
                                            style={{
                                                width: G_DAY_W, height: G_DAY_H, borderRight: `1px solid ${G_LINE}`,
                                                background: isToday ? "rgba(22,119,255,0.12)" : isWe ? "rgba(0,30,80,0.04)" : "white",
                                                color: isToday ? BRAND_ACCENT : isWe ? "rgba(0,30,80,0.4)" : "rgba(0,30,80,0.7)"
                                            }}>
                                            {d.getDate()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Cuerpo */}
                    <div style={{ position: "relative" }}>
                        {/* Fondo: fines de semana + línea de hoy (una sola vez para todo el cuerpo) */}
                        <div style={{ position: "absolute", top: 0, bottom: 0, left: FIXED_W, width: totalDays * G_DAY_W, pointerEvents: "none", zIndex: 0 }}>
                            {Array.from({ length: totalDays }).map((_, idx) => {
                                const wd = addDays(minDate, idx).getDay();
                                return (wd === 0 || wd === 6)
                                    ? <div key={idx} style={{ position: "absolute", top: 0, bottom: 0, left: idx * G_DAY_W, width: G_DAY_W, background: "rgba(0,30,80,0.025)" }} />
                                    : null;
                            })}
                            {todayOffset >= 0 && todayOffset < totalDays && (
                                <div style={{ position: "absolute", top: 0, bottom: 0, left: todayOffset * G_DAY_W + G_DAY_W / 2 - 1, width: 2, background: "rgba(22,119,255,0.55)" }} />
                            )}
                        </div>

                        {tasks.map(task => {
                            const { startDate, dueDate } = parseTaskDates(task);
                            if (!startDate || !dueDate) return null;

                            const raw = toOffsets(startDate, dueDate);
                            const taskKey = `task_${task.id}`;
                            const { startOff, dur } = getOffsets(taskKey, raw.startOff, raw.dur);
                            const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
                            const doneCount = subs.filter(s => s.done).length;
                            const progress = subs.length ? (doneCount / subs.length) * 100 : 0;
                            const isOpen = !!expanded[task.id];
                            const isOverdue = dueDate < today && task.list_name !== "Hecho";
                            const bc = barColor(task);
                            const dragging = dragState?.key === taskKey;
                            const barLeft = startOff * G_DAY_W + 4;
                            const barW = Math.max(dur * G_DAY_W - 8, 28);
                            const fits = (task.title || "").length * 7 + 28 <= barW;
                            const label = rangeLabel(taskKey, startDate, dueDate);

                            return (
                                <Fragment key={task.id}>
                                    {/* ── FILA DE TAREA ── */}
                                    <div className="group" style={{ display: "flex", borderBottom: `1px solid ${G_LINE}` }}>
                                        <div style={{ ...leftCell("white"), display: "flex", minHeight: G_TASK_H }}>
                                            <div style={{ width: G_COL_PLAN, flexShrink: 0, padding: "12px 14px", borderRight: showDetail ? `1px solid ${G_LINE}` : "none" }}>
                                                <div className="flex items-start gap-2">
                                                    <button type="button" onClick={() => setExpanded(p => ({ ...p, [task.id]: !p[task.id] }))} disabled={subs.length === 0}
                                                        title={subs.length ? (isOpen ? "Ocultar subtareas" : "Ver subtareas") : "Sin subtareas"}
                                                        className="shrink-0 mt-0.5 h-5 w-5 rounded flex items-center justify-center border transition-all shadow-sm"
                                                        style={subs.length === 0
                                                            ? { borderColor: "rgba(0,30,80,0.1)", color: "rgba(0,30,80,0.2)", cursor: "not-allowed", background: "#f8fafc" }
                                                            : isOpen ? { borderColor: BRAND_ACCENT, background: BRAND_ACCENT, color: "white" }
                                                                : { borderColor: "rgba(0,30,80,0.2)", color: "rgba(0,30,80,0.5)", background: "white" }}>
                                                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <button type="button" onClick={() => onEdit(task)}
                                                            className="text-left text-sm font-bold leading-snug hover:text-[#1677FF] transition-colors w-full break-words" style={{ color: BRAND_NAVY }}>
                                                            {task.title || "Sin título"}
                                                        </button>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                                            <StatusBadge name={task.list_name} /><PriorityBadge value={task.priority} />
                                                            {isOverdue && <span className="text-[9px] font-black text-white bg-rose-500 rounded px-1.5 py-0.5">VENCIDA</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-wrap">
                                                            <Calendar className="h-3 w-3 shrink-0" /><span>{fmt(startDate)}</span><span className="text-slate-300">→</span>
                                                            <span className={isOverdue ? "text-rose-500" : ""}>{fmt(dueDate)}</span>
                                                        </div>
                                                        {subs.length > 0 && (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                                                    <div className="h-full rounded-full bg-[#1677FF] transition-all duration-500" style={{ width: `${progress}%` }} />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500 shrink-0">{doneCount}/{subs.length}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                        <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#1677FF] hover:bg-slate-50 shadow-sm"><Pencil className="h-3.5 w-3.5" /></button>
                                                        <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 shadow-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            {showDetail && (
                                                <>
                                                    <div style={{ width: G_COL_DETAIL, flexShrink: 0, padding: "12px 14px", background: "#f8f9fc", borderRight: `1px solid ${G_LINE}` }}>
                                                        {task.descripcion_problema
                                                            ? <p className="text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-wrap break-words">{task.descripcion_problema}</p>
                                                            : <span className="text-xs italic text-slate-400">—</span>}
                                                    </div>
                                                    <div style={{ width: G_COL_DETAIL, flexShrink: 0, padding: "12px 14px" }}>
                                                        {task.desarrollo_estrategia
                                                            ? <p className="text-xs leading-relaxed text-slate-600 font-medium whitespace-pre-wrap break-words">{task.desarrollo_estrategia}</p>
                                                            : <span className="text-xs italic text-slate-400">—</span>}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Zona de barras */}
                                        <div style={{ position: "relative", width: totalDays * G_DAY_W, flexShrink: 0 }}>
                                            <div className="absolute rounded-lg group/bar"
                                                style={{
                                                    left: barLeft, width: barW, top: "50%", marginTop: -22, height: 44, zIndex: 10,
                                                    background: `${bc}15`, borderLeft: `4px solid ${bc}`, borderTop: `1px solid ${bc}30`, borderBottom: `1px solid ${bc}30`,
                                                    borderRight: isOverdue ? "3px solid #ef4444" : `1px solid ${bc}30`,
                                                    cursor: dragging ? "grabbing" : "grab", userSelect: "none",
                                                    boxShadow: dragging ? `0 8px 24px ${bc}40` : "0 2px 4px rgba(0,0,0,0.05)",
                                                    transition: dragging ? "none" : "box-shadow .2s",
                                                }}
                                                onMouseDown={e => startDrag(e, taskKey, "move", startOff, dur, task.id, -1)}>
                                                <div className="absolute left-0 top-0 bottom-0 w-3 z-20 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity" style={{ cursor: "w-resize" }}
                                                    onMouseDown={e => startDrag(e, taskKey, "resize-left", startOff, dur, task.id, -1)}>
                                                    <div style={{ width: 3, height: 16, borderRadius: 2, background: `${bc}80` }} />
                                                </div>
                                                {fits && (
                                                    <div className="flex flex-col justify-center h-full px-3 overflow-hidden">
                                                        <span className="text-[12px] font-black truncate" style={{ color: bc }}>{task.title}</span>
                                                        <span className="text-[10px] font-bold truncate" style={{ color: `${bc}90` }}>{label}</span>
                                                    </div>
                                                )}
                                                {subs.length > 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-lg overflow-hidden" style={{ background: `${bc}10` }}>
                                                        <div className="h-full" style={{ width: `${progress}%`, background: bc }} />
                                                    </div>
                                                )}
                                                <div className="absolute right-0 top-0 bottom-0 w-3 z-20 flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity" style={{ cursor: "e-resize" }}
                                                    onMouseDown={e => startDrag(e, taskKey, "resize-right", startOff, dur, task.id, -1)}>
                                                    <div style={{ width: 3, height: 16, borderRadius: 2, background: `${bc}80` }} />
                                                </div>
                                            </div>
                                            {/* Si el título no cabe dentro de la barra, va a un costado (nunca se corta) */}
                                            {!fits && (
                                                <div className="absolute flex flex-col justify-center pointer-events-none" style={{ left: barLeft + barW + 8, top: "50%", marginTop: -20, height: 40, zIndex: 10, whiteSpace: "nowrap" }}>
                                                    <span className="text-[12px] font-black" style={{ color: bc }}>{task.title}</span>
                                                    <span className="text-[10px] font-bold" style={{ color: `${bc}90` }}>{label}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── FILAS DE SUBTAREAS (una por subtarea, con título completo) ── */}
                                    {isOpen && subs.map((sub, i) => {
                                        const { rawStart, rawEnd } = readSubDates(sub);
                                        const hasDates = !!(rawStart || rawEnd);
                                        let base;
                                        if (hasDates) {
                                            base = toOffsets(parseLocalDate(rawStart || rawEnd), parseLocalDate(rawEnd || rawStart));
                                        } else {
                                            const per = Math.max(1, Math.floor(raw.dur / subs.length));
                                            base = { startOff: raw.startOff + i * per, dur: i === subs.length - 1 ? Math.max(1, raw.dur - i * per) : per };
                                        }
                                        const subKey = `sub_${task.id}_${i}`;
                                        const { startOff: sOff, dur: sDur } = getOffsets(subKey, base.startOff, base.dur);
                                        const sc = sub.done ? "#10b981" : BRAND_ACCENT;
                                        const sTitle = sub.title || sub.titulo || "(sin título)";
                                        const sLeft = sOff * G_DAY_W + 6;
                                        const sW = Math.max(sDur * G_DAY_W - 12, 24);
                                        const sFits = sTitle.length * 6 + 16 <= sW;
                                        const sDrag = dragState?.key === subKey;
                                        const sRange = hasDates || dragOverrides[subKey]
                                            ? rangeLabel(subKey, addDays(minDate, sOff), addDays(minDate, sOff + sDur - 1))
                                            : null;

                                        return (
                                            <div key={subKey} style={{ display: "flex", borderBottom: `1px solid ${G_LINE}` }}>
                                                <div style={{ ...leftCell("#f8fafc"), minHeight: G_SUB_H, padding: "8px 14px 8px 46px" }}>
                                                    <div className="flex items-start gap-2">
                                                        <CheckSquare className={cls("h-4 w-4 shrink-0 mt-0.5", sub.done ? "text-emerald-500" : "text-slate-300")} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className={cls("text-[12px] leading-snug break-words", sub.done ? "line-through text-slate-400 font-medium" : "font-bold text-[#001E50]")}>{sTitle}</div>
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                                                {sRange ? sRange : "Sin fechas · rango estimado"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ position: "relative", width: totalDays * G_DAY_W, flexShrink: 0 }}>
                                                    <div className="absolute rounded-md flex items-center group/sub" title={sTitle}
                                                        style={{
                                                            left: sLeft, width: sW, top: "50%", marginTop: -12, height: 24, zIndex: 10,
                                                            background: `${sc}18`, borderLeft: `3px solid ${sc}`, borderTop: `1px ${hasDates ? "solid" : "dashed"} ${sc}40`,
                                                            borderRight: `1px ${hasDates ? "solid" : "dashed"} ${sc}40`, borderBottom: `1px ${hasDates ? "solid" : "dashed"} ${sc}40`,
                                                            cursor: sDrag ? "grabbing" : "grab", userSelect: "none",
                                                            boxShadow: sDrag ? `0 4px 12px ${sc}40` : "none",
                                                        }}
                                                        onMouseDown={e => startDrag(e, subKey, "move", sOff, sDur, task.id, i)}>
                                                        {sFits && <span className="text-[10px] font-bold px-2 whitespace-nowrap" style={{ color: sub.done ? "#047857" : sc }}>{sTitle}</span>}
                                                        <div className="absolute left-0 top-0 bottom-0 w-2 z-20 opacity-0 group-hover/sub:opacity-100" style={{ cursor: "w-resize" }}
                                                            onMouseDown={e => startDrag(e, subKey, "resize-left", sOff, sDur, task.id, i)} />
                                                        <div className="absolute right-0 top-0 bottom-0 w-2 z-20 opacity-0 group-hover/sub:opacity-100" style={{ cursor: "e-resize" }}
                                                            onMouseDown={e => startDrag(e, subKey, "resize-right", sOff, sDur, task.id, i)} />
                                                    </div>
                                                    {!sFits && (
                                                        <span className="absolute text-[10px] font-bold pointer-events-none" style={{ left: sLeft + sW + 8, top: "50%", marginTop: -7, zIndex: 10, whiteSpace: "nowrap", color: sub.done ? "#047857" : sc }}>
                                                            {sTitle}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}




/* TIMELINE VIEW (el Gantt vive ahora en <GanttChart/>) */
function TimelineView({ tasks, onEdit, onDelete, onUpdateDates, loading,
    teams, projects, teamId, projectId, currentUser, allTasks }) {

    const [expandedRows, setExpandedRows] = useState({});
    const HIGHLIGHT = BRAND_ACCENT;
    const PANEL_BG = "#f8f9fc";

    const withDate = useMemo(() => tasks.filter(t =>
        (t.start_date && String(t.start_date).trim()) ||
        (t.due_date && String(t.due_date).trim())
    ), [tasks]);

    const noDate = useMemo(() => tasks.filter(t =>
        !(t.start_date && String(t.start_date).trim()) &&
        !(t.due_date && String(t.due_date).trim())
    ), [tasks]);

    function getSubDates(sub) { return readSubDates(sub); }

    async function exportToPDF() {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();
        const margin = 18;
        const contentW = W - margin * 2;
        const BLUE = [0, 30, 80]; // Navy corporate
        const GRAY = [100, 116, 139]; // slate-500
        const BLACK = [15, 23, 42]; // slate-900

        let usarVW = false;
        try {
            if (VW_HEAD_BOLD && VW_HEAD_BOLD.length > 1000 && VW_TEXT_LIGHT && VW_TEXT_LIGHT.length > 1000) {
                doc.addFileToVFS("VWHeadBold.ttf", VW_HEAD_BOLD);
                doc.addFont("VWHeadBold.ttf", "VWHead", "bold");
                doc.addFileToVFS("VWTextLight.ttf", VW_TEXT_LIGHT);
                doc.addFont("VWTextLight.ttf", "VWText", "normal");
                usarVW = true;
            }
        } catch (e) { console.warn("Fuentes VW no disponibles:", e); }

        function setHead(size, color = BLACK) { doc.setFont(usarVW ? "VWHead" : "helvetica", "bold"); doc.setFontSize(size); doc.setTextColor(...color); }
        function setLight(size, color = BLACK) { doc.setFont(usarVW ? "VWText" : "helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(...color); }
        function setItalic(size, color = GRAY) { doc.setFont("helvetica", "italic"); doc.setFontSize(size); doc.setTextColor(...color); }

        const pageDims = { 1: { w: W, h: H } };

        function drawFooter(pageNum, totalPages, pw = W, ph = H) {
            const fechaImp = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "2-digit" });
            const usuario = currentUser?.name || "Sistema";
            setLight(7.5, GRAY);
            doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2);
            doc.line(margin, ph - 12, pw - margin, ph - 12);
            doc.text(`${fechaImp}; generado por ${usuario}.`, margin, ph - 7);
            doc.text(`Página ${pageNum} / ${totalPages}`, pw - margin, ph - 7, { align: "right" });
        }

        function separator(y, color = [226, 232, 240]) {
            doc.setDrawColor(...color);
            doc.setLineWidth(0.3);
            doc.line(margin, y, W - margin, y);
        }

        function block(label, content, y, labelSize = 8, contentSize = 9.5) {
            if (!content || !content.trim()) return y;
            setHead(labelSize, BLUE);
            doc.text(label, margin, y);
            y += 5;
            setLight(contentSize, BLACK);
            const lines = doc.splitTextToSize(content, contentW);
            doc.text(lines, margin, y);
            return y + lines.length * (contentSize * 0.42) + 5;
        }

        const selectedTeam = teams.find(t => Number(t.id) === Number(teamId));
        const selectedProject = projects.find(p => Number(p.id) === Number(projectId));

        const allDates = allTasks.flatMap(t => [t.start_date, t.due_date]).filter(Boolean).map(d => parseLocalDate(d)).filter(d => d && !isNaN(d)).sort((a, b) => a - b);
        const proyectoInicio = allDates[0]?.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) || null;
        const proyectoFin = allDates[allDates.length - 1]?.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) || null;

        const porHacer = allTasks.filter(t => t.list_name === "Por hacer").length;
        const enProceso = allTasks.filter(t => t.list_name === "En proceso").length;
        const hecho = allTasks.filter(t => t.list_name === "Hecho").length;

        let resumenIA = "";
        try {
            const authRaw = localStorage.getItem("auth") || "{}";
            const authData = JSON.parse(authRaw);
            const token = authData?.token || authData?.access_token || authData?.accessToken || "";

            const resp = await fetch(`${API_ROOT}/api/clickup/ia/resumen/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    tareas: allTasks.slice(0, 8).map(t => ({ descripcion_problema: t.descripcion_problema || "", desarrollo_estrategia: t.desarrollo_estrategia || "", resultados: t.resultados || "" })),
                    proyecto_nombre: selectedProject?.name || "Proyecto",
                    equipo_nombre: selectedTeam?.name || "Grupo Automotriz R&R",
                    total: allTasks.length,
                    hecho: hecho,
                }),
            });
            if (resp.ok) { const data = await resp.json(); resumenIA = data?.resumen?.trim() || ""; }
        } catch (e) { console.warn("Resumen IA no disponible:", e); }

        if (!resumenIA) {
            const causasFrecuentes = [...new Set(allTasks.map(t => t.causa).filter(Boolean))].slice(0, 3).join(", ");
            resumenIA = `El proyecto "${selectedProject?.name || "sin nombre"}" del equipo "${selectedTeam?.name || "Grupo Automotriz R&R"}" cuenta con ${allTasks.length} planes de acción registrados, de los cuales ${hecho} han sido completados, ${enProceso} están en proceso y ${porHacer} están pendientes de iniciar. ` +
                (causasFrecuentes ? `Las principales causas identificadas corresponden a: ${causasFrecuentes}. ` : "") +
                `El seguimiento de estos planes contribuye a la mejora continua de los procesos operativos y comerciales de la organización.`;
        }

        // PORTADA
        doc.setFillColor(...BLUE); doc.rect(0, 0, W, 14, "F");
        setLight(8, [255, 255, 255]); doc.text("Control de Proyectos · Time For Action", margin, 9.5);

        let y = 30;
        setHead(10, GRAY); doc.text(selectedTeam?.name?.toUpperCase() || "GRUPO AUTOMOTRIZ R&R", margin, y); y += 8;
        setHead(26, [...BLUE]); const projLines = doc.splitTextToSize(selectedProject?.name || "Proyecto", contentW); doc.text(projLines, margin, y); y += projLines.length * 11 + 4;
        if (proyectoInicio && proyectoFin) { setItalic(9, GRAY); doc.text(`${proyectoInicio} - ${proyectoFin}`, margin, y); y += 10; }
        separator(y); y += 8;

        setLight(10, BLACK); const resumenLines = doc.splitTextToSize(resumenIA, contentW); doc.text(resumenLines, margin, y); y += resumenLines.length * 5 + 10;
        if (y > H - 60) y = H - 60;
        separator(y); y += 8;

        const statCols = [{ label: "Planes Totales", val: String(allTasks.length) }, { label: "Pendientes", val: String(porHacer) }, { label: "En Proceso", val: String(enProceso) }, { label: "Completados", val: String(hecho) }];
        const statW = contentW / statCols.length;
        statCols.forEach((s, i) => {
            const sx = margin + i * statW + statW / 2;
            setHead(20, [...BLUE]); doc.text(s.val, sx, y + 8, { align: "center" });
            setHead(8, GRAY); doc.text(s.label.toUpperCase(), sx, y + 14, { align: "center" });
        });

        // PÁGINAS DE PLANES
        const PRIO_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const tasksList = [...withDate, ...noDate].sort((a, b) => (PRIO_ORDER[a.priority] ?? 2) - (PRIO_ORDER[b.priority] ?? 2));
        tasksList.forEach((task, idx) => {
            doc.addPage();
            pageDims[doc.getNumberOfPages()] = { w: W, h: H };
            const subtasks = Array.isArray(task.subtareas) ? task.subtareas : [];
            const doneCount = subtasks.filter(s => s.done).length;

            let cy = 20;

            setHead(20, [...BLUE]);
            const titleLines = doc.splitTextToSize(task.title || "Sin título", contentW);
            doc.text(titleLines, margin, cy);
            cy += titleLines.length * 9 + 4;

            setHead(9, GRAY);
            const prioLabel = { LOW: "BAJA", MEDIUM: "MEDIA", HIGH: "ALTA", URGENT: "URGENTE" }[task.priority] || task.priority;
            doc.text(`ESTATUS: ${task.list_name?.toUpperCase() || "-"}   |   PRIORIDAD: ${prioLabel || "-"}`, margin, cy);
            cy += 6;

            const sStr = task.start_date ? String(task.start_date).slice(0, 10) : null;
            const eStr = task.due_date ? String(task.due_date).slice(0, 10) : null;
            if (sStr || eStr) { setItalic(8.5, GRAY); doc.text(`FECHAS: ${sStr || "-"} al ${eStr || "-"}`, margin, cy); cy += 7; }

            separator(cy); cy += 8;

            if (task.causa || task.raiz) {
                const causaTxt = [task.causa, task.raiz].filter(Boolean).join("  >  ");
                setHead(8, [...BLUE]); doc.text("CAUSA RAÍZ:", margin, cy); cy += 5;
                setLight(9.5, BLACK); const causaLines = doc.splitTextToSize(causaTxt, contentW); doc.text(causaLines, margin, cy); cy += causaLines.length * 4.5 + 8;
            }

            separator(cy, [241, 245, 249]); cy += 8;
            cy = block("Descripción del Problema", task.descripcion_problema, cy, 9, 10);
            cy = block("Desarrollo de la estrategia", task.desarrollo_estrategia, cy, 9, 10);

            if (subtasks.length > 0) {
                setHead(9, [...BLUE]); doc.text(`Subtareas  (${doneCount}/${subtasks.length} completadas)`, margin, cy); cy += 6;
                const barW = contentW * 0.5;
                doc.setFillColor(241, 245, 249); doc.roundedRect(margin, cy, barW, 3, 1.5, 1.5, "F");
                if (doneCount > 0) { doc.setFillColor(22, 119, 255); doc.roundedRect(margin, cy, barW * (doneCount / subtasks.length), 3, 1.5, 1.5, "F"); }
                cy += 8;
                subtasks.forEach(sub => {
                    const mark = sub.done ? "[ x ]" : "[   ]";
                    const { rawStart, rawEnd } = getSubDates(sub);
                    const subInicio = rawStart ? String(rawStart).slice(0, 10) : "";
                    const subFin = rawEnd ? String(rawEnd).slice(0, 10) : "";
                    const fechaSub = (subInicio || subFin) ? `   ( ${subInicio || "-"}  →  ${subFin || "-"} )` : "";
                    const subTxt = `${mark}  ${sub.title || sub.titulo || ""}${fechaSub}`;
                    setLight(sub.done ? 8.5 : 9.5, sub.done ? GRAY : BLACK);
                    const subLines = doc.splitTextToSize(subTxt, contentW - 4);
                    doc.text(subLines, margin + 2, cy);
                    cy += subLines.length * 5 + 2;
                });
                cy += 6;
            }

            cy = block("Resultados Esperados", task.resultados, cy, 9, 10);

            if (Array.isArray(task.asignados) && task.asignados.length > 0) {
                separator(cy, [241, 245, 249]); cy += 7;
                setHead(9, [...BLUE]); doc.text("Asignado a:", margin, cy); cy += 6;
                setLight(10, BLACK); doc.text(task.asignados.map(a => a.name || a.email || "-").join("   |   "), margin, cy); cy += 8;
            }

            if (Array.isArray(task.evidencias) && task.evidencias.length > 0) {
                separator(cy, [241, 245, 249]); cy += 7;
                setHead(9, [...BLUE]); doc.text(`Evidencias Adjuntas (${task.evidencias.length})`, margin, cy); cy += 7;
                task.evidencias.forEach(ev => {
                    const url = ev.proxy_url || ev.archivo_url || "";
                    const name = decodeURIComponent(url.split("/").pop().split("?")[0]).slice(0, 65) || "Archivo adjunto";
                    doc.setFillColor(248, 250, 252); doc.roundedRect(margin, cy - 4, contentW, 8, 2, 2, "F");
                    const ext = name.split(".").pop().toLowerCase();
                    const icon = ext === "pdf" ? "[ PDF ]" : ["jpg", "jpeg", "png", "webp"].includes(ext) ? "[ IMG ]" : "[ DOC ]";
                    setHead(8, [...BLUE]); doc.text(icon, margin + 3, cy + 1.5);
                    setLight(8.5, BLACK); doc.text(name, margin + 18, cy + 1.5);
                    if (url) doc.link(margin + 18, cy - 3, contentW - 20, 8, { url });
                    cy += 10;
                });
            }

        });

        // ═════════ RESUMEN FINAL (formato tabla de plan de acción, hoja horizontal) ═════════
        {
            const LW = H, LH = W;                       // A4 horizontal (297 x 210)
            const m = 10, tw = LW - m * 2;              // márgenes y ancho útil (277 mm)
            const MID = [110, 110, 110], SKY = [157, 195, 230], LINE = [150, 150, 150], WHITE = [255, 255, 255];
            const FS = 6.5, LHF = 1.3, lh = FS * 0.3528 * LHF, padX = 1.3, padY = 1.5;
            const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
            const fShort = (v) => { const d = parseLocalDate(v); return d ? d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" }) : ""; };

            const cols = [
                { k: "tema", label: "Tema", w: 20 },
                { k: "area", label: "Área de oportunidad", w: 30 },
                { k: "raiz", label: "Causa Raíz / Motivo", w: 34 },
                { k: "accion", label: "Recomendación / Acción / Entregable", w: 56 },
                { k: "resp", label: "Responsable (Puesto)", w: 22 },
                { k: "f1", label: "Fecha 1er acuerdo", w: 14 },
                { k: "p1", label: "Plazo Límite", w: 14 },
                { k: "e1", label: "1er. Estatus de la acción", w: 17 },
                { k: "f2", label: "Fecha 2o acuerdo", w: 14 },
                { k: "p2", label: "Plazo Límite", w: 14 },
                { k: "e2", label: "2o Estatus de la acción", w: 17 },
                { k: "obs", label: "Observaciones", w: 25 },
            ];

            const sumTasks = [...tasksList].sort((a, b) =>
                String(a.causa || "ÿ").localeCompare(String(b.causa || "ÿ"), "es") ||
                (PRIO_ORDER[a.priority] ?? 2) - (PRIO_ORDER[b.priority] ?? 2));

            const rows = sumTasks.map(t => {
                const subs = Array.isArray(t.subtareas) ? t.subtareas : [];
                const subTxt = subs.length ? "Subtareas: " + subs.map(s => `${s.done ? "[x]" : "[ ]"} ${s.title || s.titulo || ""}`).join("  /  ") : "";
                const asg = Array.isArray(t.asignados) ? t.asignados : (Array.isArray(t.assigned) ? t.assigned : []);
                return {
                    tema: (t.causa || "SIN CATEGORÍA").toUpperCase(),
                    area: t.title || "",
                    raiz: t.raiz || "",
                    accion: [(t.desarrollo_estrategia || "").trim(), subTxt].filter(Boolean).join("\n"),
                    resp: asg.map(a => a.name || a.email).filter(Boolean).join(", "),
                    f1: fShort(t.start_date), p1: fShort(t.due_date), e1: t.list_name || "",
                    f2: "", p2: "", e2: "",
                    obs: t.resultados || "",
                    _late: (() => { const d = parseLocalDate(t.due_date); return !!(d && d < hoy && t.list_name !== "Hecho"); })(),
                };
            });

            const doneSum = sumTasks.filter(t => t.list_name === "Hecho").length;
            const lateSum = rows.filter(r => r._late).length;
            const pctSum = sumTasks.length ? Math.round((doneSum / sumTasks.length) * 100) : 0;
            const fechaLarga = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
            const usuarioSum = currentUser?.name || "Sistema";

            function newLandscapePage() {
                doc.addPage("a4", "landscape");
                pageDims[doc.getNumberOfPages()] = { w: LW, h: LH };
            }

            function cell(x, y, w, h, fill) {
                doc.setDrawColor(...LINE); doc.setLineWidth(0.2);
                if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, "FD"); } else { doc.rect(x, y, w, h, "S"); }
            }

            function band(y, h, fill, textColor, items) {
                let x = m;
                items.forEach(([text, w, bold]) => {
                    cell(x, y, w, h, fill);
                    if (bold) setHead(7.5, textColor); else setLight(7.5, textColor);
                    const line = doc.splitTextToSize(String(text), w - 2)[0] || "";
                    doc.text(line, x + w / 2, y + h / 2 + 1.1, { align: "center" });
                    x += w;
                });
                return y + h;
            }

            function headerRow(y) {
                setHead(6.8, WHITE);
                const lines = cols.map(c => doc.splitTextToSize(c.label, c.w - padX * 2));
                const h = Math.max(...lines.map(l => l.length)) * (6.8 * 0.3528 * LHF) + padY * 2;
                let x = m;
                cols.forEach((c, i) => {
                    cell(x, y, c.w, h, MID);
                    const blockH = lines[i].length * (6.8 * 0.3528 * LHF);
                    doc.text(lines[i], x + c.w / 2, y + (h - blockH) / 2 + 6.8 * 0.3528 * 0.95, { align: "center" });
                    x += c.w;
                });
                return y + h;
            }

            function dataRow(r, y) {
                const MAXL = 26;
                setHead(FS, WHITE);
                const temaLines = doc.splitTextToSize(r.tema, cols[0].w - padX * 2);
                setLight(FS, BLACK);
                const cellLines = cols.map(c => {
                    if (c.k === "tema") return temaLines;
                    let L = doc.splitTextToSize(String(r[c.k] || ""), c.w - padX * 2);
                    if (L.length > MAXL) { L = L.slice(0, MAXL); L[MAXL - 1] = L[MAXL - 1].replace(/.{0,3}$/, "") + "..."; }
                    return L;
                });
                const h = Math.max(11, Math.max(...cellLines.map(l => l.length)) * lh + padY * 2);

                if (y + h > LH - 14) {                      // salto de página: repite el encabezado de la tabla
                    newLandscapePage();
                    setHead(8, GRAY); doc.text("Resumen de planes de acción (continuación)", m, m + 3);
                    y = headerRow(m + 6);
                }

                let x = m;
                cols.forEach((c, i) => {
                    const lines = cellLines[i];
                    let fill = null;
                    if (c.k === "tema") fill = MID;
                    else if (c.k === "e1") fill = r.e1 === "Hecho" ? [220, 252, 231] : r.e1 === "En proceso" ? [219, 234, 254] : null;
                    cell(x, y, c.w, h, fill);

                    if (c.k === "tema") setHead(FS, WHITE);
                    else if (c.k === "p1" && r._late) setHead(FS, [220, 38, 38]);
                    else setLight(FS, BLACK);

                    if (lines.length && lines.join("").trim()) {
                        const blockH = lines.length * lh;
                        doc.text(lines, x + c.w / 2, y + (h - blockH) / 2 + FS * 0.3528 * 0.95, { align: "center" });
                    }
                    x += c.w;
                });
                return y + h;
            }

            newLandscapePage();
            doc.setLineHeightFactor(LHF);

            setHead(15, [...BLUE]);
            doc.text("RESUMEN DE PLANES DE ACCIÓN", m, m + 6);
            let sy = m + 10;
            sy = band(sy, 7, BLUE, WHITE, [
                ["Equipo:", 24, false], [selectedTeam?.name || "Grupo Automotriz R&R", 70, true],
                ["Proyecto:", 24, false], [selectedProject?.name || "Proyecto", 89, true],
                ["Fecha:", 20, false], [fechaLarga, 50, true],
            ]);
            sy = band(sy, 7, SKY, BLUE, [
                ["RESUMEN DE AVANCE", 64, true],
                ["Planes:", 18, false], [`${doneSum} de ${sumTasks.length} completados (${pctSum}%)`, 70, true],
                ["Vencidos:", 20, false], [String(lateSum), 20, true],
                ["Generado por:", 30, false], [usuarioSum, 55, true],
            ]);
            sy = headerRow(sy);

            if (rows.length === 0) {
                setLight(8, GRAY); doc.text("No hay planes para mostrar.", m, sy + 8);
            } else {
                rows.forEach(r => { sy = dataRow(r, sy); });
            }

            doc.setLineHeightFactor(1.15);
        }

        // Pie de página en TODAS las hojas (ya se conoce el total, incluida la tabla final)
        const totalPagesFinal = doc.getNumberOfPages();
        for (let p = 1; p <= totalPagesFinal; p++) {
            doc.setPage(p);
            const d = pageDims[p] || { w: W, h: H };
            drawFooter(p, totalPagesFinal, d.w, d.h);
        }

        const nombreProyecto = (selectedProject?.name || "TimeForAction").replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 40);
        doc.save(`${nombreProyecto}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    if (loading) return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
    );

    if (tasks.length === 0) return (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
            <GitBranch className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-black text-[#001E50] mb-1">Sin planes en el calendario</h3>
            <p className="text-sm text-slate-500">Agrega fechas a tus planes para visualizarlos en el Gantt.</p>
        </div>
    );

    return (
        <div className="w-full space-y-5">
            {withDate.length > 0 && (
                <GanttChart tasks={withDate} onEdit={onEdit} onDelete={onDelete}
                    onUpdateDates={onUpdateDates} onExport={exportToPDF} />
            )}

            {/* SIN FECHA */}
            {noDate.length > 0 && (
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-200 bg-slate-50">
                        <Clock3 className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-black text-[#001E50] uppercase tracking-wider">Sin fecha asignada en Gantt ({noDate.length})</span>
                    </div>
                    <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ background: PANEL_BG }}>
                        {noDate.map(task => {
                            const subtasks = Array.isArray(task.subtareas) ? task.subtareas : [];
                            const doneCount = subtasks.filter(s => s.done).length;
                            const isExpND = !!expandedRows[`nd_${task.id}`];
                            return (
                                <div key={task.id} className="rounded-xl overflow-hidden shadow-sm bg-white border border-slate-200 hover:border-[#1677FF]/30 hover:shadow-md transition-all">
                                    <div className="flex items-start gap-3 p-4">
                                        <button type="button"
                                            onClick={() => setExpandedRows(p => ({ ...p, [`nd_${task.id}`]: !p[`nd_${task.id}`] }))}
                                            disabled={subtasks.length === 0}
                                            className="shrink-0 mt-0.5 h-6 w-6 rounded-md flex items-center justify-center border transition-colors shadow-sm"
                                            style={subtasks.length === 0
                                                ? { borderColor: `rgba(0,30,80,0.1)`, color: `rgba(0,30,80,0.3)`, cursor: "not-allowed", background: "#f8fafc" }
                                                : isExpND
                                                    ? { borderColor: HIGHLIGHT, background: HIGHLIGHT, color: "white" }
                                                    : { borderColor: `rgba(0,30,80,0.2)`, color: `rgba(0,30,80,0.6)`, background: "white" }}>
                                            {isExpND ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black mb-2 text-[#001E50] break-words">{task.title}</div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <PriorityBadge value={task.priority} />
                                                <StatusBadge name={task.list_name} />
                                                {subtasks.length > 0 && (
                                                    <span className="text-[10px] font-bold rounded px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200">
                                                        ✓ {doneCount}/{subtasks.length}
                                                    </span>
                                                )}
                                            </div>
                                            {task.descripcion_problema && (
                                                <p className="text-[11px] line-clamp-2 mt-3 leading-relaxed text-slate-500 font-medium">{task.descripcion_problema}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-[#1677FF] shadow-sm transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 shadow-sm transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </div>
                                    {isExpND && subtasks.length > 0 && (
                                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                                            <div className="h-2 w-full rounded-full overflow-hidden mb-3 bg-slate-200">
                                                <div className="h-full rounded-full bg-[#1677FF]" style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%` }} />
                                            </div>
                                            <div className="space-y-2">
                                                {subtasks.map((sub, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        {sub.done
                                                            ? <CheckSquare className="h-3.5 w-3.5 mt-0.5 text-[#1677FF] shrink-0" />
                                                            : <CheckSquare className="h-3.5 w-3.5 mt-0.5 text-slate-300 shrink-0" />}
                                                        <span className={cls("text-[11px] font-medium break-words", sub.done ? "line-through text-slate-400" : "text-[#001E50]")}
                                                            style={{ flex: 1 }}>
                                                            {sub.title || sub.titulo}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

const VIEW_HINTS = {
    dashboard: "Dashboard: resumen de KPIs, avance y vencimientos. Haz clic en un indicador para ir al Kanban ya filtrado.",
    kanban: "Kanban: arrastra una tarjeta a otra columna para cambiar su fase. Pasa el cursor sobre ella para editarla o eliminarla.",
    tabla: "Lista detallada: haz clic en una fila para desplegarla y editar todo el plan sin abrir ventanas.",
    timeline: "Gantt: arrastra una barra para mover sus fechas y sus bordes para cambiar la duración. Despliega un plan para ver sus subtareas.",
};

const HELP_GROUPS = [
    {
        title: "Dónde estoy", items: [
            { Icon: UsersRound, name: "Equipo", desc: "Grupo de personas que comparten proyectos. Al cambiarlo se actualizan los proyectos y planes que ves." },
            { Icon: Layers, name: "Proyecto", desc: "Un tablero de planes de acción con tres fases: Por hacer, En proceso y Hecho. Elige cuál quieres ver." },
            { Icon: ChevronDown, name: "Gestionar", desc: "Renombrar el proyecto actual, crear uno nuevo o eliminarlo (esto borra todos sus planes)." },
        ]
    },
    {
        title: "Acciones principales", items: [
            { Icon: UsersRound, name: "Equipos", desc: "Crea equipos, invita personas con un rol (miembro, administrador o lector) y acepta invitaciones pendientes." },
            { Icon: Plus, name: "Nuevo plan", desc: "Abre el formulario para crear un plan: problema, causa raíz, estrategia, subtareas con fechas, responsables y evidencias." },
        ]
    },
    {
        title: "Vistas", items: [
            { Icon: LayoutDashboard, name: "Dashboard", desc: "Indicadores: totales por fase, vencidos, próximos a vencer, carga por responsable y avance de subtareas." },
            { Icon: LayoutGrid, name: "Kanban", desc: "Tarjetas por columna. Arrástralas entre columnas para cambiar su fase." },
            { Icon: Table2, name: "Lista detallada", desc: "Tabla ordenable. Despliega una fila para editar todo el plan directamente." },
            { Icon: GitBranch, name: "Gantt", desc: "Línea de tiempo con barras por plan y por subtarea. Arrástralas para reprogramar y exporta el reporte a PDF." },
        ]
    },
    {
        title: "Filtros", items: [
            { Icon: Search, name: "Buscar", desc: "Filtra por texto en el título, problema, causa o estrategia." },
            { Icon: Clock3, name: "Todas las fases", desc: "Limita lo que ves a una sola fase: Por hacer, En proceso o Hecho." },
            { Icon: UsersRound, name: "Solo mis planes", desc: "Muestra únicamente los planes donde apareces como responsable." },
        ]
    },
    {
        title: "Dentro de las vistas", items: [
            { Icon: Plus, name: "+ en una columna del Kanban", desc: "Crea un plan directamente en esa fase." },
            { Icon: FileText, name: "Exportar a PDF (Gantt)", desc: "Genera un reporte con portada, resumen y una hoja por plan." },
        ]
    },
];

export default function TimeForAction() {
    const [teamId, setTeamId] = useState(() => { const v = localStorage.getItem("clickup_team_id"); return v ? Number(v) : null; });
    const [projectId, setProjectId] = useState(() => { const v = localStorage.getItem("clickup_project_id"); return v ? Number(v) : null; });
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState("kanban");
    const [q, setQ] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [teamsModalOpen, setTeamsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
    const [deletingTask, setDeletingTask] = useState(false);
    const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
    const [deletingProject, setDeletingProject] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [projectMenuOpen, setProjectMenuOpen] = useState(false);
    const [moveToast, setMoveToast] = useState(null);

    useEffect(() => {
        try { const auth = localStorage.getItem("auth"); if (auth) { const p = JSON.parse(auth); const u = p?.user || p?.usuario; if (u) setCurrentUser({ id: u.id_usuario || u.id, name: u.nombre_completo || u.nombre, email: u.correo || u.email }); } } catch (e) { }
    }, []);

    const fetchTeams = useCallback(async () => {
        try {
            const data = await apiClickup.listTeams();
            const arr = Array.isArray(data) ? data : [];
            setTeams(arr);
            if (!teamId && arr[0]) setTeamId(Number(arr[0].id));
            if (teamId && arr.length > 0 && !arr.find(t => Number(t.id) === Number(teamId))) {
                setTeamId(Number(arr[0].id));
                setProjectId(null);
            }
        } catch (e) { console.error(e); }
    }, [teamId]);

    useEffect(() => { fetchTeams(); }, []);
    useEffect(() => {
        if (!teamId) return;
        apiClickup.listProjects(teamId).then(data => {
            const arr = Array.isArray(data) ? data : [];
            setProjects(arr);
            if (!projectId && arr[0]) setProjectId(Number(arr[0].id));
        }).catch(console.error);
    }, [teamId]);

    const loadBoard = useCallback(async (silent = false) => {
        if (!teamId || !projectId) return;
        if (!silent) setLoading(true);
        try {
            const res = await apiClickup.getBoard(Number(teamId), Number(projectId));
            const rawLists = res?.lists || [];
            const tasksByList = res?.tasks_by_list || {};
            setLists(rawLists);
            setTasks(rawLists.flatMap(l => (tasksByList[l.id] || []).map(t => ({ ...t, list_name: l.name, list_id: l.id }))));
        } catch (e) { console.error(e); }
        finally { if (!silent) setLoading(false); }
    }, [teamId, projectId]);

    useEffect(() => { loadBoard(); }, [loadBoard]);

    const syncRefresh = useCallback(async () => {
        if (!teamId || !projectId) return;
        await loadBoard(true);
    }, [teamId, projectId, loadBoard]);

    useSyncTasks(syncRefresh, { interval: 20000 });

    useEffect(() => {
        if (!teamId) return;
        apiClickup.listNotifications().then(notifs => {
            const hasInvites = notifs.some(n => n.type === "TEAM_INVITE" || n.type === "INVITATION" || n.type === "TASK_ASSIGNED");
            if (hasInvites) loadBoard();
        }).catch(() => { });
    }, [teamId]);

    useEffect(() => {
        const handler = async (e) => {
            const { teamId: tid, projectId: pid, taskId } = e.detail || {};
            if (tid) { setTeamId(Number(tid)); localStorage.setItem("clickup_team_id", String(tid)); }
            if (pid) { setProjectId(Number(pid)); localStorage.setItem("clickup_project_id", String(pid)); }
            setTimeout(async () => {
                await loadBoard();
                if (taskId) { setTasks(prev => { const found = prev.find(t => Number(t.id) === Number(taskId)); if (found) { setEditingTask(found); setModalOpen(true); } return prev; }); }
            }, 800);
        };
        window.addEventListener("clickup:navigate", handler);
        return () => window.removeEventListener("clickup:navigate", handler);
    }, [loadBoard]);

    const handleUpdateDates = useCallback(async (taskId, subIdx, newStart, newEnd) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !teamId) return;
        try {
            if (subIdx === -1) {
                const payload = {
                    lista: Number(task.list_id), titulo: task.title, prioridad: task.priority,
                    inicio: `${newStart}T00:00:00Z`, vence: `${newEnd}T00:00:00Z`,
                    descripcion_problema: task.descripcion_problema || "",
                    causa: task.causa || "", raiz: task.raiz || "",
                    desarrollo_estrategia: task.desarrollo_estrategia || "",
                    resultados: task.resultados || "",
                    subtareas: Array.isArray(task.subtareas) ? task.subtareas.map(s => ({
                        titulo: s.title || s.titulo, done: !!s.done,
                        start_date: s.start_date || null, due_date: s.due_date || null,
                    })) : [],
                    asignados_ids: Array.isArray(task.asignados) ? task.asignados.map(a => a.user_id || a.id) : [],
                };
                await apiClickup.updateTask(Number(teamId), Number(taskId), payload);
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, start_date: newStart, due_date: newEnd } : t));
                notifyTasksChanged();
            } else {
                const updatedSubtareas = (Array.isArray(task.subtareas) ? task.subtareas : []).map((s, i) =>
                    i === subIdx ? { ...s, start_date: newStart, due_date: newEnd } : s
                );
                const payload = {
                    lista: Number(task.list_id), titulo: task.title, prioridad: task.priority,
                    inicio: task.start_date ? `${String(task.start_date).slice(0, 10)}T00:00:00Z` : null,
                    vence: task.due_date ? `${String(task.due_date).slice(0, 10)}T00:00:00Z` : null,
                    descripcion_problema: task.descripcion_problema || "",
                    causa: task.causa || "", raiz: task.raiz || "",
                    desarrollo_estrategia: task.desarrollo_estrategia || "",
                    resultados: task.resultados || "",
                    subtareas: updatedSubtareas.map(s => ({
                        titulo: s.title || s.titulo, done: !!s.done,
                        start_date: s.start_date || null, due_date: s.due_date || null,
                    })),
                    asignados_ids: Array.isArray(task.asignados) ? task.asignados.map(a => a.user_id || a.id) : [],
                };
                await apiClickup.updateTask(Number(teamId), Number(taskId), payload);
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtareas: updatedSubtareas } : t));
                notifyTasksChanged();
            }
        } catch (e) {
            console.error("Error al actualizar fechas desde timeline:", e);
            await loadBoard();
        }
    }, [tasks, teamId, loadBoard]);

    const handleMoveTask = useCallback(async (taskId, targetListId, targetName) => {
        const task = tasks.find(t => Number(t.id) === Number(taskId));
        if (!task || !teamId) return;
        if (Number(task.list_id) === Number(targetListId)) return;
        const snapshot = tasks;
        setTasks(prev => prev.map(t => Number(t.id) === Number(taskId) ? { ...t, list_id: targetListId, list_name: targetName } : t));
        let toast;
        try {
            const payload = {
                lista: Number(targetListId), titulo: task.title, prioridad: task.priority,
                inicio: task.start_date ? `${String(task.start_date).slice(0, 10)}T00:00:00Z` : null,
                vence: task.due_date ? `${String(task.due_date).slice(0, 10)}T00:00:00Z` : null,
                descripcion_problema: task.descripcion_problema || "",
                causa: task.causa || "", raiz: task.raiz || "",
                desarrollo_estrategia: task.desarrollo_estrategia || "",
                resultados: task.resultados || "",
                subtareas: (Array.isArray(task.subtareas) ? task.subtareas : []).map(s => {
                    const { rawStart, rawEnd } = readSubDates(s);
                    return { titulo: s.title || s.titulo, done: !!s.done, start_date: dateToInput(rawStart) || null, due_date: dateToInput(rawEnd) || null };
                }),
                asignados_ids: Array.isArray(task.asignados) ? task.asignados.map(a => a.user_id || a.id) : [],
            };
            await apiClickup.updateTask(Number(teamId), Number(taskId), payload);
            notifyTasksChanged();
            toast = { ok: true, msg: `«${task.title}» movido a ${targetName}` };
        } catch (e) {
            console.error("Error al mover el plan:", e);
            setTasks(snapshot);
            toast = { ok: false, msg: e.message || "No se pudo mover el plan" };
            await loadBoard(true);
        }
        setMoveToast(toast);
        setTimeout(() => setMoveToast(null), 2800);
    }, [tasks, teamId, loadBoard]);

    const filtered = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return tasks.filter(t => {
            const matchQ = !qn || (t.title || "").toLowerCase().includes(qn) || (t.descripcion_problema || "").toLowerCase().includes(qn) || (t.causa || "").toLowerCase().includes(qn) || (t.desarrollo_estrategia || "").toLowerCase().includes(qn);
            const matchS = filterStatus === "Todos" || t.list_name === filterStatus;
            const matchMy = !showMyTasksOnly || !currentUser || (t.assigned && t.assigned.some(a => Number(a.user_id) === Number(currentUser.id) || Number(a.id) === Number(currentUser.id)));
            return matchQ && matchS && matchMy;
        });
    }, [tasks, q, filterStatus, showMyTasksOnly, currentUser]);

    function openCreate(listIdDefault = null) { setEditingTask(listIdDefault ? { list: listIdDefault, id: null } : null); setModalOpen(true); }
    function openEdit(task) { setEditingTask(task); setModalOpen(true); }
    function handleDeleteTask(task) { setConfirmDeleteTask(task); }

    async function confirmTaskDelete() {
        if (!confirmDeleteTask) return; setDeletingTask(true);
        try { await apiClickup.deleteTask(Number(teamId), Number(confirmDeleteTask.id)); setConfirmDeleteTask(null); await loadBoard(); notifyTasksChanged(); }
        catch (e) { alert(e.message); } finally { setDeletingTask(false); }
    }

    async function deleteCurrentProject() {
        if (!projectId || !teamId) return; setDeletingProject(true);
        try {
            await apiClickup.deleteProject(teamId, projectId);
            setConfirmDeleteProject(false);
            notifyTasksChanged();
            const data = await apiClickup.listProjects(teamId);
            const arr = Array.isArray(data) ? data : [];
            setProjects(arr);
            const next = arr[0] ? Number(arr[0].id) : null;
            setProjectId(next);
            if (next) localStorage.setItem("clickup_project_id", String(next));
            else localStorage.removeItem("clickup_project_id");
        } catch (e) { alert(e.message || "Error al eliminar proyecto"); }
        finally { setDeletingProject(false); }
    }

    function changeTeam(newTeamId) {
        setTeamId(newTeamId);
        setProjectId(null);
        localStorage.setItem("clickup_team_id", String(newTeamId));
        localStorage.removeItem("clickup_project_id");
        apiClickup.listProjects(newTeamId).then(data => {
            const arr = Array.isArray(data) ? data : [];
            setProjects(arr);
            if (arr[0]) { setProjectId(Number(arr[0].id)); localStorage.setItem("clickup_project_id", String(arr[0].id)); }
        }).catch(console.error);
    }

    async function saveProjectName() {
        if (!projectName.trim() || !projectId || !teamId) return;
        try {
            await apiClickup.updateProject(teamId, projectId, { name: projectName.trim(), description: "" });
            const data = await apiClickup.listProjects(teamId);
            setProjects(Array.isArray(data) ? data : []);
            setEditingProject(false);
            notifyTasksChanged();
        } catch (e) { alert(e.message || "Error"); }
    }

    const viewTabs = [{ id: "dashboard", label: "Dashboard", Icon: LayoutDashboard }, { id: "kanban", label: "Tablero Kanban", Icon: LayoutGrid }, { id: "tabla", label: "Lista Detallada", Icon: Table2 }, { id: "timeline", label: "Gantt Timeline", Icon: GitBranch }];
    const currentProject = projects.find(p => Number(p.id) === Number(projectId));

    const selectCls = "h-9 border border-slate-200 rounded-xl px-3 text-xs font-bold bg-white text-[#001E50] outline-none focus:border-[#1677FF] shadow-sm";

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <main className="space-y-3 py-3 px-2 sm:px-4">

                {/* ═════════ NAVEGACIÓN SUPERIOR ═════════ */}
                <header className="sticky top-0 z-50 -mx-2 sm:-mx-4 px-2 sm:px-4 pt-1.5 pb-1 bg-[#F8FAFC]">
                    {(helpOpen || projectMenuOpen) && <div className="fixed inset-0 z-40" onClick={() => { setHelpOpen(false); setProjectMenuOpen(false); }} />}

                    <div className="relative z-50 rounded-2xl border border-[#001E50] shadow-md text-white"
                        style={{ background: `linear-gradient(to right, ${BRAND_NAVY}, ${BRAND_NAVY_DARK})` }}>

                        {/* Fila 1: dónde estoy (equipo / proyecto) + acciones principales */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="bg-white/10 p-2 rounded-lg shrink-0"><Target className="h-5 w-5 text-sky-300" /></div>
                                <div className="min-w-0 leading-tight">
                                    <div className="text-base font-black tracking-tight truncate">Time For Action</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-sky-300/80 truncate">Planes de acción · VW R&R</div>
                                </div>
                            </div>

                            <div className="hidden md:block h-8 w-px bg-white/15" />

                            {/* Contexto */}
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 pl-2.5 pr-1 h-9"
                                    title="Equipo de trabajo. Al cambiarlo se actualizan los proyectos y planes que ves.">
                                    <UsersRound className="h-3.5 w-3.5 text-sky-300" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-white/60">Equipo</span>
                                    <select value={teamId || ""} onChange={e => changeTeam(Number(e.target.value))}
                                        className="h-8 max-w-[160px] bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                                        {teams.map(t => <option key={t.id} value={t.id} className="text-[#001E50] bg-white">{t.name}</option>)}
                                    </select>
                                </label>

                                <span className="text-white/30">/</span>

                                {editingProject ? (
                                    <div className="flex items-center gap-1.5">
                                        <input value={projectName} onChange={e => setProjectName(e.target.value)} autoFocus
                                            onKeyDown={e => { if (e.key === "Enter") saveProjectName(); if (e.key === "Escape") setEditingProject(false); }}
                                            className="h-9 w-52 rounded-xl border border-white/30 bg-white/10 px-3 text-xs font-bold text-white placeholder-white/50 outline-none focus:border-sky-300"
                                            placeholder="Nombre del proyecto" />
                                        <button onClick={saveProjectName} className="h-9 rounded-xl bg-white px-3 text-xs font-bold text-[#001E50] hover:bg-sky-50">Guardar</button>
                                        <button onClick={() => setEditingProject(false)} className="h-9 rounded-xl border border-white/25 px-3 text-xs font-bold text-white/80 hover:bg-white/10">Cancelar</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <label className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 pl-2.5 pr-1 h-9"
                                            title="Proyecto actual. Cada proyecto tiene su propio tablero de planes (Por hacer, En proceso, Hecho).">
                                            <Layers className="h-3.5 w-3.5 text-sky-300" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-white/60">Proyecto</span>
                                            <select value={projectId || ""} onChange={e => { setProjectId(Number(e.target.value)); localStorage.setItem("clickup_project_id", e.target.value); }}
                                                className="h-8 max-w-[220px] bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                                                {projects.map(p => <option key={p.id} value={p.id} className="text-[#001E50] bg-white">{p.name}</option>)}
                                            </select>
                                        </label>

                                        <div className="relative">
                                            <button onClick={() => { setProjectMenuOpen(v => !v); setHelpOpen(false); }}
                                                title="Renombrar, crear o eliminar proyectos"
                                                className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20">
                                                Gestionar<ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                            {projectMenuOpen && (
                                                <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 text-[#001E50] shadow-2xl z-50">
                                                    <button onClick={() => { const cur = projects.find(p => p.id === projectId); setProjectName(cur?.name || ""); setEditingProject(true); setProjectMenuOpen(false); }}
                                                        disabled={!projectId} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50 disabled:opacity-40">
                                                        <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-[#1677FF]" />
                                                        <span><span className="block text-sm font-black">Renombrar proyecto</span><span className="block text-xs text-slate-500">Cambia el nombre del proyecto seleccionado. Sus planes no se tocan.</span></span>
                                                    </button>
                                                    <button onClick={() => { setProjectModalOpen(true); setProjectMenuOpen(false); }}
                                                        className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50">
                                                        <Plus className="mt-0.5 h-4 w-4 shrink-0 text-[#1677FF]" />
                                                        <span><span className="block text-sm font-black">Crear proyecto</span><span className="block text-xs text-slate-500">Crea un proyecto nuevo con su tablero listo: Por hacer, En proceso y Hecho.</span></span>
                                                    </button>
                                                    <div className="my-1 border-t border-slate-100" />
                                                    <button onClick={() => { setConfirmDeleteProject(true); setProjectMenuOpen(false); }}
                                                        disabled={!projectId} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-rose-50 disabled:opacity-40">
                                                        <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                                        <span><span className="block text-sm font-black text-rose-600">Eliminar proyecto</span><span className="block text-xs text-slate-500">Borra el proyecto con todos sus planes, subtareas y evidencias. No se puede deshacer.</span></span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Acciones principales */}
                            <div className="ml-auto flex items-center gap-2">
                                <div className="relative">
                                    <button onClick={() => { setHelpOpen(v => !v); setProjectMenuOpen(false); }}
                                        title="Explica qué hace cada botón de esta pantalla"
                                        className={cls("inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors",
                                            helpOpen ? "bg-white text-[#001E50] border-white" : "border-white/20 bg-white/10 text-white hover:bg-white/20")}>
                                        <Info className="h-4 w-4" /><span className="hidden sm:inline">¿Qué hace cada botón?</span>
                                    </button>
                                    {helpOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-[min(92vw,440px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-[#001E50] shadow-2xl z-50">
                                            <div className="px-2 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">Guía rápida de botones</div>
                                            {HELP_GROUPS.map(g => (
                                                <div key={g.title} className="mb-2">
                                                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#1677FF]">{g.title}</div>
                                                    {g.items.map(it => (
                                                        <div key={it.name} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                                                            <it.Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1677FF]" />
                                                            <div><div className="text-sm font-black">{it.name}</div><div className="text-xs leading-snug text-slate-500">{it.desc}</div></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setTeamsModalOpen(true)} title="Crear equipos, invitar personas y aceptar invitaciones"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20 transition-colors">
                                    <UsersRound className="h-4 w-4" />Equipos
                                </button>
                                <button onClick={() => openCreate()} title="Crear un plan de acción nuevo (problema, causa, estrategia, subtareas, responsables y evidencias)"
                                    className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all" style={{ backgroundColor: BRAND_ACCENT }}>
                                    <Plus className="h-4 w-4" />Nuevo plan
                                </button>
                            </div>
                        </div>

                        {/* Fila 2: cómo lo veo (vistas) + qué muestro (filtros) */}
                        <div className="flex flex-wrap items-center gap-2 rounded-b-2xl border-t border-white/10 bg-black/15 px-3 py-2">
                            <div className="flex items-center rounded-xl bg-white/10 p-1">
                                {viewTabs.map(({ id, label, Icon }) => (
                                    <button key={id} onClick={() => setView(id)} title={VIEW_HINTS[id]}
                                        className={cls("inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all",
                                            view === id ? "bg-white text-[#001E50] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white")}>
                                        <Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                <div className="relative w-full sm:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                                    <input value={q} onChange={e => setQ(e.target.value)} title="Busca por título, problema, causa o estrategia"
                                        className="h-9 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-xs font-medium text-white placeholder-white/50 outline-none focus:border-sky-300 focus:bg-white/15"
                                        placeholder="Buscar planes, causas..." />
                                </div>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} title="Muestra solo los planes de una fase"
                                    className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white outline-none cursor-pointer">
                                    <option value="Todos" className="text-[#001E50] bg-white">Todas las fases</option>
                                    {STATUS_COLS.map(c => <option key={c} value={c} className="text-[#001E50] bg-white">{c}</option>)}
                                </select>
                                <button onClick={() => setShowMyTasksOnly(!showMyTasksOnly)} title="Muestra solo los planes donde tú eres responsable"
                                    className={cls("inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all",
                                        showMyTasksOnly ? "bg-white text-[#001E50] border-white" : "border-white/15 bg-white/10 text-white hover:bg-white/20")}>
                                    <UsersRound className="h-4 w-4" />Solo mis planes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Qué hace la vista actual + filtros activos */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pt-1.5 text-[11px] font-medium text-slate-500">
                        <span className="inline-flex items-start gap-1.5"><Info className="mt-px h-3.5 w-3.5 shrink-0 text-[#1677FF]" />{VIEW_HINTS[view]}</span>
                        {filterStatus !== "Todos" && (
                            <button onClick={() => setFilterStatus("Todos")} title="Quitar el filtro de fase"
                                className="inline-flex items-center gap-1 rounded-md border border-[#1677FF]/30 bg-[#1677FF]/10 px-2 py-0.5 font-bold text-[#1677FF] hover:bg-[#1677FF]/20">
                                Fase: {filterStatus}<X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </header>

                {/* VISTAS (KANBAN / TABLA / TIMELINE) */}
                {view === "dashboard" && <DashboardView tasks={filtered} loading={loading} onEdit={openEdit}
                    onGoToStatus={(st) => { setFilterStatus(st); setView("kanban"); }} />}
                {view === "kanban" && <KanbanView tasks={filtered} lists={lists} onEdit={openEdit} onDelete={handleDeleteTask} onCreateInCol={listId => openCreate(listId)} onMoveTask={handleMoveTask} loading={loading} />}
                {view === "tabla" && <TablaView tasks={filtered} lists={lists} teamId={teamId} onEdit={openEdit} onDelete={handleDeleteTask} loading={loading}
                    onSaved={async () => { notifyTasksChanged(); await loadBoard(true); }} />}
                {view === "timeline" && <TimelineView tasks={filtered} onEdit={openEdit} onDelete={handleDeleteTask} onUpdateDates={handleUpdateDates} loading={loading}
                    teams={teams} projects={projects} teamId={teamId} projectId={projectId} currentUser={currentUser} allTasks={tasks} />}

                {/* MODALES */}
                <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} task={editingTask} lists={lists} teamId={teamId} onSaved={async () => { notifyTasksChanged(); await loadBoard(); }} />
                <TeamsModal open={teamsModalOpen} onClose={() => setTeamsModalOpen(false)} onCreated={async () => {
                    await fetchTeams();
                    if (teamId) { const data = await apiClickup.listProjects(teamId); const arr = Array.isArray(data) ? data : []; setProjects(arr); if (!projectId && arr[0]) setProjectId(Number(arr[0].id)); }
                    await loadBoard();
                    notifyTasksChanged();
                }} />
                <ConfirmDialog open={!!confirmDeleteTask} title="Eliminar plan de acción" message={`¿Estás seguro que deseas eliminar el plan "${confirmDeleteTask?.title}"? Esta acción borrará todas sus subtareas y evidencias de forma permanente.`} onConfirm={confirmTaskDelete} onCancel={() => setConfirmDeleteTask(null)} loading={deletingTask} />
                <ConfirmDialog open={confirmDeleteProject} title="Eliminar Proyecto" message={`¿Deseas eliminar permanentemente el proyecto "${currentProject?.name}"? Se borrarán de ClickUp absolutamente todos los planes de acción y archivos asociados.`} onConfirm={deleteCurrentProject} onCancel={() => setConfirmDeleteProject(false)} loading={deletingProject} />

                {moveToast && (
                    <div className={cls("fixed bottom-5 left-1/2 -translate-x-1/2 z-[95] max-w-[90vw] rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-2xl", moveToast.ok ? "bg-emerald-600" : "bg-rose-600")}>
                        {moveToast.msg}
                    </div>
                )}

                {/* MODAL NUEVO PROYECTO */}
                {projectModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setProjectModalOpen(false)} />
                        <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transform transition-all">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-sm font-black text-[#001E50] uppercase tracking-wider">Nuevo Proyecto</h3>
                                <button onClick={() => setProjectModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-[#001E50] transition-colors"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre del Proyecto</label>
                                    <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#001E50] outline-none focus:bg-white focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 transition-all" placeholder="Ej. Plan Q2 2026" />
                                </div>
                                <button disabled={!newProjectName.trim()} onClick={async () => { if (!newProjectName.trim() || !teamId) return; try { const created = await apiClickup.createProject(teamId, { name: newProjectName.trim(), description: "" }); await apiClickup.bootstrapProject(teamId, created.id); const data = await apiClickup.listProjects(teamId); setProjects(Array.isArray(data) ? data : []); setProjectId(created.id); localStorage.setItem("clickup_project_id", String(created.id)); setNewProjectName(""); setProjectModalOpen(false); notifyTasksChanged(); } catch (e) { alert(e.message || "Error al crear proyecto"); } }}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors shadow-sm disabled:opacity-50" style={{ backgroundColor: BRAND_ACCENT }}>
                                    <Plus className="h-4 w-4" />Crear Estructura
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
