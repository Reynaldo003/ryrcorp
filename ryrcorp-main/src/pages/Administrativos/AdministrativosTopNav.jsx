// src/pages/Administrativos/AdministrativosTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    CalendarCheck2,
    BriefcaseBusiness,
    UserPlus,
    HeartHandshake,
} from "lucide-react";import vwDark from "../../assets/vw_dark.png";

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

export default function AdministrativosTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            {
                label: "Reclutamiento",
                href: "reclutamiento",
                icon: CalendarCheck2,
            },
            {
                label: "Alta del Personal",
                href: "alta-personal",
                icon: UserPlus,
            },
            {
                label: "Puestos",
                href: "puestos",
                icon: BriefcaseBusiness,
            },
            {
                label: "Ambiente laboral",
                href: "ambiente-laboral",
                icon: HeartHandshake,
            },
        ],
        []
    );

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header
            className="sticky top-0 z-40 w-full border-b bg-white"
            style={{ borderColor: `${BRAND_BLUE}22` }}
        >
            <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                {/* Logo + título + subtítulo */}
                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                    <VWLogo logoSrc={vwDark} />

                    <div>
                        <div
                            className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                            style={{ color: BRAND_BLUE }}
                        >
                            Procesos Administrativos
                        </div>
                        <p className="text-xs font-semibold text-slate-500 md:text-sm">
                            Recursos Humanos
                        </p>
                    </div>
                </div>

                {/* Línea azul después del logo/título */}
                <div
                    className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                    style={{ background: BRAND_BLUE }}
                />

                {/* Botones del módulo */}
                <nav className="ml-auto flex max-w-full items-center gap-2 overflow-x-auto py-2">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = isActive(t.href);

                        return (
                            <Link
                                key={t.href}
                                to={t.href}
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
                                    {t.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}