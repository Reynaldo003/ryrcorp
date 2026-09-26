// src/components/Sidebar.jsx

import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Menu,
    X,
    ChevronsLeft,
    ChevronsRight,
    Mailbox,
    CirclePower,
    Settings,
    Bug,
    Lightbulb,
    Sparkles,
} from "lucide-react";

import vwWhite from "../assets/vw_white.png";
import ryr from "../assets/ryr.png";

import { useAuth } from "../auth/AuthContext";
import WhatsappNotificationsBell from "./WhatsappNotificationsBell";
import { apiClickup } from "../lib/apiClickup";
import { INTERFACES, SECTION_ORDER, interfazVisible } from "../config/interfaces";

function cls(...items) {
    return items.filter(Boolean).join(" ");
}

function obtenerNombreUsuario(user) {
    const nombreCompleto = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();

    return (
        user?.nombre_completo ||
        nombreCompleto ||
        user?.nombre ||
        user?.username ||
        user?.email ||
        "Usuario"
    );
}

function obtenerRolUsuario(user, esAdministrador) {
    if (typeof user?.rol === "object" && user?.rol?.nombre) return user.rol.nombre;
    if (typeof user?.role === "object" && user?.role?.nombre) return user.role.nombre;
    if (typeof user?.rol === "string") return user.rol;
    if (typeof user?.role === "string") return user.role;
    if (user?.tipo_usuario) return user.tipo_usuario;
    if (user?.grupo) return user.grupo;

    return esAdministrador ? "Administrador" : "Usuario CRM";
}

function obtenerIniciales(nombre) {
    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0]?.toUpperCase())
        .join("");
}

function FadeText({ show, children, className = "" }) {
    return (
        <span
            className={cls(
                "min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                show ? "max-w-[230px] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0",
                className
            )}
        >
            {children}
        </span>
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

    const nombreUsuario = obtenerNombreUsuario(user);
    const rolUsuario = obtenerRolUsuario(user, canSeeSettings);
    const iniciales = obtenerIniciales(nombreUsuario);
    const agenciaUsuario = user?.agencia || user?.dealer || user?.sucursal || "Agencia no asignada";

    useEffect(() => {
        if (mobileOpen) setMobileMounted(true);
    }, [mobileOpen]);

    useEffect(() => {
        const actualizar = () => {
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
                setMobileMounted(false);
            }

            const width = window.innerWidth < 768 ? 0 : collapsed ? 76 : 300;
            document.documentElement.style.setProperty("--sidebar-w", `${width}px`);
        };

        actualizar();
        window.addEventListener("resize", actualizar);

        return () => window.removeEventListener("resize", actualizar);
    }, [collapsed]);

    useEffect(() => {
        if (!mobileOpen) return;

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = overflowAnterior;
        };
    }, [mobileOpen]);

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
        const interfacesUsuario = Array.isArray(user?.interfaces) ? user.interfaces : null;

        return INTERFACES
            .filter((item) =>
                interfazVisible(
                    item,
                    user?.permisos || [],
                    interfacesUsuario
                )
            )
            .map((item) => ({
                section: item.section,
                to: item.to,
                label: item.label,
                icon: item.icon,
            }));
    }, [user]);

    /*
     * SECTION_ORDER controla los títulos y el orden.
     *
     * Ejemplo:
     * ["General", "Comercial", "Postventa", "Administración"]
     */
    const sections = useMemo(() => {
        return SECTION_ORDER
            .map((section) => ({
                section,
                items: links.filter((item) => item.section === section),
            }))
            .filter((group) => group.items.length > 0);
    }, [links]);

    const NavItem = ({ item, showText, isMobile = false }) => {
        const Icon = item.icon;

        return (
            <NavLink
                to={item.to}
                title={!showText && !isMobile ? item.label : undefined}
                onClick={() => {
                    if (isMobile) setMobileOpen(false);
                }}
                className={({ isActive }) =>
                    cls(
                        "group relative flex h-12 items-center overflow-hidden rounded-xl transition-all duration-300",
                        showText || isMobile ? "gap-2.5 px-2.5" : "justify-center px-1",
                        isActive
                            ? "bg-gradient-to-r from-[#263578] via-[#223278] to-[#1C2B6D] hover:font-bold text-white shadow-lg shadow-black/10"
                            : "text-white/60 hover:bg-white/[0.07] font-bold hover:text-white"
                    )
                }
            >
                {({ isActive }) => (
                    <>
                        {isActive && (
                            <>
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#00B0F0]/10 via-transparent to-[#1474E6]/10" />
                                <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[#00B0F0] shadow-[0_0_12px_#00B0F0]" />
                            </>
                        )}

                        <div
                            className={cls(
                                "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-white group-hover:bg-white/[0.08] group-hover:text-[#78DFFF] group-hover:scale-110 group-hover:-rotate-3"
                            )}
                        >
                            <Icon
                                size={isActive ? 21 : 18}
                                strokeWidth={isActive ? 2.2 : 1.9}
                                className="transition-all duration-300 group-hover:scale-110"
                            />

                            {isActive && (
                                <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-[#00B0F0] shadow-[0_0_7px_#00B0F0]" />
                            )}
                        </div>

                        <FadeText show={showText || isMobile} className="relative z-10 flex-1 truncate text-[13px]">
                            <span className={isActive ? "font-semibold" : "font-medium"}>
                                {item.label}
                            </span>
                        </FadeText>

                        {(showText || isMobile) && isActive && (
                            <div className="relative z-10">
                                <span className="absolute h-3 w-3 -translate-x-[3px] -translate-y-[3px] animate-ping rounded-full bg-[#00B0F0]/30" />
                                <span className="block h-1.5 w-1.5 rounded-full bg-[#79E4FF] shadow-[0_0_8px_#79E4FF]" />
                            </div>
                        )}

                        {!isActive && (
                            <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#00B0F0]/60 to-transparent transition-all duration-300 group-hover:w-[70%]" />
                        )}
                    </>
                )}
            </NavLink>
        );
    };

    const BrandHeader = ({ showText }) => (
        <div className={cls("border-b border-white/[0.08]", showText ? "px-4 py-4" : "px-2 py-4")}>
            <NavLink
                to="/"
                className={cls("group flex items-center", showText ? "gap-3" : "justify-center")}
            >
                <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:border-[#00B0F0]/40">
                    <img
                        src={ryr}
                        alt="R&R"
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                </div>

                <FadeText show={showText} className="flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="truncate text-[13px] font-bold text-white">
                                Grupo Automotriz R&R
                            </div>

                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00B0F0] shadow-[0_0_6px_#00B0F0]" />

                                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#83E4FF]/75">
                                    {agenciaUsuario}
                                </span>
                            </div>
                        </div>

                        <img
                            src={vwWhite}
                            alt="Volkswagen"
                            className="h-8 w-8 shrink-0 object-contain opacity-85 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:opacity-100"
                        />
                    </div>
                </FadeText>
            </NavLink>
        </div>
    );

    const UserCard = ({ showText }) => {
        if (!showText) {
            return (
                <div className="px-2 py-3">
                    <NavLink
                        to="/configuracion"
                        title={`${nombreUsuario} · ${rolUsuario}`}
                        className="relative mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[11px] font-bold text-[#8BE7FF] transition-all duration-300 hover:scale-110 hover:border-[#00B0F0]/40 hover:bg-white/10"
                    >
                        {iniciales}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#131E5C] bg-[#00B0F0] shadow-[0_0_8px_#00B0F0]" />
                    </NavLink>
                </div>
            );
        }

        return (
            <div className="px-3 py-3">
                <NavLink
                    to="/configuracion"
                    className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] px-3 py-2.5 transition-all duration-300 hover:-translate-y-px hover:border-[#00B0F0]/25 hover:bg-white/[0.075]"
                >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#304292] via-[#263578] to-[#182666] text-[11px] font-bold text-[#9CEBFF] shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
                        {iniciales}

                        <span className="absolute ml-8 mt-8 h-3 w-3 rounded-full border-2 border-[#182666] bg-[#00B0F0] shadow-[0_0_8px_#00B0F0]" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-white">
                            {nombreUsuario}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-300">
                                {rolUsuario}
                            </span>
                        </div>
                    </div>
                </NavLink>
            </div>
        );
    };

    const SidebarContent = ({ isMobile = false }) => {
        const showText = isMobile || !collapsed;

        return (
            <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#131E5C] via-[#111B54] to-[#0B123D]">
                <div className="pointer-events-none absolute -right-28 -top-24 h-64 w-64 rounded-full bg-[#00B0F0]/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-28 bottom-36 h-56 w-56 rounded-full bg-[#1474E6]/10 blur-3xl" />

                <BrandHeader showText={showText} />
                <UserCard showText={showText} />

                <nav
                    className={cls(
                        "relative flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]",
                        "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15",
                        showText ? "px-3" : "px-2"
                    )}
                >
                    {sections.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-white/60">
                            Tu cuenta no tiene módulos asignados.
                        </div>
                    )}

                    <div className="space-y-5">
                        {sections.map((group) => (
                            <div key={group.section}>
                                {showText ? (
                                    <div className="mb-2 flex items-center gap-2 px-2">
                                        <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                                            {group.section}
                                        </span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-[#00B0F0]/20 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="mx-auto mb-2 h-px w-7 bg-white/10" />
                                )}

                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavItem
                                            key={`${item.section}-${item.to}`}
                                            item={item}
                                            showText={showText}
                                            isMobile={isMobile}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>

                <div className="relative border-t border-white/[0.08] bg-black/[0.05] backdrop-blur-xl">
                    <div className={cls("space-y-1 py-2.5", showText ? "px-3" : "px-2")}>
                        <div
                            className={cls(
                                "group flex h-11 items-center rounded-xl text-[12px] font-bold text-white/55 transition-all duration-300 hover:bg-white/[0.06] hover:text-white",
                                showText ? "gap-3 px-2.5" : "justify-center"
                            )}
                        >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-white/[0.07]">
                                <WhatsappNotificationsBell />
                            </div>

                            <FadeText show={showText}>Notificaciones</FadeText>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setOpenBugModal(true);
                                if (isMobile) setMobileOpen(false);
                            }}
                            className={cls(
                                "group flex h-11 w-full items-center rounded-xl text-[12px] font-medium text-white/55 transition-all duration-300 hover:bg-white/[0.06] hover:text-white",
                                showText ? "gap-3 px-2.5" : "justify-center"
                            )}
                            title="Centro de mejora"
                        >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-white/[0.07] group-hover:text-[#78DFFF]">
                                <Mailbox size={17} />
                            </div>

                            <FadeText show={showText}>Centro de mejora</FadeText>
                        </button>

                        <NavLink
                            to="/configuracion"
                            onClick={() => {
                                if (isMobile) setMobileOpen(false);
                            }}
                            className={({ isActive }) =>
                                cls(
                                    "group flex h-11 items-center rounded-xl text-[12px] font-medium transition-all duration-300",
                                    showText ? "gap-3 px-2.5" : "justify-center",
                                    isActive
                                        ? "bg-white/[0.08] text-white"
                                        : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                                )
                            }
                        >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-90 group-hover:bg-white/[0.07] group-hover:text-[#78DFFF]">
                                <Settings size={17} />
                            </div>

                            <FadeText show={showText}>
                                {canSeeSettings ? "Administrar usuarios" : "Mi perfil"}
                            </FadeText>
                        </NavLink>

                        <button
                            type="button"
                            onClick={logout}
                            className={cls(
                                "group flex h-11 w-full items-center rounded-xl text-[12px] font-medium text-red-200/60 transition-all duration-300 hover:bg-red-500/10 hover:text-red-200",
                                showText ? "gap-3 px-2.5" : "justify-center"
                            )}
                        >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500/10">
                                <CirclePower size={17} />
                            </div>

                            <FadeText show={showText}>Cerrar sesión</FadeText>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl md:hidden">
                <div className="flex h-16 items-center justify-between px-4">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-[#131E5C] shadow-sm transition hover:scale-105 hover:bg-slate-50"
                    >
                        <Menu size={19} />
                    </button>

                    <NavLink to="/" className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#131E5C]">
                            <img src={ryr} alt="R&R" className="h-full w-full object-contain" />
                        </div>

                        <div>
                            <div className="text-[12px] font-bold text-[#131E5C]">
                                Grupo R&R
                            </div>
                            <div className="max-w-[150px] truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                {agenciaUsuario}
                            </div>
                        </div>
                    </NavLink>

                    <WhatsappNotificationsBell />
                </div>
            </div>

            <aside
                className={cls(
                    "sticky top-0 z-30 hidden h-screen shrink-0 overflow-visible border-r border-[#131E5C]/10 transition-[width] duration-300 ease-out md:block",
                    collapsed ? "w-[76px]" : "w-[300px]"
                )}
            >
                <button
                    type="button"
                    onClick={() => setCollapsed((valor) => !valor)}
                    title={collapsed ? "Expandir menú" : "Contraer menú"}
                    className="group absolute -right-[15px] top-[88px] z-50 grid h-[30px] w-[30px] place-items-center rounded-full border border-slate-200 bg-white text-[#131E5C] shadow-md transition-all duration-300 hover:scale-110 hover:border-[#00B0F0]/40 hover:text-[#1474E6]"
                >
                    {collapsed ? (
                        <ChevronsRight size={15} className="transition group-hover:translate-x-px" />
                    ) : (
                        <ChevronsLeft size={15} className="transition group-hover:-translate-x-px" />
                    )}
                </button>

                <SidebarContent />
            </aside>

            {mobileMounted && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className={cls(
                            "absolute inset-0 bg-[#080D29]/75 backdrop-blur-sm transition-opacity duration-300",
                            mobileOpen ? "opacity-100" : "opacity-0"
                        )}
                        aria-label="Cerrar menú"
                    />

                    <div
                        className={cls(
                            "absolute left-0 top-0 h-full w-[88%] max-w-[320px] shadow-2xl transition-transform duration-300 ease-out",
                            mobileOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                        onTransitionEnd={() => {
                            if (!mobileOpen) setMobileMounted(false);
                        }}
                    >
                        <div className="relative h-full">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="absolute right-3 top-3 z-50 grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-white/60 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
                            >
                                <X size={17} />
                            </button>

                            <SidebarContent isMobile />
                        </div>
                    </div>
                </div>
            )}

            {openBugModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080D29]/70 p-4 backdrop-blur-md"
                    onClick={() => setOpenBugModal(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-lg overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#131E5C] to-[#0B123D] px-6 py-5">
                            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#00B0F0]/20 blur-3xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#78DFFF]">
                                        <Sparkles size={11} />
                                        Centro de mejora
                                    </div>

                                    <h2 className="mt-1.5 text-lg font-semibold text-white">
                                        Reportar incidencia
                                    </h2>

                                    <p className="mt-1 text-xs text-white/45">
                                        Envía errores o sugerencias directamente al equipo.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOpenBugModal(false)}
                                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/60 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitBug} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                    Tipo de reporte
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("BUG")}
                                        className={cls(
                                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition",
                                            tipoReporte === "BUG"
                                                ? "border-red-200 bg-red-50 text-red-600"
                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        <Bug size={15} />
                                        Error
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("SUGGESTION")}
                                        className={cls(
                                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition",
                                            tipoReporte === "SUGGESTION"
                                                ? "border-amber-200 bg-amber-50 text-amber-600"
                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        <Lightbulb size={15} />
                                        Sugerencia
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                    Título
                                </label>

                                <input
                                    value={titulo}
                                    onChange={(event) => setTitulo(event.target.value)}
                                    placeholder="Ej. No se guardan los cambios del cliente"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1474E6] focus:bg-white focus:ring-4 focus:ring-[#1474E6]/10"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                    Descripción
                                </label>

                                <textarea
                                    value={descripcionBug}
                                    onChange={(event) => setDescripcionBug(event.target.value)}
                                    rows={5}
                                    placeholder="Describe qué ocurrió, cómo reproducirlo y qué esperabas que sucediera."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1474E6] focus:bg-white focus:ring-4 focus:ring-[#1474E6]/10"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                    Evidencias
                                </label>

                                <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt,.mp4"
                                    multiple
                                    onChange={(event) => setImagenes(Array.from(event.target.files || []))}
                                    className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-600 hover:file:bg-slate-200"
                                />

                                {imagenes.length > 0 && (
                                    <p className="mt-2 text-[11px] text-slate-400">
                                        {imagenes.length} archivo(s) seleccionado(s)
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setOpenBugModal(false)}
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving || !titulo.trim() || !descripcionBug.trim()}
                                    className="rounded-xl bg-[#131E5C] px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-px hover:bg-[#1C2C78] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? "Enviando..." : "Enviar reporte"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}