//src/pages/TimeForAction/TimeForAction.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {jsPDF} from "jspdf";
import {
    Plus, X, ChevronDown, ChevronRight, Paperclip,
    Trash2, Pencil, CheckCircle2, Clock3,
    Zap, Search, Calendar,
    LayoutGrid, Table2, GitBranch,
    ArrowUpDown, ChevronUp, Loader2, Save, UsersRound,
    AlertTriangle, UserPlus, Mail, Check, EyeOff
} from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";
import { API_ROOT } from "../../lib/apiClient";
import { VW_HEAD_BOLD, VW_TEXT_LIGHT } from "../../assets/fonts/vwFonts.js";

// ─────────────────────────────────────────────────────────────

const BRAND_BLUE = "#131E5C";

const PRIORITIES = [
    { value: "LOW",    label: "Baja",    color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { value: "MEDIUM", label: "Media",   color: "bg-sky-100 text-sky-700 border-sky-300" },
    { value: "HIGH",   label: "Alta",    color: "bg-amber-100 text-amber-700 border-amber-300" },
    { value: "URGENT", label: "Urgente", color: "bg-rose-100 text-rose-700 border-rose-300" },
];

const STATUS_COLS = ["Por hacer", "En proceso", "Hecho"];

const STATUS_COLORS = {
    "Por hacer":  { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-300",  dot: "bg-slate-400",   bar: "#94a3b8" },
    "En proceso": { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-300",  dot: "bg-amber-500",   bar: "#f59e0b" },
    "Hecho":      { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300",dot: "bg-emerald-500", bar: "#10b981" },
};

const opcionesRaiz = {
    "Gestion de Clientes": [
        "Respuestas lentas a las quejas","Falta de seguimiento postventa",
        "Encuestas de satisfacción poco frecuentes o inexistentes",
        "Mala gestión de la experiencia del cliente en el showroom",
        "Falta de personal dedicado a la atención al cliente",
        "Tiempos de espera prolongados para servicios de mantenimiento",
        "Falta de comunicación proactiva con los clientes","Carencia de programas de fidelización",
        "Problemas en la gestión de citas y servicios programados",
        "Deficiencias en la personalización del servicio",
        "Falta de transparencia en la información proporcionada a los clientes",
        "Deficiencias en la gestión de la imagen y reputación",
        "Falta de atención a los comentarios y reseñas","Problemas en la gestión de garantías",
        "Falta de ofertas y promociones atractivas","Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados","Mal uso de CRM",
        "Problemas en la gestión de reclamaciones y devoluciones",
    ],
    Metodo: [
        "Procesos complejos","Procesos poco explícitos","Incumplimiento en la ejecución","Procesos limitados",
        "Falta de documentación y registro","Falta de integración entre departamentos",
        "Inconsistencias en la aplicación","Procesos no optimizados",
        "Falta de estandarización en la atención al cliente",
        "Ausencia de procedimientos claros para la gestión de garantías",
        "Falta de protocolos para la entrega de vehículos nuevos",
        "Falta de automatización en procesos administrativos","Retrasos en la tramitación de documentos",
        "Ineficiencia en la programación de citas","Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia","Deficiencias en el control de calidad",
        "Falta de auditorías internas periódicas","Problemas en la implementación de sistemas ERP",
        "Deficiencias en la gestión de proyectos","Falta de revisiones periódicas",
        "Procedimientos redundantes","Falta de actualización de manuales operativos",
        "Uso ineficiente de recursos","Falta de un sistema de gestión de calidad total",
    ],
    Materiales: [
        "Insuficiencia de materiales","Materiales en mal estado","Materiales descalibrados",
        "Difícil disponibilidad","Costos elevados","Variabilidad en la calidad","Obsolescencia",
        "Falta de stock de piezas de alta demanda","Problemas con proveedores no confiables",
        "Almacenamiento inadecuado de piezas","Pérdidas por deterioro","Falta de control de inventarios",
        "Gestión ineficaz de devoluciones","Uso de materiales no homologados",
        "Falta de piezas específicas para ciertos modelos","Problemas en la logística de entrega",
        "Retrasos en la recepción de materiales importados","Problemas en la aduana",
        "Roturas durante el transporte","Embalajes inadecuados","Falta de previsión en pedidos",
        "Fallos en la trazabilidad de piezas",
    ],
    Infraestructura: [
        "Problemas de orden","Problemas de limpieza","Instalaciones pequeñas",
        "Problemas de suministro de servicios básicos","Equipos obsoletos",
        "Falta de áreas de descanso adecuadas","Problemas de seguridad",
        "Deficiencias en el almacenamiento","Falta de estacionamiento para clientes",
        "Infraestructura inadecuada para la exhibición de vehículos",
        "Problemas de accesibilidad para personas con discapacidades",
        "Insuficiente espacio para talleres de reparación",
        "Iluminación inadecuada en áreas de trabajo","Sistemas de ventilación deficientes",
        "Señalización ineficaz dentro de las instalaciones","Falta de mantenimiento preventivo",
        "Problemas con sistemas de climatización","Infraestructuras tecnológicas desactualizadas",
        "Falta de salas de reuniones adecuadas","Instalaciones sanitarias insuficientes",
        "Falta de zonas verdes","Problemas de acústica en oficinas",
        "Instalaciones eléctricas inadecuadas","Falta de sistemas de gestión ambiental",
    ],
    "Talento Humano": [
        "Falta de capacitación","Falta de adiestramiento","Problemas de comunicación","Desmotivación",
        "Conflictos laborales","Alta rotación de personal","Falta de reconocimiento",
        "Cargas de trabajo excesivas","Ausentismo","Falta de liderazgo efectivo",
        "Insuficiente personal de ventas durante picos de demanda",
        "Falta de técnicos especializados en postventa",
        "Ausencia de programas de desarrollo profesional y mentoría",
        "Evaluación de desempeño inadecuada","Falta de incentivos y bonificaciones",
        "Falta de claridad en las expectativas laborales",
        "Escasa participación de los empleados en la toma de decisiones",
        "Deficiencias en la gestión del talento","Falta de programas de bienestar laboral",
        "Problemas con la gestión del tiempo","Personal de nuevo ingreso",
        "Problemas de retención de talento clave","Baja moral del equipo",
        "Falta de diversidad e inclusión","Problemas con la conciliación laboral y familiar",
        "Ausencia de un plan de carrera claro","Falta de apoyo psicológico",
        "Falta de programas de salud y seguridad laboral",
    ],
};

function cls(...a) { return a.filter(Boolean).join(" "); }

function PriorityBadge({ value }) {
    const p = PRIORITIES.find(x => x.value === value) || PRIORITIES[1];
    return (
        <span className={cls("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", p.color)}>
            {p.label}
        </span>
    );
}

function StatusBadge({ name }) {
    const c = STATUS_COLORS[name] || { bg:"bg-slate-100", text:"text-slate-600", border:"border-slate-200", dot:"bg-slate-400" };
    return (
        <span className={cls("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold", c.bg, c.text, c.border)}>
            <span className={cls("h-1.5 w-1.5 rounded-full", c.dot)} />
            {name || "—"}
        </span>
    );
}

function UserAvatar({ user, size = "sm" }) {
    const initial = user?.name?.[0] || user?.nombre_completo?.[0] || user?.email?.[0] || "?";
    const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
    return (
        <div className={`rounded-full bg-[#131E5C]/10 flex items-center justify-center font-bold text-[#131E5C] ${sizeClass}`}>
            {initial.toUpperCase()}
        </div>
    );
}

function CausaRaiz({ causa, raiz, onChangeCausa, onChangeRaiz }) {
    const raices = useMemo(() => opcionesRaiz[causa] || [], [causa]);
    const base = "w-full rounded-xl border px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none focus:border-[#131E5C] bg-white border-black/10";
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div>
                <div className="mb-1.5 text-xs font-extrabold text-black/60">Causa</div>
                <select value={causa||""} onChange={e=>{onChangeCausa(e.target.value);onChangeRaiz("");}} className={base}>
                    <option value="">Selecciona una causa...</option>
                    {Object.keys(opcionesRaiz).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <div className="mb-1.5 text-xs font-extrabold text-black/60">Raíz</div>
                <select value={raiz||""} onChange={e=>onChangeRaiz(e.target.value)}
                    disabled={!causa||raices.length===0}
                    className={cls(base,"disabled:opacity-50 disabled:cursor-not-allowed")}>
                    <option value="">{!causa?"Selecciona causa primero":raices.length?"Selecciona una raíz...":"Sin opciones"}</option>
                    {raices.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        </div>
    );
}

function SubtaskRow({ sub, onToggle, onDelete, onChangeDate }) {
    const startVal = sub.start_date || sub.fecha_inicio || sub.startDate || sub.fechaInicio || sub.inicio || "";
    const dueVal   = sub.due_date   || sub.fecha_fin    || sub.dueDate   || sub.fechaFin   || sub.fin    || "";

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
        <div className="rounded-lg border border-black/5 bg-white px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
                <button type="button" onClick={()=>onToggle(sub.id)}
                    className={cls("shrink-0 rounded-full border-2 h-5 w-5 flex items-center justify-center transition",
                        sub.done?"border-emerald-500 bg-emerald-500 text-white":"border-slate-300 hover:border-emerald-400")}>
                    {sub.done?<CheckCircle2 className="h-3 w-3"/>:null}
                </button>
                <span className={cls("flex-1 min-w-0 truncate text-sm",sub.done&&"line-through text-black/40")}>{sub.title}</span>
                <button type="button" onClick={()=>onDelete(sub.id)}
                    className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <X className="h-3.5 w-3.5"/>
                </button>
            </div>
            <div className="flex items-center gap-2 pl-7">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-black/40 font-semibold">Inicio:</span>
                    <input type="date" value={toInputDate(startVal)}
                        onChange={e=>onChangeDate(sub.id,"start_date",e.target.value)}
                        className="rounded-lg border border-black/10 bg-slate-50 px-2 py-0.5 text-[10px] outline-none focus:border-[#131E5C]"/>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-black/40 font-semibold">Fin:</span>
                    <input type="date" value={toInputDate(dueVal)}
                        onChange={e=>onChangeDate(sub.id,"due_date",e.target.value)}
                        className="rounded-lg border border-black/10 bg-slate-50 px-2 py-0.5 text-[10px] outline-none focus:border-[#131E5C]"/>
                </div>
            </div>
        </div>
    );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}/>
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                            <AlertTriangle className="h-5 w-5 text-rose-600"/>
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
                            {loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Trash2 className="h-4 w-4"/>}Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeamsModal({ open, onClose, onCreated }) {
    const [teams,setTeams]=useState([]);
    const [loading,setLoading]=useState(false);
    const [creating,setCreating]=useState(false);
    const [name,setName]=useState("");
    const [descripcion,setDescripcion]=useState("");
    const [confirmDelete,setConfirmDelete]=useState(null);
    const [deleting,setDeleting]=useState(false);
    const [selectedTeam,setSelectedTeam]=useState(null);
    const [inviteSearch,setInviteSearch]=useState("");
    const [inviteResults,setInviteResults]=useState([]);
    const [inviteSearching,setInviteSearching]=useState(false);
    const [inviteRole,setInviteRole]=useState("MEMBER");
    const [invitesByTeam,setInvitesByTeam]=useState({});
    const [membersByTeam,setMembersByTeam]=useState({});
    const [loadingInvites,setLoadingInvites]=useState({});
    const [sendingInvite,setSendingInvite]=useState(false);
    const [selectedUser,setSelectedUser]=useState(null);
    const [hiddenInvites,setHiddenInvites]=useState({});
    const [acceptingInvite,setAcceptingInvite]=useState({});

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
            id:    m.id     || m.user_id   || m.usuario_id || inner.id || inner.id_usuario,
            name:  inner.nombre_completo || inner.nombre || inner.name || m.nombre_completo || m.nombre || m.name || m.email || "—",
            email: inner.correo || inner.email || m.correo || m.email || "—",
            role:  m.role   || m.rol       || m.rol_nombre || inner.role || "MEMBER",
        };
    }

    function normalizeInvite(inv) {
        const inner = inv.invited_user || inv.usuario_invitado || {};
        return {
            id:     inv.id,
            name:   inner.nombre_completo || inner.nombre || inner.name || inv.nombre || inv.email || "Usuario",
            email:  inv.email || inv.correo || inner.email || inner.correo || "",
            role:   inv.role  || inv.rol    || "MEMBER",
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
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    const loadTeamData = useCallback(async (teamId) => {
        if (!teamId) return;
        setLoadingInvites(p => ({ ...p, [teamId]: true }));
        try {
            // FIX: usar Promise.allSettled correctamente leyendo .value solo si status === "fulfilled"
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
        } catch(e) {
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
            catch(e) { setInviteResults([]); }
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
        } catch(e) { alert(e.message || "Error al crear equipo"); }
        finally { setCreating(false); }
    }

    async function deleteTeam() {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await apiClickup.deleteTeam(Number(confirmDelete.id));
            setConfirmDelete(null);
            await fetchTeams(); onCreated?.();
        } catch(e) { alert(e.message || "Error al eliminar equipo"); }
        finally { setDeleting(false); }
    }

    async function sendInvite() {
        if (!selectedTeam || !selectedUser) { alert("Selecciona un usuario primero"); return; }
        setSendingInvite(true);
        try {
            await apiClickup.invite(selectedTeam.id, { usuario_id: Number(selectedUser.id), rol: inviteRole });
            await loadTeamData(selectedTeam.id);
            setSelectedUser(null); setInviteSearch(""); setInviteResults([]); setInviteRole("MEMBER");
            alert(`Invitación enviada a ${selectedUser.name}`);
        } catch(e) { alert(e.message || "Error al enviar invitación"); }
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
        } catch(e) {
            if (e.message?.includes("ACCEPTED") || e.status === 400) {
                setHiddenInvites(p => ({ ...p, [inv.id]: true }));
                await loadTeamData(selectedTeam.id);
                onCreated?.();
            } else {
                alert(e.message || "No se pudo aceptar la invitación");
            }
        } finally {
            setAcceptingInvite(p => ({ ...p, [inv.id]: false }));
        }
    }

    function hideInvite(invId) {
        setHiddenInvites(p => ({ ...p, [invId]: true }));
    }

    if (!open) return null;
    const inputBase = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]";
    const visibleInvites = (invitesByTeam[selectedTeam?.id] || []).filter(inv => !hiddenInvites[inv.id]);

    return (
        <>
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl" style={{maxHeight:"85vh"}}>
                <div className="flex items-center justify-between px-5 py-4" style={{background:`linear-gradient(135deg,${BRAND_BLUE} 0%,#1e3282 100%)`}}>
                    <div className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-white/80"/><h3 className="text-sm font-black text-white">Equipos</h3></div>
                    <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10"><X className="h-4 w-4"/></button>
                </div>
                <div className="flex" style={{maxHeight:"calc(85vh - 100px)"}}>
                    <div className="w-2/5 border-r border-black/10 p-5 overflow-y-auto">
                        <div className="text-xs font-extrabold uppercase tracking-widest text-black/35 mb-3">Mis equipos</div>
                        <div className="mb-4 p-3 rounded-xl bg-slate-50">
                            <div className="text-xs font-extrabold text-[#131E5C] mb-2">Nuevo equipo</div>
                            <input value={name} onChange={e=>setName(e.target.value)} className={cls(inputBase,"mb-2")} placeholder="Nombre del equipo"/>
                            <input value={descripcion} onChange={e=>setDescripcion(e.target.value)} className={cls(inputBase,"mb-2")} placeholder="Descripción (opcional)"/>
                            <button disabled={creating||!name.trim()} onClick={createTeam}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                                style={{backgroundColor:BRAND_BLUE}}>
                                {creating?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}{creating?"Creando...":"Crear equipo"}
                            </button>
                        </div>
                        {loading
                            ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100"/>)}</div>
                            : teams.length===0
                                ? <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">Sin equipos registrados</div>
                                : <div className="space-y-2">{teams.map(t=>(
                                    <div key={t.id} onClick={()=>setSelectedTeam(t)}
                                        className={cls("flex items-center justify-between rounded-xl border p-3 cursor-pointer transition",
                                            selectedTeam?.id===t.id?"border-[#131E5C] bg-[#131E5C]/5 ring-1 ring-[#131E5C]/20":"border-black/10 bg-white hover:bg-slate-50")}>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-bold text-[#131E5C] truncate">{t.name}</div>
                                            {t.description&&<div className="text-xs text-black/40 truncate">{t.description}</div>}
                                        </div>
                                        <button onClick={e=>{e.stopPropagation();setConfirmDelete(t);}}
                                            className="ml-2 shrink-0 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                                            <Trash2 className="h-3.5 w-3.5"/>
                                        </button>
                                    </div>
                                ))}</div>
                        }
                    </div>
                    <div className="w-3/5 p-5 overflow-y-auto">
                        {!selectedTeam ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                                <UsersRound className="h-12 w-12 text-black/20 mb-3"/>
                                <div className="text-sm text-black/40">Selecciona un equipo</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-widest text-black/35">Miembros</div>
                                    <div className="text-sm font-black text-[#131E5C]">{selectedTeam.name}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50">
                                    <div className="text-xs font-extrabold text-[#131E5C] mb-2">Invitar miembro</div>
                                    <input value={inviteSearch} onChange={e=>setInviteSearch(e.target.value)} className={cls(inputBase,"mb-2")} placeholder="Buscar usuario por nombre o correo..."/>
                                    {inviteSearching && <div className="flex justify-center py-2"><Loader2 className="h-5 w-5 animate-spin text-black/40"/></div>}
                                    {inviteResults.length > 0 && !inviteSearching && (
                                        <div className="mb-2 border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                            {inviteResults.map(user => (
                                                <button key={user.id} onClick={()=>{setSelectedUser(user);setInviteSearch("");setInviteResults([]);}}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-100 border-b last:border-b-0">
                                                    <div className="text-sm font-semibold text-[#131E5C]">{user.name}</div>
                                                    <div className="text-xs text-black/50">{user.email}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedUser && (
                                        <div className="mb-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                            <div><div className="text-sm font-bold text-emerald-800">{selectedUser.name}</div><div className="text-xs text-emerald-600">{selectedUser.email}</div></div>
                                            <button onClick={()=>{setSelectedUser(null);setInviteSearch("");}} className="text-emerald-600 hover:text-emerald-800"><X className="h-4 w-4"/></button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className={cls(inputBase,"flex-1")}>
                                            <option value="MEMBER">Miembro</option>
                                            <option value="ADMIN">Administrador</option>
                                            <option value="VIEWER">Lector</option>
                                        </select>
                                        <button onClick={sendInvite} disabled={!selectedUser||sendingInvite}
                                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                                            style={{backgroundColor:BRAND_BLUE}}>
                                            {sendingInvite?<Loader2 className="h-4 w-4 animate-spin"/>:<UserPlus className="h-4 w-4"/>}Invitar
                                        </button>
                                    </div>
                                </div>

                                {/* Miembros */}
                                <div>
                                    <div className="text-xs font-extrabold text-black/60 mb-2 flex items-center gap-2">
                                        <UsersRound className="h-3.5 w-3.5"/>
                                        Miembros ({membersByTeam[selectedTeam.id]?.length||0})
                                    </div>
                                    {loadingInvites[selectedTeam.id]
                                        ? <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin text-black/30 mx-auto"/></div>
                                        : !membersByTeam[selectedTeam.id] || membersByTeam[selectedTeam.id].length === 0
                                            ? <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">Sin miembros</div>
                                            : <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {membersByTeam[selectedTeam.id].map((m, idx) => (
                                                    <div key={m.id||idx} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2">
                                                        <UserAvatar user={m} size="sm"/>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-[#131E5C] truncate">{m.name}</div>
                                                            <div className="text-xs text-black/50 truncate">{m.email}</div>
                                                            <div className="text-[10px] text-black/40">Rol: {m.role}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                    }
                                </div>

                                {/* Invitaciones */}
                                <div>
                                    <div className="text-xs font-extrabold text-black/60 mb-2 flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5"/>
                                        Invitaciones pendientes ({visibleInvites.length})
                                    </div>
                                    {visibleInvites.length === 0
                                        ? <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">Sin invitaciones pendientes</div>
                                        : <div className="space-y-2 max-h-36 overflow-y-auto">
                                            {visibleInvites.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-bold text-amber-800 truncate">{inv.name}</div>
                                                        {inv.email && <div className="text-xs text-amber-600 truncate">{inv.email}</div>}
                                                        <div className="text-xs text-amber-600">Rol: {inv.role}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                                        <button onClick={()=>acceptInvite(inv)} disabled={!!acceptingInvite[inv.id]}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50">
                                                            {acceptingInvite[inv.id]?<Loader2 className="h-3 w-3 animate-spin"/>:<Check className="h-3 w-3"/>}Aceptar
                                                        </button>
                                                        <button onClick={()=>hideInvite(inv.id)} title="Ocultar notificación"
                                                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-amber-700 hover:bg-amber-100">
                                                            <EyeOff className="h-3 w-3"/>Ocultar
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
                <div className="border-t border-black/10 p-4 flex justify-end">
                    <button onClick={onClose} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50">Cerrar</button>
                </div>
            </div>
        </div>
        <ConfirmDialog open={!!confirmDelete} title="Eliminar equipo" message={`¿Seguro que deseas eliminar "${confirmDelete?.name}"?`} onConfirm={deleteTeam} onCancel={()=>setConfirmDelete(null)} loading={deleting}/>
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
            } catch(e) {
                console.warn("[PdfThumb]", e);
                if (!cancelled) setStatus("error");
            }
        }

        render();
        return () => { cancelled = true; };
    }, [url, file]);

    if (status === "error")
        return (
            <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">📄</span>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">PDF</span>
            </div>
        );

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden">
            {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100">
                    <span className="text-2xl animate-pulse">📄</span>
                    <span className="text-[9px] text-black/30 font-semibold">Cargando...</span>
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
                }}
            />
        </div>
    );
}

/* TASK MODAL */
function TaskModal({ open, onClose, task, lists, teamId, onSaved }) {
    const [title,setTitle]=useState("");
    const [listId,setListId]=useState("");
    const [priority,setPriority]=useState("MEDIUM");
    const [due,setDue]=useState("");
    const [start,setStart]=useState("");
    const [problema,setProblema]=useState("");
    const [causa,setCausa]=useState("");
    const [raiz,setRaiz]=useState("");
    const [subtasks,setSubtasks]=useState([]);
    const [newSub,setNewSub]=useState("");
    const [estrategia,setEstrategia]=useState("");
    const [resultados,setResultados]=useState("");
    const [evidencias,setEvidencias]=useState([]);
    const [saving,setSaving]=useState(false);
    const [assignedUsers,setAssignedUsers]=useState([]);
    const [assigneeSearch,setAssigneeSearch]=useState("");
    const [assigneeResults,setAssigneeResults]=useState([]);
    const [searchingAssignees,setSearchingAssignees]=useState(false);
    const [evidenciasExistentes,setEvidenciasExistentes]=useState([]);

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
            due_date:   toInputDate(s.due_date   || s.fecha_fin   || s.dueDate   || s.fechaFin   || s.fin   || ""),
        })) : []);
        setEvidencias([]);
        setEvidenciasExistentes(Array.isArray(task?.evidencias) ? task.evidencias : []);
        setAssignedUsers(Array.isArray(task?.asignados) ? task.asignados.map(a => ({ id: a.user_id, name: a.name, email: a.email })) : []);
    }, [open, task, lists]);

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
            catch(e) { setAssigneeResults([]); }
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
        } catch(e) { console.error(e); alert(e.message || "Error al guardar"); }
        finally { setSaving(false); }
    }

    if (!open) return null;
    const inputBase = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]";
    const doneCount = subtasks.filter(s => s.done).length;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{background:`linear-gradient(135deg,${BRAND_BLUE} 0%,#1e3282 100%)`}}>
                    <div className="flex items-center gap-2.5"><Zap className="h-5 w-5 text-white/80"/><h3 className="text-[15px] font-black tracking-tight text-white">{task?.id?"Editar Plan de Acción":"Nuevo Plan de Acción"}</h3></div>
                    <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10"><X className="h-4 w-4"/></button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    <section>
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-black/35">Información</div>
                        <div className="space-y-3">
                            <div><label className="text-xs font-extrabold text-black/60">Título *</label><input value={title} onChange={e=>setTitle(e.target.value)} className={cls(inputBase,"mt-1")} placeholder="Nombre del plan de acción"/></div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div><label className="text-xs font-extrabold text-black/60">Columna</label><select value={listId} onChange={e=>setListId(e.target.value)} className={cls(inputBase,"mt-1 font-bold")}>{lists.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                                <div><label className="text-xs font-extrabold text-black/60">Prioridad</label><select value={priority} onChange={e=>setPriority(e.target.value)} className={cls(inputBase,"mt-1 font-bold")}>{PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                                <div><label className="text-xs font-extrabold text-black/60">Fecha de inicio</label><input type="date" value={start} onChange={e=>setStart(e.target.value)} className={cls(inputBase,"mt-1")}/></div>
                                <div><label className="text-xs font-extrabold text-black/60">Fecha límite</label><input type="date" value={due} onChange={e=>setDue(e.target.value)} className={cls(inputBase,"mt-1")}/></div>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-black/[0.06]"/>

                    <section>
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-black/35">Plan de Acción</div>
                        <div className="space-y-4">
                            <div><label className="text-xs font-extrabold text-black/60">Descripción del Problema</label><textarea value={problema} onChange={e=>setProblema(e.target.value)} className={cls(inputBase,"mt-1 min-h-[90px]")} placeholder="¿Cuál es el problema que se está atendiendo?"/></div>
                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 text-xs font-extrabold text-[#131E5C]">Causa / Raíz</div>
                                <CausaRaiz causa={causa} raiz={raiz} onChangeCausa={setCausa} onChangeRaiz={setRaiz}/>
                            </div>
                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 text-xs font-extrabold text-[#131E5C]">Desarrollo de la Estrategia</div>
                                <textarea value={estrategia} onChange={e=>setEstrategia(e.target.value)} rows={4} className={cls(inputBase,"min-h-[100px]")} placeholder="¿Qué estrategia se va a implementar?"/>
                            </div>
                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="text-xs font-extrabold text-[#131E5C]">
                                        ✓ Subtareas
                                        {subtasks.length > 0 && <span className="ml-1.5 rounded-full bg-[#131E5C]/10 px-2 py-0.5 text-[10px]">{doneCount}/{subtasks.length}</span>}
                                    </div>
                                    <span className="text-[10px] text-black/35">Puedes asignarles fechas para el Gantt</span>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSubtask()} className={cls(inputBase,"flex-1")} placeholder="Nueva subtarea..."/>
                                    <button onClick={addSubtask} className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold text-white" style={{backgroundColor:BRAND_BLUE}}><Plus className="h-4 w-4"/></button>
                                </div>
                                {subtasks.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">Sin subtareas. Agrega una arriba.</div>
                                ) : (
                                    <div className="grid gap-2">
                                        {subtasks.map(s => (
                                            <SubtaskRow key={s.id} sub={s}
                                                onToggle={id=>setSubtasks(p=>p.map(x=>x.id===id?{...x,done:!x.done}:x))}
                                                onDelete={id=>setSubtasks(p=>p.filter(x=>x.id!==id))}
                                                onChangeDate={updateSubDate}/>
                                        ))}
                                        <div className="mt-1 h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:`${subtasks.length?(doneCount/subtasks.length)*100:0}%`}}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 text-xs font-extrabold text-[#131E5C]">Resultados Esperados</div>
                                <textarea value={resultados} onChange={e=>setResultados(e.target.value)} rows={3} className={cls(inputBase,"min-h-[80px]")} placeholder="¿Qué resultados se esperan o se obtuvieron?"/>
                            </div>
                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 text-xs font-extrabold text-[#131E5C] flex items-center gap-2"><UsersRound className="h-3.5 w-3.5"/>Asignado a</div>
                                {assignedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {assignedUsers.map(user => (
                                            <div key={user.id} className="flex items-center gap-2 rounded-full bg-[#131E5C]/10 px-3 py-1.5">
                                                <UserAvatar user={user} size="sm"/>
                                                <span className="text-sm font-semibold text-[#131E5C]">{user.name}</span>
                                                <button onClick={()=>setAssignedUsers(p=>p.filter(u=>u.id!==user.id))} className="text-black/40 hover:text-red-500"><X className="h-3.5 w-3.5"/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative">
                                    <input value={assigneeSearch} onChange={e=>setAssigneeSearch(e.target.value)} className={cls(inputBase,"pr-8")} placeholder="Buscar usuario para asignar..."/>
                                    {searchingAssignees && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-black/40"/>}
                                </div>
                                {assigneeResults.length > 0 && (
                                    <div className="mt-1 border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {assigneeResults.map(user => {
                                            const already = assignedUsers.some(u => u.id === user.id);
                                            return (
                                                <button key={user.id} onClick={()=>{if(!already){setAssignedUsers(p=>[...p,user]);}setAssigneeSearch("");setAssigneeResults([]);}} disabled={already}
                                                    className={cls("w-full text-left px-3 py-2 hover:bg-slate-100 border-b last:border-b-0",already&&"opacity-50 bg-slate-50")}>
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar user={user} size="sm"/>
                                                        <div><div className="text-sm font-semibold text-[#131E5C]">{user.name}</div><div className="text-xs text-black/50">{user.email}</div></div>
                                                        {already && <span className="text-xs text-emerald-600 ml-auto">✓ Ya asignado</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {assignedUsers.length === 0 && <p className="text-xs text-black/40 mt-2 text-center">No hay usuarios asignados.</p>}
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-black/[0.06]"/>

                    <section>
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-black/35">Evidencias</div>

                        {evidenciasExistentes.length > 0 && (
                            <div className="mb-3">
                                <div className="text-xs font-extrabold text-black/50 mb-2">Archivos guardados ({evidenciasExistentes.length})</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {evidenciasExistentes.map((ev) => {
                                        const url = ev.proxy_url || ev.archivo_url || "";
                                        const name = url.split("/").pop() || "Archivo";
                                        const isImg   = /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
                                        const isPdf   = /\.pdf$/i.test(url);
                                        const isVideo = /\.(mp4|mov|webm)$/i.test(url);
                                        const isAudio = /\.(mp3|wav|m4a)$/i.test(url);
                                        return (
                                            <div key={ev.id} className="rounded-xl border border-black/10 bg-white overflow-hidden flex flex-col">
                                                <div className="w-full h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    {isImg ? (
                                                        <img src={url} alt={name} className="w-full h-full object-cover"/>
                                                    ) : isPdf ? (
                                                        <PdfThumb url={url}/>
                                                    ) : isVideo ? (
                                                        <div className="flex flex-col items-center gap-1"><span className="text-3xl">🎬</span><span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">Video</span></div>
                                                    ) : isAudio ? (
                                                        <div className="flex flex-col items-center gap-1"><span className="text-3xl">🎵</span><span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Audio</span></div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1"><span className="text-3xl">📎</span><span className="text-[10px] font-black text-black/40 uppercase tracking-wider">{name.split(".").pop()}</span></div>
                                                    )}
                                                </div>
                                                <div className="px-2 py-1.5 flex items-center justify-between gap-1 border-t border-black/5">
                                                    <span className="text-[10px] font-semibold text-black/60 truncate flex-1" title={name}>{name}</span>
                                                    {url && (
                                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                                            className="shrink-0 rounded-lg border border-black/10 bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold text-[#131E5C] hover:bg-slate-100">
                                                            Ver
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border border-dashed border-black/20 bg-slate-50 p-4 text-center">
                            <Paperclip className="mx-auto mb-2 h-7 w-7 text-black/30"/>
                            <label className="cursor-pointer text-sm font-extrabold text-[#131E5C] hover:underline">Seleccionar archivos
                                <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.mp4,.mov,.webm,.mp3,.wav,.m4a" className="hidden"
                                    onChange={e => setEvidencias(p => [...p, ...Array.from(e.target.files || [])])}/>
                            </label>
                            <p className="mt-1 text-xs text-black/40">Imágenes, PDF, video y audio</p>
                        </div>

                        {evidencias.length > 0 && (
                            <div className="mt-3">
                                <div className="text-xs font-extrabold text-black/50 mb-2">{evidencias.length} archivo(s) nuevos</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {evidencias.map((f, i) => {
                                        const isImg   = f.type.startsWith("image/");
                                        const isPdf   = f.type === "application/pdf";
                                        const isVideo = f.type.startsWith("video/");
                                        const isAudio = f.type.startsWith("audio/");
                                        const emoji      = isPdf ? "📄" : isVideo ? "🎬" : isAudio ? "🎵" : "📎";
                                        const labelColor = isPdf ? "text-red-500" : isVideo ? "text-purple-500" : isAudio ? "text-blue-500" : "text-black/40";
                                        const labelText  = isPdf ? "PDF" : isVideo ? "Video" : isAudio ? "Audio" : f.name.split(".").pop().toUpperCase();
                                        return (
                                            <div key={i} className="rounded-xl border border-black/10 bg-white overflow-hidden flex flex-col">
                                                <div className="w-full h-24 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                                    {isImg ? (
                                                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" onLoad={e=>URL.revokeObjectURL(e.target.src)}/>
                                                    ) : isPdf ? (
                                                        <PdfThumb file={f}/>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-3xl">{emoji}</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{labelText}</span>
                                                        </div>
                                                    )}
                                                    <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider">Nuevo</span>
                                                </div>
                                                <div className="px-2 py-1.5 flex items-center justify-between gap-1 border-t border-black/5">
                                                    <span className="text-[10px] font-semibold text-black/60 truncate flex-1" title={f.name}>{f.name}</span>
                                                    <button onClick={()=>setEvidencias(p=>p.filter((_,j)=>j!==i))}
                                                        className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100">
                                                        <X className="h-3 w-3"/>
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

                <div className="flex items-center justify-end gap-2 border-t border-black/[0.07] bg-slate-50/80 px-5 py-3.5 shrink-0">
                    <button onClick={onClose} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50">Cancelar</button>
                    <button onClick={handleSave} disabled={saving||!title.trim()||!listId} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50" style={{backgroundColor:BRAND_BLUE}}>
                        {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}{saving?"Guardando...":task?.id?"Guardar cambios":"Crear plan"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* KANBAN CARD */
function KanbanCard({ task, onEdit, onDelete }) {
    const [expanded,setExpanded]=useState(false);
    const subtasks=Array.isArray(task.subtareas)?task.subtareas:[];
    const done=subtasks.filter(s=>s.done).length;
    const pct=subtasks.length?Math.round((done/subtasks.length)*100):0;
    return (
        <article className="rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-[#131E5C] leading-snug">{task.title||"Sin título"}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <PriorityBadge value={task.priority}/>
                            {task.due_date&&<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black/40"><Calendar className="h-3 w-3"/>{String(task.due_date).slice(0,10)}</span>}
                            {task.start_date&&<span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black/40"><Calendar className="h-3 w-3"/>Inicio: {String(task.start_date).slice(0,10)}</span>}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <button onClick={()=>onEdit(task)} className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black/60 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5"/></button>
                        <button onClick={()=>onDelete(task)} className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                </div>
                {task.descripcion_problema&&<p className="mt-2 line-clamp-2 text-xs text-black/55">{task.descripcion_problema}</p>}
                {(task.causa||task.raiz)&&(
                    <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-black/50">
                        {task.causa&&<span className="font-bold text-[#131E5C]">{task.causa}</span>}
                        {task.causa&&task.raiz&&<span className="mx-1">·</span>}
                        {task.raiz&&<span>{task.raiz}</span>}
                    </div>
                )}
                {subtasks.length > 0 && (
                    <div className="mt-3">
                        <button onClick={()=>setExpanded(v=>!v)} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#131E5C] hover:underline">
                            {expanded?<ChevronDown className="h-3.5 w-3.5"/>:<ChevronRight className="h-3.5 w-3.5"/>}Subtareas ({done}/{subtasks.length})
                        </button>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-black/5 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:`${pct}%`}}/></div>
                        {expanded&&<div className="mt-2 grid gap-1">{subtasks.map((s,i)=>(
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                                {s.done?<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0"/>:<Clock3 className="h-3.5 w-3.5 text-slate-400 shrink-0"/>}
                                <span className={cls("truncate",s.done&&"line-through text-black/40")}>{s.title||s.titulo}</span>
                                {(s.start_date||s.due_date)&&<span className="ml-auto text-[9px] text-black/30 shrink-0">{s.start_date?.slice(0,10)||""}{s.start_date&&s.due_date?" → ":""}{s.due_date?.slice(0,10)||""}</span>}
                            </div>
                        ))}</div>}
                    </div>
                )}
                {task.desarrollo_estrategia&&(
                    <div className="mt-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] text-black/70">
                        <span className="font-bold text-blue-700">Estrategia:</span> {task.desarrollo_estrategia.length>80?task.desarrollo_estrategia.slice(0,80)+"...":task.desarrollo_estrategia}
                    </div>
                )}
                {task.assigned&&task.assigned.length>0&&(
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-black/40 font-semibold">👥</span>
                        {task.assigned.slice(0,3).map((a,i)=><UserAvatar key={i} user={a} size="sm"/>)}
                        {task.assigned.length>3&&<span className="text-[10px] text-black/40">+{task.assigned.length-3}</span>}
                    </div>
                )}
            </div>
        </article>
    );
}

function KanbanView({ tasks, lists, onEdit, onDelete, onCreateInCol, loading }) {
    if (loading) return (
        <div className="grid gap-4 sm:grid-cols-3">
            {STATUS_COLS.map(col => (
                <div key={col} className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="mb-3 h-5 w-24 animate-pulse rounded bg-black/5"/>
                    <div className="grid gap-3">{[1,2,3].map(i=><div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5"/>)}</div>
                </div>
            ))}
        </div>
    );
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {STATUS_COLS.map(col => {
                const c = STATUS_COLORS[col];
                const colTasks = tasks.filter(t => t.list_name === col);
                const list = lists.find(l => l.name === col);
                return (
                    <div key={col} className="flex flex-col rounded-2xl border border-black/10 bg-slate-50/80 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07]">
                            <div className="flex items-center gap-2">
                                <span className={cls("h-2 w-2 rounded-full",c.dot)}/>
                                <span className={cls("text-sm font-black",c.text)}>{col}</span>
                                <span className={cls("rounded-full px-2 py-0.5 text-[11px] font-bold border",c.bg,c.text,c.border)}>{colTasks.length}</span>
                            </div>
                            {list&&<button onClick={()=>onCreateInCol(list.id)} className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-black/10 bg-white text-black/50 hover:bg-slate-100 hover:text-[#131E5C]"><Plus className="h-3.5 w-3.5"/></button>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[60vh]">
                            {colTasks.length === 0
                                ? <div className="rounded-xl border border-dashed border-black/10 p-6 text-center text-xs text-black/30">Sin planes en esta columna</div>
                                : colTasks.map(task=><KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete}/>)
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TablaView({ tasks, onEdit, onDelete, loading }) {
    const [sort,setSort]=useState({key:"due_date",dir:"asc"});
    function toggleSort(key){setSort(prev=>prev.key!==key?{key,dir:"asc"}:{key,dir:prev.dir==="asc"?"desc":"asc"});}
    const sorted=useMemo(()=>{
        const data=[...tasks];const mult=sort.dir==="asc"?1:-1;
        return data.sort((a,b)=>{const va=String(a?.[sort.key]||"").toLowerCase();const vb=String(b?.[sort.key]||"").toLowerCase();return va<vb?-1*mult:va>vb?1*mult:0;});
    },[tasks,sort]);
    const SortIcon=({k})=>(<span className="opacity-60 ml-1">{sort.key===k?(sort.dir==="asc"?<ChevronUp className="h-3.5 w-3.5 inline"/>:<ChevronDown className="h-3.5 w-3.5 inline"/>):<ArrowUpDown className="h-3.5 w-3.5 inline"/>}</span>);
    return (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-black/10 bg-[#131E5C] text-xs text-white">
                        <tr>
                            {[["title","Título"],["list_name","Estado"],["priority","Prioridad"],["start_date","Fecha inicio"],["due_date","Fecha límite"],["causa","Causa"]].map(([k,l])=>(
                                <th key={k} className="px-4 py-3"><button onClick={()=>toggleSort(k)} className="inline-flex items-center font-bold text-xs">{l}<SortIcon k={k}/></button></th>
                            ))}
                            <th className="px-4 py-3 text-xs font-bold">Asignado a</th>
                            <th className="px-4 py-3 text-xs font-bold">Subtareas</th>
                            <th className="px-4 py-3 text-xs font-bold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                        {loading ? Array.from({length:5}).map((_,i) => (
                            <tr key={i} className="animate-pulse">{Array.from({length:9}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 w-24 rounded bg-slate-100"/></td>)}</tr>
                        )) : sorted.length === 0
                            ? <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-black/40">Sin planes con estos filtros.</td></tr>
                            : sorted.map(task => {
                                const subs=Array.isArray(task.subtareas)?task.subtareas:[];const done=subs.filter(s=>s.done).length;
                                return (
                                    <tr key={task.id} className="hover:bg-slate-50/60 cursor-pointer" onDoubleClick={()=>onEdit(task)}>
                                        <td className="px-4 py-3 font-bold text-[#131E5C] max-w-[200px]"><span className="line-clamp-2">{task.title||"—"}</span></td>
                                        <td className="px-4 py-3"><StatusBadge name={task.list_name}/></td>
                                        <td className="px-4 py-3"><PriorityBadge value={task.priority}/></td>
                                        <td className="px-4 py-3 text-xs text-black/50">{task.start_date?String(task.start_date).slice(0,10):"—"}</td>
                                        <td className="px-4 py-3 text-xs text-black/50">{task.due_date?String(task.due_date).slice(0,10):"—"}</td>
                                        <td className="px-4 py-3 text-xs text-black/60 max-w-[160px]"><span className="line-clamp-1">{task.causa||"—"}</span></td>
                                        <td className="px-4 py-3"><div className="flex items-center gap-1">{task.assigned&&task.assigned.slice(0,2).map((a,i)=><UserAvatar key={i} user={a} size="sm"/>)}{task.assigned&&task.assigned.length>2&&<span className="text-[10px] text-black/40">+{task.assigned.length-2}</span>}</div></td>
                                        <td className="px-4 py-3">{subs.length>0?<div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-black/5 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{width:`${(done/subs.length)*100}%`}}/></div><span className="text-xs text-black/40">{done}/{subs.length}</span></div>:<span className="text-xs text-black/30">—</span>}</td>
                                        <td className="px-4 py-3"><div className="flex items-center gap-1.5"><button onClick={()=>onEdit(task)} className="rounded-lg border border-black/10 p-1.5 text-black/60 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5"/></button><button onClick={()=>onDelete(task)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5"/></button></div></td>
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

/* TIMELINE VIEW */
function TimelineView({ tasks, onEdit, onDelete, onUpdateDates, loading,
    teams, projects, teamId, projectId, currentUser, allTasks }) {
    const ganttRef = useRef(null);
    const leftRef  = useRef(null);

    const today = new Date(); today.setHours(0,0,0,0);
    const [expandedRows, setExpandedRows] = useState({});
    const toggleRow = (id) => setExpandedRows(p => ({ ...p, [id]: !p[id] }));

    const dragRef = useRef(null);
    const [dragState, setDragState] = useState(null);
    const [dragOverrides, setDragOverrides] = useState({});
    const ACCENT   = BRAND_BLUE;
    const PANEL_BG = "#f8f9fc";
    const PANEL_HDR= "#eef0f6";

    function barColor(task) {
        if (task.list_name === "Hecho")      return "#10b981";
        if (task.list_name === "En proceso") return "#4f6ef7";
        return ACCENT;
    }

    const withDate = useMemo(() => tasks.filter(t =>
        (t.start_date && String(t.start_date).trim()) ||
        (t.due_date   && String(t.due_date).trim())
    ), [tasks]);

    const noDate = useMemo(() => tasks.filter(t =>
        !(t.start_date && String(t.start_date).trim()) &&
        !(t.due_date   && String(t.due_date).trim())
    ), [tasks]);

    function getSubDates(sub) {
        const rawStart = sub.start_date || sub.fecha_inicio || sub.startDate || sub.fechaInicio || sub.inicio || null;
        const rawEnd   = sub.due_date   || sub.fecha_fin   || sub.dueDate   || sub.fechaFin   || sub.fin   || null;
        return { rawStart, rawEnd };
    }

    const { minDate, totalDays, weeks } = useMemo(() => {
        let min = new Date(today), max = new Date(today);
        const expand = (dateStr) => {
            if (!dateStr) return;
            const d = new Date(String(dateStr));
            if (isNaN(d)) return;
            if (d < min) min = new Date(d);
            if (d > max) max = new Date(d);
        };
        withDate.forEach(t => {
            expand(t.start_date);
            expand(t.due_date);
            (Array.isArray(t.subtareas) ? t.subtareas : []).forEach(s => {
                const { rawStart, rawEnd } = getSubDates(s);
                expand(rawStart);
                expand(rawEnd);
            });
        });
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 14);
        const totalDays = Math.ceil((max - min) / 86400000);
        const weeks = [];
        const cur = new Date(min);
        cur.setDate(cur.getDate() - cur.getDay());
        while (cur <= max) {
            weeks.push({ label: `Sem ${cur.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}`, start: new Date(cur) });
            cur.setDate(cur.getDate() + 7);
        }
        return { minDate: min, totalDays, weeks };
    }, [withDate, today]);

    const DAY_W     = 38;
    const HDR_H     = 64;
    const WEEK_H    = 36;
    const DAY_H     = 28;
    const COL_PLAN  = 240;
    const COL_PROB  = 180;
    const COL_ESTRA = 180;
    const FIXED_W   = COL_PLAN + COL_PROB + COL_ESTRA;
    const ROW_BASE  = 90;
    const SUB_H     = 28;
    const SUB_HEADER_H = 28;

    function rowHeight(task) {
        const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
        if (!expandedRows[task.id] || subs.length === 0) return ROW_BASE;
        return ROW_BASE + SUB_HEADER_H + subs.length * SUB_H + 12;
    }

    const todayOffset = Math.floor((today - minDate) / 86400000);

    useEffect(() => {
        if (ganttRef.current && todayOffset > 0) {
            ganttRef.current.scrollLeft = Math.max(0, todayOffset * DAY_W - 280);
        }
    }, [todayOffset]);

    // Sincronizar scroll vertical
    useEffect(() => {
        const gantt = ganttRef.current;
        const left  = leftRef.current;
        if (!gantt || !left) return;
        let syncingFromGantt = false;
        let syncingFromLeft  = false;
        const onGanttScroll = () => {
            if (syncingFromLeft) return;
            syncingFromGantt = true;
            left.scrollTop = gantt.scrollTop;
            syncingFromGantt = false;
        };
        const onLeftScroll = () => {
            if (syncingFromGantt) return;
            syncingFromLeft = true;
            gantt.scrollTop = left.scrollTop;
            syncingFromLeft = false;
        };
        gantt.addEventListener("scroll", onGanttScroll);
        left.addEventListener("scroll",  onLeftScroll);
        return () => {
            gantt.removeEventListener("scroll", onGanttScroll);
            left.removeEventListener("scroll",  onLeftScroll);
        };
    }, []);

    useEffect(() => {
        function onMouseMoveWithSave(e) {
            if (!dragRef.current) return;
            const { origStartOff, origDur, startX, type, key } = dragRef.current;
            const deltaX    = e.clientX - startX;
            const deltaDays = Math.round(deltaX / DAY_W);
            let newStartOff = origStartOff;
            let newDur      = origDur;

            if (type === "move") {
                newStartOff = Math.max(0, Math.min(origStartOff + deltaDays, totalDays - origDur));
            } else if (type === "resize-right") {
                newDur = Math.max(1, origDur + deltaDays);
                if (newStartOff + newDur > totalDays) newDur = totalDays - newStartOff;
            } else if (type === "resize-left") {
                const maxShift = origDur - 1;
                const shift    = Math.min(deltaDays, maxShift);
                newStartOff    = Math.max(0, origStartOff + shift);
                newDur         = origDur - (newStartOff - origStartOff);
            }

            setDragOverrides(p => ({ ...p, [key]: { startOff: newStartOff, dur: newDur } }));
            dragRef.current._lastOverride = { startOff: newStartOff, dur: newDur };
        }

        function onMouseUp() {
            if (dragRef.current) {
                const { taskId, subIdx } = dragRef.current;
                const override = dragRef.current._lastOverride;
                if (override && onUpdateDates) {
                    const offsetToISO = (offset) => {
                        const d = new Date(minDate);
                        d.setDate(d.getDate() + offset);
                        return d.toISOString().slice(0, 10);
                    };
                    const newStart = offsetToISO(override.startOff);
                    const newEnd   = offsetToISO(override.startOff + override.dur - 1);
                    onUpdateDates(taskId, subIdx, newStart, newEnd);
                }
            }
            dragRef.current = null;
            setDragState(null);
        }

        window.addEventListener("mousemove", onMouseMoveWithSave);
        window.addEventListener("mouseup",   onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMoveWithSave);
            window.removeEventListener("mouseup",   onMouseUp);
        };
    }, [totalDays, minDate, onUpdateDates]);

    function startDrag(e, key, type, origStartOff, origDur, taskId, subIdx = -1) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = { key, type, startX: e.clientX, origStartOff, origDur, taskId, subIdx, _lastOverride: null };
        setDragState({ key, type });
    }

    function fmtDate(d) {
        return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" });
    }

    function parseDates(task) {
        let s = task.start_date ? new Date(String(task.start_date)) : null;
        let e = task.due_date   ? new Date(String(task.due_date))   : null;
        if (!s && e) s = new Date(e);
        if (!e && s) e = new Date(s);
        return { startDate: s, dueDate: e };
    }

    function toOffsets(startDate, dueDate) {
        let startOff = Math.floor((startDate - minDate) / 86400000);
        let dur      = Math.max(1, Math.ceil((dueDate - startDate) / 86400000) + 1);
        startOff     = Math.max(0, Math.min(startOff, totalDays - 1));
        dur          = Math.min(dur, totalDays - startOff);
        return { startOff, dur };
    }

    function getBarOffsets(key, origStartOff, origDur) {
        if (dragOverrides[key]) return dragOverrides[key];
        return { startOff: origStartOff, dur: origDur };
    }

    // ─────────────────────────────────────────────────────────
    //  EXPORTAR PDF con resumen IA (OpenAI)
    // ─────────────────────────────────────────────────────────
    async function exportToPDF() {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const W   = doc.internal.pageSize.getWidth();
        const H   = doc.internal.pageSize.getHeight();
        const margin   = 18;
        const contentW = W - margin * 2;
        const BLUE  = [19, 30, 92];
        const GRAY  = [120, 125, 145];
        const BLACK = [30, 30, 40];

        // ── Fuentes VW (opcionales) ───────────────────────────
        let usarVW = false;
        try {
            if (VW_HEAD_BOLD && VW_HEAD_BOLD.length > 1000 &&
                VW_TEXT_LIGHT && VW_TEXT_LIGHT.length > 1000) {
                doc.addFileToVFS("VWHeadBold.ttf", VW_HEAD_BOLD);
                doc.addFont("VWHeadBold.ttf", "VWHead", "bold");
                doc.addFileToVFS("VWTextLight.ttf", VW_TEXT_LIGHT);
                doc.addFont("VWTextLight.ttf", "VWText", "normal");
                usarVW = true;
            }
        } catch(e) {
            console.warn("Fuentes VW no disponibles:", e);
        }

        function setHead(size, color = BLACK) {
            doc.setFont(usarVW ? "VWHead" : "helvetica", "bold");
            doc.setFontSize(size);
            doc.setTextColor(...color);
        }
        function setLight(size, color = BLACK) {
            doc.setFont(usarVW ? "VWText" : "helvetica", "normal");
            doc.setFontSize(size);
            doc.setTextColor(...color);
        }
        function setItalic(size, color = GRAY) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(size);
            doc.setTextColor(...color);
        }

        function drawFooter(pageNum, totalPages) {
            const fechaImp = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "2-digit" });
            const usuario  = currentUser?.name || "Sistema";
            setLight(7.5, GRAY);
            doc.line(margin, H - 12, W - margin, H - 12);
            doc.text(`${fechaImp}; generado por ${usuario}. Referencia ISO 10.1`, margin, H - 7);
            doc.text(`Pag. ${pageNum} / ${totalPages}`, W - margin, H - 7, { align: "right" });
        }

        function separator(y, color = [210, 213, 228]) {
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

        // ── Datos del proyecto ────────────────────────────────
        const selectedTeam    = teams.find(t => Number(t.id) === Number(teamId));
        const selectedProject = projects.find(p => Number(p.id) === Number(projectId));

        const allDates = allTasks
            .flatMap(t => [t.start_date, t.due_date])
            .filter(Boolean)
            .map(d => new Date(String(d)))
            .filter(d => !isNaN(d))
            .sort((a, b) => a - b);
        const proyectoInicio = allDates[0]?.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) || null;
        const proyectoFin    = allDates[allDates.length - 1]?.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) || null;

        const porHacer  = allTasks.filter(t => t.list_name === "Por hacer").length;
        const enProceso = allTasks.filter(t => t.list_name === "En proceso").length;
        const hecho     = allTasks.filter(t => t.list_name === "Hecho").length;

       // ── Resumen ejecutivo vía backend ──────────────────────
let resumenIA = "";
try {
    const authRaw = localStorage.getItem("auth") || "{}";
    const authData = JSON.parse(authRaw);
    const token = authData?.token || authData?.access_token || authData?.accessToken || "";

    const resp = await fetch(`${API_ROOT}/api/clickup/ia/resumen/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            tareas: allTasks.slice(0, 8).map(t => ({
                descripcion_problema:   t.descripcion_problema   || "",
                desarrollo_estrategia:  t.desarrollo_estrategia  || "",
                resultados:             t.resultados             || "",
            })),
            proyecto_nombre: selectedProject?.name  || "Proyecto",
            equipo_nombre:   selectedTeam?.name     || "Grupo Automotriz R&R",
            total:           allTasks.length,
            hecho:           hecho,
        }),
    });

    if (resp.ok) {
        const data = await resp.json();
        resumenIA = data?.resumen?.trim() || "";
    }
} catch(e) {
    console.warn("Resumen IA no disponible:", e);
}

        // ── Fallback si OpenAI no responde ───────────────────
        if (!resumenIA) {
            const causasFrecuentes = [...new Set(allTasks.map(t => t.causa).filter(Boolean))].slice(0, 3).join(", ");
            resumenIA =
                `El proyecto "${selectedProject?.name || "sin nombre"}" del equipo "${selectedTeam?.name || "Grupo Automotriz R&R"}" ` +
                `cuenta con ${allTasks.length} planes de acción registrados, de los cuales ${hecho} han sido completados, ` +
                `${enProceso} están en proceso y ${porHacer} están pendientes de iniciar. ` +
                (causasFrecuentes ? `Las principales causas identificadas corresponden a: ${causasFrecuentes}. ` : "") +
                `El seguimiento de estos planes contribuye a la mejora continua de los procesos operativos y comerciales de la organización.`;
        }

        // ── PORTADA ───────────────────────────────────────────
        doc.setFillColor(...BLUE);
        doc.rect(0, 0, W, 14, "F");
        setLight(8, [255, 255, 255]);
        doc.text("Time For Action", margin, 9.5);

        let y = 30;
        setLight(9, GRAY);
        doc.text(selectedTeam?.name || "Grupo Automotriz R&R", margin, y);
        y += 10;

        setHead(28, [...BLUE]);
        const projLines = doc.splitTextToSize(selectedProject?.name || "Proyecto", contentW);
        doc.text(projLines, margin, y);
        y += projLines.length * 12 + 3;

        if (proyectoInicio && proyectoFin) {
            setItalic(9, GRAY);
            doc.text(`${proyectoInicio} - ${proyectoFin}`, margin, y);
            y += 10;
        }

        separator(y);
        y += 8;

        setLight(10.5, BLACK);
        const resumenLines = doc.splitTextToSize(resumenIA, contentW);
        doc.text(resumenLines, margin, y);
        y += resumenLines.length * 4.8 + 10;
        if (y > H - 60) y = H - 60;

        separator(y);
        y += 8;

        const statCols = [
            { label: "Total de planes", val: String(allTasks.length) },
            { label: "Por hacer",       val: String(porHacer) },
            { label: "En proceso",      val: String(enProceso) },
            { label: "Completados",     val: String(hecho) },
        ];
        const statW = contentW / statCols.length;
        statCols.forEach((s, i) => {
            const sx = margin + i * statW + statW / 2;
            setHead(18, [...BLUE]);
            doc.text(s.val, sx, y + 8, { align: "center" });
            setLight(8, GRAY);
            doc.text(s.label, sx, y + 14, { align: "center" });
        });

        // ── PÁGINAS DE PLANES ─────────────────────────────────
        const PRIO_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const tasksList  = [...withDate, ...noDate].sort((a, b) =>
            (PRIO_ORDER[a.priority] ?? 2) - (PRIO_ORDER[b.priority] ?? 2)
        );
        const totalPages = 1 + tasksList.length;

        drawFooter(1, totalPages);

        tasksList.forEach((task, idx) => {
            doc.addPage();
            const pageNum  = idx + 2;
            const subtasks = Array.isArray(task.subtareas) ? task.subtareas : [];
            const doneCount= subtasks.filter(s => s.done).length;

            let cy = 18;

            setHead(22, [...BLUE]);
            const titleLines = doc.splitTextToSize(task.title || "Sin título", contentW);
            doc.text(titleLines, margin, cy);
            cy += titleLines.length * 9 + 3;

            setItalic(8.5, GRAY);
            const prioLabel = { LOW:"Baja", MEDIUM:"Media", HIGH:"Alta", URGENT:"Urgente" }[task.priority] || task.priority;
            doc.text(`Estatus: ${task.list_name || "-"}  |  Prioridad: ${prioLabel || "-"}`, margin, cy);
            cy += 6;

            const sStr = task.start_date ? String(task.start_date).slice(0, 10) : null;
            const eStr = task.due_date   ? String(task.due_date).slice(0, 10)   : null;
            if (sStr || eStr) {
                setItalic(8, GRAY);
                doc.text(`${sStr || "-"} - ${eStr || "-"}`, margin, cy);
                cy += 6;
            }

            separator(cy); cy += 7;

            if (task.causa || task.raiz) {
                const causaTxt = [task.causa, task.raiz].filter(Boolean).join(", ");
                setHead(8, [...BLUE]);
                doc.text("Causa raíz:", margin, cy); cy += 5;
                setLight(9, BLACK);
                const causaLines = doc.splitTextToSize(causaTxt, contentW);
                doc.text(causaLines, margin, cy);
                cy += causaLines.length * 4.5 + 6;
            }

            separator(cy, [230, 232, 242]); cy += 7;
            cy = block("Descripción del Problema", task.descripcion_problema, cy, 8, 9.5);
            cy = block("Desarrollo de la estrategia", task.desarrollo_estrategia, cy, 8, 9.5);

            if (subtasks.length > 0) {
                setHead(8, [...BLUE]);
                doc.text(`Subtareas  (${doneCount}/${subtasks.length} completadas)`, margin, cy); cy += 5;
                const barW = contentW * 0.4;
                doc.setFillColor(220, 224, 240);
                doc.roundedRect(margin, cy, barW, 3, 1, 1, "F");
                if (doneCount > 0) {
                    doc.setFillColor(16, 185, 129);
                    doc.roundedRect(margin, cy, barW * (doneCount / subtasks.length), 3, 1, 1, "F");
                }
                cy += 7;
                subtasks.forEach(sub => {
                    const mark = sub.done ? "[x]" : "[ ]";
                    const { rawStart, rawEnd } = getSubDates(sub);
                    const subInicio = rawStart ? String(rawStart).slice(0, 10) : "";
                    const subFin    = rawEnd   ? String(rawEnd).slice(0, 10)   : "";
                    const fechaSub  = (subInicio || subFin) ? `   Inicio: ${subInicio || "-"}  Fin: ${subFin || "-"}` : "";
                    const subTxt    = `${mark} ${sub.title || sub.titulo || ""}${fechaSub}`;
                    setLight(sub.done ? 8.5 : 9, sub.done ? GRAY : BLACK);
                    const subLines = doc.splitTextToSize(subTxt, contentW - 4);
                    doc.text(subLines, margin + 2, cy);
                    cy += subLines.length * 4.2 + 2;
                });
                cy += 4;
            }

            cy = block("Resultados", task.resultados, cy, 8, 9.5);

            if (Array.isArray(task.asignados) && task.asignados.length > 0) {
                separator(cy, [230, 232, 242]); cy += 6;
                setHead(8, [...BLUE]);
                doc.text("Asignado a", margin, cy); cy += 5;
                setLight(9, BLACK);
                doc.text(task.asignados.map(a => a.name || a.email || "-").join("  |  "), margin, cy);
                cy += 7;
            }

            if (Array.isArray(task.evidencias) && task.evidencias.length > 0) {
                separator(cy, [230, 232, 242]); cy += 6;
                setHead(8, [...BLUE]);
                doc.text(`Evidencias (${task.evidencias.length})`, margin, cy); cy += 6;
                task.evidencias.forEach(ev => {
                    const url  = ev.proxy_url || ev.archivo_url || "";
                    const name = decodeURIComponent(url.split("/").pop().split("?")[0]).slice(0, 60) || "Archivo";
                    doc.setFillColor(245, 246, 250);
                    doc.roundedRect(margin, cy - 3.5, contentW, 7, 1, 1, "F");
                    const ext  = name.split(".").pop().toLowerCase();
                    const icon = ext === "pdf" ? "[PDF]" : ["jpg","jpeg","png","webp"].includes(ext) ? "[IMG]" : "[DOC]";
                    setHead(7.5, [...BLUE]);
                    doc.text(icon, margin + 2, cy + 1);
                    setLight(8, BLACK);
                    doc.text(name, margin + 14, cy + 1);
                    if (url) doc.link(margin + 14, cy - 3, contentW - 16, 7, { url });
                    cy += 9;
                });
            }

            drawFooter(pageNum, totalPages);
        });

        const nombreProyecto = (selectedProject?.name || "TimeForAction")
            .replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 40);
        doc.save(`${nombreProyecto}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    if (loading) return (
        <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100"/>)}
        </div>
    );

    if (tasks.length === 0) return (
        <div className="rounded-2xl border border-dashed border-black/10 p-10 text-center text-sm text-black/40">
            No hay planes de acción creados.
        </div>
    );

    const cellStyle = { borderRight: `1px solid rgba(19,30,92,0.08)`, overflow: "hidden", flexShrink: 0 };

    return (
        <div className="w-full space-y-4">
            {withDate.length > 0 && (
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `1.5px solid ${ACCENT}30` }}>

                    <div className="flex items-center justify-between px-4 py-2.5 flex-wrap gap-2" style={{ background: ACCENT }}>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <GitBranch className="h-3.5 w-3.5"/>Línea de tiempo
                            </span>
                            {[
                                { color: "#60a5fa", label: "Hoy" },
                                { color: "#10b981", label: "Hecho" },
                                { color: "#4f6ef7", label: "En proceso" },
                                { color: "rgba(255,255,255,0.6)", label: "Por hacer" },
                                { color: "#ef4444", label: "Vencida" },
                            ].map(({ color, label }) => (
                                <span key={label} className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }}/>
                                    <span className="text-[10px] text-white/70">{label}</span>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/50">{withDate.length} planes · arrastra las barras para ajustar fechas</span>
                            <button onClick={() => exportToPDF()}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-white/20 transition">
                                <Paperclip className="h-3.5 w-3.5"/>Exportar PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex" style={{ background: PANEL_BG, maxHeight: "72vh", overflow: "hidden" }}>

                        {/* COLUMNAS FIJAS */}
                        <div ref={leftRef}
                            style={{ width: FIXED_W, flexShrink: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                            <div className="sticky top-0 z-30 flex" style={{ height: HDR_H, background: PANEL_HDR, borderBottom: `1px solid ${ACCENT}15` }}>
                                {[
                                    [COL_PLAN,  "Plan de acción"],
                                    [COL_PROB,  "Descripción del Problema"],
                                    [COL_ESTRA, "Desarrollo de la Estrategia"],
                                ].map(([w, label]) => (
                                    <div key={label} style={{ ...cellStyle, width: w, height: HDR_H, display: "flex", alignItems: "center", padding: "0 12px" }}>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest leading-tight" style={{ color: `${ACCENT}80` }}>{label}</span>
                                    </div>
                                ))}
                            </div>

                            {withDate.map(task => {
                                const rh         = rowHeight(task);
                                const subtasks   = Array.isArray(task.subtareas) ? task.subtareas : [];
                                const doneCount  = subtasks.filter(s => s.done).length;
                                const isExpanded = !!expandedRows[task.id];
                                const { startDate, dueDate } = parseDates(task);
                                const isOverdue  = dueDate && dueDate < today && task.list_name !== "Hecho";

                                return (
                                    <div key={task.id} className="flex group"
                                        style={{ minHeight: rh, borderBottom: `1px solid ${ACCENT}08`, background: "white" }}>
                                        <div style={{ ...cellStyle, width: COL_PLAN, minHeight: rh, display: "flex", alignItems: "flex-start", padding: "10px", background: "inherit" }}>
                                            <div className="flex items-start gap-1 w-full">
                                                <button type="button" onClick={() => toggleRow(task.id)} disabled={subtasks.length === 0}
                                                    className="shrink-0 mt-0.5 h-5 w-5 rounded flex items-center justify-center border transition-colors"
                                                    style={subtasks.length === 0
                                                        ? { borderColor: `${ACCENT}15`, color: `${ACCENT}30`, cursor: "not-allowed" }
                                                        : isExpanded
                                                            ? { borderColor: ACCENT, background: ACCENT, color: "white" }
                                                            : { borderColor: `${ACCENT}30`, color: `${ACCENT}60` }}>
                                                    {isExpanded ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <button type="button" onClick={() => onEdit(task)}
                                                        className="text-left text-xs font-black leading-snug line-clamp-2 hover:underline w-full" style={{ color: ACCENT }}>
                                                        {task.title || "Sin título"}
                                                    </button>
                                                    <div className="flex items-center gap-1 flex-wrap mt-1">
                                                        <StatusBadge name={task.list_name}/>
                                                        <PriorityBadge value={task.priority}/>
                                                    </div>
                                                    {startDate && dueDate && (
                                                        <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: `${ACCENT}50` }}>
                                                            <Calendar className="h-2.5 w-2.5 shrink-0"/>
                                                            <span>{fmtDate(startDate)}</span><span>→</span>
                                                            <span className={isOverdue ? "text-rose-500 font-bold" : ""}>{fmtDate(dueDate)}</span>
                                                            {isOverdue && <span className="text-[8px] font-extrabold text-rose-500 bg-rose-50 border border-rose-200 rounded px-1">VENCIDA</span>}
                                                        </div>
                                                    )}
                                                    {isExpanded && subtasks.length > 0 && (
                                                        <div className="mt-2 border-t pt-2" style={{ borderColor: `${ACCENT}08` }}>
                                                            <div className="flex items-center gap-1.5 mb-2">
                                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${ACCENT}10` }}>
                                                                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / subtasks.length) * 100}%` }}/>
                                                                </div>
                                                                <span className="text-[9px] font-bold shrink-0" style={{ color: `${ACCENT}50` }}>{doneCount}/{subtasks.length}</span>
                                                            </div>
                                                            {subtasks.map((sub, i) => {
                                                                const { rawStart, rawEnd } = getSubDates(sub);
                                                                return (
                                                                    <div key={i} className="flex items-center gap-1.5 py-0.5" style={{ height: SUB_H }}>
                                                                        {sub.done
                                                                            ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0"/>
                                                                            : <Clock3 className="h-3 w-3 shrink-0" style={{ color: `${ACCENT}30` }}/>}
                                                                        <span className={cls("text-[10px] truncate", sub.done ? "line-through text-black/30" : "font-semibold")}
                                                                            style={sub.done ? {} : { color: `${ACCENT}70` }}>
                                                                            {sub.title || sub.titulo}
                                                                        </span>
                                                                        {(rawStart || rawEnd) && (
                                                                            <span className="ml-auto text-[9px] shrink-0" style={{ color: `${ACCENT}40` }}>
                                                                                {rawStart ? new Date(rawStart).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit"}) : ""}
                                                                                {rawStart && rawEnd ? "→" : ""}
                                                                                {rawEnd   ? new Date(rawEnd).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit"}) : ""}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={e => { e.stopPropagation(); onEdit(task); }} className="p-1 rounded" style={{ color: `${ACCENT}50` }}
                                                        onMouseEnter={e=>e.currentTarget.style.background=`${ACCENT}10`} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                                        <Pencil className="h-3 w-3"/>
                                                    </button>
                                                    <button onClick={e => { e.stopPropagation(); onDelete(task); }} className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50">
                                                        <Trash2 className="h-3 w-3"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ ...cellStyle, width: COL_PROB, minHeight: rh, display: "flex", alignItems: "flex-start", padding: "10px", background: PANEL_BG }}>
                                            {task.descripcion_problema
                                                ? <p className="text-[10px] leading-relaxed" style={{ color: `${ACCENT}70` }}>{task.descripcion_problema}</p>
                                                : <span className="text-[10px] italic" style={{ color: `${ACCENT}25` }}>—</span>}
                                        </div>
                                        <div style={{ ...cellStyle, width: COL_ESTRA, minHeight: rh, display: "flex", alignItems: "flex-start", padding: "10px", background: `${ACCENT}04`, borderRight: "none" }}>
                                            {task.desarrollo_estrategia
                                                ? <p className="text-[10px] leading-relaxed" style={{ color: `${ACCENT}80` }}>{task.desarrollo_estrategia}</p>
                                                : <span className="text-[10px] italic" style={{ color: `${ACCENT}25` }}>—</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* GANTT */}
                        <div ref={ganttRef} style={{ flex: 1, overflowX: "auto", overflowY: "auto", minWidth: 0 }}>
                            <div style={{ minWidth: totalDays * DAY_W, position: "relative" }}>

                                {/* Cabecera semanas */}
                                <div className="flex sticky z-40" style={{ top: 0, height: WEEK_H, borderBottom: `1px solid ${ACCENT}12`, background: PANEL_HDR }}>
                                    {weeks.map((w, i) => (
                                        <div key={i} className="flex items-center justify-center shrink-0 text-[10px] font-bold"
                                            style={{ width: 7 * DAY_W, borderRight: `1px solid ${ACCENT}10`, color: `${ACCENT}50` }}>
                                            {w.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Cabecera días */}
                                <div className="flex sticky z-40" style={{ top: WEEK_H, height: DAY_H, borderBottom: `1px solid ${ACCENT}10`, background: "white" }}>
                                    {Array.from({ length: totalDays }).map((_, idx) => {
                                        const d = new Date(minDate); d.setDate(d.getDate() + idx);
                                        const isToday   = idx === todayOffset;
                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                        return (
                                            <div key={idx} className="flex items-center justify-center border-r shrink-0 text-[10px]"
                                                style={{
                                                    width: DAY_W, height: DAY_H, borderColor: `${ACCENT}06`,
                                                    background: isToday ? `${ACCENT}15` : isWeekend ? `${ACCENT}04` : "white",
                                                    color: isToday ? ACCENT : isWeekend ? `${ACCENT}25` : `${ACCENT}45`,
                                                    fontWeight: isToday ? 700 : 400,
                                                }}>
                                                {d.getDate()}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Cuerpo */}
                                <div style={{ position: "relative" }}>
                                    {todayOffset >= 0 && todayOffset < totalDays && (
                                        <div style={{ position: "absolute", top: 0, bottom: 0, zIndex: 20, left: todayOffset * DAY_W, width: 2, background: ACCENT, pointerEvents: "none" }}/>
                                    )}
                                    {Array.from({ length: totalDays }).map((_, idx) => {
                                        const d = new Date(minDate); d.setDate(d.getDate() + idx);
                                        if (d.getDay() !== 0 && d.getDay() !== 6) return null;
                                        return <div key={idx} style={{ position: "absolute", top: 0, bottom: 0, left: idx * DAY_W, width: DAY_W, background: `${ACCENT}03`, zIndex: 0, pointerEvents: "none" }}/>;
                                    })}

                                    {withDate.map(task => {
                                        const { startDate, dueDate } = parseDates(task);
                                        if (!startDate || !dueDate) return null;

                                        const rawOffsets = toOffsets(startDate, dueDate);
                                        const taskKey    = `task_${task.id}`;
                                        const { startOff, dur } = getBarOffsets(taskKey, rawOffsets.startOff, rawOffsets.dur);
                                        if (dur <= 0) return null;

                                        const bc         = barColor(task);
                                        const subtasks   = Array.isArray(task.subtareas) ? task.subtareas : [];
                                        const doneCount  = subtasks.filter(s => s.done).length;
                                        const progress   = subtasks.length ? (doneCount / subtasks.length) * 100 : 0;
                                        const isExpanded = !!expandedRows[task.id];
                                        const isOverdue  = dueDate < today && task.list_name !== "Hecho";
                                        const rh         = rowHeight(task);
                                        const isDragging = dragState?.key === taskKey;

                                        return (
                                            <div key={task.id} style={{ height: rh, minHeight: rh, borderBottom: `1px solid ${ACCENT}06`, position: "relative" }}>
                                                {/* Barra principal */}
                                                <div className="absolute z-10 rounded-lg"
                                                    style={{
                                                        left: startOff * DAY_W + 3,
                                                        width: Math.max(dur * DAY_W - 6, 60),
                                                        top: 9, height: 42,
                                                        background: `${bc}20`,
                                                        borderLeft: `4px solid ${bc}`,
                                                        borderTop: `1px solid ${bc}30`,
                                                        borderBottom: `1px solid ${bc}30`,
                                                        borderRight: isOverdue ? "2px solid #ef4444" : `1px solid ${bc}20`,
                                                        cursor: isDragging ? "grabbing" : "grab",
                                                        boxShadow: isDragging ? `0 4px 12px ${bc}40` : "none",
                                                        transition: isDragging ? "none" : "box-shadow 0.15s",
                                                        userSelect: "none",
                                                    }}
                                                    onMouseDown={e => startDrag(e, taskKey, "move", startOff, dur, task.id, -1)}>
                                                    <div className="absolute left-0 top-0 bottom-0 w-2 z-20 flex items-center justify-center" style={{ cursor: "w-resize" }}
                                                        onMouseDown={e => startDrag(e, taskKey, "resize-left", startOff, dur, task.id, -1)}>
                                                        <div style={{ width: 2, height: 16, borderRadius: 2, background: `${bc}60` }}/>
                                                    </div>
                                                    <div className="flex flex-col justify-center h-full px-4 overflow-hidden">
                                                        <span className="text-[11px] font-bold truncate" style={{ color: bc }}>{task.title}</span>
                                                        <span className="text-[9px] truncate" style={{ color: `${ACCENT}40` }}>
                                                            {dragOverrides[taskKey]
                                                                ? (() => {
                                                                    const s = new Date(minDate); s.setDate(s.getDate() + dragOverrides[taskKey].startOff);
                                                                    const e = new Date(minDate); e.setDate(e.getDate() + dragOverrides[taskKey].startOff + dragOverrides[taskKey].dur - 1);
                                                                    return `${fmtDate(s)} → ${fmtDate(e)}`;
                                                                })()
                                                                : `${fmtDate(startDate)} → ${fmtDate(dueDate)}`
                                                            }
                                                        </span>
                                                    </div>
                                                    {subtasks.length > 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden" style={{ background: `${bc}15` }}>
                                                            <div className="h-full" style={{ width: `${progress}%`, background: bc }}/>
                                                        </div>
                                                    )}
                                                    <div className="absolute right-0 top-0 bottom-0 w-2 z-20 flex items-center justify-center" style={{ cursor: "e-resize" }}
                                                        onMouseDown={e => startDrag(e, taskKey, "resize-right", startOff, dur, task.id, -1)}>
                                                        <div style={{ width: 2, height: 16, borderRadius: 2, background: `${bc}60` }}/>
                                                    </div>
                                                </div>

                                                {/* Barras de subtareas */}
                                                {isExpanded && subtasks.map((sub, i) => {
                                                    const { rawStart, rawEnd } = getSubDates(sub);
                                                    let subRawStartOff, subRawDur;

                                                    if (rawStart || rawEnd) {
                                                        const ss  = rawStart ? new Date(String(rawStart)) : new Date(String(rawEnd));
                                                        const se  = rawEnd   ? new Date(String(rawEnd))   : new Date(String(rawStart));
                                                        const res = toOffsets(ss, se);
                                                        subRawStartOff = res.startOff;
                                                        subRawDur      = res.dur;
                                                    } else {
                                                        const totalSubs = subtasks.length;
                                                        const perSub    = Math.max(1, Math.floor(rawOffsets.dur / totalSubs));
                                                        subRawStartOff  = rawOffsets.startOff + i * perSub;
                                                        subRawDur       = i === totalSubs - 1 ? rawOffsets.dur - i * perSub : perSub;
                                                    }

                                                    const subKey = `sub_${task.id}_${i}`;
                                                    const { startOff: subStartOff, dur: subDur } = getBarOffsets(subKey, subRawStartOff, subRawDur);
                                                    const topPos  = ROW_BASE + SUB_HEADER_H + i * SUB_H;
                                                    const subColor= sub.done ? "#10b981" : `${ACCENT}70`;
                                                    const isSubDrag = dragState?.key === subKey;

                                                    return (
                                                        <div key={i} className="absolute z-10 rounded flex items-center" title={sub.title || sub.titulo}
                                                            style={{
                                                                left:   subStartOff * DAY_W + 6,
                                                                width:  Math.max(subDur * DAY_W - 12, 36),
                                                                top:    topPos,
                                                                height: SUB_H - 6,
                                                                background: sub.done ? "#10b98118" : `${ACCENT}0d`,
                                                                borderLeft: `3px solid ${subColor}`,
                                                                cursor: isSubDrag ? "grabbing" : "grab",
                                                                boxShadow: isSubDrag ? `0 2px 8px ${subColor}40` : "none",
                                                                transition: isSubDrag ? "none" : "box-shadow 0.15s",
                                                                userSelect: "none",
                                                            }}
                                                            onMouseDown={e => startDrag(e, subKey, "move", subStartOff, subDur, task.id, i)}>
                                                            <span className="text-[9px] font-bold truncate px-2" style={{ color: subColor, flex: 1 }}>
                                                                {sub.done ? "✓ " : "○ "}{sub.title || sub.titulo}
                                                            </span>
                                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 z-20" style={{ cursor: "e-resize" }}
                                                                onMouseDown={e => startDrag(e, subKey, "resize-right", subStartOff, subDur, task.id, i)}/>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sección SIN fecha */}
            {noDate.length > 0 && (
                <div className="rounded-2xl overflow-hidden w-full" style={{ border: `1.5px solid ${ACCENT}20` }}>
                    <div className="flex items-center gap-2 px-4 py-3" style={{ background: ACCENT }}>
                        <Clock3 className="h-4 w-4 text-white/70"/>
                        <span className="text-xs font-extrabold text-white uppercase tracking-wide">Sin fecha asignada ({noDate.length})</span>
                    </div>
                    <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ background: PANEL_BG }}>
                        {noDate.map(task => {
                            const subtasks  = Array.isArray(task.subtareas) ? task.subtareas : [];
                            const doneCount = subtasks.filter(s => s.done).length;
                            const isExpND   = !!expandedRows[`nd_${task.id}`];
                            return (
                                <div key={task.id} className="rounded-xl overflow-hidden transition-all" style={{ border: `1px solid ${ACCENT}15`, background: "white" }}>
                                    <div className="flex items-start gap-2 p-3">
                                        <button type="button"
                                            onClick={() => setExpandedRows(p => ({ ...p, [`nd_${task.id}`]: !p[`nd_${task.id}`] }))}
                                            disabled={subtasks.length === 0}
                                            className="shrink-0 mt-0.5 h-5 w-5 rounded flex items-center justify-center border transition-colors"
                                            style={subtasks.length === 0
                                                ? { borderColor: `${ACCENT}15`, color: `${ACCENT}30`, cursor: "not-allowed" }
                                                : isExpND
                                                    ? { borderColor: ACCENT, background: ACCENT, color: "white" }
                                                    : { borderColor: `${ACCENT}30`, color: `${ACCENT}60` }}>
                                            {isExpND ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black truncate mb-1" style={{ color: ACCENT }}>{task.title}</div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <PriorityBadge value={task.priority}/>
                                                <StatusBadge name={task.list_name}/>
                                                {subtasks.length > 0 && (
                                                    <span className="text-[9px] font-bold rounded px-1.5 py-0.5" style={{ background: `${ACCENT}08`, color: `${ACCENT}60` }}>
                                                        ✓ {doneCount}/{subtasks.length}
                                                    </span>
                                                )}
                                            </div>
                                            {task.descripcion_problema && (
                                                <p className="text-[10px] line-clamp-2 mt-1 leading-snug" style={{ color: `${ACCENT}60` }}>{task.descripcion_problema}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-0.5 shrink-0">
                                            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg border border-black/10 text-black/40 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5"/></button>
                                            <button onClick={() => onDelete(task)} className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5"/></button>
                                        </div>
                                    </div>
                                    {isExpND && subtasks.length > 0 && (
                                        <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: `${ACCENT}08`, background: `${ACCENT}03` }}>
                                            <div className="h-1.5 w-full rounded-full overflow-hidden mb-2" style={{ background: `${ACCENT}10` }}>
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%` }}/>
                                            </div>
                                            <div className="space-y-1">
                                                {subtasks.map((sub, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        {sub.done
                                                            ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0"/>
                                                            : <Clock3 className="h-3 w-3 shrink-0" style={{ color: `${ACCENT}30` }}/>}
                                                        <span className={cls("text-[10px] truncate", sub.done ? "line-through text-black/30" : "font-semibold")}
                                                            style={sub.done ? {} : { color: `${ACCENT}70` }}>
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
                    <div className="px-4 py-2 text-center text-xs" style={{ background: `${ACCENT}08`, color: `${ACCENT}70` }}>
                        Asigna fechas a las subtareas para visualizarlas en el Gantt
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TimeForAction() {
    const [teamId,setTeamId]=useState(()=>{const v=localStorage.getItem("clickup_team_id");return v?Number(v):null;});
    const [projectId,setProjectId]=useState(()=>{const v=localStorage.getItem("clickup_project_id");return v?Number(v):null;});
    const [teams,setTeams]=useState([]);
    const [projects,setProjects]=useState([]);
    const [lists,setLists]=useState([]);
    const [tasks,setTasks]=useState([]);
    const [loading,setLoading]=useState(false);
    const [view,setView]=useState("kanban");
    const [q,setQ]=useState("");
    const [filterStatus,setFilterStatus]=useState("Todos");
    const [showMyTasksOnly,setShowMyTasksOnly]=useState(false);
    const [currentUser,setCurrentUser]=useState(null);
    const [modalOpen,setModalOpen]=useState(false);
    const [editingTask,setEditingTask]=useState(null);
    const [teamsModalOpen,setTeamsModalOpen]=useState(false);
    const [editingProject,setEditingProject]=useState(false);
    const [projectName,setProjectName]=useState("");
    const [projectModalOpen,setProjectModalOpen]=useState(false);
    const [newProjectName,setNewProjectName]=useState("");
    const [confirmDeleteTask,setConfirmDeleteTask]=useState(null);
    const [deletingTask,setDeletingTask]=useState(false);
    const [confirmDeleteProject,setConfirmDeleteProject]=useState(false);
    const [deletingProject,setDeletingProject]=useState(false);

    useEffect(()=>{
        try{const auth=localStorage.getItem("auth");if(auth){const p=JSON.parse(auth);const u=p?.user||p?.usuario;if(u)setCurrentUser({id:u.id_usuario||u.id,name:u.nombre_completo||u.nombre,email:u.correo||u.email});}}catch(e){}
    },[]);

    const fetchTeams = useCallback(async () => {
        try {
            const data = await apiClickup.listTeams();
            const arr  = Array.isArray(data) ? data : [];
            setTeams(arr);
            if (!teamId && arr[0]) setTeamId(Number(arr[0].id));
            if (teamId && arr.length > 0 && !arr.find(t => Number(t.id) === Number(teamId))) {
                setTeamId(Number(arr[0].id));
                setProjectId(null);
            }
        } catch(e) { console.error(e); }
    }, [teamId]);

    useEffect(()=>{fetchTeams();},[]);
    useEffect(()=>{
        if(!teamId)return;
        apiClickup.listProjects(teamId).then(data=>{
            const arr=Array.isArray(data)?data:[];
            setProjects(arr);
            if(!projectId&&arr[0])setProjectId(Number(arr[0].id));
        }).catch(console.error);
    },[teamId]);

    const loadBoard = useCallback(async () => {
        if(!teamId||!projectId)return;
        setLoading(true);
        try {
            const res         = await apiClickup.getBoard(Number(teamId),Number(projectId));
            const rawLists    = res?.lists||[];
            const tasksByList = res?.tasks_by_list||{};
            setLists(rawLists);
            setTasks(rawLists.flatMap(l=>(tasksByList[l.id]||[]).map(t=>({...t,list_name:l.name,list_id:l.id}))));
        } catch(e){console.error(e);}
        finally{setLoading(false);}
    },[teamId,projectId]);

    useEffect(()=>{loadBoard();},[loadBoard]);

    useEffect(()=>{
        if(!teamId)return;
        apiClickup.listNotifications().then(notifs=>{
            const hasInvites=notifs.some(n=>n.type==="TEAM_INVITE"||n.type==="INVITATION"||n.type==="TASK_ASSIGNED");
            if(hasInvites)loadBoard();
        }).catch(()=>{});
    },[teamId]);

    useEffect(()=>{
        const handler=async(e)=>{
            const{teamId:tid,projectId:pid,taskId}=e.detail||{};
            if(tid){setTeamId(Number(tid));localStorage.setItem("clickup_team_id",String(tid));}
            if(pid){setProjectId(Number(pid));localStorage.setItem("clickup_project_id",String(pid));}
            setTimeout(async()=>{
                await loadBoard();
                if(taskId){setTasks(prev=>{const found=prev.find(t=>Number(t.id)===Number(taskId));if(found){setEditingTask(found);setModalOpen(true);}return prev;});}
            },800);
        };
        window.addEventListener("clickup:navigate",handler);
        return()=>window.removeEventListener("clickup:navigate",handler);
    },[loadBoard]);

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
            } else {
                const updatedSubtareas = (Array.isArray(task.subtareas) ? task.subtareas : []).map((s, i) =>
                    i === subIdx ? { ...s, start_date: newStart, due_date: newEnd } : s
                );
                const payload = {
                    lista: Number(task.list_id), titulo: task.title, prioridad: task.priority,
                    inicio: task.start_date ? `${String(task.start_date).slice(0,10)}T00:00:00Z` : null,
                    vence: task.due_date    ? `${String(task.due_date).slice(0,10)}T00:00:00Z`   : null,
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
            }
        } catch(e) {
            console.error("Error al actualizar fechas desde timeline:", e);
            await loadBoard();
        }
    }, [tasks, teamId, loadBoard]);

    const filtered = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return tasks.filter(t => {
            const matchQ  = !qn||(t.title||"").toLowerCase().includes(qn)||(t.descripcion_problema||"").toLowerCase().includes(qn)||(t.causa||"").toLowerCase().includes(qn)||(t.desarrollo_estrategia||"").toLowerCase().includes(qn);
            const matchS  = filterStatus==="Todos"||t.list_name===filterStatus;
            const matchMy = !showMyTasksOnly||!currentUser||(t.assigned&&t.assigned.some(a=>Number(a.user_id)===Number(currentUser.id)||Number(a.id)===Number(currentUser.id)));
            return matchQ&&matchS&&matchMy;
        });
    },[tasks,q,filterStatus,showMyTasksOnly,currentUser]);

    const statCounts = useMemo(() => {
        const out={};
        for(const col of STATUS_COLS) out[col]=filtered.filter(t=>t.list_name===col).length;
        return out;
    },[filtered]);

    function openCreate(listIdDefault=null){setEditingTask(listIdDefault?{list:listIdDefault,id:null}:null);setModalOpen(true);}
    function openEdit(task){setEditingTask(task);setModalOpen(true);}
    function handleDeleteTask(task){setConfirmDeleteTask(task);}

    async function confirmTaskDelete(){
        if(!confirmDeleteTask)return;setDeletingTask(true);
        try{await apiClickup.deleteTask(Number(teamId),Number(confirmDeleteTask.id));setConfirmDeleteTask(null);await loadBoard();}
        catch(e){alert(e.message);}finally{setDeletingTask(false);}
    }

    async function deleteCurrentProject(){
        if(!projectId||!teamId)return;setDeletingProject(true);
        try{
            await apiClickup.deleteProject(teamId,projectId);
            setConfirmDeleteProject(false);
            const data=await apiClickup.listProjects(teamId);
            const arr=Array.isArray(data)?data:[];
            setProjects(arr);
            const next=arr[0]?Number(arr[0].id):null;
            setProjectId(next);
            if(next)localStorage.setItem("clickup_project_id",String(next));
            else localStorage.removeItem("clickup_project_id");
        }catch(e){alert(e.message||"Error al eliminar proyecto");}
        finally{setDeletingProject(false);}
    }

    const viewTabs=[{id:"kanban",label:"Kanban",Icon:LayoutGrid},{id:"tabla",label:"Tabla",Icon:Table2},{id:"timeline",label:"Línea de tiempo",Icon:GitBranch}];
    const currentProject=projects.find(p=>Number(p.id)===Number(projectId));

    return(
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-[#131E5C]"/><h2 className="text-lg font-extrabold text-[#131E5C]">Time For Action</h2></div>
                    <p className="mt-0.5 text-xs text-black/50">Planes de acción y seguimiento</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={()=>setTeamsModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#131E5C] bg-white px-4 py-2 text-sm font-extrabold text-[#131E5C] hover:bg-slate-50"><UsersRound className="h-4 w-4"/>Equipos</button>
                    <button onClick={()=>openCreate()} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm" style={{backgroundColor:BRAND_BLUE}}><Plus className="h-4 w-4"/>Nuevo plan</button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 rounded-xl border border-black/10 bg-white p-3">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-extrabold text-black/50 shrink-0">Equipo</label>
                    <select value={teamId||""} onChange={e=>{
                        const newTeamId=Number(e.target.value);
                        setTeamId(newTeamId);
                        setProjectId(null);
                        localStorage.setItem("clickup_team_id",String(newTeamId));
                        localStorage.removeItem("clickup_project_id");
                        apiClickup.listProjects(newTeamId).then(data=>{
                            const arr=Array.isArray(data)?data:[];
                            setProjects(arr);
                            if(arr[0]){setProjectId(Number(arr[0].id));localStorage.setItem("clickup_project_id",String(arr[0].id));}
                        }).catch(console.error);
                    }} className="rounded-xl border border-black/10 bg-slate-50 px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]">
                        {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-extrabold text-black/50 shrink-0">Proyecto</label>
                    {editingProject ? (
                        <div className="flex items-center gap-1.5">
                            <input value={projectName} onChange={e=>setProjectName(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]" placeholder="Nombre del proyecto"/>
                            <button onClick={async()=>{if(!projectName.trim()||!projectId||!teamId)return;try{await apiClickup.updateProject(teamId,projectId,{name:projectName.trim(),description:""});const data=await apiClickup.listProjects(teamId);setProjects(Array.isArray(data)?data:[]);setEditingProject(false);}catch(e){alert(e.message||"Error");}}} className="rounded-xl bg-[#131E5C] px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-90">Guardar</button>
                            <button onClick={()=>setEditingProject(false)} className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-black/60 hover:bg-slate-50">Cancelar</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <select value={projectId||""} onChange={e=>{setProjectId(Number(e.target.value));localStorage.setItem("clickup_project_id",e.target.value);}} className="rounded-xl border border-black/10 bg-slate-50 px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]">
                                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button onClick={()=>{const cur=projects.find(p=>p.id===projectId);setProjectName(cur?.name||"");setEditingProject(true);}} className="rounded-xl border border-black/10 bg-white p-1.5 text-black/50 hover:bg-slate-100" title="Renombrar proyecto"><Pencil className="h-3.5 w-3.5"/></button>
                            {projectId&&<button onClick={()=>setConfirmDeleteProject(true)} className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100" title="Eliminar proyecto"><Trash2 className="h-3.5 w-3.5"/></button>}
                        </div>
                    )}
                    <button onClick={()=>setProjectModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#131E5C] bg-white px-3 py-1.5 text-xs font-extrabold text-[#131E5C] hover:bg-slate-50"><Plus className="h-3.5 w-3.5"/>Nuevo proyecto</button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {STATUS_COLS.map(col=>{const c=STATUS_COLORS[col];const active=filterStatus===col;return(
                    <button key={col} onClick={()=>setFilterStatus(f=>f===col?"Todos":col)} className={cls("rounded-xl border p-3 text-left transition",active?"border-[#131E5C] bg-[#131E5C]/5 ring-1 ring-[#131E5C]/20":"border-black/10 bg-white hover:bg-slate-50")}>
                        <div className={cls("text-2xl font-black",c.text)}>{statCounts[col]||0}</div>
                        <div className="flex items-center gap-1.5 mt-0.5"><span className={cls("h-2 w-2 rounded-full",c.dot)}/><span className="text-xs font-semibold text-black/50">{col}</span></div>
                    </button>
                );})}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40"/>
                    <input value={q} onChange={e=>setQ(e.target.value)} className="w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#131E5C]" placeholder="Buscar planes..."/>
                </div>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]">
                    <option value="Todos">Todos los estados</option>
                    {STATUS_COLS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={()=>setShowMyTasksOnly(!showMyTasksOnly)} className={cls("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold transition",showMyTasksOnly?"bg-[#131E5C] text-white":"border border-[#131E5C] text-[#131E5C] hover:bg-slate-50")}>
                    <UsersRound className="h-3.5 w-3.5"/>Mis tareas
                </button>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#131E5C]/20 bg-white">
                    {viewTabs.map(({id,label,Icon})=>(
                        <button key={id} onClick={()=>setView(id)} className={cls("inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold transition",view===id?"bg-[#131E5C] text-white":"text-[#131E5C] hover:bg-slate-50")}>
                            <Icon className="h-3.5 w-3.5"/><span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {view==="kanban"&&<KanbanView tasks={filtered} lists={lists} onEdit={openEdit} onDelete={handleDeleteTask} onCreateInCol={listId=>openCreate(listId)} loading={loading}/>}
            {view==="tabla"&&<TablaView tasks={filtered} onEdit={openEdit} onDelete={handleDeleteTask} loading={loading}/>}
            {view==="timeline"&&<TimelineView tasks={filtered} onEdit={openEdit} onDelete={handleDeleteTask} onUpdateDates={handleUpdateDates} loading={loading}
                teams={teams} projects={projects} teamId={teamId} projectId={projectId} currentUser={currentUser} allTasks={tasks}/>}

            <TaskModal open={modalOpen} onClose={()=>setModalOpen(false)} task={editingTask} lists={lists} teamId={teamId} onSaved={loadBoard}/>
            <TeamsModal open={teamsModalOpen} onClose={()=>setTeamsModalOpen(false)} onCreated={async()=>{
                await fetchTeams();
                if(teamId){const data=await apiClickup.listProjects(teamId);const arr=Array.isArray(data)?data:[];setProjects(arr);if(!projectId&&arr[0])setProjectId(Number(arr[0].id));}
                await loadBoard();
            }}/>
            <ConfirmDialog open={!!confirmDeleteTask} title="Eliminar plan de acción" message={`¿Seguro que deseas eliminar "${confirmDeleteTask?.title}"? Esta acción no se puede deshacer.`} onConfirm={confirmTaskDelete} onCancel={()=>setConfirmDeleteTask(null)} loading={deletingTask}/>
            <ConfirmDialog open={confirmDeleteProject} title="Eliminar proyecto" message={`¿Seguro que deseas eliminar "${currentProject?.name}"? Se eliminarán todos sus planes.`} onConfirm={deleteCurrentProject} onCancel={()=>setConfirmDeleteProject(false)} loading={deletingProject}/>

            {projectModalOpen&&(
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setProjectModalOpen(false)}/>
                    <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4" style={{background:`linear-gradient(135deg,${BRAND_BLUE} 0%,#1e3282 100%)`}}>
                            <h3 className="text-sm font-black text-white">Nuevo Proyecto</h3>
                            <button onClick={()=>setProjectModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10"><X className="h-4 w-4"/></button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div><label className="text-xs font-extrabold text-black/60">Nombre *</label><input value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]" placeholder="Ej. Plan Q2 2026"/></div>
                            <button disabled={!newProjectName.trim()} onClick={async()=>{if(!newProjectName.trim()||!teamId)return;try{const created=await apiClickup.createProject(teamId,{name:newProjectName.trim(),description:""});await apiClickup.bootstrapProject(teamId,created.id);const data=await apiClickup.listProjects(teamId);setProjects(Array.isArray(data)?data:[]);setProjectId(created.id);localStorage.setItem("clickup_project_id",String(created.id));setNewProjectName("");setProjectModalOpen(false);}catch(e){alert(e.message||"Error al crear proyecto");}}}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50" style={{backgroundColor:BRAND_BLUE}}>
                                <Plus className="h-4 w-4"/>Crear proyecto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}