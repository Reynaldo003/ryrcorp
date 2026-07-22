// src/components/Sidebar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
    BadgeCheck,
    HandCoins,
    Zap,
    Settings2,
    Menu,
    X,
    ChevronsLeft,
    ChevronsRight,
    LayoutDashboard,
    Mailbox,
    CirclePower,
    UserCircle2,
    Car,
    TrendingUp,
    ClipboardCheck,
    QrCode,
    UserSearch,
    BrainCircuit,
    Bug,
    Lightbulb,
    Send,
    Sparkles,
    LayoutList,
    Workflow,
} from "lucide-react";
import vwWhite from "../assets/vw_white.png";
import ryr from "../assets/ryr.png";
import { useAuth } from "../auth/AuthContext";
import ClickupNotificationsBell from "./ClickupNotificationsBell";
import { apiClickup } from "../lib/apiClickup";

function cls(...items) {
    return items.filter(Boolean).join(" ");
}

const VW = {
    ink: "#06122E",
    navy: "#001E50",
    navy2: "#003B78",
    blue: "#0A64FF",
    cyan: "#00B0F0",
    surface: "#061A43",
    line: "rgba(255,255,255,0.12)",
};

function FadeSlide({ show, children, className = "" }) {
    return (
        <span
            className={cls(
                "inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ease-out",
                show ? "max-w-[260px] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0",
                className
            )}
            aria-hidden={!show}
        >
            {children}
        </span>
    );
}

function IconButton({ onClick, title, className = "", children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className={cls(
                "inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition active:scale-[0.98]",
                className
            )}
        >
            {children}
        </button>
    );
}

function VWMonogram({ compact = false }) {
    return (
        <div className="flex items-center justify-between gap-3 sm:justify-end">
            <img src={vwWhite} alt="VW" className="mt-5 h-12 w-12 opacity-95" loading="lazy" />
        </div>
    );
}

function BrandBlock({ showText, user, collapsed, isMobile }) {
    return (
        <NavLink to="/" className={cls("flex min-w-0 items-center", showText ? "gap-3" : "justify-center")}>
            <div
                className={cls(
                    "grid shrink-0 place-items-center overflow-hidden rounded-2xl border",
                    collapsed && !isMobile ? "h-10 w-10" : "h-11 w-11"
                )}
                style={{ background: "rgba(255,255,255,0.08)", borderColor: VW.line }}
            >
                <img src={ryr} alt="R&R" className="h-full w-full object-contain" />
            </div>

            <FadeSlide show={showText} className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-bold text-white">Grupo Automotriz R&amp;R</span>
                    <VWMonogram compact />
                </div>
                <div className="truncate text-[11px] font-semibold text-white/52">
                    {user?.agencia ? user.agencia : "VW Córdoba"}
                </div>
            </FadeSlide>
        </NavLink>
    );
}

export default function Sidebar() {
    const { user, hasAnyPermission, logout } = useAuth();
    const canSeeSettings = hasAnyPermission(["USUARIOS_ADMIN"]);

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileMounted, setMobileMounted] = useState(false);

    const [openBugModal, setOpenBugModal] = useState(false);
    const [tipoReporte, setTipoReporte] = useState("BUG");
    const [titulo, setTitulo] = useState("");
    const [descripcionBug, setDescripcionBug] = useState("");
    const [imagenes, setImagenes] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (mobileOpen) setMobileMounted(true);
    }, [mobileOpen]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
                setMobileMounted(false);
            }
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (!mobileOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mobileOpen]);



    useEffect(() => {
        const updateSidebarWidth = () => {
            const width = window.innerWidth < 768 ? 0 : collapsed ? 72 : 288;
            document.documentElement.style.setProperty("--sidebar-w", `${width}px`);
        };
        updateSidebarWidth();
    }, [collapsed]);

    useEffect(() => {
        const updateSidebarWidth = () => {
            const width = window.innerWidth < 768 ? 0 : collapsed ? 72 : 288;
            document.documentElement.style.setProperty("--sidebar-w", `${width}px`);
        };
        window.addEventListener("resize", updateSidebarWidth);
        return () => window.removeEventListener("resize", updateSidebarWidth);
    }, [collapsed]);

    const resetBugForm = () => {
        setTipoReporte("BUG");
        setTitulo("");
        setDescripcionBug("");
        setImagenes([]);
    };

    const handleSubmitBug = async (event) => {
        event.preventDefault();
        if (!titulo.trim() || !descripcionBug.trim()) return;

        setSaving(true);
        try {
            await apiClickup.createReport({
                tipo: tipoReporte,
                titulo: titulo.trim(),
                descripcion: descripcionBug.trim(),
                imagenes,
            });

            resetBugForm();
            setOpenBugModal(false);
            window.dispatchEvent(new Event("clickup:refresh"));
            alert("Reporte enviado correctamente. Se creó una tarea en ClickUp.");
        } catch (error) {
            alert(error.message || "No se pudo enviar el reporte.");
        } finally {
            setSaving(false);
        }
    };

    const links = useMemo(() => {
        const items = [
            { section: "Comercial", to: "/", label: "Inicio", icon: LayoutDashboard, show: true },
            {
                section: "Comercial",
                to: "/calidad",
                label: "Gestión de Calidad",
                icon: BadgeCheck,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },
            {
                section: "Comercial",
                to: "/comercial",
                label: "Gestión Comercial",
                icon: HandCoins,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_CALL_CENTER", "CRM_COORDINADOR_DIGITAL"]),
            },
            {
                section: "Comercial",
                to: "/postventa",
                label: "Postventa",
                icon: ClipboardCheck,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD", "CRM_CALL_CENTER"]),
            },
            {
                section: "Comercial",
                to: "/inventario",
                label: "Inventario",
                icon: LayoutList,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"]),
            },
            {
                section: "Comercial",
                to: "/usados",
                label: "Autos Usados",
                icon: Car,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_VENTAS", "CRM_DIGITALES", "CRM_CALIDAD"]),
            },
            {
                section: "Marketing",
                to: "/encuesta_whats",
                label: "Envío Encuestas",
                icon: Send,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
            {
                section: "Financiero",
                to: "/financieros",
                label: "Servicios Financieros",
                icon: TrendingUp,
                show: hasAnyPermission(["CRM_FINANCIEROS", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"]),
            },
            {
                section: "Herramientas",
                to: "/configuracion_ia",
                label: "Panel de Inteligencias Artificiales",
                icon: BrainCircuit,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_DIGITALES", "CRM_COORDINADOR_DIGITAL"]),
            },
            {
                section: "Herramientas",
                to: "/timeforaction",
                label: "TimeForAction",
                icon: Zap,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },
            {
                section: "Herramientas",
                to: "/flujo_procesos",
                label: "Flows",
                icon: Workflow,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },
            {
                section: "Administrativos",
                to: "/administrativos",
                label: "Reclutamiento y Seleccion",
                icon: UserSearch,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"]),
            },
            { section: "Configuración", to: "/qr", label: "QR", icon: QrCode, show: hasAnyPermission(["USUARIOS_ADMIN"]) },
            { section: "Configuración", to: "/configuracion", label: "Configuración", icon: Settings2, show: hasAnyPermission(["USUARIOS_ADMIN"]) },
        ];

        return items.filter((item) => item.show);
    }, [hasAnyPermission]);

    const sections = useMemo(() => {
        const order = ["Comercial", "Marketing", "Financiero", "Herramientas", "Administrativos", "Configuración"];
        return order
            .map((section) => ({ section, items: links.filter((item) => item.section === section) }))
            .filter((group) => group.items.length > 0);
    }, [links]);

    const NavItem = ({ item, showText, isMobile }) => (
        <NavLink
            to={item.to}
            title={!showText && !isMobile ? item.label : undefined}
            onClick={() => {
                if (isMobile) setMobileOpen(false);
            }}
            className={({ isActive }) =>
                cls(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all hover:text-[15px]",
                    !showText && !isMobile && "justify-center px-0",

                    isActive
                        ? cls(
                            "bg-[#0A64FF] text-white pl-6 shadow-[0_12px_32px_rgba(10,100,255,0.32)]",
                            showText || isMobile ? "pl-6" : "px-0",
                            "before:absolute before:left-0 before:top-1/2 before:h-7 before:w-1",
                            "before:-translate-y-1/2 before:rounded-r-full before:bg-white"
                        )
                        : "text-white/66 hover:bg-white/10 hover:text-white hover:pl-5"
                )
            }
        >
            <item.icon size={18} className="shrink-0" />
            <FadeSlide show={showText}>{item.label}</FadeSlide>
        </NavLink>
    );

    const SidebarContent = ({ isMobile = false }) => {
        const showText = isMobile ? true : !collapsed;

        return (
            <div
                className="relative flex h-full flex-col overflow-hidden"
                style={{
                    background: `radial-gradient(circle at 20% 0%, rgba(0,176,240,0.18), transparent 26%), linear-gradient(180deg, ${VW.ink} 0%, ${VW.navy} 48%, #00143A 100%)`,
                }}
            >
                <div className="pointer-events-none absolute -right-20 top-24 h-56 w-56 rounded-full bg-[#0A64FF]/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-10 left-8 h-44 w-44 rounded-full bg-[#00B0F0]/10 blur-3xl" />

                <div className={cls("relative border-b px-4 py-4", !showText && !isMobile && "px-2")} style={{ borderColor: VW.line }}>
                    <div className={cls("flex items-center", showText ? "justify-between" : "justify-center")}>
                        <BrandBlock showText={showText} user={user} collapsed={collapsed} isMobile={isMobile} />
                    </div>
                </div>

                <nav className="relative flex-1 overflow-y-auto
                    [&::-webkit-scrollbar]:w-2 
            [&::-webkit-scrollbar-track]:bg-blue-900 
            [&::-webkit-scrollbar-thumb]:bg-gray-400 
            [&::-webkit-scrollbar-thumb]:rounded-full px-4 py-4">
                    {sections.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-xs text-white/70">
                            Tu cuenta no tiene módulos asignados.
                        </div>
                    ) : null}

                    <div className="space-y-5">
                        {sections.map((group) => (
                            <div key={group.section}>
                                <FadeSlide show={showText}>
                                    <div className="mb-2 px-2 text-[12px] font-medium uppercase tracking-[0.22em] text-white/80">
                                        {group.section}
                                    </div>
                                </FadeSlide>
                                <div className="space-y-1.5">
                                    {group.items.map((item) => (
                                        <NavItem key={`${item.section}-${item.to}`} item={item} showText={showText} isMobile={isMobile} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                <div className={cls("relative mt-auto border-t px-4 py-3", !showText && !isMobile && "px-2")} style={{ borderColor: VW.line }}>
                    <div className={cls("flex flex-col gap-1.5", !showText && !isMobile && "items-center")}>
                        <div className={cls("flex items-center rounded-2xl", showText ? "gap-3 px-3 py-2" : "justify-center py-2")}>
                            <ClickupNotificationsBell />
                            <FadeSlide show={showText} className="text-[13px] font-semibold text-white/70">
                                Notificaciones
                            </FadeSlide>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setOpenBugModal(true);
                                if (isMobile) setMobileOpen(false);
                            }}
                            className={cls(
                                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-white/66 transition hover:bg-white/10 hover:text-white",
                                !showText && !isMobile && "justify-center px-0"
                            )}
                            title="Sugerencias y errores"
                        >
                            <Mailbox size={18} className="shrink-0" />
                            <FadeSlide show={showText}>Sugerencias y errores</FadeSlide>
                        </button>

                        {/* Admins → Usuarios, usuarios normales → Mi perfil */}
                        <NavLink
                            to="/configuracion"
                            onClick={() => { if (isMobile) setMobileOpen(false); }}
                            className={({ isActive }) =>
                                cls(
                                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition",
                                    !showText && !isMobile && "justify-center px-0",
                                    isActive ? "bg-white text-[#001E50]" : "text-white/66 hover:bg-white/10 hover:text-white"
                                )
                            }
                            title={canSeeSettings ? "Usuarios" : "Mi perfil"}
                        >
                            <UserCircle2 size={18} className="shrink-0" />
                            <FadeSlide show={showText}>
                                {canSeeSettings ? "Usuarios" : "Mi perfil"}
                            </FadeSlide>
                        </NavLink>

                        <button
                            type="button"
                            onClick={logout}
                            className={cls(
                                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-red-200 transition hover:bg-red-500 hover:text-white",
                                !showText && !isMobile && "justify-center px-0"
                            )}
                            title="Cerrar sesión"
                        >
                            <CirclePower size={18} className="shrink-0" />
                            <FadeSlide show={showText}>Cerrar sesión</FadeSlide>
                        </button>
                    </div>
                </div>
            </div >
        );
    };

    return (
        <>
            <div className="sticky top-0 z-40 border-b border-[#DDE5EF] bg-white/95 backdrop-blur md:hidden">
                <div className="flex items-center justify-between px-3 py-3">
                    <IconButton onClick={() => setMobileOpen(true)} title="Abrir menú" className="border-[#DDE5EF] bg-white text-[#001E50] hover:bg-[#F4F7FB]">
                        <Menu size={18} />
                    </IconButton>

                    <NavLink to="/" className="flex items-center gap-2">
                        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#001E50]">
                            <img src={ryr} alt="R&R" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-sm font-bold text-[#001E50]">R&amp;R · VW</div>
                    </NavLink>

                    <ClickupNotificationsBell />
                </div>
            </div>

            <aside
                className={cls(
                    "sticky top-0 z-[200] hidden h-screen shrink-0 overflow-visible border-r border-slate-200 bg-white md:block",
                    "transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
                    collapsed ? "w-18" : "w-72"
                )}
            >
                <button
                    type="button"
                    onClick={() => setCollapsed((value) => !value)}
                    title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                    aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                    className="absolute right-0 top-[86px] z-[999] inline-flex h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border-black-300 bg-white text-[#001E50] shadow-md transition hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                >
                    {collapsed ? (
                        <ChevronsRight size={17} strokeWidth={2.8} />
                    ) : (
                        <ChevronsLeft size={17} strokeWidth={2.8} />
                    )}
                </button>

                <SidebarContent />
            </aside>

            {mobileMounted ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        className={cls("absolute inset-0 bg-black/50 transition-opacity duration-200", mobileOpen ? "opacity-100" : "opacity-0")}
                        onClick={() => setMobileOpen(false)}
                        aria-label="Cerrar menú"
                    />

                    <div
                        className={cls(
                            "absolute left-0 top-0 h-full w-[86%] max-w-[330px] shadow-2xl transition-transform duration-250 ease-[cubic-bezier(.2,.8,.2,1)]",
                            mobileOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                        onTransitionEnd={() => {
                            if (!mobileOpen) setMobileMounted(false);
                        }}
                    >
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between border-b border-white/10 bg-[#06122E] px-4 py-3 text-white">
                                <div className="text-sm font-bold">Menú CRM</div>
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-xl border border-white/10 bg-white/10 p-2 text-white/80 hover:text-white"
                                    aria-label="Cerrar"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <SidebarContent isMobile />
                        </div>
                    </div>
                </div>
            ) : null}

            {openBugModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000B24]/60 p-4 backdrop-blur-sm" onClick={() => setOpenBugModal(false)}>
                    <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
                        <div className="flex items-center justify-between px-5 py-4" style={{ background: `linear-gradient(135deg, ${VW.ink}, ${VW.navy})` }}>
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Centro de mejora</div>
                                <h2 className="mt-1 text-lg font-semibold text-white">Reportar error o sugerencia</h2>
                            </div>
                            <button onClick={() => setOpenBugModal(false)} className="rounded-xl bg-white/10 p-2 text-white/75 hover:text-white" aria-label="Cerrar">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitBug} className="space-y-4 p-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("BUG")}
                                        className={cls(
                                            "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition",
                                            tipoReporte === "BUG" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <Bug size={16} /> Error
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("SUGGESTION")}
                                        className={cls(
                                            "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition",
                                            tipoReporte === "SUGGESTION" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <Lightbulb size={16} /> Sugerencia
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Título</label>
                                <input
                                    value={titulo}
                                    onChange={(event) => setTitulo(event.target.value)}
                                    placeholder="Ej: El modal de clientes no guarda"
                                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Descripción</label>
                                <textarea
                                    value={descripcionBug}
                                    onChange={(event) => setDescripcionBug(event.target.value)}
                                    rows={5}
                                    placeholder="Describe el problema, pasos para reproducirlo y resultado esperado."
                                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Evidencias iniciales</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt,.mp4"
                                    multiple
                                    onChange={(event) => setImagenes(Array.from(event.target.files || []))}
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-slate-200"
                                />
                                {imagenes.length > 0 ? <p className="mt-2 text-xs text-slate-500">{imagenes.length} archivo(s) seleccionado(s)</p> : null}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setOpenBugModal(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving || !titulo.trim() || !descripcionBug.trim()} className="rounded-2xl bg-[#001E50] px-4 py-2 text-sm font-bold text-white hover:bg-[#003B78] disabled:opacity-60">
                                    {saving ? "Enviando..." : "Enviar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
