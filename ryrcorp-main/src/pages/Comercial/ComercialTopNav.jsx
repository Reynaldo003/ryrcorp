// src/pages/Comercial/ComercialTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Globe,
    CalendarDays,
    Building2,
    createLucideIcon,
    MessageCircle,
    PackageCheck,
    BarChart2,
    UsersRound,
    LayoutPanelTop,
    Car,
    ChartNoAxesColumn,
    ChartNoAxesCombined,
    KanbanSquare,
} from "lucide-react";

import vwDark from "../../assets/vw_dark.png";
import { steeringWheel } from "@lucide/lab";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

const SteeringWheelLab = createLucideIcon("SteeringWheelLab", steeringWheel);

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

export default function ComercialTopNav() {
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const inProspectos = location.pathname.startsWith("/comercial/prospectos");

    const canSeeContacto = hasAnyPermission([
        "CRM_DIGITALES",
        "USUARIOS_ADMIN",
        "CRM_CALIDAD",
        "CRM_CALL_CENTER",
        "CRM_COORDINADOR_DIGITAL",
    ]);

    const canSeeRendimiento = hasAnyPermission([
        "USUARIOS_ADMIN",
        "CRM_COORDINADOR_DIGITAL",
        "CRM_DIGITALES",
    ]);

    const tabs = useMemo(() => {
        const items = [
            {
                label: "Prospectos",
                href: "/comercial/prospectos",
                icon: Globe,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_COORDINADOR_DIGITAL"
                ]),
            },
            {
                label: "Plantillas",
                href: "/comercial/prospectos/plantillas",
                icon: LayoutPanelTop,
                show: canSeeContacto && inProspectos,
            },
            {
                label: "Contacto",
                href: "/comercial/prospectos/contacto",
                icon: MessageCircle,
                show: canSeeContacto && inProspectos,
            },
            {
                label: "Bandeja",
                href: "/comercial/prospectos/bandeja",
                icon: KanbanSquare,
                show: canSeeContacto && inProspectos,
            },
            {
                label: "Rendimiento Digital",
                href: "/comercial/prospectos/rendimiento_digitales",
                icon: ChartNoAxesCombined,
                show: canSeeRendimiento && inProspectos,
            },
            {
                label: "Citas",
                href: "/comercial/citas",
                icon: CalendarDays,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "CRM_VENTAS",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_COORDINADOR_DIGITAL",
                ]),
            },
            {
                label: "Control piso",
                href: "/comercial/control_piso",
                icon: Building2,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "CRM_VENTAS",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_COORDINADOR_DIGITAL",
                ]),
            },
            {
                label: "Tráfico piso",
                href: "/comercial/trafico_piso",
                icon: UsersRound,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "CRM_VENTAS",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_COORDINADOR_DIGITAL",
                ]),
            },
            {
                label: "Pruebas",
                href: "/comercial/pruebas_manejo",
                icon: SteeringWheelLab,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "CRM_VENTAS",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_COORDINADOR_DIGITAL",
                ]),
            },
            {
                label: "Entregas",
                href: "/comercial/entregas",
                icon: PackageCheck,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "CRM_VENTAS",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_CALL_CENTER",
                    "CRM_COORDINADOR_DIGITAL",
                ]),
            },
            {
                label: "Campañas Meta",
                href: "/comercial/campanas_meta",
                icon: BarChart2,
                show: hasAnyPermission([
                    "CRM_DIGITALES",
                    "USUARIOS_ADMIN",
                    "CRM_CALIDAD",
                    "CRM_COORDINADOR_DIGITAL",
                ]),
            },
        ];

        return items.filter((item) => item.show);
    }, [hasAnyPermission, canSeeContacto, inProspectos]);

    const isActive = (href) => {
        /**
         * Importante:
         * "/comercial/prospectos/contacto" también empieza con "/comercial/prospectos".
         * Si usamos startsWith normal, se activarían Prospectos y Contacto al mismo tiempo.
         */
        if (href === "/comercial/prospectos") {
            return location.pathname === href;
        }

        return location.pathname === href || location.pathname.startsWith(`${href}/`);
    };

    return (
        <header
            className="sticky top-0 z-40 w-full border-b bg-white"
            style={{ borderColor: `${BRAND_BLUE}22` }}
        >
            <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                {/* Logo + sección */}
                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                    <VWLogo logoSrc={vwDark} />

                    <div
                        className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                        style={{ color: BRAND_BLUE }}
                    >
                        Gestion Comercial
                    </div>
                </div>

                {/* Línea azul */}
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