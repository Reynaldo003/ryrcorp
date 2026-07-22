// src/components/Topbar.jsx
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    DoorOpen,
    Package,
    Wrench,
    Repeat,
    ShieldCheck
} from "lucide-react";

import vwDark from "../../assets/vw_dark.png";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

function VWLogo({ logoSrc }) {
    if (!logoSrc) return null;

    return (
        <img
            src={logoSrc}
            alt="Volkswagen"
            className="h-16 w-16 object-contain md:h-20 md:w-20"
            loading="lazy"
        />
    );
}

export default function Topbar({
    section = "PostVenta",
    logoSrc = vwDark,
}) {
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const tabs = useMemo(() => {
        const items = [
            {
                label: "Pedidos de Piezas",
                href: "/postventa/pedidos_piezas",
                icon: Package,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD",]),
            },
            {
                label: "Hoja de Ingresos",
                href: "/postventa/hoja_ingresos",
                icon: DoorOpen,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD", "CRM_CALL_CENTER",]),
            },
            {
                label: "Panel Taller",
                href: "/postventa/taller",
                icon: Wrench,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD",]),
            },
            {
                label: "Retención",
                href: "/postventa/retencion",
                icon: Repeat,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD",]),
            },
            {
                label: "Safety Culture",
                href: "/postventa/safety",
                icon: ShieldCheck,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD",]),
            },
        ];

        return items.filter((item) => item.show);
    }, [hasAnyPermission]);

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header
            className="sticky top-0 z-40 w-full border-b bg-white"
            style={{ borderColor: `${BRAND_BLUE}22` }}
        >
            <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                {/* Logo + sección */}
                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                    <VWLogo logoSrc={logoSrc} />

                    <div
                        className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                        style={{ color: BRAND_BLUE }}
                    >
                        {section}
                    </div>
                </div>

                {/* Línea azul después del logo/título */}
                <div
                    className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                    style={{ background: BRAND_BLUE }}
                />

                {/* Botones del módulo */}
                <nav className="ml-auto flex max-w-full items-center gap-2 overflow-x-auto py-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActive(tab.href);

                        return (
                            <Link
                                key={tab.href}
                                to={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={[
                                    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition",
                                    active
                                        ? "text-white"
                                        : "bg-white hover:text-white",
                                ].join(" ")}
                                style={{
                                    borderColor: BRAND_BLUE,
                                    backgroundColor: active ? BRAND_BLUE : "#FFFFFF",
                                    color: active ? "#FFFFFF" : BRAND_BLUE,
                                }}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}